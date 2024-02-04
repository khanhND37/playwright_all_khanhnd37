import { Page } from "@playwright/test";
import { GlobalMarketListPage } from "@pages/dashboard/settings/global-market/global-market-list";

export class GlobalMarketDomainPage extends GlobalMarketListPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
}
