import { expect, test } from "@core/fixtures";

type GlobalMarket = {
  id: number;
  name: string;
  shop_id: number;
  currency: string;
  exchange_rate: number;
  rounding: number;
  price_adjustment: number;
  is_active: boolean;
};

type GlobalMarketResponse = {
  success: boolean;
  result: GlobalMarket;
};

test.describe("global market", () => {
  // chạy tuần tự các test từ trên xuống
  test.describe.configure({ mode: "serial" });

  let globalMarketId = 0;
  test("create a new global market with country = Canada @TC_CREATE_GLOBAL_MARKET_01", async ({
    api,
    conf,
  }) => {
    const response = await api.request(conf.caseConf.data, { autoAuth: true });
    globalMarketId = (response.data as GlobalMarketResponse).result.id;
    expect(response.status).toEqual(conf.caseConf.data.response.status);
  });

  test("update global market for Canada @TC_UPDATE_GLOBAL_MARKET_01", async ({
    api,
    conf,
  }) => {
    const response = await api.request(
      {
        ...conf.caseConf.data,
        url: conf.caseConf.data.url.replace("{id}", globalMarketId),
      },
      { autoAuth: true }
    );
    expect(response.status).toEqual(conf.caseConf.data.response.status);
  });
});
