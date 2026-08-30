'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { FinancialKPIs, ClosingDealItem, Invoice, DocumentType } from '@/lib/types/finance';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import { OfficialDocumentModal } from './OfficialDocumentModal';
import {
  Banknote,
  Percent,
  Receipt,
  FileCheck,
  Building,
  DollarSign,
  Lock,
  TrendingUp,
  Package,
  Clock,
  Search,
  Calendar,
  Layers,
  Filter,
  RefreshCw,
  Truck,
  FileText,
  BarChart3,
  ShieldCheck,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

type DatePreset = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_YEAR' | 'CUSTOM';

interface CategoryEconomics {
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

interface InventorySummaryItem {
  sku: string;
  category: string;
  statusUnit: string;
  modal: number;
  price: number;
  inDate?: string;
  soldDate?: string;
  warehouse: string;
}

export function FinanceDashboard() {
  const { role, permissions } = useAuth();
  const [deals, setDeals] = useState<ClosingDealItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventorySummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'SALES_BBK' | 'THIRD_PARTY'>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [documentModalType, setDocumentModalType] = useState<DocumentType>('INVOICE');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Dynamic Month & Year Names (100% Updatable for any month/year!)
  const now = new Date();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentMonthName = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthName = monthNames[prevMonthDate.getMonth()];
  const prevMonthYear = prevMonthDate.getFullYear();

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/invoices', {
        headers: { ...(role ? { 'x-bbk-role': role } : {}) },
      });
      const data = await res.json();
      if (data.deals) setDeals(data.deals);
      if (data.inventorySummary) setInventoryItems(data.inventorySummary);
    } catch (err) {
      console.error('Failed to load finance data', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronized Date Range Boundary Resolver
  const dateBounds = useMemo(() => {
    let startFilter: string | null = null;
    let endFilter: string | null = null;

    if (datePreset === 'THIS_MONTH') {
      const startObj = new Date(now.getFullYear(), now.getMonth(), 1);
      const endObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startFilter = startObj.toISOString().split('T')[0];
      endFilter = endObj.toISOString().split('T')[0];
    } else if (datePreset === 'LAST_MONTH') {
      const startObj = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endObj = new Date(now.getFullYear(), now.getMonth(), 0);
      startFilter = startObj.toISOString().split('T')[0];
      endFilter = endObj.toISOString().split('T')[0];
    } else if (datePreset === 'LAST_7_DAYS') {
      const startObj = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startFilter = startObj.toISOString().split('T')[0];
      endFilter = now.toISOString().split('T')[0];
    } else if (datePreset === 'LAST_30_DAYS') {
      const startObj = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startFilter = startObj.toISOString().split('T')[0];
      endFilter = now.toISOString().split('T')[0];
    } else if (datePreset === 'THIS_YEAR') {
      startFilter = `${now.getFullYear()}-01-01`;
      endFilter = `${now.getFullYear()}-12-31`;
    } else if (datePreset === 'CUSTOM') {
      if (startDate) startFilter = startDate;
      if (endDate) endFilter = endDate;
    }

    return { startFilter, endFilter };
  }, [datePreset, startDate, endDate, now]);

  // 1. FILTERED DEALS (FOR CLOSING LEDGER & REVENUE/PROFIT KPIS)
  const filteredDeals = useMemo(() => {
    const { startFilter, endFilter } = dateBounds;

    return deals.filter((deal) => {
      // Keyword search
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        deal.sku.toLowerCase().includes(q) ||
        deal.productTitle.toLowerCase().includes(q) ||
        deal.lokasiGudang.toLowerCase().includes(q);

      // Channel filter
      const matchChannel =
        channelFilter === 'ALL' || deal.soldBy === channelFilter;

      // Warehouse filter
      const matchWarehouse =
        warehouseFilter === 'ALL' || deal.lokasiGudang.toLowerCase().includes(warehouseFilter.toLowerCase());

      // Date filtering comparison on clean ISO YYYY-MM-DD
      let matchDate = true;
      if (startFilter || endFilter) {
        const dealDateStr = deal.tanggalTerjual ? deal.tanggalTerjual.split('T')[0] : '';
        if (!dealDateStr) {
          matchDate = false;
        } else {
          if (startFilter && dealDateStr < startFilter) matchDate = false;
          if (endFilter && dealDateStr > endFilter) matchDate = false;
        }
      }

      return matchQ && matchChannel && matchWarehouse && matchDate;
    });
  }, [deals, searchQuery, channelFilter, warehouseFilter, dateBounds]);

  // 2. DYNAMIC FINANCIAL KPIS (CALCULATED LIVE FROM FILTERED DEALS)
  const dynamicKPIs = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let bbkSalesCount = 0;
    let thirdPartyCount = 0;
    let totalAging = 0;

    filteredDeals.forEach((d) => {
      if (d.soldBy === 'SALES_BBK') {
        bbkSalesCount++;
        revenue += d.hargaClosing;
        profit += d.realizedProfit;
      } else {
        thirdPartyCount++;
      }
      const agingNum = parseInt(String(d.durasiTerjual || '0').replace(/\D/g, ''), 10) || 0;
      totalAging += agingNum;
    });

    const totalDeals = filteredDeals.length;
    const avgMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
    const avgAging = totalDeals > 0 ? Math.round(totalAging / totalDeals) : 0;

    return {
      totalDeals,
      bbkSalesCount,
      thirdPartyCount,
      revenue,
      profit,
      avgMargin,
      avgAging,
    };
  }, [filteredDeals]);

  // 3. DYNAMIC INVENTORY ITEMS FILTER (BY WAREHOUSE & DATE FOR ASSET VALUATION & UNIT ECONOMICS)
  const filteredInventory = useMemo(() => {
    const { startFilter, endFilter } = dateBounds;

    return inventoryItems.filter((item) => {
      // Warehouse filter
      if (warehouseFilter !== 'ALL' && !item.warehouse.toLowerCase().includes(warehouseFilter.toLowerCase())) {
        return false;
      }

      // If a date range is active, match items created/entered or sold within that date range
      if (startFilter || endFilter) {
        const itemDate = item.inDate || item.soldDate || '';
        if (itemDate) {
          if (startFilter && itemDate < startFilter) return false;
          if (endFilter && itemDate > endFilter) return false;
        }
      }

      return true;
    });
  }, [inventoryItems, warehouseFilter, dateBounds]);

  // 4. DYNAMIC TOTAL ASSET VALUATION (UPDATABLE BY DATE & WAREHOUSE)
  const dynamicAssetValuation = useMemo(() => {
    return filteredInventory
      .filter((item) => item.statusUnit === 'READY' || item.statusUnit === 'AVAILABLE')
      .reduce((sum, item) => sum + (item.modal || 0), 0);
  }, [filteredInventory]);

  // 5. DYNAMIC CATEGORY UNIT ECONOMICS (UPDATABLE BY DATE & WAREHOUSE)
  const dynamicCategoryEconomics = useMemo(() => {
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

    for (const it of filteredInventory) {
      const catName = it.category || 'Peralatan Dapur Lainnya';
      const isReady = it.statusUnit === 'READY' || it.statusUnit === 'AVAILABLE';
      const isSold = it.statusUnit === 'SOLD';
      const modal = it.modal || 0;
      const price = it.price || 0;

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

    return Array.from(categoryMap.entries())
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
  }, [filteredInventory]);

  // Top 6 categories for Chart
  const chartData = useMemo(() => {
    return dynamicCategoryEconomics.slice(0, 6).map((c) => ({
      category: c.category.length > 15 ? `${c.category.slice(0, 14)}…` : c.category,
      fullCategory: c.category,
      avgRevenue: c.avgRevenue,
      avgCOGS: c.avgCOGS,
      avgMargin: c.avgMargin,
      marginPercent: c.marginPercent,
      totalUnits: c.totalUnits,
    }));
  }, [dynamicCategoryEconomics]);

  const handleOpenDocFromDeal = (deal: ClosingDealItem, type: DocumentType = 'INVOICE') => {
    const issueDate = now.toISOString().split('T')[0];
    const dueDateObj = new Date(now);
    dueDateObj.setDate(dueDateObj.getDate() + 3);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const tempInvoice: Invoice = {
      id: `deal_${deal.sku}_${Date.now()}`,
      invoiceNumber: `INV-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${deal.sku.replace(/\D/g, '').slice(-4) || '1024'}`,
      kuitansiNumber: `KWT-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${deal.sku.replace(/\D/g, '').slice(-4) || '1024'}`,
      quotationNumber: `QUO-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${deal.sku.replace(/\D/g, '').slice(-4) || '1024'}`,
      suratJalanNumber: `SJ-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${deal.sku.replace(/\D/g, '').slice(-4) || '1024'}`,
      documentType: type,
      customerName: deal.customerName || 'Bpk/Ibu Pembeli (Resto Partner)',
      customerPhone: '0851 2200 1051',
      customerAddress: deal.lokasiGudang || 'Jabodetabek',
      orderReference: `ORD-DEAL-${deal.sku}`,
      items: [
        {
          id: `item_${deal.sku}`,
          sku: deal.sku,
          description: deal.productTitle,
          quantity: 1,
          unitPrice: deal.hargaClosing || deal.hargaModal || 0,
          total: deal.hargaClosing || deal.hargaModal || 0,
          warehouseLocation: deal.lokasiGudang,
          condition: 'Bekas Terkurasi (Lolos QC Siap Pakai)',
        },
      ],
      subtotal: deal.hargaClosing || deal.hargaModal || 0,
      discount: 0,
      tax: 0,
      totalAmount: deal.hargaClosing || deal.hargaModal || 0,
      dpAmount: deal.hargaClosing || deal.hargaModal || 0,
      remainingAmount: 0,
      issueDate: deal.tanggalTerjual || issueDate,
      dueDate,
      status: 'PAID',
      paidDate: deal.tanggalTerjual || issueDate,
      paymentMethod: 'TRANSFER_BCA',
      deliveryDriver: 'Pak Ujang (Lalamove)',
      driverPhone: '0812-9876-5432',
      deliveryVehiclePlate: 'B 9482 SXZ',
      deliveryExpedition: 'LALAMOVE',
      createdBy: deal.soldBy === 'SALES_BBK' ? 'Tim Sales WhatsApp BBKitchen' : 'Pihak Ketiga / Rekanan Gudang',
      notes: deal.notes,
    };

    setSelectedInvoice(tempInvoice);
    setDocumentModalType(type);
    setIsDocModalOpen(true);
  };

  if (!permissions?.canViewFinanceReports && role !== 'ADMIN' && role !== 'INVESTOR') {
    return (
      <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-2xl text-center space-y-3">
        <Lock className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Akses Keuangan Terbatas</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Modul Keuangan memerlukan role ADMIN, FINANCE, atau INVESTOR. Silakan beralih role pada switcher di pojok kanan atas untuk melihat laporan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 font-mono">
            <Banknote className="w-6 h-6 text-amber-500" />
            <span>FINANCIALS, MARGINS & CLOSING DEAL LEDGER</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Analisis unit economics fundamental, valuasi aset inventaris gudang, dan buku rekap closing deal live Google Sheets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRefreshing(true);
            loadData();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          <span>Sync Real-Time</span>
        </button>
      </div>

      {/* 2. DATE RANGE & FILTERS CONTROL BAR (AT THE VERY TOP) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Kontrol Periode Transaksi & Filter Gudang
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Menganalisa <strong>{filteredDeals.length}</strong> deal closing & <strong>{filteredInventory.length}</strong> unit stok
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
          {/* Dynamic Updatable Date Presets */}
          <div className="lg:col-span-4">
            <label className="block text-slate-400 font-bold mb-1">📅 Jangka Penanggalan (Periode):</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-amber-400"
            >
              <option value="ALL">📅 Semua Waktu (All Time)</option>
              <option value="THIS_MONTH">📅 Bulan Ini ({currentMonthName} {currentYear})</option>
              <option value="LAST_MONTH">📅 Bulan Lalu ({prevMonthName} {prevMonthYear})</option>
              <option value="LAST_7_DAYS">📅 7 Hari Terakhir</option>
              <option value="LAST_30_DAYS">📅 30 Hari Terakhir</option>
              <option value="THIS_YEAR">📅 Tahun Ini ({currentYear})</option>
              <option value="CUSTOM">📅 Kustom Tanggal (Dari - Sampai)</option>
            </select>
          </div>

          {/* Hub Warehouse Filter */}
          <div className="lg:col-span-4">
            <label className="block text-slate-400 font-bold mb-1">🏢 Hub / Lokasi Gudang:</label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
            >
              <option value="ALL">Semua Hub Gudang (10 Gudang)</option>
              <option value="Pamulang 2">Pamulang 2 (GK)</option>
              <option value="Pamulang Barat">Pamulang Barat (ML)</option>
              <option value="Pamulang">Pamulang (BB)</option>
              <option value="Sawangan">Sawangan (PE)</option>
              <option value="Setu">Setu (PY)</option>
              <option value="Kedaung">Kedaung (WT)</option>
              <option value="Ciputat">Ciputat (SM)</option>
              <option value="Serpong">Serpong (BL)</option>
              <option value="Bintaro">Bintaro (RB)</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div className="lg:col-span-4">
            <label className="block text-slate-400 font-bold mb-1">💼 Channel Closing:</label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
            >
              <option value="ALL">Semua Channel Closing ({deals.length} Total)</option>
              <option value="SALES_BBK">Hanya Closing Sales BBKitchen ({dynamicKPIs.bbkSalesCount})</option>
              <option value="THIRD_PARTY">Terjual Rekanan Gudang / Pihak Ketiga ({dynamicKPIs.thirdPartyCount})</option>
            </select>
          </div>

          {/* Custom Date Range Inputs */}
          {datePreset === 'CUSTOM' && (
            <div className="lg:col-span-12 grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold shrink-0">Dari Tanggal:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold shrink-0">Sampai Tanggal:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. TOP SECTION: UNIT ECONOMICS & ASSET VALUATION (DYNAMICALLY UPDATED) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 Cols: Unit Economics Visual Chart & Fundamental Breakdown */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Unit Economics: Rata-Rata Harga Jual vs HPP per Kategori</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kalkulasi fundamental dari {filteredInventory.length} unit stok live: Rata-rata Harga Pasar, HPP Modal, dan Gross Margin.
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-mono font-bold shrink-0">
              Live Database
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} interval={0} angle={-12} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  formatter={(val: any) => formatIDR(Number(val))}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                <Bar dataKey="avgRevenue" name="Harga Buka / Pasar" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgCOGS" name="HPP Modal" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgMargin" name="Laba Kotor Unit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fundamental Business Economics Mini Table */}
          <div className="overflow-x-auto pt-2 border-t border-slate-800/80">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="text-slate-400 uppercase font-mono text-[9px] border-b border-slate-800">
                  <th className="pb-1.5">Kategori Mesin</th>
                  <th className="pb-1.5 text-center">Total Unit</th>
                  <th className="pb-1.5 text-right">Rata2 Harga</th>
                  <th className="pb-1.5 text-right">Rata2 HPP</th>
                  <th className="pb-1.5 text-right text-amber-400">Laba Kotor</th>
                  <th className="pb-1.5 text-right text-emerald-400">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {dynamicCategoryEconomics.slice(0, 5).map((cat) => (
                  <tr key={cat.category} className="hover:bg-slate-850/50">
                    <td className="py-1.5 font-bold text-slate-200">{cat.category}</td>
                    <td className="py-1.5 text-center font-mono text-slate-400">{cat.totalUnits} unit</td>
                    <td className="py-1.5 text-right font-mono text-slate-300">{formatIDR(cat.avgRevenue)}</td>
                    <td className="py-1.5 text-right font-mono text-slate-400">{formatIDR(cat.avgCOGS)}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-amber-400">+{formatIDR(cat.avgMargin)}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-emerald-400">{cat.marginPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: Valuasi Total Aset Inventaris di Gudang (Dynamic) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Building className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Valuasi Total Aset Gudang
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded font-mono">
                {warehouseFilter === 'ALL' ? '10 Hub Gudang' : warehouseFilter}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Total Nilai Modal Inventaris Aktif:
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight mt-1">
                {formatIDR(dynamicAssetValuation)}
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Dihitung otomatis dari akumulasi harga modal (HPP) seluruh unit berstatus <strong>READY & AVAILABLE</strong> pada filter periode dan gudang yang dipilih.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Fundamental Kontrol Margin:</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-snug">
              Setiap deal closing tim sales dikontrol secara otomatis agar tidak menembus batas Floor Price untuk mengamankan <strong>realized margin 20% - 35%</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 4. FINANCIAL KPI METRICS (SYNCHRONIZED WITH ACTIVE FILTERS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Omzet Closing BBKitchen</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-amber-400 font-mono mt-1">
            {formatIDR(dynamicKPIs.revenue)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Dari {dynamicKPIs.bbkSalesCount} unit closing sales resmi
          </p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Realized Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatIDR(dynamicKPIs.profit)}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-block px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded text-[10px] font-bold font-mono">
              Margin {dynamicKPIs.avgMargin}%
            </span>
            <span className="text-[10px] text-slate-500">bersih vs HPP</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Unit Terjual</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-white font-mono mt-1">
            {dynamicKPIs.totalDeals} <span className="text-xs text-slate-400 font-normal">Unit</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {dynamicKPIs.bbkSalesCount} Sales BBK • {dynamicKPIs.thirdPartyCount} Rekanan Gudang
          </p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kecepatan Putar (Aging)</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-purple-300 font-mono mt-1">
            {dynamicKPIs.avgAging} <span className="text-xs text-slate-400 font-normal">Hari</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Rata-rata durasi stok sejak masuk
          </p>
        </div>
      </div>

      {/* 5. CLOSING DEAL LEDGER TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Buku Rekap Closing Deal Ledger ({filteredDeals.length} Baris Transaksi)
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari SKU, nama mesin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">SKU Unit</th>
                <th className="py-3 px-3.5">Nama Mesin & Spesifikasi</th>
                <th className="py-3 px-3.5">Tanggal Terjual</th>
                <th className="py-3 px-3.5">Durasi (Aging)</th>
                <th className="py-3 px-3.5">Lokasi Gudang</th>
                <th className="py-3 px-3.5 text-right">Modal (HPP)</th>
                <th className="py-3 px-3.5 text-right text-amber-400">Harga Closing</th>
                <th className="py-3 px-3.5 text-right text-emerald-400">Realized Profit</th>
                <th className="py-3 px-3.5 text-center">Channel</th>
                <th className="py-3 px-3.5 text-center">Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    Memuat data closing ledger...
                  </td>
                </tr>
              ) : filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    Tidak ada transaksi closing deal pada jangka penanggalan yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr key={deal.sku} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-amber-400">
                      {deal.sku}
                    </td>
                    <td className="py-3 px-3.5 max-w-xs">
                      <p className="font-bold text-slate-200 line-clamp-1">{deal.productTitle}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{deal.notes}</p>
                    </td>
                    <td className="py-3 px-3.5 text-slate-300 font-mono text-[11px]">
                      {deal.tanggalTerjual || '-'}
                    </td>
                    <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px]">
                      {deal.durasiTerjual}
                    </td>
                    <td className="py-3 px-3.5 text-slate-300">
                      <span className="inline-block px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-300">
                        {deal.lokasiGudang || 'Gudang Pusat'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-400">
                      {deal.hargaModal > 0 ? formatIDR(deal.hargaModal) : '-'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-400">
                      {deal.soldBy === 'SALES_BBK' && deal.hargaClosing > 0
                        ? formatIDR(deal.hargaClosing)
                        : 'Rekanan Gudang'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                      {deal.soldBy === 'SALES_BBK' && deal.realizedProfit > 0 ? (
                        <div>
                          <span>+{formatIDR(deal.realizedProfit)}</span>
                          <span className="text-[10px] text-emerald-500/80 block font-normal">
                            ({deal.marginPercent}%)
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {deal.soldBy === 'SALES_BBK' ? (
                        <span className="inline-block px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                          Sales BBK
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px]">
                          Pihak Ketiga
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDocFromDeal(deal, 'RECEIPT')}
                          title="Cetak Kuitansi Lunas"
                          className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-800 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDocFromDeal(deal, 'INVOICE')}
                          title="Cetak Invoice"
                          className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-800 text-amber-300 border border-amber-800 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDocFromDeal(deal, 'DELIVERY_NOTE')}
                          title="Cetak Surat Jalan"
                          className="p-1.5 rounded-lg bg-orange-950/80 hover:bg-orange-800 text-orange-300 border border-orange-800 transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-IN-1 OFFICIAL DOCUMENT PRINT & PREVIEW MODAL */}
      {selectedInvoice && (
        <OfficialDocumentModal
          invoice={selectedInvoice}
          isOpen={isDocModalOpen}
          initialType={documentModalType}
          onClose={() => setIsDocModalOpen(false)}
        />
      )}
    </div>
  );
}
