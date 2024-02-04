export interface OpaySmokePlbCheckoutStripe {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_PLB_CO_108: SbPlbCo108;
}

export interface SbPlbCo108 {
  products_checkout: ProductsCheckout[];
}

export interface ProductsCheckout {
  name: string;
  quantity: number;
}

export interface Env {
  dev: Dev;
  prod: Dev;
  prodtest: Dev;
}

export interface Dev {
  api: string;
  username: string;
  password: string;
  domain: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
  shipping_address: ShippingAddress;
  shop_template: ShopTemplate;
  payment_method: string;
  card_info: CardInfo;
}

export interface CardInfo {
  number: string;
  holder_name: string;
  expire_date: string;
  cvv: string;
}

export interface ShippingAddress {
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  phone_number: string;
  country_code: string;
}

export interface ShopTemplate {
  domain: string;
  shop_name: string;
  user_id: number;
  shopid: number;
  username: string;
  password: string;
}
