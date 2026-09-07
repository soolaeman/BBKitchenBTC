import { getSheetsClient } from './google-sheets-inventory';

export interface PendingSoldReport {
  id?: string;
  timestamp: string;
  sku: string;
  productTitle: string;
  lokasiGudang: string;
  dealPrice: number;
  reportedBy: string;
  notes: string;
  status: 'PENDING' | 'EXECUTED' | 'DISMISSED';
}

export const LAPORAN_TERJUAL_SHEET_NAME = 'LAPORAN_TERJUAL';

let isSheetEnsured = false;
let sheetIdCache: number | null = null;

export async function ensureLaporanTerjualSheetExists(spreadsheetId: string): Promise<number | null> {
  if (isSheetEnsured && sheetIdCache !== null) return sheetIdCache;

  try {
    const sheets = getSheetsClient();
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });

    const targetSheet = (metadata.data.sheets || []).find(
      (s) => s.properties?.title === LAPORAN_TERJUAL_SHEET_NAME
    );

    if (targetSheet && targetSheet.properties?.sheetId !== undefined) {
      sheetIdCache = targetSheet.properties.sheetId;
      isSheetEnsured = true;
      return sheetIdCache;
    }

    // Sheet doesn't exist, create it
    const createRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: LAPORAN_TERJUAL_SHEET_NAME,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
            },
          },
        ],
      },
    });

    const newSheetId = createRes.data.replies?.[0]?.addSheet?.properties?.sheetId ?? null;
    sheetIdCache = newSheetId;

    // Initialize Header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${LAPORAN_TERJUAL_SHEET_NAME}!A1:H1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            'TIMESTAMP',
            'SKU',
            'PRODUCT_TITLE',
            'LOKASI_GUDANG',
            'HARGA_DEAL',
            'PELAPOR',
            'CATATAN',
            'STATUS',
          ],
        ],
      },
    });

    isSheetEnsured = true;
    return sheetIdCache;
  } catch (err) {
    console.warn('Could not ensure LAPORAN_TERJUAL sheet tab:', err);
    return null;
  }
}

export async function getPendingSoldReports(): Promise<PendingSoldReport[]> {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId) return [];

  try {
    await ensureLaporanTerjualSheetExists(spreadsheetId);
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${LAPORAN_TERJUAL_SHEET_NAME}!A2:H`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = res.data.values || [];
    const reports: PendingSoldReport[] = [];

    rows.forEach((r, idx) => {
      const sku = String(r[1] ?? '').trim();
      if (!sku) return;

      const rawPrice = String(r[4] ?? '').replace(/[^0-9.-]/g, '');
      const dealPrice = Number(rawPrice) || 0;

      reports.push({
        id: `report_${sku}_${idx}`,
        timestamp: String(r[0] ?? '').trim(),
        sku,
        productTitle: String(r[2] ?? '').trim(),
        lokasiGudang: String(r[3] ?? '').trim(),
        dealPrice,
        reportedBy: String(r[5] ?? 'Sales Desk').trim(),
        notes: String(r[6] ?? '').trim(),
        status: (String(r[7] ?? 'PENDING').trim().toUpperCase() as any) || 'PENDING',
      });
    });

    return reports.filter((rep) => rep.status === 'PENDING');
  } catch (err) {
    console.warn('Failed to get pending sold reports from Google Sheets:', err);
    return [];
  }
}

export async function addPendingSoldReport(report: {
  sku: string;
  productTitle?: string;
  lokasiGudang?: string;
  dealPrice?: number;
  reportedBy?: string;
  notes?: string;
}): Promise<boolean> {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId) return false;

  try {
    await ensureLaporanTerjualSheetExists(spreadsheetId);
    const sheets = getSheetsClient();

    const now = new Date();
    const datePart = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    const timestampStr = `${datePart}, ${timePart}`;

    const newRow = [
      timestampStr,
      report.sku.trim(),
      report.productTitle?.trim() || '',
      report.lokasiGudang?.trim() || '',
      report.dealPrice || 0,
      report.reportedBy?.trim() || 'Sales Desk',
      report.notes?.trim() || '',
      'PENDING',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${LAPORAN_TERJUAL_SHEET_NAME}!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });

    return true;
  } catch (err) {
    console.warn('Failed to append pending sold report to Google Sheets:', err);
    return false;
  }
}

export async function removePendingSoldReport(sku: string): Promise<boolean> {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId || !sku) return false;

  try {
    const sheetId = await ensureLaporanTerjualSheetExists(spreadsheetId);
    if (sheetId === null) return false;

    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${LAPORAN_TERJUAL_SHEET_NAME}!A2:B`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = res.data.values || [];
    const cleanTargetSku = sku.trim().toUpperCase();

    // Find all 0-indexed row numbers (A2 is row index 1)
    const matchingRowIndices: number[] = [];
    rows.forEach((r, idx) => {
      const rowSku = String(r[1] ?? '').trim().toUpperCase();
      if (rowSku === cleanTargetSku) {
        matchingRowIndices.push(idx + 1); // Row index in sheet (0-indexed: header is 0, A2 is 1)
      }
    });

    if (matchingRowIndices.length === 0) return true;

    // Delete matching rows in reverse order so indexes don't shift
    matchingRowIndices.sort((a, b) => b - a);

    const deleteRequests = matchingRowIndices.map((rowIndex) => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: deleteRequests,
      },
    });

    return true;
  } catch (err) {
    console.warn(`Failed to remove pending sold report for SKU ${sku}:`, err);
    return false;
  }
}
