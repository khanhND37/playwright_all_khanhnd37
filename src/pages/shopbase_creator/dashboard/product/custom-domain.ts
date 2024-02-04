import { Page } from "playwright";
import { ProductPage } from "../product";

export class CustomDomainPage extends ProductPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathDesignSalePageButton = "//button[normalize-space()='Design Sales Page']";
  xpathConfirmButtonInPopUp = "//span[normalize-space()='Confirm']//parent::button";
  xpathCustomDomainCheckBox = "//span[@for='custom_domain']";
  xpathDropDownMenu = ".preferred-link__dropdown button";
  xpathMessPreferLink = "//div[contains(@class,'preferred-link__help')]";
  xpathPrimaryDomainCheckBox = "//span[@for='primary_domain']";
  xpathCancelButton = "//span[normalize-space()='Cancel']//parent::button";
  xpathPreviewHeader = "//span[normalize-space()='Preview']//parent::button";
  xpathPreviewSalePage = "(//div[normalize-space()='Preview sales page'])[2]";
  xpathPreferLinkMess = "//div[@class='sb-mt-small sb-text-caption sb-text preferred-link__help']";
  xpathPopUpTitle = "//div[@class='sb-text sb-text-medium']//div[normalize-space()='Confirm to re-assign custom link']";
  xpathPopUpDes = "//div[@class='sb-text-body-large sb-ml-small']";
  xpathDisableRedirectText = "//a[normalize-space()='Disable redirection']";
  xpathDisableRedirectButton = "//button//span[contains(normalize-space(),'Disable redirection')]";
  xpathAllProduct = "//div[normalize-space()='All products']//parent::div[@class='sb-font sb-flex sb-flex-grow']";
  xpathEnableRedirectText = "//span//a[@class='s-button is-text']";
  xpathEnableRedirectButton = "//button//span[contains(normalize-space(),'Enable redirection')]";
  xpathSelectADomain = "//button//span[normalize-space()='Select a domain']";
  xpathCurrentText = "//span[normalize-space()='(current)']";
  xpathAssignedDomain = "//div[@class='assigned-domain']";
  xpathAssignedProductType = "//span[@class='preferred-link__help__type']";
  xpathInputEmail = "//input[@placeholder = 'Your email address']";
  xpathPayNowButton = "//button[normalize-space()='Pay now']";
  xpathUnpublish = "//button//span[normalize-space()='Unpublish']";
  xpathPageNotFound = "//span[normalize-space()='Page not found']";

  /**
   * get xpath of title of product was assigned domain
   * @param productName Product name
   */
  getXpathAssignedProductTitle(productName: string): string {
    return `//div[contains(@class,'preferred-link__help')]//child::p[normalize-space()='${productName}']`;
  }

  /**
   * get xpath of custom domain after selected
   * @param domain Custom domain
   */
  getCustomDomainXpath(domain: string): string {
    return `//span[normalize-space()='${domain}']//parent::button`;
  }

  /**
   * get xpath of custom domain in droplist
   * @param domain Custom domain
   */
  getCustomDomainListXpath(domain: string): string {
    return `//p[normalize-space()='${domain}']`;
  }

  /**
   * get xpath of icon preview of product in list product page
   * @param productName Product name
   */
  getXpathIconPreview(productName: string): string {
    return `//p[normalize-space()='${productName}']//ancestor::div[@class='sb-flex sb-flex-align-center']//descendant::button`;
  }

  /**
   * get xpath of text "Was assigned to"
   * @param domain Custom domain
   */
  getXpathWasAssignedTo(domain: string): string {
    return `//p[normalize-space()='${domain}']//parent::div//following::span`;
  }

  //Disable redirect of custom domain to primary domain
  async disableRedirect(): Promise<void> {
    await this.page.waitForSelector(this.xpathDisableRedirectText);
    await this.page.locator(this.xpathDisableRedirectText).click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector(this.xpathDisableRedirectButton);
    await this.page.locator(this.xpathDisableRedirectButton).click();
  }

  //Navigate to product list page
  async goToProductList() {
    await this.page.getByRole("link", { name: "Products" }).click();
  }

  /**
   * Click icon preview of product in product list page
   * @param productName Product name
   */
  async clickIconPreview(productName: string) {
    await this.page.locator(this.getXpathIconPreview(productName)).click();
  }

  //Click checkbox custom domain
  async clickCheckBoxCustomDomain() {
    await this.page.locator(this.xpathCustomDomainCheckBox).click();
  }

  //Click checkbox primary domain
  async clickCheckBoxPrimaryDomain() {
    await this.page.locator(this.xpathPrimaryDomainCheckBox).click();
  }

  //Click dropdown menu
  async clickDropDownMenu() {
    await this.page.locator(this.xpathDropDownMenu).click();
  }

  //Click Cancel button
  async clickCancelButton() {
    await this.page.locator(this.xpathCancelButton).click();
  }

  /**
   * Select a custom domain from droplist
   * @param domain Custom domain
   */
  async selectCustomDomain(domain: string) {
    await this.page.waitForSelector(`//p[normalize-space()='${domain}']`);
    await this.page.getByText(`${domain}`).click();
  }

  //click save button
  async clickSaveButton() {
    await this.page.getByRole("button", { name: "Save" }).click();
  }

  //click confirm button in popup
  async clickConfirmButton() {
    await this.page.locator(this.xpathConfirmButtonInPopUp).click();
  }

  //click cancel button in popup
  async clickCancelPopupButton() {
    await this.page.getByRole("button", { name: "Cancel" }).nth(1).click();
  }

  /**
   * Choose a domain and click save button
   * @param domain Custom domain
   */
  async chooseDomain(domain: string) {
    await this.clickDropDownMenu();
    await this.selectCustomDomain(domain);
    await this.clickSaveButton();
  }

  /**
   * Choose a domain and click save button
   * @param domain Custom domain
   */
  async chooseDomain(domain: string) {
    await this.clickDropDownMenu();
    await this.selectCustomDomain(domain);
    await this.clickSaveButton();
  }
}
