import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { CheckoutAPI } from "@pages/api/checkout";

import { loadData } from "@core/conf/conf";
import { buildOrderTimelineMsg, isEqual, parseMoneyCurrency } from "@utils/checkout";
import { SFHome } from "@sf_pages/homepage";

test.describe("Kiểm tra order detail trong dashboard khi checkout với stripe, Setting checkout 3 pages", () => {
  const caseName = "TC_SB_CHE_STR";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      product: productInfo,
      product_ppc_name: ppcItem,
      payment_method: paymentMethod,
      case_id: caseID,
      email,
      shipping_address: shippingAddress,
    }) => {
      test(`Kiểm tra order detal trong dashboard khi checkout với stripe for case @${caseID}`, async ({
        page,
        conf,
        token,
        request,
      }) => {
        // prepair data for
        const domain = conf.suiteConf.domain;
        const shopToken = await token.getWithCredentials({
          domain: conf.suiteConf.shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        const accessToken = shopToken.access_token;
        const numberRetry = conf.suiteConf.number_retry;
        const homePage = new SFHome(page, domain);

        let checkout: SFCheckout;
        let orderPage: OrdersPage;
        let orderId: number;
        let totalOrderSF: string;
        let customerEmail: string;

        let isPostPurchase = false;
        let itemPostPurchaseValue = "0";

        const gatewayName = conf.suiteConf.gateway_info.gateway_name;
        const endingCardNo = conf.suiteConf.gateway_info.ending_card_no;
        const isEUPayment = paymentMethod !== "Stripe";

        await test.step(`
            Lên storefront của shop
            Checkout sản phẩm: Shirt
            Nhập các thông tin trong trang:
             + Customer information
             + Shipping
             + Chọn Payment method
            Nhập card checkout
            Click Complete order
            `, async () => {
          const countryCode = shippingAddress.country_code;

          if (isEUPayment) {
            await homePage.gotoHomePage();
            await homePage.selectStorefrontCurrencyV2("Germany (EUR)", "inside");
          }

          const checkoutAPI = new CheckoutAPI(domain, request, page);

          await checkoutAPI.addProductToCartThenCheckout(productInfo);
          await checkoutAPI.updateCustomerInformation(email, shippingAddress);
          await checkoutAPI.selectDefaultShippingMethod(countryCode);
          await checkoutAPI.openCheckoutPageByToken();

          checkout = new SFCheckout(page, domain);
          await checkout.completeOrderWithMethod(paymentMethod);
        });

        await test.step("Tại popup ppc, chọn item post purchase và commplete order", async () => {
          if (ppcItem) {
            await checkout.page.waitForSelector(checkout.xpathPPCPopupContent);
          }
          itemPostPurchaseValue = await checkout.addProductPostPurchase(ppcItem);
          if (itemPostPurchaseValue != null) {
            isPostPurchase = true;
            await checkout.completePaymentForPostPurchaseItem(paymentMethod);
          }
        });

        await test.step(`
        Tại Thankyou page
        - Lấy ra thông tin order name
        Tại Dashboard > Order
        - Search order theo order name
        - Vào Order detail của order vừa tạo
        - Kiểm tra order order detail`, async () => {
          totalOrderSF = await checkout.getTotalOnOrderSummary();
          customerEmail = await checkout.getCustomerEmail();
          orderId = await checkout.getOrderIdBySDK();
          orderPage = await checkout.openOrderByAPI(orderId, accessToken);

          //cause sometimes order captures slower than usual
          const orderStatus = await orderPage.reloadUntilOrdCapture("", numberRetry);

          switch (paymentMethod) {
            case "SEPA Direct Debit":
              expect(orderStatus).toEqual("Payment in process");
              break;
            default:
              expect(orderStatus).toEqual("Paid");
          }
          if (isEUPayment) {
            await orderPage.switchCurrency();
          }
          let actualTotalOrder = await orderPage.getTotalOrder();
          expect(isEqual(parseMoneyCurrency(actualTotalOrder), parseMoneyCurrency(totalOrderSF), 0.01)).toEqual(true);

          // cmt do bug > đã fix trên dev > đợi build lên prod sẽ bỏ cmt
          // const actualPaidByCustomer = await orderPage.getPaidByCustomer();
          // expect(actualPaidByCustomer).toEqual(totalOrderSF);

          if (isEUPayment) {
            const rateCurrency = await orderPage.getRateCurrency();
            totalOrderSF = (parseMoneyCurrency(totalOrderSF) / rateCurrency).toFixed(2);
            actualTotalOrder = (parseMoneyCurrency(actualTotalOrder) / rateCurrency).toFixed(2);
            if (isPostPurchase && itemPostPurchaseValue != "0") {
              itemPostPurchaseValue = (parseMoneyCurrency(itemPostPurchaseValue) / rateCurrency).toFixed(2);
            }
          }

          const orderTimelineSendingEmail = buildOrderTimelineMsg(
            shippingAddress.first_name,
            shippingAddress.last_name,
            customerEmail,
          ).timelineSendEmail;
          const orderTimelineCustomerPlaceOrder = buildOrderTimelineMsg(
            shippingAddress.first_name,
            shippingAddress.last_name,
            customerEmail,
          ).timelinePlaceOrd;
          const orderTimelinePaymentProcessed = [];
          // To (+- 0.01) + currency because when converting the currency,
          // the rounding in the server and the client may be different
          [-0.01, 0, 0.01].forEach(threshold => {
            orderTimelinePaymentProcessed.push(
              orderPage.buildOrderTimelineMsgByGW(
                (parseMoneyCurrency(totalOrderSF) + threshold).toFixed(2),
                paymentMethod,
                itemPostPurchaseValue,
                gatewayName,
                endingCardNo,
              ),
            );
          });
          const orderTimelineTransID = orderPage.getTimelineTransIDByGW(paymentMethod);

          await expect(
            await orderPage.waitOrderTimeLineVisible(orderTimelineSendingEmail, false, "", numberRetry),
          ).toBeVisible();
          await expect(
            await orderPage.waitOrderTimeLineVisible(orderTimelineCustomerPlaceOrder, false, "", numberRetry),
          ).toBeVisible();
          await expect(
            await orderPage.waitOrderTimeLineVisibleWithArrayText(
              orderTimelinePaymentProcessed,
              false,
              "",
              numberRetry,
            ),
          ).toBeVisible();
          await expect(
            await orderPage.waitOrderTimeLineVisible(orderTimelineTransID, false, "", numberRetry),
          ).toBeVisible();
          if (
            ppcItem != null &&
            ppcItem != undefined &&
            paymentMethod != "Stripe" &&
            paymentMethod != "SEPA Direct Debit"
          ) {
            // need +- 0.01 because when converting the currency,
            // the rounding in the server and the client may be different
            const orderTimeLinePaymentProcessedItemPPC = orderPage.generateListOrderTimelineMsgByGw(
              paymentMethod,
              [
                itemPostPurchaseValue,
                (parseMoneyCurrency(itemPostPurchaseValue) + 0.01).toFixed(2),
                (parseMoneyCurrency(itemPostPurchaseValue) - 0.01).toFixed(2),
              ],
              gatewayName,
              endingCardNo,
            );
            await expect(
              await orderPage.waitOrderTimeLineVisibleWithArrayText(
                orderTimeLinePaymentProcessedItemPPC,
                false,
                "",
                numberRetry,
              ),
            ).toBeVisible();
            await expect(
              await orderPage.waitOrderTimeLineVisible(
                orderTimelineTransID,
                isPostPurchase,
                paymentMethod,
                numberRetry,
              ),
            ).toBeVisible();
          }
        });
      });
    },
  );
});

test.describe("Kiểm tra checkout fail với stripe eu", () => {
  // eslint-disable-next-line max-len
  test(`Kiểm tra checkout fail với stripe eu @TC_SB_CHE_STR_60`, async ({ page, conf, request }) => {
    // prepair data for

    const domain = conf.suiteConf.domain;
    let checkout: SFCheckout;

    const productInfo = conf.caseConf.product;
    const email = conf.caseConf.email;
    const paymentMethod = conf.caseConf.payment_method;
    const shippingAddress = conf.caseConf.shipping_address;
    const homePage = new SFHome(page, domain);

    await test.step(`
    Lên storefront của shop
    Checkout sản phẩm: Shirt
    Nhập các thông tin trong trang:
     + Customer information
     + Shipping
     + Chọn Payment method
    Click Place order
    `, async () => {
      const countryCode = shippingAddress.country_code;

      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2("Germany (EUR)", "inside");

      const checkoutAPI = new CheckoutAPI(domain, request, page);

      await checkoutAPI.addProductToCartThenCheckout(productInfo);
      await checkoutAPI.updateCustomerInformation(email, shippingAddress);
      await checkoutAPI.selectDefaultShippingMethod(countryCode);
      await checkoutAPI.openCheckoutPageByToken();

      checkout = new SFCheckout(page, domain);
      await checkout.selectPaymentMethod(paymentMethod);
    });

    await test.step(`
    Tại trang thanh toán của Stripe > Click Fail payment test
    `, async () => {
      await checkout.checkoutFailOrderOnStripePage();
      await checkout.waitForNoticeMessage(
        `The customer did not approve the PaymentIntent. Provide a new payment method to attempt to fulfill this PaymentIntent again.`,
      );
    });
  });
});
