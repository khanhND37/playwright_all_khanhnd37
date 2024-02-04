import { test, expect } from "@fixtures/website_builder";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { BlocksSF } from "@pages/shopbase_creator/storefront/product_detail/blocks";
import { Page } from "@playwright/test";
import { Locator } from "@playwright/test";
import {
  Dev,
  SbWebBuilderLBSls01,
  SbWebBuilderLBSls03,
  SbWebBuilderLBSls04,
  SbWebBuilderLBSls08,
  SbWebBuilderLBSls09,
  SbWebBuilderLBSls10,
  SbWebBuilderLBSls11,
  SbWebBuilderLBSls12,
  SbWebBuilderLBSls14,
} from "./block_slideshow";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { PageSettingsData, ShopTheme } from "@types";

const softExpect = expect.configure({ soft: true, timeout: 1000 });

test.describe("Check function block slideshow", () => {
  const blockIds = [];
  let suiteConf: Dev,
    webBuilder: WebBuilder,
    styleSettings: WebPageStyle,
    fourthColor: string,
    block: Blocks,
    layoutBtn: Locator,
    filledColorBtn: Locator,
    contentPosition: Locator,
    widthValue: Locator,
    heightValue: Locator,
    widthUnit: Locator,
    heightUnit: Locator,
    align: Locator,
    backgroundBtn: Locator,
    borderBtn: Locator,
    opacity: Locator,
    shadow: Locator,
    padding: Locator,
    margin: Locator,
    radius: Locator,
    slideNavToggleBtn: Locator,
    arrowsToggleBtn: Locator,
    partiallyToggleBtn: Locator,
    flipContentToggleBtn: Locator,
    loopToggleBtn: Locator,
    themeTest: ShopTheme;

  test.beforeEach(async ({ conf, dashboard, theme, builder, context }) => {
    suiteConf = conf.suiteConf as Dev;
    webBuilder = new WebBuilder(dashboard, suiteConf.domain, context);
    block = new Blocks(dashboard, suiteConf.domain, context);
    layoutBtn = block.getSlideshowStylesValueLocator("layout");
    filledColorBtn = block.getSlideshowStylesValueLocator("filled_color");
    contentPosition = block.getSlideshowStylesValueLocator("content_position");
    widthValue = block.getSlideshowStylesValueLocator("width_value");
    heightValue = block.getSlideshowStylesValueLocator("height_value");
    widthUnit = block.getSlideshowStylesValueLocator("width_unit");
    heightUnit = block.getSlideshowStylesValueLocator("height_unit");
    align = block.getSlideshowStylesValueLocator("align");
    backgroundBtn = block.getSlideshowStylesValueLocator("background");
    borderBtn = block.getSlideshowStylesValueLocator("border");
    opacity = block.getSlideshowStylesValueLocator("opacity");
    radius = block.getSlideshowStylesValueLocator("radius");
    shadow = block.getSlideshowStylesValueLocator("shadow");
    padding = block.getSlideshowStylesValueLocator("padding");
    margin = block.getSlideshowStylesValueLocator("margin");
    slideNavToggleBtn = block.getSlideshowLayoutSettingToggleBtn("Slide Nav");
    arrowsToggleBtn = block.getSlideshowLayoutSettingToggleBtn("Arrows");
    partiallyToggleBtn = block.getSlideshowLayoutSettingToggleBtn("Show items partially");
    flipContentToggleBtn = block.getSlideshowLayoutSettingToggleBtn("Flip content");
    loopToggleBtn = block.getSlideshowLayoutSettingToggleBtn("Loop");

    await test.step("Restore theme data", async () => {
      const listTheme = await theme.list();
      themeTest = listTheme.find(theme => theme.name === conf.suiteConf.theme_test);
      const response = await builder.pageSiteBuilder(themeTest.id);
      const settingsData = response.settings_data as PageSettingsData;
      for (const section of settingsData.pages["home"].default.elements) {
        section.elements[0].elements[0].elements = [];
      }
      await builder.updateSiteBuilder(themeTest.id, settingsData);
    });

    await test.step("Open web builder", async () => {
      await Promise.all([
        webBuilder.openWebBuilder({ type: "site", id: themeTest.id, page: "home" }),
        webBuilder.loadingScreen.waitFor(),
      ]);
      await webBuilder.reloadIfNotShow("web builder");
    });

    await test.step("Pre-condition: Get color 4 rgb", async () => {
      await webBuilder.clickBtnNavigationBar("styling");
      styleSettings = new WebPageStyle(dashboard);
      await styleSettings.clickStylingType("Colors");
      fourthColor = await styleSettings.colorPalette.nth(3).getAttribute("style");
    });
  });

  test.afterEach(async ({}) => {
    await test.step("Xoá block sau khi test", async () => {
      if (blockIds.length > 0) {
        for (const id of blockIds) {
          await block.clickElementById(id, ClickType.BLOCK);
          await block.removeBtn.click();
        }
        await block.clickSave();
        blockIds.length = 0;
      }
    });
  });

  test("@SB_WEB_BUILDER_LB_SLS_01 - Check default style, Content khi add mới block Slideshow vào webfront preview", async ({
    cConf,
  }) => {
    test.slow();
    //Prodtest chậm toàn timeout nên tăng
    const caseConf = cConf as SbWebBuilderLBSls01;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;
    await test.step("Add block slideshow by clicking add block button", async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
    });

    await test.step("Verify default settings block slideshow", async () => {
      await block.switchToTab("Design");
      await softExpect(layoutBtn).toHaveText(expected.default_layout);
      await softExpect(heightValue).toHaveValue(expected.default_height.value.toString());
      await softExpect(widthValue).toHaveValue(expected.default_width.value.toString());
      await softExpect(heightUnit).toHaveText(expected.default_height.unit);
      await softExpect(widthUnit).toHaveText(expected.default_width.unit);
      await softExpect.poll(() => filledColorBtn.getAttribute("style")).toBeNull();
      await softExpect(contentPosition).toHaveAttribute(
        expected.default_content_position.attribute,
        expected.default_content_position.value,
      );
      await softExpect(align).toHaveAttribute(expected.default_align.attribute, expected.default_align.value);
      await softExpect(backgroundBtn).toHaveAttribute(expected.default_background.attribute, fourthColor);
      await softExpect(borderBtn).toHaveText(expected.default_border);
      await softExpect(opacity).toHaveValue(expected.default_opacity);
      await softExpect(radius).toHaveValue(expected.default_radius);
      await softExpect(shadow).toHaveText(expected.default_shadow);
      await softExpect(padding).toHaveValue(expected.default_padding);
      await softExpect(margin).toHaveValue(expected.default_margin);
    });

    await test.step("Open insert panel", async () => {
      await webBuilder.clickBtnNavigationBar("insert");
    });

    await test.step("Drag and drop block slideshow to section with auto position", async () => {
      Object.assign(caseConf.dnd_block.to, { isBottom: false });
      const blockId = await webBuilder.dragAndDropInWebBuilder(caseConf.dnd_block);
      blockIds.push(blockId);
    });

    await test.step("Verify default settings block slideshow", async () => {
      await block.switchToTab("Design");
      await softExpect(layoutBtn).toHaveText(expected.default_layout);
      await softExpect(heightValue).toHaveValue(expected.default_height.value.toString());
      await softExpect(widthValue).toHaveValue(expected.default_width.value.toString());
      await softExpect(heightUnit).toHaveText(expected.default_height.unit);
      await softExpect(widthUnit).toHaveText(expected.default_width.unit);
      await softExpect.poll(() => filledColorBtn.getAttribute("style")).toBeNull();
      await softExpect(contentPosition).toHaveAttribute(
        expected.default_content_position.attribute,
        expected.default_content_position.value,
      );
      await softExpect(align).toHaveAttribute(expected.default_align.attribute, expected.default_align.value);
      await softExpect(backgroundBtn).toHaveAttribute(expected.default_background.attribute, fourthColor);
      await softExpect(borderBtn).toHaveText(expected.default_border);
      await softExpect(opacity).toHaveValue(expected.default_opacity);
      await softExpect(radius).toHaveValue(expected.default_radius);
      await softExpect(shadow).toHaveText(expected.default_shadow);
      await softExpect(padding).toHaveValue(expected.default_padding);
      await softExpect(margin).toHaveValue(expected.default_margin);
      await block.backBtn.click();
    });
  });

  test("@SB_WEB_BUILDER_LB_SLS_03 - Check edit layout block slideshow khi đã setup content, buttons", async ({
    cConf,
  }) => {
    test.slow();
    let storeFront: Page;
    let productSF: BlocksSF;
    const caseConf = cConf as SbWebBuilderLBSls03;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;
    const blockWebfront = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(caseConf.block_slideshow));
    const settingsBtn = webBuilder.quickBarButton("Settings");
    const moveUpBtn = webBuilder.quickBarButton("Move up");
    const moveDownBtn = webBuilder.quickBarButton("Move down");
    const duplicateBtn = webBuilder.quickBarButton("Duplicate");
    const hideBtn = webBuilder.quickBarButton("Hide");
    const addToLibraryBtn = webBuilder.quickBarButton("Save as template");
    const removeBtn = webBuilder.quickBarButton("Delete");
    await test.step("Pre-condition: Add slideshow block", async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
      await webBuilder.backBtn.click();
    });

    await test.step("Click block slideshow", async () => {
      await blockWebfront.click();
      await block.switchToTab("Design");
      await softExpect(slideNavToggleBtn).toBeChecked();
      await softExpect(arrowsToggleBtn).toBeChecked();
      await softExpect(loopToggleBtn).toBeChecked();
    });

    await test.step("Verify quick bar settings", async () => {
      await expect(webBuilder.frameLocator.locator(webBuilder.quickBarLoc)).toBeVisible();
      await expect(settingsBtn).toBeVisible();
      await expect(moveUpBtn).toBeVisible();
      await expect(moveDownBtn).toBeVisible();
      await expect(duplicateBtn).toBeVisible();
      await expect(hideBtn).toBeVisible();
      await expect(addToLibraryBtn).toBeVisible();
      await expect(removeBtn).toBeVisible();
    });

    await test.step("Click layout", async () => {
      await layoutBtn.click();
    });

    await test.step("Verify default settings", async () => {
      await softExpect(partiallyToggleBtn).not.toBeChecked();
    });

    await test.step("Select layout split", async () => {
      await block.changeLayoutStyle(caseConf.split);
    });

    await test.step("Verify settings of Split layout", async () => {
      await expect(flipContentToggleBtn).not.toBeChecked();
    });

    await test.step("Save and go to preview verify display", async () => {
      storeFront = await block.clickSaveAndGoTo("Preview");
      productSF = new BlocksSF(storeFront, suiteConf.domain);
      await expect(productSF.currentLayout).toHaveClass(new RegExp(expected.layout_split));
    });

    await test.step("Change back to layout Full ", async () => {
      await block.changeLayoutStyle(caseConf.full);
    });

    await test.step("Save and go to preview verify display", async () => {
      await webBuilder.clickSave();
      await storeFront.reload();
      await expect(productSF.currentLayout).toHaveClass(new RegExp(expected.layout_full));
      await storeFront.close();
    });
  });

  test("@SB_WEB_BUILDER_LB_SLS_04 - Check edit layout block slideshow khi không setup content, tắt buttons", async ({
    cConf,
  }) => {
    test.slow();
    const caseConf = cConf as SbWebBuilderLBSls04;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;
    const blockWebfront = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(caseConf.block_slideshow));
    await test.step("Pre-condition: Add block slideshow", async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
      await webBuilder.switchToTab("Content");
      await block.selectSlideSettings("settings");
      await block.editSlideshowContent(caseConf.clear_content);
      for (const turnOff of caseConf.turn_off_buttons) {
        await block.editSlideShowButton(turnOff);
      }
      await webBuilder.backBtn.click();
    });

    await test.step("Click block slideshow", async () => {
      await blockWebfront.click();
    });

    await test.step("Change layout to split", async () => {
      await block.switchToTab("Design");
      await block.changeLayoutStyle(caseConf.layout_style);
    });

    await test.step("Save and verify block in split layout on preview page", async () => {
      const storeFront = await block.clickSaveAndGoTo("Preview");
      const productSF = new BlocksSF(storeFront, suiteConf.domain);
      await expect(productSF.currentLayout).toHaveClass(new RegExp(expected.layout_split));
      await expect(productSF.getBtnInSlide("primary")).toBeHidden();
      await expect(productSF.getBtnInSlide("secondary")).toBeHidden();
      await storeFront.close();
    });
  });

  test("@SB_WEB_BUILDER_LB_SLS_08 - Check edit settings block slideshow", async ({ cConf }) => {
    test.slow();
    const caseConf = cConf as SbWebBuilderLBSls08;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;
    await test.step("Pre-condition: Add block slideshow", async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
    });

    await test.step("Select tab settings", async () => {
      await webBuilder.switchToTab("Content");
    });

    await test.step("Verify default settings", async () => {
      await expect(block.autoplayToggleBtn).not.toBeChecked();
    });

    await test.step("Click slide settings", async () => {
      await block.selectSlideSettings("settings");
    });

    await test.step("Verify popover display", async () => {
      await expect(block.slideSettingsPopover).toBeVisible();
      await block.selectSlideSettings("settings");
    });

    await test.step("Add 1 more slide", async () => {
      await block.addSlideBtn.click();
    });

    await test.step("Verify setup in new slide is default", async () => {
      const toggleBtn1 = block.getToggleBtn(caseConf.buttons[0]);
      const toggleBtn2 = block.getToggleBtn(caseConf.buttons[1]);
      const labelBtn1 = block.getButtonLabel(caseConf.buttons[0]);
      const inputTextBtn1 = block.getButtonInputText(caseConf.buttons[0]);
      const newTabToggleBtn1 = block.getToggleBtn(caseConf.buttons[0], "Open in new tab");
      await block.selectSlideSettings("settings", caseConf.new_slide);
      await block.switchTabEditSlideSettings("Content");
      await softExpect(block.getSlideContent("Sub heading")).toHaveValue(expected.content.default_sub_heading);
      await softExpect(block.getSlideContent("Heading")).toHaveValue(expected.content.default_heading);
      await softExpect(block.getSlideContent("Description")).toHaveValue(expected.content.default_description);
      await block.switchTabEditSlideSettings("Button");
      await softExpect(toggleBtn1.getByRole("checkbox")).toBeChecked();
      await softExpect(toggleBtn2.getByRole("checkbox")).not.toBeChecked();
      await softExpect(labelBtn1).toHaveValue(expected.button.default_label);
      await softExpect(inputTextBtn1).toHaveAttribute(expected.button.default_attribute, expected.button.default_value);
      await softExpect(newTabToggleBtn1.getByRole("checkbox")).not.toBeChecked();
      await block.selectSlideSettings("settings", caseConf.new_slide);
    });

    await test.step("Add 4 more slides", async () => {
      for (let i = 0; i < 4; i++) {
        const count = await block.slideInSidebar.count();
        await block.addSlideBtn.click();
        await webBuilder.titleBar.click();
        await expect(async () => {
          await expect(block.slideInSidebar).toHaveCount(count + 1);
        }).toPass({ timeout: 5000 });
      }
    });

    await test.step("Verify add slide button is disabled and duplicate is hidden after reached 8 slides", async () => {
      await expect(block.addSlideBtn).toBeDisabled();
      for (let i = 1; i <= 8; i++) {
        await expect(block.getSlideSettingsButton("duplicate", i)).toBeHidden();
      }
      await softExpect(block.paginationDot).toHaveCount(expected.pagination_dot);
    });

    await test.step("Drag and drop to change order", async () => {
      await block.dndSlideshow(caseConf.dnd_slide);
    });

    await test.step("Verify order after drag and drop", async () => {
      const secondSlide = block.slideInSidebar.nth(1);
      await softExpect(secondSlide).toHaveText(expected.slide_name);
    });

    await test.step("Delete last slide", async () => {
      await block.selectSlideSettings("remove", caseConf.last_slide);
    });

    await test.step("Verify delete slide success", async () => {
      const lastSlide = block.getSlideInSidebar(caseConf.last_slide);
      await expect(webBuilder.genLoc(lastSlide)).toBeHidden();
    });

    await test.step("Delete till only 1 slide left", async () => {
      for (const slide of caseConf.delete_slides) {
        const count = await block.slideInSidebar.count();
        await block.selectSlideSettings("remove", slide);
        await webBuilder.titleBar.click();
        await expect(async () => {
          await expect(block.slideInSidebar).toHaveCount(count - 1);
        }).toPass({ timeout: 5000 });
      }
    });

    await test.step("Verify unable to remove when only 1 slide left", async () => {
      const slide1RemoveBtn = block.getSlideSettingsButton("remove", 1);
      await expect(slide1RemoveBtn).toBeHidden();
    });

    await test.step("Duplicate slide", async () => {
      await block.selectSlideSettings("duplicate");
    });

    await test.step("Verify duplicate default slide", async () => {
      const toggleBtn1 = block.getToggleBtn(caseConf.buttons[0]);
      const toggleBtn2 = block.getToggleBtn(caseConf.buttons[1]);
      const labelBtn1 = block.getButtonLabel(caseConf.buttons[0]);
      const inputTextBtn1 = block.getButtonInputText(caseConf.buttons[0]);
      const newTabToggleBtn1 = block.getToggleBtn(caseConf.buttons[0], "Open in new tab");
      await block.selectSlideSettings("settings", caseConf.duplicate_slide);
      await block.switchTabEditSlideSettings("Content");
      await softExpect(block.getSlideContent("Sub heading")).toHaveValue(expected.content.default_sub_heading);
      await softExpect(block.getSlideContent("Heading")).toHaveValue(expected.content.default_heading);
      await softExpect(block.getSlideContent("Description")).toHaveValue(expected.content.default_description);
      await block.switchTabEditSlideSettings("Button");
      await softExpect(toggleBtn1.getByRole("checkbox")).toBeChecked();
      await softExpect(toggleBtn2.getByRole("checkbox")).not.toBeChecked();
      await softExpect(labelBtn1).toHaveValue(expected.button.default_label);
      await softExpect(inputTextBtn1).toHaveAttribute(expected.button.default_attribute, expected.button.default_value);
      await softExpect(newTabToggleBtn1.getByRole("checkbox")).not.toBeChecked();
    });

    await test.step("Duplicate 6 more slides", async () => {
      for (let i = 0; i < 6; i++) {
        const count = await block.slideInSidebar.count();
        await block.selectSlideSettings("duplicate");
        await webBuilder.titleBar.click();
        await expect(async () => {
          await expect(block.slideInSidebar).toHaveCount(count + 1);
        }).toPass({ timeout: 5000 });
      }
    });

    await test.step("Verify unable duplicate more after reached 8 slides", async () => {
      await expect(block.addSlideBtn).toBeDisabled();
      for (let i = 1; i <= 8; i++) {
        await expect(block.getSlideSettingsButton("duplicate", i)).toBeHidden();
      }
      await softExpect(block.paginationDot).toHaveCount(expected.pagination_dot);
    });

    await test.step("Turn on autoplay", async () => {
      await block.autoplayToggleBtn.click();
    });

    await test.step("Verify settings autoplay", async () => {
      const delayDurationValue = webBuilder.genLoc(webBuilder.getSelectorByLabel("delay")).getByRole("spinbutton");
      await softExpect(delayDurationValue).toHaveValue(expected.delay_duration);
      await softExpect(block.pauseOnHoverToggleBtn).not.toBeChecked();
    });
  });

  test("@SB_WEB_BUILDER_LB_SLS_09 - Check thay đổi 2 layout Full và Split ở block slideshow", async ({ cConf }) => {
    test.slow();
    const caseConf = cConf as SbWebBuilderLBSls09;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;
    const slide2Status = webBuilder.frameLocator.getByRole("tabpanel").nth(1);
    const slide3Status = webBuilder.frameLocator.getByRole("tabpanel").nth(2);
    const blockLivePreview = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(caseConf.block_slideshow));
    await test.step("Pre-condition: Add slideshow block", async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
      await webBuilder.backBtn.click();
    });

    await test.step("Click block slideshow", async () => {
      await blockLivePreview.click();
    });

    await test.step("Select layout split and edit", async () => {
      await block.switchToTab("Design");
      await block.settingDesignAndContentWithSDK(caseConf.layout_split);
    });

    await test.step("Verify in webfront preview", async () => {
      await expect(block.getArrowInLivePreview("Next")).toBeHidden();
      await expect(block.getArrowInLivePreview("Previous")).toBeHidden();
      await expect(block.slideshowPagination).toBeHidden();
      await expect(block.getSlideLayoutInLivePreview()).toHaveClass(new RegExp(expected.split_value));
    });

    await test.step("Save and verify block in split layout on preview page", async () => {
      const storeFrontPage = await block.clickSaveAndGoTo("Preview");
      const productSF = new BlocksSF(storeFrontPage, suiteConf.domain);
      await expect(productSF.currentLayout).toHaveClass(new RegExp(expected.split_value));
      await storeFrontPage.close();
    });

    /**
     * Update luôn show partially items ở Desktop bất kể width block bao nhiêu
     */
    for (const data of caseConf.content_width) {
      await test.step("Change back to layout Full and edit", async () => {
        await block.settingDesignAndContentWithSDK(data);
      });

      await test.step("Verify block in webfront preview", async () => {
        await expect(block.getArrowInLivePreview("Next")).toBeVisible();
        await expect(block.getArrowInLivePreview("Previous")).toBeVisible();
        await expect(block.slideshowPagination).toBeVisible();
        await expect(slide2Status).toHaveClass(expected.layout_attribute);
        await expect(slide3Status).toHaveClass(expected.layout_attribute);
      });

      await test.step("Save and go to preview verify display", async () => {
        const storeFrontPage = await block.clickSaveAndGoTo("Preview");
        const productSF = new BlocksSF(storeFrontPage, suiteConf.domain);
        await expect(productSF.currentLayout).toHaveClass(new RegExp(expected.full_value));
        await storeFrontPage.close();
      });
    }
  });

  test("@SB_WEB_BUILDER_LB_SLS_10 - Check edit content, button & media của 1 slide", async ({ context, cConf }) => {
    test.slow();
    const caseConf = cConf as SbWebBuilderLBSls10;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;
    const content = caseConf.edit_content;
    let storeFront: Page, productSF: BlocksSF;
    await test.step("Pre-condition: Add slideshow block", async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
    });

    await test.step("Open slide settings", async () => {
      await webBuilder.switchToTab("Content");
      await block.selectSlideSettings("settings");
    });

    await test.step("Verify default content", async () => {
      await expect(block.getSlideContent("Sub heading")).toHaveValue(expected.default_sub_heading);
      await expect(block.getSlideContent("Heading")).toHaveValue(expected.default_heading);
      await expect(block.getSlideContent("Description")).toHaveValue(expected.default_description);
    });

    await test.step("Edit slideshow content", async () => {
      await block.editSlideshowContent(content);
      await block.selectSlideSettings("settings");
    });

    await test.step("Verify text in webfront preview", async () => {
      await expect(block.getContentTypeInLivePreview("sub-heading")).toHaveText(expected.sub_heading_sf);
      await expect(block.getContentTypeInLivePreview("heading")).toHaveText(expected.heading_sf);
      await expect(block.getContentTypeInLivePreview("description")).toHaveText(expected.description_sf);
    });

    await test.step("Save and verify in storefront", async () => {
      storeFront = await block.clickSaveAndGoTo("Preview");
      productSF = new BlocksSF(storeFront, suiteConf.domain);
      await expect(productSF.getSlideContent("sub-heading")).toHaveText(expected.sub_heading_sf);
      await expect(productSF.getSlideContent("heading")).toHaveText(expected.heading_sf);
      await expect(productSF.getSlideContent("description")).toHaveText(expected.description_sf);
      await storeFront.close();
    });

    await test.step("Edit slideshow button", async () => {
      await block.selectSlideSettings("settings");
      for (const button of caseConf.turn_off_buttons) {
        await block.editSlideShowButton(button);
      }
    });

    await test.step("Verify button in webfront preview", async () => {
      await expect(block.getButtonInLivePreview("primary")).toBeHidden();
      await expect(block.getButtonInLivePreview("secondary")).toBeHidden();
    });

    await test.step("Edit slideshow button", async () => {
      await block.editSlideShowButton(caseConf.edit_button_1);
    });

    await test.step("Verify button in webfront preview", async () => {
      await softExpect(block.getButtonInLivePreview("primary")).toHaveText(caseConf.edit_button_1.label);
      await expect(block.getButtonInLivePreview("secondary")).toBeHidden();
    });

    await test.step("Save and verify product in storefront", async () => {
      storeFront = await block.clickSaveAndGoTo("Preview");
      productSF = new BlocksSF(storeFront, suiteConf.domain);
      await storeFront.reload();
      await softExpect(productSF.getBtnInSlide("primary")).toHaveText(expected.button_1_label);
      await expect(productSF.getBtnInSlide("secondary")).toBeHidden();
    });

    await test.step("Click on button and verify redirect", async () => {
      const [newTab] = await Promise.all([context.waitForEvent("page"), productSF.getBtnInSlide("primary").click()]);
      await newTab.waitForLoadState("networkidle");
      await expect(newTab).toHaveURL(new RegExp(expected.redirect_url));
      await newTab.close();
      await storeFront.close();
    });

    for (const button2 of caseConf.edit_button_2) {
      await test.step("Edit slideshow button", async () => {
        await block.settingDesignAndContentWithSDK(button2);
      });

      await test.step("Verify in webfront preview", async () => {
        await expect(block.getButtonInLivePreview("primary")).toBeHidden();
        await softExpect(block.getButtonInLivePreview("secondary")).toHaveText(expected.button_2_label);
      });

      await test.step("Save and verify in storefront", async () => {
        storeFront = await block.clickSaveAndGoTo("Preview");
        productSF = new BlocksSF(storeFront, suiteConf.domain);
        await storeFront.reload();
        await expect(productSF.getBtnInSlide("primary")).toBeHidden();
        await softExpect(productSF.getBtnInSlide("secondary")).toHaveText(expected.button_2_label);
      });

      await test.step("Click on button and verify redirect", async () => {
        await productSF.getBtnInSlide("secondary").click();
        await expect(storeFront).toHaveURL(new RegExp(button2.expected.redirect_url));
        await storeFront.close();
      });
    }

    await test.step("Add media image", async () => {
      await block.selectSlideSettings("settings");
      await block.editSlideshowMedia({ image: caseConf.add_image });
    });

    await test.step("Verify image is added in background", async () => {
      const imgUrl = await block.imgUploaded.getAttribute("src");
      const imgLivePreview = block.getSlideInLivePreviewByIndex(1).locator(block.slideBackgroundImg);
      await softExpect(imgLivePreview).toHaveAttribute("src", new RegExp(imgUrl));
    });

    await test.step("Add media video", async () => {
      await block.editSlideshowMedia({ video: caseConf.add_video });
    });

    await test.step("Verify video is added in background", async () => {
      await expect(block.slideshowVideo).toBeVisible();
      await softExpect(block.slideshowVideoIframe).toHaveAttribute("src", new RegExp(expected.video_url));
    });
  });

  test("@SB_WEB_BUILDER_LB_SLS_11 - Check tương tác với block slideshow ở webfront preview", async ({ cConf }) => {
    const caseConf = cConf as SbWebBuilderLBSls11;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;
    await test.step("Pre-condition: Add slideshow block", async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
      await webBuilder.switchToTab("Content");
    });

    await test.step("Click next arrow", async () => {
      await block.getArrowInLivePreview("Next").click();
    });

    await test.step("Verify slideshow is in slide 2", async () => {
      const secondSlide = block.getSlideInLivePreviewByIndex(caseConf.slide_2);
      const secondPaginationDot = block.getPaginationInLivePreviewByIndex(caseConf.slide_2);
      await expect(secondSlide).toHaveAttribute(expected.attribute, new RegExp(expected.slide_active));
      await expect(secondPaginationDot).toHaveAttribute(expected.attribute, new RegExp(expected.slide_active));
    });

    await test.step("Click pagination dot 3", async () => {
      await block.getPaginationInLivePreviewByIndex(caseConf.slide_3).click();
    });

    await test.step("Verify slide 3 is active", async () => {
      const thirdSlide = block.getSlideInLivePreviewByIndex(caseConf.slide_3);
      await expect(thirdSlide).toHaveAttribute(expected.attribute, new RegExp(expected.slide_active));
    });

    await test.step("Verify resizer in block slideshow", async () => {
      for (const position of caseConf.resizer_positions) {
        const resizer = block.getResizerInLivePreview(position);
        await expect(resizer).toBeVisible();
      }
    });
  });

  test("@SB_WEB_BUILDER_LB_SLS_12 - Check validate Content width block slideshow với size block khác nhau", async ({
    cConf,
  }) => {
    const caseConf = cConf as SbWebBuilderLBSls12;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;
    await test.step("Pre-condition: Add slideshow block", async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
      await block.switchToTab("Design");
    });

    for (const min of caseConf.min_width) {
      await test.step("Resize block width < 800px", async () => {
        await block.settingDesignAndContentWithSDK(min);
      });

      await test.step("Verify width of block and width content", async () => {
        const contentWidth = await block.getContentLocInLivePreview(min.slide_1).evaluate(node => {
          const width = getComputedStyle(node).getPropertyValue("width");
          return parseInt(width.replace("px", ""));
        });
        softExpect(contentWidth).toEqual(min.expected.content_width);
      });
    }

    for (const max of caseConf.max_width) {
      await test.step("Resize block width > 800px", async () => {
        await block.settingDesignAndContentWithSDK(max);
      });

      await test.step("Verify width of block and width content", async () => {
        const contentWidth = await block.getContentLocInLivePreview(max.slide_1).evaluate(node => {
          const width = getComputedStyle(node).getPropertyValue("width");
          return parseInt(width.replace("px", ""));
        });
        softExpect(contentWidth).toEqual(max.expected.content_width);
      });
    }

    await test.step("Verify line spacing", async () => {
      for (const content of caseConf.content_spacing) {
        const actualSpacing = await block
          .getContentTypeInLivePreview(content.type)
          .evaluate(ele => getComputedStyle(ele).getPropertyValue("margin-bottom"));
        softExpect(actualSpacing).toEqual(content.spacing);
      }
    });

    await test.step("Resize block height to auto", async () => {
      await block.settingDesignAndContentWithSDK(caseConf.min_height);
    });

    await test.step("Verify min height of slideshow", async () => {
      const blockMinHeight = await block.getSlideLayoutInLivePreview().evaluate(ele => {
        const height = getComputedStyle(ele).getPropertyValue("height");
        return parseInt(height.replace("px", ""));
      });
      const contentMinHeight = await block.getContentLocInLivePreview().evaluate(ele => {
        const height = getComputedStyle(ele).getPropertyValue("height");
        return parseInt(height.replace("px", ""));
      });
      expect(blockMinHeight).toEqual(contentMinHeight + 96 * 2);
    });

    await test.step("Validate content slideshow", async () => {
      await webBuilder.switchToTab("Content");
      await block.selectSlideSettings("settings");
      await block.editSlideshowContent(caseConf.validate_content);
    });

    await test.step("Verify input value of content", async () => {
      await expect(block.getSlideContent("Sub heading")).toHaveValue(expected.no_limit.sub_heading);
      await expect(block.getSlideContent("Heading")).toHaveValue(expected.no_limit.heading);
      await expect(block.getSlideContent("Description")).toHaveValue(expected.no_limit.description);
    });
  });

  test("@SB_WEB_BUILDER_LB_SLS_14 - Check block slideshow hiển thị ở Mobile view", async ({ cConf }) => {
    const caseConf = cConf as SbWebBuilderLBSls14;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;
    await test.step("Pre-condition: Add slideshow block", async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
      await webBuilder.switchToTab("Design");
      await block.settingDesignAndContentWithSDK(caseConf.split_layout);
    });

    await test.step("Switch to mobile view", async () => {
      await webBuilder.switchMobileBtn.click();
    });

    await test.step("Verify default settings in mobile view", async () => {
      const contentPadding = await block.frameLocator
        .locator(block.slidePadding)
        .first()
        .evaluate(ele => getComputedStyle(ele).getPropertyValue("padding"));
      expect(contentPadding).toEqual(expected.mobile_content_padding);
    });
  });

  test(`@SB_WEB_BUILDER_LB_SLS_15 Verify Bật tắt Loop của các block có layout slide`, async ({ cConf, conf }) => {
    const addBlock = cConf.add_block;
    let productSF: BlocksSF;

    await test.step(`1. Add block vào các column `, async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
      await block.switchToTab("Design");
    });

    await test.step(`2. edit layout của block sang "carousel" hoặc "slide"`, async () => {
      await softExpect(loopToggleBtn).toBeChecked();
    });

    await test.step(`3. Check loop Off`, async () => {
      await loopToggleBtn.setChecked(false);
      await expect(block.getArrowInLivePreview("Previous")).toBeHidden();
      await block.getArrowInLivePreview("Next").click();
      await block.getArrowInLivePreview("Next").click();
      await expect(block.getArrowInLivePreview("Next")).toBeHidden();
    });

    await test.step(`4. Save > Click vào preview + sf`, async () => {
      const sfPage = await block.clickSaveAndGoTo("Preview");
      productSF = new BlocksSF(sfPage, conf.suiteConf.domain);
      await expect(sfPage.getByRole("button", { name: "Previous page" })).toBeHidden();
      await sfPage.getByRole("button", { name: "Next page" }).click();
      await sfPage.getByRole("button", { name: "Next page" }).click();
      await expect(sfPage.getByRole("button", { name: "Next page" })).toBeHidden();
    });

    await test.step(`5. Check loop On`, async () => {
      await loopToggleBtn.setChecked(true);
      await expect(block.getArrowInLivePreview("Next")).toBeVisible();
      await block.getArrowInLivePreview("Next").click();
      await expect(block.getSlideInLivePreviewByIndex(1)).toHaveClass(/active/);
      await expect(block.getArrowInLivePreview("Previous")).toBeVisible();
    });

    await test.step(`6. Save > Click vào preview + sf`, async () => {
      await block.clickSave();
      await productSF.page.reload();
      await expect(productSF.page.getByRole("button", { name: "Previous page" })).toBeVisible();
      await productSF.page.getByRole("button", { name: "Next page" }).click();
      await productSF.page.getByRole("button", { name: "Next page" }).click();
      await expect(productSF.page.getByRole("button", { name: "Next page" })).toBeVisible();
      await productSF.page.getByRole("button", { name: "Next page" }).click();
      await expect(productSF.page.getByRole("tabpanel").first()).toHaveClass(/active/);
    });
  });

  test(`@SB_WEB_BUILDER_LB_SLS_16 Verify Bật tắt Loop của các block có layout slide autoplay`, async ({
    cConf,
    conf,
  }) => {
    const addBlock = cConf.add_block;
    let productSF: BlocksSF;

    await test.step(`1. Add block vào các column `, async () => {
      const blockId = await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockIds.push(blockId);
      await block.settingDesignAndContentWithSDK(cConf.autoplay_on);
      await block.switchToTab("Design");
    });

    await test.step(`2. edit layout của block sang "carousel" hoặc "slide"`, async () => {
      await softExpect(loopToggleBtn).toBeChecked();
    });

    await test.step(`3. Check loop Off`, async () => {
      await block.settingDesignAndContentWithSDK(cConf.loop_off);
    });

    await test.step(`4. Save > Click vào preview + sf`, async () => {
      const sfPage = await block.clickSaveAndGoTo("Preview");
      productSF = new BlocksSF(sfPage, conf.suiteConf.domain);
      await expect(sfPage.getByRole("button", { name: "Previous page" })).toBeHidden();
      await sfPage.getByRole("button", { name: "Next page" }).click();
      await sfPage.getByRole("button", { name: "Next page" }).click();
      await expect(sfPage.getByRole("button", { name: "Next page" })).toBeHidden();
      await productSF.waitAbit(5000); //Chờ 1 khoảng > thời gian delay autoplay (3s)
      await expect(sfPage.getByRole("tabpanel").last()).toHaveClass(/active/);
    });

    await test.step(`5. Check loop On`, async () => {
      await block.settingDesignAndContentWithSDK(cConf.loop_on);
    });

    await test.step(`6. Save > Click vào preview + sf`, async () => {
      await block.clickSave();
      await productSF.page.reload({ waitUntil: "networkidle" });
      await expect(productSF.page.getByRole("button", { name: "Previous page" })).toBeVisible();
      await productSF.page.getByRole("button", { name: "Next page" }).click();
      await productSF.page.getByRole("button", { name: "Next page" }).click();
      await expect(productSF.page.getByRole("button", { name: "Next page" })).toBeVisible();
      await productSF.waitAbit(5000); //Chờ 1 khoảng > thời gian delay autoplay (3s)
      await expect(productSF.page.getByRole("tabpanel").first()).toHaveClass(/active/);
    });
  });
});

/**
 * Các case bị bỏ khỏi Release checklist
 */
// test("@SB_WEB_BUILDER_LB_SLS_02 - Check remove block slideshow", async ({ cConf, context }) => {
//   test.slow();
//   const caseConf = cConf as SbWebBuilderLBSls02;
//   const addBlock = caseConf.add_block;
//   const expected = caseConf.expected;
//   const blockSlideshow = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(caseConf.block_slideshow));
//   await test.step("Pre-condition: Add block slideshow", async () => {
//     await webBuilder.insertSectionBlock({
//       parentPosition: addBlock.parent_position,
//       template: addBlock.template,
//     });
//     await webBuilder.clickBtnNavigationBar("save");
//     await webBuilder.toastMessage.waitFor({ state: "hidden" });
//     await webBuilder.backBtn.click();
//   });

//   await test.step("Click on block slideshow", async () => {
//     await blockSlideshow.click();
//   });

//   await test.step("Verify block is selected in preview", async () => {
//     await expect(blockSlideshow).toHaveAttribute(expected.attribute, new RegExp(expected.value));
//     await expect.soft(webBuilder.breadCrumb).toHaveText(new RegExp(expected.bread_crumb));
//   });

//   await test.step("Click remove in quickbar settings and save", async () => {
//     await webBuilder.selectOptionOnQuickBar("Delete");
//     await webBuilder.clickBtnNavigationBar("save");
//     await webBuilder.toastMessage.waitFor();
//     await webBuilder.closeToastBtn.click();
//   });

//   await test.step("Verify no block slideshow in preview page", async () => {
//     const storeFront = await context.newPage();
//     const productSF = new BlocksSF(storeFront, suiteConf.domain);
//     await productSF.gotoProductDetail(`${handle}?token=${token}`);
//     await expect(productSF.blockSlideshow).toBeHidden();
//     await storeFront.close();
//   });

//   await test.step("Pre-condition: Add block slideshow", async () => {
//     await webBuilder.insertSectionBlock({
//       parentPosition: addBlock.parent_position,
//       template: addBlock.template,
//     });
//     await webBuilder.clickBtnNavigationBar("save");
//     await webBuilder.toastMessage.waitFor();
//     await webBuilder.toastMessage.waitFor({ state: "hidden" });
//     await webBuilder.backBtn.click();
//   });

//   await test.step("Click on block slideshow", async () => {
//     await blockSlideshow.click();
//   });

//   await test.step("Click remove block in sidebar", async () => {
//     await webBuilder.removeBtn.click();
//     await webBuilder.clickBtnNavigationBar("save");
//     await webBuilder.toastMessage.waitFor();
//     await webBuilder.toastMessage.waitFor({ state: "hidden" });
//   });

//   await test.step("Verify no block slideshow in preview", async () => {
//     const storeFront = await context.newPage();
//     const productSF = new BlocksSF(storeFront, suiteConf.domain);
//     await productSF.gotoProductDetail(`${handle}?token=${token}`);
//     await expect(productSF.blockSlideshow).toBeHidden();
//     await storeFront.close();
//   });
// });

// test("@SB_WEB_BUILDER_LB_SLS_05 - Check duplicate block slideshow", async ({ cConf, context }) => {
//   test.slow();
//   const caseConf = cConf as SbWebBuilderLBSls05;
//   const addBlock = caseConf.add_block;
//   const expected = caseConf.expected;
//   const blockSlideshow = webBuilder.getSelectorByIndex(caseConf.block_slideshow);
//   const duplicatedBlock = webBuilder.getSelectorByIndex(caseConf.duplicated_block);
//   await test.step("Pre-condition: Add block slideshow", async () => {
//     await webBuilder.insertSectionBlock({
//       parentPosition: addBlock.parent_position,
//       template: addBlock.template,
//     });
//     await webBuilder.backBtn.click();
//   });

//   await test.step("Click on block slideshow", async () => {
//     await webBuilder.clickOnElement(blockSlideshow, webBuilder.iframe);
//   });

//   await test.step("Click duplicate block in quick bar settings", async () => {
//     await webBuilder.selectOptionOnQuickBar("Duplicate");
//   });

//   await test.step("Verify duplicated block is selected and has same settings", async () => {
//     await expect(webBuilder.frameLocator.locator(duplicatedBlock)).toHaveClass(new RegExp(expected.value));
//     await expect(layoutBtn).toHaveText(expected.default_layout);
//     await expect(heightValue).toHaveValue(expected.default_height.value.toString());
//     await expect(widthValue).toHaveValue(expected.default_width.value.toString());
//     await expect(heightUnit).toHaveText(expected.default_height.unit);
//     await expect(widthUnit).toHaveText(expected.default_width.unit);
//     expect(await filledColorBtn.getAttribute("style")).toBeNull();
//     await expect(contentPosition).toHaveAttribute(
//       expected.default_content_position.attribute,
//       expected.default_content_position.value,
//     );
//     await expect(align).toHaveAttribute(expected.default_align.attribute, expected.default_align.value);
//     await expect(backgroundBtn).toHaveAttribute(expected.default_background.attribute, fourthColor);
//     await expect(borderBtn).toHaveText(expected.default_border);
//     await expect(opacity).toHaveValue(expected.default_opacity);
//     await expect(radius).toHaveValue(expected.default_radius);
//     await expect(shadow).toHaveText(expected.default_shadow);
//     await expect(padding).toHaveValue(expected.default_padding);
//     await expect(margin).toHaveValue(expected.default_margin);
//   });

//   await test.step("Save and verify in preview page", async () => {
//     await webBuilder.clickBtnNavigationBar("save");
//     await webBuilder.toastMessage.waitFor();
//     await webBuilder.toastMessage.waitFor({ state: "hidden" });
//     const storeFront = await context.newPage();
//     const productSF = new BlocksSF(storeFront, suiteConf.domain);
//     await productSF.gotoProductDetail(`${handle}?token=${token}`);
//     const duplicatedBlockPreview = productSF.blockSlideshow.nth(1);
//     await expect(duplicatedBlockPreview).toBeVisible();
//   });
// });

// test("@SB_WEB_BUILDER_LB_SLS_06 - Check hide/show block slideshow", async ({ context, cConf }) => {
//   test.slow();
//   const caseConf = cConf as SbWebBuilderLBSls06;
//   const addBlock = caseConf.add_block;
//   const blockSlideshow = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(caseConf.block_slideshow));
//   await test.step("Pre-condition: Add block slideshow", async () => {
//     await webBuilder.insertSectionBlock({
//       parentPosition: addBlock.parent_position,
//       template: addBlock.template,
//     });
//     await webBuilder.backBtn.click();
//     await webBuilder.clickBtnNavigationBar("save");
//     await webBuilder.toastMessage.waitFor();
//     await webBuilder.toastMessage.waitFor({ state: "hidden" });
//   });

//   await test.step("Hide slideshow block", async () => {
//     await blockSlideshow.click();
//     await webBuilder.selectOptionOnQuickBar("Hide");
//     await webBuilder.backBtn.click();
//   });

//   await test.step("Verify block is hidden in web front", async () => {
//     await expect(blockSlideshow).toBeHidden();
//   });

//   await test.step("Save and verify in preview page", async () => {
//     await webBuilder.clickBtnNavigationBar("save");
//     await webBuilder.toastMessage.waitFor();
//     await webBuilder.toastMessage.waitFor({ state: "hidden" });
//     const storeFront = await context.newPage();
//     const productSF = new BlocksSF(storeFront, suiteConf.domain);
//     await productSF.gotoProductDetail(`${handle}?token=${token}`);
//     await expect(productSF.blockSlideshow).toBeHidden();
//     await storeFront.close();
//   });

//   await test.step("Show hidden block slideshow", async () => {
//     await webBuilder.expandCollapseLayer({
//       sectionName: suiteConf.section_name.content,
//       isExpand: true,
//     });
//     await webBuilder.hideOrShowLayerInSidebar({
//       sectionName: suiteConf.section_name.content,
//       subLayerName: caseConf.slideshow,
//       isHide: false,
//     });
//   });

//   await test.step("Verify block slideshow is visible in webfront", async () => {
//     await expect(blockSlideshow).toBeVisible();
//   });

//   await test.step("Save and verify in preview page", async () => {
//     await webBuilder.clickBtnNavigationBar("save");
//     await webBuilder.toastMessage.waitFor();
//     await webBuilder.toastMessage.waitFor({ state: "hidden" });
//     const storeFront = await context.newPage();
//     const productSF = new BlocksSF(storeFront, suiteConf.domain);
//     await productSF.gotoProductDetail(`${handle}?token=${token}`);
//     await expect(productSF.blockSlideshow).toBeVisible();
//   });
// });

// test("@SB_WEB_BUILDER_LB_SLS_07 - Check edit style của block slideshow", async ({ cConf, context }) => {
//   test.slow();
//   const caseConf = cConf as SbWebBuilderLBSls07;
//   const addBlock = caseConf.add_block;
//   const blockLivePreview = webBuilder.getSelectorByIndex(caseConf.block_slideshow);
//   const secondColorCss = secondColor.replace(/[^0-9,\s]+/g, "").trim();
//   const thirdColorCss = thirdColor.replace(/[^0-9,\s]+/g, "").trim();
//   await test.step("Pre-condition: Add block slideshow", async () => {
//     await webBuilder.insertSectionBlock({
//       parentPosition: addBlock.parent_position,
//       template: addBlock.template,
//     });
//     await webBuilder.backBtn.click();
//     await webBuilder.clickBtnNavigationBar("save");
//   });

//   for (const data of caseConf.style_data) {
//     const expected = data.expected;
//     await test.step("Edit settings style", async () => {
//       await webBuilder.clickOnElement(blockLivePreview, webBuilder.iframe);
//       await blockSlideshow.changeLayoutStyle(data);
//       await webBuilder.changeDesign(data);
//     });

//     await test.step("Save and verify Preview page", async () => {
//       const widthInfo = data.width.value;
//       const heightInfo = data.height.value;
//       await webBuilder.clickBtnNavigationBar("save");
//       await webBuilder.toastMessage.waitFor();
//       await webBuilder.toastMessage.waitFor({ state: "hidden" });
//       const storeFront = await context.newPage();
//       const productSF = new BlocksSF(storeFront, suiteConf.domain);
//       await productSF.gotoProductDetail(`${handle}?token=${token}`);
//       await storeFront.reload();
//       await storeFront.waitForResponse(new RegExp("/api/bootstrap/app.json"));
//       const columnContainerBox = await productSF
//         .genLoc("section.section")
//         .nth(0)
//         .locator("[class*=column--container]")
//         .boundingBox();
//       const expectedBlockWidth =
//         widthInfo.unit === "%" ? (columnContainerBox.width * widthInfo.value) / 100 : widthInfo.value;
//       const expectedBlockHeight =
//         heightInfo.unit === "%" ? (columnContainerBox.height * heightInfo.value) / 100 : heightInfo.value;
//       const actualBlockHeight = (
//         await productSF.blockSlideshow.evaluate(ele => getComputedStyle(ele).height)
//       ).replace("px", "");
//       await expect(productSF.blockSlideshow).toHaveCSS("background", new RegExp(secondColorCss));
//       await expect(productSF.blockSlideshow).toHaveCSS("position", expected.position_css);
//       await expect(productSF.getSlideContentColor()).toHaveCSS("background", new RegExp(thirdColorCss));
//       await expect(productSF.getSlideContentPosition()).toHaveClass(new RegExp(expected.content_position_css));
//       await expect(productSF.blockSlideshow).toHaveCSS("width", `${expectedBlockWidth}px`);
//       expect(Math.round(parseFloat(actualBlockHeight))).toEqual(Math.round(expectedBlockHeight));
//       await expect(productSF.blockSlideshow).toHaveCSS("opacity", expected.opacity_css);
//       await expect(productSF.blockSlideshow).toHaveCSS("border-radius", expected.radius_css);
//       await expect(productSF.blockSlideshow).toHaveCSS("box-shadow", expected.shadow_css);
//       await expect(productSF.blockSlideshow).toHaveCSS("border", new RegExp(expected.border_css));
//       await expect(productSF.blockSlideshow).toHaveCSS("margin", expected.margin_css);
//       await expect(productSF.blockSlideshow).toHaveCSS("padding", expected.padding_css);
//       await storeFront.close();
//     });
//   }
// });
