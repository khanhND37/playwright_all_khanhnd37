export type WatermarkInfo = {
  enable: boolean;
  type: string;
  store_name: string;
  store_logo_url: string;
  style: string;
};

export type Combo = {
  option_set_id: number;
  option: Array<string>;
  combo_rules: [];
  variant_combo_request: Array<VariantComboRequest>;
};

export type ComboInfo = {
  product_variant_id: number;
  quantity: number;
};

export type VariantComboRequest = {
  title: string;
  price: number;
  image_id: number;
  combo_info: ComboInfo[];
  option_1: string;
};
