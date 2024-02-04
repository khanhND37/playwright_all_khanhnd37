import { defaultSnapshotOptions } from "@constants/visual_compare";
import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { Campaign } from "@pages/storefront/campaign";
import { OcgLogger } from "@core/logger";
import { Mailinator } from "@helper/mailinator";
import { ImportInfo } from "./import_camp_publish_true_false";
import { getMailinatorInstanceWithProxy } from "@core/utils/mail";

let printbasePage: PrintBasePage;
let SFPage;
let campaignSFPage: Campaign;
let media;
let campaignID;
let statusTrue;
let statusFalse;
let mailinator: Mailinator;
const logger = OcgLogger.get();

test.describe("Import campaigns csv", async () => {
  test.beforeEach(async ({ conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
  });

  test(`@SB_PRB_SCWM_18 [Import product csv] Import file csv có Publish = TRUE/FALSE`, async ({
    dashboard,
    conf,
    authRequest,
    context,
    scheduler,
    snapshotFixture,
    page,
  }) => {
    //Prodtest không import được camp - fix sau
    if (process.env.ENV == "prodtest") {
      return;
    }
    const config = conf.caseConf;
    const importCampaign = config.import_campaign;
    const importInfo = config.import_info;
    const picture = config.picture;
    const campaignDetail = config.campaign_detail;
    const campaignInfoSF = config.campaign_sf;
    const importCampStatusInmail = config.import_status_mail;
    let isCheckFileTrue, isCheckFileFalse, isCheckButton;

    let scheduleData: ImportInfo;
    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as ImportInfo;
    } else {
      logger.info("Init default object");
      scheduleData = {
        process_true: "",
        status_true: "no campaign is importing",
        process_false: "",
        status_false: "no campaign is importing",
      };
      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
    }

    await test.step(`Vào màn hình products>All products sau đó Import file csv có Publish=TRUE `, async () => {
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);

      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
      isCheckButton = await printbasePage.page
        .locator("//button[@id='icon-process' or @id='icon-plusbase-process']")
        .isVisible({ timeout: 190000 });
      if (isCheckButton) {
        await printbasePage.clickProgressBar();

        await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
        await printbasePage.page.waitForSelector(
          "(//div[@class='s-dropdown-content']//div[contains(@class,'text-bold text-capitalize')])[1]",
        );
        isCheckFileTrue = await printbasePage.getStatus(importCampaign[0].file_name, 2);
        isCheckFileFalse = await printbasePage.getStatus(importCampaign[1].file_name, 1);
        await printbasePage.clickProgressBar();
      }

      await printbasePage.navigateToMenu("Campaigns");
      if (!isCheckButton || scheduleData.status_true == "no campaign is importing" || !isCheckFileTrue) {
        await printbasePage.searchWithKeyword(campaignDetail[0].campaign_name);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
        await printbasePage.deleteAllCampaign(conf.suiteConf.password);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
        await printbasePage.importProduct(importCampaign[0].file_path, printbasePage.xpathImportFile, false, true);
      }
    });

    await test.step(`Vào màn hình products>All products sau đó Import file csv có Publish=FALSE > Check hiển thị process ở popup import`, async () => {
      if (!isCheckFileFalse || !isCheckButton || scheduleData.status_false == "no campaign is importing") {
        await printbasePage.searchWithKeyword(campaignDetail[1].campaign_name);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
        await printbasePage.deleteAllCampaign(conf.suiteConf.password);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
        await printbasePage.importProduct(importCampaign[1].file_path, printbasePage.xpathImportFile, false, true);
      }
      await printbasePage.clickProgressBar();
      statusTrue = await printbasePage.getStatus(importCampaign[0].file_name);
      statusFalse = await printbasePage.getStatus(importCampaign[1].file_name);

      if (statusTrue !== importInfo.status || statusFalse !== importInfo.status) {
        scheduleData.status_true = statusTrue;
        scheduleData.status_false = statusFalse;
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 15 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }

      logger.info("Clear scheduling");
      await scheduler.clear();
      expect(await printbasePage.getStatus(importCampaign[0].file_name)).toEqual(importInfo.status);
      expect(await printbasePage.getProcess(importCampaign[1].file_name)).toEqual(importInfo.process);
      await printbasePage.clickProgressBar();
    });

    await test.step("Check gửi mail sau khi import thành công", async () => {
      mailinator = await getMailinatorInstanceWithProxy(page);
      await mailinator.accessMail(conf.suiteConf.email_get_noti);
      await mailinator.readMail(`${conf.suiteConf.shop_name} Product import completed`);
      expect(await mailinator.getImportStatus(importCampStatusInmail)).toEqual(importCampStatusInmail);
    });

    await test.step(`Check hiển thị ảnh products trong products detail`, async () => {
      await printbasePage.searchWithKeyword(campaignDetail[0].campaign_name);
      //check hien thi anh trong product detail
      media = await printbasePage.waitDisplayMockupDetailCampaign(campaignDetail[0].campaign_name);
      expect(media).toBeTruthy();
      campaignID = await printbasePage.getCampaignID();
      expect(
        await printbasePage.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail[0]),
      ).toEqual(campaignDetail[0]);
    });

    await test.step(`View products sau khi import ra SF`, async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      campaignSFPage = new Campaign(SFPage, conf.suiteConf.domain);
      await campaignSFPage.page.waitForLoadState("networkidle");
      expect(await campaignSFPage.getCampaignTitle()).toEqual(campaignDetail[0].campaign_name);
      expect(await campaignSFPage.getPrice("Sale price")).toEqual(campaignInfoSF.sale_price);
      expect(await campaignSFPage.getPrice("Compare at price")).toEqual(campaignInfoSF.compare_price);
      await campaignSFPage.waitUntilElementVisible(campaignSFPage.xpathProductMockupSlide);
      const countImageMockup = await campaignSFPage.page.locator(campaignSFPage.xpathProductMockup).count();
      await campaignSFPage.waitResponseWithUrl("/assets/landing.css", 500000);

      for (let j = 1; j <= countImageMockup; j++) {
        await campaignSFPage.waitForElementVisibleThenInvisible(
          printbasePage.xpathLoadingMainImage(campaignDetail[0].campaign_name),
        );
        await snapshotFixture.verify({
          page: campaignSFPage.page,
          selector: campaignSFPage.xpathImageActive,
          snapshotName: `SB_PRB_SCWM_18-${j}-${picture.image}`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await campaignSFPage.clickNextImage();
      }

      await campaignSFPage.selectStyle(campaignInfoSF.style);
      await campaignSFPage.selectVariant(campaignInfoSF.variant);
      await campaignSFPage.selectColor(campaignInfoSF.color);
    });

    await test.step("Check gửi mail sau khi import thành công", async () => {
      mailinator = await getMailinatorInstanceWithProxy(page);
      await mailinator.accessMail(conf.suiteConf.email_get_noti);
      await mailinator.readMail(`${conf.suiteConf.shop_name} Product import completed`);
      expect(await mailinator.getImportStatus(importCampStatusInmail)).toEqual(importCampStatusInmail);
    });

    await test.step(`Check hiển thị ảnh products trong products detail`, async () => {
      await printbasePage.navigateToMenu("Catalog");
      media = await printbasePage.waitDisplayMockupDetailCampaign(campaignDetail[1].campaign_name);
      expect(media).toBeTruthy();
      campaignID = await printbasePage.getCampaignID();
      expect(
        await printbasePage.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail[1]),
      ).toEqual(campaignDetail[1]);
    });

    await test.step(`View products sau khi import ra SF > Camp cos pushlish = null thì ko view SF được`, async () => {
      expect(await printbasePage.page.getAttribute(printbasePage.xpathIconViewSF, "style")).toContain("none");
    });
  });
});
