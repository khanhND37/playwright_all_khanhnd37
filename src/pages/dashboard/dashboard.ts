import { Locator, Page } from "@playwright/test";
import type { AddFilter, EditCustomFilter, PageGetAccessToken, TippingInfo } from "@types";
import { SBPage } from "@pages/page";
import { getToken, getTokenWithCredentials } from "@utils/token";
import { OrdersPage } from "./orders";

export class DashboardPage extends SBPage {
  emailLoc: Locator;
  pwdLoc: Locator;
  signInLoc: Locator;
  xpathSaveChangedBtn = "//button[normalize-space()='Save changes']";
  xpathImageStylePreview = "//div[@class='row white-bg clearfix']//div[@class='col-xs-7']//img";
  xpathMessSaveWaterMarkSuccess = "//div[@class='s-toast is-success is-bottom']";

  xpathBtnArtwork = "(//label[normalize-space()='Upload artworks'])[1]";
  xpathTabAll = "//a[normalize-space()='All']";
  xpathTabPsd = "//a[normalize-space()='Personalizable (PSD)']";
  xpathTabStatic = "//a[normalize-space()='Static']";
  titleArtwork = "//p[normalize-space()='Artwork Library']";
  xpathPaginate = "//div[@class='s-pagination is-default is-default is-simple']";

  xpathProcessUploadArtwork = "(//div[@class='loading-block active'])[1]";
  xpathBlockError = "//div[@class='s-alert m-b is-red']";
  xpathBlockArtwork = "//div[contains(@class,'modal-content__container')]";
  xpathTabActive = "//li[@class='is-active']";
  xpathSidebar = "//ul[contains(@class,'nav nav-sidebar')]";
  private labelSaveBar = {
    saveChange: "Save changes",
    discard: "Discard",
  };
  xpathShopDomain = "//p[@class='text-truncate font-12']";
  xpathScriptPreferences = "//div[@class='ace_content']";
  xpathLoadForm = "//div[@class='s-loading-form']";
  upsellAnalytics = this.genLoc(".analytic-db-layout");
  xpathCardSection = "(//div[@class='card__section'])[1]";
  saveChangesBtn = this.page
    .getByRole("button", { name: "Save changes" })
    .or(this.page.locator(".save-setting-fixed").getByRole("button", { name: "Save" }));
  backBtn = this.genLoc(".s-breadcrumb").getByRole("link");
  xpathMessageRequireAction = "//article[contains(@class,'item-message')]";
  xpathPopupResponseMessage = "//div[contains(@class,'sb-popup__container')]";
  xpathTooltipResponseMessage = "//div[contains(@class,'information__resolve')]//span//span";
  xpathInputTextResponse = "//div[contains(@class,'sb-textarea sb-input--medium')]//textarea";
  xpathCloseResponsePopup = "//button[contains(@class,'sb-popup__header-close')]//span//span";
  filtersSection = this.genLoc(".navigation__collection-filter");
  collectionSearchFilter = this.genLoc("[class*=filter--item]");
  addCustomFilterBtn = this.genLoc(".filter--add-custom");
  addFilterBtn = this.page.getByRole("button", { name: "Add filter" });
  popup = this.genLoc(".s-modal-content");
  filterOptions = this.genLoc(".filter__block");
  filterShowMoreBtn = this.popup.filter({ hasText: "Add filter" }).getByRole("button", { name: "Show more" });
  filterShowLessBtn = this.popup.filter({ hasText: "Add filter" }).getByRole("button", { name: "Show less" });
  filterCheckboxes = this.filterOptions.locator(".s-checkbox");
  productOptionsCheckboxes = this.filterOptions.filter({ hasText: " Product options" }).locator(".s-checkbox");
  xpathLogoShop = "(//div[contains(@class,'shopbase-logo')])[1]//img";
  xpathInAppNoti = ".in-app-notification";
  xpathTitleMessage = "//div[@class='header__subject']";
  xpathContentMessage = "//div[contains(@class,'message-content')]//div[@class='content']";
  xpathCloseMessageModal = "(//button[contains(@class,'sb-popup__header-close')]//span)[1]";
  xpathProductResult = "#products-results";
  xpathThemePublic = "div.page-designs__current";
  xpathListPage = "table tbody";
  xpathMenuV2 = ".navigation--block tbody";
  xpathLoadPages = ".sb-skeleton__table";
  xpathProductPlus = "#all-products tbody";
  xpathLoadingProduct = ".s-detail-loading";
  xpathPages = ".page-description a";
  xpathMenus = "//tbody//tr";
  xpathPagesV3 = ".row-page-list a";
  xpathRowPageList = "//*[contains(@class, 'row-page-list')]";
  xpathCloseOnboardingPopover = `//div[contains(@class, 'onboarding-popup active')]//i`;
  xpathPreviewPushTemplate = `//div[contains(@class, 'page-designs__preview')]//parent::div[@class="sb-relative"]`;

  xpathDashboard = {
    loading: "//div[@class='sb-skeleton'] | //div[@class='sb-skeleton__table'] | //div[@class='s-detail-loading']",
  };
  liveChat = this.genLoc("[class=crisp-client]");

  xpathOptionTipping(optionTipping: string): string {
    return `//input[@placeholder='${optionTipping}' and @class='s-input__inner']`;
  }

  // Online Storefronts
  xpathStorefrontDomain(domain: string): string {
    return `//a[normalize-space()='${domain}']`;
  }

  getUpsellAnalytics(
    type:
      | "Total sales"
      | "Online store conversion rate"
      | "Total orders"
      | "Average order value"
      | "Average order items"
      | "Abandoned checkouts recovery"
      | "First-time vs Returning customers"
      | "Returning customer rate",
  ): Locator {
    return this.upsellAnalytics.filter({ hasText: type });
  }

  constructor(page: Page, domain: string) {
    super(page, domain);
    this.emailLoc = this.page.locator('[placeholder="example\\@email\\.com"]');
    this.pwdLoc = this.page.locator('[placeholder="Password"]');
    this.signInLoc = this.page.locator('button:has-text("Sign in")');
  }

  async login({
    userId = 0,
    shopId = 0,
    email = "",
    password = "",
  }: {
    userId?: number;
    shopId?: number;
    email?: string;
    password?: string;
  }) {
    // try to get token first
    // Note that we need to strict this function to avoid it can get all
    let tryLogin = false;
    if (userId > 0 && shopId > 0) {
      try {
        const token = await getToken(userId, shopId);
        if (token.length == 0) {
          tryLogin = true;
        } else {
          await this.loginWithToken(token);
        }
      } catch (e) {
        tryLogin = true;
      }
    } else {
      tryLogin = true;
    }
    if (tryLogin) {
      await this.page.goto(`https://${this.domain}/admin`);
      await this.page.waitForSelector('[placeholder="example\\@email\\.com"]', { timeout: 30000 });
      await this.emailLoc.fill(email);
      await this.pwdLoc.fill(password);
      await this.signInLoc.click();
    }
  }

  async loginWithToken(token: string) {
    if (token.length == 0) {
      return false;
    }

    await this.page.route("**/admin/**", (route, request) => {
      const headers = request.headers();
      if (headers["x-shopbase-access-token"] && headers["x-shopbase-access-token"] === "default_token") {
        Object.assign(headers, { "x-shopbase-access-token": `${token}` });
      }

      route.continue({
        headers: headers,
      });
    });
    await this.page.goto(`https://${this.domain}/admin?x_key=${token}`, { waitUntil: "networkidle" });
    await this.page.waitForSelector(".nav-sidebar");
    return true;
  }

  async getAccessToken({ shopId, userId, baseURL, username, password }: PageGetAccessToken): Promise<string> {
    let token;
    try {
      token = await getToken(userId, shopId);
    } catch (e) {
      const { access_token } = await getTokenWithCredentials(baseURL, {
        domain: this.domain,
        username,
        password,
        userId,
      });
      // eslint-disable-next-line camelcase
      token = access_token;
    }

    return token;
  }

  /**
   * Navigate to menu in dashboard
   * @param menu:  menu name
   * */
  async navigateToMenu(menu: string, index = 1): Promise<void> {
    await this.waitUtilNotificationIconAppear();
    const menuXpath = `(${this.getXpathMenu(menu)})[${index}]`;
    await this.page.locator(menuXpath).click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
  }

  /**
   * Navigate to sub menu in dashboard
   * @param menu:  menu name
   * @param subMenu: sub menu name
   * */
  async navigateToSubMenu(menu: string, subMenu: string): Promise<void> {
    const mainMenu = this.page.locator(
      `(//ul[contains(@class,'menu') or contains(@class,'active treeview-menu') or contains(@class,'nav-sidebar')]` +
        `//li` +
        `//*[text()[normalize-space()='${menu}']]` +
        `//ancestor::a` +
        `|(//span[following-sibling::*[normalize-space()='${menu}']]//ancestor::a))[1]`,
    );
    await mainMenu.click();
    await mainMenu.locator("//following-sibling::ul[@class='menu_level_1']").waitFor();
    await this.page
      .locator(
        `//span[text()[normalize-space()='${menu}']]//ancestor::a` +
          `//following-sibling::ul//span[text()[normalize-space()='${subMenu}']]`,
      )
      .click();
  }

  /**
   * Verify is submenu displayed
   * @param subMenu name of subMenu that you want to check is displaying or not
   * @returns
   */
  async isSubMenuActived(subMenu: string): Promise<boolean> {
    return await this.page
      .locator(`//span[normalize-space()='${subMenu}']//ancestor::a[contains(@class, 'router-link-active')]`)
      .isVisible();
  }

  async waitDashboardActive() {
    await this.page.waitForSelector(".unite-ui-frame.vertical-screen");
  }

  /*
   * Click to open sections in setting page.
   * It will choose a locator corresponding to the section name and then click to it.
   * @param section
   */
  async navigateToSectionInSettingPage(section: string): Promise<boolean> {
    await this.page.locator(`//*[@class='settings-nav__title' and normalize-space()='${section}']`).click();
    // Waiting for redirect page successfully
    const isSuccess = await this.isDBPageDisplay(section);
    return isSuccess;
  }

  /*
   * Deactive payment gateway
   * @param paymentGateway: name of  payment gateway
   */
  async deactivePaymentGateway(paymentGateway: string) {
    await this.page.locator(`//div[@role = 'button']//strong[contains(., '${paymentGateway}')]`).click();
    await this.page
      .locator(
        `(//h2[contains(text(), '${paymentGateway}')]/following::div[@class='payment-method-info']` +
          `//button//span[normalize-space()='Deactivate'])[1]`,
      )
      .click();
    await this.page.waitForSelector(`//div[@role = 'button']//strong[contains(., '${paymentGateway}')]`);
  }

  /*
   * Reactive payment gateway
   * @param paymentGateway: name of  payment gateway
   */
  async reactivePaymentGateway(paymentGateway: string) {
    const xpathActivate = this.page.locator(
      `(//*[contains(text(), '${paymentGateway}')]//ancestor::div[contains(@class,'s-collapse-item')]` +
        `//*[contains(text(),'Activate')])`,
    );
    await this.page.locator(`//div[@role = 'button']//strong[contains(., '${paymentGateway}')]`).click();
    if (await xpathActivate.isVisible()) {
      await xpathActivate.click();
      await this.page.waitForSelector(`//div[@role = 'button']//strong[contains(., '${paymentGateway}')]`);
    }
  }

  async getStaffName() {
    return await this.getTextContent("//p[@class='user-email text-truncate']");
  }

  /**
   * Select capture method in payment providers
   * @param captureMethod include "Automation" | "Manual"
   */
  async selectPaymentCapture(captureMethod: "Automation" | "Manual"): Promise<void> {
    if (captureMethod === "Automation") {
      await this.clickRadioButtonWithLabel("Automatically capture payment for orders.");
    } else {
      await this.clickRadioButtonWithLabel("Manually capture payment for orders.");
    }
  }

  /**
   * I will go to fulfillment of Plus Hub
   */
  async goToPlusHubFulfillment(opts?: { dirrect?: boolean }) {
    if (opts?.dirrect) {
      await this.goto(`/admin/fulfillment/dropship/list`);
      return;
    }
    await this.page.click(`//span[text()[normalize-space()="Fulfillment"]]`);
    await this.page.click(`//span[text()[normalize-space()="PlusHub"]]`);
    await this.page.click(`//a[text()[normalize-space()="Fulfillment"]]`);
  }

  /**
   * Go to ops order details after logged in to the dashboard
   * @param orderId, shopDomain
   */
  async goToOpsOrderDetails(orderId: number, shopDomain: string, accessToken?: string) {
    let url = `https://${shopDomain}/admin/ops/orders/${orderId}`;
    if (accessToken) {
      url = `https://${shopDomain}/admin/ops/orders/${orderId}?x_key=${accessToken}`;
    }
    await this.page.goto(url);
    await this.page.waitForSelector(`//a[normalize-space()='Orders']`);
    return new OrdersPage(this.page, this.domain);
  }

  /**
   * Go to order details after logged in to the dashboard
   * @param orderId, shopDomain
   */
  async goToOrderDetails(orderId: number, shopType: "shopbase" | "plusbase" | "printbase") {
    let linkOrderDetails: string;
    switch (shopType) {
      case "printbase":
        linkOrderDetails = `https://${this.domain}/admin/pod/orders/${orderId}`;
        break;
      default:
        linkOrderDetails = `https://${this.domain}/admin/orders/${orderId}`;
        break;
    }
    await this.page.goto(linkOrderDetails);
    await this.page.waitForSelector(`(//div[@class='card__section'])[1]`);
    return new OrdersPage(this.page, this.domain);
  }

  /**
   * Open Balance screen on dashboard
   */
  async openBalancePage() {
    await this.page.click("//div[contains(@class,'user-info') and @shop='[object Object]']");
    await this.page.click(
      "//div[contains(@class, 'menu') and not(contains(@class, 'user-menu-dropdown'))]//a//div[contains(text(),'Balance')]",
    );
    await this.page.waitForLoadState("load");
  }

  //Verify Save Bar is displayed
  async isSaveBarVisible(): Promise<boolean> {
    await this.page.waitForSelector("//div[@class='save-setting-fixed']");
    return true;
  }

  /**
   * wait notification icon visiable
   */
  async waitUtilNotificationIconAppear(timeout = 90000) {
    await this.page.waitForSelector(".icon-in-app-notification:visible", { timeout: timeout });
  }

  /**
   * Wait util loading action completed
   * class sb-skeleton: use in ShopBase Creator page
   * class s-detail-loading: use in ShopBase page
   */
  async waitUtilSkeletonDisappear() {
    const isLoadingVisible = await this.genLoc(this.xpathDashboard.loading).isVisible();
    if (isLoadingVisible) {
      await this.waitUntilElementInvisible(this.xpathDashboard.loading);
    }
  }

  /**
   * Wait util loading action start and completed
   */
  async waitSkeletonAppearAndDisappear() {
    await this.waitUntilElementVisible(
      "//div[@class='sb-skeleton'] | //div[@class='sb-skeleton__table'] | //div[@class='s-detail-loading']",
    );

    await this.waitUtilSkeletonDisappear();
  }

  async clickButtonOnSaveBar(type: "save" | "discard") {
    let buttonText = this.labelSaveBar.saveChange;
    if (type === "discard") {
      buttonText = this.labelSaveBar.discard;
    }

    await this.page.click(`//div[@class='save-setting-fixed']//button[normalize-space()='${buttonText}']`);
  }

  xpathHeaderName = "//h2[normalize-space()='Campaigns']";

  async logoutAccount() {
    await this.page.click("//p[@class='text-truncate font-12']");
    await this.page.click(
      "//div[@class = 's-dropdown-menu drop-down-user-style']//a[@href='/admin/logout']|//div[@class = 'popover__nested-info-content user-menu-redirect']//a[@href='/admin/logout']",
    );
  }

  /**
   * Download file CSV from the page then return the path of the file
   * @param xpath
   */
  async downloadFile(xpath: string): Promise<string> {
    await this.page.waitForSelector(xpath);
    await this.genLoc(xpath).click();
    const download = await this.page.waitForEvent("download");
    return download.path();
  }

  async uploadFile(typeFile: string, xpathFile: string | Array<string>, index = 1) {
    await this.page.setInputFiles(`(//input[@type="${typeFile}"])[${index}]`, xpathFile);
  }

  getLocatorItemMenuUserInfo(menuItem: string): string {
    return `//div[contains(@class, 'menu') and not(contains(@class, 'user-menu-dropdown'))]//a//div[contains(normalize-space(),'${menuItem}')]`;
  }

  getXpathMenu(menuName: string): string {
    const xpath =
      `//ul[contains(@class,'menu') or contains(@class,'active treeview-menu') or contains(@class,'nav-sidebar')]` +
      `//li` +
      `//*[text()[normalize-space()='${menuName}']]` +
      `//ancestor::a` +
      `|(//span[following-sibling::*[normalize-space()='${menuName}']]//ancestor::a)`;
    return xpath;
  }

  /**
   * Setting Tipping
   */
  async inputTippingOption(tippingInfo: TippingInfo) {
    await this.page.locator(this.xpathOptionTipping(tippingInfo.option)).fill(tippingInfo.tipping_amount.toString());
    await this.page.waitForTimeout(1000);
  }

  /**
   * Search message in tab
   * @param messageTitle Title of the message
   * @param tab tab to search
   */
  async searchMessage(messageTitle: string, tab: string) {
    await this.page.locator(`//div[contains(text(),'${tab}')]`).click();
    await this.page.locator("//input[@placeholder='Search']").fill(messageTitle);
    await this.page.waitForLoadState("networkidle");
    await this.waitForElementVisibleThenInvisible(this.xpathIconLoading);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Check enable Mutilple Storefronts in Online Store
   */
  async enableMultipleStorefronts() {
    const isMultipleSFs = this.page.locator(
      `//button[contains(@class,'action')]/span[contains(text(),'Enable multiple storefronts')]`,
    );
    if (await isMultipleSFs.isVisible()) {
      await isMultipleSFs.click();
      await this.page
        .locator(`//div[contains(@class, 'popup__footer')]/button/span[contains(text(), 'Enable')]`)
        .click();
    }
  }

  /**
   * Add new filter in Onlinestore > Navigation (v2)/Filter(v3)
   * @param data
   */
  async manageFilters(data: AddFilter): Promise<void> {
    if (await this.popup.filter({ hasText: "Add filter" }).isHidden()) {
      await this.addFilterBtn.click();
    }
    for (const filter of data.filters) {
      await this.filterOptions.locator(".s-checkbox").filter({ hasText: filter }).setChecked(data.checked);
    }
    if (data.custom) {
      const popupCustom = this.popup.filter({ has: this.page.getByRole("heading", { name: "Create custom filter" }) });
      const existingTags = popupCustom
        .locator(".tag-list")
        .filter({ hasText: "Select existing tags to be added:" })
        .locator(".tag-list-items")
        .locator(".tag-list-item");
      const selectedTags = popupCustom
        .locator(".tag-list")
        .filter({ hasText: "Filter options" })
        .locator(".tag-list-items")
        .locator(".tag-list-item");
      await this.addCustomFilterBtn.click();
      await popupCustom.waitFor();
      await popupCustom.getByRole("textbox").fill(data.custom.name);
      for (const tag of data.custom.tags) {
        await existingTags.filter({ hasText: tag }).click();
        await selectedTags.filter({ hasText: tag }).waitFor();
      }
      await popupCustom.getByRole("button", { name: "Create" }).click();
    }
    await this.popup.filter({ hasText: "Add filter" }).getByRole("button", { name: "Save" }).click();
    await this.toastWithMessage("Successfully saved filter").waitFor();
    await this.toastWithMessage("Successfully saved filter").waitFor({ state: "hidden" });
  }

  /**
   * Edit custom filter by tag
   * @param data
   */
  async editCustomFilters(data: EditCustomFilter): Promise<void> {
    let popupEditCustom = this.popup.filter({ has: this.page.getByRole("heading", { name: `Edit ${data.name}` }) });
    const customFilters = this.filterOptions.filter({ hasText: "Custom" }).locator(">div:not([class$=heading])");
    const editBtn = customFilters.filter({ hasText: data.name }).locator("i.mdi-pencil");
    if (await this.popup.filter({ hasText: "Add filter" }).isHidden()) {
      await this.addFilterBtn.click();
    }
    await editBtn.click();
    if (data.edit.name) {
      await popupEditCustom.getByRole("textbox").fill(data.edit.name);
      popupEditCustom = this.popup.filter({ has: this.page.getByRole("heading", { name: `Edit ${data.edit.name}` }) });
    }
    if (data.edit.tags) {
      const existingTags = popupEditCustom
        .locator(".tag-list")
        .filter({ hasText: "Select existing tags to be added:" })
        .locator(".tag-list-items")
        .locator(".tag-list-item");
      const selectedTags = popupEditCustom
        .locator(".tag-list")
        .filter({ hasText: "Filter options" })
        .locator(".tag-list-items")
        .locator(".tag-list-item");
      for (const tag of data.edit.tags) {
        const selectedTag = await selectedTags.filter({ hasText: tag }).isVisible();
        if (!selectedTag) {
          await existingTags.filter({ hasText: tag }).click();
        }
      }
      const allSelectedTags = [];
      for (const selectedTag of await selectedTags.all()) {
        const tagText = await selectedTag.innerText();
        allSelectedTags.push(tagText);
      }
      for (const tag of allSelectedTags) {
        if (!data.edit.tags.includes(tag)) {
          await selectedTags.filter({ hasText: tag }).getByRole("button").click();
        }
      }
    }
    await popupEditCustom.getByRole("button", { name: "Save" }).click();
    await this.popup.filter({ hasText: "Add filter" }).getByRole("button", { name: "Save" }).click();
    await this.toastWithMessage("Successfully saved filter").waitFor();
    await this.toastWithMessage("Successfully saved filter").waitFor({ state: "hidden" });
  }

  /**
   * Remove filters in Navigation submenu
   * (Online store> Navigation theme v2)
   * (Online store> Filter theme v3)
   * @param filter
   */
  async removeFilter(filter: string): Promise<void> {
    await this.collectionSearchFilter.filter({ hasText: filter }).getByRole("button").click();
    await this.toastWithMessage("Successfully saved filter").waitFor();
    await this.toastWithMessage("Successfully saved filter").waitFor({ state: "hidden" });
  }

  /**
   * Get all filters in an array of string
   * @returns
   */
  async getAllFilters(): Promise<string[]> {
    const filters = [];
    const allFilters = await this.collectionSearchFilter.all();
    for (const filter of allFilters) {
      const filterText = await filter.innerText();
      filters.push(filterText);
    }
    return filters;
  }

  /**
   * wait until bulk update finished
   */
  async waitBulkUpdateFinish() {
    while (await this.page.locator("//tbody/tr[1]//img[@class='sbase-spinner']").isVisible({ timeout: 10000 })) {
      await this.page.reload();
      await this.page.waitForTimeout(20 * 1000);
    }
  }

  /**
   * select country/currency primary market
   * @param country
   * @param currency
   */
  async goToSettingGlobalMarkets() {
    await this.goto(`admin/settings/shopbase-global`);
    await this.page.waitForLoadState("networkidle");
  }
}
