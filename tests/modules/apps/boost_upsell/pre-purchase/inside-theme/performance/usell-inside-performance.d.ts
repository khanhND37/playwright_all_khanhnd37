/* eslint-disable */
export interface UsellInsidePerformance {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_SF_BUSF_PPSF_UPRP_3: SbSfBusfPpsfUprp3;
}

export interface SbSfBusfPpsfUprp3 {
  form_checkout: FormCheckout;
}

export interface FormCheckout {
  form_shipping: FormShipping;
}

export interface FormShipping {
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  phone_number: string;
}

export interface Env {
  local: Local;
  dev: Dev;
  prodtest: Dev;
  prod: Local;
}

export interface Dev {}

export interface Local {
  api: string;
  accounts_domain: string;
  domain: string;
  username: string;
  password: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
  offer: Offer;
  target_product: TargetProduct;
  recommend_product: RecommendProduct;
}

export interface Offer {
  id: number;
  name: string;
}

export interface RecommendProduct {
  product_b: Product;
  product_c: Product;
}

export interface Product {
  name: string;
  price: number;
}

export interface TargetProduct {
  handle: string;
}
