import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import type { AliexpressProductRequest, RequestProductData } from "@types";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { DashboardAPI } from "@pages/api/dashboard";
import { SFCheckout } from "@sf_pages/checkout";
import { CheckoutAPI } from "@pages/api/checkout";
import { OdooService } from "@services/odoo";

test.describe("Aliexpress request", async () => {
  let domain: string;
  let buttonsName: string;
  let dashboardPage: DashboardPage;
  let plusbasePage: DropshipCatalogPage;

  test.beforeEach(async ({ token, conf, page }) => {
    domain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(page, domain);
    const shopToken = await token.getWithCredentials({
      domain: domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;
    await dashboardPage.loginWithToken(accessToken);
    plusbasePage = new DropshipCatalogPage(dashboardPage.page, domain);
    buttonsName = conf.caseConf.buttons_name;
  });

  test(`Verify trang AliExpress request list @SB_PLB_CTL_ALP_1`, async ({ conf, authRequest }) => {
    const plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    await test.step(`Kiểm tra giao diện trang AliExpress request list`, async () => {
      await plusbasePage.goToProductRequest();
      for (const text of conf.caseConf.texts) {
        expect(await plusbasePage.isTextVisible(text)).toBeTruthy();
      }
      for (let i = 0; i < buttonsName.length; i++) {
        expect(await plusbasePage.isTextVisible(buttonsName[i], i + 1)).toBeTruthy();
      }
    });
    await test.step(`Kiểm tra data trong 5 tab: All, Processing, Available, No result, Expired`, async () => {
      plusbasePage.verifyTabActived("All");

      for (const tab of conf.caseConf.tabs) {
        await plusbasePage.clickTab(tab.name);

        // Verify item inside
        const badgesText = await plusbasePage.getBadgesText();
        const uniqueBadgesText = badgesText.filter(function (elem, index, self) {
          return index === self.indexOf(elem);
        });
        expect(uniqueBadgesText.length).toBeGreaterThanOrEqual(1);
        if (tab.name !== "All") {
          for (const text of uniqueBadgesText) {
            if (tab.name === "Available") {
              expect(["Available", "Imported"].includes(text.trim())).toBeTruthy();
            }
            if (tab.name === "Expired") {
              continue;
            } else {
              expect(text.trim()).toEqual(tab.name);
            }
          }
        }
        // Verify search action
        await plusbasePage.searchWithKeyword(tab.search_key);
        await plusbasePage.waitTabItemLoaded();
        expect(await plusbasePage.countSearchResult()).toEqual(1);
        await plusbasePage.searchWithKeyword("[notfound]");
        await expect(
          plusbasePage.page.locator(plusbasePage.xpathCheckMessageCheckTab("Sorry! We couldn't find any results")),
        ).toBeVisible();
        await plusbasePage.clearSearchInput();
        await plusbasePage.waitTabItemLoaded();
        // Verify sort
        const request: AliexpressProductRequest = {
          type: "private",
          tab: tab.query_tab,
          sort_field: "write_date",
          only_ali: true,
        };
        for (const sortMode of tab.sort_modes) {
          request.sort_mode = sortMode;
          const products = (await plusbaseProductAPI.getProducts(request)).products;
          expect(products.length).toBeGreaterThanOrEqual(1);

          if (products.length < 2) {
            break;
          }

          for (let index = 0; index < products.length; index++) {
            if (index + 1 === products.length) {
              break;
            }

            switch (sortMode) {
              case "desc":
                expect(products[index].requested_at).toBeGreaterThanOrEqual(products[index + 1].requested_at);
                break;
              case "asc":
                expect(products[index].requested_at).toBeLessThanOrEqual(products[index + 1].requested_at);
                break;
            }
          }
        }
      }
    });
  });
  test(`Kiểm tra các trạng thái sau khi import link AliExpress @SB_PLB_CTL_ALP_2`, async ({
    conf,
    authRequest,
    odoo,
  }) => {
    const plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);

    await test.step(`Click button Add AliExpress product`, async () => {
      await plusbasePage.goToProductRequest();
      await plusbasePage.clickOnBtnWithLabel("Add AliExpress product");
    });
    await test.step(`Điền nhiều link AliExpress vào ô Request product link`, async () => {
      // Clean data before request
      for (const urlRequest of conf.caseConf.urls_request) {
        await plusbasePage.cleanProductAfterRequest(odoo, plusbaseProductAPI, {
          url: urlRequest.url,
          odoo_partner_id: conf.suiteConf.odoo_partner_id,
          cancel_reason_id: conf.suiteConf.cancel_reason_id,
          skip_if_not_found: true,
        });
      }

      // Fill multiple url
      const urls: string[] = [];
      for (const request of conf.caseConf.urls_request) {
        urls.push(request.url);
      }
      urls.push(conf.caseConf.non_ali_url);
      await plusbasePage.fillUrlToRequestProductTextArea(urls.join("\n"));
      expect(await plusbasePage.countValidUrl()).toEqual(2);
    });
    await test.step(`Click button Send request`, async () => {
      await plusbasePage.clickImportAliexpressLink();
      // Verify current url
      expect(plusbasePage.page.url()).toContain("aliexpress-products");
    });
    await test.step(`Kiểm tra trạng thái của các link request ở trang product request list và trang product detail`, async () => {
      // Verify after request
      await expect(
        plusbasePage.page.locator(plusbasePage.xpathCheckMessageCheckTab("Please check again in 5 minutes.")),
      ).toBeVisible();

      for (const urlRequest of conf.caseConf.urls_request) {
        await plusbasePage.waitProductCrawlSuccessWithUrl(
          plusbaseProductAPI,
          urlRequest.url,
          conf.caseConf.max_retry_time,
        );
        await plusbasePage.page.reload();
        await plusbasePage.waitTabItemLoaded();

        await plusbasePage.searchWithKeyword(urlRequest.url);
        await plusbasePage.waitTabItemLoaded();

        // Verify status
        const badgesText = await plusbasePage.getBadgesText();
        badgesText.map(text => text.trim()).filter(text => text === urlRequest.state);
        switch (urlRequest.state) {
          case "No Result": // Có thể có nhiều sản phẩm no result
            expect(badgesText.length).toBeGreaterThanOrEqual(1);
            break;
          default: // Các status available, processing chỉ có 1 vào 1 thời điểm
            expect(badgesText.length).toEqual(1);
            break;
        }

        // Verify product detail
        await plusbasePage.clickProductItemBaseOnUrl(urlRequest.url);
        await plusbasePage.page.waitForSelector(
          `//*[contains(@class, 'sb-badge') and contains(text(), '${urlRequest.state}')]`,
        );
        await plusbasePage.goToProductRequest();
        // Note: old data will be cleaned when re-run test case
      }
    });
  });
  test(`Verify trang Import AliExpress products @SB_PLB_CTL_ALP_23`, async ({ conf }) => {
    await test.step(`Vào trang Import AliExpress products`, async () => {
      await plusbasePage.goToImportAliexpressProductPage();
      expect(await plusbasePage.isTextVisible("Import AliExpress products")).toBeTruthy();

      const requestFaqText = await plusbasePage.page.locator(plusbasePage.xpathFaq).innerText();
      expect(requestFaqText.trim()).toEqual(
        "Please note that some products on AliExpress cannot be imported. Learn more.",
      );

      const stepXpath = plusbasePage.xpathStep;
      expect(await plusbasePage.page.locator(stepXpath).count()).toEqual(3);

      // Verify data of every step
      for (let index = 0; index < conf.caseConf.steps.length; index++) {
        const step = conf.caseConf.steps[index];
        await expect(plusbasePage.page.locator(`${await plusbasePage.xpathCheckMessage(step.number)}`)).toBeVisible();
        await expect(plusbasePage.page.locator(`${await plusbasePage.xpathCheckMessage(step.title)}`)).toBeVisible();
        await expect(
          plusbasePage.page.locator(`${await plusbasePage.xpathCheckMessage(step.description)}`),
        ).toBeVisible();
        await plusbasePage.page.locator(`${stepXpath}[${index + 1}]//*[contains(@class, 'sb-icon')]`).hover();
        await plusbasePage.page.waitForSelector(`//img[contains(@src, '${step.img}')]`);
      }
    });
    await test.step(`Kiểm tra thông báo lỗi`, async () => {
      await expect(plusbasePage.page.locator(await plusbasePage.xpathCheckMessage("Add link"))).toBeDisabled();

      // Show error when fill non-ali url
      await plusbasePage.fillUrlToRequestProductTextArea(conf.caseConf.non_ali_url);
      expect(await plusbasePage.isTextVisible("Please enter valid URL from AliExpress")).toBeTruthy();

      // Only keep aliexpress url
      await plusbasePage.fillUrlToRequestProductTextArea([conf.caseConf.ali_url, conf.caseConf.non_ali_url].join("\n"));
      expect(await plusbasePage.countValidUrl()).toEqual(1);
    });
    await test.step(`Thực hiện import link aliexpress`, async () => {
      await plusbasePage.clickImportAliexpressLink();
    });
  });
  test(`Verify UI product với sản phẩm Available @SB_PLB_CTL_ALP_25`, async ({ dashboard, conf, authRequest }) => {
    const productPage = new ProductPage(dashboard, domain);
    let sbProductId: number;
    await test.step(`Verify data hiển thì ở màn Aliexpress products list`, async () => {
      await plusbasePage.goToProductRequest();

      await plusbasePage.searchWithKeyword(conf.caseConf.ali_url);
      await plusbasePage.waitTabItemLoaded();
      expect(await plusbasePage.countSearchResult()).toEqual(1);

      const data = await plusbasePage.getDataOfFirstProductInList();
      expect(data.product_name).toContain(conf.caseConf.product_name);
      expect(data.product_status).toEqual(conf.caseConf.product_status);
    });
    await test.step(`Verify data hiển thì ở màn Aliexpress product details`, async () => {
      await plusbasePage.clickProductItemBaseOnUrl(conf.caseConf.ali_url);
      await plusbasePage.page.waitForSelector(
        `//*[contains(@class, 'sb-badge') and contains(text(), '${conf.caseConf.product_status}')]`,
      );

      // Verify data
      const requestFaqText = await plusbasePage.page.locator(plusbasePage.xpathFaq).innerText();
      expect(requestFaqText.trim()).toContain(
        "Please note that any product that does not satisfy our policy will be rejected. Before importing, please see our product guidelines.",
      );

      const texts: string[] = [conf.caseConf.full_product_name, conf.caseConf.processing_rate];
      for (const text of texts) {
        expect(await plusbasePage.isTextVisible(text)).toBeTruthy();
      }
      for (const attributeName of conf.caseConf.attributes_name) {
        // await expect(plusbasePage.page.locator(`//button[normalize-space()='${attributeName}']`)).toBeVisible();
        expect(await plusbasePage.isTextVisible(attributeName)).toBeTruthy();
      }
      expect(await plusbasePage.isTextVisible(conf.caseConf.ali_url)).toBeTruthy();
      await expect(plusbasePage.page.locator(plusbasePage.getXpathTimelineBlock())).toBeVisible();
      expect(await plusbasePage.countImageInAliexpressProductDetail()).toEqual(conf.caseConf.image_count);
      await expect(plusbasePage.page.locator(plusbasePage.getXpathProductInfoBlock())).toBeVisible();
      await expect(plusbasePage.page.locator(plusbasePage.getXpathShippingBlock())).toBeVisible();
      await expect(plusbasePage.page.locator(plusbasePage.getXpathCommonInfoBlock())).toBeVisible();
    });
    await test.step(`Import product to store`, async () => {
      const plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
      const productID = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, conf.caseConf.ali_url, 1);
      sbProductId = await plusbaseProductAPI.importProductToStoreByAPI(productID);
    });
    await test.step(`Vào product admin detail`, async () => {
      await productPage.goToProdDetailByID(domain, sbProductId);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      await expect(
        productPage.page.locator(await plusbasePage.xpathCheckMessage(conf.caseConf.full_product_name)),
      ).toBeVisible();
      await expect(productPage.page.locator(plusbasePage.xpathImgVariant)).toHaveCount(conf.caseConf.image_count - 1);
      expect(await productPage.getNumberProductAllVariant()).toEqual("Variants (5 / 500)");
      // Delete product
      await productPage.deleteProductInProductDetail();
    });
  });

  test(`Verify UI product với link Aliexpress không tồn tại @SB_PLB_CTL_ALP_27`, async ({ conf }) => {
    await test.step(`Verify UI product hiển thì ở màn AliExpress products`, async () => {
      await plusbasePage.goToProductRequest();

      await plusbasePage.searchWithKeyword(conf.caseConf.ali_url);
      await plusbasePage.waitTabItemLoaded();
      expect(await plusbasePage.countSearchResult()).toEqual(1);

      const data = await plusbasePage.getDataOfFirstProductInList();
      expect(data.product_name).toContain("Untitled product name");
      expect(data.product_status).toEqual(conf.caseConf.product_status);
      expect(data.product_cost).toEqual("");
    });
    await test.step(`Vào product detail của AliExpress product và verify UI`, async () => {
      await plusbasePage.clickProductItemBaseOnUrl(conf.caseConf.ali_url);
      await plusbasePage.page.waitForSelector(await plusbasePage.xpathCheckMessage(conf.caseConf.product_status));

      // Verify data
      const texts: string[] = ["Request link", "Cannot import this product", "This product link does not exist"];
      for (const text of texts) {
        expect(await plusbasePage.isTextVisible(text)).toBeTruthy();
      }
      expect(await plusbasePage.isTextVisible("Product cost")).toBeFalsy();
      await expect(plusbasePage.page.locator(plusbasePage.getXpathTimelineBlock())).toBeVisible();
      expect(await plusbasePage.countImageInAliexpressProductDetail()).toEqual(1);
      await expect(plusbasePage.page.locator(plusbasePage.getXpathProductInfoBlock())).toHaveCount(0);
      await expect(plusbasePage.page.locator(plusbasePage.getXpathShippingBlock())).toHaveCount(0);
      await expect(plusbasePage.page.locator(plusbasePage.getXpathCommonInfoBlock())).toHaveCount(0);
    });
  });
  test(`Verify UI product có 4 option trở lên @SB_PLB_CTL_ALP_28`, async ({ conf }) => {
    await test.step(`Verify UI product hiển thị ở màn Aliexpress products`, async () => {
      await plusbasePage.goToProductRequest();

      await plusbasePage.searchWithKeyword(conf.caseConf.ali_url);
      await plusbasePage.waitTabItemLoaded();
      expect(await plusbasePage.countSearchResult()).toEqual(1);

      const data = await plusbasePage.getDataOfFirstProductInList();
      expect(data.product_name).toContain(conf.caseConf.product_name);
      expect(data.product_status).toEqual(conf.caseConf.product_status);
    });
    await test.step(`Vào product detail của Aliexpress product và verify UI`, async () => {
      await plusbasePage.clickProductItemBaseOnUrl(conf.caseConf.ali_url);
      await plusbasePage.page.waitForSelector(await plusbasePage.xpathCheckMessage(conf.caseConf.product_status));

      // Verify data
      const requestFaqText = await plusbasePage.page.locator(plusbasePage.xpathFaq).innerText();
      expect(requestFaqText.trim()).toEqual(
        "Product can only have maximum 3 options and 500 variants. Please try another link. Learn more.",
      );

      const texts: string[] = [conf.caseConf.full_product_name, "Cannot import this product"];
      for (const text of texts) {
        expect(await plusbasePage.isTextVisible(text)).toBeTruthy();
      }
      await expect(plusbasePage.page.locator(plusbasePage.getXpathTimelineBlock())).toHaveCount(1);
      expect(await plusbasePage.countImageInAliexpressProductDetail()).toEqual(1);
      await expect(plusbasePage.page.locator(plusbasePage.getXpathProductInfoBlock())).toBeVisible();
      await expect(plusbasePage.page.locator(plusbasePage.getXpathShippingBlock())).toHaveCount(0);
      await expect(plusbasePage.page.locator(plusbasePage.getXpathCommonInfoBlock())).toHaveCount(0);
    });
  });
  test(`Verify country support khi request link Aliexpress không support 1 số nước @SB_PLB_CTL_ALP_32`, async ({
    conf,
    odoo,
    authRequest,
  }) => {
    const plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    const odooService = OdooService(odoo);

    // Reset data

    await test.step(`Request link aliexpress`, async () => {
      await odooService.resetProductTemplateToResyncShipping(conf.caseConf.product_id);
      await plusbasePage.goToImportAliexpressProductPage();
      await plusbasePage.fillUrlToRequestProductTextArea(conf.caseConf.ali_url);
      expect(await plusbasePage.countValidUrl()).toEqual(1);
      await plusbasePage.clickImportAliexpressLink();
    });
    await test.step(`Kiểm trả thông tin shipping`, async () => {
      const supportCountryIDs = await plusbasePage.getProductSupportedCountryIds(
        plusbaseProductAPI,
        conf.caseConf.product_id,
        conf.caseConf.support_country_ids.length,
        conf.caseConf.max_retry_time,
        true,
      );
      expect(supportCountryIDs.every(country => conf.caseConf.support_country_ids.includes(country))).toEqual(true);
    });
  });
  test(`Verify country support khi checkout với product chưa báo giá và config shipping method là AliExpress @SB_PLB_CTL_ALP_37`, async ({
    dashboard,
    conf,
    authRequest,
    odoo,
  }) => {
    const dashboardAPI = new DashboardAPI(domain, authRequest);
    const plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    const checkoutAPI = new CheckoutAPI(domain, authRequest, dashboard);
    const sfCheckout = new SFCheckout(dashboard, domain);
    const customerInfo = conf.caseConf.customer_info;
    const odooService = OdooService(odoo);

    // Reset data and resync shipping
    await odooService.resetProductTemplateToResyncShipping(conf.caseConf.product_id);
    await plusbasePage.goToImportAliexpressProductPage();
    await plusbasePage.fillUrlToRequestProductTextArea(conf.caseConf.ali_url);
    await plusbasePage.clickImportAliexpressLink();

    // Get config data
    const supportedCountryData = await plusbasePage.getSupportedCountryData(odoo, dashboardAPI, {
      configDeliveryCarrierId: conf.caseConf.delivery_carrier_id,
      ignoreCountryIds: conf.caseConf.ignore_support_country_ids,
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
      await checkoutAPI.openCheckoutPageByToken();

      // Check shipping name
      await sfCheckout.enterShippingAddress(customerInfo);
      const shippingNames = await sfCheckout.getAvailableShippingNames();
      expect(shippingNames).toHaveLength(1);
      expect(shippingNames[0]).toContain("Standard Shipping");
    });
  });
  test(`Verify country support khi checkout với product chưa báo giá và chưa config shipping type @SB_PLB_CTL_ALP_38`, async ({
    dashboard,
    conf,
    authRequest,
    odoo,
  }) => {
    const dashboardAPI = new DashboardAPI(domain, authRequest);
    const plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    const checkoutAPI = new CheckoutAPI(domain, authRequest, dashboard);
    const odooService = OdooService(odoo);

    // Reset data and resync shipping
    await odooService.resetProductTemplateToResyncShipping(conf.caseConf.product_id);
    await plusbasePage.goToImportAliexpressProductPage();
    await plusbasePage.fillUrlToRequestProductTextArea(conf.caseConf.ali_url);
    await plusbasePage.clickImportAliexpressLink();

    // Get config data
    const supportedCountryData = await plusbasePage.getSupportedCountryData(odoo, dashboardAPI, {
      configDeliveryCarrierId: conf.caseConf.delivery_carrier_id,
      shippingTypeId: conf.caseConf.shipping_type_id,
      ignoreCountryIds: conf.caseConf.ignore_support_country_ids,
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
      await plusbasePage.goToProductRequestDetail(conf.caseConf.product_id);

      // Wait shipping loaded before verify select
      for (let i = 0; i < 5; i++) {
        await plusbasePage.waitAliDetailShippingBlockLoaded();
        // Sometime maybe load slow than expect, wait and reload if need
        const unavailableShippingCount = await plusbasePage.page
          .locator(plusbasePage.xpathShippingDestinationIsUnvailable)
          .count();
        if (unavailableShippingCount > 1) {
          await plusbasePage.waitAndReloadPage(5000);
          continue;
        }

        break;
      }

      // Verify select
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
  test(`Verify country support khi checkout với 2 shop cùng request 1 link, nhưng 1 shop đã sent quotation @SB_PLB_CTL_ALP_39`, async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    const shop2DashboardPage = new DashboardPage(dashboard, conf.caseConf.shop_not_sent_quotation.domain);
    const shop2Token = await shop2DashboardPage.getAccessToken({
      shopId: conf.caseConf.shop_not_sent_quotation.shop_id,
      userId: conf.caseConf.shop_not_sent_quotation.user_id,
      baseURL: conf.caseConf.shop_not_sent_quotation.api,
      username: conf.caseConf.shop_not_sent_quotation.username,
      password: conf.caseConf.shop_not_sent_quotation.password,
    });

    let countryCodesShop1,
      countryCodesShop2 = new Array<string>();

    await test.step(`Thực hiện checkout ở shop 1`, async () => {
      const checkoutAPI = new CheckoutAPI(domain, authRequest, dashboard);
      await checkoutAPI.addProductToCartThenCheckout([
        {
          variant_id: conf.caseConf.sb_variant_id,
          quantity: 1,
        },
      ]);
      countryCodesShop1 = (await checkoutAPI.getAvailableShippingCountries()).country_codes;
      expect(countryCodesShop1.sort()).toEqual(conf.caseConf.support_country_codes.sort());

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
      await shop2DashboardPage.loginWithToken(shop2Token);
      const checkoutAPI = new CheckoutAPI(shop2DashboardPage.domain, authRequest, shop2DashboardPage.page);
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

  test(`@SB_PLB_CTL_ALP_40 Verify request với link product có shipping unavaiable`, async ({
    conf,
    odoo,
    authRequest,
  }) => {
    const aliUrl = conf.caseConf.ali_url;
    const plbProductApi = new PlusbaseProductAPI(domain, authRequest);
    // Delete quotation, product template partner
    await plusbasePage.cleanProductAfterRequest(odoo, plbProductApi, {
      url: aliUrl,
      odoo_partner_id: conf.suiteConf.partner_id,
      cancel_reason_id: conf.suiteConf.cancel_reason_id,
      skip_if_not_found: true,
    });

    await test.step(`Tại menu bên trái chọn Dropship Products > AliExpress Products > Click button "Add AliExpress Product" > Thực hiện request sản phẩm Ali`, async () => {
      await plusbasePage.goToProductRequest();
      const aliProductData: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: aliUrl, note: "" }],
        is_plus_base: true,
      };
      await plbProductApi.requestProductByAPI(aliProductData);
    });

    await test.step(`Vào SO detail của  sản phẩm vừa request > Verify SO detail`, async () => {
      // Wait for crawl done
      await plusbasePage.searchAndClickViewRequestDetail(aliUrl);
      await plusbasePage.waitForCrawlSuccess(conf.caseConf.product_status);
      // Verify data
      expect(await plusbasePage.isTextVisible(conf.caseConf.message)).toEqual(true);
      expect(await plusbasePage.isTextVisible(conf.caseConf.text_link)).toEqual(true);
      expect(await plusbasePage.isTextVisible(conf.caseConf.full_product_name)).toBeTruthy();
    });
  });
});
