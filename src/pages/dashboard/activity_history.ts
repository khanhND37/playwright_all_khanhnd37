import { Page } from "@playwright/test";
import { SBPage } from "../page";

export class ActivityHistory extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * I go to activity history page
   */
  async goToActivityHistory() {
    await this.page.goto(`https://${this.domain}/admin/settings/account/activities`);
    await this.page.waitForSelector('//h1[text()="Activity history"]');
  }

  /**
   * I view detail of activity
   * @param activity name of activity
   */
  async clickViewDetail(activity: string) {
    await this.page.click(`(//tr/td[3]/div/span[normalize-space()="${activity}"])[1]`);
  }

  /**
   * I choose categoty to filter
   * @param category name of category
   */
  async chooseCategoty(category: string) {
    await this.page.click('//button/span[normalize-space()="Category"]');
    const check = await (
      await (
        await this.page
          .locator(`//label/span[normalize-space()="${category}"]//preceding-sibling::input`)
          .elementHandle()
      ).getProperty("checked")
    ).jsonValue();
    if (JSON.stringify(check) == "false") await this.page.click(`//label/span[normalize-space()="${category}"]`);
    await this.page.click('//h1[text()="Activity history"]');
    await this.page.waitForLoadState("load");
  }

  /**
   * I choose activity to filter
   * @param activity name of activity
   */
  async chooseActivity(activity: string) {
    await this.page.click('//button/span[normalize-space()="Activity"]');
    await this.page.click(`//label/span[normalize-space()="${activity}"]`);
    await this.page.click('//h1[text()="Activity history"]');
    await this.page.waitForLoadState("load");
  }

  /**
   * I filter the activity
   * @param category name of category
   * @param activity name of activity
   */
  async filterActivity(category: string, activity?: string) {
    if (category) {
      await this.chooseCategoty(category);
    }
    if (activity) {
      await this.chooseActivity(activity);
      await this.page.waitForSelector("(//span[@class='s-tag']//div/span/i)[2]");
    }
    await this.page.locator("//span[normalize-space()='DETAILS']").isHidden();
    await this.page.locator("//span[normalize-space()='DETAILS']").isVisible();
  }
}
