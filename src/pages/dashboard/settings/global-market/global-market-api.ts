import { APIRequestContext, Page, expect } from "@playwright/test";
import { Market, MarketList, MarketResponse } from "./global-market";

export class GlobalMarketAPI {
  domain: string;
  request: APIRequestContext;
  page: Page;

  constructor(domain: string, request?: APIRequestContext, page?: Page) {
    this.domain = domain;
    this.request = request;
    this.page = page;
  }

  async deleteMarketByAPI(id: number) {
    const res = await this.request.delete(`https://${this.domain}/admin/global-markets/${id}.json`);
    expect(res.status()).toBe(200);
  }

  async getAllMarketByAPI(): Promise<MarketList> {
    const res = await this.request.get(`https://${this.domain}/admin/global-markets/all.json`);
    expect(res.status()).toBe(200);
    const result = await res.json();
    return result;
  }

  async getAllOtherMarketByAPI(): Promise<Market[]> {
    const otherMarketList = (await this.getAllMarketByAPI()).result.filter(obj => obj.is_primary === false);
    return otherMarketList;
  }

  async editMarketByAPI(body: Market, id: number): Promise<MarketResponse> {
    const res = await this.request.put(`https://${this.domain}/admin/global-markets/${id}.json`, {
      data: { body },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody;
  }
}
