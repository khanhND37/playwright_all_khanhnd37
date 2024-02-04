import { expect, test } from "@fixtures/website_builder";
import { snapshotDir, verifyCountSelector } from "@utils/theme";
import { Blocks, ClickType } from "@pages/shopbase_creator/dashboard/blocks";

test.describe("Icon block feature @SB_WEB_BUILDER_LB_ICON_BLOCK", () => {
  let blocks: Blocks;
  let headerId: string;
  let blankSectionId: string;

  test.beforeEach(async ({ dashboard, builder, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    const suiteConf = conf.suiteConf;
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    const dndBlankSection = suiteConf.dnd_blank_section;
    const addBlock = suiteConf.add_block_icon;

    await test.step("Pre conditions", async () => {
      const page = await builder.pageBuilder(suiteConf.page_id);
      page.settings_data.pages.product[suiteConf.variant].elements = [];
      await builder.updatePageBuilder(suiteConf.page_id, page.settings_data);

      await blocks.openWebBuilder({
        type: "sale page",
        id: suiteConf.variant.split("-").pop(),
      });
      await blocks.reloadIfNotShow();
      await blocks.page.getByRole("button", { name: "Add Section" }).click();
      await blocks.getTemplatePreviewByName("Single column").click();
      await blocks.changeContent({ content: "Header" });
      headerId = await blocks.page.getByRole("paragraph").filter({ hasText: "Header" }).getAttribute("data-id");
      blankSectionId = await blocks.dragAndDropInWebBuilder(dndBlankSection);
      await blocks.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
    });
  });

  test("Check default setting khi add Icon block @SB_WEB_BUILDER_LB_ICON_BLOCK_1", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    let blockId: string;
    await test.step("Tại column, click Add block", async () => {
      // do nothing
    });
    await test.step("Chọn Icon block", async () => {
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.getElementById(headerId, ClickType.SECTION),
        snapshotName: conf.caseConf.expected.icon_default_setting,
      });
    });
    await test.step("Nhấn save > click preview button", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.icon_default_setting_sfn,
        },
        snapshotFixture,
      );
    });
    await test.step("Trong web front, click Insert panel button", async () => {
      if (await blocks.visibleTooltip.filter({ hasText: "Save" }).isVisible()) {
        await blocks.visibleTooltip.filter({ hasText: "Save" }).hover();
      }
      const params = Object.assign(conf.caseConf.data.block, {
        async callBack({ page, x, y }) {
          await page.mouse.move(x, y + y / 2);
        },
      });
      blockId = await blocks.dragAndDropInWebBuilder(params);
      await blocks.backBtn.click();
    });
    await test.step("Kéo Icon block và thả vào webfront khác vị trí static", async () => {
      await blocks.clickElementById(blockId, ClickType.BLOCK);
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.getElementById(blankSectionId, ClickType.SECTION),
        snapshotName: conf.caseConf.expected.icon_manual_setting,
      });
    });
    await test.step("Nhấn save > click preview button", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.icon_manual_setting_sfn,
        },
        snapshotFixture,
      );
    });
  });

  test("Check hiển thị icon block trên web front & SF khi thay đổi setting data của icon block @SB_WEB_BUILDER_LB_ICON_BLOCK_2", async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    let newTab;
    let blockId;
    await test.step("- Dùng API set data cho Icon block", async () => {
      blockId = await blocks.getAttrsDataId();
      const iconData = conf.caseConf.data.design;
      await blocks.switchToTab("Design");
      await blocks.color(iconData.color, "icon_color");
      await blocks.selectAlign("align_self", iconData.align_self);
      for (const widthHeight of iconData.width_height) {
        await blocks.settingWidthHeight(widthHeight.label, widthHeight.data);
      }
      await blocks.setBackground("background", iconData.background);
      await blocks.setBorder("border", iconData.border);
      for (const opacityRadius of iconData.opacity_radius) {
        await blocks.editSliderBar(opacityRadius.label, opacityRadius.data);
      }
      await blocks.setShadow("box_shadow", iconData.box_shadow.data);
      for (const marginPadding of iconData.margin_padding) {
        await blocks.setMarginPadding(marginPadding.label, marginPadding.data);
      }
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.sidebarContainer,
        snapshotName: conf.caseConf.expected.icon_design_sidebar,
      });
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.getElementById(headerId, ClickType.SECTION),
        snapshotName: conf.caseConf.expected.icon_design_preview,
      });
      await blocks.clickElementById(blockId, ClickType.BLOCK);
      await blocks.switchToTab("Content");
      await blocks.inputTextBox("link", conf.caseConf.data.setting.link);
      await blocks.selectIcon("name", conf.caseConf.data.setting.icon);
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.sidebarContainer,
        snapshotName: conf.caseConf.expected.icon_content_sidebar,
      });
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.getElementById(headerId, ClickType.SECTION),
        snapshotName: conf.caseConf.expected.icon_content_preview,
      });
    });
    await test.step("Check hiển thị Icon block ngoài web front", async () => {
      newTab = await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.icon_design_setting_sfn,
          isNextStep: true,
        },
        snapshotFixture,
      );
    });
    await test.step("Click vào icon", async () => {
      await newTab.click(blocks.getXpathLinkIcon(blockId));
      await newTab.waitForLoadState("networkidle");
      expect(await newTab.title()).toBe(conf.caseConf.expected.title);
      await newTab.close();
    });
  });

  test("Check setting color @SB_WEB_BUILDER_LB_ICON_BLOCK_3", async ({ context, conf, snapshotFixture }) => {
    await test.step("Click vào Color", async () => {
      await blocks.switchToTab("Design");
      await blocks.showPopoverColors("icon_color");
      await expect(blocks.genLoc(blocks.getXpathPresetColor(3))).toHaveClass(/w-builder__chip--active/);
      await blocks.hideWebBuilderHeader();
    });
    await test.step("Chọn màu số 5 trong bảng preset", async () => {
      await blocks.color(conf.caseConf.data.design.color, "icon_color");
    });
    await test.step("Nhấn save > click preview button", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.icon_design_color_sfn,
        },
        snapshotFixture,
      );
    });
  });

  test("Check chọn icon @SB_WEB_BUILDER_LB_ICON_BLOCK_4", async ({ context, conf, snapshotFixture }) => {
    await test.step("Click setting tab", async () => {
      await blocks.switchToTab("Content");
      await expect(blocks.genLoc(blocks.xpathIconSelected)).toHaveCSS("font-family", /Material Icons/);
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.getSelectorByLabel("name"),
        snapshotName: conf.caseConf.expected.icon_setting_name,
      });
    });
    await test.step("Click dropdown list icon", async () => {
      await blocks.showPopoverSelect("name");
      await blocks.page.waitForSelector(blocks.gridIcons);
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.sidebarContainer,
        snapshotName: conf.caseConf.expected.icon_setting_change_name,
      });
    });
    await test.step("Nhập kí tự sai vào ô search", async () => {
      await blocks.genLoc(blocks.xpathInputSearchIcon).nth(0).fill(conf.caseConf.data.setting.fill_text_falsy);
      await blocks.page.waitForSelector(blocks.gridIcons, { state: "hidden" });
      await expect(blocks.genLoc(blocks.xpathNoIconFound).nth(0)).toHaveText(conf.caseConf.expected.text_no_icon_found);
    });
    await test.step("Nhập kí tự đúng vào ô search", async () => {
      await blocks.page.fill(blocks.xpathInputSearchIcon, conf.caseConf.data.setting.fill_text_truthy);
      await blocks.page.waitForSelector(blocks.gridIcons, { state: "visible" });
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.sidebarContainer,
        snapshotName: conf.caseConf.expected.icon_setting_search_name,
      });
    });
    await test.step("Hover vào icon Home", async () => {
      await blocks.page.hover(blocks.getXpathIconByIndex(1));
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.sidebarContainer,
        snapshotName: conf.caseConf.expected.icon_setting_search_hover_name,
      });
    });
    await test.step("Chọn icon Home", async () => {
      await blocks.page.click(blocks.getXpathIconByIndex(1));
    });
    await test.step("Nhấn save > click preview button", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.icon_setting_change_name_sfn,
        },
        snapshotFixture,
      );
    });
  });

  test("Check resize width Icon block @SB_WEB_BUILDER_LB_ICON_BLOCK_19", async ({ context, conf, snapshotFixture }) => {
    const blockId = await blocks.getAttrsDataId();
    await test.step("Click vào Icon block", async () => {
      const iconDesign = conf.caseConf.data.design;
      await blocks.switchToTab("Design");
      for (const widthHeight of iconDesign.width_height) {
        await blocks.settingWidthHeight(widthHeight.label, widthHeight.data);
      }
      await blocks.switchToTab("Content");
      await expect(blocks.genLoc(blocks.xpathIconSelected)).toHaveCSS("font-family", /Material Icons/);
      await blocks.clickElementById(blockId, ClickType.BLOCK);
      await expect(blocks.frameLocator.locator("[data-resize='left']")).toBeVisible();
      await expect(blocks.frameLocator.locator("[data-resize='right']")).toBeVisible();
      await blocks.switchToTab("Design");
    });
    await test.step("trên web front, Kéo dài size chiều ngang của Icon block đến cạnh của side bar", async () => {
      await blocks.resize(conf.caseConf.data.resize.selector, "right", conf.caseConf.data.resize.outside);
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.getElementById(headerId, ClickType.SECTION),
        snapshotName: conf.caseConf.expected.icon_resize_outside,
      });
    });
    await test.step("Trên web front, thu hẹp size chiều ngang của Icon block hết cỡ", async () => {
      await blocks.resize(conf.caseConf.data.resize.selector, "right", conf.caseConf.data.resize.inside);
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.getElementById(headerId, ClickType.SECTION),
        snapshotName: conf.caseConf.expected.icon_resize_inside,
      });
    });
    await test.step("Nhấn save > click preview button", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.icon_resize_sfn,
        },
        snapshotFixture,
      );
    });
    await test.step("Trên web front, thay đổi giá trị width ở side bar", async () => {
      await blocks.clickElementById(blockId, ClickType.BLOCK);
      await blocks.switchToTab("Design");
      await blocks.settingWidthHeight("width", conf.caseConf.data.design.width_height[1].data);
      await blocks.titleBar.click({ delay: 500 }); // WB render chậm trên dev làm test ko stable
    });
    await test.step("Nhấn save > click preview button", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.icon_change_width_sfn,
        },
        snapshotFixture,
      );
    });
  });

  test("Check mở setting tab khi click Change icon trên quick bar @SB_WEB_BUILDER_LB_ICON_BLOCK_20", async ({
    conf,
    snapshotFixture,
  }) => {
    await test.step("trên web front, click vào Icon block", async () => {
      const blockId = await blocks.getAttrsDataId();
      await blocks.clickBackLayer();
      await blocks.clickElementById(blockId, ClickType.BLOCK);
    });
    await test.step("Click Change icon trên thanh quick bar", async () => {
      await blocks.clickQuickSettingByLabel("Change icon");
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.sidebarContainer,
        snapshotName: conf.caseConf.expected.icon_click_change_name,
      });
    });
  });

  test("Check remove icon block trên Quick bar setting @SB_WEB_BUILDER_LB_ICON_BLOCK_21", async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    await test.step("trên web front, click vào Icon block", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: "",
          onlyClickSave: true,
        },
        snapshotFixture,
      );
      const blockId = await blocks.getAttrsDataId();
      await blocks.clickBackLayer();
      await blocks.clickElementById(blockId, ClickType.BLOCK);
    });
    await test.step("Click remove block", async () => {
      await blocks.clickQuickSettingByLabel("Delete", "button");
    });
    await test.step("Save và check hiển thị ngoài SF", async () => {
      const newTab = await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: "",
          isNextStep: true,
        },
        snapshotFixture,
      );
      await verifyCountSelector(newTab, blocks.xpathAttrsDataBlock, 0);
      await newTab.close();
    });
  });

  test("Check duplicate Icon block @SB_WEB_BUILDER_LB_ICON_BLOCK_22", async ({ context, conf, snapshotFixture }) => {
    await test.step("Click vào Icon block", async () => {
      const blockId = await blocks.getAttrsDataId();
      await blocks.clickBackLayer();
      await blocks.clickElementById(blockId, ClickType.BLOCK);
    });
    await test.step("Click duplicate block", async () => {
      await blocks.clickQuickSettingByLabel("Ctrl+D", "button");
    });
    await test.step("Save và check hiển thị ngoài SF", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.icon_duplicate,
        },
        snapshotFixture,
      );
    });
  });

  test("Check remove Icon block trên side bar @SB_WEB_BUILDER_LB_ICON_BLOCK_23", async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Click vào Icon block", async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: "",
          onlyClickSave: true,
        },
        snapshotFixture,
      );
    });
    await test.step("Click remove block", async () => {
      await blocks.clickRemoveFromSidebar();
    });
    await test.step("Save và check hiển thị ngoài SF", async () => {
      const newTab = await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: "",
          isNextStep: true,
        },
        snapshotFixture,
      );
      await verifyCountSelector(newTab, blocks.xpathAttrsDataBlock, 0);
      await newTab.close();
    });
  });
});
