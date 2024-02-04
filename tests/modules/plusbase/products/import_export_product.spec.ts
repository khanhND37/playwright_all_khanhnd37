import { expect, test } from "@core/fixtures";
import { ProductAPI } from "@pages/api/product";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { csvToJson, jsonToCsv } from "@helper/file";
import type { ProductExportData, TemplateImportProductData } from "@types";

test.describe("Import/Export product Plusbase", () => {
  let dashboardPage: DashboardPage;
  let productPage: ProductPage;
  let productAPI: ProductAPI;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
  });

  test(`@PLB_PLB_IP_EP_3 - [Export] Verify định dạng file, thông tin product khi export chọn Current page`, async ({
    conf,
  }) => {
    let fileCSV: string;
    let dataFileExport: object[];
    await test.step(`Tại page 1 của màn product list > click btn Export > tick chọn Current page tại popup cf > click btn Export`, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      // Export file & verify toast export
      const [file] = await Promise.all([
        productPage.exportProduct(conf.caseConf.export_info, conf.caseConf.forder_name),
        productPage.waitUntilElementVisible(
          productPage.xpathToastExportSuccess(conf.caseConf.expect_export_product_number),
        ),
      ]);
      fileCSV = file;
      dataFileExport = await csvToJson(fileCSV);
    });
    await test.step(`Verify định dạng file tải về`, async () => {
      expect(fileCSV).toContain(conf.caseConf.expect_file_type);
      // Verify row exported
      expect(dataFileExport.length).toEqual(conf.caseConf.expect_row_exported);
      // Verify export columns
      expect(Object.keys(dataFileExport[0]).sort()).toEqual(conf.caseConf.export_fields.sort());
    });
    await test.step(`Verify thông tin product trong file tải về`, async () => {
      // Verify first row data
      const firstRow: ProductExportData = dataFileExport[0];
      const productId = parseInt(firstRow["Product Id"].replace(/'/g, ""));
      expect(productId).toBeGreaterThan(0);
      const productData = await productAPI.getDataProductById(productId);
      const product = productData.product;
      expect(productId).toEqual(product.id);
      expect(firstRow["Handle"]).toEqual(product.handle);
      expect(firstRow["Title"]).toEqual(product.title);
      expect(firstRow["Body (Html)"]).toEqual(product.body_html);
      expect(firstRow["Published"] === "TRUE").toEqual(product.published);
      expect(product.options.length).toBeGreaterThan(0);
      expect(firstRow["Option1 Name"]).toEqual(product.options[0].name);
      expect(product.options[0].values.length).toBeGreaterThan(0);
      expect(firstRow["Option1 Value"]).toEqual(product.options[0].values[0]);
      expect(firstRow["Image Src"].split("/").at(-1)).toEqual(product.image.src.split("/").at(-1));
      expect(parseInt(firstRow["Image Position"])).toEqual(product.image.position);
      expect(product.variants.length).toBeGreaterThan(0);
      expect(parseInt(firstRow["Variant Id"].replace(/'/g, ""))).toEqual(product.variants[0].id);
      expect(parseFloat(firstRow["Variant Price"])).toEqual(product.variants[0].price);
      expect(parseFloat(firstRow["Variant Compare At Price"])).toEqual(product.variants[0].compare_at_price);
      expect(firstRow["Variant Inventory Policy"]).toEqual(product.variants[0].inventory_policy);
      expect(firstRow["Variant Fulfillment Service"]).toEqual(product.variants[0].fulfillment_service);
    });
  });

  test(`@PLB_PLB_IP_EP_5 - [Import] Verify download sample CSV template trong popup import`, async ({
    conf,
    snapshotFixture,
  }) => {
    let fileCSV: string;
    let dataFileExport: object[];
    await test.step(`Tại product list, click btn Import`, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await dashboardPage.clickOnBtnWithLabel("Import");
      // Verify popup
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: productPage.xpathImportProductModalContent,
        snapshotName: conf.caseConf.import_product_modal_snapshot_name,
      });
    });
    await test.step(`Click sample CSV template`, async () => {
      fileCSV = await productPage.exportFileTemplateImportProduct(conf.caseConf.forder_name, true);
      dataFileExport = await csvToJson(fileCSV);
      expect(fileCSV).toContain(conf.caseConf.expect_file_type);
      expect(dataFileExport.length).toEqual(conf.caseConf.expect_row_exported);
      // Verify export columns
      expect(Object.keys(dataFileExport[0]).sort()).toEqual(conf.caseConf.import_template_fields.sort());
      // Verify first row data
      const firstRow: TemplateImportProductData = dataFileExport[0];
      const expectImportData = conf.caseConf.import_template_data;
      expect(firstRow.Title).toEqual(expectImportData.title);
      expect(firstRow.Type).toEqual(expectImportData.type);
      expect(firstRow.Tags).toEqual(expectImportData.tags);
      expect(firstRow.Published).toEqual(expectImportData.published);
      expect(firstRow["Option fulfill value"]).toEqual(expectImportData.option_fulfill_value);
      expect(firstRow["Option1 Name"]).toEqual(expectImportData.option1_name);
      expect(firstRow["Option1 Value"]).toEqual(expectImportData.option1_value);
      expect(firstRow["Option2 Name"]).toEqual(expectImportData.option2_name);
      expect(firstRow["Option2 Value"]).toEqual(expectImportData.option2_value);
      expect(firstRow["Variant Price"]).toEqual(expectImportData.variant_price);
      expect(firstRow["Variant Compare At Price"]).toEqual(expectImportData.variant_compare_at_price);
      expect(firstRow["Image Src"]).toEqual(expectImportData.image_src);
      expect(firstRow["Image Position"]).toEqual(expectImportData.image_position);
      expect(firstRow["Alt Image"]).toEqual(expectImportData.alt_image);
      expect(firstRow["Cost per Item"]).toEqual(expectImportData.cost_per_item);
      expect(firstRow["Seo Title"]).toEqual(expectImportData.seo_title);
      expect(firstRow["Seo Description"]).toEqual(expectImportData.seo_description);
    });
  });

  test(`@PLB_PLB_IP_EP_6 [Import] Import thành công với file <= 20MB`, async ({ conf }) => {
    const fileSrc = conf.caseConf.import_file_src;
    let dataFileImport: object[];
    await test.step(`Tại màn product list, click btn Import > click btn Choose file > chọn file < 20 MB`, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      // Change data before import
      dataFileImport = await csvToJson(fileSrc);
      expect(dataFileImport.length).toEqual(1);
      const title = dataFileImport[0]["Title"].split("||");
      dataFileImport[0]["Product Id"] = conf.caseConf.product_id;
      dataFileImport[0]["Variant Id"] = conf.caseConf.variant_id;
      // Update Title
      dataFileImport[0]["Title"] = `${Date.now().toString()}||${title.length === 2 ? title[1] : title[0]}`;
      // Format html field before save
      dataFileImport[0]["Body (Html)"] = `"${dataFileImport[0]["Body (Html)"].replace(/"/g, '""')}"`;
      await jsonToCsv(dataFileImport, "", fileSrc, true);
    });
    await test.step(`Click btn Upload File > Click OK`, async () => {
      // Import file
      await Promise.all([
        productPage.importProduct(fileSrc, productPage.xpathImportFile, false, true),
        productPage.waitUntilElementInvisible(productPage.xpathImportProductModal), // Wait popup close
      ]);
      let status: string;
      for (let i = 0; i < 18; i++) {
        // Wait max 3 minutes
        await productPage.clickProgressBar();
        status = await productPage.getStatus();
        if (status == conf.caseConf.import_status) {
          break;
        }
        // Luồng import product chạy khá lâu, nên cần wait lâu 1 chút
        await productPage.page.waitForTimeout(10000);
        await productPage.page.click(productPage.xpathTitleProduct);
      }
      expect(status).toEqual(conf.caseConf.import_status);
    });
    await test.step(`Verify thông tin của product imported trong product detail`, async () => {
      const productId = parseInt(dataFileImport[0]["Product Id"].replace(/'/g, ""));
      expect(productId).toBeGreaterThan(0);
      const productData = await productAPI.getDataProductById(productId);
      const product = productData.product;
      expect(product.id).toEqual(productId);
      expect(product.title).toEqual(dataFileImport[0]["Title"]);
    });
  });
});
