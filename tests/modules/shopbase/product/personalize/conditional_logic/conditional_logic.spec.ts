import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { ProductPage } from "@pages/dashboard/products";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { Campaign } from "@sf_pages/campaign";
import { Personalize } from "@pages/dashboard/personalize";

test.describe("Conditional logic for Sbase", () => {
  const verifySelectOption = async (dashboard, product, xpathSelectOption, valueExpect): Promise<boolean> => {
    const count = await dashboard.locator(xpathSelectOption).count();
    for (let i = 1; i <= count; i++) {
      const value = await dashboard.locator(`(${xpathSelectOption})[${i}]`).textContent();
      if (value.replace(/\n/g, "").trim() === valueExpect.replace(/(\.png|\.jpeg)/g, "").trim()) {
        return true;
      }
    }
    return false;
  };

  const verifyImageVisibleOnSF = async (
    page,
    personalizePage: Personalize,
    imageClipart,
    valueExpect,
  ): Promise<void> => {
    const isCheckValueImageOnSF = await page
      .locator(personalizePage.xpathCheckValueImageOnSF(imageClipart.replace(/(\.png|\.jpeg)/g, "").trim()))
      .isVisible();
    expect(isCheckValueImageOnSF).toBe(valueExpect);
  };

  test.beforeEach(async ({ conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const conditionalLogic = conf.caseConf.data[i];

    test(`${conditionalLogic.description} @${conditionalLogic.case_id}`, async ({
      dashboard,
      conf,
      context,
      snapshotFixture,
    }) => {
      const productInfo = conditionalLogic.product_all_info;
      const printBasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      const personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
      const conditionInfo = conditionalLogic.conditional_logic_info;
      const snapshotName = conditionalLogic.snapshot_name;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const threshold = conf.suiteConf.threshold;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      await printBasePage.navigateToMenu("Products");
      await printBasePage.deleteProduct(conf.suiteConf.password);
      if (await dashboard.locator(printBasePage.xpathToastMessage).isVisible({ timeout: 5000 })) {
        await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathToastMessage);
      }

      await test.step("Tạo mới product với các custom option theo thứ tự", async () => {
        await printBasePage.addNewProductWithData(productInfo);
        await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathToastMessage);
        const customOption = conditionalLogic.custom_option_info;
        await printBasePage.clickBtnCustomOptionOnly();
        for (let j = 0; j < customOption.length; j++) {
          await printBasePage.addNewCustomOptionWithData(customOption[j]);
        }
        await printBasePage.clickOnBtnWithLabel("Save changes");
        await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathToastMessage);
      });

      await test.step(
        `Click vào icon Add conditional logic của ` + `custom option ${conditionalLogic.custom_option_name}`,
        async () => {
          await printBasePage.clickAddConditionalLogic(conditionInfo);
          await dashboard.waitForSelector(personalizePage.xpathPopupConditionalLogic, { timeout: 5000 });
          await dashboard.waitForTimeout(3000);
          await snapshotFixture.verify({
            page: dashboard,
            selector: personalizePage.xpathPopupConditionalLogic,
            snapshotName: snapshotName.popup_add_condi_logic.replaceAll("_", "-"),
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        },
      );

      await test.step(
        `Add conditional logic cho custom option ${conditionalLogic.custom_option_name} ` + `sau đó click vào btn Save`,
        async () => {
          await printBasePage.addConditionalLogicSB(conditionInfo);
          await printBasePage.clickOnBtnWithLabel("Save");
          await snapshotFixture.verify({
            page: dashboard,
            selector: personalizePage.xpathCustomOptionList(),
            snapshotName: snapshotName.add_condi_logic.replaceAll("_", "-"),
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
          await printBasePage.clickOnBtnWithLabel("Save changes");
          await expect(await printBasePage.isToastMsgVisible("Product was successfully saved!")).toBe(true);
          await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathToastMessage);
        },
      );

      if (conditionalLogic.conditional_logic_edit) {
        await test.step(
          "Click vào Edit logic> Click Add another condition> " + "Click Add new option> Click btn Save",
          async () => {
            await printBasePage.clickEditConditionalLogic(conditionInfo);
            await printBasePage.addConditionalLogicSB(conditionalLogic.conditional_logic_edit);
            await printBasePage.clickOnBtnWithLabel("Save");
            await snapshotFixture.verify({
              page: dashboard,
              selector: personalizePage.xpathCustomOptionList(),
              snapshotName: snapshotName.edit_condi_logic.replaceAll("_", "-"),
              snapshotOptions: {
                maxDiffPixelRatio: maxDiffPixelRatio,
                threshold: threshold,
                maxDiffPixels: maxDiffPixels,
              },
            });
            await printBasePage.clickOnBtnWithLabel("Save changes");
            await expect(await printBasePage.isToastMsgVisible("Product was successfully saved!")).toBe(true);
            await printBasePage.waitForElementVisibleThenInvisible(printBasePage.xpathToastMessage);
          },
        );
      }

      if (conditionInfo.add_condition != "yes") {
        await test.step("Click vào Edit logic> Click vào icon + để add conditional logic", async () => {
          await printBasePage.clickEditConditionalLogic(conditionInfo);
          await dashboard.locator(personalizePage.xpathIconAddOrRemoveCondition("mdi-plus")).click();
          await snapshotFixture.verify({
            page: dashboard,
            selector: personalizePage.xpathPopupConditionalLogic,
            snapshotName: snapshotName.add_block_condi_logic.replaceAll("_", "-"),
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
          await printBasePage.clickOnBtnWithLabel("Cancel");
        });
        await test.step("Click vào Edit logic> Click vào icon - để remove conditional logic", async () => {
          await printBasePage.clickEditConditionalLogic(conditionInfo);
          await dashboard.locator(personalizePage.xpathIconAddOrRemoveCondition("mdi-minus")).click();
          await snapshotFixture.verify({
            page: dashboard,
            selector: personalizePage.xpathPopupConditionalLogic,
            snapshotName: snapshotName.remove_block_condi_logic.replaceAll("_", "-"),
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
          await printBasePage.clickOnBtnWithLabel("Cancel");
        });
      }

      await test.step(`View product ngoài SF`, async () => {
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await printBasePage.openCampaignSF()]);
        const campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
        const conditionShow = conditionalLogic.conditional_logic_show;
        await SFPage.waitForSelector(personalizePage.xpathCOSF);
        // verify custom option on SF
        for (let i = 0; i < conditionShow.list_custom.length; i++) {
          await campaignSF.inputCustomOptionOnCampSF(conditionShow.list_custom[i]);
          const valueShow = conditionShow.then_show_value[i].split(",").map(item => item.trim());
          for (let j = 0; j < valueShow.length; j++) {
            await expect(await SFPage.locator(personalizePage.xpathValueCOShowOnSF(valueShow[j])).isVisible()).toBe(
              conditionShow.is_show_value[i],
            );
          }
        }
      });
    });
  }

  test(
    "Check conditional logic của product với Custom option (CO) loại picture choice (PC) và " +
      "chọn clipart folder khi edit clipart folder @SB_PRO_SBP_1536",
    async ({ dashboard, conf, context }) => {
      const productInfo = conf.caseConf.product_all_info;
      const customOption = conf.caseConf.custom_option_info;
      const imageClipart = conf.caseConf.image_clipart;
      const imageClipartAdd = conf.caseConf.image_clipart_add;
      const personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
      let productClipart: ProductPage;
      let newTab;
      let SFPage;

      await test.step("Tạo mới product với các custom option theo thứ tự", async () => {
        await personalizePage.navigateToMenu("Products");
        await personalizePage.addNewProductWithData(productInfo);
        await personalizePage.clickBtnCustomOptionOnly();
        await personalizePage.addNewCustomOptionWithData(customOption);
        await personalizePage.clickOnBtnWithLabel("Save changes");
        await expect(await personalizePage.isToastMsgVisible("Product was successfully saved!")).toBe(true);
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
      });

      await test.step("Xóa image trong clipart folder detail", async () => {
        await personalizePage.closeCustomOption(customOption);
        [newTab] = await Promise.all([
          context.waitForEvent("page"),
          dashboard.locator(personalizePage.xpathGoToCLipart).click(),
        ]);
        productClipart = new ProductPage(newTab, conf.suiteConf.domain);
        await productClipart.openClipartFolderDetail(customOption.values);
        await productClipart.deleteImageInClipartFolder(imageClipart);
        await productClipart.clickOnBtnWithLabel("Save changes");
      });

      await test.step("Vào edit conditional logic của Picture choice, verify mục select value an option", async () => {
        await personalizePage.gotoProductDetail(productInfo.title);
        await dashboard.waitForSelector(personalizePage.xpathCustomOptionList());
        await personalizePage.clickAddConditionalLogic(customOption);
        expect(
          await verifySelectOption(dashboard, personalizePage, personalizePage.xpathSelectOption, imageClipart),
        ).toBe(false);
        await personalizePage.clickOnBtnWithLabel("Cancel");
      });

      await test.step("View product Picture choice ngoài SF", async () => {
        [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.openCampaignSF()]);
        await SFPage.waitForSelector(personalizePage.xpathCOSF);
        await verifyImageVisibleOnSF(SFPage, personalizePage, imageClipart, false);
      });

      await test.step("Add thêm image trong clipart folder detail", async () => {
        await productClipart.addMoreClipart(imageClipartAdd);
        await productClipart.clickOnBtnWithLabel("Save changes");
      });

      await test.step("Vào edit conditional logic của Picture choice, verify mục select value an option", async () => {
        // reload để load lại image đã edit
        await personalizePage.gotoProductDetail(productInfo.title);
        await personalizePage.closeCustomOption(customOption);
        await dashboard.waitForSelector(personalizePage.xpathCustomOptionList());
        await personalizePage.clickAddConditionalLogic(customOption);
        expect(
          await verifySelectOption(dashboard, personalizePage, personalizePage.xpathSelectOption, imageClipartAdd),
        ).toBe(true);
        await personalizePage.clickOnBtnWithLabel("Cancel");
      });

      await test.step("View product Picture choice ngoài SF", async () => {
        // reload để load lại image đã edit
        await SFPage.reload();
        await SFPage.waitForSelector(personalizePage.xpathCOSF);
        await verifyImageVisibleOnSF(SFPage, personalizePage, imageClipartAdd, true);
      });

      await test.step("Edit name image clipart Folder", async () => {
        await productClipart.editClipartImageName(imageClipartAdd, imageClipart);
        await productClipart.clickOnBtnWithLabel("Save changes");
      });

      await test.step("Vào edit conditional logic của Picture choice, verify mục select value an option", async () => {
        // reload để load lại image đã edit
        await dashboard.reload();
        await dashboard.waitForSelector(personalizePage.xpathCustomOptionList());
        await personalizePage.clickAddConditionalLogic(customOption);
        expect(
          await verifySelectOption(dashboard, personalizePage, personalizePage.xpathSelectOption, imageClipart),
        ).toBe(true);
        await personalizePage.clickOnBtnWithLabel("Cancel");
      });

      await test.step("View product Picture choice ngoài SF", async () => {
        // reload để load lại image đã edit
        await SFPage.reload();
        await SFPage.waitForSelector(personalizePage.xpathCOSF);
        await verifyImageVisibleOnSF(SFPage, personalizePage, imageClipart, true);
      });
    },
  );

  test(
    "Check conditional logic của product với Custom option (CO) loại picture choice (PC) và" +
      " chọn clipart folder khi edit clipart group @SB_PRO_SBP_1537",
    async ({ dashboard, conf, context }) => {
      const product = new ProductPage(dashboard, conf.suiteConf.domain);
      const productInfo = conf.caseConf.product_all_info;
      const customOption = conf.caseConf.custom_option_info;
      const folderClipart = conf.caseConf.folder_clipart;
      const folderClipartAdd = conf.caseConf.clipart_folder_info;
      const folderClipartEdit = conf.caseConf.clipart_folder_info_edit;
      const personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
      const pathClipartGroup = conf.suiteConf.path_clipart_group;
      const pathClipartFolder = conf.suiteConf.path_clipart_folder;
      let productClipart: ProductPage;
      let newTab;
      let SFPage;

      await test.step("Tạo mới product với các custom option theo thứ tự", async () => {
        await product.navigateToMenu("Products");
        await product.addNewProductWithData(productInfo);
        await product.clickBtnCustomOptionOnly();
        await product.addNewCustomOptionWithData(customOption);
        await product.clickOnBtnWithLabel("Save changes");
        await expect(await product.isToastMsgVisible("Product was successfully saved!")).toBe(true);
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
      });

      await test.step("Xóa folder của group", async () => {
        await product.closeCustomOption(customOption);
        [newTab] = await Promise.all([
          context.waitForEvent("page"),
          dashboard.locator(personalizePage.xpathGoToCLipart).click(),
        ]);
        productClipart = new ProductPage(newTab, conf.suiteConf.domain);
        await productClipart.deleteClipartFolder(folderClipart);
      });

      await test.step("Vào edit conditional logic của Picture choice, verify mục select value an option", async () => {
        await personalizePage.gotoProductDetail(productInfo.title);
        await dashboard.waitForSelector(personalizePage.xpathCustomOptionList());
        await product.clickAddConditionalLogic(customOption);
        expect(await verifySelectOption(dashboard, product, personalizePage.xpathSelectOption, folderClipart)).toBe(
          false,
        );
        await product.clickOnBtnWithLabel("Cancel");
      });

      await test.step("View product Picture choice ngoài SF", async () => {
        [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.openCampaignSF()]);
        await SFPage.waitForSelector(personalizePage.xpathCOSF);
        expect(await verifySelectOption(SFPage, product, personalizePage.xpathSelectOptionSF, folderClipart)).toBe(
          false,
        );
      });

      await test.step("Add thêm folder trong clipart group detail", async () => {
        await productClipart.goto(pathClipartGroup);
        await productClipart.openClipartGroupDetail(customOption.values);
        await productClipart.clickOnBtnWithLabel("Add new clipart folder");
        await productClipart.addNewClipartFolderInGroup(folderClipartAdd);
        await productClipart.clickOnBtnWithLabel("Save changes");
      });

      await test.step("Vào edit conditional logic của Picture choice, verify mục select value an option", async () => {
        // reload để load lại image đã edit
        await personalizePage.gotoProductDetail(productInfo.title);
        await product.closeCustomOption(customOption);
        await dashboard.waitForSelector(personalizePage.xpathCustomOptionList());
        await product.clickAddConditionalLogic(customOption);
        expect(
          await verifySelectOption(dashboard, product, personalizePage.xpathSelectOption, folderClipartAdd.folder_name),
        ).toBe(true);
        await product.clickOnBtnWithLabel("Cancel");
      });

      await test.step("View product Picture choice ngoài SF", async () => {
        // reload để load lại image đã edit
        await SFPage.reload();
        await SFPage.waitForSelector(personalizePage.xpathCOSF);
        expect(
          await verifySelectOption(SFPage, product, personalizePage.xpathSelectOptionSF, folderClipartAdd.folder_name),
        ).toBe(true);
      });

      await test.step("Edit name clipart Folder", async () => {
        await productClipart.goto(pathClipartFolder);
        await productClipart.openClipartGroupDetail(folderClipartAdd.folder_name);
        await productClipart.addNewClipartFolder(folderClipartEdit);
        await productClipart.clickOnBtnWithLabel("Save changes");
      });

      await test.step("Vào edit conditional logic của Picture choice, verify mục select value an option", async () => {
        // reload để load lại image đã edit
        await dashboard.reload();
        await dashboard.waitForSelector(personalizePage.xpathCustomOptionList());
        await product.clickAddConditionalLogic(customOption);
        expect(
          await verifySelectOption(
            dashboard,
            product,
            personalizePage.xpathSelectOption,
            folderClipartEdit.folder_name,
          ),
        ).toBe(true);
        await product.clickOnBtnWithLabel("Cancel");
      });

      await test.step("View product Picture choice ngoài SF", async () => {
        // reload để load lại image đã edit
        await SFPage.reload();
        await SFPage.waitForSelector(personalizePage.xpathCOSF);
        expect(
          await verifySelectOption(SFPage, product, personalizePage.xpathSelectOptionSF, folderClipartEdit.folder_name),
        ).toBe(true);
      });
    },
  );

  test("[Conditional logic] Add conditional logic không thành công @SB_PRO_SBP_1538", async ({ dashboard, conf }) => {
    const personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
    const productInfo = conf.caseConf.product_all_info;
    const customOption = conf.caseConf.custom_option_info;
    const conditionInfo = conf.caseConf.conditional_logic_info;

    await test.step("Click vào btn Create custom option only sau đó tạo mới  custom option theo thứ tự", async () => {
      await personalizePage.goToProductList();
      await personalizePage.addNewProductWithData(productInfo);
      await personalizePage.clickBtnCustomOptionOnly();
      for (let j = 0; j < customOption.length; j++) {
        await personalizePage.addNewCustomOptionWithData(customOption[j]);
      }
      await personalizePage.clickOnBtnWithLabel("Save changes");
      await expect(await personalizePage.isToastMsgVisible("Product was successfully saved!")).toBe(true);
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
    });
    for (let i = 0; i < conditionInfo.length; i++) {
      await test.step(
        `Click vào icon Add conditional logic của custom option Droplist > ` +
          `Bỏ trống field ${conditionInfo[i].field} > Nhập các giá trị khác hợp lệ > Click button Save`,
        async () => {
          await personalizePage.clickAddConditionalLogic(conditionInfo[i]);
          await personalizePage.addConditionalLogicSB(conditionInfo[i]);
          await personalizePage.clickOnBtnWithLabel("Save");
          await expect(await dashboard.locator(personalizePage.xpathError)).toHaveText(conditionInfo[i].messageError);
          await personalizePage.clickOnBtnWithLabel("Cancel");
        },
      );
    }
  });
});
