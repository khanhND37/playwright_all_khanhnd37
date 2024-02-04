import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { PageSettingsData } from "@types";
import { snapshotDir } from "@utils/theme";

let webBuilder: WebBuilder, previewPage: Page, settingsData: PageSettingsData, blocks: Blocks;

test.describe("Check module Save Exit Preview of Web Builder @SB_WEB_BUILDER_NAV_SAVE", () => {
  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    await test.step("Pre-condition: Apply blank template and open web builder", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
      settingsData.pages["home"].default.elements = [];
      await builder.updateSiteBuilder(conf.suiteConf.theme_id, settingsData);
      await blocks.openWebBuilder({
        id: conf.suiteConf.theme_id,
        type: "site",
      });
      await blocks.loadingScreen.waitFor();
      await blocks.loadingScreen.waitFor({ state: "hidden" });
    });
  });

  test.describe("Check module Save @SB_WEB_BUILDER_NAV_SAVE", () => {
    test("Check hiển thị trạng thái khi lưu thành công @SB_WEB_BUILDER_NAV_SAVE_1", async ({ dashboard, conf }) => {
      await test.step("Verify save button is disabled", async () => {
        await expect(dashboard.locator(webBuilder.xpathButtonSave)).toBeDisabled();
      });

      await test.step("Change settings", async () => {
        await dashboard.click(`:nth-match(${webBuilder.layerSelector}, 1)`);
        await webBuilder.selectOptionOnQuickBar("Duplicate");
        await webBuilder.selectOptionOnQuickBar("Delete");
      });

      await test.step("Verify save button is enable", async () => {
        await expect(webBuilder.headerMessage()).toContainText(conf.caseConf.expected.unsaved_message);
        await expect(dashboard.locator(webBuilder.xpathButtonSave)).toBeEnabled();
      });

      await test.step("Save changes", async () => {
        await webBuilder.clickOnElement(webBuilder.xpathButtonSave);
      });

      await test.step("Verify save changes success", async () => {
        await expect(webBuilder.toastMessage).toContainText(conf.caseConf.expected.success_message);
        await expect(dashboard.locator(webBuilder.xpathButtonSave)).toBeDisabled();
      });

      await test.step("Click close toast message", async () => {
        await dashboard.locator(webBuilder.xpathToastContainer).click();
      });

      await test.step("Verify toast is closed", async () => {
        await expect(webBuilder.toastMessage).toBeHidden();
      });
    });

    test("Check hiển thị trạng thái lưu khi trong quá trình lưu xảy ra lỗi khác @SB_WEB_BUILDER_NAV_SAVE_2", async ({
      dashboard,
      context,
      conf,
    }) => {
      const sectionSetting = conf.caseConf.add_blank_section;

      await test.step("Edit settings", async () => {
        await webBuilder.dragAndDropInWebBuilder(sectionSetting);
      });

      await test.step("Disconnect web browser network", async () => {
        await context.setOffline(true);
      });

      await test.step("Click save when no connection", async () => {
        await webBuilder.clickBtnNavigationBar(conf.caseConf.save_button);
      });

      await test.step("Verify error message appear", async () => {
        await dashboard.waitForLoadState("domcontentloaded");
        await expect(webBuilder.toastMessage.nth(1)).toContainText(conf.caseConf.expected.error_message);
      });
    });

    test("Check hiển thị warning khi reload page (F5) hoặc back ở browser @SB_WEB_BUILDER_NAV_SAVE_3", async ({
      dashboard,
      conf,
    }) => {
      const sectionSetting = conf.caseConf.add_blank_section;

      await test.step("Reload page when nothing changes", async () => {
        await dashboard.reload();
      });

      await test.step("Verify no popup appear", async () => {
        await expect(webBuilder.popupConfirm).toBeHidden();
      });

      await test.step("Go back browser", async () => {
        await dashboard.goBack();
      });

      await test.step("Verify no popup appear", async () => {
        await expect(webBuilder.popupConfirm).toBeHidden();
      });

      await test.step("Go to web builder", async () => {
        await dashboard.goForward();
      });

      await test.step("Edit settings", async () => {
        await webBuilder.dragAndDropInWebBuilder(sectionSetting);
      });

      await test.step("Edit settings", async () => {
        await webBuilder.dragAndDropInWebBuilder(sectionSetting);
      });

      await test.step("Go back browser", async () => {
        dashboard.goBack();
      });

      await test.step("Verify popup confirm appear", async () => {
        await expect(webBuilder.popupConfirm).toContainText(conf.caseConf.expected.popup_title);
        await expect(webBuilder.popupConfirm).toContainText(conf.caseConf.expected.warning_message);
      });

      await test.step("Close the popup", async () => {
        await webBuilder.clickBtnInConfirmPopup("x");
      });

      await test.step("Click exit", async () => {
        await webBuilder.clickBtnNavigationBar(conf.caseConf.exit_button);
      });

      await test.step("Verify popup confirm appear", async () => {
        await expect(webBuilder.popupConfirm).toContainText(conf.caseConf.expected.popup_title);
        await expect(webBuilder.popupConfirm).toContainText(conf.caseConf.expected.warning_message);
      });

      await test.step("Close the popup", async () => {
        await webBuilder.clickBtnInConfirmPopup("Stay");
      });

      await test.step("Handle warning popup appear", async () => {
        dashboard.once("dialog", async dialog => {
          await dialog.dismiss();
        });
      });

      await test.step("Close the page", async () => {
        await dashboard.close({ runBeforeUnload: true });
      });
    });
  });

  test.describe("Check module Exit @SB_WEB_BUILDER_NAV_EXIT", () => {
    test("Check hiển thị tooltip khi hover vào icon @SB_WEB_BUILDER_NAV_EXIT_1", async ({ dashboard }) => {
      await test.step("Hover on exit button", async () => {
        await dashboard.locator(webBuilder.xpathBtnExit).hover();
      });
      await test.step("Verify tooltip appear", async () => {
        await expect(webBuilder.TooltipExit).toBeVisible();
      });
    });

    test("Check điều hướng khi click vào icon exit khi không có unsaved changes @SB_WEB_BUILDER_NAV_EXIT_2", async ({
      dashboard,
      conf,
    }) => {
      await test.step("Click exit before edit template", async () => {
        await webBuilder.clickBtnNavigationBar(conf.caseConf.exit_button);
      });

      await test.step("Verify no popup confirm appear", async () => {
        await expect(webBuilder.popupConfirm).toBeHidden();
      });

      await test.step("Verify redirect to the right page", async () => {
        await dashboard.goForward();
        await expect(dashboard).toHaveURL(new RegExp(conf.caseConf.expected_url));
      });
    });
    test("Check điều hướng khi click vào icon exit khi có unsaved changes @SB_WEB_BUILDER_NAV_EXIT_3", async ({
      dashboard,
      conf,
    }) => {
      for (const action of conf.caseConf.popup_actions) {
        const expected = conf.caseConf.expected;
        const sectionNames = await webBuilder.getAllSectionName();
        await test.step("Edit template", async () => {
          await webBuilder.removeLayer({ sectionName: sectionNames[0] });
        });

        await test.step("Click exit", async () => {
          await webBuilder.clickBtnNavigationBar(conf.caseConf.exit_button);
        });

        await test.step("Verify popup confirm appear", async () => {
          await expect(webBuilder.popupConfirm).toContainText(expected.popup_title && expected.warning_message);
        });

        await test.step(`${action.title}`, async () => {
          await webBuilder.clickBtnInConfirmPopup(action.button);
        });

        await test.step("Verify after click button on confirm popup ", async () => {
          await expect(dashboard).toHaveURL(new RegExp(action.expected_url));
        });
      }
    });
  });

  test.describe("Check module Preview @SB_WEB_BUILDER_NAV_PRE", async () => {
    test("Check hiển thị icon của preview ở Action bar @SB_WEB_BUILDER_NAV_PRE_1", async () => {
      await test.step("Hover in preview icon", async () => {
        await webBuilder.previewIcon.hover();
      });
      await test.step("Verify tooltip Visible", async () => {
        await expect(webBuilder.previewTooltip).toBeVisible();
      });
    });
    test("Check điều hướng khi click vào icon preview ở Action bar @SB_WEB_BUILDER_NAV_PRE_2", async ({
      dashboard,
      context,
      conf,
    }) => {
      const expected = conf.caseConf.expected;
      const sectionSetting = conf.caseConf.add_blank_section;

      await test.step("Edit settings", async () => {
        await webBuilder.dragAndDropInWebBuilder(sectionSetting);
      });

      await test.step("Save changes", async () => {
        await dashboard.locator(webBuilder.xpathButtonSave).click();
      });

      const toastHeader = webBuilder.toastHeader;
      await test.step("Verify save success", async () => {
        await expect(dashboard.locator(webBuilder.toastHeader)).toHaveText(expected.success_message);
        await webBuilder.waitUntilElementInvisible(toastHeader);
      });

      await test.step("Preview the template after edit in new tab", async () => {
        previewPage = await webBuilder.clickElementAndNavigateNewTab(context, webBuilder.previewIcon);
      });

      await test.step("Verify the preview page", async () => {
        await expect(previewPage).toHaveURL(new RegExp(expected.url));
      });

      const hiddenBlock = previewPage.locator("//div[normalize-space()='Limited Time Offer']/parent::section");
      await test.step("Verify preview template after edit", async () => {
        await expect(hiddenBlock).toBeHidden();
      });
    });

    test("Check điều hướng khi click vào icon preview ở Action bar @SB_WEB_BUILDER_NAV_PRE_3	", async ({
      context,
      conf,
    }) => {
      const expected = conf.caseConf.expected;
      const sectionSetting = conf.caseConf.add_blank_section;

      await test.step("Edit template", async () => {
        await webBuilder.dragAndDropInWebBuilder(sectionSetting);
      });
      await test.step("Preview the template after edit in new tab", async () => {
        previewPage = await webBuilder.clickElementAndNavigateNewTab(context, webBuilder.previewIcon);
      });
      await test.step("Verify the preview page", async () => {
        await expect(previewPage).toHaveURL(new RegExp(expected.url));
      });

      const totalSections = webBuilder.xpathSectionPreviewPage;
      await test.step("Verify preview template after edit", async () => {
        await previewPage.waitForLoadState("networkidle");
        const countTotalSections = await totalSections.count();
        await expect(countTotalSections).toBeGreaterThan(expected.section);
      });
    });
  });
});
