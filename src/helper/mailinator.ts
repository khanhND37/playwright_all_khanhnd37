import { ImportCampStatusInMail } from "@core/utils/mail";
import { Page, Locator } from "@playwright/test";

export class Mailinator {
  page: Page;
  mailsPath = '//tr[contains(@id,"row_")]/td';
  subjectFirstPath: Locator;
  allSubjects: Locator;
  allMail: Locator;
  lineFinal: Locator;
  iframe = "//iframe[@id='html_msg_body']";
  image: Locator;
  domain = "https://www.mailinator.com/";

  constructor(page: Page) {
    this.page = page;
    this.subjectFirstPath = this.page.locator(`(${this.mailsPath}[3])[1]`);
    this.allSubjects = this.page.locator(`${this.mailsPath}[3]`);
    this.allMail = this.page.locator("//div[@id='inbox_pane']");
    this.lineFinal = this.page.frameLocator(this.iframe).locator("(//tbody/tr[2]/th/div)[last()-2]");
    this.image = this.page.frameLocator(this.iframe).locator("//th/a/img");
  }

  xpathTitleEmail = "(//div[@class='sans-serif'])[1]//b";
  xpathContentEmail = "//tbody/tr[2]/th/div[@class='sans-serif']//div[2]";
  xpathBtnCreateStaffAccount = "//a[contains(text(),'Create staff')]";
  xpathFirstEmail = '(//tr[@ng-repeat="email in emails"])[1]';
  xpathFirstSubject = '(//tr[contains(@id,"row_")]/td[3])[1]';

  // dmca
  xpathFileCSVRemove = "//body/ul[1]";

  // Mailinator giới hạn chỉ hiển thị khoảng 30 ký tự cho sender
  getXpathMailWithSubjectFrom(sender: string, subject: string) {
    return `(//td[contains(text(),"${sender}")]/following-sibling::td[contains(text(),"${subject}")])[1]`;
  }

  /**
   * I fill mail to check
   * @param mail name of mail to check
   */
  async seachMail(mail: string) {
    await this.page.fill("//input[@id='search']", mail);
    await this.page.waitForTimeout(2000);
  }

  /**
   * I access mail to check
   */
  async clickGo() {
    await this.page.click("//button[text()='GO']");
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * I get first mail subject
   * @returns text of first mail subject
   */
  async getSubjectFirstMail(): Promise<string> {
    return await this.page.locator(`(${this.mailsPath}[3])[1]`).textContent();
  }

  /**
   * I read mail
   * @param subject subject of mail
   */
  async readMail(subject: string, sender = "") {
    await this.page.click(this.getXpathMailWithSubjectFrom(sender, subject));
    await this.page.waitForSelector('//iframe[@id="html_msg_body"]');
  }

  /**
   * check mail visible in list mail by subject
   * @param subject subject of mail
   */
  async checkMailVisible(subject: string, sender = ""): Promise<boolean> {
    return this.page.locator(this.getXpathMailWithSubjectFrom(sender, subject)).isVisible();
  }

  /**
   * I get mail content
   * @returns last line of mail content
   */
  async getContentMail(): Promise<string> {
    return await this.lineFinal.textContent();
  }

  /**
   * I access mail
   * @param mail name of mail to access
   */
  async accessMail(mail: string) {
    await this.page.goto(this.domain);
    await this.seachMail(mail);
    await this.clickGo();
    let haveMail: number;
    let i = 0;
    do {
      await this.page.waitForTimeout(6000);
      haveMail = await this.page.locator(this.xpathFirstEmail).count();
      if (haveMail == 0) {
        await this.page.locator('//input[@id="inbox_field"]').clear();
        await this.page.locator('//input[@id="inbox_field"]').pressSequentially(mail, { delay: 100 });
        await this.page.click('//button[normalize-space()="GO"]');
        await this.page.waitForTimeout(6000);
      }
      i++;
    } while (haveMail == 0 && i < 5);
  }

  /**
   * I back to inbox
   */
  async backToInbox() {
    await this.page.click("//a[normalize-space()='Back to Inbox']");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get content email by text contains
   */

  async getTextBelowEmail(text) {
    return await this.page
      .frameLocator("//iframe[@id='html_msg_body']")
      .locator(`//p[contains(text(), '${text}')]/following-sibling::table//td//p`)
      .innerText();
  }

  /**
   * Get value of each item in mail detail Import campaign
   */
  async getValueFromFrame(value: string) {
    return await this.page
      .frameLocator("//iframe[@id='html_msg_body']")
      .locator(`(//p[normalize-space()='${value}']//following-sibling::p)[1]`)
      .innerText();
  }

  /**
   * Get content of mail Import campaign
   */

  async getImportStatus(status: ImportCampStatusInMail) {
    const statusInfo: ImportCampStatusInMail = {};
    await this.page.waitForSelector("//iframe[@id='html_msg_body']");

    const statusInfoToFrameLocator = {
      success: "Successfully imported:",
      skip: "Skipped:",
      fail: "Failed:",
      image_status: "Image status:",
    };

    await Promise.all(
      Object.keys(status).map(async key => {
        statusInfo[key] = await this.getValueFromFrame(statusInfoToFrameLocator[key]);
      }),
    );

    return statusInfo;
  }

  /**
   * Get content of mail Import campaign with disable color/size
   */
  async getErrorContent() {
    return (
      await this.page
        .frameLocator("//iframe[@id='html_msg_body']")
        .locator("//td[contains(text(),'Errors')]")
        .innerText()
    ).replace(/(\r\n|\n|\r)/gm, "");
  }

  async reloadWithTimeout(timeout: number) {
    await this.page.waitForTimeout(timeout);
    await this.page.reload();
  }

  async deleteAllMail() {
    const numberOfMail = await this.page.locator("//label[@class = 'checkbox-label']").count();
    for (let i = 1; i < numberOfMail; i++) {
      await this.page.check(`(//label[@class = 'checkbox-label']/parent::div//input)[${i}]`);
    }
    await this.page.click("//button[@aria-label='Delete Button']");
  }

  /**
   * Download file CSV from the page then return the path of the file
   * @param xpath
   */
  async downloadFile(xpath: string): Promise<string> {
    await this.page.waitForSelector("//iframe[@id='html_msg_body']");
    await this.page.frameLocator("//iframe[@id='html_msg_body']").locator(xpath).click();
    const download = await this.page.waitForEvent("download");
    return download.path();
  }
}
