import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { OdooService } from "@services/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import type { SaleOrder, QuotationCancelReason, PlbCatalogProduct, RequestProductData } from "@types";
import { removeCurrencySymbol } from "@core/utils/string";

let domain: string;
let plusbasePage: DropshipCatalogPage;
let urlAli: string;
let statusCrawl: string;
let productName: string;
let plbProductApi: PlusbaseProductAPI;
let isAlertVisible: boolean,
  productId: number,
  quotationId: number,
  quotation: Array<SaleOrder>,
  cancelReasonId: number,
  reason: QuotationCancelReason;
let variantInfo: PlbCatalogProduct;
let dataLimit: number;

test.describe("Limit SO high price 500", async () => {
  test.beforeEach(async ({ conf, odoo, dashboard, authRequest }) => {
    domain = conf.suiteConf.domain;
    urlAli = conf.caseConf.url_ali;
    statusCrawl = conf.caseConf.status_crawl;
    productName = conf.caseConf.product_name;
    dataLimit = conf.suiteConf.data_limit;
    plusbasePage = new DropshipCatalogPage(dashboard, domain);
    plbProductApi = new PlusbaseProductAPI(domain, authRequest);

    // Delete quotation, product template partner
    await plusbasePage.cleanProductAfterRequest(odoo, plbProductApi, {
      url: urlAli,
      odoo_partner_id: conf.suiteConf.partner_id,
      cancel_reason_id: 3,
      skip_if_not_found: true,
    });

    // Request product
    await plusbasePage.goToProductRequest();
    const aliProductData: RequestProductData = {
      user_id: parseInt(conf.suiteConf.user_id),
      products: [{ url: urlAli, note: "" }],
      is_plus_base: true,
    };
    await plbProductApi.requestProductByAPI(aliProductData);

    await plusbasePage.searchAndClickViewRequestDetail(urlAli);
    await plusbasePage.waitForCrawlSuccess(statusCrawl);
  });

  test(`Verify request với link product có price <= $500 @SB_PLB_CTL_ALP_106`, async ({}) => {
    await test.step(`Tại menu bên trái chọn Dropship Products > AliExpress Products > Click button "Add AliExpress Product" > Thực hiện request sản phẩm Ali`, async () => {
      // Verify product info in list request
      await plusbasePage.searchProductInList(statusCrawl, urlAli);
      const productInfo = await plusbasePage.getDataOfFirstProductInList();
      expect(productInfo.product_name).toEqual(productName);
    });

    await test.step(`Vào product request detail của sản phẩm vừa request> Verify UI`, async () => {
      await plusbasePage.searchAndClickViewRequestDetail(urlAli);
      expect(await plusbasePage.getProductNameInSODetail()).toEqual(productName);
      expect(await plusbasePage.isTextVisible("Import to your store")).toEqual(true);
    });
  });

  test(`Verify request với link product có price > $500 và <= $500 @SB_PLB_CTL_ALP_107`, async ({ conf }) => {
    const listCost: Array<number> = [];

    await test.step(`Tại menu bên trái chọn Dropship Products > AliExpress Products > Click button "Add AliExpress Product" > Thực hiện request sản phẩm Ali`, async () => {
      // Verify product info in list request
      await plusbasePage.searchProductInList(statusCrawl, urlAli);
      const productInfo = await plusbasePage.getDataOfFirstProductInList();
      expect(productInfo.product_name).toEqual(productName);
    });

    await test.step(`Vào product request detail của sản phẩm vừa request > Verify UI SO `, async () => {
      const variantProduct = conf.caseConf.variants_product;
      await plusbasePage.searchAndClickViewRequestDetail(urlAli);
      expect(await plusbasePage.getProductNameInSODetail()).toEqual(productName);
      expect(await plusbasePage.isTextVisible("Import to your store")).toEqual(true);
      productId = plusbasePage.getProductIdFromQuotationDetail();
      variantInfo = await plbProductApi.getProductCatalogDetail(productId, { type: "private" });
      for (let i = 0; i < variantProduct.length; i++) {
        if (variantInfo.variants[i].product_cost > dataLimit) {
          await plusbasePage.hoverTooltipVariantHighPrice(variantProduct[i]);
          expect(await plusbasePage.isVisibleTooltipVariantHighPrice(dataLimit)).toBeTruthy();
          await expect(plusbasePage.page.locator(plusbasePage.xpathVarriantDisable(variantProduct[i]))).toHaveClass(
            /is-disabled/,
          );
          listCost.push(variantInfo.variants[i].product_cost);
        }
      }
      await plusbasePage.clickBtnImportToStore();
      await plusbasePage.page.waitForSelector(plusbasePage.xpathBtnAddToStore);
      expect(await plusbasePage.countVariantInImportList()).toEqual(variantProduct.length - listCost.length);
      expect(Number(removeCurrencySymbol(await plusbasePage.getDataTable(1, 1, 4)))).toBeLessThan(dataLimit);
    });
  });

  test(`Verify request với link product có price > $500 @SB_PLB_CTL_ALP_108`, async ({ conf, odoo }) => {
    const odooService = OdooService(odoo);

    await test.step(`Tại menu bên trái chọn Dropship Products > AliExpress Products > Click button "Add AliExpress Product" > Thực hiện request sản phẩm Ali`, async () => {
      // Verify product info in list request
      await plusbasePage.searchProductInList(statusCrawl, urlAli);
      const productInfo = await plusbasePage.getDataOfFirstProductInList();
      expect(productInfo.product_name).toEqual(productName);
    });

    await test.step(`Vào product request detail của sản phẩm vừa request > Verify UI`, async () => {
      await plusbasePage.searchAndClickViewRequestDetail(urlAli);
      expect(await plusbasePage.isTextVisible("Import to your store")).toEqual(false);
      expect(await plusbasePage.isTextVisible(productName)).toEqual(true);
      isAlertVisible = await plusbasePage.isAlertWithLinkVisible(
        conf.caseConf.alert_price_limit,
        "Learn more",
        conf.caseConf.learn_more_url,
      );
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
    });
  });
});
