import { test, expect } from "@core/fixtures";

test("Test base api @TC_API_SINGLE", async ({ api, conf }) => {
  const response = await api.request(conf.caseConf.data);
  expect(response.status).toEqual(conf.caseConf.data.response.status);
});
