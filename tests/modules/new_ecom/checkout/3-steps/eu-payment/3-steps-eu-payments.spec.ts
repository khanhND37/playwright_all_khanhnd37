import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import type { OrderAfterCheckoutInfo, OrderSummary, Product } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { isEqual } from "@core/utils/checkout";
import { SFHome } from "@pages/storefront/homepage";

test.describe("SB_CHE_CHEN_NE_3STEPS_EU_PAYMENTS Checkout new ecom without setting PPC via EU payment", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let homePage: SFHome;
  let domain: string;
  let productCheckout: Product[];
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let orderSummaryBeforeCompleteOrd: OrderSummary;

  const casesID = "SB_CHE_CHEN_NE_3STEPS_EU_PAYMENTS";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      email: email,
      currency: currency,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ page, authRequest, dashboard }) => {
        domain = conf.suiteConf.domain;
        homePage = new SFHome(page, domain);
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);

        productCheckout = conf.suiteConf.products_checkout;

        await test.step(`Tạo checkout thành công`, async () => {
          await homePage.gotoHomePage();
          await homePage.selectStorefrontCurrencyNE(currency, shippingAddress.country_name);
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, email, shippingAddress);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();

          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
          await checkoutPage.completeOrderWithMethod(paymentMethod);

          // Expected: - Thanh toán thành công, hiển thị trang thankyou
          await page.waitForSelector(checkoutPage.xpathThankYou);

          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          expect(isEqual(orderSummaryInfo.subTotal, orderSummaryBeforeCompleteOrd.subTotal, 0.01)).toBe(true);
          expect(
            isEqual(
              orderSummaryInfo.totalSF - orderSummaryInfo.tippingValue,
              orderSummaryBeforeCompleteOrd.totalPrice - orderSummaryBeforeCompleteOrd.tippingVal,
              0.01,
            ),
          ).toBe(true);
        });

        await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);

          // Click button 'Switch currency'
          await orderPage.switchCurrency();

          // verify order amount
          const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
          expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);
        });

        // Không check mail tại đây do đã được handle trong case khác
        // await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
        //   mailBox = await checkoutPage.openMailBox(customerInfo.emailBuyer);
        //   await mailBox.openOrderConfirmationNotification(orderSummaryInfo.orderName);
        //   // verify total order
        //   const actualTotalOrder = await mailBox.getTotalOrder();
        //   expect(Number(removeCurrencySymbol(actualTotalOrder))).toBe(orderSummaryInfo.totalSF);
        // });
      });
    },
  );
});
