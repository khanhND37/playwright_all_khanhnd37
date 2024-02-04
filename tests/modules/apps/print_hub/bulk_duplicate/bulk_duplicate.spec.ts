import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { loadData } from "@core/conf/conf";
import { SFProduct } from "@sf_pages/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { Apps } from "@pages/dashboard/apps";

test.describe("Bulk duplicate campaign success", () => {
  let printbase: PrintBasePage;
  let appPage: Apps;
  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    printbase = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appPage = new Apps(dashboard, conf.suiteConf.domain);
    await printbase.navigateToMenu("Apps");
    await appPage.openApp("Print Hub");
    await printbase.navigateToMenu("Campaigns");
  });

  test("@SB_PRH_BDC_03 - Check Bulk Duplicate campaign không thành công", async ({ dashboard, conf }) => {
    const dataBulkDuplicate = conf.caseConf.data;
    const campaignOrigin = conf.caseConf.campaign_origin;

    await test.step("Pre: Create campaign origin", async () => {
      await printbase.searchWithKeyword(campaignOrigin.pricing_info.title);
      if (
        await dashboard
          .locator(`(//span[normalize-space() = '${campaignOrigin.pricing_info.title}'])[1]`)
          .isVisible({ timeout: 10000 })
      ) {
        return;
      } else {
        await printbase.navigateToMenu("Catalog");
        const campainId = await printbase.launchCamp(campaignOrigin);
        if (!campaignOrigin.is_campaign_draft) {
          const isAvailable = await printbase.checkCampaignStatus(
            campainId,
            ["available", "available with basic images"],
            30 * 60 * 1000,
          );
          expect(isAvailable).toBeTruthy();
        }
      }
    });

    await test.step("Click button [Bulk duplicate] của campaign name > Click button [Upload Files] > Select Image không hợp lệ về định dạng và vùng in", async () => {
      await printbase.navigateToMenu("Apps");
      await appPage.openApp("Print Hub");
      await printbase.navigateToMenu("Campaigns");
      await printbase.searchWithKeyword(campaignOrigin.pricing_info.title);
      for (let i = 0; i < dataBulkDuplicate.length; i++) {
        await printbase.clickBulkDuplicate(campaignOrigin.pricing_info.title);
        await expect(dashboard.locator(printbase.getXpathWithLabel(campaignOrigin.pricing_info.title))).toBeVisible();
        await expect(dashboard.locator(printbase.getXpathWithLabel("Upload Files"))).toBeVisible();
        await printbase.uploadFileOnBulkDuplicate(dataBulkDuplicate[i].artwork_name);
        await expect(dashboard.locator(printbase.getXpathWithLabel(dataBulkDuplicate[i].message))).toBeVisible();
        await expect(dashboard.locator(printbase.getXpathWithLabel(dataBulkDuplicate[i].status))).toBeVisible();
        await expect(dashboard.locator(printbase.xpathBtnWithLabel("Launch campaigns", 1))).toBeDisabled();
        await dashboard.reload();
      }
    });

    await test.step("Xóa artwork không hợp lệ đã upload, upload artwork hợp lệ", async () => {
      await printbase.clickBulkDuplicate(campaignOrigin.pricing_info.title);
      await printbase.uploadFileOnBulkDuplicate(conf.caseConf.artwork_valid);
      await expect(dashboard.locator(printbase.xpathBtnWithLabel("Launch campaigns", 1))).toBeEnabled();
    });
  });

  const confData = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < confData.caseConf.data.length; i++) {
    const caseData = confData.caseConf.data[i];
    const campaignDetail = caseData.campaign_detail;
    test(`@${caseData.case_id} - ${caseData.description}`, async ({
      dashboard,
      conf,
      context,
      snapshotFixture,
      authRequest,
    }) => {
      const campaignOrigin = caseData.campaign_origin;

      await test.step("Pre: Create campaign origin", async () => {
        await printbase.searchWithKeyword(campaignOrigin.pricing_info.title);
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathProductDetailLoading);
        await printbase.page.waitForSelector(
          `(//div[@class = 'product-name'] | //table[@id='all-products']//td[@class='no-product'])[1]`,
        );
        if (
          await dashboard
            .locator(`(//span[normalize-space() = '${campaignOrigin.pricing_info.title}'])[1]`)
            .isVisible({ timeout: 10000 })
        ) {
          return;
        } else {
          await printbase.navigateToMenu("Catalog");
          const campainId = await printbase.launchCamp(campaignOrigin);
          if (!campaignOrigin.is_campaign_draft) {
            const isAvailable = await printbase.checkCampaignStatus(
              campainId,
              ["available", "available with basic images"],
              30 * 60 * 1000,
            );
            expect(isAvailable).toBeTruthy();
          }
          if (campaignOrigin.is_available) {
            await printbase.navigateToMenu("Campaigns");
            await printbase.searchWithKeyword(campaignOrigin.pricing_info.title);
            await dashboard.locator(printbase.xpathSelectProduct(campaignOrigin.pricing_info.title)).click();
            await printbase.selectActionProduct("Make 1 campaign unavailable");
            await printbase.clickOnBtnWithLabel("Make 1 campaign unavailable");
          }
        }
      });

      await test.step("Click button [Bulk duplicate] của campaign > Click button Upload file > select file hợp lệ", async () => {
        await printbase.navigateToMenu("Apps");
        await appPage.openApp("Print Hub");
        await printbase.navigateToMenu("Campaigns");
        await printbase.searchWithKeyword(caseData.title);
        await printbase.deleteAllCampaign(conf.suiteConf.password);
        await printbase.searchWithKeyword(campaignOrigin.pricing_info.title);
        if (caseData.case_id !== "SB_PRB_BDC_11") {
          await printbase.clickBulkDuplicate(campaignOrigin.pricing_info.title);
        } else {
          await printbase.openCampaignDetail(campaignOrigin.pricing_info.title);
          await printbase.clickOnBtnWithLabel("Bulk duplicate");
        }
        if (caseData.case_id === "SB_PRH_BDC_6" || caseData.case_id === "SB_PRH_BDC_7") {
          await printbase.uploadFileOnBulkDuplicate(caseData.artwork_name, caseData.artwork_back);
        } else {
          await printbase.uploadFileOnBulkDuplicate(caseData.artwork_name);
        }
        await expect(dashboard.locator(printbase.xpathBtnWithLabel("Launch campaigns", 1))).toBeEnabled();
      });

      await test.step("Click button Launch campaign > Verify thông tin campaign sau khi bulk duplicate thành công", async () => {
        await printbase.clickButtonLaunch();
        printbase.page.reload();
        const campaignIdLanch = await printbase.getCampaignIdByName(campaignDetail.campaign_name);
        const isAvailable = await printbase.checkCampaignStatus(
          campaignIdLanch,
          ["available", "unavailable"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
        await printbase.navigateToMenu("Campaigns");
        await printbase.searchWithKeyword(campaignDetail.campaign_name);
        await printbase.openCampaignDetail(campaignDetail.campaign_name);
        await dashboard.waitForLoadState("networkidle");
        const campaignID = await printbase.getCampaignID("ShopBase");
        expect(await printbase.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail)).toEqual(
          campaignDetail,
        );
      });

      await test.step("View campaign ngoài SF > Verify artwork", async () => {
        if (caseData.case_id === "SB_PRH_BDC_17") {
          await dashboard.waitForTimeout(3000);
          const handle = await printbase.getTextContent(printbase.xpathUrl);
          await dashboard.goto(handle);
          await expect(dashboard.locator(printbase.xpathNotFound)).toBeVisible();
        } else {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbase.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
          await campaignSF.waitForElementVisibleThenInvisible(
            printbase.xpathLoadingMainImage(campaignDetail.campaign_name),
          );
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: printbase.getXpathMainImageOnSF(campaignDetail.campaign_name),
            snapshotName: caseData.picture.front_side,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
          if (caseData.case_id === "SB_PRH_BDC_6") {
            await campaignSF.hoverThenClickElement(
              printbase.getXpathMainImageOnSF(campaignDetail.campaign_name),
              printbase.xpathBtnWithLabel("Next page", 1),
            );
            await campaignSF.waitForElementVisibleThenInvisible(
              printbase.xpathLoadingMainImage(campaignDetail.campaign_name),
            );
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: printbase.getXpathMainImageOnSF(campaignDetail.campaign_name),
              snapshotName: caseData.picture.back_side,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        }
      });
    });
  }
});
