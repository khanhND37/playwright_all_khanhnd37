export type InvoiceFilter = {
  domain?: string;
  invoice?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  amount?: string;
  value_amount?: string;
};

export type TransactionFilter = {
  domain?: string;
  invoice?: string;
  status?: string;
  created_from_date?: string;
  created_to_date?: string;
  available_from_date?: string;
  available_to_date?: string;
  amount?: string;
  value_amount?: string;
  source?: string;
};

type DataInvoice = {
  amount_display?: string;
  shop_name?: string;
  domain?: string;
  content?: string;
  amount?: string;
  status?: string;
  type?: string;
  created_date?: string;
  latest_transaction_date?: string;
  available_date?: string;
  balance?: string;
  invoice_collapsed?: string;
  source_collapsed?: string;
};

type TransctionDetails = {
  type?: string;
  content?: string;
  amount?: number;
  status?: string;
};

type DataInvoiceDetail = {
  amount_display?: string;
  shop_name?: string;
  domain?: string;
  content?: string;
  amount?: string;
  status?: string;
  type?: string;
  detail?: string;
  transactions_type?: string;
  transactions_content?: string;
  transactions_status?: string;
  transactions?: Array<TransctionDetails>;
};

export type BalanceValue = {
  currentAvailableBalance: number;
  availableToPayout: number;
  total: number;
};

export type ReleaseDetails = {
  amount: number;
  time: string;
};

export type AvailableSoonDetail = {
  last_release: ReleaseDetails;
  next_release: ReleaseDetails;
};

export type BalanceBucket = {
  available_payout: number;
  available_soon: number;
  bucket_code: "spay" | "printbase" | "plusbase" | "credit_card" | "other";
};

export type DataBalance = {
  available_amount: number;
  available_payout: number;
  available_soon: number;
  available_soon_detail?: AvailableSoonDetail;
  balance_buckets?: Array<BalanceBucket>;
  pending_amount?: number;
};

export type DataInvoicePlb = {
  amount_cent?: number;
  details?: string;
  available_at?: string;
  metadata?: string;
  transaction_type?: string;
};

export type DataHoldFromPayout = {
  order_ids: number[];
  hold_amount?: HoldAmount;
  reason?: string;
  release_setting?: ReleaseSetting;
};

export type HoldAmount = {
  type: string;
  value: number;
};

export type HoldBalanceApiResponse = {
  complete_order_ids: [number];
  failed_order_ids: [number];
  errors: Map<string, string>;
};

export type ReleaseSetting = {
  release_type: string;
  relative_time: string;
  abs_time: string;
};

export type ReleaseHoldFromPayoutResponse = {
  complete_order_ids: [number];
  failed_order_ids: [number];
  errors: Map<string, string>;
};
