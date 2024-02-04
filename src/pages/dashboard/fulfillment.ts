import { expect, Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { Options } from "csv-parse";
import * as fs from "fs";
import * as csv from "csv-parse";
import { DataMapVariantProduct } from "@types";

export class FulfillmentPage extends SBPage {
  orderNumber: string;
  xpathToFulfillTab = "//p[contains(text(),'To fulfill')]//ancestor::li";
  xpathBtnChangeMapping = "(//*[name()='svg' and @class='change-mapping']//..)[1]";
  xpathSellerResponse = "(//span[normalize-space()='Responsed'])[1]";
  xpathLinkAliSubmited = "(//input[@disabled='disabled'])[1]";
  xpathOrderName(orderName: string): Locator {
    return this.genLoc(`//span[normalize-space()='${orderName}']`);
  }

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  getLocatorOrderName(orderName: string): Locator {
    return this.genLoc(`//div[text()='${orderName}']`);
  }

  /**
   * get locator item in fulfillment tab
   */
  getLocatorItem(text: string): Locator {
    return this.genLoc(`(//*[contains(text(),"${text}")])//preceding-sibling::div`);
  }

  async clickButton(buttonName: string) {
    const xpathBtn = this.page.locator(`//button[child::span[text()[normalize-space()='${buttonName}']]]`);
    await xpathBtn.click();
  }

  async navigateToMenuPlusHub(menu: string) {
    const xpathMenu = this.page.locator(
      `//ul[contains(@class,'menu') or contains(@class,'tree-menu-ul')]//li//*[text()[normalize-space()='${menu}']][1]`,
    );
    await xpathMenu.click();
  }

  /**
   * Dashboard Plushub
   */

  /**
   * get số lượng order trong dashboard plushub
   * @param status Unfulfilled | Processing | Awaiting Stock | Fulfilled
   * @returns number of order
   */
  async getNumberOfOrder(status: string): Promise<string> {
    await this.waitForElementVisibleThenInvisible(
      `//p[contains(text(),'${status}')]/preceding-sibling::span/div[@class='sb-flex loading']`,
    );
    return await this.getTextContent(`//p[contains(text(),'${status}')]/preceding-sibling::span`);
  }

  /**
   * get tooltip khi hover vào từng status trong dashboard plushub
   * @param status Unfulfilled | Processing | Awaiting Stock | Fulfilled
   * @returns tooltip content
   */
  async getTooltipByStatus(status: string): Promise<string> {
    return await this.getTextOnTooltip(
      `//p[contains(text(),'${status}')]//div`,
      `//p[contains(text(),'${status}')]//span[contains(@class,'s-tooltip-fixed-content')]`,
    );
  }

  /**
   * get list order name trong màn hình fulfillment
   * @returns list order name trong màn hình fulfillment
   */
  async getListOrderName(): Promise<string[]> {
    const orderNames = [];
    await this.removeFilterOrderPlusHub();
    const numOrder = await this.getCountFulfillment();
    for (let i = 1; i <= numOrder; i++) {
      const orderName = await this.getTextContent(`//table//tbody[${i}]//td[2]/div/div[1]`);
      orderNames.push(orderName);
    }
    return orderNames;
  }

  /**
   * kiểm tra xem list order có nằm trong {tabName} hay không
   * @param listOrderName
   * @param tabName : To fulfill | Need mapping | Cannot Fulfill | Sent fulfillment request | Awaiting stock|
   * Processing | Fulfilled
   * @param maxRetry
   * @returns true| false
   */
  async isListOrderVisibleInTab(listOrderName: string[], tabName: string, maxRetry: number): Promise<boolean> {
    let orderName: string;
    for (const index in listOrderName) {
      orderName = listOrderName[index];
      await this.searchOrderInFulfillmentTab(orderName);
      if (!(await this.isOrderVisiableInTab(orderName, tabName, maxRetry))) {
        return false;
      }
    }
    const xpathSearch = this.page.locator("//input[@placeholder='Search orders']");
    await xpathSearch.focus();
    await xpathSearch.fill("");
    await xpathSearch.press("Enter");
    await this.page.waitForLoadState("load");
    return true;
  }

  /**
   * tìm kiếm order
   * @param orderNumber
   */
  async searchOrderInFulfillOrder(orderNumber: string) {
    const xpathSearch = this.page.locator("//input[@placeholder='Search orders']");
    await xpathSearch.focus();
    await xpathSearch.fill(orderNumber);
    await xpathSearch.press("Enter");
    await this.removeFilterOrderPlusBase();
    await this.page.waitForSelector(`//tbody//tr[1]//td[2]//*[normalize-space()='${orderNumber}']`);
  }

  //remove filter "Time since created (hours) >= 6" when fulfill order plusbase
  async removeFilterOrderPlusBase() {
    const xpathFilter = this.page.locator(
      "(//*[text()[normalize-space()='Time since created (hours) between: 6 to 4320'] or child::*[text()[normalize-space()='Time since created (hours) between: 6 to 4320']]])[1]//i",
    );
    await xpathFilter.click({ timeout: 25000 });
    // await this.page.waitForLoadState("networkidle");
  }

  //select order then click button Fulfill Selected orders
  async clickFulfillSelectedOrder(opts?: { onlySelected?: boolean }) {
    if (!opts?.onlySelected) {
      const xpathSelectOrder = this.page.locator("//th[contains(@class, 'order-select-header')]//label");
      await xpathSelectOrder.click();
    }
    await this.clickButton("Fulfill selected orders");
    await this.page.waitForLoadState("networkidle");
  }

  // verify khong co data trong popup Review khi fulfill
  async verifyNotShowDataInReview() {
    const xpath = this.page.locator("//td[@class='no-order']");
    await expect(xpath).toBeVisible();
  }

  //verify data item fulfill trong popup Review khi fulfill
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async verifyDataNumberItemInReview(data: Record<string, any>) {
    const itemFulfill = `${data.itemsWilBeFulfilled}/${data.totalLineitem} line items will be fulfilled`;
    const actualFulfill = (await this.page.locator(`//p[contains(@class,'important')]`).textContent()).trim();
    expect(itemFulfill).toEqual(actualFulfill); //verify number item / total item can fulfill

    const itemCannotFulfill =
      `${data.itemCantBeFulfilled}/${data.totalLineitem}` +
      ` line items can not be fulfilled due to insufficient inventory`;
    const actualCannotFulfill = (
      await this.page.locator(`//p[contains(@class,'text-color-danger')]`).textContent()
    ).trim();
    await expect(itemCannotFulfill).toEqual(actualCannotFulfill); //verify number item / total item cannot fulfill
  }

  // TODO move expect + verify ra ngoai .spec.ts
  // verify data product trong popup Review khi fulfill
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async verifyDataProductInReview(dataProduct: Record<string, any>) {
    //verify product name + variant name
    const xpathProduct = this.page.locator(`//div[@class='sidebar sidebar-filter open']//table/tbody//tr//td[1]//p`);
    const count = await xpathProduct.count();

    const listProduct = [];
    for (let i = 1; i <= count; i++) {
      const expectText = (
        await this.page
          .locator(`(//div[@class='sidebar sidebar-filter open']//table/tbody//tr//td[1]//p)[${i}]`)
          .textContent()
      ).trim();
      listProduct.push(expectText);
    }

    const xpathRow = this.page.locator(`//div[@class='sidebar sidebar-filter open']//table/tbody//tr`);
    const countRow = await xpathRow.count();
    //verify quantity
    const listQuantity = [];
    for (let i = 1; i <= countRow; i++) {
      const expectText = (
        await this.page
          .locator(`(//div[@class='sidebar sidebar-filter open']//table/tbody//tr//td[2]//span)[${i}]`)
          .textContent()
      ).trim();
      listQuantity.push(expectText);
    }
    //verify cost
    const listCost = [];
    for (let i = 1; i <= countRow; i++) {
      const expectText = (
        await this.page
          .locator(`(//div[@class='sidebar sidebar-filter open']//table/tbody//tr//td[3]//span)[${i}]`)
          .textContent()
      ).trim();
      listCost.push(expectText);
    }

    expect(listProduct).toContain(dataProduct.product);
    expect(listProduct).toContain(dataProduct.variant);
    expect(listQuantity).toContain(dataProduct.quantity);
    expect(listCost).toContain(dataProduct.cost);
  }

  //get so luong fulfillment cua order
  async getCountFulfillment(): Promise<number> {
    await this.waitUntilElementVisible("//table[@class='table pos-rlt m-b-xs']");
    const xpath = this.page.locator(`//div[contains(@class,'ready-to-fulfill')]//table//tbody//tr`);
    return await xpath.count();
  }

  // checkbox Auto purchase enough item to fulfill in Review popup
  async checkAutoPurchase() {
    const xpath = this.page.locator(`//p[text()='Auto purchase enough item to fulfill']`);
    await xpath.click();
  }

  //click button Checkout in Review popup
  async clickBtnCheckout() {
    const xpath = this.page.locator(`//p[text()[normalize-space()='Checkout']]//ancestor::button`);
    await xpath.click();
  }
  /*
   * Chọn auto purchase nếu hiển thị popup review khi fulfill
   */
  async purchaseInPopUpReview() {
    if (await this.isTextVisible("Review")) {
      await this.checkAutoPurchase();
      await this.clickBtnCheckout();
    }
  }
  async switchToTabInFulfillment(tab: string) {
    const xpath = this.page.locator(
      `(//nav[contains(@class,'s-tabs-nav')]//li//span[contains(normalize-space(),'${tab}')])[1]`,
    );
    await xpath.click();
    const xpathOrder = this.page.locator(`//span[normalize-space()='ORDER']//parent::th`);
    let i = 0;
    while (i < 5 && !xpathOrder.isVisible()) {
      i++;
      await this.page.reload();
      await xpath.click();
      await this.page.waitForSelector(`//span[normalize-space()='ORDER']//parent::th`);
    }
  }

  /*
   * Select shipping method on Fulfill orders page
   */
  async selectShippingMethod(value: string) {
    const xpathShippingMethod = this.page.locator("//td[contains(@class,'shipping-method text-right')]//select");
    await xpathShippingMethod.selectOption({ label: value });
  }

  /*
   * Input product name or Purchase number
   * Then press Enter
   */
  async searchPurchaseOrder(productName: string) {
    const xpathSearchPO = this.page.locator("//input[@placeholder='Search product, purchase number']");
    await xpathSearchPO.fill(productName);
    await xpathSearchPO.press("Enter");
    await this.page.waitForLoadState("networkidle");

    const xpathLoading = "//div[@class='s-loading-table s-w100']";
    try {
      await this.page.locator(xpathLoading).isVisible();
    } catch (e) {
      await this.page.locator(xpathLoading).isHidden();
    }

    const xpathPurchaseOrders =
      `//tr[contains(.,"${productName}")]` +
      `|` +
      `//table//p[normalize-space()="Could not find any purchased order matching ${productName}"]`;
    await this.page.waitForSelector(xpathPurchaseOrders);
  }

  /*
   * Get count order in tab
   * @param orderName, tabName
   */
  async countOrderInTab(orderName: string, tabName: string) {
    let arrCount = "1";
    const xpathTabName = `//div[contains(@class,'s-tabs')]//*[contains(text(),'${tabName}')]`;
    const xpathOrder =
      `//table//tr[descendant::*[normalize-space()='${orderName}']]` +
      `|` +
      `//table//p[normalize-space()='Could not find any orders matching ${orderName}']` +
      `|` +
      `//table//p[normalize-space()='You have no order that needs to fulfill yet.']` +
      `|` +
      `//table//p[normalize-space()='Could not find any orders matching']` +
      `|` +
      `//table//p[normalize-space()='No order']` +
      `|` +
      `//table//p[normalize-space()='Orders that have sent fulfillment request to PlusHub but have yet to be processed.']` +
      `|` +
      `//table//p[normalize-space()='All orders that have fulfillment request sent successfully will be listed here.']` +
      `|` +
      `//table//p[normalize-space()='Psst... Processing orders will be displayed here.']` +
      `|` +
      `//table//p[normalize-space()='Orders have been fulfilled will be display here.']` +
      `|` +
      `//table//p[normalize-space()='Items are on the way to warehouse will be displayed here.']`;

    await this.page.waitForLoadState("networkidle");
    await this.page.locator(xpathTabName).click();
    await this.waitUntilElementVisible(xpathOrder);

    if (tabName !== "Fulfilled") {
      const tabCount = (await this.page.textContent(xpathTabName)).trim().split(" ");
      arrCount = tabCount[tabCount.length - 1].replace(/[)(]/g, "");
    }
    return arrCount;
  }

  async isOrderVisiableInTab(orderName: string, tabName: string, maxRetry: number): Promise<boolean> {
    let countStr: string;
    for (let i = 0; i < maxRetry; i++) {
      countStr = await this.countOrderInTab(orderName, tabName);
      if (
        countStr !== "1" ||
        (await this.page.isVisible(`//table//tr[descendant::*[normalize-space()='${orderName}']]`)) === false
      ) {
        await this.switchToTabInFulfillment("Sent fulfillment request");
        await this.page.waitForLoadState("networkidle");
        await this.waitUntilElementInvisible(`//div[@class='s-loading-table']`);
        await this.switchToTabInFulfillment(tabName);
        continue;
      }
      return true;
    }

    return false;
  }

  /*
   * Get count purchase orders in tab
   * @param orderName, tabName
   */
  async countPurchaseOrdersInTab(productName: string, tabName: string) {
    const xpathTabName = `//div[@class='s-tabs']//span[contains(text(),'${tabName}')]`;
    const xpathPurchaseOrders =
      `//tr[@class='purchase-order-row' and contains(.,"${productName}")]` +
      `|` +
      `//table//p[normalize-space()="Could not find any purchased order matching ${productName}"]`;

    await this.page.waitForSelector(xpathTabName);
    await this.page.locator(xpathTabName).click();
    // Wait do sau khi click có chút delay => chưa call ngay API
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector(xpathPurchaseOrders);
    const arrCount = (await this.page.textContent(xpathTabName)).trim().split(" ");
    return arrCount[arrCount.length - 1].replace(/[)(]/g, "");
  }

  /*
   * Get Purchase number
   */
  async getPurchaseOrderInWarehouse(index = 1) {
    return (
      await this.page.locator(`(//tr[@class='purchase-order-row']//td[@class='name'])[${index}]`).textContent()
    ).trim();
  }

  /*
   * Get stockPickingID in Fulfillment PlusHub
   */
  async getStockPickingID(index = 1): Promise<number> {
    await this.page.locator(`(//tr[@class='purchase-order-row']//td[@class='name'])[${index}]`).click();
    await this.page.waitForLoadState("load");
    const url = new URL(this.page.url());
    const stockPickingID = url.searchParams.get("stock_picking_id");
    return parseInt(stockPickingID);
  }

  /**
   * I will import tracking number by csv file
   * @param fileName the path of csv file to import
   */
  async importTracking(fileName: string) {
    await this.page.waitForSelector(`//button/span[text()[normalize-space()="Import tracking"]]`);
    await this.page.click(`//button/span[text()[normalize-space()="Import tracking"]]`);
    await Promise.all([this.page.waitForEvent("filechooser"), await this.page.locator('input[type="file"]').click()]);
    await this.page.locator('input[type="file"]').setInputFiles(fileName);
    await this.page.click(`//button/span[text()[normalize-space()="Upload File"]]`);
  }

  /**
   * I will get content in CSV file follow the number of row
   * @param filePath the path of CSV file to import
   * @param delimiter character that use to separate
   * @param fromLine number of line to start get content
   * @param toLine number of line to end get content
   * @returns
   */
  async getContentOfRowInCSVFile(filePath: string, delimiter = ",", fromLine = 2, toLine = 2): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      const data: string[][] = [];
      const options: Options = {
        delimiter: delimiter,
        skipEmptyLines: true,
        fromLine: fromLine,
        toLine: toLine,
      };
      fs.createReadStream(filePath)
        .pipe(csv.parse(options))
        .on("data", function (row) {
          data.push(row);
        })
        .on("end", function () {
          resolve(data);
        })
        .on("error", function (error) {
          return reject(error);
        });
    });
  }

  /**
   * Remove filter order PlusHub
   */
  async removeFilterOrderPlusHub() {
    const xpathFilter = "//div[contains(text(),'Order Date')]/following-sibling::span//i";
    if (await this.isElementExisted(xpathFilter)) {
      await this.page.locator(xpathFilter).click();
      await this.waitUntilElementInvisible(`//div[@class='s-loading-table']`);
    }
  }

  /**
   * Search order của từng tab trong màn Fulfillment PlusHub
   * @param orderNumber
   */
  async searchOrderInFulfillmentTab(orderNumber: string) {
    const xpathSearch = this.page.locator("//input[@placeholder='Search orders']");
    await xpathSearch.focus();
    await xpathSearch.fill(orderNumber);
    await this.waitUntilElementInvisible(`//div[@class='s-loading-table']`);
    await this.page.keyboard.press("Enter");
  }

  /**
   * navigateToFulfillmentTab in  Fulfillment PlusHub
   * @param tabName
   */
  async navigateToFulfillmentTab(tabName: string) {
    // eslint-disable-next-line max-len
    const xpath = this.page.locator(
      `//div[contains(@class,'fulfillment')]//child::span[contains(text(),'${tabName}')]` +
        `|` +
        `//div[contains(@class,'fulfillment')]//div//child::p[contains(text(),'${tabName}')]`,
    );
    await xpath.click();
    await this.page.waitForLoadState("load");
  }

  /**
   * navigate to sub menu Shopbase fulfillment(UI mới)
   * @param menu
   */
  async navigateToMenuFulfillment(menu: string): Promise<void> {
    const xpathMenu = this.page.locator(
      `(//li[@class='tree-menu-li expand fulfillment-sbase']//ul[@class='tree-menu-ul']//li//a[normalize-space()='${menu}'])[2]`,
    );
    await xpathMenu.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * get quantity trong fulfillment tab
   */
  async getQuantityInFulfillTab() {
    return await this.getTextContent("(//td[contains(@class,'shipping-method')]//preceding-sibling::td[1])[1]");
  }

  /**
   * get basecost
   */
  async getBaseCostPerItem(): Promise<string> {
    return await this.getTextContent("//td[@class='base-cost'][2]");
  }

  // get shipping fee của fulfillment
  async getShippingFee(): Promise<string> {
    return await this.getTextContent(`(//td[@class='base-cost']//span)[1]`);
  }

  //get total purchase in popup
  async getTotalInPopupPayment(): Promise<string> {
    await this.page.waitForSelector(`//p[@class='sidebar-title' and normalize-space()='Make a payment']`);
    return await this.getTextContent(`//p[text()='Total']//parent::div//following-sibling::div//p`);
  }

  /**
   * Get shipping method on Fulfill orders page
   * @param orderName
   */
  async getFirstFulfillmentShippingMethod(orderName: string) {
    const xpath = `//tr/td[contains(normalize-space(),'${orderName}')]/following-sibling::td[contains(@class, 'shipping-method')]//option[1]`;
    return (await this.page.locator(xpath).textContent()).trim();
  }

  /**
   * Action select checkbox to fulfill on fulfillment page
   * @param orderName
   */
  async selectOrderToFulfillByOrderName(orderName: string) {
    const locator = this.page.locator(
      `//tr[contains(normalize-space(), '${orderName}')]/td[@class='order-select']//label`,
    );

    for (const el of await locator.elementHandles()) {
      await el.click();
    }
  }

  /**
   *select line items in Claim detail
   */
  async selectLineItem(index: number, isChecked: boolean) {
    const checkboxItemClaim = `//label[@class='s-checkbox']//span[@class='s-check'][${index}]`;
    if (isChecked === true) {
      await this.page.check(checkboxItemClaim);
    } else {
      await this.page.uncheck(checkboxItemClaim);
    }
  }
  /**
   * select a reason for claim
   */
  async selectReason(reason: string) {
    await this.genLoc(`//div[@class="s-select select-reason"]//select`).selectOption(reason);
    await this.page.waitForLoadState("load");
  }

  /**
   * input claim evidence
   */
  async inputClaimEnvidence(envidence: string) {
    await this.page.locator(`//div[@class='s-textarea']//textarea`).fill(envidence);
    await this.page.waitForLoadState("load");
  }

  /**
   * get tên claims sau khi tạo
   */
  async getFirstClaim(): Promise<string> {
    return await this.getTextContent(`//tr[@class='claim-row'][1]//td[@class='name']//a`);
  }

  /**
   * get status của claim hiển thị ở màn claim list
   * @param orderName
   */
  async getStatusClaim(orderNumber: string): Promise<string> {
    return await this.getTextContent(
      `(//td[normalize-space()='${orderNumber}']//parent::tr//td[@class='status']//div//span)[1]`,
    );
  }

  /**
   * Get Claim ID in Fulfillment PlusHub
   * @param orderName
   */
  async getClaimID(orderNumber: string): Promise<number> {
    await this.page.locator(`(//td[normalize-space()='${orderNumber}']//parent::tr//td[@class='name'])[1]`).click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector(`//a[normalize-space()='${orderNumber}']`);
    const url = this.page.url();
    const urlParts = url.split("/");
    const claimID = urlParts[urlParts.length - 3];
    return parseInt(claimID);
  }

  /**
   * Get infor claim: status, date, claimName..
   * @param orderName
   */
  async getInfoClaims(claimName: string): Promise<string> {
    return await this.getTextContent(`//a[normalize-space()='${claimName}']//ancestor::tr`);
  }

  /**
   * navigate đến Claim tab(New, In review, Approved, Reject, Canceled, All claims)
   * @param tabName
   */
  async navigateToClaimTab(tabName: string) {
    await this.page
      .locator(`//div[contains(@class,'claims__tabs')]//p[contains(normalize-space(),'${tabName}')]`)
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Mapping product in fulfillment plushub in shop template
   * @param productName: tên product được chọn để map
   * @param dataMapProduct : Array<DataMapVariantProduct>
   */
  async mappingProduct(productName: string, dataMapProduct: Array<DataMapVariantProduct>): Promise<void> {
    await this.page.locator(this.xpathBtnChangeMapping).click();
    await this.waitUntilElementVisible(`(//*[contains(text(),"Product Mapping")])[1]`);
    await this.page.waitForSelector(`[placeholder="Search product by name"]`);

    await expect(async () => {
      await this.page.reload();
      await this.page.getByPlaceholder("Search product by name").click();
      await this.page.getByPlaceholder("Search product by name").fill(productName);
      await this.page.getByPlaceholder("Search product by name").press("Enter");
      await this.page.waitForLoadState("networkidle");
      await this.page.waitForSelector(`//div[contains(text(),"${productName}")]`);
      await this.page.locator(`//button[child::span[text()[normalize-space()='Set']]]`).first().click();
      expect(
        await this.page.locator(`//button[child::span[text()[normalize-space()='Set']]]`).first().isEnabled(),
      ).toBeFalsy();
    }).toPass();
    //Map variant product
    for (let i = 0; i < dataMapProduct.length; i++) {
      if (await this.page.isChecked(`//span[text()='${dataMapProduct[i].attribute_name}']/preceding-sibling::input`)) {
        await this.genLoc(`//span[text()='${dataMapProduct[i].attribute_name}']/preceding-sibling::span`).click({
          delay: 1000,
        });
      }

      await this.genLoc(`//span[text()='${dataMapProduct[i].attribute_name}']/preceding-sibling::span`).click({
        delay: 1000,
      });
      for (let j = 0; j < dataMapProduct[i].variant_mapping.length; j++) {
        const droplist = this.page.locator(
          `//span[text()='${dataMapProduct[i].variant_mapping[j].variant_base}']/ancestor::div[@class='col-xs-6']/following-sibling::div//select`,
        );
        await droplist.scrollIntoViewIfNeeded();
        await droplist.selectOption({ label: `${dataMapProduct[i].variant_mapping[j].variant_product}` });
      }
    }
    //Click Save
    // eslint-disable-next-line playwright/no-force-option
    await this.page.waitForTimeout(2000);
    await this.page
      .locator(`//span[normalize-space()='Discard']/following::span[normalize-space()='Save changes']`)
      .click();
    await this.waitUntilElementInvisible(
      `(//button[contains(@class, 'is-loading') and normalize-space()='Save changes'])[1]`,
    );
  }
}
