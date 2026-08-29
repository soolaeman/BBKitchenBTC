import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { ProductCard } from '@/components/public/ProductCard';
import { getMasterInventoryItems } from '@/lib/repositories/inventory-repository';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import {
  ShieldCheck,
  MapPin,
  MessageCircle,
  Wrench,
  CheckCircle2,
  Building2,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ sku: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);

  const { items } = await getMasterInventoryItems(
    {
      search: decodedSku,
      pageSize: 1,
    },
    'VIEWER'
  );

  const product = items.find((i) => i.SKU.toLowerCase() === decodedSku.toLowerCase()) || items[0];

  if (!product) {
    notFound();
  }

  // Fetch related items from the same category
  const { items: relatedItems } = await getMasterInventoryItems(
    {
      category: product.CATEGORY_SLUG,
      pageSize: 4,
    },
    'VIEWER'
  );

  const filteredRelated = relatedItems.filter((i) => i.SKU !== product.SKU).slice(0, 3);

  // Pre-filled WhatsApp consultation message
  const waConsultMessage = `Halo Bukan Baru Kitchen, saya tertarik dengan unit *${product.PRODUCT_TITLE}* (SKU: ${product.SKU}) di gudang ${product.LOKASI_UNIT}. Apakah unit ini masih ready dan bisa dijadwalkan test running?`;

  const waUrl = `https://wa.me/6281289000000?text=${encodeURIComponent(waConsultMessage)}`;

  // JSON-LD Structured Data Schema.org/Product
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.PRODUCT_TITLE,
    image: [product.FEATURED_IMAGE || 'https://picsum.photos/seed/bbk/800/600'],
    description: `Beli ${product.PRODUCT_TITLE} bekas bergaransi 30 hari. Kondisi ${product.KONDISI_UNIT}, siap test run di ${product.LOKASI_UNIT}.`,
    sku: product.SKU,
    brand: {
      '@type': 'Brand',
      name: product.SPESIFIKASI?.['Merek'] || 'Commercial Standard',
    },
    offers: {
      '@type': 'Offer',
      url: `https://bukanbarukitchen.com/product/${product.SKU}`,
      priceCurrency: 'IDR',
      price: product.HARGA_BUKA_WA,
      priceValidUntil: '2026-12-31',
      itemCondition: 'https://schema.org/UsedCondition',
      availability:
        product.STATUS_UNIT === 'AVAILABLE'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
      seller: {
        '@type': 'Organization',
        name: 'Bukan Baru Kitchen',
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-amber-400 transition-colors">
            Katalog
          </Link>
          <span>/</span>
          <Link
            href={`/catalog?category=${encodeURIComponent(product.CATEGORY_SLUG)}`}
            className="hover:text-amber-400 transition-colors"
          >
            {product.CATEGORY_NAME}
          </Link>
          <span>/</span>
          <span className="text-slate-200 truncate font-mono">{product.SKU}</span>
        </div>

        {/* Top Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
              {product.FEATURED_IMAGE ? (
                <Image
                  src={product.FEATURED_IMAGE}
                  alt={product.PRODUCT_TITLE}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 font-mono text-sm">
                  Foto Sedang Diproses Studio
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-950/80 backdrop-blur text-emerald-400 border border-slate-800">
                  {product.KONDISI_UNIT}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-950/80 backdrop-blur text-amber-300 border border-amber-800">
                  Garansi 30 Hari
                </span>
              </div>
            </div>

            {/* Thumbnail preview list */}
            {product.PHOTO_URLS && product.PHOTO_URLS.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {product.PHOTO_URLS.slice(0, 4).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"
                  >
                    <Image
                      src={img}
                      alt={`${product.PRODUCT_TITLE} view ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="120px"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Title, Pricing & WhatsApp Conversion CTA */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
                <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800">
                  SKU: {product.SKU}
                </span>
                <span>•</span>
                <span className="text-slate-400">{product.CATEGORY_NAME}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {product.PRODUCT_TITLE}
              </h1>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Unit Ready di Gudang: <strong className="text-white">{product.LOKASI_UNIT}</strong></span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-6 bg-slate-900/90 border border-slate-800/80 rounded-2xl space-y-2">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Harga Penawaran Unit
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {product.HARGA_BUKA_WA != null ? formatIDR(product.HARGA_BUKA_WA) : 'Hubungi kami'}
              </div>
              <div className="text-xs text-slate-400">
                Nego tipis via WhatsApp • Termasuk uji running kelistrikan di gudang
              </div>
            </div>

            {/* WhatsApp Direct Action Button */}
            <div className="space-y-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-3 text-center"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Tanya Ketersediaan & Jadwalkan Uji Running</span>
              </a>

              <p className="text-[11px] text-center text-slate-400">
                Respon cepat sales teknis dalam 5-15 menit (Senin - Sabtu 08:30 - 17:30)
              </p>
            </div>

            {/* 3 Quick Guarantees */}
            <div className="space-y-2 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Garansi 30 Hari Servis Mekanikal & Kelistrikan BBKitchen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bisa inspeksi langsung & cek suhu di gudang sebelum bayar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dukungan instalasi & pengiriman teknisi Jabodetabek</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specs & QC Report Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-slate-800/80">
          {/* Commercial Specs Table */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              Spesifikasi Teknis Mesin
            </h2>

            <div className="divide-y divide-slate-800/60 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Kondisi Fisik</span>
                <span className="font-semibold text-emerald-400">{product.KONDISI_UNIT}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Kategori</span>
                <span className="font-medium text-slate-200">{product.CATEGORY_NAME}</span>
              </div>

              {Object.entries(product.SPESIFIKASI || {}).map(([key, val]) => (
                <div key={key} className="py-2.5 flex justify-between">
                  <span className="text-slate-400">{key}</span>
                  <span className="font-medium text-slate-200">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 12-Point QC Checklist & Warehouse Details */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Hasil Uji Kelayakan Teknisi (12-Point QC)
              </h2>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kompresor / Pemanas Normal</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kelistrikan & Voltase Stabil</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kerapatan Karet Pintu / Seal</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sensor Suhu / Thermostat Akurat</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Struktur Stainless 304 Kokoh</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sirkulasi Fan & Filter Bersih</span>
                </div>
              </div>
            </div>

            {/* Warehouse Hub Info */}
            <div className="p-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl flex items-start gap-4">
              <Building2 className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-white text-sm">Lokasi Fisik: {product.LOKASI_UNIT}</div>
                <p className="text-slate-400">
                  Unit berada dalam ruang display berpendingin dan siap disambungkan ke sumber listrik untuk Anda coba langsung.
                </p>
                <div className="pt-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>Minta Share Location Google Maps</span> →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Equipment */}
        {filteredRelated.length > 0 && (
          <div className="pt-10 border-t border-slate-800/80 space-y-6">
            <h2 className="text-xl font-bold text-white">Peralatan Terkait Lainnya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRelated.map((item) => (
                <ProductCard key={item.SKU} item={item} />
              ))}
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
