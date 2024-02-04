import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Campaign } from "@pages/storefront/campaign";
import { ProductPage } from "@pages/dashboard/products";

test.describe("Import campaign without mockup", () => {
  let printbasePage;
  let dashboardPage;
  let importCampaign;
  let campaignDetail;
  let productPage;
  let campaignInfoSF;
  let beforeNumberCampaign;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    importCampaign = conf.caseConf.import_campaign;
    campaignDetail = conf.caseConf.campaign_detail;
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    campaignInfoSF = conf.caseConf.campaign_sf;
  });

  test(`Import file csv đúng format @TC_PB_PRB_MC_1`, async ({ dashboard, conf, authRequest, context }) => {
    test.setTimeout(90000);
    beforeNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);

    await test.step(`Vào màn hình Campaigns>All campaigns sau đó import campaign bằng file csv`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await expect(printbasePage.genLoc("//button[normalize-space() = 'Import']")).toBeEnabled();
      await productPage.importProduct(importCampaign.file_path, `//input[@type='file' and @accept='.zip, .csv']`);
      await dashboard.reload();
      await expect(printbasePage.genLoc("#icon-process")).toBeEnabled();
    });

    await test.step(`Check hiển thị process import`, async () => {
      await printbasePage.genLoc("//button[@id = 'icon-process']").dblclick();
      await dashboard.reload();
      expect(
        await printbasePage.getProcessImportInfo(authRequest, conf.suiteConf.domain, importCampaign.file_name),
      ).toEqual([importCampaign.inserted_campaign, importCampaign.total_campaign, importCampaign.skip_campaign]);
    });

    await test.step(`Check hiển thị số lượng campaigns import và thông tin campaign detail`, async () => {
      const afterNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);
      expect(afterNumberCampaign - beforeNumberCampaign).toEqual(importCampaign.total_campaign);
      await printbasePage.searchWithKeyword(campaignDetail.campaign_name);
      await printbasePage.openCampaignDetail(campaignDetail.campaign_name);
      await dashboard.waitForLoadState("networkidle");
      const campaignID = await printbasePage.getCampaignID();
      expect(
        await printbasePage.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail),
      ).toEqual(campaignDetail);
    });

    await test.step(`View campaigns sau khi import ra SF`, async () => {
      // Open second tab
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      await SFPage.waitForLoadState("networkidle");
      const campaignSFPage = new Campaign(SFPage, conf.suiteConf.domain);
      expect(await campaignSFPage.getCampaignTitle()).toEqual(campaignDetail.campaign_name);
      expect(await campaignSFPage.getPrice("Sale price")).toEqual(campaignInfoSF.sale_price);
      expect(await campaignSFPage.getPrice("Compare at price")).toEqual(campaignInfoSF.compare_price);
      await campaignSFPage.selectVariant(campaignInfoSF.variant);
      await campaignSFPage.selectColor(campaignInfoSF.color);
      for (let i = 1; i <= campaignInfoSF.image_verify; i++) {
        await campaignSFPage.clickNextImageWaitAPI();
        expect(await campaignSFPage.getImageOfCampaign()).toMatchSnapshot(`imageSF-TC_PB_PRB_MC_1-${i}}.png`, {
          maxDiffPixelRatio: 0.05,
        });
      }
    });

    await test.step(`Check gửi mail sau khi import thành công`, async () => {
      //TODO update later
      // eslint-disable-next-line max-len
      //https://trello.com/c/KtxYqHJr/13119-s71-05-automation-for-update-confirms-sending-mail-to-the-owner-of-the-shop-when-importing-file-csv
    });
  });

  test(`Import file csv 1 campaign có nhiều base product @TC_PB_PRB_MC_2`, async ({
    dashboard,
    conf,
    authRequest,
    context,
  }) => {
    beforeNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);

    await test.step(`Vào màn hình Campaigns>All campaigns sau đó import campaign bằng file csv`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await expect(printbasePage.genLoc("//button[normalize-space() = 'Import']")).toBeEnabled();
      await productPage.importProduct(importCampaign.file_path, `//input[@type='file' and @accept='.zip, .csv']`);
      await dashboard.reload();
      await expect(printbasePage.genLoc("#icon-process")).toBeEnabled();
    });

    await test.step(`Check hiển thị process ở popup import`, async () => {
      await printbasePage.genLoc("//button[@id = 'icon-process']").dblclick();
      await dashboard.reload();
      expect(
        await printbasePage.getProcessImportInfo(authRequest, conf.suiteConf.domain, importCampaign.file_name),
      ).toEqual([importCampaign.inserted_campaign, importCampaign.total_campaign, importCampaign.skip_campaign]);
    });

    await test.step(`Check hiển thị số lượng campaigns import và thông tin campaign detail`, async () => {
      const afterNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);
      expect(afterNumberCampaign - beforeNumberCampaign).toEqual(importCampaign.total_campaign);
      await printbasePage.searchWithKeyword(campaignDetail.campaign_name);
      await printbasePage.openCampaignDetail(campaignDetail.campaign_name);
      await dashboard.waitForLoadState("networkidle");
      const campaignID = await printbasePage.getCampaignID();
      expect(
        await printbasePage.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail),
      ).toEqual(campaignDetail);
    });

    await test.step(`View campaigns sau khi import ra SF`, async () => {
      // Open second tab
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      await SFPage.waitForLoadState("networkidle");
      const campaignSFPage = new Campaign(SFPage, conf.suiteConf.domain);
      expect(await campaignSFPage.getCampaignTitle()).toEqual(campaignDetail.campaign_name);
      expect(await campaignSFPage.getPrice("Sale price")).toEqual(campaignInfoSF.sale_price);
      expect(await campaignSFPage.getPrice("Compare at price")).toEqual(campaignInfoSF.compare_price);
      await campaignSFPage.selectVariant(campaignInfoSF.variant);
      await campaignSFPage.selectColor(campaignInfoSF.color);
      for (let i = 1; i <= campaignInfoSF.image_verify; i++) {
        await campaignSFPage.clickNextImageWaitAPI();
        expect(await campaignSFPage.getImageOfCampaign()).toMatchSnapshot(`imageSF-TC_PB_PRB_MC_1-${i}}.png`, {
          maxDiffPixelRatio: 0.05,
        });
      }
    });

    await test.step(`Check gửi mail sau khi import thành công`, async () => {
      //TODO update later
      // eslint-disable-next-line max-len
      //https://trello.com/c/KtxYqHJr/13119-s71-05-automation-for-update-confirms-sending-mail-to-the-owner-of-the-shop-when-importing-file-csv
    });
  });

  test(`Import file csv <= 20MB @TC_PB_PRB_MC_3`, async ({ dashboard, conf, authRequest, context }) => {
    beforeNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);

    await test.step(`Vào màn hình Campaigns>All campaigns sau đó import campaign bằng file csv`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await expect(printbasePage.genLoc("//button[normalize-space() = 'Import']")).toBeEnabled();
      await productPage.importProduct(importCampaign.file_path, `//input[@type='file' and @accept='.zip, .csv']`);
      await dashboard.reload();
      await expect(printbasePage.genLoc("#icon-process")).toBeEnabled();
    });

    await test.step(`Check hiển thị process ở popup import`, async () => {
      await printbasePage.genLoc("//button[@id = 'icon-process']").dblclick();
      await dashboard.reload();
      expect(
        await printbasePage.getProcessImportInfo(authRequest, conf.suiteConf.domain, importCampaign.file_name),
      ).toEqual([importCampaign.inserted_campaign, importCampaign.total_campaign, importCampaign.skip_campaign]);
    });

    await test.step(`Check hiển thị số lượng campaigns import và thông tin campaign detail`, async () => {
      const afterNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);
      expect(afterNumberCampaign - beforeNumberCampaign).toEqual(importCampaign.total_campaign);
      await printbasePage.searchWithKeyword(campaignDetail.campaign_name);
      await printbasePage.openCampaignDetail(campaignDetail.campaign_name);
      await dashboard.waitForLoadState("networkidle");
      const campaignID = await printbasePage.getCampaignID();
      expect(
        await printbasePage.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail),
      ).toEqual(campaignDetail);
    });

    await test.step(`View campaigns sau khi import ra SF`, async () => {
      // Open second tab
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      await SFPage.waitForLoadState("networkidle");
      const campaignSFPage = new Campaign(SFPage, conf.suiteConf.domain);
      expect(await campaignSFPage.getCampaignTitle()).toEqual(campaignDetail.campaign_name);
      expect(await campaignSFPage.getPrice("Sale price")).toEqual(campaignInfoSF.sale_price);
      expect(await campaignSFPage.getPrice("Compare at price")).toEqual(campaignInfoSF.compare_price);
      await campaignSFPage.selectVariant(campaignInfoSF.variant);
      for (let i = 1; i <= campaignInfoSF.image_verify; i++) {
        await campaignSFPage.clickNextImageWaitAPI();
        expect(await campaignSFPage.getImageOfCampaign()).toMatchSnapshot(`imageSF-TC_PB_PRB_MC_3-${i}}.png`, {
          maxDiffPixelRatio: 0.05,
        });
      }
    });

    await test.step(`Check gửi mail sau khi import thành công`, async () => {
      //TODO update later
      // eslint-disable-next-line max-len
      //https://trello.com/c/KtxYqHJr/13119-s71-05-automation-for-update-confirms-sending-mail-to-the-owner-of-the-shop-when-importing-file-csv
    });
  });

  test(`Import file csv có 1 product và số lượng media/variant > 500 @TC_PB_PRB_MC_10`, async ({
    dashboard,
    authRequest,
    conf,
  }) => {
    beforeNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);

    await test.step(`Vào màn hình Campaigns>All campaigns sau đó import campaign bằng file csv`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await productPage.clickOnBtnWithLabel("Import");
      await productPage.chooseFileCSV(importCampaign.file_path, `//input[@type='file' and @accept='.zip, .csv']`);
      await productPage.clickOnBtnWithLabel("Upload File");
      await productPage.checkMsgAfterCreated({ errMsg: importCampaign.err_msg });
    });

    await test.step(`Click vào btn Cancel`, async () => {
      await printbasePage.clickCancelPopUp();
      await expect(dashboard.locator("//h2[normalize-space() = 'Campaigns']")).toBeEnabled();
      const afterNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);
      expect(afterNumberCampaign - beforeNumberCampaign).toEqual(importCampaign.total_campaign);
    });
  });

  test(`Import file csv có nhiều products có 1 product có số lượng media/variant>500 @TC_PB_PRB_MC_11`, async ({
    dashboard,
    conf,
    authRequest,
    context,
  }) => {
    beforeNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);

    await test.step(`Vào màn hình Campaigns>All campaigns, sau đó import file csv`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await productPage.importProduct(importCampaign.file_path, `//input[@type='file' and @accept='.zip, .csv']`);
      expect(
        await printbasePage.getProcessImportInfo(authRequest, conf.suiteConf.domain, campaignDetail.file_name),
      ).toEqual([importCampaign.inserted_campaign, importCampaign.total_campaign, importCampaign.skip_campaign]);
    });

    await test.step(`Check hiển thị process ở popup import`, async () => {
      await printbasePage.genLoc("//button[@id = 'icon-process']").dblclick();
      await dashboard.reload();
      expect(
        await printbasePage.getProcessImportInfo(authRequest, conf.suiteConf.domain, importCampaign.file_name),
      ).toEqual([importCampaign.inserted_campaign, importCampaign.total_campaign, importCampaign.skip_campaign]);
    });

    await test.step(`Check hiển thị số lượng campaigns import và thông tin campaign detail`, async () => {
      const afterNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);
      expect(afterNumberCampaign - beforeNumberCampaign).toEqual(importCampaign.total_campaign);
      await printbasePage.searchWithKeyword(campaignDetail.campaign_name);
      await printbasePage.openCampaignDetail(campaignDetail.campaign_name);
      await dashboard.waitForLoadState("networkidle");
      const campaignID = await printbasePage.getCampaignID();
      expect(
        await printbasePage.getCampaignInfo(authRequest, conf.suiteConf.domain, campaignID, campaignDetail),
      ).toEqual(campaignDetail);
    });

    await test.step(`View campaigns sau khi import ra SF`, async () => {
      // Open second tab
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      await SFPage.waitForLoadState("networkidle");
      const campaignSFPage = new Campaign(SFPage, conf.suiteConf.domain);
      expect(await campaignSFPage.getCampaignTitle()).toEqual(campaignDetail.campaign_name);
      expect(await campaignSFPage.getPrice("Sale price")).toEqual(campaignInfoSF.sale_price);
      expect(await campaignSFPage.getPrice("Compare at price")).toEqual(campaignInfoSF.compare_price);
      await campaignSFPage.selectVariant(campaignInfoSF.variant);
      for (let i = 1; i <= campaignInfoSF.image_verify; i++) {
        await campaignSFPage.clickNextImageWaitAPI();
        expect(await campaignSFPage.getImageOfCampaign()).toMatchSnapshot(`imageSF-TC_PB_PRB_MC_11-${i}}.png`, {
          maxDiffPixelRatio: 0.05,
        });
      }
    });

    await test.step(`Check gửi mail sau khi import thành công`, async () => {
      //TODO update later
      // eslint-disable-next-line max-len
      //https://trello.com/c/KtxYqHJr/13119-s71-05-automation-for-update-confirms-sending-mail-to-the-owner-of-the-shop-when-importing-file-csv
    });
  });

  test(`Import file csv có handle = null @TC_PB_PRB_MC_13`, async ({ dashboard, conf, authRequest }) => {
    beforeNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);

    await test.step(`Vào màn hình Campaigns>All campaigns sau đó import campaign bằng file csv`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await productPage.clickOnBtnWithLabel("Import");
      await productPage.chooseFileCSV(importCampaign.file_path, `//input[@type='file' and @accept='.zip, .csv']`);
      await productPage.clickOnBtnWithLabel("Upload File");
      await productPage.checkMsgAfterCreated({ errMsg: importCampaign.err_msg });
    });

    await test.step(`Click vào btn Cancel`, async () => {
      await printbasePage.clickCancelPopUp();
      await expect(dashboard.locator("//h2[normalize-space() = 'Campaigns']")).toBeEnabled();
      const afterNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);
      expect(afterNumberCampaign - beforeNumberCampaign).toEqual(importCampaign.total_campaign);
    });
  });

  test(`Import file csv có title = null @TC_PB_PRB_MC_14`, async ({ dashboard, conf, authRequest }) => {
    beforeNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);

    await test.step(`Vào màn hình Campaigns>All campaigns sau đó import campaign bằng file csv`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await productPage.clickOnBtnWithLabel("Import");
      await productPage.chooseFileCSV(importCampaign.file_path, `//input[@type='file' and @accept='.zip, .csv']`);
      await productPage.clickOnBtnWithLabel("Upload File");
      await productPage.checkMsgAfterCreated({ errMsg: importCampaign.err_msg });
    });

    await test.step(`Click vào btn Cancel`, async () => {
      await printbasePage.clickCancelPopUp();
      await expect(dashboard.locator("//h2[normalize-space() = 'Campaigns']")).toBeEnabled();
      const afterNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);
      expect(afterNumberCampaign - beforeNumberCampaign).toEqual(importCampaign.total_campaign);
    });
  });

  test(`Import file csv có Base product title = null @TC_PB_PRB_MC_15`, async ({ dashboard, conf, authRequest }) => {
    beforeNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);

    await test.step(`Vào màn hình Campaigns>All campaigns sau đó click vào btn Import`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await productPage.clickOnBtnWithLabel("Import");
      await productPage.chooseFileCSV(importCampaign.file_path, `//input[@type='file' and @accept='.zip, .csv']`);
      await productPage.clickOnBtnWithLabel("Upload File");
      await productPage.checkMsgAfterCreated({ errMsg: importCampaign.err_msg });
    });

    await test.step(`Click vào btn Cancel`, async () => {
      await printbasePage.clickCancelPopUp();
      await expect(dashboard.locator("//h2[normalize-space() = 'Campaigns']")).toBeEnabled();
      const afterNumberCampaign = await printbasePage.getTotalCampaign(authRequest, conf.suiteConf.domain);
      expect(afterNumberCampaign - beforeNumberCampaign).toEqual(importCampaign.total_campaign);
    });
  });
});
