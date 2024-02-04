import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { DefaultGetProductAPIParam } from "@constants/shopbase_creator/product/param";
import type { CreateProductBody, CreateProductResponse } from "@types";

test.describe("Kiểm tra delete product with API", () => {
  let productAPI: ProductAPI;
  let productRequest: CreateProductBody;
  let productDelete: CreateProductResponse;

  test.beforeAll(async ({ conf, authRequest }) => {
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
  });

  const caseDataList = loadData(__dirname, "DATA_DELETE_PRODUCT");
  for (const caseDataItem of caseDataList.caseConf.data) {
    const productInfoRequest = caseDataItem.product_info;
    const expectDeleteResponse = caseDataItem.delete_reponse;
    test(`${caseDataItem.description} @${caseDataItem.case_id}`, async () => {
      const productResponse = await productAPI.createProduct(productInfoRequest);
      const productId = [productResponse.data.product.id];
      expect(await productAPI.deleteProduct(productId)).toEqual(expectDeleteResponse);
    });
  }

  test("Kiểm tra delete product có ID không tồn tại @SB_SC_SCP_249", async ({ conf }) => {
    productDelete = conf.caseConf.delete_reponse;
    await test.step(`Kiểm tra delete product có ID không tồn tại`, async () => {
      const productId = [conf.caseConf.productId];
      expect(await productAPI.deleteProduct(productId)).toEqual(productDelete);
    });
  });

  test("Kiểm tra delete product đã xóa trước đó @SB_SC_SCP_250", async ({ conf }) => {
    productRequest = conf.caseConf.product_info;
    productDelete = conf.caseConf.delete_reponse;
    await test.step(`Kiểm tra delete product đã xóa trước đó`, async () => {
      const productResponse = await productAPI.createProduct(productRequest);
      const productId = [productResponse.data.product.id];
      //Thực hiện delete 1 product 2 lần
      await productAPI.deleteProduct(productId);
      expect(await productAPI.deleteProduct(productId)).toEqual(productDelete);
    });
  });

  test("Kiểm tra delete_multiple_product @SB_SC_SCP_251", async ({ conf }) => {
    const productDataList = conf.caseConf.products;
    productDelete = conf.caseConf.delete_reponse;
    await test.step(`Kiểm tra delete_multiple_product`, async () => {
      //create multiple product
      for (let i = 0; i < productDataList.length; i++) {
        expect(await productAPI.createProduct(productDataList[i])).toBeTruthy();
      }
      const products = await productAPI.getProducts(DefaultGetProductAPIParam);
      const productIds = products.data.map(item => item.id);
      await productAPI.deleteProduct(productIds);
      expect(await productAPI.deleteProduct(productIds)).toEqual(productDelete);
    });
  });
});
