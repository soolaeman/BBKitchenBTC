'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import {
  CashflowEntry,
  CashflowType,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '@/lib/types/cashflow';
import {
  Plus,
  RefreshCw,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  Trash2,
  CheckCircle2,
  Building,
  UserCheck,
  Truck,
  Laptop,
  Users,
  PieChart,
  Coins,
  AlertCircle,
} from 'lucide-react';

interface SummaryData {
  totalDealsRevenue: number;
  totalDealsGrossProfit: number;
  totalCommissions: number;
  totalExpenses: number;
  netOperatingProfit: number;
  totalInvestorInflow: number;
  totalInvestorOutflow: number;
  netInvestorPosition: number;
  totalDealsCount: number;
}

export function CashflowFinanceView() {
  const { role } = useAuth();

  // Filter States
  const [datePreset, setDatePreset] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'>('THIS_MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [jenisKasFilter, setJenisKasFilter] = useState<'ALL' | CashflowType>('ALL');
  const [kategoriFilter, setKategoriFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [entries, setEntries] = useState<CashflowEntry[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalDealsRevenue: 0,
    totalDealsGrossProfit: 0,
    totalCommissions: 0,
    totalExpenses: 0,
    netOperatingProfit: 0,
    totalInvestorInflow: 0,
    totalInvestorOutflow: 0,
    netInvestorPosition: 0,
    totalDealsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formJenisKas, setFormJenisKas] = useState<CashflowType>('PENGELUARAN');
  const [formTanggal, setFormTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [formKategori, setFormKategori] = useState<string>('LOGISTIK & KIRIM');
  const [formNominal, setFormNominal] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formReferensiSku, setFormReferensiSku] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sync default category when formJenisKas switches
  useEffect(() => {
    if (formJenisKas === 'PENGELUARAN') {
      setFormKategori('LOGISTIK & KIRIM');
    } else {
      setFormKategori('KOMISI & REFERRAL');
    }
  }, [formJenisKas]);

  // Compute active date bounds
  const { startFilter, endFilter } = useMemo(() => {
    const now = new Date();
    if (datePreset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      return { startFilter: start, endFilter: end };
    }
    if (datePreset === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      return { startFilter: start, endFilter: end };
    }
    if (datePreset === 'THIS_YEAR') {
      return {
        startFilter: `${now.getFullYear()}-01-01`,
        endFilter: `${now.getFullYear()}-12-31`,
      };
    }
    if (datePreset === 'CUSTOM') {
      return {
        startFilter: startDate || undefined,
        endFilter: endDate || undefined,
      };
    }
    return { startFilter: undefined, endFilter: undefined };
  }, [datePreset, startDate, endDate]);

  // Fetch Cashflow Data from Google Sheets API
  const fetchCashflow = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startFilter) params.append('startDate', startFilter);
      if (endFilter) params.append('endDate', endFilter);
      if (jenisKasFilter !== 'ALL') params.append('jenisKas', jenisKasFilter);
      if (kategoriFilter !== 'ALL') params.append('kategori', kategoriFilter);

      const res = await fetch(`/api/finance/cashflow?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setEntries(data.entries || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (error) {
      console.error('Failed to load cashflow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashflow();
  }, [startFilter, endFilter, jenisKasFilter, kategoriFilter]);

  // Filter entries in memory for search query
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        e.id.toLowerCase().includes(q) ||
        e.kategori.toLowerCase().includes(q) ||
        e.keterangan.toLowerCase().includes(q) ||
        (e.referensiSku && e.referensiSku.toLowerCase().includes(q)) ||
        e.dicatatOleh.toLowerCase().includes(q)
      );
    });
  }, [entries, searchQuery]);

  // Handle Add Transaction Submit
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = Number(formNominal.replace(/[^0-9]/g, ''));
    if (!cleanNum || cleanNum <= 0) {
      alert('Nominal harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/finance/cashflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: formTanggal,
          jenisKas: formJenisKas,
          kategori: formKategori,
          nominal: cleanNum,
          keterangan: formKeterangan.trim(),
          referensiSku: formReferensiSku.trim().toUpperCase() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormNominal('');
        setFormKeterangan('');
        setFormReferensiSku('');
        setActionSuccessMsg(`Transaksi ${formJenisKas === 'PENGELUARAN' ? 'pengeluaran' : 'pemasukan'} berhasil dicatat ke Google Sheets!`);
        setTimeout(() => setActionSuccessMsg(''), 4000);
        fetchCashflow();
      } else {
        alert(`Gagal menyimpan: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/finance/cashflow?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirmId(null);
        setActionSuccessMsg(`Transaksi ${id} berhasil dihapus.`);
        setTimeout(() => setActionSuccessMsg(''), 4000);
        fetchCashflow();
      } else {
        alert(`Gagal menghapus: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Category Icon Helper
  const getCategoryIcon = (cat: string) => {
    if (cat.includes('LOGISTIK')) return <Truck className="w-3.5 h-3.5 text-blue-400" />;
    if (cat.includes('OPERASIONAL') || cat.includes('IT')) return <Laptop className="w-3.5 h-3.5 text-purple-400" />;
    if (cat.includes('GAJI') || cat.includes('PRIVE')) return <UserCheck className="w-3.5 h-3.5 text-amber-400" />;
    if (cat.includes('INVESTOR')) return <Building className="w-3.5 h-3.5 text-indigo-400" />;
    if (cat.includes('KOMISI')) return <Coins className="w-3.5 h-3.5 text-emerald-400" />;
    return <Wallet className="w-3.5 h-3.5 text-slate-400" />;
  };

  const netProfitColor = summary.netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER WITH ACTION BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 shadow-inner">
              <Wallet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                FINANCIALS & CASHFLOW LEDGER
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-mono font-bold tracking-normal">
                  CASHFLOW_EXPENSES Live
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pencatatan kas riil, beban operasional, komisi non-penjualan, modal investor & kalkulasi laba bersih.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCashflow}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh Data Kas"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Catat Transaksi Kas</span>
          </button>
        </div>
      </div>

      {/* SUCCESS MESSAGE ALERT */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 1. EXECUTIVE CASHFLOW & NET PROFIT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Realized Net Operating Profit */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider">🏆 Laba Bersih Riil (Net Profit)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${netProfitColor}`}>
            {formatIDR(summary.netOperatingProfit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/60 pt-2">
            <span>Gross Profit + Komisi - OPEX</span>
            <span className="text-emerald-400 font-mono font-bold">
              {summary.totalDealsRevenue > 0
                ? `${Math.round((summary.netOperatingProfit / summary.totalDealsRevenue) * 100)}% Net Margin`
                : '0% Net'}
            </span>
          </p>
        </div>

        {/* Metric 2: Gross Profit Penjualan Mesin */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider">📦 Laba Kotor Mesin (Deals)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-slate-100 mt-1">
            {formatIDR(summary.totalDealsGrossProfit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/60 pt-2">
            <span>Omset: {formatIDR(summary.totalDealsRevenue)}</span>
            <span className="text-amber-400 font-mono font-bold">{summary.totalDealsCount} Closing</span>
          </p>
        </div>

        {/* Metric 3: Pemasukan Komisi & Referral */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider">🤝 Komisi & Referral Masuk</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-emerald-400 mt-1">
            +{formatIDR(summary.totalCommissions)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/60 pt-2">
            <span>Oper Barang & 10% GK</span>
            <span className="text-slate-400 text-[10px]">Non-inventory</span>
          </p>
        </div>

        {/* Metric 4: Total Beban Operasional (OPEX) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider">💸 Total Beban OPEX</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-rose-400 mt-1">
            -{formatIDR(summary.totalExpenses)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/60 pt-2">
            <span>Kirim, IT, Gaji & Lainnya</span>
            <span className="text-slate-400 text-[10px]">Pengeluaran Kas</span>
          </p>
        </div>
      </div>

      {/* 2. INVESTOR CAPITAL FLOW SUMMARY (COLLAPSIBLE CARD) */}
      {(summary.totalInvestorInflow > 0 || summary.totalInvestorOutflow > 0) && (
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <span className="font-bold text-indigo-200">Arus Kas Modal Investor:</span>
              <span className="text-slate-400 block text-[11px]">
                Suntikan Modal Masuk: <strong className="text-emerald-400 font-mono">+{formatIDR(summary.totalInvestorInflow)}</strong> • Bagi Hasil / Dividen Keluar: <strong className="text-rose-400 font-mono">-{formatIDR(summary.totalInvestorOutflow)}</strong>
              </span>
            </div>
          </div>
          <div className="font-mono font-bold text-indigo-300 text-sm">
            Posisi Kas Investor: {formatIDR(summary.netInvestorPosition)}
          </div>
        </div>
      )}

      {/* 3. FILTERS & SEARCH BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Periode */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">📅 Periode:</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-xs"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
              <option value="THIS_YEAR">Tahun Ini</option>
              <option value="CUSTOM">Kustom Tanggal</option>
            </select>
          </div>

          {/* Jenis Kas */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">🔄 Jenis Kas:</label>
            <select
              value={jenisKasFilter}
              onChange={(e) => setJenisKasFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-xs"
            >
              <option value="ALL">Semua Jenis Transaksi</option>
              <option value="PENGELUARAN">💸 Pengeluaran Saja (Beban OPEX)</option>
              <option value="PEMASUKAN_LAIN">💵 Pemasukan Lain Saja (Komisi/Modal)</option>
            </select>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">📁 Kategori:</label>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-xs"
            >
              <option value="ALL">Semua Kategori</option>
              <optgroup label="💸 Pengeluaran">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </optgroup>
              <optgroup label="💵 Pemasukan">
                {INCOME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Search Keterangan / SKU */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">🔍 Cari Transaksi:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID, keterangan, SKU..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>
        </div>

        {datePreset === 'CUSTOM' && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3 text-xs">
            <div>
              <span className="text-slate-400 mr-2">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-400 mr-2">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. CASHFLOW ENTRIES TABLE (BUKU KAS) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              BUKU KAS & JURNAL TRANSAKSI ({filteredEntries.length} Baris)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Sheet: <strong className="text-slate-200">CASHFLOW_EXPENSES</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">ID Transaksi</th>
                <th className="py-3 px-3.5">Tanggal</th>
                <th className="py-3 px-3.5">Jenis</th>
                <th className="py-3 px-3.5">Kategori</th>
                <th className="py-3 px-3.5">Keterangan & Rincian</th>
                <th className="py-3 px-3.5 text-center">Ref SKU</th>
                <th className="py-3 px-3.5 text-right">Nominal (Rp)</th>
                <th className="py-3 px-3.5 text-center">Dicatat Oleh</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Memuat data kas dari Google Sheets...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    Belum ada catatan transaksi kas pada filter yang dipilih.
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 underline font-bold"
                      >
                        + Catat transaksi kas pertama sekarang
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item) => {
                  const isExpense = item.jenisKas === 'PENGELUARAN';
                  const isInvestor = item.kategori.includes('INVESTOR');

                  return (
                    <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400 font-bold">
                        {item.id}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        {item.tanggal}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isExpense
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                          }`}
                        >
                          {isExpense ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isExpense ? 'Pengeluaran' : 'Pemasukan'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(item.kategori)}
                          <span className={`font-semibold text-[11px] ${isInvestor ? 'text-indigo-300' : 'text-slate-200'}`}>
                            {item.kategori}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 max-w-sm text-slate-300">
                        <span className="line-clamp-2">{item.keterangan || '-'}</span>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-amber-400 font-bold text-[11px] whitespace-nowrap">
                        {item.referensiSku || '-'}
                      </td>
                      <td className={`py-3 px-3.5 text-right font-mono font-bold text-xs whitespace-nowrap ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isExpense ? '-' : '+'}{formatIDR(item.nominal)}
                      </td>
                      <td className="py-3 px-3.5 text-center text-slate-400 text-[11px] whitespace-nowrap">
                        {item.dicatatOleh || 'Admin'}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(item.id)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL FORM: + CATAT TRANSAKSI KAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Catat Transaksi Kas</h3>
                  <p className="text-xs text-slate-400">Tersimpan langsung ke Google Sheets (CASHFLOW_EXPENSES)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="space-y-4 text-xs">
              {/* Jenis Kas Switcher */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">Jenis Transaksi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormJenisKas('PENGELUARAN')}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                      formJenisKas === 'PENGELUARAN'
                        ? 'bg-rose-950 border-rose-600 text-rose-300 ring-1 ring-rose-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>💸 Pengeluaran (Beban OPEX)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormJenisKas('PEMASUKAN_LAIN')}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                      formJenisKas === 'PEMASUKAN_LAIN'
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>💵 Pemasukan (Komisi/Modal)</span>
                  </button>
                </div>
              </div>

              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tanggal Transaksi:</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Kategori Transaksi:</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-semibold"
                  >
                    {formJenisKas === 'PENGELUARAN' ? (
                      EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))
                    ) : (
                      INCOME_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nominal (Rupiah):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono font-bold">Rp</span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 150000"
                    value={formNominal ? Number(formNominal.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                    onChange={(e) => setFormNominal(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50000, 100000, 150000, 250000, 500000, 1000000, 5000000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormNominal(String(val))}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-emerald-300 hover:border-emerald-700 transition-colors"
                    >
                      {val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000} rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Keterangan / Rincian:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Subsidi free ongkir sink ke Resto Padang Bintaro"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              {/* Referensi SKU (Opsional) */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Referensi SKU Unit <span className="text-[10px] text-slate-500 font-normal">(Opsional, jika terkait unit tertentu)</span>:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BBK2801"
                  value={formReferensiSku}
                  onChange={(e) => setFormReferensiSku(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Sheets...</span>
                    </>
                  ) : (
                    <span>Simpan Transaksi Kas</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
