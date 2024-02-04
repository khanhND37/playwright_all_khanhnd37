import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import type {
  ManualPaymentSetting,
  Product,
  ShippingAddressApi,
  OrderSummary,
  OrderAfterCheckoutInfo,
  RefundInfo,
  OrderInfo,
} from "@types";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { OrdersPage } from "@pages/dashboard/orders";
import { PaymentProviders } from "@pages/api/payment_providers";

test.describe("Buyer should be able checkout with the payment method cash on delivery", () => {
  let paymentSettings: PaymentProviderPage;
  let dashboardPage: DashboardPage;
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let paymentSettingAPI: PaymentProviders;
  let codSetting: ManualPaymentSetting;
  let product: Array<Product>;
  let email: string;
  let shipAdd: ShippingAddressApi;
  let themeSettingAPI: SettingThemeAPI;
  let orderSummary: OrderSummary;
  let checkoutInfo: OrderAfterCheckoutInfo;
  let orderPage: OrdersPage;
  let refundInfo: RefundInfo;
  let orderInfo: OrderInfo;

  test.beforeEach(async ({ dashboard, conf, theme, request, page, authRequest }) => {
    const themeLayout = conf.caseConf.theme_layout;
    themeSettingAPI = new SettingThemeAPI(theme);
    await themeSettingAPI.editCheckoutLayout(themeLayout);
    paymentSettings = new PaymentProviderPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    checkoutPage = new SFCheckout(page, conf.suiteConf.domain);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, request, page);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    paymentSettingAPI = new PaymentProviders(conf.suiteConf.domain, authRequest);
    codSetting = conf.caseConf.codSetting;
    product = conf.suiteConf.product;
    email = conf.suiteConf.email;
    shipAdd = conf.suiteConf.shipping_address;
    refundInfo = conf.caseConf.refundInfo;

    //Navigate to Payment Providers se
    await dashboardPage.goto("admin/settings");
    await dashboardPage.navigateToSectionInSettingPage("Payment providers");

    //delete all Manual Payment Method
    await paymentSettingAPI.removeAllPaymentMethod();
    await dashboardPage.page.reload();

    //Active COD
    await paymentSettings.activateManualPaymentMethod(codSetting);

    //Open checkout page on storefront
    //Checkout with customer information and shipping address and get all info
    await checkoutAPI.addProductToCartThenCheckout(product);
    await checkoutAPI.updateCustomerInformation(email, shipAdd);
    await checkoutAPI.selectDefaultShippingMethod(shipAdd.country_code);
    await checkoutAPI.openCheckoutPageByToken();
  });
  test(`@TC_SB_SET_PMS_COD_60 Kiểm tra hiển thị payment Cash On Delivery(COD) với Add extra fee, setting checkout 3 pages `, async () => {
    await test.step(`Buyer checkout sản phẩm `, async () => {
      expect(await checkoutPage.isManualPaymentMethodDisplayed(codSetting.payment_type)).toBeTruthy();
      await checkoutPage.selectPaymentMethod("cod");
      orderSummary = await checkoutPage.getOrderSummaryInfo();
      expect(orderSummary.extraValue).toEqual(await checkoutPage.calculateExtrafee(codSetting, orderSummary));
      expect(orderSummary.totalPrice).toEqual(await checkoutPage.calTotalOrdOnOrderSummary(orderSummary));
    });

    await test.step(`Complete order`, async () => {
      await checkoutPage.clickOnBtnWithLabel("Complete order");
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      expect(await checkoutPage.getPaymentMethodOnThnkPage()).toEqual("Cash on delivery (COD)");
    });
  });

  test(`@SB_CHE_COD_16 Check "Mark as refund"  thành công với những order đã có stt là "Paid" khi checkout COD`, async () => {
    await test.step(`- Trên storefront -> Add product to cart-> Checkout - Tại màn checkout nhập thông tin checkout -> Click 'Place your order'`, async () => {
      expect(await checkoutPage.isManualPaymentMethodDisplayed(codSetting.payment_type)).toBeTruthy();
      await checkoutPage.selectPaymentMethod("cod");
      orderSummary = await checkoutPage.getOrderSummaryInfo();
      expect(orderSummary.extraValue).toEqual(await checkoutPage.calculateExtrafee(codSetting, orderSummary));
      expect(orderSummary.totalPrice).toEqual(await checkoutPage.calTotalOrdOnOrderSummary(orderSummary));
      await checkoutPage.clickOnBtnWithLabel("Complete order");
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      expect(await checkoutPage.getPaymentMethodOnThnkPage()).toEqual("Cash on delivery (COD)");
    });

    await test.step(`Login dashboard => "Orders" -> Kiểm tra detail order được tạo`, async () => {
      if (await checkoutPage.btnClosePPCPopup.isVisible()) {
        await checkoutPage.btnClosePPCPopup.click();
      }
      checkoutInfo = await checkoutPage.getOrderInfoAfterCheckout();
      await checkoutPage.page.close();
      await orderPage.goToOrderByOrderId(checkoutInfo.orderId);
      orderInfo = await orderPage.getOrderInfoInOrderPage();
      await orderPage.reloadUntilOrdCapture(orderInfo.payment_status, 5);
      expect(await orderPage.getPaymentStatus()).toEqual("Pending");
    });

    await test.step(`Click button "Mark as paid"`, async () => {
      await orderPage.markAsPaidOrder();
      await orderPage.page.reload();
      expect(await orderPage.getPaymentStatus()).toEqual("Paid");
    });

    await test.step(`Click button "Refund item" -> Điền thông tin refund ->Click button "Refund {{$refund_value}}`, async () => {
      await orderPage.refundOrderAtOrderDetails(refundInfo);
      expect(await orderPage.getPaymentStatus()).toEqual("Partially refunded");
    });
  });

  test(`@SB_CHE_COD_18 Check có thể cancel đồng thời refund partially thành công order được checkout qua COD `, async () => {
    await test.step(`- Trên storefront -> Add product to cart-> Checkout - Tại màn checkout nhập thông tin checkout -> Click 'Place your order'`, async () => {
      expect(await checkoutPage.isManualPaymentMethodDisplayed(codSetting.payment_type)).toBeTruthy();
      await checkoutPage.selectPaymentMethod("cod");
      orderSummary = await checkoutPage.getOrderSummaryInfo();
      expect(orderSummary.extraValue).toEqual(await checkoutPage.calculateExtrafee(codSetting, orderSummary));
      expect(orderSummary.totalPrice).toEqual(await checkoutPage.calTotalOrdOnOrderSummary(orderSummary));
      await checkoutPage.clickOnBtnWithLabel("Complete order");
      const btnClosePPC = await checkoutPage.btnClosePPCPopup.isVisible();
      if (btnClosePPC) {
        await checkoutPage.btnClosePPCPopup.click();
      }
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      expect(await checkoutPage.getPaymentMethodOnThnkPage()).toEqual("Cash on delivery (COD)");
    });

    await test.step(`Login dashboard => "Orders" -> Kiểm tra detail order được tạo`, async () => {
      checkoutInfo = await checkoutPage.getOrderInfoAfterCheckout();
      await checkoutPage.page.close();
      await orderPage.goToOrderByOrderId(checkoutInfo.orderId);
      orderInfo = await orderPage.getOrderInfoInOrderPage();
      await orderPage.reloadUntilOrdCapture(orderInfo.payment_status, 5);
      expect(await orderPage.getPaymentStatus()).toEqual("Pending");
    });

    await test.step(`Click button "Mark as paid"`, async () => {
      await orderPage.markAsPaidOrder();
      await orderPage.page.reload();
      expect(await orderPage.getPaymentStatus()).toEqual("Paid");
    });

    await test.step(`Click dropdown "More action" -> chọn "Cancel order"-> Trong phần "Refund with: Cash on Delivery" nhập giá trị refund nhỏ hơn giá trị "Total available to refund" -> Click button "Cancel Order"`, async () => {
      await orderPage.cancelOrder(3);
      orderInfo = await orderPage.getOrderInfoInOrderPage();
      expect(orderInfo.payment_status).toEqual("Partially refunded");
      expect(orderInfo.cancel_status).toEqual("Cancelled");
    });
  });
});
