import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import type { DataShipping, PlbCatalogProduct, RequestProductData, ShippingFee, SupportedCountryData } from "@types";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { DashboardAPI } from "@pages/api/dashboard";
import { SFCheckout } from "@sf_pages/checkout";
import { CheckoutAPI } from "@pages/api/checkout";
import { OdooService } from "@services/odoo";
import { removeCurrencySymbol } from "@core/utils/string";
import { APIRequestContext } from "@playwright/test";
import { SFProduct } from "@pages/storefront/product";
import { AppReviewPage } from "@pages/dashboard/apps/app_review";
import { CJDropshippingAPI } from "@pages/thirdparty/cj-dropshipping";

test.describe("CJ Dropshipping request", async () => {
  let domain: string;
  let productPage: ProductPage;
  let plusbasePage: DropshipCatalogPage;
  let supportedCountryData: SupportedCountryData;
  let checkoutPage: SFCheckout;
  let productId: number;
  let countReview: number;
  let cjUrl: string;
  let plusbaseProductAPI: PlusbaseProductAPI;
  let appReviewPage: AppReviewPage;
  let dataReview: PlbCatalogProduct;
  let cjDropshippingAPI: CJDropshippingAPI;
  let authRequestShopNotSent: APIRequestContext;
  let accessToken: string;

  test.beforeAll(async ({ authRequest, conf }) => {
    domain = conf.suiteConf.domain;
    cjDropshippingAPI = new CJDropshippingAPI(authRequest);
    accessToken = await cjDropshippingAPI.getAccessToken(conf.suiteConf.email_user, conf.suiteConf.api_key);
  });

  test.beforeEach(async ({ conf, authRequest, dashboard }) => {
    plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    plusbasePage = new DropshipCatalogPage(dashboard, domain);
    productPage = new ProductPage(dashboard, domain);
    cjUrl = conf.caseConf.cj_url;
    productId = conf.caseConf.product_id;
  });

  test(`Verify country support khi request link CJ không support 1 số nước @SB_PLB_CJ_RC_12`, async ({
    conf,
    odoo,
  }) => {
    const odooService = OdooService(odoo);

    await test.step(`Vào "Dropship products" > Chọn "Product request" > Chọn "Import product" > Input link CJ vào text box > Chọn  "Add link" > Chọn "Import product" `, async () => {
      await odooService.resetProductTemplateToResyncShipping(productId);
      const cjProductData: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: cjUrl, note: "" }],
        is_plus_base: true,
      };
      await plusbaseProductAPI.requestProductByAPI(cjProductData);
      await plusbasePage.waitProductCrawlSuccessWithUrl(plusbaseProductAPI, cjUrl, 10, true);
    });

    await test.step(`Vào "Catalog" > Chọn "Product request" > Search product by link request > Vào màn quotation detail > Verify shipping info`, async () => {
      const supportCountryIDs = await plusbasePage.getProductSupportedCountryIds(
        plusbaseProductAPI,
        productId,
        conf.caseConf.support_country_ids.length,
        conf.caseConf.max_retry_time,
        true,
      );
      expect(supportCountryIDs.every(country => conf.caseConf.support_country_ids.includes(country))).toEqual(true);
    });
  });

  test(`Verify country support khi checkout với product chưa báo giá và chưa config shipping type @SB_PLB_CJ_RC_10`, async ({
    dashboard,
    conf,
    odoo,
    authRequest,
  }) => {
    const dashboardAPI = new DashboardAPI(domain, authRequest);
    const checkoutAPI = new CheckoutAPI(domain, authRequest, dashboard);
    const odooService = OdooService(odoo);

    await test.step(`Pre-condition`, async () => {
      // Reset data and resync shipping
      await odooService.resetProductTemplateToResyncShipping(productId);
      const cjProductData: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: cjUrl, note: "" }],
        is_plus_base: true,
      };
      await plusbaseProductAPI.requestProductByAPI(cjProductData);
      await plusbasePage.waitProductCrawlSuccessWithUrl(plusbaseProductAPI, cjUrl, 10, true);

      // Get config data
      supportedCountryData = await plusbasePage.getSupportedCountryData(odoo, dashboardAPI, {
        configDeliveryCarrierId: conf.caseConf.delivery_carrier_id,
        shippingTypeId: conf.caseConf.shipping_type_id,
        ignoreCountryIds: conf.caseConf.ignore_support_country_ids,
      });
    });

    await test.step(`Kiểm tra số country hiển thị ở quotation detail`, async () => {
      const productSupportCountryIds = await plusbasePage.getProductSupportedCountryIds(
        plusbaseProductAPI,
        conf.caseConf.product_id,
        supportedCountryData.country_ids.length,
        conf.caseConf.max_retry_time,
        true,
      );
      expect(productSupportCountryIds.every(country => supportedCountryData.country_ids.includes(country))).toEqual(
        true,
      );
      await plusbasePage.waitAliDetailShippingBlockLoaded();
      // Verify select
      const productID = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, cjUrl, 1, true);
      await plusbasePage.goToProductRequestDetail(productID);
      const shippingNames = await plusbasePage.getShippingNamesInAliexpressDetail();
      expect(shippingNames.sort()).toEqual(supportedCountryData.country_names.sort());
    });

    await test.step(`Kiểm tra số lượng country hiển thị ở trang checkout`, async () => {
      await checkoutAPI.addProductToCartThenCheckout([
        {
          variant_id: conf.caseConf.sb_variant_id,
          quantity: 1,
        },
      ]);
      const checkoutSupportCountryCodes = await checkoutAPI.getAvailableShippingCountries();
      expect(checkoutSupportCountryCodes.country_codes.sort()).toEqual(supportedCountryData.country_codes.sort());
      // Due to checkout page on storefront is hidden when length of shipping methods = 1, use api instead of storefront
      const shippings = await checkoutAPI.getShippingMethodInfo(conf.caseConf.checkout_selected_country_code);
      expect(shippings).toHaveLength(1);
      expect(shippings[0].method_title).toContain("Standard Shipping");
    });
  });

  test(`Verify country support khi checkout với 2 shop cùng request 1 link, nhưng 1 shop đã sent quotation @SB_PLB_CJ_RC_09`, async ({
    dashboard,
    conf,
    multipleStore,
    authRequest,
    odoo,
  }) => {
    const dashboardShopNotSent = await multipleStore.getDashboardPage(
      conf.caseConf.shop_not_sent_quotation.username,
      conf.caseConf.shop_not_sent_quotation.password,
      conf.caseConf.shop_not_sent_quotation.domain,
      conf.caseConf.shop_not_sent_quotation.shop_id,
      conf.caseConf.shop_not_sent_quotation.user_id,
    );

    const shopNotSentDashboardPage = new DashboardPage(
      dashboardShopNotSent,
      conf.caseConf.shop_not_sent_quotation.domain,
    );

    authRequestShopNotSent = await multipleStore.getAuthRequest(
      conf.suiteConf.username,
      conf.suiteConf.password,
      domain,
      conf.suiteConf.shop_id,
      conf.suiteConf.user_id,
    );

    let countryCodesShop1,
      countryCodesShop2 = new Array<string>();

    //get country support in odoo by shipping type
    const odooService = OdooService(odoo);
    const countriesSupportByShippingTypeId = await odooService.getCountriesSupportByShippingTypeId(
      conf.caseConf.shipping_method_ids,
    );
    const countriesCodeSupportInOdoo = [];
    countriesSupportByShippingTypeId.forEach(country => {
      countriesCodeSupportInOdoo.push(country.code);
    });

    await test.step(`Thực hiện checkout ở shop 1`, async () => {
      const checkoutAPI = new CheckoutAPI(domain, authRequest, dashboard);
      await checkoutAPI.addProductToCartThenCheckout([
        {
          variant_id: conf.caseConf.sb_variant_id,
          quantity: 1,
        },
      ]);
      countryCodesShop1 = (await checkoutAPI.getAvailableShippingCountries()).country_codes;
      expect(countryCodesShop1.sort()).toEqual(countriesCodeSupportInOdoo.sort());

      // Check shipping name
      // Due to checkout page on storefront is hidden when length of shipping methods = 1, use api instead of storefront
      const shippings = await checkoutAPI.getShippingMethodInfo(conf.caseConf.checkout_selected_country_code);
      const validShippingNames = new Array<string>();
      for (const shippingName of conf.caseConf.shipping_names) {
        const validShippingName = shippings.find(element => element.method_title.trim() === shippingName.trim());
        if (validShippingName) {
          validShippingNames.push(shippingName);
        }
      }

      expect(validShippingNames.length).toEqual(conf.caseConf.shipping_names.length);
    });

    await test.step(`Thực hiện checkout ở shop 2`, async () => {
      const checkoutAPI = new CheckoutAPI(
        shopNotSentDashboardPage.domain,
        authRequestShopNotSent,
        shopNotSentDashboardPage.page,
      );
      await checkoutAPI.addProductToCartThenCheckout([
        {
          variant_id: conf.caseConf.shop_not_sent_quotation.sb_variant_id,
          quantity: 1,
        },
      ]);
      countryCodesShop2 = (await checkoutAPI.getAvailableShippingCountries()).country_codes;
      expect(countryCodesShop2.sort()).toEqual(conf.caseConf.shop_not_sent_quotation.support_country_codes.sort());
      // Due to checkout page on storefront is hidden when length of shipping methods = 1, use api instead of storefront
      const shippings = await checkoutAPI.getShippingMethodInfo(conf.caseConf.checkout_selected_country_code);
      expect(shippings).toHaveLength(1);
      expect(shippings[0].method_title).toContain("Standard Shipping");
    });

    await test.step(`So sánh thông tin shipping giữa 2 shop`, async () => {
      expect(countryCodesShop1.sort()).not.toEqual(countryCodesShop2.sort());
    });
  });

  test(`@SB_PLB_CJ_RC_08 Verify request với link product có shipping unavaiable`, async ({ conf, odoo }) => {
    // Delete quotation, product template partner
    await plusbasePage.cleanProductAfterRequest(odoo, plusbaseProductAPI, {
      url: cjUrl,
      odoo_partner_id: conf.suiteConf.partner_id,
      cancel_reason_id: conf.suiteConf.cancel_reason_id,
      not_ali: true,
      skip_if_not_found: true,
    });

    await test.step(`Tại menu bên trái chọn Dropship Products > Product request > Click button "Import product" > Thực hiện request sản phẩm CJ`, async () => {
      const cjProductData: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: cjUrl, note: "" }],
        is_plus_base: true,
      };
      await plusbaseProductAPI.requestProductByAPI(cjProductData);
      // Verify after request
      await plusbasePage.waitProductCrawlSuccessWithUrl(plusbaseProductAPI, cjUrl, 10, true);
    });

    await test.step(`Vào SO detail của  sản phẩm vừa request > Verify SO detail`, async () => {
      // Wait for crawl done
      await plusbasePage.searchAndClickViewRequestDetail(cjUrl);

      // Verify data
      expect(await plusbasePage.isTextVisible(conf.caseConf.message)).toEqual(true);
      expect(await plusbasePage.isTextVisible(conf.caseConf.text_link)).toEqual(true);
      expect(await plusbasePage.isTextVisible(conf.caseConf.full_product_name)).toBeTruthy();
    });
  });

  test(`@SB_PLB_CJ_RC_07 Verify base cost và shipping fee sau khi request link CJ product`, async ({ conf, odoo }) => {
    await test.step(`Vào Dashboard > Product request > Thực hiện request product > Mở product vừa request`, async () => {
      const cjProductData: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: cjUrl, note: "" }],
        is_plus_base: true,
      };
      await plusbaseProductAPI.requestProductByAPI(cjProductData);
      await plusbasePage.waitProductCrawlSuccessWithUrl(plusbaseProductAPI, cjUrl, 10, true);
    });

    await test.step(`Mở product vừa request > Verify basecost, shipping fee: First item, Additional item`, async () => {
      const productID = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, cjUrl, 1, true);
      await plusbasePage.goToProductRequestDetail(productID);
      const { variants } = await cjDropshippingAPI.getProductDetailCJ(conf.caseConf.product_id, accessToken);

      const productCost = await plusbasePage.getProductCostByVariant(conf.caseConf.variant_name);
      expect(Number(productCost)).toEqual(variants[0].variantSellPrice);

      const shippingData: DataShipping = { startCountryCode: "CN", endCountryCode: "US", products: [] };
      shippingData.products = variants.map(variant => ({ quantity: 1, vid: variant.vid }));
      const listPriceShip = await Promise.all(
        shippingData.products.map(
          async product =>
            (
              await cjDropshippingAPI.getShippingFee({ ...shippingData, products: [product] }, accessToken)
            )[0].logisticPrice,
        ),
      );
      const shippingFee = Math.min(...listPriceShip);
      // Tính shipping fee markup từ giá ship bên cj dropship
      const shippingFeeExp: ShippingFee = plusbasePage.markupShippingAliCj(shippingFee);
      // Verify shipping fee of first item
      const shippingFeeFirstItem = removeCurrencySymbol(await plusbasePage.getShipping(2));
      expect(Number(shippingFeeFirstItem)).toEqual(shippingFeeExp.first_item);
      // Verify shipping fee of additional item
      const shippingFeeAddItem = removeCurrencySymbol(await plusbasePage.getShipping(3));
      expect(Number(shippingFeeAddItem)).toEqual(shippingFeeExp.additional_item);

      // Clean data after request
      await plusbasePage.cleanProductAfterRequest(odoo, plusbaseProductAPI, {
        url: cjUrl,
        odoo_partner_id: conf.suiteConf.odoo_partner_id,
        cancel_reason_id: 3,
        not_ali: true,
        skip_if_not_found: true,
      });
    });
  });

  test(`@SB_PLB_CJ_RC_44 Verify hiển thị review khi import link CJ có review`, async ({ context, odoo, conf }) => {
    let productId: number;

    await test.step(`Vào menu "Dropship Products" > Vào "AliExpress Product" > Thực hiện Import link Ali `, async () => {
      const cjProductData: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: cjUrl, note: "" }],
        is_plus_base: true,
      };
      await plusbaseProductAPI.requestProductByAPI(cjProductData);
      await plusbasePage.waitProductCrawlSuccessWithUrl(plusbaseProductAPI, cjUrl, 10, true);
    });

    await test.step(`Click vào product vừa request > Verify block reviews trong màn SO detail`, async () => {
      productId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, cjUrl, 1, true);
      await plusbasePage.goToProductRequestDetail(productId);
      await plusbasePage.waitUntilElementVisible(plusbasePage.xpathBoxReview);
      dataReview = await plusbaseProductAPI.getProductCatalogDetail(productId, { type: "private" });
      countReview = dataReview.review_statistics.review_data.length;
      for (let i = 0; i < countReview; i++) {
        expect(dataReview.review_statistics.review_data[i].rate).toBeGreaterThanOrEqual(conf.caseConf.min_rate);
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
      await checkoutPage.enterShippingAddress(conf.suiteConf.customer_info);
      await expect(checkoutPage.genLoc(checkoutPage.xpathSectionReview)).toBeHidden();
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithMethod("Stripe");
      await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toHaveCount(1);
      await expect(checkoutPage.genLoc(checkoutPage.xpathSectionReview)).toBeHidden();
      await productPage.deleteProductInProductDetail();
      // Delete quotation, product template partner
      await plusbasePage.cleanProductAfterRequest(odoo, plusbaseProductAPI, {
        url: cjUrl,
        odoo_partner_id: conf.suiteConf.partner_id,
        cancel_reason_id: 3,
        not_ali: true,
        skip_if_not_found: true,
      });
    });
  });
});
