import { removeCurrencySymbol } from "@core/utils/string";
import { SBPage } from "@pages/page";
import { expect } from "@playwright/test";
import type { ProductTemplate } from "@types";

export class CatalogPage extends SBPage {
  /**
   * Get data product by API.
   * @param domain is domain of store
   * @param accessToken is access token login store
   * @param productId is id of product template
   */
  async getDataProduct(domain: string, accessToken: string, productId: number): Promise<ProductTemplate> {
    const response = await this.page.request.get(
      `https://${domain}/admin/plusbase-sourcing/products/${productId}.json?type=private&access_token=${accessToken}`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * User choose a base product tab
   * @param tabName
   * @param productName
   */
  async chooseTabBaseProduct(tabName: string, productName: string) {
    await this.page.click(`//p[contains(text(),'${tabName}')]`);
    await this.page.waitForSelector(`//span[@data-label='${productName}']`);
  }

  /**
   * User choose action set up shipping fee with a base product
   * @param productName
   */
  async chooseSetUpShippingFee(productName: string) {
    await this.page.click(
      `//span[@data-label='${productName}']/ancestor::div[@class='prod-wrap']/descendant::div[@role='button']`,
    );
    await this.page.click(
      `//span[@data-label='${productName}']/ancestor::div[@class='prod-wrap']/descendant
    ::span[contains(text(),'Set up shipping fee')]`,
    );
  }

  /**
   * User select a country for the set up shipping fee with that country
   */
  async selectCountry(countryName: string): Promise<void> {
    await this.page.waitForSelector(`//span[contains(text(),'Country')]`);
    await this.page.click(`//input[@placeholder='Search countries']`);
    await this.page.fill(`//input[@placeholder='Search countries']`, `${countryName}`);
    await this.page.click(`//span[contains(text(),'${countryName}')]/preceding-sibling::span`);
    await this.page.click(`//p[contains(text(),'Set up Shipping fee')]`);
  }

  /**
   * Get profit one item with shipping rate
   * @param shippingRate
   * @returns profit one item
   */
  async getProfitOneItem(shippingRate: string) {
    return await this.page.innerText(`(//p[contains(text(),'${shippingRate}')]/following-sibling::p)[3]`);
  }

  /**
   * Get profit two item with shipping rate
   * @param shippingRate
   * @returns profit two item
   */
  async getProfitTwoItem(shippingRate: string) {
    return await this.page.innerText(`(//p[contains(text(),'${shippingRate}')]/following-sibling::p)[4]`);
  }

  /**
   * Get shipping first item with shipping rate
   * @param shippingRate
   * @returns shipping first item
   */
  async getShippingFirstItem(shippingRate: string) {
    return Number(
      removeCurrencySymbol(
        await this.page.innerText(`(//p[contains(text(),'${shippingRate}')]/following-sibling::p)[1]`),
      ),
    );
  }

  /**
   * Get shipping additional item with shipping rate
   * @param shippingRate
   * @returns shipping additional item
   */
  async getShippingAddItem(shippingRate: string) {
    return Number(
      removeCurrencySymbol(
        await this.page.innerText(`(//p[contains(text(),'${shippingRate}')]/following-sibling::p)[2]`),
      ),
    );
  }

  /**
   * User choose action save.
   */
  async chooseSave(): Promise<void> {
    await this.page.click(`//span[contains(text(),'Save')]`);
  }

  async inputInfoShipping(sellPrice: string, markupFirst: string, markupAdd: string) {
    await this.page.fill(`//input[@type='number']`, sellPrice.toString());
    await this.page.fill(
      `(//p[contains(text(),'Standard shipping')]/following-sibling::div)[1]/descendant::input`,
      markupFirst.toString(),
    );
    await this.page.fill(
      `(//p[contains(text(),'Standard shipping')]/following-sibling::div)[2]/descendant::input`,
      markupAdd.toString(),
    );
  }
}
