import { SBPage } from "@pages/page";
import { APIRequestContext, Page, expect } from "@playwright/test";
import { StorefrontInfo } from "@types";

export class MultipleSF extends SBPage {
  authRequest: APIRequestContext;
  constructor(page: Page, domain?: string, authRequest?: APIRequestContext) {
    super(page, domain);
    this.authRequest = authRequest;
  }

  xpathHeading = "//div[contains(@class,'storefront-heading')]";
  xpathPopup = ".sb-popup__container";
  xpathPopupHeader = ".sb-popup__header";
  xpathPopupBody = ".sb-form-item__content .sb-input__input";
  xpathIconClose = ".sb-popup__header-close";
  xpathSubMenuOnlineStore = ".li-online-store .title-child-menu-sidebar";
  xpathMenuOnlineStore = ".li-online-store";
  xpathSFList = "//div[contains(@class,'storefront-view-card')]";
  xpathPagination = "//li[contains(@class,'sb-pagination__list-item')]";
  linkDocument = "//a[normalize-space()='here.']";
  menuOnlineStore = "//span[normalize-space()='Online Store']";
  xpathSidebarStorefront = ".sidebar-menu-spds";
  xpathStorefrontTitle = "//span[contains(@class,'sidebar-menu__title')]";
  btnAddTheme = ".sb-popup__footer .sb-button--primary";
  btnCustomize = "//button[normalize-space()='Customize']";
  btnMoreAction = "//button[contains(@class,'sb-button--dropdown')]";
  xpathErrorMessage = ".sb-form-item__message";
  xpathToast = "//div[@class='s-toast is-danger is-bottom']";
  xpathOverlay = ".sb-popup--overlay";
  xpathPopupChooseTemplate = ".sb-popup__choose-template";
  btnLayoutGrid = "//div[@class='group-view-btn']//button[2]";
  xpathThumbnailGrid = "//div[contains(@class,'storefront-thumbnail-overlay')]";
  btnActions = "//span[normalize-space()='Actions']";
  xpathPopupMoreActions = "//div[@x-placement='bottom-end']";
  xpathPopupActionLayoutGrid = "//div[@x-placement='bottom-start']";
  spinner = "//div[contains(@class,'sb-spinner')]";
  btnApplyPreview = "//*[contains(@class,'template-preview__header')]//button[normalize-space() = 'Apply']";
  messageApply = "(//*[normalize-space() = 'Apply template successfully'])[1]";
  xpathStorefrontsScreen = "//div[@class='sb-layout sb-layout--fixed']";
  btnStatus = "//button[normalize-space()='Status']";
  xpathPopupSelectStatus = "//div[@x-placement='bottom-start']//div[contains(@class,'sb-select-menu')]";
  xpathThumbnailList = "//img[contains(@class,'storefront-thumbnail')]";
  xpathSidebarMenu = ".sidebar-menu-spds";
  xpathFilter = "//span[@class='sb-button--label']";
  xpathPageDesign = ".page-designs";
  xpathPageGeneral = ".setting-general-page";
  xpathPagePreferences = ".page-preferences";
  xpathPageNavigation = ".page-menu";
  xpathPages = ".creator-list-page";
  xpathPageBlogs = ".page-pages--landing";
  xpathPageDomains = ".page-domain";
  xpathPageCheckout = ".setting-checkout-page";
  xpathHeaderCheckout = "//h2[normalize-space()='Abandoned Checkouts Recovery']";
  xpathListSF = "div.storefront-view";
  xpathLoadingSFDetail = ".sb-skeleton>>nth=0";
  xpathLoadingTable = "div.s-loading-table";
  xpathImageThemePublic = "div.sb-block-item__content img";
  xpathListImageThemePublic = "div.sb-block-item__content";
  filterDomain = "//div[contains(@class,'sidebar-filter')]//p[normalize-space()='Shop Domain']";
  noHistoryInvoice = ".text-center h3";
  xpathInvoice = "//tr[@class='cursor-pointer']//following-sibling::td//span";
  xpathBilling = "//tr[@class='cursor-pointer']//following-sibling::tr//span";
  xpathAmount = "//tr[@class='cursor-pointer']//span[@class='amount_red']";
  xpathPageErr = "#page_error";
  storefrontName = ".storefront-name";
  xpathPopupContent = ".sb-popup__body";
  xpathButtonActivate = "//button[normalize-space()='Activate']";
  storefrontPrice = ".activate-storefront-price li";
  headerPaymentPopup = "//div[contains(@class,'text-heading') and normalize-space()='Make a payment']";
  totalPrice = "//p[text()='Total']//parent::div//following-sibling::div//p";

  /***
   * Get xpath name của template cũ
   * @param name
   */
  xpathOldTemplateName(name: string) {
    return `//h4[normalize-space()='${name}']`;
  }

  /***
   * Get xpath each storefront
   * @param index
   */
  getXpathStorefrontList(index: number) {
    return `//div[contains(@class,'storefront-view-card')][${index}]`;
  }

  /***
   * Get xpath Pagination
   * @param index
   */
  getXpathPagination(index: number) {
    return `//li[contains(@class,'sb-pagination__list-item')][${index}]`;
  }

  /***
   * Get xpath header
   * @param name
   */
  getXpathHeader(name: string) {
    return `//h1[normalize-space()='${name}']`;
  }

  /***
   * Get xpath status
   * @param name: name storefront
   * @param status: status storefront
   */
  getXpathStatusStf(name: string, status: string) {
    return `//h3[normalize-space()='${name}']//ancestor::span//following-sibling::div//div[normalize-space()='${status}']`;
  }

  /***
   * Get xpath filter
   * @param status
   */
  getXpathFilterStatus(status: "Status" | "Active" | "Closed") {
    return `//li[contains(@class,'sb-select-menu__item')]//label[normalize-space()='${status}']`;
  }

  /***
   * Get status storefront
   * @param index: index storefront
   */
  async getStatusStorefront(index: number): Promise<string> {
    const status = await this.page
      .locator(`(${this.getXpathStorefrontList(index)}${this.xpathHeading}//div)[2]`)
      .textContent();
    return status;
  }

  /***
   * Action with storefront
   * @param name, action
   */
  async actionWithStorefront(
    name: string,
    action: "Settings" | "Customize" | "Duplicate" | "Rename" | "Activate" | "Close",
  ) {
    await this.page
      .locator(
        `//h3[normalize-space()='${name}']//ancestor::div[contains(@class,'storefront-view-card')]//button[contains(@class,'sb-button--dropdown')]`,
      )
      .click();
    await this.page
      .locator(
        `//div[@x-placement='bottom-end']//li[@class='sb-dropdown-menu__item' and normalize-space()='${action}']`,
      )
      .click();
  }

  /***
   * Preview template store
   * @param nameTemplate
   */
  async previewTemplate(nameTemplate: string) {
    await this.page.locator(`(//img[@alt = "${nameTemplate}"])[1]//parent::figure`).hover();
    await this.page.locator(`(//img[@alt = "${nameTemplate}"])[1]//following-sibling::figcaption//a`).click();
    await this.page.waitForResponse(
      response => response.url().includes("/apps/assets/locales") && response.status() == 200,
    );
  }

  /***
   * Apply template store
   * @param nameTemplate
   */
  async applyTemplate(nameTemplate: string) {
    await this.page.locator(`(//img[@alt = '${nameTemplate}']//parent::figure//a)[1]`).locator("..").hover();
    await this.page.locator(`//img[@alt = '${nameTemplate}']//following-sibling::figcaption//button`).click();
  }

  /***
   * Generate new storefront
   */
  generateNameStorefront() {
    const currentTime = String(Math.floor(Date.now() / 1000));
    return `multi-storefront${currentTime}`;
  }

  /***
   * Create new storefront
   * @param name
   */
  async createNewStorefront(name: string) {
    await this.page.getByRole("button", { name: "Create new storefront", exact: true }).click();
    await this.page.waitForSelector(this.xpathPopup);
    await this.page.getByPlaceholder("Ex: WonderPlay").fill(name);
    await this.page.getByRole("button", { name: "Create", exact: true }).click();
  }

  /***
   * Action with sidebar
   * @param submenu
   */
  async actionWithSidebar(submenu: string) {
    await this.page.locator(`//div[normalize-space()='${submenu}']`).click();
  }

  /**
   * Verify the store enable multi storefront
   * @param sfList storefront list
   */
  async verifyExistMultiSF(sfList: Array<string>) {
    await this.page.click('//li[contains(@class,"online-store")]');
    await this.page.waitForSelector('(//div[contains(@class,"-title")])[last()]');
    if (await this.page.isVisible('//button[normalize-space()="Enable multiple storefronts"]')) {
      await this.page.click('//button[normalize-space()="Enable multiple storefronts"]');
      await this.page.click('//button[normalize-space()="Enable"]', { timeout: 60000 });
    }
    await this.page.waitForSelector('//div[@class="storefront-view storefront-view-list"]');
    for (const storefront of sfList) {
      if (
        await this.page.isHidden(
          `//div[@class="storefront-view storefront-view-list"]//a[normalize-space()="${storefront}"]`,
        )
      ) {
        const storefrontName = storefront.slice(0, storefront.indexOf("."));
        await this.createNewStorefront(storefrontName);
        await this.page.click('(//div[contains(@class,"library-templates")]//img)[1]');
        await this.page.waitForSelector('//iframe[@id="preview-template"]');
        await this.page.click('//div[@class="template-preview"]//button[normalize-space()="Apply"]');
        await this.page.click('//div[contains(@class,"popup__container")]//button[normalize-space()="Apply"]');
        await this.page.waitForSelector('//div/span[normalize-space()="Processing"]');
        await expect(this.page.locator('//div/span[normalize-space()="Processing"]')).toBeHidden({
          timeout: 120000,
        });
      }
    }
  }

  /***
   * Filter storefront in billing page
   * @param storefrontName
   */
  async filterStorefront(storefrontName: string) {
    await this.page.getByRole("button", { name: "More filters" }).click();
    await this.page.getByRole("button", { name: "Shop Domain" }).click();
    await this.page.locator(this.filterDomain).click();
    await this.page
      .locator("label")
      .filter({ hasText: `${storefrontName}` })
      .locator("span")
      .first()
      .click();
    await this.page.getByRole("button", { name: "Done" }).click();
  }

  /**
   * get Data Review in dashboard
   * @returns
   */
  async getDataShop() {
    const res = await this.authRequest.get(`https://${this.domain}/admin/shop.json`);
    const resText = await res.json();
    return resText;
  }

  /**
   * this tool used to change info storefront
   * @param storefrontInfo is an object include all params that can change for store
   * subscription expired at ex: 1704023518
   * package start time ex: 1704023518
   * end free trial at ex: 1704023518
   * online store_enable
   * status: "active" | "frozen" | "closed"
   * payment status: "free_trial" | "upgraded" | "paying"
   * previous payment_status: "free_trial" | "upgraded" | "paying"
   * @returns
   */
  async updateStorefrontInfo(
    storefrontInfo: StorefrontInfo,
    accessToken?: string,
    storefrontId?: string,
  ): Promise<void> {
    let response;
    const dataStorefront = await this.getDataShop();
    const storefrontUpdate: Array<StorefrontInfo> = [];
    if (storefrontInfo.subscription_expired_at) {
      dataStorefront.shop.subscription_expired_at = storefrontInfo.subscription_expired_at;
    }
    storefrontUpdate.push(dataStorefront);
    if (accessToken && storefrontId) {
      response = await this.authRequest.put(`https://${this.domain}/admin/shop.json`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
          "X-Storefront-Id": storefrontId,
        },
        data: storefrontUpdate[0],
      });
    } else {
      response = await this.authRequest.put(`https://${this.domain}/admin/shop.json`, {
        data: storefrontUpdate[0],
      });
    }
    if (!response.ok()) {
      return Promise.reject("Error -> status: " + response.status());
    }
  }

  /**
   * get storefront id
   * @returns
   */
  async getStorefrontId(stfName: string): Promise<number> {
    const xpathStorefrontId = `(//h3[normalize-space()= '${stfName}']//ancestor::*[contains(@class,'storefront-heading')]//following-sibling::p)[2]`;
    const storefrontIdText = await this.page.locator(xpathStorefrontId).textContent();
    const storefrontId = parseInt(storefrontIdText.match(/\d+/)[0]);
    return storefrontId;
  }

  /**
   * config date storefront to x days
   * @param days
   * @returns
   */
  async configDateToXDays(days: number): Promise<number> {
    const currentTimeUnix = Math.floor(new Date().getTime() / 1000);
    // Tính thời gian cho n ngày tiếp theo (n ngày * 24 giờ * 60 phút * 60 giây)
    const futureTimeUnix = currentTimeUnix + days * 24 * 60 * 60;
    return futureTimeUnix;
  }

  /**
   * calculate price to paid
   * @param priceStorefront: price a storefront a month
   * @param days: days using storefront to pay
   * @returns price
   */
  async calculatePriceToPaid(priceStorefront: string, days: number): Promise<number> {
    let price = 0;
    if (days <= 30) {
      price = (parseFloat(priceStorefront) * days) / 30;
    } else {
      price = parseFloat(priceStorefront);
    }
    const priceToPaid = parseFloat(price.toFixed(2));
    return priceToPaid;
  }
}
