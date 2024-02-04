import { expect, Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { SFHome } from "@pages/storefront/homepage";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFProduct } from "@pages/storefront/product";
import {
  getCurrencySymbolBasedOnCurrencyName,
  removeCurrencySymbol,
  roundingTwoDecimalPlaces,
} from "@core/utils/string";
import type {
  Card,
  PlbRefundCase,
  RefundInfo,
  RefundOrderInput,
  SbOrderLine,
  ShippingAddress,
  CheckoutOrdInfo,
  OrderInfo,
  Order,
  OrderAfterCheckoutInfo,
  OrderTotalAmount,
  Discount,
  ValueLineItem,
  FilterOrder,
  InfoUTMParameters,
} from "@types";
import { profitAfterRefund } from "../../../tests/modules/plusbase/utils/plusbae_profit";
import { PaymentGateway } from "@constants";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { cloneDeep } from "@utils/object";
import { StorefrontInfo } from "tests/modules/dashboard/order/multiple_storefronts/filter_order_with_sf_domain";
import { isEqual } from "@core/utils/checkout";

export enum Action {
  ACTION_APPROVE_ORDER = "Approve order",
  ACTION_HOLD_ORDER = "Hold",
  ACTION_CANCEL_ORDER = "Cancel order",
  ACTION_VIEW = "View order status page",
  ACTION_CANCEL_COMBO = "Cancel/Refund combo line items",
  ACTION_CANCEL_UNIT = "Cancel/Refund unit line items",
  ACTION_VIEW_INVOICE = "View invoice",
  ACTION_VIEW_INVOICE_DISPUTE = "View invoice dispute",
}

export class OrdersPage extends SBPage {
  orderNumber: string;
  revenue: number;
  handlingFee: number;
  profit: number;
  checkout: SFCheckout;
  ppcValue: number;
  isPostPurchase: boolean;

  orderStatus = "//div[contains(@class,'title-bar__orders-show-badge')]//span[contains(@class, 'hide-when-printing')]";
  isShopTemplate = false;
  calculateTextBtn = this.page.locator(`//span[normalize-space()='Show calculation']`);
  xpathDetailLoading = "//div[@class='s-detail-loading']";
  xpathOrderSummary = "//table[contains(@class,'order-details-summary-table')]";
  printOrder = "button:has-text('Print order')";
  xpathMoreActions = "//button[child::span[text()='More actions']]";
  xpathBtnMarkAsFulfilled = "//div[contains(@class,'card__section')]//span[normalize-space()='Mark as fulfilled']";
  xpathBtnResendEmail = "(//span[contains(text(),'Resend email')])[last()]";
  xpathBtnCaptureOrder = "//button[child::span[text()[normalize-space()='Capture payment']]]";
  xpathBtnRefundOrder = "//span[normalize-space()='Refund item']";
  xpathBlockFulfill = "//section[contains(@class,'card fulfillment-card')]";
  xpathResendClaim = `(//*[normalize-space() = 'Resend'])[1]`;
  xpathValueCustomOptionImage = "//section[contains(@class,'card fulfillment-card')]//span[contains(text(),'Image:')]";
  xpathTabActivity = "//p[normalize-space()='Activity']";
  xpathDisputeNotification = `//div[contains(@class,'s-flex chargeback-notification')]`;
  xpathLinkClearOnFilterBox = "//div[contains(@class,'item--active')]//a[normalize-space()='Clear']";
  xpathMoreFilters = "(//span[normalize-space()='More filters'])[1]";
  xpathMoreFiltersOnPLB = "(//span[normalize-space()='More filters'])[2]";
  xpathBtnExportOnPBPLB = "//button/span[contains(normalize-space(),'Export')]";
  xpathSelectOptionSelectedNumberOrderToExport =
    "//span[contains(@class,'sb-check') and contains(normalize-space(), 'Selected')]";
  xpathSelectOptionSelectedNumberOrderToExportOnPBPLB =
    "//span[@class='s-control-label' and contains(normalize-space(), 'Selected')]";
  xpathFiltersLabelInMoreFilter = "//div[text()=' Filters ']";
  xpathNoOrder = "(//div[@class='no-orders'])[1]";
  xpathCalculationText = "//span[normalize-space(text())='Show calculation']";
  xpathLabelAwaitingArtwork = "(//span[normalize-space()='Awaiting artwork'])[2]";
  xpathStatusGenPrintFile = "//span[normalize-space()='Print file has been generated']";
  xpathAlertInProductLine = "(//span[@class='unfulfilled-card__total-price']/following::div)[1]";
  xpathAlertInOrderDetail = "//div[contains(@class,'order-cannot-fulfill-noti')]/descendant::div[@class='text-normal']";
  xpathProfitStatus = "//span[normalize-space()='Profit']/following::span[contains(@class,'warning')]";
  xpathBtnViewConversionDetails = "//button[normalize-space()='View details']";
  xpathItemOrder =
    "//div[@class='sb-tab-panel sb-text sb-p-medium' and not(contains(@style, 'display: none'))]//tr[contains(@class,'row-order')]//a";
  xpathSectionOrder = "//div[@class='order-layout__sections']";
  xpathTitleOrder = "//div[@class='title-bar']//h2";
  xpathSubTitlePopUpHoldPayout = "//div[preceding-sibling::div[text()='Hold from payout']]";
  xpathFirstOrderNameInOrderList = `(//table/tbody)[1]/tr[1]/td[2]//a[@class="order-link"]`;
  xpathBtnSwitchCurrency = "//span[normalize-space()='Switch currency']";
  xpathSelectAllOrder = `//th[contains(@class,'order-select-header')]//span[contains(@class,'check')]`;
  xpathCancelRefundCard = "//div[contains(@class,'order__refund')]//div[@class='card__section']";
  xpathPopupFullSession = "//div[@class='s-modal-body']";
  xpathFirstPageVisited = "//div[child::p[normalize-space()='First page visited']]//following-sibling::div//a";
  xpathOrderList = `//div[contains(@class,'orders-list')]`;
  xpathInputCancelRefundReason = "//input[@placeholder='Search for reason']";
  xpathMsgChargebackWon = "//p[contains(normalize-space(),'A chargeback totalling')]";
  xpathTextOrder = "//h2[contains(text(), 'Order')] | //h3[contains(text(), 'Order')]";
  xpathOrderTimeLineOpenCback =
    "//div[@class = 'content']//div[contains(normalize-space(),'The customer opened a chargeback totalling')]";
  xpathHoldAmountInOrderList(orderName: string) {
    return `(//a[normalize-space()='${orderName}']/following::span[contains(@class,'order-total-value')])[1]`;
  }

  xpathOrderName(orderName: string): string {
    return `(//div[@class="sb-tab-panel sb-text sb-p-medium" and not(@style)]//a//div[normalize-space()='${orderName}'])[1]`;
  }

  xpathOrderNameOnList(orderName: string): string {
    return `(//div[contains(text(),'${orderName}')])[1]|(//div[@class='d-flex']//*[contains(text(),'${orderName}')])[1]`;
  }

  genSelectOrderLoc(orderName: string): Locator {
    return this.page.locator(
      `(//tr[descendant::div[contains(text(),'${orderName}')]]/descendant::span[contains(@class,'sb-check')])[1]`,
    );
  }

  xpathIconActionPrintFile(index = 1): string {
    return `(//i[contains(@class,'mdi-dots-horizontal')])[${index}]`;
  }

  xpathSelectOrder(index = 1): string {
    return `((//tr[contains(@class,'cursor-default')])//span[contains(@class,'check')])[${index}]`;
  }

  //analytics
  xpathOrderSourceIdentifier = "//div[child::p[normalize-space()='Source identifier']]//following-sibling::div//p";
  xpathOrderReferringSite = "//div[child::p[normalize-space()='Referring site']]//following-sibling::div//*";
  xpathOrderUtmSource = "//div[child::p[normalize-space()='Source']]//following-sibling::div//p";
  xpathOrderUtmMedium = "//div[child::p[normalize-space()='Medium']]//following-sibling::div//p";
  xpathOrderUtmCampaign = "//div[child::p[normalize-space()='Campaign']]//following-sibling::div//p";
  xpathOrderUtmTerm = "//div[child::p[normalize-space()='Term']]//following-sibling::div//p";
  xpathOrderUtmContent = "//div[child::p[normalize-space()='Content']]//following-sibling::div//p";

  /**
   * Xpath order name on order list
   * @param index
   */
  getXpathLineItemOrder(index = 1): string {
    return `(//tr[@class='sb-table__row order-expanded cursor-default row-order'])[${index}]`;
  }

  genXpathToastMsg(msg: string): string {
    return (
      `//div[@class='s-toast is-dark is-bottom' or @class = 's-toast is-danger is-bottom' ` +
      `or @class='s-toast is-success is-bottom']` +
      `//div[contains(text(),"${msg}")]`
    );
  }

  xpathActivityLog(totalorder?: number, userEmail?: string, quantityRefund?: number) {
    return {
      activityCapPayment: `//div[contains(text(),'A ${totalorder} USD payment was processed')]`,
      activityRefundOrder: `//div[contains(text(),'${userEmail} refund ${quantityRefund} item of product')]`,
      activityApprovedOrder: `//div[contains(text(),'${userEmail} approve this order')]`,
      activityCanceldOrder: `//div[contains(text(),'${userEmail} canceled partially this authorized order')]`,
      activityHoldOrder: `//div[contains(text(),'${userEmail} hold this order')]`,
      activityHoldLinePOD: `//div[contains(text(),'${userEmail} hold POD product')]`,
    };
  }

  /**
   * Xpath date time picker on filter
   * @param dateTimePicker is Order date | Refund date | Fulfillment date on Filter
   */
  xpathDateTimePickerOnFilter(dateTimePicker: string, index = 1) {
    return `(//div[normalize-space()='${dateTimePicker}']/following-sibling::div//div[contains(@class,'sb-date-picker__input')])[${index}]`;
  }

  async clickOnFieldWithLabelOnFilter(labelName: string) {
    await this.page
      .locator(
        `(${this.xpathFiltersLabelInMoreFilter}/parent::div/following-sibling::div//div[normalize-space() = '${labelName}'])[1]`,
      )
      .click();
  }

  /**
   * @param platform platform = default is Shopbase
   */
  async clickButtonMoreFilters(platform?: "PlusBase" | "PrintBase") {
    switch (platform) {
      case "PlusBase":
        await this.page.locator(this.xpathMoreFiltersOnPLB).click();
        break;
      case "PrintBase":
        await this.page.locator(this.xpathMoreFilters).click();
        break;
      default:
        if (!(await this.page.locator("(//div[normalize-space()='Filters'])[1]").isVisible())) {
          await this.page.locator(this.xpathMoreFilters).click();
        }
        break;
    }
  }

  xpathLabelOnFilter(label: string, index = 1) {
    return `(//*[contains(text(),"${label}")])[${index}]`;
  }

  xpathTextBoxHasPlaceholder(placeHolder: string) {
    return `//input[contains(@placeholder,'${placeHolder}')]`;
  }

  /**
   * Get order info in order list page by order name and following column
   * @param orderName
   * @param column
   * @returns
   */
  getOrderInfoBy(orderName: string, column = 6) {
    return this.getTextContent(
      `//tr[descendant::div[contains(text(),'${orderName}')]]/descendant::td[contains(@class,'column_${column}')]//span`,
    );
  }

  cancelSttLoc = this.page.locator("#order-title-bar >> text=Cancelled");
  moreActionLoc = this.genLoc("//div[@class='action-bar__more']//button");

  /**
   * It returns a locator that is a child of the `#order-title-bar` element and has the text `status` in it.
   * The `>>` is a special character that means "child of".
   * The `text=` is a special character that means "has the text".
   * So, if you call `genOrderStatusLoc('Pending')`, it will return a locator that is a child of the
   * `#order-title-bar` element and has the text `Pending` in it.
   * @param {string} status - string
   * @returns A locator object.
   */
  genOrderStatusLoc(status: string): Locator {
    return this.page.locator(`//span[contains(@class,'s-tag')]//span[normalize-space()='${status}']`);
  }

  genOrderActionLoc(action: string): Locator {
    return this.page.locator(
      `((//span[normalize-space()='${action}'])[last()] | (//a[normalize-space()='${action}'])[last()])[1]`,
    );
  }

  constructor(page: Page, domain: string, isShopTemplate?: boolean) {
    super(page, domain);
    this.isShopTemplate = isShopTemplate;
  }

  dashboard = new DashboardPage(this.page, this.domain);

  async createNewOrder(
    homePage: SFHome,
    productPage: SFProduct,
    checkoutPage: SFCheckout,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataProduct: Array<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>,
  ) {
    await homePage.gotoHomePage();
    const products = dataProduct;
    for (const element of products) {
      productPage = await homePage.searchThenViewProduct(element.product);
      await productPage.inputQuantityProduct(element.quantity);
      await productPage.addProductToCart();
    }
    checkoutPage = await productPage.navigateToCheckoutPage();
    await checkoutPage.inputEmail(data.email);
    await checkoutPage.inputFirstName(data.first_name);
    await checkoutPage.inputLastName(data.last_name);
    await checkoutPage.inputAddress(data.address);
    await checkoutPage.selectCountry(data.country);
    await checkoutPage.selectStateOrProvince(data.state);
    await checkoutPage.inputCity(data.city);
    await checkoutPage.inputZipcode(data.zipcode);
    await checkoutPage.inputPhoneNumber(data.phone_number);
    await checkoutPage.clickBtnContinueToShippingMethod();
    await checkoutPage.continueToPaymentMethod();
    await checkoutPage.inputCardInfoAndCompleteOrder(
      data.card_number,
      data.card_holder_name,
      data.expire_date,
      data.cvv,
    );
    this.orderNumber = await checkoutPage.getOrderNumber();
    return this.orderNumber;
  }

  //access order detail
  // TODO can we remove the param?

  /**
   * Input value filter to search box on Order list then Enter
   * @param value
   */
  async searchOrder(value: string) {
    const xpathSearch = this.page.locator(
      "//div[@class='order-search-form']//input[@placeholder='Search orders'] | (//input[@placeholder='Search by order name, transaction id, line item name'])[1]",
    );
    await xpathSearch.fill(value);
    await this.page.waitForTimeout(2000);
    await xpathSearch.press("Enter");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Search mutiple order in shop template
   * @param values
   */
  async searchMutipleOrders(values: string): Promise<void> {
    await this.clickOnBtnWithLabel("Search multiple orders");
    const xpathSearch = this.page.locator("//textarea[@placeholder='order_id_1,order_id_2,order_id_3']");
    await xpathSearch.fill(values);
    await this.clickOnBtnWithLabel("Done");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Search order with many kind of order information
   * @param label kind of order information, such as: Order name, Order price, Transaction ID
   * @param value value of data that you want to search
   */
  async searchOrderWithLabel(label: string, value: string) {
    const xpathLabel = `(//div[@class='sb-filter__search sb-flex']//button//span[@class='sb-button--label'])[1]`;
    const xpathLabelValue = `(//div[contains(@class, 'sb-select-menu')]//label[normalize-space()='${label}'])[5]`;
    await this.page.click(xpathLabel);
    await this.page.waitForSelector(xpathLabelValue);
    await this.page.click(xpathLabelValue);
    await this.searchOrder(value);
  }

  /**
   * Click href Upload/Replace Artwork in order detail
   */
  async clickUploadArtworkInOrderDetail(index = 1) {
    await this.page.click(`(//div[normalize-space()='Upload/Replace Artwork'])[${index}]`);
  }

  /**
   * Check have an action in More actions on order details or not
   * @param action
   * @returns
   */
  async isHaveActionInOrder(action: Action): Promise<boolean> {
    const xpathMoreActions = this.page.locator(this.xpathMoreActions);
    await xpathMoreActions.click();
    const xpathAction = `//span[normalize-space()='${action}']/ancestor::span[@class='s-dropdown-item']`;
    return await this.isElementExisted(xpathAction, null, 500);
  }

  //click More actions in order detail then action with order as Approve order, Hold order,...
  async moreActionsOrder(action: Action) {
    if (action == Action.ACTION_VIEW_INVOICE_DISPUTE) {
      await this.reloadUntilChargebackMsgShown();
    }
    const xpathMoreActions = this.page.locator(this.xpathMoreActions);
    await xpathMoreActions.click();
    const xpathActionOnDropDown = this.page.locator(
      `//span[normalize-space()='${action}']/ancestor::span[@class='s-dropdown-item']`,
    );
    await xpathActionOnDropDown.click();
    const xpathConfirm = this.page.locator("//button[text()[normalize-space()='Confirm']]");
    switch (action) {
      case Action.ACTION_APPROVE_ORDER || Action.ACTION_HOLD_ORDER:
        await xpathConfirm.click();
        await this.page.waitForSelector(
          "//button[@class='s-button is-default'][child::span[text()[normalize-space()='PlusHub']]]",
        );
        break;
    }
  }

  async getTotalOrderInOrderList(orderName: string) {
    const totalAmt = await this.getTextContent(
      `(//tr[descendant::div[normalize-space()='${orderName}']])[1]/td[last()]//span`,
    );
    return removeCurrencySymbol(totalAmt);
  }

  /**
   * click on Request cancel for buyer checkbox
   */
  async clickRequestToCancelForBuyer() {
    const xPath = "//span[contains(text(), 'Request to cancel for buyer')]";
    await this.genLoc(xPath).click();
  }

  async clickRequestToRefundForBuyer() {
    const xPath = "//span[contains(text(), 'Request to refund for buyer')]";
    await this.genLoc(xPath).click();
  }

  async clickRequestToRefundForSeller() {
    const xPath = "//span[contains(text(), 'Request to refund for seller')]";
    await this.genLoc(xPath).click();
  }

  /**
   * Select option refund order combo
   * @param refund: Cancel/Refund combo line items or Cancel/Refund unit line items
   */
  async selectOptionRefund(refund: string) {
    const xpathRefundCombo = this.page.locator(`//span[normalize-space()='${refund}']`);
    await xpathRefundCombo.click();
    const xpathContinue = this.page.locator("//span[contains(text(),'Continue')]");
    await xpathContinue.click();

    // wait để data auto fill done
    await this.page.waitForTimeout(3000);
  }

  /**
   * Click chọn option: Do not withdraw from Seller's balance / Send notification to the buyer màn cancel/refund order
   */
  async clickElement(labelName: string) {
    const xpathRefundCombo = this.page.locator(`//span[contains(text(),"${labelName}")]`);
    await xpathRefundCombo.click();
  }

  //get approve status of order
  async getApproveStatus(): Promise<string> {
    const result = await this.getTextContent(
      "(//div[contains(@class,'title-bar__orders-show-badge')]//span[contains(@class,'s-tag')]//span)[1]",
    );
    return String(result).trim();
  }

  //get payment status of order
  async getPaymentStatus(): Promise<string> {
    const result = await this.getTextContent("//span[contains(@class,'hide-when-printing')]//span");
    return String(result).trim();
  }

  //get fulfillment status of order
  async getFulfillmentStatusOrder(): Promise<string> {
    const result = await this.getTextContent(
      "//div[contains(@class, 'title-bar__orders-show-badge')]//span[contains(text(),'Fulfill') or contains(text(),'fulfill') or contains(text(),'Processing')]",
    );
    return String(result).trim();
  }

  // get fulfillment status line items of order
  async getFulfillmentStatusItem(): Promise<string> {
    const result = await this.getTextContent(`//section[contains(@class,'fulfillment-card')]//h2`);
    return result;
  }

  //get archived status of order
  async getArchivedStatusOrder(): Promise<string> {
    const result = await this.getTextContent(
      "(//div[contains(@class, 'title-bar__orders-show-badge')]//span[contains(@class,'s-tag')]//span)[4]",
    );
    return result.trim();
  }

  /**
   * get text cancel status of order
   */
  async getCancelStatus(): Promise<string> {
    return await this.getTextContent(
      "(//div[contains(@class, 'title-bar__orders-show-badge')]//span[contains(@class,'s-tag')]//span)[1]",
    );
  }

  /**
   * get text reason of order after cancel/refund order
   */
  async getReason(): Promise<string> {
    return await this.getTextContent("(//div[contains(text(),'Reason') or contains(text(),'canceled')])[1]");
  }

  async clickButton(buttonName: string) {
    const xpathBtn = this.page.locator(`//button[child::span[text()[normalize-space()='${buttonName}']]]`);
    await xpathBtn.click();
    await this.page.waitForLoadState("networkidle");
  }

  //fulfill order plusbase from order detail (in shop template plusbase)
  async fulfillOrderPlusBase() {
    await this.clickButton("PlusHub");
    await this.page.waitForLoadState("load");
    const xpathFilter = this.page.locator(
      "(//*[text()[normalize-space()='Time since created (hours) between: 6 to 4320'] or child::*[text()[normalize-space()='Time since created (hours) between: 6 to 4320']]])[1]//i",
    );
    await xpathFilter.click();
    const xpathSelectOrder = this.page.locator("//th[contains(@class, 'order-select-header')]//label");
    await xpathSelectOrder.click();
    await this.clickButton("Fulfill selected orders");
    await this.clickButton("Confirm");
  }

  //switch to other tab
  async switchToTabInFulfillOrder(tab: string) {
    const xpathTab = this.page.locator(
      `//nav[contains(@class,'s-tabs-nav')]//li` +
        `//span[contains(text(),'${tab}') or child::p[contains(text(),'${tab}')]]`,
    );
    await xpathTab.click();
  }

  // get product price in order Page
  async getProdPrice(prodName: string, index = 1) {
    const prodPrice = await this.getTextContent(
      `(//a[normalize-space()='${prodName}']/following::div[contains(@class,'unfulfilled-card__item')]//span)[${index}]`,
    );
    return prodPrice;
  }

  async getOriginProdPrice(prodName: string) {
    const prodPrice = await this.getTextContent(
      `//a[normalize-space()='${prodName}']/following::div[contains(@class,'unfulfilled-card__item')]//del`,
    );
    return prodPrice.trim();
  }

  calculateValWithCurrency(currencyName: string, priceSf: number, exchangeRate: number): string {
    let val = (priceSf / exchangeRate).toFixed(2);
    val = getCurrencySymbolBasedOnCurrencyName(currencyName) + val;
    return val;
  }

  calculateValWithoutCurrency(priceSf: number, exchangeRate: number): number {
    return roundingTwoDecimalPlaces(priceSf / exchangeRate);
  }

  /**
   * Get shipping value on order detail page
   * @returns shipping value
   */
  async getShippingRate(): Promise<string> {
    return await this.getTextContent(`(//td[normalize-space()='Shipping']/following-sibling::td//span)[1]`);
  }

  /**
   * Get shipping name on order detail page
   * @returns shipping name
   */
  async getShippingRateName(): Promise<string> {
    return await this.getTextContent(`//td[normalize-space()='Shipping']/following-sibling::td[1]`);
  }

  /**
   * Get discount value on order detail page
   * @returns discount value
   */
  async getDiscountVal(): Promise<string> {
    const isDiscountExist = await this.page
      .locator(`//td[normalize-space()='Discount']//ancestor::tr//span`)
      .isVisible();
    let discountVal = "$0.00";
    if (isDiscountExist) {
      discountVal = await this.getTextContent(`//td[normalize-space()='Discount']//ancestor::tr//span`);
    }
    return discountVal;
  }

  //Get discount code/name on order detail page
  async getDiscountName() {
    return await this.getTextContent(`(//td[normalize-space()='Discount']//ancestor::tr//td)[2]`);
  }

  async getTaxVal() {
    return await this.getTextContent(`//td[normalize-space()='Tax']//following::td[2]`);
  }

  async getTotalOrder() {
    return await this.getTextContent(`//td[text()='Total']/following-sibling::td//div`);
  }

  /**
   * get subtotal in order
   * @param
   * */
  async getSubtotalOrder() {
    return await this.getTextContent(`(//*[text()[normalize-space()='Subtotal']]//ancestor::tbody//*)[last()]`);
  }

  async getContentOfChargebackMsg(lineIndex = 1): Promise<string> {
    return await this.getTextContent(`(//div[contains(@class,'chargeback-notification')]//p)[${lineIndex}]`);
  }

  async getChargeBackAmount() {
    return await this.getTextContent(`(//span[normalize-space()='Chargeback amount']/following-sibling::span)[1]`);
  }

  async getChargebackFee() {
    return await this.getTextContent(`(//span[normalize-space()='Chargeback fee']/following-sibling::span)[1]`);
  }

  async getTotalChargeback() {
    return await this.getTextContent(`(//span[normalize-space()='Total']/following-sibling::span)[1]`);
  }

  async navigateToSubmitResponseChargeback() {
    const xpathBtn = `//button//span[normalize-space()='Submit response']`;
    await this.reloadUntilChargebackMsgShown(); // For sometime playwright too fast
    await this.page.locator(xpathBtn).click();
    await (await this.page.waitForSelector(`//div[@class='chargeback-page']`)).isVisible();
  }

  async enterAdditionalEvidence(evidence: "winning_evidence" | "losing_evidence") {
    await this.page.locator(`//textarea[@placeholder='Additional evidence or statements']`).fill(evidence);
  }

  /**
   * get Timeline order
   * @return list timeline info order
   * */

  async getOrderTimelineList(): Promise<Array<string>> {
    const timelineLoc = await this.page.locator("//div[@class='content-body']").count();
    const timelineList = [];
    let timeline = "";
    for (let i = 1; i < timelineLoc; i++) {
      timeline = await this.getTextContent(`(//div[@class='content-body'])[${i}]`);
      timelineList.push(timeline);
    }
    return timelineList;
  }

  async clickOnSubmitBtn() {
    await this.page.locator(`//span[normalize-space()='Submit evidence now']`).click();
    await expect(this.page.locator(`//div[@class='s-flex chargeback-notification chargeback-success']`)).toBeVisible();
  }

  async verifyMsgDisplayed(msg: string) {
    const msgChargeback = `//*[normalize-space()='${msg}']`;
    try {
      await expect(this.page.locator(msgChargeback)).toBeVisible();
    } catch (error) {
      this.page.waitForTimeout(3000); // wait for response dispute from Stripe
      this.page.reload();
      await expect(
        this.page.locator(`//div[@class='s-flex chargeback-notification chargeback-success']`),
      ).toBeVisible();
      await expect(this.page.locator(msgChargeback)).toBeVisible();
    }
  }

  // Get base cost of product
  async getBaseCost(plbOrder?: PlusbaseOrderAPI) {
    const xpathBasecost = `//span[preceding-sibling::*[normalize-space()='Product cost' or normalize-space()='Basecost']]`;
    const isCheck = await this.page.locator(xpathBasecost).isVisible();
    if (isCheck) {
      return (await this.getTextContent(xpathBasecost)).replace("-", "");
    } else {
      const orderId = this.getOrderIdInOrderDetail();
      const baseCost = (await plbOrder.getBaseCost(orderId)).get("base_cost");
      return `${baseCost}`;
    }
  }

  // Get shipping cost of order
  async getShippingCost() {
    return (await this.getTextContent(`//span[preceding-sibling::span[normalize-space()='Shipping cost']]`)).replace(
      "-",
      "",
    );
  }

  // Get Adjusted shipping of order
  async getMarkupShipping() {
    const xpath = `//span[preceding-sibling::*[contains(text(), 'Adjusted shipping')]]`;
    return (await this.page.locator(xpath).isVisible()) ? removeCurrencySymbol(await this.getTextContent(xpath)) : "0";
  }

  // Click link Show Calculation
  async clickShowCalculation() {
    await this.calculateTextBtn.click();
  }

  // Check for profit calculate
  async isCalculatedProfit() {
    if ((await this.isOrderAliCalculatingProfit()) || Number(removeCurrencySymbol(await this.getProfit())) == 0.0) {
      return false;
    } else {
      return true;
    }
  }

  // Wait for profit calculated
  async waitForProfitCalculated() {
    await this.page.reload();
    let i = 0;
    while (i < 300) {
      await this.page.waitForTimeout(5000);
      await this.page.reload();
      await this.page.waitForSelector(this.orderStatus);
      if (await this.isCalculatedProfit()) {
        break;
      }
      i++;
    }
  }

  // Wait for order auto cancelled. Use only for order with profit <= 0
  async waitForAutoCancel() {
    const xpath = `//div[contains(@class, 'title-bar__orders-show-badge')]//span[contains(text(), 'Cancelled')]`;
    let i = 0;
    while (!(await this.genLoc(xpath).isVisible()) && i < 50) {
      await this.page.waitForTimeout(3000);
      await this.page.reload();
      await this.page.waitForSelector(this.orderStatus);
      i++;
    }
  }

  // Get shipping fee of order
  async getShippingFee() {
    let shippingFee = await this.getTextContent(
      `(//*[text()[normalize-space()='Shipping']]//following-sibling::td//span)[1]`,
    );
    shippingFee = removeCurrencySymbol(shippingFee);
    return shippingFee;
  }

  // Get tip of order
  async getTip() {
    return await this.getTextContent(`//*[text()[normalize-space()='Tip']]//following-sibling::td//span`);
  }

  /**
   * Get tax value on order detail page
   * @returns tax value
   */
  async getTax() {
    let taxValue = "$0.00";
    const isTaxExist = await this.page.locator(`//tr[child::td[text()='Tax']]/td[last()]/div`).isVisible();
    if (isTaxExist) {
      taxValue = await this.getTextContent(`//tr[child::td[text()='Tax']]/td[last()]/div`);
    }
    return taxValue;
  }

  // Get tax desciption of order
  async getTaxDesciption() {
    return await this.getTextContent(`//tr[child::td[text()='Tax']]/td[2]`);
  }

  // Get refunded buyer
  async getRefundedAmount() {
    return await this.getTextContent(
      `//span[preceding-sibling::span[contains(text(), 'Refunded')]] |` +
        ` //td[preceding-sibling::td[contains(text(),'Refunded')] and contains(text(),'- ')]`,
    );
  }

  // Get revenue of order
  async getRevenue() {
    return await this.getTextContent(`//span[preceding-sibling::span[normalize-space()='Revenue']]`);
  }

  // Get profit of order
  async getProfit() {
    return await this.getTextContent(`//span[preceding-sibling::div[child::span='Profit']]`);
  }

  // Get handling fee of order
  async getHandlingFee() {
    return (await this.getTextContent(`//span[preceding-sibling::span[normalize-space()='Handling fee']]`)).replace(
      "-",
      "",
    );
  }

  async getPaymentFee() {
    return (
      await this.getTextContent(`//span[preceding-sibling::span[contains(normalize-space(),'Payment fee')]]`)
    ).replace("-", "");
  }

  async getProcessingFee() {
    return (
      await this.getTextContent(`//span[preceding-sibling::span[contains(normalize-space(),'Processing fee')]]`)
    ).replace("-", "");
  }

  async isOrderAliCalculatingProfit(): Promise<boolean> {
    return await this.page
      .locator(
        `//*[contains(text(), 'take longer (up to 24 hrs) to calculate profit') or contains(text(), 'This order may take longer to calculate profit due to some technical reasons')]`,
      )
      .isVisible();
  }

  /**
   * get amount in Invoice detail of order after cancel/refund order PlusBase
   * @param content balane
   * @return amount
   */
  async getAmountInvoiceDetail(content: string) {
    return await this.getTextContent(`//td//span[contains(text(),'${content}')]/following::span[1]`);
  }

  // Go to order detail by order id
  async goToOrderByOrderId(orderId: number, type?: "pbase") {
    if (type === "pbase") {
      await this.page.goto(`https://${this.domain}/admin/pod/orders/${orderId}`);
    } else {
      await this.page.goto(`https://${this.domain}/admin/orders/${orderId}`);
    }
    await this.page.waitForSelector("//h2[contains(text(), 'Order')] | //h3[contains(text(), 'Order')]");
  }

  // Go to order detail by order id shop template
  async goToOrderStoreTemplateByOrderId(orderId: number) {
    await this.page.goto(`https://${this.domain}/admin/ops/orders/${orderId}`, { waitUntil: "networkidle" });
  }

  // allow to switch from store currency to storefront currency and vice versa
  async switchCurrency() {
    await this.page.locator(this.xpathBtnSwitchCurrency).click();
  }

  /**
   * Calculate revenue, handlingFee, profit of order
   * @param total
   * @param subtotal
   * @param discount
   * @param baseCost
   * @param shippingCost
   * @param shippingFee
   * @param taxInclude tax amount included in the product price
   * @param tip
   * @param paymentFeePercent Payment Fee Rate, default = 3%
   * @param processingFeePercent Processing Fee Rate, default = 4%
   */
  calculateProfitPlusbase(
    total: number,
    subtotal: number,
    discount: number,
    baseCost: number,
    shippingCost: number,
    shippingFee: number,
    taxInclude: number,
    tip: number,
    paymentFeePercent = 0.03,
    processingFeePercent = 0.04,
    podDesignFee = 0,
  ) {
    this.revenue = subtotal - discount + shippingFee + tip - taxInclude;
    const paymentFee = total * paymentFeePercent;
    const processingFee =
      (subtotal - discount - baseCost - shippingCost + shippingFee - paymentFee + tip - taxInclude - podDesignFee) *
      processingFeePercent;
    this.handlingFee = paymentFee + processingFee + podDesignFee;
    this.profit = this.revenue - baseCost - shippingCost - this.handlingFee;
    return {
      revenue: Number(this.revenue.toFixed(2)),
      handlingFee: Number(this.handlingFee.toFixed(2)),
      profit: Number(this.profit.toFixed(2)),
      paymentFee: Number(paymentFee.toFixed(2)),
      processingFee: Number(processingFee.toFixed(2)),
    };
  }

  async getOrderStatus() {
    return await this.getTextContent(this.orderStatus);
  }

  async getPaidByCustomer() {
    return await this.getTextContent("//td[text()[normalize-space()='Paid by customer']]/following-sibling::td");
  }

  /**
   * get amount Refunded to customer of order detail after cancel/refund order
   * @param amount Refunded to customer
   */
  async getAmountRefundedToCustomer() {
    return await this.getTextContent(`//td[preceding-sibling::td[normalize-space()='Refunded to customer']]`);
  }

  /*
   * get Net payment in order details
   * return Net payment
   */
  async getNetPayment() {
    return await this.getTextContent(`//td[contains(., 'Net Payment')]/following-sibling::td`);
  }

  /**
   * get refund amount to customer in order detail
   * @returns refund amount
   */
  async getRefundToCustomer() {
    let refundAmt = await this.getTextContent(`//td[text()='Refunded to customer']/following-sibling::td`);
    refundAmt = refundAmt.split("$")[1];
    return parseFloat(refundAmt);
  }

  /*
   * get order timeline transaction ID by gateway.
   * @param paymentGateway
   */
  getTimelineTransIDByGW(paymentGateway: string) {
    let orderTimelineTransID = "";
    switch (paymentGateway) {
      case PaymentGateway.paypal:
        orderTimelineTransID = "The Paypal transaction ID is";
        break;
      case PaymentGateway.stripe:
        orderTimelineTransID = "The Stripe transaction ID is";
        break;
      case PaymentGateway.paypal_pro:
        orderTimelineTransID = "The Paypal-Pro transaction ID is";
        break;
      case PaymentGateway.checkout_dot_com:
        orderTimelineTransID = "The Checkout.com transaction ID is";
        break;
      case PaymentGateway.asiabill:
        orderTimelineTransID = "The transaction ID is";
        break;
      case PaymentGateway.razorpay:
        orderTimelineTransID = "The transaction ID is";
        break;
      default:
        orderTimelineTransID = "The Stripe transaction ID is";
        break;
    }
    return orderTimelineTransID;
  }

  /*
   * get order timelines locate by element.
   * order timeline of order have post purchase (checkout via Paypal) will be duplicated
   * @param text
   * @param isPostPurchase
   * @param paymentGateway
   */
  async orderTimeLines(text: string, isPostPurchase?: boolean, paymentGateway?: string) {
    if (isPostPurchase == true && paymentGateway.includes("PayPal")) {
      return this.page.locator(`(//div[contains(@class,'timeline-list')]//div[contains(text(),'${text}')])[2]`);
    }
    return this.page.locator(`(//div[contains(@class,'timeline-list')]//div[contains(text(),"${text}")])[1]`);
  }
  /**
   * get order timelines locate by element and retry if not exist
   * @deprecated: use function waitOrderTimeLineVisibleWithArrayText instead
   */
  async waitOrderTimeLineVisible(text: string, isPostPurchase?: boolean, paymentGateway?: string, times = 5) {
    let xpathTimeline = `(//div[contains(@class,'timeline-list')]//div[contains(text(),'${text}')])[1]`;
    if (isPostPurchase == true && paymentGateway.includes("PayPal")) {
      xpathTimeline = `(//div[contains(@class,'timeline-list')]//div[contains(text(),'${text}')])[2]`;
    }
    for (let i = 0; i < times; i++) {
      const visible = await this.page.isVisible(xpathTimeline);
      if (visible) {
        break;
      }
      await this.page.reload();
      await this.page.waitForSelector("//div[contains(@class,'timeline-list')]");
    }
    return this.page.locator(xpathTimeline);
  }

  /**
   * get timeline locator with list xpath
   * Note: this func use to cover case currency in client and server maybe different when rounding
   * ex: texts = ['$3.89 timeline', '$3.90 timline']
   * => xPath = '//div[contains(text(),'$3.89 timeline')] | //div[contains(text(),'$3.90 timeline')]'
   * @param texts : list text to gen xpaths
   */
  async waitOrderTimeLineVisibleWithArrayText(
    texts: Array<string>,
    isPostPurchase?: boolean,
    paymentGateway?: string,
    times = 5,
  ) {
    const listXpathTimeline = [];
    //create list xpath from text array
    for (let i = 0; i < texts.length; i++) {
      let xpathTimeline = `(//div[contains(@class,'timeline-list')]//div[contains(text(),'${texts[i]}')])[1]`;
      if (isPostPurchase == true && paymentGateway.includes("PayPal")) {
        xpathTimeline = `(//div[contains(@class,'timeline-list')]//div[contains(text(),'${texts[i]}')])[2]`;
      }
      listXpathTimeline.push(xpathTimeline);
    }

    // join list xpath to string with |
    // ex: xPath = //div[contains(text(),'$3.89 timeline')] | //div[contains(text(),'$3.90 timeline')]
    const xpathTimeline = listXpathTimeline.join(" | ");

    // retry to get timeline locator
    for (let i = 0; i < times; i++) {
      const visible = await this.page.isVisible(xpathTimeline);
      if (visible) {
        break;
      }
      await this.page.reload();
      await this.page.waitForSelector("//div[contains(@class,'timeline-list')]");
    }
    return this.page.locator(xpathTimeline);
  }

  /*
   * Because Using rounding currency, total order in sf and total in order detail may be different,
   * so use this function to check for both. Just timeline payment 1 of 2 is correct.
   */
  async checkTimeLinePaymentProcessed(
    totalOrderSFText: string,
    actualTotalOrderText: string,
    isPostPurchase?: boolean,
    paymentGateway?: string,
    times = 5,
  ): Promise<boolean> {
    const locatorTotalOrderSF = await this.waitOrderTimeLineVisible(
      totalOrderSFText,
      isPostPurchase,
      paymentGateway,
      times,
    );
    const locatorActualTotalOrder = await this.waitOrderTimeLineVisible(
      actualTotalOrderText,
      isPostPurchase,
      paymentGateway,
      times,
    );
    return (
      (locatorTotalOrderSF && (await locatorTotalOrderSF.isVisible())) ||
      (locatorActualTotalOrder && (await locatorActualTotalOrder.isVisible()))
    );
  }

  /*
   * Generate order timeline message with payment gateway
   * @param totalAmount toal order amount
   * @param paymentGateway name of payment gateway
   * @param itemPostPurchaseValue optional value to present item post purchase value
   */
  buildOrderTimelineMsgByGW(
    totalAmount: string,
    paymentGateway: string,
    itemPostPurchaseValue?: string,
    accountName?: string,
    endingCardNo?: string,
  ): string {
    let totalAmountOnOrderDetail: string;
    if (itemPostPurchaseValue == null) {
      itemPostPurchaseValue = "0";
    }

    switch (paymentGateway) {
      case PaymentGateway.paypal:
      case PaymentGateway.bancontact:
      case PaymentGateway.ideal:
      case PaymentGateway.giropay:
      case PaymentGateway.razorpay:
      case PaymentGateway.checkout_dot_com:
        totalAmountOnOrderDetail = (
          parseFloat(removeCurrencySymbol(totalAmount)) - parseFloat(itemPostPurchaseValue)
        ).toFixed(2);
        break;
      default:
        totalAmountOnOrderDetail = removeCurrencySymbol(totalAmount);
    }
    return this.generateOrderTimelineMsgByGw(paymentGateway, totalAmountOnOrderDetail, accountName, endingCardNo);
  }

  /*
   * Generate order timeline message with item post purchase with payment gateway
   * @param paymentGateway name of payment gateway
   * @param itemPostPurchaseValue optional value to present item post purchase value
   */
  buildOrderTimelinePPCMsgByGW(
    paymentGateway: string,
    itemPostPurchaseValue: string,
    accountName?: string,
    endingCardNo?: string,
  ): string {
    return this.generateOrderTimelineMsgByGw(paymentGateway, itemPostPurchaseValue, accountName, endingCardNo);
  }

  /*
   * Generate order timeline message based on payment gateway
   * @param paymentGateway name of payment gateway
   * @param itemPostPurchaseValue optional value to present item post purchase value
   */
  generateOrderTimelineMsgByGw(paymentGateway: string, amount: string, accountName?: string, cardEnd?: string): string {
    let orderTimelinePaymentProcessed: string;
    // validate input
    if (!amount) {
      amount = "0";
    }
    if (accountName == null) {
      accountName = "";
    }
    switch (paymentGateway) {
      case PaymentGateway.paypal:
        orderTimelinePaymentProcessed = `A $${amount} USD payment was processed via Paypal-Express`;
        break;
      case PaymentGateway.bancontact:
      case PaymentGateway.ideal:
      case PaymentGateway.sepa:
      case PaymentGateway.giropay:
        orderTimelinePaymentProcessed =
          `A $${amount} USD payment was processed via Stripe ${accountName} ` + `method ${paymentGateway}`;
        break;
      case PaymentGateway.paypal_pro:
        orderTimelinePaymentProcessed =
          `A ${amount} USD payment was processed on the Visa ending in ${cardEnd} ` + `via Paypal-Pro ${accountName}`;
        break;
      case PaymentGateway.checkout_dot_com:
        orderTimelinePaymentProcessed =
          `A $${amount} USD payment was processed on the Visa ending in ${cardEnd} ` +
          `via Checkout.com ${accountName}`;
        break;
      case PaymentGateway.razorpay:
        orderTimelinePaymentProcessed = `A $${amount} USD payment was processed via Razorpay ${accountName}`;
        break;
      default:
        orderTimelinePaymentProcessed =
          `A $${amount} USD payment was processed on the Visa ending in ${cardEnd} ` + `via Stripe ${accountName}`;
    }
    return orderTimelinePaymentProcessed;
  }

  /*
   * Generate list order timeline message based on payment gateway
   * @param paymentGateway name of payment gateway
   * @param values optional value to present item post purchase value
   */
  generateListOrderTimelineMsgByGw(
    paymentGateway: string,
    amounts: Array<string>,
    accountName?: string,
    cardEnd?: string,
  ): Array<string> {
    const orderTimelinePaymentProcesseds = [];
    if (accountName == null) {
      accountName = "";
    }
    amounts.forEach(amount => {
      let orderTimelinePaymentProcessed = "";
      switch (paymentGateway) {
        case PaymentGateway.paypal:
          orderTimelinePaymentProcessed = `A $${amount} USD payment was processed via Paypal-Express`;
          break;
        case PaymentGateway.bancontact:
        case PaymentGateway.ideal:
        case PaymentGateway.sepa:
        case PaymentGateway.giropay:
          orderTimelinePaymentProcessed =
            `A $${amount} USD payment was processed via Stripe ${accountName} ` + `method ${paymentGateway}`;
          break;
        case PaymentGateway.paypal_pro:
          orderTimelinePaymentProcessed =
            `A ${amount} USD payment was processed on the Visa ending in ${cardEnd} ` + `via Paypal-Pro ${accountName}`;
          break;
        case PaymentGateway.checkout_dot_com:
          orderTimelinePaymentProcessed =
            `A $${amount} USD payment was processed on the Visa ending in ${cardEnd} ` +
            `via Checkout.com ${accountName}`;
          break;
        default:
          orderTimelinePaymentProcessed =
            `A $${amount} USD payment was processed on the Visa ending in ${cardEnd} ` + `via Stripe ${accountName}`;
      }
      orderTimelinePaymentProcesseds.push(orderTimelinePaymentProcessed);
    });

    return orderTimelinePaymentProcesseds;
  }

  /**
   * Generate order timeline with each payment method
   * @param shippingAddress
   * @param checkoutInfo
   * @returns an object contains 5 basic order timeline when checkout success
   */
  generateOrdTimeline(shippingAddress: ShippingAddress, checkoutInfo: CheckoutOrdInfo) {
    const ordTimeLinePaymentProcessed = this.buildOrderTimelineMsgByGW(
      checkoutInfo.total_amount,
      checkoutInfo.payment_gateway,
      checkoutInfo.item_post_purchase_value,
      checkoutInfo.account_name,
      checkoutInfo.ending_card_no,
    );
    const ordTimeLinePaymentProcessedPPC = this.buildOrderTimelinePPCMsgByGW(
      checkoutInfo.payment_gateway,
      checkoutInfo.item_post_purchase_value,
      checkoutInfo.account_name,
      checkoutInfo.ending_card_no,
    );
    const ordTimelineTransID = this.getTimelineTransIDByGW(checkoutInfo.payment_gateway);

    // Bỏ không cần check đến customer name: (Đã check các chỗ liên quan)
    const orderTimelineSendingEmail = `Order confirmation email was sent to `;

    const orderTimelineCustomerPlaceOrder = `placed this order on Online Store`;

    const orderTimeline = {
      timelineSendEmail: orderTimelineSendingEmail,
      timelinePlaceOrd: orderTimelineCustomerPlaceOrder,
      timelinePaymentProcessed: ordTimeLinePaymentProcessed,
      timelinePaymentProcessedPPC: ordTimeLinePaymentProcessedPPC,
      timelineTransId: ordTimelineTransID,
    };
    return orderTimeline;
  }

  async inputTextToFieldAndEnter(field: Locator, value: string) {
    field.fill(value);
    field.press("Enter");
  }

  async clickOrderByName(name: string) {
    await this.page.locator(this.xpathOrderNameOnList(name)).click();
  }

  /**
   * Click order name to view order detail
   * @param name input order name
   */
  async gotoOrderDetail(name: string) {
    await this.page.waitForSelector(
      "(//div[contains(@class,'orders-list') or contains(@class,'sb-table--enable-row')])[1]",
    );
    const xpathFilter = "//div[contains(text(),'Order Date')]";
    if (await this.isElementExisted(xpathFilter)) {
      await this.page.locator(`${xpathFilter}//span`).click();
    }
    await this.searchOrder(name);
    await this.page.locator(this.xpathOrderNameOnList(name)).click();
    await this.page.waitForSelector("//div[@class='order-layout__sections']");
  }

  /**
   * open the first order on order list
   */
  async openThe1stOrderOnList() {
    await this.page.click("(//tr[contains(@class,'row-order')]//a)[1]");
    await this.page.waitForSelector("//div[@class='order-layout__sections']");
  }

  /**
   * Get orderID from url in OrderDetail
   */
  getOrderIdInOrderDetail(): number {
    const campaignIds = this.page.url().match(/(\d+)/g);
    return parseInt(campaignIds[campaignIds.length - 1]);
  }

  /**
   * Nhập quantity & amount refund order
   * @param lineRefund = conf.caseConf.refunds
   * @param plbOrderApi
   * @param infoOrder
   * @returns profitAfterRefund profit sau khi cancel/refund order
   */
  async inputRefundItems(
    lineRefund: Array<PlbRefundCase>,
    plbOrderApi: PlusbaseOrderAPI,
    infoOrder: OrderAfterCheckoutInfo,
  ) {
    const orderResponse = await plbOrderApi.searchOrders({
      search: infoOrder.orderName,
      name: infoOrder.orderName,
      plb_profit: true,
    });
    const msg = `cannot search order via api ok: ${orderResponse.ok} - length: ${orderResponse.data.orders.length}`;
    expect(orderResponse.ok && orderResponse.data.orders.length == 1, msg).toEqual(true);
    const sbOrder = orderResponse.data.orders[0];

    const plbOrder = await plbOrderApi.getOrderPlbDetail(orderResponse.data.orders[0].id, {
      retry: 10,
      waitBefore: 3000,
    });

    for (const refund of lineRefund) {
      if (refund.ignore_refund_buyer) {
        await this.page.click("//span[contains(text(), 'Request to cancel for buyer')]");
      }
      if (refund.ignore_refund_seller) {
        await this.page.click("//span[contains(text(), 'Request to cancel for seller')]");
      }
      const refundLines = Array<SbOrderLine>();
      const OrderLineRefund = new Map<string, SbOrderLine>();
      for (const line of sbOrder.line_items) {
        OrderLineRefund.set(
          `${line.title}_${line.variant_title}_${!!line.source_id}_${line.is_post_purchase_item}`,
          line,
        );
      }
      for (const line of refund.lines) {
        const lineRefund = OrderLineRefund.get(
          `${line.product_name}_${line.variant_title}_${!!line.is_combo}_${!!line.is_ppc}`,
        );
        expect(lineRefund).not.toBeUndefined();
        lineRefund.quantity = line.quantity;
        refundLines.push(lineRefund);
      }
      //set input refund quantity màn cancel/refund items shop plusbase
      for (const line of refundLines) {
        // Case order paid no need to fill quantity, continue
        if (!line.quantity) {
          continue;
        }
        await this.page.locator(`tr.refund_line_${line.id} input`).fill(`${line.quantity}`);
      }
      //set input refund amount màn cancel/refund items shop plusbase
      for (const att in refund.input) {
        if (!refund.is_full_refund) {
          await this.page.locator(`input.${att}__input`).fill(`${refund.input[att]}`);
        } else {
          const strAvailable = await this.page.locator(`//div[@data-plb-refund-avl='${att}__available']`).textContent();
          const availableAmount = strAvailable.replace("$", "").replace("available", "").trim();
          if (
            !parseFloat(availableAmount) ||
            (refund.ignore_refund_buyer && att.includes("buyer")) ||
            (refund.ignore_refund_seller && att.includes("seller"))
          ) {
            refund.input[att] = 0;
            continue;
          }
          await this.page.locator(`input.${att}__input`).fill(availableAmount);
          refund.input[att] = parseFloat(availableAmount);
        }
      }

      await this.page.waitForTimeout(5000);
      return { profitAfterRefund: profitAfterRefund(plbOrder, refund.input), input: refund.input };
    }
  }

  /**
   * Nhập quantity refund order
   * @param index
   * @param quantity refund
   */
  async inputQuantityRefund(index: number, quantity: string) {
    await this.page.locator(`(//input[@class='s-input__inner plb-input-qty'])[${index}]`).fill(quantity);
  }

  async refundOrder(refundInfo: RefundInfo): Promise<number> {
    const refundShipLoc = this.genLoc(
      "//div[normalize-space()='Refund shipping']//ancestor::section[@class='card']//input[@type='number']",
    );
    await this.genLoc(
      "//div [contains(@class,'action-bar__top-links')]//button[contains(@class,'action-bar__refund')]",
    ).click();
    await this.genLoc("//h1[contains(text(),'Refund items')]").isVisible();
    if (refundInfo.product_qty) {
      if (refundInfo.product_name) {
        await this.genLoc(
          `//div[contains(@class, 'unfulfilled-card__item') and contains(normalize-space(),'${refundInfo.product_name}')]//input[@type='number']`,
        ).fill(refundInfo.product_qty);
      } else {
        await this.genLoc(`//div[contains(@class, 'unfulfilled-card__item')]//input[@type='number']`).fill(
          refundInfo.product_qty,
        );
      }
    }
    if (refundInfo.shipping_fee) {
      await refundShipLoc.fill(refundInfo.shipping_fee);
      await refundShipLoc.evaluate(e => e.blur());
    }
    if (refundInfo.reason) {
      await this.genLoc("//input[@placeholder='Reason for refund']").fill(refundInfo.reason);
    }
    if (refundInfo.is_refund_tip) {
      await this.page.check(`//span[normalize-space()='Include tipping']/preceding-sibling::span`);
    }
    // cần đợi 1 khoảng thời gian để giá trị Refund được update đúng theo số lượng item refund và shipping fee
    await this.page.waitForTimeout(5 * 1000);
    const refundAmount = Number(
      (
        await this.page.innerText(
          "//section[@class='card']//p[text()='Refund amount']//parent::div//following-sibling::div//span",
        )
      ).replace("$", ""),
    );
    await this.genLoc("//button[@class='s-button is-primary is-fullwidth']").click();
    await this.page.waitForSelector("//div[contains(text(),'Refund succeeded')]");
    return refundAmount;
  }

  /*
   * Capture order in order details
   * @param capture amount: value of capture amount
   */
  async captureOrder(captureAmount: string) {
    for (let i = 0; i <= 5; i++) {
      if (await this.isElementExisted(this.xpathBtnCaptureOrder, null, 500)) {
        break;
      }
      await this.page.reload();
      await this.page.waitForSelector("//h2[contains(text(), 'Order')] | //h3[contains(text(), 'Order')]");
    }
    await this.clickButton("Capture payment");
    await this.page.locator("//input[@placeholder = 'Please input']").fill("");
    await this.page.locator("//input[@placeholder = 'Please input']").fill(captureAmount);
    await this.page.locator("//button//span[contains(text(),'Accept')]").click();
    await this.page.waitForSelector("//div[text()='Order is successfully approved!']");
    await this.waitUntilElementInvisible(this.xpathBtnCaptureOrder);
    const xpathTimeline = `//div[contains(text(), 'A $${captureAmount} USD payment was processed')]`;
    for (let i = 0; i <= 5; i++) {
      if (await this.isElementExisted(xpathTimeline, null, 500)) {
        break;
      }
      await this.page.reload();
      await this.page.waitForSelector("//h2[contains(text(), 'Order')]|//h3[contains(text(), 'Order')]");
    }
  }

  //Cancel order in order details
  async cancelOrderInOrderDetails() {
    await this.page.locator("//span[contains(., 'More action')]").click();
    await this.page.locator("//div[@class='s-dropdown-menu']//span[contains(text(),'Cancel')]").click();
    await this.page.waitForSelector("(//h2[normalize-space()='Cancel order'])");
    await this.page.locator("//span[text()[normalize-space() = 'Cancel order']]").click();
    await this.waitUntilElementInvisible("(//h2[normalize-space()='Cancel order'])");
    await this.page.waitForSelector("//span[text()[normalize-space() = 'Cancelled']]");
  }

  /**
   * refund order plusbase. Currently support full value refund only.
   * @param productName product name
   * @param qty quantity
   * @param noRefundBuyer true if only refund seller
   */
  async refundPlbOrderInOrderDetails(input: RefundOrderInput) {
    await this.clickRefundOrder();

    for (let i = 0; i < input.product_name.length; i++) {
      await this.genLoc(`//tr[descendant::*[normalize-space()='${input.product_name[i]}']]//input`).fill(
        input.qty.toString(),
      );
    }

    if (!input.refund_buyer.enable) {
      await this.clickRequestToRefundForBuyer();
    } else {
      if (input.refund_buyer.refund_selling_price) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_buyer_selling__input')]").fill(
          input.refund_buyer.refund_selling_price.toString(),
        );
      }
      if (input.refund_buyer.refund_tip) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_buyer_tip__input')]").fill(
          input.refund_buyer.refund_tip.toString(),
        );
      }
      if (input.refund_buyer.refund_shipping_fee) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_buyer_shipping__input')]").fill(
          input.refund_buyer.refund_shipping_fee.toString(),
        );
      }
      if (input.refund_buyer.recover_payment_fee) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_buyer_payment__input')]").fill(
          input.refund_buyer.recover_payment_fee.toString(),
        );
      }
      if (input.refund_buyer.refund_taxes) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_buyer_tax__input')]").fill(
          input.refund_buyer.refund_taxes.toString(),
        );
      }
    }

    if (!input.refund_seller.enable) {
      await this.clickRequestToRefundForSeller();
    } else {
      if (input.refund_seller.product_cost) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_seller_base_cost__input')]").fill(
          input.refund_seller.product_cost.toString(),
        );
      }
      if (input.refund_seller.shipping_fee) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_seller_shipping__input')]").fill(
          input.refund_seller.shipping_fee.toString(),
        );
      }
      if (input.refund_seller.manual_design_fee) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_seller_design__input')]").fill(
          input.refund_seller.manual_design_fee.toString(),
        );
      }
      if (input.refund_seller.recover_processing_fee) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_seller_processing__input')]").fill(
          input.refund_seller.recover_processing_fee.toString(),
        );
      }
      if (input.refund_seller.refund_taxes) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_seller_tax__input')]").fill(
          input.refund_seller.refund_taxes.toString(),
        );
      }
      if (input.refund_seller.recover_payment_fee) {
        await this.genLoc("//input[contains(@class, 's-input__inner refund_seller_payment__input')]").fill(
          input.refund_seller.recover_payment_fee.toString(),
        );
      }
    }

    await this.genLoc("//input[contains(@class, 's-input__inner refund_seller_base_cost__input')]").click();
    await this.page.waitForTimeout(3000);
    await this.confirmRefund();
  }

  async refundOrderAtOrderDetails(refundInfo: RefundInfo) {
    await this.page.locator('button:has-text("Refund item")').click();
    await this.page.locator(`//h1[contains(text(),'Refund items')]`).isVisible();
    if (refundInfo.product_qty) {
      await this.page
        .locator("//div[contains(@class, 'unfulfilled-card__item')]//input[@type='number']")
        .fill(refundInfo.product_qty);
    }
    if (refundInfo.shipping_fee) {
      await this.page
        .locator("//div[normalize-space()='Refund shipping']//ancestor::section[@class='card']//input[@type='number']")
        .fill(refundInfo.shipping_fee);
    }
    if (refundInfo.extra_fee) {
      await this.page.locator("//input[@placeholder='Refund amount'][2]").fill(refundInfo.extra_fee);
    }
    if (refundInfo.reason) {
      await this.page.locator("//input[@placeholder='Reason for refund']").fill(refundInfo.reason);
    }
    if (refundInfo.refund_amount) {
      await this.page
        .locator(
          "//h3[normalize-space()='Refund amount']//ancestor::div[contains(@class, 'refund-form-section')]//input[@type='number']",
        )
        .fill(refundInfo.refund_amount);
    }
    await this.page.locator("//button[@class='s-button is-primary is-fullwidth']").click();
    await this.page.waitForSelector("//div[contains(text(),'Refund succeeded')]");
  }

  /**
   * go to order detail and get amount refund
   * @param orderId is order's id
   * @returns
   */
  async getRefundAmountSBaseAtOrderDetail(orderId: string): Promise<number> {
    await this.goto(`/admin/orders/${orderId}`);
    await this.page.waitForLoadState("networkidle");
    const xpathLabelRefunded = "//table[contains(@class,'order-detail')]//tbody[5]//tr/td[contains(text(),'Refunded')]";
    let amountRefund;
    if (await this.page.locator(xpathLabelRefunded).isVisible) {
      const amount = await await this.genLoc(xpathLabelRefunded + "//following-sibling::td[2]").textContent();
      amountRefund = Math.abs(parseFloat(removeCurrencySymbol(amount)));
    } else {
      Promise.resolve();
    }
    return amountRefund;
  }

  async inputDataFulfillment(
    name: string,
    quantity: string,
    tracking: {
      number: string;
      carrier: string;
    },
  ) {
    await this.page
      .locator('[placeholder="Search by order name\\, transaction id\\, line item name"]')
      .first()
      .fill(name);
    await this.page
      .locator(`//div[contains(@class,'none')]/descendant::div[contains(text(),'${name}')]`)
      .first()
      .click();
    await this.page.locator("text=Mark as fulfilled").click();
    await this.page.locator('input[type="number"]').fill(`${quantity}`);
    await this.page.locator("#tracking-number").fill(`${tracking.number}`);
    await this.page.locator("text=Shipping carrier Other >> i").click();
    await this.page.locator(`text=${tracking.carrier}`).first().click();
  }

  defaultTrackingInfo = {
    number: "YT2111621236003789",
    carrier: "Yun Express",
  };

  /**
   * Mark as fulfill order
   * @param trackingInfo
   * @param productInfo put product quantity to choose wwhich product wanted to fulfill.
   * quantity = 0 <=> no fulfill this product
   * quantity > 0 <=> fulfill or partially fulfill this product
   */
  async markAsFulfillOrd(
    trackingInfo: { number: string; carrier: string } = this.defaultTrackingInfo,
    productInfo?: [{ product_name: string; quantities: number }],
  ): Promise<void> {
    await this.page.locator("text=Mark as fulfilled").click();
    if (productInfo) {
      for (const product of productInfo) {
        await this.page
          .locator(`//tr[td//p//a[normalize-space()='${product.product_name}']]//input[@type='number']`)
          .fill(`${product.quantities}`);
      }
    }
    if (!trackingInfo) {
      return await this.page.click(`//button[span[normalize-space()='Fulfill items']]`);
    }
    await this.page.locator("#tracking-number").fill(`${trackingInfo.number}`);
    await this.page.locator("text=Shipping carrier Other >> i").click();
    await this.page.locator(`text=${trackingInfo.carrier}`).first().click();
    await this.page.click(`//button[span[normalize-space()='Fulfill items']]`);
  }

  /**
   * It adds a tracking number to a order has been fulfill but no tracking number.
   * @param trackingInfo - { number: string; carrier: string } = this.defaultTrackingInfo
   */
  async addTrackingNumber(trackingInfo: { number: string; carrier: string } = this.defaultTrackingInfo) {
    await this.page.locator("#tracking-number").fill(`${trackingInfo.number}`);
    await this.page.click("//div[@placeholder = 'Select carrier']");
    await this.page.click(`//div[normalize-space() = '${trackingInfo.carrier}']`);
    await this.clickButtonOnPopUpWithLabel("Save");
  }

  /**
   * Cancel fulfillment order.. required order has been fulfilled
   */
  async cancelFulfillment(): Promise<boolean> {
    await this.page.click(`//button[span[normalize-space()='Cancel fulfillment']]`);
    await this.page.click(`//button[normalize-space()='OK']|//button[normalize-space()='Confirm']`);
    await this.page.waitForSelector(`//div[normalize-space()='Cancel fulfillment success']//div//div`);
    return true;
  }

  async cancelOrder(cancelWith: number) {
    await this.genLoc("//div[@class='action-bar__more']//button").click();
    await this.genLoc("//span[normalize-space()='Cancel order']/ancestor::span[@class='s-dropdown-item']").click();
    await this.page.click(
      "//p[contains(text(),'Refund')]//ancestor::div[contains(@class, 'refund-payments')]//input[@type='number']",
    );
    await this.page
      .locator(
        "//p[contains(text(),'Refund')]//ancestor::div[contains(@class, 'refund-payments')]//input[@type='number']",
      )
      .fill(cancelWith.toString());
    await this.clickOnBtnWithLabel("Cancel order");
    await this.waitUntilElementInvisible("(//h2[normalize-space()='Cancel order'])");
    await this.page.waitForSelector("//span[text()[normalize-space() = 'Cancelled']]");
  }

  /**
   * This function opens a new tab and goes to the order status page.
   * Then get order info in order status page.
   * @returns a Promise that resolves to an object of type OrderAfterCheckoutInfo.
   */
  async viewOrderStatusAndGetCheckoutInfo(): Promise<OrderAfterCheckoutInfo> {
    await this.genLoc("//div[@class='action-bar__more']//button").click();
    const [newPage] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.genLoc(
        "//span[normalize-space()='View order status page']/ancestor::span[@class='s-dropdown-item']",
      ).click(),
    ]);
    const orderSttPage = new SFCheckout(newPage, this.domain);
    return await orderSttPage.getOrderInfoAfterCheckout();
  }

  /**
   * Mark order as paid and reload page
   */
  async markAsPaidOrder() {
    await this.clickOnBtnWithLabel("Mark as paid");
    await this.clickButtonOnPopUpWithLabel("Mark as Paid");
    await this.waitUntilElementInvisible(`//div[@class='s-modal-footer']//button[contains(@class, 'is-loading')]`);
    await this.waitForElementVisibleThenInvisible(
      `//div[contains(@class, 's-toast')]//div[normalize-space()=` +
        `'Payment status is being updated. Please refresh the page in next few seconds to see the result.']`,
    );
    await this.page.reload();
    await this.page.waitForSelector("//h2[contains(text(), 'Order')] | //h3[contains(text(), 'Order')]");
  }

  netPayment(a: number, b: number) {
    return a - b;
  }

  /**
   * Click button Refund order in order details
   * Input refund info
   * Click button Rèund order
   */
  async refundOrderPlbase(refundInfo: RefundInfo) {
    await this.page.locator("//span[normalize-space() = 'Refund order']").click();
    await this.waitUntilElementVisible("//h1[text()='Refund items']");

    if (refundInfo.selling_price) {
      await this.page
        .locator("//input[@class='s-input__inner refund_buyer_selling__input']")
        .fill(refundInfo.selling_price);
    }
    if (refundInfo.payment_fee) {
      await this.page
        .locator("//input[@class='s-input__inner refund_buyer_payment__input']")
        .fill(refundInfo.payment_fee);
    }
    if (refundInfo.shipping_fee) {
      await this.page
        .locator("//input[@class='s-input__inner refund_buyer_shipping__input']")
        .fill(refundInfo.shipping_fee);
    }
    if (refundInfo.tip_amount) {
      await this.page.locator("//input[@class='s-input__inner refund_buyer_tip__input']").fill(refundInfo.tip_amount);
    }
    if (refundInfo.tax_amount) {
      await this.page.locator("s-input__inner refund_buyer_tax__input").fill(refundInfo.tax_amount);
    }
    if (refundInfo.send_noti) {
      await this.page.locator("//span[following-sibling::span[contains(text(), 'Send notification to')]]").check();
    }
    await this.page.locator("//button[child::span[normalize-space()='Refund']]").click();
  }

  /*
   * Click checkbox to choose an order at order list
   * @param orderName: order name
   */
  async chooseOrderAtOrderList(orderName: string) {
    await this.page
      .locator(`(//div[normalize-space()='${orderName}']/ancestor::td//preceding-sibling::td//span)[1]`)
      .click();
  }

  //Click dropdown list 'Action' and choose 'Capture order payments'
  async captureOrderAtOrderList() {
    await this.page.locator("(//button[normalize-space()='Actions'])[2]").click();
    await this.page.locator("(//li[contains(text(),'Capture Order Payment')])[2]").click();
    await this.page.waitForSelector("(//div[normalize-space()='Capture Order Payments'])[2]");
    await this.page.locator("//span[normalize-space()='Capture payments']").click();
    await this.waitUntilElementInvisible("(//div[normalize-space()='Capture Order Payments'])[2]");
  }

  //Go to Order details by order number
  async goToOrderDetailSBase(orderNumber: string) {
    const xpathOrderName = this.page.locator(`(//a//div[normalize-space()='${orderNumber}'])[1]`);
    await xpathOrderName.click();
    await this.page.waitForTimeout(5000);
    await this.page.waitForSelector("//h2[contains(text(), 'Order')]|//h3[contains(text(), 'Order')]");
  }

  // Open popup View Full Secssion on Order Details
  async openViewFullSecssion() {
    await this.genLoc("//button[normalize-space()='View details']").click();
    await this.genLoc("(//button[normalize-space()='View full session'])[last()]").click();
  }

  // go to Order page by link
  async gotoOrderPage(shopType?: "shopbase" | "printbase" | "plusbase") {
    if (!shopType) {
      shopType = "shopbase";
    }
    const links = {
      shopbase: "/admin/orders",
      printbase: "/admin/pod/orders",
      plusbase: "/admin/plb/orders",
    };
    let link = links[shopType];
    if (this.isShopTemplate) {
      link = "/admin/ops/orders";
    }
    await this.goto(link);
    await this.page.waitForLoadState("networkidle");
  }

  // go to Abandoned checkout page by link
  async goToAbandonedCheckoutPage() {
    await this.goto(`https://${this.domain}/admin/checkouts`);
    await this.page.waitForLoadState("networkidle");
  }

  // go to Order page by link with param
  async gotoOrderPageWithParam(params: string) {
    let link = "/admin/orders?" + params;
    if (this.isShopTemplate) {
      link = "/admin/ops/orders?" + params;
    }
    await this.goto(link);
    await this.page.waitForLoadState();
  }

  /**
   * check hien thi trang thank you
   */
  async thankYouPageAppear(): Promise<void> {
    await this.page.locator("(//div[contains(@class,'content__wrap')]//div[@class='main'])[2]").isVisible();
  }

  async expandTimeline() {
    await this.genLoc("//span[@class='s-icon fee-icon is-small']//i").click();
  }

  async orderTitleHeaderLocator() {
    return this.genLoc("//h2[normalize-space()='Order']");
  }

  async getCheckoutLinkForPaymentCollection() {
    return this.getTextContent("//div[@class='edit-order__timeline__wrapper']");
  }

  async goToCheckoutPageFromOrder(checkoutLink: string) {
    await this.goto(checkoutLink);
    return new SFCheckout(this.page, this.domain);
  }

  /**
   * if an order is edited, the field is displayed
   */
  async getAmountToCollect() {
    return removeCurrencySymbol(
      await this.getTextContent("//td[normalize-space()='Amount to collect']/following-sibling::td"),
    );
  }

  async isBtnVisible(labelName: string) {
    return await this.genLoc(`//button[normalize-space()='${labelName}']`).isVisible();
  }

  /**
   * Verify Order Timeline
   * @param checkoutInfo get from checkout information on checkout page;
   *                     use function getCheckoutInfo() from src\pages\api\checkout.ts
   * @param option
   * @returns true | false
   */
  async verifyOrderTimeline(
    checkoutInfo,
    option?: {
      idUnlimintCheckout?: string;
      cardInfo?: Card;
    },
  ): Promise<boolean> {
    // expected timeline
    const paymentMethod = checkoutInfo.info.payment_method;
    let expTimelineContents = [];
    switch (paymentMethod) {
      case "cardpay":
        expTimelineContents = [
          checkoutInfo.info.shipping_address.name +
            " placed this order on Online Store (checkout #" +
            option.idUnlimintCheckout +
            ")",
          "A $" +
            checkoutInfo.totals.total_price.toFixed(2) +
            " USD payment was processed on the card ending in " +
            option.cardInfo.unlimint_card.substring(option.cardInfo.unlimint_card.length - 4) +
            " via Unlimint",
          "Order confirmation email was sent to " +
            checkoutInfo.info.shipping_address.name +
            " (" +
            checkoutInfo.info.email +
            ")",
          "The Unlimint transaction ID is",
        ];
        break;
    }
    // verify expected timeline contents is visible
    for (const expContent of expTimelineContents) {
      if (!(await this.page.locator(`//div[contains(text(),'${expContent}')]`).isVisible())) {
        return Promise.reject(`Content '${expContent}' is not visible at Order Timeline`);
      }
    }
    return true;
  }

  //get tracking number of order
  async getTrackingNumber() {
    return (await this.page.locator("//div[contains(text(),'Tracking number:')]//a").first().textContent()).trim();
  }

  /**
   * click button Refund Items
   */
  async clickRefundItems() {
    await this.page.locator(`//span[contains(text(), 'Refund item')]`).click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * click button Refund Items
   */
  async clickRefundOrder() {
    await this.page.locator(`//span[contains(text(), 'Refund order')]`).click();
    await this.page.waitForLoadState("load");
  }

  /**
   * Click button refund on refund order page
   */
  async confirmRefund() {
    const xPath = "//span[contains(text(), 'Refund')]/..";
    await this.genLoc(xPath).click();
    await this.waitForToastMessageHide("Order has been refunded");
  }

  /**
   * fill quatity product for Refund
   * @param quantity
   */
  async fillRefundQuantity(quantity: string) {
    // eslint-disable-next-line max-len
    const refundInput = this.page.locator(
      `//span[@class='unfulfilled-card__quantity']//parent::div//preceding-sibling::input`,
    );
    await refundInput.focus();
    await refundInput.fill(quantity);
    await refundInput.press("Enter");
  }

  /**
   * Click vào button Refund trong màn Refund items detail
   */
  async clickRefundButton() {
    await this.page
      .locator(`//div[contains(@class,'refund-confirm-section')]//span[contains(text(), 'Refund')]`)
      .click();
    await this.waitUntilElementInvisible("//button[contains(@class, 'is-loading')]");
  }

  /**
   * Get order PLB quantity
   *
   */
  async getOrderQuantity(tab?: string) {
    let quantity: string;
    switch (tab) {
      case "Cannot Fulfill":
        quantity = await this.getTextContent("//*[contains(@class, 'cannot-fulfill')]//tbody/tr//td[4]");
        break;
      default:
        quantity = await this.getTextContent("//table//td[contains(@class,'line-image text-right')]");
        break;
    }

    return String(quantity).trim();
  }

  /**
   * Get order PLB date
   * @param orderName
   */
  async getOrderDate(orderName: string) {
    const result = await this.getTextContent(`//*[normalize-space()='${orderName}']/following-sibling::*`);
    return String(result).trim();
  }

  /**
   * Sometime for some reason order captures or calculate profit slower than usual
   * Reload page to wait until order complete processing
   * @param orderStt
   */
  async reloadUntilOrdCapture(orderStt?: string, times = 5) {
    if (!orderStt) {
      orderStt = await this.getOrderStatus();
    }
    for (let i = 0; i < times; i++) {
      if (orderStt.includes("Authorized")) {
        await this.page.waitForTimeout(1000);
        await this.page.reload();
        await this.page.waitForSelector(this.orderStatus);
        orderStt = await this.getOrderStatus();
        // Set timeout to avoid reload too many times
        await this.page.waitForTimeout(1000);
      } else {
        break;
      }
    }
    if (orderStt.includes("Authorized")) {
      throw new Error("Order still in Authorized status");
    }
    return orderStt;
  }

  async reloadUntilChargebackMsgShown() {
    const xpathMsg = this.xpathDisputeNotification;
    // For sometime playwright too fast
    for (let index = 0; index < 5; index++) {
      if (await this.page.locator(xpathMsg).isVisible()) {
        break;
      }
      await this.page.reload();
      await this.page.waitForSelector(this.orderStatus);
    }
    if (await this.page.locator(xpathMsg).isHidden()) {
      throw new Error("Oh no! After 5 times of reload, the chargeback's status still hidden.");
    }
  }

  async getOrderProfit(times = 3): Promise<number> {
    let profit = 0;
    for (let i = 0; i < times; i++) {
      profit = Number(removeCurrencySymbol(await this.getProfit()));
      if (profit > 0) {
        break;
      }
      await this.page.reload();
      await this.page.waitForSelector("//h2[contains(text(), 'Order')] | //h3[contains(text(), 'Order')]");
    }
    return profit;
  }

  /**
   * get net payment value in order detail
   * @returns net payment as number
   */
  async getNetPaymentValue(): Promise<number> {
    let netPayment = await this.page
      .locator(`//td[preceding-sibling::td[normalize-space()='Net Payment']]`)
      .textContent();
    netPayment = removeCurrencySymbol(netPayment);
    return parseFloat(netPayment);
  }

  /**
   * Get status of order after cancel order
   * @returns Order Cancel status
   */
  async getCancelStatusInOrderDetail(): Promise<string> {
    const xpath = `//div[contains(@class, 'title-bar__orders-show-badge')]//span[contains(text(), 'Cancelled')]`;
    let cancelStatus = "";
    if (await this.page.locator(xpath).isVisible()) {
      cancelStatus = await this.getTextContent(xpath);
    }
    return cancelStatus;
  }

  /**
   * get order information in order detail page
   * @returns order information as OrderInfo
   */
  async getOrderInfoInOrderPage(): Promise<OrderInfo> {
    let dscValue = await this.getDiscountVal();
    if (dscValue !== "Free shipping") {
      dscValue = removeCurrencySymbol(dscValue);
    }
    return {
      discountValue: dscValue,
      discountName: await this.getDiscountName(),
      totalVal: parseFloat(removeCurrencySymbol(await this.getTotalOrder())),
      payment_status: await this.getPaymentStatus(),
      cancel_status: await this.getCancelStatusInOrderDetail(),
    };
  }

  /**
   * Click button view invoice in order page
   */
  async viewInvoice() {
    await this.page.click(`//button[span[contains(text(),'View invoice')]]`);
    await this.page.waitForSelector(`//div[h4[contains(text(),'Transaction')]]`);
  }

  /**
   * select order in the order list grid and take action
   * @param orderName
   * @param actionName
   */
  async actionOrderList(orderName: string, actionName: string) {
    await this.page.click(
      `(//table[@class='sb-table__body'])[1]/descendant::div[contains(text(),'${orderName}')]/` +
        `ancestor::td/preceding-sibling::td/descendant::span`,
    );
    await this.page.click("(//span[contains(text(),'Actions')])[2]");
    await this.page.click(`(//li[contains(text(),'${actionName}')])[2]`);
    await this.page.click("//span[contains(text(),'Generate')]");
  }

  /**
   * Filter order names with input searchterm
   * @param name
   * @param searchTerm
   */
  async inputSearchTermToFilterOption(name: string, searchTerm: string, clickBtnApply = true) {
    await this.page.locator(`//input[contains(@placeholder,'${name}')]`).clear();
    await this.page.fill(`//input[contains(@placeholder,'${name}')]`, searchTerm);
    if (clickBtnApply) {
      await this.clickButtonOnPopUpByClass("sb-filter__button", 2);
      await this.page.waitForSelector(`(//small[@class='s-info'])[1]`, { state: "hidden" });
    }
  }

  /**
   * Get all shipping info in order detail page include original shipping fee and shipping fee after apply discount
   * @param shippingMethod
   * @returns shipping infomation include original shipping fee and shipping fee after apply discount
   */
  async getShippingValuesInOrdDetail(
    shippingMethod: string,
  ): Promise<{ originShipFee: number; newShippingValue: string | number }> {
    let originalShipFee;
    if (await this.page.locator(`//tbody[tr/td[normalize-space()='${shippingMethod}']]//span/del`).isVisible()) {
      originalShipFee = await this.page.textContent(`//tbody[tr/td[normalize-space()='${shippingMethod}']]//span/del`);
      originalShipFee = Number(removeCurrencySymbol(originalShipFee));
    }
    let newShippingValue = await this.page.textContent(
      `//tbody[tr/td[normalize-space()='${shippingMethod}']]//span[last()]`,
    );
    newShippingValue = newShippingValue.trim();
    if (newShippingValue !== "Free") {
      newShippingValue = removeCurrencySymbol(newShippingValue);
    }
    const shippingFee = {
      originShipFee: originalShipFee,
      newShippingValue: newShippingValue,
    };
    return shippingFee;
  }

  async getDesignFee(): Promise<string> {
    const xpath = `//span[contains(text(),'Design fee')]/following-sibling::span`;
    if (await this.page.locator(xpath).isVisible()) {
      return await this.getTextContent(xpath);
    }
    return "0";
  }

  /**
   * Get discount shipping amount on block Profit of order PBase (with -)
   */
  async getDiscountShipping(): Promise<string> {
    const xpath = `//span[contains(text(),'Discount shipping')]/following-sibling::span`;
    if (await this.page.locator(xpath).isVisible()) {
      return removeCurrencySymbol(await this.getTextContent(xpath));
    }
    return "0";
  }

  /**
   * Click to icon expand to show handling fee detail
   */
  async clickToShowHandlingFee(): Promise<void> {
    await this.page.click(
      `//div[div/span[normalize-space()='Handling fee']]/following-sibling::div//i[contains(@class,'arrow-down-drop')]`,
    );
  }

  /**
   * Calculate fees and profit off order Printbase
   * @param paymentFeePercent : default 0.03
   * @param processingFeePercent : default 0.04
   * @returns
   */
  async calculateProfitAndFeesOrderPbase(
    paymentFeePercent = 0.03,
    processingFeePercent = 0.04,
  ): Promise<{ paymentFee: number; processingFee: number; profit: number }> {
    if (process.env.ENV == "dev") {
      paymentFeePercent = 0.05;
    }
    await this.clickShowCalculation();
    await this.clickToShowHandlingFee();
    let subtotal = Number(removeCurrencySymbol(await this.getSubtotalOrder()));
    const tip = Number(removeCurrencySymbol(await this.getTip()));
    const shippingFee = Number(removeCurrencySymbol(await this.getShippingFee()));
    const taxAmount = Number(removeCurrencySymbol(await this.getTax()));
    const isTaxInclude = await this.page
      .locator(`//td[contains(text(),'Tax')]/following-sibling::td[contains(text(),'include in price')]`)
      .isVisible();
    if (isTaxInclude) {
      subtotal -= taxAmount;
    }
    const storeDiscount = -(
      Number(removeCurrencySymbol(await this.getDiscountVal())) + Number(await this.getDiscountShipping())
    );
    const baseCost = Number(removeCurrencySymbol(await this.getBaseCost()));
    const designFee = Number(removeCurrencySymbol(await this.getDesignFee()));
    const markupShipping = Number(await this.getMarkupShipping());
    const orderFeesAndProfit = this.calculateProfitPbase(
      subtotal,
      tip,
      shippingFee,
      taxAmount,
      storeDiscount,
      baseCost,
      designFee,
      paymentFeePercent,
      processingFeePercent,
      markupShipping,
    );
    return orderFeesAndProfit;
  }

  /*
   * Fulfill with Fulfillment service
   * @param: fulfillmentService: Fulfillment service
   */
  async fulfillWithFulfillmentService(fulfillmentService: string) {
    const xpathBtnFulfillWith = "//button[normalize-space()='Fulfill with']";
    const valueFulfillmentService = `//div[child::button[normalize-space()='Fulfill with']]//following-sibling::div[@class='s-dropdown-menu']//span[normalize-space()='${fulfillmentService}']`;
    await this.page.waitForSelector(xpathBtnFulfillWith);
    await this.page.click(xpathBtnFulfillWith);
    await this.page.waitForSelector(valueFulfillmentService);
    await this.page.click(valueFulfillmentService);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Verify order info
   */
  async verifyOrderInfo(
    orderTotals: OrderTotalAmount,
    paymentFeePercent: number,
    processingFeePercent: number,
    verifyFields: {
      revenue?: boolean;
      profit?: boolean;
      handlingFee?: boolean;
      paidByCustomer?: boolean;
      paymentFee?: boolean;
      processingFee?: boolean;
    },
    plbOrder?: PlusbaseOrderAPI,
  ) {
    const baseCost = Number(removeCurrencySymbol(await this.getBaseCost(plbOrder)));
    const shippingCost = Number(removeCurrencySymbol(await this.getShippingCost()));
    const totals = orderTotals;
    const { revenue, handlingFee, profit, paymentFee, processingFee } = this.calculateProfitPlusbase(
      totals.total_price,
      totals.subtotal_price,
      totals.total_discounts,
      baseCost,
      shippingCost,
      totals.shipping_fee,
      0, // tax included
      totals.total_tipping,
      paymentFeePercent,
      processingFeePercent,
    );

    if (verifyFields.profit) {
      // Verify profit
      const profitActual = Number(removeCurrencySymbol(await this.getProfit()));
      expect(isEqual(profitActual, Number(profit), 0.1)).toBeTruthy();
    }
    if (verifyFields.revenue) {
      // Verify revenue
      const revenueActual = Number(removeCurrencySymbol(await this.getRevenue()));
      expect(revenueActual).toEqual(Number(revenue));
    }

    // Verify handling fee
    if (verifyFields.handlingFee) {
      const handlingFeeActual = Number(removeCurrencySymbol(await this.getHandlingFee()));
      const compareValueHandlingFee = handlingFeeActual - handlingFee;
      expect(
        Number(compareValueHandlingFee.toFixed(2)) >= -0.01 && Number(compareValueHandlingFee.toFixed(2)) <= 0.01,
      ).toEqual(true);
    }

    // Verify paid by customer
    if (verifyFields.paidByCustomer) {
      const paidByCustomerActual = Number(removeCurrencySymbol(await this.getPaidByCustomer()));
      expect(paidByCustomerActual).toEqual(Number(totals.total_price.toFixed(2)));
    }
    if (verifyFields.paymentFee || verifyFields.processingFee) {
      await this.clickToShowHandlingFee();
    }
    // Verify payment fee
    if (verifyFields.paymentFee) {
      const paymentFeeActual = Number(removeCurrencySymbol(await this.getPaymentFee()));
      expect(paymentFeeActual).toEqual(Number(paymentFee));
    }

    // Verify processing fee
    if (verifyFields.processingFee) {
      const processingFeeActual = Number(removeCurrencySymbol(await this.getProcessingFee()));
      expect(processingFeeActual).toEqual(Number(processingFee));
    }
  }

  /**
   * Search abandoned checkout by customer email
   * Go to abandoned checkout by customer name
   * @param email : email of customer
   * @param customerName : first name + last name of customer
   */
  async searchThenGoToAbandonedCheckout(email: string, customerName: string): Promise<void> {
    await this.page.locator("(//input[@placeholder='Search checkouts'])[2]").fill(email);
    await this.page.locator(`(//td[contains(., '${customerName}')])[1]`).click();
    await this.page.waitForSelector("//a[contains(., 'Abandoned Checkouts')]");
  }

  /**
   Get customer name of abandoned checkout details
   */
  async getCustomerNameInAC(): Promise<string> {
    const actualCustomerName = await this.page
      .locator("//div[@class='card__section']//a[contains(@href,'admin/customers')]")
      .textContent();
    return actualCustomerName.trim();
  }

  /**
   Get customer email of abandoned checkout details
   */
  async getCustomerEmailInAC(): Promise<string> {
    const actualCustomerEmail = await this.page
      .locator("(//div[@class='card__section']//p[a[contains(@href,'admin/customers')]]/following::div)[1]")
      .textContent();
    return actualCustomerEmail.trim();
  }

  /**
   Get shipping address of abandoned checkout details
   */
  async getShippingAddressInOrder(): Promise<string> {
    const actualShippingAddress = await this.page
      .locator("(//*[normalize-space()='Shipping address']/following-sibling::div)[last()]")
      .textContent();
    return actualShippingAddress.trim();
  }

  /**
   Get total order of abandoned checkout details
   */
  async getTotalOrderAtAC(): Promise<string> {
    const actualTotalOrder = await this.page.locator("//span[text()='Total']//following-sibling::span").textContent();
    return removeCurrencySymbol(actualTotalOrder).trim();
  }

  /**
   * Get timeline schedule of abandoned checkout
   */
  async getTimelineScheduledAndSentEmails(): Promise<Array<string>> {
    const timeLine = await this.page.locator("//div[@class='content-body']").allTextContents();
    const formattedTimeLines = timeLine.map(item => item.split(" to be sent")[0]);
    return formattedTimeLines;
  }

  /**
   * Get abandoned checkout status in abandoned checkout list
   * @param abandonedCheckoutID
   */
  async getAbandonedCheckoutStatus(abandonedCheckoutID: string): Promise<string> {
    const actualStatus = await this.page
      .locator(`(//td[contains(., '#${abandonedCheckoutID}')]//following-sibling::td)[5]`)
      .textContent();
    return actualStatus.trim();
  }

  /**
   * Get all info of order summary in order detail for shopbase
   * @returns order summary info
   */
  async getOrderSummaryShopBaseInOrderDetail(): Promise<Order> {
    const [infoTotal, infoSubtotal, infoTip, infoShipping, infoTax, infoDiscount, infoPaidByCustomer] =
      await Promise.all([
        this.getTotalOrder(),
        this.getSubtotalOrder(),
        this.getTip(),
        this.getShippingFee(),
        this.getTax(),
        this.getDiscountVal(),
        this.getPaidByCustomer(),
      ]);
    const total = Number(removeCurrencySymbol(infoTotal));
    const subtotal = Number(removeCurrencySymbol(infoSubtotal));
    const tip = Number(removeCurrencySymbol(infoTip));
    const shippingFee = Number(removeCurrencySymbol(infoShipping));
    //get tax rate
    const taxAmount = Number(removeCurrencySymbol(infoTax));
    let taxInclude = 0;
    let isTaxInclude;
    const linkTextShowTaxRate = this.page.locator(
      `//td[contains(text(),'Tax')]/following-sibling::td/div[contains(text(),'Show tax rates')]`,
    );
    const isManyTaxRate = await linkTextShowTaxRate.isVisible();
    if (isManyTaxRate) {
      await linkTextShowTaxRate.click();
      await this.page.waitForSelector(`//h3[normalize-space()='Tax rates']`);
      isTaxInclude = await this.page.locator(`(//div[contains(text(),'include in price')])[1]`).isVisible();
    } else {
      isTaxInclude = await this.page
        .locator(`//td[contains(text(),'Tax')]/following-sibling::td[contains(text(),'include in price')]`)
        .isVisible();
    }
    if (isTaxInclude) {
      taxInclude = taxAmount;
    }

    const discount = Number(removeCurrencySymbol(infoDiscount));
    const paidByCustomer = Number(removeCurrencySymbol(infoPaidByCustomer));
    return {
      total: total,
      subtotal: subtotal,
      tip: tip,
      shipping_fee: shippingFee,
      tax_amount: taxAmount,
      is_tax_include: taxInclude !== 0,
      discount: discount,
      paid_by_customer: paidByCustomer,
    };
  }

  /**
   * Get all info of order summary in order detail
   * @returns order summary info
   */
  async getOrderSummaryInOrderDetail(plbOrder?: PlusbaseOrderAPI): Promise<Order> {
    await this.clickShowCalculation();
    await this.clickToShowHandlingFee();
    const [
      infoTotal,
      infoSubtotal,
      infoTip,
      infoShippingRate,
      infoTax,
      infoDiscount,
      infoBasecost,
      infoShippingCost,
      infoPaidByCustomer,
      infoRevenue,
      infoHandlingFee,
      infoProfit,
      infoProcessingFee,
    ] = await Promise.all([
      this.getTotalOrder(),
      this.getSubtotalOrder(),
      this.getTip(),
      this.getShippingFee(),
      this.getTax(),
      this.getDiscountVal(),
      this.getBaseCost(plbOrder),
      this.getShippingCost(),
      this.getPaidByCustomer(),
      this.getRevenue(),
      this.getHandlingFee(),
      this.getProfit(),
      this.getProcessingFee(),
    ]);
    const total = Number(removeCurrencySymbol(infoTotal));
    const subtotal = Number(removeCurrencySymbol(infoSubtotal));
    const tip = Number(removeCurrencySymbol(infoTip));
    const shippingFee = Number(removeCurrencySymbol(infoShippingRate));
    //get tax rate
    const taxAmount = Number(removeCurrencySymbol(infoTax));
    let taxInclude = 0;
    let isTaxInclude;
    const linkTextShowTaxRate = this.page.locator(
      `//td[contains(text(),'Tax')]/following-sibling::td/div[contains(text(),'Show tax rates')]`,
    );
    const isManyTaxRate = await linkTextShowTaxRate.isVisible();
    if (isManyTaxRate) {
      await linkTextShowTaxRate.click();
      await this.page.waitForSelector(`//h3[normalize-space()='Tax rates']`);
      isTaxInclude = await this.page.locator(`(//div[contains(text(),'include in price')])[1]`).isVisible();
    } else {
      isTaxInclude = await this.page
        .locator(`//td[contains(text(),'Tax')]/following-sibling::td[contains(text(),'include in price')]`)
        .isVisible();
    }
    if (isTaxInclude) {
      taxInclude = taxAmount;
    }

    const discount = Number(removeCurrencySymbol(infoDiscount));
    const basecost = Number(removeCurrencySymbol(infoBasecost));
    const shippingCost = Number(removeCurrencySymbol(infoShippingCost));
    const paidByCustomer = Number(removeCurrencySymbol(infoPaidByCustomer));
    const revenue = Number(removeCurrencySymbol(infoRevenue));
    const handlingFee = Number(removeCurrencySymbol(infoHandlingFee));
    const profit = Number(removeCurrencySymbol(infoProfit));
    const processingFee = Number(removeCurrencySymbol(infoProcessingFee));
    return {
      total: total,
      subtotal: subtotal,
      tip: tip,
      shipping_fee: shippingFee,
      tax_amount: taxAmount,
      is_tax_include: taxInclude !== 0 ? true : false,
      discount: discount,
      base_cost: basecost,
      shipping_cost: shippingCost,
      paid_by_customer: paidByCustomer,
      revenue: revenue,
      handling_fee: handlingFee,
      profit: profit,
      processing_fee: processingFee,
    };
  }

  /**
   * Get CPF/CNPJ Number on order detail
   */
  async getCpfOrCnpjNumberOnOrderDetail(): Promise<string> {
    const shippingAddressInfo = await this.page.locator("//div[@class='s-flex--fill']//div").textContent();
    return shippingAddressInfo;
  }

  /**
   * Edit shipping address on order detail and get message error
   * @param label : trường thông tin shipping cần edit
   * @returns  message error
   */
  async getMsgErrorEditShipping(label: string): Promise<string> {
    const xpathMsgError = `//div[normalize-space()='${label}']//following-sibling::div//div[contains(@class,'item__error')]`;
    await this.page.waitForSelector(xpathMsgError);
    const messageError = await this.page.locator(xpathMsgError).textContent();
    return messageError;
  }

  /**
   * Edit info shipping address on order detail
   * @param fieldName: Label of field edit
   * @param data: data edit
   */
  async editShippingAddress(fieldName: string, data: string): Promise<void> {
    await this.page.click("//div[contains(@class,'shipping__edit')]//span[normalize-space()='Edit']");
    await this.page.waitForSelector("//div[@class='modal-address__content']");
    await this.page.fill(
      `//label[normalize-space()='${fieldName}']//parent::div//following-sibling::div//child::input`,
      data,
    );
    await this.page.click("//span[normalize-space()='Save']");
  }

  /**
   * xpath Filter Dropdown Field In More Filter
   * @param fieldName
   * @returns
   */
  getXpathFilterDropdown(fieldName: string): Locator {
    const field = this.genLoc(`.sb-collapse-item`).filter({
      has: this.genLoc(`//*[normalize-space()="${fieldName}"]`),
    });
    return field;
  }

  /**
   *click To Show Field Filter More
   * @param fieldName
   */
  async clickToShowFieldFilterMore(fieldName: string) {
    const field = this.getXpathFilterDropdown(fieldName);
    const fieldOpened = await field.locator("[class*=description]:not([style*=none])").isVisible();
    if (!fieldOpened) {
      await field.click();
    }
  }

  /**
   * filter Order With Drop Down Option
   * @param fieldName
   * @param searchTerm
   */
  async filterOrderWithDropDownOption(fieldName: string, searchTerm: string): Promise<void> {
    const field = this.getXpathFilterDropdown(fieldName);
    await this.clickButtonMoreFilters();
    await this.clickToShowFieldFilterMore(fieldName);
    await field.getByRole("button").click();
    // Choosing searchTerm on drop down list
    await this.page.click(`//label[normalize-space()='${searchTerm}']`);
  }

  /**
   * Export customer
   * @return path file export
   * */
  async downloadFileExportOrder(folder: string): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.clickButtonOnPopUpWithLabel("Export to file"),
    ]);
    const path = await download.suggestedFilename();
    await download.saveAs(`./data/${folder}/${path}`);
    return `./data/${folder}/${path}`;
  }

  /**
   * select Option Export
   */
  async selectFieldsToExportOrder(fieldsName: string[]): Promise<void> {
    await this.page.click("//span[contains(text(),'Selected')]");
    await this.page.click("//span[normalize-space()='Customize export fields']");
    for (let i = 0; i < fieldsName.length; i++) {
      await this.page.click(`(//div[normalize-space()='${fieldsName[i]}'])[1]//following-sibling::span//button`);
    }
  }

  /**
   * @param numberOfOrder Select each order until the quantity = numberOfOrder which are most recent orders
   */
  async selectOrders(numberOfOrder: number, isSBaseStore = true) {
    if (isSBaseStore) {
      for (let i = 0; i < numberOfOrder; i++) {
        await this.page
          .locator(`(//tr[contains(@class,'cursor-default')]//span[@class = 'sb-check'])[${i + 1}]`)
          .click();
      }
      await this.page.waitForSelector(`//span[contains(normalize-space(),'${numberOfOrder} items selected')]`);
    } else {
      for (let i = 0; i < numberOfOrder; i++) {
        await this.page
          .locator(`(//tr[contains(@class,'cursor-default')]//span[@class = 's-check'])[${i + 1}]`)
          .click();
      }
      await this.page.waitForSelector(`//span[contains(normalize-space(),'${numberOfOrder} orders')]`);
    }
  }

  /**
   * Get refundef value in order detail
   * @returns
   */
  async getTotalRefundedOnOrderDetail(): Promise<string> {
    return await this.page.innerText("(//td[normalize-space()='Refunded']//parent::tr//td)[3]");
  }

  getXpathTextRefundInTimeline(refundAmount: string): Locator {
    return this.genLoc(
      `//div[contains(text(),'refunded $${refundAmount} USD on Ocean-Payment') or contains(text(),'refunded $${refundAmount} USD on Oceanpay-1')]`,
    );
  }

  async goToOrderListFromOrderDetail(platform?: "PlusBase" | "PrintBase"): Promise<void> {
    await this.genLoc("//a[contains(text(),'Orders')]").click();
    if (platform) {
      await this.waitUntilElementVisible("//span[normalize-space()='Orders']");
    } else {
      await this.waitUntilElementVisible(
        "(//table[@class='sb-table__header sb-relative']//span[normalize-space()='Order'])[1]",
      );
    }
  }

  async getPaymentStatusInOrderList(orderName: string): Promise<string> {
    return await this.page.innerText(
      `//div[contains(@class,'scrollable-y')]/descendant::div[contains(text(),'${orderName}')]/ancestor::td/following-sibling::td[4]/descendant::span`,
    );
  }

  /**
   * Get payment status order
   * @returns
   */
  async isPaymentStatus(): Promise<boolean> {
    const paymentStatus = await this.page.innerText(this.orderStatus);
    if (paymentStatus !== "Paid") {
      return false;
    } else {
      return true;
    }
  }

  // Wait for payment status of order from authorized to paid
  async waitForPaymentStatusIsPaid(): Promise<void> {
    let i = 0;
    while (!(await this.isPaymentStatus()) && i < 50) {
      await this.page.waitForTimeout(3 * 1000);
      await this.page.reload();
      await this.page.waitForSelector(this.orderStatus);
      i++;
    }
  }

  getLocatorTimelineSendEmail(customerFirstName: string, customerLastName: string, customerEmail: string): Locator {
    return this.genLoc(
      `//div[contains(text(),'sent an order cancelled email to ${customerFirstName} ${customerLastName} (${customerEmail})')]`,
    );
  }

  getLocatorTextRefundAmountInTimeline(cancelWith: number): Locator {
    return this.genLoc(`text=refunded $${cancelWith} USD`);
  }

  getLocatorReasonCancelInTimeline(reason: string): Locator {
    return this.genLoc(
      `//div[@class='content-body' and contains(normalize-space(),'canceled this order. Reason: ${reason}')]`,
    );
  }

  getLocatorTextMarkItemAsFulfillInTimeline(productQty: number): Locator {
    if (productQty === 1) {
      return this.genLoc("(//div[contains(text(),'marked 1 item as fulfilled')])[1]");
    } else {
      return this.genLoc(`(//div[contains(text(),'marked ${productQty} items as fulfilled')])[1]`);
    }
  }

  getLocatorTextSendEmailConfirmShippingInTimeline(
    customerFirstName: string,
    customerLastName: string,
    customerEmail: string,
  ): Locator {
    return this.genLoc(
      `(//div[contains(text(),'sent a shipping confirmation email to ${customerFirstName} ${customerLastName} (${customerEmail})')])[1]`,
    );
  }

  async getFulfillmentStatusInOrderList(orderName: string): Promise<string> {
    return await this.page.innerText(
      `//div[contains(@class,'scrollable-y')]/descendant::div[contains(text(),'${orderName}')]/ancestor::td/following-sibling::td[3]/descendant::span`,
    );
  }

  xpathMoreActionWithLabel(actionLabel: string): string {
    return `//span[@class='s-dropdown-item']//span[normalize-space()='${actionLabel}']`;
  }

  xpathBtnWithLabelOnBlockUnfulfilledOrFulfilled(fulfillStatus: string, label: string): string {
    return `//h2[contains(text(),'${fulfillStatus}')]/ancestor::section/descendant::*[contains(text(),'${label}')]`;
  }

  /**
   * Wait for status of status generate print file
   * @param status include: "Print file has been generated "
   * @param orderName is order name
   * @param retries number of retries
   * @param index is index of item
   */
  async waitForStatusGeneratePrintFile(
    status: string,
    orderName: string,
    index = 1,
    retries = 5,
    numberGen?: "only_order_items" | "all_unfulfilled",
  ): Promise<void> {
    let checkStatus: boolean;
    do {
      checkStatus = await this.page
        .locator("//section[contains(@class,'card fulfillment-card')]")
        .isVisible({ timeout: 15000 });
    } while (checkStatus === false && retries >= 0);
    //trên dev gen file chậm nên chờ xu ly xong rôi action tiep
    await this.page.waitForTimeout(60000);
    if (status) {
      for (let i = 0; i < retries; i++) {
        const statusGeneratePrintFile = await this.page
          .locator(
            `(//section[contains(@class,'card fulfillment-card')]//span[contains(@class,'s-tag') or contains(@class,'cursor-pointer')])[${index}]`,
          )
          .textContent({ timeout: 5000 });
        if (numberGen && statusGeneratePrintFile.includes("Generate print file")) {
          await this.page.click(
            `(//section[contains(@class,'card fulfillment-card')]//span[contains(@class,'s-tag') or contains(@class,'cursor-pointer')])[${index}]`,
          );
          await this.page.click(
            `//div[contains(@class, 'popup-save_print_file')]//label//input[@value='${numberGen}']`,
          );
          await this.dashboard.clickOnBtnLinkWithLabel("Generate");
        }

        if (statusGeneratePrintFile.includes(status)) {
          break;
        }
        await this.dashboard.navigateToMenu("Products");
        await this.page.waitForSelector(
          "//tr[descendant::th[normalize-space()= 'PRODUCT']] | //h3[normalize-space()='Add your products']",
        );
        await this.dashboard.navigateToMenu("Orders");
        await this.searchOrder(orderName);
        await this.goToOrderDetailSBase(orderName);
      }
    }
  }

  /**
   * Calculate Revenue order Printbase
   * @returns
   */
  async calculateRevenuePbase(): Promise<number> {
    const subtotal = Number(removeCurrencySymbol(await this.getSubtotalOrder()));
    const discount = Math.abs(Number(removeCurrencySymbol(await this.getDiscountVal())));
    return subtotal - discount;
  }

  // Get base cost of product
  /**
   * get base code of product
   * @return base code
   * */
  async getBaseCostPbase(): Promise<number> {
    return Math.abs(
      Number(
        removeCurrencySymbol(
          await this.getTextContent(`//span[normalize-space()='Basecost']//following-sibling::span`),
        ),
      ),
    );
  }

  /**
   * Get tax value on order detail page printbase
   * @returns tax value
   */
  async getDesignInOrderPbase(): Promise<number> {
    let designValue = 0.0;
    const isTaxExist = await this.page
      .locator(`//span[contains(text(),'Design fee')]/following-sibling::span`)
      .isVisible();
    if (isTaxExist) {
      designValue = Number(
        removeCurrencySymbol(
          await this.getTextContent(`//span[contains(text(),'Design fee')]/following-sibling::span`),
        ),
      );
    }
    return Math.abs(designValue);
  }

  /**
   * Get status generate print file
   */
  async getStatusGeneratePrintFile(index = 1): Promise<string> {
    await this.page.waitForSelector("//section[contains(@class,'card fulfillment-card')]");
    const statusPrintFlie = await this.page
      .locator(
        `(//section[contains(@class,'card fulfillment-card')]//span[contains(@class,'s-tag') or contains(@class,'cursor-pointer')])[${index}]`,
      )
      .textContent();
    return statusPrintFlie.trim();
  }

  /**
   * Select action on order list
   * @param action
   */
  async selectActionToOrder(action: string) {
    await this.page.click(`(//span[normalize-space()='Actions'])[last()]`);
    await this.page.locator(`(//li[normalize-space()='${action}'])[last()]`).scrollIntoViewIfNeeded();
    await this.page.click(`(//li[normalize-space()='${action}'])[last()]`);
    switch (action) {
      case "Mark as fulfilled":
        await this.clickButton(`Fulfill orders`);
        await this.page.waitForSelector(this.genXpathToastMsg(`Order fulfilled`));
        break;
    }
  }

  /**
   * calculate value: total, subtotal, discount, markup shipping, tax, tip of line item
   * @param sellingPrice is selling price line item
   * @param taxRate is tax rate line item
   * @param shippingFee is shipping fee line item
   * @param discount is discount line item
   * @param tip is tip line item
   * @param isTaxExclude is tax exclude line item
   * @quantity is quantity of order
   * @param quantityLineItem is quantity line item
   * @param shippingFeeOrder is shipping fee order
   * @param shippingCostOrder is shipping cost order
   * @param discountInfo is discount info
   * return total, subtotal, discount, markup shipping, tax, tip of line item
   */
  async calculateValueByLineItem(
    sellingPrice: number,
    taxRate: number,
    shippingFee: number,
    tip: number,
    isTaxExclude: boolean,
    quantity: number,
    quantityLineItem: number,
    shippingFeeOrder: number,
    shippingCostOrder: number,
    discountInfo: Discount,
    checkout: SFCheckout,
  ): Promise<ValueLineItem> {
    let taxExcludeByLineItem = 0;
    let taxIncludeByLineItem = 0;
    if (isTaxExclude) {
      taxExcludeByLineItem = sellingPrice * taxRate;
    } else {
      taxIncludeByLineItem = (sellingPrice * taxRate) / (1 + taxRate);
    }
    const tipByLineItem = tip / quantity;

    const subtotalByLineItem = sellingPrice * quantityLineItem;
    const markupShippingByLineItem = (shippingFeeOrder - shippingCostOrder) / quantity;
    const discountByLineItem = await checkout.calculateDiscountByType(discountInfo, subtotalByLineItem);
    const totalByLineItem = sellingPrice + taxExcludeByLineItem + shippingFee - discountByLineItem + tipByLineItem;
    return {
      totalByLineItem: Number(totalByLineItem),
      subtotalByLineItem: Number(subtotalByLineItem),
      discountByLineItem: Number(discountByLineItem),
      markupShippingByLineItem: Number(markupShippingByLineItem),
      taxIncludeByLineItem: Number(taxIncludeByLineItem),
      tipByLineItem: Number(tipByLineItem),
    };
  }

  /**
   * Get xpath order name in order detail to load
   * @param orderName
   */
  async waitToLoadedOrderDetail(orderName: string) {
    await this.page.waitForSelector(`//h3[contains(normalize-space(),'${orderName}')]`);
  }

  /**
   * Check Storefront domain info of order is displayed
   * @param storefront_info has storefront_name and storefront_domain
   */
  async isDisplayStorefrontDomain(storefrontInfo: StorefrontInfo): Promise<boolean> {
    const isVisibleName = await this.page.locator(`//div[@class='storefront-info__name']/span`).isVisible();
    const isVisibleDomain = await this.page.locator(`//div[@class='storefront-info__domain']/span/a`).isVisible();
    if (isVisibleName == true && isVisibleDomain == true) {
      const storefrontName = await this.page.locator(`//div[@class='storefront-info__name']/span`).textContent();
      const storefrontDomain = await this.page.locator(`//div[@class='storefront-info__domain']/span/a`).textContent();
      if (storefrontDomain.includes(storefrontInfo.domain) && storefrontName.includes(storefrontInfo.name)) {
        return true;
      }
    } else {
      return false;
    }
  }

  /**
   * Get quantity of order on order list
   * @returns the quantity of orders
   */
  async getQuantityOfOrders(): Promise<number> {
    await this.page.waitForSelector("(//small[@class='s-info'])[1]", { state: "visible" });
    const quantityOrders = parseInt((await this.getTextContent("(//small[@class='s-info'])[1]")).split(" ")[2], 10);
    return quantityOrders;
  }

  async contentMessageWhenNoOrder(): Promise<string> {
    return String(await this.getTextContent(this.xpathNoOrder));
  }

  /**

   * @param dateTimePicker is name box have data time picker calendar
   */
  async filterDateFromToOnDTPOnFilter(dateTimePicker: string, timeFrom: string, timeTo: string) {
    await this.page.click(`//div[normalize-space()='${dateTimePicker}']/following-sibling::div//div//span`);
    await this.page.fill(
      `(//div[normalize-space()='${dateTimePicker}']/following-sibling::div//div[contains(@class,'sb-date-picker__input')]//input)[1]`,
      `${timeFrom}`,
    );
    await this.page.fill(
      `(//div[normalize-space()='${dateTimePicker}']/following-sibling::div//div[contains(@class,'sb-date-picker__input')]//input)[2]`,
      `${timeTo}`,
    );
    await this.page
      .locator(
        `(${this.xpathFiltersLabelInMoreFilter}/parent::div/following-sibling::div//div[normalize-space() = '${dateTimePicker}'])[1]`,
      )
      .click();
    await this.clickButtonOnPopUpByClass("sb-filter__button", 2);
    await this.page.waitForSelector(`(//small[@class='s-info'])[1]`, { state: `attached` });
  }

  /**
   * Fill SF domain to search order
   * @param domain is data to fill
   * @param platform if platform is pbase/plbase then UI is different
   */
  async fillDomainStorefrontToSearch(domain: string, isSBaseStore = true) {
    if (!isSBaseStore) {
      const searchField = this.page.locator(`//p[normalize-space()='Storefront domain' and contains(@class,'title')]`);
      await searchField.click();
      await this.page.locator(`//input[contains(@placeholder,'storefront domain')]`).fill(domain);
      await this.page.locator(`//button[contains(@class, 's-button')]/span[contains(text(),'Done')]`).click();
    } else {
      const searchField = this.page.locator(
        `//div[normalize-space()='Storefront domain' and contains(@class,'sb-text-body-emphasis')]`,
      );
      await searchField.click();
      await this.page.locator(`//input[contains(@placeholder,'storefront domain')]`).fill(domain);
      await this.page.locator(`//button[contains(@class, 'sb-filter')]/span[contains(text(),'Apply')]`).click();
    }
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Filter click checkbox optional
   * @param option is name checkbox on filter you want to fil
   */
  async selectOptionOnFilter(option: string, index = 1) {
    await this.page.click(`(//span//div[normalize-space()='${option}'])[${index}]`);
  }

  /**
   * Check checkbox on filtern visible
   * @param option is name checkbox on filter you want to fil
   */
  async checkBoxOnFilterExisted(option: string, index = 1): Promise<boolean> {
    return await this.page.locator(`(//span//div[normalize-space()='${option}'])[${index}]`).isVisible();
  }

  async clickButtonApplyOnFilter() {
    await this.clickButtonOnPopUpByClass("sb-filter__button", 2);
  }

  /**
   * Verify status order has been order list
   * @param id id order
   * @param status status wan to verify
   */
  async verifyStatusOrderOnList(id: string, status: string): Promise<boolean> {
    const statusOnlist = await (
      await this.page.textContent(`(//div[normalize-space()='${id}']/ancestor::td/following-sibling::td[3])[1]`)
    ).trim();
    if (statusOnlist == `${status}`) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Count timeline on order detail
   * @param timeLine title timeline
   */
  async countTimeLine(timeLine: string): Promise<number> {
    const countTimeLine = this.page.locator(
      `(//div[contains(@class,'timeline-list')]//div[contains(text(),'${timeLine}')])`,
    );
    return countTimeLine.count();
  }

  /*
   * Get rate currency in Paid by customer when 'Switch currency'
   */
  async getRateCurrency() {
    const value = await this.page.textContent(
      "//table[contains(@class, 'order-details-summary-table')]//span[normalize-space()='Switch currency']/preceding-sibling::span",
    );
    if (value) {
      const regexs = value.match(/([0-9.,]+)/g);
      return !regexs || !regexs.length ? 0 : parseFloat(regexs[regexs.length - 1].replace(",", "."));
    }
    return 0;
  }

  /*
   * Get profit text message in Order page when order is not approved
   */
  async getProfitMessage() {
    return await this.getTextContent("//span[@class='is-warning']");
  }

  /*
   * Get list transactions ID in order timeline
   */
  async getListTransactionsId(): Promise<string[]> {
    let listTransactionsID: string[] = [];
    listTransactionsID = await this.page.locator("//div[contains(text(), 'transaction ID')]").allTextContents();
    for (const transactionID of listTransactionsID) {
      listTransactionsID[listTransactionsID.indexOf(transactionID)] = transactionID.split("transaction ID is ")[1];
    }
    return listTransactionsID;
  }

  /*
   * Get text activity in conversion details
   */
  async getTextActivity(index = 1, xpath = "") {
    return await this.getTextContent(
      `(//div[@class="s-modal is-active"]//p[@class="utm-source-multiline"]${xpath})[${index}]`,
    );
  }

  /**
   * Filter order in list order
   * */

  async filterOrderSbase(dataFilter: FilterOrder) {
    await this.clickOnFieldWithLabelOnFilter(dataFilter.name_filter);
    const xpathFiledActive = `(${this.xpathFiltersLabelInMoreFilter}/parent::div/following-sibling::div//div[normalize-space() = '${dataFilter.name_filter}'])[1]/parent::div[contains(@class,"sb-collapse-item--active")]`;
    await this.page.waitForSelector(xpathFiledActive);
    await this.page.fill(`${xpathFiledActive}//input`, dataFilter.value_filter);
  }

  /**
   * get info UTM parameters in section detail
   * */

  async getInfoUTMParameters(infoUTMParameters: InfoUTMParameters): Promise<InfoUTMParameters> {
    const infoUTM = cloneDeep(infoUTMParameters);
    if (infoUTM.medium) {
      infoUTM.medium = (await this.page.locator(this.xpathOrderUtmMedium).textContent()).trim();
    }
    if (infoUTM.content) {
      infoUTM.content = (await this.page.locator(this.xpathOrderUtmContent).textContent()).trim();
    }
    if (infoUTM.term) {
      infoUTM.term = (await this.page.locator(this.xpathOrderUtmTerm).textContent()).trim();
    }
    if (infoUTM.source) {
      infoUTM.source = (await this.page.locator(this.xpathOrderUtmSource).textContent()).trim();
    }
    if (infoUTM.campaign) {
      infoUTM.campaign = (await this.page.locator(this.xpathOrderUtmCampaign).textContent()).trim();
    }
    return infoUTM;
  }

  /**
   * Count line Fulfillment
   * */
  async countLineFulfillment(): Promise<number> {
    return await this.page.locator(`//section[contains(@class,'fulfillment-card')]`).count();
  }

  /**
   * get list order hold amountn in shop template plb
   * @return listHoldAmount: mảng số tiền hold
   */
  async getListHoldAmount(): Promise<number[]> {
    const listHoldAmount: Array<number> = [];
    for (let i = 1; i <= (await this.page.locator(`//tbody//tr`).count()); i++) {
      listHoldAmount.push(Number(removeCurrencySymbol(await this.getDataTable(1, i, 10))));
    }
    return listHoldAmount;
  }

  /**
   * Get onhold status of order in order list
   * @returns status on hold of order in order list
   */
  async getOnHoldStatusInOrderList(): Promise<string> {
    const result = await this.getTextContent("//div[child::span[contains(@class,'order-profit-value')]]//div");
    return String(result).trim();
  }

  /**
   * get data box hold payout
   * @param title of box hold
   */
  async getDataBoxHoldPayout(title: string): Promise<string> {
    return await this.getTextContent(`//div[preceding-sibling::div[normalize-space()='${title}']]`);
  }

  /**
   * Open view full session on Order detail
   * @param orderID
   */
  async openViewSecssionOrder(orderID: string) {
    await this.goto(`/admin/orders/${orderID}`);
    await this.page.waitForLoadState("networkidle");
    await this.openViewFullSecssion();
  }

  /**
   * verify status line item in order
   * @param typeOfProduct: Dropship product | Pod product
   * @param status: status of line item
   */
  async verifyStatusLineItem(typeOfProduct: string, status: string): Promise<boolean> {
    let statusLineItem;
    const countLine = await this.page.locator(`//span[contains(text(),"${typeOfProduct}")]`).count();
    for (let i = 1; i <= countLine; i++) {
      statusLineItem = (
        await this.page.textContent(
          `(//span[contains(text(),"${typeOfProduct}")]/parent::span/following-sibling::span)[${i}]`,
        )
      ).trim();
      if (statusLineItem != `${status}`) {
        return false;
      }
    }
    return true;
  }

  /**
   * Lấy thông tin liên quan đến giá sản phẩm áp dụng khi checkout, bao gồm exchange rate, price adjustment, rounding
   * @returns
   */
  async getInfoSwitchCurrency(): Promise<{ exchangeRate: string; priceAdjustment: string; rounding: string }> {
    return {
      exchangeRate: await this.page.innerText(
        `(//span[contains(normalize-space(),'Exchange rate')]//parent::div//span)[2]`,
      ),
      priceAdjustment: await this.page.innerText(
        `(//span[contains(normalize-space(),'Price Adjustment')]//parent::div//span)[2]`,
      ),
      rounding: await this.page.innerText(`(//span[contains(normalize-space(),'Rounding')]//parent::div//span)[2]`),
    };
  }

  /**
   * choose reason for refund/ cancel
   * @param reason reason cancel/refund
   */
  async chooseReasonCanelRefund(reason: string) {
    await this.page.locator("//input[@placeholder='Search for reason']").click();
    await this.page.keyboard.type(reason.substring(0, reason.length / 2));
    await this.page.waitForSelector(
      `//div[@class='s-select-searchable__item-list']//div[contains(text(), '${reason}')]`,
    );
    await this.page
      .locator(`//div[@class='s-select-searchable__item-list']//div[contains(text(), '${reason}')]`)
      .click();
  }

  /**
   * Input value filter to search box on Abandoned checkout list then Enter
   * @param value
   */
  async searchAbandonedCheckout(value: string) {
    const xpathSearch = this.page.locator("//div[@class='order-search-form']//input[@placeholder='Search checkouts']");
    await xpathSearch.fill(value);
    await this.page.waitForTimeout(2000);
    await xpathSearch.press("Enter");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get recovery status of Abandoned checkout only after searching by checkout token
   */
  async getRecoveryStatusOfAbandonedCO() {
    await this.page.waitForTimeout(1500);
    await this.page.waitForSelector(`//tr[@class = 'cursor-default']`);
    const status = this.page.locator("(//tr//span[contains(@class, 'is-success')])[2]").textContent();
    return (await status).trim();
  }

  async openFirstOrderDetail() {
    const xpathFirstOrder = "(//td//a)[1]";
    await this.page.waitForSelector(xpathFirstOrder);
    await this.page.click(xpathFirstOrder);
  }
}
