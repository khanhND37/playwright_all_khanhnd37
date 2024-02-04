import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";

export class ProfilePage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async goto() {
    await this.page.goto(`https://${this.domain}/admin/userprofile`);
    await this.page.waitForLoadState("load");
  }

  async changePassword(newPwd: string, currentPassword?: string) {
    await this.page.locator('button:has-text("Change password")').click();
    await this.page.locator("(//input[@id='password'])[1]").fill(newPwd);
    await this.page.locator("(//input[@type='password'])[2]").fill(newPwd);
    await this.page.locator('button:has-text("Save changes")').click();
    await this.page.waitForLoadState("load");
    // wait for OTP
    const popupPassword = "//div[contains(@class,'s-modal is-active')]//input[@placeholder='Password']";
    if (currentPassword) {
      await this.page.waitForSelector(popupPassword, { timeout: 5000 });
      await this.page.fill(popupPassword, currentPassword);
      await this.clickOnBtnWithLabel("Confirm");
    }
  }

  async logout() {
    await this.page.locator('button:has-text("Log out")').click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * @param field: field name need update
   * @param label: value of field name
   * */

  async changeInformationUser(field: string, label: string) {
    const selectField = `//label[text()='${field}']/following::div[1]//input[@placeholder='']`;
    await this.page.locator(selectField).fill(label);
    await this.page.click(`//label[text()='${field}']`);
  }

  async clickButtonSaveChanged() {
    const buttonSave = "//button[child::span//span[text()='Save changes']]";
    await this.page.waitForSelector(buttonSave, { timeout: 3000 });
    await this.page.locator(buttonSave).click();
  }

  /**
   * @param password: password current use
   * @param otp: otp code got from email/phone
   * */
  async actionWithPopupOtp(password: string, otp: string) {
    const modalSelector = "//div[contains(@class,'s-modal is-active')]";
    await this.page.waitForSelector(modalSelector);

    const inputOtpVerification = await this.page.locator(
      "//div[contains(@class,'s-modal is-active')]//input[@placeholder='Enter OTP number']",
    );

    if (password.length) {
      const inputPwdVerification = await this.page.locator(
        "//div[contains(@class,'s-modal is-active')]//input[@placeholder='Password']",
      );

      await inputPwdVerification.fill(password);
    }
    await inputOtpVerification.fill(otp, { timeout: 3000 });
    const btnSubmitOtp = await this.page.locator(
      "//div[contains(@class,'s-modal is-active')]//button[child::span[contains(text(), 'Send OTP')]]",
    );
    await btnSubmitOtp.click({ timeout: 1500 });
  }

  /**
   * Wait link change method is visible => click to change method get otp
   */

  async clickToChangeMethod() {
    const modalSelector = "//div[contains(@class,'s-modal is-active')]";
    await this.page.waitForSelector(modalSelector, { timeout: 60000 });
    await this.page.locator("//div//a[contains(text(), 'Choose')]").click();

    const labelOptionSentToEmail = "//label[normalize-space() = 'Get a code sent to your email address']";

    await this.page.waitForSelector(labelOptionSentToEmail);
    await this.page.locator(labelOptionSentToEmail).click();
    await this.page
      .locator("//div[contains(@class,'s-modal is-active')]//button[child::span[contains(text(), 'Send OTP')]]")
      .click();
  }

  /**
   * Check and update otp settings
   * @param settings: Array of settings string;
   */

  async checkAndUpdateOtpSettings(settings: Array<string>) {
    for (let i = 0; i < settings.length; i++) {
      const settingLoc = `//label[child::span[normalize-space()="${settings[i]}"]]`;
      await this.page.uncheck(settingLoc);
    }
  }

  async editAndUpdatePayout(account: string, email: string) {
    await this.page.goto(`https://${this.domain}/admin/balance`);

    const buttonEditPayout = `//div[child::div[text()='${account} account:']]//button[child::span[contains(text(),'Edit')]]`;
    await this.page.locator(buttonEditPayout).click();

    await this.page.locator("//div[child::div[text()='Paypal account:']]//div//input").fill(email);

    const buttonSavePayout = `//div[child::div[text()='${account} account:']]//button[child::span[contains(text(),'Save')]]`;
    await this.page.waitForSelector(buttonSavePayout, { timeout: 1000 });
    await this.page.locator(buttonSavePayout).click();
  }
}
