'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChefHat,
  Search,
  MessageCircle,
  Menu,
  X,
  MapPin,
  ShieldCheck,
  Building2,
  Lock,
} from 'lucide-react';

export function PublicHeader() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800/80">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 text-xs font-bold py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-6 flex-wrap">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Garansi Servis 30 Hari</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>5 Gudang Inspeksi Fisik Jabodetabek</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span>Siap Kirim & Uji Running Mesin</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block leading-none">
                BUKAN BARU <span className="text-amber-400">KITCHEN</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block mt-0.5">
                Pusat Peralatan Dapur Komersial
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari combi oven, chiller, mesin espresso, mixer..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>
          </form>

          {/* Desktop Nav Links & CTAs */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/catalog" className="hover:text-amber-400 transition-colors">
              Katalog Peralatan
            </Link>
            <Link href="/gudang" className="hover:text-amber-400 transition-colors">
              Lokasi 5 Gudang
            </Link>
            <Link href="/articles" className="hover:text-amber-400 transition-colors">
              Panduan & Artikel
            </Link>
            <Link href="/admin" className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
              <Lock className="w-3.5 h-3.5" />
              <span>Control Tower</span>
            </Link>

            <a
              href="https://wa.me/6281289000000?text=Halo%20Bukan%20Baru%20Kitchen,%20saya%20ingin%20konsultasi%20kebutuhan%20peralatan%20dapur%20restoran"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konsultasi WhatsApp</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              title="Admin Control Tower"
            >
              <Lock className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari combi oven, chiller, mixer..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-3 text-xs font-semibold text-slate-200">
          <Link
            href="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-lg hover:bg-slate-800"
          >
            Katalog Peralatan (2,700+ Unit)
          </Link>
          <Link
            href="/gudang"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-lg hover:bg-slate-800"
          >
            Lokasi 5 Gudang Jabodetabek
          </Link>
          <Link
            href="/articles"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-lg hover:bg-slate-800"
          >
            Panduan & Tips Dapur
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-lg hover:bg-slate-800 text-amber-400"
          >
            Masuk ke Control Tower Admin
          </Link>
          <a
            href="https://wa.me/6281289000000?text=Halo%20Bukan%20Baru%20Kitchen,%20saya%20ingin%20konsultasi%20kebutuhan%20peralatan%20dapur"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat WhatsApp Sekarang</span>
          </a>
        </div>
      )}
    </header>
  );
}
