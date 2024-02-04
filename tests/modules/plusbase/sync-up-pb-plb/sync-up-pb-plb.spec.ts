import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { CheckoutInfo, Product } from "@types";
import { OrderAPI } from "@pages/api/order";
import { HivePBase } from "@pages/hive/hivePBase";

let shopDomain: string;
let checkoutApi: CheckoutAPI;
let shopTemplateDomain: string;
let plbTemplateDashboardPage: DashboardPage;
let orderID: number;
let ordersPage, orderTemplatePage: OrdersPage;
let orderAPI: OrderAPI;
let checkoutInfo: CheckoutInfo;
let orderIds: string;
let orderName: string;
let productsCheckout: Array<Product>;
let tplOrderApi: PlusbaseOrderAPI;
let hivePbase: HivePBase;

test.describe("Dashboard PlusHub", async () => {
  test.beforeEach(async ({ conf, authRequest, page }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain;
    checkoutApi = new CheckoutAPI(shopDomain, authRequest, page);
    shopTemplateDomain = conf.suiteConf["plb_template"]["domain"];
  });

  test(`@SB_PLB_PODPL_PODPO_54 Verify action hold với order chứa product POD và dropship khi hold cả 2 items trong order detail shop template`, async ({
    conf,
    multipleStore,
    browser,
  }) => {
    await test.step(`Vào SF > Search product > Thực hiện checkout product > Vào dashboard shop template> Vào Orders > Tại tab All > Search order vừa checkout > Đi đến order detail > Click More actions > Click Hold `, async () => {
      checkoutInfo = await checkoutApi.createAnOrderWithCreditCard({
        productsCheckout: conf.caseConf.products_checkout,
      });
      orderID = checkoutInfo.order.id;
      orderName = checkoutInfo.order.name;
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        shopTemplateDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );

      plbTemplateDashboardPage = new DashboardPage(templatePage, shopTemplateDomain);
      orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, shopTemplateDomain);
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderID);
      await orderTemplatePage.waitForProfitCalculated();

      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      hivePbase = new HivePBase(page, conf.suiteConf.domain_hive);
      await hivePbase.loginToHivePrintBase(conf.suiteConf.hive_username, conf.suiteConf.hive_password);
      await hivePbase.goToOrderDetail(orderID);
      await hivePbase.clickCalculateInOrder();
      await hivePbase.page.close();
      await orderTemplatePage.clickOnBtnWithLabel("More actions");
      await orderTemplatePage.clickElementWithLabel("span", "Hold");
      expect(await orderTemplatePage.isPopUpDisplayed("Hold order")).toBe(true);
    });

    await test.step(`Verify popup Hold`, async () => {
      for (const option of conf.suiteConf.option_hold_order) {
        expect(await orderTemplatePage.isTextVisible(option, 1)).toBe(true);
      }
      expect(await orderTemplatePage.isTickBoxChecked({ textLabel: "Both" })).toBe(true);
    });

    await test.step(`Click Hold`, async () => {
      await orderTemplatePage.clickButton("Hold");
      expect(await orderTemplatePage.isToastMsgVisible(`Hold order ${orderName} successfully`)).toBeTruthy();
    });

    await test.step(`Ở order detail > Verify tag hold hiển thị `, async () => {
      expect(await orderTemplatePage.getApproveStatus()).toEqual("On hold");
      expect(await orderTemplatePage.verifyStatusLineItem("Dropship product", "Hold")).toEqual(true);
      expect(await orderTemplatePage.verifyStatusLineItem("Pod product", "Hold")).toEqual(true);
    });

    await test.step(`Click log Activity > Verify log hold`, async () => {
      const authRequestTemplate = await multipleStore.getAuthRequest(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        shopTemplateDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      tplOrderApi = new PlusbaseOrderAPI(shopTemplateDomain, authRequestTemplate);
      await tplOrderApi.waitForLogActivity(orderID, "hold-order");
      await orderTemplatePage.page.reload();
      await orderTemplatePage.page.click(orderTemplatePage.xpathTabActivity);
      await expect(
        orderTemplatePage.page.locator(
          orderTemplatePage.xpathActivityLog(0, conf.suiteConf.plb_template["username"]).activityHoldOrder,
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_PLB_PODPL_PODPO_55 Verify action hold với order chứa product POD và dropship khi hold cả 2 items trong order list shop template`, async ({
    dashboard,
    conf,
    multipleStore,
    authRequest,
    browser,
  }) => {
    const orderList = [];
    productsCheckout = conf.caseConf.products_checkout;

    await test.step(`Vào SF > Search product > Thực hiện checkout tạo 3 order , mỗi order có 2 item : dropship & POD > Vào dashboard shop template> Vào Orders > Tại tab All > Select mutiple order vừa checkout > Click Actions > Click Hold `, async () => {
      for (let i = 0; i < conf.caseConf.number_order; i++) {
        checkoutInfo = await checkoutApi.createAnOrderWithCreditCard({ productsCheckout: productsCheckout });
        orderList.push(checkoutInfo);
        orderIds = i < 1 ? `${checkoutInfo.order.id}` : `${orderIds},${checkoutInfo.order.id}`;
        expect(checkoutInfo.order.id).toBeGreaterThan(0);
      }

      ordersPage = new OrdersPage(dashboard, shopDomain);
      orderAPI = new OrderAPI(shopDomain, authRequest);
      for (const order of orderList) {
        await ordersPage.goToOrderByOrderId(order.order.id);
        await orderAPI.getOrderProfit(Number(order.order.id), "plusbase", true);
      }
      //vào hive-pbase calculate order
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      hivePbase = new HivePBase(page, conf.suiteConf.domain_hive);
      await hivePbase.loginToHivePrintBase(conf.suiteConf.hive_username, conf.suiteConf.hive_password);
      for (const order of orderList) {
        await hivePbase.goToOrderDetail(order.order.id);
        await hivePbase.clickCalculateInOrder();
      }
      await hivePbase.page.close();

      //Vào shop template : hold order
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        shopTemplateDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );

      plbTemplateDashboardPage = new DashboardPage(templatePage, shopTemplateDomain);
      const authRequestTemplate = await multipleStore.getAuthRequest(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        shopTemplateDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      tplOrderApi = new PlusbaseOrderAPI(shopTemplateDomain, authRequestTemplate);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, shopTemplateDomain);
      await orderTemplatePage.searchMutipleOrders(orderIds);
      await orderTemplatePage.page.click(orderTemplatePage.xpathSelectAllOrder);
      await orderTemplatePage.clickElementWithLabel("span", "Actions");
      await orderTemplatePage.clickElementWithLabel("span", "Hold");
      expect(await orderTemplatePage.isPopUpDisplayed("Hold order")).toBe(true);
    });

    await test.step(`Verify popup Hold`, async () => {
      for (const option of conf.suiteConf.option_hold_order) {
        expect(await orderTemplatePage.isTextVisible(option, 1)).toBe(true);
      }
      expect(await orderTemplatePage.isTickBoxChecked({ textLabel: "Both" })).toBe(true);
    });

    await test.step(`Click Hold`, async () => {
      //Trên dev cần wait để get được hết order, click nhanh quá không get được hết
      if (process.env.ENV == "dev") {
        await orderTemplatePage.page.waitForTimeout(5 * 1000);
      }
      await orderTemplatePage.clickButton("Hold");
      expect(
        await orderTemplatePage.isToastMsgVisible(`Hold ${conf.caseConf.number_order} orders successfully`),
      ).toBeTruthy();
    });

    await test.step(`Ở order detail từng order > Verify tag hold hiển thị `, async () => {
      for (const order of orderList) {
        await orderTemplatePage.goToOrderStoreTemplateByOrderId(order.order.id);
        expect(await orderTemplatePage.getApproveStatus()).toEqual("On hold");
        expect(await orderTemplatePage.verifyStatusLineItem("Dropship product", "Hold")).toEqual(true);
        expect(await orderTemplatePage.verifyStatusLineItem("Pod product", "Hold")).toEqual(true);
        await tplOrderApi.waitForLogActivity(order.order.id, "hold-order");
        await orderTemplatePage.page.reload();
        await orderTemplatePage.page.click(orderTemplatePage.xpathTabActivity);
        await expect(
          orderTemplatePage.page.locator(
            orderTemplatePage.xpathActivityLog(0, conf.suiteConf.plb_template["username"]).activityHoldOrder,
          ),
        ).toBeVisible();
      }
    });
  });

  test(`@SB_PLB_PODPL_PODPO_57 Verify action hold với order chứa product POD và dropship khi chỉ hold POD item trong order list shop template`, async ({
    dashboard,
    conf,
    multipleStore,
    authRequest,
    browser,
  }) => {
    const orderList = [];
    productsCheckout = conf.caseConf.products_checkout;

    await test.step(`Vào SF > Search product > Thực hiện checkout tạo 3 order> Vào dashboard > Vào Orders > Tại tab All > Select 3 order vừa checkout > Click Actions > Click Hold `, async () => {
      for (let i = 0; i < conf.caseConf.number_order; i++) {
        checkoutInfo = await checkoutApi.createAnOrderWithCreditCard({ productsCheckout: productsCheckout });
        orderList.push(checkoutInfo);
        orderIds = i < 1 ? `${checkoutInfo.order.id}` : `${orderIds},${checkoutInfo.order.id}`;
        expect(checkoutInfo.order.id).toBeGreaterThan(0);
      }

      ordersPage = new OrdersPage(dashboard, shopDomain);
      orderAPI = new OrderAPI(shopDomain, authRequest);
      for (const order of orderList) {
        await ordersPage.goToOrderByOrderId(order.order.id);
        await orderAPI.getOrderProfit(Number(order.order.id), "plusbase", true);
      }

      //vào hive-pbase calculate order
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      hivePbase = new HivePBase(page, conf.suiteConf.domain_hive);
      await hivePbase.loginToHivePrintBase(conf.suiteConf.hive_username, conf.suiteConf.hive_password);
      for (const order of orderList) {
        await hivePbase.goToOrderDetail(order.order.id);
        await hivePbase.clickCalculateInOrder();
      }
      await hivePbase.page.close();

      //vào shop template hold order
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        shopTemplateDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );

      plbTemplateDashboardPage = new DashboardPage(templatePage, shopTemplateDomain);
      const authRequestTemplate = await multipleStore.getAuthRequest(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        shopTemplateDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      tplOrderApi = new PlusbaseOrderAPI(shopTemplateDomain, authRequestTemplate);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, shopTemplateDomain);
      await orderTemplatePage.searchMutipleOrders(orderIds);
      await orderTemplatePage.page.click(orderTemplatePage.xpathSelectAllOrder);
      await orderTemplatePage.clickElementWithLabel("span", "Actions");
      await orderTemplatePage.clickElementWithLabel("span", "Hold");
      expect(await orderTemplatePage.isPopUpDisplayed("Hold order")).toBe(true);
    });

    await test.step(`Verify popup Hold`, async () => {
      for (const option of conf.suiteConf.option_hold_order) {
        expect(await orderTemplatePage.isTextVisible(option, 1)).toBe(true);
      }
      expect(await orderTemplatePage.isTickBoxChecked({ textLabel: "Both" })).toBe(true);
    });

    await test.step(`Click Hold`, async () => {
      await orderTemplatePage.clickRadioButtonWithLabel("POD product", 1);
      await orderTemplatePage.clickButton("Hold");
      expect(
        await orderTemplatePage.isToastMsgVisible(`Hold ${conf.caseConf.number_order} orders successfully`),
      ).toBeTruthy();
    });

    await test.step(`Ở order detail từng order > Verify tag hold hiển thị, log hold `, async () => {
      for (const order of orderList) {
        await orderTemplatePage.goToOrderStoreTemplateByOrderId(order.order.id);
        expect(await orderTemplatePage.getApproveStatus()).toEqual("On hold");
        expect(await orderTemplatePage.verifyStatusLineItem("Pod product", "Hold")).toEqual(true);
        await tplOrderApi.waitForLogActivity(order.order.id, "hold-order");
        await orderTemplatePage.page.reload();
        await orderTemplatePage.page.click(orderTemplatePage.xpathTabActivity);
        await expect(
          orderTemplatePage.page.locator(
            orderTemplatePage.xpathActivityLog(0, conf.suiteConf.plb_template["username"]).activityHoldLinePOD,
          ),
        ).toBeVisible();
      }
    });
  });
});
