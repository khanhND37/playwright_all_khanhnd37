import { SFProduct } from "@pages/storefront/product";

export class Accsessory extends SFProduct {
  selectorValidateMessOnPopup = ".upsell-msg-validate div";
  selectorUpsellPopupOnProductPage = ".upsell-quick-view__container";
  selectorUpsellCustomOption = ".upsell-custom-option__input-option";
  xpathAccessoryOnProductPage = "//div[@class='upsell-accessory-products']";
  imageProductOnUpsellPopup = `${this.selectorUpsellPopupOnProductPage} img`;

  xpathAccessoryBtnAdd(index = 1): string {
    return `(//div[@class='upsell-accessory-products__action']//button[normalize-space()='Add'])[${index}]`;
  }

  xpathAccessoryBtnAdded(index = 1): string {
    return `(//div[@class='upsell-accessory-products__action']//button[normalize-space()='Added'])[${index}]`;
  }

  /**
   * Click on Cart icon on Header
   */
  async clickOnCartIconOnHeader() {
    await this.page.click("//a[@class='cart-icon'] | //a[contains(@class,'mini-cart')]");
    await this.page.waitForLoadState("load");
  }

  /**
   * Select variant product Upsell
   */
  async selectUpsellVariant(variant: string) {
    await this.page.click(`//*[contains(@class,'upsell-product-option') and normalize-space()='${variant}']`);
  }

  /**
   * Add product Upsell to cart
   */
  async addUpsellProductToCart() {
    await this.page
      .locator("//div[contains(@class,'upsell-quick-view__add-to-cart')]//button[normalize-space()='Add to cart']")
      .click();
  }
}
