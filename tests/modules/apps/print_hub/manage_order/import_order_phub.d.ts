export interface ImportOrderPhub {
  env: Env;
  timeout: string;
  max_diff_pixel_ratio: number;
  threshold: number;
  max_diff_pixels: number;
  cases: ImportOrderPhubCases;
}

export interface ImportOrderPhubCases {
  DATA_DRIVEN_VERIFY_IMPORT_ORDER: FluffyDATADRIVENVERIFYIMPORTORDER;
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
  cases: DevCases;
}

export interface DevCases {
  DATA_DRIVEN_VERIFY_IMPORT_ORDER: FluffyDATADRIVENVERIFYIMPORTORDER;
}

export interface FluffyDATADRIVENVERIFYIMPORTORDER {
  data: Datum[];
}

export interface Datum {
  description: string;
  case_id: string;
  order_infos: OrderInfo[];
  is_success?: boolean;
  file_import?: string;
}

export interface OrderInfo {
  image_popup: string;
  file_import?: string;
  tab_names?: TabNameElement[];
}

export interface TabNameElement {
  tab_name: TabNameEnum;
  order_name: string;
  image_dashboard: string;
}

export enum TabNameEnum {
  AwaitingPayment = "Awaiting Payment",
  Fulfilled = "Fulfilled",
  InReview = "In Review",
}
