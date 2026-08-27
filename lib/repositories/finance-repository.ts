import { Invoice, FinancialKPIs } from '@/lib/types/finance';
import { getRawMasterInventory } from './inventory-repository';

// Realistic mock invoices for BBKitchen commercial kitchen buyers
const initialInvoices: Invoice[] = [
  {
    id: 'inv_101',
    invoiceNumber: 'INV-BBK-202608-0101',
    customerName: 'Restoran Bebek Kaleyo (Cabang BSD)',
    customerPhone: '081289123456',
    customerAddress: 'Ruko Golden Boulevard Blok W No. 12, BSD City, Tangerang',
    orderReference: 'ORD-WA-20260825-01',
    items: [
      {
        id: 'item_1',
        sku: 'BBK-GK-COM-0007',
        description: 'Rational Combi Oven & Steamer Prima 95%',
        quantity: 1,
        unitPrice: 68500000,
        total: 68500000,
      },
      {
        id: 'item_2',
        sku: 'BBK-PY-STA-0012',
        description: 'Stainless Worktable 1800x700x850 Double Tier',
        quantity: 2,
        unitPrice: 4200000,
        total: 8400000,
      },
    ],
    subtotal: 76900000,
    discount: 1900000,
    tax: 0,
    totalAmount: 75000000,
    issueDate: '2026-08-25',
    dueDate: '2026-08-28',
    status: 'PAID',
    paidDate: '2026-08-26',
    paymentMethod: 'TRANSFER_BCA',
    createdBy: 'Soolaeman (Admin)',
    notes: 'Unit diantar langsung ke cabang BSD. Termasuk test run 1 hari.',
  },
  {
    id: 'inv_102',
    invoiceNumber: 'INV-BBK-202608-0102',
    customerName: 'Kopi Kenangan Mantan (Pondok Indah)',
    customerPhone: '081198765432',
    customerAddress: 'Jl. Metro Pondok Indah Blok TB 22, Jakarta Selatan',
    orderReference: 'ORD-WA-20260826-04',
    items: [
      {
        id: 'item_3',
        sku: 'BBK-PE-COF-0014',
        description: 'La Marzocco Linea Classic 2 Group Ex-Hotel Display',
        quantity: 1,
        unitPrice: 92000000,
        total: 92000000,
      },
      {
        id: 'item_4',
        sku: 'BBK-ML-REF-0021',
        description: 'Hoshizaki Under-Counter Chiller 2 Door 1500mm',
        quantity: 1,
        unitPrice: 18500000,
        total: 18500000,
      },
    ],
    subtotal: 110500000,
    discount: 3500000,
    tax: 0,
    totalAmount: 107000000,
    issueDate: '2026-08-26',
    dueDate: '2026-08-29',
    status: 'SENT',
    paymentMethod: 'TRANSFER_MANDIRI',
    createdBy: 'Rian (Sales Desk)',
    notes: 'Menunggu konfirmasi pelunasan DP 50% sebelum pengiriman dari Hub Sawangan.',
  },
  {
    id: 'inv_103',
    invoiceNumber: 'INV-BBK-202608-0103',
    customerName: 'Dapur Solo Catering (Cilandak)',
    customerPhone: '085712349988',
    customerAddress: 'Jl. TB Simatupang No. 71, Cilandak, Jakarta Selatan',
    orderReference: 'ORD-WA-20260827-02',
    items: [
      {
        id: 'item_5',
        sku: 'BBK-SM-COO-0028',
        description: 'Berjaya Gas 4-Burner Range with Oven Heavy Duty',
        quantity: 2,
        unitPrice: 24000000,
        total: 48000000,
      },
      {
        id: 'item_6',
        sku: 'BBK-WT-PRE-0035',
        description: 'Hobart Planetary Mixer 20 Liter Ex-Bakery Prima',
        quantity: 1,
        unitPrice: 29500000,
        total: 29500000,
      },
    ],
    subtotal: 77500000,
    discount: 2500000,
    tax: 0,
    totalAmount: 75000000,
    issueDate: '2026-08-27',
    dueDate: '2026-08-30',
    status: 'GENERATED',
    paymentMethod: 'TRANSFER_BCA',
    createdBy: 'Soolaeman (Admin)',
    notes: 'Invoice dikirim via WhatsApp. Estimasi pengiriman hari Jumat.',
  },
  {
    id: 'inv_104',
    invoiceNumber: 'INV-BBK-202608-0104',
    customerName: 'Bakery Roti Gembong Nusantara',
    customerPhone: '081344556677',
    customerAddress: 'Jl. Surya Kencana No. 10, Pamulang, Tangerang Selatan',
    orderReference: 'ORD-WA-20260824-03',
    items: [
      {
        id: 'item_7',
        sku: 'BBK-GK-BAK-0042',
        description: 'Kolb Deck Oven 2 Deck 4 Tray Digital Controller',
        quantity: 1,
        unitPrice: 46000000,
        total: 46000000,
      },
    ],
    subtotal: 46000000,
    discount: 1000000,
    tax: 0,
    totalAmount: 45000000,
    issueDate: '2026-08-24',
    dueDate: '2026-08-27',
    status: 'PAID',
    paidDate: '2026-08-25',
    paymentMethod: 'TRANSFER_BCA',
    createdBy: 'Soolaeman (Admin)',
    notes: 'Pelunasan lunas via BCA. Unit telah di pickup customer di Hub Pamulang 2.',
  },
];

let invoicesCache: Invoice[] = [...initialInvoices];

export function getInvoices(): Invoice[] {
  return invoicesCache;
}

export function createInvoice(newInv: Omit<Invoice, 'id'>): Invoice {
  const inv: Invoice = {
    ...newInv,
    id: `inv_${Date.now()}`,
  };
  invoicesCache.unshift(inv);
  return inv;
}

export function updateInvoiceStatus(id: string, status: Invoice['status']): boolean {
  const inv = invoicesCache.find((i) => i.id === id);
  if (!inv) return false;
  inv.status = status;
  if (status === 'PAID' && !inv.paidDate) {
    inv.paidDate = new Date().toISOString().split('T')[0];
  }
  return true;
}

export function getFinancialKPIs(): FinancialKPIs {
  const inventory = getRawMasterInventory();
  const soldUnits = inventory.filter((i) => i.STATUS_UNIT === 'SOLD');

  let totalRevenue = 0;
  let totalCOGS = 0;

  for (const item of soldUnits) {
    const revenue = item.HARGA_DEAL_WA || item.HARGA_BUKA_WA || item.HARGA_ESTIMASI_PUBLIK;
    const cogs = item.HARGA_MODAL || revenue * 0.65;
    totalRevenue += revenue;
    totalCOGS += cogs;
  }

  // Also calculate total inventory asset value in warehouse
  const availableUnits = inventory.filter((i) => i.STATUS_UNIT === 'AVAILABLE');
  const inventoryAssetValue = availableUnits.reduce((acc, curr) => acc + (curr.HARGA_MODAL || 0), 0);

  const grossMarginAmount = totalRevenue - totalCOGS;
  const grossMarginPercentage = totalRevenue > 0 ? (grossMarginAmount / totalRevenue) * 100 : 0;
  const averageOrderValue = soldUnits.length > 0 ? totalRevenue / soldUnits.length : 0;
  const averageUnitMargin = soldUnits.length > 0 ? grossMarginAmount / soldUnits.length : 0;

  const paidInvoices = invoicesCache.filter((i) => i.status === 'PAID');
  const outstandingInvoices = invoicesCache.filter((i) => i.status === 'SENT' || i.status === 'GENERATED');

  const paidInvoicesAmount = paidInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const outstandingInvoicesAmount = outstandingInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return {
    period: 'Agustus 2026 (YTD)',
    totalRevenue,
    totalCOGS,
    grossMarginAmount,
    grossMarginPercentage,
    unitsSold: soldUnits.length,
    averageOrderValue,
    averageUnitMargin,
    outstandingInvoicesAmount,
    paidInvoicesAmount,
    inventoryAssetValue,
  };
}
