import { test } from "@fixtures/website_builder";
import { snapshotDir } from "@utils/theme";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { TemplateStorePage } from "@sf_pages/template_store";
import { expect } from "@playwright/test";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";

let accessToken: string,
  themes: ThemeEcom,
  webBuilder: WebBuilder,
  templateStore: TemplateStorePage,
  xpath: Blocks,
  idV3: number;

test.describe("Verify website template management", () => {
  test.beforeEach(async ({ dashboard, conf, token }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    templateStore = new TemplateStorePage(dashboard);
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    await themes.deleteAllThemesUnPublish(accessToken);
    const infor = await themes.getIdTheme(accessToken, true);
    xpath = new Blocks(dashboard, conf.suiteConf.domain);
    idV3 = infor.id;

    //Open website builder
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await webBuilder.openWebBuilder({ type: "site", id: idV3, page: "home", layout: "default" });
  });

  test("Change page template khi đang ở các page chỉ dùng được single-page template @SB_NEWECOM_CTP_01", async ({
    dashboard,
    builder,
    conf,
  }) => {
    const data = conf.caseConf.data;

    await test.step("Click icon Pages trên layout > Chọn Page = list page chỉ dùng được single-page template", async () => {
      // Click on tab pages
      await webBuilder.clickBtnNavigationBar("pages");
      await webBuilder.clickElementWithLabel("div", "Product detail");
      await dashboard.waitForResponse(response => response.url().includes(".json") && response.status() === 200);
      // Click on Change template
      await webBuilder.clickBtnNavigationBar("templates");
      const res = await builder.libraryDetail(1);
      const pages = res.pages;

      // Get list title template có tag contains Home và title contains Home
      const ids = pages.filter(item => item.store_types.includes(data.store_type)).map(obj => obj.id);
      const pagesTemp = await builder.getPageTemplateStore(conf.suiteConf.domain, {
        ids: ids.join(),
        action: "manager",
      });
      const tempsAPI = pagesTemp
        .filter(
          item =>
            item.store_types.includes(data.store_type) &&
            item.tags.some(tagItem => tagItem.toLowerCase().includes(data.page_type)),
        )
        .filter(item => item.page.includes("product"))
        .map(obj => obj.title);

      const templateDB = await dashboard.locator(themes.listNameTemplate).count();
      // if quantity template on dashboard not equal template api respond then scroll down last temp to loaded all templ
      if (templateDB < tempsAPI.length) {
        const template = dashboard.locator(themes.listNameTemplate).nth(tempsAPI.length - 1);
        await scrollUntilElementIsVisible({
          page: dashboard,
          viewEle: template,
        });
      }

      await expect(dashboard.locator(themes["listNameTemplate"])).toHaveCount(tempsAPI.length);
      for (const title of tempsAPI) {
        await expect(dashboard.locator(`[title='${title}']`)).toBeVisible();
      }

      // Get list title template all template theo type page đang open
      await xpath.showAllTemplate();
      const listSingleTemplate = pages
        .filter(item => item.store_types.includes(data.store_type))
        .filter(item => item.type.includes(data.type))
        .map(obj => obj.title);
      await expect(dashboard.locator(themes["listNameTemplate"])).toHaveCount(listSingleTemplate.length);
      for (const title of listSingleTemplate) {
        await expect(dashboard.locator(`[title='${title}']`)).toBeVisible();
      }
    });

    await test.step("Hover vào page template bất > Click button apply > Click button Cancel", async () => {
      await xpath.searchTemplate(data.hover);
      await templateStore.applyTemplate(data.hover);
      await themes.clickBtnByName("Cancel", 1, themes["popup"]);
      await expect(dashboard.locator(xpath.getXpathByText(data.message))).toBeHidden();
    });

    await test.step("Hover vào page template bất > Click button apply > Click button Apply", async () => {
      await templateStore.applyTemplate(data.hover);
      await themes.clickBtnByName("Apply", 1, themes["popup"]);
      await dashboard.waitForResponse(response => response.url().includes(".json") && response.status() === 200);
      await dashboard.locator(xpath.getXpathByText(data.message)).waitFor({ state: "visible" });
    });
  });

  test("Change page template khác single-page template @SB_NEWECOM_CTP_02", async ({
    dashboard,
    builder,
    conf,
    snapshotFixture,
  }) => {
    const data = conf.caseConf.data;
    await test.step("Click change page template", async () => {
      await webBuilder.clickBtnNavigationBar("templates");
      const res = await builder.libraryDetail(1);
      const pages = res.pages;

      // Get list title template có tag contains Home và title contains Home
      const ids = pages.filter(item => item.store_types.includes(data.store_type)).map(obj => obj.id);
      const pagesTemp = await builder.getPageTemplateStore(conf.suiteConf.domain, {
        ids: ids.join(),
        action: "manager",
      });
      const tempsAPI = pagesTemp
        .filter(
          item =>
            item.store_types.includes(data.store_type) &&
            item.tags.some(tagItem => tagItem.toLowerCase().includes(data.page_type)),
        )
        .filter(
          item =>
            item.page.includes("page") ||
            item.page.includes("home") ||
            item.page.includes("blogs") ||
            item.page.includes("blog_post") ||
            item.page.includes("collections"),
        )
        .map(obj => obj.title);

      const tempsDB = await dashboard.locator(themes.listNameTemplate).count();
      // if quantity template on dashboard not equal template api respond then scroll down last temp to loaded all templ
      if (tempsDB < tempsAPI.length) {
        const template = dashboard.locator(themes.listNameTemplate).nth(tempsAPI.length - 1);
        await scrollUntilElementIsVisible({
          page: dashboard,
          viewEle: template,
        });
      }

      await expect(dashboard.locator(themes.listNameTemplate)).toHaveCount(tempsAPI.length);
      for (const title of tempsAPI) {
        await expect(dashboard.locator(`[title='${title}']`)).toBeVisible();
      }

      // Get list title template all template theo type page đang open
      await xpath.showAllTemplate();
      const listOtherSingleTemplateAPI = pages
        .filter(item => item.store_types.includes(data.store_type))
        .filter(
          item =>
            item.type.includes("page") ||
            item.type.includes("home") ||
            item.type.includes("blogs") ||
            item.type.includes("blog_post") ||
            item.type.includes("collections"),
        )
        .map(obj => obj.title);

      const listOtherSingleTemplateDB = await dashboard.locator(themes.listNameTemplate).count();
      // if quantity template on dashboard not equal template api respond then scroll down last temp to loaded all templ
      if (listOtherSingleTemplateDB < listOtherSingleTemplateAPI.length) {
        const template = dashboard.locator(themes.listNameTemplate).nth(listOtherSingleTemplateAPI.length - 1);
        await scrollUntilElementIsVisible({
          page: dashboard,
          viewEle: template,
        });
      }
      await expect(dashboard.locator(themes.listNameTemplate)).toHaveCount(listOtherSingleTemplateAPI.length);
      for (const title of listOtherSingleTemplateAPI) {
        await expect(dashboard.locator(`[title='${title}']`)).toBeVisible();
      }
    });

    await test.step("Hover vào page template cùng loại (VD: đang ở page home, apply template cùng loại, lưu ở homepage) > Click button apply", async () => {
      await xpath.searchTemplate(data.other_type);
      await templateStore.applyTemplate(data.other_type);
      await themes.clickBtnByName("Apply", 1, themes["popup"]);
      await dashboard.waitForResponse(response => response.url().includes(".json") && response.status() === 200);
      await dashboard.locator(xpath.getXpathByText(data.message)).waitFor({ state: "visible" });
      await dashboard.locator(xpath.getXpathByText(data.message)).waitFor({ state: "hidden" });
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: data.preview.snapshot,
        combineOptions: { fullPage: true },
      });
    });
  });

  test("Check click vào button back trong màn preview template @SB_NEWECOM_CTP_11", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    await webBuilder.clickBtnNavigationBar("templates");
    const data = conf.caseConf.data;
    await test.step("Not change color + font and click button back", async () => {
      await xpath.searchTemplate(data.hover);
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
      await dashboard.frameLocator(themes["iframePreviewTemplate"]).locator(themes["popupWebsite"]).waitFor();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: data.expect.snapshot,
        combineOptions: { fullPage: true },
      });
    });
  });

  test("Check switch device trong màn preview template @SB_NEWECOM_CTP_12", async ({ conf, snapshotFixture }) => {
    await webBuilder.clickBtnNavigationBar("templates");
    const { desktop, mobile, hover } = conf.caseConf.data;
    await test.step("Screenshot template ở mobile với color, font default", async () => {
      await xpath.searchTemplate(hover);
      await templateStore.previewTemplate(hover);
      await webBuilder.page.locator(xpath.spinner).waitFor({ state: "hidden" });

      const box = await webBuilder.frameLocator.locator("#wb-main").first().boundingBox();
      // Width thêm 5 để move chuột đến thanh scroll tạo trigger exit intent
      await webBuilder.page.mouse.move(box.width + 5, 5);
      await webBuilder.page.frameLocator(themes["iframePreviewTemplate"]).locator(themes["popupWebsite"]).waitFor();
      await templateStore.switchDevice("Mobile");

      await webBuilder.page
        .frameLocator(themes["iframePreviewTemplate"])
        .locator(xpath["layoutDesktop"])
        .waitFor({ state: "hidden" });
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        snapshotName: mobile,
        combineOptions: { fullPage: true },
      });
    });

    await test.step("Screenshot template ở mobile sau khi change color, font default ở desktop", async () => {
      await templateStore.switchDevice("Desktop");
      //Change color + font
      await themes.changeColor(desktop.change_color);
      await themes.changeFont(desktop.change_font);
      await webBuilder.page.frameLocator(themes["iframePreviewTemplate"]).locator(themes["popupWebsite"]).waitFor();
      await templateStore.switchDevice("Mobile");
      await webBuilder.page
        .frameLocator(themes["iframePreviewTemplate"])
        .locator(xpath["layoutDesktop"])
        .waitFor({ state: "hidden" });

      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        snapshotName: desktop.mobile_change,
        combineOptions: { fullPage: true },
      });
    });
  });

  test("Check apply template khi không thay đổi color + font ở màn preview @SB_NEWECOM_CTP_13", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const { message, apply } = conf.caseConf.data;
    for (const template of apply) {
      await test.step("Preview template > Apply template", async () => {
        await webBuilder.clickBtnNavigationBar("templates");
        if (template.hover === "Template Page Styles") {
          await xpath.clickOnBtnWithLabel("Your templates");
        }
        await xpath.searchTemplate(template.hover);

        await templateStore.previewTemplate(template.hover);
        await dashboard.locator(themes["btnApplyPreview"]).click();
        await themes.clickBtnByName("Apply", 1, themes["popup"]);
        await dashboard.locator(xpath.spinner).waitFor({ state: "hidden" });
        await dashboard.frameLocator(xpath["previewWb"]).locator(xpath["textWB"]).waitFor({ state: "visible" });
        await webBuilder.hideOrShowLayerInSidebar({
          sectionName: conf.caseConf.data.hide_slide,
          sectionIndex: 1,
          isHide: true,
        });
        await dashboard.locator(xpath.getXpathByText(message)).waitFor({ state: "hidden" });
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          snapshotName: template.snapshot,
          combineOptions: { fullPage: true },
        });
      });
    }
  });

  test("Check apply template khi có thay đổi color + font ở màn preview @SB_NEWECOM_CTP_14", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const { message, apply } = conf.caseConf.data;
    for (const template of apply) {
      await test.step("Preview template > Change color font > Apply template", async () => {
        await webBuilder.clickBtnNavigationBar("templates");
        if (template.hover === "Template Page Styles") {
          await xpath.clickOnBtnWithLabel("Your templates");
        }
        await xpath.searchTemplate(template.hover);

        await templateStore.previewTemplate(template.hover);
        await themes.changeColor(conf.caseConf.data.change_color);
        await themes.changeFont(conf.caseConf.data.change_font);
        await dashboard.locator(themes["btnApplyPreview"]).click();
        await themes.clickBtnByName("Apply", 1, themes["popup"]);
        await dashboard.locator(xpath.spinner).waitFor({ state: "hidden" });
        await dashboard.frameLocator(xpath["previewWb"]).locator(xpath["textWB"]).waitFor({ state: "visible" });
        await webBuilder.hideOrShowLayerInSidebar({
          sectionName: conf.caseConf.data.hide_slide,
          sectionIndex: 1,
          isHide: true,
        });
        await dashboard.locator(xpath.getXpathByText(message)).waitFor({ state: "hidden" });
        // Đang có bug ở case change color font của template ăn theo setting website style
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          snapshotName: template.snapshot,
          combineOptions: { fullPage: true },
        });
      });
    }
  });

  test("Check current template trong popup change template @SB_NEWECOM_CTP_17", async ({ dashboard, conf, theme }) => {
    const res = await theme.applyTemplate(conf.suiteConf.template_id);
    idV3 = res.id;
    await theme.publish(idV3);
    await webBuilder.openWebBuilder({ type: "site", id: idV3, page: "home", layout: "default" });
    await dashboard.waitForLoadState("networkidle");

    const { message, apply } = conf.caseConf.data;

    for (const template of apply) {
      await test.step("Click vào link change template trên thanh bar", async () => {
        await webBuilder.clickBtnNavigationBar("templates");
        await xpath.showAllTemplate();
        if (template.default) {
          await expect(dashboard.locator(themes["currentTagTemplate"])).toHaveCount(0);
        }
      });

      await test.step("Apply 1 template bất kì", async () => {
        await xpath.searchTemplate(template.hover);
        await templateStore.applyTemplate(template.hover);
        await themes.clickBtnByName("Apply", 1, themes["popup"]);
        await dashboard.locator(xpath.getXpathByText(message)).waitFor({ state: "hidden" });
      });

      await test.step("Click lại vào link change template trên thanh bar", async () => {
        await webBuilder.clickBtnNavigationBar("templates");
        await xpath.showAllTemplate();
        await expect(dashboard.locator(themes["currentTagTemplate"])).toBeVisible();
        await expect(dashboard.locator(xpath.getXpathCurrentTemplate(template.hover))).toBeVisible();
        await expect(dashboard.locator(themes["templateFirst"])).toHaveText(template.hover);
        await dashboard.locator(themes["btnClosePopup"]).click();

        if (template.save) {
          await webBuilder.clickBtnNavigationBar("save");
        }
      });

      await test.step("Exit web builder rồi vào lại web builder > Click vào link change template trên thanh bar header", async () => {
        await webBuilder.clickBtnNavigationBar("exit");
        if (await dashboard.locator(xpath["popupTemplate"]).isVisible()) {
          await webBuilder.clickBtnInConfirmPopup("Leave");
        }
        await webBuilder.openWebBuilder({ type: "site", id: idV3, page: "home", layout: "default" });
        await dashboard.waitForLoadState("networkidle");
        await webBuilder.clickBtnNavigationBar("templates");
        await xpath.showAllTemplate();
        await expect(dashboard.locator(themes["currentTagTemplate"])).toBeVisible();
        await expect(dashboard.locator(xpath.getXpathCurrentTemplate(template.current_template))).toBeVisible();
        await expect(dashboard.locator(themes["templateFirst"])).toHaveText(template.current_template);
        await dashboard.locator(themes["btnClosePopup"]).click();
      });
    }
  });
});
