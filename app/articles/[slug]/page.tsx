import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { getSEOArticles } from '@/lib/repositories/seo-repository';
import { getMasterInventoryItems } from '@/lib/repositories/inventory-repository';
import { ProductCard } from '@/components/public/ProductCard';
import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Sparkles,
  Tag,
  BookOpen,
  MessageCircle,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SingleArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const articles = getSEOArticles();
  const article = articles.find((a) => a.slug === slug) || articles[0];

  if (!article) {
    notFound();
  }

  // Fetch recommended related SKU cards
  const { items: relatedUnits } = await getMasterInventoryItems(
    { pageSize: 3 },
    'VIEWER'
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Back Link */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Indeks Artikel & Panduan</span>
        </Link>

        {/* Article Header */}
        <div className="space-y-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800 font-mono">
              {article.relatedCategorySlug}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Target Keyword: &quot;{article.targetKeyword}&quot;
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              <span>Oleh: {article.author}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>{article.wordCount} Kata • 5 Menit Baca</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="text-sm text-slate-300 leading-relaxed space-y-6">
          <p className="text-base text-slate-200 font-medium leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            {article.excerpt}
          </p>

          <h2 className="text-xl font-bold text-white pt-4">
            1. Mengapa Peralatan Dapur Komersial Bekas Menjadi Solusi Hemat Modal?
          </h2>
          <p>
            Membuka restoran, cafe, atau bakery membutuhkan alokasi belanja modal (CAPEX) terbesar pada sektor kitchen equipment. Membeli unit baru dari brand ternama seperti Rational, Hoshizaki, atau Unox sering kali memakan 40-50% dari total modal awal.
          </p>
          <p>
            Dengan memilih unit bekas berkualitas yang telah melewati 12 titik inspeksi teknis Bukan Baru Kitchen, pemilik bisnis kuliner dapat menghemat 40% hingga 60% biaya modal dengan keandalan mesin yang setara.
          </p>

          <h2 className="text-xl font-bold text-white pt-4">
            2. Checklist Penting Sebelum Membeli Mesin Restoran
          </h2>
          <ul className="space-y-2 list-disc list-inside text-slate-300">
            <li><strong>Kelistrikan & Voltase:</strong> Pastikan kapasitas daya listrik (Watt & Phase 1/3) di lokasi outlet sesuai dengan spesifikasi mesin.</li>
            <li><strong>Kondisi Kompresor & Gas:</strong> Cek kebocoran freon atau kestabilan api burner range.</li>
            <li><strong>Material Higienis:</strong> Utamakan stainless steel food grade (SUS 304) untuk ketahanan korosi dan kemudahan sanitasi.</li>
            <li><strong>Ketersediaan Sparepart & Garansi Servis:</strong> Pastikan penyedia memberikan garansi servis minimal 30 hari seperti standar BBKitchen.</li>
          </ul>

          <h2 className="text-xl font-bold text-white pt-4">
            3. Rekomendasi Unit Komersial Ready Stock
          </h2>
          <p>
            Berikut beberapa pilihan unit ready di 5 hub gudang Bukan Baru Kitchen yang siap diuji coba langsung:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 not-prose">
            {relatedUnits.map((unit) => (
              <ProductCard key={unit.SKU} item={unit} />
            ))}
          </div>
        </div>

        {/* Article Footer CTA */}
        <div className="mt-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
          <h3 className="text-xl font-bold text-white">
            Ingin Konsultasi Kebutuhan Peralatan Dapur Bisnis Anda?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Tim konsultan teknis Bukan Baru Kitchen siap membantu memilihkan mesin yang tepat sesuai menu dan kapasitas produksi restoran Anda.
          </p>
          <div className="pt-2">
            <a
              href="https://wa.me/6281289000000?text=Halo%20Bukan%20Baru%20Kitchen,%20saya%20sudah%20membaca%20artikel%20panduan%20dan%20ingin%20konsultasi%20peralatan."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konsultasi WhatsApp Gratis</span>
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
