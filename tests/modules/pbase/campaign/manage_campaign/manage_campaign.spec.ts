import { test } from "@fixtures/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import type { Dev, SbPrbMc2 } from "./manage_campaign";
import { expect } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import type { CampaignInfo, ManageCampaign, SbPrbMc1, SbPrbMc6 } from "./manage_campaign";
import { SFProduct } from "@sf_pages/product";
import { SFHome } from "@sf_pages/homepage";

test.describe("Verify manage campaign", async () => {
  let printbasePage: PrintBasePage;
  let maxDiffPixelRatio, threshold, maxDiffPixels, snapshotName;
  let campaignId;
  let sfProduct: SFProduct;
  let homePage: SFHome;
  let campaignsInfos: CampaignInfo;
  let suiteConf;
  let suiteConfEnv;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    suiteConf = conf.suiteConf as ManageCampaign;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    maxDiffPixelRatio = suiteConf.max_diff_pixel_ratio;
    threshold = suiteConf.threshold;
    maxDiffPixels = suiteConf.max_diff_pixels;
    suiteConfEnv = conf.suiteConf as Dev;
    printbasePage = new PrintBasePage(dashboard, suiteConfEnv.domain);
  });

  test("@SB_PRB_MC_2 - Make campaign available", async ({ dashboard, cConf, page, snapshotFixture }) => {
    const caseConf = cConf as SbPrbMc2;
    homePage = new SFHome(page, suiteConfEnv.domain);
    sfProduct = new SFProduct(page, suiteConfEnv.domain);
    snapshotName = caseConf.snapshot_name;
    campaignsInfos = caseConf.campaign_info;
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
    await printbasePage.deleteAllCampaign(suiteConfEnv.password);
    await printbasePage.navigateToMenu("Catalog");
    campaignId = await printbasePage.launchCamp(campaignsInfos);
    const isAvailable = await printbasePage.checkCampaignStatus(
      campaignId,
      ["available", "available with basic images"],
      30 * 60 * 1000,
    );
    expect(isAvailable).toBeTruthy();

    await test.step("Select campaign > make campaign unavailable tại màn Campaign list", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      const actionUnavailableCampaign = caseConf.action_campaign_unavailable;
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await dashboard.locator(printbasePage.xpathSelectProduct(campaignsInfos.pricing_info.title)).click();
      await printbasePage.selectActionProduct(actionUnavailableCampaign);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathPopupActionAvailable,
        snapshotName: snapshotName.popup_unavailable,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      await printbasePage.clickOnBtnWithLabel(actionUnavailableCampaign);
    });

    await test.step("Verify status campaign tại màn Campaign list", async () => {
      await expect(
        dashboard.locator(printbasePage.xpathStatusCampaignInListCampaign(campaignsInfos.pricing_info.title)),
      ).toHaveText(caseConf.status_unavailable);
    });

    await test.step("Mở trong all product của shop trên storefront", async () => {
      await homePage.gotoHomePage();
      await sfProduct.goto("/collections/all");
      await sfProduct.page.waitForSelector(sfProduct.xpathTitleCollectionDetail, { timeout: 5000 });
      await sfProduct.page.waitForTimeout(2000);
      await expect(
        await sfProduct.page
          .locator(sfProduct.xpathProductOnCollectionPage(campaignsInfos.pricing_info.title))
          .isVisible({ timeout: 5000 }),
      ).toBe(false);
    });

    await test.step("Mở trang search campaign storefront", async () => {
      await homePage.gotoHomePage();
      await sfProduct.goto("/search");
      await homePage.searchProduct(campaignsInfos.pricing_info.title);
      await expect(
        await page
          .locator(sfProduct.xpathProductOnCollectionPage(campaignsInfos.pricing_info.title))
          .isVisible({ timeout: 5000 }),
      ).toBe(false);
    });

    await test.step("Select campaign > make campaign available tại màn Campaign list", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      const actionAvailableCampaign = caseConf.action_campaign_available;
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await dashboard.locator(printbasePage.xpathSelectProduct(campaignsInfos.pricing_info.title)).click();
      await printbasePage.selectActionProduct(actionAvailableCampaign);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathPopupActionAvailable,
        snapshotName: snapshotName.popup_available,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      await printbasePage.clickOnBtnWithLabel(actionAvailableCampaign);
    });

    await test.step("Verify status campaign tại màn Campaign list", async () => {
      await expect(
        dashboard.locator(printbasePage.xpathStatusCampaignInListCampaign(campaignsInfos.pricing_info.title)),
      ).toContainText(caseConf.status_available);
    });

    await test.step("Mở trang product detail của product trên storefront", async () => {
      await homePage.gotoHomePage();
      await sfProduct.goto("/search");
      await homePage.searchProduct(campaignsInfos.pricing_info.title);
      await expect(
        await page
          .locator(sfProduct.xpathProductOnCollectionPage(campaignsInfos.pricing_info.title))
          .isVisible({ timeout: 5000 }),
      ).toBe(true);
    });

    await test.step("Mở trong all product của shop trên storefront", async () => {
      await sfProduct.goto("/collections/all");
      await sfProduct.page.waitForSelector(sfProduct.xpathTitleCollectionDetail, { timeout: 5000 });
      await sfProduct.page.waitForTimeout(2000);
      await expect(
        await sfProduct.page
          .locator(sfProduct.xpathProductOnCollectionPage(campaignsInfos.pricing_info.title))
          .isVisible({ timeout: 5000 }),
      ).toBe(true);
    });
  });

  test("@SB_PRB_MC_1 - Search campaign", async ({ cConf }) => {
    const caseConf = cConf as SbPrbMc1;
    const campaignList = caseConf.data;
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.searchWithKeyword(caseConf.campaign_delete);
    await printbasePage.deleteAllCampaign(suiteConfEnv.password);
    const campaignIds = [];

    for (let i = 0; i < campaignList.length; i++) {
      campaignsInfos = campaignList[i].campaign_info;
      await printbasePage.navigateToMenu("Catalog");
      campaignId = await printbasePage.launchCamp(campaignsInfos);
      campaignIds.push(campaignId);
    }

    for (let i = 0; i < campaignIds.length; i++) {
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignIds[i],
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    }

    for (let i = 0; i < caseConf.campaign_search.length; i++) {
      await test.step("Input Campaign name > nhấn [enter] > Kiểm tra product search", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(caseConf.campaign_search[i].campaign_search);
        await expect(await printbasePage.countProductOnProductList()).toBe(caseConf.campaign_search[i].total_product);
      });
    }
  });

  test("@SB_PRB_MC_6 - Delete campaign", async ({ dashboard, cConf, page, snapshotFixture }) => {
    const caseConf = cConf as SbPrbMc6;
    homePage = new SFHome(page, suiteConfEnv.domain);
    sfProduct = new SFProduct(page, suiteConfEnv.domain);
    snapshotName = caseConf.snapshot_name;
    campaignsInfos = caseConf.campaign_info;
    let actionDeleteCampaign;
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
    await printbasePage.deleteAllCampaign(suiteConfEnv.password);
    await printbasePage.navigateToMenu("Catalog");
    campaignId = await printbasePage.launchCamp(campaignsInfos);
    const isAvailable = await printbasePage.checkCampaignStatus(
      campaignId,
      ["available", "available with basic images"],
      30 * 60 * 1000,
    );
    expect(isAvailable).toBeTruthy();

    await test.step("Click on checkbox của camp > Click buttn [Action] > Select [Delete selected campaigns]", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      actionDeleteCampaign = caseConf.action_delete_available;
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await dashboard.locator(printbasePage.xpathSelectProduct(campaignsInfos.pricing_info.title)).click();
      await printbasePage.selectActionProduct(actionDeleteCampaign);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathPopupActionAvailable,
        snapshotName: snapshotName.popup_delete,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click [Cancel] ở popup", async () => {
      await printbasePage.clickOnBtnWithLabel("Cancel");
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await expect(await printbasePage.countProductOnProductList()).toBe(1);
    });

    await test.step("Click button [Delete] ở popup", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await dashboard.locator(printbasePage.xpathSelectProduct(campaignsInfos.pricing_info.title)).click();
      await printbasePage.selectActionProduct(actionDeleteCampaign);
      await printbasePage.clickOnBtnWithLabel("Delete");
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await expect(await printbasePage.countProductOnProductList()).toBe(0);
    });

    await test.step("Mở trang product detail của product trên storefront", async () => {
      await homePage.gotoHomePage();
      await sfProduct.goto("/search");
      await homePage.searchProduct(campaignsInfos.pricing_info.title);
      await expect(
        await page
          .locator(sfProduct.xpathProductOnCollectionPage(campaignsInfos.pricing_info.title))
          .isVisible({ timeout: 5000 }),
      ).toBe(false);
    });

    await test.step("Mở trong all product của shop trên storefront", async () => {
      await sfProduct.goto("/collections/all");
      await sfProduct.page.waitForSelector(sfProduct.xpathTitleCollectionDetail, { timeout: 5000 });
      await sfProduct.page.waitForTimeout(2000);
      await expect(
        await sfProduct.page
          .locator(sfProduct.xpathProductOnCollectionPage(campaignsInfos.pricing_info.title))
          .isVisible({ timeout: 5000 }),
      ).toBe(false);
    });
  });
});
