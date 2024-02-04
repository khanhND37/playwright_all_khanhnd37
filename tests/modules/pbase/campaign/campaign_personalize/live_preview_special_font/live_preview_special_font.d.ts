/* eslint-disable */
export interface LivePreviewSpecialFont {
  env: Env;
  time_out: number;
  param_threshold: number;
  campaign_special_font: CampaignSpecialFont[];
  url_catalog: string;
  cases: Cases;
}

export interface CampaignSpecialFont {
  product_infos: ProductInfo[];
  layers: Layer[];
  custom_options: CustomOption[];
  pricing_info: PricingInfo;
}

export interface CustomOption {
  type: Type;
  target_layer: string;
  label: Label;
  font?: string;
  position?: string;
}

export enum Label {
  Test1 = "Test 1",
  Test2 = "Test 2",
  Test3 = "Test 3",
}

export enum Type {
  TextField = "Text field",
}

export interface Layer {
  layer_type: string;
  image_name?: string;
  location_layer_x: string;
  location_layer_y: string;
  layer_size_h: string;
  layer_size_w: string;
  layer_value?: string;
  font_name?: string;
}

export interface PricingInfo {
  title: string;
  description: string;
}

export interface ProductInfo {
  category: string;
  base_product: string;
  title: string;
}

export interface Cases {
  SB_PRB_LP_11: SbPrbLp11;
}

export interface SbPrbLp11 {
  value_input_sf: ValueInputSf[];
}

export interface ValueInputSf {
  campaign_name: string;
  pictures: Pictures;
  custom_option_info: CustomOptionInfo[];
}

export interface CustomOptionInfo {
  type: Type;
  value: string;
  custom_name: Label;
}

export interface Pictures {
  picture_mockup: string;
  picture_preview: string;
}

export interface Env {
  prod: Dev;
  prodtest: Dev;
  dev: Dev;
}

export interface Dev {
  api: string;
  domain: string;
  username: string;
  password: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
  cases?: Cases;
  accounts_domain?: string;
}
