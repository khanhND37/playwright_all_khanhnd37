import { SBPage } from "@pages/page";
import { Locator, Page } from "@playwright/test";

export class BlocksSF extends SBPage {
  blockSlideshow = this.genLoc("[component=slideshow]");
  currentLayout = this.genLoc("#slideshow [class*=layout]").first();
  slide = this.page.getByRole("tabpanel");

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  hyperlinkText(text: string): Locator {
    return this.genLoc("a[target=_blank]").filter({ hasText: text });
  }

  /**
   * Hàm get locator block Heading dựa theo text và tag name
   * @param text
   * @param tag
   * @returns
   */
  getTextBlockLoc(text: string, tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p"): Locator {
    return this.genLoc("[class*=block-heading], [class*=block-paragraph]").locator(tag).filter({ hasText: text });
  }

  /**
   * Get locator btn của slideshows theo slide
   * @param type
   * @param slide
   * @returns
   */
  getBtnInSlide(type: "primary" | "secondary", slide = 1): Locator {
    const slideIndex = slide - 1;
    return this.page.getByRole("tabpanel").nth(slideIndex).locator(`[class$=btn-${type}]`);
  }

  /**
   * Get locator của các loại content trong slideshow
   * @param type
   * @param slide
   * @returns
   */
  getSlideContent(type: "sub-heading" | "heading" | "description", slide = 1): Locator {
    const slideIndex = slide - 1;
    return this.slide.nth(slideIndex).locator(`[class$="s ${type}"]`);
  }

  getSlideContentColor(slide = 1): Locator {
    const slideIndex = slide - 1;
    return this.slide.nth(slideIndex).locator("[style*=background-color]");
  }

  getSlideContentPosition(slide = 1): Locator {
    const slideIndex = slide - 1;
    return this.slide.nth(slideIndex).locator("[class*=slideshow__content]");
  }
}
