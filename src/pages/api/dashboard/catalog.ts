import { APIRequestContext, expect } from "@playwright/test";
import type { Categories } from "@types";
import { buildQueryString } from "@core/utils/string";

export class CatalogAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Deletion set up shipping in the base product
   * @param authRequest
   * @param baseProductId
   */
  async deleteSetUpShippingFee(authRequest: APIRequestContext, baseProductId: number) {
    const res = await authRequest.patch(
      `https://${this.domain}/admin/shipping/zone/pod-markup-shipping.json?baseProductId=${baseProductId}`,
      {
        data: { zones: [] },
      },
    );
    expect(res.status()).toBe(200);
  }

  /**
   * get base cost by title
   * @param baseName
   * @returns base cost
   */
  async getBasecostByTitle(baseName: string): Promise<number> {
    const res = await this.request.get(`https://${this.domain}/admin/pbase-product-base/catalogs.json?feature=catalog`);
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const basecost = resBody.products.find(({ title }) => title === baseName).product_base_cost;
    return basecost;
  }

  /**
   * Get category by condition
   * @condition is condition param to get category
   * return data categories
   *
   */
  async getDataCategory(condition: Record<string, number>): Promise<Array<Categories>> {
    const response = await this.request.get(
      `https://${this.domain}/admin/plusbase-sourcing/products/category.json?${buildQueryString(condition)}`,
    );
    expect(response.status()).toBe(200);
    return (await response.json()).result;
  }

  /**
   * Get ID, variant name of product template
   * @param productTempID
   */
  async getVariantInfoByID(productTempID: number): Promise<Map<number, string>> {
    const map = new Map<number, string>();

    const response = await this.request.get(
      `https://${this.domain}/admin/plusbase-sourcing/products/${productTempID}.json?type=private`,
    );
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const variants = jsonResponse.variants;
    for (const variant of variants) {
      map.set(variant.id, variant.name);
    }
    return map;
  }
}
