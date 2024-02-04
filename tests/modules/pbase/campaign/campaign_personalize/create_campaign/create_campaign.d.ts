export interface CreateCampaign {
  url_catalog: string;
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_PRB_LP_4: SbPrbLp4;
  SB_PRB_LP_5: SbPrbLp5;
}

export interface SbPrbLp4 {
  camp_infos: SBPRBLP4_CampInfos;
}

export interface SBPRBLP4_CampInfos {
  product_infos: ProductInfo[];
  layers: PurpleLayer[];
  custom_options: PurpleCustomOption[];
  pricing_info: PricingInfo;
}

export interface PurpleCustomOption {
  type: string;
  target_layer: string;
  label: string;
  position?: string;
  font?: string;
  type_clipart?: string;
  value_clipart?: string;
  type_display_clipart?: string;
  value?: string;
}

export interface PurpleLayer {
  layer_type: string;
  layer_value?: string;
  location_layer_x: string;
  location_layer_y: string;
  layer_size_h: string;
  layer_size_w: string;
  image_name?: string;
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

export interface SbPrbLp5 {
  camp_infos: SBPRBLP5CampInfos;
  variant?: string[];
  price?: string[];
}

export interface SBPRBLP5CampInfos {
  product_infos: ProductInfo[];
  layers: PurpleLayer[];
  custom_options: PurpleCustomOption[];
  pricing_info: PricingInfo;
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
  time_out: number;
  param_threshold: number;
}
