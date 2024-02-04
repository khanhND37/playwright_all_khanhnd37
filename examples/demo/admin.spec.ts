import { test } from "@core/fixtures";

/**
 * Hãy tìm các điểm chưa tốt của demo tests này
 */
test.describe("Test basic admin request @TS_DEMO_01", async () => {
  test("Test single request @TC_DEMO_01", async ({ token, conf, page }) => {
    const shopToken = await token.getWithCredentials({
      domain: conf.caseConf.x,
      username: conf.caseConf.y,
      password: conf.caseConf.z,
    });

    await page.goto(`https://${conf.caseConf.domain}/admin?x_key=${shopToken.access_token}`);
    await page.waitForLoadState("networkidle");
    // await page.pause();
  });

  test("visit dashboard @TC_DEMO_02", async ({ dashboard, conf }) => {
    dashboard.goto(`${conf.caseConf.path}`);
    // await dashboard.pause();
  });
});
