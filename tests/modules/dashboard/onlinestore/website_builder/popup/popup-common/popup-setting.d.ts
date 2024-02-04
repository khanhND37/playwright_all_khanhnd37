/* eslint-disable */
export interface PopupSetting {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_WBP_10: SBWEBBUILDERWBP10Class;
  SB_WEB_BUILDER_WBP_11: SbWebBuilderWbp11;
  SB_WEB_BUILDER_WBP_12: SBWEBBUILDERWBP12Class;
  SB_WEB_BUILDER_WBP_14: SBWEBBUILDERWBP14Class;
  SB_WEB_BUILDER_WBP_15: SBWEBBUILDERWBP15Class;
  SB_WEB_BUILDER_WBP_16: SBWEBBUILDERWBP16Class;
  SB_WEB_BUILDER_WBP_17: SbWebBuilderWbp17;
  SB_WEB_BUILDER_WBP_20: SbWebBuilderWbp17;
  SB_WEB_BUILDER_WBP_33: SBWEBBUILDERWBP10Class;
  SB_WEB_BUILDER_WBP_34: SbWebBuilderWbp34;
  SB_WEB_BUILDER_WBP_35: SBWEBBUILDERWBP12Class;
  SB_WEB_BUILDER_WBP_37: SBWEBBUILDERWBP14Class;
  SB_WEB_BUILDER_WBP_38: SBWEBBUILDERWBP15Class;
  SB_WEB_BUILDER_WBP_39: SBWEBBUILDERWBP16Class;
}

export interface SBWEBBUILDERWBP10Class {
  popup_timeout: number;
  steps: SBWEBBUILDERWBP10_Step[];
}

export interface SBWEBBUILDERWBP10_Step {
  name: string;
  data: PurpleData;
}

export interface PurpleData {
  style: PurpleStyle;
  classes: Class[];
  verify_fixed_top?: boolean;
  screenshot_name?: PurpleScreenshotName;
}

export enum Class {
  Bottom = "bottom",
  Center = "center",
  Left = "left",
  Middle = "middle",
  Right = "right",
  Top = "top",
}

export interface PurpleScreenshotName {
  wb_sidebar: string;
  sf: string;
  wb_sidebar_push_page_down?: string;
}

export interface PurpleStyle {
  position?: Position;
}

export interface Position {
  position: number;
  push_page_down?: boolean;
}

export interface SbWebBuilderWbp11 {
  popup_timeout: number;
  steps: SBWEBBUILDERWBP11_Step[];
}

export interface SBWEBBUILDERWBP11_Step {
  name: string;
  data: FluffyData;
}

export interface FluffyData {
  style: FluffyStyle;
  opacity_value: string;
}

export interface FluffyStyle {
  overlay?: number;
}

export interface SBWEBBUILDERWBP12Class {
  popup_timeout: number;
  step1_data: SBWEBBUILDERWBP12_Step1Datum[];
  step2_data: SBWEBBUILDERWBP12_Step2Datum[];
  step3_data: Step3Datum[];
}

export interface SBWEBBUILDERWBP12_Step1Datum {
  style: SbWebBuilderWbp17;
  expected_width_wb: string;
  expected_height_wb: string;
  expected_width_sf: string;
  expected_height_sf: number;
}

export interface SbWebBuilderWbp17 {}

export interface SBWEBBUILDERWBP12_Step2Datum {
  style: TentacledStyle;
  expected_width_wb: string;
  expected_width_sf: string;
}

export interface TentacledStyle {
  width: Width;
}

export interface Width {
  label: WidthLabel;
  value: WidthValue;
}

export enum WidthLabel {
  Height = "height",
  Width = "width",
}

export interface WidthValue {
  unit: Unit;
  value: number;
}

export enum Unit {
  Auto = "Auto",
  Empty = "%",
  Px = "Px",
}

export interface Step3Datum {
  style: Step3DatumStyle;
  expected_height_wb: string;
  expected_height_sf: string;
}

export interface Step3DatumStyle {
  height: Width;
}

export interface SBWEBBUILDERWBP14Class {
  popup_timeout: number;
  step1_data: SBWEBBUILDERWBP14_Step1Datum[];
  step2_data: SBWEBBUILDERWBP14_Step2Datum[];
}

export interface SBWEBBUILDERWBP14_Step1Datum {
  style: SbWebBuilderWbp17;
  verify_properties: VerifyProperty[];
}

export interface VerifyProperty {
  property: string;
  value: string;
}

export interface SBWEBBUILDERWBP14_Step2Datum {
  style: StickyStyle;
  verify_properties: VerifyProperty[];
}

export interface StickyStyle {
  background: Background;
}

export interface Background {
  label: string;
  value: BackgroundValue;
}

export interface BackgroundValue {
  color: PurpleColor;
}

export interface PurpleColor {
  preset: number;
}

export interface SBWEBBUILDERWBP15Class {
  popup_timeout: number;
  step1_data: SBWEBBUILDERWBP14_Step1Datum[];
  step2_data: SBWEBBUILDERWBP15_Step2Datum[];
}

export interface SBWEBBUILDERWBP15_Step2Datum {
  style: IndigoStyle;
  verify_properties: VerifyProperty[];
}

export interface IndigoStyle {
  border: Border;
}

export interface Border {
  label: string;
  value: BorderValue;
}

export interface BorderValue {
  thickness: string;
  style: string;
  side: string;
  color: FluffyColor;
  size?: SizeClass;
}

export interface FluffyColor {
  preset: number;
  hexText?: string;
}

export interface SizeClass {
  fill: boolean;
  number: number;
}

export interface SBWEBBUILDERWBP16Class {
  popup_timeout: number;
  step1_data: SBWEBBUILDERWBP16_Step1Datum[];
}

export interface SBWEBBUILDERWBP16_Step1Datum {
  style: Step1DatumStyle;
  verify_properties: VerifyProperty[];
}

export interface Step1DatumStyle {
  radius: Radius;
  shadow: Shadow;
  padding: Margin;
  margin: Margin;
}

export interface Margin {
  label: MarginLabel;
  value: MarginValue;
}

export enum MarginLabel {
  Margin = "margin",
  Padding = "padding",
}

export interface MarginValue {
  top: number;
  left: number;
  bottom: number;
  right: number;
  input: boolean;
}

export interface Radius {
  label: string;
  config: SizeClass;
}

export interface Shadow {
  label: string;
  config: ShadowConfig;
}

export interface ShadowConfig {
  option: string;
  size?: string;
  direction?: string;
}

export interface SbWebBuilderWbp34 {
  popup_timeout: number;
  steps: SBWEBBUILDERWBP34_Step[];
}

export interface SBWEBBUILDERWBP34_Step {
  name: string;
  data: TentacledData;
}

export interface TentacledData {
  style: FluffyStyle;
  opacity_value: string;
  screenshot_name: FluffyScreenshotName;
}

export interface FluffyScreenshotName {
  wb_sidebar: string;
  sf?: string;
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
