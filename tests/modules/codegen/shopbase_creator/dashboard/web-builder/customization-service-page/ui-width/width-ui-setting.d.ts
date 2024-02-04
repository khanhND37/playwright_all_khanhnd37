export interface Width {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_BCRE_BCS_09: SbWebBuilderBcreBcs09;
}

export interface SbWebBuilderBcreBcs09 {
  steps: Step[];
}

export interface Step {
  name: string;
  data: Datum[];
}

export interface Datum {
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
  width?: WidthClass;
}

export interface WidthClass {
  label: string;
  value: Value;
}

export interface Value {
  unit: "%" | "Px" | "Auto" | "Fill";
  value?: number;
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
  product_name?: string;
}
