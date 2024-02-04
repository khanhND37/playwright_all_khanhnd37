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
test.describe("Login to ShopBase and select one shop to go <3> @TS_SB_DASHBOARD_01 @PERF", async () => {
  test("Login and verify <3> @TC_SB_DB_LGIN_01 @PERF_03", async ({ page, conf }) => {
    const accountPage = new AccountPage(page, conf.suiteConf.domain);
    /**
     * @Step
     */
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
});
