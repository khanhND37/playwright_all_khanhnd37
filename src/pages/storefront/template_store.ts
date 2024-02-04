import { expect, Page } from "@playwright/test";
import { AccountPage } from "@pages/dashboard/accounts";
import { pressControl } from "@utils/keyboard";
import { uploadImgPreview } from "tests/modules/dashboard/onlinestore/website_builder/save_as_template/util";

import { ConfigStore } from "@types";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();

export class TemplateStorePage extends WebBuilder {
  constructor(page: Page) {
    super(page);
  }

  baseUrl = {
    dev: "https://templates-next.dev.shopbase.net",
    prodtest: "https://templates-test.shopbase.com",
    prod: "https://templates.shopbase.com",
  };
  xpathAddNewPage = `//button[normalize-space()='Add new page']`;
  xapthCreateCustomLayout = `//button[@class="s-button create-custom-layout is-default"]`;
  xpathNumberOfTemplates = `//*[contains(@class, 'total-template')] | //span[contains(@class, 'library-templates__head__count')]`;
  xpathNumberOfLibraries = "//span[contains(@class, 'library-templates__head__count')]";
  xpathSellingTypeList = `sb-choose-template__empty`;
  xpathTemplateTagList = `//div[contains(@class, 'template__tags')]`;
  xpathTemplateList = `//div[contains(@class, 'sb-choose-template__templates')]`;
  xpathEmpty = `//div[contains(@class, 'items-center sb-choose-template__empty')]`;
  xpathOnlineStore = `//li[contains(@class, 'online-store')]`;
  xpathBrowseTemplates = `//span[contains(text(),'Browse templates')]`;
  xpathYourTemplates = `//span[normalize-space() = 'Your templates']`;
  xpathRemoveTag = `//div[contains(@class, 'sb-tag__icon')]`;
  xpathSellingTypeDesktop = `//div[@id="list-selling-type"]//button[normalize-space()="sellingtype"]`;
  xpathSellingTypeMobile = `//div[@class = "sb-flex list-selling-type" and not (@id="list-selling-type")]//span[normalize-space()='sellingtype']`;
  xpathAllBtn = `//div[@id="list-selling-type"]//span[normalize-space()='All']`;
  xpathFetching = `//div[@class="library-templates--fetching"]`;
  xpathFilterBy = `//*[normalize-space()="Filter by:"]`;
  xpathClosePopup = `//button[contains(@class, "choose-template-v2__close-btn")]`;
  xpathLoading = `//*[@class="sb-skeleton--item"]`;
  xpathTemplateStoreHeading = `//p[contains(@class, 'sb-choose-template-v2__heading')]`;
  xpathChangeTemplateBtn = `//button[@name="Change template"]`;
  xpathPopupAddTemplate = "//div[contains(@class,'sb-popup__container')]";
  xpathBtnApplyInPreview = "//button[normalize-space()='Apply']";
  xpathOTP = `//input[@placeholder="Enter OTP number"]`;
  xpathConfirmBtn = `//span[@class='text-white' and normalize-space()='Confirm']`;
  dotSecondSlideshow = ".slideshow__pagination button>>nth=1";
  activeDot = "[class$=active]";
  dataSearchFilter = ".sb-choose-template-v2__body div>>nth=0";

  xpaths = {
    heading: "//*[contains(@class, 'sb-choose-template-v2__heading')]",
    figure: templateName => `//img[@alt='${templateName}']//parent::figure`,
    buttons: {
      login: "//*[contains(@class, 'header__desktop')]//*[normalize-space()= 'Login']",
      applyTemplate: templateName => `//img[@alt = '${templateName}']//following-sibling::figcaption//button`,
    },
    loading: "//div[contains(@class,'loading-screen')]",
    popupAddToStore: {
      container: "//div[contains(@class, 'sb-popup__container')]",
      radioOption: {
        anExistingStore: "//span[contains(text(), 'An existing store')]",
        aNewStore: "//span[contains(text(), 'A new store')]",
      },
      buttons: {
        addTemplate:
          "//button[contains(@class, 'sb-button--primary') and contains(@class, 'sb-popup__footer-button') and contains(normalize-space(), 'Add template')]",
      },
    },
    pageScreen: {
      loading: "//div[contains(@class, 'sb-skeleton__table')]",
      table: {
        row: "//tr[contains(@class, 'row-page-list')]",
      },
    },
    designScreen: {
      customizeButton: "//button[normalize-space()='Customize']",
    },
    webBuilder: {
      colorSetting: "//div[@data-tab='web']//label[contains(@class, 'sb-text-caption') and normalize-space()='Colors']",
      fontSetting: "//div[@data-tab='web']//label[contains(@class, 'sb-text-caption') and normalize-space()='Fonts']",
    },
  };

  cssSelector = {
    menuSidebar: ".nav-sidebar",
    pageScreen: {
      table: {
        pageName: `.type-container--spacing-tight a`,
        pageHandle: `.type-container--spacing-tight .page-url`,
      },
    },
  };
  xpathTitleWebsiteTemplate = "(//div[contains(@class,'sb-choose-template-v2__header')]//p)[1]";
  xpathPopupReplaceFooter =
    "//div[contains(@class,'sb-confirm-add-template')]//div[contains(@class,'sb-popup__container')]";
  xpathApplyBtnOnReplaceFooterModal =
    "//div[contains(@class,'sb-confirm-add-template')]//span[normalize-space()='Apply']";
  xpathSpinner = ".sb-spinner";

  xpathPopupChooseStoreInput = ".sb-popup-choose-store .sb-input__input";
  xpathPopupChooseStoreAddTemplateBtn =
    "//div[contains(@class, 'sb-popup-choose-store')]//button[normalize-space()='Add template']";

  templateSearchInputSelector = ".sb-choose-template-v2__filter__search input";
  templateModalCloseBtnSelector = ".modal-save-as-template .sb-popup__header-close";

  /***
   * Select dropdown shop type or template type in template store
   * @param type
   * @param data
   */
  async selectDropdown(type: "shopType" | "templateType", data: string) {
    const indexType = type == "shopType" ? 1 : 2;
    await this.page.locator(`(//button[contains(@class,'sb-choose-template__library-btn')])[${indexType}]`).click();
    await this.page
      .locator(`//div[contains(@class,'sb-choose-template-filter__libraries')]//div[normalize-space() = '${data}']`)
      .click();
    const waitLoad = await this.page.waitForSelector(".templates .sb-choose-template__templates");
    await waitLoad.waitForElementState("stable");
  }

  /***
   * Search template store
   * @param dataSearch
   */
  async searchTemplate(dataSearch: string) {
    await this.page
      .locator(
        "(//div[contains(@class,'sb-choose-template-v2__filter')])[2]//span[contains(@class, 'sb-input__prefix')]",
      )
      .click();
    await pressControl(this.page, "A");
    await this.page.keyboard.press("Backspace");
    await this.page
      .locator(
        "(//div[contains(@class,'sb-choose-template-v2__filter')])[2]//span[contains(@class, 'sb-input__prefix')]",
      )
      .type(dataSearch);
  }

  /***
   * Search template store (new UI)
   * @param dataSearch
   */
  async searchTemplateNewUI(dataSearch: string, device: "desktop" | "mobile" | "wrapper") {
    await this.page
      .locator(
        `//div[contains(@class, 'sb-choose-template-v2__filter--${device}')]//span[contains(@class, 'sb-input__prefix')]`,
      )
      .click();
    await pressControl(this.page, "A");
    await this.page.keyboard.press("Backspace");
    await this.page
      .locator(`//div[contains(@class, 'sb-choose-template-v2__filter--${device}')]//input`)
      .type(dataSearch);
  }

  /***
   * Close search box (new UI)
   * @param dataSearch
   */
  async deleteValueAndCloseSearchBox(device: "desktop" | "mobile" | "wrapper") {
    await this.page
      .locator(
        `//div[contains(@class, 'sb-choose-template-v2__filter--${device}')]//span[contains(@class, 'sb-input__suffix') and not (@style="display: none;")]`,
      )
      .click();
    await this.page.waitForSelector(this.xpathFetching, { state: "hidden" });
  }

  /***
   * Preview template store
   * @param nameTemplate
   */
  async previewTemplate(nameTemplate: string) {
    await this.page.locator(`(//img[@alt = "${nameTemplate}"])[1]//parent::figure`).hover();
    await this.page.locator(`(//img[@alt = "${nameTemplate}"])[1]//following-sibling::figcaption//a`).click();
    await this.page.waitForResponse(
      response => response.url().includes("/apps/assets/locales") && response.status() == 200,
    );
  }

  /***
   * Apply template store
   * @param templateName
   */
  async applyTemplate(templateName: string) {
    await this.genLoc(this.xpaths.figure(templateName)).hover();
    await this.genLoc(this.xpaths.buttons.applyTemplate(templateName)).first().click();
    await this.waitNetworkIdleWithoutThrow();
  }

  /**
   * Apply template by index of template
   * @param index Index of template
   */
  async applyTemplateByIndex(index: number) {
    await this.page.locator(`(//div[@class='sb-choose-template__template']//img)[${index}]`).hover();
    await this.page
      .locator(`(//div[@class='sb-choose-template__template']//img//following-sibling::figcaption//button)[${index}]`)
      .first()
      .click();
    await this.waitNetworkIdleWithoutThrow();
  }

  /***
   * Change color in preview template store
   * @param color
   */
  async changeColor(color: string) {
    await this.page.locator("#__layout .template-preview__dropdown>>nth=0").click();
    await this.page.locator(`(//div[normalize-space() = '${color}'])[1]`).click();
  }

  /***
   * Change font in preview template store
   * @param font
   */
  async changeFont(font: string) {
    await this.page.locator("#__layout .template-preview__dropdown>>nth=1").click();
    await this.page.locator(`(//div[normalize-space() = '${font}'])[1]`).click();
  }

  /***
   * Login in template store
   * @param email
   * @param password
   * @param link
   */
  async loginTemplateStore(email: string, password: string, link: string) {
    const accountPage = new AccountPage(this.page, link);
    await accountPage.login({
      email: email,
      password: password,
      redirectToAdmin: false,
    });
    await this.waitNetworkIdleWithoutThrow();
  }

  /***
   * Choose store in template store
   * @param store
   */
  async addStore(store: string) {
    await this.page.locator("//*[@placeholder='Choose a store']").fill(store);
    await this.page.waitForLoadState("load");
    await this.page.locator(`//*[contains(@class,'sb-selection-item__label')]`).click();
    await this.page
      .locator("//button[contains(@class,'sb-popup__footer-button') and normalize-space() = 'Add template']")
      .click();
    await this.page.waitForLoadState("load");
  }

  async switchDevice(device: "Desktop" | "Mobile") {
    const xpath =
      device === "Desktop"
        ? "(//*[contains(@class,'sb-device-toggle-items')]//*[contains(@class,'device-toggle-item')])[1]"
        : "(//*[contains(@class,'sb-device-toggle-items')]//*[contains(@class,'device-toggle-item')])[2]";
    await this.page.locator(xpath).click();
  }

  /***
   * Search page template
   * @param dataSearch
   */
  async searchPageTemplate(dataSearch: string) {
    await this.page.locator("#filtersEl").getByRole("img").first().click();
    await pressControl(this.page, "A");
    await this.page.keyboard.press("Backspace");
    await this.page.getByPlaceholder('Try "Pets, .."').fill(dataSearch);
  }

  /**
   * Verify các option có hiển thị trên dropdown
   * @param options
   */
  async isDropdownItemsVisible(options: string[]): Promise<boolean> {
    let result: boolean;
    for (const option of options) {
      const xpath = `//*[@data-select-label="${option}"]`;
      result = await this.isElementExisted(xpath);
      if (result == false) {
        break;
      }
    }
    return result;
  }

  /**
   * Kiểm tra các phần tử trong mảng có chứa ký tự được chỉ định hay không (không phân biệt hoa thường)
   * @param options
   */
  async isArrayItemContainText(list: string[], text: string): Promise<boolean> {
    let result: boolean;
    for (const item of list) {
      if (item.toLowerCase().includes(text.toLowerCase())) {
        result = true;
        break;
      }
    }
    return result;
  }

  getXpathMenu(menuName: string): string {
    return (
      `(//ul[contains(@class,'menu') or contains(@class,'active treeview-menu') or contains(@class,'nav-sidebar')]` +
      `//li` +
      `//*[text()[normalize-space()='${menuName}']]` +
      `//ancestor::a` +
      `|(//span[following-sibling::*[normalize-space()='${menuName}']]//ancestor::a))[1]`
    );
  }

  /**
   * Navigate to menu in dashboard
   * @param menu:  menu name
   * */
  async navigateToMenu(menu: string): Promise<void> {
    await this.waitUtilNotificationIconAppear();
    const menuXpath = this.getXpathMenu(menu);
    await this.page.locator(menuXpath).click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * wait notification icon visible
   */
  async waitUtilNotificationIconAppear() {
    await this.page.waitForSelector(".icon-in-app-notification");
  }

  /**
   * get number of templates
   */
  async getNumberOfTemplates(page: Page): Promise<number> {
    const noResult = page.locator(".sb-choose-template__empty");
    if (await noResult.isVisible()) {
      return 0;
    }
    let noOfTemplatesMatch = 0;
    const allNumberOfTemplates = await page.locator(this.xpathNumberOfTemplates).all();
    for (const item of allNumberOfTemplates) {
      noOfTemplatesMatch += Number((await item.innerText()).split(" ")[0]);
    }
    return noOfTemplatesMatch;
  }

  /**
   * get number of libraries
   */
  async getNumberOfLibraries(page: Page): Promise<number> {
    const noResult = page.locator(".sb-choose-template__empty");
    if (await noResult.isVisible()) {
      return 0;
    }
    let noOfTemplatesMatch = 0;
    const allNumberOfTemplates = await page.locator(this.xpathNumberOfLibraries).all();
    for (const item of allNumberOfTemplates) {
      noOfTemplatesMatch += Number((await item.innerText()).split(" ")[0]);
    }
    return noOfTemplatesMatch;
  }

  /**
   * get number of templates for each library
   */
  async getTemplateNumberOfShopLib(page: Page, libraryTitle: string): Promise<number> {
    const xpathTemplateNumber = `//h3[normalize-space()='${libraryTitle}']//following-sibling::span`;
    const noOfTemplates = Number((await page.locator(xpathTemplateNumber).innerText()).split(" ")[0]);
    return noOfTemplates;
  }

  /**
   * get text of first tag
   */
  async getTextOfTag(page: Page, selectorListTag: string, index: number): Promise<string> {
    const xpathListTag = `(${selectorListTag}//div[contains(@class, 'sb-mb-small sb-pointer')])[${index}]`;
    const textTag = await page.locator(xpathListTag).innerText();
    return textTag;
  }

  /***
   * Choose store in template store
   * @param store
   */
  async addNewStore(store: string, conf: ConfigStore): Promise<void> {
    await this.page.getByText("A new store").click();
    await this.page.getByPlaceholder("Enter store name").fill(store);
    await this.page
      .locator("//button[contains(@class,'sb-popup__footer-button') and normalize-space() = 'Add template']")
      .click();
    await this.page.waitForLoadState("networkidle");
    await this.page.locator(`//button[normalize-space()='Create']`).click();
    await this.page.waitForTimeout(3 * 1000);
    try {
      await this.genLoc(`//*[@class = 'sbase-spinner']`).waitFor({ state: "hidden" });
    } catch (error) {
      await this.genLoc(`//button[contains(@class, 'close')]`).click();
      await this.genLoc(`//button[normalize-space()='Create']`).click();
    }

    //Select country
    await this.page.getByRole("textbox", { name: "Select Store country" }).click();
    await this.page.getByRole("textbox", { name: "Select Store country" }).fill(conf.store_coutry);
    await this.page.getByText(conf.store_coutry).first().click();
    //Select location
    await this.page.getByRole("textbox", { name: "Select personal location" }).click();
    await this.page.getByRole("textbox", { name: "Select personal location" }).fill(conf.per_location);
    await this.page.getByText(conf.per_location).nth(1).click();

    await this.page.locator('input[type="text"]').nth(2).click();
    await this.page.getByText(conf.code).click();
    await this.genLoc(`//input[@id="phone-number"]`).fill(conf.phone_number);
    await this.genLoc(`//button[normalize-space()='Next']//span`).click();
    await this.page.waitForTimeout(2 * 1000);
    await this.genLoc(`//li[normalize-space()="${conf.business_type}"]`).click();
    const isRevenueSelectionVisible = await this.genLoc(`//h3[contains(text(), 'monthly revenue')]`).isVisible();
    if (isRevenueSelectionVisible === true) {
      await this.genLoc(`//li[normalize-space()="${conf.monthly_revenue}"]`).click();
      await this.genLoc(`//button/span[normalize-space()="Next"]`).click();
    }
    await this.page.waitForTimeout(3 * 1000);
    // chọn platform nếu step trước chọn business_type là PrintBase/General Dropshipping/Niche Dropshipping
    const isTitleChoosePlatformVisible = await this.genLoc("//div[@class='survey-step-title']").isVisible();
    if (isTitleChoosePlatformVisible) {
      await this.genLoc(`//span[normalize-space()="${conf.platform}"]`).click();
    }
    try {
      await this.waitResponseWithUrl("/signup/complete-survey", 7000);
    } catch {
      await this.page.getByRole("combobox").first().selectOption({ index: 1 });
      await this.page.getByRole("combobox").nth(1).selectOption({ index: 1 });
      await this.genLoc("//button[normalize-space()='Take me to my store']").click();
    }
  }

  /**
   * On/off toggle
   * @param page
   * @param templateId
   * @param isOn
   */
  async switchToggleActiveTemplate(page: Page, templateId: string, isOn: boolean): Promise<void> {
    const toggleLoc = page.locator(
      `//*[contains(text(),'${templateId}')]//ancestor::div[@class="card-template__info"]//input[@type="checkbox"]`,
    );
    const currentValue = await toggleLoc.getAttribute("value");
    if (currentValue !== `${isOn}`) {
      await page
        .locator(
          `//*[contains(text(),'${templateId}')]//ancestor::div[@class="card-template__info"]//input[@type="checkbox"]//parent::span`,
        )
        .click({ delay: 300 });
      if (isOn === true) {
        await page.locator(`//button[normalize-space()='Activate template']`).click();
      } else {
        await page.locator(`//button[normalize-space()='Deactivate template']`).click();
      }
      await expect(async () => {
        return expect(toggleLoc).toHaveAttribute("value", `${isOn}`);
      }).toPass({ timeout: 10000 });
    }
  }

  /***
   * Add a new template by template Id
   * @param templateId
   */
  async addWebBaseTemplate(page: Page, templateId: string): Promise<void> {
    await page.getByRole("button", { name: "Add template" }).click();
    await page.getByPlaceholder("Enter Web Template ID, Eg: 314832").fill(templateId);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await this.switchToggleActiveTemplate(page, templateId, true);
  }

  /***
   * Edit template
   * @param store
   */
  async editTemplate(
    page: Page,
    templateId: string,
    sellingType: string,
    industry: string,
    labelImage: string,
    image: string,
  ) {
    await page
      .locator(
        `//*[contains(text(),'${templateId}')]//ancestor::div[@class="card-template__info"]//div[contains(@class, 'info--actions')]`,
      )
      .click();
    await page
      .getByRole("tooltip", { name: /Edit info/i })
      .getByText("Edit info")
      .click();
    await this.page.waitForLoadState("networkidle");
    const isThumbnailImageVisible = await this.genLoc("#modal-save-as-template img").isVisible();
    if (isThumbnailImageVisible === true) {
      await this.genLoc("#modal-save-as-template img").hover();
      await this.genLoc(".sb-flex > span > .sb-button").click();
    }
    await uploadImgPreview(page, labelImage, image);
    if (await page.getByPlaceholder("Selling type").isVisible()) {
      await page.getByPlaceholder("Selling type").click();
      await page.getByText(sellingType).nth(1).click();
      await page.locator(".sb-popup__footer-container").click();
    }
    if (await page.getByPlaceholder("Industry").isVisible()) {
      await page.getByPlaceholder("Industry").click();
      await page.getByText(industry).nth(1).click();
      await page.locator(".sb-popup__footer-container").click();
    }
    await page.getByRole("button", { name: "Save", exact: true }).click();
  }

  async clickViewStore(page: Page): Promise<Page> {
    const [newTab] = await Promise.all([
      page.waitForEvent("popup"),
      await page.locator("button", { hasText: "View your store" }).click(),
    ]);
    return newTab;
  }

  async openTemplateStore(url: string) {
    await this.page.goto(url);
    await this.waitNetworkIdleWithoutThrow();
  }

  async gotoPageList() {
    await this.navigateToMenu("Pages");
    await this.waitNetworkIdleWithoutThrow();
  }

  /**
   * Get list page on /admin/pages screen
   * Result will be return in object with map handle => page_name
   */
  async getListPages(): Promise<Record<string, string>> {
    const count = await this.genLoc(this.xpaths.pageScreen.table.row).count();

    const result: Record<string, string> = {};
    for (let i = 0; i < count; i++) {
      const pageName = await this.genLoc(this.cssSelector.pageScreen.table.pageName).nth(i).innerText();
      const pageUrl = await this.genLoc(this.cssSelector.pageScreen.table.pageHandle).nth(i).innerText();

      result[pageUrl.trim().replace("/pages/", "")] = pageName.trim();
    }

    return result;
  }

  /**
   * Customize public theme of shop
   * This function will open web builder
   */
  async customizePublicTheme() {
    await this.page.getByRole("button", { name: "Customize" }).first().click();
    await this.loadingScreen.waitFor();
    try {
      await this.loadingScreen.waitFor({ state: "hidden" });
      await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await this.page.locator('button[name="Pages"]').click();
    } catch (e) {
      logger.info(`Got error when customize theme, reload page now`);
      logger.info(e);

      await this.page.reload();
      this.waitForElementVisibleThenInvisible(".w-builder__loading-screen");
      await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await this.page.locator('button[name="Pages"]').click();
    }
  }

  /**
   * Open color setting on Web builder sidebar panel
   */
  async openColorSetting() {
    await this.clickBtnNavigationBar("styling");
    await this.switchTabWebPageStyle("Web");
    await this.genLoc(this.xpaths.webBuilder.colorSetting).click();
  }

  /**
   * Open font setting on Web builder sidebar panel
   */
  async openFontSetting() {
    await this.clickBtnNavigationBar("styling");
    await this.switchTabWebPageStyle("Web");
    await this.genLoc(this.xpaths.webBuilder.fontSetting).click();
  }

  getProductNameXpath(productName: string) {
    return this.page.locator(`//div[normalize-space()='${productName}' and @class="product-name"]`);
  }

  /**
   * Return template's name by index of template
   * @param index index of template
   * @returns
   */
  async getTemplateNameByIndex(index: number): Promise<string> {
    return (
      await this.page.locator(`(//div[contains(@class,'sb-choose-template__wrap')]//p)[${index}]`).textContent()
    ).trim();
  }
}
