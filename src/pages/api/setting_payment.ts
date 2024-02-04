import { expect, APIRequestContext } from "@playwright/test";

export class SettingPaymentAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Get card shield information
   * return array of card shield and corresponding payment method
   * @param shopID
   */
  async getCardShieldInfo(shopID: number) {
    const res = await this.request.get(
      `https://${this.domain}/admin/payments/proxy/payment-methods.json?shop_id=${shopID}`,
    );
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.result;
  }

  /**
   * Get list active payment method ID in Paymnet method page
   * @param shopID
   * @returns an array of paymnet method id that are applied domain
   */
  async getListMethodID(shopID: number) {
    const paymentMethodId = [];
    const paymentMethodList = await this.getCardShieldInfo(shopID);
    for (const methodID of paymentMethodList) {
      if (methodID.status === "active") paymentMethodId.push(methodID.payment_method_id);
    }
    return paymentMethodId;
  }

  /**
   * Delete connected domain with ID
   * @param domainID
   * @param shopID
   * return status code
   */
  async deleteConnectedDomain(domainID: number, shopID: number) {
    const res = await this.request.delete(
      `https://${this.domain}/admin/payments/proxy/payment-methods/${domainID}.json?shop_id=${shopID}`,
      {
        data: {
          shop_domain_id: domainID,
        },
      },
    );
    expect(res.status()).toBe(200);
    return res.status();
  }

  /**
   * Add connected domain
   * @param proxyDomainID
   */
  async addCardShieldDomain(proxyDomainID: number, shopID: number) {
    const res = await this.request.post(
      `https://${this.domain}/admin/payments/proxy/payment-methods.json?shop_id=${shopID}`,
      {
        data: {
          shop_domain_id: proxyDomainID,
        },
      },
    );
    const resInfo = {
      status: res.status(),
      body: await res.json(),
    };
    return resInfo;
  }

  /**
   * Get all payment method name - only get stripe and paypal gateway
   * @returns an array of Stripe and Paypal gateway ids
   */
  async getAllPaymentMethodName() {
    const gatewayName = [];
    const res = await this.request.get(`https://${this.domain}/admin/payments.json?no_limit=true`);
    const resBody = await res.json();
    expect(res.status()).toBe(200);
    const gatewayList = resBody.payment_methods;
    for (const gateway of gatewayList) {
      if (gateway.code === "stripe" || gateway.code === "paypal-express") gatewayName.push(gateway.id);
    }
    return gatewayName;
  }
}
