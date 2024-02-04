import { expect, test } from "@core/fixtures";
import { HivePBase } from "@pages/hive/hivePBase";
import { loadData } from "@core/conf/conf";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFHome } from "@sf_pages/homepage";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { HiveSizeChart } from "@pages/hive/printbase/size_chart";
import { SFProduct } from "@pages/storefront/product";
import { waitForImageLoaded } from "../../../../src/core/utils/theme";
import { SizeChartPage } from "@pages/dashboard/products/size_chart";

let campaignSF: SFProduct;

test.describe("Feature size chart PBase", () => {
  const confData = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < confData.caseConf.data.length; i++) {
    const caseData = confData.caseConf.data[i];
    test(`@${caseData.case_id} ${caseData.description}`, async ({ hivePBase, conf, snapshotFixture }) => {
      const hivePBasePage = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      await test.step("Input thông tin size chart", async () => {
        await hivePBasePage.goto("/admin/app/pbasesizechart/create");
        await hivePBasePage.createSizeChartPB(caseData.size_chart);
        await snapshotFixture.verify({
          page: hivePBase,
          selector: hivePBasePage.xpathSizeChartDetail,
          snapshotName: caseData.picture,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  test("@SB_PRB_SZC_105 - [PBase] Kiểm tra apply size chart cho base product", async ({
    conf,
    dashboard,
    hivePBase,
    page,
    authRequest,
    snapshotFixture,
  }) => {
    const printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const homePage = new SFHome(page, conf.suiteConf.domain);
    const dataCampaign = conf.caseConf.data_test;
    const sizeChartPage = new HiveSizeChart(hivePBase, conf.suiteConf.hive_pb_domain);
    await test.step("Mở màn hình base product detail > Apply size chart sho base product", async () => {
      await sizeChartPage.goto(`/admin/app/pobproductbase/${conf.caseConf.base_product_id}/edit`);
      await sizeChartPage.applySizeChart(conf.caseConf.size_chart);
      await sizeChartPage.clickOnBtnWithLabel("Update");
    });

    await test.step("Mở màn hình base product detail > Apply size chart sho base product", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(dataCampaign.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.launchCamp(dataCampaign);
      const campaignID = await printbasePage.getIDCampaign(
        authRequest,
        dataCampaign.pricing_info.title,
        conf.suiteConf.domain,
      );
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignID,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step("View campaign ngoài SF > Verify size guide", async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(dataCampaign.pricing_info.title);
      await page.click(printbasePage.xpathSizeGuide);
      await snapshotFixture.verify({
        page: page,
        selector: printbasePage.xpathPopupSizeGuide,
        snapshotName: conf.caseConf.picture,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });

  test(`@SB_PRB_SZC_102 Verify hiển thị đúng size chart trên SF theo từng base product`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const sizeChartPage = new SizeChartPage(dashboard, conf.suiteConf.domain);
    const dataCampaign = conf.caseConf.data_camp;

    await test.step(`1. Vào màn Catalog, select các base: Unisex T-shirt,  Unisex Hoodie, Unisex Tank, Classic Long Sleeve Tee, Beverage Mug, Bedding Set > Click btn Create new campaign2. Add layer cho base product > Sync layer giữa các base > Click btn Continue3. Input title: Campaign test size chart > Click btn Launch`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(dataCampaign.pricing_info.title);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.addBaseProducts(dataCampaign.product_infos);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      await printbasePage.addNewLayers(dataCampaign.layers);
      await printbasePage.clickSyncLayer(conf.caseConf.layer_sync);
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputFieldWithLabel("", "Campaign name", dataCampaign.pricing_info.title, 1);
      const campaignID = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      await printbasePage.waitUntilElementInvisible(printbasePage.xpathIconLoading);

      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignID,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`View product ngoài SF`, async () => {
      await printbasePage.openCampaignDetail(dataCampaign.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await expect(campaignSF.page.locator(printbasePage.xpathSizeGuide)).toBeVisible({ timeout: 20000 });
    });

    await test.step(`- Select style Unisex T-shirt - Click button Size Guide `, async () => {
      await campaignSF.selectValueProduct(conf.caseConf.variant_options);
      await campaignSF.page.click(printbasePage.xpathSizeGuide);
      await snapshotFixture.verify({
        page: campaignSF.page,
        selector: printbasePage.xpathPopupSizeGuide,
        snapshotName: conf.caseConf.picture.first_size_chart,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`- Tại popup Size chart, chọn droplist = Beverage Mug`, async () => {
      await campaignSF.page.selectOption(campaignSF.xpathBaseSizeChart, conf.caseConf.base_size_chart);
      await waitForImageLoaded(campaignSF.page, sizeChartPage.xpathSizeChartImageLoaded);
      await snapshotFixture.verify({
        page: campaignSF.page,
        selector: printbasePage.xpathPopupSizeGuide,
        snapshotName: conf.caseConf.picture.second_size_chart,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });
});
