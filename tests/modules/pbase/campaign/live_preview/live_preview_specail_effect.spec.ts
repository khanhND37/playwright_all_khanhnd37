import { test } from "@fixtures/theme";
import { snapshotDir } from "@utils/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";

import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";
import { expect } from "@core/fixtures";
import { Campaign } from "@sf_pages/campaign";
import { SFHome } from "@sf_pages/homepage";

test.describe("Live preview campaigns", () => {
  let printbasePage: PrintBasePage;
  let productSFPage: Campaign;
  let homePage: SFHome;
  let newCampaignId;
  const caseName = "LAUNCH_CAMP";
  const suitConfLoad = loadData(__dirname, caseName);
  const caseEdits = "DATA_CAMP_EDIT_DUPLICATE";
  const suitConfEdit = loadData(__dirname, caseEdits);

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    productSFPage = new Campaign(printbasePage.page, conf.suiteConf.domain);
    test.setTimeout(conf.suiteConf.time_out);
  });

  test("@TC_PB_PRB_LPSE_58 Check sync layer text có hiệu ứng Stroke/Curve", async ({ conf, snapshotFixture }) => {
    await test.step(
      "1. - Tại Left menu, click Catalog >>Click tab 'Apparel' >>Chọn base 'Unisex Tank'>>Click button 'Create new campaign'" +
        "2. Click button 'Add text' -> tại 'Text layer 1'-> input data, tại EFFECTS -> click + tại Stroke và input data3. Click vào button 'Add more product'+" +
        "tạo left menu >> Add thêm base Unisex Tshirt",
      async () => {
        const baseProductMore = conf.caseConf.product_more;
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.addBaseProducts(conf.caseConf.product_infos);
        await printbasePage.clickOnBtnWithLabel("Create new campaign");
        await printbasePage.addNewLayers(conf.caseConf.layers);
        await printbasePage.waitForElementVisibleThenInvisible(productSFPage.xpathImageLoad);
        await printbasePage.page.locator(printbasePage.xpathAddMoreBase).click();
        await printbasePage.page.waitForSelector(printbasePage.xpathTitlePopupMoreProduct);
        await printbasePage.addBaseProducts(baseProductMore);
        await printbasePage.clickOnBtnWithLabel("Update campaign");
        await expect(printbasePage.isDBPageDisplay("Add more products")).toBeTruthy();
        for (const baseProduct of baseProductMore) {
          await printbasePage.page.waitForSelector(printbasePage.xpathBaseActive(baseProduct.base_product));
        }
        await printbasePage.waitForElementVisibleThenInvisible(productSFPage.xpathImageLoad);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathImageSync);
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathImageEditActive,
          snapshotName: conf.caseConf.picture.image_editor_active,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      },
    );
  });

  suitConfLoad.caseConf.data.forEach(testCase => {
    test(`${testCase.title} @${testCase.case_id}`, async ({ conf, snapshotFixture }) => {
      const title = testCase.data_test.pricing_info.title;
      const variantProducts = testCase.data_test.variantProducts;
      const campaignsInfos = testCase.data_test;

      await test.step(
        "1. - Tại Left menu, click Catalog >>Click tab 1'Apparel' >>Chọn base Unisex Tank, Unisex Tshirt >>Click button" +
          "Create new campaign 2. Click button 'Add text' -> tại 'Text layer 1" +
          "-> input data, tại EFFECTS -> click + tại Stroke và input data3.",
        async () => {
          await printbasePage.navigateToMenu("Catalog");
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
          const campaignId = await printbasePage.launchCamp(campaignsInfos);
          expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
          const isAvailable = await printbasePage.checkCampaignStatus(
            campaignId,
            ["available", "available with basic images"],
            30 * 60 * 1000,
          );
          expect(isAvailable).toBeTruthy();
        },
      );

      await test.step("Verify camp ngoài storefront", async () => {
        homePage = new SFHome(printbasePage.page, conf.suiteConf.domain);
        await homePage.gotoHomePage();
        await homePage.searchThenViewProduct(title);
        productSFPage = new Campaign(homePage.page, conf.suiteConf.domain);
        for (let i = 0; i < variantProducts.length; i++) {
          const variantProduct = variantProducts[i];
          await productSFPage.selectValueProduct(variantProduct.variant, false, false, i + 1);
          await productSFPage.waitForElementVisibleThenInvisible(productSFPage.xpathImageLoad);
          await productSFPage.waitUntilElementVisible(productSFPage.xpathProductMockupSlide);
          for (let j = variantProduct.mockup_start; j <= variantProduct.mockup_end; j++) {
            const xpathProductMockup = productSFPage.getXpathImageMockup(j);
            const xpathImageLoading = productSFPage.getXpathImageMockupLoading(j);
            await productSFPage.page.waitForSelector(xpathImageLoading);
            await snapshotFixture.verify({
              page: productSFPage.page,
              selector: `${xpathProductMockup}`,
              snapshotName: `${testCase.picture.image_mockup_step_1}-${j}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        }
      });

      await test.step("Chuyển qua lại các base", async () => {
        for (let i = variantProducts.length - 1; i >= 0; i--) {
          const variantProduct = variantProducts[i];
          await productSFPage.selectValueProduct(variantProduct.variant, false, false, i + 1);
          await productSFPage.waitForElementVisibleThenInvisible(productSFPage.xpathImageLoad);
          await productSFPage.waitUntilElementVisible(productSFPage.xpathProductMockupSlide);
          for (let j = variantProduct.mockup_start; j <= variantProduct.mockup_end; j++) {
            const xpathProductMockup = productSFPage.getXpathImageMockup(j);
            const xpathImageLoading = productSFPage.getXpathImageMockupLoading(j);
            await productSFPage.page.waitForSelector(xpathImageLoading);
            await snapshotFixture.verify({
              page: productSFPage.page,
              selector: `${xpathProductMockup}`,
              snapshotName: `${testCase.picture.image_mockup_step_2}-${j}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        }
      });
    });
  });

  test("@TC_PB_PRB_LPSE_64 Check launch camp có group layer text có cả  hiệu ứng Stroke và Curve", async ({
    conf,
    snapshotFixture,
  }) => {
    await test.step(
      "1. - Tại Left menu, click Catalog >>Click tab 'Apparel' >>Chọn base Unisex Tank, Unisex Tshirt >>Click button 'Create new campaign'" +
        "2. Click button 'Add text'  tại 'Text layer 1'-> input data, tại EFFECTS -> click + tại Stroke và input data, Curve và input data, 3. Click button 'Add text'" +
        "tại 'Text layer 2'-> input data, tại EFFECTS -> click + tại Stroke và input data, Curve và input data, 4. Click 'Add group layer'>> click icon 3 chấm ở 'Text layer 1'>>" +
        "Click Add to 'New group 1' 4. Click 'Add group layer'>> click icon 3 chấm ở 'Text layer 2'>>Click Add to 'New group 2'",
      async () => {
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
        const campaignId = await printbasePage.launchCamp(conf.caseConf.data_test);
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      },
    );

    await test.step(" 5. Launch camp thành công. Mở camp ngoài storefront", async () => {
      homePage = new SFHome(printbasePage.page, conf.suiteConf.domain);
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(conf.caseConf.data_test.pricing_info.title);
      productSFPage = new Campaign(homePage.page, conf.suiteConf.domain);
      await productSFPage.waitForElementVisibleThenInvisible(productSFPage.xpathImageLoad);
      await productSFPage.waitUntilElementVisible(productSFPage.xpathProductMockupSlide);
      const countImageMockup = await productSFPage.page.locator(productSFPage.xpathProductMockup).count();
      for (let i = 0; i < countImageMockup; i++) {
        const xpathProductMockup = productSFPage.getXpathImageMockup(i + 1);
        const xpathImageLoading = productSFPage.getXpathImageMockupLoading(i + 1);
        await productSFPage.page.waitForSelector(xpathImageLoading);
        await snapshotFixture.verify({
          page: productSFPage.page,
          selector: `${xpathProductMockup}`,
          snapshotName: `${conf.caseConf.picture.image_mockup}-${i + 1}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
    });
  });

  suitConfEdit.caseConf.data.forEach(testCase => {
    test(`${testCase.title} @${testCase.case_id}`, async ({ conf, authRequest, snapshotFixture }) => {
      let title = testCase.data_test.data_add.pricing_info.title;
      const campaignsInfos = testCase.data_test;

      await test.step(
        "1. - Tại Left menu, click Catalog >>Click tab 'Apparel' >>Chọn base Unisex Tank, Unisex Tshirt >>Click button 'Create new campaign'" +
          "2. Click button 'Add text' -> tại 'Text layer 1'-> input data, tại EFFECTS -> click + tại Stroke và input data",
        async () => {
          await printbasePage.navigateToMenu("Campaigns");
          await printbasePage.searchWithKeyword(title);
          await printbasePage.deleteAllCampaign(conf.suiteConf.password);
          await printbasePage.navigateToMenu("Catalog");
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
          const campaignID = await printbasePage.launchCamp(campaignsInfos.data_add);
          expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
          const isAvailable = await printbasePage.checkCampaignStatus(
            campaignID,
            ["available", "available with basic images"],
            30 * 60 * 1000,
          );
          expect(isAvailable).toBeTruthy();
        },
      );

      await test.step("Check edit | duplicate campaign", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.openCampSFFromCampDetail(title);
        await printbasePage.clickOnBtnWithLabel(testCase.actions);
        if (testCase.duplicate) {
          await printbasePage.verifyCheckedThenClick(
            printbasePage.xpathCheckboxKeepArtwork,
            testCase.duplicate.skip_artworks,
          );
          await printbasePage.clickOnBtnWithLabel("Duplicate", 2);
          await printbasePage.page.waitForLoadState("networkidle");
        }

        await printbasePage.waitForElementVisibleThenInvisible(productSFPage.xpathImageLoad);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathImageSync);
        await printbasePage.removeLiveChat();
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathLeftMenuEditor,
          snapshotName: `${testCase.picture.menu_bar_left_editor}`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await printbasePage.clickBtnExpand();
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathRightMenuEditor,
          snapshotName: `${testCase.picture.menu_bar_right_editor}`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        if (campaignsInfos.data_edit) {
          const pricingInfoAfterEdit = campaignsInfos.data_edit.pricing_info;
          title = pricingInfoAfterEdit.title;
          await printbasePage.clickOnBtnWithLabel("Customize layer");
          await printbasePage.addCustomOptions(campaignsInfos.data_edit.custom_options);
          await printbasePage.clickBtnExpand();
          await printbasePage.editCustomOption(campaignsInfos.data_edit.custom_options_edit);
          newCampaignId = printbasePage.getCampaignIdInPricingPage();
          await printbasePage.clickOnBtnWithLabel("Continue");
          await printbasePage.navigateToMenu("Campaigns");
          const isAvailable = await printbasePage.checkCampaignStatus(
            newCampaignId,
            ["available", "available with basic images"],
            16 * 60 * 1000,
          );
          expect(isAvailable).toBeTruthy();
        } else {
          const pricingInfoAfterDuplicate = testCase.duplicate.pricing_info;
          title = pricingInfoAfterDuplicate.title;
          await printbasePage.clickOnBtnWithLabel("Continue");
          await printbasePage.inputPricingInfo(pricingInfoAfterDuplicate);
          await printbasePage.clickOnBtnWithLabel("Launch");
          expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
          const campaignID = await printbasePage.getIDCampaign(authRequest, title, conf.suiteConf.domain);
          const isAvailable = await printbasePage.checkCampaignStatus(
            campaignID,
            ["available", "available with basic images"],
            30 * 60 * 1000,
          );
          expect(isAvailable).toBeTruthy();
        }
      });

      await test.step("Open store front", async () => {
        homePage = new SFHome(printbasePage.page, conf.suiteConf.domain);
        await homePage.gotoHomePage();
        await homePage.searchThenViewProduct(title);
        productSFPage = new Campaign(homePage.page, conf.suiteConf.domain);
        const customOptionInfos = testCase.data_test.custom_option_info;
        for (let i = 0; i < customOptionInfos.length; i++) {
          if (customOptionInfos[i].group_info) {
            await productSFPage.selectGroup(customOptionInfos[i].group_info);
          }
          await productSFPage.limitTimeWaitAttributeChange(productSFPage.xpathImageActive);
          await productSFPage.waitForElementVisibleThenInvisible(productSFPage.xpathImageLoad);
          await snapshotFixture.verify({
            page: productSFPage.page,
            selector: productSFPage.xpathAllCustomOption,
            snapshotName: `${testCase.picture.image_sf}-${i}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }
      });
    });
  });
});

test.describe("Live preview campaigns", async () => {
  let printbasePage: PrintBasePage;
  let campaignSF: Campaign;

  test.beforeEach(async ({ dashboard, conf }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
  });

  const conf = loadData(__dirname, "LIVE_PREVIEW_EFFECT_PB");
  test.setTimeout(conf.suiteConf.time_out);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      camp_customize_group: campCustomizeGroup,
      campaign_infos: campaignsInfos,
      value_variant: valueVariant,
      custom_option_data_SF: customOptionShowSF,
    }) => {
      test(`@${caseId} ${campaignsInfos.pricing_info.title}`, async ({ context, snapshotFixture }) => {
        await test.step(
          "- Tại left menu, click Catalog, chọn base products -> click btn 'Create new campain'" +
            "Tạo preview với CO effect stroke: Tại Design & Personalization page " +
            "-> click button 'Add text' -> tại 'Text layer 1' -> input data, tại EFFECTS -> click + tại Stroke và input data" +
            "-> click button 'Add text' -> tại 'Text layer 2' -> input data, tại EFFECTS -> click + tại Curve và input data 1" +
            "-> click button 'Add text' -> tại 'Text layer 3' -> input data, tại EFFECTS -> click + tại Stroke / Curve và input data" +
            "- Click icon button 'Add group layer' -> add 2 group layer với tên: 'Group 1', 'Group 2' " +
            "-> add 'Text layer 1' vào 'Group 1' , add 'Text layer 2', 'Text layer 3' vào 'Group 2'" +
            "-> tại Custom options -> click button + -> input data ở drawer tương ứng cho từng CO-> click button Save",
          async () => {
            await printbasePage.navigateToMenu("Campaigns");
            await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
            await printbasePage.deleteAllCampaign(conf.suiteConf.password);
            await printbasePage.navigateToMenu("Catalog");
            const campainId = await printbasePage.launchCamp(campaignsInfos);
            const isAvailable = await printbasePage.checkCampaignStatus(
              campainId,
              ["available", "available with basic images"],
              30 * 60 * 1000,
            );
            expect(isAvailable).toBeTruthy();
          },
        );

        await test.step(
          "Đi đến trang SF -> tại field 'Please select the option' -> click dropdown -> chọn custom option -> input  text" +
            "-> click btn 'Preview your design' -> verify image preview",
          async () => {
            const envRun = process.env.ENV;
            await printbasePage.navigateToMenu("Campaigns");
            await printbasePage.openCampaignDetail(campaignsInfos.pricing_info.title);
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
            campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
            for (let i = 0; i < valueVariant.length; i++) {
              await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
              await campaignSF.selectValueProduct(valueVariant[i], false, false, i + 1);
              expect(await campaignSF.getTextContent(campaignSF.getXpathValueVariantChoosen("Style"))).toEqual(
                valueVariant[i].style,
              );
              if (!campCustomizeGroup) {
                await campaignSF.inputCustomAllOptionSF(customOptionShowSF);
                await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
                await campaignSF.clickOnBtnPreviewSF();
                await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
                await snapshotFixture.verify({
                  page: campaignSF.page,
                  selector: campaignSF.xpathPopupLivePreview(),
                  snapshotName: `${caseId}_style${i}_${envRun}.png`,
                  snapshotOptions: {
                    maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                    threshold: conf.suiteConf.param_threshold,
                    maxDiffPixels: conf.suiteConf.max_diff_pixels,
                  },
                });
                await campaignSF.closePreview("Inside");
              } else {
                for (const customOption of customOptionShowSF) {
                  await campaignSF.selectGroup(customOption.name_group);
                  if (customOption.data_input) {
                    await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
                    await campaignSF.inputCustomAllOptionSF(customOption.custom_info);
                  }
                  await campaignSF.clickOnBtnPreviewSF();
                  await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
                  await snapshotFixture.verify({
                    page: campaignSF.page,
                    selector: campaignSF.xpathPopupLivePreview(),
                    snapshotName: `${customOption.picture}_style${i}_${envRun}.png`,
                    snapshotOptions: {
                      maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                      threshold: conf.suiteConf.param_threshold,
                      maxDiffPixels: conf.suiteConf.max_diff_pixels,
                    },
                  });
                  await campaignSF.closePreview("Inside");
                }
              }
            }
          },
        );
      });
    },
  );
});
