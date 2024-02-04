export interface WarehousePlb {
  env: Env;
  cases: WarehousePlbCases;
}

export interface WarehousePlbCases {
  "SB_RLSBFF_RLSBFF-Warehouse_21": SbRlsbffRlsbffWarehouse2;
  "SB_RLSBFF_RLSBFF-Warehouse_22": SbRlsbffRlsbffWarehouse2;
  "SB_RLSBFF_RLSBFF-Warehouse_23": SbRlsbffRlsbffWarehouse2;
  "SB_RLSBFF_RLSBFF-Warehouse_24": SbRlsbffRlsbffWarehouse2;
}

export interface SbRlsbffRlsbffWarehouse2 {
  product_name: string;
  product_handle: string;
  quantity_checkout: number;
  data_invoice?: DataInvoice;
  product_replace_name?: string;
}

export interface DataInvoice {
  amount_cent: number;
}

export interface Env {
  dev: Dev;
}

export interface Dev {
  api: string;
  domain: string;
  shop_name: string;
  user_id: number;
  shop_id: number;
  username: string;
  password: string;
  owner_id: number;
  odoo_host: string;
  odoo_db: string;
  odoo_username: string;
  odoo_password: string;
  shop_plusbase: string;
  shipping_address: ShippingAddress;
  cases: DevCases;
}

export interface DevCases {
  "SB_RLSBFF_RLSBFF-Warehouse_21": SBRLSBFFRLSBFFWarehouse21;
  "SB_RLSBFF_RLSBFF-Warehouse_22": SBRLSBFFRLSBFFWarehouse22;
  "SB_RLSBFF_RLSBFF-Warehouse_23": SBRLSBFFRLSBFFWarehouse23;
  "SB_RLSBFF_RLSBFF-Warehouse_24": SBRLSBFFRLSBFFWarehouse24;
}

export interface SBRLSBFFRLSBFFWarehouse21 {
  data_purchase: DataPurchase;
  data: Data;
}

export interface Data {
  orders: Order[];
}

export interface Order {
  id?: number;
  shipping_method_id?: number;
  line_item_ids?: number[];
  line_items?: LineItem[];
}

export interface LineItem {
  id: number;
  shipping_method_id: number;
}

export interface DataPurchase {
  sale_order_id: number;
  purchases: Purchase[];
}

export interface Purchase {
  name: string;
  quantity: number;
  product_template_id: number;
  product_id: number;
}

export interface SBRLSBFFRLSBFFWarehouse22 {
  product_template_id: number;
  data: Data;
}

export interface SBRLSBFFRLSBFFWarehouse23 {
  new_product_info: ProductInfo;
  replace_warehouse_data: ReplaceWarehouseData;
}

export interface ProductInfo {
  target_shop_id: number;
  line_item_id: number;
  product_id: number;
  mapped_options: string[];
  replace_product_all_order: boolean;
}

export interface ReplaceWarehouseData {
  mapped_product_name: string;
  variant_name: string;
}

export interface SBRLSBFFRLSBFFWarehouse24 {
  new_product_info: ProductInfo;
  replace_warehouse_data: ReplaceWarehouseData;
  product_info: ProductInfo;
  order_number_old: string;
  order_id_old: number;
}

export interface ShippingAddress {
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  country: string;
  city: string;
  state: string;
  zipcode: string;
  country_code: string;
  phone_number: string;
}
