/* eslint-disable playwright/no-wait-for-timeout */
import { WebBuilder } from "@pages/dashboard/web_builder";
import { XpathNavigationButtons } from "@constants/web_builder";
import { expect, Page } from "@playwright/test";
import { OcgLogger } from "@core/logger";
import { MailBox } from "@pages/thirdparty/mailbox";

const logger = OcgLogger.get();

export class SignInSignUpWithPass extends WebBuilder {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  //Web builder
  xpathEmptyResult = `//div[contains(@class, 'w-builder__insert-previews--search-empty-content')]`;
  xpathInsertPanel = `button[name="Insert"]`;
  xpathQuickBar = `//div[@id="quick-settings"]`;
  xpathDeleteBlockBtn = `//span[contains(text(), 'Delete block')]`;
  xpathDeleteSectionBtn = `//span[contains(text(), 'Delete section')]`;

  //Sign up
  xpathSignUpBlock = `//section[@component="sign-up"]`;
  xpathSignUpSection = `//section[@component="sign-up"]//ancestor::*[contains(@class, 'section--container')]`;
  xpathEmail = `//input[@name="email"]`;
  xpathPassword = `//input[@name="password"]`;
  xpathConfirmPassword = `//input[@name="password-confirm"]`;
  xpathEyeIconPassword = `//input[@name="password"]//parent::span//following-sibling::span//a`;
  xpathEyeIconCfPassword = `//input[@name="password-confirm"]//parent::span//following-sibling::span//a`;
  xpathTermOfServicesLink = `//section[@component="sign-up"]//a[@href="/policies/terms-of-service"]`;
  xpathTermOfServicesTitle = `//h2[normalize-space()="Terms Of Service"]`;
  xpathPrivacyPolicyLink = `//section[@component="sign-up"]//a[@href="/policies/privacy-policy"]`;
  xpathPrivacyPolicyTitle = `//h2[normalize-space()="Privacy Policy"]`;
  xpathSignInLink = `//section[@component="sign-up"]//a[normalize-space()="Sign in"]`;
  xpathSignUpBtn = `//button[normalize-space()="Sign up"]`;
  xpathEmailActivation = `//*[contains(text(),'Customer account activation')]`;
  xpathActivateAccBtn = `//a[contains(text(),'Activate your account')]`;

  //Sign in
  xpathSignInBlock = `//section[@component="sign-in-with-pass"]`;
  xpathSignInSection = `//section[@component="sign-in-with-pass"]//ancestor::*[contains(@class, 'section--container')]`;
  xpathSignInBtn = `//button[normalize-space()="Sign in"]`;
  xpathSignUpLink = `//a[normalize-space()="Sign up"]`;
  xpathForgotPasswordLink = `//a[normalize-space()="Forgot your password?"]`;
  xpathBuyNowBtn = `//div[contains(@class, 'button--add-cart')]//span[normalize-space()='BUY NOW' or normalize-space()='Buy Now']`;

  //Checkout page
  xpathShippingInfo = `//div[contains(@class,"customer-information--wb")]`;
  xpathLoginLink = `//a[normalize-space()='Log in']`;
  xpathLoggedInCustomerInfo = `//*[contains(@class,"logged-in-customer")]`;
  firstnameLoc = this.genLoc("#checkout_shipping_address_first_name");
  lastnameLoc = this.genLoc("#checkout_shipping_address_last_name");
  addLoc = this.genLoc("#checkout_shipping_address_address_line1");
  cityLoc = this.genLoc("#checkout_shipping_address_city");
  countryLoc = this.genLoc("#checkout_shipping_address_country_name");
  cardNumberLoc = this.frameLocator.locator('[placeholder="Card number"]');
  cardholderNameLoc = this.frameLocator.locator('[placeholder="Cardholder name"]');
  expiredDateLoc = this.frameLocator.locator('[placeholder="MM/YY"]');
  cvvLoc = this.frameLocator.locator('[placeholder="CVV"]');
  xpathPlaceYourOrderBtn = `//span[contains(@class, 'place-order-button__label')]`;
  xpathcheckoutFooter = `//div[contains(@class, "checkout-footer")]`;
  xpathAgreeTermOfServiceCheckbox = `//div[contains(@class, 'term-of-service')]//span[contains(@class, 'check')]`;
  xpathSkeleton = `//div[@class = 'skeleton-image']`;

  //Thank you page
  xpathConfirmOrder = `//h2[normalize-space()='Your order is confirmed']`;

  //Reset password
  xpathBackToPrevious = `//a[normalize-space()="Back to previous"]`;
  xpathResetPasswordTitle = `//h3[normalize-space()="Reset password"]`;
  xpathSubmitBtn = `//section[@component="sign-in-with-pass"]//button[normalize-space()="Submit"]`;
  xpathResetPasswordForm = `//section[@component="sign-in-with-pass"]//ancestor::section[contains(@class, 'section--container')]`;
  xpathMessage = `//span[@class="px-8 py-6 notification__message"]`;
  xpathMessageEmailWasSent = `//p[contains(text(), 'We have sent you an email to reset password. Please check your inbox.')]`;
  xpathBackToLoginBtn = `//button[normalize-space()="Back to login"]`;

  //Email Reset password
  xpathMailBoxHeading = `//*[contains(text(), 'Public Messages')]`;
  xpathEmailResetPassword = `//*[contains(text(),'Customer account password reset')]`;
  xpathResetPasswordBtn = `//a[contains(text(),'Reset your password')]`;

  //Reset password from email
  xpathResetPasswordFromEmail = `//section[@component="reset-password"]//ancestor::section[contains(@class, 'section--container')]`;
  xpathNewPassword = `//input[@placeholder="Enter your password"]`;
  xpathCfNewPassword = `//input[@placeholder="Confirm your password"]`;
  xpathEyeIconNewPass = `${this.xpathNewPassword}//ancestor::div[@class="relative input-base"]//following-sibling::span//a`;
  xpathEyeIconCfNewPass = `${this.xpathCfNewPassword}//ancestor::div[@class="relative input-base"]//following-sibling::span//a`;
  xpathChangePasswordBtn = `//button[normalize-space()="Change password"]`;

  //My profile
  xpathMyProfileLabel = `//span[normalize-space()="My profile"]`;
  xpathMyAccount = `//section[@component="account"]//*[contains(@class, 'avatar')]`;

  async clickSaveBtn() {
    //wait to enable button save
    await this.page.waitForTimeout(3 * 1000);
    if (await this.genLoc(XpathNavigationButtons["save"]).isEnabled()) {
      await this.genLoc(XpathNavigationButtons["save"]).waitFor({ state: "visible" });
      await this.genLoc(XpathNavigationButtons["save"]).click();
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

  viewNewPageByLink = async (locator: string, page: Page): Promise<Page> => {
    const [newTab] = await Promise.all([page.waitForEvent("popup"), page.locator(locator).click()]);
    await newTab.waitForLoadState("networkidle");
    await newTab.goto(newTab.url());
    await newTab.waitForLoadState("networkidle");
    return newTab;
  };

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
    await mailBox.genLoc(this.xpathActivateAccBtn).click();
    await mailBox.page.waitForResponse(response => response.url().includes("en.json"));
    await expect(mailBox.genLoc(this.xpathMyProfileLabel)).toBeVisible();
    await mailBox.genLoc(this.xpathMyAccount).click();
    await mailBox.page.getByRole("button", { name: "Log out" }).click();
    await mailBox.page.waitForLoadState("networkidle");
  }

  async enterShippingAddress(fName: string, lName: string, add: string, country: string, city: string) {
    await this.page.getByRole("textbox", { name: "Country" }).click();
    await this.page.getByPlaceholder("Search").fill(country);
    await this.genLoc(`//span[normalize-space()='${country}']`).click();
    await this.page.waitForTimeout(2 * 1000);
    await this.firstnameLoc.fill(fName);
    await this.lastnameLoc.fill(lName);
    await this.addLoc.fill(add);
    try {
      await this.cityLoc.fill(city);
    } catch (e) {
      logger.info(`Run into catch error when fill City field`);
      logger.info(e);
      await this.cityLoc.last().fill(city);
    }
  }
}
