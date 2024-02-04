import { test } from "@core/fixtures";
import { WebBuilderBlockGallery } from "@pages/dashboard/wb_block_gallery";
import { BlockGallerySf } from "@pages/new_ecom/storefront/block_gallery_sf";
import { waitForImageLoaded } from "@utils/theme";

const caseConf = {
  caseCode: "SB_WEB_BUILDER_PRD_69",
  previewProduct: {
    name: "Product w 3 image",
    handle: "product-w-3-image",
  },
  snapshot: {
    sf: {
      variantM: "variant-m",
      variantS: "variant-s",
      variantL: "variant-l",
      previewS: "preview-s",
      previewM: "preview-m",
      previewL: "preview-l",
    },
  },
};

test.describe("Verify setting block gallery", () => {
  let wbPage: WebBuilderBlockGallery;
  let sfPage: BlockGallerySf;
  test.beforeEach(async ({ dashboard, page, conf }) => {
    test.slow();
    wbPage = new WebBuilderBlockGallery(dashboard, conf.suiteConf.domain);
    sfPage = new BlockGallerySf(page, conf.suiteConf.domain);
    await test.step(`Login vào shop, vào web builder, mở trang product page, delete block product gallery nếu có, insert lại block gallery`, async () => {
      await wbPage.openWb();

      // Delete existing block product gallery
      await wbPage.deleteAllExistingBlockProductGallery();

      // Insert block product gallery
      await wbPage.insertBlockProductGalleryInProductPage();

      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Carousel",
        },
      });

      await wbPage.clickSaveButton();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_69 Verify behavior của block layout Carousel block Gallery trên webfront`, async ({
    snapshotFixture,
  }) => {
    await test.step(`Mở product ở ngoài SF, Chọn variant M ở variant picker`, async () => {
      await sfPage.openProductPage(caseConf.previewProduct.handle);

      await sfPage.selectVariant("M");
      await sfPage.waitForVariantImageChanged();

      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathMediaGalleryContainer,
        snapshotName: `${caseConf.caseCode}-${caseConf.snapshot.sf.variantM}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Chọn variant khác variant vừa chọn: S`, async () => {
      await sfPage.selectVariant("S");
      await sfPage.waitForVariantImageChanged();

      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathMediaGalleryContainer,
        snapshotName: `${caseConf.caseCode}-${caseConf.snapshot.sf.variantS}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Chọn variant chưa có ảnh: L`, async () => {
      await sfPage.selectVariant("L");
      await sfPage.waitForVariantImageChanged();

      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathMediaGalleryContainer,
        snapshotName: `${caseConf.caseCode}-${caseConf.snapshot.sf.variantL}-${process.env.ENV}.png`,
      });
    });

    await test.step(`Swipe chuyển giữa các media tại preview`, async () => {
      await sfPage.selectVariant("S");
      await sfPage.waitForVariantImageChanged();

      await waitForImageLoaded(sfPage.page, `(${sfPage.xpathCarouselItem})[1]`);
      await sfPage.genLoc(sfPage.xpathCarouselItem).first().click();
      await waitForImageLoaded(sfPage.page, sfPage.xpathCarousel.preview.main.firstImage);

      // Swipe phai ~> variant M
      await sfPage.hoverCarouselPreviewImage();
      await sfPage.genLoc(sfPage.xpathCarousel.preview.main.nextButton).click();
      await waitForImageLoaded(sfPage.page, sfPage.xpathCarousel.preview.main.secondImage);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathCarousel.preview.main.container,
        snapshotName: `${caseConf.caseCode}-${caseConf.snapshot.sf.previewM}-${process.env.ENV}.png`,
      });

      // Swipe phai ~> variant L
      await sfPage.hoverCarouselPreviewImage();
      await sfPage.genLoc(sfPage.xpathCarousel.preview.main.nextButton).click();
      await waitForImageLoaded(sfPage.page, sfPage.xpathCarousel.preview.main.thirdImage);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathCarousel.preview.main.container,
        snapshotName: `${caseConf.caseCode}-${caseConf.snapshot.sf.previewL}-${process.env.ENV}.png`,
      });

      // Swipe phair ~> variant S
      await sfPage.hoverCarouselPreviewImage();
      await sfPage.genLoc(sfPage.xpathCarousel.preview.main.nextButton).click();
      await waitForImageLoaded(sfPage.page, sfPage.xpathCarousel.preview.main.firstImage);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpathCarousel.preview.main.container,
        snapshotName: `${caseConf.caseCode}-${caseConf.snapshot.sf.previewS}-${process.env.ENV}.png`,
      });
    });
  });
});
