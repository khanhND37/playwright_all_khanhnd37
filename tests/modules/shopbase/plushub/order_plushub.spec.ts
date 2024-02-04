import { expect } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";

let orderName: string;
let orderId: number;
let shopDomain: string;
let dashboardPage: DashboardPage;
let fulfillmentPage: FulfillmentPage;
let orderPage: OrdersPage;
let plusHubAPI: PlusHubAPI;
let productName: string;
let productWarehouse: string;
let productQty: number;
let shippingMethod: string;
let shippingFee: string;
let total: string;
let doInState: string;
let doOutState: string;
let odooService: OdooServiceInterface;
let stockPickingIdBefore: number;
let stockPickingIdAfter: number;
let maxRetry: number;
let productPage: SFProduct;
let checkoutPage: SFCheckout;

test.describe("Fulfill order PlusHub", async () => {
  test.beforeEach(async ({ page, conf, odoo, authRequest, dashboard }) => {
    test.setTimeout(conf.suiteConf.time_out);
    maxRetry = conf.suiteConf.max_retry;
    shopDomain = conf.suiteConf.domain;
    productName = conf.caseConf.product_info.name;
    productWarehouse = conf.caseConf.product_info.product_warehouse;
    productQty = conf.caseConf.product_info.quantity;
    shippingMethod = conf.caseConf.shipping_method;
    odooService = OdooService(odoo);
    plusHubAPI = new PlusHubAPI(shopDomain, authRequest);

    // Checkout
    const productHanle = conf.caseConf.product_info.handle;
    productName = conf.caseConf.product_info.name;
    productQty = conf.caseConf.product_info.quantity;
    const shippingAddress = conf.suiteConf.shipping_address;
    shippingMethod = conf.caseConf.shipping_method;
    const homepage = new SFHome(page, shopDomain);
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
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    orderPage = new OrdersPage(dashboardPage.page, shopDomain);
  });

  test(`Verify action fulfill order với warehouse có tồn @SB_RLSBFF_PLH_OD_7`, async ({}) => {
    fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fuflillment > Orders > Need to fulfill > Search order > Chọn order > Fulfill selected order `, async () => {
      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.selectShippingMethod(shippingMethod);
      shippingFee = await fulfillmentPage.getShippingFee();
      await fulfillmentPage.clickFulfillSelectedOrder();
      expect(await fulfillmentPage.isTextVisible("Make a payment")).toEqual(true);
      total = await fulfillmentPage.getTotalInPopupPayment();
      expect(total).toEqual(shippingFee);
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
    });

    await test.step(`Verify status của order`, async () => {
      await fulfillmentPage.navigateToFulfillmentTab("Processing");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Processing", maxRetry)).toEqual(true);
      await expect(fulfillmentPage.getLocatorItem(productName)).toBeVisible();
      const quantity = await fulfillmentPage.getQuantityInFulfillTab();
      expect(quantity).toEqual(productQty);
      await expect(fulfillmentPage.getLocatorItem(productWarehouse)).toBeVisible();
      expect(await fulfillmentPage.isTextVisible(shippingMethod)).toEqual(true);
    });
  });

  test(`Verify order với product chưa đươc mapping @SB_RLSBFF_PLH_OD_9`, async ({}) => {
    fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fuflillment > Orders > Search order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      await fulfillmentPage.navigateToFulfillmentTab("Need mapping");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Need mapping", maxRetry)).toEqual(true);
      expect(await fulfillmentPage.isTextVisible("Need mapping")).toEqual(true);
    });
  });

  test(`Verify hiển thị order trong tab To fulfill với product đã được map warehouse @SB_RLSBFF_PLH_OD_10`, async ({
    conf,
  }) => {
    fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fuflillment > Orders > Search order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await expect(fulfillmentPage.getLocatorItem(productName)).toBeVisible();
      const quantity = await fulfillmentPage.getQuantityInFulfillTab();
      expect(quantity).toEqual(productQty);
      await expect(fulfillmentPage.getLocatorItem(productWarehouse)).toBeVisible();
      const baseCostPerItem = await fulfillmentPage.getBaseCostPerItem();
      expect(baseCostPerItem).toEqual(conf.caseConf.base_cost);
    });
  });

  test(`Verify fulfillment status sau khi cancel fulfillment @SB_RLSBFF_PLH_OD_12`, async ({}) => {
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fuflillment > Orders > Need to fulfill > Search order > Chọn order > Fulfill selected order > Click btn Paynow`, async () => {
      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.purchaseInPopUpReview();
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
      await fulfillmentPage.navigateToFulfillmentTab("Awaiting stock");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Awaiting stock", maxRetry)).toEqual(true);
    });

    await test.step(`Vào Orders > All orders > Search order > Verify fulfillment status`, async () => {
      await dashboardPage.navigateToMenu("Orders");
      await orderPage.goToOrderByOrderId(orderId);
      const fulfillmentStatus = await orderPage.getFulfillmentStatusItem();
      expect(fulfillmentStatus).toContain("Awaiting stock");
    });

    await test.step(` Cancel fulfillment > Vào Orders > All orders > Search order > Verify fulfillment status`, async () => {
      await orderPage.cancelFulfillment();
      const fulfillmentStatus = await orderPage.getFulfillmentStatusItem();
      expect(fulfillmentStatus).toContain("Unfulfilled");
      await orderPage.goToOrderListFromOrderDetail();
      const fulfillStatusInOrderList = await orderPage.getFulfillmentStatusInOrderList(orderName);
      expect(fulfillStatusInOrderList).toContain("Unfulfilled");
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
    });
  });

  test(`Verify order khi fulfill product có base cost expired @SB_RLSBFF_PLH_OD_13`, async ({}) => {
    fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fulfillment > Orders > Search order `, async () => {
      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      expect(fulfillmentPage.isTextVisible("Expired quotation")).toBeTruthy();
    });

    await test.step(`Click chọn order > Fulfill selected order > Verify popup hiển thị`, async () => {
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.checkAutoPurchase();
      const btnCheckout = await fulfillmentPage.xpathBtnWithLabel("Checkout");
      await expect(fulfillmentPage.page.locator(btnCheckout)).toBeDisabled();
    });

    await test.step(`Verify order`, async () => {
      await fulfillmentPage.page.reload();
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
    });
  });

  test(`Verify hiển thị khi order/line items có fulfillment status Fulfilled @SB_RLSBFF_PLH_OD_14`, async ({
    conf,
  }) => {
    fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fulfillment > Orders > Search order > Fulfill selected order> Chọn checkbox Auto purchase > Click btn Checkout > Pay now`, async () => {
      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      // Get stock picking ID before purchase
      stockPickingIdBefore = await plusHubAPI.getStockPickingIdByApi({ product_warehouse: productWarehouse });
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.purchaseInPopUpReview();
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
      await fulfillmentPage.navigateToFulfillmentTab("Awaiting stock");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Awaiting stock", maxRetry)).toEqual(true);
    });
    await test.step("Click Warehouse > Purchase orders > Filter product > Lấy PO", async () => {
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Warehouse");
      // Get stock picking ID after purchase
      stockPickingIdAfter = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: productWarehouse,
        stock_picking_id_before: stockPickingIdBefore,
        is_stock_picking_id_before: true,
      });
    });

    await test.step(`Login vào odoo > Inventory > Receipts > Search Do-in theo product name > Validate`, async () => {
      await odooService.doneStockPicking(stockPickingIdAfter);
      doInState = await odooService.getStockPickingState(stockPickingIdAfter);
      expect(doInState).toEqual("done");
    });
    await test.step(` Inventory > Delivery order > Search Do-out theo order name > Check Availability > Validate`, async () => {
      const stockPickingDoout = await odooService.getStockPickingId(orderName);
      doOutState = await odooService.getStockPickingState(stockPickingDoout);
      if (doOutState === "confirmed") {
        await odooService.checkAvailabilityStockPicking(stockPickingDoout);
      }
      doOutState = await odooService.getStockPickingState(stockPickingDoout);
      expect(doOutState).toEqual("assigned");
      await odooService.updateTknForDeliveryOrder(stockPickingDoout, conf.caseConf.tracking_number);
      await odooService.doneStockPicking(stockPickingDoout);
      doOutState = await odooService.getStockPickingState(stockPickingDoout);
      expect(doOutState).toEqual("done");
    });
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fulfillment > Orders > Search order > Verify order hiển thị`, async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      await fulfillmentPage.navigateToFulfillmentTab("Fulfilled");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Fulfilled", maxRetry)).toEqual(true);
    });
  });

  test(`Verify hiển thị khi order/line items có fulfillment status Awaiting stock @SB_RLSBFF_PLH_OD_16`, async ({}) => {
    fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fulfillment > Orders > Search order > Fulfill selected order> Chọn checkbox Auto purchase > Click btn Checkout > Pay now`, async () => {
      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();

      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.purchaseInPopUpReview();
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
    });
    await test.step(`Verify order`, async () => {
      await fulfillmentPage.navigateToFulfillmentTab("Awaiting stock");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Awaiting stock", maxRetry)).toEqual(true);
      await expect(fulfillmentPage.getLocatorItem(productName)).toBeVisible();
      const quantity = await fulfillmentPage.getQuantityInFulfillTab();
      expect(quantity).toEqual(productQty);
      await expect(fulfillmentPage.getLocatorItem(productWarehouse)).toBeVisible();
      expect(await fulfillmentPage.isTextVisible(shippingMethod)).toEqual(true);
    });
  });

  test(`Verify hiển thị khi order/line items có fulfillment status Processing @SB_RLSBFF_PLH_OD_17`, async ({}) => {
    const fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fulfillment > Orders > Search order > Fulfill selected order> Chọn checkbox Auto purchase > Click btn Checkout > Pay now`, async () => {
      // Get stock picking ID before purchase
      stockPickingIdBefore = await plusHubAPI.getStockPickingIdByApi({ product_warehouse: productWarehouse });

      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.navigateToFulfillmentTab("To fulfill");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.purchaseInPopUpReview();
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
      await fulfillmentPage.navigateToFulfillmentTab("Awaiting stock");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Awaiting stock", maxRetry)).toEqual(true);
    });

    await test.step("Click Warehouse > Purchase orders > Filter product > Lấy PO", async () => {
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Warehouse");
      // Get stock picking ID after purchase
      stockPickingIdAfter = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: productWarehouse,
        stock_picking_id_before: stockPickingIdBefore,
        is_stock_picking_id_before: true,
      });
    });

    await test.step(`Login vào odoo > Inventory > Receipts > Search Do-in theo product name > Validate`, async () => {
      await odooService.doneStockPicking(stockPickingIdAfter);
      doInState = await odooService.getStockPickingState(stockPickingIdAfter);
      expect(doInState).toEqual("done");
    });
    await test.step(`Inventory > Delivery order > Search Do-out theo order name > Check Availability`, async () => {
      const stockPickingDoout = await odooService.getStockPickingId(orderName);
      doOutState = await odooService.getStockPickingState(stockPickingDoout);
      expect(doOutState).toEqual("confirmed");
      await odooService.checkAvailabilityStockPicking(stockPickingDoout);
      doOutState = await odooService.getStockPickingState(stockPickingDoout);
      expect(doOutState).toEqual("assigned");
    });
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fulfillment > Orders > Search order `, async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.navigateToFulfillmentTab("Processing");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Processing", maxRetry)).toEqual(true);
    });
  });

  test(`Verify order fulfill với product có basecost bị expired và còn tồn(available stock >0) @SB_RLSBFF_PLH_OD_20`, async ({}) => {
    fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fuflillment > Orders > Need to fulfill > Search order `, async () => {
      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      expect(fulfillmentPage.isTextVisible("Expired quotation")).toBeTruthy();
    });

    await test.step(`Select order > Fulfill selected order`, async () => {
      shippingFee = await fulfillmentPage.getShippingFee();
      await fulfillmentPage.clickFulfillSelectedOrder();
      expect(await fulfillmentPage.isTextVisible("Make a payment")).toEqual(true);
      total = await fulfillmentPage.getTotalInPopupPayment();
      expect(total).toEqual(shippingFee);
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
      await fulfillmentPage.page.reload();
      await fulfillmentPage.navigateToFulfillmentTab("Processing");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Processing", maxRetry)).toEqual(true);
      await expect(fulfillmentPage.getLocatorItem(productName)).toBeVisible();
      const quantity = await fulfillmentPage.getQuantityInFulfillTab();
      expect(quantity).toEqual(productQty);
      await expect(fulfillmentPage.getLocatorItem(productWarehouse)).toBeVisible();
      expect(await fulfillmentPage.isTextVisible(shippingMethod)).toEqual(true);
    });
  });

  test(`Verify data order when fulfill order with package rule @SB_RLSBFF_PLH_OD_22`, async ({ conf }) => {
    fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
    await test.step("Vào dashboard Fulfillment > PlusHub > Fulfillment > Orders > Search order > Fulfill selected order", async () => {
      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.purchaseInPopUpReview();
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
      await fulfillmentPage.navigateToFulfillmentTab("Awaiting stock");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Awaiting stock", maxRetry)).toEqual(true);
    });

    await test.step("Verify number fulfillment is created", async () => {
      await expect(async () => {
        await fulfillmentPage.switchToTabInFulfillment("Sent fulfillment request");
        await fulfillmentPage.page.waitForLoadState("networkidle");
        await fulfillmentPage.switchToTabInFulfillment("Awaiting stock");
        expect(await fulfillmentPage.getCountFulfillment()).toEqual(conf.caseConf.number_of_line);
      }).toPass({ timeout: 120000 });
    });
  });

  test(`Verify data order sau khi fulfill bị cancel/ refund @SB_RLSBFF_PLH_OD_27`, async ({ conf }) => {
    fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
    orderPage = new OrdersPage(dashboardPage.page, shopDomain);
    await test.step(`Vào dashboard Fulfillment > Plushub > Fulfillment > Orders > Search order > Fulfill order`, async () => {
      // Vào màn order list, wait đến khi status order = Paid
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForPaymentStatusIsPaid();
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "To fulfill", maxRetry)).toEqual(true);
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.purchaseInPopUpReview();
      await fulfillmentPage.clickOnBtnWithLabel("Pay now");
      expect(await fulfillmentPage.isToastMsgVisible("Service is paid successfully!")).toBeTruthy();
      await fulfillmentPage.navigateToFulfillmentTab("Awaiting stock");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Awaiting stock", maxRetry)).toEqual(true);
      const quantity = await fulfillmentPage.getQuantityInFulfillTab();
      expect(quantity).toEqual(productQty);
    });
    await test.step(`Vào menu Orders > All order > Search order > Refund items`, async () => {
      await dashboardPage.navigateToMenu("Orders");
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.clickRefundItems();
      await orderPage.fillRefundQuantity(conf.caseConf.product_info.refunded_quantity);
      await orderPage.clickRefundButton();
      await orderPage.page.reload();
      await orderPage.page.waitForLoadState("load");
      const paymentStatus = await orderPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");
    });
    await test.step(`Verify quantity order ở tab Awaiting stock`, async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      await fulfillmentPage.navigateToFulfillmentTab("Awaiting stock");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Awaiting stock", maxRetry)).toEqual(true);
      const quantity = await fulfillmentPage.getQuantityInFulfillTab();
      expect(quantity).toEqual(conf.caseConf.product_info.remaining_quantity);
    });
  });
});

// Order invalid shipping
test.describe("Fulfill order invalid shipping address", async () => {
  test(`Verify fulfill order invalid shipping address @SB_RLSBFF_PLH_OD_11`, async ({ page, conf, dashboard }) => {
    shopDomain = conf.suiteConf.domain;
    let productPage: SFProduct;
    let checkoutPage: SFCheckout;
    const shippingAddress = conf.caseConf.shipping_address;
    maxRetry = conf.suiteConf.max_retry;
    await test.step(`Mở SF > Thực hiện checkout `, async () => {
      const homepage = new SFHome(page, shopDomain);
      await homepage.gotoHomePage();
      productPage = await homepage.gotoProductDetailByHandle(
        conf.caseConf.product_info.handle,
        conf.caseConf.product_info.name,
      );
      await productPage.inputQuantityProduct(conf.caseConf.product_info.quantity);
      await productPage.addProductToCart();
      checkoutPage = await productPage.navigateToCheckoutPage();
      await checkoutPage.enterShippingAddress(shippingAddress);
      await checkoutPage.continueToPaymentMethod();
      await checkoutPage.completeOrderWithMethod("Stripe");
      orderName = await checkoutPage.getOrderName();
    });
    await test.step(`Vào dashboard Fulfillment > PlusHub > Fuflillment > Orders > Search order > Verify order`, async () => {
      dashboardPage = new DashboardPage(dashboard, shopDomain);
      fulfillmentPage = new FulfillmentPage(dashboardPage.page, shopDomain);
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillmentPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillmentPage.navigateToMenuPlusHub("Orders");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusHub();
      await fulfillmentPage.navigateToFulfillmentTab("Cannot Fulfill");
      expect(await fulfillmentPage.isOrderVisiableInTab(orderName, "Cannot Fulfill", maxRetry)).toEqual(true);
      expect(await fulfillmentPage.isTextVisible("Invalid shipping address")).toEqual(true);
    });
  });
});
