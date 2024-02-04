import { expect, test } from "@core/fixtures";
import { AccountPage } from "@pages/dashboard/accounts";
import { loadData } from "@core/conf/conf";

test.describe.configure({ mode: "parallel" });
test.describe("Test data driven @TS_DD_001", async () => {
  const caseName = "DATA_DRIVEN";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(({ shop_name: shopName, shop_domain: shopDomain }, i: number) => {
    // PLEASE NOTE that the test's title need to be unique, so ${i} should be added
    test(`Login and verify ${caseName} with iterator ${i}`, async ({ page }) => {
      const accountPage = new AccountPage(page, conf.suiteConf.domain);
      await test.step("Login to the accounts page", async () => {
        await accountPage.login({
          email: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
      });
      await test.step("Choose shop to login", async () => {
        await accountPage.selectShopByName(shopName);
      });
      await test.step("Verify if we are landing to the right store", async () => {
        expect(await page.locator("(//p[@class='text-truncate font-12'])[1]").textContent()).toBe(shopDomain);
      });
    });
  });

  const caseName1 = "DATA_DRIVEN_CUSTOM_SHOP";
  const conf1 = loadData(__dirname, caseName1);
  conf1.caseConf.data.forEach(data => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    test(`Multiple shop in data driven with fixture @${data.case_id}`, async ({ dashboard }) => {
      // eslint-disable-next-line no-console
      console.log("Supported run multiple shop in data driven with fixture");
    });
  });
});
