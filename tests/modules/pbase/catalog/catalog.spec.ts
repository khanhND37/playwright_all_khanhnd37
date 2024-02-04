import { test, expect } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";

test.describe("Check catalog pbase", () => {
  let printbasePage: PrintBasePage;
  test.beforeEach(async ({ conf, dashboard }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    await dashboard.waitForTimeout(5 * 1000);
    await printbasePage.navigateToMenu("Catalog");
    await dashboard.waitForResponse(
      response =>
        response.url().includes("/admin/pbase-product-base/catalogs.json") ||
        (response.url().includes("/admin/pbase-product-base/shipping-combos.json") && response.status() === 200),
    );
  });

  test("Kiểm tra select and unselect các products @SB_PB_PH_CATALOG_8", async ({ dashboard, conf }) => {
    const productInfo = conf.caseConf.product_info;
    const listBaseProduct = productInfo.base_product.split(",").map(item => item.trim());
    await test.step("Select products", async () => {
      await printbasePage.addBaseProduct(productInfo);
      await dashboard.waitForSelector(printbasePage.xpathNumberOfSelectedBase(listBaseProduct.length));
      for (let i = 0; i < listBaseProduct.length; i++) {
        await dashboard.waitForSelector(
          printbasePage.xpathBtnActionBaseProductWithLabel(listBaseProduct[i], conf.caseConf.label),
        );
      }
    });

    await test.step("Unselect các product vừa chọn", async () => {
      await printbasePage.unselectBaseProduct(productInfo);
      await expect(dashboard.locator(printbasePage.xpathNumberOfSelectedBase(0))).toHaveCount(0);
    });
  });

  test("Kiểm tra khi select quá 25 products @SB_PB_PH_CATALOG_7", async ({ dashboard, conf }) => {
    const productInfo = conf.caseConf.product_info;
    await test.step(`Select 25 products`, async () => {
      await printbasePage.addBaseProducts(productInfo);
      await expect(dashboard.locator(printbasePage.xpathMessagOverAdd)).toHaveText(conf.caseConf.message.error_message);
    });
  });
});
