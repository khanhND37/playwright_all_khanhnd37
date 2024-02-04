import { expect, test } from "@core/fixtures";
import { AccountPage } from "@pages/dashboard/accounts";

/**
 * Code name: `TS_SB_DASHBOARD_01`
 * Description: Test suite này demo case login vào shopbase dashboard và chọn store có position 1
 * Test case `TC_SB_DB_LGIN_01`:
      - Before/Setup:
        - open browser
        - read config
      - Steps:
        - Visit https://accounts.shopbase.com
        - Input: [email protected] to text field with placeholder = [email protected]
        - Input: <password> to text field with selector placeholder="Password"
        - Click to button with the selector button:has-text("Sign in")
        - Wait for the page to load
        - Select shop at the position number 1
        - Wait for the page to load
      - After/Teardown:
        - close browser
* External links: https://docs.ocg.to/books/qa-training/page/3-ocg-autopilot-examples/11043#bkmrk-basic
 */
test.describe("Login to ShopBase and select one shop to go @TS_SB_DASHBOARD_01", async () => {
  test("Login and verify @TC_SB_DB_LGIN_001", async ({ page, conf }) => {
    const accountPage = new AccountPage(page, conf.suiteConf.accounts_domain);
    await test.step("Login to the accounts page", async () => {
      await accountPage.login({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
    });

    await test.step("Choose shop to login", async () => {
      await accountPage.selectShopByName(conf.caseConf.shop_name);
    });

    await test.step("Verify if we are landing to the right store", async () => {
      expect(await page.locator(`(//p[@class='text-truncate font-12'])[1]`).textContent()).toBe(conf.caseConf.domain);
    });
  });

  test("Use dashboard fixture and verify if we are landed to shop's dashboard @TC_SB_DB_LGIN_02", async ({
    dashboard,
    conf,
  }) => {
    await test.step("Verify if we are landing to the right store", async () => {
      expect(await dashboard.locator(`(//p[@class='text-truncate font-12'])[1]`).textContent()).toBe(
        conf.caseConf.shop_domain,
      );
    });
  });

  test("Use account fixture and verify if we are landed to shop's dashboard @TC_SB_DB_LGIN_03", async ({
    account,
    conf,
  }) => {
    const accountPage = new AccountPage(account, conf.suiteConf.domain);

    await test.step("Choose shop to login", async () => {
      await accountPage.selectShopByName(conf.caseConf.shop_name);
    });

    await test.step("Verify if we are landing to the right store", async () => {
      expect(await account.locator(`(//p[@class='text-truncate font-12'])[1]`).textContent()).toBe(
        conf.caseConf.shop_domain,
      );
    });
  });
});
