import { expect } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { Order, OrderAfterCheckoutInfo, OrderSummary, Product } from "@types";
import { SFCheckout } from "@pages/storefront/checkout";
import { isEqual } from "@core/utils/checkout";
import { removeCurrencySymbol, roundingTwoDecimalPlaces } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { profitAfterRefund } from "../utils/plusbae_profit";

let shopDomain: string;
let odooService: OdooServiceInterface;

test.describe("Verify profit khi product được apply discount", async () => {
  let productTempID: number;
  let odooCountry: string;
  let firstItemPrice, additionalItemPrice: number;
  let orderId: number;
  let productsCheckout: Array<Product>;
  let sFCheckout: SFCheckout;
  let checkoutApi: CheckoutAPI;
  let orderInfo: Order;
  let orders: OrdersPage;
  let dashboardPage: DashboardPage;
  let plusbaseOrderAPI: PlusbaseOrderAPI;
  let orderSummary: OrderSummary;
  let subTotalExp: number;
  let shippingExp: number;
  let taxExp: number;
  let totalExp: number;
  let plbTemplateShopDomain: string;
  let orderAfterCheckoutInfo: OrderAfterCheckoutInfo;
  let variantInfo;
  let baseCostExp: number;
  let discount: number;

  test.beforeEach(async ({ conf, authRequest, page, odoo }) => {
    shopDomain = conf.suiteConf.domain;
    test.setTimeout(conf.suiteConf.time_out);
    productTempID = conf.caseConf.product_template_id;
    odooCountry = conf.caseConf.odoo_country;
    productsCheckout = conf.caseConf.products_checkout;
    odooService = OdooService(odoo);
    checkoutApi = new CheckoutAPI(shopDomain, authRequest, page);
    plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    variantInfo = conf.caseConf.variant_infor;
  });

  test(`@SB_PLB_DQ_11 Verify profit order khi checkout với SO trong thời gian discount`, async ({
    dashboard,
    conf,
    multipleStore,
  }) => {
    const taxType = conf.caseConf.tax_infor.type;
    const taxRate = conf.caseConf.tax_infor.tax_rate;

    await test.step(`Thực hiện checkout với item target product`, async () => {
      const dataShipping = await odooService.getShippingDatas(productTempID, odooCountry);
      firstItemPrice = dataShipping.get("Standard Shipping").first_item_fee;
      additionalItemPrice = dataShipping.get("Standard Shipping").additional_item_fee;
      await checkoutApi.addProductToCartThenCheckout(productsCheckout);
      sFCheckout = await checkoutApi.openCheckoutPageByToken();
      await sFCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sFCheckout.applyDiscountCode(conf.caseConf.discount_info.code);
      await sFCheckout.footerLoc.scrollIntoViewIfNeeded();
      await sFCheckout.completeOrderWithMethod("Stripe");
      orderId = (await sFCheckout.getOrderInfoAfterCheckout()).orderId;
      orderSummary = await sFCheckout.getOrderSummaryInfo();

      //Verify subtotal, tax, discount, shipping fee, total
      subTotalExp = 0;
      const variantInfo = conf.caseConf.variant_infor;
      for (let i = 0; i < variantInfo.length; i++) {
        subTotalExp += variantInfo[i].selling_price * productsCheckout[i].quantity;
      }
      expect(orderSummary.subTotal).toEqual(roundingTwoDecimalPlaces(subTotalExp));
      shippingExp = 0;
      shippingExp += firstItemPrice + (productsCheckout[0].quantity - 1) * additionalItemPrice;
      for (let i = 1; i < productsCheckout.length; i++) {
        shippingExp += productsCheckout[i].quantity * additionalItemPrice;
      }
      expect(isEqual(Number(orderSummary.shippingValue), shippingExp, 0.01)).toEqual(true);
      discount = await sFCheckout.calculateDiscountByType(conf.caseConf.discount_info, subTotalExp);
      taxExp = sFCheckout.calculateTax(taxType, subTotalExp - discount, taxRate);
      expect(orderSummary.taxes).toEqual(taxExp);
      totalExp = Number((subTotalExp + taxExp + shippingExp - discount).toFixed(2));
      expect(isEqual(orderSummary.totalPrice, totalExp, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail > Verify order summary, profit của order`, async () => {
      dashboardPage = new DashboardPage(dashboard, shopDomain);
      orders = new OrdersPage(dashboardPage.page, shopDomain);
      await orders.goToOrderByOrderId(orderId);
      await orders.waitForProfitCalculated();
      const storeAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shopDomain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      plusbaseOrderAPI = new PlusbaseOrderAPI(shopDomain, storeAuth);
      orderInfo = await orders.getOrderSummaryInOrderDetail(plusbaseOrderAPI);
      baseCostExp = 0;
      for (let i = 0; i < variantInfo.length; i++) {
        baseCostExp += variantInfo[i].base_cost;
      }

      // Verify order information:basecost, shipping fee, subtotal, total order, revenue, handling fee, profit order
      expect(isEqual(orderInfo.base_cost, roundingTwoDecimalPlaces(baseCostExp), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orders.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.revenue, orders.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, orders.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, orders.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_PLB_DQ_13 Verify profit order khi checkout với variant combo trường hợp SO trong thời gian discount`, async ({
    dashboard,
    multipleStore,
    conf,
  }) => {
    const taxType = conf.caseConf.tax_infor.type;
    const taxRate = conf.caseConf.tax_infor.tax_rate;

    await test.step(`Thực hiện checkout với variant combo`, async () => {
      const dataShipping = await odooService.getShippingDatas(productTempID, odooCountry);
      firstItemPrice = dataShipping.get("Standard Shipping").first_item_fee;
      additionalItemPrice = dataShipping.get("Standard Shipping").additional_item_fee;
      await checkoutApi.addProductToCartThenCheckout(productsCheckout);
      sFCheckout = await checkoutApi.openCheckoutPageByToken();
      await sFCheckout.enterShippingAddress(conf.suiteConf.shipping_address);

      await sFCheckout.footerLoc.scrollIntoViewIfNeeded();
      await sFCheckout.completeOrderWithMethod("Stripe");
      orderId = (await sFCheckout.getOrderInfoAfterCheckout()).orderId;
      orderSummary = await sFCheckout.getOrderSummaryInfo();

      //Verify subtotal, tax, discount, shipping fee, total
      subTotalExp = 0;
      const variantInfo = conf.caseConf.variant_infor;
      for (let i = 0; i < variantInfo.length; i++) {
        subTotalExp += variantInfo[i].selling_price * productsCheckout[i].quantity;
      }
      expect(orderSummary.subTotal).toEqual(roundingTwoDecimalPlaces(subTotalExp));
      shippingExp = 0;
      shippingExp += firstItemPrice + additionalItemPrice;
      for (let i = 1; i < productsCheckout.length; i++) {
        shippingExp += productsCheckout[i].quantity * additionalItemPrice;
      }
      expect(isEqual(Number(orderSummary.shippingValue), shippingExp, 0.01)).toEqual(true);
      taxExp = sFCheckout.calculateTax(taxType, subTotalExp, taxRate);
      expect(orderSummary.taxes).toEqual(taxExp);
      totalExp = Number((subTotalExp + taxExp + shippingExp).toFixed(2));
      expect(isEqual(orderSummary.totalPrice, totalExp, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail > Verify order summary, profit của order`, async () => {
      dashboardPage = new DashboardPage(dashboard, shopDomain);
      orders = new OrdersPage(dashboardPage.page, shopDomain);
      await orders.goToOrderByOrderId(orderId);
      await orders.waitForProfitCalculated();
      const storeAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shopDomain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      plusbaseOrderAPI = new PlusbaseOrderAPI(shopDomain, storeAuth);
      orderInfo = await orders.getOrderSummaryInOrderDetail(plusbaseOrderAPI);
      baseCostExp = 0;
      for (let i = 0; i < variantInfo.length; i++) {
        baseCostExp += variantInfo[i].base_cost;
      }

      // Verify order information: shipping fee, subtotal, total order, revenue, handling fee, profit order
      expect(isEqual(orderInfo.base_cost, roundingTwoDecimalPlaces(baseCostExp), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orders.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.revenue, orders.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, orders.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, orders.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_PLB_DQ_14 Verify profit order khi checkout với variant combo trường hợp SO hết hạn discount`, async ({
    dashboard,
    multipleStore,
    conf,
  }) => {
    const taxType = conf.caseConf.tax_infor.type;
    const taxRate = conf.caseConf.tax_infor.tax_rate;
    let discount;

    await test.step(`Thực hiện checkout với variant combo`, async () => {
      const dataShipping = await odooService.getShippingDatas(productTempID, odooCountry);
      firstItemPrice = dataShipping.get("Standard Shipping").first_item_fee;
      additionalItemPrice = dataShipping.get("Standard Shipping").additional_item_fee;
      await checkoutApi.addProductToCartThenCheckout(productsCheckout);
      sFCheckout = await checkoutApi.openCheckoutPageByToken();
      await sFCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sFCheckout.applyDiscountCode(conf.caseConf.discount_info.code);
      await sFCheckout.footerLoc.scrollIntoViewIfNeeded();
      await sFCheckout.completeOrderWithMethod("Stripe");
      orderId = (await sFCheckout.getOrderInfoAfterCheckout()).orderId;
      orderSummary = await sFCheckout.getOrderSummaryInfo();

      //Verify subtotal, tax, discount, shipping fee, total
      subTotalExp = 0;

      for (let i = 0; i < variantInfo.length; i++) {
        subTotalExp += variantInfo[i].selling_price * productsCheckout[i].quantity;
      }
      expect(orderSummary.subTotal).toEqual(roundingTwoDecimalPlaces(subTotalExp));
      shippingExp = 0;
      shippingExp += firstItemPrice + additionalItemPrice;
      for (let i = 1; i < productsCheckout.length; i++) {
        shippingExp += productsCheckout[i].quantity * additionalItemPrice;
      }
      expect(isEqual(Number(orderSummary.shippingValue), shippingExp, 0.01)).toEqual(true);
      discount = await sFCheckout.calculateDiscountByType(conf.caseConf.discount_info, subTotalExp);
      taxExp = sFCheckout.calculateTax(taxType, subTotalExp - discount, taxRate);
      expect(orderSummary.taxes).toEqual(taxExp);
      totalExp = Number((subTotalExp + taxExp + shippingExp - discount).toFixed(2));
      expect(isEqual(orderSummary.totalPrice, totalExp, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail > Verify order summary, profit của order`, async () => {
      dashboardPage = new DashboardPage(dashboard, shopDomain);
      orders = new OrdersPage(dashboardPage.page, shopDomain);
      await orders.goToOrderByOrderId(orderId);
      await orders.waitForProfitCalculated();
      const storeAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shopDomain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      plusbaseOrderAPI = new PlusbaseOrderAPI(shopDomain, storeAuth);
      orderInfo = await orders.getOrderSummaryInOrderDetail(plusbaseOrderAPI);
      baseCostExp = 0;
      for (let i = 0; i < variantInfo.length; i++) {
        baseCostExp += variantInfo[i].base_cost;
      }

      // Verify order information: shipping fee, subtotal, total order, revenue, handling fee, profit order
      expect(isEqual(orderInfo.base_cost, roundingTwoDecimalPlaces(baseCostExp), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orders.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.revenue, orders.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, orders.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, orders.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_PLB_DQ_17 Verify profit của order sau khi cancel item trường hợp SO trong thời  gian discount`, async ({
    dashboard,
    conf,
    multipleStore,
  }) => {
    const taxType = conf.caseConf.tax_infor.type;
    const taxRate = conf.caseConf.tax_infor.tax_rate;
    let profitActualAfterCancel;
    const refunds = conf.caseConf.refunds;
    await test.step(`Mở SF > Thực hiện checkout với target product`, async () => {
      dashboardPage = new DashboardPage(dashboard, shopDomain);

      const dataShipping = await odooService.getShippingDatas(productTempID, odooCountry);
      firstItemPrice = dataShipping.get("Standard Shipping").first_item_fee;
      additionalItemPrice = dataShipping.get("Standard Shipping").additional_item_fee;
      await checkoutApi.addProductToCartThenCheckout(productsCheckout);
      sFCheckout = await checkoutApi.openCheckoutPageByToken();
      await sFCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sFCheckout.applyDiscountCode(conf.caseConf.discount_info.code);
      await sFCheckout.footerLoc.scrollIntoViewIfNeeded();
      await sFCheckout.completeOrderWithMethod("Stripe");
      orderAfterCheckoutInfo = await sFCheckout.getOrderInfoAfterCheckout();
      orderId = orderAfterCheckoutInfo.orderId;
      orderSummary = await sFCheckout.getOrderSummaryInfo();

      //Verify subtotal, tax, discount, shipping fee, total
      subTotalExp = 0;
      const variantInfo = conf.caseConf.variant_infor;
      for (let i = 0; i < variantInfo.length; i++) {
        subTotalExp += variantInfo[i].selling_price * productsCheckout[i].quantity;
      }
      expect(orderSummary.subTotal).toEqual(roundingTwoDecimalPlaces(subTotalExp));
      shippingExp = 0;
      shippingExp += firstItemPrice + (productsCheckout[0].quantity - 1) * additionalItemPrice;
      for (let i = 1; i < productsCheckout.length; i++) {
        shippingExp += productsCheckout[i].quantity * additionalItemPrice;
      }
      expect(isEqual(Number(orderSummary.shippingValue), shippingExp, 0.01)).toEqual(true);
      discount = await sFCheckout.calculateDiscountByType(conf.caseConf.discount_info, subTotalExp);
      taxExp = sFCheckout.calculateTax(taxType, subTotalExp - discount, taxRate);
      expect(orderSummary.taxes).toEqual(taxExp);
      totalExp = Number((subTotalExp + taxExp + shippingExp - discount).toFixed(2));
      expect(isEqual(orderSummary.totalPrice, totalExp, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail > Verify order summary, profit của order`, async () => {
      dashboardPage = new DashboardPage(dashboard, shopDomain);
      orders = new OrdersPage(dashboardPage.page, shopDomain);
      await orders.goToOrderByOrderId(orderId);
      await orders.waitForProfitCalculated();
      const storeAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shopDomain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      plusbaseOrderAPI = new PlusbaseOrderAPI(shopDomain, storeAuth);
      orderInfo = await orders.getOrderSummaryInOrderDetail(plusbaseOrderAPI);
      baseCostExp = 0;
      for (let i = 0; i < variantInfo.length; i++) {
        baseCostExp += variantInfo[i].base_cost;
      }

      // Verify order information: shipping fee, subtotal, total order, revenue, handling fee, profit order
      expect(isEqual(orderInfo.base_cost, roundingTwoDecimalPlaces(baseCostExp), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orders.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.revenue, orders.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, orders.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, orders.profit, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail trên store template > Chọn More actions > Cancel order > Verify profit của order`, async () => {
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        plbTemplateShopDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      const plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
      const orderTplPage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
      await orderTplPage.goToOrderStoreTemplateByOrderId(orderAfterCheckoutInfo.orderId);
      await orderTplPage.waitForProfitCalculated();
      const templateStoreAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        plbTemplateShopDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      const plbOrderApi = new PlusbaseOrderAPI(plbTemplateShopDomain, templateStoreAuth);
      const orderResponse = await plbOrderApi.searchOrders({
        search: orderAfterCheckoutInfo.orderName,
        name: orderAfterCheckoutInfo.orderName,
        plb_profit: true,
      });
      const plbOrder = await plbOrderApi.getOrderPlbDetail(orderResponse.data.orders[0].id, {
        retry: 10,
        waitBefore: 3000,
      });

      await orderTplPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await orderTplPage.page.reload({ waitUntil: "networkidle" });
      const profitExpect = profitAfterRefund(plbOrder, conf.caseConf.info_refund);
      await orderTplPage.inputRefundItems(refunds, plbOrderApi, orderAfterCheckoutInfo);
      await orderTplPage.clickButton("Cancel");
      await orderTplPage.waitForElementVisibleThenInvisible(orderTplPage.xpathLoadingButton);

      //Verify profit after refund
      await expect(async () => {
        await orderTplPage.page.reload({ waitUntil: "load" });
        profitActualAfterCancel = Number(removeCurrencySymbol(await orderTplPage.getProfit()));
        expect(isEqual(profitActualAfterCancel, profitExpect, 0.01)).toEqual(true);
      }).toPass();
    });

    await test.step(`Vào order detail > Click "View invoice" > Verify tạo invoice cancel vào balance`, async () => {
      orders = new OrdersPage(dashboardPage.page, shopDomain);
      await orders.page.reload({ waitUntil: "networkidle" });
      await orders.clickButton("View invoice");
      const refundSellerActual = Number(removeCurrencySymbol(await orders.getAmountInvoiceDetail("Refund for seller")));
      const refundBuyerActual = Number(
        removeCurrencySymbol(await orders.getAmountInvoiceDetail("refund for buyer")).replace("-", ""),
      );
      const chargeOrderActual = Number(
        removeCurrencySymbol(await orders.getAmountInvoiceDetail("Charged from the order")),
      );
      const profitOrder = chargeOrderActual + refundSellerActual - refundBuyerActual;

      expect(profitActualAfterCancel - profitOrder >= -0.01 && profitActualAfterCancel - profitOrder <= 0.01).toEqual(
        true,
      );
    });
  });

  test(`@SB_PLB_DQ_18 Verify profit của order sau khi refund partially unit line items trường hợp SO trong thời  gian discount`, async ({
    dashboard,
    conf,
    multipleStore,
  }) => {
    const taxType = conf.caseConf.tax_infor.type;
    const taxRate = conf.caseConf.tax_infor.tax_rate;
    let profitActualAfterRefund;
    let orderTplPage: OrdersPage;

    await test.step(`Mở SF > Thực hiện checkout với target product`, async () => {
      dashboardPage = new DashboardPage(dashboard, shopDomain);
      const dataShipping = await odooService.getShippingDatas(productTempID, odooCountry);
      firstItemPrice = dataShipping.get("Standard Shipping").first_item_fee;
      additionalItemPrice = dataShipping.get("Standard Shipping").additional_item_fee;
      await checkoutApi.addProductToCartThenCheckout(productsCheckout);
      sFCheckout = await checkoutApi.openCheckoutPageByToken();
      await sFCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sFCheckout.applyDiscountCode(conf.caseConf.discount_info.code);
      await sFCheckout.footerLoc.scrollIntoViewIfNeeded();
      await sFCheckout.completeOrderWithMethod("Stripe");
      orderAfterCheckoutInfo = await sFCheckout.getOrderInfoAfterCheckout();
      orderId = orderAfterCheckoutInfo.orderId;
      orderSummary = await sFCheckout.getOrderSummaryInfo();

      //Verify subtotal, tax, discount, shipping fee, total
      subTotalExp = 0;
      const variantInfo = conf.caseConf.variant_infor;
      for (let i = 0; i < variantInfo.length; i++) {
        subTotalExp += variantInfo[i].selling_price * productsCheckout[i].quantity;
      }
      expect(orderSummary.subTotal).toEqual(roundingTwoDecimalPlaces(subTotalExp));
      shippingExp = 0;
      shippingExp += firstItemPrice + (productsCheckout[0].quantity - 1) * additionalItemPrice;
      for (let i = 1; i < productsCheckout.length; i++) {
        shippingExp += productsCheckout[i].quantity * additionalItemPrice;
      }
      expect(orderAfterCheckoutInfo.shippingSF).toEqual("Free");
      taxExp = sFCheckout.calculateTax(taxType, subTotalExp, taxRate);
      expect(orderSummary.taxes).toEqual(taxExp);
      totalExp = Number((subTotalExp + taxExp).toFixed(2));
      expect(isEqual(orderSummary.totalPrice, totalExp, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail > Verify order summary, profit của order`, async () => {
      dashboardPage = new DashboardPage(dashboard, shopDomain);
      orders = new OrdersPage(dashboardPage.page, shopDomain);
      await orders.goToOrderByOrderId(orderId);
      await orders.waitForProfitCalculated();
      const storeAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shopDomain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      plusbaseOrderAPI = new PlusbaseOrderAPI(shopDomain, storeAuth);
      orderInfo = await orders.getOrderSummaryInOrderDetail(plusbaseOrderAPI);
      baseCostExp = 0;
      for (let i = 0; i < variantInfo.length; i++) {
        baseCostExp += variantInfo[i].base_cost;
      }

      // Verify order information: shipping fee, subtotal, total order, revenue, handling fee, profit order
      expect(isEqual(orderInfo.base_cost, roundingTwoDecimalPlaces(baseCostExp), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.subtotal, orderSummary.subTotal, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.shipping_fee, shippingExp, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.tax_amount, Number(orderSummary.taxes), 0.01)).toEqual(true);
      expect(isEqual(orderInfo.total, orderSummary.totalPrice, 0.01)).toEqual(true);

      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orders.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingVal,
      );

      expect(isEqual(orderInfo.revenue, orders.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, orders.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, orders.profit, 0.01)).toEqual(true);
    });

    await test.step(`Vào order detail > Approve order > Chọn Refund orders > Verify profit của order`, async () => {
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        plbTemplateShopDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      const templateStoreAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        plbTemplateShopDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );

      const plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
      orderTplPage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
      await orderTplPage.goToOrderStoreTemplateByOrderId(orderAfterCheckoutInfo.orderId);
      await orderTplPage.waitForProfitCalculated();

      const totalOrderActual = Number(removeCurrencySymbol(await orderTplPage.getTotalOrder()));
      expect(totalOrderActual).toEqual(orderSummary.totalPrice);
      await orderTplPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const actualResult = await orderTplPage.getApproveStatus();
      expect(actualResult).toEqual("Approved");
      const paidByCustomerActual = Number(removeCurrencySymbol(await orderTplPage.getPaidByCustomer()));
      expect(paidByCustomerActual).toEqual(totalOrderActual);
      const plbOrderApi = new PlusbaseOrderAPI(plbTemplateShopDomain, templateStoreAuth);
      orderInfo = await orderTplPage.getOrderSummaryInOrderDetail(plbOrderApi);

      // Verify order profit
      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orderTplPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingVal,
      );
      expect(isEqual(orderInfo.revenue, orderTplPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, orderTplPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, orderTplPage.profit, 0.01)).toEqual(true);

      //Refund order
      const orderResponse = await plbOrderApi.searchOrders({
        search: orderAfterCheckoutInfo.orderName,
        name: orderAfterCheckoutInfo.orderName,
        plb_profit: true,
      });
      const plbOrder = await plbOrderApi.getOrderPlbDetail(orderResponse.data.orders[0].id, {
        retry: 10,
        waitBefore: 3000,
      });
      await orderTplPage.clickOnBtnWithLabel("Refund order");
      const profitExpect = profitAfterRefund(plbOrder, conf.caseConf.info_refund);

      await orderTplPage.inputRefundItems(conf.caseConf.refunds, plbOrderApi, orderAfterCheckoutInfo);
      await orderTplPage.clickButton("Refund");
      await orderTplPage.waitForElementVisibleThenInvisible(orderTplPage.xpathLoadingButton);
      await orderTplPage.page.waitForLoadState("load");
      const paymentStatus = await orderTplPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");

      // Verify profit sau khi refund
      await expect(async () => {
        await orderTplPage.page.reload({ waitUntil: "load" });
        profitActualAfterRefund = Number(removeCurrencySymbol(await orderTplPage.getProfit()));
        expect(isEqual(profitActualAfterRefund, profitExpect, 0.01)).toEqual(true);
      }).toPass();
    });

    await test.step(`Vào order detail > Click "View invoice" > Verify tạo invoice refund vào balance`, async () => {
      orders = new OrdersPage(dashboardPage.page, shopDomain);
      await orders.page.reload({ waitUntil: "networkidle" });
      await orders.clickButton("View invoice");
      const refundSellerActual = Number(removeCurrencySymbol(await orders.getAmountInvoiceDetail("Refund for seller")));
      const refundBuyerActual = Number(
        removeCurrencySymbol(await orders.getAmountInvoiceDetail("refund for buyer")).replace("-", ""),
      );
      const chargeOrderActual = Number(
        removeCurrencySymbol(await orders.getAmountInvoiceDetail("Charged from the order")),
      );
      const profitOrder = chargeOrderActual + refundSellerActual - refundBuyerActual;

      expect(profitActualAfterRefund - profitOrder >= -0.01 && profitActualAfterRefund - profitOrder <= 0.01).toEqual(
        true,
      );
    });
  });
});
