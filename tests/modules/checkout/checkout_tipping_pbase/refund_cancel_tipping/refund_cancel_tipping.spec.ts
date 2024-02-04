import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { DashboardAPI } from "@pages/api/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { HivePBase } from "@pages/hive/hivePBase";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Refund, cancel plusbase", async () => {
  let accessToken, customerInfo, paypalAccount, product, refundInfo, tippingInfo, domain, shopId;
  let orderId, orderName, tippingAmount, totalOrder, hiveUserName, hivePasswd, domainHive;
  let dashboardAPI: DashboardAPI;
  let profit, totalProfit, totalProfitAfter;
  let homepage: SFHome, checkout: SFCheckout, orderPage: OrdersPage, hivePage: HivePBase;

  test.beforeAll(async ({ conf, token }) => {
    domain = conf.suiteConf.shop.domain;
    const shopToken = await token.getWithCredentials({
      domain,
      username: conf.suiteConf.shop.user_name,
      password: conf.suiteConf.shop.password,
    });
    accessToken = shopToken.access_token;
    hiveUserName = conf.suiteConf.hive_user_name;
    hivePasswd = conf.suiteConf.hive_passwd;

    customerInfo = conf.suiteConf.customer_info;
    paypalAccount = conf.suiteConf.paypalAccount;
    product = conf.suiteConf.product.name;
    shopId = conf.suiteConf.shop_id;
    refundInfo = conf.suiteConf.refund_info;
  });

  test.beforeEach(async ({ conf, authRequest, page }) => {
    dashboardAPI = new DashboardAPI(domain, authRequest);
    homepage = new SFHome(page, domain);
    hivePage = new HivePBase(page, domainHive);
    checkout = new SFCheckout(page, domain);
    tippingInfo = conf.suiteConf.tipping_info;
    dashboardAPI.setupTipping(tippingInfo);

    await homepage.gotoHomePage();
    await checkout.addProductToCartThenInputShippingAddress(product, customerInfo);
    await checkout.continueToPaymentMethod();
    await checkout.addTip(tippingInfo);
    await checkout.completeOrderViaPayPal(paypalAccount);
    orderId = checkout.getOrderIdBySDK();
    orderName = checkout.getOrderName();
    totalOrder = checkout.getTotalOnOrderSummary();
    tippingAmount = checkout.getTipOnOrderSummary();
  });

  test("Kiểm tra refund tip trong order thành công @TC_PB_TIP_7", async () => {
    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details và profit hiện tại", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const actualTippingAmount = await orderPage.getTip();
      const actualPaymentStatus = await orderPage.getPaymentStatus();
      expect(actualTippingAmount).toEqual(tippingAmount);
      expect(actualPaymentStatus).toEqual("Authorized");
      profit = await orderName.getProfit();
    });

    await test.step("Aprrove order vừa tạo tại Hive printbase và kiểm tra total profit tại analytic", async () => {
      await hivePage.loginToHivePrintBase(hiveUserName, hivePasswd);
      await hivePage.goToOrderDetail(orderName);
      await hivePage.approveOrder();
      totalProfitAfter = await (await dashboardAPI.getTotalProfitsByShopId(shopId)).total_profit;
      expect(totalProfitAfter).toEqual(totalProfit + profit);
      totalProfit = totalProfitAfter;
    });

    await test.step("Tại Hive: Refund tip order vừa tạo > Kiểm tra sự thay đổi analytics", async () => {
      refundInfo.refund_amount = removeCurrencySymbol(tippingAmount);
      await hivePage.refundOrderPbase(refundInfo, orderName);
      totalProfitAfter = await (await dashboardAPI.getTotalProfitsByShopId(shopId)).total_profit;
      expect(totalProfitAfter).toEqual(totalProfit - Number(refundInfo.refund_amount));
    });

    // Không cần check email tại đây do đã được handle trong case test order
    // await test.step("Tại Mailbox của buyer: Kiểm tra tip trong email refund", async () => {
    //   mailBox = await checkout.openMailBox(customerInfo.email);
    //   await mailBox.openRefundNotification();
    //   const actualTippingAmount = mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual(tippingAmount);
    // });
  });

  test("Kiểm tra cancel order thành công @TC_PB_TIP_9", async ({}) => {
    await test.step("Tại Dashboard: Kiểm tra tip hiển thị trong order details và profit hiện tại", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const actualTippingAmount = await orderPage.getTip();
      expect(actualTippingAmount).toEqual(tippingAmount);
      profit = await orderName.getProfit();
    });

    await test.step("Aprrove order vừa tạo tại Hive printbase và kiểm tra total profit tại analytic", async () => {
      await hivePage.loginToHivePrintBase(hiveUserName, hivePasswd);
      await hivePage.goToOrderDetail(orderName);
      await hivePage.approveOrder();
      totalProfitAfter = await dashboardAPI.getTotalProfitsByShopId(shopId);
      expect(totalProfitAfter).toEqual(totalProfit + profit);
      totalProfit = totalProfitAfter;
    });

    await test.step("Cancel toàn bộ order và kiểm tra analytic", async () => {
      await hivePage.cancelOrderPbase(orderName);
      totalProfitAfter = await (await dashboardAPI.getTotalProfitsByShopId(shopId)).total_profit;
      expect(totalProfitAfter).toEqual(totalProfit - Number(removeCurrencySymbol(totalOrder)));
    });

    // Không cần check email tại đây do đã được handle trong case test order
    // await test.step("Kiểm tra hiển thị tip tại email cancel", async () => {
    //   mailBox = await checkout.openMailBox(customerInfo.email);
    //   await mailBox.openOrderCanceledNotification(orderName);
    //   const actualTippingAmount = mailBox.getTippping();
    //   expect(actualTippingAmount).toEqual(tippingAmount);
    // });
  });
});
