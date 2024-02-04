import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";
import { type ElementPosition } from "@types";

export class SFWebBuilder extends SBPage {
  sections = this.genLoc("[data-section-id]");
  rows = this.genLoc("[data-row-id]");
  columns = this.genLoc("[data-column-id]");

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Get selector of section/column/block by index in SF
   * @param section
   * @param column
   * @param block
   */
  getSelectorByIndex({ section, column, block }: ElementPosition): string {
    let selector = `//section[contains(@class,'section')][${section}]`;
    if (column) {
      selector = `(${selector}//div[contains(@class,'direction-column') and @data-column-id])[${column}]`;
    }
    if (block) {
      selector = `(${selector}//section[contains(@class,'block-wrapper')])[${block}]`;
    }
    return selector;
  }
}
