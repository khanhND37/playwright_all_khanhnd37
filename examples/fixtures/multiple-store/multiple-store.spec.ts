/* eslint-disable playwright/no-skipped-test */
/* eslint-disable max-len */
import { test } from "@core/fixtures";
import { TcMultipleDashboard01 } from "./multiple-store";
import { DashboardPage } from "@pages/dashboard/dashboard";

test.describe.serial("Demo fixture multiple dashboard", async () => {
  test("@TC_MULTIPLE_DASHBOARD_01 Demo multiple dashboard", async ({ cConf, multipleStore }) => {
    const configData = cConf as TcMultipleDashboard01;

    let dashboardPage: DashboardPage;

    for (const shop of configData.shops) {
      const page = await multipleStore.getDashboardPage(
        shop.username,
        shop.password,
        shop.shop_domain,
        shop.shop_id,
        shop.user_id,
      );
      dashboardPage = new DashboardPage(page, shop.shop_domain);
      await dashboardPage.goto("/admin");
      // await dashboardPage.page.waitForTimeout(10 * 1000);

      const authRequest = await multipleStore.getAuthRequest(
        shop.username,
        shop.password,
        shop.shop_domain,
        shop.shop_id,
        shop.user_id,
      );
      const res = await authRequest.get(`https://${shop.shop_domain}/admin/shop.json`);

      const resText = await res.text();
      // eslint-disable-next-line no-console
      console.log(`Got response text: ${resText}`);
    }
  });
});
