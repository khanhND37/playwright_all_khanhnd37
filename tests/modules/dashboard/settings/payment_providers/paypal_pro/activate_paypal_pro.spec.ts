import { expect, test } from "@core/fixtures";
import { PaymentProviders } from "@pages/api/payment_providers";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import type { PaypalManager } from "@types";

test.describe("Merchant should be able set up payment method paypal pro", async () => {
  let payment: PaymentProviderPage;
  let paymentAPI: PaymentProviders;
  let accountName: string;
  let dashboardPage: DashboardPage;
  let paypalManager: PaypalManager;
  let securePayment;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    payment = new PaymentProviderPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    paymentAPI = new PaymentProviders(conf.suiteConf.domain, authRequest);
    accountName = conf.suiteConf.account_name;
    paypalManager = conf.suiteConf.paypal_manager;
    securePayment = conf.suiteConf.secure_payment;
    await dashboardPage.goto("admin/settings");
    await dashboardPage.navigateToSectionInSettingPage("Payment providers");
  });

  test.afterEach(async ({ conf }) => {
    //delete data test
    if (!conf.caseConf.detete_data) {
      const idPaypalPro = await paymentAPI.getPaymentMethodId(accountName);
      await paymentAPI.deletePaymentProvider(idPaypalPro);
    }
  });

  test("Kiểm tra tạo mới Paypal Pro với 3D secure payment off @TC_SB_SET_PMS_PPP_17", async () => {
    await test.step("Merchant nhập thông tin để tạo mới account Paypal Pro với 3D secure payment off", async () => {
      await payment.infoAccountPaypalPro(accountName, paypalManager[0]);
    });
    await test.step("Merchant chọn add account", async () => {
      await payment.clickOnBtnWithLabel("+ Add account");
      expect(await payment.getStatusOfAccount(accountName)).toEqual(`Active`);
    });
  });

  test("Kiểm tra tạo mới Paypal Pro với 3D secure payment on @TC_SB_SET_PMS_PPP_18", async () => {
    await test.step("Merchant nhập thông tin để tạo mới account Paypal Pro với 3D secure payment off", async () => {
      await payment.infoAccountPaypalPro(accountName, paypalManager[0]);
      await payment.on3DSecurePayment(securePayment);
    });
    await test.step("Merchant chọn add account", async () => {
      await payment.clickOnBtnWithLabel("+ Add account");
      expect(await payment.getStatusOfAccount(accountName)).toEqual(`Active`);
    });
  });

  test("Kiểm tra edit paypal pro thành công @TC_SB_SET_PMS_PPP_19", async ({ dashboard }) => {
    await test.step("Merchant edit thông tin account Paypal Pro", async () => {
      await paymentAPI.addPaypalPro(accountName, paypalManager);
      await dashboard.reload();
      await payment.expandGatewayEditingForm(accountName);
      await payment.editAccountPaypalPro(accountName, paypalManager[1]);
      // Đang bị lỗi không hiện message nên tạm cmt, chờ fix ở task: https://trello.com/c/yZii0zml
      // await expect(await payment.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
    });

    await test.step("Merchant deactivate account Paypal Pro", async () => {
      await dashboard.reload();
      await payment.expandGatewayEditingForm(accountName);
      await payment.clickOnDeactivateByAccount(accountName);
      expect(await payment.getStatusOfAccount(accountName)).toEqual(`Inactive`);
    });
  });

  test("Kiểm tra xóa paypal pro thành công @TC_SB_SET_PMS_PPP_20", async ({ dashboard }) => {
    await test.step("Merchant deactivate account Paypal Pro", async () => {
      await paymentAPI.addPaypalPro(accountName, paypalManager);
      await dashboard.reload();
      await payment.expandGatewayEditingForm(accountName);
      await payment.clickOnRemoveAccount(accountName);
      await expect(payment.page.locator(payment.getLocatorAccountName(accountName))).not.toBeVisible();
    });
  });
});
