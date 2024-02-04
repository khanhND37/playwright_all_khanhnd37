import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { ProductDetailAPI } from "@pages/api/dpro/product_detail";
import { getTokenWithCredentials, TokenType } from "@utils/token";

test.describe("API get product detail on storefront", () => {
  let productDetailAPI;
  let accessToken;
  let username: string;
  let password: string;
  let baseURL: string;
  let domain: string;
  let userId: number;
  let tokenType;

  test.beforeEach(async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    productDetailAPI = new ProductDetailAPI(conf.suiteConf.domain, authRequest);
    domain = conf.suiteConf.domain;
    userId = conf.caseConf.user_id;
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`${caseData.description} @${caseData.id}`, async ({ conf }) => {
      if (caseData.token_type === "x-dp-customer-token") {
        username = conf.suiteConf.username_sf;
        password = conf.suiteConf.password_sf;
        baseURL = conf.suiteConf.url;
        tokenType = TokenType.CustomerToken;
      } else {
        username = conf.suiteConf.username;
        password = conf.suiteConf.password;
        baseURL = conf.suiteConf.api;
        tokenType = TokenType.ShopToken;
      }
      const shopToken = await getTokenWithCredentials(baseURL, {
        domain,
        username,
        password,
        userId,
        tokenType,
      });
      accessToken = shopToken.access_token;

      await test.step(`${caseData.description}
        GET_{{domain}}/api/digital-products/product/{{product_handle}}.json`, async () => {
        caseData.token = accessToken;
        expect(await productDetailAPI.getProductDetailSF(caseData.handle, caseData.token_type, caseData.token)).toEqual(
          caseData.product,
        );
      });
    });
  }
});
