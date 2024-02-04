import { expect, test } from "@core/fixtures";
import { HivePBase } from "@pages/hive/hivePBase";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DashboardAPI } from "@pages/api/dashboard";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import type { DataBalance, DataHoldPayOut, Order } from "@types";
import { OrderAPI } from "@pages/api/order";
import { HoldFromPayoutPb } from "./hold-from-payout-pb";
import { OcgLogger } from "@core/logger";
import { currencyToNumber } from "@core/utils/string";
import { HiveBalance } from "@pages/hive/hive_balance";
import { isEqual } from "@core/utils/checkout";
import { formatDate } from "@core/utils/datetime";

let hivePage: HivePBase;
let hiveUserName: string;
let hivePasswd: string;
let domain: string;
let domainHive: string;
let balanceAPI: BalanceUserAPI;
let orderApi: OrderAPI;

const logger = OcgLogger.get();

test.describe("Hold from payout printbase", async () => {
  test.beforeEach(async ({ conf, page, authRequest }) => {
    domain = conf.suiteConf.domain;
    domainHive = conf.suiteConf.hive_info.domain;
    hiveUserName = conf.suiteConf.hive_info.username;
    hivePasswd = conf.suiteConf.hive_info.password;
    hivePage = new HivePBase(page, domainHive);
    balanceAPI = new BalanceUserAPI(domain, authRequest);
    orderApi = new OrderAPI(conf.suiteConf.domain, authRequest);
  });

  test(`@SB_BAL_HPP_282 [PB] Verify UI Hive Pbase - page Pbase Order`, async ({ conf }) => {
    await test.step(`Vào Customer Support > PBase Order > Verify UI order page`, async () => {
      await hivePage.loginToHivePrintBase(hiveUserName, hivePasswd);
      await hivePage.goto("/admin/pbase-order/list");
      expect(await hivePage.isTextVisible("Hold Amount")).toBeTruthy();
    });

    await test.step(`Scroll xuống cuối page, click dropdown > Select Hold from payout`, async () => {
      await hivePage.clickElementWithLabel(`span`, `Export`);
      await hivePage.page.waitForLoadState("load");
      await expect(hivePage.page.locator(hivePage.getXpathDropListWithAttribute(`Hold From Payout`))).toBeVisible();
    });

    await test.step(`Tại màn order list > Filter order theo order name > Search order > Đi đến màn order detail `, async () => {
      await hivePage.goToOrderDetail(conf.suiteConf.order_id);
      expect(await hivePage.isTextVisible("Hold from Payout")).toBeTruthy();
    });

    await test.step(`Click button Hold from payout`, async () => {
      await hivePage.clickElementWithLabel(`a`, `Hold from Payout`);
      for (const optionHoldPayout of conf.caseConf.options_hold_payout) {
        expect(await hivePage.isTextVisible(`${optionHoldPayout}`)).toBeTruthy();
      }
    });

    await test.step(`Tại field Reason > Input text > Verify giới hạn kí tự của text box`, async () => {
      expect(Number(await hivePage.page.locator(hivePage.xpathReasonHoldPayout).getAttribute("maxlength"))).toEqual(
        conf.caseConf.max_lenght,
      );
    });
  });

  test(`@SB_BAL_HPP_300 [PB - nhiều order] Verify order, transaction, balance khi user hold/release hold amount nhiều order, trường hợp hold theo Absolute amount`, async ({
    page,
    conf,
    authRequest,
    dashboard,
    scheduler,
  }) => {
    const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    const productCheckout = conf.suiteConf.product_checkout;
    const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productCheckout });
    expect(checkoutInfo.order.id).toBeGreaterThan(0);
    const dashboardPage = new DashboardPage(dashboard, domain);
    const orderPage = new OrdersPage(dashboardPage.page, domain);
    const dashboardAPI = new DashboardAPI(domain, authRequest);
    const dataHoldPayout = conf.caseConf.data_hold_payout;

    const orderList = [];
    let orderNames: string;
    let dataBalanceBeforeHold: DataBalance;
    let dataBalanceAfterHold: DataBalance;
    let dataBalanceAfterRelease: DataBalance;
    let totalHold = 0;
    let totalProfit = 0;
    let orderId: string;

    let scheduleData: HoldFromPayoutPb;

    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as HoldFromPayoutPb;
    } else {
      logger.info("Init default object");
      scheduleData = {
        data_balance_before_hold: {
          available_amount: 0,
          available_payout: 0,
          available_soon: 0,
        },
        order: [
          {
            id: 0,
            name: "",
          },
          {
            id: 0,
            name: "",
          },
        ],
        orders_name: "",
        total_profit: 0,
      };

      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
    }

    await test.step(`Pre-condition`, async () => {
      if (!scheduleData.orders_name) {
        for (let i = 0; i < conf.caseConf.number_order; i++) {
          const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productCheckout });
          orderList.push(checkoutInfo);
          orderNames = i < 1 ? checkoutInfo.order.name : `${orderNames},${checkoutInfo.order.name}`;
          orderId = i < 1 ? `${checkoutInfo.order.id}` : `${orderId},${checkoutInfo.order.id}`;
          expect(checkoutInfo.order.id).toBeGreaterThan(0);
        }
      }
    });

    await test.step(`Vào Customer Support > Pbase Order > Select random 5 order > Click Hold from Payout`, async () => {
      if (!scheduleData.orders_name) {
        await hivePage.loginToHivePrintBase(hiveUserName, hivePasswd);
        await hivePage.goto("/admin/pbase-order/list");
        await hivePage.filterDataByName([
          {
            value: orderNames,
            name: "Order Name",
          },
        ]);

        //select checkbox with order name
        for (const orderName of orderList) {
          await hivePage.page.locator(hivePage.xpathSelectCampaign(orderName.order.name)).click();
        }

        await hivePage.clickElementWithLabel(`span`, `Export`);
        await hivePage.page.locator(hivePage.getXpathDropListWithAttribute(`Hold From Payout`)).click();
        await hivePage.page.locator(hivePage.xpathBtnOK).click();
        const url = hivePage.page.url();
        const orderIds = url.split("order_ids=");

        // Verify order hold from payout
        expect(orderIds[1]).toEqual(orderId);
        expect(await hivePage.isTextVisible(`${orderList.length} items selected`)).toBeTruthy();
      }
    });

    await test.step(`Input hold amount > Input Reason > Select Available date > Click confirm > Verify order detail sau khi action hold amount`, async () => {
      if (!scheduleData.orders_name) {
        dataBalanceBeforeHold = await balanceAPI.getDataBalance();

        await hivePage.createHoldFromPayout(dataHoldPayout);
        for (const order of orderList) {
          await hivePage.goToOrderDetail(order.order.id);
          const dataHold: DataHoldPayOut = await hivePage.getDataHoldFromPayout();
          expect(dataHold.hold_amount.amount).toEqual(dataHoldPayout.hold_amount.amount);
          expect(dataHold.reason).toEqual(dataHoldPayout.reason);

          // Call api release profit
          await orderApi.releaseAvailableToPayoutProfit(order.order.id);
        }
      }
    });

    await test.step(`Tại màn Order list > Search các order đã action hold > Verify data order tại cột Hold amount`, async () => {
      if (!scheduleData.orders_name) {
        for (const order of orderList) {
          await hivePage.goto("/admin/pbase-order/list");

          await hivePage.filterDataByName([
            {
              value: order.order.name,
              name: "Order Name",
            },
          ]);

          const holdAmount = await hivePage.getTextContent(hivePage.getXpathInColumnTableOrder(9));
          expect(currencyToNumber(holdAmount)).toEqual(Number(dataHoldPayout.hold_amount.amount.toFixed(2)));
        }
      }
    });

    await test.step(`Login shop PB > Orders > Search lần lượt các order đã action hold amount > Verify order detail của các order`, async () => {
      if (!scheduleData.orders_name) {
        let i = 0;
        for (const order of orderList) {
          await dashboardPage.goToOrderDetails(order.order.id, "printbase");
          expect(await orderPage.isTextVisible(`Order Balance in Hold`)).toBeTruthy();
          const orderInfo = await dashboardAPI.getOrderInfoByApi(order.order.id, "Printbase");
          const orderHoldAmount = orderInfo.order.order_hold_amount[0];
          expect(orderHoldAmount.amount).toEqual(dataHoldPayout.hold_amount.amount);
          expect(orderHoldAmount.reason).toEqual(dataHoldPayout.reason);
          totalHold = totalHold + orderHoldAmount.amount;
          totalProfit = totalProfit + (await orderApi.getOrderProfit(order.order.id, "printbase"));
          scheduleData.order[i].id = order.order.id;
          scheduleData.order[i].name = order.order.name;
          i++;
        }
      }
    });

    await test.step(`Click Balance > Verify balance`, async () => {
      dataBalanceAfterHold = await balanceAPI.getDataBalance();
      if (dataBalanceAfterHold.available_soon === dataBalanceBeforeHold.available_soon) {
        scheduleData.total_profit = totalProfit;
        scheduleData.orders_name = orderNames;
        scheduleData.data_balance_before_hold.available_amount = dataBalanceBeforeHold.available_amount;
        scheduleData.data_balance_before_hold.available_soon = dataBalanceBeforeHold.available_soon;
        scheduleData.data_balance_before_hold.available_payout = dataBalanceBeforeHold.available_payout;
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 15 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      expect(
        Number((scheduleData.data_balance_before_hold.available_soon - dataBalanceAfterHold.available_soon).toFixed(2)),
      ).toEqual(Number((totalProfit - totalHold).toFixed(2)));
    });

    await test.step(`Click View transaction > Verify transaction của các order đã hold balance`, async () => {
      for (const order of scheduleData.order) {
        const invoiceData = await orderApi.getInvoiceByOrderId(order.id);
        const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);
        let totalHold = 0;
        for (const transaction of listTransaction) {
          if (transaction.details === `Order ${order.name} is on hold due to: ${dataHoldPayout.reason}`) {
            totalHold = totalHold + transaction.amount_cent;
          }
        }
        expect(totalHold).toEqual(0);
      }
    });

    await test.step(`Verify release hold amount của order`, async () => {
      await hivePage.loginToHivePrintBase(hiveUserName, hivePasswd);
      await hivePage.goto("/admin/pbase-order/list");

      await hivePage.filterDataByName([
        {
          value: scheduleData.orders_name,
          name: "Order Name",
        },
      ]);

      dataBalanceAfterRelease = await balanceAPI.getDataBalance();
      expect(
        Number(
          (scheduleData.data_balance_before_hold.available_soon - dataBalanceAfterRelease.available_soon).toFixed(2),
        ),
      ).toEqual(Number(scheduleData.total_profit.toFixed(2)));
    });

    logger.info("Clear scheduling");
    await scheduler.clear();
  });

  test(`@SB_BAL_HPP_332 [PB - 1 order] Verify order, transaction, balance khi user hold/release amount 1 order theo Absolute amount và Available date = Auto release on this date, trường hợp hold amount > order profit, profit vẫn đang ở Available soon`, async ({
    page,
    conf,
    authRequest,
    dashboard,
    hiveSBase,
  }) => {
    const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    const dashboardAPI = new DashboardAPI(domain, authRequest);
    let dataHoldPayout: DataHoldPayOut;
    let orderInfo: Order;
    let dataBalanceBeforeHold: DataBalance;
    let dataBalanceAfterHold: DataBalance;
    let dataBalanceAfterRelease: DataBalance;

    const today = new Date();
    const expectDate = formatDate(today, "YYYY-MM-DD");

    dataHoldPayout = {
      hold_amount: {
        option: "",
        amount: 0,
        code: "",
      },
      reason: "",
      available_date: {
        option: "",
      },
    };
    const productCheckout = conf.suiteConf.product_checkout;
    dataHoldPayout = conf.caseConf.data_hold_payout;
    const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productCheckout });

    await expect(async () => {
      orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Printbase");
      expect(orderInfo.pbase_order.profit).toBeGreaterThan(0);
    }).toPass();

    // hold amount = profit order + extend profit
    dataHoldPayout.hold_amount.amount = Number((orderInfo.pbase_order.profit + conf.caseConf.profit_extend).toFixed(2));

    const dashboardPage = new DashboardPage(dashboard, domain);
    const orderPage = new OrdersPage(dashboardPage.page, domain);
    const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);

    //clear data balance after hold payout
    await hiveBalance.convertHoldingAmount("printbase", conf.suiteConf.user_id, conf.suiteConf.username);
    await hiveBalance.page.reload();

    await test.step(`Vào hive-pbase > Vào order detail > click button Hold from Payout > Input hold amount > Input Reason > Select Available date > Click confirm`, async () => {
      await hivePage.loginToHivePrintBase(hiveUserName, hivePasswd);
      await hivePage.goToOrderDetail(checkoutInfo.order.id);
      await hivePage.clickOnTextLinkWithLabel(`Hold from Payout`);

      dataBalanceBeforeHold = await balanceAPI.getDataBalance();

      await hivePage.createHoldFromPayout(dataHoldPayout);

      await hivePage.goToOrderDetail(checkoutInfo.order.id);
      const dataHold: DataHoldPayOut = await hivePage.getDataHoldFromPayout();
      expect(dataHold.hold_amount.amount).toEqual(dataHoldPayout.hold_amount.amount);
    });

    await test.step(`Vào Orders > Tại tab All > Search order > Verify order tại màn order list`, async () => {
      await dashboardPage.goToOrderDetails(checkoutInfo.order.id, "printbase");
      expect(await orderPage.isTextVisible(`Order Balance in Hold`)).toBeTruthy();
      const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Printbase");
      const orderHoldAmount = orderInfo.order.order_hold_amount[0];
      expect(orderHoldAmount.amount).toEqual(dataHoldPayout.hold_amount.amount);
      expect(orderHoldAmount.reason).toEqual(dataHoldPayout.reason);
    });

    await test.step(`Click View invoice trong order detail > Verify invoice của order`, async () => {
      await orderPage.viewInvoice();
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        dataHoldPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, dataHoldPayout.hold_amount.amount, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
      if (dataHoldPayout.available_date.option === `None`) {
        expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();
      } else {
        expect(dataHoldPayout.available_date.date).toEqual(
          formatDate(Number(dataHoldAmountAndDateOfTran.payoutDateTypeIn), "YYYY-MM-DD"),
        );
      }
    });

    await test.step(`Vào Balance > Verify balance`, async () => {
      dataBalanceAfterHold = await balanceAPI.getDataBalance();
      expect(dataBalanceAfterHold.available_soon).toEqual(dataBalanceBeforeHold.available_soon);
    });

    await test.step(`Đến ngày release payout của order > Verify balanse sau khi release, order vẫn đang bị hold`, async () => {
      // Update the available to payout date for the order to the current date by calling the API.
      await orderApi.releaseAvailableToPayoutProfit(checkoutInfo.order.id);

      // Tool convert holding amount dùng để action cho balance user update ngay để check automation
      await hiveBalance.convertHoldingAmount("printbase", conf.suiteConf.user_id, conf.suiteConf.username);
      await expect(async () => {
        dataBalanceAfterRelease = await balanceAPI.getDataBalance();

        expect(dataBalanceAfterRelease.available_soon - dataBalanceAfterHold.available_soon).toEqual(
          conf.caseConf.profit_extend,
        );
      }).toPass();
    });

    await test.step(`Vào hive-pbase > Vào order vừa hold > Release hold payout order > Check balance sau khi release`, async () => {
      await hivePage.clickOnBtnWithLabel(`Release`);
      await expect(hivePage.genLoc(hivePage.xpathSuccessMessage)).toBeVisible();

      // Perform the action to convert the balance with the user ID in the Hive-PBase system.
      await hiveBalance.convertHoldingAmount("printbase", conf.suiteConf.user_id, conf.suiteConf.username);
      dataBalanceAfterRelease = await balanceAPI.getDataBalance();

      await expect(async () => {
        dataBalanceAfterRelease = await balanceAPI.getDataBalance();
        expect(
          isEqual(
            dataBalanceAfterHold.available_soon - dataBalanceAfterRelease.available_soon,
            dataHoldPayout.hold_amount.amount,
            0.1,
          ),
        ).toBeTruthy();
      }).toPass();

      await expect(async () => {
        const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
        const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);

        for (const transaction of listTransaction) {
          expect(formatDate(Number(transaction.available_at), "YYYY-MM-DD")).toEqual(expectDate);
        }
      }).toPass();
    });
  });

  test(`@SB_BAL_HPP_341 [PB - 1 order] Verify order, transaction khi user hold/release amount 1 order theo A percentage of order's profit và Available date = Auto release on this date, trường hợp hold amount = order's profit, profit vẫn đang ở Available soon`, async ({
    page,
    conf,
    authRequest,
    dashboard,
    hiveSBase,
  }) => {
    const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    const dashboardAPI = new DashboardAPI(domain, authRequest);
    let dataHoldPayout: DataHoldPayOut;
    let orderInfo: Order;
    let dataBalanceBeforeHold: DataBalance;
    let dataBalanceAfterHold: DataBalance;
    let dataBalanceAfterRelease: DataBalance;
    const today = new Date();
    const expectDate = formatDate(today, "YYYY-MM-DD");
    dataHoldPayout = {
      hold_amount: {
        option: "",
        amount: 0,
        code: "",
      },
      reason: "",
      available_date: {
        option: "",
      },
    };
    const productCheckout = conf.suiteConf.product_checkout;
    dataHoldPayout = conf.caseConf.data_hold_payout;
    const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productCheckout });

    await expect(async () => {
      orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Printbase");
      expect(orderInfo.pbase_order.profit).toBeGreaterThan(0);
    }).toPass();

    const dashboardPage = new DashboardPage(dashboard, domain);
    const orderPage = new OrdersPage(dashboardPage.page, domain);
    const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);

    //clear data balance after hold payout
    await hiveBalance.convertHoldingAmount("printbase", conf.suiteConf.user_id, conf.suiteConf.username);
    await hiveBalance.page.reload();

    await test.step(`Vào hive-pbase > Vào order detail > click button Hold from Payout > Input hold amount > Input Reason > Select Available date > Click confirm > Verify order detail sau khi action hold amount`, async () => {
      await hivePage.loginToHivePrintBase(hiveUserName, hivePasswd);
      await hivePage.goToOrderDetail(checkoutInfo.order.id);
      await hivePage.clickOnTextLinkWithLabel(`Hold from Payout`);
      dataBalanceBeforeHold = await balanceAPI.getDataBalance();
      await hivePage.createHoldFromPayout(dataHoldPayout);
      await hivePage.goToOrderDetail(checkoutInfo.order.id);
      const dataHold: DataHoldPayOut = await hivePage.getDataHoldFromPayout();
      expect(isEqual(dataHold.hold_amount.amount, checkoutInfo.totals.total_price, 0.01)).toBeTruthy();
    });

    await test.step(`Tại màn Order list > Search order > Verify data order tại cột Hold amount`, async () => {
      await hivePage.goto("/admin/pbase-order/list");

      await hivePage.filterDataByName([
        {
          value: checkoutInfo.order.name,
          name: "Order Name",
        },
      ]);

      const holdAmount = await hivePage.getTextContent(hivePage.getXpathInColumnTableOrder(9));
      expect(isEqual(currencyToNumber(holdAmount), checkoutInfo.totals.total_price, 0.01)).toBeTruthy();
    });

    await test.step(`Login shop PLB > Orders > Search order, đi đến order detail > Verify order detail shop PLB khi bị hold`, async () => {
      await dashboardPage.goToOrderDetails(checkoutInfo.order.id, "printbase");
      expect(await orderPage.isTextVisible(`Order Balance in Hold`)).toBeTruthy();
      const orderInfo = await dashboardAPI.getOrderInfoByApi(checkoutInfo.order.id, "Printbase");
      const orderHoldAmount = orderInfo.order.order_hold_amount[0];
      expect(isEqual(orderHoldAmount.amount, checkoutInfo.totals.total_price, 0.1)).toBeTruthy();
      expect(orderHoldAmount.reason).toEqual(dataHoldPayout.reason);
    });

    await test.step(`Tại order detail > Click View invoice > Verify invoice, transaction của order`, async () => {
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);

      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        dataHoldPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, dataHoldPayout.hold_amount.amount, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
      if (dataHoldPayout.available_date.option === `None`) {
        expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();
      } else {
        expect(dataHoldPayout.available_date.date).toEqual(
          formatDate(Number(dataHoldAmountAndDateOfTran.payoutDateTypeIn), "YYYY-MM-DD"),
        );
      }
    });

    await test.step(`Vào Balance > Verify balance sau khi hold payout của order`, async () => {
      dataBalanceAfterHold = await balanceAPI.getDataBalance();
      expect(dataBalanceAfterHold.available_soon).toEqual(dataBalanceBeforeHold.available_soon);
    });

    await test.step(`Vào hive-pbase > Vào order vừa hold > Release hold payout order > Check balance sau khi release`, async () => {
      // Update the available to payout date for the order to the current date by calling the API.
      await orderApi.releaseAvailableToPayoutProfit(checkoutInfo.order.id);

      // Tool convert holding amount dùng để action cho balance user update ngay để check automation
      await hiveBalance.convertHoldingAmount("printbase", conf.suiteConf.user_id, conf.suiteConf.username);
      await expect(async () => {
        dataBalanceAfterRelease = await balanceAPI.getDataBalance();
        expect(
          isEqual(
            dataBalanceAfterRelease.available_soon - dataBalanceAfterHold.available_soon,
            checkoutInfo.totals.total_price - orderInfo.pbase_order.profit,
            0.1,
          ),
        ).toBeTruthy();
      }).toPass();

      await hivePage.goToOrderDetail(checkoutInfo.order.id);
      await hivePage.clickOnBtnWithLabel(`Release`);
      await expect(hivePage.genLoc(hivePage.xpathSuccessMessage)).toBeVisible();

      await expect(async () => {
        const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
        const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);

        for (const transaction of listTransaction) {
          expect(formatDate(Number(transaction.available_at), "YYYY-MM-DD")).toEqual(expectDate);
        }
      }).toPass();
    });
  });
});
