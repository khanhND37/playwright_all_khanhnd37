import { Page } from "@playwright/test";
import { SFHome } from "@pages/storefront/homepage";
import { waitForImageLoaded } from "@core/utils/theme";

export class HomePageV3 extends SFHome {
  xpathIconSearch = "//div[contains(@class,'block-search__search-icon')]";
  xpathSearchResult = "(//h3[normalize-space()='Search result'])[1]";

  xpathProductItemProductCard(productName: string) {
    return `//div[contains(@class,'product-card__name') and normalize-space()='${productName}']//ancestor::div[contains(@class,'product-item')]`;
  }

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async searchProduct(productName: string) {
    await this.genLoc(this.xpathIconSearch).click();
    await this.genLoc(`//input[@type='search']`).fill(productName);
    await this.genLoc(`//input[@type='search']`).press("Enter");
    await this.page.waitForLoadState("networkidle");
  }

  async clickProductCardName(productName: string) {
    await this.page
      .locator(`(//div[contains(@class,'product-card__name')]//*[normalize-space()='${productName}'])[1]`)
      .click();
    await waitForImageLoaded(this.page, "(//div[contains(@class,'media_gallery__container')]//img)[last()]");
  }
}
