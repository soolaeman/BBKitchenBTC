import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { ProductCard } from '@/components/public/ProductCard';
import { getMasterInventoryItems } from '@/lib/repositories/inventory-repository';
import { WAREHOUSE_HUB_DETAILS } from '@/lib/repositories/warehouse-utils';
import {
  ChefHat,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Flame,
  Snowflake,
  Coffee,
  Sparkles,
  Layers,
  Wrench,
  Search,
  MessageCircle,
  Truck,
} from 'lucide-react';

export default async function HomePage() {
  // Fetch top featured units for homepage showcase
  const { items } = await getMasterInventoryItems(
    {
      page: 1,
      pageSize: 8,
      condition: 'Grade A+',
    },
    'VIEWER'
  );

  const categoryCards = [
    {
      title: 'Combi Oven Komersial',
      count: '420+ Unit',
      desc: 'Rational, Unox, MKN, Convotherm 6-20 Tray',
      icon: <ChefHat className="w-6 h-6 text-amber-400" />,
      link: '/catalog?category=Combi%20Oven',
      tag: 'Hemat Hingga 60%',
    },
    {
      title: 'Refrigeration & Chiller',
      count: '680+ Unit',
      desc: 'Upright 2-4 Pintu, Undercounter & Ice Maker',
      icon: <Snowflake className="w-6 h-6 text-blue-400" />,
      link: '/catalog?category=Commercial%20Refrigeration',
      tag: 'Grade A Siap Pakai',
    },
    {
      title: 'Cooking Range & Fryer',
      count: '540+ Unit',
      desc: 'Heavy Duty 4-6 Burner, Griddle & Deep Fryer',
      icon: <Flame className="w-6 h-6 text-rose-400" />,
      link: '/catalog?category=Cooking%20Equipment',
      tag: 'Garansi Servis',
    },
    {
      title: 'Mesin Espresso & Grinder',
      count: '290+ Unit',
      desc: 'La Marzocco, Nuova Simonelli, Victoria Arduino',
      icon: <Coffee className="w-6 h-6 text-amber-500" />,
      link: '/catalog?category=Coffee%20%26%20Espresso',
      tag: 'Lengkap Portafilter',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      <PublicHeader />

      <main className="flex-1 space-y-16 pb-16">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs font-bold shadow-lg shadow-amber-950/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Pusat Peralatan Dapur Komersial Terlengkap Jabodetabek</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                Peralatan Restoran & Cafe Berkualitas.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                  Hemat Biaya Modal.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Temukan 2,700+ unit Combi Oven, Upright Chiller, Heavy-Duty Stove, dan Mesin Kopi bergaransi 30 hari. Telah melalui 12 titik inspeksi teknis di 5 hub gudang siap uji running.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/catalog"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Jelajahi 2,700+ Unit Ready</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="https://wa.me/6281289000000?text=Halo%20Bukan%20Baru%20Kitchen,%20saya%20ingin%20jadwalkan%20kunjungan%20inspeksi%20ke%20gudang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Jadwal Uji Test Running Gudang</span>
                </a>
              </div>
            </div>

            {/* 4 Trust Badges Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-slate-800/80">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/60 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white text-xs">Garansi Servis 30 Hari</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Teknisi & sparepart mekanik tercover</div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/60 flex items-start gap-3">
                <Wrench className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-white text-xs">12 Titik Uji QC Ketat</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Tes kompresor, suhu, & kelistrikan</div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/60 flex items-start gap-3">
                <MapPin className="w-6 h-6 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-white text-xs">5 Hub Jabodetabek</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Pamulang, Setu, Sawangan & Kedaung</div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/60 flex items-start gap-3">
                <Truck className="w-6 h-6 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold text-white text-xs">Kirim & Instalasi Kilat</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Armada pickup & teknisi on-site</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* POPULAR CATEGORIES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Kategori Unggulan
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Peralatan Utama Dapur Komersial
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Semua Kategori</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categoryCards.map((cat, idx) => (
              <Link
                key={idx}
                href={cat.link}
                className="group bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-amber-500/5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-mono">
                      {cat.count}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-4 group-hover:text-amber-400 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cat.desc}</p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="text-[11px] text-emerald-400">{cat.tag}</span>
                  <span className="group-hover:translate-x-1 transition-transform text-amber-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FEATURED INVENTORY SHOWCASE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Ready Stock di Gudang
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Unit Pilihan Grade A+ Siap Kirim
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Lihat 2,700+ Unit Lainnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item) => (
              <ProductCard key={item.SKU} item={item} />
            ))}
          </div>
        </section>

        {/* 5 WAREHOUSE LOCATIONS SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-8 sm:p-12">
            <div className="max-w-3xl mb-8 space-y-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                Fasilitas Inspeksi Fisik
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Kunjungi 5 Hub Gudang Bukan Baru Kitchen di Jabodetabek
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Seluruh unit dapat Anda coba langsung dengan listrik dan air bertekanan sebelum melakukan pembayaran. Teknisi kami siap mendampingi uji running.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WAREHOUSE_HUB_DETAILS.map((hub, i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      {hub.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {hub.codes.join(', ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{hub.address}</p>
                  <div className="text-[11px] text-amber-400/90 pt-1 font-medium">
                    ⚡ {hub.specialty}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Buka Senin - Sabtu (08:30 - 17:30 WIB) • Parkir Truk & Pickup Luas
              </div>
              <Link
                href="/gudang"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Lihat Panduan Kunjungan Gudang
              </Link>
            </div>
          </div>
        </section>

        {/* CTA BOTTOM BANNER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center p-10 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Butuh Konsultasi Paket Lengkap Dapur Restoran?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Tim spesialis kami siap menyusun estimasi kebutuhan mesin, layout dapur, dan paket harga hemat untuk cafe atau restoran Anda.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/6281289000000?text=Halo%20Bukan%20Baru%20Kitchen,%20saya%20butuh%20paket%20lengkap%20peralatan%20dapur%20restoran"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/25"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Hubungi Sales Consultant WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
