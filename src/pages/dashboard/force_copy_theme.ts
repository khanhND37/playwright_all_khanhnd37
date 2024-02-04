/* eslint-disable camelcase */
import { expect } from "@playwright/test";
import type { LongThemeInfo, ThemeInfo } from "@types";
import { DashboardPage } from "./dashboard";

export class ForceShareTheme extends DashboardPage {
  xpathThemeAction =
    "//li[@class='themes-list__row']//button[normalize-space()='Actions']/span | //div[@class='page-designs__theme']//div[@class='sb-relative']//button";
  xpathBtnCopy = "//button[normalize-space()='Copy a theme' or normalize-space()='Copy a template']";
  xpathBtnRemove = "(//li[@class='sb-dropdown-menu__item']/div[normalize-space()='Remove'])";

  /**
   * click menu user
   */
  async clickMenuUserSetting() {
    await this.page.locator(`//p[normalize-space()='${this.domain}']`).click();
  }

  /**
   * select shop
   */
  async gotoSelectShop() {
    await this.page.locator(`//p[normalize-space()='${this.domain}']`).click();
    await this.page.locator(`//div[normalize-space()='Select another shop']`).click();
    await this.page.waitForLoadState();
  }

  /**
   * rename theme
   * @param name original theme name
   * @param themeId
   * @param curTheme isCurrentTheme?
   */
  async renameTheme(name: string, themeId: string, curTheme: boolean) {
    const date = new Date().getTime();
    if (curTheme) {
      await this.clickBtnAction(themeId, true);
    } else {
      await this.clickBtnAction(themeId, true);
    }
    await this.page.locator("//span[normalize-space()='Rename']").click();
    await this.page.locator(`//input[@class='s-input__inner']`).fill(`${name} - ${date}`);
    await this.page.locator("//span[normalize-space()='Save']").click();
    //*[contains(text(), 'Your theme has been renamed')]
  }

  /**
   * get current theme name
   * @param curTheme
   * @return <string> current theme name
   */
  async getThemeName(curTheme: boolean): Promise<string> {
    let name: string;
    if (curTheme) {
      name = await this.page.innerText("//h3[contains(@class,'theme__title')]");
    } else {
      name = await this.page.innerText("//h3[contains(@class,'theme__title')]");
    }
    return name;
  }

  /**
   * get current theme
   * @return <object> current theme info: themeId, type
   */
  async getCurrentTheme(): Promise<ThemeInfo> {
    const curThemeInfo = {
      theme_id: await this.page.innerText(
        "//section[contains(@class,'current-theme')]/div[2]//p[@class='published-theme__id']/span",
      ),
      type: await this.page.innerText("//section[contains(@class,'current-theme')]/div[2]//h3/span"),
    };
    return curThemeInfo;
  }

  /**
   * get number of theme in theme list
   * @return <number> number of theme in theme list
   */
  async getThemeNumberInMoreTheme(): Promise<number> {
    const themeNumber = await this.page.locator("//p[contains(@class,'theme-title')]").count();
    return themeNumber;
  }

  /**
   * get more theme by Theme name
   * @param type
   * @return <object> more theme info: themeId, type, time
   */
  async getThemeInMoreTheme(type: string): Promise<LongThemeInfo> {
    const moreThemeInfo = {
      theme_id: await this.page.innerText(
        `(//div[child::span[normalize-space()='${type}']])[1]//preceding-sibling::div//span[@class='type--subdued']`,
      ),
      type: await this.page.innerText(`(//div[@class='s-flex-item themes-list__date'])[1]/span/span`),
      time: await this.page.innerText(`(//div[@class='s-flex-item themes-list__date'])[2]/p`),
    };

    return moreThemeInfo;
  }

  /**
   * click btn Copy theme
   */
  async clickBtnCopyTheme() {
    await this.page.locator("//span[normalize-space()='Copy a theme']").click();
    await this.page.waitForSelector("//div[@class='s-animation-content s-modal-content']");
  }

  /**
   * fill themeId
   * @param theme
   */
  async completeCopiedTheme(theme: string) {
    await this.page.locator("//input[@id='theme-id']").fill(theme);
    await this.page.locator("//span[normalize-space()='Copy theme']").click();
  }

  /**
   * click button Actions
   * @param themeId
   * @param curTheme =? current theme
   */
  async clickBtnAction(themeId: string, curTheme: boolean) {
    if (curTheme) {
      await this.page
        .locator("//div[@class='published-theme__actions']//button[normalize-space()='Actions']/span")
        .click();
    } else {
      await this.page
        .locator(`//ul//span[normalize-space()='${themeId}']//ancestor::li//button[normalize-space()='Actions']/span`)
        .click();
    }
  }

  /**
   * Remove theme if number of theme >= limit theme
   * click btn Actions
   * click option Remove
   * click btn Remove in Remove theme popup
   * @param index
   */
  async removeTheme(index: number) {
    await this.page.locator(`(${this.xpathThemeAction})[${index}]`).click();
    await this.page.locator("//div[@class='s-dropdown-content']/span[normalize-space()='Remove']").click();
    await this.page.locator("//span[normalize-space()='Remove']").click();
  }

  /**
   * get item into dropdown list when click btn Actions of Current theme
   * @return <string> item into Actions dropdown
   */
  async getItemIntoDroplist() {
    const number = await this.page.locator("//div[@class='s-dropdown-content']/span").count();
    const itemList = [];
    for (let i = 1; i <= number; i++) {
      const item = await this.page.innerText(`//div[@class='s-dropdown-content']/span[${i}]`);
      itemList.push(item);
    }
    return itemList.toString();
  }

  /**
   * click button Cancel to close popup copy theme
   */
  async closePopupCopyTheme() {
    await this.page.locator("//span[normalize-space()='Cancel']").click();
  }

  /**
   * click btn Mark as public/private
   * @param curTheme =?current theme
   */
  async clickBtnMarkAs(curTheme: boolean) {
    if (curTheme) {
      await this.page.locator("//div[@class='s-dropdown-content']/span[5]").click();
    } else {
      await this.page.locator("//div[@class='s-dropdown-content']/span[6]").click();
    }
  }

  /**
   * click btn X / btn Cancel to close popup Mark as theme
   * @param btnCancel == X | == btn cancel
   */
  async closePopupMarkAsTheme(btnCancel: boolean) {
    if (btnCancel) {
      await this.page.locator("//span[normalize-space()='Cancel']").click();
    } else {
      await this.page.locator("//button[@class='s-modal-close is-large']").click();
    }
  }

  /**
   * click Update to apply new type(private/ public) for theme
   */
  async clickBtnUpdate() {
    await this.page.locator("//span[normalize-space()='Update']").click();
  }

  /**
   * get popup Mark as theme
   * @return <object> Mark as theme info: title, description, btnUpdate, btnCancel
   */
  async getModalInfo() {
    const modalPublicInfo = {
      title: await this.page.innerText("//h4[@class='s-modal-title']"),
      description: await this.page.innerText("//div[@class='s-modal-body']//p"),
      btnUpdate: await this.page.innerText(
        "//div[@class='s-modal-wrapper']//button[@class='s-button is-primary']/span",
      ),
      btnCancel: await this.page.innerText(
        "//div[@class='s-modal-wrapper']//button[@class='s-button is-default']/span",
      ),
    };
    return modalPublicInfo;
  }

  /**
   * get shop theme by API
   * @param domain
   * @param accessToken
   * @return <object>
   */
  async getShopThemeByAPI(domain: string, accessToken: string) {
    const response = await this.page.request.get(
      `https://${domain}/admin/themes.json?order_by=updated_at&order_direction=desc&access_token=${accessToken}`,
    );
    expect(response.status()).toBe(200);
    return response.json();
  }

  /**
   * get current theme info by API
   * @param domain
   * @param accessToken
   * @return <object> Current theme info:  themeId, type
   */
  async getCurrentThemeByAPI(domain: string, accessToken: string) {
    const jsonResponse = await this.getShopThemeByAPI(domain, accessToken);
    const active = jsonResponse.shop_themes.filter(shop_themes => shop_themes.active == true);
    const curThemeInfo = {
      themeId: active[0].id,
      type: active[0].access_type,
    };
    return curThemeInfo;
  }

  /**
   * get theme info in more theme by API
   * @param domain
   * @param accessToken
   * @param themeName
   * @param type private | public
   * @return <object> More theme info: themeId, type
   */
  async getMoreThemeByAPI(domain: string, accessToken: string, themeName: string, type: string) {
    const jsonResponse = await this.getShopThemeByAPI(domain, accessToken);
    const inactive = jsonResponse.shop_themes.filter(
      shop_themes =>
        shop_themes.active == false && shop_themes.name == `${themeName}` && shop_themes.access_type == `${type}`,
    );
    const moreThemeInfo = {
      themeId: inactive[0].id,
      type: inactive[0].access_type,
    };
    return moreThemeInfo;
  }

  /**
   * Remove all theme of store
   */
  async removeAllThemes() {
    await this.page.waitForSelector(this.xpathBtnCopy);
    for (let i = await this.genLoc(this.xpathThemeAction).count(); i > 0; i--) {
      await this.page.locator(`(${this.xpathThemeAction})[${i}]`).click();
      await this.page
        .locator(`//div[@class='s-dropdown-content']/span[normalize-space()='Remove'] | ${this.xpathBtnRemove}[${i}]`)
        .click();
      await this.page.locator("//span[normalize-space()='Remove']").click();
    }
  }
}
