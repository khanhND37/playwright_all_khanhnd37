/* eslint-disable @typescript-eslint/no-empty-interface */
export interface Open {
  env: Env;
  cases: Cases;
}

export interface Cases {}

export interface Env {
  local: Dev;
  dev: Dev;
}

export interface Dev {
  hive_domain: string;
  hive_username: string;
  hive_password: string;
  domain: string;
  accounts_page: string;
  users: User[];
  card_test: CardTest;
}

export interface CardTest {
  number: string;
  expire: string;
  cvv: string;
}

export interface User {
  email: string;
  password: string;
  id: number;
}
