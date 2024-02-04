import { APIRequestContext, expect, Page } from "@playwright/test";
import { calculateTax } from "@utils/checkout";
import { isNull, mergeWith } from "lodash";
import { SBPage } from "@pages/page";

import type {
  AvailableShippingCountries,
  BuyerInfoApi,
  Card,
  CartBody,
  CheckoutInfo,
  CheckoutPaymentMethodInfo,
  Product,
  ShippingAddressApi,
  ShippingMethod,
  Tax,
  Tip,
  TippingInfo,
  ExcludeData,
  DataGetLogEslatic,
} from "@types";
import { roundingTwoDecimalPlaces } from "@core/utils/string";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import { waitTimeout } from "@core/utils/api";
import { request } from "playwright-extra";

export enum Section {
  checkout_layout_and_user_interface = "checkout-layout-and-user-interface",
  checkout_account_and_forms = "checkout-account-and-forms",
  checkout_legal_and_payments = "checkout-legal-and-payments",
}
export class CheckoutAPI {
  page: Page;
  sbPage: SBPage;
  domain: string;
  request: APIRequestContext;
  cartToken: string;
  checkoutToken: string;
  shippingMethod = {};
  publicKey: string;
  gatewayCode: string;
  paymentType: string;
  stripePaymentMethodId: number;
  checkoutPaymentMethodId: number;
  connectedAccount: string;
  spayToken: string;
  orderId: number;
  orderName: string;
  totalTax = 0;
  totalTaxShipping = 0;

  constructor(domain: string, request?: APIRequestContext, page?: Page, checkoutToken?: string) {
    this.page = page;
    this.domain = domain;
    this.request = request;
    this.checkoutToken = checkoutToken;
    this.sbPage = new SBPage(this.page, this.domain);
  }

  xpathFooterSF = "//div[@class='main__footer' or @class='checkout-footer--wb']";

  defaultCustomerInfo = {
    emailBuyer: `tester${Math.floor(Date.now() / 1000)}@maildrop.cc`,
    shippingAddress: {
      address1: "10800 W Pico Blvd Suite 312",
      address2: "OCG",
      city: "Los Angeles",
      company: "OCG",
      country_code: "US",
      first_name: "Tester",
      last_name: Date.now().toString(),
      phone: "2064646354",
      province: "California",
      province_code: "CA",
      zip: "90401",
    },
  } as BuyerInfoApi;
  defaultCardInfo = {
    number: "4111111111111111",
    holder_name: "Shopbase",
    expire_date: "12 / 24",
    cvv: "100",
  };

  /**
   * Create an order checkout via Stripe/Spay/SMP, support rotation payment.
   * @param infos Informations for this order, required only "productsCheckout".
   *              If user uses default shipping info, the store must have shipping method to US
   * @returns All information of order.
   */
  async createAnOrderWithCreditCard(infos: {
    productsCheckout: Array<Product>;
    customerInfo?: {
      emailBuyer?: string;
      shippingAddress?: ShippingAddressApi;
    };
    shippingMethodName?: string;
    cardInfo?: Card;
    discount?: string;
    tipping?: Tip;
    postPurchase?: {
      productPpc?: Product;
      uSellId?: number;
    };
    paymentType?: "stripe" | "spay" | undefined;
    isMultipleShipping?: boolean;
  }): Promise<CheckoutInfo> {
    // Add products to cart
    await this.addProductToCartThenCheckout(infos.productsCheckout);

    // Input customer info
    if (!infos.customerInfo) {
      infos.customerInfo = this.defaultCustomerInfo;
    }

    await this.updateCustomerInformation(infos.customerInfo.emailBuyer, infos.customerInfo.shippingAddress);

    // Select shipping method
    if (infos.isMultipleShipping && infos.shippingMethodName) {
      await this.selectShippingMethodByShippingGroupName(
        infos.customerInfo.shippingAddress.country_code,
        infos.shippingMethodName,
      );
    } else {
      if (infos.shippingMethodName) {
        await this.selectShippingMethodByName(
          infos.customerInfo.shippingAddress.country_code,
          infos.shippingMethodName,
        );
      } else {
        await this.selectDefaultShippingMethod(infos.customerInfo.shippingAddress.country_code);
      }
    }

    // Complete Order
    if (!infos.cardInfo) {
      infos.cardInfo = this.defaultCardInfo;
    }
    if (infos.discount) {
      await this.applyDiscountByApi(infos.discount);
    }
    if (infos.tipping) {
      await this.addTipping(infos.tipping);
    }
    if (infos.postPurchase) {
      // Order haves PPC
      await this.activatePostPurchase();
      await this.authorizedThenCreateStripeOrder(infos.cardInfo, infos.paymentType);
      await this.addPostPurchaseToCart(infos.postPurchase.productPpc, infos.postPurchase.uSellId);
    } else {
      // Order doesn't have PPC
      await this.authorizedThenCreateStripeOrder(infos.cardInfo, infos.paymentType);
    }

    // Return checkout info
    return await this.getCheckoutInfo();
  }

  /**
   * creat an empty cart to generate new cart token, checkout token
   */
  async createCart() {
    const res = await this.request.post(`https://${this.domain}/api/checkout/next/cart.json`);
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    const resBody = await res.json();

    this.cartToken = resBody.result.token;
    this.checkoutToken = resBody.result.checkout_token;

    return {
      token: this.cartToken,
      checkout_token: this.checkoutToken,
    };
  }

  /**
   * open checkout page, then wait for CO page render completely
   * @param byPass404Error: auto reload page if catch 404 error. Sometime issue happened and disturb our sleep
   */
  async openCheckoutPageByToken(byPass404Error = false): Promise<SFCheckout> {
    await this.page.goto(`https://${this.domain}/checkouts/${this.checkoutToken}`);

    try {
      await this.sbPage.waitForCheckoutPageCompleteRender();
    } catch (e) {
      if (byPass404Error) {
        const xpath404Page = "(//h2[normalize-space()='Page not found'])[1]";
        const is404PageDisplayed = await this.page.isVisible(xpath404Page); // Sometimes it redirect to 404 page
        if (is404PageDisplayed) {
          await this.page.reload();
          await this.sbPage.waitForCheckoutPageCompleteRender();
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
    return new SFCheckout(this.page, this.domain);
  }

  /**
   * Allow to add multiple products to cart by call the update cart API multiple times
   * Step:
   * 1. Create an empty cart
   * 2. Add product to cart
   * 3. Fetch checkout info
   */
  async addProductToCartThenCheckout(products: Array<Product>) {
    await this.createCart();

    for (const product of products) {
      const res = await this.request.put(`https://${this.domain}/api/checkout/next/cart.json`, {
        data: {
          cartItem: {
            variant_id: product.variant_id,
            qty: product.quantity,
            properties: [],
          },
          from: "add-to-cart",
        },
        params: { cart_token: this.cartToken },
      });
      if (!res.ok()) {
        return Promise.reject(
          `Error when add Product ${product.variant_id} to cart.
          Error message: ${(await res.json()).error} ${new Error().stack}`,
        );
      }
    }
    await this.getCheckoutInfo();
  }

  /**
   * The function adds a bundle of products to the cart and retrieves the checkout information.
   * @param products
   * @param {number} uSellId
   */
  async addBundleToCart(products: Array<Product>, uSellId: number) {
    for (const product of products) {
      const res = await this.request.put(`https://${this.domain}/api/checkout/next/cart/adds.json?`, {
        data: {
          cartItems: {
            variant_id: product.variant_id,
            qty: product.quantity,
            properties: [],
          },
          metadata: {
            usell: {
              id: uSellId,
              source: 0,
            },
          },
          from: "bundle",
          source: "usell",
        },
        params: { cart_token: this.cartToken },
      });
      if (!res.ok()) {
        return Promise.reject(
          `Error when add Product ${product.variant_id} to cart.
          Error message: ${(await res.json()).error} ${new Error().stack}`,
        );
      }
    }
    await this.getCheckoutInfo();
  }

  /**
   * The function adds pre-purchased products to the cart and retrieves the checkout information.
   * @param products
   * @param {number} uSellId
   */
  async addPrePurchaseToCart(products: Array<Product>, uSellId: number) {
    for (const product of products) {
      const res = await this.request.put(`https://${this.domain}/api/checkout/next/cart.json?`, {
        data: {
          cartItems: {
            variant_id: product.variant_id,
            qty: product.quantity,
            properties: [],
          },
          metadata: {
            usell: {
              id: uSellId,
              source: 0,
            },
          },
          from: "pre-purchase",
          source: "usell",
        },
        params: { cart_token: this.cartToken },
      });
      if (!res.ok()) {
        return Promise.reject(
          `Error when add Product ${product.variant_id} to cart.
          Error message: ${(await res.json()).error} ${new Error().stack}`,
        );
      }
    }
    await this.getCheckoutInfo();
  }

  /**
   * This function adds products from the cart to the checkout and updates the checkout information.
   * @param products
   * @param {number} uSellId
   */
  async addOffertInCartToCart(products: Array<Product>, uSellId: number) {
    for (const product of products) {
      const res = await this.request.put(`https://${this.domain}/api/checkout/next/cart.json?`, {
        data: {
          cartItems: {
            variant_id: product.variant_id,
            qty: product.quantity,
            properties: [],
          },
          metadata: {
            usell: {
              id: uSellId,
              source: 0,
            },
          },
          from: "in-cart",
          source: "usell",
        },
        params: { cart_token: this.cartToken },
      });
      if (!res.ok()) {
        return Promise.reject(
          `Error when add Product ${product.variant_id} to cart.
          Error message: ${(await res.json()).error} ${new Error().stack}`,
        );
      }
    }
    await this.getCheckoutInfo();
  }

  /**
   *
   * @returns checkout information on checkout page
   */
  async getCheckoutInfo(): Promise<CheckoutInfo> {
    let res;
    // retry get checkout info
    for (let i = 0; i < 3; i++) {
      res = await this.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/info.json`);
      if (res.ok()) {
        break;
      }
    }
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    const resBody = await res.json();
    return resBody.result;
  }

  /**
   * get checkout info by api util global market is existed
   * @returns CheckoutInfo
   */
  async getCheckoutInfoWithGlobalMarket(retries = 5): Promise<CheckoutInfo> {
    let res: CheckoutInfo;
    for (let i = 0; i < retries; i++) {
      res = await this.getCheckoutInfo();
      if (res && res.info.extra_data?.global_market) {
        return res;
      }
      await this.page.waitForTimeout(1000);
    }
    return res;
  }

  /**
   * get checkout info by api util order is existed
   * @return CheckoutInfo
   */
  async getCheckoutInfoUtilExistOrder(retries = 5): Promise<CheckoutInfo> {
    let res: CheckoutInfo;
    for (let i = 0; i < retries; i++) {
      res = await this.getCheckoutInfo();
      if (res && res.order?.id) {
        return res;
      }
      await this.page.waitForTimeout(1000);
    }
    return res;
  }

  /**
   * Allow to add multiple products to cart by call the update cart API multiple times for New Ecom
   * @param products
   */
  async createCheckoutByAPIvsNE(products: Array<Product>) {
    await this.createCart();

    for (const product of products) {
      const res = await this.request.put(`https://${this.domain}/api/checkout/next/cart.json`, {
        data: {
          cartItem: {
            variant_id: product.variant_id,
            qty: product.quantity,
            properties: [],
          },
          from: "add-to-cart",
        },
        params: { cart_token: this.cartToken },
      });
      if (!res.ok()) {
        return Promise.reject(
          `Error when add Product ${product.variant_id} to cart.
          Error message: ${(await res.json()).error} ${new Error().stack}`,
        );
      }
    }
    await this.getCheckoutInfoNewEcomFullData();
  }

  /**
   * Get checkout info for New Ecom
   */
  async getCheckoutInfoNewEcom(): Promise<CheckoutInfo> {
    const res = await this.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/next.json`);
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    const resBody = await res.json();
    return resBody.result;
  }

  /**
   * Get checkout info totals for New Ecom
   */
  async getCheckoutInfoNewEcomTotals(): Promise<CheckoutInfo> {
    const res = await this.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/total.json`);
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    const resBody = await res.json();
    return resBody.result;
  }

  /**
   * Get checkout info items for New Ecom
   */
  async getCheckoutInfoNewEcomItems(): Promise<CheckoutInfo> {
    const res = await this.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/items.json`);
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    const resBody = await res.json();
    return resBody.result;
  }

  /**
   * Get checkout info for New Ecom with full data, equivalent to getCheckoutInfo()
   */
  async getCheckoutInfoNewEcomFullData(): Promise<CheckoutInfo> {
    const info = await this.getCheckoutInfoNewEcom();
    const [totals, items] = await Promise.all([
      this.getCheckoutInfoNewEcomTotals(),
      this.getCheckoutInfoNewEcomItems(),
    ]);

    return mergeWith(info, totals, items, (o, s) => (isNull(s) ? o : s));
  }

  /**
   * update customer information for the checkout
   * @param email
   * @param shippingAddress
   * @returns
   */
  async updateCustomerInformation(
    email = this.defaultCustomerInfo.emailBuyer,
    shippingAddress = this.defaultCustomerInfo.shippingAddress,
  ) {
    const res = await this.request.put(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/customer-and-shipping.json`,
      {
        data: {
          email: email,
          shipping_address: shippingAddress,
        },
      },
    );
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    const resBody = await res.json();
    return resBody.result;
  }

  /**
   * return all available shipping methods, then pick the first shipping method to set default
   */
  async getShippingMethodInfo(countryCode?: string, provinceCode?: string): Promise<Array<ShippingMethod>> {
    // Set countryCode to null if it's not defined
    const countryCodeQueryParam = countryCode ? `country_code=${countryCode}` : "";

    // Build the URL based on the presence of the state
    const url = `https://${this.domain}/api/checkout/${
      this.checkoutToken
    }/shipping-methods.json?${countryCodeQueryParam}${provinceCode ? `&province_code=${provinceCode}` : ""}`;

    // Make the request
    const res = await this.request.get(url);

    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    const resBody = await res.json();
    if (resBody.result?.length) {
      // pick the first shipping method to set default
      this.shippingMethod = {
        method_code: resBody.result[0].method_code,
        shipping_rule_id: resBody.result[0].shipping_rule_id,
        shipping_rule_type: resBody.result[0].shipping_rule_type,
        shipping_group_code: resBody.result[0].method_code,
        shipping_include_insurance: false,
      };
    }
    return resBody.result;
  }

  /**
   *
   * @param products
   * @param email
   * @param shippingAddress
   * @returns all available shipping methods, then pick the first shipping method to set default
   */
  async getShippingMethodOfCheckout(
    products: Array<Product>,
    email = this.defaultCustomerInfo.emailBuyer,
    shippingAddress = this.defaultCustomerInfo.shippingAddress,
  ): Promise<Array<ShippingMethod>> {
    await this.addProductToCartThenCheckout(products);
    await this.updateCustomerInformation(email, shippingAddress);
    return await this.getShippingMethodInfo(shippingAddress.country_code, shippingAddress.province_code);
  }

  /**
   * get shipping info including method_code, shipping_rule_id, shipping_rule_type by specific shipping rate name
   * @param rateName = shipping rate displayed at checkout page
   */
  async getShippingInfoByRateName(rateName: string, countryCode: string) {
    const res = await this.request.get(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/shipping-methods.json?country_code=${countryCode}`,
    );
    expect(res.status()).toBe(200);
    const resBody = await res.json();

    // eslint-disable-next-line camelcase
    const shippingMethod = resBody.result.find(({ method_title }) => method_title === `${rateName}`);
    this.shippingMethod = {
      method_code: shippingMethod ? shippingMethod.method_code : "",
      shipping_rule_id: shippingMethod ? shippingMethod.shipping_rule_id : "",
      shipping_rule_type: shippingMethod ? shippingMethod.shipping_rule_type : "",
      shipping_group_code: shippingMethod ? shippingMethod.shipping_group_code : "",
    };
  }

  /**
   * select default shipping method
   * @param countryCode
   */
  async selectDefaultShippingMethod(countryCode: string) {
    await this.getShippingMethodInfo(countryCode);

    const res = await this.request.put(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/shipping-methods.json?country_code=${countryCode}`,
      {
        data: {
          shipping_method: this.shippingMethod,
        },
      },
    );
    expect(res.status()).toBe(200);
  }

  /**
   * select shipping method by shipping method title (name of the shipping method)
   * @param countryCode
   * @param methodTitle
   * @returns
   */
  async selectShippingMethodByName(countryCode: string, methodTitle: string) {
    await this.getShippingInfoByRateName(methodTitle, countryCode);

    const res = await this.request.put(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/shipping-methods.json?country_code=${countryCode}`,
      {
        data: {
          shipping_method: this.shippingMethod,
        },
      },
    );
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
  }

  /**
   * Add product to cart then go to checkout, input shipping address then select shipping method by name
   * @param productsCheckout
   * @param emailBuyer
   * @param shippingAddress
   * @param shippingMethodName
   * @param applyCoupon
   */
  async addProductThenSelectShippingMethod(
    productsCheckout: Array<Product>,
    emailBuyer = this.defaultCustomerInfo.emailBuyer,
    shippingAddress = this.defaultCustomerInfo.shippingAddress,
    shippingMethodName?: string,
    isApplyCoupon = false,
    applyCoupon?: string,
  ): Promise<BuyerInfoApi> {
    await this.addProductToCartThenCheckout(productsCheckout);
    if (isApplyCoupon || applyCoupon) {
      await this.applyCouponToCart(shippingAddress.country_code, applyCoupon);
    }
    await this.updateCustomerInformation(emailBuyer, shippingAddress);
    if (shippingMethodName) {
      await this.selectShippingMethodByName(shippingAddress.country_code, shippingMethodName);
    } else {
      await this.selectDefaultShippingMethod(shippingAddress.country_code);
    }
    //Return when used the default data if needed
    return { emailBuyer, shippingAddress };
  }

  /**
   * apply coupon to cart. if applyCoupon = null get coupon auto by api
   * @param globalMarket
   * @param applyCoupon
   */
  async applyCouponToCart(globalMarket: string, applyCoupon?: string) {
    let coupon = applyCoupon;
    if (!applyCoupon) {
      coupon = await this.getCouponToCart(globalMarket);
    }
    if (coupon) {
      for (let i = 0; i < 3; i++) {
        const res = await this.request.post(
          `https://${this.domain}/api/checkout/${this.checkoutToken}/apply-coupon.json`,
          {
            data: { code: coupon, source: "" },
          },
        );
        if (res.ok()) {
          break;
        }
      }
    }
  }

  /**
   * get coupon auto for cart
   * @param globalMarket
   */
  async getCouponToCart(globalMarket: string): Promise<string> {
    const options = {};
    if (globalMarket) {
      options["headers"] = {
        "X-Global-Market": globalMarket,
      };
    }
    for (let i = 0; i < 3; i++) {
      const res = await this.request.get(
        `https://${this.domain}/api/offers/discount.json?cart_token=${this.cartToken}`,
        options,
      );
      if (res.ok()) {
        const resBody = await res.json();
        return resBody.discount_code;
      }
    }
    return "";
  }

  /**
   * Add product to cart then go to checkout, input shipping address then select shipping method by name for New Ecom
   * @param productsCheckout
   * @param emailBuyer
   * @param shippingAddress
   * @param shippingMethodName
   */
  async addProductThenSelectShippingMethodWithNE(
    productsCheckout: Array<Product>,
    emailBuyer = this.defaultCustomerInfo.emailBuyer,
    shippingAddress = this.defaultCustomerInfo.shippingAddress,
    shippingMethodName?: string,
  ): Promise<BuyerInfoApi> {
    await this.createCheckoutByAPIvsNE(productsCheckout);
    await this.updateCustomerInformation(emailBuyer, shippingAddress);
    if (shippingMethodName) {
      await this.selectShippingMethodByName(shippingAddress.country_code, shippingMethodName);
    } else {
      await this.selectDefaultShippingMethod(shippingAddress.country_code);
    }
    //Return when used the default data if needed
    return { emailBuyer, shippingAddress };
  }

  /**
   * get global market in cookies
   */
  async getGlobalMarketInCookies(): Promise<string> {
    const cookies = await this.page?.context()?.cookies();
    if (cookies) {
      const cookie = cookies.find(item => item.name === "X-Global-Market");
      return cookie?.value;
    }
    return "";
  }

  /**
   * get payment method code follow paymentType.
   * @param paymentType
   */
  async getPaymentMethodCode(paymentType?: string): Promise<string> {
    const gm = await this.getGlobalMarketInCookies();
    const res = await this.request.get(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/payment-methods.json`,
      {
        params: {
          country_code: gm,
        },
        headers: {
          Cookie: `X-Global-Market=${gm};`,
        },
      },
    );
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    let paymentMethod = {};
    switch (paymentType) {
      case PaymentMethod.OCEAN_PAYMENT:
        paymentMethod = resBody.result.find(({ title }) => title.toLowerCase().includes("oceanpayment"));
        break;
      case PaymentMethod.ASIA_BILL:
        paymentMethod = resBody.result.find(({ title }) => title.toLowerCase().includes("asiabill"));
        break;
      case PaymentMethod.PAYONEER:
        paymentMethod = resBody.result.find(({ title }) => title.toLowerCase().includes("payoneer"));
        break;
      default:
        paymentMethod["code"] = "stripe";
    }
    return paymentMethod ? paymentMethod["code"] : "stripe";
  }

  /**
   * The API returns all activated payment methods, without EU payment methods.
   * then filter Stripe account info by gateway code = `stripe` | `platform` | `sepa_debit`.
   * @param paymentType default for rotation payment when store activate both stripe and spay.
   *                    user can choose only one type.
   * @param checkoutToken checkout token
   */
  async getPaymentMethodInfo(
    paymentType?:
      | "stripe"
      | "spay"
      | "sepa_debit"
      | "giropay"
      | "sofort"
      | "klarna"
      | "bancontact"
      | "ideal"
      | undefined,
    checkoutToken = this.checkoutToken,
  ) {
    const gm = await this.getGlobalMarketInCookies();
    const option = {};
    if (gm) {
      option["headers"] = {
        "X-Global-Market": gm,
      };
    }

    const res = await this.request.get(
      `https://${this.domain}/api/checkout/${checkoutToken}/payment-methods.json`,
      option,
    );
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    let creditCardMethod;
    switch (paymentType) {
      case "sepa_debit":
        creditCardMethod = resBody.result.find(
          item => item.code === "stripe" && item.provider_options?.payment_method_type === "sepa_debit",
        );
        break;
      case "giropay":
        creditCardMethod = resBody.result.find(
          item => item.code === "stripe" && item.provider_options?.payment_method_type === "giropay",
        );
        break;
      case "sofort":
        creditCardMethod = resBody.result.find(
          item => item.code === "stripe" && item.provider_options?.payment_method_type === "sofort",
        );
        break;
      case "klarna":
        creditCardMethod = resBody.result.find(
          item => item.code === "stripe" && item.provider_options?.payment_method_type === "klarna",
        );
        break;
      case "bancontact":
        creditCardMethod = resBody.result.find(
          item => item.code === "stripe" && item.provider_options?.payment_method_type === "bancontact",
        );
        break;
      case "ideal":
        creditCardMethod = resBody.result.find(
          item => item.code === "stripe" && item.provider_options?.payment_method_type === "ideal",
        );
        break;
      case "stripe":
        creditCardMethod = resBody.result.find(({ code }) => code === "stripe");
        break;
      case "spay":
        creditCardMethod = resBody.result.find(({ code }) => code === "platform");
        this.connectedAccount = creditCardMethod ? creditCardMethod.provider_options.gateway_account_id : "";
        break;
      default:
        creditCardMethod = resBody.result.find(({ title }) => title === "Credit Card");
        if (creditCardMethod.code == "platform") {
          this.connectedAccount = creditCardMethod ? creditCardMethod.provider_options.gateway_account_id : "";
        }
        break;
    }
    this.paymentType = paymentType;
    this.gatewayCode = creditCardMethod ? creditCardMethod.code : "";
    this.publicKey = creditCardMethod ? creditCardMethod.provider_options.public_key : "";
    this.checkoutPaymentMethodId = creditCardMethod ? creditCardMethod.id : "";
    return resBody;
  }

  /**
   * The API returns all activated payment methods, including EU payment methods.
   * Get conntected account id if payment method is Spay/SMP.
   * @param paymentMethodInfo contains checkout token, country code and payment type
   */
  async getEUPaymentMethodInfo(paymentMethodInfo: CheckoutPaymentMethodInfo) {
    const res = await this.request.get(
      `https://${this.domain}/api/checkout/${paymentMethodInfo.checkout_token}/payment-methods.json`,
      {
        params: {
          country_code: paymentMethodInfo.country_code,
        },
        headers: {
          Cookie: `X-Global-Market=${paymentMethodInfo.country_code};`,
        },
      },
    );
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    let paymentMethod;
    switch (paymentMethodInfo.payment_type) {
      case "Sofort":
        paymentMethod = resBody.result.find(({ title }) => title === "Sofort");
        break;
      case "Klarna":
        paymentMethod = resBody.result.find(({ title }) => title === "Klarna");
        break;
      case "Afterpay":
        paymentMethod = resBody.result.find(({ title }) => title === "Afterpay");
        break;
      case "credit-card":
        paymentMethod = resBody.result.find(({ title }) => title === "Credit Card");
        break;
    }
    if (paymentMethod.code == "platform") {
      this.connectedAccount = paymentMethod ? paymentMethod.provider_options.gateway_account_id : "";
    }
    this.gatewayCode = paymentMethod ? paymentMethod.code : "";
    this.publicKey = paymentMethod ? paymentMethod.provider_options.public_key : "";
    this.checkoutPaymentMethodId = paymentMethod ? paymentMethod.id : "";
    return resBody;
  }

  /**
   *
   * @returns the new Spay token
   */
  async createSpayToken(card: Card): Promise<string> {
    const expMonth = card.expire_date.split("/")[0].trim();
    const expYear = card.expire_date.split("/")[1].trim();

    const res = await this.request.post(`https://api.stripe.com/v1/tokens`, {
      form: {
        "card[number]": card.number,
        "card[cvc]": card.cvv,
        "card[exp_month]": expMonth,
        "card[exp_year]": expYear,
        key: this.publicKey,
        _stripe_account: this.connectedAccount,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    this.spayToken = resBody.id;
    return resBody.id;
  }

  /**
   * Creates a PaymentMethod object for Spay/Stripe gateway
   * Stripe docs: https://stripe.com/docs/api/payment_methods/create
   */
  async createStripePaymentMethod(card: Card, buyerInfoApi?: BuyerInfoApi) {
    const expMonth = card.expire_date.split("/")[0].trim();
    const expYear = card.expire_date.split("/")[1].trim();

    let formData;
    let paymentT = this.gatewayCode;
    if (this.paymentType === "sepa_debit") {
      paymentT = this.paymentType;
    }
    switch (paymentT) {
      case "sepa_debit":
        formData = {
          type: "sepa_debit",
          "billing_details[name]": `${buyerInfoApi.shippingAddress.first_name} ${buyerInfoApi.shippingAddress.last_name}`,
          "billing_details[email]": buyerInfoApi.emailBuyer,
          "billing_details[address][city]": buyerInfoApi.shippingAddress.city,
          "billing_details[address][country]": buyerInfoApi.shippingAddress.country_code,
          "billing_details[address][line1]": buyerInfoApi.shippingAddress.address1,
          "billing_details[address][line2]": buyerInfoApi.shippingAddress.address2,
          "billing_details[address][postal_code]": buyerInfoApi.shippingAddress.zip,
          "billing_details[phone]": buyerInfoApi.shippingAddress.phone,
          "metadata[checkout_token]": this.checkoutToken,
          "sepa_debit[iban]": card.sepa_card.replaceAll(" ", ""),
          key: this.publicKey,
        };
        break;
      case "stripe":
        formData = {
          type: "card",
          "card[number]": card.number,
          "card[cvc]": card.cvv,
          "card[exp_month]": expMonth,
          "card[exp_year]": expYear,
          key: this.publicKey,
        };
        break;
      case "platform":
        formData = {
          type: "card",
          "card[number]": card.number,
          "card[cvc]": card.cvv,
          "card[exp_month]": expMonth,
          "card[exp_year]": expYear,
          key: this.publicKey,
          _stripe_account: this.connectedAccount,
        };
        break;
    }

    const res = await this.request.post(`https://api.stripe.com/v1/payment_methods`, {
      form: formData,
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    this.stripePaymentMethodId = await resBody.id;
  }

  /**
   * The API create an order with payment status = `Authorized`
   */
  async authorizedOrder(ignoreCreateOrder?: boolean) {
    let bodyData;
    let gatewayCode = this.gatewayCode;
    if (this.paymentType === "sepa_debit") {
      gatewayCode = this.paymentType;
    }
    switch (gatewayCode) {
      case "sepa_debit":
        bodyData = {
          is_using_same_address: true,
          payment_method: this.gatewayCode,
          payment_method_id: this.checkoutPaymentMethodId,
          provider_payload: {
            payment_method_type: "sepa_debit",
            payment_method_id: this.stripePaymentMethodId,
          },
        };
        break;
      case "stripe":
        bodyData = {
          payment_method: this.gatewayCode,
          provider_payload: {
            token: "tok_visa",
            payment_method_id: this.stripePaymentMethodId,
          },
        };
        break;
      case "platform":
        bodyData = {
          payment_method: this.gatewayCode,
          payment_method_id: this.checkoutPaymentMethodId,
          gateway: "stripe",
          provider_payload: {
            payment_method_type: "credit-card",
            payment_method_id: this.stripePaymentMethodId,
            token: this.spayToken,
          },
        };
        break;
    }
    const gm = await this.getGlobalMarketInCookies();
    let url = `https://${this.domain}/api/checkout/${this.checkoutToken}/charge-authorize.json`;
    if (ignoreCreateOrder) {
      url = `${url}?is_ignore_create_order=${ignoreCreateOrder}`;
    }
    const res = await this.request.post(url, {
      data: bodyData,
      headers: {
        "X-Global-Market": gm,
      },
    });
    if (!res.ok()) {
      return Promise.reject(
        `Error message: ${(await res.json()).error} \n bodyData = ${bodyData} \n${new Error().stack}`,
      );
    }
  }

  /**
   * @deprecated because the new payment mechanism Jul2023,
   * this API is no longer available
   * Capture an order with billing address same as shipping address
   * Update payment status's order from `Authorized` to `Paid`
   * - billing_address always null
   * - is_using_same_address always true
   * - payment_method correspondingly gateway code,
   *   + payment_method = `stripe` for Stripe gateway
   *   + payment_method = `platform` for Spay gateway
   */
  async createOrder() {
    await this.request.post(`https://${this.domain}/api/checkout/${this.checkoutToken}/create-order.json`, {
      data: {
        billing_address: null,
        is_using_same_address: true,
        payment_method: this.gatewayCode,
      },
    });
  }

  async applyDiscount(code: string) {
    if (code) {
      const res = await this.request.post(
        `https://${this.domain}/api/checkout/${this.checkoutToken}/apply-coupon.json`,
        {
          data: {
            code: `${code}`,
            source: "",
          },
        },
      );
      expect(res.status()).toBe(200);
    }
  }

  /**
   *
   * @param card
   * @param paymentType default for rotation payment when store activate both stripe and spay.
   *                    user can choose only one type.
   */
  async authorizedThenCreateStripeOrder(card: Card, paymentType?: "stripe" | "spay" | undefined) {
    await this.getPaymentMethodInfo(paymentType);
    if (this.gatewayCode == "platform") {
      await this.createSpayToken(card);
    }
    await this.createStripePaymentMethod(card);
    await this.authorizedOrder();
    await this.createOrder();
  }

  /**
   * call api charge_authorize with ignore create order
   * @param card
   * @param buyerInfoApi
   * @param paymentType
   */
  async chargeAuthorizedIgnoreCreateOrder(
    card: Card,
    buyerInfoApi?: BuyerInfoApi,
    paymentType?: "stripe" | "spay" | "sepa_debit" | undefined,
  ) {
    await this.getPaymentMethodInfo(paymentType);
    if (this.gatewayCode == "platform") {
      await this.createSpayToken(card);
    }
    await this.createStripePaymentMethod(card, buyerInfoApi);
    await this.authorizedOrder(true);
  }

  async getOrderId() {
    const res = await this.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/info.json`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return (this.orderId = await resBody.result.order.id);
  }

  /**
   * get order info on dashboard
   */
  async getOrderInfo(request: APIRequestContext) {
    await this.getOrderId();
    const res = await request.get(`https://${this.domain}/admin/orders/${this.orderId}.json`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return {
      id: resBody.order.id,
      subtotal: resBody.order.subtotal_price,
      total: resBody.order.total_price,
      shipping_fee: resBody.order.shipping_lines[0].price,
      discount: resBody.order.total_discounts,
      financial_status: resBody.order.financial_status,
      name: resBody.order.name,
    };
  }

  /**
   * this API must be called before authorized order to add PPC to order
   * @returns
   */
  async activatePostPurchase() {
    const res = await this.request.post(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/activate-post-purchase.json`,
    );
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
  }

  /**
   * complete order after add PPC
   * @returns
   */
  async finalizePostPurchase() {
    const res = await this.request.post(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/finalize-post-purchase.json`,
      {
        data: {
          source: "sdk-post-purchase",
        },
      },
    );
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
  }

  /**
   * add post purchase to card then complete order with post purchase
   * @param product
   * @param uSellId
   * @returns
   */
  async addPostPurchaseToCart(product: Product, uSellId: number) {
    const res = await this.request.put(
      `https://${this.domain}/api/checkout/next/cart.json?cart_token=${this.cartToken}&post_purchase=true`,
      {
        data: {
          cartItem: {
            variant_id: product.variant_id,
            qty: product.quantity,
            post_purchase_price: product.post_purchase_price,
            properties: [],
            metadata: {
              usell: {
                id: uSellId,
                source: 0,
              },
            },
          },
          source: "usell",
          from: "post-purchase",
        },
      },
    );
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    await this.finalizePostPurchase();
  }

  /**
   * get shipping method of order after complete order
   * @returns
   */
  async getShippingInfoAfterCompleteOrder(): Promise<ShippingMethod> {
    const checkoutInfo = await this.getCheckoutInfo();
    const shippingInfo: ShippingMethod = {
      method_title: checkoutInfo.info.shipping_method.method_title,
      amount: checkoutInfo.totals.shipping_fee,
      min_only_shipping_time: checkoutInfo.info.shipping_method.min_only_shipping_time_estimated_by_day,
      max_only_shipping_time: checkoutInfo.info.shipping_method.max_only_shipping_time_estimated_by_day,
    };
    return shippingInfo;
  }

  /**
   * Get price of each line item by variant id
   * @param variantID
   * @returns line item price
   */
  async getItemPriceByID(variantID: number) {
    const res = await this.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/info.json`);
    expect(res.status()).toBe(200);

    const resBody = await res.json();
    const productList = resBody.result.totals.items;

    // eslint-disable-next-line camelcase
    const itemInfo = productList.find(({ variant_id }) => variant_id === variantID);
    const itemPrice = itemInfo.line_item_price;
    const itemPriceAfterDiscount = itemInfo.total_line_with_discount_price;
    return {
      item_price: itemPrice,
      item_price_after_discount: itemPriceAfterDiscount,
    };
  }

  /**
   * Get price of each line item by variant id
   * @param variantID
   * @returns line item price
   */
  async getItemPriceByVariant(variant: string) {
    const res = await this.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/info.json`);
    expect(res.status()).toBe(200);

    const resBody = await res.json();
    const productList = resBody.result.totals.items;

    // eslint-disable-next-line camelcase
    const itemPrice = productList.find(({ variant_title }) => variant_title === variant).total_line_with_discount_price;
    return itemPrice;
  }

  /**
   * Calculate tax for shipping
   * @param taxShipping
   * @returns total tax shipping amount
   */
  async calculateTaxShipping(taxShipping: Tax) {
    if (!taxShipping) {
      return this.totalTaxShipping;
    }
    const shippingFee = await this.getShippingFee();
    const taxShippingAmt = calculateTax(taxShipping, shippingFee);
    this.totalTaxShipping = roundingTwoDecimalPlaces(taxShippingAmt - this.totalTaxShipping);
    return this.totalTaxShipping;
  }

  async getShippingFee() {
    const res = await this.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/info.json`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.result.totals.total_shipping;
  }

  /**
   * Get total tax on checkout page
   * @returns total tax amount
   */
  async getTotalTax() {
    const res = await this.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/info.json`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const totalTax = resBody.result.totals.total_tax;
    return totalTax;
  }

  /**
   * Calculate tax by line items and shipping
   * @param products
   * @returns total tax amount
   */
  async calculateTaxByLineItem(products: Array<Product>, taxShipping?: Tax): Promise<number> {
    let taxAmountLineItem, itemPrice: number;
    const taxShippingAmt = await this.calculateTaxShipping(taxShipping);
    this.totalTax = this.totalTax + taxShippingAmt;
    for (const product of products) {
      const taxInfo = product.tax_info;
      if (!taxInfo) {
        continue;
      }
      if (product.variant_id) {
        itemPrice = (await this.getItemPriceByID(product.variant_id)).item_price_after_discount;
      }
      if (product.variant_title) {
        itemPrice = await this.getItemPriceByVariant(product.variant_title);
      }
      taxAmountLineItem = calculateTax(taxInfo, itemPrice);
      this.totalTax = this.totalTax + taxAmountLineItem;
    }
    return roundingTwoDecimalPlaces(this.totalTax);
  }

  /**
   * Calculate tax for item post purchase
   * @param product: product info contains: variant id, quantity, tax info
   * @returns total tax amount
   */
  async calTaxItemPPC(product: Product, taxShipping?: Tax) {
    const taxShippingAmt = await this.calculateTaxShipping(taxShipping);
    this.totalTax = this.totalTax + taxShippingAmt;
    const taxInfo = product.tax_info;
    if (!taxInfo) {
      return this.totalTax;
    }
    const itemPrice = (await this.getItemPriceByID(product.variant_id)).item_price_after_discount;
    const taxAmountLineItem = calculateTax(taxInfo, itemPrice);
    this.totalTax = this.totalTax + taxAmountLineItem;
    return roundingTwoDecimalPlaces(this.totalTax);
  }

  /**
   * Get order id on thankyou page when checkout complete
   * @returns order id number
   */
  async getOrderIDByAPI() {
    const res = await this.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/info.json`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.result.order.id;
  }

  /**
   * Call API apply discount code in checkout page
   * @param discountCode
   */
  async applyDiscountByApi(discountCode: string) {
    const res = await this.request.post(`https://${this.domain}/api/checkout/${this.checkoutToken}/apply-coupon.json`, {
      data: {
        code: discountCode,
        source: "",
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * The `removeAppliedCoupon` removes an applied coupon
   * @param {string} discountCode
   */
  async removeAppliedCoupon(discountCode: string) {
    const res = await this.request.post(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/delete-coupon.json`,
      {
        data: {
          code: discountCode,
          source: "",
        },
      },
    );
    expect(res.status()).toBe(200);
  }

  /**
   * The function applies a discount code to a checkout by making an API request and returns the status
   * of the response, and body data without verify status code.
   * @param {string} discountCode - The discount code that you want to apply to the checkout.
   * @returns The status of the response from the API is being returned.
   */
  async applyDiscountByApiNoExpect(discountCode: string) {
    const res = await this.request.post(`https://${this.domain}/api/checkout/${this.checkoutToken}/apply-coupon.json`, {
      data: {
        code: discountCode,
        source: "",
      },
    });
    const resBody = await res.json();
    return { resBody: resBody, status: res.status() };
  }

  async getPaymentProxyDomain(paymentMethod: string, countryCode?: string) {
    const url = `https://${this.domain}/api/checkout/${this.checkoutToken}/payment-methods.json?country_code=${countryCode}`;
    const res = await this.request.get(url, {
      headers: {
        "X-Global-Market": countryCode,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    return body.result.find(({ title }) => title.toLowerCase() === `${paymentMethod.toLowerCase()}`).provider_options
      .domain;
  }

  /**
   * Select shipping method by shipping group display name when checkout PlusBase
   * @param countryCode is country code of shipping address
   * @param methodTitle is shipping group name displayed at checkout page
   */
  async selectShippingMethodByShippingGroupName(countryCode: string, methodTitle: string) {
    await this.getShippingInfoByShippingGroupName(methodTitle, countryCode);

    const res = await this.request.put(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/shipping-methods.json?country_code=${countryCode}`,
      {
        data: {
          shipping_method: this.shippingMethod,
        },
      },
    );
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
  }

  /**
   * get shipping info including method_code, shipping_rule_id, shipping_rule_type by specific shipping group name
   * @param countryCode is country code of shipping address
   * @param methodTitle is shipping group name displayed at checkout page
   * @param checkoutToken used when verify test script by UI and need to call this api
   * @return shipping method info
   */
  async getShippingInfoByShippingGroupName(
    methodTitle: string,
    countryCode: string,
    checkoutToken?: string,
  ): Promise<ShippingMethod> {
    let shippingFee = 0;
    let originShippingFee = 0;
    if (checkoutToken) {
      this.checkoutToken = checkoutToken;
    }
    const res = await this.request.get(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/shipping-methods.json?country_code=${countryCode}`,
    );
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    // eslint-disable-next-line camelcase
    const shippingMethod = resBody.result.find(({ method_title }) => method_title === `${methodTitle}`);
    for (const shippingRate of shippingMethod.shipping_rates) {
      shippingFee += shippingRate.price;
      originShippingFee += shippingRate.origin_price;
    }
    this.shippingMethod = {
      method_code: shippingMethod ? shippingMethod.method_code : "",
      shipping_rule_id: shippingMethod ? shippingMethod.shipping_rule_id : 0,
      shipping_rule_type: shippingMethod ? shippingMethod.shipping_rule_type : "",
      shipping_group_code: shippingMethod ? shippingMethod.shipping_group_code : "",
      shipping_fee: shippingFee,
      origin_shipping_fee: originShippingFee,
    };
    return shippingMethod;
  }

  /**
   * Allow to add products to cart by call the update cart API
   */
  async addProductCreatorToCart(cartBody: CartBody) {
    await this.createCart();
    const response = await this.request.put(`https://${this.domain}/api/checkout/next/cart.json`, {
      data: cartBody,
      params: { cart_token: this.cartToken },
    });
    const resBody = await response.json();
    const status = await response.status();
    const token = await (await this.createCart()).token;
    if (status === 200) {
      return {
        cart: resBody.result,
        status: status,
        cart_token: token,
      };
    } else {
      return {
        messages: resBody.messages,
        status: status,
      };
    }
  }

  /**
   * Get available shipping countries for checkout
   */
  async getAvailableShippingCountries(): Promise<AvailableShippingCountries> {
    if (!this.checkoutToken) {
      throw new Error("Missing checkout token");
    }

    const res = await this.request.get(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/available-shipping-countries.json`,
    );
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   *
   * @param checkoutToken Complete ppc by checkout token
   */
  async completePurchase(checkoutToken: string) {
    await this.request.post(`https://${this.domain}/api/checkout/purchase-complete.json`, {
      data: {
        checkout_token: checkoutToken,
      },
    });
  }

  /** Adding a tip to the order.
   * @param tippingInfo
   */
  async addTipping(tippingInfo: Tip) {
    const res = await this.request.post(`https://${this.domain}/api/checkout/${this.checkoutToken}/tipping.json`, {
      data: {
        tipping_value: tippingInfo.tipping_value,
        extra_data: {
          tipping_type: tippingInfo.tipping_type,
        },
      },
    });
    expect(res.status()).toEqual(200);
  }

  async getInfoAPIBootstrap() {
    const res = await this.request.get(`https://${this.domain}/api/bootstrap/next.json`);
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   * This function will check the API Bootstrap every second for 20 seconds to see if the tipping settings have
   * been updated.
   * @param {TippingInfo} tippingInfo - TippingInfo: The tipping data in expectation.
   * @param [time=20] - The number of seconds to wait for the change to take effect.
   * @returns if conditions have been satisfied.
   */
  async verifyTippingInBootstrap(tippingInfo: TippingInfo, time = 20) {
    let res, checkoutForm, tipping, enableTipping, tippingOptions, isOldLayoutTipping, isMatchedAllOptions;

    for (let i = 0; i <= time; i++) {
      //Get the tipping settings in API Bootstrap
      res = await this.getInfoAPIBootstrap();

      checkoutForm = res.result.theme.pages.checkout.default;
      tipping = checkoutForm.find(({ type }) => type == Section.checkout_account_and_forms).settings;
      enableTipping = tipping.enable_show_tipping_options;

      if (tippingInfo.percentages) {
        // Check if the tipping options in api boootstrap and tipping options in expectation are the same
        tippingOptions = res.result.checkout_settings.tip.percentages;
        isOldLayoutTipping = tipping.is_old_layout_tipping;
        isMatchedAllOptions = tippingOptions.every((option, index) => option === tippingInfo.percentages[index]);
        if (
          enableTipping === tippingInfo.enabled &&
          isOldLayoutTipping === tippingInfo.is_old_layout &&
          isMatchedAllOptions
        ) {
          return;
        }
        await waitTimeout(1000);
        continue;
      }

      if (!enableTipping && !tippingInfo.enabled) {
        // Check when tipping is not enable
        return;
      }
      await waitTimeout(1000);
    }
  }

  /**
   * get name dashboard by paymentMethod
   * @param paymentMethod
   */
  getNameDashboardPortal(paymentMethod: string) {
    switch (paymentMethod) {
      case PaymentMethod.PAYPAL:
      case PaymentMethod.PAYPALBNPL:
      case PaymentMethod.PAYPALEXPRESS:
      case PaymentMethod.PAYPALSMARTBTN:
      case PaymentMethod.PAYPALCREDIT:
        return "Paypal";
      case PaymentMethod.PAYONEER:
        return "Payoneer";
      case PaymentMethod.BANCONTACT:
      case PaymentMethod.GIROPAY:
      case PaymentMethod.SOFORT:
      case PaymentMethod.AFTERPAY:
      case PaymentMethod.SEPA:
        return "Stripe";
      default:
        return paymentMethod;
    }
  }

  /**
   * Asynchronously fetches excluded variant data for a specific offer, product, country, and shipping method.
   * @param {number} offerId - The ID of the offer.
   * @param {number} sbProductId - The ID of the product.
   * @param {string} countryCode - The country code for which to retrieve excluded variants.
   * @param {string} shippingMethodCode - The shipping method code for the checkout.
   * @returns {Promise<ExcludeData>} - A promise resolving to the excluded variant data.
   */
  async getDataVariantExclude(
    offerId: number,
    sbProductId: number,
    countryCode: string,
    shippingMethodCode: string,
  ): Promise<ExcludeData> {
    const res = await this.request.get(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/excluded-variants.json?offer_id=${offerId}&product_ids=${sbProductId}&country_code=${countryCode}&ignore_completed=true&shipping_method_code=${shippingMethodCode}`,
    );
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   * Get event log on EslaticSearch by event name and session id
   * @param indexEslaticSearch: index on EslaticSearch you want to get log
   * @param event: event name you want to get log
   * @param sessionId: session id
   */
  async getDataOnEslaticSearch(dataGetLogEslatic: DataGetLogEslatic) {
    const context = await request.newContext({
      httpCredentials: { username: dataGetLogEslatic.user_name, password: dataGetLogEslatic.password },
      ignoreHTTPSErrors: true,
    });
    const res = await context.post(`https://${dataGetLogEslatic.ip}/.${dataGetLogEslatic.index_name}*/_search`, {
      data: {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  msg: dataGetLogEslatic.event_name,
                },
              },
              {
                match_phrase: {
                  log: dataGetLogEslatic.session_id,
                },
              },
            ],
          },
        },
      },
    });
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   *Filer log on EslaticSearch by reason
   * @param dataGetLogEslatic: data get log on EslaticSearch
   * @param reason: reason you want to get log
   */
  async getLogOnEslaticSearchByReason(dataGetLogEslatic: DataGetLogEslatic, reason: string) {
    let logsEslaticSearch, log;
    logsEslaticSearch = await this.getDataOnEslaticSearch(dataGetLogEslatic);

    // Get log on EslaticSearch by reason
    logsEslaticSearch = logsEslaticSearch.hits.hits;
    for (const logEslaticSearch of logsEslaticSearch) {
      log = JSON.parse(logEslaticSearch._source.log);
      if (log.reason === reason) {
        if (
          reason === "call_external_domain" &&
          (await log.action.params.call_to.trim()) !== dataGetLogEslatic.external_domain
        ) {
          continue;
        }
        return log;
      }
    }
    throw new Error(`Log on EslaticSearch not found by reason`);
  }
}
