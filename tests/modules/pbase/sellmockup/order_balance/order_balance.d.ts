/* eslint-disable */
export interface OrderBalance {
  env: Env;
  customer_info: CustomerInfo;
  card_info: CardInfo;
  import_campaign: ImportCampaign;
  import_info: ImportInfo;
  cases: Cases;
}

export interface CardInfo {
  number: string;
  holder_name: string;
  expire_date: string;
  cvv: string;
}

export interface Cases {
  SB_PRB_SCWM_37: SbPrbScwm37;
  SB_PRB_SCWM_38: SbPrbScwm38;
  SB_PRB_SCWM_39: SbPrbScwm39;
}

export interface SbPrbScwm37 {
  variant_product: VariantProduct;
  campaign_name: string;
  profit_message: string;
}

export interface VariantProduct {
  size: string;
}

export interface SbPrbScwm38 {
  variant_product: VariantProduct;
  campaign_name: string;
  import_status_mail: ImportStatusMail;
  layers: Layer[];
}

export interface ImportStatusMail {
  success: string;
  fail: string;
  skip: string;
  image_status: string;
}

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

export interface SbPrbScwm39 {
  variant_product: VariantProduct;
  campaign_name: string;
  import_status_mail: ImportStatusMail;
  layers: Layer[];
  profit: string;
  data_invoice: DataInvoice;
  filter_tag: string;
}

export interface DataInvoice {
  amount_display: string;
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
