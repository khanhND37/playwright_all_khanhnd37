/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type DigitalProductOld = {
  title: string;
  description: string;
  img: string;
  file?: string;
  calendar?: string;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type InfoPage = {
  title: string;
  handle?: string;
  btnCustomize?: boolean;
  iconEdit?: boolean;
  iconDelete?: boolean;
  message?: string;
  pageTitleSeo?: string;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type PopupCreatePage = {
  title?: string;
  fieldName?: string;
  placeholder?: string;
  buttonCreate?: boolean;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type ListPageScreen = {
  title: string;
  text: string;
  totalLandingPage: number;
};

/**
 * @deprecated: use src/types/shopbase_creator instead
 */
export type CreateDigitalProduct = {
  title: string;
  isPublish: boolean;
  productType: string;
};

/**
 * Use: get information product in order detail
 */
export type OrderDetail = {
  image?: string;
  productName?: string;
  paidItems?: string;
  subtotal?: string;
  discount?: string;
  items?: string;
  paid?: string;
};

export type ProductUpdate = {
  thumbnail_type: string;
  thumbnail_file_path: string;
  pricing_type: string;
  pricing_title?: string;
  pricing_amount: number;
  button_name: string;
  button_popup: string;
  name_product_upsell: string;
  button_apply_theme: string;
  theme_name: string;
  product_title: string;
};

export type FilterOrder = {
  filter_type: string;
  filter_value?: string;
  filter_text?: string;
  filter_date?: string;
};

export type FilterOrderParam = {
  financial_status?: string;
  created_at_min?: string;
  created_at_max?: string;
};
