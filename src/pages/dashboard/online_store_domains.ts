import { SBPage } from "@pages/page";

export class OnlineStoreDomainPage extends SBPage {
  xpathModal = "//div[contains(@class, 's-modal is-active')]";
  xpathModalPrimaryBtn = "//div[contains(@class, 's-modal is-active')]//button[contains(@class, 'is-primary')]";

  sidebarSelector = ".nav-sidebar";
  pageDomainSelector = ".page-domain";
  xpathMenuDomains = "li.title-child-menu-sidebar > [href='/admin/domain']";

  redirectDomainTextLink = ".traffic-status a";
  redirectSuccessMsgSelector = ".s-alert__title";

  xpathPrimaryDomain = "//td[contains(@class, 'table__domain')]";
  xpathDomainSection = "//section//*[self::h4[contains(text(), 'Domains')]]/ancestor::section[1]";
  xpathChangePrimaryDomain = "//*/h1[text()='Change primary domain?']";
  xpathRemoveDomain = "//td/a[contains(text(), 'Remove')]";

  xpathConnectExistingDomain = "//a[normalize-space()='Connect existing domain']";
  xpathInputDomain = ".s-input__inner";
  xpathConnectExistingDomainNextBtn = "//button[normalize-space()='Next'][contains(@class, 'is-primary')]";
  xpathConnectExistingDomainVerifyBtn =
    "//button[normalize-space()='Verify connection'][contains(@class, 'is-outline')]";
  alertSelector = ".s-alert__description *";
  errorSelector = ".s-form-item__error";
  successMsgSelector = ".is-green .s-alert__title";
  closeIcon = "i.s-icon-close";
  connectDomainPage = "text='Connect existing domain'";
  nextBtn = "button.btn-next";
  outlineBtn = "button.is-outline";
  outlineBtnIsLoading = "button.is-outline.is-loading";

  btnBuyNewDomain = "a:has-text('Buy new domain')";
  searchDomainResult = ".search-result__multiple-result";
  btnBuyPopularDomain = ".most-popular button";
  buyNewDomainPage = "h1:has-text('Buy new domain')";
  btnBuyDomain = "button.is-primary span:has-text('Buy domain')";
  topUp = "span:has-text('Top up')";
  btnConfirmTopUp = "span:has-text('Confirm top up')";
  topUpSuccessMsg = "text='You have topped up successfully!'";
  btnPayNow = ".sidebar-container span:has-text('Pay now')";
  primaryBtnIsLoading = "button.is-primary.is-loading";
  purchaseSuccessMsg = "text='Domain was purchased successfully'";
  sbManagedDomains = this.genLoc(".domain-type").filter({ hasText: "ShopBase-managed domains" });

  /**
   * Open domain in online store
   */
  async gotoDomainPage() {
    await this.page.locator(this.xpathMenuDomains).click();
  }

  /**
   * Get current primary domain
   */
  async getPrimaryDomain() {
    return await this.page.locator(this.xpathPrimaryDomain).innerText();
  }

  /**
   * Get list connected domains
   */
  async getConnectedDomains() {
    return await this.page
      .locator(this.xpathDomainSection)
      .evaluate(div =>
        Array.from(div.querySelectorAll("tr > td:first-child")).map((td: HTMLTableCellElement) => td.innerText),
      );
  }

  /**
   * Change primary domain
   * @param domain
   */
  async changePrimaryDomain(domain: string) {
    await this.page.locator(`//input[@value='${domain}']//parent::label//span[@class='s-check']`).click();
    await this.page.locator(this.xpathModalPrimaryBtn).click();
    await this.page.waitForSelector(this.pageDomainSelector);
  }

  /**
   * Connect domain
   * @param domain
   */
  async connectDomain(domain: string) {
    await this.page.locator(this.xpathConnectExistingDomain).hover();
    await this.page.locator(this.xpathConnectExistingDomain).click();
    await this.page.waitForSelector(this.connectDomainPage);

    await this.page.locator(this.xpathInputDomain).fill(domain);
    await this.page.locator(this.xpathConnectExistingDomainNextBtn).click();
    await this.page.locator(this.xpathConnectExistingDomainVerifyBtn).click();
    await this.page.waitForSelector(this.outlineBtnIsLoading, { state: "hidden" });
  }

  /**
   * Change Redirect domain
   * @param isRedirect
   */
  async changeRedirectDomain(isRedirect: boolean) {
    const textLink = await this.page.locator(this.redirectDomainTextLink).innerText();
    const actual = textLink === "Disable redirection";
    if (isRedirect !== actual) {
      await this.page.locator(this.redirectDomainTextLink).hover();
      await this.page.locator(this.redirectDomainTextLink).click();
      await this.page.locator(this.xpathModalPrimaryBtn).click();
      await this.page.waitForSelector(this.xpathModal, { state: "hidden" });
    }
  }

  /**
   * Generate random domain .info
   */
  generateDomain(): string {
    const timestamp = new Date().getTime();
    return `autobuydomain${timestamp}.info`;
  }

  /**
   * Get xpath list domain
   * @param title
   */
  xpathListDomains(title: string) {
    return `//section[contains(@class,'domain-type') and descendant::h4[normalize-space()='${title}']]//tbody//tr`;
  }

  /**
   * Get xpath doamin name in table Shop Domains
   * @param title
   * @returns
   */
  xpathShopDomains(title: string) {
    return `//h4[normalize-space()='Shop domains']//ancestor::section//tr//td[normalize-space()='${title}']`;
  }
}
