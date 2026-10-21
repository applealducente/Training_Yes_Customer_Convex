/* Paste this into the Google Sheet: Extensions → Apps Script.
   Then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
   Each finished simulator call adds one row to the "Results" tab. */

const SHEET_NAME = "Results";
const COLUMNS = [
  ["timestamp", "Date & Time"],
  ["agent_name", "Agent Name"],
  ["agent_email", "Agent Email"],
  ["team", "Team"],
  ["tl_name", "Team Lead"],
  ["date_hired", "Date Hired"],
  ["result", "Result"],
  ["what_it_is", "Explained: What It Is"],
  ["price", "Explained: Price"],
  ["commitment", "Explained: Commitment"],
  ["free_cleaning", "Explained: Free Cleaning & Hours"],
  ["cte", "Wrong Terms Said"],
  ["missed", "What Was Missed"],
  ["coaching_fix", "Coaching: Fix Next"],
  ["practice_drill", "Practice Drill"],
  ["scenario", "Customer Type"],
  ["call_entry", "Call Opening"],
  ["transcript_summary", "Call Summary"],
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    // Keep the header row in step with COLUMNS, so new columns show up by themselves
    const header = sheet.getRange(1, 1, 1, COLUMNS.length);
    header.setValues([COLUMNS.map(c => c[1])]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    // A leading = + - @ would make Sheets treat the text as a formula
    const row = COLUMNS.map(c => {
      const v = data[c[0]] == null ? "" : String(data[c[0]]);
      return /^[=+\-@]/.test(v) ? "'" + v : v;
    });
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
