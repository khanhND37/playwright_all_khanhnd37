import { getStyle } from "@utils/css";
import { FrameLocator, Page, expect } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();
export class WebBuilderVariantPicker extends Blocks {
  xpathLayersBtn = `//div[contains(@class, 'w-builder__header-left')]//button[@name='Layer']`;
  wbTemplateXpath = `//header[contains(@class, 'sb-sticky')]/descendant::div[contains(@class, 'w-builder__autocomplete')]/descendant::p[contains(text(), 'Preview')]`;
  wbLoadingDotTemplate = `//span[contains(@class, 'sb-autocomplete--loading-dots')]`;
  wbInputTemplate = `//div[contains(@class, 'w-builder__autocomplete__wrap')]/descendant::input`;
  wbVariantPicker = `(//div[@data-block-component='variants'])[1]`;
  wbSectionVariantPicker = `(//section[@component='variants'])[1]`;
  wbMobileMain = `//div[contains(@class ,'w-builder__preview-mobile')]`;
  wbBtnAddToCart = `//div[contains(@class, 'wb-dnd-draggable-wrapper') and @data-block-component='button']`;
  wbBtnBuyNow = `//div[contains(@class, 'wb-dnd-draggable-wrapper') and @data-block-component='button']/descendant::span[contains(text(), 'BUY NOW')]`;
  wbNavbarDataSourceBtn = `//div[contains(@class, 'w-builder__source-detail')]/div/div/div[2]`;
  wbSelectSourceBtnInModal = `//div[contains(@id, 'search-data-source')]`;
  wbModalDataSource = `//div[contains(@class, 'sb-popup__container')]`;
  wbListSourceInModal = `//div[contains(@class, 'w-builder__popover choose-data-source-wrapper')]`;
  wbModalIconClose = `//div[contains(@class, 'sb-popup__header')]/button`;
  wbNoVariant = `//section[@block-id='blockId']//*[local-name()='svg']`;
  wbBtnSoldOut = `//div[@data-block-component='button']/descendant::span[contains(text(), 'Sold Out')]`;
  wbUnSaveChangeText = `//div[contains(@class, 'w-builder__header-message')]/p[contains(text(), 'Unsaved changes')]`;
  wbProductCateogryInWebSetting = `//p[contains(@class,'insert-category-name') and normalize-space()='Product']`;
  xpathButtonPreview = ":nth-match(.w-builder__header-right > span, 3) button";
  wbStandardProduct = `//div[contains(@class,'list-search-result')]//div[contains(@class,'sb-selection-item') and descendant::span[contains(text(), 'Product multi variant 1')]]`;
  wbDataSourceProduct = `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='Product']]`;
  wbDataSourceBlog = `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='Blog']]`;
  wbDataSourceBlogPost = `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='Blog post']]`;
  wbDataSourceCurrentProduct = `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='Current page product']]`;
  wbDataSourceCollection = `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='Collection']]`;
  wbSectionProductDetail = `//div[@id='wb-main']/section[3]`;
  wbBtnBackDataSource = `//div[contains(@class, 'sb-flex search-source__search-bar')]/button[contains(@class, 'btn-back')]`;
  wbMissingDataSourceVariantPicker = `${this.wbVariantPicker}/div[contains(@class, 'validate-source is-visible') and  normalize-space()='Missing data source']`;
  wbSizeGuide = `//div[contains(@class, 'variants-selector')]/descendant::span[contains(@class, 'product__size-guide')]`;
  wbModalSizeChart = `//div[contains(@class, 'outside-modal fixed popover-bottom__overlay w-100 h-100 flex justify-center product__size-chart')]`;
  wbDataSourceNone = `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='None']]`;
  wbBtnPreviewYourDesign = `(//section[@component="variants"]/descendant::button[//span[normalize-space()='Preview your design']])[1]`;
  wbOutsideModal = `(//div[contains(@class, 'popover-bottom__content relative')])[1]`;
  wbOutsideModalImage = `(//div[contains(@class, 'outside-modal__body__content')]//img)[1]`;
  wbInfoFileUpload = ".upload-box-wrapper .file-information img";
  wbBtnCloseOutsideModal = `${this.wbOutsideModal}/descendant::button[contains(@class, 'btn-close')]`;
  wbUnAvalableBtn = `//span[normalize-space()='Unavailable']`;
  wbVpColor = `//div[@data-widget-id="label_color"]//div[contains(@class, 'sb-popover__reference')]`;
  wbVpLayoutButton = `//div[@data-widget-id]//label[normalize-space()='Button']`;
  wbVpLayoutDropdown = `//div[@data-widget-id="layout"]//label[normalize-space()='Dropdown']`;
  wbVpColorPreview = `//div[@data-widget-id="color_preview" or @data-widget-id="color_dropdown_preview"]//button`;
  wbVpColorPreviewNone = `(//div[contains(@class, 'widget-select__search')]/descendant::label[normalize-space()='None'])[2]`;
  wbVpColorPreviewColorOnly = `//div[contains(@class, 'widget-select__search')]/descendant::label[normalize-space()='Color only']`;
  wbVpColorPreviewColorAndText = `//div[contains(@class, 'widget-select__search')]/descendant::label[normalize-space()='Color & Text']`;
  wbVpImagePreviewNone = `(//div[contains(@class, 'widget-select__search')]/descendant::label[normalize-space()='None'])[2]`;
  wbVpImagePreviewImageOnly = `(//div[contains(@class, 'widget-select__search')]/descendant::label[normalize-space()='Image only'])`;
  wbVpImagePreviewImageAndText = `(//div[contains(@class, 'widget-select__search')]/descendant::label[normalize-space()='Image & Text'])`;
  wbVpShapeRetacgle = `//div[contains(@class, 'widget-select__grid')]/span[1]`;
  wbVpShapeRounded = `//div[contains(@class, 'widget-select__grid')]/span[2]`;
  wbVpShapePill = `//div[contains(@class, 'widget-select__grid')]/span[3]`;
  wbVpColorWillSelect = `//div[contains(@class, 'w-builder__colors-chips')]/span[3]`;
  wbVpImagePreview = `//div[@data-widget-id="image_preview" or @data-widget-id="image_dropdown_preview"]//button`;
  wbVpShape = `//div[@data-widget-id="shape"]//button`;
  wbVariantPickerLabel = `${this.wbVariantPicker}//p[contains(@class, 'variants-selector__label')]`;
  wbHeaderLayerBtn = `//div[contains(@class, 'w-builder__header-left')]//button[@name='Layer']`;
  wbSideBar = `//div[contains(@class, 'w-builder__sidebar-content')]`;
  wbVpStyleActive =
    "//p[contains(text(),'Style')]/parent::div//div[contains(@class,'button-layout') and contains(@class, 'active')]";
  wbVpStyleInactive =
    "//p[contains(text(),'Style')]/parent::div//div[contains(@class,'button-layout') and not(contains(@class, 'active'))]";
  wbDefaultATCButton = "//div[@data-block-component='button']//span[text()='Enroll Now']";

  sfVariantBlock = `(//section[@component='variants'])[1]`;
  sfVariantPickerSelector = `${this.sfVariantBlock}//div[contains(@class, 'variants-selector')]`;
  sfVariantPickerLabel = `${this.sfVariantBlock}//p[contains(@class, 'variants-selector__label')]`;
  sfnBtnSoldOut = `//span[contains(text(), 'Sold Out')]`;
  sfnBtnAddToCart = `//div[contains(@class, 'wb-button--add-cart__primary')]`;
  itemCurrentPageProduct = `//div[contains(@class, 'w-builder__popover choose-data-source-wrapper')]/descendant::button//span[normalize-space()='Current page product']`;
  itemProduct = `//div[contains(@class, 'w-builder__popover choose-data-source-wrapper')]/descendant::button//span[normalize-space()='Product']`;
  sfnSizeGuide = `//div[contains(@class, 'variants-selector')]/descendant::span[contains(@class, 'product__size-guide')]`;
  sfnModalSizeChart = `//div[contains(@class, 'outside-modal fixed popover-bottom__overlay w-100 h-100 flex justify-center product__size-chart')]`;
  sfnLabaDataSourceNavbar = `//div[contains(@class, 'w-builder__sidebar-content')]/div[2]/div[1]/*[local-name()='svg']`;
  autoPoint = `(((//section[contains(@class,'section') and not(@selected-block-state)])[1]//div[contains(@class,'wb-dnd-container') and @data-column-id])[1]//div[contains(@class,'indicator-block')])[1]`;
  listItemAddBlock = `//div[contains(@class, 'w-builder__insert-template-container')]`;
  btnCrop = `//div[contains(@class, 'outside-modal__body__content')]/descendant::button[contains(@class, 'btn-crop')]`;
  cropper = `(//div[contains(@class, 'popover-bottom__content relative')])[1]`;
  inputText = `(//input[@placeholder='Please fill out this field'])[1]`;
  atcBadge = `//div[contains(@class, 'block-cart-property')]/descendant::div[contains(@class, 'block-cart__badge-right_top block-cart__badge flex justify-center align-center')]/span`;
  xpathOutsideVariantPicker = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']`;
  xpathCloseBtnCartDrawer = `//section[@id="default_cart_drawer"]//div[contains(@class, 'close-popup-button__line')]`;
  xpathActionLabel = `//label[contains(@class, 'sb-is-capitalized')]`;
  xpathRemoveItem = `//section[@section-id="default_cart_drawer"]//a[contains(@class, 'product-cart__remove')]`;

  async goToProductOnStorefront(productHandle: string) {
    await this.page.goto(`https://${this.domain}/products/${productHandle}?date=${new Date()}`);
    const startTime = new Date().getTime();
    await this.page.waitForLoadState("networkidle");
    logger.info(`Time since last wait networkidle: ${new Date().getTime() - startTime}`);
  }

  getVpImagePreviewInPreview(text: "none" | "image_only" | "image_and_text", page?: "wb" | "sfn") {
    let variantBlock = this.wbVariantPicker;
    if (page === "sfn") {
      variantBlock = this.sfVariantBlock;
    }
    if (text === "none") {
      return `${variantBlock}/descendant::div[contains(@class, 'none')]`;
    }
    if (text === "image_only") {
      return `${variantBlock}/descendant::div[contains(@class, 'image_only')]`;
    }
    if (text === "image_and_text") {
      return `${variantBlock}/descendant::div[contains(@class, 'image_text')]`;
    }
  }
  /**
   * Get variant picker color preview item in preview iframe
   * @param text
   * @param variant
   * @returns xpath=//
   */
  getVpColorPreviewInPreview(text: "none" | "color_only" | "color_and_text", variant?: string, page?: "wb" | "sfn") {
    let variantBlock = this.wbVariantPicker;
    if (page === "sfn") {
      variantBlock = this.sfVariantBlock;
    }
    if (text === "none") {
      return variant ? this.getVariantByText(variant, page) : this.getVariantByText("Black", page);
    }
    if (text === "color_only") {
      return `${variantBlock}/descendant::div[contains(@class, 'color_only')]`;
    }
    if (text === "color_and_text") {
      return `${variantBlock}/descendant::div[contains(@class, 'color_text')]`;
    }
  }
  /**
   * Get VpShapeItemInPreview
   * @param text
   * @returns
   */
  getVpShapeItemInPreview(text: "rectangle" | "rounded" | "pill", page?: "wb" | "sfn") {
    if (page === "sfn") {
      return `${this.sfVariantBlock}/descendant::div[contains(@class, '${text}')]`;
    }
    return `${this.wbVariantPicker}/descendant::div[contains(@class, '${text}')]`;
  }

  /**
   * Get variant picker shape option
   * @param text
   * @returns
   */
  getVpShapeItem(text: "rectangle" | "rounded" | "pill") {
    if (text === "rectangle") {
      return this.wbVpShapeRetacgle;
    }
    if (text === "rounded") {
      return this.wbVpShapeRounded;
    }
    if (text === "pill") {
      return this.wbVpShapePill;
    }
  }

  /**
   * Get Variant picker color preview by text
   * @param text
   * @returns
   */
  async getVpColorPreviewItem(text: "none" | "color_only" | "color_and_text") {
    if (text === "none") {
      return this.wbVpColorPreviewNone;
    }
    if (text === "color_only") {
      return this.wbVpColorPreviewColorOnly;
    }
    if (text === "color_and_text") {
      return this.wbVpColorPreviewColorAndText;
    }
  }

  /**
   * Get Vp image by text
   * @param text
   * @returns
   */
  getVpImagePreviewItem(text: "none" | "image_only" | "image_and_text") {
    if (text === "none") {
      return this.wbVpImagePreviewNone;
    }
    if (text === "image_only") {
      return this.wbVpImagePreviewImageOnly;
    }
    if (text === "image_and_text") {
      return this.wbVpImagePreviewImageAndText;
    }
  }

  /**
   * Get variant picker layout by text
   * @param text
   * @returns
   */
  getVpLayoutByText(text: string) {
    return `//div[@data-widget-id="layout"]//label[normalize-space()='${text}']`;
  }

  /**
   * change product data source in product detail
   */
  async changeProductSource(productName: string) {
    // click template preview
    await this.page.waitForSelector(this.wbTemplateXpath);
    await this.page.locator(this.wbTemplateXpath).click();
    // wait data loading
    await this.page.locator(this.wbLoadingDotTemplate).first().waitFor({ state: "detached" });
    await this.page.locator(this.wbInputTemplate).fill(productName);
    // await this.page.locator(this.wbLoadingDotTemplate).first().waitFor({ state: "visible" });
    await this.page.locator(this.wbLoadingDotTemplate).first().waitFor({ state: "detached" });
    // search product
    const xpathProductSearch = `//div[contains(@class, 'w-builder__autocomplete__selection')]/descendant::div[contains(@class, 'sb-tooltip__reference') and contains(text(),'${productName}')][1]`;
    await this.page.waitForSelector(xpathProductSearch);
    await this.page.locator(xpathProductSearch).click();
    const selectedTemplate = `//header[contains(@class, 'sb-sticky')]/descendant::div[contains(@class, 'w-builder__autocomplete')]/descendant::p[contains(text(), 'Preview: ${productName}')]`;
    await this.page.waitForSelector(selectedTemplate);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Select setting by category
   */
  async clickSettingCategory(
    category: "General" | "Product" | "Cart goal" | "Language" | "Cookies banner" | "Review rating",
  ): Promise<void> {
    await this.genLoc(`//p[contains(@class,'insert-category-name') and normalize-space()='${category}']`).click();
  }

  /**
   * Get size xpath by text in variant picker
   */
  getSizeXpathByText(text: string, blockId: string): string {
    return `//section[@block-id='${blockId}']//span[text()='${text}']`;
  }

  /**
   * Get color xpath by text in variant picker
   */
  getColorXpathByText(text: string, blockId: string): string {
    return `//section[@block-id='${blockId}']//span[text()='${text}']`;
  }

  /**
   * Toggle setting product by text
   */
  async toggleByLabel(label: string, value: string): Promise<void> {
    const switchLocator = `//div[contains(@label, '${label}')]//div[contains(@class, 'w-builder__widget--switch')]`;
    const inputValue = await this.genLoc(`${switchLocator}//input`).inputValue();
    if (value != inputValue) {
      await this.genLoc(
        `//div[contains(@label, '${label}')]//div[contains(@class, 'w-builder__widget--switch')]`,
      ).click();
    }
    if (value === "true") {
      await this.genLoc(
        `//div[contains(@label, '${label}')]//div[contains(@class, 'w-builder__widget--switch')]/descendant::div[contains(@class, 'sb-switch--active')]`,
      )
        .first()
        .waitFor();
    }

    if (value === "false") {
      await this.genLoc(
        `//div[contains(@label, '${label}')]//div[contains(@class, 'w-builder__widget--switch')]/descendant::div[contains(@class, 'sb-switch--active')]`,
      )
        .first()
        .waitFor({ state: "hidden" });
    }
  }

  /**
   * Toggle size chart
   */
  async toggleSizeChart(value: string): Promise<void> {
    const wbSizeChartToggle = `//div[@data-widget-id="size_chart_enabled"]//div[@class='w-builder__widget--switch']`;

    await this.frameLocator.locator(this.wbVariantPicker).click();
    await this.switchToTab("Content");

    const inputValue = await this.genLoc(`${wbSizeChartToggle}//input`).inputValue();
    if (value != inputValue) {
      await this.genLoc(wbSizeChartToggle).click();
    }
    if (value === "true") {
      await this.genLoc(`${wbSizeChartToggle}/descendant::div[contains(@class, 'sb-switch--active')]`)
        .first()
        .waitFor();
    }
    if (value === "false") {
      await this.genLoc(`${wbSizeChartToggle}/descendant::div[contains(@class, 'sb-switch--active')]`)
        .first()
        .waitFor({ state: "hidden" });
    }
  }

  /**
   * Click btn save if enable
   */
  async clickBtnSaveIfEnable() {
    await this.page.waitForTimeout(3 * 1000);
    const isSaveButtonEnabled = await this.page.locator("//button[normalize-space()='Save']").isEnabled({
      timeout: 3000,
    });
    if (isSaveButtonEnabled) {
      await this.page.click(`//button[@name='Save']`);
      await this.page.waitForSelector(
        `//div[contains(@class, 'w-builder__header-message')]/p[contains(text(), 'All changes are saved')]`,
        { state: "visible" },
      );
      await this.page.waitForSelector(
        `//div[contains(@class, 'w-builder__header-message')]/p[contains(text(), 'All changes are saved')]`,
        { state: "hidden" },
      );
      await expect(this.page.locator("//button[normalize-space()='Save']")).toBeDisabled();
    }
  }

  /**
   * Click btn preview
   */
  clickPreview = async ({ context, dashboard }) => {
    const [previewTab] = await Promise.all([
      context.waitForEvent("page"),
      await dashboard.click(this.xpathButtonPreview),
    ]);
    await previewTab.waitForLoadState("networkidle");
    const sfUrl = previewTab.url();
    await previewTab.goto(sfUrl);
    return previewTab;
  };

  /**
   * Login to get token
   */
  async loginWithToken(token: string, domain: string) {
    if (token.length == 0) {
      return false;
    }
    await this.page.goto(`https://${domain}/admin?x_key=${token}`, { waitUntil: "networkidle" });
    await this.page.waitForSelector(".nav-sidebar");
    return true;
  }

  /**
   * Get variant by text
   * @param text
   * @returns
   */
  getVariantByText(text: string, page?: "wb" | "sfn"): string {
    if (page == "sfn") {
      return `${this.sfVariantBlock}/descendant::span[text()='${text}']`;
    }
    return `${this.wbVariantPicker}/descendant::span[text()='${text}']`;
  }

  async getStyleVariantPickerObject(pageLocator: FrameLocator | Page, page?: "wb" | "sfn") {
    let variantBlock = this.wbSectionVariantPicker;
    if (page === "sfn") {
      variantBlock = this.sfVariantBlock;
    }
    const textColor = `${variantBlock}/descendant::p[contains(@class, 'variants-selector__label')]`;
    let locator = pageLocator.locator(`(${textColor})[1]`);
    const color = await getStyle(locator, "color");
    locator = this.frameLocator.locator(`${variantBlock}`);
    let width = await getStyle(locator, "width");
    width = width.replace("px", "");
    width = `${Math.floor(Number(width))}px`;
    const backgroundColor = await getStyle(locator, "background-color");
    const backgroundImage = (await getStyle(locator, "background-image")) != "none" ? true : false;
    const backgroundImageRepeatX = await getStyle(locator, "background-repeat-x");
    const backgroundImageRepeatY = await getStyle(locator, "background-repeat-y");
    const zIndex = await getStyle(locator, "z-index");
    let position = "manual";
    if (zIndex === "auto") {
      position = "auto";
    }
    const alignItem = await getStyle(locator, "align-self");
    const boderBottomColor = await getStyle(locator, "border-bottom-color");
    const boderBottomStyle = await getStyle(locator, "border-bottom-style");
    const boderBottomWidth = await getStyle(locator, "border-bottom-width");
    const boderTopColor = await getStyle(locator, "border-top-color");
    const boderTopStyle = await getStyle(locator, "border-top-style");
    const boderTopWidth = await getStyle(locator, "border-top-width");
    const boderLeftColor = await getStyle(locator, "border-left-color");
    const boderLeftStyle = await getStyle(locator, "border-left-style");
    const boderLeftWidth = await getStyle(locator, "border-left-width");
    const boderRightColor = await getStyle(locator, "border-right-color");
    const boderRightStyle = await getStyle(locator, "border-right-style");
    const boderRightWidth = await getStyle(locator, "border-right-width");

    const borderBottomLeftRadius = await getStyle(locator, "border-bottom-left-radius");
    const borderBottomRightRadius = await getStyle(locator, "border-bottom-right-radius");
    const borderTopLeftRadius = await getStyle(locator, "border-top-left-radius");
    const borderTopRightRadius = await getStyle(locator, "border-top-right-radius");

    const opacity = await getStyle(locator, "opacity");
    const radius = await getStyle(locator, "border-style");
    const shadow = await getStyle(locator, "box-shadow");
    const padding = await getStyle(locator, "padding");

    locator = this.frameLocator.locator(`${this.wbVariantPicker}`);
    if (page === "sfn") {
      variantBlock = this.sfVariantBlock;
    }
    const margin = await getStyle(locator, "margin");

    return {
      background_color: backgroundColor,
      background_image: backgroundImage,
      background_repeat_x: backgroundImageRepeatX,
      background_repeat_y: backgroundImageRepeatY,
      color: color,
      width: width,
      position: position,
      align_item: alignItem,
      boder_bottom_color: boderBottomColor,
      boder_bottom_style: boderBottomStyle,
      boder_bottom_width: boderBottomWidth,
      boder_top_color: boderTopColor,
      boder_top_style: boderTopStyle,
      boder_top_width: boderTopWidth,
      boder_left_color: boderLeftColor,
      boder_left_style: boderLeftStyle,
      boder_left_width: boderLeftWidth,
      boder_right_color: boderRightColor,
      boder_right_style: boderRightStyle,
      boder_right_width: boderRightWidth,
      border_bottom_left_radius: borderBottomLeftRadius,
      border_bottom_right_radius: borderBottomRightRadius,
      border_top_left_radius: borderTopLeftRadius,
      border_top_right_radius: borderTopRightRadius,
      opacity: opacity,
      radius: radius,
      shadow: shadow,
      padding: padding,
      margin: margin,
    };
  }
}
