export type RealTimeVisitor = {
  success: boolean;
  settings: {
    enable: boolean;
    number_random_from: number;
    number_random_to: number;
    trigger: { target: string; product_ids: Array<number>; collection_ids: Array<number> };
  };
};

export type settingSocialProof = {
  settings: {
    theme: {
      default: boolean;
      style: string;
      customize: {
        body_background_color: string;
        time_color: string;
        main_text_color: string;
      };
    };
    display: {
      desktop_position: string;
      show_on_mobile: boolean;
      mobile_position: string;
      display_time: number;
      maximum_per_page: number;
      display_notification_random: boolean;
      delay_time_notification: number;
      repeat_sync_notification: boolean;
      last_time_display: number;
      random_delay_time_notification: boolean;
      delay_time_show_popup: number;
    };
  };
};

export type settingCustomize = {
  timer_countdown: {
    color: string;
    front_size: number;
  };
  product_countdown: {
    process_color: string;
    background_color: string;
    front_size: number;
  };
  realtime_visitor: {
    text_color: string;
    background_color: string;
    number_color: string;
    type: string;
    font_size: number;
  };
};

export type infoSalesNotifications = {
  id: string;
  customer_address: string;
  customer_city: string;
  customer_country: string;
  customer_name: string;
  customer_first_name: string;
  customer_last_name: string;
  product_name: string;
  order_created_at: number;
  status: boolean;
  type: "sync" | "Custom";
};

export type salesNotificationsList = Array<infoSalesNotifications>;

export type settingSalesNotifications = {
  message: {
    title: string;
    product_name: string;
    time: string;
  };
};

export type settingCheckoutNotifications = {
  message: {
    title: string;
  };
};

export type editSalesNotifications = {
  title?: string;
  product_name?: string;
  time?: string;
};

export type editCheckoutNotifications = {
  message?: string;
  image?: "Choose an image from our library" | "Upload your own image";
  choose_an_image_from_our_library?: {
    index_img: number;
  };
  upload_your_own_image?: {
    file_path: string;
  };
};

export type addCustomNoti = {
  select_option: "Products" | "Collections" | "All products";
  product_name: string;
  collection_name: string;
  locations_option: "Random locations" | "Manually select locations";
  random_location: string;
  manual_location: string;
};

export type editProductCountdown = {
  enable?: boolean;
  trigger: {
    target: string;
    product_ids?: Array<number>;
    collection_ids?: Array<number>;
  };
  type: "actual" | "number" | "percent";
  percent_random_from: number;
  percent_random_to: number;
  number_random_from: number;
  number_random_to: number;
};

export type editRealTimeVisitor = {
  enable?: boolean;
  number_random_from: number;
  number_random_to: number;
  trigger: {
    target: string;
    product_ids?: Array<number>;
    collection_ids?: Array<number>;
  };
};

export type settingVisitorUI = {
  text_color: string;
  background_color: string;
  number_color: string;
  type: string;
  font_size: number;
  number_random_from: number;
  number_random_to: number;
};

export type settingProductCountdownUI = {
  process_color: string;
  background_color: string;
  front_size: number;
};
