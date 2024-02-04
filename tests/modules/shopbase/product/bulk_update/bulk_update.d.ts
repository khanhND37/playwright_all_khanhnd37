export type ImportInfo = {
  status: string;
};

export type Filter = {
  option: string;
  value: string;
  index?: number;
};

export type AllActionItems = {
  "Find and replace text in description": Filter;
  "Add images to product media": string[];
  "Replace all product images by the uploaded ones": string[];
  "Replace tag": Filter;
  "Remove product type": boolean;
  "Change product type": string;
  "Increase price": Filter;
  "Decrease price": Filter;
  "Delete variant's option value": Filter;
  "Delete variant tag": string;
  "Add variant tag": string;
  "Replace variant tag": string;
  "Delete custom options": Filter;
  "Change Inventory policy": string;
  "Allow customer to purchase when product's out of stock": boolean;
  "Add Pixel Id": string;
  "Add Access token": string;
  "Change product page design": string;
  "Change variant's option value": {
    name: string;
    from: string;
    to: string;
  };
  action_index?: number; //Start with 1
  option_index?: number; //Start with 1
  add?: boolean;
};

export type ActionsName =
  | "Change product description"
  | "Add text to product description"
  | "Find and replace text in description"
  | "Add images to product media"
  | "Replace all product images by the uploaded ones"
  | "Replace tag"
  | "Remove product type"
  | "Change product type"
  | "Add text to product title"
  | "Remove text from product title"
  | "Replace text from product title"
  | "Change product vendor"
  | "Add tags"
  | "Remove tags"
  | "Add custom options"
  | "Replace custom options"
  | "Change variant's option value"
  | "Show on channels"
  | "Hide on channels"
  | "Add to collection"
  | "Remove from collection"
  | "Change inventory quantity"
  | "Find and replace text in SKU"
  | "Add text to SKU"
  | "Update product weight"
  | "Update product weight by percentage"
  | "Delete variant's option value"
  | "Delete variant tag"
  | "Add variant tag"
  | "Replace variant tag"
  | "Allow customer to purchase when product's out of stock"
  | "Change Inventory policy"
  | "Add Pixel Id"
  | "Add Access token"
  | "Assign staff"
  | "Delete custom options"
  | "Change product page design"
  | "Change price"
  | "Round/Beautify price"
  | "Increase price"
  | "Decrease price"
  | "Change compare-at-price"
  | "Increase compare-at-price"
  | "Decrease compare-at-price"
  | "Round/Beautify compare-at-price"
  | "Update compare-at-price based on price";
