'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Lock,
  Printer,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building,
} from 'lucide-react';

export function ReportingCenter() {
  const { role, permissions } = useAuth();
  const [reportType, setReportType] = useState<'OWNER' | 'MANAGEMENT' | 'INVESTOR'>('OWNER');
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'>('MONTHLY');

  // If user is INVESTOR role, default view is strictly INVESTOR report
  const effectiveReportType = role === 'INVESTOR' ? 'INVESTOR' : reportType;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-500" />
            <span>Executive & Investor Reporting Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Laporan formal periodik dengan adaptasi hak akses (Owner, Manajemen Operasional, dan Investor).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e: any) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200"
          >
            <option value="DAILY">Harian (Daily Standup)</option>
            <option value="WEEKLY">Mingguan (Weekly Ops)</option>
            <option value="MONTHLY">Bulanan (Monthly P&L)</option>
            <option value="QUARTERLY">Kuartal (Q3 2026 Board)</option>
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector (Restricted for Investor role) */}
      {role !== 'INVESTOR' && (
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setReportType('OWNER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              effectiveReportType === 'OWNER'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Owner Executive Report
          </button>
          <button
            type="button"
            onClick={() => setReportType('MANAGEMENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              effectiveReportType === 'MANAGEMENT'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Management & Ops Report
          </button>
          <button
            type="button"
            onClick={() => setReportType('INVESTOR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              effectiveReportType === 'INVESTOR'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Investor Report (Privacy Safe)
          </button>
        </div>
      )}

      {/* 1. OWNER REPORT */}
      {effectiveReportType === 'OWNER' && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                Owner Report • Periode {period} (Agustus 2026)
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Laporan Strategis & Keputusan Bisnis Founder
              </h2>
            </div>
            <div className="text-right text-xs text-slate-400">
              Generated: 27 Agustus 2026 • Confidential
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Total Revenue YTD</div>
              <div className="text-xl font-black text-emerald-400 font-mono mt-1">Rp 14,85 Miliar</div>
              <div className="text-[11px] text-emerald-500 mt-0.5">+14.2% vs target</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Gross Margin Laba Kotor</div>
              <div className="text-xl font-black text-amber-400 font-mono mt-1">35.4% (Rp 5,27 M)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Floor margin terjaga</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Total Unit Terjual</div>
              <div className="text-xl font-black text-blue-400 font-mono mt-1">392 Unit</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Avg 22 hari per unit</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Nilai Stok di Gudang</div>
              <div className="text-xl font-black text-purple-400 font-mono mt-1">Rp 38,45 Miliar</div>
              <div className="text-[11px] text-slate-400 mt-0.5">2,358 unit aktif</div>
            </div>
          </div>

          {/* Operational Decisions Required Section */}
          <div className="p-5 bg-amber-950/30 border border-amber-800/60 rounded-xl space-y-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Decisions Required by Owner (3 Tindakan Strategis)</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>
                <strong>Ekspansi Kapasitas Hub Pamulang 2:</strong> Okupansi telah mencapai 85%. Rekomendasi sewa tambahan gudang sayap barat untuk menampung lelang 80 unit combi oven hotel bintang 5.
              </li>
              <li>
                <strong>Otorisasi Deal Khusus Klien Korporasi:</strong> Restoran Bebek Kaleyo mengajukan nego paket 12 unit fryer gas & range kompor dengan margin 23% (dibawah standar floor 25%).
              </li>
              <li>
                <strong>Penghapusan SKU Rusak Permanen:</strong> 8 unit display lelang ex-2025 perlu di-write off atau dilelang kiloan part cadangan.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 2. MANAGEMENT REPORT */}
      {effectiveReportType === 'MANAGEMENT' && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                Management Operations Report • Periode {period}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Laporan Kinerja Operasional & Eksekusi Lapangan
              </h2>
            </div>
            <div className="text-right text-xs text-slate-400">
              Distribusi: Tim Gudang, QC & Sales Lead
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white uppercase text-[11px]">Inventaris & QC Gudang</div>
              <div className="text-slate-300">• 2,750 Total Unit di database</div>
              <div className="text-slate-300">• 95 Unit terjaring di filter exception (Foto / spec rusak)</div>
              <div className="text-slate-300">• Kecepatan QC rata-rata: 14 menit per unit</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white uppercase text-[11px]">Sales & Deal Desk WhatsApp</div>
              <div className="text-slate-300">• 3,280 Klik tombol konsultasi WA publik</div>
              <div className="text-slate-300">• 1,420 Chat prospek aktif ditangani sales</div>
              <div className="text-slate-300">• Konversi lead ke deal deal WA: 36.05%</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white uppercase text-[11px]">Pemasaran & Organik SEO</div>
              <div className="text-slate-300">• 14,850 Clicks dari Google Search Organik</div>
              <div className="text-slate-300">• 2,840 Halaman produk & kategori terindeks</div>
              <div className="text-slate-300">• 4 Artikel pilar siap publish ke WordPress</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. INVESTOR REPORT (STRICT PRIVACY - NO TELEGRAM, NO SUPPLIER, NO INDIVIDUAL COST) */}
      {effectiveReportType === 'INVESTOR' && (
        <div className="bg-slate-900/80 border border-purple-900/40 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                  Investor Portal Report • Privacy Hardened
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Supplier & Telegram Anonymized
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-2">
                Bukan Baru Kitchen — Executive Business Briefing & Financials
              </h2>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">
              Q3 2026 Investor Edition
            </div>
          </div>

          {/* Aggregated Commercial Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Total GMV Penjualan</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">Rp 14,85 M</div>
              <div className="text-[11px] text-slate-400 mt-0.5">392 Transaksi Selesai</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Gross Margin Usaha</div>
              <div className="text-2xl font-black text-purple-400 font-mono mt-1">35.4%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Laba kotor Rp 5,27 M</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Inventory Turnover</div>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">22 Hari</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Rata-rata per unit</div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Nilai Aset Stok Fisik</div>
              <div className="text-2xl font-black text-blue-400 font-mono mt-1">Rp 38,45 M</div>
              <div className="text-[11px] text-slate-400 mt-0.5">5 Hub Jabodetabek</div>
            </div>
          </div>

          {/* High level business narrative */}
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Pertumbuhan Bisnis & Model Unit Economics
            </h3>
            <p>
              Bukan Baru Kitchen beroperasi sebagai platform penyedia peralatan dapur komersial rekondisi dan lelang hotel/restoran terkemuka di Indonesia. Model bisnis menghasilkan margin kotor konsisten di atas 35% dengan rata-rata kecepatan perputaran stok (turnover) 22 hari sejak unit masuk ke gudang.
            </p>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider pt-2">
              2. Efisiensi Akuisisi Pelanggan (CAC & SEO Moat)
            </h3>
            <p>
              Lebih dari 58% transaksi berasal dari kanal pencarian organik Google Indonesia tanpa beban iklan berbayar yang signifikan. Melalui arsitektur SEO programatik 2,700+ SKU dan artikel pilar teknis, BBKitchen menguasai posisi 1-5 untuk kata kunci komersial dapur restoran di Jabodetabek.
            </p>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider pt-2">
              3. Peluang Pertumbuhan & Mitigasi Risiko
            </h3>
            <p>
              <strong>Peluang:</strong> Ekspansi layanan sewa peralatan (kitchen leasing) dan program garansi perpanjangan berkala untuk jaringan cafe waralaba.
              <br />
              <strong>Mitigasi Risiko:</strong> Standarisasi 12 titik inspeksi teknis BBKitchen menjamin tingkat komplain retur di bawah 1.5%.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
