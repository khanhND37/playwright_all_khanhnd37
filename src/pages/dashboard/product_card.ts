import { WebBuilder } from "@pages/dashboard/web_builder";
import { XpathNavigationButtons } from "@constants/web_builder";

export class ProductCard extends WebBuilder {
  xpathLoadingCheckoutForm = "//div[contains(@class, 'skeleton__container')]";
  xpathMyProductCreator =
    "//section[contains(@component,'my-product')]//ancestor::section[contains(@class, 'section relative')]";
  xpathBacktoMyProductsBtn = "//span[normalize-space() = 'Back to My Products']";
  xpathProductList =
    "//section[contains(@component,'product_list')]//ancestor::section[contains(@class, 'section relative')]";
  xpathSavedMessage = ".sb-toast__message";
  xpathVariantSelectorPopup = "//div[@id='variant-selector-popup__content']";
  xpathCloseIconOnPopup = "//div[contains(@class,'icon-close')]";
  xpathProductCardTooltipIcon = "//p[contains(text(), 'Product card')]//parent::div//following-sibling::span";
  xpathProductCardPopover = "//img[contains(@src,'help-product_card')]//parent::div";
  xpathSoldoutTooltipIcon = "//div[@data-widget-id='sold_out_badge']//span[contains(@class, 'tooltip')]";
  xpathShowRatingTooltipIcon = "//div[@data-widget-id='show_rating']//span[contains(@class, 'tooltip')]";
  xpathSaleTooltipIcon = "//div[@data-widget-id='sale_badge']//span[contains(@class, 'tooltip')]";
  xpathWhenClickATCLabel = "//div[@data-widget-id='click_add_cart']//label[contains(@class, 'tooltip')]";
  xpathImgRatioProductCardBtn = "//div[@data-widget-id='image_ratio']//button";
  xpathImgCoverProductCardBtn = "//div[@data-widget-id='image_cover']//button";
  xpathHoverEffectProductCardBtn = "//div[@data-widget-id='hover_effect']//button";
  xpathFontProductCardBtn = "//div[@data-widget-id='font']//button";
  xpathProductCardImageRatio = "(//div[contains(@class, 'product-card--image')])[1]//div[contains(@style, 'padding')]";
  xpathProductCardHoverEffect = "(//div[contains(@class, 'product-card--image')])[1]//div[contains(@class, 'images')]";
  xpathProductCardImageCover = "(//div[contains(@class, 'product-card--image')]//img)[1]";
  xpathProductCardName = "(//div[contains(@class, 'product-card__name')])[1]";
  xpathProductCardPrice = "(//div[contains(@class, 'product-card__price')])[1]";
  xpathProductCardRating = `(//section[@component='product_rating'])[1]`;
  xpathWhenClickATC = "//div[@data-widget-id='click_add_cart']//span[contains(@class, 'button--label')]";
  xpathRatingReviewOverall = `//div[contains(@class, 'block-rating-rv__overall')]`;
  navigationBackLoc = this.titleBar.locator(`span.sb-icon`);
  xpathRatingColor = `//div[contains(@data-widget-id,'rating_color')]//div[contains(@class,'sb-pointer')]`;
  productBadge = `//a[normalize-space()='productname']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'product-card--badge')]`;
  soldoutBadge = `//a[normalize-space()='productname']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'sold-out')]`;
  saleBadge = `//a[normalize-space()='productname']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'sales')]`;
  productImg = `//a[normalize-space()='productname']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'product-card--image')]`;
  addToCartBtn = `//a[normalize-space()='productname']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'button--add-cart')]//div`;
  productCardName = `//a[normalize-space()='productname']`;
  productCardPrice = `//a[normalize-space()='productname']//parent::div//following-sibling::div[contains(@class, 'product-card__price')]`;
  checkoutForm = `//span[normalize-space() = 'productname']//ancestor::div[contains(@class, 'row--container')]//section[@component='checkout_form']`;
  productCardTag = `//a[normalize-space()='productname']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'digital-type')]`;
  productCardRating = `//a[normalize-space()='productname']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'product-card__rating')]`;
  ratingText = `//a[normalize-space()='productname']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'block-rating-rv__text')]`;
  ratingIcon = `//a[normalize-space()='productname']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'block-review-icon')]//parent::div[contains(@class, 'items-center')]`;
  wbTemplateXpath = `//header[contains(@class, 'sb-sticky')]/descendant::div[contains(@class, 'w-builder__autocomplete')]/descendant::p[contains(text(), 'Preview')]`;
  wbLoadingDotTemplate = `//span[contains(@class, 'sb-autocomplete--loading-dots')]`;
  wbInputTemplate = `//div[contains(@class, 'w-builder__autocomplete__wrap')]/descendant::input`;
  productTitleInProductPage = `(//span[@value= "product.title" ])[1]`;
  xpathQuantityBtn = `//section[@component="quantity_selector"]`;

  xpathPC = {
    btnSeeCollection: index => `(//span[normalize-space()="SEE COLLECTION"])[${index}]`,
    collectionName: collectionName => `//h2[normalize-space()='${collectionName}']`,
  };

  //My product list
  productImgMPL = `//h5[contains(@class, 'product__name') and text() = 'productname']//parent::div//preceding-sibling::div[contains(@class, 'image')]`;
  productCardNameMPL = `//h5[contains(@class, 'product__name') and text() = 'productname']`;
  productCardTagMPL = `//h5[contains(@class, 'product__name') and text() = 'productname']//parent::div//div[contains(@class, 'type--grid')]`;
  productCardProgress = `//h5[contains(@class, 'product__name') and text() = 'productname']//parent::div//div[contains(@class, 'complete')]`;
  /**
   Click save setting
   */
  async clickSaveBtn() {
    //wait to enable button save
    await this.page.waitForTimeout(3 * 1000);
    if (await this.page.locator(XpathNavigationButtons["save"]).isEnabled()) {
      await this.page.locator(XpathNavigationButtons["save"]).waitFor({ state: "visible" });
      await this.page.locator(XpathNavigationButtons["save"]).click();
      await this.page.waitForSelector("text='All changes are saved'");
      await this.page.waitForSelector(this.xpathSavedMessage, { state: "hidden" });
      await this.page.waitForTimeout(2 * 1000);
    }
  }

  /**
   * change collection data source in collection detail
   */
  async changeCollectionSource(collectionName: string) {
    // click template preview
    await this.page.waitForSelector(this.wbTemplateXpath);
    await this.page.locator(this.wbTemplateXpath).click();
    // wait data loading
    await this.page.locator(this.wbLoadingDotTemplate).first().waitFor({ state: "detached" });
    await this.page.locator(this.wbInputTemplate).fill(collectionName);
    // await this.page.locator(this.wbLoadingDotTemplate).first().waitFor({ state: "visible" });
    await this.page.locator(this.wbLoadingDotTemplate).first().waitFor({ state: "detached" });
    // search collection
    const xpathSearch = `//div[contains(@class, 'w-builder__autocomplete__selection')]/descendant::div[contains(@class, 'sb-tooltip__reference') and contains(text(),'${collectionName}')][1]`;
    await this.page.waitForSelector(xpathSearch);
    await this.page.waitForTimeout(2 * 1000);
    await this.page.locator(xpathSearch).click();
    await this.page.waitForTimeout(2 * 1000);
    const selectedTemplate = `//header[contains(@class, 'sb-sticky')]/descendant::div[contains(@class, 'w-builder__autocomplete')]/descendant::p[contains(text(), 'Preview: ${collectionName}')]`;
    await this.page.waitForSelector(selectedTemplate);
  }

  getXpathProductCardName(ProductName: string): string {
    return `(//div[contains(@class, 'product-card__name')]//h2[normalize-space()="${ProductName}"])[1]`;
  }

  async clickProductCardByName(ProductName: string) {
    await this.page.locator(this.getXpathProductCardName(ProductName)).click();
    await this.page.locator("#v-progressbar").waitFor({ state: "detached" });
    await this.page.waitForLoadState("networkidle");
  }

  async clickFirstProductCardName() {
    await this.page.locator(this.xpathProductCardName).click();
    await this.page.locator("#v-progressbar").waitFor({ state: "detached" });
    await this.page.waitForLoadState("networkidle");
  }

  getXpathProductTitle(ProductName: string): string {
    return `(//span[@value= "product.title" and normalize-space() = "${ProductName}"])[1]`;
  }
}
