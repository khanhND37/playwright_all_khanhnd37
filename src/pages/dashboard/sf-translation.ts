import { Page } from "@playwright/test";
import { SFHome } from "@pages/storefront/homepage";

export type configLanguage = {
  country?: string;
  language?: string;
  currency?: string;
};

export class SfTranslation extends SFHome {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathTranslate = {
    globalSwitcherBlock: `//section[contains(@class,'global_switcher') or @component="global-switcher"]//div[contains(@class, 'action-label')]`,
    countryFlag: `//img[@class="image country-flag" and @data-loaded="true"]`,
    sectionContainer: index => `(//section[@class="section relative wb-builder__section--container"])[${index}]`,
    blockById: id => `//section[@block-id="${id}"]`,
    contentBlockById: id => `//section[@block-id="${id}"]//p`,
    blockByText: text => `//*[normalize-space()='${text}']`,

    popupSelect: {
      saveBtn: `//div[contains(@class, 'currency-language-v2--wrapper')]//button[contains(@class, 'btn-primary')]`,
      cancelBtn: `//div[contains(@class, 'currency-language-v2--wrapper')]//button[contains(@class, 'btn-secondary')]`,
      dropdownBtnList: `//div[contains(@class, 'selected pointer')]`,
      openedDropdown: `//div[contains(@class, 'is-open')]`,
      option: text => `//div[contains(text(),"${text}")]`,
    },
    paragraphHeader: `//div[contains(@class, 'block-paragraph')]//p`,
  };
  xpathSearch = {
    productSearchMessage: `//div[contains(@class, 'product-list-search__message')]`,
    searchSuggestionTitle: `//p[contains(@class, 'search-suggestion__title')]`,
    productCardName: `//div[contains(@class, 'product-card__name')]//h3`,
    productListSearch: `//section[@component="product_list_search"]`,
  };

  xpathSfInside = {
    btnLocale: `(//div[contains(@class, 'currency-language_action')])[1]`,
    popupSelectLanguage: `div.modal-select-currency-language`,
    optionLanguage: language =>
      `(//span[contains(@class,'currency-dropdown__item__name') and contains(text(),'${language}')])[1]`,
    btnSelect: `(//button[contains(@class, 'btn btn-primary')])[1]`,
  };

  xpathComment = {
    comment: text => `//p[normalize-space()='${text}']`,
    buttonTranslateByTextCmt: textCmt =>
      `//p[normalize-space()='${textCmt}']//parent::div//following-sibling::div//div//span`,
    seeContentBtn: `//div[contains(@class, 'user-reply')]//div//span`,
    translating: `//div[contains(@class, 'user-reply')]//div//span[contains(@class, 'translating')]`,
  };

  xpathProductReview = {
    review: text => `//div[normalize-space()='${text}']`,
    buttonTranslateByTextReview: textReview => `//div[normalize-space()='${textReview}']//following-sibling::div//a`,
    seeContentBtn: `//div[contains(@class, 'rv-detail-translate')]//a`,
    translating: `//a[contains(@class, 'translating')]`,
  };

  /**
   * Open storefront
   */
  async openStorefront() {
    await this.page.goto(`https://${this.domain}`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Change setting on popup Global switcher
   * @param conf
   */
  async changeSettingLanguage(conf: configLanguage) {
    const isGlobalSwitcherBlockVisible = await this.genLoc(this.xpathTranslate.globalSwitcherBlock).isVisible();
    if (!isGlobalSwitcherBlockVisible) {
      await this.page.reload();
      await this.page.waitForLoadState("networkidle", { timeout: 15000 });
    }
    await this.genLoc(this.xpathTranslate.globalSwitcherBlock).click({ delay: 1000 });
    const dropdownBtnLocs = await this.genLoc(this.xpathTranslate.popupSelect.dropdownBtnList).all();
    if (conf.country) {
      await dropdownBtnLocs[0].click({ delay: 1000 });
      await this.genLoc(this.xpathTranslate.popupSelect.option(conf.country)).last().click();
    }
    if (conf.language) {
      await dropdownBtnLocs[1].click({ delay: 1000 });
      await this.genLoc(this.xpathTranslate.popupSelect.option(conf.language)).last().click();
    }
    if (conf.currency) {
      await dropdownBtnLocs[2].click({ delay: 1000 });
      await this.genLoc(this.xpathTranslate.popupSelect.option(conf.currency)).last().click();
    }
    await this.genLoc(this.xpathTranslate.popupSelect.saveBtn).click();
    try {
      await this.waitUntilElementVisible(this.xpathTranslate.globalSwitcherBlock);
    } catch (error) {
      await this.genLoc(this.xpathTranslate.popupSelect.saveBtn).click();
      await this.waitUntilElementVisible(this.xpathTranslate.globalSwitcherBlock);
    }
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Click Dropdown Language On Popup Global switcher
   */
  async clickDropdownLanguageOnPopup() {
    await this.genLoc(this.xpathTranslate.globalSwitcherBlock).click();
    await this.genLoc(this.xpathTranslate.popupSelect.dropdownBtnList).nth(1).click({ delay: 1000 });
  }

  /**  theme Inside : Change language on SF
   * @param language
   */
  async changeLanguageSfInside(language: string) {
    await this.page.locator(this.xpathSfInside.btnLocale).scrollIntoViewIfNeeded();
    await this.page.locator(this.xpathSfInside.btnLocale).click();
    await this.page.waitForSelector(this.xpathSfInside.popupSelectLanguage, { state: "visible" });
    await this.page.locator(this.xpathSfInside.optionLanguage(language)).click();
    await this.page.locator(this.xpathSfInside.btnSelect).click();
  }

  /**
   * get search suggestion on SF
   */
  async getSearchSuggestion(): Promise<string[]> {
    const result = [];
    await this.waitUntilElementVisible(this.xpathSearchSuggestion);
    const numberOfSuggestion = await this.genLoc(this.xpathSearch.searchSuggestionTitle).count();
    for (let i = 0; i < numberOfSuggestion; i++) {
      const title = await this.genLoc(this.xpathSearch.searchSuggestionTitle).nth(i).innerText();
      result.push(title);
    }
    return result;
  }

  /**
   * get search result on product list search on SF
   */
  async getSearchResultOnProductListSearch(): Promise<string[]> {
    const result = [];
    await this.waitUntilElementVisible(this.xpathSearch.productListSearch);
    const numberOfProducts = await this.genLoc(this.xpathSearch.productListSearch)
      .locator(this.xpathSearch.productCardName)
      .count();
    for (let i = 0; i < numberOfProducts; i++) {
      const title = await this.genLoc(this.xpathSearch.productListSearch)
        .locator(this.xpathSearch.productCardName)
        .nth(i)
        .innerText();
      result.push(title);
    }
    return result;
  }
}
