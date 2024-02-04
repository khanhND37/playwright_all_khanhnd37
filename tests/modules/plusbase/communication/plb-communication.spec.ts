import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import type { Product, Card, MappedOptions } from "@types";
import { ProductPage } from "@pages/dashboard/products";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@core/utils/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import { ProductAPI } from "@pages/api/product";
import { Order, CheckoutInfo } from "@types";
import { request } from "@playwright/test";
import { removeCurrencySymbol } from "@utils/string";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { DashboardAPI } from "@pages/api/dashboard";

test.describe("Plb communication", async () => {
  let productsCheckout: Array<Product>;
  let cardInfo: Card;
  let plusbasePage: DropshipCatalogPage;
  let domain: string;
  let aliUrl: string;
  let alternativeLink: string;
  let productPage: ProductPage;
  let checkoutAPI: CheckoutAPI;
  let productStoreId: number;
  let orderId: number;
  let orderName: string;
  let variantName: string;
  let productTmpId: number;
  let odooService: OdooServiceInterface;
  let adminToken: string;
  let plbToken: string;
  let plbDashboardPage: DashboardPage;
  let plbTemplateDashboardPage: DashboardPage;
  let plbTemplateShopDomain: string;
  let productAPI: ProductAPI;
  let orderPage: OrdersPage;
  let orderTemplatePage: OrdersPage;
  let orderAPI: OrderAPI;
  let productName: string;
  let fulfillOrdersPage: FulfillmentPage;
  let paymentFeePercent: number;
  let processingFeePercent: number;
  let shopId: number;
  let orderInfo: Order;
  let plusbaseProductAPI: PlusbaseProductAPI;
  let mappedOptions: Array<MappedOptions>;
  let checkoutInfo: CheckoutInfo;
  let balanceAmountBeforeCheckout: number;
  let balanceAmountAfterCheckout: number;
  let balanceAmountAfterRecalculateProfit: number;
  let currentProfit: number;
  let profitAfterRecalculate: number;
  let plusbaseOrderAPI: PlusbaseOrderAPI;
  let plusHubAPI: PlusHubAPI;
  let balanceAPI: BalanceUserAPI;
  let timeline: string;
  let alertMessInProductDetail: string;
  let alertMessInProdLine: string;
  let alertMessInOrder: string;
  let soID: number;

  test.beforeEach(async ({ page, conf, odoo, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out);
    domain = conf.suiteConf.domain;
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    productsCheckout = conf.suiteConf.products_checkout;
    cardInfo = conf.suiteConf.card_info;
    timeline = conf.suiteConf.timeline;
    alertMessInProductDetail = conf.caseConf.alert_message_in_product_detail;
    plusbasePage = new DropshipCatalogPage(page, domain);
    aliUrl = conf.caseConf.ali_url;
    productPage = new ProductPage(page, domain);
    variantName = conf.caseConf.variant_name;
    productTmpId = conf.caseConf.product_template_id;
    odooService = OdooService(odoo);
    plbDashboardPage = new DashboardPage(page, domain);
    plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    productAPI = new ProductAPI(domain, authRequest);
    orderPage = new OrdersPage(page, domain);
    orderAPI = new OrderAPI(domain, authRequest);
    productName = conf.caseConf.product_name;
    fulfillOrdersPage = new FulfillmentPage(page, plbTemplateShopDomain);
    paymentFeePercent = conf.caseConf.payment_fee_percent;
    processingFeePercent = conf.caseConf.processing_fee_percent;
    shopId = conf.suiteConf.shop_id;
    alternativeLink = conf.caseConf.alternative_link;
    orderTemplatePage = new OrdersPage(page, plbTemplateShopDomain);
    const context = await request.newContext();
    plusbaseProductAPI = new PlusbaseProductAPI(plbTemplateShopDomain, context);
    mappedOptions = conf.caseConf.mapped_options;
    plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);
    balanceAPI = new BalanceUserAPI(domain, authRequest);
    alertMessInProdLine = conf.caseConf.alert_message_in_product_line;
    alertMessInOrder = conf.caseConf.alert_message_in_order_detail;
    soID = conf.caseConf.so_id;

    adminToken = await plbDashboardPage.getAccessToken({
      shopId: conf.suiteConf["shop_id"],
      userId: conf.suiteConf["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf["username"],
      password: conf.suiteConf["password"],
    });

    plbToken = await plbTemplateDashboardPage.getAccessToken({
      shopId: conf.suiteConf.plb_template["shop_id"],
      userId: conf.suiteConf.plb_template["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf.plb_template["username"],
      password: conf.suiteConf.plb_template["password"],
    });
  }),
  test(`@SB_PLB_CSP_13 [SO đã sent và expired/ SO có shipping = AliExpress/ SO chưa sent]  Verify alert hiển thị sau khi checkout order có product không tìm thấy variant`, async ({
    context,
    authRequest,
  }) => {
    await test.step(`Mở SF > Thực hiện checkout `, async () => {
      // Xử lý fake add attribute value
      let quotationInfo = await odooService.updateQuotation(productTmpId, {
        x_use_partner_price: false,
      });
      expect(quotationInfo.x_use_partner_price).toEqual(false);

      // Import product to store and get variant id then checkout
      await plbDashboardPage.loginWithToken(adminToken);
      await plusbasePage.goToProductRequest();
      await plusbasePage.searchWithKeyword(aliUrl);
      await plusbasePage.waitTabItemLoaded();
      await plusbasePage.importProductToStore();
      await plusbasePage.importFirstProductToStore();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForLoadState("networkidle");
      productStoreId = Number(await productPage.getProductIDByURL());
      const productVariantId = await productPage.getVariantIdByAPI(
        authRequest,
        productStoreId,
        variantName,
        adminToken,
      );
      productsCheckout[0].variant_id = productVariantId;
      const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      expect(checkoutInfo).not.toBeUndefined();
      orderId = checkoutInfo.order.id;
      expect(orderId > 0).toEqual(true);
      orderName = checkoutInfo.order.name;

      // Update lại SO sau khi add attribute
      quotationInfo = await odooService.updateQuotation(productTmpId, {
        x_use_partner_price: true,
      });
      expect(quotationInfo.x_use_partner_price).toEqual(true);
    });

    await test.step(`Login vào Dashboard > Dropship products > Verirfy alert hiển thị ở product list, product detail`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await orderPage.page.reload();
      await productPage.navigateToSubMenu("Dropship products", "All products");
      await productPage.searchProduct(productName);
      expect(await productPage.isTextVisible("Unable to fulfill 1 orders due to product problems")).toEqual(true);
      await productPage.goto(`/admin/products/${productStoreId}`);

      expect(
        await productPage.isTextVisible("Unable to fulfill 1 orders due to not found AliExpress product variant"),
      ).toEqual(true);
      const actAlertInProductDetail = await productPage.getTextContent(productPage.xpathAlertInProductDetail);
      expect(actAlertInProductDetail.replaceAll(/\s\s+/g, " ")).toContain(alertMessInProductDetail);
      expect(await productPage.isTextVisible("Provide alternative links")).toEqual(true);
    });

    await test.step(`Vào Orders > All orders > Verify alert hiển thị ở order list`, async () => {
      await orderPage.gotoOrderPage("plusbase");
      await orderPage.searchOrder(orderName);
      const fulfillmentStatus = await orderPage.getDataTable(1, 1, 6);
      const onHoldStatus = await orderPage.getOnHoldStatusInOrderList();
      expect(fulfillmentStatus).toEqual("Cannot fulfill");
      expect(onHoldStatus).toEqual("(on hold)");
    });

    await test.step(`Verify alert hiển thị trong order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      expect(await orderPage.isTextVisible("We are unable to fulfill certain products in your order.")).toEqual(true);
      const fulfillmentStatus = await orderPage.getFulfillmentStatusOrder();
      expect(fulfillmentStatus).toEqual("Cannot fulfill");
      expect(await orderPage.isTextVisible("Faild to map variants. Please check your product.")).toEqual(true);
      expect(await orderAPI.getTimelineList(orderId)).toContain(timeline);
    });

    await test.step(`Login shop template > Fulfillment > Veriry order hiển thị`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      await orderTemplatePage.clickOnBtnWithLabel("PlusHub");
      await fulfillOrdersPage.removeFilterOrderPlusBase();
      await fulfillOrdersPage.navigateToFulfillmentTab("Need to review");
      expect(await fulfillOrdersPage.isOrderVisiableInTab(orderName, "Need to review", 5)).toEqual(true);
      expect(await fulfillOrdersPage.isTextVisible("Waiting")).toEqual(true);

      // delete product after verify
      await productAPI.deleteAllProduct(domain);
    });
  });

  test(`@SB_PLB_CSP_14 Verify profit, balance,invoices, transaction sau khi ops fulfill order với link Ali mới, SO ban đầu chưa sent`, async ({
    conf,
    authRequest,
    context,
    multipleStore,
  }) => {
    const authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );
    plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.plb_template.domain, authRequestTpl);
    const orderTplAPI = new OrderAPI(plbTemplateShopDomain, authRequestTpl);

    await test.step(`Vào Dashboard shop merchant > Verify profit hiển thị ở order list, order detail`, async () => {
      // Xử lý fake add attribute value
      let quotationInfo = await odooService.updateQuotation(productTmpId, {
        x_use_partner_price: false,
      });
      expect(quotationInfo.x_use_partner_price).toEqual(false);

      // Import product to store and get variant id then checkout
      await plbDashboardPage.loginWithToken(adminToken);
      await plusbasePage.goToAliexpressRequest();
      await plusbasePage.searchWithKeyword(aliUrl);
      await plusbasePage.waitTabItemLoaded();
      await plusbasePage.importProductToStore();
      await plusbasePage.importFirstProductToStore();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForLoadState("networkidle");
      productStoreId = Number(await productPage.getProductIDByURL());
      const productVariantId = await productPage.getVariantIdByAPI(
        authRequest,
        productStoreId,
        variantName,
        adminToken,
      );
      productsCheckout[0].variant_id = productVariantId;
      balanceAmountBeforeCheckout = (await balanceAPI.getDataBalance()).available_soon;
      expect(balanceAmountBeforeCheckout).toBeTruthy();
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });

      // Update lại SO sau khi add attribute
      expect(checkoutInfo).not.toBeUndefined();
      orderId = checkoutInfo.order.id;
      expect(orderId > 0).toEqual(true);
      orderTplAPI.ignoreValidateCustomerAddress(shopId, orderId);
      orderName = checkoutInfo.order.name;
      quotationInfo = await odooService.updateQuotation(productTmpId, {
        x_use_partner_price: true,
      });
      expect(quotationInfo.x_use_partner_price).toEqual(true);

      await orderPage.goToOrderByOrderId(orderId);
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await orderPage.page.reload();
      orderInfo = await orderPage.getOrderSummaryInOrderDetail();
      currentProfit = Number(removeCurrencySymbol(await orderPage.getProfit()));
      await orderPage.verifyOrderInfo(checkoutInfo.totals, paymentFeePercent, processingFeePercent, {
        profit: true,
      });
      const actTimeLineList = await orderAPI.getTimelineList(orderId);
      expect(actTimeLineList.includes(timeline)).toBeTruthy();

      await orderPage.gotoOrderPage("plusbase");
      await orderPage.searchOrder(orderName);
      const fulfillmentStatus = await orderPage.getDataTable(1, 1, 6);
      const onHoldStatus = await orderPage.getOnHoldStatusInOrderList();
      expect(fulfillmentStatus).toEqual("Cannot fulfill");
      expect(onHoldStatus).toEqual("(on hold)");
    });

    await test.step(`Vào balance > Verify Invoices, Transaction`, async () => {
      balanceAmountAfterCheckout = (await balanceAPI.getDataBalance()).available_soon;
      expect(balanceAmountAfterCheckout).toBeTruthy();
      expect(isEqual(balanceAmountAfterCheckout, balanceAmountBeforeCheckout, orderInfo.profit + 0.02)).toEqual(true);
    });

    await test.step(`Seller login vào shop PLB > Vào product detail > Click button "Provide alternative links"> Nhập link Ali trong popup "Provide alternative product links" > Click button confirm`, async () => {
      await plbDashboardPage.loginWithToken(adminToken);
      await productPage.goToEditProductPage(productStoreId);
      await productPage.clickElementWithLabel("button", "Provide alternative links");
      await productPage.fillAlternativeLink(alternativeLink);
      expect(
        await productPage.isTextVisible(
          "Thank you for providing alternative links. We will check and fulfill your existing orders soon.",
        ),
      ).toEqual(true);
    });

    await test.step(`Vào shop template > Vào Fulfillment > PlusHub > Verify order hiển thị ở màn Fulfillment`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      await plbTemplateDashboardPage.goToPlusHubFulfillment({ dirrect: true });
      await fulfillOrdersPage.navigateToFulfillmentTab("Need to review");
      await fulfillOrdersPage.searchOrderInFulfillOrder(orderName);
      await expect(async () => {
        expect(await fulfillOrdersPage.isOrderVisiableInTab(orderName, "Need to review", 5)).toEqual(true);
      }).toPass();
    });

    await test.step(`Click button Change mapping -> Thực hiện map lại các variant tương ứng với link Ali mới > Click button Save changes > 
    Verify line items, warehouse hiển thị ở order fulfill > Click chọn order > Fulfill order`, async () => {
      await plusbaseProductAPI.mappingProduct(
        mappedOptions,
        conf.caseConf.target_shop_id,
        conf.caseConf.user_id,
        conf.caseConf.sbcn_product_id,
        productStoreId,
        plbToken,
      );

      // Fulfill order
      const dataOrders = await plusbaseOrderAPI.searchOrders({
        search_keyword: orderName,
      });
      const lineItemId = dataOrders.data.orders[0].line_items.map(lineitem => lineitem.id);
      const orderValue = conf.caseConf.data;
      orderValue.orders[0].id = orderId;
      orderValue.orders[0].line_item_ids[0] = lineItemId[0];
      orderValue.orders[0].line_items[0].id = lineItemId[0];

      plusHubAPI = new PlusHubAPI(plbTemplateShopDomain, authRequestTpl);
      await expect(async () => {
        await plusHubAPI.searchFulfillOrders({
          search_keyword: orderName,
          search_option: "order_name",
          tab: "ready_to_fulfill",
          tab_name: "ready_to_fulfill",
        });
        await plusHubAPI.selectOrderToFulfill(orderValue);
        await orderPage.goToOrderByOrderId(orderId);
        expect(await orderPage.getFulfillmentStatusOrder()).toEqual("Processing");
      }).toPass();
    });

    await test.step(`Vào Dashboard shop merchant > Verify profit hiển thị ở order list, order detail`, async () => {
      await expect(async () => {
        await orderPage.page.reload();
        profitAfterRecalculate = Number(removeCurrencySymbol(await orderPage.getProfit()));
        expect(profitAfterRecalculate !== currentProfit).toBeTruthy();
      }).toPass();

      await orderPage.goToOrderByOrderId(orderId);
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await orderPage.page.reload();
      await orderPage.clickShowCalculation();
      await orderPage.verifyOrderInfo(checkoutInfo.totals, paymentFeePercent, processingFeePercent, {
        profit: true,
      });
    });

    await test.step(`Vào balance > Verify Invoices, Transaction`, async () => {
      balanceAmountAfterRecalculateProfit = (await balanceAPI.getDataBalance()).available_soon;
      expect(balanceAmountAfterRecalculateProfit).toBeTruthy();
      expect(
        isEqual(balanceAmountAfterRecalculateProfit, balanceAmountAfterRecalculateProfit, currentProfit + 0.02),
      ).toEqual(true);

      // delete product after verify
      await productAPI.deleteAllProduct(domain);
    });
  });

  test(`@SB_PLB_CSP_18 Verify profit, alert sau khi ops fulfill order với sup khác AliExpress`, async ({
    conf,
    multipleStore,
    context,
    authRequest,
  }) => {
    const dashboardAPI = new DashboardAPI(domain, authRequest);
    const authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );
    plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.plb_template.domain, authRequestTpl);
    const orderTplAPI = new OrderAPI(plbTemplateShopDomain, authRequestTpl);
    const countOrderIssueBeforeCkout = await dashboardAPI.getDataHomepage();

    // delete product
    await productAPI.deleteAllProduct(domain);

    await test.step(`Vào Dashboard shop merchant > Verify profit hiển thị ở order list, order detail`, async () => {
      await odooService.sendQuotationWithAliEXpress(productTmpId, soID, ["AliExpress"], 1);
      // Xử lý fake add attribute value
      let quotationInfo = await odooService.updateQuotation(productTmpId, {
        x_use_partner_price: false,
      });
      expect(quotationInfo.x_use_partner_price).toEqual(false);

      // Import product to store and get variant id then checkout
      await plbDashboardPage.loginWithToken(adminToken);
      await plusbasePage.goToAliexpressRequest();
      await plusbasePage.searchWithKeyword(aliUrl);
      await plusbasePage.waitTabItemLoaded();
      await plusbasePage.importProductToStore();
      await plusbasePage.importFirstProductToStore();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForLoadState("networkidle");
      productStoreId = Number(await productPage.getProductIDByURL());
      const productVariantId = await productPage.getVariantIdByAPI(
        authRequest,
        productStoreId,
        variantName,
        adminToken,
      );
      productsCheckout[0].variant_id = productVariantId;
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      expect(checkoutInfo).not.toBeUndefined();
      orderId = checkoutInfo.order.id;
      expect(orderId > 0).toEqual(true);
      orderTplAPI.ignoreValidateCustomerAddress(shopId, orderId);
      orderName = checkoutInfo.order.name;

      await expect(async () => {
        const countOrderIssueAfterCkout = await dashboardAPI.getDataHomepage();
        expect(
          isEqual(
            countOrderIssueBeforeCkout.total_balance_issues + 1,
            countOrderIssueAfterCkout.total_balance_issues,
            0.1,
          ),
        ).toBeTruthy();
      }).toPass();

      quotationInfo = await odooService.updateQuotation(productTmpId, {
        x_use_partner_price: true,
      });
      expect(quotationInfo.x_use_partner_price).toEqual(true);
      await orderPage.goToOrderByOrderId(orderId);
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await orderPage.page.reload();
      orderInfo = await orderPage.getOrderSummaryInOrderDetail();
      currentProfit = Number(removeCurrencySymbol(await orderPage.getProfit()));
      await orderPage.verifyOrderInfo(checkoutInfo.totals, paymentFeePercent, processingFeePercent, {
        profit: true,
      });
      const actTimeLineList = await orderAPI.getTimelineList(orderId);
      expect(actTimeLineList.includes(timeline)).toBeTruthy();

      // Verify alert in order detail
      expect(await orderPage.getTextContent(orderPage.xpathAlertInProductLine)).toEqual(alertMessInProdLine);
      expect(
        (await orderPage.getTextContent(orderPage.xpathAlertInOrderDetail)).includes(alertMessInOrder),
      ).toBeTruthy();

      // Verify alert in order list
      await orderPage.gotoOrderPage("plusbase");
      await orderPage.searchOrder(orderName);
      const fulfillmentStatus = await orderPage.getDataTable(1, 1, 6);
      const onHoldStatus = await orderPage.getOnHoldStatusInOrderList();
      expect(fulfillmentStatus).toEqual("Cannot fulfill");
      expect(onHoldStatus).toEqual("(on hold)");
    });

    await test.step(`Login vào Dashboard > Dropship products > Verirfy alert hiển thị ở product list, product detail`, async () => {
      // Verify alert in product list
      await productPage.navigateToSubMenu("Dropship products", "All products");
      await productPage.searchProduct(productName);
      await expect(async () => {
        expect(await productPage.isTextVisible(`Unable to fulfill 1 orders due to product problems`)).toBeTruthy();
      }).toPass();

      // Verify alert in product detail
      await productPage.goToEditProductPage(productStoreId);
      await expect(async () => {
        expect(
          await productPage.isTextVisible(`Unable to fulfill 1 orders due to not found AliExpress product variant`),
        ).toBeTruthy();
      }).toPass();
      await expect(productPage.genLoc(productPage.xapthBtnAlternativeLinks)).toBeEnabled();
    });

    await test.step(`Login vào Odoo > Sales > Update và sent quotation cho SO > Vào shop template > Approve order > Vào Fulfillment > PlusHub > Verify order hiển thị ở màn Fulfillment-  Fulfill order`, async () => {
      plusHubAPI = new PlusHubAPI(plbTemplateShopDomain, authRequestTpl);
      await odooService.updateShippingTypeProductTemplate(productTmpId, ["PlusBase Standard Shipping"]);
      await odooService.notifyToMerchant(soID);
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      await plbTemplateDashboardPage.goToPlusHubFulfillment({ dirrect: true });
      await fulfillOrdersPage.navigateToFulfillmentTab("Need to review");
      await fulfillOrdersPage.searchOrderInFulfillOrder(orderName);
      await plusHubAPI.releaseOrder([orderId]);
      await fulfillOrdersPage.navigateToFulfillmentTab("To fulfill");

      // Fulfill order
      const dataOrders = await plusbaseOrderAPI.searchOrders({
        search_keyword: orderName,
      });
      const lineItemId = dataOrders.data.orders[0].line_items.map(lineitem => lineitem.id);
      const orderValue = conf.caseConf.data;
      orderValue.orders[0].id = orderId;
      orderValue.orders[0].line_item_ids[0] = lineItemId[0];
      orderValue.orders[0].line_items[0].id = lineItemId[0];

      await expect(async () => {
        await plusHubAPI.searchFulfillOrders({
          search_keyword: orderName,
          search_option: "order_name",
          tab: "ready_to_fulfill",
          tab_name: "ready_to_fulfill",
        });
        await plusHubAPI.selectOrderToFulfill(orderValue);
        await orderPage.goToOrderByOrderId(orderId);
        expect(await orderPage.getFulfillmentStatusOrder()).toEqual("Processing");
      }).toPass();
    });

    await test.step(`Vào shop PLB > Verify alert hiển thị ở order detail, product detail `, async () => {
      // Verify alert in order detail
      expect(await orderPage.isTextVisible(alertMessInProdLine)).toBeFalsy();
      expect(await orderPage.isTextVisible(alertMessInOrder)).toBeFalsy();

      // Verify alert in order list
      await orderPage.gotoOrderPage("plusbase");
      await orderPage.searchOrder(orderName);
      const fulfillmentStatus = await orderPage.getDataTable(1, 1, 6);
      expect(fulfillmentStatus).toEqual("Processing");
      expect(await orderPage.isTextVisible("(on hold)")).toBeFalsy();

      // Verify alert in product list
      await productPage.navigateToSubMenu("Dropship products", "All products");
      await productPage.searchProduct(productName);
      await expect(async () => {
        expect(await productPage.isTextVisible(`Unable to fulfill 1 orders due to product problems`)).toBeFalsy();
      }).toPass();

      // Verify alert in product detail
      await productPage.goToEditProductPage(productStoreId);
      await expect(async () => {
        expect(
          await productPage.isTextVisible(`Unable to fulfill 1 orders due to not found AliExpress product variant`),
        ).toBeFalsy();
      }).toPass();

      await expect(async () => {
        const countOrderIssueAfterFulfill = await dashboardAPI.getDataHomepage();
        expect(
          isEqual(
            countOrderIssueBeforeCkout.total_balance_issues,
            countOrderIssueAfterFulfill.total_balance_issues,
            0.1,
          ),
        ).toBeTruthy();
      }).toPass();
    });
  });
});
