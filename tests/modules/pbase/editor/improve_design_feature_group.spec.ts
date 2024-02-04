import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { SFProduct } from "@sf_pages/product";
import { loadData } from "@core/conf/conf";

test.describe("Improve design feature group", () => {
  let printBasePage: PrintBasePage;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printBasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    await printBasePage.navigateToMenu("Campaigns");
    await printBasePage.deleteAllCampaign(conf.suiteConf.password);
    await printBasePage.navigateToMenu("Catalog");
  });

  test("@SB_PRB_EDT_127 - [Campaign] Check hiển thị btn Shortcut key", async ({ dashboard, conf, snapshotFixture }) => {
    await test.step("Tại màn hình editor, verify hiển thị các icon shortcut key trên taskbar", async () => {
      await printBasePage.addBaseProducts(conf.caseConf.product_info);
      await printBasePage.clickOnBtnWithLabel("Create new campaign");
      await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
      await expect(await dashboard.locator(printBasePage.xpathIconShortcutKey)).toBeVisible();
    });

    await test.step("Hover vào btn Shortcut key", async () => {
      await printBasePage.page.hover(printBasePage.xpathIconShortcutKey);
      await snapshotFixture.verify({
        page: printBasePage.page,
        selector: printBasePage.xpathTableShortcutKey,
        snapshotName: conf.caseConf.picture.shortcut_key,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click ra khỏi vùng shortcut", async () => {
      await printBasePage.clickBtnExpand();
      await expect(await dashboard.locator(printBasePage.xpathTableShortcutKey)).toBeHidden();
    });
  });

  test("@SB_PRB_EDT_128 - [Campaign] Check hiển thị các button được thêm khi select layer và khi không select layer", async ({
    conf,
    snapshotFixture,
  }) => {
    const layers = conf.caseConf.layers;
    const picture = conf.caseConf.picture;
    await test.step("Add layer cho base product > Verify hiển thị các icon trên thanh taskbar", async () => {
      await printBasePage.addBaseProducts(conf.caseConf.product_info);
      await printBasePage.clickOnBtnWithLabel("Create new campaign");
      await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
      for (let i = 0; i < layers.length; i++) {
        await printBasePage.addNewLayer(layers[i]);
        await snapshotFixture.verify({
          page: printBasePage.page,
          selector: printBasePage.xpathTaskBarInEditor,
          snapshotName: `${picture.select_layer}-${i}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await printBasePage.page.click(printBasePage.xpathIconBack);
      }
    });

    await test.step("Select lại từng layer  > Verify hiển thị các icon trên thanh taskbar", async () => {
      for (let i = 0; i < layers.length; i++) {
        await printBasePage.openLayerDetail(layers[i]);
        await snapshotFixture.verify({
          page: printBasePage.page,
          selector: printBasePage.xpathTaskBarInEditor,
          snapshotName: `${picture.select_layer}-${i}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await printBasePage.page.click(printBasePage.xpathIconBack);
      }
    });

    await test.step("Không select layer nào cả  > Verify hiển thị các icon trên thanh taskbar", async () => {
      await snapshotFixture.verify({
        page: printBasePage.page,
        selector: printBasePage.xpathTaskBarInEditor,
        snapshotName: picture.no_select_layer,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (const caseData of conf.caseConf.data) {
    if (caseData.enable) {
      test(`@${caseData.case_id} - ${caseData.description}`, async ({ conf, snapshotFixture, context }) => {
        const layers = caseData.layers;
        const picture = caseData.picture;

        await test.step("Không select layer nào cả > Verify hiển thị icon trên thanh task bar", async () => {
          await printBasePage.addBaseProducts(caseData.product_info);
          await printBasePage.clickOnBtnWithLabel("Create new campaign");
          await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
          await printBasePage.addNewLayers(layers);
          await snapshotFixture.verify({
            page: printBasePage.page,
            selector: printBasePage.xpathTaskBarInEditor,
            snapshotName: picture.no_select_layer,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });

        await test.step(`Select ${layers[1]} > Click btn ${caseData.type} trên thanh taskbar > Verify hiển thị các layer trên template`, async () => {
          await printBasePage.openLayerDetail(layers[1]);
          await printBasePage.page.click(printBasePage.getXpathIconOnTaskBar(caseData.type));
          await snapshotFixture.verify({
            page: printBasePage.page,
            selector: printBasePage.xpathImageInEditor,
            snapshotName: picture.picture_template_image,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });

        if (caseData.case_id === "SB_PRB_EDT_129") {
          await test.step(`Select Text layer 1 > Click btn ${caseData.type} trên thanh taskbar > Verify hiển thị các layer trên template`, async () => {
            await printBasePage.page.waitForTimeout(5000);
            await printBasePage.page.click(printBasePage.xpathIconBack);
            await printBasePage.openLayerDetail(layers[0]);
            await printBasePage.page.click(printBasePage.getXpathIconOnTaskBar(caseData.type));
            await snapshotFixture.verify({
              page: printBasePage.page,
              selector: printBasePage.xpathImageInEditor,
              snapshotName: picture.picture_template_text,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
        }

        await test.step("Click btn Continue > Input title cho campaign > Verify launch campaign thành công", async () => {
          await printBasePage.clickOnBtnWithLabel("Continue");
          await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
          await printBasePage.inputPricingInfo(caseData.pricing_info);
          const campaignId = printBasePage.getCampaignIdInPricingPage();
          await printBasePage.clickOnBtnWithLabel("Launch");
          const isAvailable = await printBasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
          expect(isAvailable).toBeTruthy();
        });

        await test.step("Mở campaign detail > Verify hiển thị mockup của campaign", async () => {
          const result = await printBasePage.waitDisplayMockupDetailCampaign(caseData.pricing_info.title);
          expect(result).toBeTruthy();
          await printBasePage.page.click(printBasePage.xpathTitleOrganization);
          await snapshotFixture.verify({
            page: printBasePage.page,
            selector: printBasePage.xpathSectionImageInDetail,
            snapshotName: picture.image_list,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });

        await test.step("View campaign ngoài SF > Verify hiển thị mockup của campaign", async () => {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printBasePage.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
          await campaignSF.waitForImagesMockupLoaded();
          await campaignSF.waitForElementVisibleThenInvisible(
            printBasePage.xpathLoadingMainImage(caseData.pricing_info.title),
          );
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: printBasePage.getXpathMainImageOnSF(caseData.pricing_info.title),
            snapshotName: picture.image_sf,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
      });
    }
  }

  test("@SB_PRB_EDT_132 - [Campaign] Verify hiển thị thanh Zoom in/out trong màn hình editor", async ({
    conf,
    snapshotFixture,
  }) => {
    const picture = conf.caseConf.picture;
    const dataZoom = conf.caseConf.zoom_in_out;

    await test.step("Verify hiển thị thanh Zoom in/out trong màn hình editor", async () => {
      await printBasePage.addBaseProducts(conf.caseConf.product_info);
      await printBasePage.clickOnBtnWithLabel("Create new campaign");
      await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: printBasePage.page,
        selector: printBasePage.xpathIconZoom,
        snapshotName: picture.icon_zoom,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Verify lần đầu zoom in/out > Đóng thanh drag", async () => {
      await printBasePage.page.click(printBasePage.getXpathIconZoomInOut(1));
      await snapshotFixture.verify({
        page: printBasePage.page,
        selector: printBasePage.xpathDragTaskBar,
        snapshotName: picture.drag_taskbar,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
      await printBasePage.page.click(printBasePage.xpathIconCloseInDragTaskbar);
      await expect(await printBasePage.page.locator(printBasePage.xpathDragTaskBar)).toBeHidden();
    });

    for (let j = 0; j < dataZoom.length; j++) {
      await test.step("Mỗi lần bấm +/- > Verify thanh zoom in/out", async () => {
        if (dataZoom[j].zoom_type === "zoom in") {
          await printBasePage.page.click(printBasePage.getXpathIconZoomInOut(1));
        } else {
          await printBasePage.page.click(printBasePage.getXpathIconZoomInOut(3));
        }
        await snapshotFixture.verify({
          page: printBasePage.page,
          selector: printBasePage.xpathIconZoom,
          snapshotName: dataZoom[j].picture_zoom.zoom,
          snapshotOptions: {
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("Click dup chuột vào +/- > Verify thanh zoom in/out", async () => {
        if (dataZoom[j].zoom_type === "zoom in") {
          await printBasePage.page.dblclick(printBasePage.getXpathIconZoomInOut(1));
        } else {
          await printBasePage.page.dblclick(printBasePage.getXpathIconZoomInOut(3));
        }
        await snapshotFixture.verify({
          page: printBasePage.page,
          selector: printBasePage.xpathIconZoom,
          snapshotName: picture.db_zoom,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });
    }
  });
});
