export interface ManageCampaign {
  env: Env;
  time_out: number;
  max_diff_pixel_ratio: number;
  threshold: number;
  max_diff_pixels: number;
  cases: Cases;
  url_catalog: string;
  url_shipping_combo: string;
}

export interface Cases {
  SB_PRB_MC_1: SbPrbMc1;
  SB_PRB_MC_2: SbPrbMc2;
  SB_PRB_MC_6: SbPrbMc6;
}

export interface SbPrbMc1 {
  campaign_delete: string;
  campaign_search: CampaignSearch[];
  data: Datum[];
}

export interface CampaignSearch {
  campaign_search: string;
  total_product: number;
}

export interface Datum {
  campaign_info: CampaignInfo;
}

export interface CampaignInfo {
  product_infos: ProductInfo[];
  layers: Layer[];
  pricing_info: PricingInfo;
}

export interface Layer {
  layer_type: string;
  layer_value: string;
  front_or_back: string;
}

export interface PricingInfo {
  title: string;
}

export interface ProductInfo {
  category: string;
  base_product: string;
}

export interface SbPrbMc2 {
  campaign_info: CampaignInfo;
  action_campaign_unavailable: string;
  action_campaign_available: string;
  snapshot_name: SBPRBMC2_SnapshotName;
  status_unavailable: string;
  status_available: string;
}

export interface SBPRBMC2_SnapshotName {
  popup_unavailable: string;
  popup_available: string;
}

export interface SbPrbMc6 {
  action_delete_available: string;
  campaign_info: CampaignInfo;
  snapshot_name: SBPRBMC6_SnapshotName;
}

export interface SBPRBMC6_SnapshotName {
  popup_delete: string;
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
}
