import type { ProductDetail } from "@types";

export type GetProductAPIParam = {
  title?: string;
  title_mode?: string;
  product_type?: string;
  published_status?: string;
  member?: string;
  member_mode?: string;
  limit: number;
  page: number;
};

export type CountProductAPIResponse = {
  code: string;
  data: CountProductResponseData;
  message: string;
  success: boolean;
};

export type CountProductResponseData = {
  count: number;
  total_publish_product: number;
  max_published_products: number;
};

export type GetProductsAPIResponse = {
  message: string;
  success: boolean;
  token: string;
  data: {
    body_html: string;
    can_preview: boolean;
    clone_processing: string;
    created_at: Date;
    custom_options: string;
    default_image_id: number;
    display_options: string;
    handle: string;
    id: number;
    image: null;
    member: number;
    metafields_global_description_tag: string;
    metafields_global_title_tag: string;
    product_availability: number;
    product_source: string;
    product_type: string;
    published: boolean;
    published_at: string;
    published_scope: string;
    sales: number;
    tags: string;
    template_suffix: string;
    title: string;
    updated_at: Date;
    variant_offers: null;
    vendor: string;
  }[];
};

export type GetProductAPIResponse = {
  message: string;
  success: boolean;
  token: string;
  data: {
    products: ProductDetailElement[];
  };
};

export type ProductDetailElement = {
  product: ProductDetail;
  sections: ProductDetailSection[];
};

export type ProductDetailSection = {
  id: number;
  title: string;
  description: string;
  status: string;
  position: number;
  created_at: number;
  lectures?: ProductDetailSection[];
  clone_processing?: string;
  medias?: Media[];
  variant_mappings?: never[];
};

export type Media = {
  id: number;
  type: string;
  path: string;
  name: string;
  thumbnail: string;
  subtitle_path: string;
  size: number;
  status: string;
  third_party_id: string;
  third_party_name: string;
  created_at: number;
  duration: number;
  position: number;
  playback_id: string;
};
