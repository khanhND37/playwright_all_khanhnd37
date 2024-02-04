import { Locator, Page } from "@playwright/test";
import { HiveSBaseOld } from "./hiveSBaseOld";

export class HivePlusHub extends HiveSBaseOld {
  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
  }

  /**
   * go to claim detail in hive sbase
   * @param claimID : input claim id
   */
  async goToClaimDetail(claimID: number) {
    await this.goto(`/admin/claims/${claimID}/edit`);
    await this.page.waitForLoadState("load");
  }

  // Get owner email
  async getOwnerEmail(): Promise<string> {
    return await this.getTextContent(`//label[normalize-space()='Owner Email']//following-sibling::div//span`);
  }

  // Get status claims
  async getClaimStatus(): Promise<string> {
    return await this.getTextContent(
      `((//label[normalize-space()='Status'])[1])//following-sibling::div//select//option[1]`,
    );
  }

  /**
   * Select option
   * @param label : Referred solution/ Status
   * @param option
   */
  async selectSolutionOrStatusClaim(label: string, option: string) {
    await this.page.locator(`//div[@class='form-group' and child::label[normalize-space()='${label}']]/div`).click();
    await this.page
      .locator(`(//div[contains(@class,'select2-drop-active')]//*[normalize-space()='${option}'])[1]`)
      .click();
  }

  /**
   * Input refund amount in claim detail trên Hive
   * @param amount refund
   */
  async inputRefundAmount(amount: string) {
    const xpathInput = "//input[contains(@class,'refund-amount')]";
    await this.page.locator(xpathInput).fill(amount);
  }

  getLocatorMessageUpdate(): Locator {
    return this.page.locator(`//div[@class='alert alert-success alert-dismissable']`);
  }
}
