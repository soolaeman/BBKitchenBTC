'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { GSCMetricSummary, GA4MetricSummary, MetaPixelSummary, CommercialFunnel } from '@/lib/types/analytics';
import { BarChart3, Globe, Search, Users, Share2, TrendingUp } from 'lucide-react';

export function AnalyticsHub() {
  const { role } = useAuth();
  const [data, setData] = useState<{ gsc?: GSCMetricSummary; ga4?: GA4MetricSummary; meta?: MetaPixelSummary; funnel?: CommercialFunnel } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const headers: HeadersInit = {};
        if (role) headers['x-bbk-role'] = role;
        const res = await fetch('/api/analytics', { headers });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Analytics load error', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [role]);

  if (isLoading || !data) return <div className="space-y-4"><div className="h-8 bg-slate-900 rounded w-1/4 animate-pulse" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map((i) => <div key={i} className="h-32 bg-slate-900 rounded-xl animate-pulse" />)}</div></div>;

  const { gsc, ga4, meta, funnel } = data;
  return (
    <div className="space-y-8">
      <div><h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2"><BarChart3 className="w-6 h-6 text-amber-500" /><span>Analytics, Google Search Console & Funnel</span></h1><p className="text-xs sm:text-sm text-slate-400">Monitoring terpusat performa SEO organik, trafik GA4, pixel konversi, dan funnel transaksi komersial.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between"><div className="flex items-center gap-3"><Search className="w-5 h-5 text-blue-400" /><div><div className="text-xs font-bold text-white">Google Search Console</div><div className="text-[11px] text-slate-400 font-mono">bukanbarukitchen.com</div></div></div><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">{gsc?.isConnected ? 'GSC CONNECTED' : 'GSC NOT CONNECTED'}</span></div>
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between"><div className="flex items-center gap-3"><Users className="w-5 h-5 text-amber-400" /><div><div className="text-xs font-bold text-white">Google Analytics 4</div><div className="text-[11px] text-slate-400 font-mono">{ga4?.measurementId}</div></div></div><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">{ga4?.isConnected ? 'GA4 ACTIVE' : 'GA4 DEMO'}</span></div>
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between"><div className="flex items-center gap-3"><Share2 className="w-5 h-5 text-indigo-400" /><div><div className="text-xs font-bold text-white">Meta Pixel (Facebook/IG)</div><div className="text-[11px] text-slate-400 font-mono">{meta?.pixelId}</div></div></div><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">{meta?.status === 'ACTIVE' ? 'PIXEL LIVE' : 'PENDING'}</span></div>
      </div>
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-6"><div><h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400" />Google Search Console: Performa 28 Hari Terakhir</h2><p className="text-xs text-slate-400">Total interaksi pencarian organik untuk kata kunci peralatan restoran.</p></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800"><div className="text-xs text-slate-400">Total Clicks</div><div className="text-2xl font-black text-blue-400 font-mono mt-1">{gsc?.totalClicks?.toLocaleString()}</div></div><div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800"><div className="text-xs text-slate-400">Total Impressions</div><div className="text-2xl font-black text-purple-400 font-mono mt-1">{gsc?.totalImpressions?.toLocaleString()}</div></div><div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800"><div className="text-xs text-slate-400">Average CTR</div><div className="text-2xl font-black text-emerald-400 font-mono mt-1">{gsc?.averageCTR}%</div></div><div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800"><div className="text-xs text-slate-400">Average Position</div><div className="text-2xl font-black text-amber-400 font-mono mt-1">{gsc?.averagePosition}</div></div></div><div className="border border-slate-800 rounded-xl overflow-hidden"><div className="p-3 bg-slate-950 text-xs font-bold text-slate-200 uppercase tracking-wider">Top 8 Search Queries (Google Indonesia)</div><div className="divide-y divide-slate-800/60 text-xs">{gsc?.topQueries.map((q, idx) => <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-800/40"><span className="font-semibold text-slate-200">{q.query}</span><div className="flex items-center gap-4 font-mono text-[11px]"><span className="text-blue-400 font-bold">{q.clicks} clicks</span><span className="text-slate-400">{q.impressions} impr</span><span className="text-emerald-400 font-bold">{q.ctr}% CTR</span><span className="text-amber-400 font-bold">Pos {q.position}</span></div></div>)}</div></div></div>
      {funnel && <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4"><div><h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" />Content → Commerce Conversion Funnel</h2><p className="text-xs text-slate-400">{funnel.summaryMessage}</p></div><div className="space-y-3">{funnel.stages.map((stg, i) => <div key={stg.stage} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">{i + 1}</span><div><div className="font-bold text-white text-xs">{stg.name}</div><div className="text-[11px] text-slate-400">{stg.notes}</div></div></div><div className="flex items-center gap-4 shrink-0 font-mono"><div className="text-right"><div className="text-base font-black text-emerald-400">{stg.count.toLocaleString()}</div><div className="text-[10px] text-slate-500">{i === 0 ? '100% Top Funnel' : stg.conversionFromPrevious + '% dari tahap sebelumnya'}</div></div><span className={stg.statusType === 'TRACKED' ? 'px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-950 text-emerald-300 border-emerald-800' : 'px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-950 text-blue-300 border-blue-800'}>{stg.statusType}</span></div></div>)}</div></div>}
    </div>
  );
}
