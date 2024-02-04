/* eslint-disable @typescript-eslint/no-empty-interface */
export interface OpayCheckout {
  env: Env;
  cases: Cases;
}

export interface Cases {
  DATA_DRIVEN: DataDriven[];
}

export interface DataDriven {
  case_id: string;
  case_description: string;
  shop_info: ShopInfo;
  payment_method: string;
  shop_type: "shopbase" | "printbase" | "plusbase";
}

export interface ShopInfo {
  domain: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
  username: string;
  password: string;
}

export interface Env {
  prod: Prod;
  prodtest: Dev;
  dev: Dev;
  local: Dev;
}

export interface Dev {}

export interface Prod {
  api: string;
  product_info: ProductInfo[];
  product_ppc_name: string;
  customer_info: CustomerInfo;
}

export interface CustomerInfo {
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

export interface ProductInfo {
  name: string;
  quantity: number;
}
