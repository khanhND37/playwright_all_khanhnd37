import { APIRequestContext, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { addDays, formatDate, getUnixTime } from "@core/utils/datetime";
import type { Card, InfoInvoiceBilling } from "@types";

export class BillingPage extends SBPage {
  xpathClosePopup = "//button[contains(@class, 's-modal-close')]";
  xpathContentPopup = "//div[contains(@class,'s-modal-body')]//div";
  xpathStatusFirstLine = "//tbody//tr[1]//td[5]//span//span";
  xpathAlertContent = "(//div[contains(@class, 'alert__content')]//span)[1]";
  xpathAlertFrozenPage = "//div[contains(@class, 'alert__description')]";
  xpathBillingFrozenAddress = "//div[contains(@class, 'billing-information-view')]";
  xpathBillingFrozenInputCard = "//div[contains(@class, 'braintree-card-form')]";
  xpathAlertTitle = "//span[contains(@class, 'alert__title')]";
  xpathToBillingList = '//a[@href="/admin/settings/billing"]';
  xpathAllBillsLabel = '//h4[text()="All bills"]';
  xpathAmountInFirstBill = '//table[contains(@class,"billing-table")]//tr[1]/td[3]';

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * go to Billing page
   */
  async goToBilling(domain: string) {
    await this.page.goto(`https://${domain}/admin/settings/billing`);
    await this.isDBPageDisplay("Billing");
  }

  /*
   * get data by column label
   * param: label, rowIndex
   */
  async getDataByColumnLabel(label: string, rowIndex: number): Promise<string> {
    await this.page.waitForSelector("//table//tbody");
    const xpathRow = await this.page.locator(`//table//tr//th[normalize-space()='${label}']/preceding-sibling::th`);
    const colIndex = (await xpathRow.count()) + 1;
    const xpathData = `//table/tbody//tr[${rowIndex}]//td[${colIndex}]`;
    await this.page.waitForSelector(xpathData);
    const data = (await this.getTextContent(xpathData)).trim();
    return data;
  }

  /**
   * wait for billing table visible
   */
  async waitForBillingTable() {
    await this.page.waitForSelector("//table[contains(@class,'billing-table')]");
  }

  /**
   * get previous date and convert to unix time
   * hard code 15:15:27 to display time in day
   */
  async unixTimePreviousDate(): Promise<number> {
    const previousDate = formatDate(addDays(-1, new Date()), "MMM DD YYYY");
    return getUnixTime(previousDate + " 15:15:27") / 1000;
  }

  /**
   * remove 18 days to frozen this store and convert to unix time
   * hard code 15:15:27 to display time in day
   */
  async remove18DaysAndConvertUnixTime(): Promise<number> {
    const remove18Days = formatDate(addDays(-18, new Date()), "MMM DD YYYY");
    return getUnixTime(remove18Days + " 15:15:27") / 1000;
  }
  /**
   * get current date from billing table
   * @returns dateCurrentPlan
   */
  async getCurrentDatePlan(): Promise<string> {
    const dateCurrentPlan = await this.getDataByColumnLabel("Name", 1);
    return dateCurrentPlan;
  }

  /**
   * format date to matching with text into Invoice detail page
   * @returns
   */
  async formatDateForVerifyBanlance(): Promise<string> {
    const dateCurrentPlan = await this.getCurrentDatePlan();
    const startPlan = formatDate(new Date(dateCurrentPlan.split("-")[0]), "MMMD,YYYY");
    const endPlan = formatDate(new Date(dateCurrentPlan.split("-")[1]), "MMMD,YYYY");
    return `${startPlan}-${endPlan}`;
  }

  /**
   *Input card infor to reopen frozen store
   */
  async inputCardInfor(card: Card) {
    const iframeCardNumber = "//div[contains(@id, 'cc-number')]//iframe";
    const iframeExpries = "//div[contains(@id, 'cc-expiration')]//iframe";
    const iframeCVC = "//div[contains(@id, 'cc-cvv')]//iframe";
    const inputCardNumber = "//input[contains(@id, 'credit-card-number')]";
    const inputExpries = "//input[contains(@id, 'expiration') and contains(@placeholder, 'MM / YY')]";
    const inputCVC = "//input[contains(@id, 'cvv') and contains(@placeholder, 'CVC')]";

    await this.page.frameLocator(iframeCardNumber).locator(inputCardNumber).fill(card.number);
    await this.page.frameLocator(iframeExpries).locator(inputExpries).fill(card.expire_date);
    await this.page.frameLocator(iframeCVC).locator(inputCVC).fill(card.cvv);
  }

  /**
   * reopen store frozen
   */
  async reopenStoreFrozen(card: Card, shopId: number) {
    await this.inputCardInfor(card);
    await this.clickOnBtnLinkWithLabel("Confirm");
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForURL(
      `https://${this.domain}/admin/settings/account?identify_shop_status=active&shop_id=${shopId}&isShowSuccessChangePlan=true`,
      { timeout: 300 * 100 },
    );
  }

  /**
   * get info of the current package apply for store by api
   * @param request call to API
   * @param domainApi is domain env
   * @param shopId is shop id
   */
  async getInfoCurrentPackageByAPI(request: APIRequestContext, domainApi: string, shopId: string): Promise<object> {
    const response = await request.get(`${domainApi}/v1/payment/package-group?shop_id=${shopId}`);
    if (!response.ok()) {
      return Promise.reject("Error: Check domain api or shop id again.");
    } else {
      const resBody = await response.json();
      return resBody.current_package;
    }
  }

  /**
   * get the newest invoice billing by api
   * @param request call to API
   * @param domainApi is domain env
   * @param shopId is shop id
   * @param index is the invoice's index need to get in api
   * @param accessToken input if api return 401: Unauthorized
   * @returns
   */
  async getInvoiceBillingWithIndexByAPI(
    request: APIRequestContext,
    domainApi: string,
    shopId: string,
    index: number,
    accessToken?: string,
  ): Promise<InfoInvoiceBilling> {
    let response;
    if (accessToken) {
      response = await request.get(`${domainApi}/v1/payment/invoices?shop_id=${shopId}`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      });
    } else {
      response = await request.get(`${domainApi}/v1/payment/invoices?shop_id=${shopId}`);
    }
    if (!response.ok()) {
      return Promise.reject("Error: Check domain api or shop id again.");
    } else {
      const resBody = await response.json();
      return resBody.invoices[index];
    }
  }

  /**
   * calulate date from start date to end date
   * @param startDate is start date, need to convert unixtime with getTime()
   * @param endDate is start date, need to convert unixtime with getTime()
   * @returns
   */
  async calDate(startDate: number, endDate: number): Promise<number> {
    return Math.floor((endDate - startDate) / (1000 * 3600 * 24));
  }

  /**
   * get status of the first line billing at Billing page
   * @returns
   */
  async getStatusInvoiceBilling() {
    const text = await this.page.locator(this.xpathStatusFirstLine).textContent();
    return text
      .replace(/(\n|\t)/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}
