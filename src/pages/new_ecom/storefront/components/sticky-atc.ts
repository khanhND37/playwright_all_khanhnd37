import { SBPage } from "@pages/page";

export class StickyAtc extends SBPage {
  public xpathOutViewportAtc = `//h3[normalize-space()='OUTVIEWPORTSTICKYATC']`;
  public xpathStickyContainer = `.sticky__container`;
  public xpathBtnAtc2 = `//span[normalize-space()='Add to cart 2']`;
  public xpathFeaturedCollection = `.featured_collection__container`;
  public xpathMedia = `.media-gallery`;
  public xpathPreviewMedia = `.preview-media__container`;
  public xpathPreviewMediaStickyContainer = `${this.xpathPreviewMedia} ${this.xpathStickyContainer}`;
  public xpathImgSticky = `//img[@class="image sb-lazy"]`;
  public xpathSelectVariantInStickyContainer = (index = 1) => {
    return `(//div[contains(@class,'sticky__product-options')] //select)[${index}]`;
  };
  public xpathVariantSelector = `.variants-selector`;
  public xpathBtnAtcSticky = `${this.xpathStickyContainer} button.btn-primary`;
  public xpathCartDrawer = "[id='default_cart_drawer']";
  public xpathBtnCustomize = `${this.xpathStickyContainer} button.sticky__btn--customize`;
  public xpathInputCustomOption = `${this.xpathStickyContainer} .input-base--wrapper input`;
  public xpathImageSticky = `${this.xpathStickyContainer} .sticky__product-image img`;
  public xpathSelectedOption = index => {
    return `${this.xpathSelectVariantInStickyContainer(index)} //option[contains(@data-selected,'true')]`;
  };
  public xpathPlaceholder = index => {
    return `${this.xpathSelectVariantInStickyContainer(index)} //option[1]`;
  };
  public xpathStickyOptionError = index => {
    return `(//div[contains(@class,'sticky__product-options__error')] //p)[${index}]`;
  };
  public xpathVariantBlock = `(//section[@component='variants'])[1]`;
  public xpathBtnCrop = `//div[contains(@class, 'outside-modal__body__content')]/descendant::button[contains(@class, 'btn-crop')]`;
  public xpathCropper = `(//div[contains(@class, 'popover-bottom__content relative')])[1]`;
  public xpathOutsideModal = `(//div[contains(@class, 'popover-bottom__content relative')])[1]`;
}
