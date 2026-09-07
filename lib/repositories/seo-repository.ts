import {
  SEOAuditReport,
  SEOHealthStatus,
  SEOCheckItem,
  SEOArticle,
  RankTrackItem,
  OffPageSignal,
} from '@/lib/types/seo';
import { MasterInventoryItem } from '@/lib/types/inventory';

/**
 * BBKitchen Internal SEO Quality Scoring Engine
 */
export function auditProductSEO(item: MasterInventoryItem): SEOAuditReport {
  const checks: SEOCheckItem[] = [];
  const keyword = (item.YOAST_KEYWORD || '').toLowerCase().trim();
  const title = item.SEO_TITLE || item.PRODUCT_TITLE || '';
  const metaDesc = item.YOAST_DESCRIPTION || item.SHORT_DESCRIPTION || '';
  const fullContent = item.FULL_DESCRIPTION || '';
  const wordCount = fullContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;

  // 1. SEO Title Check
  const titleHasKeyword = Boolean(keyword && title.toLowerCase().includes(keyword));
  const titleLengthOk = title.length >= 35 && title.length <= 70;
  checks.push({
    key: 'title_optimization',
    label: 'SEO Title Optimization',
    passed: Boolean(titleHasKeyword && titleLengthOk),
    score: titleHasKeyword && titleLengthOk ? 15 : titleHasKeyword ? 10 : 4,
    message: titleLengthOk
      ? `Panjang title ideal (${title.length} karakter) dan ${titleHasKeyword ? 'mengandung' : 'belum mengandung'} keyword target.`
      : `Panjang title (${title.length} karakter) di luar rentang optimal 35-70 karakter.`,
    recommendation: !titleHasKeyword
      ? `Sisipkan keyword fokus "${keyword || 'peralatan resto bekas'}" di awal judul produk.`
      : undefined,
  });

  // 2. Meta Description Check
  const metaHasKeyword = Boolean(keyword && metaDesc.toLowerCase().includes(keyword));
  const metaLengthOk = metaDesc.length >= 110 && metaDesc.length <= 165;
  checks.push({
    key: 'meta_description',
    label: 'Meta Description & Snippet CTR',
    passed: Boolean(metaHasKeyword && metaLengthOk),
    score: metaHasKeyword && metaLengthOk ? 15 : metaHasKeyword ? 10 : 5,
    message: metaLengthOk
      ? `Panjang meta deskripsi (${metaDesc.length} karakter) optimal untuk SERP mobile & desktop.`
      : `Panjang meta deskripsi (${metaDesc.length} karakter) belum optimal (target 110-165 karakter).`,
    recommendation: !metaLengthOk
      ? 'Tambahkan call-to-action WhatsApp dan garansi BBKitchen agar meta description lebih menarik.'
      : undefined,
  });

  // 3. Focus Keyword Density
  const focusDefined = Boolean(keyword && keyword.length > 3);
  checks.push({
    key: 'focus_keyword',
    label: 'Target Focus Keyword (Yoast)',
    passed: focusDefined,
    score: focusDefined ? 10 : 0,
    message: focusDefined
      ? `Focus keyword "${keyword}" terkonfigurasi dengan intent komersial.`
      : 'Focus keyword belum ditentukan pada metadata produk.',
    recommendation: !focusDefined ? 'Tentukan target keyword seperti "[merk] [kategori] bekas".' : undefined,
  });

  // 4. Clean URL / Slug
  const skuSlug = (item.SKU || '').toLowerCase();
  const slugOk = Boolean(skuSlug && !skuSlug.includes(' ') && !skuSlug.includes('?') && skuSlug.length < 50);
  checks.push({
    key: 'slug_structure',
    label: 'Clean Slug & Canonical URL',
    passed: slugOk,
    score: slugOk ? 10 : 5,
    message: slugOk ? `Slug /product/${skuSlug} terstruktur dan canonical valid.` : 'Slug mengandung karakter tidak ramah SEO.',
  });

  // 5. Content Completeness & Specs
  const specsCount = Object.keys(item.SPESIFIKASI || {}).length;
  const contentComplete = wordCount >= 40 && specsCount >= 3;
  checks.push({
    key: 'content_depth',
    label: 'Deskripsi Teknis & Spesifikasi Lengkap',
    passed: contentComplete,
    score: contentComplete ? 15 : 7,
    message: contentComplete
      ? `Deskripsi mencakup ${wordCount} kata dengan ${specsCount} parameter spesifikasi teknis.`
      : `Konten terlalu ringkas (${wordCount} kata). Pembeli restoran butuh data listrik, dimensi, dan material rinci.`,
    recommendation: !contentComplete
      ? 'Lengkapi tabel spesifikasi teknis (daya watt, dimensi, material stainless, voltase).'
      : undefined,
  });

  // 6. Image Alt & Visuals
  const hasAlt = Boolean(item.image_alt && item.image_alt.length > 5);
  const photoCount = Array.isArray(item.PHOTO_URLS) ? item.PHOTO_URLS.length : item.PHOTO_URLS ? 1 : 0;
  const hasMultiplePhotos = photoCount >= 2;
  checks.push({
    key: 'image_seo',
    label: 'Image SEO & Multi-Angle Photos',
    passed: Boolean(hasAlt && hasMultiplePhotos),
    score: hasAlt && hasMultiplePhotos ? 15 : hasAlt ? 10 : 3,
    message: hasAlt && hasMultiplePhotos
      ? `Memiliki ${photoCount} foto dengan tag ALT deskriptif untuk Google Image Search.`
      : 'Foto kurang dari 2 sudut atau tag image alt belum optimal.',
    recommendation: !hasAlt ? 'Isi image alt dengan format "[Merk] [Kategori] Bekas Siap Pakai BBKitchen".' : undefined,
  });

  // 7. Structured Data / Schema Markup
  const schemaOk = Boolean(item.SKU && item.HARGA_ESTIMASI_PUBLIK && item.LOKASI_UNIT);
  checks.push({
    key: 'schema_markup',
    label: 'Schema.org Product & Offer Rich Snippet',
    passed: schemaOk,
    score: schemaOk ? 10 : 0,
    message: schemaOk
      ? 'Schema Product JSON-LD tervalidasi dengan properti SKU, Availability, dan Location.'
      : 'Data penting untuk rich snippet belum lengkap.',
  });

  // 8. Internal Links & Breadcrumbs
  const hasCategory = Boolean(item.CATEGORY_SLUG);
  checks.push({
    key: 'internal_linking',
    label: 'Internal Linking & Category Breadcrumb',
    passed: hasCategory,
    score: hasCategory ? 10 : 4,
    message: hasCategory
      ? `Terhubung ke silang kategori /category/${item.CATEGORY_SLUG} dan hub gudang ${item.LOKASI_UNIT}.`
      : 'Belum ada relasi kategori yang valid.',
  });

  const totalScore = checks.reduce((acc, curr) => acc + curr.score, 0);
  const passedCount = checks.filter((c) => c.passed).length;

  let healthStatus: SEOHealthStatus = 'HEALTHY';
  if (totalScore < 60) {
    healthStatus = 'PROBLEM';
  } else if (totalScore < 85) {
    healthStatus = 'NEEDS_IMPROVEMENT';
  }

  return {
    targetId: item.SKU || 'UNKNOWN-SKU',
    title: item.PRODUCT_TITLE || 'Produk BBKitchen',
    type: 'PRODUCT',
    slug: (item.SKU || '').toLowerCase(),
    healthStatus,
    overallScore: totalScore,
    checks,
    passedCount,
    totalCount: checks.length,
    focusKeyword: item.YOAST_KEYWORD || 'peralatan resto bekas',
    metaDescription: metaDesc,
    h1: item.PRODUCT_TITLE,
    wordCount,
    imageAltPresent: hasAlt,
    internalLinksCount: 3,
    canonicalUrl: `https://bukanbarukitchen.com/product/${(item.SKU || '').toLowerCase()}`,
    schemaValid: schemaOk,
    lastAudited: new Date().toISOString(),
  };
}

/**
 * Generate Schema.org JSON-LD for Google Rich Results
 */
export function buildProductSchemaJsonLd(item: MasterInventoryItem) {
  const images = Array.isArray(item.PHOTO_URLS)
    ? item.PHOTO_URLS
    : item.PHOTO_URLS
    ? [item.PHOTO_URLS]
    : ['https://bukanbarukitchen.com/og-image.jpg'];

  const brandName = item.SPESIFIKASI?.['MERK'] || item.SPESIFIKASI?.['Brand'] || 'Commercial Grade';

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `https://bukanbarukitchen.com/product/${item.SKU.toLowerCase()}#product`,
        name: item.PRODUCT_TITLE,
        sku: item.SKU,
        mpn: item.SKU,
        image: images,
        description: item.SHORT_DESCRIPTION || item.FULL_DESCRIPTION || `${item.PRODUCT_TITLE} bekas komersial bergaransi`,
        brand: {
          '@type': 'Brand',
          name: brandName,
        },
        category: item.CATEGORY_SLUG || 'Kitchen Equipment',
        offers: {
          '@type': 'Offer',
          '@id': `https://bukanbarukitchen.com/product/${item.SKU.toLowerCase()}#offer`,
          url: `https://bukanbarukitchen.com/product/${item.SKU.toLowerCase()}`,
          priceCurrency: 'IDR',
          price: item.HARGA_ESTIMASI_PUBLIK || 0,
          priceValidUntil: '2026-12-31',
          itemCondition: 'https://schema.org/UsedCondition',
          availability: item.STATUS_UNIT === 'READY' || item.STATUS_UNIT === 'AVAILABLE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Bukan Baru Kitchen',
            url: 'https://bukanbarukitchen.com',
          },
          availableAtOrFrom: {
            '@type': 'Place',
            name: `Hub ${item.LOKASI_UNIT || 'BK - BBKitchen (HQ)'}`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Tangerang Selatan',
              addressRegion: 'Banten',
              addressCountry: 'ID',
            },
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `https://bukanbarukitchen.com/product/${item.SKU.toLowerCase()}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://bukanbarukitchen.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: item.CATEGORY_SLUG || 'Equipment',
            item: `https://bukanbarukitchen.com/category/${item.CATEGORY_SLUG || 'all'}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: item.PRODUCT_TITLE,
            item: `https://bukanbarukitchen.com/product/${item.SKU.toLowerCase()}`,
          },
        ],
      },
    ],
  };

  return schema;
}

/**
 * 1-Click Autofix Generator for Yoast Meta & Image Alt
 */
export function generateAutoFixMetadata(item: MasterInventoryItem) {
  const brand = item.SPESIFIKASI?.['MERK'] || item.SPESIFIKASI?.['Brand'] || 'Resto';
  const name = item.PRODUCT_TITLE || 'Peralatan Kitchen';
  const hub = item.LOKASI_UNIT || 'Jabodetabek';
  const priceStr = item.HARGA_ESTIMASI_PUBLIK
    ? `Rp ${item.HARGA_ESTIMASI_PUBLIK.toLocaleString('id-ID')}`
    : 'Harga Spesial';

  const yoastKeyword = `${brand.toLowerCase()} ${name.toLowerCase()} bekas`.slice(0, 50);
  const seoTitle = `${name} ${brand} Bekas Siap Pakai | Bukan Baru Kitchen`.slice(0, 68);
  const yoastDescription = `Jual ${name} ${brand} bekas bergaransi. Kondisi prima terinspeksi teknisi BBKitchen di Hub ${hub}. ${priceStr}. Konsultasi WA siap kirim Jabodetabek.`.slice(0, 160);
  const imageAlt = `${name} ${brand} Bekas Komersial Hub ${hub} BBKitchen`;

  return {
    yoastKeyword,
    seoTitle,
    yoastDescription,
    imageAlt,
  };
}

/**
 * SERP Rank Tracking Dataset for Google.co.id
 */
/**
 * SERP Rank Tracking Dataset for Google.co.id (Official Categories)
 */
export const initialRankings: RankTrackItem[] = [
  {
    id: 'rk_01',
    keyword: 'meja stainless bekas restoran jabodetabek',
    position: 1,
    prevPosition: 2,
    impressions30d: 3890,
    clicks30d: 412,
    ctr: '10.59%',
    landingPage: 'https://bukanbarukitchen.com/product-category/meja-stainless',
    searchEngine: 'Google.co.id (Mobile)',
    rankingChange: 'UP',
  },
  {
    id: 'rk_02',
    keyword: 'sink stainless cuci piring restoran bekas',
    position: 2,
    prevPosition: 3,
    impressions30d: 2940,
    clicks30d: 265,
    ctr: '9.01%',
    landingPage: 'https://bukanbarukitchen.com/product-category/sink-stainless',
    searchEngine: 'Google.co.id (Mobile)',
    rankingChange: 'UP',
  },
  {
    id: 'rk_03',
    keyword: 'kompor resto heavy duty bekas kwali range',
    position: 1,
    prevPosition: 2,
    impressions30d: 3750,
    clicks30d: 380,
    ctr: '10.13%',
    landingPage: 'https://bukanbarukitchen.com/product-category/kompor',
    searchEngine: 'Google.co.id (Mobile)',
    rankingChange: 'UP',
  },
  {
    id: 'rk_04',
    keyword: 'chiller undercounter upright bekas resto',
    position: 2,
    prevPosition: 4,
    impressions30d: 4400,
    clicks30d: 390,
    ctr: '8.86%',
    landingPage: 'https://bukanbarukitchen.com/product-category/chiller',
    searchEngine: 'Google.co.id (Mobile)',
    rankingChange: 'UP',
  },
  {
    id: 'rk_05',
    keyword: 'chest freezer upright freezer bekas restoran',
    position: 3,
    prevPosition: 3,
    impressions30d: 2180,
    clicks30d: 174,
    ctr: '7.98%',
    landingPage: 'https://bukanbarukitchen.com/product-category/freezer',
    searchEngine: 'Google.co.id (Mobile)',
    rankingChange: 'STABLE',
  },
  {
    id: 'rk_06',
    keyword: 'showcase cake display 2 pintu bekas cafe',
    position: 2,
    prevPosition: 5,
    impressions30d: 2650,
    clicks30d: 245,
    ctr: '9.25%',
    landingPage: 'https://bukanbarukitchen.com/product-category/showcase',
    searchEngine: 'Google.co.id (Mobile)',
    rankingChange: 'UP',
  },
  {
    id: 'rk_07',
    keyword: 'rak stainless susun 4 tier bekas',
    position: 1,
    prevPosition: 2,
    impressions30d: 1950,
    clicks30d: 198,
    ctr: '10.15%',
    landingPage: 'https://bukanbarukitchen.com/product-category/rak-stainless',
    searchEngine: 'Google.co.id (Mobile)',
    rankingChange: 'UP',
  },
  {
    id: 'rk_08',
    keyword: 'exhaust hood stainless ducting resto bekas',
    position: 2,
    prevPosition: 3,
    impressions30d: 1820,
    clicks30d: 162,
    ctr: '8.90%',
    landingPage: 'https://bukanbarukitchen.com/product-category/hood-stainless',
    searchEngine: 'Google.co.id (Mobile)',
    rankingChange: 'UP',
  },
  {
    id: 'rk_09',
    keyword: 'mesin ice maker bekas cube scotsman',
    position: 2,
    prevPosition: 3,
    impressions30d: 1650,
    clicks30d: 145,
    ctr: '8.78%',
    landingPage: 'https://bukanbarukitchen.com/product-category/ice-system',
    searchEngine: 'Google.co.id (Mobile)',
    rankingChange: 'UP',
  },
  {
    id: 'rk_10',
    keyword: 'peralatan dapur restoran bekas lelang jabodetabek',
    position: 1,
    prevPosition: 1,
    impressions30d: 5890,
    clicks30d: 680,
    ctr: '11.54%',
    landingPage: 'https://bukanbarukitchen.com/jual-barang-bekas-restoran',
    searchEngine: 'Google.co.id (Mobile)',
    rankingChange: 'STABLE',
  },
];

/**
 * Off-Page Backlink Signals & Local Citations
 */
export const initialOffPageSignals: OffPageSignal[] = [
  {
    id: 'op_01',
    sourceDomain: 'detik.com/food',
    sourceType: 'MEDIA_CULINARY',
    targetUrl: 'https://bukanbarukitchen.com/jual-barang-bekas-restoran',
    anchorText: 'platform kurasi alat resto Bukan Baru Kitchen',
    domainAuthority: 84,
    dateDiscovered: '2026-08-18',
    status: 'ACTIVE',
  },
  {
    id: 'op_02',
    sourceDomain: 'pergikuliner.com/blog',
    sourceType: 'MEDIA_CULINARY',
    targetUrl: 'https://bukanbarukitchen.com/product-category/chiller',
    anchorText: 'suplier chiller cafe bekas bergaransi',
    domainAuthority: 68,
    dateDiscovered: '2026-08-20',
    status: 'ACTIVE',
  },
  {
    id: 'op_03',
    sourceDomain: 'google.com/maps (Hub Pamulang 2)',
    sourceType: 'CITATIONS_LOCAL',
    targetUrl: 'https://bukanbarukitchen.com',
    anchorText: 'Gudang Pusat BBKitchen Pamulang 2 Tangsel',
    domainAuthority: 95,
    dateDiscovered: '2026-08-24',
    status: 'ACTIVE',
  },
  {
    id: 'op_04',
    sourceDomain: 'google.com/maps (Hub Sawangan)',
    sourceType: 'CITATIONS_LOCAL',
    targetUrl: 'https://bukanbarukitchen.com/product-category/meja-stainless',
    anchorText: 'Hub Sawangan Depok - Meja Stainless & Sink',
    domainAuthority: 95,
    dateDiscovered: '2026-08-26',
    status: 'ACTIVE',
  },
];

// Initial SEO Article Pipeline Records
export const initialArticles: SEOArticle[] = [
  {
    id: 'art_01',
    title: 'Panduan Memilih Meja & Sink Stainless Steel Standar Dapur Restoran',
    slug: 'panduan-memilih-meja-sink-stainless-restoran',
    targetKeyword: 'meja stainless bekas restoran',
    secondaryKeywords: ['sink cuci piring stainless', 'meja kerja stainless 304', 'harga meja stainless bekas'],
    searchIntent: 'COMMERCIAL',
    stage: 'PUBLISHED',
    author: 'Tim Teknis BBKitchen',
    assignedTo: 'Soolaeman',
    excerpt: 'Simak 5 parameter krusial memilih meja stainless susun dan sink cuci piring komersial tahan beban berat untuk operasional dapur resto.',
    content: 'Meja stainless steel adalah tulang punggung operasional dapur restoran dan cafe...',
    featuredImage: 'https://picsum.photos/seed/bbk_art_meja/800/500',
    relatedCategorySlug: 'meja-stainless',
    relatedSkus: ['BBK-GK-MEJ-0001', 'BBK-PE-MEJ-0004'],
    yoastTitle: 'Panduan Beli Meja Stainless Bekas Restoran Bergaransi | BBKitchen',
    yoastMetaDesc: 'Ingin beli meja stainless bekas berkualitas hemat 50%? Simak panduan ketebalan plat, tipe 304 vs 201, dan cek fisik di gudang BBKitchen.',
    wordCount: 1250,
    internalLinksCount: 6,
    gscClicks30d: 342,
    gscImpressions30d: 4890,
    gscPosition: 2.4,
    publishedDate: '2026-08-10',
    updatedAt: '2026-08-25',
  },
  {
    id: 'art_02',
    title: 'Perbedaan Chiller Undercounter vs Upright untuk Efisiensi Dapur Resto',
    slug: 'perbedaan-chiller-undercounter-vs-upright',
    targetKeyword: 'chiller undercounter bekas',
    secondaryKeywords: ['upright chiller bekas jakarta', 'kulkas resto stainless', 'chiller hoshizaki bekas'],
    searchIntent: 'INFORMATIONAL',
    stage: 'INDEXED',
    author: 'Chief Engineer BBK',
    assignedTo: 'Rian Content',
    excerpt: 'Mengapa undercounter chiller cocok untuk prep-line dan upright untuk bulk storage? Simak panduan efisiensi watt dan kapasitas.',
    content: 'Dalam memilih lemari pendingin komersial...',
    featuredImage: 'https://picsum.photos/seed/bbk_art_ref/800/500',
    relatedCategorySlug: 'chiller',
    relatedSkus: ['BBK-ML-CHI-0021'],
    yoastTitle: 'Chiller Undercounter vs Upright untuk Restoran | Analisa Dapur BBK',
    yoastMetaDesc: 'Jangan salah pilih chiller dapur restoran. Pelajari perbedaan kapasitas, penempatan space-saving, dan suhu stabil kompresor.',
    wordCount: 1380,
    internalLinksCount: 7,
    gscClicks30d: 285,
    gscImpressions30d: 3600,
    gscPosition: 3.1,
    publishedDate: '2026-08-15',
    updatedAt: '2026-08-26',
  },
  {
    id: 'art_03',
    title: 'Standar Kelistrikan & Gas untuk Kompor Restoran Heavy Duty Kwali Range',
    slug: 'standar-kelistrikan-gas-kompor-restoran',
    targetKeyword: 'kompor resto heavy duty bekas',
    secondaryKeywords: ['kompor wok kwali range', 'kompor 4 tungku oven bekas', 'nayati gas range'],
    searchIntent: 'COMMERCIAL',
    stage: 'DRAFT',
    author: 'Soolaeman',
    assignedTo: 'Soolaeman',
    excerpt: 'Instalasi pipa gas LPG medium-pressure, burner ring blower, dan peredam panas dinding dapur restoran.',
    content: 'Draf konten teknis persiapan instalasi kompor kwali range dan open burner...',
    featuredImage: 'https://picsum.photos/seed/bbk_art_cook/800/500',
    relatedCategorySlug: 'kompor',
    relatedSkus: ['BBK-SM-KOM-0028'],
    yoastTitle: 'Tips Instalasi Gas Kompor Heavy Duty Restoran | BBKitchen',
    yoastMetaDesc: 'Panduan aman pasang kompor restoran kwali range ex-hotel dengan regulator dan pipa standar keselamatan.',
    wordCount: 850,
    internalLinksCount: 4,
    publishedDate: undefined,
    updatedAt: '2026-08-27',
  },
  {
    id: 'art_04',
    title: 'Solusi Paket Peralatan Dapur Program Makan Bergizi Gratis (MBG)',
    slug: 'paket-dapur-mbg-200-jutaan',
    targetKeyword: 'solusi peralatan dapur mbg',
    secondaryKeywords: ['paket dapur mbg', 'peralatan masak skala besar', 'dapur spm mbg'],
    searchIntent: 'TRANSACTIONAL',
    stage: 'KEYWORD',
    author: 'Marketing BBK',
    assignedTo: 'Tim SEO',
    excerpt: 'Rangkuman estimasi modal pembukaan coffee shop dengan mesin kopi komersial rekondisi bergaransi.',
    content: 'Brief outline artikel riset harga pasar mesin kopi 2026...',
    featuredImage: 'https://picsum.photos/seed/bbk_art_coffee/800/500',
    relatedCategorySlug: 'coffee-beverage',
    relatedSkus: ['BBK-PE-COF-0014'],
    yoastTitle: 'Harga Mesin Espresso 2 Group Bekas Cafe 2026 | Bukan Baru Kitchen',
    yoastMetaDesc: 'Cari mesin kopi espresso 2 group bekas? Lihat perbandingan harga La Marzocco, Nuova Simonelli, dan Sanremo siap pakai.',
    wordCount: 320,
    internalLinksCount: 2,
    publishedDate: undefined,
    updatedAt: '2026-08-27',
  },
];

let articlesCache: SEOArticle[] = [...initialArticles];

export function getSEOArticles(): SEOArticle[] {
  return articlesCache;
}

export function addNewArticle(newArt: Partial<SEOArticle>): SEOArticle {
  const id = `art_${Date.now()}`;
  const article: SEOArticle = {
    id,
    title: newArt.title || 'Artikel Baru',
    slug: newArt.slug || newArt.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'artikel-baru',
    targetKeyword: newArt.targetKeyword || '',
    secondaryKeywords: newArt.secondaryKeywords || [],
    searchIntent: newArt.searchIntent || 'INFORMATIONAL',
    stage: newArt.stage || 'IDEA',
    author: newArt.author || 'Tim BBKitchen',
    assignedTo: newArt.assignedTo || 'Tim Editorial',
    excerpt: newArt.excerpt || '',
    content: newArt.content || '',
    featuredImage: newArt.featuredImage || 'https://picsum.photos/seed/bbk_new_art/800/500',
    relatedCategorySlug: newArt.relatedCategorySlug || 'general',
    relatedSkus: newArt.relatedSkus || [],
    yoastTitle: newArt.yoastTitle || `${newArt.title} | Bukan Baru Kitchen`,
    yoastMetaDesc: newArt.yoastMetaDesc || newArt.excerpt || '',
    wordCount: newArt.content ? newArt.content.split(/\s+/).filter(Boolean).length : 0,
    internalLinksCount: (newArt.relatedSkus || []).length + 2,
    publishedDate: newArt.stage === 'PUBLISHED' ? new Date().toISOString().split('T')[0] : undefined,
    updatedAt: new Date().toISOString().split('T')[0],
  };

  articlesCache = [article, ...articlesCache];
  return article;
}

export function updateArticleStage(id: string, stage: SEOArticle['stage']): boolean {
  const art = articlesCache.find((a) => a.id === id);
  if (!art) return false;
  art.stage = stage;
  art.updatedAt = new Date().toISOString().split('T')[0];
  if (stage === 'PUBLISHED' && !art.publishedDate) {
    art.publishedDate = new Date().toISOString().split('T')[0];
  }
  return true;
}
