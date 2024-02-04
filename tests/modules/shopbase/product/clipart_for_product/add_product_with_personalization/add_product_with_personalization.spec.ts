import { test } from "@core/fixtures";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";
import { snapshotDir, waitForImageLoaded } from "@core/utils/theme";
import { PrintHubPage } from "@pages/apps/printhub";
import { SFProduct } from "@pages/storefront/product";
import { Personalize } from "@pages/dashboard/personalize";

test.describe("Add product with Print file/Preview image with folder clipart/group clipart", async () => {
  let printHubPage: PrintHubPage;
  let clipartSFPage: SFProduct;
  let personalizePage: Personalize;

  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const clipartData = conf.caseConf.data[i];
    const clipartFolderInfo = clipartData.clipart_folder_info;
    const productInfo = clipartData.product_all_info;
    const imageMockup = clipartData.image_preview;
    const layerList = clipartData.layer;
    const customOptionInfo = clipartData.custom_option_info;
    const customOptionSF = clipartData.custom_option_SF;
    const buttonClickOpenEditor = clipartData.button_click_open_editor;
    const picture = clipartData.picture;

    test(`@${clipartData.case_id} ${clipartData.description}`, async ({
      dashboard,
      conf,
      context,
      snapshotFixture,
    }) => {
      test.setTimeout(conf.suiteConf.timeout);
      printHubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
      personalizePage = new Personalize(dashboard, conf.suiteConf.domain);

      // Pre condition: Create folder clipart in Printhub
      await test.step("Pre condition: Create folder clipart in Printhub", async () => {
        await printHubPage.goto(printHubPage.urlClipartPage);
        for (let i = 0; i < clipartFolderInfo.length; i++) {
          await personalizePage.deleteClipartFolder(clipartFolderInfo[i].folder_name);
          await personalizePage.clickOnBtnLinkWithLabel("Create folder", 1);
          await personalizePage.addNewClipartFolder(clipartFolderInfo[i]);
          await personalizePage.clickOnBtnWithLabel("Save changes", 1);
          await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
          await personalizePage.clickElementWithLabel("span", "Clipart folders");
          await personalizePage.waitBtnEnable("Create folder");
        }
      });

      await test.step("Click button Create Preview Image > Upload Preview image > Upload layer Image > Add Custom Option > Click Save", async () => {
        await personalizePage.goToProductList();
        await personalizePage.searchProdByName(productInfo.title);
        await personalizePage.deleteProduct(conf.suiteConf.password);
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(
          productInfo,
          imageMockup,
          buttonClickOpenEditor,
        );
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
        await personalizePage.addLayer(layerList);
        await personalizePage.page.click(personalizePage.xpathIconExpand);
        await personalizePage.clickOnBtnWithLabel("Customize layer", 1);
        await personalizePage.addListCustomOptionOnEditor(customOptionInfo);
        await personalizePage.clickOnBtnWithLabel("Save");
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: personalizePage.xpathPreviewPage,
          snapshotName: picture.preview_editor,
          sizeCheck: true,
        });
      });

      await test.step("Back về màn product detail > Verify Preview Image và CO đã tạo", async () => {
        await personalizePage.clickOnBtnWithLabel("Cancel");
        await personalizePage.page.reload();
        await personalizePage.page.waitForLoadState("domcontentloaded");
        await personalizePage.removeBlockTitleDescription();
        await personalizePage.closeCustomOption(customOptionInfo[0]);
        await personalizePage.waitImagesLoaded(personalizePage.xpathMedia);
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: personalizePage.xpathSectionCustomOption,
          snapshotName: picture.personalization_product_detail,
          sizeCheck: true,
        });
      });

      await test.step("View product ngoài SF", async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.clickViewProductSF()]);
        clipartSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
        await clipartSFPage.page.waitForLoadState("domcontentloaded");
        await clipartSFPage.page.waitForSelector(personalizePage.xpathListCO, { timeout: 20000 });

        if (clipartData.case_id == "SB_PRO_SBP_ICFP_9" || clipartData.case_id == "SB_PRO_SBP_ICFP_11") {
          await clipartSFPage.waitForCLipartImagesLoaded();
        }

        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: personalizePage.xpathListCO,
          snapshotName: picture.picture_choice_sf,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("Chọn Folder 1 > Image 1 > Click button Preview your design", async () => {
        for (let i = 1; i <= customOptionSF.length; i++) {
          await clipartSFPage.inputCustomOptionSF(customOptionSF[i - 1]);

          await snapshotFixture.verify({
            page: clipartSFPage.page,
            selector: personalizePage.xpathListCO,
            snapshotName: i + picture.picture_choice_sf,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }

        if (clipartData.case_id == "SB_PRO_SBP_ICFP_9" || clipartData.case_id == "SB_PRO_SBP_ICFP_10") {
          await clipartSFPage.clickOnBtnPreviewSF();
          await clipartSFPage.waitForElementVisibleThenInvisible(clipartSFPage.xpathIconLoadImage);
          await snapshotFixture.verify({
            page: clipartSFPage.page,
            selector: personalizePage.xpathImagePreviewSF(),
            snapshotName: picture.preview_image_SF,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
          await clipartSFPage.page.click(clipartSFPage.xpathBtbClose);
        }
      });

      await test.step("Add product vào cart", async () => {
        await clipartSFPage.addToCart();
        await clipartSFPage.waitForElementVisibleThenInvisible(clipartSFPage.xpathIconLoadImage);
        await waitForImageLoaded(clipartSFPage.page, clipartSFPage.xpathLastProductInCart);
        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: clipartSFPage.xpathProductsIncart,
          snapshotName: picture.product_image_in_cart,
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
