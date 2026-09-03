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
