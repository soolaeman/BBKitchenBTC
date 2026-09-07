'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Link2,
  Wrench,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building,
  DollarSign,
  X,
  Loader2,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatIDR, resolveLocationFromCode, WAREHOUSE_13_HUBS } from '@/lib/repositories/warehouse-utils';
import { OFFICIAL_CATEGORIES } from '@/lib/repositories/categories';
import { MasterInventoryItem } from '@/lib/types/inventory';

export interface NonSkuResolveItem {
  invoiceId: string;
  invoiceNumber: string;
  customSku: string;
  productTitle: string;
  sellingPrice: number;
  quantity: number;
  currentModal?: number;
  isNonSku?: boolean;
}

interface ResolveNonSkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: NonSkuResolveItem | null;
}

export function ResolveNonSkuModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: ResolveNonSkuModalProps) {
  const [resolveMode, setResolveMode] = useState<'LINK_SKU' | 'CUSTOM_MODAL'>('LINK_SKU');
  
  // Link to SKU state
  const [inventoryList, setInventoryList] = useState<MasterInventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [searchSku, setSearchSku] = useState('');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [selectedTargetItem, setSelectedTargetItem] = useState<MasterInventoryItem | null>(null);

  // Custom Modal state
  const [customHppModal, setCustomHppModal] = useState<string>('');
  const [customHub, setCustomHub] = useState<string>('ML');
  const [customCategory, setCustomCategory] = useState<string>('MEJA STAINLESS');
  const [vendorBengkel, setVendorBengkel] = useState<string>('Bengkel Fabrikasi Stainless');
  const [customNotes, setCustomNotes] = useState<string>('');

  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-detect category & default hub from item when opened
  useEffect(() => {
    if (item?.productTitle) {
      const title = item.productTitle.toLowerCase();
      if (/showcase/i.test(title)) setCustomCategory('SHOWCASE');
      else if (/chiller/i.test(title)) setCustomCategory('CHILLER');
      else if (/freezer/i.test(title)) setCustomCategory('FREEZER');
      else if (/fryer|kompor|wok|kwali|oven/i.test(title)) setCustomCategory('KOMPOR & COOKING');
      else if (/meja/i.test(title)) setCustomCategory('MEJA STAINLESS');
      else if (/sink|wastafel/i.test(title)) setCustomCategory('SINK STAINLESS');
      else if (/rak|wallshelf|troli/i.test(title)) setCustomCategory('RAK STAINLESS');
      else if (/hood|exhaust|blower/i.test(title)) setCustomCategory('HOOD STAINLESS & VENTILASI');
      else if (/ice/i.test(title)) setCustomCategory('ICE SYSTEM');
    }
  }, [item]);

  // Fetch inventory items when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSelectedTargetItem(null);
      setSearchSku('');
      setCustomHppModal('');
      setErrorMessage('');
      setSuccessMessage('');
      return;
    }

    let isCancelled = false;
    async function fetchInventory() {
      setIsLoadingInventory(true);
      try {
        const res = await fetch('/api/inventory?pageSize=500');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.items) {
            setInventoryList(data.items);
          }
        }
      } catch (err) {
        console.error('Failed to load inventory for SKU matching', err);
      } finally {
        if (!isCancelled) setIsLoadingInventory(false);
      }
    }

    fetchInventory();
    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Filter inventory candidates based on 13 Hubs & Search query
  const filteredInventory = useMemo(() => {
    return inventoryList.filter((inv) => {
      // 13 Hub filter
      if (selectedHub !== 'ALL') {
        const code = (inv.asal_gudang || '').toUpperCase().trim();
        const sku = (inv.SKU || '').toUpperCase().trim();
        const loc = (inv.LOKASI_UNIT || '').toUpperCase().trim();

        const hubObj = WAREHOUSE_13_HUBS.find((h) => h.code === selectedHub);
        const hubGroup = (hubObj?.hubGroup || '').toUpperCase();

        const matchesHubCode =
          code === selectedHub ||
          sku.startsWith(`${selectedHub}-`) ||
          sku.startsWith(`BBK-${selectedHub}-`) ||
          sku.includes(`-${selectedHub}-`);

        const matchesLoc = hubGroup && loc.includes(hubGroup);

        if (!matchesHubCode && !matchesLoc) return false;
      }

      // Search text filter
      if (searchSku.trim()) {
        const q = searchSku.toLowerCase().trim();
        const matchesSku = inv.SKU.toLowerCase().includes(q);
        const matchesTitle = inv.PRODUCT_TITLE.toLowerCase().includes(q);
        const matchesNotes = (inv.SHORT_DESCRIPTION || inv.CATEGORY_NAME || '').toLowerCase().includes(q);
        return matchesSku || matchesTitle || matchesNotes;
      }

      return true;
    }).slice(0, 30); // Max 30 candidates for performance
  }, [inventoryList, selectedHub, searchSku]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (resolveMode === 'LINK_SKU') {
        if (!selectedTargetItem) {
          throw new Error('Silakan pilih salah satu SKU target dari stok gudang.');
        }

        const res = await fetch('/api/finance/resolve-non-sku', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceNumber: item.invoiceNumber,
            skuTemp: item.customSku,
            itemTitle: item.productTitle,
            action: 'LINK_EXISTING',
            targetSku: selectedTargetItem.SKU,
            notes: `Resolved & Linked to ${selectedTargetItem.SKU} by Admin`,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal menautkan SKU.');
        }

        setSuccessMessage(`Berhasil menautkan ke ${selectedTargetItem.SKU}. Unit otomatis ditandai SOLD di Master Inventory.`);
      } else {
        const cleanModalNum = Number(customHppModal.replace(/[^0-9]/g, ''));
        if (cleanModalNum <= 0) {
          throw new Error('Masukkan nominal HPP Modal / Biaya Bengkel yang valid (lebih dari Rp 0).');
        }

        const selectedHubObj = WAREHOUSE_13_HUBS.find((h) => h.code === customHub);
        const hubLocationName = selectedHubObj ? selectedHubObj.hubLocation : 'BENGKEL FABRIKASI EKSTERNAL';

        const res = await fetch('/api/finance/resolve-non-sku', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceNumber: item.invoiceNumber,
            skuTemp: item.customSku,
            itemTitle: item.productTitle,
            action: 'SET_CUSTOM_MODAL',
            hppModal: cleanModalNum,
            vendorBengkel: vendorBengkel.trim() || 'Bengkel Fabrikasi Stainless',
            notes: customNotes.trim(),
            warehouseCode: customHub,
            hubLocation: hubLocationName,
            category: customCategory,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal menyimpan transaksi Non-SKU.');
        }

        setSuccessMessage('HPP Modal, Hub Gudang & Kategori WooCommerce berhasil disimpan ke TRANSAKSI_NON_SKU.');
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Rekonsiliasi Item Non-SKU</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                  {item.customSku}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Faktur #{item.invoiceNumber} • {item.productTitle} ({formatIDR(item.sellingPrice)})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Mode Resolusi */}
        <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950/50 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setResolveMode('LINK_SKU')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                resolveMode === 'LINK_SKU'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>1. Tautkan ke Stok SKU Gudang</span>
            </button>

            <button
              type="button"
              onClick={() => setResolveMode('CUSTOM_MODAL')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                resolveMode === 'CUSTOM_MODAL'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>2. Tetapkan Non-SKU / Fabrikasi</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs flex-1 overflow-y-auto">
          
          {/* Notification Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: LINK EXISTING SKU */}
          {resolveMode === 'LINK_SKU' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-indigo-300 text-[11px] leading-relaxed">
                <span className="font-bold">💡 Petunjuk:</span> Jika pesanan ini sebenarnya adalah unit fisik yang sudah ada di gudang, pilih SKU di bawah. Invoice akan diperbarui dan status unit di <code>MASTER_INVENTORY</code> otomatis berubah menjadi <strong>SOLD</strong>.
              </div>

              {/* Warehouse Hub Filter Buttons: 13 Hubs */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Filter 13 Hub Gudang Asal:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Pilih hub untuk mempersempit stok</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-950/80 border border-slate-800/80 rounded-xl max-h-24 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedHub('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      selectedHub === 'ALL'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Semua Gudang
                  </button>
                  {WAREHOUSE_13_HUBS.map((hub) => (
                    <button
                      key={hub.code}
                      type="button"
                      onClick={() => setSelectedHub(hub.code)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        selectedHub === hub.code
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title={`${hub.name} (${hub.hubLocation})`}
                    >
                      {hub.code} - {hub.partnerName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik SKU (misal: GK-012, BB-045, ML-001) atau nama mesin..."
                  value={searchSku}
                  onChange={(e) => setSearchSku(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              {/* Inventory Candidate List */}
              <div className="max-h-52 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800/80 bg-slate-950/60">
                {isLoadingInventory ? (
                  <div className="p-6 text-center text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Memuat stok katalog unit 13 gudang...</span>
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    Tidak ditemukan unit yang cocok di gudang terpilih.
                  </div>
                ) : (
                  filteredInventory.map((inv) => {
                    const isSelected = selectedTargetItem?.SKU === inv.SKU;
                    return (
                      <div
                        key={inv.SKU}
                        onClick={() => setSelectedTargetItem(inv)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-950/70 border-l-4 border-indigo-500'
                            : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400 text-xs">{inv.SKU}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                              {inv.LOKASI_UNIT || resolveLocationFromCode(inv.asal_gudang || 'GK')}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              inv.STATUS_UNIT === 'READY'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {inv.STATUS_UNIT}
                            </span>
                          </div>
                          <div className="text-slate-200 font-medium line-clamp-1">{inv.PRODUCT_TITLE}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-slate-400">HPP Modal:</div>
                          <div className="font-mono font-bold text-emerald-400">
                            {inv.HARGA_MODAL ? formatIDR(inv.HARGA_MODAL) : 'Belum diisi'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected SKU Banner */}
              {selectedTargetItem && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-medium">
                      Ditautkan ke: <strong>{selectedTargetItem.SKU}</strong> ({selectedTargetItem.PRODUCT_TITLE})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    Modal: {formatIDR(selectedTargetItem.HARGA_MODAL || 0)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: CUSTOM NON-SKU / WORKSHOP FABRICATION */}
          {resolveMode === 'CUSTOM_MODAL' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-emerald-300 text-[11px] leading-relaxed">
                <span className="font-bold">💡 Petunjuk:</span> Untuk barang custom/fabrikasi las/order khusus yang tidak mengambil stok gudang fisik, masukkan estimasi atau realisasi biaya bengkel, asal Hub dan kategori WooCommerce di sini. Data akan disimpan ke Sheet <code>TRANSAKSI_NON_SKU</code> dan laba langsung tercatat di Financials.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* HPP Modal Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Biaya Modal Bengkel / HPP Riil (Rp) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={customHppModal}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCustomHppModal(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>

                {/* Vendor / Bengkel Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nama Bengkel Fabrikasi / Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bengkel Las Sawangan / Pak Budi"
                    value={vendorBengkel}
                    onChange={(e) => setVendorBengkel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                </div>

                {/* Hub Asal Gudang */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hub / Gudang Asal: <span className="text-rose-400">*</span></span>
                  </label>
                  <select
                    value={customHub}
                    onChange={(e) => setCustomHub(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-semibold"
                  >
                    {WAREHOUSE_13_HUBS.map((hub) => (
                      <option key={hub.code} value={hub.code}>
                        {hub.code} - {hub.name} ({hub.hubLocation})
                      </option>
                    ))}
                    <option value="BENGKEL_CUSTOM">BENGKEL EKSTERNAL / FABRIKASI KHUSUS</option>
                  </select>
                </div>

                {/* Kategori Unit WooCommerce */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kategori Unit WooCommerce: <span className="text-rose-400">*</span></span>
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-semibold"
                  >
                    {OFFICIAL_CATEGORIES.map((group) => (
                      <optgroup key={group.slug} label={group.name}>
                        <option value={group.name}>{group.name} (Utama)</option>
                        {group.children.map((child) => (
                          <option key={child.slug} value={child.name}>
                            &nbsp;&nbsp;↳ {child.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Profit preview calculation */}
              {customHppModal && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Harga Jual Invoice: </span>
                    <span className="font-mono font-bold text-amber-400">{formatIDR(item.sellingPrice * (item.quantity || 1))}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="text-slate-400">Estimasi Laba Kotor: </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatIDR(
                        Math.max(
                          0,
                          item.sellingPrice * (item.quantity || 1) - Number(customHppModal.replace(/[^0-9]/g, ''))
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Catatan / Spesifikasi Custom (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan ukuran custom, ketebalan stainless 201/304, pengelasan, dll..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (resolveMode === 'LINK_SKU' && !selectedTargetItem)}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                resolveMode === 'LINK_SKU'
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Rekonsiliasi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{resolveMode === 'LINK_SKU' ? 'Konfirmasi Tautkan SKU' : 'Simpan HPP Non-SKU'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
