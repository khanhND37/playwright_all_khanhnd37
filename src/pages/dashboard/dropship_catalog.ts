import { removeCurrencySymbol } from "@core/utils/string";
import { SBPage } from "@pages/page";
import { expect, Page } from "@playwright/test";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { DashboardAPI } from "@pages/api/dashboard";
import type {
  CleanProductRequest,
  CloneInfo,
  CountryInfo,
  DataInPopUpShipping,
  DataOfProductItemInList,
  FilterCatalog,
  FixtureOdoo,
  ShippingFee,
  ShippingRateResponse,
  SOInfo,
  SupportedCountryData,
  SupportedCountryDataRequest,
} from "@types";
import { OdooService } from "@services/odoo";
import { float } from "aws-sdk/clients/lightsail";
import { convertTimeUS, getHours } from "@core/utils/datetime";
export class DropshipCatalogPage extends SBPage {
  async xpathCheckMessage(text: string) {
    return `(//*[text()[normalize-space()="${text}"]])[1]`;
  }

  xpathFaq = `(//p[descendant::a[contains(@href, 'https://help.shopbase.com/en/article')]])[1]`;
  xpathImgVariant = `//*[contains(@class,'section-image')]//img`;
  xpathStep = `(//*[@class='request-steps__step'])`;
  xpathTitlePopupImport = "//div[contains(@class,'s-animation-content')]//b";
  xpathDesPopupImport = "//div[@class='s-modal-body']//p[@class='sb-mb-small']";
  xpathOptionNotAllowPopupImport = "//div[contains(@class,'form-item')]//span[@for='not-allow']";
  xpathOptionAllowPopupImport = "//div[contains(@class,'form-item')]//span[@for='allow']";
  xpathGeneralSettings = "//a[normalize-space()='General settings']";
  xpathCheckboxSelectAll = "//span[text()='Select all']";
  xpathBtnSelectProductToStore = "//span[contains(text(),'selected products to store')]";
  xpathBtnImportToYourStore = "(//span[normalize-space()='Import to your store'])[1]";
  xpathBtnAddToStore = "//span[normalize-space()='Add to store']";
  xpathWarningTextOnCatalog = "//span[@class='sb-text-caption is-danger']";
  xpathProduct = "//a[contains(@class,'product-review__description')]";
  xpathTimeline = ".sb-timeline";
  xpathShippingRate = ".zone";
  xpathCloseTotalCostPopup = ".sb-popup__header-close";
  xpathShippingDestinationIsUnvailable = `//*[contains(text(), 'Shipping to this destination is unavailable')]`;
  xpathSearchProduct = `//input[contains(@placeholder,'Search by product name')]`;
  xpathBoxReview = `//div[@class='content review-content']`;
  xpathCatalogProductView = "//div[contains(@class,'catalog-products-view__products')]";
  xpathOnboarding = {
    onboardingPopup: {
      skipStep: "//*[normalize-space()='Skip this step']",
    },
  };
  xpathProductRequest = ".plusbase-private-request";

  xpathVariant(variant: string) {
    return `(//span[normalize-space()='${variant}'])[1]`;
  }
  xpathCheckMessageCheckTab(text: string) {
    return `//*[contains(@class,'sb-tab-panel') and not(@style='display: none;') and (//*[text()[normalize-space()="${text}"]])[1]]`;
  }

  xpathVarriantDisable(variant: string) {
    return `(//span[normalize-space()="${variant}"])[2]`;
  }

  //xpath image màn import list
  xpathImgVariantImport(row: number, column: number) {
    return `(//div[contains(@class,'sb-table__body-wrapper')])[1]//tr[${row}]//td[${column}]//img`;
  }

  xpathNameReviewer(name: string) {
    return `//div[@class='sb-selection-group-item' and normalize-space()='${name}']`;
  }

  async clickOnBtnImportList(buttonName: string) {
    await this.genLoc(`//button//span[contains(text(),'${buttonName}')]`).click();
  }

  async selectOptionImportProduct(option: string) {
    await this.genLoc(`//div[contains(@class,'sb-form-item')]//span[@for='${option}']`).click();
  }

  xpathMoqList = `//div[@class='sb-flex moq__list']/div`;

  /**
   * Fill link request product
   * @param url
   */
  async fillLinkRequestProduct(url: string) {
    const xpathAddRequestBtn = this.page.locator(`//button[normalize-space()='Add link']`);
    await this.page.locator(`//div[descendant::*[contains(text(),'Request product link')]]//textarea`).fill(url);
    await xpathAddRequestBtn.click();
  }

  //Send request product successfully
  async sendRequestProduct() {
    this.page.locator(`//button[normalize-space()='Send request']`).click();
    await this.page.waitForSelector(
      `//*[text()='Request was sent successfully. Please wait a few minutes for the request list to be updated.']`,
    );
  }

  /**
   * Go to Catalog page and search product
   * @param productName is name of product that need to search
   */
  async searchAndViewProductCatalog(productName: string) {
    await this.page.goto(`https://${this.domain}/admin/plusbase/catalog`);
    await this.page.waitForLoadState("load");
    await this.page.locator("//input[@type='text' and @placeholder='Search by product name']").fill(productName);
    await this.page.waitForLoadState("load");
  }

  /**
   * Search product in list product
   * @param statusCrawl
   * @param keySearch
   */
  async searchProductInList(statusCrawl: string, keySearch: string) {
    await this.goToProductRequest();
    await this.clickTab(statusCrawl);
    await this.searchWithKeyword(keySearch, true);
  }

  /**
   * go to product detail from Catalog page
   * @param productID is id at Odoo of product
   */
  async goToProductCatalogDetail(productID: string) {
    await this.page.locator(`//a[contains(@href,'/admin/plusbase/catalog/product-detail/${productID}')]`).click();
  }

  /**
   * Search and click view product request detail
   * @param linkRequest is link request product
   */
  async searchAndClickViewRequestDetail(linkRequest: string) {
    await this.page
      .locator(`input[placeholder='Search by product name, request link']:visible`)
      .first()
      .fill(linkRequest);
    await this.waitTabItemLoaded();
    await this.page.locator("div.catalog-products-review__product-review__name:visible").first().click();
    await this.waitForQuotationDetailLoaded();
  }

  async waitForQuotationDetailLoaded() {
    await this.page.waitForSelector(".plusbase-private-request-detail__container__content");
  }

  /**
   * Wait until crawl data from aliexpress success
   * @param status is status crawl data product from aliexpress
   */
  async waitForCrawlSuccess(status: string, opts?: { checkShipping: boolean; shippingErrText?: string }) {
    let i = 0;
    // retry wait
    while (i < 10) {
      const isVisible = await this.page.locator(`//span[normalize-space()='${status}']`).isVisible();
      let hasShipping = true;
      if (opts != undefined && opts.checkShipping) {
        const text = opts.shippingErrText
          ? opts.shippingErrText
          : "Sorry! Shipping to this destination is unavailable.";
        hasShipping = !(await this.page.locator(`//div[contains(text(), '${text}')][1]`).isVisible());
      }

      if (isVisible && hasShipping) {
        break;
      }
      await this.waitAbit(3000);
      await this.page.reload();
      await this.page.waitForLoadState("load");
      i++;
    }
  }

  /**
   * Get product cost by variant
   * @param variantValue is list option value of 1 variant
   */
  async getProductCostByVariant(variantValue: Array<string>): Promise<string> {
    await this.selectVariantByTitle(variantValue);
    const productCost = await this.getTextContent("//div[preceding-sibling::div[contains(text(),'Product cost')]]");
    return removeCurrencySymbol(productCost);
  }

  /**
   * Select variant by title in catalog detail page
   * @param options is list option value of 1 variant
   */
  async selectVariantByTitle(options: Array<string>) {
    options = options.reverse();
    for await (const value of options) {
      if (
        (await this.page.getAttribute(`//button[child::span[normalize-space()='${value}']]`, "class")).includes(
          "sb-button--default",
        )
      ) {
        await this.page.click(`//div[@class='sb-block-item__content']//span[normalize-space()='${value}']`);
      }
    }
  }

  /**
   * Import product to store plusbase
   */
  async importProductToStore() {
    await this.page.locator(`(//div[contains(@class,'sb-image__select')])[1]`).click();
    await this.page.locator(`//span[normalize-space()='Add to store']`).click();
    await this.page.waitForSelector(`//span[text()='Select all']`);
  }

  async selectActionImportProduct(actionName: string) {
    await this.genLoc(`//span[normalize-space()='Actions']`).click();
    await this.genLoc(`//div[contains(@class,'sb-dropdown-menu')]//li[text()='${actionName}']`).click();
  }
  /**
   * Import first product of import list to store
   */
  async importFirstProductToStore() {
    await this.page.locator(`(//button//span[text()[normalize-space()='Add to store']])[1]`).click();
    if (await this.page.locator(`#notification-allow-change-description`).isVisible()) {
      await this.page.locator(`#notification-allow-change-description button:has-text('Save')`).click();
      return;
    }
    await this.page.waitForSelector("//span[contains(text(), 'variant(s) have been added to store')]", {
      timeout: 100000,
    });
  }

  /**
   * Wait first product of import list import successfully
   */
  async waitProductImportSuccess(productName: string) {
    await this.page.waitForSelector(
      `//*[contains(@class, 'successful-card') and descendant::*[contains(text(), '${productName}')]]`,
      { timeout: 60000 },
    );
  }

  /**
   * verify import product to store success
   * @param productName
   */
  async isVisibleProductImportSuccess(productName: string) {
    await this.waitProductImportSuccess(productName);
    return await this.page
      .locator(`//*[contains(@class, 'successful-card') and descendant::*[contains(text(), '${productName}')]]`)
      .isVisible();
  }

  /**
   * Retry product preferences
   * @param shopDomain
   */
  async updateSettingProductPreferences(shopDomain: string, accessToken: string) {
    const response = await this.page.request.put(
      `https://${shopDomain}/admin/setting/product-preferences.json?force_retry=true&access_token=${accessToken}`,
      {
        data: {
          is_allow_staff_change_description: false,
          need_show_notification_allow_staff_change_description: false,
        },
      },
    );
    expect(response.status()).toBe(200);
  }

  /**
   * calculator selling price in SO detail
   * @param productCost
   * @returns selling Pice
   */
  async calculatorSellingPrice(productCost: float) {
    await this.page.waitForLoadState("load");
    const sellingPice = Math.trunc(productCost * 3);
    return (sellingPice + 0.99).toString();
  }

  /**
   * calculator shipping ali fee
   * @param shippingFee float
   * @returns shipping fee ali
   */
  calculatorShippingAliFee(shippingFee: float) {
    const fee = Math.ceil(shippingFee);
    return fee + 0.99;
  }

  /**
   * calculate compare at price
   * @param sellingPice
   * @returns
   */
  async calculatorCompareAtPrice(sellingPice: string) {
    const compareAtPrice = parseFloat(sellingPice) * 1.3;
    return compareAtPrice.toFixed(2);
  }

  /**
   * get selling price in SO detail
   * @returns selling price
   */
  async getSellingPrice() {
    const xpathPrice = "//div[text()[normalize-space()='Selling price']]/following-sibling::div";
    const sellingPice = await this.getTextContent(xpathPrice);
    return removeCurrencySymbol(sellingPice);
  }

  /**
   * search product in catalog page
   * @param productName
   */
  async searchProductcatalog(productName: string) {
    await this.page.waitForLoadState("load");
    await this.genLoc(this.xpathSearchProduct).fill(productName);
    await this.genLoc(this.xpathSearchProduct).press("Enter");
    await this.page.waitForSelector("//div[contains(@class,'catalog-products-view__products')]");
  }

  /**
   * product result after search product in catalog
   * @param productName
   * @returns locator of product
   */
  async productSearchResult(productName: string) {
    return this.page.locator(`//*[text()[normalize-space()='${productName}']]`);
  }

  /**
   * Get product cost in SO detail
   * @returns product cost
   */
  async getProductCost(index = 1) {
    const xpathProductCost = `(//div[text()[normalize-space()='Product cost']]/parent::div/following-sibling::div/div)[${index}]`;
    await (await this.page.waitForSelector(xpathProductCost)).click();
    const productCostText = await this.getTextContent(xpathProductCost);

    return parseFloat(removeCurrencySymbol(productCostText));
  }

  /**
   * Get product cost in SO detail
   * @returns product cost
   */
  async getProductCostBeforeSentSO(): Promise<number> {
    const xpathProductCost =
      "//div[preceding-sibling::div[contains(text(),'Product cost') and contains(@class,'title')]]";
    await (await this.page.waitForSelector(xpathProductCost)).click();
    const productCostText = await this.getTextContent(xpathProductCost);
    return parseFloat(removeCurrencySymbol(productCostText));
  }

  /**
   * Get profit margin in SO detail
   * @returns profit margin
   */
  async getProfitMargin() {
    const xpathProfitMargin = "//div[text()[normalize-space()='Profit margin']]/following-sibling::div";
    const profitMarginText = await this.getTextContent(xpathProfitMargin);
    return parseFloat(removeCurrencySymbol(profitMarginText));
  }

  /**
   * Calculator total cost in SO detail
   * @param shippingFee
   * @param productCost
   * @returns total cost
   */
  async calculatorTotalCost(shippingFee: number, productCost: number) {
    const totalCost = productCost + shippingFee;
    return totalCost.toFixed(2);
  }

  /**
   * get total cost
   * @returns total cost
   */
  async getTotalCost() {
    const xpathTotalCost = "//div[@class='fixed-amount-total-cost']";
    const totalCostText = await this.getTextContent(xpathTotalCost);
    return parseFloat(removeCurrencySymbol(totalCostText)).toFixed(2);
  }

  /**
   * Choose country to ship
   * @param country
   */
  async chooseShipToCountry(country: string) {
    const xpathCountryDroplist =
      "(//div[text()[normalize-space()='Ship to']]/parent::div//button)|(//div[text()[normalize-space()='Ship to']]/parent::div//input)";
    await this.page.locator(xpathCountryDroplist).click();
    const xpathCountryShipTo = `(//div[parent::span and not(@style='display: none;') and  normalize-space()='${country}'])|(//li[normalize-space()='${country}'])`;
    await this.page.locator(xpathCountryShipTo).click();
  }

  /**
   * count total variant
   * @param productName
   * @returns total variant
   */
  async countVariants(productName: string) {
    // eslint-disable-next-line max-len
    const xpath = `(//div[contains(@class,'card') and descendant::input[contains(@placeholder,'${productName}')]]//table)[4]//tr`;
    const total = await this.page.locator(xpath).count();
    return total;
  }

  /**
   * click link text see detail in SO detail
   */
  async clickSeeDetail(index = 1) {
    await this.page.locator(`(//span[text()[normalize-space()='See details']])[${index}]`).click();
  }

  /**
   * click close popup detail
   */
  async clickClosePopup() {
    await this.page.locator("//span[parent::button[contains(@class,'sb-popup__header-close')]]").click();
  }

  /**
   * click button Import to your store
   */
  async clickBtnImportToStore() {
    await this.page
      .locator("//span[normalize-space(text())='Import to your store' or normalize-space(text())='Add to store']")
      .click();
    await this.page.waitForLoadState("load");
  }

  /**
   * get data tab pricing in import list page
   * @param productName
   * @param row
   * @param column
   * @param typeTag
   * @returns data
   */
  async getDataInTabPricing(productName: string, row: number, column: number, typeTag: string) {
    // eslint-disable-next-line max-len
    const xpathPricingCell = `(//div[contains(@class,'card') and descendant::input[contains(@placeholder,'${productName}')]]//table)[4]//tr[${row}]/td[${column}]//${typeTag}`;
    let data;
    if (typeTag === "input") {
      data = await (await this.page.locator(xpathPricingCell).inputValue()).trim();
      return removeCurrencySymbol(data);
    } else {
      data = await this.getTextContent(xpathPricingCell);
      return removeCurrencySymbol(data);
    }
  }

  /**
   * click tab pricing in import list page
   * @param productName
   */
  async clickTabPricing(productName: string) {
    await this.page
      .locator(
        // eslint-disable-next-line max-len
        `//input[@placeholder='${productName}']//ancestor::div[@class='sb-card__body']//*[normalize-space(text())='Pricing']`,
      )
      .click();
    await this.page.waitForSelector("//*[normalize-space(text())='Shipping method']");
  }

  /**
   * Get column name
   * @param index
   * @returns column name
   */
  async getTextColumnName(index: number) {
    const xpath = `(//div[@class='sb-popup modal-catalog-shipping']//table/thead//th)[${index}]/div[1]`;
    const columnName = await this.getTextContent(xpath);
    return columnName;
  }

  /**
   * get data in table
   * @param index
   * @returns data
   */
  async getDataPopup(index: number) {
    const xpath = `(//div[@class='sb-popup modal-catalog-shipping']//table/tbody//td)[${index}]`;
    const data = await this.getTextContent(xpath);
    return data;
  }

  /**
   * count shipping method after click see detail
   * @returns count of shipping method
   */
  async countShipingInPopup(): Promise<number> {
    const xpath = `//table/tbody/tr`;
    return await this.genLoc(xpath).count();
  }

  /**
   * get shipping method after click see detail
   * @param index
   * @returns shipping method
   */
  async getShipingInPopup(row: number, column: number) {
    const xpath = `//table/tbody/tr[${row}]/td[${column}]`;
    const data = await this.getTextContent(xpath);
    return data;
  }

  /**
   * get shipping information in SO detail
   * @param index
   * @returns shipping time, shipping method
   */
  async getShipping(index: number) {
    const xpath = `(//div[contains(@class,'shipping-rate-box__content')]/div/div)[${index}]`;
    const shippingInfor = await this.getTextContent(xpath);
    return shippingInfor;
  }

  /**
   * get shipping cost in popup detail
   * @param lineship
   * @param index
   * @returns shipping cost
   */
  async getShippingCostInPopUp(lineship: number, index: number) {
    const xpath = `(//div[@class='sb-popup modal-catalog-shipping']//table/tbody//td)[${lineship}]/div/div[${index}]`;
    const shippingCost = await this.getTextContent(xpath);
    return shippingCost;
  }

  /**
   * get text note in popup when click see detail
   * @param index
   * @returns text note
   */
  async getTextNote(index: number) {
    const xpath = `//div[text()[normalize-space()='Note']]/following-sibling::div/div[${index}]`;
    const noteText = await this.page.locator(xpath).innerText();
    return noteText;
  }

  /**
   * go to catalog page
   * @param domain
   */
  async goToCatalogPage(domain: string) {
    await this.page.goto(`https://${domain}/admin/plusbase/catalog`);
    await this.page.waitForLoadState("load");
    await this.page.waitForSelector(".catalog-products-view");
  }

  /**
   * add list product to list import by title
   * @param listTitle
   * @param dashboard
   * @param domain
   */
  async addItemsToListImport(listTitle: string[], dashboard: Page, domain: string) {
    await this.goToCatalogPage(domain);
    for (const productTitle of listTitle) {
      await this.searchProductcatalog(productTitle);
      await dashboard.hover(
        `//div[@class='sb-flex text-decoration-none sb-flex-direction-column product' and descendant::div[contains(text(),'${productTitle}')]]`,
      );
      await dashboard.locator(`(//*[contains(text(),'Add to list')])[1]`).click();
    }
  }

  /**
   * show page import and change product title
   * @param oldTitles
   * @param newTitles
   */
  async showPageImportAndChangeProductTitle(oldTitles: string[], newTitles: string[]) {
    await this.clickOnBtnImportList("selected products to store");
    let idx = 0;
    for (const productTitle of oldTitles) {
      await this.editProductTitleInImportList(productTitle, newTitles[idx]);
      idx++;
    }
  }

  /**
   * add all product to store
   */
  async addSelectedAllProductToStore() {
    await this.genLoc("//span[contains(text(),'Select all')]").click();
    await this.clickOnBtnImportList("selected products to store");
  }

  /**
   * Click button View image product
   */
  async clickButtonViewImage() {
    await this.hoverThenClickElement(
      "(//div[@class='overlay d-flex align-items-end justify-content-center'])[1]",
      "(//i[@class='icon cursor-pointer']//*[name()='svg'])[1]",
    );
  }

  /**
   * clone all product to store
   * @param cloneInfo : infor clone include type, second shop, action, keep id
   */
  async cloneAllProductToStore(cloneInfo: CloneInfo) {
    await this.verifyCheckedThenClick(
      "(//span[@data-label='Select all products' or @data-label='Select all campaigns']//span)[1]",
      true,
    );
    if (await this.page.locator("//span[contains(text(),'Select all')]").isVisible()) {
      await this.genLoc("//span[contains(text(),'Select all')]").click();
    }
    await this.genLoc("button:has-text('Action')").click();
    await this.page.waitForSelector(`//span[normalize-space()="Import ${cloneInfo.type} to another store"]`);
    //select import product or campaign
    await this.page.click(`//span[normalize-space()="Import ${cloneInfo.type} to another store"]`);
    await this.page.locator("//div[contains(@class,'s-animation-content')]//div[@class='s-modal-body']").isVisible();
    //choose store

    await this.page.click("//div[@class='s-modal is-active']//div[@id='select-shops']//button[@type='button']");
    await this.page.click(`//p[normalize-space()='${cloneInfo.second_shop}']`);
    //verify message
    await this.page.locator("//div[@class='s-alert is-yellow']//p").isVisible();
    //select action
    await this.page.click(
      "//div[child::p[contains(normalize-space(),'If the importing handle exists')]]//following-sibling::div//button",
    );
    await this.page.click(`//span[normalize-space()='${cloneInfo.action}']`);
    if (cloneInfo.keep_id === true) {
      await this.page.click(
        "//span[normalize-space()='Keep current Product ID in tracking services" +
          "and product feeds of the targeting store']//parent::label",
      );
    }
    //click btn Import
    await this.page.click("(//button[normalize-space()='Import'])[2]");
  }

  /**
   * click edit product in import list product page
   * @param productName
   */
  async clickBtnEditProduct(productName: string) {
    // eslint-disable-next-line max-len
    const xpath = `//div[@class='sb-card__body'] //div[ following-sibling::div[descendant::input[contains(@placeholder,'${productName}')]]]`;
    // eslint-disable-next-line max-len
    const xpathAddStore = `//div[contains(@class,'sb-input sb-relative') and descendant::input[@placeholder='${productName}']]/parent::div/following-sibling::div//button`;

    await this.page.click(xpath);
    await this.page.locator(xpathAddStore).click();
    await this.page.waitForSelector("//span[contains(text(),'Edit product')]");
  }

  /**
   * locator of button edit product in import list page
   * @returns locator
   */
  async editProductLocator() {
    return this.page.locator("//span[contains(text(),'Edit product')]");
  }

  /**
   * go to product Ali detail page by productId
   * @param productId
   */
  async goToProductRequestDetail(productId: number) {
    await this.page.goto(`https://${this.domain}/admin/plusbase/aliexpress-products/${productId}`);
    await this.page.waitForLoadState("load");
    await this.page.waitForSelector(".sb-skeleton", { state: "hidden" });
  }

  /**
   * go to product catalog detail page by productId
   * @param productId
   */
  async goToProductCatalogDetailById(productId: number) {
    await this.page.goto(`https://${this.domain}/admin/plusbase/catalog/product-detail/${productId}`);
    await this.page.waitForLoadState("load");
  }

  /**
   * click tab Specification in SO detail
   */
  async clickTabSpecification() {
    await this.page.reload();
    await this.page.waitForLoadState("load");
    await (await this.page.waitForSelector("//*[normalize-space(text())='Specification']")).click();
  }

  /**
   * get specification data in SO detail
   * @param type
   * @returns listSpec
   */
  async getSpecificationSODetail(type: string): Promise<string[]> {
    const totalRow = await this.page.locator("(//div[@class = 'specification-custom-table'])[2]//tbody/tr").count();
    let column;

    if (type === "name") {
      column = 1;
    }
    if (type === "value") {
      column = 2;
    }

    const listSpec = [];
    for (let i = 1; i <= totalRow; i++) {
      const specData = await this.page.innerText(
        `(//div[@class = 'specification-custom-table'])[2]//tbody/tr[${i}]/td[${column}]`,
      );
      listSpec.push(specData);
    }
    return listSpec;
  }

  /** ALIEXPRESS REQUEST */
  /**
   * Go to Product request page
   */
  async goToProductRequest() {
    await this.page.goto(`https://${this.domain}/admin/plusbase/aliexpress-products`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Go to Import aliexpress product page
   */
  async goToImportAliexpressProductPage() {
    await this.page.goto(
      `https://${this.domain}/admin/plusbase/aliexpress-products/create-product-request?only_ali=true`,
    );
    await this.page.waitForLoadState("load");
  }

  /**
   * (Aliexpress request list)
   * Return action tab xpath.
   */
  getActiveTabXpath(): string {
    return "//*[contains(@class,'sb-tab-panel') and not(@style='display: none;')]";
  }

  /**
   * (Aliexpress request list)
   * Return item badge xpath.
   */
  getBadgeXpath(): string {
    return `(${this.getActiveTabXpath()}//*[contains(@class, 'sb-badge')])`;
  }

  /**
   * (Aliexpress request list)
   * Check is tab actived.
   * @param tab is tab name
   */
  async verifyTabActived(tab: string) {
    await this.page
      .locator(`(//*[contains(@class,'sb-tab-navigation__item--active')]//*[contains(text(),'${tab}')])[1]`)
      .isVisible();
  }

  /**
   * (Aliexpress request list)
   * Go to tab.
   * @param tab is tab name
   */
  async clickTab(tab: string) {
    await this.page
      .locator(`(//*[contains(@class,'sb-tab-navigation__item')]//*[contains(text(),'${tab}')])[1]`)
      .click();
    await this.waitTabItemLoaded();
  }

  /**
   * (Aliexpress request list)
   * Get badges text of active tab.
   */
  async getBadgesText(): Promise<string[]> {
    return await this.page.locator(this.getBadgeXpath()).allTextContents();
  }

  /**
   * (Aliexpress request list)
   * Get product name of active tab.
   */
  async getProductsName(): Promise<string[]> {
    return await this.page
      .locator(`${this.getActiveTabXpath()}//*[contains(@class,'catalog-products-review__product-review__name')]`)
      .allTextContents();
  }

  /**
   * (Aliexpress request list)
   * Search with keyword.
   * @param keyword is search key
   */
  async searchWithKeyword(keyword: string, hasResult = false) {
    let retry = 0;
    while (retry++ < 3) {
      await this.page.reload({ waitUntil: "load" });
      await this.page
        .locator(`(${this.getActiveTabXpath()}//input[@placeholder='Search by product name, request link'])[1]`)
        .fill(keyword);

      if (!hasResult) {
        return;
      }

      await this.page.waitForTimeout(500);
      await this.page.waitForLoadState("networkidle");
      if ((await this.page.locator(this.getBadgeXpath()).count()) > 0) {
        return;
      }
    }
  }

  /**
   * (Aliexpress request list)
   * Wait tab item loaded.
   */
  async waitTabItemLoaded() {
    await this.page.waitForSelector(this.getBadgeXpath());
  }

  /**
   * (Aliexpress request list)
   * Count search result.
   */
  async countSearchResult(): Promise<number> {
    return await this.page.locator(this.getBadgeXpath()).count();
  }

  /**
   * (Aliexpress request list)
   * Clear search input.
   */
  async clearSearchInput() {
    await this.searchWithKeyword("");
  }

  /**
   * (Aliexpress request list)
   * Click product item based on product url
   */
  async clickProductItemBaseOnUrl(url: string) {
    await this.page.locator(`(${this.getActiveTabXpath()}//*[@href='${url}']//..)[1]`).click();
  }

  /**
   * (Aliexpress request)
   * Return data of first product in list
   */
  async getDataOfFirstProductInList(): Promise<DataOfProductItemInList> {
    const firstItem = this.page.locator(
      `(${this.getActiveTabXpath()}//*[contains(@class,'catalog-products-review__product')])[1]`,
    );
    return {
      img_src: (await firstItem.locator(`//img`).first().getAttribute("src")).trim(),
      product_name: (await firstItem.locator(`//*[contains(@class,'product-review__name')]`).textContent()).trim(),
      product_status: (await firstItem.locator(`//*[contains(@class,'sb-badge')]`).textContent()).trim(),
      product_cost: (await firstItem.locator(`//*[contains(@class,'review__price__base-cost')]`).textContent())
        .replace("Product cost", "")
        .trim(),
    };
  }

  /**
   * (Aliexpress request - import url page)
   * Fill url to text area.
   * @param text is urls need to fill
   */
  async fillUrlToRequestProductTextArea(text: string) {
    await this.page.locator(`//*[@placeholder='Enter request links from AliExpress, CJ Dropshipping']`).fill(text);
    await this.page.keyboard.press("Enter");
  }

  /**
   * (Aliexpress request - import url page)
   * Return count of valid url.
   */
  async countValidUrl() {
    return await this.page.locator(`.request-detail__container__product-item`).count();
  }

  /**
   * (Aliexpress request - import url page)
   * Start import aliexpress link.
   */
  async clickImportAliexpressLink() {
    await this.page.locator(`//button//*[contains(text(), 'Import')]`).click();
    await this.page.waitForSelector(this.xpathProductRequest);
  }

  /**
   * Import link aliexpress, cj dropship
   * linkRequest link product ali/cj
   */
  async addProductRequest(linkRequest: string) {
    await this.page
      .locator(`//div[descendant::*[contains(text(),'Request product link')]]//textarea`)
      .fill(linkRequest);
    await this.page.keyboard.press("Enter");
    await this.page.locator(`//button//*[contains(text(), 'Import')]`).click();
    await this.page.waitForSelector(this.xpathProductRequest);
  }

  /**
   * (Aliexpress request - import url page)
   * Wait is product crawl success
   */
  async waitProductCrawlSuccessWithUrl(
    api: PlusbaseProductAPI,
    url: string,
    retryTime: number,
    isCj = false,
    status = "available",
  ) {
    let i = 0;
    while (i < retryTime) {
      const products = (
        await api.getProducts({
          type: "private",
          tab: "all",
          only_cj: isCj,
          only_ali: !isCj,
          search: url,
        })
      ).products;
      if (
        products.length == 0 ||
        products[0].id === 0 ||
        products[0].product_status !== status ||
        !products[0].quotation_id ||
        products[0].quotation_id === 0
      ) {
        i++;
        await this.page.waitForTimeout(5000);
        continue;
      }

      return;
    }

    throw new Error("Maximum retry to wait product crawl success");
  }

  /**
   * Get product supported country ids
   * @param api is PlusbaseProductAPI
   * @param url is full url of product
   * @param expectLength is length of country need crawl success
   */
  async getProductSupportedCountryIds(
    api: PlusbaseProductAPI,
    productId: number,
    expectLength: number,
    retryTime: number,
    retryIf500?: boolean,
  ): Promise<number[]> {
    let result: ShippingRateResponse;
    let i = 0;
    while (i < retryTime) {
      result = await api.getShippingRate({
        product_id: productId,
        return_default_if_500: retryIf500,
      });
      if (result.country_ids.length != expectLength) {
        i++;
        await this.page.waitForTimeout(5000);
        continue;
      }
      return result.country_ids;
    }
  }

  /**
   * (Aliexpress product detail)
   * Return xpath timeline block
   */
  getXpathTimelineBlock() {
    return `//*[@class="sb-timeline"]`;
  }

  /**
   * (Aliexpress product detail)
   * Return xpath product image
   */
  getXpathProductImageBlock() {
    return `//*[contains(@class, 'cpd-image')]`;
  }

  /**
   * (Aliexpress product detail)
   * Return xpath product info block (description, specification)
   */
  getXpathProductInfoBlock() {
    return `//*[contains(@class, 'cpd-product-info')]`;
  }

  /**
   * (Aliexpress product detail)
   * Return xpath shipping info block
   */
  getXpathShippingBlock() {
    return `//*[contains(@class, 'cpd-shipping')]`;
  }

  /**
   * (Aliexpress product detail)
   * Return xpath common info block (about this product, ...)
   */
  getXpathCommonInfoBlock() {
    return `//*[contains(@class, 'ppr-common')]`;
  }

  /**
   * (Aliexpress product detail)
   * Wait shipping block loaded
   */
  async waitAliDetailShippingBlockLoaded() {
    const spinnerXpath = `${this.getXpathShippingBlock()}//*[contains(@class, 'sb-spinner')]`;
    const spinnerCount = await this.page.locator(spinnerXpath).count();
    if (spinnerCount > 1) {
      await this.page.waitForSelector(spinnerXpath, { state: "detached" });
    }
  }

  /**
   * (Aliexpress product detail)
   * Return count of image
   */
  async countImageInAliexpressProductDetail() {
    const imageLoadingXpath = `${this.getXpathProductImageBlock()}//*[contains(@class, 'sb-image__loading')]`;
    const imageLoadingCount = await this.page.locator(imageLoadingXpath).count();
    if (imageLoadingCount > 0) {
      await this.page.waitForSelector(imageLoadingXpath, { state: "detached" });
    }

    return await this.page.locator(`${this.getXpathProductImageBlock()}//img`).count();
  }

  /**
   * Get supported country data
   */
  async getSupportedCountryData(
    odoo: FixtureOdoo,
    dashboardApi: DashboardAPI,
    req: SupportedCountryDataRequest,
  ): Promise<SupportedCountryData> {
    const odooService = OdooService(odoo);
    const mapSbaseCountryCode = new Map<string, CountryInfo>();
    const configOdooSupportCountryIds = new Array<number>();
    let countryIds = new Array<number>();
    let countryCodes = new Array<string>();
    let countryNames = new Array<string>();
    let displayName: string;

    const sbaseCountries = await dashboardApi.getCountries();
    for (const sbaseCountry of sbaseCountries.countries) {
      mapSbaseCountryCode.set(sbaseCountry.code, sbaseCountry);
    }
    const supportedCountry = await odooService.getCountriesNeedCrawl(req.configDeliveryCarrierId);
    displayName = supportedCountry.deliveryCarrier.x_display_name_checkout;
    for (const country of supportedCountry.countries) {
      if (
        mapSbaseCountryCode.has(country.code) &&
        !req.ignoreCountryIds.includes(mapSbaseCountryCode.get(country.code).id)
      ) {
        configOdooSupportCountryIds.push(country.id);
        countryIds.push(mapSbaseCountryCode.get(country.code).id);
        countryCodes.push(country.code);
        countryNames.push(mapSbaseCountryCode.get(country.code).name);
      }
    }

    if (req.shippingTypeId > 0) {
      countryIds = [];
      countryCodes = [];
      countryNames = [];
      displayName = ""; // Return empty due shipping type can contains many delivery carrier

      const countriesSupportByShippingTypeId = await odooService.getCountriesSupportByShippingTypeId([
        req.shippingTypeId,
      ]);
      for (const country of countriesSupportByShippingTypeId) {
        if (
          configOdooSupportCountryIds.includes(country.id) &&
          !req.ignoreCountryIds.includes(mapSbaseCountryCode.get(country.code).id)
        ) {
          countryIds.push(mapSbaseCountryCode.get(country.code).id);
          countryCodes.push(country.code);
          countryNames.push(mapSbaseCountryCode.get(country.code).name);
        }
      }
    }

    return {
      country_ids: countryIds,
      country_codes: countryCodes,
      country_names: countryNames,
      deliver_carrier_display_name: displayName,
    };
  }

  /**
   * Return array shipping name in aliexpress detail page
   */
  async getShippingNamesInAliexpressDetail(): Promise<string[]> {
    await this.page
      .locator(`(//*[text()[normalize-space()='Ship to']]//..//*[contains(@class, 'sb-autocomplete')])[1]`)
      .click();

    const activeSelectMenuXpath = `//*[contains(@class, 'sb-popover__popper') and not(contains(@style, 'display: none;'))]`;
    await this.page.waitForSelector(activeSelectMenuXpath);
    const shippingNameXpath = `${activeSelectMenuXpath}//*[contains(@class, 'sb-text-body-medium')]`;
    await this.page.waitForSelector(shippingNameXpath);
    const result = await this.page.locator(shippingNameXpath).allTextContents();
    return result.map(item => item.trim());
  }

  /** END ALIEXPRESS REQUEST */

  /** START CATALOG */

  /**
   * Get product names of collection in catalog page.
   * @param collectionName is name of collection
   * @params array of product name
   */
  async getCatalogProductNames(collectionName: string): Promise<string[]> {
    const productNameXpath = `//div[contains(@class,'catalog-products') and descendant::*[normalize-space()='${collectionName}']]//*[contains(@class,'name')]`;
    await this.page.waitForSelector(productNameXpath);
    return await this.page.locator(productNameXpath).allTextContents();
  }

  /**
   * Count product of collection in catalog page.
   * @param collectionName is name of collection
   * @returns number
   */
  async countCatalogProduct(collectionName: string): Promise<number> {
    const productNameXpath = `.catalog-products-view:has(.title:has-text('${collectionName}')) .product`;
    await this.page.waitForSelector(productNameXpath);
    return await this.page.locator(productNameXpath).count();
  }

  /** END CATALOG */

  /**
   * Wait and reload page.
   * @param second is time waiting
   */
  async waitAndReloadPage(second: number) {
    await this.page.waitForTimeout(second);
    await this.page.reload();
    await this.page.waitForLoadState("load");
  }

  /**
   * Get count timeline catalog text
   * @param productId product template id
   * @param timelineContent timeline content string
   * @param checkFirstOnly if set true: will return 1 if the first timeline content is correct, 0 otherwise
   * @returns number matching count
   */
  async getCountTimelineCatalog(timelineContent: string, checkFirstOnly: boolean): Promise<number> {
    const maxReload = 10;
    let reloadCount = 0;
    let xpath: string;
    if (checkFirstOnly) {
      xpath = `(//div[contains(@class, 'sb-timeline__content--message--text')])[1]//div[contains(text(), '${timelineContent}')]`;
    } else {
      xpath = `//div[contains(@class, 'sb-timeline__content--message--text')]//div[contains(text(), '${timelineContent}')]`;
    }
    await this.page.waitForSelector("//div[contains(@class, 'sb-timeline__content')]", {
      timeout: 5000,
    });
    let count: number;
    while (reloadCount < maxReload) {
      count = await this.page.locator(xpath).count();
      if (count == 0) {
        reloadCount++;
        await this.page.reload();
        await this.page.waitForSelector("//div[contains(@class, 'sb-timeline__content')]");
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Check if timeline is local time.
   */
  async isTimelineLocalTime() {
    const regex = new RegExp("\\d{2}:\\d{2} (AM|PM)");
    const currentTime = (
      await this.page.locator("(//div[contains(@class, 'sb-timeline__content--time')])[1]").textContent()
    ).trim();
    if (!regex.test(currentTime)) {
      throw new Error("regex validation failed");
    }
    const localHour = getHours(new Date().toLocaleString());
    let currentHour = +currentTime.split(":")[0];
    if (currentTime.split(" ")[1] === "PM") {
      currentHour += 12;
    }
    return localHour === currentHour;
  }

  /**
   * Check if timeline is local time.
   */
  async isTimelineLocalDate() {
    const currentDate = (
      await this.page.locator("//div[contains(@class, 'sb-timeline__date--content')]").textContent()
    ).trim();
    const localDate = new Date();
    let localDateString: string;
    if (localDate.getDate() < 10) {
      localDateString = `${localDate.toLocaleString("default", {
        month: "short",
      })} 0${localDate.getDate()}, ${localDate.getFullYear()}`;
    } else {
      localDateString = `${localDate.toLocaleString("default", {
        month: "short",
      })} ${localDate.getDate()}, ${localDate.getFullYear()}`;
    }
    return localDateString === currentDate;
  }

  /**
   * count total product show in catalog page
   * @returns totalProduct
   */
  async countProductCatalog(): Promise<number> {
    const totalProduct = await this.page.locator("//div[contains(@class,'column product')]").count();
    return totalProduct;
  }

  /**
   * get productName of product in SO detail
   * @returns productName
   */
  async getQuotationNameInSODetail(): Promise<string> {
    const productName = await this.getTextContent("(//div[contains(@class,'sb-title')])[2]");
    return productName;
  }

  /**
   * get productName of product in SO detail
   * @returns productName
   */
  async getProductNameInSODetail(): Promise<string> {
    const productName = await this.getTextContent("(//div[contains(@class,'sb-text-heading word-break-all')])");
    return productName;
  }

  /**
   * get processingTime of product in SO detail
   * @returns processingTime
   */
  async getProcessingTimeSODetail(): Promise<string> {
    const processingTime = await this.getTextContent(
      "//div[text()[normalize-space() = 'Processing time']]/following-sibling::div",
    );
    return processingTime;
  }

  /**
   * get processingRate of product in SO detail
   * @returns processingRate
   */
  async getProcessingRateSODetail(): Promise<string> {
    const processingRate = await this.getTextContent(
      "(//div[text()[normalize-space() = 'Processing rate']]/parent::div/following-sibling::div/div[contains(., '%')])[1]",
    );
    return processingRate;
  }

  /**
   * get variants of product in SO detail
   * @param index
   * @returns variant
   */
  async getVariantsSODetail(index: number): Promise<string> {
    const variant = await this.getTextContent(`(//div[@class = 'content']//button//span)[${index}]`);
    return variant;
  }

  async selectVariantCombo(params: { group_combo_by: string; combo_names: Array<string> }) {
    await this.page
      .locator('//div[contains(@class, "product__variant__action")]//a[contains(text(), "Create combo")]')
      .click();

    await this.page
      .locator(
        '//div[contains(@class, "plusbase-combo")]//div[contains(text(), "Group combo by")]/following-sibling::div[contains(@placeholder, "Select option")]//input[contains(@placeholder, "Select option")]',
      )
      .click();
    await this.page
      .locator(
        `//div[contains(@class, "s-select-searchable__item-list")]/div[contains(text(), "${params.group_combo_by}")]`,
      )
      .click();

    for await (const variantName of params.combo_names) {
      await this.page
        .locator(
          '//div[contains(@class, "plusbase-combo")]//div[contains(text(), "Option to create combo")]/following-sibling::div[contains(@placeholder, "Choose variant")]//input[contains(@placeholder, "Choose variant")]',
        )
        .click();
      await this.page
        .locator(`//div[contains(@class, "s-select-searchable__item-list")]/div[contains(text(), "${variantName}")]`)
        .click();
    }
    await this.page.waitForLoadState("load");
  }

  /**
   * Get shipping data in quotation detail page
   */
  async getShippingsInQuotationDetailPage(): Promise<{
    current_select_name: string;
    shippings: Array<{
      shipping_method: string;
      shipping_time: string;
    }>;
  }> {
    const resp = {
      current_select_name: await this.page
        .locator(
          `//*[contains(@class, 'cpd-shipping') and descendant::*[normalize-space()='Ship to']]//*[@class='sb-block-item__content']`,
        )
        .innerText(),
      shippings: [],
    };

    const shippingBoxXpath = `//div[contains(@class,'shipping-rate-box__content')]`;
    const countShipping = await this.page.locator(shippingBoxXpath).count();
    for (let index = 1; index <= countShipping; index++) {
      const data = await this.page.locator(`(${shippingBoxXpath})[${index}]/div`).allInnerTexts();
      resp.shippings.push({
        shipping_method: data[0],
        shipping_time: data[1],
      });
    }

    return resp;
  }

  /**
   * Get product supported country ids
   * @param api is PlusbaseProductAPI
   * @param url is full url of product
   * @param expectLength is length of country need crawl success
   */
  async getProductShippingRates(api: PlusbaseProductAPI, productId: number): Promise<ShippingRateResponse> {
    const result = await api.getShippingRate({
      product_id: productId,
      use_ali_ship: true,
      is_odoo: true,
    });
    return result;
  }

  /**
   * (Aliexpress request - import url page)
   * Clean product aliexpress after request
   */
  async cleanProductAfterRequest(
    odoo: FixtureOdoo,
    api: PlusbaseProductAPI,
    request: CleanProductRequest,
    unlinkQuotation = true,
    isDelProdTemplate = true,
  ) {
    const odooService = OdooService(odoo);

    // Get product
    const products = (
      await api.getProducts({
        type: "private",
        tab: "all",
        only_ali: !request.not_ali,
        search: request.url,
      })
    ).products.filter(product => product.product_status !== "no_result" && product.url == request.url);

    if (products.length === 0) {
      if (request.skip_if_not_found) {
        return;
      }
      throw new Error("Empty result");
    }
    if (products.length > 1) {
      throw new Error("Result large than 1");
    }

    if (!products[0].quotation_id) {
      if (!request.skip_if_not_found) {
        throw new Error("Cannot get quotation id");
      }
    } else {
      await odooService.cancelQuotation(products[0].quotation_id, request.cancel_reason_id);
      if (unlinkQuotation) {
        await odooService.unlinkQuotation(products[0].quotation_id);
      }
    }

    await odooService.deleteProductTemplatePartnerWithProductTmplId(products[0].id, request.odoo_partner_id);

    //Xoá product template
    if (isDelProdTemplate) {
      await odooService.updateProductTemplate([products[0].id], {
        x_warehouse_id: 1,
        x_delivery_carrier_type_ids: [[6, false, [1]]],
        x_weight: 0.1,
      });
      await odooService.updateProductTemplateXUrl(products[0].id, `${request.url}_TEST`);
    }
  }

  /**
   * Edit title product import list page
   * @param oldTitle
   * @param newTitle
   */
  async editProductTitleInImportList(oldTitle: string, newTitle: string) {
    await this.page.fill(`//div[@class="sb-card__body"]//input[@placeholder='${oldTitle}']`, newTitle);
  }

  /**
   * Edit selling price variant product import list page
   * @param productName
   * @param sellingPice
   */
  async editSellingPriceInImportList(productName: string, sellingPice: string) {
    const countVariants = await this.countVariants(productName);
    const colSellingPriceIndex =
      (await this.genLoc(
        "//div[text()='Selling price']//ancestor::th[contains(@class,'sb-table')]//preceding-sibling::th",
      ).count()) + 1;

    for (let i = 1; i <= countVariants; i++) {
      const xpathVariant = `((//div[contains(@class,'card') and descendant::input[contains(@placeholder,'${productName}')]]//table)[4]//tr)[${i}]`;
      const xpathInputSellingPrice = this.genLoc(
        `${xpathVariant}//td[${colSellingPriceIndex}]//div[@class='sb-flex sb-input__body']//input[@type='number']`,
      );
      await xpathInputSellingPrice.fill(sellingPice);
    }
  }

  /**
   *  Get product id form url of quotation detail
   * @conditions curren page must be quotation detail page
   * @returns product id from current page url
   */
  getProductIdFromQuotationDetail() {
    const url = new URL(this.page.url());
    const productId = +url.pathname.split("/").pop();
    return isNaN(productId) ? -1 : productId;
  }

  /**
   * Edit attribute of product
   * @param atrribute : attribute of product
   */
  async editAttributeOfProduct(row: number, column: number, atrribute: string) {
    await this.page.locator(`(//tr[${row}]//td[${column}]//input)[1]`).fill(atrribute);
  }

  // select variant to import
  async selectVariantToImport(index = 1) {
    // eslint-disable-next-line playwright/no-force-option
    await this.page
      .locator(`(//div[contains(@class,'sb-table__body')]//span[@class='sb-check'])[${index}]`)
      // eslint-disable-next-line playwright/no-force-option
      .click({ force: true });
  }

  /**
   * Get product supported country ids
   * @param api is PlusbaseProductAPI
   * @param url is full url of product
   * @param expectLength is length of country need crawl success
   */
  async getProductShippingRatesByProductId(
    api: PlusbaseProductAPI,
    productId: number,
    useAliShip?: boolean,
    fromOdoo?: boolean,
  ): Promise<ShippingRateResponse> {
    const result = await api.getShippingRate({
      product_id: productId,
      use_ali_ship: useAliShip,
      is_odoo: fromOdoo,
    });
    return result;
  }

  /**
   * Get badge status of quotation detail
   * @returns string
   */
  async getBadgeStatusQuotationDetail() {
    return this.genLoc(`//div[contains(@class, 'sb-block')]//span[contains(@class, 'sb-badge')]`).first().innerText();
  }

  /**
   * Get locator extend button to show detail timeline
   * @param message string
   * @returns
   */
  getTimelineMessageExpandLocator(message: string) {
    return this.page.locator(
      `//div[contains(@class, 'sb-timeline__content--message--text')]//div[normalize-space()='${message}']/following-sibling::div`,
    );
  }

  /**
   * check timeline whether visible or not
   * @param message
   * @returns
   */
  async isVisibleTimelineMessage(message: string) {
    return this.page
      .locator(`//div[contains(@class, 'sb-timeline__content--message--text')]//div[normalize-space()='${message}']`)
      .first()
      .isVisible();
  }

  /**
   * Get timeline message locator
   * @param message
   * @returns
   */
  getTimelineMessageLocator(message: string) {
    return this.genLoc(`//li[contains(@class, 'sb-timeline__content--message--child') and contains(., '${message}')]`);
  }

  /**
   * Get base cost of product in SO list
   * @param productName : name of product
   * @param index : index of base cost
   * @returns base cost
   */
  async getBaseCost(productName: string, index: number): Promise<string> {
    return await this.page
      .locator(`(//div[contains(text(), '${productName}')]/following-sibling::div//div)[${index}]`)
      .innerText();
  }

  /**
   * Get moq description
   */
  async getMoqDescription(): Promise<string> {
    return (await this.getTextContent(`//div[@class='moq__description sb-mt-medium']`))
      .replace(/[\r\n]/gm, "")
      .replace(/\s+/gm, " ");
  }

  /**
   * Get split shipment description
   */
  async getSplitDescription(): Promise<string> {
    return `${await this.getTextContent(`(//div[parent::div[@class="sb-pt-medium"]])[1]`)}${await this.getTextContent(
      `(//div[parent::div[@class="sb-pt-medium"]])[2]`,
    )}`
      .replace(/[\r\n]/gm, "")
      .replace(/\s+/gm, " ");
  }

  /**
   * Get split shipment
   */
  async getSplitShipment(): Promise<string> {
    return await this.getTextContent(`//div[preceding-sibling::div[child::div[contains(text(),'Split shipments')]]]`);
  }

  /* Get data daily pack quantity
   * @returns dataDailyPackQuantity
   */
  async getDataDailyPackQuantity(): Promise<Array<Record<string, string>>> {
    const list = new Array<Record<string, string>>();
    const countDailyPackQuantity = await this.page.locator(this.xpathMoqList).count();
    for (let i = 1; i <= countDailyPackQuantity; i++) {
      const dailyPackQuantity = await this.getTextContent(`(${this.xpathMoqList})[${i}]`);
      const dataPackQuantity = dailyPackQuantity.split("$");

      let minQuantity: string;
      if (i < countDailyPackQuantity) {
        minQuantity = dataPackQuantity[0].split("-")[0].trim();
      } else {
        minQuantity = dataPackQuantity[0].split(" ")[1];
      }
      const price = dataPackQuantity[1].trim();
      list.push({
        price: price,
        minQuantity: minQuantity,
      });
    }
    return list;
  }
  /**
   * Count line variant in import list
   */
  async countVariantInImportList(): Promise<number> {
    const xpathLineVariant = `(//div[contains(@class,"card")])[1]//td[not (contains(@class,"is-hidden"))]//img[parent::div[@class="s-flex"]]`;
    await this.waitUntilElementVisible(xpathLineVariant);
    return await this.page.locator(xpathLineVariant).count();
  }

  /**
   * Hover tooltip on shipping zone page
   */
  async hoverTooltipVariantHighPrice(variant: string[]): Promise<void> {
    await this.page
      .locator(`//span[contains(@class, 'sb-tooltip__reference') and normalize-space()="${variant}"]`)
      .hover();
  }

  /**
   * Check text is visible khi hover
   */
  async isVisibleTooltipVariantHighPrice(limit: number): Promise<boolean> {
    return await this.page
      .locator(
        `((//*[contains(text(), "This variant is over $${limit} and is not supported for sale")])//parent::div[not (contains(@style,'display: none;'))]//div)[1]`,
      )
      .isVisible();
  }

  /**
   * Markup shipping fee for aliexpress request
   * Markup shipping fee X.99
   * @return shipping fee after markup
   */
  markupShippingAliCj(shippingBeforeMarkup: number): ShippingFee {
    const shippingFee: ShippingFee = {
      first_item: 0,
      additional_item: 0,
    };
    shippingFee.first_item = Math.ceil(shippingBeforeMarkup) + 0.99;
    shippingFee.additional_item = (shippingFee.first_item + 0.01) / 2 + 0.01;
    return shippingFee;
  }

  async searchAndImportAliExpressProduct(aliUrl: string) {
    await this.goToProductRequest();
    await this.searchWithKeyword(aliUrl);
    await this.waitTabItemLoaded();
    await this.importProductToStore();
    await this.importFirstProductToStore();
  }

  /**
   * Kiểm tra giá của tất cả các product catalog có nằm trong khoảng minProductCost- maxProductCost
   * @param min product cost
   * @param max productCost
   * @returns true: nếu giá của tất cả product nằm trong khoảng minProductCost- maxProductCost
   *
   */
  async checkValidProductCost(minProductCost: number, maxProductCost: number): Promise<boolean> {
    const numberOfProduct = await this.page
      .locator(`//div[contains(@class,'catalog-products-view__products')]//a`)
      .count();
    let productCost: string;
    let minPC: number;
    let maxPC: number;

    for (let i = 1; i <= numberOfProduct; i++) {
      productCost = await this.getTextContent(
        `((//div[contains(@class,'catalog-products-view__products')]//a)[${i}]//div[4]//div)[2]`,
      );
      if (productCost.includes(" - ")) {
        productCost = productCost.replace(" - ", "-");
        minPC = Number(removeCurrencySymbol(productCost.split("-")[0]));
        maxPC = Number(productCost.split("-")[1]);
      } else {
        minPC = maxPC = Number(removeCurrencySymbol(productCost));
      }
      if (minPC < minProductCost || maxPC > maxProductCost) return false;
    }
    return true;
  }

  /**
   * Filter product catalog using more filter
   * @param filterCatalog: điều kiện filter
   */
  async filterProductCatalog(filterCatalog: FilterCatalog) {
    await this.clickOnBtnWithLabel("Filters");
    for (const [key, value] of Object.entries(filterCatalog)) {
      switch (key) {
        case "min_shipping_fee":
          await this.inputTextBoxWithLabel("Shipping fee", value, 1);
          break;
        case "max_shipping_fee":
          await this.inputTextBoxWithLabel("Shipping fee", value, 2);
          break;
        case "min_product_cost":
          await this.inputTextBoxWithLabel("Product cost", value, 1);
          break;
        case "max_product_cost":
          await this.inputTextBoxWithLabel("Product cost", value, 2);
          break;
        case "min_profit_margin":
          await this.inputTextBoxWithLabel("Profit margin", value, 1);
          break;
        case "max_profit_margin":
          await this.inputTextBoxWithLabel("Profit margin", value, 2);
          break;
        case "most_views":
          await this.clickElementWithLabel("span", value);
          break;
        case "most_imports":
          await this.clickElementWithLabel("span", value, 2);
          break;
        case "best_seller":
          await this.clickElementWithLabel("span", value, 3);
          break;
        case "number_of_views":
          await this.inputTextBoxWithLabel("Number of views", value);
          break;
        case "number_of_imports":
          await this.inputTextBoxWithLabel("Number of imports", value);
          break;
        case "number_of_sold":
          await this.inputTextBoxWithLabel("Number of sold", value);
          break;
        case "tag":
          await this.inputTextBoxWithLabel("Tag", value);
          break;
      }
    }
    await this.clickOnBtnWithLabel("Apply");
    await this.page.waitForLoadState("domcontentloaded");
    await this.waitUntilElementVisible(`(//*[contains(text(),"Filter result")])[1]`);
  }

  /**
   *  Get shipping method, shipping cost, total cost in popup shipping on SO detail
   * @returns DataInPopUp
   */
  async getDataInPopUpShipping(): Promise<DataInPopUpShipping> {
    const [shippingMethod, productCostAct, totalCostAct, firstItem, additionalItem] = await Promise.all([
      this.getShipingInPopup(1, 1),
      this.getDataPopup(3),
      this.getDataPopup(4),
      this.getShippingCostInPopUp(2, 1),
      this.getShippingCostInPopUp(2, 2),
    ]);
    return {
      shippingMethod: shippingMethod,
      productCostAct: productCostAct,
      totalCostAct: totalCostAct,
      firstItem: firstItem,
      additionalItem: additionalItem,
    };
  }

  async getDiscountTimeSO(SOInfo: SOInfo, timeZone = 7) {
    const discountFrom = new Date(SOInfo.from_time);
    discountFrom.setHours(discountFrom.getHours() + timeZone);
    const startDiscount = convertTimeUS(discountFrom);
    const discountTo = new Date(SOInfo.to_time);
    discountTo.setHours(discountTo.getHours() + timeZone);
    const endDiscount = convertTimeUS(discountTo);
    return `${startDiscount} to ${endDiscount}`;
  }
}
