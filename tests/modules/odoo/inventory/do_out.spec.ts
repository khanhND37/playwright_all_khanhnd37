import { expect } from "@playwright/test";
import { test } from "@fixtures/odoo";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { OdooService } from "@services/odoo";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { CheckoutAPI } from "@pages/api/checkout";
import type { Product } from "@types";

test.describe("Sbase delivery orders", async () => {
  let orderName: string;
  let domain: string;
  let odooService = OdooService(null);
  let dashboardPage: DashboardPage;
  let fulfillOrdersPage: FulfillmentPage;
  let quantityDone: number;
  let checkoutAPI: CheckoutAPI;
  let productsCheckout: Array<Product>;

  test.beforeEach(async ({ conf, odoo, dashboard, authRequest, page }) => {
    domain = conf.suiteConf.domain;
    quantityDone = conf.caseConf.quantity_done;
    odooService = OdooService(odoo);
    productsCheckout = conf.caseConf.product_checkout;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);

    const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: productsCheckout,
      cardInfo: conf.suiteConf.card_info,
    });

    await odooService.updateQuotation(conf.suiteConf.quotation_id, {
      validity_date: conf.suiteConf.validity_date,
    });

    orderName = checkoutInfo.order.name;
    dashboardPage = new DashboardPage(dashboard, domain);
    fulfillOrdersPage = new FulfillmentPage(dashboard, domain);
  });

  test(`@SB_SBFF_DO_3 Verify done một phần do-out khi fulfill order`, async ({ conf }) => {
    test.setTimeout(conf.suiteConf.time_out);
    await test.step(`Login dashboard store merchant > Order > Vào order detail > Fulfill order với PlusHub`, async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillOrdersPage.navigateToMenuPlusHub("Fulfillment");
      await expect(async () => {
        await fulfillOrdersPage.page.reload();
        await fulfillOrdersPage.searchOrderInFulfillmentTab(orderName);
        await expect(fulfillOrdersPage.page.locator(`//div[normalize-space()='${orderName}']`)).toBeVisible();
      }).toPass({ intervals: [120000] });
      await fulfillOrdersPage.clickFulfillSelectedOrder();
      await fulfillOrdersPage.checkAutoPurchase();
      const isCheck = await fulfillOrdersPage.isTextVisible("Checkout");
      if (isCheck) {
        await fulfillOrdersPage.clickOnBtnWithLabel("Checkout");
      }
      await fulfillOrdersPage.clickOnBtnWithLabel("Pay now");
      await expect(async () => {
        await fulfillOrdersPage.page.reload();
        await fulfillOrdersPage.navigateToFulfillmentTab("Awaiting stock");
        await fulfillOrdersPage.searchOrderInFulfillmentTab(orderName);
        await fulfillOrdersPage.removeFilterOrderPlusHub();
        await expect(fulfillOrdersPage.getLocatorOrderName(orderName)).toBeVisible();
      }).toPass();
    });

    await test.step("Login odoo > Inventory > Receipts > Search PO theo PO name > Vào detail > Validate > Apply", async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillOrdersPage.navigateToMenuPlusHub("Warehouse");
      await fulfillOrdersPage.clickOnBtnLinkWithLabel(`Purchase orders`);
      const product = conf.caseConf.product_info.name;
      await fulfillOrdersPage.searchPurchaseOrder(product);
      const stockPickingId = await fulfillOrdersPage.getStockPickingID();
      await odooService.doneStockPicking(stockPickingId);
    });

    await test.step(`Inventory > Delivery Orders > Search theo order name > Vào Do-out detail > Done một phần do-out`, async () => {
      const stockPickingIds = await odooService.getStockPickingIds(orderName);
      const stockPickingId = stockPickingIds[0];
      await odooService.checkAvailabilityStockPicking(stockPickingId);
      await odooService.donePartialStockPicking(stockPickingId, quantityDone, conf.suiteConf.tracking_number);
    });

    await test.step(`Login dashboard store merchant > Fulfilment > Verify quantity fulfill của order`, async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await fulfillOrdersPage.navigateToMenuPlusHub("Fulfillment");
      await fulfillOrdersPage.navigateToFulfillmentTab("Fulfilled");
      await fulfillOrdersPage.searchOrderInFulfillmentTab(orderName);
      await fulfillOrdersPage.removeFilterOrderPlusHub();
      await fulfillOrdersPage.page.waitForLoadState("networkidle");
      await expect(async () => {
        await fulfillOrdersPage.navigateToMenuPlusHub("Fulfillment");
        await fulfillOrdersPage.navigateToFulfillmentTab("Fulfilled");
        const quantity = await fulfillOrdersPage.getQuantityInFulfillTab();
        expect(Number(quantity)).toEqual(quantityDone);
      }).toPass();
    });
  });
});
