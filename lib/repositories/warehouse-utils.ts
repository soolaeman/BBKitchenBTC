import { WarehouseCode, WarehouseLocation } from '@/lib/types/inventory';
import { OFFICIAL_CATEGORIES } from './categories';

export const WAREHOUSE_LOCATION_MAP: Record<WarehouseCode, WarehouseLocation> = {
  GK: 'PAMULANG 2, TANGSEL',
  BB: 'PAMULANG 2, TANGSEL',
  SM: 'PAMULANG 2, TANGSEL',
  BL: 'PAMULANG 2, TANGSEL',
  ML: 'PAMULANG BARAT, TANGSEL',
  RB: 'PAMULANG BARAT, TANGSEL',
  KG: 'PAMULANG BARAT, TANGSEL',
  PY: 'SETU, TANGSEL',
  PE: 'SAWANGAN, DEPOK',
  SK: 'SAWANGAN, DEPOK',
  WT: 'KEDAUNG, TANGSEL',
  ON: 'KEDAUNG, TANGSEL',
  RK: 'RAWAKALONG, BOGOR',
};

export const WAREHOUSE_13_HUBS = [
  { code: 'GK' as WarehouseCode, name: 'Griya Kitchen', partnerName: 'Griya Kitchen', hubLocation: 'PAMULANG 2, TANGSEL' as WarehouseLocation, hubGroup: 'Pamulang 2' },
  { code: 'BB' as WarehouseCode, name: 'BB Equipment', partnerName: 'BB Equipment', hubLocation: 'PAMULANG 2, TANGSEL' as WarehouseLocation, hubGroup: 'Pamulang 2' },
  { code: 'SM' as WarehouseCode, name: 'Suma Equipment', partnerName: 'Suma Equipment', hubLocation: 'PAMULANG 2, TANGSEL' as WarehouseLocation, hubGroup: 'Pamulang 2' },
  { code: 'BL' as WarehouseCode, name: 'Blandongan', partnerName: 'Blandongan', hubLocation: 'PAMULANG 2, TANGSEL' as WarehouseLocation, hubGroup: 'Pamulang 2' },
  { code: 'ML' as WarehouseCode, name: 'Mulia Logam', partnerName: 'Mulia Logam', hubLocation: 'PAMULANG BARAT, TANGSEL' as WarehouseLocation, hubGroup: 'Pamulang Barat' },
  { code: 'RB' as WarehouseCode, name: 'Raja Barkas', partnerName: 'Raja Barkas', hubLocation: 'PAMULANG BARAT, TANGSEL' as WarehouseLocation, hubGroup: 'Pamulang Barat' },
  { code: 'KG' as WarehouseCode, name: 'Kitchen Gembel', partnerName: 'Kitchen Gembel', hubLocation: 'PAMULANG BARAT, TANGSEL' as WarehouseLocation, hubGroup: 'Pamulang Barat' },
  { code: 'PY' as WarehouseCode, name: 'Pak Yogi', partnerName: 'Pak Yogi', hubLocation: 'SETU, TANGSEL' as WarehouseLocation, hubGroup: 'Setu' },
  { code: 'PE' as WarehouseCode, name: 'Pulung Elite', partnerName: 'Pulung Elite', hubLocation: 'SAWANGAN, DEPOK' as WarehouseLocation, hubGroup: 'Sawangan' },
  { code: 'SK' as WarehouseCode, name: 'Sanjaya Kitchen', partnerName: 'Sanjaya Kitchen', hubLocation: 'SAWANGAN, DEPOK' as WarehouseLocation, hubGroup: 'Sawangan' },
  { code: 'WT' as WarehouseCode, name: 'Warehouse Thaif', partnerName: 'Warehouse Thaif', hubLocation: 'KEDAUNG, TANGSEL' as WarehouseLocation, hubGroup: 'Kedaung' },
  { code: 'ON' as WarehouseCode, name: 'Onibuja Warehouse', partnerName: 'Onibuja Warehouse', hubLocation: 'KEDAUNG, TANGSEL' as WarehouseLocation, hubGroup: 'Kedaung' },
  { code: 'RK' as WarehouseCode, name: 'Rizkitchen', partnerName: 'Rizkitchen', hubLocation: 'RAWAKALONG, BOGOR' as WarehouseLocation, hubGroup: 'Rawakalong' },
];

export const WAREHOUSE_HUB_DETAILS = [
  {
    hubId: 'PAMULANG_2',
    name: 'Hub Pamulang 2',
    city: 'Tangerang Selatan',
    codes: ['GK', 'BB', 'SM', 'BL'],
    address: 'Jl. Surya Kencana No. 42, Pamulang 2, Tangerang Selatan',
    capacityUnits: 1200,
    specialty: 'Heavy Cooking, Combi Oven, Deck Oven, Bakery Equipment',
  },
  {
    hubId: 'PAMULANG_BARAT',
    name: 'Hub Pamulang Barat',
    city: 'Tangerang Selatan',
    codes: ['ML', 'RB', 'KG'],
    address: 'Jl. Raya Pajajaran No. 18, Pamulang Barat, Tangerang Selatan',
    capacityUnits: 800,
    specialty: 'Refrigeration, Chiller, Freezer, Ice Machine, Kitchen Gembel',
  },
  {
    hubId: 'SETU',
    name: 'Hub Setu',
    city: 'Tangerang Selatan',
    codes: ['PY'],
    address: 'Kawasan Pergudangan Setu No. 8, Setu, Tangerang Selatan',
    capacityUnits: 400,
    specialty: 'Stainless Fabrication, Sink, Exhaust Hood, Worktable',
  },
  {
    hubId: 'SAWANGAN',
    name: 'Hub Sawangan',
    city: 'Depok',
    codes: ['PE', 'SK'],
    address: 'Jl. Raya Muchtar / Perumahan Green Pratama Sawangan, Depok',
    capacityUnits: 650,
    specialty: 'Coffee Machines, Barista Setup, Countertop Equipment, Sanjaya Kitchen',
  },
  {
    hubId: 'KEDAUNG',
    name: 'Hub Kedaung',
    city: 'Tangerang Selatan',
    codes: ['WT', 'ON'],
    address: 'Jl. Aria Putra No. 55, Kedaung, Tangerang Selatan',
    capacityUnits: 450,
    specialty: 'Prep Machinery, Meat Slicers, Mixers, Dishwashers',
  },
  {
    hubId: 'RAWAKALONG',
    name: 'Hub Rawakalong',
    city: 'Bogor',
    codes: ['RK'],
    address: 'JPM8+MC2 Rawakalong, Bogor Regency, Jawa Barat',
    capacityUnits: 350,
    specialty: 'Rizki Kitchen (Commercial Cookware & Specialized Stoves)',
  },
];

export function resolveLocationFromCode(code: string): WarehouseLocation {
  const normalized = code?.toUpperCase().trim() as WarehouseCode;
  return WAREHOUSE_LOCATION_MAP[normalized] || 'PAMULANG 2, TANGSEL';
}

export function formatIDR(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return 'Hubungi kami';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCleanProductUrl(title: string, rawLinkUnit?: string): string {
  // If rawLinkUnit is already a clean shop URL on www domain without ?p=
  if (
    rawLinkUnit &&
    rawLinkUnit.includes('www.bukanbarukitchen.com/shop/') &&
    !rawLinkUnit.includes('?p=')
  ) {
    return rawLinkUnit.trim();
  }

  const cleanTitle = (title || '')
    .replace(/%%title%%|%%sep%%|%%sitename%%/gi, '')
    .replace(/[-|–]\s*BBKitchen.*/gi, '')
    .trim();

  // Exact WordPress sanitize_title replica:
  const slug = cleanTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace all non-alphanumeric (slashes, symbols, spaces, etc.) with hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing hyphens

  return `https://www.bukanbarukitchen.com/shop/${slug}/`;
}

// Bulletproof Date Normalizer for Excel Serials, ISO Strings, Timestamps (Client & Server Safe)
export function parseToISODate(raw: any): string | undefined {
  if (!raw) return undefined;
  const str = String(raw).trim();
  if (!str) return undefined;

  // 1. Check if numeric serial (e.g. 45918 or 46272)
  const num = Number(str);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    // Excel base date is Dec 30, 1899 (25569 days from Jan 1 1970)
    const jsDate = new Date((num - 25569) * 86400 * 1000);
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().split('T')[0];
    }
  }

  // 2. Check standard ISO or YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 3. Check DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 4. Handle localized Indonesian dates like "03 Sep 2026", "03 September 2026"
  const indoMonths: Record<string, string> = {
    jan: '01', januari: '01',
    feb: '02', februari: '02',
    mar: '03', maret: '03',
    apr: '04', april: '04',
    mei: '05', may: '05',
    jun: '06', juni: '06',
    jul: '07', juli: '07',
    agu: '08', agt: '08', agustus: '08', aug: '08',
    sep: '09', september: '09',
    okt: '10', oktober: '10', oct: '10',
    nov: '11', november: '11',
    des: '12', desember: '12', dec: '12',
  };

  const textDateMatch = str.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (textDateMatch) {
    const d = textDateMatch[1].padStart(2, '0');
    const monKey = textDateMatch[2].toLowerCase();
    const y = textDateMatch[3];
    const m = indoMonths[monKey];
    if (m) {
      return `${y}-${m}-${d}`;
    }
  }

  // 5. Try native Date constructor
  const d = new Date(str.replace(/\./g, ':'));
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return undefined;
}

/**
 * Resolves the canonical 2-letter Warehouse Code (GK, BB, SM, BL, ML, RB, KG, PY, PE, SK, WT, ON, RK)
 */
export function resolveHubCode(asalGudang?: string, loc?: string, sku?: string): WarehouseCode | '' {
  const code = (asalGudang || '').trim().toUpperCase();
  const validCodes: WarehouseCode[] = ['GK', 'BB', 'SM', 'BL', 'ML', 'RB', 'KG', 'PY', 'PE', 'SK', 'WT', 'ON', 'RK'];

  if (validCodes.includes(code as WarehouseCode)) {
    return code as WarehouseCode;
  }

  // Exact partner name match e.g. "GRIYA KITCHEN", "MULIA LOGAM", "BB EQUIPMENT"
  for (const hub of WAREHOUSE_13_HUBS) {
    if (
      code &&
      (code === hub.name.toUpperCase() ||
        code === hub.partnerName.toUpperCase() ||
        code.startsWith(`${hub.code} `) ||
        code.startsWith(`${hub.code}-`) ||
        code.startsWith(`${hub.code} -`))
    ) {
      return hub.code;
    }
  }

  // Location string check for specific partner name
  const locUpper = (loc || '').toUpperCase();
  for (const hub of WAREHOUSE_13_HUBS) {
    if (locUpper && (locUpper.includes(hub.partnerName.toUpperCase()) || locUpper.includes(hub.name.toUpperCase()))) {
      return hub.code;
    }
  }

  // SKU prefix match: e.g. "GK-1234", "BBK-GK-1234", "BB-1234", "ML-1234"
  const skuUpper = (sku || '').toUpperCase();
  for (const c of validCodes) {
    if (
      skuUpper.startsWith(`${c}-`) ||
      skuUpper.startsWith(`${c}_`) ||
      skuUpper.startsWith(`BBK-${c}-`) ||
      skuUpper.startsWith(`BBK_${c}_`)
    ) {
      return c;
    }
  }

  // Specific keyword cues (Distinct partners)
  if (locUpper.includes('RAWAKALONG') || locUpper.includes('RIZKI') || locUpper.includes('RIZKITCHEN')) return 'RK';
  if (locUpper.includes('SANJAYA')) return 'SK';
  if (locUpper.includes('GEMBEL')) return 'KG';
  if (locUpper.includes('PULUNG') || locUpper.includes('ELITE')) return 'PE';
  if (locUpper.includes('YOGI')) return 'PY';
  if (locUpper.includes('THAIF')) return 'WT';
  if (locUpper.includes('ONIBUJA')) return 'ON';
  if (locUpper.includes('MULIA') || locUpper.includes('LOGAM')) return 'ML';
  if (locUpper.includes('BARKAS')) return 'RB';
  if (locUpper.includes('BLANDONGAN')) return 'BL';
  if (locUpper.includes('SUMA')) return 'SM';
  if (locUpper.includes('BB EQUIPMENT')) return 'BB';
  if (locUpper.includes('GRIYA')) return 'GK';

  return '';
}

/**
 * Exact matching for official 13 Warehouse Hubs (Prevents cross-hub false positives)
 */
export function matchWarehouseHub(
  itemLocation: string = '',
  itemAsalGudang: string = '',
  skuStr: string = '',
  hubFilter: string = 'ALL'
): boolean {
  if (!hubFilter || hubFilter === 'ALL') return true;
  const targetCode = hubFilter.toUpperCase().trim() as WarehouseCode;

  const resolved = resolveHubCode(itemAsalGudang, itemLocation, skuStr);
  if (resolved) {
    return resolved === targetCode;
  }

  // Fallback: direct exact comparison (no loose substring match)
  const direct = (itemAsalGudang || '').toUpperCase().trim();
  return direct === targetCode;
}

/**
 * Robust Category Matching supporting Parent Category Groups and Subcategory Disambiguation
 */
export function matchCategory(itemTitle: string = '', itemCat: string = '', filter: string = 'ALL'): boolean {
  if (!filter || filter === 'ALL') return true;

  const cleanFilter = filter.toLowerCase().trim();
  const cleanTitle = (itemTitle || '').toLowerCase().trim();
  const cleanCat = (itemCat || '').toLowerCase().trim();

  // 1. Direct exact match on category field
  if (cleanCat && cleanCat === cleanFilter) {
    return true;
  }

  // 2. Check if filter is a Parent Category Group
  const parentGroup = OFFICIAL_CATEGORIES.find(
    (g) => g.name.toLowerCase() === cleanFilter || g.slug.toLowerCase() === cleanFilter
  );

  if (parentGroup) {
    // If filter is parent group (e.g. 'MEJA STAINLESS' or 'meja-stainless'):
    const validSlugs = [parentGroup.slug.toLowerCase(), ...parentGroup.children.map((c) => c.slug.toLowerCase())];
    const validNames = [parentGroup.name.toLowerCase(), ...parentGroup.children.map((c) => c.name.toLowerCase())];

    if (validSlugs.includes(cleanCat) || validNames.includes(cleanCat)) return true;

    const combined = `${cleanTitle} ${cleanCat}`;

    // Check by root keywords in title or category/slug
    if (parentGroup.slug === 'meja-stainless' && combined.includes('meja')) return true;
    if (
      parentGroup.slug === 'sink-stainless' &&
      (combined.includes('sink') || combined.includes('wastafel') || combined.includes('bak cuci') || combined.includes('cuci'))
    )
      return true;
    if (
      parentGroup.slug === 'kompor' &&
      (combined.includes('kompor') ||
        combined.includes('kwali') ||
        combined.includes('wok') ||
        combined.includes('stove') ||
        combined.includes('fryer') ||
        combined.includes('boiler') ||
        combined.includes('oven') ||
        combined.includes('grill') ||
        combined.includes('teppanyaki') ||
        combined.includes('cooking') ||
        combined.includes('tungku') ||
        combined.includes('burner') ||
        combined.includes('steamer') ||
        combined.includes('dimsum') ||
        combined.includes('batu lava'))
    )
      return true;
    if (parentGroup.slug === 'chiller' && combined.includes('chiller')) return true;
    if (parentGroup.slug === 'freezer' && combined.includes('freezer')) return true;
    if (parentGroup.slug === 'showcase' && combined.includes('showcase')) return true;
    if (
      parentGroup.slug === 'rak-stainless' &&
      (combined.includes('rak') ||
        combined.includes('wallshelf') ||
        combined.includes('wall shelf') ||
        combined.includes('troli') ||
        combined.includes('trolley') ||
        combined.includes('pan rack'))
    )
      return true;
    if (
      parentGroup.slug === 'hood-stainless' &&
      (combined.includes('hood') ||
        combined.includes('exhaust') ||
        combined.includes('blower') ||
        combined.includes('ducting') ||
        combined.includes('axial') ||
        combined.includes('ventilasi'))
    )
      return true;
    if (
      parentGroup.slug === 'ice-system' &&
      (combined.includes('ice') ||
        combined.includes('es batu') ||
        combined.includes('ice maker') ||
        combined.includes('ice bin') ||
        combined.includes('ice machine'))
    )
      return true;
    if (
      parentGroup.slug === 'peralatan-dapur-bekas-lainnya' &&
      (combined.includes('blender') ||
        combined.includes('mixer') ||
        combined.includes('slicer') ||
        combined.includes('sealer') ||
        combined.includes('cutter') ||
        combined.includes('lainnya'))
    )
      return true;

    return false;
  }

  // 3. Filter is a SPECIFIC Subcategory (e.g. 'Meja 1 Susun', 'Meja 2 Susun', 'Single Sink', 'Double Sink', etc.)
  let targetChild: { name: string; slug: string } | undefined;
  for (const g of OFFICIAL_CATEGORIES) {
    const found = g.children.find(
      (c) => c.name.toLowerCase() === cleanFilter || c.slug.toLowerCase() === cleanFilter
    );
    if (found) {
      targetChild = found;
      break;
    }
  }

  const childName = (targetChild ? targetChild.name : filter).toLowerCase();
  const childSlug = (targetChild ? targetChild.slug : filter).toLowerCase();

  // If item's category field matches the child name or slug exactly
  if (cleanCat && (cleanCat === childName || cleanCat === childSlug)) {
    return true;
  }

  // Specific Subcategory Disambiguation (e.g. Meja 1 Susun vs Meja 2 Susun vs Meja 3 Susun)
  if (childName.includes('meja 1 susun') || childSlug.includes('meja-1-susun')) {
    const is1 =
      cleanCat.includes('1 susun') ||
      cleanCat.includes('1-susun') ||
      cleanTitle.includes('1 susun') ||
      cleanTitle.includes('1-susun') ||
      cleanTitle.includes('1susun');
    const hasOther = cleanTitle.includes('2 susun') || cleanTitle.includes('3 susun') || cleanCat.includes('2 susun') || cleanCat.includes('3 susun');
    return is1 && !hasOther;
  }
  if (childName.includes('meja 2 susun') || childSlug.includes('meja-2-susun')) {
    const is2 =
      cleanCat.includes('2 susun') ||
      cleanCat.includes('2-susun') ||
      cleanTitle.includes('2 susun') ||
      cleanTitle.includes('2-susun') ||
      cleanTitle.includes('2susun');
    const hasOther = cleanTitle.includes('1 susun') || cleanTitle.includes('3 susun') || cleanCat.includes('1 susun') || cleanCat.includes('3 susun');
    return is2 && !hasOther;
  }
  if (childName.includes('meja 3 susun') || childSlug.includes('meja-3-susun')) {
    const is3 =
      cleanCat.includes('3 susun') ||
      cleanCat.includes('3-susun') ||
      cleanTitle.includes('3 susun') ||
      cleanTitle.includes('3-susun') ||
      cleanTitle.includes('3susun');
    const hasOther = cleanTitle.includes('1 susun') || cleanTitle.includes('2 susun') || cleanCat.includes('1 susun') || cleanCat.includes('2 susun');
    return is3 && !hasOther;
  }
  if (childName.includes('meja bumbu') || childSlug.includes('meja-bumbu')) {
    return cleanCat.includes('bumbu') || cleanTitle.includes('bumbu');
  }
  if (childName.includes('meja kabinet') || childSlug.includes('meja-kabinet')) {
    return (
      cleanCat.includes('kabinet') ||
      cleanCat.includes('cabinet') ||
      cleanTitle.includes('kabinet') ||
      cleanTitle.includes('cabinet')
    );
  }
  if (childName.includes('meja kompor') || childSlug.includes('meja-kompor')) {
    return cleanCat.includes('meja kompor') || cleanTitle.includes('meja kompor');
  }

  // Sink Disambiguation
  if (
    childName.includes('single sink') ||
    childSlug.includes('single-sink') ||
    childName.includes('1 sink') ||
    childName.includes('1 lubang') ||
    childName.includes('1 bowl')
  ) {
    const isSingle =
      cleanCat.includes('single') ||
      cleanCat.includes('1 sink') ||
      cleanCat.includes('1 lubang') ||
      cleanCat.includes('1 bowl') ||
      cleanTitle.includes('single sink') ||
      cleanTitle.includes('1 sink') ||
      cleanTitle.includes('1 lubang') ||
      cleanTitle.includes('1 bowl');
    const hasOther =
      cleanTitle.includes('double') ||
      cleanTitle.includes('triple') ||
      cleanTitle.includes('2 sink') ||
      cleanTitle.includes('2 lubang');
    return isSingle && !hasOther;
  }
  if (
    childName.includes('double sink') ||
    childSlug.includes('double-sink') ||
    childName.includes('2 sink') ||
    childName.includes('2 lubang') ||
    childName.includes('2 bowl')
  ) {
    const isDouble =
      cleanCat.includes('double') ||
      cleanCat.includes('2 sink') ||
      cleanCat.includes('2 lubang') ||
      cleanCat.includes('2 bowl') ||
      cleanTitle.includes('double sink') ||
      cleanTitle.includes('2 sink') ||
      cleanTitle.includes('2 lubang') ||
      cleanTitle.includes('2 bowl');
    const hasOther =
      cleanTitle.includes('single') ||
      cleanTitle.includes('triple') ||
      cleanTitle.includes('1 sink') ||
      cleanTitle.includes('1 lubang');
    return isDouble && !hasOther;
  }
  if (
    childName.includes('triple sink') ||
    childSlug.includes('triple-sink') ||
    childName.includes('3 sink') ||
    childName.includes('3 lubang') ||
    childName.includes('3 bowl')
  ) {
    return (
      cleanCat.includes('triple') ||
      cleanCat.includes('3 sink') ||
      cleanCat.includes('3 lubang') ||
      cleanTitle.includes('triple sink') ||
      cleanTitle.includes('3 sink') ||
      cleanTitle.includes('3 lubang')
    );
  }

  // Showcase Disambiguation
  if (childName.includes('1 pintu') || childSlug.includes('1-pintu')) {
    const is1 =
      cleanCat.includes('1 pintu') ||
      cleanTitle.includes('1 pintu') ||
      cleanTitle.includes('1pintu') ||
      cleanTitle.includes('1 door');
    const hasOther =
      cleanTitle.includes('2 pintu') ||
      cleanTitle.includes('3 pintu') ||
      cleanTitle.includes('2 door') ||
      cleanTitle.includes('3 door');
    return is1 && !hasOther;
  }
  if (childName.includes('2 pintu') || childSlug.includes('2-pintu')) {
    const is2 =
      cleanCat.includes('2 pintu') ||
      cleanTitle.includes('2 pintu') ||
      cleanTitle.includes('2pintu') ||
      cleanTitle.includes('2 door');
    const hasOther =
      cleanTitle.includes('1 pintu') ||
      cleanTitle.includes('3 pintu') ||
      cleanTitle.includes('1 door') ||
      cleanTitle.includes('3 door');
    return is2 && !hasOther;
  }

  // Kompor Disambiguation
  if (childName.includes('1 tungku') || childSlug.includes('1-tungku')) {
    const is1 =
      cleanCat.includes('1 tungku') ||
      cleanTitle.includes('1 tungku') ||
      cleanTitle.includes('1 burner') ||
      cleanTitle.includes('stockpot');
    const hasOther =
      cleanTitle.includes('2 tungku') ||
      cleanTitle.includes('3 tungku') ||
      cleanTitle.includes('4 tungku') ||
      cleanTitle.includes('6 tungku');
    return is1 && !hasOther;
  }
  if (childName.includes('2 tungku') || childSlug.includes('2-tungku')) {
    const is2 =
      cleanCat.includes('2 tungku') ||
      cleanTitle.includes('2 tungku') ||
      cleanTitle.includes('2 burner');
    const hasOther =
      cleanTitle.includes('1 tungku') ||
      cleanTitle.includes('3 tungku') ||
      cleanTitle.includes('4 tungku') ||
      cleanTitle.includes('6 tungku');
    return is2 && !hasOther;
  }
  if (childName.includes('3 tungku') || childSlug.includes('3-tungku')) {
    return cleanCat.includes('3 tungku') || cleanTitle.includes('3 tungku') || cleanTitle.includes('3 burner');
  }
  if (childName.includes('4 tungku') || childSlug.includes('4-tungku')) {
    return cleanCat.includes('4 tungku') || cleanTitle.includes('4 tungku') || cleanTitle.includes('4 burner');
  }
  if (childName.includes('6 tungku') || childSlug.includes('6-tungku')) {
    return cleanCat.includes('6 tungku') || cleanTitle.includes('6 tungku') || cleanTitle.includes('6 burner');
  }
  if (childName.includes('wok') || childName.includes('kwali') || childSlug.includes('kwali')) {
    return cleanCat.includes('kwali') || cleanCat.includes('wok') || cleanTitle.includes('kwali') || cleanTitle.includes('wok');
  }
  if (childName.includes('deep fryer') || childSlug.includes('deep-fryer')) {
    return cleanCat.includes('fryer') || cleanTitle.includes('fryer');
  }
  if (childName.includes('noodle boiler') || childSlug.includes('noodle-boiler')) {
    return cleanCat.includes('noodle') || cleanCat.includes('boiler') || cleanTitle.includes('noodle') || cleanTitle.includes('boiler');
  }
  if (childName.includes('oven') || childSlug.includes('oven')) {
    return cleanCat.includes('oven') || cleanTitle.includes('oven');
  }

  // Exact phrase fallback
  if (cleanCat && (cleanCat.includes(childName) || cleanCat.includes(childSlug))) return true;
  if (cleanTitle && cleanTitle.includes(childName)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// CENTRALIZED DYNAMIC DATE PRESET & FILTERING ENGINE
// ---------------------------------------------------------------------------

export type UniversalDatePreset =
  | 'ALL'
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'LAST_7_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_30_DAYS'
  | 'THIS_YEAR'
  | 'LAST_YEAR'
  | 'CUSTOM';

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Returns user-friendly Indonesian labels with dynamic month and year numbers.
 */
export function getDynamicDatePresetOptions(baseDate: Date = new Date()): { value: UniversalDatePreset; label: string }[] {
  const currentMonthIdx = baseDate.getMonth();
  const currentYear = baseDate.getFullYear();

  const prevMonthDate = new Date(currentYear, currentMonthIdx - 1, 1);
  const prevMonthIdx = prevMonthDate.getMonth();
  const prevMonthYear = prevMonthDate.getFullYear();

  return [
    { value: 'ALL', label: 'Semua Waktu (All Time)' },
    { value: 'THIS_WEEK', label: 'Minggu Ini (Pekan Berjalan)' },
    { value: 'LAST_WEEK', label: 'Minggu Lalu (Pekan Sebelumnya)' },
    { value: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
    { value: 'THIS_MONTH', label: `Bulan Ini (${INDO_MONTHS[currentMonthIdx]} ${currentYear})` },
    { value: 'LAST_MONTH', label: `Bulan Lalu (${INDO_MONTHS[prevMonthIdx]} ${prevMonthYear})` },
    { value: 'LAST_30_DAYS', label: '30 Hari Terakhir' },
    { value: 'THIS_YEAR', label: `Tahun Ini (${currentYear})` },
    { value: 'LAST_YEAR', label: `Tahun Lalu (${currentYear - 1})` },
    { value: 'CUSTOM', label: 'Kustom Tanggal' },
  ];
}

/**
 * Calculates start and end ISO strings (YYYY-MM-DD) for active and previous period comparison.
 */
export function getDatePresetBounds(
  preset: UniversalDatePreset,
  customStart?: string,
  customEnd?: string,
  baseDate: Date = new Date()
): {
  startFilter: string | null;
  endFilter: string | null;
  prevStartFilter: string | null;
  prevEndFilter: string | null;
} {
  const now = baseDate;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let startFilter: string | null = null;
  let endFilter: string | null = null;
  let prevStartFilter: string | null = null;
  let prevEndFilter: string | null = null;

  if (preset === 'THIS_WEEK') {
    // Week start on Monday
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

    const prevMonday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7);
    const prevSunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 1);

    startFilter = monday.toISOString().split('T')[0];
    endFilter = sunday.toISOString().split('T')[0];
    prevStartFilter = prevMonday.toISOString().split('T')[0];
    prevEndFilter = prevSunday.toISOString().split('T')[0];
  } else if (preset === 'LAST_WEEK') {
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const mondayThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
    const mondayLastWeek = new Date(mondayThisWeek.getFullYear(), mondayThisWeek.getMonth(), mondayThisWeek.getDate() - 7);
    const sundayLastWeek = new Date(mondayThisWeek.getFullYear(), mondayThisWeek.getMonth(), mondayThisWeek.getDate() - 1);

    const monday2WeeksAgo = new Date(mondayLastWeek.getFullYear(), mondayLastWeek.getMonth(), mondayLastWeek.getDate() - 7);
    const sunday2WeeksAgo = new Date(mondayLastWeek.getFullYear(), mondayLastWeek.getMonth(), mondayLastWeek.getDate() - 1);

    startFilter = mondayLastWeek.toISOString().split('T')[0];
    endFilter = sundayLastWeek.toISOString().split('T')[0];
    prevStartFilter = monday2WeeksAgo.toISOString().split('T')[0];
    prevEndFilter = sunday2WeeksAgo.toISOString().split('T')[0];
  } else if (preset === 'LAST_7_DAYS') {
    const endObj = new Date(now);
    const startObj = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevEndObj = new Date(startObj.getTime() - 1 * 24 * 60 * 60 * 1000);
    const prevStartObj = new Date(startObj.getTime() - 8 * 24 * 60 * 60 * 1000);

    startFilter = startObj.toISOString().split('T')[0];
    endFilter = endObj.toISOString().split('T')[0];
    prevStartFilter = prevStartObj.toISOString().split('T')[0];
    prevEndFilter = prevEndObj.toISOString().split('T')[0];
  } else if (preset === 'LAST_30_DAYS') {
    const endObj = new Date(now);
    const startObj = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevEndObj = new Date(startObj.getTime() - 1 * 24 * 60 * 60 * 1000);
    const prevStartObj = new Date(startObj.getTime() - 31 * 24 * 60 * 60 * 1000);

    startFilter = startObj.toISOString().split('T')[0];
    endFilter = endObj.toISOString().split('T')[0];
    prevStartFilter = prevStartObj.toISOString().split('T')[0];
    prevEndFilter = prevEndObj.toISOString().split('T')[0];
  } else if (preset === 'THIS_MONTH') {
    const startObj = new Date(currentYear, currentMonth, 1);
    const endObj = new Date(currentYear, currentMonth + 1, 0);
    const prevStartObj = new Date(currentYear, currentMonth - 1, 1);
    const prevEndObj = new Date(currentYear, currentMonth, 0);

    startFilter = startObj.toISOString().split('T')[0];
    endFilter = endObj.toISOString().split('T')[0];
    prevStartFilter = prevStartObj.toISOString().split('T')[0];
    prevEndFilter = prevEndObj.toISOString().split('T')[0];
  } else if (preset === 'LAST_MONTH') {
    const startObj = new Date(currentYear, currentMonth - 1, 1);
    const endObj = new Date(currentYear, currentMonth, 0);
    const prevStartObj = new Date(currentYear, currentMonth - 2, 1);
    const prevEndObj = new Date(currentYear, currentMonth - 1, 0);

    startFilter = startObj.toISOString().split('T')[0];
    endFilter = endObj.toISOString().split('T')[0];
    prevStartFilter = prevStartObj.toISOString().split('T')[0];
    prevEndFilter = prevEndObj.toISOString().split('T')[0];
  } else if (preset === 'THIS_YEAR') {
    startFilter = `${currentYear}-01-01`;
    endFilter = `${currentYear}-12-31`;
    prevStartFilter = `${currentYear - 1}-01-01`;
    prevEndFilter = `${currentYear - 1}-12-31`;
  } else if (preset === 'LAST_YEAR') {
    startFilter = `${currentYear - 1}-01-01`;
    endFilter = `${currentYear - 1}-12-31`;
    prevStartFilter = `${currentYear - 2}-01-01`;
    prevEndFilter = `${currentYear - 2}-12-31`;
  } else if (preset === 'CUSTOM') {
    if (customStart) startFilter = parseToISODate(customStart) || customStart;
    if (customEnd) endFilter = parseToISODate(customEnd) || customEnd;
  }

  return {
    startFilter,
    endFilter,
    prevStartFilter,
    prevEndFilter,
  };
}

/**
 * Universal date range comparator.
 */
export function isDateInRange(
  dateStr?: string,
  startFilter?: string | null,
  endFilter?: string | null
): boolean {
  if (!startFilter && !endFilter) return true;
  if (!dateStr) return false;

  const iso = parseToISODate(dateStr) || dateStr.split('T')[0];
  if (startFilter && iso < startFilter) return false;
  if (endFilter && iso > endFilter) return false;
  return true;
}

