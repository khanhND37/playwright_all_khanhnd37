import { ShippingMethod } from "./checkout_api";

//TODO use camelCase
export type Card = {
  number?: string;
  expire_date?: string;
  expire_month?: string;
  expire_year?: string;
  cvv?: string;
  holder_name?: string;
  sepa_card?: string;
  ideal_bank?: string;
  unlimint_card?: string;
  paypalpro_card?: string;
  oceanpayment_card?: string;
  asia_card?: string;
  is3ds?: boolean;
  security_code?: string;
  method?: string;
  otp?: string;
};

export type PaypalAccount = {
  username: string;
  password: string;
  id?: string;
  secret_key?: string;
};

export type PaypalCard = {
  number: string;
  expires_date: string;
  csc: string;
  country?: string;
  first_name?: string;
  last_name?: string;
  stress_address?: string;
  aria_desc?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone_number?: string;
  email?: string;
};

export type LoginInfoRedirectPage = {
  card?: Card;
  paypal_account?: PaypalAccount;
};

export type ShippingAddress = {
  email?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zipcode?: string;
  phone_number?: string;
  cpf_cnpj_number?: string;
  country_code?: string;
  social_id?: string;
  currency?: string;
};

export type ProductCheckoutInfo = {
  name: string;
  quantity: string;
  options: Array<string>;
  productQtyClass?: string;
};

export type OrderAfterCheckoutInfo = {
  orderId?: number;
  orderName?: string;
  totalSF?: number;
  shippingSF?: number | string;
  productQtyClass?: string;
  discountName?: string;
  discountValue?: number | string;
  subTotal?: number;
  productPrice?: number;
  tippingValue?: number;
  taxValue?: number;
  checkoutToken?: string;
  extraFee?: number;
};

export type ShortProductCheckoutInfo = {
  name: string;
  quantity: string;
  type: string;
};

export type ShortOrderAfterCheckoutInfo = {
  orderId: number;
  totalSF: string;
};

export type Discount = {
  isAuto?: boolean;
  name?: string;
  code?: string;
  type?: string;
  value?: number;
  discount_item?: string;
  appliesTo?: string;
  minRequi?: string;
  minValue?: number;
  isSpecCount?: boolean;
  country?: Array<string>;
  value_quantity?: Array<{ quantity: number; value: number; type: string }>;
  specific_products?: Array<string>;
};

export type TippingInfo = {
  percentages?: Array<number>;
  enabled?: boolean;
  is_old_layout?: boolean;
  tipping_amount?: string;
  option?: string;
  shop_type?: "shopbase" | "printbase" | "plusbase";
};

export type RefundInfo = {
  product_name?: string;
  product_qty?: string;
  shipping_fee?: string;
  reason?: string;
  extra_fee?: string;
  refund_amount?: string;
  selling_price?: string;
  payment_fee?: string;
  tip_amount?: string;
  is_refund_tip?: boolean;
  tax_amount?: string;
  send_noti?: boolean;
};

export type RefundPbaseInfo = {
  seller: {
    refund_base_cost: string;
    refund_processing_fee: string;
    refund_payment_fee: string;
    refund_design_fee: string;
  };
  buyer: {
    refund_selling_price: string;
    refund_tipping: string;
    refund_shipping_fee: string;
    recover_payment_fee: string;
    refund_taxes: string;
  };
  reason?: string;
  is_send_email?: boolean;
  message_id?: string;
};

export type GlobalMarketInfo = {
  adjustment_price?: number;
  country_id?: number;
  currency?: string;
  is_rounding?: boolean;
  money_format?: string;
  origin_currency?: string;
  rate?: number;
  rate1?: number;
  rounding?: number;
  sbase_rate?: number;
};

export type ExtraDataCheckout = {
  global_market?: GlobalMarketInfo;
};

export type SummaryInfo = {
  email?: string;
  payment_method?: string;
  shipping_method?: ShippingMethod;
  shipping_address?: ShippingAddress;
  billing_address?: ShippingAddress;
  discount_code?: string;
  discount_value?: number | string;
  discount_type?: string;
  extra_fee?: number;
  tax_amount?: number | string;
  shipping_fee?: number | string;
  subtotal_price?: number;
  total_tipping?: number;
  total_price?: number;
  payment_method_id?: number;
  extra_data?: ExtraDataCheckout;
  extra_data1?: ExtraDataCheckout;
};

export type OrderInfo = {
  id?: number;
  name?: string;
  token?: string;
  discountValue?: number | string;
  discountName?: string;
  totalVal?: number;
  subTotalVal?: number;
  payment_status?: string;
  fulfillment_status?: string;
  cancel_status?: string;
  created_at?: string;
};

export type OrderTotalAmount = {
  subtotal_price?: number;
  total_shipping?: number;
  total_discounts?: number;
  total_tax?: number;
  total_tipping?: number;
  total_price?: number;
  shipping_fee?: number;
  total_extra_fee?: number;
  items?: ItemList;
};

export type ItemList = {
  variant_id?: string;
  product_title?: string;
  qty?: number;
};
export type CheckoutInfo = {
  info?: SummaryInfo;
  order?: OrderInfo;
  totals?: OrderTotalAmount;
  token?: Token;
};

export type ContactUsForm = {
  name: string;
  phone: string;
  issue_type: string;
  issue_reason: string;
  product_link: string;
  msg: string;
};

export type ExtraFee = {
  active?: boolean;
  name?: string;
  type?: string;
  value?: number;
};

export type OrderSummary = {
  subTotal?: number;
  discountCode?: string;
  discountValue?: string;
  taxes?: number | string;
  shippingValue?: string;
  extraType?: string;
  extraValue?: number;
  tippingVal?: number;
  totalPrice?: number;
};

export type PaypalOrderSummary = {
  subtotal?: number;
  discount_value?: number;
  taxes?: number;
  shipping_value?: number;
  shipping_discount?: number;
  tipping_value?: number;
  total_price?: number;
};

export type CheckoutPaymentMethodInfo = {
  payment_type?: string;
  checkout_token?: string;
  country_code?: string;
};

export type GatewayInfo = {
  secretKey: string;
  gatewayCode: string;
  connectedAccount: string;
};

export type Token = {
  cart_token: string;
  checkout_token: string;
};

export type KlarnaGatewayInfo = {
  phoneNumber: string;
  otp: string;
  country: string;
  continentCode: string;
  chargeMethod: string;
};

export type CheckoutInfoAndCard = {
  email?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  shippingMethod?: boolean;
  cardNumber?: string;
  cardHolder?: string;
  expireDate?: string;
  cvv?: string;
};

export type RazorpayAccount = {
  phone?: string;
  country?: string;
  email?: string;
};

export type DataGetLogEslatic = {
  ip: string;
  user_name: string;
  password: string;
  event_name: string;
  index_name: string;
  external_domain?: string;
  session_id?: string;
};
