import { expect, test } from "@fixtures/website_builder";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { SfnBlockGalleryMobilePage } from "@pages/dashboard/sfn_block_gallery_mobile";
import { WebBuilderBlockGallery } from "@pages/dashboard/wb_block_gallery";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { FrameLocator } from "@playwright/test";
import { PageSettingsData } from "@types";

let webBuilder: WebBuilderBlockGallery;
let xpathBlock: Blocks;
let settingsData: PageSettingsData;
let settingsDataPublish: PageSettingsData;
let frameLocator: FrameLocator;

test.describe("Check function block gallery", async () => {
  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_data);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webBuilder = new WebBuilderBlockGallery(dashboard, conf.suiteConf.domain);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    frameLocator = xpathBlock.frameLocator;

    await test.step("Update theme", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
        settingsData = response.settings_data as PageSettingsData;
      }

      //get publish theme data
      const responsePublish = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsDataPublish = responsePublish.settings_data as PageSettingsData;

      //Update collection page data for publish theme
      settingsDataPublish.pages["product"].default.elements = settingsData.pages["product"].default.elements;
      await builder.updateSiteBuilder(conf.suiteConf.theme_id, settingsDataPublish);
    });

    await test.step(`Precond - vào page product detail trong wb`, async () => {
      await webBuilder.page.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.theme_id}?page=product`,
      );
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");
    });
  });

  test(`@SB_WEB_BUILDER_PRD_49 Verify resize product Media layout grid block Gallery`, async ({
    conf,
    snapshotFixture,
  }) => {
    //select source for section
    await webBuilder.page.locator('header [name="Layer"]').click();
    await webBuilder.setVariableForSection({
      sectionName: "Product detail",
      sourceType: "Product",
      sourceData: conf.caseConf.product_test_layout,
      sectionIndex: 1,
    });

    await test.step(`Tại Action bar, click Insert Panel. Insert block Media -> Chọn layout dạng Grid  `, async () => {
      await webBuilder.frameLocator.locator(webBuilder.xpathProductGallery).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.changeLayout(conf.suiteConf.layout.grid);
      await webBuilder.frameLocator.locator(webBuilder.xpathGalleryGrid).first().waitFor({ state: "visible" });
      await waitForImageLoaded(webBuilder.page, webBuilder.xpathProductGallery, webBuilder.iframe);
      await expect(webBuilder.frameLocator.locator(webBuilder.xpathGalleryGrid)).toBeVisible();
    });

    await test.step(`Resize height của block media -> Không resize được`, async () => {
      const resizeTopBtn = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class, 'resizer top')]`;
      const resizeBottomBtn = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class, 'resizer bottom')]`;

      await expect(webBuilder.frameLocator.locator(resizeTopBtn)).toBeHidden();
      await expect(webBuilder.frameLocator.locator(resizeBottomBtn)).toBeHidden();
    });

    await test.step(`Resize width của block media < min width = 320 px`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.xpathProductGallery).click();
      await webBuilder.changeDesign(conf.caseConf.expect.resize1);
      await webBuilder.frameLocator.locator(webBuilder.xpathProductGallery).first().waitFor({ state: "visible" });
      await waitForImageLoaded(webBuilder.page, webBuilder.xpathProductGallery, webBuilder.iframe);

      await snapshotFixture.verifyWithIframe({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: webBuilder.xpathProductGallery,
        snapshotName: `${process.env.ENV}-49-1-grid-resize-to-clip.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step(`Resize width của block media < 20 px`, async () => {
      const blockGallery = webBuilder.frameLocator.locator(webBuilder.xpathProductGallery);
      const blockGalleryReact = await blockGallery.boundingBox();
      await webBuilder.resizeBlock(blockGallery, {
        at_position: "left",
        to_specific_point: {
          x: blockGalleryReact.x + 999,
        },
      });
      await webBuilder.frameLocator.locator(webBuilder.xpathProductGallery).first().waitFor({ state: "visible" });
      await waitForImageLoaded(webBuilder.page, webBuilder.xpathProductGallery, webBuilder.iframe);
      await snapshotFixture.verifyWithIframe({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: webBuilder.xpathProductGallery,
        snapshotName: `${process.env.ENV}-49-2-grid-resize-to-min.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step(`Resize width của block media > min width = 320 px`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.xpathProductGallery).click();
      await webBuilder.changeDesign(conf.caseConf.expect.resize2);
      await webBuilder.frameLocator.locator(webBuilder.xpathProductGallery).first().waitFor({ state: "visible" });
      await waitForImageLoaded(webBuilder.page, webBuilder.xpathProductGallery, webBuilder.iframe);

      await snapshotFixture.verifyWithIframe({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: webBuilder.xpathProductGallery,
        snapshotName: `${process.env.ENV}-49-3-grid-resize-to-500.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });
  });
});

test.describe("Verify product gallery on Product Detail page", async () => {
  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    webBuilder = new WebBuilderBlockGallery(dashboard, conf.suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    await test.step(`Pre condition: add blank section and wait for web stable before test`, async () => {
      await webBuilder.openWebBuilder({ type: "site", id: conf.suiteConf.theme_id, page: "product" });
      await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");
      await webBuilder.page.waitForLoadState("domcontentloaded");
      await webBuilder.removeUnuseSection();
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.dnd_blank_section);
      await webBuilder.switchToTab("Content");
      await webBuilder.changeContent(conf.suiteConf.section_name);
      await webBuilder.page.waitForLoadState("domcontentloaded");
    });
  });

  test(`@SB_WEB_BUILDER_PRD_50 Verify product Media layout Grid block Gallery trên mobile`, async ({
    conf,
    pageMobile,
  }) => {
    await test.step(`Pre condition: add black section and switch sang mobile`, async () => {
      await webBuilder.page.waitForLoadState("networkidle");
      await webBuilder.page.waitForLoadState("domcontentloaded");
      await webBuilder.page.locator("#search-data-source").click();
      await webBuilder.page.waitForSelector(webBuilder.xpathDataSourceProduct);
      await webBuilder.page.locator(webBuilder.xpathDataSourceProduct).click();
      await webBuilder.page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });
      const xpathProductHasVariantImage = `//div[contains(@class,'list-search-result')]//div[contains(@class,'sb-selection-item') and descendant::span[contains(text(), '${conf.caseConf.product_has_variant_image}')]]`;
      await webBuilder.page.waitForSelector(xpathProductHasVariantImage);
      await webBuilder.page.locator(xpathProductHasVariantImage).click();
      await webBuilder.page.waitForSelector(`//label[normalize-space()='Default variant']`);

      // Insert blank section
      await webBuilder.insertSectionBlock({
        parentPosition: conf.suiteConf.add_block.parent_position,
        template: conf.suiteConf.add_block.template,
      });
    });

    await test.step(`Tại Action bar, click Insert Panel. Insert block Media -> Chọn layout dạng Grid`, async () => {
      await webBuilder.switchToTab("Design");
      const xpathLayout = `div[data-widget-id='layout']>div>div:nth-child(2)`;
      await webBuilder.page.locator(xpathLayout).first().waitFor({ state: "visible" });
      await webBuilder.page.locator(xpathLayout).click();
      const gridSelection = `//div[contains(@class, 'w-builder__popover w-builder__widget--layout')]/descendant::div[contains(@class, 'list-icon')]/span[1]`;
      await webBuilder.page.locator(gridSelection).first().waitFor({ state: "visible" });
      await webBuilder.page.locator(gridSelection).click();
      await webBuilder.frameLocator.locator(webBuilder.xpathProductGallery).first().waitFor({ state: "visible" });
      await webBuilder.frameLocator.locator(webBuilder.xpathGalleryGrid).first().waitFor({ state: "visible" });
      await webBuilder.page.waitForTimeout(1000);
      await waitForImageLoaded(webBuilder.page, webBuilder.xpathProductGallery, webBuilder.iframe);

      await webBuilder.switchMobileBtn.click();
    });

    await test.step(`Swipe chuyển giữa các media tại preview`, async () => {
      const xpathProductGalleryMobile = `//div[contains(@class, 'layout-mobile')]/descendant::div[contains(@class, 'wb-preview__section--container')]/descendant::div[contains(@class, 'media_gallery_mobile--container media_gallery__container')]`;
      const xpathProductGalleryFirst = `${xpathProductGalleryMobile}[1]`;
      await webBuilder.frameLocator.locator(xpathProductGalleryFirst).first().waitFor({ state: "visible" });
      await webBuilder.frameLocator.locator(xpathProductGalleryFirst).dblclick();
      const modal = `//div[contains(@class, 'outside-modal fixed popover-bottom__overlay w-100 h-100 flex justify-center preview-media')]`;
      await webBuilder.frameLocator.locator(modal).first().waitFor({ state: "visible" });
      const imgItem = `//div[contains(@class, 'outside-modal fixed popover-bottom__overlay w-100 h-100 flex justify-center preview-media')]/descendant::div[contains(@class, 'VueCarousel-inner')]/descendant::div[contains(@class, 'slider-item')]`;
      const countImg = await webBuilder.frameLocator.locator(imgItem).count();
      for (let index = 1; index <= countImg; index++) {
        const xpathImgItem = `${imgItem}[${index}]`;
        await webBuilder.frameLocator.locator(xpathImgItem).first().waitFor({ state: "visible" });
        const firstImgReact = await webBuilder.frameLocator.locator(xpathImgItem).boundingBox();
        await webBuilder.frameLocator.locator(xpathImgItem).hover();
        await webBuilder.page.mouse.down();
        await webBuilder.page.mouse.move(firstImgReact.x + 50, firstImgReact.y);
        await webBuilder.page.mouse.up();

        if (index === countImg) {
          break;
        }

        const counterXpath = `//div[contains(@class, 'preview-media__container')]/descendant::div[contains(text(), '${
          index + 1
        } / ${countImg}')]`;
        await webBuilder.frameLocator.locator(counterXpath).first().waitFor({ state: "visible" });
        await webBuilder.page.waitForTimeout(1000);
        await expect(webBuilder.frameLocator.locator(counterXpath)).toBeVisible();
      }
    });

    await test.step(`Save setting tại web builder. Đi đến webfront của product -> Swipe chuyển giữa các media tại preview `, async () => {
      const closeIcon = `//div[contains(@class,'preview-media__close-icon')]/descendant::div[contains(@class, 'svg-container')]`;
      await webBuilder.frameLocator.locator(closeIcon).click();
      await webBuilder.clickSaveButton();
      const sfnMobilePage = new SfnBlockGalleryMobilePage(pageMobile, conf.suiteConf.domain);
      await sfnMobilePage.gotoProduct(conf.caseConf.product_has_variant_image_seo);
      await sfnMobilePage.page.waitForLoadState("networkidle");
      await sfnMobilePage.page.waitForLoadState("domcontentloaded");
      // Todo: cần check được swipe trên mobile
    });

    await test.step(`Click vào media video -> chay video ngay lap tuc`, async () => {
      const sfnMobilePage = new SfnBlockGalleryMobilePage(pageMobile, conf.suiteConf.domain);
      await sfnMobilePage.gotoProduct(conf.caseConf.product_has_video_seo);
      await sfnMobilePage.page.waitForLoadState("networkidle");
      await sfnMobilePage.page.waitForLoadState("domcontentloaded");

      await sfnMobilePage.page.locator(webBuilder.sfnProductGalleryMobile).click();

      // Todo: Check swipe đến video và click chạy video
    });

    await test.step(`Click vào view ảnh`, async () => {
      const sfnMobilePage = new SfnBlockGalleryMobilePage(pageMobile, conf.suiteConf.domain);
      await sfnMobilePage.gotoProduct(conf.caseConf.product_has_variant_image_seo);
      await sfnMobilePage.page.waitForLoadState("networkidle");
      await sfnMobilePage.page.waitForLoadState("domcontentloaded");

      await sfnMobilePage.page.locator(webBuilder.sfnProductGalleryMobile).click();

      // Todo: Check swipe đến video và click chạy video

      const firstImgInModal = `//div[contains(@class, 'outside-modal fixed popover-bottom__overlay w-100 h-100 flex justify-center preview-media')]/descendant::div[contains(@class, 'VueCarousel-inner')]/descendant::div[contains(@class, 'slider-item')][1]/descendant::img`;
      await sfnMobilePage.page.waitForSelector(firstImgInModal);
      await expect(sfnMobilePage.page.locator(firstImgInModal)).toBeVisible();
    });
  });
});

test.describe("Verify block gallery mobile on home page", async () => {
  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ conf, dashboard, builder }, testInfo) => {
    webBuilder = new WebBuilderBlockGallery(dashboard, conf.suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);

    await test.step("Update theme", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
        settingsData = response.settings_data as PageSettingsData;
      }

      settingsData.pages["product"].default.elements = [];
      await builder.updateSiteBuilder(conf.suiteConf.theme_id, settingsData);
      await xpathBlock.openWebBuilder({
        id: conf.suiteConf.theme_id,
        type: "site",
      });
      await xpathBlock.reloadIfNotShow();
    });

    await test.step("Open Product page detail", async () => {
      await webBuilder.selectPageOnPageSelector("Product detail");
      await expect(webBuilder.page.locator('.sb-selection-group-item:has-text("Preview:")')).toBeVisible();
      await webBuilder.page.locator('[id="Icons/Devices/Mobile"]').click();
    });

    await test.step("Insert new section to WB", async () => {
      await xpathBlock.dragAndDropInWebBuilder(conf.suiteConf.dnd_section);
    });
  });

  test(`@SB_WEB_BUILDER_PRD_58 Verify product Media layout Mix block Gallery trên mobile`, async ({ conf }) => {
    await test.step(`Pre condition: add black section and switch sang mobile`, async () => {
      await webBuilder.changeDataSourceInSection(conf.caseConf.product_has_video);
      await webBuilder.switchMobileBtn.click();
    });

    await test.step(`Tại Action bar, click Insert Panel. Insert block Media  -> Chọn layout dạng Carousel `, async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: conf.suiteConf.add_block.parent_position,
        template: conf.suiteConf.add_block.template,
      });
      await webBuilder.changeLayout(conf.suiteConf.layout.carousel);
      await webBuilder.changeNavTypeCarousel("None", true);
      await expect(webBuilder.frameLocator.locator(webBuilder.mobileNavTypeNone)).toBeVisible();
    });

    await test.step(`Tại Action bar, click Insert Panel. Insert block Media -> Chọn layout dạng Mix`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.xpathProductGallery).click();
      await webBuilder.changeLayout(conf.suiteConf.layout.mix);
      const xpathMix = webBuilder.getXpathProductGalleryByLayout("Mix", true);
      await expect(webBuilder.frameLocator.locator(xpathMix)).toBeVisible();
    });

    await test.step(`Swipe chuyển giữa các media tại preview`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.xpathProductGallery).dblclick();
      await webBuilder.frameLocator.locator(webBuilder.mobileModal).first().waitFor({ state: "visible" });

      const countImg = await webBuilder.frameLocator.locator(webBuilder.mobileImgItem).count();
      for (let index = 1; index <= countImg; index++) {
        const xpathImgItem = `${webBuilder.mobileImgItem}[${index}]`;
        await webBuilder.frameLocator.locator(xpathImgItem).first().waitFor({ state: "visible" });
        const firstImgReact = await webBuilder.frameLocator.locator(xpathImgItem).boundingBox();
        await webBuilder.frameLocator.locator(xpathImgItem).hover();
        await webBuilder.page.mouse.down();
        await webBuilder.page.mouse.move(firstImgReact.x + 50, firstImgReact.y);
        await webBuilder.page.mouse.up();

        if (index === countImg) {
          break;
        }

        const counterXpath = `//div[contains(@class, 'preview-media__container')]/descendant::div[contains(text(), '${
          index + 1
        } / ${countImg}')]`;
        // Wait 1s để chờ slide được kéo hết ra ngoài màn hình và tăng counter lên
        await webBuilder.page.waitForTimeout(1000);
        await expect(webBuilder.frameLocator.locator(counterXpath)).toBeVisible();
      }
    });

    await test.step(`Swipe lần lượt giữa các media, đến media cuối cùng -> vẫn giữ nguyên media cuối cùng`, async () => {
      const countImg = await webBuilder.frameLocator.locator(webBuilder.mobileImgItem).count();
      const xpathImgItem = `${webBuilder.mobileImgItem}[${countImg}]`;
      await webBuilder.frameLocator.locator(xpathImgItem).first().waitFor({ state: "visible" });
      const firstImgReact = await webBuilder.frameLocator.locator(xpathImgItem).boundingBox();
      await webBuilder.frameLocator.locator(xpathImgItem).hover();
      await webBuilder.page.mouse.down();
      await webBuilder.page.mouse.move(firstImgReact.x + 50, firstImgReact.y);
      await webBuilder.page.mouse.up();

      const counterXpath = `//div[contains(@class, 'preview-media__container')]/descendant::div[contains(text(), '${countImg} / ${countImg}')]`;
      await expect(webBuilder.frameLocator.locator(counterXpath)).toBeVisible();
    });

    await test.step(`Click vào media video -> play video`, async () => {
      const countImg = await webBuilder.frameLocator.locator(webBuilder.mobileImgItem).count();
      const xpathVideo = `${webBuilder.mobileImgItem}[${countImg}]/descendant::iframe[contains(@data-src, 'youtube.com')]`;
      await webBuilder.frameLocator.locator(xpathVideo).first().waitFor({ state: "visible" });
      await expect(webBuilder.frameLocator.locator(xpathVideo)).toBeVisible();
    });
  });
});
