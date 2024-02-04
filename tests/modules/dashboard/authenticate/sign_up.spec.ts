import { expect, test } from "@core/fixtures";
import { AccountPage } from "@pages/dashboard/accounts";
import { loadData } from "@core/conf/conf";

test.describe("Sign up unsuccessful and verify @TS_SB_DASHBOARD_AUTHEN_02", async () => {
  const signUpType = "unsuccessful";
  const conf = loadData(__filename, signUpType);

  conf.caseConf.data.forEach(
    ({ testcaseId: id, email: username, password: password, shopName: store, status: status }) => {
      test(`Sign up and verify in case ${signUpType} @${id}`, async ({ page }) => {
        const accountPage = new AccountPage(page, conf.suiteConf.domain);
        const timeStamp = Date.now();

        await test.step("Sign up a new account", async () => {
          if (!("" == username)) {
            username += timeStamp + "@beeketing.net";
          }
          if (!("" == store)) {
            store += timeStamp;
          }

          await accountPage.signUpSecurity(username, password, store, true);
        });

        await test.step(`Verify sign up status "${status}"`, async () => {
          await expect(page.locator("(//*[normalize-space()='" + status + "'])[1]")).toHaveText(status);
        });
      });
    },
  );
});

test.describe("Sign up successful and verify @TS_SB_DASHBOARD_AUTHEN_02", async () => {
  const signUpType = "successfull";
  const conf = loadData(__filename, signUpType);

  conf.caseConf.data.forEach(
    ({ testcaseId: id, email: username, password: password, shopName: store, status: status }) => {
      test(`Sign up and verify in case ${signUpType} @${id}`, async ({ page }) => {
        const accountPage = new AccountPage(page, conf.suiteConf.domain);
        const timeStamp = Date.now();

        await test.step("Sign up a new account in case security", async () => {
          if (!("" == username)) {
            username += timeStamp + "@beeketing.net";
          }
          if (!("" == store)) {
            store += timeStamp;
          }

          await accountPage.signUpSecurity(username, password, store, true);
        });

        await test.step(`Verify sign up status "${status}"`, async () => {
          await expect(page.locator(`//h1[contains(@class, 'fs-large')]`)).toHaveText(status);
        });
      });
    },
  );
});
