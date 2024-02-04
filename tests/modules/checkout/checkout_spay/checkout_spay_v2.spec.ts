import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { OrderAPI } from "@pages/api/order";
import { removeCurrencySymbol } from "@core/utils/string";
import { SbCheckoutSpayScheduleData } from "./checkout_spay_v2";

test.describe("Checkout flow with Spay", () => {
  let checkout: SFCheckout;
  let orderAPI: OrderAPI;
  let themeSetting: SettingThemeAPI;
  let tokenShop: string;
  let isSchedule;
  let scheduleData: SbCheckoutSpayScheduleData;

  test.beforeEach(async ({ conf, theme, authRequest, page, token, scheduler }) => {
    checkout = new SFCheckout(page, conf.suiteConf.domain);
    orderAPI = new OrderAPI(conf.suiteConf.domain, authRequest);
    themeSetting = new SettingThemeAPI(theme);
    tokenShop = (
      await token.getWithCredentials({
        domain: conf.suiteConf.shop_name,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      })
    ).access_token;

    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as SbCheckoutSpayScheduleData;
      isSchedule = true;
    }
  });

  test(`Check checkout via spay successfully in 1 pages checkout, go to Stripe dashboard to check corresponding transaction @SB_CHE_SPAY_9`, async ({
    conf,
    scheduler,
  }) => {
    let orderId: number;
    let totalOrderSF: string;
    if (isSchedule) {
      orderId = scheduleData.orderId;
      totalOrderSF = scheduleData.totalOrderSF;
    } else {
      await themeSetting.editCheckoutLayout("one-page");
      await checkout.addProductToCartThenInputShippingAddress(conf.caseConf.product, conf.suiteConf.shipping_address);
      await checkout.completeOrderWithMethod("Shopbase payment");
      await checkout.btnClosePPCPopup.click();
      orderId = await checkout.getOrderIdBySDK();
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      await expect(checkout.thankyouPageLoc).toBeVisible();
    }

    await test.step(`Checkout via Spay successfully in 1 pages checkout.
    Check order sau khi checkout thành công.`, async () => {
      const orderPage = await checkout.openOrderByAPI(orderId, tokenShop);
      //cause sometimes order captures slower than usual
      const orderStatus = await orderPage.getOrderStatus();
      const isOrderPaid = await orderPage.isPaymentStatus();

      if (!isOrderPaid && !isSchedule) {
        scheduleData = {
          ...scheduleData,
          orderId,
          totalOrderSF,
        };
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 3 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }

      if (isSchedule) {
        await scheduler.clear();
      }

      // Verify order detail
      const actualTotalOrder = await orderPage.getTotalOrder();
      const actualPaidByCustomer = await orderPage.getPaidByCustomer();
      expect(orderStatus).toEqual("Paid");
      expect(actualTotalOrder).toEqual(totalOrderSF);
      expect(actualPaidByCustomer).toEqual(totalOrderSF);
    });

    await test.step(`Go to Stripe dashboard to check corresponding transaction`, async () => {
      const orderInfo = await orderAPI.getOrderInfo(orderId);
      const orderStripeInfo = await orderAPI.getOrdInfoInStripe({
        key: conf.suiteConf.stripe_secret_key,
        gatewayCode: "platform",
        connectedAcc: orderInfo.accountId,
        paymentIntendId: orderInfo.paymentProviderPayload["auth_id"],
      });
      const ordAmount = String((orderStripeInfo.ordAmount / 100).toFixed(2));
      expect(ordAmount).toEqual(removeCurrencySymbol(totalOrderSF));
    });
  });

  test(`Check checkout successfully with adding item from post-purchase to order @SB_CHE_SPAY_10`, async ({
    conf,
    scheduler,
  }) => {
    let actualTotalOrder: string;
    let totalOrderSF: string;
    let orderId: number;
    if (isSchedule) {
      orderId = scheduleData.orderId;
      totalOrderSF = scheduleData.totalOrderSF;
      actualTotalOrder = scheduleData.actualTotalOrder;
    } else {
      await themeSetting.editCheckoutLayout("one-page");
      await checkout.addProductToCartThenInputShippingAddress(conf.caseConf.product, conf.suiteConf.shipping_address);
      await checkout.completeOrderWithMethod("Shopbase payment");
      await expect(checkout.thankyouPageLoc).toBeVisible();
      orderId = await checkout.getOrderIdBySDK();
      totalOrderSF = await checkout.getTotalOnOrderSummary();
    }

    await test.step(`Checkout via stripe successfully in 3 pages checkout. Add PPC cho order.`, async () => {
      if (isSchedule) {
        return;
      }
      // Add PPC cho order.
      await checkout.addProductPostPurchase(conf.caseConf.product_ppc_name);
      await checkout.completePaymentForPostPurchaseItem(conf.caseConf.paymentMethod);
      actualTotalOrder = await checkout.getTotalOnOrderSummary();
      const priceProduct = await checkout.getProductPrice(conf.caseConf.product_ppc_name);
      // expect add PPC thành công: total order tăng một khoảng bằng PPC amount
      expect(Number(actualTotalOrder)).toEqual(Number(totalOrderSF) + Number(priceProduct));
    });

    await test.step(`Check order sau khi checkout thành công`, async () => {
      // Check order sau khi checkout thành công
      const orderPage = await checkout.openOrderByAPI(orderId, tokenShop);
      //cause sometimes order captures slower than usual
      const orderStatus = await orderPage.getOrderStatus();
      const isOrderPaid = await orderPage.isPaymentStatus();

      if (!isOrderPaid && !isSchedule) {
        scheduleData = {
          ...scheduleData,
          orderId,
          totalOrderSF,
          actualTotalOrder,
        };
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 3 });
        // eslint-disable-next-line playwright/no-skipped-test
        await test.skip();
        return;
      }
      if (isSchedule) {
        await scheduler.clear();
      }
      // Verify order detail
      const actualPaidByCustomer = await orderPage.getPaidByCustomer();
      expect(orderStatus).toEqual("Paid");
      expect(actualPaidByCustomer).toEqual(actualTotalOrder);
    });

    await test.step(`Go to Stripe dashboard to check corresponding transaction`, async () => {
      const orderInfo = await orderAPI.getOrderInfo(orderId);
      const orderStripeInfo = await orderAPI.getOrdInfoInStripe({
        key: conf.suiteConf.stripe_secret_key,
        gatewayCode: "platform",
        connectedAcc: orderInfo.accountId,
        paymentIntendId: orderInfo.paymentProviderPayload["auth_id"],
      });
      const ordAmount = String((orderStripeInfo.ordAmount / 100).toFixed(2));
      expect(ordAmount).toEqual(removeCurrencySymbol(actualTotalOrder));
    });
  });

  test(`Check checkout unsuccessfully if cancel confirming 3ds in 3 pages checkout @SB_CHE_SPAY_30`, async ({
    conf,
  }) => {
    await test.step(`Input card number then checkout`, async () => {
      await checkout.addProductToCartThenInputShippingAddress(conf.caseConf.product, conf.suiteConf.shipping_address);
      // Input thông tin card thanh toán
      const cardInfo = conf.caseConf.card_info;
      await checkout.enterCardNumber(cardInfo.number);
      await checkout.enterCardHolderName(cardInfo.holder_name);
      await checkout.enterExpireDate(cardInfo.expire_date);
      await checkout.enterCVV(cardInfo.cvv);
      await checkout.clickCompleteOrder();
      // Wait đến khi hiện 3D Secure 2 Test Page
      await checkout.waitAbit(5000);
      await checkout.clickButtonOn3dsTestPage("Fail");
      expect(await checkout.isErrorMsgVisible(conf.caseConf.message, 3000)).toBe(true);
    });
  });

  test(`Check tracking number sync từ Shopbase Payment lên Stripe transaction khi update tracking number mới @SB_CHE_SPAY_50`, async ({
    conf,
    scheduler,
  }) => {
    let orderId: number;
    if (isSchedule) {
      orderId = scheduleData.orderId;
    } else {
      await themeSetting.editCheckoutLayout("one-page");
      await checkout.addProductToCartThenInputShippingAddress(conf.caseConf.product, conf.suiteConf.shipping_address);
      await checkout.completeOrderWithMethod("Shopbase payment");
      await checkout.btnClosePPCPopup.click();
      orderId = await checkout.getOrderIdBySDK();
    }
    const orderPage = await checkout.openOrderByAPI(orderId, tokenShop);

    await test.step(`Edit tracking number > Nhập tracking number mới > Fulfill order`, async () => {
      //cause sometimes order captures slower than usual
      const isOrderPaid = await orderPage.isPaymentStatus();

      if (!isOrderPaid && !isSchedule) {
        scheduleData = {
          ...scheduleData,
          orderId,
        };
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 3 });
        // eslint-disable-next-line playwright/no-skipped-test
        await test.skip();
        return;
      }
      if (isSchedule) {
        await scheduler.clear();
      }
      await orderPage.markAsFulfillOrd();
      await orderPage.clickOnBtnWithLabel("Edit tracking");
      await orderPage.addTrackingNumber();
      await orderPage.waitForElementVisibleThenInvisible(orderPage.genXpathToastMsg(`Edit success`));
    });

    await test.step(`Vào Stripe dashboard, check tracking number của transaction`, async () => {
      const orderInfo = await orderAPI.getOrderInfo(orderId);
      const orderStripeInfo = await orderAPI.getBodyOrdInfoInStripe({
        key: conf.suiteConf.stripe_secret_key,
        gatewayCode: "platform",
        connectedAcc: orderInfo.accountId,
        paymentIntendId: orderInfo.paymentProviderPayload["auth_id"],
      });
      expect(orderStripeInfo.shipping.tracking_number).toEqual(orderPage.defaultTrackingInfo.number);
    });
  });
});
