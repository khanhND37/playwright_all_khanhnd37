import { APIRequestContext, Page } from "@playwright/test";
import type { ShopInfo } from "@types";
import { DashboardPage } from "./dashboard";

export class AccountSetting extends DashboardPage {
  buttonCloseStoreAnyway = "(//span[normalize-space()='Close store anyway'])[1]";
  xpathCurrentPlan = '//p[text()="Current plan"]/following-sibling::p';
  xpathTextboxCoupon = "//input[@placeholder='Coupon Code']";
  xpathInfoDiscount = "//p[contains(@class, 'info-discount')]";
  xpathTextErrorDiscount = "//p[contains(@class, 'form-item__error')]";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * I go to account setting page
   */
  async goToAccountSetting() {
    await this.page.goto(`https://${this.domain}/admin/settings/account`);
    await this.page.waitForSelector('//h1[text()="Account"]');
  }

  /**
   * goto Staff Acc Detail
   * @param staff name of staff
   */
  async gotoStaffAccDetail(staff: string) {
    await this.page.click(
      `//div[contains(text(),'Staff accounts')]//following-sibling::div//a[@class='staff-link' and normalize-space()='${staff}']`,
    );
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * I add a staff account
   * @param email email of staff
   * @param pass password of account
   */
  async addStaffAccountThenDelete(email: string, pass: string) {
    await this.page.goto(`https://${this.domain}/admin/settings/account/new`);
    await this.page.waitForSelector('//div[text()="Staff accounts"]');
    await this.page.fill('//form//input[@type="text"]', email);
    await this.page.waitForTimeout(1500);
    await this.page.click('(//button/span[text()="Send invite"])[1]');
    await this.page.waitForSelector('//div[text()="Staff profile"]');
    await this.page.waitForTimeout(1000);
    await this.page.click('//button/span[normalize-space()="Delete staff account"]');
    await this.page.waitForTimeout(2000);
    await this.page.fill('//input[@type="password"]', pass);
    await this.page.click('//button/span[normalize-space()="Confirm"]');
    await this.page.waitForSelector('//div[contains(text(), "deleted successfully")]');
  }

  /**
   * I confirm a plan
   * @param domain domain of shop
   */
  async confirmPlan(domain: string) {
    await this.page.goto(`https://${domain}/admin/pricing`);
    await this.page.click('(//button[@class="s-button full-width is-primary is-big"])[1]');
    await this.page.click('//button/span[normalize-space()="Confirm changes"]');
    await this.page.waitForURL(`https://${domain}/admin/settings/account`);
  }

  /**
   * I active a plan
   * @param domain domain of shop
   */
  async activePlan(domain: string) {
    await this.page.goto(`https://${domain}/admin/pricing`);
    await this.page.click('(//button[@class="s-button full-width is-primary is-big"])[1]');
    await this.page.click('//button/span[normalize-space()="Start plan"]');
    await this.page.waitForSelector('//div[contains(text(),"You are currently on the")]');
  }

  /**
   * I create a new shop
   * @param username username of account
   * @param password password to account
   * @param shopName name of shop
   * @param shopInfo info of shop
   * @param request input if need to verify on the screen display btn "Take me to my store"
   */
  async createNewShop(
    username: string,
    password: string,
    shopName: string,
    shopInfo: ShopInfo,
    request?: APIRequestContext,
  ) {
    await this.page.click(
      '//div[contains(@class,"user-setting hidden-sm") or @class = "unite-ui-dashboard__aside--user-info"]//span/img[@class="img-circle"]',
    );
    await this.page.click(
      '//div[@class = "popover__nested-info-content user-menu-redirect" or contains(@class, "dropdown-menu")]//a[@href="/admin/shop/select"]',
    );
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector("//button/span[normalize-space()='Sign in'] | //div/p[text()='Select a shop']");
    if (await this.page.locator('//button/span[normalize-space()="Sign in"]').isVisible()) {
      await this.page.fill('[id="email"]', username);
      await this.page.fill('[id="password"]', password);
      await this.page.click('//button/span[normalize-space()="Sign in"]');
    }
    await this.page.waitForSelector('//div/p[text()="Select a shop"]');
    await this.page.click('//button/span[normalize-space()="Add a new shop"]');
    await this.page.fill('//input[@placeholder="Your shop name"]', shopName);
    await this.page.click('//button/span[normalize-space()="Create"]');
    await this.page.click("//input[@placeholder='Select Store country']");
    await this.page.fill("//input[@placeholder='Select Store country']", shopInfo.country);
    await this.page.click(
      `//div[@placeholder="Select Store country"]/div/div[text()[normalize-space()="${shopInfo.country}"]]`,
    );
    await this.page.click("//input[@placeholder='Select personal location']");
    await this.page.fill("//input[@placeholder='Select personal location']", shopInfo.country);
    await this.page.click(
      `//div[@placeholder='Select personal location']/div/div[text()[normalize-space()="${shopInfo.country}"]]`,
    );
    await this.page.locator('//input[@id="phone-number"]').fill(shopInfo.phone_number);
    await this.page.locator('[placeholder="www\\.facebook\\.com\\/shopbase"]').fill(shopInfo.fb_link);
    await this.page.click('//button/span[normalize-space()="Next"]');
    if (await this.page.isVisible('//p[text()="I sell Physical Products"]')) {
      await this.page.click('//p[text()="I sell Physical Products"]');
    }
    await this.page.locator("text=Others").click();
    await this.page.click(`//span[normalize-space()="No thanks, I don't want to import"]`);
    // await this.page.selectOption("//select", "a");

    const shopId = parseFloat(await this.page.url().split("shop_id=")[1]);
    if (request) {
      const linkUrl = `https://${this.domain}/signup/onboarding-question?shop_id=${shopId}&store_create_mode=General`;
      const response = await request.get(linkUrl);
      if (response.status() === 200) {
        await this.page.click("//span[normalize-space()='Take me to my store']");
      } else if (response.status() === 404) {
        return;
      }
    }
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector("(//div[contains(@class, 'in-app-notification')])[1]");
  }

  /**
   * I close then reopen the store
   * @param pass password of account
   */
  async closeStore(pass: string) {
    await this.page.click("//span[normalize-space()='Close store']");
    if (await this.page.locator("//span[normalize-space()='Other (please specify)']").isVisible()) {
      await this.page.click("//span[normalize-space()='Other (please specify)']");
      await this.page.fill("(//textarea)[last()]", "test");
      await this.page.click("//div[@class='non-disable-button']/span[normalize-space()='Continue']");
    }
    await this.page.waitForSelector(this.buttonCloseStoreAnyway);
    while (await this.page.locator(this.buttonCloseStoreAnyway).isVisible()) {
      await this.page.click(this.buttonCloseStoreAnyway);
      await this.page.waitForTimeout(1000);
    }
    await this.page.fill("//input[@type='password']", pass);
    if (await this.page.locator("//span[normalize-space()='Continue']").isVisible()) {
      await this.page.click(`//span[normalize-space()="Continue"]`);
      await this.page.click(`//span[normalize-space()="Got it"]`);
    }
    if (await this.page.locator("//span[normalize-space()='Confirm']").isVisible()) {
      await this.page.click("//span[normalize-space()='Confirm']");
      await this.page.click("//span[normalize-space()='Close store']");
    }
    await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
  }

  /**
   * Click log back in my store
   */
  async clickLogBackInMyStore() {
    if (
      await this.page.locator("(//span[normalize-space()='Log back in my store'])[1]").isVisible({ timeout: 60000 })
    ) {
      await this.page.click("(//span[normalize-space()='Log back in my store'])[1]");
      await this.page.click(`//span[normalize-space()="Confirm"]`);
      await this.waitForElementVisibleThenInvisible(this.xpathLoadingButton);
      await this.page.waitForURL(new RegExp(".*/admin/.*"), { timeout: 60000 });
    }
  }

  /**
   * I reopen the shop
   * @param username username of account
   * @param password password of account
   * @param shopName name of shop
   */
  async reopenStore(username: string, password: string, status?: "sign-in" | "shop select") {
    await this.clickLogBackInMyStore();
    switch (status) {
      case "sign-in":
        await this.page.waitForSelector('//button/span[normalize-space()="Sign in"]');
        await this.page.fill('[id="email"]', username);
        await this.page.fill('[id="password"]', password);
        await this.page.click('//button/span[normalize-space()="Sign in"]');
        await this.page.waitForLoadState("networkidle");
        await this.waitForElementVisibleThenInvisible(this.xpathLoadingButton);
        await this.page.waitForSelector("//span[normalize-space()='Log back in my store']");
        await this.page.click(`//span[normalize-space()="Log back in my store"]`);
        await this.page.click(`//span[normalize-space()="Confirm"]`);
        await this.waitForElementVisibleThenInvisible(this.xpathLoadingButton);
        await this.page.waitForURL(new RegExp(".*/admin/.*"), { timeout: 60000 });
        break;
      case "shop select":
        await this.waitResponseWithUrl("/shop/select", 60000);
        await this.page.waitForSelector('//div/p[text()="Select a shop"]');
        if (await this.page.locator(`//a//span[text() = '${this.domain}']`).isVisible()) {
          await this.page.click(`//a//span[text() = '${this.domain}']`);
        }
        break;
      default:
        await this.page.waitForURL(new RegExp(".*/admin/.*"), { timeout: 60000 });
        break;
    }
    await this.waitUntilElementInvisible("(//img[@class='sbase-spinner'])[1]");
    await this.clickLogBackInMyStore();
    if (
      await this.page
        .locator("//*[normalize-space()='Your store is closed, please choose a plan to continue']")
        .isVisible({ timeout: 15000 })
    ) {
      await this.page.click("(//button[normalize-space()='Choose this plan'])[1]");
      await this.page.click("(//button[normalize-space()='Start plan'])[1]");
      await this.page.waitForSelector("(//div[contains(@class, 'in-app-notification')])[1]");
    }
  }

  /**
   * I update profile of the account
   */
  async updateProfile(pass: string) {
    await this.page.goto(`https://${this.domain}/admin/userprofile`);
    await this.page.fill('(//form//input[@type="text"])[1]', `quan${new Date().getSeconds()}`);
    await this.page.fill('(//form//input[@type="text"])[2]', `le${new Date().getSeconds()}`);
    await this.page.click('//button/span[normalize-space()="Save changes"]');
    await this.page.waitForTimeout(1000);
    if (await this.page.locator("//button[normalize-space()='Confirm']").isVisible()) {
      await this.page.fill("//input[@type='password']", pass);
      await this.page.click("//button[normalize-space()='Confirm']");
    }
    await this.page.waitForSelector('//div[text()="All changes were successfully saved"]');
  }

  /**
   * I add staff account with full permissions
   */
  async addStaffAccountFullPermissions(email: string) {
    await this.page.click('(//*[normalize-space()="Add staff account"])[last()]');
    await this.page.waitForURL(`https://${this.domain}/admin/settings/account/new`);
    await this.page.waitForSelector('//div[text()="Staff accounts"]');
    await this.page.fill('//form//input[@type="text"]', email);
    await this.page.click('(//button/span[text()="Send invite"])[1]');
    await this.page.waitForSelector('//div[text()="Staff profile"]');
  }

  /**
   * I delete the account
   * @param pass password of the account
   */
  async deleteAccount(pass: string) {
    await this.page.waitForTimeout(1000);
    await this.page.click('//button/span[normalize-space()="Delete staff account"]');
    await this.page.waitForSelector('//input[@type="password"]');
    await this.page.fill('//input[@type="password"]', pass);
    await this.page.waitForSelector('//button/span[normalize-space()="Confirm"]');
    await this.page.click('//button/span[normalize-space()="Confirm"]');
    await this.page.waitForSelector('//div[contains(text(), "deleted successfully")]');
  }

  /**
   * I delete all the staff accounts
   * @param pass password of the account
   */
  async deleteAllStaffAccount(pass: string) {
    const staff = '//a[contains(@href,"/admin/settings/account/") and @class="staff-link"]';
    for (let i = await this.page.locator(staff).count(); i > 0; i--) {
      await this.page.click(`(${staff})[${i}]`);
      await this.page.waitForSelector('//button/span[normalize-space()="Delete staff account"]');
      await this.page.waitForTimeout(1000);
      await this.deleteAccount(pass);
      await this.page.waitForSelector(this.xpathToastMessage, { state: "hidden" });
    }
  }

  /**
   * I add staff account without full permissions
   * @param email
   * @param permissions
   */
  async addStaffAccountNotFullPermissions(email: string, permissions: Array<string>) {
    await this.page.click('(//*[normalize-space()="Add staff account"])[last()]');
    await this.page.waitForURL(`https://${this.domain}/admin/settings/account/new`);
    await this.page.waitForSelector('//div[text()="Staff accounts"]');
    await this.page.fill('//form//input[@type="text"]', email);
    await this.page.click('//label/span[normalize-space()="This staff account will have full permissions"]');
    for (let i = 0; i < permissions.length; i++) {
      await this.page.click(`//label/span[normalize-space()="${permissions[i]}"]`);
    }
    await this.page.click('(//button/span[text()="Send invite"])[last()]');
    await this.page.waitForSelector('//div[text()="Staff profile"]');
  }

  /*
   * Input coupon for next charge
   * Click button Apply
   */
  async applyCouponForNextCharge(coupon: string) {
    const xpathBtnApply = "//button[normalize-space()='Apply']";
    const xpathBtnReplace = "//button[normalize-space()='Replace']";

    if (await this.page.locator(xpathBtnReplace).isVisible()) {
      await this.page.click(xpathBtnReplace);
    }

    await this.page.waitForSelector(this.xpathTextboxCoupon);
    await this.page.fill(this.xpathTextboxCoupon, coupon);
    await this.page.click(xpathBtnApply);
    await this.page.waitForLoadState("networkidle");
  }

  async checkedModule(moduleName: string, isChecked: boolean) {
    if (isChecked) {
      await this.page.check(this.getXpathCheckboxWithModule(moduleName));
    } else {
      await this.page.uncheck(this.getXpathCheckboxWithModule(moduleName));
    }
  }

  /**
   * get transaction fee of current package by api
   * @param request call to API
   * @param domainApi is domain env
   * @param shopId is shop id
   */
  async getTransactionFeeCurrentPackageByAPI(
    request: APIRequestContext,
    domainApi: string,
    shopId: string,
  ): Promise<number> {
    const response = await request.get(`${domainApi}/v1/payment/package-group?shop_id=${shopId}`);
    if (!response.ok()) {
      return Promise.reject("Error: Check domain api or shop id again.");
    } else {
      const resBody = await response.json();
      return resBody.current_package.transaction_fee;
    }
  }

  getXpathCheckboxCustomizePermission(staffName: string): string {
    return `//span[contains(normalize-space(),'${staffName}')]//parent::label/span[@class='s-check']`;
  }

  getXpathCheckboxWithModule(moduleName: string): string {
    return `//span[normalize-space()='${moduleName}']//parent::label/span[@class='s-check']`;
  }

  async getProfileName(): Promise<string> {
    await this.page.goto(`https://${this.domain}/admin/userprofile`);
    await this.page.waitForSelector("//div[normalize-space() = 'Your profile']");
    const firstName = await this.page.locator('//label[text()="First name"]/parent::*//input').inputValue();
    const lastName = await this.page.locator('//label[text()="Last name"]/parent::*//input').inputValue();
    return firstName + " " + lastName;
  }
}
