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
  getDocs,
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
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let resultsUnsub = null;
let groupsUnsub = null;

// ---------- ログインUI制御 ----------
function showLoginScreen() {
  document.getElementById("login-overlay").style.display = "flex";
  document.getElementById("app-content").classList.remove("ready");
}

function showAppScreen(user) {
  document.getElementById("login-overlay").style.display = "none";
  document.getElementById("app-content").classList.add("ready");

  const userBar = document.getElementById("user-bar");
  userBar.style.display = "flex";
  document.getElementById("user-avatar").src = user.photoURL || "";
  document.getElementById("user-name").textContent = user.displayName || user.email || "";
}

// ---------- 認証状態の監視 ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
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
async function doSignIn() {
  const loadingEl = document.getElementById("login-loading");
  loadingEl.textContent = "ログイン中...";
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    // ポップアップがブロックされた場合はリダイレクト方式にフォールバック
    if (err && (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request" || err.code === "auth/popup-closed-by-user")) {
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (err2) {
        loadingEl.textContent = "ログインに失敗しました。もう一度お試しください。";
        console.error(err2);
        return;
      }
    }
    loadingEl.textContent = "ログインに失敗しました。もう一度お試しください。";
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
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

// リダイレクトログインから戻ってきた場合の結果処理
getRedirectResult(auth).catch((err) => console.error("redirect result error", err));

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
    // 新しい順(降順)に並べる: createdAtがあれば使う
    results.sort((a, b) => (b._createdAt || 0) - (a._createdAt || 0));
    window.dispatchEvent(new CustomEvent("metaq:results-updated", { detail: { results } }));
  }, (err) => console.error("results subscribe error", err));

  groupsUnsub = onSnapshot(query(groupsCollection(uid)), (snap) => {
    const groups = [];
    snap.forEach((d) => groups.push({ id: d.id, ...d.data() }));
    groups.sort((a, b) => (a._createdAt || 0) - (b._createdAt || 0));
    window.dispatchEvent(new CustomEvent("metaq:groups-updated", { detail: { groups } }));
  }, (err) => console.error("groups subscribe error", err));
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
