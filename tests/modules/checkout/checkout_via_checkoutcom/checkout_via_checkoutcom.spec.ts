import { CheckoutAPI } from "@pages/api/checkout";
import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { OrdersPage } from "@pages/dashboard/orders";
import { buildOrderTimelineMsg } from "@core/utils/checkout";
import { PaymentGateway } from "@constants/order";
import { OrderAfterCheckoutInfo, OrderSummary } from "@types";
import { PaymentProviders } from "@pages/api/payment_providers";

test.describe("Buyer should be able checkout with the payment method checkout.com", () => {
  let domain, customerInfo, accountName, endingCardNo, customerEmail, reloadTime;
  let checkout: SFCheckout;
  let orderPage: OrdersPage;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderSummaryBeforeCompleteOrd: OrderSummary;
  let paymentProviderAPI: PaymentProviders;
  let productPPC, use3ds, layout;

  test.beforeEach(async ({ conf, authRequest, page, theme, dashboard }) => {
    domain = conf.suiteConf.domain;
    customerInfo = conf.suiteConf.shipping_address;
    accountName = conf.suiteConf.account_name;
    endingCardNo = conf.suiteConf.card_info.ending_card_no;
    customerEmail = conf.suiteConf.email;
    reloadTime = conf.suiteConf.reload_time;
    productPPC = conf.suiteConf.product_ppc;
    use3ds = !!conf.caseConf.use_3ds;
    layout = conf.caseConf.layout ?? "one-page";
    checkout = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    paymentProviderAPI = new PaymentProviders(conf.suiteConf.domain, authRequest);

    // get all payments
    const payments = await paymentProviderAPI.getAllPaymentGateways();
    const checkoutComPaymentData = payments.find(({ code }) => code == "checkout-com");
    if (checkoutComPaymentData && checkoutComPaymentData.provider_options.threeDs_enabled != use3ds) {
      // update option 3ds to ON/OFF
      checkoutComPaymentData.provider_options.threeDs_enabled = use3ds;
      await paymentProviderAPI.updatePaymentGateway(checkoutComPaymentData);
    }

    const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
    const settingTheme = new SettingThemeAPI(theme);
    await settingTheme.editCheckoutLayout(layout);
    await checkoutAPI.addProductToCartThenCheckout(conf.caseConf.product || conf.suiteConf.product);
    await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
    await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
    await checkoutAPI.openCheckoutPageByToken();
  });

  test.afterEach(async ({}) => {
    await test.step("Merchant view order detail", async () => {
      const totalSF = await checkout.getTotalOnOrderSummary();
      const orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);
      let orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order captures slower than usual
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
      expect(orderStatus).toEqual("Paid");

      //- Order ở trạng thái Paid, thông tin order chính xác
      //- Paid by customer hiển thị total order
      //- Hiển thị đúng timeline
      expect(orderStatus).toEqual("Paid");

      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalSF);

      const actualPaidByCustomer = await orderPage.getPaidByCustomer();
      expect(actualPaidByCustomer).toEqual(totalSF);

      // temporarily skip check timeline on dev env
      // need to check again when dev env is stable
      if (process.env.ENV == "dev") {
        return;
      }

      const orderTimelineSendingEmail = buildOrderTimelineMsg(
        customerInfo.first_name,
        customerInfo.last_name,
        customerEmail,
      ).timelineSendEmail;
      const orderTimelineCustomerPlaceOrder = buildOrderTimelineMsg(
        customerInfo.first_name,
        customerInfo.last_name,
        customerEmail,
      ).timelinePlaceOrd;
      const orderTimelinePaymentProcessed = orderPage.buildOrderTimelineMsgByGW(
        totalSF,
        PaymentGateway.checkout_dot_com,
        null,
        accountName,
        endingCardNo,
      );
      const orderTimelineTransID = orderPage.getTimelineTransIDByGW(PaymentGateway.checkout_dot_com);

      await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
    });
  });

  test("@TC_SB_CHE_STR_81 - Buyer checkout 1 page với payment method checkoutcom", async ({}) => {
    await test.step("Buyer checkout sản phẩm và complete order", async () => {
      await checkout.completeOrderWithMethod("CheckoutCom");
      await expect(
        checkout.page.locator(`//h3[contains(text(),'Payment')]/following-sibling::ul/descendant::span`),
      ).toContainText("Credit Card");
      expect(await checkout.isThankyouPage()).toBeTruthy();
    });
  });

  test(`@SB_CHE_CC_10 - Check checkout via checkout.com with PPC without 3Ds`, async ({}) => {
    await test.step("Buyer checkout sản phẩm và complete order", async () => {
      await checkout.completeOrderWithMethod("CheckoutCom");
      orderSummaryBeforeCompleteOrd = await checkout.getOrderSummaryInfo();
      await expect(
        checkout.page.locator(`//h3[contains(text(),'Payment')]/following-sibling::ul/descendant::span`),
      ).toContainText("Credit Card");
    });

    await test.step(`Thêm sản phẩm post-purchase`, async () => {
      //verify show popup PPC
      expect(await checkout.isPostPurchaseDisplayed()).toBeTruthy();
      const ppcValue = await checkout.addProductPostPurchase(productPPC);

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      expect(await checkout.isThankyouPage()).toBeTruthy();

      orderSummaryInfo = await checkout.getOrderInfoAfterCheckout();
      expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal + parseFloat(ppcValue));
    });
  });

  test(`@SB_CHE_CC_9 - Check checkout with a valid card in 3-step with 3D`, async ({}) => {
    await test.step(`Nhấn complete order -> Nhập 3Ds`, async () => {
      await checkout.completeOrderCheckoutCom(checkout.defaultCardInfo, true);
      expect(await checkout.isThankyouPage()).toBeTruthy();
    });
  });
});
