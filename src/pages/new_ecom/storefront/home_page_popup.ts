import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";

export class HomePagePopup extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async removeExitPageTime() {
    await this.page.evaluate(() => {
      window.localStorage.removeItem("exit_page_time");
    });
  }

  async setExitPageTime(value) {
    await this.page.evaluate(() => {
      window.localStorage.setItem("exit_page_time", value);
    });
  }
}
