import { expect, test } from "@core/fixtures";
import { snapshotDir, waitForImageLoaded } from "@core/utils/theme";
import { ProductPage } from "@pages/dashboard/products";
import { SizeChartPage } from "@pages/dashboard/products/size_chart";
import { SFProduct } from "@sf_pages/product";
import { loadData } from "@core/conf/conf";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { removeSelector } from "@pages/dashboard/blog";

let product: ProductPage;
let sizeChart: SizeChartPage;
let productSF: SFProduct;
let sizeChartTag: string;
test.describe("Verify size chart", () => {
  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
    product = new ProductPage(dashboard, conf.suiteConf.domain);
    sizeChart = new SizeChartPage(dashboard, conf.suiteConf.domain);

    await product.goToProductList();
    await product.deleteProduct(conf.suiteConf.password);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  const dataTC = conf.caseConf.data_test;
  dataTC.forEach(dataCase => {
    test(`@${dataCase.case_id} ${dataCase.case_name}`, async ({ dashboard, conf, context, snapshotFixture }) => {
      if (!dataCase.steps || Object.keys(dataCase.steps).length < 1) {
        return;
      }
      for (const [action, step] of Object.entries(dataCase.steps)) {
        const stepName = step.toString();
        switch (action) {
          case "add_campaign":
            await test.step(stepName, async () => {
              // start launchCamp
              const printbase = new PrintBasePage(dashboard, conf.suiteConf.domain);
              await printbase.navigateToMenu("Apps");
              await dashboard.getByText("Print Hub").click();
              await dashboard.getByRole("link", { name: "Catalog", exact: true }).click();
              await printbase.waitForElementVisibleThenInvisible(sizeChart.xpathTableLoad);
              const campaignId = await printbase.launchCamp(conf.suiteConf.campaign_info);
              const isAvailable = await printbase.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
              expect(isAvailable).toBeTruthy();
            });
            break;
          case "add_product":
            await test.step(stepName, async () => {
              await product.goToProductList();
              let productInfo = conf.suiteConf.product_info;
              if (dataCase.product_info) {
                productInfo = dataCase.product_info;
              }
              await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
              await product.addNewProductWithData(productInfo);
              await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
              // if you want custom variant option then set up param product_variant in testcase
              let productVariant = conf.suiteConf.product_variant;
              if (dataCase.product_variant) {
                productVariant = dataCase.product_variant;
              }
              await product.addVariants(productVariant);
              expect(await product.isToastMsgVisible("Product was successfully saved!")).toBe(true);
            });
            break;
          case "add_size_chart":
            await test.step(stepName, async () => {
              await sizeChart.gotoSizeChart("admin/size-chart");
              await sizeChart.searchAndDeleteSizecharts(dataCase.size_chart_info.style);
              await sizeChart.addSizeChartWithOption(dataCase.size_chart_info);
              await sizeChart.waitForElementVisibleThenInvisible(sizeChart.xpathPageLoading);
              if (await sizeChart.page.locator(sizeChart.xpathToastMessage).isVisible()) {
                await sizeChart.page.waitForSelector(sizeChart.xpathToastMessage, { state: "hidden" });
              }
              await removeSelector(dashboard, 'input.s-input__inner[placeholder="Size guide"]');
              if (await dashboard.isVisible('//div[@class="media__container"]/img[1]')) {
                await waitForImageLoaded(dashboard, '//div[@class="media__container"]');
              }
              if (
                await dashboard
                  .frameLocator('//iframe[@title="Rich Text Area"]')
                  .locator('//body[contains(@aria-label,"Rich Text Area")]//img[1]')
                  .isVisible()
              ) {
                await waitForImageLoaded(
                  dashboard,
                  '//body[contains(@aria-label,"Rich Text Area")]',
                  '//iframe[@title="Rich Text Area"]',
                );
              }
              await dashboard.waitForTimeout(1500);
              await snapshotFixture.verify({
                page: dashboard,
                snapshotName: dataCase.picture.dashboard_size_chart,
                selector: sizeChart.xpathPageDetail,
                sizeCheck: true,
              });
              await dashboard.reload();
              await dashboard.waitForLoadState("networkidle");
              sizeChartTag = await dashboard.getByPlaceholder("Size guide").inputValue();
            });
            break;
          case "add_product_tag":
            await test.step(stepName, async () => {
              let productTitle = conf.suiteConf.product_info.title;
              if (dataCase.product_info && dataCase.product_info.title) {
                productTitle = dataCase.product_info.title;
              }
              await product.goToProductList();
              await product.searchProduct(productTitle);
              await product.chooseProduct(productTitle);
              await product.waitForElementVisibleThenInvisible(sizeChart.xpathProductDetailLoading);
              await product.setProductTags(sizeChartTag);
              await product.clickOnBtnWithLabel("Save changes");
              await expect(dashboard.locator(sizeChart.xpathProductTag).getByText(sizeChartTag)).toBeVisible();
            });
            break;
          case "duplicate_product":
            await test.step(stepName, async () => {
              const ProductTitleDuplicate = "Product duplicate";
              await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
              await product.clickOnBtnWithLabel("Duplicate");
              await product.duplicateProduct(true, ProductTitleDuplicate);
              await expect(await dashboard.locator(sizeChart.xpathTitleProductDetail)).toHaveText(
                ProductTitleDuplicate,
              );
            });
            break;
          case "show_product_storefront":
            await test.step(stepName, async () => {
              const [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
              productSF = new SFProduct(SFPage, conf.suiteConf.domain);
              await productSF.waitResponseWithUrl("/assets/landing.css");
              let xpathProductVariant = sizeChart.xpathProductVariant;
              if (dataCase.xpath_product_variant_size_guide) {
                xpathProductVariant = dataCase.xpath_product_variant_size_guide;
              }
              await productSF.page.waitForSelector(sizeChart.xpathButtonSizeGuide);
              await productSF.page.waitForTimeout(1500);
              await snapshotFixture.verify({
                page: SFPage,
                snapshotName: dataCase.picture.storefront_has_size_chart,
                selector: xpathProductVariant,
              });
            });
            break;
          case "show_product_size_guide":
            await test.step(stepName, async () => {
              await productSF.page.locator(sizeChart.xpathButtonSizeGuide).click();
              await productSF.page.waitForSelector(sizeChart.xpathShowSizeChart, { timeout: 3000 });
              // let xpathSizeChartImageLoaded = sizeChart.xpathSizeChartImageLoaded;
              let xpathSizeChartImageLoaded = '//div[contains(@class,"inside-modal__body__content")]//img';
              const sizeChartInfo = dataCase.size_chart_info;
              if (dataCase.xpath_image_loaded) {
                xpathSizeChartImageLoaded = dataCase.xpath_image_loaded;
              }
              if (sizeChartInfo.image_local || sizeChartInfo.image_url || sizeChartInfo.description_option.image) {
                await waitForImageLoaded(productSF.page, xpathSizeChartImageLoaded);
                await productSF.page.waitForTimeout(1500);
              }
              await snapshotFixture.verify({
                page: productSF.page,
                snapshotName: dataCase.picture.storefront_show_size_chart,
                selector: sizeChart.xpathShowSizeChart,
              });
            });
            break;
          case "add_product_tag_and_show_product_size_guide":
            // only apply case SB_OLS_RSC_24
            // add tag
            await product.waitForElementVisibleThenInvisible(sizeChart.xpathProductDetailLoading);
            await product.setProductTags(dataCase.size_chart_tag);
            await product.clickOnBtnWithLabel("Save changes");
            await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);

            // show product in storefront
            await productSF.page.reload();
            await productSF.waitResponseWithUrl("/assets/landing.css", 200000);
            await productSF.page.waitForSelector(sizeChart.xpathButtonSizeGuide);
            await snapshotFixture.verify({
              page: productSF.page,
              snapshotName: dataCase.picture.storefront_has_size_chart,
              selector: sizeChart.xpathProductVariant,
            });

            // show size chart
            await productSF.page.locator(sizeChart.xpathButtonSizeGuide).click();
            await productSF.page.waitForSelector(sizeChart.xpathShowSizeChart, { timeout: 3000 });
            await waitForImageLoaded(productSF.page, dataCase.xpath_image_loaded);
            await snapshotFixture.verify({
              page: productSF.page,
              snapshotName: dataCase.picture.storefront_show_size_chart,
              selector: sizeChart.xpathShowSizeChart,
            });
            break;
          case "add_size_chart_and_show_product_size_guide":
            // only apply case SB_OLS_RSC_24
            // add size-chart
            await sizeChart.gotoSizeChart("admin/size-chart");
            await sizeChart.searchAndDeleteSizecharts(dataCase.size_chart_info.style);
            await sizeChart.addSizeChartWithOption(dataCase.size_chart_info);
            await sizeChart.waitForElementVisibleThenInvisible(sizeChart.xpathPageLoading);
            sizeChartTag = await dashboard.getByPlaceholder("Size guide").inputValue();

            // add tag

            await product.goToProductList();
            await product.searchProduct(dataCase.product_info.title);
            await product.chooseProduct(dataCase.product_info.title);
            await product.waitForElementVisibleThenInvisible(sizeChart.xpathProductDetailLoading);
            await product.setProductTags(sizeChartTag);
            await product.clickOnBtnWithLabel("Save changes");
            await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);

            // show product in storefront
            await productSF.page.reload();
            await productSF.waitResponseWithUrl("/assets/landing.css");
            await productSF.page.waitForSelector(sizeChart.xpathButtonSizeGuide);
            await snapshotFixture.verify({
              page: productSF.page,
              snapshotName: dataCase.picture.storefront_has_size_chart,
              selector: sizeChart.xpathProductVariant,
            });

            // show size chart
            await productSF.page.locator(sizeChart.xpathButtonSizeGuide).click();
            await productSF.page.waitForSelector(sizeChart.xpathShowSizeChart, { timeout: 3000 });
            await waitForImageLoaded(productSF.page, dataCase.xpath_image_loaded);
            await snapshotFixture.verify({
              page: productSF.page,
              snapshotName: dataCase.picture.storefront_show_size_chart,
              selector: sizeChart.xpathShowSizeChart,
            });
            break;
        }
      }
    });
  });
});
