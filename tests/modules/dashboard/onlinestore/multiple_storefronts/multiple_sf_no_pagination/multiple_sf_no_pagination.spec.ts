import { test } from "@fixtures/website_builder";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { MultipleSF } from "@sf_pages/multiple_storefronts";

test.describe("Verify multiple storefronts", () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test(`@SB_NEWECOM_MSF_MSFL_47 SF list_Check data default ở tab SFs TH có ít SF <= 9 SF, các SF không connect domain và các SF có connect domain nhưng không publish domain đó TH layout = List View`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const multipleSF = new MultipleSF(dashboard);
    await test.step(`Open DB shop 1 > Online store > Storefronts`, async () => {
      await dashboard.goto(`https:${conf.suiteConf.domain}/admin/storefronts`);
      await dashboard.waitForLoadState("networkidle");
      await waitForImageLoaded(dashboard, multipleSF.xpathListSF);
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathStorefrontsScreen,
        snapshotName: conf.caseConf.expect.snapshot_list_view,
      });
    });

    await test.step(`Chuyển sang layout Grid`, async () => {
      await dashboard.locator(multipleSF.btnLayoutGrid).click();
      await waitForImageLoaded(dashboard, multipleSF.xpathListSF);
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathStorefrontsScreen,
        snapshotName: conf.caseConf.expect.snapshot_grid_view,
      });
    });
  });
});
