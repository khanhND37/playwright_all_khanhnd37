import { Page } from "@playwright/test";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { getMailinatorInstanceWithProxy } from "@core/utils/mail";
import { Mailinator } from "@helper/mailinator";
import { expect } from "@core/fixtures";

export class LanguageList extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathLangList = {
    blockPricing: `//div[contains(@class, 'setting-plan')]//parent::div[contains(@class, 'block-item')]`,
    closePopupBtn: `//button[contains(@class, 'popup__header-close')]`,
    backBtn: `//button[contains(@class, 'btn-back')]//span`,
    titleLanguageList: `//div[contains(@class, 'sb-title-ellipsis') and (normalize-space()='Languages')]`,
    languageItemList: blockName =>
      `//div[contains(@class, 'text-heading') and normalize-space()='${blockName}']//parent::div//following-sibling::div//div[contains(@class, 'setting-language-item')]`,
    languageItemByName: (blockName, language) =>
      `//div[contains(@class, 'text-heading') and normalize-space()='${blockName}']//parent::div//following-sibling::div//div[contains(@class, 'sb-text') and normalize-space()='${language}']`,
    moreActionBtn: language =>
      `//div[normalize-space()='${language}']//ancestor::div[contains(@class,'language-item')]//span[contains(@class, 'sb-icon__small')]`,
    moreActionBtnList: `//span[contains(@class, 'sb-icon__small')]`,
    toastMessage: `//div[contains(@class, 'sb-toast sb-flex sb-flex-justify-center sb-flex-align-center sb-w-100') or @class = 's-toast is-dark is-bottom']`,
    languageLabel: (language, label) =>
      `//div[normalize-space()='${language}']//following-sibling::span[normalize-space()='${label}']`,
    upgradePlanBtn: `//button[contains(@class, 'button--secondary')]//span[normalize-space()='Upgrade plan']`,
    changeStatusBtn: (language, status) =>
      `//div[normalize-space()='${language}']//ancestor::div[contains(@class,'language-item')]//p[normalize-space()='${status}']`,
    entityDetailBtn: entityName =>
      `//p[normalize-space()='${entityName}']//following-sibling::a[normalize-space()='Details']`,
    blockFullsiteTranslation: `//div[normalize-space()="Full-site translation"]//parent::div[contains(@class, 'sb-block-item')]`,
    addLanguage: {
      addLanguageBtn: `//button[contains(@class, 'button-primary')]//span[normalize-space()='Add language']`,
      addLanguagePopup: `//div[contains(@class, 'sb-popup__header') and (normalize-space()='Add new language')]`,
      searchBox: `//input[@placeholder="Search language"]`,
      euroCountries: `//div[contains(text(),'Europeans countries')]`,
      noOfSelectedCountries: `//div[@id="popup-add-language"]//div[contains(@class, 'select-language')]//div[contains(text(), 'selected')]`,
      languageCheckBox: language => `//span[normalize-space()='${language}']//preceding-sibling::span`,
      addLanguageBtnOnPopup: `//button[contains(@class, 'sb-popup__footer') and (normalize-space()='Add languages')]`,
    },
    unpublish: {
      popupUnpublish: language =>
        `//div[contains(@class, 'sb-popup__header') and (normalize-space()='Unpublish ${language}')]`,
      unpublishBtnOnPopup: `//button[contains(@class, 'sb-popup__footer') and (normalize-space()='Unpublish')]`,
    },
    setDefault: {
      setAsDefaultOption: `//li[normalize-space()='Set as default']`,
      setDefaultPopup: `//div[contains(@class, 'sb-popup__header') and (normalize-space()='Set default language')]`,
      setDefaultBtnOnPopup: `//button[contains(@class, 'sb-popup__footer') and (normalize-space()='Set default')]`,
    },
    remove: {
      removeOption: `//li[normalize-space()='Remove']`,
      removePopup: `//div[contains(@class, 'sb-popup__header') and (normalize-space()='Remove language')]`,
      removeBtnOnPopup: `//button[contains(@class, 'sb-popup__footer') and (normalize-space()='Remove')]`,
    },
    block: {
      content: blockName =>
        `//div[contains(@class, 'text-heading') and normalize-space()='${blockName}']//ancestor::div[contains(@class, 'block-item')]`,
      heading: blockName => `//div[contains(@class, 'text-heading') and normalize-space()='${blockName}']`,
      desc: blockName =>
        `//div[contains(@class, 'text-heading') and normalize-space()='${blockName}']//following-sibling::p`,
      descCurrentPlan: `//div[contains(@class, 'text-heading') and normalize-space()='Current plan']//parent::div//following-sibling::div//p[contains(@class, 'sb-text-neutral')]`,
    },
    mail: {
      title: `//h2[normalize-space()='Translation is completed!']`,
      content: `//h2[normalize-space()='Translation is completed!']//following-sibling::p`,
      viewTranslationBtn: `//b[normalize-space()='View translation']`,
    },
  };

  /**
   * Add languages
   * @param languages is list of languages
   * @param chooseEuro
   */
  async addLanguages(languages: string[], chooseEuro = false) {
    await this.genLoc(this.xpathLangList.addLanguage.addLanguageBtn).click();
    await this.waitUntilElementVisible(this.xpathLangList.addLanguage.addLanguagePopup);
    if (chooseEuro === true) {
      await this.genLoc(this.xpathLangList.addLanguage.euroCountries).click();
    }
    for (const language of languages) {
      await this.genLoc(this.xpathLangList.addLanguage.languageCheckBox(language)).scrollIntoViewIfNeeded();
      await this.genLoc(this.xpathLangList.addLanguage.languageCheckBox(language)).click();
    }
    await this.genLoc(this.xpathLangList.addLanguage.addLanguageBtnOnPopup).click();
    await this.waitUntilMessVisible();
  }

  async addLanguage(language: string) {
    const languageisNotVisible = await this.genLoc(this.xpathLangList.moreActionBtn(language)).isHidden();
    if (languageisNotVisible) {
      await this.genLoc(this.xpathLangList.addLanguage.addLanguageBtn).click();
      await this.waitUntilElementVisible(this.xpathLangList.addLanguage.addLanguagePopup);
      await this.genLoc(this.xpathLangList.addLanguage.languageCheckBox(language)).scrollIntoViewIfNeeded();
      await this.genLoc(this.xpathLangList.addLanguage.languageCheckBox(language)).click();
      await this.genLoc(this.xpathLangList.addLanguage.addLanguageBtnOnPopup).click();
      await this.page.waitForSelector(this.xpathLangList.languageItemByName("Published languages", language), {
        state: "visible",
      });
    }
  }

  /**
   * Publish/Unpublish language
   * @param language
   * @param status
   */
  async changeStatusLanguage(language: string, status: "Publish" | "Unpublish") {
    const statusLoc = this.genLoc(this.xpathLangList.changeStatusBtn(language, status));
    await statusLoc.click();
    switch (status) {
      case "Unpublish":
        await this.waitUntilElementVisible(this.xpathLangList.unpublish.popupUnpublish(language));
        await this.genLoc(this.xpathLangList.unpublish.unpublishBtnOnPopup).click();
        break;
      default:
        break;
    }
    await this.waitUntilMessVisible();
  }

  /**
   * Set language as default
   * @param language
   */
  async setLanguageAsDefault(language: string) {
    await this.genLoc(this.xpathLangList.moreActionBtn(language)).click();
    await this.genLoc(this.xpathLangList.setDefault.setAsDefaultOption).last().click();
    await this.genLoc(this.xpathLangList.setDefault.setDefaultBtnOnPopup).click();
    await this.waitUntilMessVisible();
  }

  /**
   * Remove language
   * @param language
   */
  async removeLanguage(language: string) {
    const languageIsVisible = await this.genLoc(this.xpathLangList.moreActionBtn(language)).isVisible();
    if (languageIsVisible) {
      await this.genLoc(this.xpathLangList.moreActionBtn(language)).click();
      await this.genLoc(this.xpathLangList.remove.removeOption).last().click();
      await this.waitUntilElementVisible(this.xpathLangList.remove.removePopup);
      await this.genLoc(this.xpathLangList.remove.removeBtnOnPopup).click();
      await this.waitUntilMessVisible();
    }
  }

  /**
   * Open language detail
   * @param blockName
   * @param language
   */
  async openLanguageDetail(blockName: "Published languages" | "Unpublished languages", language: string) {
    await expect(this.genLoc(this.xpathLangList.languageItemByName(blockName, language))).toBeVisible();
    await this.genLoc(this.xpathLangList.languageItemByName(blockName, language)).click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait until mess hidden
   */
  async waitUntilMessHidden() {
    await this.waitUntilElementInvisible(this.xpathLangList.toastMessage);
  }

  /**
   * Wait until mess visible
   */
  async waitUntilMessVisible() {
    await this.waitUntilElementVisible(this.xpathLangList.toastMessage);
  }

  /**
   * Remove all languages
   */
  async removeAllLanguages() {
    let existActionBtnLoc = await this.genLoc(this.xpathLangList.moreActionBtnList).first().isVisible();
    while (existActionBtnLoc) {
      await this.genLoc(this.xpathLangList.moreActionBtnList).first().click();
      await this.genLoc(this.xpathLangList.remove.removeOption).last().click();
      await this.waitUntilElementVisible(this.xpathLangList.remove.removePopup);
      await this.genLoc(this.xpathLangList.remove.removeBtnOnPopup).click();
      await this.waitUntilMessVisible();
      await this.waitUntilMessHidden();
      existActionBtnLoc = await this.genLoc(this.xpathLangList.moreActionBtnList).first().isVisible();
    }
  }

  /**
   * Get number of selected countries
   */
  async getNumberOfSelectedCountries(): Promise<number> {
    const selectedCountriesText = await this.genLoc(this.xpathLangList.addLanguage.noOfSelectedCountries).innerText();
    return Number(selectedCountriesText.split(" ")[0]);
  }

  /**
   * Open mail Translation compeleted
   */
  async openMailTranslationCompleted(context, forwardMail: string): Promise<Mailinator> {
    const newTab = await context.newPage();
    const mailinator = await getMailinatorInstanceWithProxy(newTab);
    await mailinator.accessMail(forwardMail);
    //wait to forward newest mail
    await mailinator.page.waitForTimeout(2 * 1000);
    await mailinator.readMail("Translation is completed!");
    return mailinator;
  }

  /**
   * Go to Language list page
   */
  async goToLanguageList() {
    await this.goto("admin/settings/language");
    await this.waitUntilElementVisible(this.xpathLangList.titleLanguageList);
  }
}
