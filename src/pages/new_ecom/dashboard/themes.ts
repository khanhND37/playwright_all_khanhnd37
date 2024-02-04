import { SBPage } from "@pages/page";
import { expect } from "@core/fixtures";
import type { LanguageEditor, changeFontColor } from "@types";
import { waitSelector } from "@utils/theme";
import type { UnpublisedTheme } from "./theme";
import type { Page } from "@playwright/test";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OnlineStorePage } from "@pages/dashboard/online_store";

export class ThemeEcom extends SBPage {
  btnBackPreview = ".template-preview__header-left--back";
  listTemplate = ".sb-choose-template__templates";
  templateItem = ".sb-choose-template__template";
  listLibrary = ".sb-choose-template-filter__library";
  btnFilterLib = "(//*[contains(@class,'sb-choose-template__filter')]//button)[1]";
  templatePreview = ".template-preview";
  previewMobile = ".is-mobile";
  contentTemplate = ".template-preview__body";
  btnClosePopup = ".sb-choose-template-v2__close-btn";
  currentTheme = "//*[contains(@class,'page-designs')]//*[contains(@class,'sb-text-body-medium-bold')]";
  popup = "//*[contains(@class, 'sb-popup__container')]";
  txtPopup = ".sb-popup input";
  menuItem = "sb-dropdown-menu__item";
  hideDuplicate = "sb-dropdown-menu__item sb-hide";
  btnPreview = "(//*[contains(@class, 'sb-choose-template__template')]//img)[1]//following-sibling::figcaption//a";
  listAction =
    "//div[not(contains(@style, 'display: none;')) and contains(@class, 'sb-popover__popper')]//li[not(contains(@class,'sb-hide'))]";
  messageCopyTheme = ".sb-alert__title";
  infoTemplate = ".sb-choose-template__info";
  iframePreviewTemplate = "#preview-template";
  btnApplyPreview = "//*[contains(@class,'template-preview__header')]//button[normalize-space() = 'Apply']";
  popupWebsite = ".section-popup + .is-selected";
  currentTagTemplate = ".sb-choose-template__current-tag";
  templateFirst = "(//*[contains(@class,'sb-choose-template__info')])[1]//p";
  listNameTemplate = ".sb-choose-template__info p";
  loadTemplate = "div.sb-skeleton--item";
  switchMobile = ".sb-device-toggle--mobile";

  // Selector in language editor

  loadingtable = "//div[contains(@class,'s-loading-table')]";
  labelDropdown = "#search-section .s-select";
  btnResetToDefault = "//button[normalize-space()='Reset to default']";
  searchText = "#search-section input";
  xpathFieldLastEdit = "//table[contains(@class,'s-table')]//span[normalize-space()='Last Edit']";
  btnDownloadFileLanguage = "//button[ .//a[contains(text(),'Download outside')]]";
  btnUploadFileLanguage = "//button[ .//span[normalize-space()='Upload file']]";
  titleRowPerPage = "//p[normalize-space()='Row per page']";
  btnSelectChangeLangSF = "(//div[contains(@class,'modal-select-currency-language_action')]//button)[2]";
  blockBtn = this.genLoc("[component='button']");
  /***
   * Delete all theme unpublish by api
   * @param token
   */
  async deleteAllThemesUnPublish(token: string): Promise<void> {
    try {
      const options = {
        headers: {
          "X-ShopBase-Access-Token": token,
        },
        params: {},
      };

      const response = await this.page.request.get(`https://${this.domain}/admin/themes.json`, options);

      const setting = await response.json();

      if (!setting.shop_themes.length) {
        return;
      }

      for (const { id, active } of setting.shop_themes) {
        if (!active) {
          await this.deleteTheme(id, token);
        }
      }
    } catch (e) {
      throw new Error(`Error delete all theme unpublished`);
    }
  }

  /***
   * Delete each theme by id
   * @param themeId
   * @param token
   */
  async deleteTheme(themeId: number, token: string): Promise<boolean> {
    try {
      const options = {
        headers: {
          "X-ShopBase-Access-Token": token,
        },
        params: {},
      };
      const response = await this.page.request.delete(`https://${this.domain}/admin/themes/${themeId}.json`, options);

      const { success } = await response.json();
      return success as boolean;
    } catch (e) {
      throw new Error(`Error delete theme`);
    }
  }

  /***
   * Get id theme is web builder or v2
   * @param token
   * @param isV3
   */
  async getIdTheme(token: string, isV3 = true): Promise<{ id: number; name: string }> {
    try {
      const options = {
        headers: {
          "X-ShopBase-Access-Token": token,
        },
        params: {},
      };

      const response = await this.page.request.get(`https://${this.domain}/admin/themes.json`, options);

      const setting = await response.json();
      const isWebBuilder = isV3 ? true : undefined;
      for (const { id, is_web_builder, name } of setting.shop_themes) {
        // eslint-disable-next-line
        if (is_web_builder === isWebBuilder) {
          return { id, name };
        }
      }
    } catch (e) {
      throw new Error(`Error get theme id in shop`);
    }
  }

  /***
   * Get list library active or inactive in shop
   * @param token
   */
  async getListLibrary(token: string): Promise<Array<{ id: number; title: string }>> {
    try {
      const options = {
        headers: {
          "X-ShopBase-Access-Token": token,
        },
        params: {},
      };

      const response = await this.page.request.get(
        `https://${this.domain}/admin/themes/builder/libraries.json?action=all`,
        options,
      );

      const libraries = await response.json();
      return libraries.result.libraries
        .filter(item => item.status == 1)
        .map(obj => {
          return { id: obj.id, title: obj.title };
        });
    } catch (e) {
      throw new Error(`Error get library in shop`);
    }
  }

  /***
   * Get list id website template in library
   * @param token
   * @param id
   * @param storeType
   */
  async getListWebsiteTemplate(
    token: string,
    id: number,
    storeType: "creator" | "ecommerce",
  ): Promise<Array<{ id: number; title: string }>> {
    try {
      const options = {
        headers: {
          "X-ShopBase-Access-Token": token,
        },
        params: {},
      };

      const response = await this.page.request.get(
        `https://${this.domain}/admin/themes/builder/library/${id}.json`,
        options,
      );
      const templates = await response.json();
      return templates.result.themes
        .filter(item => item.status == 1 && item.store_types.includes(storeType))
        .map(obj => {
          return { id: obj.id, title: obj.title };
        });
    } catch (e) {
      throw new Error(`Error get website template in library`);
    }
  }

  /***
   * Select dropdown shop type or template type in website template management
   * @param type
   * @param data
   */
  async selectDropdown(type: "shopType" | "libraryType", data: string) {
    const indexType = type == "shopType" ? 1 : 2;
    await this.page.locator(`(//*[contains(@class,'sb-choose-template__filter')]//button)[${indexType}]`).click();
    await this.page.locator(`//*[contains(@class,'sb-select-menu')]//label[normalize-space() = '${data}']`).click();
    const waitLoad = await this.page.waitForSelector(".sb-choose-template__templates");
    await waitLoad.waitForElementState("stable");
  }

  getDroplistColorFont(index: number) {
    return `.template-preview__dropdown>>nth=${index}`;
  }

  /***
   * Change color in preview template store
   * @param color
   */
  async changeColor(color: string) {
    await this.page.locator(".template-preview__dropdown>>nth=0").click();
    await this.page.locator(`(//div[normalize-space() = '${color}'])[1]`).click();
    await waitSelector(this.page, ".template-preview__dropdown .template-preview__dropdown-text >>nth=0");
  }

  /***
   * Change font in preview template store
   * @param font
   */
  async changeFont(font: string) {
    await this.page.locator(".template-preview__dropdown>>nth=1").click();
    await this.page.locator(`(//div[normalize-space() = '${font}'])[1]`).click();
    await waitSelector(this.page, ".template-preview__dropdown .template-preview__dropdown-text >>nth=1");
  }

  /***
   * Click action in publish or unpublished theme
   * @param nameTheme
   * @param index
   * @param publish
   */
  async clickBtnAction(nameTheme: string, index = 1, publish = true) {
    const unPublish = `(((//*[@class = 'sb-column-layout'])[2]//div[child::div[normalize-space()='${nameTheme}']])[${index}]//following-sibling::div//button)[3]`;
    const isPublish = `(//*[@class = 'sb-column-layout'])[1]//div[child::div[normalize-space()='${nameTheme}']]//following-sibling::div//button[normalize-space()='Actions']`;
    const xpathAction = publish ? isPublish : unPublish;
    await this.page.locator(xpathAction).click();
  }

  /***
   * Select action in manage theme
   * @param action
   * @param nameTheme
   * @param index
   * @param publish
   */
  async selectActionTheme(action: string, nameTheme: string, index = 1, publish = true) {
    await this.clickBtnAction(nameTheme, index, publish);
    await this.page
      .locator(
        `//div[not(contains(@style, 'display: none;')) and contains(@class, 'sb-popover__popper')]//div[normalize-space()='${action}']`,
      )
      .click();
  }

  /***
   * Click button by name
   * @param button
   * @param index
   * @param parent
   */
  async clickBtnByName(button: string, index = 1, parent = "") {
    await this.page.locator(`(${parent}//button[normalize-space() = '${button}'])[${index}]`).click();
  }

  /***
   * Copy theme
   * @param idTheme
   */
  async copyTheme(idTheme: number) {
    await this.clickBtnByName("Copy a template");
    await this.page.locator("[placeholder='Template ID: {id}']").type(idTheme.toString());
    await this.clickBtnByName("Copy template");
  }

  /***
   * Publish theme in manage theme
   * @param name
   * @param id
   * @param index
   */
  async publishTheme(name?: string, id?: number, index = 1) {
    const xpathTheme = name ? name : `Template ID: ${id}`;
    const parent = `((//*[@class = 'sb-column-layout'])[2]//div[child::div[normalize-space()='${xpathTheme}']])[${index}]//following-sibling::div`;
    await this.page.locator(`(${parent}//button)[1]`).click();
    await this.clickBtnByName("Publish", 1, "//*[contains(@class, 'sb-popup__container')]");
  }

  /***
   * Apply template in browse template
   * @param name
   */
  async applyTemplate(name: string) {
    await this.clickBtnByName("Browse templates");
    await this.page
      .locator(
        "//*[contains(@class , 'template__filter')]//*[contains(@class , 'template-filter__search')]//*[contains(@placeholder , 'Try')]",
      )
      .type(name);
    const template = `(//div[child::*[contains(text(), '${name}')]]//preceding-sibling::figure)[1]`;
    await this.page.locator(template).hover();
    await this.page.locator(template + "//button").click();
    await expect(this.page.locator("//*[normalize-space() = 'Apply template successfully']")).toBeVisible();
  }

  /***
   * Aplly template in preview template screen
   * @param name
   * @param change
   */
  async previewApplyTemplate(name: string, change?: changeFontColor) {
    const template = `(//div[child::*[contains(text(), '${name}')]]//preceding-sibling::figure)[1]`;
    await this.page.locator(template).hover();
    await this.page.locator(template + "//a").click();
    await this.page.waitForResponse(
      response => response.url().includes("/apps/assets/locales/") && response.status() === 200,
    );
    if (change) {
      await this.changeColor(change.color);
      await this.changeFont(change.font);
    }
    await this.page.locator(this.btnApplyPreview).click();
    await expect(this.page.locator("(//*[normalize-space() = 'Apply template successfully'])[1]")).toBeVisible();
  }

  getXpathFilterNameLib(titleLib: string) {
    return `//*[contains(@class, 'sb-choose-template-filter__library') and normalize-space() = '${titleLib}']`;
  }

  getXpathTitleTemp(titleTemp: string) {
    return `//*[contains(@class, 'sb-choose-template__info')]//p[normalize-space() = "${titleTemp.trim()}"]`;
  }

  getXpathNameTempApply(name: string) {
    return `((//*[@class = 'sb-column-layout'])[2]//div[child::div[normalize-space()='${name}']])[1]`;
  }

  getXpathCustomizeTheme(name: string, index = 1, isPublish = true) {
    const number = isPublish ? 1 : 2;
    return `((//*[@class = 'sb-column-layout'])[${number}]//div[child::div[normalize-space()='${name}']])[${index}]//following-sibling::div//button[normalize-space() = 'Customize']`;
  }

  getXpathThemeUnpusblish(index = 1) {
    return `(//*[contains(@class,'page-designs__theme')]//*[contains(@class,'sb-text-bold')])[${index}]`;
  }

  getXpathBtnByName(name: string, index = 1) {
    return `(//button[normalize-space()='${name}'])[${index}]`;
  }

  getXpathImageTemp(nthImage = 1) {
    return `.sb-choose-template__template img >> nth=${nthImage}`;
  }

  getXpathByName(name: string, index = 1) {
    return `(//*[normalize-space()='${name}'])[${index}]`;
  }

  getXpathBtnNotDisable(name: string, index = 1) {
    return `(//button[normalize-space()='${name}' and not(contains(@disabled, 'disabled'))])[${index}]`;
  }

  getXpathAction(action: string) {
    return `//div[not(contains(@style, 'display: none;')) and contains(@class, 'sb-popover__popper')]//div[normalize-space()='${action}']`;
  }

  getIdFirstWebsiteTemplate() {
    return `(//*[contains(@class,'page-designs__theme--info')]//*[contains(@class,'sb-text-caption')])[1]`;
  }

  getNameFirstWebsiteTemplate() {
    return `(//*[contains(@class,'page-designs__theme--info')]//*[contains(@class,'page-designs__current')])[1]`;
  }

  getXpathNameThemeUnpublish(name: string) {
    return `((//*[@class = 'sb-column-layout'])[2]//div[child::div[normalize-space()='${name}']])[1]`;
  }

  /**
   * Get all unpusblised theme in list
   * @returns list unpublised theme
   */
  async getListThemeUnpublished(): Promise<UnpublisedTheme[]> {
    const selectorUnpublishedTheme = ".page-designs__theme > div";
    await this.page.waitForSelector(selectorUnpublishedTheme);
    const totalTheme = await this.page.locator(selectorUnpublishedTheme).count();
    const res: UnpublisedTheme[] = [];
    for (let i = 0; i < totalTheme; i++) {
      const theme = this.page.locator(selectorUnpublishedTheme).nth(i);
      const name = await theme.locator(".sb-text-bold").innerText();
      const id = +(await theme.locator("div", { hasText: "Template ID:" }).last().innerText()).split(":").pop().trim();
      const justAdded = (await theme.locator("p", { hasText: "Just added" }).count()) > 0;
      res.push({
        name,
        id,
        justAdded,
      });
    }
    return res;
  }

  /**
   * Click button view your store
   * @returns new tab
   */
  async clickViewStore(): Promise<Page> {
    const [newTab] = await Promise.all([
      this.page.waitForEvent("popup"),
      await this.page.locator("button", { hasText: "View your store" }).click(),
    ]);
    await newTab.waitForResponse(
      response => response.url().includes("/assets/theme.css") && response.status() === 200,
      {
        timeout: 30000,
      },
    );
    return newTab;
  }

  /***
   * Click button Your Template in browser template
   */
  async clickYourTemplate() {
    await this.page.waitForSelector(this.loadTemplate, { state: "visible" });
    await this.page.waitForSelector(this.loadTemplate, { state: "hidden" });
    await this.waitForXpathState(this.listTemplate, "stable");
    await this.clickBtnByName("Your templates");
    await this.waitForXpathState(this.templateItem, "stable");
  }

  /**
   * select Type In Language Editor
   * @param indexDropList
   * @param label
   */
  async selectDropdownInLanguageEditor(indexDropList: number, label: string): Promise<void> {
    const dropItemSectionSearch = "#search-section select";
    await this.genLoc(dropItemSectionSearch).nth(indexDropList).click();
    await this.genLoc(dropItemSectionSearch).nth(indexDropList).selectOption({ label: label });
    await this.waitForElementVisibleThenInvisible(this.loadingtable);
  }

  /**
   * xpath Item Dropdown Search
   * @param indexDropList
   * @returns
   */
  xpathItemDropdownSearch(indexDropList: number): string {
    return `(//section[@id='search-section']//select)[${indexDropList}]//option`;
  }

  /**
   * xpath Item Dropdown Sort
   * @param nameDropdown
   * @returns
   */
  xpathItemDropdownSort(nameDropdown: string): string {
    return `//span[normalize-space()='${nameDropdown}']//following-sibling::div//option`;
  }

  /**
   * xpath Row Per Page
   * @returns
   */
  xpathRowPerPage(): string {
    return `//p[normalize-space()='Row per page']//following-sibling::div//option`;
  }

  /***
   * Get xpath text area Phrase in language editor
   * @param title
   * @param index start = 1
   */
  getXpathPhrase(title: string, index = 1) {
    return `(//td[div[@title='${title}']])[${index}]//following-sibling::td//textarea`;
  }

  /***
   * Get xpath Last Edit in language editor
   * @param title
   * @param index start = 1
   */
  getXpathLastEdit(title: string, index = 1) {
    return `((//td[div[@title='${title}']])[${index}]//following-sibling::td)[2]`;
  }

  /**
   * get All Item Off Dropdown In Language Editor
   * @param indexDropList
   * @param label
   */
  async getAllItemOffDropdown(xpathDropdown: string): Promise<Array<string>> {
    const itemDroplistPage = await this.genLoc(xpathDropdown);
    const listNameValue = await itemDroplistPage.evaluateAll(list => list.map(element => element.textContent.trim()));
    return listNameValue;
  }

  /**
   * click btn Language To Default reset Language
   */
  async resetLanguageToDefault(): Promise<void> {
    if (await this.genLoc(this.btnResetToDefault).isEnabled()) {
      await this.clickOnBtnWithLabel("Reset to default");
      await this.clickOnBtnWithLabel("Continue");
      await this.isToastMsgVisible("Saved successfully");
      await this.waitForElementVisibleThenInvisible(this.loadingtable);
    }
  }

  /**
   * search Filter. Can search by input text and select droplist
   */
  async searchFilter(data: LanguageEditor): Promise<void> {
    if (data.select_language) {
      await this.selectDropdownInLanguageEditor(2, data.select_language);
    }
    if (data.select_type) {
      await this.selectDropdownInLanguageEditor(1, data.select_type);
    }
    if (data.select_page) {
      await this.selectDropdownInLanguageEditor(0, data.select_page);
    }
    if (data.key_search) {
      await this.genLoc(this.searchText).clear();
      await this.genLoc(this.searchText).fill(data.key_search);
      await this.waitForElementVisibleThenInvisible(this.loadingtable);
    }
  }

  /**
   * edit Phrase Language Pack
   * @param key pack want to change
   * @param dataChange data chang
   */
  async editPhraseLanguagePack(key: string, dataChange: string): Promise<void> {
    const xpathLinePack = `(//tr [ .//td[normalize-space()='${key}']])[1]`;
    await scrollUntilElementIsVisible({
      page: this.page,
      scrollEle: this.genLoc(xpathLinePack),
      viewEle: this.genLoc(xpathLinePack),
    });
    await this.genLoc(this.getXpathPhrase(key)).clear();
    await this.genLoc(this.getXpathPhrase(key)).fill("");
    await this.genLoc(this.getXpathPhrase(key)).fill(dataChange);
    await this.genLoc(this.getXpathLastEdit(key)).click();
    await this.clickOnBtnWithLabel("Save");
    await this.isToastMsgVisible("Saved successfully");
    await this.waitForElementVisibleThenInvisible(this.loadingtable);
  }

  /***
   * Add and Public theme v2
   * @param dashboard
   * @param domain
   * @param theme
   */
  async addAndPublicThemeV2(dashboard: DashboardPage, domain: string, theme = "Inside") {
    await dashboard.navigateToMenu("Online Store");
    const onlineStore = new OnlineStorePage(dashboard.page, domain);
    await onlineStore.createNew("Themes", theme);
    const parent = `((//*[@class = 'sb-column-layout'])[2]//div[child::div[normalize-space()='${theme}']])[1]//following-sibling::div`;
    await dashboard.genLoc(`(${parent}//button)[1]`).click();
    await dashboard.clickOnBtnWithLabel("Publish", 2);
  }
}
