import { DiscountHiveInfo, ItembaseRules, TaxInfor, TippingInfo } from "@types";
import { ShopOptions } from "@utils/token";

export type BuyerInfoApi = {
  emailBuyer: string;
  shippingAddress: ShippingAddressApi;
};

export type ShippingAddressApi = {
  address1: string;
  address2?: string;
  city: string;
  company?: string;
  country?: string;
  country_code: string;
  country_name?: string;
  cpf_number?: string;
  cpf_or_cnpj_number?: string;
  first_name?: string;
  last_name: string;
  name?: string;
  phone?: string;
  province?: string;
  province_code?: string;
  sbcn_valid_address?: number;
  zip?: string;
  remember_me?: boolean;
  buyer_accepts_sms?: boolean;
  buyer_change_accepts_sms?: boolean;
};

export type ShippingMethod = {
  carrier_code?: string;
  amount?: number;
  method_title?: string;
  method_code?: string;
  shipping_rule_id?: number;
  shipping_rule_type?: string;
  origin_price?: number;
  min_only_shipping_time?: number;
  max_only_shipping_time?: number;
  min_only_shipping_time_estimated_by_day?: number;
  max_only_shipping_time_estimated_by_day?: number;
  shipping_group_code?: string;
  shipping_include_insurance?: boolean;
  shipping_fee?: number;
  origin_shipping_fee?: number;
  must_equal?: boolean;
  max_processing_time_estimated_by_day?: number;
  min_processing_time_estimated_by_day?: number;
};

export type Product = {
  id?: number;
  title?: string;
  product_title?: string;
  product_id?: string;
  variant_id?: number;
  variant_title?: string;
  variant_sku?: string;
  quantity?: number;
  option?: string;
  tax_info?: Tax;
  post_purchase_price?: number;
  name?: string;
  price?: number;
  base_name?: string;
  product_type?: string;
  vendor?: string;
  tags?: string;
  handle?: string;
};

export type CartBody = {
  cart_item: {
    variant_id: number;
    qty: number;
    properties: [];
  };
  source: string;
};

export type Tax = {
  tax_type: string;
  tax_name: string;
  tax_rate: number;
};

export type Tip = {
  tipping_value: number;
  tipping_type: "percentage" | "custom";
  tipping_index?: -1 | 0 | 1 | 2;
};

export type AvailableShippingCountries = {
  country_codes: Array<string>;
  type: string;
};

export type DiscountAPI = {
  id: number;
  title?: string;
  allocation_method: "across" | "each";
  type: "manual" | "automatic";
  value_type?: "percentage" | "fixed_amount";
  value?: number;
  entitled_country_ids: Array<number>;
  is_create: boolean;
  is_remove: boolean;
  is_update: boolean;
  customer_buy_variants: Array<number>;
  customer_get_variants: Array<number>;
  quantity_ratio: {
    buy_quantity: number;
    get_quantity: number;
  };
  prerequisite_subtotal_range: { greater_than_or_equal_to: number };
  ends_at: string;
  status: "active" | "expired";
  metadata: {
    shareable_link: string;
  };

  update_fields: Array<string>; // this is list field need update data. Ex: ["entitled_country_ids", "value_type"]
};

export type CountriesGM = {
  country_code?: string;
  country_id?: number;
  country_name?: string;
  currency?: string;
  exchange_rate?: number;
  exchange_rate_auto?: number;
  global_market_id?: number;
  id?: number;
  is_rate_auto?: boolean;
  is_rounding?: boolean;
  price_adjustment?: number;
  rounding?: number;
};

export type GlobalMarket = {
  currency?: string;
  exchange_rate?: number;
  exchange_rate_auto?: number;
  global_market_countries?: Array<CountriesGM>;
  id?: number;
  is_active?: boolean;
  is_multiple_currency?: boolean;
  is_rate_auto?: boolean;
  is_rounding?: boolean;
  name?: string;
  price_adjustment?: number;
  price_adjustment_type?: string;
  rounding?: number;
  shop_id?: number;
  update_fields: Array<string>; // List field need update data. Ex: ["price_adjustment_type", "price_adjustment"]
};

export type BoostUpsellRequest = {
  id?: number;
  offer_name?: string;
  discount_data?: Array<{ key: string; min_quantity: number; value_discount: number; type: string }>;
};

export type BoostUpsellInfo = {
  id?: number;
  offer_name?: string;
  discount_data?: string;
};

export type DataSetting = {
  product?: Product;
  discount?: DiscountAPI;
  tipping?: TippingInfo;
  tax?: TaxInfor;
  global_market?: GlobalMarket;
  boost_upsell?: BoostUpsellRequest;
  variant?: Array<VariantRequest>;
  shipping_profile?: ShippingProfileRequest;
  discount_hive?: DiscountHiveInfo;
  product_odoo?: ProductOdoo;
  markup_shipping?: ShippingZoneRequest;
  post_purchase?: BoostUpsellRequest;
};

export type ProductOdoo = {
  id?: number;
  weight?: number;
};

export type DataTokenShopTemplate = {
  shipping?: ShopOptions;
};

export type TaxResponse = {
  conditions: {
    type: string;
  };
  country_code: string;
  id: number;
  name: string;
  province_code: string;
  rate: number;
  shop_id: number;
  threshold: number;
  threshold_to: number;
  type: string;
};

export type VariantRequest = {
  id: number;
  price: number;
  update_fields: Array<string>;
};

export type VariantInfo = {
  attachment: string;
  barcode: string;
  compare_at_price: number;
  cost_per_item: number;
  created_at: number;
  fulfillment_service: string;
  id: number;
  image: string;
  image_id: number;
  image_src: string;
  inventory_management: string;
  inventory_policy: string;
  inventory_quantity: number;
  is_default: boolean;
  metafields: string;
  option1: string;
  option2: string;
  option3: string;
  position: number;
  price: number;
  product_id: number;
  requires_shipping: boolean;
  shop_id: boolean;
  sku: string;
  sync_cache_time: number;
  taxable: boolean;
  title: string;
  updated_at: number;
  updated_source: string;
  weight: number;
  weight_unit: string;
};

export type ItemBasedShippingRateRequest = {
  name: string;
  additional_item_price: number;
  first_item_price: number;
  price_unit?: string;
  group_code?: string;
  group_tag?: string;
  id?: number;
  shipping_zone_id?: number;
  rules?: Array<ItembaseRules>;
  exclude_rules?: Array<ItembaseRules>;
  max_shipping_time?: number;
  min_shipping_time?: number;
  update_fields: Array<string>; // List field need update data. Ex: ["name", additional_item_price]
};

export type PriceBasedShippingRateRequest = {
  name: string;
  price: number;
  price_unit?: string;
  max_order_subtotal?: number;
  min_order_subtotal?: number;
  max_shipping_time?: number;
  min_shipping_time?: number;
  update_fields: Array<string>; // List field need update data. Ex: ["name", additional_item_price]
};

export type ShippingCountryRequest = {
  id: number;
  name: string;
  code: string;
  provinces: Array<Record<string, unknown>>;
  is_remove: boolean;
};

export type ShippingZoneRequest = {
  countries: Array<ShippingCountryRequest>;
  item_based_shipping_rate: Array<ItemBasedShippingRateRequest> | null;
  price_based_shipping_rate: Array<PriceBasedShippingRateRequest> | null;
  name: string;
  update_fields: Array<string>; // List field need update data. Ex: ["countries"]
};

export type ShippingProfileRequest = {
  id?: number;
  name?: string;
  shipping_zones: Array<ShippingZoneRequest>;
};

export type ExcludeData = {
  excluded_product_ids: Array<number>;
  excluded_variants: Array<ExculdedVariant>;
};

export type ExculdedVariant = {
  id: number;
  product_id: number;
};
