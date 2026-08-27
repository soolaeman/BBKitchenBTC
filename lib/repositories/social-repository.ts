import { SocialContentItem } from '@/lib/types/social';

export const initialSocialContent: SocialContentItem[] = [
  {
    id: 'soc_01',
    topic: 'Unboxing & Test Running Rational Combi Oven 10 Tray',
    channel: 'INSTAGRAM',
    status: 'SCHEDULED',
    caption: 'Combi oven impian para chef resto bintang 5 ready di Hub Pamulang 2! 🔥 Kondisi 95% mulus, siap bikin baking & roasting dapurmu 3x lebih cepat. Booking jadwal inspeksi fisik sekarang via link di bio! #BBKitchen #CombiOvenBekas #PeralatanDapurRestoran',
    relatedSku: 'BBK-GK-COM-0007',
    relatedSkuTitle: 'Rational Combi Oven & Steamer Prima 95%',
    callToAction: 'Cek Unit di Hub Pamulang 2',
    destinationUrl: 'https://bukanbarukitchen.com/product/bbk-gk-com-0007',
    mediaType: 'REEL',
    mediaPreviewUrl: 'https://picsum.photos/seed/soc_reel_oven/600/750',
    scheduledDate: '2026-08-28 16:00',
    assignedCreator: 'Rian Social',
    performanceNotes: 'Target engagement F&B Owner Jabodetabek',
    engagementStats: {
      likes: 0,
      shares: 0,
      saves: 0,
      waInquiries: 0,
    },
  },
  {
    id: 'soc_02',
    topic: 'Tips Memilih Espresso Machine 2 Group Ex-Hotel',
    channel: 'TIKTOK',
    status: 'PUBLISHED',
    caption: 'Mau buka cafe tapi budget mesin kopi terbatas? Ini rahasia hemat modal puluhan juta dengan mesin La Marzocco rekondisi bergaransi ☕✨ #BaristaIndonesia #BukaCafe #MesinKopiBekas',
    relatedSku: 'BBK-PE-COF-0014',
    relatedSkuTitle: 'La Marzocco Linea Classic 2 Group',
    callToAction: 'Chat WhatsApp untuk Video Detail Boiler',
    destinationUrl: 'https://bukanbarukitchen.com/product/bbk-pe-cof-0014',
    mediaType: 'VIDEO',
    mediaPreviewUrl: 'https://picsum.photos/seed/soc_tt_coffee/600/750',
    publishedDate: '2026-08-24',
    assignedCreator: 'Sarah Media',
    performanceNotes: 'Viral di FYP Cafe Owner. Mendatangkan 28 chat WA.',
    engagementStats: {
      likes: 1420,
      shares: 310,
      saves: 580,
      comments: 94,
      waInquiries: 28,
    },
  },
  {
    id: 'soc_03',
    topic: 'Stok Masuk: 12 Unit Meja Stainless Heavy Duty & Sink',
    channel: 'WHATSAPP_STORY',
    status: 'PUBLISHED',
    caption: 'STOK MASUK HUB SETU! Meja stainless AISI 304 tebal 1.2mm ex-hotel lelang. Ukuran 1500mm & 1800mm double tier. Siap kirim hari ini!',
    relatedSku: 'BBK-PY-STA-0012',
    relatedSkuTitle: 'Stainless Worktable 1800x700x850 Double Tier',
    callToAction: 'Reply Story untuk Book Unit',
    destinationUrl: 'https://bukanbarukitchen.com/catalog?category=stainless-fabrication',
    mediaType: 'IMAGE',
    mediaPreviewUrl: 'https://picsum.photos/seed/soc_wa_table/600/750',
    publishedDate: '2026-08-26',
    assignedCreator: 'Soolaeman',
    performanceNotes: 'Broadcasting ke 1,200 kontak database owner resto.',
    engagementStats: {
      likes: 0,
      waInquiries: 14,
    },
  },
  {
    id: 'soc_04',
    topic: 'Google Business Profile Update: Jam Operasional & Layanan Inspeksi',
    channel: 'GOOGLE_BUSINESS',
    status: 'PUBLISHED',
    caption: 'Kunjungi 5 Hub Pergudangan Bukan Baru Kitchen (Pamulang 2, Pamulang Barat, Setu, Sawangan, Kedaung) untuk test running mesin sebelum deal. Garansi servis 30 hari.',
    callToAction: 'Petunjuk Arah & Jadwal Kunjungan',
    destinationUrl: 'https://bukanbarukitchen.com/admin/warehouse',
    mediaType: 'IMAGE',
    mediaPreviewUrl: 'https://picsum.photos/seed/soc_gbp_hub/800/600',
    publishedDate: '2026-08-20',
    assignedCreator: 'Tim SEO',
    performanceNotes: 'Mendapat 320 view profile dan 45 direction request.',
    engagementStats: {
      likes: 0,
      waInquiries: 8,
    },
  },
];

let socialCache: SocialContentItem[] = [...initialSocialContent];

export function getSocialContent(): SocialContentItem[] {
  return socialCache;
}

export function createSocialPost(post: Omit<SocialContentItem, 'id'>): SocialContentItem {
  const item: SocialContentItem = {
    ...post,
    id: `soc_${Date.now()}`,
  };
  socialCache.unshift(item);
  return item;
}

export function updateSocialStatus(id: string, status: SocialContentItem['status']): boolean {
  const item = socialCache.find((s) => s.id === id);
  if (!item) return false;
  item.status = status;
  return true;
}
