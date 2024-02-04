import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";

let printbasePage: PrintBasePage;
let statusFirst;
let statusSecond;

test.beforeEach(async ({ conf }, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
  test.setTimeout(conf.suiteConf.timeout);
});
test(`@SB_PRB_SCWM_25 [Import campaign csv] Check checkbox skip import campaign csv`, async ({ dashboard, conf }) => {
  //Prodtest không import được camp - fix sau
  if (process.env.ENV === "prodtest") {
    return;
  }
  const config = conf.caseConf;
  const importCampaign = config.import_campaign;
  const importInfo = config.import_info;
  const campaignName = config.campaign_detail.campaign_name;
  printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);

  await test.step(`1. Vào màn hình products>All products > Click vào btn Import >-Import camp A lần 1> -Import camp A lần 2 có tích vào check box "Skip importing campaigns that there are existing campaigns with the same campaign handle." `, async () => {
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
    await printbasePage.searchWithKeyword(campaignName);
    await printbasePage.deleteAllCampaign(conf.suiteConf.password);
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.importProduct(importCampaign.file_path, printbasePage.xpathImportFile, false, true);
    // wait for import success
    do {
      await printbasePage.page.waitForTimeout(60000);
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.clickProgressBar();
      statusFirst = await printbasePage.getStatus(importCampaign.file_name, 1);
    } while (statusFirst !== importInfo[0].status);

    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.importProduct(importCampaign.file_path, printbasePage.xpathImportFile, true, true);
    // wait for import success
    do {
      await printbasePage.page.waitForTimeout(60000);
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.clickProgressBar();
      statusSecond = await printbasePage.getStatus(importCampaign.file_name, 1);
    } while (statusSecond !== importInfo[1].status);
  });

  await test.step(`Check hiển thị status và process của camp sau khi import lần 1 và lần 2`, async () => {
    expect(await printbasePage.getProcess(importCampaign.file_name, 2)).toEqual(importInfo[0].process);
    expect(await printbasePage.getProcess(importCampaign.file_name, 1)).toEqual(importInfo[1].process);
    await printbasePage.clickProgressBar();

    //Mở camp detail > Verify thông tin handle
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.searchWithKeyword(campaignName);
    const countProduct = await printbasePage.countProductOnProductList();
    expect(countProduct).toEqual(1);
  });

  await test.step(`Clear data: Delete campaign`, async () => {
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.deleteAllCampaign(conf.suiteConf.password);
  });
});
