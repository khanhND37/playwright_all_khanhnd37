export type CreateCustomCollectionResponse = {
  custom_collection: CollectionInfoAPI;
};

export type CollectionInfoAPI = {
  collection_type: string;
  disjunctive: boolean;
  body_html: string;
  title: string;
  rules: Array<CollectionRule>;
  metafields: Array<CollectionMetafields>;
  collection_availability: number;
  handle: string;
  id: number;
};

export type CollectionRule = {
  column: string;
  relation: string;
  condition: string;
};

export type CollectionMetafields = {
  namespace: string;
  key: string;
  value: string;
  value_type: string;
};

export type CollectionInfoSF = {
  id: number;
  position: number;
  description: string;
  image: {
    src: string | null;
    alt_text: string;
  };
  level: number;
  title: string;
  product_count: number;
  handle: string;
  sort_order: string;
};

export type FilterSF = {
  colors?: Record<string, string>;
  data: string[] | null;
  handle: string;
  label: string;
  type: string;
};

export type BootstrapCollection = {
  items: CollectionInfoSF[];
  count: number;
  filters: FilterSF[];
};

export type sortType =
  | "Best selling"
  | "Alphabetically, A to Z"
  | "Alphabetically, Z to A"
  | "Date, new to old"
  | "Date, old to new"
  | "Product count, high to low"
  | "Product count, low to high"
  | "Most viewed first"
  | "Most viewed last";

export type tabCollection = "All" | "Manual collections" | "Automated collections";
