// Tạm thời tracking Google theo UA, đến hết 06/2023 thì Google mới chuyển hết sang dùng GA

export type GoogleAnalyticEvent = {
  event: string;
  value: {
    page_path?: string;
    page_title?: string;
    currency?: string;
    checkout_option?: string;
    checkout_step?: number;
    coupon?: string;
    eventName?: string;
    event_category?: string;
    event_label?: string;
    items?: Array<Item>;
    send_to?: Array<string>;
    shop_id: number;
    shop_name: string;
    value?: string | number;
    search_term?: string;
  };
};

export type Item = {
  brand?: string;
  category?: string;
  item_id?: string | number;
  item_name?: string;
  price?: string;
  quantity?: number;
  variant?: string;
  currency?: string;
  discount?: number;
  item_brand?: string;
  item_category?: string;
};
export type GoogleAdsEvent = {
  event: string;
  value: {
    currency?: string;
    send_to?: string;
    shop_id: number;
    shop_name: string;
    value?: string | number;
  };
};
