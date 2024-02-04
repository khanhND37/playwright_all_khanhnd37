import { test, expect } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { OrdersPage } from "@pages/dashboard/orders";
import { HivePBase } from "@pages/hive/hivePBase";
import { SFCheckout } from "@pages/storefront/checkout";
import type { OrderAfterCheckoutInfo, OrderSummary, Product, ShippingAddress } from "@types";
import { PbCheckoutScheduleData } from "../pb-checkout";
import { SFHome } from "@pages/storefront/homepage";

let checkoutPage: SFCheckout;
let orderPage: OrdersPage;
let homePage: SFHome;
let domain: string;
let shippingAddress: ShippingAddress;
let productCheckout: Array<Product>;
let orderSummaryInfo: OrderAfterCheckoutInfo;
let hivePage: HivePBase;
let hivePbDomain: string, hiveUsername: string, hivePassword: string;
let PPCPrice: string;
let orderSummaryBeforeCompleteOrder: OrderSummary;
let totalOrderSF: string;
let paymentMethod: string;
let scheduleData: PbCheckoutScheduleData;

test.describe("Verify check out via PrintBase Paypal", () => {
  test.beforeEach(async ({ page, conf, dashboard, scheduler }) => {
    domain = conf.suiteConf.domain;
    hivePbDomain = conf.suiteConf.hive_info.domain;
    hiveUsername = conf.suiteConf.hive_info.username;
    hivePassword = conf.suiteConf.hive_info.password;

    homePage = new SFHome(page, domain);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    hivePage = new HivePBase(page, hivePbDomain);
    productCheckout = conf.caseConf.products_checkout;
    shippingAddress = conf.suiteConf.shipping_address;
    paymentMethod = conf.suiteConf.payment_method;

    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as PbCheckoutScheduleData;
    } else {
      scheduleData = {
        isInSchedule: false,
        orderAfterCheckoutInfo: null,
      };
    }
  });
  test(" @SB_CHE_CHEPB_10 checkout via Printbase PayPal successfully without adding item from post-purchase to order", async ({
    scheduler,
  }) => {
    await test.step(`Tại SF, buyer thực hiện add cart và Place order thành công với Products checkout.`, async () => {
      if (scheduleData.isInSchedule) {
        return;
      }
      await checkoutPage.addToCartThenNavigateToCheckout(productCheckout);
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      await checkoutPage.completeOrderWithMethod(paymentMethod);
      //verify show popup PPC
      const isShowPPC = await checkoutPage.isPostPurchaseDisplayed();
      expect(isShowPPC).toBeTruthy();
    });

    await test.step(`Không add PPC`, async () => {
      if (scheduleData.isInSchedule) {
        return;
      }
      await checkoutPage.closePostPurchase();
      const orderSummaryBeforeCompleteOrder: OrderSummary = await checkoutPage.getOrderSummaryInfo();
      //verify thanks page
      const thanksPage = await checkoutPage.isThankyouPage();
      expect(thanksPage).toBeTruthy();
      //verify total price
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(orderSummaryInfo.totalSF).toEqual(orderSummaryBeforeCompleteOrder.totalPrice);
      //verify order list
      const isProductOnOrderSummary = await checkoutPage.isProductsOnOrderSummary(productCheckout);
      expect(isProductOnOrderSummary).toBeTruthy();
    });

    await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
      // use schedule in case order profit not response in 5'th time loaded
      if (scheduleData.isInSchedule) {
        orderSummaryInfo = scheduleData.orderAfterCheckoutInfo;
      }
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId, "pbase");
      //verify subTotal
      const subTotal = await orderPage.getSubtotalOrder();
      expect(Number(removeCurrencySymbol(subTotal))).toEqual(orderSummaryInfo.subTotal);
      //verify total
      const total = await orderPage.getTotalOrder();
      expect(Number(removeCurrencySymbol(total))).toEqual(orderSummaryInfo.totalSF);
      //verify profit
      const profit = await orderPage.getOrderProfit(5);
      if (profit === 0) {
        scheduleData.isInSchedule = true;
        scheduleData.orderAfterCheckoutInfo = orderSummaryInfo;
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 5 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      await scheduler.clear();
      const expOrderFeesAndProfit = await orderPage.calculateProfitAndFeesOrderPbase();
      expect(profit).toEqual(Number(expOrderFeesAndProfit.profit.toFixed(2)));
      //verify payment status
      const paymentStatus = await orderPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Authorized");
    });
  });

  test(`@SB_CHE_CHEPB_9 Check checkout via Printbase PayPal successfully with adding item from post-purchase to order`, async ({
    conf,
  }) => {
    const productPPC = conf.caseConf.product_ppc.name;

    await test.step(`Select currency`, async () => {
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2("United States");
    });

    await test.step(`Tại SF, buyer thực hiện add cart và Place order thành công với Products checkout.`, async () => {
      await checkoutPage.addToCartThenNavigateToCheckout(productCheckout);
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      orderSummaryBeforeCompleteOrder = await checkoutPage.getOrderSummaryInfo();
      await checkoutPage.completeOrderWithMethod(paymentMethod);
      //verify show popup PPC
      const isShowPPC = await checkoutPage.isPostPurchaseDisplayed();
      expect(isShowPPC).toBeTruthy();
    });

    await test.step(`Add Click Add Product PPC`, async () => {
      PPCPrice = await checkoutPage.addProductPostPurchase(productPPC);
      await expect(checkoutPage.submitPaypalBtnLoc).toBeVisible();
    });

    await test.step(`Click "Pay now"`, async () => {
      await checkoutPage.completePaymentForPostPurchaseItem("PayPal");
      //verify thank you page
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });
      //verify order amount
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      const expSubtotal = (orderSummaryBeforeCompleteOrder.subTotal + parseFloat(PPCPrice)).toFixed(2);
      expect(orderSummaryInfo.subTotal).toEqual(Number(expSubtotal));
      //verify productPPC in order summary
      await expect(checkoutPage.getLocatorProdNameInOrderSummary(productPPC)).toBeVisible();
    });

    await test.step(`- Admin approved order trên hive: Tại link admin, thực hiện approved order thành công.- Merchant kiểm tra order details trong dashboard.`, async () => {
      await hivePage.loginToHivePrintBase(hiveUsername, hivePassword);
      await hivePage.goToOrderDetail(orderSummaryInfo.orderId, "pbase-order");
      await hivePage.approveOrder();
      //verify order detail on dashboard
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId, "pbase");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(Number(removeCurrencySymbol(paidByCustomer))).toEqual(orderSummaryInfo.totalSF);
      const paymentStatus = await orderPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Paid");
    });
  });

  test(`@SB_CHE_CHEPB_8 Check checkout via Printbase PayPal successfully in 1 pages checkout`, async ({
    scheduler,
  }) => {
    await test.step(`Tại SF, buyer thực hiện add cart và Place order thành công với Products checkout.`, async () => {
      await checkoutPage.addToCartThenNavigateToCheckout(productCheckout);
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      orderSummaryBeforeCompleteOrder = await checkoutPage.getOrderSummaryInfo();
      await checkoutPage.completeOrderWithMethod(paymentMethod);
      //verify popup Paypal
      const isShowPaypalBtn = checkoutPage.submitPaypalBtnLoc;
      expect(isShowPaypalBtn).toBeTruthy();
      //verify thank you page
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });
      //verify order amount
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(orderSummaryInfo.subTotal).toEqual(orderSummaryBeforeCompleteOrder.subTotal);
      expect(orderSummaryInfo.totalSF).toEqual(orderSummaryBeforeCompleteOrder.totalPrice);
      totalOrderSF = await checkoutPage.getTotalOnOrderSummary();
    });

    await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
      // use schedule in case order profit not response in 5'th time loaded
      if (scheduleData.isInSchedule) {
        orderSummaryInfo = scheduleData.orderAfterCheckoutInfo;
      }
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId, "pbase");
      //verify subTotal
      const subTotal = await orderPage.getSubtotalOrder();
      expect(Number(removeCurrencySymbol(subTotal))).toEqual(orderSummaryInfo.subTotal);
      //verify total
      const total = await orderPage.getTotalOrder();
      expect(Number(removeCurrencySymbol(total))).toEqual(orderSummaryInfo.totalSF);
      //verify profit
      const profit = await orderPage.getOrderProfit(5);
      if (profit === 0) {
        scheduleData.isInSchedule = true;
        scheduleData.orderAfterCheckoutInfo = orderSummaryInfo;
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 5 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      await scheduler.clear();
      const expOrderFeesAndProfit = await orderPage.calculateProfitAndFeesOrderPbase();
      expect(profit).toEqual(Number(expOrderFeesAndProfit.profit.toFixed(2)));
      //verify payment status
      const paymentStatus = await orderPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Authorized");
    });

    await test.step(`- Admin approved order trên hive: Tại link admin, thực hiện approved order thành công.- Merchant kiểm tra order details trong dashboard.`, async () => {
      if (scheduleData.isInSchedule) {
        return;
      }
      await hivePage.loginToHivePrintBase(hiveUsername, hivePassword);
      await hivePage.goToOrderDetail(orderSummaryInfo.orderId, "pbase-order");
      await hivePage.approveOrder();
      //verify order detail on dashboard
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId, "pbase");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(Number(removeCurrencySymbol(paidByCustomer))).toEqual(orderSummaryInfo.totalSF);
      const paymentStatus = await orderPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Paid");
      //verify order timeline transID
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW("PayPal");
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
      const orderTimelinePaymentProcessed = orderPage.buildOrderTimelineMsgByGW(totalOrderSF, "PayPal");
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
    });
  });
});
