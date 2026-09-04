import { google } from 'googleapis';

export type CashflowType = 'PENGELUARAN' | 'PEMASUKAN_LAIN';

export const EXPENSE_CATEGORIES = [
  'LOGISTIK & KIRIM',
  'OPERASIONAL & IT',
  'GAJI & PRIVE',
  'BAGI HASIL INVESTOR',
  'BIAYA LAINNYA',
] as const;

export const INCOME_CATEGORIES = [
  'KOMISI & REFERRAL',
  'MODAL INVESTOR',
  'PEMASUKAN LAINNYA',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type CashflowCategory = ExpenseCategory | IncomeCategory | string;

export interface CashflowEntry {
  id: string;
  tanggal: string;
  jenisKas: CashflowType;
  kategori: CashflowCategory;
  nominal: number;
  keterangan: string;
  referensiSku?: string;
  dicatatOleh: string;
  rowIndex?: number;
}

export interface CashflowSummary {
  totalGrossProfit: number;
  totalCommissions: number;
  totalExpenses: number;
  netOperatingProfit: number;
  totalInvestorInflow: number;
  totalInvestorOutflow: number;
  netInvestorPosition: number;
  balanceOnHand: number;
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getSheetsClient() {
  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').replace(/['"]/g, '').trim();
  let privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/['"]/g, '').trim();
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!email || !privateKey) {
    throw new Error('GOOGLE_SHEETS_NOT_CONFIGURED');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

function cleanString(val: any): string {
  return String(val ?? '').trim();
}

function cleanNumber(val: any): number {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

/**
 * Get all cashflow entries from CASHFLOW_EXPENSES worksheet (Columns A to H)
 */
export async function getCashflowEntries(): Promise<CashflowEntry[]> {
  try {
    const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
    if (!spreadsheetId) return [];

    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'CASHFLOW_EXPENSES!A:H',
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = response.data.values ?? [];
    if (rows.length <= 1) return [];

    const entries: CashflowEntry[] = [];

    // Header is row 0 (row 1 in Sheets), data starts at index 1 (row 2 in Sheets)
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const id = cleanString(r[0]);
      const tanggal = cleanString(r[1]);
      const jenisRaw = cleanString(r[2]).toUpperCase();
      const jenisKas: CashflowType = jenisRaw.includes('PEMASUKAN') ? 'PEMASUKAN_LAIN' : 'PENGELUARAN';
      const kategori = cleanString(r[3]) || (jenisKas === 'PENGELUARAN' ? 'BIAYA LAINNYA' : 'PEMASUKAN LAINNYA');
      const nominal = cleanNumber(r[4]);
      const keterangan = cleanString(r[5]);
      const referensiSku = cleanString(r[6]) || undefined;
      const dicatatOleh = cleanString(r[7]) || 'Admin';

      if (id || tanggal || nominal > 0) {
        entries.push({
          id: id || `TX-${tanggal.replace(/-/g, '') || 'AUTO'}-${i}`,
          tanggal: tanggal || new Date().toISOString().split('T')[0],
          jenisKas,
          kategori,
          nominal,
          keterangan,
          referensiSku,
          dicatatOleh,
          rowIndex: i + 1, // 1-indexed row number in Google Sheets
        });
      }
    }

    // Sort newest date first
    entries.sort((a, b) => {
      const dateA = new Date(a.tanggal).getTime() || 0;
      const dateB = new Date(b.tanggal).getTime() || 0;
      return dateB - dateA;
    });

    return entries;
  } catch (error) {
    console.error('Error fetching cashflow entries from Google Sheets:', error);
    return [];
  }
}

/**
 * Append a new cashflow transaction row to CASHFLOW_EXPENSES
 */
export async function addCashflowEntry(entry: {
  tanggal: string;
  jenisKas: CashflowType;
  kategori: string;
  nominal: number;
  keterangan: string;
  referensiSku?: string;
  dicatatOleh?: string;
}): Promise<{ success: boolean; entry?: CashflowEntry; error?: string }> {
  try {
    const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
    if (!spreadsheetId) throw new Error('MISSING_SPREADSHEET_ID');

    const sheets = getSheetsClient();
    const cleanDate = entry.tanggal || new Date().toISOString().split('T')[0];
    const timestampSuffix = Date.now().toString().slice(-4);
    const txId = `TX-${cleanDate.replace(/-/g, '')}-${timestampSuffix}`;
    const author = entry.dicatatOleh || 'Owner / Admin';

    const rowData = [
      txId,
      cleanDate,
      entry.jenisKas,
      entry.kategori,
      entry.nominal,
      entry.keterangan || '-',
      entry.referensiSku || '',
      author,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'CASHFLOW_EXPENSES!A:H',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    });

    const newEntry: CashflowEntry = {
      id: txId,
      tanggal: cleanDate,
      jenisKas: entry.jenisKas,
      kategori: entry.kategori,
      nominal: entry.nominal,
      keterangan: entry.keterangan,
      referensiSku: entry.referensiSku,
      dicatatOleh: author,
    };

    return { success: true, entry: newEntry };
  } catch (error: any) {
    console.error('Error adding cashflow entry:', error);
    return { success: false, error: error.message || 'Failed to append to Google Sheets' };
  }
}

/**
 * Delete a cashflow transaction row by clearing its row in Google Sheets
 */
export async function deleteCashflowEntry(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
    if (!spreadsheetId) throw new Error('MISSING_SPREADSHEET_ID');

    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'CASHFLOW_EXPENSES!A:A',
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = response.data.values ?? [];
    let targetRowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      if (cleanString(rows[i][0]) === id) {
        targetRowIndex = i + 1; // 1-indexed
        break;
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, error: 'Transaction ID not found in Google Sheets' };
    }

    // Clear the specific row A{row}:H{row}
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `CASHFLOW_EXPENSES!A${targetRowIndex}:H${targetRowIndex}`,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting cashflow entry:', error);
    return { success: false, error: error.message || 'Failed to delete row in Google Sheets' };
  }
}
