import { SFCheckout } from "@pages/storefront/checkout";
import type { PaypalAccount, Product, ShippingAddress } from "@types";
import { Page } from "@playwright/test";
import { SFProductOnMobile } from "./product";
import { SFHomeOnMobile } from "./homepage";

export class CheckoutMobile extends SFCheckout {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  xpathBtnAcceptCookieOnMobile = "(//button[@class='ccpaCookieBanner_top-button'])[1]";
  xpathAddToCartOnMobile = `(//button[normalize-space()='Add to cart'])[1]`;

  /**
   * Allow buyer add multiple products to cart,
   * input shipping address then navigate to payment method page in mobile browser
   * check checkout with themeV2 to open toggle and check subtotal summary
   * @param productInfo
   * @param shippingAdress
   * @param isCheckoutWithThemeV2
   */
  async addProductToCartThenInputShippingAddressOnMobile(
    productInfo: Array<{ name: string; quantity: number }> | Array<Product>,
    shippingAdress: ShippingAddress,
  ) {
    const homePage = new SFHomeOnMobile(this.page, this.domain);
    let productPage: SFProductOnMobile;

    for (const element of productInfo) {
      productPage = await homePage.searchThenViewProductOnMobile(element.name);
      await productPage.inputQuantityProduct(element.quantity);
      await productPage.addProductToCart();
    }
    const checkout = await productPage.navigateToCheckoutPageOnMobile();
    await this.enterShippingAddressOnMobile(shippingAdress);
    await checkout.continueToPaymentMethod();
  }

  async enterShippingAddressOnMobile(shippingAddress: ShippingAddress) {
    for (const [key, value] of Object.entries(shippingAddress)) {
      switch (key) {
        case "email":
          await this.inputEmail(value);
          break;
        case "first_name":
          await this.inputFirstName(value);
          break;
        case "last_name":
          await this.inputLastName(value);
          break;
        case "address":
          await this.inputAddress(value);
          break;
        case "country":
          await this.selectCountryOnMobile(value);
          break;
        case "state":
          await this.selectStateOrProvinceOnMobile(value);
          break;
        case "city":
          await this.inputCity(value);
          break;
        case "zipcode":
          await this.inputZipcode(value);
          break;
        case "phone_number":
          await this.inputPhoneNumber(value);
          break;
        case "company":
          await this.inputCustomerInfo("company-name", value);
          break;
        case "cpf_cnpj_number":
          await this.inputCustomerInfo("cpf-cnpj-number", value);
          break;
      }
    }
    await this.clickBtnContinueToShippingMethod();
  }

  /**
   * In mobile country locator different to web
   * @param country
   */
  async selectCountryOnMobile(country: string) {
    await this.countryLoc.click();
    await this.inputData(
      "(//div[contains(@class,'relative s-select-searchable__input s-select-searchable__item')]//input)[1]",
      country,
    );
    await this.page.click(`//span[normalize-space()='${country}']`);
  }

  /**
   * In mobile state locator different to web
   * @param state
   */
  async selectStateOrProvinceOnMobile(state: string) {
    await this.page
      .locator(`//div[contains(@class, 'field--half')]//input[@id='checkout_shipping_address_province']`)
      .click();
    await this.inputData(
      "(//div[contains(@class,'relative s-select-searchable__input s-select-searchable__item')]//input)",
      state,
    );
    await this.page.click(`//span[normalize-space()='${state}']`);
  }

  /**
   * After click Complete order on Checkout page, use this func to complete order with PayPal
   * @param paypalAccount default with this.defaultPaypalAccount
   * @param page default with this.page
   */
  async logInPayPalThenClickPayNowOnMobile(paypalAccount?: PaypalAccount, page = this.page) {
    if (!paypalAccount) {
      paypalAccount = this.defaultPaypalAccount;
    }
    await this.logInPayPalToPay(paypalAccount, page);
    const totalOrderSandboxPaypal = await this.getTextContent(this.xpathTotalOrderSandboxPaypal, page);

    await this.clickPayNowBtnOnPayPalOnMobile(page);
    await this.waitForPageRedirectFromPaymentPage();
    return totalOrderSandboxPaypal;
  }

  /**
   * Complete the order with Paypal Standard.
   * It will open the payment input form and fill the corresponding information there.
   * There are 2 types of checkout pages needs to be handled:
   *  - One page checkout
   *  - 3 page checkout
   * @param paypalAccount default with account "buyer@shopbase.com"
   * @param isPaypalExpress
   */
  async completeOrderViaPayPalOnMobile(paypalAccount: PaypalAccount = this.defaultPaypalAccount) {
    // Check payment shield
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
      await paymentMethodListIframe
        .locator("//input[contains(@value,'paypal')]/following-sibling::span[@class='s-check']")
        .check();
    } else {
      await this.page.locator("//input[contains(@value,'paypal')]/following-sibling::span[@class='s-check']").check();
    }

    await this.clickBtnCompleteOrder();
    // Complete order with PayPal
    const totalOrderSandboxPaypal = await this.logInPayPalThenClickPayNowOnMobile(paypalAccount);
    return totalOrderSandboxPaypal;
  }

  /**
   * Click btn Pay now on PayPal page/ popup
   * @param page page/ popup
   */
  async clickPayNowBtnOnPayPalOnMobile(page = this.page) {
    await this.byPassAcceptCookiePaypalOnMobile(page);
    await page.locator(this.xpathSubmitBtnOnPaypal).click();
  }

  /**
   * Backup for case btnAcceptCookie will cover the btn need to show
   * @param page page/ popup
   */
  async byPassAcceptCookiePaypalOnMobile(page = this.page) {
    if (await this.isElementExisted(this.xpathBtnAcceptCookieOnMobile, page, 1000)) {
      await page.locator(this.xpathBtnAcceptCookieOnMobile).click();
    }
  }
}
