import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OrdersPage } from "@pages/dashboard/orders";

import { loadData } from "@core/conf/conf";
import { buildOrderTimelineMsg } from "@utils/checkout";
import { PaypalScheduleData } from "../capture";

test.describe("Kiểm tra order detail trong dashboard khi checkout với paypal pcp, Setting checkout 3 pages", () => {
  const caseName = "TC_CHE_PCP_01";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(({ product_name: productName, product_ppc_name: ppcItem, case_id: caseID }) => {
    test(`@${caseID} Kiểm tra order detal khi checkout với paypal pcp for case`, async ({
      page,
      conf,
      dashboard,
      scheduler,
    }) => {
      // prepair data for
      const domain = conf.suiteConf.domain;
      const homepage = new SFHome(page, domain);
      let checkout: SFCheckout;
      let productPage: SFProduct;
      let orderPage: OrdersPage;
      let orderId: number;
      let totalOrderSF: string;
      let customerEmail: string;
      let isSchedule: boolean;
      let orderStatus: string;
      let scheduleData: PaypalScheduleData;

      let isPostPurchase = false;
      let itemPostPurchaseValue = "0";

      const paypalAccount = conf.suiteConf.paypal_account;
      const customerInfo = conf.suiteConf.customer_info;
      const shippingMethod = conf.suiteConf.shipping_method;
      const paymentMethod = conf.suiteConf.payment_method;
      const reloadTime = conf.caseConf.reload_time ?? 10;
      test.setTimeout(400000);

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
        await homepage.gotoHomePage();
      });

      await test.step("Checkout sản phẩm", async () => {
        productPage = await homepage.searchThenViewProduct(productName);
        await productPage.addProductToCart();
        await productPage.navigateToCheckoutPage();

        // Nhập thông tin customer information
        checkout = new SFCheckout(page, domain);
        await checkout.enterShippingAddress(customerInfo);
        await checkout.footerLoc.scrollIntoViewIfNeeded();

        // Chọn shipping method
        await checkout.selectShippingMethod(shippingMethod);
        await checkout.continueToPaymentMethod();

        // Chọn payment method và complete order
        await checkout.selectPaymentMethod(paymentMethod);
        await checkout.completeOrderViaPayPal(paypalAccount);
        await page.waitForSelector(checkout.xpathThankYou);
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
        customerEmail = await checkout.getCustomerEmail();
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

        orderPage = new OrdersPage(dashboard, domain);
        await orderPage.goToOrderByOrderId(orderId);

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

        // temporarily skip check timeline on dev env
        // need to check again when dev env is stable
        if (process.env.ENV == "dev") {
          return;
        }

        const orderTimelineSendingEmail = buildOrderTimelineMsg(
          customerInfo.first_name,
          customerInfo.last_name,
          customerEmail,
        ).timelineSendEmail;
        const orderTimelineCustomerPlaceOrder = buildOrderTimelineMsg(
          customerInfo.first_name,
          customerInfo.last_name,
          customerEmail,
        ).timelinePlaceOrd;
        const orderTimelinePaymentProcessed = orderPage.buildOrderTimelineMsgByGW(
          totalOrderSF,
          paymentMethod,
          itemPostPurchaseValue,
        );
        const orderTimeLinePaymentProcessedItemPPC = orderPage.buildOrderTimelinePPCMsgByGW(
          paymentMethod,
          itemPostPurchaseValue,
        );
        const orderTimelineTransID = orderPage.getTimelineTransIDByGW(paymentMethod);

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
  });
});
