import type { ApplyCombo } from "@types";
import { HivePage } from "./core";
import { Page } from "@playwright/test";
export class HiveBilling extends HivePage {
  xpathAlertSuccess = "//div[contains(@class, 'alert-success')]";
  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
  }
  /**
   * Change Coming soon checkbox status
   */
  async changeStatusPackageComingSoon() {
    await this.page.click("//span[normalize-space()='Is Coming Soon']//preceding-sibling::div");
    await this.page.click("//button[normalize-space()='Update']");
    await this.page.waitForSelector("//div[contains(@class,'alert alert-success')]");
  }

  async getStatusPackageIsComingSoon(): Promise<string> {
    return this.page.getAttribute("//span[normalize-space()='Is Coming Soon']//preceding-sibling::div", "class");
  }

  async goToApplyComboPage(shopId: number) {
    await this.page.goto(`https://${this.domain}/admin/app/shop/${shopId}/apply-combo`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Apply combo for store
   * @param shopId is shop is that user want to apply combo
   * @param applyCombo is object includes: combo_value, coupon_type, coupon_value, transaction_fee
   */
  async applyCombo(shopId: number, applyCombo: ApplyCombo) {
    await this.goToApplyComboPage(shopId);
    await this.page.locator("//input[@id='form_combo_value']").fill(applyCombo.combo_value.toString());
    await this.page.click("//div[@id='s2id_form_coupon_type']");
    await this.page.click(`//div[@id="select2-drop"]//div[text()[normalize-space()='${applyCombo.coupon_type}']]`);
    if (applyCombo.coupon_type === `Custom package`) {
      await this.page.locator("//input[@id='form_amount_charge']").fill(applyCombo.coupon_value.toString());
      await this.page.locator("//input[@id='form_transaction_fee']").fill(applyCombo.transaction_fee.toString());
    } else {
      await this.page.locator("//input[@id='form_coupon_value']").fill(applyCombo.coupon_value.toString());
    }
    await this.clickOnBtnWithLabel("Charge immidiately");
    await this.clickOnBtnWithLabel("Yes, Charge combo this shop");
    await this.page.waitForURL(`https://${this.domain}/admin/app/shop/${shopId}/show`);
  }
}
