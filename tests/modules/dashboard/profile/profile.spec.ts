import { expect, test } from "@core/fixtures";
import { Mailinator } from "@helper/mailinator";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { HiveUsers } from "@pages/hive/shopbase/hive_users";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import { ProfilePage } from "@pages/dashboard/profile";
import { getMailinatorInstanceWithProxy } from "@utils/mail";

let mailinator: Mailinator;

test.describe("Visit Merchant profile @TS_SB_PROF_01", () => {
  let paymentProviderPage: PaymentProviderPage;
  // let emailExpected, phoneExpected;
  let hiveDomain, dashboardPage: DashboardPage, hiveUsers: HiveUsers, profilePage: ProfilePage;
  test.beforeEach(async ({ dashboard, conf, hiveSBase }) => {
    test.setTimeout(300000);
    hiveDomain = conf.suiteConf.hive_domain;
    hiveUsers = new HiveUsers(hiveSBase, hiveDomain);
    profilePage = new ProfilePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    paymentProviderPage = new PaymentProviderPage(dashboard, conf.suiteConf.domain);
    await dashboardPage.navigateToMenu("Home");
  });

  test(`Kiểm tra giao diện popup OTP khi change số điện thoại @SB_AU_OTP_OTP_New_Flow_9`, async ({ conf, page }) => {
    await test.step(`Kiểm tra trang Account khi ở bên ngoài feature switch
	 - Goto: https://au-otp-testing./admin/userprofile
	 - Thay đổi số điện thoại sang một số điện thoại valid bất kỳ
	 - Clieck button Save`, async () => {
      await profilePage.goto();

      const phoneUser = `${Date.now() % 1e9}`;

      await profilePage.changeInformationUser("Phone", phoneUser);
      await profilePage.clickButtonSaveChanged();
      //  Login hive to get otp code from event log
      await hiveUsers.goToUsersEventLogs(conf.suiteConf.user_id);

      let otpValue = await hiveUsers.getCodeEventLogs();

      if (otpValue.length <= 0) {
        /**
         *  wait and click change method
         */
        await profilePage.clickToChangeMethod();

        // Goto mailinator to get otp code
        mailinator = await getMailinatorInstanceWithProxy(page);
        await mailinator.accessMail(conf.suiteConf.mail_read_code);
        await expect(mailinator.subjectFirstPath).toContainText(conf.caseConf.subject_mail);
        await mailinator.readMail(conf.caseConf.subject_mail);
        otpValue = await mailinator.getTextBelowEmail("please enter the below verification code to proceed");
      }

      await profilePage.actionWithPopupOtp(conf.suiteConf.password, otpValue);

      await expect(dashboardPage.isToastMsgVisible(conf.caseConf.toast_msg_success)).toBeTruthy();
    });
  });
  test(`Kiểm tra trường hợp Change email @SB_AU_OTP_OTP_New_Flow_10`, async ({ conf, dashboard, page }) => {
    await test.step(`Kiểm tra change email đối với trường hợp nhập thành công OTP từ số điện thoại đối với số điện thoại đã được Verified
     - Goto: https://au-otp-testing./admin/userprofile
     - Change email (tùy ý đổi)
     - Nhập password + OTP đúng được nhận từ số điện thoại
     - Click button Confirm`, async () => {
      await profilePage.goto();
      const emailChanged = `${conf.suiteConf.prefix_email}+${Date.now() % 1e3}@beeketing.net`;

      await profilePage.changeInformationUser("Email", emailChanged);

      await profilePage.clickButtonSaveChanged();

      await hiveUsers.goToUsersEventLogs(conf.suiteConf.user_id);

      const otpValue = await hiveUsers.getCodeEventLogs();

      await profilePage.actionWithPopupOtp(conf.suiteConf.password, otpValue);

      await expect(dashboardPage.isToastMsgVisible(conf.caseConf.toast_msg_success)).toBeTruthy();
    });
    await test.step(`Kiểm tra change email đối với trường hợp nhập thành công OTP từ email đối với số điện thoại đã được Verified
     - Goto: https://au-otp-testing./admin/userprofile
     - Change email (tùy ý đổi)
     - Wait 1p để enable button resend
     - Show popup nhập password và OTP, wait 1p để enable button resend OTP, click texlink chuyển confirm OTP sang email
     - Nhập OTP đúng được nhận từ email
     - Click button Confirm`, async () => {
      await dashboard.waitForTimeout(5000);
      await dashboard.reload();
      await dashboard.waitForLoadState("load");

      const emailChanged = `${conf.suiteConf.prefix_email}+${Date.now() % 1e3}@beeketing.net`;
      await profilePage.changeInformationUser("Email", emailChanged);
      await profilePage.clickButtonSaveChanged();

      await profilePage.clickToChangeMethod();

      mailinator = await getMailinatorInstanceWithProxy(page);
      await mailinator.accessMail(conf.suiteConf.mail_read_code);
      const subjectFirstEmail = await mailinator.getSubjectFirstMail();

      do {
        await mailinator.reloadWithTimeout(3000);
      } while (!subjectFirstEmail.includes(conf.caseConf.subject_mail));
      await expect(mailinator.subjectFirstPath).toContainText(conf.caseConf.subject_mail);
      await mailinator.readMail(conf.caseConf.subject_mail);
      const otpCode = await mailinator.getTextBelowEmail(conf.caseConf.text_below_email);

      await profilePage.actionWithPopupOtp(conf.suiteConf.password, otpCode);
      await expect(dashboardPage.isToastMsgVisible(conf.caseConf.toast_msg_success)).toBeTruthy();
    });
    await test.step(`Revert email to original`, async () => {
      await profilePage.goto();

      await profilePage.changeInformationUser("Email", conf.suiteConf.username);

      await profilePage.clickButtonSaveChanged();

      await hiveUsers.goToUsersEventLogs(conf.suiteConf.user_id);

      const otpValue = await hiveUsers.getCodeEventLogs();

      await profilePage.actionWithPopupOtp(conf.suiteConf.password, otpValue);
    });
  });

  //  TC _14
  test(`Kiểm tra update account payout trong dashboard Balance @SB_AU_OTP_OTP_New_Flow_14`, async ({
    conf,
    dashboard,
    page,
  }) => {
    await test.step(`Kiểm tra update payout account đối với số điện thoại đã được verify và confirm bằng OTP gửi về số điện thoại - Goto: https://au-otp-testing./admin/balace - Click button Edit account payout - Update account payout (tùy ý update) - Click Save - Nhập đúng OTP vào textbox - Click button Confirm`, async () => {
      const emailPayout = `${conf.suiteConf.prefix_email}+${Date.now() % 1000}@beeketing.net`;
      await profilePage.editAndUpdatePayout("Paypal", emailPayout);
      await hiveUsers.goToUsersEventLogs(conf.suiteConf.user_id);

      const otpValue = await hiveUsers.getCodeEventLogs();

      await profilePage.actionWithPopupOtp("", otpValue);

      await expect(dashboardPage.isToastMsgVisible(conf.caseConf.toast_msg_success)).toBeTruthy();
    });
    await test.step(`Kiểm tra update payout account đối với số điện thoại đã được verify và confirm bằng OTP gửi về email - Goto: https://au-otp-testing./admin/balace - Click button Edit account payout - Update account payout (tùy ý update) - Click Save - Show popup OTP, wait 1p để enable button resend - Click vào textlink để change nhận OTP qua email - Click button Confirm`, async () => {
      await dashboard.waitForTimeout(5000);
      await dashboard.reload();

      const emailPayout = `${conf.suiteConf.prefix_email}+${Date.now() % 1000}@beeketing.net`;
      await profilePage.editAndUpdatePayout("Paypal", emailPayout);

      /**
       *  wait and click change method
       */
      await profilePage.clickToChangeMethod();

      // Goto mailinator to get otp code
      mailinator = await getMailinatorInstanceWithProxy(page);
      await mailinator.accessMail(conf.suiteConf.mail_read_code);
      const subjectFirstEmail = await mailinator.getSubjectFirstMail();

      do {
        await mailinator.reloadWithTimeout(3000);
      } while (!subjectFirstEmail.includes(conf.caseConf.subject_mail));
      await expect(mailinator.subjectFirstPath).toContainText(conf.caseConf.subject_mail);
      await mailinator.readMail(conf.caseConf.subject_mail);
      const otpCode = await mailinator.getTextBelowEmail("please enter the below verification code to proceed");

      /**
       * Fill Otp code to form popup
       * */
      await profilePage.actionWithPopupOtp("", otpCode);
      await expect(dashboardPage.isToastMsgVisible(conf.caseConf.toast_msg_success)).toBeTruthy();
    });
  });

  // TC_16
  test(`Kiểm tra Enable Account Shopbase payment trong payment provider @SB_AU_OTP_OTP_New_Flow_16`, async ({
    dashboard,
    conf,
    page,
  }) => {
    await test.step(`Kiểm tra enable account ShopBase payments đối với số điện thoại đã được verify và confirm bằng OTP gửi về số điện thoại
   - Goto: https://au-otp-testing./admin/payments
   - Click button Enable ShopBase payment for this store
   - Nhập đúng OTP và click confirm`, async () => {
      await paymentProviderPage.goToPagePaymentProvider();

      await paymentProviderPage.swichToShopbasePayment();
      await hiveUsers.goToUsersEventLogs(conf.suiteConf.user_id);
      let otpValue = await hiveUsers.getCodeEventLogs();

      if (otpValue.length <= 0) {
        /**
         *  wait and click change method
         */
        await profilePage.clickToChangeMethod();

        // Goto mailinator to get otp code
        mailinator = await getMailinatorInstanceWithProxy(page);
        await mailinator.accessMail(conf.suiteConf.mail_read_code);
        const subjectFirstEmail = await mailinator.getSubjectFirstMail();

        do {
          await mailinator.reloadWithTimeout(3000);
        } while (!subjectFirstEmail.includes(conf.caseConf.subject_mail));

        await mailinator.readMail(conf.caseConf.subject_mail);
        otpValue = await mailinator.getTextBelowEmail("please enter the below verification code to proceed");
      }

      await dashboard.waitForTimeout(1000);
      await profilePage.actionWithPopupOtp("", otpValue);
      await dashboard.waitForTimeout(3000);
      expect(await dashboard.locator(paymentProviderPage.buttonSwitchSbasePayment).isVisible()).toBe(false);
    });
  });

  // TC_19
  test(`Kiểm tra Add payment trong Third party provider @SB_AU_OTP_OTP_New_Flow_19`, async ({
    page,
    conf,
    dashboard,
  }) => {
    await test.step(`Kiểm tra add account Stripe (trường hợp không dùng API key) đối với số điện thoại đã được verify và confirm bằng OTP gửi về số điện thoại
     - Goto: https://au-otp-testing./admin/payments
     - Click button Choose third-party provider
     - Click Stripe
     - Click Add account
     - Nhập đúng OTP và click confirm`, async () => {
      await paymentProviderPage.goToPagePaymentProvider();

      await paymentProviderPage.selectThirdPartyProvider("Stripe");
      await page.waitForLoadState("load");

      await paymentProviderPage.clickAddAccountBtn();

      await hiveUsers.goToUsersEventLogs(conf.suiteConf.user_id);
      let otpValue = await hiveUsers.getCodeEventLogs();

      if (otpValue.length <= 0) {
        await profilePage.clickToChangeMethod();

        mailinator = await getMailinatorInstanceWithProxy(page);
        await mailinator.accessMail(conf.suiteConf.mail_read_code);
        const subjectFirstEmail = await mailinator.getSubjectFirstMail();

        do {
          await mailinator.reloadWithTimeout(3000);
        } while (!subjectFirstEmail.includes(conf.caseConf.subject_mail));

        await expect(mailinator.subjectFirstPath).toContainText(conf.caseConf.subject_mail);
        await mailinator.readMail(conf.caseConf.subject_mail);
        otpValue = await mailinator.getTextBelowEmail(conf.caseConf.text_contain_email);
      }

      await profilePage.actionWithPopupOtp("", otpValue);

      await dashboard.waitForTimeout(3000);

      await expect(dashboard.url().includes(conf.caseConf.stripe)).toBeTruthy();
    });
    await test.step(`Kiểm tra add account Braintree dùng API key đối với số điện thoại đã được verify và confirm bằng OTP gửi về số điện thoại
     - Goto: https://au-otp-testing./admin/payments
     - Click button Choose third-party provider
     - Click Braintree
     - Click Add account
     - Nhập đúng OTP và click confirm`, async () => {
      await paymentProviderPage.goToPagePaymentProvider();
      await paymentProviderPage.selectThirdPartyProvider("Braintree");
      await dashboard.waitForLoadState("load");

      await paymentProviderPage.enterBraintreeAccount(conf.caseConf.braintree);
      await paymentProviderPage.clickAddAccountBtn();
      await hiveUsers.goToUsersEventLogs(conf.suiteConf.user_id);
      let otpValue = await hiveUsers.getCodeEventLogs();
      if (otpValue.length <= 0) {
        /**
         *  wait and click change method
         */
        await profilePage.clickToChangeMethod();

        // Goto mailinator to get otp code
        mailinator = await getMailinatorInstanceWithProxy(page);
        await mailinator.accessMail(conf.suiteConf.mail_read_code);
        const subjectFirstEmail = await mailinator.getSubjectFirstMail();

        do {
          await mailinator.reloadWithTimeout(3000);
        } while (!subjectFirstEmail.includes(conf.caseConf.subject_mail));

        await mailinator.readMail(conf.caseConf.subject_mail);
        otpValue = await mailinator.getTextBelowEmail(conf.caseConf.text_contain_email);
      }

      await profilePage.actionWithPopupOtp("", otpValue);
      expect(await dashboardPage.isToastMsgVisible(conf.caseConf.toast_msg_success)).toBeTruthy();
    });

    await test.step(`Kiểm tra deactivate account Braintree dùng API key đối với số điện thoại đã được verify và confirm bằng OTP gửi về số điện thoại
   - Goto: https://au-otp-testing./admin/payments
   - Click button Choose third-party provider
   - Click Stripe
   - Click Add account
   - Nhập đúng OTP và click confirm`, async () => {
      await paymentProviderPage.goToPagePaymentProvider();
      await paymentProviderPage.clickFirstAndDeActivateAccountPayment("Braintree");
      await dashboard.waitForTimeout(2000);
      await hiveUsers.goToUsersEventLogs(conf.suiteConf.user_id);
      let otpCode = await hiveUsers.getCodeEventLogs();

      if (!otpCode || otpCode.length <= 0) {
        /**
         *  wait and click change method
         */
        await profilePage.clickToChangeMethod();

        // Goto mailinator to get otp code
        mailinator = await getMailinatorInstanceWithProxy(page);
        await mailinator.accessMail(conf.suiteConf.mail_read_code);
        const subjectFirstEmail = await mailinator.getSubjectFirstMail();

        do {
          await mailinator.reloadWithTimeout(3000);
        } while (!subjectFirstEmail.includes(conf.caseConf.subject_mail));
        await mailinator.readMail(conf.caseConf.subject_mail);
        otpCode = await mailinator.getTextBelowEmail(conf.caseConf.text_contain_email);
      }

      await profilePage.actionWithPopupOtp("", otpCode);

      // Deactivated successfully
      expect(await dashboardPage.isToastMsgVisible(conf.caseConf.toast_msg_deactive)).toBeTruthy();
    });

    await test.step(`Kiểm tra Delete account Braintree dùng API key đối với số điện thoại đã được verify và confirm bằng OTP gửi về số điện thoại
   - Goto: https://au-otp-testing./admin/payments
   - Click button Choose third-party provider
   - Click Stripe
   - Click Add account
   - Nhập đúng OTP và click confirm`, async () => {
      await paymentProviderPage.goToPagePaymentProvider();
      await paymentProviderPage.clickFirstAndDeleteAccountPayment("Braintree");

      await hiveUsers.goToUsersEventLogs(conf.suiteConf.user_id);
      let otpCode = await hiveUsers.getCodeEventLogs();

      if (!otpCode || otpCode.length <= 0) {
        /**
         *  wait and click change method
         */
        await profilePage.clickToChangeMethod();

        // Goto mailinator to get otp code
        mailinator = await getMailinatorInstanceWithProxy(page);
        await mailinator.accessMail(conf.suiteConf.mail_read_code);
        const subjectFirstEmail = await mailinator.getSubjectFirstMail();

        do {
          await mailinator.reloadWithTimeout(3000);
        } while (!subjectFirstEmail.includes(conf.caseConf.subject_mail));
        await mailinator.readMail(conf.caseConf.subject_mail);
        otpCode = await mailinator.getTextBelowEmail(conf.caseConf.text_contain_email);
      }

      await profilePage.actionWithPopupOtp("", otpCode);
      expect(await dashboardPage.isToastMsgVisible(conf.caseConf.msg_deleted)).toBeTruthy();
    });
  });

  // TC_20
  test(`Kiểm tra trường hợp bật tắt các checkbox enable OTP trong trang account @SB_AU_OTP_OTP_New_Flow_20`, async ({
    page,
    conf,
  }) => {
    await test.step(`Kiểm tra untick checkbox đối với số điện thoại đã được verify và confirm bằng OTP gửi về số điện thoại
   - Goto: https://au-otp-testing./admin/userprofile
   - Uncheck 1 hoặc nhiều checkbox setting OTP
   - Click Save
   - Nhập đúng password và OTP vào textbox
   - Click button Confirm`, async () => {
      await profilePage.goto();

      await profilePage.checkAndUpdateOtpSettings(conf.caseConf.checkbox_settings);

      await profilePage.clickButtonSaveChanged();

      // Verify modal verify otp
      await hiveUsers.goToUsersEventLogs(conf.suiteConf.user_id);
      let otpValue = await hiveUsers.getCodeEventLogs();

      if (otpValue.length <= 0) {
        /**
         *  wait and click change method
         */
        await profilePage.clickToChangeMethod();

        // Goto mailinator to get otp code
        mailinator = await getMailinatorInstanceWithProxy(page);
        await mailinator.accessMail(conf.suiteConf.mail_read_code);
        const subjectFirstEmail = await mailinator.getSubjectFirstMail();

        do {
          await mailinator.reloadWithTimeout(3000);
        } while (!subjectFirstEmail.includes(conf.caseConf.subject_mail));

        await mailinator.readMail(conf.caseConf.subject_mail);
        otpValue = await mailinator.getTextBelowEmail(conf.caseConf.text_contain_email);
      }

      await profilePage.actionWithPopupOtp(conf.suiteConf.password, otpValue);
      expect(await dashboardPage.isToastMsgVisible(conf.caseConf.toast_msg_success)).toBeTruthy();
    });
  });

  // TC_23

  test(`Kiểm tra show OTP Balance khi update payout account và tắt checkbox enable OTP @SB_AU_OTP_OTP_New_Flow_23`, async ({
    conf,
    dashboard,
  }) => {
    await test.step(`Kiểm tra trang Balance khi ở bên ngoài feature switch đối với trường hợp update payout account
   - Goto: https://au-otp-testing./admin/balance
   - Add payout account (update gì cx đc vào textbox)
   - Click button save tại save bar hoặc click button save bên cạnh textbox nhập account payout`, async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/balance`);
      const emailPayout = `${conf.suiteConf.prefix_email}+${Date.now() % 1000}@beeketing.net`;
      await profilePage.editAndUpdatePayout("Paypal", emailPayout);

      expect(await dashboardPage.isToastMsgVisible(conf.caseConf.toast_msg_success)).toBeTruthy();
    });
  });

  // TC_25
  test(`Kiểm tra show OTP payment providers khi update Third party provider và tắt checkbox enable OTP @SB_AU_OTP_OTP_New_Flow_25`, async ({
    conf,
    dashboard,
  }) => {
    await test.step(`Kiểm tra trang payment provider ở ngaoif feature switch đối với trường hợp activate account Braintree sử dụng API key
   - Goto: https://au-otp-testing./admin/settings/payments
   - Click button Choose third-party provider
   - Click chọn Braintree
   - Trong màn hình Add new Braintree account, tắt test mode, add API key
   - Click button Add account`, async () => {
      await paymentProviderPage.goToPagePaymentProvider();
      await paymentProviderPage.selectThirdPartyProvider("Braintree");
      await dashboard.waitForLoadState("load");

      await paymentProviderPage.enterBraintreeAccount(conf.caseConf.braintree);

      await paymentProviderPage.clickAddAccountBtn();
      expect(await dashboardPage.isToastMsgVisible(conf.caseConf.toast_msg_success)).toBeTruthy();
    });
  });
});
