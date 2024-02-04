import { SBPage } from "../page";
import { Page } from "@playwright/test";
import { removeCurrencySymbol } from "@core/utils/string";

export class AliexpressPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Go to aliexpress page
   * @param aliLink is link aliexpress
   */
  async goToAliexpress(aliLink: string) {
    await this.page.goto(aliLink);
    const hasCapcha = await this.isElementExisted("//*[text()='Please slide to verify']");
    const needRefreshPage = await this.isElementExisted("//*[contains(text(),'Please refresh the page')]");

    let i = 0;
    while ((hasCapcha || needRefreshPage) && i < 15) {
      await this.page.reload({ waitUntil: "load" });
      const slider = await this.page.locator("//*[@class='scale_text slidetounlock']").boundingBox();
      const handle = await this.page.locator("//*[@class='nc_iconfont btn_slide']").boundingBox();

      await this.page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(handle.x + slider.width, handle.y + handle.height / 2, { steps: 10 });
      await this.page.mouse.up();
      await this.waitUntilElementInvisible("//*[contains(text(),'Loading')]");
      i++;
    }

    await this.page.waitForSelector("//span[@class='logo-base']");
  }

  /**
   * Choose ship to and currency
   * @param country is country for ship
   * @param currency is currency of product
   * @param lang is language page
   */
  async standardPage(req: { country?: string; currency?: string; lang?: string }) {
    const xpathSwicher = "//div[@id='switcher-info']";
    await this.page.waitForSelector(xpathSwicher);
    await this.hoverThenClickElement(xpathSwicher, xpathSwicher);
    await this.page.waitForSelector("//div[@class='ng-item-wrap ng-item ng-switcher active']");

    if (req.country) {
      await this.clickOnElement("//div[contains(@class,'country-selector switcher-shipto')]//a[1]");
      await this.page.locator(`(//div[contains(@class,'address-select')]//input)[1]`).fill(`${req.country}`);
      await this.page.waitForSelector(`//span[text()='${req.country}']`);
      await this.page.locator(`//span[text()='${req.country}']`).nth(0).click();
      // wait 3s để auto fill adress
      await this.page.waitForTimeout(3000);
    }

    if (req.currency) {
      await this.clickOnElement("//div[@data-role='switch-currency']");
      await this.page.locator(`//div[@data-role='switch-currency']//input[1]`).fill(`${req.currency}`);
      await this.clickOnElement(`//div[@data-role='switch-currency']//a[@data-currency='${req.currency}']`);
      await this.page.waitForSelector(
        `//div[@data-role='switch-currency']//span//a[contains(text(),'${req.currency}')]`,
      );
    }

    if (req.lang) {
      await this.clickOnElement("//div[@data-role='language-container']");
      await this.page.locator(`//div[@data-role='language-container']//input`).fill(`${req.lang}`);
      await this.clickOnElement(
        `//div[@data-role='language-container']//*[@data-role='language-list']//a[text()='${req.lang}']`,
      );
    }

    await this.clickOnElement("//div[@class='switcher-sub notranslate']//button");
    await this.page.waitForSelector(`//*[contains(@class,'delivery--to') and contains(text(),'${req.country}')]`);
  }

  /**
   * Get price of aliexpress product
   * @return product price
   */
  async getProductPrice(): Promise<string> {
    let price = "";
    const textPrices = await this.getAllTextContents("//div[@class='product-price-current']//span");
    for (const textPrice of textPrices) {
      price = price.concat("", textPrice);
    }
    return removeCurrencySymbol(price);
  }

  /**
   * Get url aliexpress product
   */
  getUrlAli(): string {
    const urlAli = this.page.url().split("?")[0];
    return urlAli;
  }

  /**
   * Click choose product without discount
   */
  async chooseProductWithoutDiscount() {
    await this.page.waitForSelector("//div[@class='pdp-info-right']");
    let i = 0;
    while ((await this.page.locator("//*[contains(@class,'price-banner--banner')]").isVisible()) && i < 20) {
      await this.clickOnElement("//div[contains(@class,'recommend-store')]//a[1]");
      i++;
    }
  }

  /**
   * Get current variant
   */
  async getCurrentVariant(): Promise<string[]> {
    await this.page.waitForSelector("//div[@class='sku-property']");
    const currentVariant = await this.getAllTextContents("//div[@class='sku-title']//span[@class='sku-title-value']");
    return currentVariant;
  }

  /**
   * Get standard shipping fee of aliexpress product
   * @return shipping fee aliexpress
   */
  async getShippingFeeAli(): Promise<number> {
    await this.page.click(
      "(//div[contains(@class, 'dynamic-shipping-contentLayout')]//span[contains(text(),'From')])[1]",
    );

    const xpathMoreOptions = "//div[@class='comet-modal-content']//button//span[text()='More options']";
    if (await this.isElementExisted(xpathMoreOptions)) {
      await this.page.click(xpathMoreOptions);
    }

    const shipping = Number(
      await this.getTextContent(
        "(//div[@class='dynamic-shipping' and descendant::span[contains(text(),'Standard')]]//*[contains(text(),'hipping')])[1]",
      ),
    );
    return shipping;
  }

  /**
   * Get total images
   */
  async getTotalImage(): Promise<number> {
    const totalImage =
      (await this.page.locator(`//li[descendant::img]`).count()) +
      (await this.page.locator(`//div[contains(@class,'item--image')]`).count());
    return totalImage;
  }
}
