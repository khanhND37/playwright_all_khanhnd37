import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";
import { test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintHubPage } from "@pages/apps/printhub";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@pages/storefront/product";
import appRoot from "app-root-path";

test.describe("Check add new product với với folder khi chọn Show with Thumbnail images/Show with Droplist ", async () => {
  let printHubPage: PrintHubPage;
  let productPage: ProductPage;
  let clipartSFPage: SFProduct;

  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const clipartData = conf.caseConf.data[i];
    const clipartFolderInfo = clipartData.clipart_folder_info;
    const productInfo = clipartData.product_all_info;
    const customOptionInfo = clipartData.custom_option_info;
    const imageThumbnailEdit = clipartData.image_thumbnail_edit;
    const imageThumbnailDelete = clipartData.image_thumbnail_delete;
    const clipartNameEdit = clipartData.clipart_name_edit;
    const clipartImageEdit = clipartData.clipart_image_edit;
    const clipartImageDelete = clipartData.clipart_image_delete;
    const customOptionSF = clipartData.custom_option_SF;

    test(`@${clipartData.case_id} ${clipartData.description}`, async ({
      dashboard,
      conf,
      context,
      snapshotFixture,
    }) => {
      test.setTimeout(conf.suiteConf.timeout);
      printHubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
      productPage = new ProductPage(dashboard, conf.suiteConf.domain);

      await test.step("Tạo folder clipart ở màn Clipart- Printhub", async () => {
        await printHubPage.goto(printHubPage.urlClipartPage);
        await productPage.deleteClipartFolder(clipartFolderInfo.folder_name);
        await productPage.clickOnBtnLinkWithLabel("Create folder", 1);
        await productPage.addNewClipartFolder(clipartFolderInfo, 1);
        await productPage.clickOnBtnWithLabel("Save changes", 1);
      });

      await test.step(`- Click vào btn "Create custom option only"
      - Input các giá trị vào các trường trong custom option detail
      - Click button Save Changes`, async () => {
        await productPage.goToProductList();
        await productPage.searchProdByName(productInfo.title);
        await productPage.deleteProduct(conf.suiteConf.password);
        await productPage.addNewProductWithData(productInfo);
        await productPage.clickBtnCustomOptionOnly();
        await productPage.addNewCustomOptionWithData(customOptionInfo);
        await productPage.clickOnBtnWithLabel("Save changes");
      });

      await test.step("- View product ngoài SF", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
        clipartSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
        await clipartSFPage.waitResponseWithUrl("/assets/landing.css", 90000);
        await clipartSFPage.page.waitForSelector(clipartSFPage.xpathCustomOptionSF, { timeout: 20000 });
        await clipartSFPage.page.waitForTimeout(5 * 1000);
        if (clipartData.case_id === "SB_PRO_SBP_ICFP_3") {
          await clipartSFPage.waitForCLipartImagesLoaded();
        }
        for (let i = 0; i < customOptionSF.origin_images.length; i++) {
          await clipartSFPage.inputCustomOptionSF(customOptionSF.origin_images[i]);

          await snapshotFixture.verify({
            page: clipartSFPage.page,
            selector: clipartSFPage.xpathCustomOptionSF,
            snapshotName: clipartData.picture[i].picture_choice_sf,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }

        await productPage.closeCustomOption(customOptionInfo);
        await productPage.page.waitForTimeout(2 * 1000);
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: productPage.xpathCustomOptionInProductDetail,
          snapshotName: clipartData.picture[0].clipart_editor,
          sizeCheck: true,
        });
      });

      await test.step(`- Vào màn product detail, tại custom option Picture choice
      - Click button Edit clipart folder
      - Edit ảnh thumbnail của "Image 1" thành "Image 4"/ Edit ảnh "Image 1" thành "Image 3"
      - Click button Save Changes
      - View product ngoài SF`, async () => {
        await productPage.clickOnBtnEditClipartFolder();
        await dashboard.waitForTimeout(3 * 1000);
        if (clipartData.case_id === "SB_PRO_SBP_ICFP_3") {
          const pathFileImageThumbnail = appRoot + `/data/shopbase/${imageThumbnailEdit.image_thumbnail}`;
          await productPage.editImageThumbnailInClipartFolder(imageThumbnailEdit.image_preview, pathFileImageThumbnail);
          await clipartSFPage.waitForCLipartImagesLoaded();
        }
        if (clipartData.case_id === "SB_PRO_SBP_ICFP_5") {
          await productPage.deleteImageInClipartFolder(clipartImageEdit.image);
          await productPage.addMoreClipart(clipartImageEdit.new_image);
        }
        await productPage.clickOnBtnWithLabel("Save changes", 3);
        await productPage.clickOnBtnWithLabel("Save changes");
        await clipartSFPage.viewProductAgain(productInfo.title);
        await clipartSFPage.page.waitForSelector(clipartSFPage.xpathCustomOptionSF, { timeout: 20000 });
        if (clipartData.case_id === "SB_PRO_SBP_ICFP_3") {
          await clipartSFPage.waitForCLipartImagesLoaded();
          for (let i = 0; i < customOptionSF.edit_image.length; i++) {
            await clipartSFPage.inputCustomOptionSF(customOptionSF.edit_image[i]);
          }
          await snapshotFixture.verify({
            page: clipartSFPage.page,
            selector: clipartSFPage.xpathCustomOptionSF,
            snapshotName: clipartData.picture[i].picture_choice_edit_image,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }
      });

      await test.step(`- Vào màn product detail, tại custom option Picture choice
      - Click button Edit clipart folder
      - Xóa ảnh thumbnail của "Image 1"
      - Click button Save Changes
      - View product ngoài SF`, async () => {
        await productPage.clickOnBtnEditClipartFolder();
        await productPage.page.waitForTimeout(3 * 1000);
        if (clipartData.case_id === "SB_PRO_SBP_ICFP_3") {
          await productPage.deleteImageThumbnailInClipartFolder(imageThumbnailDelete.image);
        }
        if (clipartData.case_id === "SB_PRO_SBP_ICFP_5") {
          await productPage.deleteImageInClipartFolder(clipartImageDelete.image);
        }
        await productPage.clickOnBtnWithLabel("Save changes", 3);
        await productPage.clickOnBtnWithLabel("Save changes");
        await clipartSFPage.viewProductAgain(productInfo.title);
        await clipartSFPage.page.waitForSelector(clipartSFPage.xpathCustomOptionSF, { timeout: 20000 });
        if (clipartData.case_id === "SB_PRO_SBP_ICFP_3") {
          await clipartSFPage.waitForCLipartImagesLoaded();
        }

        for (let i = 0; i < customOptionSF.image_delete.length; i++) {
          await clipartSFPage.inputCustomOptionSF(customOptionSF.image_delete[i]);

          await snapshotFixture.verify({
            page: clipartSFPage.page,
            selector: clipartSFPage.xpathCustomOptionSF,
            snapshotName: clipartData.picture[i].picture_choice_delete_image,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }
      });

      await test.step(`- Vào PrintHub >> Library >> Clipart : /admin/apps/print-hub/clipart
      - Sửa name "Image 2" thành "Image 7" ở "Folder Thumbnail Images"
      - Vào màn product detail, tại custom option Picture choice
      - Click button Edit clipart folder`, async () => {
        await printHubPage.goto(printHubPage.urlClipartPage);
        await productPage.openClipartFolderDetail(clipartFolderInfo.folder_name);
        await productPage.page.waitForTimeout(3 * 1000);
        await productPage.editClipartImageName(clipartNameEdit.name, clipartNameEdit.new_name);
        await productPage.clickOnBtnWithLabel("Save changes");

        await productPage.gotoProductDetail(productInfo.title);
        await productPage.editProductType(clipartData.add_type);
        await productPage.clickOnBtnWithLabel("Save changes");
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        await productPage.closeCustomOption(customOptionInfo);
        await productPage.clickOnBtnEditClipartFolder();
        await productPage.page.waitForSelector(productPage.xpathClipartEditor);

        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: productPage.xpathClipartEditor,
          snapshotName: clipartData.picture[0].clipart_editor_edit_name,
          sizeCheck: true,
        });
      });

      await test.step("View product ngoài SF", async () => {
        await clipartSFPage.viewProductAgain(productInfo.title);
        await clipartSFPage.page.waitForSelector(clipartSFPage.xpathCustomOptionSF, { timeout: 20000 });
        if (clipartData.case_id === "SB_PRO_SBP_ICFP_3") {
          await clipartSFPage.waitForCLipartImagesLoaded();
        }

        for (let i = 0; i < customOptionSF.edit_name.length; i++) {
          await clipartSFPage.inputCustomOptionSF(customOptionSF.edit_name[i]);
          await snapshotFixture.verify({
            page: clipartSFPage.page,
            selector: clipartSFPage.xpathCustomOptionSF,
            snapshotName: clipartData.picture[i].picture_choice_edit_name,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }
      });

      await test.step(`- Tại product page ngoài SF
      - Chọn Image 1
      - Add product vào cart
      -  checkout product thành công `, async () => {
        await clipartSFPage.addToCart();
        await clipartSFPage.waitForElementVisibleThenInvisible(clipartSFPage.xpathIconLoadImage);
        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: clipartSFPage.xpathProductsIncart,
          snapshotName: clipartData.picture[0].product_image_in_cart,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });
    });
  }
});
