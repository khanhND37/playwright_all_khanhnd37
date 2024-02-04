import { removeCurrencySymbol } from "@core/utils/string";
import { SFCheckout } from "@pages/storefront/checkout";
import { Locator, Page } from "@playwright/test";
import type { Card, PaypalAccount, PaypalCard } from "@types";

export class CheckoutForm extends SFCheckout {
  xpathAcceptTerms = "(//div[contains(@class, 'accept-term')]//span)[1]";
  xpathBtnPayNow = "//button[normalize-space()='Pay now']";
  xpathTextThankYou = "//p[normalize-space()='Thank you!']";
  xpathOrderName = "//span[@value='order.name']";
  xpathBtnBackToMyProducts = "//button[normalize-space()='Back to My Products']";
  xpathBackToMyProducts = "//span[normalize-space()='Back to My Products']";
  xpathPaymentMethodCreator = "//ul[@class='payment-method-list']//span";
  xpathApplyDiscountCode = "//button[normalize-space()='Apply']";
  xpathDiscountAmount = "(//div[@class='price-detail']//div[contains(@class,'discount')]//p)[2]";
  xpathTotalPrice = "(//div[contains(@class,'total-price')]//p)[2]";
  xpathSubtotalThankYouPage = "(//td[normalize-space()='Subtotal']//following::span)[1]";
  xpathDiscountThankYouPage = "//span[text()='Discount']//following::span[@class='order-summary__emphasis']";
  xpathTotalPriceThankYouPage = "(//td[normalize-space()='Total:']//following::span)[1]";
  xpathTitle = "//p[contains(@class, 'heading text-align-center')]";
  xpathNewPassword = "//input[@placeholder='Your password']";
  xpathConfirmPassword = "//input[@placeholder='Your confirm password']";
  xpathButtonSubmit = "//button[@type='submit']";
  xpathLinkToTermsofServices = "//a[normalize-space()='Terms of Services']";
  xpathLinkToPrivacyPolicy = "//a[normalize-space()='Privacy Policy']";
  xpathPaynowLabelWebfront = "//button[contains(@class, 'paynow btn-primary')]//span";
  xpathCheckoutForm = "//section[@component='checkout_form']";
  xpathBtnLoading = "//button//span[@class='loading-spinner d-block']";
  xpathBtnAccectProdUpsell = "//div[contains(@class,'variant-form__container')]//button//span";
  xpathLearnMore = "//a[contains(text(),'Learn how to place a test order.')";
  xpathLink = "contains(@href, 'setup-checkout-process-on-shopbase')]";
  xpathCreateAccount = "//button[normalize-space() = 'Create my account']";
  xpathLearnMoreLinkText =
    "//a[contains(text(),'Learn more.') and contains(@href, 'setup-checkout-process-on-shopbase')]";
  xpathAlertTestMode = "//p[contains(text(),'You are in test mode. No live charge can be made.')]";
  xpathInputEmail = "//input[@placeholder = 'Your email address']";
  stripCardNumber = "//div[@id='stripe-card-number']";
  xpathFieldCardNumber = '[placeholder="Card number"]';
  xpathFiledDateMonth = '[placeholder="MM / YY"]';
  xpathFieldCVV = '[placeholder="CVV"]';
  xpathAlertNonTestCard =
    "//p[normalize-space() = 'Your card was declined. Your request was in test mode, but used a non test (live) card. For a list of valid test cards, visit: https://stripe.com/docs/testing.']";
  iframeCard = this.page.frameLocator("#stripe-frame-form-wrapper");

  defaultCardInfo: Card = {
    number: "4242424242424242",
    expire_date: "02/29",
    cvv: "100",
  };

  defaultPaypalAccount: PaypalAccount = {
    username: "buyer@shopbase.com",
    password: "2XfWH9Ae",
  };

  defaultPaypalCard: PaypalCard = {
    number: "5583388429767422",
    expires_date: "02/29",
    csc: "290",
  };

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathThankYouPageHeader = "//p[normalize-space() = 'Thank you!']";
  xpathPayNowButton = "//button[normalize-space()='Pay now']";

  xpathTaxLine = `//p[normalize-space()='Tax']//following-sibling::p`;

  getLocatorProductCheckout(productName: string) {
    return this.genLoc(
      `//tr[@class='checkout-product']//span[@class='checkout-product__name'][normalize-space()='${productName}']`,
    );
  }

  /** Select then complete order with different payment method
   * @param paymentMethod: payment method of checkout, default = "Stripe"
   * @param cardInfo: card information, default with card "4242 4242 4242 4242"
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async completeOrderWithMethod(payment?: string, cardInfo: Card = this.defaultCardInfo): Promise<any> {
    let paymentLoc: string;
    switch (payment) {
      case "Stripe":
        await this.completeOrderWithCardInfo(cardInfo);
        break;
      case "PayPal":
        paymentLoc = "//input[@value='paypal-express']/following-sibling::span[1]";
        await this.page.locator(paymentLoc).click();
        break;
    }
  }

  /**
   * Input card info to Stripe info on checkout form
   * @param card is info of Stripe card test
   */
  async completeOrderWithCardInfo(card: Card = this.defaultCardInfo) {
    await this.page.waitForSelector("//p[normalize-space()='Card information']");
    await this.enterCardNumber(card.number);
    await this.enterExpireDate(card.expire_date);
    await this.enterCVV(card.cvv);
    await this.clickBtnCompleteOrder();
  }

  /**
   * input email for check out form to checkout
   * @param email is available from config
   */
  async enterEmail(email: string) {
    await this.page.fill("//input[@placeholder = 'Your email address']", email);
  }
  /**
   * input card number on checkout form
   * @param cardNumber is card number of Stripe card test
   */
  async enterCardNumber(cardNumber: string) {
    await this.page.frameLocator("#stripe-frame-form-wrapper").locator('[placeholder="Card number"]').fill(cardNumber);
  }

  /**
   * input expire date for Stripe card on checkout form
   * @param expireDate is expire date of Stripe card test
   */
  async enterExpireDate(expireDate: string) {
    await this.page.frameLocator("#stripe-frame-form-wrapper").locator('[placeholder="MM / YY"]').fill(expireDate);
  }

  /**
   * input cvv for Stripe card on checkout form
   * @param cvv
   */
  async enterCVV(cvv: string) {
    await this.page.frameLocator("#stripe-frame-form-wrapper").locator('[placeholder="CVV"]').fill(cvv);
  }

  /**
   * Click button Pay now to complete order
   */
  async clickBtnCompleteOrder() {
    await this.page.waitForSelector(this.xpathPayNowButton);
    await this.page.locator(this.xpathPayNowButton).click();
  }

  /**
   * Click on Order summary area to display the validation notification
   */
  async clickOnOrderSummary() {
    await this.page.click("//div[@class = 'order-summary my32']");
  }

  /**
   * Get msg validate card expire date and card cvv on script node element
   * @param typeMsg input "expire date" to get error msg for card expire, else get error message for card cvv
   * @returns
   */
  async getMsgFromRootXpath(typeMsg: string) {
    const contentMsg = await this.page.locator("#__INITIAL_STATE__").textContent();
    const jsonContent = JSON.parse(contentMsg);
    let msg: string;
    switch (typeMsg) {
      case "card expiry":
        msg = jsonContent.shop.locale.content.checkout_form.errors_messages.card_incomplete_expiry;
        break;
      case "card expiry month past":
        msg = jsonContent.shop.locale.content.checkout_form.errors_messages.card_invalid_expiry_month_past;
        break;
      case "card invalid cvc":
        msg = jsonContent.shop.locale.content.checkout_form.errors_messages.card_invalid_cvc;
        break;
      case "card cvc":
        msg = jsonContent.shop.locale.content.checkout_form.errors_messages.card_incomplete_cvc;
        break;
    }
    return msg;
  }

  /**
   * accept or reject product upsell downsell after checkout
   * @param acceptOrRejectProduct
   */
  async acceptOrRejectProdUpsell(acceptOrRejectProduct: boolean) {
    if (acceptOrRejectProduct) {
      await this.page.click("//div//button[@class='px32 py12 btn-primary w-100']");
    } else {
      await this.page.click("//div//p[contains(@class,'reject-offer')]");
    }
  }

  /**
   * Click button Pay now to complete order
   */
  async clickCheckboxAcceptTerm() {
    const xpathTermOfService = "(//div[contains(@class, 'accept-term')]//span)[1]";
    await this.page.locator(xpathTermOfService).click();
  }

  /**
   * Click button Create account to create a new account
   */
  async clickBtnCreateAccount() {
    const xpathTermOfService = `//button[normalize-space()= "Create my account"]`;
    await this.page.locator(xpathTermOfService).click();
  }

  /**
   * Fill value for input field to create account
   */
  async createAccount(password: string) {
    await this.inputFieldWithLabel("", "Your password", password, 1);
    await this.inputFieldWithLabel("", "Your confirm password", password, 1);
    await this.page.locator(`//button[normalize-space()='Create account']`).click();
  }

  /**
   * thực hiện checkout product và có setting upsell offer hoặc không
   * @param handle là handle của product gốc cần checkout
   * @param email là email để check out product tại form checkout
   * @param acceptOrReject là action thực hiện accept hoặc reject product upsell
   */
  async checkoutProductHaveUpsell(handle: string, email: string, card: Card, acceptOrReject?: boolean) {
    await this.goto(`products/${handle}`);
    await this.page.reload();
    await this.enterEmail(email);
    await this.enterCardNumber(card.number);
    await this.enterExpireDate(card.expire_date);
    await this.enterCVV(card.cvv);
    await this.clickBtnCompleteOrder();
    if (acceptOrReject) {
      await this.acceptOrRejectProdUpsell(acceptOrReject);
    }
  }

  /**
   * Click button Access my content in thank you page to access my content page
   */
  async clickBtnAccessMyContent() {
    const xpathTermOfService = `//button[normalize-space()= "Access to my content"]`;
    await this.page.locator(xpathTermOfService).click();
  }

  /**
   * Click Apply a coupon in sale page
   */
  async applyDiscountCode(code: string) {
    await this.inputFieldWithLabel("", "Discount code", code, 1);
    await (await this.page.waitForSelector(this.xpathApplyDiscountCode)).isEnabled();
    await this.page.click(`//button[normalize-space()='Apply']`);
  }

  /**
   * Fill value for input field to create account creator
   */
  async createAccountCreator(password: string) {
    await this.inputFieldWithLabel("", "New password", password, 1);
    await this.inputFieldWithLabel("", "Confirm password", password, 1);
    await this.page.locator(`//button[normalize-space()='Create account']`).click();
  }

  getXpathMsgValidateEmail(msg: string): Locator {
    return this.genLoc(`//div[@msg-invalid = 'required' and normalize-space() = '${msg}']`);
  }

  async getOrderName(): Promise<string> {
    const orderName = await this.getTextContent(`//span[@value='order.name']`);
    const arrOrder = orderName.split(" ");
    const orderID = arrOrder[arrOrder.length - 1];
    return orderID;
  }

  async completeInputCardInfo(card: Card) {
    await this.enterCardNumber(card.number);
    await this.enterExpireDate(card.expire_date);
    await this.enterCVV(card.cvv);
  }

  getXpathNameBold(productName: string): Locator {
    return this.genLoc(`//div[@class = 'section__content']//strong[normalize-space() = '${productName}']`);
  }

  async inputFirstName(name: string) {
    await this.page.getByPlaceholder("First name").fill(name);
  }

  async inputLastName(name: string) {
    await this.page.getByPlaceholder("Last name").fill(name);
  }

  async selectCountry(countryCode: string) {
    await this.page.getByRole("combobox").selectOption(countryCode);
  }

  /**
   * This is an asynchronous function that retrieves the tax amount from a product page and returns it as a
   * string.
   * @returns The function `getTaxCreator` returns a Promise that resolves to a string representing the
   * tax amount.
   */
  async getTaxCreator(): Promise<string> {
    let taxAmount = "0.00";
    if (await this.isElementExisted(`//p[normalize-space()='Tax']//following-sibling::p`)) {
      taxAmount = await this.getTextContent(`//p[normalize-space()='Tax']//following-sibling::p`);
      taxAmount = removeCurrencySymbol(taxAmount);
    }
    return taxAmount;
  }

  async addProductUpsellToOrder() {
    await this.page.click("//button[normalize-space()='YES, Add It To My Order!']");
  }

  /**
   * This function signs in to a PayPal account and submits a purchase.
   * @param {PaypalAccount} [paypalAccount] - The `paypalAccount` parameter is an optional object that
   * contains the username and password of a PayPal account
   */
  async signInAndSubmitPurchasePP(paypalAccount?: PaypalAccount) {
    if (!paypalAccount) {
      paypalAccount = this.defaultPaypalAccount;
    }
    await this.page
      .locator("//*[@id='login' or @id='passwordSection']//input[@id='email']")
      .fill(paypalAccount.username);
    await this.page.locator(`//button[normalize-space()="Next"]`).click();
    await this.page
      .locator("//*[@id='login' or @id='passwordSection']//input[@id='password']")
      .fill(paypalAccount.password);
    await this.page
      .locator("//*[text()[normalize-space()='Log In'] or @class='btn full ng-binding' or @id='btnLogin']")
      .click();

    await this.page.locator("//button[@id='payment-submit-btn']").click();
    await this.page.waitForSelector("//span[@value='order.name']");
  }
}
