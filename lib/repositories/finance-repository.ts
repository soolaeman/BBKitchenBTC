import { Invoice, FinancialKPIs, ClosingDealItem, InvoiceStatus } from '@/lib/types/finance';
import { getRawMasterInventory } from './inventory-repository';
import { getGoogleSheetsInventory } from './google-sheets-inventory';

// Clean Real Invoices store for BBKitchen
const initialInvoices: Invoice[] = [];

export function getInvoices(): Invoice[] {
  return [...initialInvoices];
}

export function createInvoice(invoiceData: Omit<Invoice, 'id'>): Invoice {
  const newInvoice: Invoice = {
    ...invoiceData,
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  initialInvoices.unshift(newInvoice);
  return newInvoice;
}

export function updateInvoiceStatus(id: string, status: InvoiceStatus): boolean {
  const index = initialInvoices.findIndex((inv) => inv.id === id);
  if (index === -1) return false;
  initialInvoices[index].status = status;
  if (status === 'PAID') {
    initialInvoices[index].paidDate = new Date().toISOString().split('T')[0];
  }
  return true;
}

export function getFinancialKPIs(): FinancialKPIs {
  const inventory = getRawMasterInventory();
  const soldUnits = inventory.filter((i) => i.STATUS_UNIT === 'SOLD');

  let totalRevenue = 0;
  let totalCOGS = 0;

  for (const item of soldUnits) {
    if (typeof item.HARGA_CLOSING === 'number' && item.HARGA_CLOSING > 0) {
      const revenue = item.HARGA_CLOSING;
      const cogs = item.HARGA_MODAL || 0;
      totalRevenue += revenue;
      totalCOGS += cogs;
    }
  }

  const availableUnits = inventory.filter((i) => i.STATUS_UNIT === 'AVAILABLE' || i.STATUS_UNIT === 'READY');
  const inventoryAssetValue = availableUnits.reduce((acc, curr) => acc + (curr.HARGA_MODAL || 0), 0);

  const grossMarginAmount = totalRevenue - totalCOGS;
  const grossMarginPercentage = totalRevenue > 0 ? (grossMarginAmount / totalRevenue) * 100 : 0;
  const paidInvoices = initialInvoices.filter((i) => i.status === 'PAID');
  const outstandingInvoices = initialInvoices.filter((i) => i.status === 'SENT' || i.status === 'GENERATED');

  const paidInvoicesAmount = paidInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const outstandingInvoicesAmount = outstandingInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return {
    period: 'Agustus 2026 (Live Financials)',
    totalRevenue,
    totalCOGS,
    grossMarginAmount,
    grossMarginPercentage,
    unitsSold: soldUnits.length,
    averageOrderValue: totalRevenue > 0 ? totalRevenue / (soldUnits.length || 1) : 0,
    averageUnitMargin: grossMarginAmount > 0 ? grossMarginAmount / (soldUnits.length || 1) : 0,
    outstandingInvoicesAmount,
    paidInvoicesAmount,
    inventoryAssetValue,
  };
}

export async function getLiveClosingDealLedger(): Promise<{
  deals: ClosingDealItem[];
  kpis: {
    totalDeals: number;
    bbkSalesDeals: number;
    thirdPartyDeals: number;
    totalRevenue: number;
    totalProfit: number;
    avgMarginPercent: number;
    avgAgingDays: number;
  };
}> {
  try {
    const rawItems = await getGoogleSheetsInventory();
    const soldItems = rawItems.filter((i) => i.STATUS_UNIT === 'SOLD');

    let totalRevenue = 0;
    let totalProfit = 0;
    let totalAging = 0;
    let bbkSalesCount = 0;
    let thirdPartyCount = 0;

    const deals: ClosingDealItem[] = soldItems.map((item) => {
      const modal = item.HARGA_MODAL || 0;
      
      // Strict rule: BBKitchen closing ONLY if HARGA_CLOSING (Column AG) is explicitly populated > 0
      const hasExplicitClosing = typeof item.HARGA_CLOSING === 'number' && item.HARGA_CLOSING > 0;
      const isThirdParty = !hasExplicitClosing;
      const closing = hasExplicitClosing ? item.HARGA_CLOSING! : 0;
      const realizedProfit = hasExplicitClosing ? Math.max(0, closing - modal) : 0;
      const marginPercent = (hasExplicitClosing && closing > 0 && modal > 0)
        ? Math.round(((closing - modal) / closing) * 100)
        : 0;

      if (isThirdParty) {
        thirdPartyCount++;
      } else {
        bbkSalesCount++;
        totalRevenue += closing;
        totalProfit += realizedProfit;
      }

      // Convert serial date or raw string
      let rawDate = item.TANGGAL_TERJUAL ? String(item.TANGGAL_TERJUAL).trim() : '';
      if (/^\d{5}$/.test(rawDate)) {
        // Excel/Sheets serial date number (e.g. 45918 -> 2025-09-18)
        const serialNum = parseInt(rawDate, 10);
        const jsDate = new Date((serialNum - (25567 + 2)) * 86400 * 1000);
        if (!isNaN(jsDate.getTime())) {
          rawDate = jsDate.toISOString().split('T')[0];
        }
      }

      const agingNum = typeof item.DURASI_TERJUAL === 'number' 
        ? Math.round(item.DURASI_TERJUAL) 
        : (parseInt(String(item.DURASI_TERJUAL || '0'), 10) || 0);
        
      totalAging += agingNum;

      return {
        sku: item.SKU,
        productTitle: item.PRODUCT_TITLE,
        tanggalMasuk: item.TANGGAL_MASUK,
        tanggalTerjual: rawDate || undefined,
        durasiTerjual: `${agingNum} hari`,
        lokasiGudang: item.LOKASI_UNIT,
        hargaModal: modal,
        hargaClosing: closing,
        realizedProfit,
        marginPercent,
        soldBy: isThirdParty ? 'THIRD_PARTY' : 'SALES_BBK',
        notes: isThirdParty ? 'Terjual Rekanan Gudang / Pihak Ketiga' : 'Closing Sales WhatsApp BBKitchen',
      };
    });

    // Sort newest sold date first
    deals.sort((a, b) => {
      const dateA = a.tanggalTerjual ? new Date(a.tanggalTerjual).getTime() : 0;
      const dateB = b.tanggalTerjual ? new Date(b.tanggalTerjual).getTime() : 0;
      return dateB - dateA;
    });

    const totalDeals = deals.length;
    const avgMarginPercent = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
    const avgAgingDays = totalDeals > 0 ? Math.round(totalAging / totalDeals) : 0;

    return {
      deals,
      kpis: {
        totalDeals,
        bbkSalesDeals: bbkSalesCount,
        thirdPartyDeals: thirdPartyCount,
        totalRevenue,
        totalProfit,
        avgMarginPercent,
        avgAgingDays,
      },
    };
  } catch (error) {
    console.error('Failed to calculate live closing deal ledger:', error);
    return {
      deals: [],
      kpis: {
        totalDeals: 0,
        bbkSalesDeals: 0,
        thirdPartyDeals: 0,
        totalRevenue: 0,
        totalProfit: 0,
        avgMarginPercent: 0,
        avgAgingDays: 0,
      },
    };
  }
}
