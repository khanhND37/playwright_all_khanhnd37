import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { OrderAPI } from "@pages/api/order";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { CaptureScheduleData } from "../capture";

test.describe("Delay capture", async () => {
  let orderId: number, shippingAddress, prodInfo, email: string, orderInfo, orderStatus: string;
  let totalOrder: string;
  let countryCode: string, secretKey: string, refundAmount: number, capturedAmount: number, ordAmount: number;
  let domain: string, shopId: number, paymentId: number, scheduleTime: number;

  let checkout: SFCheckout, orderPage: OrdersPage, dashboardAPI: DashboardAPI, checkoutAPI: CheckoutAPI;
  let dashboardPage: DashboardPage, orderAPI: OrderAPI;
  let scheduleData: CaptureScheduleData;

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    shippingAddress = conf.suiteConf.shipping_address;
    shopId = conf.suiteConf.shop_id;
    paymentId = conf.suiteConf.payment_method_id;
    prodInfo = conf.suiteConf.product;
    email = conf.suiteConf.email;
    secretKey = conf.suiteConf.secret_key;
    countryCode = shippingAddress.country_code;
    scheduleTime = conf.suiteConf.schedule_time;
  });

  test.beforeEach(async ({ page, dashboard, authRequest, scheduler }) => {
    dashboardPage = new DashboardPage(dashboard, domain);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    orderAPI = new OrderAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);

    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as CaptureScheduleData;
    } else {
      scheduleData = {
        orderId: 0,
        totalOrderSF: 0,
      };
    }

    if (scheduleData.orderId !== 0) {
      return;
    }
    // Open checkout page by API
    await checkoutAPI.addProductToCartThenCheckout(prodInfo);
    await checkoutAPI.updateCustomerInformation(email, shippingAddress);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    checkout = await checkoutAPI.openCheckoutPageByToken();
  });

  test("Capture toàn bộ order thành công @TC_SB_SET_PMS_MC_208", async () => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order", async () => {
      // Complete order then get order info
      await checkout.completeOrderWithMethod();
      await checkout.btnClosePPCPopup.click();
      orderId = await checkout.getOrderIdBySDK();
      totalOrder = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Kiểm tra order details và capture toàn bộ order vừa tạo", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");

      // Capture all order then verify order details
      const captureAmount = removeCurrencySymbol(totalOrder);
      await orderPage.captureOrder(captureAmount);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(paidByCustomer).toEqual(totalOrder);
      expect(await orderPage.genLoc(orderPage.xpathBtnCaptureOrder).isHidden()).toBeTruthy();
    });

    await test.step("Tại Dashboard Stripe: Kiểm tra order được capture đúng", async () => {
      // Get order info in Stripe dashboard then get order info in Stripe dashboard
      await orderAPI.getTransactionId(orderId);
      orderInfo = await orderAPI.getOrdInfoInStripe({ key: secretKey });
      ordAmount = Number((orderInfo.ordAmount / 100).toFixed(2));
      orderStatus = orderInfo.orderStatus;
      capturedAmount = Number((orderInfo.ordCaptureAmt / 100).toFixed(2));
      refundAmount = Number((orderInfo.ordRefundAmt / 100).toFixed(2));

      // Verify order info
      expect(ordAmount).toEqual(Number(removeCurrencySymbol(totalOrder)));
      expect(orderStatus).toEqual("succeeded");
      expect(capturedAmount).toEqual(Number(removeCurrencySymbol(totalOrder)));
      expect(refundAmount).toEqual(0);
    });
  });

  test("Capture 1 phần order thành công @TC_SB_SET_PMS_MC_209", async ({ conf }) => {
    const captureAmount = conf.caseConf.capture_amount;

    await test.step("Tại Storefront: Thực hiện checkout 1 order", async () => {
      // Complete order then get order info
      await checkout.completeOrderWithMethod();
      await checkout.btnClosePPCPopup.click();
      orderId = await checkout.getOrderIdBySDK();
      totalOrder = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Kiểm tra order details và capture 1 phần order vừa tạo", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");

      // Capture part of order then verify order details
      await orderPage.captureOrder(captureAmount);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(paidByCustomer).toEqual(`$${captureAmount}`);
      expect(await orderPage.genLoc(orderPage.xpathBtnCaptureOrder).isHidden()).toBeTruthy();
    });

    await test.step("Tại Dashboard Stripe: Kiểm tra order được capture đúng", async () => {
      // Get order info in Stripe dashboard then get order info in Stripe dashboard
      await orderAPI.getTransactionId(orderId);
      orderInfo = await orderAPI.getOrdInfoInStripe({ key: secretKey });
      ordAmount = Number((orderInfo.ordAmount / 100).toFixed(2));
      orderStatus = orderInfo.orderStatus;
      capturedAmount = Number((orderInfo.ordCaptureAmt / 100).toFixed(2));
      refundAmount = Number((orderInfo.ordRefundAmt / 100).toFixed(2));

      // Verify order info
      expect(ordAmount).toEqual(Number(removeCurrencySymbol(totalOrder)));
      expect(orderStatus).toEqual("succeeded");
      expect(refundAmount).toEqual(Number(removeCurrencySymbol(totalOrder)) - capturedAmount);
      expect(capturedAmount).toEqual(Number(captureAmount));
    });
  });

  test("Kiểm tra order checkout qua Stripe EU không bị ảnh hưởng bởi delay capture @TC_SB_SET_PMS_MC_216", async ({
    conf,
  }) => {
    const paymentGateway = conf.caseConf.payment_gateway;

    // Complete order then get order info
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Stripe EU", async () => {
      await checkout.completeOrderWithMethod(paymentGateway);
      await checkout.btnClosePPCPopup.click();
      orderId = await checkout.getOrderIdBySDK();
      totalOrder = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Kiểm tra order details của order vừa tạo", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      await orderPage.reloadUntilOrdCapture(actualPaymentStatus);
      expect(actualPaymentStatus).toEqual("Paid");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(paidByCustomer).toEqual(totalOrder);
      expect(await orderPage.genLoc(orderPage.xpathBtnCaptureOrder).isHidden()).toBeTruthy();
    });
  });

  test("Không thể refund order, có thể cancel order khi order chưa được capture @TC_SB_SET_PMS_MC_213", async () => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Stripe", async () => {
      // Complete order then get order info
      await checkout.completeOrderWithMethod();
      await checkout.btnClosePPCPopup.click();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("Tại Dashboard: Kiểm tra order details của order vừa tạo và thực hiện cancel order", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");
      expect(await orderPage.genLoc(orderPage.xpathBtnRefundOrder).isHidden()).toBeTruthy();
      await orderPage.cancelOrderInOrderDetails();
    });
  });

  test("Kiểm tra capture nhiều order tại order list @TC_SB_SET_PMS_MC_215", async ({ page }) => {
    const listOrderName: Array<string> = [];
    const listOrderId: Array<number> = [];
    let orderId: number, orderName: string;

    await test.step("Tại Storefront: Thực hiện checkout 2 order", async () => {
      await test.step("Tạo order thứ nhất qua Stripe", async () => {
        await checkout.completeOrderWithMethod();
        await checkout.btnClosePPCPopup.click();

        //// Get order info
        orderId = await checkout.getOrderIdBySDK();
        orderName = await checkout.getOrderName();
        listOrderName.push(orderName);
        listOrderId.push(orderId);
      });

      await test.step("Tạo order thứ hai qua Stripe", async () => {
        await checkoutAPI.addProductToCartThenCheckout(prodInfo);
        await checkoutAPI.updateCustomerInformation(email, shippingAddress);
        await checkoutAPI.selectDefaultShippingMethod(countryCode);
        await checkoutAPI.openCheckoutPageByToken();
        await checkout.completeOrderWithMethod();
        await checkout.btnClosePPCPopup.click();

        // Get order info
        orderId = await checkout.getOrderIdBySDK();
        orderName = await checkout.getOrderName();
        listOrderName.push(orderName);
        listOrderId.push(orderId);
      });
    });

    await test.step("Tại Order list: Capture 2 order vừa tạo", async () => {
      //Capture 2 order in order list
      await dashboardPage.navigateToMenu("Orders");
      for (let i = 0; i < listOrderName.length; i++) {
        await orderPage.chooseOrderAtOrderList(listOrderName[i]);
      }
      await orderPage.captureOrderAtOrderList();
    });

    await test.step("Kiểm tra order details của 2 order vừa tạo", async () => {
      // Open order details page by API then verify
      orderPage = new OrdersPage(page, domain);
      for (let i = 0; i < listOrderId.length; i++) {
        await orderPage.goToOrderByOrderId(listOrderId[i]);
        const actualPaymentStatus = await orderPage.getOrderStatus();
        await orderPage.reloadUntilOrdCapture(actualPaymentStatus);
        expect(actualPaymentStatus).toEqual("Paid");
        const paidByCustomer = await orderPage.getPaidByCustomer();
        await expect(
          page.locator(`//div[contains(text(), 'A ${paidByCustomer} USD payment was processed')]`),
        ).toBeVisible();
      }
    });
  });

  test("Kiểm tra không cho phép capture order khi order đang chờ PPC @TC_SB_SET_PMS_MC_212", async () => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order tới bước thêm PPC", async () => {
      // Complete order without PPC then get order info
      await checkout.completeOrderWithMethod();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("Tại Dashboard: Kiểm tra order details của order vừa tạo", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");
      expect(await orderPage.genLoc(orderPage.xpathBtnCaptureOrder).isHidden()).toBeTruthy();
    });
  });

  test("Kiểm tra capture order thanh toán qua cổng đã bị deactive thành công @TC_SB_SET_PMS_MC_210", async ({}) => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Paypal", async () => {
      // Complete order then get order info
      await checkout.completeOrderWithMethod("Paypal");
      await checkout.btnClosePPCPopup.click();
      orderId = await checkout.getOrderIdBySDK();
      totalOrder = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Deactive cổng Paypal", async () => {
      await dashboardAPI.activePaymentMethod(shopId, paymentId, false);
    });

    await test.step("Tại Order details: Capture order vừa tạo sau khi deactive cổng Paypal", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");
      const captureAmount = removeCurrencySymbol(totalOrder);
      await orderPage.captureOrder(captureAmount);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(paidByCustomer).toEqual(totalOrder);
    });
  });

  test("@SB_SET_PMS_MC_214 Kiểm tra tự động capture order sau 1 ngày khi bật setting 'Delay after 1 days from creation'", async ({
    scheduler,
  }) => {
    await test.step("Thực hiện checkout 1 order qua Paypal. Tại Dashboard kiểm tra order details của order vừa tạo", async () => {
      if (scheduleData.orderId !== 0) {
        return;
      }
      await checkout.completeOrderWithMethod("Paypal");
      await checkout.isThankyouPage();
      orderId = await checkout.getOrderIdBySDK();
      totalOrder = await checkout.getTotalOnOrderSummary();
      await orderPage.goToOrderByOrderId(orderId);
      expect(await orderPage.getOrderStatus()).toEqual("Authorized");
      expect(await orderPage.isBtnVisible("Capture payment")).toBeTruthy();
    });

    // in case verify order after 1 day -> set schedule data for daily job to verify in the next day
    if (scheduleData.orderId === 0) {
      scheduleData.orderId = orderId;
      scheduleData.totalOrderSF = Number(removeCurrencySymbol(totalOrder));
      await scheduler.setData(scheduleData);
      await scheduler.schedule({ mode: "later", minutes: scheduleTime });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    }

    await test.step("Sau 1 ngày: Kiểm tra order details của order vừa tạo", async () => {
      // Get data from schedule
      orderId = scheduleData.orderId;
      totalOrder = scheduleData.totalOrderSF.toString();

      //Clear schedule data
      await scheduler.clear();

      // Verify order details
      await orderPage.goToOrderByOrderId(orderId);
      expect(await orderPage.getOrderStatus()).toEqual("Paid");
      expect(await orderPage.isBtnVisible("Capture payment")).toBeFalsy();
      const paidByCustomer = removeCurrencySymbol(await orderPage.getPaidByCustomer());
      expect(paidByCustomer).toEqual(totalOrder);
    });
  });
});
