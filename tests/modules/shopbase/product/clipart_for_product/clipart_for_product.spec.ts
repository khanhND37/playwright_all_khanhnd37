import { expect, test } from "@core/fixtures";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { ProductPage } from "@pages/dashboard/products";
import appRoot from "app-root-path";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { ClipartPage } from "@pages/dashboard/clipart";
import { Personalize } from "@pages/dashboard/personalize";
import { SFProduct } from "@pages/storefront/product";
import { PrintHubPage } from "@pages/apps/printhub";

test.describe("Improve clipart for product", () => {
  let clipartPage: ProductPage;
  let clipart: ClipartPage;
  test.beforeEach(async ({ conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
  });

  test("Check add new clipart folder tại màn Product detail @SB_PRO_SBP_ICFP_1", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const productInfo = conf.caseConf.product_all_info;
    const customOptionInfo = conf.caseConf.custom_option_info;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const imageThumbnailEdit = conf.caseConf.image_thumbnail_edit;
    const imageThumbnailDelete = conf.caseConf.image_thumbnail_delete;
    const imagePreviewDelete = conf.caseConf.image_preview_delete;

    await test.step("Vào màn hình All products -> Tạo mới product", async () => {
      await product.goToProductList();
      await product.searchProdByName(productInfo.title);
      await product.deleteProduct(conf.suiteConf.password);
      await product.addNewProductWithData(productInfo);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
    });

    await test.step(
      "Click vào btn Create custom option only -> Chọn Custom option type là " +
        ": Picture choice -> Check hiển thị của Picture choice",
      async () => {
        await product.clickBtnCustomOptionOnly();
        await product.addNewCustomOptionWithData(customOptionInfo);
        await product.closeCustomOption(customOptionInfo);
        const textTooltipExp = conf.caseConf.textTooltip;
        const textTooltip = await product.getTextOnTooltip(product.xpathTooltipClipart, product.xpathTooltipHover);
        await expect(textTooltip).toContain(textTooltipExp);
        const xpathLinkClipartlibrary = "//a[normalize-space () = 'Go to clipart library']";
        const isCheckLinkClipartlibrary = await dashboard.locator(xpathLinkClipartlibrary).isVisible();
        await expect(isCheckLinkClipartlibrary).toBe(true);
        await product.removeBlockTitleDescription();
        await snapshotFixture.verify({
          page: dashboard,
          selector: "//div[@class = 'picture-choice__container s-flex s-flex--wrap']",
          snapshotName: `block-folder-group-clipart-SB_PRO_SBP_ICFP_1.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      },
    );

    await test.step("Click vào link ext Go to clipart library", async () => {
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator("//a[normalize-space()='Go to clipart library']").click(),
      ]);
      const urlClipartPage = `https://${conf.suiteConf.domain}/admin/apps/print-hub/clipart`;
      expect(newTab.url()).toContain(urlClipartPage);
      clipartPage = new ProductPage(newTab, conf.caseConf.domain);
      //delete folder clipart cũ
      await clipartPage.deleteClipartFolder(clipartFolderInfo.folder_name);
    });

    await test.step(
      "Chọn Show all cliparts in a clipart Folder -> Click vào textfield Select a Clipart folder" +
        " -> Click button Add a clipart folder",
      async () => {
        await dashboard.click("//span[contains(text(),'Show all cliparts in a clipart Folder')]");
        await dashboard.click("#pc-clipart-folder-input");
        await dashboard.click("//a[normalize-space()='Add a clipart folder']");
        await dashboard.waitForSelector("//div[@class='s-form-item text-right']//input");
        await snapshotFixture.verify({
          page: dashboard,
          selector: "//div[@class='s-animation-content s-modal-content']",
          snapshotName: `popup-add-new-clipart-folder-SB_PRO_SBP_ICFP_1.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      },
    );

    await test.step("Nhập thông tin clipart folder", async () => {
      await product.addNewClipartFolder(clipartFolderInfo);
      await dashboard.locator("//table[@class='custom-table__width m-t relative']").scrollIntoViewIfNeeded();
      await dashboard.waitForSelector("//div[@class='thumb-loading']", { state: "hidden" });
      await dashboard.waitForSelector("//img[@class='sbase-spinner']", { state: "hidden" });
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[@class='s-animation-content s-modal-content']",
        snapshotName: `info-clipart-folder-SB_PRO_SBP_ICFP_1.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click icon bút chì để Upload Thumbnail khác với Clipart đã có Thumbnail", async () => {
      const pathFileImageThumbnail = appRoot + `/data/shopbase/${imageThumbnailEdit.image_thumbnail}`;
      await product.editImageThumbnailInClipartFolder(imageThumbnailEdit.image_preview, pathFileImageThumbnail);
      await dashboard.locator("//table[@class='custom-table__width m-t relative']").scrollIntoViewIfNeeded();
      await dashboard.waitForSelector("//div[@class='thumb-loading']", { state: "hidden" });
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[@class='s-animation-content s-modal-content']",
        snapshotName: `edit-image-thumbnail-SB_PRO_SBP_ICFP_1.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click xóa image Thumbnail", async () => {
      await product.deleteImageThumbnailInClipartFolder(imageThumbnailDelete.image_preview);
      await dashboard.locator("//table[@class='custom-table__width m-t relative']").scrollIntoViewIfNeeded();
      await dashboard.waitForSelector("//div[@class='thumb-loading']", { state: "hidden" });
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[@class='s-animation-content s-modal-content']",
        snapshotName: `delete-image-thumbnail-SB_PRO_SBP_ICFP_1.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click xóa Cliparts", async () => {
      await product.deleteImageInClipartFolder(imagePreviewDelete);
      await dashboard.locator("//table[@class='custom-table__width m-t relative']").scrollIntoViewIfNeeded();
      await dashboard.waitForSelector("cl", { state: "hidden" });
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[@class='s-animation-content s-modal-content']",
        snapshotName: `delete-clipart-SB_PRO_SBP_ICFP_1.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click button Discard", async () => {
      await dashboard.click("//div[@class='fixed-setting-bar__bottom']//button[normalize-space()='Discard']");
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[@class='s-animation-content s-modal-content']",
        snapshotName: `popup-discard-SB_PRO_SBP_ICFP_1.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(
      "Mở lại popup New clipart folder -> Nhập thông tin Name folder " +
        "và Clipart hợp lệ -> Click button Save changes",
      async () => {
        await product.addNewClipartFolder(clipartFolderInfo);
        await dashboard.click("//div[@class='fixed-setting-bar__bottom']//button[normalize-space()='Save changes']");
        await product.clickOnBtnWithLabel("Save changes");
        await expect(await product.isToastMsgVisible("Product was successfully saved!")).toBe(true);
        await product.waitUntilElementInvisible(product.xpathToastMessage);
        await product.removeBlockTitleDescription();
        await snapshotFixture.verify({
          page: dashboard,
          selector: "//div[@class = 'picture-choice__container s-flex s-flex--wrap']",
          snapshotName: `add-clipart-folder-success-SB_PRO_SBP_ICFP_1.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      },
    );
  });

  test("Check edit clipart folder tại màn Product detail @SB_PRO_SBP_ICFP_2", async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const productInfo = conf.caseConf.product_all_info;
    const customOptionInfo = conf.caseConf.custom_option_info;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const imagePreviewDelete = conf.caseConf.image_preview_delete;
    const imageAddMore = conf.caseConf.image_add_more;

    await test.step("Vào màn hình All products -> Tạo mới product", async () => {
      await product.goToProductList();
      await product.searchProdByName(productInfo.title);
      await product.deleteProduct(conf.suiteConf.password);
      await product.addNewProductWithData(productInfo);
    });

    await test.step(
      "Click vào btn Create custom option only -> Chọn Custom option type là Picture choice -> " +
        "Chọn Show all cliparts in a clipart Folder -> Click button Edit clipart folder",
      async () => {
        await product.clickBtnCustomOptionOnly();
        await product.addNewCustomOptionWithData(customOptionInfo);
        await product.closeCustomOption(customOptionInfo);
        await product.clickOnBtnEditClipartFolder();
        await dashboard.locator("//table[@class='custom-table__width m-t relative']").scrollIntoViewIfNeeded();
        clipart = new ClipartPage(dashboard, conf.suiteConf.domain);
        const countClipart = await clipart.countImageInClipart();
        for (let i = 1; i <= countClipart; i++) {
          await waitForImageLoaded(
            clipart.page,
            `(//div[contains(@class,'image-in-table align-item-center')]//img)[${i}]`,
          );
        }
        await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
        await snapshotFixture.verify({
          page: dashboard,
          selector: "//div[@class='s-animation-content s-modal-content']",
          snapshotName: `popup-edit-clipart-folder-SB_PRO_SBP_ICFP_2.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      },
    );

    await test.step("Edit thông tin clipart folder -> Click button Save changes", async () => {
      await product.addNewClipartFolder(clipartFolderInfo);
      await product.deleteImageInClipartFolder(imagePreviewDelete);
      await dashboard.locator("//table[@class='custom-table__width m-t relative']").scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[@class='s-animation-content s-modal-content']",
        snapshotName: `edit-clipart-folder-SB_PRO_SBP_ICFP_2.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
      await dashboard.click("//div[@class='fixed-setting-bar__bottom']//button[normalize-space()='Save changes']");
      await product.clickOnBtnWithLabel("Save changes");
      await expect(await product.isToastMsgVisible("Product was successfully saved!")).toBe(true);
      await dashboard.waitForSelector(
        "//div[@class='s-toast is-dark is-bottom' or @class = 's-toast is-danger is-bottom']",
        { state: "hidden" },
      );
      await product.removeBlockTitleDescription();
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[@class = 'picture-choice__container s-flex s-flex--wrap']",
        snapshotName: `edit-clipart-folder-success-SB_PRO_SBP_ICFP_2.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(
      "Mở lại popup Edit clipart folder -> Click button Add more clipart ->" +
        " Chọn image để upload -> Click button Save changes",
      async () => {
        await product.clickOnBtnEditClipartFolder();
        await product.addMoreClipart(imageAddMore);
        await dashboard.click("//div[@class='fixed-setting-bar__bottom']//button[normalize-space()='Save changes']");
        await product.clickOnBtnWithLabel("Save changes");
        await expect(await product.isToastMsgVisible("Product was successfully saved!")).toBe(true);
        await dashboard.waitForSelector(
          "//div[@class='s-toast is-dark is-bottom' or @class = 's-toast is-danger is-bottom']",
          { state: "hidden" },
        );
        await product.removeBlockTitleDescription();
        await snapshotFixture.verify({
          page: dashboard,
          selector: "//div[@class = 'picture-choice__container s-flex s-flex--wrap']",
          snapshotName: `add-more-clipart-folder-success-SB_PRO_SBP_ICFP_2.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      },
    );

    await test.step("Click vào link ext Go to clipart library > Xóa folder clipart đã tạo", async () => {
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator("//a[normalize-space()='Go to clipart library']").click(),
      ]);
      const urlClipartPage = `https://${conf.suiteConf.domain}/admin/apps/print-hub/clipart`;
      expect(newTab.url()).toContain(urlClipartPage);
      clipartPage = new ProductPage(newTab, conf.caseConf.domain);
      //delete folder clipart đã tạo
      await clipartPage.deleteClipartFolder(clipartFolderInfo.folder_name);
    });
  });

  test(`@SB_PRO_SBP_ICFP_27 Check tạo mới folder clipart tại màn Personalization khi tạo product với Preview image`, async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    const personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
    const printhub = new PrintHubPage(dashboard, conf.suiteConf.domain);
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const productInfo = conf.caseConf.product_all_info;
    const customOptionInfo = conf.caseConf.custom_option_info;
    const imageMockup = conf.caseConf.image_preview;
    const layerList = conf.caseConf.layer;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const customOptionSF = conf.caseConf.custom_option_SF;
    const picture = conf.caseConf.picture;

    await test.step(`Tạo mới product > Click vào btn "Create Preview Image" > Upload Preview image > Upload layer Image > Add Custom Option PC > Click "Show all cliparts in a clipart Folder" > Click "Add a clipart folder"`, async () => {
      await personalizePage.goToProductList();
      await personalizePage.searchProdByName(productInfo.title);
      await personalizePage.deleteProduct(conf.suiteConf.password);
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
      await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(
        productInfo,
        imageMockup,
        "Create Preview image",
      );
      await personalizePage.addLayer(layerList);
      await personalizePage.page.click(personalizePage.xpathIconExpand);
      await personalizePage.clickOnBtnWithLabel("Customize layer", 1);

      await personalizePage.addClipartOnCustomOption(clipartFolderInfo);
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPreviewPage,
        snapshotName: `${process.env.ENV}-${picture.preview_page}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
        sizeCheck: true,
      });
      await personalizePage.clickOnBtnWithLabel("Save changes", 2);
    });

    await test.step(`Input thông tin folder clipart > Click btn Save changes`, async () => {
      await personalizePage.addCustomOptionOnEditor(customOptionInfo);
      await waitForImageLoaded(dashboard, ".thumbnail > img");
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathBlockPictureChoice(),
        snapshotName: `${process.env.ENV}-${picture.block_CO}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
        sizeCheck: true,
      });
      await personalizePage.clickOnBtnWithLabel("Save");
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
    });

    await test.step(`Click Save changes > View product tại SF > Verify folder clipart tại SF`, async () => {
      await personalizePage.clickOnBtnWithLabel("Cancel");
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.clickViewProductSF()]);
      const clipartSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await clipartSFPage.waitResponseWithUrl("/assets/landing.css", 120000);
      await clipartSFPage.page.waitForSelector(personalizePage.xpathListCO, { timeout: 60000 });
      await clipartSFPage.waitForCLipartImagesLoaded();
      for (let i = 0; i < customOptionSF.length; i++) {
        await clipartSFPage.inputCustomOptionSF(customOptionSF[i]);
        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: clipartSFPage.xpathCustomOptionSF,
          snapshotName: `${process.env.ENV}-${i + 1}-${picture.clipart_sf}`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
          sizeCheck: true,
        });
      }
    });

    await test.step(`Tại Dashboard, vào màn clipart /apps/print-hub/clipart > Kiểm tra thông tin folder clipart vừa tạo`, async () => {
      await printhub.goto(printhub.urlClipartPage);
      await personalizePage.openClipartFolderDetail(clipartFolderInfo.folder_name);
      await personalizePage.waitImagesLoaded(personalizePage.xpathImageClipart);
      await snapshotFixture.verify({
        page: dashboard,
        selector: clipartPage.xpathClipartDetail,
        snapshotName: `${process.env.ENV}-${picture.clipart_detail_phub}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
        sizeCheck: true,
      });

      // delete clipart đã tạo
      await clipartPage.clickOnTextLinkWithLabel("Clipart folders");
      await clipartPage.deleteClipartFolder(clipartFolderInfo.folder_name);
    });
  });
});
