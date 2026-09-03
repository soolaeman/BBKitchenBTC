// Finance, Invoicing, and Deal Ledger Domain Types for Bukan Baru Kitchen (BBKitchen)

export type InvoiceStatus =
  | 'DRAFT'
  | 'GENERATING'
  | 'GENERATED'
  | 'SENT'
  | 'PAID'
  | 'VOID'
  | 'ERROR';

export type DocumentType =
  | 'INVOICE'      // Faktur Penagihan Resmi
  | 'RECEIPT'      // Kuitansi Pembayaran Lunas
  | 'QUOTATION'    // Surat Penawaran Harga Komersial
  | 'DELIVERY_NOTE'; // Surat Jalan & Tanda Terima Ekspedisi/Driver

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
  kuitansiNumber?: string;
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
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  validUntilDate?: string; // Untuk Quotation
  status: InvoiceStatus;
  paidDate?: string | null;
  paymentMethod?: 'TRANSFER_BCA' | 'TRANSFER_MANDIRI' | 'CASH_PICKUP' | 'WOOCOMMERCE_GATEWAY';
  
  // Shipping & Delivery Details
  deliveryDriver?: string;
  driverPhone?: string;
  deliveryVehiclePlate?: string;
  deliveryExpedition?: 'LALAMOVE' | 'DELIVEREE' | 'INTERNAL_FLEET' | 'CARGO_EKSPEDISI' | 'PICKUP_SENDIRI';
  
  salesPic?: string;
  pdfUrl?: string;
  notes?: string;
  termsConditions?: string;
  createdBy: string;
}

export interface ClosingDealItem {
  sku: string;
  productTitle: string;
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
