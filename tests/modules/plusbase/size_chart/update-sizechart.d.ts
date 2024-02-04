export interface UpdateSizechart {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_PLB_OTMSC_10: SbPlbOtmsc10;
  SB_PLB_OTMSC_16: SbPlbOtmsc1;
  SB_PLB_OTMSC_15: SbPlbOtmsc1;
  SB_PLB_OTMSC_14: SbPlbOtmsc1;
  SB_PLB_OTMSC_17: SbPlbOtmsc17;
  SB_PLB_OTMSC_11: SbPlbOtmsc11;
  SB_PLB_OTMSC_12: SbPlbOtmsc12;
}

export interface SbPlbOtmsc10 {
  product_name: string;
  alert_message: string;
}

export interface SbPlbOtmsc11 {
  product_name: string;
  variants: string[];
}

export interface SbPlbOtmsc12 {
  product_name: string;
  message: string;
  new_variant: string;
  index_variant: number;
}

export interface SbPlbOtmsc1 {
  product_name: string;
  product_handle: string;
  sizechart_name: string;
  data_size_guide?: Array<string[]>;
  message: string;
}

export interface SbPlbOtmsc17 {
  product_name: string;
  product_handle: string;
  data_size_guide: Array<string[]>;
}

export interface SbPlbOtmsc {
  product_name: string;
  current_size: string;
  new_size: string;
  message: string;
}

export interface Env {
  prod: Dev;
  prodtest: Dev;
  dev: Dev;
}

export interface Dev {
  api: string;
  shop_name: string;
  username: string;
  password: string;
  domain: string;
  odoo_host: string;
  odoo_db: string;
  odoo_username: string;
  odoo_password: string;
  plb_template?: PlbTemplate;
}

export interface PlbTemplate {
  domain: string;
  shop_name: string;
  user_id: string;
  shop_id: string;
  username: string;
  password: string;
  shop: string;
}
