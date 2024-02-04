export type FulfillOrderApiBody = {
  fulfillment: FulfillmentBodyRequest;
};

export type FulfillmentBodyRequest = {
  tracking_number: string;
  tracking_company: string;
  line_items: LineItemBodyRequest[];
  notify_customer: boolean;
  order_id: number;
  service: string;
};

export type LineItemBodyRequest = {
  id: number;
  quantity: number;
};

export type FulfillApiResponse = {
  fulfillmentResponse: FulfillmentResponse;
};

export type FulfillmentResponse = {
  claim_id: number;
  created_at: Date;
  date_done: number;
  detected_tracking_company: string;
  first_tracking_step_at: number;
  id: number;
  last_crawled_at: number;
  last_mile_tracking_company: string;
  last_mile_tracking_number: string;
  last_tracking_step_at: number;
  line_items: LineItemResponse[];
  name: string;
  notify_customer: boolean;
  order_id: number;
  send_delay_mail: boolean;
  service: string;
  shipment_status: string;
  status: string;
  tracking_company: string;
  tracking_number: string;
  tracking_numbers: string[];
  tracking_steps: TrackingSteps;
  tracking_url: string;
  tracking_urls: string[];
  updated_at: Date;
  variant_inventory_management: string;
};

export type LineItemResponse = {
  applied_discount: null;
  compare_at_price: number;
  custom: boolean;
  discount_allocations: DiscountAllocationResponse[];
  discount_amount: number;
  fulfillable_quantity: number;
  fulfillment_id: number;
  fulfillment_service: string;
  fulfillment_status: string;
  gift_card: boolean;
  has_custom_options: boolean;
  id: number;
  image_src: string;
  item_discount_price: number;
  line_item_discount_amount: number;
  line_item_discount_price: number;
  line_item_price: number;
  line_item_price_after_discount: number;
  line_item_price_before_discount: number;
  line_item_price_with_explicit_discount: number;
  line_item_weight: number;
  metadata: MetadataResponse;
  name: string;
  not_explicit_discount_price: number;
  order_id: number;
  price: number;
  product_id: number;
  product_type: string;
  properties: propertiesFulfill;
  quantity: number;
  raw_price: number;
  raw_weight: number;
  refunded_quantity: number;
  removed_quantity: number;
  requires_shipping: boolean;
  sku: string;
  tags: string;
  tax_amount: number;
  tax_lines: null;
  tax_rate: number;
  taxable: boolean;
  tip_payment_gateway: string;
  tip_payment_method: string;
  title: string;
  total_discount: number;
  total_item_discount_price: number;
  total_line_with_discount_price: number;
  total_tax_amount: number;
  variant_id: number;
  variant_options: string;
  variant_title: string;
  vendor: string;
  weight: number;
  weight_unit: string;
};

export type DiscountAllocationResponse = {
  amount: number;
  discount_application_index: number;
};

export type MetadataResponse = {
  fulfillment_item: FulfillmentItemResponse;
  is_post_purchase: boolean;
  source: null;
};

export type FulfillmentItemResponse = {
  type: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TrackingSteps {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface propertiesFulfill {}
