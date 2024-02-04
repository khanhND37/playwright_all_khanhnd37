import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

/**
 * @deprecated: Separate each page into POM in folder src/pages/hive/(printbase|shopbase)
 */
export class HiveFeatureSwitch extends SBPage {
  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
  }
  /**
   * I will edit the feature switch
   * @param name name of feature
   */
  async editFeatureSwitch(name: string) {
    await this.page.click(`//a[text()[normalize-space()="Filters"]]`);
    await this.page.click(`//a[text()[normalize-space()="Name"]]`);
    await this.page.fill(`//input[@id="filter_name_value"]`, name);
    await this.page.click(`//a[text()[normalize-space()="Filters"]]`);
    await this.page.click(`//button[text()[normalize-space()="Filter"]]`);
    await this.page.click(`//a[text()[normalize-space()="${name}"]]`);
  }

  /**
   * I will check Approve or not
   * @param isApproved is the approved status of the feature (true or false)
   */
  async checkApproved(isApproved: boolean) {
    const status: boolean = await this.page.isChecked("input[type=checkbox]:nth-child(3)");
    if (status !== isApproved) await this.page.click(`//span[text()[normalize-space()="Approved"]]`);
  }

  /**
   * I will fill user Id to disable for the feature
   * @param userID id of user
   */
  async fillDisableUsers(userID: string) {
    await this.page.fill(`//input[contains(@id,"_disableUsers")]`, userID);
  }

  /**
   * I will click update the feature switch
   */
  async clickUpdate() {
    await this.page.click(`//button[@name="btn_update_and_edit"]`);
  }
}
