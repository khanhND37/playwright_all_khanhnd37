import { SFCheckout } from "@pages/storefront/checkout";
import { Page } from "@playwright/test";
import type { Card } from "@types";

/**
 * @deprecated: use src/shopbase_creator/storefront/ instead
 */
export class CheckoutForm extends SFCheckout {
  xpathAcceptTerms = `(//div[contains(@class, 'accept-term')]//span)[1]`;
  xpathBtnPayNow = `//button[normalize-space()='Pay now']`;
  xpathTextThankYou = `//h2[normalize-space()='Thank you!']`;
  xpathOrderName = `//div[@class="os-order-number"]`;
  xpathCreateAccount = `//p[normalize-space()='Create account']`;
  xpathBtnBackToMyProducts = `//button[normalize-space()="Back to My Products"]`;

  defaultCardInfo: Card = {
    number: "4242424242424242",
    expire_date: "02/29",
    cvv: "100",
  };

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /** Select then complete order with different payment method
   * @param paymentMethod: payment method of checkout, default = "Stripe"
   * @param cardInfo: card information, default with card "4242 4242 4242 4242"
   */
  async completeOrderCreatorWithMethod(paymentMethod = "Stripe", cardInfo: Card = this.defaultCardInfo) {
    switch (paymentMethod) {
      case "Stripe":
        await this.completeOrderWithCardInfo(cardInfo);
        break;
      case "Paypal":
        throw new Error("Paypal will be updated later");
    }
  }

  /**
   * Input card info to Stripe info on checkout form
   * @param card is info of Stripe card test
   */
  async completeOrderWithCardInfo(card: Card) {
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
    const mainFrame = await this.switchToStripeIframe();
    await mainFrame
      .frameLocator("//div[@id='stripe-card-number']//iframe")
      .locator('[placeholder="Card number"]')
      .fill(cardNumber);
  }

  /**
   * input expire date for Stripe card on checkout form
   * @param expireDate is expire date of Stripe card test
   */
  async enterExpireDate(expireDate: string) {
    const mainFrame = await this.switchToStripeIframe();
    await mainFrame
      .frameLocator("//div[@id='stripe-card-expiry']//iframe")
      .locator('[placeholder="MM\\/YY"]')
      .fill(expireDate);
  }

  /**
   * input cvv for Stripe card on checkout form
   * @param cvv
   */
  async enterCVV(cvv: string) {
    const mainFrame = await this.switchToStripeIframe();
    await mainFrame.frameLocator("//div[@id='stripe-card-cvc']//iframe").locator('[placeholder="CVV"]').fill(cvv);
  }

  /**
   * Click button Pay now to complete order
   */
  async clickBtnCompleteOrder() {
    const xpathBtnPayNow = "//button[normalize-space()='Pay now']";
    await (await this.page.waitForSelector(xpathBtnPayNow)).isEnabled();
    await this.page.locator(xpathBtnPayNow).click();
  }

  /** payment gateway Stripe
   * switch to main iframe when checkout via stripe or spay
   */
  async switchToStripeIframe() {
    const frameLoc = this.page.locator(`#stripe-frame-form-wrapper`);
    if ((await frameLoc.isVisible()) === true) {
      return this.page.frameLocator(`#stripe-frame-form-wrapper`);
    }
    return this.page;
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
}
