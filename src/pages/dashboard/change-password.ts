/* eslint-disable playwright/no-wait-for-timeout */
import { WebBuilder } from "@pages/dashboard/web_builder";
import { XpathNavigationButtons } from "@constants/web_builder";
import { Page, expect } from "@playwright/test";
import { MailBox } from "@pages/thirdparty/mailbox";

export class ChangePassword extends WebBuilder {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  //Web builder
  xpathEmptyResult = `//div[contains(@class, 'w-builder__insert-previews--search-empty-content')]`;
  xpathInsertPanel = `button[name="Insert"]`;
  xpathQuickBar = `//div[@id="quick-settings"]`;
  xpathDeleteBlockBtn = `//span[contains(text(), 'Delete block')]`;
  xpathDeleteSectionBtn = `//span[contains(text(), 'Delete section')]`;

  //Change password
  xpathChangePasswordBlock = `//section[@component="change-password"]`;
  xpathChangePasswordSection = `//section[@component="change-password"]//ancestor::*[contains(@class, 'section--container')]`;
  xpathCurrentPassword = `//input[@name="old-password"]`;
  xpathPassword = `//input[@name="password"]`;
  xpathConfirmPassword = `//input[@name="password-confirm"]`;
  xpathEyeIconCurrentPassword = `//input[@name="old-password"]//ancestor::div[contains(@class, 'input-base')]//following-sibling::span//a`;
  xpathEyeIconNewPassword = `//input[@name="password"]//ancestor::div[contains(@class, 'input-base')]//following-sibling::span//a`;
  xpathEyeIconCfPassword = `//input[@name="password-confirm"]//ancestor::div[contains(@class, 'input-base')]//following-sibling::span//a`;
  xpathUpdatePasswordBtn = `//button[normalize-space()="Update password"]`;

  //Sign up
  xpathSignUpBlock = `//section[@component="sign-up"]`;
  xpathSignUpSection = `//section[@component="sign-up"]//ancestor::*[contains(@class, 'section--container')]`;
  xpathEmail = `//input[@name="email"]`;
  xpathSignUpBtn = `//button[normalize-space()="Sign up"]`;
  xpathEmailActivation = `//*[contains(text(),'Customer account activation')]`;
  xpathActivateAccBtn = `//a[contains(text(),'Activate your account')]`;

  //Sign in
  xpathSignInBlock = `//section[@component="sign-in-with-pass"]`;
  xpathSignInSection = `//section[@component="sign-in-with-pass"]//ancestor::*[contains(@class, 'section--container')]`;
  xpathSignInBtn = `//button[normalize-space()="Sign in"]`;
  xpathMessage = `//span[@class="px-8 py-6 notification__message"]`;

  //My profile
  xpathMyProfileLabel = `//span[normalize-space()="My profile"]`;
  xpathMyAccount = `//section[@component="account"]//*[contains(@class, 'avatar')]`;

  async clickSaveBtn() {
    //wait to enable button save
    await this.page.waitForTimeout(3 * 1000);
    if (await this.page.locator(XpathNavigationButtons["save"]).isEnabled()) {
      await this.page.locator(XpathNavigationButtons["save"]).waitFor({ state: "visible" });
      await this.page.locator(XpathNavigationButtons["save"]).click();
      await this.page.waitForSelector("text='All changes are saved'");
      await this.page.waitForSelector(this.xpathSavedMessage, { state: "hidden" });
      await this.page.waitForTimeout(2 * 1000); //wait for save successfully
    }
  }

  async previewOnSF(): Promise<Page> {
    const [newTab] = await Promise.all([this.page.waitForEvent("popup"), this.page.click(this.xpathButtonPreview)]);
    await newTab.waitForLoadState("networkidle");
    return newTab;
  }

  async signUpAnAccount(domain: string, email: string, password: string, page: Page) {
    await page.goto(`https://${domain}/sign-up`);
    await page.waitForLoadState("networkidle");
    await page.locator(this.xpathEmail).fill(email);
    await page.locator(this.xpathPassword).fill(password);
    await page.locator(this.xpathConfirmPassword).fill(password);
    await page.locator(this.xpathSignUpBtn).click();
    await page.waitForLoadState("networkidle");
    const mailBox = new MailBox(page, this.domain);
    try {
      await mailBox.openMailDetailWithAPI(email, "Customer account activation");
    } catch (error) {
      await mailBox.openMailDetailWithAPI(email, "Customer account activation");
    }
    await mailBox.page.locator(this.xpathActivateAccBtn).click();
    await mailBox.page.waitForResponse(response => response.url().includes("en.json"));
    await expect(mailBox.page.locator(this.xpathMyProfileLabel)).toBeVisible();
    await mailBox.page.locator(this.xpathMyAccount).click();
    await mailBox.page.getByRole("button", { name: "Log out" }).click();
    await mailBox.page.waitForLoadState("networkidle");
  }

  async signIn(domain: string, email: string, password: string, page: Page) {
    await page.goto(`https://${domain}/sign-in`);
    await page.waitForLoadState("networkidle");
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator(this.xpathEmail).fill(email);
    await page.locator(this.xpathPassword).fill(password);
    await page.locator(this.xpathSignInBtn).click();
    await page.waitForLoadState("networkidle");
    expect(await page.locator(this.xpathMessage).innerText()).toContain("You are logged in!");
    await page.locator(this.xpathMessage).waitFor({ state: "hidden" });
  }

  async changePassword(currentPassword: string, newPassword: string, cfPassword: string, page: Page) {
    await page.locator(this.xpathCurrentPassword).fill(currentPassword);
    await page.locator(this.xpathPassword).fill(newPassword);
    await page.locator(this.xpathConfirmPassword).fill(cfPassword);
    await expect(page.locator(this.xpathUpdatePasswordBtn)).toBeEnabled();
    await page.locator(this.xpathUpdatePasswordBtn).click();
    await page.waitForLoadState("networkidle");
  }
}
