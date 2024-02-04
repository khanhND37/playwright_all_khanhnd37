export interface StickyATC {
  env: Env;
}

export interface Env {
  local: Environment;
  dev: Environment;
  prodtest: Environment;
  prod: Environment;
}

export interface Environment {
  api: string;
  domain: string;
  shop_name: string;
  shop_id: number;
  username: string;
  password: string;
  user_id: number;
  theme_id: number;
}
