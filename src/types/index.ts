export type TransactionType = 'credit' | 'payment';

export interface Customer {
  id: string; // usually phone or uuid
  shopId?: string; // Tenant/Shop ownership boundary
  name: string;
  phone: string; // 10-digit clean string
  createdAt?: string;
}

export interface Transaction {
  id: string;
  shopId?: string; // Tenant/Shop ownership boundary
  phone: string; // Customer's 10-digit phone
  type: TransactionType;
  amount: number; // positive number (integer or decimal, stored as number)
  date: string; // YYYY-MM-DD
  note?: string;
  screenshotId?: string; // ID referencing IndexedDB image
}

export interface ShopProfile {
  id: string; // Stable shop identifier (e.g. 'shop_default', 'shop_lakshmi_provision')
  name: string;
  upiId?: string;
  createdAt: string;
}

export interface AppSettings {
  activeShopId: string;
  shops: ShopProfile[];
  language: 'en' | 'te'; // English default, Telugu optional
  effectiveDateOverride?: string; // Optional manual override for testing if no ?today in URL
}

export interface CustomerSummary extends Customer {
  balance: number;
  totalCredit: number;
  totalPayment: number;
  lastPaymentDate?: string;
  lastCreditDate?: string;
  daysSinceLastPayment?: number;
  daysSinceLastCredit?: number;
  transactions: Transaction[];
}

export interface OverallSummary {
  totalOutstanding: number;
  totalCustomers: number;
  customersWithBalance: number;
  topDefaulter?: CustomerSummary;
  totalCredit: number;
  totalPayment: number;
}

export interface ImportPayload {
  shop?: string;
  customers: Array<{
    name: string;
    phone: string | number;
  }>;
  entries: Array<{
    phone: string | number;
    type: string;
    amount: number | string;
    date: string;
    note?: string;
  }>;
}

export type Screen = 
  | 'dashboard'
  | 'customers'
  | 'ledger'
  | 'add-customer'
  | 'add-transaction'
  | 'overdue'
  | 'import'
  | 'more'
  | 'settings';
