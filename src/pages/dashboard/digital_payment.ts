import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

export class PaymentProviderPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathToggleTestModeOn = "//input[@type = 'checkbox' and @value = 'true']";
  xpathToggleTestModeOff = "//input[@type = 'checkbox' and @value = 'false']";
  xpathAlertProvider = "//div[@class = 'sb-alert__title sb-text sb-text-body-large sb-pr-large']";
  xpathButtonSelectPlan = "//button[normalize-space() ='Select a plan' and contains(@class, 'sb-button--default')]";
  xpathToggleTestMode = "//*[normalize-space() = 'Enable test mode']//input[@type = 'checkbox']/parent::span";

  /**
   * click button Add a new account and open add new account screen for each provider
   * @param provider Stripe, Paypal
   */
  async openAddNewPayment(provider: string) {
    const xpathMethod = `//div[normalize-space() = '${provider} account']/parent::div`;
    const xpathStripeButton = "//button[normalize-space() = 'Add a new account']";
    const xpathPaypalButton = "//button[normalize-space()='Activate with API key']";
    if (provider === "Stripe") {
      await this.page.click(`${xpathMethod}${xpathStripeButton}|${xpathStripeButton}`);
    } else {
      await this.page.click(`${xpathMethod}${xpathPaypalButton}|${xpathPaypalButton}`);
    }
    const waitLoad = await this.page.waitForSelector(
      `//div[normalize-space() ='Add new ${provider} account']|//div[normalize-space() ='Add new PayPal account']`,
    );
    waitLoad.waitForElementState("stable");
  }

  /**
   * check the Use API Keys to connect option of Stripe account
   */
  async selectAPIKeyOption() {
    await this.page.click("//div[@class = 'sb-block-item__content']");
    await this.page.click("//label[normalize-space() = 'Use API Keys to connect']//span[@class = 'sb-check']");
  }

  /**
   * input info for Stripe account or Paypal account
   * @param publicKey specific public key or client id from config
   * @param secretKey specific secret key or client secret key id from config
   */
  async inputPaymentKey(publicKey: string, secretKey: string, accountName?: string) {
    const xpathPublicKey = "//label[normalize-space() = '* Public Key']/parent::div//input[@class = 'sb-input__input']";
    const xpathClientId = "//label[normalize-space() = '* Client ID']/parent::div//input[@class = 'sb-input__input']";
    const xpathSecretKey = "//label[normalize-space() = '* Secret Key']/parent::div//input[@class = 'sb-input__input']";
    const xpathClientSecretKey =
      "//label[contains(text(),'Client Secret Key')]/parent::div//input[@class = 'sb-input__input']";

    if (accountName) {
      await this.page.fill(
        "//label[normalize-space() = '* Account Name']/parent::div//input[@class = 'sb-input__input']",
        accountName,
      );
    }
    await this.page.fill(`${xpathPublicKey}|${xpathClientId}`, publicKey);
    await this.page.fill(`${xpathSecretKey}|${xpathClientSecretKey}`, secretKey);
  }

  /**
   * input public key or client id for Stripe account or Paypal account
   * @param publicKey specific public key or client id from config
   */
  async editPublicKey(publicKey: string) {
    const xpathPublicKey =
      "//div[contains(@class, 'sb-collapse-item--active')]//label[normalize-space() = '* Public Key']/parent::div//input[@class = 'sb-input__input']";
    const xpathClientId =
      "//div[contains(@class, 'sb-collapse-item--active')]//label[normalize-space() = '* Client ID']/parent::div//input[@class = 'sb-input__input']";
    const xpathEditPublicKey = `${xpathPublicKey}|${xpathClientId}`;
    await this.page.click(xpathEditPublicKey);
    await this.page.fill(xpathEditPublicKey, publicKey);
  }

  /**
   * input secret key for Stripe account or Paypal account
   * @param secretKey specific secret key or client secret key id from config
   */
  async editSecretKey(secretKey: string) {
    const xpathSecretKey =
      "//div[contains(@class, 'sb-collapse-item--active')]//label[contains(text(),'Secret Key')]/parent::div//input[@class = 'sb-input__input']";
    await this.page.click(xpathSecretKey);
    await this.page.fill(xpathSecretKey, secretKey);
    await this.page.locator(xpathSecretKey).evaluate(e => e.blur());
  }

  /**
   * click button Add Account after fill info of account
   */
  async clickAddAccount() {
    await this.page.click("//button[normalize-space() = 'Add account']");
    await this.page.waitForSelector("(//div[normalize-space() = 'Payment provider'])[1]");
  }

  /**
   * close popup next step on menu
   */
  async closeNextStep() {
    await this.page.click("//div[@class = 'button-close']");
  }

  /**
   * click to tab with name on menubar
   * @param menu name of menu
   */
  async navigateToMenu(menu: string) {
    await this.page
      .locator(
        `//ul[contains(@class,'menu') or contains(@class,'active treeview-menu') or contains(@class,'nav-sidebar')]` +
          `//li` +
          `//*[text()[normalize-space()='${menu}']]` +
          `//ancestor::a` +
          `|(//span[following-sibling::*[normalize-space()='${menu}']]//ancestor::a)[1]`,
      )
      .click();
  }

  /**
   * click to Save button after edit info of provider
   */
  async clicktoSave() {
    await this.page.click("//div[contains(@class, 'sb-collapse-item--active')]//button[normalize-space() = 'Save']");
  }

  /**
   * click to button Remove account để delete provider account
   */
  async removeProvider() {
    await this.page.click(
      "//div[contains(@class, 'sb-collapse-item--active')]//button[normalize-space() = 'Remove account']",
    );
    await this.page.click("//button[normalize-space() = 'Confirm']");
  }

  /**
   * click to provider name to expand edit account
   * @param providerName
   */
  async expandGatewayEditingForm(providerName: string) {
    await this.page.click(`//div[normalize-space() = '${providerName}']`);
  }

  /**
   * click to Deactive provider account
   */
  async clicktoDeactive() {
    await this.page.click(
      "//div[contains(@class, 'sb-collapse-item--active')]//button[normalize-space() = 'Deactivate']",
    );
  }

  /**
   * click to Active provider account
   */
  async clicktoActive() {
    await this.page.click(
      "//div[contains(@class, 'sb-collapse-item--active')]//button[normalize-space() = 'Activate']",
      { timeout: 3000 },
    );
  }

  /**
   * turn on paypal test mode
   */
  async clickTestMode() {
    const xpathToggle = "//input[@type = 'checkbox']/parent::span//span";
    if ((await this.page.isChecked(xpathToggle)) === false) {
      await this.page.check(xpathToggle);
    }
  }
  /**
   * click to change status of Test mode toggle on provider screen
   */
  async changeStatusTestMode() {
    await this.page.click(this.xpathToggleTestMode);
  }

  /**
   * click to button select a plan on test mode alert
   */
  async clickSelectPlanTestMode() {
    await this.page.click("//div[contains(@class, 'sb-alert__danger')]");
    await this.page.click("//button[normalize-space() = 'Select a plan']");
  }
}
