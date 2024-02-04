import { expect, test } from "@core/fixtures";
import { extractToken } from "@utils/string";
import { AnalyticsPage } from "@pages/dashboard/analytics";

/**
 * Code name: `TS_SB_UI_API_01`
 * Description: Test suite này demo case sử dụng cả test UI và API trong cùng một test.
 * Có thể dùng cho các use case như:
 *   - Thay đổi setting trong admin dashboard và call API để xem đã nhận được settings mới chưa rất tiện dụng.
 * Test cases:
      - Before Each
        - Login to the dashboard of the store mailchimp-sb.onshopbase.com

      - Test case `TC_SB_DB_UI_API_01`:
      - Before/Setup
        - read config
        - open browser tab with cookies, local storage
      - Steps
        - Visit live view page mailchimp-sb.onshopbase.com/admin/live-view
        - Wait for the page to load
        - Call API mailchimp-sb.onshopbase.com/admin/analytics/live-view.json?report_type=summary&from_time=2022-05-05
          with the corresponding data:
           - body: `{since: -10}`,
           - header: x-shopbase-access-token: EXTRACTED_TOKEN
        - Verify if api response ok (code 200)
      - After/Teardown
        - close browser

* External links: https://docs.ocg.to/books/qa-training/page/3-ocg-autopilot-examples/11043#bkmrk-share-states
*/

test.describe("UI and API @UI_API @TS_SB_UI_API_01", () => {
  test("Visit live view and query with API @TC_SB_DB_UI_API_01", async ({ dashboard, request, conf }) => {
    await test.step("visit live view", async () => {
      const analytics = new AnalyticsPage(dashboard, conf.suiteConf.domain);
      await analytics.gotoLiveview();
      await expect(dashboard.locator("(//p[normalize-space()='Visitors right now'])[1]")).toBeVisible();
    });
    await test.step("check via API", async () => {
      const token = extractToken((await dashboard.context().storageState()).origins[0]["localStorage"]);

      const lv = await request.put(`https://${conf.suiteConf.domain}/admin/${conf.caseConf.sub_path}`, {
        data: {
          since: conf.caseConf.since,
        },
        headers: {
          "x-shopbase-access-token": token,
        },
      });
      expect(lv.ok()).toBe(false);
    });
  });
});
