import { expect, test } from "@core/fixtures";
import { HttpMethods } from "@core/services";
import { ProductAPI } from "@pages/api/product";
import { ProductPage } from "@pages/dashboard/products";
import { ProducFeedPage } from "@pages/dashboard/products/product_feeds";
import { VariantDetailPage } from "@pages/dashboard/variant_detail";
import { csvToJson, jsonToCsv } from "@helper/file";
import appRoot from "app-root-path";
import path from "path";
import { DashboardPage } from "@pages/dashboard/dashboard";
import fs from "fs";

const createFeedDashboard = async (productPage: ProductPage, feedPage: ProducFeedPage, feedInfo) => {
  await productPage.openPopupFeed();
  await feedPage.selectOptionWithLabel("Google");
  await feedPage.clickButtonOnPopUpWithLabel("Confirm");
  await feedPage.inputCreateFeedInfo(feedInfo);
  await feedPage.clickOnBtnWithLabel("Save");
};

test.describe("Verify Manage product data with product no image", async () => {
  test("Verify create feed before create product @SB_SET_SC_GMC_2", async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const domain = conf.suiteConf.domain;
    const feedInfo = conf.caseConf.feed_info;
    const waitTimeOut = conf.suiteConf.time_out;
    const handleProductValidate = conf.suiteConf.handle_product_validate;
    const waitForAPICalling = conf.suiteConf.time_out_api_calling;
    const productFile = path.join(appRoot + conf.suiteConf.import_product_path);

    const productPage = new ProductPage(dashboard, domain);
    const feedPage = new ProducFeedPage(dashboard, domain);
    const productAPI = new ProductAPI(domain, authRequest);
    const dashboardSB = new DashboardPage(dashboard, domain);
    let productIDValidate: number;

    await dashboardSB.navigateToSubMenu("Products", "Product feeds");
    await new Promise(t => setTimeout(t, waitTimeOut));
    await feedPage.deleteAllFeed();
    await dashboardSB.navigateToSubMenu("Products", "All products");
    await dashboard.waitForSelector(feedPage.xpathBell);
    await productAPI.deleteProductByAPI();
    await new Promise(t => setTimeout(t, waitTimeOut));
    await dashboard.reload();

    await test.step("Create feed in dashboard Products feed", async () => {
      await dashboardSB.navigateToSubMenu("Products", "Product feeds");
      await createFeedDashboard(productPage, feedPage, feedInfo);
      expect(await feedPage.isToastMsgVisible("Product feed was created successfully!")).toBeTruthy();
    });

    await test.step("Create product in dashboard Product list", async () => {
      await dashboardSB.navigateToSubMenu("Products", "All products");
      await dashboard.waitForSelector(feedPage.xpathBell);
      await productPage.importProduct(productFile, productPage.xpathImportFile, true);
      await new Promise(t => setTimeout(t, waitTimeOut));
      productIDValidate = await productAPI.getProductIdByHandle(handleProductValidate);
    });

    await test.step("Verify the number of product in Manage Product Data", async () => {
      const theNumberOfProduct = await productPage.getNumberProductByAPI(authRequest, domain);
      await dashboard.goto(`https://${feedPage.xpathMngProdDta}`);
      await dashboard.waitForLoadState("load");
      await feedPage.validateFeedNumberProductChanged(authRequest, productIDValidate, waitForAPICalling);
      const theNumOfProdInMngData = await feedPage.getNumberProductManageData(authRequest, domain);
      expect(theNumOfProdInMngData).toEqual(theNumberOfProduct);
    });
  });
});

test.describe("Verify flow feed with Manage product data", async () => {
  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    const domain = conf.suiteConf.domain;
    const productFile = path.join(appRoot + conf.suiteConf.import_product_path);
    const waitTimeOut = conf.suiteConf.time_out;

    const productPage = new ProductPage(dashboard, domain);
    const feedPage = new ProducFeedPage(dashboard, domain);
    const productAPI = new ProductAPI(domain, authRequest);
    const dashboardSB = new DashboardPage(dashboard, domain);

    await dashboardSB.navigateToSubMenu("Products", "Product feeds");
    await new Promise(t => setTimeout(t, waitTimeOut));
    await feedPage.deleteAllFeed();
    await dashboardSB.navigateToSubMenu("Products", "All products");
    await dashboard.waitForSelector(feedPage.xpathBell);
    await productAPI.deleteProductByAPI();
    await new Promise(t => setTimeout(t, waitTimeOut));
    await dashboard.reload();
    await dashboard.waitForSelector(feedPage.xpathBell);

    await dashboardSB.navigateToSubMenu("Products", "All products");
    await dashboard.waitForSelector(feedPage.xpathBell);
    await productPage.importProduct(productFile, productPage.xpathImportFile, true);
    await new Promise(t => setTimeout(t, waitTimeOut));
  });

  test("Verify create feed before create product @SB_SET_SC_GMC_1", async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const domain = conf.suiteConf.domain;
    const feedInfo = conf.caseConf.feed_info;
    const waitTimeOut = conf.suiteConf.time_out;
    const handleProductValidate = conf.suiteConf.handle_product_validate;
    const waitForAPICalling = conf.suiteConf.time_out_api_calling;
    const productInfo = conf.caseConf.product_info;
    const productTitleConf = conf.caseConf.product_info.title;
    const statusProductExpect = conf.caseConf.status_of_product;
    const productHandleNoImage = conf.caseConf.handle_product_no_image;

    const productPage = new ProductPage(dashboard, domain);
    const feedPage = new ProducFeedPage(dashboard, domain);
    const productAPI = new ProductAPI(domain, authRequest);
    const dashboardSB = new DashboardPage(dashboard, domain);
    const productIDValidate = await productAPI.getProductIdByHandle(handleProductValidate);

    await dashboard.goto(`https://${domain}/admin`);
    await dashboard.waitForSelector(feedPage.xpathBell);

    await test.step("Create feed in dashboard Products feed", async () => {
      await dashboardSB.navigateToSubMenu("Products", "Product feeds");
      await createFeedDashboard(productPage, feedPage, feedInfo);
      expect(await feedPage.isToastMsgVisible("Product feed was created successfully!")).toBeTruthy();
      await new Promise(t => setTimeout(t, waitTimeOut));
    });

    await test.step("Verify the number of product in manage product data", async () => {
      await new Promise(t => setTimeout(t, waitTimeOut));
      const theNumberOfProduct = await productPage.getNumberProductByAPI(authRequest, domain);
      await dashboard.goto(`https://${feedPage.xpathMngProdDta}`);
      await feedPage.validateFeedNumberProductChanged(authRequest, productIDValidate, waitForAPICalling);
      const theNumOfProdInMngData = await feedPage.getNumberProductManageData(authRequest, domain);
      expect(theNumOfProdInMngData).toEqual(theNumberOfProduct);
    });

    await test.step("Delete feed and product for verify no image product case", async () => {
      await dashboardSB.navigateToSubMenu("Products", "Product feeds");
      await new Promise(t => setTimeout(t, waitTimeOut));
      await feedPage.deleteAllFeed();
      await dashboard.waitForSelector(feedPage.xpathNoFeedFound);
      expect(await dashboard.locator(feedPage.xpathNoFeedFound).isVisible()).toBeTruthy();
      await dashboardSB.navigateToSubMenu("Products", "All products");
      await productAPI.deleteProductByAPI();
      await new Promise(t => setTimeout(t, waitTimeOut));
      await dashboard.reload();
      await dashboard.waitForSelector(productPage.xpathNoProduct);
      expect(await dashboard.locator(productPage.xpathNoProduct).isVisible()).toBeTruthy();
    });

    await test.step("Create product with no image", async () => {
      await productPage.addNewProductWithData(productInfo);
      await dashboardSB.navigateToSubMenu("Products", "All products");
      const productTitle = await dashboard.textContent(productPage.xpathGetTitleProduct);
      expect(productTitle).toEqual(productTitleConf);
    });

    await test.step("Create feed in dashboard Product feed again", async () => {
      const id = await productAPI.getProductIdByHandle(productHandleNoImage);
      await dashboardSB.navigateToSubMenu("Products", "Product feeds");
      await createFeedDashboard(productPage, feedPage, feedInfo);
      await new Promise(t => setTimeout(t, waitTimeOut));
      await dashboard.goto(`https://${feedPage.xpathMngProdDta}`);
      await feedPage.validateFeedNumberProductChanged(authRequest, id, waitForAPICalling);
      const statusProduct = await dashboard.textContent(feedPage.xpathStatusProductInFeed);
      expect(statusProduct).toEqual(statusProductExpect);
    });
  });

  test("Verify change feed setting @SB_SET_SC_GMC_5", async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const domain = conf.suiteConf.domain;
    const feedInfo = conf.caseConf.feed_info;
    const handleProductValidate = conf.suiteConf.handle_product_validate;
    const waitForAPICalling = conf.suiteConf.time_out_api_calling;
    const feedUpdate = conf.caseConf.feed_update;
    const waitTimeOut = conf.suiteConf.time_out;

    const productPage = new ProductPage(dashboard, domain);
    const feedPage = new ProducFeedPage(dashboard, domain);
    const productAPI = new ProductAPI(domain, authRequest);
    const dashboardSB = new DashboardPage(dashboard, domain);

    const productIDValidate = await productAPI.getProductIdByHandle(handleProductValidate);

    await test.step("Create feed in dashboard product list", async () => {
      await dashboardSB.navigateToSubMenu("Products", "Product feeds");
      await createFeedDashboard(productPage, feedPage, feedInfo);
      expect(await feedPage.isToastMsgVisible("Product feed was created successfully!")).toBeTruthy();
    });

    await test.step("Verify update feed setting", async () => {
      await new Promise(t => setTimeout(t, waitTimeOut));
      await dashboardSB.navigateToSubMenu("Products", "All products");
      await productPage.goToProductFeedDetail(conf.caseConf.feed_info.name);
      await feedPage.inputCreateFeedInfo(feedUpdate);
      await feedPage.clickOnBtnWithLabel("Save");
      await dashboard.waitForLoadState("load");
      await dashboard.goto(`https://${feedPage.xpathMngProdDta}`);
      await dashboard.waitForSelector(feedPage.xpathWaitMngProdDta);

      await feedPage.validateFeedNumberProductChanged(authRequest, productIDValidate, waitForAPICalling);
      const theNumberOfVariant = await productPage.countNumberVariant(authRequest, domain);
      const theNumberOfProductInFeed = await feedPage.getNumberProductManageData(authRequest, domain);

      expect(theNumberOfProductInFeed).toEqual(theNumberOfVariant);
    });
  });

  test("Verify update Manage product data after edit a variant @SB_SET_SC_GMC_6", async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const domain = conf.suiteConf.domain;
    const feedInfo = conf.caseConf.feed_info;
    const handleProductValidate = conf.suiteConf.handle_product_validate;
    const waitForAPICalling = conf.suiteConf.time_out_api_calling;
    const valueEdit = conf.caseConf.edit_variant_value;
    const valueCompare = conf.caseConf.compare_variant_info;
    const waitTimeOut = conf.suiteConf.time_out;
    let variantID: number;

    const productPage = new ProductPage(dashboard, domain);
    const feedPage = new ProducFeedPage(dashboard, domain);
    const productAPI = new ProductAPI(domain, authRequest);
    const variantDetail = new VariantDetailPage(dashboard, domain);
    const dashboardSB = new DashboardPage(dashboard, domain);

    const productIDValidate = await productAPI.getProductIdByHandle(handleProductValidate);

    await test.step("Create feed Google in dashboard Products feed", async () => {
      await dashboardSB.navigateToSubMenu("Products", "Product feeds");
      await createFeedDashboard(productPage, feedPage, feedInfo);
      expect(await feedPage.isToastMsgVisible("Product feed was created successfully!")).toBeTruthy();
    });

    await test.step("Update variant detail", async () => {
      await productPage.goToProdDetailByID(domain, productIDValidate);
      await productPage.clickEditVariant();
      variantID = await productPage.getVariantIdFromUrl();
      await variantDetail.editVariantInfo(valueEdit);
      await dashboard.waitForLoadState("networkidle");
      await new Promise(t => setTimeout(t, waitTimeOut));
    });

    await test.step("Verify updated variant in Manage product data", async () => {
      await new Promise(t => setTimeout(t, waitTimeOut));
      await dashboard.goto(`https://${feedPage.xpathMngProdDta}`);
      await dashboard.waitForSelector(feedPage.xpathWaitMngProdDta);
      await feedPage.validateFeedNumberProductChanged(authRequest, productIDValidate, waitForAPICalling);
      await dashboard.reload();
      await dashboard.waitForLoadState("networkidle");
      await new Promise(t => setTimeout(t, waitTimeOut));
      expect(await feedPage.validateDataProductChangedAPI(authRequest, domain, variantID, valueCompare)).toBeTruthy();
    });
  });

  test("Verify bulk edit manage product data @SB_SET_SC_GMC_7", async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const domain = conf.suiteConf.domain;
    const feedInfo = conf.caseConf.feed_info;
    const handleProductValidate = conf.suiteConf.handle_product_validate;
    const waitForAPICalling = conf.suiteConf.time_out_api_calling;
    const fieldUpdate = conf.caseConf.field_update;
    const waitTimeOut = conf.suiteConf.time_out;
    const valueUpdate = conf.caseConf.value_update;

    const productPage = new ProductPage(dashboard, domain);
    const feedPage = new ProducFeedPage(dashboard, domain);
    const productAPI = new ProductAPI(domain, authRequest);
    const dashboardSB = new DashboardPage(dashboard, domain);

    const productIDValidate = await productAPI.getProductIdByHandle(handleProductValidate);
    let arrProductIDUpdated: Array<number>;

    await test.step("Create dashboard feed in dashboard Products feed", async () => {
      await dashboardSB.navigateToSubMenu("Products", "Product feeds");
      await createFeedDashboard(productPage, feedPage, feedInfo);
      await feedPage.validateFeedNumberProductChanged(authRequest, productIDValidate, waitForAPICalling);
      expect(await feedPage.isToastMsgVisible("Product feed was created successfully!")).toBeTruthy();
    });

    await test.step("Do bulk edit for some products", async () => {
      await new Promise(t => setTimeout(t, waitTimeOut));
      const url = "/update-feed-data.json";
      const request = dashboard.waitForRequest(
        request => request.url().includes(url) && request.method() === HttpMethods.Post,
      );
      await dashboard.goto(`https://${feedPage.xpathMngProdDta}`);
      await dashboard.waitForSelector(feedPage.xpathWaitMngProdDta);

      await feedPage.chooseProductByClickCheckBox(5);
      await feedPage.bulkEditProductFeed(fieldUpdate, valueUpdate);
      const rawRequest = await request;
      const body = rawRequest.postData();
      arrProductIDUpdated = (await JSON.parse(body)).variant_ids;
    });

    await test.step("Verify product bulked edit", async () => {
      for (let i = 0; i < arrProductIDUpdated.length; i++) {
        expect(
          await feedPage.validateDataProductChangedAPI(authRequest, domain, arrProductIDUpdated[i], {
            age_group: "infant",
          }),
        ).toBeTruthy();
      }
    });
  });

  test("Verify Export/Import file Manage product data @SB_SET_SC_GMC_10", async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const domain = conf.suiteConf.domain;
    const feedInfo = conf.caseConf.feed_info;
    const waitTimeOut = conf.suiteConf.time_out;
    const handleProductValidate = conf.suiteConf.handle_product_validate;
    const waitForAPICalling = conf.suiteConf.time_out_api_calling;
    const updateFeedInfo = conf.caseConf.update_product_feed_info;
    const exportURL = "/export-manage-data.json";
    const arrVariantID: Array<number> = [];

    const ts = Date.now().toString();
    let pathFileExport: string;

    const productPage = new ProductPage(dashboard, domain);
    const feedPage = new ProducFeedPage(dashboard, domain);
    const productAPI = new ProductAPI(domain, authRequest);
    const dashboardSB = new DashboardPage(dashboard, domain);

    const productIDValidate = await productAPI.getProductIdByHandle(handleProductValidate);

    await test.step("Create dashboard feed in dashboard Products feed", async () => {
      await dashboardSB.navigateToSubMenu("Products", "Product feeds");
      await createFeedDashboard(productPage, feedPage, feedInfo);
      await feedPage.validateFeedNumberProductChanged(authRequest, productIDValidate, waitForAPICalling);
      expect(await feedPage.isToastMsgVisible("Product feed was created successfully!")).toBeTruthy();
    });

    await test.step("Export data from manage product data", async () => {
      await new Promise(t => setTimeout(t, waitTimeOut));
      await dashboard.goto(`https://${feedPage.xpathMngProdDta}`);
      await dashboard.waitForSelector(feedPage.xpathWaitMngProdDta);
      await feedPage.chooseProductByClickCheckBox(5);
      const saveFileExport = dashboard.waitForEvent("download");
      const getURLExport = dashboard.waitForRequest(
        request => request.url().includes(exportURL) && request.method() === HttpMethods.Post,
        { timeout: waitTimeOut },
      );
      await feedPage.clickOnBtnWithLabel("Export");
      await feedPage.clickRadioButtonWithLabel("Selected products");
      await feedPage.clickOnBtnWithLabel("Export", 2);

      const eventAPI = await getURLExport;
      const variantIDList = eventAPI.url().trim().split("&")[3];
      const arrRaw = variantIDList.match(/\d+/g);
      for (const i in arrRaw) {
        arrVariantID.push(parseInt(arrRaw[i]));
      }
      pathFileExport = await (await saveFileExport).path();
    });

    await test.step("Edit data in recently download CSV file", async () => {
      const jsonCSV = await csvToJson(pathFileExport, ",");
      await feedPage.updateDataImportFeed(jsonCSV, updateFeedInfo);
      await jsonToCsv(jsonCSV, ts);
      await dashboard.reload();
      await new Promise(t => setTimeout(t, waitTimeOut));
    });

    await test.step("Import file csv update to Manage product data", async () => {
      await dashboard.goto(`https://${feedPage.xpathMngProdDta}`);
      await dashboard.waitForSelector(feedPage.xpathWaitMngProdDta);
      await new Promise(t => setTimeout(t, waitTimeOut));
      const fileFeedImport = path.join(appRoot + `/assets/export_feed/export_feed_update_file_${ts}.csv`);
      await feedPage.importFeedFile(domain, fileFeedImport, feedPage.xpathImportFile);
      await new Promise(t => setTimeout(t, waitTimeOut));
      await dashboard.reload();
      fs.unlinkSync(fileFeedImport);
    });

    await test.step("Verify product info data changed in Manage product data", async () => {
      for (let i = 0; i < arrVariantID.length; i++) {
        expect(
          await feedPage.validateDataProductChangedAPI(authRequest, domain, arrVariantID[i], updateFeedInfo),
        ).toBeTruthy();
      }
    });
  });

  test("Verify checkbox search product in Manage product data @SB_SET_SC_GMC_13", async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const domain = conf.suiteConf.domain;
    const titleProduct = conf.caseConf.title_product;
    const feedInfo = conf.caseConf.feed_info;
    const handleProductValidate = conf.suiteConf.handle_product_validate;
    const waitForAPICalling = conf.suiteConf.time_out_api_calling;

    const feedPage = new ProducFeedPage(dashboard, domain);
    const dashboardSB = new DashboardPage(dashboard, domain);
    const productPage = new ProductPage(dashboard, domain);
    const productAPI = new ProductAPI(domain, authRequest);
    const productIDValidate = await productAPI.getProductIdByHandle(handleProductValidate);

    await test.step("Create dashboard feed in dashboard Products feed", async () => {
      await dashboardSB.navigateToSubMenu("Products", "Product feeds");
      await createFeedDashboard(productPage, feedPage, feedInfo);
      await feedPage.validateFeedNumberProductChanged(authRequest, productIDValidate, waitForAPICalling);
      expect(await feedPage.isToastMsgVisible("Product feed was created successfully!")).toBeTruthy();
    });

    await test.step("Verify search product", async () => {
      await dashboard.goto(`https://${feedPage.xpathMngProdDta}`);
      await dashboard.waitForSelector(feedPage.xpathWaitMngProdDta);

      await dashboardSB.inputFieldWithLabel("", "Search products", titleProduct, 1);
      await dashboard.keyboard.press("Enter");
      const validateElement = await dashboardSB.isElementExisted(feedPage.xpathProductFeed(titleProduct));
      expect(validateElement).toBeTruthy();
    });
  });

  test("Verify filter in Manage product data @SB_SET_SC_GMC_14", async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out_tc);
    const domain = conf.suiteConf.domain;
    const feedInfo = conf.caseConf.feed_info;
    const handleProductValidate = conf.suiteConf.handle_product_validate;
    const waitForAPICalling = conf.suiteConf.time_out_api_calling;
    const waitTimeOut = conf.suiteConf.time_out;
    const fieldUpdate = conf.caseConf.field_update;
    const valueUpdate = conf.caseConf.value_update;

    const feedPage = new ProducFeedPage(dashboard, domain);
    const dashboardSB = new DashboardPage(dashboard, domain);
    const productPage = new ProductPage(dashboard, domain);
    const productAPI = new ProductAPI(domain, authRequest);
    const productIDValidate = await productAPI.getProductIdByHandle(handleProductValidate);
    let productID: string;
    let numberofProd: number;

    await test.step("Create dashboard feed in dashboard Products feed", async () => {
      await dashboardSB.navigateToSubMenu("Products", "Product feeds");
      await createFeedDashboard(productPage, feedPage, feedInfo);
      await feedPage.validateFeedNumberProductChanged(authRequest, productIDValidate, waitForAPICalling);
      expect(await feedPage.isToastMsgVisible("Product feed was created successfully!")).toBeTruthy();
    });

    await test.step("Update 5 first products", async () => {
      await new Promise(t => setTimeout(t, waitTimeOut));
      const url = "/update-feed-data.json";
      const request = dashboard.waitForRequest(
        request => request.url().includes(url) && request.method() === HttpMethods.Post,
      );
      await dashboard.goto(`https://${feedPage.xpathMngProdDta}`);
      await dashboard.waitForSelector(feedPage.xpathWaitMngProdDta);

      await feedPage.chooseProductByClickCheckBox(5);
      await feedPage.bulkEditProductFeed(fieldUpdate, valueUpdate);
      const rawRequest = await request;
      const body = rawRequest.postData();
      const arrProductIDUpdated = (await JSON.parse(body)).variant_ids;
      numberofProd = arrProductIDUpdated.length;
      productID = arrProductIDUpdated.join();
      await new Promise(t => setTimeout(t, waitTimeOut));
      await dashboard.reload();
    });

    await test.step("Verify filter product", async () => {
      await dashboardSB.clickOnBtnWithLabel("More filters");
      await dashboard.locator(feedPage.xpathFilterID).click();
      await dashboardSB.inputFieldWithLabel(feedPage.xpathLabelFilterWithText("ID"), "Search ID", productID);
      await dashboard.locator(feedPage.xpathFilterAgeGroup).click();
      await dashboard.selectOption(feedPage.xpathSelectAgeGroup, "infant");
      await dashboard.locator(feedPage.xpathFilterGender).click();
      await dashboard.selectOption(feedPage.xpathSelectGender, "unisex");

      const url = "/fetch-list-all-products.json";
      const request = dashboard.waitForRequest(
        request => request.url().includes(url) && request.method() === HttpMethods.Post,
      );
      await dashboardSB.clickOnBtnWithLabel("Done");
      const responseAPI = await (await (await request).response()).json();
      const numberOfProdUpdate = responseAPI.result.length;
      expect(numberofProd).toEqual(numberOfProdUpdate);
    });
  });
});
