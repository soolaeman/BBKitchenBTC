import { google } from "googleapis";
import type { MasterInventoryItem, InventoryFilterOptions, PaginatedInventoryResponse } from "@/lib/types/inventory";
import { OFFICIAL_CATEGORIES } from "./categories";
import { formatCleanProductUrl } from "./warehouse-utils";
import type { UserRole } from "@/lib/types/auth";
import { ROLE_PERMISSIONS } from "@/lib/types/auth";
import { removePendingSoldReport } from "./sold-reports-repository";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export function getSheetsClient() {
  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").replace(/['"]/g, "").trim();
  let privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/['"]/g, "").trim();
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (!email || !privateKey) {
    throw new Error(
      `GOOGLE_SHEETS_NOT_CONFIGURED: Missing ${!email ? "GOOGLE_SERVICE_ACCOUNT_EMAIL " : ""}${!privateKey ? "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY" : ""}`.trim()
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  return google.sheets({ version: "v4", auth });
}

function value(row: string[], index: number): string {
  return String(row[index] ?? "").trim();
}

function normalizeImageUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();

  // Convert Google Drive view/open links to direct high-speed thumbnail images
  const driveIdMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (driveIdMatch && driveIdMatch[1]) {
    const fileId = driveIdMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  if (trimmed.startsWith("//")) {
    return "https:" + trimmed;
  }

  return trimmed;
}

function splitPhotos(raw: string): string[] {
  return raw
    .split(/\r?\n|,|\|/)
    .map((v) => normalizeImageUrl(v))
    .filter(Boolean);
}

function numberOrNull(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/[^0-9.-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function extractWarehouseCode(sku: string, lokasi: string, rawAsalGudang: string): MasterInventoryItem["asal_gudang"] {
  const cleanRaw = (rawAsalGudang || "").trim().toUpperCase();
  const validCodes = ["GK", "BB", "SM", "BL", "ML", "RB", "KG", "PY", "PE", "SK", "WT", "ON", "RK"];
  if (validCodes.includes(cleanRaw)) {
    return cleanRaw as MasterInventoryItem["asal_gudang"];
  }

  // Extract from SKU prefix: e.g. "GK-1234", "BBK-GK-1234", "RK-1234", "SK-1234", "KG-1234"
  const upperSku = (sku || "").toUpperCase().trim();
  const match = upperSku.match(/^(?:BBK[-_]?)?([A-Z]{2,4})[-_0-9]/i);
  if (match && match[1]) {
    const extracted = match[1].toUpperCase();
    if (validCodes.includes(extracted)) {
      return extracted as MasterInventoryItem["asal_gudang"];
    }
  }

  // Fallback by Location text
  const upperLokasi = (lokasi || "").toUpperCase();
  if (upperLokasi.includes("RAWAKALONG") || upperLokasi.includes("RIZKI")) return "RK";
  if (upperLokasi.includes("SANJAYA")) return "SK";
  if (upperLokasi.includes("GEMBEL")) return "KG";
  if (upperLokasi.includes("SAWANGAN")) return "PE";
  if (upperLokasi.includes("SETU")) return "PY";
  if (upperLokasi.includes("KEDAUNG")) return "WT";
  if (upperLokasi.includes("PAMULANG BARAT")) return "ML";
  if (upperLokasi.includes("PAMULANG 2") || upperLokasi.includes("PAMULANG")) return "GK";

  return "GK";
}

function parseRawDateString(raw: string): string {
  if (!raw) return "";
  const str = String(raw).trim();
  const num = Number(str);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().replace('T', ' ').substring(0, 19);
    }
  }
  return str;
}

function toItem(row: string[]): MasterInventoryItem {
  const photos = splitPhotos(value(row, 13));
  const status = value(row, 4) as MasterInventoryItem["STATUS_UNIT"];
  const pipeline = value(row, 5) as MasterInventoryItem["STATUS_PIPELINE"];
  const sku = value(row, 0);
  const lokasi = value(row, 6);
  const rawGudang = value(row, 24);

  return {
    SKU: sku,
    PRODUCT_TITLE: value(row, 1),
    SEO_TITLE: value(row, 2),
    CATEGORY_SLUG: value(row, 3),
    CATEGORY_NAME: value(row, 3),
    STATUS_UNIT: status || "AVAILABLE",
    STATUS_PIPELINE: pipeline || "ERROR",
    LOKASI_UNIT: lokasi,
    KONDISI_UNIT: value(row, 7),
    SHORT_DESCRIPTION: value(row, 8),
    FULL_DESCRIPTION: value(row, 9),
    SPESIFIKASI: {},
    YOAST_KEYWORD: value(row, 10),
    YOAST_DESCRIPTION: value(row, 11),
    FEATURED_IMAGE: normalizeImageUrl(value(row, 12)) || photos[0] || "",
    PHOTO_URLS: photos,
    TANGGAL_MASUK: parseRawDateString(value(row, 14)),
    TANGGAL_TERJUAL: parseRawDateString(value(row, 15)) || null,
    DURASI_TERJUAL: numberOrNull(value(row, 16)),
    LINK_TELEGRAM: value(row, 17),
    PRODUCT_ID: value(row, 18),
    IS_DIRTY: value(row, 19).toLowerCase() === "true",
    image_alt: value(row, 20),
    image_title: value(row, 21),
    image_caption: value(row, 22),
    image_description: value(row, 23),
    asal_gudang: extractWarehouseCode(sku, lokasi, rawGudang),
    // Official HubScript / Publish-to-Woo schema:
    // Z=HARGA_MODAL, AA=HARGA_BUKA_WA, AB=HARGA_DEAL_WA,
    // AC=HARGA_FLOOR_WA, AD=MARGIN_FLOOR, AE=MARGIN_DEAL,
    // AF=STATUS_GUARDRAIL, AG=blank spacer, AH=LINK_UNIT.
    // The public display price is intentionally derived from HARGA_BUKA_WA;
    // HARGA_ESTIMASI_PUBLIK is a legacy application field, not a Sheets column.
    HARGA_MODAL: numberOrNull(value(row, 25)) ?? undefined,
    HARGA_BUKA_WA: numberOrNull(value(row, 26)) ?? undefined,
    HARGA_ESTIMASI_PUBLIK: numberOrNull(value(row, 26)),
    HARGA_DEAL_WA: numberOrNull(value(row, 27)) ?? undefined,
    HARGA_FLOOR_WA: numberOrNull(value(row, 28)) ?? undefined,
    MARGIN_FLOOR: numberOrNull(value(row, 29)) ?? undefined,
    STATUS_GUARDRAIL: (value(row, 31) || "SAFE") as MasterInventoryItem["STATUS_GUARDRAIL"],
    LAST_CHECKED_TELEGRAM: parseRawDateString(value(row, 32)) || undefined,
    HARGA_CLOSING: numberOrNull(value(row, 32)) ?? undefined,
    LINK_UNIT: formatCleanProductUrl(value(row, 1), value(row, 33)),
  };
}

export async function getGoogleSheetsInventory(): Promise<MasterInventoryItem[]> {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "").replace(/['"]/g, "").trim();
  const range = (process.env.GOOGLE_SHEETS_RANGE || "MASTER_INVENTORY!A:AI").replace(/['"]/g, "").trim();

  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_NOT_CONFIGURED: Missing GOOGLE_SHEETS_SPREADSHEET_ID");

  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = response.data.values ?? [];
  if (rows.length <= 1) return [];

  // Header row is row 1; data starts at row 2.
  return rows.slice(1)
    .map((row) => toItem(row as string[]))
    .filter((item) => Boolean(item.SKU));
}

function maskForRole(item: MasterInventoryItem, role: UserRole): MasterInventoryItem {
  const permissions = ROLE_PERMISSIONS[role];
  const copy = { ...item };

  if (!permissions.canViewInternalCost) delete copy.HARGA_MODAL;
  if (!permissions.canViewFloorPrice) {
    delete copy.HARGA_FLOOR_WA;
    delete copy.MARGIN_FLOOR;
  }
  if (!permissions.canViewDealPrice) {
    delete copy.HARGA_DEAL_WA;
    delete copy.MARGIN_DEAL;
  }
  if (!permissions.canViewTelegramLink) delete copy.LINK_TELEGRAM;
  if (!permissions.canViewSupplierData || permissions.isInvestorRestricted) {
    delete copy.supplier_code;
    delete copy.internal_notes;
  }

  return copy;
}

export async function queryGoogleSheetsInventory(
  options: InventoryFilterOptions = {},
  role: UserRole
): Promise<PaginatedInventoryResponse> {
  const allItems = await getGoogleSheetsInventory();
  let filtered = [...allItems];

  if (options.search) {
    const q = options.search.toLowerCase().trim();
    const qAlpha = q.replace(/[^a-z0-9]/g, "");
    filtered = filtered.filter((item) => {
      const sku = (item.SKU || "").toLowerCase();
      const skuAlpha = sku.replace(/[^a-z0-9]/g, "");
      const title = (item.PRODUCT_TITLE || "").toLowerCase();
      const cat = (item.CATEGORY_SLUG || "").toLowerCase();
      const loc = (item.LOKASI_UNIT || "").toLowerCase();
      const prodId = String(item.PRODUCT_ID ?? "").toLowerCase();

      return (
        sku.includes(q) ||
        (qAlpha.length > 0 && skuAlpha.includes(qAlpha)) ||
        (prodId && (prodId.includes(q) || prodId === q)) ||
        title.includes(q) ||
        cat.includes(q) ||
        loc.includes(q)
      );
    });
  }

  if (options.category && options.category !== "ALL") {
    const cat = options.category.toLowerCase().trim();
    const parentGroup = OFFICIAL_CATEGORIES.find((g) => g.slug === cat);
    const validSlugs = parentGroup
      ? [cat, ...parentGroup.children.map((c) => c.slug)]
      : [cat];

    filtered = filtered.filter((item) => {
      const slug = (item.CATEGORY_SLUG || "").toLowerCase().trim();
      const name = (item.CATEGORY_NAME || "").toLowerCase().trim();
      const title = (item.PRODUCT_TITLE || "").toLowerCase();

      return (
        validSlugs.some((s) => slug === s || slug.includes(s) || s.includes(slug)) ||
        name.includes(cat) ||
        title.includes(cat)
      );
    });
  }
  if (options.location && options.location !== "ALL") {
    filtered = filtered.filter((item) => item.LOKASI_UNIT.includes(options.location!));
  }
  if (options.warehouse && options.warehouse !== "ALL") {
    const wh = options.warehouse.toUpperCase().trim();
    filtered = filtered.filter((item) => {
      const code = (item.asal_gudang || "").toUpperCase();
      if (code === wh) return true;
      const sku = (item.SKU || "").toUpperCase();
      return (
        sku.startsWith(`${wh}-`) ||
        sku.startsWith(`${wh}_`) ||
        sku.startsWith(`BBK-${wh}-`) ||
        sku.startsWith(`BBK_${wh}_`) ||
        sku.includes(`-${wh}-`)
      );
    });
  }
  if (options.statusUnit && options.statusUnit !== "ALL") {
    if (options.statusUnit === "READY") {
      filtered = filtered.filter(
        (item) => item.STATUS_UNIT === "READY" || item.STATUS_UNIT === "AVAILABLE"
      );
    } else {
      filtered = filtered.filter((item) => item.STATUS_UNIT === options.statusUnit);
    }
  }
  if (options.statusPipeline && options.statusPipeline !== "ALL") {
    filtered = filtered.filter((item) => item.STATUS_PIPELINE === options.statusPipeline);
  }
  if (options.guardrailStatus && options.guardrailStatus !== "ALL") {
    filtered = filtered.filter((item) => item.STATUS_GUARDRAIL === options.guardrailStatus);
  }
  if (options.isDirty !== undefined) {
    filtered = filtered.filter((item) => item.IS_DIRTY === options.isDirty);
  }
  if (options.hasProductId) {
    filtered = filtered.filter((item) => {
      const pid = String(item.PRODUCT_ID || "").trim();
      return pid !== "" && pid !== "0" && pid !== "null" && pid !== "undefined";
    });
  }

  const stats = {
    totalUnits: allItems.length,
    availableUnits: allItems.filter((i) => i.STATUS_UNIT === "AVAILABLE" || i.STATUS_UNIT === "READY").length,
    soldUnits: allItems.filter((i) => i.STATUS_UNIT === "SOLD").length,
    pendingPhotos: allItems.filter((i) => i.STATUS_PIPELINE === "PENDING_PHOTOS").length,
    readyToPublish: allItems.filter((i) => i.STATUS_PIPELINE === "READY_TO_PUBLISH").length,
    published: allItems.filter((i) => i.STATUS_PIPELINE === "PUBLISHED").length,
    errors: allItems.filter((i) => i.STATUS_PIPELINE === "ERROR").length,
    ambiguous: allItems.filter((i) => i.STATUS_PIPELINE === "AMBIGUOUS" || i.STATUS_UNIT === "AMBIGUOUS").length,
    dirtyCount: allItems.filter((i) => i.IS_DIRTY).length,
  };

  // Default: Sort by SKU number descending (Newest BBK at the top)
  filtered.sort((a, b) => {
    if (options.sortBy && options.sortBy !== "TANGGAL_MASUK" && options.sortBy !== "SKU") {
      const av = a[options.sortBy as keyof MasterInventoryItem];
      const bv = b[options.sortBy as keyof MasterInventoryItem];
      if (av == null) return 1;
      if (bv == null) return -1;
      const dir = options.sortOrder === "asc" ? 1 : -1;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    }

    const numA = parseInt(String(a.SKU || "").replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(String(b.SKU || "").replace(/\D/g, ""), 10) || 0;
    if (numA !== numB) {
      return numB - numA; // Descending: BBK2803, BBK2802, BBK2801...
    }
    return (b.SKU || "").localeCompare(a.SKU || "");
  });

  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(5, Math.min(100, options.pageSize || 25));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = filtered
    .slice((page - 1) * pageSize, page * pageSize)
    .map((item) => maskForRole(item, role));

  return { items, total, page, pageSize, totalPages, stats };
}

export async function findRowIndexBySku(sku: string): Promise<{ rowIndex: number; rowData?: string[] } | null> {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "").replace(/['"]/g, "").trim();
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_NOT_CONFIGURED");

  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "MASTER_INVENTORY!A:S",
  });

  const rows = response.data.values ?? [];
  const rawSku = (sku || "").trim();
  const upperSku = rawSku.toUpperCase();
  const alphanumericSku = upperSku.replace(/[^A-Z0-9]/g, "");
  const numericOnly = upperSku.replace(/[^0-9]/g, "");

  // 1. Exact & Alphanumeric Matching across all rows
  for (let i = 1; i < rows.length; i++) {
    const rowSku = String(rows[i][0] ?? "").trim();
    const upperRowSku = rowSku.toUpperCase();
    const alphaRowSku = upperRowSku.replace(/[^A-Z0-9]/g, "");
    const rowProductId = String(rows[i][18] ?? "").trim();

    // Exact Match
    if (upperRowSku === upperSku) {
      return { rowIndex: i + 1, rowData: rows[i] as string[] };
    }

    // Alphanumeric Match (e.g. "BBK-2766" <=> "BBK2766")
    if (alphaRowSku && alphanumericSku && alphaRowSku === alphanumericSku) {
      return { rowIndex: i + 1, rowData: rows[i] as string[] };
    }

    // Product ID Match
    if (rowProductId && (rowProductId === upperSku || (numericOnly && rowProductId === numericOnly))) {
      return { rowIndex: i + 1, rowData: rows[i] as string[] };
    }
  }

  // 2. Numeric row index fallback (e.g. "BBK2766" refers to row 2766 in sheet)
  if (numericOnly) {
    const candidateRowIndex = Number(numericOnly);
    // Row 2 is index 1, row N is index N - 1
    if (candidateRowIndex >= 2 && candidateRowIndex <= rows.length) {
      return { rowIndex: candidateRowIndex, rowData: rows[candidateRowIndex - 1] as string[] };
    }
  }

  return null;
}

export async function syncDirectToWooCommerceAndWebhook(payload: {
  sku: string;
  status: "SOLD" | "READY" | "AVAILABLE";
  productId?: string;
  tanggalTerjual?: string;
  durasiTerjual?: string;
  dealPrice?: number;
}): Promise<{ success: boolean; errors?: string[] }> {
  const errors: string[] = [];
  const stockStatus = payload.status === "SOLD" ? "outofstock" : "instock";

  // 1. DIRECT SYNC KE WORDPRESS WOOCOMMERCE REST API (Snippet #2)
  const domainsToTry = [
    (process.env.WOO_DOMAIN || "").replace(/\/$/, ""),
    (process.env.NEXT_PUBLIC_WORDPRESS_URL || "").replace(/\/$/, ""),
    "https://origin.bukanbarukitchen.com",
    "https://www.bukanbarukitchen.com",
  ].filter(Boolean);

  const secretKey = process.env.BBK_API_SECRET || "BBK_SECRET_KEY_2026_XYZ123";
  let wooSuccess = false;

  for (const wpDomain of domainsToTry) {
    if (wooSuccess) break;
    try {
      const wpUrl = `${wpDomain}/wp-json/bbk/v1/update-status?bbk_secret=${encodeURIComponent(secretKey)}`;
      const wpRes = await fetch(wpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BBK-Secret": secretKey,
          "x-bbk-secret": secretKey,
          "x_bbk_secret": secretKey,
        },
        body: JSON.stringify({
          sku: payload.sku,
          product_id: payload.productId,
          status: payload.status,
          stock_status: stockStatus,
          tanggal_terjual: payload.tanggalTerjual,
          harga_deal_wa: payload.dealPrice,
        }),
      });

      if (wpRes.ok) {
        wooSuccess = true;
        break;
      }
    } catch (err: any) {
      console.warn(`Woo sync to ${wpDomain} failed:`, err?.message || err);
    }
  }

  if (!wooSuccess) {
    errors.push("WordPress update-status endpoint did not respond OK");
  }

  // 2. SYNC KE GOOGLE APPS SCRIPT WEBHOOK (Snippet #3)
  const webhookUrl =
    process.env.APPS_SCRIPT_STOCK_WEBHOOK_URL?.trim() ||
    "https://script.google.com/macros/s/AKfycby7x_1Ityqekh8_nk3IsLJoFUGFm-avvp3rcYNJ4EXBq1MHle7Ma3Yph6paYoa3lEKL/exec";

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: payload.productId,
        sku: payload.sku,
        status: payload.status,
        tanggal_terjual: payload.tanggalTerjual,
        durasi_terjual: payload.durasiTerjual,
      }),
    });
  } catch (err: any) {
    console.warn("Apps Script webhook sync warning:", err?.message || err);
  }

  return { success: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

export async function triggerAppsScriptStockWebhook(payload: {
  sku: string;
  status: "SOLD" | "READY" | "AVAILABLE";
  product_id?: string;
  tanggal_terjual?: string;
  durasi_terjual?: string;
}): Promise<{ success: boolean; error?: string }> {
  return syncDirectToWooCommerceAndWebhook({
    sku: payload.sku,
    status: payload.status,
    productId: payload.product_id,
    tanggalTerjual: payload.tanggal_terjual,
    durasiTerjual: payload.durasi_terjual,
  });
}

export async function updateGoogleSheetsStockStatus(input: {
  sku: string;
  status: "SOLD" | "READY" | "AVAILABLE";
  dealPrice?: number;
  notes?: string;
  productId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_NOT_CONFIGURED");

  const target = await findRowIndexBySku(input.sku);
  if (!target) {
    return { success: false, error: `Unit with SKU ${input.sku} not found in Google Sheets` };
  }

  const { rowIndex, rowData } = target;
  const sheets = getSheetsClient();
  const now = new Date();
  const todayFormatted = now.toISOString().replace("T", " ").substring(0, 19);

  let durasiStr = "";
  if (input.status === "SOLD") {
    const tanggalMasukRaw = rowData?.[14]; // Column O
    if (tanggalMasukRaw) {
      try {
        const tglMasuk = new Date(tanggalMasukRaw);
        const diffDays = Math.max(0, Math.floor((now.getTime() - tglMasuk.getTime()) / (1000 * 60 * 60 * 24)));
        durasiStr = `${diffDays} hari`;
      } catch {
        durasiStr = "0 hari";
      }
    }
  }

  // 1. Update Column E (STATUS_UNIT)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `MASTER_INVENTORY!E${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[input.status]] },
  });

  // 2. Update Column P (TANGGAL_TERJUAL) and Column Q (DURASI_TERJUAL)
  const soldValues = input.status === "SOLD" ? [[todayFormatted, durasiStr]] : [["", ""]];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `MASTER_INVENTORY!P${rowIndex}:Q${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: soldValues },
  });

  // 3. Update Column AB (HARGA_DEAL_WA) if deal price provided & clean up LAPORAN_TERJUAL sheet
  if (input.status === "SOLD") {
    if (input.dealPrice !== undefined && input.dealPrice > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `MASTER_INVENTORY!AB${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[input.dealPrice]] },
      }).catch(() => {});
    }
    // Auto-remove pending record from LAPORAN_TERJUAL sheet upon execution!
    await removePendingSoldReport(input.sku).catch((err) =>
      console.warn(`Could not remove pending sold report for SKU ${input.sku}:`, err)
    );
  } else if (input.status === "READY" || input.status === "AVAILABLE") {
    // Also clean up any lingering pending report on status reset
    await removePendingSoldReport(input.sku).catch(() => {});
  }

  // 4. Trigger Direct WooCommerce API and Apps Script Webhook
  await syncDirectToWooCommerceAndWebhook({
    sku: input.sku,
    status: input.status,
    productId: input.productId || rowData?.[18],
    tanggalTerjual: input.status === "SOLD" ? todayFormatted : undefined,
    durasiTerjual: durasiStr || undefined,
    dealPrice: input.dealPrice,
  }).catch((e) => console.warn("Stock sync trigger warning:", e));

  return { success: true };
}

export async function updateGoogleSheetsPipelineStatus(input: {
  sku: string;
  newStatus: string;
  clearDirty?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_NOT_CONFIGURED");

  const target = await findRowIndexBySku(input.sku);
  if (!target) {
    return { success: false, error: `Unit with SKU ${input.sku} not found in Google Sheets` };
  }

  const { rowIndex } = target;
  const sheets = getSheetsClient();

  // 1. Update Column F (STATUS_PIPELINE)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `MASTER_INVENTORY!F${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[input.newStatus]] },
  });

  // 2. Clear dirty flag in Column T if requested
  if (input.clearDirty) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `MASTER_INVENTORY!T${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["OPTIMIZED"]] },
    });
  }

  return { success: true };
}

export async function updateGoogleSheetsTelegramAudit(
  sku: string,
  timestampStr: string
): Promise<{ success: boolean; error?: string }> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_NOT_CONFIGURED");

  const target = await findRowIndexBySku(sku);
  if (!target) {
    return { success: false, error: `Unit with SKU ${sku} not found in Google Sheets` };
  }

  const { rowIndex } = target;
  const sheets = getSheetsClient();

  // Update Column AG (LAST_CHECKED_TELEGRAM)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `MASTER_INVENTORY!AG${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[timestampStr]] },
  });

  return { success: true };
}


