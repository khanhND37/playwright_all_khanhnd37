import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { getCurrencySymbolBasedOnCurrencyName, removeCurrencySymbol } from "@core/utils/string";
import type { OrderAfterCheckoutInfo, Product } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { isEqual } from "@core/utils/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { CheckoutAPI } from "@pages/api/checkout";

test.describe("Smoke PayPal Checkout page", () => {
  let checkoutAPI: CheckoutAPI;
  let checkoutPage: SFCheckout;
  let orderPage: OrdersPage;
  let homePage: SFHome;
  let productPage: SFProduct;
  let domain: string;
  let productCheckout: Product[];
  let ppcItem: string;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let subTotal: number;

  const casesID = "DATA_CHECKOUT";
  const conf = loadData(__dirname, casesID);

  // for each data, will do tests
  conf.caseConf.forEach(
    ({
      case_id: caseId,
      case_description: caseDescription,
      payment_method: paymentMethod,
      currency_checkout: currencyCO,
      currency_payment: currencyPay,
      case_page: casePage,
    }) => {
      test(`@${caseId} - ${caseDescription}`, async ({ page, dashboard, authRequest }) => {
        // prepair data for
        domain = conf.suiteConf.domain;
        productCheckout = conf.suiteConf.product_info;
        ppcItem = conf.suiteConf.product_ppc_name;
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        homePage = new SFHome(page, domain);
        productPage = new SFProduct(page, domain);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);

        const expCurrencyCO = getCurrencySymbolBasedOnCurrencyName(currencyCO);
        const expCurrencyPay = getCurrencySymbolBasedOnCurrencyName(currencyPay);
        let paymentAmount: number; // To save the amount be paid via PayPal

        await test.step(`Pre-conditions: Chọn currency`, async () => {
          await homePage.gotoHomePage();
          await homePage.selectStorefrontCurrencyNE(currencyCO, "Germany");
        });

        await test.step(`Thực hiện tìm kiếm và mở product details > Checkout với PP express tại product page
          `, async () => {
          // Tạo checkout
          if (casePage == "checkout") {
            await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout);
            checkoutPage = await checkoutAPI.openCheckoutPageByToken(true);
            subTotal = Number(removeCurrencySymbol(await checkoutPage.getSubtotalOnOrderSummary()));
          } else {
            subTotal = await homePage.searchThenClickToViewProduct(productCheckout[0].name);
            await checkoutPage.page.waitForLoadState();
            if (casePage == "cart") {
              await productPage.addToCart();
              await productPage.gotoCart();
            }
          }

          const totalOrderOnPayPalPage = await checkoutPage.completeOrderWithMethod(paymentMethod);
          paymentAmount = Number(removeCurrencySymbol(totalOrderOnPayPalPage));

          // verify currency payment
          const actCurrencyPay = totalOrderOnPayPalPage.charAt(0);
          expect(actCurrencyPay).toBe(expCurrencyPay);

          await expect(checkoutPage.page.locator(checkoutPage.xpathPPCPopupContent)).toBeVisible();
        });

        await test.step("Tại popup ppc, chọn item post purchase và commplete order", async () => {
          // Add PPC:
          const ppcValue = await checkoutPage.addProductPostPurchase(ppcItem);
          const ppcValueOnPayPalPage = await checkoutPage.getTextContent(checkoutPage.xpathTotalOrderSandboxPaypal);
          paymentAmount = paymentAmount + Number(removeCurrencySymbol(ppcValueOnPayPalPage));

          await checkoutPage.completePaymentForPostPurchaseItem(paymentMethod);

          // Expected: - Thanh toán thành công, hiển thị trang thankyou
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 20000 });
          // verify currency
          const actCurrencyCO = await checkoutPage.getCOCurrencySymbol();
          expect(actCurrencyCO).toBe(expCurrencyCO);
          // verify order amount
          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          expect(isEqual(orderSummaryInfo.subTotal, subTotal + parseFloat(ppcValue), 0.01)).toBeTruthy();
        });

        await test.step(`
          Tại Thankyou page
          - Lấy ra thông tin order name
          Tại Dashboard > Order
          - Search order theo order name
          - Vào Order detail của order vừa tạo
          - Kiểm tra order order detail`, async () => {
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          //cause sometimes order captures slower than usual
          const orderStatus = await orderPage.reloadUntilOrdCapture("", 10);
          expect(orderStatus).toEqual("Paid");

          // Check and Click button 'Switch currency'
          const isBtnSwitchCurrencyVisible = await orderPage.isElementExisted(
            orderPage.xpathBtnSwitchCurrency,
            null,
            1000,
          );
          if (isBtnSwitchCurrencyVisible) {
            await orderPage.switchCurrency();
          }

          const actualTotalOrder = await orderPage.getTotalOrder();
          expect(isEqual(Number(removeCurrencySymbol(actualTotalOrder)), paymentAmount, 0.01)).toBe(true);
        });
      });
    },
  );
});
