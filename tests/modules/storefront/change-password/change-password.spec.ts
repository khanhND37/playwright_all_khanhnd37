import { expect, test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { snapshotDir } from "@utils/theme";
import { ChangePassword } from "@pages/dashboard/change-password";
import { SFHome } from "@pages/storefront/homepage";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { generateRandomMailToThisEmail } from "@core/utils/mail";

test.describe("Check Change password on Ecommerce store", async () => {
  let webBuilder: WebBuilder, themeId: number, changePassword: ChangePassword, block: Blocks;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    changePassword = new ChangePassword(dashboard, conf.suiteConf.domain);
    themeId = conf.suiteConf.theme_id;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "change_password" });
  });

  test(`@SB_DP_DPSF_SP_13 Check Block Change password không thể add từ Insert panel`, async ({ dashboard, conf }) => {
    await test.step(`Search "Change password" trên insert panel`, async () => {
      await dashboard.locator(changePassword.xpathInsertPanel).click();
      await webBuilder.searchbarTemplate.waitFor({ state: "visible" });
      await webBuilder.searchbarTemplate.fill(conf.caseConf.text_fill);
      await expect(webBuilder.genLoc(changePassword.xpathEmptyResult)).toBeVisible();
    });
  });

  test(`@SB_DP_DPSF_SP_14 Check không thể ẩn, xóa, duplicate block Change password`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    block = new Blocks(dashboard, conf.suiteConf.domain);
    let blockId: string;
    let sectionId: string;

    await test.step(`Click vào block Change password`, async () => {
      await dashboard.locator(`//p[contains(text(),'Change password')]`).click();
      sectionId = await block.getAttrsDataId();
      await expect(dashboard.locator(changePassword.xpathDeleteSectionBtn)).toBeHidden();
      await webBuilder.frameLocator.locator(changePassword.xpathChangePasswordBlock).click();
      blockId = await block.getAttrsDataId();
      await webBuilder.frameLocator.locator(changePassword.xpathQuickBar).waitFor({ state: "visible" });

      //Verify Quick bar của block không có các setting Hide, Duplicate, Delete
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: changePassword.xpathQuickBar,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${conf.caseConf.snapshot}`,
      });
      await expect(dashboard.locator(changePassword.xpathDeleteBlockBtn)).toBeHidden();
    });

    await test.step(`Click vào button Layers trên Header, hover vào block Change password`, async () => {
      await dashboard.locator("//button[@name='Layer']").click();
      await dashboard.locator(`//p[contains(text(),'Change password')]`).hover();
      await expect(
        dashboard.locator(`//div[@data-id='${sectionId}']//button[contains(@data-block-action, "visible")]`).first(),
      ).toBeHidden();
      await dashboard.locator(`//div[@data-id='${blockId}']`).hover();
      await expect(
        dashboard.locator(`//div[@data-id='${blockId}']//button[contains(@data-block-action, "visible")]`),
      ).toBeHidden();
    });
  });

  test(`@SB_DP_DPSF_SP_15 Check chỉnh sửa các setting common của block Change password`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const account = conf.caseConf.account;

    await test.step(`Precondition: sign in an account`, async () => {
      await changePassword.signIn(conf.suiteConf.domain, account.email, account.pass, dashboard);
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "change_password" });
    });

    await test.step(`Chỉnh sửa các setting common theo input data`, async () => {
      const settings = conf.caseConf.styles;
      for (const index in settings) {
        await webBuilder.frameLocator.locator(changePassword.xpathChangePasswordBlock).click();
        const setting = settings[index];
        await webBuilder.changeDesign(setting);
        await changePassword.clickSaveBtn();

        //Verify WB
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: changePassword.xpathChangePasswordSection,
          iframe: webBuilder.iframe,
          snapshotName: `${process.env.ENV}-common-setting-change-password-${index}-WB.png`,
        });

        // Verify SF
        const preview = await changePassword.previewOnSF();
        try {
          await preview.goto(`https://${conf.suiteConf.domain}/my-profile/change-password`);
        } catch (error) {
          await preview.reload();
        }
        await preview.waitForLoadState("networkidle");
        await snapshotFixture.verifyWithAutoRetry({
          page: preview,
          selector: changePassword.xpathChangePasswordSection,
          snapshotName: `${process.env.ENV}-common-setting-change-password-${index}-sf.png`,
        });
        await preview.close();
      }
    });
  });

  test(`@SB_DP_DPSF_SP_16 Check UI Change password page trên desktop`, async ({ dashboard, conf, snapshotFixture }) => {
    const account = conf.caseConf.account;

    await test.step(`Precondition: setting UI default block change password and sign in an account`, async () => {
      //Precondition: setting default block Change password
      await webBuilder.frameLocator.locator(changePassword.xpathChangePasswordBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await changePassword.clickSaveBtn();

      //Precondition: Sign in an account
      await changePassword.signIn(conf.suiteConf.domain, account.email, account.pass, dashboard);
    });

    await test.step(`Đi đến SF Change password page`, async () => {
      //View SF
      try {
        await dashboard.goto(`https://${conf.suiteConf.domain}/my-profile/change-password`);
      } catch (error) {
        await dashboard.reload();
      }
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: changePassword.xpathChangePasswordSection,
        snapshotName: `${process.env.ENV}-UI-change-password-sf.png`,
      });
      await expect(dashboard.locator(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();
    });

    await test.step(`Nhập current password, new password và confirm new password`, async () => {
      await dashboard.locator(changePassword.xpathCurrentPassword).fill(account.pass);
      await dashboard.locator(changePassword.xpathPassword).fill(conf.caseConf.new_password);
      await dashboard.locator(changePassword.xpathConfirmPassword).fill(conf.caseConf.new_password);

      //Verify các password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: changePassword.xpathChangePasswordSection,
        snapshotName: `${process.env.ENV}-change-password-encrypted-password.png`,
      });
      await expect(dashboard.locator(changePassword.xpathUpdatePasswordBtn)).toBeEnabled();
    });

    await test.step(`Click icon eye`, async () => {
      await dashboard.locator(changePassword.xpathEyeIconCurrentPassword).click();
      await dashboard.locator(changePassword.xpathEyeIconNewPassword).click();
      await dashboard.locator(changePassword.xpathEyeIconCfPassword).click();

      //Verify password và cf password hiển thị dưới dạng thường
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: changePassword.xpathChangePasswordSection,
        snapshotName: `${process.env.ENV}-change-password-original-password.png`,
      });
    });

    await test.step(`Click icon eye lần nữa`, async () => {
      await dashboard.locator(changePassword.xpathEyeIconCurrentPassword).click();
      await dashboard.locator(changePassword.xpathEyeIconNewPassword).click();
      await dashboard.locator(changePassword.xpathEyeIconCfPassword).click();

      //Verify password và cf password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: changePassword.xpathChangePasswordSection,
        snapshotName: `${process.env.ENV}-change-password-encrypted-password.png`,
      });
    });
  });

  test(`@SB_DP_DPSF_SP_17 Check change password tại Change password Page trên desktop`, async ({ dashboard, conf }) => {
    test.slow();

    const email = generateRandomMailToThisEmail();
    const account = conf.caseConf.account;

    await test.step(`Precondition: setting UI default block change password, sign up and sign in an account `, async () => {
      //Setting default block Change password
      await webBuilder.frameLocator.locator(changePassword.xpathChangePasswordBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await changePassword.clickSaveBtn();

      //Sign up an account
      await changePassword.signUpAnAccount(conf.suiteConf.domain, email, account.pass, dashboard);

      //Sign in an account
      await changePassword.signIn(conf.suiteConf.domain, email, account.pass, dashboard);
    });

    await test.step(`1. Điền current password, new password và confirm new password không hợp lệ 2. Click button Update password`, async () => {
      //Bỏ trống các trường
      try {
        await dashboard.goto(`https://${conf.suiteConf.domain}/my-profile/change-password`);
      } catch (error) {
        await dashboard.reload();
      }
      await dashboard.waitForLoadState("networkidle");
      await expect(dashboard.locator(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();
      await dashboard.locator(changePassword.xpathCurrentPassword).fill(account.pass);
      await expect(dashboard.locator(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();
      await dashboard.locator(changePassword.xpathPassword).fill(conf.caseConf.new_password);
      await expect(dashboard.locator(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();

      //Nhập sai current password
      await changePassword.changePassword(
        conf.caseConf.new_password,
        conf.caseConf.new_password,
        conf.caseConf.new_password,
        dashboard,
      );
      expect(await dashboard.locator(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_current_pass_incorrect,
      );
      await dashboard.locator(changePassword.xpathMessage).waitFor({ state: "hidden" });

      //Nhập new password và confirm new password ít hơn 6 ký tự
      await changePassword.changePassword(
        account.pass,
        conf.caseConf.wrong_password,
        conf.caseConf.wrong_password,
        dashboard,
      );
      expect(await dashboard.locator(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_wrong_format_pass,
      );
      await dashboard.locator(changePassword.xpathMessage).waitFor({ state: "hidden" });

      //Nhập cf password không trùng new password
      await changePassword.changePassword(account.pass, conf.caseConf.new_password, account.pass, dashboard);
      expect(await dashboard.locator(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_cf_password_does_not_match,
      );
      await dashboard.locator(changePassword.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Điền current password, new password và confirm new password hợp lệ > Click button Update password`, async () => {
      //Điền new password trùng với current password
      await changePassword.changePassword(account.pass, account.pass, account.pass, dashboard);
      expect(await dashboard.locator(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_change_password_success,
      );
      await dashboard.locator(changePassword.xpathMessage).waitFor({ state: "hidden" });
      await expect(dashboard.locator(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();
      await dashboard.locator(changePassword.xpathMyAccount).click();
      await dashboard.getByRole("button", { name: "Log out" }).click();
      await dashboard.waitForLoadState("networkidle");
      expect(await dashboard.locator(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_logout_success,
      );
      await dashboard.locator(changePassword.xpathMessage).waitFor({ state: "hidden" });
      await changePassword.signIn(conf.suiteConf.domain, email, account.pass, dashboard);

      //Điền new password khác với current password
      try {
        await dashboard.goto(`https://${conf.suiteConf.domain}/my-profile/change-password`);
      } catch (error) {
        await dashboard.reload();
      }
      await dashboard.waitForLoadState("networkidle");
      await changePassword.changePassword(
        account.pass,
        conf.caseConf.new_password,
        conf.caseConf.new_password,
        dashboard,
      );
      expect(await dashboard.locator(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_change_password_success,
      );
      await dashboard.locator(changePassword.xpathMessage).waitFor({ state: "hidden" });
      await expect(dashboard.locator(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();
    });

    await test.step(`Log out > đến trang sign in > Login với pasword cũ`, async () => {
      await dashboard.locator(changePassword.xpathMyAccount).click();
      await dashboard.getByRole("button", { name: "Log out" }).click();
      await dashboard.waitForLoadState("networkidle");
      expect(await dashboard.locator(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_logout_success,
      );
      await dashboard.locator(changePassword.xpathMessage).waitFor({ state: "hidden" });

      await dashboard.locator(changePassword.xpathEmail).fill(email);
      await dashboard.locator(changePassword.xpathPassword).fill(account.pass);
      await dashboard.locator(changePassword.xpathSignInBtn).click();
      await dashboard.waitForLoadState("networkidle");
      expect(await dashboard.locator(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_email_or_pass_incorrect,
      );
      await dashboard.locator(changePassword.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Login với pasword mới`, async () => {
      await changePassword.signIn(conf.suiteConf.domain, email, conf.caseConf.new_password, dashboard);
    });
  });

  test(`@SB_DP_DPSF_SP_18 Check UI Change password page trên mobile`, async ({ conf, pageMobile, snapshotFixture }) => {
    const changePassMobile = new SFHome(pageMobile, conf.suiteConf.domain);
    const account = conf.caseConf.account;

    await test.step(`Precondition: setting UI default block change password and sign in an account`, async () => {
      //Setting default block Change password
      await webBuilder.switchMobileBtn.click();
      await webBuilder.frameLocator.locator(changePassword.xpathChangePasswordBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await changePassword.clickSaveBtn();

      //Sign in an account
      await changePassword.signIn(conf.suiteConf.domain, account.email, account.pass, changePassMobile.page);
    });

    await test.step(`Đi đến SF Change password page`, async () => {
      //View SF
      try {
        await changePassMobile.page.goto(`https://${conf.suiteConf.domain}/my-profile/change-password`);
      } catch (error) {
        await changePassMobile.page.reload();
      }
      await changePassMobile.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: changePassMobile.page,
        selector: changePassword.xpathChangePasswordSection,
        snapshotName: `${process.env.ENV}-UI-change-password-sf-mobile.png`,
      });
      await expect(changePassMobile.genLoc(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();
    });

    await test.step(`Nhập current password, new password và confirm new password`, async () => {
      await changePassMobile.genLoc(changePassword.xpathCurrentPassword).fill(account.pass);
      await changePassMobile.genLoc(changePassword.xpathPassword).fill(conf.caseConf.new_password);
      await changePassMobile.genLoc(changePassword.xpathConfirmPassword).fill(conf.caseConf.new_password);

      //Verify các password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: changePassMobile.page,
        selector: changePassword.xpathChangePasswordSection,
        snapshotName: `${process.env.ENV}-change-password-encrypted-password-mobile.png`,
      });
      await expect(changePassMobile.genLoc(changePassword.xpathUpdatePasswordBtn)).toBeEnabled();
    });

    await test.step(`Click icon eye`, async () => {
      await changePassMobile.genLoc(changePassword.xpathEyeIconCurrentPassword).click();
      await changePassMobile.genLoc(changePassword.xpathEyeIconNewPassword).click();
      await changePassMobile.genLoc(changePassword.xpathEyeIconCfPassword).click();

      //Verify password và cf password hiển thị dưới dạng thường
      await snapshotFixture.verifyWithAutoRetry({
        page: changePassMobile.page,
        selector: changePassword.xpathChangePasswordSection,
        snapshotName: `${process.env.ENV}-change-password-original-password-mobile.png`,
      });
    });

    await test.step(`Click icon eye lần nữa`, async () => {
      await changePassMobile.genLoc(changePassword.xpathEyeIconCurrentPassword).click();
      await changePassMobile.genLoc(changePassword.xpathEyeIconNewPassword).click();
      await changePassMobile.genLoc(changePassword.xpathEyeIconCfPassword).click();

      //Verify password và cf password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: changePassMobile.page,
        selector: changePassword.xpathChangePasswordSection,
        snapshotName: `${process.env.ENV}-change-password-encrypted-password-mobile.png`,
      });
    });
  });

  test(`@SB_DP_DPSF_SP_19 Check change password tại Change password Page trên mobile`, async ({ pageMobile, conf }) => {
    test.slow();

    const changePassMobile = new SFHome(pageMobile, conf.suiteConf.domain);
    const email = generateRandomMailToThisEmail();
    const account = conf.caseConf.account;

    await test.step(`Precondition: setting UI default block change password, sign up and sign in an account `, async () => {
      //Setting default block Change password
      await webBuilder.frameLocator.locator(changePassword.xpathChangePasswordBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await changePassword.clickSaveBtn();

      //Sign up an account
      await changePassword.signUpAnAccount(conf.suiteConf.domain, email, account.pass, changePassMobile.page);

      //Sign in an account
      await changePassword.signIn(conf.suiteConf.domain, email, account.pass, changePassMobile.page);
    });

    await test.step(`1. Điền current password, new password và confirm new password không hợp lệ 2. Click button Update password`, async () => {
      //Bỏ trống các trường
      try {
        await changePassMobile.page.goto(`https://${conf.suiteConf.domain}/my-profile/change-password`);
      } catch (error) {
        await changePassMobile.page.reload();
      }
      await changePassMobile.page.waitForLoadState("networkidle");
      await expect(changePassMobile.genLoc(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();
      await changePassMobile.genLoc(changePassword.xpathCurrentPassword).fill(account.pass);
      await expect(changePassMobile.genLoc(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();
      await changePassMobile.genLoc(changePassword.xpathPassword).fill(conf.caseConf.new_password);
      await expect(changePassMobile.genLoc(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();

      //Nhập sai current password
      await changePassword.changePassword(
        conf.caseConf.new_password,
        conf.caseConf.new_password,
        conf.caseConf.new_password,
        changePassMobile.page,
      );
      expect(await changePassMobile.genLoc(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_current_pass_incorrect,
      );
      await changePassMobile.genLoc(changePassword.xpathMessage).waitFor({ state: "hidden" });

      //Nhập new password và confirm new password ít hơn 6 ký tự
      await changePassword.changePassword(
        account.pass,
        conf.caseConf.wrong_password,
        conf.caseConf.wrong_password,
        changePassMobile.page,
      );
      expect(await changePassMobile.genLoc(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_wrong_format_pass,
      );
      await changePassMobile.genLoc(changePassword.xpathMessage).waitFor({ state: "hidden" });

      //Nhập cf password không trùng new password
      await changePassword.changePassword(
        account.pass,
        conf.caseConf.new_password,
        account.pass,
        changePassMobile.page,
      );
      expect(await changePassMobile.genLoc(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_cf_password_does_not_match,
      );
      await changePassMobile.genLoc(changePassword.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Điền current password, new password và confirm new password hợp lệ > Click button Update password`, async () => {
      //Điền new password trùng với current password
      await changePassword.changePassword(account.pass, account.pass, account.pass, changePassMobile.page);
      expect(await changePassMobile.genLoc(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_change_password_success,
      );
      await changePassMobile.genLoc(changePassword.xpathMessage).waitFor({ state: "hidden" });
      await expect(changePassMobile.genLoc(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();
      await changePassMobile.genLoc(changePassword.xpathMyAccount).click();
      await changePassMobile.page.getByRole("button", { name: "Log out" }).click();
      await changePassMobile.page.waitForLoadState("networkidle");
      expect(await changePassMobile.genLoc(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_logout_success,
      );
      await changePassMobile.genLoc(changePassword.xpathMessage).waitFor({ state: "hidden" });
      await changePassword.signIn(conf.suiteConf.domain, email, account.pass, changePassMobile.page);

      //Điền new password khác với current password
      try {
        await changePassMobile.page.goto(`https://${conf.suiteConf.domain}/my-profile/change-password`);
      } catch (error) {
        await changePassMobile.page.reload();
      }
      await changePassMobile.page.waitForLoadState("networkidle");
      await changePassword.changePassword(
        account.pass,
        conf.caseConf.new_password,
        conf.caseConf.new_password,
        changePassMobile.page,
      );
      expect(await changePassMobile.genLoc(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_change_password_success,
      );
      await changePassMobile.genLoc(changePassword.xpathMessage).waitFor({ state: "hidden" });
      await expect(changePassMobile.genLoc(changePassword.xpathUpdatePasswordBtn)).toBeDisabled();
    });

    await test.step(`Log out > đến trang sign in > Login với pasword cũ`, async () => {
      //Log out
      await changePassMobile.genLoc(changePassword.xpathMyAccount).click();
      await changePassMobile.page.getByRole("button", { name: "Log out" }).click();
      await changePassMobile.page.waitForLoadState("networkidle");
      expect(await changePassMobile.genLoc(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_logout_success,
      );
      await changePassMobile.genLoc(changePassword.xpathMessage).waitFor({ state: "hidden" });

      //Sign in
      await changePassMobile.genLoc(changePassword.xpathEmail).fill(email);
      await changePassMobile.genLoc(changePassword.xpathPassword).fill(account.pass);
      await changePassMobile.genLoc(changePassword.xpathSignInBtn).click();
      await changePassMobile.page.waitForLoadState("networkidle");
      expect(await changePassMobile.genLoc(changePassword.xpathMessage).innerText()).toContain(
        conf.caseConf.message_email_or_pass_incorrect,
      );
      await changePassMobile.genLoc(changePassword.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Login với pasword mới`, async () => {
      await changePassword.signIn(conf.suiteConf.domain, email, conf.caseConf.new_password, changePassMobile.page);
    });
  });
});
