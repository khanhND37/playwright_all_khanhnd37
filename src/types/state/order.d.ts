export type EditOrder = {
  product_name: string;
  quantity: number;
  price?: number;
};

export type Order = {
  id?: number;
  subtotal?: number;
  total?: number;
  shipping_fee?: number;
  discount?: number;
  tax_amount?: number;
  is_tax_include?: boolean;
  tip?: number;
  basecost?: number;
  shipping_cost?: number;
  paid_by_customer?: number;
  revenue?: number;
  handling_fee?: number;
  profit?: number;
  processing_fee?: number;
  payment_fee?: number;
};

export type CheckoutOrdInfo = {
  total_amount: string;
  payment_gateway: string;
  item_post_purchase_value?: string;
  account_name?: string;
  ending_card_no?: string;
};

export type RefundOrderInput = {
  product_name: string[];
  qty: number;
  refund_seller: {
    enable: boolean;
    product_cost?: number;
    shipping_fee?: number;
    manual_design_fee?: number;
    recover_processing_fee?: number;
    recover_payment_fee?: number;
    refund_taxes?: number;
  };
  refund_buyer: {
    enable: boolean;
    refund_selling_price?: number;
    refund_tip?: number;
    refund_shipping_fee?: number;
    recover_payment_fee?: number;
    refund_taxes?: number;
  };
};

export type ProfitLineItem = {
  summary: {
    id: number;
    profit: number;
  };
  sbase: {
    id: number;
    profit: number;
  };
  upsell: {
    id: number;
    profit: number;
  };
};

export type ValueLineItem = {
  totalByLineItem: number;
  subtotalByLineItem: number;
  discountByLineItem: number;
  markupShippingByLineItem: number;
  taxIncludeByLineItem: number;
  tipByLineItem: number;
};

export type FraudInfo = {
  id: number;
  name: string;
  type: string;
  status: string;
  orders_affected: number;
};

export type TaxInfo = {
  type?: "exclude" | "include";
  rate?: number;
};

export type StripeOrderShipping = {
  tracking_number?: string;
};

export type StripeOrderInfo = {
  shipping: StripeOrderShipping;
  amount: number;
  payment_method_types: string[];
  charges: {
    data: Array<ChargeData>;
  };
  metadata: {
    fee_hash: string;
    intl_fee: string;
  };
  exchange_rate: number;
};

export type ChargeData = {
  refunds: {
    data: Array<RefundData>;
  };
  status: string;
  amount_refunded: number;
  amount_captured: number;
  dispute: DisputeData;
};

export type DisputeData = {
  status: string;
  balance_transactions: Array<BalanceTransactions>;
};

export type BalanceTransactions = {
  amount: number;
  fee: number;
  net: number;
  exchange_rate: number;
};

export type RefundData = {
  object: string;
};

export type TaxAmount = {
  tax_include?: number;
  tax_exclude?: number;
};

export type ManualCapture = {
  order_capture_payments: ManualCaptureDatas[];
};
export type ManualCaptureDatas = {
  order_id: number;
  total_capture: number;
};

export type OrdInfoInStripe = {
  key: string;
  stripe_secret_key?: string;
  stripe_platform_secret_key?: string;
  gatewayCode?: "stripe" | "platform" | string;
  connectedAcc?: string;
  paymentIntendId?: string;
  transactionId?: string;
  isDisputed?: boolean;
  isHaveTrackingNumber?: boolean;
};
export type InfoUTMParameters = {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
};

export type DataHoldPayOut = {
  hold_amount?: OrderHoldAmount;
  reason?: string;
  available_date?: AvailableDate;
};

export type OrderHoldAmount = {
  option?: string;
  amount?: number;
  code?: string;
};

export type AvailableDate = {
  option?: string;
  date?: string;
  day?: number;
  start_date?: string;
  end_date?: string;
};

export type TransactionInfoInRazorpay = {
  id: string;
  total_amount: number;
  currency: string;
  status: string;
};

export type PaymentInfoInRazorpay = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  amountRefunded: number;
  refundStatus: string;
  captured: boolean;
};

export type DataShippingPack = {
  split_pack?: number;
  shipping_cost?: number;
};
