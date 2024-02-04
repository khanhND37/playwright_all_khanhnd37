import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { removeCurrencySymbol } from "@core/utils/string";
import { ProductAPI } from "@pages/api/product";
import { CheckoutAPI } from "@pages/api/checkout";
import type { Product, Order, ProductionSite, BaseProductInfor, VariantBaseProd, CheckoutInfo } from "@types";
import { DashboardAPI } from "@pages/api/dashboard";
import { HivePBase } from "@pages/hive/hivePBase";
import { OrdersPage } from "@pages/dashboard/orders";
import { BrowserContext, Page } from "@playwright/test";
import { isEqual } from "@core/utils/checkout";

test.describe("Production site", () => {
  let printbasePage: PrintBasePage;
  let targetMarkets: Array<string>;
  let productAPI: ProductAPI;
  let checkoutAPI: CheckoutAPI;
  let productsCheckout: Array<Product>;
  let orderInfo: Order;
  let dashboardAPI: DashboardAPI;
  let orderPage: OrdersPage;
  let hivePage: HivePBase;
  let ctx: BrowserContext;
  let newPage: Page;
  let baseCostTargetMarket: ProductionSite;
  let shippingFeeTargetMarket: ProductionSite;
  let countryList: ProductionSite;
  let baseProductInfo: BaseProductInfor;
  let supplierTargetMarket: ProductionSite;
  let variantInfo: Array<VariantBaseProd>;
  let checkoutInfo: CheckoutInfo;

  let domain: string;
  let orderId: number;
  let shippingFee: number;
  let hiveUsername: string;
  let hivePasswd: string;
  let baseProductId: number;
  let tabId: string;
  let supplierName: Array<string>;

  test.beforeEach(async ({ dashboard, conf, authRequest, page, browser }) => {
    targetMarkets = conf.suiteConf.target_market;
    domain = conf.suiteConf.domain;
    productsCheckout = conf.caseConf.products_checkout;
    supplierName = conf.caseConf.supplier_name;
    hiveUsername = conf.suiteConf.hive_info.username;
    hivePasswd = conf.suiteConf.hive_info.password;
    baseProductId = conf.caseConf.base_product_id;
    tabId = conf.caseConf.tab_id;
    baseCostTargetMarket = conf.caseConf.base_cost_target_market;
    shippingFeeTargetMarket = conf.caseConf.shipping_fee;
    countryList = conf.caseConf.country_list;
    baseProductInfo = conf.caseConf.product_info;
    supplierTargetMarket = conf.caseConf.supplier_target_market;
    variantInfo = conf.caseConf.variant;

    printbasePage = new PrintBasePage(dashboard, domain);
    productAPI = new ProductAPI(domain, authRequest);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    orderPage = new OrdersPage(printbasePage.page, domain);

    ctx = await browser.newContext();
    newPage = await ctx.newPage();
    hivePage = new HivePBase(newPage, conf.suiteConf.hive_info.domain);

    // Delete campaign draff
    await productAPI.deleteAllCampaignWithStatus("draft");
  });
  test(`@SB_PRB_PSP_14 [Dashboard shop PB] Verify hiển thị base cost, shipping fee và Estimated profit khi seller chọn target market`, async ({
    conf,
  }) => {
    await test.step(`Tại page Price & Description > Select lần lượt target market > Verify base cost và shipping fee hiển thị `, async () => {
      // Select base product and add custom option
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.addBaseProduct(baseProductInfo);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < conf.caseConf.layers.length; i++) {
        await printbasePage.addNewLayer(conf.caseConf.layers[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Continue");

      // Select target market and verify basecost
      for (const targetMarket of targetMarkets) {
        await printbasePage.clickOnBtnWithLabel(targetMarket);
        await printbasePage.selectCountry(countryList[targetMarket]);
        // Chỗ này do data shipping trên prod nhiều quá, manual cũng cần chờ 4-5s mới load đc
        await printbasePage.page.waitForTimeout(5000);
        const actBasecost = await printbasePage.getDataTable(1, 1, 2);

        const basecost = baseCostTargetMarket[targetMarket];
        expect(Number(removeCurrencySymbol(actBasecost)), basecost).toBeTruthy();

        // Verify shipping fee
        const actShippingFee = await printbasePage.getDataTable(1, 1, 3);
        const shippingFee = shippingFeeTargetMarket[targetMarket];
        expect(Number(removeCurrencySymbol(actShippingFee)), shippingFee).toBeTruthy();
      }
    });

    await test.step(`Tại Sales price > Edit sales price > Verify hiển thị estimated profit`, async () => {
      for (const targetMarket of targetMarkets) {
        await printbasePage.clickOnBtnWithLabel(targetMarket);
        await printbasePage.selectCountry(countryList[targetMarket]);
        // Chỗ này do data shipping trên prod nhiều quá, manual cũng cần chờ 4-5s mới load đc
        await printbasePage.page.waitForTimeout(5000);
        await printbasePage.inputDataInTable(
          conf.caseConf.product_info.base_product,
          "Sale price",
          `${conf.caseConf.sale_price}`,
        );
        const profitMargin = await printbasePage.calculatorProfitMargin(
          shippingFeeTargetMarket[targetMarket],
          4,
          baseCostTargetMarket[targetMarket],
          conf.suiteConf.payment_rate,
          conf.caseConf.sale_price,
        );
        const actProfitMargin = await printbasePage.getDataTable(1, 1, 6);
        expect(removeCurrencySymbol(actProfitMargin)).toEqual(profitMargin);
      }
    });

    await test.step(`Tại sales price > Edit sales price nhỏ hơn giá base cost > Verify alert hiển thị `, async () => {
      await printbasePage.inputDataInTable(
        conf.caseConf.product_info.base_product,
        "Sale price",
        `${conf.caseConf.sale_price_less_basecost}`,
      );
      expect(await printbasePage.isTextVisible(conf.suiteConf.alert)).toBeTruthy();
    });
  });

  test(`@SB_PRB_PSP_20 [Order] Verify profit của order tính đúng theo shipping fee được config trường hợp campaign setting Shipping from nearest`, async ({
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
      await hivePage.page.locator(hivePage.xpathOdooProductId).fill(conf.caseConf.odoo_product_id);
      await hivePage.page.keyboard.press("Enter");
      // Sau khi nhập odoo product id cần chờ khoảng 1-2s để load đc data supplier
      await hivePage.waitAbit(2000);
      await hivePage.selectSupplier(supplierName[0]);
      const baseCost = await hivePage.getValueContent(
        hivePage.xpathBaseCostOfBaseProduct(variantInfo[0].variant_name, variantInfo[0].option),
      );

      // Go to order detail and verify
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      const profit = await orderPage.calculateProfitAndFeesOrderPbase();
      const actBaseCost = removeCurrencySymbol(await orderPage.getBaseCost());
      expect(actBaseCost).toEqual(baseCost);

      const actShippingFee = removeCurrencySymbol(await orderPage.getShippingFee());
      expect(`${shippingFee}`).toEqual(actShippingFee);

      const actProfit = await orderPage.getOrderProfit();
      expect(isEqual(profit.profit, actProfit, 0.01)).toBeTruthy();
    });
  });

  test(`@SB_PRB_PSP_16 [Dashboard shop PB] Verify default và hiển thị base cost khi seller select Shipping from nearest`, async ({
    conf,
  }) => {
    let minBaseCost;
    await test.step(`Tại page Price & Description > Verify default option shipping preference`, async () => {
      // Select base product and add custom option
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.addBaseProduct(baseProductInfo);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < conf.caseConf.layers.length; i++) {
        await printbasePage.addNewLayer(conf.caseConf.layers[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Continue");

      // Verify default select shippment
      expect(
        await printbasePage.page
          .locator(printbasePage.xpathShipmentPreference("Shipping from nearest supplier"))
          .isChecked(),
      ).toBeTruthy();
    });

    await test.step(`Select target market > Select Shipping preference > Verify hiển thị base cost`, async () => {
      // Login hive and get base cost
      await hivePage.loginToHivePrintBase(hiveUsername, hivePasswd);
      await hivePage.goToBaseProductDetail(baseProductId, tabId);
      await hivePage.page.locator(hivePage.xpathOdooProductId).fill(conf.caseConf.odoo_product_id);
      await hivePage.page.keyboard.press("Enter");
      // Sau khi nhập odoo product id cần chờ khoảng 1-2s để load đc data supplier
      await hivePage.waitAbit(2000);
      const dataBaseCostVarWithSupp = await hivePage.getBaseCostVariantBySupplier(supplierName, variantInfo);

      // Get min base cost
      await hivePage.page.locator(hivePage.xpathDropListSupplier).click();
      const qtySupp = await hivePage.page.locator(hivePage.xpathSupplier).count();

      for (let i = 1; i <= qtySupp; i++) {
        await hivePage.page.locator(`(${hivePage.xpathSupplier})[${i}]`).click();
        const baseCost = await hivePage.getValueContent(
          hivePage.xpathBaseCostOfBaseProduct(variantInfo[0].variant_name, variantInfo[0].option),
        );
        if (i === 1) {
          minBaseCost = Number(baseCost);
        }
        minBaseCost = Number(baseCost) < minBaseCost && Number(baseCost) > 0 ? Number(baseCost) : minBaseCost;
        await hivePage.page.locator(hivePage.xpathDropListSupplier).click();
      }

      // Verify base cost in dashboard
      for (const targetMarket of targetMarkets) {
        const dataVariant = dataBaseCostVarWithSupp.get(`${variantInfo[0].variant_name} ${variantInfo[0].option}`);
        const baseCost = dataVariant.find(sup => sup.supplier === supplierTargetMarket[targetMarket]).baseCost;
        await printbasePage.clickOnBtnWithLabel(targetMarket);
        await printbasePage.selectCountry(countryList[targetMarket]);
        const actBasecost = await printbasePage.getDataTable(1, 1, 2);
        expect(isEqual(Number(removeCurrencySymbol(actBasecost)), Number(baseCost), 0.1)).toBeTruthy();
      }
    });

    await test.step(`Thực hiện thay đổi Shippment preference > Verify base cost hiển thị`, async () => {
      await printbasePage.page
        .locator(printbasePage.xpathShipmentPreference("Shipping from the lowest base cost supplier"))
        .click();
      await expect(async () => {
        const actMinBaseCost = await printbasePage.getDataTable(1, 1, 2);
        expect(Number(removeCurrencySymbol(actMinBaseCost))).toEqual(minBaseCost);
      }).toPass();
    });
  });

  test(`@SB_PRB_PSP_19 [Order] Verify base cost, profit của order trường hợp campaign được setting shipment lowest`, async ({
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
      // Get min base cost of variant
      await hivePage.loginToHivePrintBase(hiveUsername, hivePasswd);
      await hivePage.goToBaseProductDetail(baseProductId, tabId);
      await hivePage.page.locator(hivePage.xpathOdooProductId).fill(conf.caseConf.odoo_product_id);
      await hivePage.page.keyboard.press("Enter");
      // Sau khi nhập odoo product id cần chờ khoảng 1-2s để load đc data supplier
      await hivePage.waitAbit(2000);
      await hivePage.page.locator(hivePage.xpathDropListSupplier).click();
      const qtySupp = await hivePage.page.locator(hivePage.xpathSupplier).count();
      let minBaseCost;
      for (let i = 1; i <= qtySupp; i++) {
        await hivePage.page.locator(`(${hivePage.xpathSupplier})[${i}]`).click();
        const baseCost = await hivePage.getValueContent(
          hivePage.xpathBaseCostOfBaseProduct(variantInfo[0].variant_name, variantInfo[0].option),
        );
        if (i === 1) {
          minBaseCost = Number(baseCost);
        }
        minBaseCost = Number(baseCost) < minBaseCost && Number(baseCost) > 0 ? Number(baseCost) : minBaseCost;
        await hivePage.page.locator(hivePage.xpathDropListSupplier).click();
      }

      // Go to order detail and verify
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      const profit = await orderPage.calculateProfitAndFeesOrderPbase();
      const actBaseCost = removeCurrencySymbol(await orderPage.getBaseCost());
      expect(Number(actBaseCost)).toEqual(minBaseCost);

      const actProfit = await orderPage.getOrderProfit();
      expect(isEqual(profit.profit, actProfit, 0.01)).toBeTruthy();
    });
  });
});
