import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import type { Product, OrderAfterCheckoutInfo } from "@types";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@core/utils/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFCheckout } from "@pages/storefront/checkout";

let checkoutAPI: CheckoutAPI;
let checkoutPage: SFCheckout;
let orderAPI: OrderAPI;
let orderPage: OrdersPage;
let domain: string;
let productsCheckout: Array<Product>;
let orderId: number;
let balanceAPI: BalanceUserAPI;
let orderSummaryInfo: OrderAfterCheckoutInfo;
let homePage: SFHome;
let secretKey: string, gatewayCode: string;
let shippingAddress, paymentMethod, productPPC, retry;
let dataFeeHash, fixedAmount, percentageAmount, intlFee, amountStripe, exchangeRate, amount, profit, profitInvoice;

test.describe("Calculate profit Spay có store currency là HKD và connected account Stripe entity là HKD", () => {
  test.beforeEach(async ({ conf, authRequest, dashboard, page }) => {
    domain = conf.suiteConf.domain;
    retry = conf.suiteConf.retry;
    shippingAddress = conf.suiteConf.shipping_address;
    productsCheckout = conf.suiteConf.products_checkout;
    paymentMethod = conf.caseConf.payment_method;
    productPPC = conf.caseConf.product_ppc_name;
    secretKey = conf.suiteConf.stripe_account.secret_key;
    gatewayCode = "platform";
    homePage = new SFHome(page, domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    orderAPI = new OrderAPI(domain, authRequest);
    balanceAPI = new BalanceUserAPI(domain, authRequest);
  });

  test(`@SB_CHE_SPAY_90 - Verify profit, balance, transaction khi order check out with Global market auto rate có connected account Stripe entity là HKD`, async ({}) => {
    await test.step("Precondition", async () => {
      await balanceAPI.updateEnablePayoutSpay();

      //setting global market EU
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2(shippingAddress.country_name);

      await checkoutAPI.addProductThenSelectShippingMethod(
        productsCheckout,
        checkoutAPI.defaultCustomerInfo.emailBuyer,
        shippingAddress,
      );
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();

      await checkoutPage.completeOrderWithMethod(paymentMethod);

      // Add PPC:
      const isShowPPC = await checkoutPage.isPostPurchaseDisplayed();
      expect(isShowPPC).toBeTruthy();
      await checkoutPage.addProductPostPurchase(productPPC);
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      orderId = orderSummaryInfo.orderId;
    });

    await test.step(`Vào Shop balance > Verify profit order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture("", retry);
      await orderAPI.getTransactionId(orderId);
      const connectedId = await orderAPI.getConnectedAccInOrder(orderId);
      const orderInfo = await orderAPI.getBodyOrdInfoInStripe({
        key: secretKey,
        gatewayCode: gatewayCode,
        connectedAcc: connectedId,
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
        connectedAcc: connectedId,
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
          intlFee * dataRateCurrencyInOrderDetail.rateCurrencyToUsd +
          0.01 * amount,
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
});
