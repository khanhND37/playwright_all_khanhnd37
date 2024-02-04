import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { Apps } from "@pages/dashboard/apps";
import { SFProduct } from "@sf_pages/product";
import { SFHome } from "@sf_pages/homepage";
import { HivePBase } from "@pages/hive/hivePBase";

test.describe("Duplicate campaign keep artwork", () => {
  let printbasePage: PrintBasePage;
  let appPage: Apps;
  let SFPage;

  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.time_out);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];

    test(`${caseData.description} @${caseData.case_id}`, async ({
      dashboard,
      page,
      authRequest,
      context,
      snapshotFixture,
    }) => {
      const campaignOrigin = caseData.campaign_origin;
      const keepArtwork = caseData.keep_artwork;
      const picture = caseData.picture;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      appPage = new Apps(dashboard, conf.suiteConf.domain);
      const pricingInfor = caseData.pricing_infor;
      const customOptionInfo = caseData.custom_option_info;
      const productSF = new SFProduct(page, conf.suiteConf.domain);
      const homePage = new SFHome(page, conf.suiteConf.domain);
      const hivePbase = new HivePBase(page, conf.suiteConf.domain_hive);
      const productInfo = caseData.product_info;
      const sizeAdd = caseData.size_add;
      const sizeRemove = caseData.size_remove;
      const colorAdd = caseData.color_add;
      const colorRemove = caseData.color_remove;
      const removeLayer = caseData.remove_layers;
      const layers = caseData.layers;
      const customOptions = caseData.custom_options;

      await test.step("Pre: Create campaign origin", async () => {
        await printbasePage.navigateToMenu("Apps");
        await appPage.openApp("Print Hub");
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
        await printbasePage.deleteAllCampaign(conf.suiteConf.password);
        await printbasePage.navigateToMenu("Catalog");
        const campainId = await printbasePage.launchCamp(campaignOrigin);
        if (!campaignOrigin.is_campaign_draft) {
          const isAvailable = await printbasePage.checkCampaignStatus(
            campainId,
            ["available", "available with basic images"],
            30 * 60 * 1000,
          );
          expect(isAvailable).toBeTruthy();
        }
        if (campaignOrigin.is_available) {
          await printbasePage.navigateToMenu("Campaigns");
          await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
          await dashboard.locator(printbasePage.xpathSelectProduct(campaignOrigin.pricing_info.title)).click();
          await printbasePage.selectActionProduct("Make 1 campaign unavailable");
          await printbasePage.clickOnBtnWithLabel("Make 1 campaign unavailable");
        }
      });

      await test.step(`1. Vào màn hình All campaigns > Search campaign ${campaignOrigin.pricing_info.title} > Mở màn hình campaign detail > Click btn Duplicate`, async () => {
        await printbasePage.navigateToMenu("Apps");
        await appPage.openApp("Print Hub");
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(pricingInfor.title);
        await printbasePage.deleteAllCampaign(conf.suiteConf.password);
        if (caseData.case_id === "SB_PRH_DC_18") {
          await dashboard.click(printbasePage.xpathTabDraft);
        }
        await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);

        await dashboard.click(printbasePage.xpathIconDuplicate(campaignOrigin.pricing_info.title));
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbasePage.xpathPopupDuplicate,
          snapshotName: picture.picture_popup,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("2. Click checkbox keep artwork > Click btn Duplicate > Verify thông tin campaign trong màn hình editor", async () => {
        if (keepArtwork) {
          await printbasePage.verifyCheckedThenClick(printbasePage.xpathCheckboxKeepArtwork, true);
        }
        await printbasePage.clickOnBtnWithLabel("Duplicate");
        await printbasePage.removeLiveChat();
        if (caseData.case_id === "SB_PRH_DC_13") {
          await dashboard.click(printbasePage.xpathBtnAddBaseProduct);
          await dashboard.waitForTimeout(5000);
          for (let i = 0; i < productInfo.length; i++) {
            await printbasePage.addBaseProduct(productInfo[i]);
            await printbasePage.clickOnBtnWithLabel("Update campaign", 1);
          }
          await dashboard.hover(printbasePage.xpathBaseProductOnEditor(caseData.remove_base));
          await dashboard.click(printbasePage.xpathIconRemoveBase(caseData.remove_base));
          await printbasePage.clickOnBtnWithLabel("Delete", 1);
        } else if (caseData.case_id === "SB_PRH_DC_12") {
          await printbasePage.addSize(sizeAdd);
          await printbasePage.removeSize(sizeRemove);
        } else if (caseData.case_id === "SB_PRH_DC_11") {
          await printbasePage.removeColor(colorRemove);
          await printbasePage.addColor(colorAdd);
        } else if (caseData.case_id === "SB_PRH_DC_6") {
          await printbasePage.clickBtnExpand();
          await printbasePage.removeAllCustomOption();
        } else if (caseData.case_id === "SB_PRH_DC_8") {
          await printbasePage.deleteLayers(removeLayer);
          for (let i = 0; i < layers.length; i++) {
            await printbasePage.addNewLayer(layers[i]);
          }
        } else if (caseData.case_id === "SB_PRH_DC_9") {
          await printbasePage.clickBtnExpand();
          await printbasePage.clickOnBtnWithLabel("Customize layer");
          for (let i = 0; i < customOptions.length; i++) {
            await printbasePage.addCustomOption(customOptions[i]);
          }
          await printbasePage.waitUntilElementInvisible(printbasePage.xpathToastMessage);
        } else if (caseData.case_id === "SB_PRH_DC_5") {
          for (let i = 0; i < layers.length; i++) {
            await printbasePage.addNewLayer(layers[i]);
          }
        }
        await dashboard.locator(printbasePage.xpathBtnPreview).click();
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await dashboard.waitForTimeout(2000);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: picture.picture_editor,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step("3. Click btn Continue > Input title > Click btn Launch", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        const campaignID = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.inputPricingInfo(pricingInfor);
        await printbasePage.clickOnBtnWithLabel("Launch");
        if (caseData.case_id === "SB_PRH_DC_14") {
          const campaignID = await printbasePage.getIDCampaign(authRequest, pricingInfor.title, conf.suiteConf.domain);
          await hivePbase.loginToHivePrintBase(conf.suiteConf.hive_username, conf.suiteConf.hive_password);
          await hivePbase.goto(`/admin/app/pbasecampaign/${campaignID}/show`);
          await hivePbase.clickOnBtnWithLabel("Design approve", 1);
          await hivePbase.clickOnBtnWithLabel("Approve", 1);
          await dashboard.reload();
        }
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignID,
          ["available", "unavailable"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      });

      await test.step("4. Mở màn campaign detail > Verify thông tin trong màn camapign detail", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(pricingInfor.title);
        await printbasePage.openCampaignDetail(pricingInfor.title);
        await printbasePage.waitUntilElementVisible(printbasePage.xpathTitle);
        expect(await printbasePage.getTextContent(printbasePage.xpathTitle)).toEqual(`${pricingInfor.title}`);
      });
      await test.step("5. View campaign ngoài SF > Verify thông tin", async () => {
        if (caseData.case_id === "SB_PRH_DC_19") {
          const handle = await printbasePage.getTextContent(printbasePage.xpathUrl);
          await dashboard.goto(handle);
          await printbasePage.waitUntilElementVisible(printbasePage.xpathNotFound);
          expect(await printbasePage.getTextContent(printbasePage.xpathNotFound)).toEqual("404 Page Not Found");
        } else if (caseData.case_id === "SB_PRH_DC_16") {
          await homePage.gotoHomePage();
          await homePage.searchThenViewProduct(pricingInfor.title);
          for (let i = 0; i < customOptionInfo.length; i++) {
            await productSF.inputCustomOptionSF(customOptionInfo[i]);
          }
          await productSF.clickOnBtnPreviewSF();
          await dashboard.waitForTimeout(6000);
          expect(await page.locator(printbasePage.xpathPopupLivePreview(1)).screenshot()).toMatchSnapshot(
            `${picture.picture_sf}`,
            {
              threshold: threshold,
            },
          );
        } else {
          [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          const sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
          await sfProduct.waitResponseWithUrl("/assets/landing.css", 500000);
          await snapshotFixture.verify({
            page: SFPage,
            snapshotName: picture.picture_sf,
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

  test("[Phub] Verify các trường hợp không duplicate @SB_PRH_DC_4", async ({ dashboard, conf, snapshotFixture }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const pricingInfor = conf.caseConf.pricing_infor;
    const productInfor = conf.caseConf.product_infor;
    const layerList = conf.caseConf.layers;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const picture = conf.caseConf.picture;
    appPage = new Apps(dashboard, conf.suiteConf.domain);

    await test.step("1. Verify Duplicate campaign đối với campaign launching", async () => {
      await printbasePage.navigateToMenu("Apps");
      await appPage.openApp("Print Hub");
      await printbasePage.navigateToMenu("Catalog");
      for (let i = 0; i < productInfor.length; i++) {
        await printbasePage.addBaseProduct(productInfor[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await printbasePage.clickOnBtnWithLabel("Continue", 1);
      await printbasePage.inputPricingInfo(pricingInfor);
      await printbasePage.clickOnBtnWithLabel("Launch", 1);
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathRowCampaign(pricingInfor.title),
        snapshotName: picture,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });
});
