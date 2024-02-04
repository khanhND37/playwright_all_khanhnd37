import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyCountSelector, verifyRedirectUrl } from "@utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { expect, FrameLocator } from "@playwright/test";
import { loadData } from "@core/conf/conf";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";

let productId: number,
  frameLocator: FrameLocator,
  block: number,
  webBuilder: WebBuilder,
  section,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sectionSetting: Record<string, any>,
  sectionSelector: string,
  blockSelector: string,
  xpathBlock: Blocks,
  productAPI: ProductAPI,
  webPageStyle: WebPageStyle,
  day: string,
  hour: string,
  minute: string,
  second: string;

test.describe("Verify block countdown @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK", () => {
  test.beforeEach(async ({ dashboard, conf, builder, authRequest }, testInfo) => {
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    frameLocator = xpathBlock.frameLocator;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    webPageStyle = new WebPageStyle(dashboard, conf.suiteConf.domain);

    await test.step("Pre-condition", async () => {
      const preCondition = conf.suiteConf.pre_condition;
      const addSection = conf.suiteConf.add_section;

      // Create product
      const productInfo = await productAPI.createProduct(preCondition);
      productId = productInfo.data.product.id;

      //Apply blank template
      await builder.applyTemplate({
        templateId: preCondition.apply_template.template_id,
        productId: productId,
        type: preCondition.apply_template.type,
      });

      // Open web builder
      await webPageStyle.openWebBuilder({ type: "sale page", id: productId });
      await frameLocator.locator(xpathBlock.overlay).waitFor({ state: "hidden" });

      // Add block countdown
      await test.step("Add section and add block countdown", async () => {
        section = block = 1;
        blockSelector = webBuilder.getSelectorByIndex({ section, block });

        await webBuilder.dragAndDropInWebBuilder(addSection.section);
        await xpathBlock.clickBackLayer();
        await webBuilder.dragAndDropInWebBuilder(addSection.block);
        await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      });
    });
  });

  test.afterEach(async () => {
    await test.step("After-condition: delete product", async () => {
      const products = [productId];
      await productAPI.deleteProduct(products);
    });
  });

  test("Check default data when add block countdown @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK_1", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await test.step("Verify data of block countdown", async () => {
      // Preview cần chờ 1,2s để countdown
      await dashboard.waitForTimeout(1200);
      await test.step("Verify setting default data at sidebar", async () => {
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathBlock.xpathSidebar,
          snapshotName: conf.caseConf.expect.snapshot_sidebar,
        });
      });

      await test.step("Verify default data on webfront", async () => {
        hour = await xpathBlock.getTimePreview("hours");
        minute = await xpathBlock.getTimePreview("minutes");
        await expect(hour).toEqual(conf.caseConf.expect.time_preview.hour);
        await expect(minute).toEqual(conf.caseConf.expect.time_preview.minute);
        await dashboard.locator(xpathBlock.xpathButtonSave).click();
      });

      await test.step("Verify default data on SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: xpathBlock.xpathButtonPreview,
          redirectUrl: "?theme_preview_id",
          context,
        });

        hour = await xpathBlock.getTimeSF(storefront, "hours");
        minute = await xpathBlock.getTimeSF(storefront, "minutes");
        second = await xpathBlock.getTimeSF(storefront, "seconds");

        await expect(hour).toEqual(conf.caseConf.expect.time_SF.hour);
        await expect(minute).toEqual(conf.caseConf.expect.time_SF.minute);
      });
    });
  });

  test("Check setting style for block countdown @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK_3", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    section = 1;
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Verify setting data for block countdown", async () => {
      sectionSetting = conf.caseConf.input;
      const styles = sectionSetting.setting_block.style;
      const settings = sectionSetting.setting_block.settings;

      await webBuilder.color(styles.number_color, "number_color");
      await webBuilder.color(styles.unit_color, "unit_color");
      await webBuilder.selectAlign("align_self", styles.align);
      await webBuilder.settingWidthHeight("width", styles.width);

      await webBuilder.settingWidthHeight("height", styles.height);
      await webBuilder.setBackground("background", styles.background);
      await webBuilder.setBorder("border", styles.border);
      await webBuilder.editSliderBar("opacity", styles.opacity);

      await webBuilder.editSliderBar("border_radius", styles.radius);
      await webBuilder.editSliderBar("box_shadow", styles.shadow);
      await webBuilder.setMarginPadding("padding", styles.padding);
      await webBuilder.setMarginPadding("margin", styles.margin);

      await webBuilder.switchToTab("Settings");
      await webBuilder.selectDropDown("type", settings.type);
      await webBuilder.inputTextBox("hours", settings.hours);
      await webBuilder.inputTextBox("minutes", settings.minutes);
      await webBuilder.selectDropDown("restart_when", settings.restart_when);
    });

    await test.step("Verify data of block countdown", async () => {
      // Preview chờ 1,2s để countdown
      await dashboard.waitForTimeout(1200);
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: conf.caseConf.expect.snapshot_preview,
      });

      await dashboard.locator(xpathBlock.xpathButtonSave).click();
    });

    await test.step("Verify block countdown on SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await snapshotFixture.verify({
        page: storefront,
        selector: sectionSelector,
        snapshotName: conf.caseConf.expect.snapshot_storefront,
      });
    });
  });

  test("Check setting Hours @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK_4", async ({ dashboard, conf }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    await test.step("Input value hour", async () => {
      await xpathBlock.clickOnElementInIframe(frameLocator, blockSelector);
      await webBuilder.switchToTab("Settings");

      for (const hours of conf.caseConf.input) {
        await webBuilder.inputTextBox("hours", hours.hour.value);
        await dashboard.locator(xpathBlock.labelHour).click();
        // Preview chờ 1,2s để countdown
        await dashboard.waitForTimeout(1200);

        const hr = Number(hours.hour.value);
        if (hr > 24) {
          day = await xpathBlock.getTimePreview("days");
          await expect(day).toEqual(hours.hour.expect.value_day);
        }
        hour = await xpathBlock.getTimePreview("hours");
        await expect(hour).toEqual(hours.hour.expect.value_hour);
      }
    });
  });

  test("Check setting Minutes @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK_5", async ({ dashboard, conf }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    await test.step("Input value minutes", async () => {
      await xpathBlock.clickOnElementInIframe(frameLocator, blockSelector);
      await webBuilder.switchToTab("Settings");

      for (const minutes of conf.caseConf.input) {
        await webBuilder.inputTextBox("hours", minutes.hour);
        await webBuilder.inputTextBox("minutes", minutes.minute.value);
        await dashboard.locator(xpathBlock.labelHour).click();
        // Preview chờ 1,2s để countdown
        await dashboard.waitForTimeout(1200);

        const min = Number(minutes.minute.value);

        if (min > minutes.min_per_hour && min < minutes.min_per_day) {
          hour = await xpathBlock.getTimePreview("hours");
          await expect(hour).toEqual(minutes.minute.expect.value_hour);
        }

        if (min > minutes.min_per_day) {
          day = await xpathBlock.getTimePreview("days");
          hour = await xpathBlock.getTimePreview("hours");
          await expect(day).toEqual(minutes.minute.expect.value_day);
          await expect(hour).toEqual(minutes.minute.expect.value_hour);
        }
        minute = await xpathBlock.getTimePreview("minutes");
        second = await xpathBlock.getTimePreview("seconds");
        await expect(minute).toEqual(minutes.minute.expect.value_minute);
        await expect(minutes.minute.expect.value_second).toContain(second);
      }
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const countdown = conf.caseConf.data[i];

    test(`${countdown.description} @${countdown.case_id}`, async ({ dashboard, conf, context }) => {
      webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
      const restart = countdown.input;
      await test.step("Input value", async () => {
        await xpathBlock.clickOnElementInIframe(frameLocator, blockSelector);
        await webBuilder.switchToTab("Settings");

        await webBuilder.selectDropDown("type", restart.type);
        await webBuilder.inputTextBox("hours", restart.hours);
        await webBuilder.inputTextBox("minutes", restart.minutes);
        await webBuilder.selectDropDown("restart_when", restart.restart_when);
      });

      await test.step("Save template", async () => {
        await dashboard.locator(xpathBlock.xpathButtonSave).click();
        await dashboard.waitForSelector("text='All changes are saved'");
      });

      await test.step("Verify countdown when setting field restart when", async () => {
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: xpathBlock.xpathButtonPreview,
          redirectUrl: "?theme_preview_id",
          context,
        });

        //Chờ đếm 2s rồi reload
        await storefront.waitForTimeout(2000);
        await storefront.reload();
        await storefront.locator(xpathBlock.progressBar).waitFor({ state: "detached" });
        // SF chờ 2s để countdown
        await storefront.waitForTimeout(2000);

        hour = await xpathBlock.getTimeSF(storefront, "hours");
        minute = await xpathBlock.getTimeSF(storefront, "minutes");
        second = await xpathBlock.getTimeSF(storefront, "seconds");

        await expect(hour).toEqual(countdown.expect.value_hour);
        await expect(minute).toEqual(countdown.expect.value_minute);
        await expect(countdown.expect.value_second).toContain(second);
      });
    });
  }

  test("Check mở setting tab khi click Settings trên quick bar @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK_10", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await dashboard.locator(xpathBlock.xpathButtonSave).click();

    await test.step("Click settings on quickbar", async () => {
      await xpathBlock.clickOnElementInIframe(frameLocator, blockSelector);
      await xpathBlock.clickQuickSettingByLabel("Settings");
      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathBlock.xpathSidebar,
        snapshotName: conf.caseConf.expect.snapshot,
      });
    });
  });

  test("Check setting Date @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK_7", async ({ dashboard, conf, context }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    await test.step("Setting type of countdown", async () => {
      await webBuilder.switchToTab("Settings");
      await webBuilder.selectDropDown("type", conf.caseConf.input.setting_block.type);
    });

    await test.step("Setting date", async () => {
      await dashboard.click(xpathBlock.xpathDatePicker);
      const currentDay = await dashboard.locator(xpathBlock.xpathCurrentDay);
      const lastDayOfWeek = await dashboard.locator(xpathBlock.xpathLastDayOfWeek);
      if (currentDay == lastDayOfWeek) {
        await dashboard.locator(xpathBlock.xpathFistDayOfWeek).click();
      } else {
        await dashboard.locator(xpathBlock.xpathNextDay).click();
        await dashboard.locator(xpathBlock.xpathButtonSave).click();
      }
    });

    await test.step("Verify countdown on preview", async () => {
      // Preview chờ 1,2s để countdown
      await dashboard.waitForTimeout(1200);
      day = await xpathBlock.getTimePreview("days");
      hour = await xpathBlock.getTimePreview("hours");
      minute = await xpathBlock.getTimePreview("minutes");
      second = await xpathBlock.getTimePreview("seconds");

      await expect(day).toEqual(conf.caseConf.expect.time_preview.day);
      await expect(hour).toEqual(conf.caseConf.expect.time_preview.hour);
      await expect(minute).toEqual(conf.caseConf.expect.time_preview.minute);
      await expect(conf.caseConf.expect.time_preview.second).toContain(second);
    });

    await test.step("Verify countdown on storefront", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      // SF cần chờ 1,2s để countdown
      await storefront.waitForTimeout(2000);

      day = await xpathBlock.getTimeSF(storefront, "days");
      hour = await xpathBlock.getTimeSF(storefront, "hours");
      minute = await xpathBlock.getTimeSF(storefront, "minutes");
      second = await xpathBlock.getTimeSF(storefront, "seconds");

      await expect(day).toEqual(conf.caseConf.expect.time_storefront.day);
      await expect(hour).toEqual(conf.caseConf.expect.time_storefront.hour);
      await expect(minute).toEqual(conf.caseConf.expect.time_storefront.minute);
      await expect(conf.caseConf.expect.time_storefront.second).toContain(second);
    });
  });

  test("Check setting Time @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK_8", async ({ dashboard, conf, context }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    await test.step("Setting type of countdown", async () => {
      await webBuilder.switchToTab("Settings");
      await webBuilder.selectDropDown("type", conf.caseConf.input.setting_block.type);
    });

    await test.step("Setting time", async () => {
      await dashboard.click(xpathBlock.xpathTimePicker);
      const currentHour = await dashboard.locator(xpathBlock.getXpathCurrentTime("Hour"));
      const lastHour = await dashboard.locator(xpathBlock.getLastIndexTimePicker("Hour"));

      if (currentHour == lastHour) {
        await dashboard.locator(xpathBlock.getFirstIndexTimePicker("Hour")).click();
      } else {
        await dashboard.locator(xpathBlock.getNextTimePicker("Hour")).click();
        await webBuilder.switchToTab("Settings");
        await dashboard.locator(xpathBlock.xpathButtonSave).click();
      }
    });

    await test.step("Verify countdown on preview", async () => {
      // Preview chờ 1,2s để countdown
      await dashboard.waitForTimeout(1200);
      day = await xpathBlock.getTimePreview("days");
      hour = await xpathBlock.getTimePreview("hours");
      minute = await xpathBlock.getTimePreview("minutes");
      second = await xpathBlock.getTimePreview("seconds");

      await expect(day).toEqual(conf.caseConf.expect.time_preview.day);
      await expect(hour).toEqual(conf.caseConf.expect.time_preview.hour);
      await expect(minute).toEqual(conf.caseConf.expect.time_preview.minute);
      await expect(conf.caseConf.expect.time_preview.second).toContain(second);
    });

    await test.step("Verify countdown on storefront", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      // SF chờ 2s để countdown
      await storefront.waitForTimeout(2000);

      day = await xpathBlock.getTimeSF(storefront, "days");
      hour = await xpathBlock.getTimeSF(storefront, "hours");
      minute = await xpathBlock.getTimeSF(storefront, "minutes");
      second = await xpathBlock.getTimeSF(storefront, "seconds");

      await expect(day).toEqual(conf.caseConf.expect.time_storefront.day);
      await expect(hour).toEqual(conf.caseConf.expect.time_storefront.hour);
      await expect(minute).toEqual(conf.caseConf.expect.time_storefront.minute);
      await expect(conf.caseConf.expect.time_storefront.second).toContain(second);
    });
  });

  test("Check remove block countdown on sidebar @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK_11", async ({
    dashboard,
    conf,
    context,
  }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await dashboard.locator(xpathBlock.xpathButtonSave).click();

    const numOfBlock = await frameLocator.locator(xpathBlock.xpathAttrsDataBlock).count();
    await test.step("Remove block countdown", async () => {
      await xpathBlock.clickOnElementInIframe(frameLocator, blockSelector);
      await xpathBlock.clickRemoveFromSidebar();
    });

    await test.step("Save template", async () => {
      await dashboard.locator(xpathBlock.xpathButtonSave).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Verify block countdown in SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await verifyCountSelector(storefront, xpathBlock.xpathAttrsDataBlock, numOfBlock - 1);
    });
  });

  test("Check remove block countdown on quickbar @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK_12", async ({
    dashboard,
    conf,
    context,
  }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await dashboard.locator(xpathBlock.xpathButtonSave).click();

    const numOfBlock = await frameLocator.locator(xpathBlock.xpathAttrsDataBlock).count();
    await test.step("Remove block countdown", async () => {
      await xpathBlock.clickOnElementInIframe(frameLocator, blockSelector);
      await xpathBlock.clickQuickSettingByLabel("Remove", "button");
    });

    await test.step("Save template", async () => {
      await dashboard.locator(xpathBlock.xpathButtonSave).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Verify block countdown in SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await verifyCountSelector(storefront, xpathBlock.xpathAttrsDataBlock, numOfBlock - 1);
    });
  });

  test("Check duplicate block countdown on quickbar @SB_WEB_BUILDER_LB_COUNTDOWN_BLOCK_13", async ({
    dashboard,
    conf,
    context,
  }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await dashboard.locator(xpathBlock.xpathButtonSave).click();

    const numOfBlock = await frameLocator.locator(xpathBlock.xpathAttrsDataBlock).count();
    await test.step("Duplicate block countdown", async () => {
      await xpathBlock.clickOnElementInIframe(frameLocator, blockSelector);
      await xpathBlock.clickQuickSettingByLabel("Duplicate", "button");
    });

    await test.step("Save template", async () => {
      await dashboard.locator(xpathBlock.xpathButtonSave).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Verify block countdown in SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await verifyCountSelector(storefront, xpathBlock.xpathAttrsDataBlock, numOfBlock + 1);
    });
  });
});
