import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
// import { MailBox } from "@pages/thirdparty/mailbox";

test.describe("Checkout tipping plusbase", async () => {
  let productInfo, tippingInfo, shippingAddress;
  let orderId: number, tippingAmount: string, subTotal: string, email: string, totalOrderSF: string;
  let domain: string;
  let dashboardAPI: DashboardAPI, dashboardPage: DashboardPage;
  let orderPage: OrdersPage, checkoutAPI: CheckoutAPI, checkout: SFCheckout;

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;

    shippingAddress = conf.suiteConf.shipping_address;
    productInfo = conf.suiteConf.product;
    email = conf.suiteConf.email;
  });

  test.beforeEach(async ({ conf, authRequest, page, dashboard }) => {
    dashboardAPI = new DashboardAPI(domain, authRequest);
    dashboardPage = new DashboardPage(dashboard, domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    tippingInfo = conf.caseConf.tipping_info;

    // Add tip and complete order
    const resBody = await dashboardAPI.setupTipping(tippingInfo);
    expect(resBody.tip.enabled).toEqual(tippingInfo.enabled);
    expect(resBody.tip.percentages).toEqual(tippingInfo.percentages);

    const countryCode = shippingAddress.country_code;

    //Open checkout page by API
    await checkoutAPI.addProductToCartThenCheckout(productInfo);
    await checkoutAPI.updateCustomerInformation(email, shippingAddress);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    checkout = await checkoutAPI.openCheckoutPageByToken();
    subTotal = await checkout.getSubtotalOnOrderSummary();
  });

  test("Kiểm tra checkout một order có tip thành công với option tip @TC_SB_PLB_TIP_4", async () => {
    await test.step("Tại trang Store front: Thực hiện checkout 1 order qua Stripe với option tip", async () => {
      await checkout.addTip(tippingInfo);
      tippingAmount = await checkout.getTipOnOrderSummary();
      const expectTippingAmount = (
        (Number(removeCurrencySymbol(subTotal)) * tippingInfo.percentages[tippingInfo.option - 1]) /
        100
      ).toFixed(2);
      expect(removeCurrencySymbol(tippingAmount)).toEqual(expectTippingAmount);
      await checkout.completeOrderWithMethod();
      await checkout.btnClosePPCPopup.click();

      // Get order info
      orderId = await checkout.getOrderIdBySDK();
      // orderName = await checkout.getOrderName();
      totalOrderSF = await checkout.getTotalOnOrderSummary();
    });
    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      //Verify tipping in  order details
      orderPage = await dashboardPage.goToOrderDetails(orderId, "plusbase");
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount.split(" ")[0]);
      const totalOrderDB = await orderPage.getTotalOrder();
      expect(totalOrderDB).toEqual(totalOrderSF.split(" ")[0]);
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Tại Mailbox: Kiểm tra hiển thị tip tại email confirmation", async () => {
    //   //Verify tipping in email confirmation
    //   mailBox = await checkout.openMailBox(email);
    //   await mailBox.openOrderConfirmationNotification(orderName);
    //   const actualTippingAmount = await mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual(tippingAmount);
    // });
  });

  test("Kiểm tra checkout một order có tip thành công với custom tip @TC_SB_PLB_TIP_5", async () => {
    await test.step("Tại trang Store front: Thực hiện checkout 1 order qua Stripe với custom tip", async () => {
      // Add tip and complete order
      await checkout.addTip(tippingInfo);
      await checkout.completeOrderWithMethod();
      await checkout.btnClosePPCPopup.click();
      tippingAmount = await checkout.getTipOnOrderSummary();
      const expectTippingAmount = tippingInfo.tipping_amount;
      expect(removeCurrencySymbol(tippingAmount)).toEqual(expectTippingAmount);

      // Get order info
      orderId = await checkout.getOrderIdBySDK();
      // orderName = await checkout.getOrderName();
      totalOrderSF = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      //Verify tipping in  order details
      orderPage = await dashboardPage.goToOrderDetails(orderId, "plusbase");
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount.split(" ")[0]);
      const totalOrderDB = await orderPage.getTotalOrder();
      expect(totalOrderDB).toEqual(totalOrderSF.split(" ")[0]);
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Tại Mailbox: Kiểm tra hiển thị tip tại email confirmation", async () => {
    //   //Verify tipping in email confirmation
    //   mailBox = await checkout.openMailBox(email);
    //   await mailBox.openOrderConfirmationNotification(orderName);
    //   const actualTippingAmount = await mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual(tippingAmount);
    // });
  });

  test("Kiểm tra checkout một order có tip thành công với option 'No tip' @TC_SB_PLB_TIP_6", async () => {
    await test.step("Tại trang Store front: Thực hiện checkout 1 order qua Stripe với option 'No tip'", async () => {
      // Add tip and complete order
      await checkout.addTip(tippingInfo);
      await checkout.waitUntilElementInvisible("//tr[child::td[text()='Tip']]//span[@class='order-summary__emphasis']");
      await checkout.completeOrderWithMethod();
      await checkout.btnClosePPCPopup.click();

      // Get order info
      orderId = await checkout.getOrderIdBySDK();
      // orderName = await checkout.getOrderName();
      totalOrderSF = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      orderPage = await dashboardPage.goToOrderDetails(orderId, "plusbase");
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual("$0.00");
      const totalOrderDB = await orderPage.getTotalOrder();
      expect(totalOrderDB).toEqual(totalOrderSF.split(" ")[0]);
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Tại Mailbox: Kiểm tra hiển thị tip tại email confirmation", async () => {
    //   //Verify tipping in email confirmation
    //   mailBox = await checkout.openMailBox(email);
    //   await mailBox.openOrderConfirmationNotification(orderName);
    //   const actualTippingAmount = await mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual("$0.00");
    // });
  });
});
