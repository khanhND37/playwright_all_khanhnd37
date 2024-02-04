import { Page } from "@playwright/test";
import { DashboardPage } from "./dashboard";

export class General extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Go to dashboard General
   */
  async openGeneralDashboard() {
    await this.navigateToMenu("Settings");
    await this.navigateToSectionInSettingPage("General");
  }

  /**
   * Choose timezone in dashboard General
   * @param timeZone: Timezone value which is selected
   */
  async chooseTimezone(timeZone: string) {
    await this.page.selectOption("//p[normalize-space()='Timezone']//following-sibling::div//select", timeZone);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Action save change everything in dashboard General
   */
  async saveChanged() {
    const saveBar = "//div[@class='save-setting-fixed']";
    if (!(await this.page.getAttribute(saveBar, "style")).includes("none")) {
      await this.page.locator(`${saveBar}//span[normalize-space()='Save changes']`).click();
      await this.page.waitForLoadState("load");
    }
  }
}
