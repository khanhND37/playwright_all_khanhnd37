import { defaultSnapshotOptions } from "@constants/visual_compare";
import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { Campaign } from "@pages/storefront/campaign";
import { OcgLogger } from "@core/logger";
import { Mailinator } from "@helper/mailinator";
import { ImportInfo } from "./import_camp_color_disable";
import { getMailinatorInstanceWithProxy } from "@core/utils/mail";

let printbasePage: PrintBasePage;
let SFPage;
let campaignSFPage: Campaign;
let media;
let campaignID;
let status;
let mailinator: Mailinator;
const logger = OcgLogger.get();

test.beforeEach(async ({ conf }, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
  test.setTimeout(conf.suiteConf.timeout);
});

test("@SB_PRB_SCWM_24 [Import campaign csv] Import file csv có Color bị disable/không tồn tại", async ({
  dashboard,
  conf,
  context,
  authRequest,
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
  const campaignDetail = config.campaign_detail;
  const picture = config.picture;
  const campaignInfoSF = config.campaign_sf;
  const importCampStatusInmail = config.import_status_mail;
  const errorContentInmail = config.error_content;
  let scheduleData: ImportInfo;
  const rawDataJson = await scheduler.getData();
  let isCheckFile;
  const fileName = importCampaign.file_name;

  if (rawDataJson) {
    scheduleData = rawDataJson as ImportInfo;
  } else {
    logger.info("Init default object");
    scheduleData = {
      status: "no campaign is importing",
    };
    logger.info("Current scheduled data: ${JSON.stringify(scheduleData)}");
  }

  await test.step("Vào màn hình Campaigns>All campaigns sau đó import file csv có Size bị disable hoặc không tồn tại", async () => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
    const isCheckButton = await printbasePage.page
      .locator("//button[@id='icon-process' or @id='icon-plusbase-process']")
      .isVisible({ timeout: 190000 });
    const xpathStatus = `(//span[normalize-space()='From the CSV file: ${fileName}'])[1]/ancestor::span[@class='s-dropdown-item']//span//span`;
    if (isCheckButton) {
      await printbasePage.clickProgressBar();

      await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
      await printbasePage.page.waitForSelector(
        "(//div[@class='s-dropdown-content']//div[contains(@class,'text-bold text-capitalize')])[1]",
      );
      isCheckFile = await printbasePage.page.locator(xpathStatus).isVisible({ timeout: 60000 });
      await printbasePage.clickProgressBar();
    }
    if (!isCheckButton || !isCheckFile || scheduleData.status == "no campaign is importing") {
      await printbasePage.searchWithKeyword(campaignDetail.campaign_name);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      await printbasePage.importProduct(importCampaign.file_path, printbasePage.xpathImportFile, false, true);
    }
    await printbasePage.clickProgressBar();
    status = await printbasePage.getStatus(importCampaign.file_name);

    if (status !== importInfo.status) {
      scheduleData.status = status;
      await scheduler.setData(scheduleData);
      await scheduler.schedule({ mode: "later", minutes: 15 });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    }

    logger.info("Clear scheduling");
    await scheduler.clear();
    expect(await printbasePage.getStatus(importCampaign.file_name)).toEqual(importInfo.status);
    expect(await printbasePage.getProcess(importCampaign.file_name)).toEqual(importInfo.process);
    await printbasePage.clickProgressBar();
  });

  await test.step("Check gửi mail sau khi import thành công", async () => {
    mailinator = await getMailinatorInstanceWithProxy(page);
    await mailinator.accessMail(conf.suiteConf.email_get_noti);
    await mailinator.readMail(`${conf.suiteConf.shop_name} Product import completed`);
    expect(await mailinator.getImportStatus(importCampStatusInmail)).toEqual(importCampStatusInmail);
    expect(await mailinator.getErrorContent()).toEqual(errorContentInmail);
  });

  await test.step("Mở camp detail > Verify thông tin", async () => {
    media = await printbasePage.waitDisplayMockupDetailCampaign(campaignDetail.campaign_name);
    expect(media).toBeTruthy();
    campaignID = await printbasePage.getCampaignID();
    expect(await printbasePage.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail)).toEqual(
      campaignDetail,
    );
  });

  await test.step("View products sau khi import ra SF", async () => {
    [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
    campaignSFPage = new Campaign(SFPage, conf.suiteConf.domain);
    await campaignSFPage.page.waitForLoadState("networkidle");
    expect(await campaignSFPage.getCampaignTitle()).toEqual(campaignDetail.campaign_name);
    expect(await campaignSFPage.getPrice("Sale price")).toEqual(campaignInfoSF.sale_price);
    expect(await campaignSFPage.getPrice("Compare at price")).toEqual(campaignInfoSF.compare_price);
    await campaignSFPage.waitUntilElementVisible(campaignSFPage.xpathProductMockupSlide);
    const countImageMockup = await campaignSFPage.page.locator(campaignSFPage.xpathProductMockup).count();
    await campaignSFPage.waitResponseWithUrl("/assets/landing.css");

    for (let j = 1; j <= countImageMockup; j++) {
      await campaignSFPage.waitForElementVisibleThenInvisible(
        printbasePage.xpathLoadingMainImage(campaignDetail.campaign_name),
      );
      await snapshotFixture.verify({
        page: campaignSFPage.page,
        selector: campaignSFPage.xpathImageActive,
        snapshotName: `${config.case_id}-${j}-${picture.image}`,
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
});
