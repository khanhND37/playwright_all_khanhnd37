import { Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { OcgLogger } from "@core/logger";
import { ProductGalleryLayoutType } from "@types";

const logger = OcgLogger.get();

export class BlockGallerySf extends Blocks {
  xpathProductGalleryContainer = "//div[contains(@class, 'media_gallery__container')]";
  xpathProductGalleryPreviewContainer = "//div[contains(@class, 'preview-media__container')]";
  xpathButtonViewAll = "//button[contains(normalize-space(), 'View all')]";
  xpathSectionMedia = "//section[@component='media']";
  xpathGridItems = "//div[contains(@class, 'media_gallery_grid-image')]";
  xpathMixItems = "//div[contains(@class, 'media_gallery_mix--image')]";
  xpathButtonViewMoreGrid =
    "//div[contains(@class, 'media_gallery__container')]//button[contains(@class, 'media_gallery_grid--button')]";
  xpathButtonViewMoreMix =
    "//div[contains(@class, 'media_gallery__container')]//button[contains(@class, 'media_gallery_mix--button')]";
  xpathMediaGalleryContainer = "//div[contains(@class, 'media_gallery__container')]";
  xpathMediaGalleryGridItems =
    "//div[contains(@class, 'media_gallery__container')]//div[contains(@class, 'media_gallery_grid-image')]";
  xpathMediaGalleryWrapper = "//div[contains(@class, 'media-gallery-wrapper')]";

  xpathCarouselPreviewThumbnailBarItem = "//div[contains(@class, 'thumbnail-carousel-bar__slide')]";
  xpathCarouselPreviewMainImage =
    "//div[contains(@class, 'preview-media__container')]//div[contains(@class, 'media-card-thumbnail')]//img";
  xpathCarouselItem = "//div[contains(@class, 'media_gallery_slider-item')]";
  xpathThumbnailImage =
    "//div[contains(@class,'thumbnail-carousel-bar__slide')]//div[contains(@class,'media-card-thumbnail')]//img";
  xpathWrapImage = "//div[contains(@class,'VueCarousel-slide__wrap-image')]//img";
  xpathThumbnailCarouselOnSFMobile = "//div[@class='VueCarousel-slide relative thumbnail-carousel-slide']";
  selectorMediaImage = ".VueCarousel-slide .media-gallery-wrapper img";
  selectorThumbnailImage = ".thumbnail-carousel-bar__thumbnails .media-card-thumbnail-active";
  xpathThumbnailCarouselActiveOnSF =
    "//div[@class='VueCarousel-slide relative thumbnail-carousel-slide']//div[contains(@class, 'media-card-thumbnail-active')]";
  xpathPreviewImageCarouselMobile =
    "//div[contains(@class,'preview-media__slide__container')]//div[contains(@class, 'media-card-thumbnail') and not(@style='display: none;')]";
  xpathHoverAreaLeft = "//div[contains(@class, 'slider-item')]//div[contains(@class, 'hover-area--left')]";
  xpathHoverAreaRight = "//div[contains(@class, 'slider-item')]//div[contains(@class, 'hover-area--right')]";

  xpathCommon: {
    container: "//div[contains(@class, 'media_gallery__container')]";
  };

  xpathCarousel = {
    preview: {
      main: {
        firstImage:
          "(//div[contains(@class, 'preview-media__container')]//div[contains(@class, 'media-card-thumbnail')]//img)[1]",
        secondImage:
          "(//div[contains(@class, 'preview-media__container')]//div[contains(@class, 'media-card-thumbnail')]//img)[2]",
        thirdImage:
          "(//div[contains(@class, 'preview-media__container')]//div[contains(@class, 'media-card-thumbnail')]//img)[3]",
        container: "//div[contains(@class, 'preview-media__container')]",
        thumbnail: "//div[contains(@class, 'preview-media__container')]//div[contains(@class, 'media-card-thumbnail')]",
        nextButton:
          "//div[contains(@class, 'VueCarousel-navigation')]//button[contains(@class, 'VueCarousel-navigation-next')]",
        prevButton:
          "//div[contains(@class, 'VueCarousel-navigation')]//button[contains(@class, 'VueCarousel-navigation-prev')]",
      },
      thumbnailSidebar: {
        nextButton:
          "//div[contains(@class, 'thumbnail-carousel-bar')]//button[contains(@class, 'VueCarousel-navigation-next')]",
        prevButton:
          "//div[contains(@class, 'thumbnail-carousel-bar')]//button[contains(@class, 'VueCarousel-navigation-prev')]",
      },
    },
    main: {},
  };

  xpathMobile = {
    carouselMainMedia: "//div[contains(@class, 'slider-item')]//div[contains(@class, 'media-gallery-wrapper--loaded')]",
  };

  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  async openStorefront() {
    await this.page.goto(`https://${this.domain}?date=${new Date()}`);
    const startTime = new Date().getTime();
    await this.page.waitForLoadState("networkidle");
    logger.info(`Time since last wait networkidle: ${new Date().getTime() - startTime}`);
  }

  async openProductPage(productHandle: string) {
    await this.page.goto(`https://${this.domain}/products/${productHandle}`);
    await this.page.waitForLoadState("networkidle");
  }

  async getNumberOfProductGalleryImage(layoutType: ProductGalleryLayoutType) {
    switch (layoutType) {
      case "Grid":
        return this.genLoc(this.xpathGridItems).count();
      case "Mix":
        return this.genLoc(this.xpathMixItems).count();
    }

    return 0;
  }

  async getButtonViewAllText(layoutType: ProductGalleryLayoutType) {
    switch (layoutType) {
      case "Grid":
        return this.genLoc(this.xpathButtonViewMoreGrid).textContent();
      case "Mix":
        return this.genLoc(this.xpathButtonViewMoreMix).textContent();
    }
  }

  async selectVariant(variantName: string) {
    await this.genLoc(
      `//div[contains(@class, 'variants-selector')]//div[contains(@class, 'button-layout') and normalize-space()='${variantName}']`,
    ).click();
  }

  async hoverCarouselPreviewImage() {
    const mainImgBox = await this.genLoc(this.xpathCarousel.preview.main.container).first().boundingBox();
    const centerBox = await this.getBoundingBoxCenter(mainImgBox);

    await this.page.mouse.move(centerBox.x, centerBox.y);
  }

  async waitForVariantImageChanged() {
    await this.genLoc("//span[@value='product.title']").click({ delay: 2000 });
    await this.genLoc("//span[@value='product.title']").hover();
  }

  async hoverCarouselThumbnail() {
    const thumbnailBoundingBox = await this.page.locator(".slider-item").first().boundingBox();
    await this.page.mouse.move(
      thumbnailBoundingBox.x + thumbnailBoundingBox.width / 2,
      thumbnailBoundingBox.y + thumbnailBoundingBox.height / 2,
    );
  }

  async hoverCarouselThumbnailOnSide() {
    const thumbnailBoundingBox = await this.page.locator(".slider-item").first().boundingBox();
    await this.page.mouse.move(
      thumbnailBoundingBox.x + thumbnailBoundingBox.width / 5,
      thumbnailBoundingBox.y + thumbnailBoundingBox.height / 5,
    );
  }
}
