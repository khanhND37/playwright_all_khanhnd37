import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { bool } from "aws-sdk/clients/signer";
import {
  LayerStyles,
  ProductGalleryContentSetting,
  ProductGalleryLayoutType,
  ProductGalleryStyleSetting,
  ProductGalleryStyleValue,
} from "@types";

export class WebBuilderBlockGallery extends Blocks {
  xpathProductGalleryBlockOnLayer =
    "//div[contains(@class, 'w-builder__layer-title') and normalize-space()='Product gallery']";
  xpathDataSourceProduct = `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='Product']]`;
  xpathProductGallery = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']`;
  xpathWebBuilderMain = `//div[contains(@class, 'w-builder__main')]`;
  xpathGalleryCarousel = `//div[contains(@class, 'media_gallery_slider--container media_gallery__container')]`;
  xpathGalleryMix = `//div[contains(@class, 'media_gallery_mix--container media_gallery__container')]`;
  xpathGalleryGrid = `//div[contains(@class, 'media_gallery_grid--container grid')]`;
  xpathStandardProduct = `//div[contains(@class,'list-search-result')]//div[contains(@class,'sb-selection-item') and descendant::span[contains(text(), 'Standard Product')]]`;
  sfnProductGalleryMobile = `//div[contains(@class, 'media_gallery_mobile--container media_gallery__container')]`;
  xpathSidebarLayout = `//div[@data-widget-id='layout']//button`;
  xpathSidebarMobileLayout = `div[data-widget-id='layout_mobile']>div>div:nth-child(2)`;
  xpathSidebarLayoutMobile = `//div[@data-widget-id='layout_mobile']//button`;
  xpathSidebarRatio = `div[data-widget-id='ratio']>div>div:nth-child(2)`;
  layoutPopup = `(//div[contains(@class, 'w-builder__widget--layout')])[2]`;
  xpathSidebarRatioPopover = `//div[@id='widget-popover' and not(contains(@style, 'display: none'))]`;
  selectorDataSourceButton = ".w-builder__source-detail span .popover__reference__title";
  xpathCarouselThumb = "//div[contains(@class, 'media-card-thumbnail')]";
  xpathLayerButton = 'header [name="Layer"]';
  xpathThumbCarousel =
    "//div[contains(@class, 'media_gallery_slider--container')]//div[contains(@class, 'flex-column')]";
  xpathThumbLeft = "//div[contains(@class, 'media_gallery_slider--container')]//div[contains(@class, 'flex-column')]";
  xpathThumbRight = ".media_gallery_slider--container .flex-row";

  btnSelectNavType = '//label[contains(., "Nav type")]/ancestor::div[2]//button';
  btnSelectNavPosition = '//label[contains(., "Nav position")]/ancestor::div[2]//button';
  navTypeNoneInPreview = `${this.xpathProductGallery}/descendant::div[contains(@class, 'custom-none-pagination')]`;
  navTypeDotInPreview = `${this.xpathProductGallery}/descendant::div[contains(@class, 'VueCarousel-dot-container')]`;
  navTypeThumbnailInPreview = `${this.xpathProductGallery}//div[contains(@class, 'thumbnail-carousel') and not(contains(@class, 'thumbnail-carousel-slide'))]`;
  inputSearchProductSource = `//input[@placeholder="Search product"]`;
  xpathListHeader = `//div[contains(@class, 'w-builder__layers-header')]/div[contains(@class, 'sb-w-100')]/div[@data-id]`;
  crsItemMainXpath = `//div[contains(@class, 'media_gallery_slider--container')]/descendant::div[contains(@class, 'VueCarousel slider-item align-center')]`;
  prevBtn = `${this.crsItemMainXpath}/descendant::button[contains(@class, 'VueCarousel-navigation-button VueCarousel-navigation-prev')]`;
  nextBtn = `${this.crsItemMainXpath}/descendant::button[contains(@class, 'VueCarousel-navigation-button VueCarousel-navigation-next')]`;
  settingList = `//div[contains(@class, 'w-builder__settings-list')]`;
  xpathInputSpacing = `//div[contains(@class, 'w-builder__widget--layout')]/descendant::div[contains(@class, 'sb-input-number')]/descendant::input[@type='number']`;
  xpathRadius = `//div[@data-widget-id='item_radius' and descendant::label[normalize-space()='Item radius']]/descendant::input[@type='number' and contains(@class, 'sb-input__inner-append')]`;
  listThumbXpath = `${this.xpathProductGallery}/descendant::div[contains(@class, 'thumbnail-carousel')]/descendant::div[contains(@class,'VueCarousel-wrapper')]`;
  resizeTopBtn = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class, 'resizer top')]`;
  resizeBottomBtn = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class, 'resizer bottom')]`;
  headerLayoutPopup = '//div[@data-widget-id="layout"]//label[text()=" Layout "]';
  layoutGridOnWB = ".media_gallery_grid--container";
  labelItemPerRow = '//label[text()=" Item per row "]';
  labelItemRadius = '//label[text()=" Item radius "]';
  layoutLabelXpath = "(//div[contains(@class, 'w-builder__widget--label')]//label[contains(text(), 'Layout')])[2]";
  xpathCarouselWB = "//div[contains(@class, 'media_gallery_slider--container')]";

  mobileImgItem = `//div[contains(@class, 'outside-modal fixed popover-bottom__overlay w-100 h-100 flex justify-center preview-media')]/descendant::div[contains(@class, 'VueCarousel-inner')]/descendant::div[contains(@class, 'slider-item')]`;
  mobileModal = `//div[contains(@class, 'outside-modal fixed popover-bottom__overlay w-100 h-100 flex justify-center preview-media')]`;
  mobileNavTypeNone = `${this.xpathProductGallery}/descendant::div[contains(@class, 'custom-pagination')]`;
  xpathGridItems = "//div[contains(@class, 'media_gallery_grid-image')]";
  xpathMixItems = "//div[contains(@class, 'media_gallery_mix--image')]";
  xpathMediaGalleryContainer = "//div[contains(@class, 'media_gallery__container')]";
  xpathMediaGalleryImage = "//div[contains(@class, 'media-gallery-image')]";
  xpathMediaGalleryGridWrapper = "//div[contains(@class, 'media-gallery-wrapper')]";
  xpathButtonViewMoreGrid =
    "//div[contains(@class, 'media_gallery__container')]//button[contains(@class, 'media_gallery_grid--button')]";
  xpathButtonViewMoreMix =
    "//div[contains(@class, 'media_gallery__container')]//button[contains(@class, 'media_gallery_mix--button')]";

  xpathCarouselSlideItem = "//div[contains(@class, 'media_gallery_slider-item')]";
  xpathCarouselThumbnailHorizontal = "//div[contains(@class, 'media_gallery__thumbnail--horizontal')]";
  xpathCarouselThumbnailNavNext = "//button[contains(@class, 'VueCarousel-navigation-next')]";
  xpathCarouselThumbnailNavPrev = "//button[contains(@class, 'VueCarousel-navigation-prev')]";

  //sfn mobile
  sfnMobileNavTypeNone = `${this.sfnProductGalleryMobile}/descendant::div[contains(@class, 'custom-pagination')]`;
  sfnMobileDotsInGallery = `${this.sfnProductGalleryMobile}/descendant::div[contains(@class,'slider-item')]/descendant::div[contains(@class, 'VueCarousel-pagination')]/descendant::div[contains(@class, 'VueCarousel-dot-container')]`;

  layoutIndex = {
    Grid: 1,
    Carousel: 2,
    Mix: 3,
  };

  mediaRatio = {
    square: {
      index: 0,
      style: "padding-top:100%;",
      tooltip: "Square 1:1",
    },
    portrait: {
      index: 1,
      style: "padding-top:125%;",
      tooltip: "Portrait 3:4",
    },
    landscape: {
      index: 2,
      style: "padding-top:56.25%;",
      tooltip: "Landscape 16:9",
    },
  };

  photoListOptions = ["All photos", "Only show variant photos"];
  xpathMobile = {
    carouselMainMedia: "//div[contains(@class, 'slider-item')]//div[contains(@class, 'media-gallery-wrapper--loaded')]",
  };

  async openWb() {
    await this.navigateToMenu("Online Store");
    await this.page.getByRole("button", { name: "Customize" }).first().click();
    await this.loadingScreen.waitFor();
    await this.loadingScreen.waitFor({ state: "hidden" });
    await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
    await this.page.locator('button[name="Pages"]').click();

    await this.page.goto(`${this.page.url().toString()}?page=product`);
    await this.loadingScreen.waitFor();
    await this.loadingScreen.waitFor({ state: "hidden" });
    await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
  }

  async selectBlockProductGalleryOnLayer() {
    await this.clickBtnNavigationBar("layer");
    // May be need expand all blocks first
    await this.expandAllLayerItems();

    await this.genLoc(this.xpathProductGalleryBlockOnLayer).first().click();
  }

  getXpathItemPerRow(value: string) {
    return `//div[contains(@class, 'w-builder__widget--layout')]/descendant::div[contains(@class, 'sb-pointer')]/span[descendant::label[text()=${value}]]`;
  }

  /**
   * Click btn save if enable
   */
  async clickBtnSaveIfEnable() {
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
   * Get navtype layout theo text
   * @param text
   * @returns
   */
  getNavTypeLayoutByText(text: string) {
    return `//div[contains(@class, 'widget-select__search')]/descendant::li[descendant::label[contains(text(),'${text}')]]`;
  }

  /**
   * Change data source trong 1 section
   * @param productName
   */
  async changeDataSourceInSection(productName: string) {
    await this.page.locator("#search-data-source").click();
    const isVisibleProduct = await this.page.locator(this.xpathDataSourceProduct).isVisible();
    if (isVisibleProduct) {
      await this.page.locator(this.xpathDataSourceProduct).click();
    }
    await this.page.locator(this.inputSearchProductSource).fill(productName);
    await this.page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });
    const xpathProductSource = `//div[contains(@class,'list-search-result')]//div[contains(@class,'sb-selection-item') and descendant::span[contains(text(), '${productName}')]]`;
    await this.page.locator(xpathProductSource).click();
    await this.page.locator('.sb-popup__footer span:text-is("Save")').click();

    // Wait 2s để  dữ liệu từ product fetch vào dom,
    await this.page.waitForTimeout(2000);
  }

  /**
   * Remove section
   */
  async removeUnuseSection() {
    const countHeader = await this.page.locator(this.xpathListHeader).count();
    if (countHeader > 2) {
      const blockNeedToClick = this.getSelectorByIndex({
        section: 1,
      });
      await this.clickOnElement(blockNeedToClick, this.iframe);
      await this.removeBtn.click();
    }
  }

  /**
   * Get ra locator của navtype trong preview
   * @param type
   * @param isMobile
   * @returns
   */
  getLocatorNavTypeInPreview(type: "Dots" | "None" | "Thumbnail", isMobile: bool = false) {
    if (type === "Dots") {
      return this.navTypeDotInPreview;
    }
    if (type === "None") {
      if (isMobile) {
        return this.mobileNavTypeNone;
      }
      return this.navTypeNoneInPreview;
    }
    if (type === "Thumbnail") {
      return this.navTypeThumbnailInPreview;
    }
  }

  /**
   * Change navigation type carousel bên sidebar
   * @param type
   * @param isMobile
   */
  async changeNavTypeCarousel(
    type: "Dots" | "None" | "Thumbnail",
    isMobile: bool = false,
    position?: "Bottom" | "Left" | "Right",
  ) {
    await this.frameLocator.locator(this.xpathProductGallery).click();
    await this.switchToTab("Design");

    if (isMobile == true) {
      await this.page.locator(this.xpathSidebarLayoutMobile).last().click();
    } else {
      await this.page.locator(this.xpathSidebarLayout).last().click();
    }
    await this.page.locator(this.layoutPopup).first().waitFor({ state: "visible" });
    await this.page.locator(this.btnSelectNavType).click();
    const navTypeOption = this.getNavTypeLayoutByText(type);
    await this.page.locator(navTypeOption).click();
    if (position) {
      await this.page.locator(this.btnSelectNavPosition).click();
      await this.page
        .locator(`//li[@data-select-label='${position}']//label[contains(text(), '${position}')]`)
        .last()
        .click();
    }
    const locatorInPrview = this.getLocatorNavTypeInPreview(type, isMobile);
    await this.frameLocator.locator(locatorInPrview).isVisible();
  }

  /**
   * Change layout
   * @param type
   */
  async changeLayout(type: "Grid" | "Carousel" | "Mix") {
    let xpath = null;
    if (type === "Grid") {
      xpath = `//div[contains(@class, 'w-builder__widget--layout')]/descendant::div[contains(@class, 'list-icon')]/span[1]`;
    }
    if (type === "Carousel") {
      xpath = `//div[contains(@class, 'w-builder__widget--layout')]/descendant::div[contains(@class, 'list-icon')]/span[2]`;
    }
    if (type === "Mix") {
      xpath = `//div[contains(@class, 'w-builder__widget--layout')]/descendant::div[contains(@class, 'list-icon')]/span[3]`;
    }

    await this.page.locator(this.xpathSidebarLayout).last().click();
    await this.page.locator(this.layoutPopup).first().waitFor({ state: "visible" });

    await this.page.locator(xpath).click();
  }

  /**
   *
   * @param type
   * @param isMobile
   * @returns
   */
  getXpathProductGalleryByLayout(type: "Grid" | "Carousel" | "Mix", isMobile: bool = false) {
    if (isMobile) {
      return `//div[contains(@class, 'media_gallery_mobile--container')]`;
    }
    switch (type) {
      case "Grid":
        return this.xpathGalleryGrid;
      case "Carousel":
        return this.xpathGalleryCarousel;
      case "Mix":
        return this.xpathGalleryMix;
      default:
        return "";
    }
  }

  async deleteAllExistingBlockProductGallery() {
    await this.clickBtnNavigationBar("layer");

    // Expand all blocks
    await this.expandAllLayerItems();

    // Find product gallery block
    const xpathProductGaleryOnLayer =
      "//div[contains(@class, 'w-builder__layer-title') and contains(normalize-space(), 'Product gallery')]";
    const productGalleryLocs = await this.genLoc(xpathProductGaleryOnLayer).all();

    // Click on each and delete
    for (const productGalleryLoc of productGalleryLocs) {
      await productGalleryLoc.click();
      await this.removeCurrentLayer();

      await this.clickBtnNavigationBar("layer");
    }
  }

  async insertBlockProductGalleryInProductPage() {
    await this.insertSectionBlock({
      parentPosition: {
        section: 3,
        row: 2,
        column: 1,
      },
      position: "Top",
      category: "Basics",
      template: "Product gallery",
    });
  }

  async setProductGalleryStyle(style: ProductGalleryStyleSetting) {
    await this.switchToTab("Design");

    // Set items design
    const layoutStyle = style.layout;
    if (layoutStyle) {
      if (layoutStyle.isMobile) {
        // On mobile, we have only carousel setting
        await this.page.locator(this.xpathSidebarLayoutMobile).click();
        await this.genLoc(
          `//div[contains(@class, 'w-builder__popover w-builder__widget--layout')]/descendant::div[contains(@class, 'list-icon')]/span[1]`,
        ).click();
        const layoutOptions = layoutStyle.options;
        if (layoutOptions) {
          // nav type
          if (layoutOptions.navType) {
            await this.genLoc(
              "//div[contains(@class, 'w-builder__widget--label') and normalize-space()='Nav type']/following-sibling::div",
            )
              .getByRole("button")
              .nth(0)
              .click();

            await this.genLoc(
              `//div[contains(@class, 'sb-popover__popper') and not(contains(@style,'display: none;'))]//li[contains(normalize-space(), '${layoutOptions.navType}')]//label`,
            ).click({
              timeout: 5000,
            });
          }
        }
      } else {
        await this.page.locator(this.xpathSidebarLayout).click();
        await this.page.locator(this.layoutPopup).first().waitFor({ state: "visible" });
        const layoutIndex = this.layoutIndex[layoutStyle.name];
        await this.genLoc(
          `//div[contains(@class, 'w-builder__popover w-builder__widget--layout')]/descendant::div[contains(@class, 'list-icon')]/span[${layoutIndex}]`,
        ).click();

        const layoutOptions = layoutStyle.options;
        if (layoutOptions) {
          // item per row
          if (layoutOptions.itemPerRow) {
            await this.genLoc(
              `//div[contains(@class, 'w-builder__widget--label') and normalize-space()='Item per row']/following-sibling::div//span[${layoutOptions.itemPerRow}]//label`,
            ).click();
          }

          // spacing
          if (typeof layoutOptions.spacing !== "undefined") {
            const spacingLoc = this.genLoc(
              `//div[contains(@class, 'w-builder__widget--label') and normalize-space()='Spacing']/following-sibling::div//div[contains(@class, 'sb-input-number')]//input`,
            );
            await spacingLoc.fill(`${layoutOptions.spacing}`);
          }

          // nav type
          if (layoutOptions.navType) {
            await this.genLoc(
              "//div[contains(@class, 'w-builder__widget--label') and normalize-space()='Nav type']/following-sibling::div",
            )
              .getByRole("button")
              .nth(0)
              .click();

            await this.genLoc(
              `//div[contains(@class, 'sb-popover__popper') and not(contains(@style,'display: none;'))]//li[contains(normalize-space(), '${layoutOptions.navType}')]//label`,
            ).click({
              timeout: 5000,
            });
          }

          // nav position
          if (layoutOptions.navPosition) {
            await this.genLoc(
              "//div[contains(@class, 'w-builder__widget--label') and normalize-space()='Nav position']/following-sibling::div",
            )
              .getByRole("button")
              .nth(0)
              .click();

            await this.genLoc(
              `//div[contains(@class, 'sb-popover__popper') and not(contains(@style,'display: none;'))]//li[contains(normalize-space(), '${layoutOptions.navPosition}')]//label`,
            ).click({
              timeout: 5000,
            });
          }
        }
      }
    }

    if (style.itemRadius) {
      await this.genLoc(this.xpathRadius).fill(`${style.itemRadius}`);
    }

    const layerStyles: LayerStyles = {};
    if (style.position) {
      layerStyles.position = style.position;
    }

    if (style.align) {
      layerStyles.align = style.align;
    }

    if (style.width) {
      layerStyles.width = style.width;
    }

    if (style.background) {
      layerStyles.background = style.background;
    }

    if (style.border) {
      layerStyles.border = style.border;
    }

    if (style.opacity) {
      layerStyles.opacity = style.opacity;
    }

    if (style.radius) {
      layerStyles.radius = style.radius;
    }

    if (style.shadow) {
      layerStyles.shadow = style.shadow;
    }

    if (style.padding) {
      layerStyles.padding = style.padding;
    }

    if (style.margin) {
      layerStyles.margin = style.margin;
    }

    await this.changeDesign(layerStyles);
  }

  async setProductGalleryContent(setting: ProductGalleryContentSetting) {
    await this.switchToTab("Content");
    if (setting.photoList) {
      await this.selectDropDown("photo_list", setting.photoList);
    }

    if (setting.mediaRatio) {
      await this.genLoc(this.xpathSidebarRatio).click();
      await this.genLoc(this.xpathSidebarRatioPopover).first().waitFor({ state: "visible" });
      const ratioIndex = this.mediaRatio[setting.mediaRatio].index;
      await this.clickRatio(ratioIndex);
    }

    await this.titleBar.click({ delay: 200 });
  }

  async getDesignSettings(): Promise<ProductGalleryStyleValue> {
    await this.switchToTab("Design");
    const style: ProductGalleryStyleValue = {};

    // layout
    const rawLayout = await this.genLoc(this.xpathSidebarLayout).innerText();
    style.layout = rawLayout.trim();

    // item radius
    const radiusValue = await this.getSidebarSliderValue("item_radius", "Item radius");
    style.itemRadius = parseInt(radiusValue);

    // position
    const rawPosition = await this.genLoc("div[data-widget-id='position']>div>div:nth-child(2)").innerText();
    style.position = rawPosition.trim();

    // align
    const alignLocators = await this.genLoc("//div[@data-widget-id='align_self']//div/div[2]/div/span/div[2]").all();
    let alignValue: "Left" | "Center" | "Right";
    for (let i = 0; i < alignLocators.length; i++) {
      const alignItem = alignLocators[i];

      const itemClass = await alignItem.getAttribute("class");
      if (itemClass.includes("active")) {
        switch (i) {
          case 0:
            alignValue = "Left";
            break;
          case 1:
            alignValue = "Center";
            break;
          case 2:
            alignValue = "Right";
            break;
        }

        break;
      }
    }
    style.align = alignValue;

    // Width (value + unit)
    const rawWidthValue = await this.genLoc("//div[@data-widget-id='width']//div/div[2]//input").inputValue();
    const rawWidthUnit = await this.genLoc("//div[@data-widget-id='width']//div/div[2]//button").innerText();

    const widthValue = rawWidthValue.trim();
    const widthUnit = rawWidthUnit.trim();
    style.width = {
      value: parseInt(widthValue),
      unit: widthUnit,
    };

    // TODO: fill Background --
    // Click on background
    const backgroundPopover = this.genLoc(`${this.popOverXPath}//label[normalize-space()='Background']`);
    if (await backgroundPopover.isHidden()) {
      await this.genLoc(`//div[contains(@data-widget-id,'background')]//div[contains(@class,'sb-pointer')]`).click();
    }

    // Get active tab
    // Get preset value
    // TODO: Get tab image values
    // Click to close background popover
    await this.titleBar.first().click();

    // TODO: fill Border --

    // opacity
    const opacity = await this.getSidebarSliderValue("opacity", "Opacity");
    style.opacity = parseInt(opacity);
    // Radius
    const radius = await this.getSidebarSliderValue("border_radius", "Radius");
    style.opacity = parseInt(radius);

    // TODO: fill Shadow --

    // Padding
    const rawPadding = await this.genLoc(
      "//div[@data-widget-id='padding']//div[contains(@class, 'w-builder__widget--inline')]//input",
    ).inputValue();
    const padding = rawPadding.trim();
    const paddingValues = padding.split(",");
    style.padding = {
      bottom: parseInt(paddingValues[0]),
      left: parseInt(paddingValues[1]),
      right: parseInt(paddingValues[2]),
      top: parseInt(paddingValues[3]),
    };

    // margin
    const rawMargin = await this.genLoc(
      "//div[@data-widget-id='margin']//div[contains(@class, 'w-builder__widget--inline')]//input",
    ).inputValue();
    const margin = rawMargin.trim();
    const marginValues = margin.split(",");
    style.margin = {
      bottom: parseInt(marginValues[0]),
      left: parseInt(marginValues[1]),
      right: parseInt(marginValues[2]),
      top: parseInt(marginValues[3]),
    };

    return style;
  }

  async clickMediaRatio() {
    await this.genLoc("//div[@data-widget-id='ratio']").getByRole("button").nth(0).click();
  }

  getXpathMediaRatio(tooltipItem: string) {
    return `//div[starts-with(@id, 'sb-tooltip') and contains(normalize-space(), '${tooltipItem}')]`;
  }

  async hoverRatio(i: number) {
    const xpathActivePopover = `//div[@id='widget-popover' and not(contains(@style, 'display: none;'))]`;
    await this.genLoc(xpathActivePopover).locator("//span[contains(@class, 'widget-select__item')]").nth(i).hover();
  }

  async clickRatio(i: number) {
    const xpathActivePopover = `//div[@id='widget-popover' and not(contains(@style, 'display: none;'))]`;
    await this.genLoc(xpathActivePopover)
      .locator("//span[contains(@class, 'widget-select__item')]//span")
      .nth(i)
      .click();
  }

  async clickPhotoList() {
    await this.genLoc("//div[@data-widget-id='photo_list']").getByRole("button").nth(0).click();
  }

  async getPhotoListOptions() {
    const optionLocators = await this.genLoc(
      "//div[@id='widget-popover' and not(contains(@style, 'display: none;'))]//li",
    ).all();
    const result = [];

    for (const optionLocator of optionLocators) {
      let option = await optionLocator.textContent();
      option = option.trim();

      result.push(option);
    }

    return result;
  }

  async getNumberOfProductGalleryImage(layoutType: ProductGalleryLayoutType) {
    switch (layoutType) {
      case "Grid":
        return this.genLocFrame(this.xpathGridItems).count();
      case "Mix":
        return this.genLocFrame(this.xpathMixItems).count();
      case "Carousel":
        return this.genLocFrame(`${this.xpathCarouselThumb}//img`).count();
    }

    return 0;
  }

  async getButtonViewAllText(layoutType: ProductGalleryLayoutType) {
    switch (layoutType) {
      case "Grid":
        return this.genLocFrame(this.xpathButtonViewMoreGrid).textContent();
      case "Mix":
        return this.genLocFrame(this.xpathButtonViewMoreMix).textContent();
    }
  }

  async selectProductGalleryOnSidebar() {
    await this.clickBtnNavigationBar("layer");

    // Find product gallery block
    const xpathProductGaleryOnLayer =
      "//div[contains(@class, 'w-builder__layer-title') and contains(normalize-space(), 'Product gallery')]";
    await this.genLoc(xpathProductGaleryOnLayer).first().click();
  }

  async selectVariant(variantName: string) {
    await this.genLocFrame(
      `//div[contains(@class, 'variants-selector')]//div[contains(@class, 'button-layout') and normalize-space()='${variantName}']`,
    ).click();
    await this.titleBar.click({ delay: 2000 });
  }

  async hoverCarouselThumbnail() {
    const thumbnailBoundingBox = await this.genLocFrame(this.xpathCarouselWB).boundingBox();
    await this.page.mouse.move(
      thumbnailBoundingBox.x + thumbnailBoundingBox.width / 2,
      thumbnailBoundingBox.y + thumbnailBoundingBox.height / 2,
    );
  }

  async hoverCarouselThumbnailOnSide() {
    const thumbnailBoundingBox = await this.genLocFrame(this.xpathCarouselWB).boundingBox();
    await this.page.mouse.move(
      thumbnailBoundingBox.x + thumbnailBoundingBox.width / 5,
      thumbnailBoundingBox.y + thumbnailBoundingBox.height / 5,
    );
  }
}
