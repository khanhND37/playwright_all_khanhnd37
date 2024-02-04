import { expect, test } from "@fixtures/website_builder";
import { snapshotDir, waitSelector } from "@core/utils/theme";
import { FrameLocator, Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { WbBlockFeaturedCollection } from "@pages/dashboard/wb_block_featured_collection";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFHome } from "@pages/storefront/homepage";
import { CollectionPage } from "@pages/dashboard/collections";
import { PageSettingsData } from "@types";
import { waitTimeout } from "@core/utils/api";

let frameLocator: FrameLocator, xpathBlock: Blocks;
let webBuilder: WebBuilder;
let currentPage: Page;
let wbBlockFeaturedCollection: WbBlockFeaturedCollection;
let blockSelector: string;
let dashboardPage: DashboardPage;
let settingsData: PageSettingsData;
let settingsDataPublish: PageSettingsData;

test.beforeAll(async ({ builder, conf }) => {
  await test.step("Get theme default", async () => {
    const response = await builder.pageSiteBuilder(conf.suiteConf.theme_data);
    settingsData = response.settings_data as PageSettingsData;
  });
});

test.beforeEach(async ({ conf, dashboard, builder }, testInfo) => {
  const suiteConf = conf.suiteConf;

  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);

  xpathBlock = new Blocks(dashboard, suiteConf.domain);
  frameLocator = xpathBlock.frameLocator;
  webBuilder = new WebBuilder(dashboard, suiteConf.domain);
  wbBlockFeaturedCollection = new WbBlockFeaturedCollection(dashboard, conf.suiteConf.domain);
  blockSelector = webBuilder.getSelectorByIndex({ section: 1, block: 1 });

  if (conf.suiteConf.case_access_dashboard_first.includes(conf.caseName)) {
    return;
  }

  await test.step("Update theme", async () => {
    if (!settingsData) {
      const response = await builder.pageSiteBuilder(conf.suiteConf.shop_theme_id);
      settingsData = response.settings_data as PageSettingsData;
    }

    //get publish theme data
    const responsePublish = await builder.pageSiteBuilder(conf.suiteConf.shop_theme_id);
    settingsDataPublish = responsePublish.settings_data as PageSettingsData;

    //Update collection page data for publish theme
    settingsDataPublish.pages["home"].default.elements = settingsData.pages["home"].default.elements;
    await builder.updateSiteBuilder(conf.suiteConf.shop_theme_id, settingsDataPublish);
  });

  await test.step("Pre-condition: Open web builder", async () => {
    //Go to web front by page ID
    await dashboard.goto(`https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.shop_theme_id}`);
    await webBuilder.loadingScreen.waitFor();
    await webBuilder.loadingScreen.waitFor({ state: "hidden" });
    await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
  });

  await test.step("Add block featured collection vào home page", async () => {
    await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.block_template);
    await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toBeVisible();
  });
});

test.describe("Check block featured collection", () => {
  test("@SB_WEB_BUILDER_LB_NFC_01 Check trạng thái default khi add mới block featured collection", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    wbBlockFeaturedCollection = new WbBlockFeaturedCollection(dashboard, conf.suiteConf.domain);
    await test.step("Tại web builder, add block featured collection vào home page", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.headerXpath).hover();
      await waitTimeout(2000);
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        iframe: webBuilder.iframe,
        selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
        snapshotName: conf.caseConf.expected.snapshot_on_preview,
      });
    });

    await test.step("Check hiển thị default các field trên side bar", async () => {
      //check tab design
      await webBuilder.switchToTab("Design");
      await snapshotFixture.verify({
        page: dashboard,
        selector: wbBlockFeaturedCollection.sideBarSelector,
        snapshotName: `${process.env.ENV}-${conf.caseConf.expected.snapshot_sidebar_design}`,
      });

      //check tab content
      await webBuilder.switchToTab("Content");
      await snapshotFixture.verify({
        page: dashboard,
        selector: wbBlockFeaturedCollection.sideBarSelector,
        snapshotName: `${process.env.ENV}-${conf.caseConf.expected.snapshot_sidebar_content}`,
      });
    });

    await test.step("Nhấn save, click preview button", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await webBuilder.clickPreview({ context, dashboard });

      await snapshotFixture.verify({
        page: currentPage,
        selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
        snapshotName: `${process.env.ENV}-${conf.caseConf.expected.snapshot_on_SF}`,
      });
    });
  });

  test("@SB_WEB_BUILDER_LB_NFC_02 Check setting trường layout", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    await test.step("Click popup layout", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.tabDesignXpath).click();
      await dashboard.locator(wbBlockFeaturedCollection.widgetLayoutXpath).last().click();

      await snapshotFixture.verify({
        page: dashboard,
        selector: wbBlockFeaturedCollection.widgetLayoutButtonXpath,
        snapshotName: `${process.env.ENV}-${caseConf.snapshot_popup_layout}`,
      });

      await dashboard.locator(wbBlockFeaturedCollection.xpathProductPerRow).click();
      await dashboard.locator(wbBlockFeaturedCollection.selectProductPerRowAuto).click();
      await waitSelector(dashboard, wbBlockFeaturedCollection.smallCardXpath);

      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.layoutGridFrameLocator)).toHaveCSS(
        "gap",
        new RegExp(`${caseConf.default_data.spacing}`),
      );
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.productItemXpathWB)).toHaveCSS(
        "--min-width",
        new RegExp(`${caseConf.default_data.grid_min_width}`),
      );
    });

    await test.step("Set 1 bộ data với layout = Grid: Check hiển thị featured collection block", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.smallCardXpath).click();
      await dashboard.locator(wbBlockFeaturedCollection.layoutLabelXpath).click();
      await dashboard.locator(wbBlockFeaturedCollection.textboxInputSpacing).fill(`${caseConf.layout_grid.spacing}`);
      await dashboard.locator(wbBlockFeaturedCollection.layoutLabelXpath).click();

      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.layoutGridFrameLocator)).toHaveCSS(
        "gap",
        new RegExp(`${caseConf.layout_grid.spacing}px`),
      );
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.productItemXpathWB)).toHaveCSS(
        "--min-width",
        new RegExp(`${caseConf.layout_grid.min_width}`),
      );
    });

    await test.step("Nhấn save, click preview button", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await webBuilder.clickPreview({ context, dashboard });

      await expect(currentPage.locator(wbBlockFeaturedCollection.layoutGridFrameLocator)).toHaveCSS(
        "gap",
        new RegExp(`${caseConf.layout_grid.spacing}px`),
      );
      await expect(currentPage.locator(wbBlockFeaturedCollection.productItemXpathWB)).toHaveCSS(
        "--min-width",
        new RegExp(`${caseConf.layout_grid.min_width}`),
      );
      await snapshotFixture.verify({
        page: currentPage,
        selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
        snapshotName: `${process.env.ENV}-02_layout_grid.png`,
      });
    });

    await test.step("Chọn layout = Mix", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.widgetLayoutXpath).last().click();
      await dashboard.locator(wbBlockFeaturedCollection.layoutMixOnPopup).click();

      await expect(dashboard.locator(wbBlockFeaturedCollection.xpathProductPerRow)).toBeHidden();
    });

    await test.step("Trong dashboard: Set 1 bộ data với layout = Mix: Check hiển thị featured collection block", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.layoutLabelXpath).click();
      await dashboard.locator(wbBlockFeaturedCollection.textboxInputSpacing).fill(`${caseConf.layout_mix.spacing}`);
      await dashboard.locator(wbBlockFeaturedCollection.layoutLabelXpath).click();

      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.mixLayoutFrameLocator)).toHaveCSS(
        "--spacing-item",
        new RegExp(`${caseConf.layout_mix.spacing}`),
      );
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.mixLayoutFrameLocator)).toHaveCSS(
        "min-width",
        new RegExp(`${caseConf.default_data.mix_min_width}`),
      );
    });

    await test.step("Nhấn save, click preview button", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await webBuilder.clickPreview({ context, dashboard });

      await expect(currentPage.locator(wbBlockFeaturedCollection.mixLayoutFrameLocator)).toHaveCSS(
        "--spacing-item",
        new RegExp(`${caseConf.layout_mix.spacing}`),
      );
      await expect(currentPage.locator(wbBlockFeaturedCollection.mixLayoutFrameLocator)).toHaveCSS(
        "min-width",
        new RegExp(`${caseConf.default_data.mix_min_width}`),
      );
      await snapshotFixture.verify({
        page: currentPage,
        selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
        snapshotName: `${process.env.ENV}-02_layout_mix.png`,
      });
    });

    await test.step("Chọn layout = Slide", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.widgetLayoutXpath).last().click();
      await dashboard.locator(wbBlockFeaturedCollection.layoutSlideOnPopup).click();

      await expect(dashboard.locator(wbBlockFeaturedCollection.toggleSlideNav)).toHaveAttribute("value", "true");
      await expect(dashboard.locator(wbBlockFeaturedCollection.toggleArrows)).toHaveAttribute("value", "true");
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.dotFrameLocator)).toBeVisible();
    });

    await test.step("Nhấn save, click preview button", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await webBuilder.clickPreview({ context, dashboard });

      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.dotFrameLocator)).toBeVisible();
    });

    await test.step("Trong dashboard: Set 1 bộ data với layout = Slide: Check hiển thị featured collection block", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.widgetLayoutXpath).last().click();
      await dashboard.locator(wbBlockFeaturedCollection.layoutSlideOnPopup).click();
      await dashboard.locator(wbBlockFeaturedCollection.smallCardXpath).click();
      await dashboard
        .locator('//label[contains(.,"Slide Nav")]/ancestor::div[2]//span[contains(@class,"sb-switch__switch")]')
        .click({ delay: 300 });
      await dashboard
        .locator('//label[contains(.,"Arrows")]/ancestor::div[2]//span[contains(@class,"sb-switch__switch")]')
        .click({ delay: 1000 });

      await dashboard.locator(wbBlockFeaturedCollection.layoutLabelXpath).click();
      await dashboard.locator(wbBlockFeaturedCollection.textboxInputSpacing).fill(`${caseConf.layout_slide.spacing}`);
      await dashboard.locator(wbBlockFeaturedCollection.labelSpacingXpath).click({ delay: 1000 });

      await expect(dashboard.locator(wbBlockFeaturedCollection.toggleSlideNav)).toHaveAttribute("value", "false");
      await expect(dashboard.locator(wbBlockFeaturedCollection.toggleArrows)).toHaveAttribute("value", "false");
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.dotFrameLocator)).toBeHidden();
      await expect(webBuilder.frameLocator.locator(".featured_collection__container .custom-navigation")).toBeHidden();
      await expect(webBuilder.frameLocator.locator(".featured_collection__container .slider-item")).toHaveCSS(
        "--spacing",
        new RegExp(`${caseConf.default_data.slide_max_spacing}`),
      );
      await expect(
        webBuilder.frameLocator.locator(".featured_collection__container .product-card--assets >> nth=0"),
      ).toHaveCSS("--min-width", new RegExp(`${caseConf.layout_slide.min_width}`));
    });

    await test.step("Nhấn save, click preview button", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await webBuilder.clickPreview({ context, dashboard });

      await expect(currentPage.locator(wbBlockFeaturedCollection.dotFrameLocator)).toBeHidden();
      await expect(currentPage.locator(".featured_collection__container .custom-navigation")).toBeHidden();
      await expect(currentPage.locator(".featured_collection__container .slider-item")).toHaveCSS(
        "--spacing",
        new RegExp(`${caseConf.default_data.slide_max_spacing}`),
      );
      await expect(currentPage.locator(".featured_collection__container .product-card--assets >> nth=0")).toHaveCSS(
        "--min-width",
        new RegExp(`${caseConf.layout_slide.min_width}`),
      );
      await snapshotFixture.verify({
        page: currentPage,
        selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
        snapshotName: `${process.env.ENV}-02_layout_slide.png`,
      });
    });
  });

  test("@SB_WEB_BUILDER_LB_NFC_03 Check setting trường Products to show", async ({ dashboard, conf, context }) => {
    await test.step("Nhập kí tự không hợp lệ(không phải kí tự số, kí tự số < 1, kí tự số > 30)", async () => {
      //set source for section
      await dashboard.locator(wbBlockFeaturedCollection.layerButtonXpath).click();
      await webBuilder.setVariableForSection({
        sectionName: "Section",
        sourceType: "Collection",
        sourceData: "Collection 1",
        sectionIndex: 1,
      });

      await webBuilder.backBtn.click();
      await webBuilder.openLayerSettings({
        sectionName: "Featured Collection",
        sectionIndex: 1,
      });

      for (const numberInvalid of conf.caseConf.number_of_product_invalid) {
        await dashboard.locator(wbBlockFeaturedCollection.tabDesignXpath).click();
        await dashboard.locator(wbBlockFeaturedCollection.inputBoxProductPerPageXpath).fill(numberInvalid.input);
        await dashboard.locator(wbBlockFeaturedCollection.headerXpath).click();

        await expect(dashboard.locator('[label="Products to show"]')).toHaveAttribute(
          "value",
          new RegExp(numberInvalid.value),
        );
      }
    });

    for (const numberValid of conf.caseConf.number_of_product_valid) {
      await test.step("Nhập kí tự hợp lệ: lớn hơn, nhỏ hơn số product collection có", async () => {
        await dashboard.locator(wbBlockFeaturedCollection.inputBoxProductPerPageXpath).fill(numberValid.input);
        await dashboard.locator(wbBlockFeaturedCollection.headerXpath).click();

        await expect(dashboard.locator('[label="Products to show"]')).toHaveAttribute(
          "value",
          new RegExp(numberValid.input),
        );
        expect(await webBuilder.frameLocator.locator(".product-item").count()).toEqual(numberValid.value);
      });

      await test.step("Nhấn save, click preview button", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await webBuilder.clickPreview({ context, dashboard });

        expect(await currentPage.locator(".product-item").count()).toEqual(numberValid.value);
      });
    }
  });

  test("@SB_WEB_BUILDER_LB_NFC_04 Check toggle Cover", async ({ dashboard, conf, context, snapshotFixture }) => {
    await test.step("Check hiển thị image cover của block featured collection với collection không có cover image", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.layerButtonXpath).click();
      await webBuilder.setVariableForSection({
        sectionName: "Section",
        sourceType: "Collection",
        sourceData: `${conf.caseConf.collection_no_have_image.collection_name}`,
        sectionIndex: 1,
      });

      await expect(
        webBuilder.frameLocator.locator(".featured_collection__container .collection-card--wrapper-image"),
      ).toBeVisible();

      //check SF
      await webBuilder.clickSaveButton();
      currentPage = await webBuilder.clickPreview({ context, dashboard });
      await currentPage.locator(wbBlockFeaturedCollection.xpathCoverImg).waitFor({ state: "visible" });

      await snapshotFixture.verify({
        page: currentPage,
        selector: wbBlockFeaturedCollection.blockXpathOnSF,
        snapshotName: `${process.env.ENV}-04_collection_no_have_image.png`,
      });
    });

    await test.step("Đổi source = collection 1, check hiển thị image cover của block featured collection với collection có cover image", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.layerButtonXpath).click();
      await webBuilder.setVariableForSection({
        sectionName: "Section",
        sourceType: "Collection",
        sourceData: `${conf.caseConf.collection_have_image.collection_name}`,
        sectionIndex: 1,
      });

      await expect(
        webBuilder.frameLocator.locator(".featured_collection__container .collection-card--wrapper-image"),
      ).toBeVisible();

      //check SF
      await webBuilder.clickSaveButton();
      currentPage = await webBuilder.clickPreview({ context, dashboard });
      await currentPage.locator(wbBlockFeaturedCollection.xpathCoverImg).waitFor({ state: "visible" });

      await snapshotFixture.verify({
        page: currentPage,
        selector: wbBlockFeaturedCollection.blockXpathOnSF,
        snapshotName: `${process.env.ENV}-04_collection_have_image.png`,
      });
    });

    await test.step("Tắt toggle Cover", async () => {
      await webBuilder.frameLocator.locator(blockSelector).click();
      await dashboard.locator(wbBlockFeaturedCollection.tabDesignXpath).click();
      await dashboard.locator('[data-widget-id="cover_enabled"] .sb-switch__button').click();

      await expect(
        webBuilder.frameLocator.locator(".featured_collection__container .collection-card--wrapper-image"),
      ).toBeHidden();

      //check SF
      await webBuilder.clickSaveButton();
      currentPage = await webBuilder.clickPreview({ context, dashboard });

      await expect(currentPage.locator(".featured_collection__container .collection-card--wrapper-image")).toBeHidden();
    });
  });

  test("@SB_WEB_BUILDER_LB_NFC_05 Check trường cover image", async ({ dashboard, conf, context, snapshotFixture }) => {
    await test.step("Check tooltip của trường Cover image", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.layerButtonXpath).click();
      await webBuilder.setVariableForSection({
        sectionName: "Section",
        sourceType: "Collection",
        sourceData: "Collection 3",
        sectionIndex: 1,
      });

      await webBuilder.frameLocator.locator(blockSelector).click();
      await dashboard.locator(wbBlockFeaturedCollection.tabDesignXpath).click();
      await dashboard.locator(wbBlockFeaturedCollection.iconTooltipCoverImage).hover();
      await expect(dashboard.locator(".w-builder__tooltip-label").last()).toHaveText(
        `${conf.caseConf.tooltip_content}`,
      );
    });

    await test.step("Click chọn cover image", async () => {
      await dashboard.locator('[data-widget-id="thumbnail_image"] .w-builder__chip').click();
      await snapshotFixture.verify({
        page: dashboard,
        selector: wbBlockFeaturedCollection.uploadCoverImagePopup,
        snapshotName: `05-${process.env.ENV}-${conf.caseConf.snapshot_image_popup}`,
      });
    });

    await test.step("Upload image", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.uploadImageButton).click();
      await dashboard.setInputFiles(wbBlockFeaturedCollection.buttonUploadCoverImage, conf.caseConf.file_image);
      await expect(dashboard.locator(".w-builder__widget--background .w-builder__chip--color")).toBeVisible();

      //check SF
      await webBuilder.clickSaveButton();
      currentPage = await webBuilder.clickPreview({ context, dashboard });

      await snapshotFixture.verify({
        page: currentPage,
        selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
        snapshotName: `05-${process.env.ENV}-upload_image.png`,
      });
    });
  });

  test("@SB_WEB_BUILDER_LB_NFC_06 Check trường content position", async ({ dashboard, conf, context }) => {
    test.slow();
    for (const setContentPosition of conf.caseConf.setting_position) {
      await dashboard.locator(wbBlockFeaturedCollection.tabDesignXpath).click();
      await test.step("Chọn content position", async () => {
        await dashboard.locator(`[data-widget-id="content_position"] li >> nth=${setContentPosition.index}`).click();

        await expect(
          dashboard.locator(`[data-widget-id="content_position"] li >> nth=${setContentPosition.index}`),
        ).toHaveAttribute("class", /active sb-pointer/);
        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionContentXpath)).toHaveAttribute(
          "class",
          new RegExp(`text-align-${setContentPosition.text_align} position-${setContentPosition.position}`),
        );
        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionContentXpath)).toHaveCSS(
          "padding",
          `${conf.caseConf.padding}`,
        );
      });

      await test.step("Nhấn save, click preview button", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await webBuilder.clickPreview({ context, dashboard });

        await expect(currentPage.locator(wbBlockFeaturedCollection.collectionContentXpath)).toHaveAttribute(
          "class",
          new RegExp(`text-align-${setContentPosition.text_align} position-${setContentPosition.position}`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.collectionContentXpath)).toHaveCSS(
          "padding",
          `${conf.caseConf.padding}`,
        );
      });
    }
  });

  test("@SB_WEB_BUILDER_LB_NFC_10 Check sửa data tab content", async ({ dashboard, conf, context }) => {
    await test.step("Bỏ trống Heading", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.layerButtonXpath).click();
      await webBuilder.setVariableForSection({
        sectionName: "Section",
        sourceType: "Collection",
        sourceData: `${conf.caseConf.collection_content.name}`,
        sectionIndex: 1,
      });

      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionTitleXpath)).toHaveText(
        `${conf.caseConf.collection_content.name}`,
      );
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionDescriptionXpath)).toHaveText(
        `${conf.caseConf.collection_content.description}`,
      );
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionButtonXpath)).toHaveText(
        `${conf.caseConf.collection_content.button_label}`,
      );
    });

    await test.step("Sửa data trường Heading", async () => {
      await webBuilder.frameLocator.locator(blockSelector).click();
      await dashboard.locator(wbBlockFeaturedCollection.tabContentXpath).click();

      await dashboard
        .locator(wbBlockFeaturedCollection.collectionNameInput)
        .fill(`${conf.caseConf.content_edit.heading}`);
      await dashboard.locator(wbBlockFeaturedCollection.headerXpath).click();

      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionTitleXpath)).toHaveText(
        `${conf.caseConf.content_edit.heading}`,
      );
    });

    await test.step("Sửa data trường Description", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.tabContentXpath).click();
      await dashboard
        .locator(wbBlockFeaturedCollection.collectionDescriptionInput)
        .fill(`${conf.caseConf.content_edit.description}`);
      await dashboard.locator(wbBlockFeaturedCollection.headerXpath).click();

      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionDescriptionXpath)).toHaveText(
        `${conf.caseConf.content_edit.description}`,
      );
    });

    await test.step("Sửa data trường button label", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.tabContentXpath).click();
      await dashboard
        .locator(wbBlockFeaturedCollection.collectionButtonInput)
        .fill(`${conf.caseConf.content_edit.button_label}`);
      await dashboard.locator(wbBlockFeaturedCollection.headerXpath).click();

      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionButtonXpath)).toHaveText(
        `${conf.caseConf.content_edit.button_label}`,
      );
    });

    await test.step("Nhấn save, click preview button", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await webBuilder.clickPreview({ context, dashboard });

      await expect(currentPage.locator(wbBlockFeaturedCollection.collectionTitleXpath)).toHaveText(
        `${conf.caseConf.content_edit.heading}`,
      );
      await expect(currentPage.locator(wbBlockFeaturedCollection.collectionDescriptionXpath)).toHaveText(
        `${conf.caseConf.content_edit.description}`,
      );
      await expect(currentPage.locator(wbBlockFeaturedCollection.collectionButtonXpath)).toHaveText(
        `${conf.caseConf.content_edit.button_label}`,
      );

      //Check SF
      await currentPage.goto(`https://${conf.suiteConf.domain}`);
      await currentPage.waitForLoadState("load");

      await expect(currentPage.locator(wbBlockFeaturedCollection.collectionTitleXpath)).toHaveText(
        `${conf.caseConf.content_edit.heading}`,
      );
      await expect(currentPage.locator(wbBlockFeaturedCollection.collectionDescriptionXpath)).toHaveText(
        `${conf.caseConf.content_edit.description}`,
      );
      await expect(currentPage.locator(wbBlockFeaturedCollection.collectionButtonXpath)).toHaveText(
        `${conf.caseConf.content_edit.button_label}`,
      );
    });
  });

  test("@SB_WEB_BUILDER_LB_NFC_08 Check data của block featured collection apply thay đổi khi edit/delete/make unavailable collection trong dashboard", async ({
    dashboard,
    conf,
    builder,
  }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
    let collectionUrl = "";

    await test.step("Precondition: Delete collection 5 if needed", async () => {
      await collection.navigateToSubMenu("Products", "Collections");
      await collection.deleteCollection(caseConf.collection_name);
    });

    await test.step("Vào dashboard > Collection: tạo mới collection 5 gồm 2 product {B , C}; tick: Show on featured collection page http://joxi.ru/Dr8b9yziDWgbG2", async () => {
      await page.getByRole("button", { name: "Create collection" }).click();
      await page.getByPlaceholder("e.g Summer collection, Under $100, Staff picks").click();
      await page.getByPlaceholder("e.g Summer collection, Under $100, Staff picks").fill(caseConf.collection_name);
      await page.locator("label").filter({ hasText: "Manual" }).locator("span").first().click();
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page.locator("div.s-toast")).toContainText("Created collection successfully!");
      await page.getByRole("button", { name: "Add product" }).isVisible();
      await page.getByRole("button", { name: "Add product" }).click();
      await page.waitForSelector(`//img[contains(@class,'sbase-spinner')]`, { state: "hidden" });
      for (const productName of caseConf.product_names) {
        await page.locator("//input[@placeholder='Search for product']").click();
        await page.locator("//input[@placeholder='Search for product']").fill(productName);
        await page.waitForSelector(
          `//div[@class='item' and descendant::div[@class='item-title' and normalize-space()='${productName}']]`,
        );
        await page
          .locator(
            `//div[@class='item' and descendant::div[@class='item-title' and normalize-space()='${productName}']]//label`,
          )
          .click();
      }
      await page.locator(`//div[contains(@class, 's-modal-footer')]//button[contains(@class, 'is-primary')]`).click();
      await expect(page.locator("div.s-toast")).toContainText("Select product successfully");
      collectionUrl = page.url();
      do {
        await page.waitForSelector(`//div[contains(@class, 'product-page')]//button[contains(@class, 'is-primary')]`);
        await page.locator(`//div[contains(@class, 'product-page')]//button[contains(@class, 'is-primary')]`).click();
        await page.waitForSelector(`//img[contains(@class,'sbase-spinner')]`);
        await page.waitForSelector(`//img[contains(@class,'sbase-spinner')]`, { state: "hidden" });
      } while (
        await page
          .locator(`//div[contains(@class, 'product-page')]//button[contains(@class, 'is-primary')]`)
          .isVisible()
      );
      await expect(page.locator("div.have-product")).toBeVisible();
    });

    await test.step("Goto webbuilder, add featured collection vao section", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.shop_theme_id);
        settingsData = response.settings_data as PageSettingsData;
      }
      //get publish theme data
      const responsePublish = await builder.pageSiteBuilder(conf.suiteConf.shop_theme_id);
      settingsDataPublish = responsePublish.settings_data as PageSettingsData;
      //Update collection page data for publish theme
      settingsDataPublish.pages["home"].default.elements = settingsData.pages["home"].default.elements;
      await builder.updateSiteBuilder(conf.suiteConf.shop_theme_id, settingsDataPublish);

      //Go to web front by page ID
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.shop_theme_id}`);
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      //Add block featured collection vào home page
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.block_template);
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toBeVisible();
    });

    await test.step("Select collection 5 cho block featured collection", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.layerButtonXpath).click();
      await webBuilder.setVariableForSection({
        sectionName: "Section",
        sourceType: "Collection",
        sourceData: `${caseConf.collection_name}`,
        sectionIndex: 1,
      });
      await webBuilder.clickSaveButton();
      const numberOfProduct = await webBuilder.frameLocator
        .locator(wbBlockFeaturedCollection.itemOnFeaturedCollection)
        .count();
      expect(numberOfProduct).toEqual(caseConf.number_of_product);
    });

    await test.step("Vào dashboard > Collection > Collection 5: edit Collection 5", async () => {
      await page.goto(collectionUrl);
      await page.getByPlaceholder("e.g Summer collection, Under $100, Staff picks").click();
      await page
        .getByPlaceholder("e.g Summer collection, Under $100, Staff picks")
        .fill(caseConf.collection_name_edited);
      await page.getByRole("combobox").selectOption("created-desc");
      await expect(page.locator("div.s-toast")).toContainText("Collection order updated");
      await page.getByRole("button", { name: "Save" }).first().click();
      await expect(page.locator("div.s-toast")).toContainText("Saved collection!");
    });

    await test.step("Customize theme > Featured Collection: mở block preview", async () => {
      dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      //Go to web front by page ID
      await dashboardPage.navigateToMenu("Online Store");
      await dashboardPage.page.getByRole("button", { name: "Customize" }).first().click();
      await frameLocator.locator(xpathBlock.overlay).waitFor({ state: "hidden" });

      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionTitleXpath)).toHaveText(
        `${caseConf.collection_name_edited}`,
      );
    });

    await test.step("Xóa collection trong dashboard", async () => {
      await page.goto(collectionUrl);
      await page.getByRole("button", { name: "Delete" }).click();
      await page.locator(`//div[contains(@class, 's-modal-footer')]//button[contains(@class, 'is-danger')]`).click();
      await expect(page.locator("div.s-toast")).toContainText(`Deleted collection ${caseConf.collection_name_edited}`);
    });

    await test.step("Customize theme > Featured Collection: mở block preview", async () => {
      dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      //Go to web front by page ID
      await dashboardPage.navigateToMenu("Online Store");
      await dashboardPage.page.getByRole("button", { name: "Customize" }).first().click();
      await frameLocator.locator(xpathBlock.overlay).waitFor({ state: "hidden" });

      await webBuilder.frameLocator.locator(blockSelector).click();
      await dashboard.locator(wbBlockFeaturedCollection.tabContentXpath).click();

      await expect(dashboard.locator(wbBlockFeaturedCollection.dataRemoveOnSideBarXpath)).toHaveText("Data removed");
    });
  });

  test("@SB_WEB_BUILDER_LB_NFC_09 Check block featured collection trên mobile", async ({
    dashboard,
    pageMobile,
    conf,
    snapshotFixture,
  }) => {
    const settingBlock = conf.caseConf.block_data;
    const homePage = new SFHome(pageMobile, conf.suiteConf.domain);
    await test.step("Trong web builder, switch device desktop sang mobile", async () => {
      //set source for section
      await dashboard.locator(wbBlockFeaturedCollection.layerButtonXpath).click();
      await webBuilder.setVariableForSection({
        sectionName: "Section",
        sourceType: "Collection",
        sourceData: "Collection 1",
        sectionIndex: 1,
      });
      await webBuilder.frameLocator.locator(blockSelector).click();
      await dashboard.locator(wbBlockFeaturedCollection.tabDesignXpath).click();
      await dashboard.locator(wbBlockFeaturedCollection.widgetLayoutXpath).last().click();
      await dashboard.locator(wbBlockFeaturedCollection.xpathProductPerRow).click();
      await dashboard.locator(wbBlockFeaturedCollection.selectProductPerRowAuto).click();
      await waitSelector(dashboard, wbBlockFeaturedCollection.smallCardXpath);

      await dashboard.click(wbBlockFeaturedCollection.switchDeviceMobileButton);

      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveAttribute(
        "style",
        /width: 100%/,
      );
    });

    await test.step("Set 1 bộ data cho block featured collection ", async () => {
      //Design tab
      await dashboard.locator(wbBlockFeaturedCollection.tabDesignXpath).click();
      await dashboard
        .locator(wbBlockFeaturedCollection.inputBoxProductPerPageXpath)
        .fill(settingBlock.number_of_product);
      await dashboard.locator(wbBlockFeaturedCollection.headerXpath).click();
      await expect(dashboard.locator('[label="Products to show"]')).toHaveAttribute(
        "value",
        new RegExp(settingBlock.number_of_product),
      );

      await dashboard.locator('[data-widget-id="align_self"] .widget-size__thickness-item >> nth=2').click();
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnFrameLocator)).toHaveCSS(
        "align-self",
        new RegExp(`${settingBlock.align_block}`),
      );

      await dashboard.locator('[data-widget-id="opacity"] .sb-input__inner-append').fill(`${settingBlock.opacity}`);
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
        "opacity",
        new RegExp(`${settingBlock.opacity / 100}`),
      );

      await dashboard
        .locator('[data-widget-id="border_radius"] .sb-input__inner-append')
        .fill(`${settingBlock.radius}`);
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
        "border-radius",
        new RegExp(`${settingBlock.radius}px`),
      );

      await webBuilder.setMarginPadding("padding", settingBlock.padding);
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
        "padding",
        new RegExp(`${settingBlock.padding.top}px`),
      );

      await webBuilder.setMarginPadding("margin", settingBlock.margin);
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnFrameLocator)).toHaveCSS(
        "margin",
        new RegExp(`${settingBlock.margin.top}px`),
      );

      //Content tab
      await dashboard.click(wbBlockFeaturedCollection.tabContentXpath);
      await dashboard.locator(wbBlockFeaturedCollection.collectionNameInput).fill(`${settingBlock.heading}`);
      await dashboard.locator(wbBlockFeaturedCollection.headerXpath).click();
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionTitleXpath)).toHaveText(
        `${settingBlock.heading}`,
      );

      await dashboard.locator(wbBlockFeaturedCollection.collectionDescriptionInput).fill(`${settingBlock.description}`);
      await dashboard.locator(wbBlockFeaturedCollection.headerXpath).click();
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionDescriptionXpath)).toHaveText(
        `${settingBlock.description}`,
      );

      await dashboard.locator(wbBlockFeaturedCollection.collectionButtonInput).fill(`${settingBlock.button_label}`);
      await dashboard.locator(wbBlockFeaturedCollection.headerXpath).click();
      await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.collectionButtonXpath)).toHaveText(
        `${settingBlock.button_label}`,
      );
    });

    await test.step("View SF trên mobile", async () => {
      await webBuilder.clickSaveButton();
      await homePage.gotoHomePage();

      await expect(homePage.page.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
        "align-self",
        new RegExp(`${settingBlock.align_block}`),
      );
      await expect(homePage.page.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
        "opacity",
        new RegExp(`${settingBlock.opacity / 100}`),
      );
      await expect(homePage.page.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
        "border-radius",
        new RegExp(`${settingBlock.radius}px`),
      );
      await expect(homePage.page.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
        "padding",
        new RegExp(`${settingBlock.padding.top}px`),
      );
      await expect(homePage.page.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
        "margin",
        new RegExp(`${settingBlock.margin.top}px`),
      );
      await expect(homePage.page.locator(wbBlockFeaturedCollection.collectionTitleXpath)).toHaveText(
        `${settingBlock.heading}`,
      );
      await expect(homePage.page.locator(wbBlockFeaturedCollection.collectionDescriptionXpath)).toHaveText(
        `${settingBlock.description}`,
      );
      await expect(homePage.page.locator(wbBlockFeaturedCollection.collectionButtonXpath)).toHaveText(
        `${settingBlock.button_label}`,
      );
    });

    await test.step("Check featured collection trên mobile khi set layout = Grid", async () => {
      await dashboard.locator(wbBlockFeaturedCollection.tabDesignXpath).click();
      for (const layoutGrid of conf.caseConf.layout_grid) {
        await dashboard.locator(wbBlockFeaturedCollection.widgetLayoutXpath).last().click();
        await dashboard.locator(wbBlockFeaturedCollection.layoutGridOnPopup).click();
        await dashboard.locator(wbBlockFeaturedCollection.layoutLabelXpath).hover();
        await dashboard
          .locator(`//label[contains(.,'Size card')]/ancestor::div[2]//label[contains(.,'${layoutGrid.card_size}')]`)
          .click();
        await waitTimeout(2000);

        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          iframe: webBuilder.iframe,
          selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
          snapshotName: `${process.env.ENV}-${layoutGrid.snapshot_on_WB}`,
        });

        await webBuilder.clickSaveButton();
        await homePage.gotoHomePage();
        await waitTimeout(2000);

        await snapshotFixture.verify({
          page: homePage.page,
          selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
          snapshotName: `${process.env.ENV}-${layoutGrid.snapshot_on_SF}`,
        });
      }
    });

    await test.step("Check featured collection trên mobile khi set layout = Mix", async () => {
      const layoutMix = conf.caseConf.layout_mix;
      await dashboard.locator(wbBlockFeaturedCollection.widgetLayoutXpath).last().click();
      await dashboard.locator(wbBlockFeaturedCollection.layoutMixOnPopup).click();
      await expect(dashboard.locator("//label[contains(.,'Size card')]")).toBeHidden();
      await dashboard.locator(wbBlockFeaturedCollection.layoutLabelXpath).click();
      await dashboard
        .locator('//label[contains(.,"Spacing")]/ancestor::div[2]//input[contains(@class,"sb-input__inner-append")]')
        .fill(`${layoutMix.spacing_layout_mix}`);
      await dashboard.locator(wbBlockFeaturedCollection.headerXpath).click();
      await webBuilder.clickSaveButton();
      await waitTimeout(2000);

      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        iframe: webBuilder.iframe,
        selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
        snapshotName: `${process.env.ENV}-${layoutMix.snapshot_on_WB}`,
      });

      await homePage.gotoHomePage();
      await waitTimeout(2000);

      await expect(homePage.page.locator(".featured_collection__container .mix__container")).toHaveCSS(
        "--spacing-item",
        new RegExp(`${layoutMix.spacing_layout_mix}`),
      );
      await snapshotFixture.verify({
        page: homePage.page,
        selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
        snapshotName: `${process.env.ENV}-${layoutMix.snapshot_on_SF}`,
      });
    });

    await test.step("Check featured collection trên mobile khi set layout = Slide", async () => {
      for (const layoutSlide of conf.caseConf.layout_slide) {
        await dashboard.locator(wbBlockFeaturedCollection.widgetLayoutXpath).last().click();
        await dashboard.locator(wbBlockFeaturedCollection.layoutSlideOnPopup).click();
        await dashboard.locator(wbBlockFeaturedCollection.layoutLabelXpath).hover();
        await dashboard
          .locator(`//label[contains(.,'Size card')]/ancestor::div[2]//label[contains(.,'${layoutSlide.card_size}')]`)
          .click();

        await expect(webBuilder.frameLocator.locator('[class="slider__container"]')).toHaveCSS(
          "--min-width",
          new RegExp(`${layoutSlide.min_width}`),
        );
        await waitTimeout(2000);

        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          iframe: webBuilder.iframe,
          selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
          snapshotName: `${process.env.ENV}-${layoutSlide.snapshot_on_WB}`,
        });

        await webBuilder.clickSaveButton();
        await homePage.gotoHomePage();
        await waitTimeout(2000);

        await snapshotFixture.verify({
          page: homePage.page,
          selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
          snapshotName: `${process.env.ENV}-${layoutSlide.snapshot_on_SF}`,
        });
      }
    });
  });

  test("@SB_WEB_BUILDER_LB_NFC_07 Check block featured collection với 1 bộ data common", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    let currentPage: Page;
    for (const dataCommon of conf.caseConf.setting_data) {
      await test.step("Set các bộ common data cho block Featured collection", async () => {
        await webBuilder.changeDesign(dataCommon.style);

        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnFrameLocator)).toHaveCSS(
          "align-self",
          new RegExp(`${dataCommon.verify_css.align_block}`),
        );
        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnFrameLocator)).toHaveCSS(
          "width",
          new RegExp(`${dataCommon.verify_css.width_block}px`),
        );
        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "opacity",
          new RegExp(`${dataCommon.verify_css.opacity / 100}`),
        );
        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "background",
          `${dataCommon.verify_css.background}`,
        );
        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "border",
          `${dataCommon.verify_css.border}`,
        );
        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "border-radius",
          new RegExp(`${dataCommon.verify_css.radius}px`),
        );
        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "box-shadow",
          dataCommon.verify_css.shadow,
        );
        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "padding",
          new RegExp(`${dataCommon.verify_css.padding}px`),
        );
        await expect(webBuilder.frameLocator.locator(wbBlockFeaturedCollection.blockXpathOnFrameLocator)).toHaveCSS(
          "margin",
          new RegExp(`${dataCommon.verify_css.margin}px`),
        );
      });

      await test.step("Check preview & SF trang homepage", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await webBuilder.clickPreview({ context, dashboard });

        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "align-self",
          new RegExp(`${dataCommon.verify_css.align_block}`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "width",
          new RegExp(`${dataCommon.verify_css.width_block}px`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "opacity",
          new RegExp(`${dataCommon.verify_css.opacity / 100}`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "background",
          `${dataCommon.verify_css.background}`,
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "border",
          `${dataCommon.verify_css.border}`,
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "border-radius",
          new RegExp(`${dataCommon.verify_css.radius}px`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "box-shadow",
          dataCommon.verify_css.shadow,
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "padding",
          new RegExp(`${dataCommon.verify_css.padding}px`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "margin",
          new RegExp(`${dataCommon.verify_css.margin}px`),
        );

        //Check SF
        await currentPage.goto(`https://${conf.suiteConf.domain}`);
        await currentPage.waitForLoadState("load");

        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "align-self",
          new RegExp(`${dataCommon.verify_css.align_block}`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "width",
          new RegExp(`${dataCommon.verify_css.width_block}px`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "opacity",
          new RegExp(`${dataCommon.verify_css.opacity / 100}`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "background",
          `${dataCommon.verify_css.background}`,
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "border",
          `${dataCommon.verify_css.border}`,
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "border-radius",
          new RegExp(`${dataCommon.verify_css.radius}px`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "box-shadow",
          dataCommon.verify_css.shadow,
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "padding",
          new RegExp(`${dataCommon.verify_css.padding}px`),
        );
        await expect(currentPage.locator(wbBlockFeaturedCollection.blockXpathOnSF)).toHaveCSS(
          "margin",
          new RegExp(`${dataCommon.verify_css.margin}px`),
        );
      });
    }
    await waitTimeout(3000);
    await snapshotFixture.verify({
      page: currentPage,
      selector: wbBlockFeaturedCollection.firstSectionSelectorOnSF,
      snapshotName: `${process.env.ENV}-07.SF_common_data.png`,
    });
  });
});
