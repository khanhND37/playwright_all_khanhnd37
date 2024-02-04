import { test } from "@fixtures/odoo";
import { expect } from "@core/fixtures";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { SFProduct } from "@pages/storefront/product";
import { WbBlockEtaPage } from "@pages/dashboard/wb_block_eta";

let webPageStyle: WebPageStyle;
let blockPage: Blocks;
let domain: string;
let pageSf: Page;
let sfProduct: SFProduct;
let wbBlockEtaPage: WbBlockEtaPage;

test.describe("Check module block estimated delivery @SB_NEWECOM_ETA", () => {
  test.beforeAll(async ({ conf, browser }) => {
    domain = conf.suiteConf.domain;
    const context = await browser.newContext();
    pageSf = await context.newPage();
  });

  test.beforeEach(async ({ dashboard }) => {
    wbBlockEtaPage = new WbBlockEtaPage(dashboard, domain);
    webPageStyle = new WebPageStyle(dashboard, domain);
    blockPage = new Blocks(dashboard, domain);
  });

  test("@SB_NEWECOM_ETA_09 Verify hiển thị data Estimated delivery đối với product có start date và end date cùng 1 ngày", async ({
    conf,
  }) => {
    await test.step("View product ngoài sale page có eta Start date và end date cùng ngày", async () => {
      await pageSf.bringToFront();
      sfProduct = new SFProduct(pageSf, conf.suiteConf.domain);
      await sfProduct.gotoProductDetail(conf.suiteConf.products.same_day_product_handle);
      expect(await sfProduct.compareEtaDateFromBlock("same_day")).toBeTruthy();
    });

    await test.step("View product ngoài sale page có eta Start date và end date khác tháng", async () => {
      await pageSf.bringToFront();
      sfProduct = new SFProduct(pageSf, conf.suiteConf.domain);
      await sfProduct.gotoProductDetail(conf.suiteConf.products.diffrent_month_product_handle);
      expect(await sfProduct.compareEtaDateFromBlock("diffrent_month")).toBeTruthy();
    });
  });

  test("@SB_NEWECOM_ETA_03 Verify edit styles Icon của block Estimated delivery", async ({
    context,
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Thay đổi stytes icon của block ", async () => {
      await dashboard.bringToFront();
      await webPageStyle.openWebBuilder({
        type: "ecom product custom",
        id: conf.suiteConf.web_builder.page_id,
        productId: conf.suiteConf.web_builder.product_id,
      });
      const digitalSelector = wbBlockEtaPage.getSelectorByIndex({ section: 1, row: 1, column: 1, block: 1 });
      const designSettings = conf.caseConf.design_settings;

      await wbBlockEtaPage.clickSectionOnPage(digitalSelector);
      await wbBlockEtaPage.clickElementWithLabel("div", "Design");
      await wbBlockEtaPage.handleFormEta(dashboard, designSettings);
      await blockPage.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: "All changes are saved",
          snapshotName: conf.caseConf.screen_shot,
          onlyClickSave: true,
        },
        snapshotFixture,
      );
    });

    await test.step("Click Preview on new tab", async () => {
      const defaultDesignSettings = conf.suiteConf.default_design_settings;
      const [etaPage] = await Promise.all([wbBlockEtaPage.page, await wbBlockEtaPage.clickBtnNavigationBar("preview")]);
      await etaPage.waitForLoadState();
      await etaPage.bringToFront();
      await snapshotFixture.verify({
        page: etaPage,
        selector: conf.caseConf.selector,
        snapshotName: conf.caseConf.screen_shot,
        snapshotOptions: { maxDiffPixelRatio: 0.2 },
      });
      await wbBlockEtaPage.handleFormEta(dashboard, defaultDesignSettings);
      await blockPage.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: "All changes are saved",
          snapshotName: conf.caseConf.screen_shot,
          onlyClickSave: true,
        },
        snapshotFixture,
      );
    });
  });
});
