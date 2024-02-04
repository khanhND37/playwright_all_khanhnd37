import { Page } from "@playwright/test";
import { SFProduct } from "@pages/storefront/product";

export class ProducDetailV3 extends SFProduct {
  xpathBlockGallery = "//section[@component='media']//div[contains(@class,'media_gallery__container')]";
  xpathVariantPicker = "//section[@component='variants']//div[contains(@class, 'variants-selector')]";
  xpathBlockQuantity = "//section[@component='quantity_selector']//div[contains(@class,'button-quantity-container')]";
  xpathBtnATC =
    "//section[@component='button']//div[contains(@class,'wb-button--add-cart') and normalize-space()='ADD TO CART']";
  xpathTitleCartPage = "//h3[normalize-space()='Your cart']";
  xpathBtnBuyNow =
    "//section[@component='button']//div[contains(@class,'wb-button--add-cart') and normalize-space()='Buy now']";
  xpathCartDrawer = "[id='default_cart_drawer']";
  btnSizeChart = `//span[contains(@class,'decoration-underline')]`;
  popupSizeChart = `//div[contains(@class,'outside-modal__body__content')]`;
  iconClosePopupSC = `//div[contains(@class,'icon-close')]`;
  xpathBlockRating = `//section[@component='product_rating']/div[contains(@class, 'block-rating')]`;
  xpathSizeChartTitle = `//div[contains(@class,'product__size-chart__title')]`;

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * xpath Btn In Product Page
   * @param nameBtn
   * @returns
   */
  xpathBtnInProductPage(nameBtn: string): string {
    const xpathBtn = `//section[@component='button']//div[contains(@class,'wb-button--add-cart') and normalize-space()='${nameBtn}']`;
    return xpathBtn;
  }

  /**
   * Select variant by title
   * @param options is list option value of 1 variant
   */
  async selectVariantByTitle(options: Array<string>) {
    for await (const value of options) {
      await this.page
        .locator(
          `//div[contains(@class,'variants-selector')]//div[contains(@class,'button-layout')] //span[normalize-space()='${value}']`,
        )
        .click();
    }
    await this.page.locator("#v-progressbar").waitFor({ state: "detached" });
  }

  async clickBtnATC() {
    await this.page.locator(this.xpathBtnATC).click();
    await this.page.locator("#v-progressbar").waitFor({ state: "detached" });
  }

  async clickBtnBuyNow() {
    await this.page.locator(this.xpathBtnBuyNow).click();
    await this.page.locator("#v-progressbar").waitFor({ state: "detached" });
    await this.page.waitForLoadState("networkidle");
  }
}
