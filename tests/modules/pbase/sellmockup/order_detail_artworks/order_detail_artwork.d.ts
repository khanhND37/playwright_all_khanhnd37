export interface OrderDetailArtwork {
  env: Env;
  customer_info: CustomerInfo;
  card_info: CardInfo;
  cases: Cases;
}

export interface CardInfo {
  card_number: string;
  card_holder_name: string;
  expire_date: string;
  cvv: string;
}

export interface Cases {
  DATA_DRIVEN_ARTWORK: DataDrivenArtwork;
  SB_PRB_SCWM_40: SbPrbScwm40;
}

export interface DataDrivenArtwork {
  data: Datum[];
}

export interface Datum {
  description: string;
  case_id: string;
  campaign_name: string;
  import_campaign: ImportCampaign;
  import_info: ImportInfo;
  verify_time: number;
  variant_product: VariantProduct;
  layers?: Layer[];
  picture?: string;
  profit?: string;
}

export interface ImportCampaign {
  file_name: string;
  file_path: string;
  inserted_campaign: number;
  skip_campaign: number;
  total_campaign: number;
  campaign_name: string;
}

export type ImportInfo = {
  status: string;
};

export interface Layer {
  layer_type: string;
  layer_value?: string;
  front_or_back?: string;
  image_name?: string;
  location_layer_x?: string;
  location_layer_y?: string;
  layer_size_h?: string;
  layer_size_w?: string;
}

export interface VariantProduct {
  size: string;
}

export interface SbPrbScwm40 {
  variant_product: VariantProduct;
  import_info: ImportInfo;
  import_campaign: ImportCampaign;
  verify_time: number;
  campaign_name: string;
}

export interface CustomerInfo {
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  phone_number: string;
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
  timeout: number;
  message: string;
  hive_info: HiveInfo;
  accounts_domain?: string;
}

export interface HiveInfo {
  hive_domain: string;
  hive_username: string;
  hive_password: string;
}
