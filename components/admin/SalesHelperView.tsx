'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export function SalesHelperView() {
  const { role, permissions } = useAuth();
  const [skuQuery, setSkuQuery] = useState('');
  const [searchedItem, setSearchedItem] = useState<MasterInventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quotePrice, setQuotePrice] = useState<number | ''>('');
  const [buyerName, setBuyerName] = useState('');
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuQuery.trim()) return;

    setIsLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/inventory?search=${encodeURIComponent(skuQuery.trim())}&pageSize=1`, {
        headers: { 'x-bbk-role': role },
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        setSearchedItem(item);
        setQuotePrice(item.HARGA_BUKA_WA || item.HARGA_ESTIMASI_PUBLIK);
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

    const priceText = quotePrice ? formatIDR(Number(quotePrice)) : formatIDR(searchedItem.HARGA_BUKA_WA || searchedItem.HARGA_ESTIMASI_PUBLIK);
    const greeting = buyerName ? `Halo Kak ${buyerName}, terima kasih sudah menghubungi Bukan Baru Kitchen.` : 'Halo Kak, terima kasih sudah menghubungi Bukan Baru Kitchen.';

    const specsList = Object.entries(searchedItem.SPESIFIKASI || {})
      .slice(0, 5)
      .map(([k, v]) => `• *${k}:* ${v}`)
      .join('\n');

    return `${greeting}

Berikut informasi detail unit komersial yang Kakak minati:

📌 *${searchedItem.PRODUCT_TITLE}*
• *SKU Unit:* ${searchedItem.SKU}
• *Kondisi:* ${searchedItem.KONDISI_UNIT}
• *Lokasi Gudang:* ${searchedItem.LOKASI_UNIT}
• *Garansi:* 30 Hari Servis BBKitchen (Teknisi Jabodetabek)

📋 *Spesifikasi Teknis:*
${specsList}

💰 *Penawaran Harga:* ${priceText} (Nego Tipis / Siap Test Running)

Kakak bisa langsung datang inspeksi fisik dan test run mesin di gudang kami di ${searchedItem.LOKASI_UNIT.split(',')[0]}.

Boleh kami jadwalkan kunjungan atau mau kami kirimkan video kondisi unit saat menyala? Terima kasih! 🙏`;
  };

  const copyToClipboard = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Guardrail check
  const isBelowFloor = permissions.canViewFloorPrice &&
    searchedItem?.HARGA_FLOOR_WA &&
    quotePrice &&
    Number(quotePrice) < searchedItem.HARGA_FLOOR_WA;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-amber-500" />
          <span>Sales Helper & Deal Desk</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Generator pesan penawaran WhatsApp siap kirim, validasi spesifikasi teknis, dan proteksi harga floor.
        </p>
      </div>

      {/* SKU Lookup Box */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <input
              type="text"
              value={skuQuery}
              onChange={(e) => setSkuQuery(e.target.value)}
              placeholder="Masukkan SKU (contoh: BBK-GK-COM-0007) atau nama mesin..."
              className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-colors shrink-0 disabled:opacity-50"
          >
            {isLoading ? 'Mencari...' : 'Cari Unit'}
          </button>
        </form>

        {notFound && (
          <div className="mt-3 text-xs text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Unit tidak ditemukan. Coba ketik &quot;combi&quot; atau &quot;BBK-GK-COM-0007&quot;.</span>
          </div>
        )}
      </div>

      {/* Deal Helper Canvas */}
      {searchedItem && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Product Spec & Commercial Guardrail */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                {searchedItem.FEATURED_IMAGE ? (
                  <Image
                    src={searchedItem.FEATURED_IMAGE}
                    alt={searchedItem.PRODUCT_TITLE}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/80">
                  {searchedItem.SKU}
                </span>
                <h2 className="text-base font-bold text-white mt-1">
                  {searchedItem.PRODUCT_TITLE}
                </h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  {searchedItem.KONDISI_UNIT} • {searchedItem.LOKASI_UNIT}
                </div>
              </div>
            </div>

            {/* Price Quote Config */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Kalkulator Penawaran (Deal Desk)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nama Calon Pembeli (Opsional)</label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Contoh: Chef Hendra / Pak Budi"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Harga Buka / Penawaran (IDR)</label>
                  <input
                    type="number"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Guardrail Warning */}
              {isBelowFloor && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">PERINGATAN GUARDRAIL:</span> Harga tawaran{' '}
                    <span className="font-mono">{formatIDR(Number(quotePrice))}</span> berada di bawah Floor Price minimum{' '}
                    <span className="font-mono">{formatIDR(searchedItem.HARGA_FLOOR_WA!)}</span>. Butuh approval Admin / Founder.
                  </div>
                </div>
              )}

              {/* Commercial Secrets (Role protected) */}
              {permissions.canViewFloorPrice && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Floor Price (Batas Bawah):</span>
                  <span className="text-amber-400 font-bold">
                    {searchedItem.HARGA_FLOOR_WA ? formatIDR(searchedItem.HARGA_FLOOR_WA) : '-'}
                  </span>
                </div>
              )}
            </div>

            {/* Specifications list */}
            <div className="text-xs space-y-1 text-slate-300">
              <div className="font-bold text-slate-400 uppercase text-[11px] mb-2">Spesifikasi Unit:</div>
              {Object.entries(searchedItem.SPESIFIKASI || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-medium text-slate-200">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Copyable WhatsApp Pitch Preview */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Format Pesan WhatsApp (Clean Pitch)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300/90 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                {generateWhatsAppMessage()}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">Siap dikirimkan ke calon pembeli.</span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(generateWhatsAppMessage())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Buka di WhatsApp Web</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
