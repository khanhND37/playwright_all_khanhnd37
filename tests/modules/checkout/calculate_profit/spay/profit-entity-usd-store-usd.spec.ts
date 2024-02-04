import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import type { Product, OrderAfterCheckoutInfo, Card, CheckoutInfo } from "@types";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@core/utils/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFCheckout } from "@pages/storefront/checkout";
import { loadData } from "@core/conf/conf";
import { removeCurrencySymbol } from "@core/utils/string";

let checkoutAPI: CheckoutAPI;
let checkoutPage: SFCheckout;
let orderAPI: OrderAPI;
let orderPage: OrdersPage;
let domain: string;
let productsCheckout: Array<Product>;
let orderId: number;
let balanceAPI: BalanceUserAPI;
let checkoutInfo: CheckoutInfo;
let orderSummaryInfo: OrderAfterCheckoutInfo;
let homePage: SFHome;
let cardInfo: Card;
let secretKey: string, gatewayCode: string;
let changebackAmount: string, chargebackFee: string;
let shippingAddress, retry, fee, dataFeeHash, fixedAmount, percentageAmount, intlFee;
let amountStripe, exchangeRate, amount, profit, profitInvoice;

test.describe("Calculate profit Spay có store currency là USD và connected account Stripe entity là USD", () => {
  const casesID = "SB_ENTITY_USD_STORE_USD";
  const conf = loadData(__dirname, casesID);

  test.beforeEach(async ({ conf, authRequest, dashboard, page }) => {
    domain = conf.suiteConf.domain;
    retry = conf.suiteConf.retry;
    productsCheckout = conf.suiteConf.products_checkout;
    shippingAddress = conf.suiteConf.shipping_address;
    secretKey = conf.suiteConf.stripe_account.secret_key;
    gatewayCode = "platform";
    cardInfo = conf.suiteConf.card_info;
    homePage = new SFHome(page, domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    orderAPI = new OrderAPI(domain, authRequest);
    balanceAPI = new BalanceUserAPI(domain, authRequest);
  });

  conf.caseConf.forEach(({ case_id: caseId, case_name: caseName, payment_method: paymentMethod }) => {
    test(`@${caseId} ${caseName}`, async ({}) => {
      await test.step("Precondition", async () => {
        await balanceAPI.updateEnablePayoutSpay();

        //setting global market EU
        await homePage.gotoHomePage();
        if (caseId == "SB_CHE_SPAY_86") {
          await homePage.selectStorefrontCurrencyV2(shippingAddress.country_name);
        }

        await checkoutAPI.addProductThenSelectShippingMethod(
          productsCheckout,
          checkoutAPI.defaultCustomerInfo.emailBuyer,
          shippingAddress,
        );
        checkoutPage = await checkoutAPI.openCheckoutPageByToken();

        await checkoutPage.completeOrderWithMethod(paymentMethod);
        await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

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

        fee = Number(
          fixedAmount * dataRateCurrencyInOrderDetail.rateCurrencyAccountToPayment +
            (amount * percentageAmount) / 100 +
            intlFee * dataRateCurrencyInOrderDetail.rateCurrencyToUsd,
        );
        //currency checkout khac currency connected acc
        if (caseId == "SB_CHE_SPAY_86") {
          fee = Number(
            fixedAmount * dataRateCurrencyInOrderDetail.rateCurrencyAccountToPayment +
              (amount * percentageAmount) / 100 +
              intlFee * dataRateCurrencyInOrderDetail.rateCurrencyToUsd +
              0.01 * amount,
          );
        }

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

  test(`@SB_BAL_MERGE_SPAY_59 Verify dispute amount in Order detail khi được convert từ Dashboard Stripe về`, async ({}) => {
    await test.step(`Check out với Card number: 4000000000002685`, async () => {
      //Tạo order
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        cardInfo: cardInfo,
      });
      orderId = checkoutInfo.order.id;
    });

    await test.step(`Verify dispute amount in order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const totalOrder = await orderPage.getTotalOrder();
      await orderPage.reloadUntilOrdCapture("", retry);
      await orderPage.reloadUntilChargebackMsgShown();
      await orderPage.navigateToSubmitResponseChargeback();
      changebackAmount = await orderPage.getChargeBackAmount();
      chargebackFee = await orderPage.getChargebackFee();
      //verify dispute amount = total order
      expect((+changebackAmount).toFixed(2)).toStrictEqual((+totalOrder).toFixed(2));
    });

    await test.step(`Vào dashboard Stripe > Vào dashboard acc Stripe > Kéo xuống dưới lấy 3 data: amount, fee, net từ activity log "[] has disputed a payment for ${amount}". Tại order detail, click btn [Submit response] verify charge back response`, async () => {
      await orderAPI.getTransactionId(orderId);
      const paymentIntendID = orderAPI.paymentIntendId;
      const connectedAcc = await orderAPI.getConnectedAccInOrder(orderId);
      const orderInfo = await orderAPI.getOrdInfoInStripe({
        key: secretKey,
        gatewayCode: gatewayCode,
        connectedAcc: connectedAcc,
        paymentIntendId: paymentIntendID,
        isDisputed: true,
      });
      const disputeAmount = orderInfo.amountDispute;
      const disputeFee = orderInfo.feeDispute;
      const disputeNet = orderInfo.netDispute;
      exchangeRate = orderInfo.exchangeRate;
      if (exchangeRate == null) {
        exchangeRate = 1;
      }
      expect(-disputeAmount / (exchangeRate * 100)).toEqual(+removeCurrencySymbol(changebackAmount));
      expect(disputeFee / (exchangeRate * 100)).toEqual(+removeCurrencySymbol(chargebackFee));
      expect(-disputeNet / (exchangeRate * 100)).toEqual(
        +(+removeCurrencySymbol(changebackAmount) + +removeCurrencySymbol(chargebackFee)).toFixed(2),
      );
    });
  });
});
