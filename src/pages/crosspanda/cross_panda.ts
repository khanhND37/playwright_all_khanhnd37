import { SBPage } from "@pages/page";
import { Locator, Page } from "@playwright/test";

/**
 * Class for Cross Panda dashboard page
 * Login using username and password
 */
export class CrossPanda extends SBPage {
  account: Locator;
  password: Locator;
  login: Locator;

  constructor(page: Page, crosspandaDomain: string) {
    super(page, crosspandaDomain);
    this.account = this.genLoc("//input[@placeholder='Email address']");
    this.password = this.genLoc("//input[@placeholder='Password']");
    this.login = this.page.locator("//button[child::span[normalize-space()='Sign in']]");
  }

  async loginToCrossPanda({ account = "", password = "" }: { account?: string; password?: string }) {
    await this.goto("/admin/login");
    await this.account.fill(account);
    await this.password.fill(password);
    await this.login.click();
  }
}
