import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";
import { MultipleSF } from "@sf_pages/multiple_storefronts";
import { expect } from "@playwright/test";

test.describe("Verify multiple storefronts", () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test(`@SB_NEWECOM_MSF_MSFL_48 SF list_Check data default ở SF list TH có nhiều SF > 9 SF, có 1 số SF có connect domain + có publish domain connect  TH layout = List View và Grid view`, async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    const multipleSF = new MultipleSF(dashboard);
    await test.step(`Open DB shop 1 > Online store > Storefronts`, async () => {
      await dashboard.goto(`https:${conf.suiteConf.domain}/admin/storefronts`);
      await dashboard.waitForLoadState("networkidle");
      await waitForImageLoaded(dashboard, multipleSF.xpathListSF);
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathStorefrontsScreen,
        snapshotName: conf.caseConf.expect.snapshot_list_view_page1,
      });
    });

    await test.step(`Click button Create new storefront`, async () => {
      await dashboard.getByRole("button", { name: "Create new storefront", exact: true }).click();
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText("Create new storefront");
    });

    await test.step(`Click button X`, async () => {
      await dashboard.locator(multipleSF.xpathIconClose).click();
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeHidden();
    });

    await test.step(`Click vào ảnh thumbnail SF`, async () => {
      await dashboard.locator(multipleSF.getXpathStorefrontList(1) + multipleSF.xpathThumbnailList).click();
      await multipleSF.waitForElementVisibleThenInvisible(multipleSF.xpathLoadingSFDetail);
      await dashboard.locator(multipleSF.xpathImageThemePublic).first().waitFor({ state: "visible" });
      await waitForImageLoaded(dashboard, multipleSF.xpathListImageThemePublic);
      await snapshotFixture.verify({
        page: dashboard,
        screenshotOptions: { fullPage: true },
        snapshotName: conf.caseConf.expect.storefront_detail,
      });
    });

    await test.step(`Click icon back`, async () => {
      await dashboard.goBack();
    });

    await test.step(`Click name SF`, async () => {
      await dashboard.locator(`${multipleSF.getXpathStorefrontList(1)}${multipleSF.xpathHeading}//h3`).click();
      await multipleSF.waitForElementVisibleThenInvisible(multipleSF.xpathLoadingSFDetail);
      await dashboard.locator(multipleSF.xpathImageThemePublic).first().waitFor({ state: "visible" });
      await waitForImageLoaded(dashboard, multipleSF.xpathListImageThemePublic);
      await snapshotFixture.verify({
        page: dashboard,
        screenshotOptions: { fullPage: true },
        snapshotName: conf.caseConf.expect.storefront_detail,
      });
    });

    await test.step(`Click icon back`, async () => {
      await dashboard.goBack();
    });

    await test.step(`Click domain public`, async () => {
      await verifyRedirectUrl({
        page: dashboard,
        selector: `(${multipleSF.getXpathStorefrontList(2)}//p/a)[2]`,
        context,
        redirectUrl: conf.caseConf.expect.public_domain,
      });
    });

    await test.step(`Click các phân trang`, async () => {
      await dashboard.locator(multipleSF.getXpathPagination(2)).click();
      await dashboard.waitForLoadState("networkidle");
      await multipleSF.waitForElementVisibleThenInvisible(multipleSF.xpathLoadingTable);
      await waitForImageLoaded(dashboard, multipleSF.xpathListSF);
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathStorefrontsScreen,
        snapshotName: conf.caseConf.expect.snapshot_list_view_page2,
      });
      //Chuyển về page 1
      await dashboard.locator(multipleSF.getXpathPagination(1)).click();
    });

    await test.step(`Chuyển sang layout= grid`, async () => {
      await dashboard.locator(multipleSF.btnLayoutGrid).click();
      await multipleSF.waitForElementVisibleThenInvisible(multipleSF.xpathLoadingTable);
      await waitForImageLoaded(dashboard, multipleSF.xpathListSF);
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathStorefrontsScreen,
        snapshotName: conf.caseConf.expect.snapshot_grid_view_page1,
      });

      await dashboard.locator(multipleSF.getXpathPagination(2)).click();
      await multipleSF.waitForElementVisibleThenInvisible(multipleSF.xpathLoadingTable);
      await waitForImageLoaded(dashboard, multipleSF.xpathListSF);
      await snapshotFixture.verify({
        page: dashboard,
        selector: multipleSF.xpathStorefrontsScreen,
        snapshotName: conf.caseConf.expect.snapshot_grid_view_page2,
      });
    });
  });
});
