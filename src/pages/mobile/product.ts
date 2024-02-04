import { SBPage } from "@pages/page";
import { SFCheckout } from "@pages/storefront/checkout";
import { Page } from "@playwright/test";
import { SFCart } from "@sf_pages/cart";
export class SFProductOnMobile extends SBPage {
  id: number;
  name: string;
  priceStorefront: number;
  quantity: number;
  priceDashboard: number;

  constructor(
    page: Page,
    domain: string,
    productName?: string,
    priceStorefront?: number,
    quantity?: number,
    id?: number,
  ) {
    super(page, domain);
    this.name = productName;
    this.quantity = quantity;
    this.priceStorefront = priceStorefront;
    this.id = id;
  }

  /**
   * Click add product to cart button
   * @returns
   */
  async addProductToCart() {
    await this.page.locator("(//button[normalize-space()='Add to cart'])[1]").click({ position: { x: 5, y: 5 } });
    if (this.name) {
      this.priceStorefront = Number(
        (
          await this.page
            .locator(
              `(//*[contains(@class,'product-cart__name')]//a[normalize-space()="${this.name}"]` +
                `/following::*[contains(@class,'product-cart__price')]//span)[1]`,
            )
            .textContent()
        ).substring(1),
      );
    }
    return new SFCart(this.page, this.domain);
  }

  /**
   * Choose quantity for product checkout
   * @param quantity
   */
  async inputQuantityProduct(quantity: number) {
    const xpathQ = this.page.locator("//div[@class='button-quantity' or @id='changeQuantityForm']//input");
    await xpathQ.focus();
    await this.waitAbit(1000);
    await xpathQ.fill(quantity.toString());
    await this.page.locator(`//h1[contains(@class,'product__name')]`).click();
  }

  /**
   * isMobileCheckoutWithThemeV2 to verify checkout on mobile to show total summary by toggle
   * @param isMobileCheckoutWithThemeV2
   */
  async navigateToCheckoutPageOnMobile(byPass404Error = false) {
    await this.page.locator(`//button[normalize-space()='Checkout']`).click();
    try {
      await Promise.all([
        this.page.waitForSelector(`//h2[text() = 'Shipping address']`),
        this.page.waitForSelector("//*[@class='order-summary-toggle__icon']"),
      ]);
      await this.page.locator("//*[@class='order-summary-toggle__icon']").click();
      await this.waitForCheckoutPageCompleteRender();
    } catch (e) {
      if (byPass404Error) {
        const xpath404Page = "//*[normalize-space()='404 Page Not Found']";
        const is404PageDisplayed = await this.page.isVisible(xpath404Page); // Sometimes it redirect to 404 page
        if (is404PageDisplayed) {
          await this.page.reload();
          await this.waitForCheckoutPageCompleteRender();
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
    const checkoutToken = this.page.url().toString().split("checkouts/")[1];
    return new SFCheckout(this.page, this.domain, checkoutToken);
  }
}
