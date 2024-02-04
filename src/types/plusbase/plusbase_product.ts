export type PlbCatalogProduct = {
  id: number;
  variants: Array<PlbCatalogVariant>;
  product_public_categories: Array<PlbProductPublicCategory>;
  starting_cost?: number;
  review_statistics?: PlbReview;
};

export type PlbCatalogVariant = {
  id: number;
  active: boolean;
  discount_base_cost: number;
  product_cost: number;
  base_cost: number;
  selling_price: number;
  moqs?: Array<PlbCatalogMoq>;
  name?: string;
};

export type PlbCatalogMoq = {
  quantity: number;
  price: number;
};

export type PlbProductPublicCategory = {
  id: number;
  name: string;
  x_enable: boolean;
  x_is_flash_sale: boolean;
  x_start_flash_sale: number;
  x_duration_flash_sale: number;
};

export type PlbVariantBaseCost = {
  variant_base_cost: Map<
    number,
    {
      base_cost: number;
    }
  >;
};

export type DataSize = {
  product_tmpl_id: number;
  lines: Record<string, number>;
  values: Record<string, number>;
};

export type PlbReview = {
  review_data: Array<dataReview>;
};

export type dataReview = {
  rate: number;
};
