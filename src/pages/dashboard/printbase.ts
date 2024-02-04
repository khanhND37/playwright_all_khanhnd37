import { APIRequestContext, expect, Page } from "@playwright/test";
import type {
  AddLayersToGroupInfo,
  BaseProductInfor,
  CampaignDetail,
  Campaigns,
  CampaignValue,
  ClipartFolder,
  ConditionInfo,
  CustomArt,
  CustomizeGroup,
  CustomOptionProductInfo,
  GroupInfo,
  Layer,
  PricingInfo,
  ProductVariant,
  RemoveLayer,
  VariantEditor,
} from "@types";
import { UploadArtInfor } from "@types";

import { buildQueryString } from "@core/utils/string";
import { ProductPage } from "@pages/dashboard/products";

/**
 * Class for campaign list, campaign detail, campaign editor
 */
export class PrintBasePage extends ProductPage {
  xpathImageEditor = "//div[contains(@class,'editor__container')]//div[@id='editor']";
  xpathTabDraft = "//p[normalize-space()='Draft campaigns']";
  xpathPopupDuplicate = "//div[@class='s-form-item']";
  xpathCheckboxKeepArtwork =
    "//span[normalize-space()='Duplicate the artworks and custom options of the original campaign']";
  xpathBtnAddBaseProduct = "//button[contains(@class,'add-base-product')]";
  xpathListLabelInCO = "//div[contains(@class,'custom-option__list')]";
  xpathLabelInCO = this.xpathListLabelInCO + "//a[contains(@class,'title')]";
  xpathBtnPreview = "//a[normalize-space()='Preview']";
  xpathListMockupEditor = "//div[@class='wrap-mockups']";
  xpathListSelectOptionInDB = "(//select)[2]//option";
  xpathMessErrBlankCondional = "(//div[normalize-space()='Please finish this field'])[1]";
  xpathBtnUpdateMockups = "//a[normalize-space()='Update mockups']";
  xpathAlertOnPricingTab = "//div[@class='s-alert__content']";
  xpathListTypeOfCG = "(//div[contains(@class,'s-select')])[1]//option";
  xpathPresentationEditor = "//div[@class='body']";
  xpathNameValue = "//option[normalize-space()='Select a group']//following-sibling::option";
  xpathCustomizeGroupContainer = "//div[@class='customize-group__container']";
  xpathValueGroupOnCG = "//div[contains(@class,'list-groups__container')]";
  xpathListPricing = "//h4[normalize-space()='Pricing']//parent::div//following-sibling::table";
  xpathPricingPage = "//div[@id='print-pricing-editor']";
  xpathListDefaultGroupShowOntheMockups =
    "//select[@class='select-default']//option[not(contains(@selected, 'selected'))]";
  xpathWaitUploadFileImgFinished = "//label[@class='s-upload s-control uploading']";
  xpathAddMoreBase = "//span[@data-label='Add more product']";
  xpathSelectBase1st = "(//div[contains(@class,'s-tooltip-fixed base-product')])[1]";
  xpathProductPropertyOnSF = "//div[contains(@class,'product-custom-option') or @class='product-property']";
  xpathSelectProductMainImageOnPricingPage =
    "//h4[normalize-space()='Select product main image']//parent::form[contains(@class,'form card')]";
  xpathSelectProductMain =
    "//label[normalize-space()='Product']//ancestor::div[@class='s-form-item custom-s-form']//select";
  xpathInputTitleOnPricingPage =
    "//div[@class='s-form-item custom-s-form' and descendant::label[normalize-space() = 'Title']]//input";
  xpathMockupPreviewOnEditor = "//div[@id='editorContent']";
  xpathListLayerBackSide =
    "//span[normalize-space()='Back side']//ancestor::div[contains(@class,'artwork is-active')]//div[contains(@class,'layer__list')]";
  xpathBtnNextPagePopupPreview =
    "//div[contains(@class,'modal__body__icon-close')]//following-sibling::div//button[@aria-label='Next page']";
  xpathRadioGroupSF = "(//div[@class='radio-group'])[1]";
  xpathImgDetailMockupContainer = "//div[contains(@class,'image-preview')]//div[@class='media__container']";
  xpathListBaseOnEditor = "//ul[contains(@class,'base-products__container')]";
  xpathLeftMenuEditor = "//div[contains(@class,'border-right pull-left')]";
  xpathIconBack =
    "(//div[@class='s-card-header']|//div[@class='customize-group__container'])//i[contains(@class,'left')]";
  xpathVariantEditor = "//div[contains(@class,'color-size-select')]";
  xpathBtnEdit = "//a[normalize-space()='Edit']";
  xpathLoadPage = "//div[@class='loading-page__content']//img[@class='sbase-spinner']";
  xpathAddConditionalLogic =
    "(//div[contains(@class,'conditional-logic-container')]//div[contains(@class,'rule-wrapper')])[1]";
  xpathListConditionalLogic =
    "//div[contains(@class,'custom-options__container')]//div[contains(@class,'s-collapse-item__content')]";
  xpathBtnBackToListCO = "//i[contains(@class,'mdi-chevron-left')]";
  xpathListCoOnSF = "//div[@class='product-property']";
  xpathMessageOfLayerPsd = "//div[contains(@class,'psd-uploading')]";
  xpathCustomOptionPCDetail = "//div[contains(@class,'picture-choice__container')]";
  xpathListLayerEditor = "(//div[@class='single-layer__container'])[1]";
  xpathFirstRowPricing = "(//h4[normalize-space()='Pricing']//parent::div//following-sibling::table//tbody//tr)[2]";
  xpathManualDesignPage = "//div[@id='manual-designs']";
  xpathProcessManualDesign = "//div[@class='process-pricing__container']";
  xpathPopupCreateCustomArt = "//div[contains(@class,'s-animation-content')]//div[@class='s-modal-body']";
  xpathVariantCustomArt = "//div[contains(@class,'product__variants product__variants-hover')]";
  xpathVariantPricing = "//div[@id='print-pricing-editor']//table";
  xpathPopupCustomArtOnEditor =
    "//div[contains(@class,'custom-options__container')]//div[contains(@class,'custom-art__container')]";
  xpathLoadImgInPriceAndDescription = "//div[@class='loading-mask' and not(@style)]";
  xpathCheckboxCustomArt = this.xpathPopupCustomArtOnEditor + "//span[@class='s-check']";
  xpathCheckboxCustomArtInput = this.xpathPopupCustomArtOnEditor + "//input";
  xpathListCO = "//div[contains(@class,'product-property product-custom-option')]";
  xpathMessageLayerError = "//div[contains(@class,'layer')]//div[normalize-space()='Field is required']";
  xpathMessageFontError =
    "(//div[contains(@class,'custom-s-form is-error')]//div[normalize-space()='Field is required'])[1]";
  xpathErrAddClipartInCO = "(//p[normalize-space()='Hidden on storefront due to the blank clipart group'])[1]";
  xpathMessageLabel = "(//div[@class='s-form-item__error'])[1]";
  xpathMessageRadio =
    "(//div[child::div[normalize-space()='Value']]//following-sibling::div//div[@class='s-form-item__error'])";
  xpathItemErr = "(//div[contains(@class,'item__error')])[1]";
  xpathImageThumbnail = "(//div[contains(@class,'thumbnail')]//img)[1]";
  xpathTitleHide = "//span[normalize-space()='Hide']";
  xpathTitleShow = "//span[normalize-space()='Show']";
  xpathMessagOverAdd = `//div[@class='block-add-new']//span[1]`;
  xpathSizeGuide = "//div[contains(@class,'product__variant-label')]//label[normalize-space()='Size Guide']";
  xpathPopupSizeGuide =
    "//div[contains(@class,'product__size-chart')]//div[contains(@class,'popover-bottom__content')]";

  xpathImageArtwork = "//div[@class='artwork-image']";
  xpathBtnDeleteArtwork = "//span[@data-label='Delete']";
  xpathBlockArtworkEmpty = "//div[@class='empty-catalog text-center m-t-xl']";
  xpathBtnAddImage = "//button[child::span[normalize-space()='Add image']]";
  xpathInputFile = "(//input[@type='file'])[1]";
  xpathTitleOrganization = "//h3[normalize-space()='Organization']";
  xpathCustomOption = "//div[contains(@class,'custom-options__container')]";
  xpathPageCatalogLoad = "//div[@class='col-md-12 flex-justify-center']";
  xpathArtworkList = "//div[@class='artwork-list' or contains(@class,'empty-catalog text-center')]";
  xpathImageInEditor = "//div[contains(@class, 'editor__container')]//img";
  xpathBtUploadArtwork = "//button[contains(@class, 'upload-artwork__container')]//input";
  xpathCampaignsResults = "//div[@class='campaigns-results']//table/tbody/tr";
  xpathLoadingTable = "//div[@class='s-loading-table']";
  xpathTitlePopupMoreProduct = "//p[normalize-space()='Add more products']";
  xpathImageEditActive = "//div[@id='editor-zone']//img";
  xpathImageSync = "//div[@class='konvajs-content loading']//canvas";
  xpathBackToCatalog = "//span[@class='widget-icon-triangle-left icon-back-title']";
  xpathPreviewImageEditor = "(//div[contains(@class,'display-inline-block')]//img)[1]";
  xpathDefaultLayerList =
    "((//div[@class='s-collapse-item__content']//div[@class='layer__list default-layer__list'])[1] | //div[@class='layer__container'])[1]";
  xpathIconSyncGroupLayer = "//span[@class= 's-icon is-small']//i[@class='mdi mdi-sync mdi-18px']";
  xpathIconSyncLayerImage = "//div[@class='single-layer__container']//i[@class='mdi mdi-sync mdi-18px']";
  xpathGroupLayer = "//div[contains(@class,'layer-group__title--input')]";
  xpathIconDragCustomOption = "(//span[contains(@class, 'icon-drag')]//i)";
  xpathCreateProduct = "//div[@id='create-product']";
  xpathIconOpenExpand =
    "//div[contains(@class, 'right-sidebar__container')]//span[contains(@class, 'is-small')]//i[contains(@class, 'mdi-chevron-left')]";
  xpathModal = "//div[contains(@class,'s-modal')]";
  xpathActionBarItem = "//div[contains(@class, 'action-bar__item')]";
  xpathRightMenuEditor = "//div[@class='right-sidebar__container expand']";
  xpathIconViewSF = "//a[contains(@class , 's-button is-outline is-small')]";
  xpathNoProduct = "//td[@class='no-product']";
  xpathDeleteCustomize = "//div[@class='s-dropdown-content']//span[normalize-space()='Delete']";
  xpathInputLabelCustomizeGroup = "//input[@placeholder='Select number of people']";
  xpathTableShortcutKey = "//div[@class='custom-shortcut-popover__content']";
  xpathIconShortcutKey = "//div[@class='s-popover__reference']//span[normalize-space()='Keyboard shortcuts']";
  xpathTaskBarInEditor = "//div[contains(@class,'update-editor-ui')]//div[contains(@class,'border-header-update')]";
  xpathIconZoom = "//div[contains(@class,'transition03')]";
  xpathDragTaskBar = "//div[contains(@class,'editor__container')]//p[contains(@class,'border-round fixed')]";
  xpathIconCloseInDragTaskbar = "//span[@class='s-icon media-middle cursor-pointer is-small']";
  xpathListCustomOptionEditor =
    "//div[contains(@class,'custom-options__container')]//div[@class='s-collapse-item__content']";
  xpathProgressUpload = "//p[normalize-space()='Uploading:']";
  xpathIconWarning = "//div[contains(@class,'file-bulk-error__icon')]";
  xpathBulkDuplicateScreen = "//div[@class='new-bulk-duplicate']//div[@class='sb-block-item sb-mb-large']";
  loadingTable = '//div[@class="s-loading-table"]';
  iconUploading = '(//span[contains(@class,"icon-loading")])[1]';

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Xpath icon duplicate campaign in list campaign
   * @param campaignOrigin : campaign name
   * @returns
   */
  xpathIconDuplicate(campaignOrigin: string): string {
    return `//span[normalize-space()='${campaignOrigin}']//ancestor::tr//td[@class='text-right cursor-default no-padding-important']//i`;
  }

  /**
   * Xpath shipment preference of campaign in pricing page
   * @param option is option of shippment: ship from nearest or lowest
   * @returns
   */
  xpathShipmentPreference(option: string) {
    return `//span[text()='${option}']`;
  }

  /**
   * Xpath icon delete artwork on Bulk duplicate
   * @param campaignName : campaign name
   * @returns
   */
  getXpathIconDeleteArtwork(campaignName: string, side: string): string {
    return `(//p[normalize-space()='${campaignName}']//ancestor::td//following-sibling::td)[1]//p[normalize-space()='${side}']//ancestor::div[contains(@class,'file-upload-bulk')]//span[contains(@class,'sb-pointer sb-mt-xs sb-flex-inline')]`;
  }

  /**
   * Xpath icon delete artwork on Bulk duplicate
   * @param campaignName : campaign name
   * @returns
   */
  getXpathIconDeleteCampOnBulkDuplicate(campaignName: string, index: number): string {
    return `(//p[normalize-space()='${campaignName}']//ancestor::tr//td)[${index}]//span`;
  }

  xpathImagePreviewSF(index = "1"): string {
    return `(//div[@class='product-image-preview']//img)[${index}]`;
  }

  /**
   * Xpath base product in edtior campaign
   * @param baseProduct : name base product
   * @returns
   */
  xpathBaseProductOnEditor(baseProduct: string): string {
    return `//span[normalize-space()='${baseProduct}']//parent::div`;
  }

  /**
   *
   * @param index index Group want to edit
   * @returns
   */
  xpathMessErrorEditGroup(index: number): string {
    return this.getXpathByTagNameAndClass("div", "s-form-item__error", index);
  }

  /**
   * xpath icon edit conditional logic pbase
   * @param customOptionName name off custom option
   * @returns
   */
  getXpathEditConditional(customOptionName: string): string {
    return `//a[normalize-space()='${customOptionName}']//ancestor::div[contains(@class,'content__center')]//following-sibling::div[contains(@class,'content__right')]//span[@data-label='Edit logic']`;
  }

  /**
   * xpath parent select default group
   * @param index
   */
  getXpathParentDivSelectDefault(index = 1): string {
    return `//select[@class='select-default']//ancestor::div[${index}]`;
  }

  /**
   * xpath red icon conditional logic when it has err
   * @param customOptionName
   */
  xpathRedIconEditConditional(customOptionName: string) {
    return `//a[normalize-space()='${customOptionName}']//ancestor::div[contains(@class,'content__center')]//following-sibling::div[contains(@class,'content__right')]//span[@data-label='Edit logic']//span[@style="color: rgb(240, 94, 90);"]`;
  }

  /**
   *
   * @param nameCO name custom option
   * @returns xpath return xpath of CO in list CO on SF
   */
  xpathCOInListCoOnSF(nameCO: string): string {
    return `${this.xpathListCoOnSF}//div[@class='${nameCO}']`;
  }

  /**
   * Xpath icon remove base product in editor campaign
   * @param baseProduct : name base product
   * @returns
   */
  xpathIconRemoveBase(baseProduct: string): string {
    return `//span[normalize-space()='${baseProduct}']//parent::div//a[@class='s-delete']`;
  }

  /**
   * Xpath droplist picture choice
   * @param namePC
   */
  xpathDroplistPictureChoice(namePC: string): string {
    return `//div[contains(@class,'select-box') and descendant::*[normalize-space()='${namePC}']]//select`;
  }

  /**
   * Xpath value picture choice
   * @param value
   */
  xpathValuePictureChoice(value: string): string {
    return `//input[@value ='${value}']//parent::label[@class='base-picture__item']`;
  }

  /**
   * Xpath available to of campaign custom art
   * @param campaignName
   */
  xpathAvailableToCustomArt(campaignName: string): string {
    return `//*[normalize-space() = '${campaignName}']//parent::div//li[@class='calculated-message__container']`;
  }

  /**
   * Xpath button Import to store  or edit campaign custom art
   * @param campaignName
   */
  xpathBtnImportToStoreOrEditCustomArt(campaignName: string, type: string): string {
    return `//*[normalize-space() = '${campaignName}']//ancestor::div[contains(@class,'camp__container')]//button[normalize-space()='${type}']`;
  }

  /**
   * Xpath icon delete material of custom art
   * @param index
   */
  xpathIconDeleteMaterial(index = 1): string {
    return `(//span[contains(@class,'icon__delete-material')])[${index}]`;
  }

  /**
   * Xpath status campaign in list campaign
   * @param campaignName
   * @param status
   */
  xpathStatusCampaign(campaignName: string, status: string): string {
    return `(//td[normalize-space()='${campaignName}']//following-sibling::td//span[normalize-space()='${status}'])[1]`;
  }

  xpathDroplistSelectCOCustomArt(index = 1): string {
    return `(//label[normalize-space()='Applied for']//parent::div//following-sibling::div[@class='s-form-item__content']//div[contains(@class,'select__custom-option')])[${index}]`;
  }

  xpathTooltipCampaign(campaignName: string): string {
    return `(//td[normalize-space()='${campaignName}']//following-sibling::td//div[@class='s-tooltip-fixed tooltip-fixed'])[1]`;
  }

  xpathMessageRejectInDashboard(campaignName: string, message: string): string {
    return `(//td[normalize-space()='${campaignName}']//following-sibling::td//div[@class='s-tooltip-fixed tooltip-fixed']//span[normalize-space()='${message}'])[1]`;
  }

  xpathStatusUploadImgageBulkDuplicate(title: string): string {
    return `//span[contains(text(),'${title}')]//ancestor::tr//i[contains(@class,'check-circle')]`;
  }

  xpathLoadingMainImage(title: string) {
    return `(//div[contains(@class,'VueCarousel-slide-active')]//img[@class='image sb-lazy loading base-picture__img' or contains(@class,'image sb-lazy loading') and @alt='${title}'])[1] | (//div[contains(@class,'media-gallery-carousel__slide-active')]//img[@class='image sb-lazy loading base-picture__img' or contains(@class,'image sb-lazy loading') and @alt='${title}'])[1]`;
  }

  xpathSetIndividualPrice(product: string) {
    return `//p[contains(.,"${product}")]/following-sibling::a[contains(text(),'Set individual price')]`;
  }

  xpathStatusCampaignInListCampaign(campaignName: string, index = 1): string {
    return `(//tr[descendant::span[normalize-space()='${campaignName}']]//div[contains(@class,'product-status')]//span)[${index}]`;
  }

  getXpathBaseImgThumbnail(index = 0): string {
    return `(//a[contains(@class, 'img-thumbnail')])[${index + 1}]`;
  }

  getXpathCustomOptionList(labelGroup: string): string {
    return `//div[contains(@class, 'custom-option__list')]//a[normalize-space()='${labelGroup}']`;
  }

  getXpathListLayer(base = "2D"): string {
    if (base === "2D")
      return "(//div[@class='s-collapse-item__content']//div[@class='layer__list default-layer__list'])[1]";
    return "//div[@class='layer__container']";
  }

  getXpathItemCustomOption(customOptionName: string): string {
    return super.getXpathItemCustomOption(customOptionName);
  }

  getXpathIconOnTaskBar(iconName: string): string {
    return `//span[@data-label='${iconName}']`;
  }

  getXpathIconZoomInOut(index = 1): string {
    return `(${this.xpathIconZoom}//span)[${index}]`;
  }

  /**
   * Launch campaign any
   * @param campaignsInfos
   * */
  async launchCamp(campaignsInfos: Campaigns): Promise<number> {
    const pricingInfo = campaignsInfos.pricing_info;
    const productInfo = campaignsInfos.product_infos;
    const layers = campaignsInfos.layers;
    const customOption = campaignsInfos.custom_options;
    const conditionalLogicInfo = campaignsInfos.conditional_logic_info;
    let campaignId;
    await this.addBaseProducts(productInfo);
    // Add layer
    await this.clickOnBtnWithLabel("Create new campaign");
    await this.waitForElementVisibleThenInvisible(this.xpathIconLoading);
    await this.waitUntilElementVisible(this.xpathImageEditor);
    await this.clickLinkProductEditorCampaign();
    await this.addNewLayers(layers);
    if (campaignsInfos.group_infos) {
      await this.createGroupLayers(campaignsInfos.group_infos);
    }
    if (campaignsInfos.layers_group_infos) {
      await this.addLayersToGroup(campaignsInfos.layers_group_infos);
    }
    if (campaignsInfos.custom_options) {
      // Add custom option
      await this.removeLiveChat();
      await this.clickBtnExpand();
      await this.clickOnBtnWithLabel("Customize layer");
      await this.addCustomOptions(customOption);
    }
    if (campaignsInfos.custom_group_infos) {
      if (
        await this.page
          .locator(
            "//div[@class='right-sidebar__container expand'] | //div[@class='right-sidebar__container height-content-update-ui expand']",
          )
          .isHidden()
      ) {
        await this.removeLiveChat();
        await this.clickBtnExpand();
      }
      await this.setupCustomizeGroupForPB(campaignsInfos.custom_group_infos);
    }
    if (conditionalLogicInfo) {
      await this.addListConditionLogic(conditionalLogicInfo);
    }
    if (campaignsInfos.custom_art) {
      await this.addListCustomArt(campaignsInfos.custom_art);
    }
    // Click btn Continue > Input title Campaign > Launch campaign
    if (pricingInfo) {
      await this.clickOnBtnWithLabel("Continue");
      await this.page.waitForURL(`**/pricing`, { waitUntil: "networkidle" });
      await this.waitUntilElementVisible(this.xpathPricingPage);
      await this.waitForElementVisibleThenInvisible(this.xpathIconLoading);
      await this.inputPricingInfo(pricingInfo);
      campaignId = this.getCampaignIdInPricingPage();
      if (campaignsInfos.is_campaign_draft) {
        await this.clickOnBtnWithLabel("Save draft");
      } else {
        await this.clickOnBtnWithLabel("Launch");
      }
    }
    return campaignId;
  }

  /*
  Edit custom option
  @param customOptions : list custom option
   */
  async editCustomOption(customOptions: Array<CustomOptionProductInfo>) {
    await this.clickBtnExpand();
    for (let i = 0; i < customOptions.length; i++) {
      await this.page.click(this.xpathCustomOptionName(customOptions[i].label_edit));
      await this.addCustomOption(customOptions[i]);
    }
    await this.clickOnBtnWithLabel("Save change");
    if (await this.page.locator("//p[normalize-space()='Update custom options']").isVisible()) {
      await this.clickOnBtnWithLabel("Update");
      await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
    }
  }

  /**
   * Xpath icon duplicate, bulk duplicate campaign of firt campaign in list campaign of firt campaign
   * @param campaignName : campaign name
   * @returns
   */
  xpathRowCampaign(campaignName: string): string {
    return `(//div[normalize-space()='${campaignName}']//ancestor::td[@class='cursor-default no-padding-important']//following-sibling::td[@class='text-right cursor-default no-padding-important']//a)[1]`;
  }

  /**
   * Click bases in Personalization
   */
  async clickBaseInPersonalization(baseName: string) {
    await this.page.click(
      `//span[normalize-space()='${baseName}']//parent::div[contains(@class,'s-tooltip-fixed base-product')]`,
    );
  }

  /**
   *function return xpath label in customize option list
   * @param nameLabel name of label
   * @returns
   */
  getXpathNameLabelInCOList(nameLabel: string): string {
    return `//div[contains(@class,'custom-option__list')]//div[contains(@class,'content__center')]//a[normalize-space()='${nameLabel}']`;
  }

  /**
   * Xpath possition of mockup in editor campaign
   * @param index : possition of mockup
   * @returns
   */
  xpathMockupPosition(index: string): string {
    return `(((//div[@class='wrapper-grid-mockups-content'])//div[contains(@class,'product-click-action')])[${index}]//i)[2]`;
  }

  /**
   * Xpath toast message in editor campaign
   * @param message : content of toast message
   * @returns
   */
  xpathToastMessageEditor(message: string): string {
    return `(//div[contains(@class,'toast')]//div[normalize-space()='${message}'])[1]`;
  }

  /**
   * Xpath icon Drag of layer in editor campaign
   * @param layerName : name of layer
   * @returns
   */
  xpathIconDragOfLayer(layerName: string): string {
    return `//span[normalize-space()='${layerName}']//ancestor::div[@class='single-layer__container layer-in-group' or @class='single-layer__container']//i[contains(@class,'drag')]`;
  }

  xpathCustomOptionName(customOptionName: string): string {
    return `//div[contains(@class,'custom-option__list')]//a[normalize-space()='${customOptionName}']`;
  }

  /**
   * Xpath of color name on Select product main image
   * @param index : vị trí của color name
   * @returns
   */
  xpathColorOnPricingPage(index: string): string {
    return `(//label[normalize-space()='Select main color']//ancestor::div[@class='s-form-item custom-s-form']//a)[${index}]`;
  }

  /**
   * Xpath of list layer on side name
   * @param sideName : name of side ( Front or Back)
   * @returns
   */
  xpathListLayerSide(sideName: string): string {
    return `//span[normalize-space()='${sideName}']//ancestor::div[contains(@class,'artwork is-active')]//div[contains(@class,'layer__list')]`;
  }

  /**
   * Xpath title of base product on Editor
   * * @param productName : title of base product
   * @returns
   */
  xpathTitleBaseProductOnEditor(productName: string): string {
    return `//h3[normalize-space()='${productName}']`;
  }

  /**
   * Xpath button of thanh bar on Editor
   * * @param actionName : name of button
   * @returns
   */
  xpathActionBarOnEditor(actionName: string): string {
    return `//span[contains(@data-label,'${actionName}')]`;
  }

  /**
   * Xpath color name of list color on Editor
   * * @param colorName : name of color ( white, Blck,..)
   * @returns
   */
  xpathColorOnEditor(colorName: string): string {
    return `//span[normalize-space()='${colorName}']//preceding-sibling::div[@class='color cursor-pointer']//div[@class='color__active']`;
  }

  /**
   * Xpath message required for layer on Editor
   * * @param colorName : name of color ( white, Blck,..)
   * @returns
   */
  xpathMessageRequiredForLayer(layerName: string): string {
    return `//span[normalize-space()='${layerName}']//ancestor::div[contains(@class,'text-left')]//p`;
  }

  /**
   * xpath default layer list
   * */
  getXpathLayerList(index = 1): string {
    return `(//div[@class = 'layer__list default-layer__list'])[${index}]`;
  }

  getXpathCustomOptionListPB(index = 1): string {
    return `(//div[contains(@class,'custom-option__list')]//div[contains(@class,'content__center')]//a)[${index}]`;
  }

  /**
   * Function return xpath of base Active
   * @param nameBase name of base Active
   * @returns
   */
  xpathBaseActive(nameBase: string): string {
    return `//span[normalize-space()='${nameBase}']/preceding-sibling::a[@class='img-thumbnail active']`;
  }

  /**
   * Function return xpath of group layer name
   * @param nameGroup name of group layer selected
   * @returns
   */
  xpathGroupLayerName(nameGroup: string): string {
    return `//span[normalize-space()='${nameGroup}']`;
  }

  /**
   * function return characters want to check
   * @param nameCheck name want to check
   * @returns
   */
  xpathSelectCharacters(nameCheck: string) {
    return `//span[normalize-space(text())='${nameCheck}']//preceding-sibling::span`;
  }

  /**
   * Xpath icon hide/show of group in edtior campaign
   * @param groupName : name of group layer
   * @returns
   */
  xpathIconEyeOfGroup(groupName: string): string {
    return `//span[normalize-space()='${groupName}']//ancestor::div[contains(@class,'align-items-center layer-group')]//i[contains(@class,'eye')]`;
  }

  /**
   * function get xpath action of CG
   * @param nameLabel name of label
   * @param getInfo The xpath can you get : List of action, btn Drag, btn Dots vertical
   * @returns return xpath action of CG
   */
  async xpathListActionOfLabel(nameLabel: string, getInfo: string) {
    const xpathListAction = `//a[normalize-space()='${nameLabel}']//ancestor::div[contains(@class,'content__center')]/following-sibling::div[contains(@class,'content__right')]`;
    switch (getInfo) {
      case "List":
        return xpathListAction;
      case "Drag":
        return xpathListAction + "//span[@data-label='Drag']";
      case "Dots vertical":
        return xpathListAction + "//div[@class='s-dropdown-trigger']";
    }
  }

  /**
   *
   * Click to switch tab on Catalog Screen
   * It will choose a menu tab of catalog
   * @param category specify tab name open tab catalog (example "Apparel" or "Over All Print")
   */
  async switchToTabOnCatalog(category: string) {
    await this.page.click(`//p[normalize-space() = "${category}"]`);
  }

  /**
   * Open tab category from categoryList on catalog screen
   * Click to add base product if exist on catalog tab
   * Then click to Create new campaign button to open Editor campaign Screen
   * @param categoryList specify name of category to choose product base
   * @param productName specify a name of base product to create campaign
   */
  async addProductFromCatalog(categoryList: string, productName: string) {
    const category = categoryList.split(",").map(item => item.trim());
    const product = productName.split(",").map(item => item.trim());
    for (let i = 0; i < category.length; i++) {
      await this.page.click(`//p[normalize-space() = "${category[i]}"]`);
      const productClick = await this.page.waitForSelector("(//div[contains(@class, 'product-click-action')])[1]");
      await productClick.waitForElementState("stable");
      for (let j = 0; j < product.length; j++) {
        const selectBase = `//span[@data-label='${product[j]}']/ancestor::div[@class='prod-wrap']`;
        if (await this.page.isVisible(selectBase)) {
          const xpathBaseProduct = `(//span[contains(@data-label,'${product[j]}')])[1]//ancestor::div[@class='prod-wrap']//button[contains(.,'Add product')]`;
          await this.page.waitForSelector(xpathBaseProduct);
          await this.page.locator(xpathBaseProduct).scrollIntoViewIfNeeded();
          await this.page.click(xpathBaseProduct);
          await this.page.isEnabled(`${selectBase}//button[contains(.,'Remove product')]`);
        }
      }
    }
    await this.page.click(`//button[@type='button']//span[text()[normalize-space()='Create new campaign']]`);
    await this.page.waitForSelector("//div[@id='create-product']");
  }

  /**
   * Search artwork
   * @param keyword value search
   * */
  async searchArtworkWithKeyword(keyword: string) {
    await this.page.waitForSelector("//input[contains(@placeholder,'Search by file name')]", { timeout: 2000 });
    await this.inputFieldWithLabel("", "Search by file name", keyword);
    //delay to wait for artwork to be display after search
    await this.page.press(`//input[contains(@placeholder,'Search by file name')]`, "Enter", { delay: 1000 });
    await this.page.waitForSelector(
      `(//div[@class='title' and child::span[@data-label="${keyword}"]]//preceding-sibling::div)[1]`,
    );
  }

  /**
   * Determine layer of front side or back side
   * Add info for multi layer
   * @param layers
   */
  async addNewLayers(layers: Layer[]) {
    for (const layer of layers) {
      await this.addNewLayer(layer);
      if (layer.is_sync) {
        await this.page.click(
          `//span[normalize-space()='${layer.layer_name}']//ancestor::div[@class='single-layer__container']//i[contains(@class,'sync')]`,
          { timeout: 90000 },
        );
      }
    }
  }

  /**
   * Determine layer of front side or back side
   * Add info for multi layer
   * @deprecated use function addNewLayers
   * @param layer
   */
  async addNewLayer(layer: Layer): Promise<void> {
    const xpathSide = `//span[contains(.,'${layer.front_or_back}')]/ancestor::div[contains(@class,'s-collapse-item artwork')]`;
    const xpathAddLayer = `//button[child::span[normalize-space()="Add ${layer.layer_type.toLowerCase()}"]]`;
    const xpathSideLayer = `${xpathSide}${xpathAddLayer}`;
    if (layer.front_or_back === "Front" || layer.front_or_back === "Back") {
      await this.page.click(xpathSideLayer, { timeout: 90000 });
      // wait for gen data tren editor
      await this.page.waitForTimeout(2000);
    } else {
      await this.page.click(xpathAddLayer, { timeout: 90000 });
      await this.page.waitForTimeout(2000);
    }
    const checkError = await this.page
      .locator(
        "(//div[normalize-space()='Value must be greater than or equal to 1'] | //div[normalize-space()='Please finish this field'])[1]",
      )
      .isVisible({ timeout: 60000 });
    if (checkError) {
      await this.page.click("//div[@class='s-card-header']//i[contains(@class,'left')]");
      await this.page.waitForTimeout(2000);
      let xpathLayer;
      if (layer.front_or_back) {
        xpathLayer = `(//span[contains(.,'${layer.front_or_back}')]/ancestor::div[contains(@class,'s-collapse-item artwork')]//ancestor::div[contains(@class,'cursor-pointer')])[1]`;
      } else {
        xpathLayer = `(//span[contains(@class,'display')]//ancestor::div[contains(@class,'cursor-pointer')])[1]`;
      }
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
      await this.addNewLayer(layer);
      return;
    }

    if (layer.layer_type === "Text") {
      //wait to fill data input text value
      await this.page.waitForTimeout(3000);
      if (layer.layer_value) {
        await this.page.fill(`//input[@placeholder='Add your text']`, layer.layer_value);
      }
      if (layer.font_size) {
        await this.page.fill(`//div[@class='text-form-data-custom']//div[@class='row']//input`, layer.font_size);
      }
    } else {
      await this.searchArtworkWithKeyword(layer.image_name);
      const xpathArtwork = this.genLoc(
        `(//div[@class='title' and child::span[@data-label="${layer.image_name}"]]//preceding-sibling::div)[1]`,
      );
      await xpathArtwork.click();
      //wait to fill data input image value
      await this.page.waitForTimeout(3000);
      await this.page.waitForSelector("//div[@id='editor']");
    }
    //add font for layer
    if (layer.font_name) {
      await this.page.click("//input[@id='font-list-layer-font']", { timeout: 90000 });
      await this.page.click(`(//span[normalize-space()='${layer.font_name}'])[1]`, {
        timeout: 90000,
      });
    }

    if (layer.layer_name_new) {
      await this.page.dblclick(`//h3[normalize-space()='${layer.layer_name}']`);
      await this.page.waitForSelector("(//h3//parent::div//input)[1]", { timeout: 90000 });
      await this.page.fill(`//h3[normalize-space()='${layer.layer_name}']//parent::div//input`, layer.layer_name_new);
    }

    // Config for layer
    if (layer.font_size) {
      await this.page.fill(`//div[@class='text-form-data-custom']//div[@class='row']//input`, layer.font_size);
      //Editor khong update canvas luon nen phai su dung timeout
      await this.page.waitForTimeout(2000);
    }
    if (layer.rotate_layer) {
      await this.page.fill("//input[@placeholder='Rotation']", layer.rotate_layer);
      //Editor khong update canvas luon nen phai su dung timeout
      await this.page.waitForTimeout(2000);
    }

    if (layer.opacity_layer) {
      await this.page.fill(
        `//div[@class='s-form-item custom-s-form is-success is-required' and child::div[contains(.,'Opacity')]]//input`,
        layer.opacity_layer,
      );
      //Editor khong update canvas luon nen phai su dung timeout
      await this.page.waitForTimeout(2000);
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

    //click back to layer list
    if (!layer.not_back_layer_list) {
      const xpathIconBack = "//div[contains(@class,'editor-side-bar')]//div[@class='s-card-header']/span";
      await this.page.waitForSelector(xpathIconBack, { timeout: 5000 });
      await this.page.click(xpathIconBack, { timeout: 90000 });
      await this.page.waitForSelector(xpathAddLayer);
      await this.page.waitForTimeout(2000); // wait layer list ổn định
    }
  }

  /*
   * verify navigate Pricing Page
   */
  async isPricingPage() {
    const xpathPricingDescription = this.genLoc(`//*[normalize-space(text())='Price & Description']`);
    return xpathPricingDescription.isHidden();
  }

  /**
   * When campaign is campaign custom art, need verify Photo Guild in Pricing Screen
   * It will verify Photo Guild is Visible or disable or not exist
   * @param status Is the campaign a customart camp?
   */
  async isPhotoGuide(status: string) {
    const xpathPhotoGuide = this.genLoc(`//*[normalize-space(text())='Photo guide']`);
    if (status === "true") {
      await xpathPhotoGuide.isVisible();
    } else {
      xpathPhotoGuide.isHidden;
    }
  }

  /**
   * Click to expand individual price of base product on Pricing Screen
   * @param product name of base product
   */
  async clickSetIndividualPriceInPricing(product: string) {
    const xpathPrice = `//p[contains(.,"${product}")]/following-sibling::a[contains(text(),'Set individual price')]`;
    if (await this.page.isVisible(xpathPrice)) {
      await this.page.click(xpathPrice);
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Input new price (Sale price, Compare at price) for Variant of Campaign
   * @param sVariant name of variant
   * @param price new price to input field
   * @param label type of price (Sale price, Compare at price)
   */
  async inputPrice(pricingInfo: PricingInfo) {
    //If need input Compare at price, index of xpath = 3
    let index = 3;
    const variant = pricingInfo.variant;
    const xpathVariant = `//tr[descendant-or-self::*[normalize-space(text())='${variant}']]`;
    await this.page.fill(`(${xpathVariant}/td/following-sibling::td)[${index}]//input`, pricingInfo.compare_price);
    if (pricingInfo.sale_price) {
      //If need input Sale price, index of xpath = 2
      index = 2;
      await this.page.fill(`(${xpathVariant}/td/following-sibling::td)[${index}]//input`, pricingInfo.compare_price);
    }
  }

  /*
   * Search campain with campaign name on Campaign list screen
   */
  async searchWithKeyword(keyword: string) {
    await this.page.fill(`//input[contains(@placeholder,'Search campaigns by name')]`, keyword);
    await this.page.press(`//input[contains(@placeholder,'Search campaigns by name')]`, "Enter");
    await this.page.waitForSelector(
      "//span[@class='s-tag']//div[contains(text(),'Title contains')] | //div[@class='s-alert__content']",
    );
    await this.page.waitForTimeout(2000);
  }

  /**
   * Verify navigate Pricing screen and input parameters of campaign
   * @param pricingInfo data from config contain product info (title, descrition, main product, tags ...)
   */
  async inputPricingInfo(pricingInfo: PricingInfo): Promise<void> {
    await this.page.waitForSelector("//input[@placeholder='Campaign name']");
    //input title of campaign
    const xpathInputTitle = "//input[@placeholder='Campaign name']";
    await this.page.locator(xpathInputTitle).clear();
    await this.page.fill(xpathInputTitle, pricingInfo.title);
    //input description of campaign
    if (pricingInfo.description) {
      await this.page.waitForSelector(
        "//div[@class='s-form-item custom-s-form']//label[normalize-space() = 'Description']",
      );
      await this.page
        .frameLocator("//iframe[contains(@id,'tiny-vue')]")
        .locator("//body[@id='tinymce']")
        .fill(pricingInfo.description);
    }
    //input tag of campaign
    if (pricingInfo.tag) {
      await this.page.waitForSelector("//div[@class='s-form-item custom-s-form']//label[normalize-space() = 'Tags']");
      await this.page.fill("//input[@placeholder='Separate your keywords using a comma']", pricingInfo.tag);
      await this.page.press("//input[@placeholder='Separate your keywords using a comma']", "Enter");
      await this.page.click("//div[@class='s-form-item custom-s-form']//label[normalize-space() = 'Tags']");
    }

    if (pricingInfo.sale_price) {
      await this.page.waitForSelector("(//span[normalize-space()='Sale price']//ancestor::table//input)[1]");
      await this.page.fill(
        "(//span[normalize-space()='Sale price']//ancestor::table//input)[1]",
        pricingInfo.sale_price,
      );
      await this.page.press("(//span[normalize-space()='Sale price']//ancestor::table//input)[1]", "Enter");
    }

    if (pricingInfo.compare_price) {
      await this.page.waitForSelector("(//span[normalize-space()='Compare at price']//ancestor::table//input)[2]");
      await this.page.fill(
        "(//span[normalize-space()='Compare at price']//ancestor::table//input)[2]",
        pricingInfo.compare_price,
      );
      await this.page.press("(//span[normalize-space()='Compare at price']//ancestor::table//input)[2]", "Enter");
    }
    //select main of campaign
    if (pricingInfo.product_name) {
      const xpathDropdown = "//div[@class= 's-select full-width']//select";
      await this.genLoc(xpathDropdown).selectOption({
        label: pricingInfo.product_name,
      });
    }
  }

  /**
   * Get campaign_id from url in pricing page
   */
  getCampaignIdInPricingPage(): number {
    const campaignIds = this.page.url().match(/(\d+)/g);
    return !campaignIds || !campaignIds.length ? 0 : parseInt(campaignIds[0]);
  }

  /*
   *Click to open product detail
   */
  async openCampaignDetail(title: string) {
    await this.page.click(`(//div[@class = 'product-name' and normalize-space() = "${title}"])[1]`);
    await this.waitForElementVisibleThenInvisible(this.xpathProductDetailLoading);
    await this.waitUntilElementVisible(this.xpathProductTitleTxt);
  }

  /*
   *
   */
  async getStatusProgress(): Promise<string> {
    await this.page.click("#icon-process");
    const xpathStatus = "(//span[contains(@class, 'status-tag')]//span)[1]";
    await this.page.waitForSelector(xpathStatus);
    const status = this.getTextContent(xpathStatus);
    await this.page.click("#icon-process");
    return status;
  }

  /*
   *retry to get campaign status with api until campaign status is available
   */
  async getStatusOfFirstCampaign(authRequest: APIRequestContext, domain: string, retries = 5): Promise<boolean> {
    let campLaunchSuccess = false;
    for (let i = 0; i < retries; i++) {
      //TODO tìm phương án khác
      // wait cho campaign launching thanh cong
      await this.page.waitForTimeout(20000);
      const response = await authRequest.get(`https://${domain}/admin/pbase-campaigns.json?page=1&limit=1`);
      if (response.status() === 200) {
        const jsonResponse = await response.json();
        if (jsonResponse.campaigns.length > 0) {
          const status = jsonResponse.campaigns[0].campaign_status;
          switch (status) {
            case "available":
            case "unavailable":
              campLaunchSuccess = true;
              break;
            default:
              break;
          }
        }
      }
      if (campLaunchSuccess) {
        break;
      }
    }
    return campLaunchSuccess;
  }

  /*
   *click Button View to open campaign on store front
   */
  async openCampaignSF() {
    await this.page.click("(//*[child::*[text()[normalize-space()='View']]])[1]");
    await this.page.waitForLoadState("domcontentloaded");
  }

  //Add the first custom option on campaign editor screen
  async clickBtnAddCO() {
    await this.page.click("//div[@class='custom-option--minimized add cursor-pointer']");
  }

  /*
   * Add custom options for campaign on Campaign Editor Scree
   */
  /**
   * @param customOption
   *
   */
  async addCustomOptions(customOption: Array<CustomOptionProductInfo>): Promise<void> {
    for (let i = 0; i < customOption.length; i++) {
      await this.addCustomOption(customOption[i]);
    }
  }

  /*
   * Add custom option for campaign on Campaign Editor Scree
   */
  /**
   *
   * @param customOption
   * @deprecated use function addCustomOptions
   */
  async addCustomOption(customOption: CustomOptionProductInfo): Promise<void> {
    //select type of custom option
    if (customOption.type) {
      if (!customOption.is_edit_custom) {
        await this.page.waitForSelector(".custom-option-detail__container h3");
        await this.page.selectOption(".custom-option-detail__container .custom-option-content .s-select select", {
          label: customOption.type,
        });
      }
    }
    //select target layer for custom option
    if (customOption.target_layer) {
      const value = customOption.target_layer.split(">").map(item => item.trim());
      for (let i = 0; i < value.length; i++) {
        if (i === 0) {
          await this.page.click("//span[normalize-space()='Please select layer']");
        } else {
          await this.page.click("//div[contains(@class,'multiple-layer-selector__container')]");
        }
        await this.page.waitForSelector("//div[@class = 's-dropdown-content']");
        await this.page.click(`//p[normalize-space() = '${value[i]}']`, { timeout: 90000 });
      }
    }

    //select target layer theo base product
    if (customOption.target_layer_base_product) {
      await this.page.uncheck("//span[contains(text(),'Select a shared layer in all products')]");
      await this.page.waitForSelector("//span[normalize-space()='Target layer for every product']");
      for (let i = 0; i < customOption.target_layer_base_product.length; i++) {
        await this.page.click("//span[contains(text(),'Please select layer')]");
        await this.page.waitForSelector("//div[@class = 's-dropdown-content']");
        await this.page.click(`//p[normalize-space() = '${customOption.target_layer_base_product[i]}']`);
      }
    }

    //fill text to label of custom option
    if (customOption.label) {
      await this.page.fill(
        `//div[child::label[contains(text(),'Label')]]//following-sibling::div//input`,
        customOption.label,
      );
    }

    // input data for custom option Text field and Text area
    if (customOption.type === "Text field" || customOption.type === "Text area") {
      if (customOption.font) {
        await this.page.click("//input[@id='font-list-undefined' or contains(@id,'font-list-text-co')]");
        const xpathFontValue = `//span[contains(@class,'s-dropdown-item')]//span[contains(.,'${customOption.font}')]`;
        await this.page.click(xpathFontValue);
      }

      if (customOption.placeholder) {
        await this.page.fill(
          `//div[child::label[contains(text(),'Placeholder')]]//following-sibling::div//input`,
          customOption.placeholder,
        );
      }

      if (customOption.max_length) {
        await this.page.fill(
          `//div[child::label[contains(text(),'Max length')]]//following-sibling::div//input`,
          customOption.max_length,
        );
      }
      if (customOption.allow_character) {
        const listCharacter = await this.page
          .locator("//div[child::label[normalize-space()='Allow the following characters']]//span[@class='s-check']")
          .count();
        for (let i = 1; i < listCharacter; i++) {
          const xpath = `(//div[child::label[normalize-space()='Allow the following characters']]//span[@class='s-check'])[${i}]`;
          await this.page.uncheck(xpath);
        }
        const character = customOption.allow_character.split(",").map(item => item.trim());
        for (let i = 0; i < character.length; i++) {
          await this.page.check(`//span[normalize-space(text())='${character[i]}']//preceding-sibling::span`);
        }
      }

      if (customOption.default_value) {
        await this.page.fill(
          `//div[child::label[contains(text(),'Default value')]]//following-sibling::div//input`,
          customOption.default_value,
        );
      }
    }

    // input data for custom option Picture choice
    if (customOption.type === "Picture choice") {
      const xpathSelectClipart = `(//div[@class='s-dropdown-content']//span[contains(text(),'${customOption.value_clipart}')])[1]`;
      const xpathSelectType = `//label[contains(@class,'s-radio')]//span[contains(text(),'${customOption.type_clipart}')]`;
      const xpathDisplay = `//span[contains(text(),'${customOption.type_display_clipart}')]`;
      switch (customOption.type_clipart) {
        case "Group":
          await this.page.click(
            `//label[contains(@class,'s-radio')]//span[contains(text(),'${customOption.type_clipart}')]`,
          );
          await this.page.click(xpathSelectType);
          await this.page.click("#pc-clipart-group-input");
          await this.page.fill("#pc-clipart-group-input", customOption.value_clipart);
          await this.page.waitForSelector(`//span[normalize-space()='${customOption.value_clipart}']`);
          await this.page.click(xpathSelectClipart);
          if (customOption.type_display_clipart) {
            await this.page.click(xpathDisplay);
          }
          await this.page.waitForSelector("//div[@class='s-ml24']//div[@class='hOmsrR']/following-sibling::div");
          break;
        default:
          await this.page.click(`(//span[contains(text(),'${customOption.type_clipart}')])`);
          await this.page.click("#pc-clipart-folder-input");
          await this.page.waitForSelector("//div[@class='s-dropdown-menu has-header']");
          await this.page.locator("//input[@id='pc-clipart-folder-input']").fill(customOption.value_clipart);
          await this.page.waitForTimeout(2000);
          if (
            await this.page
              .locator(
                `(//div[@class='s-dropdown-content']//span[contains(text(),'${customOption.value_clipart}')])[1]`,
              )
              .isVisible()
          ) {
            await this.page.click(xpathSelectClipart);
          } else {
            await this.page.click(this.getXpathWithLabel("Add a clipart folder", 1));
            await this.addNewClipartFolder(customOption.clipart_info);
            await this.clickOnBtnWithLabel("Save changes", 2);
          }
          if (customOption.type_display_clipart) {
            await this.page.click(xpathDisplay);
          }
          break;
      }
    }

    // input data for custom option Radio and Droplist
    if (customOption.type === "Radio" || customOption.type === "Droplist") {
      if (customOption.font) {
        await this.page.click("//input[@id='font-list-undefined' or contains(@id,'font-list-text-co')]");
        const xpathFontValue = `//span[contains(@class,'s-dropdown-item')]//span[contains(.,'${customOption.font}')]`;
        await this.page.click(xpathFontValue);
      }
      if (customOption.value) {
        const value = customOption.value.split(">").map(item => item.trim());
        const xpathCount = `//div[child::div[normalize-space()='Value']]//following-sibling::div`;
        await this.page.waitForSelector(xpathCount, { timeout: 5000 });
        const countValue = await this.page.locator(xpathCount).count();
        for (let j = 0; j < value.length - countValue; j++) {
          await this.clickOnBtnWithLabel("Add more value");
        }
        for (let i = 0; i < value.length; i++) {
          await this.page.fill(`(//div[contains(@class,'is-required')]//input)[${i + 1}]`, value[i]);
        }
      }
    }

    // input data for custom option Checkbox
    if (customOption.type === "Checkbox") {
      if (customOption.value) {
        const value = customOption.value.split(",").map(item => item.trim());
        const xpath = "//input[contains(@placeholder,'Separate options with comma')]";
        for (let i = 0; i < value.length; i++) {
          await this.page.fill(xpath, value[i]);
          await this.page.press(xpath, "Enter");
        }
      }
    }
    const xpathSaveBtn = "//button[normalize-space()='Save']";
    //Trường hợp custom option với PC thì sau khi chọn clipart cần đợi một lúc mới click vào btn Save được
    await this.page.waitForTimeout(2000);
    await this.page.click(xpathSaveBtn);
    await this.page.isDisabled(xpathSaveBtn);
    //click back to CO list
    await this.page.click("//div[contains(@class,'custom-option')]//i[@class='mdi mdi-chevron-left mdi-36px']");

    if (customOption.group?.length) {
      await this.clickOnBtnWithLabel("Customize layer");
      return;
    }
    //add option above or add option below
    if (customOption.position) {
      const xpathCO = `//div[contains(@class,'custom-option__item') and child::div[contains(.,'${customOption.label}')]]`;
      const xpathPosition = `${xpathCO}//div[contains(text(), 'Add option ${customOption.position}')]`;
      await this.page.hover(xpathCO);
      await this.page.isVisible(xpathPosition);
      await this.page.click(xpathPosition);
    }
    if (!customOption.add_fail) {
      await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
    }
  }

  // tạo custom option với setting resize text
  async createLayerWithSettingResizeText() {
    await this.page.click(
      "//*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ'," +
        "'abcdefghijklmnopqrstuvwxyz'),'please select layer')]",
    );
    await this.page.click("//p[@class='text-normal text-overflow']");
    await this.clickOnCheckboxWithLabel("Auto scale when text is too long");
  }

  /**
   * click preview PrintFile trong order detail
   */
  async previewPrintFile() {
    await this.page.waitForSelector("//span[contains(text(),'Print file has been generated')]");
    await this.page.waitForSelector(
      "(//span[contains(text(),'Print file has been generated')]//following::button//i)[1]",
    );
    await this.page.waitForTimeout(5000);
    await this.page.click("(//span[contains(text(),'Print file has been generated')]//following::button//i)[1]");
  }

  /**
   * Click sync layer on editor product ( sử dụng cho cả layer trong và ngoài group)
   */
  async clickSyncLayer(layername: string) {
    const listLayerName = layername.split(",").map(item => item.trim());
    for (let i = 0; i < listLayerName.length; i++) {
      await this.page.click(
        `//span[normalize-space()='${listLayerName[i]}']//ancestor::div[@class='single-layer__container layer-in-group' or @class='single-layer__container']//i[contains(@class,'sync')]`,
      );
      await this.page.hover(this.xpathTaskBarInEditor);
    }
  }

  /**
   * Click on Sync of groupp
   * @param nameGroup name Group want to Sync
   */
  async clickSyncGroup(nameGroup: string) {
    const listGroup = nameGroup.split(",").map(item => item.trim());
    for (let i = 0; i < listGroup.length; i++) {
      await this.page.click(
        `//div[@class='layer__container']//div[normalize-space()='${listGroup[i]}']//parent::div[contains(@class,'content__center text-left')]/following-sibling::div//div[@class='s-tooltip-fixed display-inline-block']`,
      );
    }
  }

  /**
   * Click on a action of group
   * @param nameGroup name Group want to Action
   * @param nameAction input name Action(Delete, Duplicate, Ungroup)
   */
  async clickActionsGroup(nameGroup: string, nameAction: string) {
    await this.page.click(
      `//div[@class='layer__container']//div[normalize-space()='${nameGroup}']//parent::div/following-sibling::div//div[contains(@class,'s-dropdown d-flex align-items-center')]`,
    );
    await this.page.click(`//span[normalize-space()='${nameAction}']`);
    if (await this.genLoc("//p[normalize-space()='Delete group']").isVisible()) {
      await this.clickOnBtnWithLabel("Delete");
    }
    await this.page.waitForTimeout(2000);
  }

  /**
   * Function get all customize layer, customize group in CO
   * @returns Return 1 list include (customize layer and customize group)
   */
  async getlistCustomOption(): Promise<string[]> {
    const nameCustomzieOption = this.page.locator(
      "//div[contains(@class,'custom-option__item')]//a[contains(@class,'title')]",
    );
    const listCO = await nameCustomzieOption.evaluateAll(list => list.map(element => element.textContent.trim()));
    return listCO;
  }

  /*
   *get process info when import campaign from csv file
   */
  async getProcessImportInfo(authRequest: APIRequestContext, domain: string, fileName: string) {
    const response = await authRequest.get(`https://${domain}/admin/action-progress.json`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    if (jsonResponse.progresses.length > 0) {
      for (let i = 0; i < jsonResponse.progresses.length; i++) {
        if (jsonResponse.progresses[i].meta_data.file_name === fileName) {
          const status = jsonResponse.progresses[i].status;
          if (status === "done") {
            const insert = jsonResponse.progresses[i].inserted_record;
            const total = jsonResponse.progresses[i].total_record;
            const skip = jsonResponse.progresses[i].skipped_record;
            return [insert, total, skip];
          }
        }
      }
    }
    return false;
  }

  /*
   *get campaign id from current url
   */
  async getCampaignID(platform = "PrintBase") {
    const url = this.page.url();
    const urlRegex = url.split("/");
    let campaignID;
    if (platform === "PrintBase") {
      campaignID = urlRegex[7];
    } else {
      campaignID = urlRegex[8];
    }
    return campaignID;
  }

  /*
   *get campaign detail info from campaign detail API
   */
  async getCampaignInfo(
    authRequest: APIRequestContext,
    domain: string,
    campaignID: string,
    campaignValue: CampaignValue,
  ) {
    this.page.reload();
    const response = await this.page.waitForResponse(
      response => {
        return response.url().includes(`/admin/pbase-campaigns/live/${campaignID}.json`) && response.status() === 200;
      },
      { timeout: 190000 },
    );

    let jsonResponse;
    try {
      jsonResponse = await response.json();
    } catch (e) {
      return this.getCampaignInfo(authRequest, domain, campaignID, campaignValue);
    }

    const campaignInfoApi = this.cloneObject<CampaignValue>(campaignValue);
    if (campaignValue.campaign_name) {
      campaignInfoApi.campaign_name = jsonResponse.product.title;
    }
    if (campaignValue.description) {
      campaignInfoApi.description = jsonResponse.product.body_html;
    }
    if (campaignValue.tags) {
      campaignInfoApi.tags = jsonResponse.product.tags;
    }
    if (campaignValue.style) {
      campaignInfoApi.style = jsonResponse.product.options[0].values;
    }

    if (campaignValue.color) {
      campaignInfoApi.color = jsonResponse.product.options[1].values;
    }
    if (campaignValue.size) {
      campaignInfoApi.size = jsonResponse.product.options[2].values;
    }
    if (campaignValue.number_image) {
      const listImage = jsonResponse.product.images;
      campaignInfoApi.number_image = listImage.map((value: { src: string }) => value.src).length;
    }
    if (campaignValue.compare_at_price) {
      campaignInfoApi.compare_at_price = jsonResponse.product.variants[0].compare_at_price;
    }
    if (campaignValue.price) {
      campaignInfoApi.price = jsonResponse.product.variants[0].price;
    }
    return campaignInfoApi;
  }

  /*
   *get total of campaign on Campaign List Screen
   */
  async getTotalCampaign(authRequest: APIRequestContext, domain: string) {
    const response = await authRequest.get(`https://${domain}/admin/pbase-campaigns.json`);
    if (response.status() === 200) {
      const jsonResponse = await response.json();
      const numberCampaign = jsonResponse.campaigns.length;
      return numberCampaign;
    }
  }

  /**
   * click button Cancel on popup when upload incorrect csv
   */
  async clickCancelPopUp() {
    await this.page.click("//footer[@class = 's-modal-card-foot']//button[normalize-space() = 'Cancel']");
  }

  /**
   * click btn Expand to open list custom option
   */
  async clickBtnExpand() {
    await this.page.click("//div[contains(@class,'expand-action__container')]");
  }

  /**
   * Click icon add condition logic on custom option list
   * @param conditionInfo inclue info custom option (custom name, condition...)
   */
  async clickIconAddConditionLogic(conditionInfo: ConditionInfo): Promise<void> {
    const xpathIconAddConditional =
      `//a[normalize-space()='${conditionInfo.custom_name}']//ancestor::div[contains(@class,'content__center')]//following-sibling::` +
      "div[contains(@class,'content__right')]//span[contains(@class,'s-popover__reference') or contains(@class,'s-icon cursor-pointer')]//i";
    await this.page.click(xpathIconAddConditional);
    await this.page.waitForSelector("//div[contains(@class,'conditional-logic-container')]");
  }

  /**
   * add some base products
   * @param baseProductInfos
   */
  async addBaseProducts(baseProductInfos: Array<BaseProductInfor>) {
    for (let i = 0; i < baseProductInfos.length; i++) {
      await this.addBaseProduct(baseProductInfos[i]);
    }
  }

  /**
   * Add list condition logic on custom option list
   * @param conditionInfo inclue info custom option (custom name, condition...)
   */
  async addListConditionLogic(conditionInfo: Array<ConditionInfo>): Promise<void> {
    for (let i = 0; i < conditionInfo.length; i++) {
      await this.clickIconAddConditionLogic(conditionInfo[i]);
      await this.addConditionalLogic(conditionInfo[i]);
      if (conditionInfo[i].is_back_to_list) {
        await this.page.click(this.xpathIconBack);
      }
    }
  }

  /**
   * Add multiple conditonal logic of custom option on editor screen
   * @param conditionInfos
   */
  async addMultipleConditionalLogic(conditionInfos: ConditionInfo[]): Promise<void> {
    let index = 1;
    for (const blockCondition of conditionInfos) {
      // blockCondition đầu tiên k cần add, mặc định đã có
      if (index > 1) {
        await this.page.locator("//div[contains(@class,'actions')]//i[contains(@class,'mdi-plus')]").click();
      }
      const block = `(//div[contains(@class,'conditional-logic-container')]
        //div[contains(@class,'rule-wrapper')])[${index}]`;
      // add condition
      const totalCondition = blockCondition.condition.length;
      for (let i = 1; i <= totalCondition; i++) {
        const conditionPair = blockCondition.condition[i - 1].split(">").map(item => item.trim());
        if (conditionPair.length != 2) {
          continue;
        }
        const conditionType = conditionPair[0];
        const conditionValue = conditionPair[1];
        await this.page.selectOption(`(${block}//div[@class='s-select f-1']/select)[${i}]`, { label: conditionType });
        await this.page.selectOption(`(${block}//div[contains(@class,'s-select f-1 ruleIndex')]//select)[${i}]`, {
          label: conditionValue,
        });
        // kiểm tra xem còn condition cần add k? nếu k thì dừng lại, condition cuối thì break
        if (i == totalCondition) {
          break;
        }
        await this.page.click(
          "//div[contains(@class,'conditional-logic-container')]//" +
            "div//span[normalize-space()='Add another condition']",
        );
      }

      // add then show
      const totalThenShow = blockCondition.then_show_value.length;
      for (let i = 1; i <= totalThenShow; i++) {
        const value = blockCondition.then_show_value[i - 1];
        await this.page.selectOption(`(${block}//div[@class='s-select']/select)[${i}]`, { label: value });
        // kiểm tra xem còn then_show cần add k? nếu k thì dừng lại
        if (i == totalThenShow) {
          break;
        }
        await this.page.click(`(${block}//span[normalize-space()='Add new option']`);
      }
      index++;
    }
  }

  /**
   * Add conditonal logic of custom option on editor screen
   * @param conditionInfo inclue info custom option (custom name, condition...)
   */
  async addConditionalLogic(conditionInfo: ConditionInfo): Promise<void> {
    //add block conditional logic
    if (conditionInfo.add_condition == "yes") {
      await this.page.locator("//div[contains(@class,'actions')]//i[contains(@class,'mdi-plus')]").click();
      for (let i = 0; i < conditionInfo.condition.length; i++) {
        const value = conditionInfo.condition[i].split(">").map(item => item.trim());
        if (value[0]) {
          await this.page.selectOption(
            `(//div[contains(@class,'conditional-logic-container')]/div` +
              `//div[@class='s-select f-1']/select)[${i + 1}]`,
            { label: value[0] },
          );
        }
        if (value[0]) {
          await this.page.selectOption(
            `(//div[contains(@class,'conditional-logic-container')]` +
              `//div[contains(@class,'rule-wrapper')])[${
                i + 1
              }]//div[contains(@class,'s-select f-1 ruleIndex')]//select`,
            { label: value[1] },
          );
        }
      }
      for (let i = 0; i < conditionInfo.then_show_value.length; i++) {
        if (conditionInfo.then_show_value[i]) {
          await this.page.selectOption(
            `(//div[contains(@class,'conditional-logic-container')]` +
              `//div//div[@class='s-select']/select)[${i + 1}]`,
            { label: conditionInfo.then_show_value[i] },
          );
        }
      }
    } else {
      // add condition on condition logic detail
      await this.page.waitForTimeout(1000);
      const countCondition = await this.page
        .locator("//div[contains(@class,'conditional-logic-container')]//div[@class='row s-mb16']")
        .count();
      for (let i = 0; i < conditionInfo.condition.length - countCondition; i++) {
        await this.page.click(
          "//div[contains(@class,'conditional-logic-container')]//" +
            "div//span[normalize-space()='Add another condition']",
        );
      }
      for (let i = 0; i < conditionInfo.condition.length; i++) {
        const value = conditionInfo.condition[i].split(">").map(item => item.trim());
        if (value[0]) {
          await this.page.selectOption(
            `(//div[contains(@class,'conditional-logic-container')]//div` +
              `//div[@class='s-select f-1']/select)[${i + 1}]`,
            { label: value[0] },
          );
        }
        if (value[1]) {
          await this.page.selectOption(
            `(//div[contains(@class,'conditional-logic-container')]//div` +
              `//div[@class='s-select f-1 ruleIndex0']/select)[${i + 1}]`,
            { label: value[1] },
          );
        }
      }
      // add custom option then show on SF
      for (let i = 0; i < conditionInfo.then_show_value.length - 1; i++) {
        await this.page.click(
          `//div[contains(@class,'conditional-logic-container')]/div` + `//span[contains(text(),'Add new option')]`,
        );
      }
      for (let i = 0; i < conditionInfo.then_show_value.length; i++) {
        if (conditionInfo.then_show_value[i]) {
          await this.page.selectOption(
            `(//div[contains(@class,'conditional-logic-container')]` +
              `//div//div[@class='s-select']/select)[${i + 1}]`,
            { label: conditionInfo.then_show_value[i] },
          );
        }
      }
    }
  }

  /**
   * click button button Bulk duplicate campaign
   */
  async clickBulkDuplicate(campaignName: string) {
    await this.page.waitForSelector(
      `//span[normalize-space()='${campaignName}']` + `//ancestor::tr//i[contains(@class,'content-duplicate')]`,
    );
    await this.page.click(
      `//span[normalize-space()='${campaignName}']` + `//ancestor::tr//i[contains(@class,'content-duplicate')]`,
    );
  }

  /**
   * Upload file artwork on bulk duplicate
   * @param artworkName name of file need upload
   * @param artworkBack
   */
  async uploadFileOnBulkDuplicate(artworkName: string, artworkBack?: string) {
    const listImage = artworkName.split(",").map(item => item.trim());
    for (let i = 0; i < listImage.length; i++) {
      await this.page
        .locator("//label[normalize-space()='Upload Files']")
        .setInputFiles(`./data/shopbase/${listImage[i]}`);
    }
    if (artworkBack) {
      const listImageBack = artworkBack.split(",").map(item => item.trim());
      for (let i = 0; i < listImageBack.length; i++) {
        await this.page
          .locator("(//p[normalize-space()='Back']//parent::td//input[@type='file'])[1]")
          .setInputFiles(`./data/shopbase/${listImageBack[i]}`);
      }
    }
  }

  /**
   * click button Launch campaign on Bulk duplicate screen
   */
  async clickButtonLaunch() {
    await this.page.waitForSelector("//span[normalize-space()='Launch campaigns']");
    await this.page.click("//span[normalize-space()='Launch campaigns']");
    await this.page.waitForSelector("(//div[@class = 'product-name'])[1]");
  }

  /**
   * Get message upload file on bulk duplicate campaign
   * @returns
   */
  async getMesageUploadFailed(): Promise<string> {
    return await this.getTextContent("//span[@class='text-red text-normal']");
  }

  /**
   *
   * @param title delete artwork on bulk duplicate screen
   * @param index
   */
  async deleteArtworkOnBulkDuplicate(title: string, index = 2) {
    await this.page.click(`(//span[contains(text(),'${title}')]//ancestor::tr//i)[${index}]`);
  }

  /**
   * Upload artwork for side campaign
   * @param sideName name of side ( Front, Back)
   * @param artworkName name of file need upload
   */
  async uploadFileForSide(sideName: string, artworkName: string) {
    await this.page
      .locator(`//p[normalize-space()='${sideName}']//ancestor::td//label`)
      .setInputFiles(`./data/shopbase/${artworkName}`);
  }

  /**
   * Add base product from catalog
   * @param baseProductInfor include category and base product name
   */
  async addBaseProduct(baseProductInfor: BaseProductInfor) {
    await this.page.click(`//div[@class='product-catagory']//p[text()='${baseProductInfor.category}']//ancestor::li`);
    await this.page.waitForSelector(
      "//div[contains(@class, 'phub-catalog')]//div[contains(@class, 'body') or contains(@class, 'empty-catalog')]",
    );
    const baseProducts = baseProductInfor.base_product.split(",");
    for (let i = 0; i < baseProducts.length; i++) {
      const xpathBaseProduct = `(//span[contains(@data-label,'${baseProducts[i]}')])[1]//ancestor::div[@class='prod-wrap']//button[contains(.,'Add product')]`;
      await this.page.waitForSelector(xpathBaseProduct);
      await this.page.locator(xpathBaseProduct).scrollIntoViewIfNeeded();
      await this.page.click(xpathBaseProduct, { timeout: 90000 });
    }
  }

  /**
   * Add multi base product from catalog
   * @param baseProductsInfo include list category and base product name
   * @param platform type of platform, apply for PrintBase or PlusBase
   */
  async addListBaseProduct(baseProductsInfo: BaseProductInfor[], platform?: "PrintBase" | "PlusBase") {
    if (platform == "PrintBase" || platform == undefined) {
      await this.page.waitForResponse(
        response =>
          response.url().includes("/admin/pbase-product-base/catalogs.json") ||
          (response.url().includes("/admin/pbase-product-base/shipping-combos.json") && response.status() === 200),
      );
    }
    for (const baseProductInfo of baseProductsInfo) {
      await this.page.click(`//p[normalize-space() = '${baseProductInfo.category}']`);
      await this.page.waitForTimeout(3000);
      await this.page.click(
        `//span[@data-label='${baseProductInfo.base_product}']//` +
          `ancestor::div[@class='prod-wrap']//button[contains(.,'Add product')]`,
      );
    }
  }

  /**
   * create new group in editor
   * @param groupInfo
   */
  async createGroupLayers(groupInfo: Array<GroupInfo>) {
    for (let i = 0; i < groupInfo.length; i++) {
      if (groupInfo[i].side) {
        await this.page.click(
          `//span[contains(.,'${groupInfo[i].side}')]/ancestor::div[contains(@class,'s-collapse-item artwork')]//div[contains(@class,'s-popover__reference')]`,
        );
      } else {
        await this.page.click("//div[contains(@class,'s-popover__reference')]");
      }

      await this.editGroupLayer(groupInfo[i].current_group, groupInfo[i].new_group);
    }
  }

  /**
   * create new group in editor
   * @param currentGroup : name group after click icon create group
   * @param newGroup : name group after edit group
   * @param side :
   * @deprecated use function createGroupLayers
   */
  async createGroupLayer(currentGroup: string, newGroup: string, side?: string, checkAvailable?: boolean) {
    if (side) {
      await this.page.click(
        `//span[contains(.,'${side}')]/ancestor::div[contains(@class,'s-collapse-item artwork')]//div[contains(@class,'s-popover__reference')]`,
      );
      await this.page.dblclick(`//span[normalize-space()="${currentGroup}"]`);
      await this.page.waitForTimeout(2000);
      await this.page.fill(
        `//span[contains(.,'${side}')]//ancestor::div[contains(@class,'s-collapse-item artwork')]//div[contains(@class,'layer-group__title--input')]//input`,
        newGroup,
      );
    } else if (checkAvailable === true) {
      await this.page.dblclick(`//span[normalize-space()="${currentGroup}"]`);
      await this.page.waitForTimeout(2000);
      await this.page.fill(
        `//span[contains(.,'${side}')]//ancestor::div[contains(@class,'s-collapse-item artwork')]//div[contains(@class,'layer-group__title--input')]//input`,
        newGroup,
      );
    } else {
      await this.page.click("//span[@place='action']//div[contains(@class,'s-popover__reference')]");
      await this.page.dblclick(`//span[normalize-space()="${currentGroup}"]`);
      await this.page.waitForTimeout(2000);
      await this.page.fill(
        `//div[@class='single-layer__container group-container']` +
          `//div[@class='text-small layer-group__title--input s-input']//input`,
        newGroup,
      );
    }
    await this.page.keyboard.press("Enter");
  }

  /**
   * Create layers after add layer to group layer
   * @param layerList
   * @param createGroupLayer
   * @param addLayersToGroup
   */
  async createLayerAndAddLayerToGroup(
    layerList: Array<Layer>,
    createGroupLayer: Array<GroupInfo>,
    addLayersToGroup: Array<AddLayersToGroupInfo>,
  ) {
    for (let i = 0; i < createGroupLayer.length; i++) {
      await this.createGroupLayers([createGroupLayer[i]]);
      await this.addNewLayers(layerList.slice(0, Number(createGroupLayer[i].new_group.split(" ")[1])));
      await this.addLayersToGroup([addLayersToGroup[i]]);
    }
    //add layer image
    for (let i = 0; i < layerList.length; i++) {
      if (layerList[i].layer_type !== "Image") continue;
      await this.addNewLayers([layerList[i]]);
    }
  }

  /**
   * Function edit group
   * @param currentGroup name group after click icon create group
   * @param newGroup name group after edit group
   * @param side side name is Front or Back
   */
  async editGroupLayer(currentGroup: string, newGroup: string): Promise<void> {
    const xpath = `//span[normalize-space()="${currentGroup}"]//parent::div//preceding-sibling::div[contains(@class,'layer-group__title--input')]//input`;
    await this.page.dblclick(`//span[normalize-space()="${currentGroup}"]`);
    await this.page.waitForTimeout(2000);
    await this.page.fill(xpath, newGroup);
    await this.page.keyboard.press("Enter");
  }

  /**
   * Add layer to group in editor
   * @param addLayersToGroupInfo
   */
  async addLayersToGroup(addLayersToGroupInfo: Array<AddLayersToGroupInfo>) {
    for (let i = 0; i < addLayersToGroupInfo.length; i++) {
      const listLayer = addLayersToGroupInfo[i].layer_name.split(",").map(item => item.trim());
      for (let j = 0; j < listLayer.length; j++) {
        await this.page.click(
          `//div[contains(@class,'content__center') and descendant::span[normalize-space()="${listLayer[j]}"]]` +
            `//following-sibling::div//div[@class='s-dropdown-trigger']//i`,
        );
        await this.page.waitForTimeout(500);
        await this.page.click(
          `//div[contains(@class,'content__center') and descendant::span[normalize-space()="${listLayer[j]}"]]` +
            `//following-sibling::div//span[contains(normalize-space(),"${addLayersToGroupInfo[i].group_name}")]`,
        );
      }
    }
  }

  /**
   * Add layer to group in editor
   * @param layerName : layer text or image
   * @param groupName : name group
   * @deprecated use function addLayersToGroup
   */
  async addLayerToGroup(layerName: string, groupName: string) {
    const listLayer = layerName.split(",").map(item => item.trim());
    for (let i = 0; i < listLayer.length; i++) {
      await this.page.click(
        `//div[contains(@class,'content__center') and descendant::span[normalize-space()="${listLayer[i]}"]]` +
          `//following-sibling::div//div[@class='s-dropdown-trigger']//i`,
      );
      await this.page.waitForTimeout(500);
      await this.page.click(
        `//div[contains(@class,'content__center') and descendant::span[normalize-space()="${listLayer[i]}"]]` +
          `//following-sibling::div//span[contains(normalize-space(),"${groupName}")]`,
      );
    }
  }

  /**
   * set up custmize group for print base
   * @param customizeGroup include option, label, name and default value
   */
  async setupCustomizeGroupForPB(customizeGroup: CustomizeGroup) {
    if (!customizeGroup.camp_launched) {
      await this.clickOnBtnWithLabel("Customize group", 1);
    }
    await this.fillDataCustomizeGroup(customizeGroup);
    if (customizeGroup.camp_launched) return;
    await this.page.click("//span[normalize-space()='Save']");
    if (!customizeGroup.back_to_list) {
      await this.page.click("(//div[@class='customize-group__container']//i)[1]");
    }
  }

  /**
   * fill data for label in customize group
   * @param customizeGroup include option, label, name and default value
   */
  async fillDataCustomizeGroup(customizeGroup: CustomizeGroup): Promise<void> {
    await this.genLoc("//label[normalize-space()='Display the options as']//parent::div//select").selectOption({
      label: customizeGroup.option_group,
    });

    if (customizeGroup.label_group) {
      await this.page.fill(this.xpathInputLabelCustomizeGroup, customizeGroup.label_group);
    }
    if (customizeGroup.option_group === "Radio" || customizeGroup.option_group === "Droplist") {
      const listGroup = customizeGroup.group_name.split(",").map(item => item.trim());
      for (let i = 0; i < listGroup.length; i++) {
        await this.page
          .locator(`(//div[contains(@class,'group__item')]//input[@type='text'])[${i + 1}]`)
          .fill(listGroup[i]);
      }
    } else if (customizeGroup.option_group === "Picture choice") {
      const listImage = customizeGroup.group_name.split(",").map(item => item.trim());
      let xpathUploadFile = "(//span[normalize-space()='Upload image']//following-sibling::input[@type='file'])[1]";
      for (let i = 0; i < listImage.length; i++) {
        if (customizeGroup.camp_launched) {
          xpathUploadFile = `(//div[@id='editor-zone']//div[@class='group__container']//input[@type='file'])[${i + 1}]`;
        }
        if (listImage[i].includes(".png") || listImage[i].includes(".jpeg") || listImage[i].includes(".jpg")) {
          await this.page.setInputFiles(xpathUploadFile, `./data/shopbase/${listImage[i]}`);
          if (customizeGroup.camp_launched) {
            await this.waitForElementVisibleThenInvisible(this.xpathUploadImageLoad);
          } else {
            await this.waitForElementVisibleThenInvisible(this.xpathWaitUploadFileImgFinished);
          }
        } else {
          await this.page.setInputFiles(xpathUploadFile, `./data/shopbase/${listImage[i]}`);
          await this.isToastMsgVisible("File in wrong format");
        }
      }
    }
    if (!customizeGroup.is_no_group_default) {
      await this.genLoc("//select[@class='select-default']").selectOption({ label: customizeGroup.default_value });
    }
  }

  /**
   * Add product or remove base product on popup Add more product of editor
   * @param baseProduct : product name need add or remove
   */
  async addOrRemoveProduct(category: string, baseProduct: string) {
    await this.page.click("//button[contains(@class,'add-base-product')]");
    await this.page.waitForTimeout(2000);
    await this.page.click(`//p[normalize-space() = "${category}"]`);
    const listProduct = baseProduct.split(",").map(item => item.trim());
    for (let i = 0; i < listProduct.length; i++) {
      await this.page.click(`//div[@class='phub-catalog']//span[normalize-space()='${listProduct[i]}']`);
    }
    await this.clickOnBtnWithLabel("Update campaign");
  }

  /**
   * count number base product selected on editor screen
   * @param countProduct: number base product show on editor
   * @returns
   */
  async countBaseProductOnEditor(): Promise<number> {
    const countProduct = await this.page.locator("//div[contains(@class,'fixed base-product')]").count();
    return countProduct;
  }

  /**
   * delete base product on Editor screen
   * @param product: product name need delete
   */
  async deleteBaseProduct(product: string) {
    await this.hoverThenClickElement(
      `//span[normalize-space()='${product}']//parent::div[contains(@class,'fixed base-product')]`,
      `//span[normalize-space()='${product}']//parent::div//a[@class='s-delete']`,
    );
    await this.clickOnBtnWithLabel("Delete");
  }

  /**
   * Delete all campaign on list
   * @param password: password account login
   * @param platform: type of platform, apply for PrintBase or PlusBase
   */
  async deleteAllCampaign(password?: string, platform?: "PrintBase" | "PlusBase") {
    await this.page.waitForSelector("//span[@data-label='Select all campaigns']//span[@class='s-check']");
    if (await this.genLoc("//strong[normalize-space()='You have no campaigns yet']").isHidden()) {
      if ((await this.genLoc("//p[contains(text(),'Could not find any campaigns matching ')]").isVisible()) === false) {
        await this.genLoc("//span[@data-label='Select all campaigns']//span[@class='s-check']").click();
        if (
          await this.genLoc(
            "button[class='s-button s-ml16 is-text'] span[class='s-flex s-flex--align-center']",
          ).isVisible()
        ) {
          await this.genLoc(
            "button[class='s-button s-ml16 is-text'] span[class='s-flex s-flex--align-center']",
          ).click();
        }
        await this.genLoc("//button[normalize-space()='Action']").click({ timeout: 5000 });
        await this.genLoc("text=Delete selected campaigns").click();
        if (platform == "PrintBase" || platform == undefined) {
          const xpath = "//div[contains(@class,'s-animation-content')]";
          if (await this.page.locator(xpath).isVisible()) {
            if ((await this.genLoc("//form[@class='s-form']//input").count()) > 0) {
              await this.page.waitForLoadState("load");
              await this.genLoc("//form[@class='s-form']//input").fill(password);
              await this.page.click(
                "//div[@class='s-modal-footer']//button[descendant::span[contains(text(),'Confirm')]]",
              );
            }
          }
        }
        await this.page.waitForLoadState("networkidle");
        await this.genLoc("button:has-text('Delete')").click();
        await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
      }
    }
  }

  /**
   * get campaign ID
   * @param authRequest
   * @param campaignName
   * @param domain
   * @param accessToken
   * @returns
   */
  async getIDCampaign(
    authRequest: APIRequestContext,
    campaignName: string,
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
    const campaigntUrl = `https://${domain}/admin/pbase-campaigns.json?title=${campaignName}`;
    if (accessToken) {
      response = await this.page.request.get(campaigntUrl);
    } else {
      response = await authRequest.get(campaigntUrl, options);
    }

    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.campaigns[0].campaign_id;
  }

  /**
   * Open layer detail on Editor
   * @param layer is data of layer
   */
  async openLayerDetail(layer: Layer) {
    const xpathSide = `//span[contains(.,'${layer.front_or_back}')]/ancestor::div[contains(@class,'s-collapse-item artwork')]`;
    const xpathLayerName = `//span[normalize-space()='${layer.layer_name}']`;
    const xpathSideLayer = `(${xpathSide}${xpathLayerName})[1]`;
    if (layer.front_or_back === "Front" || layer.front_or_back === "Back") {
      await this.page.click(xpathSideLayer);
    } else {
      await this.page.click(`(${xpathLayerName})[1]`);
    }
  }

  /**
   * Upload and select artwork psd on Editor screen
   * @param product: product name need delete
   */
  async uploadAndSelectArtwork(side: string, layerType: string, artworkName: string) {
    const xpathSide = `//span[contains(.,'${side}')]/ancestor::div[contains(@class,'s-collapse-item artwork')]`;
    const xpathButtonName = `//button[child::span[normalize-space()="Add ${layerType.toLowerCase()}"]]`;
    const xpathButtonLayer = `${xpathSide}${xpathButtonName}`;
    await this.page.click(xpathButtonLayer);
    const listImage = artworkName.split(",").map(item => item.trim());
    for (let i = 0; i < listImage.length; i++) {
      await this.page
        .locator("//span[normalize-space()='Upload']//input")
        .setInputFiles(`./data/shopbase/${listImage[i]}`);
    }
    const xpathIconSuccess = `//span[@data-label='${artworkName}']//ancestor::div[@class='artwork']//span[contains(@class,'icon-success')]`;
    await this.page.waitForSelector(xpathIconSuccess);
    await this.page.click(
      `//div[@class='title processing' and child::span[@data-label="${artworkName}"]]//preceding-sibling::div`,
    );
  }

  /**
   * Determine layer of front side or back side
   * Edit fied of layer detail on editor
   * @param layer field name of layer detail
   */
  async editLayerDetail(layer: Layer): Promise<void> {
    const xpathSide = `//span[contains(.,'${layer.front_or_back}')]/ancestor::div[contains(@class,'s-collapse-item artwork')]`;
    const xpathLayerName = `//span[normalize-space()='${layer.layer_name}']`;
    const xpathSideLayer = `(${xpathSide}${xpathLayerName})[1]`;
    if (layer.front_or_back === "Front" || layer.front_or_back === "Back") {
      await this.page.click(xpathSideLayer);
    } else {
      await this.page.click(`(${xpathLayerName})[1]`);
    }
    await this.clearInPutData("//span[contains(text(),'X')]//parent::div[@class='s-input s-input--prefix']//input");
    if (layer.layer_type === "Text") {
      if (layer.layer_value) {
        await this.page.fill(`//input[@placeholder='Add your text']`, layer.layer_value);
      }
    }
    // Config for layer
    if (layer.font_name) {
      await this.page.click("//input[@id='font-list-layer-font']");
      await this.page.click(`//span[@class='s-dropdown-item']//span[normalize-space()='${layer.font_name}']`);
    }
    if (layer.font_size) {
      await this.page.fill(`//div[@class='text-form-data-custom']//div[@class='row']//input`, layer.font_size);
    }

    if (layer.opacity_layer) {
      await this.page.fill(
        `//div[@class='s-form-item custom-s-form is-success is-required' and child::div[contains(.,'Opacity')]]//input`,
        layer.opacity_layer,
      );
      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(2000); // Đợi layer editor ổn định sau khi input data
    }

    if (layer.rotate_layer) {
      await this.page.fill("//input[@placeholder='Rotation']", layer.rotate_layer);
      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(3000); // Đợi layer editor ổn định sau khi input data
    }

    if (layer.location_layer_x) {
      await this.page.fill(
        "//span[contains(text(),'X')]//parent::div[@class='s-input s-input--prefix']//input",
        layer.location_layer_x,
      );
      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(3000); // Đợi layer editor ổn định sau khi input data
    }

    if (layer.location_layer_y) {
      await this.page.fill(
        "//span[contains(text(),'Y')]//parent::div[@class='s-input s-input--prefix']//input",
        layer.location_layer_y,
      );
      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(3000); // Đợi layer editor ổn định sau khi input data
    }

    if (layer.layer_size_h) {
      await this.page.fill(
        "//span[contains(text(),'H')]//parent::div[@class='s-input s-input--prefix']//input",
        layer.layer_size_h,
      );
      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(3000); // Đợi layer editor ổn định sau khi input data
    }

    if (layer.layer_size_w) {
      await this.page.fill(
        "//span[contains(text(),'W')]//parent::div[@class='s-input s-input--prefix']//input",
        layer.layer_size_w,
      );
      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(3000); // Đợi layer editor ổn định sau khi input data
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

    // Đợi layer editor ổn định sau khi input data
    await this.page.waitForTimeout(2000);
    //click back to layer list
    const xpathIconBack = "//div[@class='s-card-header']//i[contains(@class,'left')]";
    await this.page.waitForSelector(xpathIconBack);
    await this.page.click(xpathIconBack);
  }

  /**
   * Select variant for base product on Editor
   * @param variantEditor variant name(white, black,S,M,,)
   */
  async selectVariantForBase(variantEditor: VariantEditor) {
    const listBase = variantEditor.base_product.split(",").map(item => item.trim());
    //open editor cho base
    for (let i = 0; i < listBase.length; i++) {
      await this.page.click(
        `//span[normalize-space()='${listBase[i]}']//parent::div[contains(@class,'fixed base-product')]`,
      );
      //chọn variant color cho base ( chỉ base 2D mới có )
      if (variantEditor.option_color == "Color") {
        const listColor = variantEditor.variant_color.split(",").map(item => item.trim());
        await this.page.click("//div[@class='color']//i");
        for (let i = 0; i < listColor.length; i++) {
          await this.page.click(
            `//div[@class='s-dropdown-menu']//span[normalize-space()='${listColor[i]}']//preceding-sibling::div[@class='color cursor-pointer']`,
          );
        }
        //Close dropdown color
        await this.page.click(`//h3[normalize-space()='${variantEditor.base_product}']`);
      }
      //chọn variant size cho base
      if (variantEditor.option_size == "Size") {
        const listSize = variantEditor.variant_size.split(",").map(item => item.trim());
        for (let i = 0; i < listSize.length; i++) {
          await this.page.click(`//span[normalize-space()='${listSize[i]}']`);
        }
      }
    }
  }

  /**
   * Get Information of campaigns have status is 'Launching'
   * @param domain of shop
   * */
  async getInfoCampaignsLaunching(authRequest: APIRequestContext): Promise<CampaignDetail[]> {
    const campaignsLaunching = [];
    let count = 0;
    // Times need retries
    while (count < 5) {
      await this.page.waitForTimeout(6000);
      const response = await authRequest.get(`https://${this.domain}/admin/pbase-campaigns.json?page=1&limit=50`);
      if (response.status() === 200 && (await response.json())) {
        response
          .json()
          .then(resp => {
            if (resp.campaigns?.length) {
              resp.campaigns
                .filter(camp => camp.campaign_status === "launching" && campaignsLaunching.indexOf(camp) < 0)
                .map(item => campaignsLaunching.push(item));
              return resp.campaigns;
            }
            return [];
          })
          .catch();
      }
      if (campaignsLaunching.length) {
        break;
      }
      count++;
    }
    return campaignsLaunching;
  }

  /**
   * Add new line upload artwork
   * @param artworks: Array art_work file name to upload
   *
   */
  async addNewLineUploadArtwork(artworks: Array<Record<string, string>>) {
    if (artworks.length > 1) {
      const artworksRemaining = artworks.filter((_, index) => index > 0);

      for (let i = 0; i < artworksRemaining.length; i++) {
        await this.page.locator("//div[child::label[@for='add-artwork']]").isVisible();
        await this.page
          .locator("//div[child::label[@for='add-artwork']]//input[@type='file'][1]")
          .setInputFiles(`./data/shopbase/${artworksRemaining[i].artwork_front}`);
        await this.page
          .locator(`//p[normalize-space()='Back']//ancestor::td//label//input[@type='file']`)
          .nth(i + 1)
          .setInputFiles(`./data/shopbase/${artworksRemaining[i].artwork_back}`);

        await this.page
          .locator(`//tbody//input[@class='s-input__inner' and @id='id-${i + 1}']`)
          .fill(`${artworksRemaining[i].campaign_duplicated} ${i + 1}`);
      }
    }
  }

  /***
   * Get Detail campaign data
   * @param id: Id of campaign => get detail data of campaign
   */

  async getDetailCampaignById(authRequest: APIRequestContext, id: number): Promise<CampaignDetail> {
    const response = await authRequest.get(`https://${this.domain}/admin/pbase-campaigns/live/${id}.json`);
    if (response.status() === 200) {
      const data = await response.json();
      return data;
    }

    return;
  }

  /**
   * Filter product by conditions
   * @param condition: Conditions to filter campaigns
   */

  async filterCampaignsByCondition(
    authRequest: APIRequestContext,
    condition: Record<string, unknown>,
  ): Promise<CampaignDetail[]> {
    const campaignUrl = `https://${this.domain}/admin/pbase-campaigns.json${buildQueryString(condition)}`;
    const response = await authRequest.get(campaignUrl);

    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    return jsonResponse.campaigns;
  }

  /**
   * function to click hide or show group
   * @param nameGroup name group want to hide or show
   */
  async clickHideOrShowGroup(nameGroup: string) {
    await this.page.click(
      `//div[@class='layer__container']//div[normalize-space()='${nameGroup}']//parent::div/following-sibling::div//i[contains(@class,'mdi-eye')]`,
    );
  }

  /**
   * Function to choose mockup want to expect
   * @param indexMockup index of mockup want to show
   */
  async clickOnImgMockupInCampDetail(indexMockup: number) {
    await this.page
      .locator(`(//div[contains(@class,'img m-sm')])[${indexMockup}]//i[@class='icon cursor-pointer']`)
      .click();
  }

  /**
   * Click base product on left side-bar
   * @param baseProduct name base product
   */
  async clickBaseProduct(baseProduct: string) {
    await this.page.click(
      `//span[normalize-space()='${baseProduct}']//parent::div[contains(@class,'fixed base-product')]`,
    );
    await this.waitUntilElementVisible(this.xpathBtnUpdateMockups);
  }

  /**
   * Click back to CO list
   * @param labelName label name button confirm
   */
  async clickBackToCOList(labelName?: string) {
    await this.page.click("//div[contains(@class,'custom-option')]//i[contains(@class,'left')]");
    if (labelName) {
      await this.clickOnBtnWithLabel(`${labelName}`);
    }
  }

  /*
   * Add custom option and select type for campaign on Campaign Editor
   */
  async addClipartOnCustomOption(clipart: ClipartFolder): Promise<void> {
    //select type of custom option
    if (clipart.type_custom_option) {
      await this.page.waitForSelector(".custom-option-detail__container h3");
      await this.page.selectOption(".custom-option-detail__container .custom-option-content .s-select select", {
        label: clipart.type_custom_option,
      });
      // Add clipart folder
      await this.page.click("#pc-clipart-folder-input");
      await this.page.click("//span[normalize-space()='Add a clipart folder']");
      await this.page.waitForSelector("//h1[normalize-space()='New clipart folder']");
      await this.page.fill("//input[@placeholder='e.g. Hair Style']", clipart.folder_name);
      if (clipart.group_name) {
        await this.page.click("//input[@id='clipart-list-input']");
        await this.page.fill("//input[@id='clipart-list-input']", clipart.group_name);
        await this.page.click(`//span[normalize-space()='${clipart.group_name}']`);
      }
      for (let i = 0; i < clipart.images.length; i++) {
        await this.page.setInputFiles("//input[@id='add-artwork']", `./data/shopbase/${clipart.images[i]}`);
      }
    }
  }

  /**
   * Click more action CO in CO list and choose action
   * @param actionCO name button action
   */
  async clickActionCOList(actionCO: string) {
    await this.page.click("(//i[contains(@class,'dots-vertical')])[2]");
    await this.page.click(`//div[@class="s-dropdown-menu"]//span[normalize-space()='${actionCO}']`);
  }

  /**
   * if select action show then CO will hidden
   * else select action hide thten CO will show
   * @param labelCO name CO
   * @param actionCO actiton CO
   */
  async clickActionCOInListCO(labelCO: string, actionCO: "Clone" | "Show" | "Hide" | "Delete") {
    await this.page.click(
      `//span[normalize-space()='${labelCO}']//ancestor::div[contains(@class,'content__center')]//following-sibling::div[contains(@class,'content__right')]//div//i`,
    );
    await this.page.click(`//span[normalize-space()='${actionCO}']`);
  }

  /**
   * Click more action CO in CO list
   */
  async clickActionCOListAndValidate() {
    await this.page.click("(//i[contains(@class,'dots-vertical')])[2]");
  }

  /**
   * Add size from editor campaign
   * @param size : size need add of base product
   */
  async addSize(size: string) {
    const listSize = size.split(",").map(item => item.trim());
    for (let i = 0; i < listSize.length; i++) {
      await this.page.click(`//div[@class='size-section']//button[normalize-space()='${listSize[i]}']`);
    }
  }

  /**
   * Remove size from editor campaign
   * @param size : size need remove of base product
   */
  async removeSize(size: string) {
    const listSize = size.split(",").map(item => item.trim());
    for (let i = 0; i < listSize.length; i++) {
      await this.page.click(`//div[@class='size-section']//button[normalize-space()='${listSize[i]}']`);
    }
  }

  /**
   * function select a item of label
   * @param nameLabel name of label want to select
   * @param valueItem value of item
   */
  async selectOptionOfLabel(nameLabel: string, valueItem: string) {
    await this.page
      .locator(`//label[normalize-space()='${nameLabel}']/following-sibling::div//select`)
      .selectOption({ label: valueItem });
  }

  /**
   * Add color from editor campaign
   * @param color : color need add of base product
   */
  async addColor(color: string) {
    await this.page.click("//div[@role='button']//div[@class='color']//span");
    const listColor = color.split(",").map(item => item.trim());
    for (let i = 0; i < listColor.length; i++) {
      await this.page.click(`//span[normalize-space()='${listColor[i]}']//preceding-sibling::div`);
    }
  }

  /**
   * Remove color from editor campaign
   * @param color : color need remove of base product
   */
  async removeColor(color: string) {
    const listColor = color.split(",").map(item => item.trim());
    for (let i = 0; i < listColor.length; i++) {
      await this.page.click(`//span[normalize-space()='${listColor[i]}']//preceding-sibling::div`);
    }
  }

  /**
   * Select colors from editor for base product
   * @param colors : colors need add of base product
   */
  async selectColors(colors: string) {
    const listColor = colors.split(",").map(item => item.trim());
    const colorNamesEnabled = await this.page
      .locator("//div[contains(@class,'color-section')]//div[contains(@class,'s-tooltip-fixed')]")
      .allTextContents();
    const addColors = listColor.filter(color => !colorNamesEnabled.includes(color));
    const removeColors = colorNamesEnabled.filter(color => !listColor.includes(color));
    await this.addColor(addColors.join(","));
    await this.removeColor(removeColors.join(","));
  }

  /**
   * Remove all custom option in editor campaign
   */
  async removeAllCustomOption() {
    const countCO = await this.page
      .locator("(//div[contains(@class,'custom-option__list')]//div[@role='button']//i)")
      .count();
    for (let i = 1; i <= countCO; i++) {
      await this.page.click("(//div[contains(@class,'custom-option__list')]//div[@role='button']//i)[1]");
      await this.page.click(this.xpathDeleteCustomize);
    }
  }

  /**
   * Delete layer
   * @param removeLayer include layer name and side
   */
  async deleteLayerOnEditor(removeLayer: RemoveLayer): Promise<void> {
    let xpathLayer;
    if (removeLayer.side) {
      xpathLayer = `(//span[contains(.,'${removeLayer.side}')]/ancestor::div[contains(@class,'s-collapse-item artwork')]//span[normalize-space()='${removeLayer.layer_name}'])[1]`;
    } else {
      xpathLayer = `//span[contains(@class,'display') and normalize-space()='${removeLayer.layer_name}']//ancestor::div[contains(@class,'cursor-pointer')]`;
    }
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
  }

  /**
   * delete nhiều layer
   * @param layerInfors
   */
  async deleteLayers(layerInfors: Array<RemoveLayer>) {
    for (let i = 0; i < layerInfors.length; i++) {
      await this.deleteLayerOnEditor(layerInfors[i]);
    }
  }

  /**
   * Close popup select mockup on editor campaign
   */
  async closePopupSelectMockup() {
    await this.page.click("//button[@class='s-modal-close is-large']");
  }

  /**
   * Select mockup on editor campaign
   */
  async selectMockupEditor(indexMockup: string) {
    const listMockupSelect = indexMockup.split(",").map(item => item.trim());
    for (let i = 0; i < listMockupSelect.length; i++) {
      await this.page.click(
        `((//div[@class='wrapper-grid-mockups-content'])//div[contains(@class,'product-click-action')])[${listMockupSelect[i]}]`,
      );
    }
  }

  /**
   * Remove group layer from customize group
   * @param groupName : list group need remove
   */
  async removeGroup(groupName: string) {
    const listGroup = groupName.split(",").map(item => item.trim());
    for (let i = 0; i < listGroup.length; i++) {
      await this.page.click(
        `//span[normalize-space()='${listGroup[i]}']//parent::div//following-sibling::span[contains(@class,'s-icon')]`,
      );
    }
  }

  /**
   * Select mockup on editor campaign
   */
  async clickIconLinkOnEditor(productName: string) {
    const listBaseProduct = productName.split(",").map(item => item.trim());
    for (let i = 0; i < listBaseProduct.length; i++) {
      await this.page.click(
        `//span[normalize-space()='${listBaseProduct[i]}']//parent::div//i[contains(@class,'link-variant')]`,
      );
    }
  }

  /**
   * Select option Dropdown on menu Catalog POD
   * @param baseProductName
   * @param value
   */
  async selectOptionDropDownOnCatalog(
    baseProductName: string,
    value: "Select mockups" | "Set up shipping fee" | "Download template" | "Update description",
  ) {
    await this.page
      .locator(
        `(//span[@data-label='${baseProductName}']//following::div[@class='s-dropdown-trigger']//child::button)[1]`,
      )
      .click();
    await this.page.waitForSelector("//div[@class='s-dropdown-menu']");
    await this.page.locator(`//div[@class='s-dropdown-menu']//child::span[normalize-space()='${value}']`).click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   *Open campaign from screen campaign detail
   *@param campaign_name name campaign
   */
  async openCampSFFromCampDetail(campaignName) {
    await this.navigateToMenu("Campaigns");
    await this.searchWithKeyword(campaignName);
    await this.openCampaignDetail(campaignName);
  }

  /**
   * check product exist in list product pb
   * @param productName
   */
  async isVisibleProductPb(productName: string) {
    await this.navigateToMenu("Campaigns");
    await this.page.waitForSelector("//input[contains(@placeholder,'Search campaigns by name')]", { state: "visible" });
    await this.searchWithKeyword(productName);
    if (await this.genLoc("//p[contains(text(),'Could not find any campaigns matching')]").isVisible()) {
      return false;
    }

    return true;
  }

  /**
   * Open custom option detail
   * @param campaignName
   * @param customOptionName
   */
  async openCustomOptionDetailInEditor(campaignName: string, customOptionName: string) {
    await this.searchWithKeyword(campaignName);
    await this.openCampaignDetail(campaignName);
    await this.clickOnBtnWithLabel("Edit campaign setting");
    await this.waitForElementVisibleThenInvisible(`(${this.xpathIconLoading})[1]`);
    await this.clickBtnExpand();
    await this.page.click(this.xpathCustomOptionName(customOptionName));
  }

  /**
   * check status campaign if over timeout return false
   * @param campaignId
   * @param status array string
   * @param timeout miliseconds
   */
  async checkCampaignStatus(campaignId: number, status: string[], timeout: number): Promise<boolean> {
    let timer;
    let isStop = false;
    return Promise.race([
      new Promise<boolean>(resolve => {
        const checkCampaign = async () => {
          while (!isStop) {
            const campaignStatus = await this.getCampaignStatus(campaignId, timeout);
            if (status.includes(campaignStatus)) {
              isStop = true;
              resolve(true);
              return;
            }
          }
          resolve(false);
        };
        checkCampaign();
      }),
      new Promise<boolean>(
        resolve =>
          (timer = setTimeout(() => {
            isStop = true;
            resolve(false);
          }, timeout)),
      ),
    ]).finally(() => clearTimeout(timer));
  }

  /**
   * get campaign status from api get list campaign
   * @param campaignId
   * @param timeout
   */
  async getCampaignStatus(campaignId: number, timeout: number): Promise<string> {
    const response = await this.page.waitForResponse(
      response => {
        return response.url().includes("/admin/pbase-campaigns.json") && response.status() === 200;
      },
      { timeout: timeout },
    );
    const jsonResponse = await response.json();
    for (const campaign of jsonResponse.campaigns) {
      if (campaign.campaign_id === campaignId) {
        return campaign.campaign_status;
      }
    }
    return "";
  }

  /**
   * verify campaign status satisfy with condition from get list campaign
   * @param authRequest
   * @param domain
   * @param campaignIds
   * @param timeout
   * @param status
   */
  async verifyCampaignStatusByIds(
    authRequest: APIRequestContext,
    domain: string,
    campaignIds: number[],
    status: string,
  ): Promise<boolean> {
    const response = await authRequest.get(
      `https://${domain}/admin/pbase-campaigns.json?page=1&limit=50&status=${status}`,
    );
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const listStatusSatisfy = jsonResponse.campaigns.filter(x => campaignIds.includes(x.campaign_id));
    if (listStatusSatisfy.length === campaignIds.length) {
      return true;
    }

    return false;
  }

  /**
   * wait for mockup in campaign detail is display
   * @param snapshotName
   * @param title
   * @param retry
   */
  async waitDisplayMockupDetailCampaign(title: string, retry = 5): Promise<boolean> {
    let reCheck = true;
    let countCheck = 0;
    while (reCheck) {
      await this.navigateToMenu("Campaigns");
      await this.searchWithKeyword(title);
      await this.openCampaignDetail(title);
      // verify title
      await this.waitUntilElementVisible(this.xpathTitle);
      const titleInDetailCampaignPage = await this.page.locator(this.xpathTitle).innerText();
      if (titleInDetailCampaignPage !== title) {
        return false;
      }
      await this.waitUntilElementVisible(this.xpathSectionImageInDetail);
      try {
        await this.waitImagesLoaded("//div[@class='media__container']");
        reCheck = false;
      } catch (e) {
        countCheck++;
        if (countCheck >= retry) {
          reCheck = false;
        }
      }
    }
    await this.page.locator(this.xpathSectionImageInDetail).scrollIntoViewIfNeeded();
    return true;
  }

  /**
   * Get the first variant of each base from api get pricings
   * @param baseProducts
   */
  async getPricingFirstVariant(baseProducts: BaseProductInfor[]): Promise<ProductVariant[]> {
    const pricings = [];
    await Promise.race([
      new Promise(resolve => {
        const checkCampaign = async () => {
          const response = await this.page.waitForResponse(
            response =>
              response.url().includes("/admin/pbase-campaigns/list-pricing.json") && response.status() === 200,
            { timeout: 600000 },
          );
          const jsonResponse = await response.json();
          for (const productBase of jsonResponse.products) {
            pricings.push({
              product_base: baseProducts.find(item => item.base_product_id === productBase.product_base_id)
                .base_product,
              variant: productBase.variants.find(item => item.used),
            });
          }
          resolve(true);
        };
        checkCampaign();
      }),
      new Promise(() => {
        const clickButtonContinue = async () => {
          await this.clickOnBtnWithLabel("Continue");
        };
        clickButtonContinue();
      }),
    ]);
    if (pricings && pricings.length) {
      return pricings.map(item => {
        return {
          value_style: item.product_base,
          value_color: item.variant.option1,
          value_size: item.variant.option2,
          price: item.variant.price,
          compare_at_price: item.variant.compare_at_price,
        };
      });
    }
    return [];
  }

  /**
   * Duplicate campaign
   * @param campaignOrigin
   * @param keepArtwork
   */
  async duplicateCampaign(campaignOrigin: string, keepArtwork = true) {
    await this.page.click(this.xpathIconDuplicate(campaignOrigin));
    if (keepArtwork) {
      await this.verifyCheckedThenClick(this.xpathCheckboxKeepArtwork, true);
    }
    await this.clickOnBtnWithLabel("Duplicate", 1);
    await this.waitForElementVisibleThenInvisible(this.xpathIconLoading);
  }

  /**
   * Create custom art for campaign
   * @param customArt
   */
  async createCustomArt(customArt: CustomArt): Promise<void> {
    await this.verifyCheckedThenClick(this.xpathCheckboxCustomArt, true);
    if (customArt.file_name) {
      await this.clearInPutData(
        `(//div[contains(@class,'material__item material__item--wrapper')]//input[@type='text'])[${customArt.index}]`,
      );
      await this.page.waitForTimeout(1000);
      await this.page.fill(
        `(//div[contains(@class,'material__item material__item--wrapper')]//input[@type='text'])[${customArt.index}]`,
        customArt.file_name,
      );
    }
    if (customArt.file_upload) {
      await this.page
        .locator(
          `(//span[normalize-space()='Choose file']//ancestor::div[@class='s-form-item__content']//div[contains(@class,'progress-bar__material')]//following-sibling::input)[${customArt.index}]`,
        )
        .setInputFiles(`./data/shopbase/${customArt.file_upload}`);
    }
    if (customArt.applied_for) {
      await this.page.click(this.xpathDroplistSelectCOCustomArt(customArt.index));
      await this.page.click(`//p[normalize-space()='${customArt.applied_for}']`);
    }
    if (customArt.remove_layer) {
      await this.deleteLayerOnEditor(customArt.remove_layer);
    }
    if (customArt.message) {
      await this.checkMsgAfterCreated({
        errMsg: customArt.message,
      });
    }
    if (customArt.add_more_material) {
      await this.page.click("//*[contains(text(),'Add material')]");
    }
  }

  async addListCustomArt(customArt: Array<CustomArt>): Promise<void> {
    for (let i = 0; i < customArt.length; i++) {
      await this.createCustomArt(customArt[i]);
    }
  }

  async unselectBaseProduct(baseProduct: BaseProductInfor) {
    await this.page.click(`//div[@class='product-catagory']//p[text()='${baseProduct.category}']//ancestor::li`);
    const baseProducts = baseProduct.base_product.split(",");
    for (let i = 0; i < baseProducts.length; i++) {
      await this.page.click(
        `//span[@data-label='${baseProducts[i]}']//` +
          `ancestor::div[@class='prod-wrap']//button[contains(.,'Remove product')]`,
      );
    }
  }

  /**
   * Xpath link with label
   * * @param numberOfSelectedBase : number of selected base
   * @returns number of selected bases
   */
  xpathNumberOfSelectedBase(numberOfSelectedBase: number): string {
    return `//span[normalize-space()="${numberOfSelectedBase} products selected"]`;
  }

  /**
   * Xpath btn add/remove product theo base ở Catalog
   * * @param baseProduct: tên base, label: tên button
   * @returns btn add/remove product theo base ở Catalog
   */
  xpathBtnActionBaseProductWithLabel(baseProduct: string, label: string): string {
    return `//span[@data-label='${baseProduct}']//ancestor::div[contains(@class,'product')]//following-sibling::button//*[normalize-space()='${label}']`;
  }

  async setingShowImage(option: string) {
    await this.clickOnBtnWithLabel("Customize", 1);
    await this.waitForElementVisibleThenInvisible("//div[@class='sb-spinner sb-relative sb-spinner--medium']");
    await this.page.click("(//div[normalize-space()='Settings'])[1]");
    await this.page.click("//div[@data-tab='settings']//div[normalize-space()='Product']");
    await this.page.click(
      "(//label[normalize-space()='Image list']//ancestor::div)[9]//following-sibling::div//div[@data-key='image_list']//button",
    );
    await this.page.click(`//label[normalize-space()='${option}']`);
  }

  /**
   * get XPath with label of element
   */
  getXpathArtworkByName(artworkName: string, index = 1) {
    return `(//div[@class='title' and child::span[@data-label="${artworkName}"]]//preceding-sibling::div)[${index}]`;
  }

  xpathLayerDetailInput(prefix?: string, label?: string) {
    return `//span[@class='s-input__prefix' and normalize-space()='${prefix}']/preceding-sibling::input|//label[normalize-space()='${label}']/parent::div/following-sibling::div//input`;
  }

  /**
   * Back to Page Detail Product
   * @param campLaunched
   */
  async clickIconBackToDetailProduct(campLaunched = false) {
    await this.page.click("//span[contains(@class,'icon-back-title')]");
    if (!campLaunched) {
      if (await this.checkButtonVisible("Leave page")) {
        await this.clickOnBtnWithLabel("Leave page");
      }
    }
  }

  /*
   * Click link product on Editor Campaign
   */
  async clickLinkProductEditorCampaign(): Promise<void> {
    await this.page.waitForSelector("//div[contains(@class,'editor-side-bar border-right text-center')]");
    const countIconLink = await this.page
      .locator(
        "//div[contains(@class,'editor-side-bar border-right text-center')]//a[contains(@class,'link-product text-gray')]",
      )
      .count();
    for (let i = 1; i <= countIconLink; i++) {
      await this.page.click(
        "(//div[contains(@class,'editor-side-bar border-right text-center')]//a[contains(@class,'link-product text-gray')])[1]",
        { timeout: 5000 },
      );
    }
  }

  /**
   * Open editor campaign
   * @param campaignName
   */
  async openEditorCampaign(campaignName: string) {
    await this.searchWithKeyword(campaignName);
    await this.openCampaignDetail(campaignName);
    await this.clickOnBtnWithLabel("Edit campaign setting");
    await this.waitForElementVisibleThenInvisible(this.xpathIconLoading);
    await this.removeLiveChat();
  }

  /**
   * Delete, ungroup or delete group layer
   * @param groupName
   * @param action
   */
  async actionWithGroupLayer(groupName: string, action: string) {
    await this.page.click(
      `//div[normalize-space()='${groupName}']//ancestor::div[contains(@class,'layer-group__container')]//i[contains(@class,'mdi-dots-vertical')]`,
    );
    await this.page.click(`//div[@class='s-dropdown-content']//span[contains(text(),'${action}')]`);
  }

  /**
   * get campaign id by name on campaign list
   * @param authRequest
   * @param campaignName
   * @param accessToken
   */
  async getCampaignIdByName(campaignName: string): Promise<number> {
    this.page.reload();
    const response = await this.page.waitForResponse(
      response => {
        return response.url().includes("/admin/pbase-campaigns.json") && response.status() === 200;
      },
      { timeout: 190000 },
    );
    let jsonResponse;
    try {
      jsonResponse = await response.json();
    } catch (e) {
      return this.getCampaignIdByName(campaignName);
    }

    return (jsonResponse.campaigns || []).find(respElement => respElement.campaign_title == campaignName).campaign_id;
  }

  /**
   * Input data of variant in pricing page
   * @param rowName is name of row
   * @param columnName is name of column you want input data
   * @param salePrice is value of sale price
   * @param tableIndex is index of table in page
   */
  async inputDataInTable(rowName: string, columnName: string, salePrice: string, tableIndex = 1): Promise<void> {
    const indexOfRow = await this.getIndexOfRow(tableIndex, rowName);
    const indexOfColumn = await this.getIndexOfColumn(columnName);
    await this.page
      .locator(`(//table/tbody)[${tableIndex}]/tr[${indexOfRow}]/td[${indexOfColumn}]//input`)
      .fill(salePrice);
    await this.page.keyboard.press("Enter");
  }

  /**
   * Select country to watch shipping fee
   * @param countryName is country name you want select
   */
  async selectCountry(countryName: string) {
    await this.page.locator(`//div[contains(@class, "searchable__textbox")]/input`).click();
    await this.page
      .locator(`//div[contains(@class, "s-select-searchable__item-list")]/div[contains(text(), "${countryName}")]`)
      .click();
  }

  /**
   * add new campaign on bulk duplicate
   * @param value name of file need upload
   */
  async addCampaignOnBulkDuplicate(value: string) {
    await this.clickOnBtnWithLabel("Add Campaign");
    await this.page.fill(
      `(//p[normalize-space()='Number of campaigns']//parent::div//input[@type='number'])[2]`,
      value,
    );
    await this.clickOnBtnWithLabel("Add", 2);
  }

  /**
   * edit title and handle campaign on bulk duplicate
   * @param campaignName name of campaign
   * @param title value input on field title of campaign
   * @param handle value input on field handle of campaign
   */
  async editCampaignNameOnBulkDuplicate(campaignName: string, title?: string, handle?: string) {
    await this.hoverThenClickElement(
      `//p[normalize-space()='${campaignName}']`,
      `((//p[normalize-space()='${campaignName}']//ancestor::tr//td)[2]//span)[1]`,
    );
    if (title) {
      await this.page.fill(
        "//div[@class='sb-popup__body sb-scrollbar sb-text']//input[@class='sb-input__input']",
        title,
      );
    }
    if (handle) {
      await this.page.fill(
        "//div[@class='sb-popup__body sb-scrollbar sb-text']//input[@class='sb-input__input sb-input__inner-prepend']",
        handle,
      );
    }
    await this.clickOnBtnWithLabel("Save");
  }

  /**
   * Click checkbox new camp on bulk duplicate
   * @param campaignName name of file need upload
   */
  async clickCheckboxCampaignOnBulkDuplicate(campaignName: string) {
    const listCampaignName = campaignName.split(",").map(item => item.trim());
    for (let i = 0; i < listCampaignName.length; i++) {
      await this.verifyCheckedThenClick(
        `//p[normalize-space()='${listCampaignName[i]}']//ancestor::tr//td//span[@class='sb-check']`,
        true,
      );
    }
  }

  /**
   *upload file csv artwork to bulk duplicate
   * @param pathFile: path of file
   *
   * */
  async uploadFileCsv(pathFile: string, index = 1) {
    await this.page.setInputFiles(`(//input[@type='file' and @accept='.csv'])[${index}]`, pathFile);
  }

  /**
   * Upload file artwork on bulk duplicate
   * @param uploadArtInfor
   * @param index name of file need upload
   * @param indexForSide name of file need upload
   */
  async uploadArtworkOnBulkDuplicateScreen(uploadArtInfor: UploadArtInfor, index = 1) {
    const xpathUploadAll = `(//p[normalize-space()='Artwork']//parent::div//input)[${index}]`;
    if (uploadArtInfor.is_column) {
      if (uploadArtInfor.side) {
        await this.page.click("//p[normalize-space()='Artwork']//parent::div//span");
        const [fileChooser] = await Promise.all([
          this.page.waitForEvent("filechooser"),
          await this.page.click(
            `(//p[normalize-space()='Upload ${uploadArtInfor.side} artworks'])[${uploadArtInfor.index_side}]`,
          ),
        ]);
        await fileChooser.setFiles(uploadArtInfor.artwork);
        await this.waitForElementVisibleThenInvisible(this.xpathProgressUpload);
        if (uploadArtInfor.side_back) {
          await this.page.click("//p[normalize-space()='Artwork']//parent::div//span");
          const [fileChooser] = await Promise.all([
            this.page.waitForEvent("filechooser"),
            await this.page.click(
              `(//p[normalize-space()='Upload ${uploadArtInfor.side_back} artworks'])[${uploadArtInfor.index_side}]`,
            ),
          ]);
          await fileChooser.setFiles(uploadArtInfor.artwork_back);
        }
      } else {
        await this.page.locator(xpathUploadAll).setInputFiles(uploadArtInfor.artwork);
      }
    } else {
      const xpathCampaignName = `//p[normalize-space()='${uploadArtInfor.campaign_name}']`;
      const xpathTitleAfterUpload = `//p[normalize-space()='${uploadArtInfor.title_after_upload}']`;
      const xpathUploadAllForCell = `${xpathCampaignName}//ancestor::div[@class='cell']//span[contains(@class,'medium sb-flex-inline')]`;
      if (uploadArtInfor.side) {
        await this.hoverThenClickElement(xpathCampaignName, xpathUploadAllForCell);
        const [fileChooser] = await Promise.all([
          this.page.waitForEvent("filechooser"),
          await this.page.click(
            `(//p[normalize-space()='Upload ${uploadArtInfor.side} artworks'])[${uploadArtInfor.index_side}]`,
          ),
        ]);
        await fileChooser.setFiles(uploadArtInfor.artwork);
        await this.waitForElementVisibleThenInvisible(this.xpathProgressUpload);
        if (uploadArtInfor.side_back) {
          await this.hoverThenClickElement(
            xpathTitleAfterUpload,
            `${xpathTitleAfterUpload}//ancestor::div[@class='cell']//span[contains(@class,'medium sb-flex-inline')]`,
          );
          const [fileChooser] = await Promise.all([
            this.page.waitForEvent("filechooser"),
            await this.page.click(
              `(//p[normalize-space()='Upload ${uploadArtInfor.side_back} artworks'])[${uploadArtInfor.index_side}]`,
            ),
          ]);
          await fileChooser.setFiles(uploadArtInfor.artwork_back);
        }
      } else {
        await this.page.hover(xpathCampaignName);
        await this.page.waitForTimeout(2000);
        const [fileChooser] = await Promise.all([
          this.page.waitForEvent("filechooser"),
          await this.page.click(xpathUploadAllForCell),
        ]);
        await fileChooser.setFiles(uploadArtInfor.artwork);
      }
    }
  }

  /**
   *Click to open editor of campaign
   * @param title campaign name
   */
  async openEditCamp(title: string) {
    await this.page.click(`(//div[@class = 'product-name' and normalize-space() = "${title}"])[1]`);
  }
}
