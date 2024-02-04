import { expect, test } from "@fixtures/website_builder";
import { verifyRedirectUrl } from "@core/utils/theme";
import { WbLibrary } from "@pages/dashboard/wb_library";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { SaveAsTemplateInput } from "@types";

test.describe("Verify library detail của web template", () => {
  let wbPage: WbLibrary;
  let authConfig;
  let themes: ThemeEcom, accessToken: string;
  let libraryList;

  test.beforeEach(async ({ dashboard, conf, builder, token }) => {
    test.slow();
    authConfig = {
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    };
    wbPage = new WbLibrary(dashboard, conf.suiteConf.domain);

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

  test.afterEach(async ({ builder, conf }) => {
    await test.step("Delete invalid library", async () => {
      libraryList = await builder.listLibrary({ action: "all" }, authConfig);

      for (const item of libraryList) {
        if (item.title == conf.caseConf.template_data.libraryName) {
          await builder.deleteLibrary(item.id);
        }
      }
    });
  });

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_127 Check preview web template trong library detail", async ({
    dashboard,
    context,
    conf,
  }) => {
    await test.step("Hover vào web template 01", async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await wbPage.hoverOnThumbnailImage(conf.caseConf.template_data.name);

      await expect(
        dashboard.locator(wbPage.getXpathActionLocatorOnThumbnailImage(conf.caseConf.template_data.name)).last(),
      ).toHaveText("Preview");
    });

    await test.step("Click preview", async () => {
      await verifyRedirectUrl({
        page: dashboard,
        selector: `${wbPage.getXpathThumbnailImage(conf.caseConf.template_data.name)}//p[contains(text(),'Preview')]`,
        redirectUrl: `https://${conf.suiteConf.domain}/?preview_template=true&theme_preview_id`,
        context,
      });
    });
  });
});
