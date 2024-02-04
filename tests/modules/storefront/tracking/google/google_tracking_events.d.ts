export interface GoogleTrackingEvents {
  env: Env;
  product: Product;
  checkout_info: CheckoutInfo;
  card: Card;
  timeout: number;
  cases: Cases;
}

export interface Card {
  number: string;
  holder_name: string;
  expire_date: string;
  cvv: string;
}

export interface Cases {
  DATA_DRIVEN: DataDriven;
}

export interface DataDriven {
  data: Datum[];
}

export interface Datum {
  description: string;
  case_id: string;
  ga_id: string;
  send_to: string[];
  checkout_layout: string;
  view_page: View;
  search: Search;
  view_product: ViewProduct;
  add_to_cart: AddToCart;
  view_cart: View;
  buy_now: AddToCart;
  begin_checkout: BeginCheckout;
  promotion_code: string;
  use_coupon: UseCoupon;
  custom_info?: Info;
  shipping_method: Method;
  purchase: Purchase;
  checkout_info?: Info;
  payment_method?: Method;
  is_checkout_paypal?: boolean;
}

export interface AddToCart {
  event: string[];
  item_quantity: number;
}

export interface BeginCheckout {
  event: string[];
  currency: string;
}

export interface Info {
  event: Event[];
  checkout_step: number;
}

export enum Event {
  CheckoutProgress = "checkout_progress",
  Purchase = "purchase",
  SetCheckoutOption = "set_checkout_option",
}

export interface Method {
  checkout_option: string;
  checkout_step?: number;
  value?: string;
  event?: string[];
}

export interface Purchase {
  event?: string[];
  checkout_option?: string;
  checkout_step: number;
  currency?: string;
}

export interface Search {
  event: string[];
  event_category: string;
}

export interface UseCoupon {
  event: Event[];
  checkout_option: string;
}

export interface View {
  event: string[];
  page_path: string;
  page_title: string;
}

export interface ViewProduct {
  event: string[];
}

export interface CheckoutInfo {
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
  prod: Dev;
  prodtest: Dev;
  dev: Dev;
}

export interface Dev {
  api: string;
  domain: string;
  username: string;
  password: string;
  user_id: number;
  shop_id: number;
  shop_name: string;
}

export interface Product {
  images: Image[];
  options: Option[];
  variants: Variant[];
  body_html: string;
  title: string;
  metafields_global_title_tag: string;
  metafields_global_description_tag: string;
  variantDefault: Variant;
  tags: string;
  product_availability: number;
  tracking_id: string;
  tracking_access_token: string;
}

export interface Image {
  src: string;
  position: number;
}

export interface Option {
  name: string;
  values: string[];
}

export interface Variant {
  active: boolean;
  option1: string;
  price: number;
  sku: string;
  compare_at_price: number;
  cost_per_item: number;
  bar_code: number;
  weight: number;
  is_default?: boolean;
  weight_unit: string;
  inventory_quantity: number;
  inventory_management: string;
  inventory_policy: string;
  requires_shipping: boolean;
  taxable: boolean;
  fulfillment_service: string;
  shipping_profile_id: number;
  title?: string;
  position?: number;
}
