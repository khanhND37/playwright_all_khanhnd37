import { expect, test } from "@core/fixtures";
import { OcgLogger } from "@core/logger";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { Page } from "@playwright/test";
import type { Card, ShippingAddress, LiveView } from "@types";

const logger = OcgLogger.get();
let domain;

const gotoPage = async (page: Page, domain: string, sub: string) => {
  await page.goto(`https://${domain}/${sub}`);
};

const checkoutProduct = async (
  page: Page,
  shippingInfo: ShippingAddress,
  cardInfo: Card,
  checkout: SFCheckout,
  homepage: SFHome,
) => {
  const prePurchaseCheckout = "//button[contains(@class, 'pre-purchase')]";
  await checkout.waitResponseWithUrl("/assets/landing.css", 60000);
  await page.locator("(//span[normalize-space()='Add to cart'])[1]").click();
  await checkout.waitForElementVisibleThenInvisible(
    '//button[contains(@class,"btn-loading")] | //div[@id="addToCartForm"]//span[@class="button-dual-ring"]',
  );
  // wait for event checking out
  await checkout.waitAbit(60000);
  if (await page.locator(prePurchaseCheckout).isVisible()) {
    await page.click(prePurchaseCheckout);
  } else {
    await homepage.gotoCheckout();
  }
  await checkout.page.waitForSelector(checkout.xpathZipCode);
  try {
    await checkout.inputDiscountBox.waitFor({ state: "visible", timeout: 60000 });
  } catch {
    await checkout.page.waitForSelector(checkout.appliedCoupon);
  }
  await checkout.enterShippingAddress(shippingInfo);
  await checkout.continueToPaymentMethod();
  // wait for event checking out
  await checkout.waitAbit(60000);
  await checkout.completeOrderWithCardInfo(cardInfo);
};

const formatDate = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};

test.describe("Verify Live view dashboard", async () => {
  let liveView: AnalyticsPage;
  let initData: LiveView;
  let today;
  let liveViewUpdate;
  let homepage;
  let checkout;
  let liveViewBefore;
  let cardInfo;
  let shippingInfo;
  let viewPageBefore;
  let viewPageAfter;
  let behaviorBefore;
  let behaviorAfter;
  let scheduleData: { page_view: string };

  test.beforeEach(async ({ conf, dashboard, page }) => {
    test.setTimeout(conf.suiteConf.time_out);
    domain = conf.suiteConf.domain;
    liveView = new AnalyticsPage(dashboard, domain);
    today = await formatDate();
    initData = conf.caseConf.live_view_analytics;
    liveViewUpdate = conf.caseConf.live_view_update;
    homepage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    cardInfo = conf.suiteConf.card_info;
    shippingInfo = conf.suiteConf.customer_info;
  });

  test(`Verify count Visitor @SB_ANA_RANA_1`, async ({ dashboard, page, conf }) => {
    await test.step("Verify count Visitor right now", async () => {
      await gotoPage(dashboard, domain, "admin/live-view/");
      await dashboard.waitForLoadState("networkidle");
      liveViewBefore = await liveView.getDataLiveViewAPIDashboard(today, initData);
      await gotoPage(page, domain, "");
      const liveViewAfter = await liveView.validateDataLiveView(
        today,
        initData,
        conf.suiteConf.time_out,
        liveViewBefore,
      );
      expect(liveViewAfter.visitors_right_now).toEqual(
        liveViewBefore.visitors_right_now + liveViewUpdate.visitors_right_now,
      );
    });
  });

  test(`Verify count up session @SB_ANA_RANA_2`, async ({ dashboard, browser, conf }) => {
    await test.step("Verify count up session with multiple access", async () => {
      await gotoPage(dashboard, domain, "admin/live-view/");
      await dashboard.waitForLoadState("networkidle");
      for (let i = 0; i < 3; i++) {
        liveViewBefore = await liveView.getDataLiveViewAPIDashboard(today, initData);
        const sf = await browser.newPage();
        await sf.goto(`https://${domain}`);
        const liveViewAfter = await liveView.validateDataLiveView(
          today,
          initData,
          conf.suiteConf.time_out,
          liveViewBefore,
        );
        expect(liveViewAfter.total_sessions).toEqual(liveViewBefore.total_sessions + liveViewUpdate.total_sessions);
        await sf.close();
      }
    });

    await test.step("Verify count up session with single acess with multiple windows", async () => {
      liveViewBefore = await liveView.getDataLiveViewAPIDashboard(today, initData);
      const context = await browser.newContext();
      const sfUrl = `https://${domain}`;
      //Open tab 1
      const page1 = await context.newPage();
      await page1.goto(sfUrl);
      //Open tab 2
      const page2 = await context.newPage();
      await page2.goto(sfUrl);
      //Open tab 3
      const page3 = await context.newPage();
      await page3.goto(sfUrl);

      const liveViewAfter = await liveView.validateDataLiveView(
        today,
        initData,
        conf.suiteConf.time_out,
        liveViewBefore,
      );
      await page1.close();
      await page2.close();
      await page3.close();
      expect(liveViewAfter.total_sessions).toEqual(liveViewBefore.total_sessions + liveViewUpdate.total_sessions);
    });
  });

  test(`Verify count up total sales @SB_ANA_RANA_3`, async ({ dashboard, page, conf }) => {
    let valueRefundBefore;
    let amountChange;
    const partiallyRefundAmount = "10";

    await test.step(`Checkout với product "Super test Product on ShopBase"   - Add product vào cart   - Click button Checkout   - Nhập thông tin checkout   - Nhập thông tin thẻ   - Click button Complete order`, async () => {
      await gotoPage(dashboard, domain, "admin/live-view/");
      await dashboard.waitForLoadState("networkidle");
      liveViewBefore = await liveView.getDataLiveViewAPIDashboard(today, initData);
      await gotoPage(page, domain, conf.caseConf.product);
      await checkoutProduct(page, shippingInfo, cardInfo, checkout, homepage);
      amountChange = parseFloat((await checkout.getTotalOnOrderSummary()).split("$")[1]);
    });

    await test.step(`Kiểm tra Total sales trong dashboard real time analytics - Get data sau khi update - Kiểm tra data total sales`, async () => {
      const liveViewAfter = await liveView.validateDataLiveView(
        today,
        initData,
        conf.suiteConf.time_out,
        liveViewBefore,
      );
      expect(liveViewAfter.total_sales).toEqual(liveViewBefore.total_sales + amountChange);
    });

    await test.step(`Refund order hiện tại - Get data total sales before trong dashsboard real time analytics - Goto: https://au-general-analytics-live-view.myshopbase.net/admin/orders - Open Order cần refund - Refund order với amount = 10$`, async () => {
      valueRefundBefore = await liveView.getDataLiveViewAPIDashboard(today, conf.caseConf.live_view_analytics_refund);
      await liveView.refundOrder("partially", partiallyRefundAmount, conf.caseConf.reason);
    });

    await test.step(`Kiểm tra Total sales trong dashboard real time analytics - Get data sau khi update - Kiểm tra data total sales`, async () => {
      await gotoPage(dashboard, domain, "admin/live-view/");
      await dashboard.waitForLoadState("networkidle");
      const valueRefundAfter = await liveView.validateDataLiveView(
        today,
        conf.caseConf.live_view_analytics_refund,
        conf.suiteConf.time_out,
        valueRefundBefore,
      );
      const liveViewAfterRefund = await liveView.getDataLiveViewAPIDashboard(today, initData);
      const totalSale = await liveView.getLiveViewData("sales");
      expect(parseFloat(totalSale)).toEqual(liveViewAfterRefund.total_sales + valueRefundAfter.refunded);
    });
  });

  test(`Verify count up total order @SB_ANA_RANA_4`, async ({ dashboard, page, conf }) => {
    await test.step(`Checkout với product "Super test Product on ShopBase"   - Add product vào cart   - Click button Checkout   - Nhập thông tin checkout   - Nhập thông tin thẻ   - Click button Complete order`, async () => {
      await gotoPage(dashboard, domain, "admin/live-view/");
      await dashboard.waitForLoadState("networkidle");
      liveViewBefore = await liveView.getDataLiveViewAPIDashboard(today, initData);
      await gotoPage(page, domain, conf.caseConf.product);
      await checkoutProduct(page, shippingInfo, cardInfo, checkout, homepage);
    });

    await test.step(`Kiểm tra Total orders trong dashboard real time analytics - Get data sau khi update - Kiểm tra data total orders`, async () => {
      const liveViewAfter = await liveView.validateDataLiveView(
        today,
        initData,
        conf.suiteConf.time_out,
        liveViewBefore,
      );
      expect(liveViewAfter.total_orders).toEqual(liveViewBefore.total_orders + liveViewUpdate.total_orders);
    });
  });

  test(`@SB_ANA_RANA_5 Page view`, async ({ dashboard, page, conf, authRequest, scheduler }) => {
    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as { page_view: string };
    } else {
      scheduleData = {
        page_view: "no",
      };
    }

    if (scheduleData.page_view == "no") {
      await test.step(`Kiểm tra trường hợp count page view trong Dashboard, Analytics > Live view - Goto SF gốc- Kiểm tra page view trong dashboard`, async () => {
        await gotoPage(dashboard, domain, "admin/live-view/");
        await dashboard.waitForLoadState("networkidle");
        viewPageBefore = await liveView.getPageViewByAPI(authRequest);
        logger.info(`View Page before = ${viewPageBefore}`);
        await gotoPage(page, domain, "");
        await homepage.waitForEventCompleted(domain, "view_page");
        // wait >1 minutes for update data in page view
        await liveView.waitAbit(63000);
        viewPageAfter = await liveView.getPageViewByAPI(authRequest);
        while (viewPageAfter == viewPageBefore) {
          await liveView.waitAbit(15000);
          viewPageAfter = await liveView.getPageViewByAPI(authRequest);
        }
        logger.info(`View Page after 1 = ${viewPageAfter}`);
        expect(viewPageAfter).toBe(viewPageBefore + 1);
      });

      await test.step(`Kiểm tra trường hợp count page view trong 5s khi thực hiện view nhiều page trên storefront - Go to all collections page - Click view 1 collections- Kiểm tra page view trong Dashboard, Analytics > Live view`, async () => {
        await gotoPage(page, domain, "collections");
        // wait for update data in page view
        await liveView.waitAbit(60000);
        await gotoPage(page, domain, "collections/all");
        // wait for update data in page view
        await liveView.waitAbit(63000);
        viewPageAfter = await liveView.getPageViewByAPI(authRequest);
        while (viewPageAfter == viewPageBefore + 1) {
          await liveView.waitAbit(15000);
          viewPageAfter = await liveView.getPageViewByAPI(authRequest);
        }
        logger.info(`View Page after 2 = ${viewPageAfter}`);
        expect(viewPageAfter).toBe(viewPageBefore + 2);
      });

      await test.step(`Kiểm tra trường hợp count page view trong Dashboard, Analytics > Live view - Goto SF khác trong multi SF- Kiểm tra page view trong dashboard`, async () => {
        await gotoPage(page, conf.suiteConf.multi_SF, "");
        // wait >1 minutes for update data in page view
        await liveView.waitAbit(63000);
        viewPageAfter = await liveView.getPageViewByAPI(authRequest);
        while (viewPageAfter == viewPageBefore + 2) {
          await liveView.waitAbit(15000);
          viewPageAfter = await liveView.getPageViewByAPI(authRequest);
        }
        logger.info(`View Page after 3 = ${viewPageAfter}`);
        expect(viewPageAfter).toBe(viewPageBefore + 3);
      });

      await test.step(`Kiểm tra trường hợp count page view trong 5s khi thực hiện view nhiều page trên storefront - Go to all collections page - Click view 1 collections- Kiểm tra page view trong Dashboard, Analytics > Live view`, async () => {
        await gotoPage(page, conf.suiteConf.multi_SF, "collections");
        // wait for update data in page view
        await liveView.waitAbit(60000);
        await gotoPage(page, conf.suiteConf.multi_SF, "collections/all");
        // wait for update data in page view
        await liveView.waitAbit(63000);
        viewPageAfter = await liveView.getPageViewByAPI(authRequest);
        while (viewPageAfter == viewPageBefore + 3) {
          await liveView.waitAbit(15000);
          viewPageAfter = await liveView.getPageViewByAPI(authRequest);
        }
        logger.info(`View Page after 4 = ${viewPageAfter}`);
        expect(viewPageAfter).toBe(viewPageBefore + 4);
        scheduleData.page_view = "yes";
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 32 });
      });
    }

    if (scheduleData.page_view == "yes") {
      await test.step(`Kiểm tra Page view trường hợp data cũ sau 30p - Wait 30 phút- Kiểm tra page view trong Dashboard, Analytics > Live view`, async () => {
        await gotoPage(dashboard, domain, "admin/live-view/");
        await dashboard.waitForLoadState("networkidle");
        viewPageAfter = await liveView.getPageViewByAPI(authRequest);
        logger.info(`View Page after 30p = ${viewPageAfter}`);
        expect(viewPageAfter).toBe(0);
        await scheduler.clear();
      });
    }
  });

  test(`@SB_ANA_RANA_6 Customer behavior`, async ({ page, conf, dashboard, authRequest }) => {
    await test.step(`Truy cập SF gốc, checkout với product "Super test Product on ShopBase"   - Get data on Customer behavior before   - Add product vào cart   - Click button Checkout   - Nhập thông tin checkout   - Nhập thông tin thẻ   - Click button Complete order`, async () => {
      await gotoPage(dashboard, domain, "admin/live-view/");
      await dashboard.waitForLoadState("networkidle");
      behaviorBefore = await liveView.getCustomerBehaviorByAPI(authRequest);
      logger.info(`Behavior before = ${JSON.stringify(behaviorBefore)}`);
      await gotoPage(page, domain, conf.suiteConf.product_link);
      await checkoutProduct(page, shippingInfo, cardInfo, checkout, homepage);
    });

    await test.step(`Trong Dashboard, Analytics > Live view, kiểm tra Chart Customer Behavior   - Get data sau khi checkout thành công order   - Kiểm tra Customer behavior`, async () => {
      await gotoPage(dashboard, domain, "admin/live-view/");
      await dashboard.waitForLoadState("networkidle");
      do {
        await dashboard.waitForTimeout(5000);
        behaviorAfter = await liveView.getCustomerBehaviorByAPI(authRequest);
      } while (
        behaviorAfter.add_to_cart == behaviorBefore.add_to_cart ||
        behaviorAfter.reached_checkout == behaviorBefore.reached_checkout ||
        behaviorAfter.order_distinct_count == behaviorBefore.order_distinct_count
      );
      logger.info(`Behavior after = ${JSON.stringify(behaviorAfter)}`);
      expect(behaviorAfter.add_to_cart).toBe(behaviorBefore.add_to_cart + 1);
      expect(behaviorAfter.reached_checkout).toBe(behaviorBefore.reached_checkout + 1);
      expect(behaviorAfter.order_distinct_count).toBe(behaviorBefore.order_distinct_count + 1);
    });

    await test.step(`Truy cập SF khác trong multi SF, checkout với product "Super test Product on ShopBase"   - Get data on Customer behavior before   - Add product vào cart   - Click button Checkout   - Nhập thông tin checkout   - Nhập thông tin thẻ   - Click button Complete order`, async () => {
      await gotoPage(dashboard, domain, "admin/live-view/");
      await dashboard.waitForLoadState("networkidle");
      behaviorBefore = await liveView.getCustomerBehaviorByAPI(authRequest);
      logger.info(`Behavior MSF before = ${JSON.stringify(behaviorBefore)}`);
      await gotoPage(page, conf.suiteConf.multi_SF, conf.suiteConf.product_link);
      await checkoutProduct(page, shippingInfo, cardInfo, checkout, homepage);
    });

    await test.step(`Trong Dashboard, Analytics > Live view, kiểm tra Chart Customer Behavior   - Get data sau khi checkout thành công order   - Kiểm tra Customer behavior`, async () => {
      do {
        await dashboard.waitForTimeout(5000);
        behaviorAfter = await liveView.getCustomerBehaviorByAPI(authRequest);
      } while (
        behaviorAfter.add_to_cart == behaviorBefore.add_to_cart ||
        behaviorAfter.reached_checkout == behaviorBefore.reached_checkout ||
        behaviorAfter.order_distinct_count == behaviorBefore.order_distinct_count
      );
      logger.info(`Behavior MSF after = ${JSON.stringify(behaviorAfter)}`);
      expect(behaviorAfter.add_to_cart).toBe(behaviorBefore.add_to_cart + 1);
      expect(behaviorAfter.reached_checkout).toBe(behaviorBefore.reached_checkout + 1);
      expect(behaviorAfter.order_distinct_count).toBe(behaviorBefore.order_distinct_count + 1);
    });
  });
});
