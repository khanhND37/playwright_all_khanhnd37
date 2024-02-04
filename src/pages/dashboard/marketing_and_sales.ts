import { SBPage } from "@pages/page";
import { APIRequestContext, expect, Page } from "@playwright/test";

export class MarketingAndSales extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Go to menu Marketing and Sales via domain
   */
  async gotoMenuMarketingAndSales() {
    await this.page.goto(`https://${this.domain}/admin/sales-channels`);
  }

  /**
   * Navigate to submenu on menu dashboard
   * @param submenu
   */
  async navigateToSubmenu(submenu: string) {
    await this.page.click(`//span[normalize-space()='${submenu}']`);
  }

  /**
   * Open channel on Sales channels or Marketing emails
   * @param channel
   */
  async openChannel(channel: string) {
    await this.page.click(`//p[normalize-space()='${channel}']`);
  }

  /**
   * Enter Klaviyo Api Key
   * @param type Public API Key | Private API Key
   * @param key
   */
  async enterKlaviyoApiKey(type: string, key: string) {
    const xpathPublicApiKey = "//input[contains(@placeholder, 'Enter your Klaviyo public API key')]";
    const xpathPrivateApiKey = "//input[contains(@placeholder, 'Enter your Klaviyo private API key')]";
    switch (type.toLocaleLowerCase()) {
      case `public`:
        await this.enterKlaviyoKeyThenSave(xpathPublicApiKey, key);
        break;
      case `private`:
        await this.enterKlaviyoKeyThenSave(xpathPrivateApiKey, key);
        break;
      default:
        // eslint-disable-next-line no-console
        console.error(`Invalid API type.`);
    }
  }

  async enterKlaviyoKeyThenSave(xpathApiKey: string, key: string) {
    const content = await this.page.locator(xpathApiKey).textContent();
    if (!(content.length == 0 && key.length == 0)) {
      await this.page.locator(xpathApiKey).fill(`${key}   `);
      this.clickSaveChangesButton();
      await expect(this.page.locator(`//div[contains(text(),'Success')]`)).toBeVisible();
    }
  }

  /**
   * Click on Save changes button after edit input field(s)
   */
  async clickSaveChangesButton() {
    await this.page.locator('button:has-text("Save changes")').click();
  }

  /**
   * Wait about X miliseconds
   * @param miliseconds
   */
  async wait(miliseconds: number) {
    await new Promise(wait => setTimeout(wait, miliseconds));
  }

  /**
   * Get tracking_account config via api
   * @returns account property
   */
  async getTrackingAccountConfig(request: APIRequestContext) {
    const response = await request.get(`https://${this.domain}/api/bootstrap/next.json`, {
      headers: {
        Accept: "application/json",
      },
    });
    expect(response.ok()).toBeTruthy();
    return response.json().then(response => response.result.tracking.tracking_account[0].account);
  }

  /**
   * Verify tracking_account information is configured after add Public API Key and Private API Key
   * @param publicApiKey
   * @param privateApiKey
   * @param request
   */
  async isTrackingAccountConfigured(publicApiKey: string, privateApiKey: string, request: APIRequestContext) {
    if (!publicApiKey) {
      if ("" === privateApiKey) {
        expect(await this.getTrackingAccountConfig(request)).toEqual(`{"klaviyo_api_key":["${publicApiKey}"]}`);
      }
    }
  }

  /**
   * Enter customer email in search field on Customer dashboard
   * @param email
   */
  async enterCustomerEmailInSearchField(email: string) {
    await this.page.locator('[placeholder="Search customers"]').fill(email);
    await this.page.locator('[placeholder="Search customers"]').press("Enter");
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Open Klaviyo channel on dashboard
   * @param submenu
   * @param channel
   */
  async openKlaviyoChannelOnDashboard(submenu: string, channel: string) {
    await this.gotoMenuMarketingAndSales();
    await this.navigateToSubmenu(submenu);
    await this.closeOnboardingPopup();
    await this.openChannel(channel);
  }

  /**
   * Open Customers page on dashboard
   */
  async openCustomersOnDashboard() {
    await this.page.waitForLoadState("load");
    await this.page.goto(`https://${this.domain}/admin/customers`);
    await this.page.waitForLoadState("load");
  }

  /**
   *
   * Click button Sync data at section Sync historical data for Klaviyo
   */
  async clickSyncDataKlaviyo() {
    await this.page.click("//div[contains(@class, 'section')]//button[contains(text(), 'Sync data')]");
  }

  /**
   * Verify sync historical data via api
   */
  async syncHistoricalDataKlaviyo(shopId: number, request: APIRequestContext) {
    const response = await request.post(`https://${this.domain}/admin/sync-history-data.json?shop_id=${shopId}`, {
      data: {
        success: true,
        is_sync_data: true,
      },
    });
    expect(response.ok()).toBeTruthy();
  }
}
