import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { AccountPage } from "@pages/dashboard/accounts";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { OdooService } from "@services/odoo";

let orderNumber: string;

test.describe("Create contest @SB_HSB_TKN_1", async () => {
  test("Verify Generate Yun tracking tool in Hive @SB_HSB_TKN_1", async ({ hiveSBase, conf, page, odoo }) => {
    const hiveShBase = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
    const accountPage = new AccountPage(page, conf.suiteConf["shopTemplate"]);
    const dashboardPage = new DashboardPage(page, conf.suiteConf["shoptemplate"]);
    const ordersPage = new OrdersPage(page, conf.suiteConf["shoptemplate"]);
    const homepage = new SFHome(page, conf.suiteConf["domain_plusbase"]);
    const fulfillmentPage = new FulfillmentPage(page, conf.suiteConf["shoptemplate"]);

    const products = conf.caseConf.dataProduct;
    const datacheckout = conf.suiteConf.dataCheckout;
    const id = OdooService(odoo);

    let productPage: SFProduct;
    let checkoutPage: SFCheckout;

    await test.step("create new order", async () => {
      orderNumber = await ordersPage.createNewOrder(homepage, productPage, checkoutPage, products, datacheckout);
    });
    await test.step("go to order detail", async () => {
      await accountPage.login({
        email: conf.suiteConf["ops.name"],
        password: conf.suiteConf["ops.pwd"],
      });
      await dashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(orderNumber);
    });
    await test.step("Approve order plusbase", async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const expectResult = await ordersPage.getApproveStatus();
      await expect(expectResult).toEqual("Approved");
    });
    await test.step("fulfill order plusbase from order detail", async () => {
      await ordersPage.clickButton("PlusHub");
      await fulfillmentPage.removeFilterOrderPlusBase();
      await fulfillmentPage.clickFulfillSelectedOrder();
      await fulfillmentPage.clickButton("Confirm");
    });
    await test.step(`Tại màn Generate Yun Tracking, fill picking ID"+
        click button Gen tracking`, async () => {
      await hiveShBase.goToGenYunTrackingTool();
      const pickingIds = await id.getStockPickingIds(orderNumber);
      const pickingId = pickingIds[0];
      await hiveShBase.page.locator("//textarea[@id='form_picking_ids']").fill(pickingId[0].toString());
      await hiveShBase.page.locator("//button[@type='submit']").click();
      expect(await hiveShBase.page.locator(`//div[@class='alert alert-success ']`).textContent()).toContain(
        "Submitted request to generate Yun tracking id!",
      );
    });
    await test.step("Verify Tracking number được Gen thành công", async () => {
      await dashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(orderNumber);
      await expect(page.locator(`//div[text()[normalize-space()='Tracking number:']]`)).toBeVisible();
    });
  });
});
