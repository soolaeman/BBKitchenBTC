export interface SalesHelperProduct {
  id: number; sku: string; name: string; slug: string; category: string; status: string;
  condition: string; location: string; summary: string; images: string[]; telegramUrl: string | null;
  pricing: { modal: number; buka: number; deal: number; floor: number } | null;
}

type WooProduct = {
  id: number; name: string; slug: string; sku?: string; price?: string; short_description?: string;
  description?: string; images?: { src?: string }[]; categories?: { name?: string }[];
  stock_status?: string; meta_data?: { key: string; value: unknown }[];
};

const env = (key: string) => process.env[key]?.trim() || '';
const normalize = (value: string) => value.toLowerCase().trim().replace(/[\\s-]+/g, '_');
const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim();

function meta(product: WooProduct, keys: string[]) {
  const wanted = keys.map(normalize);
  const found = product.meta_data?.find((entry) => wanted.includes(normalize(entry.key)));
  return found?.value == null ? '' : String(found.value).trim();
}

function pricing(modal: number) {
  if (!modal || modal <= 0) return null;
  let buka = 0, deal = 0, floor = 0;
  if (modal < 1000000) {
    buka = modal + Math.max(150000, Math.round((modal * 0.35) / 1000) * 1000);
    deal = modal + Math.max(100000, Math.round((modal * 0.25) / 1000) * 1000);
    floor = modal + Math.max(75000, Math.round((modal * 0.15) / 1000) * 1000);
  } else if (modal <= 4000000) {
    buka = modal + 750000; deal = modal + 500000; floor = modal + 300000;
  } else if (modal <= 10000000) {
    buka = modal + Math.max(1200000, Math.round((modal * 0.25) / 10000) * 10000);
    deal = modal + Math.max(800000, Math.round((modal * 0.18) / 10000) * 10000);
    floor = modal + Math.max(500000, Math.round((modal * 0.10) / 10000) * 10000);
  } else {
    buka = modal + Math.max(2500000, Math.round((modal * 0.15) / 10000) * 10000);
    deal = modal + Math.max(1800000, Math.round((modal * 0.10) / 10000) * 10000);
    floor = modal + Math.max(1000000, Math.round((modal * 0.06) / 10000) * 10000);
  }
  return { modal, buka: Math.round(buka), deal: Math.round(deal), floor: Math.round(floor) };
}

export async function getSalesHelperProducts(input: { q?: string; sku?: string }): Promise<SalesHelperProduct[]> {
  const search = input.q?.trim() || '';
  const explicitSku = input.sku?.trim() || '';
  const normalized = search.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isUnitCode = normalized.length >= 4 && /^BBK[0-9]+$/.test(normalized);
  const configuredUrl = env('WORDPRESS_URL') || 'https://bukanbarukitchen.com';
  const baseUrl = configuredUrl.endsWith('/') ? configuredUrl.slice(0, -1) : configuredUrl;
  const key = env('WOOCOMMERCE_CONSUMER_KEY');
  const secret = env('WOOCOMMERCE_CONSUMER_SECRET');
  const auth = Buffer.from(key + ':' + secret).toString('base64');
  const params = new URLSearchParams({ status: 'publish', per_page: '30' });
  if (isUnitCode) params.set('sku', normalized);
  else if (search) params.set('search', search);
  if (explicitSku && !isUnitCode) params.set('sku', explicitSku);

  const response = await fetch(baseUrl + '/wp-json/wc/v3/products?' + params.toString(), {
    headers: { Accept: 'application/json', Authorization: 'Basic ' + auth, 'User-Agent': 'BBKitchenBTC/1.0' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('WooCommerce product lookup failed: ' + response.status);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];

  return (data as WooProduct[]).map((product) => {
    const modal = Number(product.price || 0);
    return {
      id: product.id,
      sku: meta(product, ['kode_unit']) || product.sku || 'BBK-' + product.id,
      name: stripHtml(product.name || ''), slug: product.slug || '',
      category: product.categories?.[0]?.name?.trim() || 'Semua',
      status: meta(product, ['status_unit']) || product.stock_status || 'READY',
      condition: meta(product, ['kondisi_unit']) || 'Bekas Original',
      location: meta(product, ['lokasi_unit']) || 'Tidak tercantum',
      summary: stripHtml(product.short_description || '') || stripHtml(product.description || ''),
      images: (product.images || []).map((image) => image.src || '').filter(Boolean),
      telegramUrl: meta(product, ['link_telegram']) || null,
      pricing: pricing(Number.isFinite(modal) ? modal : 0),
    };
  });
}
