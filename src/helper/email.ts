import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

export class Email extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * I will login gmail account
   * @param accountGooglePage link to google login page
   * @param gmail gmail of accounr to login
   * @param pass pass of account to login
   * @param gmailPage link to gmail page
   */
  async logInGmail(accountGooglePage: string, gmail: string, pass: string, gmailPage: string) {
    // Access google account page
    await this.page.goto(accountGooglePage);
    // Fill gmail
    await this.page.locator(`//input[@type="email"]`).fill(gmail);
    await this.page.locator(`//div[@id="identifierNext"]//button`).click();
    // Fill password
    await this.page.locator(`//div[@id="password"]//input[@type="password"]`).fill(pass);
    await this.page.locator(`//div[@id="passwordNext"]//button`).click();
    // Direct to Gmail
    await this.page.locator(`(//a[@role="button"])[1]`).click();
    await this.page.goto(gmailPage);
  }

  /**
   * I will search mail and open the first result
   * @param searchKeyword the keyword to search
   */
  async searchAndOpenMail(searchKeyword: string): Promise<boolean> {
    // Search mail
    await this.page.locator(`//input[@name="q"]`).fill(searchKeyword);
    await this.page.locator(`(//button[@role="button"])[2]`).click();
    //Open mail
    if (await this.page.locator(`(//table[@role="grid"])[4]/tbody/tr[1]/td[5]`).isVisible({ timeout: 3 }))
      await this.page.locator(`(//table[@role="grid"])[4]/tbody/tr[1]/td[5]`).click();
    else return false;
  }

  /**
   * I will download file in a mail
   */
  async DownloadExportProductCSVFile(): Promise<string> {
    await this.page.waitForSelector(`(//a[text()="Download"])[1]`);
    await this.genLoc('(//a[text()="Download"])[1]').click();
    const download = await this.page.waitForEvent("download");
    return await download.path();
  }
}
