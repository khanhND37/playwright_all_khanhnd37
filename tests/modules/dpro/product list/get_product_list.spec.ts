import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { DefaultGetProductAPIParam } from "@constants/shopbase_creator/product/param";
import { waitTimeout } from "@core/utils/api";

test.describe("Kiểm tra get product list with API", () => {
  let productAPI: ProductAPI;
  let productDataList;

  test.beforeEach(async ({ conf, authRequest }) => {
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);

    // Create product with api
    productDataList = conf.suiteConf.products;
    for (let i = 0; i < productDataList.length; i++) {
      expect(await productAPI.createProduct(productDataList[i])).toBeTruthy();
    }
  });

  test.afterEach(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
  });

  const dataFilterProduct = loadData(__dirname, "DATA_FILTER_PRODUCT");
  for (let i = 0; i < dataFilterProduct.caseConf.data.length; i++) {
    const dataFilter = dataFilterProduct.caseConf.data[i];
    const totalProduct = dataFilter.product_list.total_product;
    const productListInfo = dataFilter.product_list;
    test(`${dataFilter.description} @${dataFilter.case_id}`, async () => {
      //sau khi tạo mới product bằng api cần chờ để product sync sang ES
      await waitTimeout(2000);
      const numberProduct = await productAPI.getProductList(productListInfo);
      expect(numberProduct).toEqual(totalProduct);
    });
  }
});
