import { SBPage } from "@pages/page";
import { Locator, Page } from "@playwright/test";

export class AllProductStorefront extends SBPage {
  xpathLabelProduct = "//span[contains(@class, 'product-card__name')]";
  xpathLabelAllProduct = "(//div[normalize-space()='All products'])[1]";
  xpathAllProduct = "//div[contains(@class,'product-grid mb12')]";
  xpathPriceProduct = "//div[contains(@class, 'product-card__price')]";
  xpathLabelCheckoutForm = "//span[normalize-space()='Checkout']";
  xpathSortOption = "//select[@class='w-100 px12 py8 pr32']//option";
  xpathTitleProducts = "//span[contains(@class, 'product-card__name')]";
  xpathLabelProducts = "//div[contains(@class, 'product-card__type')]//span";
  xpathPriceProducts = "//div[contains(@class, 'product-card__price')]";
  xpathThumbnailProducts = "//div[contains(@class, 'product-card__image')]";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async gotoCollectionsAll(domain: string): Promise<void> {
    await this.page.goto(`https://${domain}/collections/all`);
  }

  async getURL(): Promise<string> {
    return this.page.url();
  }

  async gotoHomePage(path = ""): Promise<void> {
    await this.goto(path);
    await this.page.waitForLoadState("networkidle");
  }

  async clickTitleProduct(productTitle: string): Promise<void> {
    await this.page.click(`(//span[normalize-space()='${productTitle}'])[1]`);
  }

  async clickThumbnailProduct(productTitle: string): Promise<void> {
    await this.page.click(`(//span[normalize-space()='${productTitle}']//preceding::img)[1]`);
  }

  async clickSortProduct(option: string): Promise<void> {
    await this.page.selectOption("//select", { label: `${option}` });
    await this.page.waitForResponse(
      response => response.url().includes("api/catalog/next/products.json") && response.status() === 200,
    );
  }

  /**
   * get name product on product list
   * @param index: product position on product list storefront
   */
  async getProductName(index: number): Promise<string> {
    return await this.getTextContent(`(//span[contains(@class,'product-card__name')])[${index}]`);
  }

  /**
   * hàm wait product sync ngoài storefront sau khi add new
   * @param productName
   */
  async waitSyncProduct(productName: string) {
    for (let i = 0; i < 10; i++) {
      if (await this.page.locator(`(//span[normalize-space()='${productName}'])[1]`).isVisible()) {
        break;
      } else {
        await this.page.reload();
        await this.page.waitForSelector(`(//span[@class='product-content__name'])[1]`);
      }
    }
  }

  async getInfoProduct(xpath: string, index: number): Promise<string> {
    return await this.getTextContent(`(${xpath})[${index}]`);
  }

  /**
   * Click vào vị trí bất kỳ trên product card
   * @param type: loại vị trí trên product card
   */
  async clickProductCard(type: string, productName: string): Promise<void> {
    if (type === "thumbnail") {
      await this.genLoc(
        `//span[normalize-space()='${productName}']//ancestor::div[contains(@class,'relative')]//div[contains(@class,'image')]`,
      ).click();
    }
    if (type === "title") {
      await this.genLoc(`//span[normalize-space()='${productName}']`).click();
    }
    if (type === "label") {
      await this.genLoc(
        `//span[normalize-space()='${productName}']//ancestor::div[contains(@class,'relative')]//div[contains(@class,"product-card__type")]//span`,
      ).click();
    }
    if (type === "price") {
      await this.genLoc(
        `//span[normalize-space()='${productName}']//ancestor::div[contains(@class,'relative')]//div[contains(@class,"product-card__price")]`,
      ).click();
    }
  }

  getXpathProductName(productName: string): Locator {
    return this.genLoc(`//span[contains(@class, 'product-card__name') and normalize-space() = '${productName}']`);
  }

  getXpathProductCard(productName: string): string {
    return `//span[normalize-space() = '${productName}']/ancestor::div[contains(@class, 'relative product-card')]`;
  }

  getXpathProductType(productName: string, productType: string): Locator {
    switch (productType) {
      case "online_course" || "Online course" || "online course":
        return this.genLoc(`${this.getXpathProductCard(productName)}//span[normalize-space() = 'Online course']`);
      case "digital_download" || "Digital download" || "digital download":
        return this.genLoc(`${this.getXpathProductCard(productName)}//span[normalize-space() = 'Digital download']`);
      case "coaching_session" || "Coaching session" || "coaching session":
        return this.genLoc(`${this.getXpathProductCard(productName)}//span[normalize-space() = 'Coaching session']`);
    }
  }

  getXpathProductPrice(productName: string): Locator {
    return this.genLoc(`${this.getXpathProductCard(productName)}//div[contains(@class, 'product-card__price')]`);
  }

  async selectCreatorProduct(productName: string): Promise<void> {
    await this.page.click(`//div[contains(@class,'product-card')]/descendant::a[normalize-space()='${productName}']`);
    await this.page.waitForSelector(`//div[@class='payment-methods__container']`);
  }
}
