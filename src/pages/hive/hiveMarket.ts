import { SBPage } from "@pages/page";

/**
 * @deprecated: Separate each page into POM in folder src/pages/hive/(printbase|shopbase)
 */
export class HiveMarket extends SBPage {
  /**
   * I will click add new market
   */
  async addNewMarket() {
    await this.page.click("//a[text()[normalize-space()='Add new']]");
  }

  /**
   * I will choose region that be applied the market
   * @param regionCode code of region
   */
  async chooseRegion(regionCode: string) {
    await this.page.click("//div[contains(@id,'regionCode')]/a");
    await this.page.click(`//ul/li/div[text()[normalize-space()="${regionCode}"]]`);
  }

  /**
   * I will choose enable the market for some users
   */
  async chooseEnable() {
    await this.page.click("//div[contains(@id,'enable')]//span");
  }

  /**
   * I will choose approve the market for all user of region
   */
  async chooseApprove() {
    await this.page.click("//div[contains(@id,'approve')]//span");
  }

  /**
   * I will fill the id of user to be applied the market
   * @param userID id of user
   */
  async fillUserID(userID: string) {
    await this.page.fill("//textarea[contains(@id,'sandBoxUserIds')]", userID);
  }

  /**
   * I will open balance setting tab
   */
  async openTabBalanceSetting() {
    await this.page.click("//a[text()[normalize-space()='Balance Settings']]");
  }

  /**
   * I will open consitions tab
   */
  async openTabConditions() {
    await this.page.click("//a[text()[normalize-space()='Conditions']]");
  }

  /**
   * I will choose topup methods
   * @param method the method to payment
   */
  async chooseTopupMethods(method: string) {
    await this.page.click("//li[contains(@class,'select2-search-field')]");
    await this.page.click(`//div[@role="option" and contains(text(),"${method}")]`);
  }

  /**
   * I will choose default method to topup
   * @param method the method is used as default
   */
  async chooseDefaultMethod(method: string) {
    await this.page.click("//div[contains(@id,'balanceSettings-default_method')]/div/div/a");
    await this.page.click(`//div[@role="option" and contains(text(),"${method}")]`);
  }

  /**
   * I will fill number for negative threshold
   * @param negative a number to set as negative threshold
   */
  async fillNegativeThreshold(negative: string) {
    await this.page.fill("//input[contains(@id,'balanceSettings_default_negative_threshold')]", negative);
  }

  /**
   * I will fill number for alert threshold
   * @param alert a number to set as alert threshold
   */
  async fillAlertThreshold(alert: string) {
    await this.page.fill("//input[contains(@id,'balanceSettings_default_alert_threshold')]", alert);
  }

  /**
   * I will click create market button
   */
  async clickCreate() {
    await this.page.click("//button[@name='btn_create_and_edit']");
  }

  /**
   * I will click create market button and back to market list
   */
  async clickCreateAndReturnToList() {
    await this.page.click("//button[@name='btn_create_and_list']");
  }

  /**
   * I will click create market button and continue to create another market
   */
  async clickAndAddAnother() {
    await this.page.click("//button[@name='btn_create_and_create']");
  }

  /**
   * I will click update button
   */
  async clickUpdate() {
    await this.page.click("//button[@name='btn_update_and_edit']");
  }

  /**
   * I will click update button and close edit, back to market list
   */
  async clickUpdateAndClose() {
    await this.page.click("//button[@name='btn_update_and_list']");
  }

  /**
   * I will delete the market in edit page
   */
  async clickDeleteInEdit() {
    await this.page.click("//a[text()[normalize-space()='Delete']]");
  }

  /**
   * I will edit the market
   * @param regionName name of region that market applied
   */
  async clickEdit(regionName: string) {
    const editButton = `//td[text()[normalize-space()="${regionName}"]]//following-sibling::td/div/a[@title="Edit"]`;
    await this.page.click(editButton);
  }

  /**
   * I will delete the market in market list page
   * @param region code of region that the market will be deleted
   */
  async clickDelete(region: string) {
    const deleteButton = `//td[text()[normalize-space()="${region}"]]//following-sibling::td/div/a[@title="Delete"]`;
    await this.page.click(deleteButton);
  }

  /**
   * I confirm to delete the market
   */
  async confirmDelete() {
    await this.page.click("//button[text()[normalize-space()='Yes, delete']]");
  }
}
