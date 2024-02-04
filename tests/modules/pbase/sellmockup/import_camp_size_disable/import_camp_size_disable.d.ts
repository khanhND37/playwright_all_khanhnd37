export interface ImportCampSizeDisable {
  env: Env;
  email_get_noti: string;
  email_scheduler: string;
  cases: Cases;
}

export interface Cases {
  SB_PRB_SCWM_23: SbPrbScwm23;
}

export interface SbPrbScwm23 {
  import_campaign: ImportCampaign;
  import_info: ImportInfo;
  verify_time: number;
  campaign_detail: CampaignDetail;
  campaign_sf: CampaignSf;
  import_status_mail: ImportStatusMail;
  error_content: string;
  picture: Picture;
}

export interface CampaignDetail {
  campaign_name: string;
  description: string;
  tags: string;
  style: string[];
  color: string[];
  size: string[];
  number_image: number;
}

export interface CampaignSf {
  variant: string;
  style: string;
  color: string;
  sale_price: string;
  compare_price: string;
}

export interface ImportCampaign {
  file_path: string;
  file_name: string;
  total_campaign: number;
}

export type ImportInfo = {
  status: string;
};

export interface ImportStatusMail {
  success: string;
  fail: string;
  skip: string;
  image_status: string;
}

export interface Picture {
  image: string;
}

export interface Env {
  local: Dev;
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
}
