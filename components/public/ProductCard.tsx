'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MasterInventoryItem } from '@/lib/types/inventory';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import {
  MapPin,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ProductCardProps {
  item: MasterInventoryItem;
}

export function ProductCard({ item }: ProductCardProps) {
  const waUrl = `https://wa.me/6281289000000?text=${encodeURIComponent(
    `Halo Bukan Baru Kitchen, saya tertarik dengan unit ${item.PRODUCT_TITLE} (SKU: ${item.SKU}) di ${item.LOKASI_UNIT}. Apakah masih tersedia?`
  )}`;

  const conditionColor =
    item.KONDISI_UNIT.includes('A+') || item.KONDISI_UNIT.includes('Grade A')
      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
      : item.KONDISI_UNIT.includes('Rekondisi')
      ? 'bg-blue-950/80 text-blue-300 border-blue-800'
      : 'bg-amber-950/80 text-amber-300 border-amber-800';

  return (
    <div className="group bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-amber-500/5">
      {/* Product Image */}
      <Link href={`/product/${item.SKU}`} className="relative block aspect-[4/3] bg-slate-950 overflow-hidden">
        {item.FEATURED_IMAGE ? (
          <Image
            src={item.FEATURED_IMAGE}
            alt={item.PRODUCT_TITLE}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-600 font-mono">
            Foto Sedang Disiapkan
          </div>
        )}

        {/* Condition Tag */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-md ${conditionColor}`}>
            {item.KONDISI_UNIT}
          </span>
        </div>

        {/* 30-Day Guarantee Tag */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-950/80 text-amber-400 border border-slate-800 flex items-center gap-1 backdrop-blur-md">
            <ShieldCheck className="w-3 h-3" />
            <span>Garansi 30H</span>
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Warehouse location & SKU */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
            <span className="text-amber-400/90 font-bold">{item.SKU}</span>
            <span className="flex items-center gap-1 text-slate-400 truncate max-w-[150px]">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              {item.LOKASI_UNIT.split(',')[0]}
            </span>
          </div>

          {/* Product Title */}
          <Link href={`/product/${item.SKU}`}>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
              {item.PRODUCT_TITLE}
            </h3>
          </Link>

          {/* Specs Snippet */}
          <div className="mt-2 text-[11px] text-slate-400 line-clamp-1">
            {Object.entries(item.SPESIFIKASI || {})
              .slice(0, 2)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' • ')}
          </div>
        </div>

        {/* Price and CTA */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Harga Penawaran:</div>
            <div className="text-base font-black text-amber-400 font-mono">
              {formatIDR(item.HARGA_ESTIMASI_PUBLIK)}
            </div>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-colors shrink-0"
            title="Tanya Unit via WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
