import { defaultSnapshotOptions } from "@constants/visual_compare";
import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { Campaign } from "@pages/storefront/campaign";
import { MailBox } from "@pages/thirdparty/mailbox";

let printbasePage: PrintBasePage;
let SFPage;
let campaignSFPage: Campaign;
let media;
let campaignID;
let status;
let mailBox: MailBox;

test.beforeEach(async ({ conf }, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
  test.setTimeout(conf.suiteConf.timeout);
});

test(`@SB_PRB_SCWM_03 [Import campaign] Import file 1 product có nhiều base`, async ({
  dashboard,
  conf,
  context,
  authRequest,
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
  const fileName = importCampaign.file_name;
  printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
  mailBox = new MailBox(page, conf.suiteConf.domain);

  await test.step("Vào màn hình products>All products > Click vào btn Import>Click vào btn Choose file để upload file csv từ local>Click btn Upload file > Load lại trang. Check hiển thị process ở popup import", async () => {
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.searchWithKeyword(campaignDetail.campaign_name);
    await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
    await printbasePage.deleteAllCampaign(conf.suiteConf.password);
    await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
    await printbasePage.importProduct(importCampaign.file_path, printbasePage.xpathImportFile, false, true);

    // wait for import success
    do {
      await printbasePage.page.waitForTimeout(60000);
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.clickProgressBar();
      status = await printbasePage.getStatus(importCampaign.file_name);
    } while (status !== importInfo.status);
    expect(await printbasePage.getStatus(fileName)).toEqual(importInfo.status);
    expect(await printbasePage.getProcess(fileName)).toEqual(importInfo.process);
    await printbasePage.clickProgressBar();
  });

  await test.step("Check gửi mail sau khi import thành công", async () => {
    // dev bị gioi han gui mail
    if (process.env.CI_ENV === "dev") {
      return;
    }
    await mailBox.openMailDetailWithAPI(
      conf.suiteConf.email_get_noti,
      `${conf.suiteConf.shop_name} Product import completed`,
    );
    expect(await mailBox.getImportStatus(importCampStatusInmail)).toEqual(importCampStatusInmail);
  });

  await test.step(`Mở camp detail > Verify thông tin`, async () => {
    media = await printbasePage.waitDisplayMockupDetailCampaign(campaignDetail.campaign_name);
    expect(media).toBeTruthy();
    campaignID = await printbasePage.getCampaignID();
    expect(await printbasePage.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail)).toEqual(
      campaignDetail,
    );
  });

  await test.step(`View products sau khi import ra SF`, async () => {
    [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
    campaignSFPage = new Campaign(SFPage, conf.suiteConf.domain);
    await campaignSFPage.waitResponseWithUrl("/assets/landing.css", 500000);
    await campaignSFPage.page.waitForLoadState("networkidle");

    expect(await campaignSFPage.getCampaignTitle()).toEqual(campaignDetail.campaign_name);
    expect(await campaignSFPage.getPrice("Sale price")).toEqual(campaignInfoSF.sale_price);
    expect(await campaignSFPage.getPrice("Compare at price")).toEqual(campaignInfoSF.compare_price);
    let checkImageMockupError;
    do {
      await campaignSFPage.page.waitForSelector(campaignSFPage.xpathProductMockupSlide);
      await campaignSFPage.waitForImagesMockupLoaded();
      await campaignSFPage.waitForImagesDescriptionLoaded();
      checkImageMockupError = await campaignSFPage.page
        .locator(campaignSFPage.xpathImageMockupError)
        .isVisible({ timeout: 90000 });
      await campaignSFPage.page.reload();
    } while (checkImageMockupError);

    const countImageMockup = await campaignSFPage.page.locator(campaignSFPage.xpathProductMockup).count();

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
