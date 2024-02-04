import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { OrderAPI } from "@pages/shopbase_creator/dashboard/order_api";
import { dateFilter } from "@core/utils/datetime";

test.describe("Verify orders", () => {
  let orderPage: OrderPage;
  let dashboardPage: DashboardPage;
  let orderAPI: OrderAPI;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    orderAPI = new OrderAPI(conf.suiteConf.domain, authRequest);
    await dashboardPage.navigateToMenu("Orders");
  });

  test(`Verify search order @SB_SC_SCO_07`, async ({ conf }) => {
    await test.step(`Verify UI thanh Search order`, async () => {
      await expect(orderPage.genLoc(`[placeholder="Search order"]`)).toBeVisible();
    });
    await test.step(`Search name order like`, async () => {
      const orderId = conf.caseConf.order_id_like;
      await orderPage.searchOrderDashboard(orderId);
      expect(await orderPage.countOrderOnList()).toEqual(
        await orderPage.countOrderOnList(conf.caseConf.type_search_order, orderId),
      );
    });

    await test.step(`Search name order equal`, async () => {
      const orderIdEqual = conf.caseConf.order_id_equal;
      await orderPage.searchOrderDashboard(orderIdEqual);
      await expect(orderPage.genLoc(`//div[contains(text(),'${orderIdEqual}')]`)).toBeVisible();
    });

    for (let i = 0; i < conf.caseConf.search_order.length; i++) {
      const searchOrder = conf.caseConf.search_order[i];
      await test.step(`${searchOrder.description_step}`, async () => {
        await orderPage.searchOrderDashboard(searchOrder.search_order);
        await orderPage.waitUntilElementVisible(orderPage.getXpathHeaderColumn("Order"));
        await expect(orderPage.genLoc("//div[@class='no-orders']")).toBeVisible();
      });
    }
  });

  test(`[Filter] Verify filter theo Status @SB_SC_SCO_09`, async ({ conf }) => {
    const listFilterOrderStatus = conf.caseConf.list_data_filter_order_status;

    for (let i = 0; i < listFilterOrderStatus.length; i++) {
      const filterOrder = listFilterOrderStatus[i];
      await test.step(`${filterOrder.description_step}`, async () => {
        await orderPage.filterOrderByValue(filterOrder.filter_order);
        await orderPage.waitResponseWithUrl("orders/count/v2.json");
        const actNumberOfOrderFilter = await orderPage.countOrderOnList(
          filterOrder.filter_order.filter_type,
          filterOrder.status_order,
        );
        const expNumberOrder = await orderAPI.getNumberOfOrderWithParam(filterOrder.param);
        expect(actNumberOfOrderFilter).toEqual(expNumberOrder);
      });
    }
  });

  test(`[Filter] Verify filter theo Product @SB_SC_SCO_10`, async ({ conf }) => {
    const listFilterProductOrder = conf.caseConf.list_data_filter_product_order;

    for (let i = 0; i < listFilterProductOrder.length; i++) {
      const filterProductOrder = listFilterProductOrder[i];
      await test.step(`${filterProductOrder.description_step} (${i + 1})`, async () => {
        await orderPage.filterOrderByValue(filterProductOrder.filter_order);
        await orderPage.waitResponseWithUrl("orders/count/v2.json");
        const actNumberOfOrderFilter = await orderPage.countOrderOnList(
          filterProductOrder.filter_order.filter_type,
          filterProductOrder.filter_order.filter_text,
        );
        const expNumberOrder = await orderAPI.getNumberOfOrderWithParam(filterProductOrder.param);
        expect(actNumberOfOrderFilter).toEqual(expNumberOrder);
      });
    }
  });

  test(`Verify filter order theo test order  @SB_SC_SCO_13`, async ({ conf }) => {
    await test.step(`filter order là order test`, async () => {
      const orderTest = conf.caseConf.list_data_filter_order_test;
      await orderPage.filterOrderByValue(orderTest.filter_order);
      await orderPage.waitResponseWithUrl("orders/count/v2.json");
      const actNumberOfOrderFilter = await orderPage.countOrderOnList(
        orderTest.filter_order.filter_type,
        orderTest.filter_order.filter_value,
      );
      const expNumberOrder = await orderAPI.getNumberOfOrderWithParam(orderTest.param);
      expect(actNumberOfOrderFilter).toEqual(expNumberOrder);
    });
  });

  test(`Verify hiển thị thông tin order @SB_SC_SCO_05`, async ({ conf, token, dashboard }) => {
    let value: string;
    await test.step(`Kiểm tra thông tin hiển thị trên list orders`, async () => {
      await expect(orderPage.genLoc(orderPage.getXpathHeaderColumn("Order"))).toBeVisible();
      await expect(orderPage.genLoc(orderPage.getXpathHeaderColumn("Email"))).toBeVisible();
      await expect(orderPage.genLoc(orderPage.getXpathHeaderColumn("Date"))).toBeVisible();
      await expect(orderPage.genLoc(orderPage.getXpathHeaderColumn("Payment status"))).toBeVisible();
      await expect(orderPage.genLoc(orderPage.getXpathHeaderColumn("Total"))).toBeVisible();
    });

    await test.step(`Check hiển thị trường "Mã order"`, async () => {
      value = await orderPage.getValueOnCell("Order");
      expect(value.substring(0, 1)).toEqual("#");
    });

    await test.step(`Check hiển thị trường "Email"`, async () => {
      value = await orderPage.getValueOnCell("Email");
      expect(value).toContain("@");
    });

    await test.step(`Check hiển thị trường "Date"`, async () => {
      value = await orderPage.getValueOnCell("Date");
      expect(value).not.toEqual("");
    });

    await test.step(`Check hiển thị trường "Payment Status"`, async () => {
      expect((await orderPage.getValueOnCell("Payment status")).trim()).toEqual(conf.caseConf.status);
    });

    await test.step(`Check hiển thị trường "Total"`, async () => {
      value = await orderPage.getValueOnCell("Total");
      expect(value.substring(0, 1)).toEqual("$");
    });

    await test.step(`Login shop. Tại Menu: Chọn Orders >chọn [All Orders] 
    Verify order list không có order nào`, async () => {
      dashboardPage = new DashboardPage(dashboard, conf.suiteConf.second_domain);
      const accessToken = (
        await token.getWithCredentials({
          domain: conf.suiteConf.second_shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;
      await dashboardPage.loginWithToken(accessToken);
      orderPage = new OrderPage(dashboard, conf.suiteConf.second_domain);
    });
    await orderPage.navigateToMenu("Orders");
    await expect(orderPage.genLoc(orderPage.getXpathWithLabel("You have no orders yet"))).toBeVisible();
  });

  test(`Verify filter theo Order date @SB_SC_SCO_11`, async ({ conf }) => {
    const paramRequest = conf.caseConf.param;
    const filterData = conf.caseConf.list_data_filter_order_date;
    for (const filterItem of filterData) {
      await test.step(`${filterItem.description_step}`, async () => {
        const date = dateFilter(filterItem.filter_order.filter_date);
        await orderPage.filterOrderByValue(filterItem.filter_order);
        await orderPage.waitResponseWithUrl("orders/count/v2.json");
        const actNumberOfOrderFilter = await orderPage.countOrderOnList();
        paramRequest.created_at_min = date.from;
        paramRequest.created_at_max = date.to;

        const expNumberOrder = await orderAPI.getNumberOfOrderWithParam(paramRequest);
        expect(actNumberOfOrderFilter).toEqual(expNumberOrder);
      });
    }
  });

  test(`Verify filter theo Refund date @SB_SC_SCO_12`, async ({ conf }) => {
    const paramRequest = conf.caseConf.param;
    const filterData = conf.caseConf.list_data_filter_refund_date;
    for (const filterItem of filterData) {
      await test.step(`${filterItem.description_step}`, async () => {
        const date = dateFilter(filterItem.filter_order.filter_date);
        await orderPage.filterOrderByValue(filterItem.filter_order);
        await orderPage.waitResponseWithUrl("orders/count/v2.json");
        const actNumberOfOrderFilter = await orderPage.countOrderOnList();
        paramRequest.refund_at_min = date.from;
        paramRequest.refund_at_max = date.to;

        const expNumberOrder = await orderAPI.getNumberOfOrderWithParam(paramRequest);
        expect(actNumberOfOrderFilter).toEqual(expNumberOrder);
      });
    }
  });

  test(`Verify chức năng export orders @SB_SC_SCO_15`, async ({ conf }) => {
    await test.step(`Click "Export order". Select export order theo "Current page". Click "Export to file". Kiểm tra file export`, async () => {
      await orderPage.genLoc(orderPage.xpathBtnWithLabel("Export order")).click();
      const file = await orderPage.exportOrderWithOption("Current page");
      const ids = await orderAPI.getIdsOfOrderList();
      expect(await orderPage.compareOrderIdWithCSV(file, ids)).toBeTruthy();
    });

    await test.step(`Click "Export order". Select export order theo "Order by date". Click "Export to file". Kiểm tra file export`, async () => {
      const orderByDate = conf.caseConf.orders_by_date;
      const paramRequest = conf.caseConf.param_date;
      for (const dateItem of orderByDate) {
        await orderPage.genLoc(orderPage.xpathBtnWithLabel("Export order")).click();
        const date = dateFilter(dateItem.date_value);
        paramRequest.created_at_min = date.from;
        paramRequest.created_at_max = date.to;
        const ids = await orderAPI.getIdsOfOrderList(paramRequest);

        if (ids.length === 0) {
          await orderPage.chooseOptionExport(dateItem.export_type, dateItem.date_value);
          await orderPage.clickButtonOnPopUpWithLabel("Export to file");
          expect(await orderPage.getTextContent(orderPage.xpathToastBottom)).toEqual("There is no order available.");
        } else {
          const file = await orderPage.exportOrderWithOption(dateItem.export_type, dateItem.date_value);
          expect(await orderPage.compareOrderIdWithCSV(file, ids)).toBeTruthy();
          expect(await orderPage.getTextContent(orderPage.xpathToastBottom)).toEqual(`Exported ${ids.length} orders.`);
        }
        await expect(orderPage.genLoc(orderPage.xpathToastBottom)).not.toBeVisible();
      }
    });

    await test.step(`Click "Export order". Select export order theo "All orders". Click "Export to file". Kiểm tra file export`, async () => {
      await orderPage.genLoc(orderPage.xpathBtnWithLabel("Export order")).click();
      await orderPage.chooseOptionExport("All orders");
      await orderPage.clickButtonOnPopUpWithLabel("Export to file");
      await orderPage.waitResponseWithUrl("orders/multiple_shops_export.json");
      await expect(orderPage.genLoc(orderPage.getXpathWithLabel("There is no order available."))).not.toBeVisible();
      expect(await orderPage.getTextContent(orderPage.xpathToastBottom)).toEqual(
        "Your export will be delivered to email: shopbase@beeketing.net.",
      );
    });

    await test.step(`Tại màn list order, select 2 order. Click "Export order". Select export order theo "Selected order" 
    > Click "Export to file"> Kiểm tra file export`, async () => {
      await orderPage.selectOrders(2);
      await orderPage.genLoc(orderPage.xpathBtnWithLabel("Export order")).click();
      const file = await orderPage.exportOrderWithOption("Selected 2 orders");
      let ids = await orderAPI.getIdsOfOrderList();
      ids = [ids[0], ids[1]];
      expect(await orderPage.compareOrderIdWithCSV(file, ids)).toBeTruthy();
    });

    await test.step(`Tại màn list order, search order name> Click "Export order". Select export order theo "Current search "
    > Click "Export to file"> Kiểm tra file export`, async () => {
      const paramRequest = conf.caseConf.param_search;
      await orderPage.searchOrderDashboard(paramRequest.search_keyword);
      await orderPage.genLoc(orderPage.xpathBtnWithLabel("Export order")).click();
      const file = await orderPage.exportOrderWithOption("Current search");
      const ids = await orderAPI.getIdsOfOrderList(paramRequest);
      expect(await orderPage.compareOrderIdWithCSV(file, ids)).toBeTruthy();
    });
  });
});
