import type { actionsTheme } from "@types";
import { DashboardPage } from "./dashboard";
import { Locator } from "@playwright/test";

export class OnlineStorePage extends DashboardPage {
  xpathHeader = "//h1[normalize-space()='Preferences']";
  xpathFavicon = "//div[@class='favicon-preview__box']";
  xpathMenuOnlineStore =
    "//ul[contains(@class,'nav nav-sidebar')]//li[@class='sb-relative menu li-online-store active']";

  xpathMenuDesign = "li.title-child-menu-sidebar > [href='/admin/themes']";
  xpathStoreUrlText = "//div[normalize-space()='Store URL']";
  xpathViewYourStoreButton = "//button//*[self::span[normalize-space()='View your store']]/ancestor::button";
  xpathAccessStoreLink = "//div[contains(text(), 'Your customers can access to your store')]/a";
  xpathShopInitialState = "//*[@id='__INITIAL_STATE__']";
  xpathStoreDomainLabel = ".sb-input__prepend > label";
  xpathStoreNameInput = "input.sb-input__inner-prepend";
  xpathUsernameFormMessage = ".sb-form-item__message";
  xpathBtnSelectPages = ".sb-d-block .sb-button--label";
  btnCreateTemp = ".sb-select-menu .sb-button";
  xpathHeaderPopup = ".sb-popup__header";
  xpathBodyPopup = ".sb-popup__container .sb-text-body-medium";
  btnCancel = ".sb-popup__footer .sb-button--default--medium";
  btnDone = ".sb-popup__footer .sb-button--primary--medium";
  btnDelete = ".sb-popup__footer .sb-button--danger--medium";
  xpathInputTempName = ".sb-mb-medium .sb-input__input";
  xpathTempTitle = "//h6[contains(@class,'theme-editor-v2__template-title')]";
  xpathIconEditTemp = ".theme-editor-v2__preview-item-select--icon-pen";
  xpathIconDeletTemp = ".theme-editor-v2__preview-item-select--icon-delete";
  xpathSelectTempList = ".sb-form-item__content .theme-editor-v2__select";
  xpathbtnAddSection = "[data-section-action= 'add'] .sb-ml-small";
  xpathPopupConfirm = ".sb-text-body-large";
  createUrlRedirectBtn = this.page.getByRole("link", { name: "Create URL redirect" });
  rowRedirectUrl = this.genLoc("tbody").getByRole("row");
  redirectCheckbox = this.page.getByRole("cell").first().getByRole("checkbox");
  redirectFrom = this.page.getByRole("cell").first().getByRole("link");
  redirectTo = this.page.getByRole("cell").last().getByRole("link");
  actionBtn = this.page.getByRole("button", { name: "Action" }).first();
  deleteSelectedBtn = this.genLoc(".s-dropdown-item").filter({ hasText: "Delete selected redirects" });
  xpathCurrentTemplate = `//div[normalize-space()='Current template']//ancestor::div[@class='row']//div[contains(@class,'page-designs__current')]`;
  xpathMoreTemplates = `//div[normalize-space()='More templates']//ancestor::div[@class='row']`;
  xpathFirstThemeInMoreThemes =
    "//div[normalize-space()='Website templates']/following::div/descendant::div[contains(@class, 'page-designs__current')]";
  messageCopyTheme = ".sb-alert__title";
  closePopup = ".sb-popup__header-close span svg";
  btnViewYourStore = "//span[normalize-space()='View your store']";
  fromTextBox = this.genLoc(".s-form-item").filter({ hasText: "Redirect from" }).getByRole("textbox");
  toTextBox = this.genLoc(".s-form-item").filter({ hasText: "Redirect to" }).getByRole("textbox");
  searchBar = this.genLoc(".page-redirects").getByPlaceholder("search");
  loadingResults = this.genLoc(".s-loading-table");
  publishThemeTitle = this.genLoc(`//div[contains(@class,'page-designs__current')]`).first();
  xpathTheme = {
    publishedTheme: templateId => `(//div[@role="tablist"])[1]//div[contains(text(),'${templateId}')]`,
  };

  /*Open Online store in Dashboard */
  async gotoOnlineStore() {
    await this.page.waitForSelector(".unite-ui-dashboard__main .block_overview");
    await this.page.click(".li-online-store a");
  }

  /*Click customize publish theme */
  async clickCustomizePublishTheme() {
    await this.page.click("//button[contains(@class,'sb-button--secondary')]//span[normalize-space()='Customize']");
    await this.page.waitForSelector(".theme-editor-v2__preview-overlay", { state: "detached" });
  }

  /*
    Click save in theme editor
    Verify save successfully
  */
  async verifySave() {
    await this.page.click('.theme-editor-v2__navigation button[data-action="save"]');
    await this.page.waitForSelector('text="All changes were successfully saved"');
  }

  /**
   * Hàm thực hiện các hành động với theme khi click vào nút Actions
   * @param theme Tên theme cần tương tác dành cho more themes
   * @param action Các hành động có trong nút actions
   * @param type 1 giá trị current để hiểu tương tác với current theme
   * @param name Tên khi muốn đổi cho theme (Rename)
   */
  async actionWithThemes(actionInfo: actionsTheme) {
    let actionBtn: Locator;
    const popupCurrent = this.genLoc("[id*=sb-popover][x-placement='bottom-start']:visible");
    const popupMore = this.genLoc(`#page-designs-dropdown:visible`);
    const actionPopup = actionInfo.section ? popupCurrent : popupMore;
    const toastPublishSuccess = this.genLoc("//div[contains(@class, 'sb-toast__message')]").filter({
      hasText: "Publish template successfully",
    });
    if (actionInfo.section) {
      actionBtn = this.page.getByRole("button", { name: "Actions" });
    } else if (actionInfo.themeId) {
      actionBtn = this.genLoc(".page-designs__theme>div")
        .filter({ hasText: actionInfo.themeId.toString() })
        .getByRole("button")
        .filter({ has: this.genLoc("[id$=More]") });
    } else {
      actionBtn = this.genLoc(".page-designs__theme>div")
        .filter({ hasText: actionInfo.themeName })
        .getByRole("button")
        .filter({ has: this.genLoc("[id$=More]") });
    }

    await actionBtn.click();
    switch (actionInfo.action) {
      case "Preview":
      case "Edit language":
      case "Duplicate":
        await popupMore.getByRole("listitem").filter({ hasText: actionInfo.action }).click();
        break;
      case "Publish":
        if (actionInfo.themeId) {
          this.genLoc(".page-designs__theme>div")
            .filter({ hasText: actionInfo.themeId.toString() })
            .getByRole("button")
            .filter({ hasText: "Publish" })
            .click();
        } else {
          this.genLoc(".page-designs__theme>div")
            .filter({ hasText: actionInfo.themeName })
            .getByRole("button")
            .filter({ hasText: "Publish" })
            .click();
        }
        await this.page
          .locator(`//div[contains(@class,'sb-popup__footer-container')]//button[normalize-space()='Publish']`)
          .click();
        await toastPublishSuccess.waitFor();
        await toastPublishSuccess.waitFor({ state: "hidden" });
        break;
      case "Rename": {
        await actionPopup.getByRole("listitem").filter({ hasText: "Rename" }).click();
        if (!actionInfo.rename) {
          throw new Error("Name can't be empty");
        }
        await this.genLoc(".sb-popup__container").getByRole("textbox").fill(actionInfo.rename);
        await this.genLoc(".sb-popup__container").getByRole("button", { name: "Save" }).click();
        break;
      }
      case "Mark as Public":
        await this.genLoc(`#page-designs-dropdown:visible`)
          .getByRole("listitem")
          .filter({ hasText: "Mark as Public" })
          .click();
        await this.genLoc(".sb-popup__container").filter({ hasText: "Mark as Public" }).waitFor();
        await this.genLoc(".sb-popup__container").getByRole("button", { name: "Update" }).click();
        break;
      case "Remove":
        await this.genLoc(`#page-designs-dropdown:visible`).getByRole("listitem").filter({ hasText: "Remove" }).click();
        await this.genLoc(".sb-popup__container").filter({ hasText: "Remove template" }).waitFor();
        await this.genLoc(".sb-popup__container").getByRole("button", { name: "Remove" }).click();
        break;
      default:
        break;
    }
  }

  moreTheme(name: string) {
    return this.page.locator(
      `//div[normalize-space()='More templates']/following::div/child::div[normalize-space()='${name}']`,
    );
  }

  toastMessage(message: string) {
    return this.page.locator(`//div[contains(@class, 's-toast') and normalize-space()='${message}']`);
  }

  /**
   * Hàm tương tác với thanh manage bar (editor) khi preview theme
   * @param action Hành động thực hiện với thanh editor (close, edit home)
   */
  async manageBar(action: "Close" | "Edit" | "Customize") {
    switch (action) {
      case "Close":
        if (await this.page.frameLocator("#manage-bar").locator("//span[contains(@class,'s-icon')]").isVisible()) {
          await this.page.frameLocator("#manage-bar").locator("//span[contains(@class,'s-icon')]").click();
        }
        break;
      case "Edit":
      case "Customize":
        if (this.page.frameLocator("#manage-bar").locator("//a[normalize-space()='Edit homepage']").isVisible()) {
          await this.page.frameLocator("#manage-bar").locator("//a[normalize-space()='Edit homepage']").click();
          await this.page.waitForLoadState("networkidle");
        }
        break;
      default:
        break;
    }
  }

  async copyATheme(id: string) {
    await this.page.locator("(//span[normalize-space()='Copy a template'])[2]").click();
    await this.page.fill("div.sb-popup .sb-input input", id);
    await this.page.locator("//button[normalize-space()='Copy template']").click();
  }

  /**
   * Hàm tạo mới template hoặc theme
   * @param tab Bao gồm 2 tab Templates và Themes khi click nút explore More Templates
   * @param themeTitle: Tên của template, title của theme
   */
  async createNew(tab: string, themeTitle: string) {
    await this.page.getByRole("button", { name: "Add legacy templates" }).click();
    await this.page.click(`//p[normalize-space()='${tab}']`);
    await this.genLoc(".explore-themes-templates__theme")
      .filter({ has: this.page.getByRole("heading", { name: themeTitle }) })
      .click();
    await this.page.click(`//button[normalize-space()='Add ${themeTitle}']`);
  }

  /**
   * Get both current and more theme id by name
   * @param themeName Name of the theme
   */
  async getThemeId(themeName: string): Promise<number> {
    const themeId = await this.page
      .locator(
        `(//*[normalize-space()='${themeName}']/following-sibling::div[contains(@class, 'sb-text-caption')]/div)[1]`,
      )
      .textContent();
    return parseInt(themeId.match(/\d+/)[0]);
  }

  /**
   * Get theme id of just added theme
   */
  async getThemeIdOfJustAddedTheme(): Promise<number> {
    const themeId = await this.page
      .locator(`//div[contains(@class, 'just-added')]//preceding-sibling::div[contains(@class, 'sb-text-caption')]/div`)
      .textContent();
    return parseInt(themeId.match(/\d+/)[0]);
  }

  async getImageCurrentThemeDesktop(): Promise<string> {
    const urlImage = await this.page.getAttribute(
      "(//div[contains(@class,'page-designs__preview-overlay')])[1]//img",
      "src",
    );
    const urlParts = urlImage.split("@");
    return urlParts[urlParts.length - 1];
  }

  /**
   * Racing fn with sleep time
   * @param fn
   * @param ms
   */
  async withPromiseRace<T = void>(fn: Promise<T>, timeout = 10000) {
    const t = (ms: number) => new Promise(resole => setTimeout(resole, ms));
    return Promise.race([fn, t(timeout)]);
  }

  /**
   * Waiting for profile request
   * @param timeout
   */
  async waitForProfileRequest() {
    return this.withPromiseRace(
      this.page.waitForResponse(response => response.url().includes("/admin/setting/profile.json")),
    );
  }

  /**
   * Change store username
   * @param username
   */
  async changeStoreUsername(username: string) {
    await this.page.locator("input.sb-input__inner-prepend").fill(username);
    const btnSaveButton = await this.page.waitForSelector(".sb-button-save");
    await btnSaveButton.click();
    await this.waitForProfileRequest();
  }

  /**
   * Get shop username by domain
   * @param domain
   */
  getShopName(domain: string) {
    const [username] = domain.split(".");
    return username;
  }

  /**
   * Get xpath multiple page
   * @param page
   */
  getXpathMultiplePage(page: string) {
    return `.sb-select-menu [value=${page}] .sb-icon`;
  }

  /**
   * Get xpath field popup Create a template
   * @param index
   */
  getXpathFieldPopup(index: number) {
    return `//div[@class='sb-popup']//div[contains(@class,'sb-form-item')][${index}]//label[contains(@class,'sb-text-body-medium-bold')]`;
  }

  /**
   * Get xpath list template
   * @param index
   */
  getXpathListTemp(index: number) {
    return `//div[contains(@class,'sb-select-menu')]//li[${index}]`;
  }

  /**
   * Get xpath template's name
   * @param name
   */
  getXpathTempName(name: string) {
    return `//div[@id='select_create_template_field_template']//li[normalize-space()='${name}']`;
  }

  /**
   * Get xpath tab navigation
   * @param tab
   */
  getXpathTabNav(tab: "Theme sections" | "Global sections") {
    return `.sb-tab-navigation__item--default div:has-text('${tab}')`;
  }

  /**
   * Get xpath section name
   * @param section
   */
  getXpathSectionName(section: string) {
    return `[data-add-element-label='${section}']`;
  }

  /**
   * get xpath Filter In Navigation
   * @param Filters
   * @returns
   */
  getXpathFilterInNavigation(filters: string) {
    return `//div[contains(@class,'navigation__collection-filter--name') and normalize-space()='${filters}']`;
  }

  /**
   * Hàm click redirect url trong màn URL Redirect Shopbase
   * @param row: thứ tự row muốn click
   * @param position: vị trí click "from" hoặc "to"
   */
  async selectRedirectUrl({ row = 1, position = "from" }: { row?: number; position?: "from" | "to" }): Promise<void> {
    const clickEle =
      position === "from"
        ? this.rowRedirectUrl.nth(row - 1).locator(this.redirectFrom)
        : this.rowRedirectUrl.nth(row - 1).locator(this.redirectTo);
    await clickEle.click();
  }

  /**
   * Hàm tick checkbox
   * @param row
   * @param isOn
   */
  async setCheckboxUrl(row: number, isOn: boolean): Promise<void> {
    const checkbox = this.rowRedirectUrl.nth(row - 1).locator(this.redirectCheckbox);
    await checkbox.setChecked(isOn);
  }

  /**
   * Xoá nhiều rows redirect url
   * @param rows
   */
  async deleteRedirectUrl(rows: number[]): Promise<void> {
    for (const row of rows) {
      await this.setCheckboxUrl(row, true);
    }
    await this.actionBtn.click();
    await this.deleteSelectedBtn.waitFor();
    await this.deleteSelectedBtn.click();
  }

  /**
   * Hàm tạo url redirect
   * @param data
   */
  async createNewUrlRedirect(data: { from: string; to: string }): Promise<void> {
    if (!this.page.url().includes("redirects/new")) {
      await this.createUrlRedirectBtn.click();
    }
    await this.fromTextBox.fill(data.from);
    await this.toTextBox.fill(data.to);
    await this.page.getByRole("button", { name: "Save redirect" }).click();
    await this.toastWithMessage("Your redirect was created").waitFor();
    await this.toastWithMessage("Your redirect was created").waitFor({ state: "hidden" });
  }

  /**
   * Hàm edit url redirect
   * @param fromUrl
   * @param newUrl
   */
  async editUrlRedirect(fromUrl: string, newUrl: { from?: string; to: string }): Promise<void> {
    await this.searchUrlRedirect(fromUrl);
    await this.selectRedirectUrl({});
    if (newUrl.from) {
      await this.fromTextBox.fill(newUrl.from);
    }
    await this.toTextBox.fill(newUrl.to);
    await this.saveChangesBtn.click();
    await this.toastWithMessage("Your redirect was updated").waitFor();
    await this.toastWithMessage("Your redirect was updated").waitFor({ state: "hidden" });
  }

  /**
   * Hàm search url redirect
   * @param url
   */
  async searchUrlRedirect(url: string): Promise<void> {
    await this.searchBar.fill(url);
    await this.page.waitForResponse(/redirects.json/);
  }

  /**
   * Get theme id currenct theme
   */
  async getThemeIdCurrentTheme(): Promise<number> {
    const themeId = await this.page
      .locator(
        `//div[normalize-space()='Current template']//ancestor::div[@class='sb-column-layout']//div[contains(normalize-space(),'Template ID')]`,
      )
      .last()
      .textContent();
    return parseInt(themeId.match(/\d+/)[0]);
  }
}
