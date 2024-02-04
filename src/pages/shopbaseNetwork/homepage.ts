import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";
import type { Marketplace } from "@types";

export class MKHome extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async gotoShopBaseNetwork() {
    await this.page.goto(`https://${this.domain}`);
    await this.page.waitForLoadState("load");
  }

  /* get listing by api tùy thuộc ở từng vị trí hiên thị khác nhau hoặc key search khác nhau
  - key là vị trí hoặc action muốn thực hiện:
   + vị trí: collection, category, all
   + action: search, filter, sort
  - value: giá trị tương ứng với key muốn thực hiện
*/
  async getListing(api: string, key: string, value: string, limit: string): Promise<Marketplace> {
    let url = `https://${api}/v1/marketplace/listings`;
    switch (key) {
      case "Collection":
        url += `?get_top_pick=true`;
        break;
      case "All":
        url += `?limit=${limit}`;
        break;
      case "Category":
        url += `?limit=${limit}&category_id=${value}`;
        break;
    }
    const res = await this.page.request.get(url);
    return res.json();
  }
}
