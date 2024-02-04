import { expect, test } from "@core/fixtures";
import { ProductDetailAPI } from "@pages/api/dpro/product_detail";
import { loadData } from "@core/conf/conf";
import { ProductListAPI } from "@pages/api/dpro/product_list";

test.describe("Kiểm tra delete product with API", async () => {
  let productDetail: ProductDetailAPI;
  let productList: ProductListAPI;

  test.beforeAll(async ({ conf, authRequest }) => {
    productDetail = new ProductDetailAPI(conf.suiteConf.domain, authRequest);
    productList = new ProductListAPI(conf.suiteConf.domain, authRequest);
  });

  const caseDataList = loadData(__dirname, "DATA_CREATE_PRICING");
  for (const caseDataItem of caseDataList.caseConf.data) {
    const productInfoRequest = caseDataItem.product_info;
    const pricingRequest = caseDataItem.pricing_request;
    test(`${caseDataItem.description} @${caseDataItem.case_id}`, async () => {
      const productId = await productDetail.getProductId(productInfoRequest);
      const responseCreatePricing = await productDetail.createOrUpdatePricingOption(productId, pricingRequest);
      expect(await productDetail.getMultiPricingOption(productId)).toEqual(responseCreatePricing);
    });
  }

  test(`[API] Gửi request tạo mới nhiều pricing option cho product digital download
   và coaching session bằng API Update list pricing option @SB_SC_SCP_154`, async ({ conf }) => {
    const productDigitalDownload = conf.caseConf.digital_download_info;
    const productCoachingSession = conf.caseConf.coaching_session_info;
    const pricingRequest = conf.caseConf.pricing_request;
    const responseCoaching = conf.caseConf.response_coaching_session;
    const responseDownload = conf.caseConf.response_digital_download;

    await test.step(`Gửi request tạo mới nhiều pricing option bằng API Update list pricing option
    PUT_{{shop_domain}}/admin/digital-products/product/
    {{product_digital_download_id}}/pricing-options.json`, async () => {
      const productId = await productDetail.getProductId(productDigitalDownload);
      expect(await productDetail.createOrUpdatePricingOption(productId, pricingRequest)).toEqual([
        400,
        responseDownload,
      ]);
    });
    await test.step(`Gửi request tạo mới nhiều pricing option bằng API Update list pricing option
    PUT_{{shop_domain}}/admin/digital-products/product/
    {{product_coaching_session_id}}/pricing-options.json`, async () => {
      const productId = await productDetail.getProductId(productCoachingSession);
      expect(await productDetail.createOrUpdatePricingOption(productId, pricingRequest)).toEqual([
        400,
        responseCoaching,
      ]);
    });
  });

  const caseDataUpdateList = loadData(__dirname, "DATA_UPDATE_PRICING");
  for (const caseDataItem of caseDataUpdateList.caseConf.data) {
    const productInfoRequest = caseDataItem.product_info;
    const updatePricingRequest = caseDataItem.update_pricing_request;
    const createPricingRequest = caseDataItem.create_pricing_request;

    test(`${caseDataItem.description} @${caseDataItem.case_id}`, async () => {
      const productId = await productDetail.getProductId(productInfoRequest);
      const responseCreatePricing = await productDetail.createOrUpdatePricingOption(productId, createPricingRequest);
      updatePricingRequest.pricing_options = updatePricingRequest.pricing_options.map(function (ele, index) {
        return {
          ...ele,
          id: responseCreatePricing.variant_offers[index].id,
          variant_id: responseCreatePricing.variant_offers[index].variant_id,
        };
      });
      const responseUpdatePricing = await productDetail.createOrUpdatePricingOption(productId, updatePricingRequest);
      expect(await productDetail.getMultiPricingOption(productId)).toEqual(responseUpdatePricing);
    });
  }

  const caseDataUpdateFieldList = loadData(__dirname, "DATA_UPDATE_COMPONENT");
  for (const caseDataItem of caseDataUpdateFieldList.caseConf.data) {
    const stepDataList = caseDataItem.step_data_list;
    test(`${caseDataItem.description} @${caseDataItem.case_id}`, async () => {
      for (const stepDataItem of stepDataList) {
        const productInfoRequest = stepDataItem.product_info;
        const updatePricingRequest = stepDataItem.update_pricing_request;
        await test.step(`${stepDataItem.step_description}`, async () => {
          const productId = await productDetail.getProductId(productInfoRequest);
          const responseGetPricing = await productDetail.getMultiPricingOption(productId);
          updatePricingRequest.pricing_options = updatePricingRequest.pricing_options.map(function (ele, index) {
            return {
              ...ele,
              id: responseGetPricing.variant_offers[index].id,
              variant_id: responseGetPricing.variant_offers[index].variant_id,
            };
          });
          const responseUpdatePricing = await productDetail.createOrUpdatePricingOption(
            productId,
            updatePricingRequest,
          );
          expect(await productDetail.getMultiPricingOption(productId)).toEqual(responseUpdatePricing);
        });
      }
    });
  }

  test(`[API] Gửi request get list pricing của product có 1 pricing option
  bằng API Get list pricing options @SB_SC_SCP_162`, async ({ conf }) => {
    const productInfoRequest = conf.caseConf.product_info;

    await test.step(`Gửi request get list pricing của product có 1 pricing option bằng API Get list pricing options
  GET_{{shop_domain}}/admin/digital-products/product/{{product_id}}/pricing-options.json`, async () => {
      const productId = await productDetail.getProductId(productInfoRequest);
      expect(await productDetail.getMultiPricingOption(productId)).toBeTruthy();
    });
  });

  test(`[API] Gửi request get list pricing của product có nhiều pricing option
  bằng API Get list pricing options @SB_SC_SCP_163`, async ({ conf }) => {
    const productInfoRequest = conf.caseConf.product_info;
    const pricingRequest = conf.caseConf.pricing_request;

    await test.step(`Gửi request get list pricing của product có nhiều pricing option bằng API Get list pricing options
  GET_{{shop_domain}}/admin/digital-products/product/{{product_id}}/pricing-options.json`, async () => {
      const productId = await productDetail.getProductId(productInfoRequest);
      const responseCreatePricing = await productDetail.createOrUpdatePricingOption(productId, pricingRequest);
      expect(await productDetail.getMultiPricingOption(productId)).toEqual(responseCreatePricing);
    });
  });

  test(`[API] Gửi request get pricing của product không tồn tại
  bằng API Get list pricing options @SB_SC_SCP_164`, async ({ conf }) => {
    const pricingResponse = conf.caseConf.pricing_response;
    const productId = conf.caseConf.product_id;

    await test.step(`Gửi request get pricing của product không tồn tại bằng API Get list pricing options
  GET_{{shop_domain}}/admin/digital-products/product/{{product_id}}/pricing-options.json`, async () => {
      expect(await productDetail.getMultiPricingOption(productId)).toEqual([400, pricingResponse]);
    });
  });

  test.afterAll(async () => {
    const productIdList = await productList.getProductIdList();
    await productList.deleteProduct(productIdList);
  });
});
