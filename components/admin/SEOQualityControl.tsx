'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { SEOAuditReport, SEOArticle, ArticlePipelineStage } from '@/lib/types/seo';
import { MasterInventoryItem } from '@/lib/types/inventory';
import { auditProductSEO, getSEOArticles, updateArticleStage } from '@/lib/repositories/seo-repository';
import {
  SearchCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Workflow,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Globe,
  ExternalLink,
  Plus,
} from 'lucide-react';

export function SEOQualityControl() {
  const { role } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'AUDITOR' | 'ARTICLES'>('AUDITOR');
  const [auditTargetSku, setAuditTargetSku] = useState('BBK-GK-COM-0007');
  const [auditResult, setAuditResult] = useState<SEOAuditReport | null>(null);
  const [articles, setArticles] = useState<SEOArticle[]>(() => getSEOArticles());
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const stages: ArticlePipelineStage[] = [
    'IDEA',
    'KEYWORD',
    'BRIEF',
    'DRAFT',
    'REVIEW',
    'PUBLISHED',
    'INDEXED',
    'RANKING',
  ];

  // Run audit on selected sample SKU
  const runAudit = React.useCallback(async (sku: string) => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`/api/inventory?search=${encodeURIComponent(sku)}&pageSize=1`, {
        headers: { 'x-bbk-role': role },
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const item: MasterInventoryItem = data.items[0];
        const report = auditProductSEO(item);
        setAuditResult(report);
      }
    } catch (err) {
      console.error('Audit failed', err);
    } finally {
      setIsLoadingAudit(false);
    }
  }, [role]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await runAudit(auditTargetSku);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [runAudit, auditTargetSku]);

  const handleStageChange = (articleId: string, newStage: ArticlePipelineStage) => {
    updateArticleStage(articleId, newStage);
    setArticles([...getSEOArticles()]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <SearchCode className="w-6 h-6 text-amber-500" />
            <span>SEO Quality Control & Article Pipeline</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sistem penilaian kepatuhan konten teknis, optimasi Yoast metadata, dan manajemen editorial WordPress.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('AUDITOR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'AUDITOR'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SEO Quality Auditor
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('ARTICLES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'ARTICLES'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Article Pipeline ({articles.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'AUDITOR' && (
        <div className="space-y-6">
          {/* Target SKU Selector */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">
                Pilih atau Ketik SKU Produk untuk Di-Audit SEO:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={auditTargetSku}
                  onChange={(e) => setAuditTargetSku(e.target.value)}
                  placeholder="Contoh: BBK-GK-COM-0007"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => runAudit(auditTargetSku)}
                  disabled={isLoadingAudit}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors"
                >
                  {isLoadingAudit ? 'Memeriksa...' : 'Audit Konten'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Quick Test:</span>
              {['BBK-GK-COM-0007', 'BBK-PE-COF-0014', 'BBK-SM-COO-0028'].map((sku) => (
                <button
                  key={sku}
                  type="button"
                  onClick={() => {
                    setAuditTargetSku(sku);
                    runAudit(sku);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
                >
                  {sku}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Results Dashboard */}
          {auditResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score Card */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    BBK Quality Score
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-black font-mono text-emerald-400">
                      {auditResult.overallScore}
                    </span>
                    <span className="text-xl font-bold text-slate-500 font-mono">/ 100</span>
                  </div>

                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        auditResult.healthStatus === 'HEALTHY'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{auditResult.healthStatus === 'HEALTHY' ? 'SEO HEALTHY' : 'NEEDS IMPROVEMENT'}</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Skor kepatuhan internal Bukan Baru Kitchen berdasarkan kelengkapan spesifikasi, keyword Yoast, gambar alt, dan struktur markup Schema.
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pemeriksaan Lulus:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {auditResult.passedCount} / {auditResult.totalCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Keyword:</span>
                    <span className="font-bold text-slate-200 font-mono">{auditResult.focusKeyword}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Panjang Kata:</span>
                    <span className="font-mono text-slate-200">{auditResult.wordCount} kata</span>
                  </div>
                </div>
              </div>

              {/* Checklist Breakdown */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Rincian 8 Parameter Audit SEO Konten
                </h3>

                <div className="space-y-3">
                  {auditResult.checks.map((check) => (
                    <div
                      key={check.key}
                      className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start gap-3"
                    >
                      {check.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      )}

                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{check.label}</span>
                          <span className="font-mono text-[11px] text-slate-400">
                            Bobot: {check.score} poin
                          </span>
                        </div>
                        <div className="text-slate-400 mt-0.5">{check.message}</div>
                        {check.recommendation && (
                          <div className="mt-1.5 text-amber-400 font-medium bg-amber-950/40 p-2 rounded border border-amber-800/60">
                            💡 <strong>Rekomendasi:</strong> {check.recommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Article Pipeline View */}
      {activeSubTab === 'ARTICLES' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Alur Produksi Artikel SEO (WordPress CMS Integration)
                </h2>
                <p className="text-xs text-slate-400">
                  Dari riset keyword hingga ranking di Google Search Console.
                </p>
              </div>
            </div>

            {/* Pipeline Stage Funnel Indicator */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
              {stages.map((stg, i) => {
                const count = articles.filter((a) => a.stage === stg).length;
                return (
                  <div
                    key={stg}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center"
                  >
                    <div className="text-[10px] text-slate-500 font-mono">0{i + 1}</div>
                    <div className="text-xs font-bold text-slate-200 uppercase mt-0.5">{stg}</div>
                    <div className="text-sm font-black text-amber-400 font-mono mt-1">{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Articles List */}
            <div className="divide-y divide-slate-800/60">
              {articles.map((art) => (
                <div key={art.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                        {art.searchIntent}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        KW: &quot;{art.targetKeyword}&quot;
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white hover:text-amber-400 transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{art.excerpt}</p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                      <span>Penulis: {art.author}</span>
                      <span>•</span>
                      <span>{art.wordCount} Kata</span>
                      <span>•</span>
                      <span>{art.internalLinksCount} Internal Links</span>
                      {art.gscClicks30d && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-mono font-bold">
                            GSC: {art.gscClicks30d} Clicks / Pos {art.gscPosition}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stage Dropdown */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-slate-400">Stage:</span>
                    <select
                      value={art.stage}
                      onChange={(e) => handleStageChange(art.id, e.target.value as ArticlePipelineStage)}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {stages.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
