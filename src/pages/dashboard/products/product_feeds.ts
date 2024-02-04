import { DashboardPage } from "@pages/dashboard/dashboard";
import type { FeedInfo, FeedProductData, VariantInfoAPI } from "@types";
import { APIRequestContext, Page } from "@playwright/test";
import { removeCurrencySymbol } from "@core/utils/string";
import { ProductPage } from "../products";
export class ProducFeedPage extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathNoFeedFound = "//div[@class='no-table-content']//strong[normalize-space()='You have no product feed yet']";
  xpathNoProdInMngProdDta = "//td[@class='no-product']";
  xpathMngProdDta = `${this.domain}/admin/product-feeds/v2/manage`;
  xpathBell = "//span/img[@alt='in-app-notification-bell']";
  xpathStatusProductInFeed = "//table[@id='products-feeds']//tbody//td[4]//p";
  xpathWaitMngProdDta = "//table[@id='products-feeds']//thead//th[normalize-space()='Google product category']";
  xpathCheckboxListProduct = "(//tbody//span[@class='s-check'])";
  xpathImportFile = "//input[@type='file' and @accept='.zip, .csv']";
  xpathFilterID = "//p[normalize-space()='ID']//ancestor::div[@role='button']";
  xpathFilterAgeGroup = "//p[normalize-space()='Age group']//ancestor::div[@role='button']";
  xpathSelectAgeGroup = "//option[normalize-space()='Select an age group']//parent::select";
  xpathFilterGender = "//p[normalize-space()='Gender']//ancestor::div[@role='button']";
  xpathSelectGender = "//option[normalize-space()='Select a gender']//parent::select";
  xpathManageProductData = "//div[normalize-space()='Manage Product Data']/a";
  xpathSelectAllProductData = "//*[@id='products-feeds']/thead/tr/th[1]/span/label";
  xpathDeleteDomain = "//a[normalize-space()='Remove']";
  xpathGetPrimaryDomain =
    "(//h4[normalize-space()='Primary domain']//parent::div/parent::div/following-sibling::div//td)[1]";
  xpathMessDeleteDomainSuccess = "//span[normalize-space()='Successfully removed domain']";
  xpathCheckExistingDomain =
    "//h4[normalize-space()='Domains']//parent::div/parent::div/following-sibling::div//td[@class='p15']";
  xpathTitleBlogDomain = "//h4[normalize-space()='Domains']";
  xpathChangePrimaryDomain = "//h1[normalize-space()='Change primary domain?']";
  xpathMessChangeDomainSuccess = "//span[normalize-space()='Primary domain successfully changed']";
  xpathAddDomain = "//a[contains(@href, '/admin/domain-connect')]";
  xpathFildDomain = "//input[@id='title']";
  xpathLoadListProd = "//div[@class='s-loading-table']";
  xpathBtnManageProdData = "//a[normalize-space()='Manage Product Data']";
  xpathAllProdCurentPage = "//table[@id='products-feeds']//tbody//tr";
  xpathSelectSizeContains =
    '//input[@value="contains" and @name="size"]//following-sibling::span[normalize-space()="Contains"]';
  xpathInputProductTypeFilter = '//div[@id="filter-mange-products"]//input[@placeholder="Search product type"]';
  xpathProductHeader = '//th/div[normalize-space()="PRODUCT"]';
  xpathFeedURLHeader = '//th[normalize-space()="Product feed URL"]';
  xpathAllProductTab = '//section[@class="ui-card"]//li[1]';
  xpathFirstProduct = '//*[@id="products-feeds"]//tr[1]/td[2]/span';
  xpathSectionInDetailProduct = '(//div[contains(@class,"description-feed")]/div)[last()]/div';
  xpathSectionInDescriptionFeed = '//div[contains(@class,"description-feed")]/div';
  xpathFeedUrlLabel = '//strong[normalize-space()="Product feed URL"]';
  xpathProcessing = '//div[@class="form-container" and normalize-space()="Processing"]';
  xpathFeedUrl = '//div[text()="URL"]/following-sibling::div//a';
  xpathProductFeedSku = "//div[contains(@class, 'sku')]";
  xpathProductSize = "//div[contains(@class, 'size')]//div[contains(@class, 'input')]";

  /**
   * Return xpath span with content connect domain successfully
   * @param domain
   * @returns xpath span with content connect domain successfully
   */
  xpathMessAddDomainSuccess(domain: string) {
    return `//span[normalize-space()='Your domain ${domain} was connected successfully']`;
  }
  xpathDeleteFeed = '//span[child::i[contains(@class,"delete")]]';
  xpathDeleteAPIFeed = `(//td[child::div[normalize-space()="No URL provided"]]//following-sibling::td)[2]${this.xpathDeleteFeed}`;

  xpathLabelFilterWithText(text: string) {
    return `//div[@role='tab' and normalize-space()='${text}']/following-sibling::div`;
  }

  xpathProductFeed(title: string) {
    return `//table//tbody//td//span[contains(text(), "${title}")]`;
  }

  /**
   * click to change primary domain
   * @param domain
   */
  async clickChangePrimaryDomain(domain: string) {
    await this.page.click(`//span[normalize-space()='${domain}']//preceding-sibling::span[@class='s-check']`);
  }

  /**
   * Search prod in Manage Product Data
   * @param titleProd
   */
  async searchProd(titleProd: string): Promise<void> {
    const xpathSearch = "//input[@placeholder='Search products']";
    await this.genLoc(xpathSearch).fill(titleProd);
    await this.genLoc(xpathSearch).press("Enter");
    await this.page.waitForLoadState("load");
  }

  /***
   * get total products of the feed api at Manage products feed page
   */
  async getTotalProductsFeedAPI(authRequest: APIRequestContext, domain: string): Promise<number> {
    const response = await authRequest.post(`https://${domain}/admin/feed/v2/count-feed-data.json?platform=google`);
    if (response.ok()) {
      const respRaw = await response.json();
      return respRaw.all;
    }
  }

  /**
   * get all SKU in Manage Product Data
   * @param authRequest
   * @param domain
   */
  async getAllSkuCurentPage(authRequest: APIRequestContext, domain: string): Promise<Array<string>> {
    const allProducts = await this.getTotalProductsFeedAPI(authRequest, domain);
    const listSKU: string[] = [];

    const response = await authRequest.post(
      `https://${domain}/admin/feed/v2/fetch-list-all-products.json?platform=google&limit=${allProducts}`,
    );

    if (response.ok()) {
      const respRaw = await response.json();
      for (let i = 0; i < respRaw.result.length; i++) {
        listSKU.push(respRaw.result[i].sku);
      }
    }
    return listSKU;
  }

  /**
   * get all SKU in Manage Product Data
   * @param authRequest
   * @param domain
   */
  async getAllSizeProductFeed(authRequest: APIRequestContext, domain: string): Promise<Array<string>> {
    const allProducts = await this.getTotalProductsFeedAPI(authRequest, domain);
    const listSize: string[] = [];

    const response = await authRequest.post(
      `https://${domain}/admin/feed/v2/fetch-list-all-products.json?platform=google&limit=${allProducts}`,
    );

    if (response.ok()) {
      const respRaw = await response.json();
      for (let i = 0; i < respRaw.result.length; i++) {
        listSize.push(respRaw.result[i].size);
      }
    }
    return listSize;
  }

  /**
   * check exist data in an array
   * https://stackoverflow.com/questions/55163348/how-to-check-if-a-string-contains-a-word-in-javascript
   * @param dataCompare
   * @param listData
   * @returns
   */
  async checkExistMultiData(
    type: "include" | "exclude",
    dataCompare: string[],
    listData: string[],
    condition?: "start with" | "end with" | "equal",
  ): Promise<boolean> {
    for (let i = 0; i < listData.length; i++) {
      let regex;
      let foundMatch = false; // Flag to track if a match is found for the current element in arr1
      for (let j = 0; j < dataCompare.length; j++) {
        const allowedSeparator = "\\s-";
        switch (condition) {
          case "start with":
            regex = new RegExp(
              `(^${dataCompare[j]}[${allowedSeparator}].*)|(^${dataCompare[j]}$)`,
              // Case insensitive
              "i",
            );
            break;
          case "end with":
            regex = new RegExp(
              `(^.*[${allowedSeparator}]${dataCompare[j]}$)|(^${dataCompare[j]}$)`,
              // Case insensitive
              "i",
            );
            break;
          case "equal":
            regex = new RegExp(
              `(^${dataCompare[j]}$)`,
              // Case insensitive
              "i",
            );
            break;
          //for contains a word at any position in the string
          default:
            regex = new RegExp(
              `(^.*[${allowedSeparator}]${dataCompare[j]}$)|(^${dataCompare[j]}[${allowedSeparator}].*)|(^${dataCompare[j]}$)|(^.*[${allowedSeparator}]${dataCompare[j]}[${allowedSeparator}].*$)`,
              // Case insensitive
              "i",
            );
        }
        if (regex.test(listData[i])) {
          foundMatch = true;
          break; // Exit the inner loop if a match is found
        }
      }
      if ((foundMatch && type === "exclude") || (!foundMatch && type === "include")) {
        return false;
      }
    }
    return true;
  }

  /**
   * get infor of the item product feed by API
   * @param authRequest
   * @param domain
   * @param variantId
   * @returns
   */
  async getFeedItemInfoAPI(authRequest: APIRequestContext, domain: string, variantId: number) {
    const response = await authRequest.get(`https://${domain}/admin/feed/feed-item/${variantId}.json?platform=google`);
    if (response.ok()) {
      const respRaw = await response.json();
      return respRaw.result;
    }
  }

  xpathFeedDetailTitle(title: string) {
    return `//div[contains(@class, 'fs-large')]//div[contains(text(), "${title}")]`;
  }

  /**
   * Navigate to feed setting on dashboard with Feed Name
   * @param feedName name of feed file that you want to navigate to
   */
  async navigateToFeedDetail(feedName: string) {
    await this.page.waitForSelector(`//span[normalize-space()='${feedName}']`);
    await this.genLoc(`//span[normalize-space()='${feedName}']`).click();
  }

  async goToManageProductData() {
    await this.page.waitForSelector(this.xpathManageProductData);
    await this.genLoc(this.xpathManageProductData).click();
  }

  async clickCheckboxAllProduct() {
    await this.page.waitForSelector(this.xpathSelectAllProductData);
    await this.genLoc(this.xpathSelectAllProductData).click();
  }

  /**
   * Verify is old feed page displayed
   * @returns boolean
   */
  async isOldFeedPage(): Promise<boolean> {
    const xpath = "//p[normalize-space()='All Feeds']";
    return await this.page.locator(xpath).isVisible();
  }

  /**
   * Reload Product feed page until old feed is disable
   * @param times of reload that you want, default is 3
   */
  async reloadUntilOldFeedDisable(times = 3) {
    while (times > 0) {
      if (this.isOldFeedPage) {
        await this.page.reload();
        await this.waitUntilElementVisible(`//h1[normalize-space()='Product feeds']`);
        times--;
      } else {
        break;
      }
    }
  }

  /**
   * Count number of feed on Product feeds page
   * @returns number
   */
  async countFeed(): Promise<number> {
    await this.page.waitForLoadState("load");
    let count = 0;
    const xpath = "(//i[contains(@class, 'delete')])[1]";
    if (await this.isElementVisibleWithTimeout(xpath, 2000)) {
      count = await this.page.locator("//i[contains(@class, 'delete')]").count();
    }
    return count;
  }

  //Delete all Feed on Product feeds page
  async deleteAllFeed() {
    let count = await this.countFeed();
    while (count > 0) {
      await this.page.click(`(//i[contains(@class, 'delete')])[1]`);
      await this.clickButtonOnPopUpWithLabel("Delete");
      await this.waitForElementVisibleThenInvisible(
        "//div[contains(@class, 's-toast')]//div[normalize-space()='Deleted feed']",
      );
      count--;
    }
  }

  /**
   * Get status of sale channel on popup create product feed
   * @param channel name of sale channel
   * @returns boolean
   */
  async isSaleChannelEnable(channel: string): Promise<boolean> {
    const xpath = `//label[contains(@class, 'disable')]//h5[normalize-space()='${channel}']`;
    if (channel === "Google") {
      await this.page.waitForTimeout(1000);
      await this.page.click(`//button[contains(@class, 's-modal-close')]`);
      await this.clickOnBtnWithLabel("Add product feed");
    }
    await this.page.waitForSelector(`//h5[normalize-space()='${channel}']`);
    return !(await this.page.locator(xpath).isVisible());
  }

  /**
   * get xpath all channel
   */
  getXpathSalesChannel(channel: string): string {
    return `//h5[normalize-space()='${channel}']//ancestor::label`;
  }

  /**
   * Choose rule to export feed in feed setting
   * @param feedInfo Information of feed
   */
  async chooseExportRule(feedInfo: FeedInfo) {
    const exportRules = feedInfo.export_rules;
    //Choose field
    const xpathField = `(//span[contains(text(),'${feedInfo.export_lable}')]//ancestor::label//following-sibling::div//select)[1]`;
    await this.page.click(xpathField);
    await this.page.selectOption(xpathField, `${exportRules.field}`);
    //Choose conditions
    const xpathRelation = `(//span[contains(text(),'${feedInfo.export_lable}')]//ancestor::label//following-sibling::div//select)[2]`;
    await this.page.click(xpathRelation);
    await this.page.selectOption(xpathRelation, `${exportRules.relation}`);
    //Input rule values
    for (const i of exportRules.value) {
      await this.page
        .locator(
          `//span[contains(text(),'${feedInfo.export_lable}')]//ancestor::label//following-sibling::div//input[@placeholder='Enter keyword']`,
        )
        .fill(i);
      await this.page.keyboard.press("Enter");
    }
  }

  /**
   * Input all information to Feed seeting
   * @param feedInfo infomation when create Feed
   */
  async inputCreateFeedInfo(feedInfo: FeedInfo) {
    const exportMode = feedInfo.export_mode;
    const exportRules = feedInfo.export_rules;
    await new Promise(t => setTimeout(t, 5000));
    //Input feed name
    await this.page.waitForSelector('//input[@placeholder="Collection name - Product Feed"]', { timeout: 50000 });
    await this.inputFieldWithLabel(
      "//label[normalize-space()='Feed name']//ancestor::div[contains(@class, 's-form-item')]",
      "Collection name - Product Feed",
      feedInfo.name,
    );

    //Choose product to apply
    await this.selectOptionWithLabel(feedInfo.feed_type);
    if (feedInfo.collections_name) {
      //type to display popup search and choose collections
      await this.page.type(
        "//div[contains(@class, 'form-item__content')]//input[@placeholder='Search for collections']",
        "a",
      );
      //Add collections
      for (const i of feedInfo.collections_name) {
        await this.page
          .locator("//div[contains(@class, 'modal')]//input[@placeholder='Search for collections']")
          .fill(i);
        await this.page.click(
          `(//div[contains(@class,'product-title') and normalize-space(text()) = '${i}'])//parent::div//span[@class='s-check']`,
        );
      }
      await this.clickOnBtnWithLabel("Add");
    }

    //Choose export mode
    if (exportMode) {
      await this.selectOptionWithLabel(exportMode);
      if (exportMode === "all_variation" && exportRules) {
        await this.page.click(
          `//span[normalize-space()='Exclude the variations matching']//preceding-sibling::span[@class='s-check']`,
        );
      }
      if (exportRules) {
        await this.chooseExportRule(feedInfo);
      }
    }

    //Choose variant title option
    if (feedInfo.add_variant_option_to_title) {
      await this.selectOptionWithLabel(feedInfo.add_variant_option_to_title.toString());
    }

    //Choose Product title preference
    if (feedInfo.product_title_mode) {
      await this.selectOptionWithLabel(feedInfo.product_title_mode);
    }

    if (feedInfo.product_description_mode) {
      await this.selectOptionWithLabel(feedInfo.product_description_mode);
    }

    //Choose Submit product as custom products or not
    if (feedInfo.is_custom_products) {
      await this.selectOptionWithLabel(feedInfo.is_custom_products.toString());
    }

    //Input Default Brand Name
    if (feedInfo.brand) {
      await this.inputFieldWithLabel("", "Your brand name", feedInfo.brand);
    }

    //Choose Google product category
    if (feedInfo.google_product_category) {
      await this.inputFieldWithLabel("", "Search for Google product category", feedInfo.google_product_category);
      await this.clickElementWithLabel("div", feedInfo.google_product_category);
    }

    //Choose default gender
    if (feedInfo.gender) {
      await this.page.selectOption(
        "//label[normalize-space()='Default Gender']//ancestor::div[@class='s-form-item']//select",
        feedInfo.gender,
      );
    }

    //Choose Default Age Group
    if (feedInfo.age_group) {
      await this.page.selectOption(
        "//label[normalize-space()='Default Age Group']//ancestor::div[@class='s-form-item']//select",
        feedInfo.age_group,
      );
    }

    if (feedInfo.default_color) {
      await this.inputFieldWithLabel("", "Enter Default Color (ex: Black, White, Red ...)", feedInfo.default_color);
    }

    if (feedInfo.default_size) {
      await this.inputFieldWithLabel("", "Enter Default Size (ex: S, M, L ...)", feedInfo.default_size);
    }
  }

  /**
   * Verify Feedfile gened or not
   * @returns boolean
   */
  async isFeedFileGened(): Promise<boolean> {
    return await this.page.locator("//span[normalize-space()='Processing' and contains(@class, 's-tag')]").isVisible();
  }

  /**
   * Download Feed file
   * @returns string
   */
  async downloadFeedFile(): Promise<string> {
    await this.reloadPageUntilConditionFailed(await this.isFeedFileGened());
    return await this.downloadFile(
      "//strong[normalize-space()='Product feed URL']//ancestor::div[contains(@class, 'm-t-lg')]//a",
    );
  }

  /**
   * Verify is feed file downloaded contains target variant
   * @param csvFile feed file which downloaded
   * @param variantID id of variant that you want to check
   * @returns boolean
   */
  async isCSVFileContainVariant(
    csvFile: string[][],
    variantInfo: VariantInfoAPI,
    feedInfo: FeedInfo,
  ): Promise<boolean> {
    let csvVarTitle: string;
    let csvVarDescription: string;
    let csvVarAvailability: string;
    let csvVarCondition: string;
    let csvVarPrice: number;
    let csvVarLink: string;
    let csvVarImgLink: string;
    let csvVarBrand: string;
    let csvVarGGCate: string;
    let csvVarProductId: string;
    let csvVarAreGroup: string;
    let csvVarGtin: string;
    let csvVarSalePrice: number;
    let csvVarColor: string;
    let csvVarGender: string;
    let csvVarSize: string;
    let csvVarShippingWeight: string;
    for (let i = 0; i < csvFile.length; i++) {
      const colums = csvFile[i][0].split(",");
      if (parseInt(colums[0]) === variantInfo.id) {
        csvVarTitle = csvFile[i][1];
        csvVarDescription = csvFile[i][2];
        csvVarAvailability = csvFile[i][3];
        csvVarCondition = csvFile[i][4];
        csvVarPrice = parseFloat(removeCurrencySymbol(csvFile[i][5]));
        csvVarLink = csvFile[i][6];
        csvVarImgLink = csvFile[i][7];
        csvVarBrand = csvFile[i][8];
        csvVarGGCate = csvFile[i][9];
        switch (feedInfo.sales_channel) {
          case "tiktok":
            csvVarAreGroup = csvFile[i][10];
            csvVarColor = csvFile[i][11];
            csvVarGender = csvFile[i][12];
            csvVarProductId = csvFile[i][13];
            csvVarShippingWeight = csvFile[i][14];
            csvVarGtin = csvFile[i][16];
            csvVarSize = csvFile[i][18];
            csvVarSalePrice = parseFloat(removeCurrencySymbol(csvFile[i][19]));
            break;
          default:
            csvVarProductId = csvFile[i][10];
            csvVarGtin = csvFile[i][11];
            csvVarSalePrice = parseFloat(removeCurrencySymbol(csvFile[i][12]));
            csvVarColor = csvFile[i][13];
            csvVarGender = csvFile[i][14];
            csvVarSize = csvFile[i][15];
            csvVarAreGroup = csvFile[i][16];
            csvVarShippingWeight = csvFile[i][31];
            break;
        }
      }
    }

    const obj = { ...variantInfo };
    for (const key in obj) {
      if (key === "title") {
        if (obj[key] === csvVarTitle) {
          return true;
        }
      }
      if (key === "description") {
        if (obj[key] === csvVarDescription) {
          return true;
        }
      }
      if (key === "availability") {
        if (obj[key] === csvVarAvailability) {
          return true;
        }
      }
      if (key === "condition") {
        if (obj[key] === csvVarCondition) {
          return true;
        }
      }
      if (key === "price") {
        if (obj[key] === csvVarPrice) {
          return true;
        }
      }
      if (key === "link") {
        if (obj[key] === csvVarLink) {
          return true;
        }
      }
      if (key === "image_link") {
        if (obj[key] === csvVarImgLink) {
          return true;
        }
      }
      if (key === "brand") {
        if (obj[key] === csvVarBrand) {
          return true;
        }
      }
      if (key === "google_product_category") {
        if (obj[key] === csvVarGGCate) {
          return true;
        }
      }
      if (key === "product_id") {
        if (obj[key] === parseInt(csvVarProductId)) {
          return true;
        }
      }
      if (key === "gtin") {
        if (obj[key] === csvVarGtin) {
          return true;
        }
      }
      if (key === "sale_price") {
        if (obj[key] === csvVarSalePrice) {
          return true;
        }
      }
      if (key === "color") {
        if (obj[key] === csvVarColor) {
          return true;
        }
      }
      if (key === "gender") {
        if (obj[key] === csvVarGender) {
          return true;
        }
      }
      if (key === "size") {
        if (obj[key] === csvVarSize) {
          return true;
        }
      }
      if (key === "are_group") {
        if (obj[key] === csvVarAreGroup) {
          return true;
        }
      }
      if (key === "shipping_weight") {
        if (obj[key] === csvVarShippingWeight) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * This function will return the number of product in Manage product data by API
   * @param authRequest: request API
   * @param domain: domain shop
   */
  async getNumberProductManageData(authRequest: APIRequestContext, domain: string) {
    const response = await authRequest.post(`https://${domain}/admin/feed/v2/count-feed-data.json?platform=google`);
    let countProduct = 0;
    if (response.ok()) {
      const respRaw = await response.json();
      countProduct = respRaw.all;
      return countProduct;
    }
    return Promise.reject(`Error: ${response.status}`);
  }

  /**
   * Return if feed is created successfully
   * @param feedInfo: type of feed
   */
  async isFeedCreated(feedInfo: FeedInfo): Promise<boolean> {
    return await this.page.locator(`//span[normalize-space()='${feedInfo.name}']`).isVisible();
  }

  /**
   * Create more than 1 feed file
   * @param arrFeedInfo list all Feed Info that you want to create
   */
  async createFeeds(arrFeedInfo: Array<FeedInfo>, isRedirect = true) {
    for (const feedInfo of arrFeedInfo) {
      await this.clickOnBtnWithLabel("Add product feed");
      await this.selectOptionWithLabel(feedInfo.sales_channel);
      await this.clickButtonOnPopUpWithLabel("Confirm");
      await this.inputCreateFeedInfo(feedInfo);
      await this.clickOnBtnWithLabel("Save");
      await this.waitForToastMessageHide("Product feed was created successfully!");
      if (isRedirect) {
        await this.goto("admin/product-feeds");
        await this.page.waitForLoadState("load");
      }
    }
  }

  /**
   * Edit more than 1 feed file
   * @param arrFeedInfo list all Feed Info that you want to create
   */
  async editFeeds(arrFeedInfo: Array<FeedInfo>, isRedirect = true) {
    for (const feedInfo of arrFeedInfo) {
      await this.page.click(`//td/a[child::span[text()="${feedInfo.name}"]]`);
      await this.inputCreateFeedInfo(feedInfo);
      await this.clickOnBtnWithLabel("Save");
      await this.waitForToastMessageHide("Product feed was updated successfully!");
      if (isRedirect) {
        await this.goto("admin/product-feeds");
        await this.page.waitForLoadState("load");
      }
    }
  }

  /**
   * Verify is warning domain not connected after create feed
   * @param feedName name of feed with warning message that you want to check
   * @returns boolean
   */
  async isWarningIconDisplayed(feedName: string): Promise<boolean> {
    return await this.page
      .locator(`//span[normalize-space()='${feedName}']//ancestor::tr//span[contains(@class, 'has-text-warning')]`)
      .isVisible();
  }

  /**
   * Validate sync product update from MySQL to Eslaticsearch
   * @param authRequest: request API
   * @param productID: the reference product ID which will get in Manage product data for validate update
   * @param waitForAPICalling: timeout between 2 times api calling
   */
  async validateFeedNumberProductChanged(
    authRequest: APIRequestContext,
    productID: number,
    waitForAPICalling: number,
  ): Promise<boolean> {
    let id: number;
    for (let i = 0; i < 10; i++) {
      const response = await authRequest.post(
        `https://${this.domain}/admin/feed/v2/fetch-list-all-products.json?platform=google&limit=1000`,
      );

      if (response.ok()) {
        const respRaw = await response.json();
        // eslint-disable-next-line camelcase
        id = respRaw.result.find(({ product_id }) => product_id === productID);
        if (id) {
          return true;
        }
      }
      await new Promise(t => setTimeout(t, waitForAPICalling));
    }
    if (typeof id === "undefined") {
      return Promise.reject(
        `Error: Timeout of migrating product feed to ES, please check queue on prod following link: ` +
          `"https://queue.shopbase.com/#/queues/vhost/sync_es_feed_auto_v2"`,
      );
    }
  }

  /**
   * Validate data update in the product
   * @param authRequest: request API
   * @param domain: shop domain
   * @param variantID: product id in Manage feed data which updated info
   * @param valueEdit: The updating data reference with product updated
   */
  async validateDataProductChangedAPI(
    authRequest: APIRequestContext,
    domain: string,
    variantID: number,
    valueEdit: FeedProductData,
  ): Promise<boolean> {
    // for (let i = 0; i < variantID.length; i++) {
    const response = await authRequest.get(`https://${domain}/admin/feed/feed-item/${variantID}.json?platform=google`);

    if (response.ok()) {
      const rawData = await response.json();
      const productFeedData = rawData.result;
      for (const key in valueEdit) {
        if (typeof productFeedData[key] === "number") {
          productFeedData[key] = await productFeedData[key].toString();
          if (valueEdit[key] !== productFeedData[key]) {
            return false;
          }
        }
        // }
        return true;
      }
    }
  }

  /**
   * Choose number product by count from top
   * @param numberOfProduct: the number of product which want to select
   */
  async chooseProductByClickCheckBox(numberOfProduct: number): Promise<void> {
    for (let i = 0; i < numberOfProduct; i++) {
      await this.verifyCheckedThenClick(`${this.xpathCheckboxListProduct}[${i + 1}]`, true);
    }
    return;
  }

  /**
   * Bulk edit in Manage product data
   * @param field: field edit
   */
  async bulkEditProductFeed(field: string, value: string): Promise<void> {
    await this.clickOnBtnWithLabel("Bulk edit");
    await this.page.click(`//div[@class='s-dropdown-menu']//span[normalize-space()='${field}']`);
    const xpath =
      `//h4[normalize-space()='${field}']` + `//parent::div[@class='s-modal-header']//following-sibling::div//select`;
    await this.page.selectOption(xpath, value);
    await this.clickOnBtnWithLabel("Bulk Update");
    return;
  }

  /**
   * Update data Json with data income
   * @param jsonCSV: data csv in json
   * @param updateFeedInfo: data update
   */
  async updateDataImportFeed(jsonCSV: Array<object>, updateFeedInfo: object): Promise<void> {
    for (let i = 0; i < jsonCSV.length; i++) {
      const obj = jsonCSV[i];
      for (const key in updateFeedInfo) {
        obj[key] = updateFeedInfo[key];
      }
    }
  }

  /**
   * Import feed file into Manage product data foe updating
   * @param domain: domain shop
   * @param pathFile: file import in temp folder
   * @param xpath: xpath popup import CSV
   */
  async importFeedFile(domain: string, pathFile: string, xpath: string): Promise<void> {
    const productDashboard = new ProductPage(this.page, domain);
    const xpathDuplicate = "//p[normalize-space()='Duplicate file import']";
    const xpathUpload = "//span[contains(text(),'Upload File')]";
    await this.page.click("//button[@type='button']//descendant::span[contains(text(),'Import')]");
    await this.page.waitForLoadState("networkidle");
    await productDashboard.chooseFileCSV(pathFile, xpath);
    await this.page.waitForLoadState("networkidle");
    await this.page.click(xpathUpload);
    const error = this.page.locator("//div[@class='s-media-content']");
    if ((await error.count()) === 0) {
      await this.page.click(xpathUpload);
      await this.page.waitForLoadState("networkidle");
      if ((await this.genLoc(xpathDuplicate).count()) > 0) {
        await this.page.click("//span[contains(text(),'Upload file anyway')]");
        await this.page.click(xpathUpload);
        await this.page.waitForLoadState("networkidle");
      }
      await this.genLoc('button:has-text("OK")').click();
      await this.page.waitForLoadState("networkidle");
      await this.page.reload();
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * Count total number of the product in Manage product data
   * @param authRequest: request API
   * @param domain: shop domain
   */
  async countProductFeed(authRequest: APIRequestContext, domain: string): Promise<number> {
    const res = await authRequest.post(
      `https://${domain}/admin/feed/v2/count-feed-data.json?platform=google&limit=1000`,
    );

    if (res.ok()) {
      return (await res.json()).all;
    }
  }

  /**
   * Return xpath of item in filter
   * @param text the content of item
   * @returns xpath of item in filter
   */
  getXpathItemFilterWithText(text: string) {
    return `//div[@role="tab" and descendant::p[normalize-space()="${text}"]]`;
  }
}
