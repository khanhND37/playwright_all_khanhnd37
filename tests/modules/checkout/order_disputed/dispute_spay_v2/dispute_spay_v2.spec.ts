import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import type { CheckoutInfo, DataBalance, Product } from "@types";
import { loadData } from "@core/conf/conf";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { removeCurrencySymbol, removeExtraSpace } from "@core/utils/string";
import { OrderAPI } from "@pages/api/order";
import { buildInfoInvoiceDispute } from "@core/utils/checkout";
// import { PaymentProviderPage } from "@pages/dashboard/payment_providers";

// let paymentProviderPage: PaymentProviderPage;
// let disputeRateBefore: number;
let checkoutAPI: CheckoutAPI;
let orderAPI: OrderAPI;
let orderPage: OrdersPage;
let domain: string;
let checkoutInfo: CheckoutInfo;
let productsCheckout: Array<Product>;
let orderId: number;
let balanceAPI: BalanceUserAPI;
let dataBalanceBeforeCO: DataBalance;
let dataBalance: DataBalance;
let changebackAmount: string, chargebackFee: string;
let orderName: string;
let paymentIntendID: string;
let isEnableMerge: boolean;

test.describe("Create dispute", () => {
  const casesID = "CREATE_DISPUTE";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({ case_id: caseID, case_name: caseName, card_info: cardInfo, pre_fix_content_on_order: preFixContentOnOrder }) => {
      test(`@${caseID} ${caseName}`, async ({ conf, authRequest, dashboard }) => {
        domain = conf.suiteConf.domain;
        checkoutAPI = new CheckoutAPI(domain, authRequest);
        // paymentProviderPage = new PaymentProviderPage(dashboard, domain);
        orderPage = new OrdersPage(dashboard, domain);
        balanceAPI = new BalanceUserAPI(domain, authRequest);
        productsCheckout = conf.suiteConf.products_checkout;
        isEnableMerge = conf.suiteConf.merge_balance;
        const reloadTime = conf.suiteConf.reloadtime;
        await balanceAPI.updateEnablePayoutSpay(isEnableMerge);

        //lưu info Balance: ATP, AS, ATP trước khi có CO
        dataBalanceBeforeCO = await balanceAPI.getDataBalance();

        // Vi acc dung chung cho nhieu shop nen dispute rate de thay doi
        // await paymentProviderPage.goToPagePaymentProvider();
        // await paymentProviderPage.clickShopBasePayment();
        // disputeRateBefore = await paymentProviderPage.getDisputeRate();

        // Create a Spay order
        checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: productsCheckout,
          cardInfo: cardInfo,
        });
        orderId = checkoutInfo.order.id;
        orderName = checkoutInfo.order.name;
        const expContentOfChargebackMsg = preFixContentOnOrder + checkoutInfo.totals.total_price.toFixed(2);

        await test.step(`Vào dashboard mục Orders > Click vào order vừa tạo xem order detail`, async () => {
          await orderPage.goToOrderByOrderId(orderId);
          await orderPage.reloadUntilOrdCapture("", reloadTime);
          await orderPage.reloadUntilChargebackMsgShown();

          // Verify content msg
          const actContent = await orderPage.getContentOfChargebackMsg();
          expect(actContent).toBe(expContentOfChargebackMsg);

          if (caseID != "SB_ORD_DISP_SPAY_3") {
            // Verify order time line
            await orderPage.page.reload(); //Vi doi khi timeline chua hien ra
            await expect(await orderPage.orderTimeLines(expContentOfChargebackMsg)).toBeVisible();
            await orderPage.navigateToSubmitResponseChargeback();
            changebackAmount = removeCurrencySymbol(await orderPage.getChargeBackAmount());
            chargebackFee = removeCurrencySymbol(await orderPage.getChargebackFee());
          }
        });

        // Vi acc dung chung cho nhieu shop nen dispute rate de thay doi
        //   await test.step(`Vào mục Settings > "Payment providers"
        // Click vào mục "Shopbase payments" để view chi tiết`, async () => {
        //     await paymentProviderPage.page.reload();
        //     await paymentProviderPage.clickToShowShopBasePaymentDetail();
        //     const disputeRate = await paymentProviderPage.getDisputeRate();
        //     expect(disputeRate).toBeGreaterThan(disputeRateBefore);
        //   });

        await test.step(`Vào SB Balance > Verify ATP, AS, ATP`, async () => {
          if (caseID != "SB_ORD_DISP_SPAY_3") {
            dataBalance = await balanceAPI.getDataBalance();
            const expATP = dataBalanceBeforeCO.available_payout - +chargebackFee - +changebackAmount;
            const expAS = dataBalanceBeforeCO.available_soon;
            const expTotal =
              dataBalanceBeforeCO.available_amount +
              dataBalanceBeforeCO.available_soon -
              +chargebackFee -
              +changebackAmount;
            expect(dataBalance.available_payout.toFixed(2)).toStrictEqual(expATP.toFixed(2));
            expect(dataBalance.available_soon.toFixed(2)).toStrictEqual(expAS.toFixed(2));
            expect((dataBalance.available_amount + dataBalance.available_soon).toFixed(2)).toStrictEqual(
              expTotal.toFixed(2),
            );
          }
        });

        await test.step(`Tại  order  detail  >  [More  actions]  >  [View  invoice  dispute]`, async () => {
          await orderPage.goToOrderByOrderId(orderId);
          await orderPage.page.reload(); // for invoice dispute appear
          await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE_DISPUTE);
          //Verify info invoice
          const [actInvContent, actInvDetail] = await Promise.all([
            orderPage.getDataByRowLabel("Content"),
            orderPage.getDataByRowLabel("Detail"),
          ]);
          const expInvContent = buildInfoInvoiceDispute(orderName, "spay").contentInvoice;
          const expInvDetail = buildInfoInvoiceDispute(orderName, "spay").detailInvoice;
          expect(actInvContent).toBe(expInvContent);
          expect(removeExtraSpace(actInvDetail)).toBe(expInvDetail);
          //Verify transactions
          const expTransChargebackFee = buildInfoInvoiceDispute(orderName, "spay").transDeductChargebackFee;
          const expTransChargebackAmount = buildInfoInvoiceDispute(orderName, "spay").transDeductChargebackAmount;

          if (caseID == "SB_ORD_DISP_SPAY_3") {
            const actTransAmount = await orderPage.getDataByColumnLabel("Amount", 1);
            const actTransContent = await orderPage.getDataByColumnLabel("Content", 1, "1");
            const actTransType = await orderPage.getDataByColumnLabel("Type", 1);

            // Verify transaction chargeback amount
            expect(removeCurrencySymbol(actTransAmount)).toBe(
              "-" + removeCurrencySymbol(checkoutInfo.totals.total_price.toFixed(2)),
            );
            expect(removeExtraSpace(actTransContent)).toBe(expTransChargebackAmount);
            expect(actTransType).toBe("OUT");
          } else {
            for (let i = 1; i <= 2; i++) {
              const [actTransAmount, actTransContent, actTransType] = await Promise.all([
                await orderPage.getDataByColumnLabel("Amount", i),
                await orderPage.getDataByColumnLabel("Content", i, "1"),
                await orderPage.getDataByColumnLabel("Type", i),
              ]);
              switch (i) {
                case 1:
                  // Verify transaction chargeback fee
                  expect(removeCurrencySymbol(actTransAmount)).toBe("-" + removeCurrencySymbol(chargebackFee));
                  expect(actTransContent).toBe(expTransChargebackFee);
                  expect(actTransType).toBe("OUT");
                  break;
                case 2:
                  // Verify transaction chargeback amount
                  expect(removeCurrencySymbol(actTransAmount)).toBe("-" + removeCurrencySymbol(changebackAmount));
                  expect(removeExtraSpace(actTransContent)).toBe(expTransChargebackAmount);
                  expect(actTransType).toBe("OUT");
                  break;
              }
            }
          }
        });

        await test.step(`Verify email to merchant about chargeback`, async () => {
          // need more solution to get email from slack
        });
      });
    },
  );
});

test.describe("Submit dispute", () => {
  const casesID = "SUBMIT_DISPUTE";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(({ case_id: caseID, case_name: caseName, evidence_submited: evidenceSubmited }) => {
    test(`@${caseID} ${caseName}`, async ({ conf, authRequest, dashboard }) => {
      domain = conf.suiteConf.domain;
      const secretKey = conf.suiteConf.secret_key;
      const gatewayCode = "platform";
      checkoutAPI = new CheckoutAPI(domain, authRequest);
      orderPage = new OrdersPage(dashboard, domain);
      let chargebackAmount: string;
      let chargebackTotal: string;
      orderAPI = new OrderAPI(domain, authRequest);

      // Go to order with filter chargeback_status=open
      await orderPage.gotoOrderPageWithParam("chargeback_status=open");
      await orderPage.openThe1stOrderOnList();

      await test.step(`- Nhập thông tin form - Click "Submit evidence now" để submit form`, async () => {
        orderId = orderPage.getOrderIdInOrderDetail();
        orderName = (await orderAPI.getOrderInfo(orderId)).name;
        await orderPage.navigateToSubmitResponseChargeback();
        chargebackAmount = await orderPage.getChargeBackAmount();
        chargebackTotal = await orderPage.getTotalChargeback();
        await orderPage.enterAdditionalEvidence(evidenceSubmited);
        await orderPage.clickOnSubmitBtn();
        // Verify notifications
        expect(await orderPage.isToastMsgVisible("Submitted successfully!")).toBeTruthy();
        const actDisputeContentMsg = await orderPage.getContentOfChargebackMsg();
        expect(actDisputeContentMsg).toBe("Submit reimbursement request for a chargeback successfully");
      });

      let expDisputeContentMsg: Array<string>;
      let expTimelineContents: string;
      switch (caseID) {
        case "SB_ORD_DISP_SPAY_4":
          expDisputeContentMsg = [
            `A chargeback totalling ${chargebackAmount} was resolved in your favor`,
            `The customer's bank sided with you. The ${chargebackAmount} chargeback amount will be returned to you in an upcoming payout.`,
          ];
          expTimelineContents = `will be returned to you in an upcoming payout.`;
          break;
        case "SB_ORD_DISP_SPAY_5":
          expDisputeContentMsg = [`A chargeback totalling ${chargebackAmount} was resolved in the customer's favor`];
          expTimelineContents = `will be deducted from your payout because of chargeback.`;
          break;
      }

      await test.step(`Verify order details sau khi submit form với key winning`, async () => {
        //reload until new message show
        do {
          await orderPage.page.reload();
        } while ((await orderPage.isTextVisible("Submit reimbursement request for a chargeback successfully")) == true);

        // Verify noti
        for (let index = 0; index < expDisputeContentMsg.length; index++) {
          const actDisputeContentMsg = await orderPage.getContentOfChargebackMsg(index + 1);
          expect(actDisputeContentMsg).toBe(expDisputeContentMsg[index]);
        }

        // Verify order time line
        await orderPage.page.reload(); // for timeline appear
        await expect(await orderPage.orderTimeLines(expTimelineContents)).toBeVisible();
      });

      await test.step(`Tại order detail > [More actions] > [View invoice dispute]`, async () => {
        await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE_DISPUTE);
        //Verify info invoice
        const [actInvContent, actInvDetail] = await Promise.all([
          orderPage.getDataByRowLabel("Content"),
          orderPage.getDataByRowLabel("Detail"),
        ]);
        const expInvContent = buildInfoInvoiceDispute(orderName, "spay").contentInvoice;
        const expInvDetail = buildInfoInvoiceDispute(orderName, "spay").detailInvoice;
        //verify content
        expect(actInvContent).toBe(expInvContent);
        //verify details
        expect(removeExtraSpace(actInvDetail)).toBe(expInvDetail);
        do {
          await orderPage.page.reload(); //for transaction IN appear
        } while ((await orderPage.isTextVisible("IN")) == false);
        //Verify transaction
        const expTransRefund = buildInfoInvoiceDispute(orderName, "spay").transRefundChargebackTotal;
        const [actTransAmount, actTransContent, actTransType] = await Promise.all([
          orderPage.getDataByColumnLabel("Amount", 1),
          orderPage.getDataByColumnLabel("Content", 1, "1"),
          orderPage.getDataByColumnLabel("Type", 1),
        ]);
        expect(removeCurrencySymbol(actTransAmount)).toBe(removeCurrencySymbol(chargebackTotal));
        expect(actTransContent).toBe(expTransRefund);
        expect(actTransType).toBe("IN");
      });

      await test.step(`Vào dashboard Stripe > Vào dashboard acc Stripe > Verify transaction of order`, async () => {
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
        switch (caseID) {
          case "SB_ORD_DISP_SPAY_4":
            expect(orderInfo.ordDisputeStatus).toBe("won");
            break;
          case "SB_ORD_DISP_SPAY_5":
            expect(orderInfo.ordDisputeStatus).toBe("lost");
            break;
        }
      });
    });
  });
});
