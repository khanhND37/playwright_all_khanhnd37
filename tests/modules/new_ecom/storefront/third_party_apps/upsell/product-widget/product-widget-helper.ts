import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import type { BrowserContext, Locator, Page } from "@playwright/test";
import type { Config, DataSource, SectionDndTemplate, BlockDndTemplate } from "@types";
import { SnapshotFixture } from "@core/fixtures/snapshot-fixture";

export class ProductWidgetHelper {
  conf: Config;
  context: BrowserContext;
  dashboard: Page;
  pageMobile: Page;
  storefront: Page;
  blocks: Blocks;
  webBuilder: WebBuilder;
  snapshotFixture: SnapshotFixture;
  shopDomain: string;

  preCondition;
  preData;
  caseData;
  verify;

  constructor(conf: Config, context: BrowserContext, dashboard: Page, snapshotFixture: SnapshotFixture) {
    this.conf = conf;
    this.context = context;
    this.dashboard = dashboard;
    this.shopDomain = conf.suiteConf.domain;
    this.blocks = new Blocks(dashboard, this.shopDomain);
    this.webBuilder = new WebBuilder(dashboard, this.shopDomain);
    this.snapshotFixture = snapshotFixture;

    this.preCondition = this.conf.suiteConf.pre_condition;
    this.preData = this.conf.suiteConf.pre_data;
    this.caseData = this.conf.caseConf.data;
    this.verify = this.conf.caseConf.data.verify;
  }

  /**
   * Save current preview page and wait till success
   */
  savePage = async () => {
    // wait for data is completely emitted | delay when committing is 125ms
    await this.webBuilder.waitAbit(150);
    await this.webBuilder.clickSave();
  };

  /**
   * Setup first open page on preview
   * @param previewPage target preview page
   * @param hideSections list of section's names in this list will be hidden
   */
  setupStartupPage = async ({
    themeId,
    productId,
    hideLayers = [],
    page = "product",
  }: {
    themeId: number;
    productId: number;
    hideLayers: string[];
    page?: string;
  }) => {
    await this.webBuilder.goto(`/admin/builder/site/${themeId}?page=${page}&id=${productId}&isSbProduct=true`);
    await this.webBuilder.page.waitForLoadState("load");

    if (hideLayers.length > 0) {
      for (let i = hideLayers.length - 1; i >= 0; i--) {
        const layer = hideLayers[i];
        await this.webBuilder.hideOrShowLayerInSidebar({
          sectionName: layer,
          isHide: true,
        });

        hideLayers.splice(i, 1);
      }
      await this.savePage();
    }
  };

  /**
   * Open target page on storefront
   * @param path target page path
   */
  setupVerifyPage = async (path: string, page = this.storefront) => {
    if (!page || page.isClosed()) {
      this.storefront = await this.context.newPage();
      page = this.storefront;
    }

    await page.goto(`https://${this.shopDomain}/${path}`, { waitUntil: "load" });
    await page.locator(this.blocks.progressBar).waitFor({ state: "detached" });
    return page;
  };

  /**
   * Drag and drop new section to preview and setup data source
   * @param section object contain position and data source
   */
  createSection = async (section: SectionDndTemplate) => {
    // create a completely new section and switch to tab Content
    await this.webBuilder.dragAndDropInWebBuilder(section.position_section);
    await this.webBuilder.switchToTab("Content");
    // change section's data source to given product
    await this.webBuilder.selectDropDownDataSource("variable", section.variable as DataSource);
  };

  /**
   * Dnd or insert by add button to creat new block on preview
   * @param block object contain position
   */
  createBlock = async (block: BlockDndTemplate) => {
    if (block.create_action === "insert") {
      await this.webBuilder.insertSectionBlock({
        parentPosition: block.position_section.to.position,
        template: block.position_section.from.template,
      });
    } else {
      await this.webBuilder.dragAndDropInWebBuilder(block.position_section);
    }
  };

  /**
   * Combine of create section and block funcs to setup everything needed
   * @param section object contain position, data source and blocks
   */
  setupSectionAndBlocks = async (section: SectionDndTemplate) => {
    await this.createSection(section);
    if (section.rows && section.rows.length > 0) {
      await this.webBuilder.backToLayerBtn.click();
      await this.webBuilder.expandCollapseLayer({
        sectionName: "Section",
        isExpand: true,
      });
      for (let i = 0; i < section.rows.length; i++) {
        await this.webBuilder.openLayerSettings({
          sectionName: "Section",
          subLayerName: "Row",
          subLayerIndex: i + 1,
        });
        await this.webBuilder.backBtn.click();
      }
    }

    // drag and drop blocks on created section
    for (let i = 0; i < section.blocks.length; i++) {
      const block = section.blocks[i];
      await this.createBlock(block);
    }
  };

  /**
   * Snapshot sidebar by tabs
   * @param tabs list of tabs will be snapshotted
   * @param snapshotIndex index of snapshot when create image snapshot
   * @param snapshotName extra info to specific the image name
   */
  verifySidebar = async ({ tabs = ["Design"], snapshotIndex = 0, snapshotName = "" }) => {
    for (const tab of tabs) {
      await this.webBuilder.switchToTab(tab);
      await this.dashboard.locator("//div[@data-widget-id]").last().waitFor({ state: "visible" });
      // need to wait for all widget fully (clearly) display on sidebar
      await this.webBuilder.waitAbit(500);
      await this.snapshotFixture.verifyWithAutoRetry({
        page: this.dashboard,
        snapshotName: this.snapshotName("sidebar", snapshotIndex, tab, snapshotName),
        selector: this.blocks.sidebar,
      });
    }
  };

  /**
   * Snapshot webfront (preview) by layer
   * @param section contain info of section and block to snap
   * @param layer define which layer will be snapshotted
   * @param snapshotIndex index of snapshot when create image snapshot
   * @param snapshotName extra info to specific the image name
   */
  verifyWebfront = async ({
    section,
    layer = "block",
    snapshotIndex = 0,
    snapshotName = "",
  }: {
    section: SectionDndTemplate;
    layer?: string;
    snapshotIndex?: number;
    snapshotName?: string;
  }) => {
    const sectionIndex = section.position_section.to.position.section;
    const blocks = section.blocks;
    switch (layer) {
      case "block":
        for (let i = 0; i < blocks.length; i++) {
          const blockSelector = this.webBuilder.getSelectorByIndex({ section: sectionIndex, block: i + 1 });
          const blockSnapshotName = this.snapshotName("webfront", snapshotIndex, "block", i, snapshotName);
          await this.verifyWebfrontSelector(blockSelector, blockSnapshotName);
        }
        break;
      case "section": {
        const sectionSelector = this.webBuilder.getSelectorByIndex({ section: sectionIndex });
        const sectionSnapshotName = this.snapshotName("webfront", snapshotIndex, snapshotName);
        await this.verifyWebfrontSelector(sectionSelector, sectionSnapshotName);
        break;
      }
    }
  };

  /**
   * Verify snapshot on webfront
   * @param selector xpath
   * @param snapshotName
   */
  verifyWebfrontSelector = async (selector: string, snapshotName = "") => {
    const frame = this.dashboard.frameLocator(this.webBuilder.iframe);
    await frame.locator(selector).scrollIntoViewIfNeeded();
    await this.snapshotFixture.verifyWithAutoRetry({
      page: this.dashboard,
      snapshotName,
      selector: selector,
      iframe: this.webBuilder.iframe,
    });
  };

  /**
   * Snapshot storefront by layer
   * @param section contain info of section and block to snap
   * @param layer define which layer will be snapshotted
   * @param route open new storefront page with this path
   * @param snapshotIndex index of snapshot when create image snapshot
   * @param snapshotName extra info to specific the image name
   * @param closeAfterDone close the storefront page right before finish function
   * @param clearCartItems clear all cart items before execute any actions
   */
  verifyStorefront = async ({
    section,
    snapshotIndex = 0,
    snapshotName = "",
    route = "",
    layer = "block",
    closeAfterDone = true,
    page = this.storefront,
  }: {
    section: SectionDndTemplate;
    layer?: string;
    route?: string;
    closeAfterDone?: boolean;
    clearCartItems?: boolean;
    snapshotIndex?: number;
    snapshotName?: string;
    page?: Page;
  }) => {
    const sectionIndex = section.position_section.to.position.section;
    const sectionSelector = `${this.blocks.xPathSfnSection}[${sectionIndex}]`;

    page = await this.setupVerifyPage(route, page);
    const blocks = await this.getAllBLocksVisible(section, page);
    switch (layer) {
      case "block":
        for (let i = 0; i < blocks.length; i++) {
          const blockSelector = `(${sectionSelector}//section[@data-block-id])[${i + 1}]`;
          const blockSnapshotName = this.snapshotName("storefront", snapshotIndex, "block", i, snapshotName);
          await this.verifyStorefrontSelector(blockSelector, blockSnapshotName, page);
        }
        break;
      case "section": {
        const sectionSnapshotName = this.snapshotName("storefront", snapshotIndex, snapshotName);
        await this.verifyStorefrontSelector(sectionSelector, sectionSnapshotName, page);
        break;
      }
    }

    // close storefront page after done checking
    if (closeAfterDone && page && !page.isClosed()) {
      await page.close();
    }
  };

  /**
   * Verify snapshot on storefront
   * @param selector xpath
   * @param snapshotName
   * @param page
   */
  verifyStorefrontSelector = async (selector: string, snapshotName = "", page = this.storefront) => {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await this.snapshotFixture.verifyWithAutoRetry({
      page,
      snapshotName,
      selector: selector,
    });
  };

  /**
   * Wait for all block is visible on section and get its locators
   * @param section contain info of section and block to snap
   */
  getAllBLocksVisible = async (section: SectionDndTemplate, page = this.storefront) => {
    const blocks = [] as Locator[];
    const sectionIndex = section.position_section.to.position.section;
    const sectionSelector = `${this.blocks.xPathSfnSection}[${sectionIndex}]`;

    const existingBlocks = section.blocks.filter(block => block.removed !== true);
    for (let i = 0; i < existingBlocks.length; i++) {
      const blockSelector = `(${sectionSelector}//section[@data-block-id])[${i + 1}]`;
      const locator = page.locator(blockSelector).first();
      await locator.waitFor({ state: "visible" });
      await locator.scrollIntoViewIfNeeded();
      blocks.push(locator);
    }
    return blocks;
  };

  /**
   * Remove a section on webfront
   * @param section contain info of section
   */
  removeSection = async (section: SectionDndTemplate) => {
    const sectionIndex = section.position_section.to.position.section;
    await this.clickOnLayer(sectionIndex);
    await this.webBuilder.selectOptionOnQuickBar("Delete");
  };

  clickOnLayer = async (sectionIndex = 1, blockIndex?: number) => {
    let selector = `${this.blocks.xPathWbSection}[${sectionIndex}]`;
    if (blockIndex) {
      selector = `(${selector}//section[@data-block-id])[${blockIndex}]`;
    }

    const locator = this.webBuilder.frameLocator.locator(selector);
    await locator.scrollIntoViewIfNeeded();
    await locator.click({ position: { x: 5, y: 5 } });
  };

  /**
   * Generate snapshot name by test case
   * @param position on sidebar | webfront | storefront
   * @param i index of snapshot
   * @param extra define more info to specific snapshot name, can be any type
   */
  snapshotName = (position: string, i = 0, ...extra) => {
    let env = process.env.ci_ENV ? process.env.ci_ENV : process.env.ENV;
    //Thêm logic chạy cả local
    if (env === "local") {
      env = this.conf.suiteConf.env;
    }
    const name = [this.conf.caseName, position, i, ...extra, env].filter(val => typeof val !== "undefined").join("-");
    return `${name}.png`;
  };

  /**
   * Click on layer on webfront
   * @param sectionIndex
   * @param blockIndex
   */
  clickOnLayerInIframeMobile = async (sectionIndex = 1, blockIndex?: number) => {
    let selector = `${this.blocks.xPathWbSection}[${sectionIndex}]`;
    if (blockIndex) {
      selector = `(${selector}//section[@data-block-id])[${blockIndex}]`;
    }

    const locator = this.webBuilder.frameLocator.locator(selector);
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  };

  /**
   * check Place holder Upsell Widgets
   * @returns
   */
  async checkPlaceholderUpsellWidgets(): Promise<boolean> {
    const xpathProductCart = this.webBuilder.frameLocator.locator(
      "//section[@component='upsell-widget']//div[contains(@class,'product-card__name')]//a",
    );
    const productCart = await xpathProductCart.evaluateAll(list => list.map(element => element.getAttribute("href")));
    return productCart.some(item => item.includes("example-product"));
  }
}
