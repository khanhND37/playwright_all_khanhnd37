import { Page } from "@playwright/test";
import { HiveSBaseOld } from "./hiveSBaseOld";

/**
 * @deprecated: Separate each page into POM in folder src/pages/hive/(printbase|shopbase)
 */
export class HiveSalesChannel extends HiveSBaseOld {
  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
  }

  /**
   * I will check Enable follow status
   * @param isEnable status of Enable
   */
  async checkEnable(isEnable: boolean) {
    const status: boolean = await this.page.isChecked('//input[@type="checkbox" and contains(@id,"_enable")]');
    if (status !== isEnable) await this.page.click(`//span[text()[normalize-space()="Enable"]]`);
  }

  /**
   * I will check Approve follow status
   * @param isApprove status of Approve
   */
  async checkApprove(isApprove: boolean) {
    const status: boolean = await this.page.isChecked('//input[@type="checkbox" and contains(@id,"_approve")]');
    if (status !== isApprove) await this.page.click(`//span[text()[normalize-space()="Approve"]]`);
  }

  /**
   * I will clear all packages
   */
  async clearPackage() {
    let packageQuantity = await this.page.locator(`//div[contains(@id,"_packages")]/ul/li`).count();
    while (packageQuantity > 1) {
      await this.page.click(`//div[contains(@id,"_packages")]/ul/li/a[1]`);
      packageQuantity--;
    }
  }

  /**
   * I will select packages
   * @param packageNames name of the package
   */
  async selectPackage(packageNames: Array<string>) {
    for (let i = 0; i < packageNames.length; i++) {
      await this.page.click(`//input[contains(@id,"_autogen4")]`);
      await this.page.click(`//div[@id="select2-drop"]/ul/li/div[text()[normalize-space()="${packageNames[i]}"]]`);
    }
  }

  /**
   * I will edit the sales channel
   * @param name name of sales channel
   */
  async editSalesChannel(name: string) {
    await this.page.click(`//tbody/tr/td/a[text()[normalize-space()="${name}"]]`);
  }

  /**
   * I will save the edition
   */
  async saveSaleChannel() {
    await this.page.click(`//button[@name="btn_update_and_edit"]`);
  }

  /**
   * I will remove all user IDs
   */
  async clearUserID() {
    await this.page.click(`//input[contains(@id,"_sandbox_user_ids")]`, { clickCount: 3 });
    await this.page.keyboard.press("Backspace");
  }

  /**
   * I will fill the user ID to textbox
   * @param userID ID of user
   */
  async fillUserIDs(userID: Array<string>) {
    let datas = "";
    for (let i = 0; i < userID.length; i++) {
      datas += userID[i] + ",";
    }
    await this.page.fill(`//input[contains(@id,"_sandbox_user_ids")]`, datas);
  }
}
