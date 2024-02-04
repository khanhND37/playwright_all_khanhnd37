export interface OpacityUISetting {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_BCRE_BCS_12: SbWebBuilderBcreBcs12;
}

export interface SbWebBuilderBcreBcs12 {
  steps: Step[];
}

export interface Step {
  name: string;
  aligns: Align[];
}

export interface Align {
  style: Style;
  screenshot_name: ScreenshotName;
}

export interface ScreenshotName {
  wb_sidebar: string;
  wb: string;
  sf_preview: string;
  sf: string;
}

export interface Style {
  opacity?: Opacity;
}

export interface Opacity {
  label: string;
  config: Config;
}

export interface Config {
  fill: boolean;
  number: number;
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
  product_handle?: string;
}
