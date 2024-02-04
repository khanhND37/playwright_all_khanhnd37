import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl, waitSelector } from "@utils/theme";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { TemplateStorePage } from "@sf_pages/template_store";
import { expect } from "@playwright/test";

let accessToken: string, themes: ThemeEcom, webBuilder: WebBuilder, templateStore: TemplateStorePage, xpath: Blocks;

test.describe("Verify website template management", () => {
  test.beforeEach(async ({ dashboard, conf, token }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    await themes.deleteAllThemesUnPublish(accessToken);

    await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes/`);
    templateStore = new TemplateStorePage(dashboard);
    xpath = new Blocks(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
  });

  test("Check filter theo library trong popup chọn website template @SB_WEB_BUILDER_WTM_06", async ({
    conf,
    dashboard,
  }) => {
    const allTemplate = [];
    await themes.clickBtnByName("Browse templates");
    const listLib = await themes.getListLibrary(accessToken);

    await test.step("Verify droplist library với library active", async () => {
      await expect(dashboard.locator(themes["listLibrary"])).toHaveCount(listLib.length + 1);
      await expect(dashboard.locator(`${themes["listLibrary"]} >> nth=0`)).toHaveText("All libraries");
      for (const lib of listLib) {
        //Verify show list template được active + thuộc store type TH filter theo từng libary
        await dashboard.locator(themes["btnFilterLib"]).click();
        await expect(dashboard.locator(themes.getXpathFilterNameLib(lib.title))).toBeVisible();
        await dashboard.locator(themes.getXpathFilterNameLib(lib.title)).click();
        await dashboard.waitForResponse(
          response => response.url().includes("builder/template/themes.json?search") && response.status() == 200,
        );
        const listTemp = await themes.getListWebsiteTemplate(accessToken, lib.id, conf.suiteConf.store_type);
        await expect(dashboard.locator(themes["infoTemplate"])).toHaveCount(listTemp.length);
        for (const temp of listTemp) {
          await expect(dashboard.locator(themes.getXpathTitleTemp(temp.title))).toBeVisible();
          allTemplate.push(temp.title);
        }
      }
    });

    //Verify show list template được active + thuộc store type TH filter theo All library
    await dashboard.locator(themes["btnFilterLib"]).click();
    await dashboard.locator(themes.getXpathFilterNameLib("All libraries")).click();
    await dashboard.waitForResponse(
      response => response.url().includes("builder/template/themes.json?search") && response.status() == 200,
    );
    await expect(dashboard.locator(themes["infoTemplate"])).toHaveCount(allTemplate.length);
    for (const temp of allTemplate) {
      await expect(dashboard.locator(themes.getXpathTitleTemp(temp))).toBeVisible();
    }
  });

  test("Check hover vào website template trong popup chọn website template @SB_WEB_BUILDER_WTM_08", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const data = conf.caseConf.data;
    await themes.clickBtnByName("Browse templates");
    await test.step("Click icon preview template", async () => {
      await themes.clickYourTemplate();
      await templateStore.previewTemplate(data.hover);
      await dashboard.locator(xpath.spinner).waitFor({ state: "hidden" });
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: data.preview,
        combineOptions: { fullPage: true },
        sizeCheck: true,
      });
      await dashboard.locator(themes["btnBackPreview"]).click();
      await webBuilder.waitForXpathState(themes["listTemplate"], "stable");
    });
  });

  test("Check data default của màn preview website template @SB_WEB_BUILDER_WTM_09", async ({ conf, dashboard }) => {
    await themes.clickBtnByName("Browse templates");
    const data = conf.caseConf.data;
    await templateStore.previewTemplate(data.hover);
    await test.step("Click vào droplist chọn color", async () => {
      await dashboard.locator(themes.getDroplistColorFont(0)).click();
      for (const color of data.color) {
        await expect(dashboard.locator(xpath.getOptionColor(color.color, color.name))).toBeVisible();
      }
    });

    await test.step("Click vào droplist chọn font", async () => {
      await dashboard.locator(themes.getDroplistColorFont(1)).click();
      for (const font of data.font) {
        await expect(dashboard.locator(xpath.getOptionFont(font.name, font.style))).toBeVisible();
      }
    });
  });

  test("Check click vào button back trong màn preview template @SB_WEB_BUILDER_WTM_10", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    await themes.clickBtnByName("Browse templates");
    const data = conf.caseConf.data;
    await test.step("Not change color + font and click button back", async () => {
      await themes.clickYourTemplate();
      await templateStore.previewTemplate(data.hover);
      await dashboard.locator(themes["btnBackPreview"]).click();
      await expect(dashboard.locator(themes["templatePreview"])).toBeHidden();
      await webBuilder.waitForXpathState(themes["listTemplate"], "stable");
    });

    await test.step("Change color + font and click button back", async () => {
      await templateStore.previewTemplate(data.hover);
      await themes.changeColor(data.change_color);
      await themes.changeFont(data.change_font);
      await dashboard.locator(themes["btnBackPreview"]).click();
      await webBuilder.waitForXpathState(themes["listTemplate"], "stable");

      await templateStore.previewTemplate(data.hover);
      await dashboard.locator(xpath.spinner).waitFor({ state: "hidden" });
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: data.expect.snapshot,
        combineOptions: { fullPage: true },
        sizeCheck: true,
      });
    });
  });

  test("Check switch device trong màn preview template @SB_WEB_BUILDER_WTM_11", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    await themes.clickBtnByName("Browse templates");
    const { desktop, mobile, hover } = conf.caseConf.data;
    await test.step("Screenshot template ở mobile với color, font default", async () => {
      await themes.clickYourTemplate();
      await templateStore.previewTemplate(hover);
      await dashboard.locator(xpath.spinner).waitFor({ state: "hidden" });
      await templateStore.switchDevice("Mobile");
      await webBuilder.waitForXpathState(themes.switchMobile, "stable");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: mobile,
        combineOptions: { fullPage: true },
        sizeCheck: true,
      });
    });

    await test.step("Screenshot template ở mobile sau khi change color, font default ở desktop", async () => {
      await templateStore.switchDevice("Desktop");
      //Change color + font
      await themes.changeColor(desktop.change_color);
      await themes.changeFont(desktop.change_font);
      await templateStore.switchDevice("Mobile");
      await webBuilder.waitForXpathState(themes.switchMobile, "stable");

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: desktop.mobile_change,
        combineOptions: { fullPage: true },
        sizeCheck: true,
      });
    });
  });

  test("Check apply template khi không thay đổi color + font ở màn preview @SB_WEB_BUILDER_WTM_12", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    await themes.clickBtnByName("Browse templates");
    const { message, name, snapshot } = conf.caseConf.data;

    await test.step("Preview template > Apply template", async () => {
      await themes.clickYourTemplate();
      await templateStore.previewTemplate(name);
      await dashboard.locator(themes["btnApplyPreview"]).click();
      await expect(dashboard.locator(xpath.getXpathByText(message))).toBeVisible();
    });

    await test.step("Customize theme với template vừa add", async () => {
      await themes.clickBtnByName("Customize", 2);
      await dashboard.locator(xpath.spinner).waitFor({ state: "hidden" });
      await dashboard.frameLocator(xpath["previewWb"]).locator(xpath["textWB"]).waitFor({ state: "visible" });
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: snapshot,
        combineOptions: { fullPage: true },
        sizeCheck: true,
      });
    });
  });

  test("Check apply template khi có thay đổi color + font ở màn preview @SB_WEB_BUILDER_WTM_14", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const setting = conf.caseConf.data;
    await test.step("Change color font > apply template", async () => {
      await themes.clickBtnByName("Browse templates");
      await themes.clickYourTemplate();
      await themes.previewApplyTemplate(setting.hover, setting.change);
      await expect(dashboard.locator(themes.getXpathNameTempApply(setting.hover))).toBeVisible();
    });

    await test.step("Customize theme với template vừa add", async () => {
      await dashboard.locator(themes.getXpathCustomizeTheme(setting.hover, 1, false)).click();
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(xpath.spinner).waitFor({ state: "hidden" });
      await dashboard.frameLocator(xpath["previewWb"]).locator(xpath["textWB"]).waitFor({ state: "visible" });
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: setting.snapshot,
        combineOptions: { fullPage: true },
        sizeCheck: true,
      });
    });
  });

  test("Check apply template ngay ở màn chọn website template @SB_WEB_BUILDER_WTM_15", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const setting = conf.caseConf.data;
    await test.step("Apply template ngay ở màn chọn template", async () => {
      await themes.clickBtnByName("Browse templates");
      await themes.clickYourTemplate();
      await templateStore.applyTemplate(setting.hover);
    });

    await test.step("Customize theme với template vừa add", async () => {
      await themes.clickBtnByName("Customize", 2);
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: setting.snapshot,
        combineOptions: { fullPage: true },
        sizeCheck: true,
      });
    });
  });

  test("Check add shop theme ở màn manage @SB_WEB_BUILDER_WTM_16", async ({ conf, dashboard }) => {
    const currentTheme = await dashboard.locator(themes["currentTheme"]).innerText();
    for (const setting of conf.caseConf.data) {
      if (setting.add_theme) {
        for (let i = 0; i < setting.add_theme.number; i++) {
          await themes.selectActionTheme("Duplicate", currentTheme);
        }
      }
      if (setting.remove) {
        for (let i = 0; i < setting.remove.number; i++) {
          const themeUnpublish = await dashboard.locator(themes.getXpathThemeUnpusblish()).innerText();
          await themes.selectActionTheme("Remove", themeUnpublish, 1, false);
          await themes.clickBtnByName("Remove", 1, themes["popup"]);
        }
      }
      if (setting.maximum) {
        await expect(dashboard.locator(webBuilder.getXpathByText(setting.message))).toBeVisible();
        //Button Copy a template bị disable
        await expect(dashboard.locator(themes.getXpathBtnByName("Copy a template"))).toHaveAttribute(
          "disabled",
          "disabled",
        );
        //Ẩn trường Duplicate ở action
        await expect(dashboard.locator(themes.getXpathByName("Duplicate"))).toHaveAttribute(
          "class",
          themes["hideDuplicate"],
        );

        //Ẩn trường Apply template
        await themes.clickBtnByName("Browse templates");
        await expect(dashboard.locator(themes.getXpathBtnByName("Apply"))).toHaveAttribute("disabled", "disabled");
        //Ẩn trường Apply template trong preview template
        await dashboard.locator(themes.getXpathImageTemp()).hover();
        await dashboard.locator(themes["btnPreview"]).click();
        await expect(dashboard.locator(themes["btnApplyPreview"])).toHaveAttribute("disabled", "disabled");
        await dashboard.locator(themes["btnBackPreview"]).click();
        await dashboard.locator(themes["btnClosePopup"]).click();
      } else {
        await expect(dashboard.locator(webBuilder.getXpathByText(setting.message))).toBeHidden();
        //Button Copy a template enable
        await expect(dashboard.locator(themes.getXpathBtnNotDisable("Copy a template"))).toBeVisible();
        //Show trường Duplicate ở action
        await expect(dashboard.locator(themes.getXpathByName("Duplicate"))).toHaveAttribute(
          "class",
          themes["menuItem"],
        );
        //Ẩn trường Apply template
        await themes.clickBtnByName("Browse templates");
        await expect(dashboard.locator(themes.getXpathBtnNotDisable("Apply"))).toBeVisible();
        await dashboard.locator(themes["btnClosePopup"]).click();
      }
    }
  });

  test("Check action theme ở màn manage @SB_WEB_BUILDER_WTM_17", async ({
    conf,
    dashboard,
    token,
    context,
    snapshotFixture,
  }) => {
    //Chuẩn bị data, copy theme v2, v3
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.linked.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    themes = new ThemeEcom(dashboard, conf.suiteConf.linked.domain);
    const idThemeV3 = await themes.getIdTheme(accessToken, true);
    const idThemeV2 = await themes.getIdTheme(accessToken, false);
    await themes.copyTheme(idThemeV3.id);
    await dashboard.locator(webBuilder.getXpathByText("Your theme has been copied")).isVisible();
    await themes.copyTheme(idThemeV2.id);
    await dashboard.locator(webBuilder.getXpathByText("Your theme has been copied")).isVisible();

    for (const setting of conf.caseConf.data) {
      const version = setting.v2 ? idThemeV2.name : idThemeV3.name;
      const isPublish = !!setting.publish;
      const { actions } = setting;

      if (setting.v2 || setting.v3) {
        if (isPublish) {
          await test.step("Publish theme bất kì", async () => {
            await themes.publishTheme(version);
            await dashboard.waitForResponse(
              response =>
                response.url().includes("/admin/themes.json?order_by=updated_at&order_direction=desc") &&
                response.status() === 200,
            );
            await dashboard.locator(webBuilder.getXpathByText("This theme has been published")).isVisible();
            await waitSelector(dashboard, themes["currentTheme"]);
            await expect(dashboard.locator(themes["currentTheme"])).toHaveText(version);
          });
        }
      }

      if (isPublish && actions) {
        await test.step("Click vào action ở theme publish", async () => {
          if (setting.v2 || setting.v3) {
            await themes.clickBtnAction(version);
            await expect(dashboard.locator(themes["listAction"])).toHaveCount(actions.list.length);
            for (const action of actions.list) {
              await expect(dashboard.locator(themes.getXpathAction(action))).toBeVisible();
            }
            await themes.clickBtnAction(version);
          }
        });
      }

      if (actions.edit_language) {
        await test.step("Click vào action edit language", async () => {
          await themes.selectActionTheme("Edit language", version, 1, isPublish);
          await expect(dashboard.url()).toContain(actions.edit_language);
          await dashboard.goBack();
        });
      }

      if (actions.duplicate) {
        await test.step("Click vào action duplicate", async () => {
          await themes.selectActionTheme("Duplicate", version, 1, isPublish);
          await dashboard.waitForResponse(
            response => response.url().includes("/admin/themes/") && response.status() === 200,
          );
          await dashboard.locator(webBuilder.getXpathByText("Duplicate template successfully")).waitFor();
          const themeDuplicate = await dashboard.locator(themes.getXpathThemeUnpusblish()).innerText();
          expect(themeDuplicate).toEqual(`${actions.duplicate.theme} ${version}`);
        });
      }

      if (actions.mark_public) {
        await test.step("Click vào action Mark as public", async () => {
          await themes.selectActionTheme("Mark as Public", version, 1, isPublish);
          await snapshotFixture.verifyWithAutoRetry({
            page: dashboard,
            selector: themes["popup"],
            snapshotName: actions.mark_public.snapshot,
          });
          await themes.clickBtnByName("Cancel");
        });
      }

      if (actions.rename) {
        const nameNew = actions.rename.name_new;
        await test.step("Click vào action rename", async () => {
          await themes.selectActionTheme("Rename", version, 1, isPublish);
          await expect(dashboard.locator(themes["popup"])).toBeVisible();
          if (nameNew) {
            await dashboard.locator(themes["txtPopup"]).click();
            await dashboard.keyboard.press("Control+A");
            await dashboard.keyboard.press("Backspace");
            await dashboard.locator(themes["txtPopup"]).type(nameNew);
            await themes.clickBtnByName("Save");
            await expect(dashboard.locator(webBuilder.getXpathByText(nameNew))).toBeVisible();
          } else await themes.clickBtnByName("Cancel");
        });
      }

      if (actions.remove) {
        await test.step("Click vào action Remove", async () => {
          const countBefore = await dashboard.locator(`//*[normalize-space()='Copy of ${version}']`).count();
          await themes.selectActionTheme("Remove", `Copy of ${version}`, 1, false);
          await themes.clickBtnByName("Remove", 1, themes["popup"]);
          await expect(dashboard.locator(webBuilder.getXpathByText("Remove template successfully"))).toBeVisible();
          const countAfter = await dashboard.locator(`//*[normalize-space()='Copy of ${version}']`).count();
          await expect(countAfter).toEqual(countBefore - 1);
        });
      }

      if (actions.preview) {
        await test.step("Click vào action preview", async () => {
          const idTheme = await dashboard.locator(themes.getIdFirstWebsiteTemplate()).textContent();
          const nameThemeUnpublish = await dashboard.locator(themes.getNameFirstWebsiteTemplate()).textContent();
          const id = idTheme.split(" ").pop();
          const name = nameThemeUnpublish.replaceAll("\n", "");
          await themes.clickBtnAction(name.trim(), 1, false);
          await verifyRedirectUrl({
            page: dashboard,
            selector: themes.getXpathAction("Preview"),
            context: context,
            redirectUrl: `${actions.preview}${id}`,
          });
        });
      }
    }
  });

  test("Check copy theme ở màn manage @SB_WEB_BUILDER_WTM_18", async ({ conf, dashboard, token }) => {
    for (const setting of conf.caseConf.data) {
      await test.step(setting.description, async () => {
        let domainShop, usernameShop, passwordShop;
        switch (setting.shop) {
          case "same acc":
            domainShop = conf.suiteConf.linked.domain;
            usernameShop = conf.suiteConf.username;
            passwordShop = conf.suiteConf.password;
            break;
          case "other acc":
            domainShop = conf.suiteConf.other.domain;
            usernameShop = conf.suiteConf.other.username;
            passwordShop = conf.suiteConf.other.password;
            break;
          default:
            domainShop = conf.suiteConf.domain;
            usernameShop = conf.suiteConf.username;
            passwordShop = conf.suiteConf.password;
            break;
        }
        themes = new ThemeEcom(dashboard, domainShop);
        const { shop, message, id } = setting;
        if (shop) {
          const { access_token: shopToken } = await token.getWithCredentials({
            domain: domainShop,
            username: usernameShop,
            password: passwordShop,
          });
          accessToken = shopToken;
          const idThemeV3 = await themes.getIdTheme(accessToken, true);
          const idThemeV2 = await themes.getIdTheme(accessToken, false);
          await themes.copyTheme(idThemeV3.id);
          if (message) {
            await expect(dashboard.locator(themes["messageCopyTheme"])).toHaveText(message);
            await themes.clickBtnByName("Cancel");
          } else {
            // await dashboard.locator(webBuilder.getXpathByText("Copy template successfully")).isVisible();
            await expect(dashboard.locator(themes.getXpathNameThemeUnpublish(idThemeV3.name))).toBeVisible();
          }
          await themes.copyTheme(idThemeV2.id);
          if (message) {
            await expect(dashboard.locator(themes["messageCopyTheme"])).toHaveText(message);
            await themes.clickBtnByName("Cancel");
          } else {
            // Lỗi trên production
            // await dashboard.locator(webBuilder.getXpathByText("Copy template successfully")).isVisible();
            await expect(dashboard.locator(themes.getXpathNameThemeUnpublish(idThemeV2.name))).toBeVisible();
          }
        } else {
          await themes.copyTheme(id);
          await expect(dashboard.locator(themes["messageCopyTheme"])).toHaveText(message);
          await themes.clickBtnByName("Cancel");
        }
      });
    }
  });
});
