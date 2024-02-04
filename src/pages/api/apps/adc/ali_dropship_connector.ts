import { APIRequestContext, expect } from "@playwright/test";
import type { Order } from "@types";

export class AdcAPI {
  shopId: number;
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, shopId: number, request: APIRequestContext) {
    this.request = request;
    this.shopId = shopId;
    this.domain = domain;
  }

  /**
   * Get data order on tab manage order ADC
   */
  async getDataOrder(): Promise<Array<Order>> {
    const response = await this.request.get(
      `https://${this.domain}/admin/ali-dropship-connector/orders.json?key=&limit=20&order_status=awaiting_order`,
    );
    expect(response.status()).toBe(200);
    return (await response.json()).result;
  }
}
