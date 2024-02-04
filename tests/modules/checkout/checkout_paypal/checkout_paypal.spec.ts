import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { OrderAPI } from "@pages/api/order";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { PaypalScheduleData } from "./capture";

test.describe("Kiểm tra order detail trong dashboard khi checkout với paypal, Setting checkout 3 pages", () => {
  const caseName = "TC_SB_CHE_PP_01";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({ product_name: productName, product_ppc_name: ppcItem, discount_code: discount, case_id: caseID }) => {
      // eslint-disable-next-line max-len
      test(`@${caseID} - Kiểm tra order detal trong dashboard khi checkout với paypal standard`, async ({
        page,
        conf,
        request,
        theme,
        dashboard,
        scheduler,
      }) => {
        test.setTimeout(400000);
        // prepair data for
        const domain = conf.suiteConf.domain;
        const orderPage = new OrdersPage(dashboard, domain);
        const homepage = new SFHome(page, domain);
        let checkout: SFCheckout;
        let productPage: SFProduct;
        let orderId: number;
        let totalOrderSF: string;
        let scheduleData: PaypalScheduleData;

        let isPostPurchase = false;
        let itemPostPurchaseValue = "0";
        let isSchedule: boolean;
        let orderStatus: string;

        const paypalAccount = conf.suiteConf.paypal_account;
        const customerInfo = conf.suiteConf.customer_info;
        const shippingMethod = conf.suiteConf.shipping_method;
        const paymentMethod = conf.suiteConf.payment_method;

        const rawDataJson = await scheduler.getData();
        if (rawDataJson) {
          scheduleData = rawDataJson as PaypalScheduleData;
          isSchedule = true;
        } else {
          scheduleData = {
            orderId: 0,
            totalOrderSF: "",
          };
        }

        await test.step(`
          Lên storefront của shop
          Checkout sản phẩm
          Nhập thông tin customer information
          Chọn shipping method
          Nhập discount code
          Chọn payment method và complete order`, async () => {
          if (isSchedule && process.env.ENV == "dev") {
            return;
          }
          const themeSetting = new SettingThemeAPI(theme);
          await themeSetting.editCheckoutLayout("multi-step");
          await homepage.gotoHomePage();

          // Checkout sản phẩm
          productPage = await homepage.searchThenViewProduct(productName);
          await productPage.addProductToCart();
          await productPage.navigateToCheckoutPage();

          // Nhập thông tin customer information
          checkout = new SFCheckout(page, domain, "", request);
          await checkout.enterShippingAddress(customerInfo);

          // Chọn shipping method
          await checkout.selectShippingMethod(shippingMethod);
          await checkout.continueToPaymentMethod();

          // Nhập discount code
          if (discount) {
            await checkout.applyDiscountCode(discount);
          }

          // Chọn payment method và complete order
          await checkout.selectPaymentMethod(paymentMethod);
          await checkout.completeOrderViaPayPal(paypalAccount);
        });

        await test.step(`
          Tại popup ppc, chọn item post purchase và commplete order
          Kiểm tra thank you page: order id, total order, customer name, customer email`, async () => {
          if (isSchedule && process.env.ENV == "dev") {
            return;
          }
          itemPostPurchaseValue = await checkout.addProductPostPurchase(ppcItem);
          if (itemPostPurchaseValue != null) {
            isPostPurchase = true;
            await checkout.completePaymentForPostPurchaseItem(paymentMethod);
          }

          totalOrderSF = await checkout.getTotalOnOrderSummary();
          orderId = await checkout.getOrderIdBySDK();
        });

        await test.step("Mở order detail bằng API và kiểm tra order detail", async () => {
          if (isSchedule && process.env.ENV == "dev") {
            orderId = scheduleData.orderId;
            totalOrderSF = scheduleData.totalOrderSF;
          }
          // Clear schedule data
          if (isSchedule && process.env.ENV == "dev") {
            await scheduler.clear();
          }

          await orderPage.goToOrderByOrderId(orderId);
          const reloadTime = conf.caseConf.reload_time ?? 10;

          try {
            //cause sometimes order captures slower than usual
            orderStatus = await orderPage.reloadUntilOrdCapture(null, reloadTime);
          } catch {
            scheduleData.orderId = orderId;
            scheduleData.totalOrderSF = totalOrderSF;
            await scheduler.setData(scheduleData);
            await scheduler.schedule({ mode: "later", minutes: 5 });
            // eslint-disable-next-line playwright/no-skipped-test
            test.skip();
          }
          expect(orderStatus).toEqual("Paid");

          const actualTotalOrder = await orderPage.getTotalOrder();
          expect(actualTotalOrder).toEqual(totalOrderSF);

          const actualPaidByCustomer = await orderPage.getPaidByCustomer();
          expect(actualPaidByCustomer).toEqual(totalOrderSF);

          // temporarily skip check timeline on dev env
          // need to check again when dev env is stable
          if (process.env.ENV == "dev") {
            return;
          }

          const orderTimeline = orderPage.generateOrdTimeline(customerInfo, {
            total_amount: totalOrderSF,
            payment_gateway: paymentMethod,
            item_post_purchase_value: itemPostPurchaseValue,
          });
          const orderTimelineSendingEmail = orderTimeline.timelineSendEmail;
          const orderTimelineCustomerPlaceOrder = orderTimeline.timelinePlaceOrd;
          const orderTimelinePaymentProcessed = orderTimeline.timelinePaymentProcessed;
          const orderTimeLinePaymentProcessedItemPPC = orderTimeline.timelinePaymentProcessedPPC;
          const orderTimelineTransID = orderTimeline.timelineTransId;

          await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
          await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
          await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
          await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
          if (ppcItem != null) {
            await expect(await orderPage.orderTimeLines(orderTimeLinePaymentProcessedItemPPC)).toBeVisible();
            await expect(
              await orderPage.orderTimeLines(orderTimelineTransID, isPostPurchase, paymentMethod),
            ).toBeVisible();
          }
        });
      });
    },
  );
});

test.describe("Kiểm tra sync tracking number lên paypal dashboard", () => {
  let checkout: SFCheckout;
  let orderPage: OrdersPage;
  let orderApi: OrderAPI;
  let orderId: number;
  let domain, customerInfo, shippingMethod, paymentMethod;
  let paypalAccount;

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    customerInfo = conf.suiteConf.customer_info;
    shippingMethod = conf.suiteConf.shipping_method;
    paymentMethod = conf.suiteConf.payment_method;
    paypalAccount = conf.suiteConf.paypal_account;
  });

  test.beforeEach(async ({ page, conf, request, theme, dashboard }) => {
    const productName = conf.caseConf.product_name;
    await new SettingThemeAPI(theme).editCheckoutLayout("multi-step");
    const homepage = new SFHome(page, domain);
    await homepage.gotoHomePage();
    const productPage = await homepage.searchThenViewProduct(productName);
    await productPage.addProductToCart();
    await productPage.navigateToCheckoutPage();

    checkout = new SFCheckout(page, domain, "", request);
    await checkout.enterShippingAddress(customerInfo);
    await checkout.selectShippingMethod(shippingMethod);
    await checkout.continueToPaymentMethod();
    await checkout.selectPaymentMethod(paymentMethod);
    await checkout.completeOrderViaPayPal(paypalAccount);
    await page.waitForSelector(`//h2[normalize-space()='Thank you!']`);
    orderId = await checkout.getOrderIdBySDK();
    orderPage = new OrdersPage(dashboard, domain);
    await orderPage.goToOrderByOrderId(orderId);
    const reloadTime = conf.caseConf.reload_time ?? 10;
    const orderStatus = await orderPage.getOrderStatus();
    await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
  });

  test(`@SB_CHE_PP_25 - Kiểm tra tracking number sync lên paypal transaction với 1 tracking number cho cả order`, async ({
    conf,
    authRequestWithExchangeToken,
  }) => {
    await test.step(`Tại Dashboard > vào Order detail của order đã tạo >
     Mark as fulfilled > Nhập tracking number > Fulfill order`, async () => {
      await orderPage.markAsFulfillOrd();
      await expect(orderPage.page.locator(`//span[span[normalize-space()='Fulfilled']]`)).toBeVisible();
    });
    await test.step(`Tại order detail > Order timeline > Lấy ra Paypal Transaction`, async () => {
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);
      const transId = await orderApi.getTransactionId(orderId);
      expect(transId).not.toBe(undefined); // In order to verify transaction id is detected
    });
    await test.step(`Vào Paypal sandbox dashboard >Activity > All transaction >
     Search theo transaction ID vừa lấy ra, check tracking number của transaction`, async () => {
      const trackingInfo = conf.caseConf.tracking_info;
      const statusCode = await orderApi.verifyTrackingInfoInPaypal(
        {
          id: paypalAccount.id,
          secretKey: paypalAccount.secret_key,
        },
        trackingInfo.number,
      );
      expect(statusCode).toBe(true);
    });
  });

  test(`@SB_CHE_PP_29 - Check tracking number sync lên paypal transaction khi update tracking number mới`, async ({
    conf,
    authRequestWithExchangeToken,
  }) => {
    //Pre-condition: fulfill order
    const trackingInfo = conf.caseConf.tracking_info;
    await orderPage.markAsFulfillOrd();

    await test.step(`Tại Dashboard > vào Order detail của order đã tạo >
     Cancel fulfillment > Fulfill order với tracking number khá`, async () => {
      await orderPage.cancelFulfillment();
      await orderPage.markAsFulfillOrd(trackingInfo);
      await expect(orderPage.page.locator(`//span[span[normalize-space()='Fulfilled']]`)).toBeVisible();
    });

    await test.step(`Tại order detail > Order timeline > Lấy ra Paypal Transaction`, async () => {
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);
      const transId = await orderApi.getTransactionId(orderId);
      expect(transId).not.toBe(undefined); // In order to verify transaction id is detected
    });

    await test.step(`Vào Paypal sandbox dashboard >Activity > All transaction >
     Search theo transaction ID vừa lấy ra, check tracking number của transaction`, async () => {
      const statusCode = await orderApi.verifyTrackingInfoInPaypal(
        {
          id: paypalAccount.id,
          secretKey: paypalAccount.secret_key,
        },
        trackingInfo.number,
      );
      expect(statusCode).toBe(true);
    });
  });
});
