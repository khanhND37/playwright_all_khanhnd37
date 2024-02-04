import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { SFProduct } from "@sf_pages/product";
import { SFHome } from "@sf_pages/homepage";
import { HivePBase } from "@pages/hive/hivePBase";
import appRoot from "app-root-path";
import path from "path";
import { defaultSnapshotOptions } from "@constants/visual_compare";

test.describe("Duplicate campaign keep artwork", () => {
  let printbasePage: PrintBasePage;
  let SFPage;
  let campainId;

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
      hivePBase,
      authRequest,
      context,
      snapshotFixture,
    }) => {
      const campaignOrigin = caseData.campaign_origin;
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      const keepArtwork = caseData.keep_artwork;
      const picture = caseData.picture;
      const threshold = conf.suiteConf.threshold;
      const pricingInfor = caseData.pricing_infor;
      const customOptionInfo = caseData.custom_option_info;
      const productSF = new SFProduct(page, conf.suiteConf.domain);
      const homePage = new SFHome(page, conf.suiteConf.domain);
      const productInfo = caseData.product_info;
      const sizeAdd = caseData.size_add;
      const sizeRemove = caseData.size_remove;
      const colorAdd = caseData.add_color;
      const colorRemove = caseData.remove_color;
      const removeLayer = caseData.remove_layers;
      const layers = caseData.layers;
      const customOptions = caseData.custom_options;
      const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);

      await test.step("Pre: Create campaign origin", async () => {
        await printbasePage.navigateToMenu("Campaigns");
        if (campaignOrigin.is_campaign_draft) {
          await dashboard.click(printbasePage.xpathTabDraft);
        }
        await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
        if (
          await dashboard
            .locator(`(//span[normalize-space() = '${campaignOrigin.pricing_info.title}'])[1]`)
            .isVisible({ timeout: 10000 })
        ) {
          return;
        } else {
          await printbasePage.navigateToMenu("Catalog");
          campainId = await printbasePage.launchCamp(campaignOrigin);
          if (!campaignOrigin.is_campaign_draft) {
            const isAvailable = await printbasePage.checkCampaignStatus(
              campainId,
              ["available", "available with basic images"],
              30 * 60 * 1000,
            );
            expect(isAvailable).toBeTruthy();
          }
        }
        if (campaignOrigin.is_available) {
          await printbasePage.navigateToMenu("Campaigns");
          await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
          await dashboard.locator(printbasePage.xpathSelectProduct(campaignOrigin.pricing_info.title)).click();
          await printbasePage.selectActionProduct("Make 1 campaign unavailable");
          await printbasePage.clickOnBtnWithLabel("Make 1 campaign unavailable");
        }
      });

      await test.step(`1. Vào màn hình All campaigns > Search campaign ${campaignOrigin} > Mở màn hình campaign detail > Click btn Duplicate`, async () => {
        await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
        await printbasePage.searchWithKeyword(pricingInfor.title);
        await printbasePage.deleteAllCampaign(conf.suiteConf.password);
        if (caseData.case_id === "SB_PRB_DC_4") {
          await dashboard.click(printbasePage.xpathTabDraft);
        }
        await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
        await dashboard.click(printbasePage.xpathIconDuplicate(campaignOrigin.pricing_info.title));
        await printbasePage.closeOnboardingPopup();
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbasePage.xpathPopupDuplicate,
          snapshotName: picture.picture_popup,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("2. Click checkbox keep artwork > Click btn Duplicate > Verify thông tin campaign trong màn hình editor", async () => {
        if (keepArtwork) {
          await printbasePage.verifyCheckedThenClick(printbasePage.xpathCheckboxKeepArtwork, true);
        }
        await printbasePage.clickOnBtnWithLabel("Duplicate");
        await printbasePage.removeLiveChat();
        if (caseData.case_id === "SB_PRB_DC_9") {
          await dashboard.click(printbasePage.xpathBtnAddBaseProduct);
          await printbasePage.addBaseProducts(productInfo);
          await printbasePage.clickOnBtnWithLabel("Update campaign", 1);
          await dashboard.hover(printbasePage.xpathBaseProductOnEditor(caseData.remove_base));
          await dashboard.click(printbasePage.xpathIconRemoveBase(caseData.remove_base));
          await printbasePage.clickOnBtnWithLabel("Delete", 1);
        } else if (caseData.case_id === "SB_PRB_DC_10") {
          await printbasePage.addSize(sizeAdd);
          await printbasePage.removeSize(sizeRemove);
        } else if (caseData.case_id === "SB_PRB_DC_11") {
          await printbasePage.removeColor(colorRemove);
          await printbasePage.addColor(colorAdd);
        } else if (caseData.case_id === "SB_PRB_DC_16") {
          await printbasePage.clickBtnExpand();
          await printbasePage.removeAllCustomOption();
        } else if (caseData.case_id === "SB_PRB_DC_14") {
          await printbasePage.deleteLayers(removeLayer);
          await printbasePage.addNewLayers(layers);
        } else if (caseData.case_id === "SB_PRB_DC_13") {
          await printbasePage.clickBtnExpand();
          await printbasePage.clickOnBtnWithLabel("Customize layer");
          await printbasePage.addCustomOptions(customOptions);
          await printbasePage.waitUntilElementInvisible(
            printbasePage.xpathToastMessageEditor("Create custom option successfully"),
          );
        } else if (caseData.case_id === "SB_PRB_DC_17") {
          await printbasePage.addNewLayers(layers);
        }
        await dashboard.locator(printbasePage.xpathBtnPreview).click();
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await dashboard.waitForTimeout(1000);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: picture.picture_editor,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });

      await test.step("3. Click btn Continue > Input title > Click btn Launch", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        const campaignID = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.inputPricingInfo(pricingInfor);
        await printbasePage.clickOnBtnWithLabel("Launch");
        if (caseData.case_id === "SB_PRB_DC_8") {
          const campaignID = await printbasePage.getIDCampaign(authRequest, pricingInfor.title, conf.suiteConf.domain);
          await hivePbase.approveCampaignCustomArt(campaignID);
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
        if (caseData.case_id === "SB_PRB_DC_3") {
          const handle = await printbasePage.getTextContent(printbasePage.xpathUrl);
          await dashboard.goto(handle);
          await printbasePage.waitUntilElementVisible(printbasePage.xpathNotFound);
          expect(await printbasePage.getTextContent(printbasePage.xpathNotFound)).toEqual("404 Page Not Found");
        } else if (caseData.case_id === "SB_PRB_DC_06" || caseData.case_id === "SB_PRB_DC_13") {
          await homePage.gotoHomePage();
          await homePage.searchThenViewProduct(pricingInfor.title);
          await productSF.inputCustomAllOptionSF(customOptionInfo);
          await productSF.clickOnBtnPreviewSF();
          await dashboard.waitForTimeout(5000);
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
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }
      });
    });
  }

  test("[PBase] Verify các trường hợp không duplicate @SB_PRB_DC_18", async ({ dashboard, conf, snapshotFixture }) => {
    const campaignOrigin = conf.caseConf.campaign_origin;
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const pricingInfor = conf.caseConf.pricing_infor;
    const productInfor = conf.caseConf.product_infor;
    const layerList = conf.caseConf.layers;
    await test.step("1. Verify Duplicate campaign đối với campaign launching", async () => {
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      await printbasePage.addBaseProducts(productInfor);
      await printbasePage.clickOnBtnWithLabel("Update campaign");
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(pricingInfor);
      await printbasePage.clickOnBtnWithLabel("Launch");
      await snapshotFixture.verify({
        page: dashboard,
        selector: `(//div[normalize-space()='${pricingInfor.title}']//ancestor::td[@class='cursor-default no-padding-important']//following-sibling::td[@class='text-right cursor-default no-padding-important']//a)[1]`,
        snapshotName: "btn_duplicate_SB_PRB_DC_18.png",
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("2. Verify duplicate campaign đối với campaign import bằng csv", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      const pathFile = path.join(appRoot + "/assets/import_product_csv/import_csv_campaigns.csv");
      await printbasePage.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, false);
      await dashboard.reload();
      await printbasePage.searchWithKeyword(campaignOrigin);
      await printbasePage.openCampaignDetail(campaignOrigin);
      await expect(await dashboard.locator(printbasePage.xpathBtnWithLabel("Duplicate"))).toBeDisabled();
    });
  });
});
