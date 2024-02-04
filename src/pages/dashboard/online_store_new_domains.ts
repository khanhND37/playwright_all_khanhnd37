import { SBPage } from "@pages/page";
import { expect } from "@playwright/test";

export class OnlineStoreNewFlowDomainPage extends SBPage {
  backBtnSelector = ".sb-btn-back";
  xpathDomainTitle = "//div[contains(text(), 'Domain')]";
  xpathDomainDescription = "//p[contains(text(), 'Domain bought')]";
  xpathDomainLearnMore = "//p[contains(text(), 'Domain bought')]//a";

  xpathConnectDomainBtn = '//button[normalize-space()="Connect existing domain"]';
  xpathBuyDomainBtn = "//button[normalize-space()='Buy new domain']";

  xpathShopDomainTab = "//div[contains(text(), 'Shop domains')]";
  xpathSbaseManagedTab = "//div[contains(text(), 'ShopBase-managed domains')]";
  xpathRequestingDomainTab = "//div[contains(text(), 'Request domains')]";

  xpathPrimaryDomainRow = "//div[normalize-space() = 'Primary']//ancestor::tr";

  connectedDomainTabTableSelector = ".spds-page-domain .sb-tab-panel:nth-child(2) .sb-table";
  sbaseManagedTabTableSelector = ".spds-page-domain .sb-tab-panel:nth-child(3) .sb-table";
  requestingTabTableSelector = ".spds-page-domain .sb-tab-panel:nth-child(4) .sb-table";

  changePrimaryDomainModalSelector = ".change-primary-domain-modal";
  xpathSetAsPrimaryModalBtn =
    "//div[contains(@class, 'change-primary-domain-modal')]//button[normalize-space() = 'Set as primary']";
  xpathCancelPrimaryModalBtn =
    "//div[contains(@class, 'change-primary-domain-modal')]//button[normalize-space() = 'Cancel']";

  xpathCheckDNSBtn = "//button[normalize-space() = 'Check DNS']";
  xpathDNSRequiredText = "//p[contains(text(), 'Required')]//span";
  xpathStepByStepInstructions = '//a[normalize-space()="step-by-step instructions"]';

  xpathRemoveDomainBtn = '//li[normalize-space()="Remove from shop"]';
  modalPrimaryBtnSelector = ".sb-popup .sb-button--primary";
  xpathTrafficFrom = '//span[contains(text(), "Traffic from")]';

  viewDomainTextSelector = ".finish-buy-domain h1";
  xpathExpireAt = "//div[contains(text(), 'EXPIRE AT')]";

  xpathRenewBtn = "//a[normalize-space() = 'Renew']";
  xpathRenewTitle = "//h1[normalize-space() =  'Renew your domain']";

  xpathDomainConnect = "//button[normalize-space() = 'Connect']//ancestor::tr//td//span";
  xpathConnectBtn = "//button[normalize-space() = 'Connect']";

  connectDomainModalSelector = ".connect-existing-modal";
  connectDomainModalInputSelector = ".connect-existing-modal .sb-input__input";
  connectDomainModalPrimaryBtnSelector = ".connect-existing-modal .sb-button--primary";
  connectDomainModalCloseBtnSelector = ".connect-existing-modal .sb-popup__header-close";

  xpathViewInstructionsBtn = '//button[normalize-space()="View instructions"]';
  xpathRequestReviewBtn = '//button[normalize-space()="Request review"]';
  xpathUnderReviewText = '//p[contains(text(), "is currently under review")]';
  xpathConnectedToOtherStoreText = '//p[contains(text(), "already connected to another store.")]';
  xpathConnectDomainModalEditBtn = '//button[normalize-space()="Edit"]';
  xpathVerifyConnection = '//button[normalize-space()="Verify connection"]';

  xpathCloseBtn = '//button[normalize-space()="Close"]';
  xpathVerifyAgainBtn = '//button[normalize-space()="Verify again"]';
  xpathConnectYourDomainText = '//p[normalize-space()="Connect your domain"]';

  shopDomainTabSelector = ".tab-navigtion__connected_domains";

  popupSelector = ".sb-popup";
  popupXButtonSelector = ".sb-popup__header button";
  popoverReferenceSelector = ".sb-popover__reference";

  alertTitleSelector = ".sb-alert__title";

  stepByStepUrl = "https://help.shopbase.com/en/article/add-a-custom-domain-to-shopbase-store-1olhc36";

  getManagedTableColXpath = (i: string) => {
    return this.page.locator(`${this.sbaseManagedTabTableSelector} thead tr th:nth-child(${Number(i) + 1})`);
  };

  getRemoveFromShopXpath = (popoverId: string) => {
    return this.page.locator(`//div[@id="${popoverId}"]//li[normalize-space()="Remove from shop"]`);
  };

  getSetPrimaryDomainHeaderSelector = () => {
    return this.page.locator(`${this.changePrimaryDomainModalSelector} .sb-popup__header h2`);
  };

  getSetPrimaryDomainContentSelector = () => {
    return this.page.locator(`${this.changePrimaryDomainModalSelector} .sb-popup__body p p`);
  };

  getSetPrimaryDomainCloseBtnSelector = () => {
    return this.page.locator(`${this.changePrimaryDomainModalSelector} .sb-popup__header button`);
  };

  /**
   * Verify domain row action
   * @param status
   * @param expectAction
   */
  verifyDomainRowActions = async (
    status: "Connected" | "Not connected" | "Generating SSL",
    expectAction: "Set as primary" | "Check DNS" | "",
  ) => {
    const condition = await this.page
      .locator(`//button[normalize-space() = '${status}']//ancestor::tr`)
      .filter({
        hasNot: this.page.locator(this.xpathPrimaryDomainRow),
      })
      .filter({
        hasNotText: /.*.(myshopbase.net|onshopbase.com)/gm,
      })
      .evaluateAll(
        (rows, expectAction) =>
          rows.every(
            row =>
              row.querySelector("td:nth-child(3) button span").textContent.includes(expectAction) &&
              row.querySelector(".sb-popover__reference") !== undefined,
          ),
        expectAction,
      );
    expect(condition).toBeTruthy();
  };

  /**
   * Parse table DOM to array
   * @param tableSelector
   * @param columns
   * @returns
   */
  parseTableToArray = (tableSelector: string, columns: string[]) => {
    return this.page
      .locator(tableSelector)
      .locator("tbody")
      .evaluate((tableBody, columns) => {
        const rows = tableBody.querySelectorAll("tr");
        return Array.from(rows).map(row =>
          Array.from(row.querySelectorAll("td")).map((td, index) => {
            let value: string | string[] = td.innerText;
            if (columns[index] === "status") {
              value = value.split("\n").filter(value => value !== "i");
            }
            return {
              key: columns[index],
              value,
            };
          }),
        );
      }, columns);
  };

  /**
   * Get current primary domain
   * @returns
   */
  getCurrentPrimaryDomain = async () => {
    return this.page.locator("//div[normalize-space() = 'Primary']//parent::div/span").textContent();
  };

  /**
   * Get selected domain will be set as primary
   * @returns
   */
  getSelectedPrimaryDomain = async () => {
    return this.page.locator("//button[normalize-space() = 'Set as primary']/ancestor::tr/td").first().textContent();
  };

  /**
   * Generate random domain
   * @returns
   */
  getRandomDomain = () => {
    const timestamp = new Date().getTime();
    const domainRandom = `autobuydomain${timestamp}.info`;
    return domainRandom;
  };

  /**
   * Get connected domains from table
   * @returns
   */
  getConnectedDomains = (): Promise<{ key: string; value: string | string[] }[][]> => {
    return this.parseTableToArray(this.connectedDomainTabTableSelector, ["domain", "status", "main_button"]);
  };

  /**
   * Get shopbase-managed domains from table
   * @returns
   */
  getShopBaseManagedDomains = (): Promise<{ key: string; value: string | string[] }[][]> => {
    return this.parseTableToArray(this.sbaseManagedTabTableSelector, [
      "domain",
      "status",
      "expired_date",
      "auto_renew",
      "main_button",
    ]);
  };

  /**
   * Get requesting domains from table
   * @returns
   */
  getRequestingDomains = (): Promise<{ key: string; value: string | string[] }[][]> => {
    return this.parseTableToArray(this.requestingTabTableSelector, ["domain", "request_date", "status", "main_button"]);
  };

  /**
   * Get list button locator of connect domain modal
   * @returns
   */
  getConnectModalBtn = () => {
    const connectDomainBtn = this.page.locator(this.xpathConnectDomainBtn);
    const connectDomainInput = this.page.locator(this.connectDomainModalInputSelector);
    const connectBtn = this.page.locator(this.connectDomainModalPrimaryBtnSelector);
    const closeConnectModalBtn = this.page.locator(this.connectDomainModalCloseBtnSelector);

    return {
      connectDomainBtn,
      connectDomainInput,
      connectBtn,
      closeConnectModalBtn,
    };
  };

  /**
   * Fill domain value to connect domain input modal
   * @param domain
   * @param closeModal
   */
  fillConnectDomain = async (domain: string, closeModal = true) => {
    const { closeConnectModalBtn, connectDomainBtn, connectDomainInput, connectBtn } = this.getConnectModalBtn();
    if (closeModal && (await closeConnectModalBtn.isVisible())) {
      await closeConnectModalBtn.click();
    }
    await connectDomainBtn.click();
    await connectDomainInput.fill(domain);
    await connectBtn.click();
  };
}
