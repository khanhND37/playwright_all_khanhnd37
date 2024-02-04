import { DashboardPage } from "@pages/dashboard/dashboard";
import { Page } from "@playwright/test";

export class WbCollectionDetail extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathCD = {
    widgetSideBar: {
      xpathSidebar: ".w-builder__main .w-builder__sidebar-content",
      xpathSpacing: '//label[contains(text(), "Spacing")]',
      selectorBackButton: ".w-builder__tab-heading .sb-icon",
      xpathAllProductsSearchResult:
        "//div[contains(@class, 'sb-text-body-medium') and contains(text(), 'All product')]",
    },
    iframeWB: {
      blockComponent: '[component="product_list"]',
    },
  };
}
