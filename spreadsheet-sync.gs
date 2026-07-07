// ===================================================================
// MetaQ 四柱推命診断アプリ → Googleスプレッドシート 同期スクリプト（汎用版）
//
// このスクリプトは「表示する中身」を一切持ちません。
// アプリが組み立てた完成形の表（値・背景色・太字・タブ色など）を
// そのまま各シートへ貼り付けるだけの、汎用の受け取り役です。
//
// そのため、今後アプリ側で項目や配色・並び順を変更しても、
// このスクリプトを貼り替える必要はありません（貼り替えは初回の一度きり）。
//
// 使い方（初回のみ）:
//   スプレッドシートの「拡張機能 > Apps Script」に貼り付け、
//   ウェブアプリとしてデプロイ（アクセス:全員）します。
//   詳しい手順は SPREADSHEET_SETUP.md を参照してください。
// ===================================================================

// アプリ側(app.js の SHEET_SYNC_TOKEN)と同じ文字列にしてください
const TOKEN = "metaq-uranai-sync";

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ ok: false, error: "invalid json" });
  }
  if (data.token !== TOKEN) {
    return jsonOut({ ok: false, error: "invalid token" });
  }

  // 同時アクセスによる書き込みの衝突を防ぐ
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30 * 1000);
  } catch (err) {
    return jsonOut({ ok: false, error: "busy" });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetsData = data.sheets || [];
    const props = PropertiesService.getScriptProperties();

    // アカウント照合: 最初に同期したアカウントをこのスプレッドシートの
    // 持ち主として記録し、別のアカウントからの同期は拒否する。
    // (別アカウントの空データで持ち主のシートが消されるのを防ぐ)
    if (data.uid) {
      const ownerUid = props.getProperty("ownerUid");
      if (!ownerUid) {
        props.setProperty("ownerUid", data.uid);
      } else if (ownerUid !== data.uid) {
        return jsonOut({ ok: false, error: "different-account" });
      }
    }

    // 所有者の登録・確認だけを行うモード(初期設定用)。シートには一切触れない。
    if (data.claimOnly) {
      return jsonOut({ ok: true, owner: props.getProperty("ownerUid") || null });
    }

    const prevManaged = JSON.parse(props.getProperty("managedSheets") || "[]");
    const currentNames = sheetsData.map(function (s) { return s.name; });

    // アプリから届いた各シートを書き込む。
    // ただし「このスクリプトが作ったのではない、中身のある手作りシート」は
    // 上書きしない(ユーザーがメモ等に使っているシートを勝手に消さないため)。
    var skipped = [];
    sheetsData.forEach(function (info) {
      var existing = ss.getSheetByName(info.name);
      if (existing && prevManaged.indexOf(info.name) === -1 && !isSheetEmpty(existing)) {
        skipped.push(info.name);
        return; // 手作りの使用中シートには触れない
      }
      writeSheet(ss, info);
    });

    // 実際に書き込めたシート名だけを管理対象として記録する
    var writtenNames = currentNames.filter(function (n) { return skipped.indexOf(n) === -1; });

    // 以前このスクリプトが作成し、今回送られてこなかったシート
    // (=アプリ側で削除されたグループ)を削除する。
    // uidが無い(古いバージョンのアプリからの)送信では、安全のため削除しない。
    if (data.uid) {
      prevManaged.forEach(function (name) {
        if (writtenNames.indexOf(name) === -1) {
          const sheet = ss.getSheetByName(name);
          if (sheet && ss.getSheets().length > 1) ss.deleteSheet(sheet);
        }
      });
    }
    props.setProperty("managedSheets", JSON.stringify(writtenNames));

    return jsonOut({ ok: true, sheets: writtenNames.length, skipped: skipped });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// アプリから届いた完成形の表を、解釈せずそのまま1シートへ書き込む。
// info.values / backgrounds / fontWeights / fontColors は同じ行列サイズで渡ってくる。
function writeSheet(ss, info) {
  let sheet = ss.getSheetByName(info.name);
  if (!sheet) sheet = ss.insertSheet(info.name);
  sheet.clear(); // 値も書式もいったんリセット

  const values = info.values || [];
  const numRows = values.length;
  const numCols = numRows ? values[0].length : 0;

  if (numRows && numCols) {
    const range = sheet.getRange(1, 1, numRows, numCols);
    range.setValues(rect(values, numRows, numCols, ""));
    if (info.backgrounds) range.setBackgrounds(rect(info.backgrounds, numRows, numCols, null));
    if (info.fontWeights) range.setFontWeights(rect(info.fontWeights, numRows, numCols, "normal"));
    if (info.fontColors)  range.setFontColors(rect(info.fontColors, numRows, numCols, null));
    if (info.autoResize)  sheet.autoResizeColumns(1, numCols);
  }
  if (info.frozenRows) sheet.setFrozenRows(info.frozenRows);
  try { sheet.setTabColor(info.tabColor || null); } catch (err) {}
}

// シートが空か(データ範囲に中身が無いか)を判定する
function isSheetEmpty(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) return true;
  var values = sheet.getDataRange().getValues();
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      if (String(values[r][c]).trim() !== "") return false;
    }
  }
  return true;
}

// 二次元配列を numRows x numCols にそろえる(足りない分は fill で補い、はみ出しは切る)
function rect(arr, numRows, numCols, fill) {
  const out = [];
  for (let r = 0; r < numRows; r++) {
    const row = (arr[r] || []).slice(0, numCols);
    while (row.length < numCols) row.push(fill);
    out.push(row);
  }
  return out;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
