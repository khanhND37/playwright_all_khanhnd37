export interface BackgroundUISetting {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_BCRE_BCS_10: SbWebBuilderBcreB;
  SB_WEB_BUILDER_BCRE_BSQ_11: SbWebBuilderBcreB;
}

export interface SbWebBuilderBcreB {
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
  background?: Background;
}

export interface Background {
  label: string;
  value?: Value;
  image?: Image;
}

export interface Image {
  url: string;
  size?: "Cover" | "Contain";
  position: number;
  overlay: Overlay;
  repeat: boolean;
}

export interface Overlay {
  preset: number;
}

export interface Value {
  color?: Overlay;
  image?: Image;
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
