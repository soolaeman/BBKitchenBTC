'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/auth-context';
import { MasterInventoryItem } from '@/lib/types/inventory';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import {
  MessageSquare,
  Search,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Send,
  AlertCircle,
  Download,
  Flame,
  Clock,
  MapPin,
  RefreshCw,
  ImageIcon,
  Share2,
} from 'lucide-react';

export function SalesHelperView() {
  const { role, permissions } = useAuth();
  const [skuQuery, setSkuQuery] = useState('');
  const [searchedItem, setSearchedItem] = useState<MasterInventoryItem | null>(null);
  const [recentItems, setRecentItems] = useState<MasterInventoryItem[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [quotePrice, setQuotePrice] = useState<number | ''>('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load recent available items that have WooCommerce Product IDs for fast 1-click selection
  const fetchRecent = useCallback(async () => {
    setIsLoadingRecent(true);
    try {
      const res = await fetch('/api/inventory?pageSize=8&statusUnit=READY&hasProductId=true&sortBy=TANGGAL_MASUK&sortOrder=desc', {
        headers: { ...(role ? { 'x-bbk-role': role } : {}) },
      });
      const data = await res.json();
      if (data.items) {
        setRecentItems(data.items);
        if (!searchedItem && data.items.length > 0) {
          selectItem(data.items[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load recent items', e);
    } finally {
      setIsLoadingRecent(false);
    }
  }, [role, searchedItem]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const selectItem = (item: MasterInventoryItem) => {
    setSearchedItem(item);
    setQuotePrice(item.HARGA_BUKA_WA || item.HARGA_ESTIMASI_PUBLIK || '');
    setNotFound(false);
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuQuery.trim()) return;

    setIsLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/inventory?search=${encodeURIComponent(skuQuery.trim())}&pageSize=1`, {
        headers: { ...(role ? { 'x-bbk-role': role } : {}) },
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        selectItem(data.items[0]);
      } else {
        setSearchedItem(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error('Failed lookup', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate clean WhatsApp pitch template
  const generateWhatsAppMessage = () => {
    if (!searchedItem) return '';

    const priceText = quotePrice
      ? formatIDR(Number(quotePrice))
      : formatIDR(searchedItem.HARGA_BUKA_WA || searchedItem.HARGA_ESTIMASI_PUBLIK);

    const greeting = buyerName
      ? `Halo Kak ${buyerName}, terima kasih sudah menghubungi Bukan Baru Kitchen! 🙏`
      : 'Halo Kak, terima kasih sudah menghubungi Bukan Baru Kitchen! 🙏';

    const cleanTitle = searchedItem.PRODUCT_TITLE
      .replace(/%%title%%|%%sep%%|%%sitename%%/gi, '')
      .replace(/[-|–]\s*BBKitchen.*/gi, '')
      .trim();

    const slug = cleanTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');

    const publicUrl = searchedItem.LINK_UNIT || `https://www.bukanbarukitchen.com/shop/${slug}/`;

    const specsList = Object.entries(searchedItem.SPESIFIKASI || {})
      .slice(0, 4)
      .map(([k, v]) => `• *${k}:* ${v}`)
      .join('\n');

    return `${greeting}

Berikut informasi detail unit yang sedang *READY* hari ini di gudang:

📌 *${cleanTitle}*
• *Kode SKU:* ${searchedItem.SKU}
• *Kondisi Fisik:* ${searchedItem.KONDISI_UNIT || 'Bekas Siap Pakai'}
• *Lokasi Gudang:* ${searchedItem.LOKASI_UNIT || 'Pamulang 2, Tangsel'}
• *Hasil Uji QC:* 100% Normal Siap Pakai
${specsList ? `\n📋 *Spesifikasi:*\n${specsList}\n` : ''}
💰 *Penawaran Khusus:* ${priceText} *(Nego Halus)*
🔗 *Foto & Katalog Web:* ${publicUrl}

💡 *Kunjungan Fisik / Video Call:*
Kakak bisa datang langsung cek fisik dan test running mesin di gudang kami (${searchedItem.LOKASI_UNIT.split(',')[0]}), atau mau kami kirimkan video uji fungsi unitnya Kak?

_Stok cepat berputar, segera amankan unit sebelum diambil resto lain!_`;
  };

  const copyToClipboard = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const copyPublicLink = () => {
    if (!searchedItem) return;
    const cleanTitle = searchedItem.PRODUCT_TITLE.replace(/[-|–]\s*BBKitchen.*/gi, '').trim();
    const slug = cleanTitle.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-');
    const url = searchedItem.LINK_UNIT || `https://www.bukanbarukitchen.com/shop/${slug}/`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Guardrail check
  const isBelowFloor =
    permissions.canViewFloorPrice &&
    searchedItem?.HARGA_FLOOR_WA &&
    quotePrice &&
    Number(quotePrice) < searchedItem.HARGA_FLOOR_WA;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            <span>Quick Sales & WA Dispatcher</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-800">
              Sprint 2A Live
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Alat tempur harian sales: 1-klik buat format penawaran WA, cek ketersediaan di Telegram, dan unduh foto unit.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchRecent()}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors self-start sm:self-auto"
          title="Refresh Unit Terbaru"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingRecent ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick Recent Carousel / Grid */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Pilih Cepat Unit Ready Terbaru (Klik untuk Load)</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">{recentItems.length} Unit</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {recentItems.map((item) => (
            <button
              key={item.SKU}
              type="button"
              onClick={() => selectItem(item)}
              className={`p-2 rounded-xl border text-left transition-all ${
                searchedItem?.SKU === item.SKU
                  ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="relative aspect-square w-full rounded-lg bg-slate-900 overflow-hidden mb-1.5">
                {item.FEATURED_IMAGE ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.FEATURED_IMAGE}
                    alt={item.PRODUCT_TITLE}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-600">
                    No Pic
                  </div>
                )}
              </div>
              <div className="text-[11px] font-mono font-bold text-amber-400 truncate">{item.SKU}</div>
              <div className="text-[10px] text-slate-300 truncate">{item.PRODUCT_TITLE}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SKU Lookup Box */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <input
              type="text"
              value={skuQuery}
              onChange={(e) => setSkuQuery(e.target.value)}
              placeholder="Cari SKU spesifik (contoh: BBK2766, GK-1045) atau nama alat dapur..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-colors shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Mencari...' : 'Cari Unit'}</span>
          </button>
        </form>

        {notFound && (
          <div className="mt-3 text-xs text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Unit tidak ditemukan. Periksa kembali SKU atau kata kunci yang dimasukkan.</span>
          </div>
        )}
      </div>

      {/* Deal Helper Canvas */}
      {searchedItem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Spec & Telegram Verification (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            {/* Header info */}
            <div className="flex items-start gap-3">
              <div className="relative w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                {searchedItem.FEATURED_IMAGE ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={searchedItem.FEATURED_IMAGE}
                    alt={searchedItem.PRODUCT_TITLE}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/80">
                    {searchedItem.SKU}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {searchedItem.asal_gudang}
                  </span>
                  {searchedItem.PRODUCT_ID && searchedItem.PRODUCT_ID !== '0' && searchedItem.PRODUCT_ID !== '' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono border border-blue-800">
                      Woo #{searchedItem.PRODUCT_ID}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono border border-rose-800">
                      Belum Ada ID Woo
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-white mt-1 line-clamp-2">
                  {searchedItem.PRODUCT_TITLE}
                </h2>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{searchedItem.LOKASI_UNIT}</span>
                </div>
              </div>
            </div>

            {/* Verification Links Bar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {searchedItem.LINK_TELEGRAM ? (
                <a
                  href={searchedItem.LINK_TELEGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 text-xs font-bold transition-colors"
                  title="Verifikasi keaslian dan status langsung di grup Telegram gudang"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Cek Telegram</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 text-slate-600 border border-slate-800 text-xs font-bold cursor-not-allowed"
                >
                  <span>No Telegram Link</span>
                </button>
              )}

              <button
                type="button"
                onClick={copyPublicLink}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-colors"
                title="Salin Link Web Publik"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link Web'}</span>
              </button>
            </div>

            {/* Photo Gallery with Direct Download / Preview */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Foto Unit ({searchedItem.PHOTO_URLS?.length || 1} Foto)</span>
                <span className="text-[10px] text-slate-500 font-normal">Klik foto untuk buka original</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(searchedItem.PHOTO_URLS?.length ? searchedItem.PHOTO_URLS : [searchedItem.FEATURED_IMAGE]).map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-lg bg-slate-950 border border-slate-800 overflow-hidden hover:border-amber-500 transition-colors group"
                  >
                    {url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">
                        No Pic
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ExternalLink className="w-3.5 h-3.5 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Price Quote Config */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Kalkulator Penawaran (Deal Desk)</span>
                {searchedItem.HARGA_BUKA_WA && (
                  <span className="text-[11px] font-mono text-emerald-400 font-normal">
                    Buka: {formatIDR(searchedItem.HARGA_BUKA_WA)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Nama Pembeli</label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Chef Hendra"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">No. WA Pembeli (Opsional)</label>
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Harga Buka (IDR)</label>
                  <input
                    type="number"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Guardrail Warning */}
              {isBelowFloor && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">PERINGATAN FLOOR:</span> Tawaran{' '}
                    <span className="font-mono">{formatIDR(Number(quotePrice))}</span> di bawah Floor Price{' '}
                    <span className="font-mono">{formatIDR(searchedItem.HARGA_FLOOR_WA!)}</span>.
                  </div>
                </div>
              )}

              {/* Floor price confidential */}
              {permissions.canViewFloorPrice && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Floor Price (Batas Bawah Nego):</span>
                  <span className="text-amber-400 font-bold">
                    {searchedItem.HARGA_FLOOR_WA ? formatIDR(searchedItem.HARGA_FLOOR_WA) : '-'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Copyable WhatsApp Pitch Preview (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Format Pesan WhatsApp (Siap Kirim ke Pembeli)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Pesan WA'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300/90 whitespace-pre-wrap leading-relaxed max-h-[440px] overflow-y-auto selection:bg-emerald-800">
                {generateWhatsAppMessage()}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 text-center sm:text-left">
                Kirim teks beserta foto unit ke WhatsApp calon pembeli.
              </span>
              <a
                href={(() => {
                  const text = encodeURIComponent(generateWhatsAppMessage());
                  if (buyerPhone.trim()) {
                    let cleanPhone = buyerPhone.replace(/[^0-9]/g, '');
                    if (cleanPhone.startsWith('0')) {
                      cleanPhone = '62' + cleanPhone.slice(1);
                    }
                    return `https://wa.me/${cleanPhone}?text=${text}`;
                  }
                  return `https://wa.me/?text=${text}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{buyerPhone.trim() ? `Kirim ke ${buyerPhone}` : 'Kirim via WhatsApp (Pilih Kontak)'}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
