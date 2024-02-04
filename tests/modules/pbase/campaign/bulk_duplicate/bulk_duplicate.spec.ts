import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { prepareFile } from "@helper/file";
import { loadData } from "@core/conf/conf";
import { SFProduct } from "@sf_pages/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";

test.describe("Bulk duplicate campaign success", () => {
  let printbase: PrintBasePage;
  const campaignsNeedVerifyAfter = {};
  // Info use for hive pbase page
  test.beforeEach(async ({ dashboard, conf }) => {
    printbase = new PrintBasePage(dashboard, conf.suiteConf.domain);
    test.setTimeout(conf.suiteConf.timeout);
    await printbase.navigateToMenu("Campaigns");
  });

  test.beforeAll(async ({ conf }) => {
    if (conf.caseConf.artwork_file) {
      await prepareFile(`/files/${conf.caseConf.artwork_file}`, `./data/shopbase/${conf.caseConf.artwork_file}`);
    }
  });

  test("@SB_PRB_BDC_03 - Check Bulk Duplicate campaign không thành công", async ({ dashboard, conf }) => {
    const dataBulkDuplicate = conf.caseConf.data;
    await test.step("Click button [Bulk duplicate] của campaign > Click button [Upload Files] > Select Image không hợp lệ", async () => {
      const campaignOrigin = conf.caseConf.campaign_info;
      await printbase.searchWithKeyword(campaignOrigin.pricing_info.title);
      const isCampaignVisible = await dashboard
        .locator(`(//*[normalize-space() = '${campaignOrigin.pricing_info.title}'])[1]`)
        .isVisible({ timeout: 10000 });
      if (!isCampaignVisible) {
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
        await printbase.page.reload();
        await printbase.page.waitForLoadState("networkidle");
      }
      await printbase.clickBulkDuplicate(conf.caseConf.campaign_name);
      await expect(dashboard.locator(printbase.getXpathWithLabel(conf.caseConf.campaign_name))).toBeVisible();
      await expect(dashboard.locator(printbase.getXpathWithLabel("Upload Files"))).toBeVisible();
      for (let i = 0; i < dataBulkDuplicate.length; i++) {
        await printbase.uploadFileOnBulkDuplicate(dataBulkDuplicate[i].artwork_name);
        await expect(dashboard.locator(printbase.getXpathWithLabel(dataBulkDuplicate[i].message))).toBeVisible();
        await expect(dashboard.locator(printbase.getXpathWithLabel(dataBulkDuplicate[i].status))).toBeVisible();
        await expect(dashboard.locator(printbase.xpathBtnWithLabel("Launch campaigns", 1))).toBeDisabled();
        await dashboard.reload();
      }
    });

    await test.step("Select Image <=80MB", async () => {
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
      await test.step("Click button [Bulk duplicate] của campaign > Click button Upload file > select file hợp lệ", async () => {
        const campaignOrigin = caseData.campaign_info;
        await printbase.searchWithKeyword(caseData.title);
        await printbase.deleteAllCampaign(conf.suiteConf.password);
        await printbase.searchWithKeyword(caseData.campaign_name);
        await printbase.waitForElementVisibleThenInvisible(printbase.xpathProductDetailLoading);
        await printbase.page.waitForSelector(
          `(//div[@class = 'product-name'] | //table[@id='all-products']//td[@class='no-product'])[1]`,
        );
        const isCampaignVisible = await dashboard
          .locator(`(//*[normalize-space() = '${campaignOrigin.pricing_info.title}'])[1]`)
          .isVisible({ timeout: 10000 });
        if (!isCampaignVisible) {
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
          await printbase.page.reload();
          await printbase.page.waitForLoadState("networkidle");
        }

        if (caseData.case_id !== "SB_PRB_BDC_11") {
          await printbase.clickBulkDuplicate(caseData.campaign_name);
        } else {
          await printbase.openCampaignDetail(caseData.campaign_name);
          await printbase.clickOnBtnWithLabel("Bulk duplicate");
        }
        if (caseData.case_id === "SB_PRB_BDC_16") {
          await printbase.checkMsgAfterCreated({
            errMsg: caseData.message,
          });
        }
        if (caseData.case_id === "SB_PRB_BDC_06" || caseData.case_id === "SB_PRB_BDC_07") {
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
        await printbase.waitUntilElementVisible(printbase.xpathTitleProductDetail);
        const campaignID = await printbase.getCampaignID();
        expect(await printbase.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail)).toEqual(
          campaignDetail,
        );
      });

      await test.step("View campaign ngoài SF > Verify artwork", async () => {
        if (caseData.case_id === "SB_PRB_BDC_17") {
          const handle = await printbase.getTextContent(printbase.xpathUrl);
          await dashboard.goto(handle);
          await printbase.waitUntilElementVisible(printbase.xpathNotFound);
        } else {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbase.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
          await campaignSF.waitResponseWithUrl("/assets/landing.css", 500000);
          await campaignSF.waitForImagesMockupLoaded();
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
          if (caseData.case_id === "SB_PRB_BDC_06") {
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

  test("Verify tạo camp mới thành công khi bulk duplicate với file đã tưng được bulkduplicate @SB_PRB_BDC_9", async ({
    authRequest,
    dashboard,
    conf,
  }) => {
    test.setTimeout(conf.caseConf.timeout);

    await test.step("Click button [Bulk duplicate] của campaign > Click button Upload file > select file hợp lệ ", async () => {
      const campaignOrigin = conf.suiteConf.campaign_info;
      await printbase.searchWithKeyword(conf.caseConf.campaign_name);
      const isCampaignVisible = await dashboard
        .locator(`(//*[normalize-space() = '${campaignOrigin.pricing_info.title}'])[1]`)
        .isVisible({ timeout: 10000 });
      if (!isCampaignVisible) {
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
        await printbase.page.reload();
        await printbase.page.waitForLoadState("networkidle");
      }
      await printbase.clickBulkDuplicate(conf.caseConf.campaign_name);
      await printbase.uploadFileOnBulkDuplicate(conf.caseConf.artworks_data[0].artwork_front);
      await printbase.uploadFileForSide(conf.caseConf.side_name, conf.caseConf.artworks_data[0].artwork_back);
      await dashboard
        .locator(`//tbody//input[@class='s-input__inner' and @id='id-0']`)
        .fill(`${conf.caseConf.artworks_data[0].campaign_duplicated}`);
      await printbase.addNewLineUploadArtwork(conf.caseConf.artworks_data);
      await dashboard.waitForTimeout(30000);
      dashboard
        .locator(
          `//tbody//tr//td[contains(@class, 'hcenter')][child::span[child::i[contains(@class, 'mdi-check-circle')]]]`,
        )
        .count()
        .then(count => {
          expect(count).toBeGreaterThanOrEqual(conf.caseConf.artworks_data.length);
        });
    });

    await test.step("Click button Launch campaign >Verify thông tin campaign sau khi bulk duplicate thành công", async () => {
      await printbase.clickButtonLaunch();
      const campaignsLaunching = await printbase.getInfoCampaignsLaunching(authRequest);
      campaignsLaunching.map(item => {
        conf.caseConf.artworks_data.map(artwork => {
          if (item.campaign_title.includes(artwork.campaign_duplicated)) {
            campaignsNeedVerifyAfter[item.campaign_id] = { ...conf.caseConf.campaign_detail };
          }
        });
      });
      expect(campaignsLaunching.length).toBeGreaterThanOrEqual(1);
    });
  });

  test("Verify bulk duplicate thành công khi user upload artwork manually cho campaign @SB_PRB_BDC_10", async ({
    dashboard,
    authRequest,
    conf,
  }) => {
    test.setTimeout(conf.caseConf.timeout);
    await test.step("Hover and click button [Bulk duplicate] của campaign > Click button Upload file > select file hợp lệ ", async () => {
      const campaignOrigin = conf.suiteConf.campaign_info;
      await printbase.searchWithKeyword(conf.caseConf.campaign_name);
      const isCampaignVisible = await dashboard
        .locator(`(//*[normalize-space() = '${campaignOrigin.pricing_info.title}'])[1]`)
        .isVisible({ timeout: 10000 });
      if (!isCampaignVisible) {
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
        await printbase.page.reload();
        await printbase.page.waitForLoadState("networkidle");
      }
      await printbase.clickBulkDuplicate(conf.caseConf.campaign_name);
      await printbase.uploadFileOnBulkDuplicate(conf.caseConf.artworks_data[0].artwork_front);
      await printbase.uploadFileForSide(conf.caseConf.side_name, conf.caseConf.artworks_data[0].artwork_back);
      await dashboard
        .locator(`//tbody//input[@class='s-input__inner' and @id='id-0']`)
        .fill(`${conf.caseConf.artworks_data[0].campaign_duplicated}`);
      await printbase.addNewLineUploadArtwork(conf.caseConf.artworks_data);
      await dashboard.waitForTimeout(30000);
      dashboard
        .locator(
          `//tbody//tr//td[contains(@class, 'hcenter')][child::span[child::i[contains(@class, 'mdi-check-circle')]]]`,
        )
        .count()
        .then(count => {
          expect(count).toBeGreaterThanOrEqual(conf.caseConf.artworks_data.length);
        });
    });

    await test.step("Click button Launch campaign", async () => {
      await printbase.clickButtonLaunch();
      const campaignsLaunching = await printbase.getInfoCampaignsLaunching(authRequest);
      campaignsLaunching.map(item => {
        conf.caseConf.artworks_data.map(artwork => {
          if (item.campaign_title.includes(artwork.campaign_duplicated)) {
            campaignsNeedVerifyAfter[item.campaign_id] = { ...conf.caseConf.campaign_detail };
          }
        });
      });
      expect(campaignsLaunching.length).toBeGreaterThanOrEqual(1);
    });
  });
});
