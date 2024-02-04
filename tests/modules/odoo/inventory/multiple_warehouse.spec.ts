import { expect } from "@playwright/test";
import { test } from "@fixtures/odoo";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import type { ShippingAddress } from "@types";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { OdooService } from "@services/odoo";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";

let orderName: string;
let orderId: number;
let shopDomain: string;
let productVariantId: number;
let plbTemplateShopDomain: string;
let plbToken: string;
let approvedStatus: string;
let productHanle: string;
let productName: string;
let productQty: number;
let warehouseReserve: string;
let shippingAddress: ShippingAddress;
let productPage: SFProduct;
let checkout: SFCheckout;
let ordersPage: OrdersPage;
let fulfillOrdersPage: FulfillmentPage;
let plbTemplateDashboardPage: DashboardPage;
let odooService;
let plusbaseOrderAPI: PlusbaseOrderAPI;

test.describe("Multiple warehouse", async () => {
  test.beforeEach(async ({ page, conf, odoo }) => {
    shopDomain = conf.suiteConf.domain_store;
    productVariantId = conf.suiteConf.variant_id;
    plbTemplateShopDomain = conf.suiteConf.domain;
    productHanle = conf.caseConf.product_info.handle;
    productName = conf.caseConf.product_info.name;
    productQty = conf.caseConf.product_info.quantity;
    warehouseReserve = conf.caseConf.product_info.warehouseReserve;
    shippingAddress = conf.caseConf.shipping_address;
    odooService = OdooService(odoo);
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

    // Checkout
    const homepage = new SFHome(page, shopDomain);
    await homepage.gotoHomePage();
    productPage = await homepage.gotoProductDetailByHandle(productHanle, productName);
    await productPage.inputQuantityProduct(productQty);
    await productPage.addProductToCart();
    checkout = await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(shippingAddress);
    await checkout.continueToPaymentMethod();
    await checkout.completeOrderWithMethod("Stripe");
    orderName = await checkout.getOrderName();
    orderId = Number(await checkout.getOrderIdBySDK());
  });

  test(`Verify action auto assign warehouse khi 1 kho đủ tồn @TC_SB_SBFF_MW_7`, async ({ authRequest, conf }) => {
    plusbaseOrderAPI = new PlusbaseOrderAPI(plbTemplateShopDomain, authRequest);

    await test.step(`Login dashboard store template > Order > Search Order theo order name lấy được ở màn thank you page > Vào order detail > Approve order`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await ordersPage.goToOrderStoreTemplateByOrderId(orderId);
      await ordersPage.waitForProfitCalculated();
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      approvedStatus = await ordersPage.getApproveStatus();
      expect(approvedStatus).toEqual("Approved");
    });

    await test.step(`Click PlusHub > click tắt filter Time since created > Fulfill order`, async () => {
      await ordersPage.clickOnBtnWithLabel("PlusHub");
      await fulfillOrdersPage.removeFilterOrderPlusBase();
      await fulfillOrdersPage.clickFulfillSelectedOrder();
      await fulfillOrdersPage.clickButton("Confirm");
    });

    await test.step(`Inventory > Delivery Orders > Search theo order name > Vào Do-out detail > Verify warehouse`, async () => {
      await plusbaseOrderAPI.autoReserveDoOut(productVariantId, plbTemplateShopDomain);
      const stockPickingId = await odooService.getStockPickingId(orderName, "out", conf.suiteConf.owner_id, 20);
      const doOutWarehouse = await odooService.getWarehouseDoOut(stockPickingId);
      expect(doOutWarehouse).toEqual(warehouseReserve);
    });
  });
});
