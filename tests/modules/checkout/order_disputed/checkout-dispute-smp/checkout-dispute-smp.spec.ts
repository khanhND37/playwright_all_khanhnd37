import { test, expect } from "@core/fixtures";
import { removeCurrencySymbol, removeExtraSpace } from "@core/utils/string";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { Card, CheckoutInfo, DataBalance, Product } from "@types";
import { CheckoutAPI } from "@pages/api/checkout";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { buildInfoInvoiceDispute, isEqual } from "@core/utils/checkout";
import { loadData } from "@core/conf/conf";

let domain: string;
let orderPage: OrdersPage;
let productCheckout: Array<Product>;
let checkoutInfo: CheckoutInfo;
let checkoutAPI: CheckoutAPI;
let balanceAPI: BalanceUserAPI;
let dataBalanceBeforeCO: DataBalance;
let dataBalance: DataBalance;
let cardInfo: Card;
let orderId: number, orderName: string, profitOrder: number, retry, messageChargeback, casesID, conf;
let changebackAmount: string, chargebackFee: string;
let expTotal: number, totalChargebackAmount: number;

test.describe("Update charge dispute SMP", () => {
  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    domain = conf.suiteConf.domain;
    productCheckout = conf.suiteConf.product_info;
    retry = conf.suiteConf.retry;
    checkoutAPI = new CheckoutAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);
    balanceAPI = new BalanceUserAPI(domain, authRequest);
  });

  test(`@SB_ORD_DISP_SPAY3_1 [Updated] Check that chargebacks notification is displayed in order details after checkout via 4000000000000259`, async ({
    conf,
  }) => {
    await test.step(`Pre conditions`, async () => {
      //lưu info Balance: ATP, AS, ATP trước khi có CO
      dataBalanceBeforeCO = await balanceAPI.getDataBalance();
      cardInfo = conf.caseConf.card_info;

      //Tạo order chargeback
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productCheckout,
        cardInfo: cardInfo,
      });
      orderId = checkoutInfo.order.id;
      orderName = checkoutInfo.order.name;
    });

    await test.step(`Verify order details`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture("", retry);
      await orderPage.reloadUntilChargebackMsgShown();

      // chargebacks notification is displayed in order details
      const isChargebackDisplay = await orderPage.genLoc(orderPage.xpathDisputeNotification).isVisible();
      expect(isChargebackDisplay).toBeTruthy();

      await orderPage.navigateToSubmitResponseChargeback();
      changebackAmount = await orderPage.getChargeBackAmount();
      chargebackFee = await orderPage.getChargebackFee();

      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE);
      profitOrder = +removeCurrencySymbol(await orderPage.getDataByRowLabel("Amount"));
    });

    await test.step(`Tại order detail > [More actions] > [View invoice dispute]`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.moreActionsOrder(Action.ACTION_VIEW_INVOICE_DISPUTE);
      // verify info invoice
      const [actInvContent, actInvDetail] = await Promise.all([
        orderPage.getDataByRowLabel("Content"),
        orderPage.getDataByRowLabel("Detail"),
      ]);

      // verify content
      expect(actInvContent).toBe("ShopBase Marketplace Payment order on hold");
      // verify details
      expect(removeExtraSpace(actInvDetail)).toBe(`Order ${orderName} on hold due to dispute. Learn more`);

      // Verify invoice transactions
      const expDeductChargebackFee = buildInfoInvoiceDispute(orderName, "smp").transDeductChargebackFee;
      const expDeductChargebackAmount = buildInfoInvoiceDispute(orderName, "smp").transDeductChargebackAmount;

      // get 2 transactions
      for (let i = 1; i <= 2; i++) {
        const [actTransAmount, actTransContent, actTransType] = await Promise.all([
          orderPage.getDataByColumnLabel("Amount", i),
          orderPage.getDataByColumnLabel("Content", i, "1"),
          orderPage.getDataByColumnLabel("Type", i),
        ]);
        expect(actTransType).toBe("OUT");
        if (i == 1) {
          expect(actTransAmount).toBe("-" + chargebackFee);
          expect(actTransContent).toBe(expDeductChargebackFee);
        }
        if (i == 2) {
          expect(actTransAmount).toBe("-" + changebackAmount);
          expect(removeExtraSpace(actTransContent)).toBe(expDeductChargebackAmount);
        }
      }
    });

    await test.step(`Vào SB Balance > Verify ATP, AS, ATP`, async () => {
      totalChargebackAmount = checkoutInfo.totals.total_price + +removeCurrencySymbol(chargebackFee);
      dataBalance = await balanceAPI.getDataBalance();
      // Total
      expTotal =
        dataBalanceBeforeCO.available_amount + dataBalanceBeforeCO.available_soon - totalChargebackAmount + profitOrder;

      // verify Total
      expect(
        isEqual(dataBalance.available_amount + dataBalance.available_soon, +expTotal.toFixed(2), 0.01),
      ).toBeTruthy();
    });
  });

  casesID = "SB_CHARGE_BACK";
  conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(({ case_id: caseID, case_name: caseName, card_info: cardInfo }) => {
    test(`@${caseID} ${caseName}`, async ({}) => {
      await test.step(`Checkout via Spay Reseller by chargeback test card`, async () => {
        //Tạo order chargeback
        checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: productCheckout,
          cardInfo: cardInfo,
        });
        orderId = checkoutInfo.order.id;
        orderName = checkoutInfo.order.name;
      });

      await test.step(`Verify order details`, async () => {
        await orderPage.goToOrderByOrderId(orderId);
        await orderPage.reloadUntilOrdCapture("", retry);
        await orderPage.reloadUntilChargebackMsgShown();
        const totalOrder = await orderPage.getTotalOrder();

        // chargebacks notification is displayed in order details
        const isChargebackDisplay = await orderPage.genLoc(orderPage.xpathDisputeNotification).isVisible();
        expect(isChargebackDisplay).toBeTruthy();

        switch (caseID) {
          case "SB_ORD_DISP_SPAY3_2":
            messageChargeback = `The customer opened a chargeback totalling ${totalOrder}`;
            break;
          case "SB_ORD_DISP_SPAY3_3":
            messageChargeback = `The customer opened a dispute inquiry totalling ${totalOrder}`;
            break;
        }
        const isMessageDisplay = await orderPage.isTextVisible(messageChargeback);
        expect(isMessageDisplay).toBeTruthy();
      });
    });
  });

  casesID = "SB_SUBMIT_CHARGE_BACK";
  conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({ case_id: caseID, case_name: caseName, card_info: cardInfo, evidence_submited: evidenceSubmited }) => {
      test(`@${caseID} ${caseName}`, async ({}) => {
        await test.step(`Pre conditions`, async () => {
          //Tạo order chargeback
          checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
            productsCheckout: productCheckout,
            cardInfo: cardInfo,
          });
          orderId = checkoutInfo.order.id;
          orderName = checkoutInfo.order.name;
        });

        await test.step(`Fill infor for each fields with each reason`, async () => {
          await orderPage.goToOrderByOrderId(orderId);
          await orderPage.reloadUntilOrdCapture("", retry);
          await orderPage.reloadUntilChargebackMsgShown();

          // chargebacks notification is displayed in order details
          const isChargebackDisplay = await orderPage.genLoc(orderPage.xpathDisputeNotification).isVisible();
          expect(isChargebackDisplay).toBeTruthy();
        });

        await test.step(`Submit form`, async () => {
          await orderPage.navigateToSubmitResponseChargeback();
          await orderPage.enterAdditionalEvidence(evidenceSubmited);
          await orderPage.clickOnSubmitBtn();

          // Submit chargeback response form successfully
          switch (caseID) {
            case "SB_ORD_DISP_SPAY3_4":
              messageChargeback = `Submit reimbursement request for a chargeback successfully`;
              break;
            case "SB_ORD_DISP_SPAY3_5":
              messageChargeback = `Submit reimbursement request for a dispute inquiry successfully`;
              break;
          }
          const isSubmitSuccessful = await orderPage.isTextVisible(messageChargeback);
          expect(isSubmitSuccessful).toBeTruthy();
        });
      });
    },
  );
});
