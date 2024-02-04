import { expect, test } from "@core/fixtures";
import { ProductDetailAPI } from "@pages/api/dpro/product_detail";
import { loadData } from "@core/conf/conf";

test.describe("Kiểm tra update thông tin của product detail bằng API", () => {
  let productDetailAPI;
  let productInfo;
  let sectionInfo;
  let productUpdate;

  const dataUpdateParam = loadData(__dirname, "UPDATE_PRODUCT_WITH_VALID_PARAM");
  for (let i = 0; i < dataUpdateParam.caseConf.data.length; i++) {
    const dataProduct = dataUpdateParam.caseConf.data[i];
    test(`${dataProduct.description} @${dataProduct.case_id}`, async ({ conf, authRequest }) => {
      productInfo = dataProduct.product;
      productDetailAPI = new ProductDetailAPI(conf.suiteConf.domain, authRequest);
      const productId = await productDetailAPI.getProductId(productInfo);
      sectionInfo = dataProduct.section_info;
      sectionInfo.product_id = productId;
      productUpdate = dataProduct.product_update;
      expect(await productDetailAPI.createSection(sectionInfo)).toEqual(sectionInfo);
      expect(await productDetailAPI.updateProduct(productId, productUpdate)).toEqual(productUpdate);
      expect(await productDetailAPI.getProductDetailInfo(productId, productUpdate)).toEqual(productUpdate);
    });
  }

  test("Check gọi api với coaching session có tất cả param hợp lệ @SB_SC_SCP_225", async () => {
    const productId = await productDetailAPI.getProductId(productInfo);
    await productDetailAPI.createSection(productId, sectionInfo);
    expect(await productDetailAPI.updateProduct(productId, productUpdate)).toEqual(productUpdate);
    expect(await productDetailAPI.getProductDetailInfo(productId, productUpdate)).toEqual(productUpdate);
  });

  const dataUpdateStatus = loadData(__dirname, "UPDATE_PRODUCT_STATUS");
  for (let i = 0; i < dataUpdateStatus.caseConf.data.length; i++) {
    const dataProduct = dataUpdateStatus.caseConf.data[i];
    test(`${dataProduct.description} @${dataProduct.case_id}`, async () => {
      const productId = await productDetailAPI.getProductId(productInfo);
      expect(await productDetailAPI.updateProduct(productId, productUpdate)).toEqual(productUpdate);
      expect(await productDetailAPI.getProductDetailInfo(productId, productUpdate)).toEqual(productUpdate);
    });
  }

  const dataUpdatePricing = loadData(__dirname, "UPDATE_PRODUCT_PRICING");
  for (let i = 0; i < dataUpdatePricing.caseConf.data.length; i++) {
    const dataProduct = dataUpdatePricing.caseConf.data[i];
    productInfo = dataProduct.product;
    test(`${dataProduct.description} @${dataProduct.case_id}`, async ({ conf, authRequest }) => {
      const productId = await productDetailAPI.getProductId(productInfo);
      productDetailAPI = new ProductDetailAPI(conf.suiteConf.domain, authRequest);
      productUpdate = dataProduct.product_update;
      const variandId = await productDetailAPI.getVariantID(productId);
      const refId = await productDetailAPI.getRefIDPricing(productId);
      productUpdate.variant_offers[0].variant_id = variandId;
      productUpdate.variant_offers[0].id = refId;
      expect(await productDetailAPI.updateProduct(productId, productUpdate)).toEqual(productUpdate);
      expect(await productDetailAPI.getProductDetailInfo(productId, productUpdate)).toEqual(productUpdate);
    });
  }
});
