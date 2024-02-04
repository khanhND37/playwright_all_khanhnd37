import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { ProductDetailAPI } from "@pages/api/dpro/product_detail";

test.describe("Kiểm tra các api thêm mới, update, delete upsell bằng API", () => {
  let productDetailAPI;
  let bodyRequest;
  let updateRequest;

  test.beforeEach(async ({ conf, authRequest }) => {
    productDetailAPI = new ProductDetailAPI(conf.suiteConf.domain, authRequest);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    bodyRequest = caseData.offers;
    test(`${caseData.description} @${caseData.id} (${i + 1})`, async () => {
      await test.step(`${caseData.description}`, async () => {
        expect(await productDetailAPI.createUpsellAPI(bodyRequest)).toBeTruthy();
      });
    });
  }

  const confApiUpdate = loadData(__dirname, "DATA_DRIVEN_1");
  for (let i = 0; i < confApiUpdate.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    bodyRequest = caseData.offers;
    updateRequest = caseData.offers_update;
    test(`${caseData.description} @${caseData.id}`, async ({ conf }) => {
      await test.step(`${caseData.description}`, async () => {
        await productDetailAPI.createUpsellAPI(bodyRequest);
        const offerId = await productDetailAPI.getOfferId(conf.suiteConf.shop_id, caseData.product_id);
        bodyRequest.id = offerId;
        expect(await productDetailAPI.updateUpsellAPI(updateRequest)).toBeTruthy();
      });
    });
  }

  test(`[API Delete] - Gửi request delete upsell đã tồn tại @SB_SC_SCP_138`, async ({ conf }) => {
    await test.step(`Gửi request delete upsell đã tồn tại
  PUT_http://{{shop_domain}/admin/offers/delete.json`, async () => {
      bodyRequest = conf.caseConf.offers;
      await productDetailAPI.createUpsellAPI(bodyRequest);
      const offerID = await productDetailAPI.getOfferId(conf.suiteConf.shop_id, conf.caseConf.product_id);
      expect(await productDetailAPI.deleteOffer(conf.suiteConf.shop_id, offerID)).toBeTruthy();
    });
  });

  test(`[API Delete] - Gửi request delete upsell với id không tồn tại @SB_SC_SCP_139`, async ({ conf }) => {
    await test.step(`Gửi request delete upsell với id không tồn tại
  PUT_http://{{shop_domain}/admin/offers/delete.json`, async () => {
      const offerID = conf.caseConf.offer_id;
      expect(await productDetailAPI.deleteOffer(conf.suiteConf.shop_id, offerID)).toEqual(400);
    });
  });
});
