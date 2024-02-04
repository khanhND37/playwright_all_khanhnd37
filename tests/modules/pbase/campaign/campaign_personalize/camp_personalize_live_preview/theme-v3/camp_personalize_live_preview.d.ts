/* eslint-disable */
export interface CampPersonalizeLivePreview {
  env: Env;
  cases: CampPersonalizeLivePreviewCases;
}

export interface CampPersonalizeLivePreviewCases {}

export interface Env {
  local: Local;
  prodtest: Dev;
  dev: Dev;
}

export interface Dev {
  api: string;
  domain: string;
  username: string;
  password: string;
  shop_name: string;
  theme_default: number;
  user_id: number;
  shop_id: number;
  time_out: number;
  personalize: Personalize;
  url_catalog: string;
  accounts_domain?: string;
}

export interface Personalize {
  enable: boolean;
  mode: string;
}

export interface Local {
  theme_default: number;
  personalize: Personalize;
  url_catalog: string;
  api: string;
  domain: string;
  shop_name: string;
  username: string;
  password: string;
  user_id: number;
  shop_id: number;
  time_out: number;
  hive_pb_domain: string;
  hive_pb_username: string;
  hive_pb_password: string;
  cases: LocalCases;
}

export interface LocalCases {
  SB_PRB_LP_389: SbPrbLp389;
}

export interface SbPrbLp389 {
  data_test: DataTest[];
}

export interface DataTest {
  layers: Layer[];
  custom_options: CustomOption[];
  pricing_info: PricingInfo;
  product_infos: ProductInfo[];
  title: string;
  custom_option_info: CustomOptionInfo[];
}

export interface CustomOptionInfo {
  type: string;
  value: string;
  custom_name: string;
}

export interface CustomOption {
  type: string;
  target_layer: string;
  font: string;
  label: string;
  allow_character: string;
  position?: string;
}

export interface Layer {
  layer_type: string;
  image_name: string;
  location_layer_x: string;
  location_layer_y: string;
  layer_size_h: string;
  layer_size_w: string;
}

export interface PricingInfo {
  title: string;
  description: string;
}

export interface ProductInfo {
  category: string;
  base_product: string;
}
