import { test } from "@fixtures/odoo";
import { expect } from "@core/fixtures";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import type { FixtureOdoo, RequestProductData, TemplateAttribute } from "@types";
import { OdooService } from "@services/odoo";
import { formatDate } from "@core/utils/datetime";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";

/** Extra local variables */
let productAttributes;

test.describe("Test show timeline product Plusbase", () => {
  let plusPage: DropshipCatalogPage;
  let productId: number;
  let odooEx: FixtureOdoo;
  let aliRequestProductId: number;

  test.beforeAll(async ({ odoo, conf }) => {
    odooEx = odoo;
    productAttributes = conf.suiteConf.default_attributes;
    const odooService = OdooService(odoo);

    // create product template for all test cases
    const attributes: Array<TemplateAttribute> = [];
    for (let i = 0; i < productAttributes.length; i++) {
      if (productAttributes[i].on_product_create) {
        const attribute: TemplateAttribute = {
          id: productAttributes[i].id,
          number_of_values: productAttributes[i].number_of_values,
        };
        attributes.push(attribute);
      }
    }
    productId = await odooService.createProductTemplate("(Test product) Auto-PLB-Timeline", 2, attributes);
    await odooService.sendQuotation(productId);
  });

  test.beforeEach(async ({ dashboard, conf }) => {
    plusPage = new DropshipCatalogPage(dashboard, conf.suiteConf.domain);
  });

  test.afterAll(async ({ conf, authRequest }) => {
    const plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);
    await plusPage.cleanProductAfterRequest(odooEx, plusbaseProductAPI, {
      url: conf.suiteConf.aliexpress_url,
      odoo_partner_id: conf.suiteConf.partner_id,
      cancel_reason_id: 3,
      skip_if_not_found: true,
    });
  });

  test("Check hiển thị timeline khi tạo mới product trên odoo @SB_PRO_TL_02", async ({ conf }) => {
    await test.step("Vào Catalog > Mở product product catalog detail > Verify timeline", async () => {
      await plusPage.goToProductCatalogDetailById(productId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, false);
      expect(result).toEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
      expect(await plusPage.isTimelineLocalDate()).toBeTruthy();
    });
  });

  test("Check hiển thị timeline khi add product variant trên odoo @SB_PRO_TL_3", async ({ conf }) => {
    const odooService = OdooService(odooEx);
    await test.step("Vào odoo > add thêm attribute line cho product", async () => {
      const newAttribute = productAttributes.find(attr => {
        return attr.name === conf.caseConf.new_attribute_name;
      });
      const tmplAttr = {
        id: newAttribute.id,
        number_of_values: 1,
      };
      await odooService.addProductAttributeLines(productId, tmplAttr);
    });
    await test.step("Vào dasboard > mở catalog detail > check hiển thị timeline của product A", async () => {
      await plusPage.goToProductCatalogDetailById(productId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, false);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
    });
  });

  test("Check hiển thị timeline khi update plusbase basecost nhiều product variant của 1 product trên odoo @SB_PRO_TL_11", async ({
    conf,
  }) => {
    const odooService = OdooService(odooEx);
    const variantIds = await odooService.getProductVariantIdsByProductId(productId, true);
    await odooService.updateProductVariant(variantIds, { x_plusbase_base_cost: 1 });

    await test.step("Vào odoo > Update plusbase basecost cho product variant bất kì đang active của product", async () => {
      const variantIds = await odooService.getProductVariantIdsByProductId(productId, true);
      expect(variantIds.length).toBeGreaterThan(0);
      await odooService.updateProductVariant(variantIds, { x_plusbase_base_cost: 5 });
    });
    await test.step("Vào dashboard > mở catalog detail > check hiển thị timeline của product A", async () => {
      await plusPage.goToProductCatalogDetailById(productId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, false);
      expect(result).toEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
    });
  });

  test("Check hiển thị timeline khi archive nhiều product variant của1 product trên odoo @SB_PRO_TL_5", async ({
    conf,
  }) => {
    const odooService = OdooService(odooEx);
    await test.step("Vào odoo > archive product variant đang active bất kì của product", async () => {
      const resultsAttrVal = await odooService.getProductVariantIdsByProductId(productId, true, 1);
      expect(resultsAttrVal.length).toBeGreaterThan(0);
      try {
        await odooEx.callAction({
          args: resultsAttrVal,
          model: "product.product",
          action: "action_archive",
        });
      } catch (e) {
        // Ignore this exception
      }
    });
    await test.step("Vào dashboard > mở catalog detail > check hiển thị timeline của product A", async () => {
      await plusPage.goToProductCatalogDetailById(productId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, false);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
    });
  });

  test("Check hiển thị timeline khi update Estimated Delivery nhiều product trên odoo @SB_PRO_TL_14", async ({
    conf,
  }) => {
    const odooService = OdooService(odooEx);
    await test.step("Vào odoo > Update Estimate Delivery quotation của product", async () => {
      const quotationId = await odooService.getQuotationByProductId(productId, ["id"]);
      expect(quotationId.length).toBeGreaterThan(0);
      await odooService.updateQuotationProcessingTime(quotationId[0]["id"], conf.caseConf.new_estimate_delivery);
    });
    await test.step("Vào dashboard > mở catalog detail > check hiển thị timeline của product A", async () => {
      await plusPage.goToProductCatalogDetailById(productId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, false);
      expect(result).toEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
    });
  });

  test("Check hiển thị timeline khi delete nhiều product variant của 1 product trên odoo @SB_PRO_TL_8", async ({
    conf,
  }) => {
    const odooService = OdooService(odooEx);
    await test.step("Vào odoo > delete product variant đang active bất kì của product", async () => {
      const removeAttribute = productAttributes.find(attr => {
        return attr.name === conf.caseConf.remove_attribute_name;
      });
      await odooService.removeAtrributeLine(productId, removeAttribute.id);
    });
    await test.step("Vào dashboard > mở catalog detail > check hiển thị timeline của product A", async () => {
      await plusPage.goToProductCatalogDetailById(productId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, false);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
    });
  });

  test("Check hiển thị timeline khi product chạy Flash Sales @SB_PRO_TL_25", async ({ conf }) => {
    const odooService = OdooService(odooEx);
    await test.step("Vào odoo > Website > Configuration > eCommerce Categories > Flash sale > Add product, enable flash sale", async () => {
      const date = formatDate(new Date(), "YYYY-MM-DD HH:mm:ss");
      await odooService.addProductToFlashSale(
        productId[0],
        conf.suiteConf.flash_sale_id,
        date,
        conf.caseConf.sale_duration,
      );
    });
    await test.step("Vào dashboard > mở catalog detail > check hiển thị timeline của product A", async () => {
      await plusPage.goToProductCatalogDetailById(productId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, true);
      expect(result).toEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
    });
  });

  test("Check hiển thị timeline khi merchant import product to store @SB_PRO_TL_15", async ({ conf }) => {
    await test.step("Vào dasboard > mở catalog detail > Click import to store > Click import", async () => {
      await plusPage.goToProductCatalogDetailById(productId);
      await plusPage.clickBtnImportToStore();
      await plusPage.importFirstProductToStore();
      await plusPage.page.waitForSelector("//span[contains(text(), 'variant(s) have been added to store')]");
    });
    await test.step("Quay lại catalog detail > check hiển thị timeline của product A", async () => {
      await plusPage.goToProductCatalogDetailById(productId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, false);
      expect(result).toEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
    });
  });

  test("Check hiển thị timeline khi cancel 1 quotation của 1 product @SB_PRO_TL_24", async ({ conf }) => {
    const odooService = OdooService(odooEx);
    await test.step("Vào odoo> Sale > search quotation SO{xxxx} > detail Quotation > Cancel Quotation", async () => {
      const quotationId = await odooService.getQuotationByProductId(productId, ["id"]);
      expect(quotationId.length).toBeGreaterThan(0);
      await odooService.cancelQuotation(quotationId[0]["id"], 3);
      await odooService.setQuotationDraft(quotationId[0]["id"]);
    });
    await test.step("Vào dashboard > mở catalog detail > check hiển thị timeline của product A", async () => {
      await plusPage.goToProductCatalogDetailById(productId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, false);
      expect(result).toEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
    });
  });

  test("Check hiển thị timeline khi merchant tạo request thành công @SB_PRO_TL_26", async ({ conf, authRequest }) => {
    await test.step("Vào dashboard > AliExpress products > Add Aliexpress product > Điền input data > Import Aliexpress link", async () => {
      const plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);
      const aliProduct: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: conf.suiteConf.aliexpress_url, note: "" }],
        is_plus_base: true,
      };
      await plusPage.goToProductRequest();
      await plusbaseProductAPI.requestProductByAPI(aliProduct);
    });
    await test.step("Vào dashboard > AliExpress products > Vào product mới được tạo", async () => {
      await plusPage.page.waitForSelector(`(//a[div/a[@href='${conf.suiteConf.aliexpress_url}']])[1]`);
      const url = await plusPage.page.getAttribute(
        `(//a[div/a[contains(@href, '${conf.suiteConf.aliexpress_url}')]])[1]`,
        "href",
      );
      const urlParts = url.split("/");
      aliRequestProductId = +urlParts[urlParts.length - 1];
      await plusPage.goToProductRequestDetail(aliRequestProductId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, true);
      expect(result).toEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
    });
  });

  test("Check hiển thị timeline khi product available do send by email quotation trên odoo @SB_PRO_TL_27", async ({
    conf,
  }) => {
    const odooService = OdooService(odooEx);
    await test.step("Vào Odoo > Sale > vào quotation > send by email", async () => {
      await odooService.sendQuotation(aliRequestProductId);
    });
    await test.step("Vào dashboard > mở catalog detail > check hiển thị timeline của product A", async () => {
      await plusPage.goToProductRequestDetail(aliRequestProductId);
      const result = await plusPage.getCountTimelineCatalog(conf.caseConf.timeline_expected_result, false);
      expect(result).toEqual(1);
      expect(await plusPage.isTimelineLocalTime()).toBeTruthy();
    });
  });
});
