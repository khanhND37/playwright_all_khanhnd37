export type SearchSbOrder = {
  search?: string;
  shopType?: string;
  requestFields?: string;
  plb_profit?: boolean;
  name?: string;
  financial_status?: string;
  created_at_min?: string;
  created_at_max?: string;
  x_test_created_at_min_time?: Date;
  x_test_created_at_max_time?: Date;
};

export type SbOrderLineShippingRate = {
  additional_item_price?: number;
  code?: number;
  first_item_price?: number;
  is_first_line_item?: boolean;
  origin_price?: number;
  original_additional_item_price?: number;
  original_first_item_price?: number;
  price?: number;
  variant_id?: number;
};

export type SbOrderLineMetadata = {
  edited_order_old_variant?: string;
  is_post_purchase?: boolean;
  source?: string;
};
export type SbOrderLine = {
  id?: number;
  fulfillable_quantity?: number;
  is_post_purchase_item?: boolean;
  line_item_discount_amount?: number;
  line_item_discount_price?: number;
  line_item_price?: number;
  line_item_price_after_discount?: number;
  line_item_price_before_discount?: number;
  line_item_weight?: number;
  metadata?: SbOrderLineMetadata;
  price?: number;
  product_id?: number;
  profit?: number;
  quantity?: number;
  raw_price?: number;
  raw_weight?: number;
  requires_shipping?: boolean;
  shipping_rate?: SbOrderLineShippingRate;
  sku?: string;
  source?: string;
  source_id?: number;
  tax_amount?: number;
  tax_rate?: number;
  taxable?: number;
  title?: string;
  total_discount?: number;
  variant_id?: number;
  variant_title?: string;
  vendor?: string;
  weight?: number;
  weight_unit?: string;
  sourcing_product_title?: string;
};

export type SbORefundAdjustment = {
  amount?: number;
  kind?: string;
  order_id?: number;
  reason?: string;
  tax_amount?: number;
};

export type SbORefundLineItem = {
  id?: number;
  is_post_purchase_item?: boolean;
  line_item_discount_amount?: number;
  line_item_discount_price?: number;
  line_item_price?: number;
  line_item_price_after_discount?: number;
  line_item_price_before_discount?: number;
  line_item_weight?: number;
  name?: string;
  order_id?: number;
  price?: number;
  quantity?: number;
  raw_price?: number;
  requires_shipping?: boolean;
  sku?: string;
  tax_amount?: number;
  tax_rate?: number;
  variant_id?: number;
  variant_title?: string;
  vendor?: string;
  weight?: number;
  weight_unit?: string;
};

export type SbORefundLineItemExtend = {
  line_item?: SbORefundLineItem;
  line_item_id?: number;
  quantity?: number;
  restock_type?: string;
  subtotal?: number;
  total_refund?: number;
  total_tax?: number;
};

export type SbOrderRefund = {
  id: number;
  order_adjustments: Array<SbORefundAdjustment>;
  refund_line_items: Array<SbORefundLineItemExtend>;
};

export type SbOrderDisCount = {
  type?: string;
};

export type SbOrderShippingLine = {
  carrier_identifier?: string;
  code?: string;
  discounted_price?: number;
  fulfillment_service?: string;
  origin_price?: number;
  price?: number;
  shipping_rule_id?: number;
  shipping_rule_type?: string;
  source?: string;
  title?: string;
};

export type SbOrder = {
  id?: number;
  name?: string;
  order_number?: number;
  shop_id?: number;
  access_key?: string;
  cart_token?: string;
  checkout_token?: string;
  client_country_code?: string;
  client_ip?: string;
  client_tracking_location?: string;
  currency?: string;
  customer_locale?: string;
  email?: string;
  financial_status?: string;
  fulfillment_status?: string;
  is_test_order?: boolean;
  order_status_url?: string;
  order_type?: string;
  payment_gateway?: string;
  phone?: string;
  plb_profit?: number;
  previous_shipping_fee?: number;
  print_file_status?: string;
  processing_method?: string;
  referring_site?: string;
  shipment_status?: string;
  source_name?: string;
  subtotal_price?: number;
  taxes_included?: boolean;
  token?: string;
  total_discounts?: string;
  total_line_items_discount?: string;
  total_line_items_price?: string;
  total_price?: number;
  total_quantity?: number;
  total_tax?: number;
  total_tipping?: number;
  total_weight?: number;
  total_weight_in_gram?: number;
  transaction_id?: number;
  use_customer_default_address?: boolean;

  line_items?: Array<SbOrderLine>;
  refunds?: Array<SbOrderRefund>;
  shipping_lines?: Array<SbOrderShippingLine>;
  discount_code?: Array<SbOrderDisCount>;
  created_at?: string;
  created_at_in_timezone?: string;
};

export type SbOrders = {
  orders: Array<SbOrder>;
};

export type SbCountry = {
  calling_code: string;
  code: string;
  id: number;
  name: string;
  province_required?: boolean;
  province_type: string;
  zip_code_required: boolean;
};
