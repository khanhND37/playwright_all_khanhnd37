import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFProduct } from "@sf_pages/product";
import { prepareFile } from "@helper/file";
import { snapshotDir } from "@utils/theme";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import type { Dev, Datum, CreateCampaignPersonalize } from "./create_campaign_personalize";
import { loadData } from "@core/conf/conf";

test.describe("Live preview campaigns", () => {
  let printbasePage: PrintBasePage;
  let urlCatalog: string;
  let suiteConfEnv: Dev;
  let suiteConf: CreateCampaignPersonalize;
  const caseName = "DATA_DRIVEN";
  const caseConf = loadData(__dirname, caseName);

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    suiteConf = conf.suiteConf as CreateCampaignPersonalize;
    suiteConfEnv = conf.suiteConf as Dev;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    urlCatalog = suiteConf.url_catalog;
    printbasePage = new PrintBasePage(dashboard, suiteConfEnv.domain);
    test.setTimeout(suiteConf.time_out);
  });

  caseConf.caseConf.data.forEach((caseData: Datum, index) => {
    test(`${caseData.description} @${caseData.case_code}`, async ({ context, authRequest, conf, snapshotFixture }) => {
      await test.step(`create camp ${caseData.case_code}`, async () => {
        // Pre conditions tạo campaign
        await printbasePage.goto(urlCatalog);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathPageCatalogLoad);
        for (let i = 0; i < caseData.product_info.length; i++) {
          await printbasePage.addBaseProduct(caseData.product_info[i]);
        }
        // Add layer
        await printbasePage.clickOnBtnWithLabel("Create new campaign");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.waitUntilElementVisible(printbasePage.xpathImageEditor);
        await printbasePage.clickLinkProductEditorCampaign();
        for (let i = 0; i < caseData.layers.length; i++) {
          await printbasePage.addNewLayer(caseData.layers[i]);
        }
        if (caseData.product_info.length > 1) {
          await printbasePage.clickBaseProduct(caseData.product_info[1].base_product);
          for (let i = 0; i < caseData.layers_base_2.length; i++) {
            await printbasePage.addNewLayer(caseData.layers_base_2[i]);
          }
        }
        // Add custom option
        await printbasePage.clickBtnExpand();
        await printbasePage.clickOnBtnWithLabel("Customize layer");
        for (let i = 0; i < caseData.custom_options.length; i++) {
          await printbasePage.addCustomOption(caseData.custom_options[i]);
        }
        // Click btn Continue > Input title Campaign > Launch campaign
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
        await printbasePage.page.waitForURL(`**/pricing`, { waitUntil: "networkidle" });
        await printbasePage.inputPricingInfo(caseData.pricing_info);
        await printbasePage.clickOnBtnWithLabel("Launch");
        expect(await printbasePage.isDBPageDisplay("Campaigns")).toBeTruthy();
      });

      await test.step(`${caseData.step}`, async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.getStatusOfFirstCampaign(authRequest, conf.suiteConf.domain);
        await printbasePage.searchWithKeyword(caseData.pricing_info.title);
        await printbasePage.openCampaignDetail(caseData.pricing_info.title);
        // Open second tab and view campaign
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        const campaignSF = new SFProduct(SFPage, suiteConfEnv.domain);
        await campaignSF.clickOnBtnPreviewSF();
        await campaignSF.page.waitForSelector(printbasePage.xpathImagePreviewSF());
        const oldSrcPreviewImage = await campaignSF.getAttibutePreviewImage();
        await campaignSF.closePreview(caseData.themes_setting);
        // Input data invalid and show error message
        if (caseData.message_error) {
          for (let i = 0; i < caseData.custom_option_info.length; i++) {
            if (caseData.message_error[0] === "Maximum file size is 20 MB") {
              await prepareFile(caseData.s3_path, caseData.local_path);
            }
            await campaignSF.inputCustomOptionSF(caseData.custom_option_info[i]);
            await expect(campaignSF.genLoc(campaignSF.xpathBtnWithLabel("Preview your design"))).toBeVisible();
            await campaignSF.clickOnBtnPreviewSF();
            await campaignSF.closePreview(caseData.themes_setting);
            await expect(campaignSF.genLoc(printbasePage.getXpathWithLabel(caseData.message_error[i]))).toBeVisible();
          }
        }
        // Verify thumbnail picture choice
        if (caseData.picture) {
          for (let i = 0; i < caseData.picture.length; i++) {
            await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `${caseData.picture[i]}`,
              snapshotName: `Thumbnail-${caseData.case_code}-${i}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        }
        // Input data valid success
        if (caseData.data_success) {
          for (let i = 0; i < caseData.data_success.custom_option_info.length; i++) {
            await campaignSF.inputCustomOptionSF(caseData.data_success.custom_option_info[i]);
            await expect(campaignSF.genLoc(campaignSF.xpathBtnWithLabel("Preview your design"))).toBeVisible();
            await campaignSF.clickOnBtnPreviewSF();
            let k = 1;
            let newSrcPreviewImage;
            do {
              await campaignSF.waitAbit(1000);
              newSrcPreviewImage = await campaignSF.getAttibutePreviewImage();
              k++;
            } while (newSrcPreviewImage == oldSrcPreviewImage && k < 10);
            await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
            await campaignSF.page.waitForTimeout(1000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: campaignSF.xpathPopupLivePreview(),
              snapshotName: `${caseData.case_code}-${i + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
            await campaignSF.closePreview(caseData.themes_setting);
          }
        }
        // Input multi data valid success
        else {
          for (let i = 0; i < caseData.custom_option_info.length; i++) {
            await campaignSF.inputCustomOptionSF(caseData.custom_option_info[i]);
          }
          await campaignSF.clickOnBtnPreviewSF();
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
          await campaignSF.page.waitForTimeout(1000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathPopupLivePreview(),
            snapshotName: `${caseData.case_code}-${index + 1}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }
        if (caseData.base_number) {
          await campaignSF.closePreview(caseData.themes_setting);
          await campaignSF.selectBase(caseData.base_number);
          for (let i = 0; i < caseData.custom_option_info.length; i++) {
            await campaignSF.inputCustomOptionSF(caseData.custom_option_info[i]);
          }
          await campaignSF.clickOnBtnPreviewSF();
          await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
          await campaignSF.page.waitForTimeout(1000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathPopupLivePreview(),
            snapshotName: `${caseData.case_code}-${index + 2}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(caseData.pricing_info.title);
        await printbasePage.deleteAllCampaign(suiteConfEnv.password);
      });
    });
  });
});
