import { removeExtraSpace } from "@core/utils/string";
import { SBPage } from "@pages/page";
import { Locator, Page } from "@playwright/test";
import type { SettingFeed } from "@types";
import appRoot from "app-root-path";

/**
 * @deprecated: This file is too big.
 * Please create your own POM in src/pages/hive/shopbase.
 * Your POM should extend from HivePage (src/pages/hive/core.ts)
 * Example: src/pages/hive/shopbase/social_proof.ts
 */
export class HiveSBaseOld extends SBPage {
  account: Locator;
  password: Locator;
  login: Locator;

  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
    this.account = this.genLoc("[placeholder='Username']");
    this.password = this.genLoc("[placeholder='Password']");
    this.login = this.page.locator("text=Log in");
  }

  /**
   * It returns the text content of the anchor tag that is a sibling of the table cell that contains the
   * order name.
   * @param {string} orderName - The name of the order you want to check the fraud status of.
   * @returns The text content of the link.
   */
  async getFraudStatus(orderName: string) {
    return await this.getTextContent(
      `//td[normalize-space()='${orderName}']/following-sibling::td//a[contains(@data-target,'fraud-analysis')]`,
    );
  }

  /**
   * It clicks on the link that opens the popup, then clicks on the link that opens the fraud filter
   * popup.
   * @param {string} orderName - The name of the order you want to open the fraud filter popup for.
   */
  async openFraudFilterPopupOfOrder(orderName: string) {
    await this.page.click(
      `//td[normalize-space()='${orderName}']/following-sibling::td//a[contains(@data-target,'fraud-analysis')]`,
    );
    await this.page.click(
      `//td[normalize-space()='${orderName}']/following-sibling::td//li[normalize-space()='Fraud filter']`,
    );
  }

  /**
   * "Get the text content of the div that contains the text 'Fraud Filter matched rule with name:' and
   * is a sibling of the div that contains the text 'Fraud Filter matched rule with name:'"</code>
   * @param {number} orderId - number - the order ID
   * @returns The text content of the element.
   */
  async getFraudRuleMatched(orderId: number): Promise<string> {
    const fraudRule = await this.getTextContent(
      `//div[contains(@id,'fraud-filter-${orderId}')]//div[normalize-space()='Fraud Filter matched rule with name:']/following-sibling::div`,
    );
    return removeExtraSpace(fraudRule);
  }

  /**
   * It logs into the admin panel of the shop.
   * @param  - { account?: string; password?: string }
   */
  async loginToHiveShopBase({ account = "", password = "" }: { account?: string; password?: string }) {
    await this.goto("/admin/login");
    await this.account.fill(account);
    await this.password.fill(password);
    await this.login.click();
  }

  /**
   * open shop detail page
   * @param shopId
   */
  async goToShopDetail(shopId: string) {
    await this.goto(`/admin/app/shop/${shopId}/edit`);
    await this.page.waitForLoadState("load");
  }

  /**
   * open user detail page
   * @param userId
   */
  async goToUserDetail(userId: string) {
    await this.goto(`/admin/app/shopuser/${userId}/edit`);
    await this.page.waitForLoadState("load");
  }

  /**
   * open review order spay page
   */
  async goToReviewOrder() {
    await this.goto(`/admin/app/checkoutdbentity-order/list`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Filter order spay in review order page
   * @param shopId
   * @param orderName
   */
  async filterSpayOrder(shopId: number, orderName: string) {
    //Filter order name with condition : Shop id & order name
    //Fill shop id
    await this.page.locator(`//input[@id='filter_shopId_value']`).fill(shopId.toString());
    //Choose more filter
    await this.page.click(`//a[contains(normalize-space(),'Filters')]`);
    await this.page.click(`//a[contains(normalize-space(),'Order Name')]/i`);
    //Fill order name
    await this.page.locator(`//div[label[normalize-space()='Order Name']]/div/input[@type='text']`).fill(orderName);
    //Click to filter again to close select filter option
    await this.page.click(`//a[contains(normalize-space(),'Filters')]`);
    //Clicl button filter
    await this.page.click(`//button[normalize-space()='Filter']`);
  }

  /**
   * Go to Balance invoice list
   */
  async goToBalanceInvoiceList() {
    await this.page.locator("span:has-text('Balance')").click();
    await this.page.locator("a:has-text('Balance Invoice')").click();
  }

  /**
   * go to Redeem resquest page
   */
  async gotoRedeemRequestPage() {
    await this.page.locator("//a[normalize-space()='Affiliate & Cashback']").click();
    await this.page.locator("//a[normalize-space()='Redeem Request']").click();
  }

  /**
   * Click dropdown Actions
   * Click button Reset quota refresh feed file on View shop detail page
   * Click button submit reset quota refresh feed file
   */
  async resetQuotaRefreshFeed() {
    await this.page.click("//li[@class='dropdown sonata-actions']//a[contains(text(),'Actions')]");
    await this.page.click("//li//a[contains(text(),'Reset quota refresh feed file')]");
    await this.page.click("//form[@id='form-reset-quota']//button[@id='resetBtn']");
    await this.genLoc("text=Yes, Reset for this shop").click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Go to Generate Yun Tracking Tool
   */
  async goToGenYunTrackingTool() {
    await this.page.waitForSelector("ul.sidebar-menu");
    await this.page.click("span:has-text('PlusHub')");
    await this.page.waitForSelector(".treeview-menu.menu-open");
    await this.page.locator("aside >> text=Generate Yun Tracking").click();
  }

  /**
   * Generate feed file on View shop detail page
   * @param feedID
   */
  async generateFeed(feedID: string, isFeedGMC: boolean) {
    await this.page.click("//li[@class='dropdown sonata-actions']//a[contains(text(),'Actions')]");
    await this.page.click("//li//a[contains(text(),'Generate feed')]");
    await this.page.fill("//input[@id='form_feedId']", feedID);
    if (isFeedGMC) {
      await this.page.click("//div[@class='checkbox' and descendant::*[text()[normalize-space()='Gmc']]]//div");
    }
    await this.page.click("//button[@class='btn btn-success']");
    await this.page.waitForLoadState("load");
  }

  /**
   * Change Coming soon checkbox status
   */
  async changeStatusPackageComingSoon() {
    const comingSoon = await this.page.getAttribute(
      "//span[normalize-space()='Is Coming Soon']//preceding-sibling::div",
      "class",
    );
    switch (comingSoon) {
      case "icheckbox_square-blue": {
        await this.page.click("//span[normalize-space()='Is Coming Soon']//preceding-sibling::div");
        break;
      }
      case "icheckbox_square-blue checked": {
        await this.page.click("//span[normalize-space()='Is Coming Soon']//preceding-sibling::div");
        break;
      }
    }
    await this.page.click("//button[normalize-space()='Update']");
    await this.page.waitForSelector("//div[contains(@class,'alert alert-success')]");
  }

  /**
   * Go to Sales channels > Product feeds in hive
   */
  async goToProductFeedsHive() {
    await this.page.locator("//aside[@class='main-sidebar']//span[normalize-space()='Sales Channel']").click();
    await this.page.locator("//aside[@class='main-sidebar']//a[normalize-space()='Product Feeds']").click();
  }

  /**
   * Open a setting feed in Product feeds in hive
   * @param settingFeed: is the input variable of name setting feed
   */
  async openSettingFeed(settingFeed: string) {
    await this.page.locator(`//tbody//a[normalize-space()='${settingFeed}']`).click();
  }

  /**
   * Function check logic of checkbox Enable, Approve and sandbox user id in setting feed in hive
   * @param enabledStatus: is status of checkbox enable (check, or un-check)
   * @param approvedStatus: is status of checkbox approve (check, or un-check)
   * @param shopId: id of this shop
   */
  async setupEnableSettingFeed(enabledStatus, shopId, approvedStatus) {
    await this.page.waitForLoadState("load");
    const xpathEnableCheckboxStatus = await this.page
      .locator("//span[normalize-space()='Enable']//preceding-sibling::div")
      .getAttribute("class");
    const xpathApproveCheckboxStatus = await this.page
      .locator("//span[normalize-space()='Approve']//preceding-sibling::div")
      .getAttribute("class");

    // Case checkbox Enable = false
    if (enabledStatus === "") {
      // Validate if checkbox Enable's status = true
      if (xpathEnableCheckboxStatus.includes("checked")) {
        // click -> isChecked = false
        await this.page.locator("//span[normalize-space()='Enable']//preceding-sibling::div").click();
      }
      // Case checkbox enable = true
    } else {
      // Validate if checkbox Enable's status = false
      if (!xpathEnableCheckboxStatus.includes("checked")) {
        // click -> isChecked = true
        await this.page.locator("//span[normalize-space()='Enable']//preceding-sibling::div").click();
      }
    }

    if (shopId !== "") {
      await this.page.locator("//input[@placeholder='Enter UserID']").fill(shopId);
    }

    // Case checkbox Approve = false
    if (approvedStatus === "") {
      // Validate if checkbox Approve's status = true
      if (xpathApproveCheckboxStatus.includes("checked")) {
        // click -> isChecked = false
        await this.page.locator("//span[normalize-space()='Approve']//preceding-sibling::div").click();
      }
      // Case checkbox Approve = true
    } else {
      // Validate if checkbox Approve's status = false
      if (!xpathApproveCheckboxStatus.includes("checked")) {
        // click -> isChecked = true
        await this.page.locator("//span[normalize-space()='Approve']//preceding-sibling::div").click();
      }
    }
  }

  /**
   * Save setting feed in hive
   */
  async saveSettingFeed() {
    await this.page.locator("//button[normalize-space()='Update']").click();
  }

  /**
   * This function will fill data into textbox, choose option dropdown list and check on checkbox in setting feed hive
   * @param properties: is define and load data from config
   */
  async fulfillDataOnSettingFeed(properties: SettingFeed) {
    await this.page.locator("//input[@placeholder='Enter name']").fill(properties.name);
    await this.page.locator("//input[@placeholder='Enter code']").fill(properties.code);
    await this.page.locator("//span[@id='select2-chosen-1']").click();
    await this.page
      .locator(`//span[@class="select2-match"]//parent::div[normalize-space()="${properties.dashboard_ui}"]`)
      .click();
    await this.page.setInputFiles("//input[@id='upload_sf796705dd3_icon']", appRoot + `/data/hive/${properties.icon}`);
    await this.page
      .frameLocator("//iframe[contains(@title,'short_description')]")
      .locator("//title[contains(@data-cke-title,'short_description')]//parent::head//following-sibling::body")
      .click({ clickCount: 3 });
    await this.page.keyboard.press("Backspace");
    await this.page
      .frameLocator("//iframe[contains(@title,'short_description')]")
      .locator("//title[contains(@data-cke-title,'short_description')]//parent::head//following-sibling::body")
      .fill(properties.short_description);
    await this.page.locator("//label[normalize-space()='Feed limitation']").scrollIntoViewIfNeeded();
    await this.page
      .frameLocator("//iframe[contains(@title,'dd3_description')]")
      .locator("//title[contains(@data-cke-title,'dd3_description')]//parent::head//following-sibling::body")
      .click({ clickCount: 3 });
    await this.page.keyboard.press("Backspace");
    await this.page
      .frameLocator("//iframe[contains(@title,'dd3_description')]")
      .locator("//title[contains(@data-cke-title,'dd3_description')]//parent::head//following-sibling::body")
      .fill(properties.description);
    await this.page.locator("//input[@id='sf796705dd3_settings_number_feed']").fill(properties.feed_limitation);
    await this.page.locator("//input[@id='sf796705dd3_priority']").fill(properties.priority);
    await this.setupEnableSettingFeed("", "", properties.approve_checkbox);
    await this.page.locator("//div[@id='s2id_sf796705dd3_sync_method']").click();
    await this.page
      .locator(`//span[@class='select2-match']//parent::div[normalize-space()="${properties.sync_method}"]`)
      .click();
    await this.page.locator("//div[@id='s2id_sf796705dd3_schedule_time']").click();
    await this.page
      .locator(`//span[@class='select2-match']//parent::div[normalize-space()="${properties.schedule_time}"]`)
      .click();
  }

  /**
   * This function will fill data into textbox, choose option dropdown list and check on checkbox in setting feed hive
   * @param properties: is define and load data from config
   */
  async updateSettingFeedLimitation(properties: SettingFeed) {
    await this.page
      .locator("//input[@id='sf796705dd3_sync_method_settings_number_variant']")
      .fill(properties.variant_limitation);
    await this.page.locator("//div[@id='s2id_sf796705dd3_sync_method_settings_action_limit_number_variant']").click();
    await this.page
      .locator(
        `//span[@class='select2-match']` +
          `//parent::div[normalize-space()="${properties.when_exceeding_variant_limitation}"]`,
      )
      .click();
    await this.page
      .locator("//input[@id='sf796705dd3_sync_method_settings_file_size']")
      .fill(properties.file_limitation);
    await this.page.locator("//div[@id='s2id_sf796705dd3_sync_method_settings_action_limit_file_size']").click();
    await this.page
      .locator(
        `//span[@class='select2-match']//parent::div[normalize-space()="${properties.when_exceeding_file_limit}"]`,
      )
      .click();
    await this.page.locator("//div[@id='s2id_sf796705dd3_sync_method_settings_file_type']").click();
    await this.page
      .locator(`//span[@class='select2-match']//parent::div[normalize-space()="${properties.file_type}"]`)
      .click();
  }

  /**
   * I will go to feature switch list page
   */
  async goToFeatureSwitchList() {
    await this.goto("/admin/app/featureswitch/list");
  }

  /**
   * I will go to sale channel list page
   */
  async goToSalesChannelList() {
    await this.goto("/admin/app/saleschannel/list");
  }

  /**
   * Go to Market list
   */
  async goToMarketList() {
    await this.page.click("span:has-text('Content')");
    await this.page.click("(//a[normalize-space()='Market Settings'])[last()]");
    await this.page.waitForLoadState("load");
  }

  /**
   * Go to Create market page
   */
  async goToCreateMarket() {
    await this.page.click("a:has-text('Add new')");
    await this.page.waitForLoadState("load");
  }

  /**
   * I will go to charge refund fee of shop
   * @param shopId enter id of shop
   */
  async goToChargeRefundFee(shopId: string) {
    await this.goto(`/admin/app/shop/${shopId}/charge-refund-fee`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Filter user ở màn User affiliate cashback list
   * @param label là option filter
   * @param value là giá trị khi filter
   */
  async filterUserAffiliateCashback(label: string, value: string) {
    const filter = "//a[@class='dropdown-toggle sonata-ba-action']";
    const optionFilter = `//li[child::a[normalize-space()='${label}']]`;
    const btnFilter = "(//button[@placeholder='Filter' or normalize-space()='Filter'])[1]";
    const xpathValue = `//div[contains(@class,'form-group')][child::label[normalize-space()='${label}']]//div[@class='col-sm-4']`;

    await this.genLoc(filter).click();
    await this.genLoc(optionFilter).click();
    await this.genLoc(filter).click();
    await this.genLoc(`${xpathValue}/input`).fill(value);
    await this.genLoc(btnFilter).click();
    await this.page.waitForLoadState();
  }

  /**
   * Thêm user vào 1 affiliate group
   * @param email là email của user
   * @param affiliateType là loại affiliate: shopbase, printbase, plusbase
   * @param affiliateGroupName tên group affiliate
   */
  async addAffiliatGroup(email: string, affiliateType: string, affiliateGroupName: string) {
    await this.genLoc(`//a[normalize-space()='${email}']`).click();
    switch (affiliateType) {
      case "ShopBase Affiliate Group":
        await this.genLoc("#select2-chosen-2").click();
        break;
      case "PrintBase Affiliate Group":
        await this.genLoc("#select2-chosen-3").click();
        break;
      case "PlusBase Affiliate Group":
        await this.genLoc("#select2-chosen-4").click();
        break;
    }
    await this.genLoc(`//div[@class='select2-result-label' and normalize-space()="${affiliateGroupName}"]`).click();
    await this.genLoc("//button[normalize-space()='Update']").click();
  }

  /**
   * Xóa promoter khỏi group affiliate
   * @param affiliateType là loại affiliate: shopbase, printbase, plusbase
   */
  async clearAffiliateGroup(affiliateType: string) {
    switch (affiliateType) {
      case "ShopBase Affiliate Group":
        await this.page.hover("#select2-chosen-2");
        await this.page.dblclick("#select2-chosen-2");
        break;
      case "PrintBase Affiliate Group":
        await this.page.hover("#select2-chosen-3");
        await this.page.dblclick("#select2-chosen-3");
        break;
      case "PlusBase Affiliate Group":
        await this.page.hover("#select2-chosen-4");
        await this.page.dblclick("#select2-chosen-4");
        break;
    }
    await this.page.keyboard.press("Backspace");
    await this.genLoc("//button[normalize-space()='Update']").click();
  }

  /**
   * Clear data shop để tạo lại shop từ luồng survey
   * @param shopID: shop id của shop cần clear
   */
  async clearShopDataInHive(shopID: string) {
    await this.goto(`admin/tool/storefront-clear-shop-data`);
    await this.genLoc("//input[@class='form-control']").click();
    await this.page.keyboard.press("Backspace");
    await this.genLoc("//input[@class='form-control']").fill(shopID);
    await this.genLoc("//button[normalize-space()='Clear']").click();
  }

  /**
   * Go to user affiliate cashback list page
   */
  async goToUserAffiliateCashbackList() {
    await this.goto(`/admin/app/useraffiliatecashback/list`);
  }

  /**
   * Filter  shop at screen Shop list
   * @param label  option filter
   * @param value value filter
   */
  async filterShop(label: string, value: string) {
    const filter = "//a[@class='dropdown-toggle sonata-ba-action']";
    const optionFilter = `//ul[@class="dropdown-menu"]//li[child::a[normalize-space()='${label}']]`;
    const btnFilter = "(//button[@placeholder='Filter' or normalize-space()='Apply'])[1]";
    const xpathValue = `//div[contains(@class,'form-group')][child::label[normalize-space()='${label}']]//div[@class='col-sm-4']`;

    await this.genLoc(filter).click();
    await this.genLoc(optionFilter).click();
    await this.genLoc(filter).click();
    await this.genLoc(`${xpathValue}/input`).fill(value);
    await this.genLoc(btnFilter).click();
    await this.page.waitForLoadState();
  }

  /**
   * Navigate to menu in dashboard
   * @param menu:  menu name
   * */
  async navigateToMenu(menu: string): Promise<void> {
    await this.page.locator(`//span[normalize-space()="${menu}"]`).click();
  }

  /**
   * Navigate to sub menu in dashboard
   * @param menu:  menu name
   * @param subMenu: sub menu name
   * */
  async navigateToSubMenu(menu: string, subMenu: string): Promise<void> {
    await this.page.locator(`//span[normalize-space()="${menu}"]`).click();
    await this.page.locator(`//li[@class="treeview active"]//a[normalize-space()="${subMenu}"]`).click();
    await this.page.waitForLoadState("networkidle");
  }

  //click button update
  async clickBtnUpdate() {
    await this.page.locator(`//button[@name='btn_update_and_edit']`).click();
  }
}
