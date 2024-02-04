import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { SFProduct } from "@sf_pages/product";
import { roundingTwoDecimalPlaces } from "@utils/string";

test.describe("Create thành công campaign", () => {
  let printBasePage: PrintBasePage;
  let dashboardPage;
  let snapshotOptions;
  let selectMockups;

  test.beforeEach(({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printBasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    snapshotOptions = conf.suiteConf.snapshot_options;
  });

  const addLayersToBaseProduct = async (printBasePage, baseProductName, layers): Promise<void> => {
    await printBasePage.clickBaseProduct(baseProductName);
    await printBasePage.addNewLayers(layers);
    await printBasePage.waitUntilElementVisible(printBasePage.xpathListLayerEditor);
    await printBasePage.page.waitForTimeout(3000);
  };

  const conf = loadData(__dirname, "DATA_DRIVEN_LAUNCH_CAMPAIGN");
  for (const caseData of conf.caseConf.data) {
    if (caseData.enable) {
      test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, conf, context, snapshotFixture }) => {
        const baseProducts = caseData.campaign_info.base_products;
        const pricingInfo = caseData.campaign_info.pricing_info;
        const picture = caseData.picture;
        selectMockups = caseData.campaign_info.select_mockups;
        let campaignId = 0;
        const productBasePricings = [];

        await test.step("Precondition: Search Campaign > Delete campaign", async () => {
          await dashboardPage.navigateToMenu("Campaigns");
          await printBasePage.searchWithKeyword(pricingInfo.title);
          await printBasePage.deleteAllCampaign(conf.suiteConf.password);
        });

        await test.step("Preconditon: Click Online Store > Click button Customize > Chọn Setting > Chọn Product> Chọn Action > Click Save", async () => {
          await dashboardPage.navigateToMenu("Online Store");
          await printBasePage.setingShowImage(caseData.option_setting);
          if (await printBasePage.page.locator(printBasePage.xpathBtnWithLabel("Save")).isEnabled()) {
            await printBasePage.clickOnBtnWithLabel("Save", 1);
            await expect(dashboard.locator(printBasePage.xpathToastMessageEditor(caseData.message))).toBeVisible();
          }
          //Close setting page
          await printBasePage.clickOnBtnWithLabel("Close");
        });

        await test.step("Select Product bases > Click button [Create new campaign]", async () => {
          await dashboardPage.navigateToMenu("Catalog");
          await printBasePage.addBaseProducts(baseProducts);
          await printBasePage.clickOnBtnWithLabel("Create new campaign");
          await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
          await printBasePage.waitUntilElementVisible(printBasePage.xpathImageEditor);
          await printBasePage.removeLiveChat();
          await snapshotFixture.verifyWithAutoRetry({
            page: dashboard,
            snapshotName: picture.list_base,
            sizeCheck: true,
          });
        });

        await test.step("Add layers to Product base", async () => {
          const layerInfo = caseData.campaign_info.layer_info;
          await printBasePage.clickLinkProductEditorCampaign();
          if (layerInfo.base_product_sync && layerInfo.base_product_sync.base_products?.length) {
            await addLayersToBaseProduct(
              printBasePage,
              layerInfo.base_product_sync.base_products[0],
              layerInfo.base_product_sync.layers,
            );
          }
          if (layerInfo.base_product_not_sync && layerInfo.base_product_not_sync) {
            for (const baseProduct of layerInfo.base_product_not_sync) {
              await addLayersToBaseProduct(printBasePage, baseProduct.base_product, baseProduct.layers);
            }
          }
          await snapshotFixture.verifyWithAutoRetry({
            page: dashboard,
            snapshotName: picture.list_layer,
            sizeCheck: true,
          });
        });

        await test.step("Select colors for Product base", async () => {
          await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathIconLoading);
          const colorInfo = caseData.campaign_info.color_info;
          if (colorInfo) {
            for (const color of colorInfo) {
              await printBasePage.clickBaseProduct(color.base_product);
              await printBasePage.page.waitForTimeout(1000);
              await printBasePage.selectColors(color.colors);
            }
            await printBasePage.page.waitForTimeout(2000);
            await snapshotFixture.verifyWithAutoRetry({
              page: dashboard,
              snapshotName: picture.add_color,
              sizeCheck: true,
            });
          }
        });

        await test.step("Select mockup for Product base", async () => {
          if (selectMockups) {
            for (const selectMockup of selectMockups) {
              await printBasePage.clickBaseProduct(selectMockup.base_product);
              await dashboard.click(printBasePage.xpathBtnUpdateMockups);
              if (selectMockup.drag) {
                await printBasePage.dragAndDrop({
                  from: {
                    selector: printBasePage.xpathMockupPosition(selectMockup.drag.index_from),
                  },
                  to: {
                    selector: printBasePage.xpathMockupPosition(selectMockup.drag.index_to),
                  },
                });
              }
              await printBasePage.page.waitForTimeout(1000);
              await printBasePage.clickOnBtnWithLabel("Save");
              await printBasePage.waitForElementVisibleThenInvisible(
                printBasePage.xpathToastMessageEditor(selectMockup.message),
              );
              await printBasePage.closePopupSelectMockup();
              await printBasePage.waitUntilElementVisible(printBasePage.xpathListMockupEditor);
            }
          }
        });

        await test.step("Add custom options", async () => {
          const customOptions = caseData.campaign_info.custom_options;
          if (customOptions) {
            await printBasePage.clickBtnExpand();
            await printBasePage.clickOnBtnWithLabel("Customize layer");
            for (const customOption of customOptions) {
              await printBasePage.addCustomOption(customOption);
            }
            for (const customOption of customOptions) {
              await expect(printBasePage.genLoc(printBasePage.getXpathWithLabel(customOption.label))).toBeVisible();
            }
          }
        });

        await test.step("Add pricing and description info > click button [Launch] > Verify status's campaign", async () => {
          await printBasePage.clickOnBtnWithLabel("Continue");
          await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathLoadImgInPriceAndDescription);
          await printBasePage.waitUntilElementVisible(printBasePage.xpathPricingPage);
          campaignId = printBasePage.getCampaignIdInPricingPage();
          await printBasePage.inputPricingInfo(pricingInfo);
          await printBasePage.clickOnBtnWithLabel("Launch");
          const isAvailable = await printBasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
          expect(isAvailable).toBeTruthy();
        });

        await test.step("Verify campaign detail", async () => {
          const result = await printBasePage.waitDisplayMockupDetailCampaign(pricingInfo.title);
          expect(result).toBeTruthy();
          await printBasePage.closeOnboardingPopup();
          await dashboard.click(printBasePage.xpathTitleOrganization);
          await snapshotFixture.verifyWithAutoRetry({
            page: printBasePage.page,
            selector: printBasePage.xpathSectionImageInDetail,
            snapshotName: picture.image_list,
            sizeCheck: true,
          });
        });

        await test.step("Verify info of campaign on SF", async () => {
          // open campaign sf
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printBasePage.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
          await campaignSF.waitResponseWithUrl("/assets/landing.css", 50000);
          await campaignSF.waitForImagesMockupLoaded();
          await campaignSF.waitForImagesDescriptionLoaded();

          // compare title campaign
          const productTitleSF = await campaignSF.getProductTitle();
          expect(productTitleSF.toLowerCase()).toEqual(pricingInfo.title.toLowerCase());
          await campaignSF.page.waitForTimeout(10000);

          const ignoreSelectColor =
            productBasePricings.filter(item => item.value_color !== "All over print").length < 1;

          //verify pricing
          for (let i = 0; i < productBasePricings.length; i++) {
            const ignoreSelectStyle = productBasePricings.length < 1;
            await campaignSF.selectValueProduct(
              {
                style: productBasePricings[i].value_style,
                color: productBasePricings[i].value_color,
                size: productBasePricings[i].value_size,
              },
              ignoreSelectColor,
              ignoreSelectStyle,
              i + 1,
            );

            const salePrice = await campaignSF.getProductPrice("price");
            const salePriceCompare = roundingTwoDecimalPlaces(productBasePricings[i].price);
            expect(salePrice === salePriceCompare).toBeTruthy();

            const comparePrice = await campaignSF.getProductPrice("compare at price");
            const comparePriceCompare = roundingTwoDecimalPlaces(productBasePricings[i].compare_at_price);
            expect(comparePrice).toEqual(comparePriceCompare);
          }

          // compare description
          await campaignSF.verifyDescriptionCampaign();
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verifyWithAutoRetry({
            page: campaignSF.page,
            selector: campaignSF.xpathProductDescription,
            snapshotName: picture.description,
            sizeCheck: true,
          });

          // compare mockup
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
          for (let i = 0; i < countImageMockup; i++) {
            await campaignSF.page.click(campaignSF.xpathBtnNextImagePreview);
            await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
            await snapshotFixture.verifyWithAutoRetry({
              page: campaignSF.page,
              selector: `${campaignSF.getXpathMainImageOnSF(pricingInfo.title)}`,
              snapshotName: `${caseData.case_id}-${caseData.env}-step-9-image-mockup-sf-${i + 1}.png`,
              sizeCheck: true,
            });
          }
        });
      });
    }
  }

  const loadDataMockup = loadData(__dirname, "DATA_DRIVEN_VERIFY_MOCKUP_WITH_SETTING_THEME");
  for (const caseData of loadDataMockup.caseConf.data) {
    if (caseData.enable) {
      test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, context, snapshotFixture }) => {
        let campaignSF;
        const productData = caseData.product_info;
        const picture = caseData.picture;
        const variantLine = caseData.variant_line;
        await test.step("Preconditon: Click Online Store > Click button Customize > Chọn Setting > Chọn Product> Chọn Action > Click Save", async () => {
          await dashboardPage.navigateToMenu("Online Store");
          await printBasePage.setingShowImage(productData.option_setting);
          if (await printBasePage.page.locator(printBasePage.xpathBtnWithLabel("Save")).isEnabled()) {
            await printBasePage.clickOnBtnWithLabel("Save", 1);
            await expect(dashboard.locator(printBasePage.xpathToastMessageEditor(productData.message))).toBeVisible();
          }
          //Close setting page
          await printBasePage.clickOnBtnWithLabel("Close");
        });

        await test.step(" Open campaign on SF > Verify show image", async () => {
          await dashboardPage.navigateToMenu("Campaigns");
          await printBasePage.searchWithKeyword(productData.title);
          await printBasePage.openCampaignDetail(productData.title);
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printBasePage.openCampaignSF()]);
          campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
          await campaignSF.page.reload();
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          await campaignSF.waitForImagesMockupLoaded();
          const mockupList = productData.list_number;
          for (let i = 0; i < mockupList; i++) {
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: campaignSF.xpathProductMockupSlide,
              snapshotName: `${picture.show_mockup}-${i + 1}.png`,
              snapshotOptions,
            });
            if (await campaignSF.page.locator(campaignSF.xpathBtnWithLabel(caseData.btn_name, "2")).isVisible()) {
              await campaignSF.hoverThenClickElement(
                campaignSF.xpathProductMockupSlide,
                campaignSF.xpathBtnWithLabel(caseData.btn_name, 2),
              );
            }
            await campaignSF.waitForElementVisibleThenInvisible(printBasePage.xpathLoadingMainImage(productData.title));
            await campaignSF.page.waitForTimeout(1000);
          }
        });

        await test.step("Click Style khác > Verify show ảnh Preview và list ảnh category", async () => {
          if (caseData.style) {
            await campaignSF.selectVariant(caseData.style);
          }
          await campaignSF.page.locator(campaignSF.xpathProductImageGallery).scrollIntoViewIfNeeded();
          const variantLine = caseData.variant_line;
          if (variantLine) {
            await campaignSF.selectValueProduct(variantLine);
          }
          await campaignSF.waitForImagesMockupLoaded();
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathProductImageGallery,
            snapshotName: picture.mockup_style,
            snapshotOptions,
          });
        });

        await test.step("Click vào image preview > Verify show ảnh Preview", async () => {
          await campaignSF.page.click(printBasePage.getXpathMainImageOnSF(productData.title));
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathMainImageZoom(productData.index_zoom_mage),
            snapshotName: picture.image_zoom,
            snapshotOptions,
          });
        });

        await test.step("Click button [Add to cart]", async () => {
          await campaignSF.page.click(campaignSF.xpathCloseImageZoom);
          await campaignSF.selectValueProduct(variantLine);
          await campaignSF.clickOnBtnWithLabel("Add to cart");
          await campaignSF.waitUntilElementVisible(campaignSF.xpathLineItemInCart);
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoadImage);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathLineItemInCart,
            snapshotName: picture.add_cart,
            snapshotOptions,
          });
        });
      });
    }
  }
});

test.describe("Create thành công nhiều campaign", () => {
  test.beforeEach(({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
  });
  test("@SB_CREATE_MULTI_CAMPAIGN - Make campaign available", async ({ dashboard, conf }) => {
    const dataCampaign = conf.caseConf.data_3D;
    const printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    for (let i = 0; i < dataCampaign.length; i++) {
      const campaignsInfos = dataCampaign[i].campaign_info;
      await printbasePage.navigateToMenu("Catalog");
      await dashboard.reload();
      await dashboard.waitForResponse(
        response =>
          response.url().includes("/admin/pbase-product-base/catalogs.json") ||
          (response.url().includes("/admin/pbase-product-base/shipping-combos.json") && response.status() === 200),
      );
      await printbasePage.launchCamp(campaignsInfos);
      await printbasePage.navigateToMenu("Campaigns");
    }
  });
});
