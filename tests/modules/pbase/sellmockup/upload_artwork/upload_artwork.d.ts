export interface UploadArtwork {
  env: Env;
  import_campaign: ImportCampaign;
  import_info: ImportInfo;
  verify_time: number;
  camp_name: string;
  cases: Cases;
}

export interface Cases {
  SB_PRB_SCWM_26: SbPrbScwm26;
  SB_PRB_SCWM_27: SbPrbScwm27;
}

export interface SbPrbScwm26 {
  layer_text: LayerText;
  layer_text_blank: LayerTextBlank;
  layer_add: Layer;
  layer_text_verify: Layer[];
  message: string;
  picture: SBPRBSCWM26_Picture;
}

export interface Layer {
  layer_value?: string;
  layer_type: LayerType;
  layer_name: LayerName;
  location_layer_x: string;
  location_layer_y?: string;
  layer_size_h?: string;
  layer_size_w?: string;
  front_or_back: FrontOrBack;
  font_name?: string;
  rotate_layer?: string;
  opacity_layer?: string;
  stroke?: boolean;
  stroke_pt?: string;
  stroke_opacity?: string;
  curve?: boolean;
  curve_input?: string;
}

export enum FrontOrBack {
  Front = "Front",
}

export enum LayerName {
  TextLayer1 = "Text layer 1",
}

export enum LayerType {
  Text = "Text",
}

export interface LayerText {
  layer_name: LayerName;
  layer_type: LayerType;
  front_or_back: FrontOrBack;
}

export interface LayerTextBlank {
  text: LayerType;
  X: string;
  Y: string;
  W: string;
  H: string;
  opacity: string;
  rotation: string;
}

export interface SBPRBSCWM26_Picture {
  preview: string;
  layer_text_verify: string;
  layer_add: string;
  layer_text_blank: string;
  editor_page: string;
  image_editor: string;
}

export interface SbPrbScwm27 {
  import_campaign: ImportCampaign;
  camp_name: string;
  layer_text: LayerText[];
  layer_image_artwork: LayerImageArtwork;
  error_message: string;
  message: string;
  valid_image: string[];
  picture: SBPRBSCWM27_Picture;
}

export interface ImportCampaign {
  file_name: string;
  file_path: string;
  inserted_campaign: number;
  skip_campaign: number;
  total_campaign: number;
}

export interface LayerImageArtwork {
  layer_name: string;
  layer_type: string;
  front_or_back: FrontOrBack;
  location_layer_x: string;
  location_layer_y: string;
  layer_size_w: string;
  layer_size_h: string;
  opacity_layer: string;
  rotate_layer: string;
}

export interface SBPRBSCWM27_Picture {
  preview: string;
  layer_text: string;
  artwork_image: string;
  artwork_valid: string;
  layer_image_artwork: string;
  layer_image: string;
}

export interface Env {
  local: Dev;
  prodtest: Dev;
  dev: Dev;
}

export interface Dev {
  api: string;
  domain: string;
  username: string;
  password: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
  timeout: number;
  accounts_domain?: string;
}

export type ImportInfo = {
  status: string;
};
