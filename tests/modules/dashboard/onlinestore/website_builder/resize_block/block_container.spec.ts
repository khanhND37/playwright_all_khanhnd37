import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { Locator } from "@playwright/test";
import { ShopTheme } from "@types";

let webBuilder: WebBuilder,
  block: Blocks,
  themeTest: ShopTheme,
  section: Locator,
  firstRow: Locator,
  firstBlock: Locator,
  secondBlock: Locator,
  resizePosition: { x?: number; y?: number };

test.describe("@RESIZE_BLOCK_CONTAINER - Resize block container", () => {
  test.beforeEach(async ({ dashboard, conf, theme }) => {
    const sConf = conf.suiteConf;
    webBuilder = new WebBuilder(dashboard, sConf.domain);
    block = new Blocks(dashboard, sConf.domain);
    section = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(sConf.test_section));
    firstRow = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(sConf.first_row));
    firstBlock = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(sConf.first_block));
    secondBlock = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, block: 2 }));

    await test.step("Open web builder", async () => {
      const themeList = await theme.list();
      themeTest = themeList.find(theme => theme.name === sConf.theme_test);
      await webBuilder.openWebBuilder({ type: "site", id: themeTest.id, page: "home" });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
    });

    await test.step("Pre-condition: Add block Container with no padding to row 1", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        template: "Container",
      });
    });
  });

  test("@SB_WEB_BUILDER_RESIZE_BLOCK_19 - Block container_Resize block container", async ({ conf }) => {
    const resizePointer = conf.suiteConf.resize;
    const expected = conf.caseConf.expected;
    const firstRowRect = await firstRow.boundingBox();
    let firstBlockRect = await firstBlock.boundingBox();

    await test.step("Kéo rộng chiều ngang block ở row 1 <= viền row", async () => {
      resizePosition = { x: conf.caseConf.width_less_than_row };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.left,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify height và width của block", async () => {
      await block.switchToTab("Design");
      const boxAfterResized = await firstBlock.boundingBox();
      const expectedWidthPercent =
        parseFloat(await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()) / 100;
      expect(Math.round(boxAfterResized.width)).toBe(Math.round(expectedWidthPercent * firstRowRect.width));
      expect(Math.round(boxAfterResized.height)).toEqual(Math.round(firstBlockRect.height));
    });

    await test.step("Kéo rộng chiều ngang block row 1 > viền row", async () => {
      resizePosition = { x: conf.caseConf.width_more_than_row };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.right,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify width block không thể kéo thêm", async () => {
      const boxAfterResized = await firstBlock.boundingBox();
      expect(Math.round(boxAfterResized.width)).toBe(expected.block_max_width);
    });

    await test.step("Kéo hẹp chiều ngang block của row 1 hết cỡ", async () => {
      resizePosition = { x: conf.caseConf.resize_width_min };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.right,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify min width block, height row", async () => {
      const firstBlockAfterResized = await firstBlock.boundingBox();
      expect(Math.round(firstBlockAfterResized.height)).toEqual(Math.round(firstBlockRect.height));
      expect(Math.round(firstBlockAfterResized.width)).toEqual(expected.block_min_width);
    });

    await test.step("Kéo rộng chiều dọc block row 1", async () => {
      firstBlockRect = await firstBlock.boundingBox();
      await block.backBtn.click();
      resizePosition = { y: conf.caseConf.resize_height };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.bottom,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify block after resized", async () => {
      await block.switchToTab("Design");
      const blockAfterResized = await firstBlock.boundingBox();
      const expectedHeight = Math.round(
        parseFloat(await block.genLoc(`${block.getSelectorByLabel("height")}//input`).inputValue()),
      );
      expect(blockAfterResized.x).toEqual(firstBlockRect.x);
      expect(Math.round(blockAfterResized.height)).toEqual(expectedHeight);
      expect(blockAfterResized.width).toEqual(firstBlockRect.width);
    });

    await test.step("Kéo hẹp chiều dọc block ở row 1 hết cỡ", async () => {
      firstBlockRect = await firstBlock.boundingBox();
      resizePosition = { y: conf.caseConf.resize_height_min };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.top,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify block after resized", async () => {
      const blockAfterResized = await firstBlock.boundingBox();
      expect(blockAfterResized.x).toEqual(firstBlockRect.x);
      expect(Math.round(blockAfterResized.height)).toEqual(expected.block_min_height);
      expect(blockAfterResized.width).toEqual(firstBlockRect.width);
    });

    await test.step("Kéo rộng góc của block ở row 1 < viền row ", async () => {
      firstBlockRect = await firstBlock.boundingBox();
      resizePosition = conf.caseConf.edge_less_than_row;
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.top_left,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify width, height & ratio sau khi resize", async () => {
      const blockAfterResized = await firstBlock.boundingBox();
      const aspectRatio = firstBlockRect.width / firstBlockRect.height;
      expect(blockAfterResized.width).toBeGreaterThan(firstBlockRect.width);
      expect(blockAfterResized.height).toBeGreaterThan(firstBlockRect.height);
      expect((blockAfterResized.width / blockAfterResized.height).toFixed(1)).toEqual(aspectRatio.toFixed(1));
    });

    await test.step("Kéo rộng góc của block ở row 1 > viền row", async () => {
      firstBlockRect = await firstBlock.boundingBox();
      resizePosition = conf.caseConf.edge_more_than_row;
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.top_right,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify width, height sau khi resize", async () => {
      await block.switchToTab("Design");
      const blockAfterResized = await firstBlock.boundingBox();
      const expectedHeight = Math.round(
        parseFloat(await block.genLoc(`${block.getSelectorByLabel("height")}//input`).inputValue()),
      );
      expect(Math.round(blockAfterResized.width)).toEqual(expected.block_max_width);
      expect(Math.round(blockAfterResized.height)).toEqual(expectedHeight);
    });

    await test.step("Kéo hẹp block của row 1 hết cỡ", async () => {
      firstBlockRect = await firstBlock.boundingBox();
      resizePosition = conf.caseConf.edge_min;
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.bottom_left,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify width, height sau khi resize", async () => {
      const blockAfterResized = await firstBlock.boundingBox();
      const expectedWidthAfterResized = Math.round(
        (blockAfterResized.height * firstBlockRect.width) / firstBlockRect.height,
      );
      expect(Math.round(blockAfterResized.width)).toEqual(expectedWidthAfterResized);
      expect(Math.round(blockAfterResized.height)).toEqual(expected.block_min_height);
    });
  });

  /**
   * Update position manual bỏ case khỏi RC
   */
  // test("@SB_WEB_BUILDER_RESIZE_BLOCK_20 Block container_Resize block container + static = OFF", async ({ conf }) => {
  //   const resizePointer = conf.suiteConf.resize;
  //   const positionManual = conf.caseConf.position_manual;
  //   const clickPos = { position: { x: 1, y: 1 } };
  //   await test.step("Pre-condition: Chuyển block sang Manual", async () => {
  //     await thirdBlock.click(clickPos);
  //     await block.changeDesign(positionManual);
  //     await secondBlock.click(clickPos);
  //     await block.changeDesign(positionManual);
  //     await firstBlock.click(clickPos);
  //     await block.changeDesign(positionManual);
  //   });
  //   const firstRowRect = await firstRow.boundingBox();
  //   let firstBlockRect = await firstBlock.boundingBox();
  //   let secondBlockRect = await secondBlock.boundingBox();
  //   await webBuilder.dragBlockInWebBuilder(firstBlock, section, {
  //     sourcePosition: { x: firstBlockRect.x + firstBlockRect.width - 10, y: firstBlockRect.y + 10 },
  //     targetPosition: { x: firstRowRect.x + firstRowRect.width * 0.75, y: firstRowRect.y },
  //   });

  //   await test.step("Kéo rộng chiều ngang block ở row 1 <= viền row", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = { x: conf.caseConf.width_less_than_row };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.left,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify height image và width của block", async () => {
  //     await block.switchToTab("Design");
  //     const boxAfterResized = await firstBlock.boundingBox();
  //     const expectedWidth = parseFloat(
  //      await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()
  //      );
  //     expect(Math.round(boxAfterResized.width)).toBe(Math.round(expectedWidth));
  //     expect(Math.round(boxAfterResized.height)).toEqual(Math.round(firstBlockRect.height));
  //   });

  //   await test.step("Kéo rộng chiều ngang block row 1 > viền row", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = { x: conf.caseConf.width_more_than_row };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.left,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width block", async () => {
  //     const boxAfterResized = await firstBlock.boundingBox();
  //     const expectedWidth = parseFloat(
  //      await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue());
  //     expect(Math.round(boxAfterResized.width)).toBe(expectedWidth);
  //   });

  //   await test.step("Kéo hẹp chiều ngang block của row 1 hết cỡ", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = { x: conf.caseConf.resize_width_min };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify min width block, height", async () => {
  //     const firstBlockAfterResized = await firstBlock.boundingBox();
  //     const expectedWidth = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()),
  //     );
  //     expect(Math.round(firstBlockAfterResized.height)).toEqual(Math.round(firstBlockRect.height));
  //     expect(Math.round(firstBlockAfterResized.width)).toEqual(expectedWidth);
  //   });

  //   await test.step("Kéo rộng chiều dọc block row 1", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = { y: conf.caseConf.resize_height };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.top,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify block after resized", async () => {
  //     const blockAfterResized = await firstBlock.boundingBox();
  //     const expectedHeight = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("height")}//input`).inputValue()),
  //     );
  //     expect(blockAfterResized.y).not.toEqual(firstBlockRect.y);
  //     expect(Math.round(blockAfterResized.height)).toEqual(expectedHeight);
  //     expect(blockAfterResized.width).toEqual(firstBlockRect.width);
  //   });

  //   await test.step("Kéo hẹp chiều dọc block ở row 1 hết cỡ", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = { y: conf.caseConf.resize_height_min };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.bottom,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify block after resized", async () => {
  //     const blockAfterResized = await firstBlock.boundingBox();
  //     const expectedHeight = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("height")}//input`).inputValue()),
  //     );
  //     expect(Math.round(blockAfterResized.height)).toEqual(expectedHeight);
  //     expect(blockAfterResized.width).toEqual(firstBlockRect.width);
  //   });

  //   await test.step("Kéo rộng góc của block ở row 1 < viền row ", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = conf.caseConf.edge_less_than_row;
  //     // Tránh lỗi breadcrumb đè vào block có width min bị che mất nút resize
  //     await block.changeDesign({
  //       width: { label: "width", value: { value: 90 } },
  //       height: { label: "height", value: { value: 90 } },
  //     });
  //     await block.backBtn.click();
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.bottom_right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width, height & ratio sau khi resize", async () => {
  //     const blockAfterResized = await firstBlock.boundingBox();
  //     const aspectRatio = firstBlockRect.width / firstBlockRect.height;
  //     expect(blockAfterResized.width).toBeGreaterThan(firstBlockRect.width);
  //     expect(blockAfterResized.height).toBeGreaterThan(firstBlockRect.height);
  //     expect((blockAfterResized.width / blockAfterResized.height).toFixed(2)).toEqual(aspectRatio.toFixed(2));
  //   });

  //   await test.step("Kéo rộng góc của block ở row 1 > viền row", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = conf.caseConf.edge_more_than_row;
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.bottom_right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width, height sau khi resize", async () => {
  //     const blockAfterResized = await firstBlock.boundingBox();
  //     const expectedHeightAfterResized = Math.round(
  //       (blockAfterResized.width * firstBlockRect.height) / firstBlockRect.width,
  //     );
  //     const expectedWidthAfterResized = Math.round(
  //       (blockAfterResized.height * firstBlockRect.width) / firstBlockRect.height,
  //     );
  //     expect(Math.round(blockAfterResized.width)).toEqual(expectedWidthAfterResized);
  //     expect(Math.round(blockAfterResized.height)).toEqual(expectedHeightAfterResized);
  //   });

  //   await test.step("Kéo hẹp góc block của row 1 hết cỡ", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = conf.caseConf.edge_min;
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.bottom_right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width, height sau khi resize", async () => {
  //     await block.switchToTab("Design");
  //     const blockAfterResized = await firstBlock.boundingBox();
  //     const expectedWidthAfterResized = Math.round(
  //       (blockAfterResized.height * firstBlockRect.width) / firstBlockRect.height,
  //     );
  //     const expectedHeight = parseFloat(
  //       await block.genLoc(`${block.getSelectorByLabel("height")}//input`).inputValue(),
  //     );
  //     expect(Math.round(blockAfterResized.width)).toEqual(expectedWidthAfterResized);
  //     expect(Math.round(blockAfterResized.height)).toEqual(Math.round(expectedHeight));
  //   });

  //   await test.step("Kéo rộng chiều ngang block 1 ở row 2 <= viền row", async () => {
  //     secondBlockRect = await secondBlock.boundingBox();
  //     resizePosition = { x: conf.caseConf.width_less_than_row2 };
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.left,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify height image và width của block", async () => {
  //     await block.switchToTab("Design");
  //     const boxAfterResized = await secondBlock.boundingBox();
  //     const expectedWidth = parseFloat(
  //      await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue());
  //     expect(Math.round(boxAfterResized.width)).toBe(Math.round(expectedWidth));
  //     expect(Math.round(boxAfterResized.height)).toEqual(Math.round(secondBlockRect.height));
  //   });

  //   await test.step("Kéo rộng chiều ngang block 1 của row 2 > viền row", async () => {
  //     secondBlockRect = await secondBlock.boundingBox();
  //     resizePosition = { x: conf.caseConf.width_more_than_row2 };
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.left,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width block không thể kéo thêm", async () => {
  //     const boxAfterResized = await secondBlock.boundingBox();
  //     const expectedWidth = parseFloat(
  //      await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue());
  //     expect(Math.round(boxAfterResized.width)).toBe(expectedWidth);
  //   });

  //   await test.step("Kéo hẹp chiều ngang block 1 của row 2 hết cỡ", async () => {
  //     secondBlockRect = await secondBlock.boundingBox();
  //     resizePosition = { x: conf.caseConf.resize_width_min };
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify min width block, height row và chữ tự động drop xuống", async () => {
  //     const blockAfterResized = await secondBlock.boundingBox();
  //     const expectedWidth = parseFloat(
  //      await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue());
  //     expect(Math.round(blockAfterResized.height)).toEqual(Math.round(secondBlockRect.height));
  //     expect(Math.round(blockAfterResized.width)).toEqual(expectedWidth);
  //   });

  //   await test.step("Kéo rộng chiều dọc block 1 ở row 2", async () => {
  //     secondBlockRect = await secondBlock.boundingBox();
  //     resizePosition = { y: conf.caseConf.resize_height };
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.top,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify block after resized", async () => {
  //     const blockAfterResized = await secondBlock.boundingBox();
  //     const expectedHeight = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("height")}//input`).inputValue()),
  //     );
  //     expect(blockAfterResized.x).toEqual(secondBlockRect.x);
  //     expect(blockAfterResized.y).not.toEqual(secondBlockRect.y);
  //     expect(Math.round(blockAfterResized.height)).toEqual(expectedHeight);
  //     expect(blockAfterResized.width).toEqual(secondBlockRect.width);
  //   });

  //   await test.step("Kéo hẹp chiều dọc block 1 ở row 2 hết cỡ", async () => {
  //     secondBlockRect = await secondBlock.boundingBox();
  //     resizePosition = { y: conf.caseConf.resize_height_min };
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.bottom,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify block after resized", async () => {
  //     const blockAfterResized = await secondBlock.boundingBox();
  //     const expectedHeight = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("height")}//input`).inputValue()),
  //     );
  //     expect(blockAfterResized.x).toEqual(secondBlockRect.x);
  //     expect(Math.round(blockAfterResized.height)).toEqual(expectedHeight);
  //     expect(blockAfterResized.width).toEqual(secondBlockRect.width);
  //   });

  //   await test.step("Kéo rộng góc của block 1 ở row 2 < viền row ", async () => {
  //     secondBlockRect = await secondBlock.boundingBox();
  //     resizePosition = conf.caseConf.edge_less_than_row;
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.bottom_right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width, height & ratio sau khi resize", async () => {
  //     const blockAfterResized = await secondBlock.boundingBox();
  //     const aspectRatio = secondBlockRect.width / secondBlockRect.height;
  //     expect(blockAfterResized.width).toBeGreaterThan(secondBlockRect.width);
  //     expect(blockAfterResized.height).toBeGreaterThan(secondBlockRect.height);
  //     expect((blockAfterResized.width / blockAfterResized.height).toFixed(1)).toEqual(aspectRatio.toFixed(1));
  //   });

  //   await test.step("Kéo rộng góc của block 1 ở row 2 > viền row", async () => {
  //     secondBlockRect = await secondBlock.boundingBox();
  //     resizePosition = conf.caseConf.edge_more_than_row;
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.top_right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width, height sau khi resize", async () => {
  //     const blockAfterResized = await secondBlock.boundingBox();
  //     const expectedHeightAfterResized = Math.round(
  //       (blockAfterResized.width * secondBlockRect.height) / secondBlockRect.width,
  //     );
  //     const expectedWidth = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()),
  //     );
  //     expect(Math.round(blockAfterResized.width)).toEqual(expectedWidth);
  //     expect(Math.round(blockAfterResized.height)).toEqual(expectedHeightAfterResized);
  //   });

  //   await test.step("Kéo hẹp góc block 1 của row 2 hết cỡ", async () => {
  //     secondBlockRect = await secondBlock.boundingBox();
  //     resizePosition = conf.caseConf.edge_min;
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.bottom_right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width, height sau khi resize", async () => {
  //     const blockAfterResized = await secondBlock.boundingBox();
  //     const expectedWidthAfterResized = Math.round(
  //       (blockAfterResized.height * secondBlockRect.width) / secondBlockRect.height,
  //     );
  //     const expectedHeight = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("height")}//input`).inputValue()),
  //     );
  //     expect(Math.round(blockAfterResized.width)).toEqual(expectedWidthAfterResized);
  //     expect(Math.round(blockAfterResized.height)).toEqual(expectedHeight);
  //   });
  // });

  test("@SB_WEB_BUILDER_RESIZE_BLOCK_21 - Block container_Resize block container + có chứa block ở trong", async ({
    conf,
  }) => {
    const sConf = conf.suiteConf;
    const resizePointer = conf.suiteConf.resize;
    await test.step("Pre-condition: add block vào trong block container", async () => {
      await webBuilder.clickBtnNavigationBar("insert");
      await webBuilder.searchbarTemplate.clear();
      await webBuilder.insertSectionBlock({
        parentPosition: sConf.first_block,
        template: "Toggle list",
      });
    });

    const sectionRect = await section.boundingBox();
    const toggleListRect = await secondBlock.boundingBox();
    const containerRect = await firstBlock.boundingBox();
    await test.step("Kéo hẹp chiều rộng block container", async () => {
      resizePosition = { x: sectionRect.width };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.left,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify chiều rộng block bên trong container không thay đổi", async () => {
      const toggleListRectAfterResized = await secondBlock.boundingBox();
      const containerRectAfterResized = await firstBlock.boundingBox();
      expect(toggleListRectAfterResized.width).toEqual(toggleListRect.width);
      expect(containerRectAfterResized.height).toEqual(containerRect.height);
    });
  });
});
