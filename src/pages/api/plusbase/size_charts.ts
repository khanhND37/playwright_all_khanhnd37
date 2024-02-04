import { APIRequestContext, expect } from "@playwright/test";
import type { DataSize } from "@types";
import { OdooServiceInterface } from "@services/odoo";
export class SizeChartPlusBaseAPI {
  domain: string;
  request: APIRequestContext;

  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Map size chart cho product
   * @param dataSize:  data map size chart
   * @param accessToken
   * @param productOdoo: odoo service
   * */
  async mapSizeChart(dataSize: DataSize, accessToken: string, productOdoo: OdooServiceInterface): Promise<void> {
    const product = await productOdoo.getProductTemplatesById(dataSize.product_tmpl_id);
    if (!product.x_is_testing_product) {
      throw new Error("This product is not testing product");
    }
    const res = await this.request.put(`https://${this.domain}/admin/plusbase-sourcing/size-charts/assign.json`, {
      data: dataSize,
      headers: {
        "X-ShopBase-Access-Token": accessToken,
      },
    });
    expect(res.status()).toBe(200);
  }
}
