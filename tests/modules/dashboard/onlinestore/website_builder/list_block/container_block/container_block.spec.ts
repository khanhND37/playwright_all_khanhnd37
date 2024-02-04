import { snapshotDir, verifyCountSelector } from "@core/utils/theme";
import { expect, test } from "@fixtures/website_builder";
import { Sections } from "@pages/shopbase_creator/dashboard/sections";
import { Blocks, ClickType } from "@pages/shopbase_creator/dashboard/blocks";
import { PageSettingsData } from "@types";
import { WbBlockFeaturedCollection } from "@pages/dashboard/wb_block_featured_collection";

test.describe("Check setting Container block", () => {
  test.slow();
  let settingsData: PageSettingsData;
  let section: Sections;
  let blocks: Blocks;
  let positionBlockContainer, category;
  let blockContainer;
  const softExpect = expect.configure({ soft: true });

  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ conf, dashboard, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    positionBlockContainer = conf.suiteConf.position_block_container;
    blockContainer = blocks.getSelectorByIndex(positionBlockContainer);
    category = conf.suiteConf.category;

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

  test(`@SB_WEB_BUILDER_LB_CONTAINER_BLOCK_01 Container_Check data default khi add Container block`, async ({
    context,
    conf,
  }) => {
    const defaultData = conf.caseConf.default_data;
    await test.step(`Chọn Container block`, async () => {
      await blocks.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        category: category,
        template: conf.caseConf.block_container,
      });
      await blocks.clickOnElement(blockContainer, blocks.iframe);
      await blocks.switchToTab("Design");
      const data = await blocks.getDesignAndContentWithSDK();
      softExpect(data.align_self).toEqual(defaultData.align_self);
      softExpect(data.background).toMatchObject(defaultData.background);
      softExpect(data.border).toMatchObject(defaultData.border);
      softExpect(data.border_radius).toEqual(defaultData.border_radius);
      softExpect(data.box_shadow).toMatchObject(defaultData.box_shadow);
      softExpect(data.clipping_content).toEqual(defaultData.clipping_content);
      softExpect(data.layout).toMatchObject(defaultData.layout);
      softExpect(data.margin).toMatchObject(defaultData.margin);
      softExpect(data.padding).toMatchObject(defaultData.padding);
      softExpect(data.position).toEqual(defaultData.position);
      softExpect(data.width).toEqual(defaultData.width);
      softExpect(data.opacity).toEqual(defaultData.opacity);
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      const expect = conf.caseConf.expected;
      await blocks.clickBtnNavigationBar("save");
      const [previewPage] = await Promise.all([context.waitForEvent("page"), blocks.clickBtnNavigationBar("preview")]);
      const dataDefault = previewPage.locator(blocks.containerStf);
      await softExpect(dataDefault).toHaveCSS("align-self", defaultData.align_self);
      await softExpect(dataDefault).toHaveCSS("border-radius", expect.border_radius);
      await softExpect(dataDefault).toHaveCSS("height", expect.height);
      await softExpect(dataDefault).toHaveCSS("margin", expect.margin);
      await softExpect(dataDefault).toHaveCSS("opacity", expect.opacity);
      await softExpect(dataDefault).toHaveCSS("padding", expect.padding);
    });
  });

  test(`@SB_WEB_BUILDER_LB_CONTAINER_BLOCK_02 Container_Check set container align & spacing trường hợp layout = vertical`, async ({
    context,
    conf,
    cConf,
  }) => {
    await test.step(`Pre-condition: Insert block container layout vertical`, async () => {
      await blocks.dragAndDropInWebBuilder(cConf.dnd_block_container);
    });
    await test.step(`Click insert panel, kéo paragraph block từ insert panel vào container 1`, async () => {
      await blocks.insertSectionBlock({
        parentPosition: { section: 2, column: 1, row: 1 },
        category: "Basics",
        template: "Paragraph",
      });
      const data = await blocks.getDesignAndContentWithSDK();
      const paragraph = conf.caseConf.paragraph_default;
      softExpect(data.align_self).toEqual(paragraph.align_self);
      softExpect(data.position).toEqual(paragraph.position);
    });

    await test.step(`Click insert panel, kéo icon block từ insert panel vào container 1`, async () => {
      await blocks.dragAndDropInWebBuilder(cConf.dnd_block_icon);
      await blocks.clickOnElementInIframe(blocks.frameLocator, blocks.getSelectorByIndex(cConf.block_icon));
      const data = await blocks.getDesignAndContentWithSDK();
      softExpect(data.align_self).toEqual(cConf.icon_default.align_self);
      softExpect(data.position).toEqual(cConf.icon_default.position);
    });

    await test.step(`Click vào trường Layout`, async () => {
      for (const layout of cConf.layout_data) {
        await blocks.clickOnElementInIframe(blocks.frameLocator, blocks.getSelectorByIndex(cConf.block_container));
        await blocks.switchToTab("Design");
        await blocks.setLayoutForContainer(blocks.xpathSetLayout, layout.layout);
        await blocks.genLoc(blocks.xpathHeaderBar).click({ position: { x: 10, y: 10 } });
        if (layout.layout.align == "SpaceDistribute") {
          await expect(blocks.genLoc(blocks.spacingLayout)).toHaveAttribute("style", /display: none;/);
        }
        await expect(blocks.frameLocator.locator(blocks.previewVerticalLayout)).toHaveAttribute(
          "style",
          new RegExp(layout.style_web_front),
        );

        await test.step("Verify layout = vertical on SF", async () => {
          await blocks.clickBtnNavigationBar("save");
          const [previewPage] = await Promise.all([
            context.waitForEvent("page"),
            blocks.clickBtnNavigationBar("preview"),
          ]);
          const containerStf = previewPage.locator(blocks.containerStf).first();
          const expectLayout = layout.style_web_front.match(/justify-content:\s*([^;]+)/)[1];
          await softExpect(containerStf).toHaveCSS("justify-content", expectLayout);
          if (layout.layout.align != "SpaceDistribute") {
            const expectSpacing = layout.style_web_front.match(/--gap:\s*([^;]+)/)[1];
            await softExpect(containerStf).toHaveCSS("--gap", expectSpacing);
          }
        });
      }
    });
  });

  test("@SB_WEB_BUILDER_LB_CONTAINER_BLOCK_03 Check set container align & spacing trường hợp layout = horizontal", async ({
    context,
    cConf,
  }) => {
    await test.step(`Pre-condition: Insert block container layout vertical`, async () => {
      await blocks.dragAndDropInWebBuilder(cConf.dnd_block_container);
    });

    await test.step(`Click vào trường Layout -> Chuyển sang Horizontal -> Kéo bulet block từ insert panel`, async () => {
      await blocks.clickOnElementInIframe(blocks.frameLocator, blocks.getSelectorByIndex(cConf.block_container));
      await blocks.switchToTab("Design");
      await blocks.setLayoutForContainer(blocks.xpathSetLayout, cConf.layout_default);
      await blocks.dragAndDropInWebBuilder(cConf.dnd_block_bullet);
    });

    await test.step(`Click vào trường Layout -> Setting Layout`, async () => {
      for (const layout of cConf.layout_data) {
        await blocks.clickOnElementInIframe(blocks.frameLocator, blocks.getSelectorByIndex(cConf.block_container));
        await blocks.switchToTab("Design");
        await blocks.setLayoutForContainer(blocks.xpathSetLayout, layout.layout);
        await blocks.genLoc(blocks.xpathHeaderBar).click({ position: { x: 10, y: 10 } });
        if (layout.layout.align == "SpaceDistribute") {
          await expect(blocks.genLoc(blocks.spacingLayout)).toHaveAttribute("style", /display: none;/);
        }
        await expect(blocks.frameLocator.locator(blocks.previewHorizontalLayout)).toHaveAttribute(
          "style",
          new RegExp(layout.style_web_front),
        );

        await test.step("Verify layout = vertical on SF", async () => {
          await blocks.clickBtnNavigationBar("save");
          const [previewPage] = await Promise.all([
            context.waitForEvent("page"),
            blocks.clickBtnNavigationBar("preview"),
          ]);
          const containerStf = previewPage.locator(blocks.containerStf).first();
          const expectLayout = layout.style_web_front.match(/justify-content:\s*([^;]+)/)[1];
          await softExpect(containerStf).toHaveCSS("justify-content", expectLayout);
          if (layout.layout.align != "SpaceDistribute") {
            const expectSpacing = layout.style_web_front.match(/--gap:\s*([^;]+)/)[1];
            await softExpect(containerStf).toHaveCSS("--gap", expectSpacing);
          }
        });
      }
    });
  });

  test("@SB_WEB_BUILDER_LB_CONTAINER_BLOCK_04 Check hiển thị container khi set width(layout = horizontal)", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    const elemetSelector = blocks.getSelectorByIndex(caseConf.container_on_web_front);

    await test.step("Pre-condition: Add block for container with layout = horizontal", async () => {
      await blocks.dragAndDropInWebBuilder(conf.caseConf.dnd_block_container);
    });

    await test.step("Set container height and check on SF", async () => {
      for (const containerWidth of caseConf.set_container_width) {
        await blocks.clickOnElementInIframe(blocks.frameLocator, elemetSelector);
        await blocks.switchToTab("Design");
        await blocks.settingDesignAndContentWithSDK(containerWidth);
        await expect(blocks.frameLocator.locator(blocks.previewSelectedLayout)).toHaveAttribute(
          "style",
          new RegExp(containerWidth.style),
        );

        //verify on SF
        const newTab = await blocks.clickSaveAndVerifyPreview({
          context,
          dashboard: blocks.page,
          savedMsg: caseConf.expected.saved,
          snapshotName: "",
          isNextStep: true,
        });

        await snapshotFixture.verifyWithAutoRetry({
          page: newTab,
          selector: ".main",
          snapshotName: containerWidth.snapshot_on_SF,
        });
      }
    });
  });

  test("@SB_WEB_BUILDER_LB_CONTAINER_BLOCK_4.1 Check hiển thị container khi resize block con(layout = horizontal)", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    await test.step("Pre-condition: Add block for container with layout = horizontal", async () => {
      await blocks.dragAndDropInWebBuilder(conf.caseConf.dnd_block_container);
    });

    await test.step("Resize container width", async () => {
      const containerSelector = blocks.getSelectorByIndex(caseConf.container_on_web_front);
      await blocks.clickOnElementInIframe(blocks.frameLocator, containerSelector);
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(caseConf.set_container_width);
      await expect(blocks.styleContainerBlock.first()).toHaveAttribute(
        "style",
        new RegExp(caseConf.set_container_width),
      );
    });

    await test.step("Resize child block, expect container width not change", async () => {
      const childSelector = blocks.getSelectorByIndex(caseConf.child_blocks_on_web_front);
      await blocks.clickOnElementInIframe(blocks.frameLocator, childSelector);
      await blocks.switchToTab("Design");
      await blocks.settingDesignAndContentWithSDK(caseConf.set_child_width);
      await expect(blocks.styleContainerBlock.first()).toHaveAttribute(
        "style",
        new RegExp(caseConf.set_container_width),
      );
      await blocks.clickBackLayer();
    });

    await test.step("Check container on SF", async () => {
      //verify on SF
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: caseConf.expected.saved,
        snapshotName: "",
        isNextStep: true,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: newTab,
        selector: ".main",
        snapshotName: caseConf.expected.snapshot_on_SF,
      });
    });
  });

  test("@SB_WEB_BUILDER_LB_CONTAINER_BLOCK_05 Check hiển thị container khi set height(layout = vertical)", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    const elemetSelector = blocks.getSelectorByIndex(caseConf.container_on_web_front);

    await test.step("Pre-condition: Add block for container with layout = vertical", async () => {
      await blocks.dragAndDropInWebBuilder(conf.caseConf.dnd_block_container);
    });

    await test.step("Set container height and check on SF", async () => {
      for (const containerHeight of caseConf.set_container_height) {
        await blocks.clickOnElementInIframe(blocks.frameLocator, elemetSelector);
        await blocks.switchToTab("Design");
        await blocks.settingDesignAndContentWithSDK(containerHeight);
        await blocks.clickOnElementInIframe(blocks.frameLocator, elemetSelector);
        await expect(blocks.styleContainerBlock.first()).toHaveAttribute("style", new RegExp(containerHeight.style));

        //verify on SF
        const newTab = await blocks.clickSaveAndVerifyPreview({
          context,
          dashboard: blocks.page,
          savedMsg: caseConf.expected.saved,
          snapshotName: "",
          isNextStep: true,
        });

        await snapshotFixture.verifyWithAutoRetry({
          page: newTab,
          selector: ".main",
          snapshotName: containerHeight.snapshot_on_SF,
        });
      }
    });
  });

  test("@SB_WEB_BUILDER_LB_CONTAINER_BLOCK_5.1 Check hiển thị container khi resize block con(layout = vertical)", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;

    await test.step("Pre-condition: Add block for container with layout = vertical", async () => {
      await blocks.dragAndDropInWebBuilder(conf.caseConf.dnd_block_container);
    });

    await test.step("Resize child block, expect container height not change", async () => {
      await blocks.resize(caseConf.resize_child_blocks.selector, "right", caseConf.resize_child_blocks.outside);
      await expect(blocks.styleContainerBlock.first()).toHaveAttribute("style", new RegExp(caseConf.container_height));
      await blocks.clickBackLayer();
    });

    await test.step("Check container on SF", async () => {
      //verify on SF
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: caseConf.expected.saved,
        snapshotName: "",
        isNextStep: true,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: newTab,
        selector: ".main",
        snapshotName: caseConf.expected.snapshot_on_SF,
      });
    });
  });

  test("@SB_WEB_BUILDER_LB_CONTAINER_BLOCK_06 Check trường Align của các block apply theo container layout", async ({
    conf,
    snapshotFixture,
    dashboard,
  }) => {
    const caseConf = conf.caseConf;
    const elemetSelector = blocks.getSelectorByIndex(caseConf.container_on_web_front);
    const wbSideBar = new WbBlockFeaturedCollection(dashboard, conf.suiteConf.domain);
    await test.step("Lần lượt add blocks từ Insert panel vào container: when container layout = vertical", async () => {
      await blocks.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        category: category,
        template: conf.caseConf.block_container,
      });
    });

    await test.step("Switch layout = horizontal & check align of child block", async () => {
      //set layout for container
      await blocks.clickBackLayer();
      await blocks.clickOnElementInIframe(blocks.frameLocator, elemetSelector);
      await blocks.switchToTab("Design");
      await blocks.setLayoutForContainer(blocks.xpathSetLayout, caseConf.layout);

      //check align of child block
      for (const [index, childBlock] of caseConf.child_blocks.entries()) {
        await blocks.clickBackLayer();
        await blocks.expandCollapseLayer({
          sectionName: "Single column",
          isExpand: true,
        });
        const childBlockSelectorOnSideBar = blocks.getSidebarSelectorByName({
          sectionName: "Single column",
          subLayerName: childBlock.from.template,
        });
        await blocks.genLoc(childBlockSelectorOnSideBar).click();
        if (await blocks.genLoc(wbSideBar.tabDesignXpath).isVisible()) {
          await blocks.switchToTab("Design");
        }
        await snapshotFixture.verifyWithAutoRetry({
          page: blocks.page,
          selector: `${blocks.alignInSidebar}`,
          snapshotName: `${index}_${conf.caseConf.expected.align_horizontal}`,
        });
      }
    });
  });

  test("@SB_WEB_BUILDER_LB_CONTAINER_BLOCK_07 Check di chuyển vị trí container ", async ({ conf }) => {
    const caseConf = conf.caseConf;
    await test.step("Add block for container with layout = vertical", async () => {
      await blocks.dragAndDropInWebBuilder(conf.caseConf.dnd_block_container);
    });

    await test.step("DnD container block", async () => {
      await blocks.dndTemplateInPreview(caseConf.dnd);
    });

    await test.step("Verify container static on sidebar", async () => {
      await blocks.clickBackLayer();
      const childBlockXpath = {
        sectionName: "Single column",
        sectionIndex: 1,
        subLayerName: "",
      };

      //verify container name trong section 1
      childBlockXpath.subLayerName = "Container";
      await blocks.expandCollapseLayer({
        sectionName: "Single column",
        sectionIndex: 1,
        isExpand: true,
      });

      const containerCurrentLocator = blocks.getLocOfChildLayers(childBlockXpath);
      await expect(blocks.genLoc(containerCurrentLocator)).toBeVisible();
    });
  });

  test("@SB_WEB_BUILDER_LB_CONTAINER_BLOCK_08 Check trường clip content", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    await test.step("Check default clip content", async () => {
      //set date for page
      await blocks.dragAndDropInWebBuilder(conf.caseConf.dnd_block_container);
      const elemetSelector = blocks.getSelectorByIndex(caseConf.container_on_web_front);
      await blocks.clickOnElementInIframe(blocks.frameLocator, elemetSelector);
      await blocks.switchToTab("Design");
      await expect(blocks.genLoc(blocks.toggleSwitchClipContent)).toHaveAttribute("value", caseConf.attribute_true);
    });

    await test.step("Click ON clip content", async () => {
      await blocks.switchToggle("clipping_content", false);
      await expect(blocks.genLoc(blocks.toggleSwitchClipContent)).toHaveAttribute("value", caseConf.attribute_false);
      await expect(blocks.frameLocator.locator(blocks.wrapperBlock).last()).not.toHaveAttribute(
        "class",
        /overflow-hidden/,
      );
    });

    await test.step("Verify clip content ON on SF", async () => {
      await blocks.switchToggle("clipping_content", true);
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: caseConf.expected.saved,
        snapshotName: "",
        isNextStep: true,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: newTab,
        selector: ".main",
        snapshotName: caseConf.expected.snapshot_clipcontent_off,
      });
    });
  });
  test("Check remove container block trên Quick bar setting @SB_WEB_BUILDER_LB_CONTAINER_BLOCK_10", async ({
    conf,
    context,
  }) => {
    const caseConf = conf.caseConf;
    await blocks.clickAddBlockBtn("content", conf.suiteConf.theme_data.block.to.position.section);
    await blocks.getTemplatePreviewByName(conf.suiteConf.theme_data.block.from.template).click();
    const sectionSelector = blocks.getSelectorByIndex({ section: 1 });
    const blockSelector = `${sectionSelector}//div[contains(@class,'wb-dnd-draggable-wrapper')]`;
    const countContainer = await blocks.frameLocator.locator(blockSelector).count();

    await test.step("Click remove block", async () => {
      const blockId = await blocks.getAttrsDataId();
      const elemetSelector = blocks.getSelectorByIndex(caseConf.container_on_web_front);
      await blocks.clickOnElementInIframe(blocks.frameLocator, elemetSelector);
      await blocks.clickElementById(blockId, ClickType.BLOCK);
      await blocks.clickQuickSettingByLabel("Delete", "button");
      const countContainerAfter = await blocks.frameLocator.locator(blockSelector).count();
      expect(countContainerAfter + 1).toEqual(countContainer);
    });

    await test.step("Save và check hiển thị ngoài SF", async () => {
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: caseConf.expected.saved,
        snapshotName: "",
        isNextStep: true,
      });

      await verifyCountSelector(newTab, blocks.xpathAttrsDataBlock, 0);
      await newTab.close();
    });
  });

  test("Check duplicate container block trên Quick bar setting @SB_WEB_BUILDER_LB_CONTAINER_BLOCK_11", async ({
    conf,
    context,
  }) => {
    const caseConf = conf.caseConf;
    await blocks.clickAddBlockBtn("content", conf.suiteConf.theme_data.block.to.position.section);
    await blocks.getTemplatePreviewByName(conf.suiteConf.theme_data.block.from.template).click();
    const sectionSelector = blocks.getSelectorByIndex({ section: 1 });
    const blockSelector = `(${sectionSelector}//div[contains(@class,'wb-dnd-draggable-wrapper')])`;
    const countContainer = await blocks.frameLocator.locator(blockSelector).count();

    await test.step("Click duplicate container block", async () => {
      const blockId = await blocks.getAttrsDataId();
      const elemetSelector = blocks.getSelectorByIndex(caseConf.container_on_web_front);
      await blocks.clickOnElementInIframe(blocks.frameLocator, elemetSelector);
      await blocks.clickElementById(blockId, ClickType.BLOCK);
      await blocks.clickQuickSettingByLabel("Ctrl+D", "button");
      const countContainerAfter = await blocks.frameLocator.locator(blockSelector).count();
      expect(countContainer + 1).toEqual(countContainerAfter);
    });

    await test.step("Save và check hiển thị ngoài SF", async () => {
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: caseConf.expected.saved,
        snapshotName: "",
        isNextStep: true,
      });

      await verifyCountSelector(newTab, blocks.xpathAttrsDataBlock, 2);
      await newTab.close();
    });
  });

  test("Check remove container block trên Side bar setting @SB_WEB_BUILDER_LB_CONTAINER_BLOCK_12", async ({
    conf,
    context,
  }) => {
    const caseConf = conf.caseConf;
    await blocks.clickAddBlockBtn("content", conf.suiteConf.theme_data.block.to.position.section);
    await blocks.getTemplatePreviewByName(conf.suiteConf.theme_data.block.from.template).click();
    const sectionSelector = blocks.getSelectorByIndex({ section: 1 });
    const blockSelector = `(${sectionSelector}//div[contains(@class,'wb-dnd-draggable-wrapper')])`;
    const countContainer = await blocks.frameLocator.locator(blockSelector).count();

    await test.step("Click remove block on side bar", async () => {
      await blocks.clickRemoveFromSidebar();
      const countContainerAfter = await blocks.frameLocator.locator(blockSelector).count();
      expect(countContainerAfter + 1).toEqual(countContainer);
    });

    await test.step("Save và check hiển thị ngoài SF", async () => {
      const newTab = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: caseConf.expected.saved,
        snapshotName: "",
        isNextStep: true,
      });

      await verifyCountSelector(newTab, blocks.xpathAttrsDataBlock, 0);
      await newTab.close();
    });
  });

  test("Check trường Align của các block apply theo column layout @SB_WEB_BUILDER_LB_CONTAINER_BLOCK_17", async ({
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    await test.step("Check align of child block when container layout = vertical", async () => {
      for (const [index, childBlock] of caseConf.child_blocks.entries()) {
        await blocks.genLoc(section.insertPanelButton).click();
        await blocks.dragAndDropInWebBuilder(childBlock);
        await snapshotFixture.verifyWithAutoRetry({
          page: blocks.page,
          selector: `${blocks.alignInSidebar}`,
          snapshotName: `${index}_${conf.caseConf.expected.align_vertical}`,
        });
      }
    });

    await test.step("Switch layout = horizontal & check align of child block", async () => {
      //set layout for container
      await blocks.clickBackLayer();
      await test.step("Expand section by section name", async () => {
        await blocks.expandCollapseLayer({
          sectionName: "Section",
          isExpand: true,
        });
      });
      await blocks.openLayerSettings(caseConf.column_on_sidebar);
      await blocks.setLayoutForContainer("layout", caseConf.layout);
      //check align of child block
      for (const [index, childBlock] of caseConf.child_blocks.entries()) {
        await blocks.clickBackLayer();
        await expect(blocks.frameLocator.locator(section.quickBarSelector)).toBeHidden();
        await blocks.expandCollapseLayer({
          sectionName: "Section",
          isExpand: true,
        });
        const childBlockSelectorOnSideBar = await blocks.getSidebarSelectorByName({
          sectionName: "Section",
          subLayerName: childBlock.from.template,
        });
        await blocks.genLoc(childBlockSelectorOnSideBar).click();
        //align đang bị sai icon, sẽ update lại image sau khi fix bug
        await snapshotFixture.verifyWithAutoRetry({
          page: blocks.page,
          selector: `${blocks.alignInSidebar}`,
          snapshotName: `${index}_${conf.caseConf.expected.align_horizontal}`,
        });
      }
    });
  });
});
