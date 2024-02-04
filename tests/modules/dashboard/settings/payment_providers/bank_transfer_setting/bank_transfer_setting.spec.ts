import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import { SFCheckout } from "@pages/storefront/checkout";
import type { ManualPaymentSetting, OrderAfterCheckoutInfo, ShippingAddressApi, Product } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { PaymentProviders } from "@pages/api/payment_providers";

test.describe("Buyer should be able checkout with the payment method cash on delivery", () => {
  let paymentSettings: PaymentProviderPage;
  let dashboardPage: DashboardPage;
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let btSetting: ManualPaymentSetting;
  let orderPage: OrdersPage;
  let paymentSettingAPI: PaymentProviders;
  let checkoutInfo: OrderAfterCheckoutInfo;
  let product: Array<Product>;
  let email: string;
  let shipAdd: ShippingAddressApi;
  let themeSettingAPI: SettingThemeAPI;
  let paymentStatus: string;

  test.beforeEach(async ({ dashboard, conf, theme, request, page, authRequest }) => {
    //setting Theme Layout
    const themeLayout = conf.caseConf.theme_layout;
    themeSettingAPI = new SettingThemeAPI(theme);
    await themeSettingAPI.editCheckoutLayout(themeLayout);

    paymentSettings = new PaymentProviderPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    checkoutPage = new SFCheckout(page, conf.suiteConf.domain);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, request, page);
    paymentSettingAPI = new PaymentProviders(conf.suiteConf.domain, authRequest);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
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
    await paymentSettings.goToPagePaymentProvider();
    expect(await paymentSettings.isActiveManualPaymentMethod(btSetting.payment_type)).toBe(true);

    //Open checkout page on storefront
    //Checkout with customer information and shipping address and get all info
    await checkoutAPI.addProductToCartThenCheckout(product);
    await checkoutAPI.updateCustomerInformation(email, shipAdd);
    await checkoutAPI.selectDefaultShippingMethod(shipAdd.country_code);
  });

  test(`@SB_SET_PMS_BT_6 Merchant thêm mới Bank Transfer payment thành công `, async () => {
    await test.step(`- Trên storefront -> Add product to cart-> Checkout - Tại màn checkout nhập thông tin checkout`, async () => {
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(btSetting.payment_type)).toBeTruthy();
    });

    await test.step(`Click 'Place your order'`, async () => {
      await checkoutPage.selectPaymentMethod("bank_transfer");
      await checkoutPage.clickBtnCompleteOrder();
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      expect(await checkoutPage.getPaymentMethodOnThnkPage()).toEqual("Bank Transfer");
    });

    await test.step(`Login dashboard => "Orders" -> Kiểm tra detail order được tạo`, async () => {
      if (await checkoutPage.btnClosePPCPopup.isVisible()) {
        await checkoutPage.btnClosePPCPopup.click();
      }
      checkoutInfo = await checkoutPage.getOrderInfoAfterCheckout();
      await orderPage.goToOrderByOrderId(checkoutInfo.orderId);
      paymentStatus = await orderPage.getPaymentStatus();
      await orderPage.reloadUntilOrdCapture(paymentStatus);
      expect(await orderPage.getPaymentStatus()).toEqual("Pending");
      expect(await dashboardPage.isDBPageDisplay(checkoutInfo.orderName)).toBeTruthy();
    });
  });

  test(`@SB_SET_PMS_BT_16 Merchant deactive Bank Transfer payment thành công `, async () => {
    await test.step(`Navigate "Settings" -> "Payment Providers" -> Click "Deactivate Bank Transfer" ở trang payment providers`, async () => {
      expect(await paymentSettings.isManualPaymentMethodActivated(btSetting.payment_type)).toBeTruthy();
      await paymentSettings.deleteAllManualMethod();
      expect(await paymentSettings.isManualPaymentMethodActivated(btSetting.payment_type)).toBeFalsy();
    });

    await test.step(`- Trên storefront -> Add product to cart-> Checkout - Tại màn checkout nhập thông tin checkout`, async () => {
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(btSetting.payment_type)).toBeFalsy();
    });
  });

  test(`@SB_SET_PMS_BT_22 Buyer checkout với payment Bank transfer có post purchase `, async () => {
    await test.step(`Buyer checkout sản phẩm `, async () => {
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(btSetting.payment_type)).toBeTruthy();
    });

    await test.step(`Complete order`, async () => {
      await checkoutPage.selectPaymentMethod("bank_transfer");
      await checkoutPage.clickBtnCompleteOrder();
      expect(await checkoutPage.isPostPurchaseDisplayed()).toBeTruthy();
    });

    await test.step(`Add sản phẩm post purchase`, async () => {
      await checkoutPage.addPostPurchase();
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
    });

    await test.step(`Merchant view order detail`, async () => {
      checkoutInfo = await checkoutPage.getOrderInfoAfterCheckout();
      await orderPage.goToOrderByOrderId(checkoutInfo.orderId);
      paymentStatus = await orderPage.getPaymentStatus();
      await orderPage.reloadUntilOrdCapture(paymentStatus);
      expect(await orderPage.getPaymentStatus()).toEqual("Pending");
    });

    await test.step(`Merchant chọn Mask as paid`, async () => {
      await orderPage.markAsPaidOrder();
      await orderPage.page.reload();
      expect(await orderPage.getPaymentStatus()).toEqual("Paid");
    });
  });
});
