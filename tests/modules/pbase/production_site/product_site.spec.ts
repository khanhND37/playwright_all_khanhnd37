import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import type { CheckoutInfo, Product, Order } from "@types";
import { DashboardAPI } from "@pages/api/dashboard";
import { HivePBase } from "@pages/hive/hivePBase";
import { OrdersPage } from "@pages/dashboard/orders";
import { BrowserContext, Page } from "@playwright/test";
import { isEqual } from "@core/utils/checkout";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Production site", () => {
  let checkoutAPI: CheckoutAPI;
  let productsCheckout: Array<Product>;
  let orderInfo: Order;
  let dashboardAPI: DashboardAPI;
  let orderPage: OrdersPage;
  let hivePage: HivePBase;
  let ctx: BrowserContext;
  let newPage: Page;

  let domain: string;
  let orderId: number;
  let shippingFee: number;
  let suppliersName: string[];
  let hiveUsername: string;
  let hivePasswd: string;
  let baseProductId: number;
  let tabId: string;
  let sfcheckout: SFCheckout;
  let orderInfoAfterCkout: CheckoutInfo;
  let checkoutInfo: CheckoutInfo;

  test.beforeEach(async ({ dashboard, conf, authRequest, page, browser }) => {
    domain = conf.suiteConf.domain;
    productsCheckout = conf.caseConf.products_checkout;
    suppliersName = conf.caseConf.supplier_name;
    hiveUsername = conf.suiteConf.hive_info.username;
    hivePasswd = conf.suiteConf.hive_info.password;
    baseProductId = conf.caseConf.base_product_id;
    tabId = conf.caseConf.tab_id;

    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);
    ctx = await browser.newContext();
    newPage = await ctx.newPage();
    hivePage = new HivePBase(newPage, conf.suiteConf.hive_info.domain);
    sfcheckout = new SFCheckout(checkoutAPI.page, domain);
  });
  test(`@SB_PRB_PSP_21 [Order] Verify profit của order khi order có 2 variant được fulfill bằng 2 supplier khác nhau`, async ({
    conf,
  }) => {
    await test.step(`Checkout campaign`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
      });
      orderId = checkoutInfo.order.id;

      await expect(async () => {
        orderInfo = await dashboardAPI.getOrderInfoByApi(orderId, "Printbase");
        expect(orderInfo.pbase_order.profit).toBeGreaterThan(0);
      }).toPass();
      shippingFee = checkoutInfo.totals.shipping_fee;
    });

    await test.step(`Vào shop PB > Orders > Đi đến order detail order vừa checkout > Verify shipping fee, base cost, profit order`, async () => {
      // Get base cost of base product on hive PB
      let baseCost = 0;
      await hivePage.loginToHivePrintBase(hiveUsername, hivePasswd);
      await hivePage.goToBaseProductDetail(baseProductId, tabId);
      await hivePage.page.locator(hivePage.xpathOdooProductId).fill(conf.caseConf.odoo_product_id);
      await hivePage.page.keyboard.press("Enter");
      // Sau khi nhập odoo product id cần chờ khoảng 1-2s để load đc data supplier
      await hivePage.waitAbit(2000);
      for (const supplierName of suppliersName) {
        await hivePage.selectSupplier(supplierName);
        const baseCostSupp = await hivePage.getValueContent(
          hivePage.xpathBaseCostOfBaseProduct(
            conf.caseConf[supplierName].variant_name,
            conf.caseConf[supplierName].option,
          ),
        );
        baseCost = baseCost + Number(baseCostSupp);
      }

      // Go to order detail and verify
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      const profit = await orderPage.calculateProfitAndFeesOrderPbase();
      const actBaseCost = removeCurrencySymbol(await orderPage.getBaseCost());
      expect(actBaseCost).toEqual(`${baseCost}`);
      const actShippingFee = removeCurrencySymbol(await orderPage.getShippingFee());
      expect(`${shippingFee}`).toEqual(actShippingFee);
      const actProfit = await orderPage.getOrderProfit();
      expect(isEqual(profit.profit, actProfit, 0.01)).toBeTruthy();
    });
  });

  test(`@SB_PRB_PSP_22 [Order] Verify profit của order trong trường hợp checkout đến country không có supplier, fulfill được 2nd nearest zone`, async ({
    conf,
  }) => {
    await test.step(`Checkout campaign`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
      });
      orderId = checkoutInfo.order.id;

      await expect(async () => {
        orderInfo = await dashboardAPI.getOrderInfoByApi(orderId, "Printbase");
        expect(orderInfo.pbase_order.profit).toBeGreaterThan(0);
      }).toPass();

      shippingFee = checkoutInfo.totals.shipping_fee;
    });

    await test.step(`Vào shop PB > Orders > Đi đến order detail order vừa checkout > Verify shipping fee, base cost, profit order`, async () => {
      await hivePage.loginToHivePrintBase(hiveUsername, hivePasswd);
      await hivePage.goToBaseProductDetail(baseProductId, tabId);
      await hivePage.page.locator(hivePage.xpathOdooProductId).fill(conf.caseConf.odoo_product_id);
      await hivePage.page.keyboard.press("Enter");
      // Sau khi nhập odoo product id cần chờ khoảng 1-2s để load đc data supplier
      await hivePage.waitAbit(2000);
      await hivePage.selectSupplier(suppliersName[0]);
      const baseCostSupp = await hivePage.getValueContent(
        hivePage.xpathBaseCostOfBaseProduct(
          conf.caseConf[suppliersName[0]].variant_name,
          conf.caseConf[suppliersName[0]].option,
        ),
      );
      const baseCost = Number(baseCostSupp);

      // Go to order detail and verify
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      const profit = await orderPage.calculateProfitAndFeesOrderPbase();
      const actBaseCost = removeCurrencySymbol(await orderPage.getBaseCost());
      expect(actBaseCost).toEqual(`${baseCost}`);
      const actShippingFee = removeCurrencySymbol(await orderPage.getShippingFee());
      expect(`${shippingFee}`).toEqual(actShippingFee);
      const actProfit = await orderPage.getOrderProfit();
      expect(isEqual(profit.profit, actProfit, 0.01)).toBeTruthy();
    });
  });

  test(`@SB_PRB_PSP_23 [Order] Verify profit của order trong trường hợp checkout đến country không có supplier, không có supplier 2nd thỏa mãn`, async ({
    conf,
  }) => {
    await test.step(`Checkout campaign`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
      });
      orderId = checkoutInfo.order.id;

      await expect(async () => {
        orderInfo = await dashboardAPI.getOrderInfoByApi(orderId, "Printbase");
        expect(orderInfo.pbase_order.profit).toBeGreaterThan(0);
      }).toPass();

      shippingFee = checkoutInfo.totals.shipping_fee;
    });

    await test.step(`Vào shop PB > Orders > Đi đến order detail order vừa checkout > Verify shipping fee, base cost, profit order`, async () => {
      // Get base cost of base product on hive PB
      await hivePage.loginToHivePrintBase(hiveUsername, hivePasswd);
      await hivePage.goToBaseProductDetail(baseProductId, tabId);
      const baseCostDefault = await hivePage.getValueContent(
        hivePage.xpathBaseCostOfBaseProduct(conf.caseConf.variant.variant_name, conf.caseConf.variant.option),
      );
      const baseCost = Number(baseCostDefault);

      // Go to order detail and verify
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      const profit = await orderPage.calculateProfitAndFeesOrderPbase();
      const actBaseCost = removeCurrencySymbol(await orderPage.getBaseCost());
      expect(actBaseCost).toEqual(`${baseCost}`);
      const actShippingFee = removeCurrencySymbol(await orderPage.getShippingFee());
      expect(`${shippingFee}`).toEqual(actShippingFee);
      const actProfit = await orderPage.getOrderProfit();
      expect(isEqual(profit.profit, actProfit, 0.01)).toBeTruthy();
    });
  });

  test(`@SB_PRB_PSP_24 [Order] Verify profit của order trong trường hợp có add product upsell, được fulfil bằng supplier khác với product checkout`, async ({
    conf,
  }) => {
    const productTarget = conf.caseConf.product_target;
    const productRecomment = conf.caseConf.product_recomment;

    await test.step(`Checkout campaign > Add product upsell`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productsCheckout);
      await checkoutAPI.updateCustomerInformation();
      await checkoutAPI.openCheckoutPageByToken();
      await sfcheckout.page.locator(sfcheckout.xpathFooterSF).scrollIntoViewIfNeeded();
      await sfcheckout.completeOrderWithMethod("Stripe");
      expect(await sfcheckout.isTextVisible(conf.caseConf.product_ppc)).toBeTruthy();
      await sfcheckout.addProductPostPurchase(conf.caseConf.product_ppc);
      expect(await sfcheckout.isTextVisible(`Your order is confirmed`)).toBeTruthy();

      await expect(async () => {
        orderInfoAfterCkout = await checkoutAPI.getCheckoutInfo();
        expect(orderInfoAfterCkout.order.id).toBeGreaterThan(1);
      }).toPass();
    });

    await test.step(`Vào shop PB > Orders > Đi đến order detail order vừa checkout > Verify shipping fee, base cost, profit order`, async () => {
      await hivePage.loginToHivePrintBase(hiveUsername, hivePasswd);
      const baseCostProdTarget = await hivePage.getBaseCostWithVariantAndSup(
        productTarget.supplier_name,
        productTarget.variant,
        tabId,
        productTarget.base_product_id,
        `${productTarget.variant[0].variant_name} ${productTarget.variant[0].option}`,
        productTarget.supplier_name[0],
        conf.caseConf.odoo_product_id,
      );

      const baseCostProdRecomment = await hivePage.getBaseCostWithVariantAndSup(
        productRecomment.supplier_name,
        productRecomment.variant,
        tabId,
        productRecomment.base_product_id,
        `${productRecomment.variant[0].variant_name} ${productRecomment.variant[0].option}`,
        productRecomment.supplier_name[0],
        conf.caseConf.odoo_product_id,
      );

      const totalBaseCost = baseCostProdRecomment + baseCostProdTarget;
      await orderPage.goToOrderByOrderId(orderInfoAfterCkout.order.id, "pbase");
      await orderPage.waitForProfitCalculated();
      const profit = await orderPage.calculateProfitAndFeesOrderPbase();
      const actBaseCost = removeCurrencySymbol(await orderPage.getBaseCost());
      expect(actBaseCost).toEqual(`${totalBaseCost}`);
      const actShippingFee = removeCurrencySymbol(await orderPage.getShippingFee());
      expect(`${orderInfoAfterCkout.totals.total_shipping}`).toEqual(actShippingFee);
      const actProfit = await orderPage.getOrderProfit();
      expect(isEqual(profit.profit, actProfit, 0.01)).toBeTruthy();
    });
  });
});
