import React from 'react';
import Link from 'next/link';
import { ChefHat, MapPin, Phone, Mail, ShieldCheck, Clock, Heart } from 'lucide-react';
import { WAREHOUSE_HUB_DETAILS } from '@/lib/repositories/warehouse-utils';

export function PublicFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: About & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                <ChefHat className="w-5 h-5" />
              </div>
              <span className="text-base font-black tracking-tight text-white">
                BUKAN BARU <span className="text-amber-400">KITCHEN</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Pusat penjualan peralatan dapur komersial restoran, hotel, cafe, dan bakery bekas berkualitas di Indonesia. Telah melalui 12 titik uji mekanikal & kelistrikan teknisi profesional.
            </p>
            <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Garansi Servis Resmi 30 Hari</span>
            </div>
          </div>

          {/* Col 2: Kategori Peralatan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Kategori Populer</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/catalog?category=Combi%20Oven" className="hover:text-amber-400 transition-colors">
                  Combi Oven 6, 10, 20 Tray
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Commercial%20Refrigeration" className="hover:text-amber-400 transition-colors">
                  Upright Chiller & Undercounter Freezer
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Cooking%20Equipment" className="hover:text-amber-400 transition-colors">
                  Heavy Duty Burner Range & Deep Fryer
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Coffee%20%26%20Espresso" className="hover:text-amber-400 transition-colors">
                  Mesin Espresso Commercial 2 Group
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=Bakery%20%26%20Pastry" className="hover:text-amber-400 transition-colors">
                  Planetary & Spiral Mixer 20L-60L
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: 5 Hub Lokasi Gudang */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">5 Lokasi Gudang</h4>
            <ul className="space-y-2 text-[11px]">
              {WAREHOUSE_HUB_DETAILS.map((hub) => (
                <li key={hub.name} className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-200 font-semibold">{hub.name}</span>: {hub.address}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Layanan & Kontak */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Kontak & Inspeksi</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200 font-mono">0812-8900-BBK (WhatsApp)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Senin - Sabtu: 08.30 - 17.30 WIB</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>sales@bukanbarukitchen.com</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-block text-[11px] text-slate-500 hover:text-amber-400 border border-slate-800 rounded px-2 py-1"
              >
                Karyawan & Investor Portal →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © 2026 Bukan Baru Kitchen (PT Bukan Baru Kuliner Indonesia). Seluruh hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/catalog" className="hover:text-slate-400">Katalog</Link>
            <Link href="/gudang" className="hover:text-slate-400">Gudang</Link>
            <Link href="/articles" className="hover:text-slate-400">Blog SEO</Link>
            <Link href="/admin" className="hover:text-slate-400">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
