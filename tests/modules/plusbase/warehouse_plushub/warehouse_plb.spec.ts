import { expect } from "@core/fixtures";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";
import type { DataOrderToFulfill, FixtureApiResponse, Inventory, SbOrders } from "@types";
import { OdooService } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import type { ProductMappingInfo } from "@types";
import type { SbRlsbffRlsbffWarehouse2, Dev } from "./warehouse_plb";
import { OrdersPage } from "@pages/dashboard/orders";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { DashboardPage } from "@pages/dashboard/dashboard";

let domain: string;
let plusHubAPI: PlusHubAPI;
let stockPickingIdAfter: number;
let dataInventory: Inventory;
let dataInventoryAfterPurchase: Inventory;
let dataInventoryAfterDoneDoIn: Inventory;
let dataInventoryAfterDoneDoOut: Inventory;
let dataInventoryAfterApproveOrder: Inventory;
let dataInventoryAfterFulfillOrder: Inventory;
let dataInventoryAfterCheckAvailability: Inventory;
let dataInventoryBefore: Inventory;
let dataInventoryAfter: Inventory;
let deliveryOrder;
let doInState: string;
let moveLineId: number[][];
let orderName: string;
let orderId: number;
let dataOrders: FixtureApiResponse<SbOrders>;
let doOutState: string;
let qtyDoneDoOut: number;
let plusbaseOrderAPI: PlusbaseOrderAPI;
let stockPickingIdBefore: number;
let productHanle: string;
let productSF: SFProduct;
let checkout: SFCheckout;
let orderInfo: DataOrderToFulfill;
let productInfo: ProductMappingInfo;
let lineItemId: number[];
let lineItemIdFoReplace: number;

test.describe("Warehouse in Plusbase", async () => {
  test.beforeEach(async ({ conf, authRequest, odoo }) => {
    domain = conf.suiteConf.domain;
    plusHubAPI = new PlusHubAPI(domain, authRequest);
    plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);
    deliveryOrder = OdooService(odoo);
  });

  test(`@SB_RLSBFF_RLSBFF-Warehouse_21 Verify data product tại tab Inventory trong trường hợp product đã có tồn tại Warehouse`, async ({
    page,
    conf,
    dashboard,
    cConf,
  }) => {
    const caseConf = cConf as SbRlsbffRlsbffWarehouse2;
    const suiteConf = conf.suiteConf as Dev;
    const envCaseConf = suiteConf.cases["SB_RLSBFF_RLSBFF-Warehouse_21"];

    await test.step(`Login shop template > Search product A  > Click SO detail `, async () => {
      // Get data Inventory before
      dataInventory = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.data_purchase.purchases[0].product_template_id,
      );

      // Get stock picking ID before purchase
      stockPickingIdBefore = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: caseConf.product_name,
        is_stock_picking_id_before: false,
      });

      // Purchased  order
      const dataPurchase = envCaseConf.data_purchase;
      await plusHubAPI.getPurchaseOrderId(dataPurchase);
    });

    await test.step(`Vào Warehouse > Search product > Verify data product tại tab Inventory`, async () => {
      // Get data Purchased after
      dataInventoryAfterPurchase = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.data_purchase.purchases[0].product_template_id,
        dataInventory,
      );
      expect(dataInventoryAfterPurchase.purchased).toEqual(
        dataInventory.purchased + envCaseConf.data_purchase.purchases[0].quantity,
      );

      // Get data Incomming after
      expect(dataInventoryAfterPurchase.incoming).toEqual(
        dataInventory.incoming + envCaseConf.data_purchase.purchases[0].quantity,
      );
    });

    await test.step(`Vào odoo > Inventory > Receipts > Search product > Click Do in detail > Validate 
    > Vào shop template > Warehouse > Search product > Verify data product tại tab Inventory`, async () => {
      // Get stock picking ID after purchase
      stockPickingIdAfter = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: caseConf.product_name,
        stock_picking_id_before: stockPickingIdBefore,
        is_stock_picking_id_before: true,
      });

      // Done Do in
      doInState = await deliveryOrder.getStockPickingState(stockPickingIdAfter, "assigned", 20);
      expect(doInState).toEqual("assigned");
      await deliveryOrder.doneStockPicking(stockPickingIdAfter);
      doInState = await deliveryOrder.getStockPickingState(stockPickingIdAfter);
      expect(doInState).toEqual("done");

      // Get data Incomming after done Do in
      dataInventoryAfterDoneDoIn = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.data_purchase.purchases[0].product_template_id,
        dataInventoryAfterPurchase,
      );
      expect(dataInventoryAfterDoneDoIn.incoming).toEqual(
        dataInventoryAfterPurchase.incoming - envCaseConf.data_purchase.purchases[0].quantity,
      );

      // Get data Available stock after done Do in
      expect(dataInventoryAfterDoneDoIn.available_stock).toEqual(
        dataInventory.available_stock + envCaseConf.data_purchase.purchases[0].quantity,
      );
    });

    await test.step(`Checkout product > Vào shop template approve order > Verify data product tại Inventory sau khi checkout`, async () => {
      // Checkout order
      const homepage = new SFHome(page, conf.suiteConf.shop_plusbase);
      productHanle = conf.caseConf.product_handle;
      await homepage.gotoHomePage();
      productSF = await homepage.gotoProductDetailByHandle(productHanle, caseConf.product_name);
      await productSF.inputQuantityProduct(caseConf.quantity_checkout);
      await productSF.addProductToCart();
      checkout = await productSF.navigateToCheckoutPage();
      await checkout.enterShippingAddress(suiteConf.shipping_address);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod("Stripe");
      orderName = await checkout.getOrderName();
      orderId = await checkout.getOrderIdBySDK();

      // Approve order
      const orders = new OrdersPage(dashboard, domain);
      await orders.goToOrderStoreTemplateByOrderId(orderId);
      await orders.waitForProfitCalculated();
      await plusbaseOrderAPI.approveOrderByApi(orderId);

      // Get data tab Unfulfilled after approve order
      dataInventoryAfterApproveOrder = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.data_purchase.purchases[0].product_template_id,
        dataInventoryAfterDoneDoIn,
      );
      expect(dataInventoryAfterApproveOrder.wait_to_fulfill).toEqual(
        dataInventory.wait_to_fulfill + caseConf.quantity_checkout,
      );
    });

    await test.step(`Vào shop template > Fulfill order > Verify data product tại Inventory sau khi fulfill order`, async () => {
      const dashboardPage = new DashboardPage(dashboard, domain);
      const fulfillmentPage = new FulfillmentPage(dashboard, domain);
      dataOrders = await plusbaseOrderAPI.searchOrders({
        search_keyword: orderName,
      });
      lineItemId = dataOrders.data.orders[0].line_items.map(lineitem => lineitem.id);
      envCaseConf.data.orders[0].line_item_ids[0] = lineItemId[0];
      envCaseConf.data.orders[1].line_items[0].id = lineItemId[0];
      await plusHubAPI.searchFulfillOrders({
        search_keyword: orderName,
        search_option: "order_name",
        tab: "ready_to_fulfill",
        tab_name: "ready_to_fulfill",
      });
      await plusHubAPI.selectOrderToFulfill(orderInfo);
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusBase();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Processing", 20)).toEqual(true);

      // Get data Available stock after fulfill order
      dataInventoryAfterFulfillOrder = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.data_purchase.purchases[0].product_template_id,
        dataInventoryAfterApproveOrder,
      );
      expect(dataInventoryAfterFulfillOrder.available_stock).toEqual(
        dataInventoryAfterDoneDoIn.available_stock - caseConf.quantity_checkout,
      );

      // Get data Unfulfill after fulfill order
      expect(dataInventoryAfterFulfillOrder.wait_to_fulfill).toEqual(
        dataInventoryAfterApproveOrder.wait_to_fulfill - caseConf.quantity_checkout,
      );

      // Get data processing after fulfill order
      expect(dataInventoryAfterFulfillOrder.processing).toEqual(dataInventory.processing + caseConf.quantity_checkout);
    });

    await test.step(`Vào lại Odoo > Done Do out > Vào warehouse verify data product sau khi done Do out `, async () => {
      const stockPickingIdDoOut = await deliveryOrder.getStockPickingId(orderName, "out", conf.suiteConf.owner_id, 20);
      await deliveryOrder.checkAvailabilityStockPicking(stockPickingIdDoOut);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      expect(doOutState).toEqual("assigned");
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      await deliveryOrder.doneStockPicking(stockPickingIdDoOut);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      expect(doOutState).toEqual("done");
      moveLineId = await deliveryOrder.getMoveLineId(stockPickingIdDoOut);
      qtyDoneDoOut = await deliveryOrder.getQuantityDone(moveLineId[0][0]);

      // Get data processing after done Do out
      dataInventoryAfterDoneDoOut = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.data_purchase.purchases[0].product_template_id,
        dataInventoryAfterFulfillOrder,
      );
      expect(dataInventoryAfterDoneDoOut.processing).toEqual(
        dataInventoryAfterFulfillOrder.processing - qtyDoneDoOut[0],
      );

      // Get data Fulfilled after done Do out
      expect(dataInventoryAfterDoneDoOut.fulfilled).toEqual(dataInventory.fulfilled + qtyDoneDoOut[0]);
    });
  });

  test(`@SB_RLSBFF_RLSBFF-Warehouse_22 Verify data product tại tab Inventory trong trường hợp product chưa có tồn tại Warehouse`, async ({
    page,
    conf,
    dashboard,
    cConf,
  }) => {
    const caseConf = cConf as SbRlsbffRlsbffWarehouse2;
    const suiteConf = conf.suiteConf as Dev;
    const envCaseConf = suiteConf.cases["SB_RLSBFF_RLSBFF-Warehouse_22"];
    await test.step(`Checkout product > Login shop template > Orders > Search order > Đi đến order detail > More actions > Approve order`, async () => {
      // Get stock picking ID before purchase
      stockPickingIdBefore = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: caseConf.product_name,
        is_stock_picking_id_before: false,
      });
      // Get data product before
      dataInventory = await plusHubAPI.getValueInventoryPurchase(envCaseConf.product_template_id);

      // Checkout order
      const homepage = new SFHome(page, suiteConf.shop_plusbase);
      productHanle = conf.caseConf.product_handle;
      await homepage.gotoHomePage();
      productSF = await homepage.gotoProductDetailByHandle(productHanle, caseConf.product_name);
      await productSF.inputQuantityProduct(caseConf.quantity_checkout);
      await productSF.addProductToCart();
      checkout = await productSF.navigateToCheckoutPage();
      await checkout.enterShippingAddress(suiteConf.shipping_address);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod("Stripe");
      orderName = await checkout.getOrderName();
      orderId = await checkout.getOrderIdBySDK();

      // Approve order
      const orders = new OrdersPage(dashboard, domain);
      await orders.goToOrderStoreTemplateByOrderId(orderId);
      await orders.waitForProfitCalculated();
      await plusbaseOrderAPI.approveOrderByApi(orderId);
    });

    await test.step(`Vào warehouse > Search product > Verify data product tại tab Inventory`, async () => {
      // Get data Unfulfilled after approve order
      dataInventoryAfterApproveOrder = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.product_template_id,
        dataInventory,
      );
      expect(dataInventoryAfterApproveOrder.wait_to_fulfill).toEqual(
        dataInventory.wait_to_fulfill + caseConf.quantity_checkout,
      );
    });

    await test.step(`Vào Fulfillment > Plushub > Fulfillment >  Search order > Fulfill order > Vào warehoue, verify data product tại Inventory sau khi Fulfill order`, async () => {
      const dashboardPage = new DashboardPage(dashboard, domain);
      const fulfillmentPage = new FulfillmentPage(dashboard, domain);
      // Fulfill order
      dataOrders = await plusbaseOrderAPI.searchOrders({
        search_keyword: orderName,
      });
      lineItemId = dataOrders.data.orders[0].line_items.map(lineitem => lineitem.id);
      envCaseConf.data.orders[0].line_item_ids[0] = lineItemId[0];
      envCaseConf.data.orders[1].line_items[0].id = lineItemId[0];
      await plusHubAPI.searchFulfillOrders({
        search_keyword: orderName,
        search_option: "order_name",
        tab: "ready_to_fulfill",
        tab_name: "ready_to_fulfill",
      });
      await plusHubAPI.selectOrderToFulfill(orderInfo);
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusBase();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Awaiting stock", 20)).toEqual(true);

      // Get data Purchased after fulfill order
      dataInventoryAfterFulfillOrder = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.product_template_id,
        dataInventoryAfterApproveOrder,
      );
      expect(dataInventoryAfterFulfillOrder.purchased).toEqual(dataInventory.purchased + caseConf.quantity_checkout);

      // Get data Incomming after fulfill order
      expect(dataInventoryAfterFulfillOrder.incoming).toEqual(dataInventory.incoming + caseConf.quantity_checkout);

      // Get data Awaiting stock after fulfill order
      expect(dataInventoryAfterFulfillOrder.awaiting_stock).toEqual(
        dataInventory.awaiting_stock + caseConf.quantity_checkout,
      );
    });

    await test.step(`Vào odoo > Done Do in > Vào shop template, verify data product tại Inventory`, async () => {
      // Get stock picking id
      const stockPickingId = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: caseConf.product_name,
        stock_picking_id_before: stockPickingIdBefore,
        is_stock_picking_id_before: true,
      });
      // Done Do in
      doInState = await deliveryOrder.getStockPickingState(stockPickingId, "assigned", 20);
      expect(doInState).toEqual("assigned");
      await deliveryOrder.doneStockPicking(stockPickingId);
      doInState = await deliveryOrder.getStockPickingState(stockPickingId);
      expect(doInState).toEqual("done");

      // Get data Incomming after done Do in
      dataInventoryAfterDoneDoIn = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.product_template_id,
        dataInventoryAfterFulfillOrder,
      );
      expect(dataInventoryAfterDoneDoIn.incoming).toEqual(
        dataInventoryAfterFulfillOrder.incoming - caseConf.quantity_checkout,
      );

      // Get data Available stock after done Do in
      expect(dataInventoryAfterDoneDoIn.available_stock).toEqual(
        dataInventory.available_stock + caseConf.quantity_checkout,
      );

      // Get data Unfulfilled after done Do in
      expect(dataInventoryAfterDoneDoIn.wait_to_fulfill).toEqual(
        dataInventoryAfterApproveOrder.wait_to_fulfill - caseConf.quantity_checkout,
      );
    });

    await test.step(`Vào odoo > Check availability Do out > Vào shop template, verify data product tại tab Inventory`, async () => {
      const dashboardPage = new DashboardPage(dashboard, domain);
      const fulfillmentPage = new FulfillmentPage(dashboard, domain);
      // Check availability Do out
      const stockPickingIdDoOut = await deliveryOrder.getStockPickingId(orderName, "out", conf.suiteConf.owner_id, 20);
      await deliveryOrder.checkAvailabilityStockPicking(stockPickingIdDoOut);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      expect(doOutState).toEqual("assigned");
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusBase();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Processing", 20)).toEqual(true);

      // Get data Available stock after check availability
      dataInventoryAfterCheckAvailability = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.product_template_id,
        dataInventoryAfterDoneDoIn,
      );
      expect(dataInventoryAfterCheckAvailability.available_stock).toEqual(
        dataInventoryAfterDoneDoIn.available_stock - caseConf.quantity_checkout,
      );

      // Get data Processing after check availability
      expect(dataInventoryAfterCheckAvailability.processing).toEqual(
        dataInventory.processing + caseConf.quantity_checkout,
      );
    });

    await test.step(`Vào Odoo > Done Do out > Vào shop template, verify data product tại tab Inventory`, async () => {
      // Done Do out
      const stockPickingIdDoOut = await deliveryOrder.getStockPickingId(orderName, "out", conf.suiteConf.owner_id, 20);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      await deliveryOrder.doneStockPicking(stockPickingIdDoOut);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      expect(doOutState).toEqual("done");
      moveLineId = await deliveryOrder.getMoveLineId(stockPickingIdDoOut);
      qtyDoneDoOut = await deliveryOrder.getQuantityDone(moveLineId[0][0]);

      // Get data Processing after done Do out
      dataInventoryAfterDoneDoOut = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.product_template_id,
        dataInventoryAfterCheckAvailability,
      );
      expect(dataInventoryAfterDoneDoOut.processing).toEqual(
        dataInventoryAfterCheckAvailability.processing - qtyDoneDoOut[0],
      );

      // Get data Fulfill after done Do out
      expect(dataInventoryAfterDoneDoOut.fulfilled).toEqual(dataInventory.fulfilled + qtyDoneDoOut[0]);
    });
  });

  test(`@SB_RLSBFF_RLSBFF-Warehouse_23 Verify replace warehouse item khi không tick chọn Replace for all current orders`, async ({
    page,
    conf,
    dashboard,
    cConf,
  }) => {
    const caseConf = cConf as SbRlsbffRlsbffWarehouse2;
    const suiteConf = conf.suiteConf as Dev;
    const envCaseConf = suiteConf.cases["SB_RLSBFF_RLSBFF-Warehouse_23"];
    await test.step(`Vào Fulfillment > Plushub > Fulfillment > Search order vừa check out > Click btn Replace warehouse item > Search and select product 2
    > Click btn Replace warehouse item`, async () => {
      // Get data Inventory of product mapping before replace
      dataInventoryBefore = await plusHubAPI.getValueInventoryPurchase(envCaseConf.new_product_info.product_id);

      // Checkout order
      const homepage = new SFHome(page, suiteConf.shop_plusbase);
      await homepage.gotoHomePage();
      productSF = await homepage.gotoProductDetailByHandle(caseConf.product_handle, caseConf.product_name);
      await productSF.inputQuantityProduct(caseConf.quantity_checkout);
      await productSF.addProductToCart();
      checkout = await productSF.navigateToCheckoutPage();
      await checkout.enterShippingAddress(suiteConf.shipping_address);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod("Stripe");
      orderName = await checkout.getOrderName();
      orderId = await checkout.getOrderIdBySDK();

      // Approve order
      const orders = new OrdersPage(dashboard, domain);
      await orders.goToOrderStoreTemplateByOrderId(orderId);
      await orders.waitForProfitCalculated();
      await plusbaseOrderAPI.approveOrderByApi(orderId);

      // Replace warehouse item
      dataOrders = await plusbaseOrderAPI.searchOrders({
        search_keyword: orderName,
      });
      lineItemIdFoReplace = dataOrders.data.orders[0].line_items[0].id;
      envCaseConf.new_product_info.line_item_id = lineItemIdFoReplace;
      await plusHubAPI.replaceWarehouseItem(envCaseConf.new_product_info);
    });

    await test.step(`Vào Warehouse > Search product vừa được mapping > Verify data product`, async () => {
      const dataReplaceWarehouse = conf.caseConf.replace_warehouse_data;
      const actReplaceWarehouseData = await plusHubAPI.getReplaceWarehouseData(orderId, 10);
      expect(dataReplaceWarehouse).toEqual(actReplaceWarehouseData);
      dataInventoryAfter = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.new_product_info.product_id,
        dataInventoryBefore,
      );
      expect(dataInventoryAfter.wait_to_fulfill).toEqual(
        dataInventoryBefore.wait_to_fulfill + caseConf.quantity_checkout,
      );
    });
  });

  test(`@SB_RLSBFF_RLSBFF-Warehouse_24 Verify replace warehouse item khi tick chọn Replace for all current orders`, async ({
    conf,
    page,
    dashboard,
    cConf,
  }) => {
    const caseConf = cConf as SbRlsbffRlsbffWarehouse2;
    const suiteConf = conf.suiteConf as Dev;
    const envCaseConf = suiteConf.cases["SB_RLSBFF_RLSBFF-Warehouse_24"];
    await test.step(`Vào Fulfillment > Plushub > Fulfillment > Search order vừa check out > Click btn Replace warehouse item > Search and select product 2`, async () => {
      // Get data Inventory of product mapping before replace
      dataInventoryBefore = await plusHubAPI.getValueInventoryPurchase(envCaseConf.new_product_info.product_id);

      // Checkout order
      const homepage = new SFHome(page, suiteConf.shop_plusbase);
      await homepage.gotoHomePage();
      productSF = await homepage.gotoProductDetailByHandle(caseConf.product_handle, caseConf.product_name);
      await productSF.inputQuantityProduct(caseConf.quantity_checkout);
      await productSF.addProductToCart();
      checkout = await productSF.navigateToCheckoutPage();
      await checkout.enterShippingAddress(suiteConf.shipping_address);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod("Stripe");
      orderName = await checkout.getOrderName();
      orderId = await checkout.getOrderIdBySDK();

      // Approve order
      const orders = new OrdersPage(dashboard, domain);
      await orders.goToOrderStoreTemplateByOrderId(orderId);
      await orders.waitForProfitCalculated();
      await plusbaseOrderAPI.approveOrderByApi(orderId);

      // Replace warehouse item
      dataOrders = await plusbaseOrderAPI.searchOrders({
        search_keyword: conf.caseConf.order_number_old,
      });
      lineItemId[0] = dataOrders.data.orders[0].line_items[0].id;
      envCaseConf.new_product_info.line_item_id = lineItemId[0];
      await plusHubAPI.replaceWarehouseItem(envCaseConf.new_product_info);
    });

    await test.step(`Vào Warehouse > Search product vừa được mapping > Verify data product`, async () => {
      const dataReplaceWarehouse = conf.caseConf.replace_warehouse_data;
      const actReplaceWarehouseData = await plusHubAPI.getReplaceWarehouseData(conf.caseConf.order_id_old, 10);
      expect(dataReplaceWarehouse).toEqual(actReplaceWarehouseData);
      dataInventoryAfter = await plusHubAPI.getValueInventoryPurchase(
        envCaseConf.new_product_info.product_id,
        dataInventoryBefore,
      );
      expect(dataInventoryAfter.wait_to_fulfill).toEqual(
        dataInventoryBefore.wait_to_fulfill + caseConf.quantity_checkout,
      );
    });

    await test.step(`Search order khác cùng checkout product 1 > Verify product trong order sau khi replace`, async () => {
      const dataOrder = await plusHubAPI.searchFulfillOrders({
        search_keyword: orderName,
        search_option: "order_name",
        tab: "ready_to_fulfill",
        tab_name: "ready_to_fulfill",
      });
      const productNameInOrderAfterReplace = dataOrder.data.orders[0].line_items[0].sourcing_product_title;
      expect(productNameInOrderAfterReplace).toEqual(conf.caseConf.product_replace_name);

      // Replace lại order
      const dataReplaceOrder = await plusbaseOrderAPI.searchOrders({
        search_keyword: conf.caseConf.order_number_old,
      });
      lineItemId[0] = dataReplaceOrder.data.orders[0].line_items[0].id;
      productInfo.line_item_id = lineItemId[0];
      await plusHubAPI.replaceWarehouseItem(productInfo);
    });
  });
});
