import { SBPage } from "@pages/page";

/**
 * @deprecated: use src/shopbase_creator/storefront/ instead
 */
export class SignInDigital extends SBPage {
  /**
   * sign in to storefront digital
   * @param email
   * @param pass
   */
  async login(email: string, pass: string) {
    await this.page.goto(`https://${this.domain}/sign-in`);
    await this.page.waitForLoadState("networkidle");
    await this.genLoc("//input[@name='email']").fill(email);
    await this.genLoc("//input[@name='password']").fill(pass);
    await Promise.all([this.page.waitForNavigation(), this.genLoc("//button[normalize-space()='Sign in']").click()]);
    await this.page.waitForLoadState("load");
  }

  /**
   * go to sign in page
   */
  async gotoSignInPage() {
    await this.page.goto(`https://${this.domain}/sign-in`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Input data: email, password and click btn Sign in
   * @param email
   * @param pass
   */
  async inputAndClickSignIn(email: string, pass: string) {
    await this.genLoc("//div[child::label[normalize-space()='Email address']]//following-sibling::input").fill(email);
    await this.genLoc("//input[@name='password']").fill(pass);
    await this.genLoc("//button[normalize-space()='Sign in']").click();
  }

  /**
   * log out
   */
  async logOut() {
    await this.genLoc("//a[normalize-space()='My products']//following-sibling::div").click();
    await this.genLoc("//a[normalize-space()='Log out']").click();
  }
}
