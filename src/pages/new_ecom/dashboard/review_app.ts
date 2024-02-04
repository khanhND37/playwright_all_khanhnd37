import type { ColorStyles, ContentAlertWarning, ImportReview, filterReview, settingReviewRating } from "@types";
import { Page } from "@playwright/test";
import * as path from "path";
import appRoot from "app-root-path";
import { WebBuilder } from "@pages/dashboard/web_builder";

export class ReviewAppPage extends WebBuilder {
  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  alertWarningInactive = this.genLoc("//div[contains(@class,'sb-alert__warning sb-alert')]");
  titleAlertWarning = this.alertWarningInactive.locator("//div[contains(@class,'sb-alert__title')]");
  textAlertWarning = this.alertWarningInactive.locator("//p");
  btnActiveReviewsApp = this.alertWarningInactive.locator("//span[normalize-space()='Activate Reviews App']");
  btnCloseAlertWarning = this.alertWarningInactive.locator("//button[contains(@class,'sb-alert__icon-close')]//span");

  filterRview = "//div[contains(@class,'rv-filter') or contains(@class,'block-review__filter-container')]//span";
  btnLoadMore = "//span[normalize-space()='Load more']";
  reviewCardGrid = "//div[contains(@class,'layout-grid-resize__item')]";
  messBlankReviewCard = "//section[@name='review']//div[normalize-space()='No matching review.']";
  centerRating = ".new-review-overall .block-rating-rv";

  droplistLayout =
    "//div[contains(@class,'w-builder__widget--label')][ .//label[normalize-space()='Layout']]//following-sibling::div//button";
  widgetLayout = "//div[contains(@class, 'w-builder__popover w-builder__widget--layout')]";
  labelLayout = "(//label[normalize-space()='Layout'])[2]";
  blockReview = "//div[@class='block-review']";
  listCardReview = "//div[contains(@class,'review-card is-list')]";
  overviewWidget = "div.new-review-overall";
  itemReviewCard = "//div[contains(@class,'layout-grid-resize__item')]";
  productRating = "//section[@component='product_rating']";
  hoverForDetail = `${this.productRating}//div[contains(@class,'hover-for-details')]`;
  numberOfReview = `(${this.productRating}//div[contains(@class,'block-rating-rv__text')])[1]`;
  blockProductRating = `${this.productRating}//div[contains(@class,'block-rating-rv__main')]`;
  masonryLayout = `${this.blockReview}//div[contains(@class,'layout-grid-resize__container')]`;
  carouselLayout = `${this.blockReview}//div[@class='block-rv-carousel']`;
  listLayout = `(${this.blockReview}//div[contains(@class,'review-card is-list')])[1]`;

  /**
   * get Content Alert Warning
   */
  async getContentAlertWarning(): Promise<ContentAlertWarning> {
    const title = (await this.titleAlertWarning.textContent()).trim();
    const text = (await this.textAlertWarning.textContent()).trim();
    const contentAlertWarning: ContentAlertWarning = {
      title: title,
      text: text,
    };
    return contentAlertWarning;
  }

  /**
   * import Review file CSV
   * @param importReview
   * @param override
   */
  async importReview(importReview: ImportReview, override?: boolean): Promise<void> {
    const btnImport = "//div[@id='page-header']//button[normalize-space()='Import']";
    const btnImportFile = `//div[@class='sb-flex'] [ .//div[normalize-space()='${importReview.type}']]//following-sibling::button`;
    const checkboxOverwrite = "//label [ .//span[contains(text(),'Overwrite')]]//span[@class='s-check']";

    await this.genLoc(btnImport).click();
    if (importReview.type === "CSV file") {
      await this.genLoc(btnImportFile).click();
      if (override) {
        await this.genLoc(checkboxOverwrite).click();
      }
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent("filechooser"),
        await this.page.click("//input[@type='file' and @accept='.csv']"),
      ]);
      await fileChooser.setFiles(path.join(appRoot + importReview.fileName));
      await this.page.waitForLoadState("networkidle");
      await this.genLoc("//div[@class='s-modal-body']//span[normalize-space()='Import']").click();
      await this.clickOnBtnWithLabel("Check now");
      await this.page.waitForResponse(response => response.url().includes("reviews.json") && response.status() === 200);
    }
  }

  /**
   * get Content Filter Review
   */
  async getContentFilterReview(): Promise<filterReview> {
    const filter = (await this.frameLocator.locator(this.filterRview).nth(0).textContent()).trim();
    const perPage = (await this.frameLocator.locator(this.filterRview).nth(1).textContent()).trim();
    const filterReview: filterReview = {
      filter: filter,
      per_page: perPage,
    };
    return filterReview;
  }

  /**
   * filter Review In WB
   * @param filtersReview
   */
  async filterReviewInWB(filtersReview: filterReview): Promise<void> {
    if (filtersReview.filter) {
      await this.frameLocator.locator(this.filterRview).nth(0).click();
      await this.frameLocator
        .locator(`(//div[contains(@class,'rv-select__options')]//div[normalize-space()='${filtersReview.filter}'])[1]`)
        .click();
    } else {
      await this.frameLocator.locator(this.filterRview).nth(1).click();
      await this.frameLocator
        .locator(
          `(//div[contains(@class,'rv-select__options')]//div[normalize-space()='${filtersReview.per_page}'])[1]`,
        )
        .click();
    }
  }

  /**
   * get Content Alert Warning In WB
   */
  async countRatingReviewsCardInWB(index: number): Promise<number> {
    const xpathRatingReviewCard = `(${this.reviewCardGrid})[${index}]//div[contains(@class,'block-rating-rv__star') and @data-rating="1"]`;
    const rating = await this.frameLocator.locator(xpathRatingReviewCard).count();
    return rating;
  }

  /**
   *click Line Rating
   * @param lineRating
   */
  async clickLineRating(lineRating: "1 star" | "2 stars" | "3 stars" | "4 stars" | "5 stars"): Promise<void> {
    await this.frameLocator
      .locator(
        `//div[contains(@class,'items-center review-progress')] [ .//div[normalize-space()='${lineRating}']]//following-sibling::progress`,
      )
      .click();
  }

  /**
   * Setting color in web style/page style
   * @param data
   */
  async settingColorsReviewRating(data: ColorStyles) {
    const presetSelector = `//span[contains(@class,'w-builder__chip')][${data.preset}]`;
    await this.genLoc(presetSelector).click();
    if (data.palette) {
      const colorBarSelector = "//div[contains(@class,'sb-saturation--black-color')]";
      await this.settingPalette(colorBarSelector, data.palette);
    }
    if (typeof data.colorBar !== "undefined") {
      const colorBarSelector = "//div[contains(@class,'sb-hue--horizontal')]";
      await this.editSliderBar(colorBarSelector, data.colorBar);
    }
    if (data.hexText) {
      await this.genLoc("//div[@class='sb-sketch__field--double']//input[@type='text']").fill(data.hexText);
    }
  }

  /**
   *setting Review Rating
   * @param setting
   */
  async settingReviewRating(setting: settingReviewRating): Promise<void> {
    if (setting.icon) {
      await this.page.locator(`//button[contains(@class,'widget-select--selected')]`).click();
      await this.page.locator(`//ul[@class='widget-select__list']//label[normalize-space()='${setting.icon}']`).click();
    }
    if (setting.rating_color) {
      await this.page.locator("//div[@class='w-builder__widget--color']").click();
      await this.settingColorsReviewRating(setting.rating_color);
    }
  }
}
