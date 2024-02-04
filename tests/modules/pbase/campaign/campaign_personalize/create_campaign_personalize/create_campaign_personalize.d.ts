export interface CreateCampaignPersonalize {
  time_out: number;
  url_catalog: string;
  env: Env;
  cases: Cases;
}

export interface Cases {
  DATA_DRIVEN: DataDriven;
}

export interface DataDriven {
  data: Datum[];
}

export interface Datum {
  description: string;
  case_code: string;
  step: string;
  product_info: ProductInfo[];
  layers: Layer[];
  custom_options: CustomOption[];
  custom_option_info?: DatumCustomOptionInfo[];
  message_error?: string[];
  data_success?: DataSuccess;
  themes_setting: ThemesSetting;
  pricing_info: PricingInfo;
  s3_path?: string;
  local_path?: string;
  picture?: string[];
  layers_base_2?: LayersBase2[];
  base_number?: number;
}

export interface DatumCustomOptionInfo {
  type: string;
  value: string;
  custom_name: string;
  value_2?: string;
  folder_clipart?: string;
}

export interface CustomOption {
  type?: string;
  target_layer?: string;
  label?: string;
  allow_character?: string;
  font?: Font;
  position?: string;
  value?: string;
  type_clipart?: string;
  value_clipart?: string;
  type_display_clipart?: string;
  target_layer_base_product?: string[];
}

export enum Font {
  LillyMaeRegular = "Lilly Mae Regular",
}

export interface DataSuccess {
  custom_option_info: DataSuccessCustomOptionInfo[];
}

export interface DataSuccessCustomOptionInfo {
  type: string;
  value: string;
  custom_name: string;
}

export interface Layer {
  layer_type: LayerType;
  layer_value?: LayerValue;
  location_layer_x?: string;
  location_layer_y?: string;
  image_name?: string;
  rotate_layer?: string;
  opacity_layer?: string;
  layer_size_h?: string;
  layer_size_w?: string;
}

export enum LayerType {
  Image = "Image",
  Text = "Text",
}

export enum LayerValue {
  Text1 = "Text 1",
  Text2 = "Text 2",
  Text3 = "Text 3",
}

export interface LayersBase2 {
  layer_type: LayerType;
  layer_value: LayerValue;
  location_layer_x: string;
  location_layer_y: string;
}

export interface PricingInfo {
  title: string;
  description: Description;
}

export enum Description {
  DescriptionCampaignPersonalize = "Description Campaign personalize",
}

export interface ProductInfo {
  category: string;
  base_product: string;
  title: string;
}

export enum ThemesSetting {
  Inside = "Inside",
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
}
