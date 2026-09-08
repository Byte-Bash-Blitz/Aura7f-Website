/**
 * Live Google Sheets Integration Utility
 * Supports live iframe embedding, Google Apps Script Webhook auto-syncing,
 * and bulk manual syncs from the Admin Panel.
 */

const STORAGE_KEY_SHEET_URL = 'aura_google_sheet_url';
const STORAGE_KEY_WEBHOOK_URL = 'aura_google_sheet_webhook_url';

export interface GoogleSheetsConfig {
  sheetUrl: string;
  webhookUrl: string;
}

/**
 * Gets saved Google Sheets configuration
 */
export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  return {
    sheetUrl: localStorage.getItem(STORAGE_KEY_SHEET_URL) || '',
    webhookUrl: localStorage.getItem(STORAGE_KEY_WEBHOOK_URL) || ''
  };
}

/**
 * Saves Google Sheets configuration
 */
export function saveGoogleSheetsConfig(config: GoogleSheetsConfig) {
  if (config.sheetUrl !== undefined) {
    localStorage.setItem(STORAGE_KEY_SHEET_URL, config.sheetUrl.trim());
  }
  if (config.webhookUrl !== undefined) {
    localStorage.setItem(STORAGE_KEY_WEBHOOK_URL, config.webhookUrl.trim());
  }
}

/**
 * Converts a standard Google Sheets edit URL into a clean iframe embed URL.
 * e.g., https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing
 * -> https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview
 */
export function getEmbeddableSheetUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // If already pubhtml or preview, return as is
  if (url.includes('/pubhtml') || url.includes('/preview')) {
    return url;
  }

  // Extract Spreadsheet ID
  const matches = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (matches && matches[1]) {
    const spreadsheetId = matches[1];
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/preview`;
  }

  return url;
}

/**
 * Sends a single registration/slot booking payload to the Google Apps Script Webhook URL.
 */
export async function sendDataToGoogleSheetWebhook(webhookUrl: string, payload: any): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Apps Script web app requires no-cors when called from frontend JS
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.error('Failed to post registration to Google Sheet Webhook:', err);
    return false;
  }
}

/**
 * Syncs a batch of slot registrations to the Google Sheets Webhook.
 */
export async function syncBatchToGoogleSheet(webhookUrl: string, rows: any[]): Promise<{ success: number; failed: number }> {
  if (!webhookUrl) throw new Error('Google Sheets Webhook URL is not configured.');

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    const ok = await sendDataToGoogleSheetWebhook(webhookUrl, row);
    if (ok) success++;
    else failed++;
  }

  return { success, failed };
}

/**
 * Google Apps Script Template Code for instant 1-click Sheet creation.
 * Admin can copy and paste this into Google Sheets -> Extensions -> Apps Script.
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// -------------------------------------------------------------
// Live Google Sheets Webhook Script for Aura7f Slot Bookings
// Instructions:
// 1. Open your Google Sheet.
// 2. Go to Extensions > Apps Script.
// 3. Paste this code and click Save (💾).
// 4. Click Deploy > New deployment.
// 5. Select type: "Web app".
// 6. Set "Who has access" to "Anyone".
// 7. Click Deploy, authorize, and copy the Web App URL!
// -------------------------------------------------------------

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Create Header Row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Name", "Email", "Slot Time", "Day", "Reg No", 
        "Department", "Year/Sec", "Clan", "Project Title", "Category", "Description"
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#4F46E5").setFontColor("#FFFFFF");
    }
    
    sheet.appendRow([
      new Date().toLocaleString(),
      data.userName || data.name || "",
      data.userEmail || data.email || "",
      data.slotTime || "-",
      data.day ? "Day " + data.day : "-",
      data.regNo || data.registration_no || "-",
      data.department || "-",
      (data.yearSection || (data.year ? "Yr " + data.year + " " + (data.section || "") : "-")),
      data.clan || "-",
      data.projectTitle || data.project_title || "-",
      data.projectCategory || data.project_category || "-",
      data.projectDescription || data.project_description || "-"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
