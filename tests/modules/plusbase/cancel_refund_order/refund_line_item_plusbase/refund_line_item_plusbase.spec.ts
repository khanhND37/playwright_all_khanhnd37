import { expect, request, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFCheckout } from "@sf_pages/checkout";
import type { OrderAfterCheckoutInfo } from "@types";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@utils/string";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { DashboardAPI } from "@pages/api/dashboard";
import { MailBox } from "@pages/thirdparty/mailbox";

let mailbox: MailBox;
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

test.describe(`Refund partially of PlusBase order @TS_SB_PLB_ROPLB_58+59`, () => {
  test(`Verify refund partially combo line items @TC_SB_PLB_ROPLB_58`, async ({ page, conf, authRequest }) => {
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

      // Wait for log activity
      await tplOrderApi.waitForLogActivity(infoOrder.orderId, "approve-order", plbToken);
      await page.reload();

      // verify activity log
      await ordersPage.page.click(ordersPage.xpathTabActivity);
      await expect(
        ordersPage.page.locator(
          ordersPage.xpathActivityLog(0, conf.suiteConf.plb_template.username).activityApprovedOrder,
        ),
      ).toBeVisible();
      await expect(
        ordersPage.page.locator(ordersPage.xpathActivityLog(infoOrder.totalSF).activityCapPayment),
      ).toBeVisible();
      const paidByCustomerActual = Number(removeCurrencySymbol(await ordersPage.getPaidByCustomer()));
      expect(paidByCustomerActual).toEqual(totalOrderActual);
    });

    await test.step(`Click button "Refund order" > chọn "Cancel/refund combo line items" >
      nhập thông tin refund partially > click "Refund"`, async () => {
      await ordersPage.clickButton("Refund order");
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_COMBO);

      // thực hiện nhập quantity & amount refund -> tính profit sau refund
      const { profitAfterRefund } = await ordersPage.inputRefundItems(refunds, plbOrderApi, infoOrder);
      profitExpect = profitAfterRefund;
      await ordersPage.clickButton("Refund");
      await page.waitForLoadState("load");

      // Verify activity log
      await tplOrderApi.waitForLogActivity(infoOrder.orderId, "refund-order", plbToken);
      await page.reload();
      await ordersPage.page.click(ordersPage.xpathTabActivity);
      await expect(
        ordersPage.page.locator(
          ordersPage.xpathActivityLog(0, conf.suiteConf.plb_template.username, refunds[0].lines[0].quantity)
            .activityRefundOrder,
        ),
      ).toBeVisible();
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");
    });

    await test.step(`Vào shop PlusBase > Verify order detail sau khi refund`, async () => {
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
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain("PlusBase refunded this order. Reason: Other");
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

  test(`Verify refund partially unit line items @TC_SB_PLB_ROPLB_59`, async ({ page, conf, authRequest }) => {
    const shopDomain = conf.suiteConf["domain"];
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const ordersPage = new OrdersPage(page, shopDomain);
    const plbOrderApi = new PlusbaseOrderAPI(shopDomain, authRequest);
    const plbDashboardPage = new DashboardPage(page, shopDomain);
    let profitExpect;
    let profitActual;

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

    await test.step(`Click button "Refund order" > chọn "cancel/Refund unit line items" >
      nhập thông tin refund partially > click "Refund"`, async () => {
      await ordersPage.clickButton("Refund order");
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_UNIT);

      // thực hiện nhập quantity & amount refund -> tính profit sau refund
      const { profitAfterRefund } = await ordersPage.inputRefundItems(refunds, plbOrderApi, infoOrder);
      profitExpect = profitAfterRefund;
      await ordersPage.clickButton("Refund");
      await page.waitForLoadState("load");
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");
    });

    await test.step(`Vào shop PlusBase > Verify order detail sau khi refund`, async () => {
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
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain("PlusBase refunded this order. Reason: Other");
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

test.describe(`Checkbox "Do not withdraw from Seller's balance" & "Send notification to the buyer"
  @TS_SB_PLB_ROPLB43+44`, () => {
  test(`Verify checkbox "Do not withdraw from Seller's balance" @TC_SB_PLB_ROPLB_43`, async ({
    page,
    conf,
    authRequest,
  }) => {
    const shopDomain = conf.suiteConf["domain"];
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const ordersPage = new OrdersPage(page, shopDomain);
    const plbOrderApi = new PlusbaseOrderAPI(shopDomain, authRequest);
    const plbDashboardPage = new DashboardPage(page, shopDomain);
    let profitExpect;
    let profitActual;

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

    await test.step(`Click button "Refund order" > chọn "cancel/Refund combo line items" >
    nhập thông tin refund partially > click "Refund"`, async () => {
      // nhập quantity & amount refund, chọn checkbox "Do not withdraw from Seller's balance" -> tính profit sau refund
      await ordersPage.clickButton("Refund order");
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_COMBO);

      const { profitAfterRefund } = await ordersPage.inputRefundItems(refunds, plbOrderApi, infoOrder);
      profitExpect = profitAfterRefund + refunds[0].input.refund_buyer_selling + refunds[0].input.refund_buyer_tip;
      await ordersPage.clickElement("Do not withdraw from Seller's balance");
      await ordersPage.clickButton("Refund");
      await page.waitForLoadState("load");
      const paymentStatus = await ordersPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");
    });

    await test.step(`Vào shop PlusBase > Verify order detail sau khi refund`, async () => {
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
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain("PlusBase refunded this order. Reason: Other");
    });

    await test.step(`Click "View invoice" > Verify tạo invoice refund vào balance`, async () => {
      await ordersPage.clickButton("View invoice");
      const refundSellerActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("Refund for seller")),
      );
      const chargeOrderActual = Number(
        removeCurrencySymbol(await ordersPage.getAmountInvoiceDetail("Charged from the order")),
      );
      const profitOrder = chargeOrderActual + refundSellerActual;
      expect(profitActual - profitOrder >= -0.01 && profitActual - profitOrder <= 0.01).toEqual(true);
    });
  });

  test(`Verify checkbox "Send notification to the buyer" @TC_SB_PLB_ROPLB_44`, async ({ page, conf }) => {
    const shopDomain = conf.suiteConf["domain"];
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const ordersPage = new OrdersPage(page, shopDomain);
    const checkout = new SFCheckout(page, conf.suiteConf.shop_name);

    let profitActual;
    let amountRefundedCustomerExpect;

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

    await test.step(`Click button More action > Chọn cancel order > chọn "Cancel/refund unit line items" > nhập thông tin refund, tick vào checkbox Send notification to the buyer > click "Cancel" >
      nhập thông tin refund partially > click "Refund"`, async () => {
      await ordersPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await ordersPage.selectOptionRefund(Action.ACTION_CANCEL_UNIT);
      await ordersPage.page.waitForLoadState("networkidle");
      await ordersPage.clickElement("Send notification to the buyer");
      //Cần wait trên dev do auto fill data chậm, nếu click Cancel luôn thì sẽ không đúng với data input vào
      if (process.env.ENV == "dev") {
        await ordersPage.page.waitForTimeout(5 * 1000);
      }
      await ordersPage.clickButton("Cancel");
      const cancelActual = await ordersPage.getCancelStatus();
      expect(cancelActual).toEqual("Cancelled");
    });

    await test.step(`Verify order detail sau khi cancel`, async () => {
      await ordersPage.page.reload();
      profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual >= -0.01 && profitActual <= 0.01).toEqual(true);
      const reasonActual = await ordersPage.getReason();
      expect(reasonActual).toContain("PlusBase canceled this order. Reason: Other");
      amountRefundedCustomerExpect = Number(removeCurrencySymbol(await ordersPage.getAmountRefundedToCustomer()));
    });

    await test.step(`Đăng nhập vào email customer > mở email "Cancel order" >
      Verify amount Refunded to customer`, async () => {
      mailbox = await checkout.openMailBox(conf.suiteConf.customer_info.email);
      await mailbox.openOrderCanceledNotification(infoOrder.orderName);
      const amountRefundedCustomerActual = Number(removeCurrencySymbol(await mailbox.getRefundAmount()));
      expect(amountRefundedCustomerExpect).toEqual(amountRefundedCustomerActual);
    });
  });
});
