import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { PaymentProviders } from "@pages/api/payment_providers";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";

test.describe("Merchant should be able set up payment method unlimint", async () => {
  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    const { domain } = conf.suiteConf as never;
    //clear env test
    const paymentAPI = new PaymentProviders(domain, authRequest);
    await paymentAPI.removeAllPaymentMethod();

    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    await dashboardPage.goto("admin/settings");
    await dashboardPage.navigateToSectionInSettingPage("Payment providers");
  });

  test("@TC_SB_SET_PMS_UNL_19 Kiểm tra khi merchant tạo mới cổng thanh toán Unlimint thành công", async ({
    dashboard,
    conf,
    authRequest,
    page,
  }) => {
    // prepaid data
    const { domain, account_name: accountName, info_register: infoRegister } = conf.suiteConf as never;
    await test.step("Merchant nhập thông tin để tạo mới account Unlimint", async () => {
      const payment = new PaymentProviderPage(dashboard, domain);
      await payment.inputInfoUnlimint(accountName, infoRegister);
    });

    await test.step("Merchant chọn add account ở màn hình dashboard", async () => {
      await dashboard.click(`//span[normalize-space()='+ Add account']`);
      //-Activate cổng thành công và hiển thị message "Activated Successfully"
      await expect(dashboard.locator(`//div[contains(text(),'Activated successfully')]`)).toBeVisible();
      await expect(dashboard.locator(`//p[contains(text(),'Active Cardpay successfully!')]`)).toBeVisible();
      await dashboard.click(`//button[contains(text(),"I'll do it later")]`);
      await dashboard.waitForLoadState("networkidle");
      await expect(dashboard.locator(`//strong[contains(text(),'${accountName}')]/..`)).toBeVisible();
    });

    await test.step("Buyer checkout sản phẩm ở màn hình storefront", async () => {
      const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
      await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.product);
      await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
      await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      //-Hiển thị cổng thanh toán bằng cổng Unlimint
      await expect(page.locator(`//div[@id='cardpay-cardpay-section']`)).toBeVisible();
    });
  });

  test("@TC_SB_SET_PMS_UNL_20 Kiểm tra khi merchant deactivate cổng thanh toán Unlimint thành công", async ({
    dashboard,
    conf,
    authRequest,
    page,
  }) => {
    // prepaid data
    const { domain, account_name: accountName, info_register: infoRegister } = conf.suiteConf as never;
    const paymentAPI = new PaymentProviders(domain, authRequest);
    await paymentAPI.createUnlimintAccount(accountName, infoRegister);
    await dashboard.reload();

    await test.step("Merchant chọn deactivate cổng unlimint", async () => {
      await dashboard.click(`//strong[contains(text(),'${accountName}')]/..`);
      await dashboard.click(
        `//strong[normalize-space()='${accountName}']` +
          `/ancestor::div[@role='tab']/following-sibling::div/descendant::span[contains(text(),'Deactivate')]`,
      );
      //- Hiển thị message "Deactivated successfully"
      //- Hiển thị button activate
      await expect(dashboard.locator(`//div[contains(text(),'Deactivated successfully')]`)).toBeVisible();
      await expect(
        dashboard.locator(
          `//strong[normalize-space()='${accountName}']` +
            `/ancestor::div[@role='tab']/following-sibling::div/descendant::span[contains(text(),'Activate')]`,
        ),
      ).toBeVisible();
    });

    await test.step("Buyer checkout sản phẩm ở màn hình storefront", async () => {
      const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
      await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.product);
      await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
      await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      //-Không hiển thị cổng thanh toán cổng Unlimint
      await expect(page.locator(`//div[@id='cardpay-cardpay-section']`)).not.toBeVisible();
    });
  });
});

test.describe("Merchant should be able delete payment method unlimint", async () => {
  test("Kiểm tra khi merchant xóa cổng thanh toán Unlimint thành công @TC_SB_SET_PMS_UNL_21", async ({
    dashboard,
    conf,
    authRequest,
    page,
  }) => {
    // prepaid data
    const { domain, account_name: accountName, info_register: infoRegister } = conf.suiteConf as never;
    const paymentAPI = new PaymentProviders(domain, authRequest);
    await paymentAPI.removeAllPaymentMethod();
    await paymentAPI.createUnlimintAccount(accountName, infoRegister);

    // Goto dashboard
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    await dashboardPage.goto("admin/settings/payments");

    await test.step("Merchant chọn remote account", async () => {
      await dashboard.click(`//strong[contains(text(),'${accountName}')]/..`);
      await dashboard.click(
        `//strong[normalize-space()='${accountName}']` +
          `/ancestor::div[@role='tab']/following-sibling::div/descendant::a[contains(text(),'Remove account')]`,
      );
      await dashboard.click(`//button[normalize-space()='Remove']`);
      //-Không hiển thị cổng thanh toán màn hình dashboard
      //-Hiển thị message "Delete successfully"
      await expect(dashboard.locator(`//div[contains(text(),'Delete successfully')]`)).toBeVisible();
      await expect(dashboard.locator(`//strong[contains(text(),'${accountName}')]/..`)).not.toBeVisible();
    });

    await test.step("Buyer checkout sản phẩm ở màn hình storefront", async () => {
      const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
      await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.product);
      await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
      await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      //-Không hiển thị thanh toán cổng Unlimint
      await expect(page.locator(`//div[@id='cardpay-cardpay-section']`)).not.toBeVisible();
    });
  });
});
