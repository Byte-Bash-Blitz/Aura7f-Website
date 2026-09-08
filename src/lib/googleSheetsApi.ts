/**
 * Live Google Sheets Integration Utility
 * Supports Google Service Account API auto-creation (JWT/OAuth),
 * Google Apps Script Webhook auto-syncing, live iframe embedding,
 * and bulk manual syncs from the Admin Panel.
 */

const STORAGE_KEY_SHEET_URL = 'aura_google_sheet_url';
const STORAGE_KEY_WEBHOOK_URL = 'aura_google_sheet_webhook_url';
const STORAGE_KEY_GOOGLE_TOKEN = 'aura_google_access_token';

export interface GoogleSheetsConfig {
  sheetUrl: string;
  webhookUrl: string;
  accessToken?: string;
  serviceAccountEmail?: string;
  serviceAccountPrivateKey?: string;
  myEmail?: string;
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  const envSheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL || '';
  const envWebhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || '';
  const envAccessToken = import.meta.env.VITE_GOOGLE_ACCESS_TOKEN || '';
  const envSaEmail = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const envSaPrivateKey = import.meta.env.VITE_GOOGLE_PRIVATE_KEY || '';
  const envMyEmail = import.meta.env.VITE_GOOGLE_MY_EMAIL || '';

  return {
    sheetUrl: localStorage.getItem(STORAGE_KEY_SHEET_URL) || envSheetUrl,
    webhookUrl: localStorage.getItem(STORAGE_KEY_WEBHOOK_URL) || envWebhookUrl,
    accessToken: localStorage.getItem(STORAGE_KEY_GOOGLE_TOKEN) || envAccessToken,
    serviceAccountEmail: envSaEmail,
    serviceAccountPrivateKey: envSaPrivateKey,
    myEmail: envMyEmail
  };
}

/**
 * Saves Google Sheets configuration locally
 */
export function saveGoogleSheetsConfig(config: Partial<GoogleSheetsConfig>) {
  if (config.sheetUrl !== undefined) {
    localStorage.setItem(STORAGE_KEY_SHEET_URL, config.sheetUrl.trim());
  }
  if (config.webhookUrl !== undefined) {
    localStorage.setItem(STORAGE_KEY_WEBHOOK_URL, config.webhookUrl.trim());
  }
  if (config.accessToken !== undefined) {
    localStorage.setItem(STORAGE_KEY_GOOGLE_TOKEN, config.accessToken.trim());
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
 * Base64URL helper
 */
function base64url(source: ArrayBuffer | string): string {
  let encoded = typeof source === 'string'
    ? btoa(source)
    : btoa(String.fromCharCode(...new Uint8Array(source)));
  return encoded.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Generates a Google OAuth Access Token from Service Account Credentials using Web Crypto API.
 * Exactly like App Passwords for sending emails!
 */
export async function getAccessTokenFromServiceAccount(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const cleanPem = privateKeyPem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const binaryDer = Uint8Array.from(atob(cleanPem), c => c.charCodeAt(0));

  const cryptoKey = await window.crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaimSet = base64url(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const encoder = new TextEncoder();
  const signatureBuffer = await window.crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const jwt = `${signatureInput}.${base64url(signatureBuffer)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const resJson = await response.json();
  if (!response.ok) {
    throw new Error(resJson.error_description || resJson.error || 'Failed to authenticate Service Account with Google');
  }

  return resJson.access_token;
}

/**
 * Sends a single registration payload to the Google Apps Script Webhook URL.
 */
export async function sendDataToGoogleSheetWebhook(webhookUrl: string, payload: any): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
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
 * Automatically creates a brand-new Google Sheet via Google API (Service Account / OAuth Token) or Apps Script.
 * Shares the sheet directly with your Google Account so it appears in your Google Drive!
 */
export async function autoCreateGoogleSheetViaApi(
  eventTitle: string,
  overrideWebhookUrl?: string,
  overrideToken?: string
): Promise<{ sheetUrl: string; embedUrl: string; webhookUrl?: string }> {

  const config = getGoogleSheetsConfig();
  let token = overrideToken || config.accessToken;

  // 1. If Service Account Email and Private Key are configured in .env, auto-sign JWT token!
  if (!token && config.serviceAccountEmail && config.serviceAccountPrivateKey) {
    try {
      token = await getAccessTokenFromServiceAccount(config.serviceAccountEmail, config.serviceAccountPrivateKey);
    } catch (saErr: any) {
      console.warn('Service Account auth failed:', saErr.message);
    }
  }

  // 2. If token is available, create spreadsheet via Google Sheets v4 API!
  if (token) {
    try {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `${eventTitle} - Slot Registrations`
          },
          sheets: [
            {
              properties: {
                title: 'Slot Bookings',
                gridProperties: { frozenRowCount: 1 }
              },
              data: [
                {
                  startRow: 0,
                  startColumn: 0,
                  rowData: [
                    {
                      values: [
                        { userEnteredValue: { stringValue: 'Timestamp' } },
                        { userEnteredValue: { stringValue: 'Name' } },
                        { userEnteredValue: { stringValue: 'Email' } },
                        { userEnteredValue: { stringValue: 'Slot Time' } },
                        { userEnteredValue: { stringValue: 'Day' } },
                        { userEnteredValue: { stringValue: 'Reg No' } },
                        { userEnteredValue: { stringValue: 'Department' } },
                        { userEnteredValue: { stringValue: 'Year/Sec' } },
                        { userEnteredValue: { stringValue: 'Clan' } },
                        { userEnteredValue: { stringValue: 'Project Title' } },
                        { userEnteredValue: { stringValue: 'Category' } },
                        { userEnteredValue: { stringValue: 'Description' } }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        })
      });

      if (!createRes.ok) {
        const errJson = await createRes.json();
        throw new Error(errJson.error?.message || 'Google Sheets API creation error');
      }

      const resData = await createRes.json();
      const spreadsheetId = resData.spreadsheetId;
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      const embedUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/preview`;

      // 3. Share spreadsheet with user's personal/org Gmail address so it appears in their Google Drive!
      const userEmail = config.myEmail || localStorage.getItem('aura_my_gmail');
      if (userEmail) {
        try {
          await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              role: 'writer',
              type: 'user',
              emailAddress: userEmail
            })
          });
        } catch (shareErr) {
          console.warn('Sharing with user email notice:', shareErr);
        }
      }

      // Also share with anyone with link read access for iframe embedding
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone'
          })
        });
      } catch (e) {}

      saveGoogleSheetsConfig({ sheetUrl, accessToken: token });
      return { sheetUrl, embedUrl };
    } catch (err: any) {
      console.warn('Google Sheets API auto-create error:', err.message);
    }
  }

  // 4. Alternative: Deployed Apps Script Master Webhook Endpoint
  const webhook = overrideWebhookUrl || config.webhookUrl;
  if (webhook) {
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'CREATE_SHEET',
          title: `${eventTitle} - Slot Registrations`
        })
      });

      const resData = await response.json();
      if (resData.spreadsheetUrl) {
        saveGoogleSheetsConfig({
          sheetUrl: resData.spreadsheetUrl,
          webhookUrl: resData.webhookUrl || webhook
        });
        return {
          sheetUrl: resData.spreadsheetUrl,
          embedUrl: resData.embedUrl || getEmbeddableSheetUrl(resData.spreadsheetUrl),
          webhookUrl: resData.webhookUrl || webhook
        };
      }
    } catch (err) {
      console.warn('Webhook auto-create endpoint failed:', err);
    }
  }

  throw new Error('Please set VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL & VITE_GOOGLE_PRIVATE_KEY or VITE_GOOGLE_SHEET_WEBHOOK_URL in .env to auto-create spreadsheets.');
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
 * Enhanced Google Apps Script Template with 1-Click Auto-Creation Web Endpoint support!
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// -------------------------------------------------------------
// Live Google Sheets Webhook & Auto-Creator Script
// -------------------------------------------------------------

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // ACTION 1: AUTO-CREATE SHEET VIA API
    if (data.action === "CREATE_SHEET") {
      var title = data.title || "Aura7f Event Registrations";
      var ss = SpreadsheetApp.create(title);
      var sheet = ss.getActiveSheet();
      
      sheet.appendRow([
        "Timestamp", "Name", "Email", "Slot Time", "Day", "Reg No", 
        "Department", "Year/Sec", "Clan", "Project Title", "Category", "Description"
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#4F46E5").setFontColor("#FFFFFF");
      
      try {
        var file = DriveApp.getFileById(ss.getId());
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
      } catch(driveErr) {}

      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        spreadsheetUrl: ss.getUrl(),
        spreadsheetId: ss.getId(),
        embedUrl: "https://docs.google.com/spreadsheets/d/" + ss.getId() + "/preview"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ACTION 2: APPEND RECORD TO SHEET
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
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
