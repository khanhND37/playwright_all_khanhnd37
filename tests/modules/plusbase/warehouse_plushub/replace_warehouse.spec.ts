import { expect, test } from "@core/fixtures";
import { SFHome } from "@pages/storefront/homepage";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import type { Inventory } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";

let plusHubAPI: PlusHubAPI;
let orderPage: OrdersPage;
let newProductInfo;
let productInfo;
let orderName: string;
let accessToken: string;
let timeline: string;
let qtyCheckout: number;
let quantityUnfulfillBefore: number;
let quantityUnfulfillAfter: number;
let plusbaseOrderAPI: PlusbaseOrderAPI;
let lineItemId;
let dataOrder;
let dataInventoryBefore: Inventory;
let dataInventoryAfter: Inventory;
let orderId;

test.describe("replace product in order", async () => {
  test.beforeEach(async ({ page, conf, authRequest, dashboard }) => {
    const homepage = new SFHome(page, conf.suiteConf.domain);
    plusbaseOrderAPI = new PlusbaseOrderAPI(conf.suiteConf.domain, authRequest);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);

    const productHanle = conf.caseConf.product_handle;
    const productName = conf.caseConf.product_name;
    qtyCheckout = conf.caseConf.quantity;
    const shippingAddress = conf.suiteConf.shipping_address;
    newProductInfo = conf.caseConf.new_product_info;
    productInfo = conf.caseConf.product_info;
    timeline = conf.caseConf.timeline;

    await homepage.gotoHomePage();
    const productPage = await homepage.gotoProductDetailByHandle(productHanle, productName);
    await productPage.inputQuantityProduct(qtyCheckout);
    await productPage.addProductToCart();
    const checkout = await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(shippingAddress);
    await checkout.continueToPaymentMethod();
    await checkout.completeOrderWithMethod("Stripe");
    orderName = await checkout.getOrderName();
    orderId = await checkout.getOrderIdBySDK();

    // Get status order. expect status = Paid
    await orderPage.goToOrderByOrderId(orderId);
    await orderPage.waitForPaymentStatusIsPaid();
    const actualPaymentStatus = await orderPage.getOrderStatus();
    expect(actualPaymentStatus).toEqual("Paid");
  });
  test(`Verify replace warehouse item khi không tick chọn Replace for all current orders @SB_RLSBFF_PLH_WH_27`, async ({
    conf,
    multipleStore,
  }) => {
    await test.step(`Vào Fulfillment > Plushub > Fulfillment > Search order vừa checkout 
    > Click btn Replace warehouse item > Search and select product 2 > Click btn Replace`, async () => {
      //get authRequest
      const authRequestStore = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        conf.suiteConf.domain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      plusbaseOrderAPI = new PlusbaseOrderAPI(conf.suiteConf.domain, authRequestStore);
      plusHubAPI = new PlusHubAPI(conf.suiteConf.domain, authRequestStore);
      // Get data tab Unfulfill of product mapping before replace
      dataInventoryBefore = await plusHubAPI.getValueInventoryPurchase(newProductInfo.product_id);
      quantityUnfulfillBefore = dataInventoryBefore.wait_to_fulfill;

      // Replace warehouse item
      dataOrder = await plusbaseOrderAPI.searchOrders({
        search_keyword: orderName,
      });
      lineItemId = dataOrder.data.orders[0].line_items[0].id;
      newProductInfo.line_item_id = lineItemId;
      await plusHubAPI.replaceWarehouseItem(newProductInfo);
      await expect(async () => {
        await orderPage.page.reload();
        await orderPage.page.waitForSelector(orderPage.orderStatus);
        expect(await orderPage.isTextVisible(timeline)).toBe(true);
      }).toPass();
    });

    await test.step(`Vào Warehouse > Search product vừa được mapping > Verify data product `, async () => {
      await expect(async () => {
        dataInventoryAfter = await plusHubAPI.getValueInventoryPurchase(newProductInfo.product_id, dataInventoryBefore);
        quantityUnfulfillAfter = dataInventoryAfter.wait_to_fulfill;
        expect(quantityUnfulfillAfter).toEqual(quantityUnfulfillBefore + qtyCheckout);
      }).toPass();
    });
  });

  test(`Verify replace warehouse item khi tick chọn Replace for all current orders @SB_RLSBFF_PLH_WH_28`, async ({
    conf,
    multipleStore,
  }) => {
    await test.step(`Vào Fulfillment > Plushub > Fulfillment > Search order vừa checkout > Click btn Replace warehouse item > Search and select product 2 `, async () => {
      //get access token
      const authRequestStore = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        conf.suiteConf.domain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      plusbaseOrderAPI = new PlusbaseOrderAPI(conf.suiteConf.domain, authRequestStore);
      plusHubAPI = new PlusHubAPI(conf.suiteConf.domain, authRequestStore);
      // Get data tab Unfulfill of product mapping before replace
      dataInventoryBefore = await plusHubAPI.getValueInventoryPurchase(newProductInfo.product_id, null, accessToken);
      quantityUnfulfillBefore = dataInventoryBefore.wait_to_fulfill;
      // Replace warehouse item
      dataOrder = await plusbaseOrderAPI.searchOrders({
        search_keyword: conf.caseConf.order_number_old,
      });
      lineItemId = dataOrder.data.orders[0].line_items[0].id;
      newProductInfo.line_item_id = lineItemId;
      await plusHubAPI.replaceWarehouseItem(newProductInfo);
      await expect(async () => {
        await orderPage.page.reload();
        await orderPage.page.waitForSelector(orderPage.orderStatus);
        expect(await orderPage.isTextVisible(timeline)).toBe(true);
      }).toPass();
    });

    await test.step(`Vào Warehouse > Search product vừa được mapping > Verify data product `, async () => {
      await expect(async () => {
        dataInventoryAfter = await plusHubAPI.getValueInventoryPurchase(newProductInfo.product_id, dataInventoryBefore);
        quantityUnfulfillAfter = dataInventoryAfter.wait_to_fulfill;
        expect(quantityUnfulfillAfter).toEqual(quantityUnfulfillBefore + qtyCheckout);
      }).toPass();
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
      lineItemId = dataReplaceOrder.data.orders[0].line_items[0].id;
      productInfo.line_item_id = lineItemId;
      await plusHubAPI.replaceWarehouseItem(productInfo);
    });
  });
});
