import { test } from "@core/fixtures";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { SFProduct } from "@sf_pages/product";
import { loadData } from "@core/conf/conf";
import { ProductPage } from "@pages/dashboard/products";
import { Personalize } from "@pages/dashboard/personalize";
import { SFCheckout } from "@sf_pages/checkout";
import { OrdersPage } from "@pages/dashboard/orders";

test.describe("Improve design feature group ShopBase", () => {
  let productPage: ProductPage;
  let personalize: Personalize;
  let checkoutSF: SFCheckout;
  let ordersPage: OrdersPage;
  let newPage;
  let orderName;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    personalize = new Personalize(dashboard, conf.suiteConf.domain);
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (const caseData of conf.caseConf.data) {
    if (caseData.enable) {
      test(`@${caseData.case_id} - ${caseData.description}`, async ({ conf, snapshotFixture, context }) => {
        const layers = caseData.layers;
        const picture = caseData.picture;
        const productInfo = caseData.product_info;
        const customOptionsDashboard = caseData.custom_option_dashboard;
        const customOptionSF = caseData.custom_option_sf;
        const customerInfo = conf.suiteConf.customer_info;
        const cardInfo = conf.suiteConf.card_info;
        const imagePreview = caseData.preview_image;

        await test.step("Pre-conditions: Clear data > Add product chứa preview image/print file", async () => {
          await productPage.navigateToMenu("Products");
          await productPage.searchProdByName(productInfo.title);
          await productPage.deleteProduct(conf.suiteConf.password);
          if (
            caseData.case_id === "SB_PRB_EDT_164" ||
            caseData.case_id === "SB_PRB_EDT_172" ||
            caseData.case_id === "SB_PRB_EDT_173"
          ) {
            await personalize.addProductAndAddConditionLogicCO(
              productInfo,
              imagePreview,
              layers,
              customOptionsDashboard,
              null,
              "Create Print file",
            );
          } else {
            await personalize.addProductAndAddConditionLogicCO(
              productInfo,
              imagePreview,
              layers,
              customOptionsDashboard,
            );
          }
        });

        await test.step("Không select layer nào cả > Verify hiển thị icon trên thanh task bar", async () => {
          await snapshotFixture.verify({
            page: productPage.page,
            selector: productPage.xpathTaskBar,
            snapshotName: picture.no_select_layer,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });

        if (caseData.case_id === "SB_PRB_EDT_150" || caseData.case_id === "SB_PRB_EDT_164") {
          await test.step("Select Text layer 1 > Click btn Duplicate trên thanh taskbar > Verify hiển thị các layer trên template", async () => {
            await personalize.openLayerDetail(layers[0]);
            await productPage.page.click(personalize.getXpathIconOnTaskBar(caseData.type));
            await productPage.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: personalize.page,
              selector: productPage.xpathTemplateImage,
              snapshotName: picture.picture_template_text,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
            await personalize.page.click(personalize.xpathIconBack);
            await productPage.page.waitForTimeout(5000);
          });
        }

        await test.step(`Select ${layers[1]} > Click btn ${caseData.type} trên thanh taskbar > Verify hiển thị các layer trên template`, async () => {
          await personalize.openLayerDetail(layers[1]);
          await productPage.page.click(personalize.getXpathIconOnTaskBar(caseData.type));
          await productPage.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: productPage.page,
            selector: productPage.xpathTemplateImage,
            snapshotName: picture.picture_template_image,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });

        await test.step("Click btn Save > Click btn Cancel > View product ngoài SF > Input custom option > Verify image preview hoặc checkout thành công", async () => {
          if (caseData.case_id === "SB_PRB_EDT_177" || caseData.case_id === "SB_PRB_EDT_178") {
            await productPage.clickOnBtnWithLabel("Next, create Print file");
            await productPage.page.setInputFiles(
              personalize.xpathBtnUploadMockup("Upload your Print template"),
              `./data/shopbase/${caseData.print_file}`,
            );
            await productPage.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
            await snapshotFixture.verify({
              page: productPage.page,
              selector: productPage.xpathTemplateImage,
              snapshotName: `print-file-${picture.picture_template_image}`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
          await productPage.clickOnBtnWithLabel("Save");
          await productPage.clickOnBtnWithLabel("Cancel");
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
          const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
          checkoutSF = new SFCheckout(SFPage, conf.suiteConf.domain);
          await productSF.inputCustomAllOptionSF(customOptionSF);
          if (
            caseData.case_id === "SB_PRB_EDT_150" ||
            caseData.case_id === "SB_PRB_EDT_158" ||
            caseData.case_id === "SB_PRB_EDT_159" ||
            caseData.case_id === "SB_PRB_EDT_177" ||
            caseData.case_id === "SB_PRB_EDT_178"
          ) {
            await productSF.clickOnBtnPreviewSF();
            await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
            await snapshotFixture.verify({
              page: productSF.page,
              selector: productSF.xpathPopupLivePreview(1),
              snapshotName: picture.image_sf,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
              sizeCheck: true,
            });
          } else {
            await checkoutSF.checkoutProductWithUsellNoVerify(customerInfo, cardInfo);
            orderName = await checkoutSF.getOrderName();
          }
        });

        if (
          caseData.case_id === "SB_PRB_EDT_164" ||
          caseData.case_id === "SB_PRB_EDT_172" ||
          caseData.case_id === "SB_PRB_EDT_173"
        ) {
          await test.step("Vào order detail > Verify hiển thị trong order detail", async () => {
            await productPage.navigateToMenu("Orders");
            await ordersPage.searchOrder(orderName);
            await ordersPage.goToOrderDetailSBase(orderName);
            await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName);
            await ordersPage.page.locator(ordersPage.xpathIconActionPrintFile(1)).click();
            [newPage] = await Promise.all([
              context.waitForEvent("page"),
              await ordersPage.page.click(personalize.getXpathWithLabel("Preview")),
            ]);
            await newPage.waitForLoadState("domcontentloaded");
            await personalize.waitForElementVisibleThenInvisible(personalize.xpathIconLoading);
            await waitForImageLoaded(newPage, "//img");
            //thêm wait do thi thoảng vẫn bị chậm
            await productPage.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: newPage,
              snapshotName: picture.gen_print_file,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
        }
      });
    }
  }
});
