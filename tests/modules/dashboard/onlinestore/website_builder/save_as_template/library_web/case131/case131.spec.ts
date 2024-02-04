import { expect, test } from "@fixtures/website_builder";
import { WbLibrary } from "@pages/dashboard/wb_library";
import { SaveAsTemplateInput } from "@types";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";

test.describe("Verify library detail của web template", () => {
  let wbPage: WbLibrary;
  let authConfig;
  let themes: ThemeEcom, accessToken: string;
  const lisbraryIds = [];
  let libraryList;

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
      const libraryTitles = [
        conf.caseConf.library_data[0].title,
        conf.caseConf.library_data[1].title,
        conf.caseConf.template_data.libraryName,
      ];

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

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_131 Check trường Libary trong popup edit info web template khi tạo/sửa/xóa library", async ({
    conf,
    dashboard,
    builder,
  }) => {
    await test.step("Tạo thêm Library 02, library 03 cho shop, mở popup Edit info web template A > Click dropdown", async () => {
      //create library
      for (const libraryData of conf.caseConf.library_data) {
        await builder.createLibrary(libraryData);
      }

      //mở popup Edit info web template A > Click dropdown
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.libraryButton).click();

      await expect(
        dashboard.locator(wbPage.xpathLib.editInfoPopup.optionOnDropdown(conf.caseConf.library_data[0].title)),
      ).toBeVisible();
      await expect(
        dashboard.locator(wbPage.xpathLib.editInfoPopup.optionOnDropdown(conf.caseConf.library_data[1].title)),
      ).toBeVisible();
    });

    await test.step("Bỏ trống library name, nhấn save", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.warningMessage)).toHaveText(
        conf.caseConf.warning_message,
      );
    });

    await test.step("Sửa tên library 02, mở lại popup Edit info web template A > Click dropdown", async () => {
      libraryList = await builder.listLibrary({ action: "all" }, authConfig);
      libraryList.forEach(item => {
        if (item.title === conf.caseConf.library_data[0].title) {
          lisbraryIds.push(item.id);
        }
      });
      await builder.updateLibrary(lisbraryIds[lisbraryIds.length - 1], conf.caseConf.edit_library, authConfig);

      await dashboard.reload();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.libraryButton).click();

      await expect(
        dashboard.locator(wbPage.xpathLib.editInfoPopup.optionOnDropdown(conf.caseConf.library_data[0].title)),
      ).toBeHidden();
      await expect(
        dashboard.locator(wbPage.xpathLib.editInfoPopup.optionOnDropdown(conf.caseConf.edit_library.title)),
      ).toBeVisible();
    });

    await test.step("Xóa library 02 edit, mở lại popup Edit info web template A", async () => {
      await builder.deleteLibrary(lisbraryIds[lisbraryIds.length - 1]);

      await dashboard.reload();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.libraryButton).click();

      await expect(
        dashboard.locator(wbPage.xpathLib.editInfoPopup.optionOnDropdown(conf.caseConf.edit_library.title)),
      ).toBeHidden();
    });

    await test.step("Chọn library 03, điền các trường khác đủ, nhấn save", async () => {
      await dashboard
        .locator(wbPage.xpathLib.editInfoPopup.optionOnDropdown(conf.caseConf.library_data[1].title))
        .click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(dashboard.locator(`text=Save ${conf.caseConf.template_data.name} info successfully`)).toBeVisible();
    });

    await test.step("Mở library 03", async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.waitUtilSkeletonDisappear();
      await wbPage.editLibrary(conf.caseConf.library_data[1].title);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);

      await expect(
        dashboard.locator(wbPage.xpathLib.libraryDetail.templateName(conf.caseConf.template_data.name)),
      ).toBeVisible();
    });
  });
});
