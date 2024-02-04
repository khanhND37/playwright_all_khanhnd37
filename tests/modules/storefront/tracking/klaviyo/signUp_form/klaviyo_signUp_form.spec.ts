import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { MarketingAndSales } from "@pages/dashboard/marketing_and_sales";
import { SFHome } from "@pages/storefront/homepage";

test.describe.serial(`Verify Klaviyo sign up form on storefront`, async () => {
  const caseName = "signUp_form";
  const conf = loadData(__dirname, caseName);
  const timeStamp = Math.floor(Date.now() / 1000);
  conf.caseConf.data.forEach(
    (
      { test_case_id: id, public_api_key: publicApiKey, is_exists: isExists, customer_email: customerEmail },
      i: number,
    ) => {
      customerEmail += timeStamp + "@mailinator.com";
      test(`Verify submit email through Klaviyo sign up form in case @TC_${id} with iterator ${i}`, async ({
        dashboard,
      }) => {
        let mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
        const storefront = new SFHome(dashboard, conf.suiteConf.domain);

        await test.step(`Open dashboard and navigate to menu Marketing and Sales`, async () => {
          await mktnSales.openKlaviyoChannelOnDashboard(conf.suiteConf.sub_menu, conf.suiteConf.channel);
        });
        await test.step(`Enter Public API Key`, async () => {
          await mktnSales.enterKlaviyoApiKey(`public`, publicApiKey);
        });
        await test.step(`Open storefront`, async () => {
          await storefront.gotoHomePage();
        });
        await test.step(`Enter customer email to Klaviyo Sign up form`, async () => {
          await storefront.enterCustomerEmailToKlaviyoSignUpForm(customerEmail);
          mktnSales = new MarketingAndSales(dashboard, conf.suiteConf.domain);
        });
        await test.step(`Open dashboard and navigate to Customers page`, async () => {
          await mktnSales.openCustomersOnDashboard();
        });
        await test.step(`Enter customer email in search field`, async () => {
          await mktnSales.enterCustomerEmailInSearchField(customerEmail);
        });
        await test.step(`Verify Customer is existed in Customer list`, async () => {
          if (!isExists) {
            await expect(
              dashboard.locator(`//div[contains(text(),'Could not find any customers matching')]`),
            ).toBeEnabled();
          } else {
            dashboard.locator(`//tr[1]`).click();
            expect(dashboard.locator(`(//*[normalize-space()='${customerEmail}'])[1]`)).toBeDefined();
          }
        });
      });
    },
  );
});
