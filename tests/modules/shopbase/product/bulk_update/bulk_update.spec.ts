import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@sf_pages/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { loadData } from "@core/conf/conf";
import { Personalize } from "@pages/dashboard/personalize";
import path from "path";
import appRoot from "app-root-path";

let status;

test.describe("Create bulk update", () => {
  const conf = loadData(__dirname, "DATA_DRIVEN");

  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`@${caseData.case_id} ${caseData.description_case}`, async ({ dashboard, context, snapshotFixture }) => {
      test.setTimeout(conf.suiteConf.timeout);
      const product = new ProductPage(dashboard, conf.suiteConf.domain);
      const personalize = new Personalize(dashboard, conf.suiteConf.domain);
      //tren prodtest k import duoc nen bo qua
      if (process.env.ENV === "prodtest") {
        return;
      }
      await test.step("1. Import product bằng file csv", async () => {
        const fileName = path.basename(caseData.path_csv);
        await product.navigateToMenu("Products");
        await product.waitForElementVisibleThenInvisible(product.xpathTableLoad);
        await product.searchProdByName(caseData.product_name);
        await product.waitForElementVisibleThenInvisible(product.xpathTableLoad);
        await product.deleteProduct(conf.suiteConf.password);
        await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
        const pathFile = path.join(appRoot + `${caseData.path_csv}`);
        await product.importProduct(pathFile, product.xpathImportFile, true, true);

        // wait for import success
        do {
          await product.page.waitForTimeout(60000);
          await product.navigateToMenu("Products");
          await product.clickProgressBar();
          status = await product.getStatus(fileName, 1);
        } while (status !== caseData.status);

        expect(await product.getStatus(fileName)).toEqual(caseData.status);
        expect(await product.getProcess(fileName)).toEqual(caseData.process);
        //wait product sync xong
        await product.page.waitForTimeout(10 * 1000);
      });

      await test.step("2. Create bulk update product", async () => {
        await product.createBulkUpdate(caseData.bulk_update_info);
        await product.startBulkUpdate();
        await dashboard.reload();
        await product.waitBulkUpdateFinish();
        await expect(await product.verifyBulkUpdateByFilterName(caseData.filter_validate)).toEqual(
          caseData.validate_bulk_update_info,
        );
      });

      switch (caseData.action) {
        case "Delete custom options":
        case "Add custom options":
        case "Replace custom options":
          await test.step("3. Verify không hiển thị custom option trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            await product.removeBlockTitleDescription();
            await product.page.waitForSelector(personalize.xpathSectionCustomOption);
            await product.page.waitForTimeout(3000);
            await snapshotFixture.verify({
              page: dashboard,
              selector: personalize.xpathSectionCustomOption,
              snapshotName: `${process.env.ENV}-${caseData.picture.picture_dashboard}`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
              sizeCheck: true,
            });
          });
          await test.step("4. Verify không hiển thị custom option ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await productSF.waitForImagesMockupLoaded();
            await snapshotFixture.verify({
              page: productSF.page,
              selector: productSF.xpathVariantAndCOProduct,
              snapshotName: caseData.picture.picture_sf,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          break;
        case "Change price to":
          await test.step("3. Verify hiển thị đúng price đã thay đổi trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            await expect(dashboard.locator(product.xpathPriceInProductDetail(caseData.price))).toBeVisible();
          });
          await test.step("4. Verify hiển thị đúng price đã thay đổi ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await productSF.waitForImagesMockupLoaded();
            await snapshotFixture.verify({
              page: productSF.page,
              selector: productSF.xpathPriceOnSF,
              snapshotName: caseData.picture.picture_sf,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          break;
        case "Add text to product title":
        case "Remove text from product title":
          await test.step("3. Verify hiển thị đúng title đã thay đổi trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            const title = await product.getTextContent(product.xpathTitleProductDetail);
            await expect(title).toEqual(caseData.product_name);
          });
          await test.step("4. Verify hiển thị đúng title đã thay đổi ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await productSF.waitForImagesMockupLoaded();
            const title = await productSF.getTextContent(product.xpathTitleProductOnSF);
            await expect(title).toEqual(caseData.product_name);
          });
          break;
        case "Change product description to":
          await test.step("3. Verify hiển thị đúng title đã thay đổi trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            await snapshotFixture.verify({
              page: dashboard,
              selector: product.xpathDescriptionFrame,
              snapshotName: caseData.picture_description_dashboard,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          await test.step("4. Verify hiển thị đúng title đã thay đổi ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await productSF.waitForImagesMockupLoaded();
            const description = await productSF.getTextContent(productSF.xpathProductDescriptionSF(1) + "//p");
            await expect(description).toEqual(caseData.description);
          });
          break;
        case "Add text to product description":
          await test.step("3. Verify hiển thị đúng title đã thay đổi trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            await snapshotFixture.verify({
              page: dashboard,
              selector: product.xpathDescriptionFrame,
              snapshotName: caseData.picture.picture_dashboard,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          await test.step("4. Verify hiển thị đúng title đã thay đổi ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await productSF.waitResponseWithUrl("/assets/landing.css", 150000);
            await productSF.waitForImagesMockupLoaded();
            await productSF.waitForImagesDescriptionLoaded();
            await productSF.page.waitForSelector(productSF.xpathProductDescriptionSF(1));
            await snapshotFixture.verify({
              page: productSF.page,
              selector: productSF.xpathProductDescriptionSF(1),
              snapshotName: caseData.picture.picture_sf,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          break;
        case "Change product vendor to":
          await test.step("3. Verify hiển thị đúng vendor đã update trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            await snapshotFixture.verify({
              page: dashboard,
              selector: product.xpathVendorInProductDetail,
              snapshotName: caseData.picture.picture_dashboard,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          await test.step("4. Verify hiển thị đúng vendor đã update ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await productSF.waitForImagesMockupLoaded();
            const vendor = await productSF.getTextContent(productSF.xpathProductVendor);
            await expect(vendor).toEqual(caseData.vendor);
          });
          break;
        case "Add tags":
          await test.step("3. Verify hiển thị đúng tag đã update trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            await snapshotFixture.verify({
              page: dashboard,
              selector: product.xpathTagsInProductDetail,
              snapshotName: caseData.picture.picture_dashboard,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          await test.step("4. Verify hiển thị đúng tag đã update ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await expect(productSF.page.locator(productSF.xpathProductTag(caseData.tag))).toBeVisible();
          });
          break;
        case "Remove tags":
          await test.step("3. Verify hiển thị đúng tag đã update trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            await snapshotFixture.verify({
              page: dashboard,
              selector: product.xpathTagsInProductDetail,
              snapshotName: caseData.picture.picture_dashboard,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          await test.step("4. Verify hiển thị đúng tag đã update ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await expect(productSF.page.locator(productSF.xpathProductTag(caseData.tag))).toBeHidden();
          });
          break;
        case "Change variant's option value":
          await test.step("3. Verify hiển thị đúng option variant đã update trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            await product.removeBlockTitleDescription();
            await snapshotFixture.verify({
              page: dashboard,
              selector: product.xpathVariantInCampaignDetail,
              snapshotName: caseData.picture.picture_dashboard,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          await test.step("4. Verify hiển thị đúng option variant đã update ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await productSF.waitForImagesMockupLoaded();
            await snapshotFixture.verify({
              page: productSF.page,
              selector: productSF.xpathVariantAndCOProduct,
              snapshotName: caseData.picture.picture_sf,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          break;
        case "Find and replace text in SKU":
        case "Add text to SKU":
          await test.step("3. Verify hiển thị đúng SKU đã thay đổi trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            await expect(dashboard.locator(product.getXpathSKUInDashboard(caseData.sku))).toBeVisible();
          });
          await test.step("4. Verify hiển thị đúng SKU đã thay đổi ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await productSF.waitForImagesMockupLoaded();
            await expect(productSF.page.locator(productSF.getXpathSKUOnSF(caseData.sku))).toBeVisible();
          });
          break;
        case "Some actions":
          await test.step("3. Verify hiển thị đúng thông tin đã thay đổi trong màn product detail", async () => {
            await product.gotoProductDetail(caseData.product_name);
            await expect(dashboard.locator(product.xpathPriceInProductDetail(caseData.price))).toBeVisible();
            //Verify hiển thị description
            await snapshotFixture.verify({
              page: dashboard,
              selector: product.xpathDescriptionFrame,
              snapshotName: caseData.picture.description_dashboard,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
            //Verify hiển thị organization
            await snapshotFixture.verify({
              page: dashboard,
              selector: product.xpathOrganization,
              snapshotName: caseData.picture.organization_dashboard,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });

          await test.step("4. Verify hiển thị đúng thông tin đã update ngoài SF", async () => {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductSF()]);
            const productSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await productSF.waitResponseWithUrl("/assets/landing.css", 150000);
            await productSF.waitForImagesMockupLoaded();
            await productSF.waitForImagesDescriptionLoaded();
            await expect(productSF.page.locator(productSF.xpathProductTag(caseData.tag))).toBeVisible();
            await snapshotFixture.verify({
              page: productSF.page,
              selector: productSF.xpathPriceOnSF,
              snapshotName: caseData.picture.price_sf,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
            await productSF.page.waitForSelector(productSF.xpathProductDescriptionSF(1));
            await snapshotFixture.verify({
              page: productSF.page,
              selector: productSF.xpathProductDescriptionSF(1),
              snapshotName: caseData.picture.description_sf,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
          break;
      }

      // After delete product
      await test.step("After: delete product", async () => {
        await product.navigateToMenu("Products");
        await product.searchProdByName(caseData.product_name);
        await product.deleteProduct(conf.suiteConf.password);
      });
    });
  }
});
