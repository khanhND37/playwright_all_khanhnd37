import { Locator, Page } from "@playwright/test";
import type { ShippingLine } from "@types";

export type PageGetAccessToken = {
  shopId: number;
  userId: number;
  baseURL: string;
  username: string;
  password: string;
};

export type ImportProductSchedule = {
  retry_image?: boolean;
  max_retry_image?: number;
  completed?: boolean;
  max_retry_status?: number;
};

export type ProductValue = {
  title?: string;
  description?: string;
  image_name?: string;
  image_URL?: string;
  product_type?: string;
  vendor?: string;
  collections?: string[];
  tag?: string;
  price?: string;
  compare_at_price?: string;
  cost_per_item?: string;
  sku?: string;
  bar_code?: string;
  inventory_policy?: string;
  quantity?: string;
  allowOverselling?: boolean;
  weight?: string;
  weightUnit?: string;
  page_title?: string;
  meta_description?: string;
  number_image?: number;
  size?: string;
  variant_id?: number;
  color?: string;
  style?: string;
  product_availability_online_store?: boolean;
  body_html?: string;
  metafields_global_title_tag?: string;
  metafields_global_description_tag?: string;
  custom_options?: string[];
  tags?: string;
  product_availability?: number;
  tracking_id?: string;
  tracking_access_token?: string;
  variant_tag?: string;
  option_name_1?: string;
  option_values_1?: string;
  option_name_2?: string;
  option_values_2?: string;
  option_name_3?: string;
  option_values_3?: string;
};

export type Layer = {
  layer_type?: string;
  layer_value?: string;
  font_size?: string;
  text_overflow?: "Scale" | "Shrink";
  text_alignment?: {
    horizontal?: "left" | "center" | "right";
    vertical?: "top" | "center" | "bottom";
  };
  location_layer_x?: string;
  location_layer_y?: string;
  layer_size_h?: string;
  layer_size_w?: string;
  rotate_layer?: string;
  opacity_layer?: string;
  front_or_back?: string;
  image_name?: string;
  layer_name?: string;
  curve?: boolean;
  style?: {
    none?: boolean;
    stroke?: {
      stroke_thickness?: string;
      stroke_color_new?: string;
    };
    shadow?: {
      shadow_offset?: string;
      shadow_direction?: string;
      shadow_opacity?: string;
      shadow_color?: string;
    };
    hollow?: {
      hollow_thickness?: string;
      hollow_color?: string;
    };
    echo?: {
      echo_offset?: string;
      echo_direction?: string;
      echo_color?: string;
    };
    stroke_color?: string;
  };
  shape?: {
    none?: boolean;
    curve?: {
      curve_input?: string;
    };
  };
  stroke_opacity?: string;
  stroke_pt?: string;
  curve_input?: string;
  font?: string;
  is_sync?: boolean;
  layer_name_new?: string;
  not_back_layer_list?: boolean;
  not_layer_list?: boolean;
  no_check_button?: boolean;
  font_name?: string;
  color?: string;
};

export type PricingInfo = {
  title: string;
  description?: string;
  tag?: string;
  product_name?: string;
  variant?: string;
  photo_guide?: string;
  sale_price?: string;
  compare_price?: string;
};

export type ProductTemplate = {
  id: number;
  product_name: string;
  processing_time: number;
  Processing_rate: number;
  description: string;
  product_crawl_status: string;
  request_url: string;
  x_weight: number;
  x_is_testing_product: boolean;
  quotation_id?: number;
  x_warehouse_id?: number;
  x_delivery_carrier_type_ids?: Array<number>;
  x_platform_shipping_fee?: string;
  x_ali_express_point?: string;
  x_ali_product_level?: string;
  x_ali_processing_rate?: string;
  x_use_aliexpress_rating?: boolean;
  x_category_code?: string;
  x_moqs?: Array<number>;
  x_is_plusbase_published?: boolean;
  x_product_warehouse_ids?: Array<number>;
};
export type CampaignValue = {
  campaign_name: string;
  description: string;
  tags: string;
  style: string;
  color: string;
  size: string;
  number_image: number;
  compare_at_price: number;
  price: number;
};

export type BulkUpdateValue = {
  condition_type: string;
  conditions: string[];
  actions: string[];
  variants?: {
    variants_match?: string;
    condition_variants: string[];
  };
  custom_option?: Array<CustomOptionProductInfo>;
};

export type ProductData = {
  product_name: string;
  limit_product: string;
  page_product: string;
};

export type CustomOptionProductInfo = {
  type?: string;
  default_name?: string;
  custom_name?: string;
  label?: string;
  allow_following?: string;
  values?: string;
  add_another_option?: string;
  hide_option?: string;
  clipart_name?: string;
  default_value?: string;
  placeholder?: string;
  index?: number;
  max_length?: string;
  allowed_characters?: string[];
  help_text?: string;
  p_o_d_data?: string;
  name?: string;
  target_layer?: string;
  target_layer_base_product?: string[];
  font?: string;
  allow_character?: string;
  image?: string;
  type_clipart?: string;
  type_display_clipart?: string;
  value_clipart?: string;
  value?: string;
  position?: number | string;
  default_check?: string;
  not_other_option?: boolean;
  not_edit_type?: boolean;
  clipart_info?: ClipartFolder;
  add_fail?: boolean;
  label_edit?: string;
  is_not_collapse_custom_option?: boolean;
  is_edit_custom?: boolean;
  group?: string[];
};

export type customOptionProductSF = {
  type: string;
  value: string;
  custom_name: string;
  folder_clipart?: string;
  value_2?: string;
  hide_popover_crop?: boolean;
};

export type DescriptionInsert = {
  description_URL: string;
  text_to_display: string;
  title_description: string;
  open_link_in: string;
  field: string;
  source: string;
  width: string;
  height: string;
  embed_code: string;
  alternative_source_URL: string;
  media_poster: string;
  alternative_description: string;
  imageName: string;
};

export type CloneInfo = {
  type: string;
  second_shop: string;
  action: string;
  keep_id?: boolean;
};

export type CategoryAppstore = {
  name: string;
  description?: string;
  handle?: string;
  imgBackground?: string;
  imgLogo: string;
};

export type CollectionAppstore = {
  name: string;
  description?: string;
  keyName?: string;
  imgLogo?: string;
  handle?: string;
  totalApp?: number;
};

export type AppOfCollection = {
  name: string;
  shortDescription: string;
  appImage?: string;
};

export type VaraintProduct = {
  size?: string;
  color?: string;
  style?: string;
  quantity?: number;
};

export type AppDetail = {
  appName: string;
  shortDescription: string;
  logo?: string;
  price?: string;
  pricingType?: string;
  pricingValue?: number;
  websiteUrl?: string;
  supportPageUrl?: string;
  description?: string;
  rating?: number;
  rateCount?: number;
  screenShort?: Array<string>;
};

export type SettingFeed = {
  name_before: string;
  feed_name: string;
  name: string;
  code: string;
  dashboard_ui: string;
  icon: string;
  short_description: string;
  description: string;
  feed_limitation: string;
  when_exceeding_limit: string;
  priority: string;
  approve_checkbox: boolean;
  sync_method: string;
  schedule_time: string;
  variant_limitation: string;
  when_exceeding_variant_limitation: string;
  file_limitation: string;
  when_exceeding_file_limit: string;
  file_type: string;
  the_number_of_link: number;
  total_products_verify: string;
};

export type paramDeleteProduct = {
  products_deleted_log: [
    {
      id: number;
    },
  ];
};

export type ConditionInfo = {
  custom_name?: string;
  condition?: string[];
  then_show_value?: string[];
  add_condition?: string;
  list_custom?: Array<string>;
  is_show_value?: Array<boolean>;
  is_back_to_list?: boolean;
};

export type blockCondition = {
  custom_name: string;
  conditions: ConditionInfo[];
};

export type customOptionProductSFs = {
  image: string;
  custom_option_values: customOptionProductSF[];
};

export type ProductVariant = {
  title?: string;
  multiple_option?: [
    {
      option_name: string;
      option_values: string;
      add_option: boolean;
    },
  ];
  value_size?: string;
  value_color?: string;
  value_style?: string;
  price?: string;
  compare_at_price?: string;
  cost_per_item?: string;
  sku?: string;
  bar_code?: string;
  inventory_policy?: string;
  quantity?: string;
  allowOverselling?: boolean;
  weight?: string;
  weightUnit?: string;
  message?: string;
  media_url?: string;
  media_upload?: string;
  media_select?: string;
  variant_tag?: string;
  age_group?: string;
};

export type TrackingEvent = {
  event: string;
  content_brand: string;
  content_category: string;
  content_ids: string;
  content_name: string;
  content_type: string;
  currency: string;
  value: string;
  num_items: string;
};

export type ProductFeed = {
  feed_name: string;
  feed_title: string;
  radio_btn?: string;
  country?: string;
};

export type ClipartFolder = {
  folder_name: string;
  group_name?: string;
  images?: string[];
  type_custom_option?: string;
  image_name?: string;
  message?: string;
  checkIsEdit?: boolean;
  nameClipart?: string;
  is_add_more_clipart?: boolean;
};

export type AccountInfo = {
  bank_country: string;
  bank_account_currency: string;
  bank_account_type: string;
  email: string;
  head_phone: string;
  phone: string;
  select_country: string;
  state?: string;
  zip_code: string;
  street: string;
  address_details?: string;
  city: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  swift: string;
  iban: string;
};

export type ReviewPayoutInfo = {
  amount: string;
  status: string;
  method: string;
};

export type GroupInfo = {
  current_group: string;
  new_group: string;
  side: "Front side" | "Back side";
};

export type AddLayersToGroupInfo = {
  layer_name: string;
  group_name: string;
};

export type StorePlanInfo = {
  id: number;
  status?: "active" | "frozen" | "closed";
  payment_status?: "free_trial" | "upgraded" | "paying";
  end_free_trial_at?: number;
  end_free_trial_at_minute?: number;
  subscription_expired_at?: number;
  subscription_expired_at_minute?: number;
  package?: string;
  package_type?: "monthly" | "yearly";
  package_id?: number;
  charge_sub?: "true" | "fail";
  created_at?: number;
};

export type ActivationInfo = {
  package_name?: string;
  package_period?: string;
  discount_code?: string;
  discount_type?: string;
  discount_value?: number;
  package_price?: number;
  start_date?: string;
  end_date?: string;
};

export type TransferFundsInfo = {
  transfer_funds?: string;
  account_holder?: string;
  account_email?: string;
  transaction_id?: string;
  note?: string;
  is_attack_file?: boolean;
  path_file?: string;
};

export type ScrollUntilEleVisible = {
  page: Page;
  scrollEle?: Locator;
  viewEle: Locator;
};

export type ChangeStatus = {
  type: "linked library" | "library" | "template";
  id: number;
  status: 1 | 2;
};

export type CustomizeGroup = {
  option_group: string;
  is_delete_group?: boolean;
  group_name_delete?: string;
  label_group: string;
  group_name?: string;
  image_name?: string;
  default_value?: string;
  camp_launched?: boolean;
  drag_drop?: {
    from: string;
    to: string;
  };
  back_to_list?: string;
  is_no_group_default?: boolean;
};

export type CustomizeGroupValidate = {
  option_group: string;
  fields: Array<{
    field_type: string;
    value: string;
    expect: string;
    drag_drop?: {
      from: string;
      to: string;
    };
    value_fallback?: string;
    image_success: boolean;
    placeholder?: string;
  }>;
};

export type BaseProductInfor = {
  category: string;
  base_product: string;
  base_product_id?: number;
};

export type VariantCombo = {
  quantity: number;
  variant_name: string;
};

export type CollectionInfo = {
  id: string;
  title: string;
  collection_title: string;
  collection_description: string;
  collection_image: string;
  collection_visibility: boolean;
  collection_product_thumbnails: string;
  collection_handle: string;
  collection_type: string;
  product_thumbnail: string;
  condition_type: string;
  conditions: string;
  product_title: string;
  message_error: string;
};

export type ProfileInfo = {
  profile_user_id?: number;
  profile_shop_id?: number;
  email?: string;
  first_name: string;
  last_name: string;
  birthday: number;
  country: string;
  address: string;
  social_platform: string;
  personal_website: string;
  phone_user: string;
  calling_code: string;
};

export type CountriesInfo = {
  current_country_code: string;
  countries: Array<CountryInfo>;
};

export type CountryInfo = {
  id: number;
  name: string;
  code: string;
};

export type CollectionValue = {
  collection_title: string;
  collection_description: string;
  collection_image: string;
  meta_title: string;
  meta_description: string;
  sort_order: string;
};

export type FormatDescription = {
  description: string;
  format: string;
  text_type: string;
  text_color: string;
  bullet_list: boolean;
  number_list: boolean;
};

export type SEODetail = {
  page_title: string;
  meta_description: string;
  url_and_handle: string;
};

export type SetAttribute = {
  iframe?: string;
  selector: string;
  attributeName: string;
  attributeValue: string;
};

export type VariantEditor = {
  base_product: string;
  option_color: string;
  variant_color: string;
  option_size: string;
  variant_size: string;
};

//variants when create product
export type Variants = {
  title: string;
  sku: string;
  option3: string;
  option2: string;
  option1: string;
  price: number;
  compare_at_price: number;
  weight: number;
  weight_unit: string;
};

export type SelectorFrom = {
  iframe?: string;
  selector: string;
  left?: number;
  top?: number;
};

export type SelectorTo = {
  iframe?: string;
  selector: string;
  left?: number;
  top?: number;
};

export type DragAndDropInfo = {
  from: SelectorFrom;
  to: SelectorTo;
  isHover?: boolean;
  callBack?: ({ page: Page, x, y }) => Promise<void>;
};

export type CampaignDetail = {
  campaign_title: string;
  campaign_status: string;
  campaign_id: number;
  id?: number;
};

export type RemoveLayer = {
  layer_name: string;
  side?: string;
};

export type OptionExport = {
  option: string;
  file: string;
};

export type FilterCondition = {
  field: string;
  radio?: string;
  value_textbox?: string;
  select_ddl_value?: string;
  select_ddl_value_spds?: string;
  input_ddl_value?: string;
  input_then_select_array?: Array<InputThenSelectArray>;
  checkbox_array?: Array<CheckBoxArray>;
};

export type CheckBoxArray = {
  checkbox: string;
};

export type InputThenSelectArray = {
  input_then_select: string;
};

export type ActionClipart = {
  clipart_name: string;
  action: string;
  group_name?: string;
};

export type GroupClipart = {
  group_name: string;
  folder_name?: string;
  action: string;
  message?: string;
  snapshot_name?: string;
};

export type Campaigns = {
  layers: Array<Layer>;
  custom_options?: Array<CustomOptionProductInfo>;
  product_infos?: Array<BaseProductInfor>;
  pricing_info?: PricingInfo;
  custom_art?: Array<CustomArt>;
  group_infos?: Array<GroupInfo>;
  layers_group_infos?: Array<AddLayersToGroupInfo>;
  custom_group_infos?: CustomizeGroup;
  is_campaign_draft?: boolean;
  conditional_logic_info?: Array<ConditionInfo>;
};

export type CustomArt = {
  file_name: string;
  file_upload: string;
  applied_for: string;
  index?: number;
  message?: string;
  remove_layer?: RemoveLayer;
  add_more_material?: boolean;
};

export type ProxyParams = {
  server: string;
  username: string;
  password: string;
};

export type WidgetInfo = {
  title?: string;
  desciption?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  image?: boolean;
};

export type CalculateProfitInfos = {
  sub_total: number;
  tip: number;
  shipping_fee: number;
  tax_amount: number;
  store_discount: number;
  base_cost: number;
  design_fee: number;
  payment_fee_percent: number;
  processing_fee_percent: number;
  payment_fee: number;
  processing_fee: number;
};

export type ProfitInfos = {
  payment_fee: number;
  processing_fee: number;
  profit: number;
};

export type FilterCustomArtInHive = {
  type: string;
  value: string;
};
export type ExportProductInfo = {
  ads_optimization?: boolean;
  product_export?: string;
  file_format?: string;
};
export type Artwork = {
  created_at?: number;
  file_name?: string;
  file_size?: number;
  height?: number;
  id?: number;
  image_type?: string;
  original_name?: string;
  path?: string;
  ready_size?: string;
  shop_id?: number;
  status?: string;
  thumbnail?: string;
  type?: string;
  updated_at?: number;
  user_id?: number;
  width?: number;
};
export type InfoPreferences = {
  favicon?: string;
  description?: string;
  title?: string;
  password?: string;
  enable_password?: boolean;
  additional_scripts_head?: string;
  additional_scripts_body?: string;
};

export type SizeChartInfo = {
  style?: string;
  description?: string;
  description_html?: string;
  image_local?: string;
  image_url?: string;
  title?: string;
  version?: string;
  description_inc?: string;
  description_option?: {
    text?: string;
    image?: string;
    table?: {
      row_column: number; // vd: 23 3 cột 3 hàng row luôn trừ đi 1
      values: Array<string>;
    };
  };
};

export type MappingInfo = {
  variant_product: string;
  variant_base: string;
  index?: number;
};

export type ActionForProduct = {
  action_name: string;
  product_value: string;
  confirm_action: string;
  price_old: string;
  price_new: string;
};

export type ProductExportData = {
  "Product Id"?: string;
  Handle?: string;
  Title?: string;
  "Body (Html)"?: string;
  Published?: string;
  "Option1 Name"?: string;
  "Option1 Value"?: string;
  "Image Src"?: string;
  "Image Position"?: string;
  "Variant Id"?: string;
  "Variant Price"?: string;
  "Variant Compare At Price"?: string;
  "Variant Inventory Policy"?: string;
  "Variant Fulfillment Service"?: string;
};

export type TemplateImportProductData = {
  Title?: string;
  Type?: string;
  Tags?: string;
  Published?: string;
  "Option fulfill value"?: string;
  "Option1 Name"?: string;
  "Option1 Value"?: string;
  "Option2 Name"?: string;
  "Option2 Value"?: string;
  "Variant Price"?: string;
  "Variant Compare At Price"?: string;
  "Image Src"?: string;
  "Image Position"?: string;
  "Alt Image"?: string;
  "Cost per Item"?: string;
  "Seo Title"?: string;
  "Seo Description"?: string;
};

export type OfferData = {
  name: string;
  message?: string;
  qtt_discount?: [
    {
      minqtt?: number;
      discount?: number;
      type?: string;
    },
  ];
};

export type BlogInfo = {
  title?: string;
  comment_type?: string;
  content?: string;
  excerpt?: string;
  visibility?: string;
  featured_image?: string;
  author?: string;
  blog?: string;
  tags?: Array<string>;
  seo?: boolean;
  page_title?: string;
  meta_description?: string;
  handle?: string;
  comment_type_radio?: boolean;
  status_blog_post?: boolean;
};

export type Order = {
  id?: number;
  name?: string;
  line_items?: Array<LineItem>;
  subtotal?: number;
  shipping_fee?: number;
  tax_amount?: number;
  total?: number;
  tip?: number;
  is_tax_include?: boolean;
  discount?: number;
  base_cost?: number;
  shipping_cost?: number;
  paid_by_customer?: number;
  revenue?: number;
  handling_fee?: number;
  profit?: number;
  processing_fee?: number;
  payment_fee?: number;
  order?: OrderSB;
  pbase_order?: PbaseOrder;
};
export type LineItem = {
  is_mapped_option?: boolean;
};
export type DataCreatAccount = {
  account_name: string;
  country: string;
  target_platform: string;
};
export type InfoEvent = {
  transaction_id?: string;
  value?: string;
  tax?: string;
  shipping?: string;
  currency?: string;
  coupon?: string;
  items: Array<ItemProductDetail>;
};
export type ItemProductDetail = {
  name?: string;
  brand?: string;
  variant?: string;
  category?: string;
  price?: string;
  quantity?: number;
  discount?: number;
  item_variant?: string;
  currency?: string;
};
export type FilterOrder = {
  name_filter: string;
  value_filter: string;
};

export type PlanInfo = {
  amount: number;
  start_date: string;
  end_date: string;
  days_quantity: number;
  discount: boolean;
  amount_origin: number;
  discount_type: string;
  discount_value: number;
  duration_in_months: number;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FilterFunnel = {
  shop_id?: number;
  funnel_from?: string;
  funnel_to?: string;
  action_list?: Array<string>;
};

export type ConversionAnalytics = {
  view_all?: number;
  view_collect?: number;
  view_product?: number;
  add_to_cart?: number;
  reached_checkout?: number;
  do_checkout?: number;
  fill_shipping_info?: number;
  complete_shipping_info?: number;
  fill_payment_info?: number;
  place_order?: number;
  purchase?: number;
};

export type DataUtmSalesReport = {
  add_to_cart: number;
  aoi_rate: number;
  aov_rate: number;
  cr_rate: number;
  net_sales: number;
  product_id: number;
  product_title: string;
  reached_checkout: number;
  source_medium: string;
  total_items: number;
  total_orders: number;
  utm_campaign: string;
  utm_content: string;
  utm_source: string;
  utm_term: string;
  view_content: number;
};
export type SchedulerSyncOrder = {
  number_in_tab?: number;
  order_name?: string;
  order_id?: number;
};

export type DiscountHiveInfo = {
  code?: string;
  apply_to_store_type?: string;
  apply_to_store?: Array<number>;
  discount_type?: string;
  discount_value?: number;
  discount_value_max?: number;
};

export type OrderSB = {
  subtotal_price?: number;
  total_price?: number;
  tip_amount?: number;
  shipping_lines?: Array<ShippingLine>;
  total_tax?: number;
  taxes_included?: number;
  total_discounts?: number;
  previous_shipping_fee?: number;
  total_line_items_price?: number;
  order_hold_amount?: Array<OrderHoldAmount>;
  discount_code?: Array<discountCode>;
};

export type discountCode = {
  amount?: number;
  code?: string;
  scope?: string;
  type?: string;
};

export type PbaseOrder = {
  payment_fee?: number;
  processing_fee?: number;
  base_cost?: number;
  manual_design_fee?: number;
  payment_fee_rate?: number;
  processing_rate?: number;
  profit?: number;
};

export type OrderHoldAmount = {
  amount?: number;
  hold_by?: string;
  order_id?: number;
  reason?: string;
  status?: string;
  release_by?: string;
  meta_data?: Array<string>;
};

export type AddFilter = {
  filters: string[];
  custom?: {
    name: string;
    tags: string[];
  };
  checked: boolean;
};

export type CheckFilters = {
  checked?: Record<string, string>;
  custom?: Record<string, string>;
};

export type SelectFiltersData = {
  position: "Left sidebar" | "In drawer" | "On top";
  filters?: Array<SelectFilter>;
  price?: {
    from?: number;
    to?: number;
  };
};

export type SelectFilter = {
  cate?: string;
  name: string;
  index?: number;
  check: boolean;
};

export type EditCustomFilter = {
  name: string;
  index?: number;
  edit: {
    name?: string;
    tags?: string[];
  };
};

export type MenuInfo = {
  id: number;
  handle: string;
  title: string;
  is_default: boolean;
  items: SubMenu;
};

export type SubMenu = {
  children: unknown[];
  id: number;
  menu_id: number;
  name: string;
  position: number;
  type: string;
  type_options: Record<string, string | number>;
};
export type CustomizeReview = {
  font?: string;
  style?: string;
  carousel_background?: string;
  widget_background?: string;
  primary_color?: string;
  rating_color?: string;
  date_format?: string;
  layout?: string;
  reviews_per_page?: string;
  card_layout: string;
  widget_layout: string;
  number_of_reviews: string;
};

export type Review = {
  star: number;
  title: string;
  review: string;
  name: string;
  email: string;
  translated_review?: string;
  product?: string;
};

export type UpdateReview = {
  id: number;
  status: boolean;
};

export type ProductGroupReview = {
  title: string;
  group: "Collection" | "Tag" | "Vendor";
  value: string;
};

export type CommentInfo = {
  your_name?: string;
  your_email?: string;
  website?: string;
  comment?: string;
  blog_post?: string;
  translated_comment?: string;
};
export type Search = {
  limit?: number;
  sort_field?: string;
  sort_mode?: string;
  fields?: string;
  tab?: string;
  last_id?: number;
  page?: number;
  direction?: string;
  search?: string;
  published_status?: string;
  title_mode?: string;
  title?: string;
  use_dropship_product?: string;
  query?: string;
};

export type DataHomepage = {
  total_balance_issues?: number;
  total_change_products?: number;
  total_orders_pending?: number;
  total_orders_risk?: number;
  total_orders_unfulfill?: number;
};

export type DataMapVariantProduct = {
  attribute_name: string;
  variant_mapping: Array<MappingInfo>;
};

export type VariantDispath = {
  id: number;
  stock_warehouse_id: [number | string];
  product_product_ids: number[];
};
export type OrderPrintHub = {
  base_product?: string;
  color?: string;
  size?: string;
  front_artwork?: string;
  front_artwork_type?: string;
  back_artwork?: string;
  back_artwork_type?: string;
  back_mockup?: string;
  front_mockup_type?: string;
  front_mockup?: string;
  back_mockup_type?: string;
};

export type InforCustumer = {
  first_name?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  phone_number?: string;
  province?: string;
};

export type UploadArtInfor = {
  is_column: boolean;
  artwork: string | string[];
  side?: string;
  campaign_name: string;
  artwork_back?: string | string[];
  side_back?: string;
  index_side: number;
  title_after_upload: string;
};

export type StorefrontInfo = {
  currency?: string;
  email?: string;
  customer_email?: string;
  subscription_expired_at?: number;
  package_start_time?: number;
  end_free_trial_at?: number;
  online_store_enable?: boolean;
  status?: "active" | "frozen" | "closed";
  payment_status?: "free_trial" | "upgraded" | "paying";
  previous_payment_status?: "free_trial" | "upgraded" | "paying";
  enable?: boolean;
  enable_multi_storefront?: boolean;
  storefront_free?: boolean;
};
