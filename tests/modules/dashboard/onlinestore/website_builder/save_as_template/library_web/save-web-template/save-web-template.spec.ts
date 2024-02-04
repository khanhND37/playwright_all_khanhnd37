import { expect, test } from "@fixtures/website_builder";
import { WbLibrary } from "@pages/dashboard/wb_library";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { SaveAsTemplateInput } from "@types";

let generatedTemplateName = "";

test.describe("Verify setting của web template", () => {
  let wbPage: WbLibrary;
  let authConfig;
  let themes: ThemeEcom, accessToken: string;

  test.beforeEach(async ({ dashboard, conf, token }) => {
    test.slow();
    authConfig = {
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    };
    wbPage = new WbLibrary(dashboard, conf.suiteConf.domain);

    await test.step(`Delete all unpublish theme`, async () => {
      const { access_token: shopToken } = await token.getWithCredentials(authConfig);
      accessToken = shopToken;
      themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await themes.deleteAllThemesUnPublish(accessToken);
    });
  });

  test(`@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_124 Check hiển thị web template khi lưu vào library detail`, async ({
    conf,
    dashboard,
  }) => {
    await test.step(`Dashboard > Online store > theme: save web as template thành công vào library 01`, async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.waitUtilSkeletonDisappear();

      generatedTemplateName = "124 template " + new Date().getTime();
      generatedTemplateName = generatedTemplateName.slice(0, 30);

      const saveAsTemplateIntput: SaveAsTemplateInput = {
        name: generatedTemplateName,
        libraryName: conf.suiteConf.library_info.library_name,
      };
      await wbPage.saveActiveTemplate(saveAsTemplateIntput);
    });

    await test.step(`Mở library 01, tab web template`, async () => {
      await wbPage.goToLibraryDetail(conf.suiteConf.library_info.library_id);
      await expect(dashboard.locator("//p[contains(@class, 'card-template__info--name')]").first()).toHaveText(
        generatedTemplateName,
      );

      await expect(wbPage.page.locator(`(${wbPage.xpathLib.listPage.toggle.input})[1]`)).toHaveAttribute(
        "value",
        "true",
      );
      await expect(wbPage.genLoc(wbPage.xpathLib.listPage.badgeJustAdded(generatedTemplateName))).toBeVisible();
    });

    await test.step(`Click vào web template 01`, async () => {
      await expect(wbPage.genLoc(wbPage.xpathLib.listPage.badge).first()).toBeVisible();
      await wbPage.clickOnWebTemplateItem(generatedTemplateName);

      await expect(wbPage.genLoc(wbPage.xpathLib.listPage.badgeJustAdded(generatedTemplateName))).toBeHidden();
    });

    await test.step(`Check hiển thị list web template`, async () => {
      // Check has 15 item
      let numberOfItems = await wbPage.getNumberOfItems(wbPage.libraryTabs["Web templates"].name);
      expect(numberOfItems).toEqual(15);

      // Scroll to the end
      await wbPage
        .genLoc("//div[contains(@class, 'card-template ')]//p[contains(@class, 'card-template__info--name')]")
        .last()
        .scrollIntoViewIfNeeded();

      // Wait for API: templates.json
      await wbPage.waitResponseWithUrl("/templates.json");

      // Check has more than 15 item
      numberOfItems = await wbPage.getNumberOfItems(wbPage.libraryTabs["Web templates"].name);
      expect(numberOfItems).toBeGreaterThan(15);
    });
  });
});
