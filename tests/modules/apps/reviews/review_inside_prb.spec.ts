import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { snapshotDir } from "@utils/theme";
import { ReviewPage } from "@pages/dashboard/product_reviews";

test.describe("App reviews themes inside", async () => {
  let dashboardPage: DashboardPage;
  let reviewPage: ReviewPage;
  const reviewIds = [];
  const productGroups = [];

  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    reviewPage = new ReviewPage(dashboard, conf.suiteConf.domain, authRequest);

    await test.step(`Navigate to menu All reviews in Reviews app`, async () => {
      await dashboardPage.navigateToMenu("Apps");
      await reviewPage.menuReviews.click();
    });

    await test.step(`Delete all reviews in Reviews app`, async () => {
      const response = await reviewPage.loadDataReviewsDashboard();
      for (let i = 0; i < response.reviews.length; i++) {
        reviewIds.push(response.reviews[i].id);
      }
      await reviewPage.deleteReview(reviewIds);
      await reviewPage.page.reload();
    });

    await test.step(`Delete all product groups in Reviews app`, async () => {
      const response = await reviewPage.loadDataProductGroups();
      for (let i = 0; i < response.review_product_groups.length; i++) {
        productGroups.push(response.review_product_groups[i].id);
      }
      await reviewPage.deleteProductGroups(productGroups);
    });
  });

  test(`@SB_SF_RV_45 Shared review_PB_Check import thành công review`, async ({ page, conf }) => {
    await test.step(`Thực hiển import review với printbase shared reviews`, async () => {
      await reviewPage.xpathBtnImportReview.click();
      await reviewPage.genLoc(reviewPage.prBShareReview).click();
      await reviewPage.printBaseShareReview(conf.caseConf.star, conf.caseConf.number_review);
      const mesageSuccessPopup = await reviewPage.genLoc(reviewPage.msgSuccessPopup).innerText();
      expect(mesageSuccessPopup).toContain(conf.caseConf.msg_success_popup);
      await reviewPage.genLoc(reviewPage.checkNowBtn).click();
    });

    await test.step(`Check hiển thị review trong dashboard`, async () => {
      await reviewPage.waitForLoadReviewsImport(conf.caseConf.number_review);
      await expect(reviewPage.genLoc(reviewPage.reviewsTable)).toBeVisible();
    });

    await test.step(`Check hiển thị review ngoài SF`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/pages/all-reviews`);
      await reviewPage.genLoc(reviewPage.overallRating).isVisible();
      await expect(page.locator(reviewPage.widgetReviews)).toBeVisible();
    });
  });

  test(`@SB_SF_RV_RDBIR_82 Import shared review for printbase_Check review được import`, async ({ page, conf }) => {
    await test.step(`Import 10 shared reviews`, async () => {
      await reviewPage.xpathBtnImportReview.click();
      await reviewPage.genLoc(reviewPage.prBShareReview).click();
      await reviewPage.printBaseShareReview(conf.caseConf.star, conf.caseConf.number_review);
      const mesageSuccessPopup = await reviewPage.genLoc(reviewPage.msgSuccessPopup).innerText();
      expect(mesageSuccessPopup).toContain(conf.caseConf.msg_success_popup);
      await reviewPage.genLoc(reviewPage.checkNowBtn).click();
    });

    await test.step(`Mở All reviews page dashboard`, async () => {
      await reviewPage.waitForLoadReviewsImport(conf.caseConf.number_review);
      await reviewPage.page.reload();
      await expect(reviewPage.genLoc(reviewPage.reviewsTable)).toBeVisible();
      await reviewPage.selectAllReviews.click();
      const textTotalReviewsSelected = await reviewPage.genLoc(reviewPage.totalReviewSelected).innerText();
      const totalReviewsSelected = Number(textTotalReviewsSelected.match(/\d+/)[0]);
      expect(totalReviewsSelected).toEqual(conf.caseConf.number_review);
      const firstReviewStatus = await reviewPage.genLoc(reviewPage.statusReviewInDB).nth(0).innerText();
      expect(firstReviewStatus).toEqual("Published");
      const firstReviewType = await reviewPage.genLoc(reviewPage.typeReviewInDB).nth(0).innerText();
      expect(firstReviewType).toEqual("Store review");
    });

    await test.step(`Mở Product detail page`, async () => {
      await reviewPage.goto(`https://${conf.suiteConf.domain}/products/${conf.caseConf.product_1}`);
      await reviewPage.page.waitForLoadState("networkidle");
      await reviewPage.page.reload();
      await expect(async () => {
        await reviewPage.genLoc(reviewPage.overallRating).isVisible();
        await reviewPage.genLoc(reviewPage.reviewInStf).nth(0).isVisible();
      }).toPass();
      await expect(reviewPage.genLoc(reviewPage.reviewInStf).nth(0)).toBeVisible();
      const countReview = await reviewPage.genLoc(reviewPage.reviewSTf).count();
      expect(countReview).toEqual(conf.caseConf.number_review);
    });

    await test.step(`Mở All reviews page`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/pages/all-reviews`);
      await expect(async () => {
        await reviewPage.genLoc(reviewPage.overallRating).isVisible();
      }).toPass();
      await expect(page.locator(reviewPage.widgetReviews)).toBeVisible();
      const countReview = await reviewPage.genLoc(reviewPage.reviewSTf).count();
      expect(countReview).toEqual(conf.caseConf.number_review);
    });
  });
});
