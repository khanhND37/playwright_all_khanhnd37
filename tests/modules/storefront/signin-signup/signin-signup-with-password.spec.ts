import { expect, test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { snapshotDir } from "@utils/theme";
import { SignInSignUpWithPass } from "@pages/dashboard/signin-signup-with-password";
import { generateRandomMailToThisEmail } from "@core/utils/mail";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { MailBox } from "@pages/thirdparty/mailbox";

test.describe("Check Sign up on Ecommerce store", async () => {
  let webBuilder: WebBuilder, themeId: number, signInSignUp: SignInSignUpWithPass, block: Blocks, mailBox: MailBox;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    signInSignUp = new SignInSignUpWithPass(dashboard, conf.suiteConf.domain);
    themeId = conf.suiteConf.theme_id;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "sign_up" });
  });

  test(`@SB_NEWECOM_SISU_02 Check Block Sign up không thể add từ Insert panel`, async ({ dashboard, conf }) => {
    await test.step(`Search "Sign up" trên insert panel`, async () => {
      await dashboard.locator(signInSignUp.xpathInsertPanel).click();
      await webBuilder.searchbarTemplate.waitFor({ state: "visible" });
      await webBuilder.searchbarTemplate.fill(conf.caseConf.text_fill);
      await expect(webBuilder.genLoc(signInSignUp.xpathEmptyResult)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_SISU_03 Check không thể ẩn, xóa, duplicate block Sign up`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    block = new Blocks(dashboard, conf.suiteConf.domain);
    let blockId: string;
    let sectionId: string;
    await test.step(`Click vào block Sign up`, async () => {
      await dashboard.locator(`//p[contains(text(),'Sign up')]`).click();
      sectionId = await block.getAttrsDataId();
      await expect(dashboard.locator(signInSignUp.xpathDeleteSectionBtn)).toBeHidden();
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignUpBlock).click();
      blockId = await block.getAttrsDataId();
      await webBuilder.frameLocator.locator(signInSignUp.xpathQuickBar).waitFor({ state: "visible" });

      //Verify Quick bar của block không có các setting Hide, Duplicate, Delete
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathQuickBar,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${conf.caseConf.snapshot}`,
      });
      await expect(dashboard.locator(signInSignUp.xpathDeleteBlockBtn)).toBeHidden();
    });

    await test.step(`Click vào button Layers trên Header, hover vào block Sign up`, async () => {
      await dashboard.locator("//button[@name='Layer']").click();
      await dashboard.locator(`//p[contains(text(),'Sign up')]`).hover();
      await expect(
        dashboard.locator(`//div[@data-id='${sectionId}']//button[contains(@data-block-action, "visible")]`).first(),
      ).toBeHidden();
      await dashboard.locator(`//div[@data-id='${blockId}']`).hover();
      await expect(
        dashboard.locator(`//div[@data-id='${blockId}']//button[contains(@data-block-action, "visible")]`),
      ).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_SISU_04 Check chỉnh sửa các setting common của block Sign up`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    await test.step(`Chỉnh sửa các setting common theo input data`, async () => {
      const settings = conf.caseConf.styles;
      for (const index in settings) {
        await webBuilder.frameLocator.locator(signInSignUp.xpathSignUpBlock).click();
        const setting = settings[index];
        await webBuilder.changeDesign(setting);
        await signInSignUp.clickSaveBtn();

        //Verify WB
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: signInSignUp.xpathSignUpSection,
          iframe: webBuilder.iframe,
          snapshotName: `${process.env.ENV}-common-setting-sign-up-${index}-WB.png`,
        });

        // Verify SF
        const preview = await signInSignUp.previewOnSF();
        await preview.goto(`https://${conf.suiteConf.domain}/sign-up`);
        await preview.waitForLoadState("networkidle");
        await snapshotFixture.verifyWithAutoRetry({
          page: preview,
          selector: signInSignUp.xpathSignUpSection,
          snapshotName: `${process.env.ENV}-common-setting-sign-up-${index}-sf.png`,
        });
        await preview.close();
      }
    });
  });

  test(`@SB_NEWECOM_SISU_05 Check UI Sign up page trên desktop`, async ({ dashboard, conf, snapshotFixture }) => {
    await test.step(`Đi đến SF Sign up page`, async () => {
      //Precondition: setting default block sign up
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignUpBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await signInSignUp.clickSaveBtn();

      //View SF
      await dashboard.goto(`https://${conf.suiteConf.domain}/sign-up`);
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-UI-sign-up-sf.png`,
      });
    });

    await test.step(`Nhập password và xác nhận password`, async () => {
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await dashboard.locator(signInSignUp.xpathConfirmPassword).fill(conf.caseConf.sign_up_password);

      //Verify password và cf password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-sign-up-encrypted-password.png`,
      });
    });

    await test.step(`Click icon eye`, async () => {
      await dashboard.locator(signInSignUp.xpathEyeIconPassword).click();
      await dashboard.locator(signInSignUp.xpathEyeIconCfPassword).click();

      //Verify password và cf password hiển thị dưới dạng thường
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-sign-up-original-password.png`,
      });
    });

    await test.step(`Click icon eye lần nữa`, async () => {
      await dashboard.locator(signInSignUp.xpathEyeIconPassword).click();
      await dashboard.locator(signInSignUp.xpathEyeIconCfPassword).click();

      //Verify password và cf password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-sign-up-encrypted-password.png`,
      });
    });

    await test.step(`Click link Term of Service`, async () => {
      const termOfService = await signInSignUp.viewNewPageByLink(signInSignUp.xpathTermOfServicesLink, dashboard);
      expect(termOfService.url()).toContain(`/policies/terms-of-service`);
      await termOfService.close();
    });

    await test.step(`Click link Privacy & Policy`, async () => {
      const privacyPolicy = await signInSignUp.viewNewPageByLink(signInSignUp.xpathPrivacyPolicyLink, dashboard);
      expect(privacyPolicy.url()).toContain(`/policies/privacy-policy`);
      await privacyPolicy.close();
    });

    await test.step(`Click link Sign in`, async () => {
      await dashboard.locator(signInSignUp.xpathSignInLink).click();
      await dashboard.waitForLoadState("networkidle");
      await expect(dashboard.locator(signInSignUp.xpathSignInBlock)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_SISU_06 Check đăng ký account tại Sign up Page trên desktop`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const signUpEmail = generateRandomMailToThisEmail();

    await test.step(`1. Điền email, password, confirm password không hợp lệ2. Click đăng ký`, async () => {
      //Precondition: setting default block sign up
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignUpBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await signInSignUp.clickSaveBtn();

      //view SF
      await dashboard.goto(`https://${conf.suiteConf.domain}/sign-up`);
      await dashboard.waitForLoadState("networkidle");
      await dashboard.reload();
      await dashboard.waitForLoadState("networkidle");

      //bỏ trống tất cả các trường
      await dashboard.locator(signInSignUp.xpathSignUpBtn).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-UI-sign-up-all-fields-are-empty.png`,
      });

      //Nhập sai định dạng email
      await dashboard.locator(signInSignUp.xpathEmail).fill(conf.caseConf.wrong_email);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-UI-sign-up-wrong-format-email.png`,
      });

      //Nhập pass ít hơn 6 ký tự
      await dashboard.locator(signInSignUp.xpathEmail).fill(signUpEmail);
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.wrong_password);
      await dashboard.locator(signInSignUp.xpathConfirmPassword).fill(conf.caseConf.wrong_password);
      await dashboard.locator(signInSignUp.xpathSignUpBtn).click();
      expect(await dashboard.locator(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_password_is_wrong_format,
      );
      await dashboard.locator(signInSignUp.xpathMessage).waitFor({ state: "hidden" });

      //Nhập cf pass không trùng pass
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await dashboard.locator(signInSignUp.xpathConfirmPassword).fill(conf.caseConf.pass_not_match);
      await dashboard.locator(signInSignUp.xpathSignUpBtn).click();
      expect(await dashboard.locator(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_cf_password_does_not_match,
      );
      await dashboard.locator(signInSignUp.xpathMessage).waitFor({ state: "hidden" });

      //Nhập email đã tồn tại
      await dashboard.locator(signInSignUp.xpathEmail).fill(conf.caseConf.email_already_exists);
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await dashboard.locator(signInSignUp.xpathConfirmPassword).fill(conf.caseConf.sign_up_password);
      await dashboard.locator(signInSignUp.xpathSignUpBtn).click();
      expect(await dashboard.locator(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_email_already_exists,
      );
      await dashboard.locator(signInSignUp.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Điền email chưa tồn tại, các trường khác hợp lệ, click Đăng ký`, async () => {
      await dashboard.locator(signInSignUp.xpathEmail).fill(signUpEmail);
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await dashboard.locator(signInSignUp.xpathConfirmPassword).fill(conf.caseConf.sign_up_password);
      await dashboard.locator(signInSignUp.xpathSignUpBtn).click();
      await dashboard.waitForLoadState("networkidle");
      await expect(dashboard.locator(`//p[normalize-space()='Check your email!']`)).toBeVisible();
      expect(await dashboard.locator(signInSignUp.xpathMessage).innerText()).toContain(
        `We have sent an email to ${signUpEmail}, please click the link included to verify your email address`,
      );
      await dashboard.locator(signInSignUp.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Chưa check email activation, đi đến page Sign in, đăng nhập bằng email và tài khoản vừa đăng ký`, async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(signInSignUp.xpathEmail).fill(signUpEmail);
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await dashboard.locator(signInSignUp.xpathSignInBtn).click();
      expect(await dashboard.locator(signInSignUp.xpathMessage).innerText()).toContain(
        `We have sent an email to ${signUpEmail}, please click the link included to verify your email address`,
      );
      await dashboard.locator(signInSignUp.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Check email xác nhận đăng ký`, async () => {
      mailBox = new MailBox(dashboard, conf.suiteConf.domain);
      await mailBox.openMailDetailWithAPI(signUpEmail, "Customer account activation");
      await mailBox.page.waitForTimeout(3 * 1000); //wait for page stable
      await mailBox.genLoc(signInSignUp.xpathActivateAccBtn).click();
      await mailBox.page.waitForResponse(response => response.url().includes("en.json"));
      await expect(mailBox.genLoc(signInSignUp.xpathMyProfileLabel)).toBeVisible();
    });

    await test.step(`Đi đến page Sign in, đăng nhập bằng email và tài khoản vừa đăng ký`, async () => {
      await mailBox.page.waitForTimeout(3 * 1000); //wait for page stable
      await mailBox.genLoc(signInSignUp.xpathMyAccount).click();
      await mailBox.page.getByRole("button", { name: "Log out" }).click();
      await mailBox.page.waitForLoadState("networkidle");
      await mailBox.page.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await mailBox.page.waitForLoadState("networkidle");
      await mailBox.genLoc(signInSignUp.xpathEmail).fill(signUpEmail);
      await mailBox.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await mailBox.genLoc(signInSignUp.xpathSignInBtn).click();
      expect(await mailBox.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_sign_in_success,
      );
      await mailBox.page.waitForLoadState("networkidle");
      await expect(mailBox.genLoc(signInSignUp.xpathMyProfileLabel)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_SISU_07 Check UI Sign up page trên mobile`, async ({ conf, pageMobile, snapshotFixture }) => {
    const signUpMobile = new SFHome(pageMobile, conf.suiteConf.domain);

    await test.step(`Đi đến SF Sign up page`, async () => {
      //Precondition: setting default block sign up
      await webBuilder.switchMobileBtn.click();
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignUpBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await signInSignUp.clickSaveBtn();

      //View SF
      await signUpMobile.goto(`https://${conf.suiteConf.domain}/sign-up`);
      await signUpMobile.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: signUpMobile.page,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-UI-sign-up-sf-mobile.png`,
      });
    });

    await test.step(`Nhập password và xác nhận password`, async () => {
      await signUpMobile.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await signUpMobile.genLoc(signInSignUp.xpathConfirmPassword).fill(conf.caseConf.sign_up_password);

      //Verify password và cf password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: signUpMobile.page,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-encrypted-password-mobile.png`,
      });
    });

    await test.step(`Click icon eye`, async () => {
      await signUpMobile.genLoc(signInSignUp.xpathEyeIconPassword).click();
      await signUpMobile.genLoc(signInSignUp.xpathEyeIconCfPassword).click();

      //Verify password và cf password hiển thị dưới dạng thường
      await snapshotFixture.verifyWithAutoRetry({
        page: signUpMobile.page,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-original-password-mobile.png`,
      });
    });

    await test.step(`Click icon eye lần nữa`, async () => {
      await signUpMobile.genLoc(signInSignUp.xpathEyeIconPassword).click();
      await signUpMobile.genLoc(signInSignUp.xpathEyeIconCfPassword).click();

      //Verify password và cf password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: signUpMobile.page,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-encrypted-password-mobile.png`,
      });
    });

    await test.step(`Click link Term of Service`, async () => {
      const termOfService = await signInSignUp.viewNewPageByLink(
        signInSignUp.xpathTermOfServicesLink,
        signUpMobile.page,
      );
      expect(termOfService.url()).toContain(`/policies/terms-of-service`);
      await termOfService.close();
    });

    await test.step(`Click link Privacy & Policy`, async () => {
      const privacyPolicy = await signInSignUp.viewNewPageByLink(
        signInSignUp.xpathPrivacyPolicyLink,
        signUpMobile.page,
      );
      expect(privacyPolicy.url()).toContain(`/policies/privacy-policy`);
      await privacyPolicy.close();
    });

    await test.step(`Click link Sign in`, async () => {
      await signUpMobile.genLoc(signInSignUp.xpathSignInLink).click();
      await signUpMobile.page.waitForLoadState("networkidle");
      await expect(signUpMobile.genLoc(signInSignUp.xpathSignInBlock)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_SISU_08 Check đăng ký account tại Sign up Page trên mobile`, async ({
    pageMobile,
    conf,
    snapshotFixture,
  }) => {
    const signUpEmail = generateRandomMailToThisEmail();
    const signUpMobile = new SFHome(pageMobile, conf.suiteConf.domain);

    await test.step(`1. Điền email, password, confirm password không hợp lệ2. Click đăng ký`, async () => {
      //Precondition: setting default block sign up
      await webBuilder.switchMobileBtn.click();
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignUpBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await signInSignUp.clickSaveBtn();

      //View SF
      await signUpMobile.goto(`https://${conf.suiteConf.domain}/sign-up`);
      await signUpMobile.page.waitForLoadState("networkidle");

      //bỏ trống tất cả các trường
      await signUpMobile.genLoc(signInSignUp.xpathSignUpBtn).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: signUpMobile.page,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-UI-sign-up-all-fields-are-empty-mobile.png`,
      });

      //Nhập sai định dạng email
      await signUpMobile.genLoc(signInSignUp.xpathEmail).fill(conf.caseConf.wrong_email);
      await snapshotFixture.verifyWithAutoRetry({
        page: signUpMobile.page,
        selector: signInSignUp.xpathSignUpSection,
        snapshotName: `${process.env.ENV}-UI-sign-up-wrong-email-mobile.png`,
      });

      //Nhập pass ít hơn 6 ký tự
      await signUpMobile.genLoc(signInSignUp.xpathEmail).fill(signUpEmail);
      await signUpMobile.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.wrong_password);
      await signUpMobile.genLoc(signInSignUp.xpathConfirmPassword).fill(conf.caseConf.wrong_password);
      await signUpMobile.genLoc(signInSignUp.xpathSignUpBtn).click();
      expect(await signUpMobile.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_password_is_wrong_format,
      );
      await signUpMobile.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });

      //Nhập cf pass không trùng pass
      await signUpMobile.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await signUpMobile.genLoc(signInSignUp.xpathConfirmPassword).fill(conf.caseConf.pass_not_match);
      await signUpMobile.genLoc(signInSignUp.xpathSignUpBtn).click();
      expect(await signUpMobile.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_cf_password_does_not_match,
      );
      await signUpMobile.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });

      //Nhập email đã tồn tại
      await signUpMobile.genLoc(signInSignUp.xpathEmail).fill(conf.caseConf.email_already_exists);
      await signUpMobile.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await signUpMobile.genLoc(signInSignUp.xpathConfirmPassword).fill(conf.caseConf.sign_up_password);
      await signUpMobile.genLoc(signInSignUp.xpathSignUpBtn).click();
      expect(await signUpMobile.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_email_already_exists,
      );
      await signUpMobile.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Điền email chưa tồn tại, các trường khác hợp lệ, click Đăng ký`, async () => {
      await signUpMobile.genLoc(signInSignUp.xpathEmail).fill(signUpEmail);
      await signUpMobile.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await signUpMobile.genLoc(signInSignUp.xpathConfirmPassword).fill(conf.caseConf.sign_up_password);
      await signUpMobile.genLoc(signInSignUp.xpathSignUpBtn).click();
      await expect(signUpMobile.genLoc(`//p[normalize-space()='Check your email!']`)).toBeVisible();
      expect(await signUpMobile.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        `We have sent an email to ${signUpEmail}, please click the link included to verify your email address`,
      );
      await signUpMobile.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Chưa check email activation, đi đến page Sign in, đăng nhập bằng email và tài khoản vừa đăng ký`, async () => {
      await signUpMobile.page.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await signUpMobile.page.waitForLoadState("networkidle");
      await signUpMobile.genLoc(signInSignUp.xpathEmail).fill(signUpEmail);
      await signUpMobile.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await signUpMobile.genLoc(signInSignUp.xpathSignInBtn).click();
      expect(await signUpMobile.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        `We have sent an email to ${signUpEmail}, please click the link included to verify your email address`,
      );
      await signUpMobile.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Check email xác nhận đăng ký`, async () => {
      mailBox = new MailBox(signUpMobile.page, conf.suiteConf.domain);
      await mailBox.openMailDetailWithAPI(signUpEmail, "Customer account activation");
      await mailBox.genLoc(signInSignUp.xpathActivateAccBtn).click();
      await mailBox.page.waitForResponse(response => response.url().includes("en.json"));
      await expect(mailBox.genLoc(signInSignUp.xpathMyProfileLabel)).toBeVisible();
    });

    await test.step(`Đi đến page Sign in, đăng nhập bằng email và tài khoản vừa đăng ký`, async () => {
      await mailBox.genLoc(signInSignUp.xpathMyAccount).click();
      await mailBox.page.getByRole("button", { name: "Log out" }).click();
      await mailBox.page.waitForLoadState("networkidle");
      await mailBox.page.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await mailBox.page.waitForLoadState("networkidle");
      await mailBox.genLoc(signInSignUp.xpathEmail).fill(signUpEmail);
      await mailBox.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.sign_up_password);
      await mailBox.genLoc(signInSignUp.xpathSignInBtn).click();
      expect(await mailBox.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_sign_in_success,
      );
      await mailBox.page.waitForLoadState("networkidle");
      await expect(mailBox.genLoc(signInSignUp.xpathMyProfileLabel)).toBeVisible();
    });
  });
});

test.describe("Check Sign in on Ecommerce store", async () => {
  let webBuilder: WebBuilder,
    themeId: number,
    signInSignUp: SignInSignUpWithPass,
    checkoutPage: SFCheckout,
    block: Blocks,
    mailBox: MailBox;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    checkoutPage = new SFCheckout(dashboard, conf.suiteConf.domain);
    signInSignUp = new SignInSignUpWithPass(dashboard, conf.suiteConf.domain);
    themeId = conf.suiteConf.theme_id;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "sign_in" });
  });

  test(`@SB_NEWECOM_SISU_10 Check Block Sign in không thể add từ Insert panel`, async ({ dashboard, conf }) => {
    await test.step(`Search "Sign in" trên insert panel`, async () => {
      await dashboard.locator(signInSignUp.xpathInsertPanel).click();
      await webBuilder.searchbarTemplate.waitFor({ state: "visible" });
      await webBuilder.searchbarTemplate.fill(conf.caseConf.text_fill);
      await expect(webBuilder.genLoc(signInSignUp.xpathEmptyResult)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_SISU_11 Check không thể ẩn, xóa, duplicate block Sign in`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    block = new Blocks(dashboard, conf.suiteConf.domain);
    let blockId: string;
    let sectionId: string;
    await test.step(`Click vào block Sign in`, async () => {
      await dashboard.locator(`//p[contains(text(),'Sign in')]`).click();
      sectionId = await block.getAttrsDataId();
      await expect(dashboard.locator(signInSignUp.xpathDeleteSectionBtn)).toBeHidden();
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignInBlock).click();
      blockId = await block.getAttrsDataId();
      await webBuilder.frameLocator.locator(signInSignUp.xpathQuickBar).waitFor({ state: "visible" });

      //Verify Quick bar của block không có các setting Hide, Duplicate, Delete
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathQuickBar,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${conf.caseConf.snapshot}`,
      });
      await expect(dashboard.locator(signInSignUp.xpathDeleteBlockBtn)).toBeHidden();
    });

    await test.step(`Click vào button Layers trên Header, hover vào block Sign in`, async () => {
      await dashboard.locator("//button[@name='Layer']").click();
      await dashboard.locator(`//p[contains(text(),'Sign in')]`).hover();
      await expect(
        dashboard.locator(`//div[@data-id='${sectionId}']//button[contains(@data-block-action, "visible")]`).first(),
      ).toBeHidden();
      await dashboard.locator(`//div[@data-id='${blockId}']`).hover();
      await expect(
        dashboard.locator(`//div[@data-id='${blockId}']//button[contains(@data-block-action, "visible")]`),
      ).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_SISU_12 Check chỉnh sửa các setting common của block Sign in`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    await test.step(`Chỉnh sửa các setting common theo input data`, async () => {
      const settings = conf.caseConf.styles;
      for (const index in settings) {
        await webBuilder.frameLocator.locator(signInSignUp.xpathSignInBlock).click();
        const setting = settings[index];
        await webBuilder.changeDesign(setting);
        await signInSignUp.clickSaveBtn();

        //Verify WB
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: signInSignUp.xpathSignInSection,
          iframe: webBuilder.iframe,
          snapshotName: `${process.env.ENV}-common-setting-sign-in-${index}-WB.png`,
        });

        // Verify SF
        const preview = await signInSignUp.previewOnSF();
        await preview.goto(`https://${conf.suiteConf.domain}/sign-in`);
        await preview.waitForLoadState("networkidle");
        await snapshotFixture.verifyWithAutoRetry({
          page: preview,
          selector: signInSignUp.xpathSignInSection,
          snapshotName: `${process.env.ENV}-common-setting-sign-in-${index}-sf.png`,
        });
        await preview.close();
      }
    });
  });

  test(`@SB_NEWECOM_SISU_13 Check UI Sign in page trên desktop`, async ({ dashboard, conf, snapshotFixture }) => {
    await test.step(`Đi đến SF Sign in page`, async () => {
      //Precondition: setting default block sign in
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignInBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await signInSignUp.clickSaveBtn();

      //View SF
      await dashboard.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-UI-sign-in-sf.png`,
      });
    });

    await test.step(`Nhập password`, async () => {
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.sign_in_password);

      //Verify password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-sign-in-encrypted-password.png`,
      });
    });

    await test.step(`Click icon eye`, async () => {
      await dashboard.locator(signInSignUp.xpathEyeIconPassword).click();

      //Verify password hiển thị dưới dạng thường
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-sign-in-original-password.png`,
      });
    });

    await test.step(`Click icon eye lần nữa`, async () => {
      await dashboard.locator(signInSignUp.xpathEyeIconPassword).click();

      //Verify password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-sign-in-encrypted-password.png`,
      });
    });

    await test.step(`Click link Forgot your password`, async () => {
      await dashboard.locator(signInSignUp.xpathForgotPasswordLink).click();
      await expect(dashboard.locator(signInSignUp.xpathResetPasswordTitle)).toBeVisible();
      await dashboard.locator(signInSignUp.xpathBackToPrevious).click();
    });

    await test.step(`Click link Sign up`, async () => {
      await dashboard.locator(signInSignUp.xpathSignUpLink).click();
      await dashboard.waitForLoadState("networkidle");
      await expect(dashboard.locator(signInSignUp.xpathSignUpBlock)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_SISU_14 Check đăng nhập tại Sign in Page trên desktop`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const email = generateRandomMailToThisEmail();

    await test.step(`1. Điền email, password không hợp lệ
  2. Click đăng nhập`, async () => {
      //Precondition: setting default block sign in
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignInBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await signInSignUp.clickSaveBtn();

      //Precondition: Sign up 1 acc
      await signInSignUp.signUpAnAccount(conf.suiteConf.domain, email, conf.caseConf.sign_in_password, dashboard);

      //Bỏ trống tất cả các trường
      await dashboard.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(signInSignUp.xpathSignInBtn).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-UI-sign-in-all-fields-are-empty.png`,
      });

      //Nhập sai định dạng email
      await dashboard.locator(signInSignUp.xpathEmail).fill(conf.caseConf.wrong_email);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-UI-sign-in-wrong-format-email.png`,
      });

      //Nhập sai password
      await dashboard.locator(signInSignUp.xpathEmail).fill(conf.caseConf.email_already_exists);
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.wrong_password);
      await dashboard.locator(signInSignUp.xpathSignInBtn).click();
      expect(await dashboard.locator(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_email_or_pass_incorrect,
      );
      await dashboard.locator(signInSignUp.xpathMessage).waitFor({ state: "hidden" });

      //Nhập email chưa tồn tại
      await dashboard.locator(signInSignUp.xpathEmail).fill(generateRandomMailToThisEmail());
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.sign_in_password);
      await dashboard.locator(signInSignUp.xpathSignInBtn).click();
      expect(await dashboard.locator(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_email_or_pass_incorrect,
      );
      await dashboard.locator(signInSignUp.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Điền đúng email, password, click Đăng nhập`, async () => {
      await dashboard.locator(signInSignUp.xpathEmail).fill(email);
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.sign_in_password);
      await dashboard.locator(signInSignUp.xpathSignInBtn).click();
      expect(await dashboard.locator(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_sign_in_success,
      );
      await dashboard.waitForLoadState("networkidle");
      await expect(dashboard.locator(signInSignUp.xpathMyProfileLabel)).toBeVisible();
    });

    await test.step(`Đi đến trang product detail, click login`, async () => {
      // Skip vì chưa làm trong sprint vừa rồi
    });

    await test.step(`Sign in tài khoản đã tồn tại`, async () => {
      // Skip vì chưa làm trong sprint vừa rồi
    });
  });

  test(`@SB_NEWECOM_SISU_15 Check Forgot password trên desktop`, async ({ dashboard, conf, snapshotFixture }) => {
    test.slow();
    const email = generateRandomMailToThisEmail();

    await test.step(`điền email tại sign in page, click liên kết "Forgot your password?"`, async () => {
      //Precondition: setting default block sign in
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignInBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await signInSignUp.clickSaveBtn();

      //Sign up an account
      await signInSignUp.signUpAnAccount(conf.suiteConf.domain, email, conf.caseConf.sign_in_password, dashboard);

      //View SF
      await dashboard.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(signInSignUp.xpathEmail).fill(conf.caseConf.email);
      await dashboard.locator(signInSignUp.xpathForgotPasswordLink).click();
      await dashboard.locator(signInSignUp.xpathResetPasswordForm).waitFor({ state: "visible" });

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathResetPasswordForm,
        snapshotName: `${process.env.ENV}-UI-reset-password.png`,
      });
    });

    await test.step(`Xóa email, bỏ trống trường email, click Submit`, async () => {
      await dashboard.locator(signInSignUp.xpathEmail).fill("");
      await dashboard.locator(signInSignUp.xpathSubmitBtn).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathResetPasswordForm,
        snapshotName: `${process.env.ENV}-UI-reset-password-when-email-is-empty.png`,
      });
    });

    await test.step(`Nhập địa chỉ email khác sai định dạng, click Submit`, async () => {
      await dashboard.locator(signInSignUp.xpathEmail).fill(conf.caseConf.wrong_email);
      await dashboard.locator(signInSignUp.xpathSubmitBtn).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: signInSignUp.xpathResetPasswordForm,
        snapshotName: `${process.env.ENV}-UI-reset-password-when-email-is-wrong-format.png`,
      });
    });

    await test.step(`Nhập email chưa tồn tại, click Submit`, async () => {
      await dashboard.locator(signInSignUp.xpathEmail).fill(generateRandomMailToThisEmail());
      await dashboard.locator(signInSignUp.xpathSubmitBtn).click();
      expect(await dashboard.locator(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_email_does_not_exist,
      );
    });

    await test.step(`Nhập email đã tồn tại, click Submit`, async () => {
      await dashboard.locator(signInSignUp.xpathEmail).fill(email);
      await dashboard.locator(signInSignUp.xpathSubmitBtn).click();
      await expect(dashboard.locator(signInSignUp.xpathMessageEmailWasSent)).toBeVisible();
    });

    await test.step(`Click btn Back to Login`, async () => {
      await dashboard.locator(signInSignUp.xpathBackToLoginBtn).click();
      await expect(dashboard.locator(signInSignUp.xpathSignInBlock)).toBeVisible();
    });

    await test.step(`Click Reset your password trong email vừa được gửi tới https://imgur.com/ZS7huQb`, async () => {
      mailBox = new MailBox(dashboard, conf.suiteConf.domain);
      try {
        await mailBox.openMailDetailWithAPI(email, "Customer account password reset");
      } catch (error) {
        await mailBox.openMailDetailWithAPI(email, "Customer account password reset");
      }
      await mailBox.genLoc(signInSignUp.xpathResetPasswordBtn).click(),
      await mailBox.page.waitForLoadState("networkidle");
      await expect(mailBox.genLoc(signInSignUp.xpathResetPasswordFromEmail)).toBeVisible();
    });

    await test.step(`Nhập password mới và xác nhận password`, async () => {
      await mailBox.genLoc(signInSignUp.xpathNewPassword).fill(conf.caseConf.new_password);
      await mailBox.genLoc(signInSignUp.xpathCfNewPassword).fill(conf.caseConf.new_password);

      //Verify password và cf password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: mailBox.page,
        selector: signInSignUp.xpathResetPasswordFromEmail,
        snapshotName: `${process.env.ENV}-reset-password-encrypted-password.png`,
      });
    });

    await test.step(`Click icon eye`, async () => {
      await mailBox.genLoc(signInSignUp.xpathEyeIconNewPass).click();
      await mailBox.genLoc(signInSignUp.xpathEyeIconCfNewPass).click();

      //Verify password và cf password hiển thị dưới dạng thường
      await snapshotFixture.verifyWithAutoRetry({
        page: mailBox.page,
        selector: signInSignUp.xpathResetPasswordFromEmail,
        snapshotName: `${process.env.ENV}-reset-password-original-password.png`,
      });
    });

    await test.step(`Nhập password mới và confirm password, không trùng nhau, click Submit`, async () => {
      await mailBox.genLoc(signInSignUp.xpathCfNewPassword).fill(conf.caseConf.pass_not_match);
      await mailBox.genLoc(signInSignUp.xpathChangePasswordBtn).click();
      expect(await mailBox.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_cf_password_does_not_match,
      );
      await mailBox.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Nhập password mới và confirm password trùng nhau, click Submit`, async () => {
      //Nhập pass nhỏ hơn 6 ký tự
      await mailBox.genLoc(signInSignUp.xpathNewPassword).fill(conf.caseConf.wrong_password);
      await mailBox.genLoc(signInSignUp.xpathCfNewPassword).fill(conf.caseConf.wrong_password);
      await mailBox.genLoc(signInSignUp.xpathChangePasswordBtn).click();
      expect(await mailBox.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_password_is_wrong_format,
      );
      await mailBox.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });

      //Nhập pass từ 6 ký tự trở lên
      await mailBox.genLoc(signInSignUp.xpathNewPassword).fill(conf.caseConf.new_password);
      await mailBox.genLoc(signInSignUp.xpathCfNewPassword).fill(conf.caseConf.new_password);
      await mailBox.genLoc(signInSignUp.xpathChangePasswordBtn).click();
      expect(await mailBox.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_reset_password_success,
      );
      await mailBox.page.waitForLoadState("networkidle");
      await expect(mailBox.genLoc(signInSignUp.xpathMyProfileLabel)).toBeVisible();
    });

    await test.step(`Logout và đăng nhập lại bằng pass mới`, async () => {
      await mailBox.genLoc(signInSignUp.xpathMyAccount).click();
      await mailBox.page.getByRole("button", { name: "Log out" }).click();
      await mailBox.page.waitForLoadState("networkidle");
      await mailBox.page.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await mailBox.page.waitForLoadState("networkidle");
      await mailBox.genLoc(signInSignUp.xpathEmail).fill(email);
      await mailBox.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.new_password);
      await mailBox.genLoc(signInSignUp.xpathSignInBtn).click();
      expect(await mailBox.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_sign_in_success,
      );
      await mailBox.page.waitForLoadState("networkidle");
      await expect(mailBox.genLoc(signInSignUp.xpathMyProfileLabel)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_SISU_16 Check UI Sign in page trên moblie`, async ({ conf, snapshotFixture, pageMobile }) => {
    const signInMobile = new SFHome(pageMobile, conf.suiteConf.domain);

    await test.step(`Đi đến SF Sign in page`, async () => {
      //Precondition: setting default block sign in
      await webBuilder.switchMobileBtn.click();
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignInBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await signInSignUp.clickSaveBtn();

      //View SF
      await signInMobile.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await signInMobile.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: signInMobile.page,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-UI-sign-in-sf-mobile.png`,
      });
    });

    await test.step(`Nhập password`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.sign_in_password);

      //Verify password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: signInMobile.page,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-sign-in-encrypted-password-mobile.png`,
      });
    });

    await test.step(`Click icon eye`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathEyeIconPassword).click();

      //Verify password hiển thị dưới dạng thường
      await snapshotFixture.verifyWithAutoRetry({
        page: signInMobile.page,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-sign-in-original-password-mobile.png`,
      });
    });

    await test.step(`Click icon eye lần nữa`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathEyeIconPassword).click();

      //Verify password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: signInMobile.page,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-sign-in-encrypted-password-mobile.png`,
      });
    });

    await test.step(`Click link Forgot your password`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathForgotPasswordLink).click();
      await expect(signInMobile.genLoc(signInSignUp.xpathResetPasswordTitle)).toBeVisible();
      await signInMobile.genLoc(signInSignUp.xpathBackToPrevious).click();
    });

    await test.step(`Click link Sign up`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathSignUpLink).click();
      await signInMobile.page.waitForLoadState("networkidle");
      await expect(signInMobile.genLoc(signInSignUp.xpathSignUpBlock)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_SISU_17 Check đăng nhập tại Sign in Page trên mobile`, async ({
    pageMobile,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const email = generateRandomMailToThisEmail();
    const signInMobile = new SFHome(pageMobile, conf.suiteConf.domain);

    await test.step(`1. Điền email, password không hợp lệ
  2. Click đăng nhập`, async () => {
      //Precondition: setting default block sign in
      await webBuilder.switchMobileBtn.click();
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignInBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await signInSignUp.clickSaveBtn();

      //Precondition: Sign up 1 acc
      await signInSignUp.signUpAnAccount(
        conf.suiteConf.domain,
        email,
        conf.caseConf.sign_in_password,
        signInMobile.page,
      );

      //Bỏ trống tất cả các trường
      await signInMobile.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await signInMobile.page.waitForLoadState("networkidle");
      await signInMobile.genLoc(signInSignUp.xpathSignInBtn).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: signInMobile.page,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-UI-sign-in-all-fields-are-empty-mobile.png`,
      });

      //Nhập sai định dạng email
      await signInMobile.genLoc(signInSignUp.xpathEmail).fill(conf.caseConf.wrong_email);
      await snapshotFixture.verifyWithAutoRetry({
        page: signInMobile.page,
        selector: signInSignUp.xpathSignInSection,
        snapshotName: `${process.env.ENV}-UI-sign-in-wrong-format-email-mobile.png`,
      });

      //Nhập sai password
      await signInMobile.genLoc(signInSignUp.xpathEmail).fill(conf.caseConf.email_already_exists);
      await signInMobile.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.wrong_password);
      await signInMobile.genLoc(signInSignUp.xpathSignInBtn).click();
      expect(await signInMobile.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_email_or_pass_incorrect,
      );
      await signInMobile.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });

      //Nhập email chưa tồn tại
      await signInMobile.genLoc(signInSignUp.xpathEmail).fill(generateRandomMailToThisEmail());
      await signInMobile.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.sign_in_password);
      await signInMobile.genLoc(signInSignUp.xpathSignInBtn).click();
      expect(await signInMobile.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_email_or_pass_incorrect,
      );
      await signInMobile.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Điền đúng email, password, click Đăng nhập`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathEmail).fill(email);
      await signInMobile.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.sign_in_password);
      await signInMobile.genLoc(signInSignUp.xpathSignInBtn).click();
      expect(await signInMobile.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_sign_in_success,
      );
      await signInMobile.page.waitForLoadState("networkidle");
      await expect(signInMobile.genLoc(signInSignUp.xpathMyProfileLabel)).toBeVisible();
    });

    await test.step(`Đi đến trang product detail, click login`, async () => {
      // Skip vì chưa làm trong sprint vừa rồi
    });

    await test.step(`Sign in tài khoản đã tồn tại`, async () => {
      // Skip vì chưa làm trong sprint vừa rồi
    });
  });

  test(`@SB_NEWECOM_SISU_18 Check Forgot password trên mobile`, async ({ pageMobile, conf, snapshotFixture }) => {
    test.slow();
    const email = generateRandomMailToThisEmail();
    const signInMobile = new SFHome(pageMobile, conf.suiteConf.domain);

    await test.step(`điền email tại sign in page, click liên kết "Forgot your password?"`, async () => {
      //Precondition: setting default block sign up
      await webBuilder.switchMobileBtn.click();
      await webBuilder.frameLocator.locator(signInSignUp.xpathSignInBlock).click();
      const settingDefault = conf.caseConf.style_default;
      await webBuilder.changeDesign(settingDefault);
      await signInSignUp.clickSaveBtn();

      //Sign up an account
      await signInSignUp.signUpAnAccount(
        conf.suiteConf.domain,
        email,
        conf.caseConf.sign_in_password,
        signInMobile.page,
      );

      //View SF
      await signInMobile.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await signInMobile.page.waitForLoadState("networkidle");
      await signInMobile.genLoc(signInSignUp.xpathEmail).fill(conf.caseConf.email);
      await signInMobile.genLoc(signInSignUp.xpathForgotPasswordLink).click();
      await signInMobile.genLoc(signInSignUp.xpathResetPasswordForm).waitFor({ state: "visible" });

      await snapshotFixture.verifyWithAutoRetry({
        page: signInMobile.page,
        selector: signInSignUp.xpathResetPasswordForm,
        snapshotName: `${process.env.ENV}-UI-reset-password-mobile.png`,
      });
    });

    await test.step(`Xóa email, bỏ trống trường email, click Submit`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathEmail).fill("");
      await signInMobile.genLoc(signInSignUp.xpathSubmitBtn).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: signInMobile.page,
        selector: signInSignUp.xpathResetPasswordForm,
        snapshotName: `${process.env.ENV}-UI-reset-password-when-email-is-empty-mobile.png`,
      });
    });

    await test.step(`Nhập địa chỉ email khác sai định dạng, click Submit`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathEmail).fill(conf.caseConf.wrong_email);
      await signInMobile.genLoc(signInSignUp.xpathSubmitBtn).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: signInMobile.page,
        selector: signInSignUp.xpathResetPasswordForm,
        snapshotName: `${process.env.ENV}-UI-reset-password-when-email-is-wrong-format-mobile.png`,
      });
    });

    await test.step(`Nhập email chưa tồn tại, click Submit`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathEmail).fill(generateRandomMailToThisEmail());
      await signInMobile.genLoc(signInSignUp.xpathSubmitBtn).click();
      expect(await signInMobile.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_email_does_not_exist,
      );
    });

    await test.step(`Nhập email đã tồn tại, click Submit`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathEmail).fill(email);
      await signInMobile.genLoc(signInSignUp.xpathSubmitBtn).click();
      await expect(signInMobile.genLoc(signInSignUp.xpathMessageEmailWasSent)).toBeVisible();
    });

    await test.step(`Click btn Back to Login`, async () => {
      await signInMobile.genLoc(signInSignUp.xpathBackToLoginBtn).click();
      await expect(signInMobile.genLoc(signInSignUp.xpathSignInBlock)).toBeVisible();
    });

    await test.step(`Click Reset your password trong email vừa được gửi tới https://imgur.com/ZS7huQb`, async () => {
      mailBox = new MailBox(signInMobile.page, conf.suiteConf.domain);
      try {
        await mailBox.openMailDetailWithAPI(email, "Customer account password reset");
      } catch (error) {
        await mailBox.openMailDetailWithAPI(email, "Customer account password reset");
      }
      await mailBox.genLoc(signInSignUp.xpathResetPasswordBtn).click(),
      await mailBox.page.waitForLoadState("networkidle");
      await expect(mailBox.genLoc(signInSignUp.xpathResetPasswordFromEmail)).toBeVisible();
    });

    await test.step(`Nhập password mới và xác nhận password`, async () => {
      await mailBox.genLoc(signInSignUp.xpathNewPassword).fill(conf.caseConf.new_password);
      await mailBox.genLoc(signInSignUp.xpathCfNewPassword).fill(conf.caseConf.new_password);

      //Verify password và cf password hiển thị dưới dạng mã hóa
      await snapshotFixture.verifyWithAutoRetry({
        page: mailBox.page,
        selector: signInSignUp.xpathResetPasswordFromEmail,
        snapshotName: `${process.env.ENV}-reset-password-encrypted-password-mobile.png`,
      });
    });

    await test.step(`Click icon eye`, async () => {
      await mailBox.genLoc(signInSignUp.xpathEyeIconNewPass).click();
      await mailBox.genLoc(signInSignUp.xpathEyeIconCfNewPass).click();

      //Verify password và cf password hiển thị dưới dạng thường
      await snapshotFixture.verifyWithAutoRetry({
        page: mailBox.page,
        selector: signInSignUp.xpathResetPasswordFromEmail,
        snapshotName: `${process.env.ENV}-reset-password-original-password-mobile.png`,
      });
    });

    await test.step(`Nhập password mới và confirm password, không trùng nhau, click Submit`, async () => {
      await mailBox.genLoc(signInSignUp.xpathCfNewPassword).fill(conf.caseConf.pass_not_match);
      await mailBox.genLoc(signInSignUp.xpathChangePasswordBtn).click();
      expect(await mailBox.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_cf_password_does_not_match,
      );
      await mailBox.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });
    });

    await test.step(`Nhập password mới và confirm password trùng nhau, click Submit`, async () => {
      //Nhập pass nhỏ hơn 6 ký tự
      await mailBox.genLoc(signInSignUp.xpathNewPassword).fill(conf.caseConf.wrong_password);
      await mailBox.genLoc(signInSignUp.xpathCfNewPassword).fill(conf.caseConf.wrong_password);
      await mailBox.genLoc(signInSignUp.xpathChangePasswordBtn).click();
      expect(await mailBox.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_password_is_wrong_format,
      );
      await mailBox.genLoc(signInSignUp.xpathMessage).waitFor({ state: "hidden" });

      //Nhập pass từ 6 ký tự trở lên
      await mailBox.genLoc(signInSignUp.xpathNewPassword).fill(conf.caseConf.new_password);
      await mailBox.genLoc(signInSignUp.xpathCfNewPassword).fill(conf.caseConf.new_password);
      await mailBox.genLoc(signInSignUp.xpathChangePasswordBtn).click();
      expect(await mailBox.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_reset_password_success,
      );
      await mailBox.page.waitForLoadState("networkidle");
      await expect(mailBox.genLoc(signInSignUp.xpathMyProfileLabel)).toBeVisible();
    });

    await test.step(`Logout và đăng nhập lại bằng pass mới`, async () => {
      await mailBox.genLoc(signInSignUp.xpathMyAccount).click();
      await mailBox.page.getByRole("button", { name: "Log out" }).click();
      await mailBox.page.waitForLoadState("networkidle");
      await mailBox.page.goto(`https://${conf.suiteConf.domain}/sign-in`);
      await mailBox.page.waitForLoadState("networkidle");
      await mailBox.genLoc(signInSignUp.xpathEmail).fill(email);
      await mailBox.genLoc(signInSignUp.xpathPassword).fill(conf.caseConf.new_password);
      await mailBox.genLoc(signInSignUp.xpathSignInBtn).click();
      expect(await mailBox.genLoc(signInSignUp.xpathMessage).innerText()).toContain(
        conf.caseConf.message_sign_in_success,
      );
      await mailBox.page.waitForLoadState("networkidle");
      await expect(mailBox.genLoc(signInSignUp.xpathMyProfileLabel)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_SISU_19 Verfiy checkout khi đã sign in account`, async ({ dashboard, conf }) => {
    test.slow();
    await test.step(`Chưa đăng nhập acc, Add 1 product vào cart và đến màn checkout`, async () => {
      //Precondition: setting default variant selection
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();
      await webBuilder.selectDropDown("default_variant", "Auto choose the first variant");
      await signInSignUp.clickSaveBtn();

      //View product on SF
      await dashboard.goto(`https://${conf.suiteConf.domain}/products/${conf.caseConf.product_handle}`);
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(signInSignUp.xpathBuyNowBtn).click();
      await expect(dashboard.locator(signInSignUp.xpathShippingInfo)).toBeVisible();
      await expect(dashboard.locator(signInSignUp.xpathLoggedInCustomerInfo).first()).toBeHidden();
    });

    await test.step(`Click Liên kết Login trên trang checkout`, async () => {
      await dashboard.locator(signInSignUp.xpathSkeleton).first().waitFor({ state: "hidden" });
      await dashboard.locator(signInSignUp.xpathLoginLink).click();
      await dashboard.waitForLoadState("networkidle");
      try {
        await expect(dashboard.locator(signInSignUp.xpathSignInBlock)).toBeVisible();
      } catch (error) {
        await dashboard.locator(signInSignUp.xpathLoginLink).click();
        await dashboard.waitForLoadState("networkidle");
        await expect(dashboard.locator(signInSignUp.xpathSignInBlock)).toBeVisible();
      }
    });

    await test.step(`đăng nhập acc đã đăng ký`, async () => {
      await dashboard.locator(signInSignUp.xpathEmail).fill(conf.caseConf.user_account.email);
      await dashboard.locator(signInSignUp.xpathPassword).fill(conf.caseConf.user_account.sign_in_password);
      await dashboard.locator(signInSignUp.xpathSignInBtn).click();
      await dashboard.waitForLoadState("networkidle");

      //Verify screen back to checkout page
      await dashboard.locator(signInSignUp.xpathSkeleton).first().waitFor({ state: "hidden" });
      await expect(dashboard.locator(signInSignUp.xpathLoggedInCustomerInfo).first()).toBeVisible();
    });

    await test.step(`Thực hiện check out với acc đã đăng nhập`, async () => {
      const shippingAddress = conf.caseConf.shipping_address;
      const paymentMethod = conf.caseConf.payment_method;
      await signInSignUp.enterShippingAddress(
        shippingAddress.first_name,
        shippingAddress.last_name,
        shippingAddress.address,
        shippingAddress.country,
        shippingAddress.city,
      );
      await dashboard.locator(signInSignUp.xpathcheckoutFooter).scrollIntoViewIfNeeded();
      await checkoutPage.inputCardInfo(
        paymentMethod.number,
        paymentMethod.holder_name,
        paymentMethod.expired_date,
        paymentMethod.cvv,
      );
      const isCheckboxAgreeTermsVisible = await dashboard
        .locator(signInSignUp.xpathAgreeTermOfServiceCheckbox)
        .isVisible();
      if (isCheckboxAgreeTermsVisible == true) {
        const isCheckboxChecked = await dashboard.locator(signInSignUp.xpathAgreeTermOfServiceCheckbox).isChecked();
        if (isCheckboxChecked == false) {
          await dashboard.locator(signInSignUp.xpathAgreeTermOfServiceCheckbox).click();
        }
      }
      await dashboard.locator(signInSignUp.xpathPlaceYourOrderBtn).click();
      await expect(dashboard.locator(signInSignUp.xpathConfirmOrder)).toBeVisible();
    });
  });
});
