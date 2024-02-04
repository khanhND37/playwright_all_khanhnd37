import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage, Action } from "@pages/dashboard/orders";
import type { Product, DataHoldFromPayout, CheckoutInfo, Order, DataBalance } from "@types";
import { CheckoutAPI } from "@pages/api/checkout";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { OrderAPI } from "@pages/api/order";
import { APIRequestContext } from "@playwright/test";
import { DashboardAPI } from "@pages/api/dashboard";
import { formatDate } from "@core/utils/datetime";
import { isEqual } from "@core/utils/checkout";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { HiveBalance } from "@pages/hive/hive_balance";
import { BalancePage } from "@pages/dashboard/balance";
import { removeCurrencySymbol } from "@core/utils/string";

let orderTemplatePage: OrdersPage;
let productsCheckout: Array<Product>;
let plbTemplateDashboardPage: DashboardPage;
let checkoutAPI: CheckoutAPI;
let plusbaseOrderAPI: PlusbaseOrderAPI;
let dataHoldFromPayout: DataHoldFromPayout;
let orderPage: OrdersPage;
let orderAPI: OrderAPI;
let authRequestTpl: APIRequestContext;
let dashboardTplAPI: DashboardAPI;
let checkoutInfo: CheckoutInfo;

let plbTemplateShopDomain: string;
let plbShopDomain: string;
let orderId: number;
let orderDate: string;
let valueHoldAmount: number;
let dashboardAPI: DashboardAPI;
let orderInfo: Order;
let totalProfit: number;
const ordersId = [];
const orderList = [];
let dataBalance: DataBalance;
let balanceAPI: BalanceUserAPI;
let orderApi: OrderAPI;

test.describe("Auto release hold amount", async () => {
  test.beforeEach(async ({ conf, page, authRequest, multipleStore, dashboard }) => {
    authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );

    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    plbShopDomain = conf.suiteConf.domain;
    productsCheckout = conf.suiteConf.products_checkout;
    dataHoldFromPayout = conf.caseConf.data_hold_from_payout;
    valueHoldAmount = conf.caseConf.data_hold_from_payout?.hold_amount.value;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template["username"],
      conf.suiteConf.plb_template["password"],
      plbTemplateShopDomain,
      conf.suiteConf.plb_template["shop_id"],
      conf.suiteConf.plb_template["user_id"],
    );

    plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
    orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
    checkoutAPI = new CheckoutAPI(plbShopDomain, authRequest, page);
    plusbaseOrderAPI = new PlusbaseOrderAPI(plbTemplateShopDomain, authRequestTpl);
    orderPage = new OrdersPage(dashboard, plbShopDomain);
    orderAPI = new OrderAPI(plbShopDomain, authRequest);
    dashboardTplAPI = new DashboardAPI(plbTemplateShopDomain, authRequestTpl);
    dashboardAPI = new DashboardAPI(plbShopDomain, authRequest);
    balanceAPI = new BalanceUserAPI(plbShopDomain, authRequest);
    orderApi = new OrderAPI(plbShopDomain, authRequest);

    dataBalance = await balanceAPI.getDataBalance();

    for (let i = 0; i < conf.caseConf.total_order; i++) {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
      });

      await expect(async () => {
        orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Plusbase");
        expect(orderInfo.profit).toBeGreaterThan(0);
      }).toPass();
      totalProfit = orderInfo.profit + totalProfit;
      orderList.push(checkoutInfo);
      ordersId[i] = checkoutInfo.order.id;
    }
  });

  test(`@SB_BAL_HPP_313 [PLB+PB] Verify button hold payout của order khi order trước đó đã bị hold payout và chưa được release hold payout`, async ({}) => {
    await test.step(`Vào shop PLB/PB > Checkout order`, async () => {
      orderId = checkoutInfo.order.id;
      orderDate = checkoutInfo.order.created_at.split("T")[0];

      // Wait order calculate profit and button View invoice enable
      await orderPage.goToOrderByOrderId(orderId);
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await expect(async () => {
        await orderPage.page.reload();
        expect(await orderPage.isTextVisible("View invoice")).toBeTruthy();
      }).toPass();
    });

    await test.step(`Vào shop template PLB/Hive PB > Search order vừa checkout > Hold from payout order`, async () => {
      dataHoldFromPayout.order_ids[0] = orderId;
      dataHoldFromPayout.release_setting.abs_time = orderDate;
      await plusbaseOrderAPI.holdFromPayoutPlb(dataHoldFromPayout);
      const orderInfo = await dashboardTplAPI.getOrderInfoByApi(orderId, "Shopbase");
      const dataHoldAmount = orderInfo.order.order_hold_amount[0].amount;
      expect(dataHoldAmount).toEqual(valueHoldAmount);
    });

    await test.step(`Verify button Hold from payout trong order detail tại shop template PLB/Hive PB`, async () => {
      await plbTemplateDashboardPage.goToOrderDetails(orderId, "shopbase");
      await plbTemplateDashboardPage.clickOnBtnWithLabel("More actions");
      expect(await plbTemplateDashboardPage.isTextVisible("Hold from payout")).toBeFalsy();
    });
  });

  test(`@SB_BAL_HPP_309 [PLB+PB] Verify button hold payout của order khi order bị cancel`, async ({}) => {
    await test.step(`Vào shop PLB/PB > Checkout order`, async () => {
      orderId = checkoutInfo.order.id;

      // Wait order calculate profit and button View invoice enable
      await orderPage.goToOrderByOrderId(orderId);
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await expect(async () => {
        await orderPage.page.reload();
        expect(await orderPage.isTextVisible("View invoice")).toBeTruthy();
      }).toPass();
    });

    await test.step(`Vào shop template PLB/Hive PB > Search order vừa checkout > Cancel order 
    > Verify button Hold from payout trong order detail tại shop template PLB/Hive PB`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await orderTemplatePage.clickOnBtnWithLabel("Cancel");
      await orderTemplatePage.clickOnBtnWithLabel("More actions");
      expect(await orderTemplatePage.isTextVisible("Hold from payout")).toBeFalsy();
    });
  });

  test(`@SB_BAL_HPP_311 [PLB+PB] Verify button hold payout của order khi order đã được refund`, async ({ conf }) => {
    await test.step(`Vào shop PLB/PB > Checkout order`, async () => {
      orderId = checkoutInfo.order.id;

      // Wait order calculate profit and button View invoice enable
      await orderPage.goToOrderByOrderId(orderId);
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await expect(async () => {
        await orderPage.page.reload();
        expect(await orderPage.isTextVisible("View invoice")).toBeTruthy();
      }).toPass();
    });

    await test.step(`Vào shop template PLB/Hive PB > Search order vừa checkout > Refund order 
    > Verify button Hold from payout trong order detail tại shop template PLB/Hive PB`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const actualResult = await orderTemplatePage.getApproveStatus();
      expect(actualResult).toEqual("Approved");
      await orderTemplatePage.clickOnBtnWithLabel("Refund order");
      await orderTemplatePage.inputQuantityRefund(1, conf.caseConf.quantity_refund);
      await orderPage.page.waitForLoadState("networkidle");
      await orderTemplatePage.clickOnBtnWithLabel("Refund");
      await orderPage.page.waitForLoadState("networkidle");
      await orderTemplatePage.clickOnBtnWithLabel("More actions");
      expect(await orderTemplatePage.isTextVisible("Hold from payout")).toBeFalsy();
    });
  });

  test(`@SB_BAL_HPP_284 [PLB - 1 order] Verify order, transaction, balance khi user hold/release amount 1 order theo Absolute amount và Available date = Auto release on this date, trường hợp hold amount < order profit`, async ({
    conf,
    authRequest,
    hiveSBase,
  }) => {
    let dataBalanceBeforeHold: DataBalance;
    let dataBalanceAfterHold: DataBalance;
    let dataBalanceAfterRelease: DataBalance;
    const balanceAPI = new BalanceUserAPI(plbShopDomain, authRequest);
    const orderApi = new OrderAPI(plbShopDomain, authRequest);
    const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    const today = new Date();
    const expectDate = formatDate(today, "YYYY-MM-DD");

    const desireDay = new Date(today);
    desireDay.setDate(today.getDate() + conf.caseConf.extend_date);
    const datePayout = formatDate(desireDay, "YYYY-MM-DD");

    await test.step(`Vào Orders > Tại tab All > Search order vừa checkout > Đi đến order detail > Click More actions > Click Hold from payout`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(checkoutInfo.order.id);
      dataBalanceBeforeHold = await balanceAPI.getDataBalance();
      dataHoldFromPayout.order_ids[0] = checkoutInfo.order.id;
      dataHoldFromPayout.release_setting.abs_time = datePayout;
      await expect(async () => {
        const res = await plusbaseOrderAPI.holdFromPayoutPlb(dataHoldFromPayout);
        expect(res.complete_order_ids[0]).toEqual(checkoutInfo.order.id);
      }).toPass();
    });

    await test.step(`Vào Orders > Tại tab All > Search order > Verify order tại màn order list`, async () => {
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      const actHoldAmount = await orderTemplatePage.getTextContent(
        orderTemplatePage.xpathHoldAmountInOrderList(checkoutInfo.order.name),
      );
      expect(
        isEqual(Number(removeCurrencySymbol(actHoldAmount)), Number(dataHoldFromPayout.hold_amount.value), 0.1),
      ).toBeTruthy();
    });

    await test.step(`Click View invoice trong order detail > Verify invoice của order`, async () => {
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);

      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        dataHoldFromPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, dataHoldFromPayout.hold_amount.value, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
      if (dataHoldFromPayout.release_setting.release_type === `None`) {
        expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();
      } else {
        expect(dataHoldFromPayout.release_setting.abs_time).toEqual(
          formatDate(Number(dataHoldAmountAndDateOfTran.payoutDateTypeIn), "YYYY-MM-DD"),
        );
      }
    });

    await test.step(`Vào Balance > Verify balance`, async () => {
      dataBalanceAfterHold = await balanceAPI.getDataBalance();
      expect(dataBalanceAfterHold.available_soon).toEqual(dataBalanceBeforeHold.available_soon);
    });

    await test.step(`Click View transaction`, async () => {
      // Update the available to payout date for the order to the current date by calling the API.
      await orderApi.releaseAvailableToPayoutProfit(checkoutInfo.order.id);

      // Tool convert holding amount dùng để action cho balance user update ngay để check automation
      await hiveBalance.convertHoldingAmount("plusbase", conf.suiteConf.user_id, conf.suiteConf.username);
      await expect(async () => {
        dataBalanceAfterRelease = await balanceAPI.getDataBalance();
        expect(
          isEqual(
            dataBalanceAfterHold.available_soon - dataBalanceAfterRelease.available_soon,
            orderInfo.profit - dataHoldFromPayout.hold_amount.value,
            0.1,
          ),
        ).toBeTruthy();
      }).toPass();
    });

    await test.step(`Verify release hold amount của order`, async () => {
      await plusbaseOrderAPI.releaseHoldFromPayout([checkoutInfo.order.id]);
      await expect(async () => {
        const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
        const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);

        for (const transaction of listTransaction) {
          expect(formatDate(Number(transaction.available_at), "YYYY-MM-DD")).toEqual(expectDate);
        }
      }).toPass();
    });
  });

  test(`@SB_BAL_HPP_326 [PLB - 1 order] Verify order, transaction, balance khi user hold/release amount 1 order theo Absolute amount và Available date = None, trường hợp hold amount > order profit, profit vẫn đang ở Available soon`, async ({
    authRequest,
    conf,
    hiveSBase,
  }) => {
    let dataBalanceBeforeHold: DataBalance;
    let dataBalanceAfterHold: DataBalance;
    let dataBalanceAfterRelease: DataBalance;
    const dashboardAPI = new DashboardAPI(plbShopDomain, authRequest);
    const balanceAPI = new BalanceUserAPI(plbShopDomain, authRequest);
    const orderApi = new OrderAPI(plbShopDomain, authRequest);
    const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    const today = new Date();
    const expectDate = formatDate(today, "YYYY-MM-DD");

    await test.step(`Vào Orders > Tại tab All > Search order vừa checkout > Đi đến order detail > Click More actions > Click Hold from payout`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(checkoutInfo.order.id);

      await expect(async () => {
        dataBalanceBeforeHold = await balanceAPI.getDataBalance();
        expect(
          isEqual(dataBalance.available_soon + orderInfo.profit, dataBalanceBeforeHold.available_soon, 0.1),
        ).toBeTruthy();
      }).toPass();
      dataHoldFromPayout.order_ids[0] = checkoutInfo.order.id;
      await expect(async () => {
        const res = await plusbaseOrderAPI.holdFromPayoutPlb(dataHoldFromPayout);
        expect(res.complete_order_ids[0]).toEqual(checkoutInfo.order.id);
      }).toPass();
    });

    await test.step(`Vào Orders > Tại tab All > Search order > Verify order tại màn order list`, async () => {
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await orderTemplatePage.searchOrder(checkoutInfo.order.name);
      const listHoldAmount = await orderTemplatePage.getListHoldAmount();
      expect(listHoldAmount[0]).toEqual(dataHoldFromPayout.hold_amount.value);
    });

    await test.step(`Click View invoice trong order detail > Verify invoice của order`, async () => {
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);

      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        dataHoldFromPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, dataHoldFromPayout.hold_amount.value, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
      if (dataHoldFromPayout.release_setting.release_type === `none`) {
        expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();
      } else {
        expect(dataHoldFromPayout.release_setting.abs_time).toEqual(
          formatDate(Number(dataHoldAmountAndDateOfTran.payoutDateTypeIn), "YYYY-MM-DD"),
        );
      }
    });

    await test.step(`Vào Balance > Verify balance`, async () => {
      await expect(async () => {
        dataBalanceAfterHold = await balanceAPI.getDataBalance();
        expect(dataBalanceAfterHold.available_soon).toEqual(dataBalanceBeforeHold.available_soon);
      }).toPass();
    });

    await test.step(`Click View transaction`, async () => {
      // Update the available to payout date for the order to the current date by calling the API.
      await orderApi.releaseAvailableToPayoutProfit(checkoutInfo.order.id);

      // Tool convert holding amount dùng để action cho balance user update ngay để check automation
      await hiveBalance.convertHoldingAmount("plusbase", conf.suiteConf.user_id, conf.suiteConf.username);
      await expect(async () => {
        dataBalanceAfterRelease = await balanceAPI.getDataBalance();
        expect(
          isEqual(
            dataBalanceAfterHold.available_soon - dataBalanceAfterRelease.available_soon,
            orderInfo.profit - dataHoldFromPayout.hold_amount.value,
            0.1,
          ),
        ).toBeTruthy();
      }).toPass();
    });

    await test.step(`Verify release hold amount của order`, async () => {
      await plusbaseOrderAPI.releaseHoldFromPayout([checkoutInfo.order.id]);
      await expect(async () => {
        const dataOrder = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Shopbase");
        const dataHold = dataOrder.order.order_hold_amount[0];
        expect(dataHold.status).toEqual(`release`);
        const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
        const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);

        for (const transaction of listTransaction) {
          expect(formatDate(Number(transaction.available_at), "YYYY-MM-DD")).toEqual(expectDate);
        }
      }).toPass();
    });
  });

  test(`@SB_BAL_HPP_331 [PLB - nhiều order] Verify order, transaction, balance khi user hold/release hold amount nhiều order, trường hợp hold theo A percentage of order's profit, profit vẫn đang ở Available soon`, async ({
    conf,
    authRequest,
    hiveSBase,
  }) => {
    let dataBalanceBeforeHold: DataBalance;
    let dataBalanceAfterHold: DataBalance;
    let dataBalanceAfterRelease: DataBalance;
    const dashboardAPI = new DashboardAPI(plbShopDomain, authRequest);
    const balanceAPI = new BalanceUserAPI(plbShopDomain, authRequest);
    const orderApi = new OrderAPI(plbShopDomain, authRequest);
    const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    const today = new Date();
    const expectDate = formatDate(today, "YYYY-MM-DD");
    let totalProfit: number;

    await test.step(`Vào Orders > Tại tab All > Search order vừa checkout > Đi đến order detail > Click More actions > Click Hold from payout`, async () => {
      dataHoldFromPayout.order_ids = ordersId;
      await expect(async () => {
        dataBalanceBeforeHold = await balanceAPI.getDataBalance();
        expect(
          isEqual(dataBalance.available_soon + totalProfit, dataBalanceBeforeHold.available_soon, 0.1),
        ).toBeTruthy();
      }).toPass();

      await expect(async () => {
        const res = await plusbaseOrderAPI.holdFromPayoutPlb(dataHoldFromPayout);

        expect(res.complete_order_ids).toEqual(ordersId);
      }).toPass();
    });

    await test.step(`Input hold amount > Input Reason > Select Available date > Click confirm > Verify order detail sau khi action hold amount`, async () => {
      for (const order of orderList) {
        const dataOrder = await dashboardAPI.getOrderInfoByApi(order.order.id, "Shopbase");
        const dataHold = dataOrder.order.order_hold_amount[0];
        expect(isEqual(order.totals.total_price, dataHold.amount, 0.1)).toBeTruthy();
        expect(dataHoldFromPayout.reason).toEqual(dataHold.reason);
      }
    });

    await test.step(`Click Balance > Verify balance`, async () => {
      await expect(async () => {
        dataBalanceAfterHold = await balanceAPI.getDataBalance();
        expect(dataBalanceAfterHold.available_soon).toEqual(dataBalanceBeforeHold.available_soon);
      }).toPass();
    });

    await test.step(`Click View transaction > Verify transaction của các order đã hold balance`, async () => {
      for (const order of orderList) {
        const invoiceData = await orderApi.getInvoiceByOrderId(order.order.id);

        const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
          invoiceData.id,
          order.order.name,
          dataHoldFromPayout.reason,
        );

        expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, dataHoldFromPayout.hold_amount.value, 0.1)).toBeTruthy();
        expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
        if (dataHoldFromPayout.release_setting.release_type === `none`) {
          expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();
        } else {
          expect(dataHoldFromPayout.release_setting.abs_time).toEqual(
            formatDate(Number(dataHoldAmountAndDateOfTran.payoutDateTypeIn), "YYYY-MM-DD"),
          );
        }
      }
    });

    await test.step(`Verify release hold amount của order`, async () => {
      // Update the available to payout date for the order to the current date by calling the API.
      for (const order of orderList) {
        await orderApi.releaseAvailableToPayoutProfit(order.order.id);
      }

      // Tool convert holding amount dùng để action cho balance user update ngay để check automation
      await hiveBalance.convertHoldingAmount("plusbase", conf.suiteConf.user_id, conf.suiteConf.username);
      await expect(async () => {
        dataBalanceAfterRelease = await balanceAPI.getDataBalance();
        expect(
          isEqual(
            dataBalanceAfterHold.available_soon - dataBalanceAfterRelease.available_soon,
            orderInfo.profit - dataHoldFromPayout.hold_amount.value,
            0.1,
          ),
        ).toBeTruthy();
      }).toPass();

      await plusbaseOrderAPI.releaseHoldFromPayout(ordersId);

      for (const order of orderList) {
        await expect(async () => {
          const dataOrder = await dashboardAPI.getOrderInfoByApi(order.order.id, "Shopbase");
          const dataHold = dataOrder.order.order_hold_amount[0];
          expect(dataHold.status).toEqual(`release`);

          const invoiceData = await orderApi.getInvoiceByOrderId(order.order.id);
          const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);

          for (const transaction of listTransaction) {
            expect(formatDate(Number(transaction.available_at), "YYYY-MM-DD")).toEqual(expectDate);
          }
        }).toPass();
      }
    });
  });

  test(`@SB_BAL_HPP_314 [PLB] Verify auto release hold amount của order khi cancel order`, async ({ conf }) => {
    await test.step(`Vào shop template > Orders > Search order > Đi đến order detail > More action > Cancel order > Input data > Click Cancel`, async () => {
      orderId = checkoutInfo.order.id;
      orderDate = checkoutInfo.order.created_at.split("T")[0];
      // Hold from payout order
      dataHoldFromPayout.order_ids[0] = orderId;
      dataHoldFromPayout.release_setting.abs_time = orderDate;

      let dataHoldAmount = 0;
      await expect(async () => {
        await plusbaseOrderAPI.holdFromPayoutPlb(dataHoldFromPayout);
        const orderInfo = await dashboardTplAPI.getOrderInfoByApi(orderId, "Shopbase");
        dataHoldAmount = orderInfo.order.order_hold_amount[0].amount;
        expect(dataHoldAmount).toBeGreaterThan(0);
      }).toPass();
      expect(dataHoldAmount).toEqual(valueHoldAmount);

      // Get data available at of transaction charge profit
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        dataHoldFromPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, dataHoldFromPayout.hold_amount.value, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
      expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();

      // Cancel order
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await orderTemplatePage.inputQuantityRefund(1, conf.caseConf.quantities_cancel);
      await orderTemplatePage.clickButton("Cancel");
      expect(await orderTemplatePage.getPaymentStatus()).toEqual("Voided");
    });

    await test.step(`Vào shop PLB > Vào Balance > Verify transaction order khi order bị cancel`, async () => {
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        dataHoldFromPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, dataHoldFromPayout.hold_amount.value, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeIn);
    });
  });

  test(`@SB_BAL_HPP_315 [PLB] Verify auto release hold amount của order khi refund order`, async ({ conf }) => {
    await test.step(`Vào shop template > Orders > Search order > Đi đến order detail > Refund order > Input data > Click Refund`, async () => {
      orderId = checkoutInfo.order.id;
      orderDate = checkoutInfo.order.created_at.split("T")[0];
      dataHoldFromPayout.order_ids[0] = orderId;
      dataHoldFromPayout.release_setting.abs_time = orderDate;
      let dataHoldAmount = 0;
      await expect(async () => {
        await plusbaseOrderAPI.holdFromPayoutPlb(dataHoldFromPayout);
        const orderInfo = await dashboardTplAPI.getOrderInfoByApi(orderId, "Shopbase");
        dataHoldAmount = orderInfo.order.order_hold_amount[0].amount;
        expect(dataHoldAmount).toBeGreaterThan(0);
      }).toPass();
      expect(dataHoldAmount).toEqual(valueHoldAmount);

      // Get data available at of transaction charge profit
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        dataHoldFromPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, dataHoldFromPayout.hold_amount.value, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
      expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();

      // Refund order
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      // Chờ giữa 2 action approve và refund order để tránh khi action quá nhanh làm mất available date trong invoice
      await orderTemplatePage.page.waitForTimeout(15000);
      await orderTemplatePage.clickElementWithLabel("span", "Refund order");
      await orderTemplatePage.inputQuantityRefund(1, conf.caseConf.quantities_cancel);
      await orderTemplatePage.page.waitForTimeout(15000);
      await orderTemplatePage.clickButton("Refund");
      expect(await orderTemplatePage.getPaymentStatus()).toEqual("Partially refunded");
      await orderTemplatePage.page.waitForTimeout(10000);
    });

    await test.step(`Vào shop PLB > Vào Balance > Verify banlance order khi order refund`, async () => {
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        dataHoldFromPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, dataHoldFromPayout.hold_amount.value, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeIn);
    });
  });

  test(`@SB_BAL_HPP_342 Verify ignore auto topup khi hold amount > balance`, async ({
    hiveSBase,
    conf,
    authRequest,
  }) => {
    const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    const balancePage = new BalancePage(orderPage.page, plbShopDomain);
    let totalHold = 0;
    const dataHold = conf.caseConf.data_hold_payout;
    const today = new Date();

    await test.step(`Pre-condition`, async () => {
      await balancePage.autoTopUpByApi(authRequest, conf.suiteConf.domain);
      await hiveBalance.convertHoldingAmount("plusbase", conf.suiteConf.user_id, conf.suiteConf.username);
      const dataBalance = await balanceAPI.getDataBalance();
      totalHold =
        dataBalance.available_soon +
        dataBalance.available_amount +
        dataBalance.pending_amount +
        conf.caseConf.thread_hold;

      totalHold = totalHold > 0 ? totalHold : conf.caseConf.thread_hold;

      dataHold.hold_amount.amount = Number(totalHold.toFixed(2));
    });

    await test.step(`Vào hive SB > Balance > Balance > Filter theo Email > Đi đến màn balance detail của user`, async () => {
      await hiveBalance.goToBalanceByUserId(conf.suiteConf.user_id, conf.suiteConf.username, "show");
      for (const showHoldFromPayout of conf.caseConf.show_hold_from_payout) {
        expect(await hiveBalance.isTextVisible(`${showHoldFromPayout}`)).toBeTruthy();
      }
      // release all
      await hiveBalance.releaseAllOtherHolds();
    });

    await test.step(`Click button Hold from payout > Input data hold > Confirm > Tại màn balance detail của user > Verify field Detail odd other holds`, async () => {
      await hiveBalance.clickOnTextLinkWithLabel("Hold from payout");
      await hiveBalance.holdFromPayoutByUser(dataHold);
      const createDate = await hiveBalance.getDataTable(3, 2, 1);
      const amount = await hiveBalance.getDataTable(3, 2, 2);
      const reason = await hiveBalance.getDataTable(3, 2, 3);
      const status = await hiveBalance.getDataTable(3, 2, 4);

      expect(createDate).toEqual(formatDate(today, "DD-MM-YYYY"));
      expect(isEqual(parseFloat(amount.replace(/,/g, "").substring(1)), dataHold.hold_amount.amount, 0.1)).toBeTruthy();
      expect(reason).toEqual(dataHold.reason);
      expect(status).toEqual(`hold`);
    });

    await test.step(`Login shop PLB > Balance > Verify transactions`, async () => {
      await orderPage.goto(
        `/admin/balance/transactions?created_at_min=${formatDate(today, "YYYY-MM-DD")}&created_at_max=${formatDate(
          today,
          "YYYY-MM-DD",
        )}`,
      );
      const firstTransaction = await orderPage.getDataTable(1, 1, 2);
      expect(firstTransaction.includes(`Automatical top-up `)).toBeFalsy();
    });

    await test.step(`Vào hive SB > Balance > Balance > Filter theo Email > Đi đến màn balance detail của user > thực hiện release khoản hold`, async () => {
      await hiveBalance.releaseAllOtherHolds();
      const count = await hiveBalance.page.locator(hiveBalance.xpathReleaseOtherHold).count();
      expect(count).toEqual(0);
    });
  });

  test(`@SB_BAL_HPP_343 Verify auto topup khi hold amount > balance, user setting enable setting Auto topup`, async ({
    conf,
    hiveSBase,
    authRequest,
  }) => {
    const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    const balancePage = new BalancePage(orderPage.page, plbShopDomain);
    let totalHold = 0;
    const dataHold = conf.caseConf.data_hold_payout;
    const today = new Date();

    await test.step(`Pre-condition`, async () => {
      await hiveBalance.convertHoldingAmount("plusbase", conf.suiteConf.user_id, conf.suiteConf.username);
      const dataBalance = await balanceAPI.getDataBalance();
      totalHold =
        dataBalance.available_soon +
        dataBalance.available_amount +
        dataBalance.pending_amount +
        conf.caseConf.thread_hold;

      totalHold = totalHold > 0 ? totalHold : conf.caseConf.thread_hold;

      dataHold.hold_amount.amount = Number(totalHold.toFixed(2));
    });

    await test.step(`Vào hive SB > Balance > Balance > Filter theo Email > Đi đến màn balance detail của user > Click button Hold from payout`, async () => {
      await hiveBalance.goToBalanceByUserId(conf.suiteConf.user_id, conf.suiteConf.username, "show");
      for (const showHoldFromPayout of conf.caseConf.show_hold_from_payout) {
        expect(await hiveBalance.isTextVisible(`${showHoldFromPayout}`)).toBeTruthy();
      }
      // release all
      await hiveBalance.releaseAllOtherHolds();
    });

    await test.step(`Tại màn balance detail của user > Verify field Detail odd other holds `, async () => {
      await hiveBalance.clickOnTextLinkWithLabel("Hold from payout");
      await hiveBalance.holdFromPayoutByUser(dataHold);
      const createDate = await hiveBalance.getDataTable(3, 2, 1);
      const amount = await hiveBalance.getDataTable(3, 2, 2);
      const reason = await hiveBalance.getDataTable(3, 2, 3);
      const status = await hiveBalance.getDataTable(3, 2, 4);

      expect(createDate).toEqual(formatDate(today, "DD-MM-YYYY"));
      expect(isEqual(parseFloat(amount.replace(/,/g, "").substring(1)), dataHold.hold_amount.amount, 0.1)).toBeTruthy();
      expect(reason).toEqual(dataHold.reason);
      expect(status).toEqual(`hold`);
      await balancePage.autoTopUpByApi(authRequest, conf.suiteConf.domain, true);
    });

    await test.step(`Login shop PLB > Balance > Verify transactions`, async () => {
      await expect(async () => {
        await orderPage.goto(
          `/admin/balance/transactions?created_at_min=${formatDate(today, "YYYY-MM-DD")}&created_at_max=${formatDate(
            today,
            "YYYY-MM-DD",
          )}`,
        );

        await orderPage.page.waitForLoadState("networkidle");
        const firstTransaction = await orderPage.getDataTable(1, 1, 2);
        expect(firstTransaction.includes(`Automatical top-up`)).toBeTruthy();
      }).toPass();
    });

    await test.step(`Vào hive SB > Balance > Balance > Filter theo Email > Đi đến màn balance detail của user > thực hiện release khoản hold`, async () => {
      await hiveBalance.releaseAllOtherHolds();
      const count = await hiveBalance.page.locator(hiveBalance.xpathReleaseOtherHold).count();
      expect(count).toEqual(0);
      await balancePage.autoTopUpByApi(authRequest, conf.suiteConf.domain);
    });
  });
});
