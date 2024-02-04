import { expect } from "@core/fixtures";
import { test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { snapshotDir, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";
import { XpathNavigationButtons } from "@constants/web_builder";
import { DigitalProductAPI } from "@pages/api/dashboard/digital_product";
import { DigitalProductPage } from "@pages/dashboard/digital_product";
import { FrameLocator } from "@playwright/test";

const productName = () => {
  const timestamp = new Date().getTime();
  return `product template ${timestamp}`;
};

const clickOnElementInIframe = async (iframe: FrameLocator, selector: string) => {
  await iframe.locator(selector).click({ position: { x: 1, y: 1 } });
};

test.describe("Create a template by drag and drop", () => {
  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test("Create a template @SB_WEB_BUILDER_BT_14", async ({
    dashboard,
    conf,
    context,
    builder,
    authRequest,
    snapshotFixture,
  }) => {
    let section, column, block, sectionSetting, sectionSelector, columnSelector, blockSelector;
    const webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    const frameLocator = dashboard.frameLocator("#preview");

    await test.step("Pre-condition: create product, apply blank template and open web builder", async () => {
      const data = conf.suiteConf.pre_condition;
      const productAPI = new DigitalProductAPI(conf.suiteConf.domain, authRequest);
      const productPage = new DigitalProductPage(dashboard, conf.suiteConf.domain);
      const productInfo = await productAPI.createProduct({
        title: productName(),
        published: data.create_product.is_publish,
        product_type: data.create_product.product_type,
      });
      await builder.applyTemplate({
        templateId: data.apply_template.template_id,
        productId: productInfo.id,
        type: data.apply_template.type,
      });
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/creator/products/${productInfo.id}`);
      await productPage.selectActionDPro("Design sales page");
      await dashboard.waitForLoadState("networkidle");
      await frameLocator.locator("//div[contains(@class,'w-builder__preview-overlay')]").waitFor({ state: "hidden" });
    });

    section = 1;
    sectionSetting = conf.caseConf.data.section_1;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add and setting section 1", async () => {
      const stylesSection = sectionSetting.settings_section.styles;
      const quickBarSetting = sectionSetting.quick_bar_setting;
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.selectOptionOnQuickBar(quickBarSetting.editLayout);
      await webBuilder.editLayoutSection(quickBarSetting.layout_style);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.setBackground("background", stylesSection.background);
      await webBuilder.setMarginPadding("padding", stylesSection.padding);
    });

    await test.step("Add blocks for section 1", async () => {
      for (const template of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(template);
      }
    });

    await test.step("Setting 2 blocks Paragraph column 1 for section 1", async () => {
      for (const text of sectionSetting.setting_column_1.text) {
        await webBuilder.settingTextEditor(text.position, text.value);
        await clickOnElementInIframe(frameLocator, sectionSelector);
      }
    });

    column = 2;
    block = 1;
    columnSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block Countdown column 2 for section 1", async () => {
      const styles = sectionSetting.setting_column_2.styles;
      await frameLocator.locator(columnSelector).click();
      await webBuilder.color(styles.number_color, "number_color");
      await webBuilder.color(styles.unit_color, "unit_color");
      await webBuilder.settingWidthHeight("width", styles.width);
      await webBuilder.settingWidthHeight("height", styles.height);
    });

    column = 3;
    block = 1;
    columnSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block Button column 3 for section 1", async () => {
      const styles = sectionSetting.setting_column_3.styles;
      await frameLocator.locator(columnSelector).click();
      await webBuilder.selectButtonGroup(styles.style, "style");
      await webBuilder.selectAlign("align_self", styles.align);
    });

    section = 2;
    sectionSetting = conf.caseConf.data.section_2;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add and setting section 2", async () => {
      const stylesSection = sectionSetting.settings_section.styles;
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.setBackground("background", stylesSection.background);
      await webBuilder.setMarginPadding("padding", stylesSection.padding);
    });

    await test.step("Add blocks for section 2", async () => {
      for (const template of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(template);
      }
    });

    block = 1;
    blockSelector = webBuilder.getSelectorByIndex({ section, block });
    await test.step("Setting block Image for section 2", async () => {
      const styles = sectionSetting.setting_block_1.styles;
      const settings = sectionSetting.setting_block_1.settings;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.settingWidthHeight("width", styles.width);
      await webBuilder.settingWidthHeight("height", styles.height);
      await webBuilder.selectAlign("align_self", styles.align);
      await webBuilder.switchToTab("Settings");
      await webBuilder.uploadImage("image", settings.image);
      await webBuilder.selectDropDown("link", settings.target_url);
    });

    section = 3;
    sectionSetting = conf.caseConf.data.section_3;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add and setting section 3", async () => {
      const stylesSection = sectionSetting.settings_section.styles;
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.setBackground("background", stylesSection.background);
      await webBuilder.setMarginPadding("padding", stylesSection.padding);
    });

    await test.step("Add blocks for section 3", async () => {
      for (const template of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(template);
      }
    });

    await test.step("Setting block Heading (block 1) for section 3", async () => {
      const blockSetting = sectionSetting.setting_block_1;
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.settingTextEditor(blockSetting.text.position, blockSetting.text.value);
    });

    await test.step("Setting block Paragraph (block 2) for section 3", async () => {
      const blockSetting = sectionSetting.setting_block_2;
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.settingTextEditor(blockSetting.text.position, blockSetting.text.value);
    });

    block = 3;
    blockSelector = webBuilder.getSelectorByIndex({ section, block });
    await test.step("Setting block Button (block 3) for section 3", async () => {
      const styles = sectionSetting.setting_block_3.styles;
      const settings = sectionSetting.setting_block_3.settings;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.selectButtonGroup(styles.style, "style");
      await webBuilder.selectAlign("align_self", styles.align);
      await webBuilder.setMarginPadding("margin", styles.margin);
      await webBuilder.switchToTab("Settings");
      await webBuilder.inputTextBox("title", settings.title);
      await webBuilder.selectDropDown("link", settings.target_url);
    });

    block = 4;
    blockSelector = webBuilder.getSelectorByIndex({ section, block });
    await test.step("Setting block Video (block 4) for section 3 ", async () => {
      const styles = sectionSetting.setting_block_4.styles;
      const settings = sectionSetting.setting_block_4.settings;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.selectAlign("align_self", styles.align);
      await webBuilder.settingWidthHeight("width", styles.width);
      await webBuilder.settingWidthHeight("height", styles.height);
      await webBuilder.setBorder("border", styles.border);
      await webBuilder.switchToTab("Settings");
      await webBuilder.inputTextBox("alt_text", settings.description);
      await webBuilder.checkCheckBox("show_player_control", settings.show_player_control);
      await webBuilder.switchToggle("custom_thumbnail", settings.custom_thumbnail);
      await webBuilder.uploadImage("thumbnail_image", settings.thumbnail);
    });

    section = 4;
    sectionSetting = conf.caseConf.data.section_4;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add and setting section 4", async () => {
      const styles = sectionSetting.settings_section.styles;
      const quickBarSetting = sectionSetting.quick_bar_setting;
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.selectOptionOnQuickBar(quickBarSetting.editLayout);
      await webBuilder.editLayoutSection(quickBarSetting.layout_style);
      await webBuilder.setBackground("background", styles.background);
      await webBuilder.setMarginPadding("padding", styles.padding);
    });

    await test.step("Add and setting block container column 1 section 4", async () => {
      await clickOnElementInIframe(frameLocator, sectionSelector);
      for (const block of sectionSetting.insert_blocks) {
        await webBuilder.insertSectionBlock(block);
      }
      column = 1;
      block = 1;
      blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
      const settingContainer = sectionSetting.setting_block_container;
      await clickOnElementInIframe(frameLocator, blockSelector);
      await webBuilder.settingWidthHeight("width", settingContainer.styles.width);
      await webBuilder.settingWidthHeight("height", settingContainer.styles.height);
    });

    await test.step("Add blocks into container column 1 section 4", async () => {
      for (const block of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(block);
      }
    });

    block = 2;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block Icon column 1 section 4", async () => {
      const blockSetting = sectionSetting.setting_column_1.setting_block_icon;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.selectAlign("align_self", blockSetting.styles.align);
      await webBuilder.color(blockSetting.styles.icon_color, "icon_color");
      await webBuilder.switchToTab("Settings");
      await webBuilder.selectIcon("name", blockSetting.settings.icon);
    });

    await test.step("Setting block Heading column 1 section 4", async () => {
      const blockSetting = sectionSetting.setting_column_1.setting_block_heading;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    await test.step("Setting block Paragraph column 1 section 4", async () => {
      const blockSetting = sectionSetting.setting_column_1.setting_block_paragraph;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    block = 2;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Duplicate blocks and DnD in preview to column 2, 3, 4 section 4", async () => {
      columnSelector = webBuilder.getSelectorByIndex(sectionSetting.duplicate_column.position);
      await clickOnElementInIframe(frameLocator, columnSelector);
      for (let i = 0; i < sectionSetting.duplicate_column.number; i++) {
        await webBuilder.selectOptionOnQuickBar("Duplicate");
      }
      for (const dnd of sectionSetting.dnd_in_preview) {
        await webBuilder.dndTemplateInPreview(dnd);
      }
    });

    await test.step("Setting columns 2, 3, 4 section 4", async () => {
      let containerSelector;
      for (const iconSetting of sectionSetting.setting_columns_2_3_4.setting_block_icon) {
        containerSelector = webBuilder.getSelectorByIndex(iconSetting.container_position);
        blockSelector = webBuilder.getSelectorByIndex(iconSetting.position);
        await frameLocator.locator(containerSelector).click();
        await frameLocator.locator(blockSelector).click();
        await webBuilder.switchToTab("Settings");
        await webBuilder.selectIcon("name", iconSetting.icon);
      }

      for (const headingSetting of sectionSetting.setting_columns_2_3_4.setting_block_heading) {
        containerSelector = webBuilder.getSelectorByIndex(headingSetting.container_position);
        await frameLocator.locator(containerSelector).click();
        await webBuilder.settingTextEditor(headingSetting.position, headingSetting.text);
      }

      for (const paragraphSetting of sectionSetting.setting_columns_2_3_4.setting_block_paragraph) {
        containerSelector = webBuilder.getSelectorByIndex(paragraphSetting.container_position);
        await frameLocator.locator(containerSelector).click();
        await webBuilder.settingTextEditor(paragraphSetting.position, paragraphSetting.text);
      }
    });

    section = 5;
    sectionSetting = conf.caseConf.data.section_5;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add and setting section 5", async () => {
      const stylesSection = sectionSetting.settings_section.styles;
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.setBackground("background", stylesSection.background);
      await webBuilder.setMarginPadding("padding", stylesSection.padding);
    });

    await test.step("Add blocks for section 5", async () => {
      for (const template of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(template);
      }
    });

    block = 1;
    blockSelector = webBuilder.getSelectorByIndex({ section, block });
    await test.step("Setting block Image (block 1) for section 5", async () => {
      const styles = sectionSetting.setting_block_1.styles;
      const settings = sectionSetting.setting_block_1.settings;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.selectAlign("align_self", styles.align);
      await webBuilder.settingWidthHeight("width", styles.width);
      await webBuilder.setMarginPadding("margin", styles.margin);
      await webBuilder.switchToTab("Settings");
      await webBuilder.uploadImage("image", settings.image);
      await webBuilder.inputTextBox("alt", settings.alt_text);
    });

    await test.step("Setting block Paragraph (block 2) for section 5", async () => {
      const blockSetting = sectionSetting.setting_block_2;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    await test.step("Setting block Heading (block 3) for section 5", async () => {
      const blockSetting = sectionSetting.setting_block_3;
      await frameLocator.locator(sectionSelector).click();
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    await test.step("Setting block Paragraph (block 4) for section 5", async () => {
      const blockSetting = sectionSetting.setting_block_4;
      await frameLocator.locator(sectionSelector).click();
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    await test.step("Duplicate block Paragraph (block 4) section 5", async () => {
      await frameLocator.locator(sectionSelector).click();
      blockSelector = webBuilder.getSelectorByIndex(sectionSetting.duplicate_blocks.position);
      await clickOnElementInIframe(frameLocator, blockSelector);
      for (let i = 0; i < sectionSetting.duplicate_blocks.number; i++) {
        await webBuilder.selectOptionOnQuickBar("Duplicate");
      }
    });

    block = 5;
    blockSelector = webBuilder.getSelectorByIndex({ section, block });
    await test.step("Setting block Paragraph (block 5) for section 5", async () => {
      const blockSetting = sectionSetting.setting_block_5;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.setMarginPadding("margin", blockSetting.styles.margin);
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    await test.step("Setting block Paragraph (block 6) for section 5", async () => {
      const blockSetting = sectionSetting.setting_block_6;
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    section = 6;
    sectionSetting = conf.caseConf.data.section_6;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add and setting section 6", async () => {
      const stylesSection = sectionSetting.settings_section.styles;
      const quickBarSetting = sectionSetting.quick_bar_setting;
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.selectOptionOnQuickBar(quickBarSetting.editLayout);
      await webBuilder.editLayoutSection(quickBarSetting.layout_style);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.setBackground("background", stylesSection.background);
      await webBuilder.setMarginPadding("padding", stylesSection.padding);
    });

    await test.step("Add blocks for section 6", async () => {
      for (const template of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(template);
      }
    });

    column = 1;
    block = 1;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block Image (column 1) for section 6", async () => {
      const blockSetting = sectionSetting.setting_column_1;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await webBuilder.switchToTab("Settings");
      await webBuilder.uploadImage("image", blockSetting.settings.image);
      await webBuilder.inputTextBox("alt", blockSetting.settings.alt_text);
    });

    await test.step("Setting block Heading (block 1) column 2 for section 6", async () => {
      const blockSetting = sectionSetting.setting_column_2.setting_block_1;
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    column = 2;
    block = 2;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block Bullet (block 2) column 2 for section 6", async () => {
      const blockSetting = sectionSetting.setting_column_2.setting_block_2;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.color(blockSetting.styles.bullet_color, "icon_color");
      await webBuilder.selectAlign("align_self", blockSetting.styles.align);
      await webBuilder.setMarginPadding("padding", blockSetting.styles.padding);
      await webBuilder.switchToTab("Settings");
      for (const icon of blockSetting.settings.icon) {
        await webBuilder.settingListBullet("bullets", { icon });
      }
      await webBuilder.inputTextBulletToggleList(blockSetting.setting_items);
    });

    await test.step("Setting block Paragraph (block 3) column 2 for section 6", async () => {
      const blockSetting = sectionSetting.setting_column_2.setting_block_3;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    section = 7;
    sectionSetting = conf.caseConf.data.section_7;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add and setting section 7", async () => {
      const stylesSection = sectionSetting.settings_section.styles;
      const quickBarSetting = sectionSetting.quick_bar_setting;
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.selectOptionOnQuickBar(quickBarSetting.editLayout);
      for (const row of sectionSetting.quick_bar_setting.selectLayout) {
        await webBuilder.selectOptionOnQuickBar(row.action);
        await webBuilder.editLayoutSection(row.layout_style);
      }
      await webBuilder.setBackground("background", stylesSection.background);
      await webBuilder.setMarginPadding("padding", stylesSection.padding);
    });

    column = 2;
    block = 1;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Add block container + image and setting block Container row 2 section 7", async () => {
      await clickOnElementInIframe(frameLocator, sectionSelector);
      for (const block of sectionSetting.insert_blocks) {
        await webBuilder.insertSectionBlock(block);
      }
      const blockSetting = sectionSetting.setting_row_2.setting_block_container;
      await clickOnElementInIframe(frameLocator, blockSelector);
      await webBuilder.settingWidthHeight("height", blockSetting.styles.height);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
    });

    await test.step("Add blocks column 2 section 7", async () => {
      for (const block of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(block);
      }
    });

    await test.step("Setting block Heading row 1 section 7", async () => {
      const blockSetting = sectionSetting.setting_row_1;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    column = 2;
    block = 2;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block Image row 2 section 7", async () => {
      const blockSetting = sectionSetting.setting_row_2.setting_block_image;
      const containerSelector = webBuilder.getSelectorByIndex({ section, column, block: 1 });
      await frameLocator.locator(containerSelector).click();
      await frameLocator.locator(blockSelector).click();
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await webBuilder.switchToTab("Settings");
      await webBuilder.uploadImage("image", blockSetting.settings.image);
      await webBuilder.inputTextBox("alt", blockSetting.settings.alt_text);
      await webBuilder.selectDropDown("link", blockSetting.settings.target_url);
    });

    await test.step("Setting block Paragraph 1 row 2 section 7", async () => {
      const blockSetting = sectionSetting.setting_row_2.setting_block_paragraph_1;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await dashboard.locator(".sb-sticky.w-builder__header").click();
    });

    await test.step("Setting block Heading row 2 section 7", async () => {
      const blockSetting = sectionSetting.setting_row_2.setting_block_heading;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await dashboard.locator(".sb-sticky.w-builder__header").click();
    });

    await test.step("Setting block Paragraph 2 row 2 section 7", async () => {
      const blockSetting = sectionSetting.setting_row_2.setting_block_paragraph_2;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await webBuilder.setMarginPadding("margin", blockSetting.styles.margin);
    });

    column = 2;
    block = 6;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block Bullet section 7", async () => {
      const blockSetting = sectionSetting.setting_row_2.setting_block_bullet;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.color(blockSetting.styles.bullet_color, "icon_color");
      await webBuilder.selectAlign("align_self", blockSetting.styles.align);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await webBuilder.setMarginPadding("margin", blockSetting.styles.margin);
      await webBuilder.switchToTab("Settings");
      for (const icon of blockSetting.settings.icons) {
        await webBuilder.settingListBullet("bullets", { icon });
      }
      await webBuilder.inputTextBulletToggleList(blockSetting.setting_items);
    });

    await test.step("Setting block Paragraph 3 row 2 section 7", async () => {
      const blockSetting = sectionSetting.setting_row_2.setting_block_paragraph_3;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await dashboard.locator(".sb-sticky.w-builder__header").click();
    });

    section = 8;
    sectionSetting = conf.caseConf.data.section_8;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add and setting section 8", async () => {
      const stylesSection = sectionSetting.settings_section.styles;
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await webBuilder.setBackground("background", stylesSection.background);
      await webBuilder.setMarginPadding("padding", stylesSection.padding);
    });

    await test.step("Add blocks for section 8", async () => {
      for (const template of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(template);
      }
    });

    await test.step("Setting block Heading section 8", async () => {
      const blockSetting = sectionSetting.setting_block_heading;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
    });

    await test.step("Setting block Paragraph section 8", async () => {
      const blockSetting = sectionSetting.setting_block_paragraph;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.setMarginPadding("margin", blockSetting.styles.margin);
    });

    block = 3;
    blockSelector = webBuilder.getSelectorByIndex({ section, block });
    await test.step("Setting block Countdown section 8", async () => {
      const blockSetting = sectionSetting.setting_block_countdown;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.color(blockSetting.styles.number_color, "number_color");
      await webBuilder.color(blockSetting.styles.unit_color, "unit_color");
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await webBuilder.settingWidthHeight("height", blockSetting.styles.height);
      await webBuilder.setMarginPadding("margin", blockSetting.styles.margin);
      await webBuilder.switchToTab("Settings");
      await webBuilder.selectDropDown("type", blockSetting.settings.type);
    });

    block = 4;
    columnSelector = webBuilder.getSelectorByIndex({ section, block });
    await test.step("Setting block button section 8", async () => {
      const blockSetting = sectionSetting.setting_block_button;
      await frameLocator.locator(columnSelector).click();
      await webBuilder.selectButtonGroup(blockSetting.styles.style, "style");
      await webBuilder.selectAlign("align_self", blockSetting.styles.align);
      await webBuilder.switchToTab("Settings");
      await webBuilder.inputTextBox("title", blockSetting.settings.title);
      await webBuilder.selectDropDown("link", blockSetting.settings.link);
    });

    section = 9;
    sectionSetting = conf.caseConf.data.section_9;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add and setting section 9", async () => {
      const stylesSection = sectionSetting.settings_section.styles;
      const quickBarSetting = sectionSetting.quick_bar_setting;
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.selectOptionOnQuickBar(quickBarSetting.editLayout);
      await webBuilder.editLayoutSection(quickBarSetting.layout_style);
      await webBuilder.setBackground("background", stylesSection.background);
      await webBuilder.setMarginPadding("padding", stylesSection.padding);
    });

    await test.step("Add blocks for section 9", async () => {
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.insertSectionBlock(sectionSetting.insert_block);
      for (const template of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(template);
      }
    });

    await test.step("Setting block Paragraph 1 column 1 section 9", async () => {
      const blockSetting = sectionSetting.setting_column_1.setting_block_paragraph_1;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await dashboard.locator(".sb-sticky.w-builder__header").click();
    });

    await test.step("Setting block Heading column 1 section 9", async () => {
      const blockSetting = sectionSetting.setting_column_1.setting_block_heading;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await dashboard.locator(".sb-sticky.w-builder__header").click();
    });

    await test.step("Setting block Paragraph 2 column 1 section 9", async () => {
      const blockSetting = sectionSetting.setting_column_1.setting_block_paragraph_2;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await webBuilder.setMarginPadding("margin", blockSetting.styles.margin);
    });

    await test.step("Setting block Paragraph 3 column 1 section 9", async () => {
      const blockSetting = sectionSetting.setting_column_1.setting_block_paragraph_3;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await webBuilder.setMarginPadding("margin", blockSetting.styles.margin);
    });

    column = 1;
    block = 5;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block Image column 1 section 9", async () => {
      const blockSetting = sectionSetting.setting_column_1.setting_block_image;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await webBuilder.settingWidthHeight("height", blockSetting.styles.height);
      await webBuilder.selectAlign("align_self", blockSetting.styles.align);
      await webBuilder.switchToTab("Settings");
      await webBuilder.uploadImage("image", blockSetting.settings.image);
      await webBuilder.inputTextBox("alt", blockSetting.settings.alt);
      await webBuilder.selectDropDown("link", blockSetting.settings.target_url);
    });

    column = 2;
    block = 1;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block Image column 2 section 9", async () => {
      const blockSetting = sectionSetting.setting_column_2;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await webBuilder.setBorder("border", blockSetting.styles.border);
      await webBuilder.switchToTab("Settings");
      await webBuilder.uploadImage("image", blockSetting.settings.image);
      await webBuilder.inputTextBox("alt", blockSetting.settings.alt);
      await webBuilder.selectDropDown("link", blockSetting.settings.target_url);
    });

    section = 10;
    sectionSetting = conf.caseConf.data.section_10;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add and setting section 10", async () => {
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await clickOnElementInIframe(frameLocator, sectionSelector);
      for (const setting of sectionSetting.quick_bar_setting.actions) {
        await webBuilder.selectOptionOnQuickBar(setting.action);
        await webBuilder.editLayoutSection(setting.layout_style);
      }
    });

    await test.step("Add block for section 10", async () => {
      await clickOnElementInIframe(frameLocator, sectionSelector);
      for (const block of sectionSetting.insert_blocks) {
        await webBuilder.insertSectionBlock(block);
      }
      for (const block of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(block);
      }
      for (const block of sectionSetting.duplicate_blocks) {
        blockSelector = webBuilder.getSelectorByIndex(block.position);
        await clickOnElementInIframe(frameLocator, blockSelector);
        await webBuilder.selectOptionOnQuickBar("Duplicate");
      }
    });

    await test.step("Setting block Heading section 10", async () => {
      const blockSetting = sectionSetting.setting_block_heading;
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await dashboard.locator(".sb-sticky.w-builder__header").click();
    });

    await test.step("Setting blocks text in Review Card section 10", async () => {
      for (const block of sectionSetting.setting_reviews_card) {
        const containerSelector = webBuilder.getSelectorByIndex(block.container_position);
        await clickOnElementInIframe(frameLocator, sectionSelector);
        await frameLocator.locator(containerSelector).click();
        await webBuilder.settingTextEditor(block.position, block.text);
      }
    });

    section = 11;
    sectionSetting = conf.caseConf.data.section_11;
    await test.step("Add section 11", async () => {
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
    });

    // Section 12 is checkout form

    section = 13;
    sectionSetting = conf.caseConf.data.section_13;
    sectionSelector = webBuilder.getSelectorByIndex({ section });
    await test.step("Add and setting section 13", async () => {
      const stylesSection = sectionSetting.settings_section.styles;
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await webBuilder.setBackground("background", stylesSection.background);
      await webBuilder.setMarginPadding("padding", stylesSection.padding);
    });

    await test.step("Add blocks for section 13", async () => {
      for (const template of sectionSetting.dnd_blocks) {
        await webBuilder.dndTemplateFromInsertPanel(template);
      }
    });

    await test.step("Setting block Heading section 13", async () => {
      const blockSetting = sectionSetting.setting_block_heading;
      await clickOnElementInIframe(frameLocator, sectionSelector);
      await webBuilder.settingTextEditor(blockSetting.position, blockSetting.text);
      await webBuilder.setMarginPadding("margin", blockSetting.styles.margin);
      await webBuilder.selectAlign("align_self", blockSetting.styles.align);
    });

    column = 1;
    block = 2;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block Accordion section 13", async () => {
      const blockSetting = sectionSetting.setting_block_accordion;
      await frameLocator.locator(blockSelector).click();
      await webBuilder.setBackground("background", blockSetting.styles.background);
      await webBuilder.settingWidthHeight("width", blockSetting.styles.width);
      await dashboard.locator(".sb-sticky.w-builder__header").click();
      await webBuilder.switchToTab("Settings");
      await webBuilder.switchToggle("default_expand", blockSetting.settings.default_expand);
      await webBuilder.settingListBullet("accordions", { add: blockSetting.settings.add_items });
      await webBuilder.inputTextBulletToggleList(blockSetting.setting_items);
    });

    sectionSetting = conf.caseConf.data.section_14;
    await test.step("Add and setting section 14 and block for section", async () => {
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_section);
      await webBuilder.dndTemplateFromInsertPanel(sectionSetting.dnd_blocks);
      await webBuilder.setBackground("background", sectionSetting.setting_block_divider.styles.background);
    });

    await test.step("Save template", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Verify template in preview", async () => {
      await webBuilder.setAttribute({ selector: "//aside", attributeName: "style", attributeValue: "display: none;" });
      await webBuilder.setAttribute({ selector: "//header", attributeName: "style", attributeValue: "display: none;" });
      const size = await webBuilder.getElementSize("body", "#preview");
      await dashboard.setViewportSize({ height: size.height + 100, width: size.width });
      expect(await frameLocator.locator("html").screenshot({ type: "jpeg" })).toMatchSnapshot(
        conf.caseConf.snapshots.preview,
      );
    });

    await test.step("Verify template in SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      await waitForImageLoaded(storefront, "//body[@data-sf]");
      await snapshotFixture.verify({
        page: storefront,
        snapshotName: conf.caseConf.snapshots.storefront,
        screenshotOptions: { type: "jpeg", fullPage: true },
      });
    });
  });
});
