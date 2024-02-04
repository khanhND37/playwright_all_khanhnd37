import { Personalize } from "@pages/dashboard/personalize";

export class AppPage extends Personalize {
  xpathResultSearch = "//div[@class='sb-p-medium block-parent row ']";

  /**
   * Xpath app name on App list
   * @param appName : name of app
   * @returns
   */
  xpathAppName(appName: string): string {
    return `//p[normalize-space()='${appName}']`;
  }

  /**
   * Xpath Toggle On/Off app
   * @param appName : name of app
   * @returns
   */
  xpathToggleOnOffAppName(appName: string): string {
    return `//p[normalize-space()='${appName}']//ancestor::div[@class='sb-block-item__content']//span[@class='sb-switch__switch sb-relative is-default']`;
  }

  /**
   * Xpath Toggle On/Off app
   * @param appName : name of app
   * @param status : status of toast message after turn on /off app
   * @returns
   */
  xpathToastMessageApp(appName: string, status: string): string {
    return `(//div[normalize-space()='${appName} has been successfully ${status}'])[2]`;
  }

  /**
   * Search app
   * @param keyword order name need input
   */
  async searchApp(keyword: string) {
    await this.page.fill("//input[@class='sb-input__input']", keyword);
    await this.page.waitForTimeout(2000);
  }
}
