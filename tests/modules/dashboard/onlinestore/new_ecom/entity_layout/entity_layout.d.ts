export interface EntityLayout {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_NEWECOM_NEP_3: SbNewecomNEP3;
  SB_NEWECOM_NEP_4: SbNewecomNEP;
  SB_NEWECOM_NEP_5: SbNewecomNEP;
  SB_NEWECOM_NEP_6: SbNewecomNEP6;
  SB_NEWECOM_NEP_7: SbNewecomNEP7;
  SB_NEWECOM_NEP_18: SbNewecomNEP18;
  SB_NEWECOM_NEP_19: SbNewecomNEP19;
  SB_NEWECOM_NEP_20: SbNewecomNEP20;
  SB_NEWECOM_NEP_21: SbNewecomNEP21;
  SB_NEWECOM_NEP_24: SbNewecomNEP24;
  SB_NEWECOM_NEP_27: SbNewecomNEP27;
}

export interface SbNewecomNEP18 {
  products_unpublish: string[];
  custom_layout_product: CustomLayoutProduct[];
  template: string;
  blockSetting: SBNEWECOMNEP18_BlockSetting;
  expect: SBNEWECOMNEP18_Expect;
}

export interface SBNEWECOMNEP18_BlockSetting {
  background: Background;
  border: BlockSettingBorder;
}

export interface Background {
  color: Color;
}

export interface Color {
  preset: number;
  hexText: string;
}

export interface BlockSettingBorder {
  thickness: "none" | "s" | "m" | "l" | "custom";
  color: Color;
}

export interface CustomLayoutProduct {
  product_name: string;
  is_available: boolean;
  expect_product_template: string;
}

export interface SBNEWECOMNEP18_Expect {
  background_color: string;
  border: ExpectBorder;
}

export interface ExpectBorder {
  boder_bottom_color: string;
  boder_bottom_style: string;
  boder_bottom_width: string;
  boder_top_color: string;
  boder_top_style: string;
  boder_top_width: string;
  boder_left_color: string;
  boder_left_style: string;
  boder_left_width: string;
  boder_right_color: string;
  boder_right_style: string;
  boder_right_width: string;
}

export interface SbNewecomNEP19 {
  product_name_custom: string;
  product_default_layout: string;
  template: string;
  blockSetting: SBNEWECOMNEP18_BlockSetting;
  expect: SBNEWECOMNEP18_Expect;
}

export interface SbNewecomNEP20 {
  product_name: string;
  template: string;
  blockSetting: SBNEWECOMNEP18_BlockSetting;
  expect: SBNEWECOMNEP18_Expect;
}

export interface SbNewecomNEP21 {
  product_name: string;
  template: string;
  blockSetting: SBNEWECOMNEP21_BlockSetting;
  expect: SBNEWECOMNEP21_Expect;
}

export interface SBNEWECOMNEP21_BlockSetting {
  background: Background;
  border: BlockSettingBorder;
  opacity: Opacity;
  radius: Opacity;
  padding: BlockSettingPadding;
  shadow?: Shadow;
}

export interface Opacity {
  fill: boolean;
  number: number;
}

export interface BlockSettingPadding {
  top: number;
  left: number;
  bottom: number;
  right: number;
  input?: boolean;
}

export interface Shadow {
  option: "none" | "soft" | "hard";
  size: "S" | "M" | "L";
  direction: "Top Right" | "Top Left" | "Bottom Right" | "Bottom Left" | "Bottom";
}

export interface SBNEWECOMNEP21_Expect {
  background_color: string;
  opacity: string;
  border: ExpectBorder;
  padding: ExpectPadding;
  border_radius?: BorderRadius;
}

export interface BorderRadius {
  border_bottom_left_radius: string;
  border_bottom_right_radius: string;
  border_top_left_radius: string;
  border_top_right_radius: string;
}

export interface ExpectPadding {
  padding_top: string;
  padding_bottom: string;
  padding_left: string;
  padding_right: string;
}

export interface SbNewecomNEP24 {
  product_name: string;
  template: string;
  switch_template: string;
}

export interface SbNewecomNEP27 {
  product_name: string;
}

export interface SbNewecomNEP3 {
  blocks: string[];
  product_name: string;
  tabs: string[];
  collection_name: string;
}

export interface SbNewecomNEP {
  product_name: string;
  handle_product: string;
  blockSetting: SBNEWECOMNEP4_BlockSetting;
  expect: SBNEWECOMNEP21_Expect;
  other_product?: OtherProduct;
}

export interface SBNEWECOMNEP4_BlockSetting {
  background: Background;
  border: BlockSettingBorder;
  opacity: Opacity;
  padding: BlockSettingPadding;
}

export interface OtherProduct {
  title: string;
  handle: string;
}

export interface SbNewecomNEP6 {
  product_name: string;
  products_unpublish: string[];
  product_search: ProductSearch;
  product_selected: ProductSelected;
  data: Data;
  expect: SBNEWECOMNEP6_Expect;
}

export interface Data {
  section: Section;
  blockSetting: SBNEWECOMNEP21_BlockSetting;
}

export interface Section {
  dnd_block: DNDBlock;
}

export interface DNDBlock {
  from: From;
  to: To;
}

export interface From {
  category: string;
  template: string;
}

export interface To {
  position: Position;
  isBottom: boolean;
}

export interface Position {
  section: number;
  column: number;
}

export interface SBNEWECOMNEP6_Expect {
  snapshot_preview_settingdata: string;
  snapshot_storefront_settingdata: string;
}

export interface ProductSearch {
  product_unavailable: string;
  product_available: string;
}

export interface ProductSelected {
  name: string;
  handle: string;
}

export interface SbNewecomNEP7 {
  product_name: string;
  products_unpublish: string[];
}

export interface Env {
  dev: Dev;
  local: Dev;
  prodtest: Dev;
  prod: Dev;
}

export interface Dev {
  api: string;
  domain: string;
  shop_name: string;
  platform: Platform;
  username: string;
  password: string;
  user_id: number;
  hover: string;
  shop_data: ShopDatum[];
  add_section: AddSection;
  accounts_domain?: string;
}

export interface AddSection {
  parent_position: ParentPosition;
  template: string;
}

export interface ParentPosition {
  section: number;
}

export enum Platform {
  Plusbase = "plusbase",
  Printbase = "printbase",
  Shopbase = "shopbase",
}

export interface ShopDatum {
  domain: string;
  shop_name: string;
  platform: Platform;
}
