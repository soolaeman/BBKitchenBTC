import React from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { getSEOArticles } from '@/lib/repositories/seo-repository';
import { BookOpen, Calendar, User, ArrowRight, Sparkles, Tag } from 'lucide-react';

export const metadata = {
  title: 'Panduan & Tips Peralatan Dapur Komersial | Bukan Baru Kitchen',
  description:
    'Kumpulan panduan teknis memilih combi oven, perawatan chiller restoran, standarisasi dapur cafe, dan tips hemat modal peralatan bekas.',
};

export default function ArticlesPage() {
  const articles = getSEOArticles().filter((a) => a.stage === 'PUBLISHED' || a.stage === 'INDEXED' || a.stage === 'RANKING' || a.stage === 'REVIEW');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            Knowledge Base & SEO Guides
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Panduan Pembelian & Perawatan Dapur Restoran
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Ditulis oleh teknisi dan konsultan kitchen equipment berpengalaman Bukan Baru Kitchen.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <article
              key={art.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                    {art.relatedCategorySlug}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {art.wordCount} Kata
                  </span>
                </div>

                <Link href={`/articles/${art.slug}`}>
                  <h2 className="text-base font-bold text-white hover:text-amber-400 transition-colors leading-snug">
                    {art.title}
                  </h2>
                </Link>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {art.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{art.author}</span>
                </span>
                <Link
                  href={`/articles/${art.slug}`}
                  className="font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                >
                  <span>Baca Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
