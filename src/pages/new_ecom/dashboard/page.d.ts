import type { Locator } from "@playwright/test";

export type PageListItem = {
  title: string;
  handle: string;
  customizable: boolean;
  selectable?: boolean;
  duplicatable?: boolean;
  removable?: boolean;
  previewable: boolean;
  elements: {
    btnCustomize: Locator;
    btnDelete?: Locator;
    btnDuplicate?: Locator;
    btnPreview: Locator;
  };
  actions: {
    clickPreview: () => Promise<void>;
  };
};

export type PageSettings = {
  customText: string;
  position: string;
  elements: {
    input: Locator;
    btnPosition: Locator;
  };
};

export type PolicyPage = {
  refund_policy?: string;
  privacy_policy?: string;
  shipping_policy?: string;
  terms_of_service?: string;
  return_policy?: string;
  seo?: SeoPolicyPage;
  visible_page?: {
    refund_policy?: boolean;
    shipping_policy?: boolean;
    return_policy?: boolean;
    terms_of_service?: boolean;
    privacy_policy?: boolean;
  };
};

export type SeoPolicyPage = {
  refund_policy?: {
    search_engine_title?: string;
    search_engine_meta_description?: string;
    search_engine_image?: string;
    is_show_in_search?: boolean;
  };
  rturn_policy?: {
    search_engine_title?: string;
    search_engine_meta_description?: string;
    search_engine_image?: string;
    is_show_in_search?: boolean;
  };
  shipping_policy?: {
    search_engine_title?: string;
    search_engine_meta_description?: string;
    search_engine_image?: string;
    is_show_in_search?: boolean;
  };
  privacy_policy?: {
    search_engine_title?: string;
    search_engine_meta_description?: string;
    search_engine_image?: string;
    is_show_in_search?: boolean;
  };
  terms_of_service?: {
    search_engine_title?: string;
    search_engine_meta_description?: string;
    search_engine_image?: string;
    is_show_in_search?: boolean;
  };
};

export type PolicyPageDetail = {
  title: string;
  handle: string;
  content?: string;
  seo?: {
    page_title?: string;
    meta_description?: string;
    image?: string;
    is_show_in_search?: boolean;
  };
  visible_page?: boolean;
};
