import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { ProductAPI } from "@pages/api/product";
import { loadData } from "@core/conf/conf";
import { SFProduct } from "@sf_pages/product";
import { ProductPage } from "@pages/dashboard/products";

let dashboardPage: DashboardPage;
let printbasePage: PrintBasePage;
let productAPI: ProductAPI;
let campaignSF: SFProduct;
let productPage: ProductPage;
let maxDiffPixelRatio, threshold, maxDiffPixels;

test.describe("Artwork library", async () => {
  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    threshold = conf.suiteConf.threshold;
    maxDiffPixels = conf.suiteConf.max_diff_pixels;
    test.setTimeout(conf.suiteConf.timeout);
    await printbasePage.navigateToMenu("Library");
    await printbasePage.page.waitForSelector(printbasePage.titleArtwork);
    await printbasePage.page.waitForSelector(printbasePage.loadingTable, { state: "hidden", timeout: 300000 });
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    await productAPI.deleteAllArtwork();
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.deleteAllCampaign(conf.suiteConf.password);
  });

  const caseName = "DATA_LAUNCH_CAMPAIGN";
  const conf = loadData(__dirname, caseName);
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const artworkList = conf.caseConf.data[i];
    const image = artworkList.image;

    test(`${artworkList.title} @${artworkList.case_id}`, async ({ context, snapshotFixture }) => {
      //Prodtest không upload được artwork
      if (process.env.CI_ENV === "prodtest") {
        return;
      }
      //Pre condition: Upload artwork
      await test.step("Pre condition: Upload artwork", async () => {
        if (image) {
          await printbasePage.navigateToMenu("Library");
          await printbasePage.uploadFile("file", image);
          await printbasePage.page.waitForSelector(printbasePage.xpathProcessUploadArtwork);
          await printbasePage.page.waitForSelector(printbasePage.iconUploading, { state: "hidden", timeout: 200000 });
          while (await printbasePage.page.isVisible(printbasePage.xpathProcessUploadArtwork)) {
            await printbasePage.page.waitForTimeout(2000);
          }
        }
      });

      await test.step("Đi đến màn Catalog > Tạo campaign", async () => {
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
        const campaignId = await printbasePage.launchCamp(artworkList.data_test);
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
        expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
      });

      await test.step("View campaign ngoài SF", async () => {
        await printbasePage.openCampSFFromCampDetail(artworkList.data_test.pricing_info.title);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await campaignSF.clickOnBtnPreviewSF();
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
        await campaignSF.page.waitForTimeout(1000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: campaignSF.xpathPopupLivePreview(),
          snapshotName: `${artworkList.case_id}_preview.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });
    });
  }

  test("Check hiển thị màn artwork library @SB_PRB_LB_AL_1", async ({}) => {
    await test.step("-Đi đến màn Library> Artwork:admin/pod/artworks Kiểm tra hiển thị màn Artwork Library", async () => {
      await dashboardPage.navigateToMenu("Library");
      await dashboardPage.page.waitForSelector(dashboardPage.titleArtwork);
      expect(await dashboardPage.checkLocatorVisible(dashboardPage.xpathBtnArtwork)).toBeTruthy();
      expect(await dashboardPage.checkLocatorVisible(dashboardPage.xpathTabAll)).toBeTruthy();
      expect(await dashboardPage.checkLocatorVisible(dashboardPage.xpathTabPsd)).toBeTruthy();
      expect(await dashboardPage.checkLocatorVisible(dashboardPage.xpathTabStatic)).toBeTruthy();
    });
  });

  test("Check phân trang khi Có 20 file artwork da duoc tai len @SB_PRB_LB_AL_3", async ({ conf, snapshotFixture }) => {
    await test.step("Đi đến màn Library > Artwork, upload <20 files artwork", async () => {
      await printbasePage.navigateToMenu("Library");
      await printbasePage.page.waitForSelector(printbasePage.titleArtwork);
      await printbasePage.page.waitForSelector(printbasePage.loadingTable, { state: "hidden", timeout: 300000 });
      const imagesBeforePaginate = conf.caseConf.images_before_paginate;
      for (const image of imagesBeforePaginate) {
        await printbasePage.uploadFile("file", image);
        await printbasePage.page.waitForSelector(printbasePage.xpathProcessUploadArtwork);
        await printbasePage.page.waitForSelector(printbasePage.iconUploading, { state: "hidden", timeout: 200000 });
        while (await printbasePage.page.isVisible(printbasePage.xpathProcessUploadArtwork)) {
          await printbasePage.page.waitForTimeout(2000);
        }
      }
      expect(await printbasePage.checkLocatorVisible(printbasePage.xpathPaginate)).not.toBeTruthy();
    });

    await test.step("Upload thêm 10 file .jpg, jpeg,png .psd", async () => {
      const imagesPaginate = conf.caseConf.images_paginate;
      for (const image of imagesPaginate) {
        await printbasePage.uploadFile("file", image);
        await printbasePage.page.waitForSelector(printbasePage.xpathProcessUploadArtwork);
        await printbasePage.page.waitForSelector(printbasePage.iconUploading, { state: "hidden", timeout: 200000 });
        while (await printbasePage.page.isVisible(printbasePage.xpathProcessUploadArtwork)) {
          await printbasePage.page.waitForTimeout(2000);
        }
      }
      await printbasePage.navigateToSubMenu("Library", "Clipart");
      await printbasePage.page.waitForLoadState("networkidle");
      await printbasePage.navigateToSubMenu("Library", "Artworks");
      await printbasePage.page.waitForLoadState("networkidle");
      await printbasePage.page.waitForSelector(printbasePage.titleArtwork);
      await printbasePage.page.locator(printbasePage.xpathPaginate).scrollIntoViewIfNeeded({ timeout: 90000 });
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathPaginate,
        snapshotName: conf.caseConf.name_image,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });
  });

  test("Check khi delete artwork @SB_PRB_LB_AL_7", async ({ conf }) => {
    const imageName = conf.caseConf.image_name;
    await test.step(
      "-Đi đến màn Library>Artwork:/admin/pod/artwork" + "Tại artwork: Campaign artwork jpeg , click icon Delete",
      async () => {
        await dashboardPage.navigateToMenu("Library");
        await dashboardPage.uploadFile("file", conf.caseConf.path);
        let j = 0;
        let statusUpload;
        do {
          statusUpload = await dashboardPage.checkLocatorVisible(dashboardPage.xpathProcessUploadArtwork);
          await dashboardPage.page.waitForTimeout(5000);
          j++;
        } while (j < 10 && statusUpload);
        await printbasePage.searchArtworkWithKeyword(imageName);
        await printbasePage.page.hover(printbasePage.xpathImageArtwork);
        await printbasePage.page.click(printbasePage.xpathBtnDeleteArtwork);
        await printbasePage.searchArtworkWithKeyword(imageName);
        await printbasePage.clickOnBtnWithLabel("Delete");
        await printbasePage.waitForToastMessageHide("File deleted");
        expect(await printbasePage.checkLocatorVisible(printbasePage.xpathBlockArtworkEmpty)).toBeTruthy();
      },
    );
  });

  const caseNameDuplicate = "DATA_DUPLICATE_CAMPAIGN";
  const confDuplicate = loadData(__dirname, caseNameDuplicate);

  confDuplicate.caseConf.data.forEach(testCase => {
    const campaignName = testCase.camp_duplicate;
    test(`${testCase.title} @${testCase.case_id}`, async ({ conf, dashboard, context, snapshotFixture }) => {
      //Prodtest không upload được artwork
      if (process.env.CI_ENV === "prodtest") {
        return;
      }
      const campaignDuplicate = testCase.artwork_duplicates;
      for (const campaign of campaignDuplicate) {
        const layer = campaign.layers;
        const layerDelete = campaign.layers_delete;
        const image = testCase.image;

        await test.step("Pre condition: Tạo campaign", async () => {
          if (image) {
            await printbasePage.navigateToMenu("Library");
            await printbasePage.uploadFile("file", image);
            await printbasePage.page.waitForSelector(printbasePage.xpathProcessUploadArtwork);
            await printbasePage.page.waitForSelector(printbasePage.iconUploading, { state: "hidden", timeout: 200000 });
            while (await printbasePage.page.isVisible(printbasePage.xpathProcessUploadArtwork)) {
              await printbasePage.page.waitForTimeout(2000);
            }
          }
          await printbasePage.navigateToMenu("Catalog");
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
          const campaignId = await printbasePage.launchCamp(testCase.data_test);
          const isAvailable = await printbasePage.checkCampaignStatus(
            campaignId,
            ["available", "available with basic images"],
            30 * 60 * 1000,
          );
          expect(isAvailable).toBeTruthy();
          expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
        });

        await test.step(
          "- Đi đến màn All campaign: /admin/pod/campaigns\n" +
            "- Search và chọn campaing: Campaign artwork psd\n" +
            "- Open campaign detail\n" +
            "- Click button Duplicate\n" +
            '- check checkbox "Duplicate the artworks and custom options of the original campaign"\n' +
            "- click button Duplicate",
          async () => {
            await dashboardPage.navigateToMenu("Campaigns");
            await printbasePage.searchWithKeyword(campaignName);
            await printbasePage.duplicateCampaign(campaignName, campaign.duplicate_artwork);
            await printbasePage.removeLiveChat();
            await printbasePage.clickBtnExpand();
            await dashboard.waitForTimeout(2000);
            await snapshotFixture.verify({
              page: dashboard,
              snapshotName: campaign.picture.picture_editor_campaign,
              snapshotOptions: {
                maxDiffPixelRatio: maxDiffPixelRatio,
                threshold: threshold,
                maxDiffPixels: maxDiffPixels,
              },
            });
          },
        );

        await test.step("Click vào button continue -> hiển thị màn pricing > - Launch campaign", async () => {
          if (layerDelete) {
            await printbasePage.deleteLayers(layerDelete);
          }
          if (layer) {
            await printbasePage.addNewLayers(layer);
          }
          await printbasePage.clickOnBtnWithLabel("Continue");
          await printbasePage.waitUntilElementVisible(printbasePage.xpathVariantPricing);
          await printbasePage.inputPricingInfo(campaign.pricing_infor);
          const campaignId = printbasePage.getCampaignIdInPricingPage();
          await printbasePage.clickOnBtnWithLabel("Launch");
          const isAvailable = await printbasePage.checkCampaignStatus(
            campaignId,
            ["available", "available with basic images"],
            30 * 60 * 1000,
          );
          expect(isAvailable).toBeTruthy();
        });

        await test.step("-Sau khi campaign launching thành công View campaign ngoài SF", async () => {
          const campaignTitle = campaign.pricing_infor.title;
          await printbasePage.navigateToMenu("Campaigns");
          await printbasePage.searchWithKeyword(campaignTitle);
          await printbasePage.openCampaignDetail(campaignTitle);
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
          await campaignSF.clickOnBtnPreviewSF();
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
          await campaignSF.page.waitForTimeout(1000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathPopupLivePreview(),
            snapshotName: campaign.picture.picture_camp_storefont,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        });
      }
    });
  });

  test("Check khi edit camp @SB_PRB_LB_AL_10", async ({ conf, dashboard, token, context, snapshotFixture }) => {
    const clonesInfo = conf.caseConf.data_test;
    const domainShopSecond = conf.suiteConf.shop_clone_product.domain;
    let printbasePageSecond: PrintBasePage;
    const image = conf.caseConf.image;
    //Prodtest không upload được artwork
    if (process.env.CI_ENV === "prodtest") {
      return;
    }

    for (const campaign of clonesInfo) {
      const campaignName = campaign.campaign_name;

      await test.step("Pre condition: Tạo campaign", async () => {
        if (image) {
          await printbasePage.navigateToMenu("Library");
          await printbasePage.uploadFile("file", image);
          await printbasePage.page.waitForSelector(printbasePage.xpathProcessUploadArtwork);
          await printbasePage.page.waitForSelector(printbasePage.iconUploading, { state: "hidden", timeout: 200000 });
          while (await printbasePage.page.isVisible(printbasePage.xpathProcessUploadArtwork)) {
            await printbasePage.page.waitForTimeout(2000);
          }
        }
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
        const campaignId = await printbasePage.launchCamp(conf.caseConf.campaign_info);
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
        expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
      });

      await test.step(" Đi đến màn All campaign của shop gốc : /admin/pod/campaigns->clone product", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(campaignName);
        productPage = new ProductPage(dashboard, conf.suiteConf.domain);
        await productPage.cloneProductToStore(campaign.clone_info);
        await productPage.checkMsgAfterCreated({
          message: `${conf.caseConf.message} ${campaign.clone_info.second_shop}`,
        });
      });

      await test.step(" Đi đến màn All campaign của shop đích : /admin/pod/campaigns->search campaign->open camoaign->click vào Edit personalization", async () => {
        const shopToken = await token.getWithCredentials({
          domain: conf.suiteConf.shop_clone_product.shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        const accessToken = shopToken.access_token;
        printbasePageSecond = new PrintBasePage(dashboard, domainShopSecond);
        await printbasePageSecond.loginWithToken(accessToken);
        await printbasePageSecond.navigateToMenu("Campaigns");
        await printbasePageSecond.waitStatusProcess(conf.caseConf.status);
        await printbasePageSecond.searchWithKeyword(campaignName);
        await printbasePageSecond.openCampaignDetail(campaignName);
        await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
        await printbasePageSecond.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePageSecond.clickBtnExpand();
        await printbasePageSecond.removeLiveChat();
        //choi page on dinh de chup anh
        await dashboard.waitForSelector(printbasePageSecond.xpathCustomOption);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: campaign.picture.picture_editor_campaign,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step(" View campaign ngoài SF", async () => {
        await printbasePageSecond.clickOnBtnWithLabel("Cancel");
        if (await printbasePageSecond.checkButtonVisible("Leave page")) {
          await printbasePageSecond.clickOnBtnWithLabel("Leave page");
        }
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePageSecond.openCampaignSF()]);
        campaignSF = new SFProduct(SFPage, domainShopSecond);
        await campaignSF.clickOnBtnPreviewSF();
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
        await campaignSF.page.waitForTimeout(1000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: campaignSF.xpathPopupLivePreview(),
          snapshotName: campaign.picture.picture_storefront,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await campaignSF.page.close();
      });
    }
  });

  const caseUploadEditor = "UPLOAD_ARTWORK_EDITOR_CAMPAIGN";
  const confUploadArtworkEditor = loadData(__dirname, caseUploadEditor);
  for (let i = 0; i < confUploadArtworkEditor.caseConf.data.length; i++) {
    const artworkList = confUploadArtworkEditor.caseConf.data[i];

    test(`${artworkList.title} @${artworkList.case_id}`, async ({ conf, context, snapshotFixture }) => {
      const campaignsInfo = artworkList.data_test;
      for (const campaign of campaignsInfo) {
        const campaignName = campaign.pricing_info.title;
        const customOptions = campaign.custom_options;
        const artworkName = campaign.artwork_name;

        //Prodtest không upload được artwork
        if (process.env.CI_ENV === "prodtest" && artworkList.case_id == "SB_PRB_LB_AL_11") {
          return;
        }

        await test.step("Đi đến Catalog > Apprel > 'Unisex T-shirt', Click 'Create new campaign', Tại Front side > 'Add image' > Click Upload file", async () => {
          await printbasePage.navigateToMenu("Catalog");
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
          await printbasePage.addBaseProducts(campaign.product_infos);
          await printbasePage.clickOnBtnWithLabel("Create new campaign");
          await printbasePage.page.click(printbasePage.xpathBtnAddImage);
          if (campaign.image) {
            await printbasePage.page.setInputFiles(printbasePage.xpathInputFile, campaign.image);
          }
          await printbasePage.page.waitForSelector(printbasePage.xpathProcessUploadArtwork);
          await printbasePage.page.waitForSelector(printbasePage.iconUploading, { state: "hidden", timeout: 200000 });
          while (await printbasePage.page.isVisible(printbasePage.xpathProcessUploadArtwork)) {
            await printbasePage.page.waitForTimeout(2000);
          }
          await printbasePage.searchArtworkWithKeyword(artworkName);
          await expect(printbasePage.genLoc(printbasePage.getXpathArtworkByName(artworkName))).toBeVisible();
          await printbasePage.closePopupSelectMockup();
        });

        await test.step('Chọn "Clipmask 01.png", click Continue, nhập title, click button Launch', async () => {
          await printbasePage.addNewLayers(campaign.layers);
          if (customOptions) {
            // Add custom option
            await printbasePage.clickBtnExpand();
            await printbasePage.clickOnBtnWithLabel("Customize layer");
            await printbasePage.addCustomOptions(customOptions);
          }
          await printbasePage.clickOnBtnWithLabel("Continue");
          await printbasePage.inputPricingInfo(campaign.pricing_info);
          const campaignId = printbasePage.getCampaignIdInPricingPage();
          await printbasePage.clickOnBtnWithLabel("Launch");
          const isAvailable = await printbasePage.checkCampaignStatus(
            campaignId,
            ["available", "available with basic images"],
            30 * 60 * 1000,
          );
          expect(isAvailable).toBeTruthy();
        });

        await test.step("Sau khi campaign launching thành công, View campaign ngoài SF", async () => {
          await printbasePage.navigateToMenu("Campaigns");
          await printbasePage.searchWithKeyword(campaignName);
          await printbasePage.openCampaignDetail(campaignName);
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
          await campaignSF.clickOnBtnPreviewSF();
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
          await campaignSF.page.waitForTimeout(1000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathPopupLivePreview(),
            snapshotName: campaign.picture.picture_camp_storefont,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        });

        await test.step("Đi đến màn Library > Artwork: /admin/pod/artwork", async () => {
          await printbasePage.navigateToMenu("Library");
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
          await printbasePage.page.waitForSelector(printbasePage.xpathArtworkList);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathBlockArtwork,
            snapshotName: campaign.picture.picture_tab_all,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });

          await printbasePage.page.click(printbasePage.xpathTabStatic);
          await printbasePage.page.waitForSelector(`${printbasePage.xpathTabActive}${printbasePage.xpathTabStatic}`);
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathBlockArtwork,
            snapshotName: campaign.picture.picture_tab_static,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });

          await printbasePage.page.click(printbasePage.xpathTabPsd);
          await printbasePage.page.waitForSelector(`${printbasePage.xpathTabActive}${printbasePage.xpathTabPsd}`);
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathBlockArtwork,
            snapshotName: campaign.picture.picture_tab_psd,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        });
      }
    });
  }
});
