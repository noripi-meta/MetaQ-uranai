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
    const prevManaged = JSON.parse(props.getProperty("managedSheets") || "[]");
    const currentNames = sheetsData.map(function (s) { return s.name; });

    // アプリから届いた各シートを書き込む
    sheetsData.forEach(function (info) { writeSheet(ss, info); });

    // 以前このスクリプトが作成し、今回送られてこなかったシート
    // (=アプリ側で削除されたグループ)を削除する
    prevManaged.forEach(function (name) {
      if (currentNames.indexOf(name) === -1) {
        const sheet = ss.getSheetByName(name);
        if (sheet && ss.getSheets().length > 1) ss.deleteSheet(sheet);
      }
    });
    props.setProperty("managedSheets", JSON.stringify(currentNames));

    return jsonOut({ ok: true, sheets: currentNames.length });
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
