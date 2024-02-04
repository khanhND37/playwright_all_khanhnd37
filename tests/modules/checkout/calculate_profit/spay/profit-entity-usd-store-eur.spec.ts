import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import type { OrderAfterCheckoutInfo, Product } from "@types";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@core/utils/checkout";
import { SFCheckout } from "@pages/storefront/checkout";

let checkoutAPI: CheckoutAPI;
let orderAPI: OrderAPI;
let orderPage: OrdersPage;
let checkoutPage: SFCheckout;
let orderSummaryInfo: OrderAfterCheckoutInfo;
let domain: string;
let productsCheckout: Array<Product>;
let orderId: number;
let balanceAPI: BalanceUserAPI;
let secretKey: string, gatewayCode: string;
let dataFeeHash, fixedAmount, percentageAmount, intlFee, amountStripe, shippingAddress;
let exchangeRate, amount, profit, profitInvoice, retry, productPPC, paymentMethod;

test.describe("Calculate profit Spay có store currency là EUR và connected account Stripe entity là USD", () => {
  test.beforeEach(async ({ conf, authRequest, dashboard, page }) => {
    domain = conf.suiteConf.domain;
    retry = conf.suiteConf.retry;
    productsCheckout = conf.suiteConf.products_checkout;
    shippingAddress = conf.suiteConf.shipping_address;
    secretKey = conf.suiteConf.stripe_account.secret_key;
    productPPC = conf.caseConf.product_ppc_name;
    paymentMethod = conf.caseConf.payment_method;
    gatewayCode = "platform";
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    orderPage = new OrdersPage(dashboard, domain);
    orderAPI = new OrderAPI(domain, authRequest);
    balanceAPI = new BalanceUserAPI(domain, authRequest);
    checkoutPage = new SFCheckout(page, domain);
  });

  test(`@SB_CHE_SPAY_88 Verify profit, balance, transaction khi order checkout với store currency khác USD add PPC có connected account Stripe entity là USD`, async ({}) => {
    await test.step("Precondition", async () => {
      await balanceAPI.updateEnablePayoutSpay();

      //Tạo order
      await checkoutAPI.addProductThenSelectShippingMethod(
        productsCheckout,
        checkoutAPI.defaultCustomerInfo.emailBuyer,
        shippingAddress,
      );
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();

      await checkoutPage.completeOrderWithMethod(paymentMethod);
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

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
