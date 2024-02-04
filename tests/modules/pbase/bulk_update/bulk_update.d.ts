export interface BulkUpdate {
  env: Env;
  timeout: string;
  cases: Cases;
}

export interface Cases {
  DATA_DRIVEN: DataDriven;
}

export interface DataDriven {
  data: Datum[];
}

export interface Datum {
  case_id: string;
  description: string;
  picture: Picture;
  data_campaign: DataCampaign;
  validate_bulk_update_info: ValidateBulkUpdateInfo;
  bulk_update_info: BulkUpdateInfo;
}

export interface BulkUpdateInfo {
  condition_type: string;
  conditions: string[];
  actions: string[];
}

export interface DataCampaign {
  product_infos: ProductInfo[];
  layers: Layer[];
  custom_options: CustomOption[];
  pricing_info: PricingInfo;
}

export interface CustomOption {
  type: string;
  target_layer: string;
  label: Label;
  position?: string;
  value?: string;
  type_clipart?: string;
  value_clipart?: string;
}

export enum Label {
  Co1 = "CO1",
  Co2 = "CO2",
}

export interface Layer {
  layer_type: LayerType;
  location_layer_x?: string;
  location_layer_y?: string;
  layer_size_h?: string;
  layer_size_w?: string;
  front_or_back: FrontOrBack;
  image_name?: string;
}

export enum FrontOrBack {
  Back = "Back",
  Front = "Front",
}

export enum LayerType {
  Image = "Image",
  Text = "Text",
}

export interface PricingInfo {
  title: string;
}

export interface ProductInfo {
  category: string;
  base_product: string;
}

export interface Picture {
  picture_sf: string;
  picture_dashboard: string;
}

export interface ValidateBulkUpdateInfo {
  filter_validate: string;
  update_for_validate: string;
  action_validate: string;
  number_of_update_validate: string;
}

export interface Env {
  prod: Dev;
  prodtest: Dev;
  dev: Dev;
}

export interface Dev {
  api: string;
  domain: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
  username: string;
  password: string;
}
