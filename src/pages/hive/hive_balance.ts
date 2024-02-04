import type { ChargeOrRefund, ChargeToZero, RequestPayoutInfo, DataHoldPayOut } from "@types";
import { HivePage } from "./core";
import { Page } from "@playwright/test";

export class HiveBalance extends HivePage {
  xpathAlertSuccess = "//div[contains(@class, 'alert-success')]";
  xpathReleaseOtherHold = `//button[contains(text(),'Release')]`;
  xpathSuccess = `//div[@class='alert alert-success alert-dismissable' and contains(., 'success')]`;
  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
  }

  /**
   * go to charge / refund page at Hive
   * @param domainHive is domain go to charge / refund page
   * @param shopId is shop is that user want to execute charge
   */
  async goToChargeRefundHivePage(domainHive: string, shopId: string) {
    await this.page.goto(`https://${domainHive}/admin/app/shop/${shopId}/charge-refund-fee`);
    await this.page.waitForLoadState("load");
  }

  /**
   * charge to value of Available balance = 0
   * @param domainHive is domain go to charge / refund page
   * @param shopId is shop is that user want to execute charge
   * @param chargeToZero is object includes: form_reason, form_note
   */
  async chargeAvailableBalanceToZero(domainHive: string, shopId: string, chargeToZero: ChargeToZero) {
    await this.goToChargeRefundHivePage(domainHive, shopId);
    const availableBalance = (
      await this.page
        .locator("//td[contains(text(), 'Current available balance')]//following-sibling::td")
        .textContent()
    )
      .replace(`$`, ``)
      .replace(`,`, ``);
    await this.page.click("//div[@id='s2id_form_invoice_type']/a");
    await this.page.click("//div[normalize-space()='Charge']");
    if (parseFloat(availableBalance) > 0) {
      await this.page.locator("//input[contains(@id, 'form_invoice_value')]").fill(`-${availableBalance}`);
      await this.page.locator("//input[contains(@id, 'form_reason')]").fill(chargeToZero.form_reason);
      await this.page.locator("//input[contains(@id, 'form_note')]").fill(chargeToZero.form_note);
      await this.clickOnBtnWithLabel("Charge / Refund");
      await this.page.waitForURL(`https://${domainHive}/admin/app/shop/${shopId}/show`);
      await this.page.waitForSelector(this.xpathAlertSuccess);
    }
  }

  /**
   * charge / refund for available balance with any value
   * @param domainHive is domain go to charge / refund page
   * @param shopId is shop is that user want to execute charge
   * @param chargeOrRefund is object includes: invoice_type, value, form_reason, form_note
   */
  async executeChargeOrRefundBalance(domainHive: string, shopId: string, chargeOrRefund: ChargeOrRefund) {
    await this.goToChargeRefundHivePage(domainHive, shopId);
    await this.page.click("//div[@id='s2id_form_invoice_type']/a");
    await this.page.click(`//div[normalize-space()='${chargeOrRefund.invoice_type}']`);
    if (chargeOrRefund.invoice_type === `Charge`) {
      await this.page.locator("//input[contains(@id, 'form_invoice_value')]").fill(`-${chargeOrRefund.value}`);
    } else {
      await this.page.locator("//input[contains(@id, 'form_invoice_value')]").fill(`${chargeOrRefund.value}`);
    }
    await this.page.locator("//input[contains(@id, 'form_reason')]").fill(chargeOrRefund.form_reason);
    await this.page.locator("//input[contains(@id, 'form_note')]").fill(chargeOrRefund.form_note);
    await this.clickOnBtnWithLabel("Charge / Refund");
    await this.page.waitForURL(`https://${domainHive}/admin/app/shop/${shopId}/show`);
    await this.page.waitForSelector(this.xpathAlertSuccess);
  }

  /**
   * Approve a Payout Review that user request at Balance page in dashboard store
   * @param hiveDomain is domain hive
   * @param payOutId is pay out id
   * @param amount that is amount user request in dashboard store
   */
  async approvePayoutReview(hiveDomain: string, payOutId: number, amount: string) {
    await this.page.goto(`https://${hiveDomain}/admin/app/balancepayoutrequestv2/${payOutId}/approve`);
    await this.page.waitForSelector(`//ul//li[contains(text(), 'ID: #` + payOutId + `')]`);
    await this.page.waitForSelector(`//ul//li[contains(text(), 'Amount: $` + amount + `')]`);
    await this.page.click("//button[contains(@class, 'btn-success')]");
    await this.page.waitForURL(`https://${hiveDomain}/admin/app/balancepayoutrequestv2/${payOutId}/show`);
    await this.page.waitForSelector(this.xpathAlertSuccess);
  }

  /**
   * Refuse a Payout Review that user request at Balance page in dashboard store
   * @param hiveDomain is domain hive
   * @param payOutId is pay out id
   * @param amount that is amount user request in dashboard store
   * @param reason input reason for action refuse request payout
   */
  async refusePayoutReview(hiveDomain: string, payOutId: number, amount: string, reason: string) {
    await this.page.goto(`https://${hiveDomain}/admin/app/balancepayoutrequestv2/${payOutId}/refuse`);
    await this.page.waitForSelector(`//ul//li[contains(text(), 'ID: #` + payOutId + `')]`);
    await this.page.waitForSelector(`//ul//li[contains(text(), 'Amount: $` + amount + `')]`);
    await this.page.locator(`//input[contains(@name, 'reason')]`).fill(reason);
    await this.page.click("//button[contains(@class, 'btn-danger')]");
    await this.page.waitForURL(`https://${hiveDomain}/admin/app/balancepayoutrequestv2/${payOutId}/show`);
    await this.page.waitForSelector(this.xpathAlertSuccess);
  }

  async filterRequestByEmailBeeketing(label: string, value: string, numberOptionFilter: number) {
    const filter = "//a[@class='dropdown-toggle sonata-ba-action']";
    const optionFilter = `//ul[@class="dropdown-menu"]//li[child::a[normalize-space()='${label}']]`;
    const btnFilter = "(//button[@placeholder='Filter' or normalize-space()='Apply'])[1]";
    const xpathValue = `//div[contains(@class,'form-group')][child::label[normalize-space()='${label}']]//div[@class='col-sm-4']`;
    await this.genLoc(filter).click();
    await this.genLoc("//ul[@class='dropdown-menu']//li[child::a[normalize-space()='Requests from customer']]").click();
    await this.genLoc(
      "//label[normalize-space()='Requests from customer']//parent::div//ins[@class='iCheck-helper']",
    ).click();

    for (let i = 0; i < numberOptionFilter; i++) {
      await this.genLoc(optionFilter).click();
      await this.genLoc(`${xpathValue}/input`).fill(value);
    }
    await this.genLoc(filter).click();
    await this.genLoc(btnFilter).click();
    await this.page.waitForLoadState();
  }

  getXpathRequestPayoutWithLabel(label: string): string {
    return `//th[text()='${label}']//following-sibling::td`;
  }

  async getInfoRequestPayoutInHive(): Promise<RequestPayoutInfo> {
    return {
      user: await this.page.innerText("//th[text()='User']//parent::tr//a"),
      destinationEmail: await this.page.innerText(this.getXpathRequestPayoutWithLabel("Destination email")),
      destinationMethod: await this.page.innerText(this.getXpathRequestPayoutWithLabel("Destination method")),
      requestedAmount: (await this.page.innerText(this.getXpathRequestPayoutWithLabel("Requested amount"))).replace(
        "$",
        "",
      ),
      status: await this.page.innerText(this.getXpathRequestPayoutWithLabel("Status")),
      refuseReason: await this.page.innerText(this.getXpathRequestPayoutWithLabel("Refuse Reason")),
    };
  }

  /**
   * go to Top up Review page of Wire Transfer
   */
  async goToTopUpReviewPage() {
    await this.goto("/admin/app/topuprequest/list");
    await this.page.waitForLoadState("load");
  }

  /**
   *
   * @returns id for the newest top up
   */
  async getTopUpIdNewest(): Promise<string> {
    return (await this.page.locator("//tbody//tr[1]//td[1]").textContent()).trim();
  }

  /**
   * check file upload from dashboard is display at hive of WireTransfers
   * @param isAttackedFile at dashboard page, when create manual top up with wire transfers is attack file or not
   */
  async verifyTopUpReviewIncludeFileAttack(isAttackedFile: boolean) {
    if (isAttackedFile) {
      await this.page.waitForSelector("//tbody//tr[1]//td[11]//div//a");
    } else {
      Promise.resolve();
    }
  }

  /**
   * click button to approve or refuse for manual top up with Wire Transfers
   * @param labelBtn
   */
  async clickBtnActionTopUpReview(labelBtn: "Approve" | "Refuse") {
    const text = await this.page.getAttribute(`(//a[contains(text(), '${labelBtn}')])[1]`, "href");
    await this.goto("/admin/app/topuprequest/" + text);
    await this.page.waitForLoadState("load");
    await this.page.waitForSelector(this.xpathAlertSuccess);
  }

  /**
   * Go to balance convert holding page by user id
   * @param userId is user id
   */
  async goToBalanceByUserId(userId: string, email: string, queryParam: string) {
    await this.goto(`/admin/app/balancev2/${userId}/${queryParam}`);
    await this.page.waitForSelector(`//*[contains(text(),'${email}')]`);
  }

  /**
   * convert holding amount
   * @param bucketName is bucket name
   */
  async convertHoldingAmount(bucketName: string, userId: string, email: string) {
    await this.goToBalanceByUserId(userId, email, "convert-holding");
    await this.page.click(`//span[@id='select2-chosen-2']`);
    await this.page.click(`//li//div[normalize-space()='${bucketName}']`);
    await this.page.click(`//button[normalize-space()='Yes, Convert']`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get infor convert holding
   * @param label is infor convert holding: user id, user email
   * @returns infor convert holding
   */
  async getInforConvertHolding(label: string): Promise<string> {
    return await this.getTextContent(`//li[contains(text(),'${label}')]`);
  }

  /**
   * Clean shop in Hive
   * @param domainHive is domain go to shop list
   * @param shopId is shop is that user want to execute clean shop
   */
  async cleanShop(domainHive: string, shopId: string): Promise<void> {
    await this.page.goto(`https://${domainHive}/admin/app/shop/${shopId}/edit`);
    await this.page.waitForLoadState("load");
    await this.page.locator(`//label[normalize-space()='Status']//following-sibling::div//a`).click();
    await this.page
      .locator(`//label[normalize-space()='Status']//parent::div//following-sibling::ul[@role='listbox']//li[4]`)
      .click();
    await this.page.getByRole("button", { name: " Update and close" }).click();
  }

  /**
   * Holds a payout for a user based on the provided data.
   * @param dataHoldPayOut - The data containing information about the payout hold.
   * @returns Promise<void>
   */
  async holdFromPayoutByUser(dataHoldPayOut: DataHoldPayOut): Promise<void> {
    // Input hold amount
    await this.genLoc(`//input[@name='vho_absolute']`).fill(`${dataHoldPayOut.hold_amount.amount}`);

    // Input reason
    await this.genLoc(`//input[@name="reason"]`).fill(dataHoldPayOut.reason);

    // Available date
    const availableDateOptionLocator = `(//*[contains(text(),"${dataHoldPayOut.available_date.option}")])[1]`;
    await this.page.locator(availableDateOptionLocator).click();

    // Handle different available date options
    switch (dataHoldPayOut.available_date.option) {
      case `None`:
        // No additional action needed for 'None' option
        break;
      case `Auto release on this date`:
        // Fill in the specified date for 'Auto release on this date' option
        await this.page.fill("[type=date]", `${dataHoldPayOut.available_date.date}`);
        break;
    }

    // Confirm hold payout
    await this.genLoc(`//button[contains(text(),'Confirm')]`).click();

    // Wait for success message to appear
    await this.page.waitForSelector(this.xpathSuccess);
  }

  /**
   * Asynchronously releases all other holds by clicking the submit button
   * with the class 'btn btn-success' until there are no more such buttons.
   */
  async releaseAllOtherHolds() {
    const count = await this.page.locator(this.xpathReleaseOtherHold).count();
    for (let i = 0; i < count; i++) {
      await this.page.locator(`(${this.xpathReleaseOtherHold})[1]`).click();
      await this.page.waitForSelector(this.xpathSuccess);
    }
  }
}
