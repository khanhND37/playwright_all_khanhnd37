import { test } from "@core/fixtures";
import { Page } from "@playwright/test";
import { WbPageCustomizationService } from "@pages/dashboard/wb_page_customization_service";

test.describe("Verify setting duplicate của customization service block", () => {
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

  test(`@SB_WEB_BUILDER_BCRE_BCS_06 - Verify block customization service không duplicate được`, async ({
    snapshotFixture,
  }) => {
    test.slow();
    await test.step(`Click vào block customization service`, async () => {
      await wbCsPage.clickCustomizationServiceBlock();

      // verify quick setting bar ko co icon hidden
      await snapshotFixture.verifyWithIframe({
        page: wbCsPage.page,
        iframe: wbCsPage.iframe,
        selector: wbCsPage.quickSettingsBlock,
        snapshotName: "SB_WEB_BUILDER_BCRE_BCS_06-quicksetting-bar.png",
      });
    });
  });
});

test.describe("Verify setting duplicate của question block", () => {
  let dashboard: Page;
  let wbCsPage: WbPageCustomizationService;

  test.beforeEach(async ({ dashboard: db, conf }) => {
    dashboard = db;
    wbCsPage = new WbPageCustomizationService(dashboard, conf.suiteConf.domain);
    await test.step(`Login vào shop creator, vào web builder, click vào page selector, chọn page "Customization service" trên page selector`, async () => {
      await wbCsPage.openCustomizationServicePage();
    });
  });

  test(`@SB_WEB_BUILDER_BCRE_BSQ_06 - Verify block question không duplicate được`, async ({ snapshotFixture }) => {
    test.slow();
    await test.step(`Click vào block question`, async () => {
      await wbCsPage.clickQuestionBlock();

      // verify quick setting bar ko co icon hidden
      await snapshotFixture.verifyWithIframe({
        page: wbCsPage.page,
        iframe: wbCsPage.iframe,
        selector: wbCsPage.quickSettingsBlock,
        snapshotName: "SB_WEB_BUILDER_BCRE_BSQ_06-quicksetting-bar.png",
      });
    });
  });
});
