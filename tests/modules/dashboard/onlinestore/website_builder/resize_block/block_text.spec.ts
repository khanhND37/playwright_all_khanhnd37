import { verifyWidthHeightCSSInRange } from "@core/utils/css";
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
  topResizer: Locator,
  bottomResizer: Locator,
  topLeftResizer: Locator,
  bottomLeftResizer: Locator,
  topRightResizer: Locator,
  bottomRightResizer: Locator,
  resizePosition: { x?: number; y?: number };

test.describe("@RESIZE_BLOCK_TEXT - Resize block text", () => {
  test.beforeEach(async ({ dashboard, conf, theme }) => {
    const sConf = conf.suiteConf;
    webBuilder = new WebBuilder(dashboard, sConf.domain);
    block = new Blocks(dashboard, sConf.domain);
    firstRow = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(sConf.first_row));
    firstBlock = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex(sConf.first_block));
    topResizer = block.getResizerInLivePreview("top");
    bottomResizer = block.getResizerInLivePreview("bottom");
    topLeftResizer = block.getResizerInLivePreview("top-left");
    bottomLeftResizer = block.getResizerInLivePreview("bottom-left");
    topRightResizer = block.getResizerInLivePreview("top-right");
    bottomRightResizer = block.getResizerInLivePreview("bottom-right");

    await test.step("Open web builder", async () => {
      const themeList = await theme.list();
      themeTest = themeList.find(theme => theme.name === sConf.theme_test);
      await webBuilder.openWebBuilder({ type: "site", id: themeTest.id, page: "home" });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
    });

    await test.step("Pre-condition: Add block Heading with no padding to row 1", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        template: "Heading",
      });
      await block.fillTextBlock(firstBlock, sConf.heading_text);
    });
  });

  test("@SB_WEB_BUILDER_RESIZE_BLOCK_01 - Block text_Resize block text", async ({ conf }) => {
    const expected = conf.caseConf.expected;
    const resizePointer = conf.suiteConf.resize;
    const firstRowRect = await firstRow.boundingBox();
    const firstBlockRect = await firstBlock.boundingBox();
    await test.step("Kéo rộng chiều ngang block ở row 1 <= viền row", async () => {
      resizePosition = { x: conf.caseConf.resize_less_than_row };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.left,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify font size text và width của block", async () => {
      const boxAfterResized = await firstBlock.boundingBox();
      const expectedWidth = Math.round(
        parseFloat(await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()),
      );
      await expect(firstBlock.getByText(conf.suiteConf.heading_text)).toHaveCSS("font-size", expected.font_size);
      expect(Math.round(boxAfterResized.width)).toBe(expectedWidth);
    });

    await test.step("Kéo rộng chiều ngang block row 1 > viền row", async () => {
      resizePosition = { x: conf.caseConf.resize_more_than_row };
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
      resizePosition = { x: conf.caseConf.resize_min };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.right,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify min width block, height row và chữ tự động drop xuống", async () => {
      const firstBlockAfterResized = await firstBlock.boundingBox();
      const firstRowAfterResized = await webBuilder.getBoundingBox(firstRow);
      expect(firstBlockAfterResized.height).toBeGreaterThan(firstBlockRect.height);
      expect(Math.round(firstBlockAfterResized.width)).toEqual(expected.block_min_width);
      expect(firstRowAfterResized.height).toBeGreaterThan(firstRowRect.height);
    });

    await test.step("Verify không kéo resize được chiều dọc và 4 góc", async () => {
      await expect(topResizer).toBeHidden();
      await expect(bottomResizer).toBeHidden();
      await expect(topLeftResizer).toBeHidden();
      await expect(topRightResizer).toBeHidden();
      await expect(bottomLeftResizer).toBeHidden();
      await expect(bottomRightResizer).toBeHidden();
    });
  });

  /**
   * Update position manual bỏ khỏi RC
   */
  // test("@SB_WEB_BUILDER_RESIZE_BLOCK_02 - Block text_Resize block text + static = OFF", async ({ conf }) => {
  //   const expected = conf.caseConf.expected;
  //   const sConf = conf.suiteConf;
  //   const resizePointer = sConf.resize;
  //   await test.step("Pre-condition: Chuyển block sang manual", async () => {
  //     await firstBlock.click();
  //     await block.changeDesign(conf.caseConf.position_manual);
  //     await block.fillTextBlock(firstBlock, conf.caseConf.heading_text_manual);
  //     await webBuilder.waitAbit(300); //Hành động sau quá nhanh nên cần wait
  //     await firstBlock.dragTo(section, {
  //       sourcePosition: { x: 5, y: 5 },
  //       targetPosition: { x: 5, y: 5 },
  //     });
  //     await thirdBlock.click();
  //     await block.changeDesign(conf.caseConf.position_manual);
  //     await block.fillTextBlock(thirdBlock, conf.caseConf.heading_text_manual);
  //     await secondBlock.click();
  //     await block.changeDesign(conf.caseConf.position_manual);
  //     await block.fillTextBlock(secondBlock, conf.caseConf.heading_text_manual);
  //   });

  //   const firstRowRect = await webBuilder.getBoundingBox(firstRow);
  //   const secondRowRect = await webBuilder.getBoundingBox(secondRow);
  //   const firstBlockRect = await firstBlock.boundingBox();
  //   await test.step("Kéo rộng chiều ngang block ở row 1 <= viền row", async () => {
  //     resizePosition = { x: conf.caseConf.resize_less_than_row };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify font size text, width của block", async () => {
  //     const boxAfterResized = await firstBlock.boundingBox();
  //     const expectedWidth = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()),
  //     );
  //     const fontSizeAfterResizeBlock = await firstBlock.evaluate(
  //       () => getComputedStyle(document.querySelector("h1")).fontSize,
  //     );
  //     expect(fontSizeAfterResizeBlock).toBe(expected.font_size);
  //     expect(Math.round(boxAfterResized.width)).toBe(expectedWidth);
  //   });

  //   await test.step("Kéo rộng chiều ngang block row 1 > viền row", async () => {
  //     resizePosition = { x: conf.caseConf.resize_more_than_row };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width block không bị giới hạn theo row và text đẩy lên 1 dòng khi width tăng",
  //    async () => {
  //     const boxAfterResized = await firstBlock.boundingBox();
  //     const textHeightAfterResize = await firstBlock.evaluate(() => {
  //       const height = getComputedStyle(document.querySelector("h1")).height;
  //       return parseInt(height.replace("px", ""));
  //     });
  //     expect(boxAfterResized.width).toBeGreaterThan(firstRowRect.width);
  //     expect(Math.round(textHeightAfterResize / firstBlockRect.height)).toEqual(expected.one_line);
  //   });

  //   await test.step("Kéo hẹp chiều ngang block của row 1 hết cỡ", async () => {
  //     resizePosition = { x: conf.caseConf.resize_min };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.left,
  //       to_specific_point: { x: 1600 },
  //     });
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify min width block, height row và chữ tự động drop xuống", async () => {
  //     const firstBlockAfterResized = await firstBlock.boundingBox();
  //     const firstRowAfterResized = await webBuilder.getBoundingBox(firstRow);
  //     expect(firstBlockAfterResized.width).toEqual(expected.block_min_width);
  //     expect(firstBlockAfterResized.height).toBeGreaterThan(firstBlockRect.height);
  //     expect(firstRowAfterResized.height).toEqual(firstRowRect.height);
  //   });

  //   await test.step("Verify không kéo resize được chiều dọc và 4 góc", async () => {
  //     await expect(topResizer).toBeHidden();
  //     await expect(bottomResizer).toBeHidden();
  //     await expect(topLeftResizer).toBeHidden();
  //     await expect(topRightResizer).toBeHidden();
  //     await expect(bottomLeftResizer).toBeHidden();
  //     await expect(bottomRightResizer).toBeHidden();
  //   });

  //   await test.step("Kéo chiều ngang block 1 của row 2 <= viền row 2", async () => {
  //     resizePosition = { x: conf.caseConf.resize_less_than_row2 };
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify font size text, width block ", async () => {
  //     const boxAfterResized = await secondBlock.boundingBox();
  //     const expectedWidth = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()),
  //     );
  //     const fontSizeAfterResizeBlock = await secondBlock.evaluate(
  //       () => getComputedStyle(document.querySelector("h1")).fontSize,
  //     );
  //     expect(fontSizeAfterResizeBlock).toBe(expected.font_size);
  //     expect(Math.round(boxAfterResized.width)).toBe(expectedWidth);
  //   });

  //   await test.step("Kéo rộng chiều ngang block row 2 > viền row", async () => {
  //     resizePosition = { x: conf.caseConf.resize_more_than_row2_left };
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.left,
  //       to_specific_point: resizePosition,
  //     });
  //     resizePosition = { x: conf.caseConf.resize_more_than_row2_right };
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width block có thể kéo lớn hơn width row", async () => {
  //     const boxAfterResized = await secondBlock.boundingBox();
  //     expect(boxAfterResized.width).toBeGreaterThan(secondRowRect.width);
  //   });
  // });

  test("@SB_WEB_BUILDER_RESIZE_BLOCK_03 - Block text_Resize block text + có setting width height trên sidebar", async ({
    conf,
  }) => {
    const expected = conf.caseConf.expected;
    for (const data of conf.caseConf.width_height_percent) {
      await test.step(`Setting width/height của block trên sidebar theo %: ${data.title}`, async () => {
        await firstBlock.click();
        await block.changeDesign(data);
        await block.backBtn.click();
      });

      const firstRowRect = await firstRow.boundingBox();
      await test.step(`Verify block width/height equal ${data.title} of row width/height`, async () => {
        const boxAfterResized = await firstBlock.boundingBox();
        expect(Math.round(boxAfterResized.width)).toEqual(Math.round(data.expected.percent * firstRowRect.width));
        expect(Math.round(boxAfterResized.height)).toEqual(
          Math.round(data.expected.percent * (firstRowRect.height - 32)), //padding top/bottom 16px
        );
      });
    }

    await test.step("Setting width/height của block trên sidebar theo Px", async () => {
      await firstBlock.click();
      await block.changeDesign(conf.caseConf.width_height_px);
    });

    await test.step("Verify width/height block max", async () => {
      const boxAfterResized = await firstBlock.boundingBox();
      expect(Math.round(boxAfterResized.width)).toBe(expected.max_width);
      expect(Math.round(boxAfterResized.height)).toBe(expected.max_height);
    });

    for (const data of conf.caseConf.width_height_auto_fill) {
      await test.step(`Setting width/height của block trên sidebar ${data.title}`, async () => {
        await firstBlock.click();
        await block.changeDesign(data);
      });

      await test.step(`Verify block width/height equal ${data.title} of row width/height`, async () => {
        const boxAfterResized = await firstBlock.boundingBox();
        await verifyWidthHeightCSSInRange(firstBlock, "width", {
          min: data.expected.width.min,
          max: data.expected.width.max,
        });
        expect(Math.round(boxAfterResized.height)).toEqual(Math.round(data.expected.height));
      });
    }
  });
});
