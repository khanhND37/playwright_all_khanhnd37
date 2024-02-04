import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

export class Topup extends SBPage {
  /**
   * I will choose wire transfer
   */
  async clickWireTransfer() {
    await this.page.click(`//img[@alt="wire_transfer"]`);
  }

  /**
   * I will click to show all payment methods
   */
  async clickPaymentMethods() {
    await this.page.click(
      `//p[normalize-space()='Select a preferred account to transfer funds']/following-sibling::div[1]`,
    );
  }

  /**
   * I go to top up page
   */
  async goToTopUpPage() {
    await this.page.goto(`https://${this.domain}/admin/topUp`);
  }
}

export class TopupPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  topupHeaderLoc = this.page.locator(`//h2[normalize-space()='Add funds']`);
  inputTopUpAmtBoxLoc = this.page.locator(`//input[@placeholder='Enter amount to top-up']`);
  confirmTopUpBtnLoc = this.page.locator(`//button[@type='submit']`);

  cancelTopUpBtnLoc = this.page.locator(`//button[normalize-space()='Cancel']`);
  msgTopUpSuccessLoc = this.page.locator(`//p[contains(text(),'Successfullly top-up total amount')]/span`);

  paymentMethodXPath = {
    credit_card: `//input[@value='credit_card']/following-sibling::span[@class='s-check']`,
    wire_transfer: `//input[@value='wire_transfer']/following-sibling::span[@class='s-check']`,
  };

  async goToTopUpPage() {
    await this.page.goto(`https://${this.domain}/admin/topUp`);
  }

  /**
   * Select top up payment method
   * @param method is payment method name (credit_card, wire_transfer)
   */
  async selectPaymentMethod(method: string) {
    await this.page.click(this.paymentMethodXPath[method]);
  }

  /**
   * Input top up amount
   * @param method is payment method name (credit_card, wire_transfer)
   * @param topupAmount is top up amount
   */
  async topupToStoreByMethod(method: string, topupAmount: number): Promise<string> {
    await this.selectPaymentMethod(method);
    await this.inputTopUpAmtBoxLoc.fill(topupAmount.toString());
    await this.confirmTopUpBtnLoc.click();
    await this.page.waitForSelector(`//p[contains(text(),'Successfullly top-up total amount')]/span`);
    const topupSuccessMsg = (await this.msgTopUpSuccessLoc.textContent()).trim();
    return topupSuccessMsg;
  }
}
