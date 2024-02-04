import { test } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import { GlobalMarketListPage } from "@pages/dashboard/settings/global-market/global-market-list";
// import { GlobalMarketAddPage } from "@pages/dashboard/settings/global-market/global-market-add";

test.describe("Global markets", async () => {
  let globalMarketListPage: GlobalMarketListPage;
  // let globalMarketAddPage : GlobalMarketAddPage;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    globalMarketListPage = new GlobalMarketListPage(dashboard, conf.suiteConf.domain);
    // globalMarketAddPage =new GlobalMarketAddPage(dashboard,conf.suiteConf.domain);
    await globalMarketListPage.navigateToMenu("Settings");
    await globalMarketListPage.navigateToSectionInSettingPage("Global Markets");
  });

  // eslint-disable-next-line max-len
  // test(`@SB_SET_GM_MC_231 [DB - Desktop - Function] Kiểm tra add thành công market khi chọn các quốc gia, khu vực đang thuộc market khác của shop`, async ({ conf }) => {
  //
  //   await test.step(`Tại màn hình Add market, nhập tên market vào textbox Market name`, async () => {
  //     await globalMarketListPage.clickActionButton("add market");
  //     await globalMarketListPage.inputFieldWithLabel("", "Market name",conf.caseConf.market_name);
  //   });
  //
  // eslint-disable-next-line max-len
  //   await test.step(`Click btn Add countries / regions, chọn khu vực và quốc gia đang thuộc market tồn tại của shop và quốc gia không thuộc market nào, click btn Add`, async () => {
  //     await globalMarketListPage.page.locator(globalMarketAddPage.selector.table.xpathAddCountriesRegion).click();
  //
  //   });
  //
  //   await test.step(`Click btn Confirm trong popup warning`, async () => {
  //     // fill your code here
  //   });
  //
  //   await test.step(`Click button Add Market`, async () => {
  //     // fill your code here
  //   });
  //
  //   await test.step(`Click btn Manage ở Multi-Currency`, async () => {
  //     // fill your code here
  //   });
  //
  //   await test.step(`Click btn Back`, async () => {
  //     // fill your code here
  //   });
  //
  //   await test.step(`Click btn Manage Single-currency`, async () => {
  //     // fill your code here
  //   });
  //
  //   await test.step(`- Click btn Back- Click btn Back để quay về trang Global Markets`, async () => {
  //     // fill your code here
  //   });
  //
  //   await test.step(`Click vào market Eurozone`, async () => {
  //     // fill your code here
  //   });
  //
  //   await test.step(`Click btn Back để quay về màn Global Markets, click vào market Asia`, async () => {
  //     // fill your code here
  //   });
  //
  // });
});
