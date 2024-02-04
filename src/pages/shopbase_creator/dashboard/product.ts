import { Locator, Page } from "@playwright/test";
import { DashboardPage } from "@pages/dashboard/dashboard";
import type { Chapter, ProductUpdate } from "@types";
import { waitTimeout } from "@core/utils/api";
import { Pricing } from "@types";
import { expect } from "@core/fixtures";

export class ProductPage extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathImageProductDetail =
    "//div[@class = 'sb-image sb-relative sb-pointer sb-overflow-hidden min-size sb-image--medium']//img";
  xpathThumbnailOnList = "//div[contains(@class,'image__container sb-mr-medium')]//img[contains(@src, 'img')]";
  xpathVerifyMemberHeader = "//div[contains(text(),'Contacts')]";
  xpathTooltipFilter = "//div[@class='sb-tag__caption sb-text-caption sb-pl-small sb-tooltip__reference']";
  xpathRowProduct = "//tr[@class ='sb-table__row row-product-list']";
  xpathNoMatching = "//p[normalize-space() = 'No matching results found']";
  xpathNoProduct = '//p[normalize-space() = "You haven\'t created any products."]';
  xpathImagePreview = "//div[@class = 'sb-popup__container sb-absolute sb-w-100']//img";
  xpathTitlePopup = "//div[contains(@class,'sb-popup__container')]//div[@class = 'sb-popup__header']//div//div";
  xpathDescriptionPopup = "//div[contains(@class,'sb-popup__container')]//div[contains(@class,'sb-text-body')]";
  xpathDownSellStatus =
    "//p[normalize-space()='Downsell offer']//parent::div//following-sibling::div//span[normalize-space()='Inactive']";
  xpathBtnAcceptOffer = "//section//div[contains(@class,'variant-form__container')]//button//span";
  xpathBtnRejectOffer = "//section//div[contains(@class,'variant-form__container')]//p";
  xpathLoadingTab = "//div[@class='sb-skeleton__settings']";
  xpathUpsell = "//h4[normalize-space()='Upsell']//ancestor::div[@class='row']//div[@class='sb-block']";
  private xpathMediaUploaded =
    "//div[contains(@class,'sb-image sb-relative')]//img[contains(@src, 'img')]|//mux-player[@class='media-iframe']";

  private xpathAddProductButton =
    "//button[normalize-space()='Add product' and contains(@class, 'sb-button-primary')]|//button[normalize-space()='Add product' and contains(@class, 'sb-mt-large sb-button')]";
  xpathGeneralTab = "//div[contains(@class,'sb-tab-navigation')]//div[text()='General']";
  xpathAllProductsHeader = "//div[@class = 'sb-font sb-flex sb-flex-grow']//*[normalize-space() = 'All products']";
  private xpathAddChapterButton = "//button[normalize-space()='Add Chapter']|//span[normalize-space()='Add Chapter']";
  xpathBackScreen = "//*[@id = 'Icons/Navigation/Back-(line)']/ancestor::button";
  private xpathClosePreview = "//*[@id = 'Icons/Navigation/Close-(line)']/ancestor::button";
  private xpathHoverImage = "//div[contains(@class, 'sb-image--medium')]//img";
  private xpathViewImage = "//*[@id = 'Icons/Eye']/ancestor::button[contains(@class, 'only-icon--small')]";
  private xpathDeleteImage = "//*[@id = 'Icons/Trash']/ancestor::button[contains(@class, 'only-icon--small')]";
  private xpathDeleteTextLink = "//label[normalize-space() = 'Media']/parent::div//div[normalize-space() = 'Delete']";
  xpathSaveButton = "//div[contains(@class,'action-bar')]//button[contains(@class,'primary')]";
  private xpathInputPricingTitle = "(//input[@placeholder='Free, Standard Plan, Professional Plan, etc.'])[last()]";
  private xpathViewIconButton =
    "//div[@class = 'bg-icon-eye']//button[contains(@class, 'sb-button--only-icon--small')]";
  private xpathImage = "//div[@class='dp-image__container image__container sb-mr-medium']//img";
  private xpathActiveFilter = "//div[@class = 'sb-collapse-item sb-p-medium sb-collapse-item--active']";
  private xpathTextFilter = "//div[contains(@class,'sb-mt-medium')]//input[contains(@type,'text')]";
  private xpathApplyButton = "//button//span[contains(text(),'Apply')]";
  private xpathPreviewButton = "//button[normalize-space() = 'Preview']";
  xpathMoreFilter = "//span[normalize-space()='More filters']";
  private xpathButtonDelete = "//button[normalize-space() = 'Delete']";
  private xpathDeleteConfirmPopup =
    "//div[contains(@class, 'sb-popup__footer-container')]//button[normalize-space() = 'Delete']";
  xpathMedia =
    "//div[@class = 'sb-image sb-relative sb-pointer sb-overflow-hidden sb-image--medium']//img|//mux-player[@class='media-iframe']";
  private xpathBtnSave = "//div[contains(@class,'checkout__container')]//span[normalize-space()='Save']";
  xpathToastMsg = "//*[@class = 'sb-toast__message sb-text-body-emphasis sb-toast__message--pr12']";
  private xpathEditFileName = "(//div[@class = 'sb-mt-large']//input[@class = 'sb-input__input'])[3]";
  private xpathBtnAdd = "//button[normalize-space() = 'Add']";
  xpathInputSchedule = "//input[@placeholder = 'https://calendly.com/yourname/coach']";
  private xpathInputCustomLink = "/parent::div//input[@placeholder = 'https://customlink.com/yourname/coach']";
  private xpathCheckCustomLink = "//span[normalize-space() = 'Custom calendar link']";
  private xpathInputFile =
    "//label[normalize-space()='Resources']//parent::div//following-sibling::div//input[@type='file']";
  private xpathInputThumbnail = "(//div//input[@type='file'])[1]";
  xpathCompletePopup = "//div[contains(@class, 'sb-p-medium sb-collapse-item--active')]//p[normalize-space() = '100%']";
  xpathInputTitle = "//label[normalize-space()='Title']//parent::div[contains(@class,'activated')]//input";
  xpathNameProduct = "//div[@class='sb-description sb-flex-grow']//div[contains(@class,'sb-title-ellipsis')]";
  xpathCurrency = "//div[normalize-space() = 'USD' and contains(@class, 'sb-input__prepend')]";
  xpathInputMaximumMember =
    "//label[normalize-space() = 'Maximum member']/parent::div//input[@class = 'sb-input__input']";
  xpathQuantityLimit = "//div[normalize-space() = 'Access limit']/ancestor::div[3]//input[@value = 'false']";
  xpathBtnMoreAction = "//div[@class='sb-actions-group']//button[contains(@class, 'sb-button--only-icon--medium')]";
  xpathAlertUploadFailed =
    "//div[contains(@class, 'sb-alert__title') and normalize-space() = 'Fail to upload file. Please try again.']";
  xpathHeaderPopUp =
    "//div[@class = 'sb-popup']//div[normalize-space() = 'Activate offer' and @class = 'sb-popup__header']";
  xpathPricingType1 =
    "//label[normalize-space()='Pricing type']//parent::div//button[contains(@class,'sb-button--select')]";
  xpathTextMetaDescription =
    "//label[normalize-space() = 'Meta description']//parent::div//following-sibling::div//textarea";
  xpathPaymentDisable = "//div[@class = 'settings-nav__action disabled']//*[normalize-space() = 'Payment providers']";
  xpathTextError = "//div[contains(@class,'hide-header')]//p[@class='text-error']";

  //--------------------------------------
  xpathProductTitle = "//div[contains(@class,'activated')][descendant::label[normalize-space()='Title']]//input";
  xpathPageTitle = "//div[contains(@class,'sb-form-item')][descendant::label[normalize-space()='Page title']]//input";
  xpathMetaDescription =
    "//div[contains(@class,'sb-form-item')][descendant::label[normalize-space()='Meta description']]//textarea";
  xpathPrice = "(//div[contains(@class,'sb-form-item')][descendant::label[normalize-space()='Price']]//input)[last()]";
  xpathPricingName =
    "(//div[contains(@class,'sb-form-item')][descendant::label[normalize-space()='Name']]//input )[last()]";
  xpathPricingType = "(//div[contains(@class,'choose-pricing-type')]//span[normalize-space()='Paid'])[last()]";
  xpathLimitAccess =
    "(//span[@class='sb-check'][following-sibling::span[normalize-space()='Limit number of access']])[last()]";
  xpathNumberOfAccess =
    "(//div[contains(@class,'sb-form-item')][descendant::label[normalize-space()='Number of access']]//input)[last()]";
  xpathBtnAddPricingOption = "(//button[descendant::span[normalize-space()='Add pricing option']])[last()]";
  xpathChapterTitle = "//div[contains(@class,'sb-form-item')][descendant::label[normalize-space()='Title']]//input";

  xpathWarning = "//div[contains(@class,'sb-alert__warning sb-alert')]";
  xpathAlertTitle =
    "(//div[contains(@class,'sb-alert__warning sb-alert')]//div[contains(@class,'sb-alert__title')])[1]";
  xpathBtnViewPlan = "(//div[contains(@class,'sb-alert__warning sb-alert')]//a)[1]";

  xpathListPricing = "//div[contains(@class,'access')]//thead//th//span";
  xpathBtnAddLesson = "(//div[@class='draggable-item-section']//button[normalize-space()='Add lesson'])[last()]";
  xpathInputLessonTitle = "(//div[@class='draggable-item-section'])[last()]//textarea";

  /**
   * click button Add product to open add new product screen
   */
  async openAddProductScreen() {
    await this.page.click(this.xpathAddProductButton);
  }

  /**
   * function input value to product title and not click add product button
   * @param title
   */
  async inputProductTitle(title: string) {
    if (title) {
      await this.page.fill(this.getXpathInputWithLabel("Title"), title);
    }
  }

  /**
   * function input value to product title and not click add product button
   * @param title
   */
  async inputProductDescription(description: string) {
    if (description) {
      await this.page
        .frameLocator(`//iframe[@id='tinyMceCreator_ifr' or @id='general_ifr']`)
        .locator("//body[@id='tinymce']")
        .fill(description);
    }
  }

  async getProductDescription(): Promise<string> {
    const value = await this.page
      .frameLocator("//iframe[@id='tinyMceCreator_ifr' or @id='general_ifr']")
      .locator("//body[@id='tinymce']//p")
      .textContent();
    return value;
  }

  /**
   /*
   * then input info: cho digital product
   * @param: title is value of product title
   * @param: handle is value of handle
   * @param: productType is type of product
   */
  async addNewProduct(title: string, productType?: string, handle?: string) {
    if (title) {
      await this.page.fill(this.getXpathInputWithLabel("Title"), title);
    }
    if (handle) {
      await this.page.fill(this.getXpathInputWithLabel("URL and handle"), handle);
    }
    await this.page.check(this.getXpathCheckboxProductType(productType));
    await this.page.click(this.xpathAddProductButton);
  }

  /*
   * then input info, if you want cancel process create product, click button Cancel
   */
  async clickCancelButton() {
    await this.clickOnBtnWithLabel("Cancel");
    const waitCreateProduct = await this.page.waitForSelector(this.xpathAllProductsHeader);
    await waitCreateProduct.waitForElementState("stable");
  }

  /**
   * get digital product from current url
   */
  async getDigitalProductID() {
    const url = this.page.url();
    const urlParts = url.split("/");
    const campaignID = urlParts[6].split("?");
    return campaignID[0];
  }

  async getSectionID(): Promise<number> {
    const url = this.page.url();
    const urlParts = url.split("/");
    const sectionId = Number(urlParts[8]);
    return sectionId;
  }

  /**
   * Upload file for product
   * @param xpathFile is path file image or any files
   */
  async uploadThumbnailProduct(xpathFile: string, file?: string) {
    if (file === "link") {
      await this.page.fill(`${this.getXpathInputWithLabel("or embed external link")}`, xpathFile);
      await this.page.click(this.xpathBtnAdd);
    } else {
      await this.page.setInputFiles("//div//input[@type='file']", xpathFile);
    }
  }

  /**
   * input title, handle, description of general tab
   * @param title is value of product title
   * @param handle is value of handle
   * @param productType is type of product
   */
  async inputInfoGeneral(title: string, handle?: string, description?: string) {
    if (title) {
      await this.page.fill(this.getXpathInputWithLabel("Title"), title);
    }
    if (handle) {
      await this.page.fill(this.getXpathInputWithLabel("URL and handle"), handle);
    }
    if (description) {
      await this.page
        .frameLocator("(//iframe[@title = 'Rich Text Area'])[1]")
        .locator("//body[contains(@class,'content-body')]")
        .fill(description);
    }
  }

  /**
   * Upload file for product
   * @param xpathFile is path file image or any files
   */
  async uploadFileOrMedia(block: string, xpathFile: string, file?: string) {
    if (block === "Resources") {
      if (file === "link") {
        await this.page.fill(`${this.getXpathInputWithLabel("Or embed external link")}`, xpathFile);
        await this.page.click(this.xpathBtnAdd);
        await this.clickSaveBar();
      } else {
        await this.page.setInputFiles(this.xpathInputFile, xpathFile);
        await this.waitForUpload();
      }
    } else {
      await this.page.setInputFiles(this.xpathInputThumbnail, xpathFile);
      await this.waitForUpload();
    }
  }

  /**
   * switch tab on digital product detail
   */
  async switchTab(nameTab: string) {
    await this.page.click(`//div[contains(@class,'sb-tab-navigation')]//div[text()='${nameTab}']`);
  }

  /**
   * click button add section on digital product detail
   */
  async clickAddSection() {
    await this.page.click(this.xpathAddChapterButton);
  }

  /**
   * Input section info for digital product online course
   * @param title input value for Title of section or lecture
   * @param description input value for Description of Section or lecture
   */
  async inputSectionOrLectureInfo(title: string, description?: string, status?: string, type?: string) {
    if (title) {
      if (type === "Digital download") {
        await this.page.fill(`${this.getXpathInputWithLabel("Heading (optional)")}`, title);
      } else {
        await this.page.fill(`${this.getXpathInputWithLabel("Title")}`, title);
      }
    }
    if (description !== "") {
      await this.page
        .frameLocator("//iframe[@title = 'Rich Text Area']")
        .locator("//body[contains(@class,'content-body')]")
        .fill(description);
    }
    if (status !== "unpublished") {
      await this.page.check(this.getXpathCheckboxStatus(status));
    }
  }

  /**
   * click button Add Lecture on section list
   * @sectionName: Add lecture for section with section name
   */
  async clickAddLecture(sectionName: string) {
    await this.page.click(
      `//*[normalize-space() = '${sectionName}']/parent::div//span[normalize-space() = 'Add lesson']`,
    );
  }

  /**
   * click to back to preview screen
   */
  async clickBackScreen() {
    await this.page.click(this.xpathBackScreen);
  }

  /**
   * click button Save on Save bar
   */
  async clickSaveBar() {
    await this.clickOnBtnWithLabel("Save", 1);
  }

  /**
   * Check message after create product fail or success
   * @param message input data message success
   * @param errMsg input data message error
   */
  async checkMsgAfterCreated(errMsg: string) {
    await this.page.waitForSelector(`//*[contains(text(),"${errMsg}")]|//*[contains(text(),'${errMsg}')]`);
  }

  /**
   * click button View image after upload
   */
  async clickButtonViewImage() {
    await this.hoverThenClickElement(this.xpathHoverImage, this.xpathViewImage);
  }

  /**
   * click button Delete image after upload
   */
  async clickButtonDeleteImage() {
    await this.hoverThenClickElement(this.xpathHoverImage, this.xpathDeleteImage);
  }

  /**
   * click button Delete Media after upload
   */
  async clickButtonDeleteMedia() {
    await this.page.click(this.xpathDeleteTextLink);
    await this.page.click(this.xpathDeleteConfirmPopup);
    await this.page.reload();
  }

  /**
   * click close popup preview image after upload
   */
  async clickClosePreview() {
    await this.page.click(this.xpathClosePreview);
  }

  /**
   * Input content info for digital download
   * @param title input value for Title of section or lecture
   * @param status select status for content of digital download
   */
  async inputContentInfo(title: string, status?: string) {
    if (title) {
      await this.page.fill(this.getXpathInputWithLabel("Heading (optional)"), title);
    }

    if (status) {
      const ischeck = await this.page.isChecked(`//input[@value = '${status}']/parent::label//span`);
      if (ischeck === false) {
        await this.page.check(this.getXpathCheckboxStatus(status));
      }
    }
  }

  /**
   * Click to view sale page, content of product from product detail
   * @param pageView type of page on storefront: View sale page or view content
   */
  async clickToViewFromDetail(pageView: string) {
    await this.page.click(this.xpathPreviewButton);
    await this.page.click(`(//li[normalize-space() = '${pageView}'])[last()]`);
  }

  /**
   * Nhập title khi config pricing cho product
   * @param title
   */
  async inputNamePricing(title: string) {
    await this.genLoc(this.xpathPricingName).fill(title);
  }

  /**
   * Setting ở tab Pricing khi chọn pricing type là One-time payment
   * @param pricingType là loại pricing
   * @param title là title của pricing
   * @param value là giá của product
   */
  async settingPricingTab(pricingType: string, title: string, value: number) {
    if (pricingType === "Paid") {
      await this.selectPaymentType(pricingType);
      await this.inputNamePricing(title);
      await this.inputPrice(value);
    }
  }

  /**
   * fill value to field Amount on Pricing tab
   * @param value
   */
  async inputPrice(value: number) {
    await this.page.fill(this.xpathPrice, value.toString());
  }

  /**
   * select pricing type on pricing tab
   * @param paymentType
   */
  async selectPaymentType(paymentType: string) {
    await this.page.click(this.xpathPricingType);
    await this.page.click(`//li[normalize-space() = '${paymentType}']`);
  }

  /**
   * click member product on product list
   */
  async clickMemberProduct(productMember: string) {
    await this.page.click(this.getXpathClickMember(productMember));
  }

  /**
   * Get src image from image default or image uploaded
   * @param imageDefault: yes|no
   * @returns
   */
  async getAttributeImage(imageDefault?: string) {
    const linkMedia = this.page.getAttribute(
      "//div[@class='dp-image__container image__container sb-mr-medium']//img",
      "src",
    );
    if (imageDefault === "yes") {
      const media = (await linkMedia).substring(0, 15);
      return media;
    } else {
      const media = (await linkMedia).substring((await linkMedia).lastIndexOf("products/"));
      return media;
    }
  }

  /**
   * filter list product by value
   * @param typeFilterProduct input condition filter
   * @param valueFilterProduct input value condition filter
   * @param textFilter  input text search filter
   */
  async filterByValue(typeFilterProduct: string, valueFilterProduct: string, textFilter?: string) {
    await this.page.click(this.xpathMoreFilter);
    if ((await this.page.locator(this.xpathActiveFilter).count()) === 0) {
      await this.page.click(`(//div[contains(text(),'${typeFilterProduct}')])[last()]`);
    }
    await this.page.click(`//span[normalize-space()="${valueFilterProduct}"][last()]`);

    if (textFilter) {
      await this.genLoc(this.xpathTextFilter).fill(textFilter);
    }
    await this.page.click(this.xpathApplyButton, { delay: 2000 });
    await this.page.waitForSelector(`${this.xpathRowProduct}|${this.xpathNoMatching}`);
  }

  /**
   * Get list product by status
   * @param status : publish , unpublish
   * @returns
   */
  async getProductOnListByStatus(status: string): Promise<number> {
    const countProduct = await this.page.locator(`//span[normalize-space()='${status}']`).count();
    return countProduct;
  }

  /**
   * Get list product by type
   * @param type: Online course, Coaching session, Digital download, Customization service
   * @returns
   */
  async getProductOnListByType(type: string): Promise<number> {
    const countProduct = await this.page.locator(`//p[normalize-space()='${type}']`).count();
    return countProduct;
  }

  /**
   * Get list product by title
   * @param title: product name
   * @returns
   */
  async getProductOnListByTitle(title: string): Promise<number> {
    const countProduct = await this.page
      .locator(`//div[contains(@class,'dp-table-list-product')]//p[contains(text(),'${title}')]`)
      .count();
    return countProduct;
  }

  /**
   * verify Number Product on list product
   */
  async verifyNumberProduct() {
    return await this.page.locator(this.xpathRowProduct).count();
  }

  /**
   * more action 1 product on list product
   */
  async moreAction(productName: string, moreAction: string) {
    await this.page.click(`${this.getXpathProductName(productName)}/ancestor::tr//*[name()='g' and @id='Icons/More']`);
    await this.page.click(`(//li[normalize-space()='${moreAction}'])[last()]`);
    if (moreAction === "Delete") {
      await this.page.click(this.xpathButtonDelete);
    }
    await this.page.reload();
  }

  /**
   * more action Multi product on list product
   */
  async moreActionMultiProducts(moreAction: string) {
    await this.page.click("(//span[@class='sb-check'])[1]");
    await this.page.click("//span[@class='sb-button--label']");
    await this.page.click(this.getXpathMoreAction(moreAction));

    if (await this.page.isVisible(this.xpathButtonDelete)) {
      await this.page.click(this.xpathButtonDelete);
    }
    await this.page.reload();
  }

  /**
   * Click to view sale page, content of product from product list
   * @param productName product need to view on storefront page
   * @param pageView type of page on storefront: View sale page or view content
   */
  async clickToViewSF(productName: string, pageView: string) {
    await this.hoverThenClickElement(
      this.getXpathProductName(productName),
      `${this.getXpathProductName(productName)}/ancestor::tr${this.xpathViewIconButton}`,
    );
    await this.page.click(
      `(//div[@class = 'sb-dropdown-menu sb-py-small']//li[normalize-space() = '${pageView}'])[last()]`,
    );
  }

  /**
   * search product on product list
   */
  async searchProduct(product: string) {
    await this.genLoc('[placeholder="Search products"]').fill(product);
    await this.genLoc('[placeholder="Search products"]').press("Enter");
    await this.page.waitForSelector(`${this.xpathRowProduct}|${this.xpathNoMatching}`);
  }

  /**
   * click title product on product list
   */
  async clickTitleProduct(productName: string) {
    await this.page.click(this.getXpathProductName(productName));
  }

  /**
   * click thumbnail product on product list
   */
  async clickThumbnailProduct(productName: string) {
    await this.page.click(`${this.getXpathProductName(productName)}/ancestor::tr${this.xpathImage}`);
  }

  /**
   * wait for media loaded on media of lecture
   */
  async waitForMedia() {
    await (await this.page.waitForSelector(this.xpathMediaUploaded)).isVisible();
    const wait = await this.page.waitForSelector(this.xpathMedia);
    await wait.waitForElementState("stable");
  }

  /**
   * get xpath to verify expect for column title
   * @param columnName column title on Product List page
   * @returns
   */
  getXpathColumnProductList(columnName: string): Locator {
    return this.genLoc(`//div[@class='cell']//span[normalize-space()='${columnName}']`);
  }

  /**
   * get xpath to verify product title on product list
   * @param productName Title of product
   * @returns
   */
  getXpathProductNameOnList(productName: string): Locator {
    return this.genLoc(`//p[normalize-space()='${productName}']`);
  }

  /**
   * get xpath to verify product title on product detail
   * @param productName Title of product
   * @returns
   */
  getXpathProductNameOnDetail(productName: string): Locator {
    return this.genLoc(`//div[normalize-space()='${productName}']`);
  }

  /**
   * return xpath of the row value on product list
   * @param productName: product title on product list
   * @param value: value of cell on product row
   * @returns
   */
  getXpathTypeProduct(productName: string, value: string): Locator {
    return this.genLoc(`(${this.getXpathProductName(productName)}/parent::div/p[normalize-space()='${value}'])[1]`);
  }

  /**
   * return xpath of status in the row value on product list
   * @param productName: product title on product list
   * @param value: published|unpublished
   * @returns
   */
  getXpathValueOfCell(productName: string, status: string): Locator {
    return this.genLoc(
      `(${this.getXpathProductName(productName)}/ancestor::tr//div[normalize-space()='${status}'])[1]`,
    );
  }

  getXpathInputWithLabel(label: string, index = 1) {
    return `(//*[normalize-space() = '${label}']/parent::div//input)[${index}]`;
  }

  getXpathCheckboxProductType(productType: string) {
    return `//label[descendant::*[normalize-space()='${productType}']]//span`;
  }

  getXpathInputFile(typeFile: string, isCheckValueClass?: boolean) {
    if (isCheckValueClass) {
      return `(//label[@class='${typeFile}']/ancestor::div[2]//input[@type='file'])`;
    } else {
      return `(//label[normalize-space() = '${typeFile}']/ancestor::div[2]//input[@type='file'])`;
    }
  }

  getXpathCheckboxStatus(status: string) {
    return `//input[@value = '${status}']/parent::label//span`;
  }

  getXpathClickMember(member: string) {
    return `//div[contains(@class,'cell')][normalize-space()='${member}']//div`;
  }

  getXpathProductName(productName: string) {
    return `//p[normalize-space()='${productName}']`;
  }

  getXpathMoreAction(action: string) {
    return `//li[@class='sb-dropdown-menu__item sb-is-capitalized'][normalize-space()='${action}']`;
  }

  /**
   * select các product tai list product
   * @param productName: name của product
   */
  async selectProductOnList(productName: string) {
    await this.page.click(`//p[normalize-space()='${productName}']//ancestor::tr//span[@class='sb-check']`);
  }

  async clickBtnAddUpsell(buttonText: string) {
    await this.waitUntilElementInvisible("//span[@class='sb-button--loading-state']");
    await this.page.click(
      `//button[contains(@class,'sb-button--medium is-round')]//span[normalize-space()='${buttonText}']`,
    );
    await this.genLoc(this.xpathTitlePopup).isVisible();
  }

  async searchAndSelectProductUpsell(productUsell: string) {
    await this.genLoc("//div[@class='sb-spinner sb-relative sb-spinner--medium']").isHidden();
    await this.page.fill("//div//input[@placeholder='Search products']", productUsell);
    await this.genLoc("//div[@class='sb-spinner sb-relative sb-spinner--medium']").isHidden();
    await this.page.click(`//span[normalize-space()='${productUsell}']`);
  }

  /**
   * click button on popup select product upsell
   */
  async clickBtnOnPopup(buttonName: string) {
    await this.page.click(`//div[contains(@class,'sb-popup__footer')]//span[normalize-space()='${buttonName}']`);
  }

  async clickToggleStatusUpsell(productName: string) {
    await this.page.click(
      `//p[normalize-space()='${productName}']//ancestor::div[contains(@class,'offers-group-item')]//span[@class='sb-flex sb-flex-align-center']`,
    );
  }

  async OpenPopupDeleteOfferProduct(productName: string) {
    await this.page.click(
      `//p[normalize-space()='${productName}']/ancestor::div[contains(@class,'sb-mr-medium')]//parent::div//span[contains(@class,'icon')]`,
    );
  }

  /**
   * Apply design offer upsell, downsell
   *    -- click design offer
   *    -- click apply theme
   *    -- click exit
   */
  async applyDesignOffer(btnName: string, themeName: string): Promise<void> {
    await this.clickBtnOnPopup(btnName);
    await this.page.click(
      `//p[normalize-space()='${themeName}']//parent::div//figure//span[normalize-space()='Apply']`,
    );
    await this.page.click("//button[normalize-space()='Exit']");
  }

  /**
   * click button Save with general tab
   */
  async clickSaveGeneral() {
    await this.page.click("//div[contains(@class, 'action-bar__container')]//span[normalize-space() = 'Save']");
  }

  /**
   * Tương tác các mục có trong digital product ở dashboard
   * @param option
   */
  async selectActionDPro(option: string) {
    switch (option) {
      case "Back":
        await this.page.click("//button[contains(@class, 'sb-btn-back')]");
        await this.page.waitForLoadState("networkidle");
        break;
      case "Duplicate":
      case "Delete":
        await this.page.click("//div[contains(@class, 'button-desktop')]/descendant::button[1]");
        await this.page.click(`//div[@x-placement='bottom-start']/descendant::li[normalize-space()='${option}']`);
        break;
      case "Preview sales page":
      case "Preview content as member":
        await this.page.click("//button[contains(@class, 'sb-button') and normalize-space()='Preview']");
        await this.page.click(`//div[@x-placement='bottom-start']/descendant::li[normalize-space()='${option}']`);
        await this.page.waitForLoadState("networkidle");
        break;
      case "Design sales page":
      case "Publish":
      case "Unpublish":
        await this.page.click(`//button[normalize-space()='${option}']`);
        await this.page.waitForLoadState("networkidle");
        break;
      case "General":
      case "Content":
      case "Pricing":
      case "Checkout":
        await this.page.click(`//div[contains(@class,'navigation__item') and normalize-space()='${option}']`);
        break;
      default:
        throw new Error("Invalid option");
    }
  }

  /**
   * Update thông tin của product sau khi tạo mới
   * @param updateProduct: update các tab general, pricing, checkout
   */
  async updateProductDigital(updateProduct: ProductUpdate) {
    if (updateProduct.thumbnail_type) {
      await this.uploadFileOrMedia(updateProduct.thumbnail_type, updateProduct.thumbnail_file_path);
    }
    if (updateProduct.pricing_type) {
      await this.switchTab("Pricing");
      await this.settingPricingTab(
        updateProduct.pricing_type,
        updateProduct.pricing_title,
        updateProduct.pricing_amount,
      );
      await this.waitUntilElementInvisible("(//span[@class='sb-button--loading-state'])[1]");
    }
    if (updateProduct.name_product_upsell) {
      await this.switchTab("Checkout");
      await this.clickBtnAddUpsell(updateProduct.button_name);
      await this.searchAndSelectProductUpsell(updateProduct.name_product_upsell);
      await this.clickBtnOnPopup(updateProduct.button_popup);
      if (await this.page.isVisible(this.xpathBtnSave)) {
        await this.page.click(this.xpathBtnSave);
      } else {
        await this.clickSaveGeneral();
      }
      await this.clickToggleStatusUpsell(updateProduct.name_product_upsell);
      await this.applyDesignOffer(updateProduct.button_apply_theme, updateProduct.theme_name);
    }
  }

  /**
   * Upload file for digital product
   * @param xpathFile is path file image or any files
   */
  async uploadDigitalDownload(typeFile: string, xpathFile: string) {
    if (typeFile === "link") {
      await this.page.fill(`${this.getXpathInputWithLabel("Or embed external link")}`, xpathFile);
      await this.page.click(this.xpathBtnAdd);
    } else {
      await this.page.setInputFiles(this.getXpathInputFile(typeFile), xpathFile);
    }
  }

  /**
   * wait for upload progress complete
   */
  async waitForUpload() {
    await this.page.waitForResponse(response => response.url().includes("dp-media.json") && response.status() === 200, {
      timeout: 60 * 1000,
    });
  }

  /**
   * After upload file, user can edit file name of file uploaded
   * @param: filename is the file need edit
   */
  async editFileName(filename: string, newName: string) {
    await this.hoverThenClickElement(
      `//div[normalize-space() = '${filename}']`,
      this.getXpathBtnEditFileName(filename),
    );
    await this.page.fill(this.xpathEditFileName, newName);
    await this.page.click(`${this.getXpathInputWithLabel("Or embed external link")}`);
  }

  /**
   * After upload file, user can delete file name of file uploaded
   * @param: filename is the file need edit
   */
  async deleteFile(filename: string) {
    await this.getXpathBtnDeleteAttachment(filename).click();
  }

  /**
   * input value for scheduling block on general tab with product coaching session
   * @param typeSchedule Embed booking calendar or Custom calendar link
   * @param schedule is link of calendar
   */
  async inputSchedule(typeSchedule: string, schedule: string) {
    if (typeSchedule === "Custom calendar link") {
      await this.page.check(this.xpathCheckCustomLink);
      await this.page.fill(`(//div[normalize-space() = '${typeSchedule}'])[1]${this.xpathInputCustomLink}`, schedule);
    } else {
      await this.page.fill(
        `(//div[normalize-space() = '${typeSchedule}'])[1]/parent::div${this.xpathInputSchedule}`,
        schedule,
      );
    }
  }

  async updateProductTitle(newTitle: string): Promise<void> {
    await this.genLoc(this.xpathInputTitle).fill(newTitle);
    await this.page.click(this.xpathSaveButton);
    await waitTimeout(3 * 1000);
  }

  async clickBtnSelectProductDownSell(productUpsell: string) {
    await this.page.click(
      `//p[normalize-space()='${productUpsell}']//ancestor::div[@class='offers-group__container']//a[normalize-space()='Select product']`,
    );
  }

  async getStatusOffer(productName: string): Promise<string> {
    const status = await this.getTextContent(
      `//p[normalize-space()='${productName}']//ancestor::div[@class='sb-p-medium offer__container offers-group-item']//span[contains(@class,'sb-badge__primary')]|//p[normalize-space()='${productName}']//ancestor::div[@class='sb-p-medium offer__container offers-group-item']//span[contains(@class,'sb-badge__default')]`,
    );
    return status;
  }

  async clickBtnDesignOffer(productName: string): Promise<void> {
    await this.page.click(
      `//p[normalize-space()='${productName}']//ancestor::div[contains(@class,'sb-mt-medium')]//button//span[normalize-space()='Design offer']`,
    );
  }

  /**
   * Open block setting of web builder
   */
  async openBlockSettingsWebBuilder(): Promise<void> {
    await this.page.click(
      "//div[contains(@class,'sb-tab-navigation__item--default')]//div[normalize-space()='Settings']",
    );
  }

  getXpathAttachmentName(attachmentName: string): Locator {
    return this.genLoc(
      `(//div[@class='sb-draggable digital-product--file']//span[normalize-space()='${attachmentName}'])[1]`,
    );
  }

  getXpathFileOnPopOver(attachmentName: string): Locator {
    return this.genLoc(`//*[contains(@class, 'sb-collapse-item--active')]//p[normalize-space() = '${attachmentName}']`);
  }

  getXpathBtnDeleteAttachment(attachmentName: string): Locator {
    return this.genLoc(
      `(//div[normalize-space()='${attachmentName}']//button[contains(@class, 'sb-button--subtle--small')])[2]`,
    );
  }

  getXpathBtnEditFileName(attachmentName: string): string {
    return `(//div[normalize-space() = '${attachmentName}']//button[contains(@class, 'sb-button--subtle--small')])[1]`;
  }

  async openLessonDetail(chapterName: string, lessonName: string) {
    await this.getXpathLesson(chapterName, lessonName).click();
  }

  getXpathLesson(chapterName: string, lessonName: string): Locator {
    return this.genLoc(
      `//div[contains(@class, 'sb-collapse-item__title') and normalize-space() = '${chapterName}']/ancestor::div[contains(@class, 'online-course-collapse-item')]//div[normalize-space() = '${lessonName}']`,
    );
  }

  getXpathInputWithValue(status: string): Locator {
    return this.genLoc(`//input[@value = '${status}']/parent::label//span`);
  }

  getXpathTabTitle(tabName: string): Locator {
    return this.genLoc(`//div[contains(@class, 'item--active')]//div[normalize-space() = '${tabName}']`);
  }

  getXpathOfferUpsell(offerName: string): Locator {
    return this.genLoc(
      `(//p[normalize-space()='${offerName}'])[1]//parent::div//following-sibling::div[contains(@class,'sb-mt-medium')]`,
    );
  }

  /**
   * click button Connect payment providers on Pricing tab
   */
  async clickConnectPayment(): Promise<void> {
    await this.getXpathBtnWithLabel("Connect payment providers").click();
  }

  getXpathBtnWithLabel(label: string): Locator {
    return this.genLoc(`//button[normalize-space() = '${label}']`);
  }

  /**
   * get current url of website
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * turn on or turn off toggle of quantity limit, access limit, time limit on pricing tab
   * @param limitType Quantity limit/Access Limit/Time limit
   */
  async clickTogglePricing(limitType: string): Promise<void> {
    await this.page.click(
      `//div[normalize-space()='${limitType}']/ancestor::div[3]//span[contains(@class,'sb-switch__switch sb-relative')]`,
    );
  }

  /**
   * input value for maximum member of quantity limit
   * @param value maximum member
   */
  async inputMaxMember(value: string): Promise<void> {
    await this.page.click(this.xpathInputMaximumMember);
    await this.page.fill(this.xpathInputMaximumMember, value);
  }

  getXpathConditionalWithLabel(label: string): Locator {
    return this.genLoc(`//div[normalize-space() = '${label}']/ancestor::div[3]//input[@value = 'false']`);
  }

  async updateProduct(product: string, updateProduct: ProductUpdate): Promise<void> {
    await this.navigateToMenu("Products");
    await this.page.waitForTimeout(1000);
    await this.searchProduct(product);
    await this.clickTitleProduct(product);
    await this.updateProductDigital(updateProduct);
  }

  async openChapterDetail(chapterName: string) {
    await this.page.click(
      `//div[contains(@class, 'sb-collapse-item__title') and normalize-space() = '${chapterName}']`,
    );
  }

  async selectMoreActionOnProdDetail(action: string): Promise<void> {
    await this.page.click(this.xpathBtnMoreAction);
    await this.page.click(`//div[normalize-space() = '${action}' and @class = 'sb-flex sb-flex-align-center']`);
  }

  getXpathStatusOnProductList(productName: string): string {
    return `//p[normalize-space()='${productName}']/ancestor::tr//span[contains(@class, 'sb-badge sb-badge__default')]`;
  }

  getXpathOfferWithName(offerName: string): Locator {
    return this.genLoc(`//p[normalize-space()='${offerName}' and @class = 'product-name']`);
  }

  async selectActionOfChapterOrLesson(action: string) {
    await this.getXpathOptionWithLabel(action).click();
    if (action === "Delete") {
      await this.clickButtonOnPopUpWithLabel("Delete");
    }
  }

  getXpathOptionWithLabel(action: string): Locator {
    return this.genLoc(`(//div[@class = 'sb-dropdown-menu sb-py-small']//li[normalize-space() = '${action}'])[last()]`);
  }

  /**
   * get xpath of button on chapter/lesson in list content
   * @param action: type of action
   * @param chapterName
   * @param lessonName
   * @returns
   */
  getXpathActionChapterOrLesson(action: string, chapterName: string, lessonName?: string): Locator {
    const xpathChapter = `//div[normalize-space() = '${chapterName}']`;
    const xpathLesson = `//div[normalize-space() = '${lessonName}']`;
    const xpathBtnMoreAction = "//button[contains(@class, 'b-popover__reference')]";
    const xpathBadgeStatus =
      "//span[contains(@class, 'sb-badge sb-badge__default') or contains(@class, 'sb-badge__success')]";
    const xpathBtnView = "//button[contains(@class, 'sb-button--only-icon--small')]";
    switch (action) {
      case "more_actions":
        if (lessonName) {
          return this.genLoc(
            `${xpathChapter}/ancestor::div[@class = 'sb-flex sb-flex-justify-space-between']${xpathLesson}/parent::div[contains(@class, 'online-course-collapse-item-title')]${xpathBtnMoreAction}`,
          );
        } else {
          return this.genLoc(
            `${xpathChapter}/ancestor::div[@class = 'sb-collapse-item__left sb-flex']${xpathBtnMoreAction}`,
          );
        }
      case "status":
        if (lessonName) {
          return this.genLoc(
            `${xpathChapter}/ancestor::div[@class = 'sb-flex sb-flex-justify-space-between']${xpathLesson}/parent::div[contains(@class, 'online-course-collapse-item-title')]${xpathBadgeStatus}`,
          );
        } else {
          return this.genLoc(
            `${xpathChapter}/ancestor::div[@class = 'sb-collapse-item__left sb-flex']${xpathBadgeStatus}`,
          );
        }
      case "view":
        if (lessonName) {
          return this.genLoc(
            `${xpathChapter}/ancestor::div[@class = 'sb-flex sb-flex-justify-space-between']${xpathLesson}/parent::div[contains(@class, 'online-course-collapse-item-title')]${xpathBtnView}`,
          );
        } else {
          return this.genLoc(`${xpathChapter}/ancestor::div[@class = 'sb-collapse-item__left sb-flex']${xpathBtnView}`);
        }
    }
  }

  async clickToExpandChapter(chapterName: string) {
    await this.page.click(
      `//div[normalize-space() = '${chapterName}']/ancestor::div[contains(@class, 'sb-collapse-item__header')]//div[contains(@class, 'sb-collapse-item--visible')]`,
    );
  }

  async inputPageTitle(pageTitle: string) {
    await this.page.fill(this.getXpathInputWithLabel("Page title"), pageTitle);
  }

  async inputMetaDescription(description: string) {
    await this.page.fill(this.xpathTextMetaDescription, description);
  }

  getXpathMsgCharacter(label: string): Locator {
    return this.genLoc(
      `//label[normalize-space() = '${label}']//parent::div//following-sibling::div//div[contains(@class, 'sb-form-item__message')]`,
    );
  }

  getXpathTypeFilterProduct(typeFilterProduct: string): Locator {
    return this.genLoc(`//div[contains(@class,'sb-filter__body')]//div[contains(text(),'${typeFilterProduct}')]`);
  }

  getXpathValueFilterProduct(typeFilterProduct: string, valueFilterProduct: string): Locator {
    return this.genLoc(
      `//div[normalize-space()='${typeFilterProduct}']//ancestor::div[contains(@class,'sb-collapse-item--active')]//span[normalize-space()="${valueFilterProduct}"]`,
    );
  }

  getXpathClearValueFilter(typeFilterProduct: string): Locator {
    return this.genLoc(
      `//div[normalize-space()='${typeFilterProduct}']//ancestor::div[contains(@class,'sb-collapse-item--active')]//a[normalize-space()='Clear']`,
    );
  }

  getXpathClearAllFilters(): Locator {
    return this.genLoc(`//span[normalize-space()='Clear all filters']`);
  }

  getxpathTextFilter(placeholder: string): Locator {
    return this.genLoc(`//div[contains(@class,'sb-input')]//input[@placeholder='${placeholder}']`);
  }

  //------------------------

  /**
   * click button Add pricing option
   */
  async clickBtnAddPricingOption() {
    await this.genLoc(this.xpathBtnAddPricingOption).click();
  }

  /**
   * add Pricing option for product
   * @param pricing
   */
  async addPricingOption(pricing: Pricing) {
    await this.inputNamePricing(pricing.name);
    if (pricing.type == "Paid") {
      await this.genLoc(this.xpathPricingType).click();
      await this.inputPrice(pricing.price);
    }
    // if (pricing.access_limit.enabled) {
    //   await this.enableLimitNumberOfAccess(pricing.access_limit.enabled);
    //   await this.inputNumberOfAccess(pricing.access_limit.limit);
    // }
  }

  /**
   * enable limit number of access
   * @param enabled
   */
  async enableLimitNumberOfAccess(enabled: boolean) {
    if (enabled) await this.genLoc(this.xpathLimitAccess).check();
  }

  /**
   * enable input number of access
   * @param enabled
   */
  async inputNumberOfAccess(limit: number) {
    await this.genLoc(this.xpathNumberOfAccess).fill(limit.toString());
  }

  /**
   * add chapter in Content tab
   * @param chapter
   */
  async addChapter(chapter: Chapter) {
    await this.inputChapterTitle(chapter.title);
    await this.inputChapterDescription(chapter.description);
    await this.setChapterStatus(chapter.status);
    await this.clickSaveBar();
    await expect(this.genLoc(".sb-toast__message")).toHaveText("Added chapter successfully!");

    for (const lesson of chapter.lessons) {
      await this.inputLessonTitle(lesson.title);
    }
  }

  /**
   * input chapter title
   * @param title
   */
  async inputChapterTitle(title: string) {
    await this.genLoc(this.xpathChapterTitle).fill(title);
  }

  /**
   * input chapter description
   * @param description
   */
  async inputChapterDescription(description: string) {
    if (description) {
      await this.page
        .frameLocator("//iframe[@class='tox-edit-area__iframe']")
        .locator("//body[@id='tinymce']")
        .fill(description);
    }
  }

  /**
   * set chapter status
   * @param status
   */
  async setChapterStatus(status: string) {
    if (status) await this.genLoc(`//span[normalize-space()='${status}']`).check();
  }

  /**
   * click button Add Lesson
   */
  // cần wait để hiển thị đc ô input sau khi click btn
  async clickBtnAddLesson() {
    await this.genLoc(this.xpathBtnAddLesson).click();
    await this.waitAbit(500);
  }

  /**
   * set input Lesson Title
   * @param title
   */
  async inputLessonTitle(title: string) {
    if (!(await this.genLoc(this.xpathInputLessonTitle).isVisible())) {
      await this.clickBtnAddLesson();
    }
    await this.genLoc(this.xpathInputLessonTitle).fill(title);
    await this.clickBtnAddLesson();
  }

  /**
   * click btn Add Chapter
   */
  async clickBtnAddChapter() {
    await this.genLoc("//button[normalize-space()='Add Chapter']").click();
  }

  /**
   * get status access of Lesson
   *  - get Colum Index By Pricing Name
   *  - get Row Index By Lesson Title
   */
  async getStatusAccess(pricing: string, lessonTitle: string): Promise<boolean> {
    const colIndexByPricingName =
      (await this.genLoc(
        `//table[contains(@class,'sb-table__header sb-relative')]//th[normalize-space()='${pricing}']/preceding-sibling::th`,
      ).count()) + 1;
    const rowIndexByLessonTitle =
      (await this.genLoc(`//table//tr[child::td[normalize-space()='${lessonTitle}']]/preceding-sibling::tr`).count()) +
      1;

    return await this.genLoc(
      `//table[@class='sb-table__body']/tbody//tr[${rowIndexByLessonTitle}]//td[${colIndexByPricingName}]//input[@type='checkbox']`,
    ).isChecked();
  }

  /**
   * edit access: check or uncheck access
   * @param pricing,lessons
   */
  async editAccess(pricing: string, lessons: Array<string>) {
    const colIndexByPricing =
      (await this.genLoc(
        `//table[contains(@class,'sb-table__header sb-relative')]//th[normalize-space()='${pricing}']/preceding-sibling::th`,
      ).count()) + 1;

    const countLesson = await this.genLoc("//table//tr[@class='sb-table__row']").count();
    for (let i = 1; i <= countLesson; i++) {
      const xpathCheckboxAccess = `(//table//tr[contains(@class,'sb-table__row')])[${i}]//td[${colIndexByPricing}]//span`;
      const lessonName = await this.genLoc(
        `((//table//tr[contains(@class,'sb-table__row')])[${i}]//td[1]//div)[last()]`,
      ).textContent();

      if (lessons.includes(lessonName)) {
        await this.genLoc(xpathCheckboxAccess).check();
      } else {
        await this.genLoc(xpathCheckboxAccess).uncheck();
      }
    }
  }

  /**
   * edit delete Pricing
   * @param titlePricing
   */
  async deletePricing(titlePricing: string) {
    await this.genLoc(
      `//div[contains(@class,'tab-pricing')]//div[@class='draggable-item-offer']//div[contains(@class,'sb-collapse-item__header')][descendant::*[normalize-space()='${titlePricing}']]//button`,
    ).click();
    await this.genLoc(
      "//div[contains(@class,'sb-popup__container')]//button[child::span[normalize-space()='Delete']]",
    ).click();
  }
}
