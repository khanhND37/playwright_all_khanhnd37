import { APIRequestContext, expect, Locator, Page } from "@playwright/test";
import { removeCurrencySymbol, rndString } from "@core/utils/string";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import type {
  ActionForProduct,
  BulkUpdateValue,
  ClipartFolder,
  CloneInfo,
  ConditionInfo,
  CustomizeGroup,
  CustomOptionProductInfo,
  DescriptionInsert,
  ExportProductInfo,
  FilterCondition,
  GetProductAPIResponse,
  Layer,
  MappingInfo,
  OfferData,
  paramDeleteProduct,
  ProductData,
  ProductFeed,
  ProductValue,
  ProductVariant,
  Search,
  SizeChartInfo,
  VariantCombo,
  Variants,
} from "@types";
import appRoot from "app-root-path";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { waitForImageLoaded } from "@utils/theme";
import { readFileCSV } from "@helper/file";
import { pressControl } from "@core/utils/keyboard";
import { AccessTokenHeaderName } from "@core/constant";

/**
 * Class for products list, product detail, product feed page
 */
export class ProductPage extends DashboardPage {
  xpathProductTableHeader = "//th[normalize-space()= 'PRODUCT']";
  xpathNoProduct = "//p[normalize-space()='Could not find any products matching']";
  xpathProductTitleTxt = "//h2[text()='Title']/following-sibling::div/input";
  xpathTitleLength = "//div[h2[text()='Title']]//small";
  xpathProductTypeTxt = "//input[contains(@placeholder,'Product type')]";
  xpathVendorTxt = "(//div[descendant::label[text()='Vendor']]/following-sibling::div)[1]//input";
  xpathInventoryPolicySlt = "//div[@class='s-form-item'][descendant::*[normalize-space()='Inventory policy']]//select";
  xpathWeightTxt = "(//*[descendant-or-self::*[normalize-space(text())='Weight']]/following-sibling::*//input)[1]";
  xpathMetaDescriptionTxt = "//div[child::label[text()='Meta description']]//following-sibling::div//textarea";
  xpathImportFile = "//input[@type='file' and @accept='.zip, .csv']";
  xpathAddMedia = "//label[@class='s-upload s-control']//a[normalize-space()='Add media']";
  xpathAddMediaFromUrl = "//a[normalize-space()='Add media from URL']";
  xpathSaveChangedBtn = "//button[normalize-space()='Save changes']";
  xpathListPersonalization = "//div[@role='tablist']";
  xpathOverlay = "//div[contains(@class,'overlay')]";
  xpathIconView = `(${this.xpathOverlay})//i[1]`;
  xpathIconAlt = `(${this.xpathOverlay})//i[2]`;
  xpathIconDelete = `(${this.xpathOverlay})//i[3]`;
  xpathPreviewModal = "//div[@class='s-modal-header']/p[@class='title']";
  xpathAltModal = "//div[@class='s-modal-header']/h4[@class='s-modal-title']";
  xpathGoogleTitlePreview = "//span[@class='google__title']";
  xpathGoogleDescriptionPreview = "//div[@class='google__description']";
  xpathDescriptionFrame = "(//iframe[contains(@id,'tiny-vue')])[1]";
  descriptionFrame = this.page.frameLocator(this.xpathDescriptionFrame);
  descriptionBody = this.descriptionFrame.locator("body#tinymce");
  xpathLinkInDescription = "//body[@id='tinymce']//a";
  xpathMediaInDescription = "//body[@id='tinymce']//span";
  xpathProductImageList =
    "//div[@id='variant-select-image-modal']//div[not(contains(@class, 'selected')) and contains(@class,'img')]/div[last()]";
  xpathViewOnlineIcon = "//span[@data-label='View on Online Store']";
  xpathFirstProduct = "//div[@class='product-name']";
  xpathBtnHideProduct = "//span[@data-label='It will allow you to hide the product on your store without deleting it']";
  xpathIconExpand = "//div[contains(@class,'expand-action__container')]//span";
  xpathBulkEditorTitle = "//h1[normalize-space()='Bulk editor']";
  xpathTableProduct = "//table[@id='all-products']";
  xpathBtnNextPage = "//a[@class='s-pagination-next']";
  xpathPresentationBulkEditor = "//div[contains(@class,'ag-body-viewport')]";
  xpathVerifySnapshotPaging = "//ul[@class='s-pagination-list']";
  xpathButtonDiscard = "//span[normalize-space()='Discard']";
  xpathButtonSaveChanges = "//span[normalize-space()='Save changes']";
  xpathTitleProductDetail = "(//div[@class='add-product-page']//h1 | //h1)";
  xpathTitleProductOnSF = "//section[@data-id='product']//h1";
  xpathProductDetailInfo = "//h3[normalize-space()='Organization']/parent::div[contains(@class,'title-description')]";
  xpathBtnAddToCardOnSF = "//button[normalize-space()='Add to cart']";

  xpathTitleProduct = "//h2[normalize-space()='Products']";
  xpathTitleCampaign = "//h2[normalize-space()='Campaigns']";
  xpathGetTitleProduct = "(//div[@class='product-name']//span)[1]";
  xpathImagePreview = "//h3[normalize-space()='Preview Images']//ancestor::div[@class='m-t-md preview-image']";
  xpathImagePrint = "//h3[normalize-space()='Print Files']//ancestor::div[@class='m-t-md preview-image']";
  xpathSelectAllProduct = "(//span[@data-label='Select all products' or @data-label='Select all campaigns']//span)[1]";
  xpathBtnAllProduct = "//button[@class='s-button s-ml16 is-text']";
  xpathTextStatus = "(//span[@class='s-tag is-primary text-capitalize status-tag is-success'])";

  xpathMoreOptions = "//div[normalize-space()='More options']";
  xpathResultMapped = "//div[@class='spds-check-mapping-status']";
  xpathTitleToBeFulfilled = "//h5[normalize-space()='To be fulfilled with']";
  xpathLoadingFulfillmentSetup = "(//div[@class='s-detail-loading__body-section'])[1]";
  xpathFolderPictureChoice =
    "//div[@class='product-property__field']//div[@class='base-picture' or contains(@class,'base-select flex')]";
  xpathGroupPictureChoice = "//div[contains(@class,'product-property product-custom-option')]";
  xpathMedia = "//div[@class='media__container']//img";
  xpathListMedia = "//div[@class='wrapper']";
  xpathFile = "//input[@type='file']";
  xpathProductVariantDetail =
    "//div[@class='add-product-page']//div[contains(@class,'variant-section')] | //div[contains(@class,'variant-section')]";
  xpathMediaContainerVariant = "//span[@class='image__wrapper d-flex align-item-center justify-content-center']";

  xpathPreviewSizeChartMessage = "//div[@class='s-alert-content-wrap']";
  xpathPreviewSizeChartModal = "//div[@class='s-modal is-active']";
  xpathVariantOnProductDetail = "//h3[normalize-space()='Variant options']";
  xpathSectionImageInDetail = "//div[contains(@class, 'section-image')]";
  xpathBlockPrice = "//h3[normalize-space()='Pricing']";
  xpathPopupActionAvailable = "//div[@class='s-modal-card s-animation-content']";
  xpathTableVariantInProductDetail = "//div[@class='ui-card__section']//table[@id='all-variants']";
  xpathVendorInProductDetail = "//label[normalize-space()='Vendor']//ancestor::div[@class='s-form-item']";
  xpathTagsInProductDetail =
    "//h2[normalize-space()='Tags']//ancestor::div[@class='s-flex s-flex--wrap']//following-sibling::div[contains(@class,'tag-manager')]";
  xpathCustomOptionInProductDetail = "//div[@class='s-collapse-item__content']";
  xpathClipartEditor = "//div[@class='s-modal-wrapper']//div[@class='s-modal-body']";
  xpathDisabledInput = "//div[contains(@class,'is-disable')]//input";
  xpathOptionValues = "(//input[@placeholder='Separate options with comma'])[last()]";
  xpathVariantInCampaignDetail = "//div[@class='ui-card__section']//div[@class='variant-selector']";
  xpathCollectionInProductDetail = "//label[normalize-space()='Collections']//parent::div//following-sibling::div";
  xpathListProductCollectionDetail =
    "//h4[normalize-space()='Products']//ancestor::div[contains(@class,'section-overview')]";
  xpathUploadArtwork = "//div[@class='spds-upload-artwork']";
  xpathSelectBaseProduct = "//div[@class='col-md-12 spds-select-product']";
  xpathPreviewArtwork = "//div[contains(@class,'sb-popup__container sb-absolute')]";
  xpathButtonClosePopupPreviewImage = "//div[contains(@class,'sb-popup__container sb-absolute')]//button";
  xpathBulkEditorpage = "//div[@class='product-bulk-edit-page']";
  xpathPricingOnProductDetail = "//h3[normalize-space()='Pricing']//parent::div";
  xpathSalePricing = "(//div[contains(@class,'product__price')])[1]";
  xpathLoadImageThumnail = "(//tbody//div[@class='thumb-loading']//img[@class='sbase-spinner'])[1]";
  xpathImageClipart = "//div[contains(@class,'image-in-table align-item-center')]//img";
  xpathDesignTab = "//div[@class='product-tabs']//p[normalize-space()='Design']";
  xpathDesDesignTab = "//div[@class='product-info']//div[contains(@class,'title-description')]//p[1]";
  xpathImportProductModalContent = "//div[@id='import-product-modal']//div[contains(@class,'s-modal-content')]";
  xpathImportProductModal = "//div[@id='import-product-modal']";
  xpathPopupEditClipart = "//table[contains(@class,'custom-table')]";
  xpathVideoUrlInMedia = '//div[@class="media__container is-video"]/iframe';
  xpathFieldClipartFolder = "//input[@id='pc-clipart-folder-input']";
  xpathBulkActions = "(//div[@class='order-layout__item']//div[@class='card__section'])[4]";
  xpathTooltipClipart =
    "//div[child::label[normalize-space () = 'Cliparts']]//span[contains(@class,'is-small s-popover__reference')]";
  xpathTooltipHover = "//div[@class = 's-pre-line']";
  xpathLastProductImage = "(//div[@class='media__container']/img)[last()]";
  xpathOrganization = "//h3[normalize-space()='Organization']//parent::div[contains(@class,'title-description')]//form";
  xpathOnlineStoreProductDetail =
    "//h4[normalize-space()='Online store']//parent::div[contains(@class,'title-description')]";
  xpathImageUploadEditor = "//div[@id='editor']//canvas";
  xpathCustomizeGroupProductDetail = "//div[contains(@class, 'custom-option-listing')]";

  xpathToastCreatFeedSuccess = "//div[text()[normalize-space()='Product feed was created successfully!']]";
  xpathLabelProductFeedURL = "//strong[contains(text(), 'Product feed URL')]";
  xpathStatusProductFeedURLDetail = `(${this.xpathLabelProductFeedURL}//parent::div)//following-sibling::div//span[contains(@class,'s-tag')]`;
  xpathUploadImageLoad = "//div[contains(@class,'upload-image__container')]//div[contains(@class,'uploading')]";
  xpathArchiveVariantAlert =
    "//div[contains(.,'Some variants cannot be fulfilled and have been hidden from your store')]";
  xpathHeaderProductCatagory = "//div[@class='product-catagory']";
  btnAddQttDiscounts =
    "//div[contains(@class, 'quantity-offer usell-in-product-admin')]//button[normalize-space() ='Add discounts']//span";
  xpathToastCreateOfferSuccess = "//div[text()[normalize-space()='Offer was created successfully']]";
  editQttDiscounts = "//button[normalize-space()='Edit discounts']//span";
  switchQttDiscounts = "//td[@class='offer-status']//span[@class='s-check']";
  statusQttDiscounts = "//td[@class='offer-status']//input";
  xpathToastActiveOfferSuccess = "//div[text()[normalize-space()='Offer was activated successfully']]";
  xpathToastDeactiveOfferSuccess = "//div[text()[normalize-space()='Offer was deactivated successfully']]";
  statusOfferInApp = "//td[@class='offer-status pointer']";
  offerNameInPopup = "//td[@class='offer-name']//div";
  offerQttName = '//input[@placeholder="Choose an offer\'s name"]';
  buttonSaveChanges = "//button//span[normalize-space()='Save changes']";
  xpathToastUpdateSuccess = "//div[text()[normalize-space()='Offer was updated successfully']]";
  offerQttMsg = "//div[contains(@class,'input-offer-message')]//input";
  msgOfferDashboard = "//input[@id='input-offer-message']";
  xpathProductVariantSelector = "//div[@class='s-flex s-flex--align-center product__variant__group']";
  xpathProductGroupOption = "//div[@class='variant-selector']";
  xapthBtnAlternativeLinks = "//button[@type='button']/following::span[contains(text(),'Provide alternative links')]";
  xpathImageInPopup = "(//i[parent::div[contains(@class,'img-wrap ')]])[1]";
  xpathLinkActive = "(//a[contains(@class,'active') and parent::li])[2]";
  xpathInputFieldCollection = "//input[@placeholder='Search for collections']";
  xpathTooltipInVariantDetail = `//span[@data-label="You can edit the option name in the 'Variant Options' section of the product details"]`;
  editWebsiteSEOBtn = this.page.getByRole("button", { name: "Edit website SEO" });
  pageTitle = this.genLoc(".s-form-item").filter({ hasText: "Page title" });
  metaDescription = this.genLoc(".s-form-item").filter({ hasText: "Meta description" });
  urlAndHandle = this.genLoc(".s-form-item").filter({ hasText: "URL and handle" });
  urlAndHandleTextBox = this.urlAndHandle.getByRole("textbox");
  createAUrlRedirectCheckbox = this.genLoc(".search-engine").locator("label.s-checkbox");
  xpathProcessBar = "//div[@class='s-progress-bar']";
  xpathBoxReview = `//div[child::div[child::h3[normalize-space()='Reviews']]]`;
  xpathAlertInProductDetail = "//div[contains(@class,'alert is-red')]/descendant::ul";
  xpathTaskBar = "//div[contains(@class,'editor__toolbar')]";
  xpathTemplateImage = "//div[@class='border-editor']//div";
  xpathViewProduct = `//div[@class='action-bar__item']/a`;
  xpathPartTextOverflow =
    "//label[contains(text(), 'Text overflow')]//ancestor::div[contains(@class, 'text-form-data-custom')]";
  editDescriptionForm = `//div[@class="base-product-description-editor"]`;
  successToast = `//div[contains(text(),'uccessfully')]`;
  xpathSearchProduct = "[placeholder='Search products']";
  finishedLoading = '//div[@class="s-detail-loading container" and @style="display: none;"]';

  xpathProduct = {
    product: {
      productTitle: productName => `(//*[normalize-space()="${productName}"])[1]`,
    },
    subMenu: subMenu => `//span[text()[normalize-space()="${subMenu}"]]`,
    getOptionButtonByPOD: name => `//*[@data-label="${name}"]/ancestor::div[3]//div[@class="s-dropdown-trigger"]`,
    updateDescriptionPOD: name =>
      `//*[@data-label="${name}"]/ancestor::div[3]//span[@class="s-dropdown-item" and contains(text(), 'Update description')]`,
  };
  productTags = this.genLoc("[data-label].tag-list-item-tooltip");
  priceProductDetail = this.genLoc("[id='price']");
  variantItems = this.genLoc(this.xpathVariantInCampaignDetail)
    .locator(".variant-selector-list")
    .getByRole("listitem")
    .and(this.genLoc("[class*=selector-link]"));
  editVariantBtn = this.page
    .getByRole("link")
    .filter({ has: this.genLoc("[data-label=Edit]") })
    .getByRole("button");
  variantTag = this.genLoc(".s-form").filter({ hasText: "Variant Tag" }).getByRole("textbox");
  variantTitle = this.genLoc(".variant-el");
  chooseFileImportProd = ".s-upload input";
  customOptionList = this.genLoc("[class$=custom-option-listing]");
  customOptionItems = this.customOptionList.getByRole("button");
  purchaseOutOfStockCheckbox = this.genLoc("label").filter({
    has: this.page.getByRole("checkbox", { name: "Allow customers to purchase this product when it's out of stock" }),
  });
  fbAccessToken = this.genLoc(".s-form-item").filter({ hasText: "Access Token" }).getByRole("textbox");
  fbPixelId = this.genLoc(".s-form-item").filter({ hasText: "Pixel ID" }).getByRole("textbox");
  customLayouts = this.genLoc(".layout-wrap");
  layoutName = this.customLayouts.getByRole("paragraph");
  productImgs = this.genLoc(".section-image .img-responsive");
  variantsRow = this.genLoc("tbody")
    .getByRole("row")
    .filter({ hasNot: this.genLoc("[class=group-title]") });
  variantImg = this.page.getByRole("cell").nth(1).getByRole("img");
  columnPrice = this.page.getByRole("cell").nth(5);
  pageDesign = this.page
    .locator(".title-description")
    .filter({ has: this.page.getByRole("heading", { name: "Page design" }) });
  appliedPageDesign = this.pageDesign.locator("[class='s-tag']");
  importModal = this.genLoc("#modal-import");
  importRows = this.importModal.locator(".s-dropdown-item");
  searchEngine = this.genLoc(".card.search-engine");

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async toastWithText(text: string) {
    return this.genLoc(`//div[contains(@class, "s-toast") and normalize-space()="${text}"]`);
  }

  getXpathDragDropGroup(groupName: string) {
    return `//div[contains(@class,'s-form-item__content') and descendant::span[normalize-space()='${groupName}']]//i[contains(@class,'mdi-drag-vertical')]`;
  }

  xpathToastExportSuccess(number: number) {
    return `//div[@class='s-notices is-bottom'][normalize-space()='Exported ${number} products']`;
  }

  xpathInputFollowId(id: string): string {
    return `//input[@id='${id}']`;
  }

  xpathProductInShippingFee(productName: string) {
    return `//span[text()='${productName}']//ancestor::tr`;
  }

  xpathVariantOptionValue(variantOption: string, index: number) {
    return `(//*[contains(text(),'${variantOption}')]/following-sibling::div/span)[${index}]`;
  }

  //xpath drop-down list convert Shoe size
  xpathShoeSizeDropDown(label: string): string {
    return `//div[contains(text(),"${label}")]/parent::div/following-sibling::div//select//option`;
  }

  /**
   * Xpath block in General tab
   * @param title : title block
   * @returns
   */
  getXpathBlockWithTitle(title: string): string {
    return `//*[normalize-space()='${title}']//parent::div[contains(@class,'title-description')]`;
  }

  /**
   * Xpath total image
   * @param numberImage : number
   * @returns
   */
  getXpathTotalProductImage(numberImage: number): string {
    return `//h3[contains(@class,'heading-section') and normalize-space()='Media (${numberImage} / 500)']`;
  }

  /**
   * Xpath block default layoutm custom layout
   * @param layoutName : default layout or custom layout
   * @returns
   */
  getXpathBlockLayout(layoutName: string): string {
    return `//p[contains(text(),'${layoutName}')]//parent::div//figure`;
  }

  /**
   * Xpath status layout: live or null
   * @param layoutName
   * @returns
   */
  getXpathStatusLayout(layoutName: string): string {
    return `(//p[contains(text(),'${layoutName}')]//parent::div//span[normalize-space()='Live'])[last()]`;
  }

  xpathPriceInProductDetail(price: string, i = 1): string {
    return `(//td[normalize-space()='${price}'])[${i}]`;
  }

  xpathIconEditVariant(variantname: string): string {
    return `//span[contains(text(),'${variantname}')]//ancestor::tr//following-sibling::tr//i[contains(@class,'pencil')]`;
  }

  xpathImageVariant(variantname: string): string {
    return `//span[contains(text(),'${variantname}')]//ancestor::tr//following-sibling::tr//img[parent::span]`;
  }

  getXpathImageInMedia(index = "1"): string {
    return `(//img[@class="img-responsive"])[${index}]`;
  }

  /**
   * Xpath checkbox variant on Fulfillment Setup screen
   * @param variant : variant name of product
   * @returns
   */
  xpathCheckboxVariant(variant: string): string {
    return `//span[normalize-space()='${variant}']//preceding-sibling::span`;
  }

  /**
   * Xpath textbox variant on Block Bulk update variant
   * @param variant : variant value
   * @returns
   */
  locatorVariantOption(variant: string, index = 1): Locator {
    return this.page.locator(`(//input[@placeholder='${variant}'])[${index}]`);
  }

  /**
   * Xpath message error when upload artwork invalid on Mapping printhub
   * @param message : content message
   * @returns
   */
  xpathMessage(message: string): string {
    return `//div[normalize-space()='${message}']`;
  }

  /**
   * Xpath artwork uploaded on Mapping printhub
   * @param sideName : side name ( Front or Back)
   * @returns
   */
  xpathArtworkUploaded(sideName: string): string {
    return `//h5[normalize-space()='${sideName}']//parent::div//img`;
  }

  /**
   * Xpath process bar when upload artwork on Mapping printhub
   * @param sideName : side name ( Front or Back)
   * @returns
   */
  xpathProcessBarUploadArtwork(sideName: string): string {
    return `//h5[normalize-space()='${sideName}']//parent::div//div[contains(@class,'artwork-progress-bar has-preview')]`;
  }

  /**
   * Xpath status mapped for product
   * @param appName : name of app
   * @returns
   */
  xpathStatusMappedProduct(appName: string): string {
    return `//p[normalize-space()='${appName}']//parent::div//span[contains(@class , 's-tag')]`;
  }

  xpathSelectProduct(productName: string, index = 1): string {
    return `(//tr[descendant::span[normalize-space()='${productName}']]//span[contains(@class,'s-check')])[${index}]`;
  }

  xpathVariantItem(index: number): string {
    return `(//div[contains(@class,'s-flex')][4]//div[@class='s-form-item__content']//div[@class='s-input']//input)[${index}]`;
  }

  /**
   * Xpath button Preview Artwork on screen Mapping product
   * @param index : number of button (preview image, delete image)
   * @returns
   */
  xpathBtnWithArtwork(index = 1): string {
    return `(//div[@class='sb-flex']/span/button)[${index}]`;
  }

  /**
   * Xpath button Preview Artwork on screen Mapping product
   * @param index : number of button (preview image, delete image)
   * @returns
   */
  xpathFocusBtnOnUploadArtwork(sideName: string): string {
    return `//h5[normalize-space()='${sideName}']//parent::div//div[contains(@class,'sb-flex sb-h-100 sb-flex-justify-end')]`;
  }

  /**
   * Xpath status unavailable of product on list product
   * @param productName : name of product
   * @param statusProduct : status of product
   * @returns
   */
  xpathStatusOfProduct(productName: string, statusProduct: string): string {
    return `//div[normalize-space()='${productName}']//ancestor::div[@class='product-name']//following-sibling::div[normalize-space()='${statusProduct}']`;
  }

  /**
   * Xpath feed name at Product Feeds page
   * @param productFeed is the feed title
   * @returns
   */
  getXpathFeedName(productFeed: string): string {
    return `//tr//child::span[normalize-space()='${productFeed}']//parent::a`;
  }

  /**
   * Xpath of the line product feed with label
   * @param lable is the feed title
   * @returns
   */
  getXpathProductFeed(lable: string): string {
    return `//tr[descendant::span[normalize-space()='${lable}']]`;
  }

  /**
   * get xpath SKU in Dashboard
   * @param SKU
   */
  getXpathSKUInDashboard(SKU: string): string {
    return `//table[@id='all-variants']//td[@title='${SKU}']`;
  }

  getXpathItemCustomOption(customOptionName: string) {
    return `//div[contains(@class,'custom-option__item') and descendant::*[normalize-space()='${customOptionName}']]`;
  }

  xpathDragAndDropItemCustomOption(customOptionName: string) {
    return `${this.getXpathItemCustomOption(customOptionName)}//i[contains(@class,'mdi-drag-vertical')]`;
  }

  /**
   * Xpath textbox in create combo popup
   * @param index
   * @returns
   */
  xpathTextboxInCreateCombo(rowIndex = 1, columnIndex = 1): string {
    return `((//td[@class='combo__checkbox-select'])[${rowIndex}]/following::input)[${columnIndex}]`;
  }

  /**
   * Xpath icon Drag of layer in editor product
   * @param groupName : name of layer
   * @returns
   */
  getXpathGroupName(groupName: string): string {
    return `//span[normalize-space()='${groupName}']`;
  }

  /**
   * Xpath layer name at the list layer
   */
  xpathLayerNameAtListLayer(layerName: string): string {
    return `//div[contains(@class, 'layer-name')]//span[contains(@class, 'text-bold') and contains(text(), '${layerName}')]`;
  }

  /**
   * Xpath effect expand
   * @param effectType
   * @returns
   */
  xpathEffectExpand(effectType: "Style" | "Shape"): string {
    return `//span[@class='label__effect' and contains(text(), '${effectType}')]//ancestor::div[contains(@class, 'collapse-item is-active')]`;
  }

  /**
   * Go to product list page
   */
  async goToProductList() {
    await this.navigateToMenu("Products");
    await this.page.waitForSelector(this.xpathProductTableHeader);
  }

  /**
   * check product exist in list product shopbase
   * @param productName
   */
  async isNotVisibleProductSb(productName: string) {
    await this.goToProductList();
    await this.searchProdByName(productName);
    if (await this.genLoc("//p[contains(text(),'Could not find any products matching')]").isVisible()) {
      return true;
    }
    return false;
  }

  /**
   * Search product by name
   * @param productName is the name of the product
   */
  async searchProduct(productName: string, placeholder = "Search products") {
    //search product
    if (placeholder === "Search products") {
      await this.page.waitForSelector(this.xpathProductTableHeader);
    }
    await this.page.waitForSelector(`[placeholder="${placeholder}"]`);
    await this.page.getByPlaceholder(placeholder).click();
    await this.page.getByPlaceholder(placeholder).fill(productName);
    await this.page.getByPlaceholder(placeholder).press("Enter");
    await this.page.waitForLoadState("networkidle");
    await this.waitForElementVisibleThenInvisible(this.xpathTableLoad);
    await this.page.waitForSelector(
      `//div[@class="ui-layout__item"]//span[@class='s-tag']//div[contains(text(), "Title contains: ${productName}")]`,
    );
  }

  //open product detail page
  async chooseProduct(product: string, platform = "shopbase") {
    await this.page.waitForSelector(`(//*[normalize-space()="${product}"])[1]`);
    await this.page.locator(`(//*[normalize-space()="${product}"])[1]`).hover();
    if (
      platform === "shopbase" &&
      (await this.page.locator("(//span[@data-label='View on Online Store'])[1]").isVisible())
    ) {
      await this.page.evaluate(() => {
        document.querySelector("span[data-label='View on Online Store']").remove();
      });
    }
    await this.page.click(`(//*[normalize-space()="${product}"])[1]`);
    await this.page.waitForLoadState("networkidle", { timeout: 60 * 1000 });
  }

  //open product feed list page
  async goToProductFeedList() {
    await this.page.goto(`https://${this.domain}/admin/product-feeds/v2`);
    await this.page.waitForLoadState("networkidle");
  }

  //go to import list product
  async goToImportListProducts(productId: number) {
    await this.page.goto(`https://${this.domain}/admin/plusbase/import-products?product_ids=${productId}`);
    await this.page.waitForLoadState("load");
  }

  //go to edit product page
  async goToEditProductPage(productId: number) {
    await this.page.goto(`https://${this.domain}/admin/products/${productId}`);
    await this.page.waitForLoadState("load");
  }

  /**
   * open popup feed
   */
  async openPopupFeed() {
    await this.page.locator("//span[normalize-space()='Add product feed']//parent::button").click();
  }

  //open product feed detail
  async goToProductFeedDetail(productFeed: string) {
    await this.page.waitForSelector(`${this.getXpathFeedName(productFeed)}`);
    const urlFeedDetail = await this.page.locator(this.getXpathFeedName(productFeed)).getAttribute("href");
    await this.page.goto(`https://${this.domain}${urlFeedDetail}`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Add new product feed on product feed list
   * Use 'collectionStatus' = true and 'collectionName' for case a store with multi feeds on a gmc
   * @param productFeed is an object that contains: feed, feed_name, radio_btn, country
   */
  async addProductFeed(productFeed: ProductFeed, collectionStatus?: boolean, collectionName?: string) {
    await this.page.click("//button[child::span[normalize-space()='Add product feed']]");
    await this.page.click(
      `//span[@class ='s-check']//following-sibling::span//h5[normalize-space()='${productFeed.feed_name}']`,
    );
    await this.page.click("//span[contains(text(),'Confirm')]");
    await this.genLoc("//div[child::label[contains(text(),'Feed name')]]//following-sibling::div//input").fill(
      productFeed.feed_title,
    );
    if (collectionStatus) {
      await this.clickRadioButtonWithLabel("Products from selected collections");
      await this.genLoc("//input[@placeholder[normalize-space()='Search for collections']]").click();
      await this.genLoc("//input[@placeholder[normalize-space()='Search for collections']]").type(collectionName);
      await this.genLoc("(//input[@placeholder[normalize-space()='Search for collections']])[2]").fill(collectionName);
      await this.genLoc(`//div[text()[normalize-space()='${collectionName}']]/parent::div//label`).click();
      await this.genLoc("//button//span[text()[normalize-space()='Add']]").click();
    }
    if (productFeed.feed_name === "Others") {
      const xpathRadiobtn = `//span[contains(text(), "${productFeed.radio_btn}")]`;
      await this.genLoc(xpathRadiobtn).click();
      if (productFeed.radio_btn === "Add the shipping setting to product feed" && productFeed.country != undefined) {
        await this.genLoc(`(${xpathRadiobtn}//parent::label)//following-sibling::div//select`).selectOption(
          productFeed.country,
        );
      }
    }
    await this.page.click("//span[contains(text(),'Save')]");
    await this.page.waitForSelector(this.xpathToastCreatFeedSuccess);
  }

  /**
   * Import product from csv file
   * I will use the file to import product
   * @param pathFile is the path of the file
   * @param xpath is the xpath of the upload button
   * @param override
   * @param skipWaitSuccess skip step wait import sucess
   */
  async importProduct(pathFile: string, xpath: string, override?: boolean, skipWaitSuccess?: boolean) {
    const xpathDuplicate = "//p[normalize-space()='Duplicate file import']";
    const xpathUpload = "//span[contains(text(),'Upload File')]";
    await this.page.click("//button[@type='button']//descendant::span[contains(text(),'Import')]");
    await this.page.waitForLoadState("networkidle");
    if (override) {
      await this.page.click(
        "//span[normalize-space()='Overwrite any existing products that have the same product handle.' or normalize-space()='Skip importing campaigns that there are existing campaigns with the same campaign handle.']",
      );
    }
    await this.chooseFileCSV(pathFile, xpath);
    await this.page.waitForLoadState("networkidle");
    await this.page.click(xpathUpload);
    await this.waitUntilElementInvisible(this.xpathIconLoading);
    const error = this.page.locator("//div[@class='s-media-content']");
    if ((await error.count()) === 0) {
      if ((await this.genLoc(xpathDuplicate).count()) > 0) {
        await this.page.click("//span[contains(text(),'Upload file anyway')]");
      }
      await this.page.click(xpathUpload);
      await this.page.locator(".s-modal-card-title").filter({ hasText: "Import in Progress" }).waitFor();
      await this.genLoc('button:has-text("OK")').click();
      await this.page
        .locator(".s-modal-card-title")
        .filter({ hasText: "Import in Progress" })
        .waitFor({ state: "hidden" });
      await this.page.reload();
      await this.page.locator("button#icon-process").waitFor({ timeout: 90_000 });
      // Option bỏ qua việc phải đợi product được import success
      if (!skipWaitSuccess) {
        for (let i = 0; i < 5; i++) {
          // Logic cũ, không chắc sao phải wait 3s, chắc do luồng import product chạy chậm
          await this.page.waitForTimeout(3000);
          const xpathImportSuccess = "//span[@class='wave-pause']";
          if (await this.page.locator(xpathImportSuccess).isVisible()) {
            return;
          }
          await this.page.reload();
          // Logic cũ, không chắc sao phải wait 10s, chắc do luồng import product chạy chậm
          await new Promise(t => setTimeout(t, 10000));
        }
        throw TypeError("Import failed");
      }
    }
  }

  /**
   * Edit product on product list
   * @param productName
   * @param productNameNew is the new product name
   * @param productPriceEdit
   * @param skuProduct
   */
  async editProduct(productName: string, productNameNew?: string, productPriceEdit?: string, skuProduct?: string) {
    await this.page.waitForLoadState("load");
    await this.searchProduct(productName);
    await this.chooseProduct(productName);
    if (productNameNew) {
      await this.genLoc("//div[child::*[normalize-space()='Title']]//input").fill(productNameNew);
    }
    if (productPriceEdit) {
      await this.genLoc("//div[child::*[normalize-space()='Price']]//input").fill(productPriceEdit);
    }
    if (skuProduct) {
      await this.genLoc("#sku").fill(skuProduct);
    }
    await this.genLoc("text=Save changes").click();
  }

  /**
   * Delete product feed on product feed list
   * @param feedName is the name of the feed
   */
  async deleteProductFeed(feedName: string) {
    await this.page.click(`//tr[descendant::span[normalize-space()='${feedName}']]//i[contains(@class,'mdi-delete')]`);
    await this.page.click("//button[descendant::span[contains(text(),'Delete')]]");
    await this.page.waitForLoadState("load");
  }

  /**
   * delete product feed by api
   * @param authRequest is the request to get the ID
   * @param feedName is the name of the feed
   * @param domain is domain of shop
   */
  async deleteFeedByAPI(authRequest: APIRequestContext, feedName: string, domain: string) {
    const feedId = await this.getFeedId(authRequest, feedName, domain);
    const response = await authRequest.delete(`https://${domain}/admin/feed/${feedId}.json`);
    if (response.ok()) {
      return true;
    } else {
      return Promise.reject("Error: Delete product feed api is fail");
    }
  }

  //delete product on product list
  async deleteProduct(password: string) {
    await this.page.waitForSelector("text=PRODUCT TYPE VENDOR >> span");
    if ((await this.checkLocatorVisible("//tr[@class='disabled-section']")) === false) {
      await this.genLoc("text=PRODUCT TYPE VENDOR >> span").nth(1).click();
      await this.genLoc("//table[@id='all-products']//button[normalize-space()='Action']").click();
      await this.genLoc("text=Delete selected products").click();
      await this.page.waitForSelector("//div[contains(@class,'s-animation-content')]");
      await this.genLoc("button:has-text('Delete')").click();
      await this.page.waitForTimeout(2000);
      if (await this.genLoc("//form[@class='s-form']//input").isVisible({ timeout: 2000 })) {
        await this.genLoc("//form[@class='s-form']//input").fill(password);
        await this.page.click("//div[@class='s-modal-footer']//button[descendant::span[contains(text(),'Confirm')]]");
      }
      await this.page.waitForSelector(
        "//tr[descendant::th[normalize-space()= 'PRODUCT']] | //h3[normalize-space()='Add your products']",
      );
    }
  }

  /**
   * Choose file CSV to upload
   * It will choose a fileName and xpath to the upload
   * @param fileName
   * @param xpath
   */
  async chooseFileCSV(fileName: string, xpath: string) {
    const [fileChooser] = await Promise.all([this.page.waitForEvent("filechooser"), await this.page.click(xpath)]);
    await fileChooser.setFiles(fileName);
  }

  /**
   * Get ID of feed from api response
   * @param authRequest is the request to get the ID
   * @param feedName is the name of the feed
   * @param domain is the domain of the shop
   */
  async getFeedId(authRequest: APIRequestContext, feedName: string, domain: string): Promise<number> {
    const response = await authRequest.get(`https://${domain}/admin/feed.json`);
    const jsonResponse = await response.json();
    return (jsonResponse.product_feeds || []).find(respElement => respElement.name == feedName).id;
  }

  /**
   * Get total refresh count from api response
   * @param authRequest is the request to get the ID
   * @param feedName is the name of the feed
   * @param domain is the domain of the shop
   */
  async getTotalRefresh(authRequest: APIRequestContext, feedName: string, domain: string) {
    const feedId = await this.getFeedId(authRequest, feedName, domain);
    const response = await authRequest.get(`https://${domain}/admin/feed/refresh/${feedId}.json`);
    let jsonResponse = await response.json();
    if (!jsonResponse) {
      jsonResponse = {
        total_refresh: 0,
        limit_configuration: {
          time_per_day: 0,
          offset_hour: 0,
        },
      };
    }
    return [
      jsonResponse.total_refresh,
      jsonResponse.limit_configuration.time_per_day,
      jsonResponse.limit_configuration.offset_hour,
    ];
    /* eslint-enable camelcase */
  }

  /**
   * Hide product on product list
   * if isChecked is true, click hide button, else click show button
   * @param isCheck
   */
  async hideProductOnProductDetail(isCheck: boolean) {
    if (isCheck) {
      await this.genLoc("//button[descendant::*[normalize-space()='Hide product']]").click();
    } else {
      await this.genLoc("//button[descendant::*[normalize-space()='Show product']]").click();
    }
    await this.clickOnBtnWithLabel("Save changes");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Edit description of product on product list
   * @param productDescription is the description of the product
   */
  async editDescriptionProduct(productDescription: string) {
    await this.page.waitForLoadState("load");
    await this.page
      .frameLocator("//iframe[contains(@id,'tiny-vue')]")
      .locator("//body[contains(@class,'content-body')]")
      .fill(productDescription);
    await this.genLoc("text=Save changes").click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Edit vendor of product on product list
   * @param productVendor is the vendor of the product
   * @param xpath is the xpath of the input
   */
  async editVendorProduct(productVendor: string, xpath: string) {
    await this.page.waitForLoadState("load");
    await this.genLoc(xpath).fill(productVendor);
    await this.genLoc("text=Save changes").click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Verify maxlength of product title on add product screen
   * @param length
   */
  async addProductMaxLength(length: string) {
    await this.clickOnBtnWithLabel("Add product");
    const randomMaxLength = parseInt(length) + 1;
    const randomTitle = rndString(randomMaxLength);
    await this.page.fill(this.xpathProductTitleTxt, randomTitle);
    await this.page.waitForSelector("//div[h2[text()='Title']]//small");
  }

  /**
   * Add product. It will open add product screen, input and fill the correct or not correct information.
   * There are 2 type of add product :
   * - Create product success
   * - Create product not success
   * @param productValue data from config contain product info (title, description, image, tags ...)
   */
  async addNewProductWithData(productValue: ProductValue) {
    await this.clickOnBtnWithLabel("Add product", 1);
    await this.page.waitForSelector(this.xpathDescriptionFrame, { timeout: 90000 });
    //input data into any field or all field on add product screen
    if (productValue.title) {
      await this.page.fill(this.xpathProductTitleTxt, productValue.title);
    }
    // await this.page.waitForTimeout(3 * 1000);
    if (productValue.description) {
      await this.page
        .frameLocator("//iframe[contains(@id,'tiny-vue')]")
        .locator("//body[@id='tinymce']")
        .fill(productValue.description);
    }
    if (productValue.image_name) {
      const listImage = productValue.image_name.split(",").map(item => item.trim());
      for (let i = 0; i < listImage.length; i++) {
        await this.page
          .locator("//a[normalize-space()='Add media']/following-sibling::input[@type='file']")
          .setInputFiles(appRoot + `/data/shopbase/${listImage[i]}`);
      }
    }
    if (productValue.image_URL) {
      const listImageUrl = productValue.image_URL.split(",").map(item => item.trim());
      for (let i = 0; i < listImageUrl.length; i++) {
        await this.page.click("//*[text()[normalize-space()='Add media from URL']]");
        await this.page.fill("//input[@id='url']", listImageUrl[i]);
        await this.clickOnBtnWithLabel("Add media");
        await this.waitForElementVisibleThenInvisible(
          "//div[@class='s-modal-footer']//button[contains(@class,'is-loading')]",
        );
      }
    }
    if (productValue.product_type) {
      await this.page.fill(this.xpathProductTypeTxt, productValue.product_type);
    }
    if (productValue.vendor) {
      await this.page.fill(this.xpathVendorTxt, productValue.vendor);
      await this.page.press(this.xpathVendorTxt, "Enter");
    }
    if (productValue.collections) {
      await this.page
        .locator(this.xpathInputFieldCollection)
        .pressSequentially(`${productValue.collections}`, { delay: 200 });
      await this.page.click(`//span[normalize-space()="${productValue.collections}" and @class]`);
    }
    if (productValue.tag) {
      await this.setProductTags(productValue.tag);
    }
    if (productValue.price) {
      await this.page.fill(this.xpathInputFollowId("price"), productValue.price);
    }
    if (productValue.compare_at_price) {
      await this.page.fill(this.xpathInputFollowId("compare_price"), productValue.compare_at_price);
      await this.page.press(this.xpathInputFollowId("compare_price"), "Enter");
    }
    if (productValue.cost_per_item) {
      await this.page.fill(this.xpathInputFollowId("cost_price"), productValue.cost_per_item);
      await this.page.press(this.xpathInputFollowId("cost_price"), "Enter");
    }
    if (productValue.sku) {
      await this.page.fill(this.xpathInputFollowId("sku"), productValue.sku);
      await this.page.press(this.xpathInputFollowId("sku"), "Enter");
    }
    if (productValue.bar_code) {
      await this.page.fill("//input[@id='barcode']", productValue.bar_code);
      await this.page.press("//input[@id='barcode']", "Enter");
    }
    if (productValue.inventory_policy) {
      await this.page.selectOption(this.xpathInventoryPolicySlt, { label: `${productValue.inventory_policy}` });
      await this.page.fill("//input[@id='quantity']", productValue.quantity);
      const regex = `//*[text()[normalize-space()='Allow customers to purchase this product when it's out of stock']]`;
      if (productValue.allowOverselling) {
        await this.page.setChecked(regex, productValue.allowOverselling);
      }
    }
    if (productValue.weight) {
      await this.page.fill(this.xpathWeightTxt, productValue.weight);
    }
    if (productValue.weightUnit) {
      await this.page.click(
        `//p[contains(., 'Weight')]//following::div[contains(@class, 'select')]
        //option[@value='${productValue.weightUnit}']`,
      );
    }
    if (productValue.variant_tag) {
      //nhap variant tag
      await this.page.fill('//input[@placeholder="track-id-xxxx"]', productValue.variant_tag);
    }
    if (productValue.option_name_1) {
      //click Add variant va nhap option name cung option value
      await this.page.click('//a[text()="Add variant"]');
      await this.page.fill('(//input[@id="option-name"])[1]', productValue.option_name_1);
      await this.page.type('(//input[@placeholder="Separate options with comma"])[1]', productValue.option_values_1);
    }
    if (productValue.option_name_2) {
      //click Add another option va nhap option name cung option value
      await this.page.click('//button[normalize-space()="Add another option"]');
      await this.page.fill('(//input[@id="option-name"])[2]', productValue.option_name_2);
      await this.page.type('(//input[@placeholder="Separate options with comma"])[2]', productValue.option_values_2);
    }
    if (productValue.option_name_3) {
      //click Add another option va nhap option name cung option value
      await this.page.click('//button[normalize-space()="Add another option"]');
      await this.page.fill('(//input[@id="option-name"])[3]', productValue.option_name_3);
      await this.page.type('(//input[@placeholder="Separate options with comma"])[3]', productValue.option_values_3);
    }
    if (productValue.page_title && productValue.meta_description) {
      await this.clickOnBtnWithLabel("Edit website SEO");
      await this.page.click('(//section[@class="card search-engine"]//input)[1]', { clickCount: 3 });
      await this.page.fill('(//section[@class="card search-engine"]//input)[1]', productValue.page_title);
      await this.page.click(this.xpathMetaDescriptionTxt, { clickCount: 3 });
      await this.page.fill(this.xpathMetaDescriptionTxt, productValue.meta_description);
      await this.page.fill('(//section[@class="card search-engine"]//input)[2]', productValue.page_title);
      // await this.inputFieldWithLabel("", "Page title", productValue.page_title, 1);
      // await this.page.fill(this.xpathMetaDescriptionTxt, productValue.meta_description);
    }
    if (productValue.product_availability_online_store === false) {
      await this.page.click(
        "//label[descendant::span[normalize-space() = 'Online store listing pages']]//span[@class='s-check']",
      );
    }
    // click save change after input data
    await this.page.click('//button[normalize-space()="Save changes"]', { delay: 2000 });
  }

  /**
   * Check message after create product fail or success
   * @param message input data message success
   * @param errMsg input data message error
   */
  async checkMsgAfterCreated({ message, errMsg }: { message?: string; errMsg?: string }) {
    if (message) {
      await this.page.waitForSelector(`//*[contains(text(),"${message}")]`);
    }
    if (errMsg) {
      try {
        await this.page.waitForSelector(`//*[contains(text(),"${errMsg}")]`);
      } catch (e) {
        await this.page.waitForSelector(`//*[contains(text(),'${errMsg}')]`);
      }
    }
  }

  // click back to product list screen
  async clickBackProductList() {
    await this.page.click(".add-product-page .breadcrumb a");
  }

  /**
   * Get ID of product from api response
   * @param authRequest is the request to get the ID
   * @param productName is the name of the product
   * @param domain is the domain of the shop
   * @accessToken?: is the access token of the shop
   */
  async getProductId(
    authRequest: APIRequestContext,
    productName: string,
    domain: string,
    accessToken?: string,
  ): Promise<number> {
    let options = {};
    if (accessToken) {
      options = {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      };
    }
    let response;
    const productUrl = `https://${domain}/admin/products.json?title=${productName}`;
    if (accessToken) {
      response = await this.page.request.get(productUrl, options);
    } else {
      response = await authRequest.get(productUrl);
    }

    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const indexProduct = jsonResponse.products.length - jsonResponse.products.length;
    return jsonResponse.products[indexProduct].id;
  }

  /**
   * Get list product using api response
   * After add product/import csv success, get list product info with data is inputted on dashboard screen
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @param productId is the Id of the product
   * @param productValue data from config contain product info (title, description, image, tags ...)
   * @accessToken?: is the access token of the shop
   */
  async getProductInfoDashboardByApi(
    authRequest: APIRequestContext,
    domain: string,
    productId: number,
    productValue: ProductValue,
    accessToken?: string,
  ) {
    let response;
    let productUrl = `https://${domain}/admin/products/${productId}.json`;
    if (accessToken) {
      productUrl = `https://${domain}/admin/products/${productId}.json?access_token=${accessToken}`;
      response = await this.page.request.get(productUrl);
    } else {
      response = await authRequest.get(productUrl);
    }
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const productInfoApi = this.cloneObject<ProductValue>(productValue, ["image_name"]);
    if (productInfoApi.description) {
      productInfoApi.description = jsonResponse.product.body_html;
    }
    if (productInfoApi.tag) {
      productInfoApi.tag = jsonResponse.product.tags;
    }
    if (productValue.bar_code) {
      productInfoApi.bar_code = jsonResponse.product.variants[0].barcode;
    }
    if (productInfoApi.product_type) {
      productInfoApi.product_type = jsonResponse.product.product_type;
    }
    if (productInfoApi.vendor) {
      productInfoApi.vendor = jsonResponse.product.vendor;
    }
    if (productInfoApi.price) {
      productInfoApi.price = jsonResponse.product.variants[0].price;
    }
    if (productInfoApi.compare_at_price) {
      productInfoApi.compare_at_price = jsonResponse.product.variants[0].compare_at_price;
    }
    if (productInfoApi.cost_per_item) {
      productInfoApi.cost_per_item = jsonResponse.product.variants[0].cost_per_item;
    }
    if (productInfoApi.sku) {
      productInfoApi.sku = jsonResponse.product.variants[0].sku;
    }
    if (productInfoApi.inventory_policy) {
      productInfoApi.inventory_policy = jsonResponse.product.variants[0].inventory_policy;
    }
    if (productInfoApi.quantity) {
      productInfoApi.quantity = jsonResponse.product.variants[0].inventory_quantity;
    }
    if (productInfoApi.weight) {
      productInfoApi.weight = jsonResponse.product.variants[0].weight;
    }
    if (productValue.number_image) {
      const listImage = jsonResponse.product.images;
      productInfoApi.number_image = listImage.map((value: { src: string }) => value.src).length;
    }
    const options = jsonResponse.product.options;
    for (let i = 0; i < options.length; i++) {
      const name = options[i].name;
      switch (name) {
        case name == "Size":
          if (productInfoApi.size) {
            productInfoApi.size = jsonResponse.product.options[i].values;
          }
          break;
        case name == "Color":
          if (productInfoApi.color) {
            productInfoApi.color = jsonResponse.product.options[i].values;
          }
          break;
        case name == "Style":
          if (productInfoApi.style) {
            productInfoApi.style = jsonResponse.product.options[i].values;
          }
          break;
      }
    }
    return productInfoApi;
  }

  // click view product on SF
  async clickViewProductOnSF() {
    await this.page.click("(//*[child::*[text()[normalize-space()='View']]])[1]");
    if (await this.page.locator('(//div[@class="storefront-search"]/following-sibling::span)[1]').isVisible()) {
      await this.page.click('(//div[@class="storefront-search"]/following-sibling::span)[1]');
    }
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Get handle of product using api
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @param productId is the Id of the product
   */
  async getProductHandlebyApi(authRequest: APIRequestContext, domain: string, productId: number, accessToken?: string) {
    let response;
    if (accessToken) {
      const productUrl = `https://${domain}/admin/products/${productId}.json?access_token=${accessToken}`;
      response = await this.page.request.get(productUrl);
    } else {
      response = await authRequest.get(`https://${domain}/admin/products/${productId}.json`);
    }
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.product.handle;
  }

  /**
   * Get infomation of product using dashboard api response
   * @param authRequest is the request to get the ID
   * @param productName  is name of product
   * @param domain is the domain of the shop
   * @param key is key of API
   */

  async getAnyProductInfoDashboardAPI(
    authRequest: APIRequestContext,
    productName: string,
    domain: string,
    key: string,
    checkHandle?: boolean,
    accessToken?: string,
  ): Promise<number> {
    if (accessToken && checkHandle == true) {
      const productUrl = `https://${domain}/admin/products.json?handle=${productName}&access_token=${accessToken}`;
      const response = await this.page.request.get(productUrl);
      expect(response.ok()).toBeTruthy();
      const jsonResponse = await response.json();
      return jsonResponse[key];
    } else {
      const response = await authRequest.get(`https://${domain}/admin/products.json?title=${productName}`);
      expect(response.ok()).toBeTruthy();
      const jsonResponse = await response.json();
      return jsonResponse[key];
    }
  }

  /**
   * get product info by api
   * @param authRequest
   * @param domain
   * @param productId
   * @param accessToken
   * @returns
   */
  async getProductInfoByIdAPI(authRequest: APIRequestContext, domain: string, productId: number, accessToken?: string) {
    let response;
    if (accessToken) {
      const productUrl = `https://${domain}/admin/products/${productId}.json?access_token=${accessToken}`;
      response = await this.page.request.get(productUrl);
    } else {
      response = await authRequest.get(`https://${domain}/admin/products/${productId}.json`);
    }
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.product;
  }

  /**
   * Get infomation of product using storefront api response
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @param key is key of API
   */
  async getAnyProductInfoStoreFrontAPI(
    authRequest: APIRequestContext,
    productHandle: string,
    domain: string,
    key: string,
  ): Promise<number> {
    const response = await authRequest.get(`https://${domain}/api/catalog/next/product.json?handle=${productHandle}`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse[key];
  }

  /**
   * Get list product using storefront api response
   * After add product/import csv success, get list product info from Store front api
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @param productHandle is the Id of the product
   * @param productValue data from config contain product info (title, description, image, tags ...)
   */
  async getProductInfoStoreFrontByApi(
    authRequest: APIRequestContext,
    domain: string,
    productHandle: string,
    productValue: ProductValue,
  ) {
    const response = await authRequest.get(`https://${domain}/api/catalog/next/product/${productHandle}.json`);
    expect(response.ok()).toBeTruthy();
    const jsonData = await response.json();
    const jsonResponse = jsonData.result;
    const productInfoApi = this.cloneObject<ProductValue>(productValue, [
      "title",
      "image_name",
      "inventory_policy",
      "cost_per_item",
    ]);

    if (productInfoApi.description) {
      productInfoApi.description = jsonResponse.description;
    }
    if (productInfoApi.tag) {
      productInfoApi.tag = jsonResponse.tags;
    }
    if (productInfoApi.bar_code) {
      productInfoApi.bar_code = jsonResponse.variants[0].barcode;
    }
    if (productInfoApi.product_type) {
      productInfoApi.product_type = jsonResponse.product_type;
    }
    if (productInfoApi.vendor) {
      productInfoApi.vendor = jsonResponse.vendor;
    }
    if (productInfoApi.price) {
      productInfoApi.price = jsonResponse.variants[0].price;
    }
    if (productInfoApi.compare_at_price) {
      productInfoApi.compare_at_price = jsonResponse.variants[0].compare_at_price;
    }
    if (productInfoApi.sku) {
      productInfoApi.sku = jsonResponse.variants[0].sku;
    }
    if (productInfoApi.quantity) {
      productInfoApi.quantity = jsonResponse.variants[0].quantity;
    }
    if (productInfoApi.weight) {
      productInfoApi.weight = jsonResponse.variants[0].weight;
    }
    if (productInfoApi.size) {
      productInfoApi.size = jsonResponse.product.options[0].values;
    }
    if (productInfoApi.color) {
      productInfoApi.color = jsonResponse.product.options[1].values;
    }
    if (productInfoApi.style) {
      productInfoApi.style = jsonResponse.product.options[2].values;
    }
    return productInfoApi;
  }

  /**
   * Go to search on SF screen, search product for keyword and wait for show result search
   * @param domain the domain of the shop
   * @param productTitle search product for title
   */
  async goToSearchProductOnSF(productTitle: string) {
    await this.goto("/search");
    (await this.page.waitForSelector('//input[@name="q"]')).waitForElementState("enabled");
    await this.page.waitForTimeout(5000);
    await this.page.fill(`//input[@placeholder = 'Enter keywords...']`, productTitle);
    await this.page.locator(`//input[@placeholder = 'Enter keywords...']`).press("Enter");
    await this.page.waitForSelector(
      `//div[contains(@class,'collection-product-wrap') and descendant::span[text()='${productTitle}']]`,
    );
  }

  /**
   * click icon progress bar in product list
   */
  async clickProgressBar(): Promise<void> {
    await this.page.waitForTimeout(3000);
    let index = 1;
    let isShowProgress = await this.page
      .locator("//button[@id='icon-process' or @id='icon-plusbase-process']")
      .isVisible();
    while (index < 5 && !isShowProgress) {
      await this.page.reload();
      isShowProgress = await this.page
        .locator("//button[@id='icon-process' or @id='icon-plusbase-process']")
        .isVisible();
      index++;
    }

    await this.page.click("//button[@id='icon-process' or @id='icon-plusbase-process']");
  }

  /**
   * click btn edit varriant in product detail
   */
  async clickBtnEditVariant() {
    await this.page.click("//span[@data-label='Edit']//button");
  }

  /**
   *
   * @returns get status import
   */
  async getStatus(fileName = "", index = 1): Promise<string> {
    await this.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
    let isShowProgressFileName = await this.page
      .locator(`(//span[normalize-space()='From the CSV file: ${fileName}'])[${index}]`)
      .isVisible();
    let retries = 0;
    while (retries < 5 && !isShowProgressFileName) {
      //turn off/ on lại Popup progress to load data file import
      await this.clickProgressBar();
      await this.page.waitForTimeout(2000);
      await this.clickProgressBar();
      await this.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
      isShowProgressFileName = await this.page
        .locator(`(//span[normalize-space()='From the CSV file: ${fileName}'])[${index}]`)
        .isVisible();
      retries++;
    }
    if (isShowProgressFileName) {
      return await this.getTextContent(
        `(//span[normalize-space()='From the CSV file: ${fileName}'])[${index}]/ancestor::span[@class='s-dropdown-item']//span//span`,
      );
    }
    await this.page.waitForSelector("(//span[contains(@class, 's-tag is-primary text-capitalize')])[1]", {
      timeout: 5000,
    });
    return await this.getTextContent("(//span[contains(@class, 's-tag is-primary text-capitalize')]/span)[1]");
  }

  /**
   *
   * @returns get message import/clone product in progress bar
   */
  async getProcess(fileName = "", index = 1): Promise<string> {
    if (fileName) {
      return await this.getTextContent(
        `(//span[normalize-space()='From the CSV file: ${fileName}'])[${index}]/ancestor::span[@class='s-dropdown-item']/div[last()]/div`,
      );
    }
    return await this.getTextContent("//span[@class='s-dropdown-item'][2]/div[last()]/div");
  }

  /**
   *
   * @param btn
   * @returns get status btn
   */
  async getStatusBtn(btn: string) {
    const xpathBtn = this.page.locator(`//button[@class='s-button is-default' and normalize-space()="${btn}"]`);
    return await xpathBtn.getAttribute("class");
  }

  /**
   *
   * @returns get label inventory in variant detail
   */
  async getLabelInventory(): Promise<string> {
    return await this.getTextContent(this.xpathInventoryPolicySlt);
  }

  /**
   * Edit tags of product on product list
   * @param productTag is the tags of the product
   */
  async editProductTag(productTag: string) {
    await this.genLoc("[placeholder='Vintage, cotton, summer']").fill(productTag);
    await this.genLoc("strong:has-text('Add')").click({ timeout: 5000 });
    await this.genLoc("text=Save changes").click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Search from product list and go to product detail
   * @param productName is the name of the product
   */
  async gotoProductDetail(productName: string) {
    await this.navigateToMenu("Products");
    await this.waitForElementVisibleThenInvisible(this.xpathTableLoad);
    await expect(this.page).not.toHaveURL(`https://${this.domain}/admin/products`);
    await this.waitForElementVisibleThenInvisible(this.xpathTableLoad);
    await this.searchProduct(productName);
    await this.page.waitForSelector(`(//*[normalize-space()='${productName}'])[1]`);
    await this.chooseProduct(productName);
    await this.waitForElementVisibleThenInvisible(this.xpathProductDetailLoading);
  }

  /**
   * Search from product list and go to product detail
   * @param productName is the name of the product
   */
  async gotoProductDetailPlb(productName: string) {
    await this.navigateToSubMenu("Dropship products", "All products");
    await this.searchProduct(productName);
    await this.chooseProduct(productName);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Plusbase POD product
   * Search from product list and go to product detail
   * @param productName is the name of the product
   */
  async gotoProductDetailPlbPod(productName: string) {
    await this.navigateToSubMenu("POD products", "All campaigns");
    await this.searchProduct(productName, "Search campaigns by name");
    await this.chooseProduct(productName, "plusbase");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Plusbase POD product
   * View plusbase POD product on storefront
   * @params productName product namer
   * @return Page storefront
   */
  async viewProductOnSf(): Promise<Page> {
    const [newTab] = await Promise.all([
      this.page.waitForEvent("popup"),
      await this.genLoc(`//a[contains(@class , 's-button is-outline is-small')]`).click(),
    ]);
    await newTab.waitForLoadState();
    await newTab.bringToFront();
    await newTab.goto(`${newTab.url()}`);
    await newTab.waitForLoadState("networkidle");
    return newTab;
  }

  /**
   * check product exist in list product plb
   * @param productName
   */
  async isVisibleProductPlb(productName: string) {
    await this.navigateToSubMenu("Dropship products", "All products");
    await this.searchProdByName(productName);
    if (await this.genLoc("//p[contains(text(),'Could not find any products matching')]").isVisible()) {
      return false;
    }

    return true;
  }

  /**
   * Delete image of product on product detail page
   * @param saveChange
   */
  async deleteImageProduct(saveChange = true) {
    await this.genLoc(".icon-big svg path").first().click();
    if (saveChange) {
      await this.genLoc("text=Save changes").click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * Create bulk update. Go to bulk update list then click create bulk update,
   * Input and fill the correct or not correct infomation into create bulk update screen.
   * @param bulkUpdateValue data from config contain bulk update info (field, action,conditon,...)
   */
  async createBulkUpdate(bulkUpdateValue: BulkUpdateValue) {
    // go to bulk update list screen
    await this.page.goto(`https://${this.domain}/admin/bulk-updates`);
    await this.page.waitForLoadState("load");

    // click create bulk update
    await this.page.click("//button[normalize-space()='Create an Update']");

    //input data filter product bulk update
    // Choose condition type
    await this.page.click(
      `//span[normalize-space()='${bulkUpdateValue.condition_type}']//preceding-sibling::span[@class='s-check']`,
    );

    // Choose condition field
    // click button Add condition
    for (let i = 0; i < bulkUpdateValue.conditions.length - 1; i++) {
      await this.clickOnBtnWithLabel("Add condition");
    }
    // fill condition
    for (let i = 0; i < bulkUpdateValue.conditions.length; i++) {
      const valueCondition = bulkUpdateValue.conditions[i].split(">").map(item => item.trim());
      if (valueCondition[0]) {
        await this.page.selectOption(
          "//section[descendant::h2[normalize-space()= 'Filter']]//div[@class='s-select s-flex--fill']//select",
          {
            label: valueCondition[0],
          },
        );
      }

      if (valueCondition[1]) {
        await this.page.selectOption(
          "//section[descendant::h2[normalize-space()= 'Filter']]//div[contains(@class,'condition-select')]//select",
          {
            label: valueCondition[1],
          },
        );
      }

      if (valueCondition[2]) {
        await this.page.fill(
          "//section[descendant::h2[normalize-space()= 'Filter']]//div//input[@type='text']",
          valueCondition[2],
        );
        if (valueCondition[0] === "Collection") {
          await this.page.click(
            `(//span[@class='s-dropdown-item is-hovered']//div[normalize-space()='${valueCondition[2]}'])[1]`,
          );
        }
      }
    }

    if (bulkUpdateValue.variants) {
      await this.page.click("//div[@class='card__section']//span[normalize-space()='Only update some variants']");
      if (bulkUpdateValue.variants.variants_match) {
        await this.page.click(
          `(//span[normalize-space()='${bulkUpdateValue.variants.variants_match}']//preceding-sibling::span[@class='s-check'])[2]`,
        );
      }
      for (let i = 0; i < bulkUpdateValue.variants.condition_variants.length - 1; i++) {
        await this.clickOnBtnWithLabel("Add condition");
      }
      for (let i = 0; i < bulkUpdateValue.variants.condition_variants.length; i++) {
        const valueConditionVariant = bulkUpdateValue.variants.condition_variants[i]
          .split(">")
          .map(item => item.trim());
        if (valueConditionVariant[0]) {
          await this.page.selectOption(
            "(//section[descendant::h2[normalize-space()= 'Filter']]//div[@class='s-select s-flex--fill']//select)[2]",
            {
              label: valueConditionVariant[0],
            },
          );
        }

        if (valueConditionVariant[1]) {
          await this.page.selectOption(
            "(//section[descendant::h2[normalize-space()= 'Filter']]//div[contains(@class,'condition-select')]//select)[2]",
            {
              label: valueConditionVariant[1],
            },
          );
        }

        if (valueConditionVariant[2]) {
          await this.page.fill(
            "(//section[descendant::h2[normalize-space()= 'Filter']]//div//input[@type='text'])[2]",
            valueConditionVariant[2],
          );
        }
      }
    }

    //input data action create bulk update
    // click button Add condition
    for (let i = 0; i < bulkUpdateValue.actions.length - 1; i++) {
      await this.clickOnBtnWithLabel("Add action");
    }
    // fill action
    for (let i = 0; i < bulkUpdateValue.actions.length; i++) {
      const valueAction = bulkUpdateValue.actions[i].split(">").map(item => item.trim());
      // Choose action name
      if (valueAction[0]) {
        if (valueAction[0].includes("_")) {
          await this.page.selectOption(
            `(//section[descendant::h2[normalize-space()= 'Action']]//div[contains(@class,'condition')]//select)[${
              i + 1
            }]`,
            {
              value: valueAction[0],
            },
          );
        } else {
          await this.page.selectOption(
            `(//section[descendant::h2[normalize-space()= 'Action']]//div[contains(@class,'condition')]//select)[${
              i + 1
            }]`,
            {
              label: valueAction[0],
            },
          );
        }

        //action1 bao gồm tất cả các action có step chung
        const actionList1 = [
          "Update product weight by percentage",
          "Change price to",
          "Increase price by amount",
          "Increase price by amount",
          "Decrease price by amount",
          "Increase price by percentage",
          "Decrease price by percentage",
          "Change compare-at-price to",
          "Increase compare-at-price by",
          "Decrease compare-at-price by",
          "Increase compare-at-price by percentage",
          "Decrease compare-at-price by percentage",
          "Update compare-at-price based on price",
        ];

        // action2 bao gồm tất cả các action có step chung
        const actionList2 = ["Add to collection", "Remove from collection", "Change theme template to"];

        // action3 bao gồm tất cả các action có step chung
        const actionList3 = [
          "Add text to product title",
          "Update product weight",
          "Add text to SKU",
          "Round/ Beautify price",
          "Round/Beautify compare-at-price",
          "Change inventory quantity to",
          "Show on channels",
          "Hide on channels",
        ];

        // action4 bao gồm tất cả các action có step chung
        const actionList4 = ["Add tags"];
        const actionList5 = ["Delete custom options"];
        const actionList6 = ["Change product description to", "Add text to product description"];
        const actionList7 = ["Remove tags"];
        const actionList8 = ["Add custom options"];
        const actionList9 = ["Replace custom options"];
        const actionList10 = ["Change variant's option value"];
        // input or select value tương ứng với các action

        if (actionList1.includes(valueAction[0])) {
          if (valueAction[1]) {
            await this.page.fill(
              "//div[normalize-space()='USD' or normalize-space()='%']//input[@type='text']",
              valueAction[1],
            );
          }
        } else if (actionList2.includes(valueAction[0])) {
          if (valueAction[1]) {
            await this.page.fill("//div[@class='s-input']//input[@type = 'text']", valueAction[1]);
            await this.page.click(`(//div[contains(@class, 'menu')]//span[normalize-space()='${valueAction[1]}'])[1]`);
          }
        } else if (actionList3.includes(valueAction[0])) {
          if (valueAction[1]) {
            await this.page.fill(
              "//section[descendant::h2[normalize-space()= 'Action']]//div[contains(@class, 's-input')]" +
                "//input[@type = 'text']",
              valueAction[1],
            );
          }
          if (valueAction[2]) {
            await this.page.selectOption(
              "//section[descendant::h2[normalize-space()= 'Action']]//div[@class= 's-select' " +
                "or @class= 's-select s-flex--fill']//select",
              { label: valueAction[2] },
            );
          }
        } else if (actionList4.includes(valueAction[0])) {
          if (valueAction[1]) {
            await this.page.fill(
              "//div[@class='s-input']//input[@placeholder= 'reviewed, packed, delivered' and @type='text']",
              valueAction[1],
            );
            await this.page.press(
              "//div[@class='s-input']//input[@placeholder= 'reviewed, packed, delivered' and @type='text']",
              "Enter",
            );
          }
        } else if (actionList5.includes(valueAction[0])) {
          if (valueAction[1]) {
            await this.page.selectOption(
              "//div[normalize-space()='Option label' or normalize-space()='Option name']//parent::div//select",
              {
                label: valueAction[1],
              },
            );
          }
          if (valueAction[2]) {
            await this.page.fill("//input[@placeholder='Option name']", valueAction[2]);
          }
        } else if (actionList6.includes(valueAction[0])) {
          await this.page
            .frameLocator(`(//iframe[contains(@id,'tiny-vue')])[${i + 1}]`)
            .locator(`//body[@id='tinymce']`)
            .fill(valueAction[1]);
          await this.page.waitForTimeout(2000);
          if (valueAction[2]) {
            await this.page.selectOption(
              "(//section[descendant::h2[normalize-space()= 'Action']]//div[@class= 's-select' " +
                `or @class= 's-select s-flex--fill']//select)[${i + 1}]`,
              { label: valueAction[2] },
            );
          }
        } else if (actionList7.includes(valueAction[0])) {
          if (valueAction[1]) {
            await this.page.selectOption(
              "((//p[contains(@class,'s-paragraph')]//parent::div[@class='card__section'])[2]//select)[2]",
              {
                label: valueAction[1],
              },
            );
          }
          if (valueAction[2]) {
            await this.page.fill("//input[@placeholder='Vintage, cotton, summer']", valueAction[2]);
          }
        } else if (actionList8.includes(valueAction[0])) {
          if (valueAction[1]) {
            await this.page.selectOption(
              "//option[normalize-space()='Before']//ancestor::div[@class='s-select']//select",
              {
                label: valueAction[1],
              },
            );
          }
          for (let i = 0; i < bulkUpdateValue.custom_option.length; i++) {
            await this.addNewCustomOptionWithData(bulkUpdateValue.custom_option[i]);
          }
        } else if (actionList9.includes(valueAction[0])) {
          if (valueAction[1]) {
            await this.page.fill(
              "//p[normalize-space()='From option']//parent::div//input[@type='text']",
              valueAction[1],
            );
          }
          for (let i = 0; i < bulkUpdateValue.custom_option.length; i++) {
            await this.addNewCustomOptionWithData(bulkUpdateValue.custom_option[i]);
          }
        } else if (actionList10.includes(valueAction[0])) {
          await this.page.fill(
            "//label[normalize-space()='Option name']//parent::div//following-sibling::div//input",
            valueAction[1],
          );
          await this.page.fill(
            "//label[normalize-space()='From value']//parent::div//following-sibling::div//input",
            valueAction[2],
          );
          await this.page.fill(
            "//label[normalize-space()='To value']//parent::div//following-sibling::div//input",
            valueAction[3],
          );
        } else {
          if (valueAction[1]) {
            await this.page.fill("(//div[@class='s-input']//input[@type = 'text'] )[1]", valueAction[1]);
          }
          if (valueAction[2]) {
            await this.page.fill("(//div[@class='s-input']//input[@type = 'text'] )[2]", valueAction[2]);
          }
          if (valueAction[3]) {
            await this.page.fill("(//div[@class='s-input']//input[@type = 'text'] )[3]", valueAction[3]);
          }
        }
      }
    }
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(3000);
    //Click on button Preview bulk update after input data
    await this.page.click("//button[normalize-space()='Preview Bulk Update']");
  }

  // thực hiện action start bulk update
  async startBulkUpdate() {
    await this.page.click("//button[normalize-space()='Start Bulk Update']");
    await this.page.click("//button[normalize-space()='Update']");
    await this.waitUntilElementVisible("//div[@class='page-bulk-updates']");
  }

  /**
   * get filter and action show bulk update preview screen
   * @param index input index = 1 thì lấy ra filter, index = 2 thì lấy ra action
   */
  async getInfoPreviewBulkUpdate(index: number) {
    return this.getTextContent(`(//li[@class="content-list__item"])[${index}]`);
  }

  //Get information bulk update on list
  async getInfoBulkUpdate() {
    const newObject = {
      filter_validate: "",
      update_for_validate: "",
      action_validate: "",
      number_of_update_validate: "",
    };
    newObject.filter_validate = await this.getTextContent("(//table[@class='table table-hover']//tr//td//p)[1]");
    newObject.action_validate = await this.getTextContent("(//table[@class='table table-hover']//tr//td)[5]");
    newObject.number_of_update_validate = await this.getTextContent("(//table[@class='table table-hover']//tr//td)[6]");
    newObject.update_for_validate = await this.getTextContent("(//table[@class='table table-hover']//tr//td//p)[2]");
    return newObject;
  }

  /**
   *
   * @param filterName : filter name of bulk update
   * @returns bulkUpdateInfo
   */
  async verifyBulkUpdateByFilterName(filterName: string) {
    const bulkUpdateInfo = {
      update_for_validate: "",
      action_validate: "",
      number_of_update_validate: "",
    };
    bulkUpdateInfo.update_for_validate = await this.getTextContent(
      `(//p[normalize-space()='${filterName}'])[1]//ancestor::td//following-sibling::td[1]`,
    );
    bulkUpdateInfo.action_validate = await this.getTextContent(
      `(//p[normalize-space()='${filterName}'])[1]//ancestor::td//following-sibling::td[2]`,
    );
    bulkUpdateInfo.number_of_update_validate = await this.getTextContent(
      `(//p[normalize-space()='${filterName}'])[1]//ancestor::td//following-sibling::td[3]`,
    );
    return bulkUpdateInfo;
  }

  async getValueFulfillWith(productName: string) {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector("//div[@class='sb-block-no-padding import-products__pricing-table']");
    const xpath = `(//*[@placeholder="` + productName + `"]/ancestor::div//table)[2]//tbody//tr`;

    const trValueNum = await this.page.locator(xpath).count();
    const variantList: Array<string> = [];
    for (let i = 1; i <= trValueNum; i++) {
      const tdvalue = (
        await this.page
          .locator(xpath + `[${i}]//td[2]//div`)
          .nth(2)
          .textContent()
      ).trim();
      variantList.push(tdvalue);
    }
    return variantList;
  }

  async clickEditVariant() {
    await waitForImageLoaded(this.page, this.xpathLastProductImage);
    await (await this.getLocatorEditVariant()).scrollIntoViewIfNeeded({ timeout: 70000 });
    (await this.getLocatorEditVariant()).click({ timeout: 65000 });
    await this.page.waitForTimeout(50000);
    await this.page.waitForSelector(
      "//div[contains(@class, 'title-description') and contains(normalize-space(), 'Options')]",
    );
  }

  async getVariantIdFromUrl(): Promise<number> {
    await this.page.waitForLoadState("load");
    const url = this.page.url();
    const d = url.split("/");
    return parseInt(d[d.length - 1]);
  }

  async getValueFulfillWithInEditVariantPage() {
    await this.page.waitForLoadState("load");

    await this.page.waitForSelector("//h3[text()[normalize-space()='To be fulfilled with']]");
    const xpath = "(//div[@class= 'row variant-info']//div[@class='cursor-pointer'])";
    const rowValueNum = await this.page.locator(xpath).count();
    const variantList: Array<string> = [];
    for (let i = 1; i <= rowValueNum; i++) {
      const tdvalue = (await this.page.locator(xpath + "[" + i + "]/div//div[3]").textContent()).trim();
      variantList.push(tdvalue);
    }

    return variantList;
  }

  async changeValueColor(productName: string, value: string) {
    await this.page.waitForLoadState("load");

    await this.page.waitForSelector("//span[text()='To be fulfilled with'][1]");
    const xpath =
      `(//*[@placeholder="` +
      productName +
      `"]/ancestor::div[@class="sb-card__body"]/div[@class="sb-tab sb-tab--inside"]//tr[@class= "sb-table__row"])`;
    const trValueNum = await this.page.locator(xpath).count();
    for (let i = 1; i <= trValueNum; i++) {
      const tdvalue = (await this.page.locator(xpath + "[" + i + "]/td[3]//input").inputValue()).trim();

      if (tdvalue === "2") {
        await this.page.locator(xpath + "[" + i + "]/td[3]//input").fill(value);
        await this.page.locator(xpath + "[" + i + "]/td[3]//input").press("Tab");
      }
    }
  }

  //Get variant id by API
  async getVariantIdByAPI(
    authRequest: APIRequestContext,
    productId: number,
    variantTitle: string,
    accessToken?: string,
  ): Promise<number> {
    let response;
    const url = `https://${this.domain}/admin/products/${productId}.json`;
    if (accessToken) {
      response = await authRequest.get(url, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      });
    } else {
      response = await authRequest.get(url);
    }
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const reportData = jsonResponse.product.variants.find(item => item.title == variantTitle);
      if (reportData) {
        return reportData.id;
      }
    }
  }

  //Edit variant tag
  async editVariantTag(productID: number, variant: number, variantTag: string) {
    await this.goto(`/admin/products/${productID}/variants/${variant}`);
    await this.genLoc("//div[child::h3[normalize-space()='Tag']]//input").fill(variantTag);
    await this.clickOnBtnWithLabel("Save changes");
  }

  /*
   *Click on field Page title on dashboard
   */
  async clickFieldPageTitle() {
    await this.page.click("//div[@class='type-container']//div[@class='s-input']//input");
  }

  /*
   *Get data on field Page title on dashboard
   */
  async getPageTitle(): Promise<string> {
    return this.page.getAttribute("//div[@class='type-container']//div[@class='s-input']//input", "placeholder");
  }

  /*
   *input thông tin vào các field Page title và Meta Description on dashboard
   */
  async inputSeoTitle(pageTitle: string, metaDescription: string) {
    if (pageTitle) {
      await this.page.fill("//div[@class='type-container']//div[@class='s-input']//input", pageTitle);
    }
    if (metaDescription) {
      await this.page.fill(this.xpathMetaDescriptionTxt, metaDescription);
    }
    // click save change after input data
    await this.clickOnBtnWithLabel("Save changes");
  }

  /**
   *
   * @returns handle input successfully
   */
  async inputHandle(handle: string) {
    await this.page.fill(
      "//div[@class='type-container']//div[contains(@class, 's-input-group--prepend')]//input",
      handle,
    );
    await this.clickOnBtnWithLabel("Save changes");
  }

  //get handle value on dashboard
  async getHandle(): Promise<string> {
    return this.page.inputValue(
      "//div[@class='type-container']//div[contains(@class,'s-input-group--prepend')]//input",
    );
  }

  /**
   * edit poduct title on dashboard
   * @param title giá trị cần input vào field Title của product
   */
  async editProductTitle(title: string) {
    await this.page.fill(this.xpathProductTitleTxt, title);
    await this.clickOnBtnWithLabel("Save changes");
  }

  //Get data on field Page title on dashboard
  async getPlaceHolder(): Promise<string> {
    return this.page.getAttribute(
      "//div[@class='has-bulk-actions']//div[@class='s-mr16 s-input s-input--prefix']//input",
      "placeholder",
    );
  }

  //Get number product sau khi ticked all checkbox list product on dashboard
  async getNumberProduct(): Promise<string> {
    await this.page.click("(//span[@class='s-check'])[1]");
    if (await this.page.locator(`//div[@class='action-table']//button[@class='s-button s-ml16 is-text']`).isVisible()) {
      await this.page.click("(//div[@class='action-table']//button[@class='s-button s-ml16 is-text'])");
    }
    return await this.getTextContent("(//span[@class='color-gray-draker type--bold'])[1]");
  }

  //Get message khi search product ra kết quả trống
  async getTextContentResult(): Promise<string> {
    return await this.page.textContent("//div[@id='products-results']//p[contains(@class,'text-bold font-14')]");
  }

  /**
   * select action on product list
   * @param action action name trong list action tại trang product list
   */
  async selectActionProduct(action: string) {
    await this.page.click("//button[span[text()[normalize-space() = 'Action']]]");
    await this.page.click(`//span[text()[normalize-space() = '${action}']]`);
  }

  /**
   * edit price product in bulk editor on dashboard
   * @param curentPrice giá Sale trước khi edit
   * @param updatePrice giá Sale cần edit
   */
  async editPriceProductInBulkEditor(curentPrice: string, updatePrice: string) {
    await this.page.dblclick(`//div[normalize-space()='${curentPrice}']`);
    await this.page.fill(`//input[@class='s-input__inner']`, updatePrice);
    await this.page.locator(`//input[@class='s-input__inner']`).press("Enter");
    await this.clickOnBtnWithLabel("Save changes");
  }

  //get price product on product detail
  async getPriceProduct(): Promise<string> {
    return this.page.inputValue(this.xpathInputFollowId("price"));
  }

  //click button X để xóa filter
  async clickDeleteFilters() {
    const xpathTagFilter = "//span[@class='s-tag']//div[@class='d-flex justify-content-space-between']";
    if (await this.page.locator(xpathTagFilter).isVisible()) {
      await this.page.click("//div[@class='m-t-sm m-r-sm']//i");
    }
  }

  /**
   * choose effects for Layer text
   * @param effectType is choose Style or Shape
   * @param typeLabel is choose type for Style or Shape
   */
  async chooseEffects(effectType: "Style" | "Shape", typeLabel: string) {
    const xpathEffectLabel = `//span[@class='label__effect' and contains(text(), '${effectType}')]`;
    if (
      await this.page
        .locator(xpathEffectLabel + "//ancestor::div[contains(@class,'s-collapse-item is-active')]")
        .isHidden()
    ) {
      await this.page.click(xpathEffectLabel);
    }
    if (effectType === "Style") {
      await this.page.click(`//span[contains(@class,'style-type__${typeLabel.toLowerCase()}')]`);
    } else {
      await this.page.click(
        xpathEffectLabel +
          `//ancestor::div[contains(@class, 's-collapse-item is-active')]//div[contains(@id, 'collapse-content')]//span[contains(text(), '${typeLabel}')]`,
      );
    }
    //Editor khong update canvas luon nen phai su dung timeout
    await this.page.waitForTimeout(2000);
  }

  /**
   * Add list layer for preview/printfile in editor
   * @param listLayer list layer cần add
   * @param isBackLayerList
   * @param isLayerList
   */
  async addLayers(listLayer: Array<Layer>) {
    for (let i = 0; i < listLayer.length; i++) {
      const layer = listLayer[i];
      await this.addLayer(layer);
    }
  }

  /**
   * Add layer for preview/printfile in editor
   * @param layer
   * @param isLayerList
   * @param isBackLayerList
   */
  async addLayer(layer: Layer) {
    if (layer.layer_type === "Text") {
      await this.page.click(`//button[child::span[normalize-space()="Add ${layer.layer_type.toLowerCase()}"]]`);
      if (layer.layer_name) {
        await this.page.click(
          `(//div[@class='s-input']//following-sibling::span[normalize-space()="${layer.layer_name}"])[1]`,
        );
      }
      // wait for gen data tren editor
      await this.page.waitForTimeout(3000);
      const checkError = await this.page
        .locator(
          "(//div[normalize-space()='Value must be greater than or equal to 1'] | //div[normalize-space()='Please finish this field'])[1]",
        )
        .isVisible({ timeout: 60000 });
      if (checkError) {
        await this.page.click("//div[@class='s-card-header']//i[contains(@class,'left')]");
        await this.page.waitForTimeout(2000);

        const xpathLayer = `//span[contains(@class,'display') and normalize-space()='${layer.layer_name}']//ancestor::div[contains(@class,'cursor-pointer')]`;
        const xpathBtnDots =
          "//ancestor::div[@class='single-layer__container' or @class='single-layer__container layer-in-group' ]//div[@role='button']";
        const xpathBtnDotsOfLayer = `${xpathLayer}${xpathBtnDots}`;
        await this.page.click(`${xpathBtnDotsOfLayer}`);
        await this.page.click("//span[contains(@class,'s-dropdown-item')]//span[normalize-space()='Delete']");
        if (await this.genLoc("//h2[normalize-space()='Delete this layer?']").isVisible()) {
          if (await this.genLoc("//span[normalize-space()='Only this product']").isVisible()) {
            await this.clickOnBtnWithLabel("Only this product");
          } else {
            await this.clickOnBtnWithLabel("Delete");
          }
        }
        await this.page.waitForTimeout(2000);
        await this.addLayer(layer);
        return;
      }
      if (layer.layer_value) {
        await this.page.fill("//input[@placeholder='Add your text']", layer.layer_value);
      }
    }
    if (layer.layer_type === "Image") {
      const fileChooserPromise = this.page.waitForEvent("filechooser");
      await this.page
        .locator(`//button//following-sibling::label[normalize-space()="Add ${layer.layer_type.toLowerCase()}"]`)
        .click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(`./data/shopbase/${layer.image_name}`);
      await this.waitForElementVisibleThenInvisible(
        "//div[@class='layer__list default-layer__list']//div[contains(@class,'s-caption')]",
      );
      await this.page.waitForTimeout(7000);
      await this.page.click("//div[contains(@class,'new-editor-flow')]", { timeout: 2000 });
      if (layer.image_name && !layer.not_layer_list) {
        await this.page.click("(//div[@class='s-input']//following-sibling::span)[1]");
      }
      await this.page.waitForTimeout(3000);
      const checkError = await this.page
        .locator(
          "(//div[normalize-space()='Value must be greater than or equal to 1'] | //div[normalize-space()='Please finish this field'])[1]",
        )
        .isVisible({ timeout: 60000 });
      if (checkError) {
        await this.page.click("//div[@class='s-card-header']//i[contains(@class,'left')]");
        await this.page.waitForTimeout(2000);

        const xpathLayer = `//span[contains(@class,'display') and normalize-space()='${layer.layer_name}']//ancestor::div[contains(@class,'cursor-pointer')]`;
        const xpathBtnDots =
          "//ancestor::div[@class='single-layer__container' or @class='single-layer__container layer-in-group' ]//div[@role='button']";
        const xpathBtnDotsOfLayer = `${xpathLayer}${xpathBtnDots}`;
        await this.page.click(`${xpathBtnDotsOfLayer}`);
        await this.page.click("//span[contains(@class,'s-dropdown-item')]//span[normalize-space()='Delete']");
        if (await this.genLoc("//h2[normalize-space()='Delete this layer?']").isVisible()) {
          if (await this.genLoc("//span[normalize-space()='Only this product']").isVisible()) {
            await this.clickOnBtnWithLabel("Only this product");
          } else {
            await this.clickOnBtnWithLabel("Delete");
          }
        }
        await this.page.waitForTimeout(2000);
        await this.addLayer(layer);
        return;
      }
    }

    if (layer.layer_name_new) {
      await this.page.dblclick(`//h3[normalize-space()='${layer.layer_name}']`);
      await this.page.waitForTimeout(1000);
      await this.page.fill(`//h3[normalize-space()='${layer.layer_name}']//parent::div//input`, layer.layer_name_new);
    }

    // Config for layer
    if (layer.font) {
      await this.page.click("//input[@placeholder='Search for fonts. E.g: Helvetica Neue']");
      await this.page.locator("//input[@placeholder='Search for fonts. E.g: Helvetica Neue']").press("Enter");
      await this.page.click(`(//span[normalize-space()="${layer.font}"])[1]`);
    }

    if (layer.color) {
      await this.page.click("//div[contains(@class,'s-color-picker')]//div[@class='s-input-group__append']");
      await this.page.click(
        `//div[@aria-label='A color preset, pick one to set as current color']//div[contains(@aria-label,'${layer.color}')]`,
      );
    }

    if (layer.rotate_layer) {
      await this.page.fill("//input[@placeholder='Rotation']", layer.rotate_layer);
    }

    if (layer.location_layer_x) {
      await this.page.fill(
        "//span[contains(text(),'X')]//parent::div[@class='s-input s-input--prefix']//input",
        layer.location_layer_x,
      );
      //Editor khong update canvas luon nen phai su dung timeout
      await this.page.waitForTimeout(2000);
    }

    if (layer.location_layer_y) {
      await this.page.fill(
        "//span[contains(text(),'Y')]//parent::div[@class='s-input s-input--prefix']//input",
        layer.location_layer_y,
      );
      //Editor khong update canvas luon nen phai su dung timeout
      await this.page.waitForTimeout(2000);
    }

    if (layer.layer_size_h) {
      await this.page.fill(
        "//span[contains(text(),'H')]//parent::div[@class='s-input s-input--prefix']//input",
        layer.layer_size_h,
      );
      //Editor khong update canvas luon nen phai su dung timeout
      await this.page.waitForTimeout(2000);
    }

    if (layer.layer_size_w) {
      await this.page.fill(
        "//span[contains(text(),'W')]//parent::div[@class='s-input s-input--prefix']//input",
        layer.layer_size_w,
      );
      //Editor khong update canvas luon nen phai su dung timeout
      await this.page.waitForTimeout(2000);
    }

    if (layer.opacity_layer) {
      await this.page.fill(
        "//div[@class='s-form-item custom-s-form is-success is-required' and child::div[contains(.,'Opacity')]]//input",
        layer.opacity_layer,
      );
    }

    //custom text overflow
    if (layer.text_overflow) {
      await this.page.click(
        `//span[contains(@class, 'style-label') and contains(text(), '${layer.text_overflow}')]//parent::div`,
      );
    }

    //custom text alignment
    if (layer.text_alignment) {
      if (layer.text_alignment.horizontal) {
        await this.page.click(`//button//i[contains(@class, 'format-align-${layer.text_alignment.horizontal}')]`);
      }
      if (layer.text_alignment.vertical) {
        await this.page.click(
          `//button//i[contains(@class, 'format-vertical-align-${layer.text_alignment.vertical}')]`,
        );
      }
    }

    //custom Style
    const xpathIconChevronStyle =
      "//div[@role='tablist' and descendant::span[normalize-space()='Style']]//i[contains(@class,'mdi-chevron-up')]";
    const xpathParentStyle =
      "//div[@role='tablist' and descendant::span[normalize-space()='Style']]//div[contains(@class,'custom-text-effect')]";
    if (layer.style) {
      await this.page.click(xpathIconChevronStyle);
      //Editor khong update canvas luon nen phai su dung timeout
      await this.page.waitForTimeout(2000);
      await this.page.locator("//span[normalize-space()='Reset all']").scrollIntoViewIfNeeded({ timeout: 10000 });
      if (layer.style.stroke) {
        await this.page.click(`${xpathParentStyle}//div[child::span[normalize-space()='Stroke']]//div`);
        if (layer.style.stroke.stroke_thickness) {
          await this.page.fill(
            `${xpathParentStyle}//div[descendant::p[normalize-space()='Thickness']]//input`,
            layer.style.stroke.stroke_thickness,
          );
          await this.page
            .locator(`${xpathParentStyle}//div[descendant::p[normalize-space()='Thickness']]//input`)
            .press("Enter");
        }
        if (layer.style.stroke.stroke_color_new) {
          await this.page.click(
            "//p[contains(text(),'Stroke color')]//following-sibling::div[contains(@class, 'color-picker')]",
          );
          await this.page.fill(
            "//input[contains(@aria-labelledby, 'input__label__hex')]",
            layer.style.stroke.stroke_color_new,
          );
          await this.page.click("//p[contains(@class, 'option-label') and contains(text(), 'Stroke color')]");
        }
        //Editor khong update canvas luon nen phai su dung timeout
        await this.page.waitForTimeout(2000);
      }

      if (layer.style.shadow) {
        await this.page.click(`${xpathParentStyle}//div[child::span[normalize-space()='Shadow']]//div`);
        if (layer.style.shadow.shadow_offset) {
          await this.page.fill(
            `${xpathParentStyle}//div[descendant::p[normalize-space()='Offset']]//input`,
            layer.style.shadow.shadow_offset,
          );
          await this.page
            .locator(`${xpathParentStyle}//div[descendant::p[normalize-space()='Offset']]//input`)
            .press("Enter");
        }
        if (layer.style.shadow.shadow_direction) {
          await this.page.fill(
            `${xpathParentStyle}//div[descendant::p[normalize-space()='Direction']]//input`,
            layer.style.shadow.shadow_direction,
          );
          await this.page
            .locator(`${xpathParentStyle}//div[descendant::p[normalize-space()='Direction']]//input`)
            .press("Enter");
        }
        if (layer.style.shadow.shadow_opacity) {
          await this.page.fill(
            `${xpathParentStyle}//div[descendant::p[normalize-space()='Opacity']]//input`,
            layer.style.shadow.shadow_opacity,
          );
          await this.page
            .locator(`${xpathParentStyle}//div[descendant::p[normalize-space()='Opacity']]//input`)
            .press("Enter");
        }
        if (layer.style.shadow.shadow_color) {
          await this.page.click(
            "//p[contains(text(),'Shadow')]//following-sibling::div[contains(@class, 'color-picker')]",
          );
          await this.page.fill(
            "//input[contains(@aria-labelledby, 'input__label__hex')]",
            layer.style.shadow.shadow_color,
          );
          await this.page.click("//p[contains(@class, 'option-label') and contains(text(), 'Shadow color')]");
        }
        //Editor khong update canvas luon nen phai su dung timeout
        await this.page.waitForTimeout(2000);
      }

      if (layer.style.hollow) {
        await this.page.click(`${xpathParentStyle}//div[child::span[normalize-space()='Hollow']]//div`);
        if (layer.style.hollow.hollow_thickness) {
          await this.page.fill(
            `${xpathParentStyle}//div[descendant::p[normalize-space()='Thickness']]//input`,
            layer.style.hollow.hollow_thickness,
          );
          await this.page
            .locator(`${xpathParentStyle}//div[descendant::p[normalize-space()='Thickness']]//input`)
            .press("Enter");
        }
        if (layer.style.hollow.hollow_color) {
          await this.page.click(
            "//p[contains(text(),'Stroke color')]//following-sibling::div[contains(@class, 'color-picker')]",
          );
          await this.page.fill(
            "//input[contains(@aria-labelledby, 'input__label__hex')]",
            layer.style.hollow.hollow_color,
          );
          await this.page.click("//p[contains(@class, 'option-label') and contains(text(), 'Stroke color')]");
        }
        //Editor khong update canvas luon nen phai su dung timeout
        await this.page.waitForTimeout(2000);
      }

      if (layer.style.echo) {
        await this.page.click(`${xpathParentStyle}//div[child::span[normalize-space()='Echo']]//div`);
        if (layer.style.echo.echo_offset) {
          await this.page.fill(
            `${xpathParentStyle}//div[descendant::p[normalize-space()='Offset']]//input`,
            layer.style.echo.echo_offset,
          );
          await this.page
            .locator(`${xpathParentStyle}//div[descendant::p[normalize-space()='Offset']]//input`)
            .press("Enter");
        }
        if (layer.style.echo.echo_direction) {
          await this.page.fill(
            `${xpathParentStyle}//div[descendant::p[normalize-space()='Direction']]//input`,
            layer.style.echo.echo_direction,
          );
          await this.page
            .locator(`${xpathParentStyle}//div[descendant::p[normalize-space()='Direction']]//input`)
            .press("Enter");
        }
        if (layer.style.echo.echo_color) {
          await this.page.click(
            "//p[contains(text(),'Shadow color')]//following-sibling::div[contains(@class, 'color-picker')]",
          );
          await this.page.fill("//input[contains(@aria-labelledby, 'input__label__hex')]", layer.style.echo.echo_color);
          await this.page.click("//p[contains(@class, 'option-label') and contains(text(), 'Shadow color')]");
        }
        //Editor khong update canvas luon nen phai su dung timeout
        await this.page.waitForTimeout(2000);
      }
      if (layer.style.none) {
        await this.page.click(`${xpathParentStyle}//div[child::span[normalize-space()='None']]//div`);
      }

      if (layer.style.stroke_color) {
        await this.page.click(`${xpathParentStyle}//div[descendant::p[normalize-space()='Shadow Color']]//i`);
        await this.page.waitForSelector(`${xpathParentStyle}//div[@aria-label='Sketch color picker']`);
        await this.page.fill(
          `${xpathParentStyle}//div[@aria-label='Sketch color picker']//input[@aria-labelledby='input__label__hex__194']`,
          layer.style.stroke_color,
        );
        //Editor khong update canvas luon nen phai su dung timeout
        await this.page.waitForTimeout(2000);
      }
    }

    //custom Shape
    const xpathIconChevronShape =
      "//div[@role='tablist' and descendant::span[normalize-space()='Shape']]//i[contains(@class,'mdi-chevron-up')]";
    const xpathParentShape =
      "//div[@role='tablist' and descendant::span[normalize-space()='Shape']]//div[contains(@class,'custom-text-effect')]";

    if (layer.shape) {
      await this.page.click(xpathIconChevronShape);
      await this.page.locator("//span[normalize-space()='Reset all']").scrollIntoViewIfNeeded({ timeout: 10000 });
      //Editor khong update canvas luon nen phai su dung timeout
      await this.page.waitForTimeout(2000);
      if (layer.shape.none) {
        await this.page.click(`${xpathParentShape}//div[child::span[normalize-space()='None']]//div`);
      }
      if (layer.shape.curve) {
        await this.page.click(`${xpathParentShape}//div[child::span[normalize-space()='Curve']]//div`);
        if (layer.shape.curve.curve_input) {
          await this.page.fill(
            `${xpathParentShape}//div[descendant::p[normalize-space()='Curve']]//input`,
            layer.shape.curve.curve_input,
          );
          await this.page
            .locator(`${xpathParentShape}//div[descendant::p[normalize-space()='Curve']]//input`)
            .press("Enter");
        }
        //Editor khong update canvas luon nen phai su dung timeout
        await this.page.waitForTimeout(2000);
      }
    }
    await this.page.waitForTimeout(2000);
    //click back to layer list
    if (!layer.not_back_layer_list) {
      await this.page.click("//div[@class='s-card-header']//i[contains(@class,'left')]");
    }
  }

  /**
   * Add layer to group in editor
   * @param layerName : layer text or image
   * @param groupName : name group
   */
  async addLayerToGroup(layerName: string, groupName: string) {
    const listLayer = layerName.split(",").map(item => item.trim());
    for (let i = 0; i < listLayer.length; i++) {
      await this.page.click(
        `//div[contains(@class,'content__center') and descendant::span[normalize-space()="${listLayer[i]}"]]//following-sibling::div//div[@class='s-dropdown-trigger']//i`,
      );
      const xpathGroup =
        `//div[contains(@class,'content__center') and descendant::span[normalize-space()="${listLayer[i]}"]]` +
        `//following-sibling::div//span[contains(normalize-space(),"${groupName}")]`;
      await this.page.click(xpathGroup);
    }
  }

  /**
   * Add list custom option for preview/printfile
   * @param listCustomOptionOnEditor
   */
  async addListCustomOptionOnEditor(listCustomOptionOnEditor: Array<CustomOptionProductInfo>) {
    for (let i = 0; i < listCustomOptionOnEditor.length; i++) {
      await this.addCustomOptionOnEditor(listCustomOptionOnEditor[i]);
    }
  }

  /**
   * Add custom option for preview/printfile
   * @param customOptionOnEditor
   * @deprecated: use function addListCustomOptionOnEditor
   */
  async addCustomOptionOnEditor(customOptionOnEditor: CustomOptionProductInfo) {
    //select type of custom option
    if (customOptionOnEditor.type && !customOptionOnEditor.not_edit_type) {
      await this.page.selectOption(".custom-option-detail__container .custom-option-content .s-select select", {
        label: customOptionOnEditor.type,
      });
    }
    //select target layer for custom option
    if (customOptionOnEditor.target_layer && customOptionOnEditor.type !== "Checkbox") {
      const layers = customOptionOnEditor.target_layer.split(",").map(item => item.trim());
      for (const layer of layers) {
        await this.page.click(".btn-select__trigger");
        await this.page.click(`//p[normalize-space() = '${layer}']`);
      }
    }
    //fill text to label of custom option
    if (customOptionOnEditor.label) {
      await this.page.fill(
        `//div[child::label[contains(text(),'Label')]]//following-sibling::div//input`,
        customOptionOnEditor.label,
      );
    }

    // input data for custom option Text field and Text area
    if (customOptionOnEditor.type === "Text field" || customOptionOnEditor.type === "Text area") {
      if (customOptionOnEditor.font) {
        await this.page.click("//input[@id='font-list-undefined' or contains(@id,'font-list-text-co')]");
        const xpathFontValue = `//span[contains(@class,'s-dropdown-item')]
        //span[contains(.,'${customOptionOnEditor.font}')]`;
        await this.page.click(xpathFontValue);
      }

      if (customOptionOnEditor.placeholder) {
        await this.page.fill(
          `//div[child::label[contains(text(),'Placeholder')]]//following-sibling::div//input`,
          customOptionOnEditor.placeholder,
        );
      }

      if (customOptionOnEditor.max_length) {
        await this.page.fill(
          `//div[child::label[contains(text(),'Max length')]]//following-sibling::div//input`,
          customOptionOnEditor.max_length,
        );
      }

      // select allow character following
      await this.page
        .locator("//div[child::label[normalize-space()='Allow the following characters']]")
        .scrollIntoViewIfNeeded();
      for (let i = 1; i < 5; i++) {
        const xpath = `(//div[child::label[normalize-space()='Allow the following characters']]//span[@class='s-check'])[${i}]`;
        await this.page.uncheck(xpath);
      }
      if (customOptionOnEditor.allow_character) {
        const character = customOptionOnEditor.allow_character.split(",").map(item => item.trim());
        for (let i = 0; i < character.length; i++) {
          const xpathIsCheck = `//span[normalize-space(text())='${character[i]}']//preceding-sibling::span[@class='s-check']`;
          await this.page.check(xpathIsCheck);
        }
      }

      if (customOptionOnEditor.default_value) {
        await this.page.fill(
          `//div[child::label[contains(text(),'Default value')]]//following-sibling::div//input`,
          customOptionOnEditor.default_value,
        );
      }
    }

    // input data for custom option Picture choice
    if (customOptionOnEditor.type === "Picture choice") {
      const xpathSelectClipart =
        `//span[contains(@class,'s-dropdown-item text-overflow')]` +
        `[span[normalize-space()='${customOptionOnEditor.value_clipart}']]`;
      const xpathSelectType = `//div[contains(@class,'custom-option-content')]//span[contains(text(),'${customOptionOnEditor.type_clipart}')]`;
      const xpathDisplay = `//span[contains(text(),'${customOptionOnEditor.type_display_clipart}')]`;
      switch (customOptionOnEditor.type_clipart) {
        case "Group":
          await this.page.click(xpathSelectType);
          await this.page.click("#pc-clipart-group-input");
          await this.page.fill("#pc-clipart-group-input", customOptionOnEditor.value_clipart);
          await this.page.waitForSelector(xpathSelectClipart);
          await this.page.click(xpathSelectClipart);
          if (customOptionOnEditor.type_display_clipart) {
            await this.page.click(xpathDisplay);
          }
          await this.page.waitForSelector(
            "//div[contains(@class,'custom-option-content')]//label[@class='display-block']",
          );
          //wait data sync
          await this.page.waitForTimeout(5000);
          break;
        default:
          await this.page.click(`//span[contains(text(),'${customOptionOnEditor.type_clipart}')]`);
          await this.page.waitForSelector("#pc-clipart-folder-input");
          await this.page.click("#pc-clipart-folder-input");
          await this.page.fill("#pc-clipart-folder-input", customOptionOnEditor.value_clipart);
          await this.page.waitForSelector(xpathSelectClipart);
          await this.page.click(xpathSelectClipart);
          if (customOptionOnEditor.type_display_clipart) {
            await this.page.click(xpathDisplay);
          }
          //wait data sync
          await this.page.waitForTimeout(5000);
          break;
      }
    }

    // input data for custom option Radio and Droplist
    if (customOptionOnEditor.type === "Radio" || customOptionOnEditor.type === "Droplist") {
      if (customOptionOnEditor.font) {
        await this.page.click("//input[@id='font-list-undefined' or contains(@id,'font-list-text-co')]");
        const xpathFontValue = `//span[contains(@class,'s-dropdown-item')]
        //span[contains(.,'${customOptionOnEditor.font}')]`;
        await this.page.click(xpathFontValue);
      }
      if (customOptionOnEditor.value) {
        const value = customOptionOnEditor.value.split(",").map(item => item.trim());
        const xpathCount = "//div[child::div[normalize-space()='Value']]//following-sibling::div";
        const countValue = await this.page.locator(xpathCount).count();
        if (value.length > 2) {
          for (let j = 0; j < value.length - countValue; j++) {
            await this.clickOnBtnWithLabel("Add more value");
          }
        }
        for (let i = 0; i < value.length; i++) {
          await this.inputFieldWithLabel("", "Enter a value", value[i], i + 1);
          if (customOptionOnEditor.default_check === value[i]) {
            const xpathIsCheck =
              `(//div[child::div[normalize-space()='Value']]` +
              `//following-sibling::div//span[@class='s-check'])[${i + 1}]`;
            await this.page.check(xpathIsCheck);
          }
        }
      }
    }

    // input data for custom option Checkbox
    if (customOptionOnEditor.type === "Checkbox") {
      if (customOptionOnEditor.value) {
        const value = customOptionOnEditor.value.split(",").map(item => item.trim());
        const xpath = "//input[contains(@placeholder,'Separate options with comma')]";
        for (let i = 0; i < value.length; i++) {
          await this.page.fill(xpath, value[i]);
          await this.page.press(xpath, "Enter");
        }
      }
    }
    const xpathSaveBtn = "(//button[normalize-space()='Save'])[2]";
    if (await this.page.locator(xpathSaveBtn).isVisible()) {
      //Trường hợp custom option với PC thì sau khi chọn clipart cần đợi một lúc mới click vào btn Save được
      await this.page.waitForTimeout(2000);
      await this.page.click(xpathSaveBtn);
      await this.page.isDisabled(xpathSaveBtn);
    }
    await this.page.waitForTimeout(1000);
    if (!customOptionOnEditor.not_other_option) {
      //click back to CO list
      await this.page.click("//div[contains(@class,'custom-option')]//i[@class='mdi mdi-chevron-left mdi-36px']");
      //add option above or add option below
      if (customOptionOnEditor.position) {
        const xpathCO = `//div[contains(@class,'custom-option__item') and child::div[contains(.,
      '${customOptionOnEditor.label}')]]`;
        const xpathPosition = `${xpathCO}//div[contains(text(), 'Add option ${customOptionOnEditor.position}')]`;
        await this.hoverThenClickElement(xpathCO, xpathPosition);
      }
      if (!customOptionOnEditor.add_fail) {
        await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
      }
    }
  }

  /**
   * get name custom option on Editor page
   * @returns name custom option
   */
  async getNameCustomOption() {
    const arr = [];
    const countNameCO = await this.genLoc(
      "//a[@class='title d-block text-bold cursor-pointer router-link-active text-overflow']",
    ).count();
    let getText = "";
    for (let i = 1; i <= countNameCO; i++) {
      getText = await this.getTextContent(
        `(//a[@class='title d-block text-bold cursor-pointer router-link-active text-overflow'])[${i}]`,
      );
      arr.push(getText);
    }
    return arr;
  }

  /**
   * check image enable
   * @param label
   * @returns
   */
  async checkImageEnableAfterCreated(label: string): Promise<boolean> {
    await this.page.waitForSelector("//div[child::h3[contains(.,'Personalization')]]");
    await this.page.waitForTimeout(2000);
    const xpathImagePreview = this.page.locator(`//div[child::h3[contains(.,'${label}')]]/following-sibling::div//img`);
    if (await xpathImagePreview.isVisible()) {
      return true;
    }
    return false;
  }

  /**
   * set up custmize group for shopbase
   * @param customizeGroup include option, label, name and default value
   * @param isEdit
   */
  async setupCustomizeGroup(customizeGroup: CustomizeGroup, isEdit = false) {
    if (!isEdit) {
      await this.clickOnBtnWithLabel("Customize group", 1);
    }
    if (customizeGroup.is_delete_group === true) {
      const deleteGroup = customizeGroup.group_name_delete.split(",").map(item => item.trim());
      for (let i = 0; i < deleteGroup.length; i++) {
        await this.page.click(
          `(//span[contains(text(), '${deleteGroup[i]}')]//parent::div[contains(@class, 'display-inline-block')])//following-sibling::span//i`,
        );
      }
    }
    await this.genLoc("//label[normalize-space()='Display the options as']//parent::div//select").selectOption({
      label: customizeGroup.option_group,
    });

    await this.page.fill("//input[@placeholder='Select number of people']", customizeGroup.label_group);
    if (customizeGroup.option_group === "Radio" || customizeGroup.option_group === "Droplist") {
      const listGroup = customizeGroup.group_name.split(",").map(item => item.trim());
      for (let i = 0; i < listGroup.length; i++) {
        await this.page
          .locator(`(//div[contains(@class,'group__item')]//input[@type='text'])[${i + 1}]`)
          .fill(listGroup[i]);
      }
    } else if (customizeGroup.option_group === "Picture choice") {
      const listImage = customizeGroup.group_name.split(",").map(item => item.trim());
      for (let i = 0; i < listImage.length; i++) {
        await this.page
          .locator("(//span[normalize-space()='Upload image']//following-sibling::input[@type='file'])[1]")
          .setInputFiles(`./data/shopbase/${listImage[i]}`);
        await this.waitForElementVisibleThenInvisible(this.xpathUploadImageLoad);
      }
    }
    const xpathSaveBtn = "(//span[normalize-space()='Save'])[2]";
    if (await this.page.locator(xpathSaveBtn).isVisible()) {
      await this.page.click(xpathSaveBtn);
      await this.page.isDisabled(xpathSaveBtn);
      await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
    }
    if (!customizeGroup.back_to_list) {
      await this.page.click("(//div[@class='customize-group__container']//i)[1]");
    }
  }

  /**
   * check btn enable
   * @param labelName: input custom name
   */
  async waitBtnEnable(labelName: string) {
    await this.page.click(this.xpathBtnWithLabel(labelName), { trial: true });
  }

  /**
   * clone product or campaign to store
   * @param cloneInfo : infor clone include type, second shop, action, keep id
   * @param type clone 1 hay nhiều trang
   * @param productName clone 1 product cụ thể
   */
  async cloneProductToStore(cloneInfo: CloneInfo, type = 1, index = 1, productName?: string) {
    if (type == 1) {
      await this.page.check(
        "(//span[@data-label='Select all products' or @data-label='Select all campaigns']//span)[1]",
      );
    } else {
      if (productName) {
        await this.page.click(`(//tr[descendant::span[text()='${productName}']]//span[@class="s-check"])[1]`);
      } else {
        await this.page.click(`(//tbody//span[@class="s-check"])[${index}]`);
      }
    }
    await this.genLoc("(//span[contains(text(), 'Action')])[1]").click();
    await this.page.waitForSelector(`//span[normalize-space()="Import ${cloneInfo.type} to another store"]`);
    //select import product or campaign
    await this.page.click(`//span[normalize-space()="Import ${cloneInfo.type} to another store"]`);
    await this.page.locator("//div[contains(@class,'s-animation-content')]//div[@class='s-modal-body']").isVisible();
    //choose store

    await this.page.click("//div[@class='s-modal is-active']//div[@id='select-shops']//button[@type='button']");
    await this.page.click(`//p[normalize-space()='${cloneInfo.second_shop}']`, { timeout: 5000 });
    //verify message
    await this.page.locator("//div[@class='s-alert is-yellow']//p").isVisible();
    //select action

    await this.page.click(
      "//div[child::p[contains(normalize-space(),'If the importing handle exists')]]//following-sibling::div//button",
    );
    await this.page.click(`//span[normalize-space()='${cloneInfo.action}']`);
    if (cloneInfo.keep_id === true) {
      await this.page.click(
        "//span[normalize-space()='Keep current Product ID / Variant ID in tracking services and product feeds of the targeting store']//parent::label",
      );
    }
    //click btn Import
    await this.page.waitForTimeout(3000);
    await this.page.click("(//button[normalize-space()='Import'])[2]", { timeout: 5000 });
    await this.page.waitForSelector("//div[contains(text(),'Importing')]");
  }

  /** Plusbase POD product
   * Verify that a product is imported successfully from another store
   * @params sourceStore: Store name
   * @params productName: Tên product được import
   * @return void
   */
  async verifyPlbPodProductImported(
    sourceStore: string,
    productName: string,
    expectedResult: string = "success" || "skipped" || "failed",
  ): Promise<void> {
    let resultText: string;
    await this.clickProgressBar();
    const statusXpath = `(//span[ @class='s-dropdown-item' and descendant::span[normalize-space()='From: ${sourceStore}']])[1]//span//span[normalize-space()='Completed']`;
    await expect(this.genLoc(statusXpath)).toBeVisible();
    if (expectedResult === "skipped") {
      resultText = "Imported 0/1 products. Skipped 1 products.";
    }

    if (expectedResult === "success") {
      resultText = "Imported 1/1 products.";
      await expect(async () => {
        await this.page.reload();
        await expect(this.genLoc(`(//tr[descendant::span[normalize-space()= '${productName}']])[1]`)).toBeVisible();
      }).toPass();
      await this.clickProgressBar();
    }

    if (expectedResult === "failed") {
      resultText = "Imported 0/0 products.";
      await expect(this.genLoc(`(//tr[descendant::span[normalize-space()= '${productName}']])[1]`)).toBeHidden();
    }
    const resultXpath = `((//span[@class='s-dropdown-item' and child::div[contains(@class,'row')]])[1]//div[normalize-space()='${resultText}'])[1]`;
    await expect(this.genLoc(resultXpath)).toBeVisible();
  }

  /**
   * Clone product
   * Select checkbox product after search product
   * Action clone product from store staff to store owner
   * @param domainStoreOwner is domain of store owner
   * Wait message success
   */
  async selectAndCloneProduct(store: string) {
    const xpathCheckBox = this.page.locator("(//span[@class='s-check'])[2]");
    await xpathCheckBox.click();
    await this.clickOnBtnWithLabel("Action");
    const xpathCloneProduct = this.page.locator("//span[contains(text(),'Import product to another store')]");
    await xpathCloneProduct.click();
    await this.page.waitForLoadState("load");
    await this.page.locator("//span[contains(text(),'Choose a store')]").click();
    await this.page.locator(`//p[contains(text(),'${store}')]`).click();
    await this.page.locator("(//button[normalize-space()='Import'])[2]").click();
    await this.page.waitForSelector("//div[contains(text(),'Importing 1 product to store')]");
  }

  /**
   * Focus on search input field
   * Fill product name and enter
   * Search product by name
   * @param productName input product name
   */
  async searchProdByName(productName: string) {
    await this.page.waitForSelector('//div[@id="products-results"]');
    const xpathSearch = this.page.locator("//input[@placeholder='Search products']");
    await xpathSearch.focus();
    await xpathSearch.fill(productName);
    await this.page.waitForTimeout(2 * 1000); // wait for loading search keyword
    await xpathSearch.press("Enter");
    await this.page.waitForTimeout(2 * 1000); // wait for loading search keyword
    await this.page.waitForSelector("//*[@id='all-products']");
  }

  /**
   * search prod by Collection
   * @param productName
   * @param productId
   */
  async searchProdByCollection(collectionName: string) {
    const xpathFieldCollection = "//p[normalize-space()='Collection']";

    await this.clickOnBtnWithLabel("More filters");
    await this.page.click(xpathFieldCollection);
    await this.page.locator(this.xpathInputFieldCollection).clear();
    await this.page.locator(this.xpathInputFieldCollection).fill(collectionName);
    await this.page.click(`(//span[normalize-space()='${collectionName}'])[1]`);
    await this.clickOnBtnWithLabel("Done");
    await this.page.waitForSelector("//*[@id='all-products']");
  }

  /**
   *Click btn next page
   */
  async clickBtnNextPage(): Promise<void> {
    await this.page.click("//i[@class='mdi mdi-chevron-right mdi-18px']");
    await this.page.waitForSelector("//*[@id='all-products']");
  }

  /**
   * get all title product of a page
   * @param domain
   * @param conf
   * @param authRequest
   * @returns
   */
  async getTitleProductCurrentPage(
    domain: string,
    conf: ProductData,
    authRequest: APIRequestContext,
  ): Promise<Array<string>> {
    const param =
      `page=${conf.page_product}&limit=${conf.limit_product}&title=&query=&published_status=any` +
      "&sort_field=id&sort_mode=desc&fields=id%2Ctitle%2Cimage%2" +
      "Cimages%2Cproduct_type%2Cvendor%2Cpublished%2Chandle%2Ctags%2" +
      "Cproduct_source%2Csbff_product_mapping%2Cupdated_type%2Ccreated_at%2Cproduct_availability" +
      "&tab=all&last_id=0&direction=&search=&product_availability=";
    const response = await authRequest.get(`https://${domain}/admin/products.json?${param}`);
    expect(response.status()).toBe(200);
    const rawData = await response.json();
    const listTitle: string[] = [];
    for (let i = 0; i < rawData.products.length; i++) {
      listTitle.push(rawData.products[i].title);
    }

    return listTitle;
  }

  /**
   *
   * @param domain
   * @param conf
   * @param authRequest
   * @returns
   */
  async getAllProductTitle(domain: string, conf: ProductData, authRequest: APIRequestContext): Promise<Array<string>> {
    const response = await authRequest.get(`https://${domain}/admin/products.json?`);
    expect(response.status()).toBe(200);
    const rawData = await response.json();
    const listAllTitle: string[] = [];
    for (let i = 0; i < rawData.products.length; i++) {
      listAllTitle.push(rawData.products[i].title);
    }

    return listAllTitle;
  }

  /**
   * Search advanced with title
   * @param titleProd
   * @param conditional
   */
  async searchProdByTitle(titleProd: string, conditional: "Contains" | "Doesn't contain") {
    const xpathFieldTitle = "//p[normalize-space()='Title']";
    const xpathInputFieldTitle = "//input[@placeholder='Search the title']";

    await this.clickOnBtnWithLabel("More filters");
    await this.page.click(xpathFieldTitle);
    await this.page.click(`//span[normalize-space()='${conditional}']`);
    await this.page.locator(xpathInputFieldTitle).clear();
    await this.page.locator(xpathInputFieldTitle).fill(titleProd);
    await this.clickOnBtnWithLabel("Done");
    await this.page.waitForSelector("//*[@id='all-products']");
  }

  /**
   * get all title prod on dashboard
   * @returns
   */
  async getTitleProdOnDashboard(): Promise<Array<string>> {
    const xpathTitleProd = await this.genLoc("//span[@data-label='View on Online Store']//preceding-sibling::div//div");
    const listTitle = await xpathTitleProd.evaluateAll(list => list.map(element => element.textContent.trim()));
    return listTitle;
  }

  /**
   * input thông tin Description cho popup insert/Edit link
   * @param descriptionInsert data from config contain description info (title_description, description_URL, source...)
   */
  async createDescriptionInsertLink(descriptionInsert: DescriptionInsert) {
    await this.page.click("//button[@title = 'Insert/edit link']");
    await this.page.fill("//div//input[@type = 'url']", descriptionInsert.description_URL);
    if (descriptionInsert.text_to_display) {
      await this.clearInPutData("(//div//input[@class = 'tox-textfield'])[2]");
      await this.page.fill("(//div//input[@class = 'tox-textfield'])[2]", descriptionInsert.text_to_display);
    }

    if (descriptionInsert.title_description) {
      await this.clearInPutData("(//div//input[@class = 'tox-textfield'])[3]");
      await this.page.fill("(//div//input[@class = 'tox-textfield'])[3]", descriptionInsert.title_description);
    }
    if (descriptionInsert.open_link_in) {
      await this.page.click("//span[@class='tox-listbox__select-label']");
      await this.page.click(`//div[@title='${descriptionInsert.open_link_in}']`);
    }
    // click save after input data description
    await this.page.click("//div[@role='presentation']//button[normalize-space()='Save']");
    // click save change after input data
    await this.clickOnBtnWithLabel("Save changes");
  }

  /**
   * input thông tin Description cho popup insert/Edit media
   * @param descriptionInsert data from config contain description info (field, width, height...)
   */
  async createDescriptionInsertMedia(descriptionInsert: DescriptionInsert) {
    await this.page.click("//button[@title = 'Insert/edit media']");
    await this.page.click(
      `//div[@class='tox-dialog__body']//div[@role='tablist']//div[text()='${descriptionInsert.field}']`,
    );
    if (descriptionInsert.field === "General") {
      await this.page.fill("//div[@class='tox-control-wrap']//input[@type = 'url']", descriptionInsert.source);
      if (descriptionInsert.width) {
        await this.clearInPutData("(//div[@class='tox-form__group']//input[@type='text'])[1]");
        await this.page.fill("(//div[@class='tox-form__group']//input[@type='text'])[1]", descriptionInsert.width);
      }
      if (descriptionInsert.height) {
        await this.clearInPutData("(//div[@class='tox-form__group']//input[@type='text'])[2]");
        await this.page.fill("(//div[@class='tox-form__group']//input[@type='text'])[2]", descriptionInsert.height);
      }
    }
    if (descriptionInsert.field === "Embed") {
      await this.page.fill("//div//textarea[@type='text']", descriptionInsert.embed_code);
    } else {
      if (descriptionInsert.alternative_source_URL) {
        await this.page.fill("(//div//input[@type='url'])[1]", descriptionInsert.alternative_source_URL);
      }
      if (descriptionInsert.media_poster) {
        await this.page.fill("(//div//input[@type='url'])[2]", descriptionInsert.media_poster);
      }
    }
    // click save after input data description
    await this.page.click("//div[@role='presentation']//button[normalize-space()='Save']");
    // click save change after input data
    await this.clickOnBtnWithLabel("Save changes");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * input thông tin Description cho popup insert/Edit image
   * @param descriptionInsert data from config contain description info (alternative_description, field,..)
   */
  async createDescriptionInsertImage(descriptionInsert: DescriptionInsert) {
    await this.page.click("//button[@title = 'Insert/edit image']");
    await this.page.click(
      `//div[@class='tox-dialog__body']//div[@role='tablist']//div[text()='${descriptionInsert.field}']`,
    );
    if (descriptionInsert.field === "General") {
      await this.page.fill("//div[@class='tox-control-wrap']//input[@type = 'url']", descriptionInsert.source);
      if (descriptionInsert.alternative_description) {
        await this.page.fill(
          "(//div[@class='tox-form__group']//input[@type='text'])[1]",
          descriptionInsert.alternative_description,
        );
      }
      if (descriptionInsert.width) {
        await this.clearInPutData("(//div[@class='tox-form__group']//input[@type='text'])[2]");
        await this.page.fill("(//div[@class='tox-form__group']//input[@type='text'])[2]", descriptionInsert.width);
      }
      if (descriptionInsert.height) {
        await this.clearInPutData("(//div[@class='tox-form__group']//input[@type='text'])[3]");
        await this.page.fill("(//div[@class='tox-form__group']//input[@type='text'])[3]", descriptionInsert.height);
      }
    }
    if (descriptionInsert.field === "Upload") {
      await this.page
        .locator(
          "//button[normalize-space()='Browse for an image']//parent::div//following-sibling::input[@type='file']",
        )
        .setInputFiles(`./data/shopbase/${descriptionInsert.imageName}`);
    }
    // click save after input data description
    await this.page.click("//div[@role='presentation']//button[normalize-space()='Save']");
    // click save change after input data
    await this.clickOnBtnWithLabel("Save changes");
    // wait for product detail loaded
    await this.page.waitForSelector(".action-bar");
  }

  //Duplicate product tại màn hình product detail
  async duplicateProduct(keepMedias?: boolean, title?: string) {
    if (title) {
      await this.page.fill("//div[@class='m-b-sm s-input']//input", title);
    }
    if (keepMedias) {
      await this.verifyCheckedThenClick("//span//span[normalize-space()='Duplicate product medias']", true);
    }
    await this.page.click("//div[contains(@class,'s-modal-footer')]//button[normalize-space()='Duplicate']");
    if (title) {
      await this.page.waitForSelector(`//h1[.="${title}"]`);
    }
  }

  /**
   * Get number of product after filter to validate filter
   * @param filterCondition Array all condition to filter
   * @returns number
   */
  async countProdAfterFilter(filterCondition: Array<FilterCondition>): Promise<number> {
    let numProd = 0;
    if (filterCondition) {
      await this.filterWithConditionDashboard("More Filters", filterCondition);
    }
    await this.selectAllProducts();
    numProd = await this.getNumOfSelectedProduct();
    return numProd;
  }

  async getArrNumProdAfterFilter(filterCondition: Array<Array<FilterCondition>>): Promise<Array<number>> {
    const arrProdNum = [];
    for (let i = 0; i < filterCondition.length; i++) {
      await this.goto("admin/products");
      arrProdNum.push(await this.countProdAfterFilter(filterCondition[i]));
    }
    return arrProdNum;
  }

  //Select all product over all pages
  async selectAllProducts() {
    await this.selectAllProductOnListProduct();
    if (await this.page.locator("//span[contains(text(), 'products across all pages')]").isVisible()) {
      await this.page.click("//span[contains(text(), 'products across all pages')]");
    }
  }

  /**
   * Input tag ở popup add tag màn product list
   * @param value value cần add field tag
   */
  async inputValueTag(value: string) {
    const listValue = value.split(",").map(item => item.trim());
    for (let i = 0; i < listValue.length; i++) {
      await this.page.fill(`//div[@class='s-taginput control']//input[@class='s-input__inner']`, listValue[i]);
      await this.genLoc(`//div[@class='s-taginput control']//input[@class='s-input__inner']`).press("Enter");
    }
    const waitApplyButton = await this.page.waitForSelector(
      "//button[span[text()[normalize-space() = 'Apply changes']]]",
    );
    await waitApplyButton.waitForElementState("stable");
    await this.page.click("//button[span[text()[normalize-space() = 'Apply changes']]]");
  }

  /**
   * Get data list product by api
   * @param domain
   * @param accessToken
   * @returns
   */
  async getListProduct(domain: string, accessToken: string) {
    const res = await this.page.request.get(`https://${domain}/admin/products.json?access_token=${accessToken}`);
    expect(res.status()).toBe(200);
    return await res.json();
  }

  /**
   * Get thông tin product màn search product plusbase
   * @param domain
   * @param conf
   * @param accessToken
   * @returns
   */
  async getProductSearch(domain: string, conf: ProductData, accessToken: string) {
    const name = conf.product_name.replaceAll(" ", "%20");
    const param = `page=${conf.page_product}&limit=${conf.limit_product}&title=${name}&access_token=${accessToken}`;
    const response = await this.page.request.get(`https://${domain}/admin/products.json?${param}`);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get text màn hình suggest use sample product plusbase
   * @returns
   */
  async getTextSuggestScreen(): Promise<string> {
    const xpath = "(//p[@class='fs-body m-b text-secondary'])[1]";
    await this.page.waitForSelector(xpath);
    return this.getTextContent(xpath);
  }

  /**
   * Get data product detail shop plusbase
   * @param domain
   * @param productId
   * @param accessToken
   * @returns
   */
  async getDataProduct(domain: string, productId: number, accessToken: string) {
    const response = await this.page.request.get(
      `https://${domain}/admin/products/${productId}.json?access_token=${accessToken}`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * delete product by product name using api
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @param productId is the Id of the product
   * @param param data from config contain request payload to delete
   */
  async deleteProductByName(
    authRequest: APIRequestContext,
    domain: string,
    productId: number,
    param: paramDeleteProduct,
  ) {
    const response = await authRequest.delete(`https://${domain}/admin/products.json?ids=${productId}`, {
      data: param,
    });
    expect(response.ok()).toBeTruthy();
  }

  /**
   * Search and select product on product list screen
   * @param productName : keyword to find product
   * @param productId : product Id tương ứng với product name input
   */
  async searchAndSelectProduct(productName: string, productId: number) {
    await this.page.waitForLoadState("load");
    await this.genLoc('[placeholder="Search products"]').fill(productName);
    //Press Enter
    await this.genLoc('[placeholder="Search products"]').press("Enter");
    await this.page.waitForSelector("#all-products");
    //open product detail page
    await this.page.click(`//*[text()[normalize-space()='${productName}']]`);
    // wait product detail is visible
    await this.page.waitForResponse(
      response => response.url().includes(`/admin/products/${productId}.json`) && response.status() === 200,
    );
  }

  /**
   * click btn Custom Option only on product detail
   */
  async clickBtnCustomOptionOnly() {
    await this.page.click("//*[ text()[normalize-space()='Create custom option only']]");
  }

  /**
   * Add new all or any custom option on product detail
   * @param customOptionInfo : includes data of custom option : type, default name,...
   */
  async addNewCustomOptionWithData(customOptionInfo: CustomOptionProductInfo): Promise<void> {
    const xpathParent =
      `//div[contains(@class,'s-collapse-item') and descendant::` +
      `div[normalize-space()='${customOptionInfo.custom_name}']]//following-sibling::div[@role='tabpanel']` +
      `| //div[contains(@class,'col-xs-12 s-mt8') and descendant::p[normalize-space()='To option']]`;
    // update name Custom option
    const xpathParentOnNameCO =
      `//div[contains(@class,'s-collapse-item') and descendant::` +
      `div[normalize-space()='${customOptionInfo.default_name}']]//following-sibling::div[@role='tabpanel']` +
      `| //div[contains(@class,'col-xs-12 s-mt8') and descendant::p[normalize-space()='${customOptionInfo.default_name}']]`;
    if (customOptionInfo.default_name) {
      await this.page.fill(
        `(${xpathParentOnNameCO})//div[child::label[normalize-space()='Name']]//following-sibling::div//input`,
        customOptionInfo.custom_name,
      );
    }
    // select type on Custom option
    if (customOptionInfo.type && customOptionInfo.custom_name) {
      const xpath = `(${xpathParent})//div[child::label[contains(text(),'Type')]]//following-sibling::div//select`;
      await this.page.locator(xpath).scrollIntoViewIfNeeded();
      await this.page.selectOption(xpath, { label: customOptionInfo.type });
    }

    // input label on Custom option
    if (customOptionInfo.label) {
      await this.page
        .frameLocator(
          `(//following-sibling::div[@role='tabpanel' or @class = 'replace-option-wrapper']//` +
            `iframe[contains(@id,'tiny-vue')])[${customOptionInfo.index}]`,
        )
        .locator("//body[@id='tinymce']")
        .fill(customOptionInfo.label);
    }
    // input data to any Custom option
    if (customOptionInfo.type === "Radio buttons" || customOptionInfo.type === "Droplist") {
      if (customOptionInfo.values) {
        const value = customOptionInfo.values.split(",").map(item => item.trim());
        const xpathCount = `(${xpathParent})//div[child::div[normalize-space()='Value']]//following-sibling::div`;
        const countValue = await this.page.locator(xpathCount).count();
        for (let j = 0; j < value.length - countValue; j++) {
          if (customOptionInfo.position) {
            await this.clickOnBtnWithLabel("Add more value", Number(customOptionInfo.position));
          } else {
            await this.clickOnBtnWithLabel("Add more value");
          }
        }
        for (let i = 0; i < value.length; i++) {
          await this.inputFieldWithLabel(`(${xpathParent})`, "Enter a value", value[i], i + 1);
          if (customOptionInfo.default_check === value[i]) {
            const xpathIsCheck =
              `(` +
              `(${xpathParent})//div[child::div[normalize-space()='Value']]` +
              `//following-sibling::div//span[@class='s-check'])[${i + 1}]`;
            await this.page.check(xpathIsCheck);
          }
        }
      }
    }

    if (customOptionInfo.type === "Checkbox") {
      if (customOptionInfo.values) {
        const value = customOptionInfo.values.split(",").map(item => item.trim());
        const xpath = `(${xpathParent})//input[contains(@placeholder,'Separate options with comma')]`;
        for (let i = 0; i < value.length; i++) {
          await this.page.fill(xpath, value[i]);
          await this.page.press(xpath, "Enter");
        }
      }
    }
    if (customOptionInfo.type === "Picture choice") {
      if (customOptionInfo.values) {
        const xpathSelectClipart =
          `//span[@class='s-dropdown-item text-overflow']` + `[span[normalize-space()='${customOptionInfo.values}']]`;
        const xpathDisplay = `//span[contains(text(),'${customOptionInfo.type_display_clipart}')]`;
        const xpathSelectFolder = `//span[@class='s-dropdown-item text-overflow' and normalize-space()='${customOptionInfo.values}']`;
        switch (customOptionInfo.type_clipart) {
          case "Group":
            await this.page.click(`//span[contains(text(),'${customOptionInfo.type_clipart}')]`);
            await this.page.click("#pc-clipart-group-input");
            await this.page.fill("#pc-clipart-group-input", customOptionInfo.values);
            await this.page.click(xpathSelectClipart);
            if (customOptionInfo.type_display_clipart) {
              await this.page.click(xpathDisplay);
            }
            break;
          default:
            await this.page.click(`//span[contains(text(),'${customOptionInfo.type_clipart}')]`);
            await this.page.waitForSelector("#pc-clipart-folder-input");
            await this.page.click("#pc-clipart-folder-input");
            await this.page.waitForSelector("//div[@class='s-dropdown-menu has-header']");
            await this.page.fill("#pc-clipart-folder-input", customOptionInfo.values);
            await this.page.waitForSelector(xpathSelectFolder);
            await this.page.click(xpathSelectFolder);
            if (customOptionInfo.type_display_clipart) {
              await this.page.click(xpathDisplay);
            }
            break;
        }
      }
    }
    // select allow character following
    if (customOptionInfo.type === "Text field" || customOptionInfo.type === "Text area") {
      for (let i = 0; i < 4; i++) {
        const xpath =
          `((//div[child::label[normalize-space()='Allow the following characters']])[${customOptionInfo.position}]` +
          `//following-sibling::div//span[@class='s-check'])[${i + 1}]`;
        await this.page.uncheck(xpath);
      }
    }
    if (customOptionInfo.allow_following) {
      const character = customOptionInfo.allow_following.split(",").map(item => item.trim());
      for (let i = 0; i < character.length; i++) {
        const xpathIsCheck =
          `(//span[normalize-space(text())='${character[i]}']` +
          `//preceding-sibling::span)[${customOptionInfo.position}]`;
        await this.page.check(xpathIsCheck);
      }
    }
    // add Default value (prefill on storefront)
    if (customOptionInfo.default_value) {
      const xpath =
        `(${xpathParent})//div[child::label[normalize-space()='Default value (prefill on storefront)']]` +
        `//following-sibling::div//input`;
      await this.page.fill(xpath, customOptionInfo.default_value);
    }

    // add Placeholder (optional)
    if (customOptionInfo.placeholder) {
      const xpath =
        `(${xpathParent})//div[child::label[normalize-space()='Placeholder (optional)']]` +
        `//following-sibling::div//input`;
      await this.page.fill(xpath, customOptionInfo.placeholder);
    }

    // click hide custom option or not
    if (customOptionInfo.hide_option === "yes") {
      await this.page.click(
        `//div[contains(@class,'s-sub-title') and descendant::` +
          `div[normalize-space()='${customOptionInfo.custom_name}']]//following-sibling::div//i`,
      );
    }
    if (customOptionInfo.custom_name && !customOptionInfo.is_not_collapse_custom_option) {
      await this.page.click(
        `//div[contains(@class,'s-sub-title') and descendant::` +
          `div[normalize-space()='${customOptionInfo.custom_name}']]//following-sibling::div//div[@class='dvxhwQ']`,
      );
    }
    // click add to custom option other
    if (customOptionInfo.add_another_option === "yes") {
      await this.clickOnBtnWithLabel("Add another option");
    }
  }

  /**
   * Close custom option
   *  @param customOptionInfo : includes data of custom option : type, default name,...
   */

  async closeCustomOption(customOptionInfo: CustomOptionProductInfo): Promise<void> {
    const xpathParent =
      `//div[contains(@class,'s-collapse-item') and descendant::` +
      `div[normalize-space()='${customOptionInfo.custom_name}']]`;
    await this.page.click(`${xpathParent}//span[child::i[contains(@class,'mdi-menu-down')]]`);
  }

  /**
   * Get data of custom option
   * @param productInfo : includes data of product : name, price, sku,...
   * @param authRequest
   * customOptionInfo: includes data of custom option : type, default name,...
   */
  async getCustomOptionData(
    authRequest: APIRequestContext,
    productInfo: ProductValue,
    customOptionInfo: CustomOptionProductInfo,
  ): Promise<CustomOptionProductInfo[]> {
    const productID = await this.getProductIDByURL();
    const response = await authRequest.get(`https://${this.domain}/admin/products/${productID}.json?`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return (jsonResponse.product.custom_options || []).find(
      respElement => respElement.name == customOptionInfo.custom_name,
    );
  }

  /**
   * Delete custom option
   * @param customOptionInfo : includes data of custom option : type, default name,...
   */
  async deleteCustomOption(customOptionInfo: CustomOptionProductInfo): Promise<void> {
    const xpathParent =
      `//div[contains(@class,'s-collapse-item') and descendant::` +
      `div[normalize-space()='${customOptionInfo.custom_name}']]`;
    await this.page.locator(`${xpathParent}//i[contains(@class,'mdi-delete')]`).click();
  }

  /**
   * Find option name and delete
   * @param customOptionName : string
   **/
  async deleteCustomOptionInList(customOptionName: string): Promise<void> {
    const xpathParent = this.getXpathItemCustomOption(customOptionName);
    await this.page.locator(`${xpathParent}//i[contains(@class,'mdi-dots-vertical')]`).click();
    await this.page.locator(`${xpathParent}//i[contains(@class,'mdi-delete')]`).click();
    if (await this.page.locator(this.xpathBtnWithLabel("Delete")).isVisible()) {
      await this.clickOnBtnWithLabel("Delete");
    }
  }

  /**
   * Open clipart folder detail on Phub
   * @param clipartFolderName : name of clipart folder
   **/
  async openClipartFolderDetail(clipartFolderName: string): Promise<void> {
    //search clipart folder
    await this.genLoc("[placeholder='Search by name']").fill(clipartFolderName);
    //Press Enter
    await this.genLoc("[placeholder='Search by name']").press("Enter");
    await this.page.waitForSelector("#all-products");
    //click on clipart folder
    await this.page.click(`//a[normalize-space()='${clipartFolderName}']`);
    await this.page.waitForSelector("#pod-clipart-folder-detail");
    await this.page.waitForSelector("//div[@class='container-upload-design section no-style']");
    const countImageClipart = await this.page.locator(this.xpathImageClipart).count();
    for (let i = 1; i < countImageClipart; i++) {
      await waitForImageLoaded(this.page, `(//div[contains(@class,'image-in-table align-item-center')]//img)[${i}]`);
    }
  }

  /**
   * Delete image in clipart folder
   * @param imagePreview : name of image
   **/
  async deleteImageInClipartFolder(imagePreview: string): Promise<void> {
    const xpathCount = `//table[contains(@class,'custom-table')]//input[@type='text']`;
    await this.page.waitForSelector(xpathCount);
    // await this.page.locator(`(${xpathCount})[1]`).scrollIntoViewIfNeeded();
    const count = await this.page.locator(xpathCount).count();
    await this.page.locator(`(${xpathCount})[${count}]`).scrollIntoViewIfNeeded();
    for (let i = count; i > 0; i--) {
      const xpathInputName = `(//table[contains(@class,'custom-table')]//input[@type='text'])[${i}]`;
      const inputValue = await this.page.locator(xpathInputName).inputValue();
      const imagePrev = imagePreview.replace(/(\.png|\.jpeg)/g, "").trim();
      if (inputValue === imagePrev) {
        const xpathIconDelete = `(//table[contains(@class,'custom-table')]//a[contains(@class,'pull-right')])[${i}]`;
        await this.page.waitForSelector(xpathIconDelete);
        await this.page.locator(xpathIconDelete).click();
      }
    }
    // await this.page.waitForSelector("//span[normalize-space()='Unsaved changes']");
    await this.page.waitForTimeout(3000);
  }

  /**
   * Edit image in clipart folder
   * @param imagePreview : name of image
   * @param newImageName : new name of image
   */
  async editClipartImageName(imagePreview: string, newImageName: string): Promise<void> {
    const xpathCount = `//table[contains(@class,'custom-table')]//input[@type='text']`;
    const imagePrev = imagePreview.replace(/(\.png|\.jpeg)/g, "").trim();
    const newImage = newImageName.replace(/(\.png|\.jpeg)/g, "").trim();
    const count = await this.page.locator(xpathCount).count();
    for (let i = 1; i <= count; i++) {
      const xpathInputName = `(//table[contains(@class,'custom-table')]//input[@type='text'])[${i}]`;
      const inputValue = await this.page.locator(xpathInputName).inputValue();
      if (inputValue === imagePrev) {
        await this.page.waitForTimeout(3000);
        await this.page.fill(xpathInputName, newImage);
        break;
      }
      await this.page.waitForTimeout(3000);
    }
  }

  /**
   * Delete image thumbnail in clipart folder
   * @param imagePreview : name of image preview
   */
  async deleteImageThumbnailInClipartFolder(imagePreview: string): Promise<void> {
    const xpathCount = `//table[contains(@class,'custom-table')]//input[@type='text']`;
    const count = await this.page.locator(xpathCount).count();

    for (let i = 0; i < count; i++) {
      const xpathDeleteImageThumbnail =
        `(//table[contains(@class,'custom-table')]//` +
        `tr[descendant::input[@type='text']])[${i + 1}]//i[contains(@class,'mdi-trash-can-outline')]`;
      const xpathInputName = `(//table[contains(@class,'custom-table')]//input[@type='text'])[${i + 1}]`;
      const inputValue = await this.page.locator(xpathInputName).inputValue();
      if (inputValue === imagePreview.replace(/(\.png|\.jpeg)/g, "").trim()) {
        await this.page.click(xpathDeleteImageThumbnail);
        break;
      }
    }
  }

  /**
   * Edit image thumbnail in clipart folder
   * @param imagePreview : name of image preview
   * @param pathFileImageThumbnail : path of image thumbnail
   */
  async editImageThumbnailInClipartFolder(imagePreview: string, pathFileImageThumbnail: string): Promise<void> {
    const xpathCount = `//table[contains(@class,'custom-table')]//input[@type='text']`;
    const count = await this.page.locator(xpathCount).count();

    for (let i = 0; i < count; i++) {
      const xpathInputName = `(//table[contains(@class,'custom-table')]//input[@type='text'])[${i + 1}]`;
      const inputValue = await this.page.locator(xpathInputName).inputValue();
      if (inputValue === imagePreview.replace(/(\.png|\.jpeg)/g, "").trim()) {
        const iconEditThumbnail =
          `(//table[contains(@class,'custom-table')]//` +
          `tr[descendant::input[@type='text']])[${i + 1}]//i[contains(@class,'mdi-pencil')]`;
        const checkIconEditImage = await this.page.locator(iconEditThumbnail).isVisible();
        const xpathEditImageThumbnail = `${iconEditThumbnail}//ancestor::div[@class='s-upload s-control']//input`;
        if (checkIconEditImage === true) {
          await this.page.setInputFiles(xpathEditImageThumbnail, pathFileImageThumbnail);
          await this.waitForElementVisibleThenInvisible(this.xpathLoadImageThumnail);
          await this.waitImagesLoaded(this.xpathImageClipart);
        } else {
          const xpathImageThumbnail =
            `(//table[contains(@class,'custom-table')]` +
            `//tr[descendant::a[normalize-space()='Upload another one']])[${i + 1}]//input[@type='file']`;
          await this.page.setInputFiles(xpathImageThumbnail, pathFileImageThumbnail);
          await this.waitForElementVisibleThenInvisible(this.xpathLoadImageThumnail);
          await this.waitImagesLoaded(this.xpathImageClipart);
        }
        break;
      }
    }
  }

  /**
   * add more image clipart
   * @param images
   */
  async addMoreClipart(images: string): Promise<void> {
    const listImage = images.split(",").map(item => item.trim());
    for (let i = 0; i < listImage.length; i++) {
      await this.page.setInputFiles(
        "//div[child::label[normalize-space()='Add more cliparts']]//input",
        appRoot + `/data/shopbase/${listImage[i]}`,
      );
      await this.waitForElementVisibleThenInvisible(this.xpathLoadImageThumnail);
    }
  }

  /**
   * go to clip art page
   */
  async goToClipArtPage() {
    await this.page.goto(`https://${this.domain}/admin/pod/clipart`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * delete clipart folder
   * @param clipartFolderName : name of clipart folder
   */
  async deleteClipartFolder(clipartFolderName: string): Promise<void> {
    //search clipart folder
    await this.genLoc("[placeholder='Search by name']").fill(clipartFolderName);
    //Press Enter
    await this.genLoc("[placeholder='Search by name']").press("Enter");
    await this.page.waitForTimeout(3000);
    await this.page.waitForSelector(
      "(//td[@class='cursor-default no-padding-important'])[1] | //div[contains(text(),'Could not find any')]",
    );
    if ((await this.genLoc("//div[contains(text(),'Could not find any')]").isVisible({ timeout: 50000 })) === false) {
      await this.genLoc("text=TITLE GROUP >> span").nth(1).click();
      await this.page.waitForTimeout(2000);
      await this.genLoc("//button[normalize-space()='Action']").click({ timeout: 5000 });
      await this.page.waitForTimeout(2000);
      await this.genLoc("//span[normalize-space() = 'Delete Clipart folders']").click({ timeout: 5000 });
      await this.clickOnBtnWithLabel("Delete");
      await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
      await this.page.waitForSelector("//div[contains(@class,'no-result')]");
    }
  }

  /**
   * Click button Edit clipart folfer on product detail page
   */
  async clickOnBtnEditClipartFolder(): Promise<void> {
    await this.genLoc("//a[normalize-space()='Edit clipart folder']").click();
    await this.page.waitForSelector("//div[@class='s-animation-content s-modal-content']");
  }

  /**
   * Open clipart group detail on Phub
   * @param clipartGropuName : name of clipart group
   */
  async openClipartGroupDetail(clipartGropuName: string): Promise<void> {
    //search clipart folder
    await this.genLoc("[placeholder='Search by name']").fill(clipartGropuName);
    //Press Enter
    await this.genLoc("[placeholder='Search by name']").press("Enter");
    await this.page.waitForSelector("#all-products");
    //click on clipart folder
    await this.page.click(`//a[normalize-space()='${clipartGropuName}']`);
    await this.page.waitForSelector("#pod-clipart-folder-detail");
  }

  /**
   * Add new clipart folder in clipart group
   * @param clipartFolderInfo
   */
  async addNewClipartFolderInGroup(clipartFolderInfo: ClipartFolder): Promise<void> {
    if (clipartFolderInfo.folder_name) {
      await this.genLoc("//div[@class='s-modal-body']//div[@class='s-form-item text-right']//input").fill(
        clipartFolderInfo.folder_name,
      );
    }
    if (clipartFolderInfo.images) {
      const xpathInputFile = "//div[@class='s-modal-body']//form[@id='file-form']//input";
      const xpathAddMore = "//h4[contains(text(),'Cliparts')]//parent::div//input[@id='add-artwork']";
      const checkExistButtonAddMore = await this.page.isVisible(xpathAddMore);
      for (let j = 0; j < clipartFolderInfo.images.length; j++) {
        const filePath = appRoot + `/data/shopbase/${clipartFolderInfo.images[j]}`;
        if (checkExistButtonAddMore === true) {
          await this.page.setInputFiles(xpathAddMore, filePath);
        } else {
          await this.page.setInputFiles(xpathInputFile, filePath);
        }
      }
      await this.page.click("//div[@class='fixed-setting-bar__bottom']//button[normalize-space()='Save changes']");
    }
  }

  /**
   * add new clipart folder
   * @param clipartFolderInfo info of clipart folder
   */
  async addNewClipartFolder(clipartFolderInfo: ClipartFolder, index = 1): Promise<void> {
    let checkExistButtonAddMore;
    if (clipartFolderInfo.folder_name) {
      await this.genLoc(`(//div[@class='s-form-item text-right']//input)[${index}]`).fill(
        clipartFolderInfo.folder_name,
      );
    }
    if (clipartFolderInfo.group_name) {
      const xpathDeleteGroup =
        "//div[@id = 'clipart-list']//div[@class='s-input s-input--prefix s-input--suffix']" +
        "//i[contains(@class,'mdi-close')]";
      const checkExistGroup = await this.page.isVisible(xpathDeleteGroup);
      if (checkExistGroup === true) {
        await this.page.click(xpathDeleteGroup);
      }
      const xpathSelectClipart = `//span[@class='s-dropdown-item text-overflow']//span[normalize-space()='${clipartFolderInfo.group_name}']`;
      const xpathInputGroup =
        "//div[@id = 'clipart-list']//div[@class='s-input s-input--prefix s-input--suffix']//input";
      await this.page.click(xpathInputGroup);
      await this.clearInPutData(xpathInputGroup);
      await this.page.fill(xpathInputGroup, clipartFolderInfo.group_name);
      if (await this.page.isVisible(xpathSelectClipart, { timeout: 2000 })) {
        await this.page.click(xpathSelectClipart);
      } else {
        await this.page.click("//b[contains(text(),'Create group')]");
      }
    }
    if (clipartFolderInfo.images) {
      const xpathAddNewImagePreview =
        "//div[@class='s-modal-body' or @class ='container-upload-design section no-style']//form[@id='file-form']//input";
      for (let i = 0; i < clipartFolderInfo.images.length; i++) {
        const image = clipartFolderInfo.images[i].split(">").map(item => item.trim());
        const imagePreview = image[0];
        const imageThumbnail = image[1];
        const filePathImagePreview = appRoot + `/data/shopbase/${imagePreview}`;
        const filePathImageThumbnail = appRoot + `/data/shopbase/${imageThumbnail}`;
        await this.page.waitForSelector("//h4[contains(text(),'Cliparts')]");
        const xpathAddMore =
          "//h4[contains(text(),'Cliparts')]//parent::div[descendant::" +
          "label[normalize-space()='Add more cliparts']]//input[@id='add-artwork']";
        checkExistButtonAddMore = await this.page.isVisible(
          "//h4[contains(text(),'Cliparts')]//parent::div[descendant::" +
            "label[normalize-space()='Add more cliparts']]",
        );
        if (checkExistButtonAddMore === false) {
          await this.page.setInputFiles(xpathAddNewImagePreview, filePathImagePreview);
          await this.waitForElementVisibleThenInvisible("(//img[@class='sbase-spinner'])[1]");
          await waitForImageLoaded(this.page, "(//div[@class='campaign-thumb-box']//img)[1]");
        } else {
          await this.page.setInputFiles(xpathAddMore, filePathImagePreview);
          await this.waitForElementVisibleThenInvisible("(//img[@class='sbase-spinner'])[1]");
          await waitForImageLoaded(this.page, "(//div[@class='campaign-thumb-box']//img)[1]");
        }
        if (imageThumbnail) {
          const xpathImageThumbnail =
            "(//div[@class ='s-upload s-control' and descendant::a[normalize-space()='Upload another one']]//input)[1]";
          await this.page.setInputFiles(xpathImageThumbnail, filePathImageThumbnail);
          await this.waitForElementVisibleThenInvisible(
            "(//tbody//div[@class='thumb-loading']//img[@class='sbase-spinner'])[1]",
          );
          await waitForImageLoaded(this.page, "(//div[@class='s-upload s-control']//img)[1]");
        }
      }
    }
    if (clipartFolderInfo.image_name) {
      const imageName = clipartFolderInfo.image_name.split(",").map(item => item.trim());
      for (let i = 0; i < imageName.length; i++) {
        await this.clearInPutData(`//tbody[contains(@class,'drag-clipart-container')]//input[@id='id-name-${i}']`);
        await this.page.fill(
          `//tbody[contains(@class,'drag-clipart-container')]//input[@id='id-name-${i}']`,
          imageName[i],
        );
      }
    }
  }

  /**
   * get custom option data
   * @param productID : is product id
   * @param authRequest
   * @param customOptionInfo : includes data of custom option : type, default name,...
   */
  async getCustomOptionInfoByAPI(
    authRequest: APIRequestContext,
    customOptionInfo: CustomOptionProductInfo,
    productID: string,
    token?: string,
  ): Promise<CustomOptionProductInfo> {
    let response;
    if (token) {
      response = await authRequest.get(`https://${this.domain}/admin/products/${productID}.json?`, {
        headers: { [AccessTokenHeaderName]: token },
      });
    } else {
      response = await authRequest.get(`https://${this.domain}/admin/products/${productID}.json?`);
    }
    expect(response.ok()).toBeTruthy();
    const customOptionInfoAPI = this.cloneObject<CustomOptionProductInfo>(customOptionInfo);
    const jsonResponse = await response.json();
    const customOption = (jsonResponse.product.custom_options || []).find(
      respElement => respElement.name == customOptionInfo.name,
    );
    if (customOptionInfoAPI.type) {
      customOptionInfoAPI.type = customOption.type;
    }
    if (customOptionInfoAPI.custom_name) {
      customOptionInfoAPI.custom_name = customOption.name;
    }
    if (customOptionInfoAPI.label) {
      customOptionInfoAPI.label = customOption.label;
    }
    if (customOptionInfoAPI.placeholder) {
      customOptionInfoAPI.placeholder = customOption.placeholder;
    }
    if (customOptionInfoAPI.default_value) {
      customOptionInfoAPI.default_value = customOption.default_value;
    }
    if (customOptionInfoAPI.allowed_characters) {
      customOptionInfoAPI.allowed_characters = customOption.validations.allowed_characters;
    }
    if (customOptionInfoAPI.help_text) {
      customOptionInfoAPI.help_text = customOption.help_text;
    }
    if (customOptionInfoAPI.values) {
      customOptionInfoAPI.values = customOption.values;
    }
    if (customOptionInfoAPI.p_o_d_data) {
      delete customOption.p_o_d_data.clipart_id;
      customOptionInfoAPI.p_o_d_data = customOption.p_o_d_data;
    }
    return customOptionInfoAPI;
  }

  /**
   * Get list product after delete all product
   * @param authRequest  is the request to get the ID
   * @param domain  is the domain of the shop
   * @returns
   */
  async getListProductAfDeleteAll(authRequest: APIRequestContext, domain: string) {
    for (let i = 0; i < 10; i++) {
      const response = await authRequest.get(`https://${domain}/admin/products.json?`);
      expect(response.ok()).toBeTruthy();
      const jsonResponse = await response.json();
      if (jsonResponse.product === "null") {
        return jsonResponse.product;
      }
      // thời gian sync xóa product tối đa là 6 min
      await this.page.waitForTimeout(5000);
    }
  }

  /**
   * Get first product before delete
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @returns
   */
  async getFirstProductBeforeDelete(authRequest: APIRequestContext, domain: string) {
    const response = await authRequest.get(
      `https://${domain}/admin/products.json?&title=&query=&published_status=any` +
        `&sort_field=id&sort_mode=desc&fields=id%2Ctitle`,
    );
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.products[0].title;
  }

  /**
   * Select one or more product on product list
   * @param quantity  input quantity need select
   */
  async selectOneOrMoreProductOnProductList(quantity: number) {
    if (quantity === 50) {
      await this.verifyCheckedThenClick("(//span[@data-label='Select all products']//span)[1]", true);
    } else if (quantity < 50) {
      for (let i = 0; i < quantity; i++) {
        await this.verifyCheckedThenClick(
          `//table[@id='all-products']//tbody//tr[${i + 1}]//descendant::span[@class= 's-check']`,
          true,
        );
      }
    } else {
      await this.verifyCheckedThenClick("(//span[@data-label='Select all products']//span)[1]", true);
      await this.page.click("//div[@class = 'action-table']//button[span[contains(text(), 'Select all')]]");
    }
  }

  /**
   * Get total product before detele using api
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @returns
   */
  async getTotalProductBeforeDelete(authRequest: APIRequestContext, domain: string) {
    const response = await authRequest.get(
      `https://${domain}/admin/products/count.json?` + `limit=51&sort_field=id&sort_mode=desc&fields=id%2Ctitle`,
    );
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.count;
  }

  /**
   * Select action on product list
   * @param actionForProduct
   */
  async selectActionOnProductList(actionForProduct: ActionForProduct) {
    await this.waitUntilElementVisible("//div[@class='action-table']//button[normalize-space()='Action']");
    await this.clickOnBtnWithLabel("Action");
    await this.page.click(`//div[@class='s-dropdown-menu']//span[normalize-space()='${actionForProduct.action_name}']`);
    if (
      actionForProduct.action_name === "Make products available" ||
      actionForProduct.action_name === "Make products unavailable"
    ) {
      await this.clickOnBtnWithLabel(`${actionForProduct.confirm_action}`);
    }
    if (actionForProduct.action_name === "Add tags" || actionForProduct.action_name === "Remove tags") {
      const listTag = actionForProduct.product_value.split(",").map(item => item.trim());
      for (let i = 0; i < listTag.length; i++) {
        await this.page.click(`(//div[@class='tag-list-items']//span[normalize-space()='${listTag[i]}'])[1]`);
      }
      await this.clickOnBtnWithLabel("Apply changes");
    }
    if (
      actionForProduct.action_name === "Add to collection" ||
      actionForProduct.action_name === "Remove from collection"
    ) {
      const listCollection = actionForProduct.product_value.split(",").map(item => item.trim());
      for (let i = 0; i < listCollection.length; i++) {
        await this.page.click(`//div[normalize-space()='${listCollection[i]}']//parent::label//span[@class='s-check']`);
      }
      await this.page.click("(//span[normalize-space()='Save'])[2]");
    }
    if (actionForProduct.action_name === "Edit products") {
      await this.page.dblclick(`//div[normalize-space()='${actionForProduct.price_old}']`);
      await this.page.fill("//div[@col-id='price']//input[@class='s-input__inner']", actionForProduct.price_new);
      await this.page.press("//div[@col-id='price']//input[@class='s-input__inner']", "Enter");
      await this.page.click("(//span[normalize-space()='Save changes'])[1]");
      await this.waitUntilElementInvisible("//div[@class='s-toast is-dark is-bottom']");
    }
  }

  /**
   * Click button Add variant
   */
  async clickAddVariant() {
    await this.page.click("//div[@class='row product-info']//a[normalize-space()='Add variant']");
  }

  /**
   * Add or edit variant with các data(option name, option value, price...)
   * @param productVariant
   */
  async addOrEditVariantWithData(productVariant: ProductVariant) {
    if (productVariant.value_size) {
      await this.page.fill("//div[@class='s-form-item']//input[@id='option1']", productVariant.value_size);
    }

    if (productVariant.value_color) {
      await this.page.fill("//div[@class='s-form-item']//input[@id='option2']", productVariant.value_color);
    }

    if (productVariant.value_style) {
      await this.page.fill("//div[@class='s-form-item']//input[@id='option3']", productVariant.value_style);
    }
    if (productVariant.price) {
      await this.page.fill(this.xpathInputFollowId("price"), productVariant.price);
    }

    if (productVariant.compare_at_price) {
      await this.page.fill(this.xpathInputFollowId("compare_price"), productVariant.compare_at_price);
      await this.page.press(this.xpathInputFollowId("compare_price"), "Enter");
    }
    if (productVariant.cost_per_item) {
      await this.page.fill(this.xpathInputFollowId("cost_price"), productVariant.cost_per_item);
      await this.page.press(this.xpathInputFollowId("cost_price"), "Enter");
    }
    if (productVariant.sku) {
      await this.page.fill(this.xpathInputFollowId("sku"), productVariant.sku);
      await this.page.press(this.xpathInputFollowId("sku"), "Enter");
    }
    if (productVariant.bar_code) {
      await this.page.fill("//input[@id='barcode']", productVariant.bar_code);
      await this.page.press("//input[@id='barcode']", "Enter");
    }
    if (productVariant.inventory_policy) {
      await this.page.selectOption(this.xpathInventoryPolicySlt, { label: `${productVariant.inventory_policy}` });
      await this.page.fill("//input[@id='quantity']", productVariant.quantity);
      const regex = `//*[text()[normalize-space()='Allow customers to purchase this product when it's out of stock']]`;
      if (productVariant.allowOverselling) {
        await this.page.setChecked(regex, productVariant.allowOverselling);
      }
    }
    if (productVariant.weight) {
      await this.page.fill(this.xpathWeightTxt, productVariant.weight);
    }
    if (productVariant.weightUnit) {
      await this.page.click(
        `//p[contains(., 'Weight')]//following::div[contains(@class, 'select')]` +
          `//option[@value='${productVariant.weightUnit}']`,
      );
    }
    // click save change after input data
    await this.clickOnBtnWithLabel("Save changes");
  }

  /**
   * Get number all variant product on dashboard
   * @returns
   */
  async getNumberProductAllVariant(): Promise<string> {
    return await this.getTextContent("//div[@class='has-bulk-actions']//h3");
  }

  /**
   * click back to product detail screen
   */
  async clickBackProductDetail() {
    await this.page.click("//ol[@class='breadcrumb']//span");
  }

  /**
   * Delete 1 variant by icon delete on product detail
   */
  async deleteOneVariantByIcon() {
    await this.page.click("(//div[@class='ui-card__section']//i[contains(@class, 'delete ')])[1]");
    await this.page.click("//div[@class='s-modal-card s-animation-content']//button[contains(@class, 'delete')]");
  }

  /**
   * Edit variant by icon edit on product detail
   */
  async clickButtonEditVariant() {
    await this.page.click("(//div[@class='ui-card__section']//i[contains(@class, 'pencil')])[1]");
  }

  /**
   * Select group variant or select all variant
   * @param groupVariant group name của variant cần select
   */
  async selectGroupVariant(groupVariant: string) {
    await this.verifyCheckedThenClick(
      `//td[@class='group-title']//span[normalize-space()='${groupVariant}']` +
        `/ancestor::tr//label[@class='s-checkbox']`,
      true,
    );
  }

  /**
   * Select 1 variant của group
   * @param groupVariant group name của variant
   */
  async selectVariantOnGroup(groupVariant: string) {
    await this.verifyCheckedThenClick(
      `(//td[@class = 'group-title']//span[normalize-space()='${groupVariant}']` +
        `/ancestor::tr//following-sibling::tr//span[@class='s-check'])[1]`,
      true,
    );
  }

  /**
   * thực hiện các action( change price, edit, duplicate, delete) for variant
   * @param actionName name of action need select
   * @param newPrice value price need input
   * @param newSize value size need input
   * @param newColor value color need input
   */
  async selectActionForVariant(actionName: string, newPrice?: string, newSize?: string, newColor?: string) {
    await this.page.click("//button[normalize-space()='Action']");
    await this.page.click(`//span[normalize-space()='${actionName}']`);
    switch (actionName) {
      case "Change Price":
        await this.page.fill(this.xpathInputFollowId("price"), newPrice);
        await this.page.click("//div[@class='s-modal-footer']//span[normalize-space()='Save']");
        break;
      case "Delete variants":
        await this.page.click("//button[normalize-space()='Delete']");
        break;
      case "...in another Size":
        await this.page.fill("//div[@class='s-modal-body']//input", newSize);
        await this.page.click("//div[@class='s-modal-footer']//span[normalize-space()='Save']");
        break;
      case "...in another Color":
        await this.page.fill("//div[@class='s-modal-body']//input", newColor);
        await this.page.click("//div[@class='s-modal-footer']//span[normalize-space()='Save']");
        break;
    }
  }

  /**
   * Get number variant selected
   * @returns
   */
  async getNumberVariantSelected() {
    return await this.getTextContent("//div[@class='s-button button-select-all']//span[@class='s-control-label']");
  }

  /**
   * Get message error when blank field required on popup edit options
   * @returns
   */
  async getMessageError() {
    return await this.getTextContent("//div[@class='s-alert__content']//span");
  }

  /**
   * Get list price of group variant product using api response
   * After change price for group variant success, get price of group variant product
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @param productId is the Id of the product
   * @param productVariant data from config contain variant info (price of variants)
   */
  async getPriceOfGroupVariantDashboardByApi(authRequest: APIRequestContext, domain: string, productId: number) {
    const response = await authRequest.get(`https://${domain}/admin/products/${productId}.json`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const newObject = {
      price_variant1: "",
      price_variant2: "",
      price_variant3: "",
    };
    // price_variant1 is price of variant đầu tiên của group variant
    newObject.price_variant1 = jsonResponse.product.variants[0].price;
    // price_variant2 is price of variant thứ 2 của group variant
    newObject.price_variant2 = jsonResponse.product.variants[1].price;
    // price_variant3 is price of variant thứ 3 của group variant
    newObject.price_variant3 = jsonResponse.product.variants[2].price;
    return newObject;
  }

  /**
   * sellect all variant product
   */
  async selectAllVariant() {
    await this.verifyCheckedThenClick(`(//table[@id='all-variants']//span[@class='s-check'])[1]`, true);
  }

  /**
   * Click button Action for variant product
   */
  async clickButtonActionVariant() {
    await this.page.click("//button[normalize-space()='Action']");
  }

  /**
   * edit option variant with action edit option name and delete option value
   * @param variant option value need delete
   */
  async editOptionNameVariant(variant: string) {
    await this.page.click("//div[@class='row product-info']//a[normalize-space()='Edit options']");
    await this.page.click(
      `//span[contains(@class, 'list-item')]//span[normalize-space()='${variant}']//following-sibling::a`,
    );
    await this.page.click("//button[normalize-space()='Delete']");
    await this.page.click("//div[@class='s-modal-footer']//span[normalize-space()='Save']");
  }

  /**
   * Input option name, option value on popup Edit options
   * @param optionName option value need input
   * @param optionValue option name need input
   */
  async inputValueOption(optionName: string, optionValue: string) {
    await this.page.fill("(//div[@class='s-modal-body']//input[@class='s-input__inner'])[3]", optionName);
    await this.page.fill("//div[@class='s-modal-body']//input[@placeholder='Default Style']", optionValue);
    await this.page.click("//div[@class='s-modal-footer']//span[normalize-space()='Save']");
  }

  /**
   * Click button Edit options để edit option variant
   */
  async clickEditOption() {
    await this.page.click("//div[@class='row product-info']//a[normalize-space()='Edit options']");
  }

  /**
   * Click button Save on popup
   */
  async clickBtnSaveOnPopup() {
    await this.page.click("//div[@class='s-modal-footer']//span[normalize-space()='Save']");
  }

  /*
   * Click button Add anoher option on popup edit option
   */
  async clickBtnAddOption() {
    await this.page.click("//div[normalize-space()='Add another option']");
  }

  //Edit block facebook pixel on product detail
  async editBlockFbPixel(pixelId: string, accessToken: string) {
    await this.genLoc("//div[child::label[normalize-space()='Pixel ID']]//following-sibling::div//input").fill(pixelId);
    await this.genLoc("//div[child::label[normalize-space()='Access Token']]//following-sibling::div//input").fill(
      accessToken,
    );
  }

  /**
   * delete variant combo if exist
   * @param combo : variant combo
   */

  async deleteVariantCombo(combo: string, index?: number) {
    await this.page.waitForSelector(this.xpathProductVariantDetail);
    if (combo != "") {
      const xpath =
        `(//td[normalize-space()='${combo}']//` +
        `following-sibling::td//span[@data-label='Delete']//button)[${index}]`;
      const number = await this.genLoc(xpath).count();
      if (number > 0) {
        await this.page.click(xpath);
        await this.page.click("//button[normalize-space()='Delete']");
      }
    }
  }

  /**
   * edit product type of product
   * @param productType is product type of product
   */
  async editProductType(productType: string) {
    await this.page.fill("//input[@placeholder='Product type']", productType);
  }

  /**
   * edit product vendor of product
   * @param productVendor is vendor of product
   */
  async editProductVendor(productVendor: string) {
    await this.page.fill(`//input[@placeholder="Nikola's Electrical Supplies"]`, productVendor);
  }

  async editProductTagFromProductDetail(productTag: string) {
    const listTag = productTag.split(",").map(item => item.trim().toLowerCase());
    for (let i = 0; i < listTag.length; i++) {
      await this.page.fill("//input[@placeholder='Vintage, cotton, summer']", listTag[i]);
      await this.page.press("//input[@placeholder='Vintage, cotton, summer']", "Tab");
      await this.page.press("//input[@placeholder='Vintage, cotton, summer']", "Enter");
    }
  }

  async removeProductTagFromProductDetail(productTag: string) {
    const listTag = productTag.split(",").map(item => item.trim());
    for (let i = 0; i < listTag.length; i++) {
      await this.page.click(
        `(//span[normalize-space()='${listTag[i]}']//parent::span//a[@class='s-delete is-small'])[2]`,
      );
    }
  }

  async getListC0InProductDetail(): Promise<Array<string>> {
    const arr = [];
    const countNameCO = await this.genLoc("//div[contains(@class,'s-sub-title')]//div//div").count();
    let getText = "";
    for (let i = 1; i <= countNameCO; i++) {
      getText = await this.getTextContent(`(//div[contains(@class,'s-sub-title')]//div//div)[${i}]`);
      arr.push(getText);
    }
    return arr;
  }

  // Click vào icon Add conditional logic
  async clickAddConditionalLogic(conditionInfo: ConditionInfo) {
    await this.page.click(
      `//div[child::div[normalize-space()='${conditionInfo.custom_name}']]//i[contains(@class,'shuffle-variant')]`,
    );
    await this.page.waitForSelector("//div[contains(@class,'animation-content s-modal-content')]");
  }

  // Edit conditional logic
  async clickEditConditionalLogic(conditionInfo: ConditionInfo) {
    await this.page.click(
      `//div[child::div[normalize-space()='${conditionInfo.custom_name}']]//a//span[normalize-space()='Edit logic']`,
    );
    await this.page.waitForSelector("//div[contains(@class,'animation-content s-modal-content')]");
  }

  /**
   * Add conditonal logic of custom option on Shopbase
   * @param conditionInfo inclue info custom option (custom name, condition...)
   */
  async addConditionalLogicSB(conditionInfo: ConditionInfo) {
    //add block conditional logic
    if (conditionInfo.add_condition == "yes") {
      await this.page.locator("//div[contains(@class,'actions')]//i[contains(@class,'mdi-plus')]").click();
      for (let j = 0; j < conditionInfo.condition.length; j++) {
        const value = conditionInfo.condition[j].split(">").map(item => item.trim());
        if (value[0]) {
          await this.page.selectOption(
            `(//div[contains(@class,'animation-content s-modal-content')]/div` +
              `//div[@class='s-select f-1']/select)[${j + 1}]`,
            { label: value[0] },
          );
        }
        if (value[0]) {
          await this.page.selectOption(
            `(//div[contains(@class,'animation-content s-modal-content')]` +
              `//div[contains(@class,'rule-wrapper')])[${
                j + 1
              }]//div[contains(@class,'s-select f-1 ruleIndex')]//select`,
            { label: value[1] },
          );
        }
      }
      for (let n = 0; n < conditionInfo.then_show_value.length; n++) {
        if (conditionInfo.then_show_value[n]) {
          await this.page.selectOption(
            `(//div[contains(@class,'animation-content s-modal-content')]` +
              `//div//div[@class='s-select']/select)[${n + 1}]`,
            { label: conditionInfo.then_show_value[n] },
          );
        }
      }
    } else {
      // const condition = conditionInfo.condition.split(",").map(item => item.trim());
      for (let i = 0; i < conditionInfo.condition.length - 1; i++) {
        await this.page.click(
          "//div[contains(@class,'animation-content s-modal-content')]//" +
            "div//span[normalize-space()='Add another condition']",
        );
      }
      for (let j = 0; j < conditionInfo.condition.length; j++) {
        const value = conditionInfo.condition[j].split(">").map(item => item.trim());
        if (value[0]) {
          await this.page.selectOption(
            `(//div[contains(@class,'animation-content s-modal-content')]/div` +
              `//div[@class='s-select f-1']/select)[${j + 1}]`,
            { label: value[0] },
          );
        }
        if (value[1]) {
          await this.page.selectOption(
            `(//div[contains(@class,'animation-content s-modal-content')]/div` +
              `//div[@class='s-select f-1 ruleIndex0']/select)[${j + 1}]`,
            { label: value[1] },
          );
        }
      }
      // add custom option then show on SF
      for (let m = 0; m < conditionInfo.then_show_value.length - 1; m++) {
        await this.page.click(
          "//div[contains(@class,'animation-content s-modal-content')]" +
            "//div//span[normalize-space()='Add new option']",
        );
      }
      for (let n = 0; n < conditionInfo.then_show_value.length; n++) {
        if (conditionInfo.then_show_value[n]) {
          await this.page.selectOption(
            `(//div[contains(@class,'animation-content s-modal-content')]` +
              `//div//div[@class='s-select']/select)[${n + 1}]`,
            { label: conditionInfo.then_show_value[n] },
          );
        }
      }
    }
  }

  /**
   * get data shipping in product detail
   * @param row
   * @param column
   * @returns
   */
  async getDataShiping(row: number, column: number) {
    // eslint-disable-next-line max-len
    const xpath = `//span[normalize-space()='Select country to view']/parent::div/following-sibling::div//tbody//tr[${row}]//td[${column}]`;
    let data = await this.getTextContent(xpath);

    if (!data.includes("Shipping")) {
      data = removeCurrencySymbol(data);
    }
    return data;
  }

  /**
   * Get data shipping in product detail V2
   */
  async getDataShippingV2(): Promise<{
    shippings: Array<{
      shipping_method: string;
      shipping_fee_first_item: string;
      shipping_fee_additional_item: string;
      shipping_est_profit: string;
    }>;
  }> {
    const resp = {
      shippings: [],
    };

    const shippingXpath = `//span[normalize-space()='Select country to view']/parent::div/following-sibling::div//tbody/tr`;
    const countShipping = await this.page.locator(shippingXpath).count();
    for (let index = 1; index <= countShipping; index++) {
      const data = await this.page.locator(`(${shippingXpath})[${index}]/td`).allInnerTexts();
      resp.shippings.push({
        shipping_method: data[0],
        shipping_fee_first_item: data[1],
        shipping_fee_additional_item: data[2],
        shipping_est_profit: data[3],
      });
    }

    return resp;
  }

  /**
   * Get data variant in product detail
   */
  async getDataVariant(): Promise<Array<Array<string>>> {
    const resp = [];
    const varintXpath = `//table[contains(@id,'all-variants')]/tbody/tr[position() > 1]`;
    const countVariant = await this.page.locator(varintXpath).count();
    for (let index = 1; index <= countVariant; index++) {
      const data = await this.page.locator(`(${varintXpath})[${index}]/td`).allInnerTexts();
      resp.push(data);
    }

    return resp;
  }

  /**
   * Get product name
   */
  async getProductName(): Promise<string> {
    return this.page.locator(`(//h1)[1]`).innerText();
  }

  /**
   * select country in product detail
   * @param country
   */
  async selectCountryToView(country: string) {
    const xpathCountryDroplist = "//span[normalize-space()='Select country to view']//following-sibling::div/select";
    const countryDroplist = this.page.locator(xpathCountryDroplist);
    await countryDroplist.scrollIntoViewIfNeeded();
    await countryDroplist.selectOption({ label: country });
  }

  /**
   * delete product in edit product admin detail page
   */
  async deleteProductInProductDetail() {
    const xpathBtnDeleteProduct = "//span[normalize-space()='Delete product']";
    await this.page.locator(xpathBtnDeleteProduct).click();

    const btnConfirmDeletePro = "//footer//button[normalize-space()='Delete product']";
    await (await this.page.waitForSelector(btnConfirmDeletePro)).click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * get specification data in product admin detail
   * @param type
   * @returns listSpec
   */
  async getSpecificationProDetail(type: string): Promise<string[]> {
    const totalRow = await this.page.locator("//div[@class = 'specification']//tbody//tr").count();
    let column;

    if (type === "name") {
      column = 1;
    }
    if (type === "value") {
      column = 2;
    }

    const listSpec = [];
    for (let i = 1; i <= totalRow; i++) {
      const specData = await this.page.innerText(`(//div[@class = 'specification']//tbody//tr)[${i}]/td[${column}]`);
      listSpec.push(specData);
    }
    return listSpec;
  }

  /**
   * create new group in editor
   * @param currentGroup : name group after click icon create group
   * @param newGroup : name group after edit group
   */
  async createGroupLayer(currentGroup: string, newGroup: string) {
    await this.page.click("//span[@place='action']//button[@class='s-button is-outline is-small']");
    await this.page.dblclick(`//span[normalize-space()="${currentGroup}"]`);
    await this.page.waitForTimeout(2000);
    await this.page.fill(
      `//div[child::span[normalize-space()="${currentGroup}"]]//preceding-sibling::div//input`,
      newGroup,
    );
  }

  /**
   * calculate est profit with variant
   * @param paymenFeeRate is rate of payment fee, default is 0.03
   * @param shippingFee is shipping checkout
   * @param processingFeeRate is rate proceesing fee of product, default is 0.04
   * @param sellingPrice is selling price of product
   * @param baseCost is base cost of variant, plusbase charge merchant
   * @param shippingCost is shipping cost of variant, plusbase charge merchant
   * Returns est profit of variant
   */
  async calculateEstProfit(
    paymenFeeRate: number,
    shippingFee: number,
    processingFeeRate: number,
    sellingPrice: number,
    baseCost: number,
    shippingCost: number,
  ): Promise<number> {
    const paymenFee = (shippingFee + sellingPrice) * paymenFeeRate;
    const estProfit = (sellingPrice - baseCost - paymenFee + shippingFee - shippingCost) * (1 - processingFeeRate);
    return Number(estProfit.toFixed(2));
  }

  /**
   * Click view shipping on product detail
   */
  async clickViewShipping() {
    await this.page.click("(//div[normalize-space()='View'])[1]//a");
    await this.page.waitForSelector("//div[normalize-space()='Shipping fee']");
  }

  /**
   * Select value in the drop-down list
   * @value là giá trị muốn select trong drop-list
   * @index là vị trí của drop-list
   */
  async selectDataViewShipping(value: string, index: number) {
    const droplist = this.page.locator(`(//select[@class=''])[${index}]`);
    await droplist.selectOption({ label: `${value}` });
  }

  /**
   * Create combo in product PlusBase
   * @param variant variant của product
   * @param countCombo số lượng variant trong combo
   */
  async createCombo(variant: VariantCombo, countCombo: number, sellingPrice: string) {
    await this.page.locator("//a[contains(text(),'Create combo')]").click();
    await this.page.waitForSelector("//p[@class='title']");
    await this.page.locator("//input[contains(@placeholder,'Select option')]").click();
    await this.page.locator("//div[normalize-space()='Size']").click();
    for (let i = 0; i < countCombo; i++) {
      await this.page.locator("//input[contains(@placeholder,'Choose variant')]").click();
      await this.page
        .locator(`//*[contains(@class, 's-select') and normalize-space()='${variant[i].variant_name}']`)
        .click();
      await this.page
        .locator("(//div[@class='s-input']//input[@class='s-input__inner'])[2]")
        .fill(`${variant[i].quantity}`);
    }
    await this.page.locator("(//input[@class='s-input__inner combo__expand-prefix'])[1]").fill(sellingPrice);
    await this.hoverThenClickElement(
      "(//input[@class='s-input__inner combo__expand-prefix'])[1]//..",
      "(//span[contains(@class,'cursor-pointer is-default')]//i)[1]",
    );
  }

  /**
   * Upload image preview or print file
   * @imageNames is list image name
   */
  async uploadImagePreviewOrPrintfile(imageName: string): Promise<void> {
    await this.page.waitForSelector("//div[@class='editor__container']");
    const btnUploadPreview = this.page.locator("//label[normalize-space()='Upload your Preview image']");
    if (await btnUploadPreview.isVisible()) {
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent("filechooser"),
        this.page.locator("//label[normalize-space()='Upload your Preview image']").click(),
      ]);
      await fileChooser.setFiles(`./data/shopbase/${imageName}`, { timeout: 150000 });
      await this.waitForElementVisibleThenInvisible("(//img[@class='sbase-spinner'])[1]");
    } else {
      await this.page
        .locator(
          // eslint-disable-next-line max-len
          "//label[normalize-space()='Upload your Print template' or normalize-space()='Upload your Print template']//parent::div//following-sibling::input[@type='file']",
        )
        .setInputFiles(`./data/shopbase/${imageName}`);
      await this.waitForElementVisibleThenInvisible("(//img[@class='sbase-spinner'])[1]");
    }
    await this.page.waitForSelector("//span[contains(@data-label,'Replace')]", { timeout: 60000 });
    await this.waitForElementVisibleThenInvisible("(//img[@class='sbase-spinner'])[1]");
    await this.waitForElementVisibleThenInvisible("(//div[@class='s-progress-bar'])[1]");
    await this.page.waitForSelector("//span[contains(@data-label,'Delete')]", { timeout: 60000 });
  }

  /**
   * Wait for element visible
   */
  async waitBtnDeleteVisible(): Promise<void> {
    await this.page.locator("//span[@data-label='Delete']").isVisible();
  }

  /**
   * Click icon back Image Preview or Print file
   */
  async clickIconBackImagePreviewOrPrintfile(): Promise<void> {
    await this.page.waitForSelector("//div[contains(@class,'border-header')]//i[contains(@class,'mdi-chevron-left')]");
    await this.page.dblclick("//div[contains(@class,'border-header')]//i[contains(@class,'mdi-chevron-left')]");
  }

  /**
   * edit variant in block Variant options
   * @param oldVariant : variantName/ variantValue
   * @param newVariant : variantName/ variantValue
   */
  async editVariantProduct(oldVariant: string, newVariant: string, index = 1) {
    await this.page.locator(`(//input[@placeholder='${oldVariant}'])[${index}]`).fill(newVariant);
    await this.clickOnBtnWithLabel("Save");
  }

  /**
   * Click icon Edit variant product
   * @param variantName
   */
  async clickIconEditVariant(variantName) {
    await this.page
      .locator(`//td[text()='${variantName}']//following-sibling::td//span[@data-label='Edit']//button`)
      .click();
  }

  /**
   * Click icon Delete variant product
   * @param variantName
   */
  async deleteVariant(variantName) {
    await this.page
      .locator(`//td[contains(text(),'${variantName}')]//following-sibling::td//span[@data-label='Delete']//button`)
      .click();

    await this.clickOnBtnWithLabel("Delete", 1);
  }

  /**
   * Calculate base cost combo
   * @param variantCombo
   * Reuturn base cost of combo
   */
  async calculateBaseCostCombo(variantCombo: string[]): Promise<string> {
    let baseCostCombo = 0;
    for (let i = 0; i < variantCombo.length; i++) {
      const baseCostVariant = Number(
        await this.getTextContent(`(//td[normalize-space()='${variantCombo[i]}']/preceding-sibling::td)[last()]`),
      );
      baseCostCombo = baseCostCombo + baseCostVariant;
    }
    return baseCostCombo.toFixed(2);
  }

  /**
   * Calculate shipping fee combo
   * @param comboNumber
   * @param lineShip
   * Return shipping fee of combo
   */
  async calculateShippingFeeCombo(comboNumber: number, lineShip: string): Promise<string> {
    const xpathShippingFee = `(//span[normalize-space()='${lineShip}']/following::span)`;
    const shippingFeeFirstItem = Number(removeCurrencySymbol(await this.getTextContent(xpathShippingFee + "[1]")));
    const shippingFeeAdditionalItem = Number(removeCurrencySymbol(await this.getTextContent(xpathShippingFee + "[2]")));
    const shippingFeeCombo = shippingFeeFirstItem + (comboNumber - 1) * shippingFeeAdditionalItem;
    return shippingFeeCombo.toFixed(2);
  }

  /**
   * Get attribute value of option variant
   * @param option
   * @param attribute
   * Return attribute value
   */
  async getAttributeValueOptionVariant(optionName: string, attribute: string): Promise<string> {
    const attributeValue = await this.page.getAttribute(
      `//div[@class='s-form-item' and descendant::label[text()='${optionName}']]//input`,
      attribute,
    );
    return attributeValue;
  }

  async setProductTitle(title: string) {
    await this.page.fill("(//h2[normalize-space()='Title']/following-sibling::div/input)", title);
  }

  async setProductDescription(description: string) {
    await this.page
      .frameLocator("//iframe[contains(@id,'tiny-vue')]")
      .locator("//body[@id='tinymce']")
      .fill(description);
  }

  async setProductMedias(medias: string) {
    const listImage = medias.split(",").map(item => item.trim());
    for (let i = 0; i < listImage.length; i++) {
      await this.page
        .locator("//a[normalize-space()='Add media']/following-sibling::input[@type='file']")
        .setInputFiles(appRoot + `/data/shopbase/${listImage[i]}`);
    }
  }

  async setProductMediasByURL(mediasURL: string) {
    const listImageUrl = mediasURL.split(",").map(item => item.trim());
    for (let i = 0; i < listImageUrl.length; i++) {
      await this.page.click("//*[text()[normalize-space()='Add media from URL']]");
      await this.page.waitForSelector("//input[@id='url']", { timeout: 9000 });
      await this.page.fill("//input[@id='url']", listImageUrl[i]);
      await this.clickOnBtnWithLabel("Add media");
      await this.page.waitForSelector("//input[@id='url']", { state: "hidden", timeout: 9000 });
    }
  }

  async setProductType(productType: string) {
    await this.page.fill(this.xpathProductTypeTxt, productType);
  }

  async setProductVendor(productVendor: string) {
    await this.page.fill(this.xpathVendorTxt, productVendor);
    await this.page.press(this.xpathVendorTxt, "Enter");
  }

  async setProductTags(tags: string, isSelectedItem?: boolean) {
    await this.page.waitForSelector(
      "//input[@placeholder='Vintage, cotton, summer' or @placeholder='reviewed, packed, delivered']",
    );
    await this.page.click(
      "//input[@placeholder='Vintage, cotton, summer' or @placeholder='reviewed, packed, delivered']",
    );
    await this.page.waitForSelector(
      "//span[@class='s-dropdown-item is-hovered' or normalize-space()='No results for'] | //h3[normalize-space()='Frequently used tags']",
    );
    await this.page.fill(
      "//input[@placeholder='Vintage, cotton, summer' or @placeholder='reviewed, packed, delivered']",
      tags,
    );
    await this.page.waitForTimeout(3000);
    if (!isSelectedItem) {
      await this.page
        .locator("//input[@placeholder='Vintage, cotton, summer' or @placeholder='reviewed, packed, delivered']")
        .press(",");
    } else {
      await this.page.waitForSelector(
        `//span[contains(@class, 's-dropdown-item')]//span[normalize-space()= '${tags.toLowerCase()}']`,
      );
      await this.page.click(
        `//span[contains(@class, 's-dropdown-item')]//span[normalize-space()= '${tags.toLowerCase()}']`,
      );
    }
  }

  async setProductPrice(price: string) {
    await this.page.fill(this.xpathInputFollowId("price"), price);
  }

  async setProductComparePrice(comparePrice: string) {
    await this.page.fill(this.xpathInputFollowId("compare_price"), comparePrice);
    await this.page.press(this.xpathInputFollowId("compare_price"), "Enter");
  }

  async setProductCostPerItem(itemCost: string) {
    await this.page.fill(this.xpathInputFollowId("cost_price"), itemCost);
    await this.page.press(this.xpathInputFollowId("cost_price"), "Enter");
  }

  async setProductSKU(sku: string) {
    await this.page.fill(this.xpathInputFollowId("sku"), sku);
    await this.page.press(this.xpathInputFollowId("sku"), "Enter");
  }

  async setProductBarCode(barCode: string) {
    await this.page.fill("//input[@id='barcode']", barCode);
    await this.page.press("//input[@id='barcode']", "Enter");
  }

  async setInventoryPolicy(inventoryPolicy, quantity: string) {
    await this.page.selectOption(this.xpathInventoryPolicySlt, { label: `${inventoryPolicy}` });
    await this.setProductQuantity(quantity);
  }

  async setProductQuantity(quantity: string) {
    await this.page.fill("//input[@id='quantity']", quantity);
  }

  async setProductWeight(weight: string) {
    await this.page.fill(this.xpathWeightTxt, weight);
  }

  async setProductWeightUnit(weightUnit: "kg" | "g" | "lb" | "oz") {
    await this.page.click(
      `//p[contains(., 'Weight')]//following::div[contains(@class, 'select')]
        //option[@value='${weightUnit}']`,
    );
  }

  async setWebSEO(pageTitle: string, metaDescription: string) {
    await this.clickOnBtnWithLabel("Edit website SEO");
    await this.clearInPutData("//div[child::label[text()='Page title']]//following-sibling::div//input");
    await this.page.fill("//div[child::label[text()='Page title']]//following-sibling::div//input", pageTitle);
    await this.page.fill(this.xpathMetaDescriptionTxt, metaDescription);
  }

  async getInputValue(xpath: string): Promise<string> {
    return await this.page.locator(xpath).inputValue();
  }

  async verifySelectOptions(xpath: string, options: Array<string>): Promise<boolean> {
    const optionsLength = await this.page.locator(xpath).count();
    for (let i = 1; i <= optionsLength; i++) {
      const option = (await this.page.locator(`${xpath}[${i}]`).textContent()).trim();
      if (!options.includes(option)) {
        return false;
      }
    }

    return true;
  }

  /**
   * I count the quantity of variant in the product
   * @returns the quantity of variant in the product
   */
  async countQuantityOfVariant(): Promise<number> {
    await this.page.waitForSelector("//a[normalize-space()='Edit options']");
    return await this.page.locator("//table[@id='all-variants']//td/a").count();
  }

  /**
   * select action on product list
   * @param action action name trong list action tại trang product list
   */
  async goToActionProductDetail(action: string, index: number) {
    await this.page.click(`(//span[@class='s-check'])[${index}]`);
    await this.page.click("//button[span[text()[normalize-space() = 'Action']]]");
    await this.page.click(`//span[text()[normalize-space() = '${action}']]`);
  }

  /**
   * I add variants for the product
   * @param productVariant info of variant for the product
   */
  async addVariants(productVariant: ProductVariant) {
    await this.page.waitForSelector("//a[normalize-space()='Add variant']");
    await this.page.click("//a[text()='Add variant']");
    // if has param multiple_option then not config param: value_size, value_color, value_style
    if (productVariant.multiple_option) {
      // create max 3 option
      let maxTotalOption = 3;
      for (const optionInfo of productVariant.multiple_option) {
        if (
          !optionInfo.option_name ||
          !optionInfo.option_name.length ||
          !optionInfo.option_values ||
          !optionInfo.option_values.length
        ) {
          return;
        }
        if (optionInfo.add_option) {
          await this.page.click("//button[normalize-space()='Add another option']");
        }
        await this.page.fill("(//input[@id='option-name'])[last()]", optionInfo.option_name);
        await this.inputOptionValues(optionInfo.option_values);
        await this.page.click("(//input[@id='option-name'])[last()]");
        maxTotalOption--;
        if (maxTotalOption == 0) {
          break;
        }
      }
      await this.clickOnBtnWithLabel("Save changes");
      return;
    }
    if (productVariant.value_size) {
      await this.page.fill("(//input[@id='option-name'])[last()]", "Size");
      await this.inputOptionValues(productVariant.value_size);
      await this.page.click("(//input[@id='option-name'])[last()]");
    }
    if (productVariant.value_color) {
      await this.page.click("//button[normalize-space()='Add another option']");
      await this.page.fill("(//input[@id='option-name'])[last()]", "Color");
      await this.inputOptionValues(productVariant.value_color);
      await this.page.click("(//input[@id='option-name'])[last()]");
    }
    if (productVariant.value_style) {
      await this.page.click("//button[normalize-space()='Add another option']");
      await this.page.fill("(//input[@id='option-name'])[last()]", "Style");
      await this.inputOptionValues(productVariant.value_style);
      await this.page.click("(//input[@id='option-name'])[last()]");
    }
    await this.clickOnBtnWithLabel("Save changes");
  }

  /**
   * Select product on product list
   * @param productName name of product
   */
  async selectProduct(productName: string): Promise<void> {
    const listProduct = productName.split(",").map(item => item.trim());
    for (let i = 0; i < listProduct.length; i++) {
      await this.page.click(
        `//tr[descendant::*[text()[normalize-space()='${listProduct[i]}']]]//span[@class='s-check']`,
      );
      await this.waitUntilElementVisible("//table[@id='all-products']//button[normalize-space()='Action']");
    }
  }

  //Get number of products which were selected
  async getNumOfSelectedProduct(): Promise<number> {
    const strResult = await this.getTextContent("//span[contains(text(), 'products selected')]");
    const result = parseInt(strResult.replace(/\D/g, ""));
    return result;
  }

  /**
   * Click button View product SF on product detail page
   */
  async clickViewProductSF() {
    await this.page.click("(//*[child::*[text()[normalize-space()='View']]])[1]");
    await this.waitUntilElementInvisible("//h1[contains(@class,'product__name-product')]");
  }

  /**
   * get variants of the product
   * @param variants info of variant for the product
   */
  async getVariantByAPI(
    authRequest: APIRequestContext,
    domain: string,
    productId: number,
    variants: Variants,
  ): Promise<Variants[]> {
    const response = await authRequest.get(`https://${this.domain}/admin/products/${productId}.json`);
    const variantsInfo = [];
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const reportData = jsonResponse.product.variants;
      for (let i = 0; i < reportData.length; i++) {
        const variantInfoApi = this.cloneObject<Variants>(variants);
        if (variantInfoApi.title) {
          variantInfoApi.title = reportData[i].title;
        }
        if (variantInfoApi.sku) {
          variantInfoApi.sku = reportData[i].sku;
        }
        if (variantInfoApi.option3) {
          variantInfoApi.option3 = reportData[i].option3;
        }
        if (variantInfoApi.option2) {
          variantInfoApi.option2 = reportData[i].option2;
        }
        if (variantInfoApi.option1) {
          variantInfoApi.option1 = reportData[i].option1;
        }
        if (variantInfoApi.price) {
          variantInfoApi.price = reportData[i].price;
        }
        if (variantInfoApi.compare_at_price) {
          variantInfoApi.compare_at_price = reportData[i].compare_at_price;
        }
        if (variantInfoApi.weight) {
          variantInfoApi.weight = reportData[i].weight;
        }
        if (variantInfoApi.weight_unit) {
          variantInfoApi.weight_unit = reportData[i].weight_unit;
        }
        variantsInfo.push(variantInfoApi);
      }
      return variantsInfo;
    }
  }

  /**
   * I delete the last image
   */
  async deleteLastImage() {
    await this.page.locator("//h3[text()='Personalization']").scrollIntoViewIfNeeded();
    await this.page.click("(//i[@class='icon-big cursor-pointer m-l-sm'])[last()]");
    await this.clickOnBtnWithLabel("Save changes");
    await this.page.waitForSelector("//div[text()='Product was successfully saved!']");
  }

  /**
   * Delete product on product list
   * @param productName name of product
   */
  async deleteProductOnProductList(productName: string): Promise<void> {
    await this.goToProductList();
    await this.page.waitForLoadState("networkidle");
    await this.searchProdByName(productName);
    await this.page.waitForSelector("//div[contains(text(),'Title contains')]");
    if (!(await this.genLoc("//p[contains(text(),'Could not find any products matching')]").isVisible())) {
      await this.selectAllProducts();
      await this.clickOnBtnWithLabel("Action");
      await this.genLoc("text=Delete selected products").click();
      await this.clickOnBtnWithLabel("Delete");
      await this.isToastMsgVisible("Deleting 1 products on the background. Please refresh after a few minutes");
      await this.page.waitForSelector(this.xpathProductTableHeader);
    }
  }

  /**
   * delete list product by key search
   * @param productName
   */
  async deleteListProductByKey(key: string): Promise<void> {
    await this.searchProdByName(key);
    if (await this.genLoc("//p[contains(text(),'Could not find any products matching')]").isVisible()) {
      return;
    }

    await this.page.click(`//span[@data-label="Select all products"]`);
    const textSelected = await this.genLoc("//div[@class='action-table']//span[2]").textContent();
    const numberSelected = textSelected.split(" ")[0];
    await this.waitUntilElementVisible("//button[normalize-space()='Action']");
    await this.clickOnBtnWithLabel("Action");
    await this.genLoc("text=Delete selected products").click();
    await this.clickOnBtnWithLabel("Delete");
    await this.isToastMsgVisible(
      `Deleting ${numberSelected} products on the background. Please refresh after a few minutes`,
    );
  }

  /**
   * Delete tag on product detail page
   * @param tagName name of tag
   */
  async deleteTagOnProductDetailPage(tagName: string): Promise<void> {
    await this.page.click(
      `//div[contains(@class,'tag-list-items')]//span[normalize-space()='${tagName.toLowerCase()}']//a[@class='s-delete is-small']`,
    );
  }

  /**
   * Wait for inport product success
   */
  async waitFortImportProductSuccess(retries = 1): Promise<void> {
    do {
      await this.clickProgressBar();
      await this.page.waitForSelector(
        "(//div[@class='s-dropdown-content']//div[contains(@class,'text-bold text-capitalize')])[1]",
      );
      const status = await this.page
        .locator("(//div[@class='s-dropdown-content']//span[contains(@class,'text-capitalize status-tag')]//span)[1]")
        .textContent();
      if (status.trim() === "Processing") {
        await this.page.reload();
        await this.page.waitForTimeout(5000);
        retries--;
      } else {
        break;
      }
    } while (retries > 0);
  }

  /**
   * Select image for variant from the product images
   * @param index index of image
   */
  async selectAllVariantImage() {
    const variantQuantity = await this.countQuantityOfVariant();
    for (let i = 1; i <= variantQuantity; i++) {
      await this.page.click(`(//table[@id='all-variants']//img)[${i}]`);
      await this.page.waitForSelector("//div[@id='variant-select-image-modal']//p[@class='title']");
      await this.page.click(`(${this.xpathProductImageList})[last()-${i}+1]`);
      if (await this.page.locator('//div[contains(@class,"image-preview")]').isVisible()) {
        await this.page.click('//button[child::span[text()="Done"]]');
      }
      await this.page.click("//div[@id='variant-select-image-modal']//button[normalize-space()='Save']");
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * Function to edit product and variant following row
   * @param productValue check and fill data on field
   * @param rowIndex row want to edit
   */
  async editProductInBulkEditor(valueEdit: string, rowIndex: number, field: string) {
    const xpathTitle = `//div[@class='ag-center-cols-clipper']//div[@row-id='${rowIndex}']//div[@col-id='${field}']`;
    if (valueEdit) {
      await scrollUntilElementIsVisible({
        page: this.page,
        scrollEle: this.page.locator(".ag-center-cols-viewport"),
        viewEle: this.page.locator(xpathTitle),
      });
      await this.page.dblclick(xpathTitle);
      if (field != "tags") {
        await this.page.fill(xpathTitle + "//input[@type='text']", valueEdit);
      } else {
        await this.page.click("//div[@class='s-input']");
        await this.page.fill("//input[@placeholder='Vintage, cotton, summer']", valueEdit);
      }
    }
  }

  /**
   * Function select product by ID
   * @param productID ID của product
   */
  async selectProductByID(productID: number) {
    await this.page.click(`//input[@value='${productID}']//parent::label`);
  }

  /**
   * I click view on online store
   */
  async clickViewProductOnOnlineStore() {
    await this.page.hover(`(${this.xpathFirstProduct})[1]`);
    await this.page.locator(this.xpathViewOnlineIcon).first().click();
  }

  /**
   * I get all value of radio field in custom option
   * @param name name of radio field
   * @returns values
   */
  async getAllRadioValueInCustomOption(name: string): Promise<Array<string>> {
    const xpathAllValues = `//div[normalize-space()='${name}']//ancestor::div[@role='tab']/following-sibling::div//input[@type='text' and @placeholder='Enter a value']`;
    const valueQuantity = await this.page.locator(xpathAllValues).count();
    const values = [];
    for (let i = 1; i <= valueQuantity; i++) {
      values.push(await (await this.page.locator(`(${xpathAllValues})[i]`).elementHandle()).getProperty("_value"));
    }
    return values;
  }

  /**
   * Function để select alls product trên 1 page
   */
  async selectAllProductOnListProduct() {
    const checkPage = this.page.locator("//div[@class='action-table']");
    if (await checkPage.isVisible()) {
      await this.page.click("//div[@class='action-table']//span[@class='s-check']");
    } else {
      await this.page.click("(//span[@data-label='Select all products']//label)[1]");
    }
  }

  async getXpathProductName(productName: string): Promise<string> {
    return `(//*[normalize-space()="${productName}"])[1] `;
  }

  /**
   * get count product
   * */
  async getNumberProductByAPI(authRequest: APIRequestContext, domain: string): Promise<number> {
    const response = await authRequest.get(`https://${domain}/admin/products/count.json`);
    expect(response.ok()).toBeTruthy();
    const responseProdAPI = await response.json();
    const numberOfProds = responseProdAPI.count;
    return numberOfProds;
  }

  /**
   * get action progress using API
   * */

  async getProgressByAPI(domain: string, accessToken: string) {
    const response = await this.page.request.get(`https://${domain}/admin/action-progress.json`, {
      headers: {
        "X-ShopBase-Access-Token": accessToken,
      },
    });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * count line ship on product detail
   * @returns number of shipping
   */
  async countLineShip(): Promise<number> {
    return await this.page.locator(`(//table/tbody)[1]/tr`).count();
  }

  /**
   * select base prod on Fulfillment setup
   * @param productName title of product
   */
  async selectBaseProductOnFulfillmentSetup(baseProduct: string) {
    const iconX = this.page.locator("(//div[@class='sb-flex sb-input__body']//span)[3]");
    if (await iconX.isVisible()) {
      await this.page.click("(//div[@class='sb-flex sb-input__body']//span)[3]");
    }
    await this.page.click(
      "//h5[normalize-space()='To be fulfilled with']//parent::div//input[@class='sb-input__input']",
    );
    await this.page.click(`(//div[normalize-space()='${baseProduct}'])[3]`);
    await this.page.waitForTimeout(3000);
  }

  /**
   * upload artwork on Fulfillment setup screen
   * @param artwork name of file artwork
   */
  async uploadArtworkOnFulfillmentSetup(sideName: string, filePath: string) {
    await this.page.locator(`//h5[normalize-space()='${sideName}']//parent::div//input`).setInputFiles(`${filePath}`);
  }

  /**
   * open Fulfillment setup screen
   * @param appName name of app
   */
  async openFulfillmentSetupScreen(appName: string) {
    await this.page.waitForTimeout(2000);
    await this.page.click(this.xpathMoreOptions);
    await this.page.waitForTimeout(2000);
    await this.page.click(`//p[normalize-space()='${appName}']//parent::div//button`);
    await this.page.waitForSelector("(//div[normalize-space()='Map products and variants to fulfill'])[3]");
  }

  /**
   * config cho phép hiển thị product ở online store list page: Homepage, collection page, search page...
   */
  async selectProductOnlineStore() {
    await this.genLoc("//span[text()='Online store listing pages']//ancestor::label//span[@class='s-check']").click();
    await this.genLoc("//div[@class='row save-setting-content']//button[normalize-space()='Save changes']").click();
    await this.page.waitForSelector(
      "//div[@class='s-toast is-dark is-bottom']//div[normalize-space()='Product was successfully saved!']",
    );
  }

  /**
   * get product_id from current url
   */
  async getProductIDByURL(): Promise<string> {
    const url = this.page.url();
    const urlParts = url.split("/");
    const productId = urlParts[urlParts.length - 1];
    return productId;
  }

  /**
   *Map variant for product
   * @param mappingInfo varriant need mapping
   */
  async mapProductVariants(mappingInfo: Array<MappingInfo>) {
    for (let i = 0; i < mappingInfo.length; i++) {
      await this.page.click(`//span[normalize-space()='${mappingInfo[i].variant_product}']//preceding-sibling::span`);
      await this.page.click(
        `//span[normalize-space()='${mappingInfo[i].variant_product}']//ancestor::div[@class='row option-value']//button`,
      );
      await this.page.click(
        `(//div[contains(@class,'select-menu sb-text-left')]//label[normalize-space()='${mappingInfo[i].variant_base}'])[${mappingInfo[i].index}]`,
      );
    }
    if (await this.checkButtonVisible("Save")) {
      await this.clickOnBtnWithLabel("Save");
    }
  }

  /**
   * open Fulfillment setup screen
   * @param appName name of app
   */
  async removeMapProduct(appName: string, action: string) {
    if (await this.page.locator(this.xpathBtnWithLabel("Remove")).isVisible()) {
      await this.clickOnBtnWithLabel("Remove");
    }
    await this.page.click(`//p[normalize-space()='${appName}']//ancestor::div[@class='list-container']//i`);
    await this.page.click(
      `//p[normalize-space()='${appName}']//ancestor::div[@class='list-container']//span[normalize-space()='${action}']`,
    );
    if (await this.page.locator(this.xpathBtnWithLabel("Remove")).isVisible()) {
      await this.clickOnBtnWithLabel("Remove");
    }
  }

  /**
   * Count number variant in product list
   * @param authRequest: request API
   * @param domain: shop domain
   */
  async countNumberVariant(authRequest: APIRequestContext, domain: string) {
    const response = await authRequest.get(
      `https://${domain}/admin/products.json?limit=1000&sort_field=id&sort_mode=desc&fields=id,variants`,
    );
    let countVariant = 0;
    if (response.ok()) {
      const respProductRaw = await response.json();
      let countVariantRaw = 0;
      for (const i in respProductRaw.products) {
        countVariantRaw = respProductRaw.products[i].variants.length;
        countVariant = countVariant + countVariantRaw;
      }
    }
    return countVariant;
  }

  /**
   * Directly go to the domain url contain product ID
   * @param domain: domain shop
   * @param productID: Product ID that need to direct to the product detail
   */
  async goToProdDetailByID(domain: string, productID: number, waitSelector?: string): Promise<void> {
    await this.page.goto(`https://${domain}/admin/products/${productID}`);
    if (waitSelector) {
      await this.page.waitForSelector(waitSelector);
    } else {
      await this.page.waitForLoadState("load");
    }
  }

  /**
   * Export product
   * @param  exportProductInfo info export
   * @return path file export
   * */
  async exportProduct(exportProductInfo: ExportProductInfo, folder: string): Promise<string> {
    await this.page.click("//span[@data-label='Select all products']//span[@class='s-check']");
    await this.clickOnBtnLinkWithLabel("Export");
    await this.page.waitForSelector("//p[normalize-space()='Export products to CSV file']");
    if (exportProductInfo.ads_optimization) {
      await this.page.check(
        "//span[contains(normalize-space(),'Use IDs from the exported products for ads optimization (Facebook Ads, GMC,...) on your other stores.')]//preceding-sibling::span[@class='s-check']",
      );
    }
    if (exportProductInfo.product_export) {
      await this.page.check(
        `//div[@class="s-modal-body"]//span[normalize-space()="${exportProductInfo.product_export}"]`,
      );
    }
    if (exportProductInfo.file_format) {
      await this.page.check(`//div[@class="s-modal-body"]//span[normalize-space()="${exportProductInfo.file_format}"]`);
    }
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.clickButtonOnPopUpWithLabel("Export"),
    ]);
    const path = await download.suggestedFilename();
    await download.saveAs(`./data/${folder}/${path}`);
    return `./data/${folder}/${path}`;
  }

  /**
   * Export file template import product
   * @param  folder folder to save file
   * @return path file export
   * */
  async exportFileTemplateImportProduct(folder: string, skipOpenPopup?: boolean): Promise<string> {
    if (!skipOpenPopup) {
      await this.clickOnBtnLinkWithLabel("Import");
    }
    await this.page.waitForSelector("//a[normalize-space()='sample CSV template']");
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.clickOnTextLinkWithLabel("sample CSV template"),
    ]);
    const path = await download.suggestedFilename();
    await download.saveAs(`./data/${folder}/${path}`);
    return `./data/${folder}/${path}`;
  }

  /**
   * Edit selected variant in product detail
   * @param numbericalOrder : numberical order of the selected variant
   * @param optionNumber : option number
   * @param attribute : new attribute of the selected variant
   */
  async editVariant(numbericalOrder: number, optionNumber: number, attribute: string) {
    await this.page.locator(`(//i[contains(@class, 'pencil')])[${numbericalOrder}]`).click();
    await this.page.locator(`//input[@id='option${optionNumber}']`).fill(attribute);
  }

  /**
   * Close preview size guide in product details
   */
  async closePreviewSizeGuide(): Promise<void> {
    await this.page.locator("//button[contains(@class,'s-modal-close')]").click();
  }

  /**
   * Creat size chart for SBase in dashboard
   * @param sizeChartInfo
   */
  async createSizeChartSBase(sizeChartInfo: SizeChartInfo): Promise<void> {
    if (sizeChartInfo.style) {
      await this.page.fill("//input[@placeholder='Size chart style']", sizeChartInfo.style);
    }
    if (sizeChartInfo.image_local) {
      await this.page
        .locator(
          "//label[@class='s-upload s-control']//a[normalize-space()='Add image']//following-sibling::input[@type='file']",
        )
        .setInputFiles(appRoot + `/data/shopbase/${sizeChartInfo.image_local}`);
    }
    if (sizeChartInfo.image_url) {
      await this.page.click("//a[normalize-space()='Add image from URL']");
      await this.page.fill("//input[@placeholder='http://']", sizeChartInfo.image_url);
      await this.clickOnBtnWithLabel("Add image");
    }
    if (sizeChartInfo.description) {
      await this.page.waitForTimeout(3000);
      await this.page
        .frameLocator("//iframe[contains(@id,'tiny-vue')]")
        .locator("//body[@id='tinymce']")
        .fill(sizeChartInfo.description);
    }
    await this.page.waitForTimeout(1000);
    await this.clickOnBtnWithLabel("Save");
  }

  /**
   * Delete all size chart in dashboard
   */
  async deleteAllSizeChart() {
    if (await this.page.locator("//p[normalize-space()='You have no size chart yet']").isHidden()) {
      await this.genLoc("(//div[@id='table-sizechart']//span[@class='s-check'])[1]").click();
      await this.clickOnBtnWithLabel("Action");
      await this.page.click("//span[normalize-space()='Delete selected size charts']");
      await this.clickOnBtnWithLabel("Delete");
      await this.waitUntilElementVisible("//p[normalize-space()='You have no size chart yet']");
    }
  }

  // count variant product
  async countVariantProduct() {
    return await this.page.locator("//tr[descendant::img]").count();
  }

  /**
   * Wait for image loaded
   * @param xpathMediaContainer
   */
  async waitImagesLoaded(xpathMediaContainer: string) {
    try {
      await this.page.locator(`(${xpathMediaContainer})[1]`).scrollIntoViewIfNeeded();
      const countImageMockup = await this.page.locator(xpathMediaContainer).count();
      for (let i = 0; i < countImageMockup; i++) {
        await waitForImageLoaded(this.page, `(${xpathMediaContainer})[${i + 1}]`);
      }
      await this.page.waitForTimeout(3000);
    } catch (e) {
      throw TypeError("Crash: error when load image");
    }
  }

  /**
   * Wait status process in product page
   * @param status
   */
  async waitStatusProcess(status: string) {
    let textStatus;
    let i = 0;
    do {
      await this.clickProgressBar();
      textStatus = await this.getStatus();
      await this.page.waitForTimeout(3000);
      await this.page.click("//h2[normalize-space()='Products' or normalize-space()='Campaigns']");
      i++;
    } while (textStatus != status && i < 11);
  }

  async countProductOnProductList(): Promise<number> {
    return await this.page.locator("//tr[descendant::div[@class='product-name']]").count();
  }

  /**
   *
   * @param numbericalOrder index of variant
   */
  async clickEditVariantDetail(numbericalOrder: number) {
    await this.page.locator(`(//i[contains(@class, 'pencil')])[${numbericalOrder}]`).click();
  }

  /**
   * Get status of current variant value
   * @param variantValue value of variant
   * @returns
   */
  async getStatusVariantValue(variantValue: string): Promise<string> {
    await this.page.waitForSelector(`//input[@placeholder='${variantValue}']`);
    const value = await this.page.locator(`//input[@placeholder='${variantValue}']`).first().getAttribute("disabled");
    return value;
  }

  /**
   * Input values to option
   * @param values values of option
   */
  async inputOptionValues(values: string) {
    const dataset = values.split(",").map(item => item.trim());
    for (const data of dataset) {
      await this.page.fill(this.xpathOptionValues, data);
      await this.page.press(this.xpathOptionValues, ",");
    }
  }

  async countProductMedia(): Promise<number> {
    return await this.page.locator("//div[@class='media__container']/img").count();
  }

  /**
   * Open tab name on product list
   * @param tabName is the name tab
   */
  async clicktabNameOnProductList(tabName: string) {
    await this.page.click(`//p[normalize-space()='${tabName}']`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Open product detail
   * @param platform is shopbase, printbase or plusbase
   * @param productName is product name
   */
  async openDetailProduct(platform: string, productName: string) {
    switch (platform) {
      case "printbase":
        await this.navigateToMenu("Campaigns");
        await this.page.waitForSelector("//div[contains(text(),'CAMPAIGN')]");
        await this.page.fill(`//input[contains(@placeholder,'Search campaigns by name')]`, productName);
        await this.page.press(`//input[contains(@placeholder,'Search campaigns by name')]`, "Enter");
        await this.page.waitForSelector(
          "//span[@class='s-tag']//div[contains(text(),'Title contains')] | //div[@class='s-alert__content']",
        );
        await this.page.click(`(//div[@class = 'product-name' and normalize-space() = "${productName}"])[1]`);
        break;
      case "plusbase":
        await this.gotoProductDetailPlb(productName);
        break;
      default:
        await this.gotoProductDetail(productName);
    }
    await this.page.waitForSelector(`//h1[normalize-space()='${productName}']`);
  }

  /**
   * Get list tab on product detail when publish theme v3
   * @returns list tab name on product detail page
   */
  async getProductTab() {
    const countProductTab = await this.genLoc("//div[@class='product-tabs']//p").count();
    const productTabs = [];
    for (let i = 1; i <= countProductTab; i++) {
      const tabName = await this.getTextContent(`(//div[@class='product-tabs']//p)[${i}]`);
      productTabs.push(tabName);
    }
    return productTabs;
  }

  /**
   * Get url image block layout on design tab product detail
   * @param layoutName is layout name, example: Default layout, Custom layout
   * @returns url image
   */
  async getImageBlockLayout(layoutName: string): Promise<string> {
    const urlImage = await this.page.getAttribute(`//p[contains(text(),'${layoutName}')]//parent::div//img`, "src");
    const urlParts = urlImage.split("/");
    return urlParts[urlParts.length - 1];
  }

  /**
   * Function return info prod with api
   * @param id productID
   * @param customDomain
   * @param accessToken
   * @returns
   */
  async getProduct(id: number, customDomain?: string, accessToken?: string): Promise<GetProductAPIResponse> {
    if (accessToken && customDomain) {
      const response = await this.page.request.get(
        `https://${customDomain}/admin/digital-products/product/${id}.json?access_token=${accessToken}`,
      );
      if (!response.ok()) {
        return;
      }

      const jsonResponse = await response.json();
      return jsonResponse as GetProductAPIResponse;
    }
  }

  /**
   * Get xpath các tab trong trang all product dashboard
   * @param tabName : là các tab All, Available products, Unavailable products
   * @returns
   */
  getXpathTabProductListPage(tabName: string): string {
    return `//nav[contains(@class,'s-tabs-nav')]//p[normalize-space()='${tabName}']`;
  }

  /**
   * Get first product on All product page dashboard
   * @returns product name
   */
  async getFirstProductAvailable(): Promise<string> {
    await this.genLoc(this.getXpathTabProductListPage("Available products")).click();
    await this.page.waitForSelector("//div[contains(text(),'Published')]");
    await this.page.waitForSelector(this.xpathProductTableHeader);
    return await this.genLoc("((//tbody//tr)[1]//div[@class='product-name']//descendant::div)[last()]").innerText();
  }

  /**
   * Thay đổi trạng thái available cùa product trong trang All product dashboard
   * @param action : make available or make unavailable
   * @param products : là danh sách các product được chọn để thay đổi status
   */
  async makeAvailableOrUnavailableProduct(action: string, products?: string[]) {
    if (products) {
      for (let i = 0; i < products.length; i++) {
        await this.genLoc(`//div[normalize-space()='${products[i]}']//ancestor::tr//span[@class='s-check']`).click();
      }
    } else {
      await this.genLoc("//thead//span[@class='s-check']").click();
    }
    await this.genLoc("//div[@class = 'action-table']//span[contains(text(),'Action')]").click();
    await this.genLoc(`//span[normalize-space()='${action}']`).click();
    await this.genLoc(`//button[normalize-space()='${action}']`).click();
    await this.waitForElementVisibleThenInvisible("//div[@class='s-toast is-dark is-bottom']");
    await this.waitForElementVisibleThenInvisible(this.xpathTableLoad);
  }

  /**
   * Function return locator to edit the variant
   * @param index of the variant
   * @returns locator to edit the variant
   */
  async getLocatorEditVariant(index = "1"): Promise<Locator> {
    return this.page.locator(`(//table[@id='all-variants']//span[@data-label='Edit']/button)[${index}]`);
  }

  /**
   * Get data of variant in product detail page
   * @param body is index of body
   * @param column is index of column
   * @param row is index of row
   * @returns data of variant by table
   */
  async getDataProductVariant(body: number, column: number, row: number) {
    const xpath = `(//table[@id='all-variants']//tbody['${body}']//tr['${column}']//td['${row}'])[1]`;
    return await this.genLoc(xpath).innerText();
  }

  /**
   * Excuted download feed file by clicking the url link
   * @param feedName
   * @param folderName
   * @param fileName
   * @returns
   */
  async downloadFeedFile(feedName: string, folderName: string, fileName: string): Promise<string> {
    await this.goToProductFeedList();
    await this.goToProductFeedDetail(feedName);
    const xpathFeedURL = "//div[child::div[contains(text(),'URL')]]//a";
    while (await this.page.locator(xpathFeedURL).isHidden()) {
      await this.page.reload({ waitUntil: "networkidle" });
      await this.page.waitForSelector(this.xpathLabelProductFeedURL);
    }
    const [feedFile] = await Promise.all([
      this.page.waitForEvent("download"),
      this.clickOnElement("//div[child::div[contains(text(),'URL')]]//a"),
    ]);
    await feedFile.saveAs(`./data/${folderName}/${fileName}`);
    return `./data/${folderName}/${fileName}`;
  }

  /**
   * Check shipping on the feed file that's downloaded
   * Read and compare data at the first line until line title column
   * @param feedName
   * @param folderName
   * @param fileName
   * @param value
   * @returns
   */
  async shippingOnFeedFile(feedName: string, folderName: string, fileName: string, value: string): Promise<boolean> {
    const feedFile = await this.downloadFeedFile(feedName, folderName, fileName);
    const readFeedFile = await readFileCSV(feedFile, "\t");
    let checkData = false;
    for (let i = 0; i < readFeedFile.length; i++) {
      checkData = readFeedFile[i].includes(value);
      return checkData;
    }
  }

  /**
   * Get feed file url
   * @param feedName
   * @returns
   */
  async getFeedUrl(feedName: string): Promise<string> {
    await this.goToProductFeedList();
    await this.goToProductFeedDetail(feedName);
    const xpathFeedURL = "//div[child::div[contains(text(),'URL')]]//a";
    while (await this.page.locator(xpathFeedURL).isHidden()) {
      await this.page.reload({ waitUntil: "networkidle" });
      await this.page.waitForSelector(this.xpathLabelProductFeedURL);
    }
    return this.page.locator("//div[child::div[contains(text(),'URL')]]//a").getAttribute("href");
  }

  /**
   * Check archived variant alert whether it is visible or not
   * @returns
   */
  async hasArchivedVariantAlert() {
    return this.page.isVisible(this.xpathArchiveVariantAlert);
  }

  /**
   * Check archived variant alert whether it is visible or not
   * @returns
   */
  async isVisibleArchivedVariantAlert() {
    return this.page.isVisible("//h4[contains(.,'Disabled variants') and @class='s-modal-title']");
  }

  /**
   * Click button x to close popup creator popup create offer
   */
  async closePopupCreateOffer(): Promise<void> {
    await this.page.locator("//button[@class='s-modal-close is-large']").click();
  }

  /**
   * Input fields quantity discounts in product admin
   * @param variant variant của product
   */
  async inputQttDiscounts(offerData: OfferData): Promise<void> {
    //nhap thong tin cho offer
    await this.page.locator(this.offerQttName).fill(offerData.name);
    await this.page.locator(this.offerQttMsg).fill(offerData.message);
    const countOffer = offerData.qtt_discount.length;
    if (countOffer > 2) {
      for (let x = 0; x < countOffer - 2; x++) {
        await this.page.locator(`//span[normalize-space()='Add more']`).click();
      }
    }
    for (let i = 0; i < countOffer; i++) {
      await this.page.locator(`//input[@id='input-min-quantity-${i}']`).click();
      await this.page.locator(`//input[@id='input-min-quantity-${i}']`).fill(`${offerData.qtt_discount[i].minqtt}`);
      await this.page.locator(`//input[@id='input-value-discount-${i}']`).click();
      await this.page.locator(`//input[@id='input-value-discount-${i}']`).fill(`${offerData.qtt_discount[i].discount}`);
      await this.page.locator(`(//div[contains(@class,'s-select usell')])[${i + 1}]`).click();
      await this.page
        .locator(`(//div[contains(@class,'s-select usell')])[${i + 1}]//select`)
        .selectOption(`${offerData.qtt_discount[i].type}`);
    }
  }

  /**
   * Create quantity discounts in product admin
   * @param variant variant của product
   */
  async createQttDiscounts(offerData: OfferData): Promise<void> {
    await this.inputQttDiscounts(offerData);
    await this.page.locator("//button[normalize-space()='Add quantity discounts']").click();
  }

  /**
   * Xpath quantity discounts
   * @param nameOffer : name offer quantity discounts
   */
  getXpathQttDiscounts(nameOffer: string): string {
    return `//td[contains(@class, 'offer-name')]//span[normalize-space()='${nameOffer}']`;
  }

  /**
   * Update quantity discounts in product admin
   * @param variant variant của product
   */
  async updateQttDiscounts(offerData: OfferData): Promise<void> {
    await this.inputQttDiscounts(offerData);
    await this.page.locator(this.buttonSaveChanges).click();
  }

  /**
   * Xpath min quantity in quantity discounts offer
   * @param index : index offer
   */
  getXpathMinQttDiscounts(index: number): string {
    return `//input[@id='input-min-quantity-${index}']`;
  }

  /**
   * Xpath value discount in quantity discounts offer
   * @param index : index offer
   */
  getXpathValueDiscountQttDiscounts(index: number): string {
    return `//input[@id='input-value-discount-${index}']`;
  }

  /**
   * get text group variant
   */
  async getTextGroupVariant(): Promise<string> {
    return await this.getTextContent(`(//span[parent::td[@class='group-title']])[2]`);
  }

  /**
   * Xpath variant in product detail
   * @param variant : variant value
   */
  locatorVariant(variant: string): Locator {
    return this.page.locator(`//li[normalize-space()='${variant}']`);
  }

  /**
   * Xpath text box in variant detail
   * @param label : label textbox
   */
  locatorTextboxByLabel(label: string): Locator {
    return this.page.locator(`//label[text()='${label}']//parent::div//following-sibling::div//input`);
  }

  async getTooltipInCreateCombo(): Promise<string> {
    return await this.getTextOnTooltip(
      `//div[@class='table-combo-desktop']//div[text()='Combo name']/following-sibling::div//i`,
      `//div[@class='table-combo-desktop']//div[text()='Combo name']/following-sibling::div//span[2]`,
    );
  }

  /**
   * Get a list of product ids in page
   * @returns
   */
  async getProdIdList(): Promise<number[]> {
    const prodIdList: number[] = [];

    do {
      const arrProds = await this.page.locator("//a[descendant::div[@class='product-name']]").all();
      for (let i = 0; i < arrProds.length; i = i + 1) {
        const prodHref = await arrProds[i].getAttribute("href");
        const prodId = parseInt(prodHref.split("/").pop() || "0");
        prodIdList.push(prodId);
      }
      if (await this.page.isVisible("//a[@class='s-pagination-next' and @disabled = 'disabled']")) {
        await this.clickBtnNextPage();
      }
    } while (await this.page.isVisible("//a[@class='s-pagination-next' and @disabled = 'disabled']"));

    return prodIdList;
  }

  /**
   * Check value is in array
   * @param array: input array
   * @param value: Value to compare with the input array
   * @param conditionValue: Comparative conditions
   * @returns
   */
  checkFilterValue(array, value, conditionValue): boolean {
    switch (conditionValue) {
      case "Doesn't contain":
        return !array.includes(value);
      case "Contains":
        return array.includes(value);
      case "More than":
        return array.some(item => value < item);
      case "Less than":
        return array.some(item => value > item);
      case "Equals to":
        return array.some(item => value == item);
      default:
        return false;
    }
  }

  /**
   * Remove all tags in the product
   */
  async removeAllTags() {
    const xpathRemoveTag =
      '//div[descendant::h2[normalize-space()="Tags"]]/following-sibling::div[contains(@class,"tag-manager")]//span[contains(@class,"s-tag") and not(@style="display: none;")]/a';
    const tagsQuantity = await this.page.locator(xpathRemoveTag).count();
    for (let i = tagsQuantity; i > 0; i--) {
      await this.page.click(`(${xpathRemoveTag})[${i}]`);
    }
  }

  /**
   * get text aware khi hover vào textbox Shoe size trong section Variant option
   * @returns text aware shoe size
   */
  async getTextAwareShoeSize(): Promise<string> {
    return await this.getTextOnTooltip(
      `//input[@placeholder='Shoe Size']`,
      `(//div[contains(@class,'variant-option')]//span)[1]`,
    );
  }

  /**
   * select size in drop-down list convert size
   * @param option: Select the size type you would like to sell | Select the size type you want to convert from
   * @param shoeSize: EU size|  US size| CN size| UK size | CA size| Other

   */
  async selectShoeSize(option: string, shoeSize: string) {
    const droplist = this.page.locator(
      `//div[contains(text(),"${option}")]/parent::div/following-sibling::div//select`,
    );
    await droplist.scrollIntoViewIfNeeded();
    await droplist.selectOption({ label: `${shoeSize}` });
  }

  /**
   * Input value alternative link
   * @param value
   */
  async fillAlternativeLink(value: string) {
    const xpathSearch = this.page.locator("(//input[@placeholder='Enter alternative link'])[1]");
    await xpathSearch.focus({ timeout: 5000 });
    await xpathSearch.fill(value);
    await this.clickElementWithLabel("button", "Confirm");
  }

  async searchCampaign(productName: string) {
    await this.page.fill(`//input[contains(@placeholder,'Search campaigns by name')]`, productName);
    await this.page.press(`//input[contains(@placeholder,'Search campaigns by name')]`, "Enter");
    await this.page.waitForSelector(
      "//span[@class='s-tag']//div[contains(text(),'Title contains')] | //div[@class='s-alert__content']",
    );
    await this.page.click(`(//div[@class = 'product-name' and normalize-space() = "${productName}"])[1]`);
  }

  /**
   * Get total product  using api
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @returns
   */

  async getTotalProductAfterSearch(accessToken: string, domain: string, data?: Search) {
    let response;
    if (data) {
      response = await this.page.request.get(
        `https://${domain}/admin/products/count.json?search=${data.search}&use_dropship_product=${data.use_dropship_product}&title_mode=${data.title_mode}&title=${data.title}&query=${data.query}`,
        {
          headers: {
            "X-ShopBase-Access-Token": accessToken,
          },
        },
      );
    } else {
      response = await this.page.request.get(`https://${domain}/admin/products/count.json`, {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      });
    }
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.count;
  }

  /**
   * edit description of POD on dashboard
   * @param productName
   * @param description
   */
  async editPODDescription(productName, description) {
    await this.goto("admin/apps/print-hub/catalog");
    await this.page.locator(this.xpathProduct.getOptionButtonByPOD(productName)).click();
    await this.page.locator(this.xpathProduct.updateDescriptionPOD(productName)).click();
    await this.page.waitForSelector(this.editDescriptionForm, { state: "visible" });
    await this.page.locator(this.editDescriptionForm).frameLocator("//iframe").locator("body").click();
    await pressControl(this.page, "A");
    await this.page
      .locator(this.editDescriptionForm)
      .frameLocator("//iframe")
      .locator("body")
      .pressSequentially(description);

    await this.page.locator(`//button//span[normalize-space()='Save']`).click();
    await this.page.waitForSelector(this.successToast, { state: "visible" });
    await this.page.waitForSelector(this.successToast, { state: "hidden" });
  }

  /**
   * Hàm đợi import product thành công
   * @param file đường dẫn file csv import hoặc tên file csv
   */
  async waitImportProductSuccess(file: string): Promise<void> {
    const stringParts = file.split("/");
    const fileName = file.includes("/") ? stringParts[stringParts.length - 1] : file;
    const rowExpected = this.importRows.filter({ hasText: fileName }).first();
    await expect(async () => {
      await this.navigateToMenu("Products");
      await this.clickProgressBar();
      const status = await rowExpected.locator(".status-tag").innerText();
      if (status !== "Completed") {
        await this.navigateToMenu("Products");
      }
      await expect(rowExpected.locator(".status-tag")).toHaveText("Completed", { timeout: 50 });
    }).toPass({ intervals: [4_000, 5_000, 10_000] });
  }
}
