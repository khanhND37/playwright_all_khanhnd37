import { DashboardPage } from "@pages/dashboard/dashboard";
import { Locator } from "@playwright/test";
export class SettingsAccountPage extends DashboardPage {
  xpathBtnUpgradePlan = "//button//span[normalize-space()='Upgrade plan']";
  xpathStartPlan = "//div[contains(@class,'sticky-top')]//span[normalize-space()='Start plan']";
  xpathBtnConfirmChanges = "//div[contains(@class,'sticky-top')]//span[normalize-space()='Start plan']";
  xpathToastMessage = "//div[@class='s-notices is-bottom'][normalize-space()='Confirm plan successfully']";
  xpathBill = "//table[contains(@class,'billing-table')]//tbody//tr";

  getLocatorPackge(packageName: string): Locator {
    return this.genLoc(`//div[@class='pricing isComingSoon']//div[normalize-space()='${packageName}']`);
  }

  getLocatorCurrentPlan(packageName: string): Locator {
    return this.genLoc(
      `//div[normalize-space()='${packageName}']//parent::div//following-sibling::div//span[normalize-space()='Current plan']`,
    );
  }

  async editCustomerEmail(email: string) {
    await this.page.fill(
      "//label[normalize-space()='Customer Email']//parent::div//following-sibling::div//input",
      email,
    );
    await this.page.click("//button//span[normalize-space()='Save changes']");
  }
}
