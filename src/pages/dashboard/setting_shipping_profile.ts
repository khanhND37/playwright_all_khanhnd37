import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { ShippingRate } from "@types";
export class ShippingProfile extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async deleteAllCustomShippingProfile() {
    if (await this.page.locator(`//xpath-text-show-more`).isVisible()) {
      await this.clickOnBtnWithLabel("Show more");
    }
    const xpathCustomProfileBlock = "//xpath-custom-profile-block";
    const profileQuantity = await this.page.locator(xpathCustomProfileBlock).count();
    for (let i = 0; i < profileQuantity; i++) {
      await this.page.locator(`//xpath-edit-custom-profile-[1]`).click();
      await this.clickOnBtnWithLabel("Delete profile");
      await this.page.locator(`//xpath-delete-profile-on-popup`).click();
    }
  }

  /**
   * Create a custom shipping profile
   * @param profileName: name of shipping profile
   * @param productList: list product config for this profile
   *        - can be null
   *        - if not null: productList.name: string - required
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createShippingProfile(profileName: string, productList: Array<any>) {
    await this.clickOnBtnWithLabel("Create new profile");
    await this.page.locator(`//xpath_profile_name`).fill(profileName);
    await this.page.locator(`//xpath_add_product`).click();
    for (const product of productList) {
      await this.page.locator(`//xpath_search_product`).fill(product.name);
      await this.page.locator(`//xpath_checkbox_btn'${product.name}'`).click();
    }
    await this.clickOnBtnWithLabel("Done");
    await this.clickOnBtnWithLabel("Save");
  }

  /**
   * Create a shipping zone
   * Pre-condition: User is being in a profile details
   * @param zoneName: name of zone
   * @param zoneCountries: list countries name config for this zone
   */
  async createShippingZone(zoneName: string, zoneCountries: Array<string>) {
    await this.clickOnBtnWithLabel("Create shipping zone");
    await this.page.locator(`//xpath_input_name`).fill(zoneName);
    for (const countryName of zoneCountries) {
      await this.page.locator(`//xpath_search_country`).fill(countryName);
      await this.page.locator(`//xpath_checkbox_btn'${countryName}'`).click();
    }
    await this.clickOnBtnWithLabel("Done");
    await this.clickOnBtnWithLabel("Save");
  }

  /**
   * Add shipping rate for a shipping zone of a shipping profile
   * Pre-condition: User is being in a profile details
   * @param zoneName: name of the shipping zone user want to add rates for
   * @param shippingRate: info of the shipping rate
   */
  async addRate(zoneName: string, shippingRate: ShippingRate) {
    await this.page.locator(`xpath_add_rate${zoneName}`).click();
    await this.inputTextBoxWithLabel("Rate name", shippingRate.name);
    await this.inputTextBoxWithLabel("Price", shippingRate.price);
    await this.inputTextBoxWithLabel("Min shipping time", shippingRate.min_shipping_time);
    await this.inputTextBoxWithLabel("Max shipping time", shippingRate.max_shipping_time);
    await this.clickRadioButtonWithLabel(shippingRate.type);
    switch (shippingRate.type) {
      case "Item based rates": {
        await this.inputTextBoxWithLabel("Per additional item", shippingRate.additional_price);
        break;
      }
      case "Price based rates": {
        await this.inputTextBoxWithLabel("Minimum order price", shippingRate.min_price);
        await this.inputTextBoxWithLabel("Maximum order price", shippingRate.max_price);
        break;
      }
      case "Weight based rates": {
        await this.inputTextBoxWithLabel("Minimum weight", shippingRate.min_weight);
        await this.inputTextBoxWithLabel("Maximum weight", shippingRate.max_weight);
        break;
      }
    }
    await this.clickOnBtnWithLabel("Done");
  }
}
