import { APIRequestContext, expect, Page } from "@playwright/test";
import type { CreateCustomCollectionResponse, FormatDescription, SEODetail } from "@types";
import { CollectionInfo, sortType, tabCollection } from "@types";
import appRoot from "app-root-path";
import { ProductPage } from "./products";
import { pressControl } from "@core/utils/keyboard";

export class CollectionPage extends ProductPage {
  xpathNoCollectionMessage = "//p[normalize-space()='You have no collections yet']";
  xpathCollectionOnProductDetail = "//div[@class='s-form-item' and descendant::label[normalize-space()='Collections']]";
  xpathBtnRefresh = "//button//span[normalize-space()='Refresh']";
  xpathBlockProduct = "//div[contains(@class,'section-overview') and descendant::h4[normalize-space()='Products']]";
  xpathDescriptionArea = "//div[@class='tox-edit-area']/iframe";
  xpathProductLink = "//*[contains(@class,'product-table')]//a";
  xpathLoadIcon = "//img[@class='sbase-spinner']";
  xpathProductList = "//*[@class='product-table']/child::*";
  xpathItemList = "//div[contains(@class,'item-list')]//div[@class='item']";
  xpathTableLoading = `//div[@class='s-loading-table']|//div[@class="sb-skeleton--table"]`;
  xpathCreateCollection = `//button//span[normalize-space()='Create collection']`;
  xpathTitleTextbox = "(//input[preceding::*[text()[normalize-space()='Title']]])[1]";
  xpathTextAreaFrame = "//iframe[contains(@id,'tiny-vue')]";
  xpathAreaDescription = "//body[contains(@class,'content-body')]";
  xpathToggleManualType = "//input//following::span[normalize-space()='Manual']";
  xpathEditSEOPage = `//button[contains(text(), 'Edit website SEO')]`;
  xpathTextboxPageTitle = `//label[contains(text(), 'Page title')]/ancestor::div[@class="s-form-item"]//input`;
  xpathTextAreaDescription = `//label[contains(text(), 'Meta description')]/ancestor::div[@class="s-form-item"]//textarea`;
  xpathSaveButton = "//span[normalize-space()='Save']";
  xpathCollectionRow = `//table[@class="sb-table__body"]//tbody//tr`;
  xpathTabNavigation = `//div[contains(@class, 'tab-navigtion')]//div`;
  xpathTabPanel = `//div[contains(@class, 'sb-tab--inside')]//div[contains(@class, 'tab-panel')]`;
  xpathSortCollection = {
    sortTypeBtn: `//button[contains(@class, 'button--select')]`,
    sortOtpion: option => `//label[normalize-space() = '${option}']`,
  };

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  getCollectionNameOnTable(collectionName) {
    return `//*[contains(@class, 'collection-table')]//a[contains(text(), '${collectionName}')]`;
  }

  async getListCollection(domain: string, limit: string, accessToken: string) {
    const res = await this.page.request
      .get(`https://${domain}/admin/collections.json?limit=${limit}&access_token=${accessToken}`)
      .then(res => res.json());
    return res;
  }

  async getDataCollection(domain: string, collectionId: number, accessToken: string) {
    const response = await this.page.request.get(
      `https://${domain}/admin/collections/${collectionId}.json?access_token=${accessToken}`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  // get data collection search
  async getCollectionSearch(domain: string, collectionName: string, limit: string, page: string, accessToken: string) {
    const name = collectionName.replaceAll(" ", "%20");
    const params = `limit=${limit}&text_search=&search=&page=${page}&title=${name}&access_token=${accessToken}`;
    const response = await this.page.request.get(`https://${domain}/admin/collections.json?${params}`);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  //go to add collection page
  async goToAddCollection() {
    await this.page.goto(`https://${this.domain}/admin/collections/new`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Go to list collection page
   * @param platform is shopbase, printbase or plusbase
   */
  async gotoCollectionList(platform?: string) {
    switch (platform) {
      case "plusbase":
        await this.navigateToSubMenu("Product settings", "Collections");
        break;
      case "printbase":
        await this.navigateToSubMenu("Campaigns", "Collections");
        break;
      default:
        await this.navigateToSubMenu("Products", "Collections");
    }
    await this.page.waitForSelector(
      "//table[contains(@class, 'collection-table')] | (//div[contains(@class, 'new-collection-list-page__filter')])[1]",
      { timeout: 19000 },
    );
  }

  /**
   * Go to collection detail page
   * @param collectionName is collection name
   * @param platform is shopbase, printbase or plusbase
   */
  async gotoCollectionDetail(collectionName: string, platform?: string) {
    await this.gotoCollectionList(platform);
    await this.searchCollection(collectionName);
    await this.page.waitForTimeout(3000);
    if (await this.checkLocatorVisible(`(//*[text()[normalize-space()='${collectionName}']])[1]`)) {
      await this.chooseCollection(collectionName);
      await this.page.waitForSelector("//div[@class='collection-detail-page']//label[normalize-space()='Title']");
    }
    await this.page.waitForSelector("//div[@class='collection-detail-page']//h2");
    await this.page.waitForTimeout(2000);
  }

  //search collection by name
  async searchCollection(collectionName: string) {
    await this.genLoc("[placeholder='Search collections']").fill(collectionName);
    await this.genLoc('[placeholder="Search collections"]').press("Enter");
    await this.page.waitForSelector("(//tbody//tr)[1] | //p[normalize-space()='You have no collections yet']");
  }

  /**
   * Open collection detail page
   * @param collectionName is collection name
   */
  async chooseCollection(collectionName: string) {
    const xpathCollectionName = `//*[text()[normalize-space()='${collectionName}']]`;
    await this.page.waitForSelector(`(${xpathCollectionName})[1]`);
    const countCollection = await this.page.locator(xpathCollectionName).count();
    //collection tạo mới sẽ hiển thị ở cuối cùng
    await this.page.click(`(//*[text()[normalize-space()='${collectionName}']])[${countCollection}]`);
  }

  /**
   * Create new collection on Dashboard
   * @param collectionInfo include collection name, description, image ,...
   */
  async createCollection(collectionInfo: CollectionInfo): Promise<void> {
    //add title collection
    if (collectionInfo.collection_title) {
      await this.clearInPutData("(//input[preceding::*[text()[normalize-space()='Title']]])[1]");
      await this.inputTextBoxWithLabel("Title", collectionInfo.collection_title);
    }
    //add description collection
    if (collectionInfo.collection_description) {
      await this.page
        .frameLocator("//iframe[contains(@id,'tiny-vue')]")
        .locator("//body[contains(@class,'content-body')]")
        .fill(collectionInfo.collection_description);
    }
    //add image collection
    const filePathImage = appRoot + `/data/shopbase/${collectionInfo.collection_image}`;
    if (collectionInfo.collection_image) {
      await this.page.setInputFiles(
        "//div[contains(@class,'title-description')][child::h4[normalize-space()='Collection image']]//input",
        filePathImage,
      );
    }
    //check collection visibility
    if (collectionInfo.collection_visibility === false) {
      await this.page.click(
        "//div[contains(@class,'title-description')][child::h4[normalize-space()='Collection visibility']]//span[@class='s-check']",
      );
    }
    // add product thumbnail
    if (collectionInfo.collection_product_thumbnails) {
      // click button Add another condition
      const xpathCountBlock = "//div[@class='list-group-block-and']";
      const countBlock = await this.page.locator(xpathCountBlock).count();
      for (let i = 0; i < collectionInfo.collection_product_thumbnails.length - countBlock; i++) {
        await this.page.click("//a[normalize-space()='Add another condition']");
      }
      // fill option
      for (let i = 0; i < collectionInfo.collection_product_thumbnails.length; i++) {
        const value = collectionInfo.collection_product_thumbnails[i].split(">").map(item => item.trim());
        if (value[0]) {
          await this.page.fill(
            `(//div[@class='list-group-block-and'])[${i + 1}]//input[@placeholder="Color"]`,
            value[0],
          );
        } else {
          await this.clearInPutData(`(//div[@class='list-group-block-and'])[${i + 1}]//input[@placeholder="Color"]`);
        }
        if (value[1]) {
          await this.page.fill(
            `(//div[@class='list-group-block-and'])[${i + 1}]//input[@placeholder="White"]`,
            value[1],
          );
        } else {
          await this.clearInPutData(`(//div[@class='list-group-block-and'])[${i + 1}]//input[@placeholder="White"]`);
        }
      }
    }
    // add handle
    if (collectionInfo.collection_handle) {
      await this.clickOnBtnWithLabel("Edit website SEO");
      const value = collectionInfo.collection_handle.split(">").map(item => item.trim());
      if (value[0]) {
        await this.page.fill(
          "//div[child::label[normalize-space()='Page title']]//following-sibling::div//input",
          value[0],
        );
      }
      if (value[1]) {
        await this.page.fill(
          "//div[child::label[normalize-space()='Meta description']]//following-sibling::div//textarea",
          value[1],
        );
      }
      if (value[2]) {
        await this.page.fill(
          "//div[child::label[normalize-space()='URL and handle']]//following-sibling::div//input",
          value[2],
        );
      }
    }

    if (collectionInfo.collection_type === "Manual") {
      await this.page.click("//input//following::span[normalize-space()='Manual']");
      await this.page.locator("//span[normalize-space()='Save']").waitFor({ state: "visible" });
      await this.clickOnBtnWithLabel("Save");

      if (!collectionInfo.message_error) {
        //wait for collection created successfully
        await this.page.waitForSelector(
          "//div[contains(@class,'s-toast')]//div[normalize-space()='Created collection successfully!']",
        );
        await this.page.waitForSelector(
          "//div[contains(@class,'s-toast')]//div[normalize-space()='Created collection successfully!']",
          { state: "hidden" },
        );

        //wait for alert message
        await this.page.waitForSelector(`//span[normalize-space()="Created ${collectionInfo.collection_title}"]`);
        await this.page.waitForSelector("//h4[normalize-space()='Products']");
      }
      // add product to collection
      if (collectionInfo.product_title) {
        await this.page.click("//button[normalize-space()='Add product']");
        await this.page.waitForSelector("//h2[normalize-space()='Select products']");

        for (let i = 0; i < collectionInfo.product_title.length; i++) {
          await this.page
            .locator("//input[@placeholder='Search for product']")
            .type(collectionInfo.product_title[i], { delay: 100 });
          const xpathProduct = `//div[normalize-space()='${collectionInfo.product_title[i]}']//span[@class='s-check']`;
          await this.page.waitForSelector(xpathProduct);
          await this.page.click(xpathProduct);
        }
        await this.page.click("(//span[normalize-space()='Save'])[last()]");
        await this.page.waitForSelector(
          "//div[contains(@class,'s-toast')]//div[normalize-space()='Select product successfully']",
        );
        // wait for product sau khi tao sync trong db
        await this.page.waitForTimeout(30000);
        const xpathBtnRefresh = "//button//span[normalize-space()='Refresh']";
        await this.page.waitForSelector(xpathBtnRefresh);
        do {
          await this.clickOnBtnWithLabel("Refresh");
          if (await this.page.locator(this.xpathLoadIcon).isVisible({ timeout: 3000 })) {
            await this.page.waitForSelector(this.xpathLoadIcon, { state: "hidden" });
          }
          // chờ 1 giây để sync product trong collection, xong click Refresh để check lại đã sync thành công hay chưa
          await this.page.waitForTimeout(1000);
        } while (await this.page.locator(xpathBtnRefresh).isVisible());
        await this.page.waitForSelector("//tbody[@class='product-table']//tr");
      }
    } else {
      if (collectionInfo.collection_type === "Automated") {
        await this.page.click("//input//following::span[normalize-space()='Automated']");
        await this.page.click(
          `//span[normalize-space()='${collectionInfo.condition_type}']//preceding-sibling::span[@class='s-check']`,
        );

        // click button Add another condition
        for (let i = 0; i < collectionInfo.conditions.length - 1; i++) {
          await this.clickOnBtnWithLabel("Add another condition");
        }
        // fill condition
        for (let i = 0; i < collectionInfo.conditions.length; i++) {
          const value = collectionInfo.conditions[i].split(">").map(item => item.trim());
          if (value[0]) {
            await this.page.selectOption(`(//div[@class='s-select s-flex--fill']//select)[${i + 1}]`, {
              label: value[0],
            });
          }
          if (value[1]) {
            await this.page.selectOption(`(//div[@class='s-select condition-select s-flex--fill']//select)[${i + 1}]`, {
              label: value[1],
            });
          }
          if (value[2]) {
            await this.page.fill(`(//div[@class='s-flex--fill s-input']//input[@id='Property'])[${i + 1}]`, value[2]);
          }
        }
        await this.clickOnBtnWithLabel("Save");
        if (!collectionInfo.message_error) {
          await this.page.waitForSelector(
            "//div[contains(@class,'s-toast')]//div[normalize-space()='Created collection successfully!']",
          );
          await this.page.waitForSelector(
            "//div[contains(@class,'s-toast')]//div[normalize-space()='Created collection successfully!']",
            { state: "hidden" },
          );
          await this.page.waitForSelector(`//span[normalize-space()="Created ${collectionInfo.collection_title}"]`);
        }
        // wait for product sau khi tao sync trong db
        await this.page.waitForTimeout(30000);
      }
    }
  }

  /**
   * create manual collection include name, description, meta title, metadescription
   * @param collectionInfo
   */
  async createCustomCollection(collectionInfo: CreateCustomCollectionResponse): Promise<void> {
    //add title collection
    if (collectionInfo.custom_collection.title) {
      await this.clearInPutData(this.xpathTitleTextbox);
      await this.inputTextBoxWithLabel("Title", collectionInfo.custom_collection.title);
    }
    //add description collection
    if (collectionInfo.custom_collection.body_html) {
      await this.page
        .frameLocator(this.xpathTextAreaFrame)
        .locator(this.xpathAreaDescription)
        .fill(collectionInfo.custom_collection.body_html);
    }
    //choose collection type
    if (collectionInfo.custom_collection.collection_type === "custom") {
      await this.page.click(this.xpathToggleManualType);
    }
    //add seo page title
    await this.page.locator(this.xpathEditSEOPage).click();
    await this.page.locator(this.xpathTextboxPageTitle).fill(collectionInfo.custom_collection.metafields[1].value);
    await this.page.locator(this.xpathTextAreaDescription).fill(collectionInfo.custom_collection.metafields[0].value);

    await this.page.locator(this.xpathSaveButton).waitFor({ state: "visible" });
    await this.clickOnBtnWithLabel("Save");
  }

  /**
   * Edit collection on Dashboard
   * @param collectionData
   */
  async editCustomCollection(collectionData, collectionName): Promise<void> {
    await this.goto("admin/collections");
    await this.page.locator(this.getCollectionNameOnTable(collectionName)).click();
    //edit title collection
    if (collectionData.title) {
      await this.clearInPutData(this.xpathTitleTextbox);
      await this.inputTextBoxWithLabel("Title", collectionData.title);
    }
    //edit description collection
    if (collectionData.description) {
      await this.page
        .frameLocator(this.xpathTextAreaFrame)
        .locator(this.xpathAreaDescription)
        .fill(collectionData.description);
    }
    //edit seo page title
    await this.page.locator(this.xpathEditSEOPage).click();
    await this.page.locator(this.xpathTextboxPageTitle).click();
    await pressControl(this.page, "A");
    await this.page.locator(this.xpathTextboxPageTitle).fill(collectionData.meta_title);
    await this.page.locator(this.xpathTextAreaDescription).click();
    await pressControl(this.page, "A");
    await this.page.locator(this.xpathTextAreaDescription).fill(collectionData.meta_description);

    await this.page.locator(this.xpathSaveButton).first().waitFor({ state: "visible" });
    await this.clickOnBtnWithLabel("Save");
  }

  /**
   * Collections for create new
   * @param collectionInfo
   */
  async createCollectionFromList(collectionInfo): Promise<void> {
    await this.gotoCollectionList();
    await this.clickOnBtnWithLabel("Create collection");
    await this.createCollection(collectionInfo);
  }

  /**
   * Add product to collection in collection page
   * @param productTitle
   */
  async addProductToCollectionDetail(productTitle: string): Promise<void> {
    for (let i = 0; i < productTitle.length; i++) {
      await this.page.locator("//input[@placeholder='Search for product']").fill(productTitle[i]);
      const xpathProduct = `//div[normalize-space()='${productTitle[i]}']//span[@class='s-check']`;
      await this.page.waitForSelector(xpathProduct);
      await this.page.click(xpathProduct);
    }
    await this.page.click("(//span[normalize-space()='Save'])[last()]");
    await this.page.waitForSelector(
      "//div[contains(@class,'s-toast')]//div[normalize-space()='Select product successfully']",
    );
    await this.page.waitForSelector(
      "//div[contains(@class,'s-toast')]//div[normalize-space()='Select product successfully']",
      { state: "hidden" },
    );
  }

  /**
   * Click button View collection
   */
  async clickBtnViewCollection(): Promise<void> {
    await this.page.click("(//*[child::*[text()[normalize-space()='View']]])[1]");
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Get collection handle on Dashboard
   * @param collectionName is collection name
   * @param authRequest is auth request
   * @param accessToken is access token
   */
  async getCollectionHandle(
    collectionName: string,
    authRequest: APIRequestContext,
    accessToken?: string,
  ): Promise<string> {
    let options = {};
    if (accessToken) {
      options = {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      };
    }
    let response;
    const collectionUrl = `https://${this.domain}/admin/collections.json?title=${collectionName}`;
    if (accessToken) {
      response = await this.page.request.get(collectionUrl);
    } else {
      response = await authRequest.get(collectionUrl, options);
    }

    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const collections = jsonResponse.collections;
    const index = collections.length - 1;
    return await collections[index].handle;
  }

  /**
   * Get collection id on Dashboard
   * @param collectionName is collection name
   * @param authRequest is auth request
   * @param accessToken is access token
   */
  async getCollectionIdByAPI(
    collectionName: string,
    authRequest: APIRequestContext,
    accessToken?: string,
  ): Promise<number> {
    let options = {};
    if (accessToken) {
      options = {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      };
    }
    let response;
    const collectionUrl = `https://${this.domain}/admin/collections.json?title=${collectionName}`;
    if (accessToken) {
      response = await this.page.request.get(collectionUrl);
    } else {
      response = await authRequest.get(collectionUrl, options);
    }

    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const collections = jsonResponse.collections;
    return collections[collections.length - 1].id;
  }

  /**
   * Check product sync to collection detail page
   * @param productName is product title
   */
  async checkProductSyncToCollectionDetailPage(productName: string[]): Promise<boolean> {
    for (let i = 0; i < productName.length; i++) {
      const xpathProduct = `(//div[contains(@class,'section-overview') and descendant::h4[normalize-space()='Products']]//td[normalize-space()='${productName[i]}'])[1]`;
      const checkProductVisible = await this.page.locator(xpathProduct).isVisible();
      if (checkProductVisible === false) {
        return false;
      }
    }
    return true;
  }

  /**
   * Set format for description collection on collection detail page
   * @param formatDescription is format description
   */
  async setFormatForDescriptionCollection(formatDescription: FormatDescription): Promise<void> {
    if (formatDescription.format) {
      await this.page.click("//button[@title='Blocks']");
      await this.page.click(
        `//div[@class='tox-collection__item-label']//*[normalize-space()='${formatDescription.format}']`,
      );
    }
    if (formatDescription.text_type) {
      await this.page.click(`//button[@title='${formatDescription.text_type}']`);
    }
    if (formatDescription.text_color) {
      await this.page.click("//div[@title='Text color']//span[@class='tox-tbtn tox-split-button__chevron']");
      await this.page.click(
        `//div[@class='tox-menu tox-swatches-menu tox-selected-menu']//div[@title = '${formatDescription.text_color}']`,
      );
    }
    if (formatDescription.bullet_list) {
      await this.page.click("//div[@title='Bullet list']");
    }
    if (formatDescription.number_list) {
      await this.page.click("//div[@title='Numbered list']");
    }
    if (formatDescription.description) {
      await this.page
        .frameLocator("//iframe[contains(@id,'tiny-vue')]")
        .locator("//body[@id='tinymce']")
        .fill(formatDescription.description);
    }
  }

  /**
   * Set Search engine listing preview of collection
   * @param seoDetail
   */
  async setSearchEngineListingPreviewOfCollection(seoDetail: SEODetail): Promise<void> {
    if (seoDetail.page_title) {
      await this.page.fill(
        "//div[child::label[normalize-space()='Page title']]//following-sibling::div//input",
        seoDetail.page_title,
      );
    }
    if (seoDetail.meta_description) {
      await this.page.fill(
        "//div[child::label[normalize-space()='Meta description']]//following-sibling::div//textarea",
        seoDetail.meta_description,
      );
    }
    if (seoDetail.url_and_handle) {
      await this.page.fill(
        "//div[child::label[normalize-space()='URL and handle']]//following-sibling::div//input",
        seoDetail.url_and_handle,
      );
    }
  }

  /**
   * Set image for collection
   * @param collectionImage
   */
  async setImageForCollection(collectionImage: string): Promise<void> {
    const filePathImage = appRoot + `/data/shopbase/${collectionImage}`;
    await this.page.setInputFiles(
      "//div[contains(@class,'title-description')][child::h4[normalize-space()='Collection image']]//input",
      filePathImage,
    );
  }

  /**
   * Edit image for collection
   * @param collectionImage
   */
  async editImageForCollection(collectionImage: string): Promise<void> {
    await this.page.click(
      "//div[contains(@class,'title-description')]//h4[contains(text(),'Collection image')]" +
        "//a[normalize-space()='Edit']",
    );
    await this.page.click("//span[normalize-space()='Remove']");
    const filePathImage = appRoot + `/data/shopbase/${collectionImage}`;
    await this.page.setInputFiles(
      "//div[contains(@class,'title-description')][child::h4[normalize-space()='Collection image']]//input",
      filePathImage,
    );
  }

  /**
   * Sort product in collection
   * @param sortType is sort type
   */
  async sortProductInCollection(sortType: string): Promise<void> {
    if (sortType) {
      await this.page.selectOption("//div[@class='product-list-action row']//select", {
        label: sortType,
      });
    }
    await this.page.waitForSelector("//button//span[normalize-space()='Refresh']");
    while (await this.checkLocatorVisible("//button//span[normalize-space()='Refresh']")) {
      await this.page.click("//button//span[normalize-space()='Refresh']");
      if (await this.page.locator(this.xpathLoadIcon).isVisible({ timeout: 3000 })) {
        await this.page.waitForSelector(this.xpathLoadIcon, { state: "hidden" });
      }
    }
    await this.page.waitForSelector("//*[@class='product-table']");
  }

  /**
   * Delete product in collection manual detail page
   * @param productName is product name
   */
  async deleteProductInCollectionDetailPage(productName: string[]): Promise<void> {
    for (let i = 0; i < productName.length; i++) {
      const xpathProduct = `//tbody//tr[descendant::a[normalize-space()='${productName[i]}']]//i`;
      await this.page.click(xpathProduct);
      await this.isToastMsgVisible("Removing product on the background. You may refresh the page to see the update.");
      await this.page.click("//button//span[normalize-space()='Refresh']");
    }
  }

  /**
   * Delete collection
   * @param collectionName is collection name
   */
  async deleteCollection(collectionName: string): Promise<void> {
    await this.searchCollection(collectionName);
    await this.page.waitForTimeout(3000);
    const countCollection = await this.page
      .locator(`//tr[descendant::a[normalize-space()='${collectionName}']]`)
      .count();
    for (let i = 0; i < countCollection; i++) {
      await this.page.click(`//tr[descendant::a[normalize-space()='${collectionName}']]//span[@class='s-check']`);
      await this.clickOnBtnWithLabel("Actions");
      await this.genLoc("//span[normalize-space()='Delete selected collections']").click();
      await this.page.waitForSelector("//div[@class='s-animation-content s-modal-content']");
      await this.clickOnBtnWithLabel("Delete");
    }
  }

  /**
   * Delete all collection on collection list page
   */
  async deleteAllCollection(): Promise<void> {
    await this.page.waitForSelector("//tr[descendant::th[normalize-space()= 'TITLE']]");
    if ((await this.checkLocatorVisible("//p[contains(text(),'You have no collections yet')]")) === false) {
      await this.genLoc("//tr[descendant::th[normalize-space()= 'TITLE']]//span[@class='s-check']").click();
      await this.genLoc("//div[@class='action-table']//button[normalize-space()='Actions']").click();
      await this.genLoc("text=Delete selected collections").click();
      await this.page.waitForSelector("//div[contains(@class,'s-animation-content')]");
      await this.genLoc("button:has-text('Delete')").click();
    }
    await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
  }

  /**
   * Add collection to product detail page
   * @param collectionName is collection name
   */
  async addCollectionToProductDetailPage(collectionName: string): Promise<void> {
    await this.page.locator("//input[@placeholder='Search for collections']").click();
    await this.page.fill("//input[@placeholder='Search for collections']", collectionName);
    await this.page.waitForSelector("//div[@class='s-dropdown-menu is-opened-bottom']");
    await this.page.click(
      `(//div[@class='s-dropdown-menu is-opened-bottom']//span[child::span[normalize-space()='${collectionName}']])[1]`,
    );
  }

  /**
   * Remove collection from product detail page
   * @param collectionName is collection name
   */
  async removeCollectionFromProductDetailPage(collectionName: string): Promise<void> {
    await this.page.click(
      `(//div[@class='tag-list-items']//span[child::span[normalize-space()='${collectionName}']]//a)[1]`,
    );
  }

  /**
   * Add to collection from product list page
   * @param collectionName is collection name
   * @param productName is product name
   */
  async addOrRemoveToCollectionFromProductListPage(collectionName: string): Promise<void> {
    await this.waitUntilElementVisible("//div[@id='add-to-collection-modal']");
    await this.page.click("//input[@placeholder='Search for collections']");
    await this.waitUntilElementVisible("//div[@class='item-list']");
    await this.page.check(
      `//div[@class='item' and descendant::div[normalize-space()='${collectionName}']]//span[@class='s-check']`,
    );
    await this.page.click("//div[@id='add-to-collection-modal']//button[normalize-space()='Save']");
  }

  /**
   * Delete collection on collection detail page
   * @param collectionName is collection name
   */
  async deleteCollectionOnCollectionDetail(collectionName: string): Promise<void> {
    await this.gotoCollectionDetail(collectionName);
    if (await this.checkLocatorVisible("//div[@class='collection-detail-page']//label[normalize-space()='Title']")) {
      await this.clickOnBtnWithLabel("Delete");
      await this.page.waitForSelector("//div[@class='s-animation-content s-modal-content']");
      await this.page.click(
        "//div[@class='s-animation-content s-modal-content']//button[normalize-space() = 'Delete']",
      );
    }
  }

  /**
   * Get xpath follow product name in collection
   * @param productName is name of product
   * @returns xpath follow product name in collection
   */
  async getXpathProductInCollection(productName: string): Promise<string> {
    return `//*[@class="product-table"]//a[normalize-space()="${productName}"]`;
  }

  /**
   * Get index tab collection
   * @param tab
   */
  async getIndexTabCollection(tab: tabCollection): Promise<number> {
    let indexTab;
    switch (tab) {
      case "Manual collections":
        indexTab = 1;
        break;
      case "Automated collections":
        indexTab = 2;
        break;
      default:
        indexTab = 0;
        break;
    }
    return indexTab;
  }

  /**
   * Get list collection in Dashboard
   * @param tab
   */
  async getListCollectionInDB(tab: tabCollection = "All"): Promise<string[]> {
    const indexTab = await this.getIndexTabCollection(tab);
    const listCollection = [];
    const countRow = await this.genLoc(this.xpathTabPanel).nth(indexTab).locator(this.xpathCollectionRow).count();
    for (let i = 1; i <= countRow; i++) {
      const collectionTitle = await this.genLoc(
        `(((${this.xpathTabPanel})[${indexTab + 1}]${this.xpathCollectionRow})[${i}]//td)[2]//a`,
      ).innerText();
      listCollection.push(collectionTitle);
    }
    return listCollection;
  }

  /**
   * Choose sort type in Dashboard
   * @param sortType
   * @param tab
   */
  async chooseSortTypeInDB(sortType: sortType, tab: tabCollection = "All") {
    const indexTab = await this.getIndexTabCollection(tab);
    await this.genLoc(this.xpathTabNavigation).nth(indexTab).click();
    await this.genLoc(this.xpathSortCollection.sortTypeBtn).nth(indexTab).click();
    await this.genLoc(this.xpathSortCollection.sortOtpion(sortType)).last().click();
    await this.waitForElementVisibleThenInvisible(this.xpathTableLoading);
  }

  /**
   * Get label sort type button
   */
  async getLabelSortTypeBtn(tab: tabCollection = "All"): Promise<string> {
    const indexTab = await this.getIndexTabCollection(tab);
    const labelSortTypeBtn = await this.genLoc(this.xpathSortCollection.sortTypeBtn)
      .locator(`//span[@class="sb-button--label"]`)
      .nth(indexTab)
      .innerText();
    return labelSortTypeBtn;
  }
}
