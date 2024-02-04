import { test } from "@fixtures/website_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { AccountPage } from "@pages/dashboard/accounts";
import { expect } from "@playwright/test";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { loadData } from "@core/conf/conf";
import { TemplateStorePage } from "@sf_pages/template_store";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { generateRandomCharacters } from "@core/utils/string";
import { OcgLogger } from "@core/logger";
import { snapshotDir } from "@utils/theme";

let accessToken: string, xpath: Blocks, webBuilder: WebBuilder, themes: ThemeEcom;
const logger = OcgLogger.get();

test.describe("Verify template store", () => {
  test.beforeEach(async ({ dashboard, conf, token }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.shop_template.apply_shop,
      username: conf.suiteConf.shop_template.username,
      password: conf.suiteConf.shop_template.password,
    });
    accessToken = shopToken;
    await themes.deleteAllThemesUnPublish(accessToken);
  });

  test("Check login/logout/sign up on header template store @SB_NEWECOM_TS_03", async ({ conf, page }) => {
    xpath = new Blocks(page, conf.suiteConf.link);
    webBuilder = new WebBuilder(page, conf.suiteConf.link);

    for (const option of conf.caseConf.data) {
      await page.goto(conf.suiteConf.link);
      if (option.login) {
        await test.step("Click on button login", async () => {
          await page.locator(xpath["buttonLogin"]).click();
        });

        await test.step("Verify login with acc", async () => {
          const accountPage = new AccountPage(page, conf.suiteConf.link);
          if (option.login.username) {
            await accountPage.inputAccountAndSignInNoWait({
              email: option.login.username,
              password: option.login.password,
            });
          } else {
            await accountPage.inputAccountAndSignInNoWait({
              email: conf.suiteConf.username,
              password: conf.suiteConf.password,
            });
          }
          if (option.login.expect.message) {
            await expect(page.locator(xpath["messageLogin"])).toHaveText(option.login.expect.message);
          }
        });

        await test.step("Verify logout with acc", async () => {
          if (option.logout) {
            await page.locator(xpath["buttonLogout"]).click();
            await expect(page.locator(xpath["buttonLogin"])).toBeVisible();
          }
        });
      }

      if (option.get_started) {
        await test.step("Click on button Get started", async () => {
          await page.locator(xpath["buttonGetStarted"]).click();
        });
        expect(page.url()).toContain(option.get_started.expect.link);
      }
    }
  });

  test("Check hover vào theme/page template khi đã login acc template store @SB_NEWECOM_TS_12", async ({
    conf,
    page,
    snapshotFixture,
  }) => {
    await page.goto(conf.suiteConf.link);
    const templateStore = new TemplateStorePage(page);
    webBuilder = new WebBuilder(page, conf.suiteConf.link);
    xpath = new Blocks(page, conf.suiteConf.link);
    const frameLocator = page.frameLocator(xpath["previewTemplate"]);

    await test.step("Login with account", async () => {
      await page.locator(xpath["buttonLogin"]).click();
      const accountPage = new AccountPage(page, conf.suiteConf.link);
      await accountPage.inputAccountAndSignInNoWait({
        email: conf.suiteConf.shop_template.username,
        password: conf.suiteConf.shop_template.password,
      });
      await page.waitForLoadState("load");
    });

    for (const template of conf.caseConf.data) {
      await test.step(`${template.description}`, async () => {
        //Click icon preview template
        await expect(page.locator(`(//img[@alt = "${template.hover}"])[1]//parent::figure`)).toBeVisible();
        await templateStore.previewTemplate(template.hover);
        await page.locator(xpath.spinner).waitFor({ state: "hidden" });
        await frameLocator.locator(xpath["textWB"]).waitFor({ state: "visible" });
        const isPopupVisible = await frameLocator.locator(xpath["closePopupPreview"]).isVisible();
        if (isPopupVisible == true) {
          await frameLocator.locator(xpath["closePopupPreview"]).click();
          await frameLocator.locator(xpath["secondSlideShow"]).click();
        } else {
          await frameLocator.locator(xpath["secondSlideShow"]).click();
        }
        await page.waitForTimeout(2000); // đợi slide show hiện đủ content
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          snapshotName: template.preview,
          combineOptions: { fullPage: true },
        });

        await page.locator(xpath["btnBackPreview"]).click();
        await webBuilder.waitForXpathState(xpath["listTemplate"], "stable");
        //Click icon apply template
        await templateStore.applyTemplate(template.hover);
        await webBuilder.waitForXpathState(xpath["popupTemplate"], "stable");
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: xpath["popupTemplate"],
          snapshotName: template.apply,
        });
        await page.locator(xpath["overlayPopup"]).click({ position: { x: 5, y: 5 } });
      });
    }
  });

  test("Check hover vào theme/page template khi chưa login acc template store @SB_NEWECOM_TS_13", async ({
    conf,
    page,
    snapshotFixture,
  }) => {
    await page.goto(conf.suiteConf.link);
    const templateStore = new TemplateStorePage(page);
    webBuilder = new WebBuilder(page, conf.suiteConf.link);
    xpath = new Blocks(page);
    const frameLocator = page.frameLocator(xpath["previewTemplate"]);

    for (const template of conf.caseConf.data) {
      await test.step(`${template.description}`, async () => {
        //Click icon preview template
        await templateStore.previewTemplate(template.hover);
        await page.locator(xpath.spinner).waitFor({ state: "hidden" });
        await frameLocator.locator(xpath["textWB"]).waitFor({ state: "visible" });
        const isPopupVisible = await frameLocator.locator(xpath["closePopupPreview"]).isVisible();
        if (isPopupVisible == true) {
          await frameLocator.locator(xpath["closePopupPreview"]).click();
          await frameLocator.locator(xpath["secondSlideShow"]).click();
        } else {
          await frameLocator.locator(xpath["secondSlideShow"]).click();
        }
        await page.waitForTimeout(2000); // đợi slide show hiện đủ content
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          snapshotName: template.preview,
          combineOptions: { fullPage: true },
        });

        await page.locator(xpath["btnBackPreview"]).click();
        await webBuilder.waitForXpathState(xpath["listTemplate"], "stable");
        //Click icon apply template
        await templateStore.applyTemplate(template.hover);
        expect(page.url()).toContain(template.apply.redirect);
      });
    }
  });

  test("Check color, font của màn preview theme template @SB_NEWECOM_TS_14", async ({
    conf,
    page,
    snapshotFixture,
  }) => {
    const template = conf.caseConf.data;
    await page.goto(conf.suiteConf.link);
    const templateStore = new TemplateStorePage(page);
    xpath = new Blocks(page);
    webBuilder = new WebBuilder(page, conf.suiteConf.link);
    const frameLocator = page.frameLocator(xpath["previewTemplate"]);

    await test.step(`${template.description}`, async () => {
      //Click icon preview template
      await templateStore.previewTemplate(template.hover);
      await page.locator(xpath.spinner).waitFor({ state: "hidden" });

      //Verify data in droplist color
      await page.locator(xpath.getDroplistColorFont(0)).click();
      for (const color of template.color) {
        await expect(page.locator(xpath.getOptionColor(color.color, color.name))).toBeVisible();
      }

      //Verify data in droplist font
      await page.locator(xpath.getDroplistColorFont(1)).click();
      for (const font of template.font) {
        await expect(page.locator(xpath.getOptionFont(font.name, font.style))).toBeVisible();
      }

      //Change data color + font
      await templateStore.changeColor(template.change_data.color);
      await templateStore.changeFont(template.change_data.font);
      await frameLocator.locator(xpath["textWB"]).waitFor({ state: "visible" });
      const isPopupVisible = await frameLocator.locator(xpath["closePopupPreview"]).isVisible();
      if (isPopupVisible == true) {
        await frameLocator.locator(xpath["closePopupPreview"]).click();
        await frameLocator.locator(xpath["secondSlideShow"]).click();
      } else {
        await frameLocator.locator(xpath["secondSlideShow"]).click();
      }
      await page.waitForTimeout(2000); // đợi slide show hiện đủ content
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        snapshotName: template.change_data.snapshot,
        combineOptions: { fullPage: true },
      });
    });
  });

  test("Check click vào button back trong màn preview template @SB_NEWECOM_TS_15", async ({
    conf,
    page,
    snapshotFixture,
  }) => {
    await page.goto(conf.suiteConf.link);
    webBuilder = new WebBuilder(page, conf.suiteConf.link);
    xpath = new Blocks(page);
    const templateStore = new TemplateStorePage(page);
    const frameLocator = page.frameLocator(xpath["previewTemplate"]);

    const data = conf.caseConf.data;
    // Ở prodtest, dev báo không search + filter đúng được data ở màn template store do vấn đề về môi trường
    // do việc tách bảng database trên prod với prodtest
    if (process.env.ENV !== "prodtest") {
      await templateStore.searchTemplateNewUI(data.template_name, "desktop");
      await page.waitForTimeout(2000); // đợi kết quả search hiện
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await page.waitForSelector(`//p[@title="${data.template_name}"]`, { state: "visible" });
      expect(page.url()).toEqual(`${conf.suiteConf.link}?q=${data.template_name}`);
    }

    //Click icon preview template > click icon back
    await templateStore.previewTemplate(data.template_name);
    await page.locator(xpath.spinner).waitFor({ state: "hidden" });
    await page.locator(xpath["btnBackPreview"]).click();

    if (process.env.ENV !== "prodtest") {
      expect(page.url()).toEqual(`${conf.suiteConf.link}?q=${data.template_name}`);
    } else {
      expect(page.url()).toEqual(conf.suiteConf.link);
    }
    await webBuilder.waitForXpathState(xpath["listTemplate"], "stable");
    await page.waitForLoadState("load");
    await snapshotFixture.verifyWithAutoRetry({
      page: page,
      selector: xpath["listTemplate"],
      snapshotName: data.expect.filter,
    });

    //Click icon preview template
    await templateStore.previewTemplate(data.template_name);
    await page.locator(xpath.spinner).waitFor({ state: "hidden" });
    await templateStore.changeColor(data.change_color);
    await templateStore.changeFont(data.change_font);
    await page.locator(xpath["btnBackPreview"]).click();
    await webBuilder.waitForXpathState(xpath["listTemplate"], "stable");

    await templateStore.previewTemplate(data.template_name);
    await page.locator(xpath.spinner).waitFor({ state: "hidden" });
    const isPopupVisible = await frameLocator.locator(xpath["closePopupPreview"]).isVisible();
    if (isPopupVisible == true) {
      await frameLocator.locator(xpath["closePopupPreview"]).click();
      await frameLocator.locator(xpath["secondSlideShow"]).click();
    } else {
      await frameLocator.locator(xpath["secondSlideShow"]).click();
    }
    await page.waitForTimeout(2000); // đợi slide show hiện đủ content
    await snapshotFixture.verifyWithAutoRetry({
      page: page,
      snapshotName: data.expect.snapshot,
      combineOptions: { fullPage: true },
    });
  });

  test("Check switch device trong màn preview template @SB_NEWECOM_TS_16", async ({ conf, page, snapshotFixture }) => {
    await page.goto(conf.suiteConf.link);
    webBuilder = new WebBuilder(page, conf.suiteConf.link);
    xpath = new Blocks(page);
    const templateStore = new TemplateStorePage(page);
    const frameLocator = page.frameLocator(xpath["previewTemplate"]);

    await test.step("Screenshot template ở mobile với color, font default", async () => {
      await expect(page.locator(`(//img[@alt = "${conf.caseConf.data.hover}"])[1]//parent::figure`)).toBeVisible();
      await templateStore.previewTemplate(conf.caseConf.data.hover);
      await page.locator(xpath.spinner).waitFor({ state: "hidden" });
      await templateStore.switchDevice("Mobile");
      await page.waitForLoadState("load");
      const isPopupVisible = await frameLocator.locator(xpath["closePopupPreview"]).isVisible();
      if (isPopupVisible == true) {
        await frameLocator.locator(xpath["closePopupPreview"]).click();
      }
      await page.waitForTimeout(2000); // đợi slide show hiện đủ content
      await page
        .frameLocator(themes.iframePreviewTemplate)
        .locator(templateStore.dotSecondSlideshow)
        .and(page.locator(templateStore.activeDot))
        .waitFor();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        snapshotName: conf.caseConf.data.mobile,
        combineOptions: { fullPage: true },
      });
    });

    await test.step("Screenshot template ở mobile sau khi change color, font default ở desktop", async () => {
      await templateStore.switchDevice("Desktop");
      //Change color + font
      await templateStore.changeColor(conf.caseConf.data.desktop.change_color);
      await templateStore.changeFont(conf.caseConf.data.desktop.change_font);
      await frameLocator.locator(xpath["textWB"]).waitFor({ state: "visible" });
      await templateStore.switchDevice("Mobile");
      await page.waitForLoadState("load");
      const isPopupVisible = await frameLocator.locator(xpath["closePopupPreview"]).isVisible();
      if (isPopupVisible == true) {
        await frameLocator.locator(xpath["closePopupPreview"]).click();
      }
      await page.waitForTimeout(2000); // đợi slide show hiện đủ content
      await page
        .frameLocator(themes.iframePreviewTemplate)
        .locator(templateStore.dotSecondSlideshow)
        .and(page.locator(templateStore.activeDot))
        .waitFor();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        snapshotName: conf.caseConf.data.desktop.mobile_change,
        combineOptions: { fullPage: true },
      });
    });
  });

  test("Check apply theme template ở ngoài màn template store khi đã login + chọn store có sẵn @SB_NEWECOM_TS_17", async ({
    conf,
    page,
    snapshotFixture,
  }) => {
    for (const template of conf.caseConf.data) {
      await page.goto(conf.suiteConf.link);
      const templateStore = new TemplateStorePage(page);
      webBuilder = new WebBuilder(page, conf.suiteConf.link);
      xpath = new Blocks(page, conf.suiteConf.link);
      const popup = template.popup;
      //Apply template
      if (popup.apply.success) {
        await page.locator(xpath["buttonLogin"]).click();
        await templateStore.loginTemplateStore(
          conf.suiteConf.shop_template.username,
          conf.suiteConf.shop_template.password,
          conf.suiteConf.link,
        );
      }
      await templateStore.applyTemplate(template.hover);
      await page.locator(xpath.spinner).waitFor({ state: "hidden" });
      await webBuilder.waitForXpathState(xpath["popupTemplate"], "stable");
      await page.waitForLoadState("load");
      if (popup.snapshot) {
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: xpath["popupTemplate"],
          snapshotName: popup.snapshot,
        });
      }
      //Verify apply template success/fail
      if (popup.apply.success) {
        await templateStore.addStore(conf.suiteConf.shop_template.apply_shop);
        await expect(page.locator(xpath.getMessAddTempSucc(popup.apply.name))).toBeVisible();
        expect(page.url()).toContain("/admin");
        await page.locator(xpath.getXpathButtonText("Customize")).click();
        await page.locator(xpath.overlay).waitFor({ state: "hidden" });
        await page.frameLocator(xpath["previewWb"]).locator(xpath["textWB"]).waitFor({ state: "visible" });
        await page.locator(xpath.spinner).waitFor({ state: "hidden" });
        await webBuilder.waitForXpathState(xpath["previewDesktop"], "stable");
        await page.waitForTimeout(2000); // đợi slide show hiện đủ content
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          snapshotName: popup.apply.snapshot,
          combineOptions: { fullPage: true },
        });
      } else {
        await templateStore.addStore(conf.suiteConf.shop_template.apply_shop_fail);
        await expect(page.locator(xpath.getMessAddTempFail(popup.apply.message))).toBeVisible();
        await expect(page.locator(xpath["popupTemplate"])).toBeVisible();
      }
    }
  });

  const confNotLogin = loadData(__dirname, "NOT_LOGIN");
  for (let i = 0; i < confNotLogin.caseConf.length; i++) {
    const dataSetting = confNotLogin.caseConf[i];
    test(`${dataSetting.description} @${dataSetting.id}`, async ({ conf, page, snapshotFixture }) => {
      test.slow();
      xpath = new Blocks(page, conf.suiteConf.link);
      const templateStore = new TemplateStorePage(page);
      await page.goto(conf.suiteConf.link);
      webBuilder = new WebBuilder(page, conf.suiteConf.link);

      await templateStore.applyTemplate(dataSetting.data.hover);
      await page.waitForLoadState("load");
      await templateStore.loginTemplateStore(
        conf.suiteConf.shop_template.username,
        conf.suiteConf.shop_template.password,
        conf.suiteConf.link,
      );
      await page.locator(templateStore.xpathPopupChooseStoreInput).focus();
      await page.locator(`//div[normalize-space()="${conf.suiteConf.shop_template.apply_shop}"]//parent::span`).click();
      await page.locator(templateStore.xpathPopupChooseStoreAddTemplateBtn).click();
      await page.waitForURL(/admin/);
      await expect(page.locator(xpath.getMessAddTempSucc(dataSetting.data.hover))).toBeVisible();

      expect(page.url()).toContain("/admin");
      await page.locator(xpath.getXpathButtonText("Customize")).click();
      await page.locator(xpath.spinner).waitFor({ state: "hidden" });
      await page.frameLocator(xpath["previewWb"]).locator(xpath["textWB"]).waitFor({ state: "visible" });
      await webBuilder.waitForXpathState(xpath["previewDesktop"], "stable");
      const image = dataSetting.data.apply ? dataSetting.data.apply.snapshot : dataSetting.data.preview.apply.snapshot;
      await webBuilder.frameLocator.locator(xpath["secondSlideShow"]).click();
      await page.waitForTimeout(2000); // đợi slide show hiện đủ content
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        snapshotName: image,
        combineOptions: { fullPage: true },
      });
    });
  }

  const confLogin = loadData(__dirname, "LOGIN");
  for (let i = 0; i < confLogin.caseConf.length; i++) {
    const dataSetting = confLogin.caseConf[i];
    test(`${dataSetting.description} @${dataSetting.id}`, async ({ conf, page, snapshotFixture }) => {
      xpath = new Blocks(page, conf.suiteConf.link);
      const templateStore = new TemplateStorePage(page);
      await page.goto(conf.suiteConf.link);
      webBuilder = new WebBuilder(page, conf.suiteConf.link);
      if (dataSetting.data.login) {
        await page.locator(xpath["buttonLogin"]).click();
        await templateStore.loginTemplateStore(
          conf.suiteConf.shop_template.username,
          conf.suiteConf.shop_template.password,
          conf.suiteConf.link,
        );
      }
      if (dataSetting.data.apply) {
        await templateStore.applyTemplate(dataSetting.data.hover);
      }
      const preview = dataSetting.data.preview;
      if (preview) {
        await templateStore.previewTemplate(dataSetting.data.hover);
        await page.locator(xpath.spinner).waitFor({ state: "hidden" });
        if (preview.change) {
          await templateStore.changeColor(preview.change.change_color);
          await templateStore.changeFont(preview.change.change_font);
        }
        if (preview.apply) {
          await page.locator(xpath["btnAddTemplatePreview"]).click();
        }
      }
      if (dataSetting.data.apply || preview.apply) {
        await webBuilder.waitForXpathState(xpath["popupTemplate"], "stable");
        await templateStore.addStore(conf.suiteConf.shop_template.apply_shop);
        await expect(page.locator(xpath.getMessAddTempSucc(dataSetting.data.hover))).toBeVisible();
        expect(page.url()).toContain("/admin");
      }

      await page.locator(xpath.getXpathButtonText("Customize")).click();
      await page.locator(xpath.spinner).waitFor({ state: "hidden" });
      await page.frameLocator(xpath["previewWb"]).locator(xpath["textWB"]).waitFor({ state: "visible" });
      await webBuilder.waitForXpathState(xpath["previewDesktop"], "stable");
      const image = dataSetting.data.apply ? dataSetting.data.apply.snapshot : dataSetting.data.preview.apply.snapshot;
      await webBuilder.frameLocator.locator(xpath["secondSlideShow"]).click();
      await page.waitForTimeout(2000); // đợi slide show hiện đủ content
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        snapshotName: image,
        combineOptions: { fullPage: true },
      });
    });
  }
});

test.describe("Verify template store case create new store", () => {
  let shopTemplateData, templateStoreUrl, caseData;
  let templateStorePage: TemplateStorePage;
  // Sometime, our theme is created slower than expected.
  // So we need retry 5 times on dev, and 2 time on other env
  const currentEnv = process.env.ENV;
  const retryTime = currentEnv === "local" || currentEnv === "dev" ? 10 : 3;

  test.beforeEach(async ({ dashboard, conf, token, page }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.shop_template.apply_shop,
      username: conf.suiteConf.shop_template.username,
      password: conf.suiteConf.shop_template.password,
    });
    accessToken = shopToken;
    await themes.deleteAllThemesUnPublish(accessToken);

    shopTemplateData = conf.suiteConf.shop_template;
    templateStoreUrl = conf.suiteConf.link;
    caseData = conf.caseConf.data;
    templateStorePage = new TemplateStorePage(page);
    xpath = new Blocks(page, conf.suiteConf.link);
    webBuilder = new WebBuilder(page, conf.suiteConf.link);
  });

  test(`@SB_NEWECOM_TS_18 Check apply theme template ở ngoài màn template store khi đã login + create new store`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Pre-condition: Vào link template store, login vào store`, async () => {
      await templateStorePage.openTemplateStore(templateStoreUrl);
      await expect(templateStorePage.genLoc(templateStorePage.xpaths.heading)).toBeVisible();

      await templateStorePage.genLoc(templateStorePage.xpaths.buttons.login).click();
      await templateStorePage.loginTemplateStore(caseData.apply_username, caseData.apply_password, templateStoreUrl);
    });

    await test.step(`Hover vào theme template > Click button Add template`, async () => {
      await templateStorePage.applyTemplate(shopTemplateData.template_name);
      await expect(templateStorePage.genLoc(templateStorePage.xpaths.popupAddToStore.container).first()).toBeVisible();
    });

    await test.step(`Chọn new store`, async () => {
      await templateStorePage.genLoc(templateStorePage.xpaths.popupAddToStore.radioOption.aNewStore).click();
      await expect(
        templateStorePage.genLoc(templateStorePage.xpaths.popupAddToStore.buttons.addTemplate).first(),
      ).toBeDisabled();
    });

    const randomStoreName = "test-templatestore-" + generateRandomCharacters(4);

    await test.step(`Tạo store mới, kiểm tra tự động redirect tới màn hình themes và có message thông báo add thành công`, async () => {
      await templateStorePage.addNewStore(randomStoreName, conf.suiteConf.shop_data);

      // Wait for sidebar menu appear
      await expect(templateStorePage.genLoc(templateStorePage.cssSelector.menuSidebar)).toBeVisible();

      for (let i = 0; i < retryTime; i++) {
        try {
          await expect(
            templateStorePage.genLoc(xpath.getMessAddTempSucc(shopTemplateData.template_name)),
          ).toBeVisible();
        } catch (e) {
          logger.info("Got err when wait title alert visible");
          await templateStorePage.page.reload();
          await expect(templateStorePage.genLoc(templateStorePage.cssSelector.menuSidebar)).toBeVisible();
        }

        await expect(page.locator(xpath.getMessAddTempSucc(shopTemplateData.template_name))).toBeVisible();
      }

      expect(page.url()).toContain("/admin/themes");
    });

    await test.step(`Customize theme vừa add`, async () => {
      await templateStorePage.customizePublicTheme();
      await templateStorePage.openColorSetting();
      // Screenshot
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: templateStorePage.xpathSidebar,
        snapshotName: `${process.env.ENV}-SB_NEWECOM_TS_18-font.png`,
        combineOptions: { fullPage: true },
      });

      await templateStorePage.openFontSetting();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: templateStorePage.xpathSidebar,
        snapshotName: `${process.env.ENV}-SB_NEWECOM_TS_18-color.png`,
        combineOptions: { fullPage: true },
      });

      await templateStorePage.clickBtnNavigationBar("exit");
    });

    await test.step(`Click vào list page`, async () => {
      await templateStorePage.gotoPageList();

      let isPassed = false;
      for (let i = 0; i < retryTime; i++) {
        try {
          const pages = await templateStorePage.getListPages();
          // Verify that contain
          expect(pages).toEqual(expect.objectContaining(conf.suiteConf.shop_template.pages));
          isPassed = true;
          break;
        } catch (e) {
          // Wait 1s to make sure all pages were shown
          await templateStorePage.page.waitForTimeout(1000);
          await templateStorePage.page.reload();
          await templateStorePage.waitNetworkIdleWithoutThrow();
        }
      }

      expect(isPassed).toEqual(true);
    });
  });

  test(`@SB_NEWECOM_TS_27 Check apply theme template ở trong màn preview khi không change font, color + đã login + create store`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Pre-condition: Vào link template store, login vào store`, async () => {
      await templateStorePage.openTemplateStore(templateStoreUrl);
      await expect(templateStorePage.genLoc(templateStorePage.xpaths.heading)).toBeVisible();

      await templateStorePage.genLoc(templateStorePage.xpaths.buttons.login).click();
      await templateStorePage.loginTemplateStore(caseData.apply_username, caseData.apply_password, templateStoreUrl);
    });

    await test.step(`Preview template > Click button Add template`, async () => {
      await templateStorePage.previewTemplate(shopTemplateData.template_name);
      await page.locator(xpath.spinner).waitFor({ state: "hidden" });
      await page.locator(xpath["btnAddTemplatePreview"]).click();
      await webBuilder.waitForXpathState(xpath["popupTemplate"], "stable");
      await page.waitForLoadState("load");
    });

    await test.step(`Chọn new store`, async () => {
      await templateStorePage.genLoc(templateStorePage.xpaths.popupAddToStore.radioOption.aNewStore).click();
      await expect(
        templateStorePage.genLoc(templateStorePage.xpaths.popupAddToStore.buttons.addTemplate).first(),
      ).toBeDisabled();
    });

    const randomStoreName = "test-templatestore-" + generateRandomCharacters(4);

    await test.step(`Tạo store mới, kiểm tra tự động redirect tới màn hình themes và có message thông báo add thành công`, async () => {
      await templateStorePage.addNewStore(randomStoreName, conf.suiteConf.shop_data);

      // Wait for sidebar menu appear
      await expect(templateStorePage.genLoc(templateStorePage.cssSelector.menuSidebar)).toBeVisible();

      for (let i = 0; i < retryTime; i++) {
        try {
          await expect(
            templateStorePage.genLoc(xpath.getMessAddTempSucc(shopTemplateData.template_name)),
          ).toBeVisible();
        } catch (e) {
          logger.info("Got err when wait title alert visible");
          await templateStorePage.page.reload();
          await expect(templateStorePage.genLoc(templateStorePage.cssSelector.menuSidebar)).toBeVisible();
        }

        await expect(page.locator(xpath.getMessAddTempSucc(shopTemplateData.template_name))).toBeVisible();
      }

      expect(page.url()).toContain("/admin/themes");
    });

    await test.step(`Customize theme vừa add`, async () => {
      await templateStorePage.customizePublicTheme();
      await templateStorePage.openColorSetting();
      // Screenshot
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: templateStorePage.xpathSidebar,
        snapshotName: `${process.env.ENV}-SB_NEWECOM_TS_27-font.png`,
        combineOptions: { fullPage: true },
      });

      await templateStorePage.openFontSetting();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: templateStorePage.xpathSidebar,
        snapshotName: `${process.env.ENV}-SB_NEWECOM_TS_27-color.png`,
        combineOptions: { fullPage: true },
      });

      await templateStorePage.clickBtnNavigationBar("exit");
    });

    await test.step(`Click vào list page`, async () => {
      await templateStorePage.gotoPageList();

      let isPassed = false;
      for (let i = 0; i < retryTime; i++) {
        try {
          const pages = await templateStorePage.getListPages();
          logger.info(JSON.stringify(pages));
          // Verify that contain
          expect(pages).toEqual(expect.objectContaining(conf.suiteConf.shop_template.pages));
          isPassed = true;
          break;
        } catch (e) {
          logger.info("Got err when wait title alert visible");
          await templateStorePage.page.reload();
          await templateStorePage.waitNetworkIdleWithoutThrow();
        }
      }

      expect(isPassed).toEqual(true);
    });
  });
});
