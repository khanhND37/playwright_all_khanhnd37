export interface BorderUISetting {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_BCRE_BCS_11: SbWebBuilderBcreBcs11;
}

export interface SbWebBuilderBcreBcs11 {
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
  border?: Border;
}

export interface Border {
  label: string;
  value: Value;
}

export interface Value {
  thickness: "none" | "s" | "m" | "l" | "custom";
  style: "Solid" | "Dash";
  side: "All" | "Top" | "Left" | "Bottom" | "Right" | "Top & Bottom" | "Left & Right";
  size: Size;
  color: Color;
}

export interface Color {
  preset: number;
}

export interface Size {
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
}
