import { Page } from "@playwright/test";
import { LanguageList } from "./language-list";
import { expect } from "@core/fixtures";
import { waitSelector } from "@core/utils/theme";

type EntityBlockWebContent =
  | "Header & Footer"
  | "Website pages"
  | "E-commerce pages"
  | "Blog pages"
  | "Member pages"
  | "System pages";
type EntityBlockProduct = "Products" | "Collections" | "Blogs" | "Blog posts";
type EntityBlockPage = "Blogs" | "Blog posts" | "Page details" | "Filter" | "Policy";
type EntityBlockApps = "Boost upsell" | "Conversion optimizer";
type EntityBlockOnlineStore = "Static content" | "Size guide" | "POD description template" | "POD size guide";
type EntityBlockNotifications = "Notifications";

export type Entity =
  | EntityBlockWebContent
  | EntityBlockProduct
  | EntityBlockPage
  | EntityBlockApps
  | EntityBlockOnlineStore
  | EntityBlockNotifications;

type EntityBlock = "All pages content" | "Products" | "Pages" | "Apps" | "Online store" | "Notifications";

export type SupportedLanguage =
  | "Sindhi"
  | "Sinhala (Sinhalese)"
  | "Slovak"
  | "Slovenian"
  | "Somali"
  | "Spanish"
  | "Sundanese"
  | "Swahili"
  | "Swedish"
  | "Tagalog (Filipino)"
  | "Tajik"
  | "Tamil"
  | "Tatar"
  | "Telugu"
  | "Thai"
  | "Tigrinya"
  | "Tsonga"
  | "Turkish"
  | "Turkmen"
  | "Twi (Akan)"
  | "Ukrainian"
  | "Urdu"
  | "Uyghur"
  | "Uzbek"
  | "Vietnamese"
  | "Welsh"
  | "Xhosa"
  | "Yiddish"
  | "Yoruba"
  | "Zulu"
  | "English"
  | "Albanian"
  | "Arabic"
  | "French"
  | "German"
  | "Greek"
  | "Czech";

export class LanguageDetail extends LanguageList {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathLD = {
    titleLanguageDetail: language => `//div[contains(@class, 'sb-title') and (normalize-space()='${language}')]`,
    badge: status => `//span[contains(@class, 'sb-badge') and normalize-space()='${status}']`,
    actionBtn: action => `//button[contains(@class, 'button')]//span[normalize-space()='${action}']`,
    loading: `//div[contains(@class, 'loading-screen')]`,
    saveBtn: `//span[normalize-space()='Save']`,
    toggleBtn: (entityBlock: EntityBlock) => `//div[normalize-space()='${entityBlock}']//following-sibling::div`,
    toggleBtnList: `//p[normalize-space()='Auto translate']//following-sibling::*//input`,
    freeToggleBtnList: `//span[normalize-space()='free']//following-sibling::div[normalize-space()='Auto translate']//following-sibling::*//input`,
    collapseEntityType: `//div[contains(@class, 'sb-collapse-item sb-p-medium')]`,
    collapseIcon: entityType =>
      `//div[normalize-space()='${entityType}']//parent::div//preceding-sibling::span[contains(@class, 'sb-icon')]`,
    alertTitle: `//div[contains(@class, 'sb-alert')]//div[contains(@class, 'alert__title')]`,
    alertDesc: `//div[contains(@class, 'sb-alert')]//p`,
    iconAlertInProgress: `//div[contains(@class, 'sb-alert__info')]//*[@id="Oval"]`,
    collapseBlock: "//div[@class='sb-collapse-item']//div[contains(@class, 'sb-collapse-item__header')]",
    blockHeading: heading =>
      `//div[contains(@class, 'sb-collapse-item__header') and contains(normalize-space(), '${heading}')]`,
    btnBack: `//button[contains(@class,'sb-btn-back')]`,
    currentLanguageDefault: language =>
      `//div[contains(@class, 'is-default')]//div[contains(@class, 'sb-text-bold') and contains(text(), '${language}')]`,
    blockLanguageList: `//div[contains(@class, 'setting-language-list')]//div[contains(@class, 'is-default')]`,
    optionLanguageButton: language =>
      `//div[contains(@class, 'sb-text-bold') and contains(text(), '${language}')]/ancestor::div[contains(@class, 'setting-language-item')]//button`,
    setDefaultLanguageButton: `//div[contains(@class, 'sb-popover') and not(@style='display: none;')]//li[contains(text(), 'Set as default')]`,
    confirmSetLanguage: `//button//span[contains(text(), 'Set default')]`,
    xpathToastSuccessBio: "//div[contains(text(),'uccessfully')]",
    popupCfPricing: `//div[@id="popup-translation-confirm-plan"]//div[contains(@class,'popup__container')]`,
    iconUpgrade: entityName =>
      `//div[normalize-space()='${entityName}']//parent::div//*[contains(@class, 'sb-icon__default sb-tooltip__reference')]`,
    activeTooltip: `//div[contains(@id, 'sb-tooltip') and not(contains(@style, 'display: none'))]`,
    headerCostCalculator: `//div[contains(@class, 'sb-collapse-item__header') and normalize-space()='Cost calculator']`,
    contentCostCalculator: `//*[normalize-space()="Number of contents"]//ancestor::div[contains(@class, 'translation-confirm-plan__block')]`,
    pricing: {
      currentStoreContent: `//div[@id="popup-translation-confirm-plan"]//*[contains(text(),"(Current store content quantity:")]`,
      totalPrice: `//div[@id="popup-translation-confirm-plan"]//*[normalize-space()='Total price']//parent::div//span`,
      inputCostCalculator: `//*[normalize-space()="Number of contents"]//ancestor::div[contains(@class, 'translation-confirm-plan__row')]//input`,
    },
  };

  getStatusOfLanguage(language, status: "Unpublish" | "Publish") {
    return `//div[contains(text(), '${language}')]/ancestor::div[contains(@class, 'setting-language-item')]//p[contains(text(), '${status}')]`;
  }

  getXpathMenuByName(name): string {
    return `//p[contains(@class,'settings-nav__title') and contains(text(), '${name}')]`;
  }

  async isLanguageNotDefault(language) {
    return this.page.locator(this.xpathLD.currentLanguageDefault(language)).isHidden();
  }

  async isLanguageOnStatus(language, status) {
    return this.page.locator(this.getStatusOfLanguage(language, status)).isVisible();
  }

  async clickButtonByName(buttonName, index = 1) {
    await this.page.locator(`(//button//span[contains(text(), '${buttonName}')])[${index}]`).click();
  }

  mapEntityToEntityBlock: Record<Entity, EntityBlock> = {
    "Header & Footer": "All pages content",
    "Website pages": "All pages content",
    "E-commerce pages": "All pages content",
    "Blog pages": "All pages content",
    "Member pages": "All pages content",
    "System pages": "All pages content",
    Products: "Products",
    Collections: "Products",
    Blogs: "Pages",
    "Page details": "Pages",
    "Blog posts": "Pages",
    Filter: "Pages",
    Policy: "Pages",
    "Boost upsell": "Apps",
    "Conversion optimizer": "Apps",
    "Static content": "Online store",
    "Size guide": "Online store",
    "POD description template": "Online store",
    "POD size guide": "Online store",
    Notifications: "Notifications",
  };

  /**
   * Click action button on header
   * @param action: Edit font, Preview, Unpublish, Publish
   */
  async clickActionButton(action: "Edit font" | "Preview" | "Unpublish" | "Publish"): Promise<Page> {
    let previewTab = this.page;
    let isActionBtnVisible: boolean;

    switch (action) {
      case "Preview":
        [previewTab] = await Promise.all([
          this.page.waitForEvent("popup"),
          this.genLoc(this.xpathLD.actionBtn(action)).click(),
        ]);
        break;

      case "Edit font":
        await this.genLoc(this.xpathLD.actionBtn(action)).click();
        await this.genLoc(this.xpathLD.loading).waitFor({ state: "visible" });
        await this.genLoc(this.xpathLD.loading).waitFor({ state: "hidden" });
        break;

      default:
        isActionBtnVisible = await this.genLoc(this.xpathLD.actionBtn(action)).isVisible();
        if (isActionBtnVisible) {
          await this.genLoc(this.xpathLD.actionBtn(action)).click();
          await this.genLoc(this.xpathLD.saveBtn).waitFor({ state: "visible" });
          await this.genLoc(this.xpathLD.saveBtn).click();
          await this.genLoc(this.xpathLangList.toastMessage).waitFor({ state: "hidden" });
        }
        break;
    }
    return previewTab;
  }

  /**
   * On/off toggle auto translate
   * @param entityType
   * @param status
   */
  async switchToggleAutoTranslate(entityType: EntityBlock, status: boolean) {
    await this.waitUntilElementVisible(this.xpathLD.toggleBtn(entityType));
    const toggleLoc = this.genLoc(this.xpathLD.toggleBtn(entityType)).locator(`//input`);
    const currentValue = await toggleLoc.isChecked();
    if (currentValue !== status) {
      await this.genLoc(this.xpathLD.toggleBtn(entityType)).locator(`//label`).click({ delay: 300 });
      const isPopupPricingVisible = await this.genLoc(this.xpathLD.popupCfPricing).isVisible();
      if (isPopupPricingVisible) {
        await this.clickOnBtnWithLabel("Confirm");
      }
      await this.genLoc(this.xpathLD.saveBtn).waitFor({ state: "visible" });
      await this.genLoc(this.xpathLD.saveBtn).click();
      await this.genLoc(this.xpathLangList.toastMessage).waitFor({ state: "visible" });
      await this.genLoc(this.xpathLD.saveBtn).waitFor({ state: "hidden" });
    }
  }

  /**
   * Click entity detail
   * @param entityName
   */
  async clickEntityDetail(entityName: Entity) {
    // Wait util language detail page loaded
    await expect(this.genLoc(this.xpathLD.blockHeading("Products"))).toBeVisible();

    const entityDetailBtnLoc = this.genLoc(this.xpathLangList.entityDetailBtn(entityName));
    // If entity not in view port, so need to expand entity block
    const entityBlockName = this.mapEntityToEntityBlock[entityName];
    const isEntityInViewPort = await entityDetailBtnLoc.isVisible();
    if (!isEntityInViewPort) {
      // Wait util DOM render completed
      const entityBlockHeadingLoc = this.genLoc(this.xpathLD.blockHeading(entityBlockName));
      await expect(entityBlockHeadingLoc).toBeVisible();
      await entityBlockHeadingLoc.click();
    }
    await entityDetailBtnLoc.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2 * 1000); //wait for page stable
  }

  async goToTranslationDetailScreen(
    blockName: "Published languages" | "Unpublished languages",
    language: SupportedLanguage,
    entityName: Entity,
  ) {
    await this.goto("admin/settings/language");
    await this.openLanguageDetail(blockName, language);
    await this.clickEntityDetail(entityName);
    await this.waitNetworkIdleWithoutThrow();
  }

  async goToLanguageDetail(blockName: "Published languages" | "Unpublished languages", language: SupportedLanguage) {
    await this.goto("admin/settings/language");
    await this.openLanguageDetail(blockName, language);
  }
  /**
   * choose language default on dashboard
   * @param language
   */
  async chooseLanguageDefault(language: string) {
    await this.navigateToMenu("Settings", 1);
    await this.page.locator(this.getXpathMenuByName("Languages")).click();
    await this.page.waitForSelector(this.xpathLD.blockLanguageList, { state: "visible" });
    const notDefaultlanguage = await this.isLanguageNotDefault(language);

    if (notDefaultlanguage) {
      await this.page.locator(this.xpathLD.optionLanguageButton(language)).click();
      await this.page.locator(this.xpathLD.setDefaultLanguageButton).click();
      await this.page.locator(this.xpathLD.confirmSetLanguage).click();
    }
    await waitSelector(this.page, this.xpathLD.currentLanguageDefault(language));
    await this.page.waitForSelector(this.xpathLD.xpathToastSuccessBio, { state: "hidden" });
  }

  /**
   * Set language status by language name
   * @param language
   * @param status
   */
  async setLanguageStatus(language: string, status: "Unpublish" | "Publish") {
    await this.navigateToMenu("Settings", 1);
    await this.page.locator(this.getXpathMenuByName("Languages")).click();
    await this.page.waitForSelector(this.xpathLD.blockLanguageList, { state: "visible" });
    const statusOfLanguage = await this.isLanguageOnStatus(language, status);

    if (statusOfLanguage) {
      await this.page.locator(this.getStatusOfLanguage(language, status)).click();
      await this.clickButtonByName(status);
      await this.page.waitForSelector(this.xpathLD.xpathToastSuccessBio, { state: "hidden" });
    }
    await this.page.waitForSelector(this.getStatusOfLanguage(language, status), { state: "hidden" });
  }

  async selectStorefront(sfName: string) {
    const xpathSearchBar = "//div[contains(@class,'sb-autocomplete')]//input";
    await this.page.waitForSelector(xpathSearchBar);
    const sfSelected = await this.genLoc(xpathSearchBar).inputValue();
    if (sfSelected !== sfName) {
      await this.genLoc(xpathSearchBar).fill(sfName);
      await this.waitAbit(1000);
      await this.genLoc(`//div[contains(@class,'sb-selection-item')]//div[normalize-space()='${sfName}']`)
        .last()
        .click();
      await this.waitAbit(2000); // đợi hiển thị các entity của sf mới
    }
  }

  /**
   * fill Number of contents  ( popup Full-site translation - Cost calculator )
   * @param language
   */
  async fillNumberOfContents(text: string) {
    await this.page.locator(this.xpathLD.pricing.inputCostCalculator).click();
    await this.page.locator(this.xpathLD.pricing.inputCostCalculator).clear();
    await this.page.locator(this.xpathLD.pricing.inputCostCalculator).fill(text);
    await this.page.locator(this.xpathLD.pricing.totalPrice).click();
    await this.page.waitForTimeout(2 * 1000); //wait Total price
  }

  /**
   * wait for translation to complete after add language
   */
  async waitForTranslationToCompleteAfterAddLanguage() {
    let noOfInProgressBadge = await this.genLoc(this.xpathLD.badge("In progress")).count();
    while (noOfInProgressBadge !== 0) {
      await this.page.waitForTimeout(10 * 1000);
      await this.page.reload();
      await this.page.waitForLoadState("networkidle");
      await this.page.waitForTimeout(2 * 1000); //wait for page stable
      noOfInProgressBadge = await this.genLoc(this.xpathLD.badge("In progress")).count();
    }
  }
}
