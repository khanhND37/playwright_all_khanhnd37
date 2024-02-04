import { test } from "@fixtures/odoo";
import { expect } from "@playwright/test";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import { ProductPage } from "@pages/dashboard/products";
import { Card, CheckoutInfo, Product, BaseCostData } from "@types";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { OrderAPI } from "@pages/api/order";
import { loadData } from "@core/conf/conf";
import { removeCurrencySymbol } from "@utils/string";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";

test.describe("Variant dispatch", async () => {
  let odooService: OdooServiceInterface;
  let productsCheckout: Array<Product>;
  let cardInfo: Card;
  let domain: string;
  let productPage: ProductPage;
  let checkoutAPI: CheckoutAPI;
  let productStoreId: number;
  let orderId: number;
  let orderPage: OrdersPage;
  let orderAPI: OrderAPI;
  let checkoutInfo: CheckoutInfo;
  let totalOrderPrice: number;
  let plbTemplateShopDomain: string;
  let orderTemplatePage: OrdersPage;
  let fulfillOrdersPage: FulfillmentPage;
  let orderName: string;
  let plbOrderApi: PlusbaseOrderAPI;
  let sbcnVariantIds: BaseCostData[];
  let countryCode: string;

  test.beforeEach(async ({ page, conf, authRequest, odoo }) => {
    domain = conf.suiteConf.domain;
    productsCheckout = conf.suiteConf.products_checkout;
    cardInfo = conf.suiteConf.card_info;
    productPage = new ProductPage(page, domain);
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    odooService = OdooService(odoo);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    orderPage = new OrdersPage(page, domain);
    orderAPI = new OrderAPI(domain, authRequest);
    orderTemplatePage = new OrdersPage(page, plbTemplateShopDomain);
    fulfillOrdersPage = new FulfillmentPage(page, plbTemplateShopDomain);
    plbOrderApi = new PlusbaseOrderAPI(domain, authRequest);
    countryCode = conf.suiteConf.default_country_code;
  });

  const confCase = loadData(__dirname, "DATA_DRIVEN");
  const listCase = confCase.caseConf.data;
  const listCase2 = confCase.caseConf.data_2;
  if (listCase && listCase.length > 0) {
    for (let i = 0; i < listCase.length; i++) {
      const caseData = listCase[i];
      test(`@${caseData.case_id} - ${caseData.case_desc} `, async ({ authRequest, multipleStore, conf }) => {
        await test.step(`Reset data before run test`, async () => {
          await odooService.updateProductTemplate([caseData.product_template_id], {
            x_product_warehouse_ids: [
              [
                1,
                caseData.aliexpress_wh_id,
                { product_product_ids: [[6, false, caseData.start_aliexpress_variant_ids]] },
              ],
              [1, caseData.chaoshi_wh_id, { product_product_ids: [[6, false, caseData.start_chaoshi_variant_ids]] }],
            ],
          });
          await odooService.syncToQuotation(caseData.product_template_id);
        });

        await test.step(`Search product > Add to cart > Checkout `, async () => {
          productStoreId = caseData.sbase_product_id;
          productsCheckout[0].variant_id = await productPage.getVariantIdByAPI(
            authRequest,
            productStoreId,
            caseData.variant_name,
          );

          const expectShippings = caseData.first_checkout_shipping_methods;
          const shippingMethods = await checkoutAPI.getShippingMethodOfCheckout(productsCheckout);
          for (let j = 0; j < shippingMethods.length; j++) {
            const shippingMethod = shippingMethods[j];
            expect(expectShippings.includes(shippingMethod.method_title)).toEqual(true);
          }
        });

        await test.step(`Chọn Standard Shipping > Complete order > Vào order detail vừa tạo check profit order`, async () => {
          await checkoutAPI.selectShippingMethodByName(countryCode, caseData.pick_shipping_method);
          await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
          checkoutInfo = await checkoutAPI.getCheckoutInfo();

          expect(checkoutInfo).not.toBeUndefined();
          orderId = checkoutInfo.order.id;
          orderName = checkoutInfo.order.name;
          totalOrderPrice = checkoutInfo.totals.total_price;
          expect(orderId > 0).toEqual(true);

          await multipleStore.getDashboardPage(
            conf.suiteConf["username"],
            conf.suiteConf["password"],
            plbTemplateShopDomain,
            conf.suiteConf["shop_id"],
            conf.suiteConf["user_id"],
          );
          await orderPage.goToOrderByOrderId(orderId);
          await orderAPI.getOrderProfit(orderId, "plusbase", true);
          await orderPage.page.reload();

          sbcnVariantIds = caseData.sbcn_variant_ids;
          const baseCostItem = await odooService.getTotalBaseCostOrder(caseData.product_template_id, sbcnVariantIds);
          const orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrderApi);
          expect(orderInfo.base_cost).toEqual(Number(baseCostItem.toFixed(2)));
          const subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
          const totalDiscount = 0;
          const taxInclude = 0;
          const tip = 0;

          orderPage.calculateProfitPlusbase(
            totalOrderPrice,
            subtotal,
            totalDiscount,
            orderInfo.base_cost,
            orderInfo.shipping_cost,
            orderInfo.shipping_fee,
            taxInclude,
            tip,
            caseData.payment_fee_percent,
            caseData.first_processing_fee_percent,
          );
          const profitActual = orderInfo.profit;
          expect(profitActual).toEqual(Number(orderPage.profit.toFixed(2)));
        });

        await test.step(`Vào odoo > Vào product template detail > Edit > Config lại warehouse cho variant vừa checkout > Go to storefront >Search product > Add to cart > Checkout `, async () => {
          await odooService.updateProductTemplate([caseData.product_template_id], {
            x_product_warehouse_ids: [
              [1, caseData.aliexpress_wh_id, { product_product_ids: [[6, false, caseData.aliexpress_variant_ids]] }],
              [1, caseData.chaoshi_wh_id, { product_product_ids: [[6, false, caseData.chaoshi_variant_ids]] }],
            ],
          });
          await odooService.syncToQuotation(caseData.product_template_id);

          const expectShippings = caseData.second_checkout_shipping_methods;
          const shippingMethods = await checkoutAPI.getShippingMethodOfCheckout(productsCheckout);
          for (let j = 0; j < shippingMethods.length; j++) {
            const shippingMethod = shippingMethods[j];
            expect(expectShippings.includes(shippingMethod.method_title)).toEqual(true);
          }
        });

        await test.step(`Chọn Standard Shipping > Complete order > Vào order detail vừa tạo check profit order`, async () => {
          await checkoutAPI.selectShippingMethodByName(countryCode, caseData.pick_shipping_method);
          await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
          checkoutInfo = await checkoutAPI.getCheckoutInfo();

          expect(checkoutInfo).not.toBeUndefined();
          orderId = checkoutInfo.order.id;
          totalOrderPrice = checkoutInfo.totals.total_price;
          expect(orderId > 0).toEqual(true);
          await orderPage.goToOrderByOrderId(orderId);
          await orderAPI.getOrderProfit(orderId, "plusbase", true);
          await orderPage.page.reload();

          sbcnVariantIds = caseData.sbcn_variant_ids;
          const baseCostItem = await odooService.getTotalBaseCostOrder(caseData.product_template_id, sbcnVariantIds);
          const orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrderApi);
          expect(orderInfo.base_cost).toEqual(baseCostItem * productsCheckout[0].quantity);
          const subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
          const totalDiscount = 0;
          const taxInclude = 0;
          const tip = 0;

          orderPage.calculateProfitPlusbase(
            totalOrderPrice,
            subtotal,
            totalDiscount,
            orderInfo.base_cost,
            orderInfo.shipping_cost,
            orderInfo.shipping_fee,
            taxInclude,
            tip,
            caseData.payment_fee_percent,
            caseData.second_processing_fee_percent,
          );
          const profitActual = orderInfo.profit;
          expect(profitActual).toEqual(Number(orderPage.profit.toFixed(2)));
        });
      });
    }
  }

  if (listCase2 && listCase2.length > 0) {
    for (let i = 0; i < listCase2.length; i++) {
      const caseData = listCase2[i];
      test(`@${caseData.case_id} - ${caseData.case_desc} `, async ({ authRequest, multipleStore, conf }) => {
        await test.step(`Search product > Add to cart > Checkout `, async () => {
          productStoreId = caseData.sbase_product_id;
          productsCheckout = [];
          for (let z = 0; z < caseData.variant_names.length; z++) {
            const variantId = await productPage.getVariantIdByAPI(
              authRequest,
              productStoreId,
              caseData.variant_names[z],
            );
            productsCheckout.push({
              variant_id: variantId,
              quantity: 1,
            });
          }

          const expectShippings = caseData.first_checkout_shipping_methods;
          const shippingMethods = await checkoutAPI.getShippingMethodOfCheckout(productsCheckout);
          for (let j = 0; j < shippingMethods.length; j++) {
            const shippingMethod = shippingMethods[j];
            expect(expectShippings.includes(shippingMethod.method_title)).toEqual(true);
          }
        });

        await test.step(`Complete order > Vào order detail > Verify profit của order`, async () => {
          await checkoutAPI.selectShippingMethodByName(countryCode, caseData.pick_shipping_method);
          await checkoutAPI.authorizedThenCreateStripeOrder(cardInfo);
          checkoutInfo = await checkoutAPI.getCheckoutInfo();

          expect(checkoutInfo).not.toBeUndefined();
          orderId = checkoutInfo.order.id;
          orderName = checkoutInfo.order.name;
          totalOrderPrice = checkoutInfo.totals.total_price;
          expect(orderId > 0).toEqual(true);

          await multipleStore.getDashboardPage(
            conf.suiteConf["username"],
            conf.suiteConf["password"],
            domain,
            conf.suiteConf["shop_id"],
            conf.suiteConf["user_id"],
          );
          await orderPage.goToOrderByOrderId(orderId);
          await orderAPI.getOrderProfit(orderId, "plusbase", true);
          await orderPage.page.reload();

          sbcnVariantIds = caseData.sbcn_variant_ids;
          const baseCostItem = await odooService.getTotalBaseCostOrder(caseData.product_template_id, sbcnVariantIds);
          const orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrderApi);
          expect(orderInfo.base_cost).toEqual(Number(baseCostItem.toFixed(2)));
          const subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
          const totalDiscount = 0;
          const taxInclude = 0;
          const tip = 0;

          orderPage.calculateProfitPlusbase(
            totalOrderPrice,
            subtotal,
            totalDiscount,
            orderInfo.base_cost,
            orderInfo.shipping_cost,
            orderInfo.shipping_fee,
            taxInclude,
            tip,
            caseData.payment_fee_percent,
            caseData.first_processing_fee_percent,
          );
          const profitActual = orderInfo.profit;
          expect(profitActual).toEqual(Number(orderPage.profit.toFixed(2)));
        });

        await test.step(`Vào shop template > Vào order detail order vừa checkout > Approved order > Click button "PlusHub" > Chọn order > Fulfill order > Vào odoo > Done Do-in > Vào Do-out`, async () => {
          await multipleStore.getDashboardPage(
            conf.suiteConf.plb_template["username"],
            conf.suiteConf.plb_template["password"],
            plbTemplateShopDomain,
            conf.suiteConf.plb_template["shop_id"],
            conf.suiteConf.plb_template["user_id"],
          );

          await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
          await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
          await orderTemplatePage.fulfillOrderPlusBase();
          await fulfillOrdersPage.navigateToFulfillmentTab("Awaiting stock");
          expect(await fulfillOrdersPage.isOrderVisiableInTab(orderName, "Awaiting stock", 30)).toEqual(true);
        });

        await test.step(`Input TKN > Done do-out > Check order detail trên store template`, async () => {
          await fulfillOrdersPage.navigateToMenuPlusHub("Warehouse");
          await fulfillOrdersPage.clickOnBtnWithLabel("Purchase orders");
          const productName = caseData.product.trim();
          await fulfillOrdersPage.searchPurchaseOrder(productName);

          // first do in
          const firstPurchaseOrder = await fulfillOrdersPage.getPurchaseOrderInWarehouse(1);
          const firstStockPickingIds = await odooService.getStockPickingIds(firstPurchaseOrder);
          const firstStockPickingId = firstStockPickingIds[0];
          await odooService.getStockPickingState(firstStockPickingId);
          await odooService.doneStockPicking(firstStockPickingId);

          const secondPurchaseOrder = await fulfillOrdersPage.getPurchaseOrderInWarehouse(2);
          const secondStockPickingIds = await odooService.getStockPickingIds(secondPurchaseOrder);
          const secondStockPickingId = secondStockPickingIds[0];
          await odooService.getStockPickingState(secondStockPickingId);
          await odooService.doneStockPicking(secondStockPickingId);

          const pickingIds = await odooService.getStockPickingIds(orderName, "out");
          for (let j = 0; j < pickingIds.length; j++) {
            const pickingId = pickingIds[j];
            await odooService.checkAvailabilityStockPicking(pickingId);
            let doState = await odooService.getStockPickingState(pickingId);
            expect(doState).toEqual("assigned");

            await odooService.updateTrackingNumber(pickingId, caseData.tracking_number);

            await odooService.doneStockPicking(pickingId);
            doState = await odooService.getStockPickingState(pickingId);
            expect(doState).toEqual("done");
          }
        });
      });
    }
  }
});
