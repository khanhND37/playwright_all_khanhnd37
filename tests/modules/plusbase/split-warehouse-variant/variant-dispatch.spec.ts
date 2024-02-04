import { test } from "@fixtures/odoo";
import { expect } from "@playwright/test";
import { removeCurrencySymbol } from "@core/utils/string";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { DashboardAPI } from "@pages/api/dashboard";

test.describe("Variant dispatch", async () => {
  let odooService: OdooServiceInterface;
  let plusbasePage: DropshipCatalogPage;

  test.beforeAll(async ({ odoo }) => {
    odooService = OdooService(odoo);
  });

  test.beforeEach(async ({ dashboard, conf }) => {
    if (conf.caseName !== "SB_PLB_SW_01") {
      plusbasePage = new DropshipCatalogPage(dashboard, conf.suiteConf.domain);
    }
  });

  test(`@SB_PLB_SW_01 Verify config warehouse cho từng variant trong product template detail trên odoo`, async ({
    conf,
  }) => {
    const config = conf.caseConf;
    await test.step(`Reset data before run test`, async () => {
      await resetProductData(config.product_template_id);
    });

    await test.step(`Vào màn product detail odoo > Check warehouse default`, async () => {
      const product = await odooService.getProductTemplatesById(config.product_template_id, [
        "id",
        "x_warehouse_id",
        "x_product_warehouse_ids",
      ]);
      expect(product.id).toEqual(config.product_template_id);
      expect(product.x_warehouse_id[0]).toEqual(1);
      expect([product.x_warehouse_id[1]].includes(`Variant dispatch`)).toBeFalsy();
    });

    await test.step(`Click "Edit" > Chọn warehouse "variant dispatch" > Click "Save"`, async () => {
      let errMsg = "";
      try {
        await odooService.updateProductTemplate(
          [config.product_template_id],
          {
            x_warehouse_id: config.variant_dispatch_warehouse_id,
          },
          false,
        );
      } catch (error) {
        errMsg = error.faultString;
      }
      expect(errMsg).toEqual(config.err.lack_variant);
    });

    await test.step(`Chọn variant cho từng kho, không chọn hết variant > Click "Save"`, async () => {
      let errMsg = "";
      try {
        await odooService.updateProductTemplate(
          [config.product_template_id],
          {
            x_warehouse_id: config.variant_dispatch_warehouse_id,
            x_product_warehouse_ids: [
              [
                0,
                null,
                {
                  stock_warehouse_id: config.aliexpress_warehouse_id,
                  product_product_ids: [[6, false, config.invalid_aliexpress_product_product_ids]],
                },
              ],
              [
                0,
                null,
                {
                  stock_warehouse_id: config.chaoshi_warehouse_id,
                  product_product_ids: [[6, false, config.valid_chaoshi_product_product_ids]],
                },
              ],
            ],
          },
          false,
        );
      } catch (error) {
        errMsg = error.faultString;
      }
      expect(errMsg).toEqual(config.err.lack_variant);
    });

    await test.step(`Config hết variant cho từng kho, config shipping type chỉ đi AliExpress > Click Save`, async () => {
      let errMsg = "";
      try {
        await odooService.updateProductTemplate(
          [config.product_template_id],
          {
            x_warehouse_id: config.variant_dispatch_warehouse_id,
            x_delivery_carrier_type_ids: [[6, false, [config.aliexpress_carrier_id]]],
            x_product_warehouse_ids: [
              [
                0,
                null,
                {
                  stock_warehouse_id: config.aliexpress_warehouse_id,
                  product_product_ids: [[6, false, config.valid_aliexpress_product_product_ids]],
                },
              ],
              [
                0,
                null,
                {
                  stock_warehouse_id: config.chaoshi_warehouse_id,
                  product_product_ids: [[6, false, config.valid_chaoshi_product_product_ids]],
                },
              ],
            ],
          },
          false,
        );
      } catch (error) {
        errMsg = error.faultString;
      }
      expect(errMsg).toContain(config.err.invalid_shipping);
    });

    await test.step(`Config shipping type của Chaosi > Click save`, async () => {
      let errMsg = "";
      try {
        await odooService.updateProductTemplate(
          [config.product_template_id],
          {
            x_warehouse_id: config.variant_dispatch_warehouse_id,
            x_delivery_carrier_type_ids: [[6, false, [config.chaoshi_carrier_id]]],
            x_product_warehouse_ids: [
              [
                0,
                null,
                {
                  stock_warehouse_id: config.aliexpress_warehouse_id,
                  product_product_ids: [[6, false, config.valid_aliexpress_product_product_ids]],
                },
              ],
              [
                0,
                null,
                {
                  stock_warehouse_id: config.chaoshi_warehouse_id,
                  product_product_ids: [[6, false, config.valid_chaoshi_product_product_ids]],
                },
              ],
            ],
          },
          false,
        );
      } catch (error) {
        errMsg = error.faultString;
      }
      expect(errMsg).toEqual("");
    });
  });

  test(`@SB_PLB_SW_04 Verify SO detail khi SO đã send, đã notify to merchant`, async ({
    // context,
    conf,
    dashboard,
    authRequest,
  }) => {
    const config = conf.caseConf;
    const dashboardApi = new DashboardAPI(conf.suiteConf.domain, authRequest, dashboard);
    const sbaseCountries = await dashboardApi.getCountries();
    const mapSbaseCountries = sbaseCountries.countries.reduce((a, b) => ({ ...a, [b.code]: b }), {});

    await plusbasePage.goToProductRequestDetail(config.product_template_id);

    await test.step(`Check shipping method`, async () => {
      await plusbasePage.selectVariantByTitle([`XS`, `GRAY`]);

      const shippingData = await plusbasePage.getShippingsInQuotationDetailPage();
      expect(shippingData.shippings.map(i => i.shipping_method)).toEqual(config.support_shipping_methods);
    });

    await test.step(`Chọn variant > Chọn 'See detail' ở total cost > Verify total cost của từng variant`, async () => {
      for (const step of config.validate_shipping_price_steps) {
        await plusbasePage.selectVariantByTitle(step.variant_options);
        await plusbasePage.clickSeeDetail();
        expect(await plusbasePage.countShipingInPopup()).toEqual(step.shipping_methods.length);

        const soLines = await odooService.getSaleOrderLineBySaleOrderId(step.sale_order_id);
        expect(soLines.length).toBeGreaterThan(0);
        const smallestPriceUnit = soLines.map(i => i.price_unit).reduce((a, b) => Math.min(a, b));

        // Compare first, additinal shipping price, total cost
        for (let i = 0; i < step.shipping_methods.length; i++) {
          const row = i + 1;
          const compareData = step.shipping_methods[i];
          const shippingMethod = await plusbasePage.getShipingInPopup(row, 1);
          expect(shippingMethod).toEqual(compareData.name);
          const shippingIndex = 2 + i * 4;
          const first = parseFloat(removeCurrencySymbol(await plusbasePage.getShippingCostInPopUp(shippingIndex, 1)));
          expect(first).toEqual(compareData.first);
          const additional = parseFloat(
            removeCurrencySymbol(await plusbasePage.getShippingCostInPopUp(shippingIndex, 2)),
          );
          expect(additional).toEqual(compareData.additional);
          const totalCost = await plusbasePage.getShipingInPopup(row, 4);
          expect(removeCurrencySymbol(totalCost)).toEqual((first + smallestPriceUnit).toFixed(2));
        }

        await plusbasePage.clickClosePopup();
      }
    });

    await test.step(`Click see detail trong shipping information`, async () => {
      await plusbasePage.clickSeeDetail(2);
      const totalShipping = await plusbasePage.countShipingInPopup();
      expect(totalShipping).toEqual(config.validate_shipping_countries.length);

      const productTemplate = await odooService.getProductTemplatesById(config.product_template_id, [
        "id",
        "x_delivery_carrier_type_ids",
        "x_platform_shipping_fee",
      ]);
      expect(productTemplate.id).toEqual(config.product_template_id);

      // Compare data
      for (let i = 0; i < config.validate_shipping_countries.length; i++) {
        const compareData = config.validate_shipping_countries[i];
        const compareCountries = [];
        switch (compareData.fulfillment_by) {
          case "AliExpress":
            // get countries available for fulfillment by Aliexpress
            for (const code in JSON.parse(productTemplate.x_platform_shipping_fee)) {
              if (mapSbaseCountries[code]) {
                compareCountries.push(mapSbaseCountries[code].name);
              }
            }
            break;
          case "Trusted supplier":
            // get countries available for fulfillment by Trusted supplier
            expect(productTemplate.x_delivery_carrier_type_ids).toBeDefined();
            expect(productTemplate.x_delivery_carrier_type_ids.length).toBeGreaterThan(0);
            for (const country of await odooService.getCountriesSupportByShippingTypeId(
              productTemplate.x_delivery_carrier_type_ids,
            )) {
              if (mapSbaseCountries[country.code]) {
                compareCountries.push(mapSbaseCountries[country.code].name);
              }
            }
            break;
        }

        const row = i + 1;
        const variants = await plusbasePage.getShipingInPopup(row, 1);
        expect(variants).toContain(compareData.variant_name);
        const fulfillmentBy = await plusbasePage.getShipingInPopup(row, 2);
        expect(fulfillmentBy).toEqual(compareData.fulfillment_by);
        const countries = await plusbasePage.getShipingInPopup(row, 3);

        for (const country of countries.split(`,`)) {
          const isCheck = compareCountries.includes(country.trim().replace(/\./g, ""));
          expect(isCheck).toBeTruthy();
        }
        expect(compareCountries.length).toEqual(countries.split(`,`).length);
      }
    });

    await test.step(`Click "Learn more"`, async () => {
      // Wait pm provide helpdoc url
      // const [helpDoc] = await Promise.all([
      //   context.waitForEvent("page"),
      //   await plusbasePage
      //     .genLoc("//div[@class='spds-modal-shipping-information']//a[normalize-space()='Learn more']")
      //     .click(),
      // ]);
      // await helpDoc.waitForLoadState("load");
      // expect(helpDoc.url()).toContain("https://help.shopbase.com/en/article/learn-more/");
      // await helpDoc.close();
    });
  });

  /**
   * Use to reset data of product
   * @param productId product template id
   * @returns void
   */
  const resetProductData = async (productId: number, isCheck = false) => {
    if (productId > 0) {
      await odooService.updateProductTemplate(
        [productId],
        {
          x_warehouse_id: 1,
          x_product_warehouse_ids: [[2, false, []]],
          x_delivery_carrier_type_ids: [[6, false, [1]]],
        },
        isCheck,
      );
    }
  };
});
