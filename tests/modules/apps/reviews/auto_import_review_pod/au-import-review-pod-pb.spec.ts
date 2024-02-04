import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFProduct } from "@pages/storefront/product";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { Reviews } from "@types";
import { Apps } from "@pages/dashboard/apps";
import { ReviewAppAPI } from "@pages/api/apps/review_apps/review_apps";

let dashboardPage: DashboardPage;
let printbasePage: PrintBasePage;
let urlCatalog: string;
let shopDomain: string;
let campaignID: number;
let reviewAPI: ReviewAppAPI;
let dataReviewInApp: Array<Reviews>;
let minStar: number;
let source: string;
let appPage: Apps;
let productSF: SFProduct;
let reviewsInDashboard: number;

test.describe("Auto import review POD product for printbase", async () => {
  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    printbasePage = new PrintBasePage(dashboard, shopDomain);
    reviewAPI = new ReviewAppAPI(shopDomain, conf.suiteConf.shop_id, authRequest);
    appPage = new Apps(dashboard, shopDomain);
    minStar = conf.suiteConf.min_star;
    source = conf.suiteConf.source;
    urlCatalog = conf.suiteConf.url_catalog;
  });

  test(`@SB_APP_RV_AIR_07 Verify auto import reviews cho pod product shop PB`, async ({ conf, context }) => {
    const dataCampaign = conf.caseConf.data_campaign;
    await test.step(`Click menu POD Products > All Campaigns > Create Campaign > Launch campain`, async () => {
      await reviewAPI.deletAllReviews();
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.deleteAllCampaign(conf.suiteConf.password, "PrintBase");
      await printbasePage.goto(urlCatalog);
      // Tạo campaign
      await printbasePage.addBaseProduct(dataCampaign.product_info);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < dataCampaign.layers.length; i++) {
        await printbasePage.addNewLayer(dataCampaign.layers[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(dataCampaign.pricing_info);
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(async () => {
        const status = await printbasePage.getDataTable(1, 1, 3);
        expect(status).toEqual("Available");
      }).toPass();

      await printbasePage.openCampaignDetail(dataCampaign.pricing_info.title);
      campaignID = await printbasePage.getCampaignID("PrintBase");
    });

    await test.step(`Click App > Chọn App Reviews > All Reviews`, async () => {
      await dashboardPage.navigateToMenu("Apps");
      await appPage.openApp("Product Reviews");
      await appPage.openListMenu("All reviews");
      dataReviewInApp = (await reviewAPI.getReviewInAppByProductId(campaignID)).reviews;
      reviewsInDashboard = dataReviewInApp.length;
      expect(reviewsInDashboard).toBeLessThanOrEqual(conf.suiteConf.max_reviews);
      expect(reviewsInDashboard).toBeGreaterThanOrEqual(conf.suiteConf.min_reviews);
      for (let i = 0; i < reviewsInDashboard; i++) {
        expect(dataReviewInApp[i].rating).toBeGreaterThanOrEqual(minStar);
        expect(dataReviewInApp[i].source).toEqual(source);
      }
    });

    await test.step(`Open sf của campaign > Verify hiển thị review của product ở SF`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(dataCampaign.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.page.waitForSelector(productSF.xpathBlockRatingReview);
      const ratingOfReviews = await productSF.getAverageRatingReviewOfProduct();
      const numberOfReviews = await productSF.getNumberOfReviewsInSF();
      expect(ratingOfReviews).toBeGreaterThanOrEqual(minStar);
      expect(numberOfReviews).toEqual(reviewsInDashboard);
    });
  });
});
