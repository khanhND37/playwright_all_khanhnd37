export interface ShadowUISetting {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_BCRE_BCS_14: SbWebBuilderBcreB;
  SB_WEB_BUILDER_BCRE_BSQ_15: SbWebBuilderBcreB;
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
  shadow?: Shadow;
}

export interface Shadow {
  label: string;
  config: Config;
}

export interface Config {
  option: "none" | "soft" | "hard";
  size?: "S" | "M" | "L";
  direction?: "Top Right" | "Top Left" | "Bottom Right" | "Bottom Left" | "Bottom";
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
