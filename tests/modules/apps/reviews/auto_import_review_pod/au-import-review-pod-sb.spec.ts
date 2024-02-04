import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFProduct } from "@pages/storefront/product";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { Reviews } from "@types";
import { Apps } from "@pages/dashboard/apps";
import { PrintHubPage } from "@pages/apps/printhub";
import { ReviewAppAPI } from "@pages/api/apps/review_apps/review_apps";

let shopDomain: string;
let printHubPage: PrintHubPage;
let minStar: number;
let source: string;
let dashboardPage: DashboardPage;
let reviewAPI: ReviewAppAPI;
let printbasePage: PrintBasePage;
let appPage: Apps;
let campaignID: number;
let dataReviewInApp: Array<Reviews>;
let productSF: SFProduct;
let reviewsInDashboard: number;

test.describe("Auto import review POD product for shopbase", async () => {
  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain;
    appPage = new Apps(dashboard, shopDomain);
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    printHubPage = new PrintHubPage(dashboard, shopDomain);
    reviewAPI = new ReviewAppAPI(shopDomain, conf.suiteConf.shop_id, authRequest);
    minStar = conf.suiteConf.min_star;
    source = conf.suiteConf.source;
    printbasePage = new PrintBasePage(dashboard, shopDomain);
    await reviewAPI.deletAllReviews();
  });

  test(`@SB_APP_RV_AIR_08 Verify auto import reviews cho pod product shop SB(Printhub)`, async ({ conf, context }) => {
    const dataCampaign = conf.caseConf.data_campaign;
    await test.step(`Click menu Fulfillment> Printhub  > Catalog > Create new campaign > Launch campain`, async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await printHubPage.goto(printHubPage.urlCampaignPage);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.goto(printHubPage.urlCatalogPage);
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
      await dashboardPage.navigateToMenu("Fulfillment");
      await printHubPage.goto(printHubPage.urlCampaignPage);
      await printbasePage.openCampaignDetail(dataCampaign.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.page.waitForSelector(productSF.xpathBlockRatingReview);
      const ratingOfReviews = await productSF.getAverageRatingReviewOfProduct();
      const numberOfReviews = await productSF.getNumberOfReviewsInSF();
      expect(ratingOfReviews).toBeGreaterThanOrEqual(minStar);
      expect(numberOfReviews).toEqual(dataReviewInApp.length);
    });
  });
});
