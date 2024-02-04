import { Page, Locator } from "@playwright/test";
import { SBPage } from "@pages/page";

export class Footer extends SBPage {
  static selectorFooter = '[component="pb-plb-footer"]';
  static socialItem = ".block-footer__social-item";
  static selectorSwitcherAction = ".currency-language_action";
  static selectorSwicherModal = ".locale-currency-dropdown";
  static selectorLocaleItem = ".locale-dropdown__item";
  static selectorCurrencyItem = ".currency-dropdown__item";
  static selectorGlobalSwitcher = "//div[contains(@class,'locale-currency-dropdown')]";
  static paymentIcons = "//div[contains(@class,'block-footer__payment-icons')]";
  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  /**
   * Get all heading on footer
   * @param footerLocator: if provided, use this locator as footer locator
   * @returns array of heading
   */
  async getAllHeadings(footerLocator?: Locator) {
    if (!footerLocator) {
      footerLocator = this.page.locator(Footer.selectorFooter);
    }
    const resp = [];
    for (let i = 0; i < (await footerLocator.locator(".block-footer__heading").count()); i++) {
      resp.push((await footerLocator.locator(".block-footer__heading").nth(i).innerText()).trim());
    }
    return resp;
  }

  /**
   * Click on global switcher
   */
  async clickGlobalSwicher() {
    const switcher = this.page.locator(Footer.selectorFooter).locator(Footer.selectorSwitcherAction);
    await switcher.scrollIntoViewIfNeeded();
    await switcher.click();
    await this.page.waitForLoadState("load");
  }

  /**
   * Set locale and currency on global switcher and click done
   * @param {locale: label of locale, currency: label of currency}
   */
  async changeLocaleAndCurrency({ locale, currency }: { locale?: string; currency?: string } = {}) {
    const swicherModal = this.page.locator(Footer.selectorSwicherModal);
    if (locale) {
      await swicherModal.locator(Footer.selectorLocaleItem, { hasText: locale }).click();
    }
    if (currency) {
      await swicherModal.locator(Footer.selectorCurrencyItem, { hasText: currency }).click();
    }
    await swicherModal.locator("button", { hasText: "Done" }).click();
  }
}
