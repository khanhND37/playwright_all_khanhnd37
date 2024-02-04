import { expect, request } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { OrderAPI } from "@pages/api/order";
import type { CheckoutInfo, Product, DataAnalytics, Tip, ProductInfo } from "@types";
import { removeCurrencySymbol } from "@core/utils/string";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { isEqual } from "@core/utils/checkout";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { DashboardAPI } from "@pages/api/dashboard";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { BrowserContext, Page } from "@playwright/test";
import { ProductPage } from "@pages/dashboard/products";
import { ProductAPI } from "@pages/api/product";
import { OdooService, OdooServiceInterface } from "@services/odoo";

let shopDomain: string;
let plbTemplateShopDomain: string;
let alertMessInOrder: string;
let alertMessInProdLine: string;
let timeline: string;
let orderId: number;
let paymentFeeRate: number;
let processingFeeRate: number;
let today: string;
let shopId: string;
let timeOut: number;
let availableSoonBefore: number;
let availableSoonAfter: number;
let actProfit: number;
let baseCost: number;
let actBaseCost: number;
let shippingFee: number;
let subtotal: number;
let shippingCost: number;
let discount: string;
let totalDiscount: number;
let plbToken: string;
let orderName: string;
let errorMess: string;
let indexProdCheckout: number;
let profitStatus: string;
let fulfillmentStatus: string;
let origProfit: string;
let productName: string;
let productId: number;
let qtyAfter: number;
let qtyBefore: number;
let alertMessInProductDetail: string;

let analyticsPage: AnalyticsPage;
let dataAnalyticsBefore: DataAnalytics;
let dataAnalyticsAfter: DataAnalytics;
let initData: DataAnalytics;
let checkoutAPI: CheckoutAPI;
let orderPage: OrdersPage;
let orderApi: OrderAPI;
let checkoutInfo: CheckoutInfo;
let infoProduct: Array<Product>;
let balanceAPI: BalanceUserAPI;
let dashboardAPI: DashboardAPI;
let tip: Tip;
let plbTemplateDashboardPage: DashboardPage;
let fulfillmentPage: FulfillmentPage;
let plbTemplateOrderAPI: PlusbaseOrderAPI;
let newPage: Page;
let ctx: BrowserContext;
let productPage: ProductPage;
let productAPI: ProductAPI;
let odooService: OdooServiceInterface;

test.describe("Communication for seller when product Ali update", async () => {
  test.beforeEach(async ({ dashboard, conf, authRequest, page, browser, odoo }) => {
    test.setTimeout(conf.suiteConf.timeout);
    shopDomain = conf.suiteConf.domain;
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    alertMessInOrder = conf.caseConf.alert_message_in_order_detail;
    alertMessInProductDetail = conf.caseConf.alert_message_in_product_detail;
    alertMessInProdLine = conf.caseConf.alert_message_in_product_line;
    timeline = conf.caseConf.timeline;
    infoProduct = conf.suiteConf.info_product.productsCheckout;
    paymentFeeRate = conf.suiteConf.payment_fee_rate;
    processingFeeRate = conf.suiteConf.processing_fee_rate;
    shopId = conf.suiteConf.shop_id;
    initData = conf.suiteConf.data_analytics;
    timeOut = conf.suiteConf.time_out_api_calling;
    baseCost = conf.caseConf.base_cost;
    discount = conf.caseConf.info_product?.discount_code;
    tip = conf.caseConf.info_product?.tip;
    errorMess = conf.caseConf.error_message;
    indexProdCheckout = conf.caseConf.index_prod_checkout;
    profitStatus = conf.caseConf.profit_status;
    fulfillmentStatus = conf.suiteConf.fulfillment_status;
    origProfit = conf.suiteConf.orig_profit;
    productName = conf.caseConf.product_name;
    productId = conf.caseConf.product_id;

    checkoutAPI = new CheckoutAPI(shopDomain, authRequest, page);
    orderApi = new OrderAPI(shopDomain, authRequest);
    orderPage = new OrdersPage(dashboard, shopDomain);
    balanceAPI = new BalanceUserAPI(shopDomain, authRequest);
    dashboardAPI = new DashboardAPI(shopDomain, authRequest, orderPage.page);
    productPage = new ProductPage(dashboard, shopDomain);
    productAPI = new ProductAPI(shopDomain, authRequest);

    ctx = await browser.newContext();
    newPage = await ctx.newPage();

    plbTemplateDashboardPage = new DashboardPage(newPage, plbTemplateShopDomain);
    fulfillmentPage = new FulfillmentPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
    const context = await request.newContext();
    plbTemplateOrderAPI = new PlusbaseOrderAPI(plbTemplateShopDomain, context);

    plbToken = await plbTemplateDashboardPage.getAccessToken({
      shopId: conf.suiteConf.plb_template["shop_id"],
      userId: conf.suiteConf.plb_template["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf.plb_template["username"],
      password: conf.suiteConf.plb_template["password"],
    });
    odooService = OdooService(odoo);
  });

  test(`@SB_PLB_CSP_05 Verify profit, alert hiển thị trong order với trường hợp profit < 0`, async ({}) => {
    await test.step(`Thực hiện checkout`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
      });
      orderId = checkoutInfo.order.id;
    });

    await test.step(`Vào Dashboard store > Orders > Đi đến order detail > Verify alert trong order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      expect(await orderPage.isTextVisible(alertMessInOrder)).toBeTruthy();
      expect(await orderPage.isTextVisible(alertMessInProdLine)).toBeTruthy();

      // Wait until order auto cancelled then verify timeline
      await expect(async () => {
        await orderPage.page.reload();
        expect(await orderPage.isTextVisible("Cancelled")).toBeTruthy();
      }).toPass();

      const actTimeLineList = await orderApi.getTimelineList(orderId);
      expect(actTimeLineList.includes(timeline)).toBeTruthy();
    });
  });

  test(`@SB_PLB_CSP_06 Verify profit của order với SO đã sent và chưa expired, shipping type khác AliExpress`, async ({
    page,
    authRequest,
  }) => {
    await test.step(`Thực hiện checkout `, async () => {
      // Get data available soon before checkout
      availableSoonBefore = (await balanceAPI.getDataBalance()).available_soon;

      // Get data analytics before checkout
      analyticsPage = new AnalyticsPage(page, shopDomain, authRequest);
      today = await analyticsPage.formatDate(await analyticsPage.getDateXDaysAgo(0));
      dataAnalyticsBefore = await analyticsPage.getDataAnalyticsAPIDashboard(
        authRequest,
        shopId,
        today,
        initData,
        "total_profit",
      );

      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
      });
      orderId = checkoutInfo.order.id;
    });

    await test.step(`Vào Order detail > Verify profit của order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderPage.clickShowCalculation();

      actBaseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      expect(baseCost).toEqual(actBaseCost);
      shippingFee = Number(removeCurrencySymbol(await orderPage.getShippingFee()));
      subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
      expect(isEqual(subtotal, checkoutInfo.totals.subtotal_price, 0.1)).toBeTruthy();

      shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      actProfit = Number(removeCurrencySymbol(await orderPage.getProfit()));

      const taxInclude = 0;
      orderPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        subtotal,
        checkoutInfo.totals.total_discounts,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        checkoutInfo.totals.total_tipping,
        paymentFeeRate,
        processingFeeRate,
      );
      expect(isEqual(Number(removeCurrencySymbol(await orderPage.getProfit())), orderPage.profit, 0.01)).toEqual(true);
    });

    await test.step(`Vào Analytics > Verify Total profit`, async () => {
      // Get data analytics afer checkout
      dataAnalyticsAfter = await analyticsPage.validateDataChanges(
        dataAnalyticsBefore,
        initData,
        authRequest,
        shopId,
        today,
        timeOut,
        "total_profit",
        true,
      );
      expect(
        isEqual(dataAnalyticsAfter.summary.total_profit, dataAnalyticsBefore.summary.total_profit + actProfit, 0.01),
      ).toEqual(true);
    });

    await test.step(`Vào Balance > Verify Invoices, Transaction`, async () => {
      // Get data available soon after checkout then verrify
      await expect(async () => {
        availableSoonAfter = (await balanceAPI.getDataBalance()).available_soon;
        expect(availableSoonAfter).toBeGreaterThan(availableSoonBefore);
      }).toPass();
      expect(availableSoonAfter).toEqual(Number((availableSoonBefore + actProfit).toFixed(2)));

      // verify invoice transaction
      if (!(await orderPage.isTextVisible("View invoice"))) {
        await orderPage.page.reload();
      }
      await orderPage.viewInvoice();
      const listTransAmt = await dashboardAPI.getOrderTransAmt();
      let totalTransAmt = 0;
      for (let i = 0; i < listTransAmt.length; i++) {
        totalTransAmt += listTransAmt[i];
      }
      expect(totalTransAmt).toEqual(actProfit);
    });
  });

  test(`@SB_PLB_CSP_09 Verify profit của order với SO chưa sent và chưa expired, shipping type khác AliExpress`, async ({}) => {
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
        discount: discount,
      });
      orderId = checkoutInfo.order.id;
    });

    await test.step(`Vào Order detail > Verify profit của order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderPage.clickShowCalculation();

      actBaseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      expect(baseCost).toEqual(actBaseCost);
      shippingFee = Number(removeCurrencySymbol(await orderPage.getShippingFee()));
      totalDiscount = Number(removeCurrencySymbol((await orderPage.getDiscountVal()).replace("-", "")));
      expect(totalDiscount).toEqual(checkoutInfo.totals.total_discounts);
      subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
      expect(isEqual(subtotal, checkoutInfo.totals.subtotal_price + totalDiscount, 0.1)).toBeTruthy();
      shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      actProfit = Number(removeCurrencySymbol(await orderPage.getProfit()));

      const taxInclude = 0;
      orderPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        subtotal,
        checkoutInfo.totals.total_discounts,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        checkoutInfo.totals.total_tipping,
        paymentFeeRate,
        processingFeeRate,
      );
      expect(isEqual(Number(removeCurrencySymbol(await orderPage.getProfit())), orderPage.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_PLB_CSP_10 [SO đã sent/ Shipping = Ali] Verify profit, analytics, balance,invoices, transaction khi order không chứa product vi phạm`, async ({
    authRequest,
    page,
    conf,
  }) => {
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      // Get data available soon before checkout
      availableSoonBefore = (await balanceAPI.getDataBalance()).available_soon;

      // Get data analytics before checkout
      analyticsPage = new AnalyticsPage(page, shopDomain, authRequest);
      today = await analyticsPage.formatDate(await analyticsPage.getDateXDaysAgo(0));
      dataAnalyticsBefore = await analyticsPage.getDataAnalyticsAPIDashboard(
        authRequest,
        shopId,
        today,
        initData,
        "total_profit",
      );

      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
        discount: discount,
        tipping: tip,
      });
      orderId = checkoutInfo.order.id;
    });

    await test.step(`Vào Dashboard, verify profit hiển thị trong order detail, analytics`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderPage.clickShowCalculation();

      // Verify profit
      actBaseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      const productProduct = await odooService.getDataAllprice(conf.caseConf.shipping_rates_id);
      baseCost = productProduct.ali_cost;
      expect(baseCost).toEqual(actBaseCost);

      shippingFee = Number(removeCurrencySymbol(await orderPage.getShippingFee()));
      totalDiscount = Number(removeCurrencySymbol((await orderPage.getDiscountVal()).replace("-", "")));
      expect(isEqual(totalDiscount, checkoutInfo.totals.total_discounts, 0.1)).toBeTruthy();

      subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
      expect(isEqual(checkoutInfo.totals.subtotal_price + totalDiscount, subtotal, 0.1)).toBeTruthy();

      shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      actProfit = Number(removeCurrencySymbol(await orderPage.getProfit()));

      const actTip = Number(removeCurrencySymbol(await orderPage.getTip()));
      expect(actTip).toEqual(Number(checkoutInfo.totals.total_tipping.toFixed(2)));

      const taxInclude = 0;
      orderPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        subtotal,
        checkoutInfo.totals.total_discounts,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        actTip,
        paymentFeeRate,
        processingFeeRate,
      );
      expect(isEqual(Number(removeCurrencySymbol(await orderPage.getProfit())), orderPage.profit, 0.01)).toEqual(true);

      // Get data analytics afer checkout then verify
      dataAnalyticsAfter = await analyticsPage.validateDataChanges(
        dataAnalyticsBefore,
        initData,
        authRequest,
        shopId,
        today,
        timeOut,
        "total_profit",
        true,
      );
      expect(
        isEqual(dataAnalyticsAfter.summary.total_profit, dataAnalyticsBefore.summary.total_profit + actProfit, 0.01),
      ).toEqual(true);
    });

    await test.step(`Vào balance > Verify Invoices, Transaction`, async () => {
      // Get data available soon after checkout then verrify
      await expect(async () => {
        availableSoonAfter = (await balanceAPI.getDataBalance()).available_soon;
        expect(availableSoonAfter).toBeGreaterThan(availableSoonBefore);
      }).toPass();
      expect(availableSoonAfter).toEqual(Number((availableSoonBefore + actProfit).toFixed(2)));
    });
  });

  test(`@SB_PLB_CSP_07 Verify profit của order với SO có shipping type khác AliExpress đã Notify và bị expired, SO được duplicate`, async ({}) => {
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      // On tax include
      await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: true });

      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
        discount: discount,
        tipping: tip,
      });
      orderId = checkoutInfo.order.id;
    });

    await test.step(`Vào Dashboard > Orders > All orders > Search và verify profit hiển thị trong order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderPage.clickShowCalculation();

      // Verify profit
      actBaseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      expect(baseCost).toEqual(actBaseCost);

      shippingFee = Number(removeCurrencySymbol(await orderPage.getShippingFee()));
      totalDiscount = Number(removeCurrencySymbol((await orderPage.getDiscountVal()).replace("-", "")));
      expect(isEqual(totalDiscount, checkoutInfo.totals.total_discounts, 0.1)).toBeTruthy();

      subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
      expect(isEqual(subtotal, checkoutInfo.totals.subtotal_price + totalDiscount, 0.1)).toBeTruthy();

      shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      actProfit = Number(removeCurrencySymbol(await orderPage.getProfit()));

      const actTip = Number(removeCurrencySymbol(await orderPage.getTip()));
      expect(actTip).toEqual(Number(checkoutInfo.totals.total_tipping.toFixed(2)));

      let taxInclude = 0;
      const tax = Number(removeCurrencySymbol(await orderPage.getTax()));
      const taxDesciption = await orderPage.getTaxDesciption();
      if (taxDesciption.includes("include")) {
        taxInclude = tax;
      }
      orderPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        subtotal,
        checkoutInfo.totals.total_discounts,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        actTip,
        paymentFeeRate,
        processingFeeRate,
      );
      expect(isEqual(Number(removeCurrencySymbol(await orderPage.getProfit())), orderPage.profit, 0.01)).toEqual(true);

      // Off tax include, on tax exclude
      await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: false });
    });
  });

  test(`@SB_PLB_CSP_31 Verify UI màn Fulfillment PlusHub`, async ({ conf, multipleStore }) => {
    const authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );
    const orderTplAPI = new OrderAPI(plbTemplateShopDomain, authRequestTpl);
    await test.step(`Login vào shop template > Fulfillment > PlusHub > Verify UI màn Fulfillment PlusHub`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.goToPlusHubFulfillment({ dirrect: true });
      await fulfillmentPage.navigateToFulfillmentTab("Need to review");
      await fulfillmentPage.page.locator(fulfillmentPage.xpathBtnChangeMapping).isEnabled();
      expect(await fulfillmentPage.isTextVisible("SHIPPING")).toBeFalsy();
      expect(await fulfillmentPage.isTextVisible("SELLER RESPONSE")).toBeTruthy();
    });

    await test.step(`Verify status hiển thị ở cột Seller response`, async () => {
      expect(await fulfillmentPage.isTextVisible("Responsed")).toBeTruthy();
      expect(await fulfillmentPage.isTextVisible("No responsed")).toBeTruthy();
      await fulfillmentPage.searchOrderInFulfillOrder(conf.caseConf.order_name);
      await fulfillmentPage.page.locator(fulfillmentPage.xpathSellerResponse).click();
      const actLinkAli = await fulfillmentPage.page.locator(fulfillmentPage.xpathLinkAliSubmited).inputValue();
      expect(actLinkAli).toContain("https://www.aliexpress");

      // Checkout order then get status Seller response = Waiting, verify error message
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
      });
      orderId = checkoutInfo.order.id;
      orderName = checkoutInfo.order.name;
      orderTplAPI.ignoreValidateCustomerAddress(conf.suiteConf.plb_template.shop_id, orderId);
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await plbTemplateOrderAPI.approveOrderByApi(orderId, plbToken);
      await plbTemplateDashboardPage.goToPlusHubFulfillment({ dirrect: true });
      await fulfillmentPage.navigateToFulfillmentTab("Need to review");
      await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
      await fulfillmentPage.removeFilterOrderPlusBase();
      expect(await fulfillmentPage.isTextVisible("Waiting")).toBeTruthy();
      expect(await fulfillmentPage.isTextVisible(errorMess)).toBeTruthy();
      await fulfillmentPage.xpathOrderName(orderName).click();
      await plbTemplateDashboardPage.waitUntilElementVisible(plbTemplateDashboardPage.xpathCardSection);
    });
  });

  test(`@SB_PLB_CSP_32 Verify alert error hiển thị của order ở tab Need to review(order tạo fail trên Ali)`, async ({
    conf,
    odoo,
    multipleStore,
  }) => {
    const ordersName = [];
    const orderIds = [];

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );

    plbTemplateDashboardPage = new DashboardPage(templatePage, conf.suiteConf.plb_template.domain);
    fulfillmentPage = new FulfillmentPage(plbTemplateDashboardPage.page, conf.suiteConf.plb_template.domain);

    await test.step(`Login vào shop template > Vào order detail > Approve order `, async () => {
      const indexProdCheckout = conf.caseConf.index_products_checkout;
      let indexShippingAddress = 0;
      const productTempId = conf.caseConf.product_template_id;

      // Check product, if product unavailable -> set available
      for (const productId of productTempId) {
        const isUnavailable: Array<ProductInfo> = await odoo.read(
          "product.template",
          [productId],
          ["x_set_unavailable"],
        );
        if (isUnavailable[0].x_set_unavailable) {
          await odoo.update("product.template", productId, { x_set_unavailable: false });
        }
      }

      // Checkout product country not support, product link die then approve order
      for (const index of indexProdCheckout) {
        checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: [infoProduct[index]],
          customerInfo: {
            shippingAddress: conf.caseConf.info_product.customerInfo.shippingAddress[indexShippingAddress],
          },
        });
        orderName = checkoutInfo.order.name;
        orderId = checkoutInfo.order.id;
        ordersName.push(orderName);
        orderIds.push(orderId);
        indexShippingAddress++;
      }
      for (const orderId of orderIds) {
        await orderPage.goToOrderByOrderId(orderId);
        await orderPage.waitForProfitCalculated();
        await plbTemplateOrderAPI.approveOrderByApi(orderId, plbToken);
        await orderPage.page.reload();
        expect(await orderPage.isPaymentStatus()).toBeTruthy();
      }
    });

    await test.step(`Vào Fulfillment > PlusHub > Verify alert error hiển thị của order ở tab Need to review`, async () => {
      const errorsMessage = conf.caseConf.errors_message;
      await plbTemplateDashboardPage.goToPlusHubFulfillment({ dirrect: true });
      await fulfillmentPage.navigateToFulfillmentTab("Need to review");
      for (const orderName of ordersName) {
        await fulfillmentPage.searchOrderInFulfillmentTab(orderName);
        if (orderName == ordersName[0]) {
          await fulfillmentPage.removeFilterOrderPlusBase();
          expect(await fulfillmentPage.isTextVisible(errorsMessage[0])).toBeTruthy();
        } else {
          expect(await fulfillmentPage.isTextVisible(errorsMessage[1])).toBeTruthy();
        }
      }
    });
  });

  test(`@SB_PLB_CSP_16 [SO đã sent và expired/ SO có shipping =AliExpress/ SO chưa sent] Verify alert hiển thị sau khi checkout order có product không tìm thấy shipping country`, async ({
    conf,
    authRequest,
    page,
    odoo,
  }) => {
    test.setTimeout(600000);
    await test.step(`Mở SF > Thực hiện checkout`, async () => {
      // Get data available soon before checkout
      availableSoonBefore = (await balanceAPI.getDataBalance()).available_soon;

      // Get data analytics before checkout
      analyticsPage = new AnalyticsPage(page, shopDomain, authRequest);
      today = await analyticsPage.formatDate(await analyticsPage.getDateXDaysAgo(0));
      dataAnalyticsBefore = await analyticsPage.getDataAnalyticsAPIDashboard(
        authRequest,
        shopId,
        today,
        initData,
        "total_profit",
      );

      // Get data count qty order lỗi trước khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([conf.caseConf.product_id]);
      const map = new Map();
      qtyBefore = 0;

      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      if (map.size > 0) {
        qtyBefore = map.get(`${conf.caseConf.product_id}`).count;
      }

      // Check product, if product unavailable -> set available
      const isUnavailable: Array<ProductInfo> = await odoo.read(
        "product.template",
        [conf.caseConf.product_template_id],
        ["x_set_unavailable"],
      );
      if (isUnavailable[0].x_set_unavailable) {
        await odoo.update("product.template", productId, { x_set_unavailable: false });
      }

      await expect(async () => {
        // Checkout
        checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: [infoProduct[indexProdCheckout]],
          customerInfo: {
            shippingAddress: conf.caseConf.info_product.customerInfo.shippingAddress[0],
          },
        });
        orderId = checkoutInfo.order.id;
        orderName = checkoutInfo.order.name;
        expect(orderId).toBeGreaterThan(0);
      }).toPass();
    });

    await test.step(`Verify alert hiển thị trong order detail > Verify profit của order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderPage.clickShowCalculation();

      // Verify profit order
      actBaseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      const productProduct = await odooService.getDataAllprice(conf.caseConf.shipping_rates_id);
      baseCost = productProduct.ali_cost;
      expect(baseCost).toEqual(actBaseCost);
      shippingFee = Number(removeCurrencySymbol(await orderPage.getShippingFee()));
      subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
      expect(isEqual(subtotal, checkoutInfo.totals.subtotal_price, 0.1)).toBeTruthy();

      shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      actProfit = Number(removeCurrencySymbol(await orderPage.getProfit()));

      const taxInclude = 0;
      orderPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        subtotal,
        checkoutInfo.totals.total_discounts,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        checkoutInfo.totals.total_tipping,
        paymentFeeRate,
        processingFeeRate,
      );
      expect(isEqual(Number(removeCurrencySymbol(await orderPage.getProfit())), orderPage.profit, 0.01)).toEqual(true);

      // Verify alert
      expect(await orderPage.getTextContent(orderPage.xpathAlertInProductLine)).toEqual(alertMessInProdLine);
      expect(
        (await orderPage.getTextContent(orderPage.xpathAlertInOrderDetail)).includes(alertMessInOrder),
      ).toBeTruthy();
      expect(await orderPage.getTextContent(orderPage.xpathProfitStatus)).toEqual(profitStatus);
      expect(await orderApi.getTimelineList(orderId)).toContain(timeline);
    });

    await test.step(`Vào Orders > All orders > Verify alert hiển thị ở order list`, async () => {
      await orderPage.goToOrderListFromOrderDetail("PlusBase");
      await orderPage.searchOrder(orderName);
      expect(await orderPage.isTextVisible(fulfillmentStatus, 3)).toBeTruthy();
      expect(await orderPage.isTextVisible(origProfit, 2)).toBeTruthy();
    });

    await test.step(`Login vào Dashboard > Dropship products > Verirfy alert hiển thị ở product list, product detail`, async () => {
      // Get data count qty order lỗi sau khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([productId]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      qtyAfter = map.get(`${productId}`).count;
      expect(qtyAfter).toEqual(qtyBefore + infoProduct[indexProdCheckout].quantity);

      // Verify alert in product list
      await productPage.navigateToSubMenu("Dropship products", "All products");
      await productPage.searchProduct(productName);
      await expect(async () => {
        expect(
          await productPage.isTextVisible(`Unable to fulfill ${qtyAfter} orders due to product problems`),
        ).toBeTruthy();
      }).toPass();

      // Verify alert in product detail
      await productPage.gotoProductDetailPlb(productName);
      await expect(async () => {
        expect(
          await productPage.isTextVisible(
            `Unable to fulfill ${qtyAfter} orders because the product cannot be delivered to the buyer's address.`,
          ),
        ).toBeTruthy();
      }).toPass();
      await expect(productPage.genLoc(productPage.xapthBtnAlternativeLinks)).toBeEnabled();
    });

    await test.step(`Verify analytics`, async () => {
      // Get data analytics afer checkout then verify
      dataAnalyticsAfter = await analyticsPage.validateDataChanges(
        dataAnalyticsBefore,
        initData,
        authRequest,
        shopId,
        today,
        timeOut,
        "total_profit",
        true,
      );
      expect(
        isEqual(dataAnalyticsAfter.summary.total_profit, dataAnalyticsBefore.summary.total_profit + actProfit, 0.01),
      ).toEqual(true);
    });

    await test.step(`Vào balance > Verify Invoices, Transaction`, async () => {
      // Get data available soon after checkout then verrify
      await expect(async () => {
        availableSoonAfter = (await balanceAPI.getDataBalance()).available_soon;
        expect(availableSoonAfter).toBeGreaterThan(availableSoonBefore);
      }).toPass();
      expect(availableSoonAfter).toEqual(Number((availableSoonBefore + actProfit).toFixed(2)));
    });
  });

  test(`@SB_PLB_CSP_23 [SO đã sent và expired/ SO có ship = AliExpress/ SO chưa sent] Verify alert hiển thị trong product detail, order detail khi product vi phạm nhiều hơn 1 điều kiện (product không tìm thấy variant, không tìm thấy country)`, async ({
    page,
    conf,
    authRequest,
  }) => {
    await test.step(`Mở SF > Thực hiện checkout `, async () => {
      // Get data available soon before checkout
      availableSoonBefore = (await balanceAPI.getDataBalance()).available_soon;

      // Get data analytics before checkout
      analyticsPage = new AnalyticsPage(page, shopDomain, authRequest);
      today = await analyticsPage.formatDate(await analyticsPage.getDateXDaysAgo(0));
      dataAnalyticsBefore = await analyticsPage.getDataAnalyticsAPIDashboard(
        authRequest,
        shopId,
        today,
        initData,
        "total_profit",
      );
      // Get data count qty order lỗi trước khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([conf.caseConf.product_id]);
      const map = new Map();
      qtyBefore = 0;

      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      if (map.size > 0) {
        qtyBefore = map.get(`${conf.caseConf.product_id}`).count;
      }

      // Checkout
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
        customerInfo: {
          shippingAddress: conf.caseConf.info_product.customerInfo.shippingAddress[0],
        },
      });
      orderId = checkoutInfo.order.id;
      orderName = checkoutInfo.order.name;
    });

    await test.step(`Verify alert hiển thị trong order detail > Verify profit của order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderPage.clickShowCalculation();

      // Verify profit order
      actBaseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      expect(baseCost).toEqual(actBaseCost);
      shippingFee = Number(removeCurrencySymbol(await orderPage.getShippingFee()));
      subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
      expect(subtotal).toEqual(checkoutInfo.totals.subtotal_price);

      shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      actProfit = Number(removeCurrencySymbol(await orderPage.getProfit()));

      const taxInclude = 0;
      orderPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        subtotal,
        checkoutInfo.totals.total_discounts,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        checkoutInfo.totals.total_tipping,
        paymentFeeRate,
        processingFeeRate,
      );
      expect(isEqual(Number(removeCurrencySymbol(await orderPage.getProfit())), orderPage.profit, 0.01)).toEqual(true);

      // Verify alert
      expect(await orderPage.getTextContent(orderPage.xpathAlertInProductLine)).toEqual(alertMessInProdLine);
      expect(await orderPage.getTextContent(orderPage.xpathAlertInOrderDetail)).toContain(alertMessInOrder);
      expect(await orderPage.getTextContent(orderPage.xpathProfitStatus)).toEqual(profitStatus);
      expect(await orderApi.getTimelineList(orderId)).toContain(timeline);
    });

    await test.step(`Vào Orders > All orders > Verify alert hiển thị ở order list`, async () => {
      await orderPage.goToOrderListFromOrderDetail("PlusBase");
      await orderPage.searchOrder(orderName);
      expect(await orderPage.isTextVisible(fulfillmentStatus, 3)).toBeTruthy();
      expect(await orderPage.isTextVisible(origProfit, 2)).toBeTruthy();
    });

    await test.step(`Login vào Dashboard > Dropship products > Verirfy alert hiển thị ở product list, product detail`, async () => {
      // Get data count qty order lỗi sau khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([productId]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      qtyAfter = map.get(`${productId}`).count;
      expect(qtyAfter).toEqual(qtyBefore + infoProduct[indexProdCheckout].quantity);

      // Verify alert in product list
      await productPage.navigateToSubMenu("Dropship products", "All products");
      await productPage.searchProduct(productName);
      await expect(async () => {
        expect(
          await productPage.isTextVisible(`Unable to fulfill ${qtyAfter} orders due to product problems`),
        ).toBeTruthy();
      }).toPass();

      // Verify alert in product detail
      await productPage.gotoProductDetailPlb(productName);
      await expect(async () => {
        expect(
          await productPage.isTextVisible(
            `Unable to fulfill ${qtyAfter} orders due to changes in Aliexpress shipping countries and product variants`,
          ),
        ).toBeTruthy();
      }).toPass();
      const actAlertInProductDetail = await productPage.getTextContent(productPage.xpathAlertInProductDetail);
      expect(actAlertInProductDetail.replaceAll(/\s\s+/g, " ")).toContain(alertMessInProductDetail);
      await expect(productPage.genLoc(productPage.xapthBtnAlternativeLinks)).toBeEnabled();
    });

    await test.step(`Vào balance > Verify Invoices, Transaction`, async () => {
      // Get data available soon after checkout then verrify
      await expect(async () => {
        availableSoonAfter = (await balanceAPI.getDataBalance()).available_soon;
        expect(availableSoonAfter).toBeGreaterThan(availableSoonBefore);
      }).toPass();
      expect(availableSoonAfter).toEqual(Number((availableSoonBefore + actProfit).toFixed(2)));

      // verify invoice transaction
      await orderPage.goToOrderByOrderId(orderId);
      if (!(await orderPage.isTextVisible("View invoice"))) {
        await orderPage.page.reload();
      }
      await orderPage.viewInvoice();
      const listTransAmt = await dashboardAPI.getOrderTransAmt();
      let totalTransAmt = 0;
      for (let i = 0; i < listTransAmt.length; i++) {
        totalTransAmt += listTransAmt[i];
      }
      expect(totalTransAmt).toEqual(actProfit);
    });
  });
});
