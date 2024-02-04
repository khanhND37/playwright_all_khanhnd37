import { expect, request, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFCheckout } from "@sf_pages/checkout";
import type { OrderAfterCheckoutInfo } from "@types";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@utils/string";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { DashboardAPI } from "@pages/api/dashboard";
import { isEqual } from "@core/utils/checkout";

let shopDomain: string;
let plbTemplateShopDomain: string;
let dashboardPage: DashboardPage;
let dashboardAPI: DashboardAPI;
let plbTemplateDashboardPage: DashboardPage;
let infoOrder: OrderAfterCheckoutInfo;
let adminToken: string;
let plbToken: string;
let refunds;

test.beforeAll(async ({ conf, browser, authRequest }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  shopDomain = conf.suiteConf.domain;
  plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
  dashboardPage = new DashboardPage(page, shopDomain);
  plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
  dashboardAPI = new DashboardAPI(shopDomain, authRequest);

  adminToken = await dashboardPage.getAccessToken({
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
});

test.beforeEach(async ({ page, conf }) => {
  test.setTimeout(conf.suiteConf.time_out);
  await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: conf.caseConf.tax_include });
  const checkout = new SFCheckout(page, conf.suiteConf.domain);
  refunds = conf.caseConf.refunds;
  infoOrder = await checkout.createStripeOrderMultiProduct(
    conf.suiteConf.customer_info,
    conf.caseConf.discount,
    conf.caseConf.products,
    conf.suiteConf.card_info,
  );
  await checkout.addProductPostPurchase(null);
});

test.describe(`Cancel partially of PlusBase order unapproved @TS_SB_PLB_ROPLB_57+51`, () => {
  test(`Verify cancel partially combo line items @TC_SB_PLB_ROPLB_57`, async ({ page, conf, authRequest }) => {
    const shopDomain = conf.suiteConf["domain"];
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const ordersPage = new OrdersPage(page, shopDomain);
    const plbOrderApi = new PlusbaseOrderAPI(shopDomain, authRequest);
    const plbDashboardPage = new DashboardPage(page, shopDomain);
    let profitExpect;
    let profitActual;

    await test.step(`Vào order detail > Click button "More actions" > chọn "Cancel order" >
      chọn "Cancel/Refund combo line items" > nhập thông tin refund partially > click "Cancel"`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      await ordersPage.waitForProfitCalculated();
      await ordersPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_COMBO);

      // thực hiện nhập quantity & amount refund -> tính profit sau refund
      const { profitAfterRefund } = await ordersPage.inputRefundItems(refunds, plbOrderApi, infoOrder);
      profitExpect = profitAfterRefund;
      await ordersPage.clickButton("Cancel");
      await ordersPage.page.waitForLoadState("networkidle");
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Authorized");
      await ordersPage.page.reload({ waitUntil: "networkidle" });
      profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(isEqual(profitActual, profitExpect, 0.01)).toBe(true);
    });

    await test.step(`Vào shop PlusBase > verify order detail sau khi cancel`, async () => {
      adminToken = await dashboardPage.getAccessToken({
        shopId: conf.suiteConf["shop_id"],
        userId: conf.suiteConf["user_id"],
        baseURL: conf.suiteConf["api"],
        username: conf.suiteConf["username"],
        password: conf.suiteConf["password"],
      });
      await plbDashboardPage.loginWithToken(adminToken);
      await plbDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);

      profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual - profitExpect >= -0.01 && profitActual - profitExpect <= 0.01).toEqual(true);
      const paymentActual = await ordersPage.getPaymentStatus();
      expect(paymentActual).toEqual("Authorized");
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain("PlusBase canceled some items. Reason: Other");
    });

    await test.step(`Click "View invoice" > Verify tạo invoice refund vào balance`, async () => {
      await ordersPage.clickButton("View invoice");
      const refundSellerActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("Refund for seller")),
      );
      const refundBuyerActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("refund for buyer")).replace("-", ""),
      );
      const chargeOrderActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("Charged from the order")),
      );
      const profitOrder = chargeOrderActual + refundSellerActual - refundBuyerActual;
      expect(profitActual - profitOrder >= -0.01 && profitActual - profitOrder <= 0.01).toEqual(true);
    });
  });

  test(`Verify cancel partially unit line items @TC_SB_PLB_ROPLB_51`, async ({ page, conf, authRequest }) => {
    const shopDomain = conf.suiteConf["domain"];
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const ordersPage = new OrdersPage(page, shopDomain);
    const plbOrderApi = new PlusbaseOrderAPI(shopDomain, authRequest);
    const context = await request.newContext();
    const tplOrderApi = new PlusbaseOrderAPI(plbTemplateShopDomain, context);
    const plbDashboardPage = new DashboardPage(page, shopDomain);

    let profitExpect;
    let profitActual;

    await test.step(`Vào order detail > Click button "More actions" > chọn "Cancel order" >
      chọn "cancel/Refund unit line items" > nhập thông tin refund partially > click "Cancel"`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      await ordersPage.waitForProfitCalculated();
      await ordersPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_UNIT);

      // thực hiện nhập quantity & amount refund -> tính profit sau refund
      const { profitAfterRefund } = await ordersPage.inputRefundItems(refunds, plbOrderApi, infoOrder);
      profitExpect = profitAfterRefund;
      await ordersPage.clickButton("Cancel");
      await page.waitForLoadState("load");

      // verify activity log
      await tplOrderApi.waitForLogActivity(infoOrder.orderId, "refund-order", plbToken);
      await page.reload();
      await ordersPage.page.click(ordersPage.xpathTabActivity);
      await expect(
        ordersPage.page.locator(
          ordersPage.xpathActivityLog(0, conf.suiteConf.plb_template.username).activityCanceldOrder,
        ),
      ).toBeVisible();
    });

    await test.step(`Vào shop PlusBase > verify order detail sau khi cancel`, async () => {
      adminToken = await dashboardPage.getAccessToken({
        shopId: conf.suiteConf["shop_id"],
        userId: conf.suiteConf["user_id"],
        baseURL: conf.suiteConf["api"],
        username: conf.suiteConf["username"],
        password: conf.suiteConf["password"],
      });
      await plbDashboardPage.loginWithToken(adminToken);
      await plbDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual - profitExpect >= -0.01 && profitActual - profitExpect <= 0.01).toEqual(true);
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Authorized");
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain("PlusBase canceled some items. Reason: Other");
    });

    await test.step(`Click "View invoice" > Verify tạo invoice refund vào balance`, async () => {
      await ordersPage.clickButton("View invoice");
      const refundSellerActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("Refund for seller")),
      );
      const refundBuyerActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("refund for buyer")).replace("-", ""),
      );
      const chargeOrderActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("Charged from the order")),
      );
      const profitOrder = chargeOrderActual + refundSellerActual - refundBuyerActual;
      expect(profitActual - profitOrder >= -0.01 && profitActual - profitOrder <= 0.01).toEqual(true);
    });
  });
});

test.describe(`Cancel of PlusBase order approved @TS_SB_PLB_ROPLB_56+52`, () => {
  test(`Verify cancel combo line items @TC_SB_PLB_ROPLB_56`, async ({ page, conf }) => {
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const ordersPage = new OrdersPage(page, shopDomain);
    const plbDashboardPage = new DashboardPage(page, shopDomain);

    await test.step(`Vào dashboard shop template PlusBase > vào order detail > Approve order`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      await ordersPage.waitForProfitCalculated();
      const totalOrderActual = Number(removeCurrencySymbol(await ordersPage.getTotalOrder()));
      expect(totalOrderActual).toEqual(infoOrder.totalSF);
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const actualResult = await ordersPage.getApproveStatus();
      expect(actualResult).toEqual("Approved");
      const paidByCustomerActual = Number(removeCurrencySymbol(await ordersPage.getPaidByCustomer()));
      expect(paidByCustomerActual).toEqual(totalOrderActual);
    });

    await test.step(`Click button "More actions" > chọn "Cancel order" > chọn "Cancel/refund combo line items" >
      nhập thông tin refund > click "Cancel"`, async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_COMBO);
      await ordersPage.page.waitForLoadState("networkidle");
      await ordersPage.clickButton("Cancel");
      const cancelActual = await ordersPage.getCancelStatus();
      expect(cancelActual).toEqual("Cancelled");
    });

    await test.step(`Vào shop PlusBase > verify order detail sau khi cancel`, async () => {
      adminToken = await dashboardPage.getAccessToken({
        shopId: conf.suiteConf["shop_id"],
        userId: conf.suiteConf["user_id"],
        baseURL: conf.suiteConf["api"],
        username: conf.suiteConf["username"],
        password: conf.suiteConf["password"],
      });
      await plbDashboardPage.loginWithToken(adminToken);
      await plbDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      await ordersPage.clickShowCalculation();

      const baseCostActual = Number(removeCurrencySymbol(await ordersPage.getBaseCost()));
      expect(baseCostActual >= -0.01 && baseCostActual <= 0.01).toEqual(true);
      const handlingFeeActual = Number(removeCurrencySymbol(await ordersPage.getHandlingFee()));
      expect(handlingFeeActual >= -0.01 && handlingFeeActual <= 0.01).toEqual(true);
      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual >= -0.01 && profitActual <= 0.01).toEqual(true);

      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain("PlusBase canceled this order. Reason: Other");
    });

    await test.step(`Click "View invoice" > verify tạo invoice refund vào balance`, async () => {
      await ordersPage.clickButton("View invoice");
      const refundSellerActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("Refund for seller")),
      );
      const refundBuyerActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("refund for buyer")).replace("-", ""),
      );
      const chargeOrderActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("Charged from the order")),
      );
      const profitOrder = chargeOrderActual + refundSellerActual - refundBuyerActual;
      expect(profitOrder >= -0.01 && profitOrder <= 0.01).toEqual(true);
    });
  });

  test(`Verify cancel unit line items @TC_SB_PLB_ROPLB_52`, async ({ page, conf }) => {
    const shopDomain = conf.suiteConf["domain"];
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const ordersPage = new OrdersPage(page, shopDomain);
    const plbDashboardPage = new DashboardPage(page, shopDomain);

    await test.step(`Vào dashboard shop template PlusBase > vào order detail > Approve order`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      await ordersPage.waitForProfitCalculated();
      const totalOrderActual = Number(removeCurrencySymbol(await ordersPage.getTotalOrder()));
      expect(totalOrderActual).toEqual(infoOrder.totalSF);
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const actualResult = await ordersPage.getApproveStatus();
      expect(actualResult).toEqual("Approved");
      const paidByCustomerActual = Number(removeCurrencySymbol(await ordersPage.getPaidByCustomer()));
      expect(paidByCustomerActual).toEqual(totalOrderActual);
    });

    await test.step(`Click button "More actions" > chọn "Cancel order" > chọn "cancel/Refund unit line items" >
      nhập thông tin refund > click "Cancel"`, async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_UNIT);
      await ordersPage.page.waitForLoadState("networkidle");
      await ordersPage.clickButton("Cancel");
      const cancelActual = await ordersPage.getCancelStatus();
      expect(cancelActual).toEqual("Cancelled");
    });

    await test.step(`Vào shop PlusBase > verify order detail sau khi cancel`, async () => {
      adminToken = await dashboardPage.getAccessToken({
        shopId: conf.suiteConf["shop_id"],
        userId: conf.suiteConf["user_id"],
        baseURL: conf.suiteConf["api"],
        username: conf.suiteConf["username"],
        password: conf.suiteConf["password"],
      });
      await plbDashboardPage.loginWithToken(adminToken);
      await plbDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      await ordersPage.clickShowCalculation();
      const baseCostActual = Number(removeCurrencySymbol(await ordersPage.getBaseCost()));
      expect(baseCostActual >= -0.01 && baseCostActual <= 0.01).toEqual(true);
      const handlingFeeActual = Number(removeCurrencySymbol(await ordersPage.getHandlingFee()));
      expect(handlingFeeActual >= -0.01 && handlingFeeActual <= 0.01).toEqual(true);
      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual >= -0.01 && profitActual <= 0.01).toEqual(true);

      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain("PlusBase canceled this order. Reason: Other");
    });

    await test.step(`Click "View invoice" > verify tạo invoice refund vào balance`, async () => {
      await ordersPage.clickButton("View invoice");

      const refundSellerActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("Refund for seller")),
      );
      const refundBuyerActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("refund for buyer")).replace("-", ""),
      );
      const chargeOrderActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("Charged from the order")),
      );
      const profitOrder = chargeOrderActual + refundSellerActual - refundBuyerActual;
      expect(profitOrder >= -0.01 && profitOrder <= 0.01).toEqual(true);
    });
  });
});

test.describe(`Cancel order of PlusBase order profit = 0 @TS_SB_PLB_ROPLB_60`, () => {
  test(`Verify cancel order of PlusBase có variant bị xoá khỏi báo giá @TC_SB_PLB_ROPLB_60`, async ({ page, conf }) => {
    const shopDomain = conf.suiteConf["domain"];
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const ordersPage = new OrdersPage(page, shopDomain);

    await test.step(`Vào dashboard shop template PlusBase > vào order detail > Click Action "Cancel order" >
      Click button "Cancel"`, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);

      await ordersPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await ordersPage.inputQuantityRefund(1, conf.caseConf.products[0].quantity);
      await ordersPage.inputQuantityRefund(2, conf.caseConf.products[1].quantity);
      //Cần wait trên dev do auto fill data chậm, nếu click Cancel luôn thì sẽ không đúng với data input vào
      if (process.env.ENV == "dev") {
        await ordersPage.page.waitForTimeout(5 * 1000);
      }
      await ordersPage.clickButton("Cancel");
      const cancelActual = await ordersPage.getCancelStatus();
      expect(cancelActual).toEqual("Cancelled");
    });

    await test.step("verify order detail sau khi cancel", async () => {
      await ordersPage.page.reload();
      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual >= -0.01 && profitActual <= 0.01).toEqual(true);
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Voided");
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain("PlusBase canceled this order. Reason: Other");
    });
  });
});

test.describe("Auto cancel of PlusBase order profit < 0 @TS_SB_PLB_ROPLB_63", () => {
  test(`Verify auto cancel of PlusBase order profit < 0 @TC_SB_PLB_ROPLB_63`, async ({ page }) => {
    const plbDashboardPage = new DashboardPage(page, shopDomain);
    const ordersPage = new OrdersPage(page, shopDomain);

    await test.step(`Vào dashboard shop PlusBase > vào order detail`, async () => {
      await plbDashboardPage.loginWithToken(adminToken);
      await plbDashboardPage.navigateToMenu("Orders");
      await ordersPage.gotoOrderDetail(infoOrder.orderName);
      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual <= 0).toEqual(true);
    });

    await test.step(`verify trạng thái order`, async () => {
      const cancelActual = await ordersPage.getCancelStatus();
      expect(cancelActual).toEqual("Cancelled");
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Voided");
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain(
        "CC16_Order was automatically canceled due to negative profit, Seller needs to re-setup pricing for this product.",
      );
    });
  });
});
