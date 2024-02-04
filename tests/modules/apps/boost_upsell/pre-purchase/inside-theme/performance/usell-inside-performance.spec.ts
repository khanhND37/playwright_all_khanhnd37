import { test } from "@fixtures/theme";
import { Page, expect } from "@playwright/test";
import { OfferDetail } from "@types";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { BoostUpsellAPI } from "@pages/api/dashboard/boost-upsell-inside";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFApps } from "@pages/storefront/apps";
import { OrderAPI } from "@pages/api/order";

test.describe("Verify performance của offer", () => {
  let themeSettingAPI: SettingThemeAPI;
  let themeSetting: number;
  let upSellAPI: BoostUpsellAPI;
  let upsell: SFApps;
  let checkout: SFCheckout;
  let shopId;
  let domain;
  let shippingInfo, cardInfo, localeFormat, timeZoneShop, today, productUpsell, productCheckout;

  const goToPage = async (page: Page, domain: string, productCheckout: string) => {
    await page.goto(`https://${domain}/products/${productCheckout}`);
    await page.waitForLoadState("networkidle");
  };

  test.beforeEach(async ({ conf, theme, authRequest, page }) => {
    domain = conf.suiteConf.domain;
    shopId = conf.suiteConf.shop_id;

    shippingInfo = conf.suiteConf.customer_info;
    cardInfo = conf.suiteConf.card_info;
    localeFormat = conf.suiteConf.locale_format;
    timeZoneShop = conf.suiteConf.time_zone;
    productUpsell = conf.caseConf.product_upsell;
    productCheckout = conf.caseConf.product_checkout;
    today = new Date().toLocaleDateString(localeFormat, { timeZone: timeZoneShop });
    upSellAPI = new BoostUpsellAPI(domain, authRequest);
    checkout = new SFCheckout(page, domain);
    upsell = new SFApps(page, domain);

    await test.step(`setting theme inside`, async () => {
      themeSetting = conf.suiteConf.themes_setting;
      themeSettingAPI = new SettingThemeAPI(theme);
      await themeSettingAPI.publishTheme(themeSetting);
    });
  });

  test(`@SB_SF_BUSF_PPSF_UPRP_3 Check performance của offer pre-purchase`, async ({ conf, page }) => {
    let dataPerformanceBeforeCheckout: OfferDetail;
    const dataChanges = conf.caseConf.data_changes;
    const offerId = conf.caseConf.offer_id;
    const timeOutWaitPerformanceChanges = conf.caseConf.time_out_wait_performance_changes;

    await test.step(`Get data performace before checkout`, async () => {
      dataPerformanceBeforeCheckout = await upSellAPI.getInfoPerformance(offerId, shopId, today);
    });

    await test.step(`Add to cart product F + Add to cart product G trên pre-purchase + Checkout order success`, async () => {
      await Promise.all([goToPage(page, domain, productCheckout), checkout.waitResponseWithUrl("/assets/landing.css")]);
      await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, upsell, productUpsell, domain);
    });

    await test.step(`Mở lại offer detail trong dashboard`, async () => {
      const dataPerformanceAfterCheckout = await upSellAPI.DataPerformanceChanges(
        dataPerformanceBeforeCheckout,
        dataChanges,
        offerId,
        shopId,
        today,
        timeOutWaitPerformanceChanges,
      );

      expect(dataPerformanceAfterCheckout.sale - dataPerformanceBeforeCheckout.sale).toBeGreaterThan(0);
      expect(dataPerformanceBeforeCheckout.view + 1).toEqual(dataPerformanceAfterCheckout.view);
      expect(dataPerformanceBeforeCheckout.add_to_cart + 1).toEqual(dataPerformanceAfterCheckout.add_to_cart);
      expect(dataPerformanceBeforeCheckout.checkout_success + 1).toEqual(dataPerformanceAfterCheckout.checkout_success);
    });
  });

  test(`@SB_SF_UPRP_1 Check pre-purchase reommend các product đặc biệt`, async ({ page, conf, authRequest }) => {
    const orderAPI = new OrderAPI(domain, authRequest);
    let priceProductAfterUpsell: number;
    let priceProduct: number;
    let orderId;
    const discountUpsell = conf.caseConf.discount_upsell;

    await test.step(`Truy cập trang product của "Product E", thực hiện add to cart , Add to cart product A, Add to cart variant Z của product C, Add to cart product product D, Checkout order success`, async () => {
      await Promise.all([goToPage(page, domain, productCheckout), checkout.waitResponseWithUrl("/assets/landing.css")]);
      await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo, upsell, productUpsell, domain);
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`Open order detail`, async () => {
      const orderInfo = await orderAPI.getOrderInfo(orderId);

      for (let i = 0; i < orderInfo.lineItems.length; i++) {
        if (orderInfo.lineItems[i].title.includes(productUpsell)) {
          priceProductAfterUpsell = orderInfo.lineItems[i].line_item_price_after_discount;
          priceProduct = orderInfo.lineItems[i].line_item_price_before_discount;
          expect(((priceProductAfterUpsell - priceProduct) / priceProductAfterUpsell) * 100).toEqual(discountUpsell);
        }
      }
    });
  });
});
