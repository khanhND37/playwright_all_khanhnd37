import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { SFHome } from "@sf_pages/homepage";
import { HivePBase } from "@pages/hive/hivePBase";
import { loadData } from "@core/conf/conf";
import { Personalize } from "@pages/dashboard/personalize";

test.describe("Campaign manual design", () => {
  let printbasePage: PrintBasePage;
  let personalize: Personalize;

  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test("[Use the sample campaign]Check hiển thị màn Custom Art @SB_PRB_MC_MDC_4", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const picture = conf.caseConf.picture;

    await test.step("Đi đến màn hình Library > Custom art > Check hiển thị màn Custom art", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToSubMenu("Library", "Custom Art");
      await dashboard.waitForTimeout(6000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathManualDesignPage,
        snapshotName: picture.picture_custom_art_page,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click About process and pricing và check hiển thị", async () => {
      await dashboard.click(printbasePage.getXpathWithLabel("About our process and pricing"));
      await dashboard.waitForTimeout(1000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathProcessManualDesign,
        snapshotName: picture.picture_process,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Use the sample campaign] Check khi import vào store @SB_PRB_MC_MDC_8", async ({
    dashboard,
    conf,
    authRequest,
    page,
    snapshotFixture,
  }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const picture = conf.caseConf.picture;
    const campaignName = conf.caseConf.campaign_name;
    const homePage = new SFHome(page, conf.suiteConf.domain);

    await test.step("Đi đến màn hình Library > Custom art > Click btn Import to store", async () => {
      await printbasePage.navigateToSubMenu("Library", "Custom Art");
      await printbasePage.waitUntilElementVisible(printbasePage.xpathAvailableToCustomArt(campaignName));
      await dashboard.click(printbasePage.xpathBtnImportToStoreOrEditCustomArt(campaignName, "Import to store"));
      if (await dashboard.locator(printbasePage.xpathBtnWithLabel("Create campaign")).isVisible()) {
        await printbasePage.clickOnBtnWithLabel("Create campaign");
      }
      await printbasePage.isToastMsgVisible(conf.caseConf.message);
    });

    await test.step("Đi đến màn hình All campaigns > Search campaign > Mở màn hình campaign detail", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      const campaignID = await printbasePage.getIDCampaign(authRequest, campaignName, conf.suiteConf.domain);
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignID,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
      await printbasePage.searchWithKeyword(campaignName);
      await printbasePage.openCampaignDetail(campaignName);
      await dashboard.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathVariantInCampaignDetail,
        snapshotName: picture.picture_campaign_detail,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("View campaign ngoài SF > Verify campaign manual đesign", async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(campaignName);
      await dashboard.waitForTimeout(6000);
      await snapshotFixture.verify({
        page: page,
        selector: printbasePage.xpathVariantCustomArt,
        snapshotName: picture.picture_variant_custom_art,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Use the sample campaign] Check khi click Edit from sample @SB_PRB_MC_MDC_9", async ({
    dashboard,
    hivePBase,
    conf,
    authRequest,
    page,
    snapshotFixture,
  }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const picture = conf.caseConf.picture;
    const campaignName = conf.caseConf.campaign_name;
    const homePage = new SFHome(page, conf.suiteConf.domain);
    const layers = conf.caseConf.layers;
    const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);

    await test.step("Đi đến màn hình Library > Custom art > Click btn Import to store", async () => {
      await printbasePage.navigateToSubMenu("Library", "Custom Art");
      await dashboard
        .locator(printbasePage.xpathBtnImportToStoreOrEditCustomArt(campaignName, "Edit from sample"))
        .scrollIntoViewIfNeeded();
      await dashboard.click(printbasePage.xpathBtnImportToStoreOrEditCustomArt(campaignName, "Edit from sample"));
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.clickBtnExpand();
      await printbasePage.removeLiveChat();
      await dashboard.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.picture_editor_campaign,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Nhập thông tin edit > Click btn Save", async () => {
      await printbasePage.addNewLayers(layers);
      await printbasePage.clickOnBtnWithLabel("Save");
      await printbasePage.waitUntilElementVisible(printbasePage.xpathVariantPricing);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathVariantPricing,
        snapshotName: picture.picture_variant_pricing,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click btn Launch > Approve campaign manual design", async () => {
      await printbasePage.clickOnBtnWithLabel("Launch");
      await dashboard.waitForTimeout(3000);
      const campaignID = await printbasePage.getIDCampaign(authRequest, campaignName, conf.suiteConf.domain);
      await hivePbase.approveCampaignCustomArt(campaignID);
      await dashboard.reload();
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignID,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Mở campaign detail và verify", async () => {
      await printbasePage.searchWithKeyword(campaignName);
      await printbasePage.openCampaignDetail(campaignName);
      await printbasePage.waitUntilElementVisible(printbasePage.xpathVariantInCampaignDetail);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathVariantInCampaignDetail,
        snapshotName: picture.picture_campaign_detail,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
    await test.step("View campaign ngoài SF > Verify campaign manual đesign", async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(campaignName);
      await dashboard.waitForTimeout(6000);
      await snapshotFixture.verify({
        page: page,
        selector: printbasePage.xpathVariantCustomArt,
        snapshotName: picture.picture_variant_custom_art,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Use the sample campaign]Clone a manual design campaign @SB_PRB_MC_MDC_12", async ({
    dashboard,
    conf,
    token,
    page,
    snapshotFixture,
  }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const picture = conf.caseConf.picture;
    const campaignName = conf.caseConf.campaign_name;
    const homePage = new SFHome(page, conf.suiteConf.domain);
    const cloneInfo = conf.caseConf.clone_info;
    const secondShop = conf.suiteConf.info_shop_second;

    await test.step(`Login vào shop gốc > Search campaign ${campaignName} > Clone campaign`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignName);
      await printbasePage.cloneProductToStore(cloneInfo);
    });

    await test.step(`Login vào second shop`, async () => {
      const printbase = new PrintBasePage(page, secondShop.domain);
      const shopToken = await token.getWithCredentials({
        domain: secondShop.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const accessToken = shopToken.access_token;
      await printbase.loginWithToken(accessToken);
      await printbase.navigateToMenu("Campaigns");
      await printbase.searchWithKeyword(campaignName);
      await printbase.openCampaignDetail(campaignName);
      await printbase.clickOnBtnWithLabel("Edit personalization");
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.removeLiveChat();
      await printbase.clickBtnExpand();
      await dashboard.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: page,
        snapshotName: picture.picture_editor_campaign,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("View campaign ngoài SF > Verify campaign manual đesign", async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(campaignName);
      await dashboard.waitForTimeout(6000);
      await snapshotFixture.verify({
        page: page,
        selector: printbasePage.xpathVariantCustomArt,
        snapshotName: picture.picture_variant_custom_art,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_id}`, async ({
      dashboard,
      conf,
      page,
      hivePBase,
      authRequest,
      snapshotFixture,
    }) => {
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const campaignOrigin = caseData.campaign_origin;
      const homePage = new SFHome(page, conf.suiteConf.domain);
      const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
      const picture = caseData.picture;
      const pricingInfo = caseData.pricing_info;
      const layers = caseData.layers;

      await test.step(`Vào Campaigns > All campaigns > Search campaign ${campaignOrigin} > Duplicate campaign`, async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(campaignOrigin);
        await printbasePage.duplicateCampaign(campaignOrigin, caseData.keep_artwork);
        await printbasePage.removeLiveChat();
        await printbasePage.clickBtnExpand();
        await dashboard.waitForTimeout(2000);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: picture.picture_editor_campaign,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        if (caseData.case_id === "SB_PRB_MC_MDC_11") {
          await printbasePage.addNewLayers(layers);
          await printbasePage.clickSyncLayer(layers[0].layer_name);
        }
      });

      await test.step("Click btn Continue > Verify thông tin hiển thị ở màn pricing", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitUntilElementVisible(printbasePage.xpathVariantPricing);
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbasePage.xpathVariantPricing,
          snapshotName: picture.picture_variant_pricing,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Click btn Launch > Vào trong hive-pbase approve campaign custom art", async () => {
        await printbasePage.inputPricingInfo(pricingInfo);
        await dashboard.waitForTimeout(1000);
        await printbasePage.clickOnBtnWithLabel("Launch");
        const campaignID = await printbasePage.getIDCampaign(authRequest, pricingInfo.title, conf.suiteConf.domain);
        if (caseData.case_id === "SB_PRB_MC_MDC_10") {
          await hivePbase.approveCampaignCustomArt(campaignID);
          await dashboard.reload();
        }
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignID,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      });

      await test.step("Open campaign detail > Verify thông tin trong màn campaign detail", async () => {
        await printbasePage.searchWithKeyword(pricingInfo.title);
        await printbasePage.openCampaignDetail(pricingInfo.title);
        await printbasePage.waitUntilElementVisible(printbasePage.xpathVariantInCampaignDetail);
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbasePage.xpathVariantInCampaignDetail,
          snapshotName: picture.picture_campaign_detail,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("View campaign ngoài SF > Verify campaign manual đesign", async () => {
        await homePage.gotoHomePage();
        await homePage.searchThenViewProduct(pricingInfo.title);
        await dashboard.waitForTimeout(6000);
        await snapshotFixture.verify({
          page: page,
          selector: printbasePage.xpathVariantCustomArt,
          snapshotName: picture.picture_variant_custom_art,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  test("[Create manual campaign] Check tạo campaign không thành công khi khi bỏ trống cusotm option @SB_PRB_MC_MDC_13", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const productInfo = conf.caseConf.product_info;
    const layers = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_options;
    const picture = conf.caseConf.picture;
    const message = conf.caseConf.message;

    await test.step("Đi tới màn Catalog > Select base product > Add custom option", async () => {
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.addBaseProducts(productInfo);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      await printbasePage.addNewLayers(layers);
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOptions(customOptions);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathPopupCustomArtOnEditor,
        snapshotName: picture.picture_popup_custom_art,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Check checkbox custom art > Delete layer > Verify hiển thị ", async () => {
      await printbasePage.verifyCheckedThenClick(printbasePage.xpathCheckboxCustomArt, true);
      await printbasePage.removeAllCustomOption();
      await printbasePage.checkMsgAfterCreated({
        errMsg: message.message_err_co,
      });
    });

    await test.step('Check hiển thị value "Applied for" field on "Additional materials" field', async () => {
      await dashboard.click(printbasePage.xpathDroplistSelectCOCustomArt());
      await printbasePage.checkMsgAfterCreated({
        errMsg: message.message_applied_for,
      });
    });

    await test.step("Click btn Continue > Verify màn hình pricing", async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Launch", 1))).toBeDisabled();
      await printbasePage.checkMsgAfterCreated({
        errMsg: message.message_err_pricing,
      });
    });

    await test.step("Back lại màn hình editor> delete material > Click btn Continue", async () => {
      await printbasePage.clickElementWithLabel("span", "Design & Personalization");
      await printbasePage.clickElementWithLabel("span", "Additional Materials");
      await dashboard.click(printbasePage.xpathIconDeleteMaterial(1));
      await printbasePage.clickOnBtnWithLabel("Continue");
      await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Launch", 1))).toBeDisabled();
      await printbasePage.checkMsgAfterCreated({
        errMsg: message.message_err_pricing,
      });
    });
  });

  test("[Create manual campaign] Check khi tạo campaign không thành công khi các field không hợp lệ @SB_PRB_MC_MDC_1TRE4", async ({
    dashboard,
    conf,
  }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const productInfo = conf.caseConf.product_info;
    const layers = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_options;
    const message = conf.caseConf.message;
    const customArt = conf.caseConf.custom_art;

    for (let i = 0; i < customArt.length; i++) {
      await test.step("Đi tới màn Catalog > Select base product > Add custom option", async () => {
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.addBaseProducts(productInfo);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.clickOnBtnWithLabel("Create new campaign");
        await printbasePage.addNewLayers(layers);
        await printbasePage.removeLiveChat();
        await printbasePage.clickBtnExpand();
        await printbasePage.clickOnBtnWithLabel("Customize layer");
        await printbasePage.addCustomOptions(customOptions);
      });

      await test.step("Đi tới màn pricing > Verify hiển thị message lỗi", async () => {
        await printbasePage.createCustomArt(customArt[i]);
        await printbasePage.clickOnBtnWithLabel("Continue");
        await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Launch", 1))).toBeDisabled();
        await printbasePage.checkMsgAfterCreated({
          errMsg: message,
        });
      });
    }
  });

  const confData = loadData(__dirname, "MANUAL_DESIGN_CO");
  for (let i = 0; i < confData.caseConf.data.length; i++) {
    const caseData = confData.caseConf.data[i];
    test(`@${caseData.case_id} [Create manual campaign] Check khi tạo campaign thành công với CO ${caseData.type}`, async ({
      dashboard,
      hivePBase,
      conf,
      page,
      snapshotFixture,
    }) => {
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      personalize = new Personalize(dashboard, conf.suiteConf.domain);
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const homePage = new SFHome(page, conf.suiteConf.domain);
      const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
      const customArt = caseData.custom_art;
      const pricingInfo = caseData.pricing_info;
      const picture = caseData.picture;
      const campaignsInfos = caseData.data_test;
      let campaignID;
      const hiveCustomArt = caseData.hive_custom_art;

      await test.step("Đi tới màn Catalog > Select base product > Add custom option", async () => {
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.launchCamp(campaignsInfos);
        await printbasePage.addListCustomArt(customArt);
        await printbasePage.clickOnBtnWithLabel("Continue");
        await expect(
          await dashboard.locator(printbasePage.getXpathWithLabel("Design & Personalization")),
        ).toBeVisible();
      });

      await test.step("Input title > Click btn Launch campaign", async () => {
        await printbasePage.inputPricingInfo(pricingInfo);
        campaignID = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.clickOnBtnWithLabel("Launch");
        await expect(
          await dashboard.locator(printbasePage.xpathStatusCampaign(pricingInfo.title, "in review")),
        ).toBeVisible();
      });

      await test.step("Login vào hive-pbase > Approve campaign custom art > Verify màn campaign detail in hive", async () => {
        await hivePbase.goto(`/admin/app/pbasecampaign/${campaignID}/show`);
        await hivePbase.clickOnBtnWithLabel("Design approve", 1);
        await hivePbase.clickOnBtnWithLabel("Approve", 1);
        for (let i = 0; i < hiveCustomArt.length; i++) {
          await hivePBase.reload();
          await hivePBase.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: hivePBase,
            selector: hivePbase.xpathFrameInCustomArtDetail(hiveCustomArt[i].label),
            snapshotName: hiveCustomArt[i].picture,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        }
      });

      await test.step("Đi tới màn hình All campaign > Sau khi Launch thành công > Verify màn hình campaign detail", async () => {
        await dashboard.reload();
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignID,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
        await printbasePage.searchWithKeyword(pricingInfo.title);
        await printbasePage.openCampaignDetail(pricingInfo.title);
        await printbasePage.waitUntilElementVisible(printbasePage.xpathVariantInCampaignDetail);
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbasePage.xpathVariantInCampaignDetail,
          snapshotName: picture.picture_campaign_detail,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("View campaign ngoài SF > Verify campaign manual đesign", async () => {
        await homePage.gotoHomePage();
        await homePage.searchThenViewProduct(pricingInfo.title);
        await dashboard.waitForTimeout(6000);
        await snapshotFixture.verify({
          page: page,
          selector: personalize.xpathListCO,
          snapshotName: picture.picture_list_co,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  const confEdit = loadData(__dirname, "EDIT_CAMPAIGN");
  for (let i = 0; i < confEdit.caseConf.data.length; i++) {
    const caseData = confEdit.caseConf.data[i];
    test(`@${caseData.case_id} ${caseData.description}`, async ({
      dashboard,
      conf,
      hivePBase,
      authRequest,
      snapshotFixture,
    }) => {
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
      const picture = caseData.picture;
      const pricingInfo = caseData.pricing_info;
      const dataLaunchCampaign = caseData.data_test;
      let campaignID;
      const customArt = caseData.custom_art;
      const hiveCustomArt = caseData.hive_custom_art;

      await test.step(`Tạo campaign thành công`, async () => {
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.launchCamp(dataLaunchCampaign);
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.inputPricingInfo(pricingInfo);
        campaignID = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.clickOnBtnWithLabel("Launch");
        const status = await printbasePage.getStatusOfFirstCampaign(authRequest, conf.suiteConf.domain);
        expect(status).toBeTruthy();
      });

      await test.step("Mở màn hình editor campaign > Verify hiển thị custom art", async () => {
        await printbasePage.searchWithKeyword(pricingInfo.title);
        await printbasePage.openCampaignDetail(pricingInfo.title);
        await printbasePage.clickOnBtnWithLabel("Edit personalization");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.clickBtnExpand();
        if (caseData.case_id === "SB_PRB_MC_MDC_17") {
          await printbasePage.clickOnBtnWithLabel("Customize layer");
          await printbasePage.addCustomOptions(caseData.custom_options);
        }
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbasePage.xpathPopupCustomArtOnEditor,
          snapshotName: picture.picture_checkbox_custom_art,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Add custom art cho campaign > click Save changes", async () => {
        await printbasePage.addListCustomArt(customArt);
        await dashboard.waitForTimeout(3000);
        await printbasePage.clickOnBtnWithLabel("Save change");
        await printbasePage.clickOnBtnWithLabel("Update");
        await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Save change", 1))).toBeDisabled();
      });

      await test.step("Login vào hive-pbase > Verify campaign manual detail", async () => {
        await hivePbase.goto(`/admin/app/pbasecampaign/${campaignID}/show`);
        for (let i = 0; i < hiveCustomArt.length; i++) {
          await hivePBase.reload();
          await hivePBase.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: hivePBase,
            selector: hivePbase.xpathFrameInCustomArtDetail(hiveCustomArt[i].label),
            snapshotName: hiveCustomArt[i].picture,
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

  test("SB_PRB_MC_MDC_18 - [Create manual campaign] Check khi edit campaign manual design @SB_PRB_MC_MDC_18", async ({
    dashboard,
    hivePBase,
    conf,
    page,
    snapshotFixture,
  }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    personalize = new Personalize(dashboard, conf.suiteConf.domain);
    const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
    const campaignsInfos = conf.caseConf.data_test;
    const customArt = conf.caseConf.custom_art;
    const pricingInfo = conf.caseConf.pricing_info;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const homePage = new SFHome(page, conf.suiteConf.domain);
    let campaignID;
    const dataCase = conf.caseConf.EDIT_CAMPAIGN;
    await test.step("Đi tới màn Catalog > Select base product > Add custom option", async () => {
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.launchCamp(campaignsInfos);
      await printbasePage.addListCustomArt(customArt);
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(pricingInfo);
      campaignID = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(
        await dashboard.locator(printbasePage.xpathStatusCampaign(pricingInfo.title, "in review")),
      ).toBeVisible();
    });

    await test.step("Login vào hive-pbase > Approve campaign custom art > Verify hiển thị campaign ở list campaign", async () => {
      await hivePbase.approveCampaignCustomArt(campaignID);
      await dashboard.reload();
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignID,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    for (let i = 0; i < dataCase.length; i++) {
      const hiveCustomArt = dataCase[i].hive_custom_art;
      await test.step("Mở màn hình editor campaign > Edit custom art", async () => {
        await printbasePage.openCampaignDetail(pricingInfo.title);
        await printbasePage.clickOnBtnWithLabel("Edit personalization");
        await printbasePage.clickBtnExpand();
        if (i === 0) {
          await printbasePage.addListCustomArt(dataCase[0].custom_art);
        } else {
          await dashboard.click(printbasePage.xpathIconDeleteMaterial());
        }
        await printbasePage.clickOnBtnWithLabel("Save change");
        await printbasePage.clickOnBtnWithLabel("Update");
        await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Save change", 1))).toBeDisabled();
        await printbasePage.clickOnBtnWithLabel("Cancel");
        await printbasePage.clickOnBtnWithLabel("Leave page");
        await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
      });

      await test.step("Login vào hive-pbase > Verify campaign manual detail", async () => {
        await hivePbase.goto(`/admin/app/pbasecampaign/${campaignID}/show`);
        await hivePBase.reload();
        for (let j = 0; j < hiveCustomArt.length; j++) {
          await snapshotFixture.verify({
            page: hivePBase,
            selector: hivePbase.xpathFrameInCustomArtDetail(hiveCustomArt[j].label),
            snapshotName: hiveCustomArt[j].picture,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        }
      });

      await test.step("View campaign ngoài SF > Verify campaign manual đesign", async () => {
        await homePage.gotoHomePage();
        await homePage.searchThenViewProduct(pricingInfo.title);
        await dashboard.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: page,
          selector: personalize.xpathListCO,
          snapshotName: dataCase[i].picture_sf,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    }
  });

  const confDuplicate = loadData(__dirname, "DUPLICATE_CAMPAIGN_CUSTOM_ART");
  for (let i = 0; i < confDuplicate.caseConf.data.length; i++) {
    const caseData = confDuplicate.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_id}`, async ({
      dashboard,
      hivePBase,
      conf,
      page,
      snapshotFixture,
    }) => {
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      personalize = new Personalize(dashboard, conf.suiteConf.domain);
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const homePage = new SFHome(page, conf.suiteConf.domain);
      const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
      const picture = caseData.picture;
      const pricingInfo = caseData.pricing_info;
      const campaignOrigin = caseData.campaign_origin;
      await test.step("Duplicate campaign keep artwork", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(campaignOrigin);
        await printbasePage.duplicateCampaign(campaignOrigin, caseData.keep_artwork);
        await printbasePage.removeLiveChat();
        await printbasePage.clickBtnExpand();
        await dashboard.waitForTimeout(1000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: personalize.xpathCustomOption,
          snapshotName: picture.picture_editor,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("Click btn Continue > Click btn Launch > Login vào hive pbase > Approve campaign", async () => {
        if (caseData.case_id === "SB_PRB_MC_MDC_21") {
          await printbasePage.addNewLayers(caseData.layers);
          await printbasePage.clickOnBtnWithLabel("Customize layer");
          await printbasePage.addCustomOptions(caseData.custom_options);
        }
        await printbasePage.clickOnBtnWithLabel("Continue");
        await dashboard.waitForTimeout(2000);
        await printbasePage.inputPricingInfo(pricingInfo);
        const campaignID = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.clickOnBtnWithLabel("Launch");
        if (caseData.case_id === "SB_PRB_MC_MDC_20") {
          await hivePbase.approveCampaignCustomArt(campaignID);
          await printbasePage.navigateToMenu("Orders");
          await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
        }
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignID,
          ["available", "available with basic images"],
          20 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      });

      await test.step("Verify campaign ngoài SF", async () => {
        await homePage.gotoHomePage();
        await homePage.searchThenViewProduct(pricingInfo.title);
        await dashboard.waitForTimeout(6000);
        await snapshotFixture.verify({
          page: page,
          selector: personalize.xpathListCO,
          snapshotName: picture.picture_list_co,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  test("SB_PRB_MC_MDC_22 - [Create manual campaign] Clone a manual design campaign @SB_PRB_MC_MDC_22", async ({
    dashboard,
    conf,
    token,
    page,
    snapshotFixture,
  }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    personalize = new Personalize(dashboard, conf.suiteConf.domain);
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const picture = conf.caseConf.picture;
    const campaignName = conf.caseConf.campaign_name;
    const homePage = new SFHome(page, conf.suiteConf.domain);
    const cloneInfo = conf.caseConf.clone_info;
    const secondShop = conf.suiteConf.info_shop_second;

    await test.step(`Login vào shop gốc > Search campaign ${campaignName} > Clone campaign`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignName);
      await printbasePage.cloneProductToStore(cloneInfo);
    });

    await test.step(`Login vào second shop`, async () => {
      const printbase = new PrintBasePage(page, secondShop.domain);
      const personalizePage = new Personalize(page, secondShop.domain);
      const shopToken = await token.getWithCredentials({
        domain: secondShop.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const accessToken = shopToken.access_token;
      await printbase.loginWithToken(accessToken);
      await printbase.navigateToMenu("Campaigns");
      let textStatus;
      let textProcess;
      let j = 0;
      do {
        await printbase.clickProgressBar();
        textStatus = await printbase.getStatus();
        textProcess = await printbase.getProcess();
        await printbase.page.waitForTimeout(2000);
        await printbase.page.click(printbase.xpathTitleCampaign);
        j++;
      } while (textStatus != conf.suiteConf.status && j < 20);
      expect(textProcess).toEqual(conf.caseConf.process);
      await printbase.searchWithKeyword(campaignName);
      await printbase.openCampaignDetail(campaignName);
      await printbase.clickOnBtnWithLabel("Edit personalization");
      await printbase.waitForElementVisibleThenInvisible(printbase.xpathIconLoading);
      await printbase.removeLiveChat();
      await printbase.clickBtnExpand();
      await dashboard.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: page,
        selector: personalizePage.xpathCustomOption,
        snapshotName: picture.picture_editor_campaign,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("View campaign ngoài SF > Verify campaign manual design", async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(campaignName);
      await dashboard.waitForTimeout(6000);
      await snapshotFixture.verify({
        page: page,
        selector: personalize.xpathListCO,
        snapshotName: picture.picture_variant_custom_art,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });
});
