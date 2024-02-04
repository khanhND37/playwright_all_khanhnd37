export type EditOrderApiResponse = {
  order: EditOrderResponse;
};

export type EditOrderResponse = {
  access_key: string;
  additional_information: AdditionalInformation;
  allow_refund: boolean;
  applied_discount: null;
  approve_status: string;
  billing_address: BillingAddress;
  billing_shipping_same_address: boolean;
  buyer_accepts_marketing: boolean;
  cancel_reason: string;
  cancelled_at: null;
  cart_token: string;
  chargeback_amount: number;
  chargeback_deadline_at: null;
  chargeback_status: string;
  checkout_token: string;
  claim_fulfillments: claim_fulfillments;
  claims: null;
  client_country_code: string;
  client_details: null;
  client_ip: string;
  client_tracking_location: string;
  closed_at: null;
  created_at: Date;
  created_at_in_timezone: Date;
  created_source: string;
  currency: string;
  customer: Customer;
  customer_locale: string;
  discount_applications: null;
  discount_code: null;
  draft_order_number: number;
  email: string;
  extra_payment_fee: number;
  financial_status: string;
  fulfillment_status: string;
  fulfillments: null;
  global_market: null;
  id: number;
  invoice_sent_at: number;
  invoice_url: string;
  is_create_from_checkout: boolean;
  is_in_post_purchase: boolean;
  is_processing_fulfill: boolean;
  is_risk: boolean;
  is_test_order: boolean;
  landing_url: string;
  line_items: LineItem[];
  name: string;
  note: string;
  note_attributes: null;
  order_number: number;
  order_status_url: string;
  order_type: string;
  paid_at: number;
  payment_gateway: string;
  payment_gateway_names: string[];
  payment_provider_payload: PaymentProviderPayload;
  pbase_approve_status: string;
  pbase_design_status: string;
  phone: string;
  plb_profit: number;
  previous_shipping_fee: number;
  print_file_status: string;
  processed_at: Date;
  processing_method: string;
  product_mappings: null;
  referring_site: string;
  refunds: refunds;
  shipment_status: string;
  shipping_address: ShippingAddressEdit;
  shipping_lines: ShippingLine[];
  shop_id: number;
  source_name: string;
  subtotal_price: number;
  tags: string;
  tax_lines: tax_lines;
  taxes_included: boolean;
  token: string;
  total_discounts: number;
  total_line_items_discount: number;
  total_line_items_price: number;
  total_price: number;
  total_quantity: number;
  total_tax: number;
  total_tipping: number;
  total_weight: number;
  total_weight_in_gram: number;
  tracking_info: null;
  transaction_id: number;
  updated_at: Date;
  use_customer_default_address: boolean;
};

export type AdditionalInformation = {
  ASN: number;
  IPS: string;
  city: string;
  country: string;
  hostname: string;
  latitude: string;
  longitude: string;
  organization: string;
  region: string;
  timezone: string;
};

export type BillingAddress = {
  address1: string;
  address2: string;
  city: string;
  company: string;
  country: string;
  country_code: string;
  country_name: string;
  cpf_or_cnpj_number: string;
  created_at: number;
  customer_id: number;
  default: boolean;
  first_name: string;
  last_name: string;
  latitude: number;
  longitude: number;
  name: string;
  phone: string;
  province: string;
  province_code: string;
  updated_at: number;
  zip: string;
};

export type Customer = {
  accepts_marketing: boolean;
  average_spent: number;
  created_at: Date;
  currency: string;
  default_address: null;
  email: string;
  first_name: string;
  id: number;
  last_name: string;
  last_order_at: number;
  last_order_id: number;
  last_order_name: string;
  note: string;
  orders_count: number;
  phone: string;
  state: string;
  tags: string;
  tax_exempt: boolean;
  total_spent: number;
  updated_at: Date;
  verified_email: boolean;
};

export type LineItem = {
  applied_discount: null;
  base_product_id: number;
  can_upload_artwork: boolean;
  custom: boolean;
  discount_allocations: DiscountAllocation[];
  discount_amount: number;
  fulfillable_quantity: number;
  fulfillment_id: number;
  fulfillment_service: string;
  fulfillment_status: string;
  gift_card: boolean;
  holding_time: number;
  id: number;
  image_src: string;
  is_post_purchase_item: boolean;
  line_item_discount_amount: number;
  line_item_discount_price: number;
  line_item_price: number;
  line_item_price_after_discount: number;
  line_item_price_before_discount: number;
  line_item_tags: string[];
  line_item_weight: number;
  metadata: Metadata;
  name: string;
  plus_base_product_group: null;
  price: number;
  print_file: PrintFile;
  processing_fee: number;
  processing_fee_rate: number;
  product_id: number;
  product_type: string;
  profit: number;
  properties: propertiesOrderEdit;
  quantity: number;
  raw_price: number;
  raw_weight: number;
  requires_shipping: boolean;
  shipping_rate: null;
  sku: string;
  source: string;
  source_id: number;
  tax_amount: number;
  tax_lines: null;
  tax_rate: number;
  taxable: boolean;
  title: string;
  total_discount: number;
  variant_id: number;
  variant_options: string;
  variant_title: string;
  vendor: string;
  weight: number;
  weight_unit: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DiscountAllocation {}

export type Metadata = {
  auto_upsell: null;
  edited_order_old_variant: null;
  fulfillment_item: FulfillmentItem;
  is_post_purchase: boolean;
  plb_automated: number;
  source: null;
};

export type FulfillmentItem = {
  type: string;
};

export type PrintFile = {
  disabled: boolean;
  height: number;
  is_trigger_render: boolean;
  layers: string;
  print_file: string;
  update_print_file_line_item: boolean;
  width: number;
};

export type PaymentProviderPayload = {
  auth_id: string;
  payment_method_id: string;
};

export type ShippingAddressEdit = {
  address1: string;
  address2: string;
  city: string;
  company: string;
  country: string;
  country_code: string;
  country_name: string;
  cpf_or_cnpj_number: string;
  created_at: Date;
  customer_id: number;
  default: boolean;
  first_name: string;
  last_name: string;
  latitude: number;
  longitude: number;
  name: string;
  phone: string;
  province: string;
  province_code: string;
  updated_at: Date;
  zip: string;
};

export type ShippingLine = {
  carrier_identifier: string;
  code: string;
  discounted_price: number;
  fulfillment_service: string;
  insurance_fee: number;
  origin_price: number;
  price: number;
  shipping_include_insurance: boolean;
  shipping_rule_id: number;
  shipping_rule_type: string;
  source: string;
  tax_lines: null;
  title: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface refunds {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface tax_lines {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface propertiesOrderEdit {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface claim_fulfillments {}
