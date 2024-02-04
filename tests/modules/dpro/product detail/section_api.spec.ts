import { DefaultGetProductAPIParam } from "@constants/shopbase_creator/product/param";
import { expect, test } from "@core/fixtures";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import type { CreateProductBody, CreateProductResponse, SectionInfo } from "@types";

test.describe("Create new section with API", () => {
  let productAPI: ProductAPI;
  let productInfo: CreateProductBody;
  let chapterRequest: SectionInfo;
  let productId: number;
  let productResponse: CreateProductResponse;
  let updateInfo: SectionInfo;
  let message: string;

  test.beforeEach(async ({ conf, authRequest }) => {
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productInfo = conf.caseConf.product_request;
    chapterRequest = conf.caseConf.request_chapter;
    productResponse = await productAPI.createProduct(productInfo);
    productId = productResponse.data.product.id;
    updateInfo = conf.caseConf.section_update;
    message = conf.caseConf.message_update;
  });

  test.afterEach(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
  });

  test("Tạo mới section cho product online course @SB_SC_SCP_90", async () => {
    await test.step(`Tạo mới section cho product online course`, async () => {
      chapterRequest.product_id = productId;
      const chapterResponse = await productAPI.createChapter(chapterRequest);
      expect(chapterRequest).toEqual(
        expect.objectContaining({
          title: chapterResponse.title,
          description: chapterResponse.description,
          status: chapterResponse.status,
          product_id: productId,
          position: chapterResponse.position,
        }),
      );
    });
  });

  test("Tạo mới section cho product digital download @SB_SC_SCP_89", async () => {
    await test.step(`Tạo mới section cho product digital download`, async () => {
      chapterRequest.product_id = productId;
      const chapterResponse = await productAPI.createChapter(chapterRequest);
      expect(chapterRequest).toEqual(
        expect.objectContaining({
          title: chapterResponse.title,
          description: chapterResponse.description,
          status: chapterResponse.status,
          product_id: productId,
          position: chapterResponse.position,
        }),
      );
    });
  });

  test("Tạo mới section cho product coaching course @SB_SC_SCP_88", async () => {
    await test.step(`Tạo mới section cho product coaching course`, async () => {
      chapterRequest.product_id = productId;
      const chapterResponse = await productAPI.createChapter(chapterRequest);
      expect(chapterRequest).toEqual(
        expect.objectContaining({
          title: chapterResponse.title,
          description: chapterResponse.description,
          status: chapterResponse.status,
          product_id: productId,
          position: chapterResponse.position,
        }),
      );
    });
  });

  test("Tạo mới nhiều section cho product đã tồn tại @SB_SC_SCP_87", async ({ conf }) => {
    await test.step(`Tạo mới nhiều section cho product đã tồn tại`, async () => {
      const chaptersRequest = conf.caseConf.request_chapter;
      for (const info of chaptersRequest) {
        info.product_id = productId;
      }
      for (let i = 0; i < chaptersRequest.length; i++) {
        const chapterResponse = await productAPI.createChapter(chaptersRequest[i]);
        expect(chaptersRequest[i]).toEqual(
          expect.objectContaining({
            title: chapterResponse.title,
            description: chapterResponse.description,
            status: chapterResponse.status,
            product_id: productId,
            position: chapterResponse.position,
          }),
        );
      }
    });
  });

  test("Check gọi API tạo mới section không có trường shop_id @SB_SC_SCP_85", async () => {
    await test.step(`Check gọi API tạo mới section không có trường shop_id`, async () => {
      chapterRequest.product_id = productId;
      const chapterResponse = await productAPI.createChapter(chapterRequest);
      expect(chapterRequest).toEqual(
        expect.objectContaining({
          title: chapterResponse.title,
          description: chapterResponse.description,
          status: chapterResponse.status,
          product_id: productId,
          position: chapterResponse.position,
        }),
      );
    });
  });

  test("Check gọi API update section cho product @SB_SC_SCP_84", async () => {
    await test.step(`Check gọi API update section cho product`, async () => {
      chapterRequest.product_id = productId;
      const chapterResponse = await productAPI.createChapter(chapterRequest);
      expect(chapterRequest).toEqual(
        expect.objectContaining({
          title: chapterResponse.title,
          description: chapterResponse.description,
          status: chapterResponse.status,
          product_id: productId,
          position: chapterResponse.position,
        }),
      );
      expect(await productAPI.updateChapter(updateInfo, chapterResponse.id)).toEqual(message);
    });
  });

  test("Check gọi API delete section cho product @SB_SC_SCP_83", async ({ conf }) => {
    const message = conf.caseConf.message;
    await test.step(`Check gọi API delete section cho product`, async () => {
      chapterRequest.product_id = productId;
      const chapterResponse = await productAPI.createChapter(chapterRequest);
      expect(chapterRequest).toEqual(
        expect.objectContaining({
          title: chapterResponse.title,
          description: chapterResponse.description,
          status: chapterResponse.status,
          product_id: productId,
          position: chapterResponse.position,
        }),
      );
      expect(await productAPI.deleteChapter(chapterResponse.id)).toEqual(message);
    });
  });
});
