import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { DataReviewInApp } from "@types";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ReviewAppAPI } from "@pages/api/apps/review_apps/review_apps";

test.describe("Submit review cammpaign", async () => {
  let dashboardPage: DashboardPage;
  let domain: string;
  let dataReview: DataReviewInApp;
  let reviewAPI: ReviewAppAPI;
  let shopDomain: string;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    domain = conf.suiteConf.domain;
    shopDomain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    reviewAPI = new ReviewAppAPI(domain, conf.suiteConf.shop_id, authRequest);
    shopDomain = conf.suiteConf.domain;
  });

  test(`@SB_APP_RV_AIR_18 Verify action buyer submit review campaign có nhiều hơn 1 base product trên storefront`, async ({
    conf,
  }) => {
    const review = conf.caseConf.review;
    await reviewAPI.deletAllReviews();
    await test.step(`Mở sf của campaign > Click submit review > Input review > Click Submit`, async () => {
      await reviewAPI.submitReviewCampaign(review);
    });

    await test.step(`Verify review đã được submit`, async () => {
      await dashboardPage.navigateToMenu("Apps");
      dataReview = await reviewAPI.getReviewInAppByProductId(conf.caseConf.review.product_id);
      for (let i = 0; i < dataReview.reviews.length; i++) {
        expect(dataReview.reviews[i].rating).toEqual(conf.caseConf.review.rating);
        expect(dataReview.reviews[i].title).toEqual(conf.caseConf.review.title);
        expect(dataReview.reviews[i].content).toEqual(conf.caseConf.review.content);
        expect(dataReview.reviews[i].source).toEqual(conf.caseConf.source);
      }
    });
  });

  test(`@SB_APP_RV_AIR_20 Verify move review đến campaign khác shop PLB/PB`, async ({ conf }) => {
    const review = conf.caseConf.review;
    await reviewAPI.deletAllReviews();
    await test.step(`Login vào store merchant > Click app Product reviews > All Reviews > Search review > Open review detail`, async () => {
      await reviewAPI.submitReviewCampaign(review);
      dataReview = await reviewAPI.getReviewInAppByProductId(conf.caseConf.review.product_id);
      expect(dataReview.reviews[0].product_id).toEqual(conf.caseConf.review.product_id);
      expect(dataReview.reviews[0].variant_id).toEqual(conf.caseConf.review.variant_id);
    });

    await test.step(`Ở section Assign to product > Search  Product to assign Choose product , choose Product style> Save > Verify Review đã được move sang camp khác`, async () => {
      const reviewCampaign = await reviewAPI.getDetailReview(dataReview.reviews[0].id);
      reviewCampaign.review.product_id = conf.caseConf.target_campaign.product_id;
      reviewCampaign.review.variant_id = conf.caseConf.target_campaign.variant_id;
      await reviewAPI.moveReview(reviewCampaign.review, dataReview.reviews[0].id);
      dataReview = await reviewAPI.getReviewInAppByProductId(conf.caseConf.target_campaign.product_id);
      expect(dataReview.reviews[0].product_id).toEqual(conf.caseConf.target_campaign.product_id);
      expect(dataReview.reviews[0].variant_id).toEqual(conf.caseConf.target_campaign.variant_id);
    });
  });
});
