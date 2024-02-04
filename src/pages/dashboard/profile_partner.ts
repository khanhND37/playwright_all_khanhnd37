import { SBPage } from "@pages/page";
import { Locator, Page } from "@playwright/test";
import type { ProfileData } from "@types";

export class ProfilePage extends SBPage {
  emailLoc: Locator;
  pwdLoc: Locator;
  signInLoc: Locator;
  profileName: string;

  constructor(page: Page, domain: string) {
    super(page, domain);
    this.emailLoc = this.page.locator('//input[@id="email"]');
    this.pwdLoc = this.page.locator('//input[@id="password"]');
    this.signInLoc = this.page.locator('//button[normalize-space()="Sign in"]');
    this.profileName = "";
  }

  /**
   * Go to select store page
   * @param email
   * @param password
   */
  async goToSignInPage({ email = "", password = "" }: { email: string; password: string }) {
    await this.page.goto(`https://${this.domain}/admin`);
    await this.emailLoc.fill(email);
    await this.pwdLoc.fill(password);
    await Promise.all([this.page.waitForNavigation(), this.signInLoc.click()]);
    await this.page.locator('//div[@class="s-dropdown-trigger"]').click();
    await this.page.locator('//div[@class="m-t"]//div[normalize-space()="Partner Dashboard"]').click();
  }

  //Go to profile detail page and choose profile page
  async goToProfileDetailPage(page: Page) {
    await page
      .locator(`//span[contains(@class,'unite-ui-dashboard') and normalize-space()='ShopBase Network']`)
      .click();
    await page.locator(`//span[contains(@class,'unite-ui-dashboard') and normalize-space()='Profile']`).click();
  }

  /**
   * Edit info profile
   * @param name
   * @param email
   * @param phone
   * @param socialProfile
   * @param country
   * @param language
   * @param description
   */
  async enterInputWithLabel(page: Page, label: string, value: string) {
    const xpath = `//div[child::label[contains(text(),'${label}')]]//input`;
    await page.locator(xpath).click();
    await page.locator(xpath).fill(value);
  }

  async editInfoProfile(page: Page, conf: ProfileData) {
    const currentTime = Math.floor(Date.now() / 1000);
    await this.enterInputWithLabel(page, "Name", `${conf.name} ${currentTime}`);
    await this.enterInputWithLabel(page, "Email", `${conf.email}+${currentTime}${conf.domain_email}`);
    await this.enterInputWithLabel(page, "Phone", conf.phone);
    await this.enterInputWithLabel(page, "Social profile (optional)", conf.social_profile);
    await page.locator(`//div[child::label[contains(text(),'Country')]]//button`).click();
    await page.locator(`//div[contains(@class,"sb-select-menu")]//li[normalize-space()="${conf.country}"]`).click();
    await page.locator(`//div[child::label[contains(text(),'Support language')]]//button`).click();
    await page
      .locator(
        `//div[contains(@class,"sb-selection-item")]//following-sibling::div[normalize-space()="${conf.language}"]`,
      )
      .click();

    await page.waitForSelector("[title='Rich Text Area']");
    await page
      .frameLocator("[title='Rich Text Area']")
      .locator("#tinymce")
      .fill(`${conf.description} + ${currentTime}`);
    await page.locator('(//button[normalize-space()="Save changes"])[1]').click();

    //Verify message create profile successfully
    await page.waitForSelector(
      `//div[contains(@class,'s-toast')]//div[normalize-space()='All changes were successfully saved']`,
    );
  }
}
