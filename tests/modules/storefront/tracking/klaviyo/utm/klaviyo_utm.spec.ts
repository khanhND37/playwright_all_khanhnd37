import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { MarketingAndSales } from "@pages/dashboard/marketing_and_sales";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { Klaviyo } from "@pages/thirdparty/klaviyo";
import { CheckoutAPI } from "@pages/api/checkout";

test.describe.serial(`Verify Klaviyo profile by UTM param "utm_klv_profile_id"`, async () => {
  const caseName = "klaviyo_profile";
  const conf = loadData(__dirname, caseName);
  const timeStamp = Math.floor(Date.now() / 1000);
  conf.caseConf.data.forEach(
    (
      {
        test_case_id: id,
        public_api_key: publicApiKey,
        private_api_key: privateApiKey,
        is_exists: isExists,
        customer_email: customerEmail,
        utm: utm,
        klaviyo_profile_id: klaviyoProfileId,
      },
      i: number,
    ) => {
      customerEmail += timeStamp + "@mailinator.com";
      test(`Verify detect Klaviyo profile in case @TC_${id} with iterator ${i}`, async ({ dashboard, request }) => {
        let mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
        const storefront = new SFHome(dashboard, conf.suiteConf.domain);
        const klaviyo = new Klaviyo(dashboard, conf.suiteConf.domain);
        let productPage: SFProduct;

        await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
          await mktnSales.openKlaviyoChannelOnDashboard(conf.suiteConf.sub_menu, conf.suiteConf.channel);
        });
        await test.step(`Enter Public API Key`, async () => {
          await mktnSales.enterKlaviyoApiKey(`public`, publicApiKey);
        });
        await test.step(`Enter Private API Key`, async () => {
          await mktnSales.enterKlaviyoApiKey(`private`, privateApiKey);
        });
        await test.step(`Open storefront`, async () => {
          await storefront.goto(`?${utm}${klaviyoProfileId}`);
          await dashboard.locator('button:has-text("Close form")').click();
        });
        await test.step(`Search product "Nike Dunk Low" then add to cart`, async () => {
          productPage = await storefront.searchThenViewProduct(conf.caseConf.data.product_1);
          await productPage.addToCart();
          mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
        });
        await test.step(`Open dashboard and navigate to Customers page`, async () => {
          await mktnSales.openCustomersOnDashboard();
        });
        await test.step(`Enter customer email in search field`, async () => {
          await mktnSales.enterCustomerEmailInSearchField(customerEmail);
        });
        await test.step(`Verify Customer is existed in Customer list`, async () => {
          if (!isExists) {
            await expect(
              dashboard.locator(`//div[contains(text(),'Could not find any customers matching')]`),
            ).toBeEnabled();
          } else {
            await expect(dashboard.locator(`//tr[1]`)).toBeEnabled();
          }
        });
        await test.step(`Verify recently Klaviyo event is valid`, async () => {
          let eventTime = await klaviyo.getTimestampOfFirstEventForSpecialMetricByProfileId(
            klaviyoProfileId,
            conf.caseConf.data.viewed_product_metric_id,
            privateApiKey,
            request,
          );
          expect(eventTime).toBeGreaterThan(timeStamp);
          eventTime = await klaviyo.getTimestampOfFirstEventForSpecialMetricByProfileId(
            klaviyoProfileId,
            conf.caseConf.data.added_to_cart_metric_id,
            privateApiKey,
            request,
          );
          expect(eventTime).toBeGreaterThan(timeStamp);
        });
      });
    },
  );
});

test.describe.serial(`Verify Klaviyo profile by utm_source="klaviyo"`, async () => {
  const caseName = "klaviyo_utm";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(({ test_case_id: id, utm: utm }, i: number) => {
    test(`Verify checkout with UTM in case @TC_${id} with iterator ${i}`, async ({ dashboard, request }) => {
      // eslint-disable-next-line camelcase
      const { domain, email, products, shipping_address, card_info } = conf.suiteConf as never;

      const countryCode = conf.suiteConf.shipping_address.country_code;

      const checkoutAPI = new CheckoutAPI(domain + `?` + utm, request);

      await checkoutAPI.addProductToCartThenCheckout(products);
      await checkoutAPI.updateCustomerInformation(email, shipping_address);
      await checkoutAPI.selectDefaultShippingMethod(countryCode);
      await checkoutAPI.authorizedThenCreateStripeOrder(card_info);

      const mktnSales = new MarketingAndSales(dashboard, domain);

      await test.step(`Open dashboard and navigate to Customers page`, async () => {
        await mktnSales.openCustomersOnDashboard();
      });
      await test.step(`Enter customer email in search field`, async () => {
        await mktnSales.enterCustomerEmailInSearchField(email);
      });
      await test.step(`Verify Customer is existed in Customer list`, async () => {
        expect(dashboard.locator(`//div[contains(text(),'Could not find any customers matching')]`)).toBeUndefined();
      });
    });
  });
});
