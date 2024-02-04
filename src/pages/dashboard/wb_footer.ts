import { WebBuilder } from "./web_builder";
import { Locator, Page } from "@playwright/test";

export class WbBlockFooter extends WebBuilder {
  static selectorFooterWB = '[data-block-component="pb-plb-footer"]';
  static selectorInputSocialLink = ".w-builder__popover.widget-social__add>>input";
  static selectorInputSwitch = ".w-builder__widget--switch>>input";
  static socialLinkItems = ".widget-social__item-wrapper";
  static selectorActionSoical = ".sb-pointer";
  settingsLoc: Locator;

  constructor(page: Page, domain?: string) {
    super(page, domain);
    this.settingsLoc = this.page.locator(this.layerDetailLoc);
  }

  xpathTextFooter(textFooter: string, index = 1): string {
    return `(//*[contains(text(),"${textFooter}")])[${index}]`;
  }

  /**
   * Get all heading on footer
   * @returns custom text setting
   */
  async getSettingCustomText(): Promise<string> {
    const customTextLoc = this.genLoc(`${this.getSelectorByLabel("custom_text")}//textarea`);
    const customText = await customTextLoc.inputValue();
    return customText;
  }

  /**
   * * Get copyright text on footer
   * @returns  copyright text on footer
   */
  async getCopyrightText(): Promise<string> {
    const copyrightTextLoc = this.genLoc(`(${this.getSelectorByLabel("copyright_text")}//input)[1]`);
    const copyrightText = await copyrightTextLoc.inputValue();
    return copyrightText;
  }

  /**
   * Focus on footer section on side pane
   */
  async focusOnLayerPane() {
    await this.page.click(this.getArrowBtnOfLayer({ sectionName: "Footer" }));
    await this.page.click(this.getSidebarSelectorByName({ sectionName: "Footer", subLayerName: "Footer" }));
  }

  /**
   * Get social links on footer settings
   * @returns link
   */
  getInputSocialLocator(): Locator {
    return this.page.getByRole("tooltip").locator(WbBlockFooter.selectorInputSocialLink);
  }

  /**
   * Set social link on footer settings
   * @param link
   */
  async inputAddSocialLink(link: string) {
    await this.page.getByRole("tooltip").locator(WbBlockFooter.selectorInputSocialLink).fill(link);
  }

  /**
   * Click edit button social link on footer settings
   * @param { index: index of social link, last: ignore index, set last social link }
   */
  async clickEditSocialLink({ index = 1, last = false }: { index?: number; last?: boolean } = {}) {
    if (last) {
      await this.settingsLoc
        .locator(WbBlockFooter.socialLinkItems)
        .last()
        .locator(".sb-popover__reference")
        .first()
        .click();
    } else {
      await this.settingsLoc
        .locator(WbBlockFooter.socialLinkItems)
        .nth(index)
        .locator(".sb-popover__reference")
        .first()
        .click();
    }
  }

  /**
   * Click outside to apply added/edited social link
   */
  async applyEditSocialLink() {
    await this.settingsLoc
      .locator(WbBlockFooter.socialLinkItems)
      .last()
      .locator(".sb-popover__reference")
      .first()
      .click();
  }

  /**
   * Get option show heading info value
   * @returns true if option is on, otherwise false
   */
  async getSettingShowSettingInfo() {
    await this.switchToTab("Content");
    const widgetSelector = this.getSelectorByLabel("show_heading_store_info");
    const headingToggleLoc = this.genLoc(widgetSelector).locator(WbBlockFooter.selectorInputSwitch);
    return (await headingToggleLoc.inputValue()) === "true";
  }
}
