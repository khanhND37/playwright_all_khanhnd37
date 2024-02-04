export interface ProductCard {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_NEWECOM_WS_PDC_01: SbNewecomWsPdc01;
  SB_NEWECOM_WS_PDC_02: SbNewecomWsPdc02;
  SB_NEWECOM_WS_PDC_03: SbNewecomWsPdc03;
  SB_NEWECOM_WS_PDC_04: SbNewecomWsPdc04;
  SB_NEWECOM_WS_PDC_05: SbNewecomWsPdc05;
  SB_NEWECOM_WS_PDC_06: SbNewecomWsPdc06;
  SB_NEWECOM_WS_PDC_07: SbNewecomWsPdc07;
  SB_NEWECOM_WS_PDC_08: SbNewecomWsPdc08;
  SB_NEWECOM_WS_PDC_09: SbNewecomWsPdc09;
  SB_NEWECOM_WS_PDC_10: SbNewecomWsPdc10;
  SB_NEWECOM_WS_PDC_11: SbNewecomWsPdc11;
  SB_NEWECOM_WS_PDC_12: SbNewecomWsPdc12;
  SB_NEWECOM_WS_PDC_18: SbNewecomWsPdc18;
  SB_NEWECOM_WS_PDC_19: SbNewecomWsPdc19;
  SB_NEWECOM_WS_PDC_15: SbNewecomWsPdc15;
  SB_NEWECOM_WS_PDC_16: SbNewecomWsPdc16;
  SB_NEWECOM_WS_PDC_17: SbNewecomWsPdc17;
}

export interface SbNewecomWsPdc01 {
  expected: SBNEWECOMWSPDC01_Expected;
}

export interface SBNEWECOMWSPDC01_Expected {
  tooltips: Tooltips;
  popover: Popover;
}

export interface Popover {
  snapshot_popover_product_card: string;
}

export interface Tooltips {
  sold_out: Rating;
  sale: Rating;
  rating: Rating;
  when_click_atc: string;
}

export interface Rating {
  text: string;
  link: string;
}

export interface SbNewecomWsPdc02 {
  expected: SBNEWECOMWSPDC02_Expected;
}

export interface SBNEWECOMWSPDC02_Expected {
  image_ratio_dropdown: string[];
  image_cover_dropdown: string[];
  image_ratio: PurpleImageRatio[];
}

export interface PurpleImageRatio {
  value: string;
  tooltip: string;
  padding: string;
}

export interface SbNewecomWsPdc03 {
  expected: SBNEWECOMWSPDC03_Expected;
}

export interface SBNEWECOMWSPDC03_Expected {
  hover_effect_dropdown: string[];
}

export interface SbNewecomWsPdc04 {
  pre_condition: SBNEWECOMWSPDC04_PreCondition;
  truncated_product_name: string;
  expected: SBNEWECOMWSPDC04_Expected;
  font_paragraph: FontParagraph[];
}

export interface SBNEWECOMWSPDC04_Expected {
  font_dropdown: string[];
}

export interface FontParagraph {
  paragraph: string;
  font_number: number;
  font_size: string;
}

export interface SBNEWECOMWSPDC04_PreCondition {
  align: Align;
  background: PreConditionBackground;
  border: PreConditionBorder;
  show_rating: PurpleShowRating;
  padding: Padding;
}

export interface Align {
  label: AlignLabel;
  type: Type;
}

export enum AlignLabel {
  TextAlign = "text_align",
}

export enum Type {
  Center = "Center",
  Left = "Left",
  Right = "Right",
}

export interface PreConditionBackground {
  label: BackgroundLabel;
  value: PurpleValue;
}

export enum BackgroundLabel {
  CardBackground = "card_background",
}

export interface PurpleValue {
  color: PurpleColor;
}

export interface PurpleColor {
  preset: number;
}

export interface PreConditionBorder {
  label: BorderLabel;
  value: FluffyValue;
}

export enum BorderLabel {
  CardBorder = "card_border",
}

export interface FluffyValue {
  thickness: Thickness;
}

export enum Thickness {
  Hard = "hard",
  None = "none",
  Soft = "soft",
}

export interface PurpleShowRating {
  label_rating: string;
  setting: ShowRatingSetting;
}

export interface ShowRatingSetting {
  turn_on: TurnO;
}

export interface TurnO {
  show_icon: boolean;
}

export interface SbNewecomWsPdc05 {
  pre_condition: SBNEWECOMWSPDC05_PreCondition;
  snapshot_preview: string;
  styles: SBNEWECOMWSPDC05_Style[];
}

export interface SBNEWECOMWSPDC05_PreCondition {
  ratio: string;
  cover: string;
  font: string;
  compared_price: SoldoutClass;
  soldout: SoldoutClass;
  sale: SoldoutClass;
  show_rating: FluffyShowRating;
}

export interface SoldoutClass {
  label: string;
  show_icon: boolean;
}

export interface FluffyShowRating {
  label_rating: string;
  setting: ShowRatingSetting;
  rating_icon: string;
  rating_color: RatingColorClass;
}

export interface RatingColorClass {
  preset: number;
  hexText?: string;
}

export interface SBNEWECOMWSPDC05_Style {
  border: PurpleBorder;
  radius: StyleRadius;
  shadow: Shadow;
  padding: Padding;
  align: Align;
  background: PurpleBackground;
}

export interface PurpleBackground {
  label: BackgroundLabel;
  value: TentacledValue;
}

export interface TentacledValue {
  color?: FluffyColor;
  image?: Image;
}

export interface FluffyColor {
  preset: number;
  opacity?: number;
  hexText?: string;
  opacityText?: string;
}

export interface Image {
  url: string;
  size: string;
  position: number;
  repeat: boolean;
}

export interface PurpleBorder {
  label: BorderLabel;
  value: StickyValue;
}

export interface StickyValue {
  thickness: string;
  style?: StyleEnum;
  side?: string;
  color?: FluffyColor;
}

export enum StyleEnum {
  Dash = "Dash",
  Solid = "Solid",
}

export interface Padding {
  label: PaddingLabel;
  value: PaddingValue;
}

export enum PaddingLabel {
  CardPadding = "card_padding",
}

export interface PaddingValue {
  top: number;
  left: number;
  bottom: number;
  right: number;
  input: boolean;
}

export interface StyleRadius {
  label: LabelRadiusEnum;
  config: ConfigClass;
}

export interface ConfigClass {
  fill: boolean;
  number: number;
}

export enum LabelRadiusEnum {
  BorderRadius = "border_radius",
}

export interface Shadow {
  label: ShadowLabel;
  config: Config;
}

export interface Config {
  option: Thickness;
  size: Size;
  direction: string;
}

export enum Size {
  Empty = "",
  L = "L",
  M = "M",
  S = "S",
}

export enum ShadowLabel {
  CardShadow = "card_shadow",
}

export interface SbNewecomWsPdc06 {
  product_name: SBNEWECOMWSPDC06_ProductName;
  label_soldout: string;
  label_radius: LabelRadiusEnum;
  setting: SBNEWECOMWSPDC06_Setting;
}

export interface SBNEWECOMWSPDC06_ProductName {
  all_variant_soldout: string;
  no_variant_soldout: string;
  one_of_variants_soldout: string;
}

export interface SBNEWECOMWSPDC06_Setting {
  turn_on: TurnOn;
  turn_off: TurnO;
}

export interface TurnOn {
  show_icon: boolean;
  radius: ConfigClass;
}

export interface SbNewecomWsPdc07 {
  product_name: SBNEWECOMWSPDC07_ProductName;
  label_sale: string;
  label_radius: LabelRadiusEnum;
  setting: SBNEWECOMWSPDC06_Setting;
}

export interface SBNEWECOMWSPDC07_ProductName {
  price_is_less_than_compare_price: string;
  price_is_less_than_compare_price_but_soldout: string;
  price_is_greater_than_compare_price: string;
  price_is_equal_to_compare_price: string;
}

export interface SbNewecomWsPdc08 {
  label: string;
  available_product_name: string;
  soldout_product_name: string;
  setting: SBNEWECOMWSPDC08_Setting;
}

export interface SBNEWECOMWSPDC08_Setting {
  turn_on: TurnO;
  turn_off: TurnO;
}

export interface SbNewecomWsPdc09 {
  expected: SBNEWECOMWSPDC09_Expected;
}

export interface SBNEWECOMWSPDC09_Expected {
  click_atc_dropdown: string[];
}

export interface SbNewecomWsPdc10 {
  pre_condition: SBNEWECOMWSPDC10_PreCondition;
  product_name: string;
}

export interface SBNEWECOMWSPDC10_PreCondition {
  add_cart_button: SoldoutClass;
  show_rating: PurpleShowRating;
}

export interface SbNewecomWsPdc11 {
  collection_handle: string;
  expected: SBNEWECOMWSPDC11_Expected;
}

export interface SBNEWECOMWSPDC11_Expected {
  image_ratio: StyleImageRatio[];
  font: ExpectedFont;
  common_setting: CommonSetting;
}

export interface CommonSetting {
  pre_condition: CommonSettingPreCondition;
  snapshot_preview: string;
  styles: SBNEWECOMWSPDC05_Style[];
}

export interface CommonSettingPreCondition {
  compared_price: SoldoutClass;
  soldout: SoldoutClass;
  sale: SoldoutClass;
  add_cart_button: SoldoutClass;
}

export interface ExpectedFont {
  pre_condition: FontPreCondition;
  truncated_product_name: string;
  font_paragraph: FontParagraph[];
}

export interface FontPreCondition {
  align: Align;
  background: PreConditionBackground;
  border: PreConditionBorder;
  show_rating: FluffyShowRating;
  padding: Padding;
}

export interface StyleImageRatio {
  value: string;
  padding: string;
}

export interface SbNewecomWsPdc12 {
  collection_handle: string;
  pre_condition: SBNEWECOMWSPDC12_PreCondition;
  sold_out: SoldOut;
  sale: SBNEWECOMWSPDC12_Sale;
  add_cart_button: SbNewecomWsPdc08;
}

export interface SBNEWECOMWSPDC12_PreCondition {
  radius: StyleRadius;
}

export interface SBNEWECOMWSPDC12_Sale {
  product_name: SBNEWECOMWSPDC07_ProductName;
  label: string;
  setting: SBNEWECOMWSPDC08_Setting;
}

export interface SoldOut {
  product_name: SBNEWECOMWSPDC06_ProductName;
  label: string;
  setting: SBNEWECOMWSPDC08_Setting;
}

export interface SbNewecomWsPdc15 {
  handles: string[];
  snapshot: SBNEWECOMWSPDC15_Snapshot;
  styles: SBNEWECOMWSPDC15_Style[];
}

export interface SBNEWECOMWSPDC15_Snapshot {
  popover_product_card: string;
  common_setting: string;
}

export interface SBNEWECOMWSPDC15_Style {
  image_ratio: StyleImageRatio;
  image_cover: ImageCoverClass;
  font: ImageCoverClass;
  border: FluffyBorder;
  radius: StyleRadius;
  shadow: Shadow;
  padding: Padding;
  align: Align;
  background: FluffyBackground;
}

export interface FluffyBackground {
  label: BackgroundLabel;
  value: IndigoValue;
}

export interface IndigoValue {
  color: TentacledColor;
}

export interface TentacledColor {
  preset: number;
  opacity?: number;
}

export interface FluffyBorder {
  label: BorderLabel;
  value: IndecentValue;
}

export interface IndecentValue {
  thickness: string;
  style: StyleEnum;
  side: string;
  color: TentacledColor;
}

export interface ImageCoverClass {
  value: string;
}

export interface SbNewecomWsPdc16 {
  handles: Handles;
  product_name: string;
  product_handle: string;
}

export interface Handles {
  all_products_page: string;
  my_product_list: string;
}

export interface SbNewecomWsPdc17 {
  product_handle: string;
  handles: Handles;
  snapshot: SBNEWECOMWSPDC17_Snapshot;
  styles: SBNEWECOMWSPDC15_Style[];
}

export interface SBNEWECOMWSPDC17_Snapshot {
  common_setting: string;
}

export interface SbNewecomWsPdc18 {
  collection_handle: string;
  product_name: SBNEWECOMWSPDC18_ProductName;
  rating_text: string;
  label_rating: string;
  setting: SBNEWECOMWSPDC08_Setting;
  pre_condition: SBNEWECOMWSPDC18_PreCondition;
  expected: SBNEWECOMWSPDC18_Expected;
}

export interface SBNEWECOMWSPDC18_Expected {
  rating_icons: PurpleRatingIcon[];
  rating_colors: RatingColor[];
}

export interface RatingColor {
  color: RatingColorClass;
  value: string;
}

export interface PurpleRatingIcon {
  text: string;
}

export interface SBNEWECOMWSPDC18_PreCondition {
  font: string;
  rating_color: RatingColorClass;
  radius: PurpleRadius;
  background: PreConditionBackground;
  align: Align;
}

export interface PurpleRadius {
  label_radius: LabelRadiusEnum;
  value: ConfigClass;
}

export interface SBNEWECOMWSPDC18_ProductName {
  product_no_review: string;
  product_has_review: string;
  product_same_group_review: string;
}

export interface SbNewecomWsPdc19 {
  collection_handle: string;
  product_name: SBNEWECOMWSPDC18_ProductName;
  rating_text: string;
  label_rating: string;
  setting: SBNEWECOMWSPDC08_Setting;
  pre_condition: SBNEWECOMWSPDC18_PreCondition;
  expected: SBNEWECOMWSPDC19_Expected;
}

export interface SBNEWECOMWSPDC19_Expected {
  rating_icons: FluffyRatingIcon[];
  rating_colors: RatingColor[];
}

export interface FluffyRatingIcon {
  text: string;
  value: string;
}

export interface Env {
  local: EnvironmentInfo;
  dev: EnvironmentInfo;
  prod: EnvironmentInfo;
  prodtest: EnvironmentInfo;
}

export interface EnvironmentInfo {
  api: string;
  domain: string;
  shop_name: string;
  shop_id: number;
  username: string;
  password: string;
  user_id: number;
  theme_id: number;
  shop_creator: ShopCreator;
  accounts_domain?: string;
}

export interface ShopCreator {
  domain: string;
  shop_name: string;
  shop_id: number;
  theme_id: number;
}
