export interface Accessory {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_BUS_AC_7: SbBusAC;
  SB_BUS_AC_8: SbBusAC;
  SB_BUS_AC_11: SbBusAC11;
}

export interface SbBusAC11 {
  case_id: string;
  target_product: string;
  target_product_handle: string;
  recommended_product: string;
  recommended_product_pricing: string;
  recommended_product_quantity: number;
  message_error: string;
  fill_custom_option: string;
}

export interface SbBusAC {
  case_id: string;
  target_product: string;
  recommended_product: string;
  target_product_handle: string;
  recommended_product_variant?: string;
}

export interface Env {
  local: Dev;
  dev: Dev;
  prodtest: Dev;
  prod: Dev;
}

export interface Dev {
  domain: string;
  shop_name: string;
  domain_tail: string;
  api: string;
  username: string;
  password: string;
  shop_id: number;
  user_id: number;
  pre_condition: PreCondition;
  accounts_domain?: string;
}

export interface PreCondition {
  theme_id: number;
  template_name: string;
}
