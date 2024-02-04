import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { AccountPage } from "@pages/dashboard/accounts";
import { Captcha } from "@pages/dashboard/captcha";

test.describe.serial("Sign up new account and verify with captcha", async () => {
  const caseName = "TC_SB_AU_CAPTCHA_1";
  const conf = loadData(__filename, caseName);
  const api = conf.suiteConf.api;
  const domain = conf.suiteConf.domain;
  const xSbCaptcha = conf.suiteConf.xSbCaptcha;
  const xSbFpHash = conf.suiteConf.xSbFpHash;
  const xShopbaseAccessToken = conf.suiteConf.xShopbaseAccessToken;

  conf.caseConf.data.forEach(
    ({ username: username, password: password, store_name: store, status: status }, i: number) => {
      test(`Verify sign up captcha needed in case @TC_SB_AU_CAPTCHA_1 with iterator ${i}`, async ({
        page,
        request,
      }) => {
        const timeStamp = Date.now();

        const captcha = new Captcha(page, domain);
        const service = await captcha.getServiceInfo(domain, api, request);

        const signUp = await captcha.getSignUpResponseStatusCode(
          xSbCaptcha,
          xSbFpHash,
          xShopbaseAccessToken,
          username,
          password,
          timeStamp,
          store,
          api,
          request,
        );

        if (signUp.status() == 200) {
          const accountPage = new AccountPage(page, conf.suiteConf.domain);

          await test.step("Sign up a new account in case security", async () => {
            if (!("" == username)) {
              username += timeStamp + "@beeketing.net";
            }
            if (!("" == store)) {
              store += "_" + timeStamp;
            }

            await accountPage.signUpSecurity(username, password, store, true);
          });

          await test.step(`Verify sign up status "${status}"`, async () => {
            await expect(page.locator(`//h1[contains(@class, 'fs-large')]`)).toHaveText(status);
          });
        } else {
          const accountPage = new AccountPage(page, conf.suiteConf.domain);

          await test.step("Sign up a new account in case security", async () => {
            if (!("" == username)) {
              username += "+" + timeStamp + "@beeketing.net";
            }
            if (!("" == store)) {
              store += "_" + timeStamp;
            }

            await accountPage.signUpSecurity(username, password, store, true);
          });

          await test.step(`Verify captcha confirm pop-up is displayed`, async () => {
            if ("geetest" === service) {
              await expect(page.locator("//div[contains(@class, 'geetest_panel_box')]")).toBeVisible();
            } else {
              await expect(page.locator("(//div[contains(@class, 'grecaptcha-badge')]//iframe)[1]")).toBeVisible();
            }
          });
        }
      });
    },
  );
});

test.describe.serial(`Create a new store and verify with captcha`, async () => {
  const caseName = "TC_SB_AU_CAPTCHA_6";
  const conf = loadData(__filename, caseName);
  const timeStamp = Date.now();
  const api = conf.suiteConf.api;
  const domain = conf.suiteConf.domain;

  conf.caseConf.data.forEach(({ username: username, password: password, store_name: store }) => {
    test(`Create a new store and verify captcha needed in case @TC_SB_AU_CAPTCHA_6`, async ({ page, request }) => {
      const captcha = new Captcha(page, domain);
      const service = await captcha.getServiceInfo(domain, api, request);

      const accountPage = new AccountPage(page, domain);

      await test.step(`Open domain and login Shopbase account`, async () => {
        await accountPage.signInSecurity(username, password, true);
      });

      await test.step(`Click on Add a new shop`, async () => {
        await page.click("//button[normalize-space()='Add a new shop']");
      });

      await test.step(`Enter new shop name`, async () => {
        await page.locator("//input[@placeholder='Your shop name']").fill(store + "_" + timeStamp);
      });

      await test.step(`Click on Create button `, async () => {
        await page.click("(//button[normalize-space(text()='Create')])[1]");
      });

      await test.step(`Verify captcha confirm pop-up is displayed`, async () => {
        if ("geetest" === service) {
          await expect(page.locator("//div[contains(@class, 'geetest_panel_box')]")).toBeVisible();
        } else {
          await expect(page.locator("(//div[contains(@class, 'grecaptcha-badge')]//iframe)[1]")).toBeVisible();
        }
      });
    });
  });
});

test.describe.serial(`Create a new staff and verify with captcha`, async () => {
  const caseName = "TC_SB_AU_CAPTCHA_8";
  const conf = loadData(__filename, caseName);
  const timeStamp = Date.now();

  conf.caseConf.data.forEach(({ shop: shopDomain, username: username, password: password, staff: staff }) => {
    test(`Create a new staff and verify captcha needed in case @TC_SB_AU_CAPTCHA_8`, async ({ page, request }) => {
      const captcha = new Captcha(page, shopDomain);
      const service = await captcha.getServiceInfo(conf.suiteConf.domain, conf.suiteConf.api, request);

      const accountPage = new AccountPage(page, shopDomain);

      await test.step(`Open shop domain and login account`, async () => {
        await accountPage.login({
          email: username,
          password: password,
        });
      });

      await test.step(`Go to Settings page`, async () => {
        await page.locator("(//*[contains(@href, '/admin/settings') or normalize-space()='Settings'])[1]").click();
        await page.waitForLoadState("load");
      });

      await test.step(`Go to Account page`, async () => {
        await page
          .locator("(//*[contains(@href, '/admin/settings/account') or normalize-space()='Account'])[1]")
          .click();
        await page.waitForLoadState("load");
      });

      await test.step("Delete staff account if needed", async () => {
        const count = await page.locator("//*[contains(text(),'Full access')]").count();
        if (count == 5) {
          await page.locator("(//a[contains(@href,'admin/settings/account/')])[6]").click();
          await page.locator("//button[normalize-space()='Delete staff account']").click();
          await page.locator("//input[@placeholder='Password']").fill(password);
          await page.locator("//button[normalize-space()='Confirm']").click();
        }
      });

      await test.step(`Click on Add staff account`, async () => {
        await page.click("//a[normalize-space()='Add staff account']");
      });

      await test.step(`Enter staff email`, async () => {
        await page.locator('input[type="text"]').fill(staff + "+" + timeStamp + "@beeketing.net");
      });

      await test.step(`Click on Send invite button`, async () => {
        await page.locator('button:has-text("Send invite")').nth(1).click();
        await new Promise(wait => setTimeout(wait, 3000));
      });

      await test.step(`Verify captcha confirm pop-up is displayed`, async () => {
        if ("geetest" === service) {
          await expect(page.locator("//div[contains(@class, 'geetest_panel_box')]")).toBeVisible();
        } else {
          await expect(page.locator("(//div[contains(@class, 'grecaptcha-badge')]//iframe)[1]")).toBeVisible();
        }
      });
    });
  });
});
