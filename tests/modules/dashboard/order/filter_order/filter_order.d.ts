export interface FilterOrder {
  env: Env;
  cases: FilterOrderCases;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FilterOrderCases {}

export interface Env {
  local: Local;
  dev: Local;
  prodtest: Local;
  prod: Local;
}

export interface Local {
  api: string;
  username: string;
  password: string;
  domain: string;
  shop_name: string;
  cases?: Cases;
}

export interface Cases {
  SB_RLS_OD_MFSB_7: SbRlsOdMfsb7;
  SB_RLS_OD_MFSB_40: SbRlsOdMfsb40;
  SB_RLS_OD_MFSB_41: SbRlsOdMfsb41;
  DD_25_27: DD25_27;
}

export interface DD25_27 {
  data: Datum[];
}

export interface Datum {
  case_id: string;
  case_name: string;
  info_customer: InfoCustomer;
  quantity_orders: number;
}

export interface InfoCustomer {
  email: string;
}

export interface SbRlsOdMfsb40 {
  order_A: string;
  order_B: string;
  order_C: string;
}

export interface SbRlsOdMfsb41 {
  date_From: string;
  date_To: string;
  quantity_orders: number;
}

export interface SbRlsOdMfsb7 {
  products_checkout: ProductsCheckout[];
  product_fulfillment: ProductFulfillment[];
  fulfillment: Fulfillment;
}

export interface Fulfillment {
  tracking_company: string;
  line_items: LineItem[];
  notify_customer: boolean;
  service: string;
}

export interface LineItem {
  quantity: number;
}

export interface ProductFulfillment {
  product_name: string;
  quantities: number;
}

export interface ProductsCheckout {
  variant_id: number;
  quantity: number;
}
