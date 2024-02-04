import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { LogBackInfo } from "@types";

export class LogBackPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  logBackStoreButtonLoc = this.page.locator(`//span[contains(text(),'Log back in my store')]`);
  alertBalanceInsufficientLoc = this.page.locator(
    `//p[normalize-space()="You don't have enough balance for this payment. Please topup to Shopbase Balance in order to keep going."]`,
  );
  topUpButtonLoc = this.page.locator(`//span/span[normalize-space()="Top-up"]`);
  cancelButtonLoc = this.page.locator(`//button/span[contains(text(),'Cancel')]`);

  /*
   * Go to Log back in page
   * Return true if log back successfully
   */
  async logBackStore(isAfterFreeTrial = false): Promise<LogBackInfo> {
    const result = {} as LogBackInfo;
    await this.logBackStoreButtonLoc.waitFor();
    await this.logBackStoreButtonLoc.click();
    await this.page.click(`//span/span[normalize-space()="Confirm"]`);

    if (isAfterFreeTrial) {
      const isBalanceInsufficient = await this.isElementVisibleWithTimeout(
        `//p[normalize-space()="You don't have enough balance for this payment. Please topup to Shopbase Balance in order to keep going."]`,
      );

      if (isBalanceInsufficient) {
        result.is_success = false;
        result.is_balance_insufficient = true;
        return result;
      }

      await this.page.waitForSelector(`//h4[normalize-space()="Welcome you go back with us."]`);
      await this.page.click(`//span/span[normalize-space()="Confirm"]`);
    }

    result.is_success = await this.isElementVisibleWithTimeout(`//p[text()="${this.domain}"]`, 30000);

    return result;
  }
}
