import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { CheckoutAPI } from "@pages/api/checkout";
import { isEqual } from "@core/utils/checkout";
import { removeCurrencySymbol } from "@core/utils/string";

test.describe("Opay Smoke checkout", () => {
  const caseName = "DATA_DRIVEN_NE";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.forEach(
    ({
      case_description: caseDescription,
      payment_method: paymentMethod,
      product_info: productInfo,
      shop_info: shopInfo,
      case_id: caseID,
    }) => {
      test(`@${caseID} - ${caseDescription}`, async ({ page, conf, request, multipleStore }) => {
        // prepair data for
        let totalOrderSF: string;
        let orderName: string;

        const domain = shopInfo.domain;
        const ppcItem = conf.suiteConf.product_ppc_name;

        const checkoutAPI = new CheckoutAPI(domain, request, page);
        const checkout = new SFCheckout(page, domain);

        await test.step(`
          Lên storefront của shop
          Checkout sản phẩm: Shirt
          Nhập các thông tin trong trang:
          + Customer information
          + Shipping
          `, async () => {
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productInfo);
          await checkoutAPI.openCheckoutPageByToken(true);
        });

        await test.step(`
        Tại trang checkout:
        + Chọn Payment method
        Nhập card checkout
        Click Complete order
        `, async () => {
          await checkout.completeOrderWithMethod(paymentMethod);
          await expect(checkout.page.locator(checkout.xpathPPCPopupContent)).toBeVisible();
        });

        await test.step("Tại popup ppc, chọn item post purchase và commplete order", async () => {
          await checkout.addProductPostPurchase(ppcItem);
          await checkout.completePaymentForPostPurchaseItem(paymentMethod);
          await expect(checkout.page.locator(checkout.xpathThankYou)).toBeVisible();
        });

        await test.step(`
          Tại Thankyou page
          - Lấy ra thông tin order name
          Tại Dashboard > Order
          - Search order theo order name
          - Vào Order detail của order vừa tạo
          - Kiểm tra order order detail`, async () => {
          totalOrderSF = await checkout.getTotalOnOrderSummary();
          orderName = await checkout.getOrderName();

          const dashboardPage = await multipleStore.getDashboardPage(
            shopInfo.username,
            shopInfo.password,
            shopInfo.domain,
            shopInfo.shop_id,
            shopInfo.user_id,
          );

          const orderPage = new OrdersPage(dashboardPage, domain);
          await orderPage.gotoOrderPage();
          await orderPage.gotoOrderDetail(orderName);
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
          expect(
            isEqual(Number(removeCurrencySymbol(actualTotalOrder)), Number(removeCurrencySymbol(totalOrderSF)), 0.01),
          ).toBe(true);
        });
      });
    },
  );
});
