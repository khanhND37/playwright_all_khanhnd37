import { expect, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { CollectionAppstore, CategoryAppstore, AppOfCollection, AppDetail } from "@types";
export class AppstoreHomePage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathUserName = "(//a[@class='menu-item-link'])[13]";

  /**
   * Open appstore
   */
  async goToAppStore(collectionName: string) {
    await this.goto("");
    await this.page.waitForSelector(`//h4[normalize-space()='${collectionName}']`);
  }

  async reOpenAppstore(collectionName: string) {
    const xpathCollectionName = await this.genLoc(`//h4[normalize-space()='${collectionName}']`).isHidden();
    if (xpathCollectionName) {
      await this.goToAppStore(collectionName);
    }
  }

  /**
   * Login account shopbase tại trang appstore
   * @param email
   * @param password
   * @param name
   */
  async signInAndChooseShop(email: string, password: string, name: string) {
    await this.genLoc("//a[normalize-space()='Login']").click();
    await this.page.waitForLoadState("load");
    await this.genLoc("//input[@type = 'text']").fill(email);
    await this.genLoc("//input[@type = 'password']").fill(password);
    await this.genLoc("//button[@type = 'submit']").click();
    await Promise.all([this.page.waitForNavigation(), this.genLoc(`//span[normalize-space()='${name}']`).click()]);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Search app, feature
   * @param app
   */
  async searchApp(app: string) {
    await this.genLoc("//input[@placeholder='Search for app']").fill(app);
    this.genLoc("//input[@placeholder='Search for app']").press("Enter");
  }

  /**
   * Get danh sách collection by api
   * @param api
   * @returns
   */
  async getCollection(api: string) {
    const response = await this.page.request.get(`${api}/v1/3rd-party/apps/collections?all=true`);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get thông tin mỗi collection
   * @param api
   * @returns
   */
  async getCollectionByApi(api: string): Promise<CollectionAppstore[]> {
    const result = await this.getCollection(api);
    const topCollection = result.list_collections.map(item => {
      return {
        name: item.collection_data.name,
        description: item.collection_data.description,
        imgLogo: item.collection_data.img_logo,
      };
    });
    return topCollection;
  }

  /**
   * Get thông tin hiển thị ở sidebar của collection
   * @returns
   */
  async getCollectionSidebar(): Promise<CollectionAppstore[]> {
    const collections = [];
    for (let i = 0; i < 4; i++) {
      const collection = {
        name: await this.page.innerText("(//div[@class='block-title'])[" + (i + 1) + "]"),
        imgLogo: await this.page.getAttribute("(//div[@class='block-icon']//img)[" + (i + 1) + "]", "src"),
      };
      collections.push(collection);
    }
    return collections;
  }

  /**
   * Get danh sách category by api
   * @param api
   * @returns
   */
  async getCategoryByApi(api: string) {
    const response = await this.page.request.get(`${api}/v1/3rd-party/apps/categories`);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get thông tin của mỗi api
   * @param api
   * @returns
   */
  async getListCategoryByApi(api: string): Promise<CategoryAppstore[]> {
    const result = await this.getCategoryByApi(api);
    const listCategory = result.categories.map(item => {
      return {
        name: item.name,
        imgLogo: item.img_logo,
        description: item.description,
        imgBackground: item.img_background,
        handle: item.handle,
      };
    });
    return listCategory;
  }

  /**
   * Get thông tin hiển thị của mỗi category ở sidebar
   * @returns
   */
  async getCategorySidebar(): Promise<CategoryAppstore[]> {
    const categories = [];
    const count = await this.genLoc("//li[@class='el-menu-item block-menu-item']").count();
    for (let i = 1; i <= count; i++) {
      const category = {
        name: await this.page.innerText(
          "(//li[@class='el-menu-item block-menu-item'])[" + i + "]//descendant::span[2]",
        ),
        imgLogo: await this.page.getAttribute("(//span[@class='img']//img)[" + i + "]", "src"),
      };
      categories.push(category);
    }
    return categories;
  }

  /**
   * Get thông tin hiển thị mỗi collection ở màn hình nội dung
   * @returns
   */
  async getCollectionViewScreen() {
    const collections = [];
    const number = await this.genLoc("//header[@class='collections-title']").count();
    for (let i = 1; i <= number; i++) {
      const collection = {
        name: await this.page.innerText("(//header[@class='collections-title']//h4)[" + i + "]"),
        description: await this.page.innerText("(//span[@class='collections-short-desc-txt'])[" + i + "]"),
      };
      collections.push(collection);
    }
    return collections;
  }

  /**
   * Get thông tin mỗi app, feature thuộc collection ở màn hình nội dung
   * @param appName
   * @param collectionName
   * @returns
   */
  async getAppOfCollection(appName: string, collectionName: string): Promise<AppOfCollection> {
    const name = await this.getTextContent(
      `((//div[descendant::h4[normalize-space()='${collectionName}']])[9]//h5)[normalize-space()='${appName}']`,
    );
    const shortDescription = await this.getTextContent(
      `(((//div[descendant::h4[normalize-space()='${collectionName}']])[9]//h5)
      [normalize-space()='${appName}']//following::p)[1]`,
    );
    return {
      name: name,
      shortDescription: shortDescription,
    };
  }

  /**
   * Get thông tin hiển thị của mỗi category ở màn hình nội dung
   * @returns
   */
  async getListCategory(): Promise<CategoryAppstore[]> {
    const categories = [];
    const count = await this.genLoc("//h5[@class='categories-name']").count();
    for (let i = 1; i <= count; i++) {
      const background = await this.page.getAttribute("(//div[@class='categories-item'])[" + i + "]", "style");
      const url = background.match(/url\(['"]([^'"]+)['"]\)/)[1];
      const category = {
        name: await this.getTextContent("(//h5[@class='categories-name'])[" + i + "]"),
        description: await this.getTextContent("(//p[@class='categories-description'])[" + i + "]"),
        imgBackground: url,
      };
      categories.push(category);
    }
    return categories;
  }

  /**
   * Mở trang detail một app/feature
   * @param app
   */
  async goToAppDetail(app: string) {
    await this.searchApp(app);
    await this.genLoc(`//h5[normalize-space()='${app}']`).click();
  }

  /**
   * Get thông tin app từ api
   * @param api
   * @param handle
   * @returns
   */
  async getAppInfByApi(api: string, handle: string): Promise<AppDetail> {
    const res = await this.page.request.get(`${api}/v1/3rd-party/apps/handle/${handle}`);
    expect(res.status()).toBe(200);
    const response = await res.json();
    return {
      appName: response.app_name,
      shortDescription: response.short_description,
      logo: response.logo,
      pricingType: response.pricing_type,
      pricingValue: response.pricing_value,
      websiteUrl: response.website_url,
      supportPageUrl: response.support_page_url,
      description: response.description.replaceAll("*", ""),
      rating: response.rating,
      rateCount: response.rate_count,
    };
  }

  /**
   * Get url các screenshort của app/feature
   * @returns
   */
  async getScreenShort(): Promise<string[]> {
    const number = await this.page.locator("//img[@class='screenshot-img']").count();
    const imgs = [];
    for (let i = 1; i <= number; i++) {
      const img = (await this.page.getAttribute("(//img[@class='screenshot-img'])[" + i + "]", "src")).replaceAll(
        " ",
        "",
      );
      imgs.push(img);
    }
    return imgs;
  }

  /**
   * Get thông tin hiển thị của app/feature trên trang detail
   * @returns
   */
  async getAppInfDetailPage(): Promise<AppDetail> {
    return {
      appName: await this.getTextContent("//h1[@class='detail-app__info__title']"),
      shortDescription: await this.getTextContent("//p[@class='detail-app__info__description']"),
      logo: await this.page.getAttribute("//img[@class='detail-app__info__logo']", "src"),
      price: await this.getTextContent("//p[@class='detail-app__info__rating__type']"),
      websiteUrl: await this.page.getAttribute("//a[@class='app-info__detail__cta__visit']", "href"),
      supportPageUrl: await this.page.getAttribute("//a[@class='app-info__detail__cta__contact']", "href"),
      description: await this.page.innerText("//div[@class='app-info__content__txt']/div"),
      screenShort: await this.getScreenShort(),
    };
  }

  /**
   * Điền thông tin form review app/feature
   * @param title
   * @param description
   * @param star
   * @param isCheck
   */
  async writeReview(title: string, description: string, star: boolean, isCheck: boolean) {
    await this.genLoc("//span[normalize-space()='Write a review']").click();
    if (star) {
      await this.genLoc("//img[@class='star-4']").click();
    }
    await this.genLoc("//input[@placeholder='Enter your title…']").fill(title);
    await this.genLoc("//textarea[@class='el-textarea__inner']").fill(description);
    if (isCheck) {
      await this.genLoc("//span[@class='el-checkbox__inner']").check();
    }
  }

  /**
   * mở trang collection detail, category detail
   * @param type
   * @param handle
   */
  async goToCollectionOrCategoryDetail(type: string, handle: string) {
    await this.page.goto(`https://${this.domain}/${type}/${handle}`);
    await this.page.waitForLoadState("load");
  }

  /**
   * đếm số app/feature ở mỗi trang detail của một collection hoặc category
   * @returns
   */
  async countPageCollectionOrCatgory() {
    const countPage = await this.genLoc("//ul[@class='el-pager']/li").count();
    const countApps = [];
    for (let i = 1; i <= countPage; i++) {
      await this.genLoc("(//ul[@class='el-pager']/li)[" + i + "]").click();
      await this.page.waitForSelector("//h1[@class='collection-description']");
      const countApp = await this.genLoc("//div[@class='el-col el-col-6 el-col-xs-12 is-guttered']").count();
      countApps.push(countApp);
    }
    return countApps;
  }

  /**
   * đếm tổng số app/feature ở trang collection/category detail
   * @returns
   */
  async countTotalApp() {
    if (await this.page.locator("//ul[@class='el-pager']").isVisible()) {
      const countApps = await this.countPageCollectionOrCatgory();
      let sum = 0;
      for (let i = 0; i < countApps.length; i++) {
        sum += countApps[i];
      }
      return sum;
    } else {
      return await this.genLoc("//div[@class='el-col el-col-6 el-col-xs-12 is-guttered']").count();
    }
  }

  /**
   * get thông tin hiển thị của collection hoặc category ở trang detail
   * @returns
   */
  async getCollectionOrCategoryInfDetailPage(): Promise<CollectionAppstore> {
    return {
      name: await this.getTextContent("//h1[@class='collection-description']"),
      description: await this.getTextContent("//p[@class='collection-subtext']"),
      handle: this.page.url().split("/").pop(),
      totalApp: await this.countTotalApp(),
    };
  }

  /**
   * get thông tin hiển thị của mỗi app/feature ở trang collection hoặc category detail
   * @param appName
   * @returns
   */
  async getAppInfOfCollectionOrCategoryDetailPage(appName: string): Promise<AppDetail> {
    return {
      appName: await this.getTextContent(`//h5[normalize-space()='${appName}']`),
      shortDescription: await this.getTextContent(`//h5[normalize-space()='${appName}']//ancestor::div[2]//p`),
      logo: await this.page.getAttribute(`//h5[normalize-space()='${appName}']//ancestor::div[3]//img`, "src"),
      price: await this.getTextContent(
        `//h5[normalize-space()='${appName}']//ancestor::div[2]//div[@class='badge d-flex']`,
      ),
    };
  }

  /**
   * Search App Eber - Loyalty Marketing -> Press Enter -> Click Install this app
   * @param thirdApp: enter an app in the appstore. Ex: App Eber - Loyalty Marketing
   */
  async clickBtnInstallApp(page: Page, thirdApp: string) {
    await page.locator(`//input[@placeholder="Search for app"]`).fill(`${thirdApp}`);
    await page.locator(`//input[@class="el-input__inner"]`).press("Enter");
    await page.locator(`//h5[normalize-space()="${thirdApp}"]`).click();
    await page.locator(`//p[normalize-space()="Install this app"]`).click();
  }

  /**
   * Click button Cancel to close popup install app
   */
  async closePopupInstallApp() {
    await this.page.locator(`(//span[normalize-space()="Cancel"])[1]`).click();
  }

  /**
   * Login account shopbase to install Third App
   * @param email: Enter an email account SB
   * @param password: Enter password
   * @param name: choose a shop in select a shop screen
   */
  async login(email: string, password: string, name: string) {
    await this.page.waitForLoadState("load");
    await this.genLoc("//input[@type = 'text']").fill(email);
    await this.genLoc("//input[@type = 'password']").fill(password);
    await this.genLoc("//button[@type = 'submit']").click();
    await Promise.all([this.page.waitForNavigation(), this.genLoc(`//span[normalize-space()='${name}']`).click()]);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * click Uninstall Third app to run test repeat steps next time
   */
  async uninstallThirdApp(thirdApp: string) {
    await this.page.locator(`(//div[child::p[contains(text(),'${thirdApp}')]]//following::i)[1]`).click();
    await this.page.locator(`//span[contains(text(),'Uninstall')]`).click();
  }

  /**
   * Thực hiện login ở màn detail app/feature và đi đến màn phân quyền app/feature trong dashboard
   * @param email
   * @param password
   * @param name
   * @param url
   */
  async loginInDetailPage(email: string, password: string, name: string, url: string) {
    await this.genLoc("//p[text()='Try it on your store']").click();
    await this.genLoc("//span[normalize-space()='Login']").click();
    await this.login(email, password, name);
    await this.page.waitForURL(url);
    await this.genLoc("//p[text()='Try it on your store']").click();
  }
}
