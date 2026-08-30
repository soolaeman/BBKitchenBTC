import { google } from "googleapis";
import type { MasterInventoryItem, InventoryFilterOptions, PaginatedInventoryResponse } from "@/lib/types/inventory";
import type { UserRole } from "@/lib/types/auth";
import { ROLE_PERMISSIONS } from "@/lib/types/auth";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getSheetsClient() {
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

function splitPhotos(raw: string): string[] {
  return raw
    .split(/\r?\n|,/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function numberOrNull(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/[^0-9.-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function toItem(row: string[]): MasterInventoryItem {
  const photos = splitPhotos(value(row, 13));
  const status = value(row, 4) as MasterInventoryItem["STATUS_UNIT"];
  const pipeline = value(row, 5) as MasterInventoryItem["STATUS_PIPELINE"];

  return {
    SKU: value(row, 0),
    PRODUCT_TITLE: value(row, 1),
    SEO_TITLE: value(row, 2),
    CATEGORY_SLUG: value(row, 3),
    CATEGORY_NAME: value(row, 3),
    STATUS_UNIT: status || "AVAILABLE",
    STATUS_PIPELINE: pipeline || "ERROR",
    LOKASI_UNIT: value(row, 6),
    KONDISI_UNIT: value(row, 7),
    SHORT_DESCRIPTION: value(row, 8),
    FULL_DESCRIPTION: value(row, 9),
    SPESIFIKASI: {},
    YOAST_KEYWORD: value(row, 10),
    YOAST_DESCRIPTION: value(row, 11),
    FEATURED_IMAGE: value(row, 12) || photos[0] || "",
    PHOTO_URLS: photos,
    TANGGAL_MASUK: value(row, 14),
    TANGGAL_TERJUAL: value(row, 15) || null,
    DURASI_TERJUAL: numberOrNull(value(row, 16)),
    LINK_TELEGRAM: value(row, 17),
    PRODUCT_ID: value(row, 18),
    IS_DIRTY: value(row, 19).toLowerCase() === "true",
    image_alt: value(row, 20),
    image_title: value(row, 21),
    image_caption: value(row, 22),
    image_description: value(row, 23),
    asal_gudang: value(row, 24) as MasterInventoryItem["asal_gudang"],
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
    MARGIN_DEAL: numberOrNull(value(row, 30)) ?? undefined,
    STATUS_GUARDRAIL: (value(row, 31) || "SAFE") as MasterInventoryItem["STATUS_GUARDRAIL"],
    LINK_UNIT: value(row, 33),
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
    const q = options.search.toLowerCase();
    filtered = filtered.filter((item) =>
      [item.SKU, item.PRODUCT_TITLE, item.CATEGORY_SLUG, item.LOKASI_UNIT]
        .some((v) => v.toLowerCase().includes(q))
    );
  }

  if (options.category && options.category !== "ALL") {
    filtered = filtered.filter((item) => item.CATEGORY_SLUG === options.category);
  }
  if (options.location && options.location !== "ALL") {
    filtered = filtered.filter((item) => item.LOKASI_UNIT.includes(options.location!));
  }
  if (options.warehouse && options.warehouse !== "ALL") {
    filtered = filtered.filter((item) => item.asal_gudang === options.warehouse);
  }
  if (options.statusUnit && options.statusUnit !== "ALL") {
    filtered = filtered.filter((item) => item.STATUS_UNIT === options.statusUnit);
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

  const sortBy = options.sortBy || "TANGGAL_MASUK";
  const direction = options.sortOrder === "asc" ? 1 : -1;

  filtered.sort((a, b) => {
    const av = a[sortBy as keyof MasterInventoryItem];
    const bv = b[sortBy as keyof MasterInventoryItem];
    if (av == null) return 1;
    if (bv == null) return -1;
    return String(av).localeCompare(String(bv), undefined, { numeric: true }) * direction;
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
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_NOT_CONFIGURED");

  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "MASTER_INVENTORY!A:S",
  });

  const rows = response.data.values ?? [];
  const normalizedSku = sku.trim().toUpperCase();

  for (let i = 1; i < rows.length; i++) {
    const rowSku = String(rows[i][0] ?? "").trim().toUpperCase();
    const rowProductId = String(rows[i][18] ?? "").trim();
    if (rowSku === normalizedSku || (rowProductId && rowProductId === normalizedSku)) {
      return { rowIndex: i + 1, rowData: rows[i] as string[] }; // 1-based index
    }
  }

  return null;
}

export async function triggerAppsScriptStockWebhook(payload: {
  sku: string;
  status: "SOLD" | "READY" | "AVAILABLE";
  product_id?: string;
  tanggal_terjual?: string;
  durasi_terjual?: string;
}): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.APPS_SCRIPT_STOCK_WEBHOOK_URL?.trim();
  if (!webhookUrl) return { success: false, error: "APPS_SCRIPT_STOCK_WEBHOOK_NOT_CONFIGURED" };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, error: `Apps Script HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to trigger Apps Script stock webhook:", err);
    return { success: false, error: err.message || "Webhook network error" };
  }
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

  // 3. Update Column AB (HARGA_DEAL_WA) if provided
  if (input.dealPrice !== undefined && input.dealPrice > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `MASTER_INVENTORY!AB${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[input.dealPrice]] },
    });
  }

  // 4. Trigger Webhook in parallel / background
  triggerAppsScriptStockWebhook({
    sku: input.sku,
    status: input.status,
    product_id: input.productId || rowData?.[18],
    tanggal_terjual: input.status === "SOLD" ? todayFormatted : undefined,
    durasi_terjual: durasiStr || undefined,
  }).catch((e) => console.warn("Background stock webhook trigger failed:", e));

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

