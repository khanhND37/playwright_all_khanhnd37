import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintHubPage } from "@pages/apps/printhub";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@pages/storefront/product";
import { Personalize } from "@pages/dashboard/personalize";

let productPage: ProductPage;
let printhubPage: PrintHubPage;
let clipartSFPage: SFProduct;
let printBasePage: PrintBasePage;
let personalizePage: Personalize;

test.describe.configure({ mode: "serial" });
test.beforeEach(async ({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

const conf = loadData(__dirname, "DATA_DRIVEN");
for (let i = 0; i < conf.caseConf.data.length; i++) {
  const drivenData = conf.caseConf.data[i];
  const clipartFolderInfo = drivenData.clipart_folder_info;
  const productInfo = drivenData.product_info;
  const customOptionSF = drivenData.custom_option_SF;
  const picture = drivenData.picture;
  const bulkClipartFolderInfo = drivenData.bulk_clipart_folder;
  const bulkUpdateInfo = drivenData.bulk_update_info;
  const clipartDeleteImage = drivenData.clipart_delete_image;

  test(`@${drivenData.case_id} ${drivenData.description}`, async ({ dashboard, conf, context, snapshotFixture }) => {
    test.setTimeout(conf.suiteConf.timeout);
    printhubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    printBasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    personalizePage = new Personalize(dashboard, conf.suiteConf.domain);

    await test.step(`Precondition: Tạo folder clipart ở Printhub > Tạo mới 1 product ${drivenData.precondition}`, async () => {
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
      await productPage.goToProductList();
      await productPage.searchProdByName(productInfo.title);
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.addNewProductWithData(productInfo);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
    });

    await test.step(`Tạo bulk update có CO cho product ${drivenData.create_bulk}`, async () => {
      await productPage.createBulkUpdate(bulkUpdateInfo);
      await productPage.clickOnBtnWithLabel("Edit");
      if (drivenData.case_id == "SB_PRO_SBP_ICFP_26") {
        await productPage.page.click(productPage.xpathFieldClipartFolder);
        await productPage.clickElementWithLabel("span", "Add a clipart folder");
        await productPage.addNewClipartFolder(bulkClipartFolderInfo, 1);
        await snapshotFixture.verify({
          page: dashboard,
          selector: productPage.xpathClipartEditor,
          snapshotName: picture.clipart_editor,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await productPage.clickOnBtnWithLabel("Save changes", 2);
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
      }

      if (drivenData.case_id == "SB_PRO_SBP_ICFP_22") {
        await productPage.clickOnBtnEditClipartFolder();
        await productPage.deleteImageInClipartFolder(clipartDeleteImage.image);
        await productPage.addNewClipartFolder(bulkClipartFolderInfo, 1);
        await snapshotFixture.verify({
          page: dashboard,
          selector: productPage.xpathClipartEditor,
          snapshotName: picture.clipart_editor,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await productPage.clickOnBtnWithLabel("Save changes", 2);
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
      }

      await productPage.page.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathBulkActions,
        snapshotName: picture.block_bulk_actions,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
        sizeCheck: true,
      });
    });

    await test.step("Verify tooltip", async () => {
      await productPage.getTextOnTooltip(productPage.xpathTooltipClipart, productPage.xpathTooltipHover);
    });

    await test.step("Click link text 'Go to clipart library'", async () => {
      const [ClipartPage] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickElementWithLabel("a", "Go to clipart library"),
      ]);
      await expect(ClipartPage).toHaveURL(new RegExp("/apps/print-hub/clipart$"));
    });

    await test.step(`- Click Preview Bulk Update > Click Start Bulk Update >> Update`, async () => {
      await productPage.clickOnBtnWithLabel("Preview Bulk Update");
      await productPage.startBulkUpdate();
      await productPage.page.waitForLoadState("networkidle");
      await dashboard.reload();
      await productPage.waitBulkUpdateFinish();
      expect(await productPage.getInfoBulkUpdate()).toEqual(drivenData.validate_bulk_update_info);
    });

    await test.step("Mở lại product detail", async () => {
      await productPage.gotoProductDetail(productInfo.title);
      await productPage.closeCustomOption(drivenData.bulk_update_info.custom_option[0]);
      await productPage.removeBlockTitleDescription();
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathCustomOptionList(),
        snapshotName: picture.custom_option_detail,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
        sizeCheck: true,
      });
    });

    await test.step("Check SF của product vừa bulk update", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
      clipartSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await clipartSFPage.page.waitForLoadState("domcontentloaded");
      await clipartSFPage.waitUntilElementVisible(printBasePage.xpathListCO);
      await clipartSFPage.viewProductAgain(productInfo.title);
      await clipartSFPage.waitUntilElementVisible(printBasePage.xpathListCO);

      for (let i = 0; i < customOptionSF.length; i++) {
        await clipartSFPage.inputCustomOptionSF(customOptionSF[i]);
        await clipartSFPage.waitForCLipartImagesLoaded();

        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: printBasePage.xpathListCO,
          snapshotName: i + picture.picture_choice_sf,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
          sizeCheck: true,
        });
      }
    });
  });
}
