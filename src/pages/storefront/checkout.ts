import { APIRequestContext, expect, FrameLocator, Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol, removeExtraSpace, roundingTwoDecimalPlaces } from "@core/utils/string";
import { convertDaysToWeeks } from "@utils/checkout";
import type {
  Card,
  Discount,
  KlarnaGatewayInfo,
  ManualPaymentSetting,
  OrderAfterCheckoutInfo,
  OrderSummary,
  PaypalAccount,
  PaypalCard,
  PaypalOrderSummary,
  PriceProduct,
  Product,
  ProductCheckoutInfo,
  RazorpayAccount,
  ShippingAddress,
  ShippingMethod,
  ShortOrderAfterCheckoutInfo,
  ShortProductCheckoutInfo,
  TippingInfo,
} from "@types";
import { CheckoutInfoAndCard, LoginInfoRedirectPage } from "@types";
import { SFHome } from "./homepage";
import { SFProduct } from "./product";
import { SFApps } from "./apps";
import { MailBox } from "@pages/thirdparty/mailbox";

export enum PaymentMethod {
  PAYPAL = "PayPal",
  STRIPE = "Stripe",
  SHOPBASEPAYMENT = "Shopbase payment",
  SPAY_RESELLER = "Spay reseller",
  BANCONTACT = "Bancontact",
  GIROPAY = "giropay",
  SEPA = "SEPA Direct Debit",
  IDEAL = "iDEAL",
  COD = "cod",
  BANK_TRANSFER = "bank_transfer",
  BANKTRANSFER = "BankTransfer",
  UNLIMINT = "Unlimint",
  CARDPAY = "cardpay",
  PAYONEER = "Payoneer",
  SOFORT = "Sofort",
  KLARNA = "Klarna",
  AFTERPAY = "Afterpay",
  PAYPALCREDIT = "Paypal credit card",
  PAYPALSMARTBTN = "Paypal smart button",
  PAYPAL_SMART_BTN_REDIRECT = "Paypal smart button redirect",
  PAYPALEXPRESS = "Paypal express",
  PAYPALBNPL = "Paypal BNPL",
  PAYPALCREATOR = "PayPal Creator",
  BUYWITHPAYPAL = "Buy with Paypal",
  OCEAN_PAYMENT = "Ocean payment",
  ASIA_BILL = "Asiabill",
  RAZORPAY = "Razorpay",
}

export class SFCheckout extends SBPage {
  emailLoc: Locator;
  firstnameLoc: Locator;
  lastnameLoc: Locator;
  addLoc: Locator;
  apartmentLoc: Locator;
  cityLoc: Locator;
  provinceLoc: Locator;
  zipLoc: Locator;
  countryLoc: Locator;
  phoneLoc: Locator;
  checkoutToken: string;
  request: APIRequestContext;

  itemPostPurchaseValue: string;

  defaultPaypalAccount: PaypalAccount = {
    username: "buyer@shopbase.com",
    password: "2XfWH9Ae",
  };
  defaultCardInfo: Card = {
    number: "4242424242424242",
    holder_name: "Shopbase Auto",
    expire_date: "02/29",
    expire_month: "02",
    expire_year: "2029",
    cvv: "100",
    sepa_card: "NL39 RABO 0300 0652 64",
    ideal_bank: "ABN Amro",
    unlimint_card: "4000000000000077",
    paypalpro_card: "4000 0000 0000 0002",
    oceanpayment_card: "5454545454545454",
    asia_card: "4000 0209 5159 5032",
  };
  defaultPaypalCard: PaypalCard = {
    number: "374200149886214",
    expires_date: "02/29",
    csc: "4715",
    country: "US",
    first_name: "Shopbase",
    last_name: "Auto",
    stress_address: "1234 Main Street",
    aria_desc: "San Jose",
    city: "New York",
    state: "New York",
    zip_code: "10001",
    phone_number: "408-334-8890",
    email: "testerocg@maildrop.cc",
  };

  // Klana gateway info with country = UK
  defaultKlarnaGatewayInfo: KlarnaGatewayInfo = {
    phoneNumber: "4408082580300",
    otp: "123456",
    country: "UK",
    continentCode: "eu",
    chargeMethod: "Pay in full today.",
  };
  // order summary
  total: number;
  subtotal = 0;
  shipping: number;
  tip: number;
  discount: number;
  productUpsellPrice: number;
  orderQuantity: number;
  paymentCode?: string;
  xpathPPCBLock = ".post-purchase-offer__content-wrap";
  xpathPPCPrice = ".product-post-purchase__product-sale-price";
  xpathPPCV2 = ".post-purchase__content-wrap"; // theme inside-v2 PPC popup
  xpathPPCPriceV2 = ".upsell-only-blocks__product-price"; // theme inside-v2 PPC popup
  btnExpandOrdSummaryLoc = this.page.locator(
    `//span[normalize-space()='Show order summary']/following-sibling::*[contains(@class,'toggle__icon')]`,
  );
  btnClosePPCPopupLoc = this.page.locator(`(//div[contains(@class,'upsell-only-blocks__action')]/a)[1]`);
  btnNextPPCPopupV3Loc = this.page.locator(`.product-post-purchase__next`);
  paypalBlockLoc = this.page.locator(`//span[contains(text(),'Use your PayPal account')]`);
  submitPaypalBtnLoc = this.page.locator(`//button[@id='payment-submit-btn']`);
  spayCardNameLoc = this.page.frameLocator("#stripe-frame-form-wrapper").locator('[placeholder="Cardholder name"]');
  stripeCardNameLoc = this.page.locator('[placeholder="Cardholder name"]');
  footerLoc = this.page.locator(this.xpathFooterSF);
  ordSummaryMobileLoc = this.page.locator(`//div[@id='checkout']//div[@class='sidebar scoped checkout']`);
  applyDiscountButton = this.page.locator(`//button[normalize-space()='Apply']`);
  inputDiscountBox = this.page.locator(
    `(//input[@placeholder='Enter your discount code here' or @placeholder='Enter your promotion code' or @placeholder='Discount code'])[1]`,
  );
  xpathTitleTip = "//h2[normalize-space()='Add a tip to support us']";
  xpathCheckoutProducts = "//table[@class='checkout-product-table']";
  xpathCheckOutContent = "(//div[@id='checkout']//div[@class='content'])[1]";
  xpathReductionCode = "//div[@class='reduction-code']";
  xpathShipLabel = "//div[text()='Ship to']";
  xpathPaymentLabel = "//h2[contains(@class,'section__title')]//span[text()='Payment' or text()='Payment method']";
  xpathThankYou = "//*[normalize-space()='Thank you!']";
  xpathShippingMethodName = "//span[@class='shipping-selector__name'] | //div[@class='shipping-method__inner']";
  xpathClosePPCPopUp =
    "//div[contains(@class, 'post-purchase__close') or contains(@class, 'post-purchase-offer__close') or contains(@class, 'post-purchase-new-ui__close')]";
  xpathSectionTipping = "//div[@class='section tipping']//div[@class='fieldset floating-label']";
  xpathPPCPopupContent = "(//div[contains(@class, 'post-purchase__content')])[1]";
  xpathAddTipCheckbox = "//div[h2[text()='Add Tip']]//following-sibling::div//span[@class='s-check']";
  xpathBtnAddTip = "//button[@class='s-button field__input-btn mt-5']";
  xpathSubmitBtnOnPaypal = "//button[@id='payment-submit-btn']";
  xpathBtnAcceptCookie = "(//button[@class='ccpaCookieBanner_accept-button'])[1]";
  xpathOrderName = "//div[@class='os-order-number'] | //span[@value='order.name']";
  xpathProductCart = "div.product-cart";
  xpathProductCartV2 = ".checkout-product-table";
  xpathDeleteDiscount = "//div[@class='tag__button']";
  xpathPhoneNumberInShippingMethod = "//input[@id='checkout_shipping_address_shipping_phone']";
  xpathPhoneNumberInShippingAddress = "//input[@id='checkout_shipping_address_phone']";
  xpathMessagePhoneNumberRequired =
    "//div[normalize-space()='* Your phone number is required for contact and update on delivery']";
  xpathOrderSummarySection = "(//div[contains(@class,'order-summary')])[1]";
  xpathBtnStripeRedirectLink = "(//a[normalize-space()='Authorize Test Payment'])[1]";
  xpathTitlePayment = "//span[normalize-space()='Payment']";
  xpathBtnContinueToPaymentMethod =
    "//button[normalize-space()='Continue to payment method'] | //button[normalize-space()='Continue to payment']";
  xpathBtnContinueToShipping =
    "//button[normalize-space()='Continue to shipping method'] | //button[normalize-space()='Continue to shipping']";
  xpathRemoveItem = "//span[contains(text(),'Remove all items')]";
  xpathAlertRemoveItem = "//div[contains(@class,'edit-order__wrapper')]";
  xpathTippingAmt = "//tr[child::td[text()='Tip']]//span[@class='order-summary__emphasis']";
  xpathTippingLine = "//div[contains(@class,'tip-line')][1]";
  xpathAlertCartEmpty = "//p[@class='notice__text']";
  xpathIframeBtnPaypalExpress =
    "(//div[contains(@id,'paypal-smart-button')]//iframe[@allowpaymentrequest='allowpaymentrequest'])[1]";
  xpathDMCAButton = "//button[contains(text(), 'DMCA')]";
  orderSummaryBlock = this.genLoc("[component=new-order-summary]");
  discountTag = this.genLoc(".discount-code--wb").locator(".tag");
  errorAlert = this.genLoc(".notice--error");
  xpathStepInformation = "(//span[normalize-space()='Information'])[1]";
  xpathBtnPlaceYourOrder =
    "//button[normalize-space()='Place your order' or child::*[normalize-space()='Place your order']]";
  xpathIframeStripeForm = "//iframe[@class='stripe-frame-form']";
  xpathPaymentMethodListIframe = `//iframe[@class='payment-frame-form']`;
  xpathZipCode = '//div[contains(@class,"fieldset")]/div[not(contains(@style,"none;"))]//input[@name="zip-code"]';
  xpathPaymentMethod = this.page.locator(`//strong[contains(., 'Card')]`);
  btnClosePPCPopup = this.page.locator(`(//div[contains(@class,'upsell-only-blocks__action')]/a)[1]`);
  xpathBlockPayment = this.page.locator(this.xpathPaymentMethodLabel);
  shippingSessionInBreadcrumbLoc = this.page.locator(`//a[normalize-space()='Shipping']`);
  xpathDiscountField = `//label[normalize-space()='Discount code']`;
  xpathSkeletonSummaryBlock = `//div[contains(@class,'skeleton-checkout order-summary')]`;
  xpathChangeMethod = this.page.locator("//span[@class='shipping-selector__change']");
  //Element on Thankyou Page
  thankyouPageLoc = this.page.locator(this.xpathThankYou);
  xpathShipAdrOnThkPage = "//*[normalize-space()='Shipping address']/following-sibling::address[@class='address']";
  xpathSectionReview = `//section[@type='carousel']`;
  xpathTotalOrderSandboxPaypal = "//span[@class='Cart_cartAmount_4dnoL xo-member-1yo2lxy-text_body_strong']";
  xpathPayment = '(//div[contains(@class,"payment")]//*[normalize-space()="Payment"])[1]';
  checkoutButton = this.genLoc("div.btn-primary:visible").filter({ hasText: "CHECKOUT" });
  xpathAsiaBillMethod = `//div[@id='asia-bill-integrated-hosted-credit-card-header']`;
  xpathAsiaBillImg = `//img[@alt='AsiaBill']`;
  xpathFieldEmailOnThkPage = `//input[@name='email-address']`;
  xpathFieldOrderNumberOnThkPage = `//input[@name='order-number']`;
  xpathLoginOrderButtonOnThkPage = `//button[normalize-space()='Log in']`;
  xpathPPCHeading = `//div[contains(@class,'post-purchase-offer__heading')]`;
  //xpath popup express
  xpathCartSummaryOnPP = "//span[contains(@class,'Cart_cartAmount')]";
  xpathPPIconClose = "//button[@title='Close']";
  xpathPPShippingMethodSelector = "//select[@id='shippingMethodsDropdown']";
  xpathPPPopupSummary = "(//div[normalize-space()='Your cart'])[1]";
  xpathNameProduct = "span.checkout-product__name>>nth=0";
  xpathDroplistCountry = `//div[@class='fieldset floating-label']/div[not(contains(@style,"none"))]//div[child::input[@name='countries' and contains(@id,'shipping')]]//input[not(@value)]`;
  xpathImageThumbnailInCheckoutPage =
    "(//div[contains(@class,'order-summary')])[1]//div[@class='checkout-product-thumbnail' or contains(@class,'product-cart__image')]";
  xpathPayoneerMethod = `//div[@id='payoneer-integrated-hosted-credit-card-header']`;
  xpathAutoToS = "//p[text()='By clicking button Place your order, you agree to the ']";
  xpathManualToS = "//div[text() = 'I have read and agreed to the ']";
  productNameOnPPCV2 = ".upsell-only-blocks__product-name";
  blockProductOnPPCV2 = ".upsell-only-blocks";
  blockProductOnCheckoutPage = ".checkout-product";
  PPCTimerV2 = ".post-purchase__message";
  xpathShowTip = "//span[following-sibling::span[contains(normalize-space(),'Show your support for the team at')]]";
  xpathETAProcessingDelivery = `//span[contains(@class,'time-shipping-summary')] | //span[contains(text(),'Ready to ship as early as')]/following-sibling::span`;
  xpathETADeliveryThankyouPage = `//*[contains(text(),'Estimated delivery time')]/following-sibling::p`;
  blockProductOnPPCV2ByName(productName: string) {
    return this.genLoc(this.blockProductOnPPCV2).filter({ hasText: `${productName}` });
  }
  xpathPaymentMethodThankyouPage = "//ul[@class='payment-method-list']//span";
  appliedCoupon = '(//div[normalize-space()="Coupon applied"])[1]';
  razorpay = {
    xpathPhoneNumber: `//input[@autocomplete='tel-country-code']`,
    inputSearchCountry: `//input[@placeholder = 'Search a country']`,
    iframe: `//iframe[@class='razorpay-checkout-frame']`,
  };

  constructor(page: Page, domain: string, checkoutToken?: string, request?: APIRequestContext) {
    super(page, domain);
    this.checkoutToken = checkoutToken;
    this.request = request;
    this.emailLoc = this.genLoc("#checkout_shipping_address_email");
    this.firstnameLoc = this.genLoc("#checkout_shipping_address_first_name");
    this.lastnameLoc = this.genLoc("#checkout_shipping_address_last_name");
    this.addLoc = this.genLoc("#checkout_shipping_address_address_line1");
    this.cityLoc = this.genLoc("#checkout_shipping_address_city:visible");
    this.zipLoc = this.genLoc("#checkout_shipping_address_zip:visible");
    this.countryLoc = this.genLoc("#checkout_shipping_address_country_name:visible");
    this.provinceLoc = this.genLoc("#checkout_shipping_address_province");
    this.phoneLoc = this.genLoc("#checkout_shipping_address_phone");
    this.itemPostPurchaseValue = "0";
  }

  xpathPaymentLoc(paymentMethod: string) {
    let paymentLoc = "";
    switch (paymentMethod) {
      case "PayPal":
      case "Paypal smart button":
      case PaymentMethod.PAYPALCREDIT:
      case PaymentMethod.PAYPALBNPL:
      case PaymentMethod.PAYPAL_SMART_BTN_REDIRECT:
      case "PaypalBNPL":
        paymentLoc =
          "//input[contains(@value,'paypal-smart-button') or contains(@value,'paypal-standard')]/following-sibling::span[@class='s-check'] | //input[contains(@value,'paypal-button') or contains(@value,'paypal-standard')]/following-sibling::span[@class='s-check']";
        break;
      case "Shopbase payment":
        paymentLoc = "//input[contains(@value,'platform')]/following-sibling::span[@class='s-check']";
        break;
      case "Stripe":
        paymentLoc = "//input[contains(@value,'credit-card')]/following-sibling::span[@class='s-check']";
        break;
      case "Bancontact":
        paymentLoc = "//input[contains(@value,'bancontact')]/following-sibling::span[@class='s-check']";
        break;
      case "SEPA Direct Debit":
        paymentLoc = "//input[contains(@value,'sepa_debit')]/following-sibling::span[@class='s-check']";
        break;
      case "iDEAL":
        paymentLoc = "//input[contains(@value,'ideal')]/following-sibling::span[@class='s-check']";
        break;
      case "giropay":
        paymentLoc = "//input[contains(@value,'giropay')]/following-sibling::span[@class='s-check']";
        break;
      case "cod":
        paymentLoc = "//input[contains(@value,'cod')]/following-sibling::span[@class='s-check']";
        break;
      case "bank_transfer":
        paymentLoc = "//input[contains(@value,'bank_transfer')]/following-sibling::span[@class='s-check']";
        break;
      case "Unlimint":
      case "cardpay":
        paymentLoc = "//input[contains(@value,'cardpay')]/following-sibling::span[@class='s-check']";
        break;
      case PaymentMethod.PAYONEER:
        paymentLoc = "//input[contains(@value,'payoneer')]/following-sibling::span[@class='s-check']";
        break;
      case PaymentMethod.SOFORT:
        paymentLoc = "//input[contains(@value,'sofort')]/following-sibling::span[@class='s-check']";
        break;
      case PaymentMethod.KLARNA:
        paymentLoc = "//input[contains(@value,'klarna')]/following-sibling::span[@class='s-check']";
        break;
      case PaymentMethod.AFTERPAY:
        paymentLoc = "//input[contains(@value,'afterpay')]/following-sibling::span[@class='s-check']";
        break;
      case PaymentMethod.PAYPALCREATOR:
        paymentLoc = "//input[@value='paypal-express']/following-sibling::span[contains(@class,'s-check')]";
        break;
      case PaymentMethod.OCEAN_PAYMENT:
        paymentLoc = `//div[contains(@id, '${this.paymentCode}') and contains(@id, 'hosted-credit-card-header')]
          //input[contains(@value,'platform') or contains(@value,'integrated-hosted-credit-card')]
          /following-sibling::span[@class='s-check']`;
        break;
      case PaymentMethod.ASIA_BILL:
        paymentLoc = `//div[contains(@id, '${this.paymentCode}') and contains(@id, 'hosted-credit-card-header')]
          //input[contains(@value,'platform') or contains(@value,'integrated-hosted-credit-card')]
          /following-sibling::span[@class='s-check']`;
        break;
      case PaymentMethod.RAZORPAY:
        paymentLoc = `//input[contains(@value,'razorpay')]/following-sibling::span[@class='s-check']`;
        break;
      default:
        paymentLoc =
          "//input[contains(@value,'platform') or contains(@value,'credit-card')]" +
          "/following-sibling::span[@class='s-check']";
    }
    return paymentLoc;
  }

  getXpathBtnAddTip(name: string) {
    return this.page.locator(`//button[@class='s-button field__input-btn mt-5' and normalize-space()='${name}']`);
  }

  xpathLabelShippingMethod(shippingMethod: string) {
    return this.page.locator(`//span[@class='pr-8 shipping-method__method-title' and text()='${shippingMethod}']`);
  }

  getXpathEtaShippingByMethod(name: string) {
    return `//span[normalize-space()='${name}']/following-sibling::span[contains(@class,'eta-shipping')]`;
  }

  textEtaShipping(minShippingTime: string | null, maxShippingTime: string | null) {
    let textEtaShipping: string;
    if (minShippingTime == null && maxShippingTime !== null) {
      textEtaShipping = `(${maxShippingTime} business days)`;
      return textEtaShipping;
    } else if (maxShippingTime == null && minShippingTime !== null) {
      textEtaShipping = `(${minShippingTime} business days)`;
      return textEtaShipping;
    }
    textEtaShipping = `(${minShippingTime} - ${maxShippingTime} business days)`;
    return textEtaShipping;
  }

  /**
   * Lấy locator price của các trường trong block summary order tại màn checkout
   * @param type
   * @returns
   */
  getSummaryOrder(type: "Subtotal" | "Discount" | "Shipping" | "Total"): Locator {
    let title: string;
    switch (type) {
      case "Discount":
        title = "Discount Offer Discount";
        break;
      case "Total":
        title = "Total:";
        break;
      default:
        title = type;
        break;
    }
    const ele = this.orderSummaryBlock
      .getByRole("row")
      .filter({ has: this.page.getByRole("cell", { name: title, exact: true }) })
      .locator("[class*=__price]");
    return ele;
  }

  getRemoveDiscountIcon(code: string) {
    return this.page.locator(`//div[div/span[normalize-space()='${code}']]/following-sibling::div`);
  }

  getXpathItemNotShip(itemName: string) {
    return this.genLoc(
      `//div[contains(@class,'item-non-ship')]//following-sibling::td/span[contains(text(),'${itemName}')]`,
    );
  }

  //Get message at shipping block when only select country
  async getMessageShipping(): Promise<string> {
    return this.getTextContent("(//div[@class='section__caption'])[1]");
  }

  // Get message high risk
  async getMessageHighRisk(index = 1): Promise<string> {
    return await this.getTextContent(`//tbody//tr[@class='high-risk-message'][${index}]`);
  }

  async getXpathPaymentMethod(paymentMethod: string) {
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      return this.page
        .frameLocator(this.xpathPaymentMethodListIframe)
        .locator(`//strong[contains(., '${paymentMethod}')]`);
    }
    return this.page.locator(`//strong[contains(., '${paymentMethod}')]`);
  }

  getLocatorProdNameInOrderSummary(prodName: string): Locator {
    return this.genLoc(`//span[text()='${prodName}']`);
  }

  getXpathOriginPrice(itemName: string) {
    return this.genLoc(
      `//td[span[normalize-space()='${itemName}']]/following-sibling::td/span[@class='original-price']`,
    );
  }

  getApplyTipErrorMsg(subtotal: string) {
    return this.genLoc(`//p[normalize-space()='Enter a tip no more than $${subtotal}']`);
  }

  getXpathErrorMessage(errorMsg: string) {
    return this.genLoc(`(//*[normalize-space()='${errorMsg}'])[1]`);
  }

  /**
   * Verify current checkout layout page is one-page automatically
   * @param isAPI automatically detect when user initialize the POM with/without request
   * @returns true or false
   */
  async isOnePageCheckout(isAPI = false): Promise<boolean> {
    if (this.request) {
      isAPI = true;
    }
    if (isAPI) {
      const res = await this.request.get(`https://${this.domain}/api/bootstrap/next.json`);
      expect(res.status()).toBe(200);
      const resBody = await res.json();
      const checkoutLayout = resBody.result.checkout_settings.checkout_layout;
      if (checkoutLayout == "one-page") {
        return true;
      }
      return false;
    }
    const isThreeStepsCheckout = await this.isThreeStepsCheckout();
    return !isThreeStepsCheckout;
  }

  async fillCheckoutInfo(
    email: string,
    fName: string,
    lName: string,
    add: string,
    city: string,
    state: string,
    zip: string,
    country: string,
    phone: string,
    shippingMethod = true,
  ) {
    await this.emailLoc.pressSequentially(email, { delay: 200 });
    await this.firstnameLoc.fill(fName);
    await this.lastnameLoc.fill(lName);
    await this.addLoc.fill(add);
    await this.cityLoc.fill(city);
    await this.selectCountry(country);
    await this.selectStateOrProvince(state);
    await this.zipLoc.fill(zip);
    await this.phoneLoc.fill(phone);
    if (shippingMethod) {
      await this.page.locator(this.xpathBtnContinueToShipping).click();
      await this.page.waitForNavigation();
    }
  }

  async inputEmail(email: string, form = "shipping") {
    await this.page.locator(`//input[@name='email-address' and contains(@id,'${form}')]`).clear();
    await this.page.fill(`//input[@name='email-address' and contains(@id,'${form}')]`, email);
  }

  async inputFirstName(firstName: string, form = "shipping") {
    await this.inputCustomerInfo("first-name", firstName, form);
  }

  async inputLastName(lastName: string, form = "shipping") {
    await this.inputCustomerInfo("last-name", lastName, form);
  }

  /**
   * Input address in customer info form
   * After fill address > click to others element in order to prevent dropdown showing
   * @param address
   * @param form
   */
  async inputAddress(address: string, form = "shipping") {
    await this.inputCustomerInfo("street-address", address, form);
    if (form == "shipping") {
      await this.page.click(`//input[@name='email-address' and contains(@id,'shipping')]`);
    }
  }

  async inputCity(city: string, form = "shipping") {
    await this.inputCustomerInfo("city", city, form);
  }

  async inputZipcode(zipcode: string, form = "shipping", autoFill?: boolean) {
    await this.inputCustomerInfo("zip-code", zipcode, form);
    if (autoFill) {
      await this.page.click(`//a[@class='s-dropdown-item' and contains(normalize-space(), '${zipcode}')]`);
    }
  }

  async inputPhoneNumber(phoneNumber: string, form = "shipping") {
    await this.inputCustomerInfo("phone-number", phoneNumber, form);
  }

  /**
   * Input phone number required in block shipping method
   * @param phoneNumber
   */
  async inputPhoneNumberInShippingMethod(phoneNumber: string) {
    await this.page.locator(this.xpathPhoneNumberInShippingMethod).fill(phoneNumber);
  }

  async selectCountry(country: string, form = "shipping") {
    const xpathCountryField = `//div[@class='fieldset floating-label']/div[not(contains(@style,"none"))]//div[child::input[@name='countries' and contains(@id,'${form}')]]`;
    await this.page.locator(xpathCountryField).click();
    await this.inputData(".s-select-searchable.s-select-searchable--active input[placeholder='Search']", country);
    await this.page.click(`//div[child::span[normalize-space()='${country}']]`);
  }

  async selectStateOrProvince(state: string, form = "shipping") {
    if (state) {
      const xpathState = `//div[@class='fieldset floating-label']/div[not(contains(@style,"none"))]//input[@name="provinces" and contains(@id,'${form}')]`;
      await this.page.locator(xpathState).click();
      await this.inputData(".s-select-searchable.s-select-searchable--active input[placeholder='Search']", state);
      await this.page.click(`(//span[normalize-space()='${state}'])[1]`);
    }
  }

  async selectDroplist(id: string, value: string) {
    const droplist = this.page.locator(`//select[@id='${id}']`);
    await droplist.selectOption({ label: `${value}` });
  }

  async inputData(locator: string, value) {
    await this.page.locator(locator).fill(value);
  }

  /**
   * input customer information for each field
   * @param className
   * @param value value to input
   * @param form for "shipping" | "billing" form, default for "shipping" form
   */
  async inputCustomerInfo(className: string, value, form = "shipping") {
    const field = this.page.locator(
      `//div[@class='fieldset floating-label']/div[not(contains(@style,"none"))]//input[contains(@name,'${className}') and contains(@id,'${form}')]`,
    );
    await field.click();
    await field.fill(value);
    await field.evaluate(e => e.blur());
  }

  /* Clicking on the shipping method. */
  async selectShippingMethod(shippingMethod: string, mustEqual = false) {
    let shippingMethodLoc = `//div[contains(@class,'review-block') and descendant::*[text()[contains(.,'${shippingMethod}')]]]//span[@class='s-check']`;
    if (mustEqual) {
      shippingMethodLoc = `//div[contains(@class,'review-block') and descendant::*[normalize-space()='${shippingMethod}']]//span[@class='s-check']`;
    }
    if (shippingMethod) {
      await this.page.locator(shippingMethodLoc).check();
      // wait for shipping fee update
      await this.page.waitForTimeout(5000);
      // click here for wait order summary update shipping method when changes shipping method
      await this.page
        .locator(
          "//div[contains(text(),'Shipping')] | //h2[contains(text(),'Shipping method')] | //span[contains(text(),'Shipping method')]",
        )
        .click();
    }
  }

  // set shipping fee
  async setShippingFee() {
    const ship = await this.getShippingFeeOnOrderSummary();
    if (ship.startsWith("Free")) {
      this.shipping = 0;
    } else {
      this.shipping = Number(removeCurrencySymbol(ship));
    }
  }

  async continueToPaymentMethod() {
    if (!(await this.isOnePageCheckout())) {
      const nextStep = this.page.locator(this.xpathBtnContinueToPaymentMethod);
      await nextStep.click();
      await this.page.waitForSelector(this.xpathPaymentMethodLabel);
    }
    await this.footerLoc.scrollIntoViewIfNeeded();
  }

  async clickBtnContinueToShippingMethod() {
    if (!(await this.isOnePageCheckout())) {
      const coutinueBtn = this.xpathBtnContinueToShipping;
      // await this.navigationWith(() => this.page.locator(coutinueBtn).click());
      await this.page.locator(coutinueBtn).click({ delay: 2000 });
    }
  }

  /**
   * select payment method.
   * @param payment: payment method
   */
  async selectPaymentMethod(payment?: PaymentMethod | string) {
    const paymentLoc = this.xpathPaymentLoc(payment);
    // For new ft Payment shield since 23Aug but haven't been approved yet
    const paymentMethodListIframe = this.xpathPaymentMethodListIframe;
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      await this.page.waitForSelector(paymentMethodListIframe);
      await this.page.locator(paymentMethodListIframe).scrollIntoViewIfNeeded();
      await this.page.frameLocator(paymentMethodListIframe).locator(paymentLoc).first().check();
      return;
    }
    // For current flow (without payment shield)
    await this.page.waitForSelector(paymentLoc);
    await this.page.locator(paymentLoc).first().scrollIntoViewIfNeeded();
    await this.page.locator(paymentLoc).first().check();
  }

  /*
   * get notice message
   * @param message
   */
  async waitForNoticeMessage(message: string) {
    return this.page.waitForSelector(`//*[contains(text(),'${message}')]`);
  }

  /**
   * Complete order on stripe dashboard.
   * Available for EU payment method
   */
  async completeOrderOnStripePage(ignoreStep?: boolean) {
    if (!ignoreStep) {
      await Promise.all([this.clickBtnCompleteOrder(), this.page.waitForNavigation()]);
    }

    await this.page.locator(`(//a[normalize-space()='Authorize Test Payment'])[1]`).click();
    if (ignoreStep) {
      return;
    }
  }

  /**
   * Use this func after completed order with hosted payment method.
   */
  async waitForPageRedirectFromPaymentPage() {
    await Promise.any([
      this.page.waitForSelector(this.xpathThankYou),
      this.page.waitForSelector(this.xpathPPCPopupContent),
    ]);
  }

  /**
   * Complete order on stripe dashboard.
   * Available for EU payment method
   */
  async completeRedirectPage(gateway: string, loginInfo: LoginInfoRedirectPage, ignoreClickBtnCompleteOrder = false) {
    switch (gateway) {
      case PaymentMethod.BANCONTACT:
      case PaymentMethod.GIROPAY:
      case PaymentMethod.SOFORT:
      case PaymentMethod.AFTERPAY:
      case PaymentMethod.IDEAL:
        await this.page.waitForSelector(this.xpathBtnStripeRedirectLink);
        await this.completeOrderOnStripePage(ignoreClickBtnCompleteOrder);
        break;
      case PaymentMethod.OCEAN_PAYMENT:
        await this.page.locator(`//input[@placeholder='Card Number']`).fill(loginInfo.card.number);
        await this.page.locator(`//input[@placeholder='Expiration Date']`).fill(loginInfo.card.expire_date);
        await this.page.locator(`//input[@placeholder='Secure Code']`).fill(loginInfo.card.cvv);
        await this.page.locator(`//span[text()='PAY NOW']`).click();
        if (await this.isElementExisted("//input[@id='password']")) {
          await this.page.locator("//input[@id='password']").type(loginInfo.card.security_code);
          await this.page.locator("//input[@id='submit_btn']").click();
        }
        await this.page.waitForSelector(this.xpathOrderSummarySection);
        break;
      case PaymentMethod.ASIA_BILL:
        await this.completeOrderAsiabill(loginInfo.card);
        break;
      case PaymentMethod.PAYONEER:
        await this.completeOrderViaPayoneer(loginInfo.card);
        break;
      case PaymentMethod.PAYPAL:
        await this.logInPayPalToPay(loginInfo.paypal_account);
        await this.byPassAcceptCookiePaypal();
        await this.page.locator(this.xpathSubmitBtnOnPaypal).click();
        await this.page.waitForSelector(this.xpathOrderName);
        break;
      case PaymentMethod.UNLIMINT:
        await this.enterCardPayInfo(loginInfo.card);
    }
  }

  /**
   * Complete order on stripe dashboard.
   * Available for EU payment method
   */
  async completeOrderStripeHostedUsingPaymentShield() {
    await Promise.all([this.clickBtnCompleteOrder(), this.page.waitForURL(new RegExp(".*"), { timeout: 3000 })]);
  }

  /**
   * Checkout fail order on stripe dashboard.
   * Available for EU payment method
   */
  async checkoutFailOrderOnStripePage(ignoreStep?: boolean) {
    if (!ignoreStep) {
      await Promise.all([
        this.clickBtnCompleteOrder(),
        this.page.waitForNavigation({ waitUntil: "load", timeout: 10000 }),
      ]);
    }
    await this.page.locator(`(//a[normalize-space()='Fail Test Payment'])[1]`).click();
  }

  /**
   * Select ideal bank
   * @param bank: bank name
   */
  async selectIdealBank(bank: string) {
    await this.page.waitForLoadState(`domcontentloaded`);
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
      await paymentMethodListIframe
        .frameLocator(`//iframe[contains(@title,'iDEAL')][1]`)
        .locator(`//*[text()[normalize-space()='Select bank']]/parent::div[@role='combobox']`)
        .click();
      await paymentMethodListIframe
        .frameLocator(`//iframe[contains(@title,'iDEAL')][2]`)
        .locator(`//div[normalize-space()='${bank}']//parent::li`)
        .click();
      return;
    }
    //flow without fs payment shield
    await this.page
      .frameLocator(`//iframe[contains(@title,'iDEAL')][1]`)
      .locator(`//*[text()[normalize-space()='Select bank']]/parent::div[@role='combobox']`)
      .click();
    await this.page
      .frameLocator(`//iframe[contains(@title,'iDEAL')][2]`)
      .locator(`//div[normalize-space()='${bank}']//parent::li`)
      .click();
  }

  /**
   * enter SEPA card debit
   * @param cardNumber
   * @param isPaymentShield
   */
  async enterSepaCardInfo(cardNumber: string, isPaymentShield?: boolean) {
    await this.page.waitForLoadState(`domcontentloaded`);
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
      let sepaDebitFrame = paymentMethodListIframe;
      if (isPaymentShield) {
        sepaDebitFrame = paymentMethodListIframe.frameLocator(`//iframe[@id='stripe-sepa-debit-frame-form-wrapper']`);
      }

      await sepaDebitFrame
        .frameLocator(`//iframe[@title='Secure IBAN input frame']`)
        .locator(`//input[@placeholder="NL00 AAAA 0000 0000 00"]`)
        .fill(cardNumber);
      return;
    }
    //flow without fs payment shield
    await this.page
      .frameLocator(`//iframe[@title='Secure IBAN input frame']`)
      .locator(`//input[@placeholder="NL00 AAAA 0000 0000 00"]`)
      .fill(cardNumber);
  }

  /** payment gateway Stripe
   * switch to main iframe when checkout via stripe or spay
   */
  async switchToStripeIframe(timeout = 3000): Promise<Page | FrameLocator> {
    await this.page.waitForLoadState("domcontentloaded");
    const iframeStripe = "//iframe[contains(@class,'stripe-frame-form') or contains(@id,'stripe-frame-form')]";

    // For new ft Payment shield since 23Aug but haven't been approved yet
    const paymentMethodListIframe = this.xpathPaymentMethodListIframe;
    if (await this.isElementExisted(this.xpathPaymentMethodListIframe)) {
      if (await this.isElementExisted(iframeStripe, this.page.frameLocator(paymentMethodListIframe), timeout)) {
        return this.page.frameLocator(paymentMethodListIframe).frameLocator(iframeStripe);
      }
      return this.page.frameLocator(paymentMethodListIframe);
    }
    // For current flow (without payment shield)
    if (await this.isElementExisted(iframeStripe, null, timeout)) {
      return this.page.frameLocator(iframeStripe);
    }
    return this.page;
  }

  // Replace the old `switchToStripeIframe()` when new ft Payment shield is approved
  // async switchToStripeIframe(timeout = 3000): Promise<Page | FrameLocator> {
  //   await this.page.waitForLoadState("domcontentloaded");
  //   const iframeStripe = "//iframe[contains(@class,'stripe-frame-form') or contains(@id,'stripe-frame-form')]";
  //   const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
  //   if (await this.isElementExisted(iframeStripe, paymentMethodListIframe, timeout)) {
  //     return paymentMethodListIframe.frameLocator(iframeStripe);
  //   }
  //   return paymentMethodListIframe;
  // }

  /**
   * Input card number: required switch to iframes if iframes exist
   * @param cardNumber
   */
  async enterCardNumber(cardNumber: string): Promise<void> {
    const mainFrame = await this.switchToStripeIframe();
    const secondIframeXpath = "(//div[@id='stripe-card-number' or @id='creditCardNumber']//iframe)[1]";
    const validate = await this.isElementExisted(secondIframeXpath, mainFrame);
    if (validate) {
      await mainFrame.frameLocator(secondIframeXpath).locator('[placeholder="Card number"]').fill(cardNumber);
    } else {
      await mainFrame.locator('[placeholder="Card number"]').fill(cardNumber);
    }
  }

  /**
   * Input card holder name: required switch to iframes if iframes exist
   * @param holderName
   */
  async enterCardHolderName(holderName: string): Promise<void> {
    if (!holderName) {
      return;
    }
    const mainFrame = await this.switchToStripeIframe(100);
    const isCardHolderExist = await this.isElementExisted(`[placeholder="Cardholder name"]`, mainFrame);
    if (!isCardHolderExist) {
      return;
    }
    await mainFrame.locator('[placeholder="Cardholder name"]').fill(holderName);
  }

  /**
   * Input card expire date: required switch to iframes if iframes exist
   * @param expireDate
   */
  async enterExpireDate(expireDate: string): Promise<void> {
    const mainFrame = await this.switchToStripeIframe(100);
    const secondIframeXpath = "(//div[@id='stripe-card-expiry' or @id='expireDate']//iframe)[1]";
    const validate = await this.isElementExisted(secondIframeXpath, mainFrame);
    if (validate) {
      await this.isElementExisted('[placeholder="MM\\/YY"]', mainFrame);
      await mainFrame.frameLocator(secondIframeXpath).locator('[placeholder="MM\\/YY"]').fill(expireDate);
    } else {
      await mainFrame.locator('[name="exp-date"]').fill(expireDate);
    }
  }

  /**
   * Input card cvv: required switch to iframes if iframes exist
   * @param cvv
   */
  async enterCVV(cvv: string): Promise<void> {
    const mainFrame = await this.switchToStripeIframe(100);
    const secondIframeXpath = "(//div[@id='stripe-card-cvc' or @id='cvv']//iframe)[1]";
    const validate = await this.isElementExisted(secondIframeXpath, mainFrame);
    if (validate) {
      await mainFrame.frameLocator(secondIframeXpath).locator('[placeholder="CVV"]').fill(cvv);
    } else {
      await mainFrame.locator('[placeholder="CVV"]').fill(cvv);
    }
  }

  async completeOrder() {
    await this.clickOnBtnWithLabel("Complete order");
    await this.page.waitForSelector("//div[@class='os-order-number']");
    await this.page.waitForSelector("//h2[@class='os-header__title']");
  }

  async inputCardInfoAndCompleteOrder(cardNumber: string, cardHolder: string, expireDate: string, cvv: string) {
    await this.enterCardNumber(cardNumber);
    await this.enterCardHolderName(cardHolder);
    await this.enterExpireDate(expireDate);
    await this.enterCVV(cvv);
    await this.clickBtnCompleteOrder();
  }

  async inputCardInfo(cardNumber: string, cardHolder: string, expireDate: string, cvv: string) {
    await this.enterCardNumber(cardNumber);
    await this.enterCardHolderName(cardHolder);
    await this.enterExpireDate(expireDate);
    await this.enterCVV(cvv);
  }

  /**
   * The method apply for complete edited order or checkout 3 pages checkout
   * @param card
   */
  async inputCardInfoAndPlaceOrder(card: Card) {
    await this.page.waitForSelector(`//div[@class='loader']`, {
      state: "detached",
      timeout: 10000,
    });
    await this.enterCardNumber(card.number);
    await this.enterCardHolderName(card.holder_name);
    await this.enterExpireDate(card.expire_date);
    await this.enterCVV(card.cvv);
    await this.clickBtnCompleteOrder();
  }

  /**
   * Complete order via Card
   * @param card
   * @param failReason an error string is displayed on the checkout page after a failed payment
   */
  async completeOrderWithCardInfo(card: Card, layout = "desktop", failReason?: string) {
    if (layout === "desktop") {
      await this.footerLoc.scrollIntoViewIfNeeded();
    }
    await this.enterCardNumber(card.number);
    await this.enterCardHolderName(card.holder_name);
    await this.enterExpireDate(card.expire_date);
    await this.enterCVV(card.cvv);
    await this.clickBtnCompleteOrder();
    if (failReason != undefined) {
      await this.page.waitForSelector(`//p[text()='${failReason}']`);
    }
  }

  async searchProduct(productName: string) {
    const searchLoc = "//input[@placeholder='Enter keywords...']";
    await this.page.locator(searchLoc).fill(productName);
    await this.page.locator(searchLoc).press("Enter");
  }

  /**
   * Change product quantity on Cart Page
   * @param productName Name of product that you wanna change quantity
   * @param quantity value of quantity that you want to buy
   */
  async inputProdquanOnCartPage(productName: string, quantity: number) {
    await this.page.waitForSelector(
      `//a[normalize-space()='${productName}']//ancestor::div[@class='product-cart__details']//input[@class='quantity__num']`,
    );
    await this.page
      .locator(
        `//a[normalize-space()='Yonex Astrox 66']//ancestor::div[@class='product-cart__details']//input[@class='quantity__num']`,
      )
      .fill(quantity.toString());
  }

  /**
   * Get selector of product in order summary by product's title
   * @param title title of product
   * @param version version of currently publishing theme
   * @returns selector
   */
  getProductSelectorInOrder(title: string, version = 2) {
    switch (version) {
      case 2:
        return `//span[normalize-space()='${title}']/ancestor::tr[contains(@class, 'checkout-product')]`;
      case 3:
        return `//a[normalize-space()='${title}']/ancestor::div[contains(@class, 'product-cart__details')]`;
    }
  }

  /**
   *
   * @param productName
   * @param productQty
   * @param optionInfos
   * @param productQtyClass
   */
  async addProductToCart(
    productName: string,
    productQty: string,
    optionInfos: Array<string> = null,
    productQtyClass?: string,
  ) {
    await this.page.locator(`(//span[normalize-space()='${productName}']//ancestor::a)[1]`).click();
    await this.page.waitForNavigation({ waitUntil: "networkidle" });
    if (!productQtyClass) {
      await this.page.locator(`(//div[@class='button-quantity' or @class='quantity']//input)[1]`).fill(productQty);
    } else {
      await this.page.locator(`(//div[@class='${productQtyClass}'])//input`).fill(productQty);
    }

    if (optionInfos) {
      for (const op of optionInfos) {
        await this.page.locator(`//div[@class='product__variant-button']//button[text()='${op}']`).click();
      }
    }
    if ((await this.page.locator("#add-to-cart").count()) === 1) {
      await this.page.locator("//button[@id='add-to-cart']").click();
    } else {
      await this.page.locator("(//div[@data-form='product']//*[child::span[text()='Add to cart']])[1]").click();
    }
  }

  /**
   * Click btn Checkout after addProductToCart
   */
  async clickCheckoutBtn() {
    await this.page.locator(`//button[normalize-space()='Checkout']`).click();
    await this.waitForCheckoutPageCompleteRender();
  }

  async enterShippingAddress(shippingAddress: ShippingAddress) {
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
          await this.selectCountry(value);
          break;
        case "state":
          await this.selectStateOrProvince(value);
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
        case "social_id":
          await this.inputCustomerInfo("social-id", value);
          break;
      }
    }
    await this.clickBtnContinueToShippingMethod();
  }

  /**
   * Add data to form billing address
   * @param billingAddress
   */
  async enterBillingAddress(billingAddress: ShippingAddress) {
    await this.inputFirstName(billingAddress.first_name, "billing");
    await this.inputLastName(billingAddress.last_name, "billing");
    await this.inputAddress(billingAddress.address, "billing");
    await this.selectCountry(billingAddress.country, "billing");
    if (billingAddress.state) {
      await this.selectStateOrProvince(billingAddress.state, "billing");
    }
    await this.inputCity(billingAddress.city, "billing");
    if (billingAddress.zipcode) {
      await this.inputZipcode(billingAddress.zipcode, "billing");
    }
    if (billingAddress.social_id) {
      await this.inputCustomerInfo("social-id", billingAddress.social_id, "billing");
    }
  }

  /**
   * Get mail page with proxy, input email and openmail box
   * @param email
   */
  async openMailBox(email: string) {
    const mailBoxPage = new MailBox(this.page, this.domain);
    mailBoxPage.emailBuyer = email;
    return mailBoxPage;
  }

  /**
   * add products to cart to checkout,
   * input shipping address,
   * then navigate to payment method page (with default shipping method)
   * @param productInfo
   * @param shippingAddress
   * @param byPass404Error: auto reload page if catch 404 error. Sometime issue happened and disturb our sleep
   */
  async addProductToCartThenInputShippingAddress(
    productInfo: Array<Product>,
    shippingAddress: ShippingAddress,
    byPass404Error = false,
  ): Promise<void> {
    const homePage = new SFHome(this.page, this.domain);
    let productPage: SFProduct;

    for (const element of productInfo) {
      productPage = await homePage.searchThenViewProduct(element.name, element.option);
      await productPage.inputQuantityProduct(element.quantity);
      await productPage.addProductToCart();
      this.subtotal += productPage.priceStorefront * element.quantity;
    }

    // Wait for api create checkout complete
    await productPage.page.waitForLoadState("load");
    const checkout = await productPage.navigateToCheckoutPage(byPass404Error);
    await checkout.enterShippingAddress(shippingAddress);
    await checkout.continueToPaymentMethod();
  }

  // ========================================== PAYPAL =========================================

  /**
   * Log in to Paypal page/ popup
   * @param paypalAccount
   * @param page
   */
  async logInPayPalToPay(paypalAccount?: PaypalAccount, page = this.page) {
    if (!paypalAccount) {
      paypalAccount = this.defaultPaypalAccount;
    }
    const btnLogin = "//*[text()[normalize-space()='Log In'] or @class='btn full ng-binding' or @id='btnLogin']";
    await page.waitForSelector(
      `//*[@id='paypalLogo' or @aria-label='PayPal Logo' or @aria-labelledby='paypal-logo' or @data-testid='paypal-logo-new']`,
    );

    // Comment because this xpath can be found but not display. Need monitoring.
    for (let i = 0; i < 3; i++) {
      // Use for loop to handle case: sometimes paypal popup will show error message or required re-fill email
      await this.clickButtonLoginInPaypal(page);
      await this.fillEmailAndPasswordPaypal(paypalAccount, page);

      await this.byPassAcceptCookiePaypal();
      await page.locator(btnLogin).click();

      const [isError, isLoading] = await Promise.all([
        this.isElementExisted(`//a[normalize-space()='Try Again']`, page),
        this.isElementExisted(`(//p[normalize-space()='Getting your wallet.'])[1]`, page, 5000),
      ]);

      if (isError) {
        await page.click(`//a[normalize-space()='Try Again']`);
      } else if (isLoading) {
        break;
      } else {
        break;
      }
    }

    await page.waitForSelector(`(//p[normalize-space()='Getting your wallet.'])[1]`, { state: "hidden" });
  }

  // Click button login in paypal popup when popup show required create account
  async clickButtonLoginInPaypal(page = this.page) {
    const xpathHaveAPayPalAccount = "//p[normalize-space()='Have a PayPal account?'][1]";
    const btnLogin = "//*[text()[normalize-space()='Log In'] or @class='btn full ng-binding' or @id='btnLogin']";
    const isBtnLoginShow = await this.isElementExisted(xpathHaveAPayPalAccount, page, 1000);
    if (isBtnLoginShow) {
      //sandbox in dev env have some different change
      await page.click(btnLogin);
    }
  }

  // Fill email and password in paypal popup
  async fillEmailAndPasswordPaypal(paypalAccount: PaypalAccount, page = this.page) {
    const textBoxEmail = "//*[@id='login' or @id='passwordSection']//input[@id='email']";
    const textBoxPwd = "//*[@id='login' or @id='passwordSection']//input[@id='password']";
    await page.locator(textBoxEmail).fill(paypalAccount.username);
    if (await page.locator(`//*[@id='btnNext']`).isVisible()) {
      // btn next sometimes is visible
      await page.locator(`//*[@id='btnNext']`).click();
      await page.waitForTimeout(1000);
      const isFillEmailSuccess = await this.isElementExisted(
        `(//span[normalize-space()='${paypalAccount.username}'])[1]`,
        page,
      );
      if (!isFillEmailSuccess) {
        try {
          await page.locator(textBoxEmail).fill(paypalAccount.username, { timeout: 3000 });
          await page.locator(`//*[@id='btnNext']`).click({ timeout: 3000 });
        } catch {
          await page.locator(textBoxPwd).fill(paypalAccount.password);
          return;
        }
      }
    }
    await page.locator(textBoxPwd).fill(paypalAccount.password);
  }

  /**
   * Click btn Pay now on PayPal page/ popup
   * @param page page/ popup
   */
  async clickPayNowBtnOnPayPal(page = this.page) {
    await this.byPassAcceptCookiePaypal(page);
    await page.locator(this.xpathSubmitBtnOnPaypal).click();
  }

  /**
   * Backup for case btnAcceptCookie will cover the btn need to show
   * @param page page/ popup
   */
  async byPassAcceptCookiePaypal(page = this.page) {
    if (await this.isElementExisted(this.xpathBtnAcceptCookie, page, 1000)) {
      await page.locator(this.xpathBtnAcceptCookie).click();
    }
  }

  /**
   * After click Complete order on Checkout page, use this func to complete order with PayPal
   * @param paypalAccount default with this.defaultPaypalAccount
   * @param page default with this.page
   */
  async logInPayPalThenClickPayNow(paypalAccount?: PaypalAccount, page = this.page): Promise<string> {
    if (!paypalAccount) {
      paypalAccount = this.defaultPaypalAccount;
    }
    await this.logInPayPalToPay(paypalAccount, page);

    await this.clickPayNowBtnOnPayPal(page);
    const totalOrderSandboxPaypal = await this.getTextContent(this.xpathTotalOrderSandboxPaypal, page);
    await this.waitForEventCompleted(this.domain, "purchase", 200000);
    await this.waitForPageRedirectFromPaymentPage();
    return totalOrderSandboxPaypal;
  }

  /**
   * From CO page, complete order with PayPal method: PayPal Smart Btn
   * Step: Click btn PayPal -> Sign in and confirm paynow in paypal popup
   * @param paypalAccount
   * @param xpathPPSmtBtn
   * @param isPaymentShield
   */
  async completeOrderWithPayPalPopUpFlow(
    paypalAccount: PaypalAccount = this.defaultPaypalAccount,
    btnPaypalExpress: Locator,
  ) {
    // Paying with PayPal from checkout page
    const [popup] = await Promise.all([this.page.waitForEvent("popup", { timeout: 5000 }), btnPaypalExpress.click()]);
    await popup.waitForLoadState();
    const totalOrderSandboxPaypal = await this.logInPayPalThenClickPayNow(paypalAccount, popup);
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
  async completeOrderViaPayPal(paypalAccount: PaypalAccount = this.defaultPaypalAccount): Promise<string> {
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
    const totalOrderSandboxPaypal = await this.logInPayPalThenClickPayNow(paypalAccount);
    return totalOrderSandboxPaypal;
  }

  /**
   * Redirect to PayPal.com: Customers will continue their payment on Paypal.com
   */
  async completeOrderViaPayPalSmartButtonRedirect(paypalAccount: PaypalAccount = this.defaultPaypalAccount) {
    const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
    await paymentMethodListIframe.locator("//img[@alt='paypal-icon']").click();

    const totalOrderSandboxPaypal = await this.logInPayPalThenClickPayNow(paypalAccount);

    return totalOrderSandboxPaypal;
  }

  /**
   * Complete the order with Paypal Buy now pay later
   * It will open the payment input form and fill the corresponding information there.
   * @param paypalAccount default with account "buyer@shopbase.com"
   * @param isPaymentShield
   */
  async completeOrderViaPaypalBNPL(paypalAccount: PaypalAccount = this.defaultPaypalAccount, isPaymentShield = false) {
    await this.selectPaymentMethod("PayPal");

    let xpathIframeBtnBNPL = "(//iframe[@title='PayPal'])";
    const quantityOfIframePP = await this.page.locator(xpathIframeBtnBNPL).count();
    if (quantityOfIframePP === 5) {
      xpathIframeBtnBNPL = xpathIframeBtnBNPL + "[4]";
    } else {
      xpathIframeBtnBNPL = xpathIframeBtnBNPL + "[2]";
    }

    const xpathBtnBNPL = "//div[@class='paypal-button-label-container']//span[text()='Pay Later']";
    let paypalFrame = this.page;

    // Handling case user is in FS Payment shield
    let paymentMethodListIframe;
    if (await this.isElementExisted(this.xpathPaymentMethodListIframe)) {
      paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
      paypalFrame = paymentMethodListIframe;
      if (isPaymentShield) {
        paypalFrame = paymentMethodListIframe.frameLocator("//iframe[contains(@class,'paypal-frame-form-wrapper')]");
      }
    }

    // PayPal Paylater phải proxy sang country khác => render chậm => cần timeout lâu
    await paypalFrame.locator(xpathIframeBtnBNPL).waitFor({ state: "visible", timeout: 10000 });

    await this.footerLoc.scrollIntoViewIfNeeded();
    // Wait for PayPal button render when run on server
    await this.page.waitForTimeout(5000);

    // Click PayPal Pay Later button
    const [popup] = await Promise.all([
      this.page.waitForEvent("popup", { timeout: 5000 }),
      paypalFrame.frameLocator(xpathIframeBtnBNPL).locator(xpathBtnBNPL).click(),
    ]);
    await popup.waitForLoadState();

    // Log in to PayPal
    await this.logInPayPalToPay(paypalAccount, popup);
    const totalOrderSandboxPaypal = await this.getTextContent(this.xpathTotalOrderSandboxPaypal, popup);
    const popupFrame = popup.frameLocator(`//iframe[@data-testid='cap-iframe']`);

    // Actions to complete checkout viw Paypal Pay Later
    await popup.check(`(//div[contains(@class,'PayLater')]/descendant::span[contains(@class,'check_icon')])[1]`);
    await this.clickPayNowBtnOnPayPal(popup);
    await popupFrame.locator(`//button[normalize-space()='Continue']`).click();
    await popupFrame.locator(`//button[normalize-space()='Agree and Apply']`).click();
    await popupFrame.locator(`//button[descendant::p[contains(text(),'CREDIT UNION')]]`).click();
    await popupFrame.locator(`//label[@class='ppvx_checkbox__label']`).click();
    await popupFrame.locator(`//button[normalize-space()='Agree and Continue']`).click();
    await popup.locator(`//button[normalize-space()='Pay Now']`).click();
    await this.waitForPageRedirectFromPaymentPage();
    return totalOrderSandboxPaypal;
  }

  /**
   * Complete the order with item PPC via Paypal Buy now pay later
   */
  async completePaymentForPPCItemViaPayPalBNPL() {
    await this.waitUntilElementVisible(this.xpathSubmitBtnOnPaypal);
    await this.byPassAcceptCookiePaypal();
    await this.clickPayNowBtnOnPayPal();
    await this.waitForPageRedirectFromPaymentPage();
  }

  /**
   * Use for checkout Paypal express
   * @param paypalAccount
   * @deprecated the old flow
   */
  async completeOrderViaPPExpress(paypalAccount: PaypalAccount = this.defaultPaypalAccount) {
    await this.page.locator(`//div[normalize-space()='Express Checkout']`).scrollIntoViewIfNeeded();
    // Wait for paypal button render
    await this.page.waitForTimeout(5000);

    // Declare elements
    await this.page.waitForLoadState();
    const xpathIframeExpressOnCOPage =
      "(//div[contains(@id,'paypal-smart-button')]//iframe[@allowpaymentrequest='allowpaymentrequest'])[1]";

    const xpathBtnPPExpressOnCOPage = "//div[@data-funding-source='paypal']//div[1]";

    const btnPaypalExpress = this.page.frameLocator(xpathIframeExpressOnCOPage).locator(xpathBtnPPExpressOnCOPage);
    const totalOrderSandboxPaypal = await this.completeOrderWithPayPalPopUpFlow(paypalAccount, btnPaypalExpress);
    await this.page.waitForTimeout(5000); // wait for autofill completely
    return totalOrderSandboxPaypal;
  }

  /**
   * Use for checkout Paypal express new flow - include CO page, Product page, Cart page
   * @param paypalAccount
   */
  async completeOrderViaNewPPExpress(paypalAccount: PaypalAccount = this.defaultPaypalAccount): Promise<string> {
    const btnPaypalExpress = await this.genButtonPPExpress();
    await this.page.evaluate("window.scrollTo(0, 0)"); // Scroll to the top of the page
    const totalOrderOnPayPalPage = await this.completeOrderWithPayPalPopUpFlow(paypalAccount, btnPaypalExpress);
    return totalOrderOnPayPalPage;
  }

  /**
   * New flow Express CO
   * @returns
   */
  async genButtonPPExpress(): Promise<Locator> {
    let iframeExpress;
    const xpathIframeExpress =
      "(//div[contains(@id,'paypal-smart-button') or contains(@id,'paypal-button')]//iframe[@allowpaymentrequest='allowpaymentrequest'])[1]";
    const xpathBtnPPExpress = "//div[@data-funding-source='paypal']//div[1]";

    // Wait for paypal button render
    await this.page.waitForTimeout(6000);

    // Check if xpath Payment Shield exist
    const xpathIframePaymentShield =
      "(//iframe[@class='payment-express-checkout-frame' or contains(@id,'payment-express-checkout')])[1]";
    const isUsePaymentShield = await this.page.locator(xpathIframePaymentShield).isVisible();

    // Check if using Payment Shield to init iframe express
    if (isUsePaymentShield) {
      iframeExpress = this.page.frameLocator(xpathIframePaymentShield).frameLocator(xpathIframeExpress);
    } else {
      iframeExpress = this.page.frameLocator(xpathIframeExpress);
    }

    const btnPaypalExpress = iframeExpress.locator(xpathBtnPPExpress);
    return btnPaypalExpress;
  }

  /**
   * New flow Express CO
   * @returns
   */
  async clickButtonExpressAndLoginToPP(): Promise<Page> {
    const btnPaypalExpress = await this.genButtonPPExpress();
    const [popup] = await Promise.all([this.page.waitForEvent("popup"), btnPaypalExpress.click()]);
    // Wait for paypal popup completely load
    await popup.waitForSelector(`//p[@class='loader']`, { state: "visible" });
    await this.logInPayPalToPay(this.defaultPaypalAccount, popup);
    await this.byPassAcceptCookiePaypal(popup);
    return popup;
  }

  async getCartSummaryInPaypalByField(popup: Page, field: string): Promise<number> {
    const cartSummary = `//div[child::span[normalize-space()='${field}']]/span[last()]`;
    const isFieldVisible = await popup.locator(cartSummary).isVisible();
    if (isFieldVisible) {
      return Number(removeCurrencySymbol(await popup.locator(cartSummary).textContent()));
    }
    return 0.0;
  }

  // Get order summary on paypal popup
  async getOrderSummaryOnPaypalPopUp(popup: Page = this.page): Promise<PaypalOrderSummary> {
    await popup.click(this.xpathCartSummaryOnPP);
    await popup.waitForSelector("(//div[normalize-space()='Your cart'])[1]");

    const [subtotal, taxes, discountValue, shippingDiscount, shippingValue, tippingValue, totalPrice] =
      await Promise.all([
        this.getCartSummaryInPaypalByField(popup, "Subtotal"),
        this.getCartSummaryInPaypalByField(popup, "Tax"),
        this.getCartSummaryInPaypalByField(popup, "Discount"),
        this.getCartSummaryInPaypalByField(popup, "Shipping Discount"),
        this.getCartSummaryInPaypalByField(popup, "Shipping"),
        this.getCartSummaryInPaypalByField(popup, "Handling"),
        this.getCartSummaryInPaypalByField(popup, "Total"),
      ]);
    const cartSummary: PaypalOrderSummary = {
      subtotal: subtotal,
      taxes: taxes,
      discount_value: discountValue,
      shipping_discount: shippingDiscount,
      shipping_value: shippingValue,
      tipping_value: tippingValue,
      total_price: totalPrice,
    };
    return cartSummary;
  }

  /**
   * Use for checkout Paypal smart button (using PayPal SDK)
   * @param paypalAccount
   * @param isPaymentShield
   */
  async completeOrderViaPPSmartButton(
    paypalAccount: PaypalAccount = this.defaultPaypalAccount,
    isPaymentShield = false,
  ) {
    await this.footerLoc.scrollIntoViewIfNeeded();
    // Wait for PayPal button render
    await this.page.waitForTimeout(5000);
    const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
    const xpathBtnPPExpressOnCOPage =
      "//div[contains(@class,'section--payment-method-list') or @id='payment-layout']//div[contains(@class,'paypal-buttons')][1] | //div[@class='smart-button']//div[contains(@class,'paypal-buttons')][1]";
    let btnPaypalExpress: Locator;
    await this.page.waitForTimeout(5000);
    btnPaypalExpress = this.page.locator(xpathBtnPPExpressOnCOPage);

    // Check payment shield
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      btnPaypalExpress = paymentMethodListIframe.locator(xpathBtnPPExpressOnCOPage);
    }
    if (isPaymentShield) {
      btnPaypalExpress = paymentMethodListIframe
        .frameLocator("//iframe[contains(@class,'paypal-frame-form-wrapper')]")
        .locator(xpathBtnPPExpressOnCOPage);
    }

    // Complete order
    const totalOrderSandboxPaypal = await this.completeOrderWithPayPalPopUpFlow(paypalAccount, btnPaypalExpress);
    return totalOrderSandboxPaypal;
  }

  /**
   * "Wait for 5 seconds <for some reason when run test suite in server need more couple of time to load>
   * Then submit pay now on paypal dashboard when click Buy with Paypal
   * Then wait for 5 seconds to autofill completely."
   * @param {PaypalAccount} paypalAccount - PaypalAccount = this.defaultPaypalAccount
   */
  async submitItemWhenClickBuyWithPaypal(paypalAccount: PaypalAccount = this.defaultPaypalAccount) {
    const btnBuyWithPaypal = this.page.locator("[class$=paypal-product__button]");
    // Wait for button Buy with paypal enabled
    await this.page.waitForSelector("//div[contains(@class,'paypal-product__custom-button--disabled')]", {
      state: "hidden",
    });
    // Wait for paypal button render
    await this.page.waitForTimeout(5000);
    await btnBuyWithPaypal.scrollIntoViewIfNeeded();

    await this.completeOrderWithPayPalPopUpFlow(paypalAccount, btnBuyWithPaypal);
    await this.page.waitForTimeout(5000); // wait for autofill completely
  }

  /**
   * Complete order via paypal credit card, required active paypal smart button
   * @param paypalCard number, expires date, csc
   */
  async completeOrdViaPPCreditCard(paypalCard: PaypalCard = this.defaultPaypalCard) {
    await this.page.waitForLoadState();
    await this.clickAgreedTermsOfServices();
    const xpathIframebtnPaypalCreditCard =
      "(//div[contains(@id,'paypal-smart-button')]//iframe[@allowpaymentrequest='allowpaymentrequest'])[last()]";
    let btnPaypalCreditCard;
    btnPaypalCreditCard = this.page
      .frameLocator(xpathIframebtnPaypalCreditCard)
      .locator(`//div[span[contains(text(),'Debit or Credit Card')]]`);
    //flow with fs payment shield
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
      btnPaypalCreditCard = paymentMethodListIframe
        .frameLocator(xpathIframebtnPaypalCreditCard)
        .locator(`//div[span[contains(text(),'Debit or Credit Card')]]`);
    }
    // Wait for paypal button render
    await this.page.waitForTimeout(5000);
    // Paying with PayPal from checkout page
    try {
      const [popup] = await Promise.all([
        this.page.waitForEvent("popup", { timeout: 5000 }),
        btnPaypalCreditCard.click(),
      ]);
      await this.inputPPCardAndCompleteOrderInPopup(paypalCard, popup);
    } catch {
      await btnPaypalCreditCard.click();
      await this.inputPPCardAndCompleteOrder(paypalCard);
    }
  }

  /**
   * Complete order via paypal credit card, required active paypal smart button
   * @param paypalCard number, expires date, csc
   */
  async inputPPCardAndCompleteOrderInPopup(paypalCard: PaypalCard = this.defaultPaypalCard, popup: Page) {
    await popup.waitForLoadState();

    // Fill cart info in paypal credit card iframe
    const droplistCountry = popup.locator(`//select[@id='country']`);
    await droplistCountry.click();
    await droplistCountry.selectOption({ value: paypalCard.country });
    await popup.waitForSelector(`//*[contains(@class,'Spinner')]`, { state: "visible" });
    await Promise.all([
      popup.waitForSelector(`//*[contains(@class,'Spinner')]`, { state: "hidden" }),
      popup.waitForLoadState("networkidle"),
    ]);
    await popup.locator(`//input[@id='cardNumber']`).fill(paypalCard.number);
    await popup.locator(`//input[@id='cardExpiry']`).fill(paypalCard.expires_date);
    await popup.locator(`//input[@id='cardCvv']`).fill(paypalCard.csc);
    await popup.locator(`//input[@id='firstName']`).fill(paypalCard.first_name);
    await popup.locator(`//input[@id='lastName']`).fill(paypalCard.last_name);
    await popup.locator(`//input[@id='billingLine1']`).fill(paypalCard.stress_address);
    await popup.locator(`//input[@id='billingLine2']`).fill(paypalCard.aria_desc);
    await popup.locator(`//input[@id='billingCity']`).fill(paypalCard.city);
    const droplistState = popup.locator(`//select[@id='billingState']`);
    await droplistState.click();
    await droplistState.selectOption({ label: paypalCard.state });
    await popup.locator(`//input[@id='billingPostalCode']`).fill(paypalCard.zip_code);
    await popup.locator(`//input[@id='phone']`).fill(paypalCard.phone_number);
    await popup.locator(`//input[@id='email']`).fill(paypalCard.email);
    await popup.locator(`//button[@data-testid='pomaGuestSubmitButton']`).click();
  }

  /**
   * Complete order via paypal credit card, required active paypal smart button
   * @param paypalCard number, expires date, csc
   */
  async inputPPCardAndCompleteOrder(paypalCard: PaypalCard = this.defaultPaypalCard) {
    const frameLoc = this.page
      .frameLocator(
        `(//div[contains(@id,'paypal-smart-button')]//iframe[@allowpaymentrequest='allowpaymentrequest'])[last()]`,
      )
      .frameLocator(`(//div[@id='card-fields-container']//iframe)[1]`);

    // Fill cart info in paypal credit card iframe
    await frameLoc.locator(`//input[@id='credit-card-number']`).fill(paypalCard.number);
    await frameLoc.locator(`//input[@id='expiry-date']`).fill(paypalCard.expires_date);
    await frameLoc.locator(`//input[@id='credit-card-security']`).fill(paypalCard.csc);
    await frameLoc.locator(`//button[@id='submit-button']`).click();

    // Fill billing address in paypal credit card iframe if it's shown
    const isFormBillingAddressShown = await this.isElementExisted(`//p[normalize-space()='Billing address']`, frameLoc);
    if (isFormBillingAddressShown) {
      await this.reFillFormPaypalBillingAddress();
    }
    await this.waitUntilElementInvisible(`//button[@id='submit-button']`);
  }

  /**
   * This function fills in the billing address form for PayPal payment and submits it.
   */
  async reFillFormPaypalBillingAddress() {
    const frameLoc = this.page
      .frameLocator(
        `(//div[contains(@id,'paypal-smart-button')]//iframe[@allowpaymentrequest='allowpaymentrequest'])[last()]`,
      )
      .frameLocator(`(//div[@id='card-fields-container']//iframe)[1]`);
    await frameLoc.locator(`//input[@id='familyName']`).fill("OCG");
    await frameLoc.locator(`//input[@id='phone']`).fill("2022206343");
    await frameLoc.locator(`//button[@id='submit-button']`).click();
  }

  async changeShippingAddressOnPaypalPopup(shippingAddress: ShippingAddress, popupPage: Page = this.page) {
    const selectCountryField = popupPage.locator(`//select[@id='country']`);
    const firstNameField = popupPage.locator(`//input[@id='addressFirstName']`);
    const lastNameField = popupPage.locator(`//input[@id='addressLastName']`);
    const addressField = popupPage.locator(`//input[@autocomplete='street-address']`);
    const cityField = popupPage.locator(`//input[@id='city']`);
    const stateField = popupPage.locator(`//select[@id='state']`);
    const zipCodeField = popupPage.locator(`//input[@id='postalCode']`);

    await popupPage.click(`//button[normalize-space()='Change']`);
    await popupPage.click(`//button[contains(text(),'Add a new address')]`);

    await selectCountryField.selectOption({ value: shippingAddress.country_code });
    await Promise.all([
      stateField.selectOption({ value: shippingAddress.state }),
      firstNameField.fill(shippingAddress.first_name),
      lastNameField.fill(shippingAddress.last_name),
      addressField.fill(shippingAddress.address),
      zipCodeField.fill(shippingAddress.zipcode),
      cityField.fill(shippingAddress.city),
    ]);
    await popupPage.click(`//button[normalize-space()='Save']`);
  }

  // ========================================== END PAYPAL =========================================

  /**
   * Complete the order with Ocean payment method
   * After checkout successfully display Thankyou page
   * @param cardInfo
   */
  async completeOrderViaOceanPayment(cardInfo: Card) {
    if (!cardInfo.oceanpayment_card) {
      cardInfo.oceanpayment_card = cardInfo.number;
    }
    await this.clickBtnCompleteOrder();
    await this.page.locator(`//input[@placeholder='Card Number']`).fill(cardInfo.oceanpayment_card);
    await this.page.locator(`//input[@placeholder='Expiration Date']`).fill(cardInfo.expire_date);
    await this.page.locator(`//input[@placeholder='Secure Code']`).fill(cardInfo.cvv);
    await this.page.locator(`//span[text()='PAY NOW']`).click();
    if (await this.isElementExisted("//input[@id='password']")) {
      await this.page.locator("//input[@id='password']").type("123456");
      await this.page.locator("//input[@id='submit_btn']").click();
    }
  }

  /**
   * Complete the order with Braintree method
   * After checkout successfully display Thankyou page
   * @param cardInfo
   */
  async completeOrderBrainTree(cardInfo: Card) {
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
      await paymentMethodListIframe
        .frameLocator(`//div[@id='creditCardNumber']//iframe`)
        .locator(`//input[@id='credit-card-number']`)
        .fill(cardInfo.number);
      await paymentMethodListIframe.locator(`//input[@placeholder='Cardholder name']`).fill(cardInfo.holder_name);
      await paymentMethodListIframe
        .frameLocator(`//div[@id='expireDate']//iframe`)
        .locator(`//input[@id='expiration']`)
        .fill(cardInfo.expire_date);
      await paymentMethodListIframe
        .frameLocator(`//div[@id='cvv']//iframe`)
        .locator(`//input[@id='cvv']`)
        .fill(cardInfo.cvv);
    } else {
      //flow without fs payment shield
      await this.page
        .frameLocator(`//div[@id='creditCardNumber']//iframe`)
        .locator(`//input[@id='credit-card-number']`)
        .fill(cardInfo.number);
      await this.page.fill(`//input[@placeholder='Cardholder name']`, cardInfo.holder_name);
      await this.page
        .frameLocator(`//div[@id='expireDate']//iframe`)
        .locator(`//input[@id='expiration']`)
        .fill(cardInfo.expire_date);
      await this.page.frameLocator(`//div[@id='cvv']//iframe`).locator(`//input[@id='cvv']`).fill(cardInfo.cvv);
    }
    await this.clickBtnCompleteOrder();
  }

  /**
   * Complete the order with Ocean payment method
   * After checkout successfully display Thankyou page
   * @param cardInfo
   */
  async completeOrderViaPayoneer(cardInfo: Card) {
    await this.enterPayoneerCardInfo(cardInfo);
    await this.waitForPageRedirectFromPaymentPage();
  }

  /**
   * Enter card info for Payoneer payment method
   * @param cardInfo
   */
  async enterPayoneerCardInfo(cardInfo: Card) {
    //fill card number
    await this.page.locator(`//input[@id='VISA-number']`).fill(cardInfo.number);
    await this.page.waitForLoadState("networkidle");
    //fill card expire month
    const droplistMonth = this.page.locator(`//select[@id='VISA-expiryMonth']`);
    await droplistMonth.click();
    await droplistMonth.selectOption({ value: cardInfo.expire_month });
    //fill card expire year
    const droplistYear = this.page.locator(`//select[@id='VISA-expiryYear']`);
    await droplistYear.click();
    await droplistYear.selectOption({ value: cardInfo.expire_year });
    //fill card cvv
    await this.page.locator(`//input[@id='VISA-verificationCode']`).fill(cardInfo.cvv);
    //fill card holder name
    await this.page.locator(`//input[@id='VISA-holderName']`).fill(cardInfo.holder_name);
    await this.page.locator(`//button[@id='payment-button']`).click();
    //handle 3ds
    if (cardInfo.is3ds) {
      switch (cardInfo.holder_name) {
        case "3ds2-challenge-identified":
          await this.clickBtnOKIn3dsPayoneerPopup();
          break;
        case "3ds2-frictionless-identified":
          await this.page.waitForSelector('//div[@id="op-3ds2-loader"]');
          break;
      }
    }
  }

  /**
   * The function clicks the "OK" button in a Payoneer popup that appears after a 3DS authentication
   * process.
   */
  async clickBtnOKIn3dsPayoneerPopup() {
    await this.page
      .frameLocator(`//iframe[@id="lb-iframe"]`)
      .frameLocator(`//iframe[@name="3ds2_iframe"]`)
      .locator(`//input[@type="submit"]`)
      .click();
  }

  /**
   * Click agreed term of services before complete order
   */
  async clickAgreedTermsOfServices() {
    const agreedTermsOfServices =
      "//div[normalize-space()='I have read and agreed to the'] | //label[@id='accept-tos']/span[contains(@class,'s-check')]";
    if (await this.page.locator(agreedTermsOfServices).isVisible()) {
      await this.page.locator(agreedTermsOfServices).check();
    }
  }

  async clickCompleteOrder() {
    await this.page.locator("//*[text()='Place your order' or text()='Complete order' or text()='Pay now']").hover();
    await this.page.locator("//*[text()='Place your order' or text()='Complete order' or text()='Pay now']").click();
  }

  async clickBtnCompleteOrder() {
    await this.clickAgreedTermsOfServices();
    await this.clickCompleteOrder();
  }

  /**
   *get actual order status after refund, cancel
   *@param refund true = refund, false = cancel
   *@return <string> status order
   */
  async getStatusOrder(refund: boolean): Promise<string> {
    let statusOrder: string;
    if (refund) {
      statusOrder = await this.page.innerText("//span[@class='s-tag hide-when-printing is-warning']/span");
    } else {
      statusOrder = await this.page.innerText(
        "//div[@class='title-bar__orders-show-badge']//span[@class='s-tag is-danger']",
      );
    }
    return statusOrder;
  }

  async getOrderNumber(): Promise<string> {
    const result = await this.getTextContent("//div[@class='os-order-number']");
    return String(result.replace("Order ", ""));
  }

  async getProductPriceOnOrder(): Promise<string> {
    let prodPrice = await this.getTextContent(`(//td[@class='checkout-product__price']//span)[1]`);
    prodPrice = prodPrice.replace(",", ".");
    return prodPrice;
  }

  async getShippingFeeOnOrderSummary(): Promise<string> {
    await this.page.waitForSelector('//td[normalize-space()="Total:"]');
    let shippingFee = "0";
    const xpathShipFee = `//tr[child::td[text()='Shipping']]//span[@class='order-summary__emphasis'] | //tr[child::td[text()='Shipping']]//span[@class='order-summary__small-text']`;
    if (await this.page.locator(xpathShipFee).isVisible()) {
      shippingFee = await this.getTextContent(xpathShipFee);
    }
    if (shippingFee !== "Free" && shippingFee !== "Calculated at next step") {
      shippingFee = removeCurrencySymbol(shippingFee);
      shippingFee = shippingFee.replace(",", ".");
    }
    return shippingFee;
  }

  async getSubtotalOnOrderSummary(): Promise<string> {
    let subTotal = "";
    subTotal = await this.getTextContent(`//td[text()[normalize-space()='Subtotal']]//following-sibling::td`);
    subTotal = subTotal.replace(",", ".");
    return subTotal;
  }

  async getOriginShippingRate(): Promise<number> {
    const res = await this.page.request
      .get(`https://${this.domain}/api/checkout/${this.checkoutToken}/info.json`)
      .then(res => res.json());
    return res.result.totals.shipping_fee;
  }

  /**
   *
   * @param timeout for back-end calculate tax then display
   * @returns
   */
  async getTaxOnOrderSummary(timeout = 4000): Promise<string> {
    let taxFee = "0";
    if (await this.isElementExisted("//td[normalize-space()='Taxes']//following-sibling::td//span", null, timeout)) {
      taxFee = await this.getTextContent(`//td[normalize-space()='Taxes']//following-sibling::td//span`);
      taxFee = removeCurrencySymbol(taxFee);
      return taxFee;
    }
    const isTaxInclude = await this.page.locator("//tr[normalize-space()='(Tax included)']").isVisible();
    if (isTaxInclude) {
      taxFee = "Tax included";
    }
    return taxFee;
  }

  async getTotalOnOrderSummary(): Promise<string> {
    const total = await this.getTextContent(
      `(//div[contains(@class,'order-summary')]//span[@class='payment-due__price'])[1]`,
    );
    return total;
  }

  async getProductPrice(prodName: string): Promise<string> {
    return await this.getTextContent(
      `//span[normalize-space()='${prodName}']//parent::td//following-sibling::td[@class='checkout-product__price']//span`,
    );
  }

  async calculateShippingRate(exchangeRate: number): Promise<number> {
    const originShippingFee = await this.getOriginShippingRate();
    return originShippingFee * exchangeRate;
  }

  async getOriginSubtotal() {
    const res = await fetch(`${this.domain}/api/checkout/${this.checkoutToken}/info.json`).then(res => res.json());
    return res.result.totals.subtotal_price;
  }

  async calculateSubtotal(prodPriceDashboard: number, quantity: number): Promise<number> {
    return prodPriceDashboard * quantity; // 10.99 *1
  }

  /**
   * enter discount code and click apply button
   * @param code
   */
  async enterAndApplyDiscount(code: string) {
    const xpathLoadingButton = "//button[contains(@class, 'is-loading') and normalize-space()='Apply']";
    await this.waitUntilElementInvisible(xpathLoadingButton);
    await this.inputDiscountBox.click();
    await this.inputDiscountBox.fill(code);
    await this.inputDiscountBox.evaluate(e => e.blur());
    await this.clickOnBtnWithLabel(`Apply`);
    await this.waitUntilElementInvisible(xpathLoadingButton);
  }

  /**
   * apply discount code to order > expect is success
   * @param code
   */
  async applyDiscountCode(code: string, verified = true) {
    await this.enterAndApplyDiscount(code);
    if (verified) {
      await this.waitUntilElementVisible(`//span[normalize-space()='Discount']//parent::td`);
    }
  }

  /**
   * Verify that the warning message is displayed after apply discount code
   * @param message message that you want to verify
   * @returns
   */
  async isWaringMessDiscountDisplayed(message: string) {
    await this.waitUntilElementInvisible("//button[contains(@class, 'is-loading') and normalize-space()='Apply']");
    return await this.page
      .locator(
        `(//div[contains(@class, 'notice--warning')]//div[normalize-space()='${message}']) | (//p[contains(@class,'message--error') and contains(text(),'${message}')])`,
      )
      .isVisible();
  }

  async getDiscountValOnOrderSummary(): Promise<string> {
    let discountVal = "0";
    if (await this.isDiscApplied()) {
      discountVal = await this.getTextContent(
        `(//span[normalize-space()='Discount']/following::span[@class='order-summary__emphasis'])[1]`,
      );
      discountVal = discountVal.replace(",", ".");
      if (discountVal !== "Free shipping") {
        discountVal = removeCurrencySymbol(discountVal);
      }
    }
    return discountVal;
  }

  async getDiscountCodeOnOrderSummary(): Promise<string> {
    let discountCode = "";
    if (await this.isDiscApplied()) {
      discountCode = await this.getTextContent(
        `//span[normalize-space()='Discount']//ancestor::tr//span[@class='reduction-code__text']`,
      );
    }
    return discountCode;
  }

  async getExtraFeeOnOrderSummary(): Promise<string> {
    let extraFee = "0";
    const xpathExtraFee = `//td[normalize-space()='Cash on Delivery fee']//ancestor::tr//span[@class='order-summary__emphasis']`;
    if (await this.isElementVisibleWithTimeout(xpathExtraFee)) {
      extraFee = await this.getTextContent(xpathExtraFee);
    }
    return extraFee;
  }

  async calculateDiscount(exchangeRate: number): Promise<number> {
    const rs = await this.getOriginCheckoutInfoByAPI();
    const discountVal = Number(rs.result.totals.total_discounts) * exchangeRate;
    return discountVal;
  }

  /**
   * go to order printbase detail page
   * @param orderId
   * @param accessToken
   * */
  async openOrderPrintbaseByAPI(orderId: number, accessToken: string) {
    await this.page.goto(`https://${this.domain}/admin/pod/orders/${orderId}?x_key=${accessToken}`);
    return new OrdersPage(this.page, this.domain);
  }

  /**
   * Use to open order detail directly from thankyou page without login step
   * @param orderId
   * @param accessToken
   * @param shopType
   * @returns orderPgae
   */
  async openOrderByAPI(orderId: number, accessToken?: string, shopType?: "shopbase" | "printbase" | "plusbase") {
    // let url: string; => Pilot check open order without waiting API
    let linkAdmin: string;
    switch (shopType) {
      case "printbase":
        // url = `/admin/pbase-orders/${orderId}.json`;
        linkAdmin = `https://${this.domain}/admin/pod/orders/${orderId}?x_key=${accessToken}`;
        break;
      case "plusbase":
        // url = `/admin/orders/plusbase/${orderId}.json`;
        linkAdmin = `https://${this.domain}/admin/orders/${orderId}?x_key=${accessToken}`;
        break;
      default:
        // url = `/admin/orders/${orderId}.json`;
        linkAdmin = `https://${this.domain}/admin/orders/${orderId}?x_key=${accessToken}`;
        break;
    }
    await Promise.all([
      // this.page.waitForResponse(response => response.url().includes(url) && response.status() === 200, {
      //   timeout: 40000,
      // }),
      this.page.goto(linkAdmin, { timeout: 120000 }),
    ]);
    await this.page.waitForSelector(`(//div[@class='card__section'])[1]`);
    return new OrdersPage(this.page, this.domain);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOriginCheckoutInfoByAPI(): Promise<any> {
    const response = await this.page.request.get(`https://${this.domain}/api/checkout/${this.checkoutToken}/info.json`);
    expect(response.status).toBe(200);
    return await response.json();
    // .then(res => res.json());
  }

  async getOriginTax(exchangeRate: number) {
    const rs = await this.getOriginCheckoutInfoByAPI();
    const tax = Number(rs.result.totals.total_tax) * exchangeRate;
    return roundingTwoDecimalPlaces(tax);
  }

  async getOrderIdBySDK(): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.page.evaluate(() => (window as any).sbsdk.checkout.getOrder().id);
  }

  async getLineItemIdBySDK(): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.page.evaluate(() => (window as any).sbsdk.checkout.getOrder().items[0].id);
  }

  async getOrderName(): Promise<string> {
    return (await this.getTextContent(`//div[@class='os-order-number'] | //span[@value="order.name"]`)).replace(
      "Order ",
      "",
    );
  }

  /** Get subtotal, shipping fee, tip, discount after checkout
   * @param isTip
   * @param isDiscount
   * @param isPostPurchase
   */
  async getOrderSummary(isTip: boolean, isDiscount: boolean, isPostPurchase: boolean) {
    this.subtotal = Number(removeCurrencySymbol(await this.getSubtotalOnOrderSummary()));
    this.tip = 0;
    if (isTip) {
      this.tip = Number(removeCurrencySymbol(await this.getTipOnOrderSummary()));
    }
    this.discount = 0;
    if (isDiscount) {
      const discountValue = (await this.getDiscountValOnOrderSummary()).replace("-", "");
      if (discountValue.startsWith("Free")) {
        this.discount = this.shipping;
      } else {
        this.discount = Number(removeCurrencySymbol(discountValue));
      }
    }
    if (isPostPurchase) {
      await this.setShippingFee();
    }
    this.total = Number(removeCurrencySymbol(await this.getTotalOnOrderSummary()));
    return [this.subtotal, this.shipping, this.tip, this.discount, this.total];
  }

  async getCustomerEmail(): Promise<string> {
    return await this.getTextContent(`//*[contains(text(),'Contact information')]//following-sibling::p[1]`);
  }

  async getCustomerName(): Promise<string> {
    return (await this.getTextContent(`//*[normalize-space()='Shipping address']/following::address[1]`)).split(
      "\n",
    )[0];
  }

  // ============================================= checkout post-purchase =============================================

  /**
   * Get selector of product on post purchase (PPC) offer by product's title
   * @param title title of product
   * @param version version of currently publishing theme
   * @returns selector
   */
  getProductSelectorOnPPC(title: string, version = 2) {
    let container = "";
    switch (version) {
      case 2:
        container = "upsell-only-blocks";
        break;
      case 3:
        container = "product-post-purchase";
        break;
    }
    return `//a[normalize-space()='${title}']/ancestor::div[contains(@class, '${container}')]`;
  }

  /**
   * Add quantity product post purchase to cart.
   * @param quantity
   * @param productName
   */
  async inputQuantityPostPurchase(quantity: string, productName: string) {
    const xpathQuantityPostPurchase = `(//div[contains(@class,'post-purchase') and descendant::*[text()[normalize-space()='${productName}']]])[1]//input[@type='number']`;
    await this.page.locator(xpathQuantityPostPurchase).fill(quantity);
  }

  /**
   * Add product post purchase to cart.
   * It will open the popup post purchase and then click add to cart the selected product.
   * @param productName
   * There are 2 actions with popup purchase:
   *  - product name is empty | null | undefined -> close popup post purchase
   *  - product name is not empty -> add product post purchase to cart
   */
  async addProductPostPurchase(productName?: string | null | undefined) {
    if (!productName) {
      if (await this.isPostPurchaseDisplayed()) {
        await this.page.locator(this.xpathClosePPCPopUp).click();
      }
      return null;
    }
    const addItemPostPurchase =
      `//*[normalize-space()="${productName}"]//ancestor::div[contains(@class,'product-post-purchase') or` +
      ` contains(@class,'upsell-relative upsell-only-blocks') or contains(@class,'upsell-product')]//button`;

    this.itemPostPurchaseValue = removeCurrencySymbol(
      await this.getTextContent(
        `//*[normalize-space()="${productName}"]//ancestor::div[contains(@class,'product-post-purchase') or` +
          ` contains(@class,'upsell-relative upsell-only-blocks') or contains(@class,'upsell-product')]` +
          `//div[contains(@class,'product-sale-price') or contains(@class,'upsell-color-price')]`,
      ),
    );
    await this.waitUntilElementVisible(addItemPostPurchase);
    await this.page.locator(addItemPostPurchase).click();
    // Then wait for action add PPC almost done
    await this.waitUntilElementInvisible(addItemPostPurchase);
    return this.itemPostPurchaseValue;
  }

  /** Verify popup post purchase is displayed or not
   * @param timeout: time to wait pop-up PPC display
   */
  async isPostPurchaseDisplayed(timeout = 10000): Promise<boolean> {
    return await this.isElementExisted(this.xpathClosePPCPopUp, null, timeout);
  }

  /** Complete order when adding item post purrchase
   * @param paymentMethod: payment method
   * Some specific method such as Paypal, Bancontact, iDEAL, giropay need one more step to complete order
   * @default: with other method just need to wait for popup PPC to close
   */
  async completePaymentForPostPurchaseItem(
    paymentMethod?: string,
    cardInfo = this.defaultCardInfo,
    klanaGatewayInfo = this.defaultKlarnaGatewayInfo,
  ) {
    switch (paymentMethod) {
      case PaymentMethod.STRIPE:
      case PaymentMethod.SHOPBASEPAYMENT:
        return await this.waitUntilElementInvisible("//div[contains(text(),'Offer will end')]");
      case PaymentMethod.PAYPAL:
      case "Paypal":
      case PaymentMethod.PAYPALEXPRESS:
      case PaymentMethod.BUYWITHPAYPAL:
      case PaymentMethod.PAYPALSMARTBTN:
      case PaymentMethod.PAYPALBNPL:
        await this.clickPayNowBtnOnPayPal();
        await this.waitForPageRedirectFromPaymentPage();
        break;
      case PaymentMethod.PAYPALCREDIT:
        await this.logInPayPalThenClickPayNow();
        break;
      case "Bancontact":
      case "iDEAL":
      case "Sofort":
      case "Afterpay":
      case "giropay":
        await this.page.locator(`//*[normalize-space()='Authorize Test Payment']`).click();
        await this.waitForPageRedirectFromPaymentPage();
        break;
      case "OceanPayment":
        await this.page.locator(`//input[@placeholder='Card Number']`).fill(cardInfo.number);
        await this.page.locator(`//input[@placeholder='Expiration Date']`).fill(cardInfo.expire_date);
        await this.page.locator(`//input[@placeholder='Secure Code']`).fill(cardInfo.cvv);
        await this.page.locator(`//span[text()='PAY NOW']`).click();
        if (await this.isElementExisted("//input[@id='password']")) {
          await this.page.locator("//input[@id='password']").type("123456");
          await this.page.locator("//input[@id='submit_btn']").click();
        }
        await this.waitForPageRedirectFromPaymentPage();
        break;
      case "Asiabill":
        await this.completeOrderAsiabill(cardInfo);
        break;
      case "cardpay":
      case "Unlimint":
        await this.page.locator("//input[@id='input-card-cvc']").fill(cardInfo.cvv);
        await this.page.locator("//input[@value='Pay']").click();
        break;
      case "Klarna":
        await this.completedOrderViaKlarna(klanaGatewayInfo, true);
        return this.total;
        break;
      case PaymentMethod.PAYONEER:
        await this.completeOrderViaPayoneer(cardInfo);
        break;
      default:
        await this.waitUntilElementInvisible("//div[contains(text(),'Offer will end')]");
    }
    return new OrdersPage(this.page, this.domain);
  }

  /** Select then complete order with different payment method
   * @param paymentMethod
   * @param cardInfo
   * @param paypalAccount
   * @param buyerPhoneNumber
   * @param otp
   * @param isPaymentShield
   */
  async completeOrderWithMethod(
    paymentMethod = "Stripe",
    cardInfo: Card = this.defaultCardInfo,
    paypalAccount: PaypalAccount = this.defaultPaypalAccount,
    isPaymentShield = false,
    klarnaGatewayInfo: KlarnaGatewayInfo = this.defaultKlarnaGatewayInfo,
  ) {
    let totalOrderOnPaymentPage;
    // Cover case open checkout page 3 steps by linkz
    if (await this.page.locator(this.xpathBtnContinueToShipping).isVisible()) {
      await this.clickBtnContinueToShippingMethod();
      await this.page.waitForSelector(this.xpathBtnContinueToPaymentMethod);
    }
    if (await this.page.locator(this.xpathBtnContinueToPaymentMethod).isVisible()) {
      await this.continueToPaymentMethod();
    }
    switch (paymentMethod) {
      case "Stripe":
      case "Shopbase payment":
        await this.selectPaymentMethod();
        await this.completeOrderWithCardInfo(cardInfo);
        break;
      case "Spay reseller":
        await this.selectPaymentMethod();
        await this.completeOrderWithCardInfo(cardInfo);
        break;
      case "Bancontact":
      case "giropay":
        await this.selectPaymentMethod(paymentMethod);
        await this.completeOrderOnStripePage();
        break;
      case "iDEAL":
        await this.selectPaymentMethod(paymentMethod);
        await this.selectIdealBank(cardInfo.ideal_bank);
        await this.completeOrderOnStripePage();
        break;
      case "SEPA Direct Debit":
        await this.selectPaymentMethod(paymentMethod);
        await this.enterSepaCardInfo(cardInfo.sepa_card);
        await this.clickBtnCompleteOrder();
        break;
      case "OceanPayment":
        await this.completeOrderViaOceanPayment(cardInfo);
        break;
      case "Paypal":
      case "PayPal":
        await this.selectPaymentMethod("PayPal");
        totalOrderOnPaymentPage = await this.completeOrderViaPayPal(paypalAccount);
        break;
      case PaymentMethod.PAYPAL_SMART_BTN_REDIRECT:
        await this.selectPaymentMethod(paymentMethod);
        await this.completeOrderViaPayPalSmartButtonRedirect(paypalAccount);
        break;
      case "cod":
        await this.selectPaymentMethod(paymentMethod);
        await this.completeOrderViaManualPaymentMethod("cod");
        break;
      case "paypal-pro":
        await this.completeOrderWithPaypalPro(cardInfo);
        break;
      case "Unlimint":
      case "cardpay":
        await this.selectPaymentMethod(paymentMethod);
        await this.completeOrderUnlimint(cardInfo);
        break;
      case "BankTransfer":
        await this.selectPaymentMethod("bank_transfer");
        await this.completeOrderViaManualPaymentMethod("bank_transfer");
        break;
      case "CheckoutCom":
        await this.completeOrderCheckoutCom(cardInfo);
        break;
      case "Asiabill":
        await this.clickBtnCompleteOrder();
        await this.completeOrderAsiabill(cardInfo);
        break;
      case "PaypalBNPL":
      case PaymentMethod.PAYPALBNPL:
        await this.selectPaymentMethod(paymentMethod);
        await this.completeOrderViaPaypalBNPL(undefined, isPaymentShield);
        break;
      case "Paypal credit card":
        await this.selectPaymentMethod(paymentMethod);
        await this.completeOrdViaPPCreditCard();
        break;
      case "Paypal smart button":
        await this.clickAgreedTermsOfServices();
        await this.selectPaymentMethod(paymentMethod);
        await this.completeOrderViaPPSmartButton(this.defaultPaypalAccount, isPaymentShield);
        break;
      case "Paypal express - old":
        await this.completeOrderViaPPExpress();
        break;
      case "Paypal express":
        totalOrderOnPaymentPage = await this.completeOrderViaNewPPExpress();
        break;
      case "Afterpay":
        await this.xpathBlockPayment.scrollIntoViewIfNeeded();
        await this.selectPaymentMethod(PaymentMethod.AFTERPAY);
        await this.completeOrderOnStripePage();
        break;
      case "Sofort":
        await this.xpathBlockPayment.scrollIntoViewIfNeeded();
        await this.selectPaymentMethod(PaymentMethod.SOFORT);
        await this.completeOrderOnStripePage();
        break;
      case "Klarna":
        await this.xpathBlockPayment.scrollIntoViewIfNeeded();
        await this.selectPaymentMethod(PaymentMethod.KLARNA);
        await this.clickBtnCompleteOrder();
        await this.completedOrderViaKlarna(klarnaGatewayInfo);
        totalOrderOnPaymentPage = this.total;
        break;
      case "Braintree":
        await this.completeOrderBrainTree(cardInfo);
        break;
      case PaymentMethod.PAYONEER:
        await this.selectPaymentMethod(PaymentMethod.PAYONEER);
        await this.clickBtnCompleteOrder();
        await this.completeOrderViaPayoneer(cardInfo);
        break;
    }
    await this.waitForPageRedirectFromPaymentPage();
    return totalOrderOnPaymentPage;
  }

  async openOrderStatusPageByToken(orderToken: string) {
    await this.page.goto(`https://${this.domain}/orders/${orderToken}`);
    await this.page.waitForLoadState();
  }

  async loginToOrderPage(email: string, orderNumber: string) {
    await this.page.fill(this.xpathFieldEmailOnThkPage, email);
    await this.page.fill(this.xpathFieldOrderNumberOnThkPage, orderNumber);
    await this.page.click(this.xpathLoginOrderButtonOnThkPage);
    for (let i = 1; i <= 3; i++) {
      const orderName = await this.getTextContent(this.xpathOrderName);
      if (orderName === orderNumber) {
        break;
      }
    }
  }

  async createStripeOrderMultiProduct(
    shippingAddress: ShippingAddress,
    discountCode: string,
    products: Array<ProductCheckoutInfo>,
    card: Card,
  ): Promise<OrderAfterCheckoutInfo> {
    if (!products) {
      throw new Error("Products checkout info is required");
    }
    for (const product of products) {
      //buyer open homepage then select storefront currency
      await this.goto("/search");
      await this.page.waitForLoadState("networkidle");
      await this.searchProduct(product.name);
      await this.addProductToCart(product.name, product.quantity, product.options, product.productQtyClass);
    }
    await this.clickCheckoutBtn();
    await this.enterShippingAddress(shippingAddress);
    await this.continueToPaymentMethod();
    if (discountCode) {
      await this.applyDiscountCode(discountCode);
    }
    await this.completeOrderWithCardInfo(card);
    return await this.getOrderInfoAfterCheckout();
  }

  /**
   * Create order via Oceanpayment method
   * @param shippingAddress
   * @param products
   * @param card
   * @returns <object> orderId, totalSF(total order)
   */
  async createOPOrderMultiProduct(
    shippingAddress: ShippingAddress,
    discountCode: string,
    products: Array<ProductCheckoutInfo>,
    card: Card,
  ): Promise<OrderAfterCheckoutInfo> {
    let orderName: string;
    if (!products) {
      throw new Error("Products checkout info is required");
    }
    for (const product of products) {
      //buyer open homepage then select storefront currency
      await this.goto("/search");
      //Doi page search load xong de truyen data vao textbox search
      await this.page.waitForTimeout(1000);
      await this.searchProduct(product.name);
      await this.addProductToCart(product.name, product.quantity, product.options, product.productQtyClass);
    }
    await this.clickCheckoutBtn();
    await this.enterShippingAddress(shippingAddress);
    await this.continueToPaymentMethod();
    if (discountCode) {
      await this.applyDiscountCode(discountCode);
    }
    await this.completeOrderViaOceanPayment(card);
    const isXpathOrderNameVisible = await this.genLoc(
      "//div[@class='os-order-number'][contains(text(),'#')]",
    ).isVisible();
    if (isXpathOrderNameVisible) {
      orderName = (await this.page.innerText("//div[@class='os-order-number']")).replace("Order #", "");
    } else {
      orderName = (await this.page.innerText("//div[@class='os-order-number']")).replace("Order ", "");
    }
    const orderId = await this.getOrderIdBySDK();
    const totalSF = parseFloat((await this.page.innerText("//span[@class='payment-due__price']")).replace("$", ""));
    const shippingSF = parseFloat(
      (await this.page.innerText("//td[contains(text(),'Shipping')]/following-sibling::td/descendant::span")).replace(
        "$",
        "",
      ),
    );
    return {
      orderId: orderId,
      orderName: orderName,
      totalSF: totalSF,
      shippingSF: shippingSF,
    };
  }

  /**
   * Tạo order bằng payment method là Oceanpayment
   * @param productName
   * @param productQty
   * @param shippingAddress
   * @param discountCode
   * @param card
   */
  async createOceanPaymentOrder(
    products: Array<ProductCheckoutInfo>,
    shippingAddress: ShippingAddress,
    discountCode: string,
    card: Card,
  ): Promise<OrderAfterCheckoutInfo> {
    return this.createOPOrderMultiProduct(shippingAddress, discountCode, products, card);
  }

  /**
   * Check out multi order one page
   * @param shippingAddress
   * @param products
   * @param card
   * @returns <object> orderId, totalSF(total order)
   */
  async createOrderMultiProductOnePage(
    shippingAddress: ShippingAddress,
    products: Array<ShortProductCheckoutInfo>,
    card: Card,
  ): Promise<ShortOrderAfterCheckoutInfo> {
    if (!products) {
      throw new Error("Products checkout info is required");
    }
    for (const product of products) {
      //buyer open homepage then select storefront currency
      await this.goto("/search");
      await this.searchProduct(product.name);
      await this.addProductToCart(product.name, product.quantity);
    }
    await this.clickCheckoutBtn();
    await this.enterShippingAddress(shippingAddress);
    await this.completeOrderWithCardInfo(card);
    const orderId = await this.getOrderIdBySDK();
    const totalSF = (await this.getTextContent(`(//*[@class='payment-due__price'])[1]`)).replace(",", ".");
    return {
      orderId: orderId,
      totalSF: totalSF,
    };
  }

  async createStripeOrder(
    productName: string,
    productQty: string,
    shippingAddress: ShippingAddress,
    discountCode: string,
    card: Card = this.defaultCardInfo,
    productQtyClass?: string,
    options?: Array<string>,
  ): Promise<OrderAfterCheckoutInfo> {
    return this.createStripeOrderMultiProduct(
      shippingAddress,
      discountCode,
      [
        {
          name: productName,
          quantity: productQty,
          options: options,
          productQtyClass: productQtyClass,
        },
      ],
      card,
    );
  }

  /**
   * Get shipping fee following rate name on shipping method page
   * @param rateName
   * @param platform: Use when shopbase store have many shipping method
   * which have nearly similiar name:
   * EX: "Standard Shipping" and "Standard Shipping (Printbase)
   * > Locator of this case must be equal rather than contains
   * @returns
   */
  async getShippingFeeByRateName(rateName: string, mustEqual = false): Promise<string> {
    let xpathShippingFee = `(//div[contains(@class,'review-block') and descendant::*[text()[contains(.,'${rateName}')]]]//*[contains(@class,'emphasis')])[1]`;
    if (mustEqual) {
      xpathShippingFee =
        `(//div[contains(@class,'review-block') and` +
        ` descendant::*[normalize-space()='${rateName}']]//*[contains(@class,'emphasis')])[1]`;
    }
    await this.waitUntilElementVisible(xpathShippingFee);
    await this.page.locator(xpathShippingFee).scrollIntoViewIfNeeded();
    let shipFee: string | number;
    shipFee = await this.getTextContent(xpathShippingFee);
    if (shipFee !== "Free") {
      shipFee = removeCurrencySymbol(shipFee);
    }
    return shipFee;
  }

  /**
   * Get text ETA shipping time of shipping method
   * @param rateName
   * @returns
   */
  async getTextETAShippingTime(rateName: string) {
    const xpathETALine =
      `(//span[normalize-space()='${rateName}']` + `/following::div[@class='review-block__shipping_time'])[1]`;
    return await this.getTextContent(xpathETALine);
  }

  /**
   * Get text ETA shipping time of shipping method plusbase
   * @param rateName
   * @returns
   */
  async getTextETAShippingTimePlb(shippingMethod: string) {
    const xpathETALine = `//span[contains(normalize-space(),'${shippingMethod}')]/span[2]`;
    return await this.getTextContent(xpathETALine);
  }

  /**
   * If merchant setting ETA shipping time for shipping rate, text line ETA shipping time will be shown on checkout page
   * @param minShippingTime
   * @param maxShippingTime
   * Expected: "Estimated delivery: {shippingFrom} - {shippingTo}"
   *  - shippingFrom = {today} + minShippingTime
   *  - shippingTo = {today} + maxShippingTime
   * Example: "Estimated delivery: June 17 - 20"
   */
  calExpETAShippingTime(minShippingTime: number, maxShippingTime: number) {
    let expectedETAShippingTime: string;
    //calculate date shipping from
    const dateShippingFrom = new Date();
    dateShippingFrom.setDate(dateShippingFrom.getDate() + minShippingTime);
    const dayShippingFrom = dateShippingFrom.toLocaleString("default", {
      day: "2-digit",
    });
    const monthShippingFrom = dateShippingFrom.toLocaleString("default", {
      month: "long",
    });
    //calculate date shipping to
    const dateShippingTo = new Date();
    dateShippingTo.setDate(dateShippingTo.getDate() + maxShippingTime);
    const dayShippingTo = dateShippingTo.toLocaleString("default", {
      day: "2-digit",
    });
    const monthShippingTo = dateShippingTo.toLocaleString("default", {
      month: "long",
    });

    if (monthShippingFrom == monthShippingTo) {
      expectedETAShippingTime = `Estimated delivery: ${monthShippingFrom} ${dayShippingFrom} - ${dayShippingTo}`;
    } else {
      expectedETAShippingTime =
        `Estimated delivery:` + ` ${monthShippingFrom} ${dayShippingFrom} - ${monthShippingTo} ${dayShippingTo}`;
    }
    return expectedETAShippingTime;
  }

  /**
   * Get chosen shipping method of order on Thankyou page
   * @returns
   */
  async getShippingMethodOnThankYouPage(opts?: { etaIncluded?: boolean }): Promise<string> {
    let methodTitle = await this.getTextContent(`//h3[text()[normalize-space()='Shipping']]//following-sibling::p`);
    if (methodTitle.includes("(") && !opts?.etaIncluded) {
      methodTitle = methodTitle.split("(")[0];
    }
    return methodTitle.trim();
  }

  /**
   * Verify quantity of display shipping method on page
   * @param expQuantity
   * @returns
   */
  async verifyQuantityOfShippingMethod(expQuantity: number) {
    const quantityOfMethodsOnCheckout = await this.page
      .locator(`//div[@role='row' and contains(@class,'shipping-method')]`)
      .count();
    if (quantityOfMethodsOnCheckout != expQuantity) {
      throw new Error(
        `quantityOfMethodsOnCheckout = ${quantityOfMethodsOnCheckout};
         expShippingMethods.length = ${expQuantity};`,
      );
    }
  }

  /**
   * Verify shipping method displayed
   * @param expShippingMethods: {
   *          method_title: string;
   *          amount: number;
   *         shipping_platform: Shopbase or Printbase. Use when shopbase store have many shipping method
   *                            which have nearly similiar name:
   *                            EX: "Standard Shipping" and "Standard Shipping (Printbase)
   *                             > Locator of this case must be equal rather than contains
   *        }
   * @returns boolean
   */
  async verifyDisplayedShippingMethods(expShippingMethods?: Array<ShippingMethod>, opts?: { package?: string }) {
    if (await this.isOnePageCheckout()) {
      if (await this.checkLocatorVisible(`(//span[normalize-space()='Change'])[1]`)) {
        await this.clickOnElement(`(//span[normalize-space()='Change'])[1]`);
      }
    }

    for (const expShippingMethod of expShippingMethods) {
      let actShippingAmtOfMethod: string;
      actShippingAmtOfMethod = await this.getShippingFeeByRateName(
        expShippingMethod.method_title,
        expShippingMethod.must_equal,
      );
      if (actShippingAmtOfMethod == "Free") {
        actShippingAmtOfMethod = "0.00";
      }
      if (!expShippingMethod.amount) {
        continue;
      }
      if (actShippingAmtOfMethod != expShippingMethod.amount.toFixed(2)) {
        throw new Error(
          `Rate name: ${expShippingMethod.method_title};
          Expected shipping amount = ${expShippingMethod.amount.toFixed(2)};
          Actual shipping amount = ${actShippingAmtOfMethod};`,
        );
      }

      if (
        expShippingMethod.min_only_shipping_time > 0 &&
        expShippingMethod.max_only_shipping_time > 0 &&
        opts?.package == "plusbase"
      ) {
        const actETAShippingTime = await this.getTextETAShippingTimePlb(expShippingMethod.method_title);
        let expETAShippingTime: string;
        if (actETAShippingTime.includes(`weeks`)) {
          const minWeek = convertDaysToWeeks(expShippingMethod.min_only_shipping_time);
          const maxWeek = convertDaysToWeeks(expShippingMethod.max_only_shipping_time);
          expETAShippingTime = `(${minWeek} - ${maxWeek} weeks)`;
        } else {
          expETAShippingTime = `(${expShippingMethod.min_only_shipping_time} - ${expShippingMethod.max_only_shipping_time} business days)`;
        }
        expect(actETAShippingTime).toEqual(expETAShippingTime);
      }
    }
  }

  /**
   * Verify shipping methods
   * @param expShippingMethods: [{
   *          method_title: string;
   *          amount: number;
   *        }]
   *        is The expected shipping method.
   *        If undefined, verify no shipping methods for the cart address.
   * @param otps optional for verifing
   * @param shippingType : Itembase, Pricebase, Plusbase > default is Itembase
   *                       To verify shipping message when there are no shipping methods for the cart address
   * @returns
   */
  async verifyShippingMethodOnPage(
    expShippingMethods?: Array<ShippingMethod>,
    opts?: { package?: string },
    shippingType = "Itembase",
  ): Promise<boolean> {
    await this.footerLoc.scrollIntoViewIfNeeded();
    await this.waitUntilElementVisible(".section--shipping-method .section__content");

    if (!expShippingMethods) {
      // It means There are no shipping methods for the cart address
      if (
        shippingType !== "Itembase" &&
        (await this.isTextVisible("There are no shipping methods available for your cart or address"))
      ) {
        return true;
      }
      if (
        (await this.isTextVisible("There are no shipping methods available for your cart or address")) &&
        (await this.isTextVisible(
          "The following items don’t ship to your location. Please replace them with another products and place your order again.",
        ))
      ) {
        return true;
      } else {
        throw new Error(`"There are no shipping methods for the cart address" was failed!`);
      }
    }
    await this.verifyDisplayedShippingMethods(expShippingMethods, opts);
    await this.verifyQuantityOfShippingMethod(expShippingMethods.length);
    return true;
  }

  // Get tip value on order summary, return tip
  async getTipOnOrderSummary(): Promise<string> {
    let tip = "0";
    if (await this.page.locator(this.xpathTippingAmt).isVisible()) {
      tip = await this.getTextContent(this.xpathTippingAmt);
      tip = tip.replace(",", ".");
    }
    return tip;
  }

  /**
   * Add a product to cart, then navigate to checkout page,
   * input shipping address then continue to shipping methods page
   * @param productInfo
   * @param shippingAddress
   */
  async addToCartThenGoToShippingMethodPage(
    productInfo: Array<{ name: string; quantity: number }>,
    shippingAdress: ShippingAddress,
  ) {
    // search product on store front then add to cart
    const homePage = new SFHome(this.page, this.domain);
    await homePage.gotoHomePage();
    let productPage: SFProduct;
    for (const element of productInfo) {
      productPage = await homePage.searchThenViewProduct(element.name);
      await productPage.inputQuantityProduct(element.quantity);
      await productPage.addProductToCart();
    }
    // go to shipping methods page
    const checkout = await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(shippingAdress);
  }

  /**
   * Add a product to cart, then navigate to checkout page
   * @param productInfo required name and quantity
   */
  async addToCartThenNavigateToCheckout(productInfo: Array<Product>): Promise<SFCheckout> {
    // search product on store front then add to cart
    const homePage = new SFHome(this.page, this.domain);
    let productPage: SFProduct;
    for (const element of productInfo) {
      productPage = await homePage.searchThenViewProduct(element.name);
      await productPage.inputQuantityProduct(element.quantity);
      await productPage.addProductToCart();
    }
    // go to checkout page
    return await productPage.navigateToCheckoutPage();
  }

  /**
   * Verify product list on checkout/ thankyou page
   * @param productInfo required name and quantity
   * @returns
   */
  async isProductsOnOrderSummary(productInfo: Array<Product>): Promise<boolean> {
    // Verify quantity of line(s) item
    const xpathLinesItem = "//tr[@class ='checkout-product']";
    const quantityOfLineItem = await this.page.locator(xpathLinesItem).count();
    if (quantityOfLineItem != productInfo.length) {
      throw new Error(`Expected quantity of lines item is ${productInfo.length}, but actual is ${quantityOfLineItem}`);
    }

    // Verify display each product on list
    let xpathProdQuantity: string;
    for (const eachProd of productInfo) {
      xpathProdQuantity =
        `//tr[@class ='checkout-product' and child::td/span[contains(@class,'name') and text()='${eachProd.name}']]` +
        `//*[contains(@class,'quantity')]`;
      const isProductOnOrderSummary = await this.isElementExisted(xpathProdQuantity);
      if (!isProductOnOrderSummary) {
        throw new Error(`Product ${eachProd.name} is not in order list`);
      }
      // Check quantity
      const actQuantity = await this.getTextContent(xpathProdQuantity);
      if (actQuantity != eachProd.quantity.toString()) {
        throw new Error(`Expected quantity of ${eachProd.name} is ${eachProd.quantity}, but actual is ${actQuantity}`);
      }
    }
    return true;
  }

  /**
   * Allow complete order with normally checkout when user is being in shipping method page
   * @param shippingMethod: fill name of shipping method, if it's null "", select default
   * @param checkoutMethod: fill "Stripe"/"PayPal"
   * @param cardInfo <optional>
   */
  async selectShippingThenCompleteOrder(
    shippingMethod: string,
    checkoutMethod: "Stripe" | "PayPal",
    cardInfo: Card = this.defaultCardInfo,
    paypalAccount = this.defaultPaypalAccount,
  ) {
    // select shipping method then go to payment method page
    if (shippingMethod != null) {
      await this.page
        .locator(`(//span[@class = 's-check']/following::span[normalize-space()='${shippingMethod}'])[1]`)
        .click();
    }
    const nextStep = this.page.locator(this.xpathBtnContinueToShipping);
    await nextStep.click();
    await this.page.waitForSelector(
      `//span[normalize-space()='Payment method' and @class='layout-flex__item section__title--emphasis']`,
    );

    // complete checkout
    switch (checkoutMethod) {
      case "Stripe":
        await this.page.locator(`//input[contains(@value,'credit-card')]`).first().click();
        await this.page.waitForSelector(`//div[@class='loader']`, {
          state: "detached",
          timeout: 5000,
        });
        await this.enterCardNumber(cardInfo.number);
        await this.enterCardHolderName(cardInfo.holder_name);
        await this.enterExpireDate(cardInfo.expire_date);
        await this.enterCVV(cardInfo.cvv);
        await this.completeOrder();
        break;

      case "PayPal":
        await this.page
          .locator(`text=Use your PayPal account, Debit or Credit cardicon_paypal-con icon >> span`)
          .first()
          .click();
        await this.clickBtnCompleteOrder();
        await this.logInPayPalToPay(paypalAccount);
        await this.page.locator(this.xpathSubmitBtnOnPaypal).click();
        break;
    }
    await this.page.waitForSelector(`//span[contains(text(),'Order Placed')]`);
  }

  /*
   * Kiểm tra tipping được hiển thị tại trang checkout
   * @param tippingInfo: thông tin setup tipping tại dashboard
   */
  async verifyTippingAtCheckoutPage(tippingInfo: TippingInfo) {
    const xpathAddTipCheckbox = this.page.locator(
      "//span[following-sibling::span[contains(normalize-space(),'Show your support for the team at')]]",
    );
    if (!tippingInfo.enabled) {
      await this.waitUntilElementInvisible("//h2[normalize-space()='Add a tip to support us']");
      return;
    }

    if (tippingInfo.is_old_layout) {
      await xpathAddTipCheckbox.check();
      await this.waitUntilElementVisible("//div[@class='tipping section']//div[@class='fieldset floating-label']");
    } else {
      await this.waitUntilElementVisible(
        "//div[@class='section__caption' and normalize-space()='We greatly appreciate your generosity, even the tiniest amount help us continue what we’re doing']",
      );
    }

    for (let i = 0; i < tippingInfo.percentages.length; i++) {
      if (tippingInfo.percentages[i] !== 0) {
        await this.waitUntilElementVisible(`//div[@class='tip-value' and text()='${tippingInfo.percentages[i]}%']`);
      } else {
        await this.waitUntilElementInvisible(`//div[@class='tip-value' and text()='${tippingInfo.percentages[i]}%']`);
      }
    }
    await this.waitUntilElementVisible("//input[@placeholder='Custom Tip']");
  }

  /*
   * Add tip to order
   * @param TippingInfo: thông tin về tipping tại dashboard và tip amount
   */
  async addTip(tippingInfo: TippingInfo) {
    const xpathAddTipCheckbox = this.page.locator(
      "//div[h2[text()='Add Tip']]//following-sibling::div//span[@class='s-check']",
    );
    await this.page.locator(this.xpathFooterSF).scrollIntoViewIfNeeded();
    await this.page.waitForSelector("(//div[contains(@class, 'tipping')])[1]");

    if (tippingInfo.is_old_layout) {
      await xpathAddTipCheckbox.check();
    }

    switch (tippingInfo.option) {
      case "Custom tip":
        await this.inputCustomTip(tippingInfo.tipping_amount);
        break;
      case "No tip":
        await this.page.locator("//div[child::div[text()='No tip']]").click();
        return;
      default:
        await this.page.locator(`//div[contains(@class,'tip-line')][${tippingInfo.option}]`).click();
    }
    await this.waitUntilElementInvisible(`//*[contains(@class,'is-loading')]`);
    await this.page.waitForSelector(this.xpathTippingAmt);
  }

  /**
   * This function inputs a custom tip amount and clicks the 'Add Tip' button.
   * @param {string} tippingAmount - The amount you want to tip
   */
  async inputCustomTip(tippingAmount: string) {
    await this.page.locator("//input[@placeholder='Custom Tip']").fill(tippingAmount);
    await this.page.locator("//button[normalize-space()='Add Tip' or text()='Update Tip']").click();
    await this.waitUntilElementInvisible(`//*[contains(@class,'is-loading')]`);
  }

  /**
   * open order detail on dashboard using API
   * @param orderId: input order id
   * @param accessToken: input access token
   */
  async openOrderPBaseByAPI(orderId: number, accessToken: string) {
    await this.page.goto(`https://${this.domain}/admin/pod/orders/${orderId}?x_key=${accessToken}`);
    await this.page.waitForSelector("//a[normalize-space()='Orders']");
    return new OrdersPage(this.page, this.domain);
  }

  /**
   * checkout order với cổng thanh toán paypal pro
   * @param card
   */
  async completeOrderWithPaypalPro(card: Card) {
    if (!card.paypalpro_card) {
      card.paypalpro_card = card.number;
    }
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
      await paymentMethodListIframe
        .frameLocator("//iframe[@class='paypal-pro-frame-form']")
        .locator('[placeholder="Card number"]')
        .fill(card.paypalpro_card);
      await paymentMethodListIframe
        .frameLocator("//iframe[@class='paypal-pro-frame-form']")
        .locator('[placeholder="MM / YY"]')
        .fill(card.expire_date);
      await paymentMethodListIframe
        .frameLocator("//iframe[@class='paypal-pro-frame-form']")
        .locator('[placeholder="CVV"]')
        .fill(card.cvv);
      await this.clickBtnCompleteOrder();
      await this.page.waitForTimeout(8000); //wait for form 3ds apprear
      if ((await paymentMethodListIframe.locator(`(//iframe[@name='secure-iframe'])[1]`).isVisible()) === true) {
        await paymentMethodListIframe
          .frameLocator(`(//iframe[@name='secure-iframe'])[1]`)
          .frameLocator(`//iframe[@title='Bank Authentication']`)
          .locator(`//input[@id='password']`)
          .fill("1234");
        await paymentMethodListIframe
          .frameLocator(`(//iframe[@name='secure-iframe'])[1]`)
          .frameLocator(`//iframe[@title='Bank Authentication']`)
          .locator(`//input[@value='Submit']`)
          .click();
        await this.page.waitForNavigation({ waitUntil: "load" });
      }
      return;
    }
    // flow without payment shield
    await this.page
      .frameLocator("//iframe[@class='paypal-pro-frame-form']")
      .locator('[placeholder="Card number"]')
      .fill(card.paypalpro_card);
    await this.page
      .frameLocator("//iframe[@class='paypal-pro-frame-form']")
      .locator('[placeholder="MM / YY"]')
      .fill(card.expire_date);
    await this.page
      .frameLocator("//iframe[@class='paypal-pro-frame-form']")
      .locator('[placeholder="CVV"]')
      .fill(card.cvv);
    await this.clickBtnCompleteOrder();
    await this.page.waitForTimeout(8000); //wait for form 3ds apprear
    if ((await this.page.locator(`(//iframe[@name='secure-iframe'])[1]`).isVisible()) === true) {
      await this.page
        .frameLocator(`(//iframe[@name='secure-iframe'])[1]`)
        .frameLocator(`//iframe[@title='Bank Authentication']`)
        .locator(`//input[@id='password']`)
        .fill("1234");
      await this.page
        .frameLocator(`(//iframe[@name='secure-iframe'])[1]`)
        .frameLocator(`//iframe[@title='Bank Authentication']`)
        .locator(`//input[@value='Submit']`)
        .click();
      await this.page.waitForNavigation({ waitUntil: "load" });
    }
  }

  /**
   * buyer add post purchase
   */
  async addPostPurchase() {
    await this.page.waitForSelector(this.xpathClosePPCPopUp);
    await this.page.click(`//span[contains(text(),'Add to order')]`);
    await this.waitUntilElementInvisible(this.xpathClosePPCPopUp);
  }

  /**
   * Complete order via Unlimint
   * Can call this func when on payment method page or directed sandbox Unlimint page
   * @param cardInfo
   * @param failReason an error string is displayed on the checkout page after a failed payment
   */
  async completeOrderUnlimint(cardInfo: Card, failReason?: string) {
    if (await this.page.locator(this.xpathPaymentLabel).isVisible()) {
      await this.selectPaymentMethod("Unlimint");
      await this.clickBtnCompleteOrder();
    }
    await this.waitUntilElementVisible("//div[@id='cardpay-logo']");
    await this.enterCardPayInfo(cardInfo);
    if (failReason != undefined) {
      await this.page.locator("//button[text()='Emulate Failed Authentication']").click();
      await this.page.waitForTimeout(500);
      await this.page.waitForSelector(`//p[text()='${failReason}']`);
    }
  }

  async enterCardPayInfo(cardInfo: Card) {
    await this.page.locator("//input[@id='input-card-number']").fill(cardInfo.unlimint_card);
    await this.page.locator("//input[@id='input-card-holder']").fill(cardInfo.holder_name);
    await this.page.locator("//input[@id='input-card-cvc']").fill(cardInfo.cvv);
    const xPathMonth = "//select[@id='card-expires-month']";
    await this.page.locator(xPathMonth).selectOption({ label: cardInfo.expire_month });
    const xPathYear = "//select[@id='card-expires-year']";
    await this.page.locator(xPathYear).selectOption({ label: cardInfo.expire_year });
    await this.page.locator("//input[@value='Pay']").click();
  }

  /**
   * Get total order on CardPay (Unlimint) checkout page
   * @returns total order on sanbox cardpay (unlimint)
   */
  async getTotalOrderOnSanboxCardPay(): Promise<string> {
    await this.waitUntilElementVisible("//div[@id='cardpay-logo']");
    return await this.getTextContent("//*[@id='total-amount']");
  }

  /**
   * Get the Unlimint transaction ID on CardPay (Unlimint) checkout page
   * @returns the Unlimint transaction ID
   */
  async getIdOfUlimintOrder(): Promise<string> {
    await this.waitUntilElementVisible("//div[@id='cardpay-logo']");
    return await this.getTextContent("//span[@id='order-number']");
  }

  /**
   * Click btn confirm 3D secure on 3D secure page
   * @param status: "success" | "failure". Default value is "success"
   */
  async clickBtnConfirm3Ds(status = "success") {
    await this.page.locator("//button[@id='" + status + "']").click();
  }

  async isErrorMsgDisplayed(errorMsg: string, timeout = 1000): Promise<boolean> {
    const xpathError = `//p[@class = 'field-message--error s-ml-15' and normalize-space()='${errorMsg}']`;
    try {
      await this.page.waitForSelector(xpathError, { timeout: timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify required message is visible or not
   * @param fieldName
   * @returns
   */
  async isRequiredMsgVisible(fieldName: string): Promise<boolean> {
    let errorMsg: string;
    switch (fieldName) {
      case "Email":
        errorMsg = "Please enter an email.";
        break;
      case "First name":
        errorMsg = "Please enter a first name.";
        break;
      case "Last name":
        errorMsg = "Please enter a last name.";
        break;
      case "Address":
      case "Apartment, suite, etc.":
        errorMsg = "Please enter an address.";
        break;
      case "Company name":
        errorMsg = "Please enter a company name.";
        break;
      case "Zip Code":
        errorMsg = "Please enter a ZIP / postal code.";
        break;
      case "City":
        errorMsg = "Please enter a city.";
        break;
      case "State":
        errorMsg = "Please enter a state.";
        break;
      case "Phone number":
        errorMsg = "Please enter a phone number.";
        break;
    }
    return await this.isErrorMsgVisible(errorMsg);
  }

  /**
   * checkout order với cổng thanh toán checkout.com
   * @param cardInfo
   */
  async completeOrderCheckoutCom(cardInfo: Card = this.defaultCardInfo, is3ds = false) {
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
      await paymentMethodListIframe
        .frameLocator(`//div[@id='creditCardNumber']//iframe`)
        .locator(`//input[@id='checkout-frames-card-number']`)
        .fill(cardInfo.number);
      await paymentMethodListIframe.locator(`//input[@placeholder='Cardholder name']`).fill(cardInfo.holder_name);
      await paymentMethodListIframe
        .frameLocator(`//div[@id='expireDate']//iframe`)
        .locator(`//input[@id='checkout-frames-expiry-date']`)
        .fill(cardInfo.expire_date);
      await paymentMethodListIframe
        .frameLocator(`//div[@id='cvv']//iframe`)
        .locator(`//input[@id='checkout-frames-cvv']`)
        .fill(cardInfo.cvv);
      await this.clickBtnCompleteOrder();
      if (is3ds) {
        const frameLocator = this.page.frameLocator(`//iframe[@name='cko-3ds2-iframe']`);
        await frameLocator.locator(`//input[@id='password']`).type("Checkout1!");
        await frameLocator.locator(`//input[@id='password']`).blur();
        await frameLocator.locator(`//input[@id='txtButton' and @type='submit']`).click();
        await this.page.waitForSelector(this.xpathThankYou);
      }
      return;
    }

    //flow with payment shield
    await this.page
      .frameLocator(`//div[@id='creditCardNumber']//iframe`)
      .locator(`//input[@id='checkout-frames-card-number']`)
      .fill(cardInfo.number);
    await this.page.fill(`//input[@placeholder='Cardholder name']`, cardInfo.holder_name);
    await this.page
      .frameLocator(`//div[@id='expireDate']//iframe`)
      .locator(`//input[@id='checkout-frames-expiry-date']`)
      .fill(cardInfo.expire_date);
    await this.page
      .frameLocator(`//div[@id='cvv']//iframe`)
      .locator(`//input[@id='checkout-frames-cvv']`)
      .fill(cardInfo.cvv);
    await this.clickBtnCompleteOrder();
    if (is3ds) {
      const frameLocator = this.page.frameLocator(`//iframe[@name='cko-3ds2-iframe']`);
      await frameLocator.locator(`//input[@id='password']`).type("Checkout1!");
      await frameLocator.locator(`//input[@id='password']`).blur();
      await frameLocator.locator(`//input[@id='txtButton' and @type='submit']`).click();
      await this.page.waitForSelector(this.xpathThankYou);
    }
  }

  /**
   * Checkout via payment method asiabill
   * @param cardInfo : number, expire date, cvv
   */
  async completeOrderAsiabill(cardInfo: Card) {
    await this.page.waitForLoadState("networkidle");
    if (!cardInfo.asia_card) {
      cardInfo.asia_card = cardInfo.number;
    }
    await this.page.waitForSelector("//div[@class='ui-content-title-info']");
    await this.page.locator(`//input[@name='validDate']`).fill(cardInfo.expire_date);
    await this.page.locator(`//input[@name='cardSecurityCode']`).fill(cardInfo.cvv);
    await this.page.locator(`//input[@name='cardNo']`).fill(cardInfo.asia_card);
    await this.page.click(`//input[@name='paybutton']`);
  }

  /**
   * select and get all value off shipping method include shipping fee before and after discount
   * When order pbase is able to applied discount free ship, base on maximum discount value setting in dashboard
   * => shipping fee will have different value
   * @param shippingMethod
   * @param mustEqual: Use when shopbase store have many shipping method
   * which have nearly similiar name:
   * EX: "Standard Shipping" and "Standard Shipping (Printbase)
   * > Locator of this case must be equal rather than contains
   * @returns object contains original shipping fee, shipping fee with discount, shipping value in order summary
   */
  async selectAndGetShippingInfoWithMethod(
    shippingMethod: string,
    mustEqual = false,
  ): Promise<{ originShipFee: number; newShippingValue: string; shippingValInOrdSummary: string }> {
    await Promise.all([
      this.selectShippingMethod(shippingMethod, mustEqual),
      this.waitForResponseIfExist("shipping-methods.json"),
    ]);
    // wait 500ms because need time update ui when callapi shipping-method
    await this.page.waitForTimeout(500);
    // await this.selectShippingMethod(shippingMethod, mustEqual);
    // await this.page.waitForLoadState("networkidle");

    // Get shipping fee before discount
    let originShipFee;
    let xpathOriginShipping = `//div[contains(@class,'review-block') and descendant::*[text()[contains(.,'${shippingMethod}')]]]//*[contains(@class,'small-text')]`;
    if (mustEqual) {
      xpathOriginShipping = `//div[contains(@class,'review-block') and descendant::*[normalize-space()='${shippingMethod}']]//*[contains(@class,'small-text')]`;
    }
    const isOriginShippngExist = await this.isElementExisted(xpathOriginShipping, null, 5000);
    if (isOriginShippngExist) {
      originShipFee = await this.getTextContent(xpathOriginShipping);
      originShipFee = removeCurrencySymbol(originShipFee);
    }
    if (!originShipFee) {
      originShipFee = 0;
    }

    // Get shipping fee after discount
    const actShippingVal = await this.getShippingFeeByRateName(shippingMethod, mustEqual);

    // Get final shipping fee on order summary
    const shippingValInOrdSummary = await this.getShippingFeeOnOrderSummary();

    const shippingValues = {
      originShipFee: parseFloat(originShipFee),
      newShippingValue: actShippingVal,
      shippingValInOrdSummary: shippingValInOrdSummary,
    };
    return shippingValues;
  }

  /**
   * Calculate price item after apply discount
   * @param originalPrice price item before apply discount
   * @param discountType type of discount
   * @param value discount value
   * @return priceAfterDiscount
   */
  calculatePriceAfterDiscount(
    originalPrice: number,
    discountType: "percentage" | "fixed amount" | string,
    value: number,
  ): number {
    let priceAfterDiscount: number;
    switch (discountType) {
      case "percentage":
        priceAfterDiscount = originalPrice * (1 - value / 100);
        break;
      case "fixed amount":
        if (originalPrice > value) {
          priceAfterDiscount = originalPrice - value;
        } else {
          priceAfterDiscount = 0;
        }
        break;
    }

    return Number(priceAfterDiscount.toFixed(2));
  }

  /**
   * Calculate tax amount
   * @param taxType type exclude or include
   * @param price price after discount( subtotal | price of item | shipping fee)
   * @param rate tax rate
   * @return taxAmount
   */
  calculateTax(taxType: "exclude" | "include", price: number, rate: number): number {
    let taxAmount: number;
    switch (taxType) {
      case "exclude":
        taxAmount = (price * rate) / 100;
        break;
      case "include":
        taxAmount = ((rate / 100) * price) / (1 + rate / 100);
        break;
    }

    return Number(taxAmount.toFixed(2));
  }

  async getShippingInfoOnThankyouPage(): Promise<{ amount: string; method_title: string }> {
    const shippingInfo = {
      amount: await this.getShippingFeeOnOrderSummary(),
      method_title: await this.getShippingMethodOnThankYouPage(),
    };
    return shippingInfo;
  }

  /**
   * Get gateway type of stripe credit card method (only support for checking Stripe/Spay/SMP)
   * @returns gateway type
   */
  async getTypeOfStripeCreditCardMethod(): Promise<string> {
    const xpathPaymentMethod = await this.page.locator(`//input[contains(@value,'platform')]`).isVisible();
    if (xpathPaymentMethod) {
      return "platform";
    } else {
      return "stripe";
    }
  }

  /**
   * Get name of all available shipping name at checkout page
   */
  async getAvailableShippingNames(): Promise<string[]> {
    const shippingXpath = `//*[@class='shipping-method__inner']`;
    if ((await this.page.locator(shippingXpath).count()) === 0) {
      await this.page.waitForSelector(shippingXpath);
    }
    return this.page.locator(`${shippingXpath}`).allTextContents();
  }

  /**
   * Get name of all available country name at checkout page
   * @param title is title of select
   */
  async getOptionNamesBySelectTitle(title: string): Promise<string[]> {
    const countrySelectListXpath = `//div[contains(@class,'searchable') and descendant::*[text()='${title}']]`;
    await this.page.locator(`${countrySelectListXpath}//input[@name='countries']`).click();
    return this.page
      .locator(`${countrySelectListXpath}//*[@class='s-select-searchable__item-list']//span`)
      .allTextContents();
  }

  /**
   * Get discount information from thank you page
   * @returns discount information
   */
  async getDscInfoOnThkPage(): Promise<Discount> {
    const discountInfo = {
      name: await this.getDiscountCodeOnOrderSummary(),
      value: parseFloat(removeCurrencySymbol(await this.getDiscountValOnOrderSummary())),
    };
    return discountInfo;
  }

  /**
   * Get infomation of order after checkout
   * @returns Order Information on thankyou page
   */
  async getOrderInfoAfterCheckout(): Promise<OrderAfterCheckoutInfo> {
    //Get shipping fee from order summary on thankyou page
    const orderInfoAfterCheckout = {
      orderName: await this.getOrderName(),
      totalSF: parseFloat(removeCurrencySymbol(await this.getTotalOnOrderSummary())),
      shippingSF: await this.getShippingFeeOnOrderSummary(),
      discountValue: removeCurrencySymbol(await this.getDiscountValOnOrderSummary()),
      discountName: (await this.getDscInfoOnThkPage()).name,
      subTotal: parseFloat(removeCurrencySymbol(await this.getSubtotalOnOrderSummary())),
      orderId: await this.getOrderIdBySDK(),
      tippingValue: parseFloat(removeCurrencySymbol(await this.getTipOnOrderSummary())),
      taxValue: parseFloat(removeCurrencySymbol(await this.getTaxOnOrderSummary())),
      checkoutToken: this.getCheckoutToken(),
      extraFee: parseFloat(removeCurrencySymbol(await this.getExtraFeeOnOrderSummary())),
    };
    return orderInfoAfterCheckout;
  }

  orderSummaryValue: {
    subTotal: number;
    shipping: number;
    discount: number;
    tax: number;
    tipping: number;
    extraFee: number;
  };

  /**
   * The function calculates the total order value by summing up the subTotal, shipping, discount, tax,
   * tipping, and extraFee values.
   * @param {OrderSummary} orderSummaryInfo
   * @returns the total order value
   */
  async calculateTotalOrder(orderSummaryInfo: OrderSummary): Promise<number> {
    if (!orderSummaryInfo) {
      orderSummaryInfo = await this.getOrderSummaryInfo();
    }
    this.orderSummaryValue = {
      subTotal: orderSummaryInfo.subTotal,
      shipping: orderSummaryInfo.shippingValue !== "Free" ? parseFloat(orderSummaryInfo.shippingValue) : 0,
      discount: orderSummaryInfo.discountValue !== "Free shipping" ? parseFloat(orderSummaryInfo.discountValue) : 0,
      tax: typeof orderSummaryInfo.taxes === "number" ? orderSummaryInfo.taxes : 0,
      tipping: orderSummaryInfo.tippingVal,
      extraFee: orderSummaryInfo.extraValue,
    };

    return (
      this.orderSummaryValue.subTotal +
      this.orderSummaryValue.shipping +
      this.orderSummaryValue.discount +
      this.orderSummaryValue.tax +
      this.orderSummaryValue.tipping +
      this.orderSummaryValue.extraFee
    );
  }

  /**
   * Get shipping address on thankyou page
   * @returns a string without \n
   */
  async getShippingAddressOnThkPage(): Promise<string> {
    const actShippingAddress = removeExtraSpace(await this.getTextContent(this.xpathShipAdrOnThkPage));
    return actShippingAddress;
  }

  //Click on textlink to change shipping address on storefront
  async clickChangeShipAdd() {
    await this.page.click(
      `//div[normalize-space()='Ship to']//ancestor::` + `div[@class='review-block']//span[normalize-space()='Change']`,
    );
  }

  //Verify is Discount code applied on current checkout
  async isDiscApplied(): Promise<boolean> {
    return await this.page.locator(`//span[normalize-space()='Discount']`).isVisible();
  }

  //Click on breadscrum to back to completed step on checkout page
  async gotoCompletedStepOnCheckout(step: string) {
    await this.page.waitForSelector(`//span[@class='breadcrumb--completed']//a[normalize-space()='${step}']`);
    await this.page.click(`//span[@class='breadcrumb--completed']//a[normalize-space()='${step}']`);
  }

  //Verify manual payment method display on checkout payment page
  async isManualPaymentMethodDisplayed(method: string): Promise<boolean> {
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    const xpath = `//strong[@class='payment-method-label']//div[contains(normalize-space(),'${method}')]`;
    if (isEnableFswPaymentShield) {
      await this.page.waitForSelector(this.xpathPaymentMethodListIframe);
      const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
      return await this.isElementExisted(xpath, paymentMethodListIframe, 5000);
    }
    return await this.isElementExisted(xpath, null, 5000);
  }

  /**
   * Verify additional information is displayed correctly on checkout page
   * @param additions string array, each element is line of additional information
   * @returns is information correctly
   */
  async isAdditionalInforCorrectly(additions: Array<string>): Promise<boolean> {
    let xpath = "";
    let result = true;
    const isEnableFswPaymentShield = await this.isElementExisted(this.xpathPaymentMethodListIframe);
    if (isEnableFswPaymentShield) {
      for (const addition of additions) {
        xpath = `//fieldset[@class='content-box']//p[normalize-space()='${addition}']`;
        if (!(await this.isElementExisted(xpath, this.genFrame(this.xpathPaymentMethodListIframe)))) {
          result = false;
          break;
        }
      }
    } else {
      for (const addition of additions) {
        xpath = `//fieldset[@class='content-box']//p[normalize-space()='${addition}']`;
        if (!(await this.isElementExisted(xpath))) {
          result = false;
          break;
        }
      }
    }
    return result;
  }

  /**
   * Calculate total order value base on information on order summary
   * @param orderSummary
   * @returns
   */
  async calTotalOrdOnOrderSummary(orderSummaryInfo: OrderSummary): Promise<number> {
    let totalOrder = 0;
    let shippingVal = 0;
    let discountVal = 0;
    let tippingVal = 0;
    let taxVal = 0;
    let extraFee = 0;
    const subTotal = parseFloat(removeCurrencySymbol(await this.getSubtotalOnOrderSummary()));
    if (orderSummaryInfo.shippingValue) {
      if (orderSummaryInfo.shippingValue !== "Free") {
        shippingVal = Math.abs(parseFloat(removeCurrencySymbol(orderSummaryInfo.shippingValue.toString())));
      }
    }
    if (orderSummaryInfo.discountValue) {
      if (orderSummaryInfo.discountValue !== "Free shipping") {
        discountVal = Math.abs(parseFloat(removeCurrencySymbol(orderSummaryInfo.discountValue.toString())));
      }
    }
    if (orderSummaryInfo.tippingVal) {
      tippingVal = orderSummaryInfo.tippingVal;
    }
    if (orderSummaryInfo.taxes) {
      taxVal = Number(orderSummaryInfo.taxes);
    }
    //Calculate extra fee
    if (orderSummaryInfo.extraValue) {
      extraFee = orderSummaryInfo.extraValue;
    }
    totalOrder = subTotal + tippingVal + taxVal + extraFee + shippingVal - discountVal;
    return totalOrder;
  }

  /**
   * Calculate extra fee in Order summary on checkout page
   * @param codSetting information of COD setting which is include extra_fee_type and extra_fee_value
   * @param orderSummaryInfo information about subtotal, shipping, tipping, tax...
   * @returns total extra fee after calculated
   */
  async calculateExtrafee(codSetting: ManualPaymentSetting, orderSummaryInfo: OrderSummary): Promise<number> {
    let extraFee = 0;
    let expectShippingVal = 0;
    let expectDiscountVal = 0;
    let expectTaxes = 0;
    if (orderSummaryInfo.shippingValue && orderSummaryInfo.shippingValue !== "Free") {
      expectShippingVal = Math.abs(parseFloat(removeCurrencySymbol(orderSummaryInfo.shippingValue.toString())));
    }
    if (orderSummaryInfo.discountValue && orderSummaryInfo.discountValue !== "Free shipping") {
      expectDiscountVal = Math.abs(parseFloat(removeCurrencySymbol(orderSummaryInfo.discountValue.toString())));
    }
    if (orderSummaryInfo.taxes && orderSummaryInfo.taxes !== "Tax included") {
      expectTaxes = Number(orderSummaryInfo.taxes);
    }

    if (codSetting.is_extra_fee) {
      extraFee = codSetting.extra_fee_value;
      if (codSetting.extra_fee_type.toUpperCase() === "percentage".toUpperCase()) {
        extraFee =
          ((orderSummaryInfo.subTotal + expectDiscountVal + expectShippingVal + expectTaxes) *
            codSetting.extra_fee_value) /
          100;
      }
    }
    return Number(extraFee.toFixed(2));
  }

  /**
   * Get Information on Order summary
   * @returns All information of order on Order Summary
   */
  async getOrderSummaryInfo(): Promise<OrderSummary> {
    const [discountCode, discountValue, extraFee, taxAmount, shippingFee, totalTipping, subTotal, total] =
      await Promise.all([
        this.getDiscountCodeOnOrderSummary(),
        this.getDiscountValOnOrderSummary(),
        this.getExtraFeeOnOrderSummary(),
        this.getTaxOnOrderSummary(),
        this.getShippingFeeOnOrderSummary(),
        this.getTipOnOrderSummary(),
        this.getSubtotalOnOrderSummary(),
        this.getTotalOnOrderSummary(),
      ]);
    return {
      discountCode: discountCode,
      subTotal: parseFloat(removeCurrencySymbol(subTotal)),
      discountValue: discountValue,
      extraValue: parseFloat(removeCurrencySymbol(extraFee)),
      taxes: taxAmount !== "Tax included" ? parseFloat(removeCurrencySymbol(taxAmount)) : taxAmount,
      shippingValue: shippingFee,
      tippingVal: parseFloat(removeCurrencySymbol(totalTipping)),
      totalPrice: parseFloat(removeCurrencySymbol(total)),
    };
  }

  /**
   * Get checkout token in url
   * @returns checkout token
   */
  getCheckoutToken() {
    const url = this.page.url();
    const arr = url.split("/");
    this.checkoutToken = arr[arr.length - 1].split("?")[0];
    return this.checkoutToken;
  }

  /**
   * get original item value before discount
   * @param itemName
   * @returns origin item value
   */
  async getOriginalItemPrice(itemName: string): Promise<number> {
    const originItemValue = await this.getTextContent(
      `//td[span[normalize-space()='${itemName}']]/following-sibling::td/span[@class='original-price']`,
    );
    return Number(removeCurrencySymbol(originItemValue));
  }

  /**
   * calculate discount value by type
   * @param discountInfo
   * @returns discount value
   */
  async calculateDiscountByType(discountInfo: Discount, price: number = this.subtotal): Promise<number> {
    let discountValue = 0;
    let itemValue;
    switch (discountInfo.type) {
      case "Percentage":
        discountValue = price * discountInfo.value;
        break;
      case "Fix amount":
        discountValue = discountInfo.value;
        break;
      case "Buy x get y":
        itemValue = await this.getOriginalItemPrice(discountInfo.discount_item);
        discountValue = itemValue * discountInfo.value;
        break;
      case "Free shipping":
        discountValue = Number(await this.getShippingFeeOnOrderSummary());
        break;
    }
    return Number(discountValue.toFixed(2));
  }

  /**
   * Checkout product on online store with no verify at all
   * @param shippingInfo: it concludes infomation of the buyer (email, name, address, country, phonenumber)
   * @param cardInfo: it concludes card number (test card), date and CVV
   * @param upsell: using function add upsell products in SFApps
   * @param upsellProduct: upsell product which added to cart for checking out
   */
  async checkoutProductWithUsellNoVerify(
    shippingInfo: ShippingAddress,
    cardInfo: Card,
    upsell?: SFApps,
    upsellProduct?: Array<string>,
    domainSF?: string,
  ) {
    let domain: string;
    if (!domainSF) {
      domain = this.domain;
    }
    const sfCart = new SFProduct(this.page, domain);
    const prePurchaseCheckout = "//button[contains(@class, 'pre-purchase')]";
    await sfCart.addToCart();
    await this.waitForEventCompleted(domain, "add_to_cart");
    await this.waitForElementVisibleThenInvisible("//button[contains(@class,'btn-loading')]");
    if (upsell && upsellProduct) {
      await upsell.addPrePurchaseProductToCart(upsellProduct);
      await this.page.waitForSelector(
        `//h1[normalize-space()='Cart'] | ${prePurchaseCheckout}` + `| //button[@name='checkout']`,
      );
      await new Promise(t => setTimeout(t, 2000));
      await this.page.click(prePurchaseCheckout);
    } else {
      await this.clickOnBtnWithLabel("Checkout");
      await this.waitForEventCompleted(domain, "reached_checkout");
      await this.waitForEventCompleted(domain, "initiate_checkout");
    }
    await this.page.waitForSelector(this.xpathZipCode);
    try {
      await this.inputDiscountBox.waitFor({ state: "visible", timeout: 60000 });
    } catch {
      await this.page.waitForSelector(this.appliedCoupon);
    }
    await this.enterShippingAddress(shippingInfo);
    await this.continueToPaymentMethod();
    await this.completeOrderWithCardInfo(cardInfo);
    await this.page.waitForSelector(this.xpathThankYou);
  }

  /**
   * Get price of product type (summary, sbase, usell)
   * @param rawPriceItem: init value and type data of object price product
   * @param prodSbase: product online store name
   * @param prodUpsell: product upsell name
   */
  async getPriceItemType(rawPriceItem: PriceProduct, prodSbase: string, prodUpsell: string[]): Promise<PriceProduct> {
    rawPriceItem.summary = parseFloat((await this.getTotalOnOrderSummary()).split("$")[1]);
    if (prodSbase && prodUpsell) {
      rawPriceItem.sbase = parseFloat((await this.getProductPrice(prodSbase)).split("$")[1]);
      rawPriceItem.upsell = parseFloat((await this.getProductPrice(prodUpsell[0])).split("$")[1]);
    }
    let shippingFee = await this.getShippingFeeOnOrderSummary();
    if (shippingFee == "Free") {
      shippingFee = "0";
    }
    rawPriceItem.shipping = parseFloat(shippingFee);
    rawPriceItem.taxes = parseFloat(await this.getTaxOnOrderSummary());
    rawPriceItem.totalProductCheckout = await this.page.locator(`${this.xpathCheckoutProducts}//tbody//tr`).count();
    return rawPriceItem;
  }

  /**
   * Get quantity of order in order summary at checkout page
   * @returns quantity of order
   */
  async getQuantityOfOrder(): Promise<number> {
    let quantity = 0;
    const quantityText = await this.page
      .locator("//span[@class='checkout-product-thumbnail__quantity']")
      .allTextContents();
    for (const i in quantityText) {
      quantity += Number(quantityText[i]);
    }
    this.orderQuantity = quantity;
    return Number(quantity);
  }

  /**
   * Checkout via Klarna with country = United Kingdom
   * @param phoneNumber
   * @param otp
   * @returns total order
   */
  async completedOrderViaKlarna(klarnaGatewayInfo: KlarnaGatewayInfo, isPPCItem = false): Promise<number> {
    const iframeKlarna = this.page.frameLocator("//iframe[@id='klarna-apf-iframe']");
    const xpathSkip = "//span[contains(text(), 'Skip')]";
    const xpathContinueSelectPM =
      "//button[@data-testid='select-payment-category']//span[contains(text(), 'Continue')]";
    if (!isPPCItem) {
      await iframeKlarna.locator("//input[@name='phone']").fill(klarnaGatewayInfo.phoneNumber);
      await iframeKlarna.locator("//span[contains(text(), 'Send code')]").click();
      await iframeKlarna.locator("//input[@id='otp_field']").fill(klarnaGatewayInfo.otp);
    }

    // Nếu hiển thị popup chọn phương thức thanh toán thì chọn phương thức thanh toán => click continue
    await this.page.waitForResponse(
      response =>
        response.url().includes(`js.playground.klarna.com/${klarnaGatewayInfo.continentCode}/profile/opfBanner`) &&
        response.status() === 200,
    );

    const isxpathContinueSelectPMExisted = await this.isElementExisted(xpathContinueSelectPM, iframeKlarna);
    if (isxpathContinueSelectPMExisted) {
      await iframeKlarna.getByLabel(`${klarnaGatewayInfo.chargeMethod}`).check();
      await iframeKlarna.locator(xpathContinueSelectPM).click();
    }

    // Get total order
    const totalOrder = await iframeKlarna
      .locator("//div[child::p[contains(text(), 'Order')]]//following-sibling::p")
      .textContent();
    this.total = Number(removeCurrencySymbol(totalOrder).trim());
    await iframeKlarna.locator("//button[@data-testid='confirm-and-pay']").click();
    await this.page.waitForTimeout(1000);
    const isXpathSkipExisted = await this.isElementExisted(xpathSkip, iframeKlarna);
    if (isXpathSkipExisted) {
      await iframeKlarna.locator(xpathSkip).click();
    }
    return this.total;
  }

  async getMessageWhenActivateOrDeactivateOceanpaymentProvider(): Promise<string> {
    return await this.page.innerText("//div[contains(@class,'content-box')]//p");
  }

  /**
   * Get order name SF after order product
   */
  async getOrderIDSF() {
    const orderName = await this.getTextContent("//div[@class='os-header__heading']//div");
    const orderID = orderName.substring(orderName.lastIndexOf("#"));
    return orderID;
  }

  /**
   * Complete order via manual payment method
   * @param paymentMethod: manual payment method (cod / bank transfer)
   */
  async completeOrderViaManualPaymentMethod(paymentMethod: "cod" | "bank_transfer"): Promise<void> {
    await this.xpathBlockPayment.scrollIntoViewIfNeeded();
    await this.selectPaymentMethod(paymentMethod);
    await this.clickBtnCompleteOrder();
  }

  /**
   * Select the shipping method with number order is index
   * @param index : number order of shipping method
   */
  async selectShippingMethodWithNo(index: string) {
    await this.page.locator(`(//div[@class="shipping-method__inner"]//input[@type="radio"])[${index}]`).check();
  }

  /**
   * Click Button On 3ds test page
   * @param buttonName: name of button
   */
  async clickButtonOn3dsTestPage(buttonName: string) {
    const mainFrame = await this.switchToStripeIframe();
    const frame = mainFrame.frameLocator("(//iframe[contains(@name , '__privateStripeFrame')])[1]");
    const stripeChallengeFrame = frame.frameLocator("//iframe[contains(@name, 'stripe-challenge-frame')]");
    await stripeChallengeFrame.locator(this.xpathBtnWithLabel(buttonName)).click();
  }

  /**
   * Fill Custom Tip
   */
  async addCustomTip(tippingInfo: TippingInfo, name: "Add Tip" | "Update Tip") {
    await this.page.locator("//input[@placeholder='Custom Tip']").click();
    await this.page.locator("//input[@placeholder='Custom Tip']").fill(tippingInfo.tipping_amount);
    await this.getXpathBtnAddTip(name).click();
  }

  /**
   * Go to product link, then add product to cart
   * Then click Checkout at pre-purchase popup
   * Enter shipping address
   * Finally, get shipping price with the address selected at the checkout page
   * @param productLink
   * @param shippingAddress
   * @returns
   */
  async getShippingAtCheckoutPage(productLink: string, shippingAddress: ShippingAddress): Promise<string> {
    await this.page.goto(`https://${this.domain}/${productLink}`);
    await this.page.waitForLoadState("networkidle");
    await this.genLoc("//button[contains(@class,'btn-add-cart')]").click();
    await this.genLoc("//button[contains(@class,'checkout')]").click();
    await this.enterShippingAddress(shippingAddress);
    await this.continueToPaymentMethod();
    return await this.genLoc("//td[text()[normalize-space()='Shipping']]/following-sibling::td//span").textContent();
  }

  async getTotalAmtOnPayWithPayoneerPage(): Promise<string> {
    const amount = removeCurrencySymbol(await this.getTextContent("//h1[@class='total-amount']"));
    return amount;
  }

  /**
   * Using verify redirect link when click button `Complete Order` is success
   * @param gateway
   */
  async isRedirectToSandboxPayment(gateway: string): Promise<boolean> {
    switch (gateway) {
      case PaymentMethod.BANCONTACT:
      case PaymentMethod.GIROPAY:
      case PaymentMethod.SOFORT:
      case PaymentMethod.AFTERPAY:
      case PaymentMethod.IDEAL:
        return await this.isElementExisted(this.xpathBtnStripeRedirectLink, null, 10000);
      case PaymentMethod.OCEAN_PAYMENT:
        return this.verifyRedirectLink("oceanpayment.com/paymentpages");
      case PaymentMethod.ASIA_BILL:
        return this.verifyRedirectLink("asiabill.com/pages/creditPay");
      case PaymentMethod.PAYONEER:
        return await this.isElementExisted("//a[@id='payoneer-link']", null, 10000);
      case PaymentMethod.PAYPAL:
        return this.verifyRedirectLink("paypal.com");
      case PaymentMethod.UNLIMINT:
        return this.page.url().includes("sandbox.cardpay.com");
      case PaymentMethod.KLARNA:
        return await this.isElementExisted("//iframe[@id='klarna-apf-iframe']", null, 10000);
    }
    return false;
  }

  async verifyRedirectLink(redirectLink: string, retries = 10) {
    for (let i = 0; i < retries; i++) {
      if (this.page.url().includes(redirectLink)) {
        await this.page.waitForLoadState("networkidle");
        return true;
      }
      await this.page.waitForTimeout(1000);
    }
    return false;
  }

  /**
   * Checkout product on online store but not complete
   * @param shippingInfo: it concludes infomation of the buyer (email, name, address, country, phonenumber)
   * @param cardInfo: it concludes card number (test card), date and CVV
   * @param upsell: using function add upsell products in SFApps
   * @param upsellProduct: upsell product which added to cart for checking out
   */
  async makeAbandonedCheckout(
    shippingInfo: ShippingAddress,
    cardInfo: Card,
    upsell?: SFApps,
    upsellProduct?: Array<string>,
    domainSF?: string,
  ) {
    let domain: string;
    if (!domainSF) {
      domain = this.domain;
    }
    const sfCart = new SFProduct(this.page, domain);
    const prePurchaseCheckout = "//button[contains(@class, 'pre-purchase')]";
    await sfCart.addToCart();
    await this.waitForEventCompleted(domain, "add_to_cart");
    await this.waitForElementVisibleThenInvisible(
      '//button[contains(@class,"btn-loading")] | //div[@id="addToCartForm"]//span[@class="button-dual-ring"]',
    );
    if (upsell && upsellProduct) {
      const sfApps = new SFApps(this.page, domain);
      await sfApps.page.waitForSelector('//div[contains(@class,"pre-purchase__footer")]', { timeout: 60000 });
      await sfApps.addPrePurchaseProductToCart(upsellProduct);
      await this.page.waitForSelector(
        `//h1[normalize-space()='Cart'] | ${prePurchaseCheckout}` + `| //button[@name='checkout']`,
      );
      await new Promise(t => setTimeout(t, 2000));
      await this.page.click(prePurchaseCheckout);
    } else {
      await this.clickOnBtnWithLabel("Checkout");
    }
    await this.page.waitForSelector(this.xpathZipCode);
    try {
      await this.inputDiscountBox.waitFor({ state: "visible", timeout: 60000 });
    } catch {
      await this.page.waitForSelector(this.appliedCoupon);
    }
    await this.enterShippingAddress(shippingInfo);
    await this.continueToPaymentMethod();
    await this.enterCardNumber(cardInfo.number);
    await this.enterCardHolderName(cardInfo.holder_name);
    await this.enterExpireDate(cardInfo.expire_date);
    await this.enterCVV(cardInfo.cvv);
  }

  /** Select then complete order with different payment method
   * @param paymentMethod
   * @param cardInfo
   * @param buyerPhoneNumber
   * @param otp
   */
  async completeOrderWithPaymentShield(paymentMethod = "Stripe", cardInfo: Card = this.defaultCardInfo) {
    switch (paymentMethod) {
      case PaymentMethod.STRIPE:
        await this.selectPaymentMethod();
        await this.completeOrderWithCardInfo(cardInfo);
        break;
      case PaymentMethod.IDEAL:
        await this.selectPaymentMethod(paymentMethod);
        await this.selectIdealBank(cardInfo.ideal_bank);
        await this.completeOrderStripeHostedUsingPaymentShield();
        break;
      case PaymentMethod.SEPA:
        await this.selectPaymentMethod(paymentMethod);
        await this.enterSepaCardInfo(cardInfo.sepa_card, true);
        await this.clickBtnCompleteOrder();
        break;
      case PaymentMethod.KLARNA:
        await this.xpathBlockPayment.scrollIntoViewIfNeeded();
        await this.selectPaymentMethod(PaymentMethod.KLARNA);
        await this.clickBtnCompleteOrder();
        await this.completedOrderViaKlarna(this.defaultKlarnaGatewayInfo);
        break;
      case PaymentMethod.AFTERPAY:
      case PaymentMethod.BANCONTACT:
      case PaymentMethod.SOFORT:
      case PaymentMethod.GIROPAY:
        await this.xpathBlockPayment.scrollIntoViewIfNeeded();
        await this.selectPaymentMethod(paymentMethod);
        await this.completeOrderStripeHostedUsingPaymentShield();
    }
  }

  async hasPaymentMethodListIframe(): Promise<boolean> {
    return await this.isElementExisted(this.xpathPaymentMethodListIframe);
  }

  async hasStripeEmbeddedIFrame(paymentMethod: string): Promise<boolean> {
    const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);

    if (paymentMethod === PaymentMethod.SEPA) {
      const sepaIframe = paymentMethodListIframe.frameLocator(`//iframe[@id='stripe-sepa-debit-frame-form-wrapper']`);
      return !!sepaIframe;
    }

    const stripeIframe = paymentMethodListIframe.frameLocator(`//iframe[@class='stripe-frame-form']`);
    return !!stripeIframe;
  }

  async hasPaymentShieldStripeHosted(paymentShieldDomain: string): Promise<boolean> {
    await this.page.waitForSelector(`//a[normalize-space()='Authorize Test Payment']`);
    return await this.page.isVisible(`//span[contains(text() ,'${paymentShieldDomain}')]`);
  }

  /**
   * Complete the order with Paypal Standard.
   * It will open the payment input form and fill the corresponding information there.
   * @param paypalAccount default with account "buyer@shopbase.com"
   */
  async completeOrderFailViaPayPal(paypalAccount: PaypalAccount = this.defaultPaypalAccount) {
    const paymentMethodListIframe = this.page.frameLocator(this.xpathPaymentMethodListIframe);
    await paymentMethodListIframe
      .locator("//input[contains(@value,'paypal')]/following-sibling::span[@class='s-check']")
      .check();
    await this.clickBtnCompleteOrder();
    await this.logInPayPalToPay(paypalAccount);

    // backup for case btnAcceptCookie
    if (await this.isElementExisted(this.xpathBtnAcceptCookie, null, 1000)) {
      await this.page.locator(this.xpathBtnAcceptCookie).click();
    }

    await this.page.locator(this.xpathSubmitBtnOnPaypal).click();
    await this.footerLoc.scrollIntoViewIfNeeded();
    await this.page.waitForSelector(`//*[@class='notice notice--error']`);
  }

  /**
   * Get image in checkout page
   * @param productName: name of product
   * */

  getXpathImageProductInCheckoutPage(productName: string) {
    return `((//div[contains(@class,'order-summary')])[1]//img[@alt="${productName}"])[1]`;
  }

  /**
   * Get image in content block
   * @param productName: name of product
   * */
  getXpathImageProductInContentBlock(productName: string) {
    return `(//div[contains(@class,'content-box')]//div[contains(@class,'checkout-product-thumbnail') and descendant::img[@alt="${productName}"]])[1]`;
  }

  /**
   * Hàm lấy giá sản phẩm, giữ nguyên dấu phân cách hàng nghìn, dấu thập phân nếu có, remove currency
   * @param price
   * @returns
   */
  getPriceProductIgnoreCurrency(price: string): string {
    return price.replace(/[^0-9.,]+/g, "");
  }

  async getCOCurrencySymbol(): Promise<string> {
    const totalOrder = await this.getTotalOnOrderSummary();
    return totalOrder.charAt(0);
  }

  /**
   * This function to complete an order on theme v2
   * @param data is information of Checkout and card checkout to complete order
   */
  async completeOrderThemeV2(data: CheckoutInfoAndCard) {
    await this.fillCheckoutInfo(
      data.email,
      data.first_name,
      data.last_name,
      data.address,
      data.city,
      data.state,
      data.zip,
      data.country,
      data.phone,
      data.shippingMethod,
    );
    await this.clickBtnContinueToShippingMethod();
    await this.continueToPaymentMethod();
    await this.inputCardInfoAndCompleteOrder(data.cardNumber, data.cardHolder, data.expireDate, data.cvv);
  }

  /**
   * This function to complete an order on theme v3
   * @param customerInfo, cardInfo is information of Checkout and card checkout to complete order
   */
  async completeOrderThemeV3(customerInfo: ShippingAddress, cardInfo: Card, tippingInfo: TippingInfo) {
    await this.page.getByText("Shipping address").first().isVisible();
    await this.page.waitForLoadState("networkidle");
    await this.enterShippingAddress(customerInfo);
    await this.addTip(tippingInfo);
    await this.completeOrderWithCardInfo(cardInfo);
  }

  // Hàm login razorpay từ phía buyer để thanh toán đơn hàng
  async loginRazorpayByBuyer(buyerInfo: RazorpayAccount) {
    await this.waitForElementVisibleThenInvisible("//div[@id='checkoutLoader']");
    const iframe = this.page.frameLocator(this.razorpay.iframe);
    const xpathPhoneNumber = await iframe.locator(this.razorpay.xpathPhoneNumber).isVisible();

    if (xpathPhoneNumber) {
      await iframe.locator(this.razorpay.xpathPhoneNumber).click();
      await iframe.locator(this.razorpay.inputSearchCountry).fill(buyerInfo.country);
      await iframe
        .locator(`(//div[contains(@class,'list-item')]//div[contains(normalize-space(),'${buyerInfo.country}')])[1]`)
        .click();
      await iframe.locator(`//input[@id = 'contact' and @type = 'tel']`).fill(buyerInfo.phone);
      await iframe.locator(`//div[@class="email-field"]//input[@type = 'email']`).fill(buyerInfo.email);
      await iframe.locator(`//div[contains(@class,'cta-container')]//button`).click();
    }
  }

  // Hàm get total amount trong popup thanh toán razorpay
  async getTotalAmountOnRazorpayPopup(): Promise<string> {
    const xpathPrice = this.page.frameLocator(this.razorpay.iframe).locator("//span[contains(@class,'price-label')]");
    const price = await xpathPrice.innerText();
    return price;
  }

  /**
   * Hàm thực hiện quá trình thanh toán order checkout qua razorpay
   * @param cardInfo
   */
  async completeOrderViaRazorpay(cardInfo: Card) {
    let pagePromise, popupOTP;
    const iframe = this.page.frameLocator(this.razorpay.iframe);
    // đợi hiển thị các method, do popup có razorpay lúc mới show thì đang bị load ra các method bị duplicate
    await this.waitAbit(2000);

    // select method
    switch (cardInfo.method) {
      case "Card":
        await this.page
          .frameLocator(this.razorpay.iframe)
          .locator(`//button//div[normalize-space()='${cardInfo.method}']`)
          .click();
        await iframe.locator("//input[@id='card_number']").fill(cardInfo.number);
        await iframe.locator("//input[@id='card_expiry']").fill(cardInfo.expire_date);
        await iframe.locator("//input[@id='card_name']").fill(cardInfo.holder_name);
        await iframe.locator("//input[@id='card_cvv']").fill(cardInfo.cvv);
        await this.waitAbit(1000);

        pagePromise = this.page.waitForEvent("popup");
        await iframe.locator("//button[normalize-space()='Pay Now']").click({ timeout: 2000 });
        popupOTP = await pagePromise;
        await popupOTP.locator("//input[@placeholder='OTP']").waitFor({ state: "visible", timeout: 180 * 1000 });
        await popupOTP.locator("//input[@placeholder='OTP']").fill(cardInfo.otp);
        await popupOTP.locator("//button[@type='submit']").click();
        break;
    }
  }
  /**
   * Get day order ready to ship when checkout
   * @returns day order ready to ship
   */
  async getDataProcessingTime(): Promise<string> {
    return await this.getTextContent(`//span[contains(text(),'Ready to ship as early as')]//following-sibling::span`);
  }

  /**
   * Get order estimated delivery time
   * @returns estimated delivery time of order
   */
  async getEstimatedDeliveryTime(): Promise<string> {
    return await this.getTextContent(`//h3[contains(text(),'Estimated delivery time')]//following-sibling::p`);
  }

  /*
   * Input card to form card injected at checkout page / cart page / product page / collection page
   * Use for ft Improve Security For MageCart Issue
   * @param cardInfo: card information
   */
  async inputCardInjected(cardInfo: Card) {
    await this.page.locator("//input[@id = 'card-number']").fill(cardInfo.number);
    await this.page.locator("//input[@id = 'card-expired']").fill(cardInfo.expire_date);
    await this.page.locator("//input[@id = 'card-holder-name']").fill(cardInfo.holder_name);
    await this.page.locator("//input[@id = 'card-cvv']").fill(cardInfo.cvv);
    await this.page.locator("//button[@id = 'submit-payment']").click();
  }
}
