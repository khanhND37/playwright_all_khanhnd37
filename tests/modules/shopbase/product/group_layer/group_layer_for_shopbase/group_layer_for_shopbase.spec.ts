import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { loadData } from "@core/conf/conf";
import { Personalize } from "@pages/dashboard/personalize";

test.describe("Create group layer for shop base", () => {
  let dashboardPage: DashboardPage;
  let productPage: ProductPage;
  let printbasePage: PrintBasePage;
  let personalizePage: Personalize;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    productPage = new ProductPage(dashboard, conf.suiteConf["domain"]);
    personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    await dashboardPage.navigateToMenu("Products");
  });

  const confLoadData = loadData(__dirname, "DATA_DRIVEN_CREATE_GROUP_LAYER");
  for (let i = 0; i < confLoadData.caseConf.data.length; i++) {
    const caseData = confLoadData.caseConf.data[i];
    if (caseData.enable) {
      test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, conf, snapshotFixture }) => {
        const layerAddList = caseData.layers;
        const productInfor = caseData.product_info;
        const groupAddList = caseData.groups;
        const customOptions = caseData.custom_options;
        await test.step(`Add new product > Click button ${caseData.btn_name} > Click Upload > Select image`, async () => {
          await productPage.searchProduct(productInfor.title);
          await productPage.deleteProduct(conf.suiteConf.password);
          await productPage.addNewProductWithData(productInfor);
          await productPage.clickOnBtnWithLabel(caseData.btn_name);
          await productPage.uploadImagePreviewOrPrintfile(caseData.image_preview);
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathProcessBar);
          await expect(dashboard.locator(personalizePage.xpathActionImageWithLabel(caseData.btn_delete))).toBeVisible();
        });

        await test.step("Add layer, tạo group layer sau đó add layer vào group", async () => {
          for (let i = 0; i < layerAddList.length; i++) {
            await productPage.addLayer(layerAddList[i]);
          }
          for (let i = 0; i < groupAddList.length; i++) {
            await productPage.createGroupLayer(groupAddList[i].current_group, groupAddList[i].new_group);
            await productPage.addLayerToGroup(groupAddList[i].layer_name, groupAddList[i].new_group);
            await productPage.page.waitForTimeout(3000);
          }
        });

        await test.step(`Tại Group,Click dấu 3 chấm > Chọn ${caseData.action_name} for group`, async () => {
          if (caseData.action == "true") {
            await dashboard.click(productPage.getXpathGroupName(caseData.group_name));
            await printbasePage.clickActionsGroup(caseData.group_name, caseData.action_name);
            await productPage.page.waitForTimeout(3000);
            await snapshotFixture.verify({
              page: dashboard,
              snapshotName: `${caseData.picture.action_group}`,
              snapshotOptions: conf.suiteConf.snapshot_options,
            });
          }
        });

        await test.step(`Add Custom option > Click button ${caseData.button_next} > Upload image > Verify hiển thị layer và group`, async () => {
          await printbasePage.clickBtnAddCO();
          for (let i = 0; i < customOptions.length; i++) {
            await productPage.addCustomOptionOnEditor(customOptions[i]);
          }
          await productPage.waitBtnEnable("Save");
          await productPage.clickOnBtnWithLabel(caseData.button_next);
          await productPage.uploadImagePreviewOrPrintfile(caseData.image_preview);
          await productPage.removeLiveChat();
          await snapshotFixture.verifyWithAutoRetry({
            page: dashboard,
            snapshotName: caseData.picture.show_group,
            sizeCheck: true,
          });
        });

        await test.step("Click buton Save > Verify Image preview va Print files ở màn Product detail", async () => {
          await productPage.clickOnBtnWithLabel("Save");
          await productPage.clickOnBtnWithLabel("Cancel");
          await productPage.page.waitForTimeout(5000);
          await productPage.waitUntilElementVisible(personalizePage.xpathPreviewImageWithLabel("Preview Image"));
          expect(await productPage.checkImageEnableAfterCreated("Preview Image")).toEqual(true);
          expect(await productPage.checkImageEnableAfterCreated("Print Files")).toEqual(true);
        });
      });
    }
  }
});
