export interface ConditionalLogic {
  env: Env;
  cases: Cases;
}

export interface Cases {
  DATA_DRIVEN: DataDriven;
  SB_PB_PRB_CL_61: SbPbPrbCl6;
  SB_PB_PRB_CL_62: SbPbPrbCl6;
}

export interface DataDriven {
  data: Datum[];
}

export interface Datum {
  description: string;
  case_id: string;
  product_info: ProductInfo;
  layers: Layer[];
  custom_options: DatumCustomOption[];
  condition_info: Condition;
  pricing_info: PricingInfo;
  conditional_logic_show: ConditionalLogicShow;
  snapshot_verify: SnapshotVerify;
}

export interface Condition {
  custom_name: CustomName;
  condition: string[];
  then_show_value: CustomName[];
  add_condition?: string;
}

export enum CustomName {
  Co1 = "CO1",
  Co2 = "CO2",
  Co3 = "CO3",
  Co4 = "CO4",
}

export interface ConditionalLogicShow {
  list_custom: string[];
  then_show_value: string[];
  is_show_value: boolean[];
}

export interface DatumCustomOption {
  type: string;
  target_layer: string;
  label: CustomName;
  type_clipart?: string;
  value_clipart?: string;
  position?: string;
  value?: string;
}

export interface Layer {
  layer_type: LayerType;
  layer_value?: LayerValue;
  front_or_back: FrontOrBack;
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

export enum LayerValue {
  Text1 = "Text 1",
  Text2 = "Text 2",
  Text3 = "Text 3",
}

export interface PricingInfo {
  title: string;
  description: string;
}

export interface ProductInfo {
  category: string;
  product_name: string;
}

export interface SnapshotVerify {
  add_conditional_logic: string;
  list_conditional_logic: string;
}

export interface SbPbPrbCl6 {
  product_info: ProductInfo;
  layers: Layer[];
  custom_options: SBPBPRBCL61_CustomOption[];
  condition_info: Condition;
  pricing_info: PricingInfo;
  conditional_logic_show?: ConditionalLogicShow;
  snapshot_verify: SnapshotVerify;
  edit_conditional_logic?: EditConditionalLogic[];
}

export interface SBPBPRBCL61_CustomOption {
  type: string;
  value?: string;
  target_layer: string;
  label: CustomName;
  position?: string;
}

export interface EditConditionalLogic {
  step_description: string;
  conditional_logic_edit: Condition;
  conditional_logic_show_sf: ConditionalLogicShow;
  verify_edit_conditional_logic: string;
}

export interface Env {
  prod: Prod;
}

export interface Prod {
  api: string;
  domain: string;
  username: string;
  password: string;
  user_id: number;
  shop_id: number;
  shop_name: string;
  time_out: number;
  param_snapshot_options: ParamSnapshotOptions;
}

export interface ParamSnapshotOptions {
  max_diff_pixel_ratio: number;
  thres_hold: number;
  max_diff_pixels: number;
}
