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
      const group = caseData.group;
      const customize = caseData.customize;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const removeGroup = caseData.remove_group;
      const listGroup = caseData.list_group;

      await test.step("1. Tạo mới một product", async () => {
        await productPage.navigateToMenu("Products");
        await productPage.searchProdByName(productInfo.title);
        await productPage.deleteProduct(conf.suiteConf.password);
        await productPage.addNewProductWithData(productInfo);
      });

      await test.step(
        "2. Click btn Create Preview image >" + " Upload mockup preview > Add layer cho preview image",
        async () => {
          await productPage.clickOnBtnWithLabel("Create Preview image");
          await dashboard.setInputFiles(
            personalize.xpathBtnUploadMockup("Upload your Preview image"),
            `./data/shopbase/${caseData.image_preview}`,
          );
          for (let i = 0; i < layerList.length; i++) {
            await productPage.addLayer(layerList[i]);
          }
          await personalize.clickBtnExpand();
        },
      );

      for (let i = 0; i < group.length; i++) {
        await test.step("Tạo group layer > Add layer vào group", async () => {
          const groupData = group[i];
          for (let j = 0; j < groupData.length; j++) {
            await productPage.createGroupLayer(groupData[j].current_group, groupData[j].new_group);
            await productPage.addLayerToGroup(groupData[j].layer_name, groupData[j].new_group);
          }
          await expect(await dashboard.locator(productPage.xpathBtnWithLabel("Customize group", 1))).toBeEnabled();
        });
        if (caseData.case_id === "SB_PRB_CG_223" && i === 1) {
          await dashboard.click(personalize.xpathCustomOptionName(customize[0].label_group));
          await dashboard.click(personalize.xpathAddOptionGroup);
          const groups = listGroup.split(",").map(item => item.trim());
          for (let i = 0; i < groups.length; i++) {
            await expect(
              personalize.page.locator(personalize.getXpathGroupInCustomizeGroupDetail(groups[i])),
            ).toBeVisible();
          }
        } else {
          await test.step("Tạo customize group", async () => {
            await productPage.setupCustomizeGroup(customize[i]);
            await expect(await dashboard.locator(productPage.xpathBtnWithLabel("Customize group", 1))).toBeDisabled();
          });
          if (caseData.case_id === "SB_PRB_CG_224") {
            await dashboard.click(personalize.xpathCustomOptionName(customize[i].label_group));
            await personalize.removeGroup(removeGroup);
            const groups = listGroup.split(",").map(item => item.trim());
            for (let i = 0; i < groups.length; i++) {
              await expect(
                personalize.page.locator(personalize.getXpathGroupInCustomizeGroupDetail(groups[i])),
              ).toBeVisible();
            }
          }
        }
      }

      await test.step("Click btn Next, create Print file > Upload ảnh print file", async () => {
        await dashboard.waitForTimeout(2000);
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
        await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
        await productSF.page.waitForTimeout(5000);
        if (caseData.case_id === "SB_PRB_CG_223" || caseData.case_id === "SB_PRB_CG_224") {
          const listGroups = listGroup.split(",").map(item => item.trim());
          for (let i = 0; i < listGroups.length; i++) {
            await expect(productSF.page.locator(productSF.getValueRadioOnSF(listGroups[i]))).toBeVisible();
          }
        } else {
          for (let i = 0; i < customOptionInfo.length; i++) {
            await productSF.inputCustomOptionSF(customOptionInfo[i]);
          }
          await productSF.clickOnBtnPreviewSF();
          await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
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
        }
      });
    });
  }

  test("SB_PRB_CG_222 - [SBase] Tạo customize group cho product có sẵn trong shop @SB_PRB_CG_222", async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const personalize = new Personalize(dashboard, conf.suiteConf.domain);
    const groupList = conf.caseConf.group;
    const customizeGroup = conf.caseConf.customize_group;
    const threshold = conf.suiteConf.threshold;
    const picture = conf.caseConf.picture;
    const customOptionInfo = conf.caseConf.custom_option_info;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;

    await test.step("Search product sau đó đi tới mán Edit preview image", async () => {
      await productPage.navigateToMenu("Products");
      await productPage.searchProdByName(conf.caseConf.product_name);
      await productPage.chooseProduct(conf.caseConf.product_name);
      await dashboard.hover(personalize.xpathImagePersonalize("Preview Images"));
      await dashboard.click(personalize.xpathIconPersonalize("Preview Images", 2));
      await dashboard.click(productPage.xpathIconExpand);
      await expect(await dashboard.locator(productPage.xpathBtnWithLabel("Customize group", 1))).toBeDisabled();
    });

    await test.step("Tạo group layer > Add layer vào từng group", async () => {
      for (let i = 0; i < groupList.length; i++) {
        await productPage.createGroupLayer(groupList[i].current_group, groupList[i].new_group);
        await productPage.addLayerToGroup(groupList[i].layer_name, groupList[i].new_group);
      }
      await expect(await dashboard.locator(productPage.xpathBtnWithLabel("Customize group", 1))).toBeEnabled();
    });

    await test.step("Tạo customize group", async () => {
      await productPage.setupCustomizeGroup(customizeGroup);
      await expect(await dashboard.locator(productPage.xpathBtnWithLabel("Customize group", 1))).toBeDisabled();
      await productPage.clickOnBtnWithLabel("Save", 1);
    });

    await test.step("Click btn Update Print file > Verify sync customize group", async () => {
      await productPage.clickOnBtnWithLabel("Update Print file", 1);
      await dashboard.click(productPage.xpathIconExpand);
      await snapshotFixture.verify({
        page: dashboard,
        selector: personalize.xpathCustomOption,
        snapshotName: picture.picture_dashboard,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("View product ngoài SF > Verify hiển thị customize group", async () => {
      await productPage.clickOnBtnWithLabel("Save");
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
      const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.waitForImagesMockupLoaded();
      for (let i = 0; i < customOptionInfo.length; i++) {
        await productSF.inputCustomOptionSF(customOptionInfo[i]);
      }
      await productSF.clickOnBtnPreviewSF();
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoadImage);
      await snapshotFixture.verify({
        page: productSF.page,
        selector: productSF.xpathPopupLivePreview(1),
        snapshotName: picture.picture_sf,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });
});
