import { Locator, Page } from "@playwright/test";
import type { ConfigWidget } from "@types";
import { HivePage } from "./core";

export class HiveWidgetPage extends HivePage {
  account: Locator;
  password: Locator;
  login: Locator;

  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
    this.account = this.genLoc('[placeholder="Username"]');
    this.password = this.genLoc('[placeholder="Password"]');
    this.login = page.locator("text=Log in");
  }

  /**
   * Chọn Menu Tool -> Click chọn Dashboard Widget -> Click Add new to create widget
   */
  async navigateToCreateWidget(): Promise<void> {
    await this.genLoc(`//li[normalize-space()="Add new"]`).click();
  }

  /**
   * Nhập dữ liệu hợp lệ vào các trường tab Config Logic Widget
   * @param name: name of widget
   * @param currentTime: time current
   */
  async fillDataTabLogic(conf: ConfigWidget): Promise<void> {
    await this.selectScreen(conf.screen);
    await this.genLoc("//div[@class='form-group']//span[normalize-space()='Enable']").click();
    await this.inputFieldWithLabel("Name", conf.name);
    await this.selectBusinessType(conf.business_type);
    await this.selectRegion(conf.regions);
  }

  async fillDataTabUIBasicWidget(conf: ConfigWidget): Promise<void> {
    await this.genLoc("//label[normalize-space()='Widget Type']//parent::div//select").selectOption("basic");
    if (conf.title) {
      await this.inputFieldWithLabel("Title", conf.title);
    }
    if (conf.description) {
      await this.inputFieldWithLabel("Description", conf.description);
    }
    if (conf.primary_btn_text) {
      await this.inputFieldWithLabel("Primary Button Text", conf.primary_btn_text);
    }
    if (conf.primary_btn_link) {
      await this.inputFieldWithLabel("Primary Button Link", conf.primary_btn_link);
    }
    if (conf.secondary_btn_text) {
      await this.inputFieldWithLabel("Secondary Button Text", conf.secondary_btn_text);
    }
    if (conf.secondary_btn_link) {
      await this.inputFieldWithLabel("Secondary Button Link", conf.secondary_btn_link);
    }
    if (conf.image.filePath) {
      await this.page.setInputFiles("input[type='file']", conf.image.filePath);
    }
    await this.page.waitForTimeout(4 * 1000);
    await this.genLoc("//button[normalize-space()='Create']").click();
  }

  /**
   * Choose Widget Type
   * @param widget_type
   * Ex: Basic, Center, List, Race Challenge, Upsell ShopBase Annual Plans,...
   */
  async chooseWidgetType(page: Page, conf: ConfigWidget) {
    await page.locator(`//div[child::label[contains(text(),'Widget Type')]]//select`).selectOption(conf.widget_type);
  }

  /**
   * Count the number of widgets on the page
   * return <number> number of widgets
   */
  async countWidgetNumber(): Promise<number> {
    const sumWidget = await this.genLoc("//div[@class='box-footer']//label[@class='checkbox']").innerText();
    const count = Number(sumWidget.split("(")[1].split(")")[0]);
    return count;
  }

  /**
   * Nhập dữ liệu hợp lệ vào các trường tab Config UI Widget Center
   * @param conf: Config Widget data of widget
   * @param currentTime: time current
   */

  async configUICenterWidget(conf: ConfigWidget) {
    await this.genLoc("//label[normalize-space()='Widget Type']//parent::div//select").selectOption("center");
    if (conf.title) {
      await this.inputFieldWithLabel("Title", conf.title);
    }
    if (conf.description) {
      await this.inputFieldWithLabel("Description", conf.description);
    }
    if (conf.primary_btn_text) {
      await this.inputFieldWithLabel("Primary Button Text", conf.primary_btn_text);
    }
    if (conf.primary_btn_link) {
      await this.inputFieldWithLabel("Primary Button Link", conf.primary_btn_link);
    }
    if (conf.image.filePath) {
      await this.page.setInputFiles("input[type='file']", conf.image.filePath);
    }
    await this.page.waitForTimeout(4 * 1000);
    await this.genLoc("//button[normalize-space()='Create']").click();
  }

  async configUIListWidget(conf: ConfigWidget) {
    await this.genLoc("//label[normalize-space()='Widget Type']//parent::div//select").selectOption("list");
    if (conf.title) {
      await this.inputFieldWithLabelOfWidgetTypeList("Title", conf.title);
    }
    if (conf.description) {
      await this.inputFieldWithLabelOfWidgetTypeList("Description", conf.description);
    }
    if (conf.sub_list) {
      for (let i = 0; i < conf.sub_list.length; i++) {
        if (i > 0) {
          await this.genLoc("//a[@class='btn btn-primary' and normalize-space()='Add more']").click();
        }
        if (conf.sub_list[i].title_list) {
          await this.inputFieldWithLabelOfWidgetTypeList("List", conf.sub_list[i].title_list, "Title");
        }
        if (conf.sub_list[i].description_list) {
          await this.inputFieldWithLabelOfWidgetTypeList("List", conf.sub_list[i].description_list, "Description");
        }
        if (conf.sub_list[i].link_list) {
          await this.inputFieldWithLabelOfWidgetTypeList("List", conf.sub_list[i].link_list, "Link");
        }
        if (conf.sub_list[i].image_url) {
          await this.inputFieldWithLabelOfWidgetTypeList("List", conf.sub_list[i].image_url, "Image url");
        }
      }
    }
    await this.genLoc(this.xpathBtnCreate).click();
  }

  /**
   * Nhập dữ liệu hợp lệ vào các trường tab Config UI Widget Upsell
   * @param conf: Config Widget data of widget
   * @param currentTime: time current
   */
  async configUIUpsellWidget(page: Page, conf: ConfigWidget, currentTime: number) {
    await page
      .locator(`(//label[normalize-space()='Title']//following::input)[1]`)
      .fill(`${conf.title} + ${currentTime}`);
    await page.locator(`(//label[normalize-space()='Description']//following::input)[1]`).fill(conf.description);
    await page
      .locator(`(//label[normalize-space()='Discount percentage']//following::input)[1]`)
      .fill(conf.discount.toString());
    await page
      .locator(`(//label[normalize-space()='Primary Button Text']//following::input)[1]`)
      .fill(conf.primary_btn_text);
    await page
      .locator(`(//label[normalize-space()='Secondary Button Text']//following::input)[1]`)
      .fill(conf.secondary_btn_text);
    await page
      .locator(`(//label[normalize-space()='Secondary Button Link']//following::input)[1]`)
      .fill(conf.secondary_btn_link);
    if (conf.image.filePath) {
      await page.setInputFiles("input[type='file']", conf.image.filePath);
    }
  }

  /**
   * Quay về trang Home -> đi đến trang Pricing bằng cách -> Click vào Settings
    -> Click vào session Account -> Click mục Upgrade plan- Chọn tab Annual package
   */
  async navigateToPricingPage(page: Page) {
    await page.locator(`//span[normalize-space() ="Settings"]`).click();
    await page.locator(`//p[normalize-space() ="Account"]`).click();
    await page.waitForLoadState("load");
    await page.locator(`//button[normalize-space() ="Upgrade plan"]`).click();
    await page.locator(`//div[@class="period active"]`).click();
  }

  xpathCheckboxIsCheckedWithLable(label: string): string {
    return `//label[normalize-space()='${label}']//parent::div//div[@class='icheckbox_square-blue checked']`;
  }

  async selectBusinessType(businessTypes: Array<{ title: string }>): Promise<void> {
    const numberBusinessTypeIsChecked = await this.genLoc(
      this.xpathCheckboxIsCheckedWithLable("Business Type"),
    ).count();
    for (let i = 1; i <= numberBusinessTypeIsChecked; i++) {
      await this.genLoc(`(${this.xpathCheckboxIsCheckedWithLable("Business Type")})[1]`).click();
    }
    for (const element of businessTypes) {
      await this.genLoc(
        `//span[normalize-space()='${element.title}']//ancestor::li//div[@class='icheckbox_square-blue']`,
      ).click();
    }
  }

  async selectRegion(regions: Array<{ region: string }>) {
    const numberRegionIsChecked = await this.genLoc(this.xpathCheckboxIsCheckedWithLable("Region")).count();
    for (let i = 1; i <= numberRegionIsChecked; i++) {
      await this.genLoc(`(${this.xpathCheckboxIsCheckedWithLable("Region")})[1]`).click();
    }
    await this.genLoc("(//div[@class='box box-primary'])[1]").click();
    for (const element of regions) {
      await this.genLoc(
        `//span[normalize-space()='${element.region}']//ancestor::li//div[@class='icheckbox_square-blue']`,
      ).click();
    }
  }

  async switchTab(tabName: string): Promise<void> {
    await this.page.click(`//ul[@class='nav nav-tabs']//a[normalize-space()='${tabName}']`);
  }

  async selectScreen(screenName: string): Promise<void> {
    await this.page.click('span:has-text("ShopBase Home")');
    await this.page.click(`div[role='option']:has-text('${screenName}')`);
  }

  /**
   * Input value config UI widget type: basic, center
   * @param label
   * @param data
   */
  async inputFieldWithLabel(label: string, data: string): Promise<void> {
    await this.genLoc(`//label[normalize-space()='${label}']//parent::div//input`).fill(data);
  }

  /**
   * Input value config UI List widget type List
   * @param label
   * @param data
   * @param subLabel
   */
  async inputFieldWithLabelOfWidgetTypeList(label: string, data: string, subLabel?: string): Promise<void> {
    if (label === "List") {
      await this.genLoc(
        `(//label[normalize-space()='${label}']//ancestor::div[contains(@class,'ListSub')]//label[normalize-space()='${subLabel}']//parent::div//input)[last()]`,
      ).fill(data);
    } else {
      await this.genLoc(`(//label[normalize-space()='${label}']//parent::div//input)[1]`).fill(data);
    }
  }

  async navigateToWidgetListPage(): Promise<void> {
    await this.genLoc("//a[normalize-space()='Dashboard Widget List']").click();
  }

  xpathWidgetNameInWidgetList(widgetName: string): string {
    return `//table//td//a[normalize-space()='${widgetName}']`;
  }

  async getWidgetId(widgetName: string): Promise<number> {
    return Number(await this.page.innerText(`${this.xpathWidgetNameInWidgetList(widgetName)}//ancestor::tr//td[2]`));
  }

  async deleteWidgetInList(widgetId: number): Promise<void> {
    await this.genLoc(`//table//td[@objectid='${widgetId}']//a[normalize-space()='Delete']`).click();
    await this.genLoc("//button[normalize-space()='Yes, delete']").click();
  }
}
