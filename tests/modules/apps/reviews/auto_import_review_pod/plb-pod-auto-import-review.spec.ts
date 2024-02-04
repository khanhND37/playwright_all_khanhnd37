import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { SFProduct } from "@pages/storefront/product";
import { DataReviewInApp } from "@types";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFHome } from "@pages/storefront/homepage";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import { Apps } from "@pages/dashboard/apps";
import { AppsAPI } from "@pages/api/apps";
import { ReviewAppAPI } from "@pages/api/apps/review_apps/review_apps";

test.describe("Auto import review POD product", async () => {
  let printbasePage: PrintBasePage;
  let dashboardPage: DashboardPage;
  let appsPage: Apps;
  let productPage: SFProduct;
  let homePage: SFHome;
  let domain: string;
  let minRating: number;
  let dataReview: DataReviewInApp;
  let sourceReview: string;
  let reviewAppAPI: ReviewAppAPI;
  let appsAPI: AppsAPI;
  let shopDomain: string;
  let campaignHandle: string;
  let campaignName: string;
  let lengthReview: number;

  test.beforeEach(async ({ dashboard, conf, authRequest, page }) => {
    test.setTimeout(conf.suiteConf.time_out);
    domain = conf.suiteConf.domain;
    shopDomain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    printbasePage = new PrintBasePage(dashboard, shopDomain);
    homePage = new SFHome(page, shopDomain);
    appsPage = new Apps(dashboard, domain);
    appsAPI = new AppsAPI(domain, authRequest);
    reviewAppAPI = new ReviewAppAPI(domain, conf.suiteConf.shop_id, authRequest);
    minRating = conf.caseConf.min_rating;
    sourceReview = conf.caseConf.source_review;
    shopDomain = conf.suiteConf.domain;
    campaignHandle = conf.caseConf?.campaign_handle;
    campaignName = conf.caseConf?.pricing_info?.title;

    // xoá campaign cũ, delte review cũ
    await dashboardPage.page.goto(`https://${shopDomain}/admin/plusbase/campaigns/list`);
    await printbasePage.deleteAllCampaign(conf.suiteConf.password, "PlusBase");
    await reviewAppAPI.deletAllReviews();
  });

  test(`@SB_APP_RV_AIR_06 Verify auto import reviews cho pod product shop PLB`, async ({ conf }) => {
    const settingReview = conf.caseConf.data_setting_review;
    await appsAPI.actionEnableDisableApp("review", true);
    await test.step(`Click menu POD Products > All Campaigns > Create Campaign > Launch campain`, async () => {
      await reviewAppAPI.deletAllReviews();
      await reviewAppAPI.settingReviewApp(settingReview);
      await dashboardPage.navigateToSubMenu("POD products", "Catalog");
      // Select base product
      await printbasePage.addBaseProduct(conf.caseConf.product_info);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < conf.caseConf.layers.length; i++) {
        await printbasePage.addNewLayer(conf.caseConf.layers[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(async () => {
        const status = await printbasePage.getDataTable(1, 1, 3);
        expect(status).toEqual("Available");
      }).toPass();
    });

    await test.step(`Click App > Chọn App Reviews > All Reviews`, async () => {
      await printbasePage.openCampaignDetail(conf.caseConf.pricing_info.title);
      const campaignID = await printbasePage.getCampaignID("PlusBase");
      dataReview = await reviewAppAPI.getReviewInAppByProductId(campaignID);
      lengthReview = dataReview.reviews.length;
      for (let i = 0; i < dataReview.reviews.length; i++) {
        expect(dataReview.reviews[i].rating).toBeGreaterThanOrEqual(minRating);
        expect(dataReview.reviews[i].source).toEqual(sourceReview);
      }
    });

    await test.step(`Open sf của campaign > Verify hiển thị review của product ở SF`, async () => {
      productPage = await homePage.gotoProductDetailByHandle(campaignHandle, campaignName);
      await scrollUntilElementIsVisible({
        page: homePage.page,
        scrollEle: productPage.page.locator(productPage.xpathTitleCustomerReview),
        viewEle: productPage.page.locator(productPage.xpathTitleCustomerReview),
      });
      const ratingOfReviews = await productPage.getAverageRatingReviewOfProduct();
      const numberOfReviews = await productPage.getNumberOfReviewsInSF();
      expect(ratingOfReviews).toBeGreaterThanOrEqual(minRating);
      expect(numberOfReviews).toEqual(lengthReview);
    });
  });

  test(`@SB_APP_RV_AIR_09 Verify auto import reviews theo setting minimum star, số review được import`, async ({
    conf,
    page,
  }) => {
    const settingReview = conf.caseConf.data_setting_review;
    await appsAPI.actionEnableDisableApp("review", true);
    homePage = new SFHome(page, shopDomain);
    await test.step(`Login vào dashboad > App > Chọn App Review > Settings > Bật Auto-import review`, async () => {
      await reviewAppAPI.deletAllReviews();
      await dashboardPage.navigateToMenu("Apps");
      await appsPage.openApp("Product Reviews");
      await appsPage.openListMenu("Settings");
      await reviewAppAPI.settingReviewApp(settingReview);
    });

    await test.step(`Click menu POD Products > All Campaigns > Create Campaign > Launch campain`, async () => {
      await dashboardPage.navigateToSubMenu("POD products", "Catalog");
      // Select base product
      await printbasePage.addBaseProduct(conf.caseConf.product_info);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < conf.caseConf.layers.length; i++) {
        await printbasePage.addNewLayer(conf.caseConf.layers[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(async () => {
        const status = await printbasePage.getDataTable(1, 1, 3);
        expect(status).toEqual("Available");
      }).toPass();
    });

    await test.step(`Click App > Chọn App Reviews > All Reviews`, async () => {
      await printbasePage.openCampaignDetail(conf.caseConf.pricing_info.title);
      const campaignID = await printbasePage.getCampaignID("PlusBase");
      dataReview = await reviewAppAPI.getReviewInAppByProductId(campaignID);
      lengthReview = dataReview.reviews.length;
      for (let i = 0; i < dataReview.reviews.length; i++) {
        expect(dataReview.reviews[i].rating).toBeGreaterThanOrEqual(minRating);
        expect(dataReview.reviews[i].source).toEqual(sourceReview);
      }
    });

    await test.step(`Open sf của campaign > Verify hiển thị review của product ở SF`, async () => {
      productPage = await homePage.gotoProductDetailByHandle(campaignHandle, campaignName);
      await scrollUntilElementIsVisible({
        page: homePage.page,
        scrollEle: productPage.page.locator(productPage.xpathTitleCustomerReview),
        viewEle: productPage.page.locator(productPage.xpathTitleCustomerReview),
      });
      const ratingOfReviews = await productPage.getAverageRatingReviewOfProduct();
      const numberOfReviews = await productPage.getNumberOfReviewsInSF();
      expect(ratingOfReviews).toBeGreaterThanOrEqual(minRating);
      expect(numberOfReviews).toEqual(lengthReview);
    });
  });

  test(`@SB_APP_RV_AIR_11 Verify edit setting auto import review không ảnh hưởng đến  product đã được import review`, async ({
    conf,
  }) => {
    const settingReview = conf.caseConf.data_setting_review;
    const settingReviewNew = conf.caseConf.data_setting_review_new;
    await appsAPI.actionEnableDisableApp("review", true);
    await test.step(`Login vào dashboad > App > Chọn App Review > Settings > Bật Auto-import review`, async () => {
      await reviewAppAPI.deletAllReviews();
      await dashboardPage.navigateToMenu("Apps");
      await appsPage.openApp("Product Reviews");
      await appsPage.openListMenu("Settings");
      await reviewAppAPI.settingReviewApp(settingReview);
    });

    await test.step(`Click menu POD Products > All Campaigns > Create Campaign > Launch campain`, async () => {
      await dashboardPage.navigateToSubMenu("POD products", "Catalog");
      // Select base product
      await printbasePage.addBaseProduct(conf.caseConf.product_info);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < conf.caseConf.layers.length; i++) {
        await printbasePage.addNewLayer(conf.caseConf.layers[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(async () => {
        const status = await printbasePage.getDataTable(1, 1, 3);
        expect(status).toEqual("Available");
      }).toPass();
    });

    await test.step(`Open sf của campaign > Verify hiển thị review của product ở SF`, async () => {
      await printbasePage.openCampaignDetail(conf.caseConf.pricing_info.title);
      const campaignID = await printbasePage.getCampaignID("PlusBase");
      dataReview = await reviewAppAPI.getReviewInAppByProductId(campaignID);
      lengthReview = dataReview.reviews.length;
      for (let i = 0; i < dataReview.reviews.length; i++) {
        expect(dataReview.reviews[i].rating).toBeGreaterThanOrEqual(minRating);
        expect(dataReview.reviews[i].source).toEqual(sourceReview);
      }
      productPage = await homePage.gotoProductDetailByHandle(campaignHandle, campaignName);
      await scrollUntilElementIsVisible({
        page: homePage.page,
        scrollEle: productPage.page.locator(productPage.xpathTitleCustomerReview),
        viewEle: productPage.page.locator(productPage.xpathTitleCustomerReview),
      });
      const ratingOfReviews = await productPage.getAverageRatingReviewOfProduct();
      const numberOfReviews = await productPage.getNumberOfReviewsInSF();
      expect(ratingOfReviews).toBeGreaterThanOrEqual(minRating);
      expect(numberOfReviews).toEqual(lengthReview);
    });

    await test.step(` Ở dashboad > App > Chọn App Review > Settings > Edit Setting auto import review > Click Save`, async () => {
      await reviewAppAPI.settingReviewApp(settingReviewNew);
    });

    await test.step(`Reload lại sf của campaign tạo lúc đầu`, async () => {
      await productPage.page.reload();
      await scrollUntilElementIsVisible({
        page: homePage.page,
        scrollEle: productPage.page.locator(productPage.xpathTitleCustomerReview),
        viewEle: productPage.page.locator(productPage.xpathTitleCustomerReview),
      });
      const ratingOfReviews = await productPage.getAverageRatingReviewOfProduct();
      const numberOfReviews = await productPage.getNumberOfReviewsInSF();
      expect(ratingOfReviews).toBeGreaterThanOrEqual(minRating);
      expect(numberOfReviews).toEqual(lengthReview);
    });
  });

  test(`@SB_APP_RV_AIR_10 Verify  không xoá reivew đã import trước đó sau khi tắt tính năng auto import reviews`, async ({
    conf,
  }) => {
    const settingReview = conf.caseConf.data_setting_review;
    let campaignID: number;
    await appsAPI.actionEnableDisableApp("review", true);

    await test.step(`Login vào dashboad > App > Chọn App Review > Settings > Bật Auto-import review`, async () => {
      await reviewAppAPI.deletAllReviews();
      await dashboardPage.navigateToMenu("Apps");
      await appsPage.openApp("Product Reviews");
      await appsPage.openListMenu("Settings");
      await reviewAppAPI.settingReviewApp(settingReview);
    });

    await test.step(`Click menu POD Products > All Campaigns > Create Campaign > Launch campain`, async () => {
      await dashboardPage.navigateToSubMenu("POD products", "Catalog");
      // Select base product
      await printbasePage.addBaseProduct(conf.caseConf.product_info);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < conf.caseConf.layers.length; i++) {
        await printbasePage.addNewLayer(conf.caseConf.layers[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(async () => {
        const status = await printbasePage.getDataTable(1, 1, 3);
        expect(status).toEqual("Available");
      }).toPass();
    });

    await test.step(`Click App > Chọn App Reviews > All Reviews`, async () => {
      await printbasePage.openCampaignDetail(conf.caseConf.pricing_info.title);
      campaignID = await printbasePage.getCampaignID("PlusBase");
      dataReview = await reviewAppAPI.getReviewInAppByProductId(campaignID);
      lengthReview = dataReview.reviews.length;
      for (let i = 0; i < dataReview.reviews.length; i++) {
        expect(dataReview.reviews[i].rating).toBeGreaterThanOrEqual(minRating);
        expect(dataReview.reviews[i].source).toEqual(sourceReview);
      }
    });

    await test.step(`Open sf của campaign > Verify hiển thị review của product ở SF`, async () => {
      productPage = await homePage.gotoProductDetailByHandle(campaignHandle, campaignName);
      await scrollUntilElementIsVisible({
        page: homePage.page,
        scrollEle: productPage.page.locator(productPage.xpathTitleCustomerReview),
        viewEle: productPage.page.locator(productPage.xpathTitleCustomerReview),
      });
      const ratingOfReviews = await productPage.getAverageRatingReviewOfProduct();
      const numberOfReviews = await productPage.getNumberOfReviewsInSF();
      expect(ratingOfReviews).toBeGreaterThanOrEqual(minRating);
      expect(numberOfReviews).toEqual(lengthReview);
    });

    await test.step(`Vào dashboard shop plb > Apps > Chọn app Reviews > Setting > Off auto-import review > Mở sf của campaign vừa tạo`, async () => {
      await appsAPI.actionEnableDisableApp("review", false);
      dataReview = await reviewAppAPI.getReviewInAppByProductId(campaignID);
      lengthReview = dataReview.reviews.length;
      for (let i = 0; i < dataReview.reviews.length; i++) {
        expect(dataReview.reviews[i].rating).toBeGreaterThanOrEqual(minRating);
        expect(dataReview.reviews[i].source).toEqual(sourceReview);
      }
    });
  });
});
