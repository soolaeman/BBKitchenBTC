import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Bukan Baru Kitchen | Pusat Peralatan Dapur Komersial Restoran & Cafe',
  description: 'Pusat penjualan 2,700+ unit combi oven, upright chiller, heavy duty stove, dan mesin espresso komersial bergaransi 30 hari di 5 gudang Jabodetabek.',
  openGraph: {
    title: 'Bukan Baru Kitchen | Commercial Kitchen Equipment Hub',
    description: 'Pusat 2,700+ unit peralatan resto & cafe bergaransi 30 hari siap uji running di 5 hub gudang.',
    type: 'website',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
