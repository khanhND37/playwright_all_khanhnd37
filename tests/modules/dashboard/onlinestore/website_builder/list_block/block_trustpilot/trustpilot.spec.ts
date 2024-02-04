import { expect, test } from "@fixtures/website_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { ShopTheme } from "@types";
import { FrameLocator } from "@playwright/test";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";

test.describe("Verify Trustpilot block @SB_WEB_BUILDER_LB_TP", () => {
  let webBuilder: WebBuilder,
    themes: ThemeEcom,
    blocks: Blocks,
    duplicatedTheme: ShopTheme,
    frameLocator: FrameLocator,
    accessToken: string,
    settingData,
    expectData,
    resizePosition: { x?: number; y?: number };

  test.beforeEach(async ({ dashboard, conf, theme, token }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    frameLocator = webBuilder.frameLocator;
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    settingData = conf.caseConf.data;
    expectData = conf.caseConf.expect;

    await test.step("Pre-condition: Duplicate theme đã được set data và publish theme vừa duplicate", async () => {
      const publishedTheme = await theme.getPublishedTheme();
      if (publishedTheme.id !== conf.suiteConf.theme_test) {
        await theme.publish(conf.suiteConf.theme_test);
      }

      const { access_token: shopToken } = await token.getWithCredentials({
        domain: conf.suiteConf.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      accessToken = shopToken;
      await themes.deleteAllThemesUnPublish(accessToken);

      duplicatedTheme = await theme.duplicate(conf.suiteConf.theme_test);
      await theme.publish(duplicatedTheme.id);
    });

    await test.step("Open web builder", async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: duplicatedTheme.id,
      });
      await webBuilder.loadingScreen.waitFor({ state: "hidden" });
    });
  });

  test(`@SB_WEB_BUILDER_LB_TP_02 Verify default data của block [Trustpilot]`, async ({
    dashboard,
    snapshotFixture,
    context,
  }) => {
    const blockSelector = webBuilder.getSelectorByIndex({ section: 1, block: 1 });

    await test.step("Ở section 1, kéo thả block trustpilot", async () => {
      await webBuilder.clickBtnNavigationBar("insert");
      await webBuilder.dragAndDropInWebBuilder(settingData.section_1.dnd_block);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: expectData.preview_desktop,
        combineOptions: {
          fullPage: true,
          maxDiffPixelRatio: 0.0005,
        },
      });
    });

    await test.step(`Click icon Mobile nằm ở Navigation bar`, async () => {
      await webBuilder.switchMobileBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: expectData.preview_mobile,
        combineOptions: {
          fullPage: true,
          maxDiffPixelRatio: 0.0005,
        },
      });
    });

    await test.step(`Save and Verify block trustpilot in SF`, async () => {
      await webBuilder.clickSave();
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: blocks.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.locator(blocks.progressBar).waitFor({ state: "detached" });
      await expect(storefront.locator(blocks.blockTrustPilot)).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_LB_TP_03 Verify block [Trustpilot] có domain plan Free`, async ({
    dashboard,
    snapshotFixture,
    context,
    conf,
  }) => {
    for (const block of settingData.section_1.dnd_blocks) {
      await test.step("Ở section 1, kéo thả block trustpilot > Nhập domain tồn tại ở Trustpilot với domain shop có plan = free", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
        await webBuilder.dragAndDropInWebBuilder(block);
        await webBuilder.inputTextBox("trustpilot", block.trustpilot.domain);
        await dashboard.keyboard.press("Enter");
        await webBuilder.waitForXpathState(blocks.typeTrustPilot, "stable");
      });
      if (block.trustpilot.type) {
        await test.step("Click dropdown type", async () => {
          await dashboard.locator(blocks.typeTrustPilot).click();
          for (const type of block.trustpilot.type) {
            await expect(dashboard.locator(blocks.getXpathImageType(type))).toBeVisible();
          }
        });
      }
      if (block.trustpilot.select_type) {
        await test.step("Click dropdown type", async () => {
          await dashboard.locator(blocks.typeTrustPilot).click();
          await dashboard.locator(blocks.getXpathImageType(block.trustpilot.select_type)).click();
          await webBuilder.waitForXpathState(blocks.typeTrustPilot, "stable");
        });
      }
    }

    await snapshotFixture.verifyWithAutoRetry({
      page: dashboard,
      snapshotName: expectData.preview,
      combineOptions: {
        fullPage: true,
        maxDiffPixelRatio: 0.0005,
      },
    });

    await test.step(`Click button Save`, async () => {
      await webBuilder.clickSave();
    });

    const storefront = await verifyRedirectUrl({
      page: dashboard,
      selector: blocks.xpathButtonPreview,
      redirectUrl: "?theme_preview_id",
      context,
    });

    await test.step(`Verify block trustpilot in SF`, async () => {
      await storefront.locator(blocks.progressBar).waitFor({ state: "detached" });
      webBuilder = new WebBuilder(storefront, conf.suiteConf.domain);
      await webBuilder.waitForXpathState(blocks.blockTrustPilot, "stable");

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        snapshotName: expectData.sf,
        combineOptions: {
          fullPage: true,
          maxDiffPixelRatio: 0.0005,
        },
      });
    });

    await test.step(`Click block trustpilot ngoài SF`, async () => {
      for (const [index, block] of settingData.section_1.dnd_blocks.entries()) {
        if (block.trustpilot.redirect) {
          if (block.trustpilot.redirect) {
            const [newTab] = await Promise.all([
              context.waitForEvent("page"),
              storefront.frameLocator(blocks.getIframeTrustPilot(index)).locator(blocks.imageTrustPilot).click(),
            ]);
            await newTab.waitForLoadState("load");
            await expect(newTab).toHaveURL(block.trustpilot.redirect);
          }
        }
      }
    });
  });

  test(`@SB_WEB_BUILDER_LB_TP_04 Verify block [Trustpilot] có domain plan Standard`, async ({
    dashboard,
    snapshotFixture,
    context,
    conf,
  }) => {
    await test.step("Add block trustpilot for section", async () => {
      await webBuilder.dragAndDropInWebBuilder(settingData.section_1.dnd_blocks);
      for (let i = 0; i < settingData.section_1.dnd_blocks.duplicate; i++) {
        await webBuilder.selectOptionOnQuickBar("Duplicate");
      }
    });

    for (const [block, setting] of settingData.section_1.dnd_blocks.settings_block.entries()) {
      await test.step(setting.description, async () => {
        const blockSelector = webBuilder.getSelectorByIndex({ section: 1, block: block + 1 });
        await frameLocator.locator(blockSelector).click();
        await webBuilder.inputTextBox("trustpilot", setting.domain);
        await dashboard.keyboard.press("Enter");
        await webBuilder.waitForXpathState(blocks.typeTrustPilot, "stable");

        if (setting.type) {
          await test.step("Click dropdown type", async () => {
            await dashboard.locator(blocks.typeTrustPilot).click();
            for (const type of setting.type) {
              await expect(dashboard.locator(blocks.getXpathImageType(type))).toBeVisible();
            }
          });
        }
        if (setting.select_type) {
          await test.step("Click dropdown type", async () => {
            await dashboard.locator(blocks.typeTrustPilot).click();
            await dashboard.locator(blocks.getXpathImageType(setting.select_type)).click();
            await webBuilder.waitForXpathState(blocks.typeTrustPilot, "stable");
          });
        }
      });
    }

    await snapshotFixture.verifyWithAutoRetry({
      page: dashboard,
      snapshotName: expectData.preview,
      combineOptions: {
        fullPage: true,
        maxDiffPixelRatio: 0.0005,
      },
    });

    await test.step(`Click button Save`, async () => {
      await webBuilder.clickSave();
    });

    const storefront = await verifyRedirectUrl({
      page: dashboard,
      selector: blocks.xpathButtonPreview,
      redirectUrl: "?theme_preview_id",
      context,
    });

    await test.step(`Verify block trustpilot in SF`, async () => {
      await storefront.locator(blocks.progressBar).waitFor({ state: "detached" });
      webBuilder = new WebBuilder(storefront, conf.suiteConf.domain);
      await webBuilder.waitForXpathState(blocks.blockTrustPilot, "stable");

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        snapshotName: expectData.sf,
        combineOptions: {
          fullPage: true,
          maxDiffPixelRatio: 0.0005,
        },
      });
    });

    await test.step(`Click block trustpilot ngoài SF`, async () => {
      for (const [index, block] of settingData.section_1.dnd_blocks.settings_block.entries()) {
        if (block.redirect) {
          const [newTab] = await Promise.all([
            context.waitForEvent("page"),
            storefront.frameLocator(blocks.getIframeTrustPilot(index)).locator(blocks.imageTrustPilot).click(),
          ]);
          await newTab.waitForLoadState("load");
          await expect(newTab).toHaveURL(block.redirect);
        }
      }
    });
  });

  test(`@SB_WEB_BUILDER_LB_TP_05 Verify không show block [Trustpilot] với domain không hợp lệ`, async ({
    dashboard,
    context,
  }) => {
    for (const block of settingData.section_1.dnd_blocks) {
      await test.step("Ở section 1, kéo thả block trustpilot > Nhập domain không hợp lệ ở Trustpilot với domain shop có plan = free", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
        await webBuilder.dragAndDropInWebBuilder(block);
        await webBuilder.inputTextBox("trustpilot", block.trustpilot.domain);
        await dashboard.keyboard.press("Enter");
        await webBuilder.waitForXpathState(blocks.typeTrustPilot, "stable");
        await expect(dashboard.locator(webBuilder.getXpathByText(block.trustpilot.message))).toBeVisible();
      });
    }

    await test.step(`Click button Save`, async () => {
      await webBuilder.clickSave();
    });

    const storefront = await verifyRedirectUrl({
      page: dashboard,
      selector: blocks.xpathButtonPreview,
      redirectUrl: "?theme_preview_id",
      context,
    });

    await test.step(`Verify không show block trustpilot ngoài SF`, async () => {
      await storefront.locator(blocks.progressBar).waitFor({ state: "detached" });
      await expect(storefront.locator(blocks.blockTrustPilot)).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_LB_TP_06 - Verify show block [Trustpilot] khi thay đổi data + resize block", async ({
    dashboard,
    snapshotFixture,
    context,
    conf,
  }) => {
    const blockSelector = webBuilder.getSelectorByIndex({ section: 1, block: 1 });

    await test.step("Ở section 1, kéo thả block trustpilot > Nhập domain tồn tại ở TrustPilot với domain standard", async () => {
      await webBuilder.clickBtnNavigationBar("insert");
      await webBuilder.dragAndDropInWebBuilder(settingData.section_1.dnd_block);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await webBuilder.inputTextBox("trustpilot", settingData.domain);
      await dashboard.keyboard.press("Enter");
      await webBuilder.waitForXpathState(blocks.typeTrustPilot, "stable");
      await dashboard.locator(blocks.typeTrustPilot).click();
    });

    const firstBlock = frameLocator.locator(blockSelector);
    const firstBlockRect = await webBuilder.getBoundingBox(firstBlock);

    await test.step("Kéo dãn block theo chiều ngang", async () => {
      resizePosition = { x: settingData.resize.resize_less_than_row };
      await blocks.resizeBlock(firstBlock, {
        at_position: settingData.resize.left,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify width của block", async () => {
      const boxAfterResized = await firstBlock.boundingBox();
      expect(Math.round(boxAfterResized.width)).toBe(expectData.block_max_width);
    });

    await test.step("Kéo rộng chiều ngang block row 1 > viền row", async () => {
      resizePosition = { x: settingData.resize.resize_more_than_row };
      await blocks.resizeBlock(firstBlock, {
        at_position: settingData.resize.right,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify width block không thể kéo thêm", async () => {
      const boxAfterResized = await firstBlock.boundingBox();
      expect(Math.round(boxAfterResized.width)).toBe(expectData.block_max_width);
    });

    await test.step("Kéo hẹp chiều ngang block của row 1 hết cỡ", async () => {
      resizePosition = { x: settingData.resize.resize_min };
      await blocks.resizeBlock(firstBlock, {
        at_position: settingData.resize.right,
        to_specific_point: resizePosition,
      });
    });

    await test.step("Verify min width block, height row", async () => {
      const firstBlockAfterResized = await firstBlock.boundingBox();
      expect(firstBlockAfterResized.height).toEqual(firstBlockRect.height);
      expect(Math.round(firstBlockAfterResized.width)).toEqual(expectData.block_min_width);
    });

    await test.step("Verify không kéo resize được chiều dọc và 4 góc", async () => {
      await expect(blocks.getResizerInLivePreview("top")).toBeHidden();
      await expect(blocks.getResizerInLivePreview("bottom")).toBeHidden();
      await expect(blocks.getResizerInLivePreview("top-left")).toBeHidden();
      await expect(blocks.getResizerInLivePreview("top-right")).toBeHidden();
      await expect(blocks.getResizerInLivePreview("bottom-left")).toBeHidden();
      await expect(blocks.getResizerInLivePreview("bottom-right")).toBeHidden();
    });

    await test.step(`Click vào block > setting style của block`, async () => {
      for (const [index, style] of settingData.styles.entries()) {
        webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
        await webBuilder.changeDesign(style);
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          combineOptions: {
            fullPage: true,
            maxDiffPixelRatio: 0.0005,
          },
          snapshotName: `06-preview-trustpilot-design-${index + 1}.png`,
        });

        await webBuilder.clickSave();

        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: blocks.xpathButtonPreview,
          redirectUrl: "?theme_preview_id",
          context,
        });

        await test.step(`Verify block trustpilot in SF`, async () => {
          await storefront.locator(blocks.progressBar).waitFor({ state: "detached" });
          webBuilder = new WebBuilder(storefront, conf.suiteConf.domain);
          await webBuilder.waitForXpathState(blocks.blockTrustPilot, "stable");

          await snapshotFixture.verifyWithAutoRetry({
            page: storefront,
            snapshotName: `06-sf-trustpilot-design-${index + 1}.png`,
            combineOptions: {
              fullPage: true,
              maxDiffPixelRatio: 0.0005,
            },
          });
        });
      }
    });
  });

  test(`@SB_WEB_BUILDER_LB_TP_07 Check show quickbar settings ở block [Trustpilot]`, async ({
    dashboard,
    snapshotFixture,
    context,
    conf,
  }) => {
    for (const block of settingData.section_1.dnd_blocks) {
      await test.step("Ở section 1, kéo thả block trustpilot > Nhập domain tồn tại ở Trustpilot", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
        await webBuilder.dragAndDropInWebBuilder(block);
        await webBuilder.inputTextBox("trustpilot", block.trustpilot.domain);
        await dashboard.keyboard.press("Enter");
        await webBuilder.waitForXpathState(blocks.typeTrustPilot, "stable");

        await test.step("Click dropdown type > Select type", async () => {
          await dashboard.locator(blocks.typeTrustPilot).click();
          await dashboard.locator(blocks.getXpathImageType(block.trustpilot.select_type)).click();
          await webBuilder.waitForXpathState(blocks.typeTrustPilot, "stable");
        });
      });
    }

    const firstBlock = frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, block: 1 }));
    const secondBlock = frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, block: 2 }));
    const thirdBlock = frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, block: 3 }));
    await test.step(`Click Move up option trên Quickbar trên block TrustPilot"`, async () => {
      await thirdBlock.click();
      await blocks.selectOptionOnQuickBar("Move up");
    });

    await test.step(`Click Move down option trên Quickbar trên block TrustPilot"`, async () => {
      await firstBlock.click();
      await blocks.selectOptionOnQuickBar("Move down");
    });

    await test.step(`Click Duplicate option trên Quickbar trên block TrustPilot"`, async () => {
      await secondBlock.click();
      await blocks.selectOptionOnQuickBar("Duplicate");
    });

    const fourthBlock = frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, block: 4 }));
    await test.step(`Click Hide option trên Quickbar trên block TrustPilot"`, async () => {
      await fourthBlock.click();
      await blocks.selectOptionOnQuickBar("Hide");
    });

    await test.step("Verify block is hidden", async () => {
      await expect(fourthBlock).toBeHidden();
      await expect(fourthBlock).toBeAttached();
    });

    await test.step(`Click Show block Trustpilot trên Sidebar`, async () => {
      await blocks.backBtn.click();
      await blocks.expandCollapseLayer({
        sectionName: "Section 1",
        isExpand: true,
      });
      await blocks.hideOrShowLayerInSidebar({
        sectionName: "Section 1",
        subLayerName: "Trustpilot",
        subLayerIndex: 4,
        isHide: false,
      });
    });

    await test.step("Verify show block hidden", async () => {
      await expect(fourthBlock).toBeVisible();
    });

    await test.step(`Click Delete option trên Quickbar của block TrustPilot"`, async () => {
      await fourthBlock.click();
      await blocks.selectOptionOnQuickBar("Delete");
    });

    await test.step("Verify block is deleted", async () => {
      await expect(fourthBlock).toBeHidden();
      await expect(fourthBlock).not.toBeAttached();
    });

    await snapshotFixture.verifyWithAutoRetry({
      page: dashboard,
      snapshotName: expectData.preview,
      combineOptions: {
        fullPage: true,
        maxDiffPixelRatio: 0.0005,
      },
    });

    await test.step(`Click button Save`, async () => {
      await webBuilder.clickSave();
    });

    const storefront = await verifyRedirectUrl({
      page: dashboard,
      selector: blocks.xpathButtonPreview,
      redirectUrl: "?theme_preview_id",
      context,
    });

    await test.step(`Verify block trustpilot in SF`, async () => {
      await storefront.locator(blocks.progressBar).waitFor({ state: "detached" });
      webBuilder = new WebBuilder(storefront, conf.suiteConf.domain);
      await webBuilder.waitForXpathState(blocks.blockTrustPilot, "stable");

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        snapshotName: expectData.sf,
        combineOptions: {
          fullPage: true,
          maxDiffPixelRatio: 0.0005,
        },
      });
    });
  });

  test("Verify xóa block trust pilot thành công @SB_WEB_BUILDER_LB_TP_08", async ({ context, dashboard }) => {
    await test.step("Ở section 1, kéo thả block trustpilot > Nhập domain tồn tại ở Trustpilot", async () => {
      await webBuilder.clickBtnNavigationBar("insert");
      await webBuilder.dragAndDropInWebBuilder(settingData.section_1.dnd_block);
      await webBuilder.inputTextBox("trustpilot", settingData.section_1.dnd_block.domain);
      await dashboard.keyboard.press("Enter");
      await webBuilder.waitForXpathState(blocks.typeTrustPilot, "stable");
      await dashboard.locator(blocks.typeTrustPilot).click();
    });

    const firstBlock = frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, block: 1 }));

    await test.step("Remove block trustpilot", async () => {
      await webBuilder.clickOnBtnWithLabel("Delete block");
      await expect(firstBlock).toBeHidden();
      await expect(firstBlock).not.toBeAttached();
    });

    await test.step(`Save > Preview ngoài SF`, async () => {
      await webBuilder.clickSave();
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: blocks.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.locator(blocks.progressBar).waitFor({ state: "detached" });
      await expect(storefront.locator(blocks.blockTrustPilot)).toBeHidden();
    });
  });
});
