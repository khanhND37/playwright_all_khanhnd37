import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";
export class PolicyPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  xpathCustomtext(customtext: string): string {
    return `//*[contains(text(), "${customtext}")]`;
  }
}
