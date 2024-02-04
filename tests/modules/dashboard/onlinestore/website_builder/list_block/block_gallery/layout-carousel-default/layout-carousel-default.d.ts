export interface LayoutCarouselDefault {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_PRD_60: SbWebBuilderPrd60;
}

export interface SbWebBuilderPrd60 {
  snapshot: Snapshot;
}

export interface Snapshot {
  sidebar: Sidebar;
  sf: Sf;
}

export interface Sf {
  product_view_all: string;
}

export interface Sidebar {
  tab_design: string;
  tab_content: string;
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
