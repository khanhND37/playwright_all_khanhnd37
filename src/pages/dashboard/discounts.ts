import { Page } from "@playwright/test";
import type { Discount } from "@types";
import { DashboardPage } from "./dashboard";

export class DiscountPage extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  //Count number of discount on dashboard
  async countNumDiscount(): Promise<number> {
    let numDiscount = 0;
    await this.page.waitForSelector("//*[@class='s-loading-table']", { state: "hidden" });
    if (await this.page.locator(`//p[contains(text(), 'Showing')]`).isVisible()) {
      numDiscount = await this.page.locator(`//tbody//tr[//td[@class='discount-select']]`).count();
    }
    return numDiscount;
  }

  //Delete all discount
  async delAllDiscount() {
    const numDiscount = await this.countNumDiscount();
    if (numDiscount > 0) {
      await this.page.click(`//th[@class='discount-select-header']//span[@class='s-check']`);
      await this.clickOnBtnWithLabel("Actions");
      await this.page.click(`//span[normalize-space()='Delete discounts']`);
      await this.page.click("//button[normalize-space()='Delete']");
      await this.page.waitForSelector(
        `//div[@class='s-toast is-success is-bottom']//div[normalize-space()='Discount codes have been deleted']`,
      );
    }
  }

  /**
   * Input information to Create/Edit Discount page
   * @param dscSetting all setting of the discount when create
   */
  async inputCrtDscPage(dscSetting: Discount) {
    const xpathDscName = `//input[@placeholder='e.g. Buy one get one free' or @placeholder='e.g. SUMMERSALE']`;
    await this.page.click(xpathDscName);
    await this.page.locator(xpathDscName).fill(dscSetting.name);
    //choose discount type
    if (dscSetting.type) {
      const xpathDscType = `//label[contains(text(), 'Discount Type')]//ancestor::div[@class='s-form-item']//select`;
      await this.page.click(xpathDscType);
      await this.page.locator(xpathDscType).selectOption(dscSetting.type);
      //input discount value
      if (dscSetting.type !== "free_shipping") {
        const xpathDscValue = `//label[contains(text(), 'Discount value')]//ancestor::div[contains(@class, 'is-required')]//input`;
        await this.page.click(xpathDscValue);
        await this.page.locator(xpathDscValue).fill(dscSetting.value.toString());
      }
    }

    if (dscSetting.type === "free_shipping") {
      if (dscSetting.isSpecCount) {
        await this.page.click("//span[normalize-space()='Specific countries']");
        await this.page.click(`//div[contains(@class, 'select-country-component')]//span[normalize-space()='Browse']`);
        for (let i = 0; i < dscSetting.country.length; i++) {
          await this.page.locator(`//input[@placeholder='Search for country']`).fill(dscSetting.country[i]);
          await this.page.waitForSelector(`//h2[normalize-space()='Select countries']`);
          await this.page.click(
            `//div[normalize-space()='${dscSetting.country[i]}']//ancestor::div[@class='item-list']//span[@class='s-check']`,
          );
        }
        await this.clickButtonOnPopUpWithLabel("Save");
      }
    }
    //choose Minimum Requirement
    if (dscSetting.minRequi) {
      await this.page.click(`//span[normalize-space()='${dscSetting.minRequi}']`);
      await this.page
        .locator(`//div[@class='s-form-item__content']//input[@type='number']`)
        .fill(dscSetting.minValue.toString());
    }
    //choose Applies to
    if (dscSetting.appliesTo) {
      await this.page.click(`//span[normalize-space()='${dscSetting.appliesTo}']`);
      if (dscSetting.appliesTo === "Specific products") {
        for (let i = 0; i < dscSetting.specific_products.length; i++) {
          await this.page.locator(`//input[@placeholder='Search products']`).fill(dscSetting.specific_products[i]);
          await this.page.keyboard.press("Enter");
          await this.page.waitForSelector(`//h2[normalize-space()='Select products']`);
          await this.page.click(
            `//div[normalize-space()='${dscSetting.specific_products[i]}']//ancestor::div[@class='item-list']//span[@class='s-check']`,
          );
        }
        await this.clickButtonOnPopUpWithLabel("Save");
      }
    }
  }

  async addDiscountcode(discount: Array<Discount>) {
    for (let i = 0; i < discount.length; i++) {
      //switch menu manual or auto discount and click create
      if (discount[i].isAuto) {
        await this.navigateToSubMenu("Discounts", "Automatic");
        await this.clickOnBtnWithLabel("Create automatic discount");
      } else {
        await this.navigateToSubMenu("Discounts", "Codes");
        await this.clickOnBtnWithLabel("Create discount");
      }

      //input information to create discount form and save
      await this.inputCrtDscPage(discount[i]);
      await this.clickOnBtnWithLabel("Save changes");
      await this.waitUntilElementVisible(
        "//div[contains(@class, 's-toast')]//div[normalize-space()='Automatic discount was created successfully']",
      );
      await this.waitUntilElementInvisible(
        "//div[contains(@class, 's-toast')]//div[normalize-space()='Automatic discount was created successfully']",
      );
    }
  }

  //choose option Yes/No on Active dates alert when save automatic discount
  async chooseOptOnAlert(option: string) {
    await this.page.waitForSelector(`//h4[normalize-space()='Active dates alert']`);
    await this.page.click(`//span[normalize-space()='${option}']`);
  }

  //get status of discount follow discount name on discount listing page
  async getDscStatus(dscSetting: Discount): Promise<string> {
    await this.page.waitForSelector(`//div[contains(@class,'discounts-list')]`);
    const xpathStatus = `//span[normalize-space()='${dscSetting.name}']//ancestor::tr//td//p[@class='text-capitialize']`;
    const dscStatus = this.getTextContent(xpathStatus);
    return dscStatus;
  }
}
