export interface ImportCampSkip {
  env: Env;
  email_get_noti: string;
  email_scheduler: string;
  cases: Cases;
}

export interface Cases {
  SB_PRB_SCWM_25: SbPrbScwm25;
}

export interface SbPrbScwm25 {
  import_campaign: ImportCampaign[];
  import_info: ImportInfo[];
  campaign_detail: CampaignDetail;
}

export interface CampaignDetail {
  campaign_name: string;
}

export interface ImportCampaign {
  file_name: string;
  file_path: string;
}

export type ImportInfo = {
  status_first: string;
  status_second: string;
};

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
