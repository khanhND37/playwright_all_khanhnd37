import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";
import { test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintHubPage } from "@pages/apps/printhub";
import { Personalize } from "@pages/dashboard/personalize";
import { SFProduct } from "@pages/storefront/product";
import { waitForImageLoaded } from "@utils/theme";

let printhubPage: PrintHubPage;
let clipartSFPage: SFProduct;
let personalizePage: Personalize;

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
  const conditionalLogicInfo = drivenData.conditional_logic_info;
  const customOptionSF = drivenData.custom_option_SF;
  const picture = drivenData.picture;

  test(`@${drivenData.case_id} ${drivenData.description}`, async ({ dashboard, conf, context, snapshotFixture }) => {
    test.setTimeout(conf.suiteConf.timeout);
    printhubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
    personalizePage = new Personalize(dashboard, conf.suiteConf.domain);

    await test.step("Create clipart folder with 2 images", async () => {
      await printhubPage.goto(printhubPage.urlClipartPage);
      for (let i = 0; i < clipartFolderInfo.length; i++) {
        await personalizePage.deleteClipartFolder(clipartFolderInfo[i].folder_name);
        await personalizePage.clickOnBtnWithLabel("Create folder");
        await personalizePage.addNewClipartFolder(clipartFolderInfo[i]);
        await personalizePage.clickOnBtnWithLabel("Save changes", 1);
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
        await personalizePage.clickElementWithLabel("span", "Clipart folders");
        await personalizePage.waitBtnEnable("Create folder");
      }
    });

    await test.step("Tạo mới product - Click vào btn 'Create custom option only'- Input các giá trị vào các trường trong custom option detail- Click button Save Changes", async () => {
      await personalizePage.goToProductList();
      await personalizePage.searchProdByName(productInfo.title);
      await personalizePage.deleteProduct(conf.suiteConf.password);
      await personalizePage.addNewProductWithData(productInfo);
      await personalizePage.clickBtnCustomOptionOnly();
      for (let i = 0; i < customOptionInfo.length; i++) {
        await personalizePage.addNewCustomOptionWithData(customOptionInfo[i]);
      }
    });

    await test.step("Click vào icon Add conditional logic của custom option Picture choice- Add conditional logic cho custom option Picture choice với is euqal to, sau đó click vào btn Save", async () => {
      await personalizePage.clickAddConditionalLogic(conditionalLogicInfo);
      await personalizePage.addConditionalLogicSB(conditionalLogicInfo);

      await snapshotFixture.verify({
        page: dashboard,
        selector: personalizePage.xpathPopupConditionalLogic,
        snapshotName: picture.conditional_logic_detail,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });

      await personalizePage.clickOnBtnWithLabel("Save", 1);
      await personalizePage.clickOnBtnWithLabel("Save changes");
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
      await personalizePage.removeBlockTitleDescription();

      for (let i = 0; i < customOptionInfo.length; i++) {
        await personalizePage.closeCustomOption(customOptionInfo[i]);
      }
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: personalizePage.xpathCustomOptionList(),
        snapshotName: picture.custom_option_detail,
        sizeCheck: true,
      });
    });

    await test.step("View product ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.clickViewProductSF()]);
      clipartSFPage = new SFProduct(SFPage, conf.suiteConf.domain);
      await clipartSFPage.waitResponseWithUrl("/assets/landing.css", 120000);
      await clipartSFPage.page.waitForSelector(personalizePage.xpathListCO, { timeout: 20000 });
      if (drivenData.case_id == "SB_PRO_SBP_ICFP_7") {
        await clipartSFPage.waitForCLipartImagesLoaded();
      }
      await snapshotFixture.verify({
        page: clipartSFPage.page,
        selector: personalizePage.xpathListCO,
        snapshotName: picture.custom_option_SF,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Tại product page ngoài SF- Chọn  Image 1- Input text field- Add product vào cart", async () => {
      for (let i = 1; i <= customOptionSF.length; i++) {
        await clipartSFPage.inputCustomOptionSF(customOptionSF[i - 1]);
        if (drivenData.case_id == "SB_PRO_SBP_ICFP_7") {
          await clipartSFPage.waitForCLipartImagesLoaded();
        }
        await snapshotFixture.verify({
          page: clipartSFPage.page,
          selector: personalizePage.xpathListCO,
          snapshotName: i + picture.custom_option_SF,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }

      await clipartSFPage.addToCart();
      await clipartSFPage.waitUntilElementInvisible(clipartSFPage.xpathIconLoadImage);
      await waitForImageLoaded(clipartSFPage.page, clipartSFPage.xpathLastProductInCart);
      await snapshotFixture.verify({
        page: clipartSFPage.page,
        selector: clipartSFPage.xpathLastProductInCart,
        snapshotName: picture.product_info_in_cart,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });
}
