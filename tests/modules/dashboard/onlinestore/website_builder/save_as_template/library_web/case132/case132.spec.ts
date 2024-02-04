import { expect, test } from "@fixtures/website_builder";
import { WbLibrary } from "@pages/dashboard/wb_library";
import { SaveAsTemplateInput } from "@types";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";

test.describe("Verify library detail của web template", () => {
  let wbPage: WbLibrary;
  let authConfig;
  let themes: ThemeEcom, accessToken: string;
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

    await test.step("Delete invalid library", async () => {
      libraryList = await builder.listLibrary({ action: "all" }, authConfig);
      const libraryTitles = [conf.caseConf.library_title, conf.caseConf.template_data.libraryName];

      libraryList.forEach(item => {
        if (libraryTitles.includes(item.title)) {
          lisbraryIds.push(item.id);
        }
      });

      if (lisbraryIds.length > 0) {
        for (const libraryId of lisbraryIds) {
          await builder.deleteLibrary(libraryId);
        }
      }
    });

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

      if (conf.caseConf.template_data) {
        const saveAsTemplateIntput: SaveAsTemplateInput = conf.caseConf.template_data;
        await wbPage.saveActiveTemplate(saveAsTemplateIntput);
      }
    });
  });

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_132 Check thêm mới library ngay tại popup edit info web template", async ({
    dashboard,
    conf,
  }) => {
    await test.step("Click x button http://joxi.ru/5mdwnYKFJMVaJr , nhập tên library mới", async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.libraryButton).click();

      await dashboard.locator(wbPage.xpathLib.editInfoPopup.libraryInputField).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.libraryInputField).fill(`${conf.caseConf.library_title}`);

      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.addLibraryButton)).toBeVisible();
      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.noLibrarySearch).first()).toHaveText(
        "No search results",
      );
    });

    await test.step("Click add library", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.addLibraryButton).click();
      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.addLibraryButton)).toBeHidden();
    });

    await test.step("Nhấn save", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(dashboard.locator(`text=Save ${conf.caseConf.template_data.name} info successfully`)).toBeVisible();
      await expect(
        dashboard.locator(wbPage.xpathLib.libraryDetail.templateName(conf.caseConf.template_data.name)),
      ).toBeHidden();
    });

    await test.step("Library list > click library detail Library 03", async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.waitUtilSkeletonDisappear();
      await wbPage.editLibrary(conf.caseConf.library_title);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);

      await expect(
        dashboard.locator(wbPage.xpathLib.libraryDetail.templateName(conf.caseConf.template_data.name)),
      ).toBeVisible();
    });
  });
});
