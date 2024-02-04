export interface MyProductSort {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_NEWECOM_MP_53: SbNewecomMp53;
}

export interface SbNewecomMp53 {
  first_sort: FirstSort;
  second_sort: Sort;
  third_sort: Sort;
  fourth_sort: Sort;
}

export interface FirstSort {
  expect_select_sort_value: string;
  products: string[];
}

export interface Sort {
  sort_value: string;
  expect_select_sort_value: string;
  products: string[];
}

export interface Env {
  local: Dev;
  dev: Dev;
  prodtest: Dev;
  prod: Dev;
}

export interface Dev {
  api: string;
  accounts_domain: string;
  domain: string;
  username: string;
  password: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
}
