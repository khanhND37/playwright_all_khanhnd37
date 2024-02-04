import { APIRequestContext, expect, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { InforCustumer, OrderPrintHub } from "@types";

export class PrintHubPage extends SBPage {
  xpathTitleImportOrderFail =
    "//h4[normalize-space()='CSV errors found'] | //h4[normalize-space()='Preview your first order']";
  xpathTitlePreview = "//h4[normalize-space()='Preview your first order']";
  xpathModelContentOrder =
    "//div[@class='s-animation-content s-modal-content'] | //div[contains(@class,'sb-popup__container')]";
  xpathAllCheckbox =
    "(//div[contains(@class, 'sb-tab-panel sb-text sb-p-medium') and not(@style='display: none;')]//span[@class='sb-check'])[1]";
  xpathTableLoad = "//div[@class='s-loading-table']";
  xpathOrderDetail = "(//td[@class='sb-table__expanded-cell'])[1]";
  xpathStatusLoad = "//span[@class='s-icon icon-loading is-small']";
  xpathPriceInfoOnOrder = "//div[contains(@class,'sb-flex sb-flex-justify-end sb-mt-medium')]";
  xpathWarningMessage = "//div[contains(@class,'fail-reason')]";
  urlImportPage = "/admin/apps/print-hub/manage-orders/import";
  urlToManageOrderPhub = "/admin/apps/print-hub/manage-orders";
  urlClipartPage = "/admin/apps/print-hub/clipart";
  urlCampaignPage = "/admin/apps/print-hub/campaign/list";
  urlCatalogPage = "/admin/apps/print-hub/catalog";
  xpathPopupConfirmPayment = "//div[contains(@class,'sb-popup__container')]";
  xpathTogglePaymentDisable = "//label[@class='sb-switch__button sb-relative sb-pointer']";
  xpathTogglePaymentEnable = "//div[@class='sb-switch sb-flex-inline sb-switch--active']";
  xpathBtnPayNow = "//li[normalize-space()='Pay now']";
  xpathImageLoad = "//div[@class='sb-image__loading sb-absolute']";
  xpathInputFirstDate =
    "//div[contains(@class,'sb-popover sb-popover__popper') and not(contains(@style, 'display: none'))]//div[contains(@class,'sb-flex sb-date-picker__input sb-flex-align-center sb-popover__reference')]//div[contains(@class,'sb-date-picker__input-first')]//input";
  xpathInputSecondDate =
    "//div[contains(@class,'sb-popover sb-popover__popper') and not(contains(@style, 'display: none'))]//div[contains(@class,'sb-flex sb-date-picker__input sb-flex-align-center sb-popover__reference')]//div[contains(@class,'sb-date-picker__input-second')]//input";
  xpathSearchOrder =
    "//div[contains(@class, 'sb-tab-panel sb-text sb-p-medium') and not(@style='display: none;')]//input[@placeholder='Search orders by name or product name']";
  xpathSkUName = "//span[@class='pointer text-underline']";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Xpath order name
   * * @param orderName : name of order
   * @returns
   */
  getXpathOrderName(orderName: string): string {
    return `//div[contains(@class, 'sb-tab-panel sb-text sb-p-medium') and not(@style='display: none;')]//span[normalize-space()='${orderName}'] | //a[normalize-space()='${orderName}']`;
  }

  /**
   * Xpath status order
   * * @param status : status of order
   * @returns
   */
  getXpathStatusOfOrder(status: string): string {
    return `//span[normalize-space()='${status}']`;
  }

  /**
   * Xpath sku of line item on order Phub
   * * @param productname : product name of line item
   * * @param sku : sku of line item
   * @returns
   */
  getXpathSkuLineItem(productname: string, sku: string): string {
    return `//a[normalize-space()='${productname}']//ancestor::div[@class='sb-pl-large']//span[contains(text(),'${sku}')]`;
  }

  /**
   * Xpath order name
   * * @param orderName : name of order
   * @returns
   */
  getXpathCheckboxOrderName(orderName: string): string {
    return `//span[normalize-space()='${orderName}']//ancestor::tr[@class='sb-table__row order-expanded cursor-default row-order']//span[@class='sb-check']`;
  }

  /*
   * Switch tab in All orders screen
   * @param: tabName: Name of tab
   */
  async switchTabInAllOrders(tabName: string) {
    const xpathTab = `//div[contains(@class,'sb-tab-navigation')]//div[contains(text(),"${tabName}")]`;
    const xpathTableLoading = "//div[@class='s-loading-table']";
    await this.page.click(xpathTab);
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.locator(xpathTableLoading).isHidden();
  }

  /**
   * Delete order in tab any
   * @param tabName: Name of tab
   * */

  async deleteOrderInTab(tabName) {
    await this.switchTabInAllOrders(tabName);
    const xpathAllCheckbox =
      "(//div[contains(@class, 'sb-tab-panel sb-text sb-p-medium') and not(@style='display: none;')]//label[not(contains(@class,'is-disabled'))]//span[@class='sb-check'])[1]";
    if (await this.page.locator(xpathAllCheckbox).isVisible({ timeout: 3000 })) {
      await this.page.click(this.xpathAllCheckbox);
      await this.selectActionOrder("Delete selected orders", "Delete");
    }
  }

  /*
   * Pay now for order
   * Click button Pay now
   * @param: Order name
   */
  async payOrder(orderName: string) {
    const xpathPayNow = `//tbody//tr[descendant::span[normalize-space()='${orderName}']]//button[normalize-space()='Pay now']`;
    await this.page.waitForSelector(xpathPayNow);
    await this.clickOnBtnWithLabel("Pay now");

    const xpathConfirmPayment = "//button[normalize-space()='Confirm payment']";
    await this.page.waitForSelector(xpathConfirmPayment);
    await this.clickOnBtnWithLabel("Confirm payment");

    const xpathMsgSuccess = "//div[@class='s-toast is-success is-bottom']";
    await this.waitUntilElementVisible(xpathMsgSuccess);
  }

  /**
   * Search order
   * @param orderName order name need input
   */
  async searchOrder(orderName: string) {
    await this.page.fill(
      "//div[contains(@class, 'sb-tab-panel sb-text sb-p-medium') and not(@style='display: none;')]//input[@placeholder='Search orders by name or product name']",
      orderName,
    );
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get message on screen order list empty
   */
  async getMessageOrderEmpty() {
    return await this.getTextContent("//div[@class='no-orders']//p[contains(@class,'text-bold sb-text-neutral')]");
  }

  /**
   * Get number on tab
   * @param countNumberOrder: number order
   * @returns
   */
  async getNumberOrder(): Promise<number> {
    const countNumberOrder = await this.page.locator("//span[@class='sb-mr-small word-break order_name']").count();
    return countNumberOrder;
  }

  /**
   * wait for order synced to phub order
   * @param orderName: name of order
   * @returns
   */
  async waitSyncOrderPrintHub(orderName: string, tabName: string, retries = 8): Promise<boolean> {
    let sync = false;
    const xpathOrder = `//span[normalize-space()='${orderName}']`;
    for (let i = 0; i < retries; i++) {
      await this.page.waitForTimeout(10000);
      if (await this.page.locator(xpathOrder).isVisible({ timeout: 20000 })) {
        sync = true;
        return sync;
      }
      await this.page.reload();
      await this.page.click(`//div[contains(@class,'sb-tab-navigation')]//div[contains(text(),"${tabName}")]`);
    }
    return sync;
  }

  /**
   * get order status
   * @returns
   */
  async getOrderStatus(): Promise<string> {
    const xpathOrderStatus = "//span[contains(@class,'sb-text-center sb-flex-inline')]";
    await this.page.locator(xpathOrderStatus).isVisible();
    return await this.getTextContent(xpathOrderStatus);
  }

  /**
   * Select action for order
   * @param actionName: name of action
   */
  async selectActionOrder(actionName: string, confirmBtn: string) {
    await this.page.click(`//span[normalize-space()='Action'] | //button[normalize-space()='Actions']`);
    await this.page.click(`//li[normalize-space()='${actionName}']`);
    await this.page.click(
      `//div[contains(@class,'sb-popup__container')]//span[normalize-space()="${confirmBtn}"]|//button[normalize-space()="${confirmBtn}"]`,
    );
  }

  /**
   *upload file
   * @param pathFile: path of file
   *
   * */
  async uploadFile(pathFile: string, index = 1) {
    await this.page.setInputFiles(`(//input[@type="file"])[${index}]`, pathFile);
  }

  /**
   * count number line tiem on order phub
   * @param countNumberLineItem: number line item of 1 order
   * @returns
   */
  async countNumberLineItemOnOrder(): Promise<number> {
    const countNumberLineItem = await this.page
      .locator("//td[@class='sb-table__expanded-cell']//tr[@class='sb-table__row']")
      .count();
    return countNumberLineItem;
  }

  /**
   *Get order filter with date
   * @param startDate: date start filter
   * @param endDate: data end filter
   * */

  async getOrderFilterByDate(authRequest: APIRequestContext, startDate, endDate) {
    const response = await authRequest.get(
      `https://${this.domain}/admin/phub-order/import-orders.json?tab=all&from_date=${startDate}&to_date=${endDate}`,
    );
    expect(response.ok()).toBeTruthy();
    const jsonData = await response.json();
    return jsonData;
  }

  /**
   * select data when fill data
   * @param fieldName: field fill data
   * @param value: valua fill
   * */
  async selectDataInput(fieldName: string, value: string, index = 1) {
    const xpathInput = `(//label[normalize-space()='${fieldName}'])[${index}]/parent::div//following-sibling::div//input`;
    await this.page.locator(xpathInput).click();
    await this.page.locator(xpathInput).fill(value);
    await this.page.click(`//div[normalize-space()='${value}' and contains(@class,'sb-text-body-medium')]`);
  }

  /**
   * select from droplist input
   * @param fieldName: field fill data
   * @param value: valua fill
   * */
  async selectDataDroplist(fieldName: string, value: string, index = 1) {
    await this.page
      .locator(
        `(//label[normalize-space()='${fieldName}'])[${index}]//parent::div//following-sibling::div//*[name()='svg']`,
      )
      .click();
    await this.page
      .locator(
        `//div[contains(@class,'sb-popover sb-popover__popper') and not(contains(@style, 'display: none'))]//label[normalize-space()='${value}']`,
      )
      .click();
  }

  /**
   * Upload image
   * @param fieldName: field upload
   * @param fileName: value image
   * @param imageType: type image url|image
   * */
  async uploadImageByFieldName(fieldName: string, fileName: string, imageType: string, index = 1) {
    const xpathFieldName = `(//label[normalize-space()="${fieldName}"])[${index}]/parent::div//following-sibling::div`;
    if (await this.page.locator(`${xpathFieldName}//img`).isVisible({ timeout: 10000 })) {
      await this.page.locator(`${xpathFieldName}//img`).hover();
      await this.page.locator(`(${xpathFieldName}//*[name()='svg'])[2]`).click();
      await this.page.waitForSelector(`${xpathFieldName}//img`, { state: "hidden" });
    }
    if (imageType === "url") {
      await this.page.locator(`${xpathFieldName}//input[@placeholder='Use your own URL']`).fill(fileName);
    } else {
      await this.page.locator(`${xpathFieldName}//input[@type="file"]`).setInputFiles(fileName);
    }
    let j = 0;
    let imageLoad;
    do {
      imageLoad = await this.page.locator(`${xpathFieldName}//img`).isVisible();
      //wait timeout vì do ảnh có dung lượng lớn nên load khá lâu
      await this.page.waitForTimeout(5000);
      j++;
    } while (j < 20 && imageLoad);
  }

  /**
   *edit order import
   * @param dataEditOrder: info data Product information
   * @param infoCustomer: info customer
   * */
  async editOrderPrintHub(dataEditOrder: Array<OrderPrintHub>, infoCustomer?: InforCustumer) {
    const countXpathImageLoad = await this.page.locator(this.xpathImageLoad).count();
    for (let i = 1; i <= countXpathImageLoad; i++) {
      let j = 0;
      let imageLoad;
      do {
        imageLoad = await this.page.locator(`(${this.xpathImageLoad})[${i}]`).isVisible();
        //wait timeout vì do ảnh có dung lượng lớn nên load khá lâu
        await this.page.waitForTimeout(5000);
        j++;
      } while (j < 10 && imageLoad);
    }
    for (let i = 0; i < dataEditOrder.length; i++) {
      for (const [key, value] of Object.entries(dataEditOrder[i])) {
        const iconDeleteBaseProduct = `((//label[normalize-space()='Base product'])[${
          i + 1
        }]/parent::div//following-sibling::div//*[name()='svg'])[3]`;
        switch (key) {
          case "base_product":
            await this.page.locator(iconDeleteBaseProduct).click();
            await this.page.locator(iconDeleteBaseProduct).isDisabled();
            await this.selectDataInput("Base product", value, i + 1);
            break;
          case "color":
            await this.selectDataDroplist("Color", value, i + 1);
            break;
          case "size":
            await this.selectDataDroplist("Size", value, i + 1);
            break;
          case "front_artwork":
            await this.uploadImageByFieldName("Front Artwork", value, dataEditOrder[i].front_artwork_type, i + 1);
            break;
          case "back_artwork":
            await this.uploadImageByFieldName("Back Artwork", value, dataEditOrder[i].back_artwork_type, i + 1);
            break;
          case "front_mockup":
            await this.uploadImageByFieldName("Front Mockup", value, dataEditOrder[i].front_mockup_type, i + 1);
            break;
          case "back_mockup":
            await this.uploadImageByFieldName("Back Mockup", value, dataEditOrder[i].back_mockup_type, i + 1);
            break;
        }
      }
    }
    if (infoCustomer) {
      const xpathIconArrow =
        "(//div[normalize-space()='Buyer information'])//parent::div//following-sibling::div//span[contains(@class,'sb-collapse-item__arrow')]";
      const iconDeleteCountry = `((//label[normalize-space()='Country'])/parent::div//following-sibling::div//*[name()='svg'])[3]`;

      if (await this.page.locator(xpathIconArrow).isVisible({ timeout: 10000 })) {
        await this.page.locator(xpathIconArrow).click();
      }
      for (const [key, value] of Object.entries(infoCustomer)) {
        switch (key) {
          case "first_name":
            await this.inputTextBoxWithLabel("First name", value);
            break;
          case "address":
            await this.inputTextBoxWithLabel("Address", value);
            break;
          case "country":
            if (await this.page.locator(iconDeleteCountry).isVisible()) {
              await this.page.locator(iconDeleteCountry).click();
              await this.page.locator(iconDeleteCountry).isDisabled();
            }
            await this.selectDataInput("Country", value);
            break;
          case "province":
            await this.inputTextBoxWithLabel("State/Province", value);
            break;
          case "state":
            await this.selectDataInput("State", value);
            break;
          case "city":
            await this.inputTextBoxWithLabel("City", value);
            break;
          case "zip_code":
            await this.inputTextBoxWithLabel("ZIP/Postal Code", value);
            break;
          case "Phone number":
            await this.inputTextBoxWithLabel("Phone number", value);
            break;
        }
      }
    }
  }
}
