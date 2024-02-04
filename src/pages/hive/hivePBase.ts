import { SBPage } from "@pages/page";
import { Locator, Page } from "@playwright/test";
import type {
  ProductRefund,
  RefundInfo,
  RefundPbaseInfo,
  DataFilter,
  InfoProductDetail,
  InfoFulFill,
  FilterCustomArtInHive,
  SizeChartInfo,
  DataHoldPayOut,
  VariantBaseProd,
} from "@types";
import { cloneObject } from "@utils/object";

/**
 * @deprecated: Separate each page into POM in folder src/pages/hive/(printbase|shopbase)
 */
export class HivePBase extends SBPage {
  account: Locator;
  password: Locator;
  login: Locator;
  xpathSuccessMessage = "//div[contains(@class, 'alert alert-success')]";
  xpathInfoShipping = "//label[normalize-space()='Shipping address']//ancestor::div[contains(@class,'information')]";
  xpathTrackingNumber = "(//div[@class='clearfix']//div[@class='pull-left']//div[@class='form-group'])[1]";
  xpathTrackingUrl = "((//div[@class='clearfix']//div[@class='pull-left'])[2]//div[@class='form-group'])[1]//a";
  xpathColumnTableOrder =
    "//table[contains(@class,'table table-bordered table-striped') or contains(@class,'table table-bordered  table-striped')]//tbody//tr";
  xpathtableOderdetail = "(//div[normalize-space()='Order details']//parent::div)[2]/following-sibling::div//table";
  xpathActionFilter = "//a[@class='dropdown-toggle sonata-ba-action']";
  xpathListFilters = "//li[@class='dropdown sonata-actions open']//ul[@class='dropdown-menu']";
  xpathResultSearch = "//div[@class='box-body']//div[@class='info-box']";
  xpathSelectAllCampaign = "(//div[@class='icheckbox_square-blue']//ins)[1]";
  xpathReturnListCampaign = "//a[@class='btn btn-success']";
  xpathMessageErrorReject = "//div[@class='alert alert-danger alert-dismissable']";
  xpathMockUpRender = "//input[@type='file' and contains(@id,'mockup')]/following-sibling::div//img";
  xpathArtworkRender = "//input[@type='file' and contains(@id,'artwork')]/following-sibling::a";
  xpathSizeChartDetail = "//section[@class='content']";
  xpathReasonHoldPayout = `//input[@name="reason"]`;
  xpathFilterOrderName = `//input[@id="filter_name_value"]`;
  xpathBtnOK = "//input[@value='OK' and @class = 'btn btn-small btn-primary']";
  xpathRefundedAlert = '//div[contains(@class,"alert-success") and contains(normalize-space(),"been refunded")]';
  xpathStatusLineItem = "//span[@class='label label-danger']";
  xpathPurchaseStatus = `//h6[contains(text(),"Purchase status")]`;
  successAlert = '//div[contains(@class,"alert-success") and contains(normalize-space(),"success")]';
  refunedAlert = '//div[contains(@class,"alert-success") and contains(normalize-space(),"been refunded")]';
  xpathOdooProductId = '//input[@placeholder="Odoo product id"]';

  xpathCanceledAlert(orderName: string): string {
    return `//div[contains(text(), 'Order "${orderName}" has been canceled')]`;
  }
  xpathBaseCostOfBaseProduct(variantName: string, option: string) {
    return `//tbody[@class='add_new_variant']//td[input[@value='${variantName}']]/following-sibling::td[input[@value='${option}']]/following-sibling::td[input[contains(@name,'variant_garment_cost')]]//input`;
  }
  xpathDropListSupplier = "//div[contains(@class,'supplier-selection')]";
  xpathSupplier = "//li[contains(@class,'select2-results-dept-0 select2-result select2-result-selectable')]";
  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
    this.account = this.genLoc('[placeholder="Username"]');
    this.password = this.genLoc('[placeholder="Password"]');
    this.login = this.page.locator("text=Log in");
  }

  xpathFrameInCustomArtDetail(label: string): string {
    return `//div[@class='well container-fluid form-actions' and descendant::label[normalize-space() = "${label}"]]`;
  }

  xpathIconRemoveFilter(index = 1): string {
    return `(//label[@class='control-label']//a[@class='sonata-toggle-filter sonata-ba-action']//i[@class='fa fa-minus-circle'])[${index}]`;
  }

  xpathSelectCampaign(campaignName: string): string {
    return `(//*[normalize-space()='${campaignName}'])[1]//parent::tr//div[@class='icheckbox_square-blue']//ins`;
  }

  /**
   * Generates an XPath for selecting an attribute in a drop-down list.
   * @param attributeValue The name of the attribute to select.
   * @returns The XPath for the specified attribute in the drop-down list.
   */
  getXpathDropListWithAttribute(attributeValue: string): string {
    return `//ul[@class="select2-results"]//li/div[normalize-space()="${attributeValue}"]`;
  }

  /**
   *login to hive pbase
   * @param username
   * @param password
   */
  async loginToHivePrintBase(username: string, password: string) {
    await this.goto("/admin/login");
    await this.waitUntilElementVisible("//input[@id = 'username']");
    await this.account.fill(username);
    await this.password.fill(password);
    await this.login.click();
  }

  /**
   * got to order detail in hive pbase
   * @param orderID : input order id
   *  @param orderENV: can input "phub-order" or "pbase-order"
   */
  async goToOrderDetail(orderID: number, orderENV = "pbase-order") {
    await this.goto(`/admin/${orderENV}/${orderID}/edit`);
    await this.page.waitForLoadState("load");
  }

  /**
   * function wait quantity mockup rendered, wait time of each session is 3s and max wait time is 60s
   * @param amountMockup
   * @param maxWaitTime
   * @returns
   */
  async waitArtworkRender(amountArtwork: number, maxWaitTime: number): Promise<void> {
    const xpathAllArtwork =
      "((//div[normalize-space()='Order details']//parent::div)[2]/following-sibling::div//td)[3]//div";
    const maxRetries = Math.ceil(maxWaitTime / 3000);
    let retries = 0;

    while (retries < maxRetries) {
      retries += 1;
      const allArtwork = await this.page.locator(xpathAllArtwork).count();
      if (amountArtwork === allArtwork) {
        return;
      }
      await this.page.waitForTimeout(3000);
      await this.page.reload();
    }

    throw new Error(`Timeout: waitArtworkRender took more than ${maxWaitTime}ms and ${retries} retries`);
  }

  /**
   *Fill info tracking of order
   * @param infoFulFill :info tracking number tracking,url tracking
   * */
  async inputInformationOfOrderFulfill(infoFulFill: InfoFulFill) {
    await this.page.locator("//div[@class='select2-container']").click();
    await this.page.waitForSelector(
      "//div[@class='select2-drop select2-display-none select2-drop-auto-width select2-drop-active']",
    );
    await this.page
      .locator(
        `//li[contains(@class,'select2-results-dept-0 select2-result select2-result-selectable')]//div[normalize-space()="${infoFulFill.quantity}"]`,
      )
      .click();
    await this.page.locator("//input[@name='trackingNumber']").fill(`${infoFulFill.tracking_number}`);
    await this.page.locator("//input[@name='trackingUrl']").fill(infoFulFill.tracking_url);
    if (infoFulFill.is_send_mail) {
      await this.page.locator("//div[@class='icheckbox_square-blue']").click();
    }
  }

  /**
   * get status order in hive pbase
   */
  async getOrderStatus(): Promise<string> {
    return this.getTextContent(
      "(//div[contains(@class,'box-information')]//div[@class='clearfix']//following-sibling::h6)[8]",
    );
  }

  /**
   * get artwork status of order in hive pbase
   * //index =1 get status : Uploaded artwork
   * //index =2 get status : artwork_rendered
   */
  async getArtworkStatus(index = 1): Promise<string> {
    return this.getTextContent(`(//table//td//span[contains(@class,'label-danger')])[${index}]`);
  }

  /**
   * get artwork status order in Order list
   */

  async getArtworkStatusInOrderList(orderName: string): Promise<string> {
    return this.getTextContent(`(//a[normalize-space()='${orderName}']//ancestor::tr//td)[13]`);
  }

  async reRenderArtwork(numberArtwork: number, maxRetries = 5) {
    const xpathAllArtwork =
      "((//div[normalize-space()='Order details']//parent::div)[2]/following-sibling::div//td)[3]//div";
    const artworkStatus = await this.getArtworkStatus(2);
    const countArtworkStatus = await this.page.locator("//span[normalize-space()='artwork_render_failed']").count();
    if (artworkStatus === "artwork_render_failed" || artworkStatus === "awaiting_artwork") {
      for (let i = 1; i <= countArtworkStatus; i++) {
        await this.clickOnTextLinkWithLabel("re-render artwork", i);
      }
      let retries = 0;

      while (retries < maxRetries) {
        retries += 1;
        const countArtwork = await this.page.locator(xpathAllArtwork).count();
        if (
          countArtwork === numberArtwork &&
          (await this.genLoc("//button[normalize-space()='Approve']").isVisible()) == true
        ) {
          break;
        } else {
          await this.page.waitForTimeout(3000);
          await this.page.reload();
        }
      }
    }
  }

  async processCompareAmountMockupRender(amountMockup: number): Promise<void> {
    const checkNotComplete = true;
    const xpathAllCheckBox =
      "((//div[normalize-space()='Order details']//parent::div)[2]/following-sibling::div//td)[2]//div";
    while (checkNotComplete) {
      const allCheckBox = await this.page.locator(xpathAllCheckBox).count();
      if (amountMockup !== allCheckBox) {
        await this.page.waitForTimeout(10000);
        await this.page.reload();
      } else {
        break;
      }
    }
  }

  /**
   * Click btn Calculate
   */
  async clickCalculate() {
    if (await this.genLoc("//label[normalize-space()='Calculated']").isHidden()) {
      await this.genLoc("//button[normalize-space()='Calculate']").click();
    }
  }

  /**
   * approve order in hive pbase
   */
  async approveOrder() {
    const btnApprove = this.page.locator("//button[normalize-space()='Approve']");
    const successMessage = "//div[@class='alert alert-success alert-dismissable' and contains(., 'success')]";
    await this.waitUntilElementVisible("//label[text()='Order information']");

    if (await btnApprove.isVisible()) {
      await btnApprove.click();
      await this.page.waitForSelector(successMessage);
    } else {
      await this.page.click("//button[normalize-space()='Calculate']");
      await this.page.waitForSelector(successMessage);
      await this.page.click("//button[normalize-space()='Approve']");
      await this.page.waitForSelector(successMessage);
    }
  }

  /**
   * Using approve order in hive until success
   * @param retries
   */
  async approveOrderUntilSuccess(retries = 5) {
    const xpathError =
      "//div[contains(normalize-space(), 'admin/internal/order/approve.json') and contains(@class, 'alert-danger alert-dismissable')]";
    const btnApprove = this.page.locator("//button[normalize-space()='Approve']");
    const successMessage = "//div[@class='alert alert-success alert-dismissable' and contains(., 'success')]";
    await this.waitUntilElementVisible("//label[text()='Order information']");

    for (let i = 0; i < retries; i++) {
      if (await btnApprove.isVisible()) {
        await btnApprove.click();
      } else {
        await this.page.click("//button[normalize-space()='Calculate']");
        await this.page.waitForSelector(successMessage);
        await btnApprove.click();
      }
      await this.page.waitForLoadState("networkidle");
      if (await this.page.locator(xpathError).isVisible()) {
        continue;
      }
      return;
    }
  }

  /**
   * approve order in hive pbase
   */
  async approveOrderInHive() {
    const btnApprove = this.page.locator("//button[normalize-space()='Approve']");
    await this.waitUntilElementVisible("//label[text()='Order information']");
    if (await btnApprove.isVisible()) {
      await btnApprove.click();
    }
  }

  /**
   * Go to Refund order page
   * Input quantity
   * Click btn Refund
   * @param orderId
   * @param productRefund
   */
  async refundMultiProductPbase(orderId: number, productRefund: ProductRefund[]) {
    await this.goto(`/admin/app/order-action/${orderId}/refund`);
    await this.page.waitForLoadState("networkidle");
    let index;
    for (const product of productRefund) {
      if (typeof product.quantity === "string") {
        index = parseInt(product.quantity) + 1;
      } else {
        index = product.quantity + 1;
      }

      await this.page
        .locator(
          `//td[contains(text(),'${product.name}')]/ancestor::tr` +
            `/td[//th[contains(text(),'Quantity')]//preceding-sibling::th]//a`,
        )
        .click();
      await this.genLoc(`(//div[@id='select2-drop-mask']//following-sibling::div)//ul/li[${index}]`).click();
    }

    const xpathRemainingRefundProcessingFee =
      "//div[child::label[normalize-space()='Refund processing fee']]//following-sibling::div";
    const xpathTextboxRefundProcessingFee = xpathRemainingRefundProcessingFee + "//input";
    const remainingRefundProcessingFee = parseFloat(
      (await this.page.textContent(xpathRemainingRefundProcessingFee)).trim().split("$")[1].split(" ")[0],
    );
    const inputRefundProcessingFee = parseFloat((await this.page.inputValue(xpathTextboxRefundProcessingFee)).trim());
    if (inputRefundProcessingFee > remainingRefundProcessingFee) {
      await this.page.locator(xpathTextboxRefundProcessingFee).fill(remainingRefundProcessingFee.toString());
    }

    const xpathRemainingRefundBaseCost =
      "//div[child::label[normalize-space()='Refund base cost']]//following-sibling::div";
    const xpathTextboxRefundBaseCost = xpathRemainingRefundBaseCost + "//input";
    const remainingRefundBaseCost = parseFloat(
      (await this.page.textContent(xpathRemainingRefundBaseCost)).trim().split("$")[1].split(" ")[0],
    );
    const inputRefundBaseCost = parseFloat((await this.page.inputValue(xpathTextboxRefundBaseCost)).trim());
    if (inputRefundBaseCost > remainingRefundBaseCost) {
      await this.page.locator(xpathTextboxRefundBaseCost).fill(remainingRefundBaseCost.toString());
    }

    await this.genLoc("//button[@class='btn btn-danger']").click();
    await this.page.waitForLoadState("load");
  }

  /**
   * Go to Refund order page
   * Input quantity
   * Click btn Refund
   * @param orderId
   * @param productRefund
   */
  async cancelMultiProductPbase(orderId: number, productRefund: ProductRefund[]) {
    await this.goto(`/admin/app/order-action/${orderId}/cancel`);
    await this.page.waitForLoadState("networkidle");
    let index;
    for (const product of productRefund) {
      const xpathDdlQuantity =
        `//td[contains(text(),'${product.name}')]/ancestor::tr` +
        `/td[//th[contains(text(),'Quantity')]//preceding-sibling::th]//a`;
      if (await this.page.locator(xpathDdlQuantity).isVisible()) {
        if (typeof product.quantity === "string") {
          index = parseInt(product.quantity) + 1;
        } else {
          index = product.quantity + 1;
        }

        await this.page
          .locator(
            `//td[contains(text(),'${product.name}')]/ancestor::tr` +
              `/td[//th[contains(text(),'Quantity')]//preceding-sibling::th]//a`,
          )
          .click();
        await this.genLoc(`(//div[@id='select2-drop-mask']//following-sibling::div)//ul/li[${index}]`).click();
      }
    }

    const xpathRemainingRefundProcessingFee =
      "//div[child::label[normalize-space()='Refund processing fee']]//following-sibling::div";
    const xpathTextboxRefundProcessingFee = xpathRemainingRefundProcessingFee + "//input";
    const remainingRefundProcessingFee = parseFloat(
      (await this.page.textContent(xpathRemainingRefundProcessingFee)).trim().split("$")[1].split(" ")[0],
    );
    const inputRefundProcessingFee = parseFloat((await this.page.inputValue(xpathTextboxRefundProcessingFee)).trim());
    if (inputRefundProcessingFee > remainingRefundProcessingFee) {
      await this.page.locator(xpathTextboxRefundProcessingFee).fill(remainingRefundProcessingFee.toString());
    }

    const xpathRemainingRefundBaseCost =
      "//div[child::label[normalize-space()='Refund base cost']]//following-sibling::div";
    const xpathTextboxRefundBaseCost = xpathRemainingRefundBaseCost + "//input";
    const remainingRefundBaseCost = parseFloat(
      (await this.page.textContent(xpathRemainingRefundBaseCost)).trim().split("$")[1].split(" ")[0],
    );
    const inputRefundBaseCost = parseFloat((await this.page.inputValue(xpathTextboxRefundBaseCost)).trim());
    if (inputRefundBaseCost > remainingRefundBaseCost) {
      await this.page.locator(xpathTextboxRefundBaseCost).fill(remainingRefundBaseCost.toString());
    }

    await this.genLoc("//button[@class='btn btn-danger']").click();
    await this.page.waitForLoadState("load");
  }

  /**
   *  open refund detail page
   * @param orderId
   */
  async goToRefundPage(orderId: number) {
    await this.goto(`/admin/app/order-action/${orderId}/refund`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   *  open Cancel detail page
   * @param orderId
   */
  async goToCancelPage(orderId: number) {
    await this.goto(`/admin/app/order-action/${orderId}/cancel`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Go to cancel order and cancel order (pre: status order = approved)
   * @param orderId
   */
  async goToCancelPageAndCancelOrder(orderId: number, quantity?: number) {
    await this.goToCancelPage(orderId);
    await this.cancelOrder(quantity);
  }

  /**
   * Input quantity product to cancel order
   * @param quantity
   */
  async cancelOrder(quantity?: number) {
    if (quantity) {
      await this.genLoc("//tbody//tr//td//div[contains(@class,'select-quantity')]//b").click();
      await this.genLoc(`//div[@class='select2-result-label' and normalize-space()="${quantity}"]`).click();
    }
    await this.page.locator("//button[@class='btn btn-danger']").click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * get number mockup in order detail
   */
  async getNumberOfMockup() {
    return this.page.locator("(//img[contains(@class,'mockup-img')])[1]").count();
  }

  /**
   * Go to section customer support
   * Go to order details by order name
   * Click button Cancel order
   */
  async cancelOrderPbase(orderName: string) {
    await this.page.locator("//span[text()='Customer Support']").click();
    await this.page.locator("//a[contains(., 'PBase Order')]").click();
    await this.page.locator(`//a[normalize-space()='${orderName}']`).click();
    await this.page.locator("//a[text()='Cancel']").click();
    await this.waitUntilElementVisible("//b[text()='cancel']");
    await this.page.locator("//button[text()='cancel']").click();
    await this.waitUntilElementVisible(`//div[contains(text(), 'Order "${orderName}" has been canceled')]`);
  }

  /**
   * cancel order printbase with reason
   * @param refundInfo: RefundPbaseInfo cancel
   * @param orderId: order id
   * @param messageId
   * @param productRefund: ProductRefund
   */
  async cancelOrderPbaseWithReason(refundInfo: RefundPbaseInfo, orderId: number, productRefund: ProductRefund[]) {
    await this.clickOnTextLinkWithLabel("Cancel");
    await this.page.waitForLoadState("networkidle");
    await this.waitUntilElementVisible("//b[text()='cancel']");
    await this.inputInformationOfOrderToRefundPbase(refundInfo, orderId, productRefund, "cancel");
  }

  /**
   * Go to section customer support
   * Go to order details by order name
   * Input refund info and refund order
   */
  async refundOrderPbase(refundInfo: RefundInfo, orderName: string) {
    await this.page.locator("//span[text()='Customer Support']").click();
    await this.page.locator("//a[contains(., 'PBase Order')]").click();
    await this.page.locator(`//a[normalize-space()='${orderName}']`).click();
    await this.page.locator("//a[text()='Refund']").click();
    await this.waitUntilElementVisible("//b[text()='refund']");
    await this.inputInformationOfOrderToRefund(refundInfo);
    await this.clickBtnRefund();
  }

  /**
   * refund order printbase with reason
   * @param refundInfo: RefundPbaseInfo
   * @param orderId
   * @param productRefund: ProductRefund
   */
  async refundOrderPbaseWithReason(refundInfo: RefundPbaseInfo, orderId: number, productRefund: ProductRefund[]) {
    await this.page.locator("//a[text()='Refund']").click();
    await this.waitUntilElementVisible("//b[text()='refund']");
    await this.inputInformationOfOrderToRefundPbase(refundInfo, orderId, productRefund);
  }

  async clickBtnRefund() {
    await this.page.locator("//button[text()='refund']").click();
  }

  async inputInformationOfOrderToRefund(refundInfo: RefundInfo) {
    if (refundInfo.selling_price) {
      await this.page
        .locator("//div[child::label[text()='Refund selling price']]//following-sibling::div//input")
        .fill(refundInfo.selling_price);
    }
    if (refundInfo.payment_fee) {
      await this.page
        .locator("//div[child::label[text()='Recover payment fee']]//following-sibling::div//input")
        .fill(refundInfo.payment_fee);
    }
    if (refundInfo.shipping_fee) {
      await this.page
        .locator("//div[child::label[text()='Refund shipping fee']]//following-sibling::div//input")
        .fill(refundInfo.shipping_fee);
    }
    if (refundInfo.tip_amount) {
      await this.page
        .locator("//div[child::label[text()='Refund tipping']]//following-sibling::div//input")
        .fill(refundInfo.tip_amount);
    }
    if (refundInfo.tax_amount) {
      await this.page
        .locator("//div[child::label[text()='Refund taxes']]//following-sibling::div//input")
        .fill(refundInfo.tax_amount);
    } else if (refundInfo.send_noti) {
      await this.page.locator("//div[child::label[contains(text(), 'Send notification to')]]//input").check();
    }
  }

  /**
   * Function input values of fields order want to refund on tool hive
   * @param refundInfo All of file refund of buyer and seller
   * @param orderId order id
   * @param productRefund info line item product in order want to refund include: name: string, quantity, type
   */
  async inputInformationOfOrderToRefundPbase(
    refundInfo: RefundPbaseInfo,
    orderId: number,
    productRefund: ProductRefund[],
    type = "refund",
  ) {
    await this.goto(`/admin/app/order-action/${orderId}/${type}`);
    await this.page.waitForLoadState("networkidle");
    let index;
    for (const product of productRefund) {
      if (typeof product.quantity === "string") {
        index = parseInt(product.quantity) + 1;
      } else {
        index = product.quantity + 1;
      }

      await this.page
        .locator(
          `//td[contains(text(),'${product.name}')]/ancestor::tr` +
            `/td[//th[contains(text(),'Quantity')]//preceding-sibling::th]//a`,
        )
        .click();
      await this.genLoc(`(//div[@id='select2-drop-mask']//following-sibling::div)//ul/li[${index}]`).click();
    }
    await this.page.waitForTimeout(1500);

    if (refundInfo.seller && !refundInfo.buyer) {
      await this.page.click("//label[normalize-space()='Request to refund for buyer']//preceding-sibling::div");
    } else if (!refundInfo.seller && refundInfo.buyer) {
      await this.page.click("//label[normalize-space()='Request to refund for seller']//preceding-sibling::div");
    }

    if (refundInfo.seller) {
      if (refundInfo.seller.refund_base_cost) {
        await this.page
          .locator("//div[child::label[text()='Refund base cost']]//following-sibling::div//input")
          .fill(refundInfo.seller.refund_base_cost);
      }
      if (refundInfo.seller.refund_processing_fee) {
        await this.page
          .locator("//div[child::label[text()='Refund processing fee']]//following-sibling::div//input")
          .fill(refundInfo.seller.refund_processing_fee);
      }
      if (refundInfo.seller.refund_payment_fee) {
        await this.page
          .locator("//div[child::label[text()='Refund payment fee']]//following-sibling::div//input")
          .fill(refundInfo.seller.refund_payment_fee);
      }
      if (refundInfo.seller.refund_design_fee) {
        await this.page
          .locator("//div[child::label[text()='Refund design fee']]//following-sibling::div//input")
          .fill(refundInfo.seller.refund_design_fee);
      }
    }

    if (refundInfo.buyer) {
      if (refundInfo.buyer.refund_selling_price) {
        await this.page
          .locator("//div[child::label[text()='Refund selling price']]//following-sibling::div//input")
          .fill(refundInfo.buyer.refund_selling_price);
        await this.page.waitForTimeout(1000);
      }
      if (refundInfo.buyer.refund_tipping) {
        await this.page
          .locator("//div[child::label[text()='Refund tipping']]//following-sibling::div//input")
          .fill(refundInfo.buyer.refund_tipping);
        await this.page.waitForTimeout(1000);
      }
      if (refundInfo.buyer.refund_shipping_fee) {
        await this.page
          .locator("(//div[child::label[text()='Refund shipping fee']]//following-sibling::div//input)[2]")
          .fill(refundInfo.buyer.refund_shipping_fee);
        await this.page.waitForTimeout(1000);
      }
      if (refundInfo.buyer.recover_payment_fee) {
        await this.page
          .locator("//div[child::label[text()='Recover payment fee']]//following-sibling::div//input")
          .fill(refundInfo.buyer.recover_payment_fee);
        await this.page.waitForTimeout(1000);
      }
      if (refundInfo.buyer.refund_taxes) {
        await this.page
          .locator("(//div[child::label[text()='Refund taxes']]//following-sibling::div//input)[2]")
          .fill(refundInfo.buyer.refund_taxes);
        await this.page.waitForTimeout(1000);
      }
    }
    //Choose refund reason
    if (refundInfo.reason) {
      await this.genLoc("//div[@id='s2id_cancel-reason']//b").click();
      await this.genLoc("//input[@id='s2id_autogen2_search']").fill(refundInfo.reason);
      await this.genLoc(`//span[contains(text(),"${refundInfo.reason}")]`).click();
    }

    //Choose message id
    if (refundInfo.message_id) {
      await this.page.locator(`//select[@name='message_id']`).selectOption({ label: refundInfo.message_id });
    }

    //Click send email cancel to buyer
    if (refundInfo.is_send_email) {
      await this.page
        .locator(`//input[@id='is_send_notification_buyer']/following-sibling::ins`)
        .scrollIntoViewIfNeeded();
      await this.page.locator(`//input[@id='is_send_notification_buyer']/following-sibling::ins`).click();
    }

    //Click button Refund
    await this.genLoc("//button[@class='btn btn-danger']").click();
    await this.page.waitForLoadState("load");
    await this.page.waitForTimeout(1000);
  }

  /**
   * Login to Hive PrintBase
   * @param username
   * @param password
   */
  async loginToHivePBase({ account = "", password = "" }: { account?: string; password?: string }) {
    await this.goto("/admin/login");
    await this.account.fill(account);
    await this.password.fill(password);
    await this.login.click();
  }

  /**
   * Nagative to page base product pbase
   */
  async goToListBaseProductPage() {
    await this.goto("/admin/pbase-product/list");
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Search base product by name
   * @params product_name
   */
  async searchProductByName(name: string) {
    const filter = "//a[@class='dropdown-toggle sonata-ba-action']";
    const optionFilter = `//li[child::a[normalize-space()='Title']]`;
    const btnFilter = "(//button[@placeholder='Filter' or normalize-space()='Filter'])[1]";
    const xpathValue = `//div[contains(@class,'form-group')][child::label[normalize-space()='Title']]//div[@class='col-sm-4']`;

    await this.genLoc(filter).click();
    await this.genLoc(optionFilter).click();
    await this.genLoc(filter).click();
    await this.page.waitForSelector(xpathValue);
    await this.genLoc(`${xpathValue}/input`).fill(name);
    await this.genLoc(btnFilter).click();
  }

  /**
   * Go to detail base product by id
   * @params productName String
   */
  async goToDetailBaseProduct(productName: string) {
    const exactlyProductName = `//a[normalize-space()='${productName}']`;

    await Promise.all([this.genLoc(exactlyProductName).click(), this.page.waitForLoadState()]);
  }

  /**
   * Actions update property of base product
   * @param property
   * @param field
   * @param value
   */

  async updatePropertyBaseProduct(property: string, field: string, value: string) {
    const tab = `//ul[@class='nav nav-tabs']//li//a[normalize-space()='${property}']`;
    const xpathFieldInput = `//table[@class='table table-bordered']//tbody//tr[1]//td//input[contains(@name, '${field}')]`;
    await this.genLoc(tab).click();
    await this.page.waitForLoadState("load");
    await this.waitUntilElementVisible(xpathFieldInput);
    await this.genLoc(`${xpathFieldInput}`).fill(value);
  }

  /**
   * get orderName in Order detail
   */
  async getOrderName(): Promise<string> {
    const orderName = this.page
      .locator(`//label[normalize-space()='Order']//ancestor::div[contains(@class,'information')]//h6[1]`)
      .textContent();
    return orderName;
  }

  /**
   * get shipping address in order information
   */
  async getShippingAdress(): Promise<string> {
    return this.getTextContent(
      "//label[normalize-space()='Shipping address']//ancestor::div[contains(@class,'information')]",
    );
  }

  /**
   * get locator order confirm email
   * @params firstName customer
   * @params lastName customer
   * @params email customer
   */

  getLocatorOrderConfirmEmail(firstName: string, lastName: string, email: string): Locator {
    return this.genLoc(
      `//td[normalize-space()='Order confirmation email was sent to ${firstName} ${lastName} (${email})']`,
    );
  }

  /**
   * get locator order timeline
   * @params firstName customer
   * @params lastName customer
   */
  getLocatorOrderTimeLine(firstName: string, lastName: string): Locator {
    return this.genLoc(`//td[contains(text(),'${firstName} ${lastName} placed this order on Online Store')]`);
  }

  /**
   * get locator product in order detail
   * @params quantity product
   * @params product name
   */
  getLocatorProduct(quantity: number, product: string): Locator {
    return this.page.locator(`//td[text()='${quantity}']//preceding-sibling::td//a[contains(text(),'${product}')]`);
  }

  /**
   * Search base order by name
   * @params dataFilters
   */
  async filterDataByName(dataFilters: Array<DataFilter>) {
    const xpathFieldChecked = "(//i[@class='fa fa-check-square-o'])";
    const filter = "//a[@class='dropdown-toggle sonata-ba-action']";
    await this.genLoc(filter).click();
    await this.genLoc(
      "//div[contains(@class,'form-group')][child::label[normalize-space()='Is Approving']]//i[@class='fa fa-minus-circle']",
    ).click();
    const fieldFilter = await this.genLoc(xpathFieldChecked).count();
    for (let i = 0; i < fieldFilter; i++) {
      await this.genLoc(`${xpathFieldChecked}[${fieldFilter - i}]`).click();
    }
    for (let i = 0; i < dataFilters.length; i++) {
      const title = dataFilters[i].name;
      const value = dataFilters[i].value;
      const optionFilter = `//li[child::a[normalize-space()='${title}']]`;
      const xpathValue = `//div[contains(@class,'form-group')][child::label[normalize-space()='${title}']]//div[@class='col-sm-4']`;
      await this.genLoc(optionFilter).click();
      await this.page.waitForSelector(xpathValue);
      await this.genLoc(`${xpathValue}/input`).fill(value);
    }
    await this.genLoc(filter).click();
    await this.clickOnBtnWithLabel("Filter");
  }

  /**
   * get info status purchase
   */
  async getPurchaseStatusInOrderDetail() {
    const purchaseStatus = await this.getTextContent(
      "(//div[contains(@class,'box-information')]//div[@class='clearfix']//following-sibling::h6)[7]",
    );
    const textStatus = purchaseStatus.trim().split(":");
    return textStatus[textStatus.length - 1].trim();
  }

  /**
   * Get Attribute any
   *@param xpath
   */
  async getAttributeLink(attribute: string, xpath: string): Promise<string> {
    return await this.page.getAttribute(xpath, attribute);
  }

  /**
   * get info any in table order
   */
  getXpathInColumnTableOrder(col: number, row = 1, xpath = "") {
    return `((${this.xpathColumnTableOrder})[${row}]//td)[${col}]${xpath}`;
  }

  /**
   * get info store in order detail
   */
  async getInfoStore(): Promise<string> {
    const storeName = await this.getTextContent(
      "//label[normalize-space()='Store']//ancestor::div[contains(@class,'information')]//h6[1]",
    );
    return storeName.trim();
  }

  /**
   * get info Sku  ,Name product,  Quantity,Purchase Status,Fulfillment Status
   * @param infoProduct
   * */
  async getInfoProductInOrderList(index = 1): Promise<{
    orderValue: string;
    personalized: string;
    paymentStatus: string;
    purchaseStatus: string;
    fulfillmentStatus: string;
  }> {
    const orderValue = await this.getDataByColumnLabel("Order Value", index, "1", "");
    const personalized = await this.getDataByColumnLabel("Personalized", index, "1", "");
    const paymentStatus = await this.getDataByColumnLabel("Payment Status", index, "1", "");
    const purchaseStatus = await this.getDataByColumnLabel("Purchase Status", index, "1", "");
    const fulfillmentStatus = await this.getDataByColumnLabel("Fulfillment Status", index, "1", "");

    const infoProductOrder = {
      orderValue: orderValue,
      personalized: personalized,
      paymentStatus: paymentStatus,
      purchaseStatus: purchaseStatus,
      fulfillmentStatus: fulfillmentStatus,
    };
    return infoProductOrder;
  }

  /**
   * Approve campaign custom art
   * @param campaignID
   */
  async approveCampaignCustomArt(campaignID: number) {
    await this.goto(`/admin/app/pbasecampaign/${campaignID}/show`);
    await this.clickOnBtnWithLabel("Design approve", 1);
    await this.clickOnBtnWithLabel("Approve", 1);
  }

  /**
   * get info Sku  ,Name product,  Quantity,Purchase Status,Fulfillment Status
   * @param infoProduct
   * */
  async getInfoProductInManualFulfill(InfosOrder: Array<InfoProductDetail>): Promise<Array<InfoProductDetail>> {
    const ordersFulfill = [];
    for (let i = 0; i < InfosOrder.length; i++) {
      const infoOrderDetail = cloneObject(InfosOrder[i]) as InfoProductDetail;
      if (infoOrderDetail.name_product) {
        infoOrderDetail.name_product = await this.getDataByColumnLabel("Line item Name", i + 1, "1", "");
      }
      if (infoOrderDetail.sku) {
        infoOrderDetail.sku = await this.getDataByColumnLabel("Line item Sku", i + 1, "1", "");
      }
      if (infoOrderDetail.fulfillment_status) {
        infoOrderDetail.fulfillment_status = await this.getDataByColumnLabel("Fulfillment Status", i + 1, "1", "");
      }
      if (infoOrderDetail.purchase_status) {
        infoOrderDetail.purchase_status = await this.getDataByColumnLabel("Purchase Status", i + 1, "1", "");
      }
      ordersFulfill.push(infoOrderDetail);
    }
    return ordersFulfill;
  }

  /**
   * get info MockUp, Artwork, Status  Fulfilled ,  Quantity Fulfillment Status  ,Personalize, Artwork Status
   * @param infoProduct
   * */
  async getInfoProductInOrderDetail(infoProduct: Array<InfoProductDetail>): Promise<Array<InfoProductDetail>> {
    const infoOrdersDetail = [];
    for (let i = 0; i < infoProduct.length; i++) {
      const infoOrderDetail = cloneObject(infoProduct[i]) as InfoProductDetail;
      if (infoOrderDetail.name_product) {
        infoOrderDetail.name_product = await this.getDataByColumnLabel("Line item", i + 1, "1", "//p[2]");
      }
      if (infoOrderDetail.num_artwork) {
        infoOrderDetail.num_artwork = await this.page
          .locator(this.getXpathInColumnTableOrder(3, i + 1, "//img"))
          .count();
      }
      if (infoOrderDetail.num_mockup) {
        infoOrderDetail.num_mockup = await this.page
          .locator(this.getXpathInColumnTableOrder(2, i + 1, "//img"))
          .count();
      }
      if (infoOrderDetail.sku) {
        infoOrderDetail.sku = await this.getDataByColumnLabel("Line item", i + 1, "1", "//p[3]");
      }
      if (infoOrderDetail.quantity) {
        infoOrderDetail.quantity = Number(await this.getDataByColumnLabel("Quantity", i + 1, "1", ""));
      }
      if (infoOrderDetail.cost) {
        infoOrderDetail.cost = await this.getDataByColumnLabel("Cost", i + 1, "1", "");
      }
      if (infoOrderDetail.fulfillment_status) {
        infoOrderDetail.fulfillment_status = (
          await this.getDataByColumnLabel("Fulfillment Status", i + 1, "1", "")
        ).toLocaleLowerCase();
      }
      if (infoOrderDetail.personalize) {
        infoOrderDetail.personalize = await this.getDataByColumnLabel("Personalize", i + 1, "1", "");
      }
      if (infoOrderDetail.artwork_status) {
        infoOrderDetail.artwork_status = await this.getDataByColumnLabel("Artwork Status", i + 1, "1", "");
      }
      if (infoOrderDetail.purchase_status) {
        infoOrderDetail.purchase_status = await this.getPurchaseStatusInOrderDetail();
      }
      infoOrdersDetail.push(infoOrderDetail);
    }
    return infoOrdersDetail;
  }

  /**
   * Click btn Calculate in pbase
   */
  async clickCalculateInOrder() {
    if (await this.genLoc("//button[normalize-space()='Calculate']").isVisible()) {
      await this.clickOnBtnWithLabel("Calculate");
      await this.page.waitForSelector("//button[normalize-space()='Calculate']", { state: "hidden" });
    }
  }

  /**
   * Filter campaign review custom art
   * @param filterCampaignCustomArt
   * @param campaignId
   */
  async filterCampaignCustomArt(filterCampaignCustomArt: FilterCustomArtInHive, campaignId?: number) {
    await this.page.click(this.xpathActionFilter);
    await this.page.click(`//*[normalize-space()='${filterCampaignCustomArt.type}']//i`);
    if (filterCampaignCustomArt.type === "Campaign name") {
      await await this.page.fill("//input[@id='filter_campaignTitle_value']", filterCampaignCustomArt.value);
    } else if (filterCampaignCustomArt.type === "Shop domain") {
      await this.page.fill("//input[@id='filter_shop__domain_value']", filterCampaignCustomArt.value);
    } else if (filterCampaignCustomArt.type === "Campaign ID") {
      await this.page.fill("//input[@id='filter_campaignId_value']", String(campaignId));
    } else if (filterCampaignCustomArt.type === "User email") {
      await this.page.fill("//input[@id='filter_shop__ownerEmail_value']", filterCampaignCustomArt.value);
    } else if (filterCampaignCustomArt.type === "Status") {
      await this.page.click("//div[@id='s2id_filter_opsStatus_value']");
      await this.page.click(`//li[@role='presentation']//*[normalize-space()='${filterCampaignCustomArt.value}']`);
    }
  }

  /**
   * Action with campaign custom art in list campaign in hive
   * @param action
   */
  async actionWithCampaignCustomArt(action: string) {
    await this.page.click("//div[@class='select2-container']//a[@class='select2-choice']");
    await this.page.click(`//li[@role='presentation']//*[contains(text(),'${action}')]`);
    await this.page.click("//select[@name='action']//following-sibling::input[@value='OK']");
  }

  async designRejectCampaignCustomArt(action: string, value: string) {
    await this.actionWithCampaignCustomArt(action);
    await this.page.fill("//div[@class='form-group']//textarea", value);
    await this.clickOnBtnWithLabel("Yes, execute");
  }

  /**
   * Create size chart PrintBase in Hive
   * @param sizeChartPB
   */
  async createSizeChartPB(sizeChartPB: SizeChartInfo) {
    if (sizeChartPB.title) {
      await this.page.fill(
        "(//div[@class='sonata-ba-field sonata-ba-field-standard-natural']//input[@type='text'])[1]",
        sizeChartPB.title,
      );
    }
    if (sizeChartPB.version) {
      await this.page.click(
        "//label[normalize-space()='Format Version']//following-sibling::div[@class='sonata-ba-field sonata-ba-field-standard-natural']",
      );
      await this.page.click(`(//*[normalize-space()='${sizeChartPB.version}'])[3]`);
    }
    if (sizeChartPB.description_inc) {
      await this.page.fill(
        "//label[normalize-space()='Description Inc']//parent::div//textarea",
        sizeChartPB.description_inc,
      );
    }
    await this.clickOnBtnWithLabel("Create");
    await this.page.waitForTimeout(2000);
  }

  /**
   * Created hold payout data into a pop-up on hive-pbase.
   * @param {DataHoldPayOut} dataHoldPayOut - An object containing hold payout data.
   */
  async createHoldFromPayout(dataHoldPayOut: DataHoldPayOut): Promise<void> {
    //Input hold amount
    const holdAmountOptionLocator = `(//*[contains(text(),"${dataHoldPayOut.hold_amount.option}")])[1]`;

    await this.page.locator(holdAmountOptionLocator).click();
    await this.genLoc(`//input[@name='vho_${dataHoldPayOut.hold_amount.code}']`).fill(
      `${dataHoldPayOut.hold_amount.amount}`,
    );

    // Input reason
    await this.genLoc(this.xpathReasonHoldPayout).fill(dataHoldPayOut.reason);

    // Available date
    const availableDateOptionLocator = `(//*[contains(text(),"${dataHoldPayOut.available_date.option}")])[1]`;
    await this.page.locator(availableDateOptionLocator).click();
    switch (dataHoldPayOut.available_date.option) {
      case `None`:
        break;
      case `Auto release on this date`:
        await this.page.fill("[type=date]", `${dataHoldPayOut.available_date.date}`);
        break;
      case `days after order’s tracking number is active`:
        await this.genLoc(`//input[@name='available_time_tracking']`).fill(`${dataHoldPayOut.available_date.day}`);
        break;
      case `days after order is delivered without claim or dispute`:
        await this.genLoc(`//input[@name='available_time_delivery']`).fill(`${dataHoldPayOut.available_date.day}`);
        break;
    }

    // Confirm hold payout
    await this.genLoc("//button[@type='submit' and @class='btn btn-success']").click();
    const successMessage = "//div[@class='alert alert-success alert-dismissable' and contains(., 'success')]";
    await this.page.waitForSelector(successMessage);
  }

  /**
   * Get data hold from payout in order detail hive-pbase
   * @returns {Promise<DataHoldPayOut>} - Data hold payout object
   */
  async getDataHoldFromPayout(): Promise<DataHoldPayOut> {
    const dataHoldPayout: DataHoldPayOut = {
      hold_amount: {
        amount: 0, // Default value
      },
      reason: "",
      available_date: {
        start_date: "",
        end_date: "",
      },
    };

    try {
      dataHoldPayout.hold_amount.amount = Number(
        await this.getTextContent(`//div[normalize-space()='Hold amount (USD)']//following-sibling::div`),
      );
      dataHoldPayout.reason = await this.getTextContent(`//div[normalize-space()='Reason']//following-sibling::div`);
      dataHoldPayout.available_date.start_date = await this.getTextContent(
        `//div[normalize-space()='Start date']//following-sibling::div`,
      );
      dataHoldPayout.available_date.end_date = await this.getTextContent(
        `//div[normalize-space()='End date']//following-sibling::div`,
      );
    } catch (error) {
      // Handle any potential errors here
      return Promise.reject("Error getting data hold from payout");
    }

    return dataHoldPayout;
  }

  /**
   * Go to base product detail
   * @param baseProductId is base product id on hive PB
   * @param tabId is param tab id in url
   */
  async goToBaseProductDetail(baseProductId: number, tabId: string): Promise<void> {
    await this.page.goto(`https://${this.domain}/admin/app/pobproductbase/${baseProductId}/edit?_tab=${tabId}`);
  }

  /**
   * Select supplier in base product detail on hive PBase
   * @param supplierName is supplier name you want select
   */
  async selectSupplier(supplierName: string): Promise<void> {
    await this.page.locator(`//div[contains(@class,'supplier-selection')]`).click();
    await this.page.locator(`//div[contains(@class,'result-label') and contains(text(),'${supplierName}')]`).click();
    await this.page.waitForLoadState("load");
  }

  /**
   * Get base cost variant by supplier of base product on hive PB
   * @param supplierName is supplier name of variant
   * @param variantsName is variant name and option variant
   * @returns data base cost by supplier
   */
  async getBaseCostVariantBySupplier(
    supplierName: Array<string>,
    variantsName: Array<VariantBaseProd>,
  ): Promise<Map<string, Array<Record<string, unknown>>>> {
    const dataBaseCost = new Map<string, Array<Record<string, unknown>>>();

    for (const variantName of variantsName) {
      const data = [];

      for (const supplier of supplierName) {
        await this.selectSupplier(supplier);
        const baseCost = await this.getValueContent(
          this.xpathBaseCostOfBaseProduct(variantName.variant_name, variantName.option),
        );

        data.push({ supplier: supplier, baseCost: baseCost });
      }
      dataBaseCost.set(`${variantName.variant_name} ${variantName.option}`, data);
    }

    return dataBaseCost;
  }

  /**
   * Fetches the base cost for a specific product variant and supplier.
   * @param suppliersName - Array of supplier names.
   * @param variantsName - Array of variant names and options.
   * @param tabId - The ID of the tab.
   * @param baseProductId - The ID of the base product.
   * @param variant - The specific variant for which to fetch the base cost.
   * @param supplierName - The specific supplier for which to fetch the base cost.
   * @returns The base cost as a number.
   */
  async getBaseCostWithVariantAndSup(
    suppliersName: Array<string>,
    variantsName: Array<VariantBaseProd>,
    tabId: string,
    baseProductId: number,
    variant: string,
    supplierName: string,
    odooProductId: string,
  ): Promise<number> {
    await this.goToBaseProductDetail(baseProductId, tabId);
    await this.page.locator(this.xpathOdooProductId).fill(odooProductId);
    await this.page.keyboard.press("Enter");
    // Sau khi nhập odoo product id cần chờ khoảng 1-2s để load đc data supplier
    await this.waitAbit(2000);

    const baseCost = await this.getBaseCostVariantBySupplier(suppliersName, variantsName);
    const dataVariant = baseCost.get(variant);
    const baseCostProd = dataVariant.find(sup => sup.supplier === supplierName).baseCost;
    return Number(baseCostProd);
  }
}
