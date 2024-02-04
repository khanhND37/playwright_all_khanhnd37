import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import type { Product, OrderAfterCheckoutInfo } from "@types";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@core/utils/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { BalancePage } from "@pages/dashboard/balance";
import { removeCurrencySymbol } from "@core/utils/string";

let checkoutAPI: CheckoutAPI;
let checkoutPage: SFCheckout;
let orderAPI: OrderAPI;
let orderPage: OrdersPage;
let domain: string;
let productsCheckout: Array<Product>;
let orderId: number;
let orderSummaryInfo: OrderAfterCheckoutInfo;
let secretKey: string, gatewayCode: string, connectedAcc: string;
let paymentMethod,
  retry,
  paymentMethodInfo,
  productPPC,
  i,
  listPaymentIntendId,
  profitProductCheckout,
  profitProductPPC;
let dataFeeHash, fixedAmount, percentageAmount, intlFee, amountStripe, exchangeRate, amount, profit, profitInvoice;
let balancePage: BalancePage;

test.describe("Calculate profit SMP có store currency là USD và connected account Stripe entity là USD", () => {
  test.beforeEach(async ({ conf, authRequest, dashboard, page }) => {
    domain = conf.suiteConf.domain;
    retry = conf.suiteConf.retry;
    productsCheckout = conf.suiteConf.products_checkout;
    paymentMethod = conf.caseConf.payment_method;
    secretKey = conf.suiteConf.stripe_account.secret_key;
    paymentMethodInfo = conf.caseConf.payment_method_info;
    productPPC = conf.caseConf.product_ppc_name;
    gatewayCode = "platform";
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
  });

  test(`@SB_SET_PMS_SPAY3_72 - Verify profit, balance, transaction khi order check out store currency là USD có connected account Stripe entity là USD`, async ({
    authRequestWithExchangeToken,
  }) => {
    await test.step("Precondition", async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(
        productsCheckout,
        checkoutAPI.defaultCustomerInfo.emailBuyer,
      );
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();

      await checkoutPage.completeOrderWithMethod(paymentMethod);
      await checkoutPage.page.click(checkoutPage.xpathClosePPCPopUp);
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      orderId = orderSummaryInfo.orderId;
    });

    await test.step(`Vào Shop balance > Verify profit order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture("", retry);
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderAPI = new OrderAPI(domain, requestObj);
      await orderAPI.getTransactionId(orderId);
      paymentMethodInfo.checkout_token = paymentMethodInfo.checkout_token = checkoutPage.getCheckoutToken();
      await checkoutAPI.getEUPaymentMethodInfo(paymentMethodInfo);
      connectedAcc = checkoutAPI.connectedAccount;
      const orderInfo = await orderAPI.getBodyOrdInfoInStripe({
        key: secretKey,
        gatewayCode: gatewayCode,
        connectedAcc: connectedAcc,
        paymentIntendId: orderAPI.paymentIntendId,
      });

      //get data on dashboard Stripe
      dataFeeHash = JSON.parse(orderInfo.metadata.fee_hash);
      fixedAmount = dataFeeHash.fixed_amount;
      percentageAmount = dataFeeHash.percentage_amount;
      intlFee = parseFloat(orderInfo.metadata.intl_fee);

      const dataTransactionStripe = await orderAPI.getDataOfTransactionStripe({
        key: secretKey,
        gatewayCode: gatewayCode,
        connectedAcc: connectedAcc,
        paymentIntendId: orderAPI.paymentIntendId,
      });

      amountStripe = Number(dataTransactionStripe.amount / 100);
      exchangeRate = Number(dataTransactionStripe.exchange_rate);
      if (dataTransactionStripe.exchange_rate == null) {
        exchangeRate = 1;
      }
      const dataRateCurrencyInOrderDetail = await orderAPI.getRateCurrencyInOrderDetail(orderId);
      amount = Number((amountStripe / exchangeRate) * dataRateCurrencyInOrderDetail.rateCurrencyToUsd);

      const fee = Number(
        fixedAmount * dataRateCurrencyInOrderDetail.rateCurrencyAccountToPayment +
          (amount * percentageAmount) / 100 +
          intlFee * dataRateCurrencyInOrderDetail.rateCurrencyToUsd,
      );

      profit = parseFloat((amount - fee).toFixed(2));
      //get profit in Invoice order
      await orderPage.page.reload();
      await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE);
      const orderInvoice = await orderAPI.getInvoiceByOrderId(orderId);
      profitInvoice = Number(orderInvoice.amount_cent / 100);
      expect(isEqual(profit, profitInvoice, 0.01)).toEqual(true);
    });
  });

  test(`@SB_SET_PMS_SPAY3_97 - Verify profit, balance, transaction khi order check out store currency là USD có connected account Stripe entity là USD add PPC`, async ({
    authRequestWithExchangeToken,
    page,
  }) => {
    await test.step("Precondition", async () => {
      balancePage = new BalancePage(page, domain);
      await checkoutAPI.addProductThenSelectShippingMethod(
        productsCheckout,
        checkoutAPI.defaultCustomerInfo.emailBuyer,
      );
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.completeOrderWithMethod(paymentMethod);
      // Add PPC:
      const isShowPPC = await checkoutPage.isPostPurchaseDisplayed();
      expect(isShowPPC).toBeTruthy();
      await checkoutPage.addProductPostPurchase(productPPC);
      await checkoutPage.completePaymentForPostPurchaseItem(paymentMethod);
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      orderId = orderSummaryInfo.orderId;
    });

    await test.step(`Vào Shop balance > Verify profit order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture("", retry);
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderAPI = new OrderAPI(domain, requestObj);
      await orderAPI.getListTransactionId(orderId);
      paymentMethodInfo.checkout_token = checkoutPage.getCheckoutToken();
      await checkoutAPI.getEUPaymentMethodInfo(paymentMethodInfo);
      connectedAcc = checkoutAPI.connectedAccount;
      listPaymentIntendId = orderAPI.listPaymentIntendId;

      for (i = 0; i < 2; i++) {
        const orderInfo = await orderAPI.getBodyOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAcc,
          paymentIntendId: listPaymentIntendId[i],
        });

        //get data on dashboard Stripe
        dataFeeHash = JSON.parse(orderInfo.metadata.fee_hash);
        fixedAmount = dataFeeHash.fixed_amount;
        percentageAmount = dataFeeHash.percentage_amount;
        intlFee = parseFloat(orderInfo.metadata.intl_fee);

        const dataTransactionStripe = await orderAPI.getDataOfTransactionStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAcc,
          paymentIntendId: listPaymentIntendId[i],
        });

        amountStripe = Number(dataTransactionStripe.amount / 100);
        exchangeRate = Number(dataTransactionStripe.exchange_rate);
        if (dataTransactionStripe.exchange_rate == null) {
          exchangeRate = 1;
        }
        const dataRateCurrencyInOrderDetail = await orderAPI.getRateCurrencyInOrderDetail(orderId);
        amount = Number((amountStripe / exchangeRate) * dataRateCurrencyInOrderDetail.rateCurrencyToUsd);

        const fee = Number(
          fixedAmount * dataRateCurrencyInOrderDetail.rateCurrencyAccountToPayment +
            (amount * percentageAmount) / 100 +
            intlFee * dataRateCurrencyInOrderDetail.rateCurrencyToUsd,
        );

        if (i == 1) {
          profitProductCheckout = amount - fee;
        } else {
          profitProductPPC = amount - fee;
        }
      }
      profit = parseFloat((profitProductCheckout + profitProductPPC).toFixed(2));
      //get profit in Invoice order
      await orderPage.page.reload();
      await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE);
      const orderInvoice = await orderAPI.getInvoiceByOrderId(orderId);
      profitInvoice = Number(orderInvoice.amount_cent / 100);
      expect(isEqual(profit, profitInvoice, 0.01)).toEqual(true);
    });

    await test.step(`Balance > View invoices > Kiểm tra invoices`, async () => {
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      // Verify invoice amount profit in balance
      const actAmount = removeCurrencySymbol(await balancePage.getDataByColumnLabel("Amount"));
      expect(isEqual(+actAmount, profit, 0.01)).toEqual(true);
    });
  });
});
