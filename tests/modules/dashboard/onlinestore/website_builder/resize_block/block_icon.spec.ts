import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { Locator } from "@playwright/test";
import { ShopTheme } from "@types";

let webBuilder: WebBuilder,
  block: Blocks,
  themeTest: ShopTheme,
  firstBlock: Locator,
  topResizer: Locator,
  bottomResizer: Locator,
  topLeftResizer: Locator,
  bottomLeftResizer: Locator,
  topRightResizer: Locator,
  bottomRightResizer: Locator,
  resizePosition: { x?: number; y?: number };
const softAssertion = expect.configure({ soft: true });

test.describe("@RESIZE_BLOCK_ICON - Resize block icon", () => {
  test.beforeEach(async ({ dashboard, conf, theme }) => {
    const sConf = conf.suiteConf;
    webBuilder = new WebBuilder(dashboard, sConf.domain);
    block = new Blocks(dashboard, sConf.domain);
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

    await test.step("Pre-condition: Add block Icon with no padding to row 1", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        template: "Icon",
      });
      await webBuilder.backBtn.click();
    });
  });

  test("@SB_WEB_BUILDER_RESIZE_BLOCK_10 - Block Icon_Resize block icon", async ({ conf }) => {
    test.slow();
    const expected = conf.caseConf.expected;
    const resizePointer = conf.suiteConf.resize;
    let firstBlockRect = await firstBlock.boundingBox();
    const aspectRatioFirstBlock = firstBlockRect.width / firstBlockRect.height;

    await test.step("Kéo rộng chiều ngang block ở row 1 <= viền row", async () => {
      resizePosition = { x: conf.caseConf.resize_less_than_row };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.left,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify width, height của block", async () => {
      await block.switchToTab("Design");
      const boxAfterResized = await firstBlock.boundingBox();
      const expectedWidth = Math.round(
        parseFloat(await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()),
      );
      softAssertion(Math.round(boxAfterResized.width)).toBe(expectedWidth);
      softAssertion(boxAfterResized.height).toEqual(Math.round(boxAfterResized.width / aspectRatioFirstBlock));
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
      softAssertion(Math.round(boxAfterResized.width)).toBe(expected.block_max_width);
      softAssertion(boxAfterResized.height).toEqual(Math.round(boxAfterResized.width / aspectRatioFirstBlock));
    });

    await test.step("Kéo hẹp chiều ngang block của row 1 hết cỡ", async () => {
      firstBlockRect = await firstBlock.boundingBox();
      resizePosition = { x: conf.caseConf.resize_min };
      await block.resizeBlock(firstBlock, {
        at_position: resizePointer.right,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify min width block, height row", async () => {
      const firstBlockAfterResized = await firstBlock.boundingBox();
      softAssertion(Math.round(firstBlockAfterResized.width)).toEqual(expected.block_min_width);
      softAssertion(firstBlockAfterResized.height).toEqual(firstBlockAfterResized.width / aspectRatioFirstBlock);
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
  // test("@SB_WEB_BUILDER_RESIZE_BLOCK_11 - Block Icon_Resize block icon + static = OFF", async ({ conf }) => {
  //   test.slow();
  //   const expected = conf.caseConf.expected;
  //   const resizePointer = conf.suiteConf.resize;
  //   const positionManual = conf.caseConf.position_manual;
  //   const firstRowRect = await webBuilder.getBoundingBox(firstRow);
  //   const secondRowRect = await webBuilder.getBoundingBox(secondRow);
  //   const firstIcon = block.frameLocator.locator(":nth-match(i.material-icons, 1)");
  //   const secondIcon = block.frameLocator.locator(":nth-match(i.material-icons, 2)");
  //   let firstBlockRect = await firstBlock.boundingBox();
  //   const firstIconRect = await firstIcon.boundingBox(),
  //     secondIconRect = await secondIcon.boundingBox();
  //   const aspectRatio1 = firstIconRect.width / firstIconRect.height;
  //   const aspectRatio2 = secondIconRect.width / secondIconRect.height;

  //   await test.step("Pre-condition: Chuyển block sang manual", async () => {
  //     await firstBlock.click();
  //     await block.changeDesign(positionManual);
  //     await firstBlock.dragTo(section, {
  //       targetPosition: { x: 10, y: 10 },
  //     });
  //     await webBuilder.backBtn.click();
  //     await thirdBlock.click();
  //     await block.changeDesign(positionManual);
  //     await webBuilder.backBtn.click();
  //     await secondBlock.click();
  //     await block.changeDesign(positionManual);
  //   });

  //   await test.step("Kéo rộng chiều ngang block ở row 1 <= viền row", async () => {
  //     await firstBlock.click({ position: { x: 1, y: 1 } });
  //     resizePosition = { x: conf.caseConf.resize_less_than_row };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width của block", async () => {
  //     await block.switchToTab("Design");
  //     const boxAfterResized = await firstBlock.boundingBox();
  //     const expectedWidth = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()),
  //     );
  //     softAssertion(Math.round(boxAfterResized.width)).toEqual(expectedWidth);
  //   });

  //   await test.step("Kéo rộng chiều ngang block row 1 > viền row", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = { x: conf.caseConf.resize_more_than_row };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width block không bị giới hạn theo row", async () => {
  //     const boxAfterResized = await firstBlock.boundingBox();
  //     softAssertion(boxAfterResized.width).toBeGreaterThan(firstRowRect.width);
  //   });

  //   await test.step("Kéo hẹp chiều ngang block của row 1 hết cỡ", async () => {
  //     firstBlockRect = await firstBlock.boundingBox();
  //     resizePosition = { x: conf.caseConf.resize_min };
  //     await block.resizeBlock(firstBlock, {
  //       at_position: resizePointer.left,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify min width block, height row", async () => {
  //     const firstBlockAfterResized = await firstBlock.boundingBox();
  //     const firstIconAfterResized = await firstIcon.boundingBox();
  //     softAssertion(firstBlockAfterResized.width).toEqual(expected.block_min_width);
  //     softAssertion(firstBlockAfterResized.height).toBeLessThan(firstBlockRect.height);
  //     softAssertion(firstIconAfterResized.width / firstIconAfterResized.height).toEqual(aspectRatio1);
  //   });

  //   await test.step("Verify không kéo resize được chiều dọc và 4 góc", async () => {
  //     await expect(topResizer).toBeHidden();
  //     await expect(bottomResizer).toBeHidden();
  //     await expect(topLeftResizer).toBeHidden();
  //     await expect(topRightResizer).toBeHidden();
  //     await expect(bottomLeftResizer).toBeHidden();
  //     await expect(bottomRightResizer).toBeHidden();
  //     await block.backBtn.click();
  //   });

  //   await test.step("Kéo chiều ngang block 1 của row 2 <= viền row 2", async () => {
  //     resizePosition = { x: conf.caseConf.resize_less_than_row2 };
  //     await block.resizeBlock(secondBlock, {
  //       at_position: resizePointer.right,
  //       to_specific_point: resizePosition,
  //     });
  //   });

  //   await test.step("Verify width block ", async () => {
  //     await block.switchToTab("Design");
  //     const boxAfterResized = await secondBlock.boundingBox();
  //     const expectedWidth = Math.round(
  //       parseFloat(await block.genLoc(`${block.getSelectorByLabel("width")}//input`).inputValue()),
  //     );
  //     softAssertion(Math.round(boxAfterResized.width)).toBe(expectedWidth);
  //   });

  //   await test.step("Kéo rộng chiều ngang block 1 row 2 > viền row", async () => {
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
  //     const secondIconAfterResized = await secondIcon.boundingBox();
  //     const actualIconRatio = Math.round(secondIconAfterResized.width) / Math.round(secondIconAfterResized.height);
  //     const boxAfterResized = await secondBlock.boundingBox();
  //     softAssertion(boxAfterResized.width).toBeGreaterThan(secondRowRect.width);
  //     softAssertion(actualIconRatio).toEqual(aspectRatio2);
  //   });
  // });

  test("@SB_WEB_BUILDER_RESIZE_BLOCK_12 - Block Icon_Resize block icon + có setting width height trên sidebar", async ({
    conf,
  }) => {
    for (const data of conf.caseConf.width_height_icon) {
      await test.step(`Setting width/height của block trên sidebar ${data.title}`, async () => {
        await firstBlock.click();
        await block.changeDesign(data);
      });

      await test.step(`Verify block width/height`, async () => {
        const boxAfterResized = await firstBlock.boundingBox();
        softAssertion(Math.round(boxAfterResized.width)).toEqual(data.expected.width);
        softAssertion(Math.round(boxAfterResized.height)).toEqual(data.expected.height);
      });
    }
  });
});
