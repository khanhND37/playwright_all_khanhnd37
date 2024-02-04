import { expect } from "@core/fixtures";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";
import type { Inventory } from "@types";
import { OdooService } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import type { ShippingAddress } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";

let domain: string;
let plusHubAPI: PlusHubAPI;
let orderPage: OrdersPage;
let quantityPurchaseBefore: number;
let quantityPurchaseAfter: number;
let stockPickingIdBefore: number;
let stockPickingIdAfter: number;
let stockPickingIdAfterCheckout: number;
let quantityIncommingBefore: number;
let quantityIncommingAfter: number;
let purchaseQuantity: number;
let dataInventory: Inventory;
let dataInventoryAfterPurchased: Inventory;
let dataInventoryAfter: Inventory;
let productID: number;
let deliveryOrder;
let doInState: string;
let quantityAvailableStockBefore: number;
let stockPickingId: number;
let moveLineId: number[][];
let actualPaymentStatus;
let qtyDoneDoIn: number;
let quantityAvailableStockAfter: number;
let qtyCheckout: number;
let orderName: string;
let orderId: number;
let doOutState: string;
let qtyDoneDoOut: number;
let quantityAvailableStockAfterDoneDoOut: number;
let quantityFulfilledAfterDoneDoOut: number;
let quantityFulfillBefore: number;
let checkoutAPI: CheckoutAPI;
let productName: string;
let quantityUnfulfillBefore: number;
let quantityUnfulfillAfter: number;
let productHanle: string;
let homepage: SFHome;
let productSF: SFProduct;
let checkout: SFCheckout;
let shippingAddress: ShippingAddress;
let fulfillmentPage: FulfillmentPage;
let maxRetry: number;

test.describe("Warehouse in PlusHub", async () => {
  test.beforeEach(async ({ dashboard, conf, authRequest, odoo }) => {
    domain = conf.suiteConf.domain;
    maxRetry = conf.suiteConf.max_retry;
    plusHubAPI = new PlusHubAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    fulfillmentPage = new FulfillmentPage(dashboard, conf.suiteConf.domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest);
    purchaseQuantity = conf.caseConf?.data_purchase?.purchases[0].quantity;
    productID = conf.caseConf?.data_purchase?.purchases[0].product_template_id;
    productName = conf.caseConf.product_name;
    shippingAddress = conf.suiteConf.shipping_address;
    deliveryOrder = OdooService(odoo);
  });

  test(`Verify data product ở tab Inventory @SB_RLSBFF_PLH_WH_3`, async ({ conf }) => {
    await test.step(`Vào PlusHub > Find product > Mở SO detail > Input quantity purchase > Click purchase > Pay now`, async () => {
      const dataPurchase = conf.caseConf.data_purchase;
      const dataInvoice = conf.suiteConf.data_invoice;

      // Get data tab Purchased berfore purchase
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID);
      quantityPurchaseBefore = dataInventory.purchased;

      // Get data tab Incomming before purchase
      quantityIncommingBefore = dataInventory.incoming;

      const purchaseOrderId = await plusHubAPI.getPurchaseOrderId(dataPurchase);
      dataInvoice.custom_id = `sbcn_order_${purchaseOrderId}`;
      dataInvoice.metadata.sbcn_draft_order_id = purchaseOrderId;
      dataInvoice.amount_cent = conf.caseConf.data_invoice.amount_cent;
      await plusHubAPI.payPurchaseOrder(dataInvoice);
      await plusHubAPI.cancelSBCNDraffOrder(purchaseOrderId);
    });

    await test.step(`Click btn View available stocks > Verify data product tại tab inventory`, async () => {
      // Get data tab Purchased after purchase
      dataInventoryAfterPurchased = await plusHubAPI.getValueInventoryPurchase(productID, dataInventory);
      quantityPurchaseAfter = dataInventoryAfterPurchased.purchased;
      expect(quantityPurchaseAfter).toEqual(quantityPurchaseBefore + purchaseQuantity);

      // Get data tab Incomming after purchase
      quantityIncommingAfter = dataInventoryAfterPurchased.incoming;
      expect(quantityIncommingAfter).toEqual(quantityIncommingBefore + purchaseQuantity);
    });
  });

  test(`Verify data product ở tab Inventory khi done DO in @SB_RLSBFF_PLH_WH_4`, async () => {
    await test.step(`Vào odoo > Inventory > Receipts > Search product name > Click DO in detail > Done DO in của product `, async () => {
      // Get data tab Incomming before done Do in
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID);
      quantityIncommingBefore = dataInventory.incoming;

      // Get data tab Available stock before done Do in
      quantityAvailableStockBefore = dataInventory.available_stock;

      // Go to warehouse, search product and get stock picking id
      stockPickingId = await plusHubAPI.getStockPickingIdByApi({ product_warehouse: productName });
      doInState = await deliveryOrder.getStockPickingState(stockPickingId);
      expect(doInState).toEqual("assigned");
      await deliveryOrder.doneStockPicking(stockPickingId);
      doInState = await deliveryOrder.getStockPickingState(stockPickingId);
      expect(doInState).toEqual("done");
    });

    await test.step(`Vào shop Sbase > PlusHub > Warehouse > Search product name > Verify data product tại tab Inventory`, async () => {
      moveLineId = await deliveryOrder.getMoveLineId(stockPickingId);
      qtyDoneDoIn = await deliveryOrder.getQuantityDone(moveLineId[0][0]);

      // Get data tab Incomming after done Do in

      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID, dataInventory);
      quantityIncommingAfter = dataInventory.incoming;
      expect(quantityIncommingAfter).toEqual(quantityIncommingBefore - qtyDoneDoIn[0]);

      // Get data tab Available stock after done Do in
      quantityAvailableStockAfter = dataInventory.available_stock;
      expect(quantityAvailableStockAfter).toEqual(quantityAvailableStockBefore + qtyDoneDoIn[0]);
    });
  });

  test(`Verify data product ở tab Inventory khi fulfill order mà quantity của order < quantity product @SB_RLSBFF_PLH_WH_5`, async ({
    conf,
    page,
  }) => {
    await test.step(`Purchase product > Done Do in`, async () => {
      const dataPurchase = conf.caseConf.data_purchase;
      const dataInvoice = conf.suiteConf.data_invoice;
      homepage = new SFHome(page, domain);

      // Get data tab Awaiting stock before
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID);

      // Get data tab Availabel stock before
      quantityAvailableStockBefore = dataInventory.available_stock;

      // Get data tab Unfulfill before
      quantityFulfillBefore = dataInventory.fulfilled;

      // Get stock picking ID before purchase
      stockPickingIdBefore = await plusHubAPI.getStockPickingIdByApi({ product_warehouse: productName });

      // Purchase order
      const purchaseOrderId = await plusHubAPI.getPurchaseOrderId(dataPurchase);
      dataInvoice.custom_id = `sbcn_order_${purchaseOrderId}`;
      dataInvoice.metadata.sbcn_draft_order_id = purchaseOrderId;
      dataInvoice.amount_cent = conf.caseConf.data_invoice.amount_cent;
      await plusHubAPI.payPurchaseOrder(dataInvoice);
      await plusHubAPI.cancelSBCNDraffOrder(purchaseOrderId);

      // Get stock picking ID after purchase
      stockPickingIdAfter = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: productName,
        stock_picking_id_before: stockPickingIdBefore,
        is_stock_picking_id_before: true,
      });

      // Done Do in
      doInState = await deliveryOrder.getStockPickingState(stockPickingIdAfter, "assigned", 20);
      expect(doInState).toEqual("assigned");
      await deliveryOrder.doneStockPicking(stockPickingIdAfter);
      doInState = await deliveryOrder.getStockPickingState(stockPickingIdAfter);
      expect(doInState).toEqual("done");

      // Get data tab Available stock after done Do in
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID, dataInventory);
      quantityAvailableStockAfter = dataInventory.available_stock;
      expect(quantityAvailableStockAfter).toEqual(
        quantityAvailableStockBefore + conf.caseConf.data_purchase.purchases[0].quantity,
      );
      qtyCheckout = conf.caseConf.data_purchase.purchases[0].quantity - 1;
    });

    await test.step(`Checkout product`, async () => {
      productHanle = conf.caseConf.product_handle;
      await homepage.gotoHomePage();
      productSF = await homepage.gotoProductDetailByHandle(productHanle, productName);
      await productSF.inputQuantityProduct(qtyCheckout);
      await productSF.addProductToCart();
      checkout = await productSF.navigateToCheckoutPage();
      await checkout.enterShippingAddress(shippingAddress);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod("Stripe");
      orderName = await checkout.getOrderName();
      orderId = await checkout.getOrderIdBySDK();

      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Paid");
    });

    await test.step(`Vào order detail > Click btn Fulfill with > Select PlusHub > Click btn Fulfill selected order `, async () => {
      // Get data tab Fulfilled before ff order
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID);
      quantityUnfulfillBefore = dataInventory.wait_to_fulfill;

      await orderPage.fulfillWithFulfillmentService("PlusHub");
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.purchaseInPopUpReview();
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Processing", maxRetry)).toEqual(true);
    });

    await test.step(`Vào odoo > Done Do out > Vào shop Sbase > Verify lại data product tại tab Inventory`, async () => {
      const stockPickingIdDoOut = await deliveryOrder.getStockPickingId(orderName, "out", conf.suiteConf.owner_id, 20);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      expect(doOutState).toEqual("assigned");
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      await deliveryOrder.doneStockPicking(stockPickingIdDoOut);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      expect(doOutState).toEqual("done");
      moveLineId = await deliveryOrder.getMoveLineId(stockPickingIdDoOut);
      qtyDoneDoOut = await deliveryOrder.getQuantityDone(moveLineId[0][0]);

      // Get data tab Available stock after done Do out
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID, dataInventory);
      quantityAvailableStockAfterDoneDoOut = dataInventory.available_stock;
      expect(quantityAvailableStockAfterDoneDoOut).toEqual(quantityAvailableStockAfter - qtyDoneDoOut[0]);

      // Get quantity tab Fulfilled after done Do  out
      quantityFulfilledAfterDoneDoOut = dataInventory.fulfilled;
      expect(quantityFulfilledAfterDoneDoOut).toEqual(quantityFulfillBefore + qtyDoneDoOut[0]);

      // Get quantity tab Unfulfilled after done Do out
      quantityUnfulfillAfter = dataInventory.wait_to_fulfill;
      expect(quantityUnfulfillAfter).toEqual(quantityUnfulfillBefore - qtyCheckout);
    });
  });

  test(`Verify data product ở tab Inventory khi fulfill order mà quantity của order > quantity product @SB_RLSBFF_PLH_WH_7`, async ({
    conf,
    page,
  }) => {
    await test.step(`Purchase product > Done Do in`, async () => {
      const dataPurchase = conf.caseConf.data_purchase;
      const dataInvoice = conf.suiteConf.data_invoice;
      homepage = new SFHome(page, domain);

      // Get data tab Awaiting stock before
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID);

      // Get data tab Availabel stock before
      quantityAvailableStockBefore = dataInventory.available_stock;

      // Get data tab Unfulfill before
      quantityFulfillBefore = dataInventory.fulfilled;

      // Get stock picking ID before purchase
      stockPickingIdBefore = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: productName,
      });

      // Purchase order
      const purchaseOrderId = await plusHubAPI.getPurchaseOrderId(dataPurchase);
      dataInvoice.custom_id = `sbcn_order_${purchaseOrderId}`;
      dataInvoice.metadata.sbcn_draft_order_id = purchaseOrderId;
      dataInvoice.amount_cent = conf.caseConf.data_invoice.amount_cent;
      await plusHubAPI.payPurchaseOrder(dataInvoice);
      await plusHubAPI.cancelSBCNDraffOrder(purchaseOrderId);

      // Get stock picking ID after purchase
      stockPickingIdAfter = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: productName,
        stock_picking_id_before: stockPickingIdBefore,
        is_stock_picking_id_before: true,
      });

      // Done Do in
      doInState = await deliveryOrder.getStockPickingState(stockPickingIdAfter, "assigned", 20);
      expect(doInState).toEqual("assigned");
      await deliveryOrder.doneStockPicking(stockPickingIdAfter);
      doInState = await deliveryOrder.getStockPickingState(stockPickingIdAfter);
      expect(doInState).toEqual("done");

      // Get data tab Available stock after done Do in
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID);
      quantityAvailableStockAfter = dataInventory.available_stock;
      qtyCheckout = quantityAvailableStockAfter + 1;
    });

    await test.step(`Checkout product`, async () => {
      productHanle = conf.caseConf.product_handle;
      await homepage.gotoHomePage();
      productSF = await homepage.gotoProductDetailByHandle(productHanle, productName);
      await productSF.inputQuantityProduct(qtyCheckout);
      await productSF.addProductToCart();
      checkout = await productSF.navigateToCheckoutPage();
      await checkout.enterShippingAddress(shippingAddress);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod("Stripe");
      orderName = await checkout.getOrderName();
      orderId = await checkout.getOrderIdBySDK();

      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Paid");
    });

    await test.step(`Vào shop Sbase > Đi đến order detail > Click btn Fulfill with > Select PlusHub > Click btn Fulfill selected order `, async () => {
      // Get data tab Fulfilled before ff order
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID);
      quantityUnfulfillBefore = dataInventory.wait_to_fulfill;

      // Fulfill order
      await orderPage.fulfillWithFulfillmentService("PlusHub");
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.purchaseInPopUpReview();
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Awaiting stock", maxRetry)).toEqual(true);
    });

    await test.step(`Vào odoo > Inventory > Done Do in`, async () => {
      // Get stock picking after checkout
      stockPickingIdAfterCheckout = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: productName,
        stock_picking_id_before: stockPickingIdAfter,
        is_stock_picking_id_before: true,
      });

      // Done Do in
      doInState = await deliveryOrder.getStockPickingState(stockPickingIdAfterCheckout, "assigned", 20);
      expect(doInState).toEqual("assigned");
      await deliveryOrder.doneStockPicking(stockPickingIdAfterCheckout);
      doInState = await deliveryOrder.getStockPickingState(stockPickingIdAfterCheckout);
      expect(doInState).toEqual("done");
    });

    await test.step(`Vào odoo > Done Do out > Vào shop SB > Verify lại data product tại tab Inventory`, async () => {
      const stockPickingIdDoOut = await deliveryOrder.getStockPickingId(orderName, "out", conf.suiteConf.owner_id, 15);
      await deliveryOrder.checkAvailabilityStockPicking(stockPickingIdDoOut);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      expect(doOutState).toEqual("assigned");
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      await deliveryOrder.doneStockPicking(stockPickingIdDoOut);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingIdDoOut);
      expect(doOutState).toEqual("done");
      moveLineId = await deliveryOrder.getMoveLineId(stockPickingIdDoOut);
      qtyDoneDoOut = await deliveryOrder.getQuantityDone(moveLineId[0][0]);

      // Get data tab Available stock after done Do out
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID, dataInventory);

      // Get quantity tab Fulfilled after done Do  out
      quantityFulfilledAfterDoneDoOut = dataInventory.fulfilled;
      expect(quantityFulfilledAfterDoneDoOut).toEqual(quantityFulfillBefore + qtyDoneDoOut[0]);

      // Get quantity tab Unfulfilled after done Do out
      quantityUnfulfillAfter = dataInventory.wait_to_fulfill;
      expect(quantityUnfulfillAfter).toEqual(quantityUnfulfillBefore - qtyCheckout);
    });
  });

  test(`Verify data product ở tab Inventory khi có order nhưng chưa fulfill @SB_RLSBFF_PLH_WH_8`, async ({ conf }) => {
    await test.step(`Checkout product`, async () => {
      dataInventory = await plusHubAPI.getValueInventoryPurchase(productID);
      quantityUnfulfillBefore = dataInventory.wait_to_fulfill;
      const infoProduct = conf.caseConf.info_product;
      const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard(infoProduct);
      orderName = checkoutInfo.order.name;
      orderId = checkoutInfo.order.id;
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Paid");
    });

    await test.step(`Vào shop SB > Warehouse > Search product > Verify data product tại tab Inventory `, async () => {
      dataInventoryAfter = await plusHubAPI.getValueInventoryPurchase(productID, dataInventory);
      quantityUnfulfillAfter = dataInventoryAfter.wait_to_fulfill;
      expect(quantityUnfulfillAfter).toEqual(quantityUnfulfillBefore + conf.caseConf.quantity_checkout);
    });
  });
});
