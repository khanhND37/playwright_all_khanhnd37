import { expect, test } from "@core/fixtures";
import { SFProduct } from "@sf_pages/product";
import { ProductPage } from "@pages/dashboard/products";
import { loadData } from "@core/conf/conf";
import { Personalize } from "@pages/dashboard/personalize";

test.describe("Setup nhiều customize group for sbase no CO", () => {
  const conf = loadData(__dirname, "DATA_DRIVEN");

  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, snapshotFixture, context }) => {
      test.setTimeout(conf.suiteConf.timeout);
      const productInfo = caseData.product_info;
      const layerList = caseData.layers;
      const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
      const personalize = new Personalize(dashboard, conf.suiteConf.domain);
      const customOptionInfo = caseData.custom_option_info;
      const picture = caseData.picture;
      const threshold = conf.suiteConf.threshold;
      const customOptions = caseData.custom_options;
      const group = caseData.group;
      const customize = caseData.customize;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const conditionalLogicInfo = caseData.conditional_logic_info;

      await test.step("Tạo mới một product", async () => {
        await productPage.navigateToMenu("Products");
        await productPage.searchProdByName(productInfo.title);
        await productPage.deleteProduct(conf.suiteConf.password);
        await productPage.addNewProductWithData(productInfo);
      });

      await test.step(
        "Click btn Create Preview image >" + " Upload mockup preview > Add layer cho preview image",
        async () => {
          await productPage.clickOnBtnWithLabel("Create Preview image");
          await dashboard.setInputFiles(
            personalize.xpathBtnUploadMockup("Upload your Preview image"),
            `./data/shopbase/${caseData.image_preview}`,
          );
          for (let i = 0; i < layerList.length; i++) {
            await productPage.addLayer(layerList[i]);
          }
        },
      );

      await test.step("Add custom option cho layer", async () => {
        await dashboard.click(productPage.xpathIconExpand);
        await productPage.clickOnBtnWithLabel("Customize layer", 1);
        for (let i = 0; i < customOptions.length; i++) {
          await productPage.addCustomOptionOnEditor(customOptions[i]);
        }
      });

      for (let i = 0; i < group.length; i++) {
        await test.step("Tạo group layer > Add layer vào group", async () => {
          const groupData = group[i];
          for (let j = 0; j < groupData.length; j++) {
            await productPage.createGroupLayer(groupData[j].current_group, groupData[j].new_group);
            await productPage.addLayerToGroup(groupData[j].layer_name, groupData[j].new_group);
          }
          await expect(await dashboard.locator(productPage.xpathBtnWithLabel("Customize group", 1))).toBeEnabled();
        });

        await test.step("Tạo customize group", async () => {
          await productPage.setupCustomizeGroup(customize[i]);
          await expect(await dashboard.locator(productPage.xpathBtnWithLabel("Customize group", 1))).toBeDisabled();
        });
      }

      if (
        caseData.case_id === "SB_PRB_CG_268" ||
        caseData.case_id === "SB_PRB_CG_269" ||
        caseData.case_id === "SB_PRB_CG_270" ||
        caseData.case_id === "SB_PRB_CG_271" ||
        caseData.case_id === "SB_PRB_CG_272" ||
        caseData.case_id === "SB_PRB_CG_273"
      ) {
        await test.step("Add conditional logic", async () => {
          for (let i = 0; i < conditionalLogicInfo.length; i++) {
            await personalize.clickIconAddConditionLogic(conditionalLogicInfo[i]);
            await personalize.addConditionalLogic(conditionalLogicInfo[i]);
            await dashboard.click(personalize.xpathIconBack);
          }
        });
      }

      await test.step("Click btn Next, create Print file > Upload ảnh print file", async () => {
        await productPage.clickOnBtnWithLabel("Next, create Print file", 1);
        await dashboard.setInputFiles(
          personalize.xpathBtnUploadMockup("Upload your Print template"),
          `./data/shopbase/${caseData.image_printfile}`,
        );
      });

      await test.step("Click vào btn Save > View product ngoài SF > Verify hiển thị customize group", async () => {
        await productPage.clickOnBtnWithLabel("Save");
        await productPage.clickOnBtnWithLabel("Cancel");
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
        const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await productSF.waitForImagesMockupLoaded();
        await productSF.waitForCLipartImagesLoaded();
        for (let i = 0; i < customOptionInfo.length; i++) {
          await productSF.inputCustomOptionSF(customOptionInfo[i]);
        }
        await productSF.clickOnBtnPreviewSF();
        await productSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
        await snapshotFixture.verify({
          page: productSF.page,
          selector: productSF.xpathPopupLivePreview(1),
          snapshotName: picture,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }
});
