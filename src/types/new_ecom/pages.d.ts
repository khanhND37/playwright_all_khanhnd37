export type PageResponse = {
  id: number;
  handle: string;
  title: string;
  body_html: string;
  published: boolean;
  tags: string[];
  is_from_shop_template: boolean;
  is_show_in_search: boolean;
  template: string;
  search_engine_title: string;
  search_engine_image: string;
  search_engine_meta_description: string;
  publish: boolean;
};

export type PageData = {
  apply_to_another_store: boolean;
  body_html: string;
  handle: string;
  is_show_in_search: boolean;
  publish: boolean;
  search_engine_image: string;
  search_engine_meta_description: string;
  search_engine_title: string;
  tags: string[];
  template: string;
  title: string;
};

export type ApplyTemplatePageResponse = {
  id: number;
  title: string;
  page: string;
  type: string;
  image: string;
  settings_data: string;
  status: number;
  shop_id: number;
  entity_id: number;
  variant: string;
  base_template_id: number;
};

export type ListPageResponse = {
  pages: Array<PageResponse>;
  total: number;
};

export type ResponsePolicyPage = {
  refund_policy: string;
  privacy_policy: string;
  shipping_policy: string;
  terms_of_service: string;
  return_policy: string;
  seo: ResponseSeoPolicyPage;
  visible_page?: {
    refund_policy: boolean;
    shipping_policy: boolean;
    return_policy: boolean;
    terms_of_service: boolean;
    privacy_policy: boolean;
  };
};

export type ResponseSeoPolicyPage = {
  refund_policy: {
    search_engine_title: string;
    search_engine_meta_description: string;
    search_engine_image: string;
    is_show_in_search: boolean;
  };
  rturn_policy: {
    search_engine_title: string;
    search_engine_meta_description: string;
    search_engine_image: string;
    is_show_in_search: boolean;
  };
  shipping_policy: {
    search_engine_title: string;
    search_engine_meta_description: string;
    search_engine_image: string;
    is_show_in_search: boolean;
  };
  privacy_policy: {
    search_engine_title: string;
    search_engine_meta_description: string;
    search_engine_image: string;
    is_show_in_search: boolean;
  };
  terms_of_service: {
    search_engine_title: string;
    search_engine_meta_description: string;
    search_engine_image: string;
    is_show_in_search: boolean;
  };
};
