import { test, expect } from "@fixtures/website_builder";
import { snapshotDir, verifyCountSelector, verifyRedirectUrl } from "@utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { XpathNavigationButtons } from "@constants/web_builder";
import { Page } from "@playwright/test";
import { PageSettingsData } from "@types";

let section,
  sectionSelector: string,
  webBuilder: WebBuilder,
  pageBlock: Blocks,
  themeSetting: number,
  settingsData: PageSettingsData,
  previewPage: Page,
  collapseLayer,
  openLayer,
  data,
  suiteConf,
  domain,
  caseConf;

test.describe("Check module block Video  @SB_WEB_BUILDER_LB_BV", () => {
  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    suiteConf = conf.suiteConf;
    caseConf = conf.caseConf;
    domain = suiteConf.domain;
    data = conf.caseConf.data;
    themeSetting = conf.suiteConf.themes_setting;
    collapseLayer = conf.suiteConf.collapse_layer;
    openLayer = conf.suiteConf.open_layer;
    webBuilder = new WebBuilder(dashboard, domain);
    pageBlock = new Blocks(dashboard, domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    section = 1;

    await test.step(`get data setting web`, async () => {
      const response = await builder.pageSiteBuilder(themeSetting);
      settingsData = response.settings_data as PageSettingsData;
    });

    await test.step("Open web builder", async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
    });
    sectionSelector = webBuilder.getSelectorByIndex({ section });
  });

  test.afterEach(async ({ builder }) => {
    await builder.updateSiteBuilder(themeSetting, settingsData);
  });

  test("Check data default block Video @SB_WEB_BUILDER_LB_BV_1", async ({
    dashboard,
    context,
    snapshotFixture,
    conf,
  }) => {
    await test.step("Add block Video", async () => {
      await webBuilder.expandCollapseLayer(collapseLayer);
      await webBuilder.openLayerSettings(openLayer);
      await webBuilder.genLoc(webBuilder.btnDeleteInSidebar).click();
      await webBuilder.insertSectionBlock({ parentPosition: { section: 1, column: 1 }, template: "Video" });
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Verify data setting in sidebar", async () => {
      await webBuilder.switchToTab("Content");
      const dataSetting = await webBuilder.getDesignAndContentWithSDK();
      expect(dataSetting).toEqual(conf.caseConf.data_setting);
    });

    const iconVideo = webBuilder.genLoc(pageBlock.xpathIconVideo);
    const videoTooltip = webBuilder.genLoc(pageBlock.videoTooltip);
    await test.step("Verify tooltip Video", async () => {
      await iconVideo.hover();
      await expect(videoTooltip).toBeVisible();
    });

    const iconAltText = webBuilder.genLoc(pageBlock.xpathIconAltText);
    const altTextTooltip = webBuilder.genLoc(pageBlock.altTextTooltip);
    await test.step("Verify tooltip Alttext", async () => {
      await iconAltText.hover();
      await expect(altTextTooltip).toBeVisible();
    });

    const iconAutoplay = webBuilder.genLoc(pageBlock.xpathIconAutoplay);
    const autoPlayTooltip = webBuilder.genLoc(pageBlock.autoplayTooltip);
    await test.step("Verify tooltip Autoplay", async () => {
      await iconAutoplay.hover();
      await expect(autoPlayTooltip).toBeVisible();
    });

    await test.step("Verify block Video on Preview", async () => {
      // Verify SF preview
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(webBuilder.xpathButtonPreview),
      ]);
      await sfTab.waitForLoadState("networkidle");
      await sfTab.waitForSelector(pageBlock.thumbVideo);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTab,
        selector: sectionSelector,
        snapshotName: caseConf.expect.snapshot_storefront,
      });
      await sfTab.close();
    });
  });

  test("Check remove link Video @SB_WEB_BUILDER_LB_BV_2", async ({ dashboard, context, snapshotFixture }) => {
    await test.step("Remove link video, verify in setting bar and in preview", async () => {
      await webBuilder.expandCollapseLayer(collapseLayer);
      await webBuilder.openLayerSettings(openLayer);
      await webBuilder.switchToTab("Content");
      const media = webBuilder.page.locator(pageBlock.videoIframe);
      await media.hover({ position: { x: 1, y: 1 } });
      await webBuilder.genLoc(pageBlock.buttonRemoveVideo).click();

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: pageBlock.xpathStyleSettingbar,
        snapshotName: caseConf.expect.snapshot_sidebar_removevideo,
      });
      await dashboard.waitForTimeout(300);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expect.snapshot_removevideo,
      });
    });

    await test.step("Save template", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Video on SF", async () => {
        // Verify SF preview
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(webBuilder.xpathButtonPreview),
        ]);
        await sfTab.waitForLoadState("networkidle");
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTab,
          selector: sectionSelector,
          snapshotName: caseConf.expect.snapshot_storefront_removevideo,
        });
        await sfTab.close();
      });
    });
  });

  test("Check add link Video @SB_WEB_BUILDER_LB_BV_3", async ({ dashboard, context, snapshotFixture }) => {
    const cancelAddLink = await webBuilder.genLoc(pageBlock.buttonCancelAddVideo);
    await test.step("Verify with blank link video", async () => {
      await webBuilder.expandCollapseLayer(collapseLayer);
      await webBuilder.openLayerSettings(openLayer);
      await webBuilder.switchToTab("Content");
      await webBuilder.uploadVideo("media", "");
      await cancelAddLink.click();
      await dashboard.waitForSelector("text='URL format is invalid. Please try another URL.'");
    });

    await test.step("Verify add link video invalid", async () => {
      await webBuilder.uploadVideo("media", caseConf.invalid_link);
      await cancelAddLink.click();
      await dashboard.waitForSelector("text='URL format is invalid. Please try another URL.'");
    });

    await test.step("Add link video valid and verify in preview", async () => {
      await webBuilder.uploadVideo("media", caseConf.valid_link);
      await webBuilder.inputTextBox("alt_text", caseConf.alt_text);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expect.snapshot_preview_addvideo,
      });
    });

    await test.step("Save template", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Video on SF", async () => {
        // Verify SF preview
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(webBuilder.xpathButtonPreview),
        ]);
        await sfTab.waitForLoadState("networkidle");
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTab,
          selector: sectionSelector,
          snapshotName: caseConf.expect.snapshot_storefront_addvideo,
        });
      });
    });
  });

  test("Check setting data block Video @SB_WEB_BUILDER_LB_BV_6", async ({ dashboard, context, snapshotFixture }) => {
    await test.step("Setting data block Video", async () => {
      await webBuilder.expandCollapseLayer(collapseLayer);
      await webBuilder.openLayerSettings(openLayer);
      const blockSetting = data.blockSetting;
      await webBuilder.switchToTab("Design");
      await webBuilder.selectAlign("align_self", blockSetting.align);
      await webBuilder.settingWidthHeight("width", blockSetting.width);
      await webBuilder.settingWidthHeight("height", blockSetting.height);
      await webBuilder.setBackground("background", blockSetting.background);
      await webBuilder.setBorder("border", blockSetting.border);
      await webBuilder.editSliderBar("opacity", blockSetting.opacity);
      await webBuilder.setShadow("box_shadow", blockSetting.shadow);
      await webBuilder.setMarginPadding("padding", blockSetting.padding);
      await webBuilder.setMarginPadding("margin", blockSetting.margin);
    });

    await test.step("Verify block Video in preview", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expect.snapshot_preview_settingdata,
      });
    });

    await test.step("Save template", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify block Video on SF", async () => {
        // Verify SF preview
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(webBuilder.xpathButtonPreview),
        ]);
        await sfTab.waitForLoadState("networkidle");
        await snapshotFixture.verifyWithAutoRetry({
          page: sfTab,
          selector: sectionSelector,
          snapshotName: caseConf.expect.snapshot_storefront_settingdata,
        });
      });
    });
  });
  test("Check remove block Video @SB_WEB_BUILDER_LB_BV_7", async ({ dashboard, context }) => {
    const numOfBlock = await webBuilder.frameLocator.locator(pageBlock.xpathAttrsDataBlock).count();
    await test.step("Remove block Video", async () => {
      await webBuilder.expandCollapseLayer(collapseLayer);
      await webBuilder.openLayerSettings(openLayer);
      await dashboard.locator(pageBlock.buttonRemoveInSidebar).click();
    });

    await test.step("Verify block Video in preview", async () => {
      await expect(webBuilder.frameLocator.locator(pageBlock.blockVideo)).toHaveCount(0);
    });

    await test.step("Save template", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Verify block Video in SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "theme_preview_id",
        context,
      });
      await verifyCountSelector(storefront, pageBlock.xpathAttrsDataBlock, numOfBlock - 1);
    });
  });

  test("Check setting time duration ở block video @SB_WEB_BUILDER_LB_BV_12", async ({ dashboard, context }) => {
    webBuilder = new WebBuilder(dashboard, domain, context);
    const deleteDefaultVideo = data.delete_default_video;
    const addVideo = data.input_video_link;
    const durationTimeDefault = data.duration_time_default;
    const time = data.timer;
    const startAt = data.convert_start_at;
    const endAt = data.convert_end_at;
    const setTimer = data.set_timer;
    const xpathStartAt = webBuilder.genLoc(pageBlock.xpathDurationByLabelName("Start at"));
    const xpathEndAt = webBuilder.genLoc(pageBlock.xpathDurationByLabelName("End at"));

    await test.step("Pre-condition: Add block Video - xóa video default", async () => {
      await webBuilder.expandCollapseLayer(collapseLayer);
      await webBuilder.openLayerSettings(openLayer);
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(deleteDefaultVideo);
      expect(await xpathStartAt.getAttribute("placeholder")).toEqual(durationTimeDefault);
      expect(await xpathEndAt.getAttribute("placeholder")).toEqual(durationTimeDefault);
    });

    await test.step("Mở tab content của block Video -> Input 1 video Youtube vào block Video", async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(addVideo);
      expect(await xpathStartAt.getAttribute("placeholder")).toEqual(durationTimeDefault);
      expect(await xpathEndAt.getAttribute("placeholder")).toEqual(durationTimeDefault);
    });

    await test.step("Click Save -> Preview", async () => {
      previewPage = await webBuilder.clickSaveAndGoTo("Preview");
      await previewPage.locator(webBuilder.xpathBlockVideo).isVisible();
      await previewPage.locator(webBuilder.xpathBlockVideo).click();
      await expect(previewPage.locator(webBuilder.xpathSourceVideoByTime(time[0], time[0]))).toBeAttached();
      await previewPage.close();
    });

    await test.step("Nhập giá trị Start at và End at bất kì: Start at = 500, End at = 1000", async () => {
      await xpathStartAt.fill(setTimer[2]);
      await xpathEndAt.fill(setTimer[3]);
      await webBuilder.clickSaveButton();
      await expect(xpathStartAt).toHaveValue(startAt);
      await expect(xpathEndAt).toHaveValue(endAt);
    });

    await test.step("Nhập giá trị Start at / End at đúng định dạng mm:ss và trong khoảng thời gian video: Start at = 00:20, End at = 00: 40. Click Save > Preview", async () => {
      await xpathStartAt.fill(setTimer[0]);
      await xpathEndAt.fill(setTimer[1]);
      await webBuilder.frameLocator.locator(webBuilder.xpathBlockVideo).click();
      previewPage = await webBuilder.clickSaveAndGoTo("Preview");
      await previewPage.locator(webBuilder.xpathBlockVideo).isVisible();
      await previewPage.locator(webBuilder.xpathBlockVideo).click();
      await expect(previewPage.locator(webBuilder.xpathSourceVideoByTime(time[1], time[2]))).toBeAttached();
      await previewPage.close();
    });

    await test.step("Nhập giá trị Start at vượt quá thời lượng video.Click Save > Preview", async () => {
      await xpathStartAt.fill(setTimer[4]);
      await xpathEndAt.fill("");
      await webBuilder.frameLocator.locator(webBuilder.xpathBlockVideo).click();
      previewPage = await webBuilder.clickSaveAndGoTo("Preview");
      await previewPage.locator(webBuilder.xpathBlockVideo).isVisible();
      await previewPage.locator(webBuilder.xpathBlockVideo).click();
      await expect(previewPage.locator(webBuilder.xpathSourceVideoByTime(time[3], ""))).toBeAttached();
      await previewPage.close();
    });

    await test.step("Nhập giá trị End at vượt quá thời lượng video.Click Save > Preview", async () => {
      await xpathEndAt.fill(setTimer[4]);
      await xpathStartAt.fill("");
      await webBuilder.frameLocator.locator(webBuilder.xpathBlockVideo).click();
      previewPage = await webBuilder.clickSaveAndGoTo("Preview");
      await previewPage.locator(webBuilder.xpathBlockVideo).isVisible();
      await previewPage.locator(webBuilder.xpathBlockVideo).click();
      await expect(previewPage.locator(webBuilder.xpathSourceVideoByTime("", time[3]))).toBeAttached();
      await previewPage.close();
    });
  });
});
