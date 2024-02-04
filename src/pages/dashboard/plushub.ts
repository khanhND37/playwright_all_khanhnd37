import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";
import type { Quotation } from "@types";

export class PlusHubPage extends SBPage {
  xpathSearchProdInFindProduct = `input[placeholder='Search quotation by Quotation number, Product name']:visible`;
  xpahtRequestList = "//*[@class='catalog-products-review row']";
  xpathDropdownActions =
    "(//div[child::div[@class='s-dropdown-trigger'] and descendant::div[normalize-space()='Actions']])[1]";
  xpahtFirstRequest = "(//div[contains(@class,'product-review__name')])[1]";
  xpathStatusFirstRequest = "(//span[contains(@class,'sb-badge')])[1]";

  getXpathAction(action: string): string {
    return `//button[descendant::span[normalize-space()='${action}']]`;
  }

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Search SO in Requests Product page in PlusHub
   * @param keySearch product name| SO name of request
   */
  async searchAndGotoSODetail(keySearch: string) {
    await this.searchQuotation(keySearch);
    await this.page.locator("(//div[contains(@class,'product-review__name')])[1]").click();
    await this.page.waitForSelector("//div[@class='quotation-detail']");
  }

  /**
   * Go to request detail
   * @param quotationId id of quotation
   */
  async goToRequestDetail(quotationId: number) {
    await this.page.goto(`https://${this.domain}/admin/fulfillment/dropship/quotations/${quotationId}`);
  }

  async searchQuotation(keySearch: string) {
    await this.genLoc(this.xpathSearchProdInFindProduct).fill(keySearch);
    await this.genLoc(this.xpathSearchProdInFindProduct).press("Enter");
    // wait for call api
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState("networkidle");
  }
  /**
   * Go to Warehouse page on PlusHub
   */
  async goToWarehouse() {
    await this.page.goto(`https://${this.domain}/admin/fulfillment/dropship/warehouse`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Click on button View available stocks in SO detail on PlusHub
   */
  async clickOnBtnViewStock() {
    await this.page.locator("//*[text()[normalize-space()='View available stocks']]").click();
    await this.page.waitForLoadState("load");
  }

  /**
   * Search product in Warehouse page on PlusHub
   * @param productName
   */
  async searchProductInWarehouse(productName: string) {
    //search product
    await this.genLoc("//input[contains(@placeholder,'Search product')]").fill(productName);
    //Press Enter
    await this.genLoc("//input[contains(@placeholder,'Search product')]").press("Enter");
    await this.page.waitForSelector(".product-list");
  }

  /**
   * Request find product
   * @param url is url of product
   */
  async requestFindProduct(url: string) {
    await this.clickOnBtnLinkWithLabel("Request products");
    const xpathRequestFindProduct = this.page.locator(`//*[contains(@placeholder,"Enter request product link")]`);
    await xpathRequestFindProduct.fill(url);
    await this.clickElementWithLabel("span", "Add Link");
    await this.clickOnBtnLinkWithLabel("Send request");
  }

  /**
   * Get data quotation detail
   * @returns data quotation detail
   */
  async getDataQuotation(): Promise<Quotation> {
    const quotationStatus = await this.page.innerText("(//div[@class='d-flex align-items-center']//span)[1]");
    const quotationName = (await this.getTextContent("//div[contains(text(),'Request')]")).split(" ")[1];
    const urlRequest = await this.page.innerText("//a[@class='text-nowrap-ellipsis m-t-sm']//span");
    const url = new URL(this.page.url());
    const quotationId = +url.pathname.split("/").pop();
    let productName = "";
    let price = "";
    let processingTime = "";
    let expirationDate = "";
    if (quotationStatus === "Available" || quotationStatus === "Expired") {
      productName = await this.page.innerText(
        "//div[@class='content-section']//div[contains(@class, 'quotation-title m-b-md')]",
      );
      price = await this.page.innerText("//div[@class='price m-b-xs']//div[contains(@class, 'price-value')]");
      expirationDate = await this.page.innerText("//div[@class='exp-date attr']//div[contains(@class, 'content')]");
      processingTime = await this.page.innerText(
        "//div[@class='purchase-order-est attr']//div[contains(@class, 'content d-flex align-items-center')]",
      );
    }
    return {
      quotation_status: quotationStatus,
      quotation_name: quotationName,
      url_request: urlRequest,
      id: quotationId,
      product_name: productName,
      price: price,
      processing_time: processingTime,
      expiration_date: expirationDate,
    };
  }
}
