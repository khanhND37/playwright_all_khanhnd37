import { SFCheckout } from "@sf_pages/checkout";
import { Page } from "@playwright/test";
import { expect } from "@core/fixtures";
import { FormCheckoutData } from "@types";

export class SfBoostUpsellInsidePage extends SFCheckout {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathPrePurchase = {
    popup: {
      container: "//div[contains(@class, 'pre-purchase__container')]",
      productByName: name =>
        `//div[contains(@class, 'upsell-product__product-name') and contains(normalize-space(), '${name}')]`,
      addToCartButtonByName: name =>
        `//div[contains(@class, 'pre-purchase__offer-products')]//div[contains(@class, 'upsell-product__product-detail') and contains(normalize-space(), '${name}')]//button[@data-button='add-to-cart']`,
      checkoutButton: "//button[@data-button='checkout']",
    },
    checkout: {
      continueButton: "//button[contains(@class, 'step__continue-button')]",
    },
  };

  xpathCart = {
    cartNumber: "//span[contains(@class, 'cart-number')]",
  };

  async openProductPage(handle: string) {
    await this.page.goto(`https://${this.domain}/products/${handle}`);
    await this.page.waitForLoadState("networkidle");
  }

  async addToCart() {
    await this.page.getByRole("button", { name: "Add to cart" }).first().click();
    await this.waitForResponseIfExist("cart.json");
  }

  async addToCartOnPopupPrePurchase(name: string) {
    const locatorAddToCart = this.genLoc(this.xpathPrePurchase.popup.addToCartButtonByName(name));
    await locatorAddToCart.click();

    await expect(locatorAddToCart).toBeHidden();
  }

  async completeCheckout(formData: FormCheckoutData) {
    await this.genLoc(this.xpathPrePurchase.popup.checkoutButton).first().click();
    await this.enterShippingAddress(formData.form_shipping);
    await this.genLoc(this.xpathPrePurchase.checkout.continueButton).click();
    await this.genLoc(this.xpathPrePurchase.checkout.continueButton).click();

    let cardInfo = formData.form_payment;
    if (!cardInfo) {
      cardInfo = this.defaultCardInfo;
    }
    await this.inputCardInfoAndCompleteOrder(cardInfo.number, cardInfo.holder_name, cardInfo.expire_date, cardInfo.cvv);
  }
}
