import { Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { Config } from "@types";

export class HighRiskPage extends SBPage {
  account: Locator;
  password: Locator;
  login: Locator;

  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
    this.account = this.genLoc('[placeholder="Email"]');
    this.password = this.genLoc('[placeholder="Password"]');
    this.login = this.page.locator("text=Log in");
  }

  /**
   * Log in to Odoo
   * @param account
   * @param password
   */
  async loginToOdoo({ account = "", password = "" }: { account?: string; password?: string }) {
    await this.goto("/web/login");
    await this.account.fill(account);
    await this.password.fill(password);
    await this.login.click();
  }

  /**
   * Go to High-risk messages page
   * account: admin/admin
   */
  async goToHighRiskMessagesPage(page: Page) {
    await page.locator("nav i").first().click();
    await page.locator('a[role="menuitem"]:has-text("Sales")').click();
    await page.locator(`//li//a[normalize-space()="Configuration"]`).click();
    await Promise.all([
      page.waitForNavigation(/*{ url: '${conf.caseConf.url_highrisk_page}' }*/),
      page.locator("text=High-risk messages").click(),
    ]);
  }

  /**
   * Đợi navigate đến URL của High-risk messages page
   * Click create button Create tại High-risk messages page
   */
  async clickButtonCreate(page: Page) {
    await Promise.all([
      page.waitForNavigation(/*{ url: '${conf.caseConf.url_highrisk_page}' }*/),
      page.locator('button:has-text("Create")').click(),
    ]);
  }

  /**
   * Nhập Internal Reference của 1 High-risk messages
   * @param internal_ref
   */
  async enterInternalRef(page: Page, conf: Config) {
    const currentTime = Math.floor(Date.now() / 1000);
    await page.locator('input[name="internal_reference"]').click();
    await page.locator('input[name="internal_reference"]').fill(`${conf.caseConf.internal_ref}+${currentTime}`);
  }

  /**
   * Nhập Message của 1 High-risk messages
   * @param message
   */
  async enterMessage(page: Page, conf: Config) {
    const currentTime = Math.floor(Date.now() / 1000);
    await page.locator('textarea[name="messages"]').click();
    await page.locator('textarea[name="messages"]').fill(`${conf.caseConf.message}+${currentTime}`);
  }

  /**
   * Nhập thông tin của 1 High-risk messages không chứa param
   * @param internal_ref
   * @param message
   */
  async enterInfoHighRiskMessage(page: Page, conf: Config) {
    await this.clickButtonCreate(page);
    await this.enterInternalRef(page, conf);
    await this.enterMessage(page, conf);
  }

  /**
   * Nhập Message của 1 High-risk mesages chứa param
   * @param internal_ref
   * @param message_param
   */
  async enterInfoHighRiskMessageParam(page: Page, conf: Config) {
    const currentTime = Math.floor(Date.now() / 1000);
    await this.clickButtonCreate(page);
    await this.enterInternalRef(page, conf);
    await page.locator('textarea[name="messages"]').click();
    await page.locator('textarea[name="messages"]').fill(`${conf.caseConf.message_param}+${currentTime}`);
    await page.locator(`//button[normalize-space()="Save"]`).click();
  }

  /**
   * Edit High-risk messages đầu tiên tại High-risk messages page
   * @param internal_ref
   * @param message
   */
  async editInfoHighRiskMessage(page: Page, conf: Config) {
    await page.locator(`(//td[@class="o_data_cell o_field_cell o_list_char o_required_modifier"])[1]`);
    await page.locator(`//button[normalize-space()="Edit"]`).click();
    await this.enterInternalRef(page, conf);
    await this.enterMessage(page, conf);
  }

  /**
   * Lấy giá trị Internal Reference của High-risk mesages thứ nhất tại High-risk messages page
   * @return <string> the Internal Reference
   */
  async getInternalRefHRPage(): Promise<string> {
    return await this.getTextContent(`(//td[@class="o_data_cell o_field_cell o_list_char o_required_modifier"])[1]`);
  }

  /**
   * Lấy giá trị Messages của High-risk mesages thứ nhất tại High-risk messages page
   * @return <string> the Internal Reference
   */
  async getMessageHRPage(): Promise<string> {
    return await this.getTextContent(`(//td[@class="o_data_cell o_field_cell o_list_text o_required_modifier"])[1]`);
  }

  /**
   * Lấy giá trị Internal Reference tại màn Detail của 1 High-risk messages
   * @return <string> the Internal Reference
   */
  async getInternalRef(): Promise<string> {
    return await this.getTextContent(`//span[@name="internal_reference"]`);
  }

  /**
   * Lấy giá trị Messages tại màn Detail của 1 High-risk messages
   * @return <string> Messages
   */
  async getMessage(): Promise<string> {
    return await this.getTextContent(`//span[@name="messages"]`);
  }

  /**
   * Lấy giá trị Internal Reference Search được tại màn High-risk messages page
   * @return <string> the Internal Reference Search được
   */
  async getInternalRefSearchResult(): Promise<string> {
    return await this.getTextContent(`(//td[@class="o_data_cell o_field_cell o_list_char o_required_modifier"])[1]`);
  }

  /**
   * Click vào SKU đầu tiên tại màn High-risk messages page
   * Chọn Acion Delete để xóa SKU đầu tiên tại màn High-risk messages page
   */
  async deleteHighRiskMessage(page: Page) {
    await page.locator(`(//td[@class="o_data_cell o_field_cell o_list_char o_required_modifier"])[1]`).click();
    await page.locator(`//span[normalize-space()="Action"]`).click();
    await page.locator(`//ul[@class="o_dropdown_menu dropdown-menu show"]//li//a[normalize-space()="Delete"]`).click();
  }

  /**
   * Từ màn detail 1 high-risk click vào button Create -> click Discard để back về màn High-risk messages page
   */
  async backToHighRiskPage(page: Page) {
    await page.locator('button:has-text("Create")').click();
    await page.locator('button:has-text("Discard")').click();
  }
}
