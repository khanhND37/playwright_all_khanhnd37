import { expect } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OdooService } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";
import { OrdersPage } from "@pages/dashboard/orders";

let orderName: string;
let dashboardPage: DashboardPage;
let shopDomain: string;
let productName: string;
let productWarehouse: string;
let odooService;
let productPage: SFProduct;
let productQty: number;
let checkoutPage: SFCheckout;
let unfufilledBefore: number;
let processingBefore: number;
let awaitingStockBefore: number;
let fufilledBefore: number;
let unfufilledAfter: number;
let processingAfter: number;
let awaitingStockAfter: number;
let fufilledAfter: number;
let fulfillmentPage: FulfillmentPage;
let stockPickingIdBefore: number;
let stockPickingIdAfter: number;
let plusHubAPI: PlusHubAPI;
let doInState: string;
let doOutState: string;
let maxRetry: number;
let orderId: number;
let orderPage: OrdersPage;

test.describe("Dashboard PlusHub", async () => {
  test.beforeEach(async ({ dashboard, conf, odoo }) => {
    test.setTimeout(conf.suiteConf.time_out);
    maxRetry = conf.suiteConf.max_retry;
    shopDomain = conf.suiteConf.domain;
    productName = conf.caseConf.product_info.name;
    productWarehouse = conf.caseConf.product_info.product_warehouse;
    productQty = conf.caseConf.product_info.quantity;
    odooService = OdooService(odoo);

    // Login vào shop dashboard
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    orderPage = new OrdersPage(dashboardPage.page, shopDomain);
    await dashboardPage.navigateToMenu("Fulfillment");
    await dashboardPage.navigateToMenu("PlusHub");
    fulfillmentPage = new FulfillmentPage(dashboard, shopDomain);
    await fulfillmentPage.navigateToMenuPlusHub("Dashboard");

    //Lấy số lượng order đang ở trạng thái Unfulfilled/ Awaiting Stock/ Processing/ Fulfilled
    unfufilledBefore = Number(await fulfillmentPage.getNumberOfOrder("Unfulfilled"));
    processingBefore = Number(await fulfillmentPage.getNumberOfOrder("Processing"));
    awaitingStockBefore = Number(await fulfillmentPage.getNumberOfOrder("Awaiting Stock"));
    fufilledBefore = Number(await fulfillmentPage.getNumberOfOrder("Fulfilled"));

    // Checkout in SF
    const productHanle = conf.caseConf.product_info.handle;
    productName = conf.caseConf.product_info.name;
    productQty = conf.caseConf.product_info.quantity;
    const shippingAddress = conf.suiteConf.shipping_address;
    const homepage = new SFHome(dashboard, shopDomain);
    await homepage.gotoHomePage();
    productPage = await homepage.gotoProductDetailByHandle(productHanle, productName);
    await productPage.inputQuantityProduct(productQty);
    await productPage.addProductToCart();
    checkoutPage = await productPage.navigateToCheckoutPage();
    await checkoutPage.enterShippingAddress(shippingAddress);
    await checkoutPage.continueToPaymentMethod();
    await checkoutPage.completeOrderWithMethod("Stripe");
    orderName = await checkoutPage.getOrderName();
    orderId = Number(await checkoutPage.getOrderIdBySDK());

    // Vào màn order list, wait đến khi status order = Paid
    await orderPage.goToOrderByOrderId(orderId);
    await orderPage.waitForPaymentStatusIsPaid();
  });

  test(`Verify thông tin hiển thị trên dashboard khi có data order @SB_RLSBFF_PLH_DB_6`, async ({
    authRequest,
    conf,
  }) => {
    await test.step(`Vào màn Fulfillment > PlusHub > Dashboard >Verify UI`, async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Dashboard");
      expect(await fulfillmentPage.isTextVisible("Welcome to PlusHub!")).toEqual(true);
      expect(await fulfillmentPage.isTextVisible("Fulfilled")).toEqual(true);
      expect(await fulfillmentPage.isTextVisible("Awaiting Stock")).toEqual(true);
      expect(await fulfillmentPage.isTextVisible("Processing")).toEqual(true);
      expect(await fulfillmentPage.isTextVisible("Unfulfilled")).toEqual(true);
    });

    await test.step(`Verify thông tin hiển thị trên dashboard`, async () => {
      // Get stock picking ID before purchase
      plusHubAPI = new PlusHubAPI(shopDomain, authRequest);
      stockPickingIdBefore = await plusHubAPI.getStockPickingIdByApi({ product_warehouse: productWarehouse });

      //check số lượng order ở trạng thái Unfulfilled
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");
      await fulfillmentPage.removeFilterOrderPlusHub();
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.navigateToMenuPlusHub("Dashboard");
      unfufilledAfter = Number(await fulfillmentPage.getNumberOfOrder("Unfulfilled"));
      expect(unfufilledAfter).toEqual(unfufilledBefore + 1);

      //fulfill order vừa tạo và check số lượng ở trạng thái Awaiting stock
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");

      //Fulfill order
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      await expect(async () => {
        expect(await fulfillmentPage.getCountFulfillment()).toEqual(1);
      }).toPass();
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.purchaseInPopUpReview();
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
      await fulfillmentPage.navigateToFulfillmentTab("Awaiting stock");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Awaiting stock", maxRetry)).toEqual(true);
      await fulfillmentPage.navigateToMenuPlusHub("Dashboard");
      awaitingStockAfter = Number(await fulfillmentPage.getNumberOfOrder("Awaiting Stock"));
      expect(awaitingStockAfter).toEqual(awaitingStockBefore + 1);

      //Processing order
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Warehouse");
      stockPickingIdAfter = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: productWarehouse,
        stock_picking_id_before: stockPickingIdBefore,
        is_stock_picking_id_before: true,
      });

      // Vào odoo > done Do-in và do-out
      await odooService.doneStockPicking(stockPickingIdAfter);
      doInState = await odooService.getStockPickingState(stockPickingIdAfter);
      expect(doInState).toEqual("done");
      const stockPickingDoout = await odooService.getStockPickingId(orderName);
      doOutState = await odooService.getStockPickingState(stockPickingDoout);
      expect(doOutState).toEqual("confirmed");
      await odooService.checkAvailabilityStockPicking(stockPickingDoout);
      doOutState = await odooService.getStockPickingState(stockPickingDoout);
      expect(doOutState).toEqual("assigned");

      // Vào dashboard PlusHub > check số lượng order ở trạng thái Processing
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.navigateToFulfillmentTab("Processing");
      await fulfillmentPage.removeFilterOrderPlusHub();
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Processing", maxRetry)).toEqual(true);
      await fulfillmentPage.navigateToMenuPlusHub("Dashboard");
      processingAfter = Number(await fulfillmentPage.getNumberOfOrder("Processing"));
      expect(processingAfter).toEqual(processingBefore + 1);

      //Update tracking number cho order
      await odooService.updateTknForDeliveryOrder(stockPickingDoout, conf.caseConf.tracking_number);
      await odooService.doneStockPicking(stockPickingDoout);
      doOutState = await odooService.getStockPickingState(stockPickingDoout);
      expect(doOutState).toEqual("done");

      //Vào dashboard PlusHub > Verify số order được fulfilled
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.navigateToFulfillmentTab("Fulfilled");
      await fulfillmentPage.removeFilterOrderPlusHub();
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Fulfilled", maxRetry)).toEqual(true);
      await fulfillmentPage.navigateToMenuPlusHub("Dashboard");
      fufilledAfter = Number(await fulfillmentPage.getNumberOfOrder("Fulfilled"));
      expect(fufilledAfter).toEqual(fufilledBefore + 1);
    });

    await test.step(`Verify tooltip hiển thị ở các status`, async () => {
      const tooltipUnfulfilled = await fulfillmentPage.getTooltipByStatus("Unfulfilled");
      expect(tooltipUnfulfilled).toEqual("Orders that you requested fulfill via PlusHub and ready to fulfill");

      const tooltipAwaitingStock = await fulfillmentPage.getTooltipByStatus("Awaiting Stock");
      expect(tooltipAwaitingStock).toEqual(
        "Orders you sent request to fulfill are on the way to be stocked in PlusHub's warehouse.",
      );

      const tooltipProcessing = await fulfillmentPage.getTooltipByStatus("Processing");
      expect(tooltipProcessing).toEqual("Orders have arrived in PlusHub’s warehouse and are handling by us.");

      const tooltipFulfilled = await fulfillmentPage.getTooltipByStatus("Fulfilled");
      expect(tooltipFulfilled).toEqual(
        "PlusHub have sent your orders to shipping carrier and they are on the way to your customers.",
      );
    });
  });

  test(` Verify alert hiển thị trên dashboard khi có order chưa được fulfill @SB_RLSBFF_PLH_DB_7`, async ({
    dashboard,
  }) => {
    let totalOrderToFulfill: number;
    let totalOrderAwaitingStock: number;
    let ordersName: Array<string>;
    let messageAlert: string;

    await test.step(`Vào màn Fulfillment > PlusHub > Fulfillment > Orders > Verify count order ở tab To Fulfill`, async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      fulfillmentPage = new FulfillmentPage(dashboard, shopDomain);
      await fulfillmentPage.navigateToMenuPlusHub("Dashboard");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.removeFilterOrderPlusHub();
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.navigateToMenuPlusHub("Dashboard");
      unfufilledAfter = Number(await fulfillmentPage.getNumberOfOrder("Unfulfilled"));
      expect(unfufilledAfter).toEqual(unfufilledBefore + 1);
    });

    await test.step(`Vào PlusHub > Dashboard > Verify alert hiển thị`, async () => {
      if (unfufilledAfter === 1) {
        messageAlert = ` ${unfufilledAfter} order awaiting to be fulfilled `;
      } else {
        messageAlert = ` ${unfufilledAfter} orders awaiting to be fulfilled `;
      }
      expect(await fulfillmentPage.isTextVisible(messageAlert)).toEqual(true);
      expect(
        await fulfillmentPage.isTextVisible(
          "Please review your orders and take immediate actions to fulfill them on time. ",
        ),
      ).toEqual(true);
      expect(await fulfillmentPage.isTextVisible("Review orders")).toEqual(true);
    });

    await test.step(`Click icon "x" để tắt alert`, async () => {
      await fulfillmentPage.clickCloseAlert();
      expect(await fulfillmentPage.isTextVisible(messageAlert)).toEqual(false);
      expect(
        await fulfillmentPage.isTextVisible(
          "Please review your orders and take immediate actions to fulfill them on time. ",
        ),
      ).toEqual(false);
      expect(await fulfillmentPage.isTextVisible("Review orders")).toEqual(false);
    });

    await test.step(`Reload lại trang dashboard > Verify alert order awaiting fulfill hiển thị`, async () => {
      await fulfillmentPage.page.reload();
      expect(await fulfillmentPage.isTextVisible(messageAlert)).toEqual(true);
      expect(
        await fulfillmentPage.isTextVisible(
          "Please review your orders and take immediate actions to fulfill them on time. ",
        ),
      ).toEqual(true);
      expect(await fulfillmentPage.isTextVisible("Review orders")).toEqual(true);
    });

    await test.step(`Click button Review orders`, async () => {
      await fulfillmentPage.clickButton("Review orders");
      const fulfillTab = fulfillmentPage.page.locator(fulfillmentPage.xpathToFulfillTab);
      await expect(fulfillTab).toHaveAttribute("class", "is-active");
      await fulfillmentPage.removeFilterOrderPlusHub();
      totalOrderToFulfill = await fulfillmentPage.getCountFulfillment();
      expect(totalOrderToFulfill).toEqual(unfufilledAfter);
      ordersName = await fulfillmentPage.getListOrderName();
    });

    await test.step(`Chọn tất cả order ở tab To fulfill > Click button "Fulfill selected order"`, async () => {
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.purchaseInPopUpReview();
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
    });

    await test.step(`Vào PlusHub > Dashboard > Verify alert order awaiting fulfill không hiển thị `, async () => {
      await fulfillmentPage.navigateToFulfillmentTab("Awaiting stock");
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isListOrderVisibleInTab(ordersName, "Awaiting stock", maxRetry)).toEqual(true);
      totalOrderAwaitingStock = totalOrderToFulfill + awaitingStockBefore;
      await fulfillmentPage.navigateToMenuPlusHub("Dashboard");
      expect(
        await fulfillmentPage.isTextVisible(
          "Please review your orders and take immediate actions to fulfill them on time. ",
        ),
      ).toEqual(false);
      expect(await fulfillmentPage.isTextVisible("Review orders")).toEqual(false);
      awaitingStockAfter = Number(await fulfillmentPage.getNumberOfOrder("Awaiting Stock"));
      unfufilledAfter = Number(await fulfillmentPage.getNumberOfOrder("Unfulfilled"));
      expect(unfufilledAfter).toEqual(0);
      expect(awaitingStockAfter).toEqual(totalOrderAwaitingStock);
    });
  });
});
