// Shared Domain Types for Bukan Baru Kitchen (BBK) Control Tower & Public System

export type UnitStatus = 'READY' | 'SOLD' | 'AVAILABLE' | 'AMBIGUOUS';

export type PipelineStatus =
  | 'PENDING_PHOTOS'
  | 'READY_TO_PUBLISH'
  | 'PUBLISHED'
  | 'NO_PHOTOS_FOUND'
  | 'SKIP: NO IMAGE'
  | 'ERROR'
  | 'AMBIGUOUS';

export type WarehouseCode =
  | 'GK'
  | 'BB'
  | 'SM'
  | 'BL'
  | 'ML'
  | 'RB'
  | 'PY'
  | 'PE'
  | 'WT'
  | 'ON';

export type WarehouseLocation =
  | 'PAMULANG 2, TANGSEL'
  | 'PAMULANG BARAT, TANGSEL'
  | 'SETU, TANGSEL'
  | 'SAWANGAN, DEPOK'
  | 'KEDAUNG, TANGSEL'
  | 'OTHER';

export type GuardrailStatus = 'SAFE' | 'WARNING' | 'BREACHED';

export interface MasterInventoryItem {
  SKU: string;
  PRODUCT_TITLE: string;
  SEO_TITLE: string;
  CATEGORY_SLUG: string;
  CATEGORY_NAME: string;
  STATUS_UNIT: UnitStatus;
  STATUS_PIPELINE: PipelineStatus;
  LOKASI_UNIT: string;
  KONDISI_UNIT: string;
  SHORT_DESCRIPTION: string;
  FULL_DESCRIPTION: string;
  SPESIFIKASI: Record<string, string>;
  YOAST_KEYWORD: string;
  YOAST_DESCRIPTION: string;
  FEATURED_IMAGE: string;
  PHOTO_URLS: string[];
  TANGGAL_MASUK: string; // YYYY-MM-DD
  TANGGAL_TERJUAL: string | null; // YYYY-MM-DD or null
  DURASI_TERJUAL: number | null; // days
  PRODUCT_ID: number | string;
  IS_DIRTY: boolean;
  image_alt: string;
  image_title: string;
  image_caption: string;
  image_description: string;
  asal_gudang: WarehouseCode;
  LINK_TELEGRAM?: string;
  
  // Public Display Price (Estimated market/negotiable opening price)
  HARGA_ESTIMASI_PUBLIK: number;

  // STRICTLY INTERNAL COMMERCIAL FIELDS (Protected by RBAC server-side)
  HARGA_MODAL?: number;
  HARGA_BUKA_WA?: number;
  HARGA_DEAL_WA?: number;
  HARGA_FLOOR_WA?: number;
  MARGIN_FLOOR?: number;
  MARGIN_DEAL?: number;
  STATUS_GUARDRAIL?: GuardrailStatus;
  LINK_UNIT?: string;
  supplier_code?: string;
  internal_notes?: string;
  
  // Quality & Exception Flags
  dirty_reasons?: string[];
  last_pipeline_update?: string;
}

export interface InventoryFilterOptions {
  search?: string;
  category?: string;
  location?: string;
  warehouse?: string;
  condition?: string;
  statusUnit?: string;
  statusPipeline?: string;
  guardrailStatus?: string;
  isDirty?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'TANGGAL_MASUK' | 'SKU' | 'PRODUCT_TITLE' | 'HARGA_BUKA_WA' | 'DURASI_TERJUAL';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedInventoryResponse {
  items: MasterInventoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalUnits: number;
    availableUnits: number;
    soldUnits: number;
    pendingPhotos: number;
    readyToPublish: number;
    published: number;
    errors: number;
    ambiguous: number;
    dirtyCount: number;
  };
}
