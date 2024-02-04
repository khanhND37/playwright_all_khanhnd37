import { Page } from "@playwright/test";
import { Settings } from "./settings";

export type PrimaryMarket = {
  country?: string;
  currency?: string;
};

export class GlobalMarkets extends Settings {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathGM = {
    backBtn: `//button[contains(@class, 'btn-back')]//span`,
    popup: title =>
      `//div[contains(@class, 'sb-popup__header') and (normalize-space()='${title}')]//ancestor::div[contains(@class, 'popup__container')]`,
    title: text => `//div[contains(@class, 'sb-title-ellipsis') and (normalize-space()='${text}')]`,
    toastMessage: `//div[contains(@class, 'sb-toast sb-flex sb-flex-justify-center sb-flex-align-center sb-w-100') or @class = 's-toast is-dark is-bottom']`,
    actionBtn: action => `//button[contains(@class, 'sb-button')]//span[normalize-space()='${action}']`,
    otherMarketList: `//div[normalize-space()='Other Markets']//parent::div[contains(@class,'block-item--primary')]//span[@class="text-bold"]`,
    otherMarket: marketName =>
      `//div[normalize-space()='Other Markets']//parent::div[contains(@class,'block-item--primary')]//span[@class="text-bold" and normalize-space()='${marketName}']`,
    primaryMarket: {
      item: `//a[contains(@href, 'primary-market')]`,
      countryDropdownBtn: `//div[contains(@class, 'sb-flex') and (normalize-space()='Country')]//following-sibling::div//button`,
      currencyDropdownBtn: `//div[contains(@class, 'sb-flex') and (normalize-space()='Currency')]//following-sibling::div//button`,
    },
    addMarket: {
      marketName: `//div[contains(@class, 'card__header') and normalize-space()='Market name']//following-sibling::div//input`,
      countryCheckBox: country => `//div[normalize-space()='${country}']//parent::td//preceding-sibling::td//span`,
      addedCountry: country => `//div[@class="table-countries"]//div[contains(text(), '${country}')]`,
    },
    popupCfAddLanguage: {
      checkboxList: `//label[contains(@class, 'select-language__item')]//span[@class="sb-check"]`,
      desc: `//div[@id="popup-select-language"]//div[contains(@class, 'text-body')]`,
      checkbox: language => `//span[normalize-space()='${language}']//preceding-sibling::span`,
    },
    popupCfRemoveCoutries: `//div[@class="sb-popup"]//div[contains(text(), 'countries are already existing')]`,
  };

  /**
   * select country/currency primary market
   * @param country
   * @param currency
   */
  async selectCountryAndCurrencyPriMarket(conf: PrimaryMarket) {
    if (conf.country) {
      await this.genLoc(this.xpathGM.primaryMarket.countryDropdownBtn).click();
      await this.genLoc(`//li//label[normalize-space()= '${conf.country}']`).click();
    }
    if (conf.currency) {
      await this.genLoc(this.xpathGM.primaryMarket.currencyDropdownBtn).click();
      await this.genLoc(`//li//label[normalize-space()= '${conf.currency}']`).click();
    }
  }

  /**
   * Change primary market
   */
  async changePrimaryMarketNoAddLanguage(conf: PrimaryMarket) {
    await this.genLoc(this.xpathGM.primaryMarket.item).click();
    await this.selectCountryAndCurrencyPriMarket(conf);
    await this.page.getByRole("button", { name: "Save" }).click();
    await this.waitForElementVisibleThenInvisible(this.xpathGM.toastMessage);
    const isPopupAddLanguageVisible = await this.genLoc(this.xpathGM.popup("Add languages")).isVisible();
    if (isPopupAddLanguageVisible) {
      await this.genLoc(this.xpathGM.actionBtn("Cancel")).click();
    }
    await this.genLoc(this.xpathGM.backBtn).click();
  }

  /**
   * Fill name and add countries
   * @param name
   * @param countries
   */
  async fillNameAndAddCountries(name: string, countries?: string[]) {
    await this.genLoc(this.xpathGM.addMarket.marketName).fill(name);
    if (countries) {
      await this.genLoc(this.xpathGM.actionBtn("Add countries / regions")).click();
      await this.waitUntilElementVisible(this.xpathGM.popup("Add countries"));
      for (const country of countries) {
        await this.genLoc(this.xpathGM.addMarket.countryCheckBox(country)).scrollIntoViewIfNeeded();
        await this.genLoc(this.xpathGM.addMarket.countryCheckBox(country)).click();
      }
      await this.genLoc(this.xpathGM.actionBtn("Add")).click({ delay: 1000 });
    }
  }

  /**
   * Add new market
   * @param name
   * @param countries
   */
  async addNewMarket(name: string, countries: string[]) {
    await this.genLoc(this.xpathGM.actionBtn("Add market")).click();
    await this.waitUntilElementVisible(this.xpathGM.title("Add new market"));
    await this.fillNameAndAddCountries(name, countries);
    const isPopCfRemoveCountries = await this.genLoc(this.xpathGM.popupCfRemoveCoutries).isVisible();
    if (isPopCfRemoveCountries) {
      await this.genLoc(this.xpathGM.actionBtn("Confirm")).click();
    }
    await this.genLoc(this.xpathGM.actionBtn("Add Market")).click();
    await this.waitForElementVisibleThenInvisible(this.xpathGM.toastMessage);
  }

  /**
   * Add new market
   * @param name
   * @param countries
   */
  async addNewMarketNoAddLanguage(name: string, countries: string[]) {
    await this.addNewMarket(name, countries);
    const isPopupAddLanguageVisible = await this.genLoc(this.xpathGM.popup("Add languages")).isVisible();
    if (isPopupAddLanguageVisible) {
      await this.genLoc(this.xpathGM.actionBtn("Cancel")).click();
    }
    await this.genLoc(this.xpathGM.backBtn).click();
  }

  /**
   * Remove all languagues on popup confirm add language
   * @param country
   * @param currency
   */
  async removeAllLanguagesOnPopup() {
    const checkboxLocs = await this.genLoc(this.xpathGM.popupCfAddLanguage.checkboxList).all();
    for (const checkboxLoc of checkboxLocs) {
      await checkboxLoc.click();
    }
  }

  /**
   * Remove all Other markets
   */
  async removeAllOtherMarkets() {
    let existMarketLoc = await this.genLoc(this.xpathGM.otherMarketList).first().isVisible();
    while (existMarketLoc) {
      await this.genLoc(this.xpathGM.otherMarketList).first().click();
      await this.genLoc(this.xpathGM.actionBtn("Delete market")).click();
      await this.genLoc(`//div[@class="sb-popup"]`).locator(this.xpathGM.actionBtn("Delete market")).click();
      await this.waitForElementVisibleThenInvisible(this.xpathGM.toastMessage);
      existMarketLoc = await this.genLoc(this.xpathGM.otherMarketList).first().isVisible();
    }
  }
}
