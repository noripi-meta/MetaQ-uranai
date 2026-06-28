// ===================================================================
// Firebase 連携モジュール（認証 + Firestore データ永続化）
// type="module" の<script>内で読み込み、window経由でapp.jsから呼び出す
// ===================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCkc0uLgQjUKckjU2uFyLIjPhmKmzGhQGs",
  authDomain: "metaq-uranai.firebaseapp.com",
  projectId: "metaq-uranai",
  storageBucket: "metaq-uranai.firebasestorage.app",
  messagingSenderId: "867275409373",
  appId: "1:867275409373:web:72838f92c2c9fac18ad834"
};

const app = initializeApp(firebaseConfig);
// Firebase標準のgetAuthを使う(ブラウザに応じて適切な永続化方式が自動選択される)
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let resultsUnsub = null;
let groupsUnsub = null;
let domReady = false;
let pendingLoginMessage = null; // DOM準備前にエラーが来た場合に保留しておく

// ---------- ログインUI制御 ----------
function showLoginScreen() {
  const overlay = document.getElementById("login-overlay");
  const content = document.getElementById("app-content");
  if (overlay) overlay.style.display = "flex";
  if (content) content.classList.remove("ready");
}

function showAppScreen(user) {
  const overlay = document.getElementById("login-overlay");
  const content = document.getElementById("app-content");
  if (overlay) overlay.style.display = "none";
  if (content) content.classList.add("ready");

  const userBar = document.getElementById("user-bar");
  if (userBar) {
    userBar.style.display = "flex";
    const avatar = document.getElementById("user-avatar");
    const nameEl = document.getElementById("user-name");
    if (avatar) avatar.src = user.photoURL || "";
    if (nameEl) nameEl.textContent = user.displayName || user.email || "";
  }
}

function setLoginMessage(text) {
  const loadingEl = document.getElementById("login-loading");
  if (loadingEl) {
    loadingEl.textContent = text;
  } else {
    // DOMがまだ準備できていない場合は保留し、DOMContentLoaded後に表示する
    pendingLoginMessage = text;
  }
}

// Firebaseのエラーコードを、ユーザー向けの分かりやすい日本語メッセージに変換
function friendlyErrorMessage(err) {
  const code = err && err.code ? err.code : "";
  const map = {
    "auth/network-request-failed": "通信エラーが発生しました。電波の良い場所で再度お試しください。",
    "auth/too-many-requests": "アクセスが集中しています。少し時間をおいて再度お試しください。",
    "auth/user-disabled": "このアカウントは現在ご利用いただけません。",
    "auth/popup-blocked": "ポップアップがブロックされました。もう一度お試しください。",
    "auth/cancelled-popup-request": "", // ユーザー操作によるキャンセルなのでメッセージ不要
    "auth/popup-closed-by-user": "", // ユーザー操作によるキャンセルなのでメッセージ不要
  };
  if (code in map) return map[code];
  return "ログインに失敗しました。もう一度お試しください。";
}

// ---------- 認証状態の監視 ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    clearRedirectInProgressFlag();
    showAppScreen(user);
    window.dispatchEvent(new CustomEvent("metaq:auth-ready", { detail: { uid: user.uid } }));
    subscribeToData(user.uid);
  } else {
    currentUser = null;
    showLoginScreen();
    if (resultsUnsub) { resultsUnsub(); resultsUnsub = null; }
    if (groupsUnsub) { groupsUnsub(); groupsUnsub = null; }
  }
});

// ---------- ログイン/ログアウト操作 ----------
const REDIRECT_FLAG_KEY = "metaq_redirect_in_progress";

function setRedirectInProgressFlag() {
  try { sessionStorage.setItem(REDIRECT_FLAG_KEY, "1"); } catch (e) {}
}
function clearRedirectInProgressFlag() {
  try { sessionStorage.removeItem(REDIRECT_FLAG_KEY); } catch (e) {}
}
function isRedirectInProgress() {
  try { return sessionStorage.getItem(REDIRECT_FLAG_KEY) === "1"; } catch (e) { return false; }
}

async function doSignIn() {
  // 既にリダイレクト中(戻ってきて結果待ちの状態)であれば、二重にログイン処理を開始しない
  if (isRedirectInProgress()) {
    setLoginMessage("ログイン処理中です。少々お待ちください...");
    return;
  }

  setLoginMessage("ログイン中...");

  try {
    await signInWithPopup(auth, provider);
    setLoginMessage("");
  } catch (err) {
    console.error("signInWithPopup failed:", err);
    if (err && (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request")) {
      // ユーザー自身がポップアップを閉じた場合は何もしない
      setLoginMessage("");
      return;
    }
    // ポップアップが使えない環境(ブロック、スタンドアロンモード等)はリダイレクト方式にフォールバック
    try {
      setRedirectInProgressFlag();
      await signInWithRedirect(auth, provider);
    } catch (err2) {
      console.error("signInWithRedirect fallback failed:", err2);
      clearRedirectInProgressFlag();
      setLoginMessage(friendlyErrorMessage(err2));
    }
  }
}

// リダイレクトログインから戻ってきた場合の結果処理
getRedirectResult(auth)
  .then((result) => {
    clearRedirectInProgressFlag();
    // resultがnullの場合はリダイレクトログイン以外の通常読み込み(onAuthStateChangedが処理する)
  })
  .catch((err) => {
    console.error("getRedirectResult failed:", err);
    clearRedirectInProgressFlag();
    setLoginMessage(friendlyErrorMessage(err));
  });

document.addEventListener("DOMContentLoaded", () => {
  domReady = true;
  if (pendingLoginMessage !== null) {
    setLoginMessage(pendingLoginMessage);
    pendingLoginMessage = null;
  }

  const btn = document.getElementById("google-signin-btn");
  if (btn) btn.addEventListener("click", doSignIn);

  const signoutBtn = document.getElementById("signout-btn");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", async () => {
      if (confirm("ログアウトしますか？")) {
        await signOut(auth);
      }
    });
  }
});

// ---------- Firestore データ永続化 ----------
// パス構造: users/{uid}/results/{resultId}, users/{uid}/groups/{groupId}

function resultsCollection(uid) {
  return collection(db, "users", uid, "results");
}
function groupsCollection(uid) {
  return collection(db, "users", uid, "groups");
}

// リアルタイム購読: 変更があるたびにapp.js側へイベントで通知
function subscribeToData(uid) {
  if (resultsUnsub) resultsUnsub();
  if (groupsUnsub) groupsUnsub();

  resultsUnsub = onSnapshot(query(resultsCollection(uid)), (snap) => {
    const results = [];
    snap.forEach((d) => results.push({ id: d.id, ...d.data() }));
    // 新しい順(降順)に並べる
    results.sort((a, b) => (b._createdAt || 0) - (a._createdAt || 0));
    window.dispatchEvent(new CustomEvent("metaq:results-updated", { detail: { results } }));
  }, (err) => console.error("results subscribe error:", err));

  groupsUnsub = onSnapshot(query(groupsCollection(uid)), (snap) => {
    const groups = [];
    snap.forEach((d) => groups.push({ id: d.id, ...d.data() }));
    groups.sort((a, b) => (a._createdAt || 0) - (b._createdAt || 0));
    window.dispatchEvent(new CustomEvent("metaq:groups-updated", { detail: { groups } }));
  }, (err) => console.error("groups subscribe error:", err));
}

// ---------- 書き込みAPI（app.js から window.metaqFirestore.xxx() で呼ぶ） ----------
async function saveResult(entry) {
  if (!currentUser) return null;
  const id = entry.id || ("r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8));
  const payload = { ...entry, id, _createdAt: entry._createdAt || Date.now() };
  await setDoc(doc(resultsCollection(currentUser.uid), id), payload);
  return id;
}

async function deleteResult(id) {
  if (!currentUser) return;
  await deleteDoc(doc(resultsCollection(currentUser.uid), id));
}

async function saveGroup(group) {
  if (!currentUser) return null;
  const id = group.id || ("g_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6));
  const payload = { ...group, id, _createdAt: group._createdAt || Date.now() };
  await setDoc(doc(groupsCollection(currentUser.uid), id), payload);
  return id;
}

async function deleteGroup(id) {
  if (!currentUser) return;
  await deleteDoc(doc(groupsCollection(currentUser.uid), id));
}

// app.js からアクセスできるようグローバルに公開
window.metaqFirestore = {
  saveResult,
  deleteResult,
  saveGroup,
  deleteGroup,
  getCurrentUser: () => currentUser
};
