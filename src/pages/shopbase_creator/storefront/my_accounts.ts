import { SBPage } from "@pages/page";
import { MailBox } from "@pages/thirdparty/mailbox";
import { BrowserContext } from "@playwright/test/types/test";
import { waitTimeout } from "@utils/api";
import { getMailinatorInstanceWithProxy } from "@utils/mail";

export type Order = {
  orderID: string;
  productName: string;
  orderDate: string;
  paymentStatus?: string;
  total: string;
};

export type Invoice = {
  email: string;
  product: string;
  total: string;
};

export class MyAccountPage extends SBPage {
  xpathMyAvatar = "//div[contains(@class, 'menu-item--avatar')]";
  xpathLogoutOption = "//div[@class='user-menu']//li[normalize-space()='Log out']";
  xpathSignInBtn = "//button[normalize-space()='Sign in']";
  xpathInputEmail = "//div//input[@type='email']";
  xpathInputPassword = "//div//input[@type='password']";
  xpathChangePassword = "//div[@class='user-menu']//li[normalize-space()='Change password']";
  xpathTitleMyProductsPage = "//h1[normalize-space()='My products']";
  xpathBtnUpdatePassword = "//button[normalize-space()='Update password']";
  xpathMessageLoginError = "//p[contains(@class, 'error-message')]";
  xpathAvatar = "//header//div[contains(@class,'avatar')]";
  xpathBtnSaveChange = "//div[contains(@class,'profile')]//button[@type='submit']";
  xpathProfile = "//div[@class='flex align-end']//label";
  xpathEditAvatar = "//div[contains(@class,'upload')]//label";
  xpathInputProfileEmail = "//input[@name='email-address']";
  xpathMessage = "//span[contains(@class,'notification__message')]";
  xpathUsername = "//p[contains(@class,'profile__username')]";
  xpathTitleSignIn = "//section//div[contains(@class,'sign-in')]//p[contains(@class,'heading')]";
  xpathForgotPassWord = " //form[contains(@class,'customer-container')]//a[contains(@class,'link-text')]";
  xpathLabelEmailResetPassword = "//form[contains(@class,'customer-container')]//label";
  xpathInputEmailResetPassword = "//form[contains(@class,'customer-container')]//input";
  xpathFirstBtnInvoice = "(//tbody[contains(@class,'digital-product__profile')]//tr//td)[6]//button";
  xpathFirstOrderID = "(//tbody[contains(@class,'digital-product__profile')]//tr)[1]//td//a";
  xpathBtnBack = "//div[contains(@class,'flex align-center')]//p";
  xpathRowProfile = "//tbody[contains(@class,'digital-product__profile')]//tr";
  xpathTitleResetPassword = "//p[normalize-space()='Reset password']";
  xpathBtnSubmit = "//button[normalize-space()='Submit']";
  xpathBtnBackToLogin = "//button[normalize-space()='Back to login']";
  xpathBtnResetPasswordOnMail = "//a[contains(text(),'Reset password')]";
  xpathFormLogin = "//div[contains(@class,'container-page login')]";
  xpathSendCodeBtn = "//button[normalize-space()='Send code']";

  /**
   * sign in to storefront shopbase creator
   * @param email
   * @param pass
   */
  async login(email: string, subjectEmail: string, context: BrowserContext): Promise<void> {
    await this.page.goto(`https://${this.domain}/sign-in`);
    await this.page.waitForSelector(this.xpathSendCodeBtn);
    await this.genLoc(this.xpathInputEmail).fill(email);
    await this.page.locator(this.xpathSendCodeBtn).click();
    const code = await this.getCodeInEmail(email, subjectEmail, context);
    await this.genLoc(this.xpathInputEmail).fill(code);
    await this.page.locator(this.xpathSignInBtn).click();
    await this.page.waitForLoadState("load");
  }

  /**
   * get code in email when sign in to storefront shopbase creator
   * @param email email login storefront
   * @param subjectEmail title email
   * @returns
   */
  async getCodeInEmail(email: string, subjectEmail: string, context: BrowserContext): Promise<string> {
    const newTab = await context.newPage();
    await newTab.goto(`https://www.mailinator.com/`);
    const mailinator = await getMailinatorInstanceWithProxy(newTab);
    await mailinator.accessMail(email);
    await mailinator.readMail(subjectEmail);
    const code = await mailinator.getContentMail();
    return code.trim();
  }

  async gotoSignInPage(): Promise<void> {
    await this.page.goto(`https://${this.domain}/sign-in`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Input data: email, password and click btn Sign in
   * @param email
   * @param pass
   */
  async inputAndClickSignIn(email: string, pass: string): Promise<void> {
    await this.genLoc(this.xpathInputEmail).fill(email);
    await this.genLoc(this.xpathInputPassword).fill(pass);
    await this.page.locator(this.xpathSignInBtn).isEnabled();
    await this.genLoc(this.xpathSignInBtn).click();
  }

  async logOut(): Promise<void> {
    await this.genLoc(this.xpathMyAvatar).click();
    await this.genLoc(this.xpathLogoutOption).click();
  }

  async gotoChangePassPage(): Promise<void> {
    await this.genLoc(this.xpathMyAvatar).click();
    await this.genLoc(this.xpathChangePassword).click();
  }

  /**
   * input current, new and confirm password and click btn Update
   * @param currentPass
   * @param newPass
   * @param confirmPass
   */
  async changePass(currentPass: string, newPass: string, confirmPass: string): Promise<void> {
    await this.genLoc("//input[@name='old-password']").fill(currentPass);
    await this.genLoc("//input[@name='password']").fill(newPass);
    await this.genLoc("//input[@name='password-confirm']").fill(confirmPass);
    await this.genLoc(this.xpathBtnUpdatePassword).click();
  }

  getXpathToastMessage(message: string): string {
    return `//span[contains(@class,'notification__message') and normalize-space()='${message}']`;
  }
  async openMenuItemPage(menuItem: string) {
    await this.genLoc(`//div[@class='user-menu']//p[normalize-space()='${menuItem}']`).click();
  }

  async inputProfile(firstName?: string, lastName?: string, image?: string, phone?: string) {
    if (firstName) {
      await this.page.fill(
        `${this.xpathProfile}[normalize-space()='First name']//parent::div//following-sibling::div//input`,
        firstName,
      );
    }
    if (lastName) {
      await this.page.fill(
        `${this.xpathProfile}[normalize-space()='Last name']//parent::div//following-sibling::div//input`,
        lastName,
      );
    }
    if (image) {
      await this.page.setInputFiles("input[type='file']", image);
    }
    if (phone) {
      await this.page.fill(
        `${this.xpathProfile}[normalize-space()='Phone number']//parent::div//following-sibling::div//input`,
        phone,
      );
    }
  }

  async getOrderOnPurchaseHistory(): Promise<Order> {
    const order = {
      orderID: await this.getTextContent(this.xpathFirstOrderID),
      productName: await this.getTextContent(`(${this.xpathRowProfile}//td)[2]//p`),
      orderDate: await this.getTextContent(`(${this.xpathRowProfile}//td)[3]`),
      paymentStatus: await this.getTextContent(`(${this.xpathRowProfile}//td)[4]`),
      total: await this.getTextContent(`(${this.xpathRowProfile}//td)[5]//span`),
    };
    return order;
  }

  async getOrderDetailOnPurchaseHistory(): Promise<Order> {
    const orderDetail = {
      orderID: await this.getTextContent(
        "//div[@class='purchase-history-template']//div[contains(@class,'order-title')]",
      ),
      productName: await this.getTextContent("(//div[contains(@class,'order-detail__table--data')]//div)[1]"),
      orderDate: await this.getTextContent("//div[contains(@class,'order-date')]"),
      total: await this.getTextContent("//div[contains(@class,'table--foot')]//div[contains(@class,'text-bold')]"),
    };
    return orderDetail;
  }

  async getInvoiceOrder(): Promise<Invoice> {
    const invoice = {
      email: await this.getTextContent("(//div[@class='invoice-detail__body']//div[contains(@class,'text')])[3]"),
      product: await this.getTextContent("(//tbody//tr//td)[1]"),
      total: await this.getTextContent("(//tbody//tr//td)[2]"),
    };
    return invoice;
  }

  async goToForgotPassScreen(): Promise<void> {
    await this.page.goto(`https://${this.domain}/sign-in`);
    await this.page.waitForSelector(this.xpathSignInBtn);
    await this.genLoc(this.xpathForgotPassWord).click();
  }

  async inputEmail(email: string): Promise<void> {
    await this.genLoc(this.xpathInputEmail).fill(email);
    await this.genLoc(this.xpathBtnSubmit).click();
  }

  async getToastMsg(): Promise<string> {
    const msg = await this.getTextContent(this.xpathMessage);
    return msg;
  }

  async getMsgNotiSentEmail(): Promise<string> {
    const msg = await this.getTextContent("//div[normalize-space()='Reset password']//following::div//p");
    return msg;
  }

  async openMailBox(email: string): Promise<MailBox> {
    await this.page.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${email}`);
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForSelector(`//div[@class='nav-logo']`);
    return new MailBox(this.page, this.domain);
  }

  async resetPass(newPass: string, confirmPass: string): Promise<void> {
    await this.genLoc("//div[normalize-space()='New password']//following-sibling::input").fill(newPass);
    await this.genLoc("//div[normalize-space()='Confirm password']//following-sibling::input").fill(confirmPass);
    await this.genLoc("//button[normalize-space()='Reset password']").click();
  }

  /**
   * sent OTP code
   * @param email
   * Chờ 10s, để bên thứ 3 gửi mail.
   */
  async sendCode(email: string): Promise<void> {
    await this.genLoc(this.xpathInputEmail).fill(email);
    await this.page.locator(`//button[child::span[text()[normalize-space()='Send code']]]`).click();
    await this.page.waitForSelector("//*[text()='Enter the code we sent to']");
    await waitTimeout(10000);
  }
}
