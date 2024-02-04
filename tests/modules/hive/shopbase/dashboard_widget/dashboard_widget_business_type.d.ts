export type DashboardWidgetBusinessType = {
  env: Env;
  cases: Cases;
};

export type Cases = {
  SB_HM_WG_4: SbHmWg4;
};

export type SbHmWg4 = {
  message_success: string;
  widgets: Widget[];
  shops: Shop[];
};

export type Shop = {
  param: string;
  business_types: string;
  domain: string;
  shop_name: string;
  shop_id: number;
  expect_widget_ids?: number[];
};

export type Widget = {
  id: number;
  tabs: Tabs;
};

export type Tabs = {
  logic: Logic;
  ui: UI;
};

export type Logic = {
  name: string;
  status: boolean;
  screen: string;
  business_types: string[];
};

export type UI = {
  widget_type: string;
  title: string;
  description: string;
  primary_button: AryButton;
  secondary_button: AryButton;
  image: string;
  childs?: Child[];
};

export type Child = {
  title: string;
  descripition: string;
  link: string;
  image_url: string;
};

export type AryButton = {
  text?: string;
  link?: string;
};

export type Env = {
  local: Dev;
  dev: Dev;
};

export type Dev = {
  api: string;
  hive_domain: string;
  hive_username: string;
  hive_password: string;
  username: string;
  password: string;
  user_id: number;
};
