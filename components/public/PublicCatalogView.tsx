'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MasterInventoryItem } from '@/lib/types/inventory';
import { ProductCard } from '@/components/public/ProductCard';
import {
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  ChefHat,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export function PublicCatalogView() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSearch = searchParams.get('q') || '';

  const [items, setItems] = useState<MasterInventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(16);
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState('ALL');
  const [condition, setCondition] = useState('ALL');
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC'>('NEWEST');
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    'ALL',
    'Combi Oven',
    'Commercial Refrigeration',
    'Cooking Equipment',
    'Coffee & Espresso',
    'Bakery & Pastry',
    'Stainless Fabrication',
    'Dishwasher & Sanitation',
    'Food Preparation',
  ];

  const locations = [
    { label: 'Semua Gudang', value: 'ALL' },
    { label: 'Pamulang 2, Tangsel', value: 'PAMULANG 2' },
    { label: 'Pamulang Barat, Tangsel', value: 'PAMULANG BARAT' },
    { label: 'Setu, Tangsel', value: 'SETU' },
    { label: 'Sawangan, Depok', value: 'SAWANGAN' },
    { label: 'Kedaung, Tangsel', value: 'KEDAUNG' },
  ];

  const conditions = [
    { label: 'Semua Kondisi', value: 'ALL' },
    { label: 'Grade A+ (Bekas Seperti Baru)', value: 'Grade A+' },
    { label: 'Grade A (Mulus Siap Pakai)', value: 'Grade A' },
    { label: 'Rekondisi Total (Uji Running)', value: 'Rekondisi' },
    { label: 'Grade B+ (Fungsi Normal)', value: 'Grade B+' },
  ];

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let query = `/api/inventory?page=${page}&pageSize=${pageSize}&role=VIEWER`;
      if (category !== 'ALL') query += `&category=${encodeURIComponent(category)}`;
      if (location !== 'ALL') query += `&location=${encodeURIComponent(location)}`;
      if (condition !== 'ALL') query += `&condition=${encodeURIComponent(condition)}`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;

      const res = await fetch(query);
      const data = await res.json();
      let sortedItems: MasterInventoryItem[] = data.items || [];

      if (sortBy === 'PRICE_ASC') {
        sortedItems.sort((a, b) => a.HARGA_ESTIMASI_PUBLIK - b.HARGA_ESTIMASI_PUBLIK);
      } else if (sortBy === 'PRICE_DESC') {
        sortedItems.sort((a, b) => b.HARGA_ESTIMASI_PUBLIK - a.HARGA_ESTIMASI_PUBLIK);
      }

      setItems(sortedItems);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Catalog fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, category, location, condition, search, sortBy]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await loadData();
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    setCategory('ALL');
    setLocation('ALL');
    setCondition('ALL');
    setSearch('');
    setSortBy('NEWEST');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama mesin, merek (Rational, Hoshizaki, Unox, La Marzocco), atau SKU..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-colors shrink-0"
          >
            Cari Peralatan
          </button>
        </form>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'Semua Kategori' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Lokasi Gudang</label>
            <select
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {locations.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Grade Kondisi</label>
            <select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {conditions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Urutkan</label>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="NEWEST">Terbaru Masuk Gudang</option>
              <option value="PRICE_ASC">Harga: Termurah ke Tertinggi</option>
              <option value="PRICE_DESC">Harga: Tertinggi ke Termurah</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <div className="text-slate-400">
            Menampilkan <span className="text-white font-bold">{items.length}</span> dari{' '}
            <span className="text-amber-400 font-bold font-mono">{totalCount.toLocaleString()}</span> unit komersial ready stock
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
          <p className="text-sm">Memuat stok unit komersial...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-3">
          <ChefHat className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Tidak ada unit yang cocok</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau reset filter kategori untuk melihat 2,700+ unit peralatan dapur lainnya.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow mt-2"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <ProductCard key={item.SKU} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4 inline" /> Sebelumnya
          </button>
          <span className="px-4 py-2 text-xs font-mono text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
            Halaman {page} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => {
              setPage((p) => p + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700 disabled:opacity-40"
          >
            Berikutnya <ChevronRight className="w-4 h-4 inline" />
          </button>
        </div>
      )}
    </div>
  );
}
