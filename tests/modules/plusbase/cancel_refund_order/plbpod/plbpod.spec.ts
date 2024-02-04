import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import type { CheckoutInfo, PlbRefundCase } from "@types";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { removeCurrencySymbol } from "@core/utils/string";

let domain: string;
let checkoutApi: CheckoutAPI;
let variantId: number;
let checkoutInfos: CheckoutInfo;
let dashboardTemplatePage: DashboardPage;
let orderName: string;
let plusbaseOrderAPI: PlusbaseOrderAPI;
let ordersPage: OrdersPage;
let refunds: Array<PlbRefundCase>;
let paymentFeePercent: number;
let processingFeePercent: number;

test.beforeAll(async ({ authRequest, conf, browser }) => {
  const page = await browser.newPage();
  domain = conf.suiteConf.domain;
  checkoutApi = new CheckoutAPI(domain, authRequest);
  variantId = conf.suiteConf.variant_id;
  dashboardTemplatePage = new DashboardPage(page, conf.suiteConf.plb_template.domain);
  await dashboardTemplatePage.login({
    shopId: conf.suiteConf.plb_template.shop_id,
    userId: conf.suiteConf.plb_template.user_id,
    email: conf.suiteConf.plb_template.username,
    password: conf.suiteConf.plb_template.password,
  });
  ordersPage = new OrdersPage(dashboardTemplatePage.page, conf.suiteConf.plb_template.domain, true);
  plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);
  refunds = conf.caseConf.refunds;
  paymentFeePercent = conf.suiteConf.paymentFeePercent;
  processingFeePercent = conf.suiteConf.processingFeePercent;
});

test.beforeEach(async ({ conf }) => {
  // Create order
  checkoutInfos = await checkoutApi.createAnOrderWithCreditCard({
    productsCheckout: [
      {
        id: 0,
        variant_id: variantId,
        quantity: 1,
      },
    ],
    cardInfo: conf.suiteConf.card_info,
  });
  expect(checkoutInfos?.order?.name).not.toBeUndefined();
  orderName = checkoutInfos?.order?.name;

  await ordersPage.gotoOrderPage();
  await ordersPage.gotoOrderDetail(orderName);
  await ordersPage.waitForProfitCalculated();
  await ordersPage.clickShowCalculation();
});

test.describe(`Cancel refund of PlusBase order plbpod @SB_PLB_PODPL_PODPO`, async () => {
  test("Verify approved order có line POD đã được approved design và đã được approved order trong hive pbase @SB_PLB_PODPL_PODPO_25", async ({
    conf,
  }) => {
    await test.step("Orders > Search order > Vào order detail > Verify payment status và fulfillment status", async () => {
      // Verify payment status
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual(conf.caseConf.payment_status);

      // Verify fulfillment status
      const fulfillmentStatus = await ordersPage.getFulfillmentStatusOrder();
      expect(fulfillmentStatus).toEqual(conf.caseConf.fulfillment_status);
    });

    await test.step("More actions > Approved order > Confirm > Verify payment status và fulfillment status", async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);

      // Verify payment status
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual(conf.caseConf.approved_payment_status);

      // Verify fulfillment status
      const fulfillmentStatus = await ordersPage.getFulfillmentStatusOrder();
      expect(fulfillmentStatus).toEqual(conf.caseConf.fulfillment_status);
    });

    await test.step("Verify order summary, profit của order", async () => {
      await ordersPage.clickShowCalculation();
      await ordersPage.verifyOrderInfo(checkoutInfos.totals, paymentFeePercent, processingFeePercent, {
        profit: true,
        revenue: true,
        handlingFee: true,
        paidByCustomer: true,
      });
    });
  });

  test("Verify cancel order PLB có line POD chỉ cancel cho seller @SB_PLB_PODPL_PODPO_29", async ({ authRequest }) => {
    await test.step("Vào dashboard shop template PlusBase > Orders > All orders > Search orders  > vào order detail > Verify thông tin order", async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      await ordersPage.clickShowCalculation();
      await ordersPage.verifyOrderInfo(checkoutInfos.totals, paymentFeePercent, processingFeePercent, {
        profit: true,
        revenue: true,
        handlingFee: true,
        paidByCustomer: true,
        paymentFee: true,
        processingFee: true,
      });
    });

    await test.step('Click button "More actions" > chọn "Cancel order" > cancel cho seller: nhập giá trị các field đúng bằng {amount} available > click "Cancel" > Verify thông tin profit của order', async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);
      const { profitAfterRefund, input } = await ordersPage.inputRefundItems(refunds, plusbaseOrderAPI, {
        orderName,
      });
      await ordersPage.clickButton("Cancel");
      await ordersPage.page.waitForSelector("#order-title-bar");

      // Wait for refund consumer is completed
      await ordersPage.page.waitForTimeout(5000);
      await ordersPage.page.reload();

      // update orderTotals only refund for seller
      const refundSeller =
        input.refund_seller_payment +
        input.refund_seller_shipping +
        input.refund_seller_tax +
        input.refund_seller_base_cost +
        input.refund_seller_processing;

      await ordersPage.clickShowCalculation();
      // Verify profit
      expect((ordersPage.profit + refundSeller).toFixed(2)).toEqual(profitAfterRefund.toFixed(2));
      const totals = checkoutInfos.totals;
      await ordersPage.verifyOrderInfo(totals, paymentFeePercent, processingFeePercent, {
        revenue: true,
        paidByCustomer: true,
      });
      // Verify refunded
      expect(0).toEqual(Number(removeCurrencySymbol(await ordersPage.getRefundedAmount())));

      expect(Number(removeCurrencySymbol(await ordersPage.getShippingCost()))).toEqual(
        checkoutInfos.totals.total_shipping,
      );
      await ordersPage.clickToShowHandlingFee();
      // Verify payment fee
      const paymentFeeActual = Number(removeCurrencySymbol(await ordersPage.getPaymentFee()));
      expect(paymentFeeActual).toEqual(0);

      // Verify processing fee
      const processingFeeActual = Number(removeCurrencySymbol(await ordersPage.getProcessingFee()));
      expect(processingFeeActual).toEqual(0);
    });
  });
});
