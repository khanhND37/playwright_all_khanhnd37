import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import type { Product, CheckoutInfo, Card } from "@types";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@core/utils/checkout";

let checkoutAPI: CheckoutAPI;
let orderAPI: OrderAPI;
let orderPage: OrdersPage;
let domain: string;
let checkoutInfo: CheckoutInfo;
let productsCheckout: Array<Product>;
let orderId: number;
let balanceAPI: BalanceUserAPI;
let secretKey: string, gatewayCode: string;
let cardInfo: Card;
let dataFeeHash, fixedAmount, percentageAmount, intlFee;
let amountStripe, exchangeRate, amount, profit, profitInvoice, retry;

test.describe("Calculate profit Spay có store currency là USD và connected account Stripe entity là HKD", () => {
  test.beforeEach(async ({ conf, authRequest, dashboard }) => {
    domain = conf.suiteConf.domain;
    retry = conf.suiteConf.retry;
    productsCheckout = conf.suiteConf.products_checkout;
    cardInfo = conf.suiteConf.card_info;
    secretKey = conf.suiteConf.stripe_account.secret_key;
    gatewayCode = "platform";
    checkoutAPI = new CheckoutAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);
    orderAPI = new OrderAPI(domain, authRequest);
    balanceAPI = new BalanceUserAPI(domain, authRequest);
  });

  test(`@SB_CHE_SPAY_92 Verify profit, balance, transaction khi order checkout với store currency khác HKD add PPC có connected account Stripe entity là HKD`, async ({}) => {
    await test.step("Precondition", async () => {
      await balanceAPI.updateEnablePayoutSpay();
      //Tạo order
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      orderId = checkoutInfo.order.id;
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
          intlFee * dataRateCurrencyInOrderDetail.rateCurrencyToUsd,
      );

      profit = parseFloat((amount - (fee + 0.01 * amount)).toFixed(2));
      //get profit in Invoice order
      do {
        await orderPage.page.reload();
        await orderPage.genLoc(orderPage.xpathMoreActions).click();
      } while ((await orderPage.isTextVisible("View invoice")) == false);
      await orderPage.genLoc(orderPage.xpathMoreActionWithLabel("View invoice")).click();
      const orderInvoice = await orderAPI.getInvoiceByOrderId(orderId);
      profitInvoice = Number(orderInvoice.amount_cent / 100);
      expect(isEqual(profit, profitInvoice, 0.01)).toEqual(true);
    });
  });
});
