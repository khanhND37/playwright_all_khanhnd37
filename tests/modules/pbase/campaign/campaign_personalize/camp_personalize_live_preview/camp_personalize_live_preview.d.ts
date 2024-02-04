export interface CampPersonalizeLivePreview {
  env: Env;
  cases: Cases;
}

export interface Cases {
  CAMP_PERSONALIZE: CampPersonalize;
}

export interface CampPersonalize {
  data: Datum[];
}

export interface Datum {
  case_id: string;
  title: string;
  data_test: DataTest[];
  themes_setting?: ThemesSetting;
  themes_setting_id?: number[];
}

export interface DataTest {
  layers: Layer[];
  custom_options: CustomOption[];
  custom_option_info: CustomOptionInfo[];
  pricing_info: PricingInfo;
  product_infos: ProductInfo[];
  count_zoom_in?: number;
  title?: string;
  personalization_preview?: Personaliz;
  button_preview?: boolean;
}

export interface CustomOptionInfo {
  type: Type;
  value: string;
  custom_name: string;
  hide_popover_crop?: boolean;
  folder_clipart?: FolderClipart;
}

export enum FolderClipart {
  GroupImage1 = "Group image 1",
}

export enum Type {
  Droplist = "Droplist",
  Image = "Image",
  PictureChoice = "Picture choice",
  PictureChoiceGroupShowThumbnail = "Picture choice group show thumbnail",
  Radio = "Radio",
  TextArea = "Text area",
  TextField = "Text field",
}

export interface CustomOption {
  type: Type;
  label: string;
  target_layer: string;
  allow_character?: AllowCharacter;
  position?: Position;
  type_clipart?: TypeClipart;
  value_clipart?: ValueClipart;
  type_display_clipart?: TypeDisplayClipart;
  value?: Value;
  font?: Font;
}

export enum AllowCharacter {
  CharactersNumbers = "Characters,Numbers",
}

export enum Font {
  Flashback = "flashback",
  LillyMaeRegular = "Lilly Mae Regular",
}

export enum Position {
  Below = "below",
}

export enum TypeClipart {
  Folder = "Folder",
  Group = "Group",
}

export enum TypeDisplayClipart {
  ShowWithThumbnailImages = "Show with Thumbnail images",
}

export enum Value {
  TextRadio1TextRadio2 = "Text radio1>Text radio2",
  TextTest1TextTest2 = "Text test 1>Text test 2",
}

export enum ValueClipart {
  PictureChoiceGroupTest = "Picture choice group test",
  Test = "Test",
}

export interface Layer {
  layer_type: LayerType;
  image_name?: string;
  location_layer_x: string;
  location_layer_y: string;
  layer_size_h: string;
  layer_size_w: string;
  layer_value?: LayerValue;
}

export enum LayerType {
  Image = "Image",
  Text = "Text",
}

export enum LayerValue {
  Text1 = "Text 1",
  Text2 = "Text 2",
  Text3 = "Text 3",
  Text4 = "Text 4",
  Text5 = "Text 5",
  Text6 = "Text 6",
  Text7 = "Text 7",
}

export interface Personaliz {
  enable: boolean;
  mode: Mode;
}

export enum Mode {
  Button = "button",
  Instant = "instant",
  InstantButton = "instant_button",
}

export interface PricingInfo {
  title: string;
  description: Description;
}

export enum Description {
  CheckPerformanceCampPreviewVớiNhiềuCO = "Check performance camp preview với nhiều CO",
}

export interface ProductInfo {
  category: Category;
  base_product: BaseProduct;
}

export enum BaseProduct {
  BeverageMug = "Beverage Mug",
  ClassicUnisexTShirtClassicUnisexTank = "Classic Unisex T-shirt,Classic Unisex Tank",
  VNeckTShirtClassicUnisexTShirt = "V-neck T-shirt,Classic Unisex T-shirt",
}

export enum Category {
  Apparel = "Apparel",
  Drinkware = "Drinkware",
}

export enum ThemesSetting {
  Inside = "Inside",
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
  theme_default: number;
  user_id: number;
  shop_id: number;
  time_out: number;
  personalize: Personaliz;
  url_catalog: string;
  cases: Cases;
}
