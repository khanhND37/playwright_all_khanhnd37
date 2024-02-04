import { APIRequestContext, expect, Page } from "@playwright/test";
import type {} from "@types";

export class PrintHubAPI {
  page: Page;
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext, page?: Page) {
    this.domain = domain;
    this.request = request;
    this.page = page;
  }

  /*
   * count order in tab by api
   * @param tabName: Name of tab
   *  @param orderName: order name
   */
  async countOrderPrintHubInTab(tabName: string, orderName: string): Promise<number> {
    const response = await this.request.get(
      `https://${this.domain}/admin/phub-order.json?keyword=%23${parseInt(
        orderName.replace(/\D/g, ""),
      )}&order_type=${tabName}`,
    );
    expect(response.status()).toBe(200);
    const res = await response.json();
    // Kiểm tra xem res.results có phải là một mảng không
    const resultsCount = Array.isArray(res.results) ? res.results.length : 0;
    return resultsCount;
  }
}
