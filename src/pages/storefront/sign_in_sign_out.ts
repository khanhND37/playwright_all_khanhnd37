import { SBPage } from "@pages/page";

export class SingInSignOut extends SBPage {
  xpathInputEmail = "(//div//input[@type='email'])[1]";
  xpathSignInBtn = "//button[normalize-space()='Sign in']";
  xpathInputPassword = "//div//input[@type='password']";
  xpathOrderHistorySection = `//a[@href="/account/order-history"]//span`;
  xpathNoOrderInOrderHistoryText = "//p[normalize-space()='You haven’t placed any orders yet']";
  xpathHaveOrderInOrderHistory = "//table[@class='table digital-product__profile__table']";
  xpathIconAvatar = "//div[contains(@class,'menu-item--avata')]";
  xpathSignInPage = "//div[@class='sign-in-with-pass']";
  xpathPagination = "//div[contains(@class,'pagination')]";
  xpathOrderHistoryGrid = "//div[contains(@class,'section-address digital-product__profile')]";

  /**
   * sign in to storefront shopbase with password
   * @param email
   * @param pass
   */
  async loginWithPassword(email: string, password: string): Promise<void> {
    await this.page.goto(`https://${this.domain}/sign-in`);
    await this.page.waitForSelector(this.xpathSignInBtn);
    await this.genLoc(this.xpathInputEmail).fill(email);
    await this.genLoc(this.xpathInputPassword).fill(password);
    await this.page.locator(this.xpathSignInBtn).click();
    await this.page.waitForLoadState("load");
    await this.page.waitForSelector(`//div[contains(@class, 'profile-avatar')]`);
  }

  async clickMenuItemAtAvtIcon(item: string): Promise<void> {
    await this.genLoc(`//p[normalize-space() = '${item}']`).click();
  }

  /**
   * Go to Order History tab from My profile tab
   */
  async goToOrderHistory(): Promise<void> {
    await this.genLoc(this.xpathOrderHistorySection).click();
  }

  /**
   * Go to My profile tab
   */
  async goToMyProfile(): Promise<void> {
    await this.page.goto(`https://${this.domain}/my-profile`);
  }

  /**
   * Switch page in order history tab
   */
  async switchPageByPagination(numberOfPage: number): Promise<void> {
    const xpathBackOfpagination = `(//ul[contains(@class,'pagination-list')]/li)[${numberOfPage}]`;
    await this.page.waitForSelector(xpathBackOfpagination);
    await this.page.locator(xpathBackOfpagination).click();
    // check icon back, next page
    switch (numberOfPage) {
      case 1:
        await this.page.waitForSelector(
          "//button[contains(@class,'pagination-previous')  and contains(@class, 'disabled')]",
        );
        break;
      case 2:
        await this.page.locator("//button[contains(@class,'pagination-previous')]").isEnabled();
        break;
      case 3:
        await this.page.waitForSelector(
          "//button[contains(@class,'pagination-next')  and contains(@class, 'disabled')]",
        );
        break;
      default:
        break;
    }
  }

  /**
   * Count the number of orders in one page
   */
  async countOrdersInOrderHistoryPage(numberOfPage: number): Promise<number> {
    await this.switchPageByPagination(numberOfPage);
    const xpathInvoiceButton = "//button[normalize-space()='Invoice']";
    if (numberOfPage == 0 || numberOfPage >= 4) {
      return 0;
    } else {
      return this.genLoc(xpathInvoiceButton).count();
    }
  }
}
