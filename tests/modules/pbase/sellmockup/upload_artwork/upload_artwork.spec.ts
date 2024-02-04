import { defaultSnapshotOptions } from "@constants/visual_compare";
import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import path from "path";
import appRoot from "app-root-path";

let printbasePage: PrintBasePage;

test.describe("Upload artwork", async () => {
  let status;

  test(`@SB_PRB_SCWM_26 [Upload artwork] Verify add new layer text`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }, testInfo) => {
    //Prodtest không import camp được - fix sau
    if (process.env.ENV == "prodtest") {
      return;
    }

    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);

    const importCampaign = conf.caseConf.import_campaign;
    const importInfo = conf.suiteConf.import_info;
    const campName = conf.caseConf.camp_name;
    const layerTextBlank = conf.caseConf.layer_text_blank;
    const layerTextVerify = conf.caseConf.layer_text_verify;
    const picture = conf.caseConf.picture;
    const message = conf.caseConf.message;
    const layerAdd = conf.caseConf.layer_add;

    await test.step("Pre-condition: Import campaign", async () => {
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
      await printbasePage.searchWithKeyword(campName);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      const pathFile = path.join(appRoot + `${importCampaign.file_path}`);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.importProduct(pathFile, printbasePage.xpathImportFile, false, true);

      // wait for import success
      do {
        await printbasePage.page.waitForTimeout(60000);
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.clickProgressBar();
        status = await printbasePage.getStatus(importCampaign.file_name, 1);
      } while (status !== importInfo.status);
    });

    await test.step(`1. Mở màn hình product detail > 2. Click vào btn Upload artwork`, async () => {
      await printbasePage.openCampSFFromCampDetail(campName);
      await printbasePage.page.waitForSelector(printbasePage.getXpathWithLabel("Upload Artwork"));
      await printbasePage.clickElementWithLabel("span", "Upload Artwork");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadPage);
      await printbasePage.page.waitForLoadState("networkidle");
      await printbasePage.page.waitForSelector(printbasePage.xpathLeftMenuEditor);
      await printbasePage.removeLiveChat();

      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.editor_page,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Tại left menu, click btn "Add text" cho base Unisex T-shirt > Verify trạng thái ban đầu của left menu editor và ảnh template của sản phẩm`, async () => {
      await printbasePage.addNewLayer(layerAdd);
      await printbasePage.openLayerDetail(layerAdd);

      //Verify trạng thái ban đầu của left menu editor
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.layer_add,
        selector: printbasePage.xpathLeftMenuEditor,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });

      //Verify ảnh template của sản phẩm
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.image_editor,
        selector: printbasePage.xpathImageInEditor,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Bỏ trống lần lượt 1 trong số các text field: text,Location X, Location Y, Layer size W, Layer size H, Rotation, Opacity `, async () => {
      for (const [prefix, label] of Object.entries(layerTextBlank) as string[][]) {
        await printbasePage.clearInPutData(printbasePage.xpathLayerDetailInput(prefix, label));
      }
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.layer_text_blank,
        selector: printbasePage.xpathLeftMenuEditor,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });

      await dashboard.click(printbasePage.xpathIconBack);
    });

    await test.step(`Thay đổi thông số lần lượt trong số các filed và nhập đủ thông tin`, async () => {
      for (let i = 0; i < layerTextVerify.length; i++) {
        await printbasePage.editLayerDetail(layerTextVerify[i]);
        await printbasePage.openLayerDetail(layerTextVerify[i]);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${i + 1}-${picture.layer_text_verify}`,
          selector: printbasePage.xpathLeftMenuEditor,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });

        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${i + 1}-${picture.image_editor}`,
          selector: printbasePage.xpathImageEditor,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
        await dashboard.click(printbasePage.xpathIconBack);
      }
    });

    await test.step(`Click btn Preview trên màn editor`, async () => {
      await printbasePage.clickElementWithLabel("a", "Preview");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.preview,
        selector: printbasePage.xpathMockupPreviewOnEditor,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Click "Save changes"`, async () => {
      await printbasePage.clickOnBtnWithLabel("Save change");
      await expect(await printbasePage.toastWithMessage(message)).toBeVisible();
      await printbasePage.page.waitForSelector(printbasePage.xpathTitle);
    });
  });

  test(`@SB_PRB_SCWM_27 [Upload artwork] Verify Add new layer image`, async ({ dashboard, conf, snapshotFixture }) => {
    //Prodtest không import camp được - fix sau
    if (process.env.ENV == "prodtest") {
      return;
    }
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    test.setTimeout(conf.suiteConf.timeout);
    const picture = conf.caseConf.picture;
    const message = conf.caseConf.message;
    const layerImageArtwork = conf.caseConf.layer_image_artwork;
    const validImage = conf.caseConf.valid_image;
    const campName = conf.caseConf.camp_name;
    const importCampaign = conf.caseConf.import_campaign;
    const importInfo = conf.suiteConf.import_info;

    await test.step(`Pre-condition: Import campaign`, async () => {
      printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campName);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      const pathFile = path.join(appRoot + `${importCampaign.file_path}`);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
      await printbasePage.importProduct(pathFile, printbasePage.xpathImportFile, false, true);

      // wait for import success
      do {
        await printbasePage.page.waitForTimeout(60000);
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.clickProgressBar();
        status = await printbasePage.getStatus(importCampaign.file_name, 1);
      } while (status !== importInfo.status);
    });

    await test.step(`Click vào btn Upload artwork > Tại left menu, click btn Add image > Click btn Upload`, async () => {
      await printbasePage.openCampSFFromCampDetail(campName);
      await printbasePage.page.waitForSelector(printbasePage.getXpathWithLabel("Upload Artwork"));
      await printbasePage.clickElementWithLabel("span", "Upload Artwork");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathLoadPage);
      await printbasePage.page.waitForSelector(printbasePage.xpathLeftMenuEditor);
      await printbasePage.clickElementWithLabel("span", "Add image");
    });

    await test.step(`Thay đổi Option thành All files > chọn 1 file image có định dạng khác với định dạng .jbg/.png/.psd`, async () => {
      await printbasePage.page
        .locator(printbasePage.xpathBtUploadArtwork)
        .setInputFiles(`./data/shopbase/import_product_collection.csv`);

      const wholePage = await dashboard.locator("body");
      await expect(wholePage).not.toContainText("import_product_collection.csv");
    });

    await test.step(`Click lại btn Add image > Click btn Upload > chọn 1 file hợp lệ > Click btn "Upload"`, async () => {
      for (let j = 0; j < validImage.length; j++) {
        await printbasePage.page
          .locator(printbasePage.xpathBtUploadArtwork)
          .setInputFiles(`./data/shopbase/${validImage[j]}`);

        await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProcessUploadArtwork);
        await printbasePage.waitForElementVisibleThenInvisible(
          "//div[@class='layer__list default-layer__list']//div[contains(@class,'s-caption')]",
        );
        await printbasePage.page.waitForTimeout(5000);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${j + 1}-${picture.artwork_valid}`,
          selector: printbasePage.getXpathArtworkByName(validImage[j]),
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }

      await printbasePage.page.click(printbasePage.getXpathArtworkByName(validImage[0]));
    });

    await test.step(`Thay đổi thông số lần lượt trong số các filed và nhập đủ thông tin`, async () => {
      await dashboard.click(printbasePage.xpathIconBack);
      await printbasePage.editLayerDetail(layerImageArtwork);
      await printbasePage.openLayerDetail(layerImageArtwork);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.layer_image,
        selector: printbasePage.xpathLeftMenuEditor,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });

      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.layer_image_artwork,
        selector: printbasePage.xpathImageEditor,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Click btn Preview trên màn editor`, async () => {
      await printbasePage.clickElementWithLabel("a", "Preview");
      await printbasePage.waitUntilElementInvisible(printbasePage.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: picture.preview,
        selector: printbasePage.xpathMockupPreviewOnEditor,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Click "Save changes"`, async () => {
      await printbasePage.clickOnBtnWithLabel("Save change");
      await expect(await printbasePage.toastWithMessage(message)).toBeVisible();
      await printbasePage.page.waitForSelector(printbasePage.xpathTitle);
    });
  });
});
