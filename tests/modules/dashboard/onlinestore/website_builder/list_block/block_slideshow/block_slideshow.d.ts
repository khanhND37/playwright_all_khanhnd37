export interface BlockSlideshow {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_LB_SLS_01: SbWebBuilderLBSls01;
  SB_WEB_BUILDER_LB_SLS_02: SbWebBuilderLBSls02;
  SB_WEB_BUILDER_LB_SLS_03: SbWebBuilderLBSls03;
  SB_WEB_BUILDER_LB_SLS_04: SbWebBuilderLBSls04;
  SB_WEB_BUILDER_LB_SLS_05: SbWebBuilderLBSls05;
  SB_WEB_BUILDER_LB_SLS_06: SbWebBuilderLBSls06;
  SB_WEB_BUILDER_LB_SLS_07: SbWebBuilderLBSls07;
  SB_WEB_BUILDER_LB_SLS_08: SbWebBuilderLBSls08;
  SB_WEB_BUILDER_LB_SLS_09: SbWebBuilderLBSls09;
  SB_WEB_BUILDER_LB_SLS_10: SbWebBuilderLBSls10;
  SB_WEB_BUILDER_LB_SLS_11: SbWebBuilderLBSls11;
  SB_WEB_BUILDER_LB_SLS_12: SbWebBuilderLBSls12;
  SB_WEB_BUILDER_LB_SLS_14: SbWebBuilderLBSls14;
}

export interface SbWebBuilderLBSls01 {
  add_block: AddBlock;
  dnd_block: DNDBlock;
  expected: SBWEBBUILDERLBSLS01_Expected;
}

export interface AddBlock {
  parent_position: ParentPosition;
  template: Slideshow;
}

export interface ParentPosition {
  section: number;
  column: number;
}

export enum Slideshow {
  Slideshow = "Slideshow",
}

export interface DNDBlock {
  from: DNDBlockFrom;
  to: DNDBlockTo;
}

export interface DNDBlockFrom {
  category: string;
  template: string;
}

export interface DNDBlockTo {
  position: BlockSlideshowClass;
}

export interface BlockSlideshowClass {
  section: number;
  block: number;
}

export interface SBWEBBUILDERLBSLS01_Expected {
  default_layout: string;
  default_content_position: Default;
  default_position: DefaultPosition;
  default_align: Default;
  default_width: DefaultHeight;
  default_height: DefaultHeight;
  default_background: Default;
  default_border: string;
  default_opacity: string;
  default_radius: string;
  default_shadow: string;
  default_padding: string;
  default_margin: string;
  value?: string;
}

export interface Default {
  attribute: string;
  value: string;
}

export interface DefaultHeight {
  value: number;
  unit: Unit;
}

export enum Unit {
  Empty = "%",
  Px = "Px",
}

export interface DefaultPosition {
  static: string;
  non_static: string;
}

export interface SbWebBuilderLBSls02 {
  add_block: AddBlock;
  block_slideshow: BlockSlideshowClass;
  expected: SBWEBBUILDERLBSLS02_Expected;
}

export interface SBWEBBUILDERLBSLS02_Expected {
  attribute: string;
  value: string;
  bread_crumb: Slideshow;
}

export interface SbWebBuilderLBSls03 {
  add_block: AddBlock;
  block_slideshow: BlockSlideshowClass;
  full: Full;
  split: Full;
  expected: SBWEBBUILDERLBSLS03_Expected;
}

export interface SBWEBBUILDERLBSLS03_Expected {
  layout_split: string;
  layout_full: string;
  toggle_on: string;
}

export interface Full {
  layout: "Full" | "Split";
}

export interface SbWebBuilderLBSls04 {
  add_block: AddBlock;
  block_slideshow: BlockSlideshowClass;
  layout_style: Full;
  clear_content: ClearContent;
  turn_off_buttons: TurnOffButton[];
  expected: SBWEBBUILDERLBSLS04_Expected;
}

export interface ClearContent {
  sub_heading: string;
  heading: string;
  description: string;
}

export interface SBWEBBUILDERLBSLS04_Expected {
  layout_split: string;
}

export interface TurnOffButton {
  button: 1 | 2;
  is_on: boolean;
}

export interface SbWebBuilderLBSls05 {
  add_block: AddBlock;
  block_slideshow: BlockSlideshowClass;
  duplicated_block: BlockSlideshowClass;
  expected: SBWEBBUILDERLBSLS01_Expected;
}

export interface SbWebBuilderLBSls06 {
  add_block: AddBlock;
  block_slideshow: BlockSlideshowClass;
  slideshow: Slideshow;
}

export interface SbWebBuilderLBSls07 {
  add_block: AddBlock;
  block_slideshow: BlockSlideshowClass;
  style_data: StyleDatum[];
}

export interface StyleDatum {
  layout: "Full" | "Split";
  color: Color;
  content_position: ContentPosition;
  align: Align;
  width: StyleDatumHeight;
  height: StyleDatumHeight;
  background: Background;
  border: Border;
  opacity: Opacity;
  radius: Opacity;
  shadow: Shadow;
  padding: Margin;
  margin: Margin;
  expected: StyleDatumExpected;
}

export interface Align {
  label: string;
  type: "Left" | "Center" | "Right";
}

export interface Background {
  label: string;
  value: BackgroundValue;
}

export interface BackgroundValue {
  color: ColorClass;
}

export interface ColorClass {
  preset: number;
}

export interface Border {
  label: string;
  value: BorderValue;
}

export interface BorderValue {
  thickness: "none" | "s" | "m" | "l" | "custom";
}

export interface Color {
  label: string;
  value: ColorClass;
}

export interface ContentPosition {
  label: string;
  position: number;
}

export interface StyleDatumExpected {
  width_css: string;
  height_css: string;
  background_css: string;
  position_css: string;
  content_color_css: string;
  content_position_css: string;
  opacity_css: string;
  radius_css: string;
  shadow_css: string;
  border_css: string;
  margin_css: string;
  padding_css: string;
}

export interface StyleDatumHeight {
  label: string;
  value: HeightValue;
}

export interface HeightValue {
  unit: Unit;
  value: number;
}

export interface Margin {
  label: string;
  value: MarginValue;
}

export interface MarginValue {
  input: boolean;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface Opacity {
  label: string;
  config: Config;
}

export interface Config {
  fill: boolean;
  number: number;
}

export interface Shadow {
  label: string;
  config: {
    option: "none" | "soft" | "hard";
    size: "S" | "M" | "L";
    direction: "Bottom" | "Top Right" | "Top Left" | "Bottom Right" | "Bottom Left";
  };
}

export interface SbWebBuilderLBSls08 {
  add_block: AddBlock;
  new_slide: number;
  duplicate_slide: number;
  last_slide: number;
  delete_slides: number[];
  buttons: [1, 2];
  dnd_slide: DNDSlide;
  expected: SBWEBBUILDERLBSLS08_Expected;
}

export interface DNDSlide {
  from: ToClass;
  to: ToClass;
}

export interface ToClass {
  slide: number;
}

export interface SBWEBBUILDERLBSLS08_Expected {
  slide_name: string;
  is_checked: string;
  content: Content;
  button: Button;
  pagination_dot: number;
  delay_duration: string;
}

export interface Button {
  default_label: string;
  default_attribute: string;
  default_value: string;
}

export interface Content {
  default_sub_heading: string;
  default_heading: string;
  default_description: string;
}

export interface SbWebBuilderLBSls09 {
  add_block: AddBlock;
  block_slideshow: BlockSlideshowClass;
  layout_split: Layout;
  content_width: ContentWidth[];
  layout_full: Layout;
  expected: SBWEBBUILDERLBSLS09_Expected;
}

export interface ContentWidth {
  edit_width: EditWidth;
  expected: ContentWidthExpected;
}

export interface EditWidth {
  width: EditWidthHeight;
}

export interface EditWidthHeight {
  label: string;
  value: DefaultHeight;
}

export interface ContentWidthExpected {
  width_value: number;
  width_percent: number;
  layout_attribute: string;
}

export interface SBWEBBUILDERLBSLS09_Expected {
  full_attribute: string;
  full_value: string;
  split_attribute: string;
  split_value: string;
  partially_attribute: string;
  partially_value: string;
  layout_attribute: string;
}

export interface Layout {
  layout: "Full" | "Split";
  navigation: Arrows;
  arrows: Arrows;
  show_partially?: Arrows;
  flip_content?: Arrows;
}

export interface Arrows {
  is_on: boolean;
}

export interface SbWebBuilderLBSls10 {
  add_block: AddBlock;
  edit_content: ClearContent;
  turn_off_buttons: TurnOffButton[];
  edit_button_1: EditButton;
  edit_button_2: EditButton[];
  add_image: AddImage;
  add_video: AddVideo;
  expected: SBWEBBUILDERLBSLS10_Expected;
}

export interface AddImage {
  file: string;
  size: "Cover" | "Contain";
  position: number;
}

export interface AddVideo {
  url: string;
}

export interface EditButton {
  button: 1 | 2;
  is_on: boolean;
  label: string;
  action:
    | "Open a link"
    | "Go to page"
    | "Go to section"
    | "Make a call"
    | "Send email to"
    | "Copy to clipboard"
    | "Open a pop-up"
    | "Go to checkout";
  select?: Select;
  new_tab: boolean;
  expected?: EditButton1_Expected;
  input_text?: string;
}

export interface EditButton1_Expected {
  redirect_url: string;
}

export interface Select {
  label: string;
  option: string;
  index: number;
}

export interface SBWEBBUILDERLBSLS10_Expected {
  default_sub_heading: string;
  default_heading: string;
  default_description: string;
  sub_heading_sf: string;
  heading_sf: string;
  description_sf: string;
  button_1_label: string;
  button_2_label: string;
  redirect_url: string;
  video_attribute: string;
  video_url: string;
}

export interface SbWebBuilderLBSls11 {
  add_block: AddBlock;
  slide_2: number;
  slide_3: number;
  resizer_positions: ["top", "left", "bottom", "right", "top-left", "top-right", "bottom-left", "bottom-right"];
  expected: SBWEBBUILDERLBSLS11_Expected;
}

export interface SBWEBBUILDERLBSLS11_Expected {
  attribute: string;
  slide_active: string;
}

export interface SbWebBuilderLBSls12 {
  add_block: AddBlock;
  min_width: Width[];
  max_width: Width[];
  min_height: MinHeight;
  validate_content: ClearContent;
  content_spacing: ContentSpacing[];
  expected: SBWEBBUILDERLBSLS12_Expected;
}

export interface ContentSpacing {
  type: "heading" | "description" | "sub-heading";
  spacing: string;
}

export interface SBWEBBUILDERLBSLS12_Expected {
  no_limit: ClearContent;
}

export interface Width {
  slide_1: number;
  width: EditWidthHeight;
  expected: MaxWidthExpected;
}

export interface MaxWidthExpected {
  content_width: number;
}

export interface MinHeight {
  height: EditWidthHeight;
}

export interface SbWebBuilderLBSls14 {
  add_block: AddBlock;
  split_layout: Full;
  expected: SBWEBBUILDERLBSLS14_Expected;
}

export interface SBWEBBUILDERLBSLS14_Expected {
  mobile_content_padding: string;
}

export interface Env {
  local: Dev;
  prod: Dev;
  prodtest: Dev;
}

export interface Dev {
  api: string;
  domain: string;
  shop_name: string;
  shop_id: number;
  username: string;
  password: string;
  user_id: number;
  create_product: CreateProduct;
  dnd_blank_section: DNDBlankSection;
  section_name: SectionName;
  web_base_id: number;
  template_name: string;
}

export interface CreateProduct {
  product: Product;
}

export interface Product {
  title: string;
  published: boolean;
  product_type: string;
}

export interface DNDBlankSection {
  from: DNDBlockFrom;
  to: DNDBlankSectionTo;
}

export interface DNDBlankSectionTo {
  position: Position;
  isBottom: boolean;
}

export interface Position {
  section: number;
}

export interface SectionName {
  content: string;
}
