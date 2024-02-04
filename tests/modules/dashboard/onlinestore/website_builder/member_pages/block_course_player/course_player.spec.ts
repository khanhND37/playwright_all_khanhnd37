import { expect, test } from "@fixtures/website_builder";
import { Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { waitForImageLoaded, waitForImageLoadingClassHidden } from "@utils/theme";
import { scrollToEndOfBlock, scrollToTopOfBlock } from "@utils/scroll";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { MailBox } from "@pages/thirdparty/mailbox";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";
import { MyAccountPage } from "@pages/shopbase_creator/storefront/my_accounts";
import { WbBlockCoursePlayerPage } from "@pages/dashboard/wb_block_course_player";

test.describe("Check module block course player", () => {
  let domain: string;
  let webBuilder: WebBuilder;
  let mailBoxPage: MailBox;
  let newPage: Page;
  let myAccountPage: MyAccountPage;
  let wbBlockCoursePlayer: WbBlockCoursePlayerPage;
  let blockPage: Blocks;
  let myProductpage: MyProductPage;

  const saveMsg = "All changes are saved";

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;
  });

  test.beforeEach(async ({ dashboard, conf, snapshotFixture }) => {
    webBuilder = new WebBuilder(dashboard, domain);
    wbBlockCoursePlayer = new WbBlockCoursePlayerPage(dashboard, domain);
    blockPage = new Blocks(dashboard, domain);

    await webBuilder.openCustomizeTheme(dashboard, domain);
    await webBuilder.clickBtnNavigationBar("pages");
    await webBuilder.clickPageByName("Course player");
    const coursePlayerXpath = webBuilder.getSelectorByIndex(conf.suiteConf.block_position);
    await webBuilder.selectProductPreviewByName(conf.suiteConf.default_product);
    await Promise.all([
      await waitForImageLoaded(dashboard, coursePlayerXpath, webBuilder.iframe),
      await waitForImageLoadingClassHidden(dashboard, coursePlayerXpath, webBuilder.iframe),
    ]);
    const digitalSelector = wbBlockCoursePlayer.getSelectorByIndex(conf.suiteConf.block_position);
    await wbBlockCoursePlayer.clickSectionOnPage(digitalSelector);

    await wbBlockCoursePlayer.handleFormCoursePlayer(conf.suiteConf.default_style);
    await wbBlockCoursePlayer.changeDesign(conf.suiteConf.default_style);
    await wbBlockCoursePlayer.switchToTab("Content");
    await wbBlockCoursePlayer.handleContentCoursePlayer({
      progress_type: conf.suiteConf.default_style.content.progress_type,
      progress_icon: conf.suiteConf.default_style.content.progress_icon,
    });
    await wbBlockCoursePlayer.switchToTab("Design");
    await blockPage.clickSaveAndVerifyPreviewMemberPage(
      {
        dashboard,
        block: wbBlockCoursePlayer,
        savedMsg: saveMsg,
        snapshotName: conf.caseConf.screenshot,
        onlyClickSave: true,
      },
      snapshotFixture,
    );
  });

  test(`@SB_NEWECOM_CP_02 Verify logic scroll content trong block`, async ({
    dashboard,
    page,
    conf,
    snapshotFixture,
  }) => {
    mailBoxPage = new MailBox(page, domain);
    myAccountPage = new MyAccountPage(page, domain);
    const coursePlayerXpath = webBuilder.getSelectorByIndex(conf.suiteConf.block_position);

    await test.step(`Vào Online stores > Theme > Chọn Customize > Chọn button Page trên header > Chọn page Course player trong section Member pages > Verify content hiển thị trong block `, async () => {
      await webBuilder.selectProductPreviewByName(conf.caseConf.product_name);
      await Promise.all([
        await waitForImageLoaded(dashboard, coursePlayerXpath, webBuilder.iframe),
        await waitForImageLoadingClassHidden(dashboard, coursePlayerXpath, webBuilder.iframe),
      ]);
    });
    await test.step(`Thực hiện scroll course content > Verify content hiển thị`, async () => {
      await scrollToEndOfBlock(
        webBuilder.page,
        webBuilder.xpathCoursePlayerMainContent(coursePlayerXpath),
        webBuilder.iframe,
        true,
      );
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.iframe,
        snapshotName: conf.caseConf.content_snapshot,
        snapshotOptions: { maxDiffPixelRatio: 0.05 },
      });
      await scrollToTopOfBlock(
        webBuilder.page,
        webBuilder.xpathCoursePlayerMainContent(coursePlayerXpath),
        webBuilder.iframe,
      );
    });
    await test.step(`Thực hiện scroll course sidebar > Verify content hiển thị`, async () => {
      await scrollToEndOfBlock(
        webBuilder.page,
        webBuilder.xpathCoursePlayerSidebar(coursePlayerXpath),
        webBuilder.iframe,
        true,
      );
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.iframe,
        snapshotName: conf.caseConf.sidebar_snapshot,
        snapshotOptions: { maxDiffPixelRatio: 0.05 },
      });
    });
    await test.step(`Member đăng nhập vào tài khoản, vào xem course player > Thực hiện scroll course content > Verify content hiển thị`, async () => {
      await myAccountPage.gotoSignInPage();
      await myAccountPage.sendCode(conf.suiteConf.customer_email);
      await mailBoxPage.openMailBox(conf.suiteConf.customer_email);
      newPage = await mailBoxPage.openVerifyEmailThenSignIn(conf.suiteConf.customer);

      myProductpage = new MyProductPage(newPage, domain);
      await myProductpage.goToMyProductPage();
      await myProductpage.clickOpenContent(conf.caseConf.product_name);
      await Promise.all([
        await waitForImageLoaded(myProductpage.page, myProductpage.xpathCoursePlayer),
        await waitForImageLoadingClassHidden(myProductpage.page, myProductpage.xpathCoursePlayer),
      ]);

      await scrollToEndOfBlock(myProductpage.page, myProductpage.xpathCoursePlayerMainContent, "", true);
      await snapshotFixture.verify({
        page: myProductpage.page,
        selector: myProductpage.xpathCoursePlayer,
        snapshotName: conf.caseConf.sf_content_snapshot,
        snapshotOptions: { maxDiffPixelRatio: 0.05 },
      });
      await scrollToTopOfBlock(myProductpage.page, myProductpage.xpathCoursePlayerMainContent);
    });
    await test.step(`Thực hiện scroll course sidebar > Verify content hiển thị`, async () => {
      await scrollToEndOfBlock(myProductpage.page, myProductpage.xpathCoursePlayerSidebar, "", true);
      await snapshotFixture.verify({
        page: myProductpage.page,
        selector: myProductpage.xpathCoursePlayer,
        snapshotName: conf.caseConf.sf_sidebar_snapshot,
        snapshotOptions: { maxDiffPixelRatio: 0.05 },
      });
    });
  });
  test(`@SB_NEWECOM_CP_03 Verify common setting`, async ({ dashboard, conf, snapshotFixture }) => {
    const coursePlayerXpath = webBuilder.getSelectorByIndex(conf.suiteConf.block_position);
    const styleSettings = conf.caseConf.style_settings;
    await webBuilder.selectProductPreviewByName(conf.caseConf.product_name);
    await Promise.all([
      await waitForImageLoaded(dashboard, coursePlayerXpath, webBuilder.iframe),
      await waitForImageLoadingClassHidden(dashboard, coursePlayerXpath, webBuilder.iframe),
    ]);
    const digitalSelector = wbBlockCoursePlayer.getSelectorByIndex(conf.suiteConf.block_position);
    await wbBlockCoursePlayer.clickSectionOnPage(digitalSelector);

    for (let i = 0; i < styleSettings.length; i++) {
      const styleSetting = styleSettings[i];
      await test.step(styleSetting.step, async () => {
        for (let i = 0; i < styleSetting.styles.length; i++) {
          const style = styleSetting.styles[i].style;
          await wbBlockCoursePlayer.handleFormCoursePlayer(style);
          await wbBlockCoursePlayer.changeDesign(style);
          await blockPage.clickSaveAndVerifyPreviewMemberPage(
            {
              dashboard,
              block: wbBlockCoursePlayer,
              savedMsg: saveMsg,
              snapshotName: styleSetting.styles[i].screenshot,
            },
            snapshotFixture,
            { maxDiffPixelRatio: 0.05 },
            wbBlockCoursePlayer.xpathCoursePlayer,
          );
        }
      });
    }
  });
  test(`@SB_NEWECOM_CP_04 Verify resize width block Course player`, async ({ dashboard, conf, snapshotFixture }) => {
    const coursePlayerXpath = webBuilder.getSelectorByIndex(conf.suiteConf.block_position);

    await test.step(`Vào Online stores > Design > Chọn Customize > Chọn button Page trên header > Chọn page Course player trong section Member pages > Click vào block course player`, async () => {
      await webBuilder.selectProductPreviewByName(conf.caseConf.product_name);
      await Promise.all([
        await waitForImageLoaded(dashboard, coursePlayerXpath, webBuilder.iframe),
        await waitForImageLoadingClassHidden(dashboard, coursePlayerXpath, webBuilder.iframe),
      ]);
      const digitalSelector = wbBlockCoursePlayer.getSelectorByIndex(conf.suiteConf.block_position);
      await wbBlockCoursePlayer.clickSectionOnPage(digitalSelector);
    });

    await test.step("Verify Resize Block Course player", async () => {
      expect(wbBlockCoursePlayer.genLoc(`//div[@resize-mode="height" and @data-resize="top"]`).isHidden()).toBeTruthy();
    });

    await test.step("Kéo width của block = min-width > Preview Course Player page > Verify Course player page", async () => {
      await wbBlockCoursePlayer.settingWidthHeight("width", conf.caseConf.width);
      await blockPage.clickSaveAndVerifyPreviewMemberPage(
        {
          dashboard,
          block: wbBlockCoursePlayer,
          savedMsg: saveMsg,
          snapshotName: conf.caseConf.screenshot,
        },
        snapshotFixture,
        { maxDiffPixelRatio: 0.05 },
        wbBlockCoursePlayer.xpathCoursePlayer,
      );
    });
  });
  test(`@SB_NEWECOM_CP_07 Verify member đóng mở sidebar course content`, async ({ page, conf }) => {
    mailBoxPage = new MailBox(page, domain);
    myAccountPage = new MyAccountPage(page, domain);

    await test.step("Member login vào account > My product > View Course", async () => {
      await myAccountPage.gotoSignInPage();
      await myAccountPage.sendCode(conf.suiteConf.customer_email);
      await mailBoxPage.openMailBox(conf.suiteConf.customer_email);
      newPage = await mailBoxPage.openVerifyEmailThenSignIn(conf.suiteConf.customer);

      myProductpage = new MyProductPage(newPage, domain);
      await myProductpage.goToMyProductPage();
      await myProductpage.clickOpenContent(conf.caseConf.product_name);
      await Promise.all([
        await waitForImageLoaded(myProductpage.page, myProductpage.xpathCoursePlayer),
        await waitForImageLoadingClassHidden(myProductpage.page, myProductpage.xpathCoursePlayer),
      ]);
    });
    await test.step("Member click vào icon Close ở sidebar course content > verify block Course player", async () => {
      await myProductpage.genLoc(wbBlockCoursePlayer.hide_content_button_xpath).click();
      expect(wbBlockCoursePlayer.genLoc(wbBlockCoursePlayer.course_content_xpath).isHidden()).toBeTruthy();
    });
    await test.step("Member click vào icon Show sidebar course content > verify block Course player", async () => {
      await myProductpage.genLoc(wbBlockCoursePlayer.show_content_button_xpath).click();
      expect(wbBlockCoursePlayer.genLoc(wbBlockCoursePlayer.course_content_xpath).isVisible()).toBeTruthy();
    });
  });

  test(`@SB_NEWECOM_CP_14 Verify SF Course player page sau khi setting trong dashboard`, async ({
    dashboard,
    page,
    conf,
    snapshotFixture,
  }) => {
    mailBoxPage = new MailBox(page, domain);
    myAccountPage = new MyAccountPage(page, domain);
    const coursePlayerXpath = webBuilder.getSelectorByIndex(conf.suiteConf.block_position);

    await test.step("Vào dashboard Online stores > Chọn Customize > Chọn button Page trên header > Chọn page Course player trong section Member pages > Setting block Course player", async () => {
      await webBuilder.selectProductPreviewByName(conf.caseConf.product_name);
      await Promise.all([
        await waitForImageLoaded(dashboard, coursePlayerXpath, webBuilder.iframe),
        await waitForImageLoadingClassHidden(dashboard, coursePlayerXpath, webBuilder.iframe),
      ]);
      const digitalSelector = wbBlockCoursePlayer.getSelectorByIndex(conf.suiteConf.block_position);
      await wbBlockCoursePlayer.clickSectionOnPage(digitalSelector);
      const style = conf.caseConf.style;
      await wbBlockCoursePlayer.handleFormCoursePlayer(style);
      await wbBlockCoursePlayer.changeDesign(style);
      await wbBlockCoursePlayer.switchToTab("Content");
      await wbBlockCoursePlayer.handleContentCoursePlayer(style.content);
      await wbBlockCoursePlayer.switchToTab("Design");
    });

    await test.step("Chọn Preview on new tab > Verify block Course player hiển thị ở màn preview", async () => {
      await blockPage.clickSaveAndVerifyPreviewMemberPage(
        {
          dashboard,
          block: wbBlockCoursePlayer,
          savedMsg: saveMsg,
          snapshotName: conf.caseConf.screenshot_preview,
        },
        snapshotFixture,
        { maxDiffPixelRatio: 0.05 },
        wbBlockCoursePlayer.xpathCoursePlayer,
      );
    });

    await test.step("Member sign in vào account > My products > Verify page Course player hiển thị", async () => {
      await myAccountPage.gotoSignInPage();
      await myAccountPage.sendCode(conf.suiteConf.customer_email);
      await mailBoxPage.openMailBox(conf.suiteConf.customer_email);
      newPage = await mailBoxPage.openVerifyEmailThenSignIn(conf.suiteConf.customer);

      myProductpage = new MyProductPage(newPage, domain);
      await myProductpage.goToMyProductPage();
      await myProductpage.clickOpenContent(conf.caseConf.product_name);
      await Promise.all([
        await waitForImageLoaded(myProductpage.page, myProductpage.xpathCoursePlayer),
        await waitForImageLoadingClassHidden(myProductpage.page, myProductpage.xpathCoursePlayer),
      ]);
      await snapshotFixture.verify({
        page: myProductpage.page,
        selector: myProductpage.xpathCoursePlayer,
        snapshotName: conf.caseConf.screenshot_member,
        snapshotOptions: { maxDiffPixelRatio: 0.05 },
      });
    });
  });
});
