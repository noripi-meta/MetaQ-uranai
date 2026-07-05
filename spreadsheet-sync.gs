// ===================================================================
// MetaQ 四柱推命診断アプリ → Googleスプレッドシート 同期スクリプト
//
// このファイルの内容を、連携したいスプレッドシートの
// 「拡張機能 > Apps Script」に貼り付けて、Webアプリとしてデプロイします。
// 詳しい手順は リポジトリの SPREADSHEET_SETUP.md を参照してください。
//
// アプリから診断結果の一覧が送られてくると、
// グループごとにシートを作成(なければ自動作成)して全件を書き込みます。
// グループが削除された場合は、対応するシートも自動で削除されます。
// ※このスクリプトが管理するシートは毎回上書きされるため、
//   手動での編集内容は残りません。メモ等は別のシートに書いてください。
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
    const header = data.header || [];
    const sheetsData = data.sheets || [];
    const props = PropertiesService.getScriptProperties();
    const prevManaged = JSON.parse(props.getProperty("managedSheets") || "[]");
    const currentNames = sheetsData.map(function (s) { return s.name; });

    // グループごとのシートを作成・上書き
    sheetsData.forEach(function (info) {
      let sheet = ss.getSheetByName(info.name);
      if (!sheet) sheet = ss.insertSheet(info.name);
      sheet.clearContents();
      const rows = [header].concat((info.rows || []).map(function (r) {
        return padRow(r, header.length);
      }));
      sheet.getRange(1, 1, rows.length, header.length).setValues(rows);
      sheet.setFrozenRows(1);
    });

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

// 行の列数をヘッダーの列数に揃える(不足分は空文字で埋める)
function padRow(row, len) {
  const out = (row || []).slice(0, len);
  while (out.length < len) out.push("");
  return out;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
