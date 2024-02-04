import { APIRequestContext, expect, Page } from "@playwright/test";
import { CheckoutAPI } from "@pages/api/checkout";
import type { CheckoutInfo } from "@types";

export class CreatorCheckoutAPI extends CheckoutAPI {
  constructor(domain: string, request?: APIRequestContext, page?: Page, checkoutToken?: string) {
    super(domain, request, page);
    this.domain = domain;
    this.request = request;
    this.checkoutToken = checkoutToken;
  }

  /**
   * Create an order checkout via Stripe/Spay/SMP, support rotation payment.
   * @param infos Informations for this order, required only "productsCheckout".
   *              If user uses default shipping info, the store must have shipping method to US
   * @returns All information of order.
   */
  async createAnOrderCreator(productsCheckout: string, customerInfo?: string): Promise<CheckoutInfo> {
    await this.addProductToCartCreator(productsCheckout);

    if (customerInfo) {
      await this.updateCustomerCreator(customerInfo);
    }
    await this.createOrderCreater();
    return await this.getCheckoutInfo();
  }

  /**
   * update customer information for the checkout
   * @param email
   * @param shippingAddress
   * @returns
   */
  async updateCustomerCreator(customerInfo: string) {
    const res = await this.request.put(
      `https://${this.domain}/api/checkout/${this.checkoutToken}/customer-and-shipping.json`,
      {
        data: customerInfo,
      },
    );
    if (!res.ok()) {
      return Promise.reject(`Error message: ${(await res.json()).error} ${new Error().stack}`);
    }
    const resBody = await res.json();
    return resBody.result;
  }

  /**
   * Allow to add products to cart by call the update cart API multiple times
   * Step:
   * 1. Create an empty cart
   * 2. Add product to cart
   * 3. Fetch checkout info
   */
  async addProductToCartCreator(product: string) {
    await this.createCart();
    const res = await this.request.put(`https://${this.domain}/api/checkout/next/cart.json`, {
      data: product,
      params: { cart_token: this.cartToken },
    });
    if (res.ok()) {
      await this.getCheckoutInfo();
    }
  }

  async createOrderCreater() {
    const res = await this.request.post(`https://${this.domain}/api/checkout/${this.checkoutToken}/create-order.json`, {
      data: { accept_term: true },
    });
    expect(res.status()).toBe(200);
  }
}
