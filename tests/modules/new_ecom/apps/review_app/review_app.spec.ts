import { expect, test } from "@fixtures/website_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { Apps } from "@pages/dashboard/apps";
import { ReviewAppPage } from "@pages/new_ecom/dashboard/review_app";
import { ReviewAppAPI } from "@pages/api/apps/review_apps/review_apps";
import { SFHome } from "@pages/storefront/homepage";
import { scrollUntilElementIsVisible } from "@utils/scroll";
import { SFProduct } from "@pages/storefront/product";
import { PageSettingsData } from "@types";
import { loadData } from "@core/conf/conf";
import { ReviewPage } from "@pages/dashboard/product_reviews";
import { snapshotDir } from "@utils/theme";

test.describe("Setting dashboard reviews app", async () => {
  let appsPage: Apps;
  let dashboardPage: DashboardPage;
  let reviewAppPage: ReviewAppPage;
  let reviewAppAPI: ReviewAppAPI;
  let themeSettingAPI: SettingThemeAPI;
  let themeSetting: number;
  let domain;
  let settingsData;
  let conf;
  let positionProductReview;
  let sectionProductReview;
  let product2;

  test.beforeEach(async ({ dashboard, conf, theme, authRequest, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    domain = conf.suiteConf.domain;
    positionProductReview = conf.suiteConf.position_product_review;
    product2 = conf.suiteConf.product_id_2;
    appsPage = new Apps(dashboard, domain);
    dashboardPage = new DashboardPage(dashboard, domain);
    reviewAppPage = new ReviewAppPage(dashboard, domain);
    reviewAppAPI = new ReviewAppAPI(domain, conf.suiteConf.shop_id, authRequest);
    sectionProductReview = await reviewAppPage.getSelectorByIndex(positionProductReview);

    await test.step(`Public theme Criadora`, async () => {
      themeSetting = conf.suiteConf.themes_setting;
      themeSettingAPI = new SettingThemeAPI(theme);
      await themeSettingAPI.publishTheme(themeSetting);
    });

    await test.step(`get data setting web`, async () => {
      const response = await builder.pageSiteBuilder(themeSetting);
      settingsData = response.settings_data as PageSettingsData;
    });

    await test.step(`delete all review of any product`, async () => {
      await reviewAppAPI.deleteAllReviewProductByID(product2);
    });
  });

  test.afterEach(async ({ builder }) => {
    await builder.updateSiteBuilder(themeSetting, settingsData);
  });

  test(`@SB_NEWECOM_ReV_2 kiểm tra khi On / Off Reviews app`, async ({ conf }) => {
    const expectAlertWarning = conf.caseConf.expect_alert_warning;
    const reviewApp = conf.caseConf.app;
    const urlRedirect = conf.caseConf.url_redirect;

    await test.step(`Tại Dashboard shop, truy cập link {{store_domain}}/admin/applist -> click chọn Reviews app -> kiểm tra hiển thị `, async () => {
      await dashboardPage.navigateToMenu("Apps");
      await appsPage.turnOnOffApp(reviewApp, false);
      await appsPage.gotoAppsNE(reviewApp);

      const contentAlertWarning = await reviewAppPage.getContentAlertWarning();
      expect(contentAlertWarning.title).toEqual(expectAlertWarning.title);
      expect(contentAlertWarning.text).toEqual(expectAlertWarning.text);
      await expect(reviewAppPage.btnActiveReviewsApp).toBeVisible();
    });

    await test.step(`Tại banner "Reviews App is inactive" -> click button: Active Reviews App -> kiểm tra hiển thị`, async () => {
      await reviewAppPage.clickOnBtnWithLabel("Activate Reviews App");
      const url = reviewAppPage.page.url();
      expect(url).toContain(urlRedirect);
    });

    await test.step(`Vào lại Reviews app -> tại banner "Reviews App is inactive" -> click button "x" -> kiểm tra hiển thị`, async () => {
      await appsPage.gotoAppsNE(reviewApp);
      await reviewAppPage.btnCloseAlertWarning.click();
      await reviewAppPage.page.reload();
      await expect(reviewAppPage.alertWarningInactive).toBeVisible();
    });

    await test.step(`Tại Dashboard shop, truy cập link {{store_domain}}/admin/applist -> click toggle Reviews app = ON -> kiểm tra hiển thị`, async () => {
      await reviewAppPage.clickOnBtnWithLabel("Activate Reviews App");
      await appsPage.turnOnOffApp(reviewApp, true);
      await appsPage.gotoAppsNE(reviewApp);
      await expect(reviewAppPage.alertWarningInactive).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_ReV_12 kiểm tra import review với file CSV cho shop ShopBase`, async ({ conf }) => {
    const reviewApp = conf.caseConf.app;
    const importReview = conf.caseConf.import_review;
    const expectReview = conf.caseConf.expect_review;

    await test.step(`Tại Dashboard shop, truy cập link {{store_domain}}/admin/applist -> click chọn Reviews app -> click chọn sub menu All reviews -> click button Import -> Tại popup Import reviews -> click button Import reviews tại line CSV file  `, async () => {
      await dashboardPage.navigateToMenu("Apps");
      await appsPage.turnOnOffApp(reviewApp, true);
      await appsPage.gotoAppsNE(reviewApp);
      await appsPage.openListMenu("All reviews");
    });

    await test.step(`Tại All reviews page -> click Filters -> chọn Review type = Unassigned -> click Done -> kiểm tra hiển thị review đã import  `, async () => {
      await reviewAppPage.importReview(importReview, true);
      const countReviewByUnassign = await reviewAppAPI.countReviews(conf.caseConf.params_count_review);
      expect(countReviewByUnassign).toEqual(expectReview.quantity_review_unassign);
    });
  });

  test(`@SB_NEWECOM_ReV_25 kiểm tra btn Load more và filter reviews ở Preview, ngoài storefront trên desktop và mobile`, async ({
    conf,
    page,
    pageMobile,
  }) => {
    const expectFilterReview = conf.caseConf.expect_filter_review;
    const product = conf.caseConf.product;
    let countReviewById: number;
    let countCardReviewAfterSelectTopReviews: number;
    const homePageDesk = new SFHome(page, domain);
    const productPageDesk = new SFProduct(page, domain);
    const homePageMobile = new SFHome(pageMobile, domain);
    const productPageMobile = new SFProduct(pageMobile, domain);

    await test.step(`Tại Customize page, click mở block All Reviews / Product Reviews -> kiểm tra hiển thị của filter và items per page tại Preview  `, async () => {
      await reviewAppPage.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await reviewAppPage.loadingScreen.waitFor();
      await reviewAppPage.reloadIfNotShow("web builder");
      await reviewAppPage.reloadIfNotShow("products");
      await reviewAppPage.clickOnElement(sectionProductReview, reviewAppPage.iframe);
      const defaultFilter = await reviewAppPage.getContentFilterReview();
      expect(defaultFilter.filter).toEqual(expectFilterReview.filter);
      expect(defaultFilter.per_page).toEqual(expectFilterReview.per_page);
    });

    await test.step(`- Tại Preview, click field items per page- select option bất kỳ trong droplist`, async () => {
      // step filter 10 per page
      await reviewAppPage.filterReviewInWB(conf.caseConf.select_item_option_10_per_page);
      await expect(reviewAppPage.frameLocator.locator(reviewAppPage.btnLoadMore)).toBeVisible();
      await reviewAppPage.frameLocator.locator(reviewAppPage.btnLoadMore).click();
      countReviewById = await reviewAppAPI.countReviews(conf.caseConf.params_count_review);
      const countCardReviewAfterClickLoadMore = await reviewAppPage.frameLocator
        .locator(reviewAppPage.reviewCardGrid)
        .count();
      expect(countReviewById).toEqual(countCardReviewAfterClickLoadMore);

      // step filter 50 per page
      await reviewAppPage.filterReviewInWB(conf.caseConf.select_item_option_50_per_page);
      expect(countReviewById).toEqual(countCardReviewAfterClickLoadMore);
    });

    await test.step(`tại Preview, click Filter review -> chọn Top reviews -> kiểm tra hiển thị reviews`, async () => {
      await reviewAppPage.filterReviewInWB(conf.caseConf.select_item_option_top_reviews);
      countCardReviewAfterSelectTopReviews = await reviewAppPage.frameLocator
        .locator(reviewAppPage.reviewCardGrid)
        .count();
      const dataReview = await reviewAppAPI.getAllReviewProductByID(conf.caseConf.params_count_review.product_id);
      const listRating: Array<number> = [];
      for (let i = 0; i < dataReview.reviews.length; i++) {
        listRating.push(dataReview.reviews[i].rating);
      }
      const maxNumberRating = Math.max(...listRating);
      const minNumberRating = Math.min(...listRating);
      const getRatingFirstCardReviewInWB = await reviewAppPage.countRatingReviewsCardInWB(1);
      const getRatingLastCardReviewInWB = await reviewAppPage.countRatingReviewsCardInWB(
        countCardReviewAfterSelectTopReviews,
      );
      expect(getRatingFirstCardReviewInWB).toEqual(maxNumberRating);
      expect(getRatingLastCardReviewInWB).toEqual(minNumberRating);
    });

    await test.step(`Desktop: truy cập store domain, kiểm tra hiển thị block All Reviews / Product Reviews`, async () => {
      await homePageDesk.gotoProduct(product);
      await homePageDesk.page.waitForLoadState("networkidle");
      const defaultFilter = await productPageDesk.getContentFilterReviewSF();
      expect(defaultFilter.filter).toEqual(expectFilterReview.filter);
      expect(defaultFilter.per_page).toEqual(expectFilterReview.per_page);
    });

    await test.step(`tại Desktop, thực hiện filter theo filter / items per page / click chọn hàng điểm`, async () => {
      // filter theo items per page
      await productPageDesk.filterReview(conf.caseConf.select_item_option_50_per_page);
      const countReviewById = await reviewAppAPI.countReviews(conf.caseConf.params_count_review);
      const countReviewInSF = await productPageDesk.page.locator(reviewAppPage.reviewCardGrid).count();
      expect(countReviewById).toEqual(countReviewInSF);

      // filter theo filter
      await productPageDesk.filterReview(conf.caseConf.select_item_option_top_reviews);
      const dataReview = await reviewAppAPI.getAllReviewProductByID(conf.caseConf.params_count_review.product_id);
      const listRating: Array<number> = [];
      for (let i = 0; i < dataReview.reviews.length; i++) {
        listRating.push(dataReview.reviews[i].rating);
      }
      const maxNumberRating = Math.max(...listRating);
      const minNumberRating = Math.min(...listRating);
      const getRatingFirstCardReviewInSF = await productPageDesk.countRatingReviewsCard(1);
      const getRatingLastCardReviewInSF = await productPageDesk.countRatingReviewsCard(countReviewInSF);
      expect(getRatingFirstCardReviewInSF).toEqual(maxNumberRating);
      expect(getRatingLastCardReviewInSF).toEqual(minNumberRating);
    });

    await test.step(`Mobile: truy cập store domain, kiểm tra hiển thị block All Reviews / Product Reviews`, async () => {
      await homePageMobile.gotoProduct(product);
      await homePageMobile.page.waitForLoadState("networkidle");
      const defaultFilter = await productPageMobile.getContentFilterReviewSF();
      expect(defaultFilter.filter).toEqual(expectFilterReview.filter);
      expect(defaultFilter.per_page).toEqual(expectFilterReview.per_page);
    });

    await test.step(`tại Mobile, thực hiện filter theo filter / items per page / click chọn hàng điểm`, async () => {
      // filter theo items per page
      await productPageMobile.filterReview(conf.caseConf.select_item_option_50_per_page);
      const countReviewById = await reviewAppAPI.countReviews(conf.caseConf.params_count_review);
      const countReviewInMobile = await productPageMobile.page.locator(reviewAppPage.reviewCardGrid).count();
      expect(countReviewById).toEqual(countReviewInMobile);

      // filter theo filter
      await productPageMobile.filterReview(conf.caseConf.select_item_option_top_reviews);
      const dataReview = await reviewAppAPI.getAllReviewProductByID(conf.caseConf.params_count_review.product_id);
      const listRating: Array<number> = [];
      for (let i = 0; i < dataReview.reviews.length; i++) {
        listRating.push(dataReview.reviews[i].rating);
      }
      const maxNumberRating = Math.max(...listRating);
      const minNumberRating = Math.min(...listRating);
      const getRatingFirstCardReviewInMobile = await productPageMobile.countRatingReviewsCard(1);
      const getRatingLastCardReviewInMobile = await productPageMobile.countRatingReviewsCard(countReviewInMobile);
      expect(getRatingFirstCardReviewInMobile).toEqual(maxNumberRating);
      expect(getRatingLastCardReviewInMobile).toEqual(minNumberRating);
    });
  });

  test(`@SB_NEWECOM_REV_40 kiểm tra setting Icon và Rating Color cho 3 block All Reviews, Product Reviews, Product Rating  tại Website settings > Review rating`, async ({
    conf,
    page,
    pageMobile,
    snapshotFixture,
  }) => {
    const dataSetting = conf.caseConf.data_setting;
    const product = conf.caseConf.product;
    const homePageDesk = new SFHome(page, domain);
    const productPageDesk = new SFProduct(page, domain);
    const homePageMobile = new SFHome(pageMobile, domain);
    const productPageMobile = new SFProduct(pageMobile, domain);

    await test.step(`tại customize theme -> click icon Website setting -> click Review Rating`, async () => {
      await reviewAppPage.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await reviewAppPage.loadingScreen.waitFor();
      await reviewAppPage.reloadIfNotShow("web builder");
      await reviewAppPage.reloadIfNotShow("products");
      await reviewAppPage.frameLocator.locator(reviewAppPage.blockReview).waitFor({ state: "visible" });
      await reviewAppPage.clickOnElement(sectionProductReview, reviewAppPage.iframe);
    });

    for (let i = 0; i < dataSetting.length; i++) {
      await test.step(`thực hiện setting Icon và Rating Color  -> kiểm tra hiển thị Preview (cụ thể data được defind trong gg sheet)`, async () => {
        await reviewAppPage.clickIconWebsiteSetting();
        await reviewAppPage.clickCategorySetting("Review rating");
        await reviewAppPage.settingReviewRating(dataSetting[i]);
        await reviewAppPage.clickOnBtnWithLabel("Save");
        await snapshotFixture.verifyWithAutoRetry({
          page: reviewAppPage.page,
          selector: reviewAppPage.frameLocator.locator(reviewAppPage.centerRating).nth(1),
          snapshotName: dataSetting[i].expect_snapshot.website_buider,
        });
      });

      await test.step(`click button Save -> kiểm tra hiển thị Desktop`, async () => {
        await homePageDesk.gotoProduct(product);
        await homePageDesk.page.waitForLoadState("networkidle");
        await scrollUntilElementIsVisible({
          page: page,
          scrollEle: productPageDesk.page.locator(productPageDesk.xpathTitleCustomerReview),
          viewEle: productPageDesk.page.locator(productPageDesk.xpathTitleCustomerReview),
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: productPageDesk.page,
          selector: productPageDesk.page.locator(reviewAppPage.centerRating).nth(1),
          snapshotName: dataSetting[i].expect_snapshot.store_front,
        });
      });

      await test.step(`kiểm tra hiển thị Mobile`, async () => {
        await homePageMobile.gotoProduct(product);
        await homePageMobile.page.waitForLoadState("networkidle");
        await scrollUntilElementIsVisible({
          page: pageMobile,
          scrollEle: productPageMobile.page.locator(productPageMobile.xpathTitleCustomerReview),
          viewEle: productPageMobile.page.locator(productPageMobile.xpathTitleCustomerReview),
        });
        await snapshotFixture.verifyWithAutoRetry({
          page: productPageMobile.page,
          selector: productPageMobile.page.locator(reviewAppPage.centerRating).nth(1),
          snapshotName: dataSetting[i].expect_snapshot.mobile,
        });
      });
    }
  });

  conf = loadData(__dirname, "LAYOUT_ALL_REVIEW");
  for (let caseIndex = 0; caseIndex < conf.caseConf.data.length; caseIndex++) {
    const dataSetting = conf.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ page, snapshotFixture, conf }) => {
      const homePage = new SFHome(page, domain);
      const productPage = new SFProduct(page, domain);
      const expectSnapshot = conf.caseConf.expect_snapshot;

      await test.step(`Tại Customize page, click mở block Product Reviews -> mở Design tab -> click Layout  -> kiểm tra hiển thị  `, async () => {
        await reviewAppPage.openWebBuilder({
          type: "site",
          id: themeSetting,
          page: "home",
        });
        await reviewAppPage.loadingScreen.waitFor();
        await reviewAppPage.reloadIfNotShow("web builder");
        await reviewAppPage.frameLocator.locator(reviewAppPage.blockReview).waitFor({ state: "visible" });
        await reviewAppPage.clickOnElement(sectionProductReview, reviewAppPage.iframe);
        await reviewAppPage.switchToTab("Content");
        await reviewAppPage.settingDesignAndContentWithSDK(dataSetting.data_content);
        await reviewAppPage.switchToTab("Design");
        await reviewAppPage.settingDesignAndContentWithSDK(dataSetting.data_layout);
        const dataDesign = await reviewAppPage.getDesignAndContentWithSDK();
        await expect(JSON.stringify(dataDesign.layout)).toEqual(JSON.stringify(dataSetting.expect_layout));
      });

      await test.step(`-> thực hiện setting cho fields: Radius, Card size, Align card, Spacing (cụ thể data thay đổi được defind trong sheet Layout All Reviews) -> kiểm tra hiển thị card review ở Preview `, async () => {
        await reviewAppPage.clickOnBtnWithLabel("Save");
        await expect(reviewAppPage.toastMessage).toContainText("All changes are saved");
      });

      await test.step(`- click button Save-> Desktop: truy cập domain store, kiểm tra hiển thị của block ngoài Storefront `, async () => {
        await homePage.gotoHomePage();
        await homePage.page.waitForLoadState("domcontentloaded");
        if (dataSetting.data_layout.layout.name === "Masonry") {
          const dataBeforeClickLineRating = await homePage.genLoc(reviewAppPage.itemReviewCard).count();
          await productPage.filterReview({
            per_page: dataSetting.filter_review_per_page,
          });
          let countReviewsAfterClickLineRating: number;
          await expect(async () => {
            countReviewsAfterClickLineRating = await homePage.genLoc(reviewAppPage.itemReviewCard).count();
            expect(countReviewsAfterClickLineRating).not.toEqual(dataBeforeClickLineRating);
          }).toPass();
        }

        if (dataSetting.data_layout.layout.name === "List") {
          const dataBeforeClickLineRating = await homePage.genLoc(reviewAppPage.listCardReview).count();
          await productPage.filterReview({
            per_page: dataSetting.filter_review_per_page,
          });
          let countReviewsAfterClickLineRating: number;
          await expect(async () => {
            countReviewsAfterClickLineRating = await homePage.genLoc(reviewAppPage.listCardReview).count();
            expect(countReviewsAfterClickLineRating).not.toEqual(dataBeforeClickLineRating);
          }).toPass();
        }

        await snapshotFixture.verifyWithAutoRetry({
          page: productPage.page,
          selector: productPage.page.locator(reviewAppPage.blockReview),
          snapshotName: expectSnapshot.store_front,
        });
      });
    });
  }

  test(`@SB_NEWECOM_ReV_48 [All Reviews block] kiểm tra edit thành công block All Reviews tab Content block all review`, async ({
    page,
    conf,
  }) => {
    const homePage = new SFHome(page, domain);
    await test.step(`- Tại Customize page, click mở block All Reviews-> tại tab Design, setting layout = Masonry / Carousel https://prnt.sc/VtgeQiTDGxNg-> tại tab Content tab, thực hiện thay đổi setting của block (cụ thể data thay đổi được defind trong sheet Show Content Reviews)  -> kiểm tra hiển thị Preview  `, async () => {
      await reviewAppPage.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await reviewAppPage.loadingScreen.waitFor();
      await reviewAppPage.reloadIfNotShow("web builder");
      await reviewAppPage.frameLocator.locator(reviewAppPage.blockReview).waitFor({ state: "visible" });
      await reviewAppPage.clickOnElement(sectionProductReview, reviewAppPage.iframe);
    });

    await test.step(`- click button Save-> Desktop: truy cập domain store, kiểm tra hiển thị của block ngoài Storefront `, async () => {
      await reviewAppPage.settingDesignAndContentWithSDK(conf.caseConf.data_content);
      await reviewAppPage.clickOnBtnWithLabel("Save");
      await expect(reviewAppPage.toastMessage).toContainText("All changes are saved");
      await homePage.gotoHomePage();
      await homePage.page.waitForLoadState("networkidle");
      await expect(homePage.genLoc(reviewAppPage.overviewWidget)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_ReV_50 [Product Reviews block] kiểm tra remove thành công block all Reviews`, async ({ page }) => {
    const homePage = new SFHome(page, domain);
    await test.step(`- Tại Customize theme, block Product Reviews > click button Remove block -> kiểm tra hiển thị Preview  `, async () => {
      await reviewAppPage.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await reviewAppPage.loadingScreen.waitFor();
      await reviewAppPage.reloadIfNotShow("web builder");
      await reviewAppPage.frameLocator.locator(reviewAppPage.blockReview).waitFor({ state: "visible" });
      await reviewAppPage.clickOnElement(sectionProductReview, reviewAppPage.iframe);
      await reviewAppPage.selectOptionOnQuickBar("Delete");
      await reviewAppPage.clickOnBtnWithLabel("Save");
    });

    await test.step(`- click button Save-> Desktop: truy cập domain store, kiểm tra hiển thị của block ngoài Storefront   `, async () => {
      await homePage.gotoHomePage();
      await expect(homePage.genLoc(reviewAppPage.blockReview)).toBeHidden();
    });
  });

  conf = loadData(__dirname, "LAYOUT_PRODUCT_REVIEW");
  for (let caseIndex = 0; caseIndex < conf.caseConf.data.length; caseIndex++) {
    const dataSetting = conf.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ page, snapshotFixture, conf }) => {
      const product = dataSetting.product;
      const expectSnapshot = conf.caseConf.expect_snapshot;
      const homePage = new SFHome(page, domain);
      const productPage = new SFProduct(page, domain);

      await test.step(`Tại Customize page, click mở block Product Reviews -> mở Design tab -> click Layout  -> kiểm tra hiển thị  `, async () => {
        await reviewAppPage.openWebBuilder({
          type: "site",
          id: themeSetting,
          page: "product",
        });
        await reviewAppPage.loadingScreen.waitFor();
        await reviewAppPage.reloadIfNotShow("web builder");
        await reviewAppPage.reloadIfNotShow("products");
        await reviewAppPage.frameLocator.locator(reviewAppPage.blockReview).waitFor({ state: "visible" });
        await reviewAppPage.clickOnElement(sectionProductReview, reviewAppPage.iframe);
        await reviewAppPage.switchToTab("Design");
        await reviewAppPage.settingDesignAndContentWithSDK(dataSetting.data_layout);
        const dataDesign = await reviewAppPage.getDesignAndContentWithSDK();
        await expect(JSON.stringify(dataDesign.layout)).toEqual(JSON.stringify(dataSetting.expect_layout));
      });

      await test.step(`-> thực hiện setting cho fields: Radius, Card size, Align card, Spacing (cụ thể data thay đổi được defind trong sheet Layout All Reviews) -> kiểm tra hiển thị card review ở Preview `, async () => {
        await reviewAppPage.clickOnBtnWithLabel("Save");
        await expect(reviewAppPage.toastMessage).toContainText("All changes are saved");
      });

      await test.step(`- click button Save-> Desktop: truy cập domain store, kiểm tra hiển thị của block ngoài Storefront `, async () => {
        await homePage.gotoProduct(product);
        await homePage.page.waitForLoadState("networkidle");
        if (dataSetting.data_layout.layout.name === "Masonry") {
          const dataBeforeClickLineRating = await homePage.genLoc(reviewAppPage.itemReviewCard).count();
          await productPage.filterReview({
            per_page: dataSetting.filter_review_per_page,
          });
          let countReviewsAfterClickLineRating: number;
          await expect(async () => {
            countReviewsAfterClickLineRating = await homePage.genLoc(reviewAppPage.itemReviewCard).count();
            expect(countReviewsAfterClickLineRating).not.toEqual(dataBeforeClickLineRating);
          }).toPass();
        }

        if (dataSetting.data_layout.layout.name === "List") {
          const dataBeforeClickLineRating = await homePage.genLoc(reviewAppPage.listCardReview).count();
          await productPage.filterReview({
            per_page: dataSetting.filter_review_per_page,
          });
          let countReviewsAfterClickLineRating: number;
          await expect(async () => {
            countReviewsAfterClickLineRating = await homePage.genLoc(reviewAppPage.listCardReview).count();
            expect(countReviewsAfterClickLineRating).not.toEqual(dataBeforeClickLineRating);
          }).toPass();
        }

        await snapshotFixture.verifyWithAutoRetry({
          page: productPage.page,
          selector: productPage.page.locator(reviewAppPage.blockReview),
          snapshotName: expectSnapshot.store_front,
        });
      });
    });
  }

  conf = loadData(__dirname, "ON_OFF_OVERVIEW");
  for (let caseIndex = 0; caseIndex < conf.caseConf.data.length; caseIndex++) {
    const dataSetting = conf.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ page }) => {
      const product = dataSetting.product;
      const homePage = new SFHome(page, domain);

      await test.step(`- Tại Customize page, click mở block Product Reviews -> mở Content tab+ Show overview = OFF+ thực hiện thay đổi setting của block (data setting như gg sheet Show Content Reviews)-> kiểm tra hiển thị Setting tab `, async () => {
        await reviewAppPage.openWebBuilder({
          type: "site",
          id: themeSetting,
          page: "product",
        });
        await reviewAppPage.loadingScreen.waitFor();
        await reviewAppPage.reloadIfNotShow("web builder");
        await reviewAppPage.reloadIfNotShow("products");
        await reviewAppPage.frameLocator.locator(reviewAppPage.blockReview).waitFor({ state: "visible" });
        await reviewAppPage.clickOnElement(sectionProductReview, reviewAppPage.iframe);
        await reviewAppPage.settingDesignAndContentWithSDK(dataSetting.data_content);
      });

      await test.step(`- click button Save-> Desktop: truy cập domain store, kiểm tra hiển thị của block ngoài Storefront `, async () => {
        await reviewAppPage.clickOnBtnWithLabel("Save");
        await expect(reviewAppPage.toastMessage).toContainText("All changes are saved");
        await homePage.gotoProduct(product);
        await homePage.page.waitForLoadState("networkidle");
        if (dataSetting.data_content.show_overview) {
          await expect(homePage.genLoc(reviewAppPage.overviewWidget)).toBeVisible();
        } else {
          await expect(homePage.genLoc(reviewAppPage.overviewWidget)).toBeHidden();
        }
      });
    });
  }

  test(`@SB_NEWECOM_ReV_64 [Product Reviews block] kiểm tra remove thành công block Product Reviews`, async ({
    page,
    conf,
  }) => {
    const product = conf.caseConf.product;
    const homePage = new SFHome(page, domain);
    await test.step(`- Tại Customize theme, block Product Reviews > click button Remove block -> kiểm tra hiển thị Preview  `, async () => {
      await reviewAppPage.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await reviewAppPage.loadingScreen.waitFor();
      await reviewAppPage.reloadIfNotShow("web builder");
      await reviewAppPage.reloadIfNotShow("products");
      await reviewAppPage.frameLocator.locator(reviewAppPage.blockReview).waitFor({ state: "visible" });
      await reviewAppPage.clickOnElement(sectionProductReview, reviewAppPage.iframe);
      await reviewAppPage.selectOptionOnQuickBar("Delete");
      await reviewAppPage.clickOnBtnWithLabel("Save");
      await expect(reviewAppPage.toastMessage).toContainText("All changes are saved");
    });

    await test.step(`- click button Save-> Desktop: truy cập domain store, kiểm tra hiển thị của block ngoài Storefront `, async () => {
      await homePage.gotoProduct(product);
      await expect(homePage.genLoc(reviewAppPage.blockReview)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_ReV_66 [ Product Reviews block] kiểm tra Form review và submit reviews`, async ({ page, conf }) => {
    const product = conf.caseConf.product;
    const homePageDesk = new SFHome(page, domain);
    const reviewSF = new ReviewPage(page, domain);

    await test.step(`truy cập store domain, đến Product detail page -> scroll đến Product Reviews block -> click button Write a review -> kiểm tra UI và submit thành công review`, async () => {
      const reviewProductBefore = await reviewAppAPI.getReviewSFById(product2);
      const totalReviewBefore = parseInt(reviewProductBefore.rating.total);
      await homePageDesk.gotoProduct(product);
      await homePageDesk.page.waitForLoadState("networkidle");
      await reviewSF.writeReviewV3(conf.caseConf.review);
      await homePageDesk.clickOnBtnWithLabel("Done");
      await expect(async () => {
        const reviewProductAfter = await reviewAppAPI.getReviewSFById(product2);
        const totalReviewAfter = parseInt(reviewProductAfter.rating.total);
        expect(totalReviewBefore + 1).toEqual(totalReviewAfter);
      }).toPass();
    });
  });

  conf = loadData(__dirname, "LAYOUT_PRODUCT_RATING");
  for (let caseIndex = 0; caseIndex < conf.caseConf.data.length; caseIndex++) {
    const dataSetting = conf.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ page, pageMobile }) => {
      const homePageDesk = new SFHome(page, domain);
      const homePageMobile = new SFHome(pageMobile, domain);

      await test.step(`- Tại Customize page > Product detail page > click mở block Product Rating    - mở Design tab -> thực hiện thay đổi setting của tab Design:+ chọn layout = In line+ nhưng data khác như sheet Star Rating Style `, async () => {
        await reviewAppPage.openWebBuilder({
          type: "site",
          id: themeSetting,
          page: "collections",
        });
        await reviewAppPage.loadingScreen.waitFor();
        await reviewAppPage.reloadIfNotShow("web builder");
        await reviewAppPage.reloadIfNotShow("collections");
        await reviewAppPage.frameLocator.locator(reviewAppPage.productRating).waitFor({ state: "visible" });
        await reviewAppPage.clickOnElement(sectionProductReview, reviewAppPage.iframe);
        await reviewAppPage.switchToTab("Design");
        await reviewAppPage.settingDesignAndContentWithSDK(dataSetting.data_layout);
      });

      await test.step(`- click button Save - Desktop: truy cập domain store -> kiểm tra hiển thị block`, async () => {
        await reviewAppPage.clickOnBtnWithLabel("Save");
        await expect(reviewAppPage.toastMessage).toContainText("All changes are saved");
        // truy cập domain store
        await homePageDesk.goto("/collections");
        await homePageDesk.page.waitForLoadState("domcontentloaded");
        const productRating = homePageDesk.genLoc(reviewAppPage.blockProductRating);
        if (dataSetting.data_layout.layout === "in_line") {
          await expect(productRating).toHaveCSS("align-items", "center");
        } else {
          await expect(productRating).toHaveCSS("flex-direction", "column");
        }
      });

      await test.step(`- Mobile: truy cập domain store -> kiểm tra hiển thị block `, async () => {
        await homePageMobile.goto("/collections");
        await homePageMobile.page.waitForLoadState("domcontentloaded");
        const productRating = homePageMobile.genLoc(reviewAppPage.blockProductRating);
        if (dataSetting.data_layout.layout === "in_line") {
          await expect(productRating).toHaveCSS("align-items", "center");
        } else {
          await expect(productRating).toHaveCSS("flex-direction", "column");
        }
      });
    });
  }

  test(`@SB_NEWECOM_ReV_71 [block Product Rating] kiểm tra edit tab Content thành công tại section có chứa Data source`, async ({
    page,
    conf,
    pageMobile,
  }) => {
    const dataContent = conf.caseConf.data_content;
    const homePageDesk = new SFHome(page, domain);
    const homePageMobile = new SFHome(pageMobile, domain);
    await test.step(`- Tại Customize page, click mở block Product Rating    - mở Content tab `, async () => {
      await reviewAppPage.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "collections",
      });
      await reviewAppPage.loadingScreen.waitFor();
      await reviewAppPage.reloadIfNotShow("web builder");
      await reviewAppPage.reloadIfNotShow("collections");
      await reviewAppPage.frameLocator.locator(reviewAppPage.productRating).waitFor({ state: "visible" });
      await reviewAppPage.clickOnElement(sectionProductReview, reviewAppPage.iframe);
      await reviewAppPage.switchToTab("Content");
    });

    for (let i = 0; i < dataContent.length; i++) {
      await test.step(`thực hiện thay đổi setting của tab Content - click button Save - Desktop: truy cập domain store -> đến Product detail page-> kiểm tra hiển thị block`, async () => {
        await reviewAppPage.settingDesignAndContentWithSDK(dataContent[i]);
        await reviewAppPage.clickOnBtnWithLabel("Save");
        await expect(reviewAppPage.toastMessage).toContainText("All changes are saved");
        // truy cập domain store
        await homePageDesk.goto("/collections");
        await homePageDesk.page.waitForLoadState("domcontentloaded");
        // expect hover for details
        if (dataContent[i].hover_for_details) {
          await expect(homePageDesk.genLoc(reviewAppPage.hoverForDetail)).toBeVisible();
        } else {
          await expect(homePageDesk.genLoc(reviewAppPage.hoverForDetail)).toBeHidden();
        }
        // expect number of review
        if (dataContent[i].number_of_review) {
          await expect(homePageDesk.genLoc(reviewAppPage.numberOfReview)).toBeVisible();
        } else {
          await expect(homePageDesk.genLoc(reviewAppPage.numberOfReview)).toBeHidden();
        }
      });

      await test.step(`- Mobile: truy cập domain store  -> đến Product detail page-> kiểm tra hiển thị block`, async () => {
        // truy cập domain store
        await homePageMobile.goto("/collections");
        await homePageMobile.page.waitForLoadState("domcontentloaded");
        // expect hover for details
        if (dataContent[i].hover_for_details) {
          await expect(homePageMobile.genLoc(reviewAppPage.hoverForDetail)).toBeVisible();
        } else {
          await expect(homePageMobile.genLoc(reviewAppPage.hoverForDetail)).toBeHidden();
        }
        // expect number of review
        if (dataContent[i].number_of_review) {
          await expect(homePageMobile.genLoc(reviewAppPage.numberOfReview)).toBeVisible();
        } else {
          await expect(homePageMobile.genLoc(reviewAppPage.numberOfReview)).toBeHidden();
        }
      });
    }
  });

  test(`@SB_NEWECOM_ReV_72 [block Product Rating] kiểm tra hiển thị data của block trên Desktop khi thêm data source vào 1 section trống data source`, async ({
    page,
    conf,
  }) => {
    const dataContent = conf.caseConf.data_content;
    const expectDataSource = conf.caseConf.expect_data_source_with_product_rating;
    const homePageDesk = new SFHome(page, domain);

    await test.step(`Tại Customize page, click icon (+) trên Navigation Bar   -> trên Insert Panel, kéo thả block Product Rating đến section bất kỳ không chứa data source -> kiểm tra hiển thị Preview`, async () => {
      await reviewAppPage.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "collections",
      });
      await reviewAppPage.loadingScreen.waitFor();
      await reviewAppPage.reloadIfNotShow("web builder");
      await reviewAppPage.reloadIfNotShow("collections");
      await reviewAppPage.frameLocator.locator(reviewAppPage.productRating).waitFor({ state: "visible" });
      await reviewAppPage.clickOnElement(reviewAppPage.getSelectorByIndex({ section: 3 }), reviewAppPage.iframe);
      await reviewAppPage.switchToTab("Content");
    });

    for (let i = 0; i < dataContent.length; i++) {
      await test.step(`- click button Save - Desktop: truy cập domain store-> kiểm tra hiển thị block`, async () => {
        await reviewAppPage.settingDesignAndContentWithSDK(dataContent[i]);
        await reviewAppPage.clickOnBtnWithLabel("Save");
        await expect(reviewAppPage.toastMessage).toContainText("All changes are saved");
        // truy cập domain store
        await homePageDesk.goto("/collections");
        await homePageDesk.page.waitForLoadState("domcontentloaded");
        const numberOfReview = await homePageDesk.genLoc(reviewAppPage.numberOfReview).textContent();
        if (dataContent[i].variable.source.type === "product") {
          expect(numberOfReview).toContain(expectDataSource.has_data_source);
        } else {
          expect(numberOfReview).toContain(expectDataSource.no_data_source);
        }
      });
    }
  });

  test(`@SB_NEWECOM_ReV_78 [block Rating] kiểm tra edit tab Design và Content thành công`, async ({
    page,
    snapshotFixture,
    conf,
  }) => {
    const homePageDesk = new SFHome(page, domain);
    await test.step(`- Tại Customize page, click mở block Rating -> thực hiện setting tab Design và Content(data setting trong gg sheet [Block Rating] )`, async () => {
      await reviewAppPage.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "collections",
      });
      await reviewAppPage.loadingScreen.waitFor();
      await reviewAppPage.reloadIfNotShow("web builder");
      await reviewAppPage.reloadIfNotShow("collections");
      await reviewAppPage.frameLocator.locator(reviewAppPage.productRating).waitFor({ state: "visible" });
      await reviewAppPage.clickOnElement(reviewAppPage.productRating, reviewAppPage.iframe);
      await reviewAppPage.switchToTab("Content");
      await reviewAppPage.settingDesignAndContentWithSDK(conf.caseConf.data_content);
      await reviewAppPage.switchToTab("Design");
      await reviewAppPage.settingDesignAndContentWithSDK(conf.caseConf.data_design);
    });

    await test.step(`- click button Save - Desktop: truy cập domain store -> kiểm tra hiển thị block`, async () => {
      await reviewAppPage.clickOnBtnWithLabel("Save");
      await expect(reviewAppPage.toastMessage).toContainText("All changes are saved");
      // truy cập domain store
      await homePageDesk.goto("/collections");
      await homePageDesk.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: homePageDesk.page,
        selector: homePageDesk.page.locator(reviewAppPage.productRating),
        snapshotName: conf.caseConf.expect_snapshot,
      });
    });
  });
});
