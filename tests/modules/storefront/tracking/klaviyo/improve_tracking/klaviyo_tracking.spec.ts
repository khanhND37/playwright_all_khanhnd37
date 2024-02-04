import { expect, test } from "@core/fixtures";
import { Klaviyo } from "@pages/thirdparty/klaviyo";
import { MarketingAndSales } from "@pages/dashboard/marketing_and_sales";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";

test.describe(`Verify re-sent event to Klaviyo`, async () => {
  test(`Verify event Started checkout was re-sent in case @TC_SB_MAR_SALES_ME_KLV_IMP_TRK_13`, async ({
    dashboard,
    conf,
    request,
  }) => {
    let productPage: SFProduct;
    const storefront = new SFHome(dashboard, conf.suiteConf.domain);
    const klaviyo = new Klaviyo(dashboard, conf.suiteConf.domain);
    const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);

    let countAddEvent: number;
    let countViewEvent: number;
    let countCheckoutEvent: number;
    /**
     * @Step
     */
    await test.step(`Get count of events before`, async () => {
      countViewEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.viewed_product_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      countAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      countCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
    });
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Enter Public API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`public`, conf.suiteConf.public_api_key);
    });
    await test.step(`Enter Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, conf.suiteConf.private_api_key);
    });
    await test.step(`Open storefront`, async () => {
      await storefront.gotoHomePage();
      await dashboard.locator('button:has-text("Close form")').click();
    });
    await test.step(`Search product "Nike Dunk Low" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_1);
      await productPage.addToCart();
      await productPage.navigateToCheckoutPageInCaseBoostUpsell();
    });
    await test.step(`Verify events were sent to Klaviyo`, async () => {
      const tempCountViewEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.viewed_product_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountViewEvent).toBeGreaterThan(countViewEvent);

      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);

      const tempCountStartedCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountStartedCheckoutEvent).toBeGreaterThan(countCheckoutEvent);
      countCheckoutEvent = tempCountStartedCheckoutEvent;
    });
    await test.step(`Go to storefront homepage and start checkout again`, async () => {
      await storefront.gotoCart();
      await storefront.gotoCheckout();
    });
    await test.step(`Verify started checkout event has been sent again`, async () => {
      const tempCountStartedCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountStartedCheckoutEvent).toBeGreaterThan(countCheckoutEvent);
    });
  });

  test(`Verify event Added to Cart was re-sent in case @TC_SB_MAR_SALES_ME_KLV_IMP_TRK_14`, async ({
    dashboard,
    conf,
    request,
  }) => {
    let productPage: SFProduct;
    const storefront = new SFHome(dashboard, conf.suiteConf.domain);
    const klaviyo = new Klaviyo(dashboard, conf.suiteConf.domain);
    const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);

    let countAddEvent: number;
    let countViewEvent: number;
    let countCheckoutEvent: number;
    /**
     * @Step
     */
    await test.step(`Get count of events before`, async () => {
      countViewEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.viewed_product_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      countAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      countCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
    });
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Enter Public API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`public`, conf.suiteConf.public_api_key);
    });
    await test.step(`Enter Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, conf.suiteConf.private_api_key);
    });
    await test.step(`Open storefront`, async () => {
      await storefront.gotoHomePage();
      await dashboard.locator('button:has-text("Close form")').click();
    });
    await test.step(`Search product "Nike Dunk Low" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_1);
      await productPage.addToCart();
      await productPage.navigateToCheckoutPageInCaseBoostUpsell();
    });
    await test.step(`Verify events were sent to Klaviyo`, async () => {
      const tempCountViewEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.viewed_product_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountViewEvent).toBeGreaterThan(countViewEvent);

      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
      countAddEvent = tempCountAddEvent;

      const tempCountStartedCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountStartedCheckoutEvent).toBeGreaterThan(countCheckoutEvent);
    });
    await test.step(`Go to storefront homepage`, async () => {
      await storefront.gotoHomePage();
    });
    await test.step(`Search product "Air Jordan 1 Zoom Cmft" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_2);
      await productPage.addToCart();
    });
    await test.step(`Verify added to cart event has been sent again`, async () => {
      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
    });
  });

  test(`Verify event Added to Cart was re-sent in case @TC_SB_MAR_SALES_ME_KLV_IMP_TRK_15`, async ({
    dashboard,
    conf,
    request,
  }) => {
    let productPage: SFProduct;
    const storefront = new SFHome(dashboard, conf.suiteConf.domain);
    const klaviyo = new Klaviyo(dashboard, conf.suiteConf.domain);
    const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);

    let countAddEvent: number;
    let countViewEvent: number;
    let countCheckoutEvent: number;
    /**
     * @Step
     */
    await test.step(`Get count of events before`, async () => {
      countViewEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.viewed_product_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      countAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      countCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
    });
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Enter Public API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`public`, conf.suiteConf.public_api_key);
    });
    await test.step(`Enter Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, conf.suiteConf.private_api_key);
    });
    await test.step(`Open storefront`, async () => {
      await storefront.gotoHomePage();
      await dashboard.locator('button:has-text("Close form")').click();
    });
    await test.step(`Search product "Nike Dunk Low" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_1);
      await productPage.addToCart();
      await productPage.navigateToCheckoutPageInCaseBoostUpsell();
    });
    await test.step(`Verify events were sent to Klaviyo`, async () => {
      const tempCountViewEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.viewed_product_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountViewEvent).toBeGreaterThan(countViewEvent);

      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
      countAddEvent = tempCountAddEvent;

      const tempCountStartedCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountStartedCheckoutEvent).toBeGreaterThan(countCheckoutEvent);
    });
    await test.step(`Go to storefront homepage`, async () => {
      await storefront.gotoHomePage();
    });
    await test.step(`Search product "Air Jordan 1 Zoom Cmft" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_2);
      await productPage.addToCart();
    });
    await test.step(`Verify added to cart event has been sent again`, async () => {
      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
      countAddEvent = tempCountAddEvent;
    });
    await test.step(`Go to cart page and remove item in cart`, async () => {
      await storefront.gotoCart();
      await dashboard.locator("text=QuantityRemove item >> div").nth(3).click();
    });
    await test.step(`Verify added to cart event has been sent again`, async () => {
      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
    });
  });

  test(`Verify event Added to Cart was re-sent in case @TC_SB_MAR_SALES_ME_KLV_IMP_TRK_16`, async ({
    dashboard,
    conf,
    request,
  }) => {
    let productPage: SFProduct;
    const storefront = new SFHome(dashboard, conf.suiteConf.domain);
    const klaviyo = new Klaviyo(dashboard, conf.suiteConf.domain);
    const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);

    let countAddEvent: number;
    let countViewEvent: number;
    let countCheckoutEvent: number;
    /**
     * @Step
     */
    await test.step(`Get count of events before`, async () => {
      countViewEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.viewed_product_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      countAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      countCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
    });
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Enter Public API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`public`, conf.suiteConf.public_api_key);
    });
    await test.step(`Enter Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, conf.suiteConf.private_api_key);
    });
    await test.step(`Open storefront`, async () => {
      await storefront.gotoHomePage();
      await dashboard.locator('button:has-text("Close form")').click();
    });
    await test.step(`Search product "Nike Dunk Low" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_1);
      await productPage.addToCart();
      await productPage.navigateToCheckoutPageInCaseBoostUpsell();
    });
    await test.step(`Verify events were sent to Klaviyo`, async () => {
      const tempCountViewEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.viewed_product_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountViewEvent).toBeGreaterThan(countViewEvent);

      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
      countAddEvent = tempCountAddEvent;

      const tempCountStartedCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountStartedCheckoutEvent).toBeGreaterThan(countCheckoutEvent);
    });
    await test.step(`Go to storefront homepage`, async () => {
      await storefront.gotoHomePage();
    });
    await test.step(`Search product "Air Jordan 1 Zoom Cmft" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_2);
      await productPage.addToCart();
    });
    await test.step(`Verify added to cart event has been sent again`, async () => {
      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
      countAddEvent = tempCountAddEvent;
    });
    await test.step(`Go to storefront homepage`, async () => {
      await storefront.gotoHomePage();
    });
    await test.step(`Search product "NikeCourt Zoom Vapor Cage 4 Rafa" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_3);
      await productPage.addToCart();
    });
    await test.step(`Verify added to cart event has been sent again`, async () => {
      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
    });
  });

  test(`Verify event Added to Cart was re-sent in case @TC_SB_MAR_SALES_ME_KLV_IMP_TRK_17`, async ({
    dashboard,
    conf,
    request,
  }) => {
    let productPage: SFProduct;
    const storefront = new SFHome(dashboard, conf.suiteConf.domain);
    const klaviyo = new Klaviyo(dashboard, conf.suiteConf.domain);
    const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);

    let countAddEvent: number;
    let countViewEvent: number;
    let countCheckoutEvent: number;
    /**
     * @Step
     */
    await test.step(`Get count of events before`, async () => {
      countViewEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.viewed_product_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      countAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      countCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
    });
    await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
      const mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await mktnSales.openKlaviyoChannelOnDashboard(conf.caseConf.sub_menu, conf.caseConf.channel);
    });
    await test.step(`Enter Public API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`public`, conf.suiteConf.public_api_key);
    });
    await test.step(`Enter Private API Key`, async () => {
      await mktnSales.enterKlaviyoApiKey(`private`, conf.suiteConf.private_api_key);
    });
    await test.step(`Open storefront`, async () => {
      await storefront.gotoHomePage();
      await dashboard.locator('button:has-text("Close form")').click();
    });
    await test.step(`Search product "Nike Dunk Low" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_1);
      await productPage.addToCart();
      await productPage.navigateToCheckoutPageInCaseBoostUpsell();
    });
    await test.step(`Verify events were sent to Klaviyo`, async () => {
      const tempCountViewEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.viewed_product_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountViewEvent).toBeGreaterThan(countViewEvent);

      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
      countAddEvent = tempCountAddEvent;

      const tempCountStartedCheckoutEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.started_checkout_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountStartedCheckoutEvent).toBeGreaterThan(countCheckoutEvent);
    });
    await test.step(`Go to storefront homepage`, async () => {
      await storefront.gotoHomePage();
    });
    await test.step(`Search product "Air Jordan 1 Zoom Cmft" then add to cart`, async () => {
      productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_2);
      await productPage.addToCart();
    });
    await test.step(`Verify added to cart event has been sent again`, async () => {
      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
      countAddEvent = tempCountAddEvent;
    });
    await test.step(`Go to cart page and remove item in cart`, async () => {
      await storefront.gotoCart();
      await dashboard.locator("text=QuantityRemove item >> div").nth(3).click();
    });
    await test.step(`Verify added to cart event has been sent again`, async () => {
      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
      countAddEvent = tempCountAddEvent;
    });
    await test.step(`Go to cart page and remove item in cart`, async () => {
      await storefront.gotoCart();
      await dashboard.locator("text=QuantityRemove item >> div").nth(3).click();
    });
    await test.step(`Verify added to cart event has been sent again`, async () => {
      const tempCountAddEvent = await klaviyo.getCountOfEventForSpecialMetricByProfileId(
        conf.caseConf.klavoyo_profile_id,
        conf.caseConf.added_to_cart_metric_id,
        conf.suiteConf.private_api_key,
        request,
      );
      expect(tempCountAddEvent).toBeGreaterThan(countAddEvent);
    });
  });
});
