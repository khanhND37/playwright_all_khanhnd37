import { test } from "@core/fixtures";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { Card, DataSetting, OrderAfterCheckoutInfo, Product, RefundInfo, ShippingAddressApi } from "@types";
import { expect } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { buildChargebackMsg, buildOrderTimelineMsg, isEqual } from "@core/utils/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
// import { MailBox } from "@pages/thirdparty/mailbox";
import { removeCurrencySymbol } from "@core/utils/string";

test.describe("Verify SF checkout flow global DB", async () => {
  let domain: string;
  let productCheckout: Product[];
  let homePage: SFHome;
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderPage: OrdersPage;
  let dashboardAPI: DashboardAPI;
  let cardInfo: Card;
  let shippingAddress: ShippingAddressApi,
    msgChargeback,
    settingPrice,
    expectRefundAmt: number,
    retry: number,
    buyerEmail: string,
    totalOrder: string;
  let timelineChargeback: string, isMsgChargebackDisplay: boolean;
  let dataResetSetting: DataSetting, dataSetting: DataSetting;
  // let mailBox: MailBox;
  let refundInfo: RefundInfo;
  let paidByCustomerSwitch: number,
    paidByCustomer: number,
    exchangeRate: number,
    priceAddjustment: number,
    rounding: number,
    priceProduct1: number,
    priceProduct2: number,
    refundAmt: number,
    netPayment: number,
    expNetPayment: number;
  let paidByCustomerSwitchAfterRefund: number,
    settingPriceAfterRefund,
    exchangeRateAfterRefund: number,
    priceAddjustmentAfterRefund: number,
    roundingAfterRefund: number,
    netPaymentSwitchAfterRefund: number,
    expNetPaymentSwitchAfterRefund: number;
  let paidByCustomerSwitchAfterCancel: number,
    settingPriceAfterCancel,
    exchangeRateAfterCancel: number,
    priceAddjustmentAfterCancel: number,
    roundingAfterCancel: number,
    netPaymentSwitchAfterCancel: number;

  test.beforeEach(async ({ conf, dashboard, authRequest, page }) => {
    domain = conf.suiteConf.domain;
    productCheckout = conf.suiteConf.products_checkout;
    shippingAddress = conf.suiteConf.shipping_address;
    retry = conf.suiteConf.retry;
    buyerEmail = conf.suiteConf.email;
    cardInfo = conf.caseConf.card_info;
    dataSetting = conf.caseConf.data_setting;
    dataResetSetting = conf.caseConf.data_setting_reset;
    refundInfo = conf.caseConf.refund_info;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    homePage = new SFHome(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    dashboardAPI = new DashboardAPI(domain, authRequest);

    await test.step(`Pre-conditions`, async () => {
      //setting data global market
      await dashboardAPI.changeDataSetting(dataSetting);

      //setting global market EU
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyNE("EUR", shippingAddress.country_name);
    });
  });

  test(`@SB_SET_GM_CSG_71 Kiểm tra order có dispute Charge back - winning_evidence`, async ({ page }) => {
    await test.step(`- Tạo một order Chargeback #xxxx với currency khác với store currency
checkout với cổng Spay/SMP`, async () => {
      //Tạo order chargeback
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, buyerEmail, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.completeOrderWithMethod(PaymentMethod.SPAY_RESELLER, cardInfo);

      //Thanh toán thành công, hiển thị trang thankyou
      await page.waitForSelector(checkoutPage.xpathThankYou);
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
    });

    await test.step(`Verify Chargebacks notification trong order details`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.reloadUntilOrdCapture("", retry);
      await orderPage.reloadUntilChargebackMsgShown();
      totalOrder = await orderPage.getPaidByCustomer();
      msgChargeback = buildChargebackMsg(totalOrder);
      isMsgChargebackDisplay = await orderPage.isTextVisible(msgChargeback.msgChargebackOpen);
      expect(isMsgChargebackDisplay).toBeTruthy();
    });

    await test.step(`Check order timeline`, async () => {
      await orderPage.reloadUntilElementExisted(orderPage.xpathOrderTimeLineOpenCback, 2);
      timelineChargeback = buildOrderTimelineMsg(
        shippingAddress.first_name,
        shippingAddress.last_name,
        buyerEmail,
        totalOrder,
      ).timeLineChargeback;
      const isTimeLineChargebackDisplay = await orderPage.isTextVisible(timelineChargeback);
      expect(isTimeLineChargebackDisplay).toBeTruthy();
    });

    await test.step(`
    - Click "Switch currency
    - Verify Chargebacks notification trong order details"`, async () => {
      await orderPage.switchCurrency();
      isMsgChargebackDisplay = await orderPage.isTextVisible(msgChargeback.msgChargebackOpen);
      expect(isMsgChargebackDisplay).toBeTruthy();
    });

    await test.step(`
    - Thực hiện thay đổi setting market thành: 1 USD = 0.80 EUR; Adjustment = increase 10%; Rounding = 0.99
    - Verify Chargebacks notification trong order details`, async () => {
      //reset data global market
      await dashboardAPI.changeDataSetting(dataResetSetting);
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      isMsgChargebackDisplay = await orderPage.isTextVisible(msgChargeback.msgChargebackOpen);
      expect(isMsgChargebackDisplay).toBeTruthy();
    });

    await test.step(`Thực hiện "Submit Respone" với "winning_evidence"`, async () => {
      await orderPage.navigateToSubmitResponseChargeback();
      await orderPage.enterAdditionalEvidence("winning_evidence");
      await orderPage.clickOnSubmitBtn();
      //verify chargeback submit successfully
      isMsgChargebackDisplay = await orderPage.isTextVisible(msgChargeback.msgSubmitSuccessfully);
      expect(isMsgChargebackDisplay).toBeTruthy();
    });

    await test.step(`Verify Chargebacks notification trong order details`, async () => {
      await orderPage.reloadUntilElementExisted(orderPage.xpathMsgChargebackWon, 2);
      //verify msg chargeback won
      isMsgChargebackDisplay = await orderPage.isTextVisible(msgChargeback.msgChargebackWon);
      expect(isMsgChargebackDisplay).toBeTruthy();
      isMsgChargebackDisplay = await orderPage.isTextVisible(msgChargeback.msgDetailChargebackWon);
      expect(isMsgChargebackDisplay).toBeTruthy();
    });
  });

  test(`@SB_SET_GM_CSG_74 Kiểm tra order, analytics, và email khi refund order nhiều lần`, async ({ page }) => {
    await test.step(`- Tạo một order #xxxx với currency khác với store currency`, async () => {
      //create order chargeback
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, buyerEmail, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.completeOrderWithMethod(PaymentMethod.SPAY_RESELLER);

      //checkout thành công, hiển thị trang thankyou
      await page.waitForSelector(checkoutPage.xpathThankYou);
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
    });

    // await test.step(`Kiểm tra email confirm được gửi tới buyer`, async () => {
    //   mailBox = new MailBox(page, domain);
    // const emailTitle = mailBox.emailSubject(orderSummaryInfo.orderName).orderConfirm;
    // await mailBox.openMailDetailWithAPI(buyerEmail, emailTitle);
    //   // verify total order
    //   const actualTotalOrder = parseFloat(removeCurrencySymbol(await mailBox.getTotalOrder()));
    //   expect(isEqual(actualTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
    // });

    await test.step(`
    - Dashboard -> Order -> Chọn order #xxxx
    - Lưu lại thông tin order`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.reloadUntilOrdCapture("", retry);

      //get info after switch currency
      paidByCustomer = +removeCurrencySymbol(await orderPage.getPaidByCustomer());
      priceProduct1 = +removeCurrencySymbol(await orderPage.getProdPrice(productCheckout[0].name, 2));
      priceProduct2 = +removeCurrencySymbol(await orderPage.getProdPrice(productCheckout[1].name, 2));

      //get info before switch currency
      await orderPage.switchCurrency();
      paidByCustomerSwitch = +removeCurrencySymbol(await orderPage.getPaidByCustomer());
      settingPrice = await orderPage.getInfoSwitchCurrency();
      exchangeRate = settingPrice.exchangeRate;
      priceAddjustment = settingPrice.priceAdjustment;
      rounding = settingPrice.rounding;
    });

    await test.step(`
    - Click "Refund item"
    - Tăng quantity item B = 1
    - Chọn "Refund shipping" = 1
    - Refund order thành công
    - Kiểm tra order sau khi refund`, async () => {
      await orderPage.refundOrder(refundInfo[0]);
      expectRefundAmt = -(priceProduct1 + +refundInfo[0].shipping_fee);

      //verify refund amount
      refundAmt = +removeCurrencySymbol(await orderPage.getRefundedAmount());
      expect(isEqual(refundAmt, expectRefundAmt, 0.01)).toBe(true);

      //verify net payment amount
      netPayment = +removeCurrencySymbol(await orderPage.getNetPayment());
      expNetPayment = paidByCustomer + refundAmt;
      expect(isEqual(netPayment, expNetPayment, 0.01)).toBe(true);
    });

    await test.step(`Click "Switch currency"`, async () => {
      await orderPage.switchCurrency();
      paidByCustomerSwitchAfterRefund = +removeCurrencySymbol(await orderPage.getPaidByCustomer());
      settingPriceAfterRefund = await orderPage.getInfoSwitchCurrency();
      exchangeRateAfterRefund = settingPriceAfterRefund.exchangeRate;
      priceAddjustmentAfterRefund = settingPriceAfterRefund.priceAdjustment;
      roundingAfterRefund = settingPriceAfterRefund.rounding;
      netPaymentSwitchAfterRefund = +removeCurrencySymbol(await orderPage.getNetPayment());
      expNetPaymentSwitchAfterRefund = +(expNetPayment * exchangeRate).toFixed(2);

      //verify info does not change after the first refund
      //verify paid by customer
      expect(paidByCustomerSwitchAfterRefund).toEqual(paidByCustomerSwitch);
      //verify exchange rate
      expect(exchangeRateAfterRefund).toEqual(exchangeRate);
      //verify price addjustment
      expect(priceAddjustmentAfterRefund).toEqual(priceAddjustment);
      //verify rounding
      expect(roundingAfterRefund).toEqual(rounding);
      //verify net payment
      expect(isEqual(netPaymentSwitchAfterRefund, expNetPaymentSwitchAfterRefund, 0.01)).toBe(true);
    });

    // await test.step(`Kiểm tra email refunded gửi đến buyer`, async () => {
    //   await mailBox.openMailBox(buyerEmail);
    //   await mailBox.openRefundNotification();
    //   const actRefundAmt = +removeCurrencySymbol(await mailBox.getAmountRefundCustomerEmail());
    //   expect(isEqual(actRefundAmt, +(refundAmt * exchangeRate).toFixed(2), 0.01)).toBe(true);
    // });

    await test.step(`
    - Thực hiện thay đổi setting market thành: 
    1 USD = 0.80 EUR; Adjustment = increase 10%; Rounding = 0.99
    - Kiểm tra lại order vừa tạo`, async () => {
      await dashboardAPI.changeDataSetting(dataResetSetting);
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);

      //verify refund amount doesn't change after reset setting market
      refundAmt = +removeCurrencySymbol(await orderPage.getRefundedAmount());
      expect(isEqual(refundAmt, expectRefundAmt, 0.01)).toBe(true);

      //verify net payment amount doesn't change after reset setting market
      netPayment = +removeCurrencySymbol(await orderPage.getNetPayment());
      expNetPayment = paidByCustomer + refundAmt;
      expect(isEqual(netPayment, expNetPayment, 0.01)).toBe(true);
    });

    await test.step(`Click "Switch currency"`, async () => {
      await orderPage.switchCurrency();
      paidByCustomerSwitchAfterRefund = +removeCurrencySymbol(await orderPage.getPaidByCustomer());
      settingPriceAfterRefund = await orderPage.getInfoSwitchCurrency();
      exchangeRateAfterRefund = settingPriceAfterRefund.exchangeRate;
      priceAddjustmentAfterRefund = settingPriceAfterRefund.priceAdjustment;
      roundingAfterRefund = settingPriceAfterRefund.rounding;
      netPaymentSwitchAfterRefund = +removeCurrencySymbol(await orderPage.getNetPayment());
      expNetPaymentSwitchAfterRefund = +(expNetPayment * exchangeRate).toFixed(2);

      //verify info order does not change after reset setting market
      //verify paid by customer
      expect(paidByCustomerSwitchAfterRefund).toEqual(paidByCustomerSwitch);
      //verify exchange rate
      expect(exchangeRateAfterRefund).toEqual(exchangeRate);
      //verify price addjustment
      expect(priceAddjustmentAfterRefund).toEqual(priceAddjustment);
      //verify rounding
      expect(roundingAfterRefund).toEqual(rounding);
      //verify net payment
      expect(isEqual(netPaymentSwitchAfterRefund, expNetPaymentSwitchAfterRefund, 0.01)).toBe(true);
    });

    await test.step(`
    - Click "Refund item"
    - Tăng quantity item A = 1
    - Chọn "Refund shipping" = 1
    - Refund order thành công
    - Kiểm tra order sau khi refund`, async () => {
      await orderPage.refundOrder(refundInfo[1]);
      expectRefundAmt = -+(
        priceProduct1 +
        +refundInfo[0].shipping_fee +
        priceProduct2 +
        +refundInfo[0].shipping_fee
      ).toFixed(2);

      //verify refund amount
      refundAmt = +removeCurrencySymbol(await orderPage.getRefundedAmount());
      expect(isEqual(refundAmt, expectRefundAmt, 0.01)).toBe(true);

      //verify net payment amount
      netPayment = +removeCurrencySymbol(await orderPage.getNetPayment());
      expNetPayment = paidByCustomer + refundAmt;
      expect(isEqual(netPayment, expNetPayment, 0.01)).toBe(true);
    });

    await test.step(`Click "Switch currency"`, async () => {
      await orderPage.switchCurrency();
      paidByCustomerSwitchAfterRefund = +removeCurrencySymbol(await orderPage.getPaidByCustomer());
      settingPriceAfterRefund = await orderPage.getInfoSwitchCurrency();
      exchangeRateAfterRefund = settingPriceAfterRefund.exchangeRate;
      priceAddjustmentAfterRefund = settingPriceAfterRefund.priceAdjustment;
      roundingAfterRefund = settingPriceAfterRefund.rounding;
      netPaymentSwitchAfterRefund = +removeCurrencySymbol(await orderPage.getNetPayment());
      expNetPaymentSwitchAfterRefund = +(expNetPayment * exchangeRate).toFixed(2);

      //verify info does not change after the second refund
      //verify paid by customer
      expect(paidByCustomerSwitchAfterRefund).toEqual(paidByCustomerSwitch);
      //verify exchange rate
      expect(exchangeRateAfterRefund).toEqual(exchangeRate);
      //verify price addjustment
      expect(priceAddjustmentAfterRefund).toEqual(priceAddjustment);
      //verify rounding
      expect(roundingAfterRefund).toEqual(rounding);
      //verify net payment
      expect(isEqual(netPaymentSwitchAfterRefund, expNetPaymentSwitchAfterRefund, 0.01)).toBe(true);
    });

    // await test.step(`Kiểm tra email refunded gửi đến buyer`, async () => {
    //   await mailBox.openMailBox(buyerEmail);
    //   await mailBox.openRefundNotification();
    //   const actRefundAmt = +removeCurrencySymbol(await mailBox.getAmountRefundCustomerEmail());
    //   expect(isEqual(actRefundAmt, +(refundAmt * exchangeRate).toFixed(2), 0.01)).toBe(true);
    // });

    await test.step(`
    - Thực hiện thay đổi setting market thành
    - Kiểm tra lại order vừa tạo`, async () => {
      await dashboardAPI.changeDataSetting(dataResetSetting);
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);

      //verify refund amount doesn't change after reset setting market
      refundAmt = +removeCurrencySymbol(await orderPage.getRefundedAmount());
      expect(isEqual(refundAmt, expectRefundAmt, 0.01)).toBe(true);

      //verify net payment amount doesn't change after reset setting market
      netPayment = +removeCurrencySymbol(await orderPage.getNetPayment());
      expNetPayment = paidByCustomer + refundAmt;
      expect(isEqual(netPayment, expNetPayment, 0.01)).toBe(true);
    });

    await test.step(`Click "Switch currency"`, async () => {
      await orderPage.switchCurrency();
      paidByCustomerSwitchAfterRefund = +removeCurrencySymbol(await orderPage.getPaidByCustomer());
      settingPriceAfterRefund = await orderPage.getInfoSwitchCurrency();
      exchangeRateAfterRefund = settingPriceAfterRefund.exchangeRate;
      priceAddjustmentAfterRefund = settingPriceAfterRefund.priceAdjustment;
      roundingAfterRefund = settingPriceAfterRefund.rounding;
      netPaymentSwitchAfterRefund = +removeCurrencySymbol(await orderPage.getNetPayment());
      expNetPaymentSwitchAfterRefund = +(expNetPayment * exchangeRate).toFixed(2);

      //verify info order does not change after reset setting market
      //verify paid by customer
      expect(paidByCustomerSwitchAfterRefund).toEqual(paidByCustomerSwitch);
      //verify exchange rate
      expect(exchangeRateAfterRefund).toEqual(exchangeRate);
      //verify price addjustment
      expect(priceAddjustmentAfterRefund).toEqual(priceAddjustment);
      //verify rounding
      expect(roundingAfterRefund).toEqual(rounding);
      //verify net payment
      expect(isEqual(netPaymentSwitchAfterRefund, expNetPaymentSwitchAfterRefund, 0.01)).toBe(true);
    });
  });

  test(`@SB_SET_GM_CSG_76 Kiểm tra order khi thực hiện cancel`, async ({ page }) => {
    await test.step(`- Tạo một order #xxxx với currency khác với store currency`, async () => {
      //create order chargeback
      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, buyerEmail, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.completeOrderWithMethod(PaymentMethod.SPAY_RESELLER);

      //checkout thành công, hiển thị trang thankyou
      await page.waitForSelector(checkoutPage.xpathThankYou);
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
    });

    await test.step(`
    - Dashboard -> Order -> Chọn order #xxxx
    - Lưu lại thông tin order`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.reloadUntilOrdCapture("", retry);

      //get info after switch currency
      paidByCustomer = +removeCurrencySymbol(await orderPage.getPaidByCustomer());
      priceProduct1 = +removeCurrencySymbol(await orderPage.getProdPrice(productCheckout[0].name, 2));
      priceProduct2 = +removeCurrencySymbol(await orderPage.getProdPrice(productCheckout[1].name, 2));

      //get info before switch currency
      await orderPage.switchCurrency();
      paidByCustomerSwitch = +removeCurrencySymbol(await orderPage.getPaidByCustomer());
      settingPrice = await orderPage.getInfoSwitchCurrency();
      exchangeRate = settingPrice.exchangeRate;
      priceAddjustment = settingPrice.priceAdjustment;
      rounding = settingPrice.rounding;
    });

    await test.step(`
    - Thực hiện thay đổi setting market thành: 1 USD = 0.80 EUR; Adjustment = increase 10%; Rounding = 0.99
    - Click "cancel item
    - Chọn/ nhập value để cancel all order
    - Kiểm tra order sau khi cancel`, async () => {
      await dashboardAPI.changeDataSetting(dataResetSetting);
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.cancelOrder(paidByCustomer);

      //verify net payment amount
      netPayment = +removeCurrencySymbol(await orderPage.getNetPayment());
      expect(netPayment).toEqual(0);
    });

    await test.step(`Click "Switch currency"`, async () => {
      await orderPage.switchCurrency();
      paidByCustomerSwitchAfterCancel = +removeCurrencySymbol(await orderPage.getPaidByCustomer());
      refundAmt = +removeCurrencySymbol(await orderPage.getRefundedAmount());
      settingPriceAfterCancel = await orderPage.getInfoSwitchCurrency();
      exchangeRateAfterCancel = settingPriceAfterCancel.exchangeRate;
      priceAddjustmentAfterCancel = settingPriceAfterCancel.priceAdjustment;
      roundingAfterCancel = settingPriceAfterCancel.rounding;
      netPaymentSwitchAfterCancel = +removeCurrencySymbol(await orderPage.getNetPayment());

      //verify paid by customer
      expect(paidByCustomerSwitchAfterCancel).toEqual(paidByCustomerSwitch);
      //verify refund amount
      expect(refundAmt).toEqual(-paidByCustomerSwitch);
      //verify exchange rate
      expect(exchangeRateAfterCancel).toEqual(exchangeRate);
      //verify price addjustment
      expect(priceAddjustmentAfterCancel).toEqual(priceAddjustment);
      //verify rounding
      expect(roundingAfterCancel).toEqual(rounding);
      //verify net payment
      expect(netPaymentSwitchAfterCancel).toEqual(0); //co dau "-"" vi co the net payment dc lam tron
    });

    // await test.step(`Kiểm tra email canceled gửi đến buyer`, async () => {
    //   mailBox = new MailBox(page, domain);
    //   await mailBox.openMailBox(buyerEmail);
    //   await mailBox.openOrderCanceledNotification(orderSummaryInfo.orderName);
    //   const actRefundAmt = +removeCurrencySymbol(await mailBox.getRefundAmount());
    //   expect(isEqual(actRefundAmt, refundAmt, 0.01)).toBe(true);
    // });
  });
});
