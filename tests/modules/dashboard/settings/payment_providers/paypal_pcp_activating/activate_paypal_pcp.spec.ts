// // Feature off

// import { expect, test } from "@core/fixtures";
// import { DashboardPage } from "@pages/dashboard/dashboard";
// import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
// import { loadData } from "@core/conf/conf";

// test.describe("Verify activating paypal gateway by paypal key successfully", async () => {
//   const caseName = "TC_SET_PMS_PCP_01";
//   const conf = loadData(__dirname, caseName);
//   // for each data, will do tests
//   conf.caseConf.data.forEach(({ actions: action, case_id: caseID }) => {
//     test(`@${caseID} Activate paypal gateway by paypal pcp successfully for case`, async ({ page, conf }) => {
//       // prepare data for
//       const { domain, acount_name } = conf.suiteConf as never;

//       const dashboardPage = new DashboardPage(page, domain);
//       const paymentProviders = new PaymentProviderPage(page, domain);
//       const paypalAccount = conf.suiteConf.paypal_account;

//       await test.step("Buyer open dashboard and navigate to payment methods page", async () => {
//         await dashboardPage.navigateToMenu("Settings");
//         await dashboardPage.navigateToSectionInSettingPage("Payment providers");
//       });

//       if (action == "Activate") {
//         await test.step("Activate gateway successfully with all valid credentials", async () => {
//           await paymentProviders.activatePayPalPCPGateway();
//           await paymentProviders.enterPCPAccount(paypalAccount);
//           expect(await paymentProviders.getStatusOfAccount(acount_name)).toEqual(`Active`);
//         });
//       }

//       if (action == "Deactivate") {
//         await test.step("Deactivate gateway successfully and do not change any credentials info", async () => {
//           await paymentProviders.expandGatewayEditingForm(acount_name);
//           await paymentProviders.clickOnDeactivateByAccount(acount_name);
//           expect(await paymentProviders.getStatusOfAccount(acount_name)).toEqual(`Inactive`);
//         });
//       }

//       if (action == "Reactivate") {
//         await test.step("Reactivate paypal payment gateway without changing", async () => {
//           await paymentProviders.expandGatewayEditingForm(acount_name);
//           await paymentProviders.clickOnReactivateByAccount(acount_name);
//           expect(await paymentProviders.getStatusOfAccount(acount_name)).toEqual(`Active`);
//         });
//       }

//       if (action == "Remove") {
//         await test.step("Remove paypal gateway successfully", async () => {
//           await paymentProviders.expandGatewayEditingForm(acount_name);
//           await paymentProviders.clickOnRemoveAccount(acount_name);
//           await expect(await paymentProviders.getAccByGateway("PayPal", acount_name)).toBeHidden();
//         });
//       }
//     });
//   });
// });
