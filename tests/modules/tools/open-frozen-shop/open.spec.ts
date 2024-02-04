import { test } from "@core/fixtures";
import { HiveShop } from "@pages/hive/hiveShop";
import { Dev } from "./open";

test.setTimeout(10 * 60 * 1000);
test.slow();

test.describe("Open frozen store", () => {
  test("Open frozen store @SB_TOOL_01", async ({ hiveSBase, conf, page }) => {
    const suiteConf = conf.suiteConf as Dev;
    // Go to hive
    const hiveShop = new HiveShop(hiveSBase, suiteConf.hive_domain);

    for (const user of suiteConf.users) {
      await hiveShop.goToFrozenShopByUserId(user.id);
      const shops = await hiveShop.getShopInTable();
      // eslint-disable-next-line no-console
      console.log(`Got ${shops.length} frozen shop`);

      for (let i = 0; i < shops.length; i++) {
        const shop = shops[i];
        // eslint-disable-next-line no-console
        console.log(`Start un-frozen for shop ${shop.domain}`);

        // login to shop (only first time)
        await page.goto(`https://${shop.domain}/admin`);

        if (i === 0) {
          await page.waitForSelector('//input[@id="email"]', { timeout: 30000 });
          await page.locator('//input[@id="email"]').fill(user.email);
          await page.locator('//input[@id="password"]').fill(user.password);

          await Promise.all([page.waitForNavigation(), page.locator('button:has-text("Sign in")').click()]);
        }

        // un-frozen
        const iframeCardNumber = "//div[contains(@id, 'cc-number')]//iframe";
        const iframeExpries = "//div[contains(@id, 'cc-expiration')]//iframe";
        const iframeCVC = "//div[contains(@id, 'cc-cvv')]//iframe";
        const inputCardNumber = "//input[contains(@id, 'credit-card-number')]";
        const inputExpries = "//input[contains(@id, 'expiration') and contains(@placeholder, 'MM / YY')]";
        const inputCVC = "//input[contains(@id, 'cvv') and contains(@placeholder, 'CVC')]";

        await page.frameLocator(iframeCardNumber).locator(inputCardNumber).fill(suiteConf.card_test.number);
        await page.frameLocator(iframeExpries).locator(inputExpries).fill(suiteConf.card_test.expire);
        await page.frameLocator(iframeCVC).locator(inputCVC).fill(suiteConf.card_test.cvv);
        const xpath = `(//*[normalize-space()='Confirm' and contains(@class, 'button')])[1]`;
        await page.locator(xpath).scrollIntoViewIfNeeded();
        // eslint-disable-next-line playwright/no-wait-for-timeout
        await page.waitForTimeout(1 * 1000);
        await page.click(xpath);
        await page.waitForLoadState("networkidle");
        // TODO: wait for response url https://gapi.dev.shopbase.net/v1/payment/payment-method
        // if !200 -> retry 2 -> 3 time
        // idea: dung condition race
        await page.waitForURL(
          `https://${shop.domain}/admin/settings/account?identify_shop_status=active&shop_id=${shop.id}&isShowSuccessChangePlan=true`,
          { timeout: 50 * 1000 },
        );
        // logout
      }
    }

    // Foreach: user in users
    // --> go to hive shop list & filter frozen store by user_id & status
    // eslint-disable-next-line max-len
    // ----> ex: https://hive.dev.shopbase.net/admin/app/shop/list?filter%5Bstatus%5D%5Bvalue%5D=frozen&filter%5Buser__id%5D%5Bvalue%5D=73800&filter%5B_per_page%5D=256

    // login as user

    // --> foreach: shop in fronzen_shops
    // ----> go to accounts page, click shop
    // ----> fill card number & confirm

    // tests/modules/dashboard/balance/charge_sub/frozen_store.spec.ts
  });
});
