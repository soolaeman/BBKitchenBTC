// Finance and Invoicing Domain Types for BBKitchen

export type InvoiceStatus =
  | 'DRAFT'
  | 'GENERATING'
  | 'GENERATED'
  | 'SENT'
  | 'PAID'
  | 'VOID'
  | 'ERROR';

export interface InvoiceItem {
  id: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  orderReference?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  paidDate?: string | null;
  paymentMethod?: 'TRANSFER_BCA' | 'TRANSFER_MANDIRI' | 'CASH_PICKUP' | 'WOOCOMMERCE_GATEWAY';
  pdfUrl?: string;
  notes?: string;
  createdBy: string;
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
