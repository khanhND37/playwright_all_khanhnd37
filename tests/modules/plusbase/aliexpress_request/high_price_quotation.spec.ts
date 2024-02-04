import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { loadData } from "@core/conf/conf";
import { OdooService } from "@services/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import type { SaleOrder, QuotationCancelReason, PlbCatalogProduct } from "@types";
import { removeCurrencySymbol } from "@core/utils/string";

test.describe("Limit SO high price", async () => {
  const alertPriceLimit = `This product has exceeded PlusBase's product value limit and cannot be available. Please try another link.`;
  const learnMoreUrl =
    "https://help.shopbase.com/en/article/request-aliexpress-products-in-plusbase-fvrmln/#3-c-frequently-asked-questions";

  const caseName = "SB_PLB_CTL_ALP_49_50_51";
  const conf = loadData(__dirname, caseName);

  conf.caseConf.data.forEach(({ case_id: caseId, description: caseDescription, product_request: product }) => {
    test(`${caseDescription} @${caseId}`, async ({ conf, odoo, dashboard, authRequest }) => {
      const domain = conf.suiteConf.domain;
      const datalLimit = conf.suiteConf.data_limit;
      const plusbasePage = new DropshipCatalogPage(dashboard, domain);
      const plbProductApi = new PlusbaseProductAPI(domain, authRequest);
      const odooService = OdooService(odoo);

      // Delete quotation, product template partner
      await plusbasePage.cleanProductAfterRequest(odoo, plbProductApi, {
        url: product.url,
        odoo_partner_id: conf.suiteConf.partner_id,
        cancel_reason_id: 3,
        skip_if_not_found: true,
      });

      await test.step(`Tại menu bên trái chọn Dropship Products > AliExpress Products > Click button "Add AliExpress Product" > Thực hiện request sản phẩm Ali`, async () => {
        await plusbasePage.goToImportAliexpressProductPage();
        await plusbasePage.fillLinkRequestProduct(product.url);
        await plusbasePage.clickImportAliexpressLink();

        // Wait for crawl done
        await plusbasePage.searchAndClickViewRequestDetail(product.url);
        await plusbasePage.waitForCrawlSuccess(product.status_crawl);

        // Verify product info in list request
        await plusbasePage.goToProductRequest();
        await plusbasePage.clickTab(product.status_crawl);
        await plusbasePage.searchWithKeyword(product.url, true);

        const productInfo = await plusbasePage.getDataOfFirstProductInList();
        expect(productInfo.product_name).toEqual(product.name);
      });

      await test.step(`Vào product request detail của sản phẩm vừa request`, async () => {
        await plusbasePage.searchAndClickViewRequestDetail(product.url);

        let isAlertVisible: boolean,
          productId: number,
          quotationId: number,
          quotation: Array<SaleOrder>,
          cancelReasonId: number,
          reason: QuotationCancelReason;
        let variantInfo: PlbCatalogProduct;
        const listCost: Array<number> = [];

        switch (caseId) {
          case "SB_PLB_CTL_ALP_49":
            expect(await plusbasePage.getProductNameInSODetail()).toEqual(product.name);
            expect(await plusbasePage.isTextVisible("Import to your store")).toEqual(true);
            break;
          case "SB_PLB_CTL_ALP_50":
            expect(await plusbasePage.getProductNameInSODetail()).toEqual(product.name);
            expect(await plusbasePage.isTextVisible("Import to your store")).toEqual(true);
            productId = plusbasePage.getProductIdFromQuotationDetail();
            variantInfo = await plbProductApi.getProductCatalogDetail(productId, { type: "private" });
            for (let i = 0; i < product.variants.length; i++) {
              if (variantInfo.variants[i].product_cost > datalLimit) {
                await plusbasePage.hoverTooltipVariantHighPrice(product.variants[i]);
                expect(await plusbasePage.isVisibleTooltipVariantHighPrice(datalLimit)).toBeTruthy();
                await expect(
                  plusbasePage.page.locator(plusbasePage.xpathVarriantDisable(product.variants[i])),
                ).toHaveClass(/is-disabled/);
                listCost.push(variantInfo.variants[i].product_cost);
              }
            }
            await plusbasePage.clickBtnImportToStore();
            await plusbasePage.page.waitForSelector(plusbasePage.xpathBtnAddToStore);
            expect(await plusbasePage.countVariantInImportList()).toEqual(product.variants.length - listCost.length);
            expect(Number(removeCurrencySymbol(await plusbasePage.getDataTable(1, 1, 4)))).toBeLessThan(datalLimit);
            break;
          case "SB_PLB_CTL_ALP_51":
            expect(await plusbasePage.isTextVisible("Import to your store")).toEqual(false);
            expect(await plusbasePage.isTextVisible(product.name)).toEqual(true);
            isAlertVisible = await plusbasePage.isAlertWithLinkVisible(alertPriceLimit, "Learn more", learnMoreUrl);
            expect(isAlertVisible).toBe(true);

            // Verify quotation cancel reason
            productId = plusbasePage.getProductIdFromQuotationDetail();
            quotationId = (
              await odoo.search({
                model: "sale.order",
                args: [["x_quoted_product_tmpl_id", "=", productId]],
                limit: 1,
              })
            )[0];

            quotation = await odoo.read("sale.order", [quotationId], ["state", "x_cancel_reason_id"]);
            expect(quotation[0].state).toEqual("cancel");

            cancelReasonId = quotation[0].x_cancel_reason_id[0];
            reason = await odooService.getQuotationCancelReasonById(cancelReasonId, ["id", "name"]);
            expect(reason.name).toEqual("High price limit");
        }
      });
    });
  });
});
