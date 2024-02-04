import { verifyRedirectUrl, snapshotDir, waitSelector, waitForImageLoaded } from "@core/utils/theme";
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
import { CreatorPage } from "@pages/dashboard/creator";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { PageSettingsData } from "@types";

let creatorPage: CreatorPage, themes: ThemeEcom;
let webBuilder: WebBuilder;
let selector: string;
let settingsData: PageSettingsData;

test.beforeEach(async ({ conf, builder, dashboard }, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
  await test.step("Set data for page", async () => {
    themes = new ThemeEcom(dashboard);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await test.step(`get data setting web`, async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
    });
  });
  await test.step("Delete all library", async () => {
    await deleteLibrary(builder, conf);
  });
});

test.afterEach(async ({ conf, builder }) => {
  await builder.updateSiteBuilder(conf.suiteConf.theme_id, settingsData);
});

test.describe("Library detail", () => {
  const conf = loadData(__dirname, "TC_LIBRARY_DETAIL");
  const activePageXpath = "//*[contains(@class,'sb-tab-panel') and not(@style='display: none;')]";
  for (const caseData of conf.caseConf.data) {
    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, conf, builder, snapshotFixture }) => {
      creatorPage = new CreatorPage(dashboard, conf.caseConf.domain);
      const domain = conf.suiteConf.domain;
      const themeID = conf.suiteConf.theme_id;

      if (caseData.library_dashboard) {
        await test.step("Create library on dashboard", async () => {
          await dashboard.goto(`https://${domain}/admin/themes`);
          await dashboard.click(creatorPage.xpathBtnCreateLib);
          await dashboard.click(creatorPage.xpathInputLibName);
          await dashboard.locator(creatorPage.xpathInputLibName).fill(caseData.library_dashboard);

          await dashboard.locator(creatorPage.xpathInputLibDescription).click();
          await dashboard.locator(creatorPage.xpathInputLibDescription).fill(caseData.library_description);
          await dashboard.locator(creatorPage.xpathBtnSave).click();
          await expect(dashboard.locator(creatorPage.getXpathLibName(caseData.index))).toHaveText(
            caseData.library_dashboard,
          );

          await expect(dashboard.locator(creatorPage.getXpathLibDescription(caseData.index))).toHaveText(
            caseData.library_description,
          );
        });

        await test.step("Open library detail", async () => {
          await dashboard.locator(creatorPage.getXpathAction("Edit", caseData.index)).click();
          await themes.waitForXpathState(creatorPage.contentWebTemplate, "stable");
          await dashboard.locator(themes.getXpathByName(caseData.template_tab)).click();
          await expect(dashboard.locator(themes.getXpathByName(caseData.template_tab))).toHaveAttribute(
            "class",
            /--active/,
          );

          await expect(dashboard.locator(`${activePageXpath}//p[contains(@class, 'title')]`).first()).toHaveText(
            caseData.expect.library_empty_title,
          );
        });

        await test.step("Edit library name", async () => {
          await dashboard.locator(creatorPage.xpathInputLibName).click();
          await dashboard.locator(creatorPage.xpathInputLibName).fill(caseData.library_edit);
          await dashboard.locator(creatorPage.xpathBtnSaveLib).click();
          await expect(dashboard.locator("text=Update library details successfully")).toBeVisible();
        });

        await test.step("Go to web builder", async () => {
          await verifyRedirectUrl({
            page: dashboard,
            selector: `${activePageXpath}//button >> nth=0`,
            redirectUrl: `https://${conf.suiteConf.domain}/admin/builder/site`,
            waitForElement: creatorPage.xpathNavigation,
          });
          await themes.waitForXpathState(themes.getXpathBtnByName("Save"), "stable");
          if (!(await dashboard.locator(creatorPage.xpathBtnSaveWB).isVisible())) {
            await themes.clickBtnByName("Save");
            await dashboard.waitForSelector(themes.getXpathByName("All changes are saved"));
          }
        });

        await test.step("Verify display library on web front", async () => {
          await dashboard.locator(creatorPage.xpathBtnInsert).click();
          await dashboard.click(creatorPage.xpathSelectLib);
          await expect(dashboard.locator(creatorPage.xpathListLib).last()).toHaveText(caseData.library_edit);
        });
        await test.step("Add template with library", async () => {
          await openSaveTemplatePopup(dashboard, conf, {
            siteId: themeID,
            type: caseData.template_type,
            fontHead: caseData.fontHead,
            fontPara: caseData.fontPara,
            openLayer: caseData.open_layer,
            color: caseData.color,
          });
          await Promise.all([
            async () => {
              if (caseData.template_type !== "color" && caseData.template_type !== "font") {
                await themes.waitResponseWithUrl("fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE2V9BPQ.woff2", 3000);
              }
            },
            async () => {
              if (["section", "page"].includes(caseData.template_type)) {
                await themes.waitResponseWithUrl("fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE2V9BPQ.woff2", 3000);
              }
            },
          ]);

          //Create template & category on web front
          if (caseData.cate_name) {
            await createCate(dashboard, caseData.cate_name, caseData.icon);
          }

          if (caseData.search_library) {
            await dashboard.locator(textBoxXpath("Library")).click();
            await dashboard.locator(textBoxXpath("Library")).fill(caseData.search_library.slice(-1));
            await dashboard.locator(creatorPage.xpathListSearchLib).last().click();
          }

          await inputTemplateName(caseData.template_type, dashboard, caseData.template_name2);
          await verifySuccessMess(caseData.template_type, dashboard, caseData.cate_name);

          await themes.waitForXpathState(themes.getXpathBtnByName("Save"), "stable");
          if (!(await dashboard.locator(creatorPage.xpathBtnSaveWB).isVisible())) {
            await themes.clickBtnByName("Save");
            await dashboard.waitForSelector(themes.getXpathByName("All changes are saved"));
          }
        });

        await test.step("Exit from web front", async () => {
          if (caseData.exit) {
            await dashboard.locator(caseData.exit).click();
          }
        });

        await test.step("Verify template & category on dashboard", async () => {
          await dashboard.goto(`https://${domain}/admin/themes`);
          await dashboard.locator(creatorPage.getXpathAction("Edit", caseData.index)).click();
          await themes.waitForXpathState(creatorPage.contentWebTemplate, "stable");
          await dashboard.click(themes.getXpathByName(caseData.template_tab));
          if (caseData.template_type == "block" || caseData.template_type == "section") {
            await dashboard.click(creatorPage.xpathExpandCate);
          }

          await dashboard.waitForSelector(creatorPage.xpathCardTemplate);
          await waitSelector(dashboard, creatorPage.xpathCardTemplate);
          await waitForImageLoaded(dashboard, creatorPage.xpathCardTemplate);
          if (caseData.template_type == "color" || caseData.template_type == "font") {
            selector = `(${activePageXpath}//div[contains(@class, 'card-template')])[1]`;
          } else {
            selector = `${activePageXpath}//img[contains(@class, 'card-template__image')]`;
          }
          await snapshotFixture.verifyWithAutoRetry({
            page: dashboard,
            snapshotName: caseData.expect.snapshot_template,
            selector: selector,
          });
          await expect(dashboard.locator(webBuilder.toggleSwitch)).toHaveValue("true");
        });
      }

      if (caseData.cate_2) {
        await test.step("create, edit, delete category on dashboard", async () => {
          await test.step("Create category", async () => {
            //create library by API
            if (caseData.library_api) {
              await builder.createLibrary(caseData.library_api);
              if (caseData.category_api) {
                const firstID = await builder.getLastestLibraryID();
                await builder.createCategoryByAPI({
                  ...caseData.category_api,
                  type: caseData.template_type,
                  library_id: firstID,
                });
              }
            }
            await dashboard.goto(`https://${domain}/admin/themes`);
            await dashboard.locator(creatorPage.getXpathAction("Edit", caseData.index)).click();
            await themes.waitForXpathState(creatorPage.contentWebTemplate, "stable");
            await dashboard.click(themes.getXpathByName(caseData.template_tab));
            await dashboard.click(creatorPage.xpathBtnAddCate);
            await expect(dashboard.locator(creatorPage.xpathPopupAddCate)).toHaveText("Add category");

            await dashboard.click(creatorPage.xpathInputCateName);
            await dashboard.locator(creatorPage.xpathInputCateName).fill(caseData.cate_2);
            await dashboard.locator(creatorPage.xpathBtnIcon).click();
            await dashboard.locator(".list-icon-grid div").last().click();
            await themes.clickBtnByName("Save");
            await expect(dashboard.locator(creatorPage.xpathTablistName).first()).toHaveText(caseData.cate_2);
          });
        });
        await test.step("Edit category on dashboard", async () => {
          await dashboard.locator(creatorPage.getXpathActionCate()).first().click();
          await dashboard.locator(creatorPage.xpathInputCateName).click();
          await dashboard.locator(creatorPage.xpathInputCateName).fill(caseData.cate_2_edit);
          await themes.clickBtnByName("Save");
          await expect(dashboard.locator(creatorPage.xpathTablistName).first()).toHaveText(caseData.cate_2_edit);
        });

        await test.step("check create template with category & library", async () => {
          await openSaveTemplatePopup(dashboard, conf, {
            siteId: themeID,
            type: caseData.template_type,
            fontHead: caseData.fontHead,
            fontPara: caseData.fontPara,
            openLayer: caseData.open_layer,
            color: caseData.color,
          });

          await dashboard.locator(textBoxXpath("Category")).first().click();
          await waitSelector(dashboard, creatorPage.getXpathChooseCate(caseData.cate_2_edit));
          await dashboard.locator(creatorPage.getXpathChooseCate(caseData.cate_2_edit)).click();
          await await inputTemplateName(caseData.template_type, dashboard, caseData.template_name2);
          await verifySuccessMess(caseData.template_type, dashboard, caseData.cate_2_edit);
        });

        await test.step("Check delete category on dash board", async () => {
          await dashboard.goto(`https://${domain}/admin/themes`);
          await dashboard.locator(creatorPage.getXpathAction("Edit", caseData.index)).click();
          await themes.waitForXpathState(creatorPage.contentWebTemplate, "stable");
          await dashboard.click(themes.getXpathByName(caseData.template_tab));
          await dashboard.locator(creatorPage.getXpathActionCate(1)).first().click();
          await expect(dashboard.locator(creatorPage.xpathPopupAddCate)).toHaveText(
            `Are you sure you want to delete "${caseData.cate_2_edit}" ?`,
          );

          await verifyDisableTemplate(conf, dashboard, {
            siteId: themeID,
            type: caseData.template_type,
            templateName: caseData.template_name,
            fontHead: caseData.fontHead,
            fontPara: caseData.fontPara,
          });
        });
      }

      if (caseData.library_delete) {
        await test.step("Delete library", async () => {
          await dashboard.goto(`https://${domain}/admin/themes`);
          await dashboard.locator(creatorPage.getXpathAction("Delete", caseData.index)).click();
          //Cancel
          await dashboard.locator(creatorPage.xpathBtnDiscard).click();
          await expect(dashboard.locator(creatorPage.getXpathLibName(caseData.index))).toHaveText(
            caseData.library_edit,
          );
          //confirm delete
          await dashboard.locator(creatorPage.getXpathAction("Delete", caseData.index)).click();
          await dashboard.locator(creatorPage.xpathBtnDelete).click();
          await expect(dashboard.locator("text=Delete library successfully")).toBeVisible();
        });

        await test.step("Verify not show library on web front", async () => {
          await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes/builder/site/${themeID}`);
          await dashboard.waitForLoadState("networkidle");
          await dashboard.waitForSelector(".sb-spinner--medium", { state: "hidden" });
          await dashboard.locator(creatorPage.xpathBtnInsert).click();
          await dashboard.click(creatorPage.xpathSelectLib);
          await expect(await dashboard.locator(creatorPage.xpathListLib).allTextContents()).not.toContain(
            caseData.library_edit,
          );
        });
      }
    });
  }
});
