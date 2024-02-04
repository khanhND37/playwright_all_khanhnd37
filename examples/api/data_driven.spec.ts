import { AccessTokenHeaderName, DefaultUserAgent, UserAgentHeaderName } from "@core/constant";
import type { TestApiCase } from "@types";
import { expect, test } from "@core/fixtures";
import dataDriven from "./data_driven.json";

test.describe("Test Data driven test with API @TS_DATA_DRIVEN_API", () => {
  let accessToken = "";

  test.beforeAll(async ({ token, conf }) => {
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
  });

  dataDriven.cases.TC_API_ADMIN_DATA_DRIVEN.data.forEach(testApiCase => {
    test(`Test data driven ${testApiCase.key} @TC_API_ADMIN_DATA_DRIVEN`, async ({ api, context }) => {
      await context.setExtraHTTPHeaders({
        [AccessTokenHeaderName]: accessToken,
        [UserAgentHeaderName]: DefaultUserAgent,
      });
      const response = await api.request(testApiCase as TestApiCase, {
        context: context.request,
      });
      expect(response.status).toEqual(testApiCase.response.status);
      switch (testApiCase.key) {
        case "update_page":
          await test.step("Verify update page", async () => {
            expect(response.data).toMatchObject(testApiCase.response.data);
          });
          break;
        case "get_page":
          await test.step("Verify get page", async () => {
            expect(response.data).toMatchObject(testApiCase.response.data);
          });
          break;
      }
    });
  });
});
