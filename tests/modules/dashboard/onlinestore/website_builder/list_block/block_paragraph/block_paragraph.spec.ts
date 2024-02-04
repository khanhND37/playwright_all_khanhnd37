import { snapshotDir, verifyRedirectUrl } from "@core/utils/theme";
import { expect, test } from "@fixtures/website_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { Locator, Page } from "@playwright/test";
import { BlocksSF } from "@pages/shopbase_creator/storefront/product_detail/blocks";
import { PageSettingsData } from "@types";

test.describe("Check Paragraph block", () => {
  let blocks: Blocks,
    handle: string,
    textEditor: Locator,
    themeSetting: number,
    settingsData: PageSettingsData,
    collapseLayer,
    openLayer;

  async function openQuickBarSetting(sectionName: string, blockName: string, blockIndex: number) {
    await blocks.expandCollapseLayer({
      sectionName: sectionName,
      isExpand: true,
    });
    await blocks.openLayerSettings({
      sectionName: sectionName,
      subLayerName: blockName,
      subLayerIndex: blockIndex,
    });
  }

  test.beforeEach(async ({ conf, dashboard, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    textEditor = blocks.frameLocator.locator("[contenteditable=true]");
    themeSetting = conf.suiteConf.themes_setting;
    collapseLayer = conf.suiteConf.collapse_layer;
    openLayer = conf.suiteConf.open_layer;

    await test.step("Open web builder", async () => {
      await blocks.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await blocks.loadingScreen.waitFor();
      await blocks.page.waitForLoadState("networkidle");
    });

    await test.step("Add block toggle list for section", async () => {
      await blocks.expandCollapseLayer(collapseLayer);
      await blocks.openLayerSettings(openLayer);
      await blocks.genLoc(blocks.btnDeleteInSidebar).click();
      await blocks.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        template: "Paragraph",
      });
      await blocks.clickOnBtnWithLabel("Save");
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step(`get data setting web`, async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.themes_setting);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.afterEach(async ({ conf, builder }) => {
    await builder.updateSiteBuilder(conf.suiteConf.themes_setting, settingsData);
  });

  test("@SB_WEB_BUILDER_BP_01 - Check setting mặc định khi add block Paragraph", async ({
    conf,
    context,
    cConf,
    snapshotFixture,
  }) => {
    const expected = cConf.expected;
    const addParagraphBlock = conf.suiteConf.theme_data.block;
    await test.step("Check add block paragraph position = Auto", async () => {
      await blocks.backBtn.click();
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await expect(blocks.getQuickSettingsTextBtn("color").locator("span")).toHaveAttribute(
        expected.default_color.attribute,
        new RegExp(expected.default_color.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("font")).toHaveText(expected.default_font_style);
      await expect(blocks.getQuickSettingsTextBtn("tag")).toHaveText(expected.default_tag);
    });

    await test.step("Check add block paragraph position outside row, column", async () => {
      const addManualBlock = Object.assign(addParagraphBlock, {
        async callBack({ page, x, y }) {
          await page.mouse.move(x, y * 0.9);
        },
      });
      await blocks.dragAndDropInWebBuilder(addManualBlock);
    });

    await test.step("Check block PARAGRAPH on Preview", async () => {
      await blocks.clickOnBtnWithLabel("Save");
      await blocks.page.waitForSelector("text='All changes are saved'");
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await blocks.page.click(blocks.xpathButtonPreview),
      ]);
      await sfTab.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTab,
        selector: ".main",
        snapshotName: expected.snapshot_default_paragraph,
      });
    });
  });

  test("@SB_WEB_BUILDER_BP_02 - Check hiển thị khi input text vào block Paragraph", async ({ conf, cConf }) => {
    const blockParagraph = blocks.getSelectorByIndex(cConf.block_paragraph);
    const copyBlock = blocks.getSelectorByIndex(cConf.sp_block);
    const expected = cConf.expected;
    const addParagraphBlock = conf.suiteConf.theme_data.block;

    await test.step("Pre-condition: add new section", async () => {
      await blocks.dragAndDropInWebBuilder(conf.suiteConf.add_section);
      await blocks.switchToTab("Content");
      await blocks.changeContent(conf.suiteConf.section_name);
    });

    await test.step("Pre-condition: add paragraph block & copy block", async () => {
      await blocks.dragAndDropInWebBuilder(addParagraphBlock);
      await blocks.dragAndDropInWebBuilder(cConf.add_paragraph);
      await blocks.backBtn.click();
      //edit copy block
      await openQuickBarSetting(conf.suiteConf.section_name.content, "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.page.keyboard.type(cConf.first_line);
      await blocks.page.keyboard.press("Enter");
      await blocks.page.keyboard.type(cConf.second_line);
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.editQuickSettingsText(cConf.edit_text);
    });

    await test.step("Input text in text box directly", async () => {
      await blocks.backBtn.click();
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.page.keyboard.type(conf.caseConf.input_content);
    });

    await test.step("Verify block Paragraph style", async () => {
      await blocks.backBtn.click();
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await expect(blocks.getQuickSettingsTextBtn("font")).toHaveText(expected.default_font_style);
      await expect(blocks.getQuickSettingsTextBtn("color").locator("span")).toHaveAttribute(
        expected.default_color.attribute,
        new RegExp(expected.default_color.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("bullet")).not.toHaveAttribute(
        expected.style.attribute,
        new RegExp(expected.style.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("tag")).toHaveText(expected.default_tag);
      await blocks.backBtn.click();
      await expect(blocks.frameLocator.locator(blockParagraph)).toHaveText(cConf.input_content);
    });

    await test.step("Copy and paste bullet blue text to block Heading", async () => {
      await blocks.copyTextFromBlock(copyBlock);
      await blocks.pasteTextToBlock(blockParagraph);
    });

    await test.step("Verify font style, color and bullet list", async () => {
      await expect(blocks.getQuickSettingsTextBtn("font")).toHaveText(conf.caseConf.edit_text.font_style);
      await expect(blocks.getQuickSettingsTextBtn("color").locator("span")).toHaveAttribute(
        expected.copy_color.attribute,
        new RegExp(expected.copy_color.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("bullet")).toHaveAttribute(
        expected.style.attribute,
        new RegExp(expected.style.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("tag")).toHaveText(expected.copy_tag);
    });
  });

  test("@SB_WEB_BUILDER_BP_03 - Check hiển thị định vị con trỏ vào text khi thực hiện click vào block", async ({
    cConf,
  }) => {
    const expected = cConf.expected;
    const blockParagraph = blocks.getSelectorByIndex(cConf.block_position);

    await test.step("Click on block Paragarph", async () => {
      await blocks.clickOnElement(blockParagraph, blocks.iframe);
    });

    await test.step("Verify block in sidebar and preview", async () => {
      await expect(blocks.genLoc(blocks.layerDetailLoc)).toBeVisible();
      await expect(blocks.frameLocator.locator(blocks.quickSettingsBlock)).toBeVisible();
      await expect(blocks.frameLocator.locator(blockParagraph)).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
    });

    await test.step("Double click to block Paragarph", async () => {
      await blocks.frameLocator.locator(blockParagraph).dblclick();
    });

    await test.step("Verify open content editable block", async () => {
      await expect(blocks.quickSettingsText).toBeVisible();
    });
  });

  test("@SB_WEB_BUILDER_BP_04 - Check hiển thị khi thực hiện bôi đen vùng text", async ({ cConf }) => {
    const expected = cConf.expected;
    const blockParagraph = blocks.getSelectorByIndex(cConf.block_position);
    await test.step("Pre-condition: Setup Paragraph block", async () => {
      await blocks.changeDesign(cConf.paragraph_design);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.page.keyboard.type(cConf.paragraph_text);
      await blocks.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
    });

    await test.step("Click once on text", async () => {
      await blocks.clickOnElement(blockParagraph, blocks.iframe);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.clickOnElement(blockParagraph, blocks.iframe);
    });

    await test.step("Verify nothing is selected", async () => {
      const selection = await blocks.getHighlightedText(textEditor, cConf.paragraph_text);
      expect(selection).toEqual(expected.no_highlight);
    });

    await test.step("Double click on the first letter", async () => {
      await blocks.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
      await blocks.clickToBlackedText({ selector: blockParagraph, index: cConf.first_letter_index });
    });

    await test.step("Verify the first word is selected", async () => {
      const highlightedText = await blocks.getHighlightedText(textEditor, cConf.paragraph_text);
      expect(highlightedText).toEqual(expected.highlight_first_word);
    });

    await test.step("Double click on the middle letter", async () => {
      await blocks.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
      await blocks.clickToBlackedText({ selector: blockParagraph, index: cConf.letter_u_index });
    });

    await test.step("Verify the first word is selected", async () => {
      const highlightedText = await blocks.getHighlightedText(textEditor, cConf.paragraph_text);
      expect(highlightedText).toEqual(expected.highlight_first_word);
    });

    await test.step("Double click on the end letter of first word", async () => {
      await blocks.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
      await blocks.clickToBlackedText({ selector: blockParagraph, index: cConf.behind_letter_r });
    });

    await test.step("Verify the space is selected", async () => {
      const highlightedText = await blocks.getHighlightedText(textEditor, cConf.paragraph_text);
      expect(highlightedText).toEqual(expected.highlight_space);
    });
    await test.step("Triple click on the last letter", async () => {
      await blocks.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
      await blocks.clickToBlackedText({
        selector: blockParagraph,
        index: cConf.last_letter_index,
        triple: true,
      });
    });

    await test.step("Verify the whole string is selected", async () => {
      const highlightedText = await blocks.getHighlightedText(textEditor, cConf.paragraph_text);
      expect(highlightedText).toEqual(expected.highlight_all);
    });
  });

  test("@SB_WEB_BUILDER_BP_05 - Check font style của block Paragraph", async ({ cConf }) => {
    await test.step("Pre-condition: Add Paragraph block", async () => {
      await blocks.selectOptionOnQuickBar("Edit text");
    });

    for (const data of cConf.edit_fonts) {
      await test.step(`Edit font style of Paragraph block to ${data.edit_font.font_style}`, async () => {
        await blocks.editQuickSettingsText(data.edit_font);
      });

      await test.step("Verify tag after changed font style", async () => {
        await expect(blocks.getQuickSettingsTextBtn("tag")).toHaveText(data.expected_tag);
      });
    }

    await test.step("Change to website styles and select block again", async () => {
      await blocks.switchTabWebPageStyle("Web");
      await blocks.selectOptionOnQuickBar("Edit text");
    });

    for (const data of cConf.edit_fonts) {
      await test.step(`Edit font style of Paragraph block to ${data.edit_font.font_style}`, async () => {
        await blocks.editQuickSettingsText(data.edit_font);
      });

      await test.step("Verify tag after changed font style", async () => {
        await expect(blocks.getQuickSettingsTextBtn("tag")).toHaveText(data.expected_tag);
      });
    }
  });

  test("@SB_WEB_BUILDER_BP_06 - Check setting text decorations của block Paragraph ", async ({ conf, cConf }) => {
    const expected = cConf.expected;
    const blockParagraph = blocks.getSelectorByIndex(cConf.block_position);

    await test.step("Click block and Edit text", async () => {
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.page.keyboard.type(cConf.paragraph_text);
      await blocks.editQuickSettingsText(cConf.edit_font_style);
    });

    await test.step("Verify text decorations are visible", async () => {
      await expect(blocks.getQuickSettingsTextBtn("bold")).toBeVisible();
      await expect(blocks.getQuickSettingsTextBtn("bold")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("italic")).toBeVisible();
      await expect(blocks.getQuickSettingsTextBtn("italic")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("underline")).toBeVisible();
      await expect(blocks.getQuickSettingsTextBtn("underline")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("strike")).toBeVisible();
      await expect(blocks.getQuickSettingsTextBtn("strike")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await blocks.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
    });

    await test.step("Select text and apply Bold", async () => {
      await blocks.blackedTextInBlock({
        block: blockParagraph,
        text: cConf.bold_text,
      });
      await blocks.editQuickSettingsText(cConf.bold_on);
    });

    await test.step("Verify text has bold decoration", async () => {
      const boldEle = blocks.frameLocator.locator("[component=paragraph] strong");
      await expect(blocks.getQuickSettingsTextBtn("bold")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await blocks.titleBar.click();
      await expect(boldEle).toHaveText(cConf.bold_text);
    });

    await test.step("Select text and apply italic", async () => {
      await blocks.backBtn.click();
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.blackedTextInBlock({
        block: blockParagraph,
        text: cConf.italic_text,
      });
      await blocks.editQuickSettingsText(cConf.italic_on);
    });

    await test.step("Verify text has italic decoration", async () => {
      const italicEle = blocks.frameLocator.locator("[component=paragraph] em");
      await expect(blocks.getQuickSettingsTextBtn("italic")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await blocks.titleBar.click();
      await expect(italicEle).toHaveText(cConf.italic_text);
    });

    await test.step("Select text and apply underline", async () => {
      await blocks.backBtn.click();
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.blackedTextInBlock({
        block: blockParagraph,
        text: cConf.underline_text,
      });
      await blocks.editQuickSettingsText(cConf.underline_on);
    });

    await test.step("Verify text has underline decoration", async () => {
      const underlineEle = blocks.frameLocator.locator("[component=paragraph] u");
      await expect(blocks.getQuickSettingsTextBtn("underline")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await blocks.titleBar.click();
      await expect(underlineEle).toHaveText(conf.caseConf.underline_text);
    });

    await test.step("Select text and apply strike", async () => {
      await blocks.backBtn.click();
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.blackedTextInBlock({
        block: blockParagraph,
        text: cConf.strike_text,
      });
      await blocks.editQuickSettingsText(cConf.strike_on);
    });

    await test.step("Verify text has strike decoration", async () => {
      const strikeEle = blocks.frameLocator.locator("[component=paragraph] s");
      await expect(blocks.getQuickSettingsTextBtn("strike")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await blocks.titleBar.click();
      await expect(strikeEle).toHaveText(conf.caseConf.strike_text);
    });

    await test.step("Select text and apply Bold + Italic + Underline + Strike", async () => {
      await blocks.backBtn.click();
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.blackedTextInBlock({
        block: blockParagraph,
        text: cConf.combine_text,
      });
      await blocks.editQuickSettingsText(cConf.all_decor);
    });

    await test.step("Verify text has Bold + Italic + Underline + Strike decoration", async () => {
      const combineEle = blocks.frameLocator.locator("[component=paragraph] strong>em>u>s");
      await expect(blocks.getQuickSettingsTextBtn("bold")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("italic")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("underline")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(blocks.getQuickSettingsTextBtn("strike")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await blocks.titleBar.click();
      await expect(combineEle).toHaveText(cConf.combine_text);
    });
  });

  test("@SB_WEB_BUILDER_BP_07 - Check setting color của block Paragraph", async ({ conf, cConf }) => {
    const expected = cConf.expected;
    const firstSection = blocks.getSelectorByIndex({ section: 1 });
    const blockParagraph = blocks.getSelectorByIndex(cConf.block_position);
    await test.step("Pre-condition: Add Paragraph block", async () => {
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.page.keyboard.type(cConf.paragraph_text_1);
      await blocks.page.keyboard.press("Enter");
      await blocks.page.keyboard.type(cConf.paragraph_text_2);
      await blocks.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
    });

    await test.step("Click on block Paragraph", async () => {
      await openQuickBarSetting("Section", "Paragraph", 1);
    });

    await test.step("Verify block has the exact color presets", async () => {
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.getQuickSettingsTextBtn("color").locator("span").click();
      await blocks.switchTabWebPageStyle("Page");
      await blocks.pageStylesColors.click();
      for (const data of cConf.color_presets) {
        await blocks.colorPresetBtn(data.preset).click();
        const pageStylePresetHex = await blocks.colorInputField.inputValue();
        const expectedPresetColor = blocks.convertHexToRGB(pageStylePresetHex);
        const actualPresetColor = await blocks.pageStyleCss.evaluate(
          (node, preset) => getComputedStyle(node).getPropertyValue(`--color-${preset}`),
          data.preset,
        );
        expect(expectedPresetColor).toEqual(actualPresetColor.trim());
      }
    });

    await test.step("Select text Your Creative and pick color preset 2", async () => {
      await blocks.clickOnElement(firstSection, blocks.iframe);
      await blocks.blackedTextInBlock({
        block: blockParagraph,
        text: cConf.select_text_line_1,
      });
      await blocks.editQuickSettingsText(cConf.edit_color);
      await blocks.backBtn.click();
    });

    await test.step("Verify color of text changed", async () => {
      const textColorEle = blocks.frameLocator.locator("[component=paragraph] span");
      await expect(textColorEle).toHaveText(conf.caseConf.select_text_line_1);
      await expect(textColorEle).toHaveAttribute("style", new RegExp(expected.text_color));
    });
  });

  test("@SB_WEB_BUILDER_BP_08 - Check hiển thị block Paragraph khi setting text align", async ({ cConf }) => {
    const expected = cConf.expected;
    await test.step("Pre-condition: Add Paragraph block", async () => {
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.page.keyboard.type(cConf.paragraph_line_1);
      await blocks.page.keyboard.press("Enter");
      await blocks.page.keyboard.type(cConf.paragraph_line_2);
      await blocks.backBtn.click();
    });

    await test.step("Verify default align", async () => {
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await expect(blocks.getAlignOption("left")).toHaveAttribute(expected.attribute, new RegExp(expected.value));
    });

    await test.step("Change align of line 1", async () => {
      await blocks.editQuickSettingsText(cConf.edit_align_center);
    });

    await test.step("Verify text is aligned center and icon align changed to center", async () => {
      await expect(blocks.getAlignOption("center")).toHaveAttribute(expected.attribute, new RegExp(expected.value));
    });

    await test.step("Change align of line 2", async () => {
      await blocks.page.keyboard.press("ArrowDown");
      await blocks.page.keyboard.press("ArrowDown");
      await blocks.editQuickSettingsText(cConf.edit_align_right);
    });

    await test.step("Verify text is aligned center and icon align changed to center", async () => {
      await expect(blocks.getAlignOption("right")).toHaveAttribute(expected.attribute, new RegExp(expected.value));
      await blocks.backBtn.click();
    });

    await test.step("Verify line 1 and line 2 have different align", async () => {
      const line1 = blocks.frameLocator.getByRole("paragraph").filter({ hasText: cConf.paragraph_line_1 });
      const line2 = blocks.frameLocator.getByRole("paragraph").filter({ hasText: cConf.paragraph_line_2 });
      await expect(line1).toHaveAttribute("style", expected.align_center);
      await expect(line2).toHaveAttribute("style", expected.align_right);
    });
  });

  test("@SB_WEB_BUILDER_BP_09 - Check hiển thị block Paragraph khi setting Hyperlink", async ({
    context,
    conf,
    cConf,
  }) => {
    const expected = cConf.expected;
    const newSection = blocks.getSelectorByIndex(conf.caseConf.section_position);
    await test.step("Pre-condition: Add Paragraph block", async () => {
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.page.keyboard.type(cConf.paragraph_text);
      await blocks.backBtn.click();
    });

    await test.step("Add hyperlink for text: Your Creative", async () => {
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.editQuickSettingsText(cConf.insert_hyperlink);
    });

    await test.step("Verify insert hyperlink success in web builder and store front", async () => {
      await expect(blocks.getQuickSettingsTextBtn("hyperlink")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await blocks.clickOnElement(newSection, blocks.iframe);
      await blocks.backBtn.click();

      //verify on SF
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        snapshotName: "",
        isNextStep: true,
      });

      await expect(
        newTab.locator("a[target=_blank]").filter({ hasText: cConf.remove_hyperlink.hyperlink.text }),
      ).toBeVisible();
      await verifyRedirectUrl({
        page: newTab,
        selector: "a[target=_blank]",
        context,
        redirectUrl: cConf.insert_hyperlink.hyperlink.url,
      });
      await newTab.close();
    });

    await test.step("Remove hyperlink", async () => {
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.editQuickSettingsText(cConf.remove_hyperlink);
    });

    await test.step("Verify insert hyperlink success in web builder and store front", async () => {
      await expect(blocks.getQuickSettingsTextBtn("hyperlink")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await blocks.backBtn.click();
      await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: cConf.expected.saved,
        onlyClickSave: true,
      });
      await expect(blocks.hyperlinkText(cConf.remove_hyperlink.hyperlink.text)).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_BP_10 - Check hiển thị block Paragraph khi setting auto listing", async ({ conf }) => {
    const expected = conf.caseConf.expected;
    await test.step("Edit text of block Paragraph", async () => {
      await test.step("Pre-condition: Add Paragraph block", async () => {
        await blocks.selectOptionOnQuickBar("Edit text");
        await blocks.page.keyboard.press("Control+KeyA");
      });
    });
    await test.step("Click Bullet list", async () => {
      await blocks.getQuickSettingsTextBtn("bullet").click();
    });

    await test.step("Verify bullet list display", async () => {
      const bulletFirstLine = blocks.frameLocator.locator("[component=paragraph] ul>li");
      await expect(blocks.getQuickSettingsTextBtn("bullet")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(bulletFirstLine).toBeVisible();
    });

    await test.step("Enter and type text in line 2", async () => {
      await blocks.page.keyboard.press("End");
      await blocks.page.keyboard.press("Enter");
      await blocks.page.keyboard.type(conf.caseConf.edit_more);
      await blocks.page.keyboard.press("Control+KeyA", { delay: 200 });
      await blocks.backBtn.click();
    });

    await test.step("Verify bullet list display when enter down line", async () => {
      const bulletSecondLine = blocks.frameLocator.locator(":nth-match([component=paragraph] ul>li, 2)");
      await expect(bulletSecondLine).toBeVisible();
    });

    await test.step("Click highlighted bullet list icon in quickbar", async () => {
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("ArrowDown");
      await blocks.page.keyboard.press("End");
      await blocks.page.keyboard.press("Enter");
      await blocks.getQuickSettingsTextBtn("bullet").click();
      await blocks.page.keyboard.type(conf.caseConf.no_bullet_text);
      await blocks.page.keyboard.press("Control+KeyA", { delay: 200 });
    });

    await test.step("Verify bullet list is off", async () => {
      await expect(blocks.getQuickSettingsTextBtn("bullet")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await blocks.backBtn.click();
      const bullet = blocks.frameLocator.locator(
        `[component=paragraph] ul>li>.p2:text-is("${conf.caseConf.no_bullet_text}")`,
      );
      await expect(bullet).toBeHidden();
    });

    await test.step("Click Order list button", async () => {
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.getQuickSettingsTextBtn("number").click();
      await blocks.page.keyboard.press("Control+KeyA", { delay: 200 });
      await blocks.page.keyboard.type(conf.caseConf.order_text_line_1);
    });

    await test.step("Verify line begin with ordered number start with 1", async () => {
      const orderedNumber = blocks.frameLocator.locator("[component=paragraph] ol");
      await blocks.backBtn.click();
      await expect(orderedNumber).toBeVisible();
    });

    await test.step("Enter down line", async () => {
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("End");
      await blocks.page.keyboard.press("Enter");
      await blocks.page.keyboard.type(conf.caseConf.order_text_line_2);
      await blocks.page.keyboard.press("Control+KeyA", { delay: 200 });
    });

    await test.step("Verify ordered number display when entered down line", async () => {
      await blocks.backBtn.click();
      const orderedNumberLine2 = blocks.frameLocator.locator(":nth-match([component=paragraph] ol>li, 2)");
      await expect(orderedNumberLine2).toBeVisible();
    });

    await test.step("Click highlighted ordered list icon in quickbar", async () => {
      await openQuickBarSetting("Section", "Paragraph", 1);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("ArrowDown");
      await blocks.page.keyboard.press("End");
      await blocks.page.keyboard.press("Enter");
      await blocks.getQuickSettingsTextBtn("number").click();
      await blocks.page.keyboard.type(conf.caseConf.no_order_text);
      await blocks.page.keyboard.press("Control+KeyA", { delay: 200 });
    });

    await test.step("Verify ordered list is off", async () => {
      const orderedNumber = blocks.frameLocator.locator(
        `[component=paragraph] ol>li>.h1:text-is("${conf.caseConf.no_order_text}")`,
      );
      await expect(blocks.getQuickSettingsTextBtn("number")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await blocks.backBtn.click();
      await expect(orderedNumber).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_BP_11 - Check hiển thị block Paragraph khi setting tag", async ({ conf }) => {
    const blockParagraph = blocks.getSelectorByIndex(conf.caseConf.block_position);
    const addParagraphBlock = conf.suiteConf.theme_data.block;
    await test.step("Pre-condition: add block Paragraph", async () => {
      await blocks.dragAndDropInWebBuilder(addParagraphBlock);
      await blocks.backBtn.click();
      await expect(blocks.frameLocator.locator(blockParagraph)).not.toHaveAttribute("class", /selected/);
      await blocks.clickOnElement(blockParagraph, blocks.iframe);
      await blocks.selectOptionOnQuickBar("Edit text");
    });

    for (const data of conf.caseConf.edit_tags) {
      await test.step("Edit tag of block Paragraph", async () => {
        await blocks.editQuickSettingsText(data);
      });

      await test.step("Verify current tag on quickbar and HTML", async () => {
        const selectedTag = blocks.getQuickSettingsTextBtn("tag").locator("span.align-center");
        const newTextStyle = blocks.frameLocator.locator(`${blockParagraph}//${data.tag_element}[not(@style)]`);
        await expect(selectedTag).toHaveText(data.expected_text);
        await expect(newTextStyle).toBeVisible();
      });
    }
  });

  test("@SB_WEB_BUILDER_BP_12 - Check line-height của text trong block Paragraph khi thay đổi fontsize", async ({
    conf,
  }) => {
    const addParagraphBlock = conf.suiteConf.theme_data.block;
    const blockParagraph = blocks.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: add block Paragraph", async () => {
      await blocks.dragAndDropInWebBuilder(addParagraphBlock);
      await blocks.backBtn.click();
      await expect(blocks.frameLocator.locator(blockParagraph)).not.toHaveAttribute("class", /selected/);
      await blocks.clickOnElement(blockParagraph, blocks.iframe);
      await blocks.selectOptionOnQuickBar("Edit text");
    });

    for (const data of conf.caseConf.line_height) {
      await test.step(`Select font ${data.font_style}`, async () => {
        await blocks.editQuickSettingsText(data);
      });

      await test.step(`Verify line-height and tag of ${data.font_style}`, async () => {
        const actualLineHeight = await blocks.pageStyleCss.evaluate((ele, font) => {
          const lineHeight = getComputedStyle(ele).getPropertyValue(font);
          return parseFloat(lineHeight);
        }, data.css_value);
        expect(actualLineHeight).toEqual(data.expected.line_height);
        await expect(blocks.getQuickSettingsTextBtn("tag")).toHaveText(data.expected.tag);
      });
    }
  });

  test("@SB_WEB_BUILDER_BP_13 - Check hiển thị paragraph spacing ở block Paragraph", async ({ conf }) => {
    const addParagraphBlock = conf.suiteConf.theme_data.block;
    const blockParagraph = blocks.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: add block Paragraph", async () => {
      await blocks.dragAndDropInWebBuilder(addParagraphBlock);
      await blocks.backBtn.click();
      await expect(blocks.frameLocator.locator(blockParagraph)).not.toHaveAttribute("class", /selected/);
      await blocks.clickOnElement(blockParagraph, blocks.iframe);
      await blocks.selectOptionOnQuickBar("Edit text");
      await blocks.page.keyboard.press("Control+KeyA");
      await blocks.page.keyboard.type(conf.caseConf.para_line_1);
      await blocks.page.keyboard.press("Enter");
      await blocks.page.keyboard.type(conf.caseConf.para_line_2);
    });

    for (const data of conf.caseConf.edit_fonts) {
      await test.step(`Change to ${data.font_style} font style of block`, async () => {
        await blocks.page.keyboard.press("Control+KeyA");
        await blocks.editQuickSettingsText(data);
      });

      await test.step(`Verify paragraph spacing of ${data.font_style}`, async () => {
        const paragraphLine2 = textEditor.locator("p").filter({ hasText: conf.caseConf.para_line_2 });
        await expect(paragraphLine2).toHaveCSS("margin-top", data.expected_spacing);
      });
    }
  });

  test("@SB_WEB_BUILDER_LB_BP_01 - Check width height block paragraph", async ({ context, conf }) => {
    const blockParagraph = blocks.getSelectorByIndex(conf.caseConf.block_position);

    for (const data of conf.caseConf.width_height) {
      await test.step("Edit width height of block Paragraph", async () => {
        await blocks.changeDesign(data.edit_width_height);
      });

      await test.step("Verify preview width height are changed correct", async () => {
        await expect(blocks.frameLocator.locator(blockParagraph)).toHaveAttribute(
          data.expected.attribute,
          new RegExp(data.expected.value),
        );
      });

      const expectedBox = await blocks.frameLocator.locator(blockParagraph).boundingBox();

      await test.step("Verify block size in storefront", async () => {
        await blocks.clickOnBtnWithLabel("Save");
        await blocks.page.waitForSelector("text='All changes are saved'");
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await blocks.page.click(blocks.xpathButtonPreview),
        ]);
        await sfTab.waitForLoadState("networkidle");
        const sfPreview = new BlocksSF(sfTab, conf.suiteConf.domain);

        const blockParagraph = sfTab.locator("[component=paragraph]").first();
        const textContent = sfPreview.getTextBlockLoc(conf.caseConf.default_text, conf.caseConf.block_tag);
        const actualBox = await blockParagraph.boundingBox();
        await expect(textContent).toBeVisible();
        expect(Math.round(actualBox.width)).toEqual(Math.round(expectedBox.width));
        expect(Math.round(actualBox.height)).toEqual(Math.round(expectedBox.height));
        await sfPreview.page.close();
      });
    }
  });

  test("@SB_WEB_BUILDER_LB_BP_02 - Check background, border, opacity, radius, shadow, padding, margin block paragraph", async ({
    conf,
  }) => {
    test.slow();
    const addParagraphBlock = conf.suiteConf.theme_data.block;
    const blockParagraph = blocks.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: add block Paragraph", async () => {
      await blocks.dragAndDropInWebBuilder(addParagraphBlock);
    });

    for (const data of conf.caseConf.styles) {
      await test.step("Edit style of block", async () => {
        await blocks.changeDesign(data.edit_style);
      });

      await test.step("Verify block in preview", async () => {
        await expect
          .soft(blocks.frameLocator.locator(`${blockParagraph}//section`))
          .toHaveCSS("background", new RegExp(data.expected.background_value));
        await expect
          .soft(blocks.frameLocator.locator(`${blockParagraph}//section`))
          .toHaveCSS("border", data.expected.border_value);
        await expect
          .soft(blocks.frameLocator.locator(`${blockParagraph}//section`))
          .toHaveCSS("opacity", data.expected.opacity_value);
        await expect
          .soft(blocks.frameLocator.locator(`${blockParagraph}//section`))
          .toHaveCSS("border-radius", data.expected.radius_value);
        await expect
          .soft(blocks.frameLocator.locator(`${blockParagraph}//section`))
          .toHaveCSS("box-shadow", data.expected.shadow_value);
        await expect
          .soft(blocks.frameLocator.locator(`${blockParagraph}//section`))
          .toHaveCSS("padding", data.expected.padding_value);
        await expect.soft(blocks.frameLocator.locator(blockParagraph)).toHaveCSS("margin", data.expected.margin_value);
      });
    }
  });

  test("@SB_WEB_BUILDER_LB_BP_03 - Check remove block paragraph", async ({ context, conf }) => {
    let storeFront: Page, productSF: BlocksSF;
    const addParagraphBlock = conf.suiteConf.theme_data.block;
    await test.step("Pre-condition: add block Paragraph", async () => {
      await blocks.dragAndDropInWebBuilder(addParagraphBlock);
      await blocks.clickBtnNavigationBar("save");
      await blocks.closeToastBtn.click();
      await blocks.backBtn.click();
    });

    await test.step("Remove block in sidebar", async () => {
      await blocks.expandCollapseLayer({ sectionName: "Section", isExpand: true });
      await blocks.removeLayer({
        sectionName: "Section",
        subLayerName: conf.caseConf.remove_block,
      });
    });

    await test.step("Check preview after remove block", async () => {
      await blocks.clickBtnNavigationBar("save");
      await blocks.toastMessage.waitFor();
      await blocks.toastMessage.waitFor({ state: "hidden" });
      storeFront = await context.newPage();
      productSF = new BlocksSF(storeFront, conf.suiteConf.domain);
      await productSF.gotoProductDetail(handle);
      const previewBlock = productSF.getTextBlockLoc(conf.caseConf.default_text, conf.caseConf.block_tag);
      await expect(previewBlock).toBeHidden();
    });
  });
});
