export type CashflowType = 'PENGELUARAN' | 'PEMASUKAN_LAIN';

export const EXPENSE_CATEGORIES = [
  'LOGISTIK & KIRIM',
  'OPERASIONAL & IT',
  'GAJI & PRIVE',
  'BAGI HASIL INVESTOR',
  'BIAYA LAINNYA',
] as const;

export const INCOME_CATEGORIES = [
  'KOMISI & REFERRAL',
  'MODAL INVESTOR',
  'PEMASUKAN LAINNYA',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type CashflowCategory = ExpenseCategory | IncomeCategory | string;

export interface CashflowEntry {
  id: string;
  tanggal: string;
  jenisKas: CashflowType;
  kategori: CashflowCategory;
  nominal: number;
  keterangan: string;
  referensiSku?: string;
  dicatatOleh: string;
  rowIndex?: number;
}

export interface CashflowSummary {
  totalDealsRevenue: number;
  totalDealsGrossProfit: number;
  totalCommissions: number;
  totalExpenses: number;
  netOperatingProfit: number;
  totalInvestorInflow: number;
  totalInvestorOutflow: number;
  netInvestorPosition: number;
  totalDealsCount: number;
}
