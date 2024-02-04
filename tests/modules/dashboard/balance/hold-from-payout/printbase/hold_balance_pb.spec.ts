import { expect, test } from "@core/fixtures";
import { HivePBase } from "@pages/hive/hivePBase";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import type { DataHoldPayOut, CheckoutInfo, Product } from "@types";

let hiveUserName: string;
let hivePasswd: string;
let domain: string;
let domainHive: string;
let orderId: number;
let orderName: string;

let hivePage: HivePBase;
let checkoutAPI: CheckoutAPI;
let checkoutInfo: CheckoutInfo;
let productsCheckout: Array<Product>;
let dataHoldPayout: DataHoldPayOut;
let dashboardAPI: DashboardAPI;

test.describe("Auto release hold amount", async () => {
  test.beforeEach(async ({ conf, page, authRequest }) => {
    domain = conf.suiteConf.domain;
    domainHive = conf.suiteConf.hive_info.domain;
    hiveUserName = conf.suiteConf.hive_info.username;
    hivePasswd = conf.suiteConf.hive_info.password;
    dashboardAPI = new DashboardAPI(domain, authRequest);
    productsCheckout = conf.suiteConf.products_checkout;
    dataHoldPayout = conf.caseConf.data_hold_payout;

    hivePage = new HivePBase(page, domainHive);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
  });

  test(`@SB_BAL_HPP_313 [PLB+PB] Verify button hold payout của order khi order trước đó đã bị hold payout và chưa được release hold payout`, async ({
    conf,
  }) => {
    await test.step(`Vào shop PLB/PB > Checkout order`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        customerInfo: {
          shippingAddress: conf.suiteConf.customer_info,
        },
      });
      await expect(async () => {
        const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Printbase");
        expect(orderInfo.pbase_order.profit).toBeGreaterThan(0);
      }).toPass();
      expect(checkoutInfo).not.toBeUndefined();
      orderId = checkoutInfo.order.id;
      orderName = checkoutInfo.order.name;
    });

    await test.step(`Vào shop template PLB/Hive PB > Search order vừa checkout > Hold from payout order > 
    Verify button Hold from payout trong order detail tại shop template PLB/Hive PB`, async () => {
      await hivePage.loginToHivePrintBase(hiveUserName, hivePasswd);
      await hivePage.goToOrderDetail(orderId);
      await hivePage.clickElementWithLabel("a", "Hold from Payout");
      await hivePage.createHoldFromPayout(dataHoldPayout);
      const dataHoldInOrderDetail = await hivePage.getDataHoldFromPayout();
      expect(dataHoldInOrderDetail.hold_amount.amount).toEqual(dataHoldPayout.hold_amount.amount);
      expect(dataHoldInOrderDetail.reason).toEqual(dataHoldPayout.reason);
      expect(await hivePage.isTextVisible("Hold from payout", 2)).toBeFalsy();
    });
  });

  test(`@SB_BAL_HPP_309 [PLB+PB] Verify button hold payout của order khi order bị cancel`, async ({ conf }) => {
    await test.step(`Vào shop PLB/PB > Checkout order`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        customerInfo: {
          shippingAddress: conf.suiteConf.customer_info,
        },
      });
      await expect(async () => {
        const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Printbase");
        expect(orderInfo.pbase_order.profit).toBeGreaterThan(0);
      }).toPass();
      expect(checkoutInfo).not.toBeUndefined();
      orderId = checkoutInfo.order.id;
      orderName = checkoutInfo.order.name;
    });

    await test.step(`Vào shop template PLB/Hive PB > Search order vừa checkout > Cancel order > Verify button Hold from payout trong order detail tại shop template PLB/Hive PB`, async () => {
      await hivePage.loginToHivePrintBase(hiveUserName, hivePasswd);
      await hivePage.goToOrderDetail(orderId);
      await expect(async () => {
        await hivePage.page.reload();
        expect(await hivePage.isTextVisible(`ReCalculate`)).toBeTruthy();
      }).toPass();
      await hivePage.clickElementWithLabel("button", "Approve");
      await hivePage.clickElementWithLabel("a", "Cancel");
      await hivePage.clickElementWithLabel("button", "cancel");
      expect(await hivePage.page.locator(hivePage.xpathCanceledAlert(orderName)).isVisible()).toBeTruthy();
      await hivePage.goToOrderDetail(orderId);
      expect(await hivePage.isTextVisible("Hold from payout", 2)).toBeFalsy();
    });
  });
});
