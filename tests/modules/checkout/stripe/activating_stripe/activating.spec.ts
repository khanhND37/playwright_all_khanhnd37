import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import type { StripeAccount } from "@types";

// Cần improve cả file chạy từng case

test.describe("activating Stripe gateway", () => {
  let dashboardPage: DashboardPage;
  let paymentProviderPage: PaymentProviderPage;
  let accountName: string;
  let stripeAccount: StripeAccount;
  let actPaymentStatus: string;
  let expPaymentStatus: string;

  test.beforeAll(async ({ browser, conf, authRequest }) => {
    const { domain, user_id, shop_id, username, password } = conf.suiteConf as never;
    const context = await browser.newContext();
    const page = await context.newPage();
    dashboardPage = new DashboardPage(page, domain);
    paymentProviderPage = new PaymentProviderPage(page, domain);

    await dashboardPage.login({
      // eslint-disable-next-line camelcase
      userId: user_id,
      // eslint-disable-next-line camelcase
      shopId: shop_id,
      email: username,
      password: password,
    });

    await dashboardPage.navigateToMenu("Settings");
    await dashboardPage.navigateToSectionInSettingPage("Payment providers");
    await paymentProviderPage.removeAllAccountByAPI("stripe", authRequest);
  });

  test.beforeEach(async ({ conf }) => {
    accountName = conf.suiteConf.account_name;
    expPaymentStatus = conf.caseConf.status;
    stripeAccount = conf.caseConf.stripe_account;
  });

  /**
   * Activating Stripe account
   */
  test(`[Activating Stripe account mới]
        Kiểm tra validation khi nhập data không hợp lệ @SB_SET_PMS_STR_17`, async ({ conf }) => {
    //1. Để trống Stripe account
    await paymentProviderPage.activatingStripeGateway(conf.caseConf.blank_stripe_account);
    await paymentProviderPage.waitUntilElementVisible("(//div[@class= 's-form-item__error'])[1]");
    const isPublicKeyRequired = await paymentProviderPage.isErrorMessageDisplayed("* Public Key", "Field is required");
    const isPrivateKeyRequired = await paymentProviderPage.isErrorMessageDisplayed("* Secret Key", "Field is required");

    expect(isPublicKeyRequired).toBeTruthy();
    expect(isPrivateKeyRequired).toBeTruthy();

    //2. Nhập Stripe account không tồn tại
    await paymentProviderPage.enterStripeAccount(conf.caseConf.invalid_stripe_account);
    await paymentProviderPage.clickOnBtnWithLabel("+ Add account");
    await paymentProviderPage.waitForNoticeMessage("The API credentials are invalid. Please check them again.");
  });

  test("Kiểm tra active cổng Stripe thành công khi nhập account hợp lệ @TC_SB_SET_PMS_STR_1", async () => {
    await paymentProviderPage.activatingStripeGateway(stripeAccount, accountName);
    await paymentProviderPage.waitForNoticeMessage("Activated successfully");
    await paymentProviderPage.waitForAccountNameDisplayed(accountName, true);
    actPaymentStatus = await paymentProviderPage.getStatusByAccountName(accountName);
    expect(actPaymentStatus).toEqual(expPaymentStatus);
    // Remove acc test
    await paymentProviderPage.expandGatewayEditingForm(accountName);
    await paymentProviderPage.removeAccountSetting(accountName);
  });

  /**
   * Edit Stripe account
   */
  test("Edit thông tin cổng không thành công khi nhập Stripe account không tồn tại @SB_SET_PMS_STR_23", async () => {
    await paymentProviderPage.expandGatewayEditingForm(accountName);
    await paymentProviderPage.enterStripeAccount(stripeAccount);
    await paymentProviderPage.saveAccountSetting(accountName);
    await paymentProviderPage.waitForNoticeMessage("The API credentials are invalid. Please check them again.");
  });

  test(`Edit Stripe account thành công khi nhập Statement descriptor và Stripe account hợp lệ
        @SB_SET_PMS_STR_3`, async () => {
    await paymentProviderPage.enterStripeAccount(stripeAccount);
    await paymentProviderPage.saveAccountSetting(accountName);
    await paymentProviderPage.waitForNoticeMessage("All changes was successfully saved");
  });

  /**
   * Deactive Stripe account
   */

  test("Kiểm tra deactive cổng Stripe thành công @SB_SET_PMS_STR_4", async ({ conf }) => {
    // Activate cổng stripe
    const accountDeactive = conf.caseConf.account_deactive;
    await paymentProviderPage.activatingStripeGateway(conf.suiteConf.stripe_account, accountDeactive);
    await paymentProviderPage.waitForNoticeMessage("Activated successfully");
    // Verify deactive cổng Stripe
    await paymentProviderPage.expandGatewayEditingForm(accountDeactive);
    await paymentProviderPage.deactivateAccountSetting(accountDeactive);
    await paymentProviderPage.waitForNoticeMessage("Deactivated successfully");
    actPaymentStatus = await paymentProviderPage.getStatusByAccountName(accountDeactive);
    expect(actPaymentStatus).toEqual(expPaymentStatus);
    // Remove acc test
    await paymentProviderPage.removeAccountSetting(accountDeactive);
  });

  test("Remove Stripe account thành công @SB_SET_PMS_STR_8", async ({ conf }) => {
    // Activate cổng stripe
    const accountRemove = conf.caseConf.account_remove;
    await paymentProviderPage.activatingStripeGateway(conf.suiteConf.stripe_account, accountRemove);
    await paymentProviderPage.waitForNoticeMessage("Activated successfully");
    // Verify Remove cổng Stripe
    await paymentProviderPage.expandGatewayEditingForm(accountRemove);
    await paymentProviderPage.removeAccountSetting(accountRemove);
    await paymentProviderPage.waitForNoticeMessage("Delete successfully");
    await paymentProviderPage.waitForAccountNameDisplayed(accountRemove, false);
    await expect(
      paymentProviderPage.page.locator(paymentProviderPage.getLocatorAccountName(accountRemove)),
    ).not.toBeVisible();
  });
});
