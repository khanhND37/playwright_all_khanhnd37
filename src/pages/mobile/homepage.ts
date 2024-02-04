import { SBPage } from "@pages/page";
import { SFProductOnMobile } from "./product";
import { Page, expect } from "@playwright/test";

export class SFHomeOnMobile extends SBPage {
  xpathSearching = "//p[contains(@class, 'searching')]";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Search product at homepage on mobile device
   * @param productName
   * @param productOption
   * @returns
   */
  async searchThenViewProductOnMobile(productName: string, productOption?: string): Promise<SFProductOnMobile> {
    let searchLoc = this.genLoc(`input[placeholder='Search']`);
    if (!(await searchLoc.isVisible())) {
      searchLoc = this.genLoc(
        "//input[@placeholder='Enter keywords...'] | //input[@placeholder='What are you looking for?']",
      );
      await this.goto("/search");
    }
    await this.page.waitForLoadState("networkidle");
    await searchLoc.click();
    await searchLoc.fill(productName);
    await searchLoc.press("Enter");
    await this.page.waitForLoadState("networkidle");
    await expect(this.genLoc(this.xpathSearching)).toBeHidden();

    // Wait for css transition complete
    await this.page.waitForTimeout(2 * 1000);

    await this.page
      .locator(`(//span[text()="${productName}"]//ancestor::a)[1] | //h3[contains(text(),"${productName}")][1]`)
      .click();
    if (productOption) {
      await this.page.locator(`//div[@class='product__variant-button']//button[text()='${productOption}']`).click();
    }

    const actualProdPrice = Number(
      (
        await this.page
          .locator(
            `(//h1[normalize-space()="${productName}"]/following-sibling::div[contains(@class,'product__price')])[1]`,
          )
          .textContent()
      ).substring(1),
    );

    const initialStateObj = await this.page.evaluate(() => window["__INITIAL_STATE__"]);
    let productObj;
    if (initialStateObj) {
      productObj = initialStateObj["product"];
    }
    let productId = 0;
    if (productObj) {
      productId = productObj.product.id as number;
    } else {
      const rawObj = await this.page.locator("#__INITIAL_STATE__").textContent();
      productId = JSON.parse(rawObj).product.product.id as number;
    }
    if (
      await this.page
        .locator("(//img[@class='image sb-lazy loading base-picture__img'])[1]")
        .isVisible({ timeout: 3000 })
    ) {
      await this.waitForElementVisibleThenInvisible("(//img[@class='image sb-lazy loading base-picture__img'])[1]");
    }
    await this.page.waitForLoadState("networkidle");
    return new SFProductOnMobile(this.page, this.domain, productName, actualProdPrice, 0, productId);
  }
}
