import { SBPage } from "@pages/page";
import { Locator, Page } from "@playwright/test";

export class ContactForm extends SBPage {
  emailLoc: Locator;
  pwdLoc: Locator;
  signInLoc: Locator;
  constructor(page: Page, domain: string) {
    super(page, domain);
    this.emailLoc = this.page.locator('//input[@id="email"]');
    this.pwdLoc = this.page.locator('//input[@id="password"]');
    this.signInLoc = this.page.locator('//button[normalize-space()="Sign in"]');
  }

  //Open listing detail page
  async gotoListingDetail() {
    await this.page.goto(`https://${this.domain}`);
  }

  /**
   * Login shopbase network
   * @param email
   * @param password
   */
  async loginShopBaseNetwork({ email = "", password = "" }: { email: string; password: string }) {
    await this.emailLoc.fill(email);
    await this.pwdLoc.fill(password);
    await Promise.all([this.page.waitForNavigation(), this.signInLoc.click()]);
    await this.page.waitForLoadState("load");
  }

  /**
   * Fill info into contact form
   * @param selectedStore
   * @param describeTheProblem
   */
  async fillInforContactForm(selectedStore: string, describeTheProblem: string) {
    await this.page
      .locator(`//div[contains(@class,'custom-multi-select')]//span[normalize-space()='All stores selected']`)
      .click();
    await this.page.locator(`//div[@class='checkBoxContainer']//span[normalize-space()='${selectedStore}']`).click();
    await this.page.frameLocator("[title='Rich Text Area']").locator("#tinymce").type(describeTheProblem);
    await this.page.locator(`//*[normalize-space()='Send messages']`).click();
  }
}
