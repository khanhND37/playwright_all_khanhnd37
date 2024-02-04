import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

test.describe("Kiểm tra get thông tin của product detail bằng API", () => {
  let productDetailAPI;
  let productInfo;
  let digitalInfo;

  test.beforeEach(async ({ conf, authRequest }) => {
    productDetailAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productInfo = conf.caseConf.product;
    digitalInfo = conf.caseConf.digital_info;
  });

  test("Get product detail của online course có status = 'Pushlish' @SB_SC_SCP_93", async ({ conf }) => {
    await test.step(`Get product detail của online course có status = 'Pushlish'`, async () => {
      const productId = await productDetailAPI.getProductId(productInfo);
      const lectureInfo = conf.caseConf.lecture_info;
      const sectionInfo = conf.caseConf.section_info;
      const productUpdate = conf.caseConf.product_update;
      const medias = conf.caseConf.medias;
      sectionInfo.product_id = productId;
      lectureInfo.product_id = productId;
      const sectionId = await productDetailAPI.getSectionIdAtCreateProduct(sectionInfo);
      await productDetailAPI.createLectureAtCreateProduct(sectionId, lectureInfo, medias);
      await productDetailAPI.updateProduct(productId, productUpdate);
      expect(await productDetailAPI.getProductDetailInfo(productId, digitalInfo)).toEqual(digitalInfo);
    });
  });

  test("Get product detail của online course có status = 'Unpushlish' @SB_SC_SCP_94", async ({ conf }) => {
    await test.step(`Get product detail của online course có status = 'Unpushlish'`, async () => {
      const productId = await productDetailAPI.getProductId(productInfo);
      const sectionInfo = conf.caseConf.section_info;
      sectionInfo.product_id = productId;
      const createSection = await productDetailAPI.createSection(sectionInfo);
      expect(createSection).toEqual(sectionInfo);
      expect(await productDetailAPI.getProductDetailInfo(productId, digitalInfo)).toEqual(digitalInfo);
    });
  });

  const caseData = loadData(__dirname, "DATA_GET_PRODUCT_PUSHLISH");
  for (const caseDataItem of caseData.caseConf.data) {
    const productInfo = caseDataItem.product;
    const digitalInfo = caseDataItem.digital_info;
    const productUpdate = caseDataItem.product_update;
    test(`${caseDataItem.description} @${caseDataItem.case_id}`, async () => {
      const productId = await productDetailAPI.getProductId(productInfo);
      await productDetailAPI.updateProduct(productId, productUpdate);
      expect(await productDetailAPI.getProductDetailInfo(productId, digitalInfo)).toEqual(digitalInfo);
    });
  }

  const caseDataGetProductNoSection = loadData(__dirname, "DATA_GET_PRODUCT_NO_SECTION");
  for (const caseDataItem of caseDataGetProductNoSection.caseConf.data) {
    const productInfo = caseDataItem.product;
    const digitalInfo = caseDataItem.digital_info;
    test(`${caseDataItem.description} @${caseDataItem.case_id}`, async () => {
      const productId = await productDetailAPI.getProductId(productInfo);
      expect(await productDetailAPI.getProductDetailInfo(productId, digitalInfo)).toEqual(digitalInfo);
    });
  }

  test("Get product detail của digital download có status = 'Pushlish' @SB_SC_SCP_97", async ({ conf }) => {
    await test.step(`Get product detail của digital download có status = 'Pushlish'`, async () => {
      const productId = await productDetailAPI.getProductId(productInfo);
      const sectionInfo = conf.caseConf.section_info;
      const productUpdate = conf.caseConf.product_update;
      for (const info of sectionInfo) {
        info.product_id = productId;
      }
      for (let i = 0; i < sectionInfo.length; i++) {
        await productDetailAPI.createSection(sectionInfo[i]);
      }
      await productDetailAPI.updateProduct(productId, productUpdate);
      expect(await productDetailAPI.getProductDetailInfo(productId, digitalInfo)).toEqual(digitalInfo);
    });
  });

  const caseDataGetProduct = loadData(__dirname, "DATA_GET_PRODUCT_UNPUSHLISH");
  for (const caseDataItem of caseDataGetProduct.caseConf.data) {
    const productInfo = caseDataItem.product;
    const digitalInfo = caseDataItem.digital_info;
    const sectionInfo = caseDataItem.section_info;
    test(`${caseDataItem.description} @${caseDataItem.case_id}`, async () => {
      const productId = await productDetailAPI.getProductId(productInfo);
      sectionInfo.product_id = productId;
      expect(await productDetailAPI.createSection(sectionInfo)).toEqual(sectionInfo);
      expect(await productDetailAPI.getProductDetailInfo(productId, digitalInfo)).toEqual(digitalInfo);
    });
  }

  test("Get product detail của coaching session có status = 'Pushlish' @SB_SC_SCP_101", async ({ conf }) => {
    await test.step(`Get product detail của coaching session có status = 'Pushlish'`, async () => {
      const productId = await productDetailAPI.getProductId(productInfo);
      const sectionInfo = conf.caseConf.section_info;
      const productUpdate = conf.caseConf.product_update;
      sectionInfo.product_id = productId;
      expect(await productDetailAPI.createSection(sectionInfo)).toEqual(sectionInfo);
      await productDetailAPI.updateProduct(productId, productUpdate);
      expect(await productDetailAPI.getProductDetailInfo(productId, digitalInfo)).toEqual(digitalInfo);
    });
  });

  test("Get product detail của coaching session có status = 'Unpushlish' @SB_SC_SCP_102", async ({ conf }) => {
    await test.step(`Get product detail của coaching session có status = 'Unpushlish'`, async () => {
      const productId = await productDetailAPI.getProductId(productInfo);
      const sectionInfo = conf.caseConf.section_info;
      await productDetailAPI.createSection(sectionInfo);
      expect(await productDetailAPI.getProductDetailInfo(productId, digitalInfo)).toEqual(digitalInfo);
    });
  });

  test("Delete product @SB_SC_SCP_105", async ({ conf }) => {
    await test.step(`Kiểm tra delete_multiple_product`, async () => {
      const productDelete = conf.caseConf.delete_reponse;
      const shopID = conf.caseConf.shop_id;
      const ids = [];
      for (let i = 0; i < productInfo.length; i++) {
        const productId = await productDetailAPI.getProductId(productInfo[i]);
        ids.push(productId);
      }
      const inputIds = ids.toString();
      expect(await productDetailAPI.deleteProduct(shopID, inputIds)).toEqual(productDelete);
    });
  });
});
