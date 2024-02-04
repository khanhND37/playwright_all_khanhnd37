import { orderAPI } from "@pages/api/dpro/order";
import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";

test.describe("Verify order list, order detail api", () => {
  let orderPage: orderAPI;

  test.beforeAll(async ({ conf, authRequest }) => {
    orderPage = new orderAPI(conf.suiteConf.domain, authRequest);
  });

  test("[API]Kiểm tra get all order list @SB_SC_SCO_23", async ({ conf }) => {
    const orderInfo = conf.caseConf.order_list;
    await test.step(`Call api get all order list`, async () => {
      expect(await orderPage.getOrderList(orderInfo.filter)).toEqual(await orderPage.countOrderList(orderInfo.filter));
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_name}`, async () => {
      for (let i = 0; i < caseData.order_list.length; i++) {
        await test.step(`${caseData.order_list[i].step}`, async () => {
          expect(await orderPage.getOrderList(caseData.order_list[i].filter)).toEqual(
            await orderPage.countOrderList(caseData.order_list[i].filter),
          );
        });
      }
    });
  }

  test("[API] Kiểm tra Get order detail @SB_SC_SCO_29", async ({ conf }) => {
    await test.step(`Call api get thông tin order detail`, async () => {
      const param = conf.caseConf.param;
      const response = await orderPage.getOrder(param.limit, param.page);
      const orderId = await response.orders[0].customer.last_order_id;
      const orderTotal = await response.orders[0].total_price;
      expect(await orderPage.getOrderInfo(orderId)).toEqual(
        expect.objectContaining({ order_id: orderId, subtotal: orderTotal }),
      );
    });
  });
});
