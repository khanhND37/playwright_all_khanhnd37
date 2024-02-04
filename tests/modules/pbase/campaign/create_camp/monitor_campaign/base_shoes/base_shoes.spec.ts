import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { SFProduct } from "@sf_pages/product";

test.describe("Create campaign thành cong", () => {
  const confShoes = loadData(__dirname, "DATA_SHOES");
  for (let i = 0; i < confShoes.caseConf.data.length; i++) {
    const caseData = confShoes.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, snapshotFixture, context }) => {
      test.setTimeout(confShoes.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, confShoes.suiteConf.domain);
      const campaignsInfos = caseData.campaign_info;
      const picture = caseData.picture;
      await test.step(
        '1. Vào "Catalog" ' +
          "> Add base product > Add layer cho base product > " +
          'Click btn "Continue" > Input title > Click btn Launch',
        async () => {
          await printbasePage.navigateToMenu("Campaigns");
          await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
          await printbasePage.deleteAllCampaign(confShoes.suiteConf.password);
          await printbasePage.navigateToMenu("Catalog");
          const campainId = await printbasePage.launchCamp(campaignsInfos);
          const isAvailable = await printbasePage.checkCampaignStatus(campainId, ["available"], 30 * 60 * 1000);
          expect(isAvailable).toBeTruthy();
        },
      );

      await test.step("Verify campaign detail", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
        await printbasePage.openCampaignDetail(campaignsInfos.pricing_info.title);
        const result = await printbasePage.waitDisplayMockupDetailCampaign(campaignsInfos.pricing_info.title);
        expect(result).toBeTruthy();
        await dashboard.click(printbasePage.xpathTitleOrganization);
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathSectionImageInDetail,
          snapshotName: picture.image_list,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });
      await test.step("Verify campaign ngoài SF", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        const campaignSF = new SFProduct(SFPage, confShoes.suiteConf.domain);
        await campaignSF.waitResponseWithUrl("/assets/landing.css", 60000);
        await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
        await campaignSF.page.waitForTimeout(5000);
        await campaignSF.waitForImagesMockupLoaded();
        await campaignSF.waitForImagesDescriptionLoaded();

        //compare variant color
        const checkColor = await campaignSF.page.locator(campaignSF.xpathVariantColor).isVisible({ timeout: 30000 });
        if (checkColor) {
          await snapshotFixture.verifyWithAutoRetry({
            page: campaignSF.page,
            selector: campaignSF.xpathVariantColor,
            snapshotName: picture.color,
            sizeCheck: true,
          });
        }

        //compare variant size
        const checkSize = await campaignSF.page.locator(campaignSF.xpathVariantSize).isVisible({ timeout: 30000 });
        if (checkSize) {
          await snapshotFixture.verifyWithAutoRetry({
            page: campaignSF.page,
            selector: campaignSF.xpathVariantSize,
            snapshotName: picture.size,
            sizeCheck: true,
          });
        }

        //compare variant style
        const checkStyle = await campaignSF.page.locator(campaignSF.xpathVariantStyle).isVisible({ timeout: 30000 });
        if (checkStyle) {
          await snapshotFixture.verifyWithAutoRetry({
            page: campaignSF.page,
            selector: campaignSF.xpathVariantStyle,
            snapshotName: picture.style,
            sizeCheck: true,
          });
        }

        // compare description
        await campaignSF.verifyDescriptionCampaign();
        await snapshotFixture.verifyWithAutoRetry({
          page: campaignSF.page,
          selector: campaignSF.xpathProductDescription,
          snapshotName: picture.description,
          sizeCheck: true,
        });

        // compare mockup
        await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
        const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
        for (let i = 0; i < countImageMockup; i++) {
          await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
          await snapshotFixture.verifyWithAutoRetry({
            page: campaignSF.page,
            selector: `${campaignSF.getXpathMainImageOnSF(campaignsInfos.pricing_info.title)}`,
            snapshotName: `${picture.image_sf}-${i + 1}.png`,
            sizeCheck: true,
          });
        }
      });
    });
  }

  const confDuplicateShoes = loadData(__dirname, "DATA_DUPLICATE_SHOES");

  for (let i = 0; i < confDuplicateShoes.caseConf.data.length; i++) {
    const caseData = confDuplicateShoes.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, snapshotFixture, context }) => {
      test.setTimeout(confDuplicateShoes.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, confDuplicateShoes.suiteConf.domain);
      const picture = caseData.picture;
      const campaignOrigin = caseData.campaign_origin;
      const campaignDuplicate = caseData.campaign_duplicate;
      await test.step(
        '1. Vào "Catalog" ' +
          "> Add base product > Add layer cho base product > " +
          'Click btn "Continue" > Input title > Click btn Launch',
        async () => {
          await printbasePage.navigateToMenu("Campaigns");
          await printbasePage.searchWithKeyword(campaignDuplicate.title);
          await printbasePage.deleteAllCampaign(confDuplicateShoes.suiteConf.password);
          await printbasePage.navigateToMenu("Campaigns");
          await printbasePage.searchWithKeyword(campaignOrigin);
          await printbasePage.duplicateCampaign(campaignOrigin, true);
          await printbasePage.clickOnBtnWithLabel("Continue");
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
          const campaignID = printbasePage.getCampaignIdInPricingPage();
          await printbasePage.inputPricingInfo(campaignDuplicate);
          await printbasePage.clickOnBtnWithLabel("Launch");
          const isAvailable = await printbasePage.checkCampaignStatus(campaignID, ["available"], 30 * 60 * 1000);
          expect(isAvailable).toBeTruthy();
        },
      );

      await test.step("Verify campaign detail", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(campaignDuplicate.title);
        await printbasePage.openCampaignDetail(campaignDuplicate.title);
        const result = await printbasePage.waitDisplayMockupDetailCampaign(campaignDuplicate.title);
        expect(result).toBeTruthy();
        await dashboard.click(printbasePage.xpathTitleOrganization);
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathSectionImageInDetail,
          snapshotName: picture.image_list,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });
      await test.step("Verify campaign ngoài SF", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        const campaignSF = new SFProduct(SFPage, confDuplicateShoes.suiteConf.domain);
        await campaignSF.waitResponseWithUrl("/assets/landing.css", 60000);
        await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
        await campaignSF.page.waitForTimeout(5000);
        await campaignSF.waitForImagesMockupLoaded();
        await campaignSF.waitForImagesDescriptionLoaded();

        //compare variant color
        const checkColor = await campaignSF.page.locator(campaignSF.xpathVariantColor).isVisible({ timeout: 30000 });
        if (checkColor) {
          await snapshotFixture.verifyWithAutoRetry({
            page: campaignSF.page,
            selector: campaignSF.xpathVariantColor,
            snapshotName: picture.color,
            sizeCheck: true,
          });
        }

        //compare variant size
        const checkSize = await campaignSF.page.locator(campaignSF.xpathVariantSize).isVisible({ timeout: 30000 });
        if (checkSize) {
          await snapshotFixture.verifyWithAutoRetry({
            page: campaignSF.page,
            selector: campaignSF.xpathVariantSize,
            snapshotName: picture.size,
            sizeCheck: true,
          });
        }

        //compare variant style
        const checkStyle = await campaignSF.page.locator(campaignSF.xpathVariantStyle).isVisible({ timeout: 30000 });
        if (checkStyle) {
          await snapshotFixture.verifyWithAutoRetry({
            page: campaignSF.page,
            selector: campaignSF.xpathVariantStyle,
            snapshotName: picture.style,
            sizeCheck: true,
          });
        }

        // compare description
        await campaignSF.verifyDescriptionCampaign();
        await campaignSF.page.waitForTimeout(5000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: campaignSF.xpathProductDescription,
          snapshotName: picture.description,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
          sizeCheck: true,
        });

        // compare mockup
        await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
        const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
        for (let i = 0; i < countImageMockup; i++) {
          await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
          await snapshotFixture.verifyWithAutoRetry({
            page: campaignSF.page,
            selector: `${campaignSF.getXpathMainImageOnSF(campaignDuplicate.title)}`,
            snapshotName: `${picture.image_sf}-${i + 1}.png`,
            sizeCheck: true,
          });
        }
      });
    });
  }
  const confBulkDuplicate = loadData(__dirname, "DATA_BULK_DUPLICATE_CAMPAIGN");
  for (let i = 0; i < confBulkDuplicate.caseConf.data.length; i++) {
    const caseData = confBulkDuplicate.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ conf, dashboard, snapshotFixture, context }) => {
      test.setTimeout(confBulkDuplicate.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      const campaignOrigin = caseData.campaign_origin;
      const picture = caseData.picture;
      const uploadArtInfor = caseData.upload_infor;
      await test.step('1. Vào Campaigns > Search campaign "Campaign origin ..." > Click vào icon Duplicate > Tick chọn Keep artwork > Click btn Continue > Click btn Launch > Verify launch campaign thành công', async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(caseData.campaign_name);
        await printbasePage.deleteAllCampaign(conf.suiteConf.password);
        await printbasePage.searchWithKeyword(campaignOrigin);
        await printbasePage.clickBulkDuplicate(campaignOrigin);
        await printbasePage.uploadArtworkOnBulkDuplicateScreen(uploadArtInfor);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProgressUpload);
        await printbasePage.clickButtonLaunch();
        await printbasePage.page.reload();
        const campaignId = await printbasePage.getCampaignIdByName(caseData.campaign_name);
        const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
      });

      await test.step("Verify campaign detail", async () => {
        const result = await printbasePage.waitDisplayMockupDetailCampaign(caseData.campaign_name);
        await printbasePage.closeOnboardingPopup();
        expect(result).toBeTruthy();
        await dashboard.click(printbasePage.xpathTitleOrganization);
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathSectionImageInDetail,
          snapshotName: `${caseData.case_id}-${picture.image_list}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("Verify campaign ngoài SF", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await campaignSF.waitResponseWithUrl("/assets/landing.css", 60000);
        await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
        await campaignSF.page.waitForTimeout(5000);
        await campaignSF.waitForImagesMockupLoaded();
        await campaignSF.waitForImagesDescriptionLoaded();

        //compare variant color
        const checkColor = await campaignSF.page.locator(campaignSF.xpathVariantColor).isVisible({ timeout: 30000 });
        if (checkColor) {
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathVariantColor,
            snapshotName: `${caseData.case_id}-${picture.color}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }

        //compare variant size
        const checkSize = await campaignSF.page.locator(campaignSF.xpathVariantSize).isVisible({ timeout: 30000 });
        if (checkSize) {
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathVariantSize,
            snapshotName: `${caseData.case_id}-${picture.size}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }

        //compare variant style
        const checkStyle = await campaignSF.page.locator(campaignSF.xpathVariantStyle).isVisible({ timeout: 30000 });
        if (checkStyle) {
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathVariantStyle,
            snapshotName: `${caseData.case_id}-${picture.style}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }

        // compare mockup
        await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
        const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
        for (let i = 0; i < countImageMockup; i++) {
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: `${campaignSF.getXpathMainImageOnSF(caseData.campaign_name)}`,
            snapshotName: `${caseData.case_id}-${picture.image_sf}-${i + 1}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
          await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
        }

        // compare description
        await campaignSF.verifyDescriptionCampaign(10);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: campaignSF.xpathProductDescription,
          snapshotName: `${caseData.case_id}-${picture.description}.png`,
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
