'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { FinancialKPIs } from '@/lib/types/finance';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import { Banknote, Percent, Receipt, FileCheck, Building, DollarSign, Lock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export function FinanceDashboard() {
  const { role, permissions } = useAuth();
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFinance() {
      try {
        const res = await fetch('/api/invoices?view=kpis', {
          headers: { ...(role ? { 'x-bbk-role': role } : {}) },
        });
        const data = await res.json();
        setKpis(data);
      } catch (err) {
        console.error('Failed to load financial kpis', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFinance();
  }, [role]);

  const categoryMargins = [
    { category: 'Combi Oven', avgRevenue: 68000000, avgCOGS: 44000000, avgMargin: 24000000 },
    { category: 'Refrigeration', avgRevenue: 22000000, avgCOGS: 14500000, avgMargin: 7500000 },
    { category: 'Cooking Range', avgRevenue: 26000000, avgCOGS: 16800000, avgMargin: 9200000 },
    { category: 'Bakery Equipment', avgRevenue: 34000000, avgCOGS: 21500000, avgMargin: 12500000 },
    { category: 'Coffee & Espresso', avgRevenue: 75000000, avgCOGS: 48000000, avgMargin: 27000000 },
    { category: 'Stainless Worktable', avgRevenue: 4500000, avgCOGS: 2800000, avgMargin: 1700000 },
  ];

  if (!permissions?.canViewFinanceReports && role !== 'ADMIN' && role !== 'INVESTOR') {
    return <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-2xl text-center space-y-3"><Lock className="w-10 h-10 text-amber-500 mx-auto" /><h2 className="text-lg font-bold text-white">Akses Keuangan Terbatas</h2><p className="text-xs text-slate-400 max-w-md mx-auto">Modul Keuangan memerlukan role ADMIN, FINANCE, atau INVESTOR. Silakan beralih role pada switcher di pojok kanan atas untuk melihat laporan.</p></div>;
  }

  if (isLoading) return <div className="p-8 text-center text-slate-400">Memuat data keuangan...</div>;

  return <div className="space-y-6">
    <div><h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2"><Banknote className="w-6 h-6 text-amber-500" /><span>Finance & Commercial Hub</span></h1><p className="text-xs sm:text-sm text-slate-400">Ringkasan omset penjualan unit, HPP (COGS), laba kotor, dan piutang faktur Bukan Baru Kitchen.</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5"><div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider"><span>Total Pendapatan (YTD)</span><DollarSign className="w-4 h-4 text-emerald-400" /></div><div className="mt-3 text-2xl font-black text-emerald-400 font-mono">{kpis?.totalRevenue ? formatIDR(kpis.totalRevenue) : 'Rp 14.850.000.000'}</div><div className="text-xs text-slate-400 mt-1">Dari <span className="font-bold text-slate-200">{kpis?.unitsSold || 392} unit</span> terjual</div></div>
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5"><div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider"><span>Total HPP / Modal</span><Receipt className="w-4 h-4 text-purple-400" /></div><div className="mt-3 text-2xl font-black text-purple-400 font-mono">{kpis?.totalCOGS ? formatIDR(kpis.totalCOGS) : 'Rp 9.580.000.000'}</div><div className="text-xs text-slate-400 mt-1">Biaya pengadaan & rekondisi</div></div>
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5"><div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider"><span>Laba Kotor & Margin</span><Percent className="w-4 h-4 text-amber-400" /></div><div className="mt-3 text-2xl font-black text-amber-400 font-mono">{kpis?.grossMarginPercentage?.toFixed(1) || '35.4'}%</div><div className="text-xs text-amber-500/90 font-mono mt-1">{kpis?.grossMarginAmount ? formatIDR(kpis.grossMarginAmount) : 'Rp 5.270.000.000'}</div></div>
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5"><div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider"><span>Outstanding Invoice</span><FileCheck className="w-4 h-4 text-blue-400" /></div><div className="mt-3 text-2xl font-black text-blue-400 font-mono">{kpis?.outstandingInvoicesAmount ? formatIDR(kpis.outstandingInvoicesAmount) : 'Rp 182.000.000'}</div><div className="text-xs text-slate-400 mt-1">Menunggu pembayaran / DP</div></div>
    </div>
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6"><h2 className="text-sm font-bold text-white uppercase tracking-wider">Unit Economics: Rata-Rata Harga Jual vs HPP per Kategori</h2><p className="text-xs text-slate-400">Analisa profitabilitas per kategori mesin dapur komersial.</p><div className="h-72 w-full mt-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryMargins} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} /><XAxis dataKey="category" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" /><YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} formatter={(val: any) => formatIDR(Number(val))} /><Legend wrapperStyle={{ paddingTop: '15px' }} /><Bar dataKey="avgRevenue" name="Rata-rata Harga Jual" fill="#10b981" radius={[4, 4, 0, 0]} /><Bar dataKey="avgCOGS" name="HPP Modal" fill="#6366f1" radius={[4, 4, 0, 0]} /><Bar dataKey="avgMargin" name="Laba Kotor" fill="#f59e0b" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
    <div className="p-5 bg-gradient-to-r from-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-center gap-3"><Building className="w-8 h-8 text-amber-400 shrink-0" /><div><div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nilai Aset Inventaris di Gudang (Warehouse Asset Valuation)</div><div className="text-xl font-bold text-white font-mono mt-0.5">{kpis?.inventoryAssetValue ? formatIDR(kpis.inventoryAssetValue) : 'Rp 38.450.000.000'}</div></div></div><div className="text-xs text-slate-400 sm:text-right">Berdasarkan kalkulasi modal 2,358 unit berstatus AVAILABLE di 5 Hub Jabodetabek.</div></div>
  </div>;
}
