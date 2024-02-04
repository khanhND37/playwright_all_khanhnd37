export interface CheckoutTipping {
  env: Env;
  cases: Cases;
}

export interface Cases {
  TC_SB_TIP_06: TcSbTip;
  TC_SB_TIP_07: TcSbTip;
  TC_SB_TIP_08: TcSbTip;
  TC_SB_TIP_09: TcSbTip;
  TC_SB_TIP_10: TcSbTip;
  TC_SB_TIP_17: TcSbTip;
}

export interface TcSbTip {
  tipping_info: TCSBTIP06_TippingInfo;
}

export interface TCSBTIP06_TippingInfo {
  percentages?: number[];
  enabled: boolean;
  is_old_layout: boolean;
  option?: string;
  shop_type?: string;
  tipping_amount?: string;
}

export interface Env {
  prod: Dev;
  prodtest: Dev;
  dev: Dev;
}

export interface Dev {
  api: string;
  domain: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
  username: string;
  password: string;
  customer_info: CustomerInfo;
  product: Product[];
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

export interface Product {
  name: string;
  quantity: number;
}
