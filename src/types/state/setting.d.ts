export type ShippingRate = {
  type: "Item based rates" | "Price based rates" | "Weight based rates";
  name: string;
  price: number;
  group?: string;
  filter?: FilterShippingRate;
  exclusion?: FilterShippingRate;
  is_free_rate?: boolean;
  min_shipping_time?: number;
  max_shipping_time?: number;
  first_item_price?: number;
  additional_price?: number;
  min_price?: number;
  max_price?: number;
  min_weight?: number;
  max_weight?: number;
};

export type FilterShippingRate = {
  product_condition?: string;
  condition?: string;
  keyword?: string;
};

export type ShippingProfile = {
  id: number;
  is_general: boolean;
  name: string;
  shipping_zones: Array<ShippingZoneInfo> | null;
  sku: string;
  variant_ids: Array<string> | null;
};

export type ShippingCountry = {
  id: number;
  name: string;
  code: string;
  provinces: Array<Record<string, unknown>>;
};

export type PriceBasedShippingRate = {
  name: string;
  min_order_subtotal?: number;
  max_order_subtotal?: number;
  max_shipping_time?: number;
  min_shipping_time?: number;
  price: number;
  id?: number;
  shipping_zone_id?: number;
};

export type WeightBasedShippingRate = {
  name: string;
  weight_high?: number;
  weight_low?: number;
  weight_unit?: string | null;
  max_shipping_time?: number;
  min_shipping_time?: number;
  price: number;
  id?: number;
};

export type ItemBasedShippingRate = {
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
};

export type ItembaseRules = {
  column?: string;
  condition?: string;
  relation?: string;
};

export type ListPriceBasedRates = {
  type: "price_based";
  rates: Array<PriceBasedShippingRate>;
};

export type ListItemBasedRates = {
  type: "item_based";
  rates: Array<ItemBasedShippingRate>;
};

export type ListWeightBasedRates = {
  type: "weight_based";
  rates: Array<WeightBasedShippingRate>;
};

export type ShippingRates = ListPriceBasedRates | ListItemBasedRates | ListWeightBasedRates;

export type TaxInfor = {
  country?: string;
  province: string | null;
  minItemValue?: number;
  maxItemValue?: number | null;
  taxName?: string;
  taxRate?: number;
  taxState?: string;
  collection?: string;
  location?: string;
  categories?: "country" | "region" | "override";
  isTaxIncluded?: boolean;
  isTaxIncludedShipping?: boolean;
  isIgnoreUpdateTaxInfo?: boolean;
};

export type ShippingZoneInfo = {
  id?: number;
  name?: string;
  item_based_shipping_rate: Array<ItemBasedShippingRate> | null;
  price_based_shipping_rate: Array<PriceBasedShippingRate> | null;
  weight_based_shipping_rate: Array<WeightBasedShippingRate> | null;
  countries: Array<ShippingCountry>;
  is_disabled?: boolean;
  meta_data?: {
    disabled_group_codes: Array<string>;
  };
};
