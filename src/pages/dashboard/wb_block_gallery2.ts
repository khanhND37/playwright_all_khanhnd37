import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import {
  LayerStyles,
  ProductGalleryContentSetting,
  ProductGalleryLayoutType,
  ProductGalleryStyleSetting,
} from "@types";
import { expect } from "@core/fixtures";

export class WbBlockGallery2 extends Blocks {
  xpath = {
    sidebar: {
      mobile: {
        layout: "//div[@data-widget-id='layout_mobile']//div//div[2]",
      },
      layout: "(//div[@data-widget-id='layout']//div[contains(@class, 'w-builder__widget--inline')])",
      radius:
        "//div[@data-widget-id='item_radius' and descendant::label[normalize-space()='Item radius']]/descendant::input[@type='number' and contains(@class, 'sb-input__inner-append')]",
      ratio: "//div[@data-widget-id='ratio']//button",
      popup: {
        layout: "(//div[contains(@class, 'w-builder__widget--layout')])[2]",
      },
      popover: {
        active: "//div[@id='widget-popover' and not(contains(@style, 'display: none'))]",
        item: "//span[contains(@class, 'widget-select__item')]//span",
        subHeading:
          "//div[contains(@class, 'w-builder__popover w-builder__widget--layout')]//label[contains(@class, 'sb-text-sub-heading')]",
      },
      layer: {
        productGallery:
          "//p[contains(@class, 'w-builder__layer-label') and contains(normalize-space(), 'Product gallery')]",
      },
      columnContainProductGallery:
        "((//div[contains(@class, 'w-builder__layer-title') and contains(normalize-space(), 'Product detail')]/ancestor::div)[12]/following-sibling::div/div/div[2]/div[2]/div)[1]",
      tooltip: (text: string) => `//div[starts-with(@id, 'sb-tooltip') and contains(normalize-space(), '${text}')]`,
      photoList: "//div[@data-widget-id='photo_list']//button",
    },
    headerBar: {
      productSource: {
        chooseProduct:
          "//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='Product']]",
        inputProductName: '//input[@placeholder="Search product"]',
        loadingDot: "//span[contains(@class, 'sb-autocomplete--loading-dots')]",
        productByName: name =>
          `//div[contains(@class,'list-search-result')]//div[contains(@class,'sb-selection-item') and descendant::span[contains(text(), '${name}')]]`,
      },
    },
    wbPreview: {
      breadcrumb: name => `//span[contains(text(), '${name}')]`,
      breadcumbProductTitle: "//span[contains(@class, 'breadcrumb_link--current')]",
      sectionProductGallery: "//section[@component='media']",
      sectionVariantPicker: "//section[@component='variants']",
      layoutGrid: {
        imageItem: "//div[contains(@class, 'media_gallery_grid-image')]",
        viewAllButton: "//button[contains(@class, 'media_gallery_grid--button') and contains(text(), 'View all')]",
      },
      layoutMix: {
        imageItem: "//div[contains(@class, 'media_gallery_mix--image')]",
      },
      layoutCarousel: {
        imageItem: "//div[contains(@class, 'media_gallery__thumbnail--horizontal')]//img",
      },
      preview: {
        container: "//div[contains(@class, 'preview-media__container')]",
        closeButton: "//div[contains(@class, 'preview-media__close-icon')]",
      },
      variantPicker: {
        variantByName: (name: string) =>
          `//div[contains(@class, 'variants-selector')]//div[contains(@class, 'button-layout') and normalize-space()='${name}']`,
      },
    },
  };

  text = {
    photoListOptions: ["All photos", "Only show variant photos"],
  };

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

  async customizeDefaultTheme() {
    await this.page.getByRole("button", { name: "Customize" }).first().click();
    await this.loadingScreen.waitFor();
    await this.loadingScreen.waitFor({ state: "hidden" });
    await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
    await this.genLoc('button[name="Pages"]').click();

    await this.page.goto(`${this.page.url().toString()}?page=product`);
    await this.loadingScreen.waitFor();
    await this.loadingScreen.waitFor({ state: "hidden" });
    await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
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

  async insertDefaultProductGalleryBlock() {
    // Click to row contains Product gallery (because it false on prodtest)
    // {
    //   await this.clickBtnNavigationBar("layer");
    //   await this.expandAllLayerItems();
    //   const columnLoc =  this.genLoc(this.xpath.sidebar.columnContainProductGallery);
    //   const isVisible = await columnLoc.isVisible();
    //   if (isVisible) {
    //     await columnLoc.click();
    //   }
    // }

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
    await this.clickProductGalleryBlock();
    await this.switchToTab("Design");

    // Set items design
    const layoutStyle = style.layout;
    if (layoutStyle) {
      if (layoutStyle.isMobile) {
        // On mobile, we have only carousel setting
        await this.genLoc(this.xpath.sidebar.mobile.layout).click();
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
        const layoutLocs = await this.genLoc(this.xpath.sidebar.layout).all();
        for (const layoutLoc of layoutLocs) {
          const isVisible = await layoutLoc.isVisible();
          if (isVisible) {
            await layoutLoc.click();
            break;
          }
        }
        await this.genLoc(this.xpath.sidebar.popup.layout).first().waitFor({ state: "visible" });
        const layoutIndex = this.layoutIndex[layoutStyle.name];
        await this.genLoc(
          `//div[contains(@class, 'w-builder__popover w-builder__widget--layout')]/descendant::div[contains(@class, 'list-icon')]/span[${layoutIndex}]`,
        ).click();

        // click to hide tooltip
        await this.genLocFirst(this.xpath.sidebar.popover.subHeading).click();

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
      await this.genLoc(this.xpath.sidebar.radius).fill(`${style.itemRadius}`);
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
      await this.genLoc(this.xpath.sidebar.ratio).click();
      await this.genLoc(this.xpath.sidebar.popover.active).first().waitFor({ state: "visible" });
      const ratioIndex = this.mediaRatio[setting.mediaRatio].index;
      await this.clickRatio(ratioIndex);
    }

    await this.titleBar.click({ delay: 200 });
  }

  async clickRatio(i: number) {
    await this.genLoc(this.xpath.sidebar.popover.active).locator(this.xpath.sidebar.popover.item).nth(i).click();
  }

  async clickProductGalleryBlock() {
    await this.clickBtnNavigationBar("layer");
    await this.genLoc(this.xpath.sidebar.layer.productGallery).first().click();
  }

  async clickBreadcrumb(productName: string) {
    await this.genLocFrameFirst(this.xpath.wbPreview.breadcrumb(productName)).click();
  }

  async clickProductTitle(productName: string) {
    await this.genLocFrame(this.xpath.wbPreview.breadcrumb(productName)).nth(2).click();
  }

  async clickBlockVariantPicker() {
    await this.genLocFrameFirst(this.xpath.wbPreview.sectionVariantPicker).click();
  }

  async changeDataSourceInSection(productName: string) {
    await this.genLoc("#search-data-source").click();
    const isVisibleProduct = await this.genLoc(this.xpath.headerBar.productSource.chooseProduct).isVisible();
    if (isVisibleProduct) {
      await this.genLoc(this.xpath.headerBar.productSource.chooseProduct).click();
    }
    await this.genLoc(this.xpath.headerBar.productSource.inputProductName).fill(productName);
    await this.genLoc(this.xpath.headerBar.productSource.loadingDot).first().waitFor({ state: "detached" });
    await this.genLoc(this.xpath.headerBar.productSource.productByName(productName)).click();

    // Wait 2s để  dữ liệu từ product fetch vào dom,
    await this.page.waitForTimeout(2000);
  }

  async dbClickOnGalleryImage(layout: "Grid" | "Carousel" | "Mix", index: number) {
    let xpathItem = "";
    switch (layout) {
      case "Grid":
        xpathItem = this.xpath.wbPreview.layoutGrid.imageItem;
    }

    await this.genLocFrame(xpathItem).nth(index).dblclick();
  }

  async closePreview() {
    await this.genLocFrame(this.xpath.wbPreview.preview.closeButton).first().click();
    await expect(this.genLocFrame(this.xpath.wbPreview.preview.container)).toBeHidden();
  }

  async dbClickViewAllButton() {
    await this.genLocFrame(this.xpath.wbPreview.layoutGrid.viewAllButton).first().dblclick();
    await expect(this.genLocFrame(this.xpath.wbPreview.preview.container)).toBeVisible();
  }

  async clickMediaRatio() {
    await this.genLoc(this.xpath.sidebar.ratio).first().click();
  }

  async hoverRatio(index: number) {
    await this.genLoc(this.xpath.sidebar.popover.active).locator(this.xpath.sidebar.popover.item).nth(index).hover();
  }

  async clickPhotoList() {
    await this.genLocFirst(this.xpath.sidebar.photoList).click();
  }

  async getPhotoListOptions() {
    const optionLocators = await this.genLoc(this.xpath.sidebar.popover.active).locator("li").all();
    const result = [];

    for (const optionLocator of optionLocators) {
      let option = await optionLocator.textContent();
      option = option.trim();

      result.push(option);
    }

    return result;
  }

  async selectVariant(variantName: string) {
    await this.genLocFrame(this.xpath.wbPreview.variantPicker.variantByName(variantName)).click();
    await this.titleBar.click({ delay: 2000 });
  }

  async getNumberOfProductGalleryImage(layoutType: ProductGalleryLayoutType) {
    switch (layoutType) {
      case "Grid":
        return this.genLocFrame(this.xpath.wbPreview.layoutGrid.imageItem).count();
      case "Mix":
        return this.genLocFrame(this.xpath.wbPreview.layoutCarousel.imageItem).count();
      case "Carousel":
        return this.genLocFrame("").count();
    }

    return 0;
  }

  async tmpClickLayoutDesktop() {
    const layoutLocs = await this.genLoc(this.xpath.sidebar.layout).all();
    for (const layoutLoc of layoutLocs) {
      const isVisible = await layoutLoc.isVisible();
      if (isVisible) {
        await layoutLoc.click();
        break;
      }
    }
    await this.genLoc(this.xpath.sidebar.popup.layout).first().waitFor({ state: "visible" });
  }

  async waitTillProductBreadcrumbUpdate(productName: string) {
    // wait till title is changed
    await expect(this.genLocFrameFirst(this.xpath.wbPreview.breadcumbProductTitle)).toContainText(productName);
  }
}
