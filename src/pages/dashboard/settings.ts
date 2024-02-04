import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

/**
 * Class for settings page
 */
export class Settings extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  //Legal setting
  txtAddCustomText = "//textarea[@placeholder='Enter your text']";

  getLocatorShowText(option: string) {
    return this.genLoc(`//select/option[normalize-space()='${option}']`);
  }

  getTitleAddCustomText(title: string) {
    return this.genLoc(`//p[normalize-space()='${title}']`);
  }

  // enable test mode shop plusbase
  async enableTestMode() {
    await this.page.locator("text=Settings").click();
    await this.page.locator("text=Payment providers").first().click();
    await this.page.locator("//span[normalize-space()='Enable test mode']").click();
    await this.page.locator("//span[normalize-space()='Save changes']").click();
  }

  // setting trang checkout thành 3step checkout, bỏ require Company name, Address line 2
  async settingCheckoutPage(layout: string) {
    await this.page.locator("//span[normalize-space()='Settings']").click();
    await this.page.locator("text=Checkout").nth(1).click();
    await this.page.locator(`//span[normalize-space()='${layout}']`).click();
    await this.page.locator("text=Optional").nth(1).click();
    await this.page.locator("text=Optional").nth(2).click();
    await this.page.locator("text=Hidden").first().click();
    await this.page.locator("text=Use the shipping address as the billing address by default").click();
    await this.page.click("//span[normalize-space()='Save changes']");
  }

  /**
   * Click menu on setting page with menu name
   * @param menu là tên menu cần click
   */
  async clickMenu(menu: string) {
    await this.page.locator(`//*[contains(text(),"${menu}")]`).click();
  }
}
