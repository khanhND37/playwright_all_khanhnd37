import { expect, test } from "@fixtures/website_builder";
import { WbLibrary } from "@pages/dashboard/wb_library";
import { SaveAsTemplateInput } from "@types";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { waitTimeout } from "@core/utils/api";

test.describe("Verify library detail của web template", () => {
  let wbPage: WbLibrary;
  let authConfig;
  let themes: ThemeEcom, accessToken: string;
  let webBuilder: WebBuilder;
  let libraryList;
  const lisbraryIds = [];

  test.beforeEach(async ({ dashboard, conf, builder, token }) => {
    test.slow();
    authConfig = {
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    };
    wbPage = new WbLibrary(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    await test.step(`Create new library`, async () => {
      await builder.createLibrary({ title: conf.caseConf.template_data.libraryName });
    });

    await test.step(`Delete all unpublish theme`, async () => {
      const { access_token: shopToken } = await token.getWithCredentials(authConfig);
      accessToken = shopToken;
      themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await themes.deleteAllThemesUnPublish(accessToken);
    });

    await test.step(`Save new web template`, async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.waitUtilSkeletonDisappear();

      if (conf.caseConf.template_data.name) {
        const saveAsTemplateIntput: SaveAsTemplateInput = conf.caseConf.template_data;
        await wbPage.saveActiveTemplate(saveAsTemplateIntput);
      }
    });
  });

  test.afterEach(async ({ builder, conf }) => {
    await test.step("Delete invalid library", async () => {
      libraryList = await builder.listLibrary({ action: "all" }, authConfig);
      const libraryTitles = [conf.caseConf.template_data.libraryName];

      libraryList.forEach(item => {
        if (libraryTitles.includes(item.title)) {
          lisbraryIds.push(item.id);
        }
      });

      if (lisbraryIds.length > 0) {
        await builder.deleteLibrary(lisbraryIds[lisbraryIds.length - 1]);
      }
    });
  });

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_142 Check trạngthái empty của tab web template trong library detail", async ({
    conf,
    snapshotFixture,
    dashboard,
  }) => {
    await test.step("Dash board > library detail của library 01: mở tab web template", async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await waitTimeout(2000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: wbPage.xpathLib.libraryDetail.templateTab,
        snapshotName: conf.caseConf.snapshot_empty_stage,
      });
    });
  });

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_141 Check delete web template trong library detail", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step(`Click option tại "141-Delete web template"`, async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();

      await expect(dashboard.locator(wbPage.xpathLib.libraryDetail.deleteButton)).toBeVisible();
    });

    await test.step("Click delete", async () => {
      await dashboard.locator(wbPage.xpathLib.libraryDetail.deleteButton).click();

      await snapshotFixture.verify({
        page: dashboard,
        selector: wbPage.xpathLib.deleteTemplatePopup.popupXpath,
        snapshotName: conf.caseConf.snapshot_delete_popup,
      });
    });

    await test.step("Click No, keep template", async () => {
      await dashboard.locator(wbPage.xpathLib.deleteTemplatePopup.popupButton("No, keep template")).click();

      await expect(dashboard.locator(wbPage.xpathLib.deleteTemplatePopup.popupXpath)).toBeHidden();
      await expect(
        dashboard.locator(wbPage.xpathLib.libraryDetail.templateName(conf.caseConf.template_data.name)),
      ).toBeVisible();
    });

    await test.step("Click Delete template trong popup", async () => {
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.deleteButton).click();
      await dashboard.locator(wbPage.xpathLib.deleteTemplatePopup.popupButton("Delete template")).click();

      await expect(dashboard.locator(wbPage.xpathLib.deleteTemplatePopup.popupXpath)).toBeHidden();
      await expect(dashboard.locator(wbPage.xpathLib.deleteTemplatePopup.toastDeleteSuccessfully)).toBeVisible();
      await expect(
        dashboard.locator(wbPage.xpathLib.libraryDetail.templateName(conf.caseConf.template_data.name)),
      ).toBeHidden();
    });

    await test.step("Mở popup Explore template, filter theo new libary của shop hiện tại http://joxi.ru/Dr8b9yziD1R9l2", async () => {
      await wbPage.navigateToMenu("Online Store");
      await dashboard.locator(wbPage.xpathLib.explorePopup.exploreButton).click();
      await dashboard.locator(wbPage.xpathLib.explorePopup.yourTemplatesButton).click({ delay: 1000 });
      await webBuilder.searchForTemplates(conf.caseConf.template_data.name);

      await expect(wbPage.getLocatorOfImageOnExplorePopup(conf.caseConf.template_data.name)).toBeHidden();
    });
  });
});
