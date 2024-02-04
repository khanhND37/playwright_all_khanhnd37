import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OrdersPage } from "@pages/dashboard/orders";
import { buildOrderTimelineMsg, isEqual } from "@utils/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { PaypalScheduleData } from "../capture";

test.describe("Kiểm tra order detail trong dashboard khi checkout với paypal, Setting checkout one pages ", () => {
  // eslint-disable-next-line max-len
  test("@TC_SB_CHE_PP_40 - Kiểm tra order detail trong dashboard và khi checkout với paypal standard, setting checkout 1 page", async ({
    page,
    conf,
    request,
    dashboard,
    scheduler,
  }) => {
    // prepair data for
    let checkout: SFCheckout;
    let productPage: SFProduct;
    let orderId: number;
    let totalOrderSF: string;
    let shippingFee: number;
    let totalOrderSandboxPaypal: number;
    let customerEmail: string;
    const itemPostPurchaseValue = "0";
    let isSchedule: boolean;
    let scheduleData: PaypalScheduleData;
    let orderStatus: string;

    const domain = conf.suiteConf.domain;
    const homepage = new SFHome(page, domain);
    const orderPage = new OrdersPage(dashboard, domain);
    const paypalAccount = conf.suiteConf.paypal_account;
    const customerInfo = conf.suiteConf.customer_info;
    const product = conf.suiteConf.product;
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

    await test.step(`- Lên storefront của shop
                     - Checkout sản phẩm: Shirt
                     - Nhập các thông tin trong trang:
                       + Customer information
                       + Shipping
                       + Chọn Payment method
                     - Click button "Complete order"
                     - Login vào Paypal account`, async () => {
      // Add product to cart and navigate to checkout page
      if (isSchedule && process.env.ENV == "dev") {
        return;
      }
      await homepage.gotoHomePage();
      productPage = await homepage.searchThenViewProduct(product.name);
      await productPage.addProductToCart();
      await productPage.navigateToCheckoutPage();

      // Input shipping address, shipping info, payment method
      checkout = new SFCheckout(page, domain, "", request);
      await checkout.enterShippingAddress(customerInfo);
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.selectPaymentMethod(paymentMethod);
      totalOrderSandboxPaypal = Number(removeCurrencySymbol(await checkout.completeOrderViaPayPal(paypalAccount)));

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      await expect(checkout.thankyouPageLoc).toBeVisible();
    });

    await test.step("Kiểm tra thank you page: order id, total order, customer name, customer email", async () => {
      if (isSchedule && process.env.ENV == "dev") {
        return;
      }
      shippingFee = Number((await checkout.getShippingInfoOnThankyouPage()).amount);
      expect(isEqual(totalOrderSandboxPaypal, product.price + shippingFee, 0.01)).toBeTruthy();
      customerEmail = await checkout.getCustomerEmail();
      orderId = await checkout.getOrderIdBySDK();
      totalOrderSF = await checkout.getTotalOnOrderSummary();
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
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(paymentMethod);

      await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
    });
  });
});
