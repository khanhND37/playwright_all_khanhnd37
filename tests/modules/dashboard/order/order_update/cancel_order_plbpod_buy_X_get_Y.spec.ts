import { test } from "@fixtures/odoo";
import { expect } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DashboardAPI } from "@pages/api/dashboard";
import { removeCurrencySymbol } from "@core/utils/string";
import type { OrderAfterCheckoutInfo, OrderSummary, ProductCheckoutInfo } from "@types";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { isEqual } from "@core/utils/checkout";
import { profitAfterRefund } from "tests/modules/plusbase/utils/plusbae_profit";
import { APIRequestContext } from "@playwright/test";

let products: Array<ProductCheckoutInfo>;
let plbTemplateDashboardPage: DashboardPage;
let shopDomain: string, shopTmplDomain: string;
let infoOrder: OrderAfterCheckoutInfo;
let templateStoreAuth: APIRequestContext;
let plbOrderApi: PlusbaseOrderAPI;
let orderSummary: OrderSummary;

test.describe("Verify refund/ cancel order @SB_PLB_PODPL_PODPO_44", async () => {
  test.beforeAll(async ({ conf, browser }) => {
    const ctx = await browser.newContext();
    const tmplPage = await ctx.newPage();
    shopDomain = conf.suiteConf.domain;
    shopTmplDomain = conf.suiteConf.plb_template.domain;
    plbTemplateDashboardPage = new DashboardPage(tmplPage, shopTmplDomain);
    products = conf.caseConf.products;
    test.setTimeout(conf.suiteConf.time_out);
  });

  test(`@SB_PLB_PODPL_PODPO_44 Verify refund order có discount type buy x get y, order có line POD và line Dropship, order có tax include`, async ({
    authRequest,
    conf,
    page,
    multipleStore,
    dashboard,
  }) => {
    const dashboardApi = new DashboardAPI(shopDomain, authRequest);
    await dashboardApi.updateTaxSettingPbPlb({ isTaxInclude: conf.caseConf.tax_include });
    let tmplOrderPage: OrdersPage;
    let orderId: number;
    let orderName: string;
    let profitActualAfterRefund;
    await test.step(`Create Order`, async () => {
      const checkout = new SFCheckout(page, conf.suiteConf.domain);
      infoOrder = await checkout.createStripeOrderMultiProduct(
        conf.suiteConf.customer_info,
        conf.caseConf.discount_code,
        products,
        conf.suiteConf.card_info,
      );
      orderId = infoOrder.orderId;
      orderName = infoOrder.orderName;
      orderSummary = await checkout.getOrderSummaryInfo();
    });

    await test.step(`Vào dashboard shop template PlusBase > Orders > All orders > Search orders > approve order > Verify thông tin order`, async () => {
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template.username,
        conf.suiteConf.plb_template.password,
        conf.suiteConf.plb_template.domain,
        conf.suiteConf.plb_template.shop_id,
        conf.suiteConf.plb_template.user_id,
      );
      plbTemplateDashboardPage = new DashboardPage(templatePage, conf.suiteConf.plb_template.domain);
      tmplOrderPage = new OrdersPage(plbTemplateDashboardPage.page, conf.suiteConf.plb_template.domain);
      await tmplOrderPage.goToOrderStoreTemplateByOrderId(orderId);
      await tmplOrderPage.waitForProfitCalculated();
      await tmplOrderPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      expect(await tmplOrderPage.getApproveStatus()).toEqual("Approved");
      templateStoreAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        conf.suiteConf.plb_template.domain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      plbOrderApi = new PlusbaseOrderAPI(conf.suiteConf.plb_template.domain, templateStoreAuth);
      const orderInfo = await tmplOrderPage.getOrderSummaryInOrderDetail(plbOrderApi);

      //Verify profit
      let taxInclude = 0;
      const tax = Number(removeCurrencySymbol(await tmplOrderPage.getTax()));
      const taxDesciption = await tmplOrderPage.getTaxDesciption();
      expect(taxDesciption).toContain("include");
      taxInclude = tax;
      tmplOrderPage.calculateProfitPlusbase(
        orderSummary.totalPrice,
        orderSummary.subTotal,
        Math.abs(Number(orderSummary.discountValue)),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        Number(orderSummary.shippingValue),
        taxInclude,
        orderSummary.tippingVal,
      );
      expect(isEqual(orderInfo.revenue, tmplOrderPage.revenue, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.handling_fee, tmplOrderPage.handlingFee, 0.01)).toEqual(true);
      expect(isEqual(orderInfo.profit, tmplOrderPage.profit, 0.01)).toEqual(true);
    });

    await test.step(`Chọn "Refund order" > Refund cho seller: nhập giá trị các field đúng bằng {amount} available > click "Refund" > Verify thông tin profit của order`, async () => {
      templateStoreAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        conf.suiteConf.plb_template.domain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );
      plbOrderApi = new PlusbaseOrderAPI(conf.suiteConf.plb_template.domain, templateStoreAuth);
      const orderResponse = await plbOrderApi.searchOrders({
        search: orderName,
        name: orderName,
        plb_profit: true,
      });
      const plbOrder = await plbOrderApi.getOrderPlbDetail(orderResponse.data.orders[0].id, {
        retry: 10,
        waitBefore: 3000,
      });

      //Refund order
      await tmplOrderPage.clickOnBtnWithLabel("Refund order");
      const profitExpect = profitAfterRefund(plbOrder, conf.caseConf.info_refund);
      await tmplOrderPage.inputRefundItems(conf.caseConf.refunds, plbOrderApi, infoOrder);
      await tmplOrderPage.clickButton("Refund");
      await tmplOrderPage.waitForElementVisibleThenInvisible(tmplOrderPage.xpathLoadingButton);
      await tmplOrderPage.page.waitForLoadState("load");
      const paymentStatus = await tmplOrderPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");

      // Verify profit sau khi refund
      await expect(async () => {
        await tmplOrderPage.page.reload({ waitUntil: "load" });
        profitActualAfterRefund = Number(removeCurrencySymbol(await tmplOrderPage.getProfit()));
        expect(isEqual(profitActualAfterRefund, profitExpect, 0.01)).toEqual(true);
      }).toPass();
    });

    await test.step(`Vào shop merchant > Verify invoice`, async () => {
      const orderPage = new OrdersPage(dashboard, shopDomain);
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.clickButton("View invoice");
      const refundSellerActual = Number(
        removeCurrencySymbol(await orderPage.getAmountInvoiceDetail("Refund for seller")),
      );
      const refundBuyerActual = Number(
        removeCurrencySymbol(await orderPage.getAmountInvoiceDetail("refund for buyer")).replace("-", ""),
      );
      const chargeOrderActual = Number(
        removeCurrencySymbol(await orderPage.getAmountInvoiceDetail("Charged from the order")),
      );
      const profitOrder = chargeOrderActual + refundSellerActual - refundBuyerActual;
      expect(profitActualAfterRefund - profitOrder >= -0.01 && profitActualAfterRefund - profitOrder <= 0.01).toEqual(
        true,
      );
    });
  });
});
