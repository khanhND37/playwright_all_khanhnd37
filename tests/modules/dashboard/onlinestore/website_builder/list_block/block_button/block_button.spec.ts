import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";
import { expect } from "@core/fixtures";
import { SFWebBuilder } from "@sf_pages/web_builder";
import { XpathNavigationButtons } from "@constants/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { PageSettingsData } from "@types";

let block,
  webBuilderSF: SFWebBuilder,
  section,
  frameLocator,
  sectionSetting,
  tabSetting,
  listButton,
  sectionSelector,
  blockSelector,
  settingsBlock,
  storefront,
  xpathBlock: Blocks;

test.describe("Verify block button", () => {
  let settingsData: PageSettingsData;
  let blocks: Blocks;

  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    webBuilderSF = new SFWebBuilder(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);

    await test.step("Pre-condition: create product, apply blank template and open web builder", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
        settingsData = response.settings_data as PageSettingsData;
      }

      settingsData.pages["home"].default.elements = [];
      await builder.updateSiteBuilder(conf.suiteConf.theme_id, settingsData);
      await blocks.openWebBuilder({
        id: conf.suiteConf.theme_id,
        type: "site",
      });
      await blocks.reloadIfNotShow("/");
      await blocks.frameLocator.locator(blocks.xpathAddSection).click({ delay: 200 });
      await blocks.page.getByTestId("section_default").click();
    });
  });

  test("Check data default when add block button @SB_WEB_BUILDER_LB_BB_01", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    section = block = 1;
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    tabSetting = conf.caseConf.expect.tab_setting;
    listButton = conf.caseConf.expect.buttons;
    sectionSelector = xpathBlock.getSelectorByIndex({ section });
    blockSelector = xpathBlock.getSelectorByIndex({ section, block });

    await test.step("Add section and add block button for section", async () => {
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_block);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
    });

    for (const button of listButton) {
      await test.step(`Verify block button ${button.name} in sidebar + preview`, async () => {
        //In sidebar, click style of Primary or Secondary button
        const styleButton = xpathBlock.getXpathByText(button.name);
        await xpathBlock.switchToTab("Design");
        await xpathBlock.genLoc(styleButton).click();

        await frameLocator.locator(sectionSelector).scrollIntoViewIfNeeded();
        await snapshotFixture.verifyWithAutoRetry({
          page: xpathBlock.page,
          snapshotName: button.preview.snapshot,
          combineOptions: { fullPage: true },
        });

        await frameLocator.locator(blockSelector).click();
        await expect(xpathBlock.page).toHaveURL(new RegExp(button.preview.redirect));
      });

      await test.step("Save template", async () => {
        await xpathBlock.clickSaveAndVerifyPreview({
          context,
          dashboard: xpathBlock.page,
          onlyClickSave: true,
        });
      });

      await test.step("Verify block button primary in SF", async () => {
        storefront = await verifyRedirectUrl({
          page: xpathBlock.page,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        await waitForImageLoaded(storefront, xpathBlock.bodySF);

        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          snapshotName: button.storefront.snapshot,
          combineOptions: { fullPage: true },
        });

        await storefront.locator(webBuilderSF.getSelectorByIndex({ section, block })).click();
        await storefront.locator("#v-progressbar").waitFor({ state: "detached" });
        const actualUrl = storefront.url();
        expect(actualUrl).toContain(button.storefront.redirect);
        await storefront.close();
      });
    }

    await test.step("Verify data default in tab setting", async () => {
      await xpathBlock.switchToTab("Content");
      await snapshotFixture.verifyWithAutoRetry({
        page: xpathBlock.page,
        selector: xpathBlock.sidebar,
        snapshotName: tabSetting.snapshot,
      });
    });
  });

  test("Check setting button with action = Open a link @SB_WEB_BUILDER_LB_BB_06", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    section = block = 1;
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    settingsBlock = conf.caseConf.data.section_1.settings_block;
    sectionSelector = xpathBlock.getSelectorByIndex({ section });

    await test.step("Add section and add block button for section", async () => {
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_blocks);
      await xpathBlock.backBtn.click();
      await blocks.frameLocator
        .locator(".block")
        .first()
        .click({ position: { x: 5, y: 5 } });
      for (let i = 0; i < sectionSetting.dnd_blocks.duplicate; i++) {
        await xpathBlock.selectOptionOnQuickBar("Duplicate");
      }
    });

    block = 0;
    for (const setting of settingsBlock) {
      await test.step(setting.description, async () => {
        block++;
        blockSelector = xpathBlock.getSelectorByIndex({ section, block });
        await frameLocator.locator(blockSelector).click();
        await xpathBlock.switchToTab("Content");
        await xpathBlock.inputTextBox("title", setting.label);
        await xpathBlock.selectDropDown("link", setting.action);
        await xpathBlock.inputTextBox("link", setting.target_url);
        await xpathBlock.selectButtonIcon(setting.show_icon);
        if (setting.icon) {
          await xpathBlock.selectIcon("icon", setting.icon);
        }
        await xpathBlock.switchToggle("link", setting.new_tab);
      });
    }

    await test.step("Verify button setting in webfront", async () => {
      await frameLocator.locator(sectionSelector).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: xpathBlock.page,
        snapshotName: conf.caseConf.expect.preview,
        combineOptions: { fullPage: true },
      });

      for (block = 1; block <= settingsBlock.length; block++) {
        blockSelector = xpathBlock.getSelectorByIndex({ section, block });
        await frameLocator.locator(blockSelector).click();
        await expect(xpathBlock.page).toHaveURL(new RegExp("/admin/builder/site"));
      }
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify block icon + text button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        snapshotName: conf.caseConf.expect.storefront,
        combineOptions: { fullPage: true },
      });

      block = 0;
      for (const setting of settingsBlock) {
        block++;
        await test.step(`Verify redirect link when click block button ${block} in SF`, async () => {
          blockSelector = webBuilderSF.getSelectorByIndex({ section, block });
          if (setting.target_url && setting.new_tab) {
            await verifyRedirectUrl({
              page: storefront,
              context: context,
              selector: blockSelector,
              redirectUrl: setting.expect.redirect,
            });
          } else {
            await verifyRedirectUrl({
              page: storefront,
              selector: blockSelector,
              redirectUrl: setting.expect.redirect,
            });
            if (setting.target_url) {
              await storefront.goBack();
            }
          }
        });
      }
    });
  });

  test("Check setting button with action = Go to page @SB_WEB_BUILDER_LB_BB_07", async ({ conf, context }) => {
    test.slow();
    section = 1;
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    settingsBlock = sectionSetting.settings_block;

    await test.step("Add section and add block button for section", async () => {
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_blocks);
      await xpathBlock.backBtn.click();
      await blocks.frameLocator
        .locator(".block")
        .first()
        .click({ position: { x: 5, y: 5 } });
      for (let i = 0; i < sectionSetting.dnd_blocks.duplicate; i++) {
        await xpathBlock.selectOptionOnQuickBar("Duplicate");
      }
    });

    block = 0;
    await test.step("Setting block Button", async () => {
      for (const setting of settingsBlock) {
        block++;
        blockSelector = xpathBlock.getSelectorByIndex({ section, block });
        await frameLocator.locator(blockSelector).click({ position: { x: 10, y: 10 } });
        await xpathBlock.switchToTab("Content");
        await xpathBlock.inputTextBox("title", setting.label);
        await xpathBlock.selectDropDown("link", setting.action);
        await xpathBlock.selectPageInWidgetLink("link", setting.page, setting.page_option);
        await xpathBlock.switchToggle("link", setting.new_tab);
      }
    });

    await test.step("Verify redirect when click list button in webfront", async () => {
      for (block = 1; block <= settingsBlock.length; block++) {
        blockSelector = xpathBlock.getSelectorByIndex({ section, block });
        await frameLocator.locator(blockSelector).click({ position: { x: 10, y: 10 } });
        await expect(xpathBlock.page).toHaveURL(new RegExp("/admin/builder/site"));
      }
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify block button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);

      await test.step("Verify redirect page when click block button in SF", async () => {
        block = 0;
        for (const setting of settingsBlock) {
          block++;
          blockSelector = webBuilderSF.getSelectorByIndex({ section, block });
          if (setting.new_tab) {
            await verifyRedirectUrl({
              page: storefront,
              context: context,
              selector: webBuilderSF.getSelectorByIndex({ section, block }),
              redirectUrl: setting.expect.redirect,
            });
          } else {
            await verifyRedirectUrl({
              page: storefront,
              selector: webBuilderSF.getSelectorByIndex({ section, block }),
              redirectUrl: setting.expect.redirect,
            });
          }
        }
      });
    });
  });

  test(`Tab setting_Check setting button với action = Go to section @SB_WEB_BUILDER_LB_BB_08`, async ({
    context,
    conf,
  }) => {
    let storefront;
    await test.step(`Click block button`, async () => {
      await blocks.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        category: "Basics",
        template: "Button",
      });
      await blocks.backBtn.click();
      await blocks.genLoc(blocks.getSidebarSelectorByIndex({ section: 1 })).click();
      await blocks.getAddSectionBtn({ section: 1, position: "after" }).click({ delay: 200 });
      await blocks.page.getByTestId("section_default").click();
      await blocks.insertSectionBlock({
        parentPosition: { section: 2, column: 1 },
        category: "Basics",
        template: "Button",
      });
      await blocks.backBtn.click();
      await blocks.genLoc(blocks.getSidebarSelectorByIndex({ section: 2 })).click();
      await blocks.getAddSectionBtn({ section: 2, position: "after" }).click({ delay: 200 });
      await blocks.page.getByTestId("section_default").click();
      await blocks.inputTextBox("name", conf.caseConf.data.section_name);
      await blocks.insertSectionBlock({
        parentPosition: { section: 3, column: 1 },
        category: "Basics",
        template: "Form",
      });
    });

    await test.step(`Chọn tab setting trên sidebar`, async () => {
      await blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 1 })).click();
      await blocks.switchToTab("Content");
    });

    await test.step(`- Setting button trong section 1 Action = Go to section 3`, async () => {
      await blocks.selectDropDown("link", conf.caseConf.data.action);
      await blocks.selectDropDown("link", conf.caseConf.data.section_name, 2);
      await blocks.backBtn.click();
    });

    await test.step(`Click button save > click icon preview trên thanh bar`, async () => {
      storefront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        isNextStep: true,
        snapshotName: "",
      });
    });

    await test.step(`Click vào button 1`, async () => {
      await storefront.locator(blocks.buttonOnSF).click();
      await expect(storefront.locator(blocks.getSelectorByIndex({ section: 3 }))).toBeInViewport();
      await storefront.close();
    });

    await test.step(`- Trong DB:+ Xóa section 3`, async () => {
      await blocks.genLoc(blocks.getSidebarSelectorByIndex({ section: 3 })).click();
      await blocks.removeBtn.click();
    });

    await test.step(`Open sale page ở step 1 ở ngoài SF`, async () => {
      storefront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        isNextStep: true,
        snapshotName: "",
      });
    });

    await test.step(`Click vào button 1`, async () => {
      await storefront.locator(blocks.buttonOnSF).click();
      await expect(storefront.locator(blocks.getSelectorByIndex({ section: 1 }))).toBeInViewport();
    });
  });

  test("Check setting button with action = Make a call @SB_WEB_BUILDER_LB_BB_09", async ({ conf, context }) => {
    section = block = 1;
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    settingsBlock = conf.caseConf.data.section_1.settings_block;
    sectionSelector = xpathBlock.getSelectorByIndex({ section });

    await test.step("Add section and add block button for section", async () => {
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_blocks);
      await xpathBlock.backBtn.click();
      await blocks.frameLocator
        .locator(".block")
        .first()
        .click({ position: { x: 5, y: 5 } });
      for (let i = 0; i < sectionSetting.dnd_blocks.duplicate; i++) {
        await xpathBlock.selectOptionOnQuickBar("Duplicate");
      }
    });

    block = 0;
    for (const setting of settingsBlock) {
      await test.step(setting.description, async () => {
        block++;
        blockSelector = xpathBlock.getSelectorByIndex({ section, block });

        await frameLocator.locator(blockSelector).click();
        await xpathBlock.switchToTab("Content");
        await xpathBlock.inputTextBox("title", setting.label);
        await xpathBlock.selectDropDown("link", setting.action);
        await xpathBlock.genLoc(xpathBlock.getXpathByText("Phone number")).waitFor({ state: "visible" });
        await xpathBlock.inputTextBox("link", setting.number);
        await xpathBlock.genLoc(xpathBlock.getXpathByText("Phone number")).click();
      });
    }

    await test.step("Verify button setting in webfront", async () => {
      for (block = 1; block <= settingsBlock.length; block++) {
        blockSelector = xpathBlock.getSelectorByIndex({ section, block });
        await frameLocator.locator(blockSelector).click();
        await expect(xpathBlock.page).toHaveURL(new RegExp("/admin/builder/site"));
      }
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify block icon + text button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);

      await test.step("Verify redirect phone number when click block button in SF", async () => {
        block = 0;
        for (const setting of settingsBlock) {
          block++;
          blockSelector = webBuilderSF.getSelectorByIndex({ section, block });
          await expect(storefront.locator(blockSelector + "//a")).toHaveAttribute("href", `${setting.expect.href}`);
        }
      });
    });
  });

  test("Check setting button with action = Send email to @SB_WEB_BUILDER_LB_BB_10", async ({ conf, context }) => {
    test.slow();
    section = block = 1;
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    settingsBlock = conf.caseConf.data.section_1.settings_block;
    sectionSelector = xpathBlock.getSelectorByIndex({ section });

    await test.step("Add section and add block button for section", async () => {
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_blocks);
      await xpathBlock.backBtn.click();
      await blocks.frameLocator
        .locator(".block")
        .first()
        .click({ position: { x: 5, y: 5 } });
      for (let i = 0; i < sectionSetting.dnd_blocks.duplicate; i++) {
        await xpathBlock.selectOptionOnQuickBar("Duplicate");
      }
    });

    block = 0;
    for (const setting of settingsBlock) {
      await test.step(setting.description, async () => {
        block++;
        blockSelector = xpathBlock.getSelectorByIndex({ section, block });

        await frameLocator.locator(blockSelector).click();
        await xpathBlock.switchToTab("Content");
        await xpathBlock.inputTextBox("title", setting.label);
        await xpathBlock.selectDropDown("link", setting.action);
        await xpathBlock.genLoc(xpathBlock.getWidgetSelectorByLabel("Email")).waitFor({ state: "visible" });
        await xpathBlock.inputTextBox("link", setting.email);
        await xpathBlock.genLoc(xpathBlock.getWidgetSelectorByLabel("Email")).click();
      });
    }

    await test.step("Verify button setting in webfront", async () => {
      for (block = 1; block <= settingsBlock.length; block++) {
        blockSelector = xpathBlock.getSelectorByIndex({ section, block });
        await frameLocator.locator(blockSelector).click();
        await expect(xpathBlock.page).toHaveURL(new RegExp("/admin/builder/site"));
      }
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify block icon + text button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);

      await test.step("Verify redirect email when click block button in SF", async () => {
        block = 0;
        for (const setting of settingsBlock) {
          block++;
          blockSelector = webBuilderSF.getSelectorByIndex({ section, block });
          await expect(storefront.locator(blockSelector + "//a")).toHaveAttribute("href", `${setting.expect.href}`);
        }
      });
    });
  });

  test("Check setting button with action = Copy to clipboard @SB_WEB_BUILDER_LB_BB_11", async ({ conf, context }) => {
    section = block = 1;
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    settingsBlock = conf.caseConf.data.section_1.settings_block;
    sectionSelector = xpathBlock.getSelectorByIndex({ section });

    await test.step("Add section and add block button for section", async () => {
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_blocks);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_form_blocks);
      await xpathBlock.backBtn.click();
      await blocks.frameLocator
        .locator(".block")
        .first()
        .click({ position: { x: 5, y: 5 } });
      for (let i = 0; i < sectionSetting.dnd_blocks.duplicate; i++) {
        await xpathBlock.selectOptionOnQuickBar("Duplicate");
      }
    });

    block = 0;
    for (const setting of settingsBlock) {
      await test.step(setting.description, async () => {
        block++;
        blockSelector = xpathBlock.getSelectorByIndex({ section, block });

        await frameLocator.locator(blockSelector).click({ position: { x: 10, y: 10 } });
        await xpathBlock.switchToTab("Content");
        await xpathBlock.inputTextBox("title", setting.label);
        await xpathBlock.selectDropDown("link", setting.action);
        await xpathBlock.genLoc(xpathBlock["contentCopy"]).waitFor({ state: "visible" });
        await xpathBlock.inputTextBox("link", setting.content);
        await xpathBlock.genLoc(xpathBlock["contentCopy"]).click();
      });
    }

    await test.step("Verify button setting in webfront", async () => {
      for (block = 1; block <= settingsBlock.length; block++) {
        blockSelector = xpathBlock.getSelectorByIndex({ section, block });
        await frameLocator.locator(blockSelector).click({ position: { x: 10, y: 10 } });
        await expect(xpathBlock.page).toHaveURL(new RegExp("/admin/builder/site"));
      }
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify block icon + text button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);

      await test.step("Verify redirect email when click block button in SF", async () => {
        block = 0;
        for (const setting of settingsBlock) {
          block++;
          blockSelector = webBuilderSF.getSelectorByIndex({ section, block });
          await storefront.locator(blockSelector).click();
          if (setting.content) {
            // await storefront.waitForSelector("text='Copied to clipboard'");
            await storefront.focus(xpathBlock.enterEmail);
            await storefront.keyboard.press("Control+KeyV");
            await storefront.keyboard.press("Enter");
            expect(await storefront.locator(xpathBlock.enterEmail).inputValue()).toEqual(setting.expect.paste);
            await storefront.keyboard.press("Control+KeyA");
            await storefront.keyboard.press("Backspace");
          } else await expect(await storefront.locator("text='Copied to clipboard'")).toHaveCount(0);
        }
      });
    });
  });

  test("Check setting data independently in the style tab button @SB_WEB_BUILDER_LB_BB_12", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    section = block = 1;
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    settingsBlock = conf.caseConf.data.section_1.settings_block;
    sectionSelector = xpathBlock.getSelectorByIndex({ section });

    await test.step("Add section and add block button for section", async () => {
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_block);
    });

    await test.step("Setting style button in sidebar ", async () => {
      blockSelector = xpathBlock.getSelectorByIndex({ section, block });
      await frameLocator.locator(blockSelector).click();
      await xpathBlock.changeDesign(settingsBlock);
    });

    await test.step("Verify button setting in webfront", async () => {
      await frameLocator.locator(sectionSelector).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: xpathBlock.page,
        snapshotName: conf.caseConf.expect.preview,
        combineOptions: { fullPage: true },
      });
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify setting style button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        snapshotName: conf.caseConf.expect.storefront,
        combineOptions: { fullPage: true },
      });
    });
  });

  test("Check setting sync data in the style tab button @SB_WEB_BUILDER_LB_BB_13", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    section = block = 1;
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    settingsBlock = conf.caseConf.data.section_1.settings_block;
    sectionSelector = xpathBlock.getSelectorByIndex({ section });

    await test.step("Add section and add block button for section", async () => {
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_block);
    });

    await test.step("Setting style button in sidebar ", async () => {
      blockSelector = xpathBlock.getSelectorByIndex({ section, block });
      await frameLocator.locator(blockSelector).click();
      await xpathBlock.changeDesign(settingsBlock);
    });

    await test.step("Verify button setting in webfront", async () => {
      await frameLocator.locator(sectionSelector).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: xpathBlock.page,
        snapshotName: conf.caseConf.expect.preview,
        combineOptions: { fullPage: true },
      });
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify setting style button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        snapshotName: conf.caseConf.expect.storefront,
        combineOptions: { fullPage: true },
      });

      await storefront.close();
    });

    await test.step("Click link Reset all change", async () => {
      const linkReset = xpathBlock.getXpathByText("Reset all changes");
      await xpathBlock.genLoc(linkReset).click();
      await xpathBlock.page.waitForSelector(linkReset, { state: "hidden" });
    });

    await test.step("Verify button setting in webfront", async () => {
      await frameLocator.locator(sectionSelector).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: xpathBlock.page,
        snapshotName: conf.caseConf.expect.preview_reset_unlink,
        combineOptions: { fullPage: true },
      });
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify setting style button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        snapshotName: conf.caseConf.expect.storefront_reset_unlink,
        combineOptions: { fullPage: true },
      });
    });
  });

  test("Check setting sync + independently data in the style tab button @SB_WEB_BUILDER_LB_BB_14", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    section = block = 1;
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    settingsBlock = conf.caseConf.data.section_1.settings_block;
    sectionSelector = xpathBlock.getSelectorByIndex({ section });
    blockSelector = xpathBlock.getSelectorByIndex({ section, block });

    await test.step("Add section and add block button for section", async () => {
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_block);
    });

    await test.step("Setting style button primary in sidebar ", async () => {
      await frameLocator.locator(blockSelector).click();
      await xpathBlock.changeDesign(settingsBlock.primary_button);
    });

    await test.step("Verify button setting in webfront", async () => {
      await frameLocator.locator(sectionSelector).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: xpathBlock.page,
        snapshotName: conf.caseConf.expect.primary_button.preview,
        combineOptions: { fullPage: true },
      });
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify setting style button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        snapshotName: conf.caseConf.expect.primary_button.storefront,
        combineOptions: { fullPage: true },
      });

      await storefront.close();
    });

    await test.step("Click link Reset all change", async () => {
      const linkReset = xpathBlock.getXpathByText("Reset all changes");
      await xpathBlock.genLoc(linkReset).click();
      await xpathBlock.page.waitForSelector(linkReset, { state: "hidden" });
    });

    await test.step("Setting style button secondary in sidebar ", async () => {
      await frameLocator.locator(blockSelector).click();
      await xpathBlock.selectButtonGroup("Secondary");
      await xpathBlock.changeDesign(settingsBlock.secondary_button);
    });

    await test.step("Verify button secondary setting in webfront", async () => {
      await frameLocator.locator(sectionSelector).scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: xpathBlock.page,
        snapshotName: conf.caseConf.expect.secondary_button.preview,
        combineOptions: { fullPage: true },
      });
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify setting style button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        snapshotName: conf.caseConf.expect.secondary_button.storefront,
        combineOptions: { fullPage: true },
      });
    });
  });

  test("Check remove block button @SB_WEB_BUILDER_LB_BB_15", async ({ conf, context }) => {
    section = block = 1;
    frameLocator = xpathBlock.frameLocator;
    sectionSetting = conf.caseConf.data.section_1;
    sectionSelector = xpathBlock.getSelectorByIndex({ section });
    blockSelector = xpathBlock.getSelectorByIndex({ section, block });

    await test.step("Add section and add block button for section", async () => {
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await xpathBlock.dragAndDropInWebBuilder(sectionSetting.dnd_block);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
    });

    await test.step("Remove block button", async () => {
      const buttonRemove = xpathBlock.getXpathByText("Delete block");
      await xpathBlock.genLoc(buttonRemove).click();
      await expect(frameLocator.locator(xpathBlock.blockButton)).toHaveCount(conf.caseConf.expect.count);
    });

    await test.step("Save template", async () => {
      await xpathBlock.clickSaveAndVerifyPreview({
        context,
        dashboard: xpathBlock.page,
        onlyClickSave: true,
      });
    });

    await test.step("Verify remove button in SF", async () => {
      storefront = await verifyRedirectUrl({
        page: xpathBlock.page,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, xpathBlock.bodySF);
      // contains a button of section checkout
      await expect(storefront.locator(xpathBlock.blockButton)).toHaveCount(conf.caseConf.expect.count);
    });
  });
});
