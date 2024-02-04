export interface FunctionFlow {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_LP_CSP_07: SbWebBuilderLpCSP07;
}

export interface SbWebBuilderLpCSP07 {
  product_handle: string;
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
