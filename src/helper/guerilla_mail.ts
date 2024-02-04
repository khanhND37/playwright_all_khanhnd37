import { OcgLogger } from "@core/logger";
import { Page } from "@playwright/test";

export class Guerilla {
  page: Page;
  urlMail = "https://www.guerrillamail.com/inbox";
  mailInbox = '//*[@id="email_list"]/tr';
  mailRead = '//*[@id="email_list"]/tr[not(contains(@class,"email_unread"))]';
  createStaffAccLink = '//a[contains(text(),"Create staff account")]';
  completePurchaseLink = '//a[contains(text(),"Complete your purchase")]';
  logger = OcgLogger.get();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Access mail in Guerrilla with mail name
   * @param mail - name of email
   */
  async accessMail(mail: string) {
    await this.page.goto(this.urlMail);
    await this.page.waitForSelector('//*[@id="tabs-content"]');
    await this.page.click('//*[@id="inbox-id"]');
    await this.page.fill('//*[@id="inbox-id"]/input', mail);
    await this.page.waitForTimeout(1700);
    await this.page.click('//*[@id="inbox-id"]/button[text()="Set"]');
    await this.page.waitForTimeout(1500);
    await this.page.waitForSelector('//*[@id="tick" and normalize-space()="Done."]');
    await this.deleteAllOldMail();
    for (let i = 1; i < 7; i++) {
      await this.page.waitForSelector('//*[@id="tick" and normalize-space()="Done."]');
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Read mail in Guerrilla, until the mail match with 3 contents for extractly
   * @param content1 - first content in mail
   * @param content2 - seconds content in mail
   * @param content3 - third content in mail
   * @returns
   */
  async readMailWithContent(content1: string, content2: string, content3: string) {
    await this.closeAdv();
    const mailCount = await this.page.locator(this.mailInbox).count();
    let mailContent: string;
    if (mailCount == 0) {
      return this.logger.info("Don't have the mail that you need");
    } else {
      for (let i = 1; i < mailCount + 1; i++) {
        await this.closeAdv();
        await this.page.waitForTimeout(1000);
        await this.page.click(`(${this.mailInbox})[${i}]`);
        await this.page.waitForTimeout(1200);
        mailContent = await this.page.locator('//div[@class="email_body"]').innerText();
        if (mailContent.includes(content1) && mailContent.includes(content2) && mailContent.includes(content3)) {
          return;
        } else {
          await this.page.click('//*[@id="back_to_inbox_link"]');
        }
      }
      await this.deleteAllOldMail();
      await this.readMailWithContent(content1, content2, content3);
    }
  }

  /**
   * Close advertisement in website because we are using free
   */
  async closeAdv() {
    const frame = '//ins[@data-ad-status="filled" and @data-vignette-loaded="true"]//iframe';
    const frameElement = this.page.frameLocator(frame).locator('//iframe[@id="ad_iframe" and @title="Advertisement"]');
    while (await this.page.locator(frame).isVisible()) {
      await frameElement.locator('//div[@id="dismiss-button"]').click();
    }
  }

  /**
   * Delete all old mails which were read
   */
  async deleteAllOldMail() {
    const oldMail = await this.page.locator(this.mailRead).count();
    if (oldMail > 0) {
      for (let i = 1; i < oldMail + 1; i++) {
        await this.page.check(`(${this.mailRead}//input)[${i}]`);
      }
      await this.page.click('//*[@id="del_button"]');
      await this.page.waitForTimeout(1200);
    } else {
      this.logger.info("Don't have old mail");
    }
  }
}
