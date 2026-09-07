import { Invoice, FinancialKPIs, ClosingDealItem, InvoiceStatus } from '@/lib/types/finance';
import { getRawMasterInventory } from './inventory-repository';
import { getGoogleSheetsInventory } from './google-sheets-inventory';

import {
  fetchGoogleSheetsInvoices,
  appendGoogleSheetsInvoice,
  updateGoogleSheetsInvoiceStatus,
  updateGoogleSheetsInvoice,
  deleteGoogleSheetsInvoice,
} from './google-sheets-invoices';

// Clean Real Invoices store for BBKitchen (in-memory cache)
let cachedInvoices: Invoice[] = [];

export async function getInvoices(): Promise<Invoice[]> {
  try {
    const sheetsInvoices = await fetchGoogleSheetsInvoices();
    if (sheetsInvoices && sheetsInvoices.length > 0) {
      cachedInvoices = sheetsInvoices;
      return cachedInvoices;
    }
  } catch (err) {
    console.warn('Fallback to in-memory invoices:', err);
  }
  return [...cachedInvoices];
}

export async function createInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
  const newInvoice: Invoice = {
    ...invoiceData,
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  cachedInvoices.unshift(newInvoice);

  // Persist to Google Sheets INVOICE_ARCHIVE tab
  await appendGoogleSheetsInvoice(newInvoice).catch((e) =>
    console.warn('Google Sheets invoice append warning:', e)
  );

  return newInvoice;
}

export async function updateInvoice(invoice: Invoice): Promise<Invoice> {
  const index = cachedInvoices.findIndex(
    (inv) => inv.id === invoice.id || inv.invoiceNumber === invoice.invoiceNumber
  );
  if (index !== -1) {
    cachedInvoices[index] = { ...invoice };
  } else {
    cachedInvoices.unshift(invoice);
  }

  // Persist full update to Google Sheets
  await updateGoogleSheetsInvoice(invoice).catch((e) =>
    console.warn('Google Sheets full invoice update warning:', e)
  );

  return invoice;
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<boolean> {
  const index = cachedInvoices.findIndex((inv) => inv.id === id || inv.invoiceNumber === id);
  if (index !== -1) {
    cachedInvoices[index].status = status;
    if (status === 'PAID') {
      cachedInvoices[index].paidDate = new Date().toISOString().split('T')[0];
    }
  }

  // Persist status update to Google Sheets
  await updateGoogleSheetsInvoiceStatus(
    id,
    status,
    status === 'PAID' ? new Date().toISOString().split('T')[0] : undefined
  ).catch((e) => console.warn('Google Sheets invoice status update warning:', e));

  return true;
}

export async function deleteInvoice(idOrNumber: string): Promise<boolean> {
  cachedInvoices = cachedInvoices.filter(
    (inv) => inv.id !== idOrNumber && inv.invoiceNumber !== idOrNumber
  );

  await deleteGoogleSheetsInvoice(idOrNumber).catch((e) =>
    console.warn('Google Sheets invoice deletion warning:', e)
  );

  return true;
}

// Bulletproof Date Normalizer for Excel Serials, ISO Strings, Timestamps
export function parseToISODate(raw: any): string | undefined {
  if (!raw) return undefined;
  const str = String(raw).trim();
  if (!str) return undefined;

  // 1. Check if numeric serial (e.g. 45918 or 46268.454791666665)
  const num = Number(str);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    // Excel base date is Dec 30, 1899 (25569 days from Jan 1 1970)
    const jsDate = new Date((num - 25569) * 86400 * 1000);
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().split('T')[0];
    }
  }

  // 2. Check standard ISO or YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 3. Check DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 4. Handle localized Indonesian dates like "03 Sep 2026", "03 September 2026"
  const indoMonths: Record<string, string> = {
    jan: '01', januari: '01',
    feb: '02', februari: '02',
    mar: '03', maret: '03',
    apr: '04', april: '04',
    mei: '05', may: '05',
    jun: '06', juni: '06',
    jul: '07', juli: '07',
    agu: '08', agt: '08', agustus: '08', aug: '08',
    sep: '09', september: '09',
    okt: '10', oktober: '10', oct: '10',
    nov: '11', november: '11',
    des: '12', desember: '12', dec: '12',
  };
  const indoMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (indoMatch) {
    const day = indoMatch[1].padStart(2, '0');
    const monStr = indoMatch[2].toLowerCase().substring(0, 3);
    const mon = indoMonths[monStr] || '01';
    const year = indoMatch[3];
    return `${year}-${mon}-${day}`;
  }

  // 5. Try native Date constructor
  const d = new Date(str.replace(/\./g, ':'));
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return undefined;
}

export interface CategoryEconomics {
  category: string;
  totalUnits: number;
  readyUnits: number;
  soldUnits: number;
  avgRevenue: number;
  avgCOGS: number;
  avgMargin: number;
  marginPercent: number;
  assetValue: number;
}

export interface InventorySummaryItem {
  sku: string;
  category: string;
  statusUnit: string;
  modal: number;
  price: number;
  inDate?: string;
  soldDate?: string;
  warehouse: string;
  asalGudang?: string;
}

export async function getLiveClosingDealLedger(): Promise<{
  deals: ClosingDealItem[];
  categoryEconomics: CategoryEconomics[];
  totalAssetValuation: number;
  inventorySummary: InventorySummaryItem[];
  kpis: {
    totalRevenue: number;
    totalProfit: number;
    totalDeals: number;
    bbkSalesDeals: number;
    thirdPartyDeals: number;
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
      
      // BBKitchen closing if HARGA_CLOSING (Column AG) is explicitly populated > 0, otherwise third party uses modal as closing value
      const hasExplicitClosing = typeof item.HARGA_CLOSING === 'number' && item.HARGA_CLOSING > 0;
      const isThirdParty = !hasExplicitClosing;
      const closing = hasExplicitClosing ? item.HARGA_CLOSING! : modal;
      const realizedProfit = hasExplicitClosing ? Math.max(0, closing - modal) : 0;
      const marginPercent = (hasExplicitClosing && closing > 0 && modal > 0)
        ? Math.round(((closing - modal) / closing) * 100)
        : 0;

      if (isThirdParty) {
        thirdPartyCount++;
      } else {
        bbkSalesCount++;
      }
      totalRevenue += closing;
      totalProfit += realizedProfit;

      // Convert serial date or raw string to ISO YYYY-MM-DD
      const cleanInDate = parseToISODate(item.TANGGAL_MASUK);
      const cleanSoldDate = parseToISODate(item.TANGGAL_TERJUAL) || cleanInDate;

      const agingNum = typeof item.DURASI_TERJUAL === 'number' 
        ? Math.round(item.DURASI_TERJUAL) 
        : (parseInt(String(item.DURASI_TERJUAL || '0').replace(/\D/g, ''), 10) || 0);
        
      totalAging += agingNum;

      return {
        sku: item.SKU,
        productTitle: item.PRODUCT_TITLE,
        category: item.CATEGORY_NAME || item.CATEGORY_SLUG || '',
        tanggalMasuk: cleanInDate || item.TANGGAL_MASUK,
        tanggalTerjual: cleanSoldDate || cleanInDate || undefined,
        durasiTerjual: `${agingNum} hari`,
        lokasiGudang: item.LOKASI_UNIT,
        asalGudang: item.asal_gudang || 'GK',
        hargaModal: modal,
        hargaClosing: closing,
        realizedProfit,
        marginPercent,
        soldBy: isThirdParty ? 'THIRD_PARTY' : 'SALES_BBK',
        notes: isThirdParty ? 'Terjual Rekanan Gudang / Pihak Ketiga' : 'Closing Sales WhatsApp BBKitchen',
      };
    });

    // 2. Incorporate Real Paid Invoices from INVOICE_ARCHIVE
    try {
      const realInvoices = await getInvoices();
      const paidInvoices = (realInvoices || []).filter((inv) => inv.status === 'PAID');

      for (const inv of paidInvoices) {
        if (!inv.items || inv.items.length === 0) continue;
        for (const it of inv.items) {
          const itemSku = (it.sku || '').trim().toUpperCase();
          const matchedDeal = itemSku ? deals.find((d) => d.sku.toUpperCase() === itemSku) : undefined;

          if (matchedDeal) {
            if (it.unitPrice > 0) {
              matchedDeal.hargaClosing = it.unitPrice;
              matchedDeal.realizedProfit = Math.max(0, it.unitPrice - matchedDeal.hargaModal);
              matchedDeal.marginPercent = it.unitPrice > 0 ? Math.round((matchedDeal.realizedProfit / it.unitPrice) * 100) : 0;
            }
            if (inv.customerName) matchedDeal.customerName = inv.customerName;
            matchedDeal.soldBy = 'SALES_BBK';
            matchedDeal.notes = `Faktur Resmi ${inv.invoiceNumber}`;
            if (inv.paidDate) matchedDeal.tanggalTerjual = inv.paidDate;
          } else {
            // Manual entry / invoice without master inventory entry
            const qty = it.quantity || 1;
            const closingPrice = (it.unitPrice || 0) * qty;
            const modalPrice = (it.unitCost || 0) * qty;
            const realizedProfit = Math.max(0, closingPrice - modalPrice);
            const marginPercent = closingPrice > 0 ? Math.round((realizedProfit / closingPrice) * 100) : 0;

            deals.push({
              sku: it.sku || `INV-${inv.invoiceNumber}`,
              productTitle: it.description || 'Peralatan Dapur Komersial',
              category: 'Transaksi Manual & Invoicing',
              tanggalMasuk: inv.issueDate,
              tanggalTerjual: inv.paidDate || inv.issueDate,
              durasiTerjual: '1 hari',
              lokasiGudang: it.warehouseLocation || 'GK',
              asalGudang: it.warehouseLocation || 'GK',
              hargaModal: modalPrice,
              hargaClosing: closingPrice,
              realizedProfit,
              marginPercent,
              soldBy: 'SALES_BBK',
              customerName: inv.customerName,
              notes: `Faktur Resmi ${inv.invoiceNumber}`,
            });
          }
        }
      }
    } catch (invErr) {
      console.warn('Could not merge real invoices into deal ledger:', invErr);
    }

    // Recalculate Totals
    totalRevenue = deals.reduce((sum, d) => sum + d.hargaClosing, 0);
    totalProfit = deals.reduce((sum, d) => sum + d.realizedProfit, 0);
    bbkSalesCount = deals.filter((d) => d.soldBy === 'SALES_BBK').length;
    thirdPartyCount = deals.filter((d) => d.soldBy === 'THIRD_PARTY').length;

    // Sort newest sold date first
    deals.sort((a, b) => {
      const dateA = a.tanggalTerjual ? new Date(a.tanggalTerjual).getTime() : 0;
      const dateB = b.tanggalTerjual ? new Date(b.tanggalTerjual).getTime() : 0;
      return dateB - dateA;
    });

    const totalDeals = deals.length;
    const avgMarginPercent = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
    const avgAgingDays = totalDeals > 0 ? Math.round(totalAging / totalDeals) : 0;

    // Calculate Real Category Unit Economics from All 2,760+ Items
    const categoryMap = new Map<string, {
      totalUnits: number;
      readyUnits: number;
      soldUnits: number;
      revenueSum: number;
      revenueCount: number;
      cogsSum: number;
      cogsCount: number;
      assetSum: number;
    }>();

    let totalAssetValuation = 0;

    for (const it of rawItems) {
      const catName = it.CATEGORY_NAME || it.CATEGORY_SLUG || 'Peralatan Dapur Lainnya';
      const isReady = it.STATUS_UNIT === 'READY' || it.STATUS_UNIT === 'AVAILABLE';
      const isSold = it.STATUS_UNIT === 'SOLD';
      const modal = it.HARGA_MODAL || 0;
      const price = it.HARGA_CLOSING || it.HARGA_DEAL_WA || it.HARGA_BUKA_WA || it.HARGA_ESTIMASI_PUBLIK || 0;

      if (isReady && modal > 0) {
        totalAssetValuation += modal;
      }

      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, {
          totalUnits: 0,
          readyUnits: 0,
          soldUnits: 0,
          revenueSum: 0,
          revenueCount: 0,
          cogsSum: 0,
          cogsCount: 0,
          assetSum: 0,
        });
      }

      const entry = categoryMap.get(catName)!;
      entry.totalUnits++;
      if (isReady) {
        entry.readyUnits++;
        if (modal > 0) entry.assetSum += modal;
      }
      if (isSold) entry.soldUnits++;

      if (price > 0) {
        entry.revenueSum += price;
        entry.revenueCount++;
      }
      if (modal > 0) {
        entry.cogsSum += modal;
        entry.cogsCount++;
      }
    }

    const categoryEconomics: CategoryEconomics[] = Array.from(categoryMap.entries())
      .filter(([_, stats]) => stats.totalUnits >= 5) // Only significant categories
      .map(([catName, stats]) => {
        const avgRev = stats.revenueCount > 0 ? Math.round(stats.revenueSum / stats.revenueCount) : 0;
        const avgCogs = stats.cogsCount > 0 ? Math.round(stats.cogsSum / stats.cogsCount) : Math.round(avgRev * 0.65);
        const avgMargin = Math.max(0, avgRev - avgCogs);
        const marginPct = avgRev > 0 ? Math.round((avgMargin / avgRev) * 100) : 0;

        return {
          category: catName,
          totalUnits: stats.totalUnits,
          readyUnits: stats.readyUnits,
          soldUnits: stats.soldUnits,
          avgRevenue: avgRev,
          avgCOGS: avgCogs,
          avgMargin,
          marginPercent: marginPct,
          assetValue: stats.assetSum,
        };
      })
      .sort((a, b) => b.totalUnits - a.totalUnits);

    const inventorySummary: InventorySummaryItem[] = rawItems.map((it) => ({
      sku: it.SKU,
      category: it.CATEGORY_NAME || it.CATEGORY_SLUG || 'Peralatan Dapur Lainnya',
      statusUnit: it.STATUS_UNIT,
      modal: it.HARGA_MODAL || 0,
      price: it.HARGA_CLOSING || it.HARGA_DEAL_WA || it.HARGA_BUKA_WA || it.HARGA_ESTIMASI_PUBLIK || 0,
      inDate: parseToISODate(it.TANGGAL_MASUK),
      soldDate: parseToISODate(it.TANGGAL_TERJUAL),
      warehouse: it.LOKASI_UNIT || 'Pamulang 2',
      asalGudang: it.asal_gudang || 'GK',
    }));

    return {
      deals,
      categoryEconomics,
      totalAssetValuation,
      inventorySummary,
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
      categoryEconomics: [],
      totalAssetValuation: 0,
      inventorySummary: [],
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

export async function getFinancialKPIs(): Promise<FinancialKPIs> {
  const ledgerData = await getLiveClosingDealLedger();
  return {
    period: 'Live Financials',
    totalRevenue: ledgerData.kpis.totalRevenue,
    totalCOGS: Math.max(0, ledgerData.kpis.totalRevenue - ledgerData.kpis.totalProfit),
    grossMarginAmount: ledgerData.kpis.totalProfit,
    grossMarginPercentage: ledgerData.kpis.avgMarginPercent,
    unitsSold: ledgerData.kpis.totalDeals,
    averageOrderValue: ledgerData.kpis.totalDeals > 0 ? Math.round(ledgerData.kpis.totalRevenue / ledgerData.kpis.totalDeals) : 0,
    averageUnitMargin: ledgerData.kpis.totalDeals > 0 ? Math.round(ledgerData.kpis.totalProfit / ledgerData.kpis.totalDeals) : 0,
    outstandingInvoicesAmount: 0,
    paidInvoicesAmount: ledgerData.kpis.totalRevenue,
    inventoryAssetValue: ledgerData.totalAssetValuation,
  };
}
