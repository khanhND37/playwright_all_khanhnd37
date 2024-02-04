import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { Personalize } from "@pages/dashboard/personalize";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@sf_pages/checkout";
import { waitForImageLoaded } from "@utils/theme";
import { OrdersPage } from "@pages/dashboard/orders";

let personalizePage: Personalize;
let SFPage;
let productSF: SFProduct;
let checkoutSF: SFCheckout;
let orderName;
let ordersPage: OrdersPage;
let newPage;

const conf = loadData(__dirname, "DATA_DRIVEN");
for (let i = 0; i < conf.caseConf.data.length; i++) {
  const caseData = conf.caseConf.data[i];

  test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, context, snapshotFixture }) => {
    const productInfo = caseData.product_info;
    const imageMockup = caseData.image_mockup;
    const buttonClickOpenEditor = caseData.button_click_open_editor;
    const layerList = caseData.layers;
    const groupList = caseData.groups;
    const addLayerToGroup = caseData.add_layers_to_group;
    const customizeGroup = caseData.customize_group;
    const customOption = caseData.custom_option;
    const customOptionSF = caseData.custom_options_sf;
    const conditionalLogicInfor = caseData.conditional_logic_info;
    const picture = caseData.picture;
    personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);

    test.setTimeout(conf.suiteConf.timeout);
    await test.step("Pre-condition: Tạo product", async () => {
      await personalizePage.navigateToMenu("Products");
      await personalizePage.searchProdByName(productInfo.title);
      await personalizePage.deleteProduct(conf.suiteConf.password);

      await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(
        productInfo,
        imageMockup,
        buttonClickOpenEditor,
      );
    });

    await test.step("Tại màn hình editor > Add layer và tạo group > Add layer vào group", async () => {
      for (let i = 0; i < groupList.length; i++) {
        await personalizePage.createGroupLayer(groupList[i].current_group, groupList[i].new_group);
        for (let j = 0; j < 2 * (i + 1); j++) {
          await personalizePage.addLayer(layerList[j]);
        }
        await personalizePage.addLayerToGroup(addLayerToGroup[i].layer_name, addLayerToGroup[i].group_name);
      }
      const countGroupLayers = await personalizePage.page.locator(personalizePage.xpathGroupLayer).count();
      await expect(countGroupLayers).toEqual(groupList.length);
    });

    await test.step("Click vào btn Customize layer > Tạo các custom option tương ứng", async () => {
      await personalizePage.page.click(personalizePage.xpathIconExpand);
      await personalizePage.clickOnBtnWithLabel("Customize layer", 1);
      await personalizePage.addListCustomOptionOnEditor(customOption);
      await snapshotFixture.verifyWithAutoRetry({
        page: personalizePage.page,
        selector: personalizePage.xpathListCustomOptionEditor,
        snapshotName: `${caseData.case_id}-${picture.list_custom_option}`,
        sizeCheck: true,
      });
    });

    await test.step("Click vào icon Expand > Click vào btn Customize group > Tạo customize group", async () => {
      await personalizePage.setupCustomizeGroup(customizeGroup);
      await personalizePage.page.click(personalizePage.getXpathNameLabelInCOList(caseData.customize_group.label_group));
      await snapshotFixture.verifyWithAutoRetry({
        page: personalizePage.page,
        selector: personalizePage.xpathCustomizeGroupContainer,
        snapshotName: `${caseData.case_id}-${picture.customize_group_detail}`,
        sizeCheck: true,
      });
      await personalizePage.page.click(personalizePage.xpathIconBack);
    });

    if (caseData.case_id === "SB_CGSB_26" || caseData.case_id === "SB_CGSB_27" || caseData.case_id === "SB_CGSB_28") {
      await test.step("Tạo conditional logic", async () => {
        await personalizePage.addListConditionLogic(conditionalLogicInfor);
        await snapshotFixture.verifyWithAutoRetry({
          page: personalizePage.page,
          selector: personalizePage.xpathListCustomOptionEditor,
          snapshotName: `${caseData.case_id}-${picture.conditional_logic}`,
          sizeCheck: true,
        });
      });
    }

    if (caseData.case_id === "SB_CGSB_28" || caseData.case_id === "SB_CGSB_29" || caseData.case_id === "SB_CGSB_25") {
      await test.step('Click vào btn Save > Click btn "Next, create Print file" > Upload mockup print file', async () => {
        await personalizePage.clickOnBtnWithLabel("Save");
        await personalizePage.clickOnBtnWithLabel("Next, create Print file");
        await personalizePage.page.setInputFiles(
          personalizePage.xpathBtnUploadMockup("Upload your Print template"),
          `./data/shopbase/${caseData.print_file_mockup}`,
        );
        await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
        await personalizePage.page.click(personalizePage.xpathIconExpand);
        await snapshotFixture.verifyWithAutoRetry({
          page: personalizePage.page,
          selector: personalizePage.xpathListCustomOptionEditor,
          snapshotName: `${caseData.case_id}-${picture.list_custom_option_print_file}`,
          sizeCheck: true,
        });
      });
    }

    await test.step("Click btn Save > Click btn Cancle > View product ngoài SF >Select lần lượt từng group > Input các custom option tương ứng > Verify hiển thị preview image", async () => {
      await personalizePage.clickOnBtnWithLabel("Save");
      await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathToastMessage);
      await personalizePage.clickOnBtnWithLabel("Cancel");
      [SFPage] = await Promise.all([context.waitForEvent("page"), await personalizePage.clickViewProductSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      checkoutSF = new SFCheckout(SFPage, conf.suiteConf.domain);
      await productSF.page.waitForLoadState("domcontentloaded");

      if (
        caseData.case_id === "SB_CGSB_26" ||
        caseData.case_id === "SB_CGSB_29" ||
        caseData.case_id === "SB_CGSB_23" ||
        caseData.case_id === "SB_CGSB_25" ||
        caseData.case_id === "SB_CGSB_28"
      ) {
        for (let i = 0; i < customOptionSF.length; i++) {
          await productSF.inputCustomAllOptionSF(customOptionSF[i]);
          await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoadImage);
          await snapshotFixture.verify({
            page: productSF.page,
            selector: `${productSF.getXpathMainImageOnSF(caseData.product_info.title)}`,
            snapshotName: `${caseData.case_id}-${picture.image_instant_preview}-${i + 1}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
          await productSF.clickOnBtnPreviewSF();
          await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
          await snapshotFixture.verify({
            page: productSF.page,
            selector: productSF.xpathPopupLivePreview(),
            snapshotName: `${caseData.case_id}-${picture.image_preview}-${i + 1}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
          await productSF.page.click(productSF.xpathBtbClose);
        }
      } else {
        await productSF.inputCustomAllOptionSF(customOptionSF);
        await checkoutSF.checkoutProductWithUsellNoVerify(conf.suiteConf.customer_info, conf.suiteConf.card_info);
        orderName = await checkoutSF.getOrderName();
      }

      if (caseData.case_id === "SB_CGSB_27" || caseData.case_id === "SB_CGSB_24") {
        await test.step("Vào order detail > Verify hiển thị trong order detail", async () => {
          await personalizePage.navigateToMenu("Orders");
          await ordersPage.searchOrder(orderName);
          await ordersPage.goToOrderDetailSBase(orderName);
          await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 30);
          await ordersPage.page.locator(ordersPage.xpathIconActionPrintFile(1)).click();
          [newPage] = await Promise.all([
            context.waitForEvent("page"),
            await ordersPage.page.click(personalizePage.getXpathWithLabel("Preview")),
          ]);
          await newPage.waitForLoadState("domcontentloaded");
          await personalizePage.waitForElementVisibleThenInvisible(personalizePage.xpathIconLoading);
          await waitForImageLoaded(newPage, "//img");
          await snapshotFixture.verify({
            page: newPage,
            snapshotName: `${caseData.case_id}-${picture.gen_print_file}`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
      }
    });
  });
}
