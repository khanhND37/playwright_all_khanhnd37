export type AliexpressProductRequest = {
  type: string;
  tab: string;
  sort_mode?: string;
  sort_field?: string;
  only_ali?: boolean;
  ignore_ali?: boolean;
  only_cj?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export type AliexpressProductListItems = {
  products: Array<AliexpressProductListItem>;
};

export type AliexpressProductListItem = {
  id: number;
  created_at: number;
  updated_at: number;
  requested_at: number;
  quotation_id: number;
  url: string;
  ali_status: string;
  product_status: string;
};

export type CleanProductRequest = {
  url: string;
  odoo_partner_id: number;
  cancel_reason_id: number;
  skip_if_not_found?: boolean;
  not_ali?: boolean;
};

export type DataOfProductItemInList = {
  img_src: string;
  product_name: string;
  product_status: string;
  product_cost: string;
};

export type ShippingRateRequest = {
  product_id: number;
  return_default_if_500?: boolean;
  is_odoo?: boolean;
  use_ali_ship?: boolean;
};

export type ShippingRateResponse = {
  country_ids: Array<number>;
  is_data_from_ali_site: boolean;
  is_support_all_country: boolean;
  product_id: number;
  processing_fee_rate: number;
  variant_shipping_methods: Map<string, Array<RateByVariant>>;
};

export type RateByVariant = {
  additional_item_price: number;
  first_item_price: number;
  country_ids?: Array<number>;
  shipping_group_code?: string;
};

export type SupportedCountryDataRequest = {
  configDeliveryCarrierId: number;
  shippingTypeId?: number;
  ignoreCountryIds?: Array<number>;
};

export type SupportedCountryData = {
  country_ids: Array<number>;
  country_codes: Array<string>;
  country_names: Array<string>;
  deliver_carrier_display_name: string;
};

export type CatalogProductRequest = {
  search?: string;
  page?: number;
  limit?: number;
  sort_mode?: string;
  sort_field?: string;
  collection_id?: number;
  category_ids?: number;
};

export type CatalogProductListItems = {
  products: Array<CatalogProductItem>;
};

export type CatalogProductItem = {
  id: number;
  name: string;
  min_base_cost: number;
  total_view: number;
  selling_price?: number;
  max_base_cost?: number;
};

export type ProductLevels = {
  id: number;
  level: number;
  rules: AliExpress;
  processing_fee: number;
  is_enable?: number;
  message?: string;
  last_update_by: string;
};

export type AliExpress = {
  ali_express: AliExpressRules;
};

export type AliExpressRules = {
  is_enable: boolean;
  operator: string;
  target_point?: number;
  target_point_from?: number;
  target_point_to?: number;
};

export type Categories = {
  id: number;
  name: string;
  is_testing: boolean;
  parent_id?: number;
  sequence?: number;
};

export type PlbProductCatalog = {
  variants?: Array<string>;
  name?: string;
  base_cost?: number;
  selling_price?: number;
  profit_margin?: number;
  first_item?: number;
  additional_item?: number;
};

export type ProductLink = {
  url: string;
  note: string;
};

export type RequestProductData = {
  user_id: number;
  products: Array<ProductLink>;
  is_plus_base: boolean;
};

export type ShippingFee = {
  first_item: number;
  additional_item: number;
};
export type MappedValues = {
  id: number;
  label: string;
  origin_value: string;
  value: string;
};

export type MappedOptions = {
  index: number;
  name: string;
  values: Array<MappedValues>;
};

export type TotalProduct = {
  total_products?: number;
  total_pages?: number;
};

export type FilterCatalog = {
  min_shipping_fee?: string;
  max_shipping_fee?: string;
  min_product_cost?: string;
  max_product_cost?: string;
  min_profit_margin?: string;
  max_profit_margin?: string;
  most_views?: string;
  most_imports?: string;
  best_sellers?: string;
  number_of_views?: string;
  number_of_imports?: string;
  number_of_sold?: string;
  tag?: string;
};

export type DataInPopUpShipping = {
  shippingMethod?: string;
  productCostAct?: string;
  totalCostAct?: string;
  firstItem?: string;
  additionalItem?: string;
};
