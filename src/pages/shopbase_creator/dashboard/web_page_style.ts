import { WebBuilder } from "@pages/dashboard/web_builder";
import { WebsitePageStyle } from "@constants/web_builder";
import type { Border, Shadow, BackGround } from "@types";
import { Locator } from "@playwright/test";

export class WebPageStyle extends WebBuilder {
  frameLocator = this.page.frameLocator("#preview");
  xpathButtonStylingSettings =
    "(//header//div[contains(@class,'w-builder__header-left')]//button)[@name='Styling settings']";
  xpathSidebar = "//div[contains(@class,'w-builder__sidebar-content')]";
  xpathSettingStylingSidebar = "//div[contains(@class,'w-builder__styles-list') and not(@style='display: none;')]";
  colorPalette = this.page.locator("[class$=color-group--palette] div.color");
  xpathBackListStyle = "//span[@class='sb-pointer sb-flex-inline sb-p-medium']";
  colorToast = "//div[contains(@class,'w-builder__color-group--library-item-toast')]";
  fontToast = "//div[contains(@class,'w-builder__font-group__library--font-toast')]";
  buttonGroup = ".w-builder__button-group";
  buttonTextColor = `${this.buttonGroup} .w-builder__widget--color .w-builder__chip--color`;
  buttonShape = `${this.buttonGroup} .widget-select[returnobject="true"] button`;
  xPathBackButton = "(//div[contains(@class, 'w-builder__styles-customize')]//span)[1]";
  xpathShadowActive =
    "//span[contains(@class,'widget-shadow__grid-item is-active')]//div[contains(@class, 'widget-shadow__type')]";
  xpathStyle = "//*[@data-widget-id='style']//*[contains(@class,'w-builder__widget ')]";
  xpathStyleFont = "//div[contains(@class,'w-builder__font-group--menu-font-item')]";

  xpathApplied = "//div[normalize-space()='Applied']";
  xpathSelectLangLabel = `//div[contains(@class, 'select-language')]//span[contains(@class, 'button--label')]`;
  xpathFontSetting = {
    tab: text => `//div[contains(@class,'button-group')]//span[normalize-space()='${text}']`,
    fontDropdownLabel: `(//button[contains(@class, 'font-group--trigger')]//span)[1]`,
    styleDropdownLabel: `//label[normalize-space()='Style']//parent::div//following-sibling::div//span[contains(@class, 'button--label')]`,
    languageOption: language => `//li[contains(@class,'select-menu__item')]//label[normalize-space()='${language}']`,
  };

  async clickIconStylingSetting(): Promise<void> {
    await this.genLoc(this.xpathButtonStylingSettings).click();
  }

  /**
   Click styling of Web or page
   @param styling
   */
  async clickStylingType(styling: "Colors" | "Fonts" | "Buttons"): Promise<void> {
    const typeStyle = this.getXpathByText(styling, WebsitePageStyle["listStyleActive"]);
    await this.genLoc(typeStyle).click();
  }

  /**
   * Input color in setting
   * @param index
   * @param value
   */
  async inputColorWithIndex(index: number, value: string): Promise<void> {
    await this.genLoc(`//span[contains(@class,'w-builder__chip w-builder__chip--color')][${index}]`).click();
    await this.genLoc("input[maxlength='7']").fill(value);
    await this.genLoc(`//h4[contains(text(),' Color palette ')]`).click();
  }

  /**
   * Get  xpath color from library with index
   * @param index
   */
  getXpathColorLibraryByIndex(index: number): string {
    return `(//div[contains(@class,'w-builder__color-group--library')]/span)[${index}]`;
  }

  /**
   * Get  xpath color from library with title color
   * @param title name color style
   */
  async getXpathColorLibraryByTitle(title: string) {
    return `//div[child::div[normalize-space()='${title}']]//following-sibling::div[contains(@class, 'color-group-')]`;
  }

  /**
   * Get  xpath font from library with index
   * @param index
   */
  getXpathFontLibraryByIndex(index: number): string {
    return `(//div[@class='sb-pointer sb-mb-medium w-builder__font-group__library--font'])[${index}]`;
  }

  getXpathInputFontSize(tag: string): string {
    return `//label[normalize-space()='${tag}']/parent::div//following-sibling::div//input[@type='number' and @class='sb-input__input sb-input__inner-append']`;
  }

  /**
   * Choose font
   * @param value
   */

  async chooseFonts(value: string): Promise<void> {
    await this.genLoc(`//button[contains(@class,'w-builder__font-group--trigger')]`).click();
    await this.genLoc(`//div[contains(@class,'menu-font-search')]//input[@placeholder='Search']`).fill(value);
    await this.genLoc(`//div[contains(@class,'w-builder__font-group--menu-font-item')]`).click();
  }

  /**
   * Set font size
   * @param tag
   * @param value
   */

  async setFontSize(tag: string, value: number): Promise<void> {
    await this.genLoc(this.getXpathInputFontSize(`${tag}`)).clear();
    await this.genLoc(this.getXpathInputFontSize(`${tag}`)).fill(value.toString());
  }

  /**
   * Set shape
   * @param index
   */

  async setShape(index: number) {
    await this.genLoc(`//label[normalize-space()='Shape']/parent::div//following-sibling::div//button`).click();
    await this.genLoc(`//span[@class='widget-select__item'][${index}]`).click();
  }

  /**
   * Set shadow
   * @param index
   */
  async shadow(index: number) {
    await this.genLoc(`//label[normalize-space()='Shadow']/parent::div//following-sibling::div//button`).click();
    await this.genLoc(`//span[contains(@class,'widget-shadow__grid-item')][${index}]`).click();
  }

  /**
   * Select dropdown style
   * @param selector
   * @param value
   */

  async selectDropdownStyle(selector: string, value: string) {
    await this.genLoc(`//label[normalize-space()='${selector}']/parent::div//following-sibling::div//button`).click();
    await this.genLoc(`//label[normalize-space()='${value}']`).click();
  }

  /**
   * Select dropdown style
   * @param selector
   * @param value
   */

  async selectDropdownStyleValue(selector: string, value: string) {
    await this.genLoc(
      `//div[contains(@class,'button-group')]//label[normalize-space(text())='${selector}']/parent::div//following-sibling::div//span[@class='sb-popover__reference']//button`,
    ).click();
    await this.genLoc(`//label[normalize-space()='${value}']`).click();
  }

  /**
   * Setting background
   * @param data
   */
  async setBackgroundStyle(data: BackGround) {
    const currentTab = "//div[contains(@class,'tab-panel') and not(contains(@style,'none'))]";
    const backgroundPopover = this.genLoc(`${this.popOverXPath}//label[normalize-space()='Background']`);
    const getToggleBtn = (btnName: string): Locator => {
      return this.page
        .locator(currentTab)
        .locator("[class$=align-center]")
        .filter({ has: this.page.locator("label", { hasText: btnName }) })
        .locator("label.sb-switch__button");
    };
    // Click mở edit background nếu popover chưa hiển thị
    if (await backgroundPopover.isHidden()) {
      await this.genLoc(
        "//div[contains(@class,'widget--background') and not(contains(@style,'display: none;'))]",
      ).click();
    }
    // Mở tab color để edit
    if (typeof data.color !== "undefined") {
      await this.getTabBackground("Color").click();
      await this.color(data.color);
    }
    // Mở tab image để edit
    if (typeof data.image !== "undefined") {
      await this.getTabBackground("Image").click();
      if (data.image.url) {
        await this.uploadImage(this.popOverXPath, data.image.url);
      }
      if (data.image.size) {
        await this.selectDropDown(`(${this.popOverXPath}//div[@class='sb-relative'])[1]`, data.image.size);
      }
      if (data.image.position) {
        // Position 1-9
        const positionIndex = data.image.position - 1;
        await this.genLoc(this.popOverXPath).locator("ul[class$=position-select] li").nth(positionIndex).click();
      }
      if (data.image.overlay) {
        await this.color(data.image.overlay, currentTab);
      }
      if (typeof data.image.repeat !== "undefined") {
        await getToggleBtn("Repeat").setChecked(data.image.repeat);
      }
      if (typeof data.image.parallax !== "undefined") {
        await getToggleBtn("Parallax").setChecked(data.image.parallax);
      }
      await this.getTabBackground("Image").click();
    }
    // Mở tab video để edit
    if (typeof data.video !== "undefined") {
      await this.getTabBackground("Video").click();
      if (data.video.url) {
        await this.page.getByPlaceholder("https://").click();
        await this.page.getByPlaceholder("https://").fill(data.video.url);
      }
      if (data.video.overlay) {
        await this.color(data.video.overlay, currentTab);
      }
      if (data.video.image) {
        await this.uploadImage("thumbnail_image", data.video.image);
      }
      if (typeof data.video.parallax !== "undefined") {
        await getToggleBtn("Parallax").setChecked(data.video.parallax);
      }
      await this.getTabBackground("Video").click();
    }
    await this.titleBar.first().click();
  }

  /**
   * Setting border updated
   * @param data
   */
  async setBorderStyle(data: Border) {
    await this.page
      .locator(
        "//div[contains(@class,'button-group')]//div[contains(@class,'widget-border')]//div[@class='sb-popover__reference']//button",
      )
      .click();
    const indexThickness = {
      none: 1,
      s: 2,
      m: 3,
      l: 4,
      custom: 5,
    };
    if (data.thickness) {
      await this.genLoc(`(${this.popOverXPath}//button)[${indexThickness[data.thickness]}]`).click();
    }
    if (data.size) {
      if (!data.size.fill) {
        await this.editSliderBar(
          `(${this.popOverXPath}//div[contains(@class,'sb-slider__runway')])[1]`,
          data.size.number,
        );
      } else {
        await this.page.fill(`${this.popOverXPath}//input[@max='24']`, data.size.number.toString());
      }
    }
    if (data.style) {
      await this.selectDropDown("//div[normalize-space()='style']/following-sibling::div", data.style);
    }
    if (data.side) {
      await this.selectDropDown("//div[normalize-space()='side']/following-sibling::div", data.side);
    }
    if (data.color) {
      await this.color(data.color);
    }
    await this.titleBar.click();
  }

  /**
   * Set shadow cho block theo update mới 27/3
   * @param data
   */
  async setShadowStyle(data: Shadow): Promise<void> {
    const optionIndex = {
      none: 0,
      soft: 1,
      hard: 2,
    };
    const shadowOptions = this.genLoc(".widget-shadow__grid span[class*=grid-item]");
    const getShadowSize = (size: "S" | "M" | "L"): Locator => {
      return this.genLoc(this.popOverXPath)
        .locator(".widget-size__thickness")
        .locator("[class*=thickness-item]")
        .filter({ has: this.page.locator("label", { hasText: size }) });
    };
    const shadowPopover = this.genLoc(this.popOverXPath).locator(".widget-shadow");
    if (await shadowPopover.isHidden()) {
      await this.page
        .locator(
          "//div[contains(@class,'button-group')]//div[contains(@class,'widget-shadow')]//div[@class='sb-popover__reference']//button",
        )
        .click();
    }
    if (data.option) {
      await shadowOptions.nth(optionIndex[data.option]).click();
      await shadowOptions.nth(optionIndex[data.option]).and(this.genLoc("span.is-active")).waitFor();
    }
    if (data.size) {
      await getShadowSize(data.size).click();
    }
    if (data.direction) {
      await shadowPopover.locator(".widget-shadow__direction").getByRole("button").click();
      await this.genLoc(this.popOverXPath)
        .getByRole("listitem")
        .filter({ has: this.page.locator(`label:text-is("${data.direction}")`) })
        .click();
    }
    await this.titleBar.click();
  }
}
