import { BackGround, Color, LayerStyles, Slider } from "@types";

export type Snapshot = {
  [key: string]: string;
};

export type LayoutSetting = {
  id: string;
  value: string;
  spacing: number;
  image_height: "s" | "m" | "l" | "xl";
};

export type ItemsRadius = {
  id?: string;
  config?: Slider;
};

export type ContentSize = {
  id: string;
  size: "S" | "M" | "L";
};

export type ContentBackground = {
  id?: string;
  value?: BackGround;
};

export type ContentColor = {
  id: string;
  color: Color;
};

export type BlockAlign = {
  id: string;
  value: "Left" | "Center" | "Right";
};

export type ButtonStyle = {
  id: string;
  value: "Primary" | "Secondary";
};

export type CollectionListStyle = LayerStyles & {
  layout: LayoutSetting;
  items_radius: ItemsRadius;
  content_size: ContentSize;
  content_background: ContentBackground;
  content_color: ContentColor;
  block_align: BlockAlign;
  button_style: ButtonStyle;
};

export type CollectionData = {
  sub_heading: string;
  heading: string;
  description: string;
};

export type LayoutData = {
  item_per_row?: string;
  spacing?: string;
  image_hight?: string;
  overlay?: Color;
};
