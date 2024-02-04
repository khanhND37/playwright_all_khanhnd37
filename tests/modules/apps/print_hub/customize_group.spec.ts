import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { Apps } from "@pages/dashboard/apps";
import { snapshotDir } from "@utils/theme";
import { SBPage } from "@pages/page";
import { loadData } from "@core/conf/conf";
import { SFProduct } from "@sf_pages/product";
import { Personalize } from "@pages/dashboard/personalize";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { HivePBase } from "@pages/hive/hivePBase";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage as ProductPageInDashBoard } from "@pages/shopbase_creator/dashboard/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";

test.describe("Customize group phub", async () => {
  let printbasePage: PrintBasePage;
  let appsPage: Apps;
  let sbPage: SBPage;
  let productInfo;
  let layerList;
  let productInfoAddMore;
  let customOptions;
  let customizeGroup;
  let campaignSF: SFProduct;
  let personalize: Personalize;
  let conf;
  let listGroup;
  let nameSnap;
  let campaignId;
  let conditionalLogicInfo;
  let createGroupLayer;
  let addLayersToGroup;
  let productPage: ProductPage;
  let productPageInDashBoard: ProductPageInDashBoard;
  //checkout
  let email, domain, shippingAddress, productCheckout;
  let checkoutAPI: CheckoutAPI;
  let checkout: SFCheckout;
  let themeSetting: SettingThemeAPI;
  let orderID;

  //hive
  let hivePbase: HivePBase;

  test.beforeEach(async ({ conf, dashboard, authRequest, theme }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);

    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appsPage = new Apps(dashboard, conf.suiteConf.domain);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    listGroup = conf.caseConf.create_group_and_add_layer;
    nameSnap = conf.caseConf.name_snap_shot;

    //precondition for case have checkout
    domain = conf.suiteConf.domain;
    checkoutAPI = new CheckoutAPI(domain, authRequest, dashboard);
    checkout = new SFCheckout(dashboard, domain);
    themeSetting = new SettingThemeAPI(theme);

    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address;
    await themeSetting.editCheckoutLayout("one-page");
  });

  const goToCreateCampaigns = async (appsPage, printbasePage, dashboard): Promise<void> => {
    await printbasePage.navigateToMenu("Apps");
    await appsPage.openApp("Print Hub");
    await printbasePage.navigateToMenu("Catalog");
    await printbasePage.clickOnBtnWithLabel("Create new campaign");
    for (let i = 0; i < productInfo.length; i++) {
      await dashboard.waitForSelector(printbasePage.xpathPresentationEditor);
      await printbasePage.addBaseProduct(productInfo[i]);
    }
    await printbasePage.clickOnBtnWithLabel("Update campaign");
    await dashboard.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
    await printbasePage.removeLiveChat();
  };

  const createAndAddLayerForGroup = async (): Promise<void> => {
    for (let i = 0; i < listGroup.length; i++) {
      await printbasePage.createGroupLayer(listGroup[i].current_group, listGroup[i].new_group);
      for (let j = 0; j < listGroup[i].data_group.length; j++) {
        await printbasePage.addLayerToGroup(listGroup[i].data_group[j], listGroup[i].new_group);
      }
    }
  };

  test("Check hiển thị button [Customize group] ở phần Custom option @SB_PRH_CGPH_01", async ({ dashboard, conf }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appsPage = new Apps(dashboard, conf.suiteConf.domain);
    productInfo = conf.caseConf.product_info;
    productInfoAddMore = conf.caseConf.product_info_add_more;
    layerList = conf.caseConf.layers;

    await goToCreateCampaigns(appsPage, printbasePage, dashboard);

    await test.step("create layer, group and add layer for group", async () => {
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await createAndAddLayerForGroup();
    });

    await test.step("Click Add thêm base [AOP T-Shirt] ở catalog [All Over Print]", async () => {
      await dashboard.locator(printbasePage.xpathAddMoreBase).click();
      await dashboard.waitForTimeout(3000);
      for (let i = 0; i < productInfoAddMore.length; i++) {
        await printbasePage.addBaseProduct(productInfoAddMore[i]);
        await printbasePage.clickOnBtnWithLabel("Update campaign");
        await expect(
          await dashboard.locator(await printbasePage.xpathBaseActive(productInfoAddMore[i].base_product)),
        ).toBeVisible();
      }
    });

    await test.step("Click icon sync  [New group 1] và [New group 2] để sync 2 group", async () => {
      await dashboard.locator(printbasePage.xpathSelectBase1st).click();
      for (let i = 0; i < listGroup.length; i++) {
        await printbasePage.clickSyncGroup(listGroup[i].new_group);
      }
      await printbasePage.clickBtnExpand();
      await expect(await dashboard.locator(await printbasePage.getXpathWithLabel("Customize group"))).toBeEnabled();
    });
  });

  test("Check hiển thị button [Customize group] khi ungroup @SB_PRH_CGPH_02", async ({ dashboard, conf }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appsPage = new Apps(dashboard, conf.suiteConf.domain);
    productInfo = conf.caseConf.product_info;
    layerList = conf.caseConf.layers;

    await goToCreateCampaigns(appsPage, printbasePage, dashboard);

    await test.step("1. Click button 'Add text' để tạo layer:'Text layer 1',  'Text layer 2' Click button 'Add image' để tạo layer:[Layer image 1], [Layer image 2] 2. Add [Text layer 1] và [Image 1]  vào [Group 1] Add [Text layer 2] và [Image 2]  vào [Group 2] 3. Click Ungroup [Group 2]", async () => {
      await test.step("create layer, group and add layer for group", async () => {
        for (let i = 0; i < layerList.length; i++) {
          await printbasePage.addNewLayer(layerList[i]);
        }
        await createAndAddLayerForGroup();
      });
      await printbasePage.clickActionsGroup(listGroup[1].new_group, "Ungroup");
      await printbasePage.clickBtnExpand();
      await expect(await dashboard.locator(await printbasePage.getXpathWithLabel("Customize group"))).toBeHidden();
    });
  });
  test("Check hiển thị button [Customize group] khi Delete group @SB_PRH_CGPH_3", async ({ dashboard, conf }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appsPage = new Apps(dashboard, conf.suiteConf.domain);
    productInfo = conf.caseConf.product_info;
    layerList = conf.caseConf.layers;

    await goToCreateCampaigns(appsPage, printbasePage, dashboard);

    await test.step("1. Click button Add text để tạo layer: Text layer 1, Text layer 2 Click button Add image để tạo layer: [Layer image 1], [Layer image 2] 2. Add [Text layer 1] và[Image 1] vào [Group 1] Add [Text layer 2] và [Image 2] vào [Group 2] 3. Click Xóa [Group 2]", async () => {
      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }
      await createAndAddLayerForGroup();
      await printbasePage.clickActionsGroup(listGroup[1].new_group, "Delete");
      await printbasePage.clickBtnExpand();
      await expect(await dashboard.locator(await printbasePage.getXpathWithLabel("Customize group"))).toBeHidden();
    });
  });

  test("Check [Customize group] ngoài list CO @SB_PRH_CGPH_4", async ({ dashboard, conf, snapshotFixture }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appsPage = new Apps(dashboard, conf.suiteConf.domain);
    sbPage = new SBPage(dashboard, conf.suiteConf.domain);
    productInfo = conf.caseConf.product_info;
    layerList = conf.caseConf.layers;
    customOptions = conf.caseConf.custom_options;
    customizeGroup = conf.caseConf.customize_group;

    await goToCreateCampaigns(appsPage, printbasePage, dashboard);

    for (let i = 0; i < layerList.length; i++) {
      await printbasePage.addNewLayer(layerList[i]);
    }
    await createAndAddLayerForGroup();
    await printbasePage.clickBtnExpand();
    await printbasePage.clickOnBtnWithLabel("Customize layer");
    for (let i = 0; i < customOptions.length; i++) {
      await printbasePage.addCustomOption(customOptions[i]);
    }

    await test.step("1. Click [Customize group] Input thông tin Click Save 2. Click button Back lại CO list", async () => {
      await printbasePage.setupCustomizeGroupForPB(customizeGroup);
      await dashboard.locator(await printbasePage.getXpathWithLabel("Customize group")).isDisabled();
    });
    await test.step("Check action ngoài [Customize group]", async () => {
      await snapshotFixture.verify({
        page: dashboard,
        selector: await printbasePage.xpathListActionOfLabel(customizeGroup.label_group, "List"),
        snapshotName: nameSnap,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Move [Customize group] lên top", async () => {
      await sbPage.dragAndDrop({
        from: {
          selector: await printbasePage.xpathListActionOfLabel(customizeGroup.label_group, "Drag"),
        },
        to: {
          selector: await printbasePage.xpathListActionOfLabel(customizeGroup.label_group, "Drag"),
        },
      });

      const list1 = await printbasePage.getlistCustomOption();
      await expect(await list1[0]).toEqual(customizeGroup.label_group);
    });

    await test.step("Move [Customize group] xuống giữa list CO", async () => {
      await sbPage.dragAndDrop({
        from: {
          selector: await printbasePage.xpathListActionOfLabel(customizeGroup.label_group, "Drag"),
        },
        to: {
          selector: await printbasePage.xpathListActionOfLabel(conf.caseConf.custom_options[0].label, "Drag"),
        },
      });
      const list2 = await printbasePage.getlistCustomOption();
      await expect(await list2[(list2.length - 1) / 2]).toEqual(customizeGroup.label_group);
    });

    await test.step("Move [Customize group] xuống cuối list CO", async () => {
      await sbPage.dragAndDrop({
        from: {
          selector: await printbasePage.xpathListActionOfLabel(customizeGroup.label_group, "Drag"),
        },
        to: {
          selector: await printbasePage.xpathListActionOfLabel(conf.caseConf.custom_options[1].label, "Drag"),
        },
      });
      const list3 = await printbasePage.getlistCustomOption();
      await expect(await list3[list3.length - 1]).toEqual(customizeGroup.label_group);
    });
  });

  test("Verify màn hình Customized group detail @SB_PRH_CGPH_5", async ({ dashboard, conf, snapshotFixture }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appsPage = new Apps(dashboard, conf.suiteConf.domain);
    sbPage = new SBPage(dashboard, conf.suiteConf.domain);
    productInfo = conf.caseConf.product_info;
    layerList = conf.caseConf.layers;

    await goToCreateCampaigns(appsPage, printbasePage, dashboard);

    for (let i = 0; i < layerList.length; i++) {
      await printbasePage.addNewLayer(layerList[i]);
    }
    await createAndAddLayerForGroup();

    await test.step("Click button Customized group", async () => {
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize group");
    });
    await test.step("Check giá trị default", async () => {
      await snapshotFixture.verify({
        page: dashboard,
        selector: await printbasePage.getXpathWithLabel("Display the options as"),
        snapshotName: nameSnap.default_type,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });

      await snapshotFixture.verify({
        page: dashboard,
        selector: await printbasePage.getXpathWithLabel("Label of the Droplist"),
        snapshotName: nameSnap.default_label,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
    await test.step("Check value các loại Type", async () => {
      const nameType = await dashboard.locator(printbasePage.xpathListTypeOfCG);
      const listNameType = await nameType.evaluateAll(list => list.map(element => element.textContent.trim()));
      for (let i = 0; i < listNameType.length; i++) {
        const findName = conf.caseConf.data_types_of_customize_group.findIndex(
          (data: string) => data === listNameType[i],
        );
        if (findName === conf.caseConf.data_types_of_customize_group.length) {
          return true;
        }
      }
    });
    await test.step("Check value Group", async () => {
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathValueGroupOnCG,
        snapshotName: nameSnap.value_group,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
      const namevalue = await dashboard.locator(printbasePage.xpathNameValue);
      const listNameValue = await namevalue.evaluateAll(list => list.map(element => element.textContent.trim()));
      for (let i = 0; i < listNameValue.length; i++) {
        if (listNameValue.includes(listGroup[0].new_group && listGroup[1].new_group)) {
          return true;
        }
      }
    });
    await test.step("Đổi tên [Group 2] thành Group A", async () => {
      await printbasePage.createGroupLayer(listGroup[1].new_group, conf.caseConf.name_group_edit, "", true);
      await dashboard.keyboard.press("Enter");
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathValueGroupOnCG,
        snapshotName: nameSnap.rename_group,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
      const nameValue = await dashboard.locator(printbasePage.xpathNameValue);
      const listValueAfterRename = await nameValue.evaluateAll(list => list.map(element => element.textContent.trim()));
      for (let i = 0; i < listValueAfterRename.length; i++) {
        if (listValueAfterRename.includes("Group 1" && conf.caseConf.name_group_edit)) {
          return true;
        }
      }
    });
  });

  conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const dataSetting = conf.caseConf.data[i];
    test(`${dataSetting.case_description} @${dataSetting.case_id}`, async ({ dashboard, conf }) => {
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      appsPage = new Apps(dashboard, conf.suiteConf.domain);
      sbPage = new SBPage(dashboard, conf.suiteConf.domain);
      personalize = new Personalize(dashboard, conf.suiteConf.domain);
      productInfo = dataSetting.product_info;
      layerList = dataSetting.layers;

      await goToCreateCampaigns(appsPage, printbasePage, dashboard);

      for (let i = 0; i < layerList.length; i++) {
        await printbasePage.addNewLayer(layerList[i]);
      }

      for (let i = 0; i < dataSetting.create_group_and_add_layer.length; i++) {
        await printbasePage.createGroupLayer(
          dataSetting.create_group_and_add_layer[i].current_group,
          dataSetting.create_group_and_add_layer[i].new_group,
        );
        for (let j = 0; j < dataSetting.create_group_and_add_layer[i].data_group.length; j++) {
          await printbasePage.addLayerToGroup(
            dataSetting.create_group_and_add_layer[i].data_group[j],
            dataSetting.create_group_and_add_layer[i].new_group,
          );
        }
      }

      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize group");
      await printbasePage.selectOptionOfLabel("Display the options as", dataSetting.option_item);

      await test.step("Verify Label ", async () => {
        for (let i = 0; i < dataSetting.data_label.length; i++) {
          await printbasePage.inputFieldWithLabel(
            "",
            "Select number of people",
            dataSetting.data_label[i].input_data,
            1,
          );
          await expect(
            await dashboard.locator(await personalize.xpathMessageError(dataSetting.type_label_customize_group)),
          ).toHaveText(dataSetting.data_label[i].error_data);
        }
      });
      // await test.step("Sửa value Group 1", async () => {
      //   for (let i = 0; i < dataSetting.data_group.length; i++) {
      //     await printbasePage.inputFieldWithLabel(
      //       "",
      //       dataSetting.create_group_and_add_layer[0].new_group,
      //       dataSetting.data_group[i].input_data,
      //       1,
      //     );
      //     await expect(await dashboard.locator(await printbasePage.xpathMessErrorEditGroup(2))).toHaveText(
      //       dataSetting.data_group[i].error_data,
      //     );
      //   }
      // });
    });
  }
  test(`Verify [Customize group] type Picture choice @SB_PRH_CGPH_8`, async ({ dashboard, conf, snapshotFixture }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appsPage = new Apps(dashboard, conf.suiteConf.domain);
    sbPage = new SBPage(dashboard, conf.suiteConf.domain);
    personalize = new Personalize(dashboard, conf.suiteConf.domain);
    productPageInDashBoard = new ProductPageInDashBoard(dashboard, conf.suiteConf.domain);
    productInfo = conf.caseConf.product_info;
    layerList = conf.caseConf.layers;

    await goToCreateCampaigns(appsPage, printbasePage, dashboard);

    for (let i = 0; i < layerList.length; i++) {
      await printbasePage.addNewLayer(layerList[i]);
    }
    for (let i = 0; i < conf.caseConf.create_group_and_add_layer.length; i++) {
      await printbasePage.createGroupLayer(
        conf.caseConf.create_group_and_add_layer[i].current_group,
        conf.caseConf.create_group_and_add_layer[i].new_group,
      );
      for (let j = 0; j < conf.caseConf.create_group_and_add_layer[i].data_group.length; j++) {
        await printbasePage.addLayerToGroup(
          conf.caseConf.create_group_and_add_layer[i].data_group[j],
          conf.caseConf.create_group_and_add_layer[i].new_group,
        );
      }
    }
    await printbasePage.clickBtnExpand();
    await printbasePage.clickOnBtnWithLabel("Customize group");
    await printbasePage.selectOptionOfLabel("Display the options as", "Picture choice");

    await test.step("Verify Label", async () => {
      for (let i = 0; i < conf.caseConf.data_label.length; i++) {
        await printbasePage.inputFieldWithLabel(
          "",
          "Select number of people",
          conf.caseConf.data_label[i].input_data,
          1,
        );

        await expect(
          await dashboard.locator(await personalize.xpathMessageError("Label of the Picture choice")),
        ).toHaveText(conf.caseConf.data_label[i].error_data);
      }
    });
    await test.step("Check validate upload image", async () => {
      for (let i = 0; i < conf.caseConf.file_path.length; i++) {
        if (conf.caseConf.file_path[i].status == "true") {
          await dashboard.setInputFiles(
            productPageInDashBoard.getXpathInputWithLabel("Upload image"),
            conf.caseConf.file_path[i].file_path_img,
          );
          await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathWaitUploadFileImgFinished);
        } else {
          await dashboard.setInputFiles(
            productPageInDashBoard.getXpathInputWithLabel("Upload image"),
            conf.caseConf.file_path[i].file_path_img,
          );
          expect(await printbasePage.isToastMsgVisible("File in wrong format")).toEqual(true);
        }
      }
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathValueGroupOnCG,
        snapshotName: nameSnap,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });
  test("[Customize group]Check default group to show on the Mockups @SB_PRH_CGPH_9", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    appsPage = new Apps(dashboard, conf.suiteConf.domain);
    sbPage = new SBPage(dashboard, conf.suiteConf.domain);
    productInfo = conf.caseConf.product_info;
    layerList = conf.caseConf.layers;

    await goToCreateCampaigns(appsPage, printbasePage, dashboard);

    for (let i = 0; i < layerList.length; i++) {
      await printbasePage.addNewLayer(layerList[i]);
    }
    await createAndAddLayerForGroup();
    await printbasePage.clickBtnExpand();
    await printbasePage.clickOnBtnWithLabel("Customize group");

    await test.step("Check các value được select", async () => {
      const nameProduct = await dashboard.locator(printbasePage.xpathListDefaultGroupShowOntheMockups);
      const dataTexts = await nameProduct.evaluateAll(list => list.map(element => element.textContent.trim()));
      for (let i = 0; i < dataTexts.length; i++) {
        const findName = conf.caseConf.list_group.findIndex((data: string) => data === dataTexts[i]);
        if (findName === conf.caseConf.list_group) {
          return true;
        }
      }
    });
    await test.step("Click  [Customize group]. Select G1. Click Save", async () => {
      await printbasePage.selectOptionOfLabel("Default Group to show on the Mockups", "Group 1");
      await printbasePage.clickOnBtnWithLabel("Save");
      expect(await printbasePage.isToastMsgVisible("Save customize group successfully")).toEqual(true);
    });

    await test.step("Drag [Group 1] và [Group 2] xuống mặt back", async () => {
      for (let i = 0; i < conf.caseConf.list_group.length; i++) {
        await sbPage.dragAndDrop({
          from: {
            selector: await printbasePage.getXpathWithLabel(conf.caseConf.list_group[i].group),
          },
          to: {
            selector: await printbasePage.xpathListLayerSide("Back side"),
          },
        });
      }

      await snapshotFixture.verify({
        page: dashboard,
        selector: await printbasePage.xpathListLayerSide("Back side"),
        snapshotName: nameSnap,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });
  conf = loadData(__dirname, "VERIFY_ON_CAM_DETAIL");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Create and launch campain @${dataSetting.case_id}`, async ({ dashboard, conf }) => {
      test.setTimeout(conf.suiteConf.timeout);
      productInfo = dataSetting.product_info;
      layerList = dataSetting.layers;
      customOptions = dataSetting.custom_options;
      customizeGroup = dataSetting.customize_group;

      await test.step("1.Tại Menu: Chọn 'Campaigns'> 'All campaigns'> Click 'Create new campaign'+ Select tab 'Apparel' > Select base 'Unisex T-shirt'+ Tạo [Group 1]: '[Layer image 1]', '[Layer text 1]'+ Tạo [Group 2]: '[Layer image 2]', '[Layer text 2]'Click ẩn [Group 1]", async () => {
        await goToCreateCampaigns(appsPage, printbasePage, dashboard);

        for (let i = 0; i < layerList.length; i++) {
          await printbasePage.addNewLayer(layerList[i]);
        }
        for (let i = 0; i < dataSetting.create_group_and_add_layer.length; i++) {
          await printbasePage.createGroupLayer(
            dataSetting.create_group_and_add_layer[i].current_group,
            dataSetting.create_group_and_add_layer[i].new_group,
            dataSetting.create_group_and_add_layer[i].side,
          );
          for (let j = 0; j < dataSetting.create_group_and_add_layer[i].data_group.length; j++) {
            await printbasePage.addLayerToGroup(
              dataSetting.create_group_and_add_layer[i].data_group[j],
              dataSetting.create_group_and_add_layer[i].new_group,
            );
          }
        }
        await printbasePage.clickHideOrShowGroup(dataSetting.create_group_and_add_layer[0].new_group);
        await printbasePage.clickBtnExpand();
        await expect(await dashboard.locator(await printbasePage.getXpathWithLabel("Customize group"))).toBeEnabled();
      });

      await test.step("2. Setup [Customize group] type Droplist chọn default group to show on the Mockups là [Group1]", async () => {
        await printbasePage.setupCustomizeGroupForPB(customizeGroup);
        expect(await printbasePage.isToastMsgVisible("Save customize group successfully")).toEqual(true);
      });

      await test.step("3. Click Continue > Input title camp > Launch camp ", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.page.waitForTimeout(3000);
        campaignId = await printbasePage.getCampaignIdInPricingPage();
        await printbasePage.inputFieldWithLabel("", "Campaign name", dataSetting.camp_title, 1);
        await printbasePage.clickOnBtnWithLabel("Launch");
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["launching", "available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      });
      await test.step("Verify status's campaign", async () => {
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
    test(`Verify campaign on SF @${dataSetting.case_id}`, async ({ dashboard, conf, snapshotFixture }) => {
      test.setTimeout(conf.suiteConf.timeout);
      productInfo = dataSetting.product_info;
      layerList = dataSetting.layers;
      customOptions = dataSetting.custom_options;
      customizeGroup = dataSetting.customize_group;

      await printbasePage.navigateToMenu("Apps");
      await appsPage.openApp("Print Hub");
      await printbasePage.navigateToMenu("Campaigns");

      await test.step("4. View campaign detail", async () => {
        await printbasePage.openCampaignDetail(dataSetting.camp_title);
        await printbasePage.clickOnImgMockupInCampDetail(1);
        await snapshotFixture.verify({
          page: dashboard,
          selector: printbasePage.xpathImgDetailMockupContainer,
          snapshotName: dataSetting.snap_shot_name,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });
    });
  }

  test(`Tạo campaign có [Customize group], có tích campaign manual design @SB_PRH_CGPH_11`, async ({
    hivePBase,
    context,
    conf,
  }) => {
    await printbasePage.navigateToMenu("Apps");
    await appsPage.openApp("Print Hub");
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.clickOnBtnWithLabel("Create new campaign");
    await printbasePage.page.waitForSelector(printbasePage.xpathPresentationEditor);
    await printbasePage.addBaseProducts(conf.caseConf.product_info);
    await printbasePage.clickOnBtnWithLabel("Update campaign");
    await printbasePage.page.waitForSelector(printbasePage.xpathIconLoading, { state: "hidden" });
    await printbasePage.removeLiveChat();

    await printbasePage.addNewLayers(conf.caseConf.layers);
    await printbasePage.createGroupLayers(conf.caseConf.create_group);
    await printbasePage.addLayersToGroup(conf.caseConf.add_layers_to_group);

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
      await printbasePage.page.waitForTimeout(3000);
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
      campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(
        await printbasePage.page.locator(
          printbasePage.xpathStatusCampaign(conf.caseConf.pricing_info.title, "in review"),
        ),
      ).toBeVisible();
      // go to hive to approve launch camp manual
      await hivePbase.approveCampaignCustomArt(campaignId);
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
      campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await expect(campaignSF.genLoc(printbasePage.xpathBtnWithLabel("Preview your design", 1))).toBeHidden();
    });
  });
  conf = loadData(__dirname, "VERIFY_CO_ON_SF");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Create and launch campain @${dataSetting.case_id}`, async ({ dashboard }) => {
      //Datadriven
      layerList = dataSetting.layers;
      customOptions = dataSetting.custom_options;
      customizeGroup = dataSetting.customize_group;
      createGroupLayer = dataSetting.create_group;
      addLayersToGroup = dataSetting.add_layers_to_group;
      productInfo = dataSetting.product_info;

      await goToCreateCampaigns(appsPage, printbasePage, dashboard);
      await printbasePage.addNewLayers(layerList);
      await printbasePage.createGroupLayers(createGroupLayer);
      await printbasePage.addLayersToGroup(addLayersToGroup);
      await printbasePage.clickBtnExpand();

      await test.step("1. Tạo Custom option", async () => {
        await printbasePage.clickOnBtnWithLabel("Customize layer");
        await printbasePage.addCustomOptions(customOptions);
        for (let j = 0; j < customOptions.length; j++) {
          await expect(
            await dashboard.locator(await printbasePage.getXpathNameLabelInCOList(customOptions[j].label)),
          ).toBeVisible();
        }
      });

      await test.step("2. Tạo [Customize group] type Radio chọn default group to show on the Mockups là [Group1] ", async () => {
        await printbasePage.setupCustomizeGroupForPB(customizeGroup);
        await expect(await dashboard.locator(await printbasePage.xpathBtnWithLabel("Customize group"))).toBeDisabled();
      });

      await test.step("Click Continue > Input title camp > Launch camp", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.page.waitForTimeout(3000);
        campaignId = await printbasePage.getCampaignIdInPricingPage();
        await printbasePage.inputFieldWithLabel("", "Campaign name", dataSetting.camp_title, 1);
        await printbasePage.clickOnBtnWithLabel("Launch");
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["launching", "available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      });
      await test.step("Verify status's campaign", async () => {
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
      test.setTimeout(conf.suiteConf.timeout);
      productInfo = dataSetting.product_info;
      layerList = dataSetting.layers;
      customOptions = dataSetting.custom_options;
      customizeGroup = dataSetting.customize_group;

      await printbasePage.navigateToMenu("Apps");
      await appsPage.openApp("Print Hub");
      await printbasePage.navigateToMenu("Campaigns");

      await test.step("View camp ngòai SF", async () => {
        await printbasePage.openCampaignDetail(dataSetting.camp_title);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await expect(campaignSF.genLoc(printbasePage.xpathBtnWithLabel("Preview your design", 1))).toBeVisible();
      });

      await test.step("Chọn lần lượt các option [Customize group]", async () => {
        for (let m = 1; m <= dataSetting.product_info.length; m++) {
          await campaignSF.selectBase(m);

          for (let i = 0; i < dataSetting.custom_option_info.length; i++) {
            for (let j = 0; j < dataSetting.custom_option_info[i].setup_info.length; j++) {
              // if (j < dataSetting.custom_option_info[i].setup_info.length) {
              await campaignSF.inputCustomOptionSF(dataSetting.custom_option_info[i].setup_info[j]);
              continue;
              // }
            }
            await campaignSF.clickOnBtnPreviewSF();
            await campaignSF.page.waitForSelector(printbasePage.xpathPopupLivePreview(1));
            const oldSrcPreviewImage = await campaignSF.getAttibutePreviewImage();
            let k = 1;
            let newSrcPreviewImage;
            do {
              await campaignSF.waitAbit(1000);
              newSrcPreviewImage = await campaignSF.getAttibutePreviewImage();
              k++;
            } while (newSrcPreviewImage == oldSrcPreviewImage && k < 10);

            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: printbasePage.xpathPopupLivePreview(dataSetting.custom_option_info[i].preview_back_or_font),
              snapshotName: `${m}_${i}_${dataSetting.snap_shot_name.verify_opptions_on_sf}`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
            await campaignSF.closePreview(dataSetting.themes_setting);
          }
        }
      });
    });
  }
  conf = loadData(__dirname, "VERIFY_CAMP_HAVE_CONDITIONAL_LOGIC");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Create and launch campain @${dataSetting.case_id}`, async ({ dashboard }) => {
      //Datadriven
      layerList = dataSetting.layers;
      customOptions = dataSetting.custom_options;
      customizeGroup = dataSetting.customize_group;
      createGroupLayer = dataSetting.create_group;
      addLayersToGroup = dataSetting.add_layers_to_group;
      productInfo = dataSetting.product_info;
      conditionalLogicInfo = dataSetting.conditional_logic_info;

      await goToCreateCampaigns(appsPage, printbasePage, dashboard);
      await printbasePage.addNewLayers(layerList);
      await printbasePage.createGroupLayers(createGroupLayer);
      await printbasePage.addLayersToGroup(addLayersToGroup);
      await printbasePage.clickBtnExpand();

      await test.step("1. Tạo Custom option Tạo [Customize group] And tạo conditional logic", async () => {
        await printbasePage.clickOnBtnWithLabel("Customize layer");
        await printbasePage.addCustomOptions(customOptions);
        for (let j = 0; j < customOptions.length; j++) {
          await expect(
            await dashboard.locator(await printbasePage.getXpathNameLabelInCOList(customOptions[j].label)),
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
        await printbasePage.page.waitForTimeout(5000);
        campaignId = await printbasePage.getCampaignIdInPricingPage();
        await printbasePage.inputFieldWithLabel("", "Campaign name", dataSetting.camp_title, 1);
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
      //Datadriven
      layerList = dataSetting.layers;
      customOptions = dataSetting.custom_options;
      customizeGroup = dataSetting.customize_group;
      createGroupLayer = dataSetting.create_group;
      addLayersToGroup = dataSetting.add_layers_to_group;

      await printbasePage.navigateToMenu("Apps");
      await appsPage.openApp("Print Hub");
      await printbasePage.navigateToMenu("Campaigns");

      await test.step("View camp ngòai SF", async () => {
        await printbasePage.openCampaignDetail(dataSetting.camp_title);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await expect(campaignSF.genLoc(printbasePage.xpathBtnWithLabel("Preview your design", 1))).toBeVisible();
      });

      await test.step("Chọn lần lượt các option [Customize group]", async () => {
        for (let m = 1; m < dataSetting.product_info.length; m++) {
          await campaignSF.selectBase(m);

          for (let i = 0; i < dataSetting.custom_option_info.length; i++) {
            for (let j = 0; j < dataSetting.custom_option_info[i].setup_info.length; j++) {
              if (j < dataSetting.custom_option_info[i].setup_info.length) {
                await campaignSF.inputCustomOptionSF(dataSetting.custom_option_info[i].setup_info[j]);
                continue;
              }
            }
            await campaignSF.clickOnBtnPreviewSF();
            await campaignSF.page.waitForSelector(printbasePage.xpathPopupLivePreview(1));
            const oldSrcPreviewImage = await campaignSF.getAttibutePreviewImage();
            let k = 1;
            let newSrcPreviewImage;
            do {
              await campaignSF.waitAbit(1000);
              newSrcPreviewImage = await campaignSF.getAttibutePreviewImage();
              k++;
            } while (newSrcPreviewImage == oldSrcPreviewImage && k < 10);

            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: printbasePage.xpathPopupLivePreview(dataSetting.custom_option_info[i].preview_back_or_font),
              snapshotName: `${m}_${i}_${dataSetting.snap_shot_name.verify_opptions_on_sf}`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
            await campaignSF.closePreview(dataSetting.themes_setting);
          }
        }
      });
    });
  }
  test(`Duplicate campaign có [Customize group] @SB_PRH_CGPH_20`, async ({ dashboard, conf, snapshotFixture }) => {
    await test.step(`Tại Menu: Chọn "Campaigns" > "All campaigns" > Click icon Duplicate camp:
  "Customize-group-only-droplist"`, async () => {
      await printbasePage.navigateToMenu("Apps");
      await appsPage.openApp("Print Hub");
      await printbasePage.navigateToMenu("Campaigns");

      await printbasePage.searchWithKeyword(conf.caseConf.camp_title);
      await printbasePage.openCampaignDetail(conf.caseConf.camp_title);
      await printbasePage.clickOnBtnWithLabel("Duplicate");
      await dashboard.click(printbasePage.xpathCheckboxKeepArtwork);
      await printbasePage.clickOnBtnWithLabel("Duplicate", 2);
      await printbasePage.clickBtnExpand();
      await printbasePage.removeLiveChat();
      await dashboard.locator(await printbasePage.getXpathNameLabelInCOList("Radio")).click();
      await snapshotFixture.verify({
        page: dashboard,
        selector: printbasePage.xpathCustomizeGroupContainer,
        snapshotName: nameSnap,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });
  conf = loadData(__dirname, "VERIFY_ORDER_IN_HIVE");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Create order successfully @${dataSetting.case_id}`, async ({ conf }) => {
      shippingAddress = conf.suiteConf.shipping_address;
      productCheckout = dataSetting.products_checkout;

      await test.step("1. Checkout thành công order với các camp", async () => {
        await checkoutAPI.addProductToCartThenCheckout(productCheckout);
        await checkoutAPI.updateCustomerInformation(email, shippingAddress);
        await checkoutAPI.openCheckoutPageByToken();
        const checkoutInfo = await checkoutAPI.getCheckoutInfo();
        expect(checkoutInfo.info.shipping_address).not.toBeNull();
        expect(checkoutInfo.info.billing_address).toBeNull();

        // Input Payment card
        await checkout.completeOrderWithMethod("Stripe", dataSetting.card_info);
        expect(await checkout.isThankyouPage()).toBe(true);
        orderID = await checkoutAPI.getOrderIDByAPI();
      });
    });
  }
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Go to hive to verify order @${dataSetting.case_id}`, async ({ conf, hivePBase, snapshotFixture }) => {
      await test.step("2. Login Hive Pbase> Chọn Customer Support> Chọn PHub Order> Click order vừa tạo ", async () => {
        hivePbase = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
        await hivePbase.goToOrderDetail(orderID, "phub-order");
      });

      await test.step("Chờ order rendered artwork > Verify hiển thị mockup và artwork của line item ", async () => {
        await hivePbase.processCompareAmountMockupRender(dataSetting.mockup_render);
        await snapshotFixture.verify({
          page: hivePBase,
          selector: hivePbase.xpathtableOderdetail,
          snapshotName: dataSetting.name_snap_shot,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });
    });
  }
  test(`Import camp sang store khác @SB_PRH_CGPH_21`, async ({ conf, dashboard, token, authRequest }) => {
    let productID;
    let accessToken;
    const dashboardPageSecond = new DashboardPage(dashboard, conf.caseConf.info_shop_second.domain);
    const productPageSecond = new ProductPage(dashboardPageSecond.page, conf.caseConf.info_shop_second.domain);
    await test.step(`- Chọn all campaign có [Customize group]
  - Chọn Action "Import product to another store"
  - Chọn store được là Shop đích
  - Chọn "skip product" khi trùng handle
  - Click "Import" `, async () => {
      await productPage.goToProductList();
      await productPage.searchProduct(conf.caseConf.camp_title);
      await productPage.cloneProductToStore(conf.caseConf.clone_infos[0].clone_info, 0, 1);
      await productPage.chooseProduct(conf.caseConf.camp_title);
      await dashboard.waitForSelector(productPage.xpathListPersonalization);
    });
    await test.step(`Tại Shop đích vào màn campaign detail được clone`, async () => {
      const shopToken = await token.getWithCredentials({
        domain: conf.caseConf.info_shop_second.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      accessToken = shopToken.access_token;
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
  conf = loadData(__dirname, "EDIT_PERSONALIZATION");
  for (let k = 0; k < conf.caseConf.data.length; k++) {
    const dataSetting = conf.caseConf.data[k];
    test(`Create and launch campain @${dataSetting.case_id}`, async ({ dashboard }) => {
      //Datadriven
      layerList = dataSetting.layers;
      customOptions = dataSetting.custom_options;
      customizeGroup = dataSetting.customize_group;
      createGroupLayer = dataSetting.create_group;
      addLayersToGroup = dataSetting.add_layers_to_group;
      productInfo = dataSetting.product_info;
      await goToCreateCampaigns(appsPage, printbasePage, dashboard);
      await printbasePage.addNewLayers(layerList);
      await printbasePage.createGroupLayers(createGroupLayer);
      await printbasePage.addLayersToGroup(addLayersToGroup);
      await printbasePage.clickBtnExpand();

      await test.step("1. Tạo Custom option Tạo [Customize group] And tạo conditional logic", async () => {
        await printbasePage.setupCustomizeGroupForPB(customizeGroup);
        await expect(dashboard.locator(printbasePage.xpathBtnWithLabel("Customize group"))).toBeDisabled();
      });

      await test.step("Click Continue > Input title camp > Launch camp", async () => {
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.page.waitForTimeout(5000);
        campaignId = await printbasePage.getCampaignIdInPricingPage();
        await printbasePage.inputFieldWithLabel("", "Campaign name", dataSetting.camp_title, 1);
        await printbasePage.clickOnBtnWithLabel("Launch");
        const isAvailable = await printbasePage.checkCampaignStatus(
          campaignId,
          ["launching", "available", "available with basic images"],
          30 * 60 * 1000,
        );
        expect(isAvailable).toBeTruthy();
      });
      await test.step("Verify status's campaign", async () => {
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
      await printbasePage.navigateToMenu("Apps");
      await appsPage.openApp("Print Hub");
      await printbasePage.navigateToMenu("Campaigns");
      await test.step("View camp ngòai SF", async () => {
        await printbasePage.openCampaignDetail(dataSetting.camp_title);
        await printbasePage.clickElementWithLabel("span", "Edit campaign setting");
        await printbasePage.page.waitForTimeout(3000);
        await printbasePage.clickBtnExpand();
        await printbasePage.clickElementWithLabel("a", "Droplist");
        await printbasePage.selectOptionOfLabel("Display the options as", dataSetting.edit_personalization.type);
        for (let i = 0; i < dataSetting.edit_personalization.label_edit.length; i++) {
          await printbasePage.inputFieldWithLabel(
            "",
            dataSetting.edit_personalization.label_edit[i].field_edit,
            dataSetting.edit_personalization.label_edit[i].value_after_edit,
          );
        }
        await printbasePage.clickOnBtnWithLabel("Save");
        expect(await printbasePage.isToastMsgVisible("Save customize group successfully")).toEqual(true);
        await printbasePage.clickOnBtnWithLabel("Save change");
        await printbasePage.clickOnBtnWithLabel("Continue");
        await printbasePage.waitBtnEnable("Edit campaign setting");
        //open sf
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
        campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await campaignSF.page.waitForSelector(printbasePage.xpathProductPropertyOnSF);

        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: printbasePage.xpathProductPropertyOnSF,
          snapshotName: dataSetting.snap_shot_name.verify_opptions_on_sf,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      });
    });
  }
});
