import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import type { AliexpressProductListItem } from "@types";

export class PlusbasePrivateRequestPage extends DropshipCatalogPage {
  /**
   * Go to Private request page
   */
  async goToPrivateRequest() {
    await this.page.goto(`https://${this.domain}/admin/plusbase/private-request`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Go to quotation detail page
   * @param id odoo product id
   */
  async goToQuotationDetail(id: number) {
    await this.page.goto(`https://${this.domain}/admin/plusbase/private-request/${id}`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Get private product by usl
   * @param api is PlusbaseProductAPI
   * @param url is full url of product
   * @returns product data
   */
  async getPrivateProductByUrl(
    api: PlusbaseProductAPI,
    url: string,
    waitCrawlSuccess?: boolean,
    maxRetryTime?: number,
  ): Promise<AliexpressProductListItem> {
    for (let index = 0; index < maxRetryTime ? maxRetryTime : 5; index++) {
      const products = (
        await api.getProducts({
          type: "private",
          tab: "all",
          ignore_ali: true,
          search: url,
          limit: 2,
        })
      ).products;
      if (products.length !== 1) {
        throw new Error("cannot get product (result empty or large than 1)");
      }

      if (waitCrawlSuccess && (products[0].id === 0 || products[0].quotation_id === 0)) {
        this.page.waitForTimeout(5000);
        continue;
      }

      return products[0];
    }

    throw new Error("error when get product");
  }
}
