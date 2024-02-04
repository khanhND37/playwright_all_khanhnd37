import { SBPage } from "@pages/page";

export class SettingsDigital extends SBPage {
  //Quay về trang setting
  async backToSettingsPage() {
    await this.page.locator(`//div[contains(@class,'setting-page')]//a[normalize-space()='Settings']`).click();
    await this.page.waitForLoadState("networkidle");
  }
}
