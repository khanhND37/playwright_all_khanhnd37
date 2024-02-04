import { DashboardPage } from "@pages/dashboard/dashboard";
import type { SettingSection } from "@types";
import { Locator, Page } from "@playwright/test";

export class SettingPage extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  xpathPage404 = "//div[@class='page-404 text-center']";
  xpathBtnCreateCoupon = "//div[contains(@class,'discount-action-bar')]//span[normalize-space()='Create coupon']";
  xpathCouponPercentage = "//div[contains(@class,'s-select')]//option[@value='percentage']";
  xpathCouponFixedAmount = "//div[contains(@class,'s-select')]//option[@value='fixed_amount']";
  xpathMemberSince = "//p[normalize-space()='Member since']//following-sibling::p//span";
  xpathCurrentPlan = "//p[normalize-space()='Current plan']//following-sibling::p";
  xpathNextSubscriptionBill = "//p[normalize-space()='The next subscription bill']//following-sibling::span";
  xpathBtnUpgradePlan = "//button//span[normalize-space()='Upgrade plan']";
  xpathFreemiumPackage = "//div[normalize-space()='Premium Creator']//ancestor::div[@class='package-wrapper']";
  xpathTitlePricingPage = "//div[@class='pricing-page']//h2";
  xpathBtnConfirmChanges = "//button//span[normalize-space()='Confirm changes']";
  xpathToastMsg = "//div[contains(@class,'toast')]//div";
  xpathPackageDescription = "//div[contains(@class,'shadow-container')]//p//strong";

  getLocatorPackage(packageName: string): Locator {
    return this.genLoc(`//div[normalize-space()='${packageName}']//ancestor::div[@class='package-wrapper']`);
  }

  getLocatorPackagePlan(packageName: string): Locator {
    return this.genLoc(`//div[normalize-space()='${packageName}']//parent::div//following-sibling::div//button`);
  }

  async openSectionSetting(section: string) {
    await this.page.click(`//a[contains(@class,'settings-nav__item')]//p[normalize-space()='${section}']`);
  }

  /**
   * Get list settings preference của website
   */
  async getSettingsPreference(): Promise<string[]> {
    await this.page.isHidden("//div[contains(@class,'s-detail-loading__body-container--rtl')]");
    const settings = [];
    const countSettings = await this.page.locator("//section//div[@class = 'col-xs-12 col-md-4']//h1").count();
    for (let i = 0; i < countSettings; i++) {
      const setting = await this.getTextContent(`(//section//div[@class = 'col-xs-12 col-md-4']//h1)[${i + 1}]`);
      settings.push(setting.trim());
    }
    return settings;
  }

  /**
   *  Get thông tin của các section trong Settings Page: name, url, description
   */
  async getSectionInfoOnSecttingPage(): Promise<SettingSection[]> {
    await this.waitUntilElementVisible("//div[@class='settings-nav__action']//p[normalize-space()='General']");
    const sections = [];
    const count = await this.page.locator("//section//a[contains(@class,'settings-nav__item')]").count();
    for (let i = 0; i < count; i++) {
      const name = await this.getTextContent(
        `(//a[contains(@class,'settings-nav__item')]//p[@class='settings-nav__title'])[${i + 1}]`,
      );
      const description = await this.getTextContent(
        `(//a[contains(@class,'settings-nav__item')]//p[contains(@class,'description')])[${i + 1}]`,
      );
      const url = await this.genLoc(`(//div//a[contains(@class,'settings-nav__item')])[${i + 1}]`).getAttribute("href");

      const section = {
        name: name,
        description: description,
        url: url,
      };
      sections.push(section);
    }
    return sections;
  }
}
