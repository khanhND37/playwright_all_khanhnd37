import { test, expect } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { ProducFeedPage } from "@pages/dashboard/products/product_feeds";
import { snapshotDir } from "@utils/theme";
import * as path from "path";
import appRoot from "app-root-path";
import { HttpMethods } from "@core/services/http";
import { csvToJson, jsonToCsv } from "@helper/file";
import fs from "fs";
import { GoogleMerchantCenter } from "@pages/thirdparty/gmc";

test.describe("Verify Sale channel GMC", async () => {
  let productPage: ProductPage;
  let productFeedPage: ProducFeedPage;
  let productQty = 0;
  let variantQty: number;
  let maxDiffPixelRatio;
  let threshold;
  let maxDiffPixels;
  let envRun;

  const getQuantity = async ({ conf, authRequest }) => {
    variantQty = 0;
    const rawResponse = await authRequest.get(`https://${conf.suiteConf.domain}/admin/products.json`);
    const res = await rawResponse.json();
    productQty = res.products.length;
    for (const product of res.products) {
      variantQty += product.reference_keys.length;
    }
  };

  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    productFeedPage = new ProducFeedPage(dashboard, conf.suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    threshold = conf.suiteConf.threshold;
    maxDiffPixels = conf.suiteConf.max_diff_pixels;
    envRun = process.env.ENV;

    await test.step("Get quantity of product and variant", async () => {
      await productPage.goToProductList();
      await getQuantity({ conf: conf, authRequest: authRequest });
    });

    await test.step("Delete all feeds", async () => {
      await productPage.goToProductFeedList();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathFeedURLHeader, { timeout: 10000 });
      await productFeedPage.deleteAllFeed();
    });
  });

  test.afterEach(async ({ conf }) => {
    const revertCases = ["SB_SET_SC_GMC_1", "SB_SET_SC_GMC_2", "SB_SET_SC_GMC_10", "SB_SET_SC_GMC_RF_4"];
    if (revertCases.includes(conf.caseName)) {
      await test.step("Revert all products", async () => {
        await productPage.goToProductList();
        await productPage.deleteProduct(conf.suiteConf.password);
        await productPage.page.reload();
        await productPage.page.waitForSelector(productFeedPage.xpathProductHeader);
        const pathFile = path.join(appRoot + "/data/shopbase/import_product_sale_channel.csv");
        await productPage.importProduct(pathFile, "//input[@type='file' and @accept='.zip, .csv']", true, true);
      });
    }
  });

  test(`@SB_SET_SC_GMC_1 Tạo product feed sau khi tạo product`, async ({
    dashboard,
    conf,
    snapshotFixture,
    authRequest,
  }) => {
    await test.step(`Tại dashboard, add product feed, chọn feed type = Google, fill data, Click button Save`, async () => {
      await productFeedPage.createFeeds(conf.caseConf.feed_info_1, false);
      await snapshotFixture.verify({
        page: dashboard,
        selector: '//input[@placeholder="Collection name - Product Feed"]',
        snapshotName: `${envRun}_product_feed_title_first_variant.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`Tại dashboard, open feed Google vừa tạo, click Manage product data, kiểm tra số lượng product trong feed`, async () => {
      await productFeedPage.goToManageProductData();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      const allProducts = await productFeedPage.genLoc(productFeedPage.xpathAllProductTab).textContent();
      expect(allProducts.includes(productQty.toString())).toBeTruthy();
    });

    await test.step(`Tại dashboard, xóa feed vừa tạo, tại popup "Delete this product feed", click "Delete"`, async () => {
      await productPage.goToProductFeedList();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathFeedURLHeader, { timeout: 10000 });
      await productFeedPage.page.click(productFeedPage.xpathDeleteAPIFeed);
      await productFeedPage.clickButtonOnPopUpWithLabel("Delete");
      await expect(await productFeedPage.toastWithMessage("Deleted feed")).toBeVisible();
    });

    await test.step(`Tại dashboard, Add product không có ảnh -> Click button Save`, async () => {
      await productPage.goToProductList();
      await productPage.addNewProductWithData(conf.caseConf.product_no_img);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      await productPage.goToProductList();
      await getQuantity({ conf: conf, authRequest: authRequest });
    });

    await test.step(`Tại dashboard, go to product feed list, Add product feed, chọn feed type = Google, fill data, Click button Save`, async () => {
      await productPage.goToProductFeedList();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathFeedURLHeader, { timeout: 10000 });
      await productFeedPage.createFeeds(conf.caseConf.feed_info_2, false);
      await snapshotFixture.verify({
        page: dashboard,
        selector: '//input[@placeholder="Collection name - Product Feed"]',
        snapshotName: `${envRun}_product_feed_title_all_variant.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(`Tại dashboard, open feed Goole vừa tạo, click button Manage product data, kiểm tra hiển thị`, async () => {
      await productFeedPage.goToManageProductData();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      await productFeedPage.page.waitForSelector(productFeedPage.xpathFirstProduct);
      const allProducts = await productFeedPage.genLoc(productFeedPage.xpathAllProductTab).textContent();
      expect(allProducts.includes(variantQty.toString())).toBeTruthy();
      await productFeedPage.page.click('//li//p[contains(normalize-space(),"Ineligible")]');
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      expect(await productFeedPage.genLoc(productFeedPage.xpathFirstProduct).textContent()).toContain(
        conf.caseConf.product_no_img.title,
      );
    });
  });

  test(`@SB_SET_SC_GMC_2 Verify enable/disable khi tạo feed api với shop có / không có product`, async ({
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.time_out);

    await test.step(`Tại dashboard, delete all products`, async () => {
      await productPage.goToProductList();
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.page.reload();
      await productPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      await getQuantity({ conf: conf, authRequest: authRequest });
    });

    await test.step(`Tại dashboard, add product feed voi feed type = Google`, async () => {
      await productPage.goToProductFeedList();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathFeedURLHeader, { timeout: 10000 });
      await productFeedPage.createFeeds(conf.caseConf.feed_info, false);
      await productFeedPage.goToManageProductData();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      const allProducts = await productFeedPage.genLoc(productFeedPage.xpathAllProductTab).textContent();
      expect(allProducts.includes(variantQty.toString())).toBeTruthy();
    });

    await test.step(`Tại dashboard, add a product`, async () => {
      await productPage.goToProductList();
      await productPage.addNewProductWithData(conf.caseConf.product_2);
      await productPage.goToProductList();
      await productPage.page.reload();
      await productPage.page.waitForSelector(productPage.xpathProductTableHeader);
      await getQuantity({ conf: conf, authRequest: authRequest });
    });

    await test.step(`Tại dashboard, add product feed voi feed type = Google`, async () => {
      await productPage.goToProductFeedList();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathFeedURLHeader, { timeout: 10000 });
      await productFeedPage.deleteAllFeed();
      await productFeedPage.createFeeds(conf.caseConf.feed_info, false);
      await productFeedPage.goToManageProductData();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      await productFeedPage.page.waitForSelector(productFeedPage.xpathFirstProduct);
      const allProducts = await productFeedPage.genLoc(productFeedPage.xpathAllProductTab).textContent();
      expect(allProducts.includes(variantQty.toString())).toBeTruthy();
    });
  });

  test(`@SB_SET_SC_GMC_5 Verify thay đổi feed setting`, async ({ conf }) => {
    await test.step(`- Tại dashboard -> go to product feed list (url link: {{store_domain}}/admin/product-feeds/v2 )   - Click button Add product feed -> tại popup Select sales channel -> chọn feed type = Google   - Fill thông tin như data input   - Click button Save`, async () => {
      await productFeedPage.createFeeds(conf.caseConf.feed_info_old, false);
      await productFeedPage.goToManageProductData();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      const allProducts = await productFeedPage.genLoc(productFeedPage.xpathAllProductTab).textContent();
      expect(allProducts.includes(productQty.toString())).toBeTruthy();
    });

    await test.step(`- Tại dashboard -> go to product feed list (url link: {{store_domain}}/admin/product-feeds/v2 )-> click chọn feed vừa tạo ở step trên -> thực hiện update setting feed-> click Save -> kiểm tra update data cho feed`, async () => {
      await productPage.goToProductFeedList();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathFeedURLHeader, { timeout: 10000 });
      await productFeedPage.editFeeds(conf.caseConf.feed_info_new, false);
      await productFeedPage.goToManageProductData();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      const allProducts = await productFeedPage.genLoc(productFeedPage.xpathAllProductTab).textContent();
      expect(allProducts.includes(variantQty.toString())).toBeTruthy();
    });
  });

  test(`@SB_SET_SC_GMC_14 Verify Filter và Bulk update`, async ({ conf }) => {
    await test.step(`Tại dashboard, add product feed với feed type = Google, fill data rồi click Save`, async () => {
      await productFeedPage.createFeeds(conf.caseConf.feed_info, false);
      await productFeedPage.goToManageProductData();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      const allProducts = await productFeedPage.genLoc(productFeedPage.xpathAllProductTab).textContent();
      expect(allProducts.includes(variantQty.toString())).toBeTruthy();
    });

    await test.step(`Tại dashboard, ở Manage product data, click More filters, với "Size" = contains "M", với "Product type" = "Polo Shirt", click Done`, async () => {
      await productFeedPage.clickOnBtnLinkWithLabel("More filters");
      await productFeedPage.page.click(productFeedPage.getXpathItemFilterWithText("Product type"), { timeout: 9000 });
      await productFeedPage.page.type(productFeedPage.xpathInputProductTypeFilter, conf.caseConf.product_type, {
        delay: 20,
      });
      await productFeedPage.page.click('(//span[contains(@class,"s-dropdown-item")])[1]');
      await productFeedPage.page.click(productFeedPage.getXpathItemFilterWithText("Size"), { timeout: 9000 });
      await productFeedPage.page.click(productFeedPage.xpathSelectSizeContains);
      await productFeedPage.page.type('//input[@placeholder="Search the size"]', conf.caseConf.size);
      await productFeedPage.clickOnBtnLinkWithLabel("Done");
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      const productsList = await productFeedPage.genLoc('//*[@id="products-feeds"]//tr/td[2]/span').allTextContents();
      for (const product of productsList) {
        expect(product.includes(conf.caseConf.size)).toBeTruthy();
      }
    });

    await test.step(`Tại Manage product data, select all product, click button Bulk edit, chọn option, input data update, click Bulk Update`, async () => {
      await productFeedPage.page.click('//span[@data-label="Select all products"]');
      await productFeedPage.clickOnBtnLinkWithLabel("Bulk edit");
      await productFeedPage.page.click('//span[@class="s-dropdown-item" and normalize-space()="Assign Age Group"]');
      await productFeedPage.page.selectOption('//div[@class="s-modal is-active"]//select', "infant");
      await productFeedPage.clickOnBtnLinkWithLabel("Bulk Update");
      await expect(await productFeedPage.toastWithMessage("Updated successfully")).toBeVisible();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      await productFeedPage.page.click(productFeedPage.xpathFirstProduct);
      const ageGroup = JSON.stringify(
        await (
          await (
            await productFeedPage.genLoc('//div[contains(@class,"age-group")]//select').elementHandle()
          ).getProperty("value")
        ).jsonValue(),
      );
      expect(ageGroup.includes("infant")).toBeTruthy();
      await productFeedPage.clickOnBtnLinkWithLabel("Cancel");
    });

    await test.step(`Tại Manage product data, click More Filters, click btn "Clear all filters"`, async () => {
      await productFeedPage.clickOnBtnLinkWithLabel("More filters");
      await productFeedPage.clickOnBtnLinkWithLabel("Clear all filters");
      await productFeedPage.clickOnBtnLinkWithLabel("Done");
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      const allProducts = await productFeedPage.genLoc(productFeedPage.xpathAllProductTab).textContent();
      expect(allProducts.includes(variantQty.toString())).toBeTruthy();
    });
  });

  test(`@SB_SET_SC_GMC_10 Verify update product info sau khi Import csv`, async ({ conf, snapshotFixture, ggPage }) => {
    const arrVariantID: Array<number> = [];
    let pathFileExport: string;
    const updateFeedInfo = conf.caseConf.update_product_feed_info;
    const ts = Date.now().toString();

    await test.step(`Tại dashboard, add product feed voi feed type = Google, fill data, click Save`, async () => {
      await productFeedPage.createFeeds(conf.caseConf.feed_info, false);
      await productFeedPage.goToManageProductData();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      const allProducts = await productFeedPage.genLoc(productFeedPage.xpathAllProductTab).textContent();
      expect(allProducts.includes(productQty.toString())).toBeTruthy();
    });

    await test.step(`Tai Manage product data, chọn 3 product đầu tiên, click Export, chọn 'Selected products', click Export`, async () => {
      await productFeedPage.chooseProductByClickCheckBox(3);
      await productFeedPage.clickOnBtnWithLabel("Export");
      await productFeedPage.clickRadioButtonWithLabel("Selected products");
      await productFeedPage.clickOnBtnWithLabel("Export", 2);

      const eventAPI = await productFeedPage.page.waitForRequest(
        request => request.url().includes("/export-manage-data.json") && request.method() === HttpMethods.Post,
        { timeout: 120000 },
      );
      const variantIDList = eventAPI.url().trim().split("&")[3];
      const arrRaw = variantIDList.match(/\d+/g);
      for (const i in arrRaw) {
        arrVariantID.push(parseInt(arrRaw[i]));
      }
      pathFileExport = await (await productFeedPage.page.waitForEvent("download")).path();
    });

    await test.step(`Tại file Export, sửa data của một số cột của product - Tại dashboard, vao Manage product data, click Import, chọn file vừa chỉnh sửa data, click "Upload File" và verify data`, async () => {
      const jsonCSV = await csvToJson(pathFileExport, ",");
      await productFeedPage.updateDataImportFeed(jsonCSV, updateFeedInfo);
      await jsonToCsv(jsonCSV, ts);
      const fileFeedImport = path.join(appRoot + `/assets/export_feed/export_feed_update_file_${ts}.csv`);
      await productFeedPage.importFeedFile(conf.suiteConf.domain, fileFeedImport, productFeedPage.xpathImportFile);
      await productFeedPage.page.reload();
      fs.unlinkSync(fileFeedImport);
      await productFeedPage.clickOnBtnLinkWithLabel("More filters");
      await productFeedPage.page.click(productFeedPage.getXpathItemFilterWithText("Original ID"), { timeout: 9000 });
      await productFeedPage.page.type('//input[@placeholder="Search ID"]', arrVariantID[0].toString());
      await productFeedPage.clickOnBtnLinkWithLabel("Done");
      await productFeedPage.page.click(productFeedPage.xpathFirstProduct);
      await productFeedPage.page.waitForSelector(`(${productFeedPage.xpathSectionInDescriptionFeed})[2]`);
      for (let i = 1; i < (await productFeedPage.genLoc(productFeedPage.xpathSectionInDescriptionFeed).count()); i++) {
        await snapshotFixture.verify({
          page: productFeedPage.page,
          selector: `(${productFeedPage.xpathSectionInDescriptionFeed})[${i}]`,
          snapshotName: `${envRun}_description_feed_${i}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      }
      const sectionsInDetailProduct = await productFeedPage.genLoc(productFeedPage.xpathSectionInDetailProduct).count();
      for (let i = 1; i <= sectionsInDetailProduct; i++) {
        await snapshotFixture.verify({
          page: productFeedPage.page,
          selector: `(${productFeedPage.xpathSectionInDetailProduct})[${i}]`,
          snapshotName: `${envRun}_detail_product_${i}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      }
    });

    await test.step(`Login GMC, tại tab bar menu, click Products > All products, filters voi Item ID, chọn 'equals', input value ID product đã update ở step trên, click Apply`, async () => {
      const gmcPage = new GoogleMerchantCenter(ggPage, "");
      await gmcPage.goToFeeds();
      await gmcPage.viewProductListWithFeedName("Content API");
      await gmcPage.page.click('//material-button[@aria-label="Show filtering options"]');
      await gmcPage.page.click('//material-select-item[@aria-label="Item ID"]');
      await gmcPage.page.type('//div[@aria-label="Item ID"]//input', updateFeedInfo.id);
      await gmcPage.page.click('//material-button[@aria-label="Apply filter"]');
      await gmcPage.page.waitForSelector(`//ess-cell[@essfield="item_id"]/text-field[text()="${updateFeedInfo.id}"]`);
      await gmcPage.page.click('(//div[contains(@class,"title-box")]/a)[1]');
      await gmcPage.page.waitForSelector('//div[text()="ID or SKU"]');
      await snapshotFixture.verify({
        page: gmcPage.page,
        selector: '//div[contains(@class,"row-panel")]',
        snapshotName: `${envRun}_detail_product_in_gmc.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test(`@SB_SET_SC_GMC_RF_4 Kiểm tra update lại product trong feed file khi click vào button "Refresh now" tại màn Edit product feed ở Dashboard`, async ({
    conf,
  }) => {
    let pathFeedFile: string;
    let jsonFeedFileCSV: object[];
    let productName: string;
    let feedUrl: string;
    let newFeedUrl: string;

    test.setTimeout(conf.suiteConf.time_out);

    const removeStyleAndSizeInProductTitle = (productName: string) => {
      // remove style and size in product title
      for (let ind = 1; ind < 3; ind++) {
        productName = productName.substring(0, productName.lastIndexOf(" "));
      }
      return productName;
    };

    await test.step(`Trong Dashboard, add product feed with Others type`, async () => {
      await productFeedPage.createFeeds(conf.caseConf.feed_info, false);
      await expect(productFeedPage.genLoc(productFeedPage.xpathFeedUrlLabel)).toBeVisible({
        timeout: 9000,
      });
      while (await productFeedPage.genLoc(productFeedPage.xpathProcessing).isVisible()) {
        await productFeedPage.page.reload();
        await productFeedPage.page.waitForSelector(productFeedPage.xpathFeedUrlLabel);
      }
    });

    await test.step(`Open file URL, kiểm tra hiển thị file csv`, async () => {
      await productFeedPage.page.click(productFeedPage.xpathFeedUrl);
      pathFeedFile = await (await productFeedPage.page.waitForEvent("download")).path();
      jsonFeedFileCSV = await csvToJson(pathFeedFile, "\t");
      expect(jsonFeedFileCSV.length).toEqual(productQty);
      productName = jsonFeedFileCSV[0]["title"];
    });

    await test.step(`Vao All product, edit title of product then click button Save`, async () => {
      productName = removeStyleAndSizeInProductTitle(productName);
      await productPage.goToProductList();
      await productPage.chooseProduct(productName);
      await productPage.editProductTitle(conf.caseConf.new_product_title);
      await expect(await productPage.toastWithMessage("Product was successfully saved!")).toBeVisible({
        timeout: 9000,
      });
      // wait a minute for enable Refresh now button in Product feed page
      await productPage.waitAbit(60000);
    });

    await test.step(`Go to Product feeds, open feed file then click button Refresh now`, async () => {
      await productPage.goToProductFeedList();
      await productPage.page.click(`//a[child::span[normalize-space()="${conf.caseConf.feed_info[0].name}"]]`);
      await productFeedPage.page.waitForSelector(productFeedPage.xpathFeedUrlLabel);
      feedUrl = await productFeedPage.genLoc(productFeedPage.xpathFeedUrl).getAttribute("href");
      await productFeedPage.page.waitForSelector('//button[normalize-space()="Refresh now"]', { timeout: 30000 });
      await productFeedPage.clickOnBtnWithLabel("Refresh now");
      await expect(await productFeedPage.toastWithMessage("Your feed has been refreshed successfully")).toBeVisible({
        timeout: 9000,
      });
    });

    await test.step(`Open file URL, kiểm tra hiển thị file csv`, async () => {
      let round = 0;
      do {
        await productFeedPage.page.reload();
        await productFeedPage.page.waitForSelector(productFeedPage.xpathFeedUrl);
        newFeedUrl = await productFeedPage.genLoc(productFeedPage.xpathFeedUrl).getAttribute("href");
        round += 1;
      } while (newFeedUrl == feedUrl && round < 10);
      await productFeedPage.page.click(productFeedPage.xpathFeedUrl, { timeout: 90000 });
      pathFeedFile = await (await productFeedPage.page.waitForEvent("download")).path();
      jsonFeedFileCSV = await csvToJson(pathFeedFile, "\t");
      const productsList = [];
      for (let i = 0; i < jsonFeedFileCSV.length; i++) {
        productName = jsonFeedFileCSV[i]["title"];
        productName = removeStyleAndSizeInProductTitle(productName);
        productsList.push(productName);
      }
      expect(productsList.includes(conf.caseConf.new_product_title)).toBeTruthy();
    });
  });
});
