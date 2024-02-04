import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";

export class AppReviewPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  xpathLineReview = `(//span[@class='s-tag is-success']//span[normalize-space()='Published'])[1]`;

  // count số review trong app review
  async countLineItemReview(): Promise<number> {
    return await this.page.locator("//tbody/tr").count();
  }
}
