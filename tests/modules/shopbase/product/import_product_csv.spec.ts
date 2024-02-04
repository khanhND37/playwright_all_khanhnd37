import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import path from "path";
import { DashboardPage } from "@pages/dashboard/dashboard";
import appRoot from "app-root-path";
import { FixtureScheduler, ImportProductSchedule } from "@types";
import { snapshotDir } from "@utils/theme";
import { Page } from "@playwright/test";

test.describe("Allow sellers import products by csv", async () => {
  let product: ProductPage;
  let dashboardPage;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    const env = process.env.ENV;
    // Skip all case on prodtest env
    if (env === "prodtest") {
      return;
    }

    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    product = new ProductPage(dashboard, conf.suiteConf["domain"]);
    await dashboardPage.navigateToMenu("Products");
  });

  test(`[Import csv] Import file csv đúng format @SB_PRO_IMP_111`, async ({
    dashboard,
    conf,
    authRequest,
    scheduler,
  }) => {
    const env = process.env.ENV;
    // Skip all case on prodtest env
    if (env === "prodtest") {
      return;
    }

    test.setTimeout(conf.suiteConf.timeout);
    const importInfo = conf.caseConf.import_info;
    const productValidateDetail = conf.caseConf.product_validate_detail;
    const productValidateSF = conf.caseConf.product_validate_sf;
    let scheduleData: ImportProductSchedule;
    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as ImportProductSchedule;
    }
    if (!rawDataJson) {
      scheduleData = {
        retry_image: false,
        max_retry_image: 3,
        completed: true,
        max_retry_status: 5,
      };
    }
    await test.step(`Vào màn hình Products>All products sau đó import product by CSV`, async () => {
      if (scheduleData.retry_image || !scheduleData.completed) {
        return;
      }
      // await product.deleteProduct(conf.suiteConf.password);
      await dashboard.reload();
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      const pathFile = path.join(appRoot + conf.caseConf.path_file);
      await product.importProduct(
        pathFile,
        `//input[@type='file' and @accept='.zip, .csv']`,
        importInfo.override,
        true,
      );
    });
    await test.step(`Check hiển thị process import`, async () => {
      if (scheduleData.retry_image) {
        return;
      }
      await product.navigateToMenu("Products");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.clickProgressBar();
      await setSchedulerWithStatusProcessing(conf.caseConf.file_name, "Completed", scheduleData, scheduler, 10);
      expect(await product.getStatus(conf.caseConf.file_name)).toEqual(importInfo.status);
      expect(await product.getProcess(conf.caseConf.file_name)).toEqual(importInfo.process);
      await dashboard.reload();
    });
    await test.step(`Verify thông tin của product trong màn hình product detail`, async () => {
      await product.searchProduct(productValidateDetail.product_name);
      await product.chooseProduct(productValidateDetail.product_name);
      await dashboard.reload();
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await setSchedulerCountProductImage(productValidateDetail.number_image, dashboard, scheduleData, scheduler);
      await scheduler.clear();
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
    });
    await test.step(`Verify thông tin product ngoài SF`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
    });
  });

  // eslint-disable-next-line max-len
  test(`[Import csv] Import file csv  khi không tick chọn override, file csv chứa những product đã tồn tại trong hệ thống @SB_PRO_IMP_119`, async ({
    dashboard,
    conf,
    scheduler,
  }) => {
    const env = process.env.ENV;
    // Skip all case on prodtest env
    if (env === "prodtest") {
      return;
    }

    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const importInfo = conf.caseConf.import_info;
    let scheduleData: ImportProductSchedule;
    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as ImportProductSchedule;
    }
    if (!rawDataJson) {
      scheduleData = {
        completed: true,
        max_retry_status: 5,
      };
    }
    // eslint-disable-next-line max-len
    await test.step(`Vào màn hình Products>All products sau đó import product by CSV, không tick chọn override`, async () => {
      if (!scheduleData.completed) {
        return;
      }
      const pathFile = path.join(appRoot + conf.caseConf.path_file);
      await product.importProduct(
        pathFile,
        `//input[@type='file' and @accept='.zip, .csv']`,
        importInfo.override,
        true,
      );
    });
    await test.step(`Check hiển thị process import`, async () => {
      await product.navigateToMenu("Products");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.clickProgressBar();
      await setSchedulerWithStatusProcessing(conf.caseConf.file_name, "Completed", scheduleData, scheduler, 5);
      await scheduler.clear();
      expect(await product.getStatus(conf.caseConf.file_name)).toEqual(importInfo.status);
      expect(await product.getProcess(conf.caseConf.file_name)).toEqual(importInfo.process);
    });
  });

  // eslint-disable-next-line max-len
  test(`[Import csv] Import file csv chưa chỉnh sửa khi tick chọn override, file csv chứa những product đã tồn tại trong hệ thống @SB_PRO_IMP_118`, async ({
    dashboard,
    conf,
    authRequest,
    scheduler,
  }) => {
    const env = process.env.ENV;
    // Skip all case on prodtest env
    if (env === "prodtest") {
      return;
    }

    test.setTimeout(conf.suiteConf.timeout);
    const importInfo = conf.caseConf.import_info;
    const productValidateDetail = conf.caseConf.product_validate_detail;
    const productValidateSF = conf.caseConf.product_validate_sf;
    let scheduleData: ImportProductSchedule;
    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as ImportProductSchedule;
    }
    if (!rawDataJson) {
      scheduleData = {
        retry_image: false,
        max_retry_image: 3,
        completed: true,
        max_retry_status: 5,
      };
    }

    await test.step(`Vào màn hình Products>All products sau đó import product by CSV, tick chọn override`, async () => {
      if (scheduleData.retry_image || !scheduleData.completed) {
        return;
      }
      const pathFile = path.join(appRoot + conf.caseConf.path_file);
      await product.importProduct(
        pathFile,
        `//input[@type='file' and @accept='.zip, .csv']`,
        importInfo.override,
        true,
      );
    });
    await test.step(`Check hiển thị process import`, async () => {
      if (scheduleData.retry_image) {
        return;
      }
      await product.navigateToMenu("Products");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.clickProgressBar();
      await setSchedulerWithStatusProcessing(conf.caseConf.file_name, "Completed", scheduleData, scheduler, 5);
      expect(await product.getStatus(conf.caseConf.file_name)).toEqual(importInfo.status);
      expect(await product.getProcess(conf.caseConf.file_name)).toEqual(importInfo.process);
      await dashboard.reload();
    });
    await test.step(`Verify thông tin của product trong màn hình product detail`, async () => {
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.searchProduct(productValidateDetail.product_name);
      await product.chooseProduct(productValidateDetail.product_name);
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await setSchedulerCountProductImage(productValidateDetail.number_image, dashboard, scheduleData, scheduler);
      await scheduler.clear();
      const productId = await product.getProductId(
        authRequest,
        productValidateDetail.product_name,
        conf.suiteConf.domain,
      );
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
    });
    await test.step(`Verify thông tin product ngoài SF`, async () => {
      const productId = await product.getProductId(authRequest, productValidateSF.product_name, conf.suiteConf.domain);
      const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
      expect(
        await product.getProductInfoStoreFrontByApi(
          authRequest,
          conf.suiteConf.domain,
          productHandle,
          productValidateSF,
        ),
      ).toEqual(productValidateSF);
    });
  });

  test(
    `[Import csv] Import file csv chỉnh sửa handle, các trường khác giữ nguyên khi tick  chọn override, ` +
      `file csv chứa những product đã tồn tại trong hệ thống @SB_PRO_IMP_123`,
    async ({ dashboard, conf, authRequest, scheduler }) => {
      const env = process.env.ENV;
      // Skip all case on prodtest env
      if (env === "prodtest") {
        return;
      }

      test.setTimeout(conf.suiteConf.timeout);
      const product = new ProductPage(dashboard, conf.suiteConf.domain);
      const importInfo = conf.caseConf.import_info;
      const productValidateDetail = conf.caseConf.product_validate_detail;
      const productValidateSF = conf.caseConf.product_validate_sf;
      let scheduleData: ImportProductSchedule;
      const rawDataJson = await scheduler.getData();
      if (rawDataJson) {
        scheduleData = rawDataJson as ImportProductSchedule;
      }
      if (!rawDataJson) {
        scheduleData = {
          retry_image: false,
          max_retry_image: 3,
          completed: true,
          max_retry_status: 5,
        };
      }
      await test.step(
        `Vào màn hình Products>All products sau đó import product by CSV, ` + `tick chọn override`,
        async () => {
          if (scheduleData.retry_image || !scheduleData.completed) {
            return;
          }
          const pathFile = path.join(appRoot + conf.caseConf.path_file);
          await product.importProduct(
            pathFile,
            `//input[@type='file' and @accept='.zip, .csv']`,
            importInfo.override,
            true,
          );
        },
      );
      await test.step(`Check hiển thị process import`, async () => {
        if (scheduleData.retry_image) {
          return;
        }
        await product.navigateToMenu("Products");
        await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
        await product.clickProgressBar();
        await setSchedulerWithStatusProcessing(conf.caseConf.file_name, "Completed", scheduleData, scheduler, 8);
        expect(await product.getStatus(conf.caseConf.file_name)).toEqual(importInfo.status);
        expect(await product.getProcess(conf.caseConf.file_name)).toEqual(importInfo.process);
      });
      await test.step(`Verify thông tin của product trong màn hình product detail`, async () => {
        await dashboard.reload();
        await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
        await product.searchProduct(productValidateDetail.product_name);
        await product.chooseProduct(productValidateDetail.product_name);
        await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
        await setSchedulerCountProductImage(productValidateDetail.product_name, dashboard, scheduleData, scheduler);
        await scheduler.clear();
        const productId = await product.getProductId(
          authRequest,
          productValidateDetail.product_name,
          conf.suiteConf.domain,
        );
        expect(
          await product.getProductInfoDashboardByApi(
            authRequest,
            conf.suiteConf.domain,
            productId,
            productValidateDetail,
          ),
        ).toEqual(productValidateDetail);
      });
      await test.step(`Verify thông tin product ngoài SF`, async () => {
        const productId = await product.getProductId(
          authRequest,
          productValidateSF.product_name,
          conf.suiteConf.domain,
        );
        const productHandle = await product.getProductHandlebyApi(authRequest, conf.suiteConf.domain, productId);
        expect(
          await product.getProductInfoStoreFrontByApi(
            authRequest,
            conf.suiteConf.domain,
            productHandle,
            productValidateSF,
          ),
        ).toEqual(productValidateSF);
      });
    },
  );

  test(`@SB_PRO_IMP_152 [import CSV] Kiểm tra import thành công file csv có group variant product`, async ({
    dashboard,
    conf,
    snapshotFixture,
    scheduler,
  }) => {
    const env = process.env.ENV;
    // Skip all case on prodtest env
    if (env === "prodtest") {
      return;
    }

    const importInfo = conf.caseConf.import_info;
    const productValidateDetail = conf.caseConf.product_validate_detail;
    const verifyPicture = conf.caseConf.picture;
    let scheduleData: ImportProductSchedule;
    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as ImportProductSchedule;
    }
    if (!rawDataJson) {
      scheduleData = {
        completed: true,
        max_retry_status: 5,
      };
    }
    await test.step(`- tại Dashboard, tab bar menu -
    > click products -> click All products - tại All products, click button Import ->
     click button Choose file -> select file -> click Upload File -> click Upload File -> click OK`, async () => {
      if (!scheduleData.completed) {
        return;
      }
      const pathFile = path.join(appRoot + conf.caseConf.path_file);
      await product.importProduct(
        pathFile,
        `//input[@type='file' and @accept='.zip, .csv']`,
        importInfo.override,
        true,
      );
    });
    await test.step(`Click on product vừa đươc import > Verify hiển thị Group vairant`, async () => {
      await product.navigateToMenu("Products");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.clickProgressBar();
      await setSchedulerWithStatusProcessing(conf.caseConf.file_name, "Completed", scheduleData, scheduler, 5);
      await scheduler.clear();
      await product.clickProgressBar();
      await product.searchProduct(productValidateDetail.product_name);
      await product.chooseProduct(productValidateDetail.product_name);
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.removeBlockTitleDescription();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: product.xpathProductVariantSelector,
        snapshotName: `${process.env.ENV}-${verifyPicture.group_your_variant}`,
      });
      await snapshotFixture.verify({
        page: dashboard,
        selector: product.xpathProductGroupOption,
        snapshotName: `${process.env.ENV}-${verifyPicture.variant_select}`,
      });
    });
  });

  test(`[Import csv] Validate trường Variant Inventory Policy @TC_SB_PRO_IMP_62`, async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const importInfo = conf.caseConf.import_info;
    const productInfo = conf.caseConf.product_info;
    await test.step(`Import file csv có trường Variant Inventory Policy=null vào store`, async () => {
      const pathFile = path.join(
        appRoot + "/assets/import_product_csv/import-variant-inventory-tracker-shopbase-null.csv",
      );
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
      await product.checkMsgAfterCreated({
        errMsg: conf.caseConf.message_null,
      });
    });
    await test.step(`Import file csv có trường Variant Inventory Policy=deny`, async () => {
      const pathFile = path.join(appRoot + "/assets/import_product_csv/import-variant-inventory-tracker-shopbase.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
      await product.clickProgressBar();
      expect(product.getStatus()).toEqual(importInfo.status);
      expect(product.getProcess()).toEqual(importInfo.process);
    });
    await test.step(`Mở màn hình edit variant sau đó check giá trị trường Inventory policy`, async () => {
      await dashboard.reload();
      await product.searchProduct(productInfo.product_name1);
      await product.chooseProduct(productInfo.product_name1);
      await product.clickBtnEditVariant();
      expect(await product.getLabelInventory()).toEqual(productInfo.label_inventory);
    });
    await test.step(`Import file csv có trường Variant Inventory Policy=continue`, async () => {
      const pathFile = path.join(
        appRoot + "/assets/import_product_csv/import-variant-inventory-tracker-shopbase-continue.csv",
      );
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
      await product.clickProgressBar();
      expect(product.getStatus()).toEqual(importInfo.status);
      expect(product.getProcess()).toEqual(importInfo.process);
    });
    await test.step(`Mở màn hình edit variant sau đó check giá trị trường Inventory policy`, async () => {
      await dashboard.reload();
      await product.searchProduct(productInfo.product_name2);
      await product.chooseProduct(productInfo.product_name2);
      await product.clickBtnEditVariant();
      expect(await product.getLabelInventory()).toEqual(productInfo.label_inventory);
    });
    await test.step(`Import file csv có trường Variant Inventory Policy=shopbase`, async () => {
      const pathFile = path.join(appRoot + "/assets/import_product_csv/import-variant-inventory-tracker-shopbase1.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
      await product.checkMsgAfterCreated({
        errMsg: conf.caseConf.message_shopbase,
      });
    });
  });

  test(`[Import csv] Import file csv không có handle @TC_SB_PRO_IMP_124`, async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const errorMessage = conf.caseConf.error_message;
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    await test.step(`Vào màn hình Products>All products sau đó import file csv`, async () => {
      const pathFile = path.join(appRoot + "/assets/import_product_csv/import-without-handle.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, false);
      await product.checkMsgAfterCreated({
        errMsg: errorMessage,
      });
    });
  });

  test(`[Import csv] Import file csv không có title @TC_SB_PRO_IMP_125`, async ({ dashboard, conf }) => {
    await test.step(`Vào màn hình Products>All products sau đó click Import file csv`, async () => {
      test.setTimeout(conf.suiteConf.timeout);
      const errorMessage = conf.caseConf.error_message;
      const product = new ProductPage(dashboard, conf.suiteConf.domain);
      await test.step(`Vào màn hình Products>All products sau đó click Import file csv`, async () => {
        const pathFile = path.join(appRoot + "/assets/import_product_csv/import_product_notTitle.csv");
        await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, false);
        await product.checkMsgAfterCreated({
          errMsg: errorMessage,
        });
      });
    });

    test(`[Import csv] Import file csv sai format @TC_SB_PRO_IMP_127`, async ({ dashboard, conf }) => {
      test.setTimeout(conf.suiteConf.timeout);
      const errorMessage = conf.caseConf.error_message;
      const product = new ProductPage(dashboard, conf.suiteConf.domain);
      await test.step(`Vào màn hình Products>All products sau đó Import file csv`, async () => {
        const pathFile = path.join(appRoot + "/assets/import_product_csv/file-wrong-template.csv");
        await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, false);
        await product.checkMsgAfterCreated({
          errMsg: errorMessage,
        });
      });
    });

    // eslint-disable-next-line max-len
    test(`[Import csv] Import file csv có số lượng ảnh của 1 product > 500 ảnh, >500 variant @TC_SB_PRO_IMP_128`, async ({
      dashboard,
      conf,
    }) => {
      test.setTimeout(conf.suiteConf.timeout);
      const errorMessage = conf.caseConf.error_message;
      const product = new ProductPage(dashboard, conf.suiteConf.domain);
      await test.step(`Vào màn hình Products>All products sau đó import file csv`, async () => {
        const pathFile = path.join(appRoot + "/assets/import_product_csv/product_elder_501_images_variant.csv");
        await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, false);
        await product.checkMsgAfterCreated({
          errMsg: errorMessage,
        });
      });
    });
  });

  test(`[Import csv] Import file csv có số lượng ảnh của 1 product = 500 ảnh, 500 variant @TC_SB_PRO_IMP_112`, async ({
    dashboard,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const importInfo = conf.caseConf.import_info;
    await test.step(`Import product has 500 images`, async () => {
      const pathFile = path.join(appRoot + "/assets/import_product_csv/product_has_500_images_variant.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, importInfo.override);
    });
    await test.step(`Verify process import product`, async () => {
      await product.clickProgressBar();
      expect(product.getStatus()).toEqual(importInfo.status);
      expect(product.getProcess()).toEqual(importInfo.process);
      await dashboard.reload();
    });
    await test.step(`Verify btn Add media is disable`, async () => {
      await product.searchProduct(importInfo.product_name);
      await product.chooseProduct(importInfo.product_name);
      expect(await product.getStatusBtn("Add media")).toEqual("disabled");
      expect(await product.getStatusBtn("Add media from URL")).toEqual("disabled");
    });
  });

  const setSchedulerCountProductImage = async (
    numberImage: number,
    dashboard: Page,
    scheduleData: ImportProductSchedule,
    scheduler: FixtureScheduler,
  ) => {
    const importImageCompleted = await dashboard.locator(product.getXpathTotalProductImage(numberImage)).isVisible();
    // check nếu chưa đủ số lượng ảnh và còn lượt retry k? số lượt retry sau mỗi lần sẽ giảm đi
    if (!importImageCompleted && scheduleData.max_retry_image > 0) {
      scheduleData.retry_image = true;
      scheduleData.max_retry_image--;
      await scheduler.setData(scheduleData);
      await scheduler.schedule({ mode: "later", minutes: 5 });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
    }
  };

  const setSchedulerWithStatusProcessing = async (
    fileName: string,
    statusVerify: string,
    scheduleData: ImportProductSchedule,
    scheduler: FixtureScheduler,
    minutes = 2,
  ) => {
    const status = await product.getStatus(fileName);
    if (status != statusVerify && scheduleData.max_retry_status > 0) {
      scheduleData.completed = false;
      scheduleData.max_retry_status--;
      await scheduler.setData(scheduleData);
      await scheduler.schedule({ mode: "later", minutes: minutes });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
    }
  };
});
