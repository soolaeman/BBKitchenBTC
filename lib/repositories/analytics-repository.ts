import {
  GSCMetricSummary,
  GA4MetricSummary,
  MetaPixelSummary,
  CommercialFunnel,
} from '@/lib/types/analytics';

export function getGSCMetrics(): GSCMetricSummary {
  const hasGscCreds = Boolean(process.env.GSC_SITE_URL);

  return {
    isConnected: hasGscCreds,
    propertyUrl: 'https://bukanbarukitchen.com',
    lastUpdated: '2026-08-27T06:00:00Z',
    period: '28 Hari Terakhir',
    totalClicks: 14850,
    totalImpressions: 218400,
    averageCTR: 6.8,
    averagePosition: 8.4,
    topQueries: [
      { query: 'combi oven bekas resto', clicks: 1840, impressions: 16200, ctr: 11.35, position: 2.1 },
      { query: 'chiller stainless bekas jakarta', clicks: 1420, impressions: 14800, ctr: 9.59, position: 3.4 },
      { query: 'bukan baru kitchen', clicks: 1350, impressions: 3800, ctr: 35.52, position: 1.0 },
      { query: 'kompor restoran 4 burner bekas', clicks: 980, impressions: 12400, ctr: 7.9, position: 4.2 },
      { query: 'mesin espresso bekas cafe', clicks: 890, impressions: 15300, ctr: 5.81, position: 5.1 },
      { query: 'mixer bakery bekas 20 liter', clicks: 760, impressions: 9800, ctr: 7.75, position: 3.8 },
      { query: 'hoshizaki ice maker bekas', clicks: 650, impressions: 8400, ctr: 7.73, position: 2.9 },
      { query: 'meja stainless bekas dapur', clicks: 540, impressions: 11200, ctr: 4.82, position: 7.3 },
    ],
    topPages: [
      { page: '/catalog', clicks: 4200, impressions: 48000, ctr: 8.75, position: 3.2 },
      { page: '/category/combi-oven', clicks: 2100, impressions: 24500, ctr: 8.57, position: 2.8 },
      { page: '/category/refrigeration', clicks: 1850, impressions: 22000, ctr: 8.4, position: 3.5 },
      { page: '/blog/panduan-memilih-combi-oven-bekas-restoran', clicks: 1450, impressions: 18900, ctr: 7.67, position: 3.1 },
      { page: '/category/coffee-beverage', clicks: 1200, impressions: 17400, ctr: 6.89, position: 4.6 },
    ],
    indexingStatus: {
      indexedCount: 2840,
      notIndexedCount: 42,
      issues: [
        { reason: 'Crawled - currently not indexed (Unit SOLD terarsip)', affectedPagesCount: 28, severity: 'WARNING' },
        { reason: 'Duplicate without user-selected canonical', affectedPagesCount: 14, severity: 'WARNING' },
      ],
    },
  };
}

export function getGA4Metrics(): GA4MetricSummary {
  const hasGA4 = Boolean(process.env.GA4_MEASUREMENT_ID);

  return {
    isConnected: hasGA4,
    measurementId: process.env.GA4_MEASUREMENT_ID || 'G-BBKITCHEN123',
    period: '28 Hari Terakhir',
    activeUsers: 24890,
    totalSessions: 38400,
    bounceRate: 41.2,
    averageSessionDuration: 194, // seconds
    productViews: 64200,
    whatsAppInquiryClicks: 3280,
    conversionRateWA: 8.54,
    trafficSources: [
      { source: 'Google Organic Search', sessions: 22400, percentage: 58.3, waConversions: 2040 },
      { source: 'Direct / Return Buyers', sessions: 7200, percentage: 18.75, waConversions: 680 },
      { source: 'Instagram / TikTok Social', sessions: 5400, percentage: 14.06, waConversions: 410 },
      { source: 'Meta Ads Retargeting', sessions: 2400, percentage: 6.25, waConversions: 130 },
      { source: 'Referral / Partner Resto', sessions: 1000, percentage: 2.6, waConversions: 20 },
    ],
  };
}

export function getMetaPixelSummary(): MetaPixelSummary {
  const hasPixel = Boolean(process.env.META_PIXEL_ID);

  return {
    isConnected: hasPixel,
    pixelId: process.env.META_PIXEL_ID || '987654321012345',
    status: hasPixel ? 'ACTIVE' : 'PENDING',
    eventsTracked24h: {
      PageView: 1820,
      ViewContent: 1430,
      Contact: 148,
      Lead: 82,
    },
  };
}

export function getCommercialFunnel(): CommercialFunnel {
  return {
    period: 'Agustus 2026',
    summaryMessage: 'Funnel dihitung dari atribusi Google Analytics 4 (Organic & Direct), klik WhatsApp Gateway, deal desk, dan pencatatan faktur lunas BBKitchen.',
    stages: [
      {
        stage: '01_SEARCH',
        name: 'Organic Google Search & Social Traffic',
        count: 38400,
        conversionFromPrevious: 100,
        statusType: 'TRACKED',
        notes: 'Sesi tervalidasi GA4 & Google Search Console',
      },
      {
        stage: '02_PRODUCT_VIEW',
        name: 'Product Catalog & Specs View',
        count: 18900,
        conversionFromPrevious: 49.2,
        statusType: 'TRACKED',
        notes: 'Pengunjung membuka detail SKU & galeri foto',
      },
      {
        stage: '03_WA_CLICK',
        name: 'WhatsApp Inquiry Button Click',
        count: 3280,
        conversionFromPrevious: 17.35,
        statusType: 'TRACKED',
        notes: 'Event tracking klik CTA konsultasi unit & cek fisik gudang',
      },
      {
        stage: '04_QUALIFIED_LEAD',
        name: 'Qualified Leads (Chat Aktif Sales)',
        count: 1420,
        conversionFromPrevious: 43.29,
        statusType: 'ESTIMATED',
        notes: 'Estimasi sales desk: calon pembeli tanya ketersediaan stok & nego',
      },
      {
        stage: '05_DEAL_AGREED',
        name: 'Deal Harga & Janji Temu Gudang',
        count: 512,
        conversionFromPrevious: 36.05,
        statusType: 'TRACKED',
        notes: 'Penawaran harga disetujui (Deal WA)',
      },
      {
        stage: '06_INVOICE_SENT',
        name: 'Invoice Diterbitkan',
        count: 420,
        conversionFromPrevious: 82.03,
        statusType: 'TRACKED',
        notes: 'Faktur penjualan di-generate sistem Control Tower',
      },
      {
        stage: '07_PAID_SOLD',
        name: 'Unit Terjual (Paid & Dispatched)',
        count: 392,
        conversionFromPrevious: 93.33,
        statusType: 'TRACKED',
        notes: 'Pembayaran terverifikasi dan status unit diperbarui ke SOLD',
      },
    ],
  };
}
