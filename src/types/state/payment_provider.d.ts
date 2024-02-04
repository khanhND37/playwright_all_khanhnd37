export type StripeAccount = {
  public_key: string;
  secret_key: string;
  api_key?: boolean;
  payment_method_types?: Array<string>;
  enable_sub_payment_method?: boolean;
  enable_pay_now_pay_later_method?: boolean;
};

export type PayPalAccount = {
  brand_name?: string;
  client_id: string;
  client_secret: string;
  disable_update_tracking?: boolean;
  enable_smart_button?: boolean;
  sandbox?: boolean;
};

export type CODAccount = {
  additional_details?: string;
  sandbox?: boolean;
};

export type CODExtraFee = {
  active: boolean;
  type: string;
  value: number;
  name?: string;
};

export type PayPalProAccount = {
  partner: string;
  vendor: string;
  user: string;
  pwd: string;
  sandbox?: boolean;
  enable_3d_secure?: boolean;
  cardinal_api_id?: string;
  cardinal_api_key?: string;
  cardinal_org_unit?: string;
};

export type UnlimintAccount = {
  terminal_code: string;
  terminal_password: string;
  callback_secret: string;
  sandbox?: boolean;
  statement_descriptor?: {
    name: string;
  };
};

export type CheckoutDotComAccount = {
  public_key: string;
  secret_key: string;
  sandbox?: boolean;
  statement_descriptor?: {
    name: string;
    city: string;
  };
  threeDs_enabled?: boolean;
};

export type AsiaBillAccount = {
  signKey: string;
  sandbox: boolean;
  merNo: string;
  gatewayNo: string;
};

/**
 * Thông tin đăng kí cổng thanh toán Braintree
 */
export type BrainTreeAccount = {
  merchant_id: string;
  public_key: string;
  private_key: string;
};

/**
 * Thông tin đăng kí cổng thanh toán Payoneer
 */
export type PayoneerAccount = {
  token_no: string;
  store_code: string;
  api_username: string;
  sandbox: boolean;
};

/**
 * Info of setting Stripe gateway
 */
export type DataBodyOfAGateway = {
  id?: number;
  name?: string;
  code: string;
  provider_options:
    | StripeAccount
    | PayPalAccount
    | OceanpaymentAccount
    | CODAccount
    | PayPalProAccount
    | BrainTreeAccount
    | UnlimintAccount
    | CheckoutDotComAccount
    | PayoneerAccount
    | AsiaBillAccount;
  active?: boolean;
  extra_fee?: CODExtraFee;
  title: string;
};

/**
 * Info of setting Payment
 */
export type DataBodyOfSettingPayment = {
  payment_code: string;
  statement_descriptor: {
    name: string;
  };
  is_cardholder_name_hidden: boolean;
};

/**
 * Thông tin paypal manager của cổng thanh toán paypal pro
 */
export type PaypalManager = {
  cardinal_api_id?: number;
  cardinal_api_key?: string;
  cardinal_org_unit?: string;
  partner: string;
  vendor: string;
  user: string;
  password: string;
};

/**
 * Thông tin 3D secure payment của cổng thanh toán paypal pro
 */
export type SecurePayment = {
  cardinal_id: string;
  cardinal_key: string;
  cardinal_org_unit_id: string;
};

/**
 * Thông tin đăng kí cổng thanh toán unlimint
 */
export type InfoUnlimint = {
  terminal_code: string;
  terminal_pass: string;
  callback_secret: string;
};

/**
 * Thông tin đăng kí cổng thanh toán AsiaBill
 */
export type InfoAsiaBill = {
  merchant_no: string;
  gateway_no: string;
  sign_key: string;
  sandbox: boolean;
};

/**
 * All information of setting to activate manual payment gateway
 */
export type ManualPaymentSetting = {
  payment_type?: "COD" | "Bank Transfer";
  test_mode?: boolean;
  additional?: Array<string>;
  is_extra_fee?: boolean;
  extra_fee_type?: string;
  extra_fee_value?: number;
  extra_fee_name?: string;
};

export type OceanpaymentAccount = {
  account_name?: string;
  account: string;
  terminal: string;
  secure: string;
};

/**
 * Information Braintree account
 */

export type Braintree = {
  merchant_id: string;
  public_key: string;
  private_key: string;
};

export type CaptureInfo = {
  time: number;
  type?: "manual" | "auto";
  is_send_mail: boolean;
  exclude_fraud_order: boolean;
};

export type PaypalSetting = {
  brand_name: string;
  is_enable_paypal_smart_button: boolean;
  is_enable_tracking: boolean;
  enabled_order_info: Array<string>;
  enter_payment_info: boolean;
  is_enable_merchant_print_base_paypal: boolean;
  enable_paypal_paylater: boolean;
};

export type RiskLevelInfo = {
  aftx_rate: number;
  aftx_spay_rate: number;
  astx_rate: number;
  astx_spay_rate: number;
  connected_account_approved_enough: number;
  direct_traffic_order_rate: number;
  dispute_rate: number;
  dispute_spay_rate: number;
  fraud_order_rate: number;
  high_level_approve: number;
  level_time_limit_reached: number;
  match_tracking_number_rate: number;
  odrxy_rate: number;
  odrxy_spay_rate: number;
  otmrxy_rate: number;
  otmrxy_spay_rate: number;
};

export type ActivityLog = {
  action: string;
  detail: string;
};
