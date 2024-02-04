import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { SFProduct } from "@sf_pages/product";
import { loadData } from "@core/conf/conf";

test.describe("Bulk duplicate campaign success", () => {
  let printbase: PrintBasePage;
  let dashboardPage;
  let picture;
  let snapshotOptions;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printbase = new PrintBasePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    await dashboardPage.navigateToMenu("Campaigns");
    picture = conf.caseConf.picture;
    snapshotOptions = conf.suiteConf.snapshot_options;
  });

  test("@SB_PRB_BDC_30 - Check Bulk Duplicate campaign không thành công", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const campaignOrigin = conf.caseConf.campaign_info;
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
      }
    });

    await test.step("Click button [Bulk duplicate] của campaign name > Verify UI màn bulk duplicate", async () => {
      await printbase.clickBulkDuplicate(campaignOrigin.pricing_info.title);
      await printbase.page.waitForLoadState("networkidle");
      await dashboard.waitForTimeout(2000);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathBulkDuplicateScreen,
        snapshotName: conf.caseConf.image,
        snapshotOptions,
      });
    });

    const loadConfigData = conf.caseConf.DATA_UPLOAD_ART_INVALID.data;
    for (let i = 0; i < loadConfigData.length; i++) {
      const caseData = loadConfigData[i];
      const uploadArtInfor = caseData.upload_infor;
      await test.step(`${caseData.step_upload_art}`, async () => {
        await printbase.uploadArtworkOnBulkDuplicateScreen(uploadArtInfor);
        await dashboard.hover(printbase.xpathIconWarning);
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbase.xpathBulkDuplicateScreen,
          snapshotName: caseData.picture.show_message_error,
          snapshotOptions,
        });
      });

      await test.step("Xóa artwork không hợp lệ đã upload", async () => {
        await printbase.hoverThenClickElement(
          printbase.xpathIconWarning,
          printbase.getXpathIconDeleteArtwork(uploadArtInfor.campaign_name, caseData.side),
        );
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbase.xpathBulkDuplicateScreen,
          snapshotName: caseData.picture.show_delete_art,
          snapshotOptions,
        });
      });
    }
  });

  test("@SB_PRB_BDC_34 - Verify bulk duplicate thành công khi edit campaign name và xóa campaign trong màn bulk duplicate", async ({
    dashboard,
    authRequest,
    conf,
    snapshotFixture,
    context,
  }) => {
    const campaignOrigin = conf.caseConf.campaign_info;
    const uploadArtInfor = conf.caseConf.upload_infor;
    await test.step("Precondition: Search Campaign > Delete campaign đã được bulk", async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbase.searchWithKeyword(conf.caseConf.value_edit);
      await printbase.deleteAllCampaign(conf.suiteConf.password);
    });

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
      }
    });

    await test.step("Click button [Bulk duplicate] của campaign > Click button Add campaign > Input value > Click button Add", async () => {
      await printbase.clickBulkDuplicate(campaignOrigin.pricing_info.title);
      await printbase.addCampaignOnBulkDuplicate(conf.caseConf.number_campaign);
      await printbase.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathBulkDuplicateScreen,
        snapshotName: picture.add_campaign,
        snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step("Upload file artwork hợp lệ > Click on icon thùng rác ở cuối dòng của Campaign name", async () => {
      await printbase.uploadArtworkOnBulkDuplicateScreen(uploadArtInfor);
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathProgressUpload);
      await dashboard.click(
        printbase.getXpathIconDeleteCampOnBulkDuplicate(conf.caseConf.delete_campaign, conf.caseConf.index),
      );
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathBulkDuplicateScreen,
        snapshotName: picture.delete_1_campaign,
        snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step("Click on checkbox của các Campaign name > Click button Delete campaign", async () => {
      await printbase.clickCheckboxCampaignOnBulkDuplicate(conf.caseConf.list_campaign);
      await printbase.clickOnBtnWithLabel("Delete selected campaigns");
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathBulkDuplicateScreen,
        snapshotName: picture.delete_more_campaign,
        snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step("Click button edit campaign name> Input value > Click Save", async () => {
      await printbase.editCampaignNameOnBulkDuplicate(conf.caseConf.edit_campaign, conf.caseConf.value_edit);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbase.xpathBulkDuplicateScreen,
        snapshotName: picture.edit_title,
        snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step("Click button Launch campaign > Verify launch campaign thành công > Open campaign detail > Verify thông tin campaign", async () => {
      const campaignDetail = conf.caseConf.campaign_detail;
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

    await test.step("View campaign on SF > Verify thông tin campaign", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbase.openCampaignSF()]);
      const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await campaignSF.waitResponseWithUrl("/assets/landing.css", 50000);
      await campaignSF.waitForImagesMockupLoaded();
      await campaignSF.waitForImagesDescriptionLoaded();

      // compare title campaign
      const productTitleSF = await campaignSF.getProductTitle();
      expect(productTitleSF.toLowerCase()).toEqual(conf.caseConf.value_edit.toLowerCase());

      // compare mockup
      await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
      const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
      for (let i = 0; i < countImageMockup; i++) {
        await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `${campaignSF.getXpathMainImageOnSF(conf.caseConf.value_edit)}`,
          snapshotName: `${conf.caseConf.case_id}sf-image-mockup-sf-${i + 1}.png`,
          snapshotOptions,
        });
      }
    });
  });

  const loadDataMockup = loadData(__dirname, "DATA_DRIVEN_BULK_DUPLICATE_CAMPAIGN");
  for (const caseData of loadDataMockup.caseConf.data) {
    if (caseData.enable) {
      test(`${caseData.description} @${caseData.case_id}`, async ({
        dashboard,
        context,
        conf,
        snapshotFixture,
        authRequest,
      }) => {
        const campaignDetail = caseData.campaign_detail;
        const campaignOrigin = caseData.campaign_info;
        const uploadArtInfor = caseData.upload_infor;
        await test.step("Precondition: Search Campaign > Delete campaign đã được bulk", async () => {
          await dashboardPage.navigateToMenu("Campaigns");
          await printbase.searchWithKeyword(caseData.old_campaign);
          await printbase.deleteAllCampaign(conf.suiteConf.password);
        });

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
          }
        });

        await test.step("Click button [Bulk duplicate] của campaign > Verify UI màn bulk duplicate", async () => {
          await dashboardPage.navigateToMenu("Campaigns");
          await printbase.searchWithKeyword(campaignOrigin.pricing_info.title);
          await printbase.clickBulkDuplicate(campaignOrigin.pricing_info.title);
          await printbase.page.waitForSelector(`//p[normalize-space()='${uploadArtInfor.campaign_name}']`);
          await printbase.closeOnboardingPopup();
          await printbase.removeLiveChat();
          await expect(dashboard.locator(printbase.xpathBtnWithLabel("Launch campaigns"))).toBeDisabled();
          await snapshotFixture.verify({
            page: dashboard,
            selector: printbase.xpathBulkDuplicateScreen,
            snapshotName: caseData.picture.ui_bulk_duplicate,
            snapshotOptions,
          });
        });

        if (caseData.type == "csv") {
          await test.step("Click button Import from csv> upload file csv hợp lệ > Verify upload artwork thành công", async () => {
            await dashboard.click(
              printbase.getXpathIconDeleteCampOnBulkDuplicate(caseData.delete_campaign, caseData.index),
            );
            await printbase.clickOnBtnWithLabel("Import from CSV");
            await printbase.uploadFileCsv(caseData.path_file);
            await printbase.clickOnBtnWithLabel("Create campaign");
            await printbase.waitForElementVisibleThenInvisible(printbase.xpathProgressUpload);
            await snapshotFixture.verify({
              page: dashboard,
              snapshotName: caseData.picture.upload_art_success,
              snapshotOptions,
            });
          });
        } else {
          await test.step("Upload file artwork hợp lệ > Verify upload artwork thành công", async () => {
            await printbase.uploadArtworkOnBulkDuplicateScreen(uploadArtInfor);
            await printbase.waitForElementVisibleThenInvisible(printbase.xpathProgressUpload);
            await expect(dashboard.locator(printbase.xpathBtnWithLabel("Launch campaigns"))).toBeEnabled();
            await snapshotFixture.verify({
              page: dashboard,
              selector: printbase.xpathBulkDuplicateScreen,
              snapshotName: caseData.picture.upload_art_success,
              snapshotOptions,
            });
          });
        }

        await test.step("Click button Launch campaign > Verify launch campaign thành công > Open campaign detail > Verify thông tin campaign", async () => {
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
          expect(
            await printbase.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail),
          ).toEqual(campaignDetail);
        });

        await test.step("View campaign on SF > Verify thông tin campaign", async () => {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbase.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
          await campaignSF.waitResponseWithUrl("/assets/landing.css", 50000);
          await campaignSF.waitForImagesMockupLoaded();
          await campaignSF.waitForImagesDescriptionLoaded();

          // compare title campaign
          const productTitleSF = await campaignSF.getProductTitle();
          expect(productTitleSF.toLowerCase()).toEqual(campaignDetail.campaign_name.toLowerCase());
          await campaignSF.page.waitForTimeout(10000);
          // compare mockup
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
          for (let i = 0; i < countImageMockup; i++) {
            await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
            await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `${campaignSF.getXpathMainImageOnSF(campaignDetail.campaign_name)}`,
              snapshotName: `${caseData.case_id}sf-image-mockup-sf-${i + 1}.png`,
              snapshotOptions,
            });
          }
        });
      });
    }
  }
});
