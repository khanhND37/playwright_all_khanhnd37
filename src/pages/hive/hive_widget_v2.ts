import type { LogicTab, UITab } from "@hive_types/hive_widget";
import { Page } from "@playwright/test";
import { HivePage } from "./core";

export class HiveWidgetPage extends HivePage {
  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
  }

  async fillDataTabLogic(conf: LogicTab): Promise<void> {
    await this.selectScreen(conf.screen);

    if (conf.status) {
      await this.genLoc("//div[@class='form-group']//span[normalize-space()='Enable']").click();
    }

    await this.inputFieldWithLabel("Name", conf.name);

    if (conf.business_types) {
      await this.selectBusinessType(conf.business_types);
    }

    if (conf.regions) {
      await this.selectRegion(conf.regions);
    }

    if (conf.packages) {
      await this.selectPackage(conf.packages);
    }
  }

  async selectScreen(screenName: string): Promise<void> {
    await this.page.click('span:has-text("ShopBase Home")');
    await this.page.click(`div[role='option']:has-text('${screenName}')`);
  }

  async inputFieldWithLabel1(label: string, data: string): Promise<void> {
    await this.genLoc(`(//label[normalize-space()='${label}']//parent::div//input)[[1]]`).fill(data);
  }

  async selectBusinessType(businessTypes: string[]): Promise<void> {
    const numberBusinessTypeIsChecked = await this.genLoc(
      this.xpathCheckboxIsCheckedWithLable("Business Type"),
    ).count();

    // Clear all default
    for (let i = 1; i <= numberBusinessTypeIsChecked; i++) {
      await this.genLoc(`(${this.xpathCheckboxIsCheckedWithLable("Business Type")})[1]`).click();
    }

    // Select bussiness type
    for (const businessType of businessTypes) {
      await this.genLoc(
        `//span[normalize-space()='${businessType}']//ancestor::li//div[@class='icheckbox_square-blue']`,
      ).click();
    }
  }

  async selectRegion(regions: string[]): Promise<void> {
    const numberRegionIsChecked = await this.genLoc(this.xpathCheckboxIsCheckedWithLable("Region")).count();

    // Clear all default
    for (let i = 1; i <= numberRegionIsChecked; i++) {
      await this.genLoc(`(${this.xpathCheckboxIsCheckedWithLable("Region")})[1]`).click();
    }

    // Select region
    await this.genLoc("(//div[@class='box box-primary'])[1]").click();
    for (const region of regions) {
      await this.genLoc(
        `//span[normalize-space()='${region}']//ancestor::li//div[@class='icheckbox_square-blue']`,
      ).click();
    }
  }

  async selectPackage(packages: string[]): Promise<void> {
    const countPackage = await this.genLoc("//label[normalize-space()='Package']//parent::div//li").count();

    // Clear all package default
    for (let i = 1; i < countPackage - 1; i++) {
      await this.genLoc("(//label[normalize-space()='Package']//parent::div//li//a)[1]").click();
    }

    // Choose package
    for (const pkg of packages) {
      await this.genLoc('form[role="form"] ul:has-text("Package")').click();
      await this.genLoc("//ul[@class='select2-choices']//input").fill(pkg);
      await this.genLoc(`//ul[@class='select2-results']//li//div[contains(normalize-space(),'${pkg}')]`).click();
    }
  }

  xpathCheckboxIsCheckedWithLable(label: string): string {
    return `//label[normalize-space()='${label}']//parent::div//div[@class='icheckbox_square-blue checked']`;
  }

  async deleteWidgetInList(widgetId: number): Promise<void> {
    await this.goto(`admin/app/dashboard_widget/${widgetId}/delete`);
    await this.genLoc("//button[normalize-space()='Yes, delete']").click();
  }

  async switchTab(tabName: string): Promise<void> {
    await this.page.click(`//ul[@class='nav nav-tabs']//a[normalize-space()='${tabName}']`);
  }

  async fillDataTabUIWidget(conf: UITab): Promise<void> {
    await this.genLoc("//label[normalize-space()='Widget Type']//parent::div//select").selectOption(conf.widget_type);
    if (conf.title) {
      await this.inputFieldWithLabel("Title", conf.title);
    }
    if (conf.description) {
      await this.inputFieldWithLabel("Description", conf.description);
    }
    if (conf.primary_button.text) {
      await this.inputFieldWithLabel("Primary Button Text", conf.primary_button.text);
    }
    if (conf.primary_button.link) {
      await this.inputFieldWithLabel("Primary Button Link", conf.primary_button.link);
    }
    if (conf.secondary_button.text) {
      await this.inputFieldWithLabel("Secondary Button Text", conf.secondary_button.text);
    }
    if (conf.secondary_button.link) {
      await this.inputFieldWithLabel("Secondary Button Link", conf.secondary_button.link);
    }
    if (conf.childs) {
      for (let i = 0; i < conf.childs.length; i++) {
        if (i > 0) {
          await this.genLoc("//a[@class='btn btn-primary' and normalize-space()='Add more']").click();
        }
        if (conf.childs[i].title) {
          await this.inputFieldWithLabel("List", conf.childs[i].title, "Title");
        }
        if (conf.childs[i].descripition) {
          await this.inputFieldWithLabel("List", conf.childs[i].descripition, "Description");
        }
        if (conf.childs[i].link) {
          await this.inputFieldWithLabel("List", conf.childs[i].link, "Link");
        }
        if (conf.childs[i].image_url) {
          await this.inputFieldWithLabel("List", conf.childs[i].image_url, "Image url");
        }
      }
    }

    if (conf.image) {
      await this.page.setInputFiles("input[type='file']", conf.image);
      await this.page.waitForTimeout(4 * 1000);
    }

    await this.genLoc("//button[normalize-space()='Create']").click();
  }

  async getWidgetId(): Promise<number> {
    const url = this.page.url();
    const arrUrl = url.split("/");
    const widgetId = Number(arrUrl[arrUrl.length - 2]);
    return widgetId;
  }

  async navigateToWidgetListPage(): Promise<void> {
    await this.genLoc("//a[normalize-space()='Dashboard Widget List']").click();
  }

  async inputFieldWithLabel(label: string, data: string, subLabel?: string): Promise<void> {
    if (label === "List") {
      await this.genLoc(
        `(//label[normalize-space()='${label}']//ancestor::div[contains(@class,'ListSub')]//label[normalize-space()='${subLabel}']//parent::div//input)[last()]`,
      ).fill(data);
    } else {
      await this.genLoc(`(//label[normalize-space()='${label}']//parent::div//input)[1]`).fill(data);
    }
  }
}
