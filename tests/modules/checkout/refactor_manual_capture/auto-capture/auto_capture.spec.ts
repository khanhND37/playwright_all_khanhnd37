/* eslint-disable @typescript-eslint/no-empty-function */
import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrderAPI } from "@pages/api/order";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Kiểm tra order details khi chọn setting Automatically capture payment for orders", () => {
  let orderId: number, shippingAddress, prodInfo, email: string, orderInfo, orderStatus: string;
  let totalOrder: string, accessToken: string;
  let countryCode: string, stripeScretKey: string, refundAmount: number, capturedAmount: number, ordAmount: number;
  let domain: string, paypalAccount;

  let checkout: SFCheckout, orderPage: OrdersPage, checkoutAPI: CheckoutAPI;
  let orderAPI: OrderAPI;

  test.beforeAll(async ({ conf, token }) => {
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;

    domain = conf.suiteConf.domain;
    shippingAddress = conf.suiteConf.shipping_address;
    prodInfo = conf.suiteConf.product;
    email = conf.suiteConf.email;
    stripeScretKey = conf.suiteConf.stripe_secret_key;
    paypalAccount = conf.suiteConf.paypal_account;
    countryCode = shippingAddress.country_code;
  });

  test.beforeEach(async ({ page, authRequest }) => {
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    orderAPI = new OrderAPI(domain, authRequest);

    // Open checkout page by API
    await checkoutAPI.addProductToCartThenCheckout(prodInfo);
    await checkoutAPI.updateCustomerInformation(email, shippingAddress);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    checkout = await checkoutAPI.openCheckoutPageByToken();
  });

  test("Kiểm tra order tự động capture khi checkout qua Embedded gateway @TC_SB_SET_PMS_MC_219", async ({ page }) => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Stripe", async () => {
      //Complete order via Stripe and get order info
      await checkout.completeOrderWithMethod();
      orderId = await checkout.getOrderIdBySDK();
      totalOrder = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Kiểm tra order details của order vừa tạo", async () => {
      // Open order details page by API and verify order info in order details page
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      let actualPaymentStatus = await orderPage.getOrderStatus();
      actualPaymentStatus = await orderPage.reloadUntilOrdCapture(actualPaymentStatus);
      expect(actualPaymentStatus).toEqual("Paid");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(paidByCustomer).toEqual(totalOrder);
      const xpathTimeline = `//div[contains(text(), 'A ${paidByCustomer} USD payment was processed')]`;
      let i = 0;
      while (!page.locator(xpathTimeline).isVisible()) {
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForSelector(xpathTimeline);
        i++;
        if (i == 3) {
          break;
        }
      }
      expect(await orderPage.genLoc(orderPage.xpathBtnCaptureOrder).isHidden()).toBeTruthy();
    });

    await test.step("Tại Dashboard Stripe: Kiểm tra order được capture đúng", async () => {
      // Get order info in Stripe dashboard then get order info in Stripe dashboard
      await orderAPI.getTransactionId(orderId);
      orderInfo = await orderAPI.getOrdInfoInStripe({ key: stripeScretKey });
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

  test("Kiểm tra order tự động capture khi checkout qua Hosted gateway @TC_SB_SET_PMS_MC_220", async ({ page }) => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Paypal", async () => {
      await checkout.completeOrderWithMethod("Paypal");
      orderId = await checkout.getOrderIdBySDK();
      totalOrder = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Kiểm tra order details order vừa tạo", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      let actualPaymentStatus = await orderPage.getOrderStatus();
      actualPaymentStatus = await orderPage.reloadUntilOrdCapture(actualPaymentStatus);
      expect(actualPaymentStatus).toEqual("Paid");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(paidByCustomer).toEqual(totalOrder);
      const xpathTimeline = `//div[contains(text(), 'A ${paidByCustomer} USD payment was processed')]`;
      let i = 0;
      while (!page.locator(xpathTimeline).isVisible()) {
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForSelector(xpathTimeline);
        i++;
        if (i == 3) {
          break;
        }
      }
      expect(await orderPage.genLoc(orderPage.xpathBtnCaptureOrder).isHidden()).toBeTruthy();
    });

    await test.step("Tại Dashboard Paypal: Kiểm tra order được capture đúng", async () => {
      // Get order info in Stripe dashboard then verify order info in Stripe dashboard
      await orderAPI.getTransactionId(orderId);
      orderInfo = await orderAPI.getOrdInfoInPaypal({ id: paypalAccount.id, secretKey: paypalAccount.secret_key });
      ordAmount = orderInfo.total_amount;
      orderStatus = orderInfo.order_status;

      // Verify order info
      expect(ordAmount).toEqual(removeCurrencySymbol(totalOrder));
      expect(orderStatus).toEqual("COMPLETED");
    });
  });

  test("Kiểm tra order details của order checkout qua COD @TC_SB_SET_PMS_MC_221", async () => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua COD", async () => {
      await checkout.completeOrderWithMethod("cod");
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("Tại Dashboard: Kiểm tra payment status order vừa tạo", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      await orderPage.reloadUntilOrdCapture(actualPaymentStatus);
      expect(actualPaymentStatus).toEqual("Pending");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(paidByCustomer).toEqual("$0.00");
      expect(await orderPage.genLoc(orderPage.xpathBtnCaptureOrder).isHidden()).toBeTruthy();
    });
  });
});
