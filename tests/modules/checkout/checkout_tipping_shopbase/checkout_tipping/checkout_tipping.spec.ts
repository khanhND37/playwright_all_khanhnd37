import { test } from "@fixtures/theme";
import { expect } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { Dev, TcSbTip } from "./checkout_tipping";
test.describe("Checkout tipping shopbase", async () => {
  // Defind variable
  let customerInfo, productInfo, tippingInfo, email;
  let domain, orderId, tippingAmount, subTotal;

  let checkoutAPI: CheckoutAPI;
  let dashboardAPI: DashboardAPI;
  let themeSetting: SettingThemeAPI;
  let checkout: SFCheckout, orderPage: OrdersPage;

  test.beforeAll(async ({ conf }) => {
    // init data
    const suiteConf = conf.suiteConf as Dev;
    customerInfo = suiteConf.customer_info;
    productInfo = suiteConf.product;
    domain = suiteConf.domain;
  });

  test.beforeEach(async ({ conf, authRequest, page, theme, dashboard }) => {
    // init page
    checkout = new SFCheckout(page, domain);
    themeSetting = new SettingThemeAPI(theme);
    orderPage = new OrdersPage(dashboard, domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    dashboardAPI = new DashboardAPI(domain, authRequest);

    // init data
    const caseConf = conf.caseConf as TcSbTip;
    tippingInfo = caseConf.tipping_info;
    email = conf.suiteConf.email;

    // Setting tip in theme setting and checkout setting
    await themeSetting.editCheckoutFormOptions({ tipping: tippingInfo });
    await dashboardAPI.setupTipping(tippingInfo);
    // Verify tipping in bootstrap
    await checkoutAPI.verifyTippingInBootstrap(tippingInfo);

    // Go to checkout page
    await checkoutAPI.addProductToCartThenCheckout(productInfo);
    await checkoutAPI.updateCustomerInformation(email, customerInfo);
    await checkoutAPI.selectDefaultShippingMethod(customerInfo.country_code);
    checkout = await checkoutAPI.openCheckoutPageByToken();
    // Wait for footer visible
    await expect(checkout.footerLoc).toBeVisible();
    await checkout.footerLoc.scrollIntoViewIfNeeded();
  });

  test(`@TC_SB_TIP_06 Chọn option tip và kiểm tra checkout order thành công khi set 'Click to show detailed tipping options'`, async () => {
    await test.step(`Tại trang Store front: Thực hiện Add to cart 1 product vào cart và di chuyển đến trang Checkout`, async () => {
      await checkout.verifyTippingAtCheckoutPage(tippingInfo);
    });

    await test.step(`Chọn tipping option`, async () => {
      await checkout.addTip(tippingInfo);
      tippingAmount = await checkout.getTipOnOrderSummary();
      subTotal = await checkout.getSubtotalOnOrderSummary();
      const expectTippingAmount = (
        (Number(removeCurrencySymbol(subTotal)) * tippingInfo.percentages[tippingInfo.option - 1]) /
        100
      ).toFixed(2);
      expect(removeCurrencySymbol(tippingAmount)).toEqual(expectTippingAmount);
    });

    await test.step(`Complete order qua Stripe`, async () => {
      await checkout.completeOrderWithMethod();
      await checkout.waitUntilElementVisible(checkout.xpathThankYou);
      orderId = await checkout.getOrderIdBySDK();
      // orderName = await checkout.getOrderName();
    });

    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount);
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Tại Mailbox: Kiểm tra hiển thị tip tại email confirmation", async () => {
    //   mailBox = await checkout.openMailBox(email);
    //   await mailBox.openOrderConfirmationNotification(orderName);
    //   const actualTippingAmount = await mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual(tippingAmount);
    // });
  });

  test(`@TC_SB_TIP_07 Nhập custom tip và kiểm tra checkout order thành công khi set 'Click to show detailed tipping options'`, async () => {
    await test.step(`Tại trang Store front: Thực hiện Add to cart 1 product vào cart và di chuyển đến trang Checkout`, async () => {
      await checkout.verifyTippingAtCheckoutPage(tippingInfo);
    });

    await test.step(`Nhâp tipping custom`, async () => {
      const subtotal = await checkout.getSubtotalOnOrderSummary();
      const customTip = Number(removeCurrencySymbol(subtotal)) + 1;
      await checkout.inputCustomTip(customTip.toFixed(2));
      await expect(checkout.getApplyTipErrorMsg(removeCurrencySymbol(subtotal))).toBeVisible();
    });

    await test.step(`Nhâp tipping custom`, async () => {
      await checkout.addTip(tippingInfo);
      tippingAmount = await checkout.getTipOnOrderSummary();
      const expectTippingAmount = tippingInfo.tipping_amount;
      expect(removeCurrencySymbol(tippingAmount)).toEqual(expectTippingAmount);
    });

    await test.step(`Complete order qua Stripe`, async () => {
      await checkout.completeOrderWithMethod();
      await checkout.waitUntilElementVisible(checkout.xpathThankYou);
      orderId = await checkout.getOrderIdBySDK();
      // orderName = await checkout.getOrderName();
    });

    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount);
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Tại Mailbox: Kiểm tra hiển thị tip tại email confirmation", async () => {
    //   mailBox = await checkout.openMailBox(email);
    //   await mailBox.openOrderConfirmationNotification(orderName);
    //   const actualTippingAmount = await mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual(tippingAmount);
    // });
  });

  test(`@TC_SB_TIP_08 Chọn option tip và kiểm tra checkout order thành công khi set 'Always show detailed tipping options'`, async () => {
    await test.step(`Tại trang Store front: Thực hiện Add to cart 1 product vào cart và di chuyển đến trang Checkout`, async () => {
      await checkout.verifyTippingAtCheckoutPage(tippingInfo);
    });

    await test.step(`Chọn tipping option`, async () => {
      await checkout.addTip(tippingInfo);
      tippingAmount = await checkout.getTipOnOrderSummary();
      subTotal = await checkout.getSubtotalOnOrderSummary();
      const expectTippingAmount = (
        (Number(removeCurrencySymbol(subTotal)) * tippingInfo.percentages[tippingInfo.option - 1]) /
        100
      ).toFixed(2);
      expect(removeCurrencySymbol(tippingAmount)).toEqual(expectTippingAmount);
    });

    await test.step(`Complete order qua Stripe`, async () => {
      await checkout.completeOrderWithMethod();
      await checkout.waitUntilElementVisible(checkout.xpathThankYou);
      orderId = await checkout.getOrderIdBySDK();
      // orderName = await checkout.getOrderName();
    });

    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount);
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Tại Mailbox: Kiểm tra hiển thị tip tại email confirmation", async () => {
    //   mailBox = await checkout.openMailBox(email);
    //   await mailBox.openOrderConfirmationNotification(orderName);
    //   const actualTippingAmount = await mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual(tippingAmount);
    // });
  });

  test(`@TC_SB_TIP_09 Nhập custom tip và kiểm tra checkout order thành công khi set 'Always show detailed tipping options'`, async () => {
    await test.step(`Tại trang Store front: Thực hiện Add to cart 1 product vào cart và di chuyển đến trang Checkout`, async () => {
      await checkout.verifyTippingAtCheckoutPage(tippingInfo);
    });

    await test.step(`Nhâp tipping custom`, async () => {
      const subtotal = await checkout.getSubtotalOnOrderSummary();
      const customTip = Number(removeCurrencySymbol(subtotal)) + 1;
      await checkout.inputCustomTip(customTip.toFixed(2));
      await expect(checkout.getApplyTipErrorMsg(removeCurrencySymbol(subtotal))).toBeVisible();
    });

    await test.step(`Nhâp tipping custom`, async () => {
      await checkout.addTip(tippingInfo);
      tippingAmount = await checkout.getTipOnOrderSummary();
      const expectTippingAmount = tippingInfo.tipping_amount;
      expect(removeCurrencySymbol(tippingAmount)).toEqual(expectTippingAmount);
    });

    await test.step(`Complete order qua Stripe`, async () => {
      await checkout.completeOrderWithMethod();
      await checkout.waitUntilElementVisible(checkout.xpathThankYou);
      orderId = await checkout.getOrderIdBySDK();
      // orderName = await checkout.getOrderName();
    });

    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount);
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Tại Mailbox: Kiểm tra hiển thị tip tại email confirmation", async () => {
    //   mailBox = await checkout.openMailBox(email);
    //   await mailBox.openOrderConfirmationNotification(orderName);
    //   const actualTippingAmount = await mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual(tippingAmount);
    // });
  });

  test(`@TC_SB_TIP_10 Chọn option 'No tip' và kiểm tra checkout order thành công`, async () => {
    await test.step(`Tại trang Store front: Thực hiện add product vào cart và di chuyển đến trang checkout`, async () => {
      await checkout.verifyTippingAtCheckoutPage(tippingInfo);
    });

    await test.step(`Chọn tipping option`, async () => {
      await checkout.addTip(tippingInfo);
      await checkout.waitUntilElementInvisible(checkout.xpathTippingAmt);
    });

    await test.step(`Complete order qua Stripe`, async () => {
      await checkout.completeOrderWithMethod();
      await checkout.waitUntilElementVisible(checkout.xpathThankYou);
      orderId = await checkout.getOrderIdBySDK();
      // orderName = await checkout.getOrderName();
    });

    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual("$0.00");
    });

    // Không cần check email tại đây do đã được handle trong case test CO
    // await test.step("Tại Mailbox: Kiểm tra hiển thị tip tại email confirmation", async () => {
    //   mailBox = await checkout.openMailBox(email);
    //   await mailBox.openOrderConfirmationNotification(orderName);
    //   const actualTippingAmount = await mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual(`$0.00`);
    // });
  });

  test(`@TC_SB_TIP_17 Tắt option tip ở trong theme setting và kiểm tra hiển thị ngoài trang checkout`, async () => {
    await test.step(`
      Tại trang Store front:  
      * Thực hiện Add to cart 1 product vào cart và di chuyển đến trang Checkout Nhập customer info
      * Chọn shipping method
      * Kiểm tra không hiển thị form tipping`, async () => {
      await checkout.verifyTippingAtCheckoutPage(tippingInfo);
    });
  });
});
