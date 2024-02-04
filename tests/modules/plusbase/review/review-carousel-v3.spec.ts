import { test } from "@fixtures/odoo";
import { expect } from "@core/fixtures";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { SFProduct } from "@pages/storefront/product";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { Product } from "@types";
import { ReviewAppAPI } from "@pages/api/apps/review_apps/review_apps";
import { WbWebsitePages } from "@pages/dashboard/wb-website-page";

let domain: string;
let webBuilder: WebBuilder;
let dataReviewOf: Array<string>;
let otherPageSf: SFProduct;
let reviewAPI: ReviewAppAPI;
let totalReviews, totalReviewsCarousel, totalReviewOnly: number;
let productCheckout: Array<Product>;
let productId: number;
let checkout: SFCheckout;
let minRate, minLength: number;
let wbWebsitePages: WbWebsitePages;

test.describe("Review carousel v3", () => {
  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    domain = conf.suiteConf.domain;
    webBuilder = new WebBuilder(dashboard, domain);
    wbWebsitePages = new WbWebsitePages(dashboard, domain);
    reviewAPI = new ReviewAppAPI(domain, conf.suiteConf.shop_id, authRequest);
    dataReviewOf = conf.suiteConf.data_review_of;
    totalReviews = conf.caseConf.total_reviews;
    totalReviewOnly = conf.suiteConf.total_reviews_only;
    totalReviewsCarousel = conf.suiteConf.total_reviews_carousel;
    productCheckout = conf.caseConf.product_checkout;
    productId = conf.caseConf.product_id;
    minRate = conf.suiteConf.min_rate;
    minLength = conf.suiteConf.min_length;
  });

  test.afterEach(async ({ conf }) => {
    const totalBlockReview = await webBuilder.frameLocator.locator(webBuilder.xpathBlockReview).count();
    for (let i = 0; i < totalBlockReview; i++) {
      if (totalBlockReview >= 1) {
        await webBuilder.removeLayer({
          sectionName: conf.caseConf.section_name,
          sectionIndex: 1,
          subLayerName: "Product Reviews",
          subLayerIndex: i + 1,
        });
        await webBuilder.clickSaveButton();
      }
    }
  });

  test(`@SB_APP_RV_RC_63 [Theme v3] Verify setting block review`, async ({ snapshotFixture, conf, dashboard }) => {
    await test.step(` Mở WB > Kéo block vào khu vực có data > Verify data default của block`, async () => {
      await webBuilder.openCustomizeTheme(dashboard, domain);
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.block_template);
      await webBuilder.page.getByText("Design", { exact: true }).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: webBuilder.xpathSidebar,
        snapshotName: `${conf.caseConf.screen_shot_design}_${process.env.ENV}.png`,
        sizeCheck: true,
      });
    });

    await test.step(`Vào cột content > Select Review of > Verify data setting`, async () => {
      await webBuilder.page.getByText("Content", { exact: true }).click();
      for (let i = 0; i < dataReviewOf.length; i++) {
        await webBuilder.selectDropDown("show", dataReviewOf[i]);
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          selector: webBuilder.xpathSidebar,
          snapshotName: `${conf.caseConf.screen_shot_content}_${i + 1}_${process.env.ENV}.png`,
          sizeCheck: true,
        });
      }
    });

    await test.step(`Verify tool tip Review of,Feature review only`, async () => {
      const dataToolTip = conf.suiteConf.data_tool_tip;
      for (let i = 0; i <= dataToolTip; i++) {
        await webBuilder.page.locator(webBuilder.xpathIconToolTipReview(dataToolTip.label[i])).hover();
        await expect(webBuilder.visibleTooltip).toContainText(dataToolTip.tool_tip[i]);
      }
    });

    await test.step(`Click tab Design > Verify các layout hiển thị`, async () => {
      const dataLayouts = conf.suiteConf.data_layouts;
      for (let i = 0; i < dataLayouts.length; i++) {
        await webBuilder.selectLayOutOfProductReview(dataLayouts[i]);
        if (!dataLayouts[i].layout.includes("List")) {
          await snapshotFixture.verifyWithIframe({
            page: webBuilder.page,
            selector: webBuilder.xpathCardLayout,
            snapshotName: `${conf.caseConf.screen_shot_layout}_${i + 1}_${process.env.ENV}.png`,
            sizeCheck: true,
          });
        }
      }
    });
  });

  test(`@SB_APP_RV_RC_68 [Theme v3] Verify hiển thị block review ở page khác checkout page`, async ({
    dashboard,
    context,
    conf,
  }) => {
    await webBuilder.openCustomizeTheme(dashboard, domain);
    await webBuilder.selectPageOnPageSelector("Product detail");
    await wbWebsitePages.waitForElementVisibleThenInvisible(wbWebsitePages.overlay);
    await webBuilder.dragAndDropInWebBuilder(conf.caseConf.block_template);
    await webBuilder.selectDropDown("show", dataReviewOf[0]);
    await expect(webBuilder.page.locator(webBuilder.xpathBtnWithLabel("featured_reviews_only"))).toHaveAttribute(
      "value",
      "false",
    );

    await test.step(`Click Preview on new tab > Verify block ngoài SF`, async () => {
      await webBuilder.clickSaveButton();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      otherPageSf = new SFProduct(newPage, domain);
      await otherPageSf.page.waitForLoadState("networkidle");
      expect((await reviewAPI.getReviewSF(false)).total).toEqual(totalReviews);
    });

    await test.step(`Quay lại WB > Tắt button "Feature Reviews only" > Click Save > Click Preview on new tab > Verify block review ngoài SF`, async () => {
      await webBuilder.switchToggle("featured_reviews_only", true);
      await webBuilder.clickSaveButton();
      await otherPageSf.page.reload();
      await otherPageSf.waitUntilElementVisible(otherPageSf.xpathBlockReview);
      expect((await reviewAPI.getReviewSF(true)).total).toEqual(totalReviewOnly);
      const dataReviews = (await reviewAPI.getReviewSF(true)).reviews;
      for (let i = 0; i < dataReviews.length; i++) {
        expect(dataReviews[i].rating).toBeGreaterThanOrEqual(minRate);
        expect(dataReviews[i].content.length).toBeGreaterThanOrEqual(minLength);
        expect(dataReviews[i].images).not.toEqual(null);
      }
    });
  });

  test(`@SB_APP_RV_RC_69 [Theme v3] Verify hiển thị block review ở checkout page khi chọn Review of là All products`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const dataLayout = conf.suiteConf.data_layout;

    await webBuilder.openCustomizeTheme(dashboard, domain);
    await webBuilder.selectPageOnPageSelector("Checkout");
    await wbWebsitePages.waitForElementVisibleThenInvisible(wbWebsitePages.overlay);
    await webBuilder.dragAndDropInWebBuilder(conf.caseConf.block_template);
    await webBuilder.selectDropDown("show", dataReviewOf[0]);
    expect(
      await webBuilder.page.locator(webBuilder.xpathBtnWithLabel("featured_reviews_only")).getAttribute("value"),
    ).toEqual("false");
    await webBuilder.selectLayOutOfProductReview(dataLayout[0]);

    await test.step(`Click Preview on new tab > Verify block ngoài SF`, async () => {
      await webBuilder.clickSaveButton();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      otherPageSf = new SFProduct(newPage, domain);
      await otherPageSf.page.waitForLoadState("load");
      expect((await reviewAPI.getReviewSF(false, true)).total).toEqual(totalReviewsCarousel);
    });

    await test.step(`Quay lại WB > Tắt button "Feature Reviews only" > Click Save > Click Preview on new tab > Verify block review ngoài SF`, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.switchToggle("featured_reviews_only", true);
      await webBuilder.clickSaveButton();
      await otherPageSf.page.reload();
      await otherPageSf.waitUntilElementVisible(otherPageSf.xpathBlockReview);
      expect((await reviewAPI.getReviewSF(true)).total).toEqual(totalReviewOnly);
      const dataReviews = (await reviewAPI.getReviewSF(true, true, productId)).reviews;
      for (let i = 0; i < dataReviews.length; i++) {
        expect(dataReviews[i].rating).toBeGreaterThanOrEqual(minRate);
        expect(dataReviews[i].content.length).toBeGreaterThanOrEqual(minLength);
        expect(dataReviews[i].images).not.toEqual(null);
      }
    });
  });

  test(`@SB_APP_RV_RC_73 [Theme v3] Verify hiển thị block review ở checkout page khi chọn Review of là Specific Product`, async ({
    dashboard,
    conf,
    authRequest,
    context,
  }) => {
    const dataLayout = conf.suiteConf.data_layout;
    const customerInfo = conf.suiteConf.customer_info;
    const shippingAddress = conf.suiteConf.shipping_address;
    await webBuilder.openCustomizeTheme(dashboard, domain);
    await webBuilder.selectPageOnPageSelector("Checkout");
    await wbWebsitePages.waitForElementVisibleThenInvisible(wbWebsitePages.overlay);
    await webBuilder.clickOnElement(
      webBuilder.getSelectorByIndex({ section: conf.suiteConf.section_number }),
      webBuilder.iframe,
    );
    await webBuilder.selectDropDownDataSource("variable", {
      category: "Product",
      source: "Test product review carousel v3",
    });
    await webBuilder.dragAndDropInWebBuilder(conf.caseConf.block_template);
    await webBuilder.selectDropDown("show", dataReviewOf[1]);
    expect(
      await webBuilder.page.locator(webBuilder.xpathBtnWithLabel("featured_reviews_only")).getAttribute("value"),
    ).toEqual("false");
    await webBuilder.selectLayOutOfProductReview(dataLayout[0]);
    await wbWebsitePages.waitForElementVisibleThenInvisible(wbWebsitePages.overlay);

    await test.step(`Click Preview on new tab > Verify block ngoài SF`, async () => {
      await webBuilder.clickSaveButton();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      checkout = new SFCheckout(newPage, domain);
      await checkout.page.waitForLoadState("load");
      const checkoutAPI = new CheckoutAPI(domain, authRequest, newPage);
      await expect(checkout.genLoc(checkout.xpathBlockReview)).toBeVisible();
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, customerInfo.email, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await expect(checkout.genLoc(checkout.xpathBlockReview)).toBeVisible();
      const dataReviews = (await reviewAPI.getReviewSF(false, true, productId)).reviews;
      for (let i = 0; i < dataReviews.length; i++) {
        expect(dataReviews[i].rating).toBeGreaterThanOrEqual(minRate);
        expect(dataReviews[i].content.length).toBeGreaterThanOrEqual(minLength);
      }
      expect((await reviewAPI.getReviewSF(false, true, productId)).total).toEqual(totalReviews);
    });

    await test.step(`Quay lại WB > Tắt button "Feature Reviews only" > Click Save > Click Preview on new tab > Verify block review ngoài SF`, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.switchToggle("featured_reviews_only", true);
      await webBuilder.clickSaveButton();
      await checkout.page.reload();
      await checkout.waitUntilElementVisible(checkout.xpathBlockReview);
      const dataReviews = await reviewAPI.getReviewSF(true, true, productId);
      expect(dataReviews.total).toEqual(totalReviews);
      for (let i = 0; i < dataReviews.reviews.length; i++) {
        expect(dataReviews.reviews[i].rating).toBeGreaterThanOrEqual(minRate);
        expect(dataReviews.reviews[i].content.length).toBeGreaterThanOrEqual(minLength);
        expect(dataReviews.reviews[i].images).not.toEqual(null);
      }
    });
  });

  test(`@SB_APP_RV_RC_70 [Theme v3] Verify hiển thị block review ở checkout page khi chọn Review of là Product in cart`, async ({
    dashboard,
    conf,
    context,
    authRequest,
  }) => {
    const dataLayout = conf.suiteConf.data_layout;
    const customerInfo = conf.suiteConf.customer_info;
    const shippingAddress = conf.suiteConf.shipping_address;

    await test.step(`Mở WB > Chọn page >  ở Basics: Kéo block  Review vào khu vực Page  > Thực hiện setting Review of > Click Save`, async () => {
      await webBuilder.openCustomizeTheme(dashboard, domain);
      await webBuilder.selectPageOnPageSelector("Checkout");
      await wbWebsitePages.waitForElementVisibleThenInvisible(wbWebsitePages.overlay);
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.block_template);
      await webBuilder.selectDropDown("show", dataReviewOf[2]);
      expect(
        await webBuilder.page.locator(webBuilder.xpathBtnWithLabel("featured_reviews_only")).getAttribute("value"),
      ).toEqual("false");
      await webBuilder.selectLayOutOfProductReview(dataLayout[0]);
      await wbWebsitePages.waitForElementVisibleThenInvisible(wbWebsitePages.overlay);
    });

    await test.step(`Click Preview on new tab > Verify block ngoài SF`, async () => {
      await webBuilder.clickSaveButton();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      checkout = new SFCheckout(newPage, domain);
      const checkoutAPI = new CheckoutAPI(domain, authRequest, newPage);
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, customerInfo.email, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await expect(checkout.genLoc(checkout.xpathBlockReview)).toBeVisible();
      const dataReviews = (await reviewAPI.getReviewSF(false, true, productId)).reviews;
      for (let i = 0; i < dataReviews.length; i++) {
        expect(dataReviews[i].rating).toBeGreaterThanOrEqual(minRate);
        expect(dataReviews[i].content.length).toBeGreaterThanOrEqual(minLength);
      }
      expect((await reviewAPI.getReviewSF(false, true, productId)).total).toEqual(totalReviews);
    });

    await test.step(`Quay lại WB > Tắt button "Feature Reviews only" > Click Save > Click Preview on new tab > Verify block review ngoài SF`, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.switchToggle("featured_reviews_only", true);
      await webBuilder.clickSaveButton();
      await checkout.page.reload();
      await checkout.waitUntilElementVisible(checkout.xpathBlockReview);
      const dataReviews = await reviewAPI.getReviewSF(true, true, productId);
      expect(dataReviews.total).toEqual(totalReviews);
      for (let i = 0; i < dataReviews.reviews.length; i++) {
        expect(dataReviews.reviews[i].rating).toBeGreaterThanOrEqual(minRate);
        expect(dataReviews.reviews[i].content.length).toBeGreaterThanOrEqual(minLength);
        expect(dataReviews.reviews[i].images).not.toEqual(null);
      }
    });
  });
});
