import { test, expect } from "@core/fixtures";
import { loadData } from "@core/conf/conf";

test.describe("Verify page by api", async () => {
  test("Verify add new page @SB_DP_DB_PAGE_1", async ({ api }) => {
    const caseName = "SB_DP_DB_PAGE_1";
    const data = loadData(__dirname, caseName);
    for (const dataAPI of data.caseConf.data) {
      const response = await api.request(dataAPI, { autoAuth: true });
      expect(response.status).toEqual(dataAPI.response.status);
      if (response.ok) {
        expect(response.data["page"].title).toEqual(dataAPI.response.data.page.title);
      } else {
        expect(response.data["error"]).toEqual(dataAPI.response.message);
      }
    }
  });

  test("Verify edit page @SB_DP_DB_PAGE_2", async ({ api }) => {
    const caseName = "SB_DP_DB_PAGE_2";
    const data = loadData(__dirname, caseName);
    for (const dataAPI of data.caseConf.data) {
      const response = await api.request(dataAPI, { autoAuth: true });
      expect(response.status).toEqual(dataAPI.response.status);
      if (response.ok) {
        expect(response.data).toMatchObject(dataAPI.response.data);
      } else {
        expect(response.data["error"]).toEqual(dataAPI.response.message);
      }
    }
  });
});
