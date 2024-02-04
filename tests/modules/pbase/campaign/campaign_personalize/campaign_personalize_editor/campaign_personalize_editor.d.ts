import { AddLayersToGroupInfo, GroupInfo } from "@types";

export interface CampaignPersonalizeEditor {
  env: Env;
  url_catalog: string;
  url_shipping_combo: string;
  cases: Cases;
}

export interface Cases {
  SB_PRB_LP_1: SbPrbLp1;
  SB_PRB_LP_2: SbPrbLp2;
  SB_PRB_LP_3: SbPrbLp3;
  PB_PRB_Up_72: PBPRBUp72;
  PB_PRB_Up_93: PBPRBUp93;
  PB_PRB_Up_95: PBPRBUp95;
}

export interface PBPRBUp72 {
  campaign_info: CampaignInfo;
  custom_options_edit: CustomOptions[];
  snapshot_name: PBPRBUp72_SnapshotName;
}

export interface CampaignInfo {
  group_infos: GroupInfo[];
  layers_group_infos: AddLayersToGroupInfo[];
  product_infos: ProductInfo[];
  layers: CampaignInfoLayer[];
  custom_options: CustomOptions[];
  pricing_info: PricingInfo;
  custom_art?: CustomArt[];
}

export interface CustomArt {
  file_name: string;
  file_upload: string;
  applied_for: string;
  index: number;
}

export interface CustomOptions {
  type: CustomOptionsType;
  target_layer?: TargetLayer;
  label: string;
  position?: string;
  value?: Value;
  label_edit?: string;
  add_fail?: boolean;
}

export enum TargetLayer {
  Background1 = "background 1",
  Bd1 = "BD_1",
  TextLayer1 = "Text layer 1",
  TextLayer2 = "Text layer 2",
  TextLayer3 = "Text layer 3",
}

export enum CustomOptionsType {
  Checkbox = "Checkbox",
  Droplist = "Droplist",
  Image = "Image",
  Radio = "Radio",
  TextField = "Text field",
}

export enum Value {
  ABC = "a>b>c",
  CDE = "c>d>e",
  TextTest1TextTest2 = "Text test 1>Text test 2",
}

export interface CampaignInfoLayer {
  layer_name?: string;
  layer_type: LayerType;
  layer_value?: string;
  front_or_back: FrontOrBack;
  location_layer_x?: string;
  location_layer_y?: string;
  layer_size_w?: string;
  layer_size_h?: string;
  image_name?: string;
}

export enum FrontOrBack {
  Back = "Back",
  Front = "Front",
}

export enum LayerType {
  Image = "Image",
  Text = "Text",
}

export interface PricingInfo {
  title: string;
}

export interface ProductInfo {
  category: string;
  base_product: string;
}

export interface PBPRBUp72_SnapshotName {
  verify_opptions_on_sf: string;
}

export interface PBPRBUp93 {
  campaign_info: CampaignInfo;
}

export interface PBPRBUp95 {
  campaign_info: CampaignInfo;
  conditional_logic_info: ConditionalLogicInfo;
  custom_option_show_sf: CustomOptionShowSf;
  base_number: number;
  snapshot_name: PBPRBUp95_SnapshotName;
}

export interface ConditionalLogicInfo {
  custom_name: string;
  condition: string[];
  then_show_value: string[];
}

export interface CustomOptionShowSf {
  list_custom: string[];
}

export interface PBPRBUp95_SnapshotName {
  preview_image_sf: string;
  preview_image_sf_change_base: string;
}

export interface SbPrbLp1 {
  data_text_field: DataTextField;
  data_text_area: DataTextField;
  data_image: DataTextField;
  data_picture_choice: DataTextField;
  data_radio: DataTextField;
  data_droplist: DataTextField;
  data_checkbox: DataTextField;
}

export interface Data {
  data_invalid: CustomOptions[];
  message_error: MessageError[];
}

export enum MessageError {
  FieldIsRequired = "Field is required",
  PleaseFinishThisField = "Please finish this field",
  ThisLabelIsInAnotherCustomOption = "This label is in another custom option",
}

export interface DataPictureChoiceDataInvalid {
  type: string;
  type_clipart: string;
  value_clipart: string;
  label: string;
  add_fail: boolean;
}

export interface DataTextAreaDataInvalid {
  type?: PurpleType;
  target_layer?: TargetLayer;
  label?: string;
  add_fail?: boolean;
  max_length?: string;
  default_value?: string;
  position?: string;
  value?: Value;
  type_clipart?: string;
  value_clipart?: string;
}

export enum PurpleType {
  TextArea = "Text area",
  TextField = "Text field",
}

export interface DataTextField {
  product_info?: ProductInfo;
  layers?: DataTextFieldLayer[];
  custom_options?: CustomOptions;
  data_invalid?: DataTextAreaDataInvalid[];
  message_error?: string[];
}

export interface DataTextFieldLayer {
  layer_type: LayerType;
  layer_value?: string;
  image_name?: string;
}

export interface SbPrbLp2 {
  product_info: ProductInfo;
  layers: DataTextFieldLayer[];
  validate_name_clipart: Clipart[];
  clipart: Clipart;
  clipart_group: Clipart;
}

export interface Clipart {
  type_custom_option?: string;
  folder_name: string;
  images?: string[];
  group_name?: string;
}

export interface SbPrbLp3 {
  product_info: ProductInfo;
  layers: SBPRBLP3_Layer[];
  custom_options: CustomOptions;
}

export interface SBPRBLP3_Layer {
  layer_type: LayerType;
  layer_value: string;
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
  time_out: number;
  hive_pb_domain: string;
  hive_pb_username: string;
  hive_pb_password: string;
}
