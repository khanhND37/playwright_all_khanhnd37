export interface BlockButtonAddToCartBuyNow {
  env: Env;
  cases: BlockButtonAddToCartBuyNowCases;
}

export interface BlockButtonAddToCartBuyNowCases {
  VERIFY_BUTTONS_CREATOR: Verify;
  SB_WEB_BUILDER_PRD_04: SbWebBuilderPrd;
  SB_WEB_BUILDER_PRD_10: SbWebBuilderPrd;
  VERIFY_CHANGE_DATA_SOURCE: Verify;
  SB_WEB_BUILDER_PRD_08: SbWebBuilderPrd;
  SB_WEB_BUILDER_PRD_13: SbWebBuilderPrd;
  SB_WEB_BUILDER_PRD_31: SbWebBuilderPrd;
  SB_WEB_BUILDER_PRD_41: SbWebBuilderPrd;
  SB_WEB_BUILDER_PRD_14: SbWebBuilderPrd;
  SB_WEB_BUILDER_PRD_09: SbWebBuilderPrd;
  SB_WEB_BUILDER_PRD_92: SbWebBuilderPrd;
  SB_WEB_BUILDER_PRD_76: SbWebBuilderPrd;
  SB_WEB_BUILDER_PRD_78: SbWebBuilderPrd;
  SB_WEB_BUILDER_PRD_77: SbWebBuilderPrd;
}

export interface SbWebBuilderPrd {
  case_id: string;
  case_description: string;
  add_block: AddBlock;
  dnd_block: DNDBlock;
  button_name: ButtonName;
  link_helper_text?: string;
  hyperlink?: string;
  expected?: Expected;
  label?: string;
  paypal_link_helper_text?: string;
  hyperlink_redirect_url?: string;
  setting_block?: SettingBlock[];
  tooltip_text?: string;
}

export interface AddBlock {
  parent_position: AddBlockParentPosition;
  template: Template;
}

export interface AddBlockParentPosition {
  section: number;
  column: number;
}

export enum Template {
  Button = "Button",
  Section = "Section",
}

export enum ButtonName {
  AddToCart = "Add to cart",
  BuyNow = "Buy now",
}

export interface DNDBlock {
  from: From;
  to: DNDBlockTo;
}

export interface From {
  category: Category;
  template: Template;
}

export enum Category {
  Basics = "Basics",
}

export interface DNDBlockTo {
  position: AddBlockParentPosition;
}

export interface Expected {
  snapshot_sidebar_content: string;
}

export interface SettingBlock {
  style: string;
  text_color: TextColor;
  position: Align;
  align: Align;
  width: Height;
  height: Height;
  background: Background;
  border: Border;
  opacity: Opacity;
  radius: Opacity;
  shadow: Shadow;
  padding: Margin;
  margin: Margin;
}

export interface Align {
  label: AlignLabel;
  type: string;
}

export enum AlignLabel {
  AlignSelf = "align_self",
  Position = "position",
}

export interface Background {
  label: string;
  value: BackgroundValue;
}

export interface BackgroundValue {
  color: Color;
}

export interface Color {
  preset: number;
  opacity?: number;
}

export interface Border {
  label: string;
  value: BorderValue;
}

export interface BorderValue {
  thickness: string;
  color: Color;
}

export interface Height {
  label: HeightLabel;
  value: HeightValue;
}

export enum HeightLabel {
  BtnHeight = "btn_height",
  Width = "width",
}

export interface HeightValue {
  unit: Unit;
  value: number;
}

export enum Unit {
  Empty = "%",
  Px = "Px",
}

export interface Margin {
  label: MarginLabel;
  value: MarginValue;
}

export enum MarginLabel {
  BtnPadding = "btn_padding",
  Margin = "margin",
}

export interface MarginValue {
  top: number;
  left: number;
  bottom: number;
  right: number;
  input: boolean;
}

export interface Opacity {
  label: OpacityLabel;
  config: OpacityConfig;
}

export interface OpacityConfig {
  fill: boolean;
  number: number;
}

export enum OpacityLabel {
  BtnRadius = "btn_radius",
  Opacity = "opacity",
}

export interface Shadow {
  label: string;
  config: ShadowConfig;
}

export interface ShadowConfig {
  option: string;
  size: string;
  direction: string;
}

export interface TextColor {
  label: string;
  value: TextColorValue;
}

export interface TextColorValue {
  preset: number;
  hexText: string;
}

export interface SbWebBuilderPrd {
  case_id: string;
  case_description: string;
  add_block: AddBlock;
  dnd_block: DNDBlock;
  button_name: ButtonName;
  step_2: Step2;
  step_3: Step3;
  step_4: Step4;
}

export interface Step2 {
  product_title: string;
  variants: string[];
}

export interface Step3 {
  product_title: string;
}

export interface Step4 {
  product_title: string;
  variant: string;
}

export interface Verify {
  data: SbWebBuilderPrd[];
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
  theme_id: number;
  add_section: AddSection;
  dnd_blank_section: DNDBlankSection;
  cases: DevCases;
}

export interface AddSection {
  parent_position: AddSectionParentPosition;
  template: Template;
}

export interface AddSectionParentPosition {
  section: number;
}

export interface DevCases {
  VERIFY_BUTTONS_CREATOR: VerifyButtonsCreator;
}

export interface VerifyButtonsCreator {
  shop_data: ShopData;
}

export interface ShopData {
  domain: string;
  shop_name: string;
}

export interface DNDBlankSection {
  from: From;
  to: DNDBlankSectionTo;
}

export interface DNDBlankSectionTo {
  position: AddSectionParentPosition;
  isBottom: boolean;
}
