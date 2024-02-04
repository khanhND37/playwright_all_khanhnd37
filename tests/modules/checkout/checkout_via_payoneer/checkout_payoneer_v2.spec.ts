import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { MailBox } from "@pages/thirdparty/mailbox";
import type { BuyerInfoApi, OrderAfterCheckoutInfo, OrderSummary } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { isEqual } from "@core/utils/checkout";
import { loadData } from "@core/conf/conf";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { OrderAPI } from "@pages/api/order";

test.describe("Checkout via Payoneer 3-steps", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let mailBox: MailBox;
  let themeSetting: SettingThemeAPI;
  let domain: string;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let customerInfo: BuyerInfoApi;
  let orderSummaryBeforeCompleteOrd: OrderSummary;
  let paymentMethod: string;
  let payoneerAcc;

  const verifyInfoOrder = async (infoOrderOnPayoneer, infoOrderCheckout): Promise<void> => {
    const item = infoOrderCheckout.find(item => item.variant_id === infoOrderOnPayoneer.variant_id);
    if (item) {
      expect(Object.keys(infoOrderOnPayoneer)).toEqual(expect.arrayContaining(Object.keys(item)));
    }
  };

  const casesID = "CO_Theme_v2";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      checkout_label: checkoutLabel,
      card_info: cardInfo,
      products_checkout: productsCheckout,
      product_ppc_checkout: productPostPurchase,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard, theme, authRequestWithExchangeToken }) => {
        domain = conf.suiteConf.domain;
        paymentMethod = conf.suiteConf.payment_method;
        payoneerAcc = conf.suiteConf.payoneer_acc;
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);
        themeSetting = new SettingThemeAPI(theme);
        await themeSetting.editCheckoutLayout(checkoutLabel);

        await test.step(`- Tại Store-front:
      + Buyer add product to cart và đi đến trang checkout
      + Buyer nhập thông tin shipping, chọn shipping method và đi đến trang payment method
      + Tại block Payment: chọn Credit card Payoneer
      + Click "Complete order"/'Place your order'`, async () => {
          customerInfo = await checkoutAPI.addProductThenSelectShippingMethod(productsCheckout);
          await checkoutAPI.openCheckoutPageByToken();

          // Get summary then click complete order
          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
          await checkoutPage.selectPaymentMethod(paymentMethod);
          await checkoutPage.clickBtnCompleteOrder();

          /**
           * Expected:
           * - Browser chuyển hướng đến trang thanh toán của cổng Payoneer
           * - Thể hiện cần thanh toán số tiền cho order là Total
           */
          expect(await checkoutPage.getTotalAmtOnPayWithPayoneerPage()).toBe(
            orderSummaryBeforeCompleteOrd.totalPrice.toFixed(2),
          );
        });

        await test.step(`- Tại trang thanh toán của cổng Payoneer
      + Buyer nhập card checkout
      + Click button "Pay" `, async () => {
          await checkoutPage.completeOrderViaPayoneer(cardInfo);
          /**
           * Expected:
           * - Sau khi click button Pay:
           * + Không hiển thị popup 3Ds
           * + Browser tự động chuyển hướng về trang Thankyou page
           * - Hiển thị chính xác Order summary
           */

          let ppcValue = "0";
          // Add PPC:
          if (productPostPurchase) {
            const isShowPPC = await checkoutPage.isPostPurchaseDisplayed();
            expect(isShowPPC).toBeTruthy();
            if (productPostPurchase.is_add_PPC) {
              ppcValue = await checkoutPage.addProductPostPurchase(productPostPurchase.name);
              if (!ppcValue) {
                ppcValue = "0";
              } else {
                // Complete payment for PPC
                await checkoutPage.completePaymentForPostPurchaseItem(paymentMethod);
              }
            } else {
              // for case don't add PPC
              await checkoutPage.genLoc(checkoutPage.xpathClosePPCPopUp).click();
            }
          }
          // Expected: - Thanh toán thành công, hiển thị trang thankyou
          await page.waitForSelector(checkoutPage.xpathThankYou);
          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          expect(
            isEqual(orderSummaryInfo.subTotal, orderSummaryBeforeCompleteOrd.subTotal + parseFloat(ppcValue), 0.01),
          ).toBe(true);
        });

        await test.step(`- Tại Dashboard > Orders:
      + Truy vào order details bằng order name`, async () => {
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          const orderStatus = await orderPage.reloadUntilOrdCapture(null, 20);
          expect(orderStatus).toEqual("Paid");
          // verify order amount
          const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
          expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);

          const paidByCustomer = parseFloat(removeCurrencySymbol(await orderPage.getPaidByCustomer()));
          expect(isEqual(paidByCustomer, orderSummaryInfo.totalSF, 0.01)).toBe(true);
        });

        await test.step(`- Tại mail box của buyer: Tìm kiếm email confirmation của order vừa tạo "Order {order name} confirmed"`, async () => {
          mailBox = await checkoutPage.openMailBox(customerInfo.emailBuyer);
          await mailBox.openOrderConfirmationNotification(orderSummaryInfo.orderName);
          // verify total order
          const actualTotalOrder = await mailBox.getTotalOrder();
          expect(removeCurrencySymbol(actualTotalOrder)).toBe(orderSummaryInfo.totalSF.toString());
        });

        await test.step(`- Tại Dashboard Payoneer > Checkout > Store transactions: Tìm kiếm order bằng transaction ID (shopId_checkoutToken)`, async () => {
          const requestObj = await authRequestWithExchangeToken.changeToken();
          const orderApi = new OrderAPI(domain, requestObj);
          const listTransactionId = await orderApi.getListTransactionId(orderSummaryInfo.orderId);
          let totalPayoneerAmount = 0;
          const listInfoOrder = [];
          for (const transactionId of listTransactionId) {
            const orderInfoOnPayoneer = await orderApi.getOrdInfoInPayoneer({
              userNamePayoneer: payoneerAcc.user_name,
              passWordPayoneer: payoneerAcc.password,
              transactionId,
            });
            totalPayoneerAmount += orderInfoOnPayoneer.total_amount;
            for (const infoOrderItem of orderInfoOnPayoneer.infoOrder) {
              listInfoOrder.push(infoOrderItem);
            }
          }
          expect(isEqual(totalPayoneerAmount, orderSummaryInfo.totalSF, 0.01)).toBe(true);
          await verifyInfoOrder(productsCheckout, listInfoOrder);
          if (productPostPurchase) {
            await verifyInfoOrder(productPostPurchase, listInfoOrder);
          }
        });
      });
    },
  );
});
