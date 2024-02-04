import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Checkout tipping printbase", async () => {
  let tippingInfo, tippingAmount: string, totalOrderSF: string;
  let domain: string, email: string, shippingAddress, productInfo;
  let orderId: number, subTotal: string, dashboardPage: DashboardPage;
  let dashboardAPI: DashboardAPI, checkoutAPI: CheckoutAPI;
  let checkout: SFCheckout, orderPage: OrdersPage;

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address;
    productInfo = conf.suiteConf.product;
  });

  test.beforeEach(async ({ conf, authRequest, page, dashboard }) => {
    dashboardAPI = new DashboardAPI(domain, authRequest);
    dashboardPage = new DashboardPage(dashboard, domain);
    checkout = new SFCheckout(page, domain);
    tippingInfo = conf.caseConf.tipping_info;
    await dashboardAPI.setupTipping(tippingInfo);

    const countryCode = shippingAddress.country_code;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);

    //Open checkout page by API
    await checkoutAPI.addProductToCartThenCheckout(productInfo);
    await checkoutAPI.updateCustomerInformation(email, shippingAddress);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    checkout = await checkoutAPI.openCheckoutPageByToken();
    subTotal = await checkout.getSubtotalOnOrderSummary();
  });

  test("Kiểm tra checkout một order có tip thành công với option tip @TC_PB_TIP_4", async () => {
    await test.step("Tại trang Store front: Thực hiện checkout 1 order qua Stripe với option tip", async () => {
      // Add tip and complete order
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
      totalOrderSF = await checkout.getTotalOnOrderSummary();
    });
    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      //Verify tipping in  order details
      orderPage = await dashboardPage.goToOrderDetails(orderId, "printbase");
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount.split(" ")[0]);
      const totalOrderDB = await orderPage.getTotalOrder();
      expect(totalOrderDB).toEqual(totalOrderSF.split(" ")[0]);
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Kiểm tra hiển thị tip tại email confirmation", async () => {
    // Verify tipping in email confirmation
    // mailBox = await checkout.openMailBox(email);
    // await mailBox.openOrderConfirmationNotification(orderName);
    // Hiện đang không hiển thị tip trong email confirmation (config tại shop template) nên tạm thời bỏ qua
    //   const actualTippingAmount = await mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual(tippingAmount);
    // });
  });

  test("Kiểm tra checkout một order có tip thành công với custom tip @TC_PB_TIP_5", async () => {
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
      totalOrderSF = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      //Verify tipping in  order details
      orderPage = await dashboardPage.goToOrderDetails(orderId, "printbase");
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount.split(" ")[0]);
      const totalOrderDB = await orderPage.getTotalOrder();
      expect(totalOrderDB).toEqual(totalOrderSF.split(" ")[0]);
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Kiểm tra hiển thị tip tại email confirmation", async () => {
    // Verify tipping in email confirmation
    // mailBox = await checkout.openMailBox(email);
    // await mailBox.openOrderConfirmationNotification(orderName);
    // Hiện đang không hiển thị tip trong email confirmation (config tại shop template) nên tạm thời bỏ qua
    // const actualTippingAmount = await mailBox.getTippping();
    // expect(actualTippingAmount).toEqual(tippingAmount);
    // });
  });

  test("Kiểm tra checkout một order có tip thành công với option 'No tip' @TC_PB_TIP_6", async () => {
    await test.step("Tại trang Store front: Thực hiện checkout 1 order qua Stripe với option 'No tip'", async () => {
      // Add tip and complete order
      await checkout.addTip(tippingInfo);
      await checkout.waitUntilElementInvisible("//tr[child::td[text()='Tip']]//span[@class='order-summary__emphasis']");
      await checkout.completeOrderWithMethod();
      await checkout.btnClosePPCPopup.click();

      // Get order info
      orderId = await checkout.getOrderIdBySDK();
      totalOrderSF = await checkout.getTotalOnOrderSummary();
    });
    await test.step("Kiểm tra tip hiển thị trong order details", async () => {
      //Verify tipping in  order details
      orderPage = await dashboardPage.goToOrderDetails(orderId, "printbase");
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual("$0.00");
      const totalOrderDB = await orderPage.getTotalOrder();
      expect(totalOrderDB).toEqual(totalOrderSF.split(" ")[0]);
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Tại mailbox buyer: Kiểm tra hiển thị tip tại email confirmation", async () => {
    //   //Verify tipping in email confirmation
    //   mailBox = await checkout.openMailBox(email);
    //   await mailBox.openOrderConfirmationNotification(orderName);
    //   // Hiện đang không hiển thị tip trong email confirmation (config tại shop template) nên tạm thời bỏ qua
    //   // const actualTippingAmount = await mailBox.getTippping();
    //   // expect(actualTippingAmount).toEqual("$0.00");
    // });
  });
});
