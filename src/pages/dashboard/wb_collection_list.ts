import { WebBuilder } from "@pages/dashboard/web_builder";
import { Page } from "@playwright/test";
import { selector } from "../../../tests/modules/dashboard/onlinestore/website_builder/list_block/collection_list/utils";
import { sortType } from "@types";
import { pressControl } from "@core/utils/keyboard";

export class WebBuilderCollectionList extends WebBuilder {
  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  xpathCL = {
    loadingWb: `//div[contains(@class, 'w-builder__loading-screen')]`,
    sidebar: {
      layout: "//div[@data-widget-id='layout']/div",
      settingList: `//div[contains(@class, 'settings-list')]`,
      dropdownBtnLabel: label => `//div[@label="${label}"]//span[contains(@class, 'button--label')]`,
      optionList: `//ul[contains(@class, 'select__list')]`,
      option: option => `//li[@data-select-label="${option}"]`,
      optionActive: `//ul[contains(@class, 'select__list')]//li[contains(@class, 'active')]//label`,
      selectCollectionBtn: `//a[contains(@class, 'item-list__add-btn')]`,
      searchCollection: `//input[@placeholder="Search collection"]`,
      popupSelectCollection: `//div[contains(@class, 'sb-selection ')]`,
      listCollectionOnPopup: `//div[contains(@class, 'selection-item__label')]//div[contains(@class, 'text-body')]`,
      listCollectionOnSidebar: `//div[@data-widget-id="collection_list"]//p`,
      collectionOnSidebarByName: collectionName =>
        `//div[@data-widget-id="collection_list"]//p[normalize-space()='${collectionName}']`,
      noSearchResult: `//span[normalize-space()='No search results']`,
      closeSearchBtn: `//div[contains(@class, 'list__popover-add__wrap')]//*[@id="Icons/Navigation/Close-(line)"]`,
      checkboxCollection: collectionName =>
        `//div[normalize-space()='${collectionName}']//ancestor::div[contains(@class, 'selection-item ')]//label`,
      drapAndDropIcon: collectionName =>
        `//p[normalize-space()='${collectionName}']//parent::div//following-sibling::div//*[@id="Icons/Drag"]//ancestor::span`,
      deleteIcon: collectionName =>
        `//p[normalize-space()='${collectionName}']//parent::div//following-sibling::div//*[@id="Icons/Trash"]//ancestor::span`,
    },
    collectionName: `//h2[contains(@class, 'text--head')]`,
    blockCollectionList: `//section[@component="collection_all"]`,
  };

  /**
   * If layout is inline ~> need click to open/close layout setting
   * If layout is gird ~> skip
   */
  async toggleLayoutSetting() {
    const sidebarLayout = this.genLoc(this.xpathCL.sidebar.layout);
    const cssClass = await sidebarLayout.getAttribute("class");

    if (cssClass.includes("w-builder__container--grid")) {
      return;
    }
    await this.page.locator(selector.buttonLayout).click();
  }

  /**
   * get list collection on popup select collection
   */
  async getListCollectionOnPopup(): Promise<string[]> {
    const listCollection = [];
    await this.waitUntilElementVisible(this.xpathCL.sidebar.popupSelectCollection);
    const numberOfCollections = await this.genLoc(this.xpathCL.sidebar.listCollectionOnPopup).count();
    for (let i = 0; i < numberOfCollections; i++) {
      const title = await this.genLoc(this.xpathCL.sidebar.listCollectionOnPopup).nth(i).innerText();
      listCollection.push(title);
    }
    return listCollection;
  }

  /**
   * get list collection on sidebar
   */
  async getListCollectionOnSidebar(): Promise<string[]> {
    const listCollection = [];
    const numberOfCollections = await this.genLoc(this.xpathCL.sidebar.listCollectionOnSidebar).count();
    for (let i = 0; i < numberOfCollections; i++) {
      const title = await this.genLoc(this.xpathCL.sidebar.listCollectionOnSidebar).nth(i).innerText();
      listCollection.push(title);
    }
    return listCollection;
  }

  /**
   * search collection on popup select collection
   * @param keyword
   */
  async searchCollectionOnPopup(keyword: string) {
    const isSearchCollectionVisible = await this.genLoc(this.xpathCL.sidebar.searchCollection).isVisible();
    if (!isSearchCollectionVisible) {
      await this.genLoc(this.xpathCL.sidebar.selectCollectionBtn).click();
    }
    await this.genLoc(this.xpathCL.sidebar.searchCollection).click();
    await pressControl(this.page, "A");
    await this.page.keyboard.press("Backspace");
    await this.genLoc(this.xpathCL.sidebar.searchCollection).fill(keyword);
    await this.page.waitForTimeout(1000); //wait for result visible
  }

  /**
   * select collection on popup
   * * @param collectionName
   */
  async selectCollectionOnPopup(collectionName: string) {
    const isSearchCollectionVisible = await this.genLoc(this.xpathCL.sidebar.searchCollection).isVisible();
    if (!isSearchCollectionVisible) {
      await this.genLoc(this.xpathCL.sidebar.selectCollectionBtn).click();
    }
    await this.genLoc(this.xpathCL.sidebar.searchCollection).click();
    await this.waitUntilElementVisible(this.xpathCL.sidebar.popupSelectCollection);
    const isCollectionChecked = await this.genLoc(this.xpathCL.sidebar.checkboxCollection(collectionName))
      .locator(`//input`)
      .isChecked();
    if (!isCollectionChecked) {
      await this.genLoc(this.xpathCL.sidebar.checkboxCollection(collectionName)).locator(`//span`).click();
    }
  }

  /**
   * get list collection on preview WB
   */
  async getListCollectionOnPreviewWB(): Promise<string[]> {
    const listCollection = [];
    await this.frameLocator.locator(this.xpathCL.blockCollectionList).waitFor({ state: "visible" });
    const numberOfCollections = await this.frameLocator.locator(this.xpathCL.collectionName).count();
    for (let i = 0; i < numberOfCollections; i++) {
      const title = await this.frameLocator.locator(this.xpathCL.collectionName).nth(i).innerText();
      listCollection.push(title);
    }
    return listCollection;
  }

  /**
   * get list collection on SF
   */
  async getListCollectionOnSF(page: Page): Promise<string[]> {
    const listCollection = [];
    await page.locator(this.xpathCL.blockCollectionList).waitFor({ state: "visible" });
    const numberOfCollections = await page.locator(this.xpathCL.collectionName).count();
    for (let i = 0; i < numberOfCollections; i++) {
      const title = await page.locator(this.xpathCL.collectionName).nth(i).innerText();
      listCollection.push(title);
    }
    return listCollection;
  }

  /**
   * Choose sort type in WB
   * @param sortType
   * @param tab
   */
  async chooseSortTypeInWB(sortType: sortType) {
    await this.genLoc(this.xpathCL.sidebar.dropdownBtnLabel("Sorting")).click();
    await this.genLoc(this.xpathCL.sidebar.optionList).last().waitFor({ state: "visible" });
    await this.genLoc(this.xpathCL.sidebar.option(sortType)).click();
    await this.page.waitForTimeout(1000); //wait for setting apply
  }

  /**
   * Get label sort type button
   */
  async getLabelSortTypeBtn(): Promise<string> {
    return await this.genLoc(this.xpathCL.sidebar.dropdownBtnLabel("Sorting")).innerText();
  }
}
