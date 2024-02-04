import { Locator, Page } from "@playwright/test";
import { Entity, LanguageDetail } from "./language-detail";
import { TranslationDetailDropListPage, TranslationDetailProductSearchData, TranslationDetailTableData } from "@types";
import { expect } from "@core/fixtures";
import { pressControl } from "@utils/keyboard";
import { OcgLogger } from "@core/logger";

export type entityTranslate = {
  entity?: string;
  page?: string;
  theme?: string;
  pageStatic?: string;
};

type settingTiptap = {
  color?: Color;
  heading?: string;
  style?: string;
  align?: string;
  html?: string;
  bullet?: string;
};

type Color = {
  preset?: number;
  colorPicker?: {
    r?: string;
    g?: string;
    b?: string;
  };
};

const logger = OcgLogger.get();

export class TranslationDetail extends LanguageDetail {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathTD = {
    entityDetailLabel: label => `//span[contains(@class, 'sb-button--label') and (normalize-space()='${label}')]`,
    actionBtn: action =>
      `(//button[contains(@class, 'sb-button')]//span[normalize-space()='${action}' and @class='sb-ml-small'])[1]`,
    entityDropdownBtn: `//div[contains(@class,'edit-language__top__select-entity')]`,
    entityDropdown: `//div[contains(@class,'dropdown-menu ')]`,
    entityOption: entityName =>
      `//div[contains(@class,'selection-item__label ')]//div[contains(@class,'tooltip__reference') and normalize-space()='${entityName}']`,
    pageDropdownBtn: `//div[contains(@class,'edit-language__top__select-theme')]`,
    dropdownAllPagesbtn: `//span[contains(text(),"All pages") and contains(@class,"sb-button--label")]`,
    dropdownbtn: optionName => `//span[contains(text(),"${optionName}") and contains(@class,"sb-button--label")]`,
    pageOption: itemName => `//li[contains(@class,'select-menu__item')]//label[normalize-space()='${itemName}']`,
    pageOptionStatic: itemName => `//li[contains(@class,'menu__item') and (normalize-space()='${itemName}')]`,
    blockTitle: blockName => `//span[contains(@class, 'block-name') and normalize-space()='${blockName}']`,
    blockcontent: blockName =>
      `(//span[contains(@class, 'block-name') and normalize-space()='${blockName}']//ancestor::td//following-sibling::td)[2]//input`,
    blockName: name =>
      `//td[not(contains(@class, "is-hidden"))]//span[@class="block-name"]//span[contains(text(), "${name}")]`,
    sectionName: name =>
      `//div[contains(@class, 'sb-table__fixed')]//td[contains(@class, 'sb-table__group-title')]//div[contains(text(), '${name}')]`,
    loading: `(//div[contains(@class, 'sb-skeleton__settings')])[1]`,
    alertInProgress: language =>
      `//div[normalize-space()='Translating into ${language}. This may take up to 2 minutes']`,
    alertTransSuccess: language => `//div[normalize-space()='Your online store is ready in ${language}']`,
    key: name => `(//tr[contains(@class, 'sb-table__row')]//p[normalize-space()='${name}'])[2]`,
    keyHeader: `(//p[normalize-space()='Key'])[2]`,
    btnResetToDefault: "(//button[normalize-space()='Reset to default'])[1]",
    popupResetToDefault:
      "//div[contains(text(),'Reset to default')]//ancestor::div[contains(@class,'sb-popup__container')]",
    tableTranslation: "//div[contains(@class,'sb-block-item')]//parent::div[@role='tablist']",
    search: `(//div[@role='tablist']//input[@class='sb-input__input'])[1]`,
    alertArea: {
      title: "//div[contains(@class, 'sb-alert__title')]",
      viewStoreBtn: `//div[contains(@class, 'sb-alert__success')]//span[contains(text(), 'View store')]`,
    },
    tiptapEditor: `//div[contains(@class,'flex tiptap__container--toolbar')]`,
    tinymceEditor: `//div[contains(@class,'tox-editor-container')]//div[@class='tox-editor-header']`,
    dropList: {
      page: {
        selector: "//div[contains(@class, 'edit-language__top__select-entity')]",
        group: "//div[contains(@class, 'sb-selection ')]//div[@data-select-label]",
        dropdown: "//button[contains(@class, 'sb-button--dropdown')]",
        activeDropdown: "//div[contains(@id, 'sb-popover') and not(contains(@style, 'display: none'))]",
      },
    },
    topBar: "//div[contains(@class, 'sb-mb-medium edit-language__top')]",
    block: {
      blockName: name =>
        `//td[not(contains(@class, 'is-hidden'))]//span[@class="block-name"]//span[contains(@class, 'text-bold') and contains(text(), '${name}')]`,
      fieldName: name =>
        `//td[not(contains(@class, 'is-hidden'))]//span[@class="block-name"]//span[not(contains(@class, 'text-bold')) and contains(text(), '${name}')]`,
    },
    searchBar: {
      entity: {
        input: entityPlaceholder => `//input[@placeholder='${entityPlaceholder}']`,
        activeSearchPopup: "//div[contains(@id, 'sb-popover') and not(contains(@style, 'display: none'))]",
        searchItem: "//div[@data-select-label]",
        entityLabel:
          "//div[contains(@class, 'sb-selection-item__label')]//span//div[contains(@class, 'sb-tooltip__reference')]",
        entityByName: name => `//div[contains(@class, 'sb-tooltip__reference') and normalize-space()='${name}']`,
      },
      product: {
        input: "//input[@placeholder='Product']",
        activeSearchPopup: "//div[contains(@id, 'sb-popover') and not(contains(@style, 'display: none'))]",
        searchItem: "//div[@data-select-label]",
        productLabel:
          "//div[contains(@class, 'sb-selection-item__label')]//span//div[contains(@class, 'sb-tooltip__reference')]",
        productByName: name => `//div[contains(@class, 'sb-tooltip__reference') and normalize-space()='${name}']`,
      },
      sizeGuide: {
        input: "//input[@placeholder='Size chart']",
        activeSearchPopup: "//div[contains(@id, 'sb-popover') and not(contains(@style, 'display: none'))]",
        searchItem: "//div[@data-select-label]",
        sizeGuideLabel:
          "//div[contains(@class, 'sb-selection-item__label')]//span//div[contains(@class, 'sb-tooltip__reference')]",
        sizeGuideByName: name => `//div[contains(@aria-describedby, 'sb-tooltip') and normalize-space()='${name}']`,
        xpathLoading: `(//span[contains(@class,'sb-autocomplete--loading-dots')])[1]`,
      },
      collection: {
        input: `//input[@placeholder="Collection"]`,
      },
      page: {
        input: `//input[@placeholder="Pages"]`,
      },
      podDescription: {
        input: `//input[@placeholder="Base Product"]`,
      },
      inputOffer: `//input[@placeholder="Offer"]`,
      valueOptionOnDropdown: `//div[contains(@class, "sb-selection-item__thumbnail")]/ancestor::div//div[contains(@class, 'sb-text-body-medium')]`,
      valueSearchResult: value =>
        `//div[contains(@class, "sb-selection-item__thumbnail")]/ancestor::div//div[contains(@class, 'sb-text-body-medium') and contains(text(), '${value}')]`,
      noResult: "//div[contains(@class, 'sb-autocomplete__no-results')]",
    },
    translationTable: {
      heading: {
        languageColumn: languageDefault => `//th[contains(normalize-space(), '${languageDefault}')]`,
        fieldColumn: `//th[contains(normalize-space(), 'Field') and not(contains(@class, 'hidden'))]`,
        blockColumn: `//th[contains(normalize-space(),'Block') and not(contains(@class, 'hidden'))]`,
        fieldColumnByValue: value =>
          `//th[contains(normalize-space(), '${value}') and not(contains(@class, 'hidden'))]`,
        buttonAutoTranslate: "(//th[3]//button[normalize-space()='Auto translate'])[1]",
      },
      bodyRow: "//div[contains(@class, 'sb-table__body-wrapper')]//table[@class='sb-table__body']//tr",
      tooltip: `//div[@role="tooltip" and not(@style[contains(., 'display: none;')])]`,
      sizeGuide: {
        inputText: `(//td[3]//div[contains(@class,'sb-input__body') and descendant::input[@type="text"]])[1]`,
        iconAutoTranslateTinymce: `(//span[contains(@class,'tinymce-tooltip')])[1]`,
        tinymceDescription: `(//div[contains(@role,'application')])[2]`,
        textareaDescriptionInc: `(//div[contains(@class,'language-textarea')])[1]`,
      },
      alertTranslate: text => `//div[contains(@class,"sb-alert__title") and contains(normalize-space(),'${text}')]`,
      body: "//div[contains(@class, 'sb-table__body-wrapper')]",
      iconAutoTranslation: `//td[not(contains(@class, 'is-hidden'))]//span[contains(@class, 'sb-icon__default')]`,
      iconTranslate: rowName =>
        `(//span[contains(text(), '${rowName}')]/ancestor::tr//td[contains(@class, 'sb-table') and not(contains(@class, 'is-hidden'))])[2]//span[@class="sb-flex"]`,
      iconManualTranslation: `//td[contains(@class, 'sb-table') and not(contains(@class, 'is-hidden'))]//*[@id="Icons/Info"]`,
      inputTextBoxWithLabel: rowName =>
        `//span[contains(text(), "${rowName}")]/ancestor::tr//td[contains(@class, "sb-table") and not(contains(@class, "is-hidden"))]//input[not(contains(@disabled,"disabled"))]`,
      inputTextAreaWithLabel: labelName =>
        `(//span[contains(text(), "${labelName}")]/ancestor::tr//td[contains(@class, 'sb-table') and not(contains(@class, 'is-hidden'))]//div[contains(@class,"tox-edit-area")])[2]`,
      iconCloseAlert: `//button[contains(@class,"sb-alert__icon-close")]`,
      icon: `//tr//td[contains(@class, 'sb-table') and not(contains(@class, 'is-hidden'))][2]//span[contains(@class,'sb-tooltip')]`,
      xpathTooltipWithText: text =>
        `//div[@role="tooltip" and not(@style[contains(., 'display: none;')])]//div[normalize-space()="${text}"]`,
      tiptap: {
        dropdownHtml: `//div[contains(@class, 'tiptap__container--toolbar--heading')]//button`,
        colorBtn: `//button[contains(@class, 'tiptap__container--toolbar-color')]`,
        dropdownHeading: `//div[@class="sb-relative"]//button`,
        styleBtn: `//button[contains(@class,"toolbar-group__button")]`,
        styleActiveBtn: `//button[contains(@class,"toolbar-group__button is-active")]`,
        alignBtn: `//span//button[contains(@class,"toolbar-group__button")]`,
        popoverAlign: `//div[contains(@class, 'popover-align sb-scrollbar')]`,
        popoverColor: `//div[contains(@class, 'popover-color sb-scrollbar')]`,
      },
    },
    titleTranslationDetail: `//div[@id="page-header"]//div[contains(@class, 'sb-title-ellipsis')]`,
    activePopup: "//div[contains(@id, 'sb-popover') and not(contains(@style, 'display: none'))]",
    activePopupItem:
      "//div[contains(@id, 'sb-popover') and not(contains(@style, 'display: none'))]//li[contains(@class,'sb-select-menu__item')]",
    saveButton: `//button//span[normalize-space()='Save']`,
    actionBarHeader: `//p[contains(text(), 'You have unsaved changes')]`,
    sectionEditLanguage: `//div[@class="edit-language"]`,
    xpathNotFound: `//*[contains(text(), 'No result found for')]`,
    translatingAlert: `//div[contains(@class, 'sb-alert')]//div[contains(@class, 'sb-alert__title') and contains(text(), 'Translating into')]`,
    closeAlertButton: `//div[contains(@class, 'sb-alert')]//button`,
    autoTranslateButton: `//button[contains(@class, 'sb-button')]//span[normalize-space()='Auto translate' and @class='sb-ml-small'] >> nth=0`,
  };

  xpathSF = {
    upsellWidget: `//section[@component='upsell-widget']`,
    productReviews: `//section[@component='product_reviews']`,
    customerReview: `(//section[contains(@class , 'wb-builder__section')])[6]//section[@component='heading']`,
    addMoreItem: `(//*[@component='add-more-item'])[1]`,
    btnAddCartSticky: "#product_page .sticky__product-quantity button",
    btnAddCart: `(//section[@component='button']//*[contains(@class , 'wb-button--add-cart__container')])[1]`,
    btnBuynow: `(//section[@component='button']//*[contains(@class , 'wb-button--add-cart__container')])[2]`,
    tippingTitle: `//div[contains(@class , 'tipping tipping-wb')]//*[contains(@class , 'section__title')]`,
    checkoutFooterSF: "(//div[@class='main__footer' or contains(@class,'checkout-footer--wb')])[1]",
    descriptionPOD: `//*[@class="custom-code__content"]//p`,
  };

  dropListPages: TranslationDetailDropListPage[] = [
    {
      group: "ALL PAGES CONTENT",
      items: [
        "Header & Footer",
        "Website pages",
        "E-commerce pages",
        "Blog pages",
        "Member pages",
        "System pages",
        "Policy pages",
      ],
    },
    {
      group: "PRODUCTS",
      items: ["Products", "Collections"],
    },
    {
      group: "PAGES",
      items: ["Blogs", "Blog posts", "Page details", "Filter", "Policy"],
    },
    {
      group: "APPS",
      items: ["Boost upsell", "Conversion optimizer"],
    },
    {
      group: "ONLINE STORE",
      items: ["Static content", "Size guide", "POD description template"],
    },
    {
      group: "NOTIFICATIONS",
      items: ["Notifications"],
    },
  ];

  /**
   * Click action button on header
   * @param action: Preview, Auto translate
   */
  async clickActionBtn(action: "Preview" | "View store" | "Auto translate"): Promise<Page> {
    let previewTab = this.page;

    switch (action) {
      case "Preview":
        [previewTab] = await Promise.all([
          this.page.waitForEvent("popup"),
          this.genLoc(this.xpathTD.actionBtn(action)).click(),
        ]);
        break;

      case "View store":
        [previewTab] = await Promise.all([
          this.page.waitForEvent("popup"),
          this.genLoc(this.xpathTD.alertArea.viewStoreBtn).click(),
        ]);
        break;

      default:
        await this.genLocFirst(this.xpathTD.actionBtn(action)).click();
        break;
    }
    return previewTab;
  }

  /**
   * Choose entity from dropdown
   * @param data
   */
  async chooseEntityTranslate(data: entityTranslate) {
    if (data.entity) {
      await this.genLoc(this.xpathTD.entityDropdownBtn).getByRole("button").click();
      await this.genLoc(this.xpathTD.dropList.page.activeDropdown).waitFor({ state: "visible" });
      this.genLoc(this.xpathTD.entityOption(data.entity)).click();
    }

    if (data.page) {
      await this.genLoc(this.xpathTD.pageDropdownBtn).getByRole("button").click();
      await this.genLoc(this.xpathTD.dropList.page.activeDropdown).waitFor({ state: "visible" });
      await this.genLoc(this.xpathTD.pageOption(data.page)).click();
    }
    if (data.theme) {
      await this.genLoc(this.xpathTD.pageDropdownBtn).nth(0).getByRole("button").click();
      await this.genLoc(this.xpathTD.dropList.page.activeDropdown).waitFor({ state: "visible" });
      await this.genLoc(this.xpathTD.pageOptionStatic(data.theme)).click();
    }
    if (data.pageStatic) {
      await this.genLoc(this.xpathTD.pageDropdownBtn).nth(1).getByRole("button").click();
      await this.genLoc(this.xpathTD.dropList.page.activeDropdown).waitFor({ state: "visible" });
      await this.genLoc(this.xpathTD.pageOptionStatic(data.pageStatic)).click();
    }
    await this.genLoc(this.xpathTD.dropList.page.activeDropdown).waitFor({ state: "hidden" });
    await this.genLoc(this.xpathTD.loading).waitFor({ state: "hidden" });
    await this.page.waitForTimeout(2 * 1000); // wait skeleton xuất hiện
  }

  /**
   * Click Reset to default
   */
  async resetKeyToDefault() {
    const btnReset = await this.genLoc(this.xpathBtnWithLabel("Reset to default")).isEnabled();
    if (btnReset) {
      await this.clickOnBtnWithLabel("Reset to default");
      await this.clickOnBtnWithLabel("Continue");
      await this.page.waitForSelector(this.xpathBtnWithLabel("Cancel"), { state: "hidden" });
      await this.isToastMsgVisible("Saved successfully");
      await this.waitForToastMessageHide("Saved successfully");
      await this.genLoc(this.xpathTD.loading).waitFor({ state: "hidden" });
    }
  }

  /*
   * search key in static content
   */
  async searchKey(keySearch: string) {
    await this.page.locator(this.xpathTD.search).click();
    await this.page.locator(this.xpathTD.search).clear();
    await this.page.waitForTimeout(2 * 1000); //wait for search result invisible
    await this.page.locator(this.xpathTD.search).fill(keySearch);
    const xpathLoadingVisible = await this.genLoc(this.xpathTD.searchBar.sizeGuide.xpathLoading).isVisible();
    if (xpathLoadingVisible) {
      await this.genLoc(this.xpathTD.searchBar.sizeGuide.xpathLoading).waitFor({ state: "hidden" });
    }
    await this.page.waitForTimeout(2 * 1000); //wait for search result visible
  }

  /***
   * Get xpath text area Phrase in language editor
   * @param title
   * @param index start = 1
   */
  getXpathPhrase(title: string, index = 1) {
    return `(//p[normalize-space()="${title}"])[${index}]//ancestor::tr//textarea[@placeholder ='No translation available']`;
  }

  getXpathEmptyPhrase(title: string, index = 1) {
    return `(//p[normalize-space()="${title}"])[${index}]//ancestor::tr//textarea[@placeholder ='No translation available' and @title=""]`;
  }

  /**
   * Get xpath
   * @param text
   * @param selector
   * @param index
   */
  getXpathByText(text: string, selector?: string, index = 1) {
    if (selector) {
      return `(${selector}//*[contains(text(),"${text}")])[${index}]`;
    } else return `(//*[contains(text(),"${text}")])[${index}]`;
  }

  /*
   * edit Phrase in static content
   */
  async editPhrase(keyName: string, textEdit: string) {
    await this.page.locator(this.getXpathPhrase(keyName)).clear();
    await this.page.locator(this.getXpathPhrase(keyName)).type(textEdit);
    await this.page.locator(this.xpathTD.keyHeader).click();
  }

  async clickBtnSave() {
    await this.clickOnBtnWithLabel("Save");
    await this.page.waitForSelector("//div[contains(text(),'uccessfully')]", { state: "visible" });
    await this.page.waitForSelector("//div[contains(text(),'uccessfully')]", { state: "hidden" });
    await this.genLoc(this.xpathTD.loading).waitFor({ state: "hidden" });
  }

  /**
   * getDropListPagesOptions: return all pages available in dropdown pages
   */
  async getDropListPagesOptions(): Promise<TranslationDetailDropListPage[]> {
    const response: TranslationDetailDropListPage[] = [];
    // Open droplist
    await this.genLoc(this.xpathTD.dropList.page.dropdown).last().click();

    const listBlock = await this.genLoc(this.xpathTD.dropList.page.activeDropdown)
      .locator(this.xpathTD.dropList.page.group)
      .all();
    for (const block of listBlock) {
      // Get group name
      const groupName = await block.locator("//div[contains(@class, 'sb-selection-group-item ')]").innerText();

      // Get group items
      const groupItemLocs = await block.locator("//div[@aria-describedby]").all();

      const groupItems = [];
      for (const groupItemLoc of groupItemLocs) {
        const itemName = await groupItemLoc.innerText();
        groupItems.push(itemName.trim());
      }

      response.push({
        group: groupName,
        items: groupItems,
      });
    }

    // Close dropdownlist
    await this.clickOnTitle();
    return response;
  }

  /**
   * search product by name
   * @param name Product name
   */
  async searchProduct(name: string) {
    await this.focusOnSearchBar();
    await pressControl(this.page, "A");
    const searchLoc = this.genLoc(this.xpathTD.searchBar.product.input);
    await searchLoc.fill(name);
    await this.waitForResponseIfExist("products.json");
    await this.page.waitForTimeout(2000); // wait for search animation completed
  }

  async focusOnSearchBar() {
    const searchLoc = this.genLoc(this.xpathTD.searchBar.product.input);
    await expect(searchLoc).toBeVisible();
    await searchLoc.focus();
  }

  async getProductSearchResults() {
    const searchBarXpath = this.xpathTD.searchBar.product;
    const searchPopupLoc = this.genLoc(searchBarXpath.activeSearchPopup);
    await expect(searchPopupLoc).toBeVisible();

    const searchResultItems = await searchPopupLoc.locator(searchBarXpath.searchItem).all();

    const result = [];
    for (const searchResultItem of searchResultItems) {
      const productName = await searchResultItem.locator(searchBarXpath.productLabel).innerText();
      result.push(productName.trim());
    }

    return result;
  }

  /**
   * Get entity search result
   */
  async getEntitySearchResults() {
    const searchBarXpath = this.xpathTD.searchBar.entity;
    const searchPopupLoc = this.genLoc(searchBarXpath.activeSearchPopup);
    await expect(searchPopupLoc).toBeVisible();

    const searchResultItems = await searchPopupLoc.locator(searchBarXpath.searchItem).all();

    const result = [];
    for (const searchResultItem of searchResultItems) {
      const entityName = await searchResultItem.locator(searchBarXpath.entityLabel).innerText();
      result.push(entityName.trim());
    }

    return result;
  }

  /**
   * Choose item on search bar
   * @param name
   */
  async chooseItemOnSearchBar(name: string) {
    const itemLoc = this.genLoc(this.xpathTD.searchBar.entity.entityByName(name));
    await expect(itemLoc).toBeVisible();
    await itemLoc.click();
  }

  /**
   * Choose product on search bar
   * @param name
   */
  async chooseProduct(name: string) {
    const productLoc = this.genLoc(this.xpathTD.searchBar.product.productByName(name));
    await expect(productLoc).toBeVisible();

    await productLoc.click();
    await this.page.waitForTimeout(2000); // wait for choose product animation completed
    await expect(this.genLoc(this.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

    await this.waitNetworkIdleWithoutThrow();
  }

  /**
   * Get input type of cell
   * @param cellLoc
   */
  async getInputType(cellLoc: Locator): Promise<"text" | "textarea" | "tiny_mce" | "tiptap"> {
    const isInput = await cellLoc.locator("//input").first().isVisible();
    if (isInput) {
      return "text";
    }

    const isTextarea = await cellLoc.locator("//textarea").first().isVisible();
    if (isTextarea) {
      return "textarea";
    }

    const isTiptap = await cellLoc.locator("//div[contains(@class,'tiptap')]").first().isVisible();
    if (isTiptap) {
      return "tiptap";
    }
    try {
      await cellLoc.locator("//textarea").waitFor({
        state: "attached",
        timeout: 5000,
      });
    } catch (e) {
      logger.info("Not attached");
    }

    return "tiny_mce";
  }

  /**
   * Get translation detail of screen
   */
  async getTranslationDetailData(): Promise<TranslationDetailTableData[]> {
    const data: TranslationDetailTableData[] = [];
    const rows = await this.page.locator(this.xpathTD.translationTable.bodyRow).all();
    logger.info(`Num of row: ${rows.length}`);

    // Using promise.all to improve performance & speed
    const fieldNames = [];
    const locators = [];

    const sourceFieldTypes = [];
    const destinationFieldTypes = [];

    const sourcePromises = [];
    const destinationPromises = [];

    const sourceLocators = [];
    const destinationLocators = [];
    const originIndex = [];

    const indexes = [];

    for (let i = 0; i < rows.length; i++) {
      logger.info(`Processing: ${i}/${rows.length}`);
      const row = rows[i];
      locators.push(row);
      const fieldCol = row.locator("//td").nth(0);
      const sourceCol = row.locator("//td").nth(1);
      sourceLocators.push(sourceCol);
      const desCol = row.locator("//td").nth(2);
      destinationLocators.push(desCol);

      // Special case: row is seperator
      const children = await sourceCol.locator("//div").all();
      if (children.length === 1) {
        // children = 1 mean row is seperator
        continue;
      }

      const fieldName = await fieldCol.locator("//span[@data-id]").textContent();
      fieldNames.push(fieldName);
      originIndex.push(i);

      const sourceFieldType = await this.getInputType(sourceCol);
      sourceFieldTypes.push(sourceFieldType);

      switch (sourceFieldType) {
        case "text":
          sourcePromises.push(sourceCol.locator("//input").first().inputValue());
          break;
        case "tiny_mce":
          sourcePromises.push(sourceCol.frameLocator("//iframe").locator("body").innerHTML());
          break;
        case "textarea":
          sourcePromises.push(sourceCol.locator("//textarea").first().inputValue());
          break;
        case "tiptap": {
          const sourceValue = sourceCol.locator("//div[contains(@class,'tiptap ProseMirror')]").first().textContent();
          const result = sourceValue || "";
          sourcePromises.push(result);
          break;
        }
      }

      const desFieldType = await this.getInputType(desCol);
      destinationFieldTypes.push(desFieldType);

      switch (desFieldType) {
        case "text":
          destinationPromises.push(desCol.locator("//input").first().inputValue());
          break;
        case "textarea":
          destinationPromises.push(desCol.locator("//textarea").first().inputValue());
          break;
        case "tiny_mce":
          destinationPromises.push(desCol.frameLocator("//iframe").locator("body").innerHTML());
          break;
        case "tiptap": {
          const destinationValue = desCol.locator("//div[contains(@class,'tiptap ProseMirror')]").first().textContent();
          const result = destinationValue || "";
          destinationPromises.push(result);
          break;
        }
      }

      indexes.push(i);
    }

    logger.info(`Indexes: ${indexes}`);

    const sourceData = await Promise.all(sourcePromises);
    const destinationData = await Promise.all(destinationPromises);

    for (let i = 0; i < fieldNames.length; i++) {
      // Because we skip some heading row, so we need to get the real index of row in table
      const realIndex = indexes[i];
      data.push({
        index: realIndex,
        field: fieldNames[i],
        locator: locators[originIndex[i]],
        source: {
          locator: sourceLocators[realIndex],
          type: sourceFieldTypes[i],
          value: sourceData[i],
        },
        destination: {
          locator: destinationLocators[realIndex],
          type: destinationFieldTypes[i],
          value: destinationData[i],
        },
      });
    }

    return data;
  }

  /**
   * Fill value to specific input
   * @param value string to fill to input
   * @param fieldType type of input
   * @param valueType type of value
   * @param valueLoc locator of value column
   * @returns void
   */
  async fillToField(
    value: string,
    fieldType: "text" | "tiny_mce" | "tiptap",
    valueType: "text" | "html",
    valueLoc: Locator,
  ) {
    if (fieldType === "text") {
      await valueLoc.locator("//input").click();
      await pressControl(this.page, "A");
      await valueLoc.locator("//input").fill("");
      await valueLoc.locator("//input").fill(value);
      return;
    }

    if (fieldType === "tiny_mce") {
      if (valueType === "text") {
        // text ~> click to body + type
        await valueLoc.frameLocator("//iframe").locator("body").click();
        await pressControl(this.page, "A");
        await valueLoc.frameLocator("//iframe").locator("body").pressSequentially(value);
      } else if (valueType === "html") {
        // Click toolbar code
        await valueLoc.locator("//button[@aria-label='Source code']").click();
        // Fill to popup
        await this.genLoc("//textarea[@class='tox-textarea']").fill(value);
        // Click save
        await this.genLoc("//button[@title='Save']").first().click();
      }
    }

    if (fieldType === "tiptap") {
      await valueLoc.locator("//div[contains(@class,'tiptap ProseMirror')]").click();
      await pressControl(this.page, "A");
      await valueLoc.locator("//div[contains(@class,'tiptap ProseMirror')]").fill(value);
    }
    await this.page.waitForTimeout(2000); // Wait for save bar appear
  }

  /**
   * Fill data to translation detail input
   * @param fillData: data to fill, see type TranslationDetailProductSearchData
   */
  async fillTranslationDetail(fillData: TranslationDetailProductSearchData, dataTable?: TranslationDetailTableData[]) {
    logger.info(`Start fill to field ${fillData.searchCondition.fieldName}`);
    if (!dataTable) {
      dataTable = await this.getTranslationDetailData();
    }

    const filteredData = dataTable.filter(item => {
      if (fillData?.searchCondition?.sourceLanguageValue) {
        return (
          item.field === fillData.searchCondition.fieldName &&
          item.source.value === fillData.searchCondition.sourceLanguageValue
        );
      }

      return item.field === fillData.searchCondition.fieldName;
    });

    logger.info(`Got ${filteredData.length} item`);

    if (!filteredData.length || filteredData.length < fillData.searchCondition.fieldIndex) {
      throw new Error("Not found field");
    }

    const targetRow = filteredData[fillData.searchCondition.fieldIndex || 0];

    await this.fillToField(
      fillData.inputData,
      targetRow.destination.type,
      fillData.inputDataType,
      targetRow.destination.locator,
    );
  }

  async clickDropListPages() {
    await this.genLoc(this.xpathTD.dropList.page.selector).click();
  }

  /**
   * search product by name
   * @param name Product name
   */
  async searchSizeGuide(name: string) {
    const searchLoc = this.genLoc(this.xpathTD.searchBar.sizeGuide.input);
    await expect(searchLoc).toBeVisible();
    await searchLoc.focus();
    await pressControl(this.page, "A");
    await searchLoc.fill(name);
    await this.waitAbit(2000); // đợi hiển thị loading nếu có
    const xpathLoadingVisible = await this.genLoc(this.xpathTD.searchBar.sizeGuide.xpathLoading).isVisible();
    if (xpathLoadingVisible) {
      await this.genLoc(this.xpathTD.searchBar.sizeGuide.xpathLoading).waitFor({ state: "hidden" });
    }
  }

  async getSizeGuideSearchResults() {
    const searchBarXpath = this.xpathTD.searchBar.sizeGuide;
    const searchPopupLoc = this.genLoc(searchBarXpath.activeSearchPopup);
    await this.page.waitForSelector(
      `${searchBarXpath.activeSearchPopup}//div[contains(@class,'sb-autocomplete__selection')]`,
    );

    const searchResultItems = await searchPopupLoc.locator(searchBarXpath.searchItem).all();

    const result = [];
    for (const searchResultItem of searchResultItems) {
      const productName = await searchResultItem.locator(searchBarXpath.sizeGuideLabel).innerText();
      result.push(productName.trim());
    }

    return result;
  }

  /**
   * Choose product on search bar
   * @param name
   */
  async chooseSizeGuide(name: string) {
    const sizeGuideLoc = this.genLoc(this.xpathTD.searchBar.sizeGuide.sizeGuideByName(name));
    await expect(sizeGuideLoc).toBeVisible();
    await sizeGuideLoc.click();
  }

  async getDropListPagesWBOptions() {
    await this.genLoc(this.xpathTD.activePopup).waitFor({ state: "visible" });
    const options = await this.genLoc(this.xpathTD.activePopupItem).all();
    const result = [];
    for (const option of options) {
      const optionName = await option.innerText();
      result.push(optionName.trim());
    }
    return result;
  }

  /**
   * fillTranslationDetails
   * @param fillData array of data want to fill
   */
  async fillTranslationDetails(fillData: TranslationDetailProductSearchData[]) {
    const dataTable = await this.getTranslationDetailData();
    for (const item of fillData) {
      await this.fillTranslationDetail(item, dataTable);
    }
  }

  /**
   * Click on title of translation detail
   */
  async clickOnTitle() {
    await this.genLoc(this.xpathTD.titleTranslationDetail).click();
  }

  async chooseCollection(collectionName: string) {
    await this.page.locator(this.xpathTD.searchBar.collection.input).click();
    await this.page.locator(this.xpathTD.searchBar.collection.input).fill(collectionName);
    await this.page.locator(this.xpathTD.searchBar.valueSearchResult(collectionName)).click();
  }

  async choosePage(pageName: string) {
    const isCloseButtonEnabled = await this.page.locator(this.xpathTD.closeAlertButton).isVisible({
      timeout: 3000,
    });
    if (isCloseButtonEnabled) {
      await this.page.locator(this.xpathTD.closeAlertButton).click();
    }
    await this.page.locator(this.xpathTD.searchBar.page.input).fill(pageName);
    await expect(this.page.locator(this.xpathTD.searchBar.valueOptionOnDropdown).first()).toHaveText(pageName);
    await this.page.locator(this.xpathTD.searchBar.valueOptionOnDropdown).click();
  }

  /**
   * getDropListPagesOptions: return all pages available in dropdown pages
   */
  async getListBlockNames(): Promise<string[]> {
    const rows = await this.page.locator(this.xpathTD.translationTable.bodyRow).all();
    logger.info(`Num of row: ${rows.length}`);

    const fieldNames = [];
    const locators = [];

    for (let i = 0; i < rows.length; i++) {
      logger.info(`Processing: ${i}/${rows.length}`);
      const row = rows[i];
      locators.push(row);
      const fieldCol = row.locator("//td").nth(0);

      const fieldName = await fieldCol.locator("//span[@data-id]").textContent();
      fieldNames.push(fieldName);
    }
    return fieldNames;
  }

  /**
   * Select POD on translation detail screen by name
   * @param podName
   */
  async choosePOD(podName: string) {
    await this.page.locator(this.xpathTD.searchBar.podDescription.input).click();
    await this.page.locator(this.xpathTD.searchBar.podDescription.input).fill(podName);
    await this.page.locator(this.xpathTD.searchBar.valueSearchResult(podName)).click();
  }

  /**
   * Select offer on translation detail screen by name
   * @param offerName
   */
  async chooseOffer(offerName: string) {
    await this.page.locator(this.xpathTD.searchBar.inputOffer).click();
    await this.page.locator(this.xpathTD.searchBar.inputOffer).fill(offerName);
    await this.page.locator(this.xpathTD.searchBar.valueSearchResult(offerName)).click();
  }

  /**
   * get data on table by field name
   * @param offer
   * @param fieldName
   * @param clickAuto
   * @returns
   */
  async getDataOnTableByField(offer: string, fieldName?: string, clickAuto?: boolean) {
    let index = 0;
    await this.chooseOffer(offer);
    if (clickAuto) {
      await this.page.locator(this.xpathTD.autoTranslateButton).click();
      await this.page.waitForSelector(this.xpathTD.translatingAlert, { state: "visible" });
    }
    await this.page.waitForSelector(this.xpathTD.translatingAlert, { state: "hidden" });

    await this.waitAbit(1000); //wait for dashboard apply data
    const dashboardDataTranslated = await this.getTranslationDetailData();
    for (const data of dashboardDataTranslated) {
      if (data.field == fieldName) {
        index = data.index;
        break;
      }
    }
    return {
      source: dashboardDataTranslated[index].source.value,
      destination: dashboardDataTranslated[index].destination.value,
    };
  }

  /**
   * Edit manual translation field
   * @param offer
   * @param inputData
   * @param fieldName
   */
  async editManualTranslation(offer: string, inputData: string, fieldName?: string) {
    fieldName = "Offer's message";
    await this.chooseOffer(offer);
    await this.page.locator(this.xpathTD.translationTable.inputTextBoxWithLabel(fieldName)).click({ delay: 1000 });
    await this.page.locator(this.xpathTD.translationTable.inputTextBoxWithLabel(fieldName)).fill(inputData);

    await this.page.locator(this.xpathTD.translationTable.heading.fieldColumnByValue("English")).click();
    await this.clickBtnSave();
  }

  /**
   * Hàm delete bản dịch trong dashboard
   * @param fieldType
   * @param valueLoc
   */
  async DeleteToField(fieldType: "text" | "tiny_mce" | "tiptap", valueLoc: Locator) {
    if (fieldType === "text") {
      await valueLoc.locator("//input").click();
      await pressControl(this.page, "A");
      await pressControl(this.page, "Backspace");
    }
    if (fieldType === "tiptap") {
      await valueLoc.locator("//div[contains(@class,'tiptap ProseMirror')]").click();
      await pressControl(this.page, "A");
      await pressControl(this.page, "Backspace");
      await this.page.waitForTimeout(1000);
    }
    await this.page.waitForTimeout(1000); // Wait for save bar appear
  }

  /**
   * wait for translation to complete after click button Auto translate
   * @param languageName
   */
  async waitForTranslationToComplete(languageName: string) {
    const isInProgressAlertVisible = await this.genLoc(this.xpathTD.alertInProgress(languageName)).isVisible();
    if (isInProgressAlertVisible) {
      await this.genLoc(this.xpathTD.alertTransSuccess(languageName)).waitFor({ state: "visible", timeout: 180000 });
      await this.page.waitForTimeout(3 * 1000); //wait for translation visible
    }
  }

  /**
   * Return all entities in an array of string
   */
  async getAllEntities(): Promise<Entity[]> {
    let entities = [];
    this.dropListPages.forEach(el => {
      entities = entities.concat(el.items);
    });
    return entities;
  }

  /**
   * Hàm đợi tự động update bản dịch khi có thay dổi content gốc
   * @param retry
   * @param numberIcon
   */
  async waitForTranslationAfterEditContent(retry = 15, selectItem?: string) {
    for (let i = 0; i < retry; i++) {
      let tooltipAutoTranslateCount = 0;
      const numberIcon = await this.genLoc(this.xpathTD.translationTable.icon).count();

      for (let j = 1; j <= numberIcon; j++) {
        await this.genLoc(`(${this.xpathTD.translationTable.icon})[${j}]`).hover();

        // Kiểm tra hiển thị tooltip
        const tooltipAutoTranslateVisible = await this.genLoc(
          this.xpathTD.translationTable.xpathTooltipWithText("This content was automatically translated"),
        ).isVisible();

        if (tooltipAutoTranslateVisible) {
          tooltipAutoTranslateCount++;
        }
      }

      if (tooltipAutoTranslateCount === numberIcon) {
        break;
      } else {
        await this.page.waitForTimeout(10 * 1000);
        await this.page.reload();
        await this.page.waitForSelector(this.xpathBtnWithLabel("Auto translate"));
        if (selectItem) {
          const searchBar = await this.genLoc(this.xpathTD.pageDropdownBtn).locator(`//input`).isVisible();
          if (searchBar) {
            await this.searchKey(selectItem);
            await this.chooseItemOnSearchBar(selectItem);
          } else {
            await this.chooseEntityTranslate({ page: selectItem });
          }
        }
        await this.page.waitForTimeout(2 * 1000); // đợi hiển thị bản dịch, tiptap hay hiển thị chậm
      }
    }
  }

  /**
   * Hàm đợi tự động update bản dịch khi có thay dổi content gốc
   * @param retry
   * @param numberIcon
   */
  async editTiptap(selector: Locator, settingTitpap: settingTiptap) {
    await selector.locator(this.xpathTD.tiptapEditor).waitFor();
    await selector.locator("//div[contains(@class,'tiptap ProseMirror')]").click({ delay: 1000 });
    await pressControl(this.page, "A");

    //Remove all styles
    let activeStyle = await selector.locator(this.xpathTD.translationTable.tiptap.styleActiveBtn).first().isVisible();
    while (activeStyle) {
      await selector.locator(this.xpathTD.translationTable.tiptap.styleActiveBtn).first().click();
      activeStyle = await selector.locator(this.xpathTD.translationTable.tiptap.styleActiveBtn).first().isVisible();
    }

    //Setting style
    if (settingTitpap.color) {
      const color = settingTitpap.color;
      await selector.locator(this.xpathTD.translationTable.tiptap.colorBtn).click({ delay: 1000 });
      if (color.preset) {
        await this.genLoc(this.xpathTD.translationTable.tiptap.popoverColor)
          .last()
          .locator(`//button`)
          .nth(color.preset - 1)
          .click({ delay: 1000 });
      }
      if (color.colorPicker) {
        await this.genLoc(this.xpathTD.translationTable.tiptap.popoverColor)
          .last()
          .locator(`//input`)
          .click({ delay: 1000 });
      }
    }
    if (settingTitpap.heading) {
      await selector.locator(this.xpathTD.translationTable.tiptap.dropdownHeading).click({ delay: 1000 });
      await this.genLoc(`//div[contains(@class, 'select-menu')]`)
        .last()
        .locator(`//label[normalize-space()='${settingTitpap.heading}']`)
        .click({ delay: 1000 });
    }
    if (settingTitpap.style) {
      switch (settingTitpap.style) {
        case "Bold":
          await selector.locator(this.xpathTD.translationTable.tiptap.styleBtn).nth(0).click({ delay: 1000 });
          break;
        case "Italic":
          await selector.locator(this.xpathTD.translationTable.tiptap.styleBtn).nth(1).click({ delay: 1000 });
          break;
        case "Underline":
          await selector.locator(this.xpathTD.translationTable.tiptap.styleBtn).nth(2).click({ delay: 1000 });
          break;
        default:
          await selector.locator(this.xpathTD.translationTable.tiptap.styleBtn).nth(3).click({ delay: 1000 });
          break;
      }
    }
    if (settingTitpap.align) {
      await selector.locator(this.xpathTD.translationTable.tiptap.styleBtn).nth(4).click({ delay: 1000 });
      switch (settingTitpap.align) {
        case "Left":
          await this.genLoc(this.xpathTD.translationTable.tiptap.popoverAlign)
            .last()
            .locator(`//button`)
            .nth(0)
            .click({ delay: 1000 });
          break;
        case "Middle":
          await this.genLoc(this.xpathTD.translationTable.tiptap.popoverAlign)
            .last()
            .locator(`//button`)
            .nth(1)
            .click({ delay: 1000 });
          break;
        default:
          await this.genLoc(this.xpathTD.translationTable.tiptap.popoverAlign)
            .last()
            .locator(`//button`)
            .nth(2)
            .click({ delay: 1000 });
          break;
      }
    }
    if (settingTitpap.bullet) {
      switch (settingTitpap.bullet) {
        case "Bullet":
          await selector.locator(this.xpathTD.translationTable.tiptap.styleBtn).nth(5).click({ delay: 1000 });
          break;
        default:
          await selector.locator(this.xpathTD.translationTable.tiptap.styleBtn).nth(6).click({ delay: 1000 });
          break;
      }
    }
    if (settingTitpap.html) {
      await selector.locator(this.xpathTD.translationTable.tiptap.dropdownHtml).click({ delay: 1000 });
      await this.genLoc(`//div[contains(@class, 'select-menu')]`)
        .last()
        .locator(`//label[normalize-space()='${settingTitpap.html}']`)
        .click({ delay: 1000 });
    }
    await this.clickBtnSave();
  }
}
