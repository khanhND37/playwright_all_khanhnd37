export interface FunctionProperty {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_LP_CSP_06: SbWebBuilderLpCSP06;
}

export interface SbWebBuilderLpCSP06 {
  heading_text: string;
  paragraph_text: string;
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
  section_id: SectionID;
}

export interface SectionID {
  header: string;
  customization_service: string;
  footer: string;
}
