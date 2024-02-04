export type StoreStatus = {
  id: number;
  status: string;
  payment_status: string;
  end_free_trial_at?: number;
  subscription_expired_at?: number;
  package: string;
  package_type: string;
  package_id: [];
  charge_sub: boolean;
};

export type TopUpReconmendInfo = {
  current_balance: string;
  charge_amount: string;
  end_free_trial_at: string;
};

export type LogBackInfo = {
  is_success: boolean;
  is_balance_insufficient: boolean;
};

export type InfoInvoiceBilling = {
  id: string;
  amount: number;
  billing_period_end: string;
  billing_period_start: string;
  invoice_name: string;
};

export type InfoReviewSub = {
  price?: string;
  startCycle?: string;
  endCycle?: string;
};
