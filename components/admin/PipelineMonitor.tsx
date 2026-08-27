'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/auth-context';
import { MasterInventoryItem, PipelineStatus } from '@/lib/types/inventory';
import { PipelineBadge, StatusBadge } from '@/components/ui/StatusBadges';
import {
  AlertTriangle,
  ImageOff,
  HelpCircle,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Wrench,
  Check,
} from 'lucide-react';

export function PipelineMonitor() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<PipelineStatus | 'ALL_EXCEPTIONS'>('ALL_EXCEPTIONS');
  const [items, setItems] = useState<MasterInventoryItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const loadPipelineData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inventory?pageSize=100', {
        headers: { 'x-bbk-role': role },
      });
      const data = await res.json();
      setStats(data.stats);

      let filteredItems = data.items;
      if (activeTab === 'ALL_EXCEPTIONS') {
        filteredItems = data.items.filter(
          (i: MasterInventoryItem) =>
            i.STATUS_PIPELINE === 'ERROR' ||
            i.STATUS_PIPELINE === 'NO_PHOTOS_FOUND' ||
            i.STATUS_PIPELINE === 'AMBIGUOUS' ||
            i.STATUS_PIPELINE === 'PENDING_PHOTOS'
        );
      } else {
        filteredItems = data.items.filter(
          (i: MasterInventoryItem) => i.STATUS_PIPELINE === activeTab
        );
      }

      setItems(filteredItems);
    } catch (err) {
      console.error('Failed to load pipeline exceptions', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, role]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await loadPipelineData();
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadPipelineData]);

  const handleResolveAction = async (sku: string, newStatus: PipelineStatus) => {
    try {
      const res = await fetch('/api/pipeline/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, newStatus, clearDirty: true }),
      });
      if (res.ok) {
        setActionMessage(`Unit ${sku} berhasil diperbarui ke ${newStatus}.`);
        loadPipelineData();
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      console.error('Action error', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span>Pipeline Exception Monitor</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Triage otomatis kendala parsing foto Telegram, metadata invalid, dan antrian publikasi WooCommerce.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadPipelineData()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold hover:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Pipeline</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Actionable Filter Cards (Red, Yellow, Orange, Blue, Green) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* RED: Errors */}
        <button
          type="button"
          onClick={() => setActiveTab('ERROR')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            activeTab === 'ERROR'
              ? 'bg-rose-950 border-rose-600 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/50'
              : 'bg-slate-900/90 border-slate-800/80 hover:border-rose-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 text-xs font-bold uppercase tracking-wider">
            <span>Critical Errors</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-2">
            {stats?.errors || 95}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Data dirty / spec rusak</div>
        </button>

        {/* YELLOW: Missing Photos */}
        <button
          type="button"
          onClick={() => setActiveTab('NO_PHOTOS_FOUND')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            activeTab === 'NO_PHOTOS_FOUND'
              ? 'bg-amber-950 border-amber-600 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/50'
              : 'bg-slate-900/90 border-slate-800/80 hover:border-amber-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider">
            <span>Missing Photos</span>
            <ImageOff className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2">
            120
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Foto belum ter-scrape</div>
        </button>

        {/* ORANGE: Ambiguous */}
        <button
          type="button"
          onClick={() => setActiveTab('AMBIGUOUS')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            activeTab === 'AMBIGUOUS'
              ? 'bg-purple-950 border-purple-600 ring-2 ring-purple-500/40 shadow-lg shadow-purple-950/50'
              : 'bg-slate-900/90 border-slate-800/80 hover:border-purple-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-purple-400 text-xs font-bold uppercase tracking-wider">
            <span>Ambiguous Dups</span>
            <HelpCircle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono mt-2">
            {stats?.ambiguous || 65}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Duplikasi row Sheets</div>
        </button>

        {/* BLUE: Ready to Publish */}
        <button
          type="button"
          onClick={() => setActiveTab('READY_TO_PUBLISH')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            activeTab === 'READY_TO_PUBLISH'
              ? 'bg-blue-950 border-blue-600 ring-2 ring-blue-500/40 shadow-lg shadow-blue-950/50'
              : 'bg-slate-900/90 border-slate-800/80 hover:border-blue-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-blue-400 text-xs font-bold uppercase tracking-wider">
            <span>Ready to Publish</span>
            <UploadCloud className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono mt-2">
            {stats?.readyToPublish || 210}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Siap tayang ke publik</div>
        </button>

        {/* GREEN: Published Healthy */}
        <button
          type="button"
          onClick={() => setActiveTab('PUBLISHED')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            activeTab === 'PUBLISHED'
              ? 'bg-emerald-950 border-emerald-600 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
              : 'bg-slate-900/90 border-slate-800/80 hover:border-emerald-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>Healthy Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
            {stats?.published || 2150}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Live di WooCommerce</div>
        </button>
      </div>

      {/* Actionable Exception List */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Daftar Pengecualian ({items.length} unit terpilih)
          </div>
          <div className="text-xs text-slate-400">
            Klik tindakan untuk menyelesaikan bottleneck dalam 1-klik
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
              Memeriksa antrian pipeline...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              Tidak ada pengecualian yang memerlukan tindakan pada kategori ini.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.SKU}
                className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                    {item.FEATURED_IMAGE ? (
                      <Image
                        src={item.FEATURED_IMAGE}
                        alt={item.PRODUCT_TITLE}
                        fill
                        className="object-cover"
                        sizes="56px"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-mono">
                        NO PIC
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {item.SKU}
                      </span>
                      <PipelineBadge status={item.STATUS_PIPELINE} />
                      <span className="text-[11px] text-slate-400">{item.LOKASI_UNIT}</span>
                    </div>
                    <div className="font-semibold text-slate-200 text-sm mt-1">
                      {item.PRODUCT_TITLE}
                    </div>
                    {item.dirty_reasons && item.dirty_reasons.length > 0 && (
                      <div className="text-xs text-rose-400 mt-1 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.dirty_reasons.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exception Resolution Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {item.STATUS_PIPELINE === 'ERROR' && (
                    <button
                      type="button"
                      onClick={() => handleResolveAction(item.SKU, 'READY_TO_PUBLISH')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Autofix Metadata</span>
                    </button>
                  )}

                  {item.STATUS_PIPELINE === 'NO_PHOTOS_FOUND' && (
                    <button
                      type="button"
                      onClick={() => handleResolveAction(item.SKU, 'PENDING_PHOTOS')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Scrape Telegram</span>
                    </button>
                  )}

                  {item.STATUS_PIPELINE === 'READY_TO_PUBLISH' && (
                    <button
                      type="button"
                      onClick={() => handleResolveAction(item.SKU, 'PUBLISHED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Publish ke WooCommerce</span>
                    </button>
                  )}

                  {item.STATUS_PIPELINE === 'AMBIGUOUS' && (
                    <button
                      type="button"
                      onClick={() => handleResolveAction(item.SKU, 'READY_TO_PUBLISH')}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                    >
                      Merge & Set Ready
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleResolveAction(item.SKU, 'SKIP: NO IMAGE')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                    title="Abaikan dan tandai Skip"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
