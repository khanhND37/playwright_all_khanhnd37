import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

export class MyOrdersPage extends SBPage {
  xpathProductTitle = "(//p[contains(@class,'title')])[1]";
  xpathProductVariant = "(//p[contains(text(),'Variant:')])[1]//span";
  xpathProductQuantity = "(//div[contains(text(),'Quantity:')])[1]//span";
  xpathPageLoad = "//div[@class='ant-spin ant-spin-spinning ant-spin-show-text']";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /*
   * I go to My orders page
   */
  async goToMyOrders() {
    await this.page.goto(`https://${this.domain}/fulfillment/orders/`);
    await this.waitForElementVisibleThenInvisible(this.xpathPageLoad);
  }

  /*
   * Filter domain of order
   * @param: store domain
   */
  async filterDomain(domain: string) {
    const xpathComboboxDomain = "(//div[@class='control-bar']//div[@role='combobox'])[2]";
    const xpathTextboxDomain = "(//div[@class='control-bar']//div[@role='combobox'])[2]//input";
    await this.page.click(xpathComboboxDomain);
    await this.page.waitForSelector(xpathTextboxDomain);
    await this.page.fill(xpathTextboxDomain, domain);
    const optionValueDomain = `//li[@role='option' and normalize-space()='${domain}']`;
    await this.page.waitForSelector(optionValueDomain);
    await this.page.click(optionValueDomain);
    await this.page.waitForLoadState("networkidle");
  }

  /*
   * Filter order by option
   * @param: filter option
   * Order name, Order ref id, Item name, Barcode, Sku, Product name, Tracking number, Last mile tkn
   */
  async filterOrderByOption(filterOption: string) {
    const xpathComboboxFilterOrder = "(//div[@class='control-bar']//div[@role='combobox'])[1]";
    const xpathListOption = "(//ul[@role='listbox'])[2]";
    const optionValueOption = `//li[@role='option' and normalize-space()='${filterOption}']`;
    await this.page.click(xpathComboboxFilterOrder);
    await this.page.waitForSelector(xpathListOption);
    await this.page.click(optionValueOption);
    await this.page.waitForLoadState("networkidle");
  }

  /*
   * Filter order by option
   * @param: value of order
   * Order name, Order ref id, Item name, Barcode, Sku, Product name, Tracking number, Last mile tkn
   */
  async searchOrder(value: string) {
    const xpathTextbox = "//input[@placeholder='Search by Product name, order no, tracking number']";
    await this.page.fill(xpathTextbox, value);
    await this.page.locator(xpathTextbox).press("Enter");
    await this.page.waitForLoadState("networkidle");
  }

  /*
   * Wait for order to be sync successfully from ShopBase to Cross Panda
   */
  async waitForOrderToBeSync(orderName: string) {
    const xpathOrder = `//div[contains(@class,'order-no')]//span[normalize-space()='${orderName}']`;
    const xpathTextbox = "//input[@placeholder='Search by Product name, order no, tracking number']";

    await this.switchTabInAllOrders("All Orders");

    let i = 0;
    while ((await this.page.locator(xpathOrder).isVisible()) === false && i <= 10) {
      await this.page.locator(xpathTextbox).press("Enter");
      i++;
      await this.page.waitForLoadState("networkidle");
      await this.page.waitForTimeout(10000);
    }
  }

  /*
   * Switch tab in My orders screen
   * @param: tabName: Name of tab
   */
  async switchTabInAllOrders(tabName: string) {
    const xpathTab = `//div[@class='tabs-bar']//span[contains(text(),'${tabName}')]`;
    const xpathTableLoading = "//div[contains(@class,'ant-spin-spinning')]";
    await this.page.click(xpathTab);
    await this.page.waitForLoadState("networkidle");
    await this.page.locator(xpathTableLoading).isHidden();
  }

  /*
   * Count order in tab
   * @param: tabName: Name of tab
   */
  async countOrderCrossPandaInTab(tabName: string): Promise<number> {
    const xpathTab = `//div[@class='tabs-bar']//span[contains(text(),'${tabName}')]//span`;
    const xpathTableLoading = "//div[contains(@class,'ant-spin-spinning')]";
    await this.switchTabInAllOrders(tabName);
    await this.page.waitForLoadState("networkidle");
    await this.page.locator(xpathTableLoading).isHidden();

    await this.page.waitForSelector(xpathTab);
    const textOfTab = await this.page.textContent(xpathTab);
    const numberOfOrder = parseInt(textOfTab.replace("(", "").replace(")", "").toString());
    return numberOfOrder;
  }

  /*
   * Click btn Fulfill Order
   * After that, click btn Confirm on Fulfillments popup
   * @param: orderName: Name of order to fulfill
   */
  async fulfillOrder(orderName: string) {
    const xpathBtnFulfillOrder = `//div[@class='header' and contains(.,'${orderName}')]//following-sibling::div[contains(@class,'footer')]//button[normalize-space()='Fulfill order']`;
    const xpathBtnConfirm = "//button[normalize-space()='Confirm']";
    const xpathMsgFulfillSuccessfully = "//div[normalize-space()='Completed: 1/1 total orders']";
    await this.page.click(xpathBtnFulfillOrder);
    await this.page.waitForSelector(xpathBtnConfirm);
    await this.clickOnBtnWithLabel("Confirm");
    await this.page.waitForSelector(xpathMsgFulfillSuccessfully);
    await this.clickOnBtnWithLabel("Close");
  }

  /*
   * Get xpath Order No by order name
   * @param: orderName
   */
  getXpathOrderNoByOrderName(orderName: string): string {
    return `//div[contains(@class,'order-no')]//span[normalize-space()='${orderName}']`;
  }

  /*
   * Get xpath Product ShopBase title by index
   * @param: index
   */
  getXpathProductTitleByIndex(index: number): string {
    return `(//p[contains(@class,'title')])[${index}]`;
  }

  /*
   * Get xpath Product variant ShopBase title by index
   * @param: index
   */
  getXpathProductVariantTitleByIndex(index: number): string {
    return `(//p[contains(text(),'Variant:')])[${index}]//span`;
  }

  /*
   * Get xpath Product variant ShopBase quantity by index
   * @param: index
   */
  getXpathProductVariantQuantityByIndex(index: number): string {
    return `(//div[contains(text(),'Quantity:')])[${index}]//span`;
  }

  /*
   * Get xpath order line item by variant
   * @param: index
   */
  getXpathOrderLineItemByVariant(variant: string): string {
    return `//div[@class='product-container' and descendant::span[normalize-space()='${variant}']]`;
  }

  /**
   * mapping product in cross_panda
   */

  async mappingProduct(message: string) {
    const xpathMapping = `(//button[normalize-space()='Map Product' or child::*[normalize-space()='Map Produc']])[1]`;
    if (await this.page.isVisible(xpathMapping)) {
      await this.clickOnBtnWithLabel("Map Product");
      await this.waitForElementVisibleThenInvisible(this.xpathPageLoad);
      await this.clickOnBtnWithLabel("Save");
      await this.waitForElementVisibleThenInvisible(
        `//div[@class='ant-notification-notice-message' and normalize-space()="${message}"]`,
      );
    }
  }

  /**
   * go tao my order in crosspanda and search order
   */

  async gotoOrderAndSearchOrder(domain: string, orderName: string): Promise<void> {
    await this.goToMyOrders();
    await this.filterDomain(domain);
    await this.filterOrderByOption("Order name");
    await this.searchOrder(orderName);
    await this.waitForOrderToBeSync(orderName);
  }
}
