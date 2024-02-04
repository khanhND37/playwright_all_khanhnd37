import { APIRequestContext, expect } from "@playwright/test";
import type {
  CaptureInfo,
  ExtraFee,
  InfoUnlimint,
  PaypalManager,
  StripeAccount,
  DataBodyOfAGateway,
  PaypalSetting,
  RiskLevelInfo,
  ActivityLog,
} from "@types";

export enum PaymentMethod {
  PAYPAL = "PayPal",
  PAYPALEXPRESS = "Paypal express",
  PAYPALSMARTBTN = "Paypal smart button",
  PAYPAL_SMART_BTN_REDIRECT = "Paypal smart button redirect",
  PAYPALCREDIT = "Paypal credit card",
  PAYPALBNPL = "Paypal BNPL",
  STRIPE = "Stripe",
  SHOPBASEPAYMENT = "Shopbase payment",
  BANCONTACT = "Bancontact",
  GIROPAY = "giropay",
  SEPA = "SEPA Direct Debit",
  IDEAL = "iDEAL",
  COD = "cod",
  BANKTRANSFER = "bank_transfer",
  UNLIMINT = "Unlimint",
  CARDPAY = "cardpay",
  SOFORT = "Sofort",
  KLARNA = "Klarna",
  AFTERPAY = "Afterpay",
  BRAINTREE = "Braintree",
  PAYPALPRO = "paypal-pro",
}

export enum PaymentGatewayCode {
  Paypal = "paypal-express",
  Stripe = "stripe",
  ShopBase = "shopbase",
  PlatForm = "platform",
  PaypalPro = "paypal-pro",
  Braintree = "braintree",
  CheckoutCom = "checkout-com",
  Cardpay = "cardpay",
  Integrated = "integrated",
  COD = "cod",
  BankTransfer = "bank_transfer",
  Reseller = "reseller",
  Base = "base",
  NewGateway = "new-gateway",
  PortOne = "port-one",
  Payoneer = "payoneer",
  Test = "test-gateway",
  AsiaBlii = "asia-bill",
  OceanPayment = "ocean-payment-1",
}

export class PaymentProviders {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  dataStripeAcountDefault = {
    code: "stripe",
    provider_options: {
      public_key:
        "pk_test_51H0MEvDrQ1c0YGaqU7dp7ga3qSBBF8WDJvKq8LVc2kHC9dAYWLhtRoM79nHUGrOAe2xtCkteyKf95OUi6mvVMrjF003BPKJocn",
      secret_key:
        "sk_test_51H0MEvDrQ1c0YGaqvcoK99JXsl3cizVLw2rwkd224I2ljBzryJ3EAXldQKS7VDatwFk6JvNDwXM3wnvJJmGuVE6n00MqLP1opC",
      api_key: true,
      enable_sub_payment_method: false,
      enable_pay_now_pay_later_method: false,
    },
    title: `Stripe-${Math.floor(Date.now() / 1000)}`,
  };

  dataStripeEUAccountDefault = {
    code: "stripe",
    provider_options: {
      public_key:
        "pk_test_51H0MEvDrQ1c0YGaqU7dp7ga3qSBBF8WDJvKq8LVc2kHC9dAYWLhtRoM79nHUGrOAe2xtCkteyKf95OUi6mvVMrjF003BPKJocn",
      secret_key:
        "sk_test_51H0MEvDrQ1c0YGaqvcoK99JXsl3cizVLw2rwkd224I2ljBzryJ3EAXldQKS7VDatwFk6JvNDwXM3wnvJJmGuVE6n00MqLP1opC",
      api_key: true,
      enable_sub_payment_method: true,
      merchant_account_country: "GB",
      payment_method_types: ["bancontact", "giropay", "sofort", "sepa_debit", "ideal"],
      enable_pay_now_pay_later_method: false,
    },
    title: `Stripe-${Math.floor(Date.now() / 1000)}`,
  };

  dataStripeBNPLAccountDefault = {
    code: "stripe",
    provider_options: {
      public_key:
        "pk_test_51H0MEvDrQ1c0YGaqU7dp7ga3qSBBF8WDJvKq8LVc2kHC9dAYWLhtRoM79nHUGrOAe2xtCkteyKf95OUi6mvVMrjF003BPKJocn",
      secret_key:
        "sk_test_51H0MEvDrQ1c0YGaqvcoK99JXsl3cizVLw2rwkd224I2ljBzryJ3EAXldQKS7VDatwFk6JvNDwXM3wnvJJmGuVE6n00MqLP1opC",
      api_key: true,
      enable_sub_payment_method: true,
      merchant_account_country: "GB",
      payment_method_types: ["klarna", "afterpay_clearpay"],
      enable_pay_now_pay_later_method: true,
    },
    title: `Stripe-${Math.floor(Date.now() / 1000)}`,
  };

  dataPayPalAccountDefault = {
    code: "paypal-express",
    provider_options: {
      client_id: "AfL2WyCQuIis451KPSSrSIgAAfFyiqFDgz5FPYAk4N8som1mrPVlgtK4CFZamgA8UP9GQzFfOGW6ELoP",
      client_secret: "EOU0iGeg1J7DEzcD9tVYBzjLD7ia_tWSQ9g9Ia-E-nK5DGenuZwXGJAtEGOY7m6pwgDD95uV0bGJGaCW",
      disable_update_tracking: true,
      enable_smart_button: true,
      sandbox: true,
    },
    title: `PayPal-${Math.floor(Date.now() / 1000)}`,
  };

  dataOceanPaymentAccountDefault = {
    code: "oceanpay-1",
    provider_options: {
      secure: "12345678",
      sandbox: false,
      account: "150260",
      terminal: "15026001",
    },
    active: true,
    title: `Ocean-payment-${Math.floor(Date.now() / 1000)}`,
  };

  dataCODDefault = {
    code: "cod",
    active: true,
    provider_options: {
      additional_details: "",
      sandbox: true,
    },
    extra_fee: {
      active: false,
      type: "fixed_amount",
      value: 0,
      name: "",
    },
    title: `Cash on Delivery - ${Math.floor(Date.now() / 1000)}`,
  };

  dataBankTransferDefautl = {
    code: "bank_transfer",
    active: true,
    provider_options: {
      additional_details: "",
      sandbox: true,
    },
    title: `Bank Transfer - ${Math.floor(Date.now() / 1000)}`,
  };

  dataPayPalProAccountDefautl = {
    code: "paypal-pro",
    provider_options: {
      partner: "paypal",
      vendor: "haduong",
      user: "tuyetle",
      pwd: "Cpay123@",
      sandbox: true,
    },
    active: true,
    title: `PayPal Pro-${Math.floor(Date.now() / 1000)}`,
  };

  dataUnlimintAccountDefault = {
    code: "cardpay",
    provider_options: {
      terminal_code: "23921",
      terminal_password: "Y9D5Ro7pgbI8",
      callback_secret: "64kzmQR0c9IG",
      sandbox: true,
      statement_descriptor: {
        name: "",
      },
    },
    active: true,
    title: `Unlimint-${Math.floor(Date.now() / 1000)}`,
  };

  dataCheckoutDotComAccountDefault = {
    code: "checkout-com",
    provider_options: {
      public_key: "pk_test_87488bcc-5023-402b-b363-c3962453987c",
      secret_key: "sk_test_d5989751-9342-4abc-99f0-0ef483eb9fb8",
      sandbox: true,
      statement_descriptor: {
        name: "Hanoi",
        city: "Hanoi",
      },
      threeDs_enabled: false,
    },
    active: true,
    title: `Checkout.com-${Math.floor(Date.now() / 1000)}`,
  };

  dataAsiaBillAccountDefautl = {
    code: "asia-bill",
    provider_options: {
      signKey: "12345678",
      sandbox: true,
      merNo: "12318",
      gatewayNo: "12318002",
    },
    active: true,
    title: `AsiaBill-1${Math.floor(Date.now() / 1000)}`,
  };

  dataPaypalSettingDefault = {
    brand_name: "Shopbase",
    is_enable_paypal_smart_button: false,
    is_enable_tracking: true,
    enabled_order_info: ["product_name", "variant_title", "order_name", "order_id", "tracking_info"],
    enter_payment_info: false,
    is_enable_merchant_print_base_paypal: false,
    enable_paypal_paylater: false,
  };

  dataPaypalSettingEnableSmtBtn = {
    brand_name: "Shopbase",
    is_enable_paypal_smart_button: true,
    is_enable_tracking: true,
    enabled_order_info: ["product_name", "variant_title", "order_name", "order_id", "tracking_info"],
    enter_payment_info: true,
    is_enable_merchant_print_base_paypal: false,
    enable_paypal_paylater: false,
  };

  dataPaypalSettingEnableSmtBtnRedirect = {
    brand_name: "Shopbase",
    is_enable_paypal_smart_button: true,
    is_enable_tracking: true,
    enabled_order_info: ["product_name", "variant_title", "order_name", "order_id", "tracking_info"],
    enter_payment_info: false,
    is_enable_merchant_print_base_paypal: false,
    enable_paypal_paylater: false,
  };

  dataPaypalSettingEnableBNPL = {
    brand_name: "Shopbase",
    is_enable_paypal_smart_button: false,
    is_enable_tracking: true,
    enabled_order_info: ["product_name", "variant_title", "order_name", "order_id", "tracking_info"],
    enter_payment_info: true,
    is_enable_merchant_print_base_paypal: false,
    enable_paypal_paylater: true,
  };

  dataBrainTreeAccountDefault = {
    code: "braintree",
    active: true,
    provider_options: {
      merchant_id: "np5d9fjn7spj3n4q",
      public_key: "fw74yzgnbm9d8pt9",
      secret_key: "80bdebaef6371d49286aad439a1ae9fc",
      sandbox: true,
    },
    title: `Braintree-1${Math.floor(Date.now() / 1000)}`,
  };

  dataPayoneerAccountDefault = {
    code: "payoneer",
    active: true,
    provider_options: {
      sandbox: true,
      api_token: "h6i00c3huicgqtl5g754bq86t752v2fbndg0f6kd",
      api_user_name: "MRS_67983696",
      store_code: "2586",
    },
    title: `Payoneer${Math.floor(Date.now() / 1000)}`,
  };
  /**
   * Xóa account payment theo id
   * @param idAccount
   */
  async deletePaymentProvider(idAccount: number) {
    const res = await this.request.delete(`https://${this.domain}/admin/payments/${idAccount}.json`, {
      data: {
        id: idAccount,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Remove all payment method except Shopbase Payment (Spayv2/ SMP)
   */
  async removeAllPaymentMethod() {
    const res = await this.request.get(`https://${this.domain}/admin/payments.json?no_limit=true`);
    expect(res.status()).toBe(200);
    const paymentMethods = (await res.json()).payment_methods;
    for (const method of paymentMethods) {
      if (method.code !== "shopbase") {
        await this.deletePaymentProvider(method.id);
      }
    }
  }

  /**
   * Deactivate all payment method
   * @param ignoreMethods
   */
  async deactivateAllPaymentMethod(ignoreMethods: PaymentGatewayCode[]) {
    const res = await this.request.get(`https://${this.domain}/admin/payments.json?no_limit=true`);
    expect(res.status()).toBe(200);
    const paymentMethods = (await res.json()).payment_methods;
    for (const method of paymentMethods) {
      if (!ignoreMethods.includes(method.code)) await this.changePaymentMethodStatus(method.id, method.code, false);
    }
  }

  /**
   * Change status Shopbase Payment
   */
  async changeShopbasePaymentStatus() {
    const res = await this.request.post(`https://${this.domain}/admin/shopbase_payments/active.json`, {
      data: {},
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Change status Payment rotation
   * @param status status của Payment rotation
   */
  async changePaymentRotationStatus(status: boolean) {
    const res = await this.request.put(
      `https://${this.domain}/admin/payments/payment_setting.json?type=payment_rotation`,
      {
        data: {
          status: status,
        },
      },
    );
    expect(res.status()).toBe(200);
  }

  /**
   * Change status Test gateway
   * @param id
   * @param status status của test gateway
   */
  async changeTestGatewayStatus(id: number, status: boolean) {
    const res = await this.request.put(`https://${this.domain}/admin/payments/${id}/changeStatus.json`, {
      data: {
        id: id,
        status: status,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Add a new payment gateway with a data
   * @param dataBody
   */
  async addANewGatewayWithData(dataBody: DataBodyOfAGateway) {
    const res = await this.request.post(`https://${this.domain}/admin/payments.json`, {
      data: dataBody,
    });
    if (!res.ok()) {
      throw new Error(`Failed add new gateway with data: ${dataBody}`);
    }
  }

  /**
   * get response cua activity log
   */
  async getThe1stLogActivityPayment(): Promise<ActivityLog> {
    const res = await this.request.get(
      `https://${this.domain}/admin/action-progress/activity-logs.json?page=1&topics=payment_provider`,
    );
    const theFirstLog = (await res.json()).list[0];
    return theFirstLog;
  }

  /**
   * get response cua list activity log gan nhat
   */
  async getLogActivityPayment(quantity: number): Promise<Array<ActivityLog>> {
    const res = await this.request.get(
      `https://${this.domain}/admin/action-progress/activity-logs.json?topics=payment_provider&limit=${quantity}`,
    );
    const listLog = (await res.json()).list;
    return listLog;
  }

  /**
   * Create a payment gateway
   * @param paymentMethod name of payment method
   * @param dataBody if null/undefined -> use the data default for each payment method
   */
  async createAPaymentMethod(paymentMethod: PaymentMethod | string, dataBody?: DataBodyOfAGateway) {
    if (!dataBody) {
      switch (paymentMethod) {
        case "Stripe":
          dataBody = this.dataStripeAcountDefault;
          break;
        case PaymentMethod.PAYPALBNPL:
        case PaymentMethod.PAYPALCREDIT:
        case PaymentMethod.PAYPALSMARTBTN:
        case PaymentMethod.PAYPALEXPRESS:
        case PaymentMethod.PAYPAL:
          dataBody = this.dataPayPalAccountDefault;
          break;
        case "Bancontact":
        case "giropay":
        case "iDEAL":
        case "SEPA Direct Debit":
        case "Sofort":
          dataBody = this.dataStripeEUAccountDefault;
          break;
        case "Afterpay":
        case "Klarna":
          dataBody = this.dataStripeBNPLAccountDefault;
          break;
        case "OceanPayment":
          dataBody = this.dataOceanPaymentAccountDefault;
          if (process.env.ENV == "dev") {
            dataBody.code = "oceanpay-1";
          } else {
            dataBody.code = "ocean-payment-1";
          }
          break;
        case "cod":
          dataBody = this.dataCODDefault;
          break;
        case "bank_transfer":
        case "BankTransfer":
          dataBody = this.dataBankTransferDefautl;
          break;
        case "paypal-pro":
          dataBody = this.dataPayPalProAccountDefautl;
          break;
        case "Unlimint":
        case "cardpay":
          dataBody = this.dataUnlimintAccountDefault;
          break;
        case "CheckoutCom":
          dataBody = this.dataCheckoutDotComAccountDefault;
          break;
        case "Asiabill":
          dataBody = this.dataAsiaBillAccountDefautl;
          if (process.env.ENV == "dev") {
            dataBody.code = "asiabill";
          }
          break;
        case "Braintree":
          dataBody = this.dataBrainTreeAccountDefault;
          break;
        case "Payoneer":
          dataBody = this.dataPayoneerAccountDefault;
          break;
      }
    }
    await this.addANewGatewayWithData(dataBody);
  }

  /**
   * This function activates a specific PayPal payment method based on the input parameter such as:
   * + Paypal standard
   * + Paypal smart button
   * + Paypal credit card.
   * @param {PaymentMethod} paymentMethod - A variable of type PaymentMethod, which is an enum that
   * represents different types of PayPal payment methods.
   */
  async activePaypalWithSpecificMethod(paymentMethod: PaymentMethod | string) {
    switch (paymentMethod) {
      case PaymentMethod.PAYPAL_SMART_BTN_REDIRECT:
        // Để hiển thị được PayPal Smart Button cần deactivate các payment method dạng Credit Card
        await this.deactivateAllPaymentMethod([PaymentGatewayCode.Paypal]);
        await this.settingPaypalGateway(this.dataPaypalSettingEnableSmtBtnRedirect);
        break;
      case PaymentMethod.PAYPALCREDIT:
      case PaymentMethod.PAYPALSMARTBTN:
        // Để hiển thị được PayPal Smart Button cần deactivate các payment method dạng Credit Card
        await this.deactivateAllPaymentMethod([PaymentGatewayCode.Paypal]);
        await this.settingPaypalGateway(this.dataPaypalSettingEnableSmtBtn);
        break;
      case PaymentMethod.PAYPALBNPL:
        await this.settingPaypalGateway(this.dataPaypalSettingEnableBNPL);
        break;
      case PaymentMethod.PAYPAL:
        await this.settingPaypalGateway(this.dataPaypalSettingDefault);
        break;
    }
  }

  /**
   * This function sets up the PayPal payment gateway for an e-commerce website.
   * @param {PaypalSetting} dataPaypalSetting - It is an object containing the settings for the PayPal
   * payment gateway.
   */
  async settingPaypalGateway(dataPaypalSetting: PaypalSetting) {
    const res = await this.request.put(`https://${this.domain}/admin/payments/paypal_payment_setting.json`, {
      data: dataPaypalSetting,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Tạo mới account paypal pro
   * @param accountName
   * @param paypalManager
   */
  async addPaypalPro(accountName: string, paypalManager: PaypalManager) {
    const res = await this.request.post(`https://${this.domain}/admin/payments.json`, {
      data: {
        code: "paypal-pro",
        provider_options: {
          partner: paypalManager[0].partner,
          vendor: paypalManager[0].vendor,
          user: paypalManager[0].user,
          pwd: paypalManager[0].password,
          sandbox: true,
          enable_3d_secure: false,
        },
        active: true,
        title: accountName,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Bật tính năng secure payment của cổng thanh toán paypal pro
   * @param idAccount
   * @param paypalManager
   */
  async activateSecurePaymentPayPalPro(accountId: number, paypalManager: PaypalManager) {
    const res = await this.request.put(`https://${this.domain}/admin/payments/${accountId}.json`, {
      data: {
        code: "paypal-pro",
        active: true,
        provider_options: {
          partner: paypalManager.partner,
          vendor: paypalManager.vendor,
          user: paypalManager.user,
          pwd: paypalManager.password,
          enable_3d_secure: true,
          sandbox: true,
          cardinal_api_id: paypalManager.cardinal_api_id,
          cardinal_api_key: paypalManager.cardinal_api_key,
          cardinal_org_unit: paypalManager.cardinal_org_unit,
        },
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Tắt tính năng secure payment của cổng thanh toán paypal pro
   * @param paypalManager
   */
  async deactivateSecurePayment(accountId: number, paypalManager: PaypalManager) {
    const res = await this.request.put(`https://${this.domain}/admin/payments/${accountId}.json`, {
      data: {
        code: "paypal-pro",
        provider_options: {
          partner: paypalManager.partner,
          vendor: paypalManager.vendor,
          user: paypalManager.user,
          pwd: paypalManager.password,
          enable_3d_secure: false,
          sandbox: true,
        },
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Tạo mới account unlimint
   * @param accountName : Tên account unlimint
   * @param infoRegister : Thông tin đăng kí gồm terminal code,terminal password,callback secret
   */
  async createUnlimintAccount(accountName: string, infoRegister: InfoUnlimint) {
    const res = await this.request.post(`https://${this.domain}/admin/payments.json`, {
      data: {
        name: accountName,
        code: "cardpay",
        provider_options: {
          terminal_code: infoRegister.terminal_code,
          terminal_password: infoRegister.terminal_pass,
          callback_secret: infoRegister.callback_secret,
          sandbox: true,
          statement_descriptor: {
            name: "",
          },
        },
        active: true,
        title: accountName,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Update info for payment account
   * @param dataPaymentInfo: data update for payment account
   */
  async updateAccount(dataPaymentInfo: DataBodyOfAGateway) {
    const res = await this.request.put(`https://${this.domain}/admin/payments/${dataPaymentInfo.id}.json`, {
      data: dataPaymentInfo,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Update Submit dispute automatically
   * @param type
   */
  async updateSubmitDispute(type: "manual" | "auto") {
    const res = await this.request.put(`https://${this.domain}/admin/setting/submit-dispute.json`, {
      data: {
        type: type,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Update setting for payment account: stripe + checkout at payment provider page
   */
  async updateSettingPaymentAccount(
    paymentCode: string,
    option: {
      statementDescriptor?: {
        name?: string;
      };
      statusCardholderHidden?: boolean;
    },
  ) {
    const response = await this.request.get(
      `https://${this.domain}/admin/payments/payment_setting.json?type=payment_setting`,
    );
    const resBody = await response.json();
    let settingPaymentBody;
    switch (paymentCode) {
      case "stripe":
        settingPaymentBody = resBody.stripe;
        break;
      case "checkout-com":
        settingPaymentBody = resBody.checkout;
        break;
    }
    if (option.statementDescriptor) {
      settingPaymentBody.statement_descriptor = option.statementDescriptor;
    }
    if (option.statusCardholderHidden != undefined) {
      settingPaymentBody.is_cardholder_name_hidden = option.statusCardholderHidden;
    }

    const res = await this.request.put(
      `https://${this.domain}/admin/payments/payment_setting.json?type=payment_setting`,
      {
        data: settingPaymentBody,
      },
    );
    expect(res.status()).toBe(200);
  }

  /**
   * Update info for payment account
   * @param dataBody: data update for payment account
   */
  async updatePayPalSettingPayment(dataBody: string) {
    const res = await this.request.put(`https://${this.domain}/admin/payments/paypal_payment_setting.json`, {
      data: {
        dataBody: dataBody,
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Add extra fee for Cash on Delivery
   * @param idPayment : is payment method id
   * @param active : is true/false
   * @param extraFee: Information extra fee when activating payment cash on delivery
   */
  async extraPaymentFeeForCOD(idPayment: string, active: boolean, extraFee?: ExtraFee) {
    const res = await this.request.put(`https://${this.domain}/admin/payments/${idPayment}.json`, {
      data: {
        code: "cod",
        extra_fee: {
          active: active,
          type: extraFee.type,
          value: extraFee.value,
          name: extraFee.name,
        },
        provider_options: {},
      },
    });
    expect(res.status()).toBe(200);
  }

  defaultPaypalProInfo = {
    id: 1, // set a default value
    shop_id: 1, // set a default value
    active: true,
    code: "paypal-pro",
    deleted: false,
    extra_fee: null,
    is_dead: false,
    provider_options: {
      partner: "Paypal",
      vendor: "shopbase",
      user: "shopbase",
      pwd: "June1$2020",
      sandbox: true,
      enable_3d_secure: true,
      cardinal_api_id: "5e3d172f031e732e0843a5d4",
      cardinal_api_key: "48172558-6bb5-4b6a-992f-fc3f160191ac",
      cardinal_org_unit: "5e3d172f6bcd0a178c1a8630",
    },
    title: "PayPal Pro-1",
  };

  /**
   * Get payment method id in payment provider page
   * @param gateway name of method payment
   * @returns gateway id
   */
  async getPaymentMethodId(gateway: string): Promise<number> {
    const res = await this.request.get(`https://${this.domain}/admin/payments.json?no_limit=true`);
    expect(res.status()).toBe(200);
    let resBody = await res.json();
    resBody = resBody.payment_methods;
    const gatewayId = resBody.find(({ title }) => title === gateway).id;
    return gatewayId;
  }

  /**
   * Get all payment gateways in payment provider page
   * @returns payments list
   */
  async getAllPaymentGateways() {
    const res = await this.request.get(`https://${this.domain}/admin/payments.json?no_limit=true`);
    const resBody = await res.json();
    expect(res.status()).toBe(200);
    return resBody.payment_methods || [];
  }

  /**
   * Get payment method id in payment provider page
   * @param gateway gateway of method payment
   * @returns gateway body
   */
  async getAPaymentMethodBody(gateway: string): Promise<number> {
    const res = await this.request.get(`https://${this.domain}/admin/payments.json?no_limit=true`);
    expect(res.status()).toBe(200);
    let resBody = await res.json();
    resBody = resBody.payment_methods;
    const gatewayBody = resBody.find(({ code }) => code === gateway);
    return gatewayBody;
  }

  /**
   * update a payment gateway
   * @param gatewayInfo
   */
  async updatePaymentGateway(gatewayInfo: DataBodyOfAGateway): Promise<void> {
    const res = await this.request.put(`https://${this.domain}/admin/payments/${gatewayInfo.id}.json`, {
      data: gatewayInfo,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Update paypal pro info > support for enable/disable 3D secure
   * @param shopId
   * @param is3Ds
   * @param getwayInfo
   */
  async updatePaypalProWith3ds(
    shopId: number,
    gateway: string,
    is3Ds = true,
    gatewayInfo = this.defaultPaypalProInfo,
  ): Promise<void> {
    gatewayInfo.id = await this.getPaymentMethodId(gateway);
    gatewayInfo.provider_options.enable_3d_secure = is3Ds;
    gatewayInfo.shop_id = shopId;
    const res = await this.request.put(`https://${this.domain}/admin/payments/${gatewayInfo.id}.json`, {
      data: gatewayInfo,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Bật Activate payment của cổng thanh toán Stripe đã có từ trước
   * @param accountId: id account stripe
   * @param stripeAccount: data account stripe
   */
  async activatePaymentStripe(accountId: number, stripeAccount: StripeAccount) {
    const res = await this.request.put(`https://${this.domain}/admin/payments/${accountId}.json`, {
      data: {
        active: true,
        code: "stripe",
        provider_options: {
          public_key: stripeAccount.public_key,
          secret_key: stripeAccount.secret_key,
          enable_sub_payment_method: stripeAccount.enable_sub_payment_method,
        },
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * @param id
   * @param code PaymentGatewayCode
   * @param status
   */
  async changePaymentMethodStatus(id: number, code: PaymentGatewayCode, status: boolean) {
    const res = await this.request.put(`https://${this.domain}/admin/payments/${id}/changeStatus.json`, {
      data: {
        id: id,
        code: code,
        active: status,
      },
    });
    expect(res.status()).toBe(200);
  }

  defaultCaptureInfo = {
    exclude_fraud_order: false,
    is_send_mail: false,
    time: 24,
  };
  /**
   * It updates the capture payment settings for the store > Auto capture or Manual capture.
   * @param {CaptureInfo} captureInfo
   */
  async updateCapturePayment(type: "manual" | "auto", captureInfo: CaptureInfo = this.defaultCaptureInfo) {
    captureInfo.type = type;
    const res = await this.request.put(`https://${this.domain}/admin/setting/payment-capture.json`, {
      data: captureInfo,
    });
    expect(res.status()).toBe(200);
  }

  /**
   * Update data risk level in database
   * @param shopId
   * @param userId
   * @param risLevel: risk level you want to update
   * @param riskLevelInfo: info of risk level you want to update
   */
  async updateDataRiskLevel(shopId: number, userId: number, risLevel: string, riskLevelInfo: RiskLevelInfo) {
    const res = await this.request.post(`https://${this.domain}/admin/qc-tools/change-smp-index.json`, {
      data: {
        type: "create_spay_user_risk_level",
        shop_id: shopId,
        data_risk_level: {
          user_id: userId,
          time: Date.now(),
          level: risLevel,
          payload: riskLevelInfo,
        },
      },
    });
    expect(res.status()).toBe(200);
  }
}
