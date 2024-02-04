import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";

test.describe("Bulk duplicate campaign success", () => {
  let printbase: PrintBasePage;
  test.beforeEach(async ({ dashboard, conf }) => {
    printbase = new PrintBasePage(dashboard, conf.suiteConf.shop_domain);
    await printbase.navigateToMenu("Campaigns");
    await printbase.searchWithKeyword(conf.caseConf.data_campaign.pricing_info.title);
    await printbase.deleteAllCampaign(conf.suiteConf.password);
  });

  test("@SB_PRB_BDC_13 - Check limit quota campaign khi bulk duplicate trong 1h", async ({ conf }) => {
    const dataCampaign = conf.caseConf.data_campaign;
    const message = conf.caseConf.message;
    await test.step("Tạo 1 campaign dùng để bulk duplicate", async () => {
      await printbase.navigateToMenu("Catalog");
      const campaignId = await printbase.launchCamp(dataCampaign);
      const isAvailable = await printbase.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Verify message limit bulk duplicate theo giờ trong màn bulk duplicate detail", async () => {
      await printbase.searchWithKeyword(dataCampaign.pricing_info.title);
      await printbase.clickBulkDuplicate(dataCampaign.pricing_info.title);
      await printbase.uploadFileOnBulkDuplicate(conf.caseConf.artwork_name);
      await printbase.checkMsgAfterCreated({
        errMsg: message.message_bulk_duplicate,
      });
    });

    await test.step("Xóa 1 artwork > Click btn Launch", async () => {
      await printbase.deleteArtworkOnBulkDuplicate(conf.caseConf.title);
      await printbase.clickOnBtnWithLabel("Launch campaigns");
    });

    await test.step("Verify limit bulk duplicate campaign theo giờ", async () => {
      await printbase.navigateToMenu("Campaigns");
      await printbase.searchWithKeyword(dataCampaign.pricing_info.title);
      await printbase.clickBulkDuplicate(dataCampaign.pricing_info.title);
      await printbase.checkMsgAfterCreated({
        errMsg: message.message_on_popup,
      });
    });
  });

  test("@SB_PRB_BDC_14 - Check limit quota campaign khi bulk duplicate trong 1 day", async ({ conf }) => {
    const dataCampaign = conf.caseConf.data_campaign;
    await test.step("Tạo 1 campaign dùng để bulk duplicate", async () => {
      await printbase.navigateToMenu("Catalog");
      const campaignId = await printbase.launchCamp(dataCampaign);
      const isAvailable = await printbase.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Verify message limit bulk duplicate theo ngày trên popup", async () => {
      await printbase.searchWithKeyword(dataCampaign.pricing_info.title);
      await printbase.clickBulkDuplicate(dataCampaign.pricing_info.title);
      await printbase.checkMsgAfterCreated({
        errMsg: conf.caseConf.message_on_popup,
      });
    });
  });
});
