import { expect, Page, Locator } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { ShippingRate } from "@types";

export class SettingShipping extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /*------------- Shopbase --------------*/
  btnAddNewShippingZone: Locator = this.page.locator(`//a[normalize-space()='Add shipping zone']`);
  zoneNameBox: Locator = this.page.locator(`//input[@placeholder='e.g. North America, Euro']`);
  btnAddCountry: Locator = this.page.locator(`//span[normalize-space()='Add countries']`);
  btnSaveChange: Locator = this.page.locator(`//span[normalize-space()='Save']`);
  btnDeleteShippingZone: Locator = this.page.locator(`//span[normalize-space()='Delete zone']`);
  btnConfirmDeleteShippingZone: Locator = this.page.locator(`//span[normalize-space()='Delete shipping zone']`);
  xpathSearchCountry = `//input[@placeholder='Search countries']`;
  xpathCountryName(countryName: string) {
    return this.page.locator(`//span[contains(text(),'${countryName}')]`);
  }
  xpathRemoveCountry(countryName: string) {
    return this.page.locator(`(//div[contains(text(),'${countryName}')]/following::div)[1]`);
  }
  genLocShippingRate(rateName: string) {
    return this.page.locator(`//tr[td[normalize-space()='${rateName}']]`);
  }
  genLocShippingZone(zoneName: string) {
    return this.page.locator(`//div[div[normalize-space()='${zoneName}']]`);
  }
  genLocZoneCountry(countryName: string) {
    return this.page.locator(`//li[div[contains(text(),'${countryName}')]]`);
  }
  /**
   * go to shipping setting page
   */
  async gotoShippingSettingPage() {
    await this.goto("/admin/settings");
    await this.page.waitForSelector(`//p[normalize-space()='Shipping']`);
    await this.page.click(`//p[normalize-space()='Shipping']`);
    await this.page.waitForSelector(`//div[div/label[normalize-space()='Shipping zones']]`);
  }

  async checkAndRemoveShippingZone(shippingProfile: { name: string; countries: Array<string> }) {
    let countryName = `(${shippingProfile.countries.length} countries)`;
    if (shippingProfile.countries.length === 1) {
      countryName = shippingProfile.countries[0];
    }

    if (await this.checkShippingZoneExit(shippingProfile.name, countryName)) {
      await this.gotoShippingZoneDetail(shippingProfile.name, countryName);
      await this.page.waitForSelector("//span[normalize-space()='Delete zone']");
      await this.btnDeleteShippingZone.click();
      await this.btnConfirmDeleteShippingZone.click();
      await this.page.waitForSelector(`//div[div/label[normalize-space()='Shipping zones']]`);
    }
  }

  async clickAddShippingZone() {
    await this.btnAddNewShippingZone.click();
    await this.page.waitForSelector(`//h1[normalize-space()='Add shipping zone']`);
  }

  async fillShippingZoneName(zoneName: string) {
    await this.zoneNameBox.fill(zoneName);
  }

  /**
   * add country to shipping zone
   * @param countriesName contains: country name
   */
  async addCountryToShippingZone(countriesName: Array<string>) {
    for (const countryName of countriesName) {
      await this.btnAddCountry.click();
      await this.page.click(`//input[@placeholder='Search countries']`);
      await this.page.locator(`//input[@placeholder='Search countries']`).type(countryName);
      await this.page.locator(`//input[@placeholder='Search countries']`).evaluate(e => e.blur());
      await this.page.check(`//span[contains(text(),'${countryName}')]/preceding-sibling::span`);
      await this.page.click(`//span[normalize-space()='Add']`);
      await this.page.waitForSelector(`//li[div[contains(text(),'${countryName}')]]`);
    }
  }

  /**
   * Add shipping rate contains: Price based rates, Weight based rates, Item based rates
   * @param shippingRate contains: name, min_price, max_price, price, is_free_rate, min_shipping_time, max_shipping_time
   */
  async addShippingRate(shippingRate: ShippingRate) {
    await this.page.click(`//b[normalize-space()='${shippingRate.type}']/following-sibling::button`);
    await this.fillFormAddShippingRate(shippingRate);
  }

  /**
   * fill form add shipping pricebase rate
   * @param shippingRate
   */
  async fillPriceBasedRates(shippingRate: ShippingRate) {
    await this.page.fill(`//input[contains(@placeholder,'Standard Shipping')]`, shippingRate.name);
    if (shippingRate.is_free_rate) {
      await this.page.click(`//span[normalize-space()='Free shipping rate']/preceding-sibling::span`);
    }
    if (shippingRate.min_shipping_time) {
      await this.page.fill(`//input[@placeholder='3']`, shippingRate.min_shipping_time.toString());
    }
    if (shippingRate.max_shipping_time) {
      await this.page.fill(`//input[@placeholder='5']`, shippingRate.max_shipping_time.toString());
    }
    if (shippingRate.min_price) {
      await this.page.fill(`(//input[contains(@placeholder,'0.00')])[1]`, shippingRate.min_price.toString());
    }
    if (shippingRate.max_price) {
      await this.page.fill(`//input[contains(@placeholder,'No limit')]`, shippingRate.max_price.toString());
    }
    if (shippingRate.price) {
      await this.page.fill(`(//input[contains(@placeholder,'0.00')])[2]`, shippingRate.price.toString());
    }
  }

  /**
   * fill form add shipping weightbase rate
   * @param shippingRate
   */
  async fillWeightBasedRates(shippingRate: ShippingRate) {
    await this.page.fill(`//input[contains(@placeholder,'Standard Shipping')]`, shippingRate.name);
    if (shippingRate.is_free_rate) {
      await this.page.click(`//span[normalize-space()='Free shipping rate']/preceding-sibling::span`);
    }
    if (shippingRate.min_shipping_time) {
      await this.page.fill(`//input[@placeholder='3']`, shippingRate.min_shipping_time.toString());
    }
    if (shippingRate.max_shipping_time) {
      await this.page.fill(`//input[@placeholder='5']`, shippingRate.max_shipping_time.toString());
    }
    if (shippingRate.min_weight) {
      await this.page.fill(`(//input[contains(@placeholder,'0.00')])[1]`, shippingRate.min_weight.toString());
    }
    if (shippingRate.max_weight) {
      await this.page.fill(`//input[contains(@placeholder,'No limit')]`, shippingRate.min_weight.toString());
    }
    if (shippingRate.price) {
      await this.page.fill(`(//input[contains(@placeholder,'0.00')])[2]`, shippingRate.price.toString());
    }
  }

  /**
   * fill form add shipping itembase rate
   * @param shippingRate
   */
  async fillItemBasedRates(shippingRate: ShippingRate) {
    await this.page.fill(`//input[contains(@placeholder,'Standard Shipping')]`, shippingRate.name);
    if (shippingRate.is_free_rate) {
      await this.page.click(`//span[normalize-space()='Free shipping rate']/preceding-sibling::span`);
    }
    if (shippingRate.min_shipping_time) {
      await this.page.fill(`//input[@placeholder='3']`, shippingRate.min_shipping_time.toString());
    }
    if (shippingRate.max_shipping_time) {
      await this.page.fill(`//input[@placeholder='5']`, shippingRate.max_shipping_time.toString());
    }
    if (shippingRate.group) {
      await this.page.fill(`//input[@placeholder='Standard']`, shippingRate.group);
    }
    if (shippingRate.filter) {
      await this.page.click(`//span[normalize-space()='Filter']/following-sibling::button`);
      await this.page.fill(`//input[contains(@placeholder,'Enter keywords')]`, shippingRate.filter.keyword);
    }
    if (shippingRate.exclusion) {
      await this.page.click(`//span[normalize-space()='Exclusion']/following-sibling::button`);
      await this.page.fill(`//input[contains(@placeholder,'Enter keywords')]`, shippingRate.exclusion.keyword);
    }
    if (shippingRate.first_item_price) {
      await this.page.fill(`(//input[contains(@placeholder,'0.00')])[1]`, shippingRate.first_item_price.toString());
    }
    if (shippingRate.additional_price) {
      await this.page.fill(`(//input[contains(@placeholder,'0.00')])[2]`, shippingRate.additional_price.toString());
    }
  }

  /**
   * Fill form add shipping rate
   * @param shippingRate contains: name, min_price, max_price, price, is_free_rate, min_shipping_time, max_shipping_time
   */
  async fillFormAddShippingRate(shippingRate: ShippingRate) {
    switch (shippingRate.type) {
      case "Price based rates":
        await this.fillPriceBasedRates(shippingRate);
        break;
      case "Weight based rates":
        await this.fillWeightBasedRates(shippingRate);
        break;
      case "Item based rates":
        await this.fillItemBasedRates(shippingRate);
        break;
    }
    await this.page.click(`//span[normalize-space()='Done']`);
    await this.page.waitForSelector(`//td[normalize-space()='${shippingRate.name}']`);
  }

  /**
   * click edit shipping zone by zone name
   * @param zoneName
   */
  async clickEditShippingZone(zoneName: string) {
    await this.page.click(`//div[div[normalize-space()='${zoneName}']]/following-sibling::span`);
  }

  /**
   * check shipping zone was exited by zone name and country name
   * @param zoneName
   * @param countryName
   */
  async checkShippingZoneExit(zoneName: string, countryName: string) {
    return await this.page
      .locator(`//div[div[normalize-space()='${zoneName}']/following-sibling::div[normalize-space()='${countryName}']]`)
      .isVisible();
  }

  /**
   * go to shipping zone was exited by zone name and country name
   * @param zoneName
   * @param countryName
   */
  async gotoShippingZoneDetail(zoneName: string, countryName: string) {
    await this.page.click(
      `//div[div[normalize-space()='${zoneName}']/following-sibling::div[normalize-space()='${countryName}']]/following-sibling::span`,
    );
  }

  /**
   * click edit shipping rate by rate name
   * @param shippingRateName
   */
  async clickEditShippingRate(shippingRateName: string) {
    await this.page.click(`//tr[td[normalize-space()='${shippingRateName}']]/td/a[normalize-space()='Edit']`);
  }

  /**
   * click X to prepare delete shipping rate
   * @param shippingRateName
   */
  async clickXtoPrepareDeleteShippingRate(shippingRateName: string) {
    await this.page.click(`//tr[td[normalize-space()='${shippingRateName}']]/td/span[normalize-space()='×']`);
  }

  /**
   * edit shipping rate
   * @param shippingRate shipping rate information
   */
  async editShippingRate(shippingRate: ShippingRate) {
    await this.clickEditShippingRate(shippingRate.name);
    await this.fillFormAddShippingRate(shippingRate);
  }

  /*------------- Plusbase --------------*/

  /**
   * get xpath select country with label country name
   * @param countryName is country name
   * @returns xpath label select country
   */
  async getXpathSelectCountryWithLabel(countryName: string): Promise<string> {
    return `//span[contains(text(),'${countryName}')]/parent::label`;
  }

  /**
   * Action click edit shipping by country name
   * @param country
   */
  async clickEditShippingZoneByCountry(country: string) {
    await this.page.click(
      `//div[normalize-space()='${country}']/parent::div/following-sibling::span[@class='pull-right']`,
    );
    await this.page.waitForSelector(".add-customer-heading");
  }

  /**
   * Verify status shipping method by name and status
   * @param methodName
   * @param status
   */
  async checkStatusShippingMethod(methodName: string, status: boolean) {
    const pathToShippingMethod = `//div[contains(normalize-space(), 'Shipping method') and @class='clearfix']//li[contains(normalize-space(), '${methodName}')]`;
    expect(await this.page.locator(pathToShippingMethod).isVisible()).toEqual(status);
  }

  /**
   * Switch status shipping method on shipping zone
   * @param methodName
   */
  async switchStatusShippingMethod(methodName: string) {
    await this.page.click(
      `//div[contains(normalize-space(), 'Shipping method') and @class='clearfix']//li[contains(normalize-space(), '${methodName}')]//label[contains(@class, 's-switch')]`,
    );
  }

  /**
   * Hover tooltip on shipping zone page
   */
  async hoverTooltipShippingMethodShippingZone() {
    await this.page
      .locator(`//b[text()='Shipping method']/following-sibling::span/div[contains(@class, 's-tooltip-fixed')]`)
      .hover();
  }

  /**
   * Is visible hover message
   */
  async isVisibleTooltipShippingMethodShippingZone() {
    return await this.page
      .locator(
        `//*[contains(text(), "Shipping disable won't be shown in checkout! After this action, if any products have no shipping, we will show Plusbase default shipping")]`,
      )
      .isVisible();
  }

  /**
   * Route page to setting shipping zone in setting
   */
  async goToSettingShippingZone(): Promise<void> {
    await this.page.goto(`https://${this.domain}/admin/settings/shipping`);
    await this.page.waitForSelector(".setting-page__title");
  }

  /*------------- Printbase --------------*/
  /**
   * setting free shipping rate in store pbase
   * @param shipZone contains: zone name, shipping rate, maximum discount amount
   */
  async settingFreeshipRatePbase(shipZone: { zone_name: string; rate: number; max_discount_amt?: number | null }) {
    const shippingZone = this.page.locator(
      `(//div[div/div/child::div[normalize-space()='${shipZone.zone_name}']]//label/span[@class='s-check'])[1]`,
    );
    await shippingZone.check();
    await this.page
      .locator(
        `(//div[contains(text(),'${shipZone.zone_name}')]//ancestor::div[@class='s-mt16']//input[@type='number'])[1]`,
      )
      .fill(shipZone.rate.toString());

    // Setting Apply maximum discount value per order if needed
    const maxDiscountOption = this.page.locator(
      `(//div[div/div/child::div[normalize-space()='${shipZone.zone_name}']]//label/span[@class='s-check'])[2]`,
    );
    if (shipZone.max_discount_amt) {
      await maxDiscountOption.check();
      await this.page
        .locator(
          `(//div[contains(text(),'${shipZone.zone_name}')]//ancestor::div[@class='s-mt16']//input[@type='number'])[2]`,
        )
        .fill(shipZone.max_discount_amt.toString());
      await this.page.keyboard.press("Tab");
    } else if (shipZone.max_discount_amt === null) {
      if (await maxDiscountOption.isChecked()) {
        await maxDiscountOption.click();
      }
    }

    // Save changes
    const saveButton = `//span[normalize-space()='Save changes']`;
    const isSaveButtonExist = await this.isElementExisted(saveButton, null, 2000);
    if (isSaveButtonExist) {
      await this.page.click(saveButton);
      await this.isToastMsgVisible("Saved successfully");
    }
  }

  xpathShippingZoneLabel(): Locator {
    return this.genLoc(`//label[text()='Shipping zones']`);
  }
}
