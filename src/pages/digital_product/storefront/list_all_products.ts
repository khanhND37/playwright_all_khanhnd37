import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

/**
 * @deprecated: use src/shopbase_creator/storefront/ instead
 */
export class AllProductStorefront extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * click title product on product list
   * @param productTitle: title product check click
   */
  async clickTitleProduct(productTitle: string) {
    await this.page.click(`(//span[normalize-space()='${productTitle}'])[1]`);
  }

  /**
   * click thumbnail product on product list
   * @param productTitle: title product cần check click thumbnail
   */
  async clickThumbnailProduct(productTitle: string) {
    await this.page.click(`(//span[normalize-space()='${productTitle}']//preceding::img)[1]`);
  }

  /**
   * click button View product on sale page
   */
  async hoverThenClickViewProduct() {
    await this.hoverThenClickElement(
      `(//button[contains(text(),'View')])[1]`,
      `(//button[contains(text(),'View')])[1]`,
    );
  }

  /**
   * click sort product on product list
   */
  async clickSortProduct(sortProduct: string) {
    await this.page.click("//select[@class='w-100 px12 py8 pr32 base-select--with-prefix-icon']");
    await this.page.selectOption(`//select[@class='w-100 px12 py8 pr32 base-select--with-prefix-icon']`, {
      value: `${sortProduct}`,
    });
    await this.page.waitForTimeout(5000);
  }

  /**
   * get first product on product list
   */
  async getProductName() {
    return await this.getTextContent(`(//span[@class='product-content__name'])[1]`);
  }

  /**
   * hàm wait product sync ngoài storefront sau khi add new
   * @param productName
   */
  async waitSyncProduct(productName: string) {
    for (let i = 0; i < 10; i++) {
      if (await this.page.locator(`(//span[normalize-space()='${productName}'])[1]`).isVisible()) {
        break;
      } else {
        await this.page.reload();
        await this.page.waitForSelector(`(//span[@class='product-content__name'])[1]`);
      }
    }
  }
}
