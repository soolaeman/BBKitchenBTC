import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bukanbarukitchen.com'),
  title: {
    default: 'Bukan Baru Kitchen | Pusat Peralatan Dapur Komersial Restoran & Cafe',
    template: '%s | Bukan Baru Kitchen',
  },
  description:
    'Pusat penjualan 2.750+ unit combi oven, upright chiller, heavy duty stove, meja stainless, dan mesin espresso komersial bergaransi 30 hari di Jabodetabek.',
  keywords: [
    'peralatan dapur restoran bekas',
    'chiller bekas',
    'meja stainless bekas',
    'sink stainless restoran',
    'kompor resto heavy duty',
    'bukan baru kitchen',
  ],
  authors: [{ name: 'Bukan Baru Kitchen' }],
  creator: 'Bukan Baru Kitchen',
  openGraph: {
    title: 'Bukan Baru Kitchen | Commercial Kitchen Equipment Hub',
    description: 'Pusat 2.750+ unit peralatan resto & cafe bergaransi 30 hari siap uji running di 5 hub gudang Jabodetabek.',
    url: 'https://www.bukanbarukitchen.com',
    siteName: 'Bukan Baru Kitchen',
    locale: 'id_ID',
    type: 'website',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Bukan Baru Kitchen',
  description:
    'Pusat penjualan dan lelang peralatan dapur komersial restoran & cafe bekas berkualitas bergaransi di Jabodetabek.',
  url: 'https://www.bukanbarukitchen.com',
  logo: 'https://www.bukanbarukitchen.com/logo.png',
  telephone: '+6281234567890',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Tangerang Selatan',
    addressRegion: 'Banten',
    addressCountry: 'ID',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -6.3475,
    longitude: 106.7112,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '17:00',
    },
  ],
  sameAs: [
    'https://www.instagram.com/bukanbarukitchen',
    'https://www.tiktok.com/@bukanbarukitchen',
  ],
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
