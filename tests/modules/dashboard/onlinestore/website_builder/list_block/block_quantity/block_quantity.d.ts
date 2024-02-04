export interface BlockQuantity {
  env: Env;
  cases: Cases;
}

export interface Cases {
  SB_WEB_BUILDER_LB_BL_QT_1: SbWebBuilderLBQT01;
  SB_WEB_BUILDER_LB_BL_QT_3: SbWebBuilderLBQT03;
}

export interface SbWebBuilderLBQT01 {
  add_block: AddBlock;
  dnd_block: DNDBlock;
  expected: SBWEBBUILDERLBQT01_Expected;
}

export interface SbWebBuilderLBQT03 {
  add_block: AddBlock;
  dnd_block: DNDBlock;
  expected: SBWEBBUILDERLBQT03_Expected;
}

export interface SbWebBuilderLBQT07 {
  add_block: AddBlock;
  dnd_block: DNDBlock;
  expected: SBWEBBUILDERLBQT07_Expected;
}

export interface SbWebBuilderLBQT08 {
  add_block: AddBlock;
  expected: SBWEBBUILDERLBQT08_Expected;
}

export interface SbWebBuilderLBQT09 {
  add_block: AddBlock;
  dnd_block: DNDBlock;
  expected: SBWEBBUILDERLBQT09_Expected;
}

export interface SbWebBuilderLBQT10 {
  add_block: AddBlock;
}

export interface AddBlock {
  parent_position: ParentPosition;
  template: Quantity;
}

export interface ParentPosition {
  section: number;
  column: number;
}

export enum Quantity {
  Quantity = "Quantity",
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
  position: BlockQuantityClass;
}

export interface BlockQuantityClass {
  section: number;
  block: number;
}

export interface SBWEBBUILDERLBQT01_Expected {
  snapshot_sidebar: string;
}

export interface SBWEBBUILDERLBQT03_Expected {
  snapshot_preview: string;
}

export interface SBWEBBUILDERLBQT07_Expected {
  snapshot_duplicate: string;
  snapshot_hide: string;
  snapshot_sidebar_show: string;
  snapshot_delete: string;
  snapshot_visible: string;
  snapshot_un_visible: string;
}

export interface SBWEBBUILDERLBQT08_Expected {
  snapshot_w200: string;
  snapshot_w400: string;
  snapshot_clip_content: string;
}

export interface SBWEBBUILDERLBQT09_Expected {
  custom_value_quantity: string[];
}

export interface Default {
  attribute: string;
  value: string;
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
  dnd_blank_section: DNDBlankSection;
  section_name: SectionName;
  web_base_id: number;
  template_name: string;
  theme_id: number;
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
