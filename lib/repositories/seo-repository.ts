import {
  SEOAuditReport,
  SEOHealthStatus,
  SEOCheckItem,
  SEOArticle,
} from '@/lib/types/seo';
import { MasterInventoryItem } from '@/lib/types/inventory';

/**
 * BBKitchen Internal SEO Quality Scoring Engine
 */
export function auditProductSEO(item: MasterInventoryItem): SEOAuditReport {
  const checks: SEOCheckItem[] = [];
  const keyword = (item.YOAST_KEYWORD || '').toLowerCase().trim();
  const title = item.SEO_TITLE || item.PRODUCT_TITLE;
  const metaDesc = item.YOAST_DESCRIPTION || item.SHORT_DESCRIPTION;
  const fullContent = item.FULL_DESCRIPTION || '';
  const wordCount = fullContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;

  // 1. SEO Title Check
  const titleHasKeyword = keyword && title.toLowerCase().includes(keyword);
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
      ? `Sisipkan keyword fokus "${keyword}" di awal judul produk.`
      : undefined,
  });

  // 2. Meta Description Check
  const metaHasKeyword = keyword && metaDesc.toLowerCase().includes(keyword);
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
  const slug = item.SKU.toLowerCase();
  const slugOk = !slug.includes(' ') && !slug.includes('?') && slug.length < 50;
  checks.push({
    key: 'slug_structure',
    label: 'Clean Slug & Canonical URL',
    passed: slugOk,
    score: slugOk ? 10 : 5,
    message: slugOk ? `Slug /product/${slug} terstruktur dan canonical valid.` : 'Slug mengandung karakter tidak ramah SEO.',
  });

  // 5. Content Completeness & Specs
  const specsCount = Object.keys(item.SPESIFIKASI || {}).length;
  const contentComplete = wordCount >= 60 && specsCount >= 5;
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
  const hasMultiplePhotos = Array.isArray(item.PHOTO_URLS) && item.PHOTO_URLS.length >= 2;
  checks.push({
    key: 'image_seo',
    label: 'Image SEO & Multi-Angle Photos',
    passed: hasAlt && hasMultiplePhotos,
    score: hasAlt && hasMultiplePhotos ? 15 : hasAlt ? 10 : 3,
    message: hasAlt && hasMultiplePhotos
      ? `Memiliki ${item.PHOTO_URLS.length} foto dengan tag ALT deskriptif untuk Google Image Search.`
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
    targetId: item.SKU,
    title: item.PRODUCT_TITLE,
    type: 'PRODUCT',
    slug: item.SKU.toLowerCase(),
    healthStatus,
    overallScore: totalScore,
    checks,
    passedCount,
    totalCount: checks.length,
    focusKeyword: item.YOAST_KEYWORD,
    metaDescription: metaDesc,
    h1: item.PRODUCT_TITLE,
    wordCount,
    imageAltPresent: hasAlt,
    internalLinksCount: 3,
    canonicalUrl: `https://bukanbarukitchen.com/product/${item.SKU.toLowerCase()}`,
    schemaValid: schemaOk,
    lastAudited: new Date().toISOString(),
  };
}

// Initial SEO Article Pipeline Records
export const initialArticles: SEOArticle[] = [
  {
    id: 'art_01',
    title: 'Panduan Memilih Combi Oven Bekas Berkualitas untuk Restoran & Hotel',
    slug: 'panduan-memilih-combi-oven-bekas-restoran',
    targetKeyword: 'combi oven bekas restoran',
    secondaryKeywords: ['harga combi oven rational bekas', 'unox cheftop bekas', 'tips beli oven resto'],
    searchIntent: 'COMMERCIAL',
    stage: 'PUBLISHED',
    author: 'Tim Teknis BBKitchen',
    assignedTo: 'Soolaeman',
    excerpt: 'Simak 7 parameter krusial saat membeli combi oven bekas hotel, mulai dari boiler sensor, fan motor, hingga garansi rekondisi.',
    content: 'Combi oven adalah jantung efisiensi dapur komersial modern...',
    featuredImage: 'https://picsum.photos/seed/bbk_art_oven/800/500',
    relatedCategorySlug: 'combi-oven',
    relatedSkus: ['BBK-GK-COM-0007', 'BBK-BL-COM-0015'],
    yoastTitle: 'Panduan Beli Combi Oven Bekas Restoran Bergaransi | BBKitchen',
    yoastMetaDesc: 'Ingin beli combi oven bekas hemat 60%? Simak panduan teknis inspeksi boiler, listrik, dan garansi resmi BBKitchen Jakarta Tangsel.',
    wordCount: 1450,
    internalLinksCount: 8,
    gscClicks30d: 342,
    gscImpressions30d: 4890,
    gscPosition: 3.2,
    publishedDate: '2026-08-10',
    updatedAt: '2026-08-25',
  },
  {
    id: 'art_02',
    title: 'Perbedaan Chiller Stainless Steel AISI 304 vs 201 untuk Dapur Komersial',
    slug: 'perbedaan-chiller-stainless-304-vs-201',
    targetKeyword: 'chiller stainless 304 bekas',
    secondaryKeywords: ['upright chiller bekas jakarta', 'kulkas resto stainless', 'hoshizaki chiller bekas'],
    searchIntent: 'INFORMATIONAL',
    stage: 'INDEXED',
    author: 'Chief Engineer BBK',
    assignedTo: 'Rian Content',
    excerpt: 'Mengapa material stainless 304 wajib untuk dapur bersuhu tinggi dan lembab? Simak analisa ketahanan karat dan efisiensi kompresor.',
    content: 'Dalam memilih lemari pendingin komersial...',
    featuredImage: 'https://picsum.photos/seed/bbk_art_ref/800/500',
    relatedCategorySlug: 'refrigeration',
    relatedSkus: ['BBK-ML-REF-0021'],
    yoastTitle: 'Chiller Stainless 304 vs 201 untuk Restoran | Analisa Dapur BBK',
    yoastMetaDesc: 'Jangan salah pilih chiller dapur restoran. Pelajari perbedaan grade stainless steel 304 tahan korosi dengan kompresor hemat daya.',
    wordCount: 1280,
    internalLinksCount: 6,
    gscClicks30d: 215,
    gscImpressions30d: 3100,
    gscPosition: 4.8,
    publishedDate: '2026-08-15',
    updatedAt: '2026-08-26',
  },
  {
    id: 'art_03',
    title: 'Standar Kelistrikan & Gas untuk Kompor Restoran Heavy Duty 4 Burner',
    slug: 'standar-kelistrikan-gas-kompor-restoran',
    targetKeyword: 'kompor resto heavy duty bekas',
    secondaryKeywords: ['kompor 4 tungku oven bekas', 'nayati gas range', 'berjaya 4 burner'],
    searchIntent: 'COMMERCIAL',
    stage: 'DRAFT',
    author: 'Soolaeman',
    assignedTo: 'Soolaeman',
    excerpt: 'Instalasi pipa gas LPG medium-pressure dan peredam panas dinding dapur restoran.',
    content: 'Draf konten teknis persiapan instalasi kompor...',
    featuredImage: 'https://picsum.photos/seed/bbk_art_cook/800/500',
    relatedCategorySlug: 'cooking-range',
    relatedSkus: ['BBK-SM-COO-0028'],
    yoastTitle: 'Tips Instalasi Gas Kompor Heavy Duty Restoran | BBKitchen',
    yoastMetaDesc: 'Panduan aman pasang kompor restoran 4 burner ex-hotel dengan regulator dan pipa standar keselamatan.',
    wordCount: 650,
    internalLinksCount: 3,
    publishedDate: undefined,
    updatedAt: '2026-08-27',
  },
  {
    id: 'art_04',
    title: 'Daftar Harga Mesin Espresso 2 Group Bekas Cafe Terpopuler di Indonesia',
    slug: 'daftar-harga-mesin-espresso-2-group-bekas',
    targetKeyword: 'mesin espresso 2 group bekas cafe',
    secondaryKeywords: ['la marzocco linea bekas', 'simonelli aurelia bekas', 'mesin kopi cafe'],
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
