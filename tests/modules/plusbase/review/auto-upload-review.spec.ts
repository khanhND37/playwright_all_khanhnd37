import { expect } from "@core/fixtures";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { test } from "@fixtures/odoo";
import { ProductPage } from "@pages/dashboard/products";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { AppReviewPage } from "@pages/dashboard/apps/app_review";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { OcgLogger } from "@core/logger";
import { AutoUploadReview } from "./auto-upload-review";
import { PlusbasePrivateRequestPage } from "@pages/dashboard/plusbase/private_request";
import { APIRequestContext } from "@playwright/test";
import { ShippingAddress } from "../warehouse_plushub/warehouse_plb";
import { PlbCatalogProduct, Reviews } from "@types";
import { ReviewAppAPI } from "@pages/api/apps/review_apps/review_apps";

test.describe("Auto upload review", async () => {
  let plusbasePrivateRequestPage: PlusbasePrivateRequestPage;
  let plusbasePage: DropshipCatalogPage;
  let productPage: ProductPage;
  let appReviewPage: AppReviewPage;
  let plusbaseProductAPI: PlusbaseProductAPI;
  let productId: number;
  let domain: string;
  let aliUrl: string;
  let checkoutPage: SFCheckout;
  let minRate: number;
  let sbProductId: number;
  let customerInfo: ShippingAddress;
  let reviewAPI: ReviewAppAPI;
  let dataReviewInApp: Array<Reviews>;
  let countReview: number;
  let dataReview: PlbCatalogProduct;
  let nameReviewer: string;
  let authRequestPlb: APIRequestContext;
  const logger = OcgLogger.get();

  test.beforeEach(async ({ conf, multipleStore }) => {
    domain = conf.suiteConf.domain;
    authRequestPlb = await multipleStore.getAuthRequest(
      conf.suiteConf.username,
      conf.suiteConf.password,
      domain,
      conf.suiteConf.shop_id,
      conf.suiteConf.user_id,
    );
    const dashboardPlbPage = await multipleStore.getDashboardPage(
      conf.suiteConf.username,
      conf.suiteConf.password,
      domain,
      conf.suiteConf.shop_id,
      conf.suiteConf.user_id,
    );
    plusbasePage = new DropshipCatalogPage(dashboardPlbPage, domain);
    productPage = new ProductPage(dashboardPlbPage, domain);
    plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequestPlb);
    plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(dashboardPlbPage, domain);
    reviewAPI = new ReviewAppAPI(domain, conf.suiteConf.shop_id, authRequestPlb);
    aliUrl = conf.caseConf.ali_url;
    minRate = conf.suiteConf.min_rate;
    customerInfo = conf.suiteConf.customer_info;
    productId = conf.caseConf.product_id;
    nameReviewer = conf.suiteConf.name_reviewer;
  });

  test(`@SB_PLB_IPR_16 Verify hiển thị review khi import link Ali có review`, async ({
    context,
    scheduler,
    odoo,
    conf,
  }) => {
    let scheduleData: AutoUploadReview;

    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as AutoUploadReview;
    } else {
      logger.info("Init default object");
      scheduleData = {
        productIds: null,
      };

      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
    }
    await test.step(`Vào menu "Dropship Products" > Vào "AliExpress Product" > Thực hiện Import link Ali `, async () => {
      if (!scheduleData.productIds) {
        await plusbasePage.goToImportAliexpressProductPage();
        await plusbasePage.fillUrlToRequestProductTextArea(aliUrl);
        await plusbasePage.clickImportAliexpressLink();
        expect(plusbasePage.page.url()).toContain("aliexpress-products");
      }
    });

    await test.step(`Click vào product vừa request > Verify block reviews trong màn SO detail`, async () => {
      productId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 10);
      await plusbasePage.goToProductRequestDetail(productId);
      scheduleData.productIds = productId;
      const firstReviewer = await plusbasePage.page.locator(plusbasePage.xpathNameReviewer(nameReviewer)).count();
      if (firstReviewer == 1) {
        await scheduler.schedule({ mode: "later", minutes: 5 });
        await scheduler.setData(scheduleData);
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      logger.info("Clear scheduling");
      await scheduler.clear();
      await plusbasePage.page.reload();
      await plusbasePage.waitUntilElementVisible(plusbasePage.xpathBoxReview);
      dataReview = await plusbaseProductAPI.getProductCatalogDetail(scheduleData.productIds, { type: "private" });
      countReview = dataReview.review_statistics.review_data.length;
      for (let i = 0; i < countReview; i++) {
        expect(dataReview.review_statistics.review_data[i].rate).toBeGreaterThanOrEqual(minRate);
      }
    });

    await test.step(`Click button "Import to your store" > Add to store > Click "Edit product"  > Verify hiển thị box Review`, async () => {
      await plusbasePage.clickBtnImportToStore();
      await plusbasePage.importFirstProductToStore();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        plusbasePage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForLoadState("load");
      await expect(productPage.genLoc(productPage.xpathBoxReview)).toBeVisible();
    });

    await test.step(`Click "You reviews are ready"`, async () => {
      const [reviewPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickOnTextLinkWithLabel("Your reviews are ready"),
      ]);
      appReviewPage = new AppReviewPage(reviewPage, domain);
      await appReviewPage.waitUntilElementVisible(appReviewPage.xpathLineReview);
      expect(await appReviewPage.countLineItemReview()).toEqual(countReview);
    });

    await test.step(`Ở product detail > Click View > Click Add to cart > Click Checkout > Verify Review màn checkout`, async () => {
      const [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View"),
      ]);
      await SFPage.waitForLoadState("networkidle");
      const productSFPage = new SFProduct(SFPage, domain);
      await productSFPage.addProductToCart();
      checkoutPage = await productSFPage.navigateToCheckoutPage();
      await checkoutPage.enterShippingAddress(customerInfo);
      await expect(checkoutPage.genLoc(checkoutPage.xpathSectionReview)).toBeVisible();
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithMethod("Stripe");
      await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toHaveCount(1);
      await expect(checkoutPage.genLoc(checkoutPage.xpathSectionReview)).toBeVisible();
      await productPage.deleteProductInProductDetail();
      // Delete quotation, product template partner
      await plusbasePage.cleanProductAfterRequest(odoo, plusbaseProductAPI, {
        url: aliUrl,
        odoo_partner_id: conf.suiteConf.partner_id,
        cancel_reason_id: 3,
        skip_if_not_found: true,
      });
    });
  });

  test(`@SB_PLB_IPR_21 Verify hiển thị review với các sản phẩm Private request`, async ({ context }) => {
    await test.step(`Login vào store PlusBase > Catalog > Private request  > Search product > Verify block Reviews trong product private detail`, async () => {
      await plusbasePrivateRequestPage.goToQuotationDetail(productId);
      await plusbasePage.waitUntilElementVisible(plusbasePage.xpathBoxReview);
      await expect(plusbasePage.page.locator(plusbasePage.xpathNameReviewer(nameReviewer))).toBeVisible();
      dataReview = await plusbaseProductAPI.getProductCatalogDetail(productId, { type: "private" });
      countReview = dataReview.review_statistics.review_data.length;
      for (let i = 0; i < countReview; i++) {
        expect(dataReview.review_statistics.review_data[i].rate).toBeGreaterThanOrEqual(minRate);
      }
    });

    await test.step(`Click button "Import to your store" > Add to store > Click "Edit product"  > Verify hiển thị box Review`, async () => {
      await plusbasePage.clickBtnImportToStore();
      await plusbasePage.importFirstProductToStore();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        plusbasePage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForLoadState("load");
      await expect(productPage.genLoc(productPage.xpathBoxReview)).toBeVisible();
    });

    await test.step(`Click "You reviews are ready"`, async () => {
      const [reviewPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickOnTextLinkWithLabel("Your reviews are ready"),
      ]);
      appReviewPage = new AppReviewPage(reviewPage, domain);
      await appReviewPage.waitUntilElementVisible(appReviewPage.xpathLineReview);
      expect(await appReviewPage.countLineItemReview()).toEqual(countReview);
    });

    await test.step(`Vào SF > Click Add to cart > Click Checkout > Verify Review màn checkout`, async () => {
      const [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View"),
      ]);
      await SFPage.waitForLoadState("networkidle");
      const productSFPage = new SFProduct(SFPage, domain);
      await productSFPage.addProductToCart();
      checkoutPage = await productSFPage.navigateToCheckoutPage();
      await checkoutPage.enterShippingAddress(customerInfo);
      await expect(checkoutPage.genLoc(checkoutPage.xpathSectionReview)).toBeVisible();
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithMethod("Stripe");
      await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toHaveCount(1);
      await expect(checkoutPage.genLoc(checkoutPage.xpathSectionReview)).toBeVisible();
      //delete product
      await productPage.deleteProductInProductDetail();
    });
  });

  test(`@SB_PLB_IPR_20 Verify hiển thị review với các sản phẩm Catalog`, async ({ context }) => {
    await test.step(`Login vào store PlusBase > Catalog > Catalog > Search product > Verify block Reviews trong product catalog detail`, async () => {
      await plusbasePage.goToProductCatalogDetailById(productId);
      await plusbasePage.waitUntilElementVisible(plusbasePage.xpathBoxReview);
      await expect(plusbasePage.page.locator(plusbasePage.xpathNameReviewer(nameReviewer))).toBeVisible();
      dataReview = await plusbaseProductAPI.getProductCatalogDetail(productId);
      countReview = dataReview.review_statistics.review_data.length;
      for (let i = 0; i < countReview; i++) {
        expect(dataReview.review_statistics.review_data[i].rate).toBeGreaterThanOrEqual(minRate);
      }
    });

    await test.step(`Click button "Import to your store" > Add to store > Click "Edit product"  > Verify hiển thị box Review`, async () => {
      await plusbasePage.clickBtnImportToStore();
      await plusbasePage.importFirstProductToStore();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        plusbasePage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForLoadState("load");
      await expect(productPage.genLoc(productPage.xpathBoxReview)).toBeVisible();
    });

    await test.step(`Click "You reviews are ready"`, async () => {
      const [reviewPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickOnTextLinkWithLabel("Your reviews are ready"),
      ]);
      appReviewPage = new AppReviewPage(reviewPage, domain);
      await appReviewPage.waitUntilElementVisible(appReviewPage.xpathLineReview);
      expect(await appReviewPage.countLineItemReview()).toEqual(countReview);
    });

    await test.step(`Ở product detail > Click View > Click Add to cart > Click Checkout > Verify Review màn checkout`, async () => {
      const [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View"),
      ]);
      await SFPage.waitForLoadState("networkidle");
      const productSFPage = new SFProduct(SFPage, domain);
      await productSFPage.addProductToCart();
      checkoutPage = await productSFPage.navigateToCheckoutPage();
      await checkoutPage.enterShippingAddress(customerInfo);
      await expect(checkoutPage.genLoc(checkoutPage.xpathSectionReview)).toBeVisible();
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithMethod("Stripe");
      await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toHaveCount(1);
      await expect(checkoutPage.genLoc(checkoutPage.xpathSectionReview)).toBeVisible();

      //delete product
      await productPage.deleteProductInProductDetail();
    });
  });

  test(`@SB_PLB_IPR_19 Verify hiển thị review khi import link Ali không có review`, async ({ context, conf, odoo }) => {
    await test.step(`Vào menu "Dropship Products" > Vào "AliExpress Product" > Thực hiện Import link Ali `, async () => {
      // Delete quotation, product template partner
      await plusbasePage.cleanProductAfterRequest(odoo, plusbaseProductAPI, {
        url: aliUrl,
        odoo_partner_id: conf.suiteConf.partner_id,
        cancel_reason_id: 3,
        skip_if_not_found: true,
      });
      await plusbasePage.goToImportAliexpressProductPage();
      await plusbasePage.fillUrlToRequestProductTextArea(aliUrl);
      await plusbasePage.clickImportAliexpressLink();
      await plusbasePage.waitProductCrawlSuccessWithUrl(plusbaseProductAPI, aliUrl, conf.suiteConf.max_retry_time);
      expect(plusbasePage.page.url()).toContain("aliexpress-products");
    });

    await test.step(`Click vào product vừa request > Verify block reviews trong màn SO detail`, async () => {
      productId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 10);
      await plusbasePage.goToProductRequestDetail(productId);
      await plusbasePage.page.reload();
      await plusbasePage.waitUntilElementVisible(plusbasePage.xpathBoxReview);
      dataReview = await plusbaseProductAPI.getProductCatalogDetail(productId, { type: "private" });
      countReview = dataReview.review_statistics.review_data.length;
      for (let i = 0; i < countReview; i++) {
        expect(dataReview.review_statistics.review_data[i].rate).toBeGreaterThanOrEqual(minRate);
      }
      await expect(plusbasePage.page.locator(plusbasePage.xpathNameReviewer(nameReviewer))).toBeVisible();
    });

    await test.step(`Click button "Import to your store" > Add to store > Click "Edit product"  > Verify hiển thị box Review  `, async () => {
      await plusbasePrivateRequestPage.clickBtnImportToStore();
      await plusbasePrivateRequestPage.importFirstProductToStore();

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        plusbasePage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForLoadState("load");
      await expect(productPage.genLoc(productPage.xpathBoxReview)).toBeVisible();
      sbProductId = Number(await productPage.getProductIDByURL());
    });

    await test.step(`Click "You reviews are ready"`, async () => {
      const [reviewPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickOnTextLinkWithLabel("Your reviews are ready"),
      ]);
      appReviewPage = new AppReviewPage(reviewPage, domain);
      await expect(async () => {
        dataReviewInApp = (await reviewAPI.getReviewInAppByProductId(sbProductId)).reviews;
        expect(dataReviewInApp.length).toEqual(conf.caseConf.total_review);
      }).toPass();
    });

    await test.step(`Ở product detail > Click View > Click Add to cart > Click Checkout > Verify Review màn checkout`, async () => {
      const [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View"),
      ]);
      await SFPage.waitForLoadState("networkidle");
      const productSFPage = new SFProduct(SFPage, domain);
      await productSFPage.addProductToCart();
      checkoutPage = await productSFPage.navigateToCheckoutPage();
      await checkoutPage.enterShippingAddress(customerInfo);
      await expect(checkoutPage.genLoc(checkoutPage.xpathSectionReview)).toBeVisible();
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithMethod("Stripe");
      await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toHaveCount(1);
      await expect(checkoutPage.genLoc(checkoutPage.xpathSectionReview)).toBeVisible();
      //delete product
      await productPage.deleteProductInProductDetail();
    });
  });
});
