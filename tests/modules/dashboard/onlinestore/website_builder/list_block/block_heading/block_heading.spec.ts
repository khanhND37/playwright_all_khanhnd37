import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { BlocksSF } from "@pages/shopbase_creator/storefront/product_detail/blocks";
import { Locator, Page } from "@playwright/test";
import { snapshotDir } from "@utils/theme";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { PageSettingsData } from "@types";
const softExpect = expect.configure({ soft: true });
let webBuilder: WebBuilder, textEditor: Locator, handle: string;

test.describe("Check module block Heading  @SB_WEB_BUILDER_BH", () => {
  let settingsData: PageSettingsData;
  let blocks: Blocks;

  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    textEditor = webBuilder.frameLocator.locator("[contenteditable=true]");
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);

    await test.step("Pre-condition: Apply blank template and open web builder", async () => {
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

  test("@SB_WEB_BUILDER_BH_01 - Check setting mặc định khi add block Heading", async ({ conf }) => {
    const addBlock = conf.caseConf.add_block;
    const expected = conf.caseConf.expected;
    const defaultValue = conf.caseConf.default_value;
    const firstBlockPreview = webBuilder.getSelectorByIndex(conf.caseConf.first_block);
    const secondBlockPreview = webBuilder.getSelectorByIndex(conf.caseConf.second_block);
    const getBlockValue = (label: string, selector: string): Locator => {
      return webBuilder.genLoc(`[data-widget-id=${label}] ${selector}`);
    };
    const align = getBlockValue("align_self", "[class*=container]");
    const widthUnit = getBlockValue("width", "button");
    const widthValue = getBlockValue("width", "input");
    const heightUnit = getBlockValue("height", "button");
    const heightValue = getBlockValue("height", "input");
    const background = getBlockValue("background", "span[class*=chip]");
    const borderValue = getBlockValue("border", "button[class*=select]");
    const opacity = getBlockValue("opacity", "[class*=inner-append]");
    const radius = getBlockValue("border_radius", "[class*=inner-append]");
    const shadow = getBlockValue("box_shadow", "button");
    const padding = getBlockValue("padding", "[type=text]");
    const margin = getBlockValue("margin", "[type=text]");
    await test.step("Insert Heading block by clicking Add block button", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
    });

    await test.step("Verify block Heading style sidebar", async () => {
      await softExpect(align).toHaveAttribute("value", defaultValue.align);
      await softExpect(widthUnit).toHaveText(defaultValue.width_unit);
      await softExpect(widthValue).toHaveValue(defaultValue.width_value);
      await softExpect(heightUnit).toHaveText(defaultValue.height_unit);
      await softExpect(heightValue).toBeDisabled();
      await softExpect(background).toHaveAttribute("class", new RegExp(defaultValue.background));
      await softExpect(borderValue).toHaveText(defaultValue.border);
      await softExpect(opacity).toHaveValue(defaultValue.opacity);
      await softExpect(radius).toHaveValue(defaultValue.radius);
      await softExpect(shadow).toHaveText(defaultValue.shadow);
      await softExpect(padding).toHaveValue(defaultValue.padding);
      await softExpect(margin).toHaveValue(defaultValue.margin);
    });

    await test.step("Verify block in preview", async () => {
      await webBuilder.backBtn.click();
      await softExpect(webBuilder.frameLocator.locator(firstBlockPreview)).toContainText(expected.text_content);
      await softExpect(webBuilder.frameLocator.locator(firstBlockPreview)).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.no_z_index),
      );
      await webBuilder.clickOnElement(firstBlockPreview, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await softExpect(webBuilder.getQuickSettingsTextBtn("color").locator("span")).toHaveAttribute(
        expected.default_color.attribute,
        new RegExp(expected.default_color.value),
      );
      await softExpect(webBuilder.getQuickSettingsTextBtn("font")).toHaveText(expected.default_font_style);
      await softExpect(webBuilder.getQuickSettingsTextBtn("tag")).toHaveText(expected.default_tag);
    });

    await test.step("Drag and drop Heading block to specific position outside column & row", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_block);
    });

    await test.step("Verify block Heading style sidebar", async () => {
      await softExpect(align).toHaveAttribute("value", defaultValue.align);
      await softExpect(widthUnit).toHaveText(defaultValue.width_unit);
      await softExpect(widthValue).toHaveValue(defaultValue.width_value);
      await softExpect(heightUnit).toHaveText(defaultValue.height_unit);
      await softExpect(heightValue).toBeDisabled();
      await softExpect(background).toHaveAttribute("class", new RegExp(defaultValue.background));
      await softExpect(borderValue).toHaveText(defaultValue.border);
      await softExpect(opacity).toHaveValue(defaultValue.opacity);
      await softExpect(radius).toHaveValue(defaultValue.radius);
      await softExpect(shadow).toHaveText(defaultValue.shadow);
      await softExpect(padding).toHaveValue(defaultValue.padding);
      await softExpect(margin).toHaveValue(defaultValue.margin);
    });

    await test.step("Verify block in preview", async () => {
      await webBuilder.backBtn.click();
      await softExpect(webBuilder.frameLocator.locator(secondBlockPreview)).toContainText(expected.text_content);
      await softExpect(webBuilder.frameLocator.locator(secondBlockPreview)).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.no_z_index),
      );
      await webBuilder.clickOnElement(secondBlockPreview, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await softExpect(webBuilder.getQuickSettingsTextBtn("color").locator("span")).toHaveAttribute(
        expected.default_color.attribute,
        new RegExp(expected.default_color.value),
      );
      await softExpect(webBuilder.getQuickSettingsTextBtn("font")).toHaveText(expected.default_font_style);
      await softExpect(webBuilder.getQuickSettingsTextBtn("tag")).toHaveText(expected.default_tag);
    });
  });

  test("@SB_WEB_BUILDER_BH_02 - Check hiển thị khi input text vào block Heading", async ({ conf }) => {
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_heading);
    const copyBlock = webBuilder.getSelectorByIndex(conf.caseConf.sp_block);
    const expected = conf.caseConf.expected;
    const dndBlock = conf.caseConf.dnd_block;
    const addHeading = conf.caseConf.add_heading;
    await test.step("Pre-condition: Add Heading block", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addHeading.parent_position,
        template: addHeading.template,
      });
      await webBuilder.backBtn.click();
      await webBuilder.genLoc(webBuilder.getSidebarSelectorByIndex({ section: 1 })).click();
      await webBuilder.selectOptionOnQuickBar("Duplicate");
      await webBuilder.dragAndDropInWebBuilder(dndBlock);
      await webBuilder.backBtn.click();
      await webBuilder.clickOnElement(copyBlock, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(conf.caseConf.first_line);
      await webBuilder.page.keyboard.press("Enter");
      await webBuilder.page.keyboard.type(conf.caseConf.second_line);
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.editQuickSettingsText(conf.caseConf.edit_text);
    });

    await test.step("Input text in text box directly", async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(conf.caseConf.input_content);
    });

    await test.step("Verify block Heading style", async () => {
      await softExpect(webBuilder.getQuickSettingsTextBtn("font")).toHaveText(expected.default_font_style);
      await softExpect(webBuilder.getQuickSettingsTextBtn("color").locator("span")).toHaveAttribute(
        expected.default_color.attribute,
        new RegExp(expected.default_color.value),
      );
      await softExpect(webBuilder.getQuickSettingsTextBtn("bullet")).not.toHaveAttribute(
        expected.style.attribute,
        new RegExp(expected.style.value),
      );
      await softExpect(webBuilder.getQuickSettingsTextBtn("tag")).toHaveText(expected.default_tag);
      await webBuilder.backBtn.click();
      await softExpect(webBuilder.frameLocator.locator(blockHeading)).toHaveText(conf.caseConf.input_content);
    });

    await test.step("Copy and paste bullet blue text to block Heading", async () => {
      await webBuilder.copyTextFromBlock(copyBlock);
      await webBuilder.pasteTextToBlock(blockHeading);
    });

    await test.step("Verify font style, color and bullet list", async () => {
      await softExpect(webBuilder.getQuickSettingsTextBtn("font")).toHaveText(conf.caseConf.edit_text.font_style);
      await softExpect(webBuilder.getQuickSettingsTextBtn("color").locator("span")).toHaveAttribute(
        expected.copy_color.attribute,
        new RegExp(expected.copy_color.value),
      );
      await softExpect(webBuilder.getQuickSettingsTextBtn("bullet")).toHaveAttribute(
        expected.style.attribute,
        new RegExp(expected.style.value),
      );
      await softExpect(webBuilder.getQuickSettingsTextBtn("tag")).toHaveText(expected.copy_tag);
    });
  });

  test("@SB_WEB_BUILDER_BH_03 - Check hiển thị định vị con trỏ vào text khi thực hiện click vào block", async ({
    conf,
  }) => {
    const expected = conf.caseConf.expected;
    const addBlock = conf.caseConf.add_heading;
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: Setup Heading block", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
    });

    await test.step("Click on block Heading", async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
    });

    await test.step("Verify block in sidebar and preview", async () => {
      await expect(webBuilder.genLoc(webBuilder.layerDetailLoc)).toBeVisible();
      await expect(webBuilder.frameLocator.locator(webBuilder.quickSettingsBlock)).toBeVisible();
      await expect(webBuilder.frameLocator.locator(blockHeading)).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
    });

    await test.step("Double click to block Heading", async () => {
      await webBuilder.frameLocator.locator(blockHeading).dblclick();
    });

    await test.step("Verify open content editable block", async () => {
      await expect(textEditor).toBeVisible();
    });
  });

  test("@SB_WEB_BUILDER_BH_04 - Check hiển thị khi thực hiện bôi đen vùng text", async ({ cConf }) => {
    const addBlock = cConf.add_heading;
    const expected = cConf.expected;
    const blockHeading = webBuilder.getSelectorByIndex(cConf.block_position);
    await test.step("Pre-condition: Setup Heading block", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.changeDesign(cConf.heading_design);
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(cConf.heading_text);
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
    });

    await test.step("Click once on text", async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
    });

    await test.step("Verify nothing is selected", async () => {
      const selection = await webBuilder.getHighlightedText(textEditor, cConf.heading_text);
      expect(selection).toEqual(expected.no_highlight);
    });

    await test.step("Double click on the first letter", async () => {
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
      await webBuilder.clickToBlackedText({ selector: blockHeading, index: cConf.first_letter_index });
    });

    await test.step("Verify the first word is selected", async () => {
      const highlightedText = await webBuilder.getHighlightedText(textEditor, cConf.heading_text);
      expect(highlightedText).toEqual(expected.highlight_first_word);
    });

    await test.step("Double click on the middle letter", async () => {
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
      await webBuilder.clickToBlackedText({ selector: blockHeading, index: cConf.letter_u_index });
    });

    await test.step("Verify the first word is selected", async () => {
      const highlightedText = await webBuilder.getHighlightedText(textEditor, cConf.heading_text);
      expect(highlightedText).toEqual(expected.highlight_first_word);
    });

    await test.step("Double click on the end letter of first word", async () => {
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
      await webBuilder.clickToBlackedText({ selector: blockHeading, index: cConf.behind_letter_r });
    });

    await test.step("Verify the space is selected", async () => {
      const highlightedText = await webBuilder.getHighlightedText(textEditor, cConf.heading_text);
      expect(highlightedText).toEqual(expected.highlight_space);
    });

    await test.step("Triple click on the last letter", async () => {
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
      await webBuilder.clickToBlackedText({
        selector: blockHeading,
        index: cConf.last_letter_index,
        triple: true,
      });
    });

    await test.step("Verify the whole string is selected", async () => {
      const highlightedText = await webBuilder.getHighlightedText(textEditor, cConf.heading_text);
      expect(highlightedText).toEqual(expected.highlight_all);
    });
  });

  test("@SB_WEB_BUILDER_BH_05 - Check font style của block Heading", async ({ conf }) => {
    const addBlock = conf.caseConf.add_heading;
    const firstSection = webBuilder.getSelectorByIndex(conf.caseConf.section_position);
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: Add heading block", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.clickOnElement(firstSection, webBuilder.iframe);
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
    });

    for (const data of conf.caseConf.edit_fonts) {
      await test.step(`Edit font style of Heading block to ${data.edit_font.font_style}`, async () => {
        await webBuilder.editQuickSettingsText(data.edit_font);
      });

      await test.step("Verify tag after changed font style", async () => {
        await expect(webBuilder.getQuickSettingsTextBtn("tag")).toHaveText(data.expected_tag);
      });
    }

    await test.step("Change to website styles and select block again", async () => {
      await webBuilder.switchTabWebPageStyle("Web");
      await webBuilder.selectOptionOnQuickBar("Edit text");
    });

    for (const data of conf.caseConf.edit_fonts) {
      await test.step(`Edit font style of Heading block to ${data.edit_font.font_style}`, async () => {
        await webBuilder.editQuickSettingsText(data.edit_font);
      });

      await test.step("Verify tag after changed font style", async () => {
        await expect(webBuilder.getQuickSettingsTextBtn("tag")).toHaveText(data.expected_tag);
      });
    }
  });

  test("@SB_WEB_BUILDER_BH_06 - Check setting text decorations của block Heading", async ({ conf }) => {
    const addBlock = conf.caseConf.add_heading;
    const expected = conf.caseConf.expected;
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: Add heading block", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
    });

    await test.step("Click block and Edit text", async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await textEditor.waitFor();
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(conf.caseConf.heading_text);
      await webBuilder.editQuickSettingsText(conf.caseConf.edit_font_style);
    });

    await test.step("Verify text decorations are visible", async () => {
      await expect(webBuilder.getQuickSettingsTextBtn("bold")).toBeVisible();
      await expect(webBuilder.getQuickSettingsTextBtn("bold")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(webBuilder.getQuickSettingsTextBtn("italic")).toBeVisible();
      await expect(webBuilder.getQuickSettingsTextBtn("italic")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(webBuilder.getQuickSettingsTextBtn("underline")).toBeVisible();
      await expect(webBuilder.getQuickSettingsTextBtn("underline")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(webBuilder.getQuickSettingsTextBtn("strike")).toBeVisible();
      await expect(webBuilder.getQuickSettingsTextBtn("strike")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
    });

    await test.step("Select text and apply Bold", async () => {
      await webBuilder.blackedTextInBlock({
        block: blockHeading,
        text: conf.caseConf.bold_text,
      });
      await webBuilder.editQuickSettingsText(conf.caseConf.bold_on);
    });

    await test.step("Verify text has bold decoration", async () => {
      const boldEle = webBuilder.frameLocator.locator("[component=heading] strong");
      await expect(webBuilder.getQuickSettingsTextBtn("bold")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await webBuilder.titleBar.click({ clickCount: 3, delay: 200 });
      await expect(boldEle).toHaveText(conf.caseConf.bold_text);
    });

    await test.step("Select text and apply italic", async () => {
      await webBuilder.blackedTextInBlock({
        block: blockHeading,
        text: conf.caseConf.italic_text,
      });
      await webBuilder.editQuickSettingsText(conf.caseConf.italic_on);
    });

    await test.step("Verify text has italic decoration", async () => {
      const italicEle = webBuilder.frameLocator.locator("[component=heading] em");
      await expect(webBuilder.getQuickSettingsTextBtn("italic")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await webBuilder.titleBar.click({ clickCount: 3, delay: 200 });
      await expect(italicEle).toHaveText(conf.caseConf.italic_text);
    });

    await test.step("Select text and apply underline", async () => {
      await webBuilder.blackedTextInBlock({
        block: blockHeading,
        text: conf.caseConf.underline_text,
      });
      await webBuilder.editQuickSettingsText(conf.caseConf.underline_on);
    });

    await test.step("Verify text has underline decoration", async () => {
      const underlineEle = webBuilder.frameLocator.locator("[component=heading] u");
      await expect(webBuilder.getQuickSettingsTextBtn("underline")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await webBuilder.titleBar.click({ clickCount: 3, delay: 200 });
      await expect(underlineEle).toHaveText(conf.caseConf.underline_text);
    });

    await test.step("Select text and apply strike", async () => {
      await webBuilder.blackedTextInBlock({
        block: blockHeading,
        text: conf.caseConf.strike_text,
      });
      await webBuilder.editQuickSettingsText(conf.caseConf.strike_on);
    });

    await test.step("Verify text has strike decoration", async () => {
      const strikeEle = webBuilder.frameLocator.locator("[component=heading] s");
      await expect(webBuilder.getQuickSettingsTextBtn("strike")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await webBuilder.titleBar.click({ clickCount: 3, delay: 200 });
      await expect(strikeEle).toHaveText(conf.caseConf.strike_text);
    });

    await test.step("Select text and apply Bold + Italic + Underline + Strike", async () => {
      await webBuilder.blackedTextInBlock({
        block: blockHeading,
        text: conf.caseConf.combine_text,
      });
      await webBuilder.editQuickSettingsText(conf.caseConf.all_decor);
    });

    await test.step("Verify text has Bold + Italic + Underline + Strike decoration", async () => {
      const combineEle = webBuilder.frameLocator.locator("[component=heading] strong>em>u>s");
      await expect(webBuilder.getQuickSettingsTextBtn("bold")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(webBuilder.getQuickSettingsTextBtn("italic")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(webBuilder.getQuickSettingsTextBtn("underline")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(webBuilder.getQuickSettingsTextBtn("strike")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await webBuilder.titleBar.click();
      await expect(combineEle).toHaveText(conf.caseConf.combine_text);
    });
  });

  test("@SB_WEB_BUILDER_BH_07 - Check setting color của block Heading", async ({ conf }) => {
    const addBlock = conf.caseConf.add_heading;
    const expected = conf.caseConf.expected;
    const firstSection = webBuilder.getSelectorByIndex({ section: 1 });
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: Add heading block", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(conf.caseConf.heading_text_1);
      await webBuilder.page.keyboard.press("Enter");
      await webBuilder.page.keyboard.type(conf.caseConf.heading_text_2);
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
    });

    await test.step("Click on block Heading", async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
    });

    await test.step("Verify block has the exact color presets", async () => {
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.getQuickSettingsTextBtn("color").locator("span").click();
      await webBuilder.switchTabWebPageStyle("Page");
      await webBuilder.pageStylesColors.click();
      for (const data of conf.caseConf.color_presets) {
        await webBuilder.colorPresetBtn(data.preset).click();
        const pageStylePresetHex = await webBuilder.colorInputField.inputValue();
        const expectedPresetColor = webBuilder.convertHexToRGB(pageStylePresetHex);
        const actualPresetColor = await webBuilder.pageStyleCss.evaluate(
          (node, preset) => getComputedStyle(node).getPropertyValue(`--color-${preset}`),
          data.preset,
        );
        expect(expectedPresetColor).toEqual(actualPresetColor.trim());
      }
    });

    await test.step("Select text Your Creative and pick color preset 2", async () => {
      await webBuilder.clickOnElement(firstSection, webBuilder.iframe);
      await webBuilder.blackedTextInBlock({
        block: blockHeading,
        text: conf.caseConf.select_text_line_1,
      });
      await webBuilder.editQuickSettingsText(conf.caseConf.edit_color);
      await webBuilder.backBtn.click();
    });

    await test.step("Verify color of text changed", async () => {
      const textColorEle = webBuilder.frameLocator.locator("[component=heading] span");
      await expect(textColorEle).toHaveText(conf.caseConf.select_text_line_1);
      await expect(textColorEle).toHaveAttribute("style", new RegExp(expected.text_color));
    });

    await test.step("Select text my sunshine and pick color custom", async () => {
      //TODO: Chưa tìm được cách do dev dùng color picker của browser
    });
  });

  test("@SB_WEB_BUILDER_BH_08 - Check hiển thị block Heading khi setting text align", async ({ dashboard, conf }) => {
    const addBlock = conf.caseConf.add_heading;
    const expected = conf.caseConf.expected;
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: Add heading block", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(conf.caseConf.heading_line_1);
      await webBuilder.page.keyboard.press("Enter");
      await webBuilder.page.keyboard.type(conf.caseConf.heading_line_2);
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
    });

    await test.step("Verify default align", async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await expect(webBuilder.getAlignOption("left")).toHaveAttribute(expected.attribute, new RegExp(expected.value));
    });

    await test.step("Change align of line 1", async () => {
      await webBuilder.editQuickSettingsText(conf.caseConf.edit_align_center);
    });

    await test.step("Verify text is aligned center and icon align changed to center", async () => {
      await expect(webBuilder.getAlignOption("center")).toHaveAttribute(expected.attribute, new RegExp(expected.value));
    });

    await test.step("Change align of line 2", async () => {
      await dashboard.keyboard.press("ArrowDown");
      await dashboard.keyboard.press("ArrowDown");
      await webBuilder.editQuickSettingsText(conf.caseConf.edit_align_right);
    });

    await test.step("Verify text is aligned center and icon align changed to center", async () => {
      await expect(webBuilder.getAlignOption("right")).toHaveAttribute(expected.attribute, new RegExp(expected.value));
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
    });

    await test.step("Verify line 1 and line 2 have different align", async () => {
      const line1 = webBuilder.frameLocator.locator(`.h2:text-is("${conf.caseConf.heading_line_1}")`);
      const line2 = webBuilder.frameLocator.locator(`.h2:text-is("${conf.caseConf.heading_line_2}")`);
      await expect(line1).toHaveAttribute("style", expected.align_center);
      await expect(line2).toHaveAttribute("style", expected.align_right);
    });
  });

  test("@SB_WEB_BUILDER_BH_09 - Check hiển thị block Heading khi setting Hyperlink", async ({ context, conf }) => {
    let storeFront: Page;
    const addBlock = conf.caseConf.add_heading;
    const expected = conf.caseConf.expected;
    const hyperlink = conf.caseConf.insert_hyperlink.hyperlink;
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: Add heading block", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(conf.caseConf.heading_text);
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
    });

    await test.step("Add hyperlink for text: Your Creative", async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.editQuickSettingsText(conf.caseConf.insert_hyperlink);
    });

    await test.step("Verify insert hyperlink success in web builder and store front", async () => {
      await expect(webBuilder.getQuickSettingsTextBtn("hyperlink")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.toastMessage.waitFor();
      await webBuilder.toastMessage.waitFor({ state: "hidden" });
      storeFront = await context.newPage();
      const productSF = new BlocksSF(storeFront, conf.suiteConf.domain);
      await productSF.gotoProductDetail(handle);
      await expect(webBuilder.hyperlinkText(hyperlink.text)).toBeVisible();
      const [hyperlinkPage] = await Promise.all([
        context.waitForEvent("page"),
        await productSF.hyperlinkText(hyperlink.text).click(),
      ]);
      await expect(hyperlinkPage).toHaveURL(hyperlink.url);
      await hyperlinkPage.close();
    });

    await test.step("Remove hyperlink", async () => {
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.editQuickSettingsText(conf.caseConf.remove_hyperlink);
    });

    await test.step("Verify insert hyperlink success in web builder and store front", async () => {
      await expect(webBuilder.getQuickSettingsTextBtn("hyperlink")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await webBuilder.backBtn.click();
      await textEditor.waitFor({ state: "hidden" });
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.toastMessage.waitFor();
      await webBuilder.toastMessage.waitFor({ state: "hidden" });
      await storeFront.reload();
      await expect(webBuilder.hyperlinkText(hyperlink.text)).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_BH_10 - Check hiển thị block Heading khi setting auto listing", async ({ conf }) => {
    const addBlock = conf.caseConf.add_heading;
    const expected = conf.caseConf.expected;
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Edit text of block heading", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await textEditor.waitFor();
      await webBuilder.page.keyboard.press("Control+KeyA");
    });

    await test.step("Click Bullet list", async () => {
      await webBuilder.getQuickSettingsTextBtn("bullet").click();
    });

    await test.step("Verify bullet list display", async () => {
      const bulletFirstLine = webBuilder.frameLocator.locator("[component=heading] ul>li");
      await expect(webBuilder.getQuickSettingsTextBtn("bullet")).toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await expect(bulletFirstLine).toBeVisible();
    });

    await test.step("Enter and type text in line 2", async () => {
      await webBuilder.page.keyboard.press("End");
      await webBuilder.page.keyboard.press("Enter");
      await webBuilder.page.keyboard.type(conf.caseConf.edit_more);
      await webBuilder.page.keyboard.press("ArrowLeft", { delay: 300 });
      await webBuilder.backBtn.click();
    });

    await test.step("Verify bullet list display when enter down line", async () => {
      const bulletSecondLine = webBuilder.frameLocator.locator(":nth-match([component=heading] ul>li, 2)");
      await expect(bulletSecondLine).toBeVisible();
    });

    await test.step("Click highlighted bullet list icon in quickbar", async () => {
      await webBuilder.clickElementInWB(blockHeading);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await textEditor.waitFor();
      await webBuilder.page.keyboard.press("ArrowDown");
      await webBuilder.page.keyboard.press("End");
      await webBuilder.page.keyboard.press("Enter");
      await webBuilder.getQuickSettingsTextBtn("bullet").click();
      await webBuilder.page.keyboard.type(conf.caseConf.no_bullet_text);
      await webBuilder.page.keyboard.press("ArrowLeft", { delay: 300 });
    });

    await test.step("Verify bullet list is off", async () => {
      const bullet = webBuilder.frameLocator.locator(
        `[component=heading] ul>li>.h1:text-is("${conf.caseConf.no_bullet_text}")`,
      );
      await expect(webBuilder.getQuickSettingsTextBtn("bullet")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await webBuilder.backBtn.click();
      await expect(bullet).toBeHidden();
    });

    await test.step("Click Order list button", async () => {
      await webBuilder.clickElementInWB(blockHeading);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.getQuickSettingsTextBtn("number").click();
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(conf.caseConf.order_text_line_1);
      await webBuilder.page.keyboard.press("ArrowLeft", { delay: 300 });
    });

    await test.step("Verify line begin with ordered number", async () => {
      const orderedNumber = webBuilder.frameLocator.locator("[component=heading] ol");
      await webBuilder.backBtn.click();
      await expect(orderedNumber).toBeVisible();
    });

    await test.step("Enter down line", async () => {
      await webBuilder.clickElementInWB(blockHeading);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await textEditor.waitFor();
      await webBuilder.page.keyboard.press("End");
      await webBuilder.page.keyboard.press("Enter");
      await webBuilder.page.keyboard.type(conf.caseConf.order_text_line_2);
      await webBuilder.page.keyboard.press("ArrowLeft", { delay: 300 });
    });

    await test.step("Verify ordered number display when entered down line", async () => {
      await webBuilder.backBtn.click();
      const orderedNumberLine2 = webBuilder.frameLocator.locator(":nth-match([component=heading] ol>li, 2)");
      await expect(orderedNumberLine2).toBeVisible();
    });

    await test.step("Click highlighted ordered list icon in quickbar", async () => {
      await webBuilder.clickElementInWB(blockHeading);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await textEditor.waitFor();
      await webBuilder.page.keyboard.press("ArrowDown");
      await webBuilder.page.keyboard.press("End");
      await webBuilder.page.keyboard.press("Enter");
      await webBuilder.getQuickSettingsTextBtn("number").click();
      await webBuilder.page.keyboard.type(conf.caseConf.no_order_text);
      await webBuilder.page.keyboard.press("ArrowLeft", { delay: 300 });
    });

    await test.step("Verify ordered list is off", async () => {
      const orderedNumber = webBuilder.frameLocator.locator(
        `[component=heading] ol>li>.h1:text-is("${conf.caseConf.no_order_text}")`,
      );
      await expect(webBuilder.getQuickSettingsTextBtn("number")).not.toHaveAttribute(
        expected.attribute,
        new RegExp(expected.value),
      );
      await webBuilder.backBtn.click();
      await expect(orderedNumber).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_BH_11 - Check khi setting Heading tag", async ({ conf }) => {
    const addBlock = conf.caseConf.add_heading;
    const firstSection = webBuilder.getSelectorByIndex(conf.caseConf.section_position);
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: add block Heading", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.clickOnElement(firstSection, webBuilder.iframe);
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
    });

    for (const data of conf.caseConf.edit_tags) {
      await test.step("Edit tag of block Heading", async () => {
        await webBuilder.editQuickSettingsText(data);
      });

      await test.step("Verify current tag on quickbar and HTML", async () => {
        const selectedTag = webBuilder.getQuickSettingsTextBtn("tag").locator("span.items-center");
        const newTextStyle = webBuilder.frameLocator.locator(`${blockHeading}//${data.tag_element}[not(@style)]`);
        await expect(selectedTag).toHaveText(data.expected_text);
        await expect(newTextStyle).toBeVisible();
      });
    }
  });

  test("@SB_WEB_BUILDER_BH_12 - Check line-height của text trong block Heading khi thay đổi fontsize", async ({
    conf,
  }) => {
    const addBlock = conf.caseConf.add_heading;
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: add block Heading", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
    });

    for (const data of conf.caseConf.line_height) {
      await test.step(`Select font ${data.font_style}`, async () => {
        await webBuilder.editQuickSettingsText(data);
      });

      await test.step(`Verify line-height and tag of ${data.font_style}`, async () => {
        const actualLineHeight = await webBuilder.pageStyleCss.evaluate((ele, font) => {
          const lineHeight = getComputedStyle(ele).getPropertyValue(font);
          return parseFloat(lineHeight);
        }, data.css_value);
        expect(actualLineHeight).toEqual(data.expected.line_height);
        await expect(webBuilder.getQuickSettingsTextBtn("tag")).toHaveText(data.expected.tag);
      });
    }
  });

  test("@SB_WEB_BUILDER_BH_13 - Check hiển thị paragraph spacing ở block Heading", async ({ conf }) => {
    const addBlock = conf.caseConf.add_heading;
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: add block Heading", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await webBuilder.page.keyboard.press("Control+KeyA");
      await webBuilder.page.keyboard.type(conf.caseConf.para_line_1);
      await webBuilder.page.keyboard.press("Enter");
      await webBuilder.page.keyboard.type(conf.caseConf.para_line_2);
    });

    for (const data of conf.caseConf.edit_fonts) {
      await test.step(`Change to ${data.font_style} font style of block`, async () => {
        await webBuilder.page.keyboard.press("Control+KeyA");
        await webBuilder.editQuickSettingsText(data);
      });

      await test.step(`Verify paragraph spacing of ${data.font_style}`, async () => {
        const actualSpacing = await textEditor.evaluate(() => {
          const paragraphSpacing = getComputedStyle(document.querySelectorAll("p").item(1)).getPropertyValue(
            "margin-top",
          );
          return paragraphSpacing;
        });
        expect(actualSpacing).toEqual(data.expected_spacing);
      });
    }
  });

  test("@SB_WEB_BUILDER_LB_BH_01 - Check width height block heading", async ({ context, conf }) => {
    let storeFront: Page, productSF: BlocksSF;
    const addBlock = conf.caseConf.add_heading;
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: add block Heading", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
    });

    for (const data of conf.caseConf.width_height) {
      await test.step("Edit width height of block heading", async () => {
        await webBuilder.changeDesign(data.edit_width_height);
      });

      await test.step("Verify preview width height are changed correct", async () => {
        await expect(webBuilder.frameLocator.locator(blockHeading)).toHaveAttribute(
          data.expected.attribute,
          new RegExp(data.expected.value),
        );
      });

      const expectedBox = await webBuilder.frameLocator.locator(blockHeading).boundingBox();
      await test.step("Go to Storefront and check", async () => {
        await webBuilder.clickBtnNavigationBar("save");
        await webBuilder.toastMessage.waitFor();
        await webBuilder.toastMessage.waitFor({ state: "hidden" });
        storeFront = await context.newPage();
        productSF = new BlocksSF(storeFront, conf.suiteConf.domain);
        await productSF.gotoProductDetail(handle);
      });

      await test.step("Verify block size in storefront", async () => {
        const blockHeading = productSF.genLoc("[component=heading]").first();
        const textContent = productSF.getTextBlockLoc(conf.caseConf.default_text, conf.caseConf.block_tag);
        const actualBox = await blockHeading.boundingBox();
        await expect(textContent).toBeVisible();
        expect(Math.round(actualBox.width)).toEqual(Math.round(expectedBox.width));
        expect(Math.round(actualBox.height)).toEqual(Math.round(expectedBox.height));
        await storeFront.close();
      });
    }
  });

  test("@SB_WEB_BUILDER_LB_BH_02 - Check background, border, opacity, radius, shadow, padding, margin block heading", async ({
    conf,
  }) => {
    test.slow();
    const addBlock = conf.caseConf.add_heading;
    const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
    await test.step("Pre-condition: add block Heading", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
    });

    for (const data of conf.caseConf.styles) {
      await test.step("Edit style of block", async () => {
        await webBuilder.changeDesign(data.edit_style);
      });

      await test.step("Verify block in preview", async () => {
        await expect
          .soft(webBuilder.frameLocator.locator(`${blockHeading}//section`))
          .toHaveCSS("background", new RegExp(data.expected.background_value));
        await expect
          .soft(webBuilder.frameLocator.locator(`${blockHeading}//section`))
          .toHaveCSS("border", data.expected.border_value);
        await expect
          .soft(webBuilder.frameLocator.locator(`${blockHeading}//section`))
          .toHaveCSS("opacity", data.expected.opacity_value);
        await expect
          .soft(webBuilder.frameLocator.locator(`${blockHeading}//section`))
          .toHaveCSS("border-radius", data.expected.radius_value);
        await expect
          .soft(webBuilder.frameLocator.locator(`${blockHeading}//section`))
          .toHaveCSS("box-shadow", data.expected.shadow_value);
        await expect
          .soft(webBuilder.frameLocator.locator(`${blockHeading}//section`))
          .toHaveCSS("padding", data.expected.padding_value);
        await expect
          .soft(webBuilder.frameLocator.locator(blockHeading))
          .toHaveCSS("margin", data.expected.margin_value);
      });
    }
  });

  test("@SB_WEB_BUILDER_LB_BH_03 - Check remove block heading", async ({ context, conf }) => {
    let storeFront: Page, productSF: BlocksSF;
    const addBlock = conf.caseConf.add_heading;
    await test.step("Pre-condition: add block Heading", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        category: addBlock.category,
        template: addBlock.template,
      });
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.closeToastBtn.click();
      await webBuilder.backBtn.click();
    });

    await test.step("Remove block in sidebar", async () => {
      await webBuilder.expandCollapseLayer({ sectionName: conf.suiteConf.section_name.content, isExpand: true });
      await webBuilder.removeLayer({
        sectionName: conf.suiteConf.section_name.content,
        subLayerName: conf.caseConf.remove_block,
      });
    });

    await test.step("Check preview after remove block", async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.toastMessage.waitFor();
      await webBuilder.toastMessage.waitFor({ state: "hidden" });
      storeFront = await context.newPage();
      productSF = new BlocksSF(storeFront, conf.suiteConf.domain);
      await productSF.gotoProductDetail(handle);
      const previewBlock = productSF.getTextBlockLoc(conf.caseConf.default_text, conf.caseConf.block_tag);
      await expect(previewBlock).toBeHidden();
    });
  });
});
