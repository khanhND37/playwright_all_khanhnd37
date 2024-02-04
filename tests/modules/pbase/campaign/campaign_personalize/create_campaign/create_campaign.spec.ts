import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFProduct } from "@sf_pages/product";
import type { Dev, SbPrbLp5, CreateCampaign, SBPRBLP5CampInfos } from "./create_campaign";

test.describe("Tạo campaign personalize và check thông tin campaigns ngoài SF", () => {
  let printbasePage: PrintBasePage;
  let urlCatalog: string;
  let suiteConf;
  let dataCaseInfo: SbPrbLp5;
  let suiteConfEnv: Dev;
  let campaignInfo: SBPRBLP5CampInfos;
  test.beforeEach(async ({ dashboard, conf, cConf }) => {
    suiteConf = conf.suiteConf as CreateCampaign;
    suiteConfEnv = conf.suiteConf as Dev;
    urlCatalog = suiteConf.url_catalog;
    printbasePage = new PrintBasePage(dashboard, suiteConf.domain);
    dataCaseInfo = cConf as SbPrbLp5;
    campaignInfo = dataCaseInfo.camp_infos;
    // Pre conditions tạo campaign
    test.setTimeout(suiteConf.time_out);
  });

  test("create camp @SB_PRB_LP_4", async ({}) => {
    await test.step("create camp success", async () => {
      await printbasePage.goto(urlCatalog);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
      await printbasePage.launchCamp(campaignInfo);
      expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
    });
  });

  test("create camp SF @SB_PRB_LP_5", async ({}) => {
    await test.step("create camp sucess", async () => {
      // Open second tab and view campaign
      await printbasePage.goto(urlCatalog);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
      await printbasePage.launchCamp(campaignInfo);
      expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
    });
  });

  test("Verify tạo custom option các loại thành công @SB_PRB_LP_4", async ({ context }) => {
    await test.step(`Tạo custom option các loại `, async () => {
      // Open second tab and view campaign
      await printbasePage.navigateToMenu("Campaigns");

      await printbasePage.searchWithKeyword(campaignInfo.pricing_info.title);
      await printbasePage.openCampaignDetail(campaignInfo.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      const campaignSF = new SFProduct(SFPage, suiteConfEnv.domain);
      for (let i = 0; i < campaignInfo.custom_options.length; i++) {
        await expect(campaignSF.xpathPropertyCamp(campaignInfo.custom_options[i].label)).toBeVisible();
      }
      await expect(campaignSF.genLoc(campaignSF.xpathBtnWithLabel("Preview your design"))).toBeVisible();
    });
  });

  test("Verify hiển thị các thông tin của camp personalize ngoài SF @SB_PRB_LP_5", async ({ context }) => {
    await test.step(`View camp detail ngoài Storefont.
       Verify hiển thị các thông tin của camp:  list variants, Sale price, Compare at price,`, async () => {
      // Open second tab and view campaign
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignInfo.pricing_info.title);
      await printbasePage.openCampaignDetail(campaignInfo.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      const campaignSF = new SFProduct(SFPage, suiteConf.domain);
      for (let i = 0; i < dataCaseInfo.variant.length; i++) {
        await expect(campaignSF.xpathVariantCampaign(dataCaseInfo.variant[i])).toBeVisible();

        await expect(campaignSF.xpathSalePriceCampaign(dataCaseInfo.price[i])).toBeVisible();
      }
    });
  });
});
