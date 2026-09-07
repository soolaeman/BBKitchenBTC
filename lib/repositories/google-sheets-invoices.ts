import { Invoice, InvoiceStatus, InvoiceItem, DocumentType, PaymentRecord } from '@/lib/types/finance';
import { getSheetsClient, updateGoogleSheetsStockStatus } from './google-sheets-inventory';

const INVOICE_SHEET_NAME = 'INVOICE_ARCHIVE';
const INVOICE_RANGE = `${INVOICE_SHEET_NAME}!A:AB`;

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
  'PAYMENTS_JSON',
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
        range: `${INVOICE_SHEET_NAME}!A1:AB1`,
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

function parsePaymentsJson(raw: string, fallbackDp: number, date: string): PaymentRecord[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  if (fallbackDp > 0) {
    return [
      {
        id: 'pay_1',
        label: 'Pembayaran 1 (DP)',
        amount: fallbackDp,
        date: date,
        method: 'TRANSFER_JAGO_SYARIAH',
      },
    ];
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
  const rawDate = v(3) || new Date().toISOString().split('T')[0];
  const dpVal = num(14);
  const payments = parsePaymentsJson(v(27), dpVal, rawDate);
  const totalPaid = payments.length > 0
    ? payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
    : dpVal;

  return {
    id: v(0),
    invoiceNumber: v(1),
    documentType: (v(2) || 'INVOICE') as DocumentType,
    issueDate: rawDate,
    dueDate: rawDate,
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
    tax: 0,
    shippingFee: num(11),
    shippingFeeType: (v(12) || 'BUYER_COD') as any,
    hasShipping: v(12) !== 'NO_SHIPPING' && Boolean(v(11) || v(19) || v(20)),
    totalAmount,
    dpAmount: totalPaid,
    remainingAmount: Math.max(0, totalAmount - totalPaid),
    payments,
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
    createdBy: 'ADMIN',
  };
}

function invoiceToRow(inv: Invoice): any[] {
  const totalPaid = (inv.payments && inv.payments.length > 0)
    ? inv.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
    : (inv.dpAmount || 0);

  return [
    inv.id,
    inv.invoiceNumber,
    inv.documentType || 'INVOICE',
    inv.issueDate || new Date().toISOString().split('T')[0],
    inv.customerName || '',
    inv.customerPhone || '',
    inv.customerAddress || '',
    inv.customerCompany || '',
    JSON.stringify(inv.items || []),
    inv.subtotal || 0,
    inv.discount || 0,
    inv.shippingFee || 0,
    inv.hasShipping ? (inv.shippingFeeType || 'BUYER_COD') : 'NO_SHIPPING',
    inv.totalAmount || 0,
    totalPaid,
    inv.remainingAmount ?? Math.max(0, (inv.totalAmount || 0) - totalPaid),
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
    JSON.stringify(inv.payments || []),
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
      range: `${INVOICE_SHEET_NAME}!A2:AB`,
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

async function syncInvoiceItemsToSold(invoice: Invoice) {
  if (invoice.status !== 'PAID' || !invoice.items || invoice.items.length === 0) return;
  for (const it of invoice.items) {
    const sku = (it.sku || '').trim().toUpperCase();
    if (sku && sku !== 'UNIT' && !sku.startsWith('BBK-CUSTOM') && !sku.startsWith('INV-')) {
      try {
        await updateGoogleSheetsStockStatus({
          sku,
          status: 'SOLD',
          dealPrice: it.unitPrice,
          notes: `Auto-marked from PAID Invoice #${invoice.invoiceNumber || invoice.id}`,
        });
      } catch (e) {
        console.warn(`Could not auto-mark SKU ${sku} as SOLD:`, e);
      }
    }
  }
}

async function syncInvoiceItemsToReady(invoice: Invoice) {
  if (!invoice.items || invoice.items.length === 0) return;
  for (const it of invoice.items) {
    const sku = (it.sku || '').trim().toUpperCase();
    if (sku && sku !== 'UNIT' && !sku.startsWith('BBK-CUSTOM') && !sku.startsWith('INV-')) {
      try {
        await updateGoogleSheetsStockStatus({
          sku,
          status: 'READY',
          notes: `Reverted to READY (Invoice #${invoice.invoiceNumber || invoice.id} reset to UNPAID/Deleted)`,
        });
      } catch (e) {
        console.warn(`Could not revert SKU ${sku} to READY:`, e);
      }
    }
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

    if (invoice.status === 'PAID') {
      syncInvoiceItemsToSold(invoice).catch((err) =>
        console.warn('Background auto-mark SOLD error:', err)
      );
    }

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

export async function updateGoogleSheetsInvoice(invoice: Invoice): Promise<boolean> {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId) return false;

  try {
    await ensureInvoiceSheetExists(spreadsheetId);
    const sheets = getSheetsClient();

    // Get column A to AB to find row index and existing invoice details
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${INVOICE_SHEET_NAME}!A:AB`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = res.data.values || [];
    const targetIdx = rows.findIndex(
      (r, idx) => idx > 0 && (String(r[0]).trim() === invoice.id || String(r[1]).trim() === invoice.invoiceNumber)
    );

    if (targetIdx === -1) {
      return appendGoogleSheetsInvoice(invoice);
    }

    const existingRow = rows[targetIdx];
    const existingInvoice = rowToInvoice(existingRow);
    const sheetRowNumber = targetIdx + 1;
    const row = invoiceToRow(invoice);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${INVOICE_SHEET_NAME}!A${sheetRowNumber}:AB${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    // Handle differential stock status updates for multi-item invoices
    const oldItems = existingInvoice.items || [];
    const newItems = invoice.items || [];
    const oldSkus = oldItems
      .map((i) => (i.sku || '').trim().toUpperCase())
      .filter((s) => s && s !== 'UNIT' && !s.startsWith('BBK-CUSTOM') && !s.startsWith('INV-'));
    const newSkus = newItems
      .map((i) => (i.sku || '').trim().toUpperCase())
      .filter((s) => s && s !== 'UNIT' && !s.startsWith('BBK-CUSTOM') && !s.startsWith('INV-'));

    if (invoice.status === 'PAID') {
      // 1. Revert SKUs that were in the previous invoice but REMOVED in the updated invoice
      const removedSkus = oldSkus.filter((s) => !newSkus.includes(s));
      for (const sku of removedSkus) {
        updateGoogleSheetsStockStatus({
          sku,
          status: 'READY',
          notes: `Reverted to READY (Removed from updated Invoice #${invoice.invoiceNumber || invoice.id})`,
        }).catch((e) => console.warn(`Could not revert removed SKU ${sku}:`, e));
      }

      // 2. Mark ALL current SKUs in the invoice as SOLD
      syncInvoiceItemsToSold(invoice).catch((err) =>
        console.warn('Background auto-mark SOLD error:', err)
      );
    } else {
      // If invoice was updated to unpaid / DP only, revert all old & new units back to READY
      const allSkusToRevert = Array.from(new Set([...oldSkus, ...newSkus]));
      for (const sku of allSkusToRevert) {
        updateGoogleSheetsStockStatus({
          sku,
          status: 'READY',
          notes: `Reverted to READY (Invoice #${invoice.invoiceNumber || invoice.id} reset to ${invoice.status})`,
        }).catch((e) => console.warn(`Could not revert SKU ${sku} to READY:`, e));
      }
    }

    return true;
  } catch (err) {
    console.error('Failed to update full invoice in Google Sheets:', err);
    return false;
  }
}

export async function deleteGoogleSheetsInvoice(idOrNumber: string): Promise<boolean> {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').replace(/['"]/g, '').trim();
  if (!spreadsheetId) return false;

  try {
    await ensureInvoiceSheetExists(spreadsheetId);
    const sheets = getSheetsClient();

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });
    const sheetObj = (metadata.data.sheets || []).find(
      (s) => s.properties?.title === INVOICE_SHEET_NAME
    );
    const sheetId = sheetObj?.properties?.sheetId;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${INVOICE_SHEET_NAME}!A2:AB`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const rows = res.data.values || [];
    const targetIdx = rows.findIndex(
      (r) => String(r[0]).trim() === idOrNumber || String(r[1]).trim() === idOrNumber
    );

    if (targetIdx === -1) {
      return false;
    }

    const targetRow = rows[targetIdx];
    const existingInvoice = rowToInvoice(targetRow);

    // If deleted invoice was marked PAID, automatically revert units back to READY in Master Inventory!
    if (existingInvoice && existingInvoice.status === 'PAID') {
      syncInvoiceItemsToReady(existingInvoice).catch((err) =>
        console.warn('Background auto-revert READY upon delete error:', err)
      );
    }

    if (sheetId !== undefined && sheetId !== null) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: targetIdx + 1, // Header is row 0, A2 is row 1
                  endIndex: targetIdx + 2,
                },
              },
            },
          ],
        },
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to delete invoice from Google Sheets:', err);
    return false;
  }
}
