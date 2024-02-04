import { expect, test } from "@fixtures/website_builder";
import { WbLibrary } from "@pages/dashboard/wb_library";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { SaveAsTemplateInput } from "@types";

test.describe("Verify setting của web template", () => {
  let wbPage: WbLibrary;
  let authConfig;
  let themes: ThemeEcom, accessToken: string;
  let libraryList;
  let webBuilder: WebBuilder;

  test.beforeEach(async ({ dashboard, conf, builder, token }) => {
    test.slow();
    authConfig = {
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    };
    wbPage = new WbLibrary(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(wbPage.page, conf.suiteConf.domain);

    await test.step(`Create new library`, async () => {
      await builder.createLibrary({ title: conf.caseConf.template_data.libraryName });
    });

    await test.step(`Delete all unpublish theme`, async () => {
      const { access_token: shopToken } = await token.getWithCredentials(authConfig);
      accessToken = shopToken;
      themes = new ThemeEcom(wbPage.page, conf.suiteConf.domain);
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

  test(`@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_126 Check active/inactive web template trong library detail`, async ({
    conf,
  }) => {
    const env = process.env.ENV;
    // On prodtest, we can't search. So skip this case on prodtest env
    if (env === "prodtest") {
      return;
    }

    await test.step(`Check trạng thái khi mới add web template`, async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);

      let firstTemplateName = await wbPage.genLoc(wbPage.xpathLib.listPage.name).first().textContent();
      firstTemplateName = firstTemplateName.trim();
      expect(firstTemplateName).toEqual(conf.caseConf.template_data.name);

      await expect(wbPage.page.locator(`(${wbPage.xpathLib.listPage.toggle.input})[1]`)).toHaveAttribute(
        "value",
        "true",
      );
    });

    await test.step(`OFF toggle, deactivate template`, async () => {
      await wbPage.genLoc(wbPage.xpathLib.listPage.toggle.span).first().click();

      await expect(wbPage.page.locator(`(${wbPage.xpathLib.listPage.toggle.input})[1]`)).toHaveAttribute(
        "value",
        "false",
      );
    });

    await test.step(`Mở popup Add template, filter theo libary 01 của shop hiện tại http://joxi.ru/Dr8b9yziD1R9l2`, async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.page.locator(wbPage.xpathLib.explorePopup.exploreButton).click();
      await wbPage.page.locator(wbPage.xpathLib.explorePopup.yourTemplatesButton).click({ delay: 1000 });
      await webBuilder.searchForTemplates(conf.caseConf.template_data.name);

      await expect(wbPage.getLocatorOfImageOnExplorePopup(conf.caseConf.template_data.name)).toBeHidden();
    });

    await test.step(`On toggle active template`, async () => {
      await wbPage.page.locator(wbPage.xpathLib.explorePopup.closePopupButton).click();
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await wbPage.genLoc(wbPage.xpathLib.listPage.toggle.span).first().click();

      await expect(wbPage.page.locator(`(${wbPage.xpathLib.listPage.toggle.input})[1]`)).toHaveAttribute(
        "value",
        "true",
      );
    });

    await test.step(`Mở popup Add template, filter theo libary 01 của shop hiện tại http://joxi.ru/Dr8b9yziD1R9l2`, async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.page.locator(wbPage.xpathLib.explorePopup.exploreButton).click();
      await wbPage.page.locator(wbPage.xpathLib.explorePopup.yourTemplatesButton).click({ delay: 1000 });
      await webBuilder.searchForTemplates(conf.caseConf.template_data.name);

      await expect(wbPage.getLocatorOfImageOnExplorePopup(conf.caseConf.template_data.name)).toBeVisible();
    });
  });
});
