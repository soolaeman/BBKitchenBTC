import { NextResponse } from 'next/server';
import { getMasterInventory } from '@/lib/repositories/inventory-repository';
import { matchCategory } from '@/lib/repositories/warehouse-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categorySlug = '', keyword = '', limit = 4 } = body;

    const inventory = await getMasterInventory();

    // Filter available items
    let matchedItems = inventory.filter(
      (item) => (item.STATUS_UNIT === 'AVAILABLE' || !item.STATUS_UNIT) && (item.HARGA_BUKA_WA || item.HARGA_ESTIMASI_PUBLIK)
    );

    if (categorySlug && categorySlug !== 'all') {
      const target = categorySlug.toLowerCase().replace(/-/g, ' ');
      matchedItems = matchedItems.filter((item) => {
        const itemCat = (item.CATEGORY_NAME || item.CATEGORY_SLUG || '').toLowerCase();
        const itemTitle = (item.PRODUCT_TITLE || '').toLowerCase();
        return (
          itemCat.includes(target) ||
          itemTitle.includes(target) ||
          (item.CATEGORY_SLUG && item.CATEGORY_SLUG.toLowerCase() === categorySlug.toLowerCase())
        );
      });
    }

    if (keyword) {
      const q = keyword.toLowerCase();
      const kwMatches = matchedItems.filter(
        (item) =>
          item.PRODUCT_TITLE.toLowerCase().includes(q) ||
          item.SKU.toLowerCase().includes(q) ||
          (item.YOAST_KEYWORD && item.YOAST_KEYWORD.toLowerCase().includes(q))
      );
      if (kwMatches.length > 0) {
        matchedItems = kwMatches;
      }
    }

    const selected = matchedItems.slice(0, Math.max(1, Math.min(limit, 10)));

    const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bukanbarukitchen.com';

    // Build smart internal links & embedded widgets
    const recommendations = selected.map((item) => {
      const productUrl = item.LINK_UNIT || `${siteBase}/product/${encodeURIComponent(item.SKU.toLowerCase())}`;
      const priceFmt = item.HARGA_BUKA_WA
        ? `Rp ${Number(item.HARGA_BUKA_WA).toLocaleString('id-ID')}`
        : item.HARGA_ESTIMASI_PUBLIK
        ? `Rp ${Number(item.HARGA_ESTIMASI_PUBLIK).toLocaleString('id-ID')}`
        : 'Hubungi CS';

      const hub = item.asal_gudang || item.LOKASI_UNIT || 'Jabodetabek';
      const cleanTitle = item.SEO_TITLE || item.PRODUCT_TITLE;

      const waText = encodeURIComponent(
        `Halo Admin Bukan Baru Kitchen, saya membaca artikel panduan dan tertarik dengan unit ready stock:\n- SKU: ${item.SKU}\n- Produk: ${cleanTitle}\n- Harga: ${priceFmt}\n- Lokasi Hub: ${hub}\n\nApakah unit ini masih ready untuk cek fisik atau test running?`
      );
      const waLink = `https://wa.me/6281234567890?text=${waText}`;

      return {
        sku: item.SKU,
        title: cleanTitle,
        price: priceFmt,
        hub,
        condition: item.KONDISI_UNIT || 'Bekas Siap Pakai (90%)',
        photo: item.FEATURED_IMAGE || item.PHOTO_URLS?.[0] || '',
        productUrl,
        waLink,
        markdownLink: `[${cleanTitle} (${priceFmt} - Hub ${hub})](${productUrl})`,
      };
    });

    return NextResponse.json({
      success: true,
      categorySlug,
      matchedCount: matchedItems.length,
      recommendations,
    });
  } catch (error) {
    console.error('Error injecting product links:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to find matching products' },
      { status: 500 }
    );
  }
}
