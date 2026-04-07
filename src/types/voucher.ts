export interface Payee {
  id: string;
  name: string;
  taxId?: string;
  bank?: string;
  accountNo?: string;
  branch?: string;
  address?: string;
}

export interface VoucherItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  taxWithheld: number; // % per item
  note?: string;
}

export type PaymentMethod = "cash" | "transfer" | "check" | "credit";
export type VoucherStatus = "draft" | "approved" | "paid";

export interface Settings {
  googleSheetUrl: string;
  companyName: string;
  companyAddress: string;
  departments: string[];
  expenseCategories: string[];
  approvers: string[];
  payers: string[];
  logoUrl?: string;
}

export interface Attachments {
  receipt: boolean;
  taxInvoice: boolean;
  transferSlip: boolean;
  quotation: boolean;
  other: boolean;
  otherDetail: string;
}

export interface Voucher {
  voucherNo: string;
  date: string;
  department: string;
  payee: Payee | null;
  items: VoucherItem[];
  paymentMethod: PaymentMethod;
  discount: number;
  requestedBy: string;
  signatureData: string;
  note: string;
  status: VoucherStatus;
  attachments: Attachments;
}
