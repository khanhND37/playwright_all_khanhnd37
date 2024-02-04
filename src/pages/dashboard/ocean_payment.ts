import type { OceanpaymentAccount } from "@types";
import { DashboardPage } from "./dashboard";

export class OceanPaymentPage extends DashboardPage {
  xpathBtnAddNewAccountOceanpayment =
    "//section[@class='card payment_setting']//a[normalize-space()='Add a new account']";
  xpathAccountConnect = "//section[@class='card payment_setting']//div[@class='provider']";
  private xpathBtnRemove = "//button[normalize-space()='Remove']";
  xpathBtnChooseAlternativeProvider =
    "//section[@class='card payment_setting p-b']//span[normalize-space()='Choose alternative provider']";
  xpathProviderOceanpayment =
    "//tbody//tr//td[contains(normalize-space(),'OceanPayment') or contains(normalize-space(),'Oceanpayment')]";
  private xpathBtnAddAccount = "//span[normalize-space()='+ Add account']";
  private xpathTextLinkRemoveAccount =
    "(//section[@class='card payment_setting']//div[@class='provider'])[1]//a[normalize-space()='Remove account']";
  xpathBlockAlternativeMethods = "//div[@class='row']//h2[normalize-space()='Alternative methods']";

  /**
   * Fill infor account to connect Ocean payment method
   * @param account
   * @param terminal
   * @param secureCode
   */
  async fillInforAccOceanPayment(data: OceanpaymentAccount) {
    await this.genLoc(this.getLocatorInput("Account Name")).fill(data.account_name);
    await this.genLoc(this.getLocatorInput("Acount")).fill(data.account);
    await this.genLoc(this.getLocatorInput("Terminal")).fill(data.terminal);
    await this.genLoc(this.getLocatorInput("Secure")).fill(data.secure_code);
    await this.genLoc(this.xpathBtnAddAccount).click();
  }

  async removeListAccountConnect() {
    const numberAccount = await this.genLoc(this.xpathAccountConnect).count();
    for (let i = 1; i <= numberAccount; i++) {
      await this.genLoc(`(${this.xpathAccountConnect})[1]`).scrollIntoViewIfNeeded();
      await this.genLoc(`(${this.xpathAccountConnect})[1]`).click();
      await this.genLoc(this.xpathTextLinkRemoveAccount).scrollIntoViewIfNeeded();
      await this.genLoc(this.xpathTextLinkRemoveAccount).click();
      await this.genLoc(this.xpathBtnRemove).click();
      await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
      await this.page.reload();
    }
  }

  getLocatorInput(label: string): string {
    return `//label[contains(text(),'${label}') or child::span[contains(text(),'${label}')]]//ancestor::div[contains(@class,'s-form-item')]//input`;
  }

  getLocatorAccountName(accountName: string): string {
    return `//section[@class='card payment_setting']//div[@class='provider']//strong[text()='${accountName}']`;
  }

  async connectAccountOceanpayment(data: OceanpaymentAccount) {
    await this.genLoc(this.xpathBtnChooseAlternativeProvider).click();
    await this.genLoc(this.xpathProviderOceanpayment).click();
    await this.waitUntilElementVisible(this.xpathBtnAddAccount);
    await this.fillInforAccOceanPayment(data);
    await this.waitUntilElementVisible(this.xpathToastMessage);
  }

  /**
   * Get các thông tin, các trường hiển thị ở trang connect account oceanpayment
   * @returns
   */
  async verifyInfoConnectAccountPage(): Promise<boolean> {
    let verifyInfoConnectAccountPage = false;
    const dataInfo = {
      isTitleVisible: await this.genLoc(
        "//div[@class='add-customer-heading']//div[normalize-space()='Oceanpayment' or normalize-space()='OceanPayment (Beta)']",
      ).isVisible(),
      isTextLinkVisible: await this.genLoc("//a[normalize-space()='List of supported currencies']").isVisible(),
      isAccountNameVisible: await this.genLoc("//label[child::span[contains(text(),'Account Name')]]").isVisible(),
      isAcountVisible: await this.genLoc("//label[contains(text(),'Acount')]").isVisible(),
      isTerminalVisible: await this.genLoc("//label[contains(text(),'Terminal')]").isVisible(),
      isSecureCodeVisible: await this.genLoc("//label[contains(text(),'Secure code')]").isVisible(),
      isBtnAddAccount: await this.genLoc(this.xpathBtnAddAccount).isVisible(),
    };
    if (dataInfo) {
      verifyInfoConnectAccountPage = true;
    }
    return verifyInfoConnectAccountPage;
  }
}
