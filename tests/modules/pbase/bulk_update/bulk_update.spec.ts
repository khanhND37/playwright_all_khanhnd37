import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { loadData } from "@core/conf/conf";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import type { DataDriven, Datum, Dev } from "./bulk_update";
import { SFProduct } from "@sf_pages/product";

test.describe("Bulk update delete custom option PrintBase", async () => {
  test.describe.configure({ mode: "serial" });
  const confData = loadData(__dirname, "DATA_DRIVEN");
  const caseConfData = confData.caseConf as DataDriven;

  for (let i = 0; i < caseConfData.data.length; i++) {
    const caseData = caseConfData.data[i] as Datum;

    test(`@${caseData.case_id} - ${caseData.description}`, async ({ dashboard, conf, context, snapshotFixture }) => {
      test.setTimeout(conf.suiteConf.timeout);
      const suiteConfEnv = conf.suiteConf as Dev;
      const printbase = new PrintBasePage(dashboard, suiteConfEnv.domain);
      const dataCampaign = caseData.data_campaign;
      await test.step("Xóa campaign cũ, tạo campaign mới", async () => {
        await printbase.navigateToMenu("Campaigns");
        await printbase.searchWithKeyword(dataCampaign.pricing_info.title);
        await printbase.deleteAllCampaign(suiteConfEnv.password);
        await printbase.navigateToMenu("Catalog");
        const campaignID = await printbase.launchCamp(dataCampaign);
        const isAvailable = await printbase.checkCampaignStatus(campaignID, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
      });

      await test.step("Filter theo Product title = Text field >> Click Start bulk update >> Update", async () => {
        await printbase.navigateToSubMenu("Campaigns", "Bulk updates");
        await printbase.createBulkUpdate(caseData.bulk_update_info);
        await printbase.startBulkUpdate();
        let isUpdateFinish;
        do {
          await printbase.navigateToSubMenu("Campaigns", "Bulk updates");
          await dashboard.reload();
          await printbase.waitUntilElementInvisible(printbase.xpathLoadingTable);
          await printbase.page.waitForSelector("//div[@class='page-bulk-updates']");
          await printbase.page.waitForSelector("(//table[@class='table table-hover']//tr//td//p)[1]");
          isUpdateFinish = await printbase.page
            .locator("//tbody//tr[1]//span[@data-label='Finished']")
            .isVisible({ timeout: 60000 });
        } while (!isUpdateFinish);
        expect(await printbase.getInfoBulkUpdate()).toEqual(caseData.validate_bulk_update_info);
      });

      await test.step("Check CO1 đã xóa của camp trên dashboard", async () => {
        await printbase.navigateToSubMenu("Campaigns", "All campaigns");
        await printbase.searchWithKeyword(dataCampaign.pricing_info.title);
        await printbase.openCampaignDetail(dataCampaign.pricing_info.title);
        await printbase.clickOnBtnWithLabel("Edit campaign setting");
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
        await printbase.removeLiveChat();
        await printbase.clickBtnExpand();
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbase.xpathListLabelInCO,
          snapshotName: caseData.picture.picture_dashboard,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("Check CO1 đã xóa của camp trên SF", async () => {
        await printbase.clickOnBtnWithLabel("Cancel");
        await printbase.clickOnBtnWithLabel("Leave page");
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbase.openCampaignSF()]);
        const campaignSF = new SFProduct(SFPage, suiteConfEnv.domain);
        await campaignSF.waitForCLipartImagesLoaded();
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: printbase.xpathListCO,
          snapshotName: caseData.picture.picture_sf,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });
    });
  }
});
