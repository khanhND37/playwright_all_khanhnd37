import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";

export class WbBlockFeaturedCollection extends Blocks {
  layerButtonXpath = 'header [name="Layer"]';
  coverImageXpath = '.collection-card--wrapper-image [onload="this.dataset.loaded=true;"]';
  firstSectionSelectorOnSF = '[id="wb-main"] .section >> nth=0';
  sideBarSelector = ".w-builder__sidebar-content .w-builder__settings";
  inputBoxProductPerPageXpath = '[data-widget-id="product_per_page"] .sb-input__inner-append';
  collectionContentXpath = ".collection-card--content";
  uploadImageButton = ".sb-upload__dropzone button";
  itemOnFeaturedCollection = '[component="featured_collection"] .product-item';
  tabContentXpath = "//div[contains(@class, 'sb-tab--inside')]//div[contains(text(), 'Content')]";
  tabDesignXpath = "//div[contains(@class, 'sb-tab--inside')]//div[contains(text(), 'Design')]";
  switchDeviceMobileButton = ".w-builder__device-toggle-items button >> nth=1";
  widgetLayoutXpath = "//div[@data-widget-id='layout']//button//span[@class='sb-button--label']";
  layoutGridOnPopup = ".list-icon .item-icon >> nth=0";
  layoutSlideOnPopup = ".list-icon .item-icon >> nth=1";
  layoutMixOnPopup = ".list-icon .item-icon >> nth=2";
  headerXpath = ".sb-sticky.w-builder__header";
  buttonUploadCoverImage =
    "//div[contains(@class,'w-builder__popover w-builder__widget--background') and not(contains(@style,'display: none;'))]//input[@type='file']";
  iconTooltipCoverImage = '[data-widget-id="thumbnail_image"] .w-builder__tooltip';
  uploadCoverImagePopup = '[id="widget-popover"] .w-builder__widget--background';
  widgetLayoutButtonXpath = '[data-widget-id="layout"]';
  layoutGridFrameLocator = ".featured_collection__container .layout-grid--container";
  productItemXpathWB = ".featured_collection__container .product-item >> nth=0";
  xpathProductPerRow = "//label[contains(text(), 'Product per row')]/ancestor::div[2]//button";
  smallCardXpath = "//label[contains(.,'Size card')]/ancestor::div[2]//label[contains(.,'Small')]";
  textboxInputSpacing =
    '//label[contains(.,"Spacing")]/ancestor::div[2]//input[contains(@class,"sb-input__inner-append")]';
  labelSpacingXpath = "//label[contains(text(), 'Spacing')]";
  mixLayoutFrameLocator = ".featured_collection__container .mix__container";
  toggleSlideNav = '//label[contains(.,"Slide Nav")]/ancestor::div[2]//input';
  toggleArrows = '//label[contains(.,"Arrows")]/ancestor::div[2]//input';
  dotFrameLocator = ".featured_collection__container .VueCarousel-dot-container";
  nextBackButtonFrameLocator = ".featured_collection__container .custom-navigation button >> nth=0";
  blockXpathOnFrameLocator = '[data-block-component="featured_collection"]';
  blockXpathOnSF = '[component="featured_collection"]';
  collectionTitleXpath = ".collection-card--content .collection-card-title";
  collectionDescriptionXpath = ".collection-card--content .collection-card-description";
  collectionButtonXpath = ".collection-card--content button";
  collectionNameInput = '//div[@data-widget-id="collection_name"]//input[@placeholder="Enter your text"]';
  collectionDescriptionInput = '//div[@data-widget-id="collection_description"]//input[@placeholder="Enter your text"]';
  collectionButtonInput = '//div[@data-widget-id="button_label"]//input[@placeholder="Enter your text"]';
  dataRemoveOnSideBarXpath = ".w-builder__widget--inline .popover__reference__title";
  selectProductPerRowAuto = `//li[contains(@class, 'sb-select-menu__item')]//span//label[contains(text(),'Auto')]`;
  layoutLabelXpath = "(//div[contains(@class, 'w-builder__widget--label')]//label[contains(text(), 'Layout')])[1]";
  xpathCoverImg = `//img[contains(@class, 'cover collection-card') and (@data-loaded="true")]`;
}
