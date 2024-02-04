export type PlbOrder = {
  base_cost: number;
  buyer_refunded_selling_price: number;
  buyer_refunded_tipping_fee: number;
  discount_base_cost: number;
  id: number;
  merchant_refunded_payment_fee: number;
  merchant_refunded_processing_fee: number;
  merchant_refunded_shipping_fee: number;
  merchant_refunded_tax_fee: number;
  origin_profit: number;
  payment_fee: number;
  payment_fee_rate: number;
  processing_fee: number;
  processing_rate: number;
  profit: number;
  refunded_base_cost: number;
  refunded_processing_fee: number;
  refunded_shipping_fee: number;
  sb_order_id: number;
  shipping_fee: number;
  shop_id: number;
  status: string;
  line_items?: Array<PlbLineItem>;
};

export type PlbLineItem = {
  id: number;
  sb_order_id: number;
  base_cost: number;
  sb_line_item_id: number;
  profit: number;
};

export type PlbRefundInput = {
  refund_seller_base_cost?: number;
  refund_seller_shipping?: number;
  refund_seller_processing?: number;
  refund_seller_payment?: number;
  refund_seller_tax?: number;
  refund_buyer_selling?: number;
  refund_buyer_tip?: number;
  refund_buyer_shipping?: number;
  refund_buyer_payment?: number;
  refund_buyer_tax?: number;
};

export type PlbLineRefundQty = {
  product_name?: string;
  variant_title?: string;
  variant_id?: number;
  quantity?: number;
  is_combo?: boolean;
  is_ppc?: boolean;
};

export type PlbRefundCase = {
  is_full_refund?: boolean;
  ignore_refund_buyer?: boolean;
  ignore_refund_seller?: boolean;
  input?: PlbRefundInput;
  lines?: Array<PlbLineRefundQty>;
};
