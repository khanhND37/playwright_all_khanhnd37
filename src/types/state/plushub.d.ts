export type Purchase = {
  name: string;
  quantity: number;
  product_template_id: number;
  product_id: number;
};

export type PurchaseOrderInfo = {
  sale_order_id: number;
  purchases: Purchase[];
};

export type PurchaseOrder = {
  sbcn_draft_order_id: number;
};

export type InvoicePurchaseInfo = {
  is_pay_now: boolean;
  service_name: string;
  amount_cent: number;
  invoice_type: string;
  custom_id: string;
  transaction_type: string;
  details: string;
  metadata: PurchaseOrder[];
};

export type Inventory = {
  purchased: number;
  available_stock: number;
  fulfilled: number;
  need_to_purchase: number;
  sent_ff_request: number;
  wait_to_fulfill: number;
  incoming: number;
  last_3_days_sale: number;
  awaiting_stock: number;
  processing: number;
};

export type LineItems = {
  id: number;
  shipping_method_id: number;
};

export type DataOrderToFulfill = {
  id: number;
  shipping_method_id: number;
  line_item_ids: Array<number>;
  line_items: LineItems[];
  type?: string;
};

export type DraffOrderId = {
  sbcn_draft_order_id: number;
};

export type InvoicePayOrderInfo = {
  is_pay_now: boolean;
  amount_cent: number;
  custom_id: string;
  metadata: DraffOrderId;
};

export type DataAutoPurchase = {
  draft_order_id: number;
  fulfill_type: string;
};

export type Quotation = {
  id: number;
  quotation_status: string;
  quotation_name: string;
  url_request: string;
  product_name: string;
  price: string;
  processing_time: string;
  expiration_date: string;
  state?: string;
};

export type QuotationStatus = {
  all: number;
  expired: number;
  needs_update: number;
  no_result: number;
  quotation_created: number;
  submitted_request: number;
};

export type ListQuotation = {
  count: QuotationStatus;
  result: Array<Result>;
  is_empty: boolean;
};

export type Result = {
  id?: number;
  url?: string;
  state?: string;
};

export type SaleOrderLinesDB = {
  id: number;
  order_id: number;
  price_unit: number;
  product_id: number;
  price_subtotal: number;
};

export type OrderLine = {
  id: number;
  order_line: number[];
};

export type AutoPurchaseInfo = {
  draft_order_id: number;
  fulfill_type: string;
};

export type ProductMappingInfo = {
  target_shop_id: number;
  line_item_id: number;
  product_id: number;
  mapped_options: string[];
  replace_product_all_order: boolean;
};

export type Claim = {
  order_claim: OrderClaim;
  order_claim_lines: OrderClaimLine;
};

export type OrderClaim = {
  id: number;
  order_id: number;
  solution: string;
  status: string;
  name: string;
  order_name: string;
  order_data: string;
};

export type OrderClaimLine = {
  id: number;
  claim_id: number;
  claim_quantity: number;
  reason: string;
  claim_note: string;
};

export type PurchaseOrderOdoo = {
  id: number;
  state: string;
  picking_ids: number[];
};

export type ReplaceWarehouseData = {
  mapped_product_name: string;
  variant_name: string;
  action: string;
};

export type WarehouseInfo = {
  product_warehouse: string;
  stock_picking_id_before?: number;
  is_stock_picking_id_before?: boolean;
};

export type Value = {
  id: number;
  label: string;
  value: string;
  origin_value: string;
};

export type MappedOption = {
  name: string;
  values: Value[];
};

export type ChangeMappingData = {
  target_shop_id: number;
  user_id: number;
  platform_product_id: number;
  sbcn_product_id: number;
  mapped_options: MappedOption[];
};

export type PurchaseOrders = {
  id: number;
  product_name: string;
  name: string;
  product_tmpl_id: number;
  stock_picking_id: number;
};
