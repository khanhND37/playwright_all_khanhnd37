import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import type {
  CampaignInfo,
  DataTextField,
  Dev,
  PBPRBUp72,
  PBPRBUp93,
  PBPRBUp95,
  SbPrbLp1,
  SbPrbLp2,
  SbPrbLp3,
} from "./campaign_personalize_editor";
import { SFProduct } from "@sf_pages/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { HivePBase } from "@pages/hive/hivePBase";
import { Campaign } from "@sf_pages/campaign";

test.describe("Live preview campaigns", () => {
  let printbasePage: PrintBasePage;
  let dashboardPage: DashboardPage;
  let campaignsInfos: CampaignInfo;
  let campaignSF: Campaign;
  let campaignId: number;
  let suiteConfEnv: Dev;
  let snapshotName;
  let SFPage;
  let caseData: DataTextField;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    suiteConfEnv = conf.suiteConf as Dev;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printbasePage = new PrintBasePage(dashboard, suiteConfEnv.domain);
    dashboardPage = new DashboardPage(dashboard, suiteConfEnv.domain);
    test.setTimeout(suiteConfEnv.time_out);
  });

  test(`Verify validate các trường: Type, Label, Target layer, Font, Max length và Default value @SB_PRB_LP_1`, async ({
    cConf,
  }) => {
    const caseInfo = cConf as SbPrbLp1;
    // Tạo hàm Input value invalid and verify message validate
    const inputCoAndVerifyMesage = async (i: number, xpathMessage: string, valueInput: DataTextField) => {
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOption(valueInput.data_invalid[i]);
      await printbasePage.clickOnBtnWithLabel("Cancel", 2);
      await expect(await printbasePage.page.locator(`${xpathMessage}`)).toHaveText(valueInput.message_error[i]);
      await printbasePage.clickBackToCOList("Confirm");
    };
    await test.step(`Tại mục bên phải click + để add Custom option. Verify custom options Text field`, async () => {
      caseData = caseInfo.data_text_field;
      // Add base product
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addBaseProduct(caseData.product_info);
      // Add layer
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < caseData.layers.length; i++) {
        await printbasePage.addNewLayer(caseData.layers[i]);
      }
      // Add 1 custom option thành công
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOption(caseData.custom_options);
      // Add custom option không nhập gì
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.clickOnBtnWithLabel("Save");
      // Verify hiển thị message required nhập target layer
      await expect(printbasePage.genLoc(printbasePage.xpathMessageLayerError)).toBeVisible();
      // Verify hiển thị message required nhập font text
      await expect(printbasePage.genLoc(printbasePage.xpathMessageFontError)).toBeVisible();
      await printbasePage.clickBackToCOList("Confirm");
      // Case để trống label
      await inputCoAndVerifyMesage(0, printbasePage.xpathMessageLabel, caseData);
      // Case label trùng name CO khác
      await inputCoAndVerifyMesage(1, printbasePage.xpathMessageLabel, caseData);
      // Case để trống max_length
      await inputCoAndVerifyMesage(2, printbasePage.xpathMessageLabel, caseData);
      // Case max_length > 256 ký tự
      await inputCoAndVerifyMesage(3, printbasePage.xpathMessageLabel, caseData);
      // Case kiểm tra mối liên hệ giữa trường "Max length" và "Default value"
      await inputCoAndVerifyMesage(4, printbasePage.xpathMessageLabel, caseData);
      // Case kiểm tra mối liên hệ giữa trường "Allow characters" và "Default value"
      await inputCoAndVerifyMesage(5, printbasePage.xpathMessageLabel, caseData);
    });

    await test.step(`Tại mục bên phải click + để add Custom option. Verify custom options Text area`, async () => {
      caseData = caseInfo.data_text_area;
      // Case để trống label
      await inputCoAndVerifyMesage(0, printbasePage.xpathMessageLabel, caseData);
      // Case label trùng name CO khác
      await inputCoAndVerifyMesage(1, printbasePage.xpathMessageLabel, caseData);
      // Case để trống max_length
      await inputCoAndVerifyMesage(2, printbasePage.xpathMessageLabel, caseData);
      // Case max_length > 256 ký tự
      await inputCoAndVerifyMesage(3, printbasePage.xpathMessageLabel, caseData);
      // Case kiểm tra mối liên hệ giữa trường "Max length" và "Default value"
      await inputCoAndVerifyMesage(4, printbasePage.xpathMessageLabel, caseData);
      // Case kiểm tra mối liên hệ giữa trường "Allow characters" và "Default value"
      await inputCoAndVerifyMesage(5, printbasePage.xpathMessageLabel, caseData);
    });

    await test.step(`Tại mục bên phải click + để add Custom option. Verify custom options Image`, async () => {
      caseData = caseInfo.data_image;
      // Case để trống label
      await inputCoAndVerifyMesage(0, printbasePage.xpathMessageLabel, caseData);
      // Case label trùng name CO khác
      await inputCoAndVerifyMesage(1, printbasePage.xpathMessageLabel, caseData);
    });

    await test.step(`Tại mục bên phải click + để add Custom option. Verify custom options Picture choice`, async () => {
      caseData = caseInfo.data_picture_choice;
      // Case để trống label
      await inputCoAndVerifyMesage(0, printbasePage.xpathMessageLabel, caseData);
      // Case label trùng name CO khác
      await inputCoAndVerifyMesage(1, printbasePage.xpathMessageLabel, caseData);
    });

    await test.step(`Tại mục bên phải click + để add Custom option. Verify custom options Radio`, async () => {
      caseData = caseInfo.data_radio;
      // Case để trống label
      await inputCoAndVerifyMesage(0, printbasePage.xpathMessageLabel, caseData);
      // Case label trùng name CO khác
      await inputCoAndVerifyMesage(1, printbasePage.xpathMessageLabel, caseData);
      // Case không nhập value defaut radio
      await inputCoAndVerifyMesage(2, `${printbasePage.xpathMessageRadio}[1]`, caseData);
      // Case không nhập value radio
      await inputCoAndVerifyMesage(2, `${printbasePage.xpathMessageRadio}[2]`, caseData);
    });
    await test.step(`Tại mục bên phải click + để add Custom option. Verify custom options Droplist`, async () => {
      caseData = caseInfo.data_droplist;
      // Case để trống label
      await inputCoAndVerifyMesage(0, printbasePage.xpathMessageLabel, caseData);
      // Case label trùng name CO khác
      await inputCoAndVerifyMesage(1, printbasePage.xpathMessageLabel, caseData);
      // Case không nhập value defaut radio
      await inputCoAndVerifyMesage(2, `${printbasePage.xpathMessageRadio}[1]`, caseData);
      // Case không nhập value radio
      await inputCoAndVerifyMesage(2, `${printbasePage.xpathMessageRadio}[2]`, caseData);
    });
    await test.step(`Tại mục bên phải click + để add Custom option. Verify custom options Checkbox`, async () => {
      caseData = caseInfo.data_checkbox;
      // Case để trống label
      await inputCoAndVerifyMesage(0, printbasePage.xpathMessageLabel, caseData);
      // Case label trùng name CO khác
      await inputCoAndVerifyMesage(1, printbasePage.xpathMessageLabel, caseData);
    });
  });

  test(`Verify add/ edit folder, group clipart @SB_PRB_LP_2`, async ({ cConf }) => {
    const caseInfo = cConf as SbPrbLp2;

    await test.step(`Click "Select a folder clipart"
    Click "Add a clipart folder"
    Nhập thông tin > Click "Save changes"`, async () => {
      // Add base product
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addBaseProduct(caseInfo.product_info);
      // Add layer
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < caseInfo.layers.length; i++) {
        await printbasePage.addNewLayer(caseInfo.layers[i]);
      }
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      // Validate add clipart
      const handleValidate = async (i: number, isClickButtonSave = true) => {
        const item = caseInfo.validate_name_clipart[i];
        await printbasePage.addClipartOnCustomOption(item);
        if (isClickButtonSave) {
          await printbasePage.clickOnBtnWithLabel("Save changes", 2);
        }
        await printbasePage.page.waitForSelector(printbasePage.xpathItemErr);
        await expect(printbasePage.genLoc(printbasePage.xpathItemErr)).toBeVisible();
        await printbasePage.clickButtonOnPopUpByClass("close");
      };
      // Case name clipart null
      await handleValidate(0);
      // Case name clipart trùng tên
      await handleValidate(1, false);
      // Case image null
      await handleValidate(2, false);
      // Case image trùng tên
      await handleValidate(3, false);
      // Case image khác định dạng File hình ảnh (JPEG (.jpg, .jpeg), PNG (.png))
      await handleValidate(4, false);
      await printbasePage.clickBackToCOList("Confirm");
    });
    await test.step(`Add name folder: "Folder 1" , input ảnh hợp lệ > Click "Save changes"`, async () => {
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addClipartOnCustomOption(caseInfo.clipart);
      await printbasePage.clickOnBtnWithLabel("Save changes", 2);
      await expect(printbasePage.genLoc(printbasePage.xpathImageThumbnail)).toBeVisible();
      await printbasePage.clickOnBtnWithLabel("Save");
      await printbasePage.clickBackToCOList();
    });
    await test.step(`1. Click "Add a clipart folder"
  2. Add name folder: "Folder 1" , Add group name: "Group 1", input ảnh hợp lệ > Click "Save changes"
  3. Click "Show a droplist of clipart Group to let buyer choose first"`, async () => {
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addClipartOnCustomOption(caseInfo.clipart_group);
      await printbasePage.clickOnBtnWithLabel("Save changes", 2);
      await expect(printbasePage.genLoc(printbasePage.xpathImageThumbnail)).toBeVisible();
      await printbasePage.clickOnBtnWithLabel("Save");

      //clean data test
      await printbasePage.goToClipArtPage();
      await printbasePage.deleteClipartFolder(caseInfo.clipart.folder_name);
      await printbasePage.deleteClipartFolder(caseInfo.clipart_group.folder_name);
    });
  });

  test(`Check action đối với custom option @SB_PRB_LP_3`, async ({ cConf }) => {
    const caseInfo = cConf as SbPrbLp3;

    await test.step(`1. Tạo custom option
    2. Tại list CO, click icon action > click "Clone"
    3. Click "Save" custom option `, async () => {
      // Add base product
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addBaseProduct(caseInfo.product_info);
      // Add layer
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      for (let i = 0; i < caseInfo.layers.length; i++) {
        await printbasePage.addNewLayer(caseInfo.layers[i]);
      }
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOption(caseInfo.custom_options);
      await printbasePage.clickActionCOList("Clone");
      await printbasePage.clickOnBtnWithLabel("Save");
      await printbasePage.clickBackToCOList();
      await expect(
        printbasePage.genLoc(printbasePage.xpathLinkWithLabel(`Clone of ${caseInfo.custom_options.label}`)),
      ).toBeVisible();
    });
    await test.step(`Tại list CO, click icon action > click "Show" custom option`, async () => {
      await printbasePage.clickActionCOList("Show");
      await printbasePage.clickActionCOListAndValidate();
      await expect(printbasePage.genLoc(printbasePage.xpathTitleHide)).toBeVisible();
      await printbasePage.clickActionCOListAndValidate();
    });
    await test.step(`Tại list CO, click icon action > click "Hide" custom option`, async () => {
      await printbasePage.clickActionCOList("Hide");
      await printbasePage.clickActionCOListAndValidate();
      await expect(printbasePage.genLoc(printbasePage.xpathTitleShow)).toBeVisible();
      await printbasePage.clickActionCOListAndValidate();
    });
    await test.step(`Tại list CO, click icon action > click "Delete" custom option`, async () => {
      await printbasePage.clickActionCOList("Delete");
      await printbasePage.clickOnBtnWithLabel("Delete");
      await expect(
        printbasePage.genLoc(printbasePage.xpathLinkWithLabel(`Clone of ${caseInfo.custom_options.label}`)),
      ).not.toBeVisible();
    });
  });

  test("@PB_PRB_Up_72 - [Edit custom option] Update từng custom option cho campaing verify thông tin update ngoài SF", async ({
    cConf,
    context,
    snapshotFixture,
    dashboard,
  }) => {
    const caseConf = cConf as PBPRBUp72;
    campaignsInfos = caseConf.campaign_info;
    const customOptionEdit = caseConf.custom_options_edit;
    snapshotName = caseConf.snapshot_name;

    await test.step("Precondition: Create again campaign", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.deleteAllCampaign(suiteConfEnv.password);
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.page.waitForLoadState("networkidle", { timeout: 90000 });
      if (await printbasePage.page.locator("//div[contains(@class, 'loading-table')]").isVisible()) {
        await printbasePage.page.waitForSelector("//div[contains(@class, 'loading-table')]", {
          state: "hidden",
          timeout: 90000,
        });
      }
      campaignId = await printbasePage.launchCamp(campaignsInfos);
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Search campaign > mở campaign detail >Click button Edit personalization > Edit custom option> click button save change", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.openCampaignDetail(campaignsInfos.pricing_info.title);
      await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.editCustomOption(customOptionEdit);
      const newCampaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Continue");
      await expect(dashboard.locator(printbasePage.xpathBtnWithLabel("Editing..."))).toBeDisabled();
      await printbasePage.navigateToMenu("Campaigns");
      const isAvailable = await printbasePage.checkCampaignStatus(newCampaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Click buttonn view campaign ngoài SF > Verify thông tin của custom option", async () => {
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.openCampaignDetail(campaignsInfos.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      const campaignSF = new SFProduct(SFPage, suiteConfEnv.domain);
      await campaignSF.page.waitForSelector(printbasePage.xpathProductPropertyOnSF);

      await snapshotFixture.verify({
        page: SFPage,
        selector: printbasePage.xpathProductPropertyOnSF,
        snapshotName: snapshotName.verify_opptions_on_sf,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });

  test("@PB_PRB_Up_93 - [Campaign Type] Không cho phép update campaign custom art thành cam personalize", async ({
    dashboard,
    cConf,
    hivePBase,
  }) => {
    const caseConf = cConf as PBPRBUp93;
    campaignsInfos = caseConf.campaign_info;
    const hivePbase = new HivePBase(hivePBase, suiteConfEnv.hive_pb_domain);

    await test.step("Precondition: Create again campaign", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.deleteAllCampaign(suiteConfEnv.password);
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.page.waitForLoadState("networkidle", { timeout: 90000 });
      if (await printbasePage.page.locator("//div[contains(@class, 'loading-table')]").isVisible()) {
        await printbasePage.page.waitForSelector("//div[contains(@class, 'loading-table')]", {
          state: "hidden",
          timeout: 90000,
        });
      }
      campaignId = await printbasePage.launchCamp(campaignsInfos);
      await hivePbase.goto(`/admin/app/pbasecampaign/${campaignId}/show`);
      await hivePbase.clickOnBtnWithLabel("Design approve", 1);
      await hivePbase.clickOnBtnWithLabel("Approve", 1);
      await dashboard.reload();
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step(
      "Search campaign > mở campaign detail >Click button Edit personalization > " +
        "Mở list custom option > Verify checkbox custom art",
      async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
        await printbasePage.openCampaignDetail(campaignsInfos.pricing_info.title);
        await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.clickBtnExpand();
        await printbasePage.page.waitForSelector(printbasePage.xpathCustomOption, { timeout: 5000 });
        await printbasePage.page.waitForSelector(printbasePage.xpathPopupCustomArtOnEditor, { timeout: 5000 });
        await printbasePage.page.waitForTimeout(3000);
        await expect(await printbasePage.page.locator(printbasePage.xpathCheckboxCustomArtInput)).toBeDisabled();
      },
    );
  });

  test("@PB_PRB_Up_95 - [Performance] Campaign edit chứa nhiều base product nhiều variant", async ({
    cConf,
    context,
    snapshotFixture,
    dashboard,
  }) => {
    const caseConf = cConf as PBPRBUp95;
    campaignsInfos = caseConf.campaign_info;
    const conditionLogicInfo = caseConf.conditional_logic_info;
    const customOptionShowSF = caseConf.custom_option_show_sf;
    snapshotName = caseConf.snapshot_name;
    let oldSrcPreviewImage;
    const env = process.env.ENV;

    await test.step("Precondition: Create again campaign", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.deleteAllCampaign(suiteConfEnv.password);
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.page.waitForLoadState("networkidle", { timeout: 90000 });
      if (await printbasePage.page.locator("//div[contains(@class, 'loading-table')]").isVisible()) {
        await printbasePage.page.waitForSelector("//div[contains(@class, 'loading-table')]", {
          state: "hidden",
          timeout: 90000,
        });
      }
      campaignId = await printbasePage.launchCamp(campaignsInfos);
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(
      "Search campaign > mở campaign detail >Click button Edit personalization > " +
        "Mở list custom option > thực hiện add conditional logic cho custom option > click button Save change",
      async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
        await printbasePage.openCampaignDetail(campaignsInfos.pricing_info.title);
        await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.clickBtnExpand();
        await printbasePage.clickIconAddConditionLogic(conditionLogicInfo);
        await printbasePage.addConditionalLogic(conditionLogicInfo);
        await printbasePage.clickOnBtnWithLabel("Save change");
        const newCampaignId = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.clickOnBtnWithLabel("Continue");
        await expect(dashboard.locator(printbasePage.xpathBtnWithLabel("Editing..."))).toBeDisabled();
        await printbasePage.navigateToMenu("Campaigns");
        const isAvailable = await printbasePage.checkCampaignStatus(newCampaignId, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
      },
    );

    await test.step("Click button view  > Input  thông tin cho custom option >  Click button live preview  > Verify thông tin của hiển thị", async () => {
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.openCampaignDetail(campaignsInfos.pricing_info.title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePage.openCampaignSF()]);
      campaignSF = new Campaign(SFPage, suiteConfEnv.domain);
      await campaignSF.page.waitForSelector(printbasePage.xpathProductPropertyOnSF);
      await waitForImageLoaded(SFPage, campaignSF.xpathFirstProductImage);
      for (let i = 0; i < customOptionShowSF.list_custom.length; i++) {
        await campaignSF.inputCustomOptionOnCampSF(customOptionShowSF.list_custom[i]);
      }
      await campaignSF.clickOnBtnWithLabel("Preview your design");
      await campaignSF.page.waitForSelector(printbasePage.xpathImagePreviewSF(), { timeout: 120000 });
      await waitForImageLoaded(SFPage, printbasePage.xpathImagePreviewSF());
      oldSrcPreviewImage = await campaignSF.getAttibutePreviewImage();
      await snapshotFixture.verify({
        page: SFPage,
        selector: campaignSF.xpathPopupLivePreview(),
        snapshotName: env + snapshotName.preview_image_sf,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Select stype khác và  Verify thông tin hiển thị", async () => {
      await campaignSF.closePreview();
      await campaignSF.selectBase(caseConf.base_number);
      await campaignSF.clickOnBtnPreviewSF();
      let k = 1,
        newSrcPreviewImage;
      do {
        await campaignSF.waitAbit(1000);
        newSrcPreviewImage = await campaignSF.getAttibutePreviewImage();
        k++;
      } while (newSrcPreviewImage == oldSrcPreviewImage && k < 10);

      await campaignSF.page.waitForTimeout(1000);
      await snapshotFixture.verify({
        page: SFPage,
        selector: campaignSF.xpathPopupLivePreview(),
        snapshotName: env + snapshotName.preview_image_sf_change_base,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });
});
