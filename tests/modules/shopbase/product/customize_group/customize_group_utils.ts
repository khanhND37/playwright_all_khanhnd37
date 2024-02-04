import { blockCondition, Config, CustomizeGroup, CustomizeGroupValidate, customOptionProductSFs } from "@types";
import { ProductPage } from "@pages/dashboard/products";
import { BrowserContext, expect, Page } from "@playwright/test";
import { Personalize } from "@pages/dashboard/personalize";
import { waitForImageLoaded } from "@utils/theme";
import { SFProduct } from "@sf_pages/product";
import { OrdersPage } from "@pages/dashboard/orders";
import { prepareFile } from "@helper/file";
import { SnapshotFixture } from "@core/fixtures/snapshot-fixture";

// trước khi tạo mới sẽ xóa product cũ đi, để tránh dư thừa data
export const prepareProduct = async (product: ProductPage, caseId: string, conf: Config) => {
  const productInfo = Object.assign({}, conf.suiteConf.product_info);
  productInfo.title = `${productInfo.title} ${caseId}`;
  await product.navigateToMenu("Products");
  await product.searchProduct(productInfo.title);
  await product.deleteProduct(conf.suiteConf.password);
  await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
  await product.addNewProductWithData(productInfo);
  await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
};

export const addLayer = async (product: ProductPage, conf: Config) => {
  await product.clickOnBtnWithLabel(conf.caseConf.personalization);
  await product.uploadImagePreviewOrPrintfile(conf.caseConf.image_preview);
  for (const layerValue of conf.caseConf.data_layers) {
    await product.addLayer(layerValue);
  }
};

export const addGroupLayer = async (product: ProductPage, personalize: Personalize, conf: Config, dashboard: Page) => {
  for (const dataValue of conf.caseConf.data_group) {
    await product.createGroupLayer(dataValue.current_group, dataValue.new_group);
    await dashboard.keyboard.press("Enter");
    await product.addLayerToGroup(dataValue.layer_name, dataValue.new_group);
  }
  // ẩn group
  if (conf.caseConf.hide_group_layers) {
    for (const groupName of conf.caseConf.hide_group_layers) {
      await personalize.clickHideOrShowGroup(groupName);
    }
  }
  await dashboard.click(product.xpathIconExpand);
};

export const addCustomOption = async (product: ProductPage, conf: Config) => {
  await product.clickOnBtnWithLabel("Customize layer", 1);
  for (const customOption of conf.caseConf.custom_option_info) {
    await product.addCustomOptionOnEditor(customOption);
  }
};

export const previewWithOptionValue = async (
  productSF: SFProduct,
  conf: Config,
  optionValues: customOptionProductSFs,
  snapshotFixture: SnapshotFixture,
) => {
  await productSF.page.waitForSelector(productSF.xpathButtonPreview);
  for (const option of optionValues.custom_option_values) {
    await productSF.inputCustomOptionSF(option);
    await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
    await productSF.limitTimeWaitAttributeChange(productSF.getXpathThumbnailWithIndex("2"));
  }
  await productSF.clickOnBtnPreviewSF();
  await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
  await snapshotFixture.verify({
    page: productSF.page,
    snapshotName: optionValues.image,
    selector: productSF.xpathPopupLivePreview(1),
  });
};

export const addConditionalLogic = async (
  product: ProductPage,
  personalize: Personalize,
  conf: Config,
  dashboard: Page,
  blockConditions: blockCondition[],
) => {
  for (const condition of blockConditions) {
    await personalize.clickIconAddConditionLogic(condition);
    await personalize.addMultipleConditionalLogic(condition.conditions);
    await dashboard.click(personalize.xpathIconBack);
  }
};

// chỉ sử dụng khi đã tạo customize group rồi và view sf rồi
// type_file: image,print_file
export const editCustomizeGroupAndCheckSF = async (
  product: ProductPage,
  personalize: Personalize,
  productSF: SFProduct,
  customizeInfo: CustomizeGroup,
  hasDragDrop: boolean,
  typeFile: string,
  conf: Config,
  dashboard: Page,
  snapshotFixture: SnapshotFixture,
) => {
  await dashboard.locator(personalize.xpathEditOption).click();
  await product.setupCustomizeGroup(customizeInfo, true);
  if (hasDragDrop) {
    await dashboard.locator(personalize.xpathEditOption).click();
    await dashboard.waitForSelector(product.getXpathDragDropGroup(customizeInfo.drag_drop.from));
    await product.dragAndDrop({
      from: {
        selector: product.getXpathDragDropGroup(customizeInfo.drag_drop.from),
      },
      to: {
        selector: product.getXpathDragDropGroup(customizeInfo.drag_drop.to),
      },
    });
  }
  await product.clickOnBtnWithLabel("Save");
  await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);

  await productSF.page.reload();
  if (typeFile == "print_file") {
    await productSF.page.waitForSelector(".product-property__field");
  } else {
    await productSF.page.waitForSelector(productSF.xpathButtonPreview);
  }
  await snapshotFixture.verify({
    page: productSF.page,
    snapshotName: customizeInfo.image_name,
    selector: ".product-property",
  });
};

export const verifyPrintFile = async (
  lineItem: number,
  ordersPage: OrdersPage,
  personalize: Personalize,
  conf: Config,
  dashboard: Page,
  context: BrowserContext,
  snapshotFixture: SnapshotFixture,
) => {
  await dashboard.locator(ordersPage.xpathIconActionPrintFile(lineItem)).click();
  const [newPage] = await Promise.all([
    context.waitForEvent("page"),
    await dashboard.click(personalize.getXpathWithLabel("Preview")),
  ]);
  await waitForImageLoaded(newPage, "img");
  await snapshotFixture.verify({
    page: newPage,
    snapshotName: conf.caseConf.line_item_preview_file[lineItem - 1],
  });
};

/**
 * validate field in customize group
 * @param customizeGroup include option, label, name and default value
 * @param personalize page Personalize
 * expect input: string, drag_drop: verify, show_group: verify
 */
export const validateFieldCustomizeGroup = async (
  personalize: Personalize,
  customizeGroup: CustomizeGroupValidate,
  snapshotFixture: SnapshotFixture,
) => {
  await personalize.page
    .locator("//label[normalize-space()='Display the options as']//parent::div//select")
    .selectOption({
      label: customizeGroup.option_group,
    });
  for (const field of customizeGroup.fields) {
    switch (field.field_type) {
      case "input":
        await personalize.page.fill(`//input[@placeholder='${field.placeholder}']`, field.value);
        if (!field.expect || field.expect.length < 1) {
          break;
        }
        await expect(
          personalize.page.locator(
            `//input[@placeholder="${field.placeholder}"]/parent::div/following-sibling::div[@class='s-form-item__error']`,
          ),
        ).toHaveText(field.expect);
        break;
      case "show_group":
        await snapshotFixture.verify({
          page: personalize.page,
          snapshotName: field.expect,
          selector: ".list-groups__container",
        });
        break;
      case "image":
        // kiểm tra required khi chưa chọn ảnh
        if (field.value.length < 1) {
          await expect(
            personalize.page.locator(
              `//div[contains(@class,'s-form-item__content') and descendant::span[normalize-space()='${field.placeholder}']]//div[@class='s-form-item__error']`,
            ),
          ).toHaveText(field.expect);
          break;
        }
        // kiểm tra upload img success
        if (field.image_success) {
          await personalize.page.setInputFiles(
            `//div[contains(@class,'s-form-item__content') and descendant::span[normalize-space()='${field.placeholder}']]//input[@type='file']`,
            field.value,
          );
          await personalize.waitForElementVisibleThenInvisible(personalize.xpathUploadImageLoad);
          await snapshotFixture.verify({
            page: personalize.page,
            snapshotName: field.expect,
            selector: ".list-groups__container",
          });
          break;
        }
        // kiểm tra sai định dạng img và img > 20mb
        if (field.value_fallback) {
          await prepareFile(field.value_fallback, field.value);
        }
        await personalize.page.setInputFiles(
          `//div[contains(@class,'s-form-item__content') and descendant::span[normalize-space()='${field.placeholder}']]//input[@type='file']`,
          field.value,
        );
        expect(await personalize.isToastMsgVisible(field.expect)).toBe(true);
        break;
      case "drag_drop":
        if (!field.drag_drop || !field.drag_drop.from || !field.drag_drop.to) {
          break;
        }
        await personalize.dragAndDrop({
          from: {
            selector: personalize.getXpathDragDropGroup(field.drag_drop.from),
          },
          to: {
            selector: personalize.getXpathDragDropGroup(field.drag_drop.to),
          },
        });
        // đợi element kéo thả ổn định rồi mới chụp
        await personalize.page.waitForTimeout(2000);
        await snapshotFixture.verify({
          page: personalize.page,
          snapshotName: field.expect,
          selector: ".list-groups__container",
        });
        break;
    }
  }
};
