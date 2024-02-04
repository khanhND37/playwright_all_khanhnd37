import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Merchant should be able set up payment method AsiaBill", async () => {
  let checkoutAPI: CheckoutAPI;
  let settingTheme: SettingThemeAPI;
  let payment: PaymentProviderPage;
  let checkoutPage: SFCheckout;

  test.beforeEach(async ({ dashboard, conf, page, theme, authRequest }) => {
    const domain = conf.suiteConf.domain;
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    await dashboardPage.goto("admin/settings");
    await dashboardPage.navigateToSectionInSettingPage("Payment providers");
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
    settingTheme = new SettingThemeAPI(theme);
    await settingTheme.editCheckoutLayout("one-page");
    payment = new PaymentProviderPage(dashboard, domain);
    checkoutPage = new SFCheckout(page, domain);
  });

  test("Merchant cấu hình phương thức thanh toán cổng gateway AsiaBill @TC_SB_SET_PMS_AB_01", async ({
    dashboard,
    conf,
    authRequest,
    page,
  }) => {
    const { account_name: accountName, info_register: infoRegister } = conf.suiteConf as never;

    await test.step("Merchant nhập thông tin để tạo mới account AsiaBill", async () => {
      await payment.removeAllAccountByAPI("asia-bill", authRequest);
      await payment.infoAccountAsiaBill(accountName, infoRegister);
    });

    await test.step("Merchant chọn add account", async () => {
      await payment.clickAddAccountBtn();
      await payment.waitForNoticeMessage("Activated successfully");
      await dashboard.waitForLoadState();
      await dashboard.waitForSelector(`//div[contains(text(),'Payment providers')]`);
      await expect(dashboard.locator(`//span[contains(text(),'${accountName}')]`)).toBeVisible();
    });

    await test.step("Buyer add product to cart và checkout", async () => {
      await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.product);
      await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
      await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      await page.click(checkoutPage.xpathAsiaBillMethod);
      //- Hiển thị phương thức thanh toán AsiaBill
      await expect(page.locator(checkoutPage.xpathAsiaBillMethod)).toBeVisible();
      await expect(page.locator(checkoutPage.xpathAsiaBillImg)).toBeVisible();
    });

    await test.step("Merchant login dashboard và chọn deactivate account AsiaBill", async () => {
      await payment.clickToogle(accountName);
      await payment.waitForNoticeMessage("All changes were successfully saved");
    });

    await test.step("Buyer add product to cart và checkout", async () => {
      await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.product);
      await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
      await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      //- Không hiển thị phương thức thanh toán AsiaBill
      await expect(page.locator(checkoutPage.xpathAsiaBillMethod)).not.toBeVisible();
      await expect(page.locator(checkoutPage.xpathAsiaBillImg)).not.toBeVisible();
    });

    await test.step("Merchant login dashboard và chọn delete account AsiaBill", async () => {
      await payment.deleteAsiaBillAcc(accountName);
      await expect(dashboard.locator(`//span[contains(text(),'${accountName}')]`)).not.toBeVisible();
    });

    await test.step("Buyer add product to cart và checkout", async () => {
      await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.product);
      await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
      await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      //- Không hiển thị phương thức thanh toán AsiaBill
      await expect(page.locator(checkoutPage.xpathAsiaBillMethod)).not.toBeVisible();
      await expect(page.locator(checkoutPage.xpathAsiaBillImg)).not.toBeVisible();
    });
  });
});
