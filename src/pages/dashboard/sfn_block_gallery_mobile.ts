import { Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";

export class SfnBlockGalleryMobilePage extends Blocks {
  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  async gotoProduct(handle: string) {
    await this.goto(`/products/${handle}`);
    await this.page.waitForLoadState("networkidle");
  }
}
