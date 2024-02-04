export type ProductDetail = {
  id: number;
  shop_id: number;
  handle: string;
  title: string;
  tags: string;
  body_html: string;
  product_type: string;
  default_image_id: number;
  published_at: number;
  published_scope: string;
  metafields_global_title_tag: string;
  metafields_global_description_tag: string;
  vendor: string;
  created_at: number;
  updated_at: number;
  published: boolean;
  updated_source: string;
  seo_id: number;
  product_source: string;
  product_availability: number;
  member: number;
  image: null;
  variant_offers: VariantOffer[];
  sales: number;
  clone_processing: string;
};

export type VariantOffer = {
  id: number;
  variant_id: number;
  price: number;
  name: string;
  quantity_limit: QuantityLimit;
  access_limit: AccessLimit;
  time_limit: TimeLimit;
  section_access: string;
  created_at: number;
  updated_at: number;
  sold: number;
  title: string;
  position: number;
  lecture_access: null;
};

export type AccessLimit = {
  limit: number;
  enabled: boolean;
};

export type QuantityLimit = {
  limit: string;
  enabled: boolean;
  type: string;
};

export type TimeLimit = {
  time_limit_type: string;
  time: number;
  time_type: string;
  enabled: boolean;
};
