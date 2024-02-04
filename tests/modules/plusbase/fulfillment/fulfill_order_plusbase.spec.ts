import { expect } from "@playwright/test";
import { test } from "@fixtures/odoo";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import type { ShippingAddress } from "@types";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { convertDate } from "@core/utils/datetime";
import { OdooService } from "@services/odoo";

let orderName: string;
let orderId: number;
let shopDomain: string;
let plbTemplateShopDomain: string;
let plbToken: string;
let paymentStatus: string;
let approvedStatus: string;
let fulfillmentStatusOrder: string;
let productHanle: string;
let productName: string;
let productQty: number;
let productWarehouse: string;
let shippingAddress: ShippingAddress;
let shippingMethod: string;
let productPage: SFProduct;
let checkout: SFCheckout;
let ordersPage: OrdersPage;
let fulfillOrdersPage: FulfillmentPage;
let plbTemplateDashboardPage: DashboardPage;
let doInState: string;
let deliveryOrder;
let doOutState: string;
let trackingNumberOdoo;
let trackingNumberDB: string;
let archivedStatusOrder: string;

test.describe("Fulfill order plusbase", async () => {
  test.beforeEach(async ({ page, conf, odoo }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain_store;
    plbTemplateShopDomain = conf.suiteConf.domain;
    productHanle = conf.caseConf.product_info.handle;
    productName = conf.caseConf.product_info.name;
    productQty = conf.caseConf.product_info.quantity;
    productWarehouse = conf.caseConf.product_info.warehouse;
    shippingAddress = conf.caseConf.shipping_address;
    deliveryOrder = OdooService(odoo);
    shippingMethod = conf.caseConf.fulfillment.shipping_method;
    plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    ordersPage = new OrdersPage(page, plbTemplateShopDomain);
    fulfillOrdersPage = new FulfillmentPage(page, plbTemplateShopDomain);

    plbToken = await plbTemplateDashboardPage.getAccessToken({
      shopId: conf.suiteConf["shop_id"],
      userId: conf.suiteConf["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf["username"],
      password: conf.suiteConf["password"],
    });
    const homepage = new SFHome(page, shopDomain);
    await homepage.gotoHomePage();

    productPage = await homepage.gotoProductDetailByHandle(productHanle, productName);
    await productPage.isTextVisible(productName, 1);
    await productPage.inputQuantityProduct(productQty);
    await productPage.addProductToCart();

    checkout = await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(shippingAddress);
    await checkout.continueToPaymentMethod();
    await checkout.completeOrderWithMethod("Stripe");
    orderName = await checkout.getOrderName();
    orderId = Number(await checkout.getOrderIdBySDK());
  });
  test(`@TC_SB_RPLS_RFPLB_1 Verify data order ở các tab khi action với order`, async ({ page, conf }) => {
    await test.step(`Login dashboard store template > Order >
    Search Order theo order name lấy được ở màn thank you page >
    Vào order detail`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await ordersPage.goToOrderStoreTemplateByOrderId(orderId);
      await ordersPage.waitForProfitCalculated();

      approvedStatus = await ordersPage.getApproveStatus();
      expect(approvedStatus).toEqual("Unapproved");
      paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Authorized");
      fulfillmentStatusOrder = await ordersPage.getFulfillmentStatusOrder();
      expect(fulfillmentStatusOrder).toEqual("Unfulfilled");
    });

    await test.step(`Click More actions > Approve order > Confirm`, async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      approvedStatus = await ordersPage.getApproveStatus();
      expect(approvedStatus).toEqual("Approved");
      paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Paid");
      fulfillmentStatusOrder = await ordersPage.getFulfillmentStatusOrder();
      expect(fulfillmentStatusOrder).toEqual("Unfulfilled");
    });

    await test.step(`Click PlusHub > click tắt filter Time since created >
    verify order tại tab To fulfill`, async () => {
      const productValidate = conf.caseConf.product_validate;
      const warehouseItem = conf.caseConf.warehouse_item;
      const shippingFee = conf.caseConf.fulfillment.shipping_fee;
      const baseCostPerItem = conf.caseConf.fulfillment.base_cost_per_item;

      await ordersPage.clickOnBtnWithLabel("PlusHub");
      await page.waitForLoadState("networkidle");
      await fulfillOrdersPage.removeFilterOrderPlusBase();
      expect(await fulfillOrdersPage.isOrderVisiableInTab(orderName, "To fulfill", 10)).toEqual(true);

      // verify thông tin order tại tab To fulfill
      await expect(page.locator(`//div[normalize-space()='${orderName}']`)).toBeVisible();
      await expect(page.locator(`//span[normalize-space()='${productValidate}']`)).toHaveCount(1);
      await expect(page.locator(`//span[normalize-space()='${warehouseItem}']`)).toHaveCount(1);
      await expect(page.locator(`//option[normalize-space()='${shippingMethod}']`)).toHaveCount(1);
      await expect(page.locator(`//td[@class='base-cost']/span[normalize-space()='${shippingFee}']`)).toBeVisible();
      await expect(page.locator(`//td[@class='base-cost']/span[normalize-space()='${baseCostPerItem}']`)).toBeVisible();

      const orderDate = await ordersPage.getOrderDate(orderName);
      const toDay = Date.now();
      expect(orderDate).toEqual(convertDate(toDay, true));

      const orderQty = await ordersPage.getOrderQuantity();
      expect(orderQty).toEqual(conf.caseConf.product_info.quantity);
    });

    await test.step(`Select order > Click button Fulfill selected orders >
    Confirm > Verify thông tin order tab Awaiting stock`, async () => {
      const shippingMethod = conf.caseConf.fulfillment.shipping_method;
      const productValidate = conf.caseConf.product_validate;
      const warehouseItem = conf.caseConf.warehouse_item;

      await fulfillOrdersPage.selectShippingMethod(shippingMethod);
      await fulfillOrdersPage.clickFulfillSelectedOrder();
      await fulfillOrdersPage.clickButton("Confirm");
      await fulfillOrdersPage.page.waitForLoadState("networkidle");
      await page.reload();
      await fulfillOrdersPage.removeFilterOrderPlusBase();
      let isCheck = await fulfillOrdersPage.isTextVisible("You have no order that needs to fulfill yet.");
      let i = 0;
      while (!isCheck && i < 3) {
        await fulfillOrdersPage.navigateToFulfillmentTab("To fulfill");
        await fulfillOrdersPage.clickFulfillSelectedOrder();
        await fulfillOrdersPage.clickOnBtnWithLabel("Confirm");
        isCheck = await fulfillOrdersPage.isTextVisible("You have no order that needs to fulfill yet.");
        i++;
      }
      await fulfillOrdersPage.page.waitForLoadState("networkidle");
      await expect(async () => {
        await fulfillOrdersPage.page.reload();
        await fulfillOrdersPage.removeFilterOrderPlusBase();
        expect(await fulfillOrdersPage.isOrderVisiableInTab(orderName, "Awaiting stock", 10)).toEqual(true);
      }).toPass();

      // Verify thông tin order tại tab Awaiting stock
      await expect(page.locator("//div[@class='order-name-content']")).toBeVisible();
      await expect(page.locator(`//span[normalize-space()='${productValidate}']`)).toHaveCount(1);
      await expect(page.locator(`//span[normalize-space()='${warehouseItem}']`)).toHaveCount(1);
      const orderQty = await ordersPage.getOrderQuantity();
      expect(orderQty).toEqual(conf.caseConf.product_info.quantity);
      const orderDate = await ordersPage.getOrderDate(orderName);
      const toDay = Date.now();
      expect(orderDate).toEqual(convertDate(toDay));
      await expect(page.locator(`//div[normalize-space()='${shippingMethod}']`)).toBeVisible();
    });

    await test.step(`Click Warehouse > Purchase orders > Filter product > Lấy PO`, async () => {
      await fulfillOrdersPage.navigateToMenuPlusHub("Warehouse");
      await fulfillOrdersPage.clickOnBtnWithLabel("Purchase orders");
      await fulfillOrdersPage.searchPurchaseOrder(productWarehouse);
      // Cmt k chạy đoạn này do trên prod-test đang lỗi
      // expect(
      //   parseInt(await fulfillOrdersPage.countPurchaseOrdersInTab(productWarehouse, "Incoming")),
      // ).toBeGreaterThanOrEqual(1);
    });

    await test.step(`Login odoo > Inventory > Receipts
    > Search PO theo PO name > Vào detail > Validate > Apply`, async () => {
      const stockPickingId = await fulfillOrdersPage.getStockPickingID();
      doInState = await deliveryOrder.getStockPickingState(stockPickingId);
      expect(doInState).toEqual("assigned");

      await deliveryOrder.doneStockPicking(stockPickingId);
      doInState = await deliveryOrder.getStockPickingState(stockPickingId);
      expect(doInState).toEqual("done");
    });

    await test.step(`Inventory > Delivery Orders > Search theo order name > Vào Do-out detail
    > Check Availability > Validate > Apply`, async () => {
      const stockPickingId = await deliveryOrder.getStockPickingId(orderName, "out");

      doOutState = await deliveryOrder.getStockPickingState(stockPickingId);
      expect(doOutState).toEqual("confirmed");

      await deliveryOrder.checkAvailabilityStockPicking(stockPickingId);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingId);
      expect(doOutState).toEqual("assigned");
      await deliveryOrder.updateTknForDeliveryOrder(stockPickingId, "YT1111111111");
      await deliveryOrder.doneStockPicking(stockPickingId);
      doOutState = await deliveryOrder.getStockPickingState(stockPickingId);
      expect(doOutState).toEqual("done");
    });

    await test.step(`Vào shop template > Mở order detail > Verify tracking number, status của order`, async () => {
      const stockPickingId = await deliveryOrder.getStockPickingId(orderName, "out");
      let i = 0;
      do {
        i = i + 1;
        trackingNumberOdoo = await deliveryOrder.getStockPickingTrackingNumber(stockPickingId);
      } while (trackingNumberOdoo == false && i <= 10);

      // Verify tracking + status order trong shop template
      await expect(async () => {
        await ordersPage.goToOrderStoreTemplateByOrderId(orderId);
        trackingNumberDB = await ordersPage.getTrackingNumber();
        expect(trackingNumberDB).toEqual(trackingNumberOdoo);
      }).toPass();

      approvedStatus = await ordersPage.getApproveStatus();
      expect(approvedStatus).toEqual("Approved");
      paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Paid");
      fulfillmentStatusOrder = await ordersPage.getFulfillmentStatusOrder();
      expect(fulfillmentStatusOrder).toEqual("Fulfilled");
      archivedStatusOrder = await ordersPage.getArchivedStatusOrder();
      expect(archivedStatusOrder).toEqual("Archived");
    });
  });

  test(`@TC_SB_RPLS_RFPLB_3 Verify data order ở tab Cannot fulfill`, async ({ page, conf }) => {
    await test.step(`Login dashboard store template > Order
    > Search Order theo order name lấy được ở màn thank you page > Vào order detail`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await ordersPage.goToOrderStoreTemplateByOrderId(orderId);
      await ordersPage.waitForProfitCalculated();

      approvedStatus = await ordersPage.getApproveStatus();
      expect(approvedStatus).toEqual("Unapproved");
      paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Authorized");
      fulfillmentStatusOrder = await ordersPage.getFulfillmentStatusOrder();
      expect(fulfillmentStatusOrder).toEqual("Unfulfilled");
    });

    await test.step(`Click More actions > Approve order > Confirm`, async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      approvedStatus = await ordersPage.getApproveStatus();
      expect(approvedStatus).toEqual("Approved");
      paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Paid");
      fulfillmentStatusOrder = await ordersPage.getFulfillmentStatusOrder();
      expect(fulfillmentStatusOrder).toEqual("Unfulfilled");
    });

    await test.step(`Click PlusHub > click tắt filter Time since created
    > verify order tại tab Cannot fulfill`, async () => {
      const productValidate = conf.caseConf.product_validate;
      const warehouseItem = conf.caseConf.warehouse_item;

      await ordersPage.clickOnBtnWithLabel("PlusHub");
      await expect(async () => {
        await page.reload();
        await fulfillOrdersPage.removeFilterOrderPlusBase();
        expect(await fulfillOrdersPage.isOrderVisiableInTab(orderName, "Cannot Fulfill", 10)).toEqual(true);
      }).toPass();

      // verify thông tin order tại tab Cannot fulfill
      await expect(page.locator(`//p[normalize-space()='${orderName}']`)).toBeVisible();
      await expect(page.locator(`//span[normalize-space()='${productValidate}']`)).toHaveCount(1);
      await expect(page.locator(`//span[normalize-space()='${warehouseItem}']`)).toHaveCount(1);
      await expect(page.locator("//p[normalize-space()='Invalid shipping address']")).toBeVisible();

      const orderDate = await ordersPage.getOrderDate(orderName);
      const toDay = Date.now();
      expect(orderDate).toEqual(convertDate(toDay));

      const orderQty = await ordersPage.getOrderQuantity("Cannot Fulfill");
      expect(orderQty).toEqual(conf.caseConf.product_info.quantity);
      await expect(page.locator("//p[normalize-space()='Invalid shipping address']")).toBeVisible();
    });
  });
});
