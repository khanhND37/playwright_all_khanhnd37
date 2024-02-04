import { ImportCampStatusInMail, getMailboxInstanceWithProxy } from "@core/utils/mail";
import { SBPage } from "@pages/page";
import { SFCheckout } from "@pages/storefront/checkout";
import { ContactUsPage } from "@pages/storefront/contact_us";
import { Locator, Page, expect, request } from "@playwright/test";

export class MailBox extends SBPage {
  iframe = "#preview";
  frameLocator = this.page.frameLocator(this.iframe);
  url = "https://api.maildrop.cc/graphql";
  emailBuyer: string;

  xpathContentEmail(content: string): string {
    return `//p[contains(text(),'${content}')]`;
  }

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * get locator of title email
   * @param orderName of order
   * @param emailType
   */
  getXpathTitleEmail(emailType: "confirm order" | "shipment", orderName: string): Locator {
    switch (emailType) {
      case "confirm order":
        return this.page.locator(`(//td[contains(text(),'Order ${orderName} confirmed')])[1]`);
      case "shipment":
        return this.page.locator(`//td[contains(text(),'A shipment from order ${orderName} is on the way')]`);
    }
  }

  emailSubject(orderName?: string, shopName?: string, code?: string) {
    return {
      orderConfirm: `Order ${orderName} confirmed`,
      shipmentConfirm: `A shipment from order ${orderName} is on the way`,
      orderCanceled: `Order ${orderName} has been canceled`,
      editOrder: `${orderName} updated`,
      requestCancelOrder: `Confirm your request to cancel order ${orderName}`,
      updateOrderPayment: `Payment needed to update order`,
      accountActivation: `Customer account activation`,
      accountConfirmation: `Customer account confirmation`,
      abandonedCheckout: `Did you forget something?`,
      resetPassword: `Customer account password reset`,
      confirmOrder: `Order confirmation`,
      refundNoti: `Refund notification`,
      captureOrder: `Capture payment result`,
      verifyCode: `Welcome to ${shopName}! ${code} is your verification code`,
    };
  }

  /**
   * The function `getEmailIDBySubject` is an asynchronous function that takes an email and subject as
   * parameters and returns the ID of an email with the specified subject.
   * @param {string} email - The email parameter is a string that represents the email address to search
   * for.
   * @param {string} subject - The subject parameter is the subject of the email you are searching for.
   * @returns a Promise that resolves to a string.
   */
  async getEmailIDBySubject(email: string, subject: string): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const context = await request.newContext();
      const query = `query Example { inbox(mailbox:"${email.split("@")[0]}") { id headerfrom subject date } }`;
      const res = await context.post(this.url, {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          query: query,
        },
      });
      expect(res.status()).toBe(200);
      const resBody = await res.json();
      const emailList = resBody.data.inbox;
      const emailInfo = emailList.find(email => email.subject.includes(subject));
      if (emailInfo) {
        return emailInfo.id;
      } else {
        // eslint-disable-next-line no-console
        console.log(`Retry find email with subject: ${subject}`);
        await this.page.waitForTimeout(2000);
        continue;
      }
    }
    throw new Error(`Cannot find email with subject: ${subject}, Please check your system again!`);
  }

  /**
   * The function `getHTMLByEmailID` retrieves the HTML content of an email message using the provided
   * email and email ID.
   * @param {string} email
   * @param {string} emailID
   * @returns the HTML content of an email message.
   */
  async getHTMLByEmailID(email: string, emailID: string): Promise<string> {
    const context = await request.newContext();
    const query = `query Example { message(mailbox:"${email.split("@")[0]}", id:"${emailID}") { html subject } }`;
    const res = await context.post(this.url, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        query: query,
      },
    });
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    return resBody.data.message.html;
  }

  /**
   * The function `openMailDetailWithAPI` opens the HTML content of an email message using the provided
   * email and subject.
   * @param {string} email
   * @param {string} subject
   * @returns the HTML content of an email message.
   */
  async openMailDetailWithAPI(email: string, subject: string) {
    const emailID = await this.getEmailIDBySubject(email, subject);
    const htmlContent = await this.getHTMLByEmailID(email, emailID);
    await this.page.setContent(htmlContent);
  }

  /**
   * The function "openOrderConfirmationNotification" opens the mail detail with an API for the specified
   * order name and buyer's email.
   * @param {string} orderName
   * @param emailBuyer
   */
  async openOrderConfirmationNotification(orderName: string, emailBuyer = this.emailBuyer) {
    const subjectEmail = this.emailSubject(orderName).orderConfirm;
    await this.openMailDetailWithAPI(emailBuyer, subjectEmail);
  }

  async genXpathSectionOfCustomerInfo(
    sectionName: "Shipping address" | "Billing address" | "Shipping method" | "Payment method",
  ): Promise<string> {
    return `//th[child::div[normalize-space()='${sectionName}']]`;
  }

  xpathTipping = this.page.locator("//th[child::div[normalize-space() = 'Tipping']]//following-sibling::th//div");

  async getEmailTitle(title: string): Promise<boolean> {
    return this.page.locator(`//div[normalize-space()='${title}']`).isVisible();
  }

  async getValueBasedOnTitle(title: string, currencySymbol: string, value: number): Promise<string> {
    const valWithCurrencySymbol = currencySymbol + value;
    const valLocator = await this.page

      .locator(`(//div[normalize-space()='${title}']/following::*[normalize-space()='${valWithCurrencySymbol}'])[1]`)
      .textContent();
    return valLocator.trim();
  }

  /**
   * Open mail Abandoned checkout which is sent for buyer 15-30p later, they create a checkout
   * @param mail Mail of buyer is inputed when buyer create a checkout
   */
  async openMailAbandonedCheckout(mailName = this.emailSubject().abandonedCheckout, email = this.emailBuyer) {
    await this.openMailDetailWithAPI(email, mailName);
    await this.page.waitForSelector(`//a[normalize-space()='Complete your purchase']`);
  }

  /**
   * Open recovery link at abandoned checkout mail
   * @returns checkout page
   */
  async openRecoveryLink(): Promise<SFCheckout> {
    const [newPage] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.page.locator(`//a[normalize-space()='Complete your purchase']`).click(),
    ]);
    return new SFCheckout(newPage, this.domain);
  }

  async openRefundNotification(email = this.emailBuyer) {
    await this.openMailDetailWithAPI(email, this.emailSubject().refundNoti);
  }

  async openShipmentNotification(orderName: string, email = this.emailBuyer): Promise<boolean> {
    await this.openMailDetailWithAPI(email, this.emailSubject(orderName).shipmentConfirm);
    return true;
  }

  //Open email notification when capture orders at order list
  async openCaptureOrderEmail() {
    await this.openMailDetailWithAPI(this.emailBuyer, this.emailSubject().captureOrder);
  }

  async openOrderCanceledNotification(orderName: string, email = this.emailBuyer): Promise<boolean> {
    await this.openMailDetailWithAPI(email, this.emailSubject(orderName).orderCanceled);
    return true;
  }

  //get tipping amount at email confirmation, refund, cancel
  async getTippping() {
    const tippingAmount = await this.page
      .locator("//th[child::div[normalize-space() = 'Tipping']]//following-sibling::th//div")
      .textContent();
    return tippingAmount.trim();
  }

  /**
   * get amount refund for buyer of order after cancel/refund order
   * @param amount refund for buyer
   */
  async getAmountRefundCustomerEmail() {
    return (
      await this.page

        .locator("(//tr[preceding-sibling::tr[descendant::div[contains(text(),'Refund')]]]//div)[2]")
        .textContent()
    ).trim();
  }

  /**
   * email update order có thể bị gửi chậm -> cần wait + retry đến khi nhận được email
   * @param email
   */
  async openMailUpdatePayment(email: string) {
    const checkout = new SFCheckout(this.page, this.domain);
    let retry = 0;
    const emailTitle = "(//td[normalize-space()='Payment needed to update order'])[1]";
    let isVisible = await this.page.locator(emailTitle).isVisible();

    await checkout.openMailBox(email);
    while (retry < 5 && !isVisible) {
      await Promise.all([this.page.waitForLoadState("networkidle"), this.page.reload()]);
      retry++;
      await this.page.waitForTimeout(8000);
      isVisible = await this.page.locator(emailTitle).isVisible();
      if (isVisible) {
        await this.genLoc(emailTitle).click();
        break;
      }
    }
  }

  /**
   * email update order có thể bị gửi chậm -> cần wait + reload đến khi nhận được email
   * * Tại chỗ timout lâu sẽ improve sau, dùng schedule
   * @param orderName
   */
  async openMailEditOrder(orderName: string, email = this.emailBuyer) {
    await this.openMailDetailWithAPI(email, this.emailSubject(orderName).editOrder);
  }

  /**
   * email edit order invoice có thể bị gửi chậm -> cần wait + reload đến khi nhận được email
   * * Tại chỗ timout lâu sẽ improve sau, dùng schedule
   */
  async openMailEditOrderInvoice(email = this.emailBuyer) {
    await this.openMailDetailWithAPI(email, this.emailSubject().updateOrderPayment);
  }

  async clickBtnPayNow() {
    const [newPage] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.page.frameLocator("#html_msg_body").locator("//a[normalize-space()='Pay now']").click(),
    ]);
    await newPage.waitForLoadState("networkidle");
    return new SFCheckout(newPage, this.domain);
  }

  /*
   * get total order at email confirmation, refund, cancel
   *return total order
   */
  async getTotalOrder() {
    const totalOrder = await this.page
      .locator("//th[child::div[normalize-space() = 'Total']]//following-sibling::th//div")
      .textContent();
    return totalOrder.trim();
  }

  /*
   * get refunded amount at email refund, cancel
   * return refunded amount
   */
  async getRefundAmount() {
    const refundAmount = await this.page

      .locator("//div[normalize-space()='Total']/following::div[contains(text(),'- $')]")
      .textContent();
    return refundAmount.trim();
  }

  /**
   * open email confirm cancel order in mail box and click button cancel order
   * @param orderName
   * @returns contactUsPage class
   */
  async confirmCancelOrdInMailBox(orderName: string) {
    await this.openMailDetailWithAPI(this.emailBuyer, this.emailSubject(orderName).requestCancelOrder);
    const [newTab] = await Promise.all([
      this.page.waitForEvent(`popup`),
      this.page.locator(`//a[normalize-space()='CANCEL NOW']`).click(),
    ]);
    await newTab.waitForLoadState();
    return new ContactUsPage(newTab, this.domain);
  }

  /**
   * Open recovery link from abandoned checkout email
   */
  async openCheckoutRecoveryLink() {
    await this.openMailDetailWithAPI(this.emailBuyer, this.emailSubject().abandonedCheckout);
    await this.page.locator("//a[normalize-space()='Complete your purchase']").click();
  }

  /**
   * open mail confirm order in mailbox
   * @returns <string> url product in order
   */
  async openMailConfirmOrderCreator(): Promise<string> {
    await this.openMailDetailWithAPI(this.emailBuyer, this.emailSubject().confirmOrder);
    const [newTab] = await Promise.all([
      this.page.waitForEvent(`popup`),
      this.page.locator(`//a[contains(text(),'Access my products')]`).click(),
    ]);
    const urlPage = await newTab.url();
    return urlPage;
  }

  /**
   * click to open newest Order Confirmation Mail on list mailtothis
   */
  async openNewestOrderConfirmationMail() {
    await this.openMailDetailWithAPI(this.emailBuyer, this.emailSubject().confirmOrder);
  }

  /**
   * get amount on Order Confirmation Email
   * @param label: label of amount. Ex: Subtotal, Discount, Total
   * @returns price
   */
  async getAmountOnOrderConfrimationMail(label: string) {
    const price = await this.page.locator(`(//div[normalize-space()='${label}']//following::div)[1]`).innerText();
    return price;
  }

  genLocProductLine(productName: string, quantity: string): Locator {
    return this.page.locator(`//div[normalize-space()='${productName} x ${quantity}']`);
  }

  /**
   * open mail confirm order in mailbox
   */
  async openMailConfirmOrder(): Promise<Page> {
    await this.openMailDetailWithAPI(this.emailBuyer, this.emailSubject().orderConfirm);
    const [newTab] = await Promise.all([
      this.page.waitForEvent(`popup`),
      this.page.locator(`//a[contains(text(),'Access my products')]`).click(),
    ]);
    await newTab.waitForLoadState();
    return newTab;
  }

  /**
   * Open Customer Activation mail after buyers sign-up successfully at storefront
   * Tại chỗ timout lâu sẽ improve sau, dùng schedule
   */
  async openCustomerActivationNotification(email = this.emailBuyer): Promise<void> {
    await this.openMailDetailWithAPI(email, this.emailSubject().accountActivation);
    await this.page.locator(`//a[normalize-space()='Activate your account']`).isVisible();
  }

  /**
   * Open click Acctivate btn at Customer Activation mail to complete registration
   */
  async clickActivateAcc(): Promise<void> {
    await this.page.locator(`//a[normalize-space()='Activate your account']`).click(),
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Open Customer Welcome mail after buyers activate their account
   * Tại chỗ timout lâu sẽ improve sau, dùng schedule
   */
  async openCustomerWelcomeNotification(email = this.emailBuyer): Promise<void> {
    await this.openMailDetailWithAPI(email, this.emailSubject().accountConfirmation);
    await this.page.locator(`//div[contains(text(),'Welcome to')]`).isVisible();
  }

  /**
   * Open Reset password mail after buyers click forgot mail at log-in page
   * -> fill their mail -> Click "Reset password" btn
   */
  async openResetPassMail(email = this.emailBuyer): Promise<void> {
    await this.openMailDetailWithAPI(email, this.emailSubject().resetPassword);
    await this.page.locator(`//a[contains(text(),'Reset your password')]`).isVisible();
  }

  async getMailContent(): Promise<string> {
    const message = await this.page
      .locator("//div[normalize-space()='Reset your password']//following::div")
      .first()
      .textContent();
    return message;
  }

  async resetPassword(): Promise<Page> {
    const [newTab] = await Promise.all([
      this.page.waitForEvent(`popup`),
      this.page.locator(`//a[contains(text(),'Reset password')]`).click(),
    ]);
    await newTab.waitForLoadState();
    return newTab;
  }

  /**
   * Has lastest mail with title
   * @param title
   * @param option
   * @returns
   */
  async hasLastestMailWithTitle(title: string, option?: { retry: number; delay?: number }): Promise<boolean> {
    if (title) {
      return false;
    }
    const { retry = 6, delay = 2000 } = option || {};
    for (let i = 0; i < retry; i++) {
      await this.page.waitForTimeout(delay);
      if (await this.page.locator(`(//td[contains(text(),'${title}')])[1]`).isVisible()) {
        return true;
      }
      await this.page.reload();
    }
    return false;
  }

  /**
   * click to open newest Sign in Mail on list mailtothis
   * param customer: name of customer
   */
  async openVerifyEmailThenSignIn(customer: string): Promise<Page> {
    await this.openMailDetailWithAPI(this.emailBuyer, this.emailSubject().verifyCode);
    await this.page.waitForSelector(`//div[contains(text(),'${customer}')]`);
    const [newTab] = await Promise.all([
      this.page.waitForEvent(`popup`),
      this.page.locator(`//a[text()[normalize-space()='Sign in now']]`).click(),
    ]);
    await newTab.waitForLoadState("networkidle");
    return newTab;
  }

  /**
   * goto mailinator
   * @param email
   */
  async openMailBox(email: string) {
    this.emailBuyer = email;
  }

  /**
   * click `Track your order` in mail detail after order is created successfully
   */
  async clickTrackOrder() {
    await this.page
      .locator("//tbody//a[normalize-space()='Track your order']|//tbody//a[normalize-space()='View your order']")
      .click();
  }

  /**
   * Submit review in email
   */
  async submitReview(reviewTitle: string, reviewContent: string, typeReview: "Product review" | "Store review") {
    await this.page.locator(`(//td[contains(text(),'think of your purchase')])[1]`).click();
    await this.page.locator('input[name="review_title"]').fill(reviewTitle);
    await this.page.locator('textarea[name="review_content"]').fill(reviewContent);
    await this.page.getByLabel(typeReview).click();
    await this.page.getByRole("button", { name: "Submit your review" }).click();
  }

  // Get storefront name in content mail
  async getStorefrontNameInMail(): Promise<string> {
    const actualStorefrontName = await this.page.locator(`//h1/a`).textContent();
    return actualStorefrontName.trim();
  }

  // Get customer mail in content mail
  async getCustomerMailInMail(): Promise<string> {
    const isvisible = await this.page.locator(`//th/div[contains(text(),'contact us at')]/a`).isVisible();
    if (isvisible) {
      return (await this.page.locator(`//th/div[contains(text(),'contact us at')]/a`).textContent()).trim();
    }
  }

  // click btn in mail body
  async clickBtnInMail(btnName: string) {
    await this.page.locator(`//a[normalize-space()='${btnName}']`).click();
  }

  /**
   * goto mailinator with proxy domain, fill email in Mailinator search box
   * @param email
   */
  async openMailBoxWithProxyDomain(page: Page, email: string): Promise<MailBox> {
    const mailPage = await getMailboxInstanceWithProxy(page, this.domain);
    mailPage.emailBuyer = email;
    return mailPage;
  }

  /**
   * get image by order comfirm
   * @param productName: name of product
   */
  async getImageOnOrderConfrimationMail(productName: string) {
    const image = await this.page.locator(`//img[@alt="${productName}"]`).getAttribute("src");
    return image;
  }

  // Get customer mail in content mail
  async getContentEmailCancelRefund(): Promise<string> {
    const contentEmail = await this.page.locator("//tbody//table[2]//tbody//tr[2]//th").textContent();
    return contentEmail.trim();
  }

  /**
   * Get value of each item in mail detail Import campaign
   */
  async getValueImport(value: string) {
    return await this.page.locator(`(//p[normalize-space()='${value}']//following-sibling::p)[1]`).innerText();
  }

  /**
   * Get content of mail Import campaign
   */

  async getImportStatus(status: ImportCampStatusInMail) {
    const statusInfo: ImportCampStatusInMail = {};
    const statusInfoToFrameLocator = {
      success: "Successfully imported:",
      skip: "Skipped:",
      fail: "Failed:",
      image_status: "Image status:",
    };

    await Promise.all(
      Object.keys(status).map(async key => {
        statusInfo[key] = await this.getValueImport(statusInfoToFrameLocator[key]);
      }),
    );

    return statusInfo;
  }
}
