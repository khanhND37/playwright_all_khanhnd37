import { APIRequestContext } from "@playwright/test";
import type { FilterOrderParam } from "@types";

export class OrderAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * get total order of shop with api
   * @returns number of order on order list
   */
  async getNumberOfOrder(accessToken?: string): Promise<number> {
    let response;
    if (accessToken) {
      response = await this.request.get(`https://${this.domain}/admin/orders/count/v2.json`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      });
    } else {
      response = await this.request.get(`https://${this.domain}/admin/orders/count/v2.json`);
    }

    if (response.status() === 200) {
      const resBody = await response.json();
      const count = resBody.count as number;
      return count;
    }
  }

  /**
   * get total order of shop with api
   * @returns number of order on order list
   */
  async getNumberOfOrderWithParam(params: FilterOrderParam): Promise<number> {
    const response = await this.request.get(`https://${this.domain}/admin/orders/count/v2.json`, {
      params: params,
    });

    if (response.status() === 200) {
      const resBody = await response.json();
      const count = resBody.count as number;
      return count;
    }
  }

  async getIdsOfOrderList(params?: FilterOrderParam): Promise<Array<number>> {
    const ids = [];
    const response = await this.request.get(`https://${this.domain}/admin/orders/v2.json`, {
      params: params,
    });
    if (response.ok()) {
      const resBody = await response.json();
      for (let i = 0; i < resBody.orders.length; i++) {
        const id = resBody.orders[i].id;
        ids.push(id);
      }
    }
    return ids;
  }
}
