import { test } from "@core/fixtures";
import { WbBlockGallery2 } from "@pages/dashboard/wb_block_gallery2";
import { getSnapshotNameWithEnv, getSnapshotNameWithEnvAndCaseCode } from "@utils/env";
import { expect } from "@playwright/test";
import { SfProductGallery } from "@pages/new_ecom/storefront/block_gallery_sf2";
import { XpathNavigationButtons } from "@constants/web_builder";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();

const productNameConfig = {
  productNoImage: {
    name: "Product w no image",
    handle: "product-w-no-image",
  },
  product1Image: {
    name: "Product w 1 image",
    handle: "product-w-1-image",
  },
  product2Image: {
    name: "Product w 2 image",
    handle: "product-w-2-image",
  },
  productManyImage: {
    name: "Product w many images",
    handle: "product-w-many-images",
  },
};
const case45Conf = {
  snapshot: {
    sidebar: {
      tab_design: "SB_WEB_BUILDER_PRD_45-sidebar-design-default.png",
      tab_content: "SB_WEB_BUILDER_PRD_45-sidebar-content-default.png",
    },
    wb: {
      section: "SB_WEB_BUILDER_PRD_45-wb-section-default.png",
      preview: "SB_WEB_BUILDER_PRD_45-wb-preview.png",
      section_many_image: "SB_WEB_BUILDER_PRD_45-wb-section-many-image.png",
      section_no_image: "SB_WEB_BUILDER_PRD_45-wb-section-no-image.png",
      preview_all: "SB_WEB_BUILDER_PRD_45-wb-preview-all.png",
    },
  },
};

const case46Conf = {
  snapshot: {
    wb: {
      portrait: "SB_WEB_BUILDER_PRD_46-wb-portrait.png",
      landscape: "SB_WEB_BUILDER_PRD_46-wb-landscape.png",
    },
    sf: {
      portrait: "SB_WEB_BUILDER_PRD_46-sf-portrait.png",
      landscape: "SB_WEB_BUILDER_PRD_46-sf-landscape.png",
    },
  },
};

const case48Conf = {
  case_code: "SB_WEB_BUILDER_PRD_48",
  snapshot: {
    wb: {
      sidebar_layout: "wb-sidebar-layout.png",
      item_per_row_1: "wb-item-per-row-1.png",
      item_per_row_2: "wb-item-per-row-2.png",
      spacing_0: "wb-spacing-0.png",
      spacing_80: "wb-spacing-80.png",
      radius_10: "wb-radius-10.png",
      common_setting_1: "wb-common_1.png",
      common_setting_2: "wb-common_2.png",
      item_per_row_1_1: "wb-item-per-row-1-1.png",
      item_per_row_1_2: "wb-item-per-row-1-2.png",
    },
  },
};

const case51Conf = {
  case_code: "SB_WEB_BUILDER_PRD_51",
  snapshot: {
    wb: {
      s_red_variant: "wb-s-red.png",
      s_green_variant: "wb-s-green.png",
    },
    sf: {},
  },
};

const case53Conf = {
  case_code: "SB_WEB_BUILDER_PRD_53",
  snapshot: {
    sf: {
      preview: "preview.png",
    },
  },
};

test.describe("Verify setting button của block gallery @SB_BLOCK_PRODUCT_GALLERY", () => {
  let wbPage: WbBlockGallery2;
  let sfPage: SfProductGallery;

  test.beforeEach(async ({ dashboard, conf, page }) => {
    test.slow();
    wbPage = new WbBlockGallery2(dashboard, conf.suiteConf.domain);
    sfPage = new SfProductGallery(page, conf.suiteConf.domain);
    await test.step(`Pre-condition: Login vào shop, vào web builder, vào trang product detail, xoá các block gallery đang có, thêm mới block gallery`, async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.customizeDefaultTheme();

      await wbPage.deleteAllExistingBlockProductGallery();
      await wbPage.insertDefaultProductGalleryBlock();
      await wbPage.page.locator(XpathNavigationButtons["website"]).click();
      await wbPage.clickCategorySetting("Product");
      await wbPage.selectDropDown("default_variant", "Auto choose the first variant");

      await wbPage.clickSaveButton();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_45 Verify hiển thị UI default khi add mới block product media layout Grid`, async ({
    snapshotFixture,
  }) => {
    await test.step(`Pre-condition: Chọn layout grid, chọn product có 2 image`, async () => {
      await wbPage.clickProductGalleryBlock();
      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Grid",
        },
      });
      await wbPage.selectProductPreviewByName(productNameConfig.product2Image.name);
      await wbPage.clickSaveButton();
    });

    await test.step(`Tại tab Design. Check trạng thái default tab Design `, async () => {
      await wbPage.switchToTab("Design");
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        selector: wbPage.sidebarContainer,
        snapshotName: getSnapshotNameWithEnv(case45Conf.snapshot.sidebar.tab_design),
      });
    });

    await test.step(`Tại tab Content. Check trạng thái default tab Content `, async () => {
      await wbPage.switchToTab("Content");
      await wbPage.waitAbit(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        selector: wbPage.sidebarContainer,
        snapshotName: getSnapshotNameWithEnv(case45Conf.snapshot.sidebar.tab_content),
      });
    });

    await test.step(`Check hiển thị ảnh tại preview`, async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnv(case45Conf.snapshot.wb.section),
      });
    });

    await test.step(`Click vào 1 ảnh`, async () => {
      await wbPage.dbClickOnGalleryImage("Grid", 0);
      await wbPage.waitAbit(5 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.preview.container,
        snapshotName: getSnapshotNameWithEnv(case45Conf.snapshot.wb.preview),
      });

      await wbPage.closePreview();
    });

    await test.step(`Click vào 1 video`, async () => {
      // TODO: fill later when have solution verify video
    });

    await test.step(`Click vào 1 gif`, async () => {
      // TODO: fill later when have solution verify gif
    });

    await test.step(`Chọn product có nhiều hơn 10 images`, async () => {
      await wbPage.selectProductPreviewByName(productNameConfig.productManyImage.name);
      await wbPage.backBtn.click();
      await wbPage.waitAbit(5 * 1000);

      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnv(case45Conf.snapshot.wb.section_many_image),
      });
    });

    await test.step(`Click button View all`, async () => {
      await wbPage.dbClickViewAllButton();
      await wbPage.waitAbit(5 * 1000);

      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.preview.container,
        snapshotName: getSnapshotNameWithEnv(case45Conf.snapshot.wb.preview_all),
      });
      await wbPage.closePreview();
    });

    await test.step(`Check preview với product không có ảnh thumbnail`, async () => {
      await wbPage.selectProductPreviewByName(productNameConfig.productNoImage.name);
      await wbPage.backBtn.click();
      await wbPage.waitAbit(5 * 1000);

      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnv(case45Conf.snapshot.wb.section_no_image),
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_46 Verify Edit Content của layout Grid`, async ({ snapshotFixture }) => {
    await test.step(`Pre-condition: Chọn layout grid, chọn product có 2 image`, async () => {
      await wbPage.clickProductGalleryBlock();
      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Grid",
        },
      });
      await wbPage.selectProductPreviewByName(productNameConfig.productManyImage.name);
      await wbPage.clickSaveButton();
    });

    await test.step(`Tại tab Content. Check trạng thái default tab Content `, async () => {
      // Skip this step, already check in case SB_WEB_BUILDER_PRD_45
    });

    await test.step(`Khi connect được đến với data source. Check hiển thị data source của product`, async () => {
      // Already cover on SB_SC_SCWB_21
    });

    await test.step(`Khi không connect được với data source. Click connect`, async () => {
      // Already cover on SB_SC_SCWB_21
    });

    await test.step(`Click chọn Media ratio. Hover vào từng loại ratio`, async () => {
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

        // Active tooltip
        const tooltipStyles = await wbPage.genLoc(wbPage.xpath.sidebar.tooltip(tooltipItem)).getAttribute("style");
        expect(tooltipStyles).not.toContain("display: none;");
      }
    });

    await test.step(`Chọn ratio portrait 3:4`, async () => {
      await wbPage.setProductGalleryContent({
        mediaRatio: "portrait",
      });
      await wbPage.titleBar.click({ delay: 200 });
      await wbPage.backBtn.click();
      await wbPage.clickSaveButton();

      // Verify wb
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnv(case46Conf.snapshot.wb.portrait),
      });

      // Verify sf
      await sfPage.openProductPage(productNameConfig.productManyImage.handle);
      await sfPage.waitAbit(5000);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpath.layoutGrid.container,
        snapshotName: getSnapshotNameWithEnv(case46Conf.snapshot.sf.portrait),
      });
    });

    await test.step(`Chọn ratio Landscape 16:9`, async () => {
      await wbPage.clickProductGalleryBlock();
      await wbPage.setProductGalleryContent({
        mediaRatio: "landscape",
      });
      await wbPage.titleBar.click({ delay: 200 });
      await wbPage.backBtn.click();
      await wbPage.clickSaveButton();

      // Verify wb
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnv(case46Conf.snapshot.wb.landscape),
      });

      // Verify sf
      await sfPage.openProductPage(productNameConfig.productManyImage.handle);
      await sfPage.waitAbit(5000);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: sfPage.xpath.layoutGrid.container,
        snapshotName: getSnapshotNameWithEnv(case46Conf.snapshot.sf.landscape),
      });
    });

    await test.step(`Tại tab photo list. Check trạng thái default`, async () => {
      await wbPage.clickProductGalleryBlock();
      // Check default select all photos
      const photoListText = await wbPage.genLocFirst(wbPage.xpath.sidebar.photoList).textContent();
      expect(photoListText).toContain("All photos");

      // Droplist co 2 option
      await wbPage.clickPhotoList();
      const photoListOptions = await wbPage.getPhotoListOptions();
      expect(JSON.stringify(photoListOptions)).toEqual(JSON.stringify(wbPage.text.photoListOptions));
    });

    await test.step(`Preview sản phẩm ngoài SF`, async () => {
      // Already covered
    });

    await test.step(`Click vào media video`, async () => {
      //TODO: update when found solution verify video
    });

    await test.step(`Save setting tại web builder. Đi đến webfront của product   -> Swipe chuyển giữa các media    `, async () => {
      // fill your code here
    });

    await test.step(`Chon variant và chọn Only show variant`, async () => {
      await wbPage.clickProductGalleryBlock();
      await wbPage.setProductGalleryContent({
        photoList: "Only show variant photos",
      });

      // Select variant S, Red ~> 1 photo
      await wbPage.selectVariant("S");
      await wbPage.selectVariant("Red");
      const numberOfProductImage = await wbPage.getNumberOfProductGalleryImage("Grid");
      expect(numberOfProductImage).toEqual(1);
    });

    await test.step(`Tại menu photo list, Chọn hiển thị only show variant photo > click chọn variant variant có ảnh`, async () => {
      // Select variant S, Green ~> 2 photo
      await wbPage.selectVariant("Green");
      const numberOfProductImage = await wbPage.getNumberOfProductGalleryImage("Grid");
      expect(numberOfProductImage).toEqual(2);
    });

    await test.step(`Tại menu photo list, Chọn hiển thị only show variant photo > click chọn variant variant ko ảnh`, async () => {
      // Select variant S, Blue ~> all photo (10)
      await wbPage.selectVariant("Blue");
      const numberOfProductImage = await wbPage.getNumberOfProductGalleryImage("Grid");
      expect(numberOfProductImage).toEqual(10);
    });
  });

  test(`@SB_WEB_BUILDER_PRD_48 Verify Edit Styles layout grid block Gallery`, async ({ snapshotFixture }) => {
    await test.step(`Pre-condition: Chọn layout grid, chọn product có 2 image`, async () => {
      await wbPage.clickProductGalleryBlock();
      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Grid",
        },
      });
      await wbPage.selectProductPreviewByName(productNameConfig.productManyImage.name);
      await wbPage.clickSaveButton();
    });

    await test.step(`  Kéo block Product Gallery vào 1 section mới với data source = Current page`, async () => {
      // Skip this step due to already cover in variable case
    });

    await test.step(`Check trạng thái default tab Styles`, async () => {
      // Already cover in SB_WEB_BUILDER_PRD_45
    });

    await test.step(`Click menu Layout, tại layout Grid`, async () => {
      await wbPage.clickProductGalleryBlock();
      await wbPage.switchToTab("Design");
      await wbPage.tmpClickLayoutDesktop();

      await wbPage.waitAbit(1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        selector: wbPage.xpath.sidebar.popover.active,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case48Conf.snapshot.wb.sidebar_layout, case48Conf.case_code),
      });
    });

    await test.step(`Tai menu Layout, chọn layout Grid: 1 items per row`, async () => {
      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Grid",
          options: {
            itemPerRow: 1,
          },
        },
      });

      // Out focus to prevent quickbar in screenshot
      await wbPage.selectVariant("S");
      await wbPage.backBtn.click();
      await wbPage.waitAbit(1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case48Conf.snapshot.wb.item_per_row_1, case48Conf.case_code),
      });
    });

    await test.step(`Tai menu Layout, chọn layout Grid: 2 items per row`, async () => {
      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Grid",
          options: {
            itemPerRow: 2,
          },
        },
      });

      // Out focus to prevent quickbar in screenshot
      await wbPage.selectVariant("S");
      await wbPage.backBtn.click();
      await wbPage.waitAbit(1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case48Conf.snapshot.wb.item_per_row_2, case48Conf.case_code),
      });
    });

    await test.step(`Edit spacing giữa các ảnh về 0 px`, async () => {
      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Grid",
          options: {
            spacing: 0,
          },
        },
      });

      // Out focus to prevent quickbar in screenshot
      await wbPage.selectVariant("S");
      await wbPage.backBtn.click();
      await wbPage.waitAbit(1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case48Conf.snapshot.wb.spacing_0, case48Conf.case_code),
      });
    });

    await test.step(`Edit spacing giữa các ảnh thành 80 px`, async () => {
      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Grid",
          options: {
            spacing: 0,
          },
        },
      });

      // Out focus to prevent quickbar in screenshot
      await wbPage.selectVariant("S");
      await wbPage.backBtn.click();
      await wbPage.waitAbit(1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case48Conf.snapshot.wb.spacing_80, case48Conf.case_code),
      });
    });

    await test.step(`Chọn vào files item. Nhập giá trị radius`, async () => {
      await wbPage.setProductGalleryStyle({
        itemRadius: 10,
      });

      await wbPage.waitAbit(1000);
      // Out focus to prevent quickbar in screenshot
      await wbPage.selectVariant("S");
      await wbPage.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case48Conf.snapshot.wb.radius_10, case48Conf.case_code),
      });
    });

    await test.step(`Edit common setting tại block Gallery:
 `, async () => {
      await wbPage.setProductGalleryStyle({
        align: {
          label: "align_self",
          type: "Right",
        },
        width: {
          label: "width",
          value: {
            unit: "Px",
            value: 560,
          },
        },
        border: {
          label: "border",
          value: {
            thickness: "custom",
            size: {
              fill: true,
              number: 2,
            },
          },
        },
        opacity: {
          label: "opacity",
          config: {
            fill: true,
            number: 50,
          },
        },
        radius: {
          label: "border_radius",
          config: {
            fill: true,
            number: 10,
          },
        },
        shadow: {
          label: "box_shadow",
          config: {
            option: "hard",
          },
        },
        // padding: {
        //   label: "padding",
        //   value: {
        //     top: 20,
        //     left: 20,
        //     right: 20,
        //     bottom: 20
        //   }
        // },
        // margin: {
        //   label: "margin",
        //   value: {
        //     top: 20,
        //     left: 20,
        //     right: 20,
        //     bottom: 20
        //   }
        // }
      });

      await wbPage.waitAbit(1000);
      // Out focus to prevent quickbar in screenshot
      await wbPage.selectVariant("S");
      await wbPage.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case48Conf.snapshot.wb.common_setting_1, case48Conf.case_code),
      });
    });

    await test.step(`Edit các common setting của 1 block:`, async () => {
      await wbPage.setProductGalleryStyle({
        align: {
          label: "align_self",
          type: "Center",
        },
        width: {
          label: "width",
          value: {
            unit: "Px",
            value: 650,
          },
        },
        border: {
          label: "border",
          value: {
            thickness: "custom",
            size: {
              fill: true,
              number: 20,
            },
          },
        },
        opacity: {
          label: "opacity",
          config: {
            fill: true,
            number: 150,
          },
        },
        radius: {
          label: "border_radius",
          config: {
            fill: true,
            number: 5,
          },
        },
        shadow: {
          label: "box_shadow",
          config: {
            option: "hard",
          },
        },
        // padding: {
        //   label: "padding",
        //   value: {
        //     top: 20,
        //     left: 20,
        //     right: 20,
        //     bottom: 20
        //   }
        // },
        // margin: {
        //   label: "margin",
        //   value: {
        //     top: 20,
        //     left: 20,
        //     right: 20,
        //     bottom: 20
        //   }
        // }
      });

      await wbPage.waitAbit(1000);
      // Out focus to prevent quickbar in screenshot
      await wbPage.selectVariant("S");
      await wbPage.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case48Conf.snapshot.wb.common_setting_2, case48Conf.case_code),
      });
    });

    await test.step(`Edit product để product chỉ còn lại 1 media => Save. Tai menu Layout, chọn layout Grid: 1 items per row`, async () => {
      await wbPage.selectProductPreviewByName(productNameConfig.product1Image.name);

      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Grid",
          options: {
            itemPerRow: 1,
          },
        },
      });

      // Out focus to prevent quickbar in screenshot
      await wbPage.clickBlockVariantPicker();
      await wbPage.waitAbit(1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case48Conf.snapshot.wb.item_per_row_1_1, case48Conf.case_code),
      });
    });

    await test.step(`Tai menu Layout, chọn layout Grid: 2 items per row => Save`, async () => {
      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Grid",
          options: {
            itemPerRow: 2,
          },
        },
      });

      // Out focus to prevent quickbar in screenshot
      await wbPage.clickBlockVariantPicker;
      await wbPage.waitAbit(1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case48Conf.snapshot.wb.item_per_row_1_2, case48Conf.case_code),
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_51 Verify behavior của block Media layout Grid trên webfront`, async ({
    snapshotFixture,
  }) => {
    await test.step(`Pre-condition: Chọn layout grid, chọn product có 2 image`, async () => {
      await wbPage.clickProductGalleryBlock();
      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Grid",
        },
      });
      await wbPage.clickSaveButton();
    });

    await test.step(`Click vào block product gallery, chọn product`, async () => {
      await wbPage.selectProductPreviewByName(productNameConfig.productManyImage.name);
    });

    await test.step(`Click vào variant video`, async () => {
      // fill your code here
    });

    await test.step(`Click vào variant gif`, async () => {
      // fill your code here
    });

    await test.step(`Chọn variant S, Red ở variant picker`, async () => {
      await wbPage.selectVariant("S");
      await wbPage.selectVariant("Red");
      await wbPage.waitAbit(2000);

      // take snapshot
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case51Conf.snapshot.wb.s_red_variant, case51Conf.case_code),
      });
    });

    await test.step(`Chọn variant S, Green ở variant picker`, async () => {
      await wbPage.selectVariant("S");
      await wbPage.selectVariant("Green");

      await wbPage.waitAbit(2000);

      // take snapshot
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        iframe: wbPage.iframe,
        selector: wbPage.xpath.wbPreview.sectionProductGallery,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case51Conf.snapshot.wb.s_green_variant, case51Conf.case_code),
      });
    });

    await test.step(`Click tich chọn vào Auto select first variant trong product setting  => Save `, async () => {
      await wbPage.page.locator(XpathNavigationButtons["website"]).click();
      await wbPage.clickCategorySetting("Product");
      await wbPage.selectDropDown("default_variant", "Auto choose the first variant");

      await wbPage.clickSaveButton();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_53 Verify hiển thị UI default khi add mới block product media layout mix`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    sfPage = new SfProductGallery(page, conf.suiteConf.domain);

    await test.step(`Pre-condition: Chọn layout mix, chọn product có many image`, async () => {
      await wbPage.clickProductGalleryBlock();
      await wbPage.setProductGalleryStyle({
        layout: {
          name: "Mix",
        },
      });

      await wbPage.clickSaveButton();
    });

    await test.step(`Tại tab Design. Check trạng thái default tab Design`, async () => {
      // skip
    });

    await test.step(`Tại tab Content. Check trạng thái default tab Content`, async () => {
      // skip
    });

    const products = [
      productNameConfig.productNoImage,
      productNameConfig.product1Image,
      productNameConfig.product2Image,
      productNameConfig.productManyImage,
    ];

    await test.step(`1. Chọn lần lượt các ảnh từ không có ảnh tới có nhiều ảnh`, async () => {
      for (const product of products) {
        logger.info("Process product: " + product.name);

        await wbPage.selectProductPreviewByName(product.name);
        await wbPage.waitTillProductBreadcrumbUpdate(product.name);
        await wbPage.clickBlockVariantPicker();

        await wbPage.waitAbit(5000);
        await snapshotFixture.verifyWithAutoRetry({
          page: wbPage.page,
          iframe: wbPage.iframe,
          selector: wbPage.xpath.wbPreview.sectionProductGallery,
          snapshotName: getSnapshotNameWithEnvAndCaseCode(`wb-${product.handle}.png`, case53Conf.case_code),
        });
      }
    });

    await test.step(`Preview lần lượt các sản phẩm ngoài SF`, async () => {
      for (const product of products) {
        logger.info("Process product: " + product.name);
        // goto product
        await sfPage.openProductPage(product.handle);

        let selector = sfPage.xpath.layoutMix.container;
        const isContainerVisible = await sfPage.genLocFirst(selector).isVisible();
        if (!isContainerVisible) {
          selector = sfPage.xpath.noImageWrapper;
        }

        await sfPage.waitAbit(5000);
        await snapshotFixture.verifyWithAutoRetry({
          page: sfPage.page,
          selector: selector,
          snapshotName: getSnapshotNameWithEnvAndCaseCode(`sf-${product.handle}.png`, case53Conf.case_code),
        });
      }
    });

    await test.step(`Click button View all`, async () => {
      await sfPage.genLoc(sfPage.xpath.layoutMix.buttonViewAll).click();
      await sfPage.page.waitForLoadState("networkidle");
      await sfPage.waitAbit(5000);

      await snapshotFixture.verify({
        page: sfPage.page,
        selector: sfPage.xpath.preview.container,
        snapshotName: getSnapshotNameWithEnvAndCaseCode(case53Conf.snapshot.sf.preview, case53Conf.case_code),
      });
    });
  });
});
