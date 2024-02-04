import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { Locator } from "@playwright/test";
import { ShopTheme } from "@types";

let webBuilder: WebBuilder,
  block: Blocks,
  themeTest: ShopTheme,
  firstRow: Locator,
  firstBlock: Locator,
  resizePosition: { x?: number; y?: number };

test.describe("@RESIZE_BLOCK_IMG - Resize block image", () => {
  test.beforeEach(async ({ dashboard, conf, theme }) => {
    const sConf = conf.suiteConf;
    webBuilder = new WebBuilder(dashboard, sConf.domain);
    block = new Blocks(dashboard, sConf.domain);
    firstRow = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(sConf.first_row));
    firstBlock = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(sConf.first_block));

    await test.step("Open web builder", async () => {
      const themeList = await theme.list();
      themeTest = themeList.find(theme => theme.name === sConf.theme_test);
      await webBuilder.openWebBuilder({ type: "site", id: themeTest.id, page: "home" });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
    });

    await test.step("Pre-condition: Add block Image with no padding to row 1", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        template: "Image",
      });
    });
  });

  test("@SB_WEB_BUILDER_RESIZE_BLOCK_04 - Block image_Resize block Image", async ({ conf }) => {
    test.slow();
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

    await test.step("Verify height image và width của block", async () => {
      await block.switchToTab("Design");
      const boxAfterResized = await firstBlock.boundingBox();
      const expectedWidthPercent =
        parseFloat(await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()) / 100;
      expect(Math.round(boxAfterResized.width)).toBe(Math.round(expectedWidthPercent * firstRowRect.width));
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
      expect(Math.round(firstBlockAfterResized.width)).toEqual(expected.block_min_width);
    });

    await test.step("Kéo rộng chiều dọc block row 1", async () => {
      firstBlockRect = await firstBlock.boundingBox();
      resizePosition = { y: conf.caseConf.resize_height };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.top,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify block after resized", async () => {
      await block.switchToTab("Design");
      const blockAfterResized = await firstBlock.boundingBox();
      expect(blockAfterResized.x).toEqual(firstBlockRect.x);
      expect(blockAfterResized.width).toEqual(firstBlockRect.width);
    });

    await test.step("Kéo hẹp chiều dọc block ở row 1 hết cỡ", async () => {
      firstBlockRect = await firstBlock.boundingBox();
      resizePosition = { y: conf.caseConf.resize_height_min };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.bottom,
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
        at_position: resizePointer.bottom_right,
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
   * Update position manual bỏ khỏi RC
   */
  // test("@SB_WEB_BUILDER_RESIZE_BLOCK_05 - Block image_Resize block image + static = OFF", async ({ conf }) => {
  //   test.slow(); // FLow dài cần tăng timeout
  //   const resizePointer = conf.suiteConf.resize;
  //   const positionManual = conf.caseConf.position_manual;

  //   await test.step("Pre-condition: Chuyển block sang Manual", async () => {
  //     await secondBlock.click();
  //     await block.changeDesign(positionManual);
  //     await firstBlock.click();
  //     await block.changeDesign(positionManual);
  //   });
  //   const firstRowRect = await firstRow.boundingBox();
  //   let firstBlockRect = await firstBlock.boundingBox(),
  //     secondBlockRect = await secondBlock.boundingBox();
  //   await webBuilder.dragBlockInWebBuilder(firstBlock, firstRow, {
  //     sourcePosition: { x: firstBlockRect.width - 10, y: 10 },
  //     targetPosition: { x: firstRowRect.width * 0.6, y: 0 },
  //   });

  //   await test.step("Kéo rộng chiều ngang block ở row 1 <= viền row", async () => {
  //     resizePosition = { x: conf.caseConf.width_less_than_row };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.left,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify height image và width của block", async () => {
  //     const boxAfterResized = await firstBlock.boundingBox();
  //     const expectedWidth = parseFloat(
  //      await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue());
  //     expect(Math.round(boxAfterResized.width)).toBe(Math.round(expectedWidth));
  //     expect(Math.round(boxAfterResized.height)).toBeGreaterThan(Math.round(firstBlockRect.height));
  //   });

  //   await test.step("Kéo rộng chiều ngang block row 1 > viền row", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = { x: conf.caseConf.width_more_than_row };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width block không thể kéo thêm", async () => {
  //     const boxAfterResized = await firstBlock.boundingBox();
  //     expect(Math.round(boxAfterResized.width)).toBeGreaterThan(firstRowRect.width);
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
  //     expect(Math.round(firstBlockAfterResized.height)).toBeLessThan(Math.round(firstBlockRect.height));
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
  //     await webBuilder.changeDesign({
  //       width: { label: "width", value: { value: 80 } },
  //       height: { label: "height", value: { value: 80 } },
  //     });
  //     await webBuilder.backBtn.click();
  //   });

  //   await test.step("Kéo rộng góc của block ở row 1 < viền row ", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = conf.caseConf.edge_less_than_row;
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
  //       at_position: resizePointer.top_right,
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
  //     const boxAfterResized = await secondBlock.boundingBox();
  //     const expectedWidth = parseFloat(
  //      await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue());
  //     expect(Math.round(boxAfterResized.width)).toBe(Math.round(expectedWidth));
  //     expect(Math.round(boxAfterResized.height)).toBeLessThan(Math.round(secondBlockRect.height));
  //   });

  //   await test.step("Kéo rộng chiều ngang block 1 của row 2 > viền row", async () => {
  //     secondBlockRect = await secondBlock.boundingBox();
  //     resizePosition = { x: conf.caseConf.width_more_than_row2 };
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.right,
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
  //     expect(Math.round(blockAfterResized.height)).toBeLessThan(Math.round(secondBlockRect.height));
  //     expect(Math.round(blockAfterResized.width)).toEqual(Math.round(expectedWidth));
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
  //     expect(blockAfterResized.width / blockAfterResized.height).toBeLessThanOrEqual(aspectRatio + 0.1);
  //     expect(blockAfterResized.width / blockAfterResized.height).toBeGreaterThanOrEqual(aspectRatio - 0.1);
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
  //     expect(Math.round(blockAfterResized.width)).toEqual(Math.round(expectedWidth));
  //     expect(Math.round(blockAfterResized.height)).toEqual(expectedHeightAfterResized);
  //   });

  //   await test.step("Kéo hẹp block 1 của row 2 hết cỡ", async () => {
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
  //     expect(Math.round(blockAfterResized.height)).toEqual(Math.round(expectedHeight));
  //   });
  // });

  test("@SB_WEB_BUILDER_RESIZE_BLOCK_06 - Block image_Resize block image + có setting width height trên sidebar", async ({
    conf,
  }) => {
    const firstBlockRect = await firstBlock.boundingBox();
    const aspectRatio = firstBlockRect.width / firstBlockRect.height;
    for (const data of conf.caseConf.width_block) {
      await test.step(`Setting trên sidebar width block ${data.title}`, async () => {
        await firstBlock.click();
        await block.changeDesign(data);
      });

      await test.step("Verify ratio và width block web front", async () => {
        const blockRectAfterResized = await firstBlock.boundingBox();
        const expectedHeight = blockRectAfterResized.width / aspectRatio;
        expect(Math.round(blockRectAfterResized.width)).toEqual(data.expected_width);
        expect(blockRectAfterResized.height.toFixed(1)).toEqual(expectedHeight.toFixed(1));
      });
    }
  });
});
