import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import type { Product, OrderAfterCheckoutInfo } from "@types";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@core/utils/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFCheckout } from "@pages/storefront/checkout";
import { loadData } from "@core/conf/conf";

let checkoutAPI: CheckoutAPI;
let checkoutPage: SFCheckout;
let orderAPI: OrderAPI;
let orderPage: OrdersPage;
let domain: string;
let productsCheckout: Array<Product>;
let orderId: number;
let orderSummaryInfo: OrderAfterCheckoutInfo;
let homePage: SFHome;
let secretKey: string, gatewayCode: string;
let retry, fee, dataFeeHash, fixedAmount, percentageAmount, intlFee;
let amountStripe, exchangeRate, amount, profit, profitInvoice;

test.describe("Calculate profit SMP có store currency là USD và connected account Stripe entity là GBP", () => {
  const casesID = "SB_CALCULATE_PROFIT_SMP";
  const conf = loadData(__dirname, casesID);

  test.beforeEach(async ({ conf, authRequest, dashboard, page }) => {
    domain = conf.suiteConf.domain;
    retry = conf.suiteConf.retry;
    productsCheckout = conf.suiteConf.products_checkout;
    secretKey = conf.suiteConf.stripe_account.secret_key;
    gatewayCode = "platform";
    homePage = new SFHome(page, domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
  });

  conf.caseConf.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      product_ppc_name: productPPC,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ authRequestWithExchangeToken }) => {
        await test.step("Precondition", async () => {
          //setting global market EU
          await homePage.gotoHomePage();
          if (caseId == "SB_SET_PMS_SPAY3_77") {
            await homePage.selectStorefrontCurrencyV2(shippingAddress.country_name);
          }

          await checkoutAPI.addProductThenSelectShippingMethod(
            productsCheckout,
            checkoutAPI.defaultCustomerInfo.emailBuyer,
            shippingAddress,
          );
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();

          await checkoutPage.completeOrderWithMethod(paymentMethod);

          // Add PPC:
          let ppcValue = await checkoutPage.addProductPostPurchase(productPPC);
          if (!ppcValue) {
            // for case don't add PPC
            ppcValue = "0";
          } else {
            await checkoutPage.completePaymentForPostPurchaseItem(paymentMethod);
          }

          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          orderId = orderSummaryInfo.orderId;
        });

        await test.step(`Vào Shop balance > Verify profit order`, async () => {
          await orderPage.goToOrderByOrderId(orderId);
          await orderPage.reloadUntilOrdCapture("", retry);
          const requestObj = await authRequestWithExchangeToken.changeToken();
          orderAPI = new OrderAPI(domain, requestObj);
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

          fee = Number(
            fixedAmount * dataRateCurrencyInOrderDetail.rateCurrencyAccountToPayment +
              (amount * percentageAmount) / 100 +
              intlFee * dataRateCurrencyInOrderDetail.rateCurrencyToUsd,
          );

          profit = parseFloat((amount - fee).toFixed(2));

          //get profit in Invoice order
          await orderPage.page.reload();
          await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE);
          const orderInvoice = await orderAPI.getInvoiceByOrderId(orderId);
          profitInvoice = Number(orderInvoice.amount_cent / 100).toFixed(2);
          expect(isEqual(profit, profitInvoice, 0.01)).toEqual(true);
        });
      });
    },
  );
});
