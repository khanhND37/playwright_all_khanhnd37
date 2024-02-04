import { expect, test } from "@core/fixtures";

test.describe("Test basic admin request @TS_API_ADMIN_SINGLE", async () => {
  test("Test single request @TC_API_ADMIN_SINGLE_01", async ({ api, conf }) => {
    const response = await api.request(conf.caseConf.data, { autoAuth: true });
    expect(response.status).toEqual(conf.caseConf.data.response.status);
  });
});
