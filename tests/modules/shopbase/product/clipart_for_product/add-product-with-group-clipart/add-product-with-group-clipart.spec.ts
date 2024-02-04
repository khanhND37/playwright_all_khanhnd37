import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";
import { test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintHubPage } from "@pages/apps/printhub";
import { ClipartPage } from "@pages/dashboard/clipart";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@pages/storefront/product";

let productPage: ProductPage;
let printhubPage: PrintHubPage;
let clipartSFPage: SFProduct;
let clipartPage: ClipartPage;
let printBasePage: PrintBasePage;

test.beforeEach(async ({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

const conf = loadData(__dirname, "DATA_DRIVEN");
for (let i = 0; i < conf.caseConf.data.length; i++) {
  const drivenData = conf.caseConf.data[i];
  const clipartFolderInfo = drivenData.clipart_folder_info;
  const productInfo = drivenData.product_info;
  const customOptionInfo = drivenData.custom_option_info;
  const customOptionSF = drivenData.custom_option_SF;
  const customOptionSFDeleteImage = drivenData.custom_option_SF_delete_image;
  const imageThumbnailDelete = drivenData.image_thumbnail_delete;
  const clipartImageDelete = drivenData.clipart_image_delete;
  const clipartNameEdit = drivenData.clipart_name_edit;
  const customOptionSFEditName = drivenData.custom_option_SF_edit_name;
  const customOptionDeleteFolder = drivenData.custom_option_SF_delete_folder;

  test(`@${drivenData.case_id} ${drivenData.description}`, async ({ dashboard, conf, context, snapshotFixture }) => {
    test.setTimeout(conf.suiteConf.timeout);
    printhubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    printBasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);

    await test.step("Tạo Group Thumbnail Images có : Folder 1 , Folder 2 > Folder 1 có Image 1, Image 2 > Folder 2 có Image 3, Image 4 > [Case 4] ảnh thumbnail của Image 1 là Image 5 , Image3 là Image 6", async () => {
      await printhubPage.goto(printhubPage.urlClipartPage);

      for (let i = 0; i < clipartFolderInfo.length; i++) {
        await productPage.deleteClipartFolder(clipartFolderInfo[i].folder_name);
        await productPage.clickOnBtnWithLabel("Create folder");
        await productPage.addNewClipartFolder(clipartFolderInfo[i]);
        await productPage.clickOnBtnWithLabel("Save changes", 1);
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        await productPage.clickElementWithLabel("span", "Clipart folders");
        await productPage.waitBtnEnable("Create folder");
      }
    });

    await test.step("Click vào btn Create custom option only- Input các giá trị vào các trường trong custom option detail- Click button Save Changes", async () => {
      await productPage.goToProductList();
      await productPage.searchProdByName(productInfo.title);
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.addNewProductWithData(productInfo);
      await productPage.clickBtnCustomOptionOnly();
      await productPage.addNewCustomOptionWithData(customOptionInfo);
      await productPage.clickOnBtnWithLabel("Save changes");
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
    });

    await test.step(" View product ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
      clipartSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await clipartSFPage.page.waitForTimeout(5 * 1000);
      await clipartSFPage.page.waitForSelector(printBasePage.xpathListCO, { timeout: 60000 });
      await clipartSFPage.page.waitForTimeout(5 * 1000);

      for (let i = 0; i < customOptionSF.length; i++) {
        await clipartSFPage.inputCustomOptionSF(customOptionSF[i]);
        if (drivenData.case_id === "SB_PRO_SBP_ICFP_4") {
          await clipartSFPage.waitForCLipartImagesLoaded();
        }
        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: printBasePage.xpathListCO,
          snapshotName: drivenData.picture[i].picture_choice_sf,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
      await productPage.removeBlockTitleDescription();
      await productPage.closeCustomOption(customOptionInfo);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: productPage.xpathCustomOptionInProductDetail,
        snapshotName: drivenData.picture[0].clipart_editor,
        sizeCheck: true,
      });
    });

    await test.step(" Vào màn product detail, tại custom option Picture choice- Click button Edit clipart folder : Folder 1- Xóa ảnh thumbnail của Image 1- Click button Save Changes- View product ngoài SF", async () => {
      await clipartPage.clickOnBtnEditClipartFolderByFolderName(drivenData.clipart_folder_info[0].folder_name);
      await productPage.page.waitForTimeout(3 * 1000);
      if (drivenData.case_id === "SB_PRO_SBP_ICFP_4") {
        await productPage.deleteImageThumbnailInClipartFolder(imageThumbnailDelete.image);
      }
      if (drivenData.case_id === "SB_PRO_SBP_ICFP_6") {
        await productPage.deleteImageInClipartFolder(clipartImageDelete.image);
      }
      await productPage.clickOnBtnWithLabel("Save changes", 3);

      await clipartSFPage.viewProductAgain(productInfo.title);
      await clipartSFPage.page.waitForSelector(printBasePage.xpathListCO, { timeout: 60000 });

      for (let i = 0; i < customOptionSFDeleteImage.length; i++) {
        await clipartSFPage.inputCustomOptionSF(customOptionSFDeleteImage[i]);
        if (drivenData.case_id === "SB_PRO_SBP_ICFP_4") {
          await clipartSFPage.waitForCLipartImagesLoaded();
        }
        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: printBasePage.xpathListCO,
          snapshotName: drivenData.picture[i].picture_choice_delete_image,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
    });

    await test.step(" Vào PrintHub >> Library >> Clipart : /admin/apps/print-hub/clipart > Open folder detai : Folder 1- Sửa name Image 2 thành Image 7 ở Folder 1 > Vào màn product detail, tại custom option Picture choice- Click button Edit clipart folder: Folder 1", async () => {
      await printhubPage.goto(printhubPage.urlClipartPage);
      await productPage.openClipartFolderDetail(clipartFolderInfo[0].folder_name);
      await productPage.page.waitForTimeout(3 * 1000);
      await productPage.editClipartImageName(clipartNameEdit.name, clipartNameEdit.new_name);
      await productPage.clickOnBtnWithLabel("Save changes");

      await productPage.gotoProductDetail(productInfo.title);
      await productPage.editProductType(drivenData.add_type);
      await productPage.clickOnBtnWithLabel("Save changes");
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      await productPage.closeCustomOption(customOptionInfo);
      await clipartPage.clickOnBtnEditClipartFolderByFolderName(drivenData.clipart_folder_info[0].folder_name);
      await productPage.page.waitForTimeout(3 * 1000);

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: productPage.xpathClipartEditor,
        snapshotName: drivenData.picture[0].clipart_editor_edit_name,
        sizeCheck: true,
      });
    });

    await test.step("View product ngoài SF", async () => {
      await clipartSFPage.viewProductAgain(productInfo.title);
      await clipartSFPage.page.waitForSelector(printBasePage.xpathListCO, { timeout: 60000 });

      for (let i = 0; i < customOptionSFEditName.length; i++) {
        await clipartSFPage.inputCustomOptionSF(customOptionSFEditName[i]);
        if (drivenData.case_id === "SB_PRO_SBP_ICFP_4") {
          await clipartSFPage.waitForCLipartImagesLoaded();
        }
        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: printBasePage.xpathListCO,
          snapshotName: drivenData.picture[i].picture_choice_edit_image,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
    });

    await test.step("Vào PrintHub >> Library >> Clipart : /admin/apps/print-hub/clipart- Xóa Folder 1 > View product ngoài SF", async () => {
      await printhubPage.goto(printhubPage.urlClipartPage);
      await productPage.deleteClipartFolder(clipartFolderInfo[0].folder_name);
      await clipartSFPage.viewProductAgain(productInfo.title);
      await clipartSFPage.page.waitForSelector(printBasePage.xpathListCO, { timeout: 60000 });

      for (let i = 0; i < customOptionDeleteFolder.length; i++) {
        await clipartSFPage.inputCustomOptionSF(customOptionDeleteFolder[i]);
        if (drivenData.case_id === "SB_PRO_SBP_ICFP_4") {
          await clipartSFPage.waitForCLipartImagesLoaded();
        }
        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: printBasePage.xpathListCO,
          snapshotName: drivenData.picture[i].picture_choice_delete_folder,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
    });

    await test.step("Tại product page ngoài SF- Chọn Folder 2 -> Image 4- Add product vào cart", async () => {
      await clipartSFPage.addToCart();
      await clipartSFPage.waitForElementVisibleThenInvisible(clipartSFPage.xpathIconLoadImage);
      await clipartSFPage.page.waitForTimeout(2 * 1000);
      await snapshotFixture.verify({
        page: clipartSFPage.page,
        selector: clipartSFPage.xpathLastProductInCart,
        snapshotName: drivenData.picture[0].product_image_in_cart,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });
}
