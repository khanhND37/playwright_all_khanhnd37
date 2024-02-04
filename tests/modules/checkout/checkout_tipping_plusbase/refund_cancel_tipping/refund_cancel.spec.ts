import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { DashboardAPI } from "@pages/api/dashboard";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { MailBox } from "@pages/thirdparty/mailbox";

test.describe("Kiểm tra refund, cancel với order có tip", async () => {
  let accessToken, customerInfo, paypalAccount, prodName, tippingInfo, refundInfo, shopId;
  let orderId, orderName, tippingAmount, totalOrder;
  let domain: string, domainTemplate: string;
  let profit, totalProfit, totalProfitAfter;
  let dashboardAPI: DashboardAPI, dashboardTemplate: DashboardPage, orderPageTemplate: OrdersPage;
  let homepage: SFHome, productPage: SFProduct, checkout: SFCheckout, orderPage: OrdersPage, mailBox: MailBox;
  test.beforeAll(async ({ conf, token }) => {
    domain = conf.suiteConf.shop.domain;
    const shopToken = await token.getWithCredentials({
      domain,
      username: conf.suiteConf.shop.user_name,
      password: conf.suiteConf.shop.password,
    });
    accessToken = shopToken.access_token;

    domainTemplate = conf.suiteConf.shop_template.domain;
    customerInfo = conf.suiteConf.customer_info;
    paypalAccount = conf.suiteConf.paypalAccount;
    prodName = conf.suiteConf.product.name;
    shopId = conf.suiteConf.shop_id;
    refundInfo = conf.suiteConf.refund_info;
  });

  test.beforeEach(async ({ conf, authRequest, dashboard }) => {
    dashboardAPI = new DashboardAPI(domain, authRequest);
    tippingInfo = conf.suiteConf.tipping_info;
    const resBody = await dashboardAPI.setupTipping(tippingInfo);
    expect(resBody.tip.enabled).toEqual(tippingInfo.is_enable);
    expect(resBody.tip.percentages).toEqual(tippingInfo.percentages);
    totalProfit = await (await dashboardAPI.getTotalProfitsByShopId(shopId)).total_profit;

    await homepage.gotoHomePage();
    dashboardTemplate = new DashboardPage(dashboard, domainTemplate);
    productPage = await homepage.searchThenViewProduct(prodName);
    await productPage.addProductToCart();
    checkout = await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(customerInfo);
    await checkout.continueToPaymentMethod();
    await checkout.addTip(tippingInfo);
    await checkout.completeOrderViaPayPal(paypalAccount);
    orderId = await checkout.getOrderIdBySDK();
    orderName = await checkout.getOrderName();
    tippingAmount = await checkout.getTipOnOrderSummary();
    totalOrder = await checkout.getTotalOnOrderSummary();
  });

  test("Kiểm tra refund tip trong order thành công @TC_SB_PLB_TIP_7", async ({ page }) => {
    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount);
      profit = await orderName.getProfit();
    });

    await test.step("Aprrove order vừa tạo tại shop template và kiểm tra total profit tại analytic", async () => {
      orderPageTemplate = new OrdersPage(page, domain);
      await dashboardTemplate.navigateToMenu("Order");
      await approveOrderPbase();
      totalProfitAfter = await (await dashboardAPI.getTotalProfitsByShopId(shopId)).total_profit;
      expect(totalProfitAfter).toEqual(totalProfit + profit);
      totalProfit = totalProfitAfter;
    });

    await test.step("Tại Shop template: Refund tip trong order vừa tạo và kiểm tra analytic", async () => {
      refundInfo.tip_amount = removeCurrencySymbol(tippingAmount);
      await orderPageTemplate.refundOrderPlbase(refundInfo);
      totalProfitAfter = await (await dashboardAPI.getTotalProfitsByShopId(shopId)).total_profit;
      expect(totalProfitAfter).toEqual(totalProfit - Number(refundInfo.tip_amount));
    });

    await test.step("Tại mailbox: Kiểm tra hiển thị tip tại email refund", async () => {
      mailBox = await checkout.openMailBox(customerInfo.email);
      await mailBox.openRefundNotification();
      const actualTippingAmount = mailBox.getTippping();
      expect(actualTippingAmount).toEqual(tippingAmount);
    });
  });

  test("Kiểm tra cancel order thành công @TC_SB_PLB_TIP_9", async ({ page }) => {
    await test.step("Kiểm tra tip hiển thị trong order details", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount);
      profit = await orderName.getProfit();
    });

    await test.step("Aprrove order vừa tạo tại shop template và kiểm tra total profit tại analytic", async () => {
      orderPageTemplate = new OrdersPage(page, domain);
      await dashboardTemplate.navigateToMenu("Order");
      await approveOrderPbase();
      totalProfitAfter = await (await dashboardAPI.getTotalProfitsByShopId(shopId)).total_profit;
      expect(totalProfitAfter).toEqual(totalProfit + profit);
      totalProfit = totalProfitAfter;
    });

    await test.step("Cancel toàn bộ order và kiểm tra analytic", async () => {
      await cancelOrderPlbase();
      totalProfitAfter = await (await dashboardAPI.getTotalProfitsByShopId(shopId)).total_profit;
      expect(totalProfitAfter).toEqual(totalProfit - Number(removeCurrencySymbol(totalOrder)));
    });

    await test.step("Kiểm tra hiển thị tip tại email cancel", async () => {
      mailBox = await checkout.openMailBox(customerInfo.email);
      await mailBox.openOrderCanceledNotification(orderName);
      const actualTippingAmount = mailBox.getTippping();
      expect(actualTippingAmount).toEqual(tippingAmount);
    });
  });

  // Approve order plusbase at shop template
  async function approveOrderPbase() {
    await orderPageTemplate.gotoOrderDetail(orderName);
    await orderPageTemplate.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
    const expectResult = await orderPage.getApproveStatus();
    expect(expectResult).toEqual("Approved");
  }

  // Cancel order plusbase at shop template
  async function cancelOrderPlbase() {
    await orderPageTemplate.gotoOrderDetail(orderName);
    await orderPageTemplate.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
    const expectResult = await orderPage.getApproveStatus();
    expect(expectResult).toEqual("Cancelled");
  }
});
