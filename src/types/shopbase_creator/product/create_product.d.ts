import type { ProductDetailSection, VariantOffer } from "@types";

export type CreateProductResponse = {
  code: string;
  data: CreateProductData;
  message: string;
  success: boolean;
};

export type PublishProductResponse = {
  code: string;
  data: {
    row_affected: number;
  };
  message: string;
  success: boolean;
};

export type CreateProductData = {
  product: DigitalProduct;
  sections: string[];
};

export type CreateProductBody = {
  product: {
    title: string;
    handle?: string;
    published: boolean;
    product_type: string;
  };
  dp_data?: {
    sections: ProductDetailSection[];
  };
};

/**
 * @deprecated: use src/types/shopbase_creator/ProductDetail instead
 */
export type DigitalProduct = {
  id?: number;
  shop_id?: number;
  handle?: string;
  title: string;
  tags?: string;
  body_html?: string;
  product_type?: string;
  default_image_id?: number;
  published_at?: number;
  published_scope?: string;
  metafields_global_title_tag?: string;
  metafields_global_description_tag?: string;
  vendor?: string;
  created_at?: number;
  updated_at?: number;
  published?: boolean;
  updated_source?: string;
  seo_id?: number;
  product_source?: string;
  product_availability?: number;
  member?: number;
  image?: null;
  variant_offers?: VariantOffer[];
  sales?: number;
  clone_processing?: string;
};
