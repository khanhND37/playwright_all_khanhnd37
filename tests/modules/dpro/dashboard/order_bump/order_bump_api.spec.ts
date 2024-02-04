import { DefaultGetProductAPIParam } from "@constants/shopbase_creator/product/param";
import { expect, test } from "@core/fixtures";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

test.describe("[API] - GET Gửi request get product detail trong order bump", () => {
  let productAPI: ProductAPI;
  let listProductIds = "";
  const productIds = [];
  const publishProductIds = [];
  const unpublishProductIds = [];
  const variantIds = [];

  test.beforeAll(async ({ conf, authRequest }) => {
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const productInfo = conf.caseConf.products;
    for (let i = 0; i < productInfo.length; i++) {
      //create product
      const dataProduct = await productAPI.createProduct(productInfo[i]);
      //get product id
      const productId = dataProduct.data.product.id;
      productIds.push(productId);
      if (productInfo[i].product.published === true) {
        const variantOffer = dataProduct.data.product.variant_offers[0].variant_id;
        variantIds.push(variantOffer);
        const productPublishedId = dataProduct.data.product.id;
        publishProductIds.push(productPublishedId);
      } else {
        const productUnpublishedId = dataProduct.data.product.id;
        unpublishProductIds.push(productUnpublishedId);
      }
    }
    listProductIds = productIds.join(",");
  });

  test.afterAll(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
  });

  test(`[API] Gửi request get product detail trong order bump @SB_DP_DPSF_CDP_OR_B_9`, async ({ conf }) => {
    for (let j = 0; j < conf.caseConf.data.length; j++) {
      const caseData = conf.caseConf.data[j];
      await test.step(`${caseData.description}`, async () => {
        switch (caseData.type) {
          case "unpublished": {
            const response = await productAPI.getProductsOrderBump(unpublishProductIds[0]);
            expect(response).toEqual([]);
            break;
          }
          case "published": {
            const response = await productAPI.getProductsOrderBump(publishProductIds[0]);
            expect(response[0].variants[0].id).toEqual(variantIds[0]);
            expect(response[0].product_id).toEqual(publishProductIds[0]);
            break;
          }
          case "many_products": {
            const response = await productAPI.getProductsOrderBump(listProductIds);
            expect(response[0].variants[0].id).toEqual(variantIds[0]);
            expect(response[0].product_id).toEqual(publishProductIds[0]);
            break;
          }
        }
      });
    }
  });
});
