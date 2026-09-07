'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { ClosingDealItem, Invoice, DocumentType } from '@/lib/types/finance';
import { formatIDR, resolveLocationFromCode } from '@/lib/repositories/warehouse-utils';
import { OFFICIAL_CATEGORIES } from '@/lib/repositories/categories';
import { OfficialDocumentModal } from './OfficialDocumentModal';
import {
  Banknote,
  Percent,
  Receipt,
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
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Activity,
  AlertTriangle,
  Award,
  Zap,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';

type DatePreset = 'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM';
type GrowthMetric = 'REVENUE' | 'PROFIT' | 'CLOSING' | 'UNITS';
type UnitEconomicsMetric = 'PROFIT' | 'MARGIN' | 'UNITS';

interface InventorySummaryItem {
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

export function FinanceDashboard() {
  const { role, permissions } = useAuth();
  const [deals, setDeals] = useState<ClosingDealItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventorySummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. PRIMARY FILTERS
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'SALES_BBK' | 'THIRD_PARTY'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // UI Interactive States
  const [growthMetric, setGrowthMetric] = useState<GrowthMetric>('REVENUE');
  const [unitEconMetric, setUnitEconMetric] = useState<UnitEconomicsMetric>('PROFIT');

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [documentModalType, setDocumentModalType] = useState<DocumentType>('INVOICE');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Pagination for Closing Deal Ledger
  const [dealPage, setDealPage] = useState(1);
  const [dealPageSize, setDealPageSize] = useState(25);
  const [dealPageInput, setDealPageInput] = useState('1');

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();

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

  // Helper to match official 13 Warehouse Hub codes (GK, BB, SM, BL, ML, RB, KG, PY, PE, SK, WT, ON, RK)
  const matchWarehouseHub = (itemLocation: string, itemAsalGudang?: string, skuStr?: string, hubFilter: string = 'ALL') => {
    if (!hubFilter || hubFilter === 'ALL') return true;
    const wh = hubFilter.toUpperCase().trim();
    const code = (itemAsalGudang || '').toUpperCase().trim();
    const sku = (skuStr || '').toUpperCase().trim();

    if (code && code === wh) return true;

    if (
      sku.startsWith(`${wh}-`) ||
      sku.startsWith(`${wh}_`) ||
      sku.startsWith(`BBK-${wh}-`) ||
      sku.startsWith(`BBK_${wh}_`) ||
      sku.includes(`-${wh}-`)
    ) {
      return true;
    }

    return false;
  };

  // Helper to match Category across Parent Groups, Children Slugs & Aliases
  const matchCategory = (itemTitle: string = '', itemCatSlugOrName: string = '', filter: string = 'ALL') => {
    if (!filter || filter === 'ALL') return true;

    const cleanFilter = filter.toLowerCase().trim();
    const cleanTitle = (itemTitle || '').toLowerCase();
    const cleanCat = (itemCatSlugOrName || '').toLowerCase();

    // Direct match check
    if (cleanCat && (cleanCat === cleanFilter || cleanCat.includes(cleanFilter) || cleanFilter.includes(cleanCat))) {
      return true;
    }

    // Find in OFFICIAL_CATEGORIES
    const group = OFFICIAL_CATEGORIES.find(
      (g) => g.name.toLowerCase() === cleanFilter || g.slug.toLowerCase() === cleanFilter
    );

    if (group) {
      const validTokens = [
        group.name.toLowerCase(),
        group.slug.toLowerCase(),
        group.slug.split('-')[0].toLowerCase(), // e.g. 'meja', 'sink', 'kompor', 'chiller', 'freezer', 'rak', 'hood', 'showcase'
        ...group.children.map((c) => c.slug.toLowerCase()),
        ...group.children.map((c) => c.name.toLowerCase()),
      ];

      // Add specific domain aliases
      if (group.slug === 'kompor') {
        validTokens.push('fryer', 'deep fryer', 'boiler', 'oven', 'kwali', 'wok', 'stove', 'grill', 'teppanyaki');
      } else if (group.slug === 'hood-stainless') {
        validTokens.push('exhaust', 'blower', 'ducting', 'hood');
      } else if (group.slug === 'ice-system') {
        validTokens.push('ice maker', 'ice bin', 'ice machine', 'es batu', 'es kristal');
      } else if (group.slug === 'rak-stainless') {
        validTokens.push('wallshelf', 'troli', 'trolley', 'shelf');
      }

      return validTokens.some((token) => {
        if (!token) return false;
        return cleanCat.includes(token) || token.includes(cleanCat) || cleanTitle.includes(token);
      });
    }

    // Fallback: word token matching
    const words = cleanFilter.split(/\s+/).filter((w) => w.length > 2 && w !== 'stainless' && w !== 'dan' && w !== '&');
    if (words.length > 0) {
      return words.some((w) => cleanCat.includes(w) || cleanTitle.includes(w));
    }

    return cleanTitle.includes(cleanFilter) || cleanCat.includes(cleanFilter);
  };

  // Dynamic Date Bounds for Active Period & Previous Period (For Growth Calculation)
  const { dateBounds, prevDateBounds } = useMemo(() => {
    let startFilter: string | null = null;
    let endFilter: string | null = null;
    let prevStartFilter: string | null = null;
    let prevEndFilter: string | null = null;

    if (datePreset === 'LAST_7_DAYS') {
      const endObj = new Date(now);
      const startObj = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevEndObj = new Date(startObj.getTime() - 1 * 24 * 60 * 60 * 1000);
      const prevStartObj = new Date(startObj.getTime() - 8 * 24 * 60 * 60 * 1000);

      startFilter = startObj.toISOString().split('T')[0];
      endFilter = endObj.toISOString().split('T')[0];
      prevStartFilter = prevStartObj.toISOString().split('T')[0];
      prevEndFilter = prevEndObj.toISOString().split('T')[0];
    } else if (datePreset === 'LAST_30_DAYS') {
      const endObj = new Date(now);
      const startObj = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const prevEndObj = new Date(startObj.getTime() - 1 * 24 * 60 * 60 * 1000);
      const prevStartObj = new Date(startObj.getTime() - 31 * 24 * 60 * 60 * 1000);

      startFilter = startObj.toISOString().split('T')[0];
      endFilter = endObj.toISOString().split('T')[0];
      prevStartFilter = prevStartObj.toISOString().split('T')[0];
      prevEndFilter = prevEndObj.toISOString().split('T')[0];
    } else if (datePreset === 'THIS_MONTH') {
      const startObj = new Date(now.getFullYear(), now.getMonth(), 1);
      const endObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const prevStartObj = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEndObj = new Date(now.getFullYear(), now.getMonth(), 0);

      startFilter = startObj.toISOString().split('T')[0];
      endFilter = endObj.toISOString().split('T')[0];
      prevStartFilter = prevStartObj.toISOString().split('T')[0];
      prevEndFilter = prevEndObj.toISOString().split('T')[0];
    } else if (datePreset === 'LAST_MONTH') {
      const startObj = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endObj = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevStartObj = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const prevEndObj = new Date(now.getFullYear(), now.getMonth() - 1, 0);

      startFilter = startObj.toISOString().split('T')[0];
      endFilter = endObj.toISOString().split('T')[0];
      prevStartFilter = prevStartObj.toISOString().split('T')[0];
      prevEndFilter = prevEndObj.toISOString().split('T')[0];
    } else if (datePreset === 'THIS_YEAR') {
      startFilter = `${now.getFullYear()}-01-01`;
      endFilter = `${now.getFullYear()}-12-31`;
      prevStartFilter = `${now.getFullYear() - 1}-01-01`;
      prevEndFilter = `${now.getFullYear() - 1}-12-31`;
    } else if (datePreset === 'CUSTOM') {
      if (startDate) startFilter = startDate;
      if (endDate) endFilter = endDate;
    }

    return {
      dateBounds: { startFilter, endFilter },
      prevDateBounds: { startFilter: prevStartFilter, endFilter: prevEndFilter },
    };
  }, [datePreset, startDate, endDate, now]);

  const extractISODate = (raw?: string): string => {
    if (!raw) return '';
    const str = String(raw).trim();
    const iso = str.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];
    const dmy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    const d = new Date(str.replace(/\./g, ':'));
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return str;
  };

  // 1. FILTERED DEALS (ACTIVE PERIOD)
  const filteredDeals = useMemo(() => {
    const { startFilter, endFilter } = dateBounds;

    return deals.filter((deal) => {
      // Keyword search
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        deal.sku.toLowerCase().includes(q) ||
        deal.productTitle.toLowerCase().includes(q) ||
        deal.lokasiGudang.toLowerCase().includes(q) ||
        (deal.notes ? deal.notes.toLowerCase().includes(q) : false);

      // Channel filter
      const matchChannel = channelFilter === 'ALL' || deal.soldBy === channelFilter;

      // Warehouse filter
      const matchWarehouse = matchWarehouseHub(deal.lokasiGudang, deal.asalGudang, deal.sku, warehouseFilter);

      // Category filter (match on title and category field)
      const matchCat = categoryFilter === 'ALL' || matchCategory(deal.productTitle, deal.category, categoryFilter);

      // Date filtering comparison on clean ISO YYYY-MM-DD
      let matchDate = true;
      if (startFilter || endFilter) {
        const dealDateStr = extractISODate(deal.tanggalTerjual || deal.tanggalMasuk);
        if (!dealDateStr) {
          matchDate = false;
        } else {
          if (startFilter && dealDateStr < startFilter) matchDate = false;
          if (endFilter && dealDateStr > endFilter) matchDate = false;
        }
      }

      return matchQ && matchChannel && matchWarehouse && matchCat && matchDate;
    });
  }, [deals, searchQuery, channelFilter, warehouseFilter, categoryFilter, dateBounds]);

  const dealTotalPages = Math.max(1, Math.ceil(filteredDeals.length / dealPageSize));
  const paginatedDeals = useMemo(() => {
    const start = (dealPage - 1) * dealPageSize;
    return filteredDeals.slice(start, start + dealPageSize);
  }, [filteredDeals, dealPage, dealPageSize]);

  // PREVIOUS PERIOD DEALS (FOR GROWTH COMPARISON)
  const previousDeals = useMemo(() => {
    const { startFilter, endFilter } = prevDateBounds;
    if (!startFilter && !endFilter) return [];

    return deals.filter((deal) => {
      const matchChannel = channelFilter === 'ALL' || deal.soldBy === channelFilter;
      const matchWarehouse = matchWarehouseHub(deal.lokasiGudang, deal.asalGudang, deal.sku, warehouseFilter);
      const matchCat = categoryFilter === 'ALL' || matchCategory(deal.productTitle, deal.category, categoryFilter);

      const dealDateStr = extractISODate(deal.tanggalTerjual || deal.tanggalMasuk);
      if (!dealDateStr) return false;
      if (startFilter && dealDateStr < startFilter) return false;
      if (endFilter && dealDateStr > endFilter) return false;

      return matchChannel && matchWarehouse && matchCat;
    });
  }, [deals, channelFilter, warehouseFilter, categoryFilter, prevDateBounds]);

  // 2. FILTERED INVENTORY (FOR SUPPLY & ASSET VALUATION)
  const filteredInventory = useMemo(() => {
    const { startFilter, endFilter } = dateBounds;

    return inventoryItems.filter((item) => {
      const matchWarehouse = matchWarehouseHub(item.warehouse, item.asalGudang, item.sku, warehouseFilter);
      const matchCat = categoryFilter === 'ALL' || matchCategory(item.category, item.category, categoryFilter);

      if (!matchWarehouse || !matchCat) return false;

      if (startFilter || endFilter) {
        const itemDate = item.inDate || item.soldDate || '';
        if (itemDate) {
          if (startFilter && itemDate < startFilter) return false;
          if (endFilter && itemDate > endFilter) return false;
        }
      }

      return true;
    });
  }, [inventoryItems, warehouseFilter, categoryFilter, dateBounds]);

  // 3. FINANCIAL HEALTH METRICS
  const healthKPIs = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let bbkSalesCount = 0;
    let thirdPartyCount = 0;
    let totalCogs = 0;

    filteredDeals.forEach((d) => {
      const closingVal = d.hargaClosing > 0 ? d.hargaClosing : (d.hargaModal || 0);
      revenue += closingVal;
      totalCogs += d.hargaModal || (d.hargaClosing - d.realizedProfit);
      profit += d.realizedProfit || 0;

      if (d.soldBy === 'SALES_BBK') {
        bbkSalesCount++;
      } else {
        thirdPartyCount++;
      }
    });

    const totalDeals = filteredDeals.length;
    const unitsSold = totalDeals; // Each deal corresponds to 1 unit in BBKitchen deal ledger
    const grossMarginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return {
      revenue,
      grossProfit: profit,
      grossMarginPct,
      totalDeals,
      bbkSalesCount,
      thirdPartyCount,
      unitsSold,
      totalCogs,
    };
  }, [filteredDeals]);

  // 4. GROWTH CALCULATIONS (COMPARED TO PREVIOUS PERIOD)
  const growthKPIs = useMemo(() => {
    let prevRevenue = 0;
    let prevProfit = 0;
    let prevDealsCount = 0;

    previousDeals.forEach((d) => {
      const closingVal = d.hargaClosing > 0 ? d.hargaClosing : (d.hargaModal || 0);
      prevRevenue += closingVal;
      prevProfit += d.realizedProfit || 0;
      prevDealsCount++;
    });

    const prevUnitsSold = prevDealsCount;

    const calcGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const revenueGrowth = calcGrowth(healthKPIs.revenue, prevRevenue);
    const profitGrowth = calcGrowth(healthKPIs.grossProfit, prevProfit);
    const closingGrowth = calcGrowth(healthKPIs.totalDeals, prevDealsCount);
    const unitsGrowth = calcGrowth(healthKPIs.unitsSold, prevUnitsSold);

    return {
      prevRevenue,
      prevProfit,
      prevDealsCount,
      prevUnitsSold,
      revenueGrowth,
      profitGrowth,
      closingGrowth,
      unitsGrowth,
      hasPrevData: previousDeals.length > 0,
    };
  }, [previousDeals, healthKPIs]);

  // 5. TIME-SERIES TIMELINE CHART DATA
  const timelineChartData = useMemo(() => {
    const timelineMap = new Map<string, { date: string; revenue: number; profit: number; closing: number; units: number }>();

    filteredDeals.forEach((deal) => {
      const dateStr = deal.tanggalTerjual ? deal.tanggalTerjual.split('T')[0] : 'Unknown';
      if (dateStr === 'Unknown') return;

      if (!timelineMap.has(dateStr)) {
        timelineMap.set(dateStr, {
          date: dateStr,
          revenue: 0,
          profit: 0,
          closing: 0,
          units: 0,
        });
      }

      const bucket = timelineMap.get(dateStr)!;
      bucket.closing++;
      bucket.units++;
      const closingVal = deal.hargaClosing > 0 ? deal.hargaClosing : (deal.hargaModal || 0);
      bucket.revenue += closingVal;
      bucket.profit += deal.realizedProfit || 0;
    });

    return Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredDeals]);

  // 6. UNIT ECONOMICS METRICS & TOP CATEGORIES BREAKDOWN
  const categoryEconomics = useMemo(() => {
    const map = new Map<string, {
      category: string;
      unitsSold: number;
      revenueSum: number;
      cogsSum: number;
      profitSum: number;
      readyUnits: number;
      readyCostSum: number;
    }>();

    // Aggregate from filtered deals
    filteredDeals.forEach((deal) => {
      const cat = deal.productTitle.split(' ')[0] || 'Umum';
      if (!map.has(cat)) {
        map.set(cat, {
          category: cat,
          unitsSold: 0,
          revenueSum: 0,
          cogsSum: 0,
          profitSum: 0,
          readyUnits: 0,
          readyCostSum: 0,
        });
      }
      const entry = map.get(cat)!;
      entry.unitsSold++;
      const closingVal = deal.hargaClosing > 0 ? deal.hargaClosing : (deal.hargaModal || 0);
      entry.revenueSum += closingVal;
      entry.cogsSum += deal.hargaModal || 0;
      entry.profitSum += deal.realizedProfit || 0;
    });

    // Aggregate ready supply from inventory
    filteredInventory.forEach((item) => {
      const isReady = item.statusUnit === 'READY' || item.statusUnit === 'AVAILABLE';
      if (isReady) {
        const cat = item.category || 'Umum';
        if (!map.has(cat)) {
          map.set(cat, {
            category: cat,
            unitsSold: 0,
            revenueSum: 0,
            cogsSum: 0,
            profitSum: 0,
            readyUnits: 0,
            readyCostSum: 0,
          });
        }
        const entry = map.get(cat)!;
        entry.readyUnits++;
        entry.readyCostSum += item.modal || 0;
      }
    });

    return Array.from(map.values()).map((c) => {
      const asp = c.unitsSold > 0 ? Math.round(c.revenueSum / c.unitsSold) : 0;
      const avgCost = c.unitsSold > 0 ? Math.round(c.cogsSum / c.unitsSold) : 0;
      const avgProfit = c.unitsSold > 0 ? Math.round(c.profitSum / c.unitsSold) : 0;
      const marginPct = c.revenueSum > 0 ? Math.round((c.profitSum / c.revenueSum) * 100) : 0;

      return {
        ...c,
        asp,
        avgCost,
        avgProfit,
        marginPct,
      };
    });
  }, [filteredDeals, filteredInventory]);

  // Overall Unit Economics averages
  const unitEconomicsAverages = useMemo(() => {
    const bbkDeals = filteredDeals.filter((d) => d.soldBy === 'SALES_BBK');
    const totalCount = bbkDeals.length;

    const asp = totalCount > 0 ? Math.round(healthKPIs.revenue / totalCount) : 0;
    const avgHpp = totalCount > 0 ? Math.round(healthKPIs.totalCogs / totalCount) : 0;
    const avgProfit = totalCount > 0 ? Math.round(healthKPIs.grossProfit / totalCount) : 0;
    const avgMargin = healthKPIs.grossMarginPct;

    return { asp, avgHpp, avgProfit, avgMargin };
  }, [filteredDeals, healthKPIs]);

  // Top Products / Categories Chart Data
  const topCategoriesChartData = useMemo(() => {
    const sorted = [...categoryEconomics];
    if (unitEconMetric === 'PROFIT') {
      sorted.sort((a, b) => b.profitSum - a.profitSum);
    } else if (unitEconMetric === 'MARGIN') {
      sorted.sort((a, b) => b.marginPct - a.marginPct);
    } else {
      sorted.sort((a, b) => b.unitsSold - a.unitsSold);
    }

    return sorted.slice(0, 7).map((c) => ({
      category: c.category.length > 14 ? `${c.category.slice(0, 13)}…` : c.category,
      fullCategory: c.category,
      value:
        unitEconMetric === 'PROFIT'
          ? c.profitSum
          : unitEconMetric === 'MARGIN'
          ? c.marginPct
          : c.unitsSold,
      profit: c.profitSum,
      margin: c.marginPct,
      units: c.unitsSold,
    }));
  }, [categoryEconomics, unitEconMetric]);

  // 7. DEMAND & SUPPLY BREAKDOWN
  // Demand: Top Selling Categories
  const topDemandCategories = useMemo(() => {
    return [...categoryEconomics]
      .filter((c) => c.unitsSold > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }, [categoryEconomics]);

  // Supply: Global Partner Hub Supply across all 13 Hubs
  const allHubsSupply = useMemo(() => {
    const hubMap = new Map<string, { code: string; label: string; availableUnits: number; estPartnerCapital: number }>();

    const hubLabels: Record<string, string> = {
      GK: 'GK - Pamulang 2',
      BB: 'BB - Pamulang 2',
      SM: 'SM - Pamulang 2',
      BL: 'BL - Pamulang 2',
      ML: 'ML - Pamulang Barat',
      RB: 'RB - Pamulang Barat',
      KG: 'KG - Kitchen Gembel',
      PY: 'PY - Setu Tangsel',
      PE: 'PE - Sawangan Depok',
      SK: 'SK - Sanjaya Kitchen',
      WT: 'WT - Kedaung Tangsel',
      ON: 'ON - Kedaung Tangsel',
      RK: 'RK - Rizki Kitchen',
    };

    const { startFilter, endFilter } = dateBounds;
    let totalReadyGlobal = 0;
    let totalCapitalGlobal = 0;
    let totalAllUnitsGlobal = 0;

    inventoryItems.forEach((item) => {
      if (categoryFilter !== 'ALL' && !matchCategory(item.category, categoryFilter)) return;
      if (startFilter || endFilter) {
        const itemDate = item.inDate || item.soldDate || '';
        if (itemDate) {
          if (startFilter && itemDate < startFilter) return;
          if (endFilter && itemDate > endFilter) return;
        }
      }

      totalAllUnitsGlobal++;
      const isReady = item.statusUnit === 'READY' || item.statusUnit === 'AVAILABLE';
      if (isReady) {
        totalReadyGlobal++;
        totalCapitalGlobal += item.modal || 0;

        const code = item.asalGudang || 'GK';
        if (!hubMap.has(code)) {
          hubMap.set(code, {
            code,
            label: hubLabels[code] || `${code} Hub`,
            availableUnits: 0,
            estPartnerCapital: 0,
          });
        }
        const entry = hubMap.get(code)!;
        entry.availableUnits++;
        entry.estPartnerCapital += item.modal || 0;
      }
    });

    const list = Array.from(hubMap.values()).sort((a, b) => b.availableUnits - a.availableUnits);
    return {
      list,
      totalReadyGlobal,
      totalCapitalGlobal,
      totalAllUnitsGlobal,
    };
  }, [inventoryItems, categoryFilter, dateBounds]);

  // Selected Hub Details (When a specific Hub is chosen in filter)
  const selectedHubOverview = useMemo(() => {
    if (warehouseFilter === 'ALL') return null;

    const hub = allHubsSupply.list.find((h) => h.code === warehouseFilter) || {
      code: warehouseFilter,
      label: `${warehouseFilter} Hub`,
      availableUnits: 0,
      estPartnerCapital: 0,
    };

    // Total items terdata di hub ini (Ready + Sold)
    const allItemsInHub = inventoryItems.filter((it) =>
      matchWarehouseHub(it.warehouse, it.asalGudang, it.sku, warehouseFilter)
    );
    const totalUnitsInHub = allItemsInHub.length;
    const readyUnitsInHub = allItemsInHub.filter((it) => it.statusUnit === 'READY' || it.statusUnit === 'AVAILABLE').length;
    const soldUnitsInHub = allItemsInHub.filter((it) => it.statusUnit === 'SOLD').length;

    // Filtered deals in active filter
    const hubDeals = filteredDeals.filter((d) => matchWarehouseHub(d.lokasiGudang, d.asalGudang, d.sku, warehouseFilter));
    const hubDealsCount = hubDeals.length;

    const ratioVsGlobalReady = allHubsSupply.totalReadyGlobal > 0
      ? Math.round((readyUnitsInHub / allHubsSupply.totalReadyGlobal) * 100)
      : 0;

    const ratioVsHubTotal = totalUnitsInHub > 0
      ? Math.round((readyUnitsInHub / totalUnitsInHub) * 100)
      : 0;

    return {
      ...hub,
      availableUnits: readyUnitsInHub,
      totalUnitsInHub,
      soldUnitsInHub,
      hubDealsCount,
      ratioVsGlobalReady,
      ratioVsHubTotal,
      totalReadyGlobal: allHubsSupply.totalReadyGlobal,
      totalCapitalGlobal: allHubsSupply.totalCapitalGlobal,
      totalAllUnitsGlobal: allHubsSupply.totalAllUnitsGlobal,
    };
  }, [warehouseFilter, allHubsSupply, inventoryItems, filteredDeals]);

  // 8. RISKS & OPPORTUNITIES (DATA-DRIVEN INSIGHTS)
  const businessInsights = useMemo(() => {
    const lowMarginCats = categoryEconomics
      .filter((c) => c.unitsSold >= 2 && c.marginPct < 18)
      .sort((a, b) => a.marginPct - b.marginPct);

    const mostProfitableCat = [...categoryEconomics].sort((a, b) => b.profitSum - a.profitSum)[0];
    const topVolumeCat = [...categoryEconomics].sort((a, b) => b.unitsSold - a.unitsSold)[0];
    const topSupplyHub = allHubsSupply.list[0];

    return {
      lowMarginCats,
      mostProfitableCat,
      topVolumeCat,
      topSupplyHub,
    };
  }, [categoryEconomics, allHubsSupply]);

  // Handle Document Modal Trigger
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
      {/* 1. HEADER & REFRESH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 font-mono">
            <Banknote className="w-6 h-6 text-emerald-400" />
            <span>EXECUTIVE OWNER DASHBOARD & FINANCIALS</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Ringkasan 30-detik performa bisnis: Penjualan, Margin Laba Kotor, Pertumbuhan, Demand & Supply Rekanan.
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
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Memuat Data...' : 'Sync Real-Time'}</span>
        </button>
      </div>

      {/* 2. FILTER UTAMA (PERIODE, CHANNEL, KATEGORI, HUB) */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4.5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-200">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Filter Utama Bisnis</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Menganalisa <strong className="text-emerald-400">{filteredDeals.length}</strong> deal closing & <strong className="text-amber-400">{filteredInventory.length}</strong> unit stok live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Periode Preset */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">📅 Periode Waktu:</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-xs"
            >
              <option value="ALL">Semua Waktu (All Time)</option>
              <option value="LAST_7_DAYS">7 Hari Terakhir</option>
              <option value="LAST_30_DAYS">30 Hari Terakhir</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
              <option value="THIS_YEAR">Tahun Ini ({currentYear})</option>
              <option value="CUSTOM">Kustom Tanggal</option>
            </select>
          </div>

          {/* Channel Closing */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">💼 Channel Closing:</label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-xs"
            >
              <option value="ALL">Semua Channel ({deals.length} Total)</option>
              <option value="SALES_BBK">Sales WhatsApp BBKitchen</option>
              <option value="THIRD_PARTY">Rekanan Gudang / Pihak Ketiga</option>
            </select>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">📁 Kategori Produk:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-xs"
            >
              <option value="ALL">Semua Kategori</option>
              {OFFICIAL_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hub Rekanan Gudang */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">🏢 Hub Rekanan:</label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-xs"
            >
              <option value="ALL">Semua Hub Rekanan</option>
              <option value="GK">GK - Pamulang 2</option>
              <option value="BB">BB - Pamulang 2</option>
              <option value="SM">SM - Pamulang 2</option>
              <option value="BL">BL - Pamulang 2</option>
              <option value="ML">ML - Pamulang Barat</option>
              <option value="RB">RB - Pamulang Barat</option>
              <option value="KG">KG - Kitchen Gembel (Pamulang Barat)</option>
              <option value="PY">PY - Setu Tangsel</option>
              <option value="PE">PE - Sawangan Depok</option>
              <option value="SK">SK - Sanjaya Kitchen (Sawangan Depok)</option>
              <option value="WT">WT - Kedaung Tangsel</option>
              <option value="ON">ON - Kedaung Tangsel</option>
              <option value="RK">RK - Rizki Kitchen (Rawakalong Bogor)</option>
            </select>
          </div>

          {/* Custom Date Inputs */}
          {datePreset === 'CUSTOM' && (
            <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold shrink-0">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold shrink-0">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FINANCIAL HEALTH (REVENUE, GROSS PROFIT, MARGIN, ORDERS, UNITS) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>1. Financial Health (Kesehatan Finansial)</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono font-bold">
            Realized Closing Data
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Revenue */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Penjualan (Revenue)</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
              {formatIDR(healthKPIs.revenue)}
            </div>
            <p className="text-[10px] text-slate-500">Closing Sales WhatsApp</p>
          </div>

          {/* Gross Profit */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Profit (Laba Kotor)</span>
            <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
              {formatIDR(healthKPIs.grossProfit)}
            </div>
            <p className="text-[10px] text-slate-500">Laba Bersih Realisasi</p>
          </div>

          {/* Gross Margin */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Margin %</span>
            <div className="text-lg sm:text-xl font-black text-purple-400 font-mono">
              {healthKPIs.grossMarginPct}%
            </div>
            <p className="text-[10px] text-slate-500">Persentase Margin Rata-rata</p>
          </div>

          {/* Closing Deals / Orders */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Closing / Orders</span>
            <div className="text-lg sm:text-xl font-black text-white font-mono">
              {healthKPIs.totalDeals} <span className="text-xs font-normal text-slate-400">Deals</span>
            </div>
            <p className="text-[10px] text-slate-500">{healthKPIs.bbkSalesCount} WA • {healthKPIs.thirdPartyCount} Rekanan</p>
          </div>

          {/* Units Sold */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Units Sold (Terjual)</span>
            <div className="text-lg sm:text-xl font-black text-blue-400 font-mono">
              {healthKPIs.unitsSold} <span className="text-xs font-normal text-slate-400">Unit</span>
            </div>
            <p className="text-[10px] text-slate-500">Unit Fisik Terkirim</p>
          </div>
        </div>

        {/* Revenue vs Gross Profit Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Grafik Penjualan vs Laba Kotor (Revenue vs Gross Profit)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Tren nominal omset penjualan dan profit riil berdasarkan periode aktif.</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {timelineChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Tidak ada data transaksi closing pada periode ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: any) => formatIDR(Number(val))}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="revenue" name="Total Penjualan" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#f59e0b" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GROWTH (BISNIS NAIK ATAU TURUN?) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>2. Growth (Pertumbuhan Bisnis vs Periode Sebelumnya)</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-blue-400 font-mono font-bold">
            Period-over-Period
          </span>
        </div>

        {/* Growth Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Revenue Growth */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Revenue Growth</span>
            <div className={`text-lg sm:text-xl font-black font-mono flex items-center gap-1 ${growthKPIs.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {growthKPIs.revenueGrowth >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              <span>{growthKPIs.revenueGrowth > 0 ? `+${growthKPIs.revenueGrowth}%` : `${growthKPIs.revenueGrowth}%`}</span>
            </div>
            <p className="text-[10px] text-slate-500">Lalu: {formatIDR(growthKPIs.prevRevenue)}</p>
          </div>

          {/* Profit Growth */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Profit Growth</span>
            <div className={`text-lg sm:text-xl font-black font-mono flex items-center gap-1 ${growthKPIs.profitGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {growthKPIs.profitGrowth >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              <span>{growthKPIs.profitGrowth > 0 ? `+${growthKPIs.profitGrowth}%` : `${growthKPIs.profitGrowth}%`}</span>
            </div>
            <p className="text-[10px] text-slate-500">Lalu: {formatIDR(growthKPIs.prevProfit)}</p>
          </div>

          {/* Closing Growth */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Closing Growth</span>
            <div className={`text-lg sm:text-xl font-black font-mono flex items-center gap-1 ${growthKPIs.closingGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {growthKPIs.closingGrowth >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              <span>{growthKPIs.closingGrowth > 0 ? `+${growthKPIs.closingGrowth}%` : `${growthKPIs.closingGrowth}%`}</span>
            </div>
            <p className="text-[10px] text-slate-500">Lalu: {growthKPIs.prevDealsCount} Deals</p>
          </div>

          {/* Unit Growth */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unit Sold Growth</span>
            <div className={`text-lg sm:text-xl font-black font-mono flex items-center gap-1 ${growthKPIs.unitsGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {growthKPIs.unitsGrowth >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              <span>{growthKPIs.unitsGrowth > 0 ? `+${growthKPIs.unitsGrowth}%` : `${growthKPIs.unitsGrowth}%`}</span>
            </div>
            <p className="text-[10px] text-slate-500">Lalu: {growthKPIs.prevUnitsSold} Unit</p>
          </div>
        </div>

        {/* Interactive Growth Performance Over Time Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>Performance Over Time (Tren Performa Interaktif)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Pilih metrik pertumbuhan yang ingin ditinjau sepanjang waktu.</p>
            </div>

            {/* Metric Switcher Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setGrowthMetric('REVENUE')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  growthMetric === 'REVENUE' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Penjualan
              </button>
              <button
                type="button"
                onClick={() => setGrowthMetric('PROFIT')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  growthMetric === 'PROFIT' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Profit
              </button>
              <button
                type="button"
                onClick={() => setGrowthMetric('CLOSING')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  growthMetric === 'CLOSING' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Closing Deals
              </button>
              <button
                type="button"
                onClick={() => setGrowthMetric('UNITS')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  growthMetric === 'UNITS' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Units
              </button>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            {timelineChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Tidak ada data pada periode ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(val) =>
                      growthMetric === 'REVENUE' || growthMetric === 'PROFIT'
                        ? `Rp ${(val / 1000000).toFixed(0)}Jt`
                        : `${val}`
                    }
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: any) =>
                      growthMetric === 'REVENUE' || growthMetric === 'PROFIT'
                        ? formatIDR(Number(val))
                        : `${val} Unit/Deal`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey={
                      growthMetric === 'REVENUE'
                        ? 'revenue'
                        : growthMetric === 'PROFIT'
                        ? 'profit'
                        : growthMetric === 'CLOSING'
                        ? 'closing'
                        : 'units'
                    }
                    name={
                      growthMetric === 'REVENUE'
                        ? 'Penjualan'
                        : growthMetric === 'PROFIT'
                        ? 'Gross Profit'
                        : growthMetric === 'CLOSING'
                        ? 'Jumlah Closing'
                        : 'Jumlah Unit'
                    }
                    stroke={
                      growthMetric === 'REVENUE'
                        ? '#10b981'
                        : growthMetric === 'PROFIT'
                        ? '#f59e0b'
                        : growthMetric === 'CLOSING'
                        ? '#3b82f6'
                        : '#a855f7'
                    }
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. UNIT ECONOMICS (PRODUK MANA YANG MENGHASILKAN?) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-amber-400" />
            <span>3. Unit Economics (Rata-Rata per Transaksi Unit)</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-400 font-mono font-bold">
            Average Economics
          </span>
        </div>

        {/* 4 Unit Economics Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Selling Price (ASP)</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
              {formatIDR(unitEconomicsAverages.asp)}
            </div>
            <p className="text-[10px] text-slate-500">Rata-rata Harga Closing</p>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average HPP Modal</span>
            <div className="text-lg sm:text-xl font-black text-indigo-400 font-mono">
              {formatIDR(unitEconomicsAverages.avgHpp)}
            </div>
            <p className="text-[10px] text-slate-500">Rata-rata HPP per Unit</p>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Profit per Unit</span>
            <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
              {formatIDR(unitEconomicsAverages.avgProfit)}
            </div>
            <p className="text-[10px] text-slate-500">Laba Kotor per Transaksi</p>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Margin</span>
            <div className="text-lg sm:text-xl font-black text-purple-400 font-mono">
              {unitEconomicsAverages.avgMargin}%
            </div>
            <p className="text-[10px] text-slate-500">Rata-rata Margin Realisasi</p>
          </div>
        </div>

        {/* Top Products / Categories Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Top Kategori / Produk Paling Menguntungkan</span>
              </h3>
              <p className="text-[11px] text-slate-400">Peringkat kontribusi keuntungan per kategori mesin restoran.</p>
            </div>

            {/* Toggle Profit / Margin / Units Sold */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setUnitEconMetric('PROFIT')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  unitEconMetric === 'PROFIT' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Laba Kotor (Rp)
              </button>
              <button
                type="button"
                onClick={() => setUnitEconMetric('MARGIN')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  unitEconMetric === 'MARGIN' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Margin (%)
              </button>
              <button
                type="button"
                onClick={() => setUnitEconMetric('UNITS')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  unitEconMetric === 'UNITS' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Unit Terjual
              </button>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            {topCategoriesChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Tidak ada data kategori yang sesuai.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategoriesChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} interval={0} angle={-10} textAnchor="end" />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(val) =>
                      unitEconMetric === 'PROFIT'
                        ? `Rp ${(val / 1000000).toFixed(0)}Jt`
                        : unitEconMetric === 'MARGIN'
                        ? `${val}%`
                        : `${val}`
                    }
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: any) =>
                      unitEconMetric === 'PROFIT'
                        ? formatIDR(Number(val))
                        : unitEconMetric === 'MARGIN'
                        ? `${val}%`
                        : `${val} Unit Terjual`
                    }
                  />
                  <Bar
                    dataKey="value"
                    name={
                      unitEconMetric === 'PROFIT'
                        ? 'Total Gross Profit'
                        : unitEconMetric === 'MARGIN'
                        ? 'Margin %'
                        : 'Unit Terjual'
                    }
                    fill={unitEconMetric === 'PROFIT' ? '#f59e0b' : unitEconMetric === 'MARGIN' ? '#a855f7' : '#10b981'}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DEMAND & SUPPLY (SUPPLY ADA DI MANA?) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>4. Demand & Supply Rekanan</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-400 font-mono font-bold">
            Stok Siap Jual Rekanan Gudang
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Panel DEMAND: Top Products by Units Sold */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    DEMAND: Kategori Paling Cepat Terjual
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Closing Velocity</span>
              </div>

              <div className="divide-y divide-slate-800/60 mt-2">
                {topDemandCategories.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Tidak ada transaksi pada filter ini.</p>
                ) : (
                  topDemandCategories.map((item, idx) => (
                    <div key={item.category} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-[10px] text-amber-400 font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-200 block">{item.category}</span>
                          <span className="text-[10px] text-slate-400">ASP: {formatIDR(item.asp)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400">{item.unitsSold} Unit Terjual</span>
                        <span className="text-[10px] text-slate-400 block">Margin: {item.marginPct}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
              💡 Kategori di atas memiliki perputaran paling cepat di pasar resto.
            </p>
          </div>

          {/* Panel SUPPLY: Overview by Filter vs Full Ranked List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
            {selectedHubOverview ? (
              /* FOCUSED OVERVIEW WHEN HUB FILTER IS SELECTED */
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      SUPPLY: OVERVIEW GUDANG {selectedHubOverview.code}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWarehouseFilter('ALL')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-mono flex items-center gap-1"
                    title="Kembali tampilkan semua hub rekanan"
                  >
                    <span>Semua Hub</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="pt-3 space-y-3">
                  {/* Valuasi Pergudang */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Valuasi Modal Stok Ready {selectedHubOverview.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono font-bold">
                        {selectedHubOverview.ratioVsGlobalReady}% Pasokan Global
                      </span>
                    </div>
                    <div className="text-xl font-black text-indigo-400 font-mono">
                      {formatIDR(selectedHubOverview.estPartnerCapital)}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{selectedHubOverview.label}</p>
                  </div>

                  {/* 2 Detail Rasio Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Rasio 1: vs Total Unit Ready Global */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold block">
                        Pasokan vs Total Ready Global:
                      </span>
                      <div className="font-mono text-xs font-bold text-slate-200">
                        <span className="text-indigo-400 font-black text-sm">{selectedHubOverview.availableUnits} Unit</span>
                        <span className="text-slate-400 text-xs"> / {selectedHubOverview.totalReadyGlobal} Unit Ready</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-1">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(2, selectedHubOverview.ratioVsGlobalReady))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-indigo-300/90 font-mono block">
                        {selectedHubOverview.ratioVsGlobalReady}% dari seluruh pasokan mitra
                      </span>
                    </div>

                    {/* Rasio 2: vs Total Unit Terdata di Hub Ini */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold block">
                        Ketersediaan di Hub {selectedHubOverview.code}:
                      </span>
                      <div className="font-mono text-xs font-bold text-slate-200">
                        <span className="text-emerald-400 font-black text-sm">{selectedHubOverview.availableUnits} Unit</span>
                        <span className="text-slate-400 text-xs"> / {selectedHubOverview.totalUnitsInHub} Unit Terdata</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-1">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(2, selectedHubOverview.ratioVsHubTotal))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {selectedHubOverview.ratioVsHubTotal}% Ready • <strong className="text-amber-400">{selectedHubOverview.soldUnitsInHub} Terjual</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* FULL RANKED LIST WHEN FILTER IS ALL */
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-400" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        SUPPLY: STOK SIAP JUAL REKANAN GUDANG
                      </h3>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">13 Hub Rekanan</span>
                </div>

                <div className="pt-2 pb-1 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Total: <strong className="text-indigo-400 font-mono">{allHubsSupply.totalReadyGlobal} Unit Ready</strong></span>
                  <span>Valuasi Modal: <strong className="text-slate-200 font-mono">{formatIDR(allHubsSupply.totalCapitalGlobal)}</strong></span>
                </div>

                <div className="divide-y divide-slate-800/60 mt-1 max-h-52 overflow-y-auto pr-1">
                  {allHubsSupply.list.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">Tidak ada unit ready di hub rekanan.</p>
                  ) : (
                    allHubsSupply.list.map((hub) => (
                      <button
                        key={hub.code}
                        type="button"
                        onClick={() => setWarehouseFilter(hub.code)}
                        className="w-full py-2.5 flex items-center justify-between text-xs hover:bg-slate-850/60 px-2 rounded-lg transition-colors text-left group"
                        title={`Klik untuk zoom filter ${hub.label}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono font-bold text-[10px] text-indigo-300 group-hover:border-indigo-600 transition-colors">
                            {hub.code}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-200 block group-hover:text-white">{hub.label}</span>
                            <span className="text-[10px] text-slate-400">Modal: {formatIDR(hub.estPartnerCapital)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-indigo-400 block">{hub.availableUnits} Unit Ready</span>
                          <span className="text-[9px] text-slate-500">
                            {allHubsSupply.totalReadyGlobal > 0 ? `${Math.round((hub.availableUnits / allHubsSupply.totalReadyGlobal) * 100)}% total` : '0%'}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
              ℹ️ Stok di atas adalah unit siap jual di lokasi rekanan gudang mitra BBKitchen.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RISKS & OPPORTUNITIES (APA YANG PERLU DIPERHATIKAN?) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>5. Risks & Opportunities (Insight Aktual Berbasis Data)</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-400 font-mono font-bold">
            Real Analytics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Risk: Low Margin */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Produk Margin Rendah</span>
            </div>
            {businessInsights.lowMarginCats.length > 0 ? (
              <div>
                <p className="text-sm font-bold text-white">{businessInsights.lowMarginCats[0].category}</p>
                <p className="text-[11px] text-rose-300/90 mt-0.5">
                  Margin rata-rata hanya <strong>{businessInsights.lowMarginCats[0].marginPct}%</strong>. Perlu naikkan Harga Buka WA.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Seluruh kategori saat ini memiliki margin sehat di atas 18%.</p>
            )}
          </div>

          {/* Opportunity: Most Profitable */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <Award className="w-4 h-4" />
              <span>Paling Profitable</span>
            </div>
            {businessInsights.mostProfitableCat ? (
              <div>
                <p className="text-sm font-bold text-white">{businessInsights.mostProfitableCat.category}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Total Laba Kotor: <strong className="text-amber-400 font-mono">{formatIDR(businessInsights.mostProfitableCat.profitSum)}</strong> ({businessInsights.mostProfitableCat.marginPct}% margin).
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">-</p>
            )}
          </div>

          {/* Volume Leader */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
              <Flame className="w-4 h-4" />
              <span>Volume Terlaris</span>
            </div>
            {businessInsights.topVolumeCat ? (
              <div>
                <p className="text-sm font-bold text-white">{businessInsights.topVolumeCat.category}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Terjual <strong className="text-emerald-400 font-mono">{businessInsights.topVolumeCat.unitsSold} Unit</strong>. Demand sangat likuid di pasar resto.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">-</p>
            )}
          </div>

          {/* Supply Concentration */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
              <Building className="w-4 h-4" />
              <span>Fokus Pasokan Rekanan</span>
            </div>
            {businessInsights.topSupplyHub ? (
              <div>
                <p className="text-sm font-bold text-white">{businessInsights.topSupplyHub.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tersedia <strong className="text-purple-300 font-mono">{businessInsights.topSupplyHub.availableUnits} Unit</strong> siap closing untuk sales desk.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">-</p>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. BUKU REKAP CLOSING DEAL LEDGER (TABLE & 4-IN-1 DOCUMENT PRINT) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden space-y-0 shadow-xl">
        <div className="p-4.5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Buku Rekap Closing Deal Ledger ({filteredDeals.length} Transaksi)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daftar transaksi closing riil. Hanya transaksi Sales BBKitchen yang memiliki berkas dokumen resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari SKU / nama..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Top Pagination Controls */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-slate-300">
                <span className="text-[11px] text-slate-400">Hal</span>
                <input
                  type="number"
                  min={1}
                  max={dealTotalPages}
                  value={dealPageInput}
                  onChange={(e) => setDealPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const num = parseInt(dealPageInput, 10);
                      if (!isNaN(num) && num >= 1 && num <= dealTotalPages) {
                        setDealPage(num);
                      } else {
                        setDealPageInput(String(dealPage));
                      }
                    }
                  }}
                  onBlur={() => {
                    const num = parseInt(dealPageInput, 10);
                    if (!isNaN(num) && num >= 1 && num <= dealTotalPages) {
                      setDealPage(num);
                    } else {
                      setDealPageInput(String(dealPage));
                    }
                  }}
                  className="w-12 px-1.5 py-0.5 text-center bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  title="Ketik nomor halaman & tekan Enter"
                />
                <span className="text-[11px] text-slate-400">dari {dealTotalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={dealPage <= 1 || isLoading}
                  onClick={() => setDealPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={dealPage >= dealTotalPages || isLoading}
                  onClick={() => setDealPage((p) => Math.min(dealTotalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">SKU Unit</th>
                <th className="py-3 px-3.5">Nama Mesin & Deskripsi</th>
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
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Memuat data closing ledger...
                  </td>
                </tr>
              ) : paginatedDeals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    Tidak ada transaksi closing deal pada filter yang dipilih.
                  </td>
                </tr>
              ) : (
                paginatedDeals.map((deal) => (
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
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono font-bold text-[10px] text-indigo-300">
                          {deal.asalGudang || 'GK'}
                        </span>
                        <span className="text-[11px] text-slate-300">
                          {resolveLocationFromCode((deal.asalGudang || 'GK') as any)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-400">
                      {deal.hargaModal > 0 ? formatIDR(deal.hargaModal) : '-'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-400">
                      {deal.hargaClosing > 0 ? formatIDR(deal.hargaClosing) : (deal.hargaModal > 0 ? formatIDR(deal.hargaModal) : '-')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                      {deal.realizedProfit > 0 ? (
                        <span>
                          +{formatIDR(deal.realizedProfit)} <span className="text-[10px] font-normal text-emerald-500/80">({deal.marginPercent}%)</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {deal.soldBy === 'SALES_BBK' ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                          Sales BBK
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded text-[10px] font-bold">
                          Pihak Ketiga
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {deal.soldBy === 'SALES_BBK' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDocFromDeal(deal, 'INVOICE')}
                            title="Cetak Faktur Tagihan (Invoice)"
                            className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-800 text-amber-300 border border-amber-800 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDocFromDeal(deal, 'DELIVERY_NOTE')}
                            title="Cetak Surat Jalan Pengiriman"
                            className="p-1.5 rounded-lg bg-orange-950/80 hover:bg-orange-800 text-orange-300 border border-orange-800 transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        {dealTotalPages > 1 && (
          <div className="p-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 bg-slate-900/60">
            <span className="text-[11px]">
              Menampilkan {((dealPage - 1) * dealPageSize) + 1} - {Math.min(dealPage * dealPageSize, filteredDeals.length)} dari {filteredDeals.length} Transaksi Closing
            </span>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 font-mono text-slate-300">
                <span className="text-[11px] text-slate-400">Hal</span>
                <input
                  type="number"
                  min={1}
                  max={dealTotalPages}
                  value={dealPageInput}
                  onChange={(e) => setDealPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const num = parseInt(dealPageInput, 10);
                      if (!isNaN(num) && num >= 1 && num <= dealTotalPages) {
                        setDealPage(num);
                      } else {
                        setDealPageInput(String(dealPage));
                      }
                    }
                  }}
                  onBlur={() => {
                    const num = parseInt(dealPageInput, 10);
                    if (!isNaN(num) && num >= 1 && num <= dealTotalPages) {
                      setDealPage(num);
                    } else {
                      setDealPageInput(String(dealPage));
                    }
                  }}
                  className="w-12 px-1.5 py-0.5 text-center bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[11px] text-slate-400">dari {dealTotalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={dealPage <= 1 || isLoading}
                  onClick={() => setDealPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={dealPage >= dealTotalPages || isLoading}
                  onClick={() => setDealPage((p) => Math.min(dealTotalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
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
