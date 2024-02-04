import { test } from "@fixtures/odoo";
import { expect } from "@playwright/test";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import { CheckoutAPI } from "@pages/api/checkout";
import type { ShippingData, CheckoutInfo, PurchaseOrders, Product } from "@types";
import { isEqual } from "@core/utils/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { removeCurrencySymbol } from "@core/utils/string";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";
import { SFCheckout } from "@pages/storefront/checkout";
import { AppsAPI } from "@pages/api/apps";

test.describe("Variant dispatch", async () => {
  let odooService: OdooServiceInterface;
  let checkoutAPI: CheckoutAPI;
  let domain: string;
  let checkoutInfo: CheckoutInfo;
  let orderPage: OrdersPage;
  let doInState: string;
  let doOutState: string;
  let sfCheckoutPage: SFCheckout;
  let productsCheckout: Array<Product>;
  let countryCode: string;
  let trackingNumber: string;
  let aliexpressId: number;

  test.beforeEach(async ({ conf, odoo, authRequest, page, dashboard }) => {
    test.setTimeout(conf.suiteConf.time_out);
    domain = conf.suiteConf.domain;
    odooService = OdooService(odoo);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    orderPage = new OrdersPage(dashboard, domain);
    sfCheckoutPage = new SFCheckout(checkoutAPI.page, domain);
    productsCheckout = conf.caseConf.product_checkout;
    countryCode = conf.suiteConf.country_code;
    trackingNumber = conf.suiteConf.tracking_number;
    aliexpressId = conf.suiteConf.aliexpress_id;
    const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
    if (conf.caseConf.is_add_ppc) {
      await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, true);
    } else {
      await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, false);
    }
  });

  test(`@SB_PLB_SW_08 Verify order có nhiều variant cùng product template, có variant combo, các variant được config warehouse khác nhau, cùng shipping group`, async ({
    conf,
    authRequest,
    multipleStore,
  }) => {
    const productTemplateId = conf.caseConf.product_template_id;
    const productProductIds = conf.caseConf.product_product_ids;
    let dataShippingAli: Map<string, ShippingData>;
    let dataShippingChaosi: Map<string, ShippingData>;
    let shippingCostAli: number;
    let shippingCostChaosi: number;
    const plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);

    const dashboardTpl = await multipleStore.getDashboardPage(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const plusHubAPI = new PlusHubAPI(conf.suiteConf.shop_template.domain, authRequestTpl);
    const plbTemplateDashboardPage = new DashboardPage(dashboardTpl, conf.suiteConf.shop_template.domain);
    const orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, conf.suiteConf.shop_template.domain);
    const fulfillmentPage = new FulfillmentPage(plbTemplateDashboardPage.page, conf.suiteConf.shop_template.domain);

    await test.step(`Get data shipping with variants`, async () => {
      //get shipping cost variant config warehouse AliExpress

      dataShippingAli = await odooService.getShippingFeeVariantDispatch(
        productTemplateId,
        productProductIds.variant_wh_ali,
        countryCode,
        aliexpressId,
      );
      dataShippingChaosi = await odooService.getShippingFeeVariantDispatch(
        productTemplateId,
        productProductIds.variant_wh_chaosi,
        countryCode,
        aliexpressId,
      );

      // Checkout với order: combo( 1 variant Ali, 1 variant chaosi) + variant riêng đi Chaosi. Cùng product template
      // Mỗi kho sẽ có 1 first còn lại là additional
      // Shipping Ali = 1 first + các quantity còn lại của kho Ali đi additional
      shippingCostAli =
        dataShippingAli.get("Standard Shipping").first_item_fee +
        dataShippingAli.get("Standard Shipping").additional_item_fee * (productsCheckout[0].quantity - 1);

      // Shipping Chaosi = 1 first + các quantity còn lại của kho Chaosi đi additional
      shippingCostChaosi =
        dataShippingChaosi.get("Standard Shipping").first_item_fee +
        dataShippingChaosi.get("Standard Shipping").additional_item_fee *
          (productsCheckout[0].quantity - 1 + productsCheckout[1].quantity);
    });

    await test.step(`Search product > add to cart > Checkout > Nhập infor customer`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productsCheckout);
      await checkoutAPI.updateCustomerInformation();
      const res = await checkoutAPI.getShippingMethodInfo(countryCode);
      expect(isEqual(res[0].amount, shippingCostAli + shippingCostChaosi, 0.1)).toBeTruthy();
      expect(res[0].method_title).toEqual(`Standard Shipping`);
    });

    await test.step(`Complete order`, async () => {
      await checkoutAPI.selectShippingMethodByShippingGroupName(countryCode, "Standard Shipping");
      await checkoutAPI.authorizedThenCreateStripeOrder(conf.suiteConf.card_info);
      checkoutInfo = await checkoutAPI.getCheckoutInfo();
      expect(isEqual(checkoutInfo.totals.shipping_fee, shippingCostAli + shippingCostChaosi, 0.1)).toBeTruthy();
    });

    await test.step(`Vào order detail > Verify  profit của order `, async () => {
      await orderPage.goToOrderByOrderId(checkoutInfo.order.id);
      await orderPage.waitForProfitCalculated();
      const orderSummary = await orderPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      const profit = orderPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        checkoutInfo.totals.subtotal_price,
        checkoutInfo.totals.total_discounts,
        orderSummary.base_cost,
        orderSummary.shipping_cost,
        checkoutInfo.totals.shipping_fee,
        conf.suiteConf.tax_include,
        checkoutInfo.totals.total_tipping,
        conf.suiteConf.payment_rate,
        conf.suiteConf.processing_rate,
      );
      const profitActual = Number(removeCurrencySymbol(await orderPage.getProfit()));
      expect(profitActual).toEqual(Number(profit.profit.toFixed(2)));
    });

    await test.step(`Vào shop template > Vào order detail order vừa checkout > Approved order`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(checkoutInfo.order.id);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      await expect(async () => {
        const approvedStatus = await orderTemplatePage.getApproveStatus();
        expect(approvedStatus).toEqual("Approved");
        const paymentStatus = await orderTemplatePage.getPaymentStatus();
        expect(paymentStatus).toEqual("Paid");
        const paidByCustomer = await orderTemplatePage.getPaidByCustomer();
        expect(
          isEqual(Number(removeCurrencySymbol(paidByCustomer)), checkoutInfo.totals.total_price, 0.1),
        ).toBeTruthy();
      }).toPass();
    });

    await test.step(`Click button "PlusHub" > Chọn order > Fulfill order > Vào odoo > Done Do-in > Vào Do-out`, async () => {
      await plbTemplateDashboardPage.goToPlusHubFulfillment({ dirrect: true });
      await fulfillmentPage.searchOrderInFulfillOrder(checkoutInfo.order.name);
      await fulfillmentPage.selectOrderToFulfillByOrderName(checkoutInfo.order.name);
      await fulfillmentPage.clickFulfillSelectedOrder({ onlySelected: true });
      await fulfillmentPage.clickButton("Confirm");

      // Chờ create do-in/do-out, purchase orders
      await fulfillmentPage.page.waitForTimeout(20000);

      // Get all data purchase order and done do-in
      const purchaseOrders: Array<PurchaseOrders> = await plusHubAPI.getPurchaseOrderInfo({
        product_warehouse: conf.caseConf.product_warehouse,
      });
      for (const purchaseOrder of purchaseOrders) {
        doInState = await odooService.getStockPickingState(purchaseOrder.stock_picking_id);
        expect(doInState).toEqual("assigned");
        await odooService.doneStockPicking(purchaseOrder.stock_picking_id);
        doInState = await odooService.getStockPickingState(purchaseOrder.stock_picking_id);
        expect(doInState).toEqual("done");
      }
    });

    await test.step(`Input TKN > Done do-out > Check order detail trên store template`, async () => {
      const pickingId = await odooService.getPickingID(checkoutInfo.order.name);
      for (const stockPickingId of pickingId) {
        const doOuts = await odooService.getStockPickingsByConditions({
          id: stockPickingId,
          orderName: checkoutInfo.order.name,
          limit: 1,
          fields: ["carrier_id", "x_carrier_code", "state"],
          name: "WH/OUT",
        });

        //verify shipping carrier
        if (`${doOuts[0].carrier_id[0]}` === `${aliexpressId}`) {
          expect(doOuts[0].carrier_id[1].trim()).toEqual("AliExpress (Only set large fix price)");
        } else {
          expect(doOuts[0].carrier_id[1].trim()).toEqual(conf.caseConf.carrier);
        }
        doOutState = doOuts[0].state;
        if (doOutState === "confirmed") {
          await odooService.checkAvailabilityStockPicking(stockPickingId);
        }
        doOutState = await odooService.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("assigned");
        await odooService.updateTknForDeliveryOrder(stockPickingId, trackingNumber);
        await odooService.doneStockPicking(stockPickingId);
        doOutState = await odooService.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("done");
      }
      // Wait TKN sync sang order detail
      await orderTemplatePage.page.waitForTimeout(20000);

      await orderTemplatePage.goToOrderStoreTemplateByOrderId(checkoutInfo.order.id);
      const fulfillmentStatusOrder = await orderTemplatePage.getFulfillmentStatusOrder();
      expect(fulfillmentStatusOrder).toEqual("Fulfilled");
      const archivedStatusOrder = await orderTemplatePage.getArchivedStatusOrder();
      expect(archivedStatusOrder).toEqual("Archived");
      await expect(async () => {
        await orderTemplatePage.page.reload();
        const trackingNumberDB = await orderTemplatePage.getTrackingNumber();

        // Verify tracking + status order trong shop template
        expect(trackingNumberDB).toEqual(trackingNumber);
      }).toPass();
    });
  });

  test(`@SB_PLB_SW_09 Verify order có nhiều variant cùng product template, có variant combo, các variant được config warehouse khác nhau, khác shipping group`, async ({
    authRequest,
    conf,
    multipleStore,
  }) => {
    const productTemplateId = conf.caseConf.product_template_id;
    const productProductIds = conf.caseConf.product_product_ids;
    let dataShippingAli: Map<string, ShippingData>;
    let dataShippingChaosi: Map<string, ShippingData>;
    let shippingCostAli: number;
    let shippingCostChaosi: number;
    const plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);

    const dashboardTpl = await multipleStore.getDashboardPage(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const plusHubAPI = new PlusHubAPI(conf.suiteConf.shop_template.domain, authRequestTpl);
    const plbTemplateDashboardPage = new DashboardPage(dashboardTpl, conf.suiteConf.shop_template.domain);
    const orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, conf.suiteConf.shop_template.domain);
    const fulfillmentPage = new FulfillmentPage(plbTemplateDashboardPage.page, conf.suiteConf.shop_template.domain);

    await test.step(`Get data shipping with variants`, async () => {
      //get shipping cost variant config warehouse AliExpress

      dataShippingAli = await odooService.getShippingFeeVariantDispatch(
        productTemplateId,
        productProductIds.variant_wh_ali,
        countryCode,
        aliexpressId,
      );
      dataShippingChaosi = await odooService.getShippingFeeVariantDispatch(
        productTemplateId,
        productProductIds.variant_wh_chaosi,
        countryCode,
        aliexpressId,
      );

      // Checkout với order: combo( 1 variant Ali, 1 variant chaosi) + variant riêng đi Chaosi. Cùng product template
      // Mỗi kho sẽ có 1 first còn lại là additional
      // Shipping Ali = 1 first + các quantity còn lại của kho Ali đi additional
      shippingCostAli =
        dataShippingAli.get("Standard Shipping").first_item_fee +
        dataShippingAli.get("Standard Shipping").additional_item_fee * (productsCheckout[0].quantity - 1);

      // Shipping Chaosi = 1 first + các quantity còn lại của kho Chaosi đi additional
      shippingCostChaosi =
        dataShippingChaosi.get("Eco Shipping").first_item_fee +
        dataShippingChaosi.get("Eco Shipping").additional_item_fee *
          (productsCheckout[0].quantity - 1 + productsCheckout[1].quantity);
    });

    await test.step(`Search product > add to cart > Checkout > Nhập infor customer`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productsCheckout);
      await checkoutAPI.updateCustomerInformation();
      await checkoutAPI.openCheckoutPageByToken();

      const res = await checkoutAPI.getShippingMethodInfo(countryCode);
      expect(isEqual(res[0].amount, shippingCostAli + shippingCostChaosi, 0.1)).toBeTruthy();
      expect(res[0].method_title).toEqual(`Standard Shipping`);
    });

    await test.step(`Complete order`, async () => {
      await checkoutAPI.selectShippingMethodByShippingGroupName(countryCode, "Standard Shipping");
      await checkoutAPI.authorizedThenCreateStripeOrder(conf.suiteConf.card_info);
      checkoutInfo = await checkoutAPI.getCheckoutInfo();
      expect(isEqual(checkoutInfo.totals.shipping_fee, shippingCostAli + shippingCostChaosi, 0.1)).toBeTruthy();
    });

    await test.step(`Vào order detail > Verify  profit của order `, async () => {
      await orderPage.goToOrderByOrderId(checkoutInfo.order.id);
      await orderPage.waitForProfitCalculated();
      const orderSummary = await orderPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      const profit = orderPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        checkoutInfo.totals.subtotal_price,
        checkoutInfo.totals.total_discounts,
        orderSummary.base_cost,
        orderSummary.shipping_cost,
        checkoutInfo.totals.shipping_fee,
        conf.suiteConf.tax_include,
        checkoutInfo.totals.total_tipping,
        conf.suiteConf.payment_rate,
        conf.suiteConf.processing_rate,
      );
      const profitActual = Number(removeCurrencySymbol(await orderPage.getProfit()));
      expect(profitActual).toEqual(Number(profit.profit.toFixed(2)));
    });

    await test.step(`Vào shop template > Vào order detail order vừa checkout > Approved order > Click button "PlusHub" `, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(checkoutInfo.order.id);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      await expect(async () => {
        const approvedStatus = await orderTemplatePage.getApproveStatus();
        expect(approvedStatus).toEqual("Approved");
        const paymentStatus = await orderTemplatePage.getPaymentStatus();
        expect(paymentStatus).toEqual("Paid");
        const paidByCustomer = await orderTemplatePage.getPaidByCustomer();
        expect(
          isEqual(Number(removeCurrencySymbol(paidByCustomer)), checkoutInfo.totals.total_price, 0.1),
        ).toBeTruthy();
      }).toPass();
    });

    await test.step(`Chọn order > Fulfill order > Vào odoo > Done Do-in > Vào Do-out`, async () => {
      await plbTemplateDashboardPage.goToPlusHubFulfillment({ dirrect: true });
      await fulfillmentPage.searchOrderInFulfillOrder(checkoutInfo.order.name);
      await fulfillmentPage.selectOrderToFulfillByOrderName(checkoutInfo.order.name);
      await fulfillmentPage.clickFulfillSelectedOrder({ onlySelected: true });
      await fulfillmentPage.clickButton("Confirm");

      // Chờ create do-in/do-out, purchase orders
      await expect(async () => {
        const pickingId = await odooService.getPickingID(checkoutInfo.order.name);
        expect(pickingId.length).toEqual(2);
      }).toPass();

      // Get all data purchase order and done do-in
      const purchaseOrders: Array<PurchaseOrders> = await plusHubAPI.getPurchaseOrderInfo({
        product_warehouse: conf.caseConf.product_warehouse,
      });
      for (const purchaseOrder of purchaseOrders) {
        doInState = await odooService.getStockPickingState(purchaseOrder.stock_picking_id);
        expect(doInState).toEqual("assigned");
        await odooService.doneStockPicking(purchaseOrder.stock_picking_id);
        doInState = await odooService.getStockPickingState(purchaseOrder.stock_picking_id);
        expect(doInState).toEqual("done");
      }
    });

    await test.step(`Input TKN > Done do-out > Check order detail trên store template`, async () => {
      const pickingId = await odooService.getPickingID(checkoutInfo.order.name);
      for (const stockPickingId of pickingId) {
        const doOuts = await odooService.getStockPickingsByConditions({
          id: stockPickingId,
          orderName: checkoutInfo.order.name,
          limit: 1,
          fields: ["carrier_id", "x_carrier_code", "state"],
          name: "WH/OUT",
        });

        //verify shipping carrier
        if (`${doOuts[0].carrier_id[0]}` === `${aliexpressId}`) {
          expect(doOuts[0].carrier_id[1].trim()).toEqual("AliExpress (Only set large fix price)");
        } else {
          expect(doOuts[0].carrier_id[1].trim()).toEqual(conf.caseConf.carrier);
        }
        doOutState = doOuts[0].state;
        if (doOutState === "confirmed") {
          await odooService.checkAvailabilityStockPicking(stockPickingId);
        }
        doOutState = await odooService.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("assigned");
        await odooService.updateTknForDeliveryOrder(stockPickingId, trackingNumber);
        await odooService.doneStockPicking(stockPickingId);
        doOutState = await odooService.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("done");
      }
      // Wait TKN sync sang order detail
      await orderTemplatePage.page.waitForTimeout(10000);

      await orderTemplatePage.goToOrderStoreTemplateByOrderId(checkoutInfo.order.id);
      const trackingNumberDB = await orderTemplatePage.getTrackingNumber();

      // Verify tracking + status order trong shop template
      expect(trackingNumberDB).toEqual(trackingNumber);
      const fulfillmentStatusOrder = await orderTemplatePage.getFulfillmentStatusOrder();
      expect(fulfillmentStatusOrder).toEqual("Fulfilled");
      const archivedStatusOrder = await orderTemplatePage.getArchivedStatusOrder();
      expect(archivedStatusOrder).toEqual("Archived");
    });
  });

  test(`@SB_PLB_SW_12 Verify add variant PPC khi product PPC config warehouse "variant dispatch" tất cả variant support ship đến shipping address checkout, warehouse product PPC không cùng shipping group`, async ({
    conf,
    authRequest,
  }) => {
    const plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);
    await test.step(`Search product > add to cart > Checkout > Nhập infor customer > Complete order`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productsCheckout);
      await checkoutAPI.updateCustomerInformation();
      await checkoutAPI.openCheckoutPageByToken();
      await sfCheckoutPage.page.locator(sfCheckoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
      await sfCheckoutPage.completeOrderWithMethod("Stripe");
      expect(await sfCheckoutPage.isTextVisible(conf.caseConf.product_PPC)).toBeTruthy();
    });

    await test.step(`Add PPC`, async () => {
      const dataExcluded = await checkoutAPI.getDataVariantExclude(
        conf.caseConf.offer_id,
        conf.caseConf.sb_product_id,
        countryCode,
        conf.caseConf.shipping_method_code,
      );
      const variantIds = dataExcluded.excluded_variants.map(dataVariant => dataVariant.id);
      const variantsExclude = conf.caseConf.variant_excluded;
      variantIds.forEach(variantId => {
        const count = variantsExclude.filter(dataExpect => variantId === dataExpect).length;
        expect(count).toEqual(1);
      });
      await sfCheckoutPage.addProductPostPurchase(conf.caseConf.product_PPC);
      expect(await sfCheckoutPage.isTextVisible(`Your order is confirmed`)).toBeTruthy();
      checkoutInfo = await checkoutAPI.getCheckoutInfo();
    });

    await test.step(`Vào order detail > Verify  profit của order `, async () => {
      await orderPage.goToOrderByOrderId(checkoutInfo.order.id);
      await orderPage.waitForProfitCalculated();
      const orderSummary = await orderPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      const profit = orderPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        checkoutInfo.totals.subtotal_price,
        checkoutInfo.totals.total_discounts,
        orderSummary.base_cost,
        orderSummary.shipping_cost,
        checkoutInfo.totals.shipping_fee,
        conf.suiteConf.tax_include,
        checkoutInfo.totals.total_tipping,
        conf.suiteConf.payment_rate,
        conf.suiteConf.processing_rate,
      );
      const profitActual = Number(removeCurrencySymbol(await orderPage.getProfit()));
      expect(profitActual).toEqual(Number(profit.profit.toFixed(2)));
    });
  });

  test(`@SB_PLB_SW_07 Verify order có nhiều variant cùng product template, các variant được config warehouse khác nhau, khác shipping group`, async ({
    authRequest,
    conf,
    multipleStore,
  }) => {
    const productTemplateId = conf.caseConf.product_template_id;
    const productProductIds = conf.caseConf.product_product_ids;
    let dataShippingAli: Map<string, ShippingData>;
    let dataShippingChaosi: Map<string, ShippingData>;
    let shippingCostAli: number;
    let shippingCostChaosi: number;
    const plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);

    const dashboardTpl = await multipleStore.getDashboardPage(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const plusHubAPI = new PlusHubAPI(conf.suiteConf.shop_template.domain, authRequestTpl);
    const plbTemplateDashboardPage = new DashboardPage(dashboardTpl, conf.suiteConf.shop_template.domain);
    const orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, conf.suiteConf.shop_template.domain);
    const fulfillmentPage = new FulfillmentPage(plbTemplateDashboardPage.page, conf.suiteConf.shop_template.domain);
    await test.step(`Get data shipping with variants`, async () => {
      //get shipping cost variant config warehouse AliExpress

      dataShippingAli = await odooService.getShippingFeeVariantDispatch(
        productTemplateId,
        productProductIds.variant_wh_ali,
        countryCode,
        aliexpressId,
      );
      dataShippingChaosi = await odooService.getShippingFeeVariantDispatch(
        productTemplateId,
        productProductIds.variant_wh_chaosi,
        countryCode,
        aliexpressId,
      );

      // Checkout với order: combo( 1 variant Ali, 1 variant chaosi) + variant riêng đi Chaosi. Cùng product template
      // Mỗi kho sẽ có 1 first còn lại là additional
      // Shipping Ali = 1 first + các quantity còn lại của kho Ali đi additional
      shippingCostAli = dataShippingAli.get("Standard Shipping").first_item_fee;

      // Shipping Chaosi = 1 first + các quantity còn lại của kho Chaosi đi additional
      shippingCostChaosi = dataShippingChaosi.get("Eco Shipping").first_item_fee;
    });
    await test.step(`Search product > add to cart > Checkout > Nhập infor customer`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(productsCheckout);
      await checkoutAPI.updateCustomerInformation();
      await checkoutAPI.openCheckoutPageByToken();

      const res = await checkoutAPI.getShippingMethodInfo(countryCode);
      expect(isEqual(res[0].amount, shippingCostAli + shippingCostChaosi, 0.1)).toBeTruthy();
      expect(res[0].method_title).toEqual(conf.caseConf.shipping_checkout);
    });

    await test.step(`Complete order`, async () => {
      await checkoutAPI.selectShippingMethodByShippingGroupName(countryCode, conf.caseConf.shipping_checkout);
      await checkoutAPI.authorizedThenCreateStripeOrder(conf.suiteConf.card_info);
      checkoutInfo = await checkoutAPI.getCheckoutInfo();
      expect(isEqual(checkoutInfo.totals.shipping_fee, shippingCostAli + shippingCostChaosi, 0.1)).toBeTruthy();
    });

    await test.step(`Vào order detail > Verify  profit của order `, async () => {
      await orderPage.goToOrderByOrderId(checkoutInfo.order.id);
      await orderPage.waitForProfitCalculated();
      const orderSummary = await orderPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      const profit = orderPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        checkoutInfo.totals.subtotal_price,
        checkoutInfo.totals.total_discounts,
        orderSummary.base_cost,
        orderSummary.shipping_cost,
        checkoutInfo.totals.shipping_fee,
        conf.suiteConf.tax_include,
        checkoutInfo.totals.total_tipping,
        conf.suiteConf.payment_rate,
        conf.suiteConf.processing_rate,
      );
      const profitActual = Number(removeCurrencySymbol(await orderPage.getProfit()));
      expect(profitActual).toEqual(Number(profit.profit.toFixed(2)));
    });

    await test.step(`Vào shop template > Vào order detail order vừa checkout > Approved order > Click button "PlusHub" `, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(checkoutInfo.order.id);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      await expect(async () => {
        const approvedStatus = await orderTemplatePage.getApproveStatus();
        expect(approvedStatus).toEqual("Approved");
        const paymentStatus = await orderTemplatePage.getPaymentStatus();
        expect(paymentStatus).toEqual("Paid");
        const paidByCustomer = await orderTemplatePage.getPaidByCustomer();
        expect(
          isEqual(Number(removeCurrencySymbol(paidByCustomer)), checkoutInfo.totals.total_price, 0.1),
        ).toBeTruthy();
      }).toPass();
    });

    await test.step(`Chọn order > Fulfill order > Vào odoo > Done Do-in > Vào Do-out`, async () => {
      await plbTemplateDashboardPage.goToPlusHubFulfillment({ dirrect: true });
      await fulfillmentPage.searchOrderInFulfillOrder(checkoutInfo.order.name);
      await fulfillmentPage.selectOrderToFulfillByOrderName(checkoutInfo.order.name);
      await fulfillmentPage.clickFulfillSelectedOrder({ onlySelected: true });
      await fulfillmentPage.clickButton("Confirm");

      // Chờ create do-in/do-out, purchase orders
      await fulfillmentPage.page.waitForTimeout(20000);

      // Chờ create do-in/do-out, purchase orders
      await expect(async () => {
        const pickingId = await odooService.getPickingID(checkoutInfo.order.name);
        expect(pickingId.length).toEqual(2);
      }).toPass();

      // Get all data purchase order and done do-in
      const purchaseOrders: Array<PurchaseOrders> = await plusHubAPI.getPurchaseOrderInfo({
        product_warehouse: conf.caseConf.product_warehouse,
      });
      for (const purchaseOrder of purchaseOrders) {
        doInState = await odooService.getStockPickingState(purchaseOrder.stock_picking_id);
        expect(doInState).toEqual("assigned");
        await odooService.doneStockPicking(purchaseOrder.stock_picking_id);
        doInState = await odooService.getStockPickingState(purchaseOrder.stock_picking_id);
        expect(doInState).toEqual("done");
      }
    });

    await test.step(`Input TKN > Done do-out > Check order detail trên store template`, async () => {
      const pickingId = await odooService.getPickingID(checkoutInfo.order.name);
      for (const stockPickingId of pickingId) {
        const doOuts = await odooService.getStockPickingsByConditions({
          id: stockPickingId,
          orderName: checkoutInfo.order.name,
          limit: 1,
          fields: ["carrier_id", "x_carrier_code", "state"],
          name: "WH/OUT",
        });

        //verify shipping carrier
        if (`${doOuts[0].carrier_id[0]}` === `${aliexpressId}`) {
          expect(doOuts[0].carrier_id[1].trim()).toEqual("AliExpress (Only set large fix price)");
        } else {
          expect(doOuts[0].carrier_id[1].trim()).toEqual(conf.caseConf.carrier);
        }
        doOutState = doOuts[0].state;
        if (doOutState === "confirmed") {
          await odooService.checkAvailabilityStockPicking(stockPickingId);
        }
        doOutState = await odooService.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("assigned");
        await odooService.updateTknForDeliveryOrder(stockPickingId, trackingNumber);
        await odooService.doneStockPicking(stockPickingId);
        doOutState = await odooService.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("done");
      }

      // Wait TKN sync sang order detail
      await orderTemplatePage.page.waitForTimeout(20000);

      await orderTemplatePage.goToOrderStoreTemplateByOrderId(checkoutInfo.order.id);
      const fulfillmentStatusOrder = await orderTemplatePage.getFulfillmentStatusOrder();
      expect(fulfillmentStatusOrder).toEqual("Fulfilled");
      const archivedStatusOrder = await orderTemplatePage.getArchivedStatusOrder();
      expect(archivedStatusOrder).toEqual("Archived");
      await expect(async () => {
        await orderTemplatePage.page.reload();
        const trackingNumberDB = await orderTemplatePage.getTrackingNumber();

        // Verify tracking + status order trong shop template
        expect(trackingNumberDB).toEqual(trackingNumber);
      }).toPass();
    });
  });
});
