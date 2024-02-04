import { SBPage } from "@pages/page";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();

export class SfProductGallery extends SBPage {
  xpath = {
    layoutGrid: {
      container: "//div[contains(@class, 'media_gallery__container')]",
      item: "//div[contains(@class, 'media_gallery__container')]//div[contains(@class, 'media_gallery_grid-image')]",
    },
    layoutMix: {
      container: "//div[contains(@class, 'media_gallery_mix--container')]",
      item: `//div[contains(@class, 'media_gallery_mix--container')]//div[contains(@class, 'media_gallery_mix--image')]`,
      buttonViewAll: "//div[contains(@class, 'media_gallery_mix--button-wrapper')]",
    },
    noImageWrapper: "//div[contains(@class, 'media-gallery-wrapper')]",
    preview: {
      container: "//div[contains(@class, 'preview-media__container')]",
    },
  };
  async openProductPage(productHandle: string) {
    await this.page.goto(`https://${this.domain}/products/${productHandle}`);
    await this.page.waitForLoadState("networkidle");
    try {
      await this.waitResponseWithUrl("/assets/theme.css", 7000);
    } catch (e) {
      logger.info(`Timeout when wait theme.css`);
    }
  }
}
