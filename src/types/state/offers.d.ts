export type CreateUpsellOfferUI = {
  type?: "Pre-purchase Offers" | "In - cart Offers" | "Quantity Discounts" | "Bundles" | "Accessories";
  name?: string;
  message?: string;
  title?: string;
  target_type: "All products" | "Specific products" | "Specific collections" | "Specific by rules";
  recommended_type:
    | "Specific products"
    | "Specific collections"
    | "Specific by base category"
    | "Same collection with target products"
    | "Most relevant products using automated rules"
    | "Specific by rules";
  target_prod_coll?: string[];
  target_quantity?: number;
  recommended_prod_coll?: string[];
  recommended_quantity?: number;
  recommended_variant?: string;
  categories?: string[];
  discount_percent?: string;
};

export type UpsellOffer = {
  id: number;
  offer_type: string;
  offer_name: string;
  offer_title: string;
  offer_message: string;
  target_type: string;
  recommend_type: string;
  discount_data?: object;
  priority: number;
  activated: boolean;
  additional_condition?: object;
  created_at: number;
  updated_at: number;
  shop_id?: number;
  target_ids: number[];
  shipping_fee?: object;
};

export type AutoUpsellInfor = UpsellOffer;

export type PerformanceOffer = {
  acr_add_cart?: number;
  acr_checkout?: number;
  acr_rate?: number;
  acr_sales?: number;
  acr_view?: number;
};

export type CrossSellWidgetType =
  | "handpicked-product"
  | "best-seller"
  | "recent-view"
  | "also-bought"
  | "cart-recommend"
  | "more-collection";

export type CrossSellWidget = {
  enable: boolean;
  place: string;
  place_mobile: string;
  subtitle: string;
  title: string;
  type: CrossSellWidgetType;
};
