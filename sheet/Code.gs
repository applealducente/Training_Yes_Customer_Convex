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
  ["overall_score", "Score (out of 100)"],
  ["cte", "Wrong Terms (CTE)"],
  ["rapport", "Rapport /5"],
  ["discovery", "Discovery /10"],
  ["recommendation", "Recommendation /10"],
  ["pitch_quality", "Pitch /20"],
  ["terms_accuracy", "Terms Accuracy /25"],
  ["features_benefits", "Features & Benefits /10"],
  ["clarification", "Answering Questions /5"],
  ["closing", "Closing /15"],
  ["scenario", "Customer Type"],
  ["call_entry", "Call Opening"],
  ["primary_gap", "Main Thing to Work On"],
  ["transcript_summary", "Call Transcript"],
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS.map(c => c[1]));
      sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
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
