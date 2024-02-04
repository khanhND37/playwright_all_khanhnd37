import { expect, test } from "@core/fixtures";
import { ProductListAPI } from "@pages/api/dpro/product_list";

test.describe("Kiểm tra get product list with API", () => {
  let productList;
  let productListInfo;

  test.beforeAll(async ({ conf, authRequest }) => {
    productList = new ProductListAPI(conf.suiteConf.domain, authRequest);
    productListInfo = conf.caseConf.product_list;
  });

  test("Kiểm tra get all product list @TC_SB_DP_API_LPSF_01", async () => {
    await test.step(`Kiểm tra get all product list`, async () => {
      const expectProduct = await productList.getProductListStoreFront(productListInfo, productListInfo.total_product);
      expect(expectProduct).toEqual(productListInfo.id_product);
    });
  });
  test("Get product list sort Newest @TC_SB_DP_API_LPSF_02", async () => {
    await test.step(`Kiểm tra get all product list`, async () => {
      const expectProduct = await productList.getProductListStoreFront(productListInfo, productListInfo.total_product);
      expect(expectProduct).toEqual(productListInfo.id_product);
    });
  });
  test("Get product list sort Oldest @TC_SB_DP_API_LPSF_03", async () => {
    await test.step(`Kiểm tra get all product list`, async () => {
      const expectProduct = await productList.getProductListStoreFront(productListInfo, productListInfo.total_product);
      expect(expectProduct).toEqual(productListInfo.id_product);
    });
  });
  test("Get product list sort A > Z @TC_SB_DP_API_LPSF_04", async () => {
    await test.step(`Kiểm tra get all product list`, async () => {
      const expectProduct = await productList.getProductListStoreFront(productListInfo, productListInfo.total_product);
      expect(expectProduct).toEqual(productListInfo.id_product);
    });
  });
  test("Get product list sort Z > A @TC_SB_DP_API_LPSF_05", async () => {
    await test.step(`Kiểm tra get all product list`, async () => {
      const expectProduct = await productList.getProductListStoreFront(productListInfo, productListInfo.total_product);
      expect(expectProduct).toEqual(productListInfo.id_product);
    });
  });
  test("Get product list sort Price, Low to high @TC_SB_DP_API_LPSF_06", async () => {
    await test.step(`Kiểm tra get all product list`, async () => {
      const expectProduct = await productList.getProductListStoreFront(productListInfo, productListInfo.total_product);
      expect(expectProduct).toEqual(productListInfo.id_product);
    });
  });
  test("Get product list sort Price, High to low @TC_SB_DP_API_LPSF_07", async () => {
    await test.step(`Kiểm tra get all product list`, async () => {
      const expectProduct = await productList.getProductListStoreFront(productListInfo, productListInfo.total_product);
      expect(expectProduct).toEqual(productListInfo.id_product);
    });
  });
});
