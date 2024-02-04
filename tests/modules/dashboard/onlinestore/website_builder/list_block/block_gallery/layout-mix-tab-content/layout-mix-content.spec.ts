import { expect, test } from "@fixtures/website_builder";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { WebBuilderBlockGallery } from "@pages/dashboard/wb_block_gallery";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { FrameLocator } from "@playwright/test";
import { PageSettingsData } from "@types";
import { BlockGallerySf } from "@pages/new_ecom/storefront/block_gallery_sf";

test.describe("Verify setting block gallery", () => {
  let sfPage: BlockGallerySf;
  let wbPage: WebBuilderBlockGallery;
  let xpathBlock: Blocks;
  let settingsData: PageSettingsData;
  let settingsDataPublish: PageSettingsData;
  let frameLocator: FrameLocator;

  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_data);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    wbPage = new WebBuilderBlockGallery(dashboard, conf.suiteConf.domain);
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
      await wbPage.page.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.theme_id}?page=product`,
      );
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await wbPage.page.waitForLoadState("networkidle");
    });

    await test.step(`Pre-condition: choose Mix layout`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      await wbPage.changeLayout("Mix");
      await wbPage.waitAbit(2 * 1000);
      await wbPage.page.locator(wbPage.layoutLabelXpath).click();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_54 Verify Edit Content của layout Mix`, async ({ conf, context }) => {
    const productHandles = {
      noImage: "product-w-no-image",
      someImage: "product-w-some-images",
      manyImage: "product-w-many-images",
    };

    await test.step(`Tại tab Content. Check trạng thái default tab Content `, async () => {
      // Skip this step, already check in case SB_WEB_BUILDER_PRD_45
    });

    await test.step(`Click chọn Media ratio. Hover vào từng loại ratio`, async () => {
      await wbPage.selectProductPreviewByName("Product w many images");
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Content");
      await wbPage.clickMediaRatio();
      const ratioTooltips = [
        wbPage.mediaRatio.square.tooltip,
        wbPage.mediaRatio.portrait.tooltip,
        wbPage.mediaRatio.landscape.tooltip,
      ];

      for (let i = 0; i < ratioTooltips.length; i++) {
        const tooltipItem = ratioTooltips[i];
        await wbPage.hoverRatio(i);
        const xpathMediaRatio = wbPage.getXpathMediaRatio(tooltipItem);

        // Active tooltip
        const tooltipStyles = wbPage.genLoc(xpathMediaRatio).getAttribute("style");
        expect(tooltipStyles).not.toContain("display: none;");
      }
    });

    await test.step(`Chọn ratio portrait 3:4`, async () => {
      await wbPage.clickRatio(wbPage.mediaRatio.portrait.index);
      await wbPage.titleBar.click({ delay: 200 });
      await wbPage.clickSaveButton();

      // Verify wb
      const mediaItemLocs = await wbPage.genLocFrame(wbPage.xpathGridItems).all();
      for (const mediaItemLoc of mediaItemLocs) {
        let styles = await mediaItemLoc.getAttribute("style");
        styles = styles.replace(/\s/, "");
        expect(styles).toContain(wbPage.mediaRatio.portrait.style);
      }

      // Verify sf
      const newTab = await context.newPage();
      sfPage = new BlockGallerySf(newTab, conf.suiteConf.domain);
      await sfPage.openProductPage(productHandles.manyImage);
      await waitForImageLoaded(sfPage.page, sfPage.xpathProductGalleryContainer);

      const sfMediaItemLocs = await sfPage.genLoc(sfPage.xpathGridItems).all();
      for (const mediaItemLoc of sfMediaItemLocs) {
        let styles = await mediaItemLoc.getAttribute("style");
        styles = styles.replace(/\s/, "");
        expect(styles).toContain(wbPage.mediaRatio.portrait.style);
      }
    });

    await test.step(`Chọn ratio Landscape 16:9`, async () => {
      await wbPage.clickMediaRatio();
      await wbPage.clickRatio(wbPage.mediaRatio.landscape.index);
      await wbPage.titleBar.click({ delay: 200 });
      await wbPage.clickSaveButton();

      // Verify wb
      const mediaItemLocs = await wbPage.genLocFrame(wbPage.xpathGridItems).all();
      for (const mediaItemLoc of mediaItemLocs) {
        let styles = await mediaItemLoc.getAttribute("style");
        styles = styles.replace(/\s/, "");
        expect(styles).toContain(wbPage.mediaRatio.landscape.style);
      }

      // Verify sf
      await sfPage.openProductPage(productHandles.manyImage);
      await wbPage.waitAbit(5 * 1000);
      await sfPage.waitResponseWithUrl("/assets/theme.css");

      const sfMediaItemLocs = await sfPage.genLoc(sfPage.xpathGridItems).all();
      for (const mediaItemLoc of sfMediaItemLocs) {
        let styles = await mediaItemLoc.getAttribute("style");
        styles = styles.replace(/\s/, "");
        expect(styles).toContain(wbPage.mediaRatio.landscape.style);
      }
    });

    await test.step(`Tại tab photo list. Check trạng thái default`, async () => {
      // Check default select all photos
      const photoListText = await wbPage.genLoc("//div[@data-widget-id='photo_list']//button").first().textContent();
      expect(photoListText).toContain("All photos");

      // Droplist co 2 option
      await wbPage.clickPhotoList();
      const photoListOptions = await wbPage.getPhotoListOptions();
      expect(JSON.stringify(photoListOptions)).toEqual(JSON.stringify(wbPage.photoListOptions));

      // Wb hien thi all product (10 prod + view all 45 products)
      const numberOfProductImage = await wbPage.getNumberOfProductGalleryImage("Mix");
      expect(numberOfProductImage).toEqual(10);

      const buttonViewAllText = await wbPage.getButtonViewAllText("Mix");
      expect(buttonViewAllText).toContain("View all 45 images");
    });

    await test.step(`Preview sản phẩm ngoài SF`, async () => {
      await sfPage.openProductPage(productHandles.manyImage);
      await waitForImageLoaded(sfPage.page, sfPage.xpathProductGalleryContainer);
      await sfPage.waitResponseWithUrl("/assets/theme.css");

      // Sf hien thi all product (10 prod + view all 45 products)
      const numberOfProductImage = await sfPage.getNumberOfProductGalleryImage("Mix");
      expect(numberOfProductImage).toEqual(10);

      const buttonViewAllText = await sfPage.getButtonViewAllText("Mix");
      expect(buttonViewAllText).toContain("View all 45 images");
    });

    await test.step(`Click vào media video`, async () => {
      //TODO: update when found solution verify video
    });

    await test.step(`Save setting tại web builder. Đi đến webfront của product   -> Swipe chuyển giữa các media    `, async () => {
      // fill your code here
    });

    await test.step(`Chon variant và chọn Only show variant`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.setProductGalleryContent({
        photoList: "Only show variant photos",
      });

      // Select variant S, Red ~> 1 photo
      await wbPage.selectVariant("S");
      await wbPage.selectVariant("Red");
      const numberOfProductImage = await wbPage.getNumberOfProductGalleryImage("Mix");
      expect(numberOfProductImage).toEqual(1);
    });

    await test.step(`Tại menu photo list, Chọn hiển thị only show variant photo > click chọn variant variant có ảnh`, async () => {
      // Select variant S, Green ~> 2 photo
      await wbPage.selectVariant("Green");
      const numberOfProductImage = await wbPage.getNumberOfProductGalleryImage("Mix");
      expect(numberOfProductImage).toEqual(2);
    });

    await test.step(`Tại menu photo list, Chọn hiển thị only show variant photo > click chọn variant variant ko ảnh`, async () => {
      // Select variant S, Blue ~> all photo (10)
      await wbPage.selectVariant("Blue");
      const numberOfProductImage = await wbPage.getNumberOfProductGalleryImage("Mix");
      expect(numberOfProductImage).toEqual(10);
    });
  });

  test(`@SB_WEB_BUILDER_PRD_56 Verify Edit tab Design layout Mix block Gallery`, async ({ conf, snapshotFixture }) => {
    await test.step(`Pre condition: change section source`, async () => {
      await wbPage.page.locator('header [name="Layer"]').click();
      await wbPage.setVariableForSection({
        sectionName: "Product detail",
        sourceType: "Product",
        sourceData: "Standard Product",
        sectionIndex: 1,
      });
    });

    await test.step(`Tại Action bar, click Insert Panel. Insert block Media -> Chọn layout dạng Mix `, async () => {
      await wbPage.waitAbit(5 * 1000);

      await snapshotFixture.verifyWithIframe({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathProductGallery,
        snapshotName: `${process.env.ENV}-block-product-gallery-mix-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step(`Edit spacing giữa các ảnh về 0 px`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      await wbPage.page.locator(xpathBlock.headingTitleTab).click();
      await wbPage.page.locator(wbPage.xpathInputSpacing).first().waitFor({ state: "visible" });
      await wbPage.page.locator(wbPage.xpathInputSpacing).fill(`${conf.caseConf.expect.space_0}`);
      await wbPage.page.locator(xpathBlock.headingTitleTab).click();
      await wbPage.frameLocator.locator(wbPage.xpathGalleryMix).first().waitFor({ state: "visible" });
      await wbPage.backBtn.click();
      await waitForImageLoaded(wbPage.page, wbPage.xpathProductGallery, wbPage.iframe);
      await wbPage.waitAbit(3 * 1000);

      await snapshotFixture.verifyWithIframe({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathProductGallery,
        snapshotName: `${process.env.ENV}-block-product-gallery-mix-spacing-0-item-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });
    await test.step(`Edit spacing giữa các ảnh thành 80 px`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      await wbPage.page.locator(xpathBlock.headingTitleTab).click();
      await wbPage.page.locator(wbPage.xpathInputSpacing).first().waitFor({ state: "visible" });
      await wbPage.page.locator(wbPage.xpathInputSpacing).fill(`${conf.caseConf.expect.space_80}`);
      await wbPage.page.locator(xpathBlock.headingTitleTab).click();
      await wbPage.frameLocator.locator(wbPage.xpathGalleryMix).first().waitFor({ state: "visible" });
      await wbPage.backBtn.click();
      await waitForImageLoaded(wbPage.page, wbPage.xpathProductGallery, wbPage.iframe);
      await wbPage.waitAbit(3 * 1000); //wait for web builder apply setting on side bar

      await snapshotFixture.verifyWithIframe({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathProductGallery,
        snapshotName: `${process.env.ENV}-block-product-gallery-mix-spacing-80-item-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step(`Chọn vào files item. Nhập giá trị radius`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      await wbPage.page.locator(wbPage.xpathRadius).first().waitFor({ state: "visible" });
      await wbPage.page.locator(wbPage.xpathRadius).fill(`${conf.caseConf.expect.space_10}`);
      await wbPage.page.locator(xpathBlock.headingTitleTab).click();
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });
      await wbPage.backBtn.click();
      await waitForImageLoaded(wbPage.page, wbPage.xpathProductGallery, wbPage.iframe);
      await snapshotFixture.verifyWithIframe({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathProductGallery,
        snapshotName: `${process.env.ENV}-block-product-gallery-mix-border-radius-10-${conf.caseConf.case_id}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step(`Edit common setting tại block Gallery`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      const listStyle = conf.caseConf.expect.styles;
      let index = 1;
      for (const style of listStyle) {
        await wbPage.changeDesign(style);

        await snapshotFixture.verifyWithIframe({
          page: wbPage.page,
          iframe: wbPage.iframe,
          selector: wbPage.xpathProductGallery,
          snapshotName: `${process.env.ENV}-block-product-gallery-mix-change-style-${index}-${conf.caseConf.case_id}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
        index++;
      }
    });
  });

  test(`@SB_WEB_BUILDER_PRD_57 Verify resize product Media layout mix block Gallery`, async ({
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Pre condition: change section source`, async () => {
      await wbPage.page.locator('header [name="Layer"]').click();
      await wbPage.setVariableForSection({
        sectionName: "Product detail",
        sourceType: "Product",
        sourceData: "Standard Product",
        sectionIndex: 1,
      });
    });

    await test.step(`Resize width của block media > min width = 320 px`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      await wbPage.changeDesign(conf.caseConf.expect.resize1);
      await wbPage.frameLocator.locator(wbPage.xpathGalleryMix).first().waitFor({ state: "visible" });
      await wbPage.backBtn.click();
      await waitForImageLoaded(wbPage.page, wbPage.xpathProductGallery, wbPage.iframe);
      await wbPage.waitAbit(3 * 1000);

      await snapshotFixture.verifyWithIframe({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathProductGallery,
        snapshotName: `${process.env.ENV}-${conf.caseConf.case_id}-block-product-gallery-mix-resize-to-400.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step(`Resize width của block media < min width = 320 px`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      await wbPage.changeDesign(conf.caseConf.expect.resize2);
      await wbPage.frameLocator.locator(wbPage.xpathGalleryMix).first().waitFor({ state: "visible" });
      await wbPage.backBtn.click();
      await waitForImageLoaded(wbPage.page, wbPage.xpathProductGallery, wbPage.iframe);
      await wbPage.waitAbit(3 * 1000);

      await snapshotFixture.verifyWithIframe({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathProductGallery,
        snapshotName: `${process.env.ENV}-${conf.caseConf.case_id}-block-product-gallery-mix-resize-to-clip.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step(`Resize width của block media < 20 px`, async () => {
      const blockGallery = wbPage.frameLocator.locator(wbPage.xpathProductGallery);
      const blockGalleryReact = await blockGallery.boundingBox();
      await wbPage.resizeBlock(blockGallery, {
        at_position: "left",
        to_specific_point: {
          x: blockGalleryReact.x + 999,
        },
      });
      await wbPage.frameLocator.locator(wbPage.xpathGalleryMix).first().waitFor({ state: "visible" });
      await wbPage.backBtn.click();
      await waitForImageLoaded(wbPage.page, wbPage.xpathProductGallery, wbPage.iframe);
      await wbPage.waitAbit(3 * 1000);

      await snapshotFixture.verifyWithIframe({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathProductGallery,
        snapshotName: `${process.env.ENV}-${conf.caseConf.case_id}-block-product-gallery-mix-resize-to-min.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });
  });
});
