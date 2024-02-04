import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { PrintHubPage } from "@pages/apps/printhub";
import { MyOrdersPage } from "@pages/crosspanda/my_orders";

import type { SchedulerSyncOrder } from "@types";
import { PrintHubAPI } from "@pages/api/dashboard/printhub";

let orderName: string;
let printHubAPI: PrintHubAPI;
let orderId: number;
let ordersPage: OrdersPage;
let printHubPage: PrintHubPage;
let myOrdersPage: MyOrdersPage;
let messageMapProduct: string;
let scheduleData: SchedulerSyncOrder;
test.describe("POD Cross Panda", () => {
  test.beforeEach(async ({ conf, scheduler }) => {
    messageMapProduct = conf.suiteConf.message_map_product;
    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as SchedulerSyncOrder;
    } else {
      scheduleData = {
        number_in_tab: 0,
        order_name: "",
      };
    }
    test.setTimeout(conf.suiteConf.timeout);
  });

  test("Check order PrintHub sync về Cross Panda - @SB_XPPOD_179", async ({
    dashboard,
    crossPanda,
    conf,
    authRequest,
    scheduler,
  }) => {
    printHubAPI = new PrintHubAPI(conf.suiteConf.domain, authRequest);
    await test.step("Checkout thành công với product có sẵn trong shop", async () => {
      if (!scheduleData.order_name) {
        const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest);
        const productsCheckout = conf.caseConf.products_checkout;
        await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: productsCheckout,
          customerInfo: {
            shippingAddress: conf.suiteConf.shippingAddress,
          },
        });

        orderName = (await checkoutAPI.getOrderInfo(authRequest)).name;
        orderId = (await checkoutAPI.getOrderInfo(authRequest)).id;
      } else {
        orderName = scheduleData.order_name;
        orderId = scheduleData.order_id;
      }
    });

    await test.step("Vào màn PrintHub > All orders > Search order vừa được tạo", async () => {
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      printHubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
      await ordersPage.goToOrderByOrderId(orderId);
      await ordersPage.fulfillWithFulfillmentService("PrintHub");
      const dataOrderPrintHubTabName = conf.caseConf.data_order_printhub.tab_name;
      const dataOrderPrintHubValue = conf.caseConf.data_order_printhub.value[0];
      const valueFirst = Number(Object.values(dataOrderPrintHubValue)[0]);
      const dataCountInTabNameFirst = await printHubAPI.countOrderPrintHubInTab(dataOrderPrintHubTabName[0], orderName);
      if (valueFirst != dataCountInTabNameFirst) {
        scheduleData.number_in_tab = Number(valueFirst);
        scheduleData.order_name = orderName;
        scheduleData.order_id = orderId;
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 30 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      await scheduler.clear();
      for (let i = 0; i < dataOrderPrintHubTabName.length; i++) {
        const tabName = dataOrderPrintHubTabName[i];
        const value = Object.values(dataOrderPrintHubValue)[i];
        expect(await printHubAPI.countOrderPrintHubInTab(tabName, orderName)).toEqual(value);
      }
    });

    await test.step("Vào màn Payment, charge order vừa tạo / Click tab Awaiting Payment > Pay now", async () => {
      await printHubPage.switchTabInAllOrders("Awaiting Payment");
      await printHubPage.payOrder(orderName);
      await expect(printHubPage.genLoc("//div[@class='s-toast is-success is-bottom']")).toBeVisible();
    });

    await test.step("Vào màn PrintHub > All orders - Search order vừa được tạo", async () => {
      await dashboard.reload();
      await dashboard.waitForLoadState("networkidle");
      const dataOrderPrintHubTab = conf.caseConf.data_order_printhub.tab_name;
      const dataOrderPrintHubValue = conf.caseConf.data_order_printhub.value[1];

      for (let i = 0; i < dataOrderPrintHubTab.length; i++) {
        const tabName = dataOrderPrintHubTab[i];
        const value = Object.values(dataOrderPrintHubValue)[i];
        expect(await printHubAPI.countOrderPrintHubInTab(tabName, orderName)).toEqual(value);
      }
    });

    await test.step("Vào Xpanda > Search order vừa được tạo", async () => {
      myOrdersPage = new MyOrdersPage(crossPanda, conf.suiteConf.crosspanda_domain);
      await myOrdersPage.gotoOrderAndSearchOrder(conf.suiteConf.domain, orderName);
      await myOrdersPage.mappingProduct(messageMapProduct);
      await myOrdersPage.gotoOrderAndSearchOrder(conf.suiteConf.domain, orderName);
      const dataOrderCrossPandaTabName = conf.caseConf.data_order_cross_panda.tab_name;
      const dataOrderCrossPandaValue = conf.caseConf.data_order_cross_panda.value[0];

      for (let i = 0; i < dataOrderCrossPandaTabName.length; i++) {
        const tabName = dataOrderCrossPandaTabName[i];
        const value = Object.values(dataOrderCrossPandaValue)[i];
        expect(await myOrdersPage.countOrderCrossPandaInTab(tabName)).toEqual(value);
        if (value === 1) {
          await expect(
            await myOrdersPage.genLoc(`//div[contains(@class,'order-no')]//span[normalize-space()='${orderName}']`),
          ).toBeVisible();
        }
      }
    });
  });

  test("Check order PrintHub sync về Xpanda nhưng chưa mapping product - @SB_XPPOD_182", async ({
    dashboard,
    crossPanda,
    conf,
    authRequest,
    scheduler,
  }) => {
    printHubAPI = new PrintHubAPI(conf.suiteConf.domain, authRequest);
    await test.step("Checkout thành công với product có sẵn trong shop", async () => {
      if (!scheduleData.order_name) {
        const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest);
        const productsCheckout = conf.caseConf.products_checkout;
        await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: productsCheckout,
          customerInfo: {
            shippingAddress: conf.suiteConf.shippingAddress,
          },
        });

        orderName = (await checkoutAPI.getOrderInfo(authRequest)).name;
        orderId = (await checkoutAPI.getOrderInfo(authRequest)).id;
      } else {
        orderName = scheduleData.order_name;
        orderId = scheduleData.order_id;
      }
    });

    await test.step("Vào màn PrintHub > All orders > Search order vừa được tạo", async () => {
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      printHubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
      await ordersPage.goToOrderByOrderId(orderId);
      await ordersPage.fulfillWithFulfillmentService("PrintHub");
      const dataOrderPrintHubTabName = conf.caseConf.data_order_printhub.tab_name;
      const dataOrderPrintHubValue = conf.caseConf.data_order_printhub.value[0];
      const valueFirst = Object.values(dataOrderPrintHubValue)[0];
      const dataCountInTabNameFirst = await printHubAPI.countOrderPrintHubInTab(dataOrderPrintHubTabName[0], orderName);
      if (valueFirst != dataCountInTabNameFirst) {
        scheduleData.number_in_tab = Number(valueFirst);
        scheduleData.order_name = orderName;
        scheduleData.order_id = orderId;
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 30 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      await scheduler.clear();
      for (let i = 0; i < dataOrderPrintHubTabName.length; i++) {
        const tabName = dataOrderPrintHubTabName[i];
        const value = Object.values(dataOrderPrintHubValue)[i];
        expect(await printHubAPI.countOrderPrintHubInTab(tabName, orderName)).toEqual(value);
      }
    });

    await test.step("Vào màn Payment, charge order vừa tạo / Click tab Awaiting Payment > Pay now", async () => {
      await printHubPage.switchTabInAllOrders("Awaiting Payment");
      await printHubPage.payOrder(orderName);
      await expect(printHubPage.genLoc("//div[@class='s-toast is-success is-bottom']")).toBeVisible();
    });

    await test.step("Vào màn PrintHub > All orders - Search order vừa được tạo", async () => {
      await dashboard.reload();
      await dashboard.waitForLoadState("networkidle");
      const dataOrderPrintHubTab = conf.caseConf.data_order_printhub.tab_name;
      const dataOrderPrintHubValue = conf.caseConf.data_order_printhub.value[1];

      for (let i = 0; i < dataOrderPrintHubTab.length; i++) {
        const tabName = dataOrderPrintHubTab[i];
        const value = Object.values(dataOrderPrintHubValue)[i];
        expect(await printHubAPI.countOrderPrintHubInTab(tabName, orderName)).toEqual(value);
      }
    });

    await test.step("Vào Xpanda > Search order vừa được tạo", async () => {
      myOrdersPage = new MyOrdersPage(crossPanda, conf.suiteConf.crosspanda_domain);
      await myOrdersPage.gotoOrderAndSearchOrder(conf.suiteConf.domain, orderName);
      const dataOrderCrossPandaTabName = conf.caseConf.data_order_cross_panda.tab_name;
      const dataOrderCrossPandaValue = conf.caseConf.data_order_cross_panda.value[0];

      for (let i = 0; i < dataOrderCrossPandaTabName.length; i++) {
        const tabName = dataOrderCrossPandaTabName[i];
        const value = Object.values(dataOrderCrossPandaValue)[i];
        expect(await myOrdersPage.countOrderCrossPandaInTab(tabName)).toEqual(value);
        if (value === 1) {
          await expect(
            await myOrdersPage.genLoc(`//div[contains(@class,'order-no')]//span[normalize-space()='${orderName}']`),
          ).toBeVisible();
        }
      }
    });
  });

  test("Check action fulfill order on Xpanda - @SB_XPPOD_183", async ({
    dashboard,
    crossPanda,
    conf,
    authRequest,
    scheduler,
  }) => {
    printHubAPI = new PrintHubAPI(conf.suiteConf.domain, authRequest);
    await test.step("Checkout thành công với product có sẵn trong shop > Vào màn Payment, charge order vừa tạo > Vào Xpanda, Search order vừa được tạo", async () => {
      if (!scheduleData.order_name) {
        const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest);
        const productsCheckout = conf.caseConf.products_checkout;
        await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: productsCheckout,
          customerInfo: {
            shippingAddress: conf.suiteConf.shippingAddress,
          },
        });

        orderName = (await checkoutAPI.getOrderInfo(authRequest)).name;
        orderId = (await checkoutAPI.getOrderInfo(authRequest)).id;
      } else {
        orderName = scheduleData.order_name;
        orderId = scheduleData.order_id;
      }
      ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      printHubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
      await ordersPage.goToOrderByOrderId(orderId);
      await ordersPage.fulfillWithFulfillmentService("PrintHub");
      const dataCountInTabNameFirst = await printHubAPI.countOrderPrintHubInTab("awaiting_order", orderName);
      if (dataCountInTabNameFirst != 1) {
        scheduleData.number_in_tab = Number(dataCountInTabNameFirst);
        scheduleData.order_id = orderId;
        scheduleData.order_name = orderName;

        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 30 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      await scheduler.clear();
      await printHubPage.switchTabInAllOrders("Awaiting Payment");
      await printHubPage.payOrder(orderName);
      await expect(printHubPage.genLoc("//div[@class='s-toast is-success is-bottom']")).toBeVisible();

      await dashboard.reload();
      await dashboard.waitForLoadState("networkidle");

      myOrdersPage = new MyOrdersPage(crossPanda, conf.suiteConf.crosspanda_domain);
      await myOrdersPage.gotoOrderAndSearchOrder(conf.suiteConf.domain, orderName);
      await myOrdersPage.mappingProduct(messageMapProduct);
      await myOrdersPage.gotoOrderAndSearchOrder(conf.suiteConf.domain, orderName);

      const dataOrderCrossPandaTabName = conf.caseConf.data_order_cross_panda.tab_name;
      const dataOrderCrossPandaValue = conf.caseConf.data_order_cross_panda.value[0];

      for (let i = 0; i < dataOrderCrossPandaTabName.length; i++) {
        const tabName = dataOrderCrossPandaTabName[i];
        const value = Object.values(dataOrderCrossPandaValue)[i];
        expect(await myOrdersPage.countOrderCrossPandaInTab(tabName)).toEqual(value);
        if (value === 1) {
          await expect(
            await myOrdersPage.genLoc(`//div[contains(@class,'order-no')]//span[normalize-space()='${orderName}']`),
          ).toBeVisible();
        }
      }
    });

    await test.step("Click button [Fulfill order]", async () => {
      await myOrdersPage.switchTabInAllOrders("Ready to fulfill");
      await myOrdersPage.fulfillOrder(orderName);
      await myOrdersPage.page.reload();
      const dataOrderCrossPandaTabName = conf.caseConf.data_order_cross_panda.tab_name;
      const dataOrderCrossPandaValue = conf.caseConf.data_order_cross_panda.value[1];

      for (let i = 0; i < dataOrderCrossPandaTabName.length; i++) {
        const tabName = dataOrderCrossPandaTabName[i];
        const value = Object.values(dataOrderCrossPandaValue)[i];
        expect(await myOrdersPage.countOrderCrossPandaInTab(tabName)).toEqual(value);
        if (value === 1) {
          await expect(
            await myOrdersPage.genLoc(`//div[contains(@class,'order-no')]//span[normalize-space()='${orderName}']`),
          ).toBeVisible();
        }
      }
    });
  });
});
