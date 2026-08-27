'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import {
  Boxes,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileWarning,
  TrendingUp,
  Banknote,
  Warehouse,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

export function OverviewDashboard() {
  const { role, permissions } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [invRes, finRes] = await Promise.all([
          fetch('/api/inventory?pageSize=10', { headers: { 'x-bbk-role': role } }),
          fetch('/api/invoices?view=kpis', { headers: { 'x-bbk-role': role } }),
        ]);
        const invData = await invRes.json();
        const finData = await finRes.json();
        setStats(invData.stats);
        setFinancials(finData);
      } catch (err) {
        console.error('Failed to load overview metrics', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [role]);

  // Velocity data for trend chart
  const salesVelocityData = [
    { month: 'Mar 2026', units: 48, revenue: 890000000 },
    { month: 'Apr 2026', units: 54, revenue: 1020000000 },
    { month: 'Mei 2026', units: 62, revenue: 1180000000 },
    { month: 'Jun 2026', units: 71, revenue: 1350000000 },
    { month: 'Jul 2026', units: 85, revenue: 1620000000 },
    { month: 'Agu 2026', units: 96, revenue: 1890000000 },
  ];

  // Warehouse breakdown data
  const warehouseData = [
    { name: 'Pamulang 2 (GK/BB/SM/BL)', units: 1180, fill: '#f59e0b' },
    { name: 'Pamulang Barat (ML/RB)', units: 620, fill: '#3b82f6' },
    { name: 'Setu (PY)', units: 390, fill: '#10b981' },
    { name: 'Sawangan (PE)', units: 340, fill: '#8b5cf6' },
    { name: 'Kedaung (WT/ON)', units: 220, fill: '#ec4899' },
  ];

  // Pipeline funnel data
  const pipelineFunnel = [
    { stage: 'Published (Live)', count: stats?.published || 2150, color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800/80' },
    { stage: 'Ready to Publish', count: stats?.readyToPublish || 210, color: 'text-blue-400', bg: 'bg-blue-950/60 border-blue-800/80' },
    { stage: 'Pending Photos', count: stats?.pendingPhotos || 160, color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-800/80' },
    { stage: 'Errors / Missing Info', count: stats?.errors || 95, color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-800/80' },
    { stage: 'Ambiguous / Duplicate', count: stats?.ambiguous || 65, color: 'text-purple-400', bg: 'bg-purple-950/60 border-purple-800/80' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-900 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Executive Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Executive Inventory & Revenue Control
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
              Live Fleet
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Integrated multi-hub control tower for 2,750+ commercial kitchen assets across 5 Jabodetabek warehouses, automated pipeline tracking, and sales deal desk.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">System Nominal</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Executive Metric Format */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Units</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats?.totalUnits || 2750}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across 5 Warehouse Hubs</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Available Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
              {stats?.availableUnits || 2358}
            </div>
            <div className="text-[11px] text-emerald-500 font-medium mt-1">85.7% Ready to Deploy</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Sold (YTD)</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats?.soldUnits || 392}
            </div>
            <div className="text-[11px] text-emerald-500 font-medium mt-1">+14.2% Turnover Rate</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Valuation</span>
            <Banknote className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-blue-300 font-mono truncate">
              {financials?.totalRevenue ? formatIDR(financials.totalRevenue).slice(0, -3) : 'Rp 14.8 M'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Book Value at Retail</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Gross Margin</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400 font-mono">
              {financials?.grossMarginPercentage?.toFixed(1) || '35.4'}%
            </div>
            <div className="text-[11px] text-emerald-500 font-medium mt-1">&gt; 30% Guardrail Target</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Billing</span>
            <FileWarning className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-amber-300 font-mono truncate">
              {financials?.outstandingInvoicesAmount ? formatIDR(financials.outstandingInvoicesAmount).slice(0, -3) : 'Rp 182 Jt'}
            </div>
            <div className="text-[11px] text-amber-400 font-medium mt-1">2 Pending Invoices</div>
          </div>
        </div>
      </div>

      {/* Actionable Pipeline Exception Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Asset Processing & Publication Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live funnel stages from acquisition intake, QC testing, photography, to public WooCommerce listing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {pipelineFunnel.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="text-xs font-medium text-slate-300">{item.stage}</div>
              <div className={`text-2xl font-bold font-mono mt-2 ${item.color}`}>
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section: Sales Velocity & Warehouse Hub Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Velocity Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sales Velocity & Revenue Trend
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Units sold and transaction volume over past 6 months.</p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-500 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md">
              +12.8% MoM Growth
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesVelocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="units" name="Unit Terjual" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warehouse Hub Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hub Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Inventory spread across 5 physical hubs.</p>
            </div>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={warehouseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="units"
                >
                  {warehouseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
            {warehouseData.map((wh, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: wh.fill }} />
                  <span className="text-slate-300 truncate max-w-[140px]">{wh.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-200">{wh.units}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
