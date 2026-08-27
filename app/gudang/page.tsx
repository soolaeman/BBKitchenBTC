import React from 'react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { WAREHOUSE_HUB_DETAILS } from '@/lib/repositories/warehouse-utils';
import {
  MapPin,
  Building2,
  Clock,
  ShieldCheck,
  Zap,
  Phone,
  MessageCircle,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: '5 Lokasi Gudang & Fasilitas Uji Running | Bukan Baru Kitchen Jabodetabek',
  description:
    'Kunjungi 5 hub gudang Bukan Baru Kitchen di Pamulang 2, Pamulang Barat, Setu, Sawangan, dan Kedaung untuk inspeksi fisik dan uji mesin komersial.',
};

export default function WarehousesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            Fasilitas Showroom & Pergudangan
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            5 Hub Gudang Inspeksi Mesin Jabodetabek
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Seluruh unit 2,700+ SKU dapat Anda cek fisik, ukur dimensi, dan uji kelistrikan langsung bersama teknisi kami sebelum transaksi.
          </p>
        </div>

        {/* 5 Hubs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WAREHOUSE_HUB_DETAILS.map((hub, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    Prefix: {hub.codes.join(', ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{hub.name}</h3>
                  <div className="flex items-start gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{hub.address}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <div className="font-semibold text-amber-400 mb-0.5">Spesialisasi Kategori:</div>
                  <div>{hub.specialty}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">Kapasitas: 300 - 1,200 Unit</div>
                <a
                  href={`https://wa.me/6281289000000?text=${encodeURIComponent(
                    `Halo BBKitchen, saya ingin minta panduan rute & share location Google Maps ke ${hub.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Share Loc WA</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* 4 Steps Inspection Protocol */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-white text-center">
            Prosedur Uji Running & Inspeksi Mesin di Gudang
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-amber-400 font-mono text-sm">01. Booking Jadwal</div>
              <p className="text-slate-300">
                Informasikan SKU mesin yang ingin Anda cek via WhatsApp agar tim menyiapkan unit di area test run.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-amber-400 font-mono text-sm">02. Test Running Kelistrikan</div>
              <p className="text-slate-300">
                Hubungkan unit ke panel listrik (1 Phase / 3 Phase) dan pantau kestabilan ampere serta kompresor.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-amber-400 font-mono text-sm">03. Cek Suhu & Fitur</div>
              <p className="text-slate-300">
                Ukur temperatur dengan laser thermometer digital dan cek fungsi tombol digital, steam, atau burner.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-amber-400 font-mono text-sm">04. Terbit Invoice & Kirim</div>
              <p className="text-slate-300">
                Faktur resmi diterbitkan dengan nomor seri mesin tertera, siap dimuat ke armada mobil pickup.
              </p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
