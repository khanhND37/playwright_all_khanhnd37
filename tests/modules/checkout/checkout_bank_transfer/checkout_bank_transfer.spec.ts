import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import { SFCheckout } from "@pages/storefront/checkout";
import type { ManualPaymentSetting, OrderAfterCheckoutInfo, ShippingAddressApi, Product, OrderInfo } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";
import { buildOrderTimelineMsg } from "@core/utils/checkout";
import { SbBankTransferScheduleData } from "./checkout-bank-transfer";
import { PaymentProviders } from "@pages/api/payment_providers";

test.describe("Buyer should be able checkout with the payment method cash on delivery", () => {
  let paymentSettings: PaymentProviderPage;
  let dashboardPage: DashboardPage;
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let paymentSettingAPI: PaymentProviders;
  let btSetting: ManualPaymentSetting;
  let orderPage: OrdersPage;
  let checkoutInfo: OrderAfterCheckoutInfo;
  let product: Array<Product>;
  let email: string;
  let shipAdd: ShippingAddressApi;
  let themeSettingAPI: SettingThemeAPI;
  let orderInfo: OrderInfo;

  test.beforeEach(async ({ dashboard, conf, theme, request, page, authRequest }) => {
    //setting Theme Layout
    const themeLayout = conf.caseConf.theme_layout;
    themeSettingAPI = new SettingThemeAPI(theme);
    await themeSettingAPI.editCheckoutLayout(themeLayout);

    paymentSettings = new PaymentProviderPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    checkoutPage = new SFCheckout(page, conf.suiteConf.domain);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, request, page);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    paymentSettingAPI = new PaymentProviders(conf.suiteConf.domain, authRequest);
    btSetting = conf.caseConf.btSetting;
    product = conf.suiteConf.product;
    email = conf.suiteConf.email;
    shipAdd = conf.suiteConf.shipping_address;

    //Navigate to Payment Providers se
    await dashboardPage.goto("admin/settings");
    await dashboardPage.navigateToSectionInSettingPage("Payment providers");

    //delete all Manual Payment Method
    await paymentSettingAPI.removeAllPaymentMethod();
    await dashboardPage.page.reload();

    //Active Bank Transfer
    await paymentSettings.activateManualPaymentMethod(btSetting);

    //Open checkout page on storefront
    //Checkout with customer information and shipping address and get all info
    await checkoutAPI.addProductToCartThenCheckout(product);
    await checkoutAPI.updateCustomerInformation(email, shipAdd);
    await checkoutAPI.selectDefaultShippingMethod(shipAdd.country_code);
  });

  test(`@SB_CHE_BT_4 Check out thành công sau khi nhập text thành nhiều dòng trong Additional Details `, async () => {
    await test.step(`- Trên storefront -> Add product to cart-> Checkout -> nhập thông tin checkout`, async () => {
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(btSetting.payment_type)).toBeTruthy();
    });

    await test.step(`Click 'Place your order'`, async () => {
      await checkoutPage.selectPaymentMethod("bank_transfer");
      expect(await checkoutPage.isAdditionalInforCorrectly(btSetting.additional)).toBeTruthy();
      await checkoutPage.clickBtnCompleteOrder();
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      expect(await checkoutPage.getPaymentMethodOnThnkPage()).toEqual("Bank Transfer");
    });

    await test.step(`Login dashboard -> "Orders" -> Chọn view detail order vừa được tạo`, async () => {
      if (await checkoutPage.btnClosePPCPopup.isVisible()) {
        await checkoutPage.btnClosePPCPopup.click();
      }
      checkoutInfo = await checkoutPage.getOrderInfoAfterCheckout();
      await orderPage.goToOrderByOrderId(checkoutInfo.orderId);
      orderInfo = await orderPage.getOrderInfoInOrderPage();
      expect(await dashboardPage.isDBPageDisplay(checkoutInfo.orderName)).toBeTruthy();
      orderInfo = await orderPage.getOrderInfoInOrderPage();
      await orderPage.reloadUntilOrdCapture(orderInfo.payment_status, 10);
      expect(await orderPage.getPaymentStatus()).toEqual("Pending");
    });
  });

  test(`@SB_CHE_BT_6 Check  method Bank Transfer được hiển thị đúng ở trang checkout 3 page`, async () => {
    await test.step(`- Trên storefront -> Add product to cart-> Checkout-> Điền thông tin vào form checkout
    -> Click "Continue to shipping method" -> Click "Continue to payment method" -> Chọn "Bank transfer" -> Click "Complete order"`, async () => {
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(btSetting.payment_type)).toBeTruthy();
    });

    await test.step(`- Tại màn checkout nhập thông tin checkout -> Click "Complete Order"`, async () => {
      await checkoutPage.selectPaymentMethod("bank_transfer");
      expect(await checkoutPage.isAdditionalInforCorrectly(btSetting.additional)).toBeTruthy();
      await checkoutPage.clickOnBtnWithLabel("Complete order");
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      expect(await checkoutPage.getPaymentMethodOnThnkPage()).toEqual("Bank Transfer");
    });
  });

  test(`@SB_CHE_BT_19 Check có thể cancel đồng thời refund partially thành công order được checkout qua Bank Transfer`, async () => {
    await test.step(`- Trên storefront -> Add product to cart-> Checkout - Tại màn checkout nhập thông tin checkout -> Click 'Place your order'`, async () => {
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(btSetting.payment_type)).toBeTruthy();
      await checkoutPage.selectPaymentMethod("bank_transfer");
      expect(await checkoutPage.isAdditionalInforCorrectly(btSetting.additional)).toBeTruthy();
      await checkoutPage.clickOnBtnWithLabel("Complete order");
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      expect(await checkoutPage.getPaymentMethodOnThnkPage()).toEqual("Bank Transfer");
      if (await checkoutPage.btnClosePPCPopup.isVisible()) {
        await checkoutPage.btnClosePPCPopup.click();
      }
    });

    await test.step(`Login dashboard => "Orders" -> Kiểm tra detail order được tạo`, async () => {
      checkoutInfo = await checkoutPage.getOrderInfoAfterCheckout();
      await orderPage.goToOrderByOrderId(checkoutInfo.orderId);
      orderInfo = await orderPage.getOrderInfoInOrderPage();
      await orderPage.reloadUntilOrdCapture(orderInfo.payment_status, 10);
      expect(await orderPage.getPaymentStatus()).toEqual("Pending");
    });

    await test.step(`Click button "Mark as paid"`, async () => {
      await orderPage.markAsPaidOrder();
      await orderPage.page.reload();
      expect(await orderPage.getPaymentStatus()).toEqual("Paid");
    });

    await test.step(`Click dropdown "More action" -> chọn "Cancel order"`, async () => {
      await orderPage.cancelOrder(1);
      orderInfo = await orderPage.getOrderInfoInOrderPage();
      expect(orderInfo.payment_status).toEqual("Partially refunded");
    });

    await test.step(`Trong phần "Refund with: Bank Transfer" nhập giá trị refund nhỏ hơn giá trị "Total available to refund" -> Click button "Cancel Order"`, async () => {
      expect(orderInfo.cancel_status).toEqual("Cancelled");
    });
  });

  test(`@TC_SB_SET_PMS_BT_21 Buyer checkout với payment Bank transfer, setting checkout 1 pages`, async ({
    scheduler,
  }) => {
    // use schedule for case order timeline not response in first time loaded
    let scheduleData: SbBankTransferScheduleData;
    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as SbBankTransferScheduleData;
    } else {
      scheduleData = {
        orderId: 0,
      };
    }
    await test.step(`Complete order`, async () => {
      //verify payment method displayed
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(btSetting.payment_type)).toBeTruthy();
      //verify desciption detail
      await checkoutPage.selectPaymentMethod("bank_transfer");
      expect(await checkoutPage.isAdditionalInforCorrectly(btSetting.additional)).toBeTruthy();
      //verify thank you page
      await checkoutPage.clickBtnCompleteOrder();
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      expect(await checkoutPage.getPaymentMethodOnThnkPage()).toEqual("Bank Transfer");
    });

    await test.step(`Merchant view order detail`, async () => {
      if (await checkoutPage.btnClosePPCPopup.isVisible()) {
        await checkoutPage.btnClosePPCPopup.click();
      }
      checkoutInfo = await checkoutPage.getOrderInfoAfterCheckout();
      if (!scheduleData.orderId) {
        scheduleData.orderId = checkoutInfo.orderId;
      }
      await orderPage.goToOrderByOrderId(scheduleData.orderId);
      orderInfo = await orderPage.getOrderInfoInOrderPage();
      await orderPage.reloadUntilOrdCapture(orderInfo.payment_status, 10);
      //verify payment status
      expect(await orderPage.getPaymentStatus()).toEqual("Pending");
      //verify paid by customer
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(removeCurrencySymbol(paidByCustomer)).toEqual("0.00");
      //verify button Mask as paid
      const btnMaskAsPaid = await orderPage.isBtnVisible("Mark as paid");
      expect(btnMaskAsPaid).toBeTruthy();
      //verify order timeline
      const orderTimelineSendingEmail = buildOrderTimelineMsg(
        shipAdd.first_name,
        shipAdd.last_name,
        email,
      ).timelineSendEmail;

      const existedSendingEmailTimeLine = await (await orderPage.orderTimeLines(orderTimelineSendingEmail)).isVisible();
      if (!existedSendingEmailTimeLine) {
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 3 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      await scheduler.clear();

      await expect(existedSendingEmailTimeLine).toBeTruthy();
      const orderTimelineCustomerPlaceOrder = buildOrderTimelineMsg(
        shipAdd.first_name,
        shipAdd.last_name,
        email,
      ).timelinePlaceOrd;
      await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
    });

    await test.step(`Merchant chọn Mask as paid`, async () => {
      await orderPage.markAsPaidOrder();
      await orderPage.page.reload();
      //verify payment status
      expect(await orderPage.getPaymentStatus()).toEqual("Paid");
      //verify paid by customer
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(removeCurrencySymbol(paidByCustomer)).toEqual(checkoutInfo.totalSF.toFixed(2).toString());
    });
  });
});
