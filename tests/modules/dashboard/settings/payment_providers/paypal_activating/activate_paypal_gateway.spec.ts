import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import { loadData } from "@core/conf/conf";

test.describe("Verify activating paypal gateway by paypal key successfully", () => {
  const caseName = "SET_PMS_PP_01";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(({ actions: action, case_id: caseID }) => {
    test(`Activate paypal gateway by paypal key successfully for case @${caseID}`, async ({ dashboard, conf }) => {
      // prepaid data for
      const { domain, secret_key: secretKey, client_id: clientId, account_name: accountName } = conf.suiteConf as never;

      const dashboardPage = new DashboardPage(dashboard, domain);
      const paymentProviders = new PaymentProviderPage(dashboard, domain);

      await test.step("Buyer open dashboard and navigate to payment methods page", async () => {
        await dashboardPage.navigateToMenu("Settings");
        await dashboardPage.navigateToSectionInSettingPage("Payment providers");
      });

      if (action == "Activate") {
        await test.step("Activate gateway successfully with all valid credentials", async () => {
          await paymentProviders.activePaypalGatewayByKey(accountName, clientId, secretKey);
          expect(await paymentProviders.getStatusOfAccount(accountName)).toEqual(`Active`);
        });
      }

      if (action == "Deactivate") {
        await test.step("Deactivate gateway successfully and do not change any credentials info", async () => {
          await paymentProviders.expandGatewayEditingForm(accountName);
          await paymentProviders.clickOnDeactivateByAccount(accountName);
          expect(await paymentProviders.getStatusOfAccount(accountName)).toEqual(`Inactive`);
        });
      }

      if (action == "Reactivate") {
        await test.step("Reactivate paypal payment gateway without changing", async () => {
          await paymentProviders.expandGatewayEditingForm(accountName);
          await paymentProviders.clickOnReactivateByAccount(accountName);
          expect(await paymentProviders.getStatusOfAccount(accountName)).toEqual(`Active`);
        });
      }

      if (action == "Remove") {
        await test.step("Remove paypal gateway successfully", async () => {
          await paymentProviders.expandGatewayEditingForm(accountName);
          await paymentProviders.clickOnRemoveAccount(accountName);
          await expect(await paymentProviders.getAccByGateway("PayPal", accountName)).toBeHidden();
        });
      }
    });
  });
});
