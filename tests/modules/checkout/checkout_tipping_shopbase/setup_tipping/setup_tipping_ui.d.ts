export interface SetupTippingUI {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_SB_DB_SF_TIP_3: SbSbDBSfTip;
  SB_SB_DB_SF_TIP_2: SbSbDBSfTip;
  SB_SB_DB_SF_TIP_5: SbSbDBSfTip;
}

export interface SbSbDBSfTip {
  product_checkout: Product[];
  tipping_layout: "Click to show detailed tipping options" | "Always show detailed tipping options";
  tipping_info: Tipping;
  tipping_valid: Tipping;
}

export interface Product {
  name: string;
  quantity: number;
}

export interface Tipping {
  percentages: number[];
  is_enable: boolean;
  is_old_layout: boolean;
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
  paypalAccount: PaypalAccount;
  product: Product;
  shipping_address: CustomerInfo;
  shop_theme: ShopTheme;
  tipping_info?: Tipping;
  tipping_valid?: Tipping;
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
  country_code?: string;
}

export interface PaypalAccount {
  username: string;
  password: string;
}

export interface ShopTheme {
  theme_id: number;
}
