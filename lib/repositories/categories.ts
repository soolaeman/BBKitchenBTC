export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  parentSlug?: string;
}

export interface CategoryGroup {
  name: string;
  slug: string;
  children: { name: string; slug: string }[];
}

export const OFFICIAL_CATEGORIES: CategoryGroup[] = [
  {
    name: 'MEJA STAINLESS',
    slug: 'meja-stainless',
    children: [
      { name: 'Meja 1 Susun', slug: 'meja-1-susun-stainless' },
      { name: 'Meja 2 Susun', slug: 'meja-2-susun-stainless' },
      { name: 'Meja 3 Susun', slug: 'meja-3-susun-stainless' },
      { name: 'Meja Bumbu', slug: 'meja-bumbu-stainless' },
      { name: 'Meja Kabinet', slug: 'meja-kabinet-stainless' },
      { name: 'Meja Kompor', slug: 'meja-kompor-stainless' },
      { name: 'Meja Lainnya', slug: 'lainnya-meja-stainless' },
    ],
  },
  {
    name: 'SINK STAINLESS',
    slug: 'sink-stainless',
    children: [
      { name: 'Single Sink', slug: 'single-sink-stainless' },
      { name: 'Double Sink', slug: 'double-sink-stainless' },
      { name: 'Triple Sink', slug: 'triple-sink-stainless' },
      { name: 'Sink Jumbo', slug: 'sink-jumbo-stainless' },
      { name: 'Sink Lainnya / Wastafel', slug: 'lainnya-sink' },
    ],
  },
  {
    name: 'KOMPOR & COOKING',
    slug: 'kompor',
    children: [
      { name: 'Kompor 1 Tungku / Stockpot', slug: 'kompor-1-tungku' },
      { name: 'Kompor 2 Tungku', slug: 'kompor-2-tungku' },
      { name: 'Kompor 3 Tungku', slug: 'kompor-3-tungku' },
      { name: 'Kompor 4 Tungku', slug: 'kompor-4-tungku' },
      { name: 'Kompor 6 Tungku', slug: 'kompor-6-tungku' },
      { name: 'Kompor Wok Kwali Range', slug: 'kompor-wok-kwali-range' },
      { name: 'Kompor Batu Lava', slug: 'kompor-batu-lava' },
      { name: 'Kompor Grill Teppanyaki', slug: 'kompor-grill-tepanyaki' },
      { name: 'Deep Fryer', slug: 'deep-fryer' },
      { name: 'Noodle Boiler', slug: 'noodle-boiler' },
      { name: 'Oven', slug: 'oven' },
      { name: 'Kompor Lainnya', slug: 'lainnya-kompor' },
    ],
  },
  {
    name: 'CHILLER',
    slug: 'chiller',
    children: [
      { name: 'Undercounter Chiller', slug: 'undercounter-chiller' },
      { name: 'Upright Chiller', slug: 'upright-chiller' },
      { name: 'Chiller Lainnya', slug: 'lainnya-chiller' },
    ],
  },
  {
    name: 'FREEZER',
    slug: 'freezer',
    children: [
      { name: 'Chest Freezer', slug: 'chest-freezer' },
      { name: 'Upright Freezer', slug: 'upright-freezer' },
      { name: 'Freezer Lainnya', slug: 'lainnya-freezer' },
    ],
  },
  {
    name: 'SHOWCASE',
    slug: 'showcase',
    children: [
      { name: 'Showcase 1 Pintu', slug: 'showcase-1-pintu' },
      { name: 'Showcase 2 Pintu', slug: 'showcase-2-pintu' },
      { name: 'Cake Showcase', slug: 'cake-showcase' },
      { name: 'Showcase Lainnya', slug: 'lainnya-showcase' },
    ],
  },
  {
    name: 'RAK STAINLESS',
    slug: 'rak-stainless',
    children: [
      { name: 'Rak 1 Susun', slug: 'rak-1-susun-stainless' },
      { name: 'Rak 2 Susun', slug: 'rak-2-susun-stainless' },
      { name: 'Rak 3 Susun', slug: 'rak-3-susun-stainless' },
      { name: 'Rak 4 Susun', slug: 'rak-4-susun-stainless' },
      { name: 'Rak 5 Susun', slug: 'rak-5-susun-stainless' },
      { name: 'Wallshelf', slug: 'wallshelf' },
      { name: 'Rak Lainnya / Troli', slug: 'lainnya-rak-stainless' },
    ],
  },
  {
    name: 'HOOD STAINLESS & VENTILASI',
    slug: 'hood-stainless',
    children: [
      { name: 'Exhaust Hood', slug: 'hood' },
      { name: 'Blower / Axial', slug: 'blower' },
      { name: 'Ducting', slug: 'ducting' },
      { name: 'Hood Lainnya', slug: 'lainnya-hood' },
    ],
  },
  {
    name: 'ICE SYSTEM',
    slug: 'ice-system',
    children: [
      { name: 'Ice Maker', slug: 'ice-maker' },
      { name: 'Ice Bin', slug: 'ice-bin' },
      { name: 'Ice System Lainnya', slug: 'lainnya-ice-system' },
    ],
  },
  {
    name: 'PERALATAN LAINNYA',
    slug: 'peralatan-dapur-bekas-lainnya',
    children: [],
  },
];

export function matchOfficialCategory(text: string): { slug: string; name: string } {
  const t = (text || '').toLowerCase();

  // 1. Ice Maker / Ice System
  if (t.includes('ice maker') || t.includes('ice machine') || t.includes('ice bin') || t.includes('es batu') || t.includes('ice-system')) {
    return { slug: 'ice-system', name: 'Ice System' };
  }

  // 2. Showcase / Display Cooler
  if (t.includes('showcase') || t.includes('display cooler') || t.includes('cake showcase') || t.includes('cake display')) {
    return { slug: 'showcase', name: 'Showcase' };
  }

  // 3. Freezer
  if (t.includes('freezer') || t.includes('chest freezer') || t.includes('deep freeze') || t.includes('upright freezer')) {
    return { slug: 'freezer', name: 'Freezer' };
  }

  // 4. Chiller
  if (t.includes('chiller') || t.includes('undercounter') || t.includes('upright chiller') || t.includes('kulkas resto')) {
    return { slug: 'chiller', name: 'Chiller' };
  }

  // 5. Hood & Exhaust
  if (t.includes('hood') || t.includes('exhaust') || t.includes('blower') || t.includes('axial') || t.includes('ducting')) {
    return { slug: 'hood-stainless', name: 'Hood Stainless & Exhaust' };
  }

  // 6. Sink Stainless
  if (t.includes('sink') || t.includes('bak cuci') || t.includes('cuci piring') || t.includes('wastafel')) {
    return { slug: 'sink-stainless', name: 'Sink Stainless' };
  }

  // 7. Rak Stainless / Troli
  if (t.includes('rak') || t.includes('rack') || t.includes('tier') || t.includes('wallshelf') || t.includes('troli') || t.includes('trolley')) {
    return { slug: 'rak-stainless', name: 'Rak Stainless' };
  }

  // 8. Meja Stainless
  if (t.includes('meja') || t.includes('worktable') || t.includes('prep table') || t.includes('table')) {
    return { slug: 'meja-stainless', name: 'Meja Stainless' };
  }

  // 9. Kompor & Cooking (Stove, Oven, Fryer, Griddle, Steamer, Noodle Boiler, Kwali)
  if (
    t.includes('kompor') ||
    t.includes('stove') ||
    t.includes('burner') ||
    t.includes('kwali') ||
    t.includes('wok') ||
    t.includes('fryer') ||
    t.includes('oven') ||
    t.includes('griddle') ||
    t.includes('grill') ||
    t.includes('teppan') ||
    t.includes('salamander') ||
    t.includes('boiler') ||
    t.includes('steamer') ||
    t.includes('cooking')
  ) {
    return { slug: 'kompor', name: 'Kompor & Cooking' };
  }

  // 10. Fallback: Peralatan Lainnya
  return { slug: 'peralatan-dapur-bekas-lainnya', name: 'Peralatan Dapur Lainnya' };
}

