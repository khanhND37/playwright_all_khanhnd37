import { SFProduct } from "@pages/storefront/product";
import { DashboardPage } from "./dashboard";

export class InCartPageDB extends DashboardPage {
  xpathToastActiveOfferSuccess = "//div[text()[normalize-space()='Offer was activated successfully']]";
  xpathToastDeactiveOfferSuccess = "//div[text()[normalize-space()='Offer was deactivated successfully']]";

  getStatusOfferXpath(offerName: string) {
    return `//*[contains(., "${offerName}")]/ancestor::tr//td[contains(@class,"offer-status")]//div`;
  }

  /**
   *  Active offer in dashboard (Upsell)
   */
  async activeOffer(offerName: string) {
    await this.page.locator(`//*[contains(., "${offerName}")]/ancestor::tr//span[@class="s-check"]`).click();
    await this.page.locator(`//span[contains(text(),'Action')]`).click();
    await this.page.locator(`//span[normalize-space()='Activate offer']`).click();
    await this.page.waitForSelector(this.xpathToastActiveOfferSuccess, { state: "visible" });
    await this.page.waitForSelector(this.xpathToastActiveOfferSuccess, { state: "hidden" });
  }

  /**
   *  Inactive offer in dashboard (Upsell)
   */
  async inactiveOffer(offerName: string) {
    await this.page.locator(`//*[contains(., "${offerName}")]/ancestor::tr//span[@class="s-check"]`).click();
    await this.page.locator(`//span[contains(text(),'Action')]`).click();
    await this.page.locator(`//span[normalize-space()='Deactivate offer']`).click();
    await this.page.waitForSelector(this.xpathToastDeactiveOfferSuccess, { state: "visible" });
    await this.page.waitForSelector(this.xpathToastDeactiveOfferSuccess, { state: "hidden" });
  }
}

export class InCartPageSF extends SFProduct {
  selectorValidateMessOnPopup = ".upsell-msg-validate div";
  selectorUpsellPopupOnProductPage = ".upsell-quick-view__container";
  selectorUpsellCustomOption = ".upsell-custom-option__input-option";

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
