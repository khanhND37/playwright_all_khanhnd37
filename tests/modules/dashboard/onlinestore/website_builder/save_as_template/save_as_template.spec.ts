import { verifyRedirectUrl, waitForImageLoaded, snapshotDir } from "@core/utils/theme";
import { loadData } from "@core/conf/conf";
import { test } from "@fixtures/website_builder";
import { expect } from "@core/fixtures";
import {
  textBoxXpath,
  openSaveTemplatePopup,
  createCate,
  inputTemplateName,
  verifySuccessMess,
  verifyDisableTemplate,
  deleteLibrary,
} from "./util";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { CreatorPage } from "@pages/dashboard/creator";
import { PageSettingsData } from "@types";

test.describe("Save as template", () => {
  let webBuilder: WebBuilder, settingsData: PageSettingsData;

  test.beforeEach(async ({ builder, dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    test.slow();
    await test.step("Set data for page", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
      await builder.updateSiteBuilder(conf.suiteConf.theme_id, settingsData);
    });

    await test.step("Delete all library", async () => {
      await deleteLibrary(builder, conf);
    });
  });

  test.afterEach(async ({ conf }) => {
    if (conf.caseConf.sleep) {
      await webBuilder.waitAbit(conf.caseConf.sleep);
    }
  });

  const conf = loadData(__dirname, "TC_SAVE_AS_TEMPLATE");
  for (const caseData of conf.caseConf.data) {
    test(`${caseData.description} @${caseData.case_id}`, async ({ conf, context, builder, snapshotFixture }) => {
      await test.step("Check UI save as template popup", async () => {
        //create library by API
        if (caseData.library_api) {
          for (const library of caseData.library_api) {
            const response = await builder.createLibrary(library.library_name);
            if (caseData.category_api) {
              await builder.createCategoryByAPI({
                ...caseData.category_api,
                type: caseData.template_type,
                library_id: response.id,
              });
            }
          }
        }

        await openSaveTemplatePopup(webBuilder.page, conf, {
          siteId: conf.suiteConf.theme_id,
          type: caseData.template_type,
          fontHead: caseData.fontHead,
          fontPara: caseData.fontPara,
          openLayer: caseData.open_layer,
          color: caseData.color,
        });
      });

      await test.step("Create template", async () => {
        //tao library dau tien o Save as template popup
        if (caseData.library_1st) {
          //bo trong ten
          await webBuilder.genLoc(textBoxXpath("Library")).first().click();
          await expect(webBuilder.genLoc(webBuilder.xpathMgInline)).toHaveText("Type to create new");
          await webBuilder.genLoc(webBuilder.xpathPopupHeader).click();
          //input ten
          await webBuilder.genLoc(textBoxXpath("Library")).first().fill(caseData.library_1st);
          await webBuilder.addNewBtn.click();
          await webBuilder.autocompletePopover.waitFor({ state: "hidden" });
          //create category
          if (caseData.cate_name) await createCate(webBuilder.page, caseData.cate_name, caseData.icon);
        }
        //tao library thu 2 o Save as template popup
        if (caseData.library_2nd) {
          if (caseData.x_icon) {
            await webBuilder.genLoc(webBuilder.btnxClose).last().click();
          }

          await webBuilder.genLoc(textBoxXpath("Library")).first().fill(caseData.library_2nd);
          await webBuilder.addNewBtn.click();
          await webBuilder.autocompletePopover.waitFor({ state: "hidden" });
          //create category
          if (caseData.cate_name) {
            await createCate(webBuilder.page, caseData.cate_name, caseData.icon);
          }
        }

        //chon library khi shop co nhieu library
        if (caseData.search_library) {
          await webBuilder.genLoc(textBoxXpath("Library")).first().fill(caseData.search_library.slice(-1));
          await webBuilder
            .genLoc(webBuilder.resultSearch)
            .filter({ hasText: caseData.search_library.replace("0", "") })
            .click();
        }
        //chon tag cho template
        if (caseData.tag) {
          await webBuilder.genLoc(webBuilder.tagSection).last().click();
          await webBuilder.genLoc(webBuilder.tagSection).last().fill(caseData.tag);
          await webBuilder.page.getByText(caseData.tag).click();
        }
        //input name
        if (caseData.template_name) {
          await inputTemplateName(caseData.template_type, webBuilder.page, caseData.template_name);
          await verifySuccessMess(caseData.template_type, webBuilder.page, caseData.cate_name);
        }
      });

      await test.step("Use templates", async () => {
        if (caseData.use_template) {
          const handleSectionTemplate = async () => {
            const elementSelector = webBuilder.getSelectorByIndex({ section: 1 });
            await webBuilder.frameLocator
              .locator(elementSelector)
              .first()
              .click({ position: { x: 1, y: 1 } });
            await webBuilder.frameLocator.locator(webBuilder.addSecionInPreview).first().hover();

            //verify add section base on template
            await webBuilder.frameLocator.locator(webBuilder.addSecionInPreview).first().click();
            await expect(webBuilder.genLoc(webBuilder.xpathCategoryWB).last()).toHaveText(caseData.cate_name);
            await webBuilder.genLoc(webBuilder.xpathCategoryWB).last().click();
            await waitForImageLoaded(webBuilder.page, webBuilder.insertTemplatePreview);
            await webBuilder.genLoc(webBuilder.insertTemplatePreview).first().click();
            await webBuilder.clickBtnNavigationBar("save");
            await expect(webBuilder.genLoc(webBuilder.msgSaveSuccess)).toBeVisible();
            await webBuilder.page.reload();
            await expect(webBuilder.genLoc(webBuilder.contentLayer).first()).toHaveText(caseData.template_name);

            //verify section template navigation to library detail
            await webBuilder.clickBtnNavigationBar("insert");
            await webBuilder.genLoc(webBuilder.insertCategory).filter({ hasText: caseData.cate_name }).click();
            await waitForImageLoaded(webBuilder.page, webBuilder.insertTemplatePreview);
            await snapshotFixture.verifyWithAutoRetry({
              page: webBuilder.page,
              selector: webBuilder.insertTemplatePreview,
              snapshotName: caseData.expect.snap_shot_insert_panel,
              combineOptions: { maxDiffPixelRatio: 0.01 },
            });
            await webBuilder.genLoc(webBuilder.insertTemplatePreview).first().hover();
            await webBuilder.genLoc(webBuilder.insertFirstTemplateInfo).waitFor();
            await verifyRedirectUrl({
              page: webBuilder.page,
              selector: webBuilder.insertFirstTemplateInfo,
              context: context,
              redirectUrl: `https://${conf.suiteConf.domain}/admin/themes/library`,
              waitForElement: webBuilder.templateActive,
            });
          };

          const handleBlockTemplate = async () => {
            await webBuilder.page.reload();
            await webBuilder.frameLocator.locator(webBuilder.addBlockWB).first().hover();
            await webBuilder.frameLocator.locator("text=Add block").first().click();
            await expect(webBuilder.genLoc(webBuilder.xpathCategoryWB).last()).toHaveText(caseData.cate_name);
            await webBuilder.genLoc(webBuilder.xpathCategoryWB).last().click();
            await waitForImageLoaded(webBuilder.page, webBuilder.previewInsertFirstTemplate);
            await webBuilder.genLoc(webBuilder.insertTemplatePreview).first().click();
            await webBuilder.clickBtnNavigationBar("save");
            await webBuilder.waitResponseWithUrl("admin/themes/builder");
            //verify block added
            await webBuilder.page.reload();
            await expect(webBuilder.genLoc(webBuilder.layerLabel).nth(3)).toHaveText(`${caseData.template_name}`);
            //verify section template navigation to library detail
            await webBuilder.clickBtnNavigationBar("insert");
            await webBuilder.genLoc(webBuilder.insertCategory).filter({ hasText: caseData.cate_name }).click();
            await waitForImageLoaded(webBuilder.page, webBuilder.previewInsertFirstTemplate);
            await webBuilder.genLoc(webBuilder.insertTemplatePreview).first().hover();
            await webBuilder.genLoc(webBuilder.insertFirstTemplateInfo).waitFor();
            await verifyRedirectUrl({
              page: webBuilder.page,
              selector: webBuilder.insertFirstTemplateInfo,
              context: context,
              redirectUrl: `https://${conf.suiteConf.domain}/admin/themes/library`,
              waitForElement: webBuilder.templateActive,
            });
          };

          const handlePageTemplate = async () => {
            //Edit page template
            const creatorPage = new CreatorPage(webBuilder.page, conf.suiteConf.domain);
            await webBuilder.page.goto(`https://${conf.suiteConf.domain}/admin/themes`);
            await webBuilder.genLoc(creatorPage.getXpathAction("Edit", caseData.index)).click();
            await webBuilder.genLoc(creatorPage.getXpathTabTemplate(caseData.template_tab)).click();
            await waitForImageLoaded(webBuilder.page, webBuilder.imageTemplateSaveAsFirst);
            await webBuilder.genLoc(webBuilder.cardTemplateImageFirst).hover();
            await verifyRedirectUrl({
              page: webBuilder.page,
              selector: webBuilder.editFirstTemplate,
              redirectUrl: `https://${conf.suiteConf.domain}/admin/builder/template`,
              waitForElement: ".w-builder header",
            });
            await webBuilder.genLoc(".sb-spinner--medium").waitFor();
            await webBuilder.clickBtnNavigationBar("layer");
            await webBuilder.genLoc(webBuilder.sectionLayerInSidebar).first().click();
            await webBuilder.selectOptionOnQuickBar("Delete");
            await webBuilder.genLoc(webBuilder.xpathButtonSave).click();
            await webBuilder.waitResponseWithUrl("admin/themes/builder");
          };

          const handleColorTemplate = async () => {
            await webBuilder.genLoc(webBuilder.libraryColor).click();
            await expect(webBuilder.genLoc("text=Applied")).toBeVisible();
            await webBuilder.clickBtnNavigationBar("save");
            await expect(webBuilder.genLoc(webBuilder.msgSaveSuccess)).toBeVisible();
            await webBuilder.genLoc(".sb-toast__message").last().waitFor({ state: "hidden" });
            await snapshotFixture.verifyWithAutoRetry({
              page: webBuilder.page,
              selector: '[id="app"] [id="website-builder"]',
              snapshotName: caseData.expect.snapshot_use_template,
              combineOptions: { maxDiffPixelRatio: 0.01 },
            });
          };

          const handleFontTemplate = async () => {
            await webBuilder.genLoc(webBuilder.xpathButtonSave).first().click();
            await webBuilder.waitResponseWithUrl("admin/themes/builder");

            await snapshotFixture.verifyWithAutoRetry({
              page: webBuilder.page,
              selector: '[id="app"] [id="website-builder"]',
              snapshotName: caseData.expect.snapshot_use_template,
              combineOptions: { maxDiffPixelRatio: 0.01 },
            });
          };

          const templateHandler = {
            section: handleSectionTemplate,
            block: handleBlockTemplate,
            page: handlePageTemplate,
            color: handleColorTemplate,
            font: handleFontTemplate,
          };
          await templateHandler[caseData.template_type]();
        }
      });

      await test.step("Action with template on Library detail", async () => {
        if (caseData.replace) {
          await test.step("Replace template", async () => {
            await webBuilder.page.reload();
            await openSaveTemplatePopup(webBuilder.page, conf, {
              type: caseData.template_type,
              fontHead: caseData.fontHead,
              fontPara: caseData.fontPara,
              openLayer: caseData.action_library_detail,
            });

            await webBuilder.genLoc(textBoxXpath("Library")).first().fill(caseData.search_library.slice(-1));
            await webBuilder.genLoc(webBuilder.resultSearch).first().click();
            await webBuilder.page.click(webBuilder.hyperlinkReplateTemplate);
            await webBuilder.page.click(webBuilder.nameTemplateReplace);
            await webBuilder.page.click(webBuilder.optionSelectTemplate);

            //chon template store
            await verifySuccessMess(caseData.template_type, webBuilder.page, caseData.cate_name);
          });
        }

        if (caseData.action_library_detail) {
          await test.step("Off toggle template on dashboard", async () => {
            const creatorPage = new CreatorPage(webBuilder.page, conf.suiteConf.domain);
            //disable template
            await webBuilder.page.goto(`https://${conf.suiteConf.domain}/admin/themes`);
            await webBuilder.page.waitForSelector(creatorPage.getXpathAction("Edit", caseData.index));
            await webBuilder.genLoc(creatorPage.getXpathAction("Edit", caseData.index)).click();
            await webBuilder.waitResponseWithUrl("admin/themes.json");
            await webBuilder.page.click(creatorPage.getXpathTabTemplate(caseData.template_tab));
            if (caseData.template_type == "section" || caseData.template_type == "block") {
              await webBuilder.page.click(creatorPage.getXpathSelectSectionCate(caseData.cate_name));
            }
            await webBuilder.genLoc("span.sb-switch__switch").first().click();
            //verify not show template on web front
            await verifyDisableTemplate(conf, webBuilder.page, {
              siteId: conf.suiteConf.theme_id,
              type: caseData.template_type,
              templateName: caseData.template_name,
              fontHead: caseData.fontHead,
              fontPara: caseData.fontPara,
            });
          });

          await test.step("Edit name template", async () => {
            const creatorPage = new CreatorPage(webBuilder.page, conf.suiteConf.domain);
            await webBuilder.page.goto(`https://${conf.suiteConf.domain}/admin/themes`);
            await webBuilder.genLoc(creatorPage.getXpathAction("Edit", caseData.index)).click();
            await webBuilder.page.waitForLoadState("networkidle");
            await webBuilder.page.click(creatorPage.getXpathTabTemplate(caseData.template_tab));
            if (caseData.template_type == "section" || caseData.template_type == "block") {
              await webBuilder.page.click(creatorPage.getXpathSelectSectionCate(caseData.cate_name));
            }
            await webBuilder.genLoc(webBuilder.cardTemplateInfo).first().click();
            await webBuilder.genLoc(webBuilder.btnEdit).first().click();

            await webBuilder.genLoc(webBuilder.inputTemplateName).fill(caseData.template_name_edit);
            await webBuilder.genLoc(webBuilder.btnSaveCardTemplate).click();
            await webBuilder.waitResponseWithUrl("admin/themes/builder");
            await expect(webBuilder.genLoc(webBuilder.nameCardTemplate).first()).toHaveText(
              caseData.template_name_edit,
            );
          });

          await test.step("Delete template on dashboard", async () => {
            const creatorPage = new CreatorPage(webBuilder.page, conf.suiteConf.domain);
            await webBuilder.page.goto(`https://${conf.suiteConf.domain}/admin/themes`);
            await webBuilder.genLoc(creatorPage.getXpathAction("Edit", caseData.index)).click();
            await webBuilder.page.waitForLoadState("networkidle");
            await webBuilder.page.click(creatorPage.getXpathTabTemplate(caseData.template_tab));
            if (caseData.template_type == "section" || caseData.template_type == "block") {
              await webBuilder.page.click(creatorPage.getXpathSelectSectionCate(caseData.cate_name));
            }
            await webBuilder.genLoc(webBuilder.cardTemplateInfo).first().click();
            await webBuilder.genLoc(webBuilder.btnDelete).click();

            await webBuilder.page.click(webBuilder.deleteTemplate);
            //verify not show template on web front
            await verifyDisableTemplate(conf, webBuilder.page, {
              siteId: conf.suiteConf.theme_id,
              type: caseData.template_type,
              templateName: caseData.template_name,
              fontHead: caseData.fontHead,
              fontPara: caseData.fontPara,
            });
          });
        }
      });
    });
  }
});
