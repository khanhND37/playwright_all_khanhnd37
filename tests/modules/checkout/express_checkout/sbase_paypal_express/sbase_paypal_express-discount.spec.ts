/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import type { DiscountAPI, OrderAfterCheckoutInfo, PaypalOrderSummary, Product, ShippingAddress } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { calculateTax, isEqual } from "@core/utils/checkout";
import { OrderAPI } from "@pages/api/order";
import { CaptureScheduleData } from "../../refactor_manual_capture/capture";
import { DashboardAPI } from "@pages/api/dashboard";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";

test.describe("Checkout express", () => {
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let cartPPCSummary: PaypalOrderSummary;
  let scheduleData: CaptureScheduleData;
  let shippingAddress: ShippingAddress;
  let cartSummary: PaypalOrderSummary;
  let customerInfo: ShippingAddress;
  let discountUpdate: DiscountAPI;
  let discountReset: DiscountAPI;
  let dashboardAPI: DashboardAPI;
  let productCheckout: Product[];
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let productPage: SFProduct;
  let popupPage: SFCheckout;
  let orderPage: OrdersPage;
  let scheduleTime: number;
  let isSchedule: boolean;
  let orderApi: OrderAPI;
  let homePage: SFHome;
  let domain: string;
  let manualDiscount;
  let paypalAccount;
  let errorMessage;
  let expectTaxAmt;
  let productPPC;
  let ppcValue;

  test.beforeEach(async ({ conf, page, dashboard, authRequest }) => {
    domain = conf.suiteConf.domain;
    scheduleTime = conf.suiteConf.schedule_time;
    paypalAccount = conf.suiteConf.paypal_account;
    discountReset = conf.suiteConf.discount_reset;
    customerInfo = conf.suiteConf.shipping_address;
    manualDiscount = conf.caseConf.manual_discount;
    shippingAddress = conf.caseConf.new_shipping_address;

    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);
    orderApi = new OrderAPI(domain, authRequest);
    checkoutPage = new SFCheckout(page, domain);
    homePage = new SFHome(page, domain);

    productCheckout = conf.caseConf.products_checkout;
    discountUpdate = conf.caseConf.discount;
    productPPC = conf.caseConf.product_ppc;

    const disableDiscountAt = new Date();

    const autoDiscountInfo = await dashboardAPI.getDiscountByTitle(discountReset);
    const isDiscountAutoEnabled = autoDiscountInfo.status;
    if (isDiscountAutoEnabled === "active") {
      discountReset.ends_at = disableDiscountAt.toISOString();
      await dashboardAPI.updateDiscountInfo(discountReset);
    }
    // Set time out for test case
    test.setTimeout(400000);
  });

  test(`@SB_CHE_NEW_EF_16 [Sbase]-[Desktop]-[Theme New-Ecom] Kiểm tra order có khi apply discount qua luồng express checkout vẫn thỏa mãn tax`, async () => {
    // Update discount
    await dashboardAPI.updateDiscountInfo(discountUpdate);

    await test.step(`
      - Lên storefront của shop
      - Add to cart: Bikini 
      - Di chuyển đến trang checkout
      - Click button Paypal express trên đầu trang
      - Login vào Paypal account`, async () => {
      // Tạo checkout
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();

      const expressPopup = await checkoutPage.clickButtonExpressAndLoginToPP();
      // Caculate expected tax
      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productCheckout);

      // Get cart summary
      cartSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(expressPopup);

      popupPage = new SFCheckout(expressPopup, domain);
      await popupPage.page.click(popupPage.xpathPPIconClose);

      // Expected: Tax amount + Discount amount correct
      expect(isEqual(cartSummary.taxes, expectTaxAmt, 0.01)).toBe(true);
      expect(isEqual(cartSummary.discount_value, (cartSummary.subtotal * discountUpdate.value) / 100, 0.01)).toBe(true);
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
    });

    await test.step(`
      - Login vào Dashboard
      - Vào Order detail của order vừa tạo
      - Kiẻm tra order status
      - Kiểm tra total order
      - Kiểm tra order timeline`, async () => {
      // Go to order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      const discountAmt = await orderPage.getDiscountVal();
      const taxAmount = await orderPage.getTax();

      // Verify tax amount and discount amount
      expect(isEqual(Number(removeCurrencySymbol(taxAmount)), orderSummaryInfo.taxValue, 0.01)).toBe(true);
      expect(Number(removeCurrencySymbol(discountAmt))).toBe(Number(orderSummaryInfo.discountValue));
    });
  });

  test(`@SB_CHE_NEW_EF_19 [Sbase]-[Desktop]-[Theme New-Ecom] Kiểm tra order qua luồng express checkout có thỏa mãn automatic discount : free shipping`, async ({
    authRequestWithExchangeToken,
  }) => {
    // Update discount
    await dashboardAPI.updateDiscountInfo(discountUpdate);

    await test.step(`
      - Lên storefront của shop
      - Add to cart: Bikini, Post Purchase
      - Di chuyển đến trang checkout
      - Click button Paypal express trên đầu trang
      - Login vào Paypal account`, async () => {
      // Tạo checkout
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();

      const expressPopup = await checkoutPage.clickButtonExpressAndLoginToPP();

      // Get cart summary
      cartSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(expressPopup);

      popupPage = new SFCheckout(expressPopup, domain);
      await popupPage.page.click(popupPage.xpathPPIconClose);

      // Expected: Tax amount + Discount amount correct
      expect(isEqual(cartSummary.shipping_value, Math.abs(cartSummary.shipping_discount), 0.01)).toBe(true);
    });

    await test.step(`- Buyer nhấn confirm order trên popup`, async () => {
      await popupPage.page.click(popupPage.xpathSubmitBtnOnPaypal);
      await popupPage.page.waitForEvent("close");

      // Expected: - Popup đóng lại, Hiện trang thankyou
      await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toBeVisible();
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      const discountAmt = await checkoutPage.getDiscountValOnOrderSummary();

      // Expected: - Hiển thị thông tin order summary giống với trên popup
      expect(isEqual(orderSummaryInfo.subTotal, cartSummary.subtotal, 0.01)).toBe(true);
      expect(isEqual(orderSummaryInfo.totalSF, cartSummary.total_price, 0.01)).toBe(true);
      expect(orderSummaryInfo.shippingSF).toEqual("Free");
      expect(discountAmt).toEqual("Free shipping");
      expect(isEqual(orderSummaryInfo.taxValue, cartSummary.taxes, 0.01)).toBe(true);
    });

    await test.step(`
      - Login vào Dashboard
      - Vào Order detail của order vừa tạo
      - Kiẻm tra order status
      - Kiểm tra total order
      - Kiểm tra order timeline`, async () => {
      // Go to order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      const discountAmt = await orderPage.getDiscountVal();

      // Verify discount ammount
      expect(Number(removeCurrencySymbol(discountAmt))).toBe(cartSummary.shipping_discount);
    });

    await test.step(`
      Tại order detail của order > Lấy ra transaction ID 
      - Mở F12 > Network 
      - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction ID
      Lên Paypal sanbox dashboard của MC
      - Search transactions theo các transaction_ids`, async () => {
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
  });

  test(`@SB_CHE_NEW_EF_24 [Sbase]-[Desktop]-[Theme New-Ecom] Kiểm tra order qua luồng express checkout có thỏa mãn manual discount : Buy x get y`, async ({
    authRequestWithExchangeToken,
  }) => {
    await test.step(`
      - Lên storefront của shop
      - Add to cart: Bikini > 3, Post Purchase > 1
      - Di chuyển đến trang checkout
      - Click button Paypal express trên đầu trang-
      Login vào Paypal account
      - Buyer nhấn confirm order trên popup`, async () => {
      // Tạo checkout
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();

      const expressPopup = await checkoutPage.clickButtonExpressAndLoginToPP();

      // Get cart summary
      cartSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(expressPopup);

      popupPage = new SFCheckout(expressPopup, domain);
      await popupPage.page.click(popupPage.xpathPPIconClose);

      await popupPage.page.click(popupPage.xpathSubmitBtnOnPaypal);
      await popupPage.page.waitForEvent("close");

      // Expected: - Popup đóng lại, Hiện trang thankyou
      await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toBeVisible();
    });

    await test.step(`- Tại Block discount: Nhập discount: `, async () => {
      await checkoutPage.applyDiscountCode(discountUpdate.title);
      const itemPrice = (await checkoutAPI.getItemPriceByID(discountUpdate.customer_get_variants[0])).item_price;
      const expectDiscountAmt = (itemPrice * Math.abs(discountUpdate.value)) / 100;
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(Math.abs(Number(orderSummaryInfo.discountValue))).toBe(expectDiscountAmt);
    });

    await test.step(`
      - Login vào Dashboard
      - Vào Order detail của order vừa tạo
      - Kiẻm tra order status
      - Kiểm tra total order
      - Kiểm tra order timeline`, async () => {
      // Go to order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      const orderStatus = await orderPage.reloadUntilOrdCapture("", 10);

      // Verify order status and paid by customer
      expect(orderStatus).toEqual("Paid");

      const discountAmt = await orderPage.getDiscountVal();
      const totalOrder = await orderPage.getTotalOrder();

      // Verify discount ammount
      expect(Number(removeCurrencySymbol(discountAmt))).toBe(Number(orderSummaryInfo.discountValue));
      expect(Number(removeCurrencySymbol(totalOrder))).toBe(orderSummaryInfo.totalSF);
    });

    await test.step(`
      Tại order detail của order > Lấy ra transaction ID 
      - Mở F12 > Network 
      - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction ID
      Lên Paypal sanbox dashboard của MC
      - Search transactions theo các transaction_ids`, async () => {
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);

      const listTransaction = await orderApi.getListTransactionId(orderSummaryInfo.orderId);

      // Get total order info in paypal
      const orderInfo = await orderApi.getTotalOrderInfoInPaypal(
        {
          id: paypalAccount.id,
          secret_key: paypalAccount.secret_key,
        },
        listTransaction,
      );

      // Expected: - total amount transactions equal total amount order
      expect(isEqual(orderInfo.total, orderSummaryInfo.totalSF, 0.01)).toBe(true);
    });
  });

  test(`@SB_CHE_NEW_EF_25 [Sbase]-[Desktop]-[Theme New-Ecom] Kiểm tra order có khi apply manual discount qua luồng express checkout không thỏa mãn tax item`, async () => {
    await test.step(`
      - Lên storefront của shop
      - Add to cart: Bikini 
      - Di chuyển đến trang checkout
      - Click button Paypal express trên đầu trang
      - Login vào Paypal account
      - Buyer nhấn confirm order trên popup`, async () => {
      // Tạo checkout
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();

      const expressPopup = await checkoutPage.clickButtonExpressAndLoginToPP();
      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productCheckout);

      // Get cart summary
      cartSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(expressPopup);

      // Expected: Tax amount correct
      expect(isEqual(cartSummary.taxes, expectTaxAmt, 0.01)).toBe(true);

      popupPage = new SFCheckout(expressPopup, domain);
      await popupPage.page.click(popupPage.xpathPPIconClose);

      await popupPage.page.click(popupPage.xpathSubmitBtnOnPaypal);
      await popupPage.page.waitForEvent("close");

      // Expected: - Popup đóng lại, Hiện trang thankyou
      await expect(checkoutPage.page.locator(checkoutPage.xpathThankYou)).toBeVisible();
    });

    await test.step(`- Buyer nhập discount code`, async () => {
      // Apply discount
      await checkoutPage.applyDiscountCode(discountUpdate.title);
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();

      // Verify discount amount and tax amount after apply discount
      expect(Math.abs(Number(orderSummaryInfo.discountValue))).toBe(Math.abs(discountUpdate.value));
      expect(orderSummaryInfo.taxValue).toBe(0.0);
    });

    await test.step(`
      - Login vào Dashboard
      - Vào Order detail của order vừa tạo
      - Kiểm tra order status
      - Kiểm tra total order
      - Kiểm tra order timeline`, async () => {
      // Go to order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);

      const [taxAmount, discountAmt, totalOrder] = await Promise.all([
        orderPage.getTax(),
        orderPage.getDiscountVal(),
        orderPage.getTotalOrder(),
      ]);

      // Verify discount ammount
      expect(Number(removeCurrencySymbol(discountAmt))).toBe(Number(orderSummaryInfo.discountValue));
      expect(Number(removeCurrencySymbol(taxAmount))).toBe(orderSummaryInfo.taxValue);
      expect(Number(removeCurrencySymbol(totalOrder))).toBe(orderSummaryInfo.totalSF);
    });
  });
  test(`@SB_CHE_NEW_EF_28 [Sbase]-[Desktop]-[Theme Roller] Kiểm tra vẫn apply discount manual thành công khi order đã được apply automatic discount`, async () => {
    // Update discount
    await dashboardAPI.updateDiscountInfo(discountUpdate);

    await test.step(`
      - Lên storefront của shop
      - Add to cart: Bikini, Post Purchase
      - Di chuyển đến trang checkout
      - Click button Paypal express trên đầu trang
      - Login vào Paypal account`, async () => {
      // Tạo checkout
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.openCheckoutPageByToken();

      const expressPopup = await checkoutPage.clickButtonExpressAndLoginToPP();

      // Get cart summary
      cartSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(expressPopup);

      popupPage = new SFCheckout(expressPopup, domain);
      await popupPage.page.click(popupPage.xpathPPIconClose);

      // Expected: Tax amount + Discount amount correct
      expect(isEqual(cartSummary.discount_value, (cartSummary.subtotal * discountUpdate.value) / 100, 0.01)).toBe(true);
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
    });

    await test.step(`- Tại Block discount: Nhập discount có giá trị nhỏ hơn giá trị discount automatic: `, async () => {
      await checkoutPage.enterAndApplyDiscount(manualDiscount.lower_price.title);
      errorMessage = await checkoutPage.isWaringMessDiscountDisplayed(manualDiscount.lower_price.message);
      expect(errorMessage).toBe(true);
    });

    await test.step(`- Tại Block discount: Nhập discount not exist`, async () => {
      await checkoutPage.enterAndApplyDiscount(manualDiscount.not_exist.title);
      errorMessage = await checkoutPage.isWaringMessDiscountDisplayed(manualDiscount.not_exist.message);
      expect(errorMessage).toBe(true);
    });

    await test.step(`- Tại Block discount: Nhập discount không thỏa mãn`, async () => {
      await checkoutPage.enterAndApplyDiscount(manualDiscount.invalid.title);
      errorMessage = await checkoutPage.isWaringMessDiscountDisplayed(manualDiscount.invalid.message);
      expect(errorMessage).toBe(true);
    });

    await test.step(`- Tại Block discount: Nhập discount: `, async () => {
      // Apply discount
      await checkoutPage.applyDiscountCode(manualDiscount.valid.title);
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();

      // Verify discount amount and tax amount after apply discount
      expect(Math.abs(Number(orderSummaryInfo.discountValue))).toBe(Math.abs(manualDiscount.valid.value));
    });

    await test.step(`
      - Login vào Dashboard
      - Vào Order detail của order vừa tạo
      - Kiẻm tra order status
      - Kiểm tra total order`, async () => {
      // Go to order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);

      const [discountAmt, totalOrder] = await Promise.all([orderPage.getDiscountVal(), orderPage.getTotalOrder()]);

      // Verify discount ammount
      expect(Number(removeCurrencySymbol(discountAmt))).toBe(Number(orderSummaryInfo.discountValue));
      expect(Number(removeCurrencySymbol(totalOrder))).toBe(orderSummaryInfo.totalSF);
    });
  });
});
