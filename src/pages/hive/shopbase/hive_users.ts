import { Page } from "@playwright/test";
import { HivePage } from "../core";

export class HiveUsers extends HivePage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Go to page user event logs
   * @param userId: current go to event logs page to get otp_code
   */

  async goToUsersEventLogs(userId: number) {
    await this.page.waitForTimeout(3000);
    await this.page.goto(`https://${this.domain}/admin/app/shopuser/${userId}/show?typeEventLog=all&entityEventLog=4`);
    await this.page.waitForLoadState("load");
  }

  /**
   * @copyright: New flow get otp for user shopbase
   * khi user của shopbase thực hiện action liên quan đến otp thì otp code sẽ được hiển thị trong page event log
   * Mã otp được hiển thị ở cột content trong bảng event logs
   * Get otp code in page event logs
   * @param userId: current go to event logs page to get otp_code
   */

  async getCodeEventLogs(): Promise<string> {
    const otpPath = await this.page.locator("//table//tr[child::td[contains(text(), 'otp_verify')]][1]//td[2]");
    const otpValue = await otpPath.textContent();
    return otpValue;
  }
}
