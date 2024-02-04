import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintHubPage } from "@pages/apps/printhub";
import { Personalize } from "@pages/dashboard/personalize";

test.describe("Check add new product với với folder khi chọn Show with Thumbnail images/Show with Droplist ", async () => {
  let printHubPage: PrintHubPage;
  let personalizePage: Personalize;

  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const prefix = conf.suiteConf.prefix_snapshot;
    const dataDriven = conf.caseConf.data[i];
    test(`@${dataDriven.case_id} ${dataDriven.description}`, async ({ dashboard, conf, snapshotFixture }) => {
      test.setTimeout(conf.suiteConf.timeout);
      for (let j = 0; j < dataDriven.case_driven.length; j++) {
        const caseDriven = dataDriven.case_driven[j];
        const clipartFolderInfo = caseDriven.clipart_folder_info;
        const productInfo = caseDriven.product_all_info;
        const customOptionInfo = caseDriven.custom_option_info;
        const imagePreview = caseDriven.image_preview;
        const layerList = caseDriven.layer;
        const buttonClickOpenEditor = caseDriven.button_click_open_editor;
        const conditionalLogicInfo = caseDriven.conditional_logic_info;
        const duplicateName = caseDriven.duplicate_name;
        const duplicateNameLogic = caseDriven.duplicate_name_logic;
        const picture = caseDriven.picture;

        printHubPage = new PrintHubPage(dashboard, conf.suiteConf.domain);
        personalizePage = new Personalize(dashboard, conf.suiteConf.domain);

        // Precondition:  Tạo folder clipart ở màn Clipart- Printhub
        await test.step("Precondition: Tạo folder clipart ở màn Clipart- Printhub", async () => {
          await printHubPage.goto(printHubPage.urlClipartPage);
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

        await test.step("Click vào btn 'Create custom option only' - Input các giá trị vào các trường trong custom option detail - Click button Save Changes", async () => {
          await personalizePage.goToProductList();
          await personalizePage.searchProdByName(productInfo.title);
          await personalizePage.deleteProduct(conf.suiteConf.password);
          await personalizePage.addProductAndAddConditionLogicCO(
            productInfo,
            imagePreview,
            layerList,
            customOptionInfo,
            conditionalLogicInfo,
            buttonClickOpenEditor,
          );

          if (dataDriven.case_id != "SB_PRO_SBP_ICFP_13") {
            await snapshotFixture.verifyWithAutoRetry({
              page: dashboard,
              selector: personalizePage.xpathPreviewPage,
              snapshotName: `${prefix} - ${picture.preview_page}`,
              sizeCheck: true,
            });

            if (dataDriven.case_id == "SB_PRO_SBP_ICFP_16") {
              await personalizePage.clickOnBtnWithLabel("Next, create Print file");
              await personalizePage.waitUntilElementVisible(personalizePage.xpathPreviewPage);
              await personalizePage.uploadImagePreviewOrPrintfile(caseDriven.image_print_file);
              await personalizePage.waitBtnDeleteVisible();
              await snapshotFixture.verifyWithAutoRetry({
                page: dashboard,
                selector: personalizePage.xpathPreviewPage,
                snapshotName: `${prefix} - ${picture.print_file_page}`,
                sizeCheck: true,
              });
              await personalizePage.clickOnBtnWithLabel("Save");
              await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
            }
            await personalizePage.clickOnBtnWithLabel("Cancel");
          }
        });

        await test.step("Click button Duplicate- Nhập Provide a name for your new product- Check checkbox Duplicate product medias- Click button Duplicate- Kiểm tra Custom options Picture choice", async () => {
          await personalizePage.waitUntilElementInvisible(personalizePage.xpathProductDetailLoading);
          await personalizePage.clickElementWithLabel("span", "Duplicate");
          await personalizePage.duplicateProduct(true, duplicateName);
          await personalizePage.waitUntilElementVisible(personalizePage.xpathTitleProductDetail);
          await expect(dashboard.locator(personalizePage.xpathTitleProductDetail)).toHaveText(duplicateName);
          await personalizePage.removeBlockTitleDescription();
          await personalizePage.waitImagesLoaded(personalizePage.xpathMedia);

          for (let i = 0; i < customOptionInfo.length; i++) {
            await personalizePage.closeCustomOption(customOptionInfo[i]);
          }
          await dashboard.hover(personalizePage.xpathSectionCustomOption);
          await snapshotFixture.verifyWithAutoRetry({
            page: dashboard,
            selector: personalizePage.xpathSectionCustomOption,
            snapshotName: picture.custom_option_detail,
            sizeCheck: true,
          });
        });

        await test.step(`- Tại product detail : Product duplicate folder clipart- Click vào icon Add conditional logic của custom option Picture choice- Add conditional logic cho custom option Picture choice với is euqal to, sau đó click vào btn Save`, async () => {
          await personalizePage.clickAddConditionalLogic(conditionalLogicInfo);
          await personalizePage.addConditionalLogicSB(conditionalLogicInfo);
          await personalizePage.clickOnBtnWithLabel("Save", 1);
          await personalizePage.clickOnBtnWithLabel("Save changes");
          await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);

          await snapshotFixture.verifyWithAutoRetry({
            page: dashboard,
            selector: personalizePage.xpathSectionCustomOption,
            snapshotName: picture.conditional_logic,
            sizeCheck: true,
          });
        });

        await test.step("- Click button Duplicate- Nhập Provide a name for your new product- Check checkbox Duplicate product medias- Click button Duplicate- Kiểm tra Custom options Picture choice", async () => {
          await personalizePage.clickElementWithLabel("span", "Duplicate");
          await personalizePage.duplicateProduct(true, duplicateNameLogic);
          await personalizePage.waitUntilElementVisible(personalizePage.xpathTitleProductDetail);
          await expect(dashboard.locator(personalizePage.xpathTitleProductDetail)).toHaveText(duplicateNameLogic);
          await personalizePage.removeBlockTitleDescription();
          await personalizePage.waitImagesLoaded(personalizePage.xpathMedia);
          for (let i = 0; i < customOptionInfo.length; i++) {
            await personalizePage.closeCustomOption(customOptionInfo[i]);
          }
          await dashboard.hover(personalizePage.xpathSectionCustomOption);
          await snapshotFixture.verifyWithAutoRetry({
            page: dashboard,
            selector: personalizePage.xpathSectionCustomOption,
            snapshotName: picture.conditional_logic_duplicate,
            sizeCheck: true,
          });
        });
      }
    });
  }
});
