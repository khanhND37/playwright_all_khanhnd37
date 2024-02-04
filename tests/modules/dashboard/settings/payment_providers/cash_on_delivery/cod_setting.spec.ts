import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import { SFCheckout } from "@pages/storefront/checkout";
import { CheckoutAPI } from "@pages/api/checkout";
import type { ManualPaymentSetting, Product, ShippingAddressApi, OrderSummary } from "@types";
import { PaymentProviders } from "@pages/api/payment_providers";

test.describe("Buyer should be able checkout with the payment method cash on delivery", () => {
  let paymentSettings: PaymentProviderPage;
  let dashboardPage: DashboardPage;
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let codSetting: ManualPaymentSetting;
  let orderSummary: OrderSummary;
  let product: Array<Product>;
  let email: string;
  let shipAdd: ShippingAddressApi;
  let themeSettingAPI: SettingThemeAPI;
  let paymentSettingAPI: PaymentProviders;

  test.beforeEach(async ({ dashboard, conf, theme, request, page, authRequest }) => {
    const themeLayout = conf.caseConf.theme_layout;
    themeSettingAPI = new SettingThemeAPI(theme);
    await themeSettingAPI.editCheckoutLayout(themeLayout);
    paymentSettingAPI = new PaymentProviders(conf.suiteConf.domain, authRequest);
    paymentSettings = new PaymentProviderPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    checkoutPage = new SFCheckout(page, conf.suiteConf.domain);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, request, page);
    codSetting = conf.caseConf.codSetting;
    product = conf.suiteConf.product;
    email = conf.suiteConf.email;
    shipAdd = conf.suiteConf.shipping_address;

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
  });

  test(`Check nhập text thành nhiều dòng trong Additional Details thành công @SB_SET_PMS_COD_9`, async () => {
    await test.step(`- Trên storefront -> Add product to cart-> Checkout -> nhập thông tin checkout`, async () => {
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(codSetting.payment_type)).toBeTruthy();
      await checkoutPage.selectPaymentMethod("cod");
      expect(await checkoutPage.isAdditionalInforCorrectly(codSetting.additional)).toBeTruthy();
    });

    await test.step(`Click 'Place your order'`, async () => {
      await checkoutPage.clickBtnCompleteOrder();
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      expect(await checkoutPage.getPaymentMethodOnThnkPage()).toEqual("Cash on delivery (COD)");
    });
  });

  test(`Merchant deactive COD payment thành công @SB_SET_PMS_COD_17`, async () => {
    await test.step(`Click "Deactivate Cash on delivery" ở trang payment providers`, async () => {
      //back to payment provider
      await paymentSettings.backFromSettingToPaymentProvider();
      expect(await paymentSettings.isManualPaymentMethodActivatedNew(codSetting.payment_type)).toBeTruthy();
      await paymentSettings.deactivateManualPaymentMethod("COD");
      await paymentSettings.page.waitForLoadState("networkidle");
      expect(await paymentSettings.isManualPaymentMethodActivatedNew(codSetting.payment_type)).toBeFalsy();
    });

    await test.step(`Buyer checkout product màn hình storefront`, async () => {
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(codSetting.payment_type)).toBeFalsy();
    });
  });

  test(`Kiểm tra order khi buyer checkout qua COD có extra fee với checkout có tax, tipping và discount @SB_SET_PMS_COD_22`, async () => {
    await test.step(`- Trên storefront -> Add product to cart-> Checkout - Tại màn checkout nhập thông tin checkout -> Click 'Place your order'`, async () => {
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(codSetting.payment_type)).toBeTruthy();
    });

    await test.step(`Chọn checkout qua COD, kiểm tra order summary và complete order`, async () => {
      await checkoutPage.selectPaymentMethod("cod");
      await checkoutPage.clickBtnCompleteOrder();
      orderSummary = await checkoutPage.getOrderSummaryInfo();
      expect(orderSummary.extraValue).toEqual(await checkoutPage.calculateExtrafee(codSetting, orderSummary));
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      expect(await checkoutPage.getPaymentMethodOnThnkPage()).toEqual("Cash on delivery (COD)");
    });
  });

  test(`Kiểm tra order có PPC khi buyer checkout qua COD có extra fee với type = percentage @SB_SET_PMS_COD_25`, async () => {
    await test.step(`- Trên storefront -> Add product to cart-> Checkout - Tại màn checkout nhập thông tin checkout -> Click 'Place your order'`, async () => {
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isManualPaymentMethodDisplayed(codSetting.payment_type)).toBeTruthy();
    });

    await test.step(`Chọn checkout qua COD, kiểm tra order summary và complete order`, async () => {
      await checkoutPage.selectPaymentMethod("cod");
      await checkoutPage.clickBtnCompleteOrder();
      orderSummary = await checkoutPage.getOrderSummaryInfo();
      expect(orderSummary.extraValue).toEqual(await checkoutPage.calculateExtrafee(codSetting, orderSummary));
    });

    await test.step(`Chọn checkout với item PPC`, async () => {
      await checkoutPage.addPostPurchase();
      orderSummary = await checkoutPage.getOrderSummaryInfo();
      expect(orderSummary.extraValue).toEqual(await checkoutPage.calculateExtrafee(codSetting, orderSummary));
    });
  });
});
