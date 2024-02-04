import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";

export class SFApps extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /** Hàm thực hiện Add to cart trong product detail
   * Vì playwright thực hiện hành động quá nhanh nên sinh ra case
   * ấn add to cart ko ăn
   * ấn add to cart ăn nhưng ko hiện upsell offer
   * hàm viết riêng để test upsell offer thêm wait API app.json load mới click -> solved issue
   */
  async addToCart() {
    const url = `https://${this.domain}/api/bootstrap/app.json`;
    const addToCartLoc = "//div[@data-form='product']/child::div[2]/descendant::button[contains(@class, 'add-cart')]";
    await this.page.waitForResponse(url);
    await this.page.locator(addToCartLoc).click();
    await this.page.waitForLoadState("networkidle");
  }

  async addPrePurchaseProductToCart(productName: Array<string>) {
    for (let i = 0; i < productName.length; i++) {
      const buttonAddToCart = `//div[contains(@class,'upsell-product__product-name') and normalize-space()='${productName[i]}']/following-sibling::button[contains(@class, 'product-add-cart')]`;
      await this.page.locator(buttonAddToCart).scrollIntoViewIfNeeded();
      await this.page.click(buttonAddToCart);
      await this.page.waitForSelector(buttonAddToCart, { state: "hidden" });
    }
  }
  async addQuantityDiscountsToCart(discountMsg: string) {
    await this.page.click(`//*[normalize-space()='${discountMsg}']//ancestor::div[2]//descendant::button`);
  }

  async addAccessoriesToCart(accessName: string, custOptions?: string) {
    await this.page.click(
      `//a[normalize-space()='${accessName}']//ancestor::div[2]//descendant::button[normalize-space()='Add']`,
    );
    await this.page.waitForSelector(
      `//a[normalize-space()='${accessName}']//ancestor::div[2]//descendant::button[normalize-space()='Add']`,
      { state: "hidden" },
    );
    if (custOptions) {
      await this.page.fill("//input[contains(@class, 'upsell-custom-option')]", custOptions);
      await this.page.click("//button[@data-button='add-to-cart']");
      await this.page.waitForLoadState("networkidle");
    }
  }
  /**
   * Add tất cả products trong bundles vào cart
   * @param bundlesQuantity là số lượng products trong bundles
   * @param custOptions (optional) là input text của product có custom option
   */
  async addAllBundlesToCart(bundlesQuantity: number, custOptions?: string) {
    await this.page.click("//button[normalize-space()='Add all to cart']");
    if (custOptions) {
      await this.page.fill("//input[contains(@class, 'upsell-custom-option')]", custOptions);
      for (let i = 0; i < bundlesQuantity - 1; i++) {
        await this.page.click("//button[normalize-space()='Continue']");
      }
      await this.page.waitForSelector("//button[contains(@class,'bundle-popup__button-text')]");
      await this.page.click("//button[contains(@class,'bundle-popup__button-text')]");
    }
    await this.waitResponseWithUrl("/api/checkout/next/cart.json");
  }
  prePurchaseRecommendedProduct(productName: string) {
    return this.page.locator(`
    //*[contains(@class,'pre-purchase__content')]/descendant::a[2][normalize-space()='${productName}']`);
  }

  /**
   * Get price of item post-purchase, in-cart, pre-purchase
   * @param product name of product
   * @return price of product
   */
  async getPriceProductUpsell(
    product: string,
    priceType: "price" | "compare at price" | "sale price",
  ): Promise<string> {
    let xpathPrice = "";
    switch (priceType) {
      case "price":
        xpathPrice = "product-price";
        break;
      case "compare at price":
        xpathPrice = "compare";
        break;
      case "sale price":
        xpathPrice = "sale-price";
        break;
    }

    return await this.getTextContent(
      `//*[normalize-space()='${product}']//ancestor::div[contains(@class, 'detail')]//div[contains(@class, '${xpathPrice}')]`,
    );
  }
}
