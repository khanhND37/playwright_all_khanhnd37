import { Page } from "@playwright/test";

export type ProductInfo = {
  id: number;
  name?: string;
  priority?: number;
  x_publish_date?: string;
  x_set_unavailable?: boolean;
  x_plusbase_base_cost?: number;
  x_plusbase_profit_margin?: number;
};

export type ShowProducts = {
  page: Page;
  parentSelector?: string;
  products: Array<ProductInfo>;
  offset?: number;
  limit?: number;
};

export type StockPicking = {
  id: number;
  state: string;
  x_tracking_number: string;
  x_warehouse_id: Array<string>;
  carrier_id: Array<string>;
  x_carrier_code: string;
  move_line_ids_without_package?: Array<number>;
};

export type SaleOrder = {
  id?: number;
  x_cancel_reason_id?: Array<number>;
  validity_date?: string;
  x_minimum_order_quantity?: number;
  x_minimum_order_value?: number;
  x_estimated_delivery?: number;
  x_quote_based_on?: boolean;
  user_id?: number;
  state?: string;
  payment_term_id?: number;
  x_use_partner_price?: boolean;
  x_discount_time_from?: string;
  x_discount_time_to?: string;
  x_not_duplicate_price?: boolean;
};

export type QuotationCancelReason = {
  id: number;
  name: string;
};

export type Specification = {
  id: number;
  name: string;
};

export type OrderCapProduct = {
  x_set_unavailable?: boolean;
  x_set_unavailable_at?: string | boolean;
  x_reason_set_unavailable?: string;
  x_user?: string;
  x_user_reason?: object;
  x_limit_cap?: number;
  x_current_cap?: number;
  x_extend_days?: number;
};

export type ProductTemplatePartner = {
  id: number;
};

export type TemplateAttribute = {
  id: number;
  number_of_values: number;
};

export type PlbProductVariant = {
  id?: number;
  active?: boolean;
  x_price?: number;
  x_compare_at_price?: number;
  x_variant_weight?: number;
  x_plusbase_selling_price?: number;
  x_plusbase_base_cost?: number;
  x_plusbase_discouted_base_cost?: number;
  x_set_unavailable?: boolean;
  product_cost_rmb?: number;
  shipping_cost_rmb?: number;
  package_weight?: number;
  height?: number;
  width?: number;
  length?: number;
  product_cost?: number;
  default_code?: string;
  product_tmpl_id?: Array<number | string>;
  volume?: number;
  variant_weight?: number;
  dom_shipping_fee?: number;
  product_profit?: number;
};

export type DeliveryCarrier = {
  id: number;
  name: string;
  active: boolean;
  delivery_type: string;
  x_include_electronic: boolean;
  x_code: string;
  x_display_name_checkout: string;
  country_ids: Array<number>;
  x_delivery_carrier_group: Array<number>;
  price_rule_ids: Array<number>;
  x_estimated_delivery: string;
};

export type DeliveryCarrierGroup = {
  id: number;
  code: string;
  name: string;
};

export type ResCountry = {
  id: number;
  name: string;
  code: string;
};

// Custom type
export type ConfigCrawlShipping = {
  deliveryCarrier: DeliveryCarrier;
  countries: Array<ResCountry>;
};

export type PlbCatalogRequest = {
  isTestProduct: boolean;
  isRealProduct: boolean;
  args?: Array<Array<string | number | boolean>>;
  order?: string;
  offset?: number;
  limit?: number;
};

export type ShippingType = {
  id: number;
  name: string;
};

export type MailMessage = {
  id: number;
  text: string;
  model: string;
  rest_id: number;
  create_date: string;
};

export type GetSmallestDeliveryCondition = {
  id?: number;
  countryCode?: string;
  shippingGroupName?: string;
  shippingTypes?: Array<string>;
  weight: number;
};

export type GetDeliveryCarriersCondition = {
  shippingTypeIds: Array<number>;
};

export type GetDeliveryCarrierGroupsCondition = {
  ids: Array<number>;
  fields?: Array<string>;
};

export type GetProductTemplatesCondition = {
  ids?: Array<number>;
  fields?: Array<string>;
};

export type DeliveryCarrierPriceRule = {
  id: number;
  display_name: string;
  list_base_price: number;
  list_price: number;
  max_value: number;
  operator: string;
  variable: string;
  carrier_id: number;
};

export type ProductTemplateSpecificationValue = {
  id: number;
  specification_id: number;
  value: string;
};

export type OdooProductTemplate = {
  id: number;
  name: string;
  x_url: string;
  x_is_plus_base: boolean;
  x_is_custom_request: boolean;
};

export type OdooProductTemplateUpdateReq = {
  name?: string;
  x_delivery_carrier_type_ids?: Array<Array<number | string | object | Array<number | string>>>;
  x_warehouse_id?: number;
  x_weight?: number;
  attribute_line_ids?: Array<Array<number | string | object | Array<number | string>>>;
};

export type OdooProductProduct = {
  id: number;
  product_tmpl_id: number;
  product_cost_rmb: number;
  shipping_cost_rmb: number;
  product_cost: number;
  x_price?: number;
  product_template_attribute_value_ids?: Array<number>;
  x_fulfillment_package_rule_max_quantity?: number;
};

export type OdooSaleOrder = {
  id: number;
};

export type OdooSaleOrderUpdateReq = {
  validity_date?: string;
  x_estimated_delivery?: number;
  x_minimum_order_quantity?: number;
  x_minimum_order_value?: number;
  x_quote_based_on?: boolean;
  order_line?: Array<Array<number | string | object | Array<number | string>>>;
  x_based_on_variant_ids_rel?: Array<Array<number | string | object | Array<number | string>>>;
  x_cancel_reason_id?: number;
  payment_term_id?: number;
};

export type OdooSaleOrderLine = {
  id: number;
  order_id: number;
  x_product_cost: number;
  x_domestic_shipping: number;
  price_unit: number;
  product_id: Array<number | string>;
  x_discount_amount?: number;
};

export type ShippingData = {
  first_item_fee: number;
  additional_item_fee: number;
  eta_delivery_time: string;
};

export type BaseCostData = {
  sbcn_variant_id: number;
  quantity: number;
};

export type GetStockPickingsCondition = {
  id?: number;
  productName?: string;
  fields?: Array<string>;
  ownerId?: number;
  parnerId?: number;
  orderName?: string;
  limit?: number;
  name?: string;
  created_date?: string;
  state?: Array<string>;
};

export type QuantityDoneDoIn = {
  qty_done: number;
};

export type CategoryHandle = {
  id: number;
  priority: number;
  product_name: string;
  product_publish: string;
};

export type ProductPublicCategory = {
  x_product_public_category_handles: Array<number>;
};

export type ViewProductTmpl = {
  id?: number;
  product_tmpl_id?: number;
  replace_values?: string;
};

export type PurchaseUrl = {
  id?: number;
  x_res_partner_id?: number;
  x_product_tmpl_id?: number;
  x_url?: string;
};

export type ParamsResponseNotification = {
  message: string;
  title: string;
  type: string;
};

export type ResponseNotification = {
  tag: string;
  type: string;
  params: ParamsResponseNotification;
};

export type ResponseShippingRates = {
  id: number;
  ali_cost: number;
  plb_cost: number;
  total_ali: number;
  total_plb: number;
  product_variant_id: Array<string | number>;
  quotation_id: Array<string | number>;
};

export type IrConfigParameter = {
  id?: number;
  key?: string;
  value?: string;
};

export type MoqProduct = {
  id?: number;
  variant_name?: string;
  base_cost?: number;
  quantity?: number;
  product_product_id?: number;
};
export type PriceRules = {
  name?: string;
};

export type AliCostAndPLBCost = {
  id: number;
  ali_cost: number;
  total_ali: number;
  total_plb: number;
  plb_cost: number;
};

export type VariantInformation = {
  id: number;
  discount_amount?: number;
  base_cost?: number;
  unit_price?: number;
};

export type SOInfo = {
  from_time?: string;
  to_time?: string;
  variants: Array<VariantInformation>;
};
