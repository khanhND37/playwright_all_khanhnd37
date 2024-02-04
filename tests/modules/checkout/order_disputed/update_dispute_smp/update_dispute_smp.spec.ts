import { test, expect } from "@core/fixtures";
import { removeCurrencySymbol, removeExtraSpace } from "@core/utils/string";
import { OrderAPI } from "@pages/api/order";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { Card, CheckoutInfo, DataBalance, Product } from "@types";
import { CheckoutAPI } from "@pages/api/checkout";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";

let domain: string;
let orderPage: OrdersPage;
let orderAPI: OrderAPI;
let productCheckout: Array<Product>;
let checkoutInfo: CheckoutInfo;
let checkoutAPI: CheckoutAPI;
let balanceAPI: BalanceUserAPI;
let dataBalanceBeforeCO: DataBalance;
let dataBalance: DataBalance;
let cardInfo: Card;
let orderId: number, orderName: string, profitOrder: number;
let changebackAmount: string, chargebackFee: string;
let secretKey: string, gatewayCode: string;
let paymentIntendID: string;

test.describe("Update charge dispute SMP", () => {
  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    domain = conf.suiteConf.domain;
    productCheckout = conf.suiteConf.product_info;
    cardInfo = conf.suiteConf.card_info;
    checkoutAPI = new CheckoutAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);
    balanceAPI = new BalanceUserAPI(domain, authRequest);
    orderAPI = new OrderAPI(domain, authRequest);

    //lưu info Balance: ATP, AS, ATP trước khi có CO
    dataBalanceBeforeCO = await balanceAPI.getDataBalance();

    //Tạo order chargeback
    checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: productCheckout,
      cardInfo: cardInfo,
    });
    orderId = checkoutInfo.order.id;
    orderName = checkoutInfo.order.name;
    gatewayCode = "platform";
    secretKey = conf.suiteConf.secret_key_smp;

    //Merchant submit form successfully
    await orderPage.goToOrderByOrderId(orderId);
    const totalOrder = await orderPage.getTotalOrder();
    await orderPage.captureOrder(removeCurrencySymbol(totalOrder));
    await orderPage.reloadUntilChargebackMsgShown();
    await orderPage.navigateToSubmitResponseChargeback();
    changebackAmount = await orderPage.getChargeBackAmount();
    chargebackFee = await orderPage.getChargebackFee();
    await orderPage.enterAdditionalEvidence(conf.caseConf.evidence_submited);
    await orderPage.clickOnSubmitBtn();
  });

  test(`@SB_SET_PMS_SPAY3_94 [Updated] Check info order  when merchan LOSES dispute`, async ({}) => {
    await test.step(`Vào order detail, verify notification `, async () => {
      //Verify dispute content message
      //do until new message appear
      do {
        await orderPage.goToOrderByOrderId(orderId);
      } while ((await orderPage.isTextVisible("Submit reimbursement request for a chargeback successfully")) == true);
      const actDisputeContentMsg = await orderPage.isTextVisible(
        `A chargeback totalling ${changebackAmount} was resolved in the customer's favor`,
        1,
      );
      expect(actDisputeContentMsg).toBeTruthy();

      //Verify order status
      const statusOrder = await orderPage.getPaymentStatus();
      expect(statusOrder).toEqual("Refunded");
    });

    await test.step(`Tại order detail > [More actions] > [View invoice dispute]`, async () => {
      await orderPage.page.reload(); //for invoice appear
      await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE);
      profitOrder = +removeCurrencySymbol(await orderPage.getDataByRowLabel("Amount"));
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE_DISPUTE);
      //Verify info invoice
      const [actInvContent, actInvDetail] = await Promise.all([
        orderPage.getDataByRowLabel("Content"),
        orderPage.getDataByRowLabel("Detail"),
      ]);
      //verify content
      expect(actInvContent).toBe("ShopBase Marketplace Payment order on hold");
      //verify details
      expect(removeExtraSpace(actInvDetail)).toBe(`Order ${orderName} on hold due to dispute. Learn more`);
      //Verify khong co transaction IN
      expect(
        await orderPage.isTextVisible(
          `Refund chargeback amount for order ${orderName} to Available payout balance due to dispute resolution.`,
        ),
      ).toBeFalsy();
    });

    await test.step(`Vào SB Balance > Verify ATP, AS, Total`, async () => {
      const cbackAmount = +removeCurrencySymbol(changebackAmount);
      const cbackfee = +removeCurrencySymbol(chargebackFee);
      dataBalance = await balanceAPI.getDataBalance();
      // Vi risk level low nen profit order se chuyen ve ATP
      const expATP = dataBalanceBeforeCO.available_payout + profitOrder - cbackAmount - cbackfee;
      const expTotal =
        dataBalanceBeforeCO.available_amount +
        dataBalanceBeforeCO.available_soon +
        profitOrder -
        cbackAmount -
        cbackfee;
      expect(dataBalance.available_payout.toFixed(2)).toStrictEqual(expATP.toFixed(2));
      expect((dataBalance.available_amount + dataBalance.available_soon).toFixed(2)).toStrictEqual(expTotal.toFixed(2));
    });

    await test.step(`Vào dashboard Stripe > Vào dashboard acc Stripe > Verify transaction of order (Acc và transaction id lấy ở Order Detail Dashboard`, async () => {
      await orderAPI.getTransactionId(orderId);
      paymentIntendID = orderAPI.paymentIntendId;
      const connectedAcc = await orderAPI.getConnectedAccInOrder(orderId);
      const orderInfo = await orderAPI.getOrdInfoInStripe({
        key: secretKey,
        gatewayCode: gatewayCode,
        connectedAcc: connectedAcc,
        paymentIntendId: paymentIntendID,
        isDisputed: true,
      });
      expect(orderInfo.ordDisputeStatus).toBe("lost");
    });
  });

  test(`@SB_SET_PMS_SPAY3_93 [Updated] Check info order  when merchan WINS dispute`, async ({}) => {
    await test.step(`Vào order detail, verify notification `, async () => {
      //Verify dispute content message
      //do until new message appear
      do {
        await orderPage.goToOrderByOrderId(orderId);
      } while ((await orderPage.isTextVisible("Submit reimbursement request for a chargeback successfully")) == true);
      const actDisputeContentMsg = await orderPage.isTextVisible(
        `A chargeback totalling ${changebackAmount} was resolved in your favor`,
        1,
      );
      expect(actDisputeContentMsg).toBeTruthy();
    });

    await test.step(`Tại order detail > [More actions] > [View invoice dispute]`, async () => {
      await orderPage.page.reload(); //for invoice appear
      await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE);
      profitOrder = +removeCurrencySymbol(await orderPage.getDataByRowLabel("Amount"));
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE_DISPUTE);
      //Verify info invoice
      const [actInvContent, actInvDetail] = await Promise.all([
        orderPage.getDataByRowLabel("Content"),
        orderPage.getDataByRowLabel("Detail"),
      ]);
      //verify content
      expect(actInvContent).toBe("ShopBase Marketplace Payment order on hold");
      //verify details
      expect(removeExtraSpace(actInvDetail)).toBe(`Order ${orderName} on hold due to dispute. Learn more`);
      do {
        await orderPage.page.reload(); //for transaction IN appear
      } while ((await orderPage.isTextVisible("IN")) == false);

      //Verify transaction
      const [actTransAmount, actTransContent, actTransType] = await Promise.all([
        orderPage.getDataByColumnLabel("Amount", 1),
        orderPage.getDataByColumnLabel("Content", 1, "1"),
        orderPage.getDataByColumnLabel("Type", 1),
      ]);
      expect(removeCurrencySymbol(actTransAmount)).toBe(removeCurrencySymbol(changebackAmount));
      expect(actTransContent).toBe(
        `Refund chargeback amount for order ${orderName} to Available payout balance due to dispute resolution.`,
      );
      expect(actTransType).toBe("IN");
    });

    await test.step(`Vào SB Balance > Verify ATP, AS, ATP`, async () => {
      const cbackfee = +removeCurrencySymbol(chargebackFee);
      dataBalance = await balanceAPI.getDataBalance();
      // Vi risk level low nen profit order se chuyen ve ATP
      const expATP = dataBalanceBeforeCO.available_payout + profitOrder - cbackfee;
      const expTotal =
        dataBalanceBeforeCO.available_amount + dataBalanceBeforeCO.available_soon + profitOrder - cbackfee;
      //verify ATP, Total
      expect(dataBalance.available_payout.toFixed(2)).toStrictEqual(expATP.toFixed(2));
      expect((dataBalance.available_amount + dataBalance.available_soon).toFixed(2)).toStrictEqual(expTotal.toFixed(2));
    });

    await test.step(`Vào dashboard Stripe > Vào dashboard acc Stripe > Verify transaction of order (Acc và transaction id lấy ở Order Detail Dashboard`, async () => {
      await orderAPI.getTransactionId(orderId);
      paymentIntendID = orderAPI.paymentIntendId;
      const connectedAcc = await orderAPI.getConnectedAccInOrder(orderId);
      const orderInfo = await orderAPI.getOrdInfoInStripe({
        key: secretKey,
        gatewayCode: gatewayCode,
        connectedAcc: connectedAcc,
        paymentIntendId: paymentIntendID,
        isDisputed: true,
      });
      expect(orderInfo.ordDisputeStatus).toBe("won");
    });
  });
});
