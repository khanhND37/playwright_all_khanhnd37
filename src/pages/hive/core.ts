import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

export class HivePage extends SBPage {
  xpathFlashMessage = "//div[contains(@class,'alert-dismiss')]";
  xpathBtnCreate = "//button[normalize-space()='Create']";
  xpathBtnAddNew = "//div[@class='navbar-collapse']//i[@class='fa fa-plus-circle']";

  menu = {
    tool: "Tools",
  };

  subMenu = {
    dashboardWidget: "Dashboard Widget",
  };

  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
  }

  async loginToHiveShopBase(username: string, password: string) {
    await this.goto("/admin/login");
    await this.genLoc('[placeholder="Username"]').fill(username);
    await this.genLoc('[placeholder="Password"]').fill(password);
    await this.genLoc("text=Log in").click();
  }

  /**
   * filter Contest with condition
   * @param: condition,value,isInputField
   * condition is option want to filter
   * if value field is InputField => isInputField = true, if value field is dDl is false
   */

  async filter(condition: string, value: string, isInputField: boolean) {
    const formByLabel = `//div[contains(@class,'form-group')][child::label[normalize-space()='${condition}']]`;
    const filter = "//a[@class='dropdown-toggle sonata-ba-action']";
    const cbName = `//li[child::a[normalize-space()='${condition}']]`;
    const btnFilter = "(//button[@placeholder='Filter' or normalize-space()='Filter'])[1]";
    const xpathValue = `${formByLabel}//div[@class='col-sm-4']`;

    await this.genLoc(filter).click();
    await this.genLoc(cbName).click();
    await this.genLoc(filter).click();

    if (isInputField == true) {
      await this.genLoc(`${xpathValue}/input`).fill(value);
    } else {
      await this.genLoc(`${xpathValue}//a`).click();
      const ddl =
        "//div[@id='select2-drop-mask']/following-sibling::div//ul[@role='listbox']" +
        `//li//div[normalize-space()='${value}']`;
      await this.genLoc(ddl).click();
    }
    await this.genLoc(btnFilter).click();
    await this.page.waitForLoadState();
  }

  /**
   * go To Order Edit to refund order
   * @param orderID
   */
  async goToOrderDetail(orderID: number) {
    await this.goto(`/admin/app/checkoutdbentity-order/${orderID}/edit`);
    await this.page.waitForLoadState("load");
  }

  /**
   * refund order in hive
   */
  async refundOrder(refund: string) {
    await this.page.click("//a[normalize-space()='Refund']");
    await this.page.waitForLoadState("networkidle");
    await this.page.locator("//input[@id='refund_amount']").fill(refund);
    for (let i = 0; i < 2; i++) {
      await this.page.locator(".btn-danger").click();
      await this.page.on("dialog", async alert => {
        await alert.accept();
      });
    }

    await this.page.waitForSelector("//div[@class='alert alert-success alert-dismissable']");
  }

  /**
   * Get message when create/update in hive
   * Example message: Item "App\Entity\DashboardWidget:0000000025b3b7c1000000007c2a96f6" has been successfully updated.
   * @returns
   */
  async getFlashMessage(): Promise<string> {
    return this.page.innerText(this.xpathFlashMessage);
  }

  async navigateToMenu(menuName: string, subMenuName: string) {
    await this.page.waitForSelector("ul.sidebar-menu");
    await this.page.click(`span:has-text('${menuName}')`);
    await this.page.waitForSelector(".treeview-menu.menu-open");
    await this.page.locator(`aside >> text=${subMenuName}`).click();
  }

  async clickAddNewButton(): Promise<void> {
    await this.genLoc(`//li[normalize-space()="Add new"]`).click();
  }

  /**
   * Clear data shop để tạo lại shop từ luồng survey
   * @param shopID: shop id của shop cần clear
   */
  async clearShopDataInHive(shopID: string) {
    await this.goto(`admin/tool/storefront-clear-shop-data`);
    await this.genLoc("//input[@class='form-control']").click();
    await this.page.keyboard.press("Backspace");
    await this.genLoc("//input[@class='form-control']").fill(shopID);
    await this.genLoc("//button[normalize-space()='Clear']").click();
  }

  /**
   * Click action of 1 record
   * @param name name record
   * @param action name action
   * */
  async clickActionByName(name: string, action: string) {
    const xpathAction = `//td[normalize-space()='${name}']//following-sibling::td//div//a[normalize-space()='${action}']`;
    await this.page.locator(xpathAction).click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async clickOnButton(name: string) {
    await this.genLoc(`//div[contains(@class,'form-actions')]//button[normalize-space()='${name}']`).click();
  }
}
