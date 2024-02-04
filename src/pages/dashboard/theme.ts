import { Page } from "@playwright/test";
import { DashboardPage } from "./dashboard";

export class ThemeDashboard extends DashboardPage {
  frameLocator = this.genFrame("#preview");
  xpathTabSetting = "//div[contains(@id,'tab-navigation')]//div[text()='Settings']";
  colorPickerPopover = ".sb-popover__popper:not([style*='display: none;']) [aria-label='Color Picker']";
  sectionLinkPopover = "[id='popover_select_section_link']:not([style*='display: none;'])";
  tooltipContent = ".sb-tooltip:not([style*='display: none;']) .sb-tooltip__content div";
  titleEditor = ".theme-editor-v2__title-text";
  checkboxCustomize = "input[name='Customize']";
  spanCheckboxThemeSetting = "span[for='Settings by theme settings']";
  widgetColorPrimary = "[data-key='color_primary']";
  widgetColorBgButton = "[data-key='color_background_button']";
  widgetColorMenuTextHover = "[data-key='color_main_menu_text_hover']";
  widgetButtonLink = "[label='Button link']";
  iconExpandSelector = "[type='header'] [id$='/Right']";
  referenceExpandSelector = "[type='header'] [slot='reference']";
  iconUnSync = "[id$='/Unlink']";
  iconUnSyncColor = ".sb-color-picker__link-icon";
  allSectionIgnoreApp =
    "[data-section-label]:not([data-section-label*='Best']):not([data-section-label*='Recently']):not([data-section-label*='Cart'])";
  xpathBtnSave = "(//button[normalize-space()='Save'])[1]";
  iframe = "preview";
  previewContent = "body[data-sf]";
  checkboxContainer = this.genLoc(".theme-editor-v2__input-checkbox");
  checkbox = this.checkboxContainer.locator(".sb-checkbox");
  collectionSort = this.genLoc(".collection-select--item select");
  switchDeviceBtn = this.genLoc("[data-action=device]").getByRole("button");
  mobileIcon = this.genLoc("[id$=Mobile]");
  desktopIcon = this.genLoc("[id$=Desktop]");
  leftFilters = this.frameLocator.locator(".collection-left-filters");
  onTopFilters = this.frameLocator
    .locator(".row.mb4")
    .filter({ has: this.page.getByRole("heading", { name: "Filters" }) });
  drawerFiltersBtn = this.frameLocator.locator(".collection-select--item.select-filter");
  inDrawerFilters = this.frameLocator.locator("div.filter-drawer__container");
  headerBar = this.genLoc(".theme-editor-v2__header");
  saveBtn = this.headerBar.getByRole("button", { name: "Save" });
  collectionSection = this.frameLocator.locator("[data-id='collection_page']");
  productsInCollection = this.frameLocator.locator("div.product-col");
  previewSection = this.genLoc(".sb-form-item").filter({ hasText: "Preview" });
  previewSearchBox = this.previewSection.getByRole("textbox");
  previewTags = this.previewSection.locator(".sb-tag");
  removeTagIcon = ".sb-tag__icon";
  popoverAuto = this.genLoc("#popover_autocomplete__preview-item");
  navigationPagesBtn = this.genLoc(".theme-editor-v2__navigation-pages").getByRole("button");
  selectPagesDropdown = this.genLoc("#select_theme_editor_navigation_pages_multi");
  colorSwatches = this.genLoc(".filter-options--color-swatches").locator("label.s-checkbox");
  xIcon = ".filter-drawer-icon-close";
  spinner = this.genLoc(".theme-editor-v2__preview-overlay").locator(".sb-spinner");
  xpathIconLoading = "//span[contains(@class,'sb-button--loading-dots')]";
  smartOptimize = `//div[contains(text(),'Smart Optimize')]/parent::div/following-sibling::div//div//input`;

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Get selector in select link in popover
   * @param id
   * @param label
   * @returns
   */
  getSelectorLinkPopover(id: string) {
    return `[id='${id}']:not([style*='display: none;'])`;
  }

  /**
   * Open theme editor
   * @param id
   * @param page
   */
  async openThemeEditor(id: number, page = "product") {
    await this.page.goto(`https://${this.domain}/admin/theme-editor-next/${id}?page=${page}`);
    try {
      await this.page.waitForSelector(".theme-editor-v2__sidebar [data-tab='sections']");
    } catch (error) {
      await this.page.reload({ waitUntil: "networkidle" });
    }
  }

  /**
   * Open section or block
   * @param section
   * @param block
   */
  async openSectionBlock(section: string, block?: string) {
    let element = this.genLoc(`[data-section-label='${section}'] h6`).first();
    if (block) {
      element = this.genLoc(`[data-section-label='${section}'] [data-block-label='${block}']`).first();
    }

    await element.click();
  }

  /**
   * Open setting
   * @param setting
   */
  async openSetting(setting: string) {
    await this.genLoc(".sb-tab-navigation__item div:has-text('Settings')").click();
    await this.page.waitForSelector("[data-tab='settings']", { state: "visible" });
    await this.genLoc(`.theme-editor-v2__new-element span:has-text('${setting}')`).click();
    await this.page.waitForSelector(`.theme-editor-v2__title-text:has-text('${setting}')`, { state: "visible" });
  }

  /**
   * Save theme
   * @param msg
   */
  async saveTheme(msg = "All changes were successfully saved"): Promise<void> {
    await this.genLoc(".sb-button--primary--small").click();
    if (msg) {
      await this.page.waitForSelector(`text=${msg}`);
      await this.page.waitForSelector(`text=${msg}`, { state: "hidden" });
    }
  }

  /**
   * Delete sections from theme
   * @param section
   * @param numberDelete
   */
  async deleteSections(section: string, numberDelete = 1): Promise<void> {
    for (let i = 0; i < numberDelete; i++) {
      await this.genLoc(`[data-section-label='${section}'] .theme-editor-v2__section`).first().click();
      await this.genLoc("[data-action-remove='section']").click();
      await this.genLoc(".sb-popup__container .sb-button--danger--medium").click();
      await this.page.waitForSelector(".sb-popup__container", {
        state: "hidden",
      });
    }
  }

  /**
   * Add sections into theme
   * @param section
   * @param numberAdd
   */
  async addSection(section: string, numberAdd = 1): Promise<void> {
    for (let i = 0; i < numberAdd; i++) {
      await this.genLoc("[data-section-action='add']").click();
      await this.genLoc(`[data-add-element-label='${section}']`).click();
    }
  }

  /**
   * Get section index in theme editor
   * @param section
   */
  async getSectionIndex(section: string): Promise<number> {
    return Number(await this.genLoc(`[data-section-label='${section}']`).first().getAttribute("data-section-index"));
  }

  /**
   * Count number of sections is added into theme
   * @param section
   */
  async countSection(section: string): Promise<number> {
    return await this.genLoc(`[data-section-label='${section}']`).count();
  }

  /**
   * Allowed to add block into theme section
   * @param section
   * @param block
   * @param numberBlock
   */
  async addBlock(section: string, block: string, numberBlock = 1): Promise<void> {
    for (let i = 0; i < numberBlock; i++) {
      await this.genLoc(`data-section-label=${section} [id='Icons/Add-Circle']`).click();
      await this.genLoc(`data-add-element-label=${block} [id='Icons/Add-Circle']`).click();
    }
  }

  /**
   * Delete block from section
   * @param section
   * @param block
   * @param numberBlock
   */
  async deleteBlock(section: string, block: string, numberBlock = 1): Promise<void> {
    for (let i = 0; i < numberBlock; i++) {
      await this.genLoc(`[data-section-label='${section}'] [data-block-label='${block}']`).first().click();
      await this.genLoc("[data-action-remove='block']").click();
    }
  }

  /**
   * Count number of block in section
   * @param section
   * @param block
   */
  async countBlock(section: string, block: string): Promise<number> {
    return await this.genLoc(`[data-section-label='${section}'] [data-block-label='${block}']`).count();
  }

  /**
   * I go to customize theme in dashboard
   */
  async goToCustomizeTheme(domain = "") {
    await this.page.waitForSelector(
      '//header[not(contains(@class, "unite-ui-dashboard__header-mobile"))]//span[contains(@class, "icon-in-app-notification")]',
    );
    if (domain == "") {
      await this.navigateToSubMenu("Online Store", "Design");
      await this.clickOnBtnWithLabel("Customize");
    } else {
      await this.navigateToSubMenu("Online Store", "Storefronts");
      await this.page.click(
        `//div[descendant::a[normalize-space()="${domain}"] and contains(@class,"sb-flex-direction-column")]` +
          `//button[contains(@class,'customize-btn sb-button')]`,
      );
    }
  }

  /**
   * I setting for photo list
   * @param style style of photo list
   */
  async settingForPhotoList(style: string) {
    await this.page.click("//div[contains(@id,'tab-navigation')]//div[text()='Settings']");
    await this.page.click("//div[contains(@id,'theme-editor')]//span[text()='Product']");
    await this.page.waitForSelector("//div[contains(@id,'theme-editor')]//label[normalize-space()='Photo list']");
    const listStyle = await (await this.page.locator("//div[@data-key='photo_list']//button").textContent()).trim();
    if (listStyle != style) {
      await this.page.click("//div[@data-key='photo_list']");
      await this.page.click(`//div[@id='popover_select_photo_list']//label[normalize-space()='${style}']`);
      await this.page.click("//div[contains(@id,'theme-editor')]//button/span[normalize-space()='Save']");
    }
    await this.page.waitForLoadState("networkidle");
    await this.page.click("//div[contains(@id,'theme-editor')]//button/span[normalize-space()='Close']");
  }

  /**
   *
   * @param layout "One page checkout" | "3-step checkout"
   */
  async settingCheckOutPage(layout: string) {
    await this.page.click(
      "//div[contains(@class,'theme-editor-v2__header')]//button[contains(@class,'sb-popover__reference')]",
    );
    await this.page.click("//li[@value='checkout']/label");
    await this.page.click("//h6[normalize-space()='Layout & User Interface']");
    await this.page.click(`//span[@for='${layout}']`);
    await this.clickOnBtnWithLabel("Save");
    await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
  }

  /**
   * @param tippingLayout
   */
  async settingTippingLayout(
    tippingLayout: "Click to show detailed tipping options" | "Always show detailed tipping options",
  ) {
    await this.page.click("//button[contains(@class,'sb-popover__reference')]");
    await this.page.click("//li[@value='checkout']/label");
    await this.page.click("//h6[normalize-space()='Account & Forms']");
    const checkbox = this.page.locator(`//input[@name='${tippingLayout}']`);
    if (await checkbox.isChecked()) {
      return;
    } else {
      await this.page.click(`//span[@for='${tippingLayout}']`);
      await this.clickOnBtnWithLabel("Save");
    }
  }

  /**
   * Click icon sync in input color
   * @param selector
   */
  async onClickIconSync(selector: string) {
    await this.page.locator(`${selector} input`).first().focus();
    await this.page.locator(`${selector} .sb-color-picker__link-icon`).click();
  }

  /**
   * Click customize theme by number order
   * @param numericalOrderOfTheme number order of theme
   */
  async goToCustomizeThemeV3(numericalOrderOfTheme = 1) {
    await this.navigateToSubMenu("Online Store", "Design");
    await this.page.locator(`(//span[contains(text(),'Customize')])[${numericalOrderOfTheme}]`).click();
    await this.page.locator(".w-builder__preview-overlay").waitFor();
    await this.page.locator(".w-builder__preview-overlay").waitFor({ state: "hidden" });
  }

  /**
   * Publish theme by number order of theme
   * @param numericalOrderOfTheme number order of theme
   */
  async publishTheme(numericalOrderOfTheme: number) {
    await this.navigateToSubMenu("Online Store", "Design");
    await this.page.locator(`(//span[contains(text(),'Publish')])[${numericalOrderOfTheme}]`).click();
    await this.page.locator("(//span[contains(text(),'Publish')])[2]").click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Select sort option of collection
   * @param sortValue
   */
  async selectSortCollection(
    sortValue:
      | "Featured"
      | "Newest"
      | "Oldest"
      | "Alphabet, A -> Z"
      | "Alphabet, Z -> A"
      | "Price, Low to high"
      | "Price, High to low",
  ): Promise<void> {
    const value = {
      Featured: "manual",
      Newest: "created:desc",
      Oldest: "created:asc",
      "Alphabet, A -> Z": "name:asc",
      "Alphabet, Z -> A": "name:desc",
      "Price, Low to high": "price:asc",
      "Price, High to low": "price:desc",
    };
    await this.frameLocator.locator(this.collectionSort).selectOption(value[sortValue]);
  }

  /**
   * Set filter position of collection in sidebar
   * @param position
   */
  async setFilterPosition(position: "Left sidebar" | "In drawer" | "On top"): Promise<void> {
    await this.genLoc("[data-key=filter_position]").getByRole("button").click();
    await this.genLoc("#popover_select_filter_position").getByRole("listitem").filter({ hasText: position }).click();
  }

  /**
   * Select preview data
   */
  async selectPreviewSource(data: string): Promise<void> {
    await this.previewSearchBox.fill(data);
    await this.popoverAuto.locator(`[data-select-label="${data}"]`).click();
    await this.previewTags.filter({ hasText: data }).waitFor();
  }

  /**
   * Select pages theme editor
   * @param page
   * @param sub
   */
  async selectPage(page: string, sub = "Default"): Promise<void> {
    await this.navigationPagesBtn.click();
    await this.selectPagesDropdown
      .getByRole("listitem")
      .filter({ has: this.page.getByText(page, { exact: true }) })
      .click();
    if (sub) {
      await this.selectPagesDropdown.getByRole("textbox").fill(sub);
      await this.selectPagesDropdown
        .getByRole("listitem")
        .filter({ has: this.page.getByText(sub, { exact: true }) })
        .click();
    }
  }

  /**
   * Turn on | turn off smart optimize
   * @param mode: on| off
   * @param option: option khi turn off smart optimize :
   * Be able to customize from Smart Optimize version| Revert to your last version
   */
  async settingSmartOptimize(page: string, mode?: string, option?: string): Promise<void> {
    const isOn = mode === "on" ? "true" : "false";
    const status = await this.page
      .locator(`//div[contains(@class,'justify') and descendant::div[normalize-space()='${page}']]//input`)
      .getAttribute("value");
    const xpathSwitchBtn = `//div[contains(@class,'justify') and descendant::div[normalize-space()='${page}']]//span[contains(@class,'sb-switch')]`;
    if ((mode === "on" && status === "false") || (mode === "off" && status === "true")) {
      await this.page.locator(xpathSwitchBtn).click({ delay: 1000 });
      if (page === "Smart Optimize") {
        if (mode === "on") {
          await this.clickOnBtnWithLabel("Got it");
        }
        if (mode === "off") {
          if (option === "Revert to your last version") {
            await this.page.locator("//input[@value='revert']/following-sibling::span").click();
          }
          await this.clickOnBtnWithLabel("Turn off");
        }
        await this.waitUntilElementInvisible(this.xpathIconLoading);
      }
      await this.page.waitForSelector(
        `//div[contains(@class,'justify') and descendant::div[normalize-space()='${page}']]//input[@value='${isOn}']`,
      );
    }
  }
}
