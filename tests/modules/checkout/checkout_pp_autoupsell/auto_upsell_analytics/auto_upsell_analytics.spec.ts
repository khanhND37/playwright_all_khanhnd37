import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { formatDate } from "@core/utils/datetime";
import { OrderAPI } from "@pages/api/order";
import { AnalyticsPage } from "@pages/dashboard/analytics";

let analytics;
let aovBefore;
let orderID: number;
let accessToken: string;

test.describe("Buyer should be able view and buy the recommended products from up sell @TS_SB_DASHBOARD_01", () => {
  const now = new Date();
  const dateFilter = formatDate(now, "YYYY-MM-DD");

  test.beforeEach(async ({ page, conf, authRequest, token }) => {
    analytics = new AnalyticsPage(page, conf.suiteConf.domain, authRequest);
    aovBefore = await analytics.getAutoUpsellInfo(conf.suiteConf.shop_id, dateFilter);
    const checkout = new SFCheckout(page, conf.suiteConf.domain, "");
    await checkout.createStripeOrder(
      conf.suiteConf.product_target.name,
      conf.suiteConf.product_target.quantity,
      conf.suiteConf.customer_info,
      conf.suiteConf.discount.code,
      conf.suiteConf.card_info,
    );
    orderID = await checkout.getOrderIdBySDK();
    await checkout.addPostPurchase();

    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
  });

  test(`Kiểm tra profit, analytics
  email khi Offer có áp dụng discount và shipping fee và Order có discount, tax, tip @TC_SB_AUP_61`, async ({
    conf,
    authRequest,
    page,
  }) => {
    const domain = conf.suiteConf.domain;
    await test.step(`Merchant kiểm tra profit,total order,average order profit, average order item`, async () => {
      const orderPage = new OrderAPI(domain, authRequest);
      const profitLineItem = await orderPage.getProfitByLineItem(orderID, accessToken);

      analytics = new AnalyticsPage(page, conf.suiteConf.domain, authRequest);
      const aovAfter = await analytics.getAutoUpsellInfo(conf.suiteConf.shop_id, dateFilter);
      /** -Hiển thị đúng thông tin : Total profit,
       * Average order profit, Total Orders,Average order items via Automated Upsell, total  */
      expect(aovAfter.total_profit).toEqual(aovBefore.total_profit + profitLineItem);
      expect(aovAfter.total_orders).toEqual(aovBefore.total_orders + 1);
      expect(aovAfter.total_aop).toEqual(aovAfter.total_profit / aovAfter.total_orders);
      expect(aovAfter.total_aoi).toEqual(aovBefore.total_aoi);
    });

    await test.step("Merchant view analytics", async () => {
      const analytics = new AnalyticsPage(page, domain);
      await analytics.openAnalyticsByAPI(accessToken);
      /**-Hiển thị thêm text Automated Upsell*/
      await expect(page.locator(`//span[contains(text(),'Total profit via Automated Upsell')]`)).toBeVisible();
      await expect(page.locator(`//p[contains(text(),'Automated Upsell conversion rate')]`)).toBeVisible();
      await expect(page.locator(`//span[contains(text(),'Total orders via Automated Upsell')]`)).toBeVisible();
      await expect(
        page.locator(`//span[contains(text(),'//span[contains(text(),'AOP via Automated Upsell')]')]`),
      ).toBeVisible();
      await expect(page.locator(`//span[contains(text(),'AOI via Automated Upsell')]`)).toBeVisible();
    });
  });
});
