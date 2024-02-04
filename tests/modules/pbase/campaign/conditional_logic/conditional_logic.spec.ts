import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Campaign } from "@sf_pages/campaign";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { Personalize } from "@pages/dashboard/personalize";
import { ClipartPage } from "@pages/dashboard/clipart";

/**
 * Setup shop:
 * - Base product : Unisex T-Shirt
 * - clipart:
 * + folder03 : IMGA, IMGB (group01)
 * + clipart folder02 : IMG1, IMG2, IMG3, IMG4 (group01)
 * + clipart folder01 : IMG04, IMG03, IMG02, IMG01 (group01)
 */
test.describe("Conditional logic", () => {
  let printbasePage: PrintBasePage;
  let dashboardPage: DashboardPage;
  let clipartPage: ClipartPage;
  let conf;

  const verifyConditionalLogicSF = async (SFPage, campaignSF, conditionShow) => {
    await SFPage.waitForSelector(printbasePage.xpathListCoOnSF);
    for (let i = 0; i < conditionShow.list_custom.length; i++) {
      await campaignSF.inputCustomOptionOnCampSF(conditionShow.list_custom[i]);
      await campaignSF.page.waitForTimeout(2000);
      const valueShow = conditionShow.then_show_value[i].split(",").map(item => item.trim());
      for (let j = 0; j < valueShow.length; j++) {
        await expect(await SFPage.locator(printbasePage.xpathCOInListCoOnSF(valueShow[j])).isVisible()).toBe(
          conditionShow.is_show_value[i],
        );
      }
    }
  };

  const editConditionalLogic = async (dashboard, dashboardPage, pricingInfo, conditionEdit) => {
    await dashboardPage.navigateToMenu("Campaigns");
    await printbasePage.searchWithKeyword(pricingInfo.title);
    await printbasePage.openCampaignDetail(pricingInfo.title);
    await printbasePage.waitBtnEnable("Edit campaign setting");
    await printbasePage.page.click(printbasePage.getXpathWithLabel("Edit campaign setting"));
    await dashboard.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
    await printbasePage.clickBtnExpand();
    await dashboard.waitForSelector(printbasePage.getXpathWithLabel("Customize layer"));
    await printbasePage.clickIconAddConditionLogic(conditionEdit);
    await printbasePage.addConditionalLogic(conditionEdit);
  };

  const verifyFoldersClipartInDbOrSF = async (
    SFPage,
    campaignSF,
    printbasePage,
    clipartFolderVerify,
    checkFromDbOrSf: "storefront" | "database",
  ) => {
    let xpathListFolder;
    let listFolder;

    switch (checkFromDbOrSf) {
      case "storefront":
        await SFPage.waitForSelector(printbasePage.xpathListCoOnSF);
        xpathListFolder = await SFPage.locator(campaignSF.xpathListSelectOption);
        listFolder = await xpathListFolder.evaluateAll(list => list.map(element => element.textContent.trim()));
        break;
      case "database":
        xpathListFolder = await printbasePage.page.locator(printbasePage.xpathListSelectOptionInDB);
        listFolder = await xpathListFolder.evaluateAll(list => list.map(element => element.textContent.trim()));
        break;
    }
    const folderClipartMap = {};
    for (const folder of listFolder) {
      const clipartFolderSF = folder;
      folderClipartMap[clipartFolderSF] = true;
    }

    for (const FolderVerify of clipartFolderVerify) {
      const clipartFolder = FolderVerify;
      const checkResult = folderClipartMap[clipartFolder];
      expect(checkResult).toEqual(true);
    }
  };

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.time_out);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
  });

  conf = loadData(__dirname, "ADD_CONDITION");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const conditionalLogic = conf.caseConf.data[i];
    test(`${conditionalLogic.description} @${conditionalLogic.case_id}`, async ({ dashboard, context }) => {
      const conditionInfo = conditionalLogic.condition_info;
      const pricingInfo = conditionalLogic.pricing_info;
      const customOption = conditionalLogic.custom_options;
      const productInfo = conditionalLogic.product_info;
      const layerList = conditionalLogic.layers;
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);

      await test.step("PreCondition(Create campaign, Add layer, Create CO)", async () => {
        await dashboardPage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(pricingInfo.title);
        await printbasePage.deleteAllCampaign();
        await dashboardPage.navigateToMenu("Catalog");
        await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
        await printbasePage.removeLiveChat();
        await printbasePage.addNewLayers(layerList);
        await printbasePage.clickBtnAddCO();
        await printbasePage.addCustomOptions(customOption);
        for (let j = 0; j < customOption.length; j++) {
          await expect(
            await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
          ).toBeVisible();
        }
      });

      await test.step(
        "Equal chọn : Is equal to Select an option value : IMG2 " + "Then show: Image, Text, Area Click button back",
        async () => {
          await printbasePage.clickIconAddConditionLogic(conditionInfo);
          await printbasePage.addConditionalLogic(conditionInfo);
          // // Click icon Back
          await dashboard.click(printbasePage.xpathBtnBackToListCO);
          await expect(
            dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name)),
          ).toBeVisible();
        },
      );

      await test.step("Save Custom option Thực hiện Launch campaign", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.page.waitForTimeout(5000);
        await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
        const campaignId = await printbasePage.getCampaignIdInPricingPage();
        await printbasePage.inputPricingInfo(pricingInfo);
        await printbasePage.clickOnBtnWithLabel("Launch");
        const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
      });

      await test.step(
        "View campaing vừa tạo ngoài SF Click vào option Picture choice -> " + "chọn IMG02 Verify các custom option",
        async () => {
          await dashboardPage.navigateToMenu("Campaigns");
          await printbasePage.searchWithKeyword(pricingInfo.title);
          await printbasePage.openCampaignDetail(pricingInfo.title);
          // Open second tab
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          const campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
          expect(await campaignSF.getCampaignTitle()).toEqual(pricingInfo.title);
          // verify custom option
          const conditionShow = conditionalLogic.conditional_logic_show;
          await verifyConditionalLogicSF(SFPage, campaignSF, conditionShow);
        },
      );
    });
  }

  test(`@SB_PB_PRB_CL_61 [Conditional logic] Verify Custom option con ngoài SF khi đã hide conditional logic trong dashboard`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const conditionInfo = conf.caseConf.condition_info;
    const pricingInfo = conf.caseConf.pricing_info;
    const customOption = conf.caseConf.custom_options;
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    let campaignSF: Campaign;

    await test.step("PreCondition(Create campaign, Add layer, Create CO)", async () => {
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbasePage.removeLiveChat();
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickBtnAddCO();
      await printbasePage.addCustomOptions(customOption);
      for (let j = 0; j < customOption.length; j++) {
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
        ).toBeVisible();
      }
    });

    await test.step(
      "Equal chọn : Is equal to Select an option value : IMG2 " + "Then show: Image, Text, Area Click button back",
      async () => {
        await printbasePage.clickIconAddConditionLogic(conditionInfo);
        await printbasePage.addConditionalLogic(conditionInfo);
        // // Click icon Back
        await dashboard.click(printbasePage.xpathBtnBackToListCO);
        await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();
      },
    );

    await test.step(`View campign ngoài SFTại Option 1 chọn value 1`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignId = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfo);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();

      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      // Open second tab
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
      // verify custom option
      const conditionShow = conf.caseConf.conditional_logic_show;
      await verifyConditionalLogicSF(SFPage, campaignSF, conditionShow);
    });

    await test.step(`Thực hiện hide conditional logic trong dashboard`, async () => {
      await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.clickBtnExpand();
      await printbasePage.clickActionCOInListCO("CO1", "Show");
      await printbasePage.clickOnBtnWithLabel("Save change");
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignID = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.navigateToMenu("Catalog");
      await printbasePage.navigateToMenu("Campaigns");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignID, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(` View campign ngoài SF `, async () => {
      await campaignSF.page.reload();
      await expect(await campaignSF.page.locator(printbasePage.xpathListCoOnSF)).toBeHidden();
    });
  });

  test("[Conditional logic] Verify conditional logic khi thay đổi conditional logic @SB_PB_PRB_CL_62", async ({
    dashboard,
    conf,
    context,
  }) => {
    const conditionInfo = conf.caseConf.condition_info;
    const pricingInfo = conf.caseConf.pricing_info;
    const customOption = conf.caseConf.custom_options;
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    const conditionalLogicEdit = conf.caseConf.edit_conditional_logic;
    let campaignSF;
    let SFPage;

    await test.step("preconditional", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(pricingInfo.title);
      await printbasePage.deleteAllCampaign();
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbasePage.removeLiveChat();
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickBtnAddCO();
      await printbasePage.addCustomOptions(customOption);
      for (let j = 0; j < customOption.length; j++) {
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
        ).toBeVisible();
      }
      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      await printbasePage.addConditionalLogic(conditionInfo);
      // // Click icon Back
      await dashboard.click(printbasePage.xpathBtnBackToListCO);
      await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();

      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignId = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfo);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
      //open sf
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
      const urlPage = SFPage.url().split("?")[0];
      await SFPage.goto(urlPage);
    });

    for (let i = 0; i < conf.caseConf.edit_conditional_logic.length; i++) {
      await test.step(
        "Tại Dashboard , tại màn product detail, click button Edit personalization ->" +
          " Click vào icon conditional -> Edit condition logic",
        async () => {
          await editConditionalLogic(
            dashboard,
            dashboardPage,
            pricingInfo,
            conditionalLogicEdit[i].conditional_logic_edit,
          );
          await printbasePage.page.click(printbasePage.xpathBtnBackToListCO);
          await expect(
            printbasePage.page.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name)),
          ).toBeVisible();
          await printbasePage.clickBtnExpand();
        },
      );

      await test.step("Click btn Save changes -> Update -> View campaign ngoài SF", async () => {
        await printbasePage.clickOnBtnWithLabel("Save change");
        await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
        const campaignID = await printbasePage.getCampaignIdInPricingPage();
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.navigateToMenu("Campaigns");
        const isAvailable = await printbasePage.checkCampaignStatus(campaignID, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
        await SFPage.reload();
        // verify custom option
        const conditionShow = conf.caseConf.edit_conditional_logic;
        await verifyConditionalLogicSF(SFPage, campaignSF, conditionShow[i].conditional_logic_show_sf);
      });
    }
  });

  test("@SB_PB_PRB_CL_65 [Conditional logic] Check change value của CO khi nó đang được gán conditional logic Droplist", async ({
    dashboard,
    conf,
  }) => {
    const conditionInfo = conf.caseConf.condition_info;
    const customOption = conf.caseConf.custom_options;
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    const conditionalLogicEdit = conf.caseConf.conditional_logic_edit;
    const customOptionEdit = conf.caseConf.custom_options_edit;

    await test.step("preconditional", async () => {
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbasePage.removeLiveChat();
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickBtnAddCO();
      await printbasePage.addCustomOptions(customOption);
      for (let j = 0; j < customOption.length; j++) {
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
        ).toBeVisible();
      }
      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      await printbasePage.addConditionalLogic(conditionInfo);
      await dashboard.click(printbasePage.xpathBtnBackToListCO);
      await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();
    });

    await test.step("Ở Option 1 edit lại tất cả value theo thứ thự thành: value 3 , value 4 Verify các message hiển thị", async () => {
      for (let i = 0; i < customOptionEdit.length; i++) {
        await dashboard.click(printbasePage.xpathCustomOptionName(customOptionEdit[i].label_edit));
        await printbasePage.addCustomOption(customOptionEdit[i]);
      }
      await expect(
        dashboard.locator(printbasePage.xpathRedIconEditConditional(conditionInfo.custom_name)),
      ).toBeVisible();
    });

    await test.step("Config Option 1 như sau: + is equal to : value 3 OR is equal to: value 4 + Then show: option value Option 5", async () => {
      await printbasePage.clickIconAddConditionLogic(conditionalLogicEdit);
      await printbasePage.addConditionalLogic(conditionalLogicEdit);
      await dashboard.click(printbasePage.xpathBtnBackToListCO);
      await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();
    });
  });

  test("@SB_PB_PRB_CL_66 [Conditional logic] Check conditional logic của campaign với Custom option (CO) loại picture choice (PC) và chọn clipart folder  khi xóa image", async ({
    dashboard,
    conf,
    context,
  }) => {
    const conditionInfo = conf.caseConf.condition_info;
    const customOption = conf.caseConf.custom_options;
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    const pricingInfo = conf.caseConf.pricing_info;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    let personalizeSFPage;
    let campaignSF;
    let SFPage;

    await test.step("preconditional", async () => {
      // Clear clipart folder loop
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart folders");
      await clipartPage.deleteCliparts(clipartFolderInfo[0].folder_name, "Delete Clipart folders");
      // create clipart folder
      await clipartPage.addListClipart(clipartFolderInfo);
      // create co
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbasePage.removeLiveChat();
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickBtnAddCO();
      await printbasePage.addCustomOptions(customOption);
      for (let j = 0; j < customOption.length; j++) {
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
        ).toBeVisible();
      }

      if (await printbasePage.page.locator(printbasePage.xpathErrAddClipartInCO).isVisible()) {
        for (let i = 0; i < conf.caseConf.custom_options_edit.length; i++) {
          await dashboard.click(printbasePage.xpathCustomOptionName(conf.caseConf.custom_options_edit[i].label));
          await printbasePage.addCustomOption(conf.caseConf.custom_options_edit[i]);
        }
      }

      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      await printbasePage.addConditionalLogic(conditionInfo);
      // Click icon Back
      await dashboard.click(printbasePage.xpathBtnBackToListCO);
      await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();
    });

    await test.step("Click btn Continue -> Input title cho campaign > Click btn Launch", async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadImgInPriceAndDescription);
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignId = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfo);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Tại dashboard, Search 'Campaign 7' > Choose 'Campaign 7' để mở màn hình campaign detail > Click btn View để view campaign ngoài SF > Click vào option 1", async () => {
      //open sf
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
      personalizeSFPage = new Personalize(campaignSF.page, conf.suiteConf.domain);
      await campaignSF.page.waitForSelector(personalizeSFPage.xpathRadioSF);
      for (let i = 0; i < conf.caseConf.verify_list_clipart_before_edited.length; i++) {
        await expect(
          await personalizeSFPage.verifyImageVisibleOnSF(conf.caseConf.verify_list_clipart_before_edited[i], "CO1"),
        ).toEqual(true);
      }
    });

    await test.step("Tại dashboard: Library => Cliparts => clipart 02 và thực hiện xóa image 3D_3", async () => {
      await clipartPage.deleteImgInFolderClipart("Folder_66", "3");
    });

    await test.step("View campaign ngoài SF Click vào option 1", async () => {
      await campaignSF.page.reload();
      await campaignSF.page.waitForSelector(personalizeSFPage.xpathRadioSF);
      for (let i = 0; i < conf.caseConf.verify_list_clipart_after_edited.length; i++) {
        await expect(
          await personalizeSFPage.verifyImageVisibleOnSF(conf.caseConf.verify_list_clipart_after_edited[i], "CO1"),
        ).toEqual(true);
      }
    });
  });

  conf = loadData(__dirname, "EDIT_FOLDER_CLIPART");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const conditionalLogic = conf.caseConf.data[i];
    test(`${conditionalLogic.description} @${conditionalLogic.case_id}`, async ({ dashboard, conf, context }) => {
      const conditionInfo = conditionalLogic.condition_info;
      const customOption = conditionalLogic.custom_options;
      const productInfo = conditionalLogic.product_info;
      const layerList = conditionalLogic.layers;
      const pricingInfo = conditionalLogic.pricing_info;
      const clipartFolderInfo = conditionalLogic.clipart_folder_info;
      let campaignSF;
      let SFPage;
      let personalizeSFPage;

      await test.step("preconditional", async () => {
        // Clear clipart folder loop
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickElementWithLabel("p", "Clipart folders");
        await clipartPage.deleteCliparts(clipartFolderInfo[0].folder_name, "Delete Clipart folders");
        // tạo clipart folder
        await clipartPage.addListClipart(clipartFolderInfo);
        await clipartPage.page.reload();
        //Tạo campaign
        await dashboardPage.navigateToMenu("Catalog");
        await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
        await printbasePage.removeLiveChat();
        await printbasePage.addNewLayers(layerList);
        await printbasePage.clickBtnAddCO();
        await printbasePage.addCustomOptions(customOption);
        for (let j = 0; j < customOption.length; j++) {
          await expect(
            await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
          ).toBeVisible();
        }
        if (await printbasePage.page.locator(printbasePage.xpathErrAddClipartInCO).isVisible()) {
          for (let i = 0; i < conditionalLogic.custom_options_edit.length; i++) {
            await dashboard.click(printbasePage.xpathCustomOptionName(conditionalLogic.custom_options_edit[i].label));
            await printbasePage.addCustomOption(conditionalLogic.custom_options_edit[i]);
          }
        }
        await printbasePage.clickIconAddConditionLogic(conditionInfo);
        await printbasePage.addConditionalLogic(conditionInfo);
        // Click icon Back
        await dashboard.click(printbasePage.xpathBtnBackToListCO);
        await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();
      });

      await test.step(`Click btn "Continue" > Input title cho campaign > Click btn Launch`, async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadImgInPriceAndDescription);
        await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
        const campaignId = await printbasePage.getCampaignIdInPricingPage();
        await printbasePage.inputPricingInfo(pricingInfo);
        await printbasePage.clickOnBtnWithLabel("Launch");
        const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
      });

      await test.step(`Tại dashboard, Search "Campaign 8" > Choose "Campaign 8" để mở màn hình campaign detail > View campaign ngoài SF > Click vào option 1`, async () => {
        //open sf
        await dashboardPage.navigateToMenu("Campaigns");
        await printbasePage.openCampaignDetail(pricingInfo.title);
        [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
        personalizeSFPage = new Personalize(campaignSF.page, conf.suiteConf.domain);
        await SFPage.waitForLoadState("networkidle");
        for (let i = 0; i < conditionalLogic.clipart_folder_info[0].images.length; i++) {
          await expect(
            await personalizeSFPage.verifyImageVisibleOnSF(conditionalLogic.clipart_folder_info[0].images[i], "CO1"),
          ).toEqual(true);
        }
      });

      await test.step(`Tại Dashboard : Library => Cliparts => clipart 02 và thực hiện edit name image 3D_3 thành 3D_31
    Tại màn All campaign, mở màn hình campaign detail của "Campaign 8" > Click btn "Edit personalization"
    Click vào btn Expand để mở list custom option
    Custom option => Click vào icon conditional logic ở Option 1 => Click vào value ở phần condition
    Verify list image
    `, async () => {
        await clipartPage.addListClipart(conditionalLogic.edit_clipart_folder_info);
        //go to campaign perzenolize
        await dashboardPage.navigateToMenu("Campaigns");
        await printbasePage.openCampaignDetail(pricingInfo.title);
        await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
        await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
        await printbasePage.clickBtnExpand();
        await printbasePage.clickIconAddConditionLogic(conditionInfo);
        // await printbasePage.page.waitForSelector(printbasePage.xpathBlogConditionalLogic);
        verifyFoldersClipartInDbOrSF(
          SFPage,
          campaignSF,
          printbasePage,
          conditionalLogic.verify_list_clipart_after_edited,
          "database",
        );
      });

      await test.step(`View campaign ngoài SF Click vào option 1`, async () => {
        await SFPage.waitForLoadState("networkidle");
        for (let i = 0; i < conditionalLogic.verify_list_clipart_after_edited.length; i++) {
          await expect(
            await personalizeSFPage.verifyImageVisibleOnSF(conditionalLogic.verify_list_clipart_after_edited[i], "CO1"),
          ).toEqual(true);
        }
      });
    });
  }

  test(`@SB_PB_PRB_CL_69 [Conditional logic] Check conditional logic của campaign với CO loại PC và chọn clipart folder khi xóa folder clipart`, async ({
    dashboard,
    conf,
  }) => {
    const conditionInfo = conf.caseConf.condition_info;
    const customOption = conf.caseConf.custom_options;
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    const pricingInfo = conf.caseConf.pricing_info;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;

    await test.step("preconditional", async () => {
      // clear folder clipart loop
      // tạo clipart folder
      await clipartPage.addListClipart(clipartFolderInfo);
      //Tạo campaign
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbasePage.removeLiveChat();
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickBtnAddCO();
      await printbasePage.addCustomOptions(customOption);
      for (let j = 0; j < customOption.length; j++) {
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
        ).toBeVisible();
      }
      if (await printbasePage.page.locator(printbasePage.xpathErrAddClipartInCO).isVisible()) {
        for (let i = 0; i < conf.caseConf.custom_options_edit.length; i++) {
          await dashboard.click(printbasePage.xpathCustomOptionName(conf.caseConf.custom_options_edit[i].label));
          await printbasePage.addCustomOption(conf.caseConf.custom_options_edit[i]);
        }
      }

      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      await printbasePage.addConditionalLogic(conditionInfo);

      // // Click icon Back
      await dashboard.click(printbasePage.xpathBtnBackToListCO);
      await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();
    });

    await test.step(`Click btn Continue > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadImgInPriceAndDescription);
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignId = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfo);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`Tại dashboard, click vào tab Library => Cliparts => xóa folder clipart 02`, async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart folders");
      await clipartPage.deleteCliparts(clipartFolderInfo[0].folder_name, "Delete Clipart folders");
      await expect(
        dashboard.locator(
          `//a[contains(@class,'product-name')]//span[normalize-space()='${clipartFolderInfo[0].folder_name}']`,
        ),
      ).toBeHidden();
    });

    await test.step(`
  Tại màn All campaigns, Seacrh "Campaign 10" > Choose "Campaign 10" để mở màn hình campaign detail > Click vào btn "Edit personalization"
  Click btn Expand để mở list custom option
  Custom option => Click vào icon conditional logic ở Option 1 => Click vào value ở phần condition
  Verify list image
  `, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
      await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
      await printbasePage.clickBtnExpand();
      await expect(
        dashboard.locator(printbasePage.xpathRedIconEditConditional(conditionInfo.custom_name)),
      ).toBeVisible();
    });
  });

  test(`@SB_PB_PRB_CL_70 [Conditional logic] Check conditional logic của campaign với Custom option (CO) loại picture choice (PC) và chọn clipart group và xóa Folder trong group`, async ({
    conf,
    context,
    dashboard,
  }) => {
    const conditionInfo = conf.caseConf.condition_info;
    const customOption = conf.caseConf.custom_options;
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    const pricingInfo = conf.caseConf.pricing_info;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    let campaignSF;
    let SFPage;

    await test.step("preconditional", async () => {
      //add clipartFolder
      await clipartPage.addListClipart(clipartFolderInfo);
      //Tạo campaign
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbasePage.removeLiveChat();
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickBtnAddCO();
      await printbasePage.addCustomOptions(customOption);
      for (let j = 0; j < customOption.length; j++) {
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
        ).toBeVisible();
      }

      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      await printbasePage.addConditionalLogic(conditionInfo);
      // // Click icon Back
      await dashboard.click(printbasePage.xpathBtnBackToListCO);
      await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();
    });

    await test.step(`Click vào btn "Continue" > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadImgInPriceAndDescription);
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignId = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfo);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`Tại dashboard click vào btn View để view campaign ngoài SF campaign ngoài SF > Click vào option 1`, async () => {
      //open sf
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
      verifyFoldersClipartInDbOrSF(
        SFPage,
        campaignSF,
        printbasePage,
        conf.caseConf.clipart_folder_verify.clipart_folder_before_edit,
        "storefront",
      );
    });

    await test.step(`Tại dashboard: Library => Cliparts-> Group => Group_01 và thực hiện xóa Folder_3`, async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart folders");
      await clipartPage.deleteCliparts(clipartFolderInfo[0].folder_name, "Delete Clipart folders");
      expect(await printbasePage.isToastMsgVisible("Success")).toEqual(true);
    });

    await test.step(`
  Tại màn All campaign Thực hiện edit lại campaign
  Custom option => Click vào icon conditional logic ở Option 1 => Click vào value ở phần condition
  Verify list image
  `, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
      await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
      await printbasePage.clickBtnExpand();
      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      verifyFoldersClipartInDbOrSF(
        SFPage,
        campaignSF,
        printbasePage,
        conf.caseConf.clipart_folder_verify.clipart_folder_after_edit,
        "database",
      );
    });

    await test.step(`View campaign ngoài SF Click vào option 1`, async () => {
      await campaignSF.page.reload();
      verifyFoldersClipartInDbOrSF(
        SFPage,
        campaignSF,
        printbasePage,
        conf.caseConf.clipart_folder_verify.clipart_folder_after_edit,
        "storefront",
      );
    });
  });

  test(`@SB_PB_PRB_CL_71 [Conditional logic] Check conditional logic của campaign với CO loại PC và chọn clipart Group và edit name Folder`, async ({
    conf,
    context,
    dashboard,
  }) => {
    const conditionInfo = conf.caseConf.condition_info;
    const customOption = conf.caseConf.custom_options;
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    const pricingInfo = conf.caseConf.pricing_info;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const clipartFolderInfoEdit = conf.caseConf.edit_clipart_folder_info;
    let campaignSF;
    let SFPage;

    await test.step("preconditional", async () => {
      // clear clipart loop
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart folders");
      await clipartPage.deleteCliparts(clipartFolderInfoEdit[0].folder_name, "Delete Clipart folders");
      //add clipartFolder
      await clipartPage.addListClipart(clipartFolderInfo);
      //Tạo campaign
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbasePage.removeLiveChat();
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickBtnAddCO();
      await printbasePage.addCustomOptions(customOption);
      for (let j = 0; j < customOption.length; j++) {
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
        ).toBeVisible();
      }
      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      await printbasePage.addConditionalLogic(conditionInfo);
      await dashboard.click(printbasePage.xpathBtnBackToListCO);
      await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();
    });

    await test.step(`Click vào btn "Continue" > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadImgInPriceAndDescription);
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignId = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfo);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`View campaign ngoài SF Click vào option 1`, async () => {
      //open sf
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
      verifyFoldersClipartInDbOrSF(
        SFPage,
        campaignSF,
        printbasePage,
        conf.caseConf.clipart_folder_verify.clipart_folder_before_edit,
        "storefront",
      );
    });

    await test.step(`Tại Dashboard : Library => Cliparts-> Group => Group_01 và thực hiện edit name của Folder_3 thành Folder_3_update`, async () => {
      await clipartPage.addListClipart(clipartFolderInfoEdit);
      await clipartPage.closeOnboardingPopup();
      await clipartPage.page.click(clipartPage.xpathBtnBackToListClipart);
      await expect(
        dashboard.locator(clipartPage.getXpathWithLabel(clipartFolderInfoEdit[0].folder_name, 1)),
      ).toBeVisible();
    });

    await test.step(`
  Tại màn All campaigns, mở màn hình campaign detail của "Campaign 11" > Click btn "Edit personalization"
  Click btn Expand để mở list custom option
  Custom option => Click vào icon conditional logic ở Option 1 => Click vào value ở phần condition
  Verify list image
  `, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
      await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
      await printbasePage.clickBtnExpand();
      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      verifyFoldersClipartInDbOrSF(
        SFPage,
        campaignSF,
        printbasePage,
        conf.caseConf.clipart_folder_verify.clipart_folder_after_edit,
        "database",
      );
    });

    await test.step(`View campaign ngoài SF Click vào option 1`, async () => {
      await campaignSF.page.reload();
      verifyFoldersClipartInDbOrSF(
        SFPage,
        campaignSF,
        printbasePage,
        conf.caseConf.clipart_folder_verify.clipart_folder_after_edit,
        "storefront",
      );
    });
  });

  test(`@SB_PB_PRB_CL_72 [Conditional logic] Check conditional logic của campaign với CO loại PC và chọn clipart group khi thêm Folder`, async ({
    conf,
    context,
    dashboard,
  }) => {
    const conditionInfo = conf.caseConf.condition_info;
    const customOption = conf.caseConf.custom_options;
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    const pricingInfo = conf.caseConf.pricing_info;
    const clipartFolderInfo2 = conf.caseConf.add_more_clipart_folder_info;
    let campaignSF;
    let SFPage;

    await test.step("preconditional", async () => {
      // clear clipart loop
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart folders");
      await clipartPage.deleteCliparts(clipartFolderInfo2[0].folder_name, "Delete Clipart folders");

      //Tạo campaign
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbasePage.removeLiveChat();
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickBtnAddCO();
      await printbasePage.addCustomOptions(customOption);
      for (let j = 0; j < customOption.length; j++) {
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
        ).toBeVisible();
      }

      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      await printbasePage.addConditionalLogic(conditionInfo);
      await dashboard.click(printbasePage.xpathBtnBackToListCO);
      await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();
    });

    await test.step(`Click btn Continue > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadImgInPriceAndDescription);
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignId = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfo);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`View campaign ngoài SF Click vào option 1`, async () => {
      //open sf
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      campaignSF = new Campaign(SFPage, conf.suiteConf.domain);

      await verifyFoldersClipartInDbOrSF(
        SFPage,
        campaignSF,
        printbasePage,
        conf.caseConf.clipart_folder_verify.clipart_folder_before_edit,
        "storefront",
      );
    });

    await test.step(`Tại Dashboard : Library => Cliparts-> Group => Group_01 và thực hiện add thêm Folder_4`, async () => {
      await clipartPage.addListClipart(clipartFolderInfo2);
      await clipartPage.closeOnboardingPopup();
      await clipartPage.page.click(clipartPage.xpathBtnBackToListClipart);
      await expect(
        dashboard.locator(clipartPage.getXpathWithLabel(clipartFolderInfo2[0].folder_name, 1)),
      ).toBeVisible();
    });

    await test.step(`
    Tại màn All campaign, mở màn hình campaign detail của "Campaign 12" > Click btn "Edit personalization"
    Click btn Expand để mở màn hình list custom option
    Custom option => Click vào icon conditional logic ở Option 1 => Click vào value ở phần condition
    Verify list image
    `, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
      await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
      await printbasePage.clickBtnExpand();
      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      verifyFoldersClipartInDbOrSF(
        SFPage,
        campaignSF,
        printbasePage,
        conf.caseConf.clipart_folder_verify.clipart_folder_after_edit,
        "database",
      );
    });

    await test.step(`View campaign ngoài SF Click vào option 1`, async () => {
      await campaignSF.page.reload();
      verifyFoldersClipartInDbOrSF(
        SFPage,
        campaignSF,
        printbasePage,
        conf.caseConf.clipart_folder_verify.clipart_folder_after_edit,
        "storefront",
      );
    });
  });

  test(`@SB_PB_PRB_CL_73 [Conditional logic] Check conditional logic của campaign với CO loại PC và chọn clipart group khi xóa clipart group`, async ({
    conf,
    dashboard,
  }) => {
    const conditionInfo = conf.caseConf.condition_info;
    const customOption = conf.caseConf.custom_options;
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    const pricingInfo = conf.caseConf.pricing_info;
    const groupClipartInfo = conf.caseConf.clipart_group_info;

    await test.step("preconditional", async () => {
      // clear group loop name
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.deleteCliparts(groupClipartInfo.group_name, "Delete Clipart groups");
      // add group clipart
      await clipartPage.clickOnBtnWithLabel("Create group", 1);
      await clipartPage.addGroupClipart(groupClipartInfo);
      await clipartPage.page.reload();
      //Tạo campaign
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbasePage.removeLiveChat();
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickBtnAddCO();
      await printbasePage.addCustomOptions(customOption);
      for (let j = 0; j < customOption.length; j++) {
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
        ).toBeVisible();
      }
      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      await printbasePage.addConditionalLogic(conditionInfo);
      await dashboard.click(printbasePage.xpathBtnBackToListCO);
      await expect(dashboard.locator(printbasePage.getXpathEditConditional(conditionInfo.custom_name))).toBeVisible();
    });

    await test.step(`Click btn Continue > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadImgInPriceAndDescription);
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignId = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfo);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`Library => Cliparts => Group =>xóa Group_01`, async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.deleteCliparts(groupClipartInfo.group_name, "Delete Clipart groups");
    });

    await test.step(`
    Tại màn All campaign, mở màn hình campaign detail của "Campaign 13" > Click btn "Edit personalization"
    Click btn Expand để mở màn hình list custom option
    Custom option => Click vào icon conditional logic ở Option 1 => Click vào value ở phần condition
    Verify list image
    `, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
      await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
      await printbasePage.clickBtnExpand();
      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      await expect(printbasePage.page.locator(printbasePage.xpathMessErrBlankCondional)).toBeVisible();
    });
  });
  test(`@SB_PB_PRB_CL_75 [Conditional logic] Check duplicate campaing có conditional logic`, async ({
    dashboard,
    conf,
  }) => {
    const conditionInfo = conf.caseConf.condition_info;
    const customOption = conf.caseConf.custom_options;
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    const pricingInfo = conf.caseConf.pricing_info;
    let campaignSF;
    let SFPage;

    await test.step("preconditional", async () => {
      //Tạo campaign
      await dashboardPage.navigateToMenu("Catalog");
      await printbasePage.addProductFromCatalog(productInfo.category, productInfo.product_name);
      await printbasePage.removeLiveChat();
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickBtnAddCO();
      await printbasePage.addCustomOptions(customOption);
      for (let j = 0; j < customOption.length; j++) {
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathNameLabelInCOList(customOption[j].label)),
        ).toBeVisible();
      }

      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      await printbasePage.addConditionalLogic(conditionInfo);
      await dashboard.click(printbasePage.xpathBtnBackToListCO);
      //launch camp
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadImgInPriceAndDescription);
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignId = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfo);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`Click btn Duplicate của Campaign A ở màn hình list campaign và  tích chọn "Duplicate the artworks and custom options of the original campaign"`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(pricingInfo.title);
      await printbasePage.clickOnBtnWithLabel("Duplicate");
      await dashboard.click(printbasePage.xpathCheckboxKeepArtwork);
      await printbasePage.clickOnBtnWithLabel("Duplicate", 2);
      //launch camp
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadImgInPriceAndDescription);
      await printbasePage.waitUntilElementVisible(printbasePage.xpathPricingPage);
      const campaignId = await printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info_duplicate);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`Verify conditional logic`, async () => {
      await dashboardPage.navigateToMenu("Campaigns");
      await printbasePage.openCampaignDetail(conf.caseConf.pricing_info_duplicate.title);
      await printbasePage.clickOnBtnWithLabel("Edit campaign setting");
      await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
      await printbasePage.clickBtnExpand();
      await printbasePage.clickIconAddConditionLogic(conditionInfo);
      verifyFoldersClipartInDbOrSF(
        SFPage,
        campaignSF,
        printbasePage,
        conf.caseConf.conditional_logic_verify.conditional_logic_shop_1,
        "database",
      );
    });
  });
});
