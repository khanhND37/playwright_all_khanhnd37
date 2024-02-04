export type ReportData = {
  channel: string;
  referrer: string;
  view_page: number;
  conversion_rate: number;
  orders: number;
  sales: number;
  contribution: number;
};
export type ReportUTMData = {
  add_to_cart: number;
  aoi_rate: number;
  aov_rate: number;
  cr_rate: number;
  reached_checkout: number;
  source_medium: string;
  total_items: number;
  total_orders: number;
  total_sales?: number;
  total_profit?: number;
  utm_campaign: string;
  view_content: number;
  utm_source: string;
  utm_medium: string;
  utm_term: string;
  utm_content: string;
};

export type LiveView = {
  visitors_right_now: number;
  total_sessions: number;
  total_sales: number;
  total_orders: number;
  refunded: number;
};

export type SecssionDetail = {
  source_identifier: string;
  referring_site: string;
  first_page_visited: string;
  utm_campaign: string;
  view_content: number;
  utm_source: string;
  utm_medium: string;
  utm_term: string;
  utm_content: string;
};

export type DataAnalytics = {
  summary: {
    total_profit: number;
    total_sales: number;
    total_orders: number;
    total_aov: number;
    total_aop: number;
    total_aoi: number;
    total_items: number;
    view_content: number;
    session_convert: number;
    conversion_rate: number;
    first_time: number;
    returning: number;
    sales_before: number;
    cr_rate: number;
    add_to_cart: number;
    reached_checkout: number;
    view_page: number;
  };
  sbase: {
    total_sales: number;
    total_profit: number;
    total_orders: number;
    total_aov: number;
    total_aop: number;
    total_aoi: number;
    total_items: number;
    view_content: number;
    session_convert: number;
    conversion_rate: number;
    add_to_cart: number;
    reached_checkout: number;
    view_page: number;
  };
  upsell: {
    total_sales: number;
    total_profit: number;
    total_orders: number;
    total_aov: number;
    total_aop: number;
    total_aoi: number;
    total_items: number;
    view_content: number;
    session_convert: number;
    conversion_rate: number;
    add_to_cart: number;
    reached_checkout: number;
    view_page: number;
  };
  auto_upsell: {
    add_to_cart: number;
    cr_rate: number;
    reached_checkout: number;
    session_convert: number;
    source: string;
    total_aoi: number;
    total_aop: number;
    total_aov: number;
    total_items: number;
    total_orders: number;
    total_profit: number;
    view_collect: number;
    view_content: number;
    view_page: number;
  };
  plus_base_moq: {
    add_to_cart: number;
    cr_rate: number;
    reached_checkout: number;
    session_convert: number;
    source: string;
    total_aoi: number;
    total_aop: number;
    total_aov: number;
    total_items: number;
    total_orders: number;
    total_profit: number;
    view_collect: number;
    view_content: number;
    view_page: number;
  };
};

export type DPTotalSummary = {
  total_summary: {
    total_orders: number;
    net_sales: number;
    view_content: number;
  };
};

export type DPAnalyticsSalesReport = {
  product: {
    title: string;
    shop_name: string;
    views: number;
    orders: number;
    conversion_rate: number;
    contribute: number;
    net_quantity: number;
    sales: number;
    orders_summary: number;
    total_summary: {
      total_orders: number;
      net_sales: number;
      view_content: number;
    };
  };

  prod_type: {
    pr_type: string;
    views: number;
    orders: number;
    conversion_rate: number;
    contribute: number;
    net_quantity: number;
    sales: number;
    orders_summary: number;
    total_summary: {
      total_orders: number;
      net_sales: number;
      view_content: number;
    };
  };

  pricing_type: {
    pricing_type: string;
    views: number;
    orders: number;
    conversion_rate: number;
    contribute: number;
    net_quantity: number;
    sales: number;
    orders_summary: number;
    total_summary: {
      total_orders: number;
      net_sales: number;
      view_content: number;
    };
  };

  mem_type: {
    member_type: string;
    views: number;
    orders: number;
    conversion_rate: number;
    contribute: number;
    net_quantity: number;
    sales: number;
    orders_summary: number;
    total_summary: {
      total_orders: number;
      net_sales: number;
      view_content: number;
    };
  };
};

export type TrafficChannels = {
  channel: string;
  referrer: string;
  views: number;
  conversion_rate: number;
  orders: number;
  sales: number;
  contribution: number;
};

export type UTM = {
  source: string;
  medium: string;
  campaigns: string;
  term: string;
  content: string;
  views: number;
  session_converted: number;
  orders: number;
  sales: number;
  net_quantity: number;
};

export type PriceProduct = {
  summary: number;
  sbase: number;
  upsell: number;
  shipping: number;
  totalProductCheckout: number;
  taxes?: number;
};

export type DayChanges = {
  before_number_day: number;
  before_the_day: number;
};

export type AnalyticsDashboard = {
  sales?: number;
  profits?: number;
  total_orders: number;
  total_items: number;
  conversion_rate: number;
};

export type TaxReport = {
  sum_tax_refund: number;
  sum_tax_total: number;
  total: number;
  statistics: Array<TaxReportDetail>;
};

export type TaxReportDetail = {
  shop_id: number;
  order_id: number;
  country: string;
  order_name: string;
  tax_refund: number;
  tax_total: number;
};

export type ConversionSummary = {
  abandoned_checkout: number;
  acr_add_cart: number;
  acr_checkout: number;
  acr_profit: number;
  acr_rate: number;
  acr_sales: number;
  acr_view: number;
  add_to_cart: number;
  aoi_rate: number;
  aov_rate: number;
  atc_rate: number;
  channel: string;
  complete_shipping_info: number;
  contribution_rate: number;
  country_code: string;
  cr_rate: number;
  customer_type: string;
  display_time: string;
  do_checkout: number;
  domain: string;
  event_click: number;
  event_sent: number;
  fill_email: number;
  fill_payment_info: number;
  fill_phone: number;
  fill_shipping_address: number;
  fill_shipping_info: number;
  gross_sales: number;
  handle: string;
  image: string;
  is_summary: number;
  member_type: string;
  net_sales: number;
  order_recovery: number;
  payment_fee: number;
  place_order: number;
  pricing_type: string;
  product_id: number;
  product_title: string;
  product_type: string;
  product_vendor: string;
  purchase: number;
  rate_add_to_cart: number;
  rate_purchase: number;
  rate_reached_checkout: number;
  rate_view_all: number;
  rate_view_collect: number;
  rate_view_product: number;
  rc_rate: number;
  reached_checkout: number;
  referrer: string;
  row_offset: number;
  sc_rate: number;
  session_convert: number;
  shop_id: number;
  source: string;
  source_medium: string;
  total_aoi: number;
  total_aop: number;
  total_aov: number;
  total_customers: number;
  total_discount: number;
  total_items: number;
  total_orders: number;
  total_profit: number;
  total_refunded: number;
  total_sales: number;
  total_sessions: number;
  total_shipping: number;
  total_tax: number;
  total_tip: number;
  user_id: number;
  utm_ad: string;
  utm_adset: string;
  utm_campaign: string;
  utm_campaign_id: string;
  utm_content: string;
  utm_medium: string;
  utm_source: string;
  utm_term: string;
  variant_sku: string;
  variant_title: string;
  view_all: number;
  view_collect: number;
  view_content: number;
  view_page: number;
  view_product: number;
};
