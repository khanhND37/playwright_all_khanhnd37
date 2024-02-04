import { Locator, Page } from "@playwright/test";
import { SBPage } from "../page";

export class LogInOdooPage extends SBPage {
  account: Locator;
  password: Locator;
  login: Locator;

  constructor(page: Page, domainOdoo: string) {
    super(page, domainOdoo);
    this.account = this.genLoc('[placeholder="Email"]');
    this.password = this.genLoc('[placeholder="Password"]');
    this.login = this.page.locator("text=Log in");
  }

  /**
   * Log in to Odoo
   * @param account account to login Odoo
   * @param password password of the account
   */
  async loginToOdoo(account: string, password: string) {
    await this.goto("/web/login");
    await this.account.fill(account);
    await this.password.fill(password);
    await this.login.click();
  }

  /**
   * Go to Delivery Orders - Stock Warehouse
   * @param place place of inventory
   */
  async goToDeliveryOrders(place: string) {
    // go to Inventory
    await this.page.click(`//a[@accesskey="h"]/i`);
    await this.page.click(`//a[@data-menu-xmlid="stock.menu_stock_root"]`);
    // go to Delivery Orders - Stock Warehouse
    await this.page.click(`(//span[text()[normalize-space()="${place}"]])[3]/parent::div/preceding-sibling::div/a`);
    await this.page.waitForSelector(`//li[contains(@class,"breadcrumb-item") and contains(text(),"Delivery Orders")]`);
  }
}
