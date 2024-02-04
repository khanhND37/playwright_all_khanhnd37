import { test, expect } from "@core/fixtures";

test.describe("test Sample API request @TS_API_SINGLE", () => {
  test("Test base api @TC_API_SINGLE_01", async ({ api, conf }) => {
    const response = await api.request(conf.caseConf.data);
    expect(response.status).toEqual(conf.caseConf.data.response.status);
  });
});
