export type DigitalInfo = {
  handle: string;
  product_type: string;
  title: string;
  body_html: string;
  published: boolean;
};

export type SectionInfo = {
  id: number;
  title: string;
  description: string;
  status: string;
  product_id: number;
  position: number;
  message: string;
  success: boolean;
  variant: number;
};

export type DigitalValue = {
  title: string;
  body_html: string;
  handle: string;
  product_type: string;
  published: boolean;
  variant_offers: [
    {
      name: string;
      price: string;
      quantity_limit: {
        limit: number;
        enabled: boolean;
      };
      access_limit?: {
        limit: number;
        enabled: boolean;
      };
      time_limit?: {
        time_limit_type: string;
        time: number;
        time_type: string;
        enabled: boolean;
      };
    },
  ];
};
export type ProductListInfo = {
  total_product: number;
  filter: string;
};

export type ProductMedia = {
  shop_id: number;
  product_id: number;
  path: string;
  name: string;
  type: string;
  subtitle_path: string;
  status: string;
};

export type ProductLecture = {
  title: string;
  description: string;
  status: string;
  position: number;
  number_media: number;
  shop_id: number;
  product_id: number;
  section_id: number;
};

export type ProductLectureVerify = {
  title: string;
  description: string;
  status: string;
  position: number;
  number_media: number;
};

export type PaymentInfo = {
  active: boolean;
  title: string;
  code: string;
  provider_options: {
    name: string;
    public_key: string;
    secret_key: string;
    api_key: boolean;
    client_id: string;
    client_secret: string;
    disable_update_tracking: boolean;
    enable_smart_button: boolean;
    sandbox: boolean;
  };
  error: string;
};

export type VariantOfferOld = {
  price: number;
  name: string;
  quantity_limit: {
    limit: number;
    enabled: boolean;
  };
  access_limit: {
    limit: number;
    enabled: boolean;
  };
  time_limit: {
    time_limit_type: string;
    time: number;
    time_type: number;
    enabled: boolean;
  };
};

export type Pricing = {
  name: string;
  type: string;
  payment_types?: string;
  price?: number;
  delete?: boolean;
  access_limit?: {
    limit: number;
    enabled: boolean;
  };
};
export type Chapter = {
  title: string;
  description: string;
  status?: string;
  lessons: [
    {
      title: string;
      content?: string;
      status?: string;
    },
  ];
};
