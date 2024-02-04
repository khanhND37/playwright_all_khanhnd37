export interface CustomizationServicePage {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_LP_CSP_05: SbWebBuilderLpCSP05;
}

export interface SbWebBuilderLpCSP05 {
  shop_creator: Shop;
  shop_shopbase: Shop;
  shop_printbase: Shop;
  shop_plusbase: Shop;
}

export interface Shop {
  email: string;
  password: string;
  shop_domain: string;
}

export interface Env {
  local: Dev;
  dev: Dev;
  prodtest: Dev;
  prod: Dev;
}

export interface Dev {
  api: string;
  accounts_domain: string;
  domain: string;
  username: string;
  password: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
}

export interface SearchProductResp {
  data: Datum[];
  message: string;
  success: boolean;
  token: string;
}

export interface Datum {
  body_html: string;
  can_preview: boolean;
  clone_processing: string;
  created_at: Date;
  custom_options: string;
  default_image_id: number;
  display_options: string;
  handle: string;
  id: number;
  image: Image;
  member: number;
  metafields_global_description_tag: string;
  metafields_global_title_tag: string;
  product_availability: number;
  product_source: string;
  product_type: string;
  published: boolean;
  published_at: string;
  published_scope: string;
  sales: number;
  tags: string;
  template_suffix: string;
  title: string;
  updated_at: Date;
  variant_offers: null;
  vendor: string;
}

export interface Image {
  id: number;
  shop_id: number;
  product_id: number;
  src: string;
}

export interface CustomizationServicePage {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_LP_CSP_05: SbWebBuilderLpCSP05;
  SB_WEB_BUILDER_LP_CSP_07: SbWebBuilderLpCSP07;
}

export interface SbWebBuilderLpCSP05 {
  shop_creator: Shop;
  shop_shopbase: Shop;
  shop_printbase: Shop;
  shop_plusbase: Shop;
}

export interface Shop {
  email: string;
  password: string;
  shop_domain: string;
}

export interface SbWebBuilderLpCSP07 {
  product_name: string;
}

export interface Env {
  local: Dev;
  dev: Dev;
  prodtest: Dev;
  prod: Dev;
}

export interface Dev {
  api: string;
  accounts_domain: string;
  domain: string;
  username: string;
  password: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
}
