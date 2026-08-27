import React, { Suspense } from 'react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicCatalogView } from '@/components/public/PublicCatalogView';
import { ChefHat, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Katalog Peralatan Dapur Komersial Restoran & Cafe | Bukan Baru Kitchen',
  description:
    'Jelajahi 2,700+ stok unit Combi Oven, Chiller, Freezer, Range Kompor, Deep Fryer, dan Mesin Espresso bekas bergaransi 30 hari di Jabodetabek.',
};

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Katalog Peralatan Dapur Komersial
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Daftar lengkap 2,700+ mesin restoran, cafe, dan bakery ready stock dengan uji QC 12 titik dan garansi servis 30 hari.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-20 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
              Memuat katalog...
            </div>
          }
        >
          <PublicCatalogView />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}
