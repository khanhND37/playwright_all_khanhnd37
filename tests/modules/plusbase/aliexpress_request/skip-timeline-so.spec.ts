import { test } from "@fixtures/odoo";
import { expect } from "@playwright/test";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { CheckoutAPI } from "@pages/api/checkout";
import { ProductAPI } from "@pages/api/product";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import type { FixtureOdoo, OdooProductProduct, ProductInfoAPI, RequestProductData, SaleOrder } from "@types";
import { ProductPage } from "@pages/dashboard/products";
import uniq from "lodash/uniq";
import { removeCurrencySymbol, roundingDecimal } from "@core/utils/string";
import { loadData } from "@core/conf/conf";

test.describe("Skip SO (timeline + UI)", async () => {
  let domain: string;
  let plusbasePage: DropshipCatalogPage;
  let plusbaseProductAPI: PlusbaseProductAPI;
  let checkoutApi: CheckoutAPI;
  let productApi: ProductAPI;
  let odooService: OdooServiceInterface;
  let aliUrl: string;
  let shippingTypes: { [key: string]: number };
  let paymentTermId: number;
  let sbcnProductId: number;
  let productID: number;
  let productPage: ProductPage;

  test.beforeEach(async ({ conf, authRequest, multipleStore, odoo }) => {
    aliUrl = conf.suiteConf.ali_url;
    domain = conf.suiteConf.domain;
    shippingTypes = conf.suiteConf.shipping_types;
    paymentTermId = conf.suiteConf.payment_term_id;
    const dashboardPlbPage = await multipleStore.getDashboardPage(
      conf.suiteConf.username,
      conf.suiteConf.password,
      domain,
      conf.suiteConf.shop_id,
      conf.suiteConf.user_id,
    );

    checkoutApi = new CheckoutAPI(domain, authRequest);
    productApi = new ProductAPI(domain, authRequest);
    plusbasePage = new DropshipCatalogPage(dashboardPlbPage, domain);
    plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    productPage = new ProductPage(dashboardPlbPage, domain);
    odooService = OdooService(odoo);
  });

  test.afterEach(async ({ authRequest }) => {
    const productApi = new ProductAPI(domain, authRequest);
    await productApi.deleteProductByAPI();
  });

  const requestAliProduct = async (odoo: FixtureOdoo, conf, aliUrl: string) => {
    await plusbasePage.cleanProductAfterRequest(
      odoo,
      plusbaseProductAPI,
      {
        url: aliUrl,
        odoo_partner_id: conf.suiteConf.odoo_partner_id,
        cancel_reason_id: conf.suiteConf.cancel_reason_id,
        skip_if_not_found: true,
      },
      false,
    );
    await plusbasePage.goToProductRequest();
    const aliProductData: RequestProductData = {
      user_id: parseInt(conf.suiteConf.user_id),
      products: [{ url: aliUrl, note: "" }],
      is_plus_base: true,
    };
    await plusbaseProductAPI.requestProductByAPI(aliProductData);
    await plusbasePage.waitProductCrawlSuccessWithUrl(plusbaseProductAPI, aliUrl, conf.suiteConf.max_retry_time);
    await plusbasePage.page.reload();
    sbcnProductId = await plusbaseProductAPI.getProductTmplIDByUrl(plusbaseProductAPI, aliUrl, 1);
  };

  const importProductToStore = async () => {
    productID = await plusbaseProductAPI.importProductToStoreByAPI(sbcnProductId);
  };

  const getProductDetail = async () => {
    const productDetail = (await productApi.getDataProductById(productID)) as {
      product: ProductInfoAPI;
    };
    return productDetail;
  };

  const checkoutProduct = async productDetail => {
    expect(productDetail.product.variants.length).toBeGreaterThan(0);
    const variantId = productDetail.product.variants[0].id;
    await checkoutApi.addProductToCartThenCheckout([
      {
        variant_id: variantId,
        quantity: 1,
      },
    ]);
    await checkoutApi.updateCustomerInformation();
    await checkoutApi.selectDefaultShippingMethod(checkoutApi.defaultCustomerInfo.shippingAddress.country_code);
    const { info } = await checkoutApi.getCheckoutInfo();
    return info;
  };

  const getQuotation = async (productID: number) => {
    const quotations = await odooService.getQuotationByProductId(productID);
    expect(quotations.length).toBeGreaterThan(0);
    return quotations[0];
  };

  const sendQuotation = async (
    sbcnProductId: number,
    selectShippingTypes: Array<string>,
    estimatedDelivery?: number,
  ) => {
    const saleOrderReq = odooService.defaultSaleOrder;
    const shippingTypeIds = [];
    for (const shippingType of selectShippingTypes) {
      shippingTypeIds.push(shippingTypes[shippingType]);
    }

    if (estimatedDelivery) {
      saleOrderReq.x_estimated_delivery = estimatedDelivery;
    }

    if (paymentTermId) {
      saleOrderReq.payment_term_id = paymentTermId;
    }

    const resp = await odooService.updateProductAndSentQuotationWithOptions(
      sbcnProductId,
      { ...odooService.defaultProductTemplate, x_delivery_carrier_type_ids: [[6, false, shippingTypeIds]] },
      saleOrderReq,
      { price_unit: 10 },
      true,
      false,
      true,
      true,
    );
    expect(resp).toBeTruthy();
    const quotation = await getQuotation(sbcnProductId);
    expect(quotation.state).toEqual("sent");
  };

  const archiveFirstVariant = async (odoo: FixtureOdoo, sbcnProductId: number) => {
    const productProducts = await odooService.getProductVariantsByProductTemplateId(
      sbcnProductId,
      ["product_template_attribute_value_ids"],
      1,
    );
    expect(productProducts.length).toBeGreaterThan(0);
    const productProduct = productProducts[0];
    const productTemplateAttributeValues = await odoo.read(
      "product.template.attribute.value",
      productProduct.product_template_attribute_value_ids,
      ["name", "attribute_id"],
    );

    try {
      await odoo.callAction({
        args: [productProduct.id],
        model: "product.product",
        action: "action_archive",
      });
    } catch (e) {
      // Ignore this exception
    }

    return productTemplateAttributeValues;
  };

  const verifyQuotationDetailData = async (sbcnProductId: number, conf, isNotify: boolean, quotation) => {
    const countryCode = checkoutApi.defaultCustomerInfo.shippingAddress.country_code;
    const productTemplate = await odooService.getProductTemplatesById(sbcnProductId, [
      "x_ali_processing_rate",
      "x_platform_shipping_fee",
    ]);
    const platformShippingFee = JSON.parse(productTemplate.x_platform_shipping_fee);

    const shippingFeeByCountry = platformShippingFee[countryCode] as {
      freight_amount: string;
    };

    const productProducts = await odooService.getProductVariantsByProductTemplateId(sbcnProductId, ["x_price"]);
    expect(productProducts.length).toBeGreaterThan(0);

    await plusbasePage.selectVariantByTitle([...conf.suiteConf.variant]);
    const productCostAct = await plusbasePage.getProductCost();
    const processingTime = await plusbasePage.getProcessingTimeSODetail();
    const processingRate = await plusbasePage.getProcessingRateSODetail();
    const sellingPrice = await plusbasePage.getSellingPrice();
    const totalCost = await plusbasePage.getTotalCost();
    const profitMargin = (await plusbasePage.getProfitMargin()).toFixed(2);

    expect(processingTime).toEqual(`${conf.suiteConf.update_processing_time} days`);
    expect(processingRate).toEqual(`${productTemplate.x_ali_processing_rate}%`);
    expect(sellingPrice).toEqual(await plusbasePage.calculatorSellingPrice(productCostAct));

    let shippingFee = 0;
    if (!isNotify) {
      expect(productProducts[0].x_price).toEqual(productCostAct);
      shippingFee = plusbasePage.calculatorShippingAliFee(parseFloat(shippingFeeByCountry.freight_amount));
    } else {
      const saleOrderLines = await odooService.getSaleOrderLineBySaleOrderId(quotation.id);
      expect(saleOrderLines[0].price_unit).toEqual(productCostAct);
      await plusbasePage.clickSeeDetail();
      shippingFee = parseFloat(removeCurrencySymbol(await plusbasePage.getShippingCostInPopUp(2, 1)));
    }

    expect(totalCost).toEqual((await plusbasePage.calculatorTotalCost(shippingFee, productCostAct)).toString());

    expect(profitMargin).toEqual(
      await plusbasePage.calculatorProfitMargin(
        shippingFee,
        parseFloat(processingRate),
        productCostAct,
        0.03,
        parseFloat(sellingPrice),
      ),
    );
  };

  const getShippingTime = async (shippingTypeName: string, shippingTypeId: number) => {
    const shippingGroupIds = [];
    const deliveryCarriers = await odooService.getDeliveryCarriersByConditions({
      shippingTypeIds: [shippingTypeId],
    });
    for (const deliveryCarrier of deliveryCarriers) {
      const groupId = deliveryCarrier.x_delivery_carrier_group[0];
      if (shippingGroupIds.includes(groupId)) {
        continue;
      }
      shippingGroupIds.push(groupId);
    }

    const shippingGroups = await odooService.getDeliveryCarrierGroupsByConditions({
      ids: shippingGroupIds,
    });
    const shippingGroup = shippingGroups[0];
    const { shippingTime } = await odooService.getSmallestDeliveryCarriersByConditions({
      countryCode: checkoutApi.defaultCustomerInfo.shippingAddress.country_code,
      shippingGroupName: shippingGroup.name,
      shippingTypes: [shippingTypeName],
      weight: 1,
    });
    return shippingTime;
  };

  test(`@SB_PLB_SUQ_114 Verify processing time của SO đã send by email nhưng chưa notify to merchant`, async ({
    conf,
    odoo,
  }) => {
    await test.step(`Vào "Dropship products" > "AliExpress Products" > Click button "Add AliExpress product" > Nhập link Ali muốn request > Thực hiện request `, async () => {
      await requestAliProduct(odoo, conf, aliUrl);
      const productText = await plusbasePage.genLoc(plusbasePage.xpathProduct).first().innerText();
      expect(productText).toContain(aliUrl);
    });

    await test.step(`Vào SO detail product vừa request > Import to store > Checkout product vừa mới import to store > Verify processing time của order`, async () => {
      await importProductToStore();
      const productDetail = await getProductDetail();
      expect(productDetail).not.toBeNull();

      const info = await checkoutProduct(productDetail);
      const shippingMethod = info?.shipping_method;
      expect(shippingMethod).not.toBeNull();
      expect(shippingMethod?.min_processing_time_estimated_by_day).toEqual(conf.suiteConf.processing_time);
      expect(shippingMethod?.max_processing_time_estimated_by_day).toEqual(conf.suiteConf.processing_time);
    });

    await test.step(`Vào odoo > Thực hiện send quotation vừa request > Không notify to merchant `, async () => {
      await sendQuotation(sbcnProductId, ["standard"], conf.suiteConf.update_processing_time);
    });

    await test.step(`Quay lại trang checkout > F5 trang checkout > Verify processing time `, async () => {
      const { info } = await checkoutApi.getCheckoutInfo();
      const shippingMethod = info?.shipping_method;
      expect(shippingMethod).not.toBeNull();
      expect(shippingMethod?.min_processing_time_estimated_by_day).toEqual(conf.suiteConf.update_processing_time);
      expect(shippingMethod?.max_processing_time_estimated_by_day).toEqual(conf.suiteConf.update_processing_time);
    });
  });

  test(`@SB_PLB_SUQ_116 Verify estimated delivery của product có SO đã send quotation nhưng chưa notify to merchant, product template chỉ config nhiều shipping method trong đó có Standard Shipping.`, async ({
    odoo,
    conf,
  }) => {
    await test.step(`Vào "Dropship products" > "AliExpress Products" > Click button "Add AliExpress product" > Nhập link Ali muốn request > Thực hiện request `, async () => {
      await requestAliProduct(odoo, conf, aliUrl);
      const productText = await plusbasePage.genLoc(plusbasePage.xpathProduct).first().innerText();
      expect(productText).toContain(aliUrl);
    });

    await test.step(`Vào SO detail product vừa request > Import to store > Checkout product vừa mới import to store > Verify estimated delivery của shipping method`, async () => {
      await importProductToStore();
      const productDetail = await getProductDetail();
      const info = await checkoutProduct(productDetail);
      const shippingMethod = info?.shipping_method;
      expect(shippingMethod).not.toBeNull();
      expect(shippingMethod?.min_only_shipping_time_estimated_by_day).toEqual(conf.suiteConf.min_shipping_time);
      expect(shippingMethod?.max_only_shipping_time_estimated_by_day).toEqual(conf.suiteConf.max_shipping_time);
    });

    await test.step(`Vào odoo > Thực hiện send quotation vừa request > Không notify to merchant `, async () => {
      await sendQuotation(sbcnProductId, ["standard", "fast", "low"]);
    });

    await test.step(`Quay lại trang checkout > F5 trang checkout > Verify estimated delivery của shipping method `, async () => {
      await checkoutApi.selectDefaultShippingMethod(checkoutApi.defaultCustomerInfo.shippingAddress.country_code);
      const { info } = await checkoutApi.getCheckoutInfo();
      const shippingMethod = info?.shipping_method;
      expect(shippingMethod).not.toBeNull();

      const shippingTime = await getShippingTime(
        conf.suiteConf.shipping_types_name["standard"],
        shippingTypes["standard"],
      );

      expect(shippingMethod?.min_only_shipping_time_estimated_by_day).toEqual(shippingTime[0]);
      expect(shippingMethod?.max_only_shipping_time_estimated_by_day).toEqual(shippingTime[1]);
    });
  });

  test(`@SB_PLB_SUQ_117 Verify estimated delivery của product có SO đã send quotation nhưng chưa notify to merchant, product template chỉ config nhiều shipping method trong đó không có Standard Shipping.`, async ({
    odoo,
    conf,
  }) => {
    await test.step(`Vào "Dropship products" > "AliExpress Products" > Click button "Add AliExpress product" > Nhập link Ali muốn request > Thực hiện request `, async () => {
      await requestAliProduct(odoo, conf, aliUrl);
      const productText = await plusbasePage.genLoc(plusbasePage.xpathProduct).first().innerText();
      expect(productText).toContain(aliUrl);
    });

    await test.step(`Vào SO detail product vừa request > Import to store > Checkout product vừa mới import to store > Verify estimated delivery của shipping method`, async () => {
      await importProductToStore();
      const productDetail = await getProductDetail();
      const info = await checkoutProduct(productDetail);
      const shippingMethod = info?.shipping_method;
      expect(shippingMethod).not.toBeNull();
      expect(shippingMethod?.min_only_shipping_time_estimated_by_day).toEqual(conf.suiteConf.min_shipping_time);
      expect(shippingMethod?.max_only_shipping_time_estimated_by_day).toEqual(conf.suiteConf.max_shipping_time);
    });

    await test.step(`Vào odoo > Thực hiện send quotation vừa request > Không notify to merchant `, async () => {
      await sendQuotation(sbcnProductId, ["fast", "low"]);
    });

    await test.step(`Quay lại trang checkout > F5 trang checkout > Verify estimated delivery của shipping method `, async () => {
      await checkoutApi.selectDefaultShippingMethod(checkoutApi.defaultCustomerInfo.shippingAddress.country_code);
      const { info } = await checkoutApi.getCheckoutInfo();
      const shippingMethod = info?.shipping_method;
      expect(shippingMethod).not.toBeNull();
      const shippingTime = await getShippingTime(conf.suiteConf.shipping_types_name["low"], shippingTypes["low"]);

      expect(shippingMethod?.min_only_shipping_time_estimated_by_day).toEqual(shippingTime[0]);
      expect(shippingMethod?.max_only_shipping_time_estimated_by_day).toEqual(shippingTime[1]);
    });
  });

  test(`@SB_PLB_SUQ_118 Verify UI quotaion detail sau khi quotation được send nhưng chưa notify to merchant`, async ({
    odoo,
    conf,
  }) => {
    await test.step(`Vào Dropship Products > AliExpress products > Click button "Add AliExpress product" > Nhập link Ali request > Add link > Import AliExpress link`, async () => {
      await requestAliProduct(odoo, conf, aliUrl);
      const productText = await plusbasePage.genLoc(plusbasePage.xpathProduct).first().innerText();
      expect(productText).toContain(aliUrl);
    });

    await test.step(`Vào SO detail vừa request`, async () => {
      await plusbasePage.goToProductRequestDetail(sbcnProductId);
      const status = await plusbasePage.getBadgeStatusQuotationDetail();
      expect(status.trim()).toEqual("Available");
    });

    await test.step(`Vào odoo > Sale order > Search SO vừa tạo > Edit data SO > Click "Quotation sent" `, async () => {
      await sendQuotation(sbcnProductId, ["standard", "fast", "low"], conf.suiteConf.update_processing_time);
    });

    await test.step(`Reload lại page SO detail trong dashboard merchant > Verify UI`, async () => {
      await plusbasePage.page.reload();
      await plusbasePage.waitForQuotationDetailLoaded();

      await verifyQuotationDetailData(sbcnProductId, conf, false, {});
    });
  });

  test(`@SB_PLB_SUQ_120 Verify không hiển thị alert trong product detail khi variant của product bị archived`, async ({
    odoo,
    conf,
  }) => {
    await test.step(`Vào Dropship Products > AliExpress products > Click button "Add AliExpress product" > Nhập link Ali request > Add link > Import AliExpress link > Vào SO detail vừa request > Import to your store > Click button "Edit product"`, async () => {
      await requestAliProduct(odoo, conf, aliUrl);
      const productText = await plusbasePage.genLoc(plusbasePage.xpathProduct).first().innerText();
      expect(productText).toContain(aliUrl);
      await importProductToStore();
    });

    await test.step(`Vào tab odoo > Sale order > Products > Search product vừa request > Vào product template > Variants > Archived 1 variant đi > Reload lại product detail trong dashboad merchant `, async () => {
      await archiveFirstVariant(odoo, sbcnProductId);
      await productPage.goToProdDetailByID(productPage.domain, productID, ".product-info");
      expect(await productPage.hasArchivedVariantAlert()).toBeFalsy();
    });

    await test.step(`Sale order > Search SO vừa tạo > Edit data SO > Click "Quotation sent" `, async () => {
      await sendQuotation(sbcnProductId, ["standard", "fast", "low"], conf.suiteConf.update_processing_time);
    });

    await test.step(` Vào product template > Variants > Archived 1 variant đi > Reload lại SO detail trong dashboad merchant `, async () => {
      archiveFirstVariant(odoo, sbcnProductId);
      await productPage.goToProdDetailByID(productPage.domain, productID, ".product-info");
      expect(await productPage.hasArchivedVariantAlert()).toBeFalsy();
    });
  });

  ["SB_PLB_SUQ_123", "SB_PLB_SUQ_124"].forEach(caseId => {
    const conf = loadData(__dirname, caseId);
    test(`@${caseId} ${conf.caseConf.name}`, async ({ odoo, conf }) => {
      const isBaseOn: boolean = conf.caseConf.is_base_on;
      await test.step(`Vào Dropship Products > AliExpress products > Click button "Add AliExpress product" > Nhập link Ali request > Add link > Import AliExpress link`, async () => {
        await requestAliProduct(odoo, conf, aliUrl);
        const productText = await plusbasePage.genLoc(plusbasePage.xpathProduct).first().innerText();
        expect(productText).toContain(aliUrl);
      });

      await test.step(`Vào SO detail vừa request`, async () => {
        await plusbasePage.goToProductRequestDetail(sbcnProductId);
        const status = await plusbasePage.getBadgeStatusQuotationDetail();
        expect(status.trim()).toEqual("Available");

        const countryCode = checkoutApi.defaultCustomerInfo.shippingAddress.country_code;
        const productTemplate = await odooService.getProductTemplatesById(sbcnProductId, [
          "x_ali_processing_rate",
          "x_platform_shipping_fee",
        ]);
        const platformShippingFee = JSON.parse(productTemplate.x_platform_shipping_fee);

        const shippingFeeByCountry = platformShippingFee[countryCode] as {
          freight_amount: string;
        };

        const productProducts = await odooService.getProductVariantsByProductTemplateId(sbcnProductId, ["x_price"]);
        expect(productProducts.length).toBeGreaterThan(0);

        await plusbasePage.selectVariantByTitle([...conf.suiteConf.variant]);
        const productCostAct = await plusbasePage.getProductCostBeforeSentSO();

        expect(productProducts[0].x_price).toEqual(productCostAct);
        const processingRate = await plusbasePage.getProcessingRateSODetail();

        expect(processingRate).toEqual(`${productTemplate.x_ali_processing_rate}%`);
        const shippingFee = plusbasePage.calculatorShippingAliFee(parseFloat(shippingFeeByCountry.freight_amount));

        const shippingFeeAct = await plusbasePage.getShippingsInQuotationDetailPage();
        for await (const shippingAct of shippingFeeAct.shippings) {
          expect(shippingAct.shipping_time).toContain(shippingFee.toString());
        }
      });

      let quotation: SaleOrder;

      await test.step(`Vào odoo > Sale order > Search SO vừa tạo > Edit data SO > Click "Quotation sent" `, async () => {
        await sendQuotation(sbcnProductId, ["standard", "fast", "low"], conf.suiteConf.update_processing_time);

        const quotations = await odooService.getQuotationByProductId(sbcnProductId);
        expect(quotations.length).toBeGreaterThan(0);
        quotation = quotations[0];
        const quotationLines = await odooService.getSaleOrderLineBySaleOrderId(quotation.id);

        const productProducts = await odooService.getProductVariantsByProductTemplateId(sbcnProductId, []);
        if (isBaseOn) {
          await odoo.update("sale.order", quotation.id, {
            order_line: [[1, quotationLines[0].id, { price_unit: 12 }]],
            x_quote_based_on: isBaseOn,
          });
        } else {
          await odoo.update("sale.order", quotation.id, {
            order_line: [
              [1, quotationLines[0].id, { price_unit: 12 }],
              [
                0,
                false,
                {
                  price_unit: 12,
                  product_id: productProducts[0].id,
                  product_template_id: sbcnProductId,
                },
              ],
              [
                0,
                false,
                {
                  price_unit: 20,
                  product_id: productProducts[1].id,
                  product_template_id: sbcnProductId,
                },
              ],
              [
                0,
                false,
                {
                  price_unit: 20,
                  product_id: productProducts[2].id,
                  product_template_id: sbcnProductId,
                },
              ],
            ],
            x_quote_based_on: isBaseOn,
          });
        }
      });

      await test.step(`Reload lại page SO detail trong dashboard merchant > Check time line`, async () => {
        await plusbasePage.page.reload();
        await plusbasePage.page.waitForSelector(plusbasePage.xpathTimeline);
        expect(await plusbasePage.isVisibleTimelineMessage("Product cost has been updated.")).toBeFalsy();
      });

      await test.step(`Quay lại màn SO detail trên odoo > Click " Notify to merchant" > Verify SO detail trên dashboard merchant`, async () => {
        await odooService.notifyToMerchant(quotation.id);
        await plusbasePage.page.reload();
        await plusbasePage.page.waitForSelector(plusbasePage.xpathShippingRate);

        await verifyQuotationDetailData(sbcnProductId, conf, true, quotation);
      });

      await test.step(`Quay lại màn SO detail trên odoo > Update product cost từng sale order line > Verify time line SO detail trên dashboard merchant`, async () => {
        let saleOrderLines = await odooService.getSaleOrderLineBySaleOrderId(quotation.id);
        const saleOrderLinesUpdate = [];
        for await (const sol of saleOrderLines) {
          saleOrderLinesUpdate.push([1, sol.id, { price_unit: sol.price_unit + conf.suiteConf.adjust_price }]);
        }
        await odoo.update("sale.order", quotation.id, { order_line: saleOrderLinesUpdate });
        saleOrderLines = await odooService.getSaleOrderLineBySaleOrderId(quotation.id);
        const productIds = [];
        for await (const sol of saleOrderLines) {
          if (sol.product_id.length > 0) {
            productIds.push(sol.product_id[0]);
          }
        }
        const productProducts = (await odoo.read("product.product", productIds, [
          "product_template_attribute_value_ids",
        ])) as Array<OdooProductProduct>;
        expect(productProducts.length).toBeGreaterThan(0);
        const productTemplateAttributeValues = (await odoo.read(
          "product.template.attribute.value",
          uniq(
            productProducts.reduce((rs, pp) => {
              return [...rs, ...pp.product_template_attribute_value_ids];
            }, []) as Array<number>,
          ),
          ["name", "attribute_id"],
        )) as Array<{ id: number; name: string }>;

        for await (const sol of saleOrderLines) {
          let message = "";
          const productProduct = productProducts.find(pp => pp.id === sol.product_id[0]);
          for (const ptav of productProduct.product_template_attribute_value_ids) {
            const productTemplateAttributeValue = productTemplateAttributeValues.find(ptav1 => ptav1.id === ptav);
            if (!message) {
              message += `${productTemplateAttributeValue.name}`;
            } else {
              message += `/${productTemplateAttributeValue.name}`;
            }
          }
          if (isBaseOn) {
            message = `Product cost has been updated from $${roundingDecimal(
              sol.price_unit - conf.suiteConf.adjust_price,
              2,
            )} to $${roundingDecimal(sol.price_unit, 2)}`;
          } else {
            message = `${message} updated from $${roundingDecimal(
              sol.price_unit - conf.suiteConf.adjust_price,
              2,
            )} to $${roundingDecimal(sol.price_unit, 2)}`;
          }

          await expect(async () => {
            await plusbasePage.page.reload();
            await plusbasePage.page.waitForSelector(plusbasePage.xpathTimeline);
            expect(await plusbasePage.isVisibleTimelineMessage("Product cost has been updated")).toBeTruthy();
            await plusbasePage.getTimelineMessageExpandLocator("Product cost has been updated").first().click();
            await expect(plusbasePage.getTimelineMessageLocator(message)).toBeVisible();
          }).toPass();
          if (isBaseOn) break;
        }
      });
    });
  });
});
