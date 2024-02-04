import { test } from "@fixtures/odoo";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OdooService } from "@services/odoo";
import { expect } from "@playwright/test";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";

let orderName: string;
let orderId: number;
let shopDomain: string;
let plbTemplateShopDomain: string;
let plbToken: string;
let paymentStatus: string;
let approvedStatus: string;
let fulfillmentStatusOrder: string;
let archivedStatusOrder: string;
let purchaseOrder: string;
let trackingNumberOdoo;
let trackingNumberDB: string;
let doInState: string;
let doOutState: string;

let productPage: SFProduct;
let checkout: SFCheckout;
let ordersPage: OrdersPage;
let fulfillOrdersPage: FulfillmentPage;
let plbTemplateDashboardPage: DashboardPage;

test.describe("Full flow fulfill PlusBase @TC_PLB_FF_1", async () => {
  test.beforeEach(async ({ page, conf }) => {
    shopDomain = conf.suiteConf.domain_store;
    plbTemplateShopDomain = conf.suiteConf.domain;

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
  });

  const caseName = "TC_PLB_FF_1";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(({ product: product, quantity: quantity }) => {
    test("Full flow fulfill PlusBase @TC_PLB_FF_1", async ({ page, odoo, conf }) => {
      const customerInfo = conf.caseConf.customer_info;
      const cardInfo = conf.caseConf.card_info;
      const deliveryOrder = OdooService(odoo);

      await test.step("Search product > Add to cart > Checkout", async () => {
        const homepage = new SFHome(page, shopDomain);
        await homepage.gotoHomePage();

        productPage = await homepage.searchThenViewProduct(product);
        await productPage.inputQuantityProduct(quantity);
        await productPage.addProductToCart();

        checkout = await productPage.navigateToCheckoutPage();
        await checkout.enterShippingAddress(customerInfo);
        await checkout.selectShippingMethod("");
        await checkout.continueToPaymentMethod();
        await checkout.completeOrderWithCardInfo(cardInfo);
        orderName = await checkout.getOrderName();
        orderId = Number(await checkout.getOrderIdBySDK());
      });

      // eslint-disable-next-line max-len
      await test.step("Login dashboard store template > Order > Search Order theo order name lấy được ở màn thank you page > Vào order detail", async () => {
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

      await test.step("Click More actions > Approve order > Confirm", async () => {
        await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);

        approvedStatus = await ordersPage.getApproveStatus();
        expect(approvedStatus).toEqual("Approved");
        paymentStatus = await ordersPage.getPaymentStatus();
        expect(paymentStatus).toEqual("Paid");
        fulfillmentStatusOrder = await ordersPage.getFulfillmentStatusOrder();
        expect(fulfillmentStatusOrder).toEqual("Unfulfilled");
      });

      // eslint-disable-next-line max-len
      await test.step("Click PlusHub > click tắt filter Time since created", async () => {
        await ordersPage.clickOnBtnWithLabel("PlusHub");
        await page.reload();
        await fulfillOrdersPage.removeFilterOrderPlusBase();
        expect(await fulfillOrdersPage.countOrderInTab(orderName, "To fulfill")).toEqual("1");
      });

      await test.step("Chọn order > Fulfill selected orders > Confirm", async () => {
        const shippingMethod = conf.caseConf.fulfillment["shipping_method"];
        await fulfillOrdersPage.selectShippingMethod(shippingMethod);
        await fulfillOrdersPage.clickFulfillSelectedOrder();
        await fulfillOrdersPage.clickButton("Confirm");
        await page.reload();
        await fulfillOrdersPage.removeFilterOrderPlusBase();
        expect(await fulfillOrdersPage.countOrderInTab(orderName, "Awaiting stock")).toEqual("1");
        expect(await fulfillOrdersPage.countOrderInTab(orderName, "To fulfill")).toEqual("0");
      });

      await test.step("Click Warehouse > Purchase orders > Filter product > Lấy PO", async () => {
        await fulfillOrdersPage.navigateToMenuPlusHub("Warehouse");
        const productNameList = product.toString().split("(Test product)");
        const productName = productNameList[productNameList.length - 1].trim();
        await fulfillOrdersPage.searchPurchaseOrder(productName);
        expect(await fulfillOrdersPage.countPurchaseOrdersInTab(productName, "Incoming")).toEqual("1");
        purchaseOrder = await fulfillOrdersPage.getPurchaseOrderInWarehouse();
      });

      // eslint-disable-next-line max-len
      await test.step("Login odoo > Inventory > Receipts > Search PO theo PO name > Vào detail > Validate > Apply", async () => {
        const stockPickingIds = await deliveryOrder.getStockPickingIds(purchaseOrder);
        const stockPickingId = stockPickingIds[0];

        doInState = await deliveryOrder.getStockPickingState(stockPickingId);
        expect(doInState).toEqual("assigned");

        await deliveryOrder.doneStockPicking(stockPickingId);
        doInState = await deliveryOrder.getStockPickingState(stockPickingId);
        expect(doInState).toEqual("done");
      });

      // eslint-disable-next-line max-len
      await test.step("Inventory > Delivery Orders > Search theo order name > Vào Do-out detail > Check Availability > Validate > Apply > Load lại trang", async () => {
        const stockPickingIds = await deliveryOrder.getStockPickingIds(orderName);
        const stockPickingId = stockPickingIds[0];

        doOutState = await deliveryOrder.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("confirmed");

        await deliveryOrder.checkAvailabilityStockPicking(stockPickingId);
        doOutState = await deliveryOrder.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("assigned");

        await deliveryOrder.doneStockPicking(stockPickingId);
        doOutState = await deliveryOrder.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("done");

        // Chờ generate tracking number + sync về PlusBase
        let i = 0;
        do {
          i = i + 1;
          trackingNumberOdoo = await deliveryOrder.getStockPickingTrackingNumber(stockPickingId);
        } while (trackingNumberOdoo == false && i <= 10);

        await ordersPage.goToOrderStoreTemplateByOrderId(orderId);

        trackingNumberDB = await ordersPage.getTrackingNumber();

        expect(trackingNumberDB).toEqual(trackingNumberOdoo);
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
  });
});
