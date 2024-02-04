import { HivePage } from "./core";

export class HiveStorefrontTool extends HivePage {
  /**
   * Clear data shop để tạo lại shop từ luồng survey
   * @param shopID: shop id của shop cần clear
   */
  async clearShopDataInHive(shopID: string) {
    await this.goto(`admin/tool/storefront-clear-shop-data`);
    await this.genLoc("//input[@class='form-control']").click();
    await this.page.keyboard.press("Backspace");
    await this.genLoc("//input[@class='form-control']").fill(shopID);
    await this.genLoc("//button[normalize-space()='Clear']").click();
  }

  /**
   * Filter merchant by email
   * @param email: email của merchant
   */
  async filterMerchantByEmail(email: string) {
    const filter = "//a[@class='dropdown-toggle sonata-ba-action']";
    const cbName = `//li[child::a[normalize-space()='Email']]`;
    const xpathValue = `//input[@id='filter_email_value']`;
    const applyButton = `//button[normalize-space()='Apply']`;
    const emailMerchant = `//tr//td//a[normalize-space()='${email}']`;
    await this.genLoc(filter).click();
    await this.genLoc(cbName).click();
    await this.genLoc(xpathValue).click();
    await this.genLoc(xpathValue).fill(email);
    await this.genLoc(applyButton).click();
    await this.genLoc(emailMerchant).click();
    await this.page.waitForLoadState();
  }

  /**
   * Login to merchant shop
   */
  async loginToMerchantShop() {
    const xpathAction = "//a[normalize-space()='Actions']";
    const xpathLoginMenu = "//a[normalize-space()='Login']";
    await this.genLoc(xpathAction).click();
    await this.genLoc(xpathLoginMenu).click();
    await this.page.waitForLoadState();
    await this.genLoc("//h3[normalize-space()='Please log the reason why you need to login as this user']").isVisible();
    await this.page.waitForLoadState();
  }

  /**
   * Navigate to submenu
   * @param menuName: Tên menu
   * @param subMenuName : Tên sub menu
   */
  async navigateToSubMenu(menuName: string, subMenuName: string) {
    await this.page.waitForSelector("ul.sidebar-menu");
    await this.page.locator(`//span[normalize-space()='${menuName}']`).click();
    await this.page.waitForSelector(".treeview-menu.menu-open");
    await this.page
      .locator(
        `//span[normalize-space()='${menuName}']//parent::a//following-sibling::ul//li//a[normalize-space()='${subMenuName}']`,
      )
      .click();
  }
}
