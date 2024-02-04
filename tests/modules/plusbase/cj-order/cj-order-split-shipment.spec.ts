import { isEqual } from "@core/utils/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrderAPI } from "@pages/api/order";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { OrdersPage, Action } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { expect } from "@playwright/test";
import { OdooServiceInterface, OdooService } from "@services/odoo";

import { test } from "@fixtures/odoo";
import { DataShippingPack, Order, OrderAfterCheckoutInfo } from "@types";
import { calShippingCostByPack } from "@core/utils/order";

test.describe("Verify shipping cost khi checkout với 1 product có quantity < config split shipment", async () => {
  let domain: string;
  let odooService: OdooServiceInterface;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let orderTemplatePage: OrdersPage;
  let firstItemPrice, additionalItemPrice;
  let orderApi: OrderAPI;
  let shippingFee: number;
  let checkout: SFCheckout;
  let plbTemplateDashboardPage: DashboardPage;
  let plbTemplateShopDomain: string;
  let fulfillOrdersPage: FulfillmentPage;
  let homePage: SFHome;
  let productTmplId: number;
  let odooCountry: string;
  let productProductId: number;
  let orderSummary: OrderAfterCheckoutInfo;
  let orderId: number;
  let orderInfo: Order;
  let dashboardPage: DashboardPage;
  let dataShippingPack: DataShippingPack;
  let shippingMethod: string;

  test.beforeEach(async ({ page, authRequest, multipleStore, conf, odoo, dashboard }) => {
    test.setTimeout(conf.suiteConf.time_out);
    domain = conf.suiteConf.domain;
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    odooService = OdooService(odoo);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    homePage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    dashboardPage = new DashboardPage(dashboard, domain);
    orderPage = new OrdersPage(dashboardPage.page, domain);
    orderApi = new OrderAPI(domain, authRequest);
    productTmplId = conf.caseConf.product_tmpl_id;
    productProductId = conf.caseConf.product_product_id;
    odooCountry = conf.caseConf.odoo_country;
    shippingMethod = conf.suiteConf.shipping_method;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template["username"],
      conf.suiteConf.plb_template["password"],
      plbTemplateShopDomain,
      conf.suiteConf.plb_template["shop_id"],
      conf.suiteConf.plb_template["user_id"],
    );
    plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
    orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
    fulfillOrdersPage = new FulfillmentPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
  });

  test(`@SB_PLB_CJ_OP_27 Verify shipping cost khi checkout với 1 product có quantity < config split shipment`, async ({
    conf,
    authRequest,
  }) => {
    //get first item, additionl item
    const dataShipping = await odooService.getShippingDatas(productTmplId, odooCountry, productProductId);
    firstItemPrice = dataShipping.get(shippingMethod).first_item_fee;
    additionalItemPrice = dataShipping.get(shippingMethod).additional_item_fee;
    const productsCheckout = conf.caseConf.products_checkout;

    await test.step(`Vào SF > Search product > Thực hiện checkout order > Verify shipping fee`, async () => {
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
      await checkoutAPI.addProductToCartThenCheckout(productsCheckout);
      await checkoutAPI.updateCustomerInformation(conf.suiteConf.email_buyer, conf.suiteConf.customer_info);
      await checkoutAPI.openCheckoutPageByToken();
      const res = await checkoutAPI.getShippingMethodInfo("US");
      shippingFee = res[0].amount;
      const packageRuleQuantity = await odooService.getProductVariantsByProductTemplateId(productTmplId, [
        "x_fulfillment_package_rule_max_quantity",
      ]);
      const totalItems = productsCheckout[0].quantity;
      dataShippingPack = calShippingCostByPack(
        totalItems,
        packageRuleQuantity[0].x_fulfillment_package_rule_max_quantity,
        firstItemPrice,
        additionalItemPrice,
      );
      expect(shippingFee).toEqual(dataShippingPack.shipping_cost);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod("Shopbase payment");
      expect(await checkout.isTextVisible("Thank you!")).toEqual(true);
    });

    await test.step(`Vào order detail order vừa tạo > Verify shipping cost`, async () => {
      const plbOrder = new PlusbaseOrderAPI(domain, authRequest);
      orderSummary = await checkout.getOrderInfoAfterCheckout();
      orderId = orderSummary.orderId;
      await orderPage.goToOrderByOrderId(orderId);
      await orderApi.getOrderProfit(orderId, "plusbase", true);
      await orderPage.page.reload();
      orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrder);
      const shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
      expect(shippingCost).toEqual(shippingFee);
      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orderPage.calculateProfitPlusbase(
        orderSummary.totalSF,
        orderSummary.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummary.tippingValue,
      );
      expect(isEqual(orderInfo.profit, orderPage.profit, 0.01)).toEqual(true);
    });

    await test.step(`Login dashboard store template > Order > Vào order detail > Thực hiện approve order > Click PlusHub > Thực hiện fulfill`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      expect(await orderTemplatePage.getApproveStatus()).toEqual("Approved");
      await orderTemplatePage.clickOnBtnWithLabel("PlusHub");
      await orderTemplatePage.page.waitForLoadState("networkidle");
      await fulfillOrdersPage.removeFilterOrderPlusBase();
      let isCheck = false;
      let i = 0;
      while (!isCheck && i < 3) {
        await fulfillOrdersPage.navigateToFulfillmentTab("To fulfill");
        await fulfillOrdersPage.clickFulfillSelectedOrder();
        await fulfillOrdersPage.clickOnBtnWithLabel("Confirm");
        isCheck = await fulfillOrdersPage.isTextVisible("You have no order that needs to fulfill yet.");
        i++;
      }
      await fulfillOrdersPage.page.reload();
      await fulfillOrdersPage.removeFilterOrderPlusBase();
      expect(
        await fulfillOrdersPage.isOrderVisiableInTab(
          orderSummary.orderName,
          "Awaiting stock",
          conf.suiteConf.max_retry,
        ),
      ).toEqual(true);
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await expect(async () => {
        expect(await orderTemplatePage.countLineFulfillment()).toEqual(dataShippingPack.split_pack);
      }).toPass();
      const paidByCustomer = await orderTemplatePage.getPaidByCustomer();
      expect(isEqual(Number(removeCurrencySymbol(paidByCustomer)), orderSummary.totalSF, 0.01)).toBe(true);
    });
  });
});
