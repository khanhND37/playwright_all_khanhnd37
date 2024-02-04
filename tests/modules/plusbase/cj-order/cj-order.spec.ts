import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { PlusbasePrivateRequestPage } from "@pages/dashboard/plusbase/private_request";
import { OdooService } from "@services/odoo";
import type { SaleOrder, Product, Card, CheckoutInfo, RequestProductData } from "@types";
import { ProductPage } from "@pages/dashboard/products";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrderAPI } from "@pages/api/order";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { waitTimeout } from "@core/utils/api";
import { ProductAPI } from "@pages/api/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { SFHome } from "@pages/storefront/homepage";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { isEqual } from "@core/utils/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";
import { AppsAPI } from "@pages/api/apps";

test.describe("Skip update quotation", async () => {
  let domain: string;
  let productStoreID: number;
  let plusbasePage: DropshipCatalogPage;
  let plusbasePrivateRequestPage: PlusbasePrivateRequestPage;
  let productPage: ProductPage;
  let confSaleOrder: SaleOrder;
  let productId: number;
  let unitPrice: number;
  let stockWareHouseId: number;
  let weight: number;
  let carrierIds: Array<number>;
  let odooService = OdooService(null);
  let plusbaseProductAPI: PlusbaseProductAPI, quotationInfo;
  let checkoutAPI: CheckoutAPI;
  let productsCheckout: Array<Product>;
  let cardInfo: Card;
  let productTemplateId: number;
  let orderApi: OrderAPI;
  let checkoutInfos: CheckoutInfo;
  let defaultUrl: string;
  let sourcingCost: number;
  let sourcingShipping: number;
  let productAPI: ProductAPI;
  let cjUrl: string;
  let orderPage: OrdersPage;
  let shippingTypes: Array<string>;
  let countryCode: string;
  let expectShippingMethod: string;
  let plbTemplateShopDomain: string;
  let plusHubAPI: PlusHubAPI;
  let productName: string;
  let stockPickingIdBefore: number;
  let shippingAddress;
  let email: string;
  let orderName: string;
  let fulfillOrdersPage: FulfillmentPage;
  let messageLoss: string;

  test.beforeEach(async ({ page, conf, odoo, authRequest, multipleStore }) => {
    test.setTimeout(conf.suiteConf.time_out);
    domain = conf.suiteConf.domain;
    messageLoss = conf.suiteConf.message_loss;
    const dashBoardPage = await multipleStore.getDashboardPage(
      conf.suiteConf.username,
      conf.suiteConf.password,
      domain,
      conf.suiteConf.shop_id,
      conf.suiteConf.user_id,
    );
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    plusbasePage = new DropshipCatalogPage(dashBoardPage, domain);
    productAPI = new ProductAPI(domain, authRequest);
    plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(dashBoardPage, domain);
    orderApi = new OrderAPI(domain, authRequest);
    productPage = new ProductPage(dashBoardPage, domain);
    orderPage = new OrdersPage(dashBoardPage, domain);
    odooService = OdooService(odoo);

    unitPrice = conf.caseConf.unit_price;
    sourcingCost = conf.caseConf.x_product_cost;
    sourcingShipping = conf.caseConf.x_domestic_shipping;
    stockWareHouseId = conf.suiteConf.stock_warehouse_id;
    weight = conf.caseConf.weight;
    carrierIds = conf.caseConf.shipping_method_ids;
    confSaleOrder = {
      validity_date: conf.caseConf.expiration,
      x_minimum_order_quantity: conf.caseConf.minimun_order_quantity,
      x_minimum_order_value: conf.caseConf.minimun_order_value,
      x_estimated_delivery: conf.caseConf.estimated_delivery,
      x_quote_based_on: conf.caseConf.is_base_on_for_all_variants,
    };
    productsCheckout = conf.caseConf.products_checkout;
    cardInfo = conf.caseConf.card_info;
    productTemplateId = conf.caseConf.sbcn_product_id;
    defaultUrl = conf.caseConf.default_url;
    cjUrl = conf.caseConf.cj_url;
    shippingTypes = conf.caseConf.shipping_types;
    countryCode = conf.caseConf.country_code;
    expectShippingMethod = conf.caseConf.shipping_method;
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    productName = conf.caseConf.product_name;
  });

  test(`@SB_PLB_CJ_OP_06 Verify alert trên store merchant sau khi SO đã được sent quotation + đạt SO cap + bị loss`, async ({
    authRequest,
    conf,
  }) => {
    let orderIdFirstStep: number;
    let orderIdSecondStep: number;

    await test.step(`Pre conditions: cancel old quotation and request new quotation`, async () => {
      productId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, cjUrl, 20, true);
      if (productId > 0) {
        productTemplateId = productId;
        quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id"]);
        await odooService.updateProductTemplate([productTemplateId], {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        });
        await odooService.updateProductTemplateXUrl(productTemplateId, defaultUrl);
        await odooService.cancelQuotation(quotationInfo[0]["id"], 1);
        await odooService.unlinkQuotation(quotationInfo[0]["id"]);
      }

      //crawl cj
      const cjProductData: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),

        products: [{ url: cjUrl, note: "" }],
        is_plus_base: true,
      };
      await plusbaseProductAPI.requestProductByAPI(cjProductData);

      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, cjUrl, 20, true);
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      // Wait shipping loaded before verify
      await plusbasePrivateRequestPage.waitForCrawlSuccess("Available");
      await odooService.updateProductAndSentQuotationWithOptions(
        productTemplateId,
        {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
          x_weight: weight,
        },
        {
          validity_date: confSaleOrder.validity_date,
          x_minimum_order_quantity: confSaleOrder.x_minimum_order_quantity,
          x_minimum_order_value: confSaleOrder.x_minimum_order_value,
          x_estimated_delivery: confSaleOrder.x_estimated_delivery,
          x_quote_based_on: confSaleOrder.x_quote_based_on,
          payment_term_id: 1,
        },
        { price_unit: unitPrice, x_product_cost: sourcingCost, x_domestic_shipping: sourcingShipping },
        true,
        false,
        true,
        true,
      );
      quotationInfo = await odooService.getQuotationByProductId(productTemplateId, [
        "id",
        "state",
        "x_use_partner_price",
      ]);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
      productStoreID = await plusbaseProductAPI.importProductToStoreByAPI(productTemplateId);
      const variantId = await productPage.getVariantIdByAPI(authRequest, productStoreID, conf.caseConf.variant_name);
      productsCheckout[0].variant_id = variantId;
    });

    await test.step(`Thực hiện checkout 100 order`, async () => {
      checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      orderIdFirstStep = checkoutInfos.order.id;
      await orderApi.getOrderProfit(orderIdFirstStep, "plusbase", true);
    });

    await test.step(`Verity alert hiển thị ở product detail, product list, SO detail trên store merchant`, async () => {
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      const currentAlertSoCapInSoDetail = await plusbasePrivateRequestPage.isTextVisible(messageLoss);
      expect(currentAlertSoCapInSoDetail).toEqual(false);
      await productPage.goToEditProductPage(productStoreID);
      const currentAlertSoCapInProductDetail = await productPage.isTextVisible(messageLoss);
      expect(currentAlertSoCapInProductDetail).toEqual(false);
    });

    await test.step(`Thực hiện checkout 100 order`, async () => {
      checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      orderIdSecondStep = checkoutInfos.order.id;
      await orderApi.getOrderProfit(orderIdSecondStep, "plusbase", true);
      // wait set cap
      while (!quotationInfo[0]["x_is_cap"]) {
        quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "x_is_cap"]);
        await waitTimeout(3000);
      }
    });

    await test.step(`Verity alert hiển thị ở product detail, product list, SO detail trên store merchant`, async () => {
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      expect(await plusbasePrivateRequestPage.isTextVisible(messageLoss)).toEqual(true);
      await productPage.goToEditProductPage(productStoreID);
      expect(await productPage.isTextVisible(messageLoss)).toEqual(true);
      // Xóa product sau khi verify
      await productAPI.deleteProductById(domain, productStoreID);
    });
  });

  test(`@SB_PLB_CJ_OP_05 Verity alert trên store merchant khi SO chưa sent quotation + đạt SO cap`, async ({
    authRequest,
    conf,
  }) => {
    let orderId: number;

    await test.step(`Pre conditions: cancel old quotation and request new quotation`, async () => {
      productId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, cjUrl, 10, true);
      if (productId > 0) {
        productTemplateId = productId;
        quotationInfo = await odooService.getQuotationByProductId(
          productTemplateId,
          ["id"],
          conf.caseConf.odoo_partner_id,
        );
        await odooService.updateProductTemplate([productTemplateId], {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
        });
        await odooService.updateProductTemplateXUrl(productTemplateId, defaultUrl);
        await odooService.cancelQuotation(quotationInfo[0]["id"], 1);
      }
      //crawl cj
      const cjProductData: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: cjUrl, note: "" }],
        is_plus_base: true,
      };
      await plusbaseProductAPI.requestProductByAPI(cjProductData);

      productTemplateId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, cjUrl, 20, true);
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      // Wait shipping loaded before verify
      await plusbasePrivateRequestPage.waitForCrawlSuccess("Available");
      await odooService.updateProductAndSentQuotationWithOptions(
        productTemplateId,
        {
          x_warehouse_id: stockWareHouseId,
          x_delivery_carrier_type_ids: [[6, false, carrierIds]],
          x_weight: weight,
        },
        {
          validity_date: confSaleOrder.validity_date,
          x_minimum_order_quantity: confSaleOrder.x_minimum_order_quantity,
          x_minimum_order_value: confSaleOrder.x_minimum_order_value,
          x_estimated_delivery: confSaleOrder.x_estimated_delivery,
          x_quote_based_on: confSaleOrder.x_quote_based_on,
          payment_term_id: 1,
        },
        { price_unit: unitPrice },
        false,
        false,
        true,
        true,
      );
      quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "x_is_cap"]);
      expect(quotationInfo.length > 0).toEqual(true);
      productStoreID = await plusbaseProductAPI.importProductToStoreByAPI(productTemplateId);
      const variantId = await productPage.getVariantIdByAPI(authRequest, productStoreID, conf.caseConf.variant_name);
      productsCheckout[0].variant_id = variantId;
    });

    await test.step(`Thực hiện checkout `, async () => {
      // checkout with new variant
      const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      orderId = checkoutInfos.order.id;
    });

    await test.step(`Verify alert hiển thị trong product detail, SO detail trên store merchant`, async () => {
      await orderApi.getOrderProfit(orderId, "plusbase", true);
      // wait set cap
      while (!quotationInfo[0]["x_is_cap"]) {
        quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "x_is_cap"]);
        await waitTimeout(3000);
      }
      await plusbasePrivateRequestPage.goToProductRequestDetail(productTemplateId);
      expect(await plusbasePrivateRequestPage.isTextVisible(messageLoss)).toEqual(true);
      await productPage.goToEditProductPage(productStoreID);
      expect(await productPage.isTextVisible(messageLoss)).toEqual(true);
      // Xóa product sau khi verify
      await productAPI.deleteProductById(domain, productStoreID);
    });
  });

  test(`@SB_PLB_CJ_OP_04 Verify fulfill order sau khi SO được Notify to merchant`, async ({ conf }) => {
    let orderId: number;
    let expectTotalShipping: number;

    await test.step(`Thực hiện checkout có tax exclude`, async () => {
      const shipInfoTargetProduct = await odooService.updateThenGetShippingDatas(
        productTemplateId,
        shippingTypes,
        countryCode,
      );
      const expectFirstItem = shipInfoTargetProduct.get(expectShippingMethod).first_item_fee;
      expect(expectFirstItem).toEqual(conf.caseConf.shipping_first_item);
      const expectAdditionItem = shipInfoTargetProduct.get(expectShippingMethod).additional_item_fee;
      expect(expectAdditionItem).toEqual(conf.caseConf.shipping_add_item);
      // calculate total shipping fee
      expectTotalShipping = expectFirstItem + (productsCheckout[0].quantity - 1) * expectAdditionItem;
      checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      expect(checkoutInfos).not.toBeUndefined();
      orderId = checkoutInfos.order.id;
      expect(isEqual(checkoutInfos.totals.shipping_fee, expectTotalShipping, 0.01)).toBe(true);
    });

    await test.step(`Verify profit trong order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderApi.getOrderProfit(orderId, "plusbase", true);
      await orderPage.clickShowCalculation();
      const productCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      expect(productCost).toEqual(conf.caseConf.unit_price * productsCheckout[0].quantity);
      expect(removeCurrencySymbol(await orderPage.getShippingCost())).toEqual(expectTotalShipping.toFixed(2));
      await orderPage.verifyOrderInfo(
        checkoutInfos.totals,
        conf.caseConf.payment_fee_percent,
        conf.caseConf.processing_fee_percent,
        {
          profit: true,
          revenue: true,
          handlingFee: true,
          paidByCustomer: false,
          paymentFee: true,
          processingFee: true,
        },
      );
    });
  });

  test(`@SB_PLB_CJ_OP_03 Verify fulfill order khi  SO sent quotation nhưng chưa notify to merchant`, async ({
    page,
    multipleStore,
    conf,
    authRequest,
  }) => {
    const checkout = new SFCheckout(page, domain);
    let orderId: number;
    let totalOrder: number;
    let expectTotalShipping: number;
    const qtyCheckout = conf.caseConf.qty_checkout;
    //get first items, additional items
    await plusbasePage.goToProductRequestDetail(productTemplateId);
    const firstItemPrice = Number(removeCurrencySymbol(await plusbasePage.getShipping(2)));
    const additionalPrice = Number(removeCurrencySymbol(await plusbasePage.getShipping(3)));

    const authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template["username"],
      conf.suiteConf.plb_template["password"],
      plbTemplateShopDomain,
      conf.suiteConf.plb_template["shop_id"],
      conf.suiteConf.plb_template["user_id"],
    );
    const homePage = new SFHome(page, domain);
    await homePage.gotoHomePage();
    await homePage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);

    await test.step(`Thực hiện checkout có tax exclude`, async () => {
      // Get stock picking ID before purchase
      plusHubAPI = new PlusHubAPI(plbTemplateShopDomain, authRequestTpl);
      const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
      const dataPurchase = conf.caseConf.data_purchase;
      await plusHubAPI.purchaseOrder(dataPurchase);
      stockPickingIdBefore = await plusHubAPI.getStockPickingIdByApi({ product_warehouse: productName });
      await appsAPI.actionEnableDisableApp("usell", false);

      const quotationInfo = await odooService.getQuotationByProductId(productTemplateId, ["id", "state"]);
      expect(quotationInfo[0]["state"] === "sent").toEqual(true);
      //get first item, additionl item
      expect(firstItemPrice).toEqual(conf.caseConf.shipping_ali_first_item);
      expect(additionalPrice).toEqual(conf.caseConf.shipping_ali_add_item);
      expectTotalShipping = firstItemPrice + (qtyCheckout - 1) * additionalPrice;

      // checkout
      await checkoutAPI.addProductToCartThenCheckout(productsCheckout);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      const shippingFee = await checkoutAPI.getShippingFee();
      await checkout.completeOrderWithMethod("Shopbase payment");
      totalOrder = Number(removeCurrencySymbol(await checkout.getTotalOnOrderSummary()));
      orderName = await checkout.getOrderNumber();
      orderId = await checkout.getOrderIdBySDK();
      expect(isEqual(shippingFee, expectTotalShipping, 0.01)).toBe(true);
    });

    await test.step(`Verify profit trong order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await orderApi.getOrderProfit(orderId, "plusbase", true);
      await orderPage.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
      expect(baseCost).toEqual(conf.caseConf.ali_price * qtyCheckout);
      const shippingFee = Number(removeCurrencySymbol(await orderPage.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await orderPage.getSubtotalOrder()));
      const totalDiscount = 0;
      const shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      expect(shippingCost).toEqual(Number(expectTotalShipping.toFixed(2)));
      const taxInclude = 0;
      const tip = 0;

      orderPage.calculateProfitPlusbase(
        totalOrder,
        subtotal,
        totalDiscount,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        tip,
      );
      const profitActual = Number(removeCurrencySymbol(await orderPage.getProfit()));
      expect(profitActual).toEqual(Number(orderPage.profit.toFixed(2)));
    });

    await test.step(`Login vào shop template >Search order > Approve order > PlusHub > Chọn order > Click Fulfill selected order`, async () => {
      const plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      const orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      await orderTemplatePage.fulfillOrderPlusBase();
      fulfillOrdersPage = new FulfillmentPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
      await fulfillOrdersPage.navigateToFulfillmentTab("Awaiting stock");
      expect(await fulfillOrdersPage.isOrderVisiableInTab(orderName, "Awaiting stock", 25)).toEqual(true);
    });

    await test.step(`Login vào Odoo > Inventory > Receipts > Done DO-in `, async () => {
      await fulfillOrdersPage.navigateToMenuPlusHub("Warehouse");
      // Get stock picking ID after purchase
      const stockPickingId = await plusHubAPI.getStockPickingIdByApi({
        product_warehouse: productName,
        stock_picking_id_before: stockPickingIdBefore,
        is_stock_picking_id_before: true,
      });
      let doInState: string;
      await expect(async () => {
        doInState = await odooService.getStockPickingState(stockPickingId);
        expect(doInState).toEqual("assigned");
      }).toPass();
      await odooService.doneStockPicking(stockPickingId);
      await expect(async () => {
        doInState = await odooService.getStockPickingState(stockPickingId);
        expect(doInState).toEqual("done");
      }).toPass();
    });

    await test.step(`Vào Inventory > Delivery order > Search DO của order theo order name > Check available > Validate`, async () => {
      const stockPickingIds = await odooService.getStockPickingIds(
        orderName,
        conf.suiteConf.do_type,
        conf.suiteConf.owner_id,
        conf.suiteConf.max_retry,
      );
      const stockPickingId = stockPickingIds[0];
      let doOutState = await odooService.getStockPickingState(stockPickingId);
      if (doOutState === "confirmed") {
        await odooService.checkAvailabilityStockPicking(stockPickingId);
      }
      await expect(async () => {
        doOutState = await odooService.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("assigned");
      }).toPass();
      await odooService.doneStockPicking(stockPickingId);
      await expect(async () => {
        doOutState = await odooService.getStockPickingState(stockPickingId);
        expect(doOutState).toEqual("done");
      }).toPass();
    });
  });
});
