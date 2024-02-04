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
import { HomePageV3 } from "@pages/new_ecom/storefront/home_page_sf";

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
  let homePage: HomePageV3;
  let scheduleTime: number;
  let isSchedule: boolean;
  let orderApi: OrderAPI;
  // let homePage: SFHome;
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
    productPage = new SFProduct(page, domain);
    homePage = new HomePageV3(page, domain);

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

  test(`@SB_CHE_NEW_EF_04 [Sbase]-[Desktop]-[Theme New-Ecom] Check out với Paypal express và kiểm tra order detail trên dashboard và trên cổng, setting 3 steps checkout`, async ({
    scheduler,
    authRequestWithExchangeToken,
  }) => {
    // Set time out for test case
    test.setTimeout(400000);

    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as CaptureScheduleData;
      isSchedule = true;
    } else {
      scheduleData = {
        orderId: 0,
        orderName: "",
        totalOrderSF: 0,
        checkoutToken: "",
      };
    }

    await test.step(`
      - Lên storefront của shop
      - Add to cart: Bikini 
      - Di chuyển đến trang checkout
      - Click button Paypal express trên đầu trang
      - Login vào Paypal account`, async () => {
      if (isSchedule) {
        return;
      }
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
      if (isSchedule) {
        return;
      }
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
      if (isSchedule) {
        return;
      }

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
      Lên Paypal sanbox dashboard của MC- Search transactions theo các transaction_ids`, async () => {
      if (isSchedule) {
        return;
      }

      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);

      // Get transaction id then get order info in paypal
      const transactionId = await orderApi.getTransactionIdInOrderJson(orderSummaryInfo.orderId);
      const orderInfo = await orderApi.getOrdAuthorizedInfoInPaypal({
        id: paypalAccount.id,
        secretKey: paypalAccount.secret_key,
        transactionId: transactionId,
      });
      expect(isEqual(orderInfo.total_amount, cartSummary.total_price, 0.01)).toBe(true);
      expect(orderInfo.order_status).toEqual("CREATED");

      scheduleData.orderId = orderSummaryInfo.orderId;
      scheduleData.orderName = orderSummaryInfo.orderName;
      scheduleData.totalOrderSF = orderSummaryInfo.totalSF;
      scheduleData.checkoutToken = orderSummaryInfo.checkoutToken;
      await scheduler.setData(scheduleData);
      await scheduler.schedule({ mode: "later", minutes: scheduleTime });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    });

    await test.step(`Sau thời gian 10p để order capture Quay lại storefront > thankyou page của order vừa tạo`, async () => {
      if (isSchedule) {
        orderSummaryInfo = {
          orderId: scheduleData.orderId,
          orderName: scheduleData.orderName,
          totalSF: scheduleData.totalOrderSF,
          checkoutToken: scheduleData.checkoutToken,
        };
      }
      // Clear schedule data
      if (isSchedule) {
        await scheduler.clear();
      }
      // Open order page
      await checkoutPage.openOrderStatusPageByToken(orderSummaryInfo.checkoutToken);
      await checkoutPage.loginToOrderPage(customerInfo.email, orderSummaryInfo.orderName);

      // Expected: Field discount code không hiển thị
      await expect(checkoutPage.page.locator(checkoutPage.xpathDiscountField)).toBeHidden();
    });

    await test.step(`- Login vào Dashboard- Vào Order detail của order vừa tạo`, async () => {
      // Go to order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      const orderStatus = await orderPage.reloadUntilOrdCapture("", 10);
      const paidByCustomer = await orderPage.getPaidByCustomer();

      // Verify order status and paid by customer
      expect(orderStatus).toEqual("Paid");
      expect(isEqual(Number(removeCurrencySymbol(paidByCustomer)), orderSummaryInfo.totalSF, 0.01)).toBe(true);

      // Verify order timeline
      const orderTimeline = orderPage.generateOrdTimeline(customerInfo, {
        total_amount: orderSummaryInfo.totalSF.toString(),
        payment_gateway: PaymentMethod.PAYPAL,
      });
      const orderTimelineSendingEmail = orderTimeline.timelineSendEmail;
      const orderTimelineCustomerPlaceOrder = orderTimeline.timelinePlaceOrd;
      const orderTimelinePaymentProcessed = orderTimeline.timelinePaymentProcessed;
      const orderTimelineTransID = orderTimeline.timelineTransId;

      await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
    });

    await test.step(`
      - Tại order timeline: lấy ra transaction id
      - Lên Paypal sanbox dashboard của MC
      - Search transactions theo các transaction_ids`, async () => {
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);
      // Get transactions id in order detail
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

  test(`@SB_CHE_NEW_EF_07 [Sbase]-[Desktop]-[Theme New-Ecom] Check out với Paypal express và kiểm tra order detail trên dashboard và trên cổng, order có PPC, setting 1 page checkout`, async ({
    page,
    authRequestWithExchangeToken,
  }) => {
    // Set time out for test case
    test.setTimeout(400000);

    await test.step(`
      - Lên storefront của shop
      - Add to cart: Bikini 
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
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);
      // Get transaction id then get order info in paypal
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
      expect(orderSummaryInfo.totalSF).toBe(cartSummary.total_price + cartPPCSummary.total_price);
    });

    await test.step(`- Login vào Dashboard- Vào Order detail của order vừa tạo`, async () => {
      // Go to order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      const orderStatus = await orderPage.reloadUntilOrdCapture("", 10);
      const paidByCustomer = await orderPage.getPaidByCustomer();

      // Verify order status and paid by customer
      expect(orderStatus).toEqual("Paid");
      expect(isEqual(Number(removeCurrencySymbol(paidByCustomer)), orderSummaryInfo.totalSF, 0.01)).toBe(true);

      // Verify order timeline
      const orderTimeline = orderPage.generateOrdTimeline(customerInfo, {
        total_amount: (cartSummary.total_price + cartPPCSummary.total_price).toString(),
        payment_gateway: PaymentMethod.PAYPAL,
        item_post_purchase_value: cartPPCSummary.total_price.toString(),
      });
      const orderTimelineSendingEmail = orderTimeline.timelineSendEmail;
      const orderTimelineCustomerPlaceOrder = orderTimeline.timelinePlaceOrd;
      const orderTimelinePaymentProcessed = orderTimeline.timelinePaymentProcessed;
      const orderTimeLinePaymentProcessedItemPPC = orderTimeline.timelinePaymentProcessedPPC;
      const orderTimelineTransID = orderTimeline.timelineTransId;

      await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineTransID)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimeLinePaymentProcessedItemPPC)).toBeVisible();
      await expect(await orderPage.orderTimeLines(orderTimelineTransID, true, PaymentMethod.PAYPAL)).toBeVisible();
    });

    await test.step(`
      - Tại order timeline: lấy ra transaction id
      - Lên Paypal sanbox dashboard của MC
      - Search transactions theo các transaction_ids`, async () => {
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);
      // Get transactions id in order detail
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

  test(`@SB_CHE_NEW_EF_14 [Sbase]-[Desktop]-[Theme New-Ecom] Kiểm tra order có item PPC qua luồng express checkout có thỏa mãn tax`, async ({
    authRequestWithExchangeToken,
  }) => {
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

      cartSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(expressPopup);

      popupPage = new SFCheckout(expressPopup, domain);
      await popupPage.page.click(popupPage.xpathPPIconClose);

      // Expected: Popup có thông tin order summary và shipping method
      await expect(popupPage.page.locator(popupPage.xpathPPShippingMethodSelector)).toBeVisible();
      expect(isEqual(cartSummary.taxes, expectTaxAmt, 0.01)).toBe(true);
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
    });

    await test.step(`- Add product PPC vào cart`, async () => {
      // Add PPC:
      ppcValue = await checkoutPage.addProductPostPurchase(productPPC);
      expectTaxAmt = calculateTax(productCheckout[0].tax_info, ppcValue);

      // Get PPC value on paypal
      cartPPCSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp();
      await checkoutPage.page.click(popupPage.xpathPPIconClose);

      // Verify PPC value
      expect(isEqual(cartPPCSummary.total_price, Number(ppcValue) + expectTaxAmt, 0.01)).toBe(true);
      expect(cartPPCSummary.taxes).not.toBe(0.0);
    });

    await test.step(`- Buyer nhấn confirm order trên popup`, async () => {
      await checkoutPage.completePaymentForPostPurchaseItem(PaymentMethod.PAYPAL);

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(isEqual(orderSummaryInfo.totalSF, cartSummary.total_price + Number(ppcValue) + expectTaxAmt, 0.01)).toBe(
        true,
      );
      expect(isEqual(orderSummaryInfo.taxValue, cartSummary.taxes + cartPPCSummary.taxes, 0.01)).toBe(true);
    });

    await test.step(`
      - Login vào Dashboard
      - Vào Order detail của order vừa tạo
      - Kiẻm tra order status
      - Kiểm tra total order
      - Kiểm tra order timeline`, async () => {
      // Go to order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.reloadUntilOrdCapture("", 10);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const taxAmount = await orderPage.getTax();

      // Verify order status and paid by customer
      expect(isEqual(Number(removeCurrencySymbol(taxAmount)), orderSummaryInfo.taxValue, 0.01)).toBe(true);
      expect(isEqual(Number(removeCurrencySymbol(paidByCustomer)), orderSummaryInfo.totalSF, 0.01)).toBe(true);
    });

    await test.step(`
      Tại order detail của order > Lấy ra transaction ID 
      - Mở F12 > Network 
      - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction ID
      Lên Paypal sanbox dashboard của MC
      - Search transactions theo các transaction_ids`, async () => {
      // Get transactions id in order detail
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

  test(`@SB_CHE_NEW_EF_39 [Sbase]-[Desktop]-[Theme New-Ecom] Check out order qua express payment có sử dụng global market và được Paypal support, Order có add thêm PPC`, async ({
    page,
    authRequestWithExchangeToken,
  }) => {
    await test.step(`
      - Lên storefront của shop
      - Add to cart: Bikini 
      - Di chuyển đến trang checkout
      - Click button Paypal express trên đầu trang
      - Login vào Paypal account`, async () => {
      // Tạo checkout
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);

      // select global market
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyNE(shippingAddress.currency);

      // open checkout page
      await checkoutAPI.openCheckoutPageByToken();

      const expressPopup = await checkoutPage.clickButtonExpressAndLoginToPP();

      // Get cart summary
      cartSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(expressPopup);

      popupPage = new SFCheckout(expressPopup, domain);
      await popupPage.page.click(popupPage.xpathPPIconClose);

      // Expected: Currrency của order summary = currency của storefront
      const cartAmount = await popupPage.getTextContent(popupPage.xpathCartSummaryOnPP);
      expect(cartAmount).toContain("€");
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
      expect(isEqual(orderSummaryInfo.taxValue, cartSummary.taxes, 0.01)).toBe(true);
      expect(isEqual(orderSummaryInfo.tippingValue, cartSummary.tipping_value, 0.01)).toBe(true);
    });

    await test.step(`- Tại popup ppc > add thêm Item PPC vào order`, async () => {
      // Add PPC:
      await checkoutPage.addProductPostPurchase(productPPC[0].name);

      // Get PPC value on paypal
      cartPPCSummary = await checkoutPage.getOrderSummaryOnPaypalPopUp(page);
      await checkoutPage.page.click(popupPage.xpathPPIconClose);

      // Expected: Currrency của order summary = currency của storefront
      const cartAmount = await checkoutPage.getTextContent(popupPage.xpathCartSummaryOnPP);
      expect(cartAmount).toContain("€");
    });

    await test.step(`- Buyer nhấn confirm order trên popup`, async () => {
      await checkoutPage.completePaymentForPostPurchaseItem(PaymentMethod.PAYPAL);

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(isEqual(orderSummaryInfo.totalSF, cartSummary.total_price + cartPPCSummary.total_price, 0.01)).toBe(true);
    });

    await test.step(`
      - Login vào Dashboard
      - Vào Order detail của order vừa tạo
      - Kiẻm tra order status
      - Kiểm tra total order
      - Kiểm tra order timeline`, async () => {
      // Go to order detail
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.reloadUntilOrdCapture("", 10);
      await orderPage.switchCurrency();
      const paidByCustomer = await orderPage.getPaidByCustomer();

      // Verify paid by customer
      expect(isEqual(Number(removeCurrencySymbol(paidByCustomer)), orderSummaryInfo.totalSF, 0.01)).toBe(true);
    });

    await test.step(`
      Tại order detail của order > Lấy ra transaction ID 
      - Mở F12 > Network 
      - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction ID
      Lên Paypal sanbox dashboard của MC
      - Search transactions theo các transaction_ids`, async () => {
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);

      // Get transactions id in order detail
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

  test(`@SB_CHE_NEW_EF_Pr_769 [Shopbase][Theme NE][Product page] Checkout thành công qua Buy with Paypal có add PPC`, async ({
    page,
    authRequestWithExchangeToken,
  }) => {
    await test.step(`Mở tab product page > Click button Buy with Paypal > Login vào account Paypal `, async () => {
      await homePage.gotoHomePage();
      await homePage.searchProduct(productCheckout[0].name);
      await homePage.clickProductCardName(productCheckout[0].name);
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
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);

      // Get transaction id then get order info in paypal
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
      const orderStatus = await orderPage.reloadUntilOrdCapture("", 10);
      const paidByCustomer = await orderPage.getPaidByCustomer();

      // Verify order status and paid by customer
      expect(orderStatus).toEqual("Paid");
      expect(isEqual(Number(removeCurrencySymbol(paidByCustomer)), orderSummaryInfo.totalSF, 0.01)).toBe(true);
    });

    await test.step(`- Tại order timeline: lấy ra transaction id- Lên Paypal sanbox dashboard của MC- Search transactions theo các transaction_ids`, async () => {
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);

      // Get transactions id in order detail
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

  test(`@SB_CHE_NEW_EF_Ca_229 [Shopbase][Theme NE][Cart page] Kiểm tra checkout thành công qua Paypal có sử dụng Payment shield`, async ({
    authRequestWithExchangeToken,
  }) => {
    await test.step(`- Mở tab Cart page > Click button Buy with Paypal- Login vào Paypal account`, async () => {
      await homePage.gotoHomePage();
      await homePage.searchProduct(productCheckout[0].name);
      await homePage.clickProductCardName(productCheckout[0].name);
      await productPage.addToCart();

      // Tạo checkout
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

    await test.step(`Tại dashboard > Order > Chọn order vừa tạo`, async () => {
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

    await test.step(`Tại order detail của order > Lấy ra transaction ID - Mở F12 > Network - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction IDLên Paypal sanbox dashboard của MC- Search transactions theo các transaction_ids`, async () => {
      const requestObj = await authRequestWithExchangeToken.changeToken();
      orderApi = new OrderAPI(domain, requestObj);

      // Get transaction id then get order info in paypal
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
});
