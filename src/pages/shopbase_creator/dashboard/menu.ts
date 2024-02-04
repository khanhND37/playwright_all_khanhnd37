import { DashboardPage } from "@pages/dashboard/dashboard";
import type { Menu } from "@types";

export class MenuDashboard extends DashboardPage {
  xpathPage404 = "//div[@class='page-404 text-center']";

  /**
   * get list thông tin menu tại dashboard
   */
  async getMenu(): Promise<Menu[]> {
    const menus = [];
    const count = await this.page
      .locator("//li[contains(@class,'menu')]//a[contains(@class,'text-decoration-none')]")
      .count();
    for (let i = 0; i < count; i++) {
      const name = await this.getTextContent(
        `(//a[contains(@class,'text-decoration-none')]//span[@class='unite-ui-dashboard__aside--text'])[${i + 1}]`,
      );
      const url = await this.genLoc(
        `(//li[contains(@class,'pos-rlt menu')]//a[contains(@class,'text-decoration-none')])[${i + 1}]`,
      ).getAttribute("href");
      const menu = {
        menu: name,
        url: url,
      };
      menus.push(menu);
    }
    return menus;
  }

  /**
   * get list thông tin của child menu tại dashboard
   */
  async getchildMenu(menuName: string): Promise<Menu[]> {
    await this.page.waitForTimeout(2000);
    const menus = [];
    const count = await this.page
      .locator(`//span[normalize-space()='${menuName}']//ancestor::li//li[@class='li-last-step m-x-12']//a`)
      .count();
    for (let i = 0; i < count; i++) {
      const name = await this.getTextContent(
        `(//span[normalize-space()='${menuName}']//ancestor::li//li[@class='li-last-step m-x-12']//span)[${i + 1}]`,
      );
      const url = await this.genLoc(
        `(//span[normalize-space()='${menuName}']//ancestor::li//li[@class='li-last-step m-x-12']//a)[${i + 1}]`,
      ).getAttribute("href");
      const menu = {
        menu: name,
        url: url,
      };
      menus.push(menu);
    }
    return menus;
  }

  async getMenuHref(menu: string): Promise<string> {
    return await this.genLoc(`//span[contains(normalize-space(),'${menu}')]//ancestor::a`).getAttribute("href");
  }
}
