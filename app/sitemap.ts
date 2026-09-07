import { MetadataRoute } from 'next';
import { OFFICIAL_CATEGORIES } from '@/lib/repositories/categories';
import { getMasterInventory } from '@/lib/repositories/inventory-repository';
import { getSEOArticles } from '@/lib/repositories/seo-repository';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bukanbarukitchen.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Static Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/katalog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/jual-barang-bekas-restoran`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/jual-unit`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/solusi-peralatan-dapur-mbg`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/articles`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // 2. 10 Official Categories & 38 Sub-categories
  const categoryPages: MetadataRoute.Sitemap = [];
  for (const group of OFFICIAL_CATEGORIES) {
    categoryPages.push({
      url: `${BASE_URL}/product-category/${group.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    });

    for (const child of group.children) {
      categoryPages.push({
        url: `${BASE_URL}/product-category/${child.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  // 3. Articles
  const articles = getSEOArticles();
  const articlePages: MetadataRoute.Sitemap = articles.map((art) => ({
    url: `${BASE_URL}/articles/${art.slug}`,
    lastModified: art.updatedAt ? new Date(art.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  // 4. Products (Active / Available SKUs)
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const inventory = await getMasterInventory();
    const activeItems = inventory.filter(
      (item) => item.STATUS_UNIT === 'AVAILABLE' || !item.STATUS_UNIT
    );

    productPages = activeItems.slice(0, 5000).map((item) => ({
      url: `${BASE_URL}/product/${encodeURIComponent(item.SKU.toLowerCase())}`,
      lastModified: item.TANGGAL_MASUK ? new Date(item.TANGGAL_MASUK) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (err) {
    console.warn('Failed to load inventory for sitemap:', err);
  }

  return [...staticPages, ...categoryPages, ...articlePages, ...productPages];
}
