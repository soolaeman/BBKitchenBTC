// Finance, Invoicing, and Deal Ledger Domain Types for Bukan Baru Kitchen (BBKitchen)

export type InvoiceStatus =
  | 'DRAFT'
  | 'GENERATING'
  | 'GENERATED'
  | 'SENT'
  | 'DP_PAID'
  | 'PAID'
  | 'VOID'
  | 'ERROR';

export type DocumentType =
  | 'INVOICE'        // Faktur Penagihan Resmi
  | 'QUOTATION'      // Surat Penawaran Harga Komersial
  | 'DELIVERY_NOTE'; // Surat Jalan & Tanda Terima Ekspedisi/Driver (Hanya saat LUNAS)

export interface PaymentRecord {
  id: string;
  label: string; // e.g. "Pembayaran 1 (DP)", "Pembayaran 2", "Pembayaran 3 (Pelunasan)"
  amount: number;
  date: string;  // YYYY-MM-DD
  method?: 'TRANSFER_JAGO_SYARIAH' | 'CASH_PICKUP' | string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  condition?: string;
  warehouseLocation?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  documentType?: DocumentType;
  kuitansiNumber?: string; // legacy support
  quotationNumber?: string;
  suratJalanNumber?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerCompany?: string;
  orderReference?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  dpAmount?: number;
  remainingAmount?: number;
  payments?: PaymentRecord[]; // Riwayat pembayaran termin 1, 2, dst hingga lunas
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  validUntilDate?: string; // Untuk Quotation
  status: InvoiceStatus;
  paidDate?: string | null;
  paymentMethod?: 'TRANSFER_JAGO_SYARIAH' | 'TRANSFER_BCA' | 'TRANSFER_MANDIRI' | 'CASH_PICKUP' | 'WOOCOMMERCE_GATEWAY';
  
  // Shipping & Delivery Details (Opsional dalam Invoice)
  hasShipping?: boolean;
  deliveryDriver?: string;
  driverPhone?: string;
  deliveryVehiclePlate?: string;
  deliveryExpedition?: string;
  shippingFeeType?: 'INCLUDED' | 'BUYER_COD' | 'FREE_PROMO' | 'NO_SHIPPING';
  shippingFee?: number;
  
  salesPic?: string;
  pdfUrl?: string;
  notes?: string;
  termsConditions?: string;
  createdBy: string;
}

export interface ClosingDealItem {
  sku: string;
  productTitle: string;
  category?: string;
  tanggalMasuk?: string;
  tanggalTerjual?: string;
  durasiTerjual?: string | number;
  lokasiGudang: string;
  asalGudang?: string;
  hargaModal: number;
  hargaClosing: number;
  realizedProfit: number;
  marginPercent: number;
  soldBy: 'SALES_BBK' | 'THIRD_PARTY';
  customerName?: string;
  notes?: string;
}

export interface FinancialKPIs {
  period: string;
  totalRevenue: number;
  totalCOGS: number;
  grossMarginAmount: number;
  grossMarginPercentage: number;
  unitsSold: number;
  averageOrderValue: number;
  averageUnitMargin: number;
  outstandingInvoicesAmount: number;
  paidInvoicesAmount: number;
  inventoryAssetValue: number;
}
