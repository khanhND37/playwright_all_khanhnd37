import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

export class Website extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Hàm tạo library cho SB Creator
   * @param title
   * @param description
   */
  async createLibrary(title: string, description?: string) {
    await this.genLoc("//button[normalize-space()='Create a library']").click();
    await this.page.fill("[placeholder='Library name']", title);
    if (description) {
      await this.page.fill("[placeholder='Type your description here']", description);
    }
    await this.genLoc("//button[normalize-space()='Save']").click();
  }
}
