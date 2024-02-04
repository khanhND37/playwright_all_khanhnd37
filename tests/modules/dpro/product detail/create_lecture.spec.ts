import { expect, test } from "@core/fixtures";
import { ProductDetailAPI } from "@pages/api/dpro/product_detail";
import { loadData } from "@core/conf/conf";

test.describe("Kiểm tra tạo mới lecture cho product with API", () => {
  let productDetailAPI;
  let productInfo;
  let sectionInfo;
  let lectureInfo;
  let productId;

  test.beforeEach(async ({ conf, authRequest }) => {
    productDetailAPI = new ProductDetailAPI(conf.suiteConf.domain, authRequest);
    productInfo = conf.caseConf.product;
    sectionInfo = conf.caseConf.section_info;
    lectureInfo = conf.caseConf.lecture_info;
    productId = await productDetailAPI.getProductId(productInfo);
  });

  test("Tạo mới lecture cho product online course không có media @SB_SC_SCP_221", async ({ conf }) => {
    await test.step(`Tạo mới lecture cho product online course không có media`, async () => {
      const lectureVerify = conf.caseConf.lecture_verify;
      sectionInfo.product_id = productId;
      lectureInfo.product_id = productId;
      const sectionId = await productDetailAPI.getSectionIdAtCreateProduct(sectionInfo);
      expect(await productDetailAPI.createLectureAtCreateProduct(sectionId, lectureInfo)).toEqual(lectureVerify);
    });
  });

  const caseData = loadData(__dirname, "DATA_CREATE_LECTURE_MEDIAS");
  for (const caseDataItem of caseData.caseConf.data) {
    const sectionInfo = caseDataItem.section_info;
    const lectureInfo = caseDataItem.lecture_info;
    const medias = caseDataItem.medias;
    test(`${caseDataItem.description} @${caseDataItem.case_id}`, async () => {
      const lectureVerify = caseDataItem.lecture_verify;
      for (const media of medias) {
        media.product_id = productId;
      }
      sectionInfo.product_id = productId;
      const sectionId = await productDetailAPI.getSectionIdAtCreateProduct(sectionInfo);
      expect(await productDetailAPI.createLectureAtCreateProduct(sectionId, lectureInfo, medias)).toEqual(
        lectureVerify,
      );
    });
  }

  test("Tạo mới nhiều lecture cho product @SB_SC_SCP_217", async ({ conf }) => {
    await test.step(`Tạo mới nhiều lecture cho product`, async () => {
      const lectureVerify = conf.caseConf.lecture_verify;
      for (const lecture of lectureInfo) {
        lecture.product_id = productId;
      }
      sectionInfo.product_id = productId;
      const sectionId = await productDetailAPI.getSectionIdAtCreateProduct(sectionInfo);
      for (let i = 0; i < lectureInfo.length; i++) {
        const expectLecture = await productDetailAPI.createLectureAtCreateProduct(sectionId, lectureInfo[i]);
        expect(expectLecture).toEqual(lectureVerify[i]);
      }
    });
  });

  test("Check gọi API update lecture cho product @SB_SC_SCP_215", async ({ conf }) => {
    await test.step(`Check gọi API update lecture cho product`, async () => {
      const updateInfo = conf.caseConf.lecture_update;
      const message = conf.caseConf.update_message.message;
      const medias = conf.caseConf.medias;
      sectionInfo.product_id = productId;
      lectureInfo.product_id = productId;
      const sectionId = await productDetailAPI.getSectionIdAtCreateProduct(sectionInfo);
      const lectureId = await productDetailAPI.getLectureIdAtCreateProduct(sectionId, lectureInfo, medias);
      expect(await productDetailAPI.updateLectureAtCreateProduct(sectionId, lectureId, updateInfo)).toEqual(message);
    });
  });

  test("Check gọi API delete lecture cho product @SB_SC_SCP_214", async ({ conf }) => {
    await test.step(`Check gọi API delete lecture cho product`, async () => {
      const message = conf.caseConf.update_message.message;
      const medias = conf.caseConf.medias;
      sectionInfo.product_id = productId;
      const sectionId = await productDetailAPI.getSectionIdAtCreateProduct(sectionInfo);
      const lectureId = await productDetailAPI.getLectureIdAtCreateProduct(sectionId, lectureInfo, medias);
      expect(await productDetailAPI.deleteLectureAtCreateProduct(sectionId, lectureId)).toEqual(message);
    });
  });
});
