import { expect, test } from "@core/fixtures";
import { isEqual } from "@core/utils/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { DashboardAPI } from "@pages/api/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { MailBox } from "@pages/thirdparty/mailbox";

test.describe("Kiểm tra refund, cancel với order có tip", async () => {
  let accessToken, customerInfo, cardInfo, prodName, tippingInfo, shopId;
  let orderId, orderName, tippingAmount, refundInfo, totalOrder;
  let totalSalesAfter, tipAtSOTAfter, totalSales, tipAtSOT;
  let domain: string;
  let dashboardAPI: DashboardAPI;
  let homepage: SFHome, productPage: SFProduct, checkout: SFCheckout, orderPage: OrdersPage, mailBox: MailBox;

  test.beforeAll(async ({ conf, token }) => {
    domain = conf.suiteConf.domain;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.user_name,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;

    customerInfo = conf.suiteConf.customer_info;
    cardInfo = conf.suiteConf.card_info;
    prodName = conf.suiteConf.product.name;
    shopId = conf.suiteConf.shop_id;
    refundInfo = conf.suiteConf.refund_info;
  });

  test.beforeEach(async ({ conf, authRequest, page }) => {
    dashboardAPI = new DashboardAPI(domain, authRequest);
    tippingInfo = conf.suiteConf.tipping_info;
    const resBody = await dashboardAPI.setupTipping(tippingInfo);
    expect(resBody.tip.enabled).toEqual(tippingInfo.is_enable);
    expect(resBody.tip.percentages).toEqual(tippingInfo.percentages);
    totalSales = await dashboardAPI.getTotalSalesByShopId(shopId);
    tipAtSOT = await dashboardAPI.getTipAtSalesOverTimeByShopId(shopId);
    homepage = new SFHome(page, domain);
    await homepage.gotoHomePage();
    productPage = await homepage.searchThenViewProduct(prodName);
    await productPage.addProductToCart();
    checkout = await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(customerInfo);
    await checkout.continueToPaymentMethod();
    await checkout.addTip(tippingInfo);
    await checkout.completeOrderWithCardInfo(cardInfo);
    orderId = await checkout.getOrderIdBySDK();
    orderName = await checkout.getOrderName();
    tippingAmount = await checkout.getTipOnOrderSummary();
    totalOrder = await checkout.getTotalOnOrderSummary();
  });

  test("Kiểm tra refund tip trong order thành công @TC_SB_TIP_11", async () => {
    await test.step("Tại Dashboard: Kiểm tra tip hiển thị đúng và refund tip trong order details", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      const actualTippingAmount = await orderPage.getTip();
      expect(actualPaymentStatus).toEqual("Paid");
      expect(actualTippingAmount).toEqual(tippingAmount);
      refundInfo.refund_amount = removeCurrencySymbol(tippingAmount);
      await orderPage.refundOrderAtOrderDetails(refundInfo);
    });

    await test.step("Kiểm tra analytic sau khi refund", async () => {
      const expectTotalSalesAfter = Number(
        (totalSales + Number(removeCurrencySymbol(totalOrder)) - Number(refundInfo.refund_amount)).toFixed(2),
      );
      do {
        totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shopId);
      } while (totalSalesAfter === totalSales);
      expect(isEqual(expectTotalSalesAfter, totalSalesAfter, 0.01)).toEqual(true);
      await verifyTipAtSOTAfterRefund();
    });

    await test.step("Tại Mailbox: Kiểm tra hiển thị tip tại email refund", async () => {
      mailBox = await checkout.openMailBox(customerInfo.email);
      await mailBox.openRefundNotification();
      const actualTippingAmount = await mailBox.getTippping();
      expect(actualTippingAmount).toEqual(tippingAmount);
    });
  });

  test("Kiểm tra refund toàn bộ order có tip thành công @TC_SB_TIP_12", async () => {
    await test.step("Tại Dashboard: Kiểm tra tip hiển thị đúng và refund toàn bộ order", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      const actualTippingAmount = await orderPage.getTip();
      expect(actualPaymentStatus).toEqual("Paid");
      expect(actualTippingAmount).toEqual(tippingAmount);
      totalSales = await dashboardAPI.getTotalSalesByShopId(shopId);
      refundInfo.refund_amount = removeCurrencySymbol(totalOrder);
      await orderPage.refundOrderAtOrderDetails(refundInfo);
    });

    await test.step("Kiểm tra analytic sau khi refund", async () => {
      const expectTotalSalesAfter = Number(
        (totalSales + Number(removeCurrencySymbol(totalOrder)) - Number(refundInfo.refund_amount)).toFixed(2),
      );
      totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shopId);
      expect(isEqual(expectTotalSalesAfter, totalSalesAfter, 0.01)).toEqual(true);
      await verifyTipAtSOTAfterRefund();
    });

    await test.step("Tại Mailbox: Kiểm tra hiển thị tip tại email refund", async () => {
      mailBox = await checkout.openMailBox(customerInfo.email);
      await mailBox.openRefundNotification();
      const actualTippingAmount = await mailBox.getTippping();
      expect(actualTippingAmount).toEqual(tippingAmount);
    });
  });

  test("Kiểm tra cancel toàn bộ order có tip thành công @TC_SB_TIP_13", async () => {
    await test.step("Tại Dashboard: Kiểm tra tip hiển thị đúng và cancel toàn bộ order", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      const actualTippingAmount = await orderPage.getTip();
      expect(actualPaymentStatus).toEqual("Paid");
      expect(actualTippingAmount).toEqual(tippingAmount);
      totalSales = await dashboardAPI.getTotalSalesByShopId(shopId);
      refundInfo.refund_amount = removeCurrencySymbol(totalOrder);
      await orderPage.cancelOrderInOrderDetails();
    });

    await test.step("Kiểm tra analytic sau khi cancel", async () => {
      const expectTotalSalesAfter = Number((totalSales + Number(removeCurrencySymbol(tippingAmount))).toFixed(2));
      do {
        totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shopId);
      } while (totalSalesAfter === totalSales);
      expect(isEqual(expectTotalSalesAfter, totalSalesAfter, 0.01)).toEqual(true);
      await verifyTipAtSOTAfterRefund();
    });

    await test.step("Kiểm tra hiển thị tip tại email cancel", async () => {
      mailBox = await checkout.openMailBox(customerInfo.email);
      await mailBox.openOrderCanceledNotification(orderName);
      const actualTippingAmount = await mailBox.getTippping();
      expect(actualTippingAmount).toEqual(tippingAmount);
    });
  });

  test("Kiểm tra analytic khi checkout 1 order có tip @TC_SB_TIP_16", async () => {
    await test.step("Tại Dashboard: Kiểm tra tip hiển thị đúng trong order details", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      const actualTippingAmount = await orderPage.getTip();
      expect(actualPaymentStatus).toEqual("Paid");
      expect(actualTippingAmount).toEqual(tippingAmount);
    });

    await test.step("Kiểm tra analytic sau khi tạo order thành công", async () => {
      totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shopId);
      tipAtSOTAfter = await dashboardAPI.getTipAtSalesOverTimeByShopId(shopId);
      expect(totalSalesAfter).toEqual(totalSales + Number(removeCurrencySymbol(totalOrder)));
      expect(tipAtSOTAfter).toEqual(tipAtSOT + Number(removeCurrencySymbol(tippingAmount)));
    });
  });

  async function verifyTipAtSOTAfterRefund() {
    tipAtSOTAfter = await dashboardAPI.getTipAtSalesOverTimeByShopId(shopId);
    let i = 0;
    do {
      tipAtSOTAfter = await dashboardAPI.getTipAtSalesOverTimeByShopId(shopId);
      i++;
    } while (tipAtSOTAfter === tipAtSOT && i <= 5);
    const expectTipAtSOTAfter = tipAtSOT + Number(removeCurrencySymbol(tippingAmount));
    expect(isEqual(expectTipAtSOTAfter, tipAtSOTAfter, 0.01)).toEqual(true);
  }
});
