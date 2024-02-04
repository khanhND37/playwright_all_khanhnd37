import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import type { BrowserContext, Page } from "@playwright/test";
import type { Config } from "@types";

export class PostPurchaseHelper {
  conf: Config;
  context: BrowserContext;
  dashboard: Page;
  pageMobile: Page;
  storefront: Page;
  blocks: Blocks;
  webBuilder: WebBuilder;
  shopDomain: string;

  preCondition;
  preData;
  caseData;
  verify;

  constructor(conf: Config, context: BrowserContext, dashboard: Page) {
    this.conf = conf;
    this.context = context;
    this.dashboard = dashboard;
    this.shopDomain = conf.suiteConf.domain;
    this.blocks = new Blocks(dashboard, this.shopDomain);
    this.webBuilder = new WebBuilder(dashboard, this.shopDomain);

    this.preCondition = this.conf.suiteConf.pre_condition;
    this.preData = this.conf.suiteConf.pre_data;
    this.caseData = this.conf.caseConf.data;
    this.verify = this.conf.caseConf.data.verify;
  }

  /**
   * Open target page on storefront
   * @param path target page path
   */
  setupVerifyPage = async (path: string, page = this.storefront) => {
    if (!page || page.isClosed()) {
      this.storefront = await this.context.newPage();
      page = this.storefront;
    }

    await page.goto(`https://${this.conf.suiteConf.shop_name}.${this.conf.suiteConf.domain_tail}/${path}`, {
      waitUntil: "networkidle",
    });
    await page.locator(this.blocks.progressBar).waitFor({ state: "detached" });
    return page;
  };
}
