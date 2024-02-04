import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { SBPage } from "@pages/page";

test.describe("Verify catalog detail", async () => {
  test("@SB_PLB_CTL_99 Verify search product có dữ liệu khi nhấn vào button search", async ({
    dashboard,
    conf,
    context,
  }) => {
    const domain = conf.suiteConf.domain;
    const productName = conf.caseConf.productName;
    let catalogPage = new DropshipCatalogPage(dashboard, domain);

    await test.step("Nhấn Catalog ngoài menu", async () => {
      const dashboardpage = new DashboardPage(dashboard, domain);
      await dashboardpage.goto("admin/plusbase/catalog");
      await dashboard.waitForSelector(".catalog-products-view");

      const totalProduct = await catalogPage.countProductCatalog();
      expect(totalProduct).toBeGreaterThan(0);
    });

    await test.step("Search product tồn tại > Nhấn button Search", async () => {
      await catalogPage.searchProductcatalog(productName);

      const sbPage = new SBPage(dashboard, domain);
      const SODetailPage = await sbPage.clickElementAndNavigateNewTab(
        context,
        await catalogPage.productSearchResult(productName),
      );

      catalogPage = new DropshipCatalogPage(SODetailPage, domain);
      const quotationNameResult = await catalogPage.getQuotationNameInSODetail();
      const processingTime = await catalogPage.getProcessingTimeSODetail();
      const processingRate = await catalogPage.getProcessingRateSODetail();
      const variants = conf.caseConf.variants;

      expect(quotationNameResult).toEqual(productName);
      expect(processingTime).toEqual(conf.caseConf.processing_time);
      expect(processingRate).toEqual(conf.caseConf.processing_rate);
      await expect(SODetailPage.locator("(//div[@class = 'image-wrap']//img)[1]")).toHaveAttribute(
        "src",
        conf.caseConf.image_src,
      );
      for (let i = 0; i < variants.length; i++) {
        const variantSODetail = await catalogPage.getVariantsSODetail(i + 1);
        expect(variantSODetail).toEqual(variants[i].size);
      }
    });
  });
});
