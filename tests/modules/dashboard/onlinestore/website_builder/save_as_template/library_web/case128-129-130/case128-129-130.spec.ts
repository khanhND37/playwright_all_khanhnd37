import { expect, test } from "@fixtures/website_builder";
import { verifyRedirectUrl, waitForImageLoaded, waitSelector } from "@core/utils/theme";
import { WbLibrary } from "@pages/dashboard/wb_library";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { SaveAsTemplateInput } from "@types";
import { WebBuilder } from "@pages/dashboard/web_builder";

test.describe("Verify library detail của web template", () => {
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

    await test.step("Delete invalid library", async () => {
      libraryList = await builder.listLibrary({ action: "all" }, authConfig);

      for (const item of libraryList) {
        if (item.title == conf.caseConf.template_data.libraryName) {
          await builder.deleteLibrary(item.id);
        }
      }
    });

    await test.step(`Create new library`, async () => {
      if (conf.caseName !== "SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_129") {
        await builder.createLibrary({ title: conf.caseConf.template_data.libraryName });
      }
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

      if (conf.caseConf.template_data.name) {
        const saveAsTemplateIntput: SaveAsTemplateInput = conf.caseConf.template_data;
        await wbPage.saveActiveTemplate(saveAsTemplateIntput);
      }
    });
  });

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_129 Check UI popup Edit info web template", async ({
    snapshotFixture,
    conf,
  }) => {
    await test.step("Click option tại template A", async () => {
      await wbPage.goToLibraryDetail(conf.suiteConf.library_id);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await wbPage.page.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();

      await expect(wbPage.page.locator(wbPage.xpathLib.libraryDetail.editInfoButton)).toBeVisible();
    });

    await test.step("Click edit info", async () => {
      await wbPage.page.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();

      await wbPage.genLoc(wbPage.xpathLib.editInfoPopup.loading).first().waitFor({ state: "hidden" });
      await waitForImageLoaded(wbPage.page, wbPage.xpathLib.editInfoPopup.imgXpath("Desktop"));
      await waitForImageLoaded(wbPage.page, wbPage.xpathLib.editInfoPopup.imgXpath("Mobile"));
      await waitForImageLoaded(wbPage.page, wbPage.xpathLib.editInfoPopup.imgXpath("Thumbnail Library"));
      await wbPage.page.locator(wbPage.xpathLib.editInfoPopup.header).click({ delay: 2000 });
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.xpathLib.editInfoPopup.popupSelector,
        snapshotName: `${process.env.ENV}-${conf.caseConf.snapshot_popup_edit_info}`,
      });
    });

    await test.step("Click cancel", async () => {
      await wbPage.page.locator(wbPage.xpathLib.editInfoPopup.cancelButton).click();

      await expect(wbPage.page.locator(wbPage.xpathLib.editInfoPopup.popupSelector)).toBeHidden();
      await expect(wbPage.page.locator(`text=Save ${conf.caseConf.template_data.name} info successfully`)).toBeHidden();
    });

    await test.step("Mở lại popup edit info", async () => {
      await wbPage.page.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await wbPage.page.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();

      await wbPage.genLoc(wbPage.xpathLib.editInfoPopup.loading).first().waitFor({ state: "hidden" });
      await waitForImageLoaded(wbPage.page, wbPage.xpathLib.editInfoPopup.imgXpath("Desktop"));
      await waitForImageLoaded(wbPage.page, wbPage.xpathLib.editInfoPopup.imgXpath("Mobile"));
      await waitForImageLoaded(wbPage.page, wbPage.xpathLib.editInfoPopup.imgXpath("Thumbnail Library"));
      await wbPage.page.locator(wbPage.xpathLib.editInfoPopup.header).click({ delay: 2000 });
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.xpathLib.editInfoPopup.popupSelector,
        snapshotName: `${process.env.ENV}-${conf.caseConf.snapshot_popup_edit_info}`,
      });
    });

    await test.step("Click button x", async () => {
      await wbPage.page.locator(wbPage.xpathLib.editInfoPopup.headerButton).click();
      await expect(wbPage.page.locator(`text=Save ${conf.caseConf.template_data.name} info successfully`)).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_128 Check edit web template in web builder", async ({ conf }) => {
    const env = process.env.ENV;
    // On prodtest, we can't search. So skip this case on prodtest env
    if (env === "prodtest") {
      return;
    }

    let templateID: string;

    await test.step("Library detail New library: hover vào template A", async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);

      const templateInfo: string = await wbPage.page.locator(wbPage.xpathLib.libraryDetail.templateInfo).innerText();
      templateID = templateInfo.split(":").map(v => v.trim())[1];

      await wbPage.hoverOnThumbnailImage(conf.caseConf.template_data.name);

      await expect(
        wbPage.page.locator(wbPage.getXpathActionLocatorOnThumbnailImage(conf.caseConf.template_data.name)).first(),
      ).toHaveText("Edit");
    });

    await test.step("Click Edit in web builder", async () => {
      await verifyRedirectUrl({
        page: wbPage.page,
        selector: `${wbPage.getXpathThumbnailImage(conf.caseConf.template_data.name)}//p[contains(text(),'Edit')]`,
        redirectUrl: `https://${conf.suiteConf.domain}/admin/builder/site/${templateID}`,
        waitForElement: wbPage.xpathLib.xpathOnWB.homePagePreview,
      });
    });

    await test.step("Edit template A, nhấn save", async () => {
      await wbPage.page.locator(wbPage.xpathLib.xpathOnWB.buttonLayer).click();
      await webBuilder.openLayerSettings({
        sectionName: "Section",
        sectionIndex: 1,
      });
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
        },
        position: "Bottom",
        category: "Basics",
        template: "Single column",
      });

      await wbPage.page.locator(wbPage.xpathLib.xpathOnWB.inputSectionName).click();
      await wbPage.page.locator(wbPage.xpathLib.xpathOnWB.inputSectionName).fill(`${conf.caseConf.template_data.name}`);
      await wbPage.page.locator(wbPage.xpathLib.xpathOnWB.labelSectionName).click({ delay: 1000 });

      await webBuilder.clickSaveButton();
    });

    await test.step("Click exit button", async () => {
      await wbPage.page.locator(wbPage.xpathLib.xpathOnWB.exitButton).click();
    });

    await test.step("Mở popup add template, add template A", async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.page.locator(wbPage.xpathLib.explorePopup.exploreButton).click();
      await wbPage.page.locator(wbPage.xpathLib.explorePopup.yourTemplatesButton).click({ delay: 1000 });
      await webBuilder.searchForTemplates(conf.caseConf.template_data.name);
      await waitSelector(wbPage.page, `//p[contains(., '${conf.caseConf.template_data.name}')]/parent::div`);

      await expect(wbPage.page.locator(".sb-choose-template__info p").first()).toHaveText(
        conf.caseConf.template_data.name,
      );
      await wbPage.getLocatorOfImageOnExplorePopup(conf.caseConf.template_data.name).hover();
      await wbPage.page.locator(wbPage.xpathLib.explorePopup.applyButton).first().click();
      await waitSelector(wbPage.page, wbPage.xpathLib.explorePopup.toastApplySuccessTemplate);
      await waitSelector(wbPage.page, wbPage.getXpathAddedThemeOnList(conf.caseConf.template_data.name));

      //check customize theme
      await wbPage.getLocatorCustomizeByThemeName(conf.caseConf.template_data.name).click();
      await expect(
        wbPage.page.locator(
          `${wbPage.xpathLib.xpathOnWB.sectionNameOnSideBar} and normalize-space()='${conf.caseConf.template_data.name}']`,
        ),
      ).toBeVisible();
    });
  });

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_130 Check trường Template name trong popup edit info web template", async ({
    conf,
  }) => {
    await test.step("Pre-condition: open edit info popup", async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await wbPage.page.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await wbPage.page.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();

      await expect(wbPage.page.locator(wbPage.xpathLib.editInfoPopup.header)).toHaveText(conf.caseConf.header_popup);
    });

    await test.step("Bỏ trống template name, các trường khác nhập đủ, nhấn save", async () => {
      await wbPage.page.locator(wbPage.xpathLib.editInfoPopup.templateNameField).click();
      await wbPage.page.locator(wbPage.xpathLib.editInfoPopup.templateNameField).fill("");
      await wbPage.page.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(wbPage.page.locator(wbPage.xpathLib.editInfoPopup.warningMessage)).toHaveText(
        `${conf.caseConf.warning_message}`,
      );
    });

    await test.step("Nhập template name > 30 kí tự", async () => {
      await wbPage.page.locator(wbPage.xpathLib.editInfoPopup.templateNameField).fill(`${conf.caseConf.long_name}`);

      await expect(wbPage.page.locator(wbPage.xpathLib.editInfoPopup.countChar)).toHaveText("30 / 30");
    });

    await test.step("Nhấn save", async () => {
      await wbPage.page.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(
        wbPage.page.locator(`text=Save ${conf.caseConf.long_name.slice(0, 30)} info successfully`),
      ).toBeVisible();
    });
  });
});
