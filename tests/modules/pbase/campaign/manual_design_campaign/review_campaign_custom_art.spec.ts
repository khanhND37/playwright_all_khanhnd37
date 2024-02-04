import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import { HivePBase } from "@pages/hive/hivePBase";
import { PrintBasePage } from "@pages/dashboard/printbase";

test.describe("Campaign manual design", () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });
  test("@SB_PRB_MC_MDC_24 - [Create manual campaign] Check khi edit campaign manual design", async ({
    dashboard,
    hivePBase,
    conf,
    snapshotFixture,
  }) => {
    const printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
    const picture = conf.caseConf.picture;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const filterCustomArt = conf.caseConf.filter_custom_art;
    const pricingInfo = conf.caseConf.pricing_info;
    const campaignsInfos = conf.caseConf.data_test;
    const customArt = conf.caseConf.custom_art;
    let campaignID;
    await test.step("Tạo campaign custom art", async () => {
      await printbasePage.navigateToMenu("Catalog");
      await dashboard.waitForResponse(
        response =>
          response.url().includes("/admin/pbase-product-base/catalogs.json") ||
          (response.url().includes("/admin/pbase-product-base/shipping-combos.json") && response.status() === 200),
      );
      await printbasePage.launchCamp(campaignsInfos);
      await printbasePage.addListCustomArt(customArt);
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(pricingInfo);
      campaignID = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(
        await dashboard.locator(printbasePage.xpathStatusCampaign(pricingInfo.title, "in review")),
      ).toBeVisible();
    });

    await test.step("Đi tới màn Customer support > Review custom art > Click btn Filter", async () => {
      await hivePbase.goto("/admin/review-custom-art-campaign/list");
      await hivePBase.click(hivePbase.xpathActionFilter);
      await snapshotFixture.verify({
        page: hivePBase,
        selector: hivePbase.xpathListFilters,
        snapshotName: picture.picture_list_filters,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Filter campaign custom art > Verify kết quả filter", async () => {
      await hivePBase.click(hivePbase.xpathActionFilter);
      await hivePBase.click(hivePbase.xpathIconRemoveFilter(7));
      for (let i = 0; i < filterCustomArt.length; i++) {
        if (i === 3) {
          await hivePbase.filterCampaignCustomArt(filterCustomArt[i], campaignID);
          await expect(await hivePBase.locator(hivePbase.getXpathWithLabel(campaignID, 1))).toBeVisible();
        } else {
          await hivePbase.filterCampaignCustomArt(filterCustomArt[i]);
          await expect(await hivePBase.locator(hivePbase.getXpathWithLabel(filterCustomArt[i].value, 1))).toBeVisible();
        }
        await hivePBase.click(hivePbase.xpathActionFilter);
        await hivePbase.clickOnBtnWithLabel("Filter");
        await hivePBase.click(hivePbase.xpathIconRemoveFilter(i + 3));
      }
    });
  });

  test("@SB_PRB_MC_MDC_25 - [Create manual campaign] Check khi edit campaign manual design", async ({
    hivePBase,
    conf,
    snapshotFixture,
  }) => {
    const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const filterCustomArt = conf.caseConf.filter_custom_art;
    await test.step("Đi tới màn Customer support > Review custom art > Click btn Filter", async () => {
      await hivePbase.goto("/admin/review-custom-art-campaign/list");
      await hivePBase.click(hivePbase.xpathIconRemoveFilter(7));
      for (let i = 0; i < filterCustomArt.length; i++) {
        await hivePbase.filterCampaignCustomArt(filterCustomArt[i]);
        await hivePBase.click(hivePbase.xpathActionFilter);
        await hivePbase.clickOnBtnWithLabel("Filter");
      }
      await hivePBase.click(hivePbase.xpathSelectAllCampaign);
    });

    await test.step("Select delete trong Droplist bulk edit", async () => {
      await hivePbase.actionWithCampaignCustomArt("Delete");
      await hivePbase.clickOnBtnWithLabel("Yes, execute");
      await snapshotFixture.verify({
        page: hivePBase,
        selector: hivePbase.xpathResultSearch,
        snapshotName: conf.caseConf.picture,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("@SB_PRB_MC_MDC_27 - [Review Custom Art campaign] Check đổi Status campaign từ In review sang Reject tại màn List review in Hive-pbase", async ({
    dashboard,
    hivePBase,
    conf,
  }) => {
    const printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
    const filterCustomArt = conf.caseConf.filter_custom_art;
    const pricingInfo = conf.caseConf.pricing_info;
    const campaignsInfos = conf.caseConf.data_test;
    const customArt = conf.caseConf.custom_art;
    let campaignID;
    const reject = conf.caseConf.REJECT_CUSTOM_ART;
    await test.step("Tạo campaign custom art", async () => {
      await printbasePage.navigateToMenu("Catalog");
      await dashboard.waitForResponse(
        response =>
          response.url().includes("/admin/pbase-product-base/catalogs.json") ||
          (response.url().includes("/admin/pbase-product-base/shipping-combos.json") && response.status() === 200),
      );
      await printbasePage.launchCamp(campaignsInfos);
      await printbasePage.addListCustomArt(customArt);
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(pricingInfo);
      campaignID = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(
        await dashboard.locator(printbasePage.xpathStatusCampaign(pricingInfo.title, "in review")),
      ).toBeVisible();
      await hivePbase.goto("/admin/review-custom-art-campaign/list");
      await hivePBase.click(hivePbase.xpathIconRemoveFilter(7));
    });

    await test.step("Filter campaign custom art > Verify kết quả filter", async () => {
      await hivePbase.filterCampaignCustomArt(filterCustomArt[0], campaignID);
      await hivePBase.click(hivePbase.xpathActionFilter);
      await hivePbase.clickOnBtnWithLabel("Filter");
    });

    for (let i = 0; i < reject.length; i++) {
      await test.step("Reject campaign custom art", async () => {
        await hivePBase.click(hivePbase.xpathSelectAllCampaign);
        await hivePbase.designRejectCampaignCustomArt("Design reject", reject[i].value);
        await hivePBase.waitForTimeout(3000);
        if (i === 0) {
          await expect(await hivePBase.locator(hivePbase.xpathMessageErrorReject)).toBeVisible();
        } else {
          await expect(await hivePBase.locator(hivePbase.getXpathWithLabel("rejected", 1))).toBeVisible();
          await dashboard.reload();
          await expect(
            await dashboard.locator(printbasePage.xpathStatusCampaign(pricingInfo.title, reject[i].status)),
          ).toBeVisible();
          await dashboard.hover(printbasePage.xpathTooltipCampaign(pricingInfo.title));
          await expect(
            await dashboard.locator(printbasePage.xpathMessageRejectInDashboard(pricingInfo.title, reject[i].value)),
          ).toBeVisible();
        }
      });
    }
  });
});
