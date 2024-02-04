import type { OrderAfterCheckoutInfo, PaypalOrderSummary, Product } from "@types";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { CheckoutAPI } from "@pages/api/checkout";
import { isEqual } from "@core/utils/checkout";
import { OrderAPI } from "@pages/api/order";
import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Checkout express", () => {
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let cartPPCSummary: PaypalOrderSummary;
  let cartSummary: PaypalOrderSummary;
  let productCheckout: Product[];
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let popupPage: SFCheckout;
  let orderPage: OrdersPage;
  let orderApi: OrderAPI;
  let homePage: SFHome;
  let domain: string;
  let paypalAccount;
  let productPPC;
  let ppcValue;

  test(`@SB_CHE_NEW_EF_102 [Plbase]-[Desktop]-[Theme New-ecom] Check out với Paypal express và kiểm tra order detail trên dashboard và trên cổng, order có PPC, setting 1 page checkout`, async ({
    conf,
    page,
    authRequest,
    authRequestWithExchangeToken,
    dashboard,
  }) => {
    domain = conf.suiteConf.domain;
    paypalAccount = conf.suiteConf.paypal_account;

    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    orderApi = new OrderAPI(domain, authRequest);

    productCheckout = conf.caseConf.products_checkout;
    productPPC = conf.caseConf.product_ppc;

    // Set time out for test case
    test.setTimeout(400000);

    await test.step(`
      - Lên storefront của shop
      - Add to cart: Shirt 
      - Di chuyển đến trang checkout
      - Click button Paypal express trên đầu trang- Login vào Paypal account`, async () => {
      // Tạo checkout
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();
      const expressPopup = await checkoutPage.clickButtonExpressAndLoginToPP();
      cartSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(expressPopup);

      popupPage = new SFCheckout(expressPopup, domain);
      await popupPage.page.click(popupPage.xpathPPIconClose);

      // Expected: Popup có thông tin order summary và shipping method
      await expect(popupPage.page.locator(popupPage.xpathPPShippingMethodSelector)).toBeVisible();
      expect(cartSummary.subtotal).not.toBe(0.0);
      expect(cartSummary.shipping_value).not.toBe(0.0);
      expect(cartSummary.total_price).not.toBe(0.0);
    });

    await test.step(`- Buyer nhấn confirm order trên popup`, async () => {
      await popupPage.page.click(popupPage.xpathSubmitBtnOnPaypal);
      await popupPage.page.waitForEvent("close");

      // Expected: - Popup đóng lại, Hiện trang thankyou
      await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toBeVisible();
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();

      // Expected: - Hiển thị thông tin order summary giống với trên popup
      expect(isEqual(orderSummaryInfo.subTotal, cartSummary.subtotal, 0.01)).toBe(true);
      expect(isEqual(orderSummaryInfo.totalSF, cartSummary.total_price, 0.01)).toBe(true);
      expect(Number(orderSummaryInfo.shippingSF)).toEqual(cartSummary.shipping_value);
      expect(isEqual(Number(orderSummaryInfo.discountValue), cartSummary.discount_value, 0.01)).toBe(true);
      expect(isEqual(orderSummaryInfo.taxValue, cartSummary.taxes, 0.01)).toBe(true);
      expect(isEqual(orderSummaryInfo.tippingValue, cartSummary.tipping_value, 0.01)).toBe(true);
    });

    await test.step(`- Login vào Dashboard- Vào Order detail của order vừa tạo`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      // verify order amount
      const orderDetailSummary = await orderPage.getOrderSummaryShopBaseInOrderDetail();
      expect(isEqual(orderDetailSummary.subtotal, cartSummary.subtotal, 0.01)).toBe(true);
      expect(isEqual(orderDetailSummary.total, cartSummary.total_price, 0.01)).toBe(true);
      expect(orderDetailSummary.shipping_fee).toEqual(cartSummary.shipping_value);
      expect(isEqual(Number(orderDetailSummary.discount), cartSummary.discount_value, 0.01)).toBe(true);
      expect(isEqual(orderDetailSummary.tax_amount, cartSummary.taxes, 0.01)).toBe(true);
      expect(isEqual(orderDetailSummary.tip, cartSummary.tipping_value, 0.01)).toBe(true);
    });

    await test.step(`
      Tại order detail của order:
      - Mở F12 > Network 
      - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization
      - Lấy ra Transaction ID
      Lên Paypal sanbox dashboard của MC
      - Search transactions theo các transaction_ids`, async () => {
      // Get transaction id then get order info in paypal
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);
      const transactionId = await orderApi.getTransactionIdInOrderJson(orderSummaryInfo.orderId);
      const orderInfo = await orderApi.getOrdAuthorizedInfoInPaypal({
        id: paypalAccount.id,
        secretKey: paypalAccount.secret_key,
        transactionId: transactionId,
      });
      expect(isEqual(orderInfo.total_amount, cartSummary.total_price, 0.01)).toBe(true);
      expect(orderInfo.order_status).toEqual("CREATED");
    });

    await test.step(`Quay lại storefront > thankyou page của order vừa tạo- Add product PPC vào cart`, async () => {
      // Add PPC:
      await checkoutPage.addProductPostPurchase(productPPC);

      // Get PPC value on paypal
      cartPPCSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(page);
      await checkoutPage.page.click(popupPage.xpathPPIconClose);

      // Verify PPC value
      expect(cartPPCSummary.subtotal).not.toBe(0.0);
      expect(cartPPCSummary.shipping_value).not.toBe(0.0);
      expect(cartPPCSummary.total_price).not.toBe(0.0);
    });

    await test.step(`- Buyer nhấn confirm order trên popup`, async () => {
      await checkoutPage.completePaymentForPostPurchaseItem(PaymentMethod.PAYPAL);

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(isEqual(orderSummaryInfo.totalSF, cartSummary.total_price + cartPPCSummary.total_price, 0.01)).toBe(true);
    });

    await test.step(`- Login vào Dashboard- Vào Order detail của order vừa tạo`, async () => {
      // fill your code here
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      const orderDetailSummary = await orderPage.getOrderSummaryShopBaseInOrderDetail();
      expect(isEqual(orderDetailSummary.total, orderSummaryInfo.totalSF, 0.01)).toBe(true);
    });
  });

  test(`@SB_CHE_NEW_EF_Pr_767 [Plusbase][Theme ver 2][Product page] Checkout thành công qua Buy with Paypal có add PPC`, async ({
    conf,
    page,
    authRequest,
    authRequestWithExchangeToken,
    dashboard,
  }) => {
    domain = conf.suiteConf.domain;
    paypalAccount = conf.suiteConf.paypal_account;

    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    orderApi = new OrderAPI(domain, authRequest);
    homePage = new SFHome(page, domain);

    productCheckout = conf.caseConf.products_checkout;
    productPPC = conf.caseConf.product_ppc;

    // Set time out for test case
    test.setTimeout(400000);

    await test.step(`Mở tab product page > Click button Buy with Paypal > Login vào account Paypal `, async () => {
      // Tạo checkout
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(productCheckout[0].name);
      await checkoutPage.page.waitForLoadState();
      const expressPopup = await checkoutPage.clickButtonExpressAndLoginToPP();

      // Get cart summary
      cartSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(expressPopup);

      popupPage = new SFCheckout(expressPopup, domain);
      await popupPage.page.click(popupPage.xpathPPIconClose);

      // Expected: Popup có thông tin order summary và shipping method
      await expect(popupPage.page.locator(popupPage.xpathPPShippingMethodSelector)).toBeVisible();
      expect(cartSummary.subtotal).not.toBe(0.0);
      expect(cartSummary.shipping_value).not.toBe(0.0);
      expect(cartSummary.total_price).not.toBe(0.0);
    });

    await test.step(`- Buyer nhấn confirm order trên popup`, async () => {
      await popupPage.page.click(popupPage.xpathSubmitBtnOnPaypal);
      await popupPage.page.waitForEvent("close");

      // Expected: - Popup đóng lại, Hiện trang thankyou
      await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toBeVisible();
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();

      // Expected: - Hiển thị thông tin order summary giống với trên popup
      expect(isEqual(orderSummaryInfo.subTotal, cartSummary.subtotal, 0.01)).toBe(true);
      expect(isEqual(orderSummaryInfo.totalSF, cartSummary.total_price, 0.01)).toBe(true);
      expect(Number(orderSummaryInfo.shippingSF)).toEqual(cartSummary.shipping_value);
      expect(isEqual(Number(orderSummaryInfo.discountValue), cartSummary.discount_value, 0.01)).toBe(true);
      expect(isEqual(orderSummaryInfo.taxValue, cartSummary.taxes, 0.01)).toBe(true);
      expect(isEqual(orderSummaryInfo.tippingValue, cartSummary.tipping_value, 0.01)).toBe(true);
    });

    await test.step(`- Login vào Dashboard- Vào Order detail của order vừa tạo`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      // verify order amount
      const orderDetailSummary = await orderPage.getOrderSummaryShopBaseInOrderDetail();
      expect(isEqual(orderDetailSummary.subtotal, cartSummary.subtotal, 0.01)).toBe(true);
      expect(isEqual(orderDetailSummary.total, cartSummary.total_price, 0.01)).toBe(true);
      expect(orderDetailSummary.shipping_fee).toEqual(cartSummary.shipping_value);
      expect(isEqual(Number(orderDetailSummary.discount), cartSummary.discount_value, 0.01)).toBe(true);
      expect(isEqual(orderDetailSummary.tax_amount, cartSummary.taxes, 0.01)).toBe(true);
      expect(isEqual(orderDetailSummary.tip, cartSummary.tipping_value, 0.01)).toBe(true);
    });

    await test.step(`
      Tại order detail của order:
      - Mở F12 > Network 
      - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization
      - Lấy ra Transaction ID
      Lên Paypal sanbox dashboard của MC
      - Search transactions theo các transaction_ids`, async () => {
      // Get transaction id then get order info in paypal
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);
      const transactionId = await orderApi.getTransactionIdInOrderJson(orderSummaryInfo.orderId);
      const orderInfo = await orderApi.getOrdAuthorizedInfoInPaypal({
        id: paypalAccount.id,
        secretKey: paypalAccount.secret_key,
        transactionId: transactionId,
      });
      expect(isEqual(orderInfo.total_amount, cartSummary.total_price, 0.01)).toBe(true);
      expect(orderInfo.order_status).toEqual("CREATED");
    });

    await test.step(`Quay lại storefront > thankyou page của order vừa tạo- Add product PPC vào cart`, async () => {
      // Add PPC:
      ppcValue = await checkoutPage.addProductPostPurchase(productPPC);

      // Get PPC value on paypal
      cartPPCSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(page);
      await checkoutPage.page.click(popupPage.xpathPPIconClose);

      // Verify PPC value
      expect(isEqual(cartPPCSummary.subtotal, Number(ppcValue), 0.01)).toBe(true);
    });

    await test.step(`- Buyer nhấn confirm order trên popup`, async () => {
      await checkoutPage.completePaymentForPostPurchaseItem(PaymentMethod.PAYPAL);

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(isEqual(orderSummaryInfo.totalSF, cartSummary.total_price + cartPPCSummary.total_price, 0.01)).toBe(true);
    });

    await test.step(`- Login vào Dashboard- Vào Order detail của order vừa tạo`, async () => {
      // Go to order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);

      // verify order amount
      const orderDetailSummary = await orderPage.getOrderSummaryShopBaseInOrderDetail();
      expect(isEqual(orderDetailSummary.subtotal, cartSummary.subtotal + cartPPCSummary.subtotal, 0.01)).toBe(true);
      expect(isEqual(orderDetailSummary.total, cartSummary.total_price + cartPPCSummary.total_price, 0.01)).toBe(true);
      expect(orderDetailSummary.shipping_fee).toEqual(cartSummary.shipping_value + cartPPCSummary.shipping_value);
    });
  });
});
