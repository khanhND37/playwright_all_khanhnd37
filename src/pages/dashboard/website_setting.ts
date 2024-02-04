import { WebBuilder } from "@pages/dashboard/web_builder";
import { XpathNavigationButtons } from "@constants/web_builder";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();

export class WebsiteSetting extends WebBuilder {
  xpathYourCart = "//span[contains(text(),'YOUR CART')] | //span[contains(text(),'Your cart')]";
  xpathGoToCart = "//span[normalize-space()='GO TO CART']";
  /**
   Click setting category
   * @param category
   */
  async clickSettingCategory(
    category: "General" | "Product" | "Cart goal" | "Language" | "Cookies banner" | "Review rating",
  ): Promise<void> {
    await this.genLoc(`//p[contains(@class,'insert-category-name') and normalize-space()='${category}']`).click();
  }

  /**
   Đổi product entity ở wb
   * @param productName
   */
  async changeProductEntity(productName: string): Promise<void> {
    await this.page.locator(".sb-popover__reference div .sb-selection-group-item").click();
    await this.page.locator("//input[@placeholder='Search products']").click();
    await this.page.locator("//input[@placeholder='Search products']").fill(productName);
    await this.page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });
    await this.page.locator(`(//div[normalize-space()='${productName}'])[3]`).isVisible();
    await this.page.locator(`(//div[normalize-space()='${productName}'])[3]`).click();
    await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
    await this.page.waitForSelector(
      `//p[contains(@class, 'sb-selection-group-item') and normalize-space()='Preview: ${productName}']`,
    );
    await this.page.waitForTimeout(2000); //wait for change Product
  }

  /**
   Thay đổi state của switch theo label
   * @param label
   * @param value
   */
  async toggleByLabel(label: string, value: string): Promise<void> {
    const switchLocator = `//div[contains(@label, '${label}')]//div[contains(@class, 'w-builder__widget--switch')]`;
    const inputElementLoc = this.genLoc(`${switchLocator}//input`);
    const inputType = await inputElementLoc.getAttribute("type");

    logger.info(`Input type: ${inputType}`);

    let inputValue = "";
    if (inputType === "checkbox") {
      inputValue = `${await inputElementLoc.isChecked()}`;
    } else {
      inputValue = await inputElementLoc.inputValue();
    }

    if (value != inputValue) {
      await this.genLoc(
        `//div[contains(@label, '${label}')]//div[contains(@class, 'w-builder__widget--switch')]`,
      ).click();
    }
  }

  /**
   Remove toàn bộ tag excluded đang có
   */
  async clearExcludedTag() {
    const excludedTagLocator = `//div[@data-widget-id='exclude_options'] //span[contains(@class,'sb-icon')]`;
    const excludedTags = await this.genLoc(excludedTagLocator).all();
    if (excludedTags.length === 0) {
      return;
    }
    for (let i = excludedTags.length; i > 0; i--) {
      await excludedTags[i - 1].click();
    }
  }

  /**
   Get locator variant item by text
   */
  getXpathVariantItem(variant: string): string {
    return `//div[contains(@class,'variants-selector')]//div[contains(@class,'button-layout')] //span[normalize-space()='${variant}']`;
  }

  /**
   Get locator variant item by text on select
   */
  getXpathVariantItemSelect(variant: string): string {
    return `//div[contains(@class,'sticky__product-options')] //select //option[normalize-space()='${variant}']`;
  }

  /**
   CLick save setting
   */
  async clickBtnSave() {
    //wait to enable button save
    await this.page.waitForTimeout(300);
    if (await this.page.locator(XpathNavigationButtons["save"]).isEnabled()) {
      await this.page.locator(XpathNavigationButtons["save"]).waitFor({ state: "visible" });
      await this.page.locator(XpathNavigationButtons["save"]).click();
      await this.page.waitForSelector("text='All changes are saved'");
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * Select variant by title
   * @param options is list option value of 1 variant
   */
  async selectVariantByTitle(options: Array<string>) {
    for (const value of options) {
      await this.frameLocator.locator(this.getXpathVariantItem(value)).click();
    }
  }

  /**
   *   setting Open cart drawer or Cart page  When buyer click Add to cart
   */
  async changeSettingclickAddtocart(setting: "Open cart drawer" | "Go to cart page"): Promise<void> {
    await this.page.locator("//button[@name='Website Settings']").click();
    await this.clickSettingCategory("Product");
    await this.page.locator("//div[@data-widget-id='click_add_cart']//span[contains(@class, 'button--label')]").click();
    await this.page.locator(`//*[@data-select-label= '${setting}']`).click();
    await this.clickBtnSave();
  }
}
