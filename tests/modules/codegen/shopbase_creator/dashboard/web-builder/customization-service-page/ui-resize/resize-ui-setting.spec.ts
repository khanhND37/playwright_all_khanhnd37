import { expect, test } from "@core/fixtures";
import { Page } from "@playwright/test";
import { WbPageCustomizationService } from "@pages/dashboard/wb_page_customization_service";

test.describe("Verify setting resize của customization service block", () => {
  let dashboard: Page;
  let wbCsPage: WbPageCustomizationService;
  test.beforeEach(async ({ dashboard: db, conf }) => {
    dashboard = db;
    wbCsPage = new WbPageCustomizationService(dashboard, conf.suiteConf.domain);
    await test.step(`Login vào shop creator, vào web builder, click vào page selector, chọn page "Customization service" trên page selector`, async () => {
      await wbCsPage.openCustomizationServicePage();
      await wbCsPage.clickCustomizationServiceBlock();
    });
  });

  test(`@SB_WEB_BUILDER_BCRE_BCS_03 - Verify block customization service không resize height được`, async ({}) => {
    test.slow();
    await test.step(`Click vào block customization service`, async () => {
      await wbCsPage.clickCustomizationServiceBlock();

      // verify element resizer xuất hiện
      await expect(wbCsPage.frameLocator.locator(wbCsPage.xpathResizerLeft)).toBeVisible();
      await expect(wbCsPage.frameLocator.locator(wbCsPage.xpathResizerRight)).toBeVisible();
    });
  });
});

test.describe("Verify setting resize của question block", () => {
  let dashboard: Page;
  let wbCsPage: WbPageCustomizationService;

  test.beforeEach(async ({ dashboard: db, conf }) => {
    dashboard = db;
    wbCsPage = new WbPageCustomizationService(dashboard, conf.suiteConf.domain);
    await test.step(`Login vào shop creator, vào web builder, click vào page selector, chọn page "Customization service" trên page selector`, async () => {
      await wbCsPage.openCustomizationServicePage();
    });
  });

  test(`@SB_WEB_BUILDER_BCRE_BSQ_03 - Verify block question không duplicate được`, async ({}) => {
    test.slow();
    await test.step(`Click vào block question`, async () => {
      await wbCsPage.clickQuestionBlock();

      // verify element resizer xuất hiện
      await expect(wbCsPage.frameLocator.locator(wbCsPage.xpathResizerLeft)).toBeVisible();
      await expect(wbCsPage.frameLocator.locator(wbCsPage.xpathResizerRight)).toBeVisible();
    });
  });
});
