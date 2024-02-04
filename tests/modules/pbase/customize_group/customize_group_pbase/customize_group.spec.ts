/* eslint-disable prefer-const */
import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir, waitForImageLoaded, waitSelector } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { Personalize } from "@pages/dashboard/personalize";
import { SFProduct } from "@sf_pages/product";
import { HivePBase } from "@pages/hive/hivePBase";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { SFCheckout } from "@pages/storefront/checkout";
// import { prepareFile } from "@helper/file";
import { SFHome } from "@sf_pages/homepage";
import { Campaign } from "@sf_pages/campaign";
import type { Card, ShippingAddress } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { defaultSnapshotOptions } from "@constants/visual_compare";

test.describe("Customize group pbase", async () => {
  let printbasePage: PrintBasePage;
  let personalize: Personalize;
  let productSF: SFProduct;
  let productInfo: string;
  let layerList;
  let productInfoAddMore;
  let conf;
  let paramSnapshot;
  let createGroupLayer;
  let addLayersToGroup;
  let customOptions;
  let customizeGroup;
  let nameSnap;
  let campaignId;
  let conditionalLogicInfo;
  //checkout
  let homPageSF: SFHome;
  let campaignSF: Campaign;
  let checkoutSF: SFCheckout;
  let ordersPage: OrdersPage;
  //hive
  let hivePbase: HivePBase;

  const normalizeNameSnapshot = (originName: string, campTitle: string) => {
    return `${originName.replace(".", `-${campTitle}.`)}`;
  };
  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    paramSnapshot = conf.suiteConf.param_snapshot_options;

    test.setTimeout(conf.suiteConf.timeout);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    personalize = new Personalize(dashboard, conf.suiteConf.domain);
    await printbasePage.navigateToMenu("Campaigns");
  });

  const addBaseAndGotoDesignPersonalization = async (printbasePage, prodInfo: string): Promise<void> => {
    await printbasePage.clickOnBtnWithLabel("Create new campaign");
    await printbasePage.page.waitForTimeout(3000);
    await printbasePage.addBaseProducts(prodInfo);
    await printbasePage.clickOnBtnWithLabel("Update campaign");
    await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
    await printbasePage.removeLiveChat();
  };

  const createAndAddLayerToGroup = async (
    printbasePage,
    layerList: string,
    createGroupLayer: string,
    addLayersToGroup: string,
  ): Promise<void> => {
    await printbasePage.addNewLayers(layerList);
    await printbasePage.createGroupLayers(createGroupLayer);
    await printbasePage.addLayersToGroup(addLayersToGroup);
  };

  const addCustomOptionOnSF = async (homPageSF: SFHome, campaignSF: Campaign, prodName: string, customOptionShowSF) => {
    await homPageSF.gotoHomePage();
    await homPageSF.searchThenViewProduct(prodName);
    for (let i = 0; i < customOptionShowSF.list_custom.length; i++) {
      await campaignSF.inputCustomOptionOnCampSF(customOptionShowSF.list_custom[i]);
    }
  };
  const checkoutProductSF = async (
    homPageSF: SFHome,
    checkoutSF: SFCheckout,
    shippingInfo: ShippingAddress,
    cardInfo: Card,
  ): Promise<string> => {
    await homPageSF.clickOnBtnWithLabel("Add to cart");
    await homPageSF.gotoCheckout();
    await checkoutSF.enterShippingAddress(shippingInfo);
    await checkoutSF.continueToPaymentMethod();
    await checkoutSF.completeOrderWithCardInfo(cardInfo);
    return await checkoutSF.getOrderName();
  };

  test("Check hiển thị button [Customize group] ở phần Custom option @SB_PRB_DCG_01", async ({ conf }) => {
    productInfoAddMore = conf.caseConf.product_info_add_more;
    await addBaseAndGotoDesignPersonalization(printbasePage, conf.caseConf.product_info);

    await test.step("Tạo Layer và group layer. Add layer vào group layer", async () => {
      await createAndAddLayerToGroup(
        printbasePage,
        conf.caseConf.layers,
        conf.caseConf.create_group,
        conf.caseConf.add_layers_to_group,
      );
      await expect(await printbasePage.page.locator(printbasePage.getXpathWithLabel("Customize group"))).toBeHidden();
    });

    await test.step("Click Add thêm base [AOP T-Shirt] ở catalog [All Over Print]", async () => {
      await printbasePage.page.locator(printbasePage.xpathAddMoreBase).click();
      // await printbasePage.page.waitForSelector(printbasePage.xpathPresentationEditor);
      await printbasePage.page.waitForTimeout(3000);
      await printbasePage.addBaseProducts(productInfoAddMore);
      await printbasePage.clickOnBtnWithLabel("Update campaign");
      await expect(
        await printbasePage.page.locator(printbasePage.xpathBaseActive(productInfoAddMore[0].base_product)),
      ).toBeVisible();
    });

    await test.step("Click icon sync  [New group 1] và [New group 2] để sync 2 group", async () => {
      await printbasePage.page.locator(printbasePage.xpathSelectBase1st).click();
      for (let i = 0; i < conf.caseConf.create_group.length; i++) {
        await printbasePage.clickSyncGroup(conf.caseConf.create_group[i].new_group);
      }
      await printbasePage.clickBtnExpand();
      await expect(await printbasePage.page.locator(printbasePage.getXpathWithLabel("Customize group"))).toBeEnabled();
    });
  });

  conf = loadData(__dirname, "VERIFY_BTN_CUSTOMIZE_GROUP");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const dataSetting = conf.caseConf.data[i];
    test(`${dataSetting.case_description} @${dataSetting.case_id}`, async ({}) => {
      productInfo = dataSetting.product_info;
      layerList = dataSetting.layers;
      createGroupLayer = dataSetting.create_group;
      addLayersToGroup = dataSetting.add_layers_to_group;

      await addBaseAndGotoDesignPersonalization(printbasePage, productInfo);
      await createAndAddLayerToGroup(printbasePage, layerList, createGroupLayer, addLayersToGroup);

      await test.step("1. Click button 'Add text' để tạo layer:'Text layer 1',  'Text layer 2' Click button 'Add image' để tạo layer:[Layer image 1], [Layer image 2] 2. Add [Text layer 1] và [Image 1]  vào [Group 1] Add [Text layer 2] và [Image 2]  vào [Group 2] 3. Click Ungroup [Group 2]", async () => {
        await printbasePage.clickActionsGroup(createGroupLayer[1].new_group, dataSetting.acction);
        await printbasePage.clickBtnExpand();
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathWithLabel("Customize group")),
        ).toBeEnabled();
      });

      if (dataSetting.case_id === "SB_PRB_DCG_02") {
        await test.step(`4. Tạo [New group 2], Add [Text layer 2] và [Image 2]  vào [New group 2]   > Verify hiển thị btn [Customize group] ở màn list custom option5. Click vào btn "Customize group"`, async () => {
          await printbasePage.createGroupLayers([createGroupLayer[1]]);
          await printbasePage.addLayersToGroup([addLayersToGroup[1]]);
          await expect(
            await printbasePage.page.locator(printbasePage.getXpathWithLabel("Customize group")),
          ).toBeEnabled();
        });
      }
    });
  }

  test("Check [Customize group] ngoài list CO @SB_PRB_DCG_4", async ({ conf, snapshotFixture }) => {
    customOptions = conf.caseConf.custom_options;
    customizeGroup = conf.caseConf.customize_group;
    nameSnap = conf.caseConf.name_snap_shot;
    //precondition
    await addBaseAndGotoDesignPersonalization(printbasePage, conf.caseConf.product_info);
    await createAndAddLayerToGroup(
      printbasePage,
      conf.caseConf.layers,
      conf.caseConf.create_group,
      conf.caseConf.add_layers_to_group,
    );
    await test.step("1. Click [Customize group] Input thông tin Click Save 2. Click button Back lại CO list", async () => {
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOptions(customOptions);
      await printbasePage.setupCustomizeGroupForPB(customizeGroup);
      await expect(await printbasePage.page.locator(printbasePage.getXpathWithLabel("Customize group"))).toBeDisabled();
    });

    await test.step("Check action ngoài [Customize group]", async () => {
      await printbasePage.page.click(
        await printbasePage.xpathListActionOfLabel(customizeGroup.label_group, "Dots vertical"),
      );
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathListLabelInCO,
        snapshotName: nameSnap.Verify_ui_actions_of_cg,
      });
    });

    await test.step(`Click Delete [Customize group]`, async () => {
      await printbasePage.page.click(printbasePage.xpathDeleteCustomize);
      await expect(await printbasePage.page.locator(printbasePage.getXpathWithLabel("Customize group"))).toBeVisible();
    });
    await test.step(`Click vào btn "Customize group" > Click "Add other options"
      > Select default group = "Group 1" Back lại màn list custom option`, async () => {
      await printbasePage.clickOnBtnWithLabel("Customize group");
      await printbasePage.page.fill(printbasePage.xpathInputLabelCustomizeGroup, customizeGroup.label_group);
      await printbasePage.page.click(personalize.xpathAddOptionGroup);
      await printbasePage.selectOptionOfLabel("Default Group to show on the Mockups", "Group 1");
      await printbasePage.clickOnBtnWithLabel("Save");
      await printbasePage.page.click(`${printbasePage.xpathCustomizeGroupContainer}//i`);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathListLabelInCO,
        snapshotName: nameSnap.verify_ui_custom_options,
      });
    });
  });

  test(`Verify màn hình Customized group detail @SB_PRB_DCG_5`, async ({ conf, snapshotFixture }) => {
    customizeGroup = conf.caseConf.customize_group;
    nameSnap = conf.caseConf.name_snap_shot;
    //precondition
    await addBaseAndGotoDesignPersonalization(printbasePage, conf.caseConf.product_info);
    await createAndAddLayerToGroup(
      printbasePage,
      conf.caseConf.layers,
      conf.caseConf.create_group,
      conf.caseConf.add_layers_to_group,
    );

    await test.step(`Check giá trị default`, async () => {
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize group");
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: personalize.xpathCustomizeGroupDetail,
        snapshotName: nameSnap.verify_values_default,
      });
    });

    await test.step(`Check value các loại Type`, async () => {
      const listTypes = await printbasePage.page
        .locator(printbasePage.xpathListTypeOfCG)
        .evaluateAll(list => list.map(element => element.textContent.trim()));
      const checkListTypes =
        listTypes.length === conf.caseConf.list_types_of_cg.length &&
        listTypes.every((value, index) => value === conf.caseConf.list_types_of_cg[index]);
      expect(checkListTypes).toEqual(true);
    });

    await test.step(`Đổi tên [Group 1] thành Group A`, async () => {
      await printbasePage.editGroupLayer(
        conf.caseConf.create_group[0].new_group,
        conf.caseConf.group_name_after_editing,
      );
      await printbasePage.page
        .locator(printbasePage.getXpathWithLabel("Default Group to show on the Mockups"))
        .scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathValueGroupOnCG,
        snapshotName: nameSnap.verify_value_group_edit,
      });
    });

    await test.step(`Select group default = Group 2 > Click vào btn "Save"`, async () => {
      await printbasePage.selectOptionOfLabel("Default Group to show on the Mockups", "Group 2");
      await printbasePage.clickOnBtnWithLabel("Save");
      await printbasePage.isToastMsgVisible("Save customize group successfully");
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathValueGroupOnCG,
        snapshotName: `0-${nameSnap.verify_group_after_save}`,
      });
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.getXpathParentDivSelectDefault(2),
        snapshotName: `1-${nameSnap.verify_group_after_save}`,
      });
    });
    await test.step(`Back lại màn list CO > Mở lại màn customize group detail`, async () => {
      await printbasePage.page.click(`${printbasePage.xpathCustomizeGroupContainer}//i`);
      await printbasePage.page.click(printbasePage.getXpathCustomOptionListPB());
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: personalize.xpathCustomizeGroupDetail,
        snapshotName: nameSnap.verify_group_detail_after_save,
      });
    });
  });

  conf = loadData(__dirname, "VERIFY_CUSTOMIZE_GROUP_TYPE_DROPLIST_AND_RADIO");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const dataSetting = conf.caseConf.data[i];
    test(`${dataSetting.case_description} @${dataSetting.case_id}`, async ({ snapshotFixture }) => {
      //precondition
      productInfo = dataSetting.product_info;
      layerList = dataSetting.layers;
      createGroupLayer = dataSetting.create_group;
      addLayersToGroup = dataSetting.add_layers_to_group;

      await addBaseAndGotoDesignPersonalization(printbasePage, productInfo);
      await createAndAddLayerToGroup(printbasePage, layerList, createGroupLayer, addLayersToGroup);
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOptions(dataSetting.custom_options);
      await printbasePage.clickOnBtnWithLabel("Customize group");

      await test.step("Verify Label", async () => {
        await printbasePage.selectOptionOfLabel("Display the options as", dataSetting.option_item);

        for (let i = 0; i < dataSetting.verify_label.length; i++) {
          await printbasePage.inputFieldWithLabel(
            "",
            "Select number of people",
            dataSetting.verify_label[i].input_data,
          );
          await expect(
            await printbasePage.page.locator(personalize.xpathMessageError(dataSetting.type_label_customize_group)),
          ).toHaveText(dataSetting.verify_label[i].error_data);
        }
      });

      await test.step('Check Mục "Select the value" và cột "Show the group"', async () => {
        //check on 1 base
        await printbasePage.page
          .locator(printbasePage.getXpathWithLabel("Default Group to show on the Mockups"))
          .scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathValueGroupOnCG,
          snapshotName: dataSetting.name_snap_shot.verify_values_group_camp_has_1_base,
        });
        await printbasePage.clickOnBtnWithLabel("Cancel");
        await printbasePage.clickOnBtnWithLabel("Confirm");
        // check on 2 base
        //add more layer and group
        await printbasePage.addNewLayers(dataSetting.add_more_layer);
        await printbasePage.createGroupLayers(dataSetting.create_more_group);
        await printbasePage.addLayersToGroup(dataSetting.add_more_layers_to_group);
        //add more base
        await printbasePage.page.locator(printbasePage.xpathAddMoreBase).click();
        await printbasePage.page.waitForTimeout(3000);
        await printbasePage.addBaseProducts(dataSetting.add_more_base);
        await printbasePage.clickOnBtnWithLabel("Update campaign");
        await expect(
          await printbasePage.page.locator(printbasePage.xpathBaseActive(dataSetting.add_more_base[0].base_product)),
        ).toBeVisible();
        await printbasePage.page.locator(printbasePage.xpathSelectBase1st).click();

        //click icon sync Group 1 and Group 2

        await printbasePage.clickSyncGroup(dataSetting.sync_goup);
        await printbasePage.clickOnBtnWithLabel("Customize group");
        await printbasePage.selectOptionOfLabel("Display the options as", dataSetting.option_item);
        // verify values group when add more group but no sync
        await printbasePage.page
          .locator(printbasePage.getXpathWithLabel("Default Group to show on the Mockups"))
          .scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathValueGroupOnCG,
          snapshotName: dataSetting.name_snap_shot.verify_values_group_camp_has_2_base,
        });
      });

      await test.step("Sửa value Group", async () => {
        //verify group 1
        // for (let i = 0; i < dataSetting.verify_group_1.length; i++) {
        //   await printbasePage.inputFieldWithLabel("", "Group 1", dataSetting.verify_group_1[i].input_data);
        //   await expect(await printbasePage.page.locator(await printbasePage.xpathMessErrorEditGroup(1))).toHaveText(
        //     dataSetting.verify_group_1[i].error_data,
        //   );
        // }
        // fill lại giá trị ban đầu của group 1
        await printbasePage.inputFieldWithLabel("", "Group 1", "Group 1");
        //verify group 2
        await printbasePage.inputFieldWithLabel("", "Group 2", dataSetting.verify_group_2.input_data);

        await printbasePage.page
          .locator(printbasePage.getXpathWithLabel("Default Group to show on the Mockups"))
          .scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathValueGroupOnCG,
          snapshotName: dataSetting.name_snap_shot.verify_values_group_change_name_group_2,
        });
      });
    });
  }

  test("Verify [Customize group] type Picture choice @SB_PRB_DCG_8", async ({ conf, snapshotFixture }) => {
    await addBaseAndGotoDesignPersonalization(printbasePage, conf.caseConf.product_info);
    await createAndAddLayerToGroup(
      printbasePage,
      conf.caseConf.layers,
      conf.caseConf.create_group,
      conf.caseConf.add_layers_to_group,
    );

    await test.step("Verify Label ", async () => {
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize group");
      await printbasePage.selectOptionOfLabel("Display the options as", conf.caseConf.option_item);

      for (let i = 0; i < conf.caseConf.verify_label.length; i++) {
        await printbasePage.inputFieldWithLabel(
          "",
          "Select number of people",
          conf.caseConf.verify_label[i].input_data,
        );
        await expect(
          await printbasePage.page.locator(personalize.xpathMessageError(conf.caseConf.type_label_customize_group)),
        ).toHaveText(conf.caseConf.verify_label[i].error_data);
      }
    });

    await test.step('Check Mục "Select the value" và cột "Show the group"', async () => {
      //check on 1 base
      await printbasePage.page
        .locator(printbasePage.getXpathWithLabel("Default Group to show on the Mockups"))
        .scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathValueGroupOnCG,
        snapshotName: conf.caseConf.name_snap_shot.verify_values_group_camp_has_1_base,
        snapshotOptions: {
          maxDiffPixelRatio: paramSnapshot.max_diff_pixel_ratio,
          threshold: paramSnapshot.thres_hold,
          maxDiffPixels: paramSnapshot.max_diff_pixels,
        },
      });
      await printbasePage.clickOnBtnWithLabel("Cancel");
      await printbasePage.clickOnBtnWithLabel("Confirm");
      // check on 2 base
      //add more layer and group
      await printbasePage.addNewLayers(conf.caseConf.add_more_layer);
      await printbasePage.createGroupLayers(conf.caseConf.create_more_group);
      await printbasePage.addLayersToGroup(conf.caseConf.add_more_layers_to_group);
      //add more base
      await printbasePage.page.locator(printbasePage.xpathAddMoreBase).click();
      await printbasePage.addBaseProducts(conf.caseConf.add_more_base);
      await printbasePage.clickOnBtnWithLabel("Update campaign");
      await expect(
        await printbasePage.page.locator(printbasePage.xpathBaseActive(conf.caseConf.add_more_base[0].base_product)),
      ).toBeVisible();
      await printbasePage.page.locator(printbasePage.xpathSelectBase1st).click();

      //click icon sync Group 1 and Group 2

      await printbasePage.clickSyncGroup(conf.caseConf.sync_goup);
      await printbasePage.clickOnBtnWithLabel("Customize group");
      await printbasePage.selectOptionOfLabel("Display the options as", conf.caseConf.option_item);
      // verify values group when add more group but no sync
      await printbasePage.page
        .locator(printbasePage.getXpathWithLabel("Default Group to show on the Mockups"))
        .scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathValueGroupOnCG,
        snapshotName: conf.caseConf.name_snap_shot.verify_values_group_camp_has_2_base,
        snapshotOptions: {
          maxDiffPixelRatio: paramSnapshot.max_diff_pixel_ratio,
          threshold: paramSnapshot.thres_hold,
          maxDiffPixels: paramSnapshot.max_diff_pixels,
        },
      });
    });

    await test.step("Check validate upload image", async () => {
      //verify upload file img >20 mb
      // phần này playwright đang chưa có solution nên tạm thời cmt lại ạ.
      /*
      const mediaCaseS3 = conf.caseConf.verify_upload_img_more_20mb.upload_file_s3;
      await prepareFile(mediaCaseS3.s3_path, mediaCaseS3.file_path);
      await printbasePage.page.setInputFiles(
        productPageDashBoard.getXpathInputWithLabel("Upload image"),
        mediaCaseS3.file_path,
      );
      await printbasePage.isToastMsgVisible(conf.caseConf.verify_upload_img_more_20mb.message);
      */

      await printbasePage.fillDataCustomizeGroup(conf.caseConf.verify_type_pc_in_co);
      await printbasePage.page
        .locator(printbasePage.getXpathWithLabel("Default Group to show on the Mockups"))
        .scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathValueGroupOnCG,
        snapshotName: conf.caseConf.name_snap_shot.verify_upload_img_success,
        snapshotOptions: {
          maxDiffPixelRatio: paramSnapshot.max_diff_pixel_ratio,
          threshold: paramSnapshot.thres_hold,
          maxDiffPixels: paramSnapshot.max_diff_pixels,
        },
      });
    });
  });

  test("[Customize group]Check default group to show on the Mockups @SB_PRB_DCG_9", async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    await addBaseAndGotoDesignPersonalization(printbasePage, conf.caseConf.product_info);
    await createAndAddLayerToGroup(
      printbasePage,
      conf.caseConf.layers,
      conf.caseConf.create_group,
      conf.caseConf.add_layers_to_group,
    );

    await test.step(`Check các value được select`, async () => {
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize group");
      await printbasePage.selectOptionOfLabel("Display the options as", conf.caseConf.option_item);

      // verify group in Default Group to show on the Mockups
      const listGroup = await printbasePage.page
        .locator(printbasePage.xpathListDefaultGroupShowOntheMockups)
        .evaluateAll(list => list.map(element => element.textContent.trim()));
      const checkListGroupShowOnTheMockups =
        listGroup.length === conf.caseConf.list_default_group_to_show_on_the_mockups.length &&
        listGroup.every((value, index) => value === conf.caseConf.list_default_group_to_show_on_the_mockups[index]);
      expect(checkListGroupShowOnTheMockups).toEqual(true);
    });

    await test.step('Select G1. Click "Save"', async () => {
      await printbasePage.selectOptionOfLabel("Default Group to show on the Mockups", "Group 1");
      await printbasePage.clickOnBtnWithLabel("Save");
      await printbasePage.isToastMsgVisible("Save customize group successfully");
    });

    await test.step('Select G2. Click "Save"', async () => {
      await printbasePage.selectOptionOfLabel("Default Group to show on the Mockups", "Group 2");
      await printbasePage.clickOnBtnWithLabel("Save");
      await printbasePage.isToastMsgVisible("Save customize group successfully");
    });

    await test.step(`Click vào btn "Continue" > Input title "Campaign default mockup" > Click btn "Launch" > Verify launch camp thành công`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.page.waitForLoadState("networkidle");
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`Open campaign detail của camp "Campaign default mockup" > Verify hiển thị mockup trong màn campaign detail`, async () => {
      const result = await printbasePage.waitDisplayMockupDetailCampaign(conf.caseConf.pricing_info.title);
      expect(result).toBeTruthy();
      await printbasePage.page.click(printbasePage.xpathTitleOrganization);
      await snapshotFixture.verify({
        page: printbasePage.page,
        selector: printbasePage.xpathSectionImageInDetail,
        snapshotName: conf.caseConf.name_snap_shot.verify_mockup_in_detail_campaign,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Click vào btn "View", open campaign on SF > Verify hiển thị mockup của campaign trên SF`, async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.waitForImagesMockupLoaded();
      await snapshotFixture.verify({
        page: productSF.page,
        selector: productSF.getXpathMainImageOnSF(conf.caseConf.pricing_info.title),
        snapshotName: conf.caseConf.name_snap_shot.verify_layer_on_mockup,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
    await productSF.selectBase(2);
    await productSF.waitForImagesMockupLoaded();
    await snapshotFixture.verify({
      page: productSF.page,
      selector: productSF.getXpathMainImageOnSF(conf.caseConf.pricing_info.title),
      snapshotName: conf.caseConf.name_snap_shot.verify_layer_mockup_other_base,
      snapshotOptions: {
        maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
        threshold: defaultSnapshotOptions.threshold,
        maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
      },
    });
  });

  conf = loadData(__dirname, "VERIFY_CAMP_NO_HAS_CO_ON_SF");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Create and launch campain @${dataSetting.case_id}`, async ({}) => {
      //Datadriven
      productInfo = dataSetting.product_info;
      layerList = dataSetting.layers;
      createGroupLayer = dataSetting.create_group;
      addLayersToGroup = dataSetting.add_layers_to_group;

      await addBaseAndGotoDesignPersonalization(printbasePage, productInfo);
      await createAndAddLayerToGroup(printbasePage, layerList, createGroupLayer, addLayersToGroup);

      await test.step("2. Setup [Customize group] type Droplist chọn default group to show on the Mockups là [Group1]", async () => {
        await printbasePage.clickBtnExpand();
        await printbasePage.setupCustomizeGroupForPB(dataSetting.customize_group);
        await expect(
          await printbasePage.page.locator(await printbasePage.xpathBtnWithLabel("Customize group")),
        ).toBeDisabled();
      });

      await test.step("3. Click Continue > Input title camp 'Customize-group-only-droplist' > Launch camp ", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.inputPricingInfo(dataSetting.pricing_info);
        campaignId = printbasePage.getCampaignIdInPricingPage();
        await printbasePage.clickOnBtnWithLabel("Launch");
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      });
    });
  }
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Verify campaign on SF @${dataSetting.case_id}`, async ({ conf, context, snapshotFixture }) => {
      await printbasePage.navigateToMenu("Campaigns");

      await test.step("View camp ngòai SF", async () => {
        await printbasePage.openCampaignDetail(dataSetting.pricing_info.title);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        productSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await expect(productSF.genLoc(printbasePage.xpathBtnWithLabel("Preview your design", 1))).toBeVisible();
      });

      await test.step("Chọn lần lượt các option [Customize group]", async () => {
        for (let i = 0; i < dataSetting.custom_option_info.length; i++) {
          for (let j = 0; j < dataSetting.custom_option_info[i].setup_info.length; j++) {
            await productSF.inputCustomOptionSF(dataSetting.custom_option_info[i].setup_info[j]);
          }
          await productSF.clickOnBtnPreviewSF();
          await productSF.page.waitForSelector(printbasePage.xpathPopupLivePreview(1));
          const oldSrcPreviewImage = await productSF.getAttibutePreviewImage();
          let k = 1;
          let newSrcPreviewImage;
          do {
            await productSF.waitAbit(1000);
            newSrcPreviewImage = await productSF.getAttibutePreviewImage();
            k++;
          } while (newSrcPreviewImage == oldSrcPreviewImage && k < 10);

          await snapshotFixture.verify({
            page: productSF.page,
            selector: printbasePage.xpathPopupLivePreview(dataSetting.custom_option_info[i].preview_back_or_font),
            snapshotName: `${i}_${dataSetting.snap_shot_name.verify_select_group_on_sf}`,
            snapshotOptions: {
              maxDiffPixelRatio: paramSnapshot.max_diff_pixel_ratio,
              threshold: paramSnapshot.thres_hold,
              maxDiffPixels: paramSnapshot.max_diff_pixels,
            },
          });
          await productSF.closePreview();
        }
      });
    });
  }

  test(`Tạo campaign có [Customize group], có tích campaign manual design @SB_PRB_DCG_11`, async ({
    hivePBase,
    context,
    conf,
  }) => {
    await addBaseAndGotoDesignPersonalization(printbasePage, conf.caseConf.product_info);
    await createAndAddLayerToGroup(
      printbasePage,
      conf.caseConf.layers,
      conf.caseConf.create_group,
      conf.caseConf.add_layers_to_group,
    );
    const hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
    test.setTimeout(conf.suiteConf.timeout);

    await test.step(`1. Tạo [Group 1]: "[Layer image 1]", "[Layer text 1]"Tạo CO1, tích chọn camp manual design  `, async () => {
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      await printbasePage.addCustomOptions(conf.caseConf.custom_options);
      await printbasePage.page.click(printbasePage.xpathCheckboxCustomArt);
    });

    await test.step(`2. Setup [Customize group] type Droplist chọn default group to show on the Mockups là [Group1]`, async () => {
      await printbasePage.setupCustomizeGroupForPB(conf.caseConf.customize_group);
      await expect(
        await printbasePage.page.locator(await printbasePage.xpathBtnWithLabel("Customize group")),
      ).toBeDisabled();
    });

    await test.step(`3. Click Continue > Input title camp > Launch camp`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(
        await printbasePage.page.locator(
          printbasePage.xpathStatusCampaign(conf.caseConf.pricing_info.title, "in review"),
        ),
      ).toBeVisible();
      // go to hive to approve launch camp manual
      await hivePbase.goto(`/admin/app/pbasecampaign/${campaignId}/show`);
      await hivePbase.clickOnBtnWithLabel("Design approve", 1);
      await hivePbase.clickOnBtnWithLabel("Approve", 1);
      await printbasePage.page.reload();
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`4. View camp ngòai SF`, async () => {
      await printbasePage.openCampaignDetail(conf.caseConf.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await expect(productSF.genLoc(printbasePage.xpathBtnWithLabel("Preview your design", 1))).toBeHidden();
    });
  });

  conf = loadData(__dirname, "VERIFY_CAMP_HAS_HIDDEN_GROUP");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Create and launch campain @${dataSetting.case_id}`, async ({ conf }) => {
      test.setTimeout(conf.suiteConf.timeout);
      layerList = dataSetting.layers;
      createGroupLayer = dataSetting.create_group;
      addLayersToGroup = dataSetting.add_layers_to_group;
      productInfo = dataSetting.product_info;

      await test.step("1.Tại Menu: Chọn 'Campaigns'> 'All campaigns'> Click 'Create new campaign'+ Select tab 'Apparel' > Select base 'Unisex T-shirt'+ Tạo [Group 1]: '[Layer image 1]', '[Layer text 1]'+ Tạo [Group 2]: '[Layer image 2]', '[Layer text 2]'Click ẩn [Group 1]", async () => {
        //Datadriven
        await addBaseAndGotoDesignPersonalization(printbasePage, productInfo);
        await createAndAddLayerToGroup(printbasePage, layerList, createGroupLayer, addLayersToGroup);
        await printbasePage.clickHideOrShowGroup("Group 1");
        await printbasePage.clickBtnExpand();
        await expect(
          await printbasePage.page.locator(printbasePage.getXpathWithLabel("Customize group")),
        ).toBeEnabled();
      });

      await test.step("2. Setup [Customize group] type Droplist chọn default group to show on the Mockups là [Group1]", async () => {
        await printbasePage.setupCustomizeGroupForPB(dataSetting.customize_group);
        await printbasePage.isToastMsgVisible("Save customize group successfully");
      });

      await test.step("3. Click Continue > Input title camp > Launch camp ", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.inputPricingInfo(dataSetting.pricing_info);
        await printbasePage.clickOnBtnWithLabel("Launch");
        campaignId = printbasePage.getCampaignIdInPricingPage();
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      });
    });
  }
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Verify campaign on SF @${dataSetting.case_id}`, async ({ snapshotFixture }) => {
      await printbasePage.navigateToMenu("Campaigns");

      await test.step("4. View campaign detail", async () => {
        await printbasePage.openCampaignDetail(dataSetting.pricing_info.title);
        await printbasePage.clickOnImgMockupInCampDetail(1);
        await snapshotFixture.verify({
          page: printbasePage.page,
          selector: printbasePage.xpathImgDetailMockupContainer,
          snapshotName: dataSetting.snap_shot_name,
          snapshotOptions: {
            maxDiffPixelRatio: paramSnapshot.max_diff_pixel_ratio,
            threshold: paramSnapshot.thres_hold,
            maxDiffPixels: paramSnapshot.max_diff_pixels,
          },
        });
      });
    });
  }

  conf = loadData(__dirname, "VERIFY_CO_ON_SF");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Create and launch campain @${dataSetting.case_id}`, async ({}) => {
      test.setTimeout(conf.suiteConf.timeout);
      //Datadriven
      customOptions = dataSetting.custom_options;
      customizeGroup = dataSetting.customize_group;
      productInfo = dataSetting.product_info;
      layerList = dataSetting.layers;
      createGroupLayer = dataSetting.create_group;
      addLayersToGroup = dataSetting.add_layers_to_group;

      await addBaseAndGotoDesignPersonalization(printbasePage, productInfo);
      await createAndAddLayerToGroup(printbasePage, layerList, createGroupLayer, addLayersToGroup);

      await test.step("1. Tạo Custom option", async () => {
        await printbasePage.clickBtnExpand();
        await printbasePage.clickOnBtnWithLabel("Customize layer");
        await printbasePage.addCustomOptions(customOptions);
        for (let j = 0; j < customOptions.length; j++) {
          await expect(
            await printbasePage.page.locator(await printbasePage.getXpathNameLabelInCOList(customOptions[j].label)),
          ).toBeVisible();
        }
      });

      await test.step("2. Tạo [Customize group] type Radio chọn default group to show on the Mockups là [Group1] ", async () => {
        await printbasePage.setupCustomizeGroupForPB(customizeGroup);
        await expect(
          await printbasePage.page.locator(await printbasePage.xpathBtnWithLabel("Customize group")),
        ).toBeDisabled();
      });

      await test.step("Click Continue > Input title camp > Launch camp", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.inputPricingInfo(dataSetting.pricing_info);
        await printbasePage.clickOnBtnWithLabel("Launch");
        campaignId = printbasePage.getCampaignIdInPricingPage();
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      });
    });
  }
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Verify campaign on SF @${dataSetting.case_id}`, async ({ context, snapshotFixture }) => {
      test.setTimeout(conf.suiteConf.timeout);
      await printbasePage.navigateToMenu("Campaigns");

      await test.step("View camp ngòai SF", async () => {
        await printbasePage.openCampaignDetail(dataSetting.pricing_info.title);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        productSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await expect(productSF.genLoc(printbasePage.xpathBtnWithLabel("Preview your design", 1))).toBeVisible();
      });

      await test.step("Chọn lần lượt các option [Customize group]", async () => {
        for (let m = 1; m <= dataSetting.product_info.length; m++) {
          await productSF.selectBase(m);

          for (let i = 0; i < dataSetting.custom_option_info.length; i++) {
            for (let j = 0; j < dataSetting.custom_option_info[i].setup_info.length; j++) {
              await productSF.inputCustomOptionSF(dataSetting.custom_option_info[i].setup_info[j]);
            }
            await productSF.clickOnBtnPreviewSF();
            await productSF.page.waitForSelector(printbasePage.xpathPopupLivePreview());
            const oldSrcPreviewImage = await productSF.getAttibutePreviewImage();
            let k = 1;
            let newSrcPreviewImage;
            do {
              await productSF.waitAbit(1000);
              newSrcPreviewImage = await productSF.getAttibutePreviewImage();
              k++;
            } while (newSrcPreviewImage == oldSrcPreviewImage && k < 10);

            if (dataSetting.custom_option_info[i].preview_back_or_font == 2) {
              await productSF.page.click(printbasePage.xpathBtnNextPagePopupPreview);
              await productSF.page.waitForTimeout(3000);
            }
            await snapshotFixture.verify({
              page: productSF.page,
              selector: printbasePage.xpathPopupLivePreview(dataSetting.custom_option_info[i].preview_back_or_font),
              snapshotName: `${m}_${i}_${dataSetting.snap_shot_name.verify_opptions_on_sf}`,
              snapshotOptions: {
                maxDiffPixelRatio: paramSnapshot.max_diff_pixel_ratio,
                threshold: paramSnapshot.thres_hold,
                maxDiffPixels: paramSnapshot.max_diff_pixels,
              },
            });
            await productSF.closePreview();
          }
        }
      });
    });
  }

  conf = loadData(__dirname, "VERIFY_CAMP_HAVE_CONDITIONAL_LOGIC");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Create and launch campain @${dataSetting.case_id}`, async ({ dashboard }) => {
      test.setTimeout(conf.suiteConf.timeout);
      //Datadriven
      layerList = dataSetting.layers;
      customOptions = dataSetting.custom_options;
      customizeGroup = dataSetting.customize_group;
      createGroupLayer = dataSetting.create_group;
      addLayersToGroup = dataSetting.add_layers_to_group;
      productInfo = dataSetting.product_info;
      conditionalLogicInfo = dataSetting.conditional_logic_info;

      await addBaseAndGotoDesignPersonalization(printbasePage, productInfo);
      await createAndAddLayerToGroup(printbasePage, layerList, createGroupLayer, addLayersToGroup);

      await test.step("1. Tạo Custom option Tạo [Customize group] And tạo conditional logic", async () => {
        await printbasePage.clickBtnExpand();
        await printbasePage.clickOnBtnWithLabel("Customize layer");
        await printbasePage.addCustomOptions(customOptions);
        for (let j = 0; j < customOptions.length; j++) {
          await expect(
            await printbasePage.page.locator(await printbasePage.getXpathNameLabelInCOList(customOptions[j].label)),
          ).toBeVisible();
        }
        await printbasePage.setupCustomizeGroupForPB(customizeGroup);
        await expect(await dashboard.locator(await printbasePage.xpathBtnWithLabel("Customize group"))).toBeDisabled();
        for (let i = 0; i < conditionalLogicInfo.length; i++) {
          await printbasePage.clickIconAddConditionLogic(conditionalLogicInfo[i]);
          await printbasePage.addConditionalLogic(conditionalLogicInfo[i]);
          await dashboard.click(printbasePage.xpathIconBack);
        }
      });

      await test.step("Click Continue > Input title camp > Launch camp", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.inputPricingInfo(dataSetting.pricing_info);
        await printbasePage.clickOnBtnWithLabel("Launch");
        campaignId = printbasePage.getCampaignIdInPricingPage();
        const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
      });
    });
  }
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Verify campaign on SF @${dataSetting.case_id}`, async ({ context, snapshotFixture }) => {
      test.setTimeout(conf.suiteConf.timeout);
      await printbasePage.navigateToMenu("Campaigns");

      await test.step("View camp ngòai SF", async () => {
        await printbasePage.openCampaignDetail(dataSetting.pricing_info.title);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        productSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await expect(productSF.genLoc(printbasePage.xpathBtnWithLabel("Preview your design", 1))).toBeVisible();
      });

      await test.step("Chọn lần lượt các option [Customize group]", async () => {
        for (let m = 1; m <= dataSetting.product_info.length; m++) {
          await productSF.selectBase(m);

          for (let i = 0; i < dataSetting.custom_option_info.length; i++) {
            for (let j = 0; j < dataSetting.custom_option_info[i].setup_info.length; j++) {
              await productSF.inputCustomOptionSF(dataSetting.custom_option_info[i].setup_info[j]);
            }
            await productSF.clickOnBtnPreviewSF();
            await productSF.page.waitForSelector(printbasePage.xpathPopupLivePreview());
            const oldSrcPreviewImage = await productSF.getAttibutePreviewImage();
            let k = 1;
            let newSrcPreviewImage;
            do {
              await productSF.waitAbit(1000);
              newSrcPreviewImage = await productSF.getAttibutePreviewImage();
              k++;
            } while (newSrcPreviewImage == oldSrcPreviewImage && k < 10);

            if (dataSetting.custom_option_info[i].preview_back_or_font == 2) {
              await productSF.page.click(printbasePage.xpathBtnNextPagePopupPreview);
              await productSF.page.waitForTimeout(3000);
            }
            await snapshotFixture.verify({
              page: productSF.page,
              selector: printbasePage.xpathPopupLivePreview(dataSetting.custom_option_info[i].preview_back_or_font),
              snapshotName: `${m}_${i}_${dataSetting.snap_shot_name.verify_opptions_on_sf}`,
              snapshotOptions: {
                maxDiffPixelRatio: paramSnapshot.max_diff_pixel_ratio,
                threshold: paramSnapshot.thres_hold,
                maxDiffPixels: paramSnapshot.max_diff_pixels,
              },
            });
            await productSF.closePreview();
          }
        }
      });
    });
  }

  test(`Duplicate campaign có [Customize group] @SB_PRB_DCG_20`, async ({ dashboard, conf, snapshotFixture }) => {
    await test.step(`Tại Menu: Chọn "Campaigns" > "All campaigns" > Click icon Duplicate camp:
  "Customize-group-only-droplist"`, async () => {
      for (let i = 0; i < conf.caseConf.campaigns.length; i++) {
        const dataCamp = conf.caseConf.campaigns[i];
        const nameSnapShot = conf.caseConf.name_snap_shot;
        await printbasePage.navigateToMenu("Campaigns");

        await printbasePage.searchWithKeyword(dataCamp.title);
        await printbasePage.openCampaignDetail(dataCamp.title);
        await printbasePage.clickOnBtnWithLabel("Duplicate");
        await dashboard.click(printbasePage.xpathCheckboxKeepArtwork);
        await printbasePage.clickOnBtnWithLabel("Duplicate", 2);
        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
        await printbasePage.removeLiveChat();
        await printbasePage.page.click(printbasePage.getXpathBaseImgThumbnail());
        if (!(await printbasePage.page.locator(printbasePage.xpathListLabelInCO).isVisible({ timeout: 5000 }))) {
          await printbasePage.clickBtnExpand();
        }

        //verify list custom options
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbasePage.xpathListLabelInCO,
          snapshotName: normalizeNameSnapshot(nameSnapShot.verify_data_list_custom_option, dataCamp.title),
        });

        //verify list layers
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbasePage.getXpathLayerList(),
          snapshotName: normalizeNameSnapshot(nameSnapShot.verify_data_list_layer, dataCamp.title),
        });

        //verify detail custom group
        await dashboard.locator(printbasePage.getXpathNameLabelInCOList(dataCamp.select_co)).click();
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbasePage.xpathCustomizeGroupContainer,
          snapshotName: normalizeNameSnapshot(nameSnapShot.verify_data_customize_group, dataCamp.title),
        });

        await printbasePage.clickIconBackToDetailProduct();
      }
    });
  });

  test(`Import camp sang store khác @SB_PRB_DCG_21`, async ({ conf, dashboard, token, authRequest }) => {
    let productID;
    let accessToken;
    let productPage: ProductPage;
    const dashboardPageSecond = new DashboardPage(dashboard, conf.caseConf.info_shop_second.domain);
    const productPageSecond = new ProductPage(dashboardPageSecond.page, conf.caseConf.info_shop_second.domain);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    await test.step(`- Chọn all campaign có [Customize group]
  - Chọn Action "Import product to another store"
  - Chọn store được là Shop đích
  - Chọn "skip product" khi trùng handle
  - Click "Import" `, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(conf.caseConf.camp_title);
      await productPage.cloneProductToStore(conf.caseConf.clone_infos[0].clone_info, 0, 1);
      await productPage.chooseProduct(conf.caseConf.camp_title);
    });
    await test.step(`Tại Shop đích vào màn campaign detail được clone`, async () => {
      const shopToken = await token.getWithCredentials({
        domain: conf.caseConf.info_shop_second.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      accessToken = shopToken.access_token;
      // await productPage.page.pause();
      await dashboardPageSecond.loginWithToken(accessToken);
      await productPageSecond.gotoProductDetail(conf.caseConf.camp_title);
      productID = parseInt(await productPageSecond.getProductIDByURL());
      expect(
        await productPageSecond.getProductInfoDashboardByApi(
          authRequest,
          conf.caseConf.info_shop_second.domain,
          productID,
          conf.caseConf.product_detail,
          accessToken,
        ),
      ).toEqual(conf.caseConf.product_detail);
    });
    await test.step(`Tại Shop đích view products đượ clone ở StoreFront`, async () => {
      const productHandle = await productPageSecond.getProductHandlebyApi(
        authRequest,
        conf.caseConf.info_shop_second.domain,
        productID,
        accessToken,
      );
      expect(
        await productPageSecond.getProductInfoStoreFrontByApi(
          authRequest,
          conf.caseConf.info_shop_second.domain,
          productHandle,
          conf.caseConf.product_sf,
        ),
      ).toEqual(conf.caseConf.product_sf);
    });
  });

  conf = loadData(__dirname, "VERIFY_ORDER_IN_HIVE");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];

    test(`${dataSetting.case_description} @${dataSetting.case_id}`, async ({ dashboard, page, conf, hivePBase }) => {
      test.setTimeout(conf.suiteConf.timeout);
      const customOptionShowSF = dataSetting.custom_option_data_SF;
      const shippingInfo = conf.suiteConf.customer_info;
      const cardInfo = conf.suiteConf.card_info;
      let orderName;
      let orderID;
      homPageSF = new SFHome(page, conf.suiteConf.domain);
      campaignSF = new Campaign(page, conf.suiteConf.domain);
      checkoutSF = new SFCheckout(page, conf.suiteConf.domain);
      productSF = new SFProduct(page, conf.suiteConf.domain);
      await addCustomOptionOnSF(homPageSF, campaignSF, dataSetting.camp_title, customOptionShowSF);
      await productSF.selectValueProduct(dataSetting.variant_line);

      await test.step(`Checkout thành công order với các camp:"Customize_group_conditional_logic_droplist"`, async () => {
        ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
        orderName = await checkoutProductSF(homPageSF, checkoutSF, shippingInfo, cardInfo);
        await expect(checkoutSF.page).toHaveURL(/.*step=thank_you/);
        await printbasePage.navigateToMenu("Orders");
        await ordersPage.gotoOrderDetail(orderName);
        orderID = await ordersPage.getOrderIdInOrderDetail();
      });
      await test.step(`Login Hive Pbase> Chọn Customer Support> Chọn PHub Order> Click order vừa tạo Chờ order rendered artwork > Verify hiển thị mockup và artwork của line item`, async () => {
        hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
        await hivePbase.goToOrderDetail(orderID, "pbase-order");
        await hivePbase.processCompareAmountMockupRender(dataSetting.mockup_render);
        const mockupRender = await hivePbase.page.locator(hivePbase.xpathMockUpRender).count();
        const artworkRender = await hivePbase.page.locator(hivePbase.xpathArtworkRender).count();
        await expect(mockupRender).toEqual(dataSetting.mockup_render);
        await expect(artworkRender).toEqual(dataSetting.artwork_render);
      });
    });
  }

  test(`@SB_PRB_DCGP_03 Duplicate campaign chứa customize group với nhiều group layer`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const title = conf.caseConf.campaign;
    const labelCustomizeGroup = conf.caseConf.customize_group.label_group;
    const pictures = conf.caseConf.pictures;
    const listXpathNeedVerify = [printbasePage.xpathValueGroupOnCG, printbasePage.getXpathParentDivSelectDefault()];
    const objVerifyScreenshot = {
      page: printbasePage.page,
      snapshotOptions: {
        maxDiffPixelRatio: paramSnapshot.max_diff_pixel_ratio,
        threshold: paramSnapshot.thres_hold,
        maxDiffPixels: paramSnapshot.max_diff_pixels,
      },
    };
    const basesInfo = conf.caseConf.bases_info;
    const themeSetting = conf.caseConf.themes_setting;

    await test.step(`Pre condition`, async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(title);
      await printbasePage.openCampaignDetail(title);
      await printbasePage.waitForXpathState(printbasePage.xpathBtnWithLabel("Duplicate"), "stable");
      await printbasePage.clickOnBtnWithLabel("Duplicate");
      await dashboard.click(printbasePage.xpathCheckboxKeepArtwork);
      await printbasePage.clickOnBtnWithLabel("Duplicate", 2);
      await dashboard.waitForSelector(printbasePage.xpathCreateProduct);
      if (await printbasePage.page.locator(printbasePage.xpathIconOpenExpand).isVisible()) {
        await printbasePage.page.click(personalize.xpathIconPreview);
        await printbasePage.page.click(printbasePage.xpathIconBack);
      }
      await printbasePage.removeLiveChat();
    });

    await test.step(`Click vào icon Expand > Mở màn hình customize group detail > Verify hiển thị các thông tin trong customize group detail của các base`, async () => {
      for (let i = 0; i < basesInfo.length; i++) {
        await printbasePage.page.click(printbasePage.xpathBaseProductOnEditor(basesInfo[i].base_product));
        await printbasePage.page.waitForLoadState("networkidle");
        await printbasePage.page.click(printbasePage.xpathCustomOptionName(labelCustomizeGroup));
        for (let j = 0; j < listXpathNeedVerify.length; j++) {
          await snapshotFixture.verify(
            Object.assign(objVerifyScreenshot, {
              selector: listXpathNeedVerify[j],
              snapshotName: `${i}-${j}-${normalizeNameSnapshot(
                pictures.picture_dashboard,
                basesInfo[i].base_product.toLowerCase().replace(" ", "-"),
              )}`,
            }),
          );
        }
      }
    });

    await test.step(`Add thêm base "Landscape Canvas" > Verify hiển thị layer và customize group detail`, async () => {
      await printbasePage.page.click(printbasePage.xpathAddMoreBase);
      await dashboard.waitForSelector(printbasePage.xpathModal);
      await printbasePage.addBaseProducts(conf.caseConf.add_more_base);
      await printbasePage.clickOnBtnWithLabel("Update campaign");
      await expect(
        await printbasePage.page.locator(printbasePage.xpathBaseActive(conf.caseConf.add_more_base[0].base_product)),
      ).toBeVisible();
      await printbasePage.page.click(
        printbasePage.xpathBaseProductOnEditor(conf.caseConf.add_more_base[0].base_product),
      );
    });

    await test.step(`Click vào btn "Continue" > Input title cho campaign > Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      await printbasePage.clickOnBtnWithLabel("Launch");
      campaignId = printbasePage.getCampaignIdInPricingPage();
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`View campaign ngoài SF > Verify hiển thị group default ngoài SF > Select lần lượt các group > Input các custom option tương ứng > Click vào btn "Preview your design" > Verify base Landscape Canvas`, async () => {
      await printbasePage.openCampaignDetail(conf.caseConf.pricing_info.title);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      basesInfo.push({ base_product: conf.caseConf.add_more_base[0].base_product });
      for (let i = 1; i <= basesInfo.length; i++) {
        if (basesInfo[i - 1].base_product === "Landscape Puzzle") continue;
        await productSF.selectBase(i);
        for (let j = 0; j < conf.caseConf.custom_option_info.length; j++) {
          conf.caseConf.custom_option_info[j].value = `${basesInfo[i - 1].base_product}`;
          await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info[j]);
        }
        await productSF.clickOnBtnPreviewSF();
        await productSF.waitForElementVisibleThenInvisible(productSF.xpathImageLoad);
        await waitForImageLoaded(productSF.page, printbasePage.xpathImagePreviewSF());
        await snapshotFixture.verify(
          Object.assign(objVerifyScreenshot, {
            page: productSF.page,
            selector: printbasePage.xpathImagePreviewSF(),
            snapshotName: `${normalizeNameSnapshot(
              pictures.picture_sf,
              basesInfo[i - 1].base_product.toLowerCase().replace(" ", "-"),
            )}`,
          }),
        );
        await productSF.closePreview(themeSetting);
      }
    });
  });

  test(`@SB_PRB_DCG_22 Edit campaign có [Customize group]`, async ({ dashboard, conf, context, snapshotFixture }) => {
    const dataStepsEdit = Object.keys(conf.caseConf.steps_edit);
    const customizeGroup = conf.caseConf.customize_group;
    const pictures = conf.caseConf.pictures;

    const title = conf.caseConf.pricing_info.title;
    for (let i = 0; i < dataStepsEdit.length; i++) {
      await test.step(`1. Tại Menu: Chọn "Campaigns" > "All campaigns" > Click campaign Customize-group-edit`, async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(title);
        await printbasePage.openCampaignDetail(title);
        await expect(dashboard.locator(printbasePage.xpathActionBarItem)).toBeVisible();
      });

      await test.step(`Click "Edit personalization" >Edit custom option campaign > Verify ngoài SF`, async () => {
        await printbasePage.clickElementWithLabel("span", "Edit campaign setting");
        await printbasePage.waitForElementVisibleThenInvisible(`(${printbasePage.xpathIconLoading})[1]`);
        if (
          !(await printbasePage.page.locator(printbasePage.getXpathCustomOptionListPB()).isVisible({ timeout: 5000 }))
        ) {
          await printbasePage.clickBtnExpand();
        }
        await printbasePage.page.click(printbasePage.getXpathCustomOptionListPB());
        let step = conf.caseConf.steps_edit[dataStepsEdit[i]];
        if (step === "Drag Drop") {
          await printbasePage.page.locator(personalize.xpathAddOptionGroup).scrollIntoViewIfNeeded();
          await waitSelector(printbasePage.page, `(${printbasePage.xpathIconDragCustomOption})[2]`);
          await printbasePage.dragAndDrop({
            from: {
              selector: `(${printbasePage.xpathIconDragCustomOption})[1]`,
            },
            to: {
              selector: `(${printbasePage.xpathIconDragCustomOption})[2]`,
            },
          });

          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathValueGroupOnCG,
            snapshotName: `${normalizeNameSnapshot(pictures.picture_sf, step.toLowerCase().replace(" ", "-"))}`,
          });
        } else {
          if (step === "Picture Choice") {
            await printbasePage.page.locator(personalize.xpathAddOptionGroup).scrollIntoViewIfNeeded();
          }
          let customGroup = customizeGroup.filter(c => c.label_group === step);
          await printbasePage.setupCustomizeGroupForPB(customGroup[0]);
          await printbasePage.clickOnBtnWithLabel("Save change");
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
          await printbasePage.clickOnBtnWithLabel("Continue");
          await printbasePage.waitBtnEnable("Edit campaign setting");

          //verify in sf
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          productSF = new SFProduct(SFPage, conf.suiteConf.domain);
          for (let j = 0; j < customGroup[0].group_name.split(",").length; j++) {
            if (step !== "Picture Choice") continue;
            await productSF.waitForCLipartImagesLoaded();
          }
          await snapshotFixture.verify({
            page: productSF.page,
            selector: "//div[contains(@class,'product-property__field')]",
            snapshotName: `${normalizeNameSnapshot(pictures.picture_sf, step.toLowerCase().replace(" ", "-"))}`,
          });
        }
      });
    }
  });
});
