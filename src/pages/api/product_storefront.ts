import { APIRequestContext, Page, expect } from "@playwright/test";

export class ProductStorefrontAPI {
  page: Page;
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Get infomation of product using storefront api response
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @param key is key of API
   */
  async getProductDetail(productHandle: string, extraHeaders?: Record<string, string>) {
    const response = await this.request.get(
      `https://${this.domain}/api/catalog/next/product.json?handle=${productHandle}`,
      {
        headers: extraHeaders,
      },
    );
    expect(response.ok()).toBeTruthy();
    return response.json();
  }
}
