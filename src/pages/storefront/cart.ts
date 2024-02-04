import { expect, Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { SFCheckout } from "@sf_pages/checkout";

export class SFCart extends SBPage {
  xpathCartContent = "(//div[@data-id='cart_page'] | //div[contains(@class,'cart-drawer-container')])[1]";
  checkoutBtn = this.genLoc("[component=button]").filter({ hasText: "Checkout" });
  xpathCartOffer = "//section[@type='cart-offer']//div[@class='upsell']";
  selectorUpsellPopup = ".upsell-quick-view__container";
  selectorClosePopup = ".upsell-modal__close";
  xpathInCartOfferBtnAdd = "//div[@class='upsell-cart-offer__action']//button[normalize-space()='Add']";
  xpathCheckoutBtn = "//button[@type='button' and @name='checkout']";
  productCart = this.genLoc("[class^='product-cart ']");
  addMoreItemBtn = "[class*=add-more-item]";
  xpathIconCloseCartDrawer = "//div[contains(@class, 'close-popup-button__line')]";
  xpathImageInCartDraw =
    "(//div[contains(@class,'checkout-product-thumbnail')] | //div[contains(@class,'product-cart__image')])[1]";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Ấn remove item ở trang cart dựa theo tên của product in cart
   * @param prodName
   * @param index
   */
  async removeInCartItem(prodName: string, index = 0): Promise<void> {
    const removeItemBtn = this.genLoc(".product-cart")
      .filter({ has: this.page.getByRole("link", { name: prodName, exact: true }).nth(index) })
      .getByRole("link", { name: "Remove item" });
    await removeItemBtn.click();
    await removeItemBtn.waitFor({ state: "hidden" });
  }

  /**
   * Lấy locator Offer discount price và subtotal price trong cart để verify
   * @param type
   * @returns
   */
  getPriceInCart(type: "Offer discount" | "Subtotal"): Locator {
    const ele = this.genLoc(".block-cart-summary>div").filter({ hasText: type }).locator(".block-cart-summary__price");
    return ele;
  }

  async checkout() {
    await Promise.all([
      this.page.waitForNavigation(),
      await this.page
        .locator(
          `(//button[normalize-space()='Checkout'])[1] | (//span[normalize-space()='Checkout' or normalize-space()='CHECKOUT'])[1]`,
        )
        .click(),
      await this.page.waitForLoadState("domcontentloaded"),
    ]);
    await expect(this.page.locator("//*[@id='checkout-layout']")).toBeVisible();
    return new SFCheckout(this.page, this.domain, "");
  }

  async getProductPriceWithoutCurrency(prodName: string) {
    return Number(
      (
        await this.page
          .locator(
            `//div[contains(@class,'product-cart-wrapper')]` +
              `//a[normalize-space()='${prodName}']/following::p[contains(@class,'product-cart__price')]`,
          )
          .textContent()
      ).replace(/[^0-9.]/g, ""),
    );
  }

  async offerDiscountAmount() {
    return Number(
      (await this.page.locator(`//p[contains(@class, 'cart-total-discount')]`).textContent()).replace(/[^0-9.]/g, ""),
    );
  }

  async getSubTotal() {
    return Number(
      (await this.page.locator("//div[contains(@class, 'cart__subtotal-price')]").textContent()).replace(
        /[^0-9.]/g,
        "",
      ),
    );
  }

  async getProductInCartQuantity(productName: string) {
    return Number(
      await this.page
        .locator(`//p[normalize-space()='${productName}']//ancestor::div[3]//descendant::input`)
        .inputValue(),
    );
  }

  productsInCart() {
    return this.page.locator("//div[contains(@class,'product-cart-wrapper')]");
  }

  productInCartByName(name: string) {
    return this.page.locator(`//p[contains(@class,'product-cart__name')]//a[normalize-space()='${name}']`);
  }

  inCartOfferRecommendedProduct(recommendedProduct: string) {
    return this.page.locator(`
    //*[contains(@class, 'upsell-cart-offer__information-title') and normalize-space()='${recommendedProduct}']`);
  }

  async addInCartOfferProductToCart() {
    await this.page.locator("//button[normalize-space()='Add']").click();
    if (await this.page.locator(".upsell-quick-view__container").isVisible()) {
      await this.page.click("//button[@data-button= 'add-to-cart']");
    }
    await this.page.waitForLoadState("networkidle");
  }

  async removeInCartProduct(productName: string) {
    await this.page.click(
      `//a[normalize-space()='${productName}']//ancestor::div[2]//child::div[2]` +
        `//descendant::a[normalize-space()='Remove item']`,
    );
    await this.page.waitForLoadState("networkidle");
    if (await this.page.locator("//*[normalize-space()='Cart']").isVisible()) {
      await this.page.click("//*[@type='button' and normalize-space()='Remove item']");
    }
  }

  /**
   * Hàm click add more items của product theo tên
   * @param name: tên product
   */
  async addMoreItemsProduct(name: string): Promise<void> {
    await this.productCart.filter({ hasText: name }).locator(this.addMoreItemBtn).click();
  }

  /**
   * get image in cart page
   * @param productName: name of product
   * */

  getXpathImageProductInCartPage(productName: string) {
    return `//div[contains(@class,"product-cart__image")]//img[@alt="${productName}"]`;
  }
}

export class SFCartv3 extends SFCart {
  xpathProductsInOder = "//section[@component='order-item']";
  xpathProductsInCartv3 = "(//section[@component='cart-items']//div[contains(@class, 'block-cart-items')])[1]";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  productsInCartv3() {
    return this.page.locator(this.xpathProductsInCartv3);
  }

  async getProductInCartQuantityv3(productName: string) {
    return Number(
      await this.page
        .locator(
          `(//p[normalize-space()='${productName}']//ancestor::div[contains(@class, 'product-cart ')]//descendant::input)[1] `,
        )
        .inputValue(),
    );
  }

  async getVariantInOrderQuantityv3(variant: string) {
    return Number(
      await this.page
        .locator(
          `//p[normalize-space()='${variant}']//ancestor::div[contains(@class, 'product-cart ')]//descendant::div[contains(@class, 'product-cart__badge')]/span `,
        )
        .innerText(),
    );
  }

  /**
   * Hàm lấy thông tin giá product trong cartdrawer hoặc cart page
   * @param productName
   * @param variant
   * @param size
   * @returns
   */
  async getPriceProductInCartDrawerOrCartPage(
    productName: string,
    variant: string,
    size: "small" | "large",
  ): Promise<{ price: string; comparePrice: string }> {
    let comparePrice = "";
    const xpathProduct = `//div[contains(@class,'product-cart__details-${size}') and descendant::a[normalize-space()="${productName}"] and descendant::p[normalize-space()="${variant}"]]`;
    await this.page.waitForSelector(xpathProduct);
    const price = await this.page.innerText(`(${xpathProduct} // span[contains(@class,'product-cart__price')])[1]`);
    const xpathComparePriceIsVisible = await this.genLoc(
      `${xpathProduct}// span[contains(@class,'product-cart__price--original')]`,
    ).isVisible();
    if (xpathComparePriceIsVisible) {
      comparePrice = await this.page.innerText(
        `${xpathProduct}  // span[contains(@class,'product-cart__price--original')]`,
      );
    }
    return {
      price: price,
      comparePrice: comparePrice,
    };
  }

  /**
   * Hàm lấy giá trị sub total order ở cart page
   * @returns
   */
  async getSubTotalV3(): Promise<string> {
    return (
      await this.page
        .locator(
          `//section[not(contains(@class, "hidden")) and @component="cart-summary"]//h6[contains(@class,'block-cart-summary__price')]`,
        )
        .textContent()
    ).replace(/[^0-9.,]+/g, "");
  }

  /**
   * get image in cart page
   * @param productName: name of product
   * */
  getXpathImageProductInCartPageV3(productName: string, size?: string) {
    if (size) {
      return `//div[contains(@class,"product-cart__image product-cart__image-${size}")]//img[@alt="${productName}"]`;
    } else {
      return `//div[contains(@class,"product-cart__image")]//img[@alt="${productName}"]`;
    }
  }

  /**
   * change quantity product in cart page
   * @param type
   * @param productName
   * @param quantity
   */
  async changeQuantityProductInCartPage(productName: string, type: "plus" | "minus", quantity = 1) {
    const xpathBtnQuantity = `//div[contains(@class, 'product-cart__details-large') and descendant::a[normalize-space()="${productName}"]]//i[@class='${type}']`;
    await this.page.click(xpathBtnQuantity, { clickCount: quantity });
  }
}
