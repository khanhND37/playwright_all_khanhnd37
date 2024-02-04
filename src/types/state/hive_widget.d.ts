export type ConfigStore = {
  name: string;
  first_name?: string;
  last_name?: string;
  store_coutry: string;
  per_location: string;
  phone_number: string;
  code?: string;
  business_model: string;
  business_type?: string;
  monthly_revenue?: string;
  platform: string;
};

export type ConfigWidget = {
  name: string;
  widget_type: string;
  title?: string;
  description?: string;
  primary_btn_text?: string;
  primary_btn_link?: string;
  secondary_btn_text?: string;
  secondary_btn_link?: string;
  image?: {
    filePath: string;
  };
  sub_list?: Array<ConfigSubListWidget>;
  discount: number;
  business_type?: Array<{ title: string }>;
  regions?: Array<{ region: string }>;
  screen?: string;
};

export type ConfigSubListWidget = {
  title_list: string;
  description_list: string;
  link_list: string;
  image_url: string;
};
