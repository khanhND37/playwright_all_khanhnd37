import { expect, test } from "@core/fixtures";
import { MyAccountPage } from "@pages/shopbase_creator/storefront/my_accounts";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";

test.describe("Verify buyer sign in My account screen @SB_DP_SF_SP", async () => {
  test(`Verify luồng Sign in @SB_DP_SF_SP_3 `, async ({ page, conf }) => {
    const myProductPage = new MyProductPage(page, conf.suiteConf.domain);
    await test.step("Click menu Account > Click Sign in", async () => {
      await myProductPage.gotoSignInPage();
      expect(await myProductPage.genLoc(myProductPage.xpathInputEmail).inputValue()).toEqual("");
      expect(await myProductPage.genLoc(myProductPage.xpathInputPassword).inputValue()).toEqual("");
    });

    for (let i = 0; i < conf.caseConf.data_login_fail.length; i++) {
      const data = conf.caseConf.data_login_fail[i];
      await test.step(`${data.description}`, async () => {
        await myProductPage.inputAndClickSignIn(data.email, data.password);
        await expect(myProductPage.genLoc(myProductPage.xpathErrorMessage)).toHaveText(data.message);
      });
    }

    await test.step("Login thành công", async () => {
      await myProductPage.inputAndClickSignIn(conf.suiteConf.username, conf.suiteConf.password);
      await expect(myProductPage.genLoc(myProductPage.xpathMessage)).toHaveText("You are logged in!");
      await expect(myProductPage.genLoc(myProductPage.xpathMyAvatar)).toBeVisible();
    });
  });

  test("Verify luồng sign in qua link URL @SB_DP_SF_SP_9", async ({ page, conf }) => {
    const myProductPage = new MyProductPage(page, conf.suiteConf.domain);
    const path = conf.caseConf.path;
    const domain = conf.suiteConf.domain;
    await test.step("Truy cập link khi chưa sign in: https://{domain digital}/my-profile/change-password", async () => {
      await page.goto(`https://${domain}/${path}`);
      expect(await myProductPage.genLoc(myProductPage.xpathInputEmail).inputValue()).toEqual("");
      expect(await myProductPage.genLoc(myProductPage.xpathInputPassword).inputValue()).toEqual("");
    });

    await test.step("Nhập Email, password và click btn Sign in", async () => {
      await myProductPage.inputAndClickSignIn(conf.suiteConf.username, conf.suiteConf.password);
      expect(page.url()).toContain(`/${path}`);
    });
  });

  test("Verify luồng log out @SB_DP_SF_SP_5", async ({ page, conf }) => {
    const myAccount = new MyAccountPage(page, conf.suiteConf.domain);
    await myAccount.login(conf.suiteConf.username, conf.suiteConf.password);

    await test.step("Click avatar > chọn Log out-> verify thông tin hiển thị", async () => {
      await myAccount.genLoc(myAccount.xpathAvatar).click();
      await myAccount.openMenuItemPage(conf.caseConf.menu_item);
      await expect(myAccount.genLoc(myAccount.xpathTitleSignIn)).toHaveText("Sign in");
      expect(await myAccount.genLoc(myAccount.xpathInputEmail).inputValue()).toEqual("");
      expect(await myAccount.genLoc(myAccount.xpathInputPassword).inputValue()).toEqual("");
    });
  });
});
