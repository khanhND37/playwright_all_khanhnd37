import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { removeCurrencySymbol } from "@core/utils/string";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";

let currentVariant: Array<string>;
let status: string;
let plusbasePage: DropshipCatalogPage;
let productCostExp: number;
let shippingFirstItemExp: number;
let shippingAddItemExp: number;

test.describe("Makup product cost @SB_PLB_CTL_ALP_3", async () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.time_out);
    plusbasePage = new DropshipCatalogPage(dashboard, conf.suiteConf.domain);
    status = conf.caseConf.status;
    currentVariant = conf.caseConf.variants;
    productCostExp = conf.caseConf.product_cost;
    shippingFirstItemExp = conf.caseConf.shipping_first_item;
    shippingAddItemExp = conf.caseConf.shipping_add_item;
  });

  test(`Verify update công thức tính base cost và shipping fee @SB_PLB_CTL_ALP_3`, async ({
    conf,
    odoo,
    authRequest,
  }) => {
    await test.step(`Vào Dashboard > aliexpress product > Click button Add AliExpress product > Thực hiện request aliexpress product`, async () => {
      await plusbasePage.goToImportAliexpressProductPage();
      await plusbasePage.fillLinkRequestProduct(conf.caseConf.link_ali);
      await plusbasePage.clickImportAliexpressLink();
    });

    await test.step(`Mở product vừa reuqest > Kiểm tra product cost tương ứng theo base cost trên ali`, async () => {
      await plusbasePage.searchAndClickViewRequestDetail(conf.caseConf.link_ali);
      await plusbasePage.waitForCrawlSuccess(status);
      const productCost = await plusbasePage.getProductCostByVariant(currentVariant);
      expect(Number(productCost)).toEqual(productCostExp);
    });

    await test.step(`Kiểm tra shipping fee`, async () => {
      // Verify shipping fee of first item
      const shippingFeeFirstItem = removeCurrencySymbol(await plusbasePage.getShipping(2));
      expect(Number(shippingFeeFirstItem)).toEqual(shippingFirstItemExp);

      // Verify shipping fee of additional item
      const shippingFeeAddItem = removeCurrencySymbol(await plusbasePage.getShipping(3));
      expect(Number(shippingFeeAddItem)).toEqual(shippingAddItemExp);

      // Clean data after request
      const plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);
      await plusbasePage.cleanProductAfterRequest(odoo, plusbaseProductAPI, {
        url: conf.caseConf.link_ali,
        odoo_partner_id: conf.suiteConf.odoo_partner_id,
        cancel_reason_id: conf.suiteConf.cancel_reason_id,
        skip_if_not_found: true,
      });
    });
  });
});
