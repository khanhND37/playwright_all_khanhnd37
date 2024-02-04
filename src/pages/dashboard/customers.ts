/* eslint-disable max-len */
import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";
import type { OptionExportOld } from "@types";

export class CustomersPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Search customers by name
   * @param customerName is the name of the customer
   */
  async searchCustomers(customerName: string) {
    const xpathSearch = "//input[@placeholder='Search customers']";
    //Search customers
    await this.page.waitForSelector(xpathSearch);
    await this.genLoc(xpathSearch).fill(customerName);
    //Press Enter
    await this.genLoc(xpathSearch).press("Enter");
    await this.page.waitForSelector("//table[@class='table table-hover hidden-xs hidden-sm']");
  }

  /**
   * Click the customer by email
   * @param email
   */
  async clickCustomerbyEmail(email: string) {
    await this.page.locator(`//div[normalize-space()='${email}']`).nth(1).click();
    await this.page.waitForSelector(".sb-skeleton", { state: "hidden" });
  }

  /**
   * Search contacts by name
   * @param contactName name of the contact
   */
  async searchContacts(contactName: string) {
    const xpathSearch = "//input[@placeholder='Search contacts']";
    //Search customers
    await this.page.waitForSelector(xpathSearch);
    await this.genLoc(xpathSearch).fill(contactName);
    //Press Enter
    await this.genLoc(xpathSearch).press("Enter");
    await this.page.waitForSelector(".sb-block-item__content");
  }

  /**
   * Select one or more customers on customers list
   * @param quantity  input quantity need select
   */
  async selectCustomers(quantity: number) {
    for (let i = 1; i <= quantity; i++) {
      await this.page.check(`//tbody//tr[${i}]//descendant::span[@class= 'sb-check']`);
    }
  }

  /**
   * Download file CSV export Customer when click button Export on popup
   * @return the path of the file
   */
  async downloadFileExportCustomer(): Promise<string> {
    await this.clickButtonOnPopUpWithLabel("Export");
    const download = await this.page.waitForEvent("download");
    return download.path();
  }

  /**
   * Click btn Export
   * Select options before export customers
   * @param options select option to export customers with type option export
   */
  async selectOptionExportCustomer(options: OptionExportOld) {
    await this.genLoc("//button[normalize-space()='Export']").click();
    await this.genLoc(
      `//h4[normalize-space()='Export:']//following::span[normalize-space()='${options.option}']`,
    ).click();
    await this.genLoc(
      `//h4[normalize-space()='Export as:']//following::span[normalize-space()='${options.file}']`,
    ).click();
  }

  /**
   * Hover tag customer
   */
  async hoverTagCustomer() {
    await this.page.locator("(//span[contains(@class, 'sb-badge')])[1]").hover();
  }

  /**
   * Switch tab on contacts page
   * @param name is the name of the tab
   */
  async switchToTab(name: string) {
    await this.page
      .locator(`(//div[contains(@class, 'sb-tab-navigation__item') and normalize-space()='${name}'])[1]`)
      .click();
    await this.page.waitForSelector(".sb-block-item__content");
  }

  /**
   * Click edit contact
   */
  async clickEditContact() {
    await this.page
      .locator(`(//div[@class='s-heading' and normalize-space()='Contact']//following-sibling::a)[1]`)
      .click();
  }

  /**
   * Click "Filter by form" button
   */
  async clickFilterByForm() {
    await this.page.locator(`(//button[normalize-space()='Filter by form'])[1]`).click();
  }

  /**
   * Check form is exist in filter form
   * @param formName is the name of the form
   */
  async isFilterFormExist(formName: string) {
    return await this.isElementExisted(
      `//div[contains(@class, 'sb-filter-popover')]//div[contains(@class, 'sb-tooltip__reference') and normalize-space()='${formName}']`,
    );
  }

  async isCustomerExist(email: string) {
    return await this.isElementExisted(`//div[normalize-space()='${email}']`);
  }

  /**
   * Get order count in customer detail page
   * @returns the number of orders
   */
  async getOrdersCount(): Promise<number> {
    return Number(
      await this.getTextContent(
        "//p[@class='digital-product--member__profile__summary__txt' and normalize-space()='Orders']/following-sibling::p",
      ),
    );
  }

  /**
   * Go to customer detail page by email
   * @param email
   */
  async gotoCustomerDetailByEmail(email: string) {
    await this.goto("/admin/customers");
    await this.searchContacts(email);
    await this.clickCustomerbyEmail(email);
  }

  async gotoCustomerList() {
    await this.goto("/admin/customers");
  }

  async gotoCustomerDetail(email: string) {
    await this.gotoCustomerList();
    await this.page.waitForSelector("//div[@class='customer-list-container']");
    await this.searchCustomers(email);
    await this.page.waitForLoadState("networkidle");
    await this.openThe1stCustomerOnList();
  }

  async openThe1stCustomerOnList() {
    await this.page.locator("(//div[@class='customer']//tr[1]//span)[3]").click();
  }

  /**
   * xpath input label
   * @param label
   * @returns
   */
  getXpathInputWithLabel(label: string): string {
    return `//label[normalize-space()='${label}']//parent::div//following-sibling::div//input`;
  }

  /**
   *
   // eslint-disable-next-line max-len, max-len
   * @param fieldName include: "First name","Last name","Address","CPF/CNPJ number","PCCC number","CF/PEC number","Resident ID number","City","ZIP/Postal Code","Phone number"
   * @param data
   */
  async editShippingDefaultCustomer(fieldName: string, data: string): Promise<void> {
    await this.page.click(
      "//div[normalize-space()='Default address']//following-sibling::span//a[normalize-space()='Change']",
    );
    await this.page.click(
      "//p[normalize-space()='Default address']//following-sibling::div//a[normalize-space()='Edit address']",
    );
    await this.page.waitForSelector("//div[@class='sb-form']");
    await this.genLoc(this.getXpathInputWithLabel(fieldName)).fill(data);
    await this.clickOnBtnWithLabel("Save");
  }
}
