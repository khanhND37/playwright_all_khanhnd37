import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFCheckout } from "@sf_pages/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { HivePBase } from "@pages/hive/hivePBase";
import { CheckoutAPI } from "@pages/api/checkout";
import { CheckoutInfo, Product } from "@types";

let shopDomain: string;
let dashboardPage: DashboardPage;
let ordersPage: OrdersPage;
let orderId: number;
let orderName: string;
let hivePbase: HivePBase;
let checkout: SFCheckout;
let checkoutApi: CheckoutAPI;
let checkoutInfo: CheckoutInfo;
let productsCheckout: Array<Product>;
let purchaseStatus: string;

test.beforeEach(async ({ page, conf, authRequest, dashboard }) => {
  test.setTimeout(conf.suiteConf.time_out);
  shopDomain = conf.suiteConf.domain;
  productsCheckout = conf.caseConf.products_checkout;
  checkout = new SFCheckout(page, conf.suiteConf.domain);
  checkoutApi = new CheckoutAPI(shopDomain, authRequest, page);
  checkoutInfo = await checkoutApi.createAnOrderWithCreditCard({
    productsCheckout: productsCheckout,
  });
  orderId = checkoutInfo.order.id;
  orderName = checkoutInfo.order.name;
  dashboardPage = new DashboardPage(dashboard, shopDomain);
  ordersPage = new OrdersPage(dashboardPage.page, shopDomain);
  await ordersPage.goToOrderByOrderId(orderId, "pbase");
  await ordersPage.waitForProfitCalculated();
});

test.describe(`Hiển thị lý do refund/charge trên PB order timeline`, () => {
  test(`@SB_PRB_RCP_08 Verify timeline order Printbase sau khi cancel order chưa được approved`, async ({
    conf,
    browser,
  }) => {
    await test.step(`Login vào hive-pbase > Customer support > PBase Order > View detail order vừa checkout > Click Cancel > Chọn reason for cancel > Click cancel`, async () => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      hivePbase = new HivePBase(page, conf.suiteConf.domain_hive);
      await hivePbase.loginToHivePrintBase(conf.suiteConf.hive_username, conf.suiteConf.hive_password);
      await hivePbase.goToOrderDetail(orderId);
      await hivePbase.clickCalculateInOrder();
      await hivePbase.cancelOrderPbaseWithReason(
        conf.caseConf.product_field_cancel,
        orderId,
        conf.caseConf.product_cancel,
      );
      expect(await hivePbase.isElementExisted(hivePbase.xpathCanceledAlert(orderName))).toBe(true);
      await hivePbase.page.close();
    });

    await test.step(`Back lại trang order detail`, async () => {
      await expect(async () => {
        await ordersPage.page.reload({ waitUntil: "networkidle" });
        expect(await ordersPage.isTextVisible(conf.caseConf.timeline_cancel)).toBe(true);
      }).toPass({ timeout: 40_000 });
    });
  });

  test(`@SB_PRB_RCP_07 Verify  timeline order Printbase hiển thị refund reason sau khi refund order trên hive PB`, async ({
    conf,
    browser,
  }) => {
    await test.step(`Login vào hive-pbase > Customer support > PBase Order > Search order vừa checkout  > Approved order`, async () => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      hivePbase = new HivePBase(page, conf.suiteConf.domain_hive);
      await hivePbase.loginToHivePrintBase(conf.suiteConf.hive_username, conf.suiteConf.hive_password);
      await hivePbase.goToOrderDetail(orderId);
      await hivePbase.clickCalculateInOrder();
      do {
        purchaseStatus = (await hivePbase.page.textContent(hivePbase.xpathPurchaseStatus)).trim();
        await hivePbase.page.reload();
        await hivePbase.page.waitForLoadState("networkidle");
      } while (purchaseStatus != "Purchase status: unpaid");
      await hivePbase.approveOrderInHive();
      expect(await hivePbase.isElementExisted(hivePbase.xpathSuccessMessage)).toBe(true);
    });

    await test.step(`Click Refund > Chọn reason for refund > Click refund`, async () => {
      await hivePbase.refundOrderPbaseWithReason(
        conf.caseConf.product_field_refund,
        orderId,
        conf.caseConf.product_refund,
      );
      expect(await hivePbase.isElementExisted(hivePbase.xpathRefundedAlert)).toBe(true);
      await hivePbase.page.close();
    });

    await test.step(`Back lại trang order detail`, async () => {
      await expect(async () => {
        await ordersPage.page.reload({ waitUntil: "networkidle" });
        expect(await ordersPage.isTextVisible(conf.caseConf.timeline_refund)).toBe(true);
      }).toPass({ timeout: 40_000 });
    });
  });

  test(`@SB_PRB_RCP_05 Verify email được gửi tới buyer sau khi cancel/refund`, async ({ conf, browser }) => {
    await test.step(`Login vào hive-pbase > Customer support > PBase Order > Search order vừa checkout  > Approved order`, async () => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      hivePbase = new HivePBase(page, conf.suiteConf.domain_hive);
      await hivePbase.loginToHivePrintBase(conf.suiteConf.hive_username, conf.suiteConf.hive_password);
      await hivePbase.goToOrderDetail(orderId);
      await hivePbase.clickCalculateInOrder();
      do {
        purchaseStatus = (await hivePbase.page.textContent(hivePbase.xpathPurchaseStatus)).trim();
        await hivePbase.page.reload();
        await hivePbase.page.waitForLoadState("networkidle");
      } while (purchaseStatus != "Purchase status: unpaid");
      await hivePbase.approveOrderInHive();
      expect(await hivePbase.isElementExisted(hivePbase.xpathSuccessMessage)).toBe(true);
    });

    await test.step(`Click Cancel> Chọn reason for cancel > Chọn send notification to buyer > Click Cancel`, async () => {
      await hivePbase.cancelOrderPbaseWithReason(
        conf.caseConf.product_field_cancel,
        orderId,
        conf.caseConf.product_cancel,
      );
      expect(await hivePbase.isElementExisted(hivePbase.xpathCanceledAlert(orderName))).toBe(true);
      await hivePbase.page.close();
    });

    await test.step(`Back lại trang order detail`, async () => {
      await expect(async () => {
        await ordersPage.page.reload({ waitUntil: "networkidle" });
        expect(await ordersPage.isTextVisible(conf.caseConf.timeline_cancel)).toBe(true);
      }).toPass({ timeout: 40_000 });
    });

    await test.step(`Mở email theo order checkout`, async () => {
      const mailBox = await checkout.openMailBox(checkoutInfo.info.email);
      await expect(async () => {
        await mailBox.openOrderCanceledNotification(orderName);
      }).toPass();
      let fullContentCancel = await mailBox.getContentEmailCancelRefund();
      fullContentCancel = fullContentCancel.replaceAll("\n", "").replaceAll("\t", "");
      const thankyouContent = `Thank you for choosing to shop at ${shopDomain}. I'm writing to you regarding the order ${orderName} you have with us`;
      expect(fullContentCancel).toContain(thankyouContent);
      const orderConfirmation = `Order Confirmation: https://${shopDomain}/orders/${checkoutInfo.order.token}`;
      expect(fullContentCancel).toContain(orderConfirmation);
      expect(fullContentCancel).toContain(conf.suiteConf.content_email);
    });
  });
});
