import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { expect, test } from "@core/fixtures";
import { getCurrencySymbolBasedOnCurrencyName } from "@core/utils/string";

test.describe("order dispute", () => {
  test("Dispute global market @TC_SB_OLS_THE_INS_CRC_351", async ({ page, conf, request }) => {
    const { domain } = conf.suiteConf as never;

    const prodName = conf.caseConf.product.name;
    const country = conf.caseConf.global_market.country;
    const storeCurrency = conf.caseConf.global_market.store_currency;
    const secretKey = conf.caseConf.stripe_account.secret_key;
    const connectedId = conf.caseConf.stripe_account.connected_id;

    const cardInfo = conf.caseConf.card_info;
    const shippingInfo = conf.caseConf.customer_info;

    const homepage = new SFHome(page, domain);
    let productPage: SFProduct;
    let checkout: SFCheckout;
    let orderPage: OrdersPage;

    const storeCurrencySymbol = getCurrencySymbolBasedOnCurrencyName(storeCurrency);

    let orderId: number, disputeAmt: number;
    //TODO vi sao access token lai de the nay - can sua lai
    const accessToken = "ab87c251f645e450bf6b8f21c60b5d8eb736dfebc34fb4d8857dc70043b12210";

    await test.step("buyer open homepage > add product to cart > navigate to checkout page", async () => {
      await homepage.gotoHomePage();
      await homepage.selectStorefrontCurrencyV2(country);

      productPage = await homepage.searchThenViewProduct(prodName);
      checkout = await productPage.navigateToCheckoutPage();
    });

    await test.step("input customer information", async () => {
      await checkout.enterShippingAddress(shippingInfo);
      await checkout.clickBtnContinueToShippingMethod();
    });

    await test.step("complete order", async () => {
      await checkout.selectShippingMethod("");
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithCardInfo(cardInfo);
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("get dispute amount from Stripe dashboard", async () => {
      //TODO check wait timeout
      // get charge id by transaction API
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(5000); // because order not capturing instantly
      const transaction = await request.get(
        `https://${domain}/admin/orders/${orderId}/transactions.json?access_token=${accessToken}`,
      );
      const bodyTransction = (await transaction.body()).toString();
      const transactionsList = JSON.parse(bodyTransction).transactions;
      const tran = transactionsList.find(tran => tran.kind === "capture");
      const chargeId = tran.authorization;

      // get dispute id by charge id
      const resCharge = await request.get(`https://api.stripe.com/v1/charges/${chargeId}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Stripe-Account": `${connectedId}`,
        },
      });

      const bodyCharge = (await resCharge.body()).toString();
      const disputeId = JSON.parse(bodyCharge).dispute;

      // get dispute amount by dispute id
      const responseDispute = await request.get(`https://api.stripe.com/v1/disputes/${disputeId}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Stripe-Account": `${connectedId}`,
        },
      });
      const bodyDispute = (await responseDispute.body()).toString();
      disputeAmt = JSON.parse(bodyDispute).balance_transactions[0].amount / 100; // convert from cent to dollar
      disputeAmt = Math.abs(disputeAmt);
    });

    await test.step("open order detail by API > verify total dispted", async () => {
      orderPage = await checkout.openOrderByAPI(orderId, accessToken);
      const disputeAmtRounding = storeCurrencySymbol + disputeAmt.toFixed(2);

      // verify total dispute amount displayed on order detail page
      const actTotalDisputeAmt = await orderPage.getContentOfChargebackMsg();
      const expTotalDisputeAmt = "The customer opened a chargeback totalling " + disputeAmtRounding;
      expect(actTotalDisputeAmt).toEqual(expTotalDisputeAmt);

      // verify total dispute amount + fee on charge back detail page
      await orderPage.navigateToSubmitResponseChargeback();

      const actualChargebackAmt = await orderPage.getChargeBackAmount();
      const actChargebackFee = await orderPage.getChargebackFee();
      const actTotalChargeback = await orderPage.getTotalChargeback();

      expect(actualChargebackAmt).toEqual(disputeAmtRounding);
      expect(actChargebackFee).toEqual(storeCurrencySymbol + `15.00`);
      expect(actTotalChargeback).toEqual(storeCurrencySymbol + (disputeAmt + 15).toFixed(2));

      // submit evidence - verify the msg is displayed
      const msg1 = `A chargeback totalling ${disputeAmtRounding} was resolved in your favor`;
      // eslint-disable-next-line max-len
      const msg2 = `The customer's bank sided with you. The ${disputeAmtRounding} chargeback amount and $15.00 chargeback fee will be returned to you in an upcoming payout.`;

      await orderPage.enterAdditionalEvidence("winning_evidence");
      await orderPage.clickOnSubmitBtn();
      await orderPage.verifyMsgDisplayed(msg1);
      await orderPage.verifyMsgDisplayed(msg2);

      // verify order timeline
      const timelineList = orderPage.getOrderTimelineList();
      const timelineDispute = `The customer opened a chargeback totalling ${disputeAmtRounding} ${storeCurrency}`;
      expect(timelineList).toContain(timelineDispute);
    });
  });
});
