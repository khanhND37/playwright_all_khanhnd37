import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

const dProId = [];
let webBuilder: WebBuilder;
let dp: ProductAPI;
test.describe("Check module Redo/undo @SB_WEB_BUILDER_NAV_UNRE", () => {
  test.beforeAll(async ({ authRequest, builder, conf }) => {
    dp = new ProductAPI(conf.suiteConf.domain, authRequest);
    await test.step("Create digital product", async () => {
      const productInfo = await dp.createProduct(conf.suiteConf.dpro_config);
      dProId.push(productInfo.data.product.id);
    });

    let applyTemplateId;
    await test.step("Get template ID from Web Base to apply", async () => {
      const templateInfo = await builder.libraryDetail(conf.suiteConf.web_base_id);
      for (const template of templateInfo.pages) {
        if (template.title === conf.suiteConf.apply_template) {
          applyTemplateId = template.id;
        }
      }
    });

    await test.step("Apply template for digital product", async () => {
      await builder.applyTemplate({
        templateId: applyTemplateId,
        productId: dProId[0],
        type: conf.suiteConf.type,
      });
    });
  });

  test.afterAll(async ({}) => {
    await test.step("Delete digital product after test", async () => {
      dp.deleteProduct(dProId);
    });
  });

  test.beforeEach(async ({ dashboard, conf }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await test.step("Go to product test", async () => {
      await webBuilder.openWebBuilder({ type: "sale page", id: dProId[0] });
    });
  });
  test("Check hiển thị và tương tác button Undo/Redo @SB_WEB_BUILDER_NAV_UNRE_1", async ({ dashboard, conf }) => {
    const expectedResult = conf.caseConf.expected;
    for (let i = 0; i < expectedResult.buttons.length; i++) {
      const btnLoc = `.sb-mr-small >> nth=${i}`;
      await test.step(`Verify ${expectedResult.buttons[i]} is disabled`, async () => {
        await expect(webBuilder.genLoc(btnLoc)).toHaveAttribute(expectedResult.attribute_name, expectedResult.value);
      });

      await test.step(`Verify hover icon ${expectedResult.buttons[i]}`, async () => {
        await dashboard.hover(btnLoc);
        await expect(dashboard.locator(btnLoc)).toBeVisible();
      });
    }
  });

  //Case này không còn trong release checklist nên tạm comment lại
  // test("Undo/Redo_Check hiển thị button Undo khi có thay đổi n lần (n là số lần thực hiện thay đổi)
  // @SB_WEB_BUILDER_NAV_UNRE_3",
  // async ({
  //   conf,
  // }) => {
  //   test.slow();
  //   const changeSettings = conf.caseConf.change_settings;
  //   const expectedMessage = conf.caseConf.expected_message;
  //   const removedLayer = webBuilder.genLoc(".w-builder__layer:has-text('Section')");
  //   const undoBtn = webBuilder.genLoc(".sb-mr-small >> nth=0");
  //   const redoBtn = webBuilder.genLoc(".sb-mr-small >> nth=1");
  //   const paddingValue = webBuilder.genLoc("//div[@data-widget-id='padding']//input");
  //   await test.step("Pre-condition: Add section", async () => {
  //     await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_section);
  //     await webBuilder.backBtn.click();
  //   });
  //   await test.step("Remove a block", async () => {
  //     await webBuilder.removeLayer(conf.caseConf.remove_layer);
  //   });
  //
  //   await test.step("Verify Undo/Redo button", async () => {
  //     await expect(undoBtn).toBeEnabled();
  //     await expect(redoBtn).toBeDisabled();
  //   });
  //
  //   await test.step("Click undo", async () => {
  //     await undoBtn.click();
  //   });
  //
  //   await test.step("Verify undo success", async () => {
  //     await expect(removedLayer).toBeVisible();
  //   });
  //
  //   await test.step("Change setting more than 50 times", async () => {
  //     for (const data of changeSettings) {
  //       const background = data.background;
  //       const minHeight = data.min_height;
  //       const border = data.border;
  //       const toggle = data.toggle;
  //       const marginPadding = data.margin_padding;
  //       const insertSection = data.insert_section;
  //       const editLayout = data.edit_layout;
  //       const openLayer = data.open_layer;
  //       const selectSection = webBuilder.getSelectorByIndex(data.select_section);
  //       for (const position of insertSection.position) {
  //         await webBuilder.insertSectionBlock({
  //           ...insertSection,
  //           position: position,
  //         });
  //       }
  //       await webBuilder.clickOnElement(selectSection, "#preview");
  //       await webBuilder.selectOptionOnQuickBar("Duplicate");
  //       await webBuilder.clickOnElement(selectSection, "#preview");
  //       for (const editInfo of editLayout) {
  //         await webBuilder.addRow({ parentPosition: { section: 1, row: 1 }, position: "Bottom" });
  //         await webBuilder.editLayoutRow(editInfo.layout);
  //       }
  //       await webBuilder.selectOptionOnQuickBar("Move up");
  //       await webBuilder.selectOptionOnQuickBar("Move down");
  //       await webBuilder.selectOptionOnQuickBar("Delete");
  //       await webBuilder.clickBtnNavigationBar("layer");
  //       await webBuilder.openLayerSettings(openLayer);
  //       await webBuilder.switchToTab("Design");
  //       await webBuilder.switchToggle(toggle.button, toggle.on);
  //       await webBuilder.settingWidthHeight(minHeight.label, minHeight.data);
  //       await webBuilder.setBackground(background.label, background.data);
  //       await webBuilder.setBorder(border.label, border.data);
  //       for (const edit of marginPadding) {
  //         await webBuilder.setMarginPadding(edit.label, edit.data);
  //       }
  //       await webBuilder.backBtn.click();
  //     }
  //   });
  //
  //   await test.step("Verify unsaved changes", async () => {
  //     await expect(webBuilder.headerMessage()).toContainText(expectedMessage.unsaved);
  //   });
  //
  //   await test.step("Click Undo", async () => {
  //     await undoBtn.click();
  //   });
  //
  //   await test.step("Verify Undo/Redo button", async () => {
  //     await expect(undoBtn).toBeEnabled();
  //     await expect(redoBtn).toBeEnabled();
  //   });
  //
  //   await test.step("Click Redo", async () => {
  //     await redoBtn.click();
  //   });
  //
  //   await test.step("Verify redo to the latest version", async () => {
  //     await expect(redoBtn).toBeDisabled();
  //     await webBuilder.clickBtnNavigationBar("layer");
  //     await webBuilder.switchToTab("Design");
  //     await webBuilder.openLayerSettings(conf.caseConf.verify_layer);
  //     await webBuilder.switchToTab("Design");
  //     await expect(paddingValue).toHaveValue(conf.caseConf.redo_value);
  //   });
  //
  //   await test.step("Click Undo 50 times", async () => {
  //     for (let i = 0; i < conf.caseConf.max_times_undo_redo; i++) {
  //       await undoBtn.click();
  //     }
  //   });
  //
  //   await test.step("Verify user cannot click undo 51 times", async () => {
  //     await expect(undoBtn).toBeDisabled();
  //   });
  //
  //   await test.step("Click Redo 50 times", async () => {
  //     for (let i = 0; i < conf.caseConf.max_times_undo_redo; i++) {
  //       await redoBtn.click();
  //     }
  //   });
  //
  //   await test.step("Verify user cannot click redo 51 times", async () => {
  //     await expect(redoBtn).toBeDisabled();
  //   });
  //
  //   await test.step("Click save", async () => {
  //     await webBuilder.clickBtnNavigationBar("save");
  //   });
  //
  //   await test.step("Verify save successfully", async () => {
  //     await expect(webBuilder.headerMessage()).toContainText(expectedMessage.saved);
  //   });
  // });
});
