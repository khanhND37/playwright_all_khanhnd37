export interface AlignUISetting {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_BCRE_BSQ_08: SbWebBuilderBcreBsq08;
  SB_WEB_BUILDER_BCRE_BSQ_10: SbWebBuilderBcreBsq10;
}

export interface SbWebBuilderBcreBsq08 {
  steps: SBWEBBUILDERBCREBSQ08_Step[];
}

export interface SBWEBBUILDERBCREBSQ08_Step {
  name: string;
  aligns: PurpleAlign[];
}

export interface PurpleAlign {
  active_index: number;
  verify_properties: VerifyProperty[];
  style?: PurpleStyle;
}

export interface PurpleStyle {
  align: StyleAlign;
}

export interface StyleAlign {
  label: string;
  type: "Center" | "Left" | "Right";
}

export interface VerifyProperty {
  property: string;
  value: string;
}

export interface SbWebBuilderBcreBsq10 {
  steps: SBWEBBUILDERBCREBSQ10_Step[];
}

export interface SBWEBBUILDERBCREBSQ10_Step {
  name: string;
  aligns: FluffyAlign[];
}

export interface FluffyAlign {
  style: FluffyStyle;
  screenshot_name: ScreenshotName;
}

export interface ScreenshotName {
  wb_sidebar: string;
  wb: string;
  sf_preview: string;
  sf: string;
}

export interface FluffyStyle {
  width?: Width;
  align?: StyleAlign;
}

export interface Width {
  label: string;
  value: Value;
}

export interface Value {
  unit: string;
  value: number;
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
