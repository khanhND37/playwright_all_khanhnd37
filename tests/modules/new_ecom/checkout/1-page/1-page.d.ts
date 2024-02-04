export interface CheckoutGatewaysNe1_Page {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_CHE_CHEN_NE_1PAGE: SbCheChenNe1Page[];
  SB_CHE_CHEN_NE_1PAGE_PPC: SbCheChenNe1Page[];
}

export interface SbCheChenNe1Page {
  case_id: string;
  case_name: string;
  payment_method: string;
  product_ppc_name?: ProductPPCName;
}

export enum ProductPPCName {
  Bikini = "Bikini",
  Empty = "",
}

export interface Env {
  prod: Dev;
  prodtest: Dev;
  dev: Dev;
}

export interface Dev {
  api: string;
  username: string;
  password: string;
  domain: string;
  shop_name: string;
  products_checkout: ProductsCheckout[];
  products_checkout_ppc: ProductsCheckout[];
}

export interface ProductsCheckout {
  variant_id: number;
  quantity: number;
}
