export type CreateNEProduct = {
  images?: Record<string, unknown>[];
  variants?: [Variant];
  variantDefault?: Variant;
  title?: string;
};

export type CreateNEProductResponse = {
  collection_ids?: null | number;
  custom_options: Record<string, unknown>[];
  display_options?: {
    group_options_by?: number;
  };
  handle?: string;
  id?: number;
  options?: VariantOption[];
  published?: boolean;
  title?: string;
  variants?: Variant[];
};

export type VariantOption = {
  id?: number;
  is_default?: boolean;
  name?: string;
  position?: number;
  product_id?: number;
  values?: string[];
};

export type Products = {
  created_at?: string;
  handle?: string;
  id?: number;
  product_source?: string;
  sbcn_product_id?: number;
  title?: string;
  variants?: Array<Variant>;
  published: boolean;
};

export type Variant = {
  id?: number;
  active?: boolean;
  price?: number;
  sku?: string;
  compare_at_price?: number;
  cost_per_item?: number;
  bar_code?: number;
  weight?: number;
  is_default?: boolean;
  weight_unit?: string;
  inventory_quantity?: number;
  inventory_management?: string;
  inventory_policy?: string;
  requires_shipping?: boolean;
  taxable?: boolean;
  fulfillment_service?: string;
  variant_images?: Record<string, unknown>[];
  shipping_profile_id?: number;
  title?: string;
};
