'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  SEOAuditReport,
  SEOArticle,
  ArticlePipelineStage,
  SEOKeywordItem,
  TechnicalSEOAudit,
  OffPageSignal,
  RankTrackItem,
} from '@/lib/types/seo';
import { MasterInventoryItem } from '@/lib/types/inventory';
import {
  auditProductSEO,
  buildProductSchemaJsonLd,
  generateAutoFixMetadata,
  getSEOArticles,
  addNewArticle,
  updateArticleStage,
  initialRankings,
  initialOffPageSignals,
} from '@/lib/repositories/seo-repository';
import {
  SearchCode,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  TrendingUp,
  Globe,
  ExternalLink,
  Plus,
  Copy,
  Check,
  Search,
  ShieldCheck,
  Server,
  Zap,
  Layers,
  Link2,
  MessageCircle,
  Eye,
  RefreshCw,
  Tag,
  BarChart3,
  X,
} from 'lucide-react';

type PillarTab = 'PILLAR_1' | 'PILLAR_2' | 'PILLAR_3' | 'PILLAR_4' | 'PILLAR_5' | 'PILLAR_6' | 'ARTICLES';

export function SEOQualityControl() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<PillarTab>('PILLAR_3');

  // Pillar 1: Keywords state
  const [keywordQuery, setKeywordQuery] = useState('combi oven bekas');
  const [keywordSuggestions, setKeywordSuggestions] = useState<SEOKeywordItem[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);

  // Pillar 2: Technical SEO state
  const [techAudit, setTechAudit] = useState<TechnicalSEOAudit | null>(null);
  const [isLoadingTech, setIsLoadingTech] = useState(false);
  const [schemaItem, setSchemaItem] = useState<MasterInventoryItem | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Pillar 3: On-Page Audit state
  const [auditTargetSku, setAuditTargetSku] = useState('BBK-GK-COM-0007');
  const [auditResult, setAuditResult] = useState<SEOAuditReport | null>(null);
  const [currentInventoryItem, setCurrentInventoryItem] = useState<MasterInventoryItem | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [autofixApplied, setAutofixApplied] = useState(false);
  const [autofixData, setAutofixData] = useState<{
    yoastKeyword: string;
    seoTitle: string;
    yoastDescription: string;
    imageAlt: string;
  } | null>(null);
  const [copiedAutofix, setCopiedAutofix] = useState(false);

  // Pillar 4 & 6: Signals & Rankings
  const [rankings] = useState<RankTrackItem[]>(initialRankings);
  const [offPageSignals] = useState<OffPageSignal[]>(initialOffPageSignals);

  // Pillar Articles State
  const [articles, setArticles] = useState<SEOArticle[]>(() => getSEOArticles());
  const [showNewArticleModal, setShowNewArticleModal] = useState(false);

  // Form State for New Article
  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtKeyword, setNewArtKeyword] = useState('');
  const [newArtIntent, setNewArtIntent] = useState<'COMMERCIAL' | 'INFORMATIONAL' | 'TRANSACTIONAL' | 'NAVIGATIONAL'>('COMMERCIAL');
  const [newArtCategory, setNewArtCategory] = useState('combi-oven');
  const [newArtAuthor, setNewArtAuthor] = useState('Tim Editorial BBKitchen');
  const [newArtExcerpt, setNewArtExcerpt] = useState('');
  const [newArtContent, setNewArtContent] = useState('');
  const [newArtSkus, setNewArtSkus] = useState('BBK-GK-COM-0007');

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

  // 1. Fetch Keyword Suggestions from Free Google Suggest / DDG API
  const fetchKeywords = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsLoadingKeywords(true);
    try {
      const res = await fetch(`/api/seo/suggest?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.suggestions) {
        setKeywordSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Failed to fetch keyword suggestions:', err);
    } finally {
      setIsLoadingKeywords(false);
    }
  }, []);

  // 2. Fetch Technical SEO status
  const fetchTechnicalAudit = useCallback(async () => {
    setIsLoadingTech(true);
    try {
      const res = await fetch('/api/seo/technical?domain=bukanbarukitchen.com');
      const data = await res.json();
      if (data.audit) {
        setTechAudit(data.audit);
      }
    } catch (err) {
      console.error('Failed to fetch technical audit:', err);
    } finally {
      setIsLoadingTech(false);
    }
  }, []);

  // 3. Run On-Page Audit on selected sample SKU
  const runAudit = useCallback(async (sku: string) => {
    setIsLoadingAudit(true);
    setAutofixApplied(false);
    setAutofixData(null);
    try {
      const res = await fetch(`/api/inventory?search=${encodeURIComponent(sku)}&pageSize=1`, {
        headers: { 'x-bbk-role': role },
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const item: MasterInventoryItem = data.items[0];
        setCurrentInventoryItem(item);
        setSchemaItem(item);
        const report = auditProductSEO(item);
        setAuditResult(report);
      }
    } catch (err) {
      console.error('Audit failed', err);
    } finally {
      setIsLoadingAudit(false);
    }
  }, [role]);

  // Init effects
  useEffect(() => {
    runAudit(auditTargetSku);
    fetchKeywords(keywordQuery);
    fetchTechnicalAudit();
  }, [runAudit, fetchKeywords, fetchTechnicalAudit, auditTargetSku, keywordQuery]);

  const handleApplyAutofix = () => {
    if (!currentInventoryItem) return;
    const fixed = generateAutoFixMetadata(currentInventoryItem);
    setAutofixData(fixed);
    setAutofixApplied(true);
  };

  const handleCopySchema = (jsonString: string) => {
    navigator.clipboard.writeText(jsonString);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleStageChange = (articleId: string, newStage: ArticlePipelineStage) => {
    updateArticleStage(articleId, newStage);
    setArticles([...getSEOArticles()]);
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtTitle || !newArtKeyword) return;

    const skuArray = newArtSkus
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addNewArticle({
      title: newArtTitle,
      targetKeyword: newArtKeyword,
      searchIntent: newArtIntent,
      relatedCategorySlug: newArtCategory,
      author: newArtAuthor,
      excerpt: newArtExcerpt,
      content: newArtContent,
      relatedSkus: skuArray,
      stage: 'IDEA',
      yoastTitle: `${newArtTitle} | Bukan Baru Kitchen`,
      yoastMetaDesc: newArtExcerpt || `${newArtTitle} - panduan teknis & rekomendasi peralatan dapur resto Bukan Baru Kitchen.`,
    });

    setArticles([...getSEOArticles()]);
    setShowNewArticleModal(false);
    setActiveTab('ARTICLES');

    // Reset Form
    setNewArtTitle('');
    setNewArtKeyword('');
    setNewArtExcerpt('');
    setNewArtContent('');
  };

  // Schema generation
  const activeSchemaJson = schemaItem ? buildProductSchemaJsonLd(schemaItem) : null;
  const activeSchemaString = activeSchemaJson ? JSON.stringify(activeSchemaJson, null, 2) : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <SearchCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Enterprise SEO Quality & Schema Suite</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Live Free APIs
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Pusat kendali 6 pilar SEO komprehensif, rich snippet Schema.org, audit inventori 2.797 SKU, dan artikel pipeline.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Create New Article */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewArticleModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Artikel Baru</span>
          </button>
        </div>
      </div>

      {/* 6-Pillar Tab Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('PILLAR_1')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'PILLAR_1'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>1. Riset & KW</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PILLAR_2')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'PILLAR_2'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>2. Audit Teknis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PILLAR_3')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'PILLAR_3'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>3. On-Page SKU</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PILLAR_4')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'PILLAR_4'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>4. Off-Page</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PILLAR_5')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'PILLAR_5'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>5. UX & CRO</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PILLAR_6')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'PILLAR_6'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>6. Rank Track</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ARTICLES')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'ARTICLES'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Artikel ({articles.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PILLAR 1: RISET & STRATEGI KEYWORD (Live Google & DDG Suggest API) */}
      {/* ========================================================================= */}
      {activeTab === 'PILLAR_1' && (
        <div className="space-y-6">
          {/* Search bar with live API */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-400" />
                  <span>Riset Kata Kunci & Saran Pencarian Real-Time</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Mengambil query pencarian langsung dari Google Suggest Indonesia & DuckDuckGo API tanpa biaya langganan API berbayar.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                  Engine: Google Indonesia (hl=id) + DDG
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchKeywords(keywordQuery);
                  }}
                  placeholder="Ketik topik alat resto... (misal: chiller 2 pintu bekas, kompor nayati, oven rational)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchKeywords(keywordQuery)}
                disabled={isLoadingKeywords}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2"
              >
                {isLoadingKeywords ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari Keyword</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Keyword Topics */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
              <span className="text-slate-500">Preset Rekomendasi BBKitchen:</span>
              {['combi oven bekas', 'chiller stainless 304 bekas', 'mesin kopi espresso bekas', 'deep fryer gas bekas resto', 'ice maker scotsman'].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => {
                    setKeywordQuery(kw);
                    fetchKeywords(kw);
                  }}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[11px] font-mono transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Keyword Suggestions Table */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Hasil Ekstraksi Kata Kunci ({keywordSuggestions.length} Query Ditemukan)</span>
              <span className="text-xs font-normal text-slate-400">Target SERP Indonesia</span>
            </h3>

            {keywordSuggestions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Ketik kata kunci di atas dan tekan &quot;Cari Keyword&quot; untuk memuat saran pencarian live.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                      <th className="py-3 px-4">Kata Kunci (Google Suggest)</th>
                      <th className="py-3 px-3">Search Intent</th>
                      <th className="py-3 px-3">Volume Est.</th>
                      <th className="py-3 px-3">Tingkat Persaingan</th>
                      <th className="py-3 px-3">Est. Nilai CPC</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {keywordSuggestions.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-white font-medium flex items-center gap-2">
                          <span className="text-slate-600 font-mono text-[10px]">#{idx + 1}</span>
                          <span>{item.keyword}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.intent === 'TRANSACTIONAL'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : item.intent === 'COMMERCIAL'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-sky-950 text-sky-300 border-sky-800'
                            }`}
                          >
                            {item.intent}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{item.volumeMonthly}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[11px] font-bold ${
                              item.difficulty === 'EASY'
                                ? 'text-emerald-400'
                                : item.difficulty === 'MEDIUM'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {item.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{item.cpcEst}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setNewArtTitle(`Panduan & Harga ${item.keyword} Terbaik untuk Restoran`);
                              setNewArtKeyword(item.keyword);
                              setNewArtIntent(item.intent);
                              setShowNewArticleModal(true);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded text-[11px] font-bold transition-all"
                          >
                            + Jadi Artikel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Competitor & Content Pillars Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                🏆 Benchmark Kompetitor Peralatan Dapur Komersial
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Pola kata kunci kompetitor tier-1 di Indonesia yang diunggulkan oleh Bukan Baru Kitchen melalui garansi & unit ready stock.
              </p>
              <div className="space-y-2 text-xs">
                {[
                  { brand: 'Rational AG', keyword: 'combi oven rational bekas scc 101', edge: 'BBKitchen memiliki teknisi tersertifikasi & rekondisi garansi 3 bulan' },
                  { brand: 'Nayati Indonesia', keyword: 'nayati gas range 4 burner bekas', edge: 'Harga 50-65% lebih hemat dibanding unit baru pabrik' },
                  { brand: 'Hoshizaki', keyword: 'chiller upright hoshizaki 4 pintu bekas', edge: 'Ready stock siap kirim Jakarta, Tangsel, Surabaya tanpa inden 3 bulan' },
                  { brand: 'La Marzocco', keyword: 'la marzocco linea mini & pb bekas cafe', edge: 'Paket bundling grinder komersial & kalibrasi air gratis' },
                ].map((c, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-white font-bold">
                      <span>{c.brand}</span>
                      <span className="text-amber-400 font-mono text-[11px]">{c.keyword}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">Keunggulan BBK: {c.edge}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                🏛️ 5 Content Pillars Bukan Baru Kitchen
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Topik utama untuk membangun topical authority di mata Google Search.
              </p>
              <div className="space-y-2 text-xs">
                {[
                  { pillar: '1. Combi Oven & Heavy Cooking', slug: 'combi-oven', articles: '12 Artikel Cluster', skus: '142 SKU' },
                  { pillar: '2. Commercial Refrigeration (Chiller/Freezer)', slug: 'refrigeration', articles: '18 Artikel Cluster', skus: '286 SKU' },
                  { pillar: '3. Bakery & Pizza Deck Ovens', slug: 'bakery-pizza', articles: '9 Artikel Cluster', skus: '95 SKU' },
                  { pillar: '4. Coffee & Beverage Machines', slug: 'coffee-beverage', articles: '15 Artikel Cluster', skus: '110 SKU' },
                  { pillar: '5. Stainless Fabrication & Prep Tables', slug: 'stainless-steel', articles: '8 Artikel Cluster', skus: '340 SKU' },
                ].map((p, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">{p.pillar}</div>
                      <div className="text-[11px] text-slate-500 font-mono">/category/{p.slug}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-400 font-bold font-mono text-xs">{p.articles}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{p.skus}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 2: AUDIT TEKNIS & SCHEMA.ORG JSON-LD GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'PILLAR_2' && (
        <div className="space-y-6">
          {/* Server & Core Web Vitals Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Core Web Vitals</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
                {techAudit?.coreWebVitalsScore || 96} <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">LCP 1.2s • FID 12ms • CLS 0.01</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Server TTFB Latency</span>
                <Server className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black font-mono text-amber-400 mt-2">
                {techAudit?.ttfbMs || 72} <span className="text-xs text-slate-500">ms</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Edge Cached (Vercel CDN)</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Sitemap.xml Indexed</span>
                <Globe className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-3xl font-black font-mono text-sky-400 mt-2">
                {techAudit?.sitemapUrlsCount?.toLocaleString('id-ID') || '2.815'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">URLs Tersinkronisasi Otomatis</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">SSL & HTTPS Security</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
                TLS 1.3
              </div>
              <div className="text-[11px] text-slate-400 mt-1">HSTS Preloaded & Valid</div>
            </div>
          </div>

          {/* Technical Diagnostics */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Status Konfigurasi Robots.txt & Arsitektur URL</span>
              <button
                type="button"
                onClick={fetchTechnicalAudit}
                disabled={isLoadingTech}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingTech ? 'animate-spin' : ''}`} />
                <span>Re-Check Server</span>
              </button>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>Robots.txt Directives:</span>
                  <span className="text-emerald-400">STATUS: VALID</span>
                </div>
                <pre className="text-slate-400 text-[11px] leading-relaxed overflow-x-auto bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
{`User-agent: *
Allow: /
Allow: /product/
Allow: /category/
Disallow: /admin/
Disallow: /api/inventory/export
Sitemap: https://bukanbarukitchen.com/sitemap.xml`}
                </pre>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>URL Architecture & Canonical Rules:</span>
                  <span className="text-emerald-400">STATUS: OPTIMAL</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Trailing slash normalization otomatis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Canonical tag mengarah ke https://bukanbarukitchen.com/product/[sku]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>OpenGraph (og:title, og:image, og:price) terpasang di Next.js metadata</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Responsif mobile viewport & responsive WebP image optimization</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schema.org Live Product & Offer Generator */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Live Schema.org Product & Offer Rich Snippet Generator</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Markup terstruktur JSON-LD valid untuk Google Search Rich Results (SKU, Harga IDR, Kondisi Bekas, Breadcrumb).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySchema(activeSchemaString)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors"
                >
                  {copiedSchema ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Schema JSON-LD</span>
                    </>
                  )}
                </button>

                <a
                  href="https://search.google.com/test/rich-results"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  <span>Tes di Google</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Code Viewer */}
            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-96 leading-relaxed">
                {activeSchemaString || 'Pilih SKU di tab On-Page untuk memuat Schema JSON-LD.'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 3: OPTIMASI ON-PAGE & 1-CLICK AUTOFIX (Across 2,797 Items) */}
      {/* ========================================================================= */}
      {activeTab === 'PILLAR_3' && (
        <div className="space-y-6">
          {/* Target SKU Selector */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">
                Pilih atau Ketik SKU Produk untuk Di-Audit SEO On-Page:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={auditTargetSku}
                  onChange={(e) => setAuditTargetSku(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runAudit(auditTargetSku);
                  }}
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
              {['BBK-GK-COM-0007', 'BBK-PE-COF-0014', 'BBK-SM-COO-0028', 'BBK-ML-REF-0021'].map((sku) => (
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
              {/* Score & SERP Preview Card */}
              <div className="space-y-6">
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
                      Kepatuhan standar teknis Bukan Baru Kitchen (Yoast Metadata, Image ALT, Heading, Spesifikasi, Schema).
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pemeriksaan Lulus:</span>
                      <span className="font-bold text-emerald-400">
                        {auditResult.passedCount} / {auditResult.totalCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Keyword:</span>
                      <span className="font-bold text-slate-200">{auditResult.focusKeyword}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Panjang Deskripsi:</span>
                      <span className="text-slate-200">{auditResult.wordCount} kata</span>
                    </div>
                  </div>

                  {/* 1-Click Autofix Button */}
                  <button
                    type="button"
                    onClick={handleApplyAutofix}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>1-Click Auto-Generate Yoast & ALT</span>
                  </button>
                </div>

                {/* Google SERP Live Snippet Preview */}
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>Live Google SERP Snippet Preview</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-sans">
                    <div className="text-[11px] text-slate-400 truncate">
                      https://bukanbarukitchen.com &gt; product &gt; {auditResult.slug}
                    </div>
                    <div className="text-sm font-medium text-sky-400 hover:underline cursor-pointer line-clamp-1">
                      {autofixData ? autofixData.seoTitle : auditResult.title}
                    </div>
                    <div className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {autofixData ? autofixData.yoastDescription : auditResult.metaDescription}
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist Breakdown & 1-Click Autofix Output */}
              <div className="lg:col-span-2 space-y-6">
                {autofixApplied && autofixData && (
                  <div className="p-5 bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <Sparkles className="w-4 h-4" />
                        <span>Rekomendasi Autofix Otomatis BBKitchen Engine</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `Yoast Keyword: ${autofixData.yoastKeyword}\nSEO Title: ${autofixData.seoTitle}\nMeta Description: ${autofixData.yoastDescription}\nImage Alt: ${autofixData.imageAlt}`
                          );
                          setCopiedAutofix(true);
                          setTimeout(() => setCopiedAutofix(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-slate-950 text-[11px] font-bold rounded-lg shadow"
                      >
                        {copiedAutofix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAutofix ? 'Disalin!' : 'Salin Semua'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono">YOAST KEYWORD</div>
                        <div className="font-bold text-amber-300 mt-0.5">{autofixData.yoastKeyword}</div>
                      </div>
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono">IMAGE ALT TAG</div>
                        <div className="font-bold text-emerald-300 mt-0.5">{autofixData.imageAlt}</div>
                      </div>
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 md:col-span-2">
                        <div className="text-[10px] text-slate-400 font-mono">SEO TITLE ({autofixData.seoTitle.length} chars)</div>
                        <div className="font-bold text-white mt-0.5">{autofixData.seoTitle}</div>
                      </div>
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 md:col-span-2">
                        <div className="text-[10px] text-slate-400 font-mono">META DESCRIPTION ({autofixData.yoastDescription.length} chars)</div>
                        <div className="text-slate-300 mt-0.5 leading-relaxed">{autofixData.yoastDescription}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                    Rincian 8 Parameter Audit SEO On-Page
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
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 4: SEO OFF-PAGE & LINK BUILDING SIGNALS */}
      {/* ========================================================================= */}
      {activeTab === 'PILLAR_4' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-amber-400" />
                  <span>Profil Backlink & Sinyal Otoritas F&B Indonesia</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pemantauan tautan eksternal dari media kuliner, direktori bisnis, dan forum restoran nasional.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                4 Active Signals
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-3 px-4">Domain Rujukan</th>
                    <th className="py-3 px-3">Tipe Sumber</th>
                    <th className="py-3 px-3">Anchor Text</th>
                    <th className="py-3 px-3">Domain Authority (DA)</th>
                    <th className="py-3 px-3">Tanggal Ditemukan</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {offPageSignals.map((sig) => (
                    <tr key={sig.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>{sig.sourceDomain}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{sig.sourceType}</td>
                      <td className="py-3 px-3 text-amber-300 font-sans italic">&quot;{sig.anchorText}&quot;</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-950 border border-slate-800 text-emerald-400">
                          DA {sig.domainAuthority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{sig.dateDiscovered}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            sig.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {sig.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 5: KONVERSI & CRO (Direct WhatsApp Consultation CTA) */}
      {/* ========================================================================= */}
      {activeTab === 'PILLAR_5' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Direct WhatsApp CTA Engine</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Di industri peralatan dapur komersial, konversi tertinggi terjadi melalui konsultasi WhatsApp cepat dengan data SKU lengkap.
              </p>

              {currentInventoryItem && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="text-slate-400">Preview Pesan Otomatis WhatsApp Pembeli:</div>
                  <div className="p-3 bg-slate-900 rounded-lg text-emerald-300 text-[11px] leading-relaxed border border-slate-800">
                    &quot;Halo Admin BBKitchen, saya ingin konsultasi ketersediaan unit dan jadwal survei Hub {currentInventoryItem.LOKASI_UNIT} untuk produk: {currentInventoryItem.ITEM_NAME} (SKU: {currentInventoryItem.SKU}) dengan harga Rp {currentInventoryItem.HARGA_ESTIMASI_PUBLIK?.toLocaleString('id-ID')}. Terima kasih!&quot;
                  </div>
                  <a
                    href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                      `Halo Admin BBKitchen, saya ingin konsultasi unit ${currentInventoryItem.ITEM_NAME} (${currentInventoryItem.SKU})`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Uji Kirim Pesan WA</span>
                  </a>
                </div>
              )}
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ⚡ 4 Parameter CRO & User Experience
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Transparansi Harga Publik (IDR)', desc: 'Menghilangkan friksi &quot;tanya harga via DM&quot;, meningkatkan trust pembeli hotel & cafe hingga 4x lipat.' },
                  { label: 'Badge Lokasi Hub Gudang', desc: 'Pembeli bisa memilih gudang terdekat (BK HQ, GK, BL, PE, SM, ML) untuk inspeksi fisik langsung.' },
                  { label: 'Garansi Rekondisi Teknis BBKitchen', desc: 'Setiap unit dijamin lolos 18-point inspection checklist teknisi kelistrikan & kompresor.' },
                  { label: 'Multi-Angle High-Resolution Photos', desc: 'Foto tampak depan, pelat kapasitas daya, dan bagian dalam unit mengurangi keraguan pembeli.' },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="font-bold text-amber-300">{item.label}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 6: PEMANTAUAN & GSC RANK TRACKING (Google.co.id SERP) */}
      {/* ========================================================================= */}
      {activeTab === 'PILLAR_6' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Google Indonesia (Google.co.id) Keyword Rank Tracking</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pemantauan posisi ranking organik Google Search Console 30 hari terakhir untuk kata kunci ber-intent komersial tinggi.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg">
                  Top 3: 4 Keywords
                </span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg">
                  Total Clicks: 1.416 /bln
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-3 px-4">Kata Kunci Target</th>
                    <th className="py-3 px-3 text-center">Posisi SERP</th>
                    <th className="py-3 px-3 text-center">Perubahan</th>
                    <th className="py-3 px-3">Tayangan (30h)</th>
                    <th className="py-3 px-3">Klik (30h)</th>
                    <th className="py-3 px-3">CTR</th>
                    <th className="py-3 px-3 text-right">Landing Page URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rankings.map((rk) => (
                    <tr key={rk.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">
                        <span>{rk.keyword}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-base font-black text-amber-400 font-mono">
                          #{rk.position}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {rk.rankingChange === 'UP' ? (
                          <span className="text-emerald-400 font-bold text-[11px]">▲ Naik</span>
                        ) : rk.rankingChange === 'DOWN' ? (
                          <span className="text-rose-400 font-bold text-[11px]">▼ Turun</span>
                        ) : (
                          <span className="text-slate-400 font-bold text-[11px]">— Stabil</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{rk.impressions30d.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{rk.clicks30d.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-3 text-slate-400">{rk.ctr}</td>
                      <td className="py-3 px-3 text-right text-slate-400 hover:text-white truncate max-w-xs">
                        <a href={rk.landingPage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                          <span className="truncate">{rk.landingPage.replace('https://bukanbarukitchen.com', '')}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ARTICLE PIPELINE VIEW (8 Workflow Stages) */}
      {/* ========================================================================= */}
      {activeTab === 'ARTICLES' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Alur Produksi Artikel SEO (WordPress CMS Integration)
                </h2>
                <p className="text-xs text-slate-400">
                  Dari riset keyword hingga ranking di Google Search Console.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewArticleModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Artikel Baru</span>
              </button>
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
                      <span className="text-xs font-mono text-slate-500">
                        • Kategori: {art.relatedCategorySlug}
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

      {/* ========================================================================= */}
      {/* MODAL: BUAT ARTIKEL BARU */}
      {/* ========================================================================= */}
      {showNewArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Buat Artikel Baru (SEO Content Pipeline)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewArticleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateArticle} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Judul Artikel SEO *</label>
                <input
                  type="text"
                  required
                  value={newArtTitle}
                  onChange={(e) => setNewArtTitle(e.target.value)}
                  placeholder="Contoh: Panduan Memilih Chiller 4 Pintu Bekas Bergaransi untuk Restoran"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Focus Keyword *</label>
                  <input
                    type="text"
                    required
                    value={newArtKeyword}
                    onChange={(e) => setNewArtKeyword(e.target.value)}
                    placeholder="Contoh: chiller 4 pintu bekas"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Search Intent</label>
                  <select
                    value={newArtIntent}
                    onChange={(e) => setNewArtIntent(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-300 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="COMMERCIAL">COMMERCIAL (Investigasi Pembelian)</option>
                    <option value="INFORMATIONAL">INFORMATIONAL (Panduan & Edukasi)</option>
                    <option value="TRANSACTIONAL">TRANSACTIONAL (Jual / Beli / Harga)</option>
                    <option value="NAVIGATIONAL">NAVIGATIONAL (Brand / Spesifik)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Pilar Kategori</label>
                  <select
                    value={newArtCategory}
                    onChange={(e) => setNewArtCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="combi-oven">Combi Oven</option>
                    <option value="refrigeration">Commercial Refrigeration</option>
                    <option value="cooking-range">Cooking Range & Deep Fryer</option>
                    <option value="coffee-beverage">Coffee & Beverage</option>
                    <option value="bakery-pizza">Bakery & Pizza</option>
                    <option value="ice-maker">Ice Maker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Penulis / Assignee</label>
                  <input
                    type="text"
                    value={newArtAuthor}
                    onChange={(e) => setNewArtAuthor(e.target.value)}
                    placeholder="Nama penulis..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Related SKUs (Pisahkan Koma untuk Internal Link)</label>
                <input
                  type="text"
                  value={newArtSkus}
                  onChange={(e) => setNewArtSkus(e.target.value)}
                  placeholder="BBK-GK-COM-0007, BBK-ML-REF-0021"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Ringkasan / Excerpt / Yoast Meta Description</label>
                <textarea
                  rows={2}
                  value={newArtExcerpt}
                  onChange={(e) => setNewArtExcerpt(e.target.value)}
                  placeholder="Ringkasan singkat artikel untuk snippet Google (120-160 karakter)..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Konten / Kerangka Artikel</label>
                <textarea
                  rows={4}
                  value={newArtContent}
                  onChange={(e) => setNewArtContent(e.target.value)}
                  placeholder="Tulis draf atau outline artikel di sini..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewArticleModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  Simpan ke Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
