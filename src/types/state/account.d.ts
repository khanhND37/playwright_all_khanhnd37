export type ShopInfos = {
  domain: string;
  username: string;
  password: string;
};

export type CreditCard = {
  cardNumber: string;
  expires: string;
  cvc: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
};

export type ShopInfo = {
  shopName: string;
  country: string;
  phone_number: string;
  fb_link: string;
};

export type Permissions =
  | "home"
  | "read_orders"
  | "write_orders"
  | "export_orders"
  | "products"
  | "customers"
  | "dashboards"
  | "marketing_and_discounts"
  | "apps"
  | "settings"
  | "sales_channel"
  | "shopbase_global"
  | "themes"
  | "navigation"
  | "domains"
  | "pages"
  | "preferences"
  | "read_sales"
  | "payment_providers"
  | "balance"
  | "view_balance"
  | "pay_invoice"
  | "marketing_sales"
  | "marketing_emails"
  | "read_products"
  | "read_analytics"
  | "inventory"
  | "file_manager"
  | "online_store"
  | "watermark"
  | "size_chart"
  | "setting"
  | "write_products"
  | "view_assigned_staffs";
export type ListPermissions = Array<Permissions>;
