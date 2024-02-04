import { DashboardPage } from "@pages/dashboard/dashboard";
import { APIRequestContext, expect, Locator, Page } from "@playwright/test";
import { LibraryTab, SaveAsTemplateInput } from "@types";
import { waitForImageLoaded } from "@utils/theme";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";

export class WbLibrary extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  libraryTabs: Record<LibraryTab, { name: string; position: number; collapsiblePosition?: number }> = {
    "Web templates": {
      name: "Web templates",
      position: 1,
    },
    "Page templates": {
      name: "Page templates",
      position: 2,
    },
    "Section templates": {
      name: "Section templates",
      position: 3,
      collapsiblePosition: 1,
    },
    "Block templates": {
      name: "Block templates",
      position: 4,
      collapsiblePosition: 2,
    },
    Styles: {
      name: "Styles",
      position: 6,
    },
  };

  xpathLib = {
    titleLibrary: `//div[contains(@class, 'title-ellipsis')]`,
    searchBar: "//input[@placeholder='Search template']/parent::div[contains(@class, 'sb-input__body')]",
    searchInput: "//input[@placeholder='Search template']",
    tab: {
      navigationBar:
        "//div[contains(@class, 'sb-tab-navigation--container') and contains(normalize-space(), 'Web templates')]",
      panel: "//div[contains(@class, 'sb-tab-panel')]",
    },
    theme: {
      buttonAction: "//button[contains(@class, 'sb-button--dropdown') and normalize-space()='Actions']",
      actions: {
        saveAsTemplate:
          "//div[not(contains(@id,'page-designs-dropdown'))]//div//li[contains(@class, 'sb-dropdown-menu__item') and normalize-space()='Save as template']",
      },
    },
    popup: {
      saveTemplate: {
        container: "//div[contains(@class, 'sb-popup__container')]",
        saveSuccessMsg:
          "//div[contains(., 'Save') and contains(., 'as a template') and contains(., 'to ') and contains(., ' successfully.')]",
        input: {
          templateName: "//input[@placeholder='Template name']",
          chooseLibrary: "//input[@placeholder='Choose library']",
        },
        activePopover: "//div[starts-with(@id, 'sb-popover') and not(contains(@style, 'display: none'))]",
        footer: {
          saveButton: "//button[contains(@class, 'sb-popup__footer-button') and contains(normalize-space(), 'Save')]",
        },
      },
    },
    listPage: {
      card: "//div[contains(@class, 'card-template ')]",
      badge: "//div[contains(@class, 'card-template ')]//span[contains(@class, 'card-template__badge')]",
      name: "//div[contains(@class, 'card-template ')]//p[contains(@class, 'card-template__info--name')]",
      dnd: "//div[contains(@class, 'card-template ')]//span[contains(@class, 'template-action-drag')]",
      toggle: {
        span: "//div[contains(@class, 'card-template ')]//span[contains(@class, 'sb-switch__switch')]",
        input: "//div[contains(@class, 'card-template ')]//input[@type='checkbox']",
      },
      backButton: "//button[contains(@class, 'sb-btn-back')]",
      badgeJustAdded: (templateName: string) =>
        `//p[contains(., "${templateName}")]/ancestor::div[3]//span[contains(text(),"Just added")]`,
    },
    libraryDetail: {
      moreOptionButton: ".card-template__info--actions button",
      editInfoButton: "//li[contains(text(),'Edit info')]",
      deleteButton: "//li[contains(text(),'Delete')]",
      templateInfo: ".card-template__info--template-id",
      templateName: (name: string) =>
        `//p[contains(@class, 'card-template__info--name') and normalize-space()='${name}']`,
      templateTab: ".sb-tab--inside",
    },
    editInfoPopup: {
      loading: `//div[contains(@class, 'form-loading__input')]`,
      popupSelector: ".sb-popup__container",
      header: ".sb-popup__header h2",
      templateNameField: "//label[contains(., 'Template name')]/ancestor::div[2]//input",
      libraryInputField: "//label[contains(., 'Library')]/ancestor::div[2]//input",
      saveButton: "//div[contains(@class, 'sb-popup__footer')]//span[contains(text(),'Save')]",
      cancelButton: "//button//span[contains(text(), 'Cancel')]",
      warningMessage: "//div[contains(@class, 'sb-form-item__message')]",
      countChar: ".sb-input__counter",
      headerButton: ".sb-popup__header button",
      libraryButton: "(//label[contains(.,'Library')]/ancestor::div[2]//span[contains(@class, 'sb-icon__custom')])[3]",
      addLibraryButton: ".sb-autocomplete__addable-row-plus-icon",
      noLibrarySearch: ".sb-autocomplete__no-results span",
      storeTypeValue: (type: "ecommerce" | "creator") => `//input[@value='${type}']`,
      checkboxStoreType: (type: string) => `//span[contains(text(),'${type}')]/parent::label//span[1]`,
      optionOnDropdown: (option: string) =>
        `//div[contains(@class,'sb-text-body-medium') and normalize-space()='${option}']`,
      imgXpath: (option: "Desktop" | "Thumbnail Library" | "Mobile") =>
        `//p[contains(.,'${option}')]/ancestor::div[2]//img`,
      deleteImageButton: (option: "Desktop" | "Thumbnail Library" | "Mobile") =>
        `//p[contains(.,'${option}')]/ancestor::div[2]//*[local-name()='g' and @id='Icons/Trash']`,
      uploadFileButton: (option: "Desktop" | "Thumbnail Library" | "Mobile") =>
        `//p[contains(.,'${option}')]/ancestor::div[2]//button//span[contains(text(),'Upload file')]`,
      warningUploadImage: (option: "Desktop" | "Thumbnail Library" | "Mobile") =>
        `//p[contains(.,'${option}')]/ancestor::div[2]//p[contains(text(), 'This file exceeds 2MB')]`,
      uploadError: (option: "Desktop" | "Thumbnail Library" | "Mobile") =>
        `//p[contains(.,'${option}')]/ancestor::div[2]//div[@class='upload-error s-p8']`,
      uploadNotMatchSize: (option: "Desktop" | "Thumbnail Library" | "Mobile") =>
        `//p[contains(.,'${option}')]/ancestor::div[2]//p[@class='upload-warning-text']`,
    },
    xpathOnWB: {
      homePagePreview: "//span[contains(@class, 'w-builder__header-title-btn') and normalize-space()='Home']",
      buttonLayer: 'header [name="Layer"]',
      labelSectionName: '[data-widget-id="name"] .w-builder__widget--label',
      inputSectionName: '[data-widget-id="name"] .sb-input__input',
      exitButton: "//button[@name='Exit']",
      sectionNameOnSideBar: "//p[contains(@class, 'w-builder__layer-label--section')",
      stylesTab: "//div[contains(@class, 'sb-tab-panel')] >> nth=-1",
    },
    explorePopup: {
      exploreButton: "//button//span[contains(text(),'Browse templates')]",
      yourTemplatesButton: "//span[contains(.,'Your templates')]",
      applyButton: "//figcaption//button//span[contains(., 'Apply')]",
      toastApplySuccessTemplate: "text=Apply template successfully",
      noSearchResultTemplate: "//div[contains(text(), 'Try search for something else or change the filter.')]",
      closePopupButton: ".sb-choose-template-v2__close-btn",
    },
    deleteTemplatePopup: {
      popupXpath: ".sb-popup__container",
      popupButton: (name: string) => `//button//span[contains(text(), '${name}')]`,
      toastDeleteSuccessfully: "text=Delete template successfully",
    },
  };

  locator = {
    loading: this.genLoc("//div[contains(@class, 'sb-autocomplete--loading-dots')]"),
  };

  getXpathSearchBar(tabPosition): string {
    return `(${this.xpathLib.searchBar})[${tabPosition}]`;
  }

  getLocatorSearchInput(tabPosition): Locator {
    if (tabPosition == 6) {
      return this.genLoc(`(${this.xpathLib.searchInput})`).last();
    } else {
      return this.genLoc(`(${this.xpathLib.searchInput})[${tabPosition}]`);
    }
  }

  getXpathTabPanel(tabPosition): string {
    return `(${this.xpathLib.tab.panel})[${tabPosition}]`;
  }

  getXpathTabItem(tabName: string): string {
    return `//div[contains(@class, 'sb-tab-navigation__item') and contains(normalize-space(), '${tabName}')]//div`;
  }

  getXpathCategory(name: string): string {
    return `//div[contains(@class, 'collapse-item-category')]//p[contains(text(), '${name}')]`;
  }

  getLocatorPopoverSelectItem(itemName: string): Locator {
    return this.genLoc(
      `${this.xpathLib.popup.saveTemplate.activePopover}//div[contains(@class, 'sb-tooltip__reference') and contains(normalize-space(), '${itemName}')]`,
    );
  }

  getLocatorEmptyTab(tabPosition: number): Locator {
    if (tabPosition == 6) {
      return this.genLoc(
        `//div[contains(@class, 'sb-tab-panel')]//p[contains(normalize-space(), 'Could not find any results for')]`,
      ).last();
    } else {
      return this.genLoc(
        `(//div[contains(@class, 'sb-tab-panel')])[${tabPosition}]//p[contains(normalize-space(), 'Could not find any results for')]`,
      );
    }
  }

  getXpathThumbnailImage(templateName: string) {
    return `//p[contains(.,'${templateName}')]/ancestor::div[3]//div[@class='card-template__image--actions']`;
  }

  getXpathActionLocatorOnThumbnailImage(templateName: string) {
    return `${this.getXpathThumbnailImage(templateName)}//p`;
  }

  getLocatorNotEmptyTab(tabPosition: number): Locator {
    if (tabPosition == 6) {
      return this.genLoc(`//div[contains(@class, 'sb-tab-panel')]//div[@class="card-template__info"]`).last();
    } else {
      return this.genLoc(
        `(//div[contains(@class, 'sb-tab-panel')])[${tabPosition}]//div[@class="card-template__info"]`,
      );
    }
  }

  getLocatorOfImageOnExplorePopup(templateName: string): Locator {
    return this.genLoc(`//p[contains(.,'${templateName}')]/ancestor::div[2]//img`);
  }

  getXpathAddedThemeOnList(templateName: string) {
    return `//div[contains(@class,'page-designs__current') and normalize-space()='${templateName}']`;
  }

  getLocatorCustomizeByThemeName(themeName: string): Locator {
    return this.genLoc(`//div[contains(text(), '${themeName}')]/ancestor::div[2]//span[contains(text(),'Customize')]`);
  }

  async editLibrary(name?: string) {
    const xpathEditButton = `//div[contains(@class, 'page-designs__library--item') and contains(normalize-space(), '${name}')]//button[contains(normalize-space(), 'Edit')]`;
    await scrollUntilElementIsVisible({
      page: this.page,
      viewEle: this.genLoc(xpathEditButton),
    });
    await this.genLoc(xpathEditButton).click();
    await this.waitUtilSkeletonDisappear();
  }

  async goToLibraryDetail(libraryId: number) {
    await this.page.goto(`https://${this.domain}/admin/themes/library/${libraryId}`);
    await this.waitUtilSkeletonDisappear();
  }

  async switchToTab(tabName: string) {
    const xpathItem = this.getXpathTabItem(tabName);
    await this.genLoc(xpathItem).click();
  }

  /**
   * input search value and wait for search completed
   * @param keyword: search keyword
   * @param tab: name of tab
   * @param waitForCategoryName: name of category that we wait till it appear
   */
  async inputSearch(keyword: string, tab: LibraryTab) {
    const tabPosition = this.libraryTabs[tab].position;

    await this.getLocatorSearchInput(tabPosition).fill(keyword);
    await this.page.keyboard.press("Enter");
    await this.page.waitForResponse(/templates.json/);
  }

  async saveActiveTemplate(input: SaveAsTemplateInput) {
    await this.genLoc(this.xpathLib.theme.buttonAction).click();
    await this.genLoc(this.xpathLib.theme.actions.saveAsTemplate).click();

    // wait for modal appear
    await expect(this.genLoc(this.xpathLib.popup.saveTemplate.container)).toBeVisible();

    // Input
    await this.genLoc(this.xpathLib.popup.saveTemplate.input.templateName).fill(input.name);
    await this.genLoc(this.xpathLib.popup.saveTemplate.input.chooseLibrary).click();

    // wait popover displayed
    await expect(this.genLoc(this.xpathLib.popup.saveTemplate.activePopover)).toBeVisible();
    await this.getLocatorPopoverSelectItem(input.libraryName).click();

    //set store type
    if (input.storeType) {
      await this.genLoc(`//span[contains(text(),'${input.storeType}')]/parent::label//span[1]`).click();
    }

    //set preview image
    if (input.desktopImagePath) {
      await this.genLoc("//p[contains(.,'Desktop')]/ancestor::div[2]//button").click();
      await this.page.setInputFiles("input[type='file'] >> nth=0", input.desktopImagePath);
      await waitForImageLoaded(this.page, this.xpathLib.editInfoPopup.imgXpath("Desktop"));
    }
    if (input.mobileImagePath) {
      await this.genLoc("//p[contains(.,'Mobile')]/ancestor::div[2]//button").click();
      await this.page.setInputFiles("input[type='file'] >> nth=0", input.mobileImagePath);
      await waitForImageLoaded(this.page, this.xpathLib.editInfoPopup.imgXpath("Mobile"));
    }
    if (input.thumbnailImagePath) {
      await this.genLoc("//p[contains(.,'Thumbnail Library')]/ancestor::div[2]//button").click();
      await this.page.setInputFiles("input[type='file'] >> nth=0", input.thumbnailImagePath);
      await waitForImageLoaded(this.page, this.xpathLib.editInfoPopup.imgXpath("Thumbnail Library"));
    }

    // Save setting
    await this.waitAbit(3000); //image trong popup load cham
    await this.genLoc(this.xpathLib.popup.saveTemplate.footer.saveButton).click();
    await this.page.waitForSelector(this.xpathLib.popup.saveTemplate.saveSuccessMsg, { state: "visible" });
    await this.page.waitForSelector(this.xpathLib.popup.saveTemplate.saveSuccessMsg, { state: "hidden" });
  }

  async clickOnWebTemplateItem(name: string) {
    await this.genLoc(`//p[contains(@class, 'card-template__info--name') and normalize-space()='${name}']`)
      .first()
      .click();
  }

  async getNumberOfItems(name: string) {
    await this.switchToTab(name);
    return await this.genLoc(this.xpathLib.listPage.card).count();
  }

  async hoverOnThumbnailImage(templateName: string) {
    await this.genLoc(this.getXpathThumbnailImage(templateName)).hover();
  }

  async deleteAllTemplateOnLibrary(libraryID: number, domain: string, authRequest: APIRequestContext) {
    const endpoint = `https://${domain}/admin/themes/builder/library/` + `${libraryID}/templates.json?type=theme`;
    const response = await authRequest.delete(endpoint);
    expect(response.ok()).toBeTruthy();
    return response.ok();
  }
}
