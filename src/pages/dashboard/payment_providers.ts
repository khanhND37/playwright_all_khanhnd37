import { SBPage } from "@pages/page";
import type {
  InfoAsiaBill,
  InfoUnlimint,
  PaypalManager,
  SecurePayment,
  StripeAccount,
  ManualPaymentSetting,
  Braintree,
} from "@types";
import { APIRequestContext } from "@playwright/test";

export class PaymentProviderPage extends SBPage {
  getLocatorAccountName(accountName: string): string {
    return `//*[contains(@class,'card payment_setting')]//*[contains(text(),'${accountName}')]//preceding::span[1]`;
  }

  buttonSwitchSbasePayment = "//button[child::span[normalize-space()='Switch to ShopBase Payments']]";
  xpathRiskLevel = "//p[text()='Risk level']//following-sibling::p[@class='text-uppercase']";
  xpathBlockSpay = "//div[@role='button' and contains(@id, 's-collapse-head')]//span[contains(@class, 's-icon')]";
  xpathViewDetailsRiskLevel = "//p[normalize-space() = 'View details']";
  xpathRiskLevelInPopup = "//div[@class='text-bold text-center user-risk-level__current__info__level__value']";
  xpathDisputeRate = "//div[normalize-space() = '90 days dispute rate:']//following-sibling::div";
  xpathFulfillmentPerformance = "//div[normalize-space() = 'Fulfillment performance:']//following-sibling::div";
  xpathShippingPerformance = "//div[normalize-space() = 'Shipping performance:']//following-sibling::div";
  xpathLearnMore =
    "//a[@class = 'user-risk-level__current__info__level__learn-more' and normalize-space() = 'Learn more']";
  xpathExpandRiskLevel = "//div[@class = 'timeline-list__item__node__icon-collapse']//span[contains(@class, 's-icon')]";

  /*
   * Click to active paypal gateway in test mode.
   */
  async setTestModeToggle() {
    const xpathCheckbox = this.page.locator(`//*[text()[normalize-space()='Test mode']]/following-sibling::label/span`);
    await xpathCheckbox.click();
  }

  /*
   * Enter API key to activate paypal gateway.
   * @param accountName
   * @param clientID
   * @param secretKey
   */
  async enterAPIKey(accountName: string, clientID: string, secretKey: string) {
    const xpathAccountName = this.page.locator(
      `//div[contains(@class,'s-form-item')][descendant::*[contains(text(),'Account Name')]]//input`,
    );
    const xpathClientId = this.page.locator(
      `//div[contains(@class,'s-form-item')][descendant::*[contains(text(),'Client ID')]]//input`,
    );
    const xpathSecretKey = this.page.locator(
      `//div[contains(@class,'s-form-item')][descendant::*[contains(text(),'Client Secret Key')]]//input`,
    );
    await xpathAccountName.fill(accountName);
    await xpathClientId.fill(clientID);
    await xpathSecretKey.fill(secretKey);
  }

  /*
   * get notice message
   * @param message
   */
  async waitForNoticeMessage(message: string) {
    return this.page.waitForSelector(`//*[contains(text(),'${message}')]`);
  }

  /*
   * get account status
   * @param accountName account name
   */
  async getStatusOfAccount(accountName: string) {
    const xpathAccountStatus = this.page.locator(
      `//*[contains(@class,'card payment_setting')]//*[contains(text(),'${accountName}')]//preceding::span[1]`,
    );
    return await xpathAccountStatus.getAttribute("data-label");
  }

  /*
   * Click to expand payment gateway editing form.
   * It will choose a locator corresponding to the input account's name and then click to it.
   * @param accountName specify an account to open editing form
   */
  async expandGatewayEditingForm(accountName: string) {
    await this.page
      .locator(`//*[contains(@class,'card payment_setting')]//*[contains(text(),'${accountName}')]//preceding::span[1]`)
      .click();
  }

  async clickOnActiveGatewayByAPIKey() {
    await this.page.locator(`(//*[normalize-space()='Activate with API key'])[2]`).click();
  }

  /*
   * get account block by gateway
   * @param gateway
   * @param accountName account name
   */
  async getAccByGateway(gateway: string, accountName: string) {
    return this.page.locator(
      `//*[contains(@class,'card__header')][descendant::*[contains(text(),'${gateway}')]]` +
        `/following::section//strong[normalize-space()='${accountName}']`,
    );
  }

  /*
   * Click to deactive payment gateway.
   * It will choose a locator corresponding to the input account's name and then click to it.
   * @param accountName
   */
  async clickOnDeactivateByAccount(accountName: string) {
    await this.page
      .locator(
        `//*[text()[normalize-space()='${accountName}']]` +
          `//ancestor::div[contains(@class,'s-collapse-item')]//*[contains(text(),'Deactivate')]`,
      )
      .click();
    await this.waitForNoticeMessage(`Deactivated successfully`);
  }

  /*
   * Click to re-active payment gateway when payment gateway is deactivated.
   * It will choose a locator corresponding to the input account's name and then click to it.
   * @param accountName
   */
  async clickOnReactivateByAccount(accountName: string) {
    await this.page
      .locator(
        `//*[text()[normalize-space()='${accountName}']]` +
          `//ancestor::div[contains(@class,'s-collapse-item')]//*[contains(text(),'Activate')]`,
      )
      .click();
    await this.waitForNoticeMessage(`Activated successfully`);
  }

  /*
   * Remove account in payment providers page. It will open remove confirmation popup
   * @param accountName
   */
  async clickOnRemoveAccount(accountName: string) {
    const xpathRemoveAccount = this.page.locator(
      `//*[text()[normalize-space()='${accountName}']]
      //ancestor::div[contains(@class,'s-collapse-item')]
      //*[contains(text(),'Remove account')]`,
    );
    const xpathConfirmPopup = `//*[text()[normalize-space()='Remove this account?']]`;
    await xpathRemoveAccount.click();
    await this.waitUntilElementVisible(xpathConfirmPopup);
    await this.clickOnBtnWithLabel(`Cancel`);
    await xpathRemoveAccount.click();
    await this.clickOnBtnWithLabel(`Remove`);
    await this.waitForNoticeMessage(`Delete successfully`);
  }

  /*
   * activate paypal gateway by API key. It will open add account paypal form
   * @param accountName
   * @param clientID
   * @param secretKey
   */
  async activePaypalGatewayByKey(accountName: string, clientID: string, secretKey: string) {
    await this.clickOnActiveGatewayByAPIKey();
    await this.setTestModeToggle();
    await this.enterAPIKey(accountName, clientID, secretKey);
    await this.clickOnBtnWithLabel("+ Add account");
    await this.waitForNoticeMessage("Activated successfully");
  }

  /*
   * activate paypal pcp gateway. It will open popup to sign in paypal account
   */
  async activatePayPalPCPGateway() {
    await this.page.locator(`//*[contains(text(),'Sign in/Sign up with PayPal')]`).click();
    await this.clickOnBtnWithLabel(`Sign in/Sign up with PayPal`);
    await this.page.locator(`//div[@class='message']//a[normalize-space()='Continue']`).click();
  }

  /*
   * input paypal pcp account. start with fill email address form
   * continue to input password and click login
   * choose option go back to return to payment-providers page
   */
  async enterPCPAccount(paypalAccount) {
    await this.page.locator(`//input[@placeholder='Email address']`).fill(paypalAccount.username);
    await this.clickOnBtnWithLabel(`Next`);
    await this.page
      .locator(`//*[@id='login' or @id='passwordSection']//input[@id='email']`)
      .fill(paypalAccount.username);
    await this.page.locator(`//*[@id='btnNext']`).click();
    await this.page
      .locator(`//*[@id='login' or @id='passwordSection']//input[@id='password']`)
      .fill(paypalAccount.password);
    await this.page
      .locator(`//*[text()[normalize-space()='Log In'] or @class='btn full ng-binding' or @id='btnLogin']`)
      .click();
    await this.page.locator(`//*[contains(@class,'button') and contains(text(),'go back to')]`).click();
  }

  async getStatusByAccountName(accountName: string) {
    return await this.genLoc(
      `(//strong[normalize-space()='${accountName}']
      /preceding::span[contains(@class, 'is-medium is-black is-top is-black s-tooltip')])[last()]`,
    ).getAttribute("data-label");
  }

  /**
   * waiting until account name's gateway is visible or invisible
   * @param accountName
   * @param isDisplayed
   */
  async waitForAccountNameDisplayed(accountName: string, isDisplayed: boolean) {
    if (isDisplayed)
      await this.page.waitForSelector(
        `(//*[@class='s-collapse-item provider-collapse']//strong[normalize-space()='${accountName}'])[1]`,
        { state: "visible" },
      );
    else
      await this.page.waitForSelector(
        `(//*[@class='s-collapse-item provider-collapse']//strong[normalize-space()='${accountName}'])[1]`,
        { state: "hidden" },
      );
  }

  /**
   * select specific gateway in third party provider block includes:
   * Stripe, Paypal Pro, Braintree, Unlimint, Checkout.com
   * @param gateway
   */
  async selectThirdPartyProvider(gateway: string) {
    await this.genLoc("//button//span[normalize-space()='Choose third-party provider']").click();
    await this.genLoc(
      `//table[@class='s-table table-custom table-hover']//span[normalize-space()='${gateway}']`,
    ).click();
    await this.page.waitForSelector("(//div[normalize-space()='Third-party payment providers'])[1]");
  }

  /**
   * active Stripe gateway by API key
   * @param stripeAccount
   * @param accountName
   */
  async activatingStripeGateway(stripeAccount: StripeAccount, accountName?: string) {
    await this.selectThirdPartyProvider("Stripe");
    await this.clickOnCheckboxWithLabel("Use API Keys to connect");
    await this.inputTextBoxWithLabel("* Account Name", accountName);
    await this.enterStripeAccount(stripeAccount);
    await this.clickOnBtnWithLabel("+ Add account");
  }

  async enterStripeAccount(stripeAccount: StripeAccount) {
    await this.inputTextBoxWithLabel("* Public Key", stripeAccount.public_key);
    await this.inputTextBoxWithLabel("* Secret Key", stripeAccount.private_key);
  }

  async saveAccountSetting(accountName: string) {
    await this.genLoc(
      `(//strong[normalize-space()='${accountName}']/following::button[normalize-space()='Save'])[1]`,
    ).click();
  }

  async deactivateAccountSetting(accountName: string) {
    await this.genLoc(
      `(//strong[normalize-space()='${accountName}']/following::button[normalize-space()='Deactivate'])[1]`,
    ).click();
  }

  async removeAccountSetting(accountName: string) {
    await this.genLoc(
      `(//strong[normalize-space()='${accountName}']/following::a[normalize-space()='Remove account'])[1]`,
    ).click();
    await this.clickOnBtnWithLabel("Remove");
  }
  async isErrorMessageDisplayed(fieldName: string, message: string): Promise<boolean> {
    return await this.genLoc(
      `(//label[normalize-space()='${fieldName}']
      /following::div[@class= 's-form-item__error' and normalize-space()='${message}'])[1]`,
    ).isVisible();
  }

  /**
   * get all available accounts then remove them
   * @param gateway
   * @param request
   */
  async removeAllAccountByAPI(gateway: "stripe" | "paypal" | "asia-bill", request?: APIRequestContext) {
    const res = await request.get(`https://${this.domain}/admin/payments.json`);
    const accountList = (await res.json()).payment_methods;

    accountList.forEach(async element => {
      if (element.code === gateway) {
        const paymentId = element.id;
        await request.delete(`https://${this.domain}/admin/payments/${paymentId}.json`, {
          data: {
            id: paymentId,
          },
        });
      }
    });
  }

  /**
   * Thêm mới paypal pro
   * @param accountName
   * @param paypalManager
   */
  async infoAccountPaypalPro(accountName: string, paypalManager: PaypalManager) {
    await this.page.click(`//span[normalize-space()='Choose third-party provider']`);
    await this.page.click(`//span[normalize-space()='PayPal Pro']`);

    await this.page.click(`//div[@class='s-popover__reference']//span[@class='s-check']`);
    await this.page.fill(`input[type='text']`, accountName);
    await this.page.fill(
      `//label[normalize-space()='* PayPal Manager Partner']/../following-sibling::div/descendant::input`,
      paypalManager.partner,
    );
    await this.page.fill(
      `//label[normalize-space()='* PayPal Manager Vendor']/../following-sibling::div/descendant::input`,
      paypalManager.vendor,
    );
    await this.page.fill(
      `//label[normalize-space()='* PayPal Manager User']/../following-sibling::div/descendant::input`,
      paypalManager.user,
    );
    await this.page.fill(
      `//label[normalize-space()='* PayPal Manager Password']/../following-sibling::div/descendant::input`,
      paypalManager.password,
    );
  }

  /**
   * Nhập thông tin 3D Secure Payment
   * @param securePayment
   */
  async on3DSecurePayment(securePayment: SecurePayment) {
    await this.page.click(`//span[contains(text(),'3D secure payment')]/following-sibling::label/descendant::span`);
    await this.page.waitForSelector(
      `//label[contains(text(),'* Cardinal API ID')]/../following-sibling::div/descendant::input`,
    );
    await this.page.fill(
      `//label[contains(text(),'* Cardinal API ID')]/../following-sibling::div/descendant::input`,
      securePayment.cardinal_id,
    );
    await this.page.fill(
      `//label[contains(text(),'* Cardinal API Key')]/../following-sibling::div/descendant::input`,
      securePayment.cardinal_key,
    );
    await this.page.fill(
      `//label[contains(text(),'* Cardinal Org Unit ID')]/../following-sibling::div/descendant::input`,
      securePayment.cardinal_org_unit_id,
    );
  }

  /**
   * Nhập thông tin để edit account paypal pro
   * @param accountName
   * @param paypalManager
   */
  async editAccountPaypalPro(accountName: string, paypalManager: PaypalManager) {
    await this.page.fill(
      `(//label[normalize-space()='* PayPal Manager Partner']/../following-sibling::div/descendant::input)[1]`,
      paypalManager.partner,
    );
    await this.page.fill(
      `(//label[normalize-space()='* PayPal Manager Vendor']/../following-sibling::div/descendant::input)[1]`,
      paypalManager.vendor,
    );
    await this.page.fill(
      `(//label[normalize-space()='* PayPal Manager User']/../following-sibling::div/descendant::input)[1]`,
      paypalManager.user,
    );
    await this.page.fill(
      `(//label[normalize-space()='* PayPal Manager Password']/../following-sibling::div/descendant::input)[1]`,
      paypalManager.password,
    );
    await this.page.click(
      `//strong[normalize-space()='${accountName}']` +
        `/ancestor::div[@role='tab']/following-sibling::div/descendant::span[contains(text(),'Save')]`,
    );
  }

  /**
   * Merchant đăng kí cổng thanh toán Unlimint
   * @param accountName: Tên account unlimint
   * @param inforUnlimint: Thông tin đăng kí gồm terminal code,terminal password,callback secret
   */
  async inputInfoUnlimint(accountName: string, infoUnlimint: InfoUnlimint) {
    await this.page.click(`//span[normalize-space()='Choose third-party provider']`);
    await this.page.click(`//span[normalize-space()='Unlimint']`);
    await this.page.click(`//div[@class='s-popover__reference']//span[@class='s-check']`);
    await this.page.fill(
      `//div[contains(@class,'s-form-item is-required') and child::*//span[contains(text(),'Account Name')]]//input`,
      accountName,
    );

    await this.page.fill(
      `//div[contains(@class,'s-form-item is-required') and child::*//label[contains(text(),'Terminal Code')]]//input`,
      infoUnlimint.terminal_code,
    );
    await this.page.fill(
      `//div[contains(@class,'s-form-item is-required') and child::*//label[contains(text(),'Terminal Password')]]//input`,
      infoUnlimint.terminal_pass,
    );
    await this.page.fill(
      `//div[contains(@class,'s-form-item is-required') and child::*//label[contains(text(),'Callback Secret')]]//input`,
      infoUnlimint.callback_secret,
    );
  }

  /**
   * Allow to hide or show card holder name when checkout via Stripe/Shopbase payment
   * @param paymentMethod
   * @param isEnable true <=> hide, false <=> show
   * @returns
   */
  async settingHideCardholderName(paymentMethod: string, isEnable = true) {
    const xpathHideCardStripe = this.page.locator(
      `//span[following-sibling::span[contains(text(),'Hide cardholder name when buyer checkout')]]`,
    );
    const xpathHideCardSpay = this.page.locator(
      `//label[preceding-sibling::p[contains(text(),'Hide cardholder name when buyer checkout')]]//span[1]`,
    );
    switch (paymentMethod) {
      case "Stripe":
        if (
          ((await xpathHideCardStripe.isChecked()) === true && isEnable === true) ||
          ((await xpathHideCardStripe.isChecked()) === false && isEnable === false)
        ) {
          return;
        }
        await xpathHideCardStripe.click();
        await this.page.locator(`(//section[@class='card payment_setting m s-mt10'])[1]//button`).click();
        await this.page.waitForSelector(`(//div[normalize-space()='All changes were successfully saved'])[3]`);
        break;
      case "Shopbase payment":
        await this.page.click(
          `//div[@class='s-flex-item s-flex m-r-sm']//span[@class='s-icon s-collapse-item__arrow is-small']`,
        );
        if (
          ((await xpathHideCardSpay.isChecked()) === true && isEnable === true) ||
          ((await xpathHideCardSpay.isChecked()) === false && isEnable === false)
        ) {
          return;
        }
        await xpathHideCardSpay.click();
        await this.page.waitForSelector(`(//div[normalize-space()='Saved successfully'])[3]`);
        break;
    }
  }

  /**
   * Additional account payment method AsiaBill
   * @param accountName
   * @param infoAsiaBill
   */
  async infoAccountAsiaBill(accountName: string, infoAsiaBill: InfoAsiaBill) {
    await this.page
      .locator(
        `//div[normalize-space()='Custom methods']/ancestor::div[@class='sb-column-layout']//span[normalize-space()='Add account']`,
      )
      .click();
    await this.page.locator(`//span[normalize-space()='AsiaBill']`).click();
    await this.page.fill(`input[type='text']`, accountName);
    await this.page.fill(
      `//label[normalize-space()='* Merchant No']/../following-sibling::div/descendant::input`,
      infoAsiaBill.merchant_no,
    );
    await this.page.fill(
      `//label[normalize-space()='* Gateway No']/../following-sibling::div/descendant::input`,
      infoAsiaBill.gateway_no,
    );
    await this.page.fill(
      `//label[normalize-space()='* Sign key']/../following-sibling::div/descendant::input`,
      infoAsiaBill.sign_key,
    );
    //bật testmode
    await this.genLoc(`//span[contains(@class, 'sb-switch__switch')]`).click();
  }

  /**
   * Activate manual payment method with new ui
   * @param manualPaymentSetting All information of payment gateway when activated
   */
  async activateManualPaymentMethod(manualPaymentSetting: ManualPaymentSetting) {
    await this.genLoc(
      `//span[contains(normalize-space(),'${manualPaymentSetting.payment_type}')]/parent::div/following-sibling::div//div//label`,
    ).click();
    await this.genLoc(
      `//span[contains(normalize-space(),'${manualPaymentSetting.payment_type}')]/parent::div/following-sibling::div//a`,
    ).click();
    //input additional details
    if (manualPaymentSetting.additional) {
      await this.inputValueToAdditionalDetail(manualPaymentSetting.additional);
    }
    if (manualPaymentSetting.payment_type === "COD") {
      //Add extra fee
      if (manualPaymentSetting.is_extra_fee) {
        await this.page.click(
          `//label[@class='sb-radio']//span[normalize-space()='Add extra fee for Cash on Delivery']`,
        );
        //Choose extra fee type
        await this.page.locator(`(//div[contains(@class, "sb-form-item__content")])[1]`).click();
        await this.page.locator(`//label[normalize-space()='${manualPaymentSetting.extra_fee_type}']`).click();
        //Input extra fee value
        await this.page.click(
          `//label[normalize-space()='Value']//ancestor::div[contains(@class, 'sb-form-item')]//input`,
        );
        await this.page
          .locator(`//label[normalize-space()='Value']//ancestor::div[contains(@class, 'sb-form-item')]//input`)
          .fill(manualPaymentSetting.extra_fee_value.toString());
        //Enter extra fee name
        if (manualPaymentSetting.extra_fee_name) {
          await this.page.click(
            `//label[normalize-space()='Display name']//ancestor::div[contains(@class, 'sb-form-item')]//input`,
          );
          await this.page
            .locator(
              `//label[normalize-space()='Display name']//ancestor::div[contains(@class, 'sb-form-item')]//input`,
            )
            .fill(manualPaymentSetting.extra_fee_name);
        }
      } else {
        await this.page.click(
          `//label[@class='sb-radio']//span[normalize-space()='No extra fee with Cash on Delivery']`,
        );
      }
    }

    await this.genLoc(`//button//span[normalize-space()='Save']`).click();
  }

  //Verify COD method activate or not
  async isManualPaymentMethodActivated(method: string): Promise<boolean> {
    await this.page.waitForSelector(
      "//p[normalize-space()='Allow customers to place orders using payment methods outside your online store.']",
    );
    return await this.page
      .locator(`//section[contains(@class, 'activated-cod')]//h2[contains(text(), '${method}')]`)
      .isVisible();
  }

  //Verify COD method activate or not with new ui
  async isManualPaymentMethodActivatedNew(method: "COD" | "Bank Transfer"): Promise<boolean> {
    await this.page.waitForSelector("//div[normalize-space()='Manual payment methods']");
    return await this.page
      .locator(`//div[child::span[contains(text(),'${method}')]]//following-sibling::div//label`)
      .isChecked();
  }

  //back from setting payment manual method page to payment provider
  async backFromSettingToPaymentProvider() {
    await this.genLoc('//button[contains(@class, "sb-btn-back")]').click();
  }

  /**
   * Active Manual Payment method that you want on Payment Providers page
   * @param method manual payment method
   */
  async activateManualPayMethods(method: string) {
    const xpathDropdown = `//span[normalize-space()='Manual payment methods']//ancestor::button`;
    await this.page.waitForSelector(xpathDropdown);
    await this.page.click(xpathDropdown);
    await this.page.click(`//div[@class='s-dropdown-content']//span[contains(normalize-space(),'${method}')]`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Check active manual payment medthod
   */
  async isActiveManualPaymentMethod(method: string): Promise<boolean> {
    await this.waitUntilElementVisible(
      "//p[normalize-space()='Allow customers to place orders using payment methods outside your online store. You will need to approve of orders paid manually before fulfilling.']",
    );
    await this.page.waitForSelector(`(//div[normalize-space()='${method}'])[1]//ancestor::div[@class='row']`);
    if (
      await this.page
        .locator(
          `(//div[normalize-space()='${method}'])[1]//ancestor::div[@class='row']//label[contains(@class,'active')]`,
        )
        .isVisible()
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Delete all manual payment method
   */
  async deleteAllManualMethod() {
    const xpathRemoveAccount = `(//h2[normalize-space()='Manual payment methods']//ancestor::div[@class='row']//span[@class='remove-account-link'])[1]`;
    while (await this.isElementExisted(xpathRemoveAccount)) {
      await this.page.click(xpathRemoveAccount);
      await this.page.waitForSelector(
        `//div[contains(@class, 's-toast')]//div[normalize-space()='Deactivated successfully']`,
      );
    }
  }

  /**
   * Deactivate manual payment method at payment provider
   */
  async deactivateManualPaymentMethod(method: "COD" | "Bank Transfer") {
    this.page.locator(`//div[child::span[contains(text(),'${method}')]]//following-sibling::div//label`).click();
  }

  /**
   * Click on button edit a Manual Payment method
   * @param method manual payment method COD or Bank Transfer
   */
  async clickEditManualPaymentMethod(method: string) {
    const xpath = `//h2[contains(text(), '${method}')]//ancestor::section//button//span[normalize-space()='Edit']`;
    await this.page.waitForSelector(xpath);
    await this.page.click(xpath);
  }

  /**
   * Input Value to Assitional detail iframe, include multiple line
   * @param additional string array, each element is line of additional information
   */
  async inputValueToAdditionalDetail(additional: Array<string>) {
    //Wait for load the current content (because box tiny-vue)
    await this.page.waitForTimeout(2000);
    const xpath = "//body[contains(@class,'content-body')]";
    const iframe1 = this.page.frameLocator("//iframe[contains(@id,'tiny-vue')]").locator(xpath);
    await this.clearTextBoxContent(iframe1);
    for (const i of additional) {
      await iframe1.type(i);
      await iframe1.press("Enter");
    }
  }

  /**
   * Enter config key Braintree
   */

  async enterBraintreeAccount(braintreeAccount: Braintree) {
    await this.inputTextBoxWithLabel("* Merchant ID", braintreeAccount.merchant_id);
    await this.inputTextBoxWithLabel("* Public Key", braintreeAccount.public_key);
    await this.inputTextBoxWithLabel("* Private Key", braintreeAccount.private_key);
  }

  /**
   * Click first payment account activated
   *
   */

  async clickFirstAndDeleteAccountPayment(account: string) {
    const firstAccountLoc = `(//div[contains(@class,'provider-collapse')][child::div//div[strong[contains(text(), '${account}')]]])[1]`;
    await this.genLoc(firstAccountLoc).click();
    const activeClass = await (await this.page.locator(firstAccountLoc).getAttribute("class")).includes("is-active");
    if (activeClass) {
      const removeLoc = `${firstAccountLoc}//div[@role='tabpanel']//a[normalize-space()='Remove account']`;
      await this.page.waitForSelector(removeLoc, { timeout: 30000 });
      await this.genLoc(removeLoc).click();
      await this.page.waitForSelector("//footer[@class='s-modal-card-foot']//button[normalize-space()='Remove']");
      await this.genLoc("//footer[@class='s-modal-card-foot']//button[normalize-space()='Remove']").click();
    }
  }

  async clickFirstAndDeActivateAccountPayment(account: string) {
    const firstAccountLoc = `(//div[contains(@class,'provider-collapse')][child::div//div[strong[contains(text(), '${account}')]]])[1]`;
    await this.genLoc(firstAccountLoc).click();
    const activeClass = await this.page.locator(firstAccountLoc).getAttribute("class");
    if (activeClass.includes("is-active")) {
      const removeLoc = `${firstAccountLoc}//div[@role='tabpanel']//button[child::span[normalize-space()='Deactivate']]`;
      await this.page.waitForSelector(removeLoc, { timeout: 30000 });
      await this.genLoc(removeLoc).click();
    }
  }

  /**
   * Go to page payment provider
   */

  async goToPagePaymentProvider() {
    await this.page.goto(`https://${this.domain}/admin/settings/payments`);
    await this.page.waitForLoadState("networkidle");
  }

  async swichToShopbasePayment() {
    const buttonSwitchSbasePayment = "//button[child::span[normalize-space()='Switch to ShopBase Payments']]";
    await this.page.waitForSelector(buttonSwitchSbasePayment, { timeout: 1500 });
    await this.page.locator(buttonSwitchSbasePayment).click();
  }

  async clickAddAccountBtn() {
    await this.page.click("//button[span[contains(normalize-space(), 'Add account')]]", { timeout: 2000 });
  }

  // Get dispute rate on ShopBase Payment block, show to view is unnecessary
  async getDisputeRate(): Promise<number> {
    await this.page.waitForSelector("//section[@id='shopbase-payment-method']");
    const disputeRate = await this.getTextContent(
      "(//div[@class='s-flex-item' and child::p[normalize-space() = 'Dispute rate']]/p)[2]",
    );
    return parseFloat(disputeRate);
  }
  //Cick to show detail Shopbase Payment
  async clickToShowShopBasePaymentDetail() {
    await this.page.click("//div[@class='s-flex-item s-flex--fill' and 'Your ShopBase Payments account statuses:']");
  }

  /**
   * Delete account AsiaBill at Payment provider
   * @param accountName: name's account that you want to delete
   */
  async deleteAsiaBillAcc(accountName: string): Promise<void> {
    await this.page.click(
      `//span[normalize-space()='${accountName}']/ancestor::a/following-sibling::div//span[contains(@class,'sb-icon')]`,
    );
    await this.page.click(`//button[normalize-space()='Delete']`);
    await this.page.click(`//button[contains(@class,'sb-popup__footer-button')]//span[normalize-space()='Delete']`);
  }

  /**
   * Click switch toogle to activate or deactivate custom method account
   * @param accountName: account name
   */
  async clickToogle(accountName: string): Promise<void> {
    await this.page.click(
      `//span[normalize-space()='${accountName}']/ancestor::a/following-sibling::div//span[contains(@class,'sb-switch__switch')]`,
    );
  }
}
