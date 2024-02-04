import { expect, test } from "@core/fixtures";
test.describe("Test Multiple API @TS_MULTIPLE_API", () => {
  test("Test multiple request @TC_API_ADMIN_MULTIPLE", async ({ api, conf }) => {
    const [updatePage, getPage] = await api.all(conf.caseConf.data, {
      autoAuth: true,
    });
    expect(updatePage.status).toEqual(200);
    expect(getPage.data).toMatchObject({
      // eslint-disable-next-line camelcase
      page: { id: 85293409886, body_html: "<p>HaVu</p>" },
    });
  });
});
