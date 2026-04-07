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
  amount: number;
  note?: string;
}

export type PaymentMethod = "cash" | "transfer" | "check";
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
  receipt: boolean;       // ใบเสร็จรับเงิน
  taxInvoice: boolean;    // ใบกำกับภาษี
  transferSlip: boolean;  // slip โอนเงิน
  quotation: boolean;     // ใบเสนอราคา
  other: boolean;
  otherDetail: string;    // ระบุ...
}

export interface Voucher {
  voucherNo: string;
  date: string;
  department: string;
  purpose: string;
  payee: Payee | null;
  items: VoucherItem[];
  paymentMethod: PaymentMethod;
  taxWithheld: number; // %
  discount: number;
  requestedBy: string;
  approvedBy: string;
  paidBy: string;
  note: string;
  status: VoucherStatus;
  attachments: Attachments;
}
