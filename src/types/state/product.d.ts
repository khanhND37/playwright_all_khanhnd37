export type FeedInfo = {
  name?: string;
  feed_type?: string;
  collections_name?: Array<string>;
  export_mode?: "all_variation" | "first_variation" | "first_variation_option_product" | "variation_with_rule";
  export_lable?: "Exclude the variations matching" | "Export only variations of a product matching";
  export_rules?: FeedExportRule;
  sales_channel?: string;
  add_variant_option_to_title?: "0" | "1";
  product_title_mode?: "default_title" | "seo_title";
  product_description_mode?: "default_description" | "seo_description";
  is_custom_products?: boolean;
  brand?: string;
  google_product_category?: string;
  gender?: "male" | "female" | "unisex";
  age_group?: string;
  default_color?: string;
  default_size?: string;
};

export type FeedExportRule = {
  field: "sku" | "option_value";
  relation: "contains" | "starts_with" | "ends_with" | "equals";
  value: Array<string>;
};

export type VariantInfoAPI = {
  id?: number;
  barcode?: string;
  title?: string;
  price?: number;
  product_id?: number;
  sku?: string;
  description?: string;
  availability?: string;
  condition?: string;
  link?: string;
  image_link?: string;
  brand?: string;
  google_product_category?: string;
  gtin?: string;
  sale_price?: number;
  color?: string;
  gender?: string;
  size?: string;
  are_group?: string;
  shipping_weight?: string;
};

export type ProductInfoAPI = {
  id: string;
  title?: string;
  variants?: Array<VariantInfoAPI>;
  sbcn_product_id?: number;
};

export type DataImportProgress = {
  import_progress: Array<string>;
};

export type CloneProductData = {
  ids: Array<number>;
  dest_shop_id: number;
  data: DataImportProgress;
  cloning_product_rule: string;
  is_plus_base_pod: boolean;
  keep_current_product_id: boolean;
};

export type BalanceResponse = {
  count: number;
  issue_type: string;
};

export type BalanceIssues = {
  balance_issues?: Map<string, BalanceResponse>;
};

export type VariantMapping = {
  variant_id?: number;
  sourcing_variant_id?: number;
  variant_title?: string;
};

export type Collect = {
  product_id: number;
  collection_id: number;
  id?: number;
};

export type ReviewSF = {
  total: number;
  reviews: Array<DataReviews>;
};

export type DataReviews = {
  rating: number;
  content: string;
  images: Array<string>;
  name?: string;
  email?: string;
  title?: string;
  product_id?: number;
  variant_id?: number;
};

export type DataReviewInApp = {
  reviews: Array<Reviews>;
};

export type Reviews = {
  id?: number;
  rating: number;
  title: string;
  content: string;
  source: string;
  product_id?: number;
  variant_id?: number;
};

export type SettingReviewApp = {
  general_Setting: GeneralSettingReviewApp;
  review_reqeust: ReviewRequestReviewApp;
  review_sharing: ReviewSharingSetting;
  auto_import_setting: AutoImportSettingReviewApp;
};

export type GeneralSettingReviewApp = {
  auto_publish: boolean;
  auto_publish_minimum_rating: number;
  all_stores: boolean;
};

export type ReviewRequestReviewApp = {
  enable_review_request: boolean;
};

export type ReviewSharingSetting = {
  enable: boolean;
};

export type ReviewGetSharingSettingApp = {
  enable_get_review: boolean;
  minumum_star: number;
};

export type AutoImportSettingReviewApp = {
  enable_auto_import: boolean;
  minimum_star: number;
  minimum_number_of_review: number;
  maximum_number_of_review: number;
};

export type ProductionSite = {
  US: number | string;
  EU: number | string;
  AU: number | string;
  CA: number | string;
  WW: number | string;
};
