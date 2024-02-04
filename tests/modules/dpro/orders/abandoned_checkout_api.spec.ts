import { orderAPI } from "@pages/api/dpro/order";
import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";

test.describe("Verify abandoned checkout list, checkout detail api", () => {
  let orderPage: orderAPI;

  test.beforeAll(async ({ conf, authRequest }) => {
    orderPage = new orderAPI(conf.suiteConf.domain, authRequest);
  });

  test("[API]Kiểm tra get all abandoned checkout list @SB_SC_SCO_52", async ({ conf }) => {
    await test.step(`Call api get all abandoned checkout list`, async () => {
      const response = await orderPage.getAbandonedCheckoutList(conf.caseConf.filter);
      const listAbandonedCheckout = Object.keys(response).length;
      expect(listAbandonedCheckout).toEqual(await orderPage.countAbandonedCheckout(conf.caseConf.filter));
    });
  });

  const conf = loadData(__dirname, "LIST_DATA_FILTER_ABANDONED_CHECKOUT");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_name}`, async () => {
      for (let i = 0; i < caseData.checkout_list.length; i++) {
        await test.step(`${caseData.checkout_list[i].step}`, async () => {
          const response = await orderPage.getAbandonedCheckoutList(caseData.checkout_list[i].filter);
          const listAbandonedCheckout = Object.keys(response).length;
          const countAbandonedCheckout = await orderPage.countAbandonedCheckout(caseData.checkout_list[i].filter);
          expect(listAbandonedCheckout).toEqual(countAbandonedCheckout);
        });
      }
    });
  }

  test("[API] Kiểm tra Get abandoned checkout detail @SB_SC_SCO_58", async ({ conf }) => {
    const response = await orderPage.getAbandonedCheckoutList(conf.caseConf.filter);
    const checkoutId = response[0].id;

    await test.step(`Call api get Abandoned checkout dettail, customer`, async () => {
      expect(await orderPage.getCheckoutInfo(checkoutId)).toEqual(
        expect.objectContaining({
          checkout_id: checkoutId,
          total_price: response[0].total_price,
        }),
      );
      expect(await orderPage.getCustomerCheckoutDetail(checkoutId)).toEqual(
        expect.objectContaining({
          email: response[0].email,
          note: response[0].note,
        }),
      );
    });
  });
});
