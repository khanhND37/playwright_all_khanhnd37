import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { waitTimeout } from "@core/utils/api";
import { snapshotDir, waitSelector } from "@core/utils/theme";
import { MyAccountPage } from "@pages/shopbase_creator/storefront/my_accounts";
import { MyAccountAPI } from "@pages/shopbase_creator/storefront/my_account_api";
import { MailBox } from "@pages/thirdparty/mailbox";

test.describe("Verify buyer sign in My product screen @TS_SB_DP_SF_SP", async () => {
  let myAccountPage: MyAccountPage;
  let changePassAPI: MyAccountAPI;
  let mailBox: MailBox;
  let token: string;
  let pass: string;
  let actualStatus: boolean;
  let resetPasswordPage: MyAccountPage;

  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });
  const caseName1 = "SB_DP_SF_SP_7";
  const conf1 = loadData(__filename, caseName1);
  conf1.caseConf.data.forEach(
    ({
      current_pass: currentPass,
      password: password,
      new_pass: newPass,
      confirm_pass: confirmPasss,
      message: message,
      is_success: isSuccess,
      testcase_id: id,
    }) => {
      test(`Verify luồng Change password @SB_DP_SF_SP_7 với trường hợp: ${id}`, async ({ conf, page, request }) => {
        myAccountPage = new MyAccountPage(page, conf.suiteConf.domain);
        changePassAPI = new MyAccountAPI(conf.suiteConf.domain, request);

        await test.step("Click avatar > chọn Change password", async () => {
          await myAccountPage.login(conf.suiteConf.username, password);
          await myAccountPage.gotoChangePassPage();
          expect(await page.getAttribute(myAccountPage.xpathBtnUpdatePassword, "class")).toContain("disable");
        });

        await test.step("Nhập data: current, new, confirm password", async () => {
          await myAccountPage.changePass(currentPass, newPass, confirmPasss);
          await expect(page.locator(myAccountPage.getXpathToastMessage(message))).toBeEnabled();
          //verify sign in process after change password
          pass = isSuccess ? newPass : password;
        });

        await test.step("Log out về màn Sign in > Nhập email, pass mới > Click Sign in", async () => {
          await myAccountPage.logOut();
          await myAccountPage.login(conf.suiteConf.username, pass);
          await expect(page.locator(myAccountPage.xpathTitleMyProductsPage)).toBeEnabled();
        });
      });
    },
  );

  const caseName2 = "SB_DP_SF_SP_10";
  const conf2 = loadData(__filename, caseName2);
  conf2.caseConf.data.forEach(
    ({ current_pass: currentPass, password: password, new_pass: newPass, testcase_id: id }) => {
      test(`Verify luồng Change password by API(check với case lỗi hệ thống) @SB_DP_SF_SP_10 với trường hợp: ${id}`, async ({
        conf,
        page,
        request,
      }) => {
        myAccountPage = new MyAccountPage(page, conf.suiteConf.domain);

        await test.step("Sign in vào digital storefront", async () => {
          await myAccountPage.login(conf.suiteConf.username, password);
          //get customer token
          token = await myAccountPage.page.evaluate(() => window.localStorage.getItem("customerToken"));
        });

        await test.step("Click button Update password", async () => {
          changePassAPI = new MyAccountAPI(conf.suiteConf.domain, request);
          actualStatus = await changePassAPI.statusChangePasswordByAPI(currentPass, newPass, token);
          //verify sign in process after change password
          await myAccountPage.logOut();
          await myAccountPage.inputAndClickSignIn(conf.suiteConf.username, newPass);
          if (actualStatus === true) {
            await expect(page.locator(myAccountPage.xpathTitleMyProductsPage)).toBeEnabled();
          } else {
            await expect(page.locator(myAccountPage.xpathMessageLoginError)).toBeVisible();
          }
        });
      });
    },
  );

  test(`Verify luồng Forgot password @SB_DP_SF_SP_4`, async ({ page, conf, snapshotFixture }) => {
    myAccountPage = new MyAccountPage(page, conf.suiteConf.domain);
    const messages = conf.caseConf.messages;
    await test.step(`Click hyperlink Forgot Password?`, async () => {
      await myAccountPage.goToForgotPassScreen();
      await expect(myAccountPage.genLoc(myAccountPage.xpathTitleResetPassword)).toBeVisible();
    });

    await test.step(`Nhập email không tồn tại > click Submit`, async () => {
      await waitSelector(myAccountPage.page, myAccountPage.xpathBtnSubmit);
      await myAccountPage.inputEmail(conf.caseConf.mail_not_exist);
      const errMsg = await myAccountPage.getToastMsg();
      expect(errMsg).toEqual(messages.msg_not_exist_account);
    });

    await test.step(`Nhập email đã tồn tại > click Submit`, async () => {
      await myAccountPage.inputEmail(conf.caseConf.mail_exist);
      const message = await myAccountPage.getMsgNotiSentEmail();
      expect(message).toEqual(messages.msg_noti_sent_email);
      await expect(myAccountPage.genLoc(myAccountPage.xpathBtnBackToLogin)).toBeVisible();
      //wait to receive password reset email
      await waitTimeout(20 * 1000);
      mailBox = await myAccountPage.openMailBox(conf.caseConf.mail_exist);
      await mailBox.openResetPassMail();
      const mailContent = await mailBox.getMailContent();
      expect(mailContent).toContain(conf.caseConf.mail_content);
    });

    await test.step(`Từ mail đã nhận email Reset Password, click btn Reset Your Password`, async () => {
      const [newTab] = await Promise.all([
        mailBox.page.waitForEvent(`popup`),
        mailBox.page
          .frameLocator(`//iframe[@id='html_msg_body']`)
          .locator(myAccountPage.xpathBtnResetPasswordOnMail)
          .click(),
      ]);
      resetPasswordPage = new MyAccountPage(newTab, conf.suiteConf.domain);
      await newTab.waitForLoadState();
      await snapshotFixture.verify({
        page: newTab,
        selector: resetPasswordPage.xpathFormLogin,
        snapshotName: `reset_pass_screen.png`,
        snapshotOptions: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.1,
          maxDiffPixels: 2000,
        },
      });
    });

    await test.step(`Nhập trường Password, Confirm Pass > Click button Reset password`, async () => {
      for (let i = 0; i < conf.caseConf.data.length; i++) {
        const data = conf.caseConf.data[i];
        await resetPasswordPage.resetPass(data.new_password, data.confirm_password);
        const errMsg = await resetPasswordPage.getToastMsg();
        expect(errMsg).toEqual(data.msg);
        await waitTimeout(7 * 1000);
      }
    });

    await test.step(`Click btn Reset Your Password của Email cũ (đã bị expried) > nhập Password, Confirm password > click button Reset password`, async () => {
      await Promise.all([
        mailBox.page
          .frameLocator(`//iframe[@id='html_msg_body']`)
          .locator(resetPasswordPage.xpathBtnResetPasswordOnMail)
          .click(),
      ]);
      await resetPasswordPage.resetPass(conf.caseConf.data[2].new_password, conf.caseConf.data[2].confirm_password);
      const errMsg = await resetPasswordPage.getToastMsg();
      expect(errMsg).toEqual(messages.msg_reset_err);
    });

    await test.step(`Nhập email > nhập password mới ( sau khi Reset pass thành công) > click Sign in`, async () => {
      await resetPasswordPage.goto(`/sign-in`);
      await resetPasswordPage.genLoc(resetPasswordPage.xpathSignInBtn).isEnabled();
      await resetPasswordPage.inputAndClickSignIn(conf.caseConf.mail_exist, conf.caseConf.new_password);
      await expect(resetPasswordPage.genLoc(resetPasswordPage.xpathTitleMyProductsPage)).toBeVisible();
    });
  });
});
