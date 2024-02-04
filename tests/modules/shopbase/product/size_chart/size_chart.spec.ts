import { test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";

test.describe("Feature size chart", () => {
  let productPage: ProductPage;
  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    await dashboard.waitForTimeout(1000);
    await productPage.navigateToSubMenu("Online Store", "Size charts");
  });
  test("@SB_PRB_SZC_88 - Add size chart information file ảnh < 2MB", async ({ conf }) => {
    const sizeChartInfo = conf.caseConf.size_chart;
    await test.step("Input thông tin size chart", async () => {
      await productPage.deleteAllSizeChart();
      await productPage.clickOnBtnWithLabel("Add size chart");
      await productPage.createSizeChartSBase(sizeChartInfo);
    });
  });
});
