'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/auth-context';
import { MasterInventoryItem, PaginatedInventoryResponse } from '@/lib/types/inventory';
import { StatusBadge, PipelineBadge, GuardrailBadge } from '@/components/ui/StatusBadges';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  SlidersHorizontal,
  Lock,
  MessageSquare,
} from 'lucide-react';

export function InventoryTable() {
  const { role, permissions } = useAuth();

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [warehouse, setWarehouse] = useState('ALL');
  const [statusUnit, setStatusUnit] = useState('ALL');
  const [statusPipeline, setStatusPipeline] = useState('ALL');
  const [guardrailStatus, setGuardrailStatus] = useState('ALL');
  const [isDirtyOnly, setIsDirtyOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('TANGGAL_MASUK');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Column Visibility
  const [showColumns, setShowColumns] = useState({
    sku: true,
    photo: true,
    title: true,
    category: true,
    location: true,
    condition: true,
    unitStatus: true,
    pipeline: true,
    publicPrice: true,
    dealFloor: true,
    cogs: true,
    telegram: true,
    aging: true,
    actions: true,
  });

  // Data States
  const [data, setData] = useState<PaginatedInventoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MasterInventoryItem | null>(null);
  const [soldModalItem, setSoldModalItem] = useState<MasterInventoryItem | null>(null);
  const [dealPriceInput, setDealPriceInput] = useState('');
  const [soldNotesInput, setSoldNotesInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });

      if (search) params.append('search', search);
      if (category !== 'ALL') params.append('category', category);
      if (warehouse !== 'ALL') params.append('warehouse', warehouse);
      if (statusUnit !== 'ALL') params.append('statusUnit', statusUnit);
      if (statusPipeline !== 'ALL') params.append('statusPipeline', statusPipeline);
      if (guardrailStatus !== 'ALL') params.append('guardrailStatus', guardrailStatus);
      if (isDirtyOnly) params.append('isDirty', 'true');

      const res = await fetch(`/api/inventory?${params.toString()}`, {
        headers: { ...(role ? { 'x-bbk-role': role ?? '' } : {}) },
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, search, category, warehouse, statusUnit, statusPipeline, guardrailStatus, isDirtyOnly, role]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await fetchInventory();
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [fetchInventory]);

  const handleMarkAsSoldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soldModalItem) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bbk-role': role ?? '',
        },
        body: JSON.stringify({
          action: 'MARK_AS_SOLD',
          sku: soldModalItem.SKU,
          dealPrice: dealPriceInput ? Number(dealPriceInput) : soldModalItem.HARGA_BUKA_WA,
          notes: soldNotesInput,
        }),
      });

      const resJson = await res.json();
      if (res.ok) {
        setActionSuccessMsg(`Unit ${soldModalItem.SKU} berhasil ditandai SOLD.`);
        setSoldModalItem(null);
        setDealPriceInput('');
        setSoldNotesInput('');
        fetchInventory();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      } else {
        alert(resJson.error || 'Failed to mark unit as sold');
      }
    } catch (err) {
      console.error('Error marking as sold', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Inventory Control Tower</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {data?.total !== undefined ? `${data.total} SKUs` : (isLoading ? 'Syncing...' : '0 SKUs')}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Katalog operasional live tersinkronisasi dengan Google Sheets & WooCommerce.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchInventory()}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Cari SKU, merk, atau nama mesin..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Semua Kategori (10 Jenis)</option>
              <option value="combi-oven">Combi Oven & Steamer</option>
              <option value="refrigeration">Commercial Chiller & Freezer</option>
              <option value="cooking-range">Gas Range & Wok Burner</option>
              <option value="bakery-equipment">Mixer & Deck Oven</option>
              <option value="coffee-beverage">Commercial Espresso Machine</option>
              <option value="prep-machinery">Meat Slicer & Food Prep</option>
              <option value="stainless-fabrication">Stainless Worktable & Sink</option>
              <option value="warewashing">Dishwasher Resto</option>
              <option value="deep-fryer">Commercial Deep Fryer</option>
              <option value="ice-machine">Commercial Ice Maker</option>
            </select>
          </div>

          {/* Status Unit Filter */}
          <div>
            <select
              value={statusUnit}
              onChange={(e) => {
                setStatusUnit(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Semua Status Unit</option>
              <option value="AVAILABLE">AVAILABLE (Tersedia)</option>
              <option value="READY">READY</option>
              <option value="SOLD">SOLD (Terjual)</option>
              <option value="AMBIGUOUS">AMBIGUOUS</option>
            </select>
          </div>

          {/* Pipeline Status Filter */}
          <div>
            <select
              value={statusPipeline}
              onChange={(e) => {
                setStatusPipeline(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">Semua Status Pipeline</option>
              <option value="PUBLISHED">PUBLISHED (Live)</option>
              <option value="READY_TO_PUBLISH">READY_TO_PUBLISH</option>
              <option value="PENDING_PHOTOS">PENDING_PHOTOS</option>
              <option value="NO_PHOTOS_FOUND">NO_PHOTOS_FOUND</option>
              <option value="ERROR">ERROR</option>
              <option value="AMBIGUOUS">AMBIGUOUS</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Gudang:</span>
              <select
                value={warehouse}
                onChange={(e) => {
                  setWarehouse(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
              >
                <option value="ALL">Semua Hub (GK, BB, SM, BL, ML, RB, PY, PE, WT, ON)</option>
                <option value="GK">GK - Pamulang 2</option>
                <option value="BB">BB - Pamulang 2</option>
                <option value="SM">SM - Pamulang 2</option>
                <option value="BL">BL - Pamulang 2</option>
                <option value="ML">ML - Pamulang Barat</option>
                <option value="RB">RB - Pamulang Barat</option>
                <option value="PY">PY - Setu Tangsel</option>
                <option value="PE">PE - Sawangan Depok</option>
                <option value="WT">WT - Kedaung Tangsel</option>
                <option value="ON">ON - Kedaung Tangsel</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={isDirtyOnly}
                onChange={(e) => {
                  setIsDirtyOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-xs">Hanya Data Dirty (Error/Missing)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
            >
              <option value="10">10 baris</option>
              <option value="25">25 baris</option>
              <option value="50">50 baris</option>
              <option value="100">100 baris</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-3">Foto</th>
                <th className="py-3.5 px-4 min-w-[220px]">Nama Produk & Spesifikasi</th>
                <th className="py-3.5 px-3">Lokasi Gudang</th>
                <th className="py-3.5 px-3">Status Unit</th>
                <th className="py-3.5 px-3">Pipeline</th>
                <th className="py-3.5 px-3 text-right">Harga Estimasi (WA)</th>

                {/* Role-Protected Columns */}
                {permissions?.canViewFloorPrice && (
                  <th className="py-3.5 px-3 text-right text-amber-400 bg-amber-950/20">
                    Floor Price
                  </th>
                )}
                {permissions?.canViewInternalCost && (
                  <th className="py-3.5 px-3 text-right text-purple-400 bg-purple-950/20">
                    Modal (HPP)
                  </th>
                )}
                {permissions?.canViewTelegramLink && (
                  <th className="py-3.5 px-3 text-center text-blue-400">
                    Telegram
                  </th>
                )}

                <th className="py-3.5 px-3 text-center">Aging</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Memuat data inventaris BBKitchen...
                  </td>
                </tr>
              ) : !data?.items || data.items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    Tidak ada unit yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr
                    key={item.SKU}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* SKU */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{item.SKU}</span>
                        {item.IS_DIRTY && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" title="Dirty Data" />
                        )}
                      </div>
                    </td>

                    {/* Thumbnail */}
                    <td className="py-3 px-3">
                      <div className="relative w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                        {item.FEATURED_IMAGE ? (
                          <Image
                            src={item.FEATURED_IMAGE}
                            alt={item.image_alt || item.PRODUCT_TITLE}
                            fill
                            className="object-cover"
                            sizes="48px"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-500">
                            No Pic
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Product Title & Category */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                        {item.PRODUCT_TITLE}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-amber-400/90">{item.CATEGORY_NAME}</span>
                        <span>•</span>
                        <span className="text-slate-400">{item.KONDISI_UNIT}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono">
                        {item.asal_gudang}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.LOKASI_UNIT.split(',')[0]}
                      </div>
                    </td>

                    {/* Status Unit */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={item.STATUS_UNIT} />
                    </td>

                    {/* Pipeline */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <PipelineBadge status={item.STATUS_PIPELINE} />
                    </td>

                    {/* Public Price */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                      {item.HARGA_BUKA_WA != null ? formatIDR(item.HARGA_BUKA_WA) : item.HARGA_ESTIMASI_PUBLIK != null ? formatIDR(item.HARGA_ESTIMASI_PUBLIK) : 'Hubungi kami'}
                    </td>

                    {/* Floor Price (Protected) */}
                    {permissions?.canViewFloorPrice && (
                      <td className="py-3 px-3 text-right font-mono text-amber-300 bg-amber-950/10 whitespace-nowrap">
                        {item.HARGA_FLOOR_WA ? formatIDR(item.HARGA_FLOOR_WA) : '-'}
                      </td>
                    )}

                    {/* Cost COGS (Protected) */}
                    {permissions?.canViewInternalCost && (
                      <td className="py-3 px-3 text-right font-mono text-purple-300 bg-purple-950/10 whitespace-nowrap">
                        {item.HARGA_MODAL ? formatIDR(item.HARGA_MODAL) : <Lock className="w-3.5 h-3.5 inline text-slate-600" />}
                      </td>
                    )}

                    {/* Telegram Source (Protected) */}
                    {permissions?.canViewTelegramLink && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.LINK_TELEGRAM ? (
                          <a
                            href={item.LINK_TELEGRAM}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/80"
                          >
                            <Send className="w-3 h-3" />
                            <span>Channel</span>
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    )}

                    {/* Aging */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {item.DURASI_TERJUAL ? `${item.DURASI_TERJUAL} hr` : '18 hr'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Quick View & Specs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {permissions?.canMarkAsSold && item.STATUS_UNIT !== 'SOLD' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSoldModalItem(item);
                              setDealPriceInput(String(item.HARGA_DEAL_WA || item.HARGA_BUKA_WA || ''));
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-[11px] font-bold transition-colors"
                            title="Tandai Sudah Terjual (Deal)"
                          >
                            Mark Sold
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Menampilkan <span className="font-bold text-slate-200">{(page - 1) * pageSize + 1}</span> -{' '}
              <span className="font-bold text-slate-200">{Math.min(page * pageSize, data.total)}</span> dari{' '}
              <span className="font-bold text-slate-200">{data.total}</span> unit
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-slate-200 px-2">
                Hal {page} dari {data.totalPages}
              </span>

              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/80">
                  {selectedItem.SKU}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  {selectedItem.PRODUCT_TITLE}
                </h2>
                <p className="text-xs text-slate-400">{selectedItem.KONDISI_UNIT} • {selectedItem.LOKASI_UNIT}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Photo Gallery Grid */}
            <div className="grid grid-cols-3 gap-2">
              {(selectedItem.PHOTO_URLS || [selectedItem.FEATURED_IMAGE]).map((url, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-slate-800">
                  <Image
                    src={url}
                    alt={selectedItem.image_alt || 'Unit photo'}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>

            {/* Specifications Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                Spesifikasi Teknis
              </div>
              <div className="divide-y divide-slate-800/60 text-xs">
                {Object.entries(selectedItem.SPESIFIKASI || {}).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-3 px-3 py-2">
                    <span className="text-slate-400">{key}</span>
                    <span className="col-span-2 font-medium text-slate-200">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commercial Data Section */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="text-[11px] text-slate-400">Harga Estimasi / Buka</div>
                <div className="text-sm font-bold text-white font-mono">
                  {formatIDR(selectedItem.HARGA_BUKA_WA || selectedItem.HARGA_ESTIMASI_PUBLIK)}
                </div>
              </div>

              {permissions?.canViewFloorPrice && (
                <div>
                  <div className="text-[11px] text-amber-400">Harga Floor (Batas Bawah)</div>
                  <div className="text-sm font-bold text-amber-300 font-mono">
                    {selectedItem.HARGA_FLOOR_WA ? formatIDR(selectedItem.HARGA_FLOOR_WA) : '-'}
                  </div>
                </div>
              )}

              {permissions?.canViewInternalCost && (
                <div>
                  <div className="text-[11px] text-purple-400">Modal HPP (Rahasia)</div>
                  <div className="text-sm font-bold text-purple-300 font-mono">
                    {selectedItem.HARGA_MODAL ? formatIDR(selectedItem.HARGA_MODAL) : '-'}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <a
                href={`/product/${selectedItem.SKU.toLowerCase()}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Lihat Halaman Publik
              </a>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark As Sold Modal */}
      {soldModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Tandai Unit Terjual (SOLD)
            </h2>
            <p className="text-xs text-slate-400">
              Konfirmasi penjualan untuk SKU <span className="font-mono font-bold text-slate-200">{soldModalItem.SKU}</span>. Sistem akan mencatat tanggal terjual dan durasi hari secara otomatis.
            </p>

            <form onSubmit={handleMarkAsSoldSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Harga Deal Kesepakatan (IDR)
                </label>
                <input
                  type="number"
                  required
                  value={dealPriceInput}
                  onChange={(e) => setDealPriceInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Contoh: 45000000"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Catatan Pembeli / Invoice
                </label>
                <textarea
                  rows={2}
                  value={soldNotesInput}
                  onChange={(e) => setSoldNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Contoh: Deal via WA Sales, dikirim ke Resto BSD"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSoldModalItem(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
                >
                  Simpan Status Terjual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
