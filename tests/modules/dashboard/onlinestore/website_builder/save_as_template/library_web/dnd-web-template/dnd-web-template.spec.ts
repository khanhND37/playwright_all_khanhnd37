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

  test(`@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_125 Check dnd template trong library detail`, async ({
    conf,
    dashboard,
  }) => {
    const env = process.env.ENV;
    // On prodtest, we can't search. So skip this case on prodtest env
    if (env === "prodtest") {
      return;
    }

    await test.step(`Mở library "Library dnd", tab "web template"`, async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);

      let firstTemplateName = await wbPage.genLoc(wbPage.xpathLib.listPage.name).first().textContent();
      firstTemplateName = firstTemplateName.trim();

      expect(firstTemplateName).toEqual(conf.caseConf.template_data.name);
    });

    await test.step(`Dnd đổi chỗ 2 template trên`, async () => {
      //add them 1 template
      await wbPage.navigateToMenu("Online Store");
      await wbPage.saveActiveTemplate(conf.caseConf.second_template_data);
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);

      await expect(dashboard.locator("//p[contains(@class, 'card-template__info--name')]").first()).toHaveText(
        conf.caseConf.second_template_data.name,
      );

      //dnd 2 templates
      const firstItemDnd = await wbPage.genLoc(wbPage.xpathLib.listPage.dnd).first();
      const secondCard = await wbPage.genLoc(wbPage.xpathLib.listPage.card).nth(1);

      const firstItemBoundingBox = await firstItemDnd.boundingBox();
      const secondItemBoundingBox = await secondCard.boundingBox();

      await wbPage.page.mouse.move(
        firstItemBoundingBox.x + firstItemBoundingBox.width / 2,
        firstItemBoundingBox.y + firstItemBoundingBox.height / 2,
      );
      await wbPage.page.mouse.down();
      await wbPage.page.mouse.move(
        secondItemBoundingBox.x + secondItemBoundingBox.width / 2,
        secondItemBoundingBox.y + secondItemBoundingBox.height / 2,
        {
          steps: 5,
        },
      );
      await wbPage.page.waitForTimeout(1000);
      await wbPage.page.mouse.up();

      await expect(dashboard.locator("//p[contains(@class, 'card-template__info--name')]").last()).toHaveText(
        conf.caseConf.second_template_data.name,
      );
      await expect(dashboard.locator("//p[contains(@class, 'card-template__info--name')]").first()).toHaveText(
        conf.caseConf.template_data.name,
      );
    });

    await test.step(`Mở popup Explore template, filter theo libary 01 http://joxi.ru/Dr8b9yziD1R9l2`, async () => {
      await wbPage.navigateToMenu("Online Store");
      await dashboard.locator(wbPage.xpathLib.explorePopup.exploreButton).click();
      await dashboard.locator(wbPage.xpathLib.explorePopup.yourTemplatesButton).click({ delay: 1000 });
      await webBuilder.searchForTemplates("dnd template");

      await expect(dashboard.locator(".sb-choose-template__info p").first()).toHaveText(
        conf.caseConf.template_data.name,
      );
      await expect(dashboard.locator(".sb-choose-template__info p").last()).toHaveText(
        conf.caseConf.second_template_data.name,
      );
    });
  });
});
