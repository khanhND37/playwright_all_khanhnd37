import { Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";

export class WbMyProductPage extends Blocks {
  xpathSectionMyProduct = "//section[@component='my-products']";
  xpathSelectedSorting = "//section[@component='my-products']//select//option[@data-selected='true']";
  xpathProductName = "//section[@component='my-products']//h5[contains(@class, 'digital-product__name')]";

  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  async openMyProductPage() {
    const xpathMenu = this.getXpathMenu("Online Store");
    const isOnlineStoreMenuVisible = await this.genLoc(xpathMenu).isVisible();
    if (isOnlineStoreMenuVisible) {
      await this.navigateToMenu("Online Store");
    } else {
      await this.navigateToMenu("Website");
    }

    await this.page.getByRole("button", { name: "Customize" }).first().click();
    await this.page.locator('button[name="Pages"]').click();
    await this.page.goto(`${this.page.url().toString()}?page=my_products`);
    await this.loadingScreen.waitFor();
    await this.loadingScreen.waitFor({ state: "hidden" });
    await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
  }

  async selectSortOption(option: string) {
    await this.genLocFrame("//select").selectOption({ label: `${option}` });
    // await this.page.locator("#v-progressbar").waitFor();
    // await this.page.locator("#v-progressbar").waitFor({ state: "detached" });
    await this.page.waitForResponse(response => response.url().includes(`products.json`) && response.status() === 200, {
      timeout: 5 * 1000,
    });
  }

  async getCurrentSortingValue(): Promise<string> {
    const currentSortValue = await this.genLocFrame(this.xpathSelectedSorting).textContent();
    return currentSortValue.trim();
  }

  /**
   * Get all product name appear in My Product block
   */
  async getProductNames(): Promise<string[]> {
    const productNameLocs = await this.genLocFrame(this.xpathProductName).all();
    const productNames = [];
    for (const productNameLoc of productNameLocs) {
      let productName = await productNameLoc.textContent();
      productName = productName.trim();
      productNames.push(productName);
    }

    return productNames;
  }

  getXpathMenu(menuName: string): string {
    return (
      `(//ul[contains(@class,'menu') or contains(@class,'active treeview-menu') or contains(@class,'nav-sidebar')]` +
      `//li` +
      `//*[text()[normalize-space()='${menuName}']]` +
      `//ancestor::a` +
      `|(//span[following-sibling::*[normalize-space()='${menuName}']]//ancestor::a))[1]`
    );
  }

  /**
   * Navigate to menu in dashboard
   * @param menu:  menu name
   * */
  async navigateToMenu(menu: string): Promise<void> {
    await this.waitUtilNotificationIconAppear();
    const menuXpath = this.getXpathMenu(menu);
    await this.page.locator(menuXpath).click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * wait notification icon visible
   */
  async waitUtilNotificationIconAppear() {
    await this.page.waitForSelector(".icon-in-app-notification");
  }
}
