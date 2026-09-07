import { Invoice, InvoiceStatus, InvoiceItem, DocumentType } from '@/lib/types/finance';
import { getSheetsClient } from './google-sheets-inventory';

const INVOICE_SHEET_NAME = 'INVOICE_ARCHIVE';
const INVOICE_RANGE = `${INVOICE_SHEET_NAME}!A:AA`;

const INVOICE_HEADERS = [
  'ID',
  'INVOICE_NUMBER',
  'DOC_TYPE',
  'CREATED_AT',
  'CUSTOMER_NAME',
  'CUSTOMER_PHONE',
  'CUSTOMER_ADDRESS',
  'CUSTOMER_COMPANY',
  'ITEMS_JSON',
  'SUBTOTAL',
  'DISCOUNT',
  'SHIPPING_FEE',
  'SHIPPING_FEE_TYPE',
  'TOTAL_AMOUNT',
  'DP_AMOUNT',
  'REMAINING_BALANCE',
  'STATUS',
  'PAID_DATE',
  'PAYMENT_METHOD',
  'DELIVERY_EXPEDITION',
  'DELIVERY_DRIVER',
  'DRIVER_PHONE',
  'DELIVERY_VEHICLE_PLATE',
  'NOTES',
  'QUOTATION_NUMBER',
  'KUITANSI_NUMBER',
  'SURAT_JALAN_NUMBER',
];

let sheetEnsured = false;

async function ensureInvoiceSheetExists(spreadsheetId: string) {
  if (sheetEnsured) return;
  try {
    const sheets = getSheetsClient();
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    });

    const sheetTitles = (metadata.data.sheets || []).map((s) => s.properties?.title);
    if (!sheetTitles.includes(INVOICE_SHEET_NAME)) {
      // Create INVOICE_ARCHIVE tab
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: INVOICE_SHEET_NAME,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
              },
            },
          ],
        },
      });

      // Write Header Row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${INVOICE_SHEET_NAME}!A1:AA1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [INVOICE_HEADERS],
        },
      });
    }
    sheetEnsured = true;
  } catch (err) {
    console.warn('Could not auto-create INVOICE_ARCHIVE sheet tab:', err);
  }
}

function parseItemsJson(raw: string): InvoiceItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fallback if not JSON
  }
  return [];
}

function rowToInvoice(row: any[]): Invoice {
  const v = (idx: number) => String(row[idx] ?? '').trim();
  const num = (idx: number) => {
    const raw = String(row[idx] ?? '').replace(/[^0-9.-]/g, '');
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const items = parseItemsJson(v(8));
  const subtotal = num(9);
  const totalAmount = num(13) || subtotal;

  return {
    id: v(0),
    invoiceNumber: v(1),
    docType: (v(2) || 'INVOICE') as DocumentType,
    createdAt: v(3),
    customerName: v(4),
    customerPhone: v(5),
    customerAddress: v(6),
    customerCompany: v(7),
    items: items.length > 0 ? items : [
      {
        id: 'item_1',
        sku: 'UNIT',
        description: 'Unit Kitchen Equipment',
        quantity: 1,
        unitPrice: totalAmount,
        total: totalAmount,
      }
    ],
    subtotal,
    discount: num(10),
    shippingFee: num(11),
    shippingFeeType: (v(12) || 'INCLUDED') as any,
    totalAmount,
    dpAmount: num(14),
    remainingBalance: num(15),
    status: (v(16) || 'ISSUED') as InvoiceStatus,
    paidDate: v(17) || undefined,
    paymentMethod: (v(18) || 'TRANSFER_JAGO_SYARIAH') as any,
    deliveryExpedition: v(19) || undefined,
    deliveryDriver: v(20) || undefined,
    driverPhone: v(21) || undefined,
    deliveryVehiclePlate: v(22) || undefined,
    notes: v(23) || undefined,
    quotationNumber: v(24) || undefined,
    kuitansiNumber: v(25) || undefined,
    suratJalanNumber: v(26) || undefined,
  };
}

function invoiceToRow(inv: Invoice): any[] {
  return [
    inv.id,
    inv.invoiceNumber,
    inv.docType || 'INVOICE',
    inv.createdAt || new Date().toISOString(),
    inv.customerName || '',
    inv.customerPhone || '',
    inv.customerAddress || '',
    inv.customerCompany || '',
    JSON.stringify(inv.items || []),
    inv.subtotal || 0,
    inv.discount || 0,
    inv.shippingFee || 0,
    inv.shippingFeeType || 'INCLUDED',
    inv.totalAmount || 0,
    inv.dpAmount || 0,
    inv.remainingBalance ?? Math.max(0, (inv.totalAmount || 0) - (inv.dpAmount || 0)),
    inv.status || 'ISSUED',
    inv.paidDate || '',
    inv.paymentMethod || 'TRANSFER_JAGO_SYARIAH',
    inv.deliveryExpedition || '',
    inv.deliveryDriver || '',
    inv.driverPhone || '',
    inv.deliveryVehiclePlate || '',
    inv.notes || '',
    inv.quotationNumber || '',
    inv.kuitansiNumber || '',
    inv.suratJalanNumber || '',
  ];
}

export async function fetchGoogleSheetsInvoices(): Promise<Invoice[]> {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId) return [];

  try {
    await ensureInvoiceSheetExists(spreadsheetId);
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${INVOICE_SHEET_NAME}!A2:AA`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = res.data.values || [];
    return rows
      .filter((r) => Boolean(r[0]))
      .map((r) => rowToInvoice(r))
      .reverse(); // Newest first
  } catch (err) {
    console.warn('Failed to fetch invoices from Google Sheets:', err);
    return [];
  }
}

export async function appendGoogleSheetsInvoice(invoice: Invoice): Promise<boolean> {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId) return false;

  try {
    await ensureInvoiceSheetExists(spreadsheetId);
    const sheets = getSheetsClient();
    const row = invoiceToRow(invoice);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: INVOICE_RANGE,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });

    return true;
  } catch (err) {
    console.error('Failed to append invoice to Google Sheets:', err);
    return false;
  }
}

export async function updateGoogleSheetsInvoiceStatus(
  idOrNumber: string,
  status: InvoiceStatus,
  paidDate?: string
): Promise<boolean> {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId) return false;

  try {
    await ensureInvoiceSheetExists(spreadsheetId);
    const sheets = getSheetsClient();

    // Get column A & B to find the row index
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${INVOICE_SHEET_NAME}!A:B`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = res.data.values || [];
    const targetIdx = rows.findIndex(
      (r, idx) => idx > 0 && (String(r[0]).trim() === idOrNumber || String(r[1]).trim() === idOrNumber)
    );

    if (targetIdx === -1) {
      console.warn(`Invoice ${idOrNumber} not found in Google Sheets`);
      return false;
    }

    const sheetRowNumber = targetIdx + 1;
    const finalPaidDate = paidDate || (status === 'PAID' ? new Date().toISOString().split('T')[0] : '');

    // Update Column Q (STATUS) and Column R (PAID_DATE)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${INVOICE_SHEET_NAME}!Q${sheetRowNumber}:R${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[status, finalPaidDate]],
      },
    });

    return true;
  } catch (err) {
    console.error('Failed to update invoice status in Google Sheets:', err);
    return false;
  }
}
