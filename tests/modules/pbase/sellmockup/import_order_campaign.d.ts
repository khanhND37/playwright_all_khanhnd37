export interface ImportOrderCampaign {
  env: Env;
  email_scheduler: string;
  cases: Cases;
}

export interface Cases {
  SB_PRB_SCWM_30: SbPrbScwm30;
  SB_PRB_SCWM_31: SbPrbScwm3;
  SB_PRB_SCWM_32: SbPrbScwm3;
  SB_PRB_SCWM_33: SbPrbScwm33;
}

export interface SbPrbScwm30 {
  import_campaign: ImportCampaign;
  verify_time: number;
  order_info: SBPRBSCWM30_OrderInfo;
  variant_line: VariantLineClass;
  order_verify: OrderVerify;
  layers: Layer[];
  order_detail: OrderDetail[];
  pricing_info: PricingInfo;
}

export type ImportCampaign = {
  status: string;
};

export interface Layer {
  layer_type: string;
  layer_value: string;
  location_layer_x: string;
  location_layer_y: string;
  layer_size_h: string;
  layer_size_w: string;
}

export interface OrderDetail {
  num_artwork: number;
  artwork_status: string;
}

export interface SBPRBSCWM30_OrderInfo {
  product_name: string;
}

export interface OrderVerify {
  label: string;
  message: string;
}

export interface PricingInfo {
  title: string;
}

export interface VariantLineClass {
  size: string;
  color: string;
}

export interface SbPrbScwm3 {
  file: string;
  order_info: SBPRBSCWM31_OrderInfo;
  variant_line1: VariantLine1Class;
  variant_line2: VariantLine1Class;
  order_verify: OrderVerify;
  layers: Layer[];
  order_detail: OrderDetail[];
  pricing_info: PricingInfo;
}

export interface SBPRBSCWM31_OrderInfo {
  product_name_first: string;
  product_name_second: string;
}

export interface VariantLine1Class {
  size: string;
  color: string;
  style: string;
}

export interface SbPrbScwm33 {
  file: string;
  order_info: SBPRBSCWM31_OrderInfo;
  variant_line1: VariantLine1Class;
  variant_line2: VariantLineClass;
  order_verify: OrderVerify;
  layers: Layer[];
  order_detail: OrderDetail[];
  pricing_info: PricingInfo;
}

export interface Env {
  dev: Dev;
  prodtest: Dev;
  prod: Dev;
}

export interface Dev {
  api: string;
  domain: string;
  shop_name: string;
  username: string;
  password: string;
  shop_id: number;
  user_id: number;
  time_out_tc: number;
  wait_time_mock_up_render: number;
  hive_pb_domain: string;
  hive_pb_username: string;
  hive_pb_password: string;
  customer: Customer;
  card: Card;
  accounts_domain?: string;
}

export interface Card {
  card_number: string;
  card_holder_name: string;
  expire_date: string;
  cvv: string;
}

export interface Customer {
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  country: string;
  country_code: string;
  state: string;
  city: string;
  zipcode: string;
  phone_number: string;
}
