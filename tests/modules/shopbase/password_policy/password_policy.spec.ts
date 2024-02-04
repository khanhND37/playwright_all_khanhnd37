import { expect, test } from "@core/fixtures";
import { AccountPage } from "@pages/dashboard/accounts";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProfilePage } from "@pages/dashboard/profile";

test.describe("Password Policy risk Security", async () => {
  let passwordPage: ProfilePage;
  let newPassword: string;
  let message: string;
  let password;
  let domain;
  let invalidPassword;
  let email;
  let accountPage: AccountPage;
  let signinPage: DashboardPage;
  let maxTime: number;

  test("@SB_AU_PPRS_28 Verify trường hợp user thực hiện Change password với Password sai format - Không bao gồm ký tự đặc biệt", async ({
    dashboard,
    conf,
  }) => {
    newPassword = conf.caseConf.new_password;
    message = conf.caseConf.error_message;
    domain = conf.suiteConf.domain;

    await test.step("Nhập password không chứa ký tự đặc biệt", async () => {
      passwordPage = new ProfilePage(dashboard, domain);
      await passwordPage.goto();
      await passwordPage.changePassword(newPassword);
      expect(await passwordPage.isTextVisible(message)).toBeTruthy();
    });
  });

  test("@SB_AU_PPRS_29 Verify trường hợp user thực hiện Change password với Password hợp lệ", async ({
    dashboard,
    conf,
  }) => {
    newPassword = conf.caseConf.new_password;
    domain = conf.suiteConf.domain;
    password = conf.suiteConf.password;
    test.setTimeout(conf.suiteConf.timeout);

    await test.step("Nhập password hợp lệ > Nhập confirm password hợp lệ > Bấm Save changes > Nhập password cũ > Bấm Confirm", async () => {
      passwordPage = new ProfilePage(dashboard, domain);
      await passwordPage.page.waitForSelector(".icon-in-app-notification");
      await passwordPage.goto();
      await passwordPage.changePassword(newPassword, password);
      await passwordPage.waitForElementVisibleThenInvisible(passwordPage.xpathToastMessage);
      await passwordPage.page.waitForTimeout(5000);
      await passwordPage.page.reload();
      await passwordPage.page.waitForLoadState("networkidle", { timeout: 60000 });
      await expect(await passwordPage.isTextVisible("Sign in", 2, 20000)).toBeTruthy();
    });

    await test.step("Login với password mới vừa đổi", async () => {
      signinPage = new DashboardPage(dashboard, domain);
      await signinPage.login({
        userId: conf.suiteConf.user_id,
        shopId: conf.suiteConf.shop_id,
        email: conf.suiteConf.username,
        password: newPassword,
      });
      signinPage.page.waitForLoadState("domcontentloaded");
      await expect(dashboard).toHaveURL(new RegExp(domain, "g"));
    });

    await test.step("Clear data: Đổi về password cũ sau khi change pw thành công", async () => {
      passwordPage = new ProfilePage(dashboard, domain);
      await passwordPage.page.waitForSelector(".icon-in-app-notification");
      await passwordPage.goto();
      await passwordPage.changePassword(password, newPassword);
      await passwordPage.waitForElementVisibleThenInvisible(passwordPage.xpathToastMessage);
      await passwordPage.page.waitForTimeout(5000);
      await passwordPage.page.reload();
      await passwordPage.page.waitForLoadState("networkidle", { timeout: 120000 });
      await expect(await passwordPage.isTextVisible("Sign in", 2, 20000)).toBeTruthy();
    });
  });

  test("@SB_AU_PPRS_30 Verify trường hợp sign in nhập password sai < 5 lần", async ({ page, conf }) => {
    domain = conf.suiteConf.domain;
    email = conf.suiteConf.username;
    invalidPassword = conf.caseConf.invalid_password;
    maxTime = conf.caseConf.max_time;

    await test.step("Nhập email hợp lệ > Nhập password sai > bấm Sign in", async () => {
      accountPage = new AccountPage(page, domain);
      await accountPage.gotoAdmin();
      await accountPage.inputAccountAndSignInNoWait({ email: email, password: invalidPassword });
      await accountPage.page.waitForSelector(accountPage.xpathSigninMessage, { timeout: 2 * 1000 });
      const times = parseInt(
        (await accountPage.genLoc(accountPage.xpathSigninMessage).innerText())
          .replace("Email or password is not valid. ", "")
          .replace("time(s) remaining.", ""),
      );
      expect(times).toBeLessThan(maxTime);
    });
  });
});
