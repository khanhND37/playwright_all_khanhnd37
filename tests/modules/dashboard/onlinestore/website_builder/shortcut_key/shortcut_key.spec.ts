import { Page } from "@playwright/test";
import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { XpathNavigationButtons } from "@constants/web_builder";
import { PageBuilder, PageSiteBuilder, ShopTheme, ThemeSettingsData } from "@types";

test.describe("Keyboard shortcut", () => {
  const buttonSaveSelector = ".w-builder__header-right .sb-button--primary >> text=Save";
  const layerSelector = ".w-builder__layers-content .w-builder__layer";
  let isApple = false;
  let ctrlOrMetaKey = "Control";
  let webBuilder: WebBuilder;
  let block: Blocks;
  let shopTheme: ShopTheme | PageBuilder | PageSiteBuilder;
  const softAssertion = expect.configure({ soft: true });

  async function getCtrlMetaKey(page: Page): Promise<void> {
    isApple = await page.evaluate(() => /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    if (isApple) {
      ctrlOrMetaKey = "Meta";
    }
  }

  test.beforeEach(async ({ dashboard, builder, conf }, testInfo) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    block = new Blocks(dashboard, conf.suiteConf.domain);
    testInfo.snapshotSuffix = "";

    await test.step("Get initial states of test theme", async () => {
      shopTheme = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
    });

    await test.step("Open web builder", async () => {
      webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
      await block.openWebBuilder({ id: conf.suiteConf.theme_id, type: "site" });
      await block.loadingScreen.waitFor();
      await block.reloadIfNotShow("web builder");
      await getCtrlMetaKey(dashboard);
    });
  });

  test.afterEach(async ({ builder, conf }) => {
    await test.step("Reset theme to initial state", async () => {
      await builder.updateSiteBuilder(conf.suiteConf.theme_id, shopTheme.settings_data as ThemeSettingsData);
    });
  });

  test("@SB_WEB_BUILDER_SHORTCUT_KEY_14 Check shortcut Preview trên Window", async ({ context, dashboard, conf }) => {
    const openNewTabAndClose = async (callback?: (newTab: Page) => Promise<void>) => {
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.keyboard.press(`${ctrlOrMetaKey}+P`),
      ]);
      await newTab.waitForLoadState("networkidle");
      await softAssertion(newTab).toHaveURL(new RegExp(conf.caseConf.expected.preview_url));
      if (typeof callback === "function") {
        await callback(newTab);
      }

      await newTab.close();
    };

    await test.step("Press tổ hợp phím Ctrl + P", async () => {
      await openNewTabAndClose();
    });

    await test.step("Edit 1 element", async () => {
      await dashboard.click(`:nth-match(${layerSelector}, 1)`);
      await webBuilder.selectOptionOnQuickBar("Duplicate");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
    });

    await test.step("Press tổ hợp phím Ctrl + P", async () => {
      await openNewTabAndClose(async newTab => {
        const countAction = await newTab.locator("[data-section-id]").count();
        softAssertion(countAction).toEqual(conf.caseConf.expected.before_duplicate);
      });
    });

    await test.step("Nhấn save button, Press tổ hợp phím Ctrl + P", async () => {
      await dashboard.locator(buttonSaveSelector).click();
      await softAssertion(webBuilder.headerMessage()).toContainText(conf.caseConf.expected.saved);
      await dashboard.waitForSelector(".sb-toast__message", { state: "hidden" });
      await openNewTabAndClose(async newTab => {
        const countAction = await newTab.locator("[data-section-id]").count();
        softAssertion(countAction).toEqual(conf.caseConf.expected.after_duplicate);
      });
    });
  });

  test("@SB_WEB_BUILDER_SHORTCUT_KEY_15 Check shortcut Save trên Window", async ({ dashboard, conf }) => {
    await test.step("- Truy cập Page A của Website builder", async () => {
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeDisabled();
    });

    await test.step("Edit 1 element", async () => {
      await dashboard.click(`:nth-match(${layerSelector}, 1)`);
      await webBuilder.selectOptionOnQuickBar("Duplicate");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await softAssertion(webBuilder.headerMessage()).toContainText(conf.caseConf.expected.unsaved);
    });

    await test.step("Press tổ hợp phím Ctrl + S", async () => {
      await Promise.all([
        dashboard.keyboard.press(`${ctrlOrMetaKey}+S`),
        await softAssertion(webBuilder.headerMessage()).toContainText(conf.caseConf.expected.saving),
        await softAssertion(dashboard.locator(buttonSaveSelector)).toBeDisabled(),
        await softAssertion(webBuilder.headerMessage()).toContainText(conf.caseConf.expected.saved),
      ]);
    });

    await test.step("Press tổ hợp phím Ctrl + S một lần nữa", async () => {
      await Promise.all([
        dashboard.keyboard.press(`${ctrlOrMetaKey}+S`),
        await softAssertion(webBuilder.headerMessage()).toBeHidden(),
      ]);
    });
  });

  test(`@SB_WEB_BUILDER_SHORTCUT_KEY_10 Check hiển thị button Undo khi có thay đổi n lần trên Window`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const buttonInWB = webBuilder.getPreviewFrameLocator(webBuilder.buttonInPreview).first();
    await test.step(`Verify button Save disable khi mở page A`, async () => {
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeDisabled();
    });

    await test.step(`Click option button - button ngoài cùng bên phải header`, async () => {
      await webBuilder.clickBtnNavigationBar("more");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.moreAction,
        snapshotName: conf.caseConf.expected[`more_action_snapshot_${isApple ? "mac" : "win"}`],
      });
    });

    await test.step(`Click Keyboard shortcut`, async () => {
      await dashboard.click(webBuilder.shortCutInMoreAction);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.keyboardShortcut,
        snapshotName: conf.caseConf.expected[`help_shortcut_snapshot_${isApple ? "mac" : "win"}`],
        combineOptions: { animations: "disabled" },
      });
      await dashboard.click(webBuilder.closeKeyboardShortcut);
    });

    await test.step(`Thực hiện thay đổi setting 1 lần `, async () => {
      await buttonInWB.click();
      await dashboard.getByRole("button", { name: "Delete block" }).click();
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeEnabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
    });

    await test.step(`Press tổ hợp phím Ctrl(⌘) + Z`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+Z`);
      await softAssertion(buttonInWB).toBeVisible();
    });

    await test.step(`Thực hiện thay đổi setting n lần `, async () => {
      await dashboard.click(`:nth-match(${layerSelector}, 1)`);
      await webBuilder.selectOptionOnQuickBar("Duplicate");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await webBuilder.selectOptionOnQuickBar("Hide");
      await buttonInWB.click();
      await dashboard.getByRole("button", { name: "Delete block" }).click();
      await softAssertion(buttonInWB).not.toBeVisible();
    });

    await test.step(`Đang ở bản ghi thứ n, Press tổ hợp phím Ctrl(⌘) + Z 1 lần`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+Z`);
      await softAssertion(buttonInWB).toBeVisible();
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeEnabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeEnabled();
    });

    await test.step(`Nhấn save button, reload trang`, async () => {
      await dashboard.locator(buttonSaveSelector).click();
      await dashboard.reload();
      await block.loadingScreen.waitFor();
      await block.reloadIfNotShow("web builder");
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeDisabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
    });

    await test.step(`Press tổ hợp phím Ctrl(⌘) + Z`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+Z`);
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeDisabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
    });
  });

  test(`@SB_WEB_BUILDER_SHORTCUT_KEY_12 Check Redo n lần by shortcut trên Window`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const buttonInWB = webBuilder.getPreviewFrameLocator(webBuilder.buttonInPreview).first();
    const buttonIconInWB = webBuilder.getPreviewFrameLocator(webBuilder.blockIcon).first();
    await test.step(`Thực hiện thay đổi setting 1 lần `, async () => {
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeDisabled();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator("main"),
        snapshotName: conf.caseConf.first_snapshort,
      });
      await buttonInWB.click();
      await dashboard.getByRole("button", { name: "Delete block" }).click();
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeEnabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
    });

    await test.step(`Press tổ hợp phím Ctrl(⌘) + Z`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+Z`);
      await softAssertion(buttonInWB).toBeVisible();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeEnabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeDisabled();
    });

    await test.step(`Press tổ hợp phím Ctrl(⌘) + Shift + Z`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+Shift+Z`);
      await softAssertion(buttonInWB).not.toBeVisible();
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeEnabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
    });

    await test.step(`Thực hiện thay đổi setting n lần `, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+Z`);
      await dashboard.click(`:nth-match(${layerSelector}, 1)`);
      await webBuilder.selectOptionOnQuickBar("Duplicate");
      const addBlockIcon = conf.caseConf.dnd_block_icon;
      const addBlockHeading = conf.caseConf.dnd_block_heading;
      await webBuilder.dragAndDropInWebBuilder(addBlockHeading);
      await webBuilder.dragAndDropInWebBuilder(addBlockIcon);
      await buttonIconInWB.click();
      await webBuilder.selectOptionOnQuickBar("Delete");
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeEnabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
    });

    await test.step(`Đang ở bản ghi thứ n, Press tổ hợp phím Ctrl(⌘) + Z 1 lần`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+Z`);
      await softAssertion(buttonIconInWB).toBeVisible();
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeEnabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeEnabled();
    });

    await test.step(`Press tổ hợp phím Ctrl(⌘) + Shift + Z 2 lần`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+Shift+Z`);
      await softAssertion(buttonIconInWB).not.toBeVisible();
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeEnabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
    });

    await test.step(`Nhấn save button, reload trang`, async () => {
      await block.clickSave();
      await dashboard.reload();
      await block.loadingScreen.waitFor();
      await block.reloadIfNotShow("web builder");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator("main"),
        snapshotName: conf.caseConf.second_snapshort,
      });
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeDisabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
    });

    await test.step(`Press tổ hợp phím Ctrl(⌘) + Shift + Z`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+Shift+Z`);
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator("main"),
        snapshotName: conf.caseConf.second_snapshort,
      });
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeDisabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
    });
  });

  test(`@SB_WEB_BUILDER_SHORTCUT_KEY_29 Phase2_Window_Check shortcut Delete trên Window`, async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    const section1Preview = webBuilder.getSelectorByIndex({ section: 1 });

    await test.step(`Mở page A, click option button - button ngoài cùng bên phải header `, async () => {
      await webBuilder.clickBtnNavigationBar("more");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.moreAction,
        snapshotName: conf.caseConf.expected.more_action_snapshot,
      });
    });

    await test.step(`Click Keyboard shortcut`, async () => {
      await dashboard.click(webBuilder.shortCutInMoreAction);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.keyboardShortcut,
        snapshotName: conf.caseConf.expected[`help_shortcut_snapshot_${isApple ? "mac" : "win"}`],
        combineOptions: { animations: "disabled" },
      });
      await dashboard.click(webBuilder.closeKeyboardShortcut);
    });

    await test.step(`Không có element ở trạng thái select, press phím Backspace`, async () => {
      await dashboard.keyboard.press("Backspace");
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeDisabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeDisabled();
    });

    await test.step(`Click chọn column ở trạng thái select`, async () => {
      const columnPreview = webBuilder.getSelectorByIndex({ section: 1, column: 2 });
      await webBuilder.clickOnElement(columnPreview, webBuilder.iframe);
    });

    await test.step(`Press phím  Backspace`, async () => {
      await dashboard.keyboard.press("Backspace");
      await softAssertion(block.frameLocator.locator(block.columnsInPreview)).toHaveCount(1);
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
    });

    await test.step(`Bôi đen 1 đoạn text trong heading block, press phím  Backspace`, async () => {
      await webBuilder.getPreviewFrameLocator(webBuilder.blockHeading).click();
      await block.selectOptionOnQuickBar("Edit text");
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+A`);
      await dashboard.keyboard.press("Backspace");
      await block.titleBar.click();
      await block.backBtn.click();
      await softAssertion(webBuilder.getPreviewFrameLocator(webBuilder.blockHeading)).toHaveText("");
    });

    await test.step(`Click chọn Block ở trạng thái select`, async () => {
      await webBuilder.getPreviewFrameLocator(webBuilder.imageBlock).click();
      await softAssertion(dashboard.getByRole("button", { name: "Delete block" })).toBeVisible();
    });

    await test.step(`Press phím Delete`, async () => {
      await dashboard.keyboard.press("Backspace");
      await softAssertion(webBuilder.getPreviewFrameLocator(webBuilder.imageBlock)).not.toBeVisible();
    });

    await test.step(`Click chọn row ở trạng thái select`, async () => {
      const row = webBuilder.getSelectorByIndex({ section: 1, row: 1 });
      await webBuilder.clickOnElement(row, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Duplicate");
    });

    await test.step(`Press phím Delete`, async () => {
      const secondRow = webBuilder.getSelectorByIndex({ section: 1, row: 2 });
      await dashboard.keyboard.press("Backspace");
      await softAssertion(block.frameLocator.locator(secondRow)).not.toBeVisible();
    });

    await test.step(`Click chọn section 1 ở trạng thái select`, async () => {
      await webBuilder.clickOnElement(section1Preview, webBuilder.iframe);
      await softAssertion(dashboard.getByRole("button", { name: "Delete section" })).toBeVisible();
    });

    await test.step(`Press phím Delete`, async () => {
      await dashboard.keyboard.press("Backspace");
      await softAssertion(webBuilder.getPreviewFrameLocator(section1Preview)).not.toBeVisible();
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await softAssertion(webBuilder.emtyPage).toBeVisible();
    });

    await test.step(`Nhấn save, click mở preview`, async () => {
      await webBuilder.clickSaveButton();
      const currentPage = await webBuilder.clickPreview({ context, dashboard });
      await snapshotFixture.verifyWithAutoRetry({
        page: currentPage,
        selector: "main",
        snapshotName: conf.caseConf.expected.blank_page,
      });
    });
  });

  test(`@SB_WEB_BUILDER_SHORTCUT_KEY_30 Phase2_Window_Check shortcut Duplicate(Ctrl + D) trên Window`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step(`Không có element nào ở trạng thái select, press tổ hợp phím (Ctrl + D)`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+D`);
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeDisabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeDisabled();
    });

    await test.step(`Click chọn column ở trạng thái select`, async () => {
      const columnPreview = webBuilder.getSelectorByIndex({ section: 1, column: 1 });
      await webBuilder.clickOnElement(columnPreview, webBuilder.iframe);
      await softAssertion(dashboard.getByRole("button", { name: "Delete block" })).not.toBeVisible();
    });

    await test.step(`Press tổ hợp phím (Ctrl + D)`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+D`);
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
    });

    await test.step(`Click chọn section 1 ở trạng thái select`, async () => {
      const sectionPreview = webBuilder.getSelectorByIndex({ section: 1 });
      await webBuilder.clickOnElement(sectionPreview, webBuilder.iframe);
      await softAssertion(webBuilder.quickBarButton("Duplicate")).toBeVisible();
    });

    await test.step(`Press tổ hợp phím (Ctrl + D)`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+D`);
      const sectionsInPreview = webBuilder.getPreviewFrameLocator(webBuilder.sectionsInPreview);
      await softAssertion(sectionsInPreview).toHaveCount(2);
    });

    await test.step(`Click chọn Block ở trạng thái select`, async () => {
      const firstBlockInSidebar = webBuilder.getSelectorByIndex({ section: 1, column: 1, row: 1, block: 1 });
      await webBuilder.clickOnElement(firstBlockInSidebar, webBuilder.iframe);
      await softAssertion(webBuilder.quickBarButton("Delete")).toBeVisible();
      await softAssertion(dashboard.getByRole("button", { name: "Delete block" })).toBeVisible();
    });

    await test.step(`Press tổ hợp phím (Ctrl + D)`, async () => {
      await dashboard.keyboard.press(`${ctrlOrMetaKey}+D`);
      const blocksInFirstSection = webBuilder.getPreviewFrameLocator(webBuilder.blockHeadingInFirstSectionFirstColumn);
      await softAssertion(blocksInFirstSection).toHaveCount(2);
    });

    await test.step(`Nhấn save, click mở preview`, async () => {
      await webBuilder.clickSaveButton();
      const currentPage = await webBuilder.clickPreview({ context, dashboard });
      await snapshotFixture.verifyWithAutoRetry({
        page: currentPage,
        selector: "main",
        snapshotName: conf.caseConf.duplicate_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_SHORTCUT_KEY_31 Phase2_Window_Check move block/container position bằng các phím mũi tên ( ↑ , ↓ , ← , → )
  trường hợp layout = Horizontal(element position = auto)`, async ({ dashboard, conf, context, snapshotFixture }) => {
    const snapshot = conf.caseConf.snapshot;
    const firstSection = block.getSelectorByIndex({ section: 1 });
    const blockHeading = webBuilder.xpathBlockInPreviewWB("block-heading");
    const blockIcon = webBuilder.xpathBlockInPreviewWB("block-icon");

    await test.step("Pre-condition: Add test section", async () => {
      await block.clickOnElement(firstSection, block.iframe);
      await block.page.keyboard.press("Delete");
      await block.dragAndDropInWebBuilder(conf.caseConf.test_template);
      await block.backBtn.click();
      await block.clickSave();
      await dashboard.reload();
      await block.loadingScreen.waitFor();
      await block.reloadIfNotShow("web builder");
    });

    await test.step(`Không có element nào ở trạng thái select, press phím mũi tên lên, xuống, trái, phải( ↑ , ↓ , ← , → )`, async () => {
      await dashboard.keyboard.press("ArrowUp");
      await dashboard.keyboard.press("ArrowDown");
      await dashboard.keyboard.press("ArrowLeft");
      await dashboard.keyboard.press("ArrowRight");
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeDisabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeDisabled();
    });

    await test.step(`Select block heading, press phím lên, xuống http://joxi.ru/LmGZpeOiZYPZNr`, async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowUp");
      await expect(webBuilder.frameLocator.locator(await webBuilder.getSelectorComponentByName("heading"))).toHaveCSS(
        "align-self",
        "flex-start",
      );
      await dashboard.keyboard.press("ArrowDown");
      await expect(webBuilder.frameLocator.locator(await webBuilder.getSelectorComponentByName("heading"))).toHaveCSS(
        "align-self",
        "flex-end",
      );

      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_updown_1,
      });
    });

    await test.step(`Press phím mũi tên trái `, async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowLeft");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_left_1,
      });
    });

    await test.step(`Press phím mũi tên phải`, async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowRight");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_right_1,
      });
    });

    await test.step(`Select block container, press phím lên, xuống http://joxi.ru/zANxBY7CwZPxPm`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.containerHorizontal).click();
      await dashboard.keyboard.press("ArrowUp");
      await dashboard.keyboard.press("ArrowDown");
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_updown_2,
      });
    });

    await test.step(`Press phím mũi tên trái `, async () => {
      await webBuilder.frameLocator.locator(webBuilder.containerHorizontal).click();
      await dashboard.keyboard.press("ArrowLeft");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_left_2,
      });
    });

    await test.step(`Press phím mũi tên phải`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.containerHorizontal).click();
      await dashboard.keyboard.press("ArrowRight");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_right_2,
      });
    });

    await test.step(`Select block icon trong block container, press phím lên, xuống http://joxi.ru/DmB6RLKC6xaW6m`, async () => {
      await webBuilder.clickOnElement(blockIcon, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowUp");
      await dashboard.keyboard.press("ArrowDown");
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_updown_icon,
      });
    });

    await test.step(`Press phím mũi tên trái `, async () => {
      await webBuilder.clickOnElement(blockIcon, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowLeft");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_left_icon,
      });
    });

    await test.step(`Press phím mũi tên phải`, async () => {
      await webBuilder.clickOnElement(blockIcon, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowRight");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_right_icon,
      });
    });

    await test.step(`Nhấn save, click mở preview`, async () => {
      await webBuilder.clickSaveButton();
      const currentPage = await webBuilder.clickPreview({ context, dashboard });
      await snapshotFixture.verifyWithAutoRetry({
        page: currentPage,
        selector: "main",
        snapshotName: snapshot.horizontal_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_SHORTCUT_KEY_32 Phase2_Window_Check move block/container position bằng các phím mũi tên ( ↑ , ↓ , ← , → ) trường hợp layout = Vertical(element position = auto)`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const snapshot = conf.caseConf.snapshot;
    const firstSection = block.getSelectorByIndex({ section: 1 });
    const blockHeading = webBuilder.xpathBlockInPreviewWB("block-heading");
    const blockIcon = webBuilder.xpathBlockInPreviewWB("block-icon");

    await test.step("Pre-condition: Add test section", async () => {
      await block.clickOnElement(firstSection, block.iframe);
      await block.page.keyboard.press("Delete");
      await block.dragAndDropInWebBuilder(conf.caseConf.test_template);
      await block.backBtn.click();
      await block.clickSave();
      await dashboard.reload();
      await block.loadingScreen.waitFor();
      await block.reloadIfNotShow("web builder");
    });

    await test.step(`Không có element nào ở trạng thái select, press phím mũi tên lên, xuống, trái, phải( ↑ , ↓ , ← , → )`, async () => {
      await dashboard.keyboard.press("ArrowUp");
      await dashboard.keyboard.press("ArrowDown");
      await dashboard.keyboard.press("ArrowLeft");
      await dashboard.keyboard.press("ArrowRight");
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeDisabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeDisabled();
    });

    await test.step(`Select block heading, press phím trái, phải`, async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowLeft");
      await expect(webBuilder.frameLocator.locator(await webBuilder.getSelectorComponentByName("heading"))).toHaveCSS(
        "align-self",
        "flex-start",
      );
      await dashboard.keyboard.press("ArrowRight");
      await expect(webBuilder.frameLocator.locator(await webBuilder.getSelectorComponentByName("heading"))).toHaveCSS(
        "align-self",
        "flex-end",
      );
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_left_right_1,
      });
    });

    await test.step(`Press phím mũi tên trên `, async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowUp");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_up_1,
      });
    });

    await test.step(`Press phím mũi tên dưới`, async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowDown");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_down_1,
      });
    });

    await test.step(`Select block container, press phím trái, phải`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.containerVertical).click();
      await dashboard.keyboard.press("ArrowLeft");
      await dashboard.keyboard.press("ArrowRight");
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_left_right_2,
      });
    });

    await test.step(`Press phím mũi tên trên `, async () => {
      await webBuilder.frameLocator.locator(webBuilder.containerVertical).click();
      await dashboard.keyboard.press("ArrowUp");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_up_2,
      });
    });

    await test.step(`Press phím mũi tên dưới`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.containerVertical).click();
      await dashboard.keyboard.press("ArrowDown");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_down_2,
      });
    });

    await test.step(`Select block icon trong block container, press phím trái, phải`, async () => {
      await webBuilder.clickOnElement(blockIcon, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowLeft");
      await dashboard.keyboard.press("ArrowRight");
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_left_right_icon,
      });
    });

    await test.step(`Press phím mũi tên xuống `, async () => {
      await webBuilder.clickOnElement(blockIcon, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowDown");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_down_icon,
      });
    });

    await test.step(`Press phím mũi tên trên `, async () => {
      await webBuilder.clickOnElement(blockIcon, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowUp");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.getPreviewFrameLocator(webBuilder.previewSection),
        snapshotName: snapshot.snapshot_arrow_up_icon,
      });
    });

    await test.step(`Nhấn save, click mở preview`, async () => {
      await webBuilder.clickSaveButton();
      const currentPage = await webBuilder.clickPreview({ context: context, dashboard: dashboard });
      await snapshotFixture.verifyWithAutoRetry({
        page: currentPage,
        selector: "main",
        snapshotName: snapshot.vertical_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_SHORTCUT_KEY_34 Phase2_Window_Check move section/row/column position bằng các phím mũi tên ( ↑ , ↓ , ← , → )`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    const snapshot = conf.caseConf.snapshot;
    const firstSection = block.getSelectorByIndex({ section: 1 });
    const secondSection = block.getSelectorByIndex({ section: 2 });
    const firstRowSection1 = block.getSelectorByIndex({ section: 1, row: 1 });
    const secondRowSection1 = block.getSelectorByIndex({ section: 1, row: 2 });
    const firstColumnSection2 = block.getSelectorByIndex({ section: 2, row: 1, column: 1 });
    const secondColumnSection2 = block.getSelectorByIndex({ section: 2, row: 1, column: 2 });

    await test.step("Pre-condition: Add test section", async () => {
      await block.clickOnElement(firstSection, block.iframe);
      await block.page.keyboard.press("Delete");
      for (const addSection of conf.caseConf.add_sections) {
        await block.dragAndDropInWebBuilder(addSection);
      }
      await block.backBtn.click();
      await block.clickSave();
      await dashboard.reload();
      await block.loadingScreen.waitFor();
      await block.reloadIfNotShow("web builder");
    });

    await test.step(`Select section 2, press phím xuống, trái, phải`, async () => {
      await webBuilder.clickOnElement(secondSection, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowDown");
      await dashboard.keyboard.press("ArrowLeft");
      await dashboard.keyboard.press("ArrowRight");
      await softAssertion(dashboard.locator(XpathNavigationButtons["undo"])).toBeDisabled();
      await softAssertion(dashboard.locator(XpathNavigationButtons["redo"])).toBeDisabled();
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeDisabled();
    });

    await test.step(`Press phím mũi tên lên`, async () => {
      await dashboard.keyboard.press("ArrowUp");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await block.frameLocator
        .locator(firstSection)
        .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "start" }));
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.frameLocator.locator(block.wbFullHeight),
        snapshotName: snapshot.snapshot_arrow_up,
      });
    });

    await test.step(`Press phím mũi tên xuống `, async () => {
      await webBuilder.clickOnElement(firstSection, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowDown");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await block.frameLocator
        .locator(firstSection)
        .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "start" }));
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.frameLocator.locator(block.wbFullHeight),
        snapshotName: snapshot.snapshot_arrow_down,
      });
    });

    await test.step(`Select row 1 trong section 1, press phím lên, trái, phải`, async () => {
      await webBuilder.clickOnElement(firstRowSection1, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowUp");
      await dashboard.keyboard.press("ArrowLeft");
      await dashboard.keyboard.press("ArrowRight");
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.frameLocator.locator(firstSection),
        snapshotName: snapshot.snapshot_arrow_down_left_right,
      });
    });

    await test.step(`Press phím mũi tên xuống `, async () => {
      await webBuilder.clickOnElement(firstRowSection1, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowDown");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.frameLocator.locator(firstSection),
        snapshotName: snapshot.snapshot_arrow_down_up,
      });
    });

    await test.step(`Press phím mũi tên lên`, async () => {
      await webBuilder.clickOnElement(secondRowSection1, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowUp");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.frameLocator.locator(firstSection),
        snapshotName: snapshot.snapshot_arrow_up_2,
      });
    });

    await test.step(`Select column 1(section 2), press phím lên, xuống, trái`, async () => {
      await webBuilder.clickOnElement(firstColumnSection2, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowUp");
      await dashboard.keyboard.press("ArrowDown");
      await dashboard.keyboard.press("ArrowLeft");
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.frameLocator.locator(secondSection),
        snapshotName: snapshot.snapshot_arrow_down_left,
      });
    });

    await test.step(`Press phím mũi tên phải`, async () => {
      await webBuilder.clickOnElement(firstColumnSection2, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowRight");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.frameLocator.locator(secondSection),
        snapshotName: snapshot.snapshot_arrow_right,
      });
    });

    await test.step(`Press phím mũi tên trái`, async () => {
      await webBuilder.clickOnElement(secondColumnSection2, webBuilder.iframe);
      await dashboard.keyboard.press("ArrowLeft");
      await softAssertion(dashboard.locator(buttonSaveSelector)).toBeEnabled();
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.frameLocator.locator(secondSection),
        snapshotName: snapshot.snapshot_arrow_left,
      });
    });

    await test.step(`Nhấn save, click mở preview`, async () => {
      await webBuilder.clickSaveButton();
      const currentPage = await webBuilder.clickPreview({ context: context, dashboard: dashboard });
      await snapshotFixture.verifyWithAutoRetry({
        page: currentPage,
        selector: "main",
        snapshotName: snapshot.move_section_snapshot,
      });
    });
  });

  // //Case này ko nằm trong release checklist nên tạm thời cmt
  // test("@SB_WEB_BUILDER_SHORTCUT_KEY_11 Check shortcut Undo trên Window", async ({
  //   dashboard,
  //   conf,
  //   snapshotFixture,
  // }) => {
  //   const headerIconSelector = ".w-builder__header-right .sb-button--only-icon--small";
  //   const elementIconSelector = ".w-builder__element-action .w-builder__element-icon";
  //   await test.step("Mở page A", async () => {
  //     await softAssertion(dashboard.locator(`:nth-match(${headerIconSelector}, 1)`)).toBeDisabled();
  //     await softAssertion(dashboard.locator(`:nth-match(${headerIconSelector}, 2)`)).toBeDisabled();
  //   });
  //   await test.step("Click option button - button ngoài cùng bên phải header", async () => {
  //     await dashboard.click(".w-builder__header-more-action .sb-popover__reference");
  //     await snapshotFixture.verifyWithAutoRetry({
  //       page: dashboard,
  //       selector: "//li[contains(text(), 'Keyboard shortcuts')]//ancestor::div[contains(@class,'sb-popover')]",
  //       snapshotName: conf.caseConf.expected[`more_action_snapshot_${isApple ? "mac" : "win"}`],
  //     });
  //   });
  //   await test.step("Click Keyboard shortcut", async () => {
  //     await dashboard.click(".sb-dropdown-menu__item>>text=Keyboard shortcuts");
  //     await snapshotFixture.verifyWithAutoRetry({
  //       page: dashboard,
  //       selector: ".w-builder__keyboard-shortcut",
  //       snapshotName: conf.caseConf.expected[`help_shortcut_snapshot_${isApple ? "mac" : "win"}`],
  //       combineOptions: { animations: "disabled" },
  //     });
  //     await dashboard.click(".w-builder__keyboard-shortcut-header button");
  //   });
  //   await test.step("Thực hiện thay đổi setting", async () => {
  //     await dashboard.hover(`:nth-match(${layerSelector}, 1)`);
  //     await dashboard.click(`:nth-match(${layerSelector}, 1) ${elementIconSelector}`);
  //     await softAssertion(
  //       dashboard.locator(`:nth-match(${layerSelector}, 1) ${elementIconSelector} [id="Icons/Eye"]`),
  //     ).toBeVisible();
  //     await softAssertion(dashboard.locator(`:nth-match(${headerIconSelector}, 1)`)).toBeEnabled();
  //     await softAssertion(dashboard.locator(`:nth-match(${headerIconSelector}, 2)`)).toBeDisabled();
  //   });
  //   await test.step("Press tổ hợp phím Ctrl(⌘) + Z", async () => {
  //     await dashboard.keyboard.press(`${ctrlOrMetaKey}+Z`);
  //     await softAssertion(
  //       dashboard.locator(`:nth-match(${layerSelector}, 1) ${elementIconSelector} [id="Icons/Eye-Cross"]`),
  //     ).toBeVisible();
  //     await softAssertion(dashboard.locator(`:nth-match(${headerIconSelector}, 1)`)).toBeDisabled();
  //     await softAssertion(dashboard.locator(`:nth-match(${headerIconSelector}, 2)`)).toBeEnabled();
  //   });
  //   await test.step("Press tổ hợp phím Ctrl(⌘) + Shift + Z", async () => {
  //     await dashboard.keyboard.press(`${ctrlOrMetaKey}+Shift+Z`);
  //     await softAssertion(
  //       dashboard.locator(`:nth-match(${layerSelector}, 1) ${elementIconSelector} [id="Icons/Eye"]`),
  //     ).toBeVisible();
  //     await softAssertion(dashboard.locator(`:nth-match(${headerIconSelector}, 1)`)).toBeEnabled();
  //     await softAssertion(dashboard.locator(`:nth-match(${headerIconSelector}, 2)`)).toBeDisabled();
  //   });
  //   await test.step("Nhấn save button, reload trang", async () => {
  //     await block.clickSave();
  //     await dashboard.reload();
  //     await block.loadingScreen.waitFor();
  //     await block.reloadIfNotShow("web builder");
  //     await softAssertion(dashboard.locator(`:nth-match(${headerIconSelector}, 1)`)).toBeDisabled();
  //     await softAssertion(dashboard.locator(`:nth-match(${headerIconSelector}, 2)`)).toBeDisabled();
  //   });
  // });

  test("Undo/Redo_Check hiển thị button Undo khi có thay đổi settings @SB_WEB_BUILDER_NAV_UNRE_2", async ({ conf }) => {
    const expectedMessage = conf.caseConf.expected_message;
    const removedLayer = webBuilder.genLoc(webBuilder.getXpathByText("Single column"));
    const undoBtn = webBuilder.genLoc(XpathNavigationButtons.undo);
    const redoBtn = webBuilder.genLoc(XpathNavigationButtons.redo);

    await test.step("Pre-condition: Add section", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_section);
      await webBuilder.changeContent(conf.caseConf.change_name);
      await webBuilder.backBtn.click();
    });
    await test.step("Remove a block", async () => {
      await webBuilder.removeLayer(conf.caseConf.remove_layer);
    });

    await test.step("Verify Undo/Redo button", async () => {
      await expect(undoBtn).toBeEnabled();
      await expect(redoBtn).toBeDisabled();
    });

    await test.step("Click undo", async () => {
      await undoBtn.click();
    });

    await test.step("Verify undo success", async () => {
      await expect(removedLayer).toBeVisible();
    });

    await test.step("Verify Undo/Redo button", async () => {
      await expect(undoBtn).toBeEnabled();
      await expect(redoBtn).toBeEnabled();
    });

    await test.step("Click redo", async () => {
      await redoBtn.click();
    });

    await test.step("Verify undo success", async () => {
      await expect(removedLayer).toBeHidden();
    });

    await test.step("Verify Undo/Redo button", async () => {
      await expect(undoBtn).toBeEnabled();
      await expect(redoBtn).toBeDisabled();
    });

    await test.step("Click save", async () => {
      await webBuilder.clickBtnNavigationBar("save");
    });

    await test.step("Verify save successfully", async () => {
      await expect(webBuilder.headerMessage()).toContainText(expectedMessage.saved);
    });
  });
});
