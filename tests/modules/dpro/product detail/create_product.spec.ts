import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

test.describe("Kiểm tra create product with API", () => {
  let productDetail: ProductAPI;
  let productInfo;
  test.beforeEach(async ({ conf, authRequest }) => {
    productDetail = new ProductAPI(conf.suiteConf.domain, authRequest);
  });

  const caseDataList = loadData(__dirname, "DATA_CREATE_PRODUCT");
  for (const caseDataItem of caseDataList.caseConf.data) {
    productInfo = caseDataItem.product_info;
    test(`${caseDataItem.description} @${caseDataItem.case_id}`, async () => {
      const responseProduct = (await productDetail.createProduct(productInfo)).data.product;
      expect(responseProduct.title).toEqual(productInfo.product.title);
      expect(responseProduct.product_type).toEqual(productInfo.product.product_type);
    });
  }
});
