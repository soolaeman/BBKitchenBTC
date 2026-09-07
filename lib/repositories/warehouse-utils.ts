import { WarehouseCode, WarehouseLocation } from '@/lib/types/inventory';

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
