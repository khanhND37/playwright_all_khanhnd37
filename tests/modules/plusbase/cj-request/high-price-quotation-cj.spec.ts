import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { OdooService } from "@services/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import type { SaleOrder, QuotationCancelReason, PlbCatalogProduct, RequestProductData } from "@types";
import { removeCurrencySymbol } from "@core/utils/string";

let domain: string;
let plusbasePage: DropshipCatalogPage;
let urlCj: string;
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

test.describe("Limit SO high price 150", async () => {
  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    domain = conf.suiteConf.domain;
    urlCj = conf.caseConf.url_cj;
    productName = conf.caseConf.product_name;
    dataLimit = conf.suiteConf.data_limit;
    plusbasePage = new DropshipCatalogPage(dashboard, domain);
    plbProductApi = new PlusbaseProductAPI(domain, authRequest);

    // Request product
    const cjProductData: RequestProductData = {
      user_id: parseInt(conf.suiteConf.user_id),
      products: [{ url: urlCj, note: "" }],
      is_plus_base: true,
    };
    await plbProductApi.requestProductByAPI(cjProductData);
    await plusbasePage.waitProductCrawlSuccessWithUrl(plbProductApi, urlCj, 15, true, conf.caseConf.status);
  });

  test.afterEach(async ({ conf, odoo }) => {
    // Delete quotation, product template partner
    await plusbasePage.cleanProductAfterRequest(odoo, plbProductApi, {
      url: urlCj,
      odoo_partner_id: conf.suiteConf.partner_id,
      cancel_reason_id: 3,
      not_ali: true,
      skip_if_not_found: true,
    });
  });

  test(`Verify request với link product có price <= $150 @SB_PLB_CJ_RC_16`, async ({}) => {
    await test.step(`Tại menu bên trái chọn Dropship Products > Product request > Click button "Import Product" > Thực hiện request sản phẩm Cj`, async () => {
      // Verify product info in list request
      await plusbasePage.goToProductRequest();
      await plusbasePage.searchProductInList("Available", productName);
      const productInfo = await plusbasePage.getDataOfFirstProductInList();
      expect(productInfo.product_name).toEqual(productName);
    });

    await test.step(`Vào product request detail của sản phẩm vừa request> Verify UI`, async () => {
      await plusbasePage.searchAndClickViewRequestDetail(productName);
      expect(await plusbasePage.getProductNameInSODetail()).toEqual(productName);
      expect(await plusbasePage.isTextVisible("Add to store")).toEqual(true);
    });
  });

  test(`Verify request với link product có price > $150 và <= $150 @SB_PLB_CJ_RC_17`, async ({ conf }) => {
    const listCost: Array<number> = [];

    await test.step(`Tại menu bên trái chọn Dropship Products > Product request > Click button "Import Product" > Thực hiện request sản phẩm Cj`, async () => {
      // Verify product info in list request
      await plusbasePage.searchProductInList("Available", productName);
      const productInfo = await plusbasePage.getDataOfFirstProductInList();
      expect(productInfo.product_name).toEqual(productName);
    });

    await test.step(`Vào product request detail của sản phẩm vừa request > Verify UI SO `, async () => {
      const variantProduct = conf.caseConf.variants_product;
      await plusbasePage.searchAndClickViewRequestDetail(productName);
      expect(await plusbasePage.getProductNameInSODetail()).toEqual(productName);
      expect(await plusbasePage.isTextVisible("Add to store")).toEqual(true);
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

  test(`Verify request với link product có price > $150 @SB_PLB_CJ_RC_18`, async ({ conf, odoo }) => {
    const odooService = OdooService(odoo);

    await test.step(`Tại menu bên trái chọn Dropship Products > Product request > Click button "Import Product" > Thực hiện request sản phẩm Cj`, async () => {
      // Verify product info in list request
      await plusbasePage.searchProductInList("No Result", urlCj);
      const productInfo = await plusbasePage.getDataOfFirstProductInList();
      expect(productInfo.product_name).toEqual(productName);
    });

    await test.step(`Vào product request detail của sản phẩm vừa request > Verify UI`, async () => {
      await plusbasePage.searchAndClickViewRequestDetail(urlCj);
      expect(await plusbasePage.isTextVisible("Add to store")).toEqual(false);
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
