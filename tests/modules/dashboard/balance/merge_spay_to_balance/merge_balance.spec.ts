import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import type { Card, CheckoutInfo, DataBalance, Product } from "@types";
import { removeCurrencySymbol, removeExtraSpace } from "@core/utils/string";
import { buildInfoInvoiceDetail, buildInfoInvoiceDispute, isEqual } from "@core/utils/checkout";
import { BalancePage } from "@pages/dashboard/balance";
import { TransactionPage } from "@pages/dashboard/transaction";

test.describe("Checkout flow with Spay", () => {
  let checkoutAPI: CheckoutAPI;
  let balanceAPI: BalanceUserAPI;
  let balancePage: BalancePage;
  let orderPage: OrdersPage;
  let transactionPage: TransactionPage;
  let domain: string;
  let checkoutInfo: CheckoutInfo;
  let productsCheckout: Array<Product>;
  let cardInfo: Card;
  let isEnableMerge: boolean;
  let dataBalanceBeforeCO: DataBalance, dataBalance: DataBalance;
  let orderId: number, orderName: string;
  let expOrderProfit: number;
  let reloadTime;

  test.beforeEach(async ({ conf, authRequest, dashboard, page }) => {
    domain = conf.suiteConf.domain;
    checkoutAPI = new CheckoutAPI(domain, authRequest);
    balanceAPI = new BalanceUserAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);
    balancePage = new BalancePage(page, domain);
    transactionPage = new TransactionPage(page, domain);

    productsCheckout = conf.suiteConf.products_checkout;
    cardInfo = conf.caseConf.card_info;
    isEnableMerge = conf.caseConf.merge_balance;
    reloadTime = conf.suiteConf.reloadtime;

    // Update merge Spay to balance then get data balance
    await balanceAPI.updateEnablePayoutSpay(isEnableMerge);
    dataBalanceBeforeCO = await balanceAPI.getDataBalance();

    // Create a Spay order
    checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: productsCheckout,
      cardInfo: cardInfo,
    });
    orderId = checkoutInfo.order.id;
    expOrderProfit = await orderPage.calProfitSPayV2Order(checkoutInfo.totals.total_price);
    orderName = checkoutInfo.order.name;
  });

  test(`@SB_BAL_MERGE_SPAY_1 Tắt autobalance`, async () => {
    await test.step(`
  Kiểm tra SB Balance
  `, async () => {
      // SB Balance ko thay đổi
      dataBalance = await balanceAPI.getDataBalance();
      expect(dataBalanceBeforeCO.available_soon).toStrictEqual(dataBalance.available_soon);
    });

    await test.step(`
  Kiểm tra Không có action view invoice trong order details
  `, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture("", reloadTime);
      expect(await orderPage.isHaveActionInOrder(Action.ACTION_VIEW_INVOICE)).toBeFalsy();
    });
  });

  test(`@SB_BAL_MERGE_SPAY_3 autobalance với connected account >0`, async () => {
    await test.step(`
  Check invoice từ order page
  `, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture("", reloadTime);
      do {
        await orderPage.page.reload();
        await orderPage.genLoc(orderPage.xpathMoreActions).click();
      } while ((await orderPage.isTextVisible("View invoice")) == false);
      await orderPage.genLoc(orderPage.xpathMoreActionWithLabel("View invoice")).click();
      // Verify invoice's data
      const [actInvContent, actInvDetail, actInvType, actInvAmount] = await Promise.all([
        orderPage.getDataByRowLabel("Content"),
        orderPage.getDataByRowLabel("Detail"),
        orderPage.getDataByRowLabel("Type"),
        orderPage.getDataByRowLabel("Amount"),
      ]);
      const expInvContent = buildInfoInvoiceDetail(orderName).contentInvoice;
      const expInvDetail = buildInfoInvoiceDetail(orderName).detailInvoice;
      expect(removeCurrencySymbol(actInvAmount)).toBe(expOrderProfit.toFixed(2));
      expect(actInvContent).toBe(expInvContent);
      expect(actInvDetail).toBe(expInvDetail);
      expect(actInvType).toBe("IN");

      // Verify transactions of invoice
      let actTotalAmountTrans = 0;
      const [amountTran, statusTran] = await Promise.all([
        orderPage.getDataByColumnLabel("Amount", 1),
        orderPage.getDataByColumnLabel("Status", 1),
      ]);
      expect(statusTran).toBe("Paid");
      actTotalAmountTrans += parseFloat(removeCurrencySymbol(amountTran));
      expect(isEqual(actTotalAmountTrans, expOrderProfit, 0.01)).toBeTruthy();
    });

    await test.step(`
    Kiểm tra SB Balance
    `, async () => {
      dataBalance = await balanceAPI.getDataBalance();
      const expAvailableSoon = dataBalanceBeforeCO.available_soon + expOrderProfit;
      expect(isEqual(dataBalance.available_soon, expAvailableSoon, 0.01)).toBeTruthy();
    });
  });

  test(`@SB_BAL_MERGE_SPAY_4 Refund Spay converted`, async () => {
    const refundAmount = 10;

    await test.step(`
  Refund 10$ order > Kiểm tra SB Balance
  `, async () => {
      // Refund order
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture("", reloadTime);
      await orderPage.refundOrderAtOrderDetails({ refund_amount: refundAmount.toString() });

      // Verify balance amount
      dataBalance = await balanceAPI.getDataBalance();
      const expAvailableSoon = dataBalanceBeforeCO.available_soon + expOrderProfit - refundAmount;
      expect(isEqual(dataBalance.available_soon, expAvailableSoon, 0.01)).toBeTruthy();
    });

    await test.step(`2. Balance > View transaction fee > Kiểm tra transaction`, async () => {
      await balancePage.goToBalance();
      await balancePage.clickBtnViewTransactions();
      await balancePage.page.reload();
      await transactionPage.clickNewestTransaction();

      // Verify transactions
      const [actTransAmount, actTransStatus, actTransContent] = await Promise.all([
        transactionPage.getDataByColumnLabel("Amount"),
        transactionPage.getDataByColumnLabel("Status"),
        transactionPage.getDataByColumnLabel("Invoice", 2),
      ]);
      expect(removeCurrencySymbol(actTransAmount)).toBe("-" + refundAmount.toFixed(2));
      expect(actTransStatus).toBe("Paid");
      expect(actTransContent).toBe("Refund the order " + orderName);
    });

    await test.step(`3. Balance > View invoices > Kiểm tra invoices`, async () => {
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      // Verify invoice status
      const expStatus = await balancePage.getDataByColumnLabel("Status");
      expect(expStatus).toBe("Partially Refunded");
    });

    await test.step(`4. Kiểm tra invoice details`, async () => {
      do {
        await orderPage.page.reload();
        await orderPage.genLoc(orderPage.xpathMoreActions).click();
      } while ((await orderPage.isTextVisible("View invoice")) == false);
      await orderPage.genLoc(orderPage.xpathMoreActionWithLabel("View invoice")).click();
      const expTransRefund = buildInfoInvoiceDetail(orderName).transRefundOrder;
      expect(await orderPage.isTextVisible(expTransRefund)).toBeTruthy();
    });
  });

  test(`@SB_BAL_MERGE_SPAY_5 Refund Spay converted sau khi tắt autobalance`, async () => {
    const refundAmount = 10;

    await test.step(`
  Tắt auto balance > Refund 10$ order > Kiểm tra SB Balance
  `, async () => {
      // Off Merge Balance
      await balanceAPI.updateEnablePayoutSpay(false);
      // Refund order
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture("", reloadTime);
      await orderPage.refundOrderAtOrderDetails({ refund_amount: refundAmount.toString() });

      // Verify balance
      dataBalance = await balanceAPI.getDataBalance();
      const expAvailableSoon = dataBalanceBeforeCO.available_soon + expOrderProfit - refundAmount;
      expect(isEqual(dataBalance.available_soon, expAvailableSoon, 0.01)).toBeTruthy();

      // Verify transactions
      await balancePage.goToBalance();
      await balancePage.clickBtnViewTransactions();
      await balancePage.page.reload();
      await transactionPage.clickNewestTransaction();

      const [actTransAmount, actTransStatus, actTransContent] = await Promise.all([
        transactionPage.getDataByColumnLabel("Amount"),
        transactionPage.getDataByColumnLabel("Status"),
        transactionPage.getDataByColumnLabel("Invoice", 2),
      ]);
      expect(removeCurrencySymbol(actTransAmount)).toBe("-" + refundAmount.toFixed(2));
      expect(actTransStatus).toBe("Paid");
      expect(actTransContent).toBe("Refund the order " + orderName);

      // Verify invoice status
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      const expStatus = await balancePage.getDataByColumnLabel("Status");
      expect(expStatus).toBe("Partially Refunded");
    });
  });

  test(`@SB_BAL_MERGE_SPAY_6 Dispute Spay converted`, async () => {
    let chargebackFee: string;
    let totalChargebackAmount: number;
    let chargebackAmount: string;
    let expAvailablePayout: number, expAvailableSoon: number, expTotal: number;

    await test.step(`
  Tạo 1 order dispute
  `, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture("", reloadTime);
      await orderPage.reloadUntilChargebackMsgShown();
      expect(
        await orderPage.isTextVisible(
          "The customer opened a chargeback totalling $" + checkoutInfo.totals.total_price.toFixed(2),
        ),
      ).toBeTruthy();
    });

    await test.step(`2. Dashboard > Order > Order details: Click butotn 'Submit response' > Kiểm tra chargeback response`, async () => {
      await orderPage.clickButton("Submit response");
      chargebackAmount = removeCurrencySymbol(await orderPage.getChargeBackAmount());
      expect(chargebackAmount).toBe(checkoutInfo.totals.total_price.toFixed(2));
      chargebackFee = removeCurrencySymbol(await orderPage.getChargebackFee());
    });

    await test.step(`Quay lại order detail > View invoice dispute tại More actions`, async () => {
      //do until profit order + balance
      do {
        dataBalance = await balanceAPI.getDataBalance();
        await orderPage.goToOrderByOrderId(orderId);
      } while (dataBalance.available_amount == dataBalanceBeforeCO.available_amount);
      await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE_DISPUTE);
      const [actInvContent, actInvDetail, actInvType, actInvAmount] = await Promise.all([
        orderPage.getDataByRowLabel("Content"),
        orderPage.getDataByRowLabel("Detail"),
        orderPage.getDataByRowLabel("Type"),
        orderPage.getDataByRowLabel("Amount"),
      ]);

      // Verify invoice's data
      totalChargebackAmount = checkoutInfo.totals.total_price + parseFloat(chargebackFee);
      const expInvContent = buildInfoInvoiceDispute(orderName, "spay").contentInvoice;
      const expInvDetail = buildInfoInvoiceDispute(orderName, "spay").detailInvoice;
      expect(removeCurrencySymbol(actInvAmount)).toBe("-" + totalChargebackAmount.toFixed(2));
      expect(actInvContent).toBe(expInvContent);
      expect(removeExtraSpace(actInvDetail)).toBe(expInvDetail);
      expect(actInvType).toBe("OUT");

      // Verify invoice transactions
      const expDeductChargebackFee = buildInfoInvoiceDispute(orderName, "spay").transDeductChargebackFee;
      const expDeductChargebackAmount = buildInfoInvoiceDispute(orderName, "spay").transDeductChargebackAmount;
      // Dung for de lay duoc data tu 2 transactions
      for (let i = 1; i <= 2; i++) {
        const [actTransAmount, actTransStatus, actTransContent, actTransType] = await Promise.all([
          orderPage.getDataByColumnLabel("Amount", i),
          orderPage.getDataByColumnLabel("Status", i),
          orderPage.getDataByColumnLabel("Content", i, "1"),
          orderPage.getDataByColumnLabel("Type", i),
        ]);
        expect(actTransStatus).toBe("Paid");
        expect(actTransType).toBe(actInvType);
        if (i == 1) {
          expect(removeCurrencySymbol(actTransAmount)).toBe("-" + chargebackFee);
          expect(removeExtraSpace(actTransContent)).toBe(expDeductChargebackFee);
        }
        if (i == 2) {
          expect(removeCurrencySymbol(actTransAmount)).toBe("-" + chargebackAmount);
          expect(removeExtraSpace(actTransContent)).toBe(expDeductChargebackAmount);
        }
      }
    });

    await test.step(`Vào SB Balance > Verify ATP, AS, ATP`, async () => {
      // Verify balance
      // When have a dispute order:
      // => minus dispute amount (total order + fee) from "Current available balance" (Available to payout)
      dataBalance = await balanceAPI.getDataBalance();
      expAvailableSoon = dataBalanceBeforeCO.available_soon + expOrderProfit;
      expAvailablePayout = dataBalanceBeforeCO.available_payout - totalChargebackAmount;
      expTotal =
        dataBalanceBeforeCO.available_amount +
        dataBalanceBeforeCO.available_soon -
        totalChargebackAmount +
        expOrderProfit;
      expect(isEqual(dataBalance.available_soon, expAvailableSoon, 0.01)).toBeTruthy();
      expect(isEqual(dataBalance.available_payout, expAvailablePayout, 0.01)).toBeTruthy();
      expect(isEqual(dataBalance.available_amount + dataBalance.available_soon, expTotal, 0.01)).toBeTruthy();
    });
  });

  test(`@SB_BAL_MERGE_SPAY_7 Dispute win`, async () => {
    await test.step(`Win dispute`, async () => {
      await submitDisputeThenVerify({
        disputeEvidence: "winning_evidence",
        orderPage: orderPage,
        balanceAPI: balanceAPI,
        checkoutInfo: checkoutInfo,
        dataBalanceBeforeCO: dataBalanceBeforeCO,
        expOrderProfit: expOrderProfit,
        dataBalance: dataBalance,
      });
    });
  });

  test(`@SB_BAL_MERGE_SPAY_8 Dispute lost với connected account >0`, async () => {
    await test.step(`
  Lost dispute
  `, async () => {
      await submitDisputeThenVerify({
        disputeEvidence: "losing_evidence",
        orderPage: orderPage,
        balanceAPI: balanceAPI,
        checkoutInfo: checkoutInfo,
        dataBalanceBeforeCO: dataBalanceBeforeCO,
        expOrderProfit: expOrderProfit,
        dataBalance: dataBalance,
      });
    });
  });
});

const submitDisputeThenVerify = async (data: {
  disputeEvidence: "winning_evidence" | "losing_evidence";
  orderPage: OrdersPage;
  balanceAPI: BalanceUserAPI;
  checkoutInfo: CheckoutInfo;
  dataBalanceBeforeCO: DataBalance;
  expOrderProfit: number;
  dataBalance: DataBalance;
}) => {
  // Submit dispute
  await data.orderPage.goToOrderByOrderId(data.checkoutInfo.order.id);
  await data.orderPage.reloadUntilOrdCapture();
  await data.orderPage.navigateToSubmitResponseChargeback();
  const totalChargebackAmount = await data.orderPage.getTotalChargeback();
  await data.orderPage.enterAdditionalEvidence(data.disputeEvidence);
  await data.orderPage.clickOnSubmitBtn();

  // Verify invoice
  do {
    await data.orderPage.goToOrderByOrderId(data.checkoutInfo.order.id);
    await data.orderPage.genLoc(data.orderPage.xpathMoreActions).click();
  } while ((await data.orderPage.isTextVisible("View invoice dispute")) == false);
  await data.orderPage.genLoc(data.orderPage.xpathMoreActionWithLabel("View invoice dispute")).click();
  do {
    await data.orderPage.page.reload(); //Load for invoice dispute appear
  } while ((await data.orderPage.isTextVisible("IN")) == false);

  const expRefundChargebackTotal = buildInfoInvoiceDispute(
    data.checkoutInfo.order.name,
    "spay",
  ).transRefundChargebackTotal;
  const [actTransAmount, actTransStatus, actTransContent, actTransType] = await Promise.all([
    data.orderPage.getDataByColumnLabel("Amount", 1),
    data.orderPage.getDataByColumnLabel("Status", 1),
    data.orderPage.getDataByColumnLabel("Content", 1),
    data.orderPage.getDataByColumnLabel("Type", 1),
  ]);

  expect(actTransStatus).toBe("Paid");
  expect(actTransAmount).toBe(totalChargebackAmount);
  expect(actTransType).toBe("IN");
  expect(actTransContent).toBe(expRefundChargebackTotal);

  // Verify balance
  // When dispute have result, release hold amount to balance => there're nothing changes
  data.dataBalance = await data.balanceAPI.getDataBalance();
  const expAvailableSoon = data.dataBalanceBeforeCO.available_soon + data.expOrderProfit;
  expect(isEqual(data.dataBalance.available_soon, expAvailableSoon, 0.01)).toBeTruthy();
  expect(data.dataBalance.available_payout).toBe(data.dataBalanceBeforeCO.available_payout);
};
