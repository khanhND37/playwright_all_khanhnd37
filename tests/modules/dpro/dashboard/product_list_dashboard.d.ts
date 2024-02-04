export interface ProductListDashboard {
  api: string;
  domain: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
  username: string;
  password: string;
  env: Env;
  product_list: ProductList[];
  set_pricing: SetPricing;
  cases: Cases;
}

export interface Cases {
  SB_SC_SCP_10: SbScSCP10;
  SB_SC_SCP_7: SbScSCP7;
  SB_SC_SCP_6: SbScSCP6;
  SB_SC_SCP_5: SbScSCP5;
  SB_SC_SCP_2: SbScSCP2;
  SB_SC_SCP_1: SbScSCP1;
  SB_SC_SCP_8: SbScSCP8;
}

export interface SbScSCP1 {
  product_name: string;
  more_actions: MoreAction[];
}

export interface MoreAction {
  product_name: string;
  description: string;
  action: string;
  status_verify?: string;
  product_copy?: string;
}

export interface SbScSCP10 {
  pre_thumnail: PreThumnail;
  product_thumbnails: ProductThumbnail[];
  verify_click_thumbnail: string;
  verify_click_name: string;
  verify_names: VerifyName[];
  verify_types: VerifyType[];
  verify_sales: VerifySale[];
  verify_members: Member[];
  has_member: Member;
  verify_create_dates: VerifyCreateDate[];
  verify_status: VerifyStatus[];
}

export interface Member {
  product_name: string;
  product_member: string;
}

export interface PreThumnail {
  product_name: string;
  type: string;
  file_path: string;
}

export interface ProductThumbnail {
  product_name: string;
  image_thumbnail?: string;
  image_default?: string;
}

export interface VerifyCreateDate {
  product_name: string;
  create_date: string;
}

export interface VerifyName {
  product_name: string;
}

export interface VerifySale {
  product_name: string;
  product_sales: string;
}

export interface VerifyStatus {
  product_name: string;
  status: string;
}

export interface VerifyType {
  product_name: string;
  product_type: string;
}

export interface SbScSCP2 {
  more_actions_multi_product: MoreAction[];
}

export interface SbScSCP5 {
  filters_title: Filters[];
}

export interface Filters {
  description: string;
  type: string;
  value: string;
  product_name: string;
  text_filter?: string;
  number: number;
}

export interface SbScSCP6 {
  filters_type_product: Filters[];
}

export interface SbScSCP7 {
  filters_status: Filters[];
}

export interface SbScSCP8 {
  filters: Filter[];
}

export interface Filter {
  type: string;
  value: string[];
  placeholder?: string;
  fill_text?: string;
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

export interface ProductList {
  product: Product;
}

export interface Product {
  title: string;
  product_type: string;
  published?: boolean;
}

export interface SetPricing {
  product_name: string;
  amount: string;
  email: string;
}
