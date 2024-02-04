import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import type { Card, CheckoutInfo } from "@types";
import { SbCheckoutUnlimintScheduleData } from "./checkout_unlimint";

test.describe("Checkout qua cổng Unlimint", () => {
  let checkoutAPI: CheckoutAPI;
  let shopToken;
  let isSchedule;
  let scheduleData: SbCheckoutUnlimintScheduleData;

  // pre-condition: Created a checkout and add shipping info, then go to payment method page
  test.beforeEach(async ({ conf, authRequest, page, token, scheduler }) => {
    const { email, shipping_address, domain } = conf.suiteConf as never;
    const countryCode = conf.suiteConf.shipping_address.country_code;
    const productCheckout = conf.caseConf.products_checkout;

    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    shopToken = await token.getWithCredentials({
      domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });

    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as SbCheckoutUnlimintScheduleData;
      isSchedule = true;
      return;
    }

    await checkoutAPI.addProductToCartThenCheckout(productCheckout);
    await checkoutAPI.updateCustomerInformation(email, shipping_address);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    await checkoutAPI.openCheckoutPageByToken();
  });

  test(`@TC_SB_CHE_UNL_3 Kiểm tra buyer checkout qua cổng Unlimint không thành công với declined card`, async ({
    page,
    conf,
  }) => {
    // prepair data for test
    const { domain } = conf.suiteConf as never;

    const checkout = new SFCheckout(page, domain);
    const cardInfo = conf.caseConf.card_info;

    await test.step(
      "Tại trang Payment method -> chọn method Unlimint payment page" +
        " -> Click Complete order -> Nhập card info -> Click Pay",
      async () => {
        await checkout.waitForCheckoutPageCompleteRender();
        await checkout.completeOrderUnlimint(cardInfo);
        // Expected result:
        // - Checkout unsuccessfully
        // - Redirect về trang checkout page
        // - Error msg: "Oops! This card is declined by issuing bank. Please contact your bank for help."
        //Doi de expect lay duọc status
        await page.waitForTimeout(500);
        await expect(
          page.locator("//*[@class='notice notice--error']/*[contains(normalize-space(),'declined by issuing bank')]"),
        ).toBeVisible();
        await page.waitForSelector("//div[@class='order-summary']");
        await expect(page.locator(checkout.xpathPaymentLabel)).toBeVisible();
        expect(
          await checkout.isErrorMsgVisible(
            "Oops! This card is declined by issuing bank. Please contact your bank for help.",
          ),
        ).toBe(true);
      },
    );
  });

  test(`@TC_SB_CHE_UNL_5 Kiểm tra buyer checkout có PPC qua cổng Unlimint thành công`, async ({
    page,
    conf,
    scheduler,
  }) => {
    // prepair data for test
    const { domain } = conf.suiteConf as never;
    const accessToken = shopToken.access_token;

    const checkout = new SFCheckout(page, domain);
    let orderPage: OrdersPage;
    let totalOrderSF: string;

    let checkoutInfo: CheckoutInfo;

    const cardInfo = conf.caseConf.card_info;
    const ppcItem = conf.caseConf.product_ppc.name;
    let priceOfPostPurchase;

    await test.step(`Tại trang Payment method -> chọn method Unlimint`, async () => {
      if (isSchedule) {
        return;
      }
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      totalOrderSF = removeCurrencySymbol(totalOrderSF);
      await checkout.waitForCheckoutPageCompleteRender();
      await checkout.selectPaymentMethod("Unlimint");
      await checkout.clickBtnCompleteOrder();
      // Expected result:
      // - Direct sang trang sandbox.cardpay.com
      // - Hiển thị đúng giá tiền cần checkout
      await page.waitForLoadState("networkidle");
      await checkout.waitUntilElementVisible("//div[@id='cardpay-logo']");
      expect(page.url().split("/")[2]).toBe("sandbox.cardpay.com");
      const totalOrderOnSanboxCardPay = await checkout.getTotalOrderOnSanboxCardPay();
      expect(totalOrderOnSanboxCardPay).toBe(totalOrderSF);
    });

    await test.step(`Nhập card info -> Click Pay`, async () => {
      if (isSchedule) {
        return;
      }
      await checkout.completeOrderUnlimint(cardInfo);

      // Expected result:
      // - Checkout successfully without 3Ds
      // - Direct về trang thankyou
      // - Show popup PPC
      await page.waitForSelector("//div[@class='order-summary']");
      await expect(page.locator("//h2[normalize-space()='Thank you!']")).toBeVisible();
      await expect(page.locator("//div[@class='post-purchase__body']")).toBeVisible();
    });

    await test.step(`Add item post purchase to cart`, async () => {
      if (isSchedule) {
        return;
      }
      priceOfPostPurchase = await checkout.addProductPostPurchase(ppcItem);
      // Expected result:
      // - Direct sang trang sandbox.cardpay.com
      // - Hiển thị đúng giá tiền cần checkout
      await page.waitForLoadState("networkidle");
      await checkout.waitUntilElementVisible("//div[@id='cardpay-logo']");
      expect(page.url().split("/")[2]).toBe("sandbox.cardpay.com");
      const totalOrderOnSanboxCardPay = await checkout.getTotalOrderOnSanboxCardPay();
      expect(totalOrderOnSanboxCardPay).toBe(removeCurrencySymbol(priceOfPostPurchase));
    });

    await test.step("Nhập CVV -> Click Pay", async () => {
      if (isSchedule) {
        return;
      }
      await checkout.completePaymentForPostPurchaseItem("Unlimint", cardInfo);
      // - Checkout successfully without 3Ds
      // - Direct về trang thankyou
      await expect(page.locator("//div[@id='payment-item-status']/div[normalize-space()='CONFIRMED']")).toBeVisible();
      await page.waitForSelector("//div[@class='order-summary']");
      await expect(page.locator("//h2[normalize-space()='Thank you!']")).toBeVisible();
    });

    await test.step(`Merchant view order details tại dashboard`, async () => {
      if (isSchedule) {
        checkoutInfo = scheduleData.checkoutInfo;
      } else {
        checkoutInfo = await checkoutAPI.getCheckoutInfo();
      }

      orderPage = await checkout.openOrderByAPI(checkoutInfo.order.id, accessToken);
      const actualTotalOrder = await orderPage.getTotalOrder();
      const actualPaidByCustomer = await orderPage.getPaidByCustomer();
      const orderStatus = await orderPage.getOrderStatus();
      removeCurrencySymbol(actualTotalOrder);

      const isOrderPaid = await orderPage.isPaymentStatus();

      // Nếu order ở trạng thái authorized
      // schedule 3 phút sau check lại
      // nếu vẫn authorized thì coi như fail
      if (!isOrderPaid && !isSchedule) {
        scheduleData = {
          ...scheduleData,
          checkoutInfo,
        };
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 3 });
        return;
      }
      if (isSchedule) {
        await scheduler.clear();
      }

      // Expected result:
      // - Order ở trạng thái Paid
      // - Thông tin order chính xác
      // - Order timeline tách làm 2 transaction, bao gồm transaction cho item PPC
      expect(orderStatus).toBe("Paid");
      expect(removeCurrencySymbol(actualTotalOrder)).toEqual(checkoutInfo.totals.total_price.toFixed(2));
      expect(actualPaidByCustomer).toEqual(actualTotalOrder);
      expect(await page.locator("//div[contains(text(),'The Unlimint transaction ID is')]").count()).toBe(2);
    });
  });

  test(`@TC_SB_CHE_UNL_8 Kiểm tra buyer checkout qua cổng Unlimint thành công với 3Ds`, async ({
    page,
    conf,
    scheduler,
  }) => {
    // prepair data for test
    const { domain } = conf.suiteConf as never;
    const accessToken = shopToken.access_token;

    const checkout = new SFCheckout(page, domain);
    let orderPage: OrdersPage;
    let totalOrderSF: string;

    let checkoutInfo: CheckoutInfo;
    let idUnlimintTransaction: string;

    const cardInfo = conf.caseConf.card_info;

    await test.step(`Tại trang Payment method -> chọn method Unlimint -> Click Complete order`, async () => {
      if (isSchedule) {
        return;
      }
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      totalOrderSF = removeCurrencySymbol(totalOrderSF);
      await checkout.waitForCheckoutPageCompleteRender();
      await checkout.selectPaymentMethod("Unlimint");
      await checkout.clickBtnCompleteOrder();
      // Expected result:
      // - Direct sang trang sandbox.cardpay.com
      // - Hiển thị đúng giá tiền cần checkout
      await page.waitForLoadState("networkidle");
      await checkout.waitUntilElementVisible("//div[@id='cardpay-logo']");
      expect(page.url().split("/")[2]).toBe("sandbox.cardpay.com");
      const totalOrderOnSanboxCardPay = await checkout.getTotalOrderOnSanboxCardPay();
      expect(totalOrderOnSanboxCardPay).toBe(totalOrderSF);
      idUnlimintTransaction = await checkout.getIdOfUlimintOrder();
    });

    await test.step(`Nhập card info -> Click Pay`, async () => {
      if (isSchedule) {
        return;
      }
      await checkout.completeOrderUnlimint(cardInfo);
      // Expected result:
      // Direct sang trang confirm 3Ds
      await expect(page.locator("//h2[normalize-space()='3-D Secure ACS Emulator']")).toBeVisible();
    });

    await test.step(`Click confirm 3Ds`, async () => {
      if (isSchedule) {
        return;
      }
      await checkout.clickBtnConfirm3Ds();
      // Expected result:
      // Checkout successfully with 3Ds -> Direct về trang thankyou
      await expect(page.locator("//h2[normalize-space()='Thank you!']")).toBeVisible();
    });

    await test.step(`Merchant view order details tại dashboard`, async () => {
      let cardInfoVerify: Card = cardInfo;
      if (isSchedule) {
        checkoutInfo = scheduleData.checkoutInfo;
        idUnlimintTransaction = scheduleData.idUnlimintTransaction;
        cardInfoVerify = scheduleData.cardInfo;
      } else {
        checkoutInfo = await checkoutAPI.getCheckoutInfo();
      }

      orderPage = await checkout.openOrderByAPI(checkoutInfo.order.id, accessToken);
      const actualTotalOrder = await orderPage.getTotalOrder();
      const actualPaidByCustomer = await orderPage.getPaidByCustomer();
      const orderStatus = await orderPage.getOrderStatus();
      removeCurrencySymbol(actualTotalOrder);
      const isOrderPaid = await orderPage.isPaymentStatus();

      // Nếu order ở trạng thái authorized
      // schedule 3 phút sau check lại
      // nếu vẫn authorized thì coi như fail
      if (!isOrderPaid && !isSchedule) {
        scheduleData = {
          ...scheduleData,
          checkoutInfo,
          idUnlimintTransaction,
          cardInfo,
        };
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 3 });
        return;
      }
      if (isSchedule) {
        await scheduler.clear();
      }
      // Expected result:
      // - Order ở trạng thái Paid
      // - Thông tin order chính xác
      // - Có log timeline
      expect(orderStatus).toBe("Paid");
      expect(removeCurrencySymbol(actualTotalOrder)).toEqual(checkoutInfo.totals.total_price.toFixed(2));
      expect(actualPaidByCustomer).toEqual(actualTotalOrder);
      expect(
        await orderPage.verifyOrderTimeline(checkoutInfo, {
          idUnlimintCheckout: idUnlimintTransaction,
          cardInfo: cardInfoVerify,
        }),
      ).toBe(true);
    });
  });
});
