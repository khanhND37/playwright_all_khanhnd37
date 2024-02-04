import { waitSelector } from "@core/utils/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Page } from "@playwright/test";

export class WbGlobalMarket extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpath = {
    domainButton: '//div[@id="page-header"]//button//span[contains(text(), "Domains")]',
    saveButton: `//button//span[contains(text(), 'Save')]`,
    domainBlock: "//div[contains(@class, 'block-choose-domain-type')]",
    primaryMarket: `//*[@class= 'sb-table__row']//a[contains(@href, 'primary-market')]//span[@class= 'text-bold']`,
    dropdownCountry: `(//label[contains(text(), 'Country')]/ancestor::div[2]//div[contains(@class, 'sb-form-item__content')]//div)[1]`,
    backButton: `//*[@id="page-header"]//button[contains(@class, 'sb-btn-back')]`,
    domainInfoHeading: `//*[@class='domain-type-info']//p[contains(@class, 'info-heading')]`,
    viewButton: `.s-button span:text-is('View')`,
    buttonATC: `//div[contains(@class, 'product-card__btn')]//span`,
    xpathToastSuccessBio: "//div[contains(text(),'uccessfully')]",
    xpathHeaderPopupChangeTrafficStatus: `//*[contains(text(), 'redirection?')]`,
    xpathButtonChangeTrafficStatus: `//button//span[contains(text(), 'redirection')]`,
    xpathSearchResult: `//div[contains(@class, 'product-list-search__message') and contains(text(), '1 results')]`,
    xpathRedirectURL: `//li[contains(@class, 'li-online-store')]//i`,
    buttonCheckOutDELanguage: key =>
      `//section[@component="button"]//span[contains(@class, 'break-words') and contains(text(), '${key}')]`,
  };

  xpathGlobalMarket = {
    blockLanguageList: `//div[contains(@class, 'setting-language-list')]//div[contains(@class, 'is-default')]`,
    blockChooseDomainType: `//div[contains(@class, 'block-choose-domain-type')]`,
    currentLanguageDefault: language =>
      `//div[contains(@class, 'is-default')]//div[contains(@class, 'sb-text-bold') and contains(text(), '${language}')]`,
    optionLanguageButton: language =>
      `//div[contains(@class, 'sb-text-bold') and contains(text(), '${language}')]/ancestor::div[contains(@class, 'setting-language-item')]//button`,
    setDefaultLanguageButton: `//div[contains(@class, 'sb-popover') and not(@style='display: none;')]//li[contains(text(), 'Set as default')]`,
    confirmSetLanguage: `//button//span[contains(text(), 'Set default')]`,
    headerAddNewMarket: `//div[contains(text(), 'Add new market')]`,
    inputMarketName: `//div[contains(@class, 'sb-form-item__content')]//input`,
    searchCountryTextbox: `//*[@placeholder="Search countries / regions"]`,
    checkboxCountry: market =>
      `//*[contains(text(), '${market}')]/ancestor::*[@class="sb-table__row"]//span[@class="sb-check"]`,
    rowMarket: market => `//tr[@class="sb-table__row"]//*[contains(text(), '${market}')]`,
    statusMarket: `//span[contains(@class, 'sb-badge') and contains(text(), 'Active')]`,
    buttonCancelOnPopup: `//div[contains(@class, 'sb-popup__footer')]//span[contains(text(), 'Cancel')]`,
    trafficStatus: `//div[contains(@class, 'traffic-status')]//span//a`,
  };

  async isLanguageNotDefault(language) {
    return this.page.locator(this.xpathGlobalMarket.currentLanguageDefault(language)).isHidden();
  }

  async isLanguageOnStatus(language, status) {
    return this.page.locator(this.getStatusOfLanguage(language, status)).isVisible();
  }

  async isDisableMarket(market) {
    return this.page.locator(this.getMarketItem(market)).isHidden();
  }

  async isDomainNotOnOption(option) {
    return this.page.locator(this.getXpathDomainInfoHeading(option)).isHidden();
  }

  async isTrafficStatusVisible(status) {
    return await this.page.locator(this.getXpathTrafficStatus(status)).isVisible();
  }

  getXpathTrafficStatus(status) {
    return `//div[contains(@class, 'traffic-status')]//a[contains(text(), '${status}')]`;
  }

  getXpathDomainInfoHeading(info) {
    return `//*[@class='domain-type-info']//p[contains(@class, 'info-heading') and contains(text(), '${info}')]`;
  }

  getXpathCountryOptionOnDashboard(name) {
    return `//li[contains(@class, 'sb-select-menu__item')]//label[contains(text(), '${name}')]`;
  }

  getXpathMenuByName(name): string {
    return `//p[contains(@class,'settings-nav__title') and contains(text(), '${name}')]`;
  }

  getXpathRatioOnDomainBlock(name): string {
    return `//span[contains(text(), '${name}')]`;
  }

  getXpathCollectionOnDashboard(name) {
    return `//a[contains(@href, 'collections') and contains(text(), '${name}')]`;
  }

  getXpathProductItem(name) {
    return `//h2[contains(text(), '${name}')]/ancestor::div[contains(@class, 'product-item')]`;
  }

  getMarketItem(name) {
    return `//tr[@class="sb-table__row"]//span[contains(text(), '${name}')]`;
  }

  async clickButtonByName(buttonName, index = 1) {
    await this.page.locator(`(//button//span[contains(text(), '${buttonName}')])[${index}]`).click();
  }

  getStatusOfLanguage(language, status: "Unpublish" | "Publish") {
    return `//div[contains(text(), '${language}')]/ancestor::div[contains(@class, 'setting-language-item')]//p[contains(text(), '${status}')]`;
  }

  /**
   * choose Domain On Global Market
   * @param option
   */
  async chooseDomainOnGlobalMarket(option: "Subfolders" | "Primary domain") {
    await this.navigateToMenu("Settings", 1);
    await this.page.locator(this.getXpathMenuByName("Global Markets")).click();
    await this.page.locator(this.xpath.domainButton).click();
    await this.page.waitForSelector(this.xpathGlobalMarket.blockChooseDomainType, { state: "visible" });
    const domainStatus = await this.isDomainNotOnOption(option);

    if (domainStatus) {
      await this.page.locator(this.getXpathRatioOnDomainBlock(option)).click();
      await this.page.locator(this.xpath.saveButton).click();
    }
    await this.page.waitForSelector(this.getXpathDomainInfoHeading(option));
    await this.page.locator(this.xpath.backButton).click();
  }

  /**
   * chosse primary market in dashboard
   * @param country
   */
  async choosePrimaryMarket(country: string) {
    await this.navigateToMenu("Settings", 1);
    await this.page.locator(this.getXpathMenuByName("Global Markets")).click();
    await this.page.locator(this.xpath.primaryMarket).click();
    await waitSelector(this.page, this.xpath.dropdownCountry);
    await this.page.locator(this.xpath.dropdownCountry).click();
    await this.page.locator(this.getXpathCountryOptionOnDashboard(country)).last().click();
    await this.page.locator(this.xpath.saveButton).click();
    await this.page.waitForSelector(this.xpath.xpathToastSuccessBio, { state: "visible" });
    await this.page.waitForSelector(this.xpath.xpathToastSuccessBio, { state: "hidden" });
  }

  /**
   * choose language default on dashboard
   * @param language
   */
  async chooseLanguageDefault(language: string) {
    await this.navigateToMenu("Settings", 1);
    await this.page.locator(this.getXpathMenuByName("Languages")).click();
    await this.page.waitForSelector(this.xpathGlobalMarket.blockLanguageList, { state: "visible" });
    const notDefaultlanguage = await this.isLanguageNotDefault(language);

    if (notDefaultlanguage) {
      await this.page.locator(this.xpathGlobalMarket.optionLanguageButton(language)).click();
      await this.page.locator(this.xpathGlobalMarket.setDefaultLanguageButton).click();
      await this.page.locator(this.xpathGlobalMarket.confirmSetLanguage).click();
    }
    await waitSelector(this.page, this.xpathGlobalMarket.currentLanguageDefault(language));
    await this.page.waitForSelector(this.xpath.xpathToastSuccessBio, { state: "hidden" });
  }

  async setLanguageStatus(language: string, status: "Unpublish" | "Publish") {
    await this.navigateToMenu("Settings", 1);
    await this.page.locator(this.getXpathMenuByName("Languages")).click();
    await this.page.waitForSelector(this.xpathGlobalMarket.blockLanguageList, { state: "visible" });
    const statusOfLanguage = await this.isLanguageOnStatus(language, status);

    if (statusOfLanguage) {
      await this.page.locator(this.getStatusOfLanguage(language, status)).click();
      const isButtonVisible = await this.page.locator(`//button//span[contains(text(), '${status}')]`).isVisible();
      if (isButtonVisible) {
        await this.clickButtonByName(status);
      }

      await this.page.waitForSelector(this.xpath.xpathToastSuccessBio, { state: "hidden" });
    }
    await this.page.waitForSelector(this.getStatusOfLanguage(language, status), { state: "hidden" });
  }

  /**
   * add a publish market(market name == country name)
   * @param market
   */
  async addPublishMarket(market: string) {
    await this.navigateToMenu("Settings", 1);
    await this.page.locator(this.getXpathMenuByName("Global Markets")).click();
    await this.page.waitForSelector(`.card-market`, { state: "visible" });
    const isDisableMarket = await this.isDisableMarket(market);

    if (isDisableMarket) {
      await this.clickButtonByName("Add market");
      await waitSelector(this.page, this.xpathGlobalMarket.headerAddNewMarket);
      await this.page.locator(this.xpathGlobalMarket.inputMarketName).click();
      await this.page.locator(this.xpathGlobalMarket.inputMarketName).fill(market);

      await this.clickButtonByName("Add countries / regions");
      await this.page.locator(this.xpathGlobalMarket.searchCountryTextbox).click();
      await this.page.locator(this.xpathGlobalMarket.searchCountryTextbox).fill(market);
      await this.page.locator(this.xpathGlobalMarket.checkboxCountry(market)).click();
      await this.clickButtonByName("Add", 3);
      await waitSelector(this.page, this.xpathGlobalMarket.rowMarket(market));

      await this.clickButtonByName("Publish");
      await waitSelector(this.page, this.xpathGlobalMarket.statusMarket);

      await this.clickButtonByName("Add Market");
      await this.page.waitForSelector(this.xpath.xpathToastSuccessBio, { state: "hidden" });

      await this.page.locator(this.xpath.backButton).click();
    }
    await waitSelector(this.page, this.getMarketItem(market));
  }

  /**
   * delete market by name
   * @param market
   */
  async deleteMarket(market: string) {
    await this.navigateToMenu("Settings", 1);
    await this.page.locator(this.getXpathMenuByName("Global Markets")).click();
    await this.page.waitForSelector(`.card-market`, { state: "visible" });
    const isDisableMarket = await this.isDisableMarket(market);

    if (!isDisableMarket) {
      await this.page.locator(this.getMarketItem(market)).click();
      await this.clickButtonByName("Delete market");
      await waitSelector(this.page, this.xpathGlobalMarket.buttonCancelOnPopup);
      await this.clickButtonByName("Delete market", 2);
      await this.page.waitForSelector(this.xpath.xpathToastSuccessBio, { state: "hidden" });
    }
    await this.page.waitForSelector(this.getMarketItem(market), { state: "hidden" });
  }

  async setStatusRedirectionDomain(status: "Disable" | "Enable") {
    await this.navigateToSubMenu("Online Store", "Domains");
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector(this.xpathGlobalMarket.trafficStatus);
    const isTrafficVisible = await this.isTrafficStatusVisible(status);
    if (isTrafficVisible) {
      await this.page.locator(this.getXpathTrafficStatus(status)).click();
      await waitSelector(this.page, this.xpath.xpathHeaderPopupChangeTrafficStatus);
      await this.page.locator(this.xpath.xpathButtonChangeTrafficStatus).click();
    }
    await this.page.waitForSelector(this.getXpathTrafficStatus(status), { state: "hidden" });
  }
}
