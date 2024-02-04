import { APIRequestContext, expect, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { CustomizeReview, ProductGroupReview, Review, UpdateReview } from "@types";

export class ReviewPage extends SBPage {
  menuReviews = this.genLoc("div.app_list__items-info > p").filter({ hasText: "Product Reviews" });
  xpathBtnImportReview = this.page.getByRole("link", { name: "Import reviews" }).first();
  importCSVReviews =
    "//h4[normalize-space()='CSV file']//parent::div//following::button[normalize-space()='Import reviews']//span";
  importAliExpressReviews =
    "(//h4[normalize-space()='AliExpress']//parent::div//following::button[normalize-space()='Import reviews']//span)[1]";
  buttonLoading = ".s-button .is-primary .is-loading";
  msgSuccessPopup = "div.s-modal-body > p";
  widgetReviews = "div.rv-widget__listing.relative";
  checkNowBtn = "//span[normalize-space()='Check now']";
  checkReviews = "//span[normalize-space()='Check reviews']";
  reviewsTable = "//table[contains(@class,'page-reviews__table')]";
  inputSearchProductReviews = "//input[@placeholder='Search product to import reviews']";
  resultSearchProductReviews = "div.s-dropdown-item__content";
  inputLinkAliExpress = "//input[@placeholder='Enter URL of product in AliExpress']";
  msgErrAliLink = " div.s-form-item__error";
  getReviewImport = "//span[normalize-space()='Get reviews']";
  filterReviewBtn = "(//span[normalize-space()='Filter']//span)[1]";
  buttonClearFilter = this.page.getByRole("button", { name: "Clear all filters" });
  selectAllReviews = this.page.getByRole("cell", { name: "Select all reviews Review" }).locator("span").nth(1);
  selectAllPage = "//span[contains(text(), 'all pages')]";
  totalReviewSelected = " span.s-control-label > span";
  buttonAction = "(//button//span[normalize-space()='Action']//span)[1]";
  msgUpdateSuccess = "//*[contains(text(),'All changes was updated successfully.')]";
  noProductPage = "//td[contains(@class, 'no-product')]";
  buttonDone = "//button[normalize-space()='Done']";
  tagFilter = ".page-reviews__tag > .s-icon > .mdi";
  filterType = this.page.locator("a").filter({ hasText: "Store reviews" });
  checkboxWithPhoto = ".review-checkbox__check";
  filterReviewsUnpublish = this.page.locator("a").filter({ hasText: "Unpublished" });
  authRequest: APIRequestContext;
  xpathReviewStf = "//section[@type='review-page']";
  xpathReviewProductPage = "//section[@app='review']";
  reviewInDashboard = ".s-extend-paragraph";
  reviewInStf = ".rv-widget__post-content";
  statusReviewInDB = ".page-reviews__table .s-tag span";
  blockReviewText = "//div[normalize-space()='Auto-block reviews']//following::div/textarea";
  setNotiBadReviews = "//span[contains(text(),'Only send notifications')]//preceding-sibling::span";
  inputMailNoti = "(//div[contains(text(),'Email to receive notifications')]//following::div//input)[1]";
  overallRating = "(//div[contains(text(),'Overall rating')])[1]";
  widgeNoReview = "rv-widget__no-review";
  deleteProductGroup = this.page.getByRole("button", { name: "Delete group" });
  confirmDelete = this.page.getByRole("button", { name: "Delete", exact: true });
  deleteGroupMsg = "//*[contains(text(),'Delete product group successfully!')]";
  prBShareReview =
    "//h4[normalize-space()='PrintBase shared reviews']//parent::div//following::button[normalize-space()='Import reviews']//span";
  collectionList = "//h4[contains(text(), 'Collection list')]";
  typeReviewInDB = "((//div[@class='s-extend-paragraph']//following::td)[2]//div)[2]";
  reviewSTf = ".rv-widget__review-listing";
  buttonContinue = this.page.getByRole("button", { name: "Continue" });
  headerPopupImportAli = this.page.getByRole("heading", { name: "Import reviews from AliExpress" });
  buttonImportReview = this.page.getByRole("button", { name: "Import reviews" });
  reviewLayoutMasonry = ".rv-widget__listing-body--layout-masonry div";
  showLinkAllReview = "//a[contains(text(), 'See all reviews')]";
  carouselReview = ".rv-widget__carousel-heading";
  showLinkAllReviewCarousel = ".rv-widget__carousel-header-link";
  xpathLayoutBtn = "//div[@data-widget-id='layout']//span//button";
  xpathLoadingTableRV = "//div[@class='s-input is-loading']";
  xpathTitleMoreFromRV = "//h2[normalize-space()='More from Review']";
  loadingTableReviewInSF =
    "//div[@class='review-py24 rv-widget rv-widget--widget-card rv-widget--fetching section section--app']";
  xpathPrReview = {
    block: `//section[@component='product_reviews']`,
    fieldInput: text => `//input[@placeholder="${text}"]`,
    fieldTextarea: text => `//textarea[@placeholder="${text}"]`,
    checkboxReview: (customer, review, product) =>
      `(//tr[.//div[normalize-space()="${review}"] and .//div[normalize-space()="${product}"] and .//div[normalize-space()="${customer}"]]//td)[1]//span[@class='sb-check']`,
  };
  constructor(page: Page, domain: string, authRequest?: APIRequestContext) {
    super(page, domain);
    this.authRequest = authRequest;
  }

  //get text hiển thị tại mục All review page
  async getTextAllReview(): Promise<string> {
    return await this.page.innerText("//div[text()='All Reviews page']//following-sibling::div");
  }

  //get api review product tai storefront
  async loadDataProductReview() {
    let response;
    await expect(async () => {
      response = await this.page.request.get(
        `https://${this.domain}/api/review/reviews.json?ratings=&sort_field=created_at&sort_direction=desc`,
      );
      expect(response.status()).toBe(200);
    }).toPass();
    return await response.json();
  }

  async deleteReview(productIds: number[]): Promise<void> {
    const joinedIds = productIds.join(",");
    try {
      const res = await this.authRequest.delete(`https://${this.domain}/admin/reviews/deletes.json?ids=${joinedIds}`);
      await expect(res).toBeOK();
    } catch (error) {
      throw new Error("Delete review failed");
    }
  }

  //get name product tai storefront
  async getNameProduct(): Promise<string> {
    return this.getTextContent(`//h1[@class="h3 product__name is-uppercase mt0 mb12"]`);
  }

  //get link product tai man all review page
  async getProductLink(): Promise<string> {
    return this.getTextContent(`//div[@class="rv-widget__product-title"]`);
  }

  /**
   * Choose file CSV to upload
   * It will choose a fileName and xpath to the upload
   * @param fileName
   * @param xpath
   */
  async chooseFileCSV(fileName: string): Promise<void> {
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      await this.page.click("//input[@type='file']"),
    ]);
    await fileChooser.setFiles(fileName);
    await this.page.click("span.s-check");
    await this.page.click("//span[normalize-space()='Import']");
  }

  /**
   * Import Aliexpress review
   * It will choose a fileName and xpath to the upload
   * @param fileName
   * @param xpath
   */
  async importAliexpressReview(productName: string, productImportReview: string): Promise<void> {
    await this.page.locator(this.inputSearchProductReviews).fill(productName);
    await this.waitForElementVisibleThenInvisible("//div[@class='s-input is-loading']");
    await this.page.locator(this.resultSearchProductReviews).first().click();
    await this.page.locator(this.inputLinkAliExpress).fill(productImportReview);
    await this.page.click("//span[normalize-space()='Continue']");
  }

  /**
   * choose option filters reviews
   */
  async chooseOpionFilters(
    optionsFilter: "Status" | "Rating" | "Photos" | "Featured" | "Review type" | "Source" | "Product",
    value?: string,
  ): Promise<void> {
    const xpathLabel = `//div[contains(@class,'sidebar-filter')]//p[normalize-space()='${optionsFilter}']`;
    const xpathValue = `//span[@class='s-control-label' and normalize-space()='${value}']/preceding-sibling::span[1]`;
    const xpathOption = `(${xpathLabel}/following::div)[1]//select`;
    await this.page.locator(xpathLabel).waitFor();
    await this.waitForXpathState(xpathLabel, "stable");
    await this.page.click(xpathLabel);
    switch (optionsFilter) {
      case "Status":
      case "Photos":
      case "Featured":
        await this.page.locator(xpathValue).waitFor();
        await this.page.click(xpathValue);
        break;
      case "Rating":
        await this.waitForXpathState(xpathOption, "stable");
        await this.page.click(xpathOption);
        await this.page.getByRole("combobox").selectOption(`${value}`);
        break;
      case "Review type":
        await this.page
          .locator("label")
          .filter({ hasText: `${value}` })
          .locator("span")
          .first()
          .waitFor();
        await this.page
          .locator("label")
          .filter({ hasText: `${value}` })
          .locator("span")
          .first()
          .click();
        break;
      case "Source":
        await this.waitForXpathState(xpathOption, "stable");
        await this.page.click(xpathOption);
        await this.page.getByRole("combobox").selectOption(`${value}`);
        break;
      case "Product":
        await this.page.fill(`//input[@placeholder='Search product']`, `${value}`);
        await this.page.getByText(`${value}`).waitFor();
        await this.page.getByText(`${value}`).click();
        break;
    }
    await this.waitForXpathState(this.buttonDone, "stable");
    await this.page.getByRole("button", { name: "Done" }).click();
    await this.waitForElementVisibleThenInvisible("//div[@class='s-input is-loading']");
  }

  /**
   * Count total reviews in Dashboard
   */
  async countTotalReviews(): Promise<number> {
    let totalReviews: number;
    const totalPage = this.page.locator(".s-pagination-link").last();
    const review = this.page.locator(".s-extend-paragraph");
    if (await totalPage.first().isVisible()) {
      await this.selectAllReviews.click();
      const textTotalReviews = await this.page.locator(this.selectAllPage).innerText();
      totalReviews = Number(textTotalReviews.match(/\d+/)[0]);
    } else {
      totalReviews = await review.count();
    }
    return totalReviews;
  }

  /**
   * Choose active reiew
   * @param action: Approve, Unapprove, Feature, Unfeature, Delete
   */
  async chooseOpionAction(action: string): Promise<void> {
    await this.page.getByText(`${action}`, { exact: true }).click({});
  }

  /**
   * Wait for load reviews import
   */
  async waitForLoadReviewsImport(sumReviews: number): Promise<void> {
    await expect(async () => {
      const totalReview = await this.countReviewsFilter();
      expect(totalReview).toEqual(sumReviews);
    }).toPass();
  }

  /**
   * Remove filter search review
   * @param action
   */
  async removeFilterReview(): Promise<void> {
    const countFilerOption = await this.page.locator(this.tagFilter).count();
    for (let i = 0; i < countFilerOption; i++) {
      await expect(this.page.locator(this.tagFilter).first()).toBeVisible();
      await this.page.locator(this.tagFilter).first().click();
    }
    await this.waitForElementVisibleThenInvisible("//div[@class='s-input is-loading']");
  }

  /**
   *  Choose active with all review
   * @param action
   */
  async actionAllReview(action: string): Promise<void> {
    await this.selectAllReviews.click();
    await this.page.locator(this.selectAllPage).click();
    await this.page.locator(this.buttonAction).click();
    await this.chooseOpionAction(action);
    await expect(this.page.locator(this.msgUpdateSuccess)).toBeVisible();
  }

  /**
   * Count total reviews in Dashboard
   * return <number> total reviews
   */
  async countTotalReviewsStf(): Promise<number> {
    const buttonShowMore = this.page.locator("//button//span[normalize-space()='Show more']");
    const review = this.page.locator(".rv-widget__review-listing");
    let reviewCount = await review.count();
    while (await buttonShowMore.isVisible()) {
      await buttonShowMore.click();
      await this.page.waitForLoadState("load"); //wait for load reviews after click button show more
      const currentReviewAfterClick = await review.count();
      if (reviewCount === currentReviewAfterClick) {
        break; //if the number of reviews doesn't change, stop the loop
      }
      reviewCount = currentReviewAfterClick;
    }
    return reviewCount;
  }

  /**
   * goto Product groups in review app
   */
  async gotoProductgroups() {
    await this.page.goto(`https://${this.domain}/admin/apps/review/product-group`);
    await this.page.waitForLoadState("load");
  }

  /**
   * edit Product Group in review app
   * @param data
   */
  async editProductGroupByIndex(
    data: { title: string; groupProductBy: "Collection" | "Tag" | "Vendor"; value: string },
    indexProductGroup = 1,
  ) {
    await this.page.click(`(//tbody//a)[${indexProductGroup}]`);
    await this.page.locator("//input[@placeholder='Name your new product group']").fill(data.title);
    await this.page.selectOption("//div[@class='s-form-item__content']//select", data.groupProductBy);
    await this.page.click("//a[@class='s-delete is-small']");
    await this.page.locator(`//div[@class='s-autocomplete control']//input`).fill(data.value);
    await this.page.waitForSelector("//span[@class='s-dropdown-item is-hovered']");
    await this.page.click(`(//span[@class='s-dropdown-item is-hovered']//div[normalize-space()='${data.value}'])[1]`);
    await this.clickOnBtnWithLabel("Save");
  }

  /**
   * get Xpath Title Product Groups in review app
   * @param title
   * @returns
   */
  getXpathTitleProductGroups(title: string) {
    const xpathTitle = `//a[normalize-space()='${title}']`;
    return xpathTitle;
  }

  /**
   * get xpath title review in storefront
   * @param title
   * @param index
   * @returns
   */
  getXpathTitleReview(title: string, index: number) {
    return `(//div[normalize-space()='${title}'])[${index}]`;
  }

  /*
   * xpath feilds in customize review
   * @param label name feild want to edit
   * @returns
   */
  xpathFeildCustomReview(label: string) {
    return `//div[contains(@class,"s-form-item")][.//label[normalize-space()='${label}']]`;
  }

  /**
   * Customize Review in dashboard
   * @param customizeReview
   */
  async customizeReview(customizeReview: CustomizeReview): Promise<void> {
    if (customizeReview.font) {
      await this.page.locator("select").first().selectOption(customizeReview.font);
    }
    if (customizeReview.style) {
      await this.page.locator(`${this.xpathFeildCustomReview("Style")}//select`).selectOption(customizeReview.style);
    }

    if (customizeReview.carousel_background) {
      await this.page
        .locator(`${this.xpathFeildCustomReview("Carousel background")}//input`)
        .fill(customizeReview.carousel_background);
    }

    if (customizeReview.widget_background) {
      await this.page
        .locator(`${this.xpathFeildCustomReview("Widget background")}//input`)
        .fill(customizeReview.widget_background);
    }

    if (customizeReview.layout) {
      await this.page.locator(`//label//img[@alt="${customizeReview.layout}"]`).click();
    }

    if (customizeReview.reviews_per_page) {
      await this.page
        .locator(`${this.xpathFeildCustomReview("Number of reviews")}//input`)
        .fill(customizeReview.reviews_per_page);
    }

    if (customizeReview.card_layout) {
      await this.page.locator(`//label//img[@alt="${customizeReview.card_layout}"]`).click();
    }

    if (customizeReview.widget_layout) {
      await this.page.locator(`//label//img[@alt="${customizeReview.widget_layout}"]`).click();
    }

    if (customizeReview.number_of_reviews) {
      await this.page
        .locator(`${this.xpathFeildCustomReview("Number of reviews")}//input`)
        .fill(customizeReview.number_of_reviews);
    }
    await this.page.getByRole("button", { name: "Save changes" }).click();
  }

  /*
    xpath toggle on/off review
   * @param label name feild want to edit
   * @returns
   */
  xpathToggleReviews(label: "Review Widget" | "Review Carousel") {
    return `//div[normalize-space()='Show link to All Reviews page on ${label}' and contains(@class,'col')]//following-sibling::div//span[@class='s-check']`;
  }

  /*
    xpath fileds review in stf
   * @param label name feild want to edit
   * @returns
   */
  xpathReviewsStf(label: string) {
    return `//div[@class="rv-widget__group-field"][ .//label[contains(text(),'${label}')]]`;
  }

  /**
   * Write a review in STF
   * @param review include: title, review, name, email
   */
  async writeReview(review: Review): Promise<void> {
    await this.page.getByRole("button", { name: "Write a review" }).waitFor();
    await this.page.getByRole("button", { name: "Write a review" }).click();
    await this.page
      .locator("#rv_add_form #review-icons-star")
      .nth(review.star - 1)
      .click();
    await this.page.locator(`${this.xpathReviewsStf("Title of review")}//input`).fill(review.title);
    await this.page.locator(`${this.xpathReviewsStf("Review")}//textarea`).fill(review.review);
    await this.page.locator(`${this.xpathReviewsStf("Your name")}//input`).fill(review.name);
    await this.page.locator(`${this.xpathReviewsStf("Your email")}//input`).fill(review.email);
    await this.page.getByRole("button", { name: "Submit review" }).click();
  }

  /**
   * Write a review in STF thêm v3
   * @param review include: title, review, name, email
   */
  async writeReviewV3(review: Review): Promise<void> {
    await this.page.getByRole("button", { name: "Write a review" }).click();
    await this.page
      .locator(".rv-form #review-icons-star")
      .nth(review.star - 1)
      .click();
    await this.genLoc(this.xpathPrReview.fieldInput("Title Review")).fill(review.title);
    await this.genLoc(this.xpathPrReview.fieldTextarea("Ex: Best products")).fill(review.review);
    await this.genLoc(this.xpathPrReview.fieldInput("Your name")).fill(review.name);
    await this.genLoc(this.xpathPrReview.fieldInput("Your email")).fill(review.email);
    await this.page.getByRole("button", { name: "Submit review" }).click();
  }

  /**
   * Setting auto publish review
   * @param option. Ex: 2 stars, 3 stars, 4 stars, 5 stars, All
   */
  async settingAutoPublishReview(option: string): Promise<void> {
    const optionValue = option === "All" ? "All" : `${option} stars`;
    await this.page.getByRole("combobox").first().selectOption(optionValue);
  }

  /*
    xpath review content in stf
   * @param content review
   */
  xpathReviewContentStf(review: string) {
    return `//div[normalize-space()='${review}']`;
  }

  /**
   * Add product groups
   * @param title: title of product group
   * @param group: Collection, Tag, Vendor
   * @param value: value of group
   */
  async addProductGroup(productGroupReview: ProductGroupReview): Promise<void> {
    await this.page.click("//button[normalize-space()='Add product group']");
    await this.page.locator("//input[@placeholder='Name your new product group']").fill(productGroupReview.title);
    await this.page.getByRole("combobox").selectOption(productGroupReview.group);
    await this.page
      .locator("//input[contains(@placeholder,'Type a keyword to search')]")
      .fill(productGroupReview.value);
    await this.page.getByText(`${productGroupReview.value}`, { exact: true }).click();
    await this.page.getByRole("button", { name: "Save" }).click();
  }

  /**
   * Get api get data product groups
   */
  async loadDataProductGroups() {
    try {
      const response = await this.authRequest.get(`https://${this.domain}/admin/reviews/product-groups.json`);
      await expect(response).toBeOK();
      return await response.json();
    } catch (error) {
      throw new Error("Get product groups failed");
    }
  }

  /**
   * api delete product groups in Reviews app
   */
  async deleteProductGroups(productIds: number[]): Promise<void> {
    if (productIds.length) {
      const joinedIds = productIds.join(",");
      try {
        const res = await this.authRequest.delete(
          `https://${this.domain}/admin/reviews/product-groups.json?ids=${joinedIds}`,
        );
        await expect(res).toBeOK();
      } catch (error) {
        throw new Error("Delete product groups failed");
      }
    }
  }

  /*
    xpath a product groups in review app
   * @param group name
   */
  xpathProductReview(group: string) {
    return `//a[normalize-space()='${group}']`;
  }

  /*
    xpath a product groups in review awidget
   * @param product name
   */
  xpathProductInWidgetReview(productName: string) {
    return `(//div[contains(@class,'upsell-widget-product__name')]//a[contains(text(), '${productName}')])[1]`;
  }

  /*
    xpath name product in widget review
   * @param name: product name
   */
  xpathNameProduct(productName: string) {
    return `//h1[normalize-space()='${productName}']`;
  }

  /**
   * Import review from Printbase shared reviews
   * @param reviewStar: Display on your store shared reviews with <reviewStar> stars
   * @param numberReview: number of reviews want to import
   */
  async printBaseShareReview(reviewStar: number, numberReview: number): Promise<void> {
    await this.page.getByRole("combobox").selectOption(`${reviewStar}`);
    await this.page.getByPlaceholder("We suggest an odd number").click();
    await this.page.getByPlaceholder("We suggest an odd number").fill(`${numberReview}`);
    await this.page.getByRole("button", { name: "Continue" }).click();
  }

  /**
   * Get api count total reviews
   */
  async countReviews() {
    try {
      const response = await this.authRequest.get(`https://${this.domain}/admin/reviews/count.json`);
      await expect(response).toBeOK();
      const data = await response.json();
      return await data.count;
    } catch (error) {
      throw new Error("Get product groups failed");
    }
  }

  /**
   * Get api count total reviews
   */
  async getTotalRating(productId: number) {
    try {
      const response = await this.page.request.get(
        `https://${this.domain}/api/review/widget.json?product_ids=${productId}`,
      );
      await expect(response).toBeOK();
      const data = await response.json();
      const totalRating = data.rating[`${productId}`].total;
      return totalRating;
    } catch (error) {
      throw new Error("Get total rating failed");
    }
  }

  /**
   * Get api get data reviews dashboard
   */
  async loadDataReviewsDashboard() {
    try {
      const response = await this.authRequest.get(`https://${this.domain}/admin/reviews.json`);
      await expect(response).toBeOK();
      return await response.json();
    } catch (error) {
      throw new Error("Get reviews failed");
    }
  }

  /**
   * Get sum review display in dashboard
   */
  async countReviewsFilter() {
    try {
      const response = await this.authRequest.get(`https://${this.domain}/admin/reviews/count.json`);
      await expect(response).toBeOK();
      const countReview = await response.json();
      return await countReview.count;
    } catch (error) {
      throw new Error("Get count reviews failed");
    }
  }

  /**
   * Get api count total reviews
   */
  async countReviewStf() {
    try {
      const response = await this.page.request.get(`https://${this.domain}/api/review/widget.json`);
      await expect(response).toBeOK();
      const data = await response.json();
      const countReview = data.rating[0].total;
      return countReview;
    } catch (error) {
      throw new Error("Get count total rating failed");
    }
  }

  /**
   * select LayOut Of Product review
   * @param layout
   */
  async selectLayOutOfProductReview(layout: "Masonry" | "Carousel" | "List") {
    await this.page.locator(this.xpathLayoutBtn).last().click();
    const xpathLayOut =
      "(//div[contains(@class,'w-builder__widget--layout')]//div[contains(@class,'list-icon')]//span)";
    switch (layout) {
      case "Masonry":
        await this.genLoc(xpathLayOut + "[1]").click();
        break;
      case "Carousel":
        await this.genLoc(xpathLayOut + "[2]").click();
        break;
      case "List":
        await this.genLoc(xpathLayOut + "[3]").click();
        break;
    }
    await this.genLoc(this.xpathLayoutBtn).click();
  }

  /**
   * remove review
   * @param customer
   * @param review
   * @param product
   */
  async removeReviewInDB(customer: string, review: string, product: string) {
    await this.genLoc(this.reviewInDashboard).first().waitFor();
    const isReviewVisible = await this.genLoc(this.xpathPrReview.checkboxReview(customer, review, product)).isVisible();
    if (isReviewVisible) {
      await this.genLoc(this.xpathPrReview.checkboxReview(customer, review, product)).click();
      await this.page.getByRole("button", { name: "Actions" }).click();
      await this.genLoc(".menu-danger").getByText("Delete").click();
      await this.page.getByRole("button", { name: "Delete" }).click();
      await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
    }
  }

  /**
   * delete Cache on SF
   */
  async deleteCacheOnSF(): Promise<void> {
    const cacheReview = await this.authRequest.get(`https://${this.domain}/api/review/widget.json`, {
      params: {
        review_type: "shop",
        is_skip_cache: true,
      },
    });
    expect(cacheReview.status()).toBe(200);
  }

  /**
   * get Data Review in dashboard
   * @returns
   */
  async getDataReview() {
    const resDataReview = await this.authRequest.get(`https://${this.domain}/admin/reviews.json`);
    expect(resDataReview.status()).toBe(200);
    const dataReview = await resDataReview.json();
    return dataReview;
  }

  /**
   * public And Un Public All Reviews
   * @param statusUpdate
   */
  async publicAndUnPublicAllReviews(statusUpdate: boolean): Promise<void> {
    const dataReview = await this.getDataReview();
    const listDataUpdate: Array<UpdateReview> = [];
    for (let i = 0; i < dataReview.reviews.length; i++) {
      const dataUpdate: UpdateReview = { id: dataReview.reviews[i].id, status: statusUpdate };
      listDataUpdate.push(dataUpdate);
    }
    const res = await this.authRequest.put(`https://${this.domain}/admin/reviews/updates.json`, {
      data: {
        reviews: listDataUpdate,
        updated_columns: ["status"],
      },
    });
    expect(res.status()).toBe(200);
  }

  /**
   * delete Review By ID
   * @param productIds
   */
  async deleteAllReviewExceptID(productId: number): Promise<void> {
    try {
      const dataReview = await this.getDataReview();
      let listIdReview = [];
      if (dataReview.reviews) {
        listIdReview = dataReview.reviews.filter(review => review.product_id !== productId).map(review => review.id);
      }
      const id: string = listIdReview.join(",");
      if (listIdReview.length > 0) {
        const response = await this.authRequest.delete(`https://${this.domain}/admin/reviews/deletes.json`, {
          params: {
            ids: id,
          },
        });
        expect(response.status()).toBe(200);
      }
    } catch (error) {
      throw new Error("Delete review failed");
    }
  }

  /**
   * Hàm verify review after import
   * @param timeout : thử cập nhật trong vòng bao lâu, mặc định là 65s
   */
  async verifyReviewAfterImport(timeout = 65_000): Promise<void> {
    const softAssertion = expect.configure({ soft: true });
    await softAssertion
      .poll(
        async () => {
          const review = await this.page.locator(this.reviewInDashboard).first().isVisible();
          if (!review) {
            await this.page.reload();
            return false;
          } else {
            return true;
          }
        },
        { timeout: timeout, intervals: [5_000, 10_000] },
      )
      .toBeTruthy();
  }
}
