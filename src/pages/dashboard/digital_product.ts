import { APIRequestContext, Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import type { DigitalProduct } from "@types";
import { DashboardPage } from "./dashboard";

/**
 * @deprecated: Split function into each page in src/shopbase_creator/(dashboard|storefront).
 * DON'T write all function hereF
 */
export class DigitalProductPage extends DashboardPage {
  xpathSelectPricingType = "(//button[contains(@class,'sb-button--select')])[1]";
  xpathTimelineMsgConfirm = `(//div[contains(@class, 'sb-timeline__content--message sb-flex')])[3]`;
  xpathTransactionId = `(//div[contains(@class, 'sb-timeline__content--message sb-flex')])[1]`;
  xpathConfirmCardCheckout = `(//div[contains(@class, 'sb-timeline__content--message sb-flex')])[2]`;
  xpathImageProductDetail =
    "//div[@class = 'sb-image sb-relative sb-pointer sb-overflow-hidden min-size sb-image--medium']//img";
  xpathThumbnailOnList = "//div[contains(@class,'image__container sb-mr-medium')]//img[contains(@src, 'img')]";
  xpathVerifyMemberHeader = "//div[contains(text(),'Members')]";
  xpathTooltipFilter = "//div[@class='sb-tag__caption sb-text-caption sb-pl-small sb-tooltip__reference']";
  xpathRowProduct = "//tr[@class ='sb-table__row row-product-list']";
  xpathNoMatching = "//p[normalize-space() = 'No matching results found']";
  xpathNoProduct = '//p[normalize-space() = "You haven\'t created any products."]';

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * click button Add product to open add new product screen
   */
  async openAddProductScreen() {
    await this.page.click("//div[contains(@class,'digital-product--list')]//span[normalize-space()='Add product']");
  }
  /**
   * function input value to product title and not click add product button
   * @param title
   */
  async inputTitleProduct(title: string) {
    if (title) {
      await this.page.fill("//*[normalize-space() = 'Title']/parent::div//input[@class = 'sb-input__input']", title);
    }
  }

  /*
   * then input info: title, handle, product_type cho digital product
   * @param: title is value of product title
   * @param: handle is value of handle
   * @param: productType is type of product
   */
  async addNewProduct(title: string, handle?: string, productType?: string) {
    if (title) {
      await this.page.fill("//*[normalize-space() = 'Title']/parent::div//input[@class = 'sb-input__input']", title);
    }
    if (handle) {
      await this.page.fill(
        "//*[normalize-space()='URL and handle']/parent::div//input[@class='sb-input__input sb-input__inner-prepend']",
        handle,
      );
    }
    if (productType && productType !== "Online course") {
      await this.page.check(`//input[@value = '${productType}']/ancestor::label//span`);
    }

    await this.page.click("//button[contains(@class,'sb-button-primary')]//span[normalize-space() = 'Add product']");
    try {
      const waitCreateProduct = await this.page.waitForSelector(
        "(//*[normalize-space() = 'General'])[1]|//div[@class = 'sb-form-item__message sb-text-caption sb-mt-small']",
      );
      await waitCreateProduct.waitForElementState("stable");
    } catch (e) {
      await this.page.reload();
    }
  }

  /*
   * then input info, if you want cancel process create product, click button Cancel
   */
  async clickCancelButton() {
    await this.clickOnBtnWithLabel("Cancel");
    const waitCreateProduct = await this.page.waitForSelector(
      "//div[@class = 'sb-font sb-flex sb-flex-grow']//*[normalize-space() = 'All products']",
    );
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

  /**
   * input title, handle, description of general tab
   * @param title is value of product title
   * @param handle is value of handle
   * @param productType is type of product
   */
  async inputInfoGeneral(title: string, handle?: string, description?: string) {
    if (title) {
      await this.page.fill("(//*[normalize-space()='Title']//input[@class='sb-input__input'])[1]", title);
    }
    if (handle) {
      await this.page.fill("(//label[normalize-space() = 'URL and handle']/parent::div//input)[1]", handle);
    }
    if (description) {
      await this.page
        .frameLocator("(//iframe[@title = 'Rich Text Area'])[1]")
        .locator("//body[contains(@class,'content-body')]")
        .fill(description);
    }
  }

  /**
   * Upload file for digital product
   * @param xpathFile is path file image or any files
   */
  async uploadFile(typeFile: string, xpathFile: string) {
    const xpathEmbedLink = "(//label[normalize-space() = 'Or embed external link']/parent::div//input)[1]";
    if (typeFile === "link") {
      await this.page.fill(
        `${xpathEmbedLink}|(//label[normalize-space() = 'or embed external link']/parent::div//input)[1]`,
        xpathFile,
      );
      await this.page.click("(//button[normalize-space() = 'Add'])[1]");
    } else {
      await this.page.setInputFiles(
        `//label[normalize-space() = '${typeFile}']/ancestor::div[2]//input[@type='file']`,
        xpathFile,
      );
    }
  }

  /**
   * switch tab on digital product detail
   */
  async switchTab(nameTab: string) {
    await this.page.click(`(//div[normalize-space() = '${nameTab}'])[2]`);
  }

  /**
   * click button add section on digital product detail
   */
  async clickAddSection() {
    await this.page.click("//button[normalize-space()='Add Chapter']|//span[normalize-space()='Add Chapter']");
  }
  /**
   * Input section info for digital product online course
   * @param title input value for Title of section or lecture
   * @param description input value for Description of Section or lecture
   */
  async inputSectionOrLectureInfo(title: string, description?: string, status?: string) {
    const xpathTitle = "//*[normalize-space()='Title']/parent::div//input[@class='sb-input__input']";
    const xpathSectionTitle =
      "//label[normalize-space()='Section title (optional)']/parent::div//input[@class='sb-input__input']";
    if (title) {
      try {
        await this.page.fill(`${xpathTitle}`, title);
        await this.page.click("//label[normalize-space() = 'Title']");
      } catch (e) {
        await this.page.fill(`${xpathSectionTitle}`, title);
        await this.page.click("//label[normalize-space() = 'Section title (optional)']");
      }
    }
    if (description !== "" && description) {
      await this.page
        .frameLocator("//iframe[@title = 'Rich Text Area']")
        .locator("//body[contains(@class,'content-body')]")
        .fill(description);
    }
    if (status && status !== "unpublished") {
      await this.page.check(`//input[@value = '${status}']/parent::label//span`);
    }
  }

  /**
   * click button Add Lecture on section list
   * @sectionName: Add lecture for section with section name
   */
  async clickAddLecture(sectionName: string) {
    await this.page.click(
      `//*[normalize-space() = '${sectionName}']/parent::div//button[normalize-space() = 'Add Lesson']`,
    );
  }

  /**
   * get text content from toast message after create something
   */
  async getTextOfToast(type: "success" | "danger") {
    if (type === "success") {
      await this.page.waitForSelector("//div[contains(@class, 'sb-toast__container--default')]");
      return await this.page.textContent(
        "//div[contains(@class, 'sb-toast__container--default')]//*[@class = 'sb-toast__message sb-text-body-emphasis sb-toast__message--pr12']",
      );
    } else {
      await this.page.waitForSelector("//div[contains(@class, 'sb-toast__container--danger')]");
      return await this.page.textContent(
        "//div[contains(@class, 'sb-toast__container--danger')]//*[@class = 'sb-toast__message sb-text-body-emphasis sb-toast__message--pr12']",
      );
    }
  }

  /**
   * click to back to preview screen
   */
  async clickBackScreen() {
    await this.page.click("//*[@id = 'Icons/Navigation/Back-(line)']/ancestor::button");
  }

  /**
   * click button Save on Save bar
   */
  async clickSaveBar() {
    await this.clickOnBtnWithLabel("Save");
  }

  /**
   * Check message after create product fail or success
   * @param message input data message success
   * @param errMsg input data message error
   */
  async checkMsgAfterCreated({ message, errMsg }: { message?: string; errMsg?: string }) {
    if (message) {
      await this.page.waitForSelector(`//*[contains(text(),"${message}")]`);
    }
    if (errMsg) {
      try {
        await this.page.waitForSelector(`//*[contains(text(),"${errMsg}")]`);
      } catch (e) {
        await this.page.waitForSelector(`//*[contains(text(),'${errMsg}')]`);
      }
    }
  }

  /**
   * click button View image after upload
   */
  async clickButtonViewImage() {
    await this.hoverThenClickElement(
      "//div[contains(@class, 'sb-image--medium')]//img",
      "//*[@id = 'Icons/Eye']/ancestor::button[contains(@class, 'only-icon--small')]",
    );
  }

  /**
   * click button Delete image after upload
   */
  async clickButtonDeleteImage() {
    await this.hoverThenClickElement(
      "//div[contains(@class, 'sb-image--medium')]//img",
      "//*[@id = 'Icons/Trash']/ancestor::button[contains(@class, 'only-icon--small')]",
    );
  }

  /**
   * click close popup preview image after upload
   */
  async clickClosePreview() {
    await this.page.click("//*[@id = 'Icons/Navigation/Close-(line)']/ancestor::button");
  }

  /**
   * Upload file for digital product
   * @param xpathFile is path file image or any files
   */
  async uploadDigitalDownload(typeFile: string, xpathFile: string) {
    if (typeFile === "link") {
      await this.page.fill("//label[normalize-space() = 'Or embed external link']/parent::div//input", xpathFile);
      await this.page.click("(//button[normalize-space() = 'Add'])[2]");
    } else {
      await this.page.setInputFiles(
        `//label[normalize-space() = '${typeFile}']/parent::div//input[@type='file']`,
        xpathFile,
      );
    }
  }

  /**
   * Input content info for digital download
   * @param title input value for Title of section or lecture
   * @param status select status for content of digital download
   */
  async inputContentInfo(title: string, status?: string) {
    const xpathSectionTitle =
      "//label[normalize-space()='Section title (optional)']/parent::div//input[@class='sb-input__input']";
    if (title) {
      await this.page.fill(`${xpathSectionTitle}`, title);
    }

    if (status) {
      const ischeck = await this.page.isChecked(`//input[@value = '${status}']/parent::label//span`);
      if (ischeck === false) {
        await this.page.check(`//input[@value = '${status}']/parent::label//span`);
      }
    }
  }

  /**
   * After upload file, user can edit file name of file uploaded
   * @param: filename is the file need edit
   */
  async editFileName(filename: string, newName: string) {
    await this.hoverThenClickElement(
      `//div[normalize-space() = '${filename}']`,
      `(//div[normalize-space() = '${filename}']//button[contains(@class, 'sb-button--subtle--small')])[1]`,
    );
    await this.page.fill(`(//div[@class = 'sb-mt-large']//input[@class = 'sb-input__input'])[2]`, newName);
    await this.page.click("//*[normalize-space() = 'Or embed external link']");
  }

  /**
   * After upload file, user can delete file name of file uploaded
   * @param: filename is the file need edit
   */
  async deleteFile(filename: string) {
    await this.page.click(
      `(//div[normalize-space() = '${filename}']//button[contains(@class, 'sb-button--subtle--small')])[2]`,
    );
  }

  /**
   * input value for scheduling block on general tab with product coaching session
   * @param typeSchedule Embed booking calendar or Custom calendar link
   * @param schedule is link of calendar
   */
  async inputSchedule(typeSchedule: string, schedule: string) {
    const xpathInputSchedule = "/parent::div//input[@placeholder = 'https://calendly.com/yourname/coach']";
    const xpathInputCustomLink = "/parent::div//input[@placeholder = 'https://customlink.com/yourname/coach']";
    if (typeSchedule === "Custom calendar link") {
      await this.page.check("//span[normalize-space() = 'Custom calendar link']");
      await this.page.fill(`(//div[normalize-space() = '${typeSchedule}'])[1]${xpathInputCustomLink}`, schedule);
    } else {
      await this.page.fill(`(//div[normalize-space() = '${typeSchedule}'])[1]${xpathInputSchedule}`, schedule);
    }
  }

  /**
   * search product on product list
   */
  async searchProduct(product: string) {
    await this.genLoc('[placeholder="Search products"]').fill(product);
    await this.genLoc('[placeholder="Search products"]').press("Enter");
    await this.page.waitForSelector(
      "//tr[@class ='sb-table__row row-product-list']|//p[normalize-space() = 'No matching results found']",
    );
  }

  /**
   * click title product on product list
   */
  async clickTitleProduct(productName: string) {
    await this.page.click(`//p[normalize-space()='${productName}']`);
  }

  /**
   * click thumbnail product on product list
   */
  async clickThumbnailProduct(productName: string) {
    const xpathProductName = `//p[normalize-space() = '${productName}']/ancestor::tr`;
    await this.page.click(`${xpathProductName}//div[@class='dp-image__container image__container sb-mr-medium']//img`);
  }

  /**
   * click tab checkout on product detail
   */
  async clickTabCheckout() {
    await this.page.click("//div[@tabindex='0']//div[text()='Checkout']");
  }
  /**
   * click on button Add your first upsell
   */
  async clickBtnAddUpsell(buttonText: string) {
    await this.page.click(
      `//button[contains(@class,'sb-button--medium is-round')]//span[normalize-space()='${buttonText}']`,
    );
  }

  /**
   * click button on popup select product
   */
  async clickBtnOnPopup(buttonName: string) {
    await this.page.click(`//div[contains(@class,'sb-popup__footer')]//span[normalize-space()='${buttonName}']`);
  }

  /**
   * search product upsell or downSell on popup select product
   */
  async searchAndSelectProductUpsell(productUsell: string) {
    await this.page.fill("//div//input[@placeholder='Search products']", productUsell);
    await this.page.click(`//span[normalize-space()='${productUsell}']`);
  }

  /**
   * click button select product downSell
   */
  async clickBtnSelectProductDownSell(productUpsell: string) {
    await this.page.click(
      `//p[normalize-space()='${productUpsell}']//ancestor::div[@class='offers-group__container']` +
        `//a[normalize-space()='Select product']`,
    );
  }

  /**
   * click toggle status upsell or downSell
   */
  async clickToggleStatusUpsell(productName: string) {
    await this.page.click(
      `//p[normalize-space()='${productName}']//ancestor::div[contains(@class,'offers-group-item')]//span[@class='sb-flex sb-flex-align-center']`,
    );
  }

  /**
   * Apply design offer upsell, downsell
   *    -- click design offer
   *    -- click apply theme
   *    -- click exit
   */
  async applyDesignOffer(themeName: string) {
    await this.page.click("//div[@class='sb-popup__footer sb-flex']//span[normalize-space()='Design offer']");
    await this.page.click(
      `//p[normalize-space()='${themeName}']//parent::div//figure//span[normalize-space()='Apply']`,
    );
    await this.page.click("//button[normalize-space()='Exit']");
  }

  /**
   * Get status offer after active
   */
  async getStatusOffer(productName: string) {
    const status = await this.getTextContent(
      `//p[normalize-space()='${productName}']//ancestor::div[@class='sb-p-medium offer__container offers-group-item']//span[contains(@class,'sb-badge__primary')]`,
    );
    return status;
  }

  /**
   * Delete product upsell, downSell
   */
  async deleteOfferProduct(productName: string) {
    await this.page.click(
      `//p[normalize-space()='${productName}']/ancestor::div[contains(@class,'sb-mr-medium')]` +
        `//parent::div//span[contains(@class,'icon')]`,
    );
  }

  /**
   * Click button Design offer upsell
   */
  async clickBtnDesignOffer(productName: string) {
    await this.page.click(
      `//p[normalize-space()='${productName}']//ancestor::div[contains(@class,'sb-mt-medium')]` +
        `//button//span[normalize-space()='Design offer']`,
    );
  }

  /**
   * Open block styles of web builder
   * - click icon open section
   * - click icon accept offer
   */
  async openBlockStyleWebBuilder(blockName: string) {
    await this.page.click(
      `//p[normalize-space()='${blockName}']//ancestor::div[contains(@class,'sb-pl-xs sb-pointer')]//button[@class='sb-p-xs w-builder__element-icon sb-pointer']`,
    );
    await this.page.click("//p[normalize-space()='Accept offer']");
  }

  /**
   * Open block setting of web builder
   */
  async openBlockSettingsWebBuilder() {
    await this.page.click(
      "//div[contains(@class,'sb-tab-navigation__item--default')]//div[normalize-space()='Settings']",
    );
  }

  /**
   * click tab setting oftion of web builder upsell
   */
  async clickTabSettingOptionUpsell() {
    await this.page.click("(//div[normalize-space()='Settings'])[2]");
  }

  /**
   * click member product on product list
   */
  async clickMemberProduct(productMember: string) {
    await this.page.click(`//div[contains(@class,'cell')][normalize-space()='${productMember}']//div`);
  }

  //get image thumbnail hiển thị của product
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
    await this.page.click("//span[normalize-space()='More filters']");

    if (
      (await this.page.locator("//div[@class = 'sb-collapse-item sb-p-medium sb-collapse-item--active']").count()) === 0
    ) {
      await this.page.click(`(//div[contains(text(),'${typeFilterProduct}')])[last()]`);
    }
    await this.page.click(`//span[normalize-space()="${valueFilterProduct}"][last()]`);

    if (textFilter) {
      await this.genLoc("//div[contains(@class,'sb-mt-medium')]//input[contains(@type,'text')]").fill(textFilter);
    }
    await this.page.click("//button//span[contains(text(),'Apply')]", { delay: 2000 });
    await this.page.waitForSelector(
      "//tr[@class ='sb-table__row row-product-list']|//p[normalize-space() = 'No matching results found']",
    );
  }

  /**
   * verify Number Product on list product
   */
  async verifyNumberProduct() {
    return await this.page.locator("//tr[@class ='sb-table__row row-product-list']").count();
  }

  /**
   * more action 1 product on list product
   */
  async moreAction(productName: string, moreAction: string) {
    const xpathProduct = `//div[contains(@class,'product-name__wrapper')]//p[normalize-space()='${productName}']/ancestor::tr`;
    await this.page.click(`${xpathProduct}//*[name()='g' and @id='Icons/More']`);
    await this.page.click(`(//li[normalize-space()='${moreAction}'])[last()]`);
    if (moreAction === "Delete") {
      await this.page.click("//button[normalize-space() = 'Delete']");
    }
    await this.page.reload();
  }

  /**
   * more action Multi product on list product
   */
  async moreActionMultiProducts(moreAction: string) {
    await this.page.click("(//span[@class='sb-check'])[1]");
    await this.page.click("//span[@class='sb-button--label']");
    await this.page.click(`//li[@class='sb-dropdown-menu__item sb-is-capitalized'][normalize-space()='${moreAction}']`);
    if (await this.page.isVisible(`//span[normalize-space()='Delete']`)) {
      await this.page.click(`//span[normalize-space()='Delete']`);
    }
    await this.page.reload();
  }

  /**
   * get api product detail on dashboard
   * @returns <json> infor product detail on store front
   */
  async getDataProductDashboard(
    domain: string,
    productID: number,
    authRequest: APIRequestContext,
  ): Promise<DigitalProduct> {
    const response = await authRequest.get(`https://${domain}/admin/digital-products/product/${productID}.json`);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * get api product detail on store front
   * @returns <json> infor product detail on store front
   */
  async getDataProductStoreFront(domain: string, productName: string, accessToken: string): Promise<DigitalProduct> {
    const response = await this.page.request.get(
      `https://${domain}/api/digital-products/product/${productName}.json?handle=${productName}&token=${accessToken}`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * switch to orther tab with tab name
   * @param menu name of tab on Menu sidebar
   */
  async navigateToMenu(menu: string) {
    const xpathMenu = "//ul[contains(@class,'menu') or contains(@class,'active treeview-menu')";
    const xpathLabel = `or contains(@class,'nav-sidebar')]//li//*[text()[normalize-space()='${menu}']]`;
    const xpathLabel2 = `//ancestor::a|(//span[following-sibling::*[normalize-space()='${menu}']]//ancestor::a)[1]`;
    await this.page.locator(`${xpathMenu}${xpathLabel}${xpathLabel2}`).click();
  }

  /**
   * wait for upload progress complete
   */
  async waitForUpload() {
    await this.page.waitForResponse(response => response.url().includes("dp-media.json") && response.status() === 200);
  }

  /**
   * click button Save with content tab
   */
  async clickSaveContent() {
    await this.page.click("(//button[normalize-space() = 'Save'])[2]", { delay: 1000 });
  }

  /**
   * click button Save with general tab
   */
  async clickSaveGeneral() {
    await this.page.click("(//button[normalize-space() = 'Save'])[1]");
    await this.page.waitForSelector("//div[contains(@class, 's-toast') and normalize-space()='successfully']", {
      state: "detached",
    });
  }

  /**
   * wait for media loaded on media of lecture
   */
  async waitForMedia() {
    await (
      await this.page.waitForSelector("//*[normalize-space() ='Media/Files is being uploaded to your product.']")
    ).isDisabled();
    const wait = await this.page.waitForSelector(
      "//div[@class = 'sb-image sb-relative sb-pointer sb-overflow-hidden sb-image--medium']//img",
    );
    await wait.waitForElementState("stable");
  }

  /**
   * after upload thumnail image, click to remove imgage
   */
  async removeThumnailImage() {
    const thumnailBlock = "//label[normalize-space() ='Thumbnail image']/parent::div";
    await this.hoverThenClickElement(
      thumnailBlock,
      `(${thumnailBlock}//button[contains(@class, 'sb-button--only-icon--small')])[3]`,
    );
  }

  /**
   * select pricing type on pricing tab
   * @param pricingType
   */
  async selectPricingType(pricingType: string) {
    await this.page.click("(//button[contains(@class,'sb-button--select')])[1]");
    await this.page.click(`//li[normalize-space() = '${pricingType}']`);
  }

  /**
   * click button Connect payment providers on Pricing tab
   */
  async clickConnectPayment() {
    await this.page.click("//button[normalize-space() = 'Connect payment providers']");
  }

  /**
   * close popup next step on menu
   */
  async closeNextStep() {
    await this.page.click("//div[@class = 'button-close']");
  }

  /**
   * get api sort product on store front
   * @returns <json> infor product detail on store front
   */
  async sortProductStoreFront(domain: string, accessToken: string, sortBy: string, sortMode: string) {
    const response = await this.page.request.get(
      `https://${domain}/api/digital-products/products.json?page=1&limit=12&token=${accessToken}
      &sort_by=${sortBy}&sort_mode=${sortMode}&infinite=false`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * checkout 1 digital product
   * @param domain
   * @param title
   */
  async checkout(title: string) {
    await this.page.goto(`https://${this.domain}/products/${title}`);
    await this.page.waitForSelector(`//div[@class='header-section']`);
    await this.page.waitForSelector(`(//button[normalize-space()='Buy Now'])[1]`);
    await this.page.locator(`(//button[normalize-space()='Buy Now'])[1]`).click();
    await this.page.locator(`//button[text()='Continue to shipping method']`).click();
    await this.page.locator(`//button[text()='Complete order']`).click();
    await this.page.locator(`(//a[contains(text(),'No thanks')])[1]`).click();
    await this.page.locator("(//div[contains(@class,'content__wrap')]//div[@class='main'])[2]").isVisible();
    await this.page.goto(`https://default-share-theme-1.myshopbase.net/my-products`);
    await this.page.reload({ waitUntil: "networkidle" });
  }

  /**
   * click to button publish or unpublish to change status on product detail
   * @param status publish or unpublish
   */
  async changeStatus(status: string) {
    await this.page.click(`//button[normalize-space() = '${status}']`);
  }

  /**
   * get current url of website
   */
  async getCurrentUrl() {
    return this.page.url();
  }

  /**
   * fill value to field Amount on Pricing tab
   * @param value
   */
  async inputAmount(value: string) {
    await this.page.fill(
      "//label[normalize-space() = 'Price']/ancestor::div[contains(@class,'payment-pricing__form-item')]//input",
      value,
    );
  }

  /**
   * turn on or turn off toggle of quantity limit, access limit, time limit on pricing tab
   * @param limitType Quantity limit/Access Limit/Time limit
   */
  async clickTogglePricing(limitType: string) {
    await this.page.click(
      `//div[normalize-space()='${limitType}']/ancestor::div[3]//span[@class='sb-switch__switch sb-relative']`,
      { delay: 5000 },
    );
  }

  /**
   * input value for maximum member of quantity limit
   * @param value maximum member
   */
  async inputMaxMember(value: string) {
    await this.page.fill(`(//div[normalize-space() = 'Maximum member'])[3]//input[@class = 'sb-input__input']`, value);
  }

  /**
   * Click to view sale page, content of product from product list
   * @param productName product need to view on storefront page
   * @param pageView type of page on storefront: View sale page or view content
   */
  async clickToViewSF(productName: string, pageView: string) {
    await this.hoverThenClickElement(
      `(//p[normalize-space() = '${productName}'])[1]`,
      `//div[@class = 'bg-icon-eye']//button[contains(@class, 'sb-button--only-icon--small')]`,
    );
    await this.page.click(
      `(//div[@class = 'sb-dropdown-menu sb-py-small']//li[normalize-space() = '${pageView}'])[last()]`,
    );
  }

  /**
   * Click to view sale page, content of product from product detail
   * @param pageView type of page on storefront: View sale page or view content
   */
  async clickToViewFromDetail(pageView: string) {
    await this.page.click("//button[normalize-space() = 'Preview']");
    await this.page.click(`(//li[normalize-space() = '${pageView}'])[last()]`);
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
      case "Design Sales Page":
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
   * Get id của chapter (hay còn gọi là section)
   * Ex:https://{domain}/admin/creator/products/1000000444963533/chapter/1006
   * @returns
   */
  async getDigitalChapterID(): Promise<string> {
    const url = this.page.url();
    const arrUrl = url.split("/");
    const chapterId = arrUrl[arrUrl.length - 1];
    return chapterId;
  }

  /**
   * Get id của lesson (hay còn gọi là lecture)
   * Ex: https://{domain}/admin/creator/products/1000000444963533/chapter/1006/lesson/1680
   * @returns
   */
  async getDigitalLessonID(): Promise<string> {
    const url = this.page.url();
    const arrUrl = url.split("/");
    const lessonId = arrUrl[arrUrl.length - 1];
    return lessonId;
  }

  /**
   * Chọn template khi customize sale page
   */
  async selectTemplateCustomizeSalePage() {
    await this.genLoc("//span[contains(text(),'Design sales page')]").click();
    await this.page.hover("(//div[contains(@class,'sb-choose-template__template')]//img)[1]");
    await Promise.all([
      this.page.waitForNavigation(),
      this.genLoc(
        "(//div[contains(@class,'sb-choose-template__template')]//span[normalize-space()='Apply'])[1]",
      ).click(),
    ]);
  }

  /**
   * Nhập title khi config pricing cho product
   * @param title
   */
  async inputTitlePricingTab(title: string) {
    await this.genLoc("//input[@placeholder='Free, Standard Plan, Professional Plan, etc.']").fill(title);
  }

  /**
   * Setting ở tab Pricing khi chọn pricing type là One-time payment
   * @param option là type Pricing: nhận 2 giá trị Paid or Free
   * @param title là title của pricing
   * @param value là giá của product
   */
  async settingPricingTab(option: string, title: string, value: string) {
    // await this.selectPricingType(pricingType);
    await this.chooseTypePricing(option);
    await this.inputTitlePricingTab(title);
    await this.inputAmount(value);
    await this.clickSaveGeneral();
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
    const xpathProductName = `//p[normalize-space()='${productName}']`;
    return this.genLoc(`(${xpathProductName}/parent::div/p[normalize-space()='${value}'])[1]`);
  }

  /**
   * return xpath of status in the row value on product list
   * @param productName: product title on product list
   * @param value: published|unpublished
   * @returns
   */
  getXpathValueOfCell(productName: string, status: string): Locator {
    const xpathProductName = `//p[normalize-space()='${productName}']`;
    return this.genLoc(`(${xpathProductName}/ancestor::tr//div[normalize-space()='${status}'])[1]`);
  }

  /**
   * select option Paid or Free of Price product
   * @private
   */
  async chooseTypePricing(option: string) {
    const xpathTypePricing = `//input[@value='${option}']/following-sibling::span`;
    await this.page.waitForSelector(xpathTypePricing);
    await this.genLoc(xpathTypePricing).click();
  }

  /**
   * publish product to checkout
   */
  async publishedProduct() {
    await this.genLoc("//span[normalize-space()='Publish']/parent::button").click();
    await this.page.waitForSelector("//div[contains(@class, 'sb-toast__container--default')]");
    await this.genLoc("//span[normalize-space()='Unpublish']/parent::button").isVisible();
  }

  /**
   * go to creator product
   * @param productId
   */
  async gotogoToDigitalProduct(productId: number): Promise<void> {
    await this.page.goto(`https://${this.domain}/admin/creator/products/${productId}`);
  }
}
