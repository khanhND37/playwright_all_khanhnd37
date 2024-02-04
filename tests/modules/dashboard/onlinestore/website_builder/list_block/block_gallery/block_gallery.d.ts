export interface AddBlock {
  parent_position: ParentPosition;
  template: string;
}

export interface ParentPosition {
  section: number;
  column: number;
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
  position: number;
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
