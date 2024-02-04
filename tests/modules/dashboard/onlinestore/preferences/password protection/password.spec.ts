import { expect, test } from "@core/fixtures";
import { SFHome } from "@sf_pages/homepage";
import { loadData } from "@core/conf/conf";
import { BrowserContext, Page } from "@playwright/test";

const verifyRedirectPassword = async (
  page: Page,
  domain: string,
  enable: boolean,
  context: BrowserContext,
  redirectURL: string,
) => {
  let currentTab = page;
  const selector = ".li-online-store .mdi-open-in-new";
  await page.locator(selector).scrollIntoViewIfNeeded();
  const [newTab] = await Promise.all([context.waitForEvent("page"), page.locator(selector).click()]);
  currentTab = newTab;
  if (redirectURL == "/") {
    await expect(currentTab).toHaveURL(`https://${domain}/`);
  } else {
    await expect(currentTab).toHaveURL(new RegExp(redirectURL));
  }
};

test.describe("Verify password page", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    const shopDomain = conf.suiteConf.domain;
    await dashboard.goto(`https://${shopDomain}/admin/preferences`);
    await dashboard.waitForLoadState("networkidle");
    await dashboard.waitForSelector(".nav-sidebar");
    await dashboard.waitForSelector(".page-preferences");
  });

  const conf = loadData(__dirname, "SB_OLS_PFR_1");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const data = conf.caseConf.data[i];

    test(`${data.description} @${data.case_id}`, async ({ dashboard, page, conf, context }) => {
      const shopDomain = conf.suiteConf.domain;
      const enablePassWord = data.input.enable_password;
      await dashboard.locator("#password-protection").scrollIntoViewIfNeeded();
      const checkboxState = await dashboard.isChecked("#password-protection .s-check");

      if (checkboxState !== enablePassWord) {
        await dashboard.setChecked("#password-protection .s-check", enablePassWord);
        await dashboard.waitForSelector(".save-setting-content");
        await dashboard.locator(".btn-primary").click();
        await dashboard.waitForLoadState("networkidle");
      }

      if (data.expect.redirect_url) {
        await verifyRedirectPassword(dashboard, shopDomain, enablePassWord, context, data.expect.redirect_url);
      }

      if (data.expect.current_url) {
        const navigationPage = new SFHome(page, shopDomain);
        await navigationPage.gotoHomePage();
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(new RegExp(data.expect.current_url));
      }
    });
  }

  const conf1 = loadData(__dirname, "SB_OLS_PFR_2");
  for (let i = 0; i < conf1.caseConf.data.length; i++) {
    const data = conf1.caseConf.data[i];

    test(`${data.description} @${data.case_id}`, async ({ dashboard, page, conf }) => {
      await dashboard.locator("#password-protection").scrollIntoViewIfNeeded();
      const checkboxState = await dashboard.isChecked("#password-protection .s-check");
      const checkPassWord = data.input.enable_password;
      if (checkboxState !== checkPassWord) {
        await dashboard.setChecked("#password-protection .s-check", checkPassWord);
        await dashboard.waitForSelector(".save-setting-content");
        await dashboard.locator(".btn-primary").click();
        await dashboard.waitForLoadState("networkidle");
      }

      await test.step("Fill password on SF", async () => {
        const navigationPage = new SFHome(page, conf.suiteConf.domain);
        await navigationPage.gotoHomePage();
        await page.waitForLoadState("networkidle");
        const passWordSF = data.input.pw_storefront;
        const passWordDB = data.input.pw_dashboard;
        await page.locator(".password-page__login-form input.empty").fill(passWordSF);
        await page.click(".btn-primary");

        if (passWordDB != passWordSF) {
          await expect(page.locator(".password-page__error")).toBeVisible();
        } else {
          const productName = data.input.product_name;
          const customerInfo = data.input.customer_info;

          await test.step("Checkout product", async () => {
            await page.waitForLoadState("networkidle");
            const iconSearch = await page.waitForSelector(".search-bar");
            await iconSearch.waitForElementState("stable");
            await navigationPage.searchThenViewProduct(productName);
            const productPage = await navigationPage.searchThenViewProduct(productName);
            await productPage.addProductToCart();
            const checkout = await productPage.navigateToCheckoutPage();
            await checkout.enterShippingAddress(customerInfo);
            await checkout.completeOrderWithMethod();
            await expect(page).toHaveURL(new RegExp(data.expect.checkout_url));
          });
        }
      });
    });
  }
});
