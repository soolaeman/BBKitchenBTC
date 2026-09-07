import { getSheetsClient } from './google-sheets-inventory';

export interface SoldNotice {
  id: string;
  sku: string;
  dealPrice?: number;
  notes?: string;
  reportedAt: string;
  reportedBy?: string;
}

export interface AuditSystemState {
  timestamps: Record<string, string>;
  activeSku: string | null;
  soldNotices: SoldNotice[];
}

const AUDIT_SHEET_NAME = 'SYSTEM_AUDIT_STATE';

const cachedState: AuditSystemState = {
  timestamps: {},
  activeSku: null,
  soldNotices: [],
};

let lastFetchTime = 0;
const CACHE_TTL_MS = 2500; // 2.5s TTL for snappy responses
let isSheetEnsured = false;

async function ensureAuditSheetExists(spreadsheetId: string) {
  if (isSheetEnsured) return;
  try {
    const sheets = getSheetsClient();
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    });

    const sheetTitles = (metadata.data.sheets || []).map((s) => s.properties?.title);
    if (!sheetTitles.includes(AUDIT_SHEET_NAME)) {
      // 1. Create tab
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: AUDIT_SHEET_NAME,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
              },
            },
          ],
        },
      });

      // 2. Initialize default rows
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${AUDIT_SHEET_NAME}!A1:C4`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            ['KEY', 'VALUE', 'UPDATED_AT'],
            ['AUDIT_TIMESTAMPS', '{}', new Date().toISOString()],
            ['ACTIVE_SKU', '', new Date().toISOString()],
            ['SOLD_NOTICES', '[]', new Date().toISOString()],
          ],
        },
      });
    }
    isSheetEnsured = true;
  } catch (err) {
    console.warn('Could not auto-create SYSTEM_AUDIT_STATE sheet tab:', err);
  }
}

export async function getPersistentAuditState(): Promise<AuditSystemState> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS && Object.keys(cachedState.timestamps).length > 0) {
    return cachedState;
  }

  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId) return cachedState;

  try {
    await ensureAuditSheetExists(spreadsheetId);
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${AUDIT_SHEET_NAME}!A2:C4`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = res.data.values || [];
    for (const r of rows) {
      const key = String(r[0] || '').trim();
      const val = String(r[1] || '').trim();

      if (key === 'AUDIT_TIMESTAMPS' && val) {
        try {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === 'object') {
            cachedState.timestamps = { ...cachedState.timestamps, ...parsed };
          }
        } catch {}
      } else if (key === 'ACTIVE_SKU') {
        cachedState.activeSku = val || null;
      } else if (key === 'SOLD_NOTICES' && val) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            cachedState.soldNotices = parsed;
          }
        } catch {}
      }
    }
    lastFetchTime = now;
  } catch (err) {
    console.warn('Failed to read SYSTEM_AUDIT_STATE from Google Sheets:', err);
  }

  return cachedState;
}

export async function savePersistentAuditState(
  updates: Partial<AuditSystemState>
): Promise<AuditSystemState> {
  if (updates.timestamps) {
    cachedState.timestamps = { ...cachedState.timestamps, ...updates.timestamps };
  }
  if (updates.activeSku !== undefined) {
    cachedState.activeSku = updates.activeSku;
  }
  if (updates.soldNotices !== undefined) {
    cachedState.soldNotices = updates.soldNotices;
  }

  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId) return cachedState;

  try {
    await ensureAuditSheetExists(spreadsheetId);
    const sheets = getSheetsClient();
    const isoNow = new Date().toISOString();

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${AUDIT_SHEET_NAME}!A2:C4`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          ['AUDIT_TIMESTAMPS', JSON.stringify(cachedState.timestamps), isoNow],
          ['ACTIVE_SKU', cachedState.activeSku || '', isoNow],
          ['SOLD_NOTICES', JSON.stringify(cachedState.soldNotices), isoNow],
        ],
      },
    });
  } catch (err) {
    console.warn('Failed to persist SYSTEM_AUDIT_STATE to Google Sheets:', err);
  }

  return cachedState;
}

export async function resetAllAuditState(): Promise<AuditSystemState> {
  cachedState.timestamps = {};
  cachedState.activeSku = null;
  cachedState.soldNotices = [];
  lastFetchTime = Date.now();

  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId) return cachedState;

  try {
    await ensureAuditSheetExists(spreadsheetId);
    const sheets = getSheetsClient();
    const isoNow = new Date().toISOString();

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${AUDIT_SHEET_NAME}!A2:C4`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          ['AUDIT_TIMESTAMPS', '{}', isoNow],
          ['ACTIVE_SKU', '', isoNow],
          ['SOLD_NOTICES', '[]', isoNow],
        ],
      },
    });
  } catch (err) {
    console.warn('Failed to reset SYSTEM_AUDIT_STATE in Google Sheets:', err);
  }

  return cachedState;
}
