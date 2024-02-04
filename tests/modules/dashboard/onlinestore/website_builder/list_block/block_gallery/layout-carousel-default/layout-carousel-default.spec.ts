import { expect, test } from "@fixtures/website_builder";
import { WebBuilderBlockGallery } from "@pages/dashboard/wb_block_gallery";
import { OcgLogger } from "@core/logger";
import { SbWebBuilderPrd60 } from "./layout-carousel-default";
import { FrameLocator } from "@playwright/test";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { PageSettingsData } from "@types";
import { BlockGallerySf } from "@pages/new_ecom/storefront/block_gallery_sf";
import { SfnBlockGalleryMobilePage } from "@pages/dashboard/sfn_block_gallery_mobile";

const logger = OcgLogger.get();

test.describe("Verify setting block gallery", () => {
  let wbPage: WebBuilderBlockGallery;
  let sfPage: BlockGallerySf;
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

    await test.step(`Pre-condition: choose Carousel layout`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      await wbPage.changeLayout("Carousel");
      await wbPage.waitAbit(2 * 1000);
      await wbPage.page.locator(wbPage.layoutLabelXpath).click();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_60 Verify hiển thị UI default khi add mới block product media layout Carousel`, async ({
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf as SbWebBuilderPrd60;
    const products = [
      {
        name: "Product w no image",
        handle: "product-w-no-image",
        snapshotName: "no-image",
      },
      {
        name: "Product w 1 image",
        handle: "product-w-1-image",
        snapshotName: "1-image",
      },
      {
        name: "Product w 2 image",
        handle: "product-w-2-image",
        snapshotName: "2-image",
      },
      {
        name: "Product w 3 image",
        handle: "product-w-3-image",
        snapshotName: "3-image",
      },
      {
        name: "Product w 4 image",
        handle: "product-w-4-image",
        snapshotName: "4-image",
      },
      {
        name: "Product w 5 image",
        handle: "product-w-5-image",
        snapshotName: "5-image",
      },
      {
        name: "Product w many images",
        handle: "product-w-many-images",
        snapshotName: "many-image",
      },
    ];

    await test.step(`Tại tab Design. Check trạng thái default tab Design `, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        selector: wbPage.xpathSidebar,
        snapshotName: `${caseConf.snapshot.sidebar.tab_design}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Chọn layout Carousel => Save. Tại tab Content. Check trạng thái default tab Content `, async () => {
      await wbPage.switchToTab("Content");
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        selector: wbPage.xpathSidebar,
        snapshotName: `${caseConf.snapshot.sidebar.tab_content}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Check hiển thị ảnh tại preview`, async () => {
      for (const product of products) {
        logger.info("Process image: " + product.name);
        // choose product
        await wbPage.selectProductPreviewByName(product.name);

        // Wait image loaded
        if (!product.name.includes("no image")) {
          const xpathFirstItem = `(${wbPage.xpathCarouselSlideItem})[1]`;
          await waitForImageLoaded(wbPage.page, xpathFirstItem, wbPage.iframe);

          // take snapshot
          await wbPage.waitAbit(2 * 1000);
          await snapshotFixture.verifyWithAutoRetry({
            page: wbPage.page,
            iframe: wbPage.iframe,
            selector: wbPage.xpathMediaGalleryContainer,
            snapshotName: `SB_WEB_BUILDER_PRD_60-${product.snapshotName}-${process.env.ENV}.png`,
          });
        } else {
          // take snapshot
          await wbPage.waitAbit(2 * 1000);
          await snapshotFixture.verifyWithAutoRetry({
            page: wbPage.page,
            iframe: wbPage.iframe,
            selector: wbPage.xpathMediaGalleryImage,
            snapshotName: `SB_WEB_BUILDER_PRD_60-${product.snapshotName}-${process.env.ENV}.png`,
          });
        }
      }
    });

    await test.step(`Chọn product có nhiều media`, async () => {
      // take snapshot
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `SB_WEB_BUILDER_PRD_60-many-medias-${process.env.ENV}.png`,
      });

      // Hover vào vùng thumbnail -> Hiển thị thanh điều hướng next/previous
      await wbPage.hoverCarouselThumbnail();

      await expect(wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavNext)).toBeVisible();
      await expect(wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavPrev)).toBeVisible();
    });

    await test.step(`Click vào thanh điều hướng previous`, async () => {
      await wbPage.hoverCarouselThumbnail();
      await wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavPrev).click();

      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `SB_WEB_BUILDER_PRD_60-click-prev-${process.env.ENV}.png`,
      });
    });

    await test.step(`Click vào thanh điều hướng next`, async () => {
      await wbPage.hoverCarouselThumbnail();
      await expect(wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavNext)).toBeVisible();
      await expect(wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavPrev)).toBeVisible();
      await wbPage.waitAbit(2 * 1000);

      await wbPage.hoverCarouselThumbnail();
      await wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavNext).click();

      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `SB_WEB_BUILDER_PRD_60-click-next-${process.env.ENV}.png`,
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_61 Verify Edit Content của layout Carousel`, async ({ page, conf, snapshotFixture }) => {
    sfPage = new BlockGallerySf(page, conf.suiteConf.domain);
    const caseCode = "SB_WEB_BUILDER_PRD_61";

    const previewProduct = {
      name: "Product w 3 image",
      handle: "product-w-3-image",
    };

    const snapshotNames = {
      wb: {
        ratioSquare: "wb-square",
        ratioPortrait: "wb-portrait",
        ratioLandscape: "wb-landscape",
        onlyVariantPhoto: "wb-only-variant",
        onlyVariantPhoto2: "wb-only-variant-2",
        allPhotoS: "wb-all-s",
        allPhotoL: "wb-all-l",
      },
      sf: {
        ratioSquare: "sf-square",
        ratioPortrait: "sf-portrait",
        ratioLandscape: "sf-landscape",
        onlyVariantPhotoS: "sf-only-variant-s",
        onlyVariantPhotoM: "sf-only-variant-m",
        onlyVariantPhotoL: "sf-only-variant-l",

        allPhotoS: "sf-all-s",
        allPhotoL: "sf-all-l",

        previewDefault: "sf-preview-default",
        previewSwipeFirst: "sf-preview-swipe-first",
        previewSwipeSecond: "sf-preview-swipe-second",
        previewSwipeBack: "sf-preview-swipe-back",
      },
    };

    await test.step(`Tại tab Content. Check trạng thái default tab Content`, async () => {
      // fill your code here
    });

    await test.step(`Khi connect được đến với data source. Check hiển thị data source của product`, async () => {
      // fill your code here
    });

    await test.step(`Khi không connect được với data source. Click connect`, async () => {
      // fill your code here
    });

    await test.step(`Click chọn Media ratio. Hover vào từng loại ratio`, async () => {
      await wbPage.selectProductPreviewByName(previewProduct.name);
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

    await test.step(`Chọn ratio square 1:1`, async () => {
      await wbPage.setProductGalleryContent({
        mediaRatio: "square",
      });
      await wbPage.clickSaveButton();

      // Verify wb
      await wbPage.clickBackLayer();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.wb.ratioSquare}-${process.env.ENV}.png`,
      });

      // Verify sf

      await sfPage.openProductPage(previewProduct.handle);
      // await waitForImageLoaded(sfPage.page, sfPage.xpathProductGalleryContainer);
      await sfPage.waitResponseWithUrl("/assets/theme.css");

      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.sf.ratioSquare}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Chọn ratio portrait 3:4`, async () => {
      await wbPage.selectBlockProductGalleryOnLayer();
      await wbPage.setProductGalleryContent({
        mediaRatio: "portrait",
      });
      await wbPage.clickSaveButton();
      await wbPage.clickBackLayer();

      // Verify wb
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.wb.ratioPortrait}-${process.env.ENV}.png`,
      });

      // Verify sf
      sfPage = new BlockGallerySf(page, conf.suiteConf.domain);
      await sfPage.openProductPage(previewProduct.handle);
      // await waitForImageLoaded(sfPage.page, sfPage.xpathProductGalleryContainer);
      await sfPage.waitResponseWithUrl("/assets/theme.css");

      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.sf.ratioPortrait}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Chọn ratio Landscape 16:9`, async () => {
      await wbPage.selectBlockProductGalleryOnLayer();
      await wbPage.setProductGalleryContent({
        mediaRatio: "landscape",
      });
      await wbPage.clickSaveButton();
      await wbPage.clickBackLayer();

      // Verify wb
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.wb.ratioLandscape}-${process.env.ENV}.png`,
      });

      // Verify sf
      sfPage = new BlockGallerySf(page, conf.suiteConf.domain);
      await sfPage.openProductPage(previewProduct.handle);
      // await waitForImageLoaded(sfPage.page, sfPage.xpathProductGalleryContainer);
      await sfPage.waitResponseWithUrl("/assets/theme.css");

      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.sf.ratioLandscape}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Tại tab photo list. Check trạng thái default`, async () => {
      // Check default select all photos
      await wbPage.selectBlockProductGalleryOnLayer();
      await wbPage.switchToTab("Content");

      const photoListText = await wbPage.genLoc("//div[@data-widget-id='photo_list']//button").first().textContent();
      expect(photoListText).toContain("All photos");

      // Droplist co 2 option
      await wbPage.clickPhotoList();
      const photoListOptions = await wbPage.getPhotoListOptions();
      expect(JSON.stringify(photoListOptions)).toEqual(JSON.stringify(wbPage.photoListOptions));
    });

    await test.step(`Chọn variant bất kì rồi chọn Only show variant photos`, async () => {
      await wbPage.selectProductGalleryOnSidebar();
      await wbPage.setProductGalleryContent({
        photoList: "Only show variant photos",
      });

      await wbPage.clickSaveButton();

      // WB
      // Select variant S ~> 1 photo
      await wbPage.selectVariant("S");
      let numberOfProductImage = await wbPage.getNumberOfProductGalleryImage("Carousel");
      expect(numberOfProductImage).toEqual(1);

      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.wb.onlyVariantPhoto}-${process.env.ENV}.png`,
      });

      // Select variant L ~> 3 photo
      await wbPage.selectVariant("L");
      numberOfProductImage = await wbPage.getNumberOfProductGalleryImage("Carousel");
      expect(numberOfProductImage).toEqual(3);

      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.wb.onlyVariantPhoto2}-${process.env.ENV}.png`,
      });

      // SF
      await sfPage.openProductPage(previewProduct.handle);
      // Select variant S ~> 1 product
      await sfPage.selectVariant("S");
      await sfPage.waitForVariantImageChanged();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.sf.onlyVariantPhotoS}-${process.env.ENV}.png`,
      });

      // Select variant M ~> 1 product
      await sfPage.selectVariant("M");
      await sfPage.waitForVariantImageChanged();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.sf.onlyVariantPhotoM}-${process.env.ENV}.png`,
      });

      // Select variant L ~> 3 product
      await sfPage.selectVariant("L");
      await sfPage.waitForVariantImageChanged();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.sf.onlyVariantPhotoL}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Click vào ảnh để đi đến màn preview tất cả media. Tại preview, Swipe chuyển giữa các media tại preview `, async () => {
      await sfPage.openProductPage(previewProduct.handle);

      // Select variant L ~> show all images
      await sfPage.selectVariant("L");
      await waitForImageLoaded(sfPage.page, `(${sfPage.xpathCarouselItem})[1]`);
      // Click on image

      await sfPage.genLoc(sfPage.xpathCarouselItem).first().click();
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathCarousel.preview.main.container,
        snapshotName: `${caseCode}-${snapshotNames.sf.previewDefault}-${process.env.ENV}.png`,
      });

      // Swipe phai (hover main img + click next)
      await sfPage.hoverCarouselPreviewImage();
      await sfPage.genLoc(sfPage.xpathCarousel.preview.main.nextButton).click();
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathCarousel.preview.main.container,
        snapshotName: `${caseCode}-${snapshotNames.sf.previewSwipeFirst}-${process.env.ENV}.png`,
      });

      // Swipe phai
      await sfPage.hoverCarouselPreviewImage();
      await sfPage.genLoc(sfPage.xpathCarousel.preview.main.nextButton).click();
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathCarousel.preview.main.container,
        snapshotName: `${caseCode}-${snapshotNames.sf.previewSwipeSecond}-${process.env.ENV}.png`,
      });

      // Swipe trai
      await sfPage.hoverCarouselPreviewImage();
      await sfPage.genLoc(sfPage.xpathCarousel.preview.main.prevButton).click();
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathCarousel.preview.main.container,
        snapshotName: `${caseCode}-${snapshotNames.sf.previewSwipeBack}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Click vào media video`, async () => {
      // This step is manual
    });

    await test.step(`Tại menu photo list, Chọn hiển thị all photo`, async () => {
      await wbPage.selectProductGalleryOnSidebar();
      await wbPage.setProductGalleryContent({
        photoList: "All photos",
      });

      await wbPage.clickSaveButton();

      // WB
      // Select variant S ~> 1 photo
      await wbPage.selectVariant("S");
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.wb.allPhotoS}-${process.env.ENV}.png`,
      });

      // Select variant L ~> 3 photo
      await wbPage.selectVariant("L");
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.wb.allPhotoL}-${process.env.ENV}.png`,
      });

      // SF
      await sfPage.openProductPage(previewProduct.handle);
      // Select variant S ~> 1 product
      await sfPage.selectVariant("S");
      await sfPage.waitForVariantImageChanged();
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.sf.allPhotoS}-${process.env.ENV}.png`,
      });

      // Select variant L ~> 3 product
      await sfPage.selectVariant("L");
      await sfPage.waitForVariantImageChanged();
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${caseCode}-${snapshotNames.sf.allPhotoL}-${process.env.ENV}.png`,
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_66 Verify Edit Design layout Carousel block Gallery`, async ({ conf, snapshotFixture }) => {
    await test.step(`Pre condition: select source for block gallery`, async () => {
      await wbPage.page.locator('header [name="Layer"]').click();
      await wbPage.setVariableForSection({
        sectionName: "Product detail",
        sourceType: "Product",
        sourceData: conf.caseConf.standard_product,
        sectionIndex: 1,
      });
    });

    await test.step(`Click menu Item radius. Kéo process bar + fill input`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      await wbPage.page.locator(wbPage.xpathRadius).first().waitFor({ state: "visible" });
      await wbPage.page.locator(wbPage.xpathRadius).fill(`${conf.caseConf.expect.space_10}`);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });
      await wbPage.clickBackLayer();

      await wbPage.waitAbit(2000);
      await snapshotFixture.verifyWithIframe({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathProductGallery,
        snapshotName: `${process.env.ENV}-${conf.caseConf.case_id}-block-product-gallery-carousel-border-radius-10.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });

    await test.step(`Edit common setting tại block Gallery`, async () => {
      let index = 1;
      const listStyle = conf.caseConf.expect.styles;
      for (const style of listStyle) {
        await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
        await wbPage.switchToTab("Design");
        await wbPage.changeDesign(style);
        await wbPage.clickBackLayer();
        await wbPage.waitAbit(2000);
        await snapshotFixture.verifyWithIframe({
          page: wbPage.page,
          iframe: wbPage.iframe,
          selector: wbPage.xpathProductGallery,
          snapshotName: `${process.env.ENV}-${conf.caseConf.case_id}-block-product-gallery-carousel-change-style-${index}.png`,
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

  test(`@SB_WEB_BUILDER_PRD_65 Verify Edit Design layout Carousel block Gallery navigation type: None`, async ({
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Pre condition: select source for block gallery`, async () => {
      await wbPage.page.locator('header [name="Layer"]').click();
      await wbPage.setVariableForSection({
        sectionName: "Product detail",
        sourceType: "Product",
        sourceData: conf.caseConf.standard_product,
        sectionIndex: 1,
      });
    });

    await test.step(`Click menu Layout, tại layout Carousel và chọn nav type là none`, async () => {
      await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.none);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });
      await wbPage.frameLocator
        .locator(`//div[contains(@class, 'thumbnail-carousel ')]`)
        .first()
        .waitFor({ state: "detached" });
      await wbPage.clickBackLayer();
      await wbPage.waitAbit(5000);
      await snapshotFixture.verifyWithIframe({
        page: wbPage.page,
        selector: wbPage.xpathProductGallery,
        snapshotName: `${process.env.ENV}-${conf.caseConf.case_id}-block-product-gallery-carousel-nav-type-none.png`,
        iframe: wbPage.iframe,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_63 Verify Edit Design layout Carousel block Gallery navigation type: Thumbnail`, async ({
    conf,
    snapshotFixture,
    pageMobile,
    page,
  }) => {
    const sfnMobilePage = new SfnBlockGalleryMobilePage(pageMobile, conf.suiteConf.domain);
    sfPage = new BlockGallerySf(page, conf.suiteConf.domain);

    await test.step(`Pre condition: select source for block gallery`, async () => {
      await wbPage.switchMobileBtn.click();
      await wbPage.page.locator(wbPage.xpathLayerButton).click();
      await wbPage.setVariableForSection({
        sectionName: "Product detail",
        sourceType: "Product",
        sourceData: conf.caseConf.standard_product,
        sectionIndex: 1,
      });
      await wbPage.clickSave();
      await wbPage.reload();
    });

    await test.step(
      "1. Chọn nav postion botton, save setting\n" +
        "2. Chọn lần lượt danh sách product\n" +
        "3. Preview lần lượt danh sách product ngoài storefront trên mobile, swipe phải, swipe trái\n" +
        "4. Click vào ảnh",
      async () => {
        //1. Chọn nav type = thumbnail, save setting
        await wbPage.switchMobileBtn.click();
        await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.thumbnail, true);
        await wbPage.clickSave();
        for (const product of conf.caseConf.product_data) {
          //2. Chọn lần lượt danh sách product
          await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
          await wbPage.switchToTab("Content");
          await wbPage.page.locator(wbPage.selectorDataSourceButton).click();
          await wbPage.changeDataSourceInSection(product.name);
          await wbPage.clickSave();
          //3. Preview lần lượt danh sách product ngoài storefront trên mobile, swipe phải, swipe trái
          await sfnMobilePage.gotoProduct(product.handle);
          await expect(sfnMobilePage.page.locator(sfPage.xpathThumbnailCarouselActiveOnSF)).toBeVisible();

          if (product.name !== "Product w 1 image") {
            await sfnMobilePage.page.locator(`${sfPage.xpathThumbnailCarouselOnSFMobile} >> nth = 1`).click();
            await expect(
              sfnMobilePage.page.locator(
                `${sfPage.xpathThumbnailCarouselOnSFMobile}${wbPage.xpathCarouselThumb} >> nth = 1`,
              ),
            ).toHaveAttribute("class", /media-card-thumbnail-active/);
            await sfnMobilePage.page.locator(sfPage.xpathThumbnailCarouselOnSFMobile).first().click();
            await expect(
              sfnMobilePage.page
                .locator(`${sfPage.xpathThumbnailCarouselOnSFMobile}${wbPage.xpathCarouselThumb}`)
                .first(),
            ).toHaveAttribute("class", /media-card-thumbnail-active/);
            //4. Click vào ảnh
            await sfnMobilePage.page.locator(sfPage.selectorMediaImage).first().click();
            await expect(sfnMobilePage.page.locator(sfPage.xpathPreviewImageCarouselMobile)).toBeVisible();
          }
        }
      },
    );

    await test.step(`Click menu Layout, tại layout Carousel => Check setting mặc định`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.switchToTab("Design");
      await wbPage.clickBackLayer();
      await wbPage.waitAbit(2000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-WB-mobile-layout-carousel.png`,
      });
    });

    await test.step(`Swicth sang desktop, Chọn sản phẩm 15 media`, async () => {
      await wbPage.switchDesktopBtn.click();
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.clickBackLayer();
      await wbPage.waitAbit(2000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-WB-desktop-layout-carousel.png`,
      });
    });

    await test.step(`Kiểm tra hiển thị navigation bar ở WB`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      //1. Mặc định chưa hover vào ảnh
      await wbPage.page.locator(wbPage.xpathHeaderBar).hover();

      await expect(wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavNext)).toBeHidden();
      await expect(wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavPrev)).toBeHidden();
      //2. Hover vào giữa ảnh
      await wbPage.hoverCarouselThumbnail();

      await expect(wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavNext)).toBeVisible();
      await expect(wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavPrev)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-WB-hover-center-layout-carousel.png`,
      });
      //3. Hover vào 20% mép trái hoặc mép phải của image
      await wbPage.hoverCarouselThumbnailOnSide();

      await expect(wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavNext)).toBeVisible();
      await expect(wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavPrev)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-WB-left-center-layout-carousel.png`,
      });
    });

    await test.step(`Click vào thanh điều hướng next`, async () => {
      await wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavNext).click();
      await wbPage.hoverCarouselThumbnail();

      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-WB-click-next-button.png`,
      });
    });

    await test.step(`Mở trang product ngoài SF`, async () => {
      await sfPage.openProductPage(conf.caseConf.product_data[3].handle);

      //1. Mặc định chưa hover vào ảnh
      await expect(sfPage.page.locator(wbPage.xpathCarouselThumbnailNavNext)).toBeHidden();
      await expect(sfPage.page.locator(wbPage.xpathCarouselThumbnailNavPrev)).toBeHidden();
      //2. Hover vào giữa ảnh
      await sfPage.hoverCarouselThumbnail();

      await expect(sfPage.page.locator(wbPage.xpathCarouselThumbnailNavNext)).toBeVisible();
      await expect(sfPage.page.locator(wbPage.xpathCarouselThumbnailNavPrev)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-SF-hover-center-layout-carousel.png`,
      });
      //3. Hover vào 20% mép trái hoặc mép phải của image
      await sfPage.page.locator(sfPage.xpathHoverAreaRight).hover();

      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: wbPage.xpathMediaGalleryContainer,
        snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-SF-left-center-layout-carousel.png`,
      });

      await expect(sfPage.page.locator(wbPage.xpathCarouselThumbnailNavNext)).toBeVisible();
      await expect(sfPage.page.locator(wbPage.xpathCarouselThumbnailNavPrev)).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_LB_BPG_06 Check hiển thị block gallery khi set nav position trường hợp layout = Carousel`, async ({
    conf,
    snapshotFixture,
    page,
  }) => {
    sfPage = new BlockGallerySf(page, conf.suiteConf.domain);
    await test.step(
      "1. Tại WB, setting nav postion về bottom, save setting\n" +
        "2. Tại WB, chọn lần lượt các sản phẩm, click lần lượt các thumbnail\n" +
        "3. Tại SF, mở lần lượt các sản phẩm, click lần lượt các thumbnail",
      async () => {
        //1. Tại WB, setting nav postion về bottom, save setting
        await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.thumbnail, false, "Bottom");
        await wbPage.clickSave();

        for (const product of conf.caseConf.product_data) {
          //2. Tại WB, chọn lần lượt các sản phẩm, click lần lượt các thumbnail
          await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
          await wbPage.switchToTab("Content");
          await wbPage.page.locator(wbPage.selectorDataSourceButton).click();
          await wbPage.changeDataSourceInSection(product.name);
          await wbPage.clickSave();

          await expect(wbPage.frameLocator.locator(wbPage.xpathThumbCarousel)).toBeVisible();
          //3. Tại SF, mở lần lượt các sản phẩm, click lần lượt các thumbnail
          await sfPage.openProductPage(product.handle);
          await wbPage.waitAbit(2000);
          await snapshotFixture.verifyWithAutoRetry({
            page: sfPage.page,
            selector: wbPage.xpathMediaGalleryContainer,
            snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-SF-bottom-nav-${product.handle}.png`,
          });
        }
      },
    );

    await test.step(
      "1. Tại WB, setting nav postion về left, save setting\n" +
        "2. Tại WB, chọn lần lượt các sản phẩm, click lần lượt các thumbnail\n" +
        "3. Tại SF, mở lần lượt các sản phẩm, click lần lượt các thumbnail",
      async () => {
        //1. Tại WB, setting nav postion về left, save setting
        await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.thumbnail, false, "Left");
        await wbPage.clickSave();

        for (const product of conf.caseConf.product_data) {
          //2. Tại WB, chọn lần lượt các sản phẩm, click lần lượt các thumbnail
          await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
          await wbPage.switchToTab("Content");
          await wbPage.page.locator(wbPage.selectorDataSourceButton).click();
          await wbPage.changeDataSourceInSection(product.name);
          await wbPage.clickSave();

          await expect(wbPage.frameLocator.locator(wbPage.xpathThumbLeft)).toBeVisible();
          //3. Tại SF, mở lần lượt các sản phẩm, click lần lượt các thumbnail
          await sfPage.openProductPage(product.handle);
          await wbPage.waitAbit(2000);
          await snapshotFixture.verifyWithAutoRetry({
            page: sfPage.page,
            selector: wbPage.xpathMediaGalleryContainer,
            snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-SF-left-nav-${product.handle}.png`,
          });
        }
      },
    );

    await test.step(
      "1. Tại WB, setting nav postion về right, save setting\n" +
        "2. Tại WB, chọn lần lượt các sản phẩm, click lần lượt các thumbnail\n" +
        "3. Tại SF, mở lần lượt các sản phẩm, click lần lượt các thumbnail",
      async () => {
        //1. Tại WB, setting nav postion về right, save setting
        await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.thumbnail, false, "Right");
        await wbPage.clickSave();

        for (const product of conf.caseConf.product_data) {
          //2. Tại WB, chọn lần lượt các sản phẩm, click lần lượt các thumbnail
          await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
          await wbPage.switchToTab("Content");
          await wbPage.page.locator(wbPage.selectorDataSourceButton).click();
          await wbPage.changeDataSourceInSection(product.name);
          await wbPage.clickSave();

          await expect(wbPage.frameLocator.locator(wbPage.xpathThumbRight)).toBeVisible();
          //3. Tại SF, mở lần lượt các sản phẩm, click lần lượt các thumbnail
          await sfPage.openProductPage(product.handle);
          await wbPage.waitAbit(2000);
          await snapshotFixture.verifyWithAutoRetry({
            page: sfPage.page,
            selector: wbPage.xpathMediaGalleryContainer,
            snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-SF-right-nav-${product.handle}.png`,
          });
        }
      },
    );
  });

  test(`@SB_WEB_BUILDER_PRD_64 Verify Edit Design layout Carousel block Gallery navigation type: Dots`, async ({
    conf,
  }) => {
    await test.step(`Pre condition: select source for block gallery`, async () => {
      await wbPage.page.locator('header [name="Layer"]').click();
      await wbPage.setVariableForSection({
        sectionName: "Product detail",
        sourceType: "Product",
        sourceData: conf.caseConf.product_6_image_name,
        sectionIndex: 1,
      });
      await wbPage.clickSave();
      await wbPage.reload();
      await wbPage.page.waitForLoadState("networkidle");
    });

    await test.step(`Click menu Layout, tại layout Carousel chọn nav type là Dots`, async () => {
      await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.dots);
      await expect(wbPage.frameLocator.locator(wbPage.navTypeDotInPreview)).toBeVisible();
    });

    await test.step(`Delete 1 media của product vừa thêm => Save. Click menu Layout, tại layout Carousel chọn nav type là dots => Check giao diện nav position dot khi số lượng dot = 5`, async () => {
      await wbPage.switchToTab("Content");
      await wbPage.page.locator(wbPage.selectorDataSourceButton).click();
      await wbPage.changeDataSourceInSection(conf.caseConf.product_5_image_name);

      await wbPage.hoverCarouselThumbnail();
      // Click next
      await wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavNext).click();
      // Click prev
      await wbPage.frameLocator.locator(wbPage.xpathCarouselThumbnailNavPrev).click();

      const dot = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class,'slider-item')]/descendant::div[contains(@class, 'VueCarousel-pagination')]/descendant::div[contains(@class, 'VueCarousel-dot-container')]/button`;
      const countDot = await wbPage.frameLocator.locator(dot).count();
      expect(countDot === 5).toBeTruthy();
    });

    await test.step(`Click vào thanh điều hướng Next`, async () => {
      // Click next
      await wbPage.hoverCarouselThumbnail();
      await wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavNext).click();

      const secondDotActive = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class,'slider-item')]/descendant::div[contains(@class, 'VueCarousel-pagination')]/descendant::div[contains(@class, 'VueCarousel-dot-container')]/button[2][contains(@class, '-dot--active')]`;
      await wbPage.frameLocator.locator(secondDotActive).first().waitFor({ state: "visible" });
      await expect(wbPage.frameLocator.locator(secondDotActive)).toBeVisible();
    });

    await test.step(`Click vào thanh điều hướng previous`, async () => {
      await wbPage.hoverCarouselThumbnail();
      // click prev
      await wbPage.frameLocator.locator(wbPage.xpathCarouselThumbnailNavPrev).click();

      const firstDotActive = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class,'slider-item')]/descendant::div[contains(@class, 'VueCarousel-pagination')]/descendant::div[contains(@class, 'VueCarousel-dot-container')]/button[1][contains(@class, '-dot--active')]`;
      await wbPage.frameLocator.locator(firstDotActive).first().waitFor({ state: "visible" });
      await expect(wbPage.frameLocator.locator(firstDotActive)).toBeVisible();
    });

    await test.step(`Delete 1 media của product vừa thêm => Save. Click menu Layout, tại layout Carousel chọn nav type là dot => Check giao diện nav position dot khi số lượng dot nhỏ hơn 5`, async () => {
      await wbPage.switchToTab("Content");
      await wbPage.page.locator(wbPage.selectorDataSourceButton).click();
      await wbPage.changeDataSourceInSection(conf.caseConf.product_4_image_name);
      // Click next
      await wbPage.hoverCarouselThumbnail();
      await wbPage.genLocFrame(wbPage.xpathCarouselThumbnailNavNext).click();
      // Click prev
      await wbPage.hoverCarouselThumbnail();
      await wbPage.frameLocator.locator(wbPage.xpathCarouselThumbnailNavPrev).click();

      const dot = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class,'slider-item')]/descendant::div[contains(@class, 'VueCarousel-pagination')]/descendant::div[contains(@class, 'VueCarousel-dot-container')]/button`;
      const countDot = await wbPage.frameLocator.locator(dot).count();
      expect(countDot === 4).toBeTruthy();
    });

    await test.step(`Click vào thanh điều hướng Next`, async () => {
      await wbPage.hoverCarouselThumbnail();
      await wbPage.frameLocator.locator(wbPage.xpathCarouselThumbnailNavNext).first().waitFor({ state: "visible" });
      await wbPage.frameLocator.locator(wbPage.xpathCarouselThumbnailNavNext).click();

      const secondDotActive = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class,'slider-item')]/descendant::div[contains(@class, 'VueCarousel-pagination')]/descendant::div[contains(@class, 'VueCarousel-dot-container')]/button[2][contains(@class, '-dot--active')]`;
      await wbPage.frameLocator.locator(secondDotActive).first().waitFor({ state: "visible" });
      await expect(wbPage.frameLocator.locator(secondDotActive)).toBeVisible();
    });

    await test.step(`Click vào thanh điều hướng previous`, async () => {
      // click prev
      await wbPage.hoverCarouselThumbnail();
      await wbPage.frameLocator.locator(wbPage.xpathCarouselThumbnailNavPrev).click();

      const firstDotActive = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class,'slider-item')]/descendant::div[contains(@class, 'VueCarousel-pagination')]/descendant::div[contains(@class, 'VueCarousel-dot-container')]/button[1][contains(@class, '-dot--active')]`;
      await wbPage.frameLocator.locator(firstDotActive).first().waitFor({ state: "visible" });
      await expect(wbPage.frameLocator.locator(firstDotActive)).toBeVisible();
    });

    await test.step(`Click Next đến items cuối cùng (item thứ 4) -> Click Next tiếp`, async () => {
      await wbPage.hoverCarouselThumbnail();

      await wbPage.frameLocator.locator(wbPage.xpathCarouselThumbnailNavNext).first().waitFor({ state: "visible" });
      const click4times = 4;
      for (let i = 0; i < click4times; i++) {
        await wbPage.frameLocator.locator(wbPage.xpathCarouselThumbnailNavNext).click();
      }

      const firstDotActive = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class,'slider-item')]/descendant::div[contains(@class, 'VueCarousel-pagination')]/descendant::div[contains(@class, 'VueCarousel-dot-container')]/button[1][contains(@class, '-dot--active')]`;
      await wbPage.frameLocator.locator(firstDotActive).first().waitFor({ state: "visible" });
      await expect(wbPage.frameLocator.locator(firstDotActive)).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_67 Verify resize product Media layout Carousel block Gallery`, async ({
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Pre condition: select source for block gallery`, async () => {
      await wbPage.page.locator('header [name="Layer"]').click();
      await wbPage.setVariableForSection({
        sectionName: "Product detail",
        sourceType: "Product",
        sourceData: conf.caseConf.product_6_image_name,
        sectionIndex: 1,
      });
    });

    await test.step(`Resize width của block media > min width = 320 px`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize1);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      const xpathProductGalleryReact = await wbPage.frameLocator.locator(wbPage.xpathProductGallery).boundingBox();
      expect(xpathProductGalleryReact.width === 400);
    });

    await test.step(`Resize width của block media < min width = 320 px`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize2);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      const xpathProductGalleryReact = await wbPage.frameLocator.locator(wbPage.xpathProductGallery).boundingBox();
      expect(xpathProductGalleryReact.width === 200);
    });

    await test.step(`Edit layout của block với Nav Type là Dots`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize3);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      await wbPage.switchToTab("Design");
      await wbPage.page.locator(wbPage.xpathSidebarLayout).last().click();

      const navTypeThumbnailXpath = `//div[contains(@class, 'w-builder__widget--layout')]/descendant::span[contains(text(), 'Thumbnail')]`;
      await wbPage.page.locator(navTypeThumbnailXpath).click();
      const navTypeDots = `//div[contains(@class, 'widget-select__search')]/descendant::li[descendant::label[contains(text(),'Dots')]]`;

      await wbPage.page.waitForSelector(navTypeDots);
      await wbPage.page.locator(navTypeDots).click();

      const xpathDots = `${wbPage.xpathProductGallery}/descendant::div[contains(@class,'slider-item')]/descendant::div[contains(@class, 'VueCarousel-pagination')]/descendant::div[contains(@class, 'VueCarousel-dot-container')]`;
      await wbPage.frameLocator.locator(xpathDots).first().waitFor({ state: "visible" });

      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      await expect(wbPage.frameLocator.locator(xpathDots)).toBeVisible();
    });

    await test.step(`Resize height của block media`, async () => {
      const resizeTopBtn = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class, 'resizer top')]`;
      const resizeBottomBtn = `//div[contains(@class, 'wb-dnd-draggable-wrapper block-drag') and @data-block-component='media']/descendant::div[contains(@class, 'resizer bottom')]`;

      await expect(wbPage.frameLocator.locator(resizeTopBtn)).toBeHidden();
      await expect(wbPage.frameLocator.locator(resizeBottomBtn)).toBeHidden();
    });

    await test.step(`Resize width của block media < min width = 320 px -> resize width = 200 -> clip image`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize2);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      const xpathProductGalleryReact = await wbPage.frameLocator.locator(wbPage.xpathProductGallery).boundingBox();
      expect(xpathProductGalleryReact.width === 200);
    });

    await test.step(`Edit layout của block với Nav Type là Dots`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize3);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      await wbPage.switchToTab("Design");
      await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.dots);
      await expect(wbPage.frameLocator.locator(wbPage.navTypeDotInPreview)).toBeVisible();
    });

    await test.step(`Resize height của block media`, async () => {
      await expect(wbPage.frameLocator.locator(wbPage.resizeTopBtn)).toBeHidden();
      await expect(wbPage.frameLocator.locator(wbPage.resizeBottomBtn)).toBeHidden();
    });

    await test.step(`Resize width của block media < min width = 320 px -> resize width = 200 -> clip image`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize2);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      const xpathProductGalleryReact = await wbPage.frameLocator.locator(wbPage.xpathProductGallery).boundingBox();
      expect(xpathProductGalleryReact.width === 200);
    });

    await test.step(`Edit layout của block với Nav Type là Dots`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize3);
      await wbPage.switchToTab("Design");
      await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.dots);
      await expect(wbPage.frameLocator.locator(wbPage.navTypeDotInPreview)).toBeVisible();
    });

    await test.step(`Resize height của block media`, async () => {
      await expect(wbPage.frameLocator.locator(wbPage.resizeTopBtn)).toBeHidden();
      await expect(wbPage.frameLocator.locator(wbPage.resizeBottomBtn)).toBeHidden();
    });

    await test.step(`Resize width của block media < min width = 320 px -> resize width = 200 -> clip image`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize2);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });
      await wbPage.waitAbit(5000);
      await snapshotFixture.verifyWithIframe({
        page: wbPage.page,
        selector: wbPage.xpathProductGallery,
        snapshotName: `${process.env.ENV}-${conf.caseConf.case_id}-block-product-gallery-carousel-image-clip.png`,
        iframe: wbPage.iframe,
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
          x: blockGalleryReact.x + 9999,
        },
      });
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });
      const xpathProductGalleryReact = await wbPage.frameLocator.locator(wbPage.xpathProductGallery).boundingBox();
      expect(xpathProductGalleryReact.width === 20);
    });

    await test.step(`Resize width của block media > min width = 320 px`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize5);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      const xpathProductGalleryReact = await wbPage.frameLocator.locator(wbPage.xpathProductGallery).boundingBox();
      expect(xpathProductGalleryReact.width === 500);
    });

    await test.step(`Resize width của block media = min width = 320 px`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize6);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      const xpathProductGalleryReact = await wbPage.frameLocator.locator(wbPage.xpathProductGallery).boundingBox();
      expect(xpathProductGalleryReact.width === 320);
    });

    await test.step(`Edit layout của block với type là  None`, async () => {
      await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.none);

      const xpathDots = `${wbPage.xpathProductGallery}/descendant::div[contains(@class,'slider-item')]/descendant::div[contains(@class, 'VueCarousel-pagination')]/descendant::div[contains(@class, 'VueCarousel-dot-container')]`;
      await wbPage.frameLocator.locator(xpathDots).first().waitFor({ state: "detached" });
    });

    await test.step(`Resize width của block media = min width = 320 px`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize6);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      const xpathProductGalleryReact = await wbPage.frameLocator.locator(wbPage.xpathProductGallery).boundingBox();
      expect(xpathProductGalleryReact.width === 320);
    });

    await test.step(`Resize width của block media < min width = 320 px -> width = 200`, async () => {
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).click();
      await wbPage.changeDesign(conf.caseConf.expect.resize6);
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });

      const xpathProductGalleryReact = await wbPage.frameLocator.locator(wbPage.xpathProductGallery).boundingBox();
      expect(xpathProductGalleryReact.width === 200);
    });

    await test.step(`Resize width của block media < 40 px`, async () => {
      const blockGallery = wbPage.frameLocator.locator(wbPage.xpathProductGallery);
      const blockGalleryReact = await blockGallery.boundingBox();
      await wbPage.resizeBlock(blockGallery, {
        at_position: "left",
        to_specific_point: {
          x: blockGalleryReact.x + 9999,
        },
      });
      await wbPage.frameLocator.locator(wbPage.xpathProductGallery).first().waitFor({ state: "visible" });
      const xpathProductGalleryReact = await wbPage.frameLocator.locator(wbPage.xpathProductGallery).boundingBox();
      expect(xpathProductGalleryReact.width === 20);
    });
  });

  test(`@SB_WEB_BUILDER_PRD_68 Verify product Media layout Carousel block Gallery trên mobile`, async ({
    conf,
    pageMobile,
  }) => {
    test.slow();
    await test.step(`Pre condition: add block product gallery to product page`, async () => {
      await wbPage.switchMobileBtn.click();
      //select source for section
      await wbPage.page.locator('header [name="Layer"]').click();
      await wbPage.setVariableForSection({
        sectionName: "Product detail",
        sourceType: "Product",
        sourceData: conf.caseConf.product_has_video,
        sectionIndex: 1,
      });
    });

    await test.step(`Save setting tại web builder. Đi đến webfront của product -> Click vào media video`, async () => {
      await wbPage.clickSave();

      const sfnMobilePage = new SfnBlockGalleryMobilePage(pageMobile, conf.suiteConf.domain);
      await sfnMobilePage.gotoProduct(conf.caseConf.product_has_video_seo);
      await sfnMobilePage.page.waitForLoadState("networkidle");
      await sfnMobilePage.page.waitForLoadState("domcontentloaded");
      await sfnMobilePage.page.waitForSelector(wbPage.sfnProductGalleryMobile);
      await sfnMobilePage.page.locator(wbPage.sfnProductGalleryMobile).click();
      const firstImgInModal = `//div[contains(@class, 'outside-modal fixed popover-bottom__overlay w-100 h-100 flex justify-center preview-media')]/descendant::div[contains(@class, 'VueCarousel-inner')]/descendant::div[contains(@class, 'slider-item')][1]/descendant::img`;
      await sfnMobilePage.page.waitForSelector(firstImgInModal);
      await expect(sfnMobilePage.page.locator(firstImgInModal)).toBeVisible();
    });

    await test.step(`Edit layout của block Carousel thành nav type: Dots => Save`, async () => {
      // wb
      await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.dots, true);
      await wbPage.clickSave();
      // sfn mobile
      const sfnMobilePage = new SfnBlockGalleryMobilePage(pageMobile, conf.suiteConf.domain);
      await sfnMobilePage.gotoProduct(conf.caseConf.product_has_video_seo);

      await expect(sfnMobilePage.page.locator(wbPage.sfnMobileDotsInGallery)).toBeVisible();
    });

    await test.step(`Edit layout của block Carousel thành nav type: None => Save`, async () => {
      // wb
      await wbPage.changeNavTypeCarousel(conf.suiteConf.navtype.none, true);
      await wbPage.clickSave();

      // sfn mobile
      const sfnMobilePage = new SfnBlockGalleryMobilePage(pageMobile, conf.suiteConf.domain);
      await sfnMobilePage.gotoProduct(conf.caseConf.product_has_video_seo);

      const result = sfnMobilePage.page.locator(wbPage.sfnMobileNavTypeNone);
      await expect(result).toBeVisible();
    });
  });
});
